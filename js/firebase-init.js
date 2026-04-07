  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
  import { getAuth, signInAnonymously, onAuthStateChanged, EmailAuthProvider, linkWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, browserLocalPersistence, setPersistence, GoogleAuthProvider, signInWithPopup, linkWithPopup, signInWithRedirect, linkWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
  import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, query, where, orderBy, limit, getDoc, updateDoc, addDoc, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

  const firebaseConfig = { apiKey: "AIzaSyAW4KVFdyuj4xAvvU-Td-yx6KuSaFb3B4Y", authDomain: "beastmode-17f0d.firebaseapp.com", projectId: "beastmode-17f0d", storageBucket: "beastmode-17f0d.firebasestorage.app", messagingSenderId: "276195983881", appId: "1:276195983881:web:99d55a5656e6ed7daa2ed8" };
  
  try {
   const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app);

   window._fbDb = db; window._fbAuth = auth;
   window._fbCollection = collection; window._fbDoc = doc; window._fbSetDoc = setDoc;
   window._fbGetDoc = getDoc; window._fbGetDocs = getDocs; window._fbQuery = query;
   window._fbWhere = where; window._fbOrderBy = orderBy; window._fbLimit = limit;
   window._fbUpdateDoc = updateDoc; window._fbAddDoc = addDoc; window._fbIncrement = increment;
   window._fbDeleteDoc = deleteDoc;

   window.googleSignIn = async function(onSuccess) {
    var provider = new GoogleAuthProvider();
    try {
     if (auth.currentUser && auth.currentUser.isAnonymous) {
      try {
       await linkWithPopup(auth.currentUser, provider);
      } catch(popupErr) {
       if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        await linkWithRedirect(auth.currentUser, provider);
        return; // Redirect — Seite wird neu geladen
       }
       if (popupErr.code === 'auth/credential-already-in-use') {
        await signInWithPopup(auth, provider);
       } else if (popupErr.code === 'auth/popup-closed-by-user') {
        return; // User hat abgebrochen
       } else {
        throw popupErr;
       }
      }
     } else {
      try {
       await signInWithPopup(auth, provider);
      } catch(popupErr) {
       if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider);
        return;
       }
       if (popupErr.code === 'auth/popup-closed-by-user') return;
       throw popupErr;
      }
     }
     if (typeof window.showToast === 'function') window.showToast(window.t('linkedWithGoogle', 'Mit Google verkn\u00fcpft') + ' \u2705', 'success', 3000);
     localStorage.removeItem('base_auth_skipped');
     ['anonRegisterBanner','authSkippedBanner','btnSecureAccount'].forEach(function(id) { var el = document.getElementById(id); if(el) el.classList.add('hidden'); });
     if (typeof window._updateMenuSecureSection === 'function') window._updateMenuSecureSection(auth.currentUser);
     if (typeof onSuccess === 'function') onSuccess();
    } catch(err) {
     console.error('Google Sign-In Error:', err.code, err.message);
     if (typeof window.showToast === 'function') window.showToast('Google Login: ' + (err.message || err.code || 'Fehler'), 'error', 5000);
    }
   };
   window.obGoogleSignIn = function() { window.googleSignIn(function() { window.obFinish(); }); };

   getRedirectResult(auth).then(function(result) {
    if (result && result.user) {
     if (typeof window.showToast === 'function') window.showToast(window.t('linkedWithGoogle', 'Mit Google verkn\u00fcpft') + ' \u2705', 'success', 3000);
     localStorage.removeItem('base_auth_skipped');
     ['anonRegisterBanner','authSkippedBanner','btnSecureAccount'].forEach(function(id) { var el = document.getElementById(id); if(el) el.classList.add('hidden'); });
    }
   }).catch(function(err) {
    if (err.code) console.warn('Redirect result error:', err.code);
   });

   window._updateMenuSecureSection = function(user) {
    var mss = document.getElementById('menuSecureSection');
    if (!mss) return;
    if (!user) { mss.innerHTML = ''; return; }
    if (user.isAnonymous) {
     mss.innerHTML =
      '<button onclick="window.googleSignIn()" class="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 cursor-pointer pointer-events-auto transition-all mb-2" style="background:#fff;color:#333">' +
       '<svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>' +
       '<span>' + window.t('obGoogleSign', 'Mit Google fortfahren') + '</span>' +
      '</button>' +
      '<button onclick="window.toggleModal(\'authModal\')" class="w-full flex items-center gap-4 bg-primary/5 hover:bg-primary/10 p-4 rounded-2xl text-indigo-400 font-black border border-indigo-500/20 cursor-pointer pointer-events-auto transition-all">' +
       '<div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0"><i data-lucide="shield-check" class="w-5 h-5 pointer-events-none"></i></div>' +
       '<div class="text-left"><p class="text-sm font-black">' + window.t('menuSecure', 'Daten sichern') + '</p><p class="text-[10px] font-bold uppercase tracking-widest opacity-70">' + window.t('lblLinkAccount', 'Account verkn\u00fcpfen') + '</p></div>' +
       '<i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600 ml-auto pointer-events-none"></i>' +
      '</button>';
    } else {
     var isGoogle = user.providerData && user.providerData.some(function(p) { return p.providerId === 'google.com'; });
     var label = isGoogle ? window.t('linkedWithGoogle', 'Mit Google verkn\u00fcpft') : window.t('accountActive', 'Account aktiv');
     var email = user.email || '';
     mss.innerHTML =
      '<button onclick="window._showAccountInfo()" class="w-full text-left p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 cursor-pointer pointer-events-auto hover:bg-emerald-500/10 transition-all">' +
       '<div class="flex items-center gap-4">' +
        '<div class="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0"><i data-lucide="check-circle" class="w-5 h-5 text-emerald-400 pointer-events-none"></i></div>' +
        '<div class="text-left flex-1"><p class="text-sm font-black text-emerald-400">' + window._escapeHtml(label) + '</p>' +
        (email ? '<p class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">' + window._escapeHtml(email) + '</p>' : '') +
        '</div>' +
        '<i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600 pointer-events-none"></i>' +
       '</div>' +
      '</button>';
    }
    if (typeof window._refreshLucide === 'function') window._refreshLucide();
   };

   window._showAccountInfo = function() {
    var user = auth.currentUser;
    if (!user) return;
    if (user.isAnonymous) { window.googleSignIn(); return; }
    var isGoogle = user.providerData && user.providerData.some(function(p) { return p.providerId === 'google.com'; });
    var provider = isGoogle ? 'Google' : 'E-Mail';
    var label = isGoogle ? window.t('linkedWithGoogle', 'Mit Google verkn\u00fcpft') : window.t('accountActive', 'Account aktiv');
    var container = document.createElement('div');
    container.className = 'fixed inset-0 bg-black/90 z-[800] flex items-center justify-center backdrop-blur-md px-6';
    container.onclick = function(e) { if (e.target === container) container.remove(); };
    container.innerHTML =
     '<div class="card-bg p-6 max-w-sm w-full text-center">' +
      '<div class="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style="background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2)">' +
       '<i data-lucide="user-check" class="w-8 h-8 text-emerald-400"></i>' +
      '</div>' +
      '<h3 class="text-lg font-bold text-white mb-1">' + window._escapeHtml(label) + '</h3>' +
      '<p class="text-sm text-zinc-400 mb-1">' + window._escapeHtml(user.email || '') + '</p>' +
      '<p class="text-xs text-zinc-600 mb-4">' + window.t('lblProvider', 'Anmeldung \u00fcber') + ': ' + provider + '</p>' +
      '<p class="text-[10px] text-zinc-700 mb-4">' + window.t('lblUid', 'User-ID') + ': ' + user.uid.slice(0, 12) + '...</p>' +
      '<button onclick="this.closest(\'.fixed\').remove()" class="w-full py-3 rounded-xl font-bold text-sm bg-zinc-800 text-white cursor-pointer pointer-events-auto hover:bg-zinc-700 transition-all">' + window.t('close', 'Schlie\u00dfen') + '</button>' +
     '</div>';
    document.body.appendChild(container);
    if (typeof window._refreshLucide === 'function') window._refreshLucide();
   };

   let _authMode = 'register';

   window.setAuthMode = function(mode) {
    _authMode = mode;
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const btn = document.getElementById('btnSubmitAuth');
    const switchLink = document.getElementById('authSwitchLink');
    const switchText = document.getElementById('authSwitchText');
    if(mode === 'login') {
     if(title) title.textContent = 'Einloggen';
     if(subtitle) subtitle.textContent = 'Willkommen zurück';
     if(btn) btn.textContent = 'Einloggen';
     if(switchText) switchText.textContent = 'Noch kein Account?';
     if(switchLink) switchLink.textContent = 'Jetzt registrieren';
    } else {
     if(title) title.textContent = 'Account Erstellen';
     if(subtitle) subtitle.textContent = 'Sichere deine Workouts für immer';
     if(btn) btn.textContent = 'Account Verknüpfen';
     if(switchText) switchText.textContent = 'Schon einen Account?';
     if(switchLink) switchLink.textContent = 'Einloggen';
    }
   };

   window.toggleAuthMode = function() {
    window.setAuthMode(_authMode === 'login' ? 'register' : 'login');
   };

   window.handleAuthAction = async () => {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) { window.showToast(window.t("toastError", "Bitte Felder ausfüllen!")); return; }
    const btn = document.getElementById('btnSubmitAuth');
    if(btn) { btn.disabled = true; btn.textContent = '⏳ Bitte warten...'; }

    try {
     if(_authMode === 'login') {
      await signInWithEmailAndPassword(auth, email, password);
      window.showToast(window.t("toastUpdate", "Erfolgreich eingeloggt! 🔐"));
      window.toggleModal('authModal');
      const secBtn = document.getElementById('btnSecureAccount');
      if(secBtn) secBtn.classList.add('hidden');
     } else {
      try {
       const credential = EmailAuthProvider.credential(email, password);
       await linkWithCredential(auth.currentUser, credential);
       window.showToast(window.t("toastUpdate", "Account erfolgreich erstellt! 🔐"));
       window.toggleModal('authModal');
       const secBtn = document.getElementById('btnSecureAccount');
       if(secBtn) secBtn.classList.add('hidden');
       try { await updateDoc(doc(db, 'artifacts', 'base-v2-beta-test', 'public', 'stats'), { userCount: increment(1) }); } catch(e) { console.log('Stats update skip:', e.message); }
      } catch(linkError) {
       if(linkError.code === 'auth/email-already-in-use' || linkError.code === 'auth/credential-already-in-use') {
        window.showToast(window.t("toastError", "E-Mail bereits registriert — bitte einloggen"));
        window.setAuthMode('login');
       } else {
        throw linkError;
       }
      }
     }
    } catch(e) {
     console.error(e);
     let msg = "Fehler beim Anmelden";
     if(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = "Falsches Passwort";
     else if(e.code === 'auth/user-not-found') msg = "Kein Account mit dieser E-Mail";
     else if(e.code === 'auth/invalid-email') msg = "Ungültige E-Mail Adresse";
     else if(e.code === 'auth/weak-password') msg = "Passwort zu kurz (min. 6 Zeichen)";
     else if(e.code === 'auth/too-many-requests') msg = "Zu viele Versuche — kurz warten";
     window.showToast("⚠️ " + msg);
    } finally {
     if(btn) { btn.disabled = false; window.setAuthMode(_authMode); }
    }
   };

   window.deleteAccount = async function() {
    if(!auth.currentUser) {
     window.showModal('Daten löschen?', 'Alle lokalen Daten löschen? Das kann nicht rückgängig gemacht werden.', true, () => {
      localStorage.clear();
      window.showToast(window.t('toastDeleted'));
      setTimeout(function() { window.location.reload(); }, 1000);
     });
     return;
    }
    window.showModal('Account löschen?', 'Account und alle Daten dauerhaft löschen? Das kann NICHT rückgängig gemacht werden!', true, () => {
    window.showModal('Bist du sicher?', 'Alle Workouts, Einstellungen und Daten werden unwiderruflich gelöscht.', true, async () => {
    try {
     if(window._db && window.firestoreLib) {
      var uid = auth.currentUser.uid;
      var { collection, getDocs, deleteDoc } = window.firestoreLib;
      var snap = await getDocs(collection(window._db, 'artifacts/base-v2-beta-test/users/' + uid + '/workouts'));
      for(var d of snap.docs) { await deleteDoc(d.ref); }
     }
     await auth.currentUser.delete();
     localStorage.clear();
     window.showToast(window.t('toastUpdate', 'Account gelöscht'));
     setTimeout(function() { window.location.reload(); }, 1500);
    } catch(e) {
     if(e.code === 'auth/requires-recent-login') {
      window.showToast(window.t('toastError', 'Bitte zuerst neu einloggen'));
      window.setAuthMode('login');
      window.toggleModal('authModal');
     } else {
      window.showToast('Fehler: ' + e.message);
     }
    }
    });
    });
   };
   
   

   window.listenToWorkouts = function() {
    if(!auth.currentUser) return;
    if(window.unsubscribeSnapshot) window.unsubscribeSnapshot();
    const path = window.currentMode === 'personal' ? `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/window.workouts` : `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/window.clients/${window.currentClient}/window.workouts`;
    
    window.unsubscribeSnapshot = onSnapshot(collection(db, path), (snap) => {
     const cloudData = snap.docs.map(d => d.data());
     if(cloudData.length > 0) {
      var newIds = cloudData.map(function(w) { return w.id; }).sort().join(',');
      var oldIds = (window.workouts || []).map(function(w) { return w.id; }).sort().join(',');
      if(newIds === oldIds && cloudData.length === (window.workouts || []).length) return;
      window.workouts = cloudData.sort((a,b) => parseInt(b.id) - parseInt(a.id));
      window.saveWorkoutsForCurrentClient();
      setTimeout(() => { if(window.filterTable) window.filterTable(window.currentTableFilter); window.calculateReadiness(); if(window.currentView === 'chart') window.initAnalytics(); }, 100);
     } else if((window.workouts || []).length > 0) { window.workouts = []; window.saveWorkoutsForCurrentClient(); window.renderTable(); window.calculateReadiness(); }
    });
   }

   await setPersistence(auth, browserLocalPersistence);

   onAuthStateChanged(auth, async (user) => {
    if(user) {
     window._chAuthUid = user.uid;
     window._chAuthName = user.email ? user.email.split('@')[0] : 'Athlet';
     const status = document.getElementById('cloudStatus');
     if(status) { status.innerHTML = user.isAnonymous ? `<i data-lucide="cloud-check" class="w-3 h-3"></i> Sync` : `<i data-lucide="shield-check" class="w-3 h-3"></i> Gesichert`; status.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border shadow-sm " + (user.isAnonymous ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-primary/10 text-indigo-400 border-indigo-500/20"); }
     if(!user.isAnonymous) { const secBtn = document.getElementById('btnSecureAccount'); if(secBtn) secBtn.classList.add('hidden'); }
     window._updateMenuSecureSection(user);
     window.listenToWorkouts();
     if(typeof window.updateFloatingModeBtn === 'function') window.updateFloatingModeBtn();

     try {
      const statsRef = doc(db, 'artifacts', 'base-v2-beta-test', 'public', 'stats');
      const statsSnap = await getDoc(statsRef);
      if(!statsSnap.exists()) { await setDoc(statsRef, { userCount: 9 }); }
     } catch(e) { /* ignore */ }

     window._loadSubscriptionStatus();
     if(window.loadClientDataFromCloud) { setTimeout(function() { window.loadClientDataFromCloud(); }, 3000); }
     if(!user.isAnonymous && localStorage.getItem('base_anon_challenge_id') && window._migrateAnonChallenge) { window._migrateAnonChallenge(); }
    } else {
     try { await signInAnonymously(auth); } catch(e) { console.error("Firebase Auth Error", e); }
    }
   });

   window._firebaseAuth = auth;

   (async function() {
    const brandUid = new URLSearchParams(window.location.search).get('brand');
    if(brandUid) {
     try {
      const snap = await getDoc(doc(db, 'trainer_profiles', brandUid));
      if(snap.exists()) {
       const tp = snap.data();
       localStorage.setItem('base_brand_override', JSON.stringify({
        name: tp.name || '', logo: tp.photo || '', color: tp.color || '', trainerUid: brandUid
       }));
      }
     } catch(e) { /* ignore */ }
     history.replaceState({}, '', location.pathname);
    }
    if(window.applyTrainerBranding) window.applyTrainerBranding();
   })();

   window._loadSubscriptionStatus = async function() {
    if(!auth.currentUser) return;
    var uid = auth.currentUser.uid;
    try {
     var subData = await new Promise((resolve) => {
      var u = onSnapshot(doc(db, `artifacts/${appIdGlobal}/users/${uid}/subscription`, 'status'), (snap) => {
       u();
       resolve(snap.exists() ? snap.data() : null);
      });
     });
     if(subData && subData.active && subData.plan) {
      window._userSubscriptionPlan = subData.plan;
      window._userIsPro = true;
     } else {
      window._userSubscriptionPlan = 'free';
      window._userIsPro = false;
     }
     window._updatePlanUI(window._userSubscriptionPlan);
    } catch(e) { console.error('Fehler beim Laden des Subscription-Status:', e); }
   };

   window.syncToCloud = async (e) => { 
    if(!navigator.onLine) { let q = JSON.parse(localStorage.getItem('beastmode_v2_offline_queue') || '[]'); q.push(e); localStorage.setItem('beastmode_v2_offline_queue', JSON.stringify(q)); return; }
    if(!auth.currentUser) return; 
    const path = window.currentMode === 'personal' ? `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/window.workouts` : `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/window.clients/${window.currentClient}/window.workouts`; 
    try { await setDoc(doc(db, path, e.id.toString()), e); } catch(err) { console.log("Cloud Sync fehlerhaft -> Offline Queue"); }
   };
   
   window.removeFromCloud = async (id) => { 
    if(!auth.currentUser) return; 
    const path = window.currentMode === 'personal' ? `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/window.workouts` : `artifacts/${appIdGlobal}/users/${auth.currentUser.uid}/window.clients/${window.currentClient}/window.workouts`; 
    try { await deleteDoc(doc(db, path, id.toString())); } catch(err) { console.log("Delete failed offline"); }
   };

   window._chCreate = async (id, data) => {
    try { await setDoc(doc(db, 'challenges', id), data); return true; } catch(e) { return e.message; }
   };
   window._chList = (callback) => {
    const unsub = onSnapshot(collection(db, 'challenges'), (snap) => {
     unsub();
     const results = [];
     snap.docs.forEach(d => { const ch = d.data(); ch.id = d.id; results.push(ch); });
     callback(results);
    });
   };
   window._chUpdate = async (id, data) => {
    try { await setDoc(doc(db, 'challenges', id), data, { merge: true }); return true; } catch(e) { return e.message; }
   };
   window._chGetUid = () => auth.currentUser ? auth.currentUser.uid : (localStorage.getItem('base_anon_challenge_id') || null);
   window._chGetName = () => auth.currentUser && auth.currentUser.email ? auth.currentUser.email.split('@')[0] : (localStorage.getItem('base_anon_challenge_name') || 'Athlet');
   window._migrateAnonChallenge = async function() {
    var oldAnonId = localStorage.getItem('base_anon_challenge_id');
    if(!oldAnonId || !auth.currentUser) return;
    var newUid = auth.currentUser.uid;
    var newName = auth.currentUser.email ? auth.currentUser.email.split('@')[0] : 'Athlet';
    window._chList(function(all) {
     all.forEach(function(ch) {
      var parts = ch.participants || [];
      var idx = -1;
      parts.forEach(function(p, i) { if(p.uid === oldAnonId) idx = i; });
      if(idx === -1) return;
      var newParts = parts.slice();
      newParts[idx] = { uid: newUid, name: newName, progress: newParts[idx].progress || 0, lastUpdate: new Date().toISOString() };
      window._chUpdate(ch.id, { participants: newParts });
     });
    });
    localStorage.removeItem('base_anon_challenge_id');
    localStorage.removeItem('base_anon_challenge_name');
    localStorage.removeItem('base_anon_workout_count');
   };
   window._chDelete = async (id) => {
    try { await deleteDoc(doc(db, 'challenges', id)); return true; } catch(e) { return e.message; }
   };

   window._pushSaveSub = async (subData) => {
    if(!auth.currentUser) return;
    var uid = auth.currentUser.uid;
    try { await setDoc(doc(db, 'push_subscriptions', uid), subData, { merge: true }); } catch(e) { console.error('Push sub save error:', e); }
   };
   window._pushUpdateTraining = async (data) => {
    if(!auth.currentUser) return;
    var uid = auth.currentUser.uid;
    try { await setDoc(doc(db, 'push_subscriptions', uid), data, { merge: true }); } catch(e) { console.error('Push training update error:', e); }
   };

   window._aiTrackCall = async () => {
    if(!auth.currentUser) return;
    var uid = auth.currentUser.uid;
    var today = new Date().toISOString().slice(0, 10);
    try {
     var unsub = onSnapshot(doc(db, 'ai_usage', uid), () => {});
     unsub(); // just to verify access
     var current = await new Promise((resolve) => {
      var u = onSnapshot(doc(db, 'ai_usage', uid), (snap) => {
       u();
       resolve(snap.exists() ? snap.data() : null);
      });
     });
     var count = 1;
     if(current && current.date === today) count = (current.count || 0) + 1;
     await setDoc(doc(db, 'ai_usage', uid), { count: count, date: today, uid: uid, updatedAt: new Date().toISOString() });
     window._aiCallsToday = count;
    } catch(e) { console.error('AI track error:', e); }
   };
   window._aiGetUsage = async () => {
    if(!auth.currentUser) return 0;
    var uid = auth.currentUser.uid;
    var today = new Date().toISOString().slice(0, 10);
    try {
     var data = await new Promise((resolve) => {
      var u = onSnapshot(doc(db, 'ai_usage', uid), (snap) => {
       u();
       resolve(snap.exists() ? snap.data() : null);
      });
     });
     if(data && data.date === today) return data.count || 0;
     return 0;
    } catch(e) { return 0; }
   };
   window._aiCheckPaywall = async () => {
    try {
     var data = await new Promise((resolve) => {
      var u = onSnapshot(doc(db, 'artifacts/base-v2-beta-test/public', 'config'), (snap) => {
       u();
       resolve(snap.exists() ? snap.data() : null);
      });
     });
     if(data && data.gatingActive === true) window._GATING_ACTIVE = true;
     return data && data.paywallActive === true;
    } catch(e) { return false; }
   };
  } catch(e) { console.error("Firebase Init Error", e); }
