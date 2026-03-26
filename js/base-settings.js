// ============================================================
// BASE SETTINGS — Module, Profil, Onboarding, Vorlagen (Routines)
// Ausgelagert aus app.html für Modularisierung
// ============================================================

// --- MODULE / SETTINGS ---
window.applyModules = function() {
    const modules = window.userProfile.modules || { strength: true, cardio: true, recovery: false, main: false };
    const widgets = window.userProfile.widgets || { readiness: false, ptMode: false };
    // Alle Core-Kategorien steuern (Kraft, Ausdauer, Regeneration)
    ['strength','cardio','recovery'].forEach(cat => {
        const btn = document.getElementById('btnCat_'+cat);
        if(btn) btn.style.display = modules[cat] !== false ? '' : 'none';
    });
    // Mein Sport Tab + dynamische Sport-Tabs + Plus-Button (prüft modules.main intern)
    if(typeof window.renderDynamicSportTabs === 'function') window.renderDynamicSportTabs();
    // Falls aktuelle Kategorie deaktiviert wurde, zur ersten aktiven wechseln
    const coreCategories = ['strength','cardio','recovery','main'];
    const curCat = window.currentCategory;
    const curDisabled = coreCategories.includes(curCat) ? modules[curCat] === false : modules.main === false;
    if(curDisabled) {
        const fallback = ['strength','cardio','recovery','main'].find(c => modules[c] !== false);
        if(fallback) window.currentCategory = fallback;
    }
    const readWidget = document.getElementById('readinessWidget');
    if(readWidget) {
        if(widgets.readiness) { readWidget.classList.remove('hidden'); readWidget.classList.add('flex'); }
        else { readWidget.classList.add('hidden'); readWidget.classList.remove('flex'); }
    }
    // PT Mode: vollständiger UI Switch
    if(widgets.ptMode) {
        window.activatePTMode();
    } else {
        window.deactivatePTMode();
    }
    // Render the default form
    window.switchCategory(window.currentCategory);
};

window.renderWidgetStoreUI = function() {
    const modules = window.userProfile.modules || {};
    const widgets = window.userProfile.widgets || {};
    const map = { mod_strength:'strength', mod_cardio:'cardio', mod_recovery:'recovery', mod_custom:'main', mod_ptMode:null, mod_readiness:null };
    Object.entries(map).forEach(([elId, modKey]) => {
        const el = document.getElementById(elId);
        if(!el) return;
        if(elId === 'mod_ptMode') el.checked = !!(widgets.ptMode);
        else if(elId === 'mod_readiness') el.checked = !!(widgets.readiness);
        else el.checked = modules[modKey] !== false;
    });
};

window.saveModules = function() {
    window.userProfile.modules = {
        strength: !!(document.getElementById('mod_strength')?.checked),
        cardio: !!(document.getElementById('mod_cardio')?.checked),
        recovery: !!(document.getElementById('mod_recovery')?.checked),
        main: !!(document.getElementById('mod_custom')?.checked),
    };
    window.userProfile.widgets = {
        readiness: !!(document.getElementById('mod_readiness')?.checked),
        ptMode: !!(document.getElementById('mod_ptMode')?.checked),
    };
    localStorage.setItem('beastmode_v2_profile', JSON.stringify(window.userProfile));
    window.applyModules();
    window.renderWidgetStoreUI();
    window.toggleModal('widgetStoreModal');
    window.showToast("Einstellungen gespeichert! ✅");
};

// --- PROFIL ---
window.populateProfile = function() {
    const fields = { profAge:'age', profWeight:'weight', profHeight:'height', profExperience:'experience', profGender:'gender', profMedicalDetails:'medicalDetails' };
    Object.entries(fields).forEach(([elId, key]) => {
        const el = document.getElementById(elId);
        if(el && window.userProfile[key]) el.value = window.userProfile[key];
    });
};

window.setupInjuryChips = function() {
    document.querySelectorAll('.injury-chip').forEach(chip => {
        const val = chip.getAttribute('data-val');
        if(window.selectedInjuries.has(val)) {
            chip.classList.add('chip-active','bg-primary','text-black','border-primary');
            chip.classList.remove('bg-zinc-900','text-zinc-500','border-zinc-800');
        }
    });
};

window.saveProfile = function(e) {
    if(e) e.preventDefault();
    window.userProfile.age = document.getElementById('profAge')?.value || '';
    window.userProfile.weight = document.getElementById('profWeight')?.value || '';
    window.userProfile.height = document.getElementById('profHeight')?.value || '';
    window.userProfile.experience = document.getElementById('profExperience')?.value || '';
    window.userProfile.gender = document.getElementById('profGender')?.value || '';
    window.userProfile.medicalDetails = document.getElementById('profMedicalDetails')?.value || '';
    window.userProfile.injuries = Array.from(window.selectedInjuries);
    localStorage.setItem('beastmode_v2_profile', JSON.stringify(window.userProfile));
    window.toggleModal('profileModal');
    window.showToast("Profil gespeichert! ✅");
};
// Attach profile form submit
window.addEventListener('load', () => {
    const pf = document.getElementById('profileForm');
    if(pf) pf.addEventListener('submit', window.saveProfile);
});

// 1RM Badge in Timeline anzeigen
const _origRenderTable = window.renderTable;
// 1RM wird über die History-Funktion im Modal angezeigt — kein Override nötig
let obRole = 'athlete';
let _obFocus = { strength: true, cardio: false, main: false, all: false };
let _obQuickWorkoutSaved = false;
let _obSelectedExercise = null;

const _OB_FOCUS_CARDS = [
    { key:'strength', icon:'dumbbell', name:'Krafttraining', color:'cyan', sub:'Sätze, Gewicht, 1RM' },
    { key:'cardio', icon:'heart-pulse', name:'Ausdauer', color:'rose', sub:'Laufen, Radfahren, Schwimmen' },
    { key:'main', icon:'trophy', name:'Mein Sport', color:'amber', sub:'86 Sportarten tracken' },
    { key:'all', icon:'layers', name:'Alles', color:'indigo', sub:'Kraft + Cardio + Sport' }
];

const _OB_QUICK_EXERCISES = {
    strength: [
        { name:'Bankdrücken', de:'Bankdrücken', id:'Barbell_Bench_Press_-_Medium_Grip', fields:[{l:'Gewicht (kg)',p:'60'},{l:'Wiederholungen',p:'8'}] },
        { name:'Kniebeuge', de:'Kniebeuge', id:'Barbell_Squat', fields:[{l:'Gewicht (kg)',p:'80'},{l:'Wiederholungen',p:'5'}] },
        { name:'Klimmzüge', de:'Klimmzug', id:'Pullups', fields:[{l:'Gewicht (kg)',p:'0'},{l:'Wiederholungen',p:'8'}] }
    ],
    cardio: [
        { name:'Laufen', de:'Laufen', id:'Jogging,_Treadmill', fields:[{l:'Distanz (km)',p:'5'},{l:'Dauer (min)',p:'30'}], cat:'cardio' },
        { name:'Radfahren', de:'Radfahren', id:'Bicycling,_Stationary', fields:[{l:'Distanz (km)',p:'20'},{l:'Dauer (min)',p:'45'}], cat:'cardio' },
        { name:'Schwimmen', de:'Schwimmen', id:'Rowing,_Stationary', fields:[{l:'Distanz (m)',p:'1000'},{l:'Dauer (min)',p:'30'}], cat:'cardio' }
    ]
};

window.obSetRole = function(role) {
    obRole = role;
    document.querySelectorAll('.ob-role-btn').forEach(b => {
        b.classList.remove('border-primary','bg-primary/10','border-indigo-500','bg-indigo-500/10');
        b.classList.add('border-zinc-800','bg-zinc-900');
    });
    const btn = document.getElementById('ob-role-' + role);
    if(btn) {
        btn.classList.remove('border-zinc-800','bg-zinc-900');
        btn.classList.add(role === 'pt' ? 'border-indigo-500' : 'border-primary', role === 'pt' ? 'bg-indigo-500/10' : 'bg-primary/10');
    }
};

window.obNext = function(step) {
    [1,2,3,4,5].forEach(s => {
        const el = document.getElementById('ob-step-'+s);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById('ob-step-'+step);
    if(target) target.classList.remove('hidden');
    // Update dots
    const dotsRow = document.getElementById('obDotsRow');
    if(dotsRow) dotsRow.innerHTML = [1,2,3,4,5].map(i => `<span class="w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-primary' : i < step ? 'bg-primary/40' : 'bg-zinc-700'}"></span>`).join('');
    // Step-specific init
    if(step === 1) setTimeout(() => { document.querySelectorAll('.ob-feature').forEach(f => { f.style.opacity = '1'; f.style.transform = 'translateY(0)'; }); }, 100);
    if(step === 3) window._renderObFocusCards();
    if(step === 4) window._renderObWorkoutCards();
    if(window.lucide) setTimeout(() => lucide.createIcons(), 30);
};

window._renderObFocusCards = function() {
    const c = document.getElementById('obFocusCards');
    if(!c) return;
    c.innerHTML = _OB_FOCUS_CARDS.map(f => {
        const active = f.key === 'all' ? _obFocus.all : _obFocus[f.key];
        return `<button onclick="window._toggleObFocus('${f.key}')" class="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer pointer-events-auto ${active ? 'border-'+f.color+'-500/40 bg-'+f.color+'-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}">
            <i data-lucide="${f.icon}" class="w-6 h-6 ${active ? 'text-'+f.color+'-400' : 'text-zinc-600'} pointer-events-none"></i>
            <p class="text-sm font-black ${active ? 'text-white' : 'text-zinc-400'}">${f.name}</p>
            <p class="text-[9px] font-bold uppercase tracking-widest ${active ? 'text-zinc-400' : 'text-zinc-600'}">${f.sub}</p>
        </button>`;
    }).join('');
    if(window.lucide) setTimeout(() => lucide.createIcons(), 30);
};

window._toggleObFocus = function(key) {
    if(key === 'all') {
        _obFocus = { strength: true, cardio: true, main: true, all: true };
    } else {
        _obFocus.all = false;
        _obFocus[key] = !_obFocus[key];
        if(_obFocus.strength && _obFocus.cardio && _obFocus.main) _obFocus.all = true;
    }
    window._renderObFocusCards();
};

window._renderObWorkoutCards = function() {
    const c = document.getElementById('obWorkoutCards');
    if(!c) return;
    if(_obQuickWorkoutSaved) return; // Already saved
    const type = _obFocus.cardio && !_obFocus.strength ? 'cardio' : 'strength';
    const exercises = _OB_QUICK_EXERCISES[type] || _OB_QUICK_EXERCISES.strength;
    const IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
    c.innerHTML = exercises.map((ex, idx) => `<button onclick="window._obSelectExercise(${idx},'${type}')" class="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-primary/30 transition-all cursor-pointer pointer-events-auto text-left w-full">
        <img src="${IMG}${ex.id}/0.jpg" alt="${window._escapeHtml(ex.de)}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-zinc-800" onerror="this.style.display='none'">
        <div class="flex-1 min-w-0"><p class="text-white font-black text-sm">${window._escapeHtml(ex.de)}</p><p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Tippe zum Tracken</p></div>
        <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600 flex-shrink-0 pointer-events-none"></i>
    </button>`).join('');
};

window._obSelectedType = 'strength';
window._obSelectExercise = function(idx, type) {
    window._obSelectedType = type;
    const exercises = _OB_QUICK_EXERCISES[type] || _OB_QUICK_EXERCISES.strength;
    _obSelectedExercise = exercises[idx];
    if(!_obSelectedExercise) return;
    document.getElementById('obWorkoutExName').textContent = _obSelectedExercise.de;
    const fields = document.getElementById('obWorkoutFields');
    if(fields) fields.innerHTML = _obSelectedExercise.fields.map((f, i) => `<div><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">${window._escapeHtml(f.l)}</p><input type="number" id="obField${i}" placeholder="${f.p}" step="any" class="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-bold outline-none focus:border-primary cursor-text pointer-events-auto"></div>`).join('');
    document.getElementById('obWorkoutForm').classList.remove('hidden');
    document.getElementById('obWorkoutCards').classList.add('hidden');
};

window.obSaveQuickWorkout = function() {
    if(!_obSelectedExercise) return;
    const v0 = document.getElementById('obField0')?.value || _obSelectedExercise.fields[0].p;
    const v1 = document.getElementById('obField1')?.value || _obSelectedExercise.fields[1].p;
    const isCardio = _obSelectedExercise.cat === 'cardio';
    const entry = {
        id: Date.now().toString(),
        category: isCardio ? 'cardio' : 'strength',
        date: new Date().toISOString().split('T')[0],
        exercise: _obSelectedExercise.de,
        archived: true,
        data: {},
        setDetails: [],
        volume: 0,
        maxWeight: 0
    };
    if(isCardio) {
        entry.data[_obSelectedExercise.fields[0].l] = v0;
        entry.data[_obSelectedExercise.fields[1].l] = v1;
    } else {
        const w = parseFloat(v0) || 0;
        const r = parseInt(v1) || 0;
        entry.setDetails = [{ weight: w, reps: r }];
        entry.volume = w * r;
        entry.maxWeight = w;
    }
    if(!Array.isArray(window.workouts)) window.workouts = [];
    window.workouts.unshift(entry);
    window.saveWorkoutsForCurrentClient();
    _obQuickWorkoutSaved = true;
    document.getElementById('obWorkoutForm').classList.add('hidden');
    document.getElementById('obWorkoutDone').classList.remove('hidden');
    document.getElementById('obStep4Next').classList.remove('hidden');
    if(window.syncToCloud) window.syncToCloud(entry);
};

window.obCreateAccount = async function() {
    const email = (document.getElementById('obAuthEmail')?.value || '').trim();
    const pw = document.getElementById('obAuthPassword')?.value || '';
    if(!email || pw.length < 6) { window.showToast('E-Mail + Passwort (min 6 Zeichen) eingeben'); return; }
    const btn = document.getElementById('obAuthBtn');
    if(btn) btn.textContent = 'Bitte warten...';
    try {
        if(window._firebaseAuth && window._firebaseAuth.currentUser) {
            const { EmailAuthProvider, linkWithCredential } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
            const credential = EmailAuthProvider.credential(email, pw);
            await linkWithCredential(window._firebaseAuth.currentUser, credential);
            window.showToast('Account erstellt!');
            const secBtn = document.getElementById('btnSecureAccount');
            if(secBtn) secBtn.classList.add('hidden');
            localStorage.removeItem('base_auth_skipped');
            // Push nach Account-Erstellung
            setTimeout(() => {
                if(typeof Notification !== 'undefined' && Notification.permission === 'default' && !localStorage.getItem('base_push_subscribed')) {
                    window.requestPushPermission(false);
                }
            }, 1000);
        }
    } catch(e) {
        if(e.code === 'auth/email-already-in-use') {
            window.showToast('E-Mail bereits registriert — bitte einloggen');
        } else {
            window.showToast('Fehler: ' + (e.message || e.code));
        }
        if(btn) btn.textContent = 'Account erstellen';
        return;
    }
    window.obFinish();
};

window.obSkipAuth = function() {
    localStorage.setItem('base_auth_skipped', 'true');
    localStorage.setItem('base_auth_skip_count', '0');
    window.obFinish();
};

window.obFinish = function() {
    window.userProfile.modules = {
        strength: _obFocus.strength || _obFocus.all,
        cardio: _obFocus.cardio || _obFocus.all,
        recovery: false,
        main: _obFocus.main || _obFocus.all,
    };
    window.userProfile.widgets = {
        readiness: false,
        ptMode: obRole === 'pt'
    };
    window.userProfile.onboardingDone = true;
    localStorage.setItem('beastmode_v2_profile', JSON.stringify(window.userProfile));
    window.toggleModal('onboardingModal');
    window.applyModules();
    if(typeof window.renderWidgetStoreUI === 'function') window.renderWidgetStoreUI();
    if(typeof window.populateProfile === 'function') window.populateProfile();
    if(typeof window.renderTable === 'function') window.renderTable();
    if(window.lucide) lucide.createIcons();
    window.showToast('Willkommen bei BASE!');
};

// Auth-Skipped Nachfass Banner
window._checkAuthSkippedBanner = function() {
    if(!localStorage.getItem('base_auth_skipped')) return;
    const auth = window._firebaseAuth || window._fbAuth;
    if(auth && auth.currentUser && !auth.currentUser.isAnonymous) {
        localStorage.removeItem('base_auth_skipped');
        return;
    }
    let count = parseInt(localStorage.getItem('base_auth_skip_count') || '0');
    count++;
    localStorage.setItem('base_auth_skip_count', String(count));
    if(count === 3 || count === 7 || count === 15) {
        const banner = document.getElementById('authSkippedBanner');
        const countEl = document.getElementById('authSkipWorkoutCount');
        if(banner && countEl) {
            const total = Array.isArray(window.workouts) ? window.workouts.filter(w => w.archived).length : count;
            countEl.textContent = total;
            banner.classList.remove('hidden');
        }
    }
    // Push nach 3. Workout wenn noch nicht gefragt
    if(count === 3 && typeof Notification !== 'undefined' && Notification.permission === 'default' && !localStorage.getItem('base_push_subscribed')) {
        setTimeout(() => window.requestPushPermission(false), 3000);
    }
};

window.openRoutinesModal = function() {
    window.renderRoutinesList();
    window.toggleModal('routinesModal');
    if(window.lucide) lucide.createIcons();
};

window.saveCurrentAsRoutine = function() {
    const name = document.getElementById('routineNameInput')?.value?.trim();
    if(!name) { window.showToast('Bitte einen Namen eingeben!'); return; }
    const activeWorkouts = window.workouts.filter(w => !w.archived);
    if(activeWorkouts.length === 0) { window.showToast('Keine aktiven Übungen zum Speichern!'); return; }
    const routine = {
        id: Date.now().toString(),
        name,
        category: window.currentCategory,
        createdAt: new Date().toISOString().slice(0,10),
        exercises: activeWorkouts.map(w => ({
            exercise: w.exercise,
            category: w.category,
            setDetails: w.setDetails || [],
            data: w.data || {},
            equipment: w.equipment || '',
            sportCategory: w.sportCategory || ''
        }))
    };
    window.savedRoutines.unshift(routine);
    localStorage.setItem('beastmode_v2_routines', JSON.stringify(window.savedRoutines));
    document.getElementById('routineNameInput').value = '';
    window.renderRoutinesList();
    window.showToast(`"${name}" gespeichert! ✅`);
};

window.loadRoutine = function(id) {
    const routine = window.savedRoutines.find(r => r.id === id);
    if(!routine) return;
    window.showModal('Vorlage laden?', `"${routine.name}" als aktives Workout laden?`, true, () => {
        // Kategorie wechseln falls nötig
        if(routine.category && routine.category !== window.currentCategory) window.switchCategory(routine.category);
        // Übungen ins aktive Workout laden
        const newWorkouts = routine.exercises.map(ex => ({
            ...ex,
            id: Date.now().toString() + Math.random().toString(36).slice(2,5),
            date: new Date().toISOString().slice(0,10),
            archived: false,
            sessionId: null
        }));
        window.workouts = [...newWorkouts, ...window.workouts.filter(w => w.archived)];
        window.saveWorkoutsForCurrentClient();
        window.renderTable();
        window.toggleModal('routinesModal');
        window.showToast(`"${routine.name}" geladen! 🔥`);
        // Erste Übung ins Formular laden
        if(newWorkouts.length > 0 && document.getElementById('exerciseInput')) {
            document.getElementById('exerciseInput').value = newWorkouts[0].exercise;
        }
    });
};

window.deleteRoutine = function(id) {
    const routine = window.savedRoutines.find(r => r.id === id);
    if(!routine) return;
    window.showModal('Löschen?', `"${routine.name}" wirklich löschen?`, true, () => {
        window.savedRoutines = window.savedRoutines.filter(r => r.id !== id);
        localStorage.setItem('beastmode_v2_routines', JSON.stringify(window.savedRoutines));
        window.renderRoutinesList();
        window.showToast('Vorlage gelöscht.');
    });
};

window.renderRoutinesList = function() {
    const list = document.getElementById('routinesList');
    const empty = document.getElementById('routinesEmpty');
    if(!list) return;
    if(window.savedRoutines.length === 0) {
        list.innerHTML = '';
        if(empty) { empty.classList.remove('hidden'); empty.classList.add('block'); }
        return;
    }
    if(empty) { empty.classList.add('hidden'); empty.classList.remove('block'); }
    list.innerHTML = window.savedRoutines.map(r => {
        const ui = window.CAT_UI[r.category] || window.CAT_UI['main'];
        const exNames = r.exercises.map(e => e.exercise).slice(0,3).join(', ') + (r.exercises.length > 3 ? '...' : '');
        return `<div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-amber-500/30 transition-all">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-9 h-9 rounded-xl flex-shrink-0 ${ui.bg} border ${ui.border} flex items-center justify-center ${ui.color}"><i data-lucide="${ui.icon}" class="w-4 h-4"></i></div>
                <div class="min-w-0">
                    <p class="text-white font-black text-sm truncate">${window._escapeHtml(r.name)}</p>
                    <p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">${r.exercises.length} Übung${r.exercises.length !== 1 ? 'en' : ''} · ${window._escapeHtml(r.createdAt)}</p>
                    <p class="text-zinc-600 text-[10px] truncate mt-0.5">${window._escapeHtml(exNames)}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
                <button onclick="window.loadRoutine('${r.id}')" class="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer pointer-events-auto">Laden</button>
                <button aria-label="Löschen" onclick="window.deleteRoutine('${r.id}')" class="text-zinc-600 hover:text-rose-400 p-1.5 transition-colors cursor-pointer pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button>
            </div>
        </div>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
};
