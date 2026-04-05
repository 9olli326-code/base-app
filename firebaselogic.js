import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, linkWithCredential, GoogleAuthProvider, signInWithPopup, linkWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, runTransaction, increment, getDocs, query, where, orderBy, limit, getDoc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- ⚙️ KONFIGURATION ---
const firebaseConfig = { 
    apiKey: "AIzaSyAW4KVFdyuj4xAvvU-Td-yx6KuSaFb3B4Y", 
    authDomain: "beastmode-17f0d.firebaseapp.com", 
    projectId: "beastmode-17f0d", 
    storageBucket: "beastmode-17f0d.firebasestorage.app", 
    messagingSenderId: "276195983881", 
    appId: "1:276195983881:web:99d55a5656e6ed7daa2ed8" 
};

// Initialisierung der Firebase-Dienste
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// WICHTIG: Die App-ID für die Datenbank-Struktur
const appIdGlobal = "base-v2-beta-test";

// Firestore-Instanz und Hilfsfunktionen global verfügbar machen
window._fbDb = db;
window._fbAuth = auth;
window._fbCollection = collection;
window._fbDoc = doc;
window._fbSetDoc = setDoc;
window._fbGetDoc = getDoc;
window._fbGetDocs = getDocs;
window._fbQuery = query;
window._fbWhere = where;
window._fbOrderBy = orderBy;
window._fbLimit = limit;
window._fbUpdateDoc = updateDoc;
window._fbAddDoc = addDoc;
window._fbIncrement = increment;
window._fbDeleteDoc = deleteDoc;

console.log("BASE V2 FIREBASE MODULE - Aktiv ✅");

// --- 🧹 MIGRATIONS-FUNKTION (V1 ZU V2 STAUBSAUGER) ---
window.checkLegacyMigration = async function() {
    const v1Raw = localStorage.getItem('beastmode_cache');
    
    if (!v1Raw) {
        console.log("Migrations-Check: Keine V1-Altdaten auf dieser Domain gefunden. Alles sauber! ℹ️");
        return;
    }

    try {
        const oldData = JSON.parse(v1Raw);
        console.log("Gefundene V1-Daten:", oldData);

        // Wir machen aus den Daten ein Array, egal ob es ein einzelnes Objekt oder eine Liste ist
        const oldWorkouts = Array.isArray(oldData) ? oldData : (oldData ? [oldData] : []);
        
        if (oldWorkouts.length > 0) {
            console.log(`🚀 Starte Migration von ${oldWorkouts.length} Einträgen...`);
            
            const migrated = oldWorkouts.map(w => ({ 
                ...w, 
                id: w.id || "migrated_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                category: w.category || 'strength', 
                sportCategory: w.sportCategory || 'Krafttraining (V1 Import)', 
                archived: true 
            }));

            // In die globale Liste der App einfügen
            if(!Array.isArray(window.workouts)) window.workouts = [];
            window.workouts = [...migrated, ...window.workouts];
            
            // Lokalen V2 Cache sofort aktualisieren
            const key = window.currentClient === 'personal' ? 'beastmode_v2_cache' : `beastmode_v2_cache_${window.currentClient}`;
            localStorage.setItem(key, JSON.stringify(window.workouts));

            // Cloud Sync: Wir laden die Daten hoch
            let count = 0;
            for (const entry of migrated) {
                await window.syncToCloud(entry);
                count++;
            }

            // Erst löschen, wenn alles in die Cloud geschoben wurde
            localStorage.removeItem('beastmode_cache');
            
            // UI in der index.html aktualisieren
            if (typeof window.renderTable === 'function') window.renderTable();
            if (typeof window.showToast === 'function') window.showToast(`${count} Workouts aus V1 wiederhergestellt! ✅`);
            console.log(`✅ Migration abgeschlossen. ${count} Einträge gesichert.`);
        } else {
            console.log("Abbruch: V1-Speicher war leer. ℹ️");
            localStorage.removeItem('beastmode_cache'); // Leeren Platzhalter entfernen
        }
    } catch(e) { 
        console.error("❌ Kritischer Fehler bei Migration:", e); 
    }
};

// --- 📥 CLOUD-SYNC (REALTIME) ---
window.listenToWorkouts = function() {
    if (!auth.currentUser) return;
    
    const path = window.currentMode === 'personal' ? 
        `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/workouts` : 
        `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/clients/${window.currentClient}/workouts`;

    onSnapshot(collection(db, path), (snap) => {
        const cloudData = snap.docs.map(d => d.data());
        if (cloudData.length > 0) {
            window.workouts = cloudData.sort((a,b) => parseInt(b.id) - parseInt(a.id));
            const key = window.currentClient === 'personal' ? 'beastmode_v2_cache' : `beastmode_v2_cache_${window.currentClient}`;
            localStorage.setItem(key, JSON.stringify(window.workouts));
            if (typeof window.renderTable === 'function') window.renderTable();
            if (typeof window.calculateReadiness === 'function') window.calculateReadiness();
        }
    });
};

// --- 🔐 AUTH ACTIONS ---
window.handleAuthAction = async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    if (!email || !password) {
        if(typeof window.showToast === 'function') window.showToast("Bitte Felder ausfüllen!");
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
        if(typeof window.showToast === 'function') window.showToast("Account erfolgreich verknüpft! 🔐");
        window.toggleModal('authModal');
    } catch (e) {
        console.error(e);
        if(typeof window.showToast === 'function') window.showToast("Fehler: " + e.message);
    }
};

// --- 🤖 AUTO-LOGIN LISTENER ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Firebase Auth: Nutzer angemeldet (UID: " + user.uid + ")");

        // Neuen Nutzer im öffentlichen Stats-Counter zählen
        const statsRef = doc(db, "artifacts/base-v2-beta-test/public/stats");
        const userSeenKey = "base_user_counted_" + user.uid;
        if (!localStorage.getItem(userSeenKey)) {
            try {
                await runTransaction(db, async (transaction) => {
                    const statsDoc = await transaction.get(statsRef);
                    if (!statsDoc.exists()) {
                        transaction.set(statsRef, { userCount: 1 });
                    } else {
                        transaction.update(statsRef, { userCount: increment(1) });
                    }
                });
                localStorage.setItem(userSeenKey, '1');
            } catch(e) { console.log("Stats counter Fehler:", e); }
        }
        
        const status = document.getElementById('cloudStatus');
        if (status) {
            status.innerHTML = user.isAnonymous ? 
                `<i data-lucide="cloud-check" class="w-3 h-3"></i> Sync` : 
                `<i data-lucide="shield-check" class="w-3 h-3"></i> Account Aktiv`;
            status.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] uppercase font-black " + 
                (user.isAnonymous ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400");
        }
        
        window.listenToWorkouts();
        
        // Starte Migration nach 2 Sekunden Pufferzeit
        setTimeout(() => {
            window.checkLegacyMigration();
        }, 2000);

        if (window.lucide) window.lucide.createIcons();
    } else {
        try { await signInAnonymously(auth); } catch(e) { console.error("Guest-Login fehlgeschlagen", e); }
    }
});

// --- ☁️ CLOUD SCHREIB-OPERATIONEN ---
window.syncToCloud = async (entry) => {
    if (!auth.currentUser || !entry.id) return;
    const path = window.currentMode === 'personal' ? 
        `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/workouts` : 
        `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/clients/${window.currentClient}/workouts`;
    try { 
        await setDoc(doc(db, path, entry.id), entry); 
    } catch(e) { 
        console.error("Fehler Cloud-Sync", e); 
    }
};

window.removeFromCloud = async (id) => {
    if (!auth.currentUser || !id) return;
    const path = window.currentMode === 'personal' ? 
        `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/workouts` : 
        `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/clients/${window.currentClient}/workouts`;
    try { 
        await deleteDoc(doc(db, path, id)); 
    } catch(e) { 
        console.error("Fehler Cloud-Löschen", e); 
    }
};