// ============================================================
// BASE SETTINGS — Module, Profil, Onboarding, Vorlagen (Routines)
// Ausgelagert aus app.html für Modularisierung
// ============================================================

// ── LAZY-LOAD SYSTEM fuer Analyse-Tab ──────────────────────

window._lazyRenderMap = {
  baseScoreContainer: '_renderBASEScore',
  recoveryHistoryContainer: '_renderRecoveryHistory',
  weightWidgetContainer: '_renderWeightWidget',
  journalContainer: '_renderJournal',
  benchmarkContainer: '_renderBenchmarkDashboard',
  plateauContainer: '_renderPlateauWidget',
  friendsCompareContainer: '_renderFriendsCompare',
  spotifyWidgetContainer: '_renderSpotifyWidget'
};

window._initLazyAnalyse = function() {
  var priority = ['baseScoreContainer', 'recoveryHistoryContainer', 'weightWidgetContainer'];
  priority.forEach(function(id) {
    var fn = window._lazyRenderMap[id];
    if (fn && window[fn]) { try { window[fn](id); } catch (e) { console.warn('Lazy priority:', e); } }
    if (window._hideEmptyWidget) window._hideEmptyWidget(id);
  });
  if (!('IntersectionObserver' in window)) {
    Object.keys(window._lazyRenderMap).forEach(function(id) {
      if (priority.indexOf(id) !== -1) return;
      var fn = window._lazyRenderMap[id];
      if (fn && window[fn]) { setTimeout(function() { try { window[fn](id); } catch (e) {} if (window._hideEmptyWidget) window._hideEmptyWidget(id); }, 500); }
    });
    return;
  }
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var fn = window._lazyRenderMap[entry.target.id];
      if (fn && window[fn]) { try { window[fn](entry.target.id); } catch (e) {} }
      if (window._hideEmptyWidget) window._hideEmptyWidget(entry.target.id);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '100px', threshold: 0.1 });
  Object.keys(window._lazyRenderMap).forEach(function(id) {
    if (priority.indexOf(id) !== -1) return;
    var el = document.getElementById(id);
    if (el) observer.observe(el);
  });
};

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
    if(window._updateModeSwitchPill) window._updateModeSwitchPill();
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
    var vcToggle = document.getElementById('mod_voiceCoach');
    if (vcToggle) vcToggle.checked = localStorage.getItem('base_voice_coach') === 'true';
    var gcToggle = document.getElementById('mod_goalCoaching');
    if (gcToggle) gcToggle.checked = localStorage.getItem('base_goal_coaching_enabled') === 'true';
    var hlToggle = document.getElementById('mod_habitLoop');
    if (hlToggle) hlToggle.checked = localStorage.getItem('base_habit_loop_enabled') === 'true';
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
    if (window._syncAppData) window._syncAppData('beastmode_v2_profile', window.userProfile);
    window.applyModules();
    window.renderWidgetStoreUI();
    window.toggleModal('widgetStoreModal');
    window.showToast(window.t("ptSaved","Einstellungen gespeichert!"));
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
    if (window._syncAppData) window._syncAppData('beastmode_v2_profile', window.userProfile);
    window.toggleModal('profileModal');
    window.showToast(window.t("profileSaved","Profil gespeichert! ✅"));
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
let _obFocus = { strength: true, cardio: false, recovery: false, main: false };
let _obQuickWorkoutSaved = false;
let _obSelectedExercise = null;
let _obPtSpecs = [];
const _OB_PT_SPECS = [window.t('specStrength','Krafttraining'),window.t('specEndurance','Ausdauer'),window.t('specWeightLoss','Gewichtsverlust'),window.t('specRehab','Rehabilitation'),window.t('specBodybuilding','Bodybuilding'),window.t('specCrossfit','CrossFit'),window.t('specYoga','Yoga/Pilates'),window.t('specMartialArts','Kampfsport'),window.t('specSenior','Senioren-Fitness')];

const _OB_FOCUS_CARDS = [
    { key:'strength', icon:'dumbbell', name: window.t('modStr','Krafttraining'), color:'cyan', sub: window.t('catStrSub','Sätze, Gewicht, 1RM') },
    { key:'cardio', icon:'heart-pulse', name: window.t('modCar','Ausdauer'), color:'rose', sub: window.t('catCarSub','Laufen, Radfahren, Schwimmen') },
    { key:'recovery', icon:'stretch-horizontal', name: window.t('tabRec','Mobility'), color:'emerald', sub: window.t('catRecSub','Stretching, Yoga, Foam Rolling') },
    { key:'main', icon:'trophy', name: window.t('modCus','Mein Sport'), color:'amber', sub: window.t('catCusSub','86 Sportarten tracken') }
];

const _OB_QUICK_EXERCISES = {
    strength: [
        { name:'Bankdrücken', de:'Bankdrücken', id:'Barbell_Bench_Press_-_Medium_Grip', fields:[{l: window.t('lblWeight','Gewicht (kg)'),p:'60'},{l: window.t('lblReps','Wiederholungen'),p:'8'}] },
        { name:'Kniebeuge', de:'Kniebeuge', id:'Barbell_Squat', fields:[{l: window.t('lblWeight','Gewicht (kg)'),p:'80'},{l: window.t('lblReps','Wiederholungen'),p:'5'}] },
        { name:'Klimmzüge', de:'Klimmzug', id:'Pullups', fields:[{l: window.t('lblWeight','Gewicht (kg)'),p:'0'},{l: window.t('lblReps','Wiederholungen'),p:'8'}] }
    ],
    cardio: [
        { name:'Laufen', de:'Laufen', id:'Jogging,_Treadmill', fields:[{l: window.t('schema_distance','Distanz (km)'),p:'5'},{l: window.t('schema_duration','Dauer (min)'),p:'30'}], cat:'cardio' },
        { name:'Radfahren', de:'Radfahren', id:'Bicycling,_Stationary', fields:[{l: window.t('schema_distance','Distanz (km)'),p:'20'},{l: window.t('schema_duration','Dauer (min)'),p:'45'}], cat:'cardio' },
        { name:'Schwimmen', de:'Schwimmen', id:'Rowing,_Stationary', fields:[{l: window.t('schema_distanceM','Distanz (m)'),p:'1000'},{l: window.t('schema_duration','Dauer (min)'),p:'30'}], cat:'cardio' }
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
    // Alle Steps verstecken (inkl. PT-Steps)
    ['1','2','3','4','5','3pt','4pt'].forEach(s => {
        const el = document.getElementById('ob-step-'+s);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById('ob-step-'+step);
    if(target) target.classList.remove('hidden');
    // Flow bestimmen
    var flow = obRole === 'pt' ? [1, 2, '3pt', '4pt', 5] : [1, 2, 3, 4, 5];
    var dotIdx = flow.indexOf(step);
    if(dotIdx === -1) dotIdx = flow.indexOf(Number(step));
    var dotColor = obRole === 'pt' ? 'bg-indigo-500' : 'bg-primary';
    var dotFade = obRole === 'pt' ? 'bg-indigo-500/40' : 'bg-primary/40';
    // Update dots
    var dotsRow = document.getElementById('obDotsRow');
    if(dotsRow) dotsRow.innerHTML = flow.map(function(s, i) { return '<span class="w-2 h-2 rounded-full transition-colors ' + (i === dotIdx ? dotColor : i < dotIdx ? dotFade : 'bg-zinc-700') + '"></span>'; }).join('');
    // Step-specific init
    if(step === 1) {
        // Social proof badge
        var _step1El = document.getElementById('ob-step-1');
        if(_step1El && !_step1El.querySelector('.ob-social-proof')) {
            var _spBadge = document.createElement('div');
            _spBadge.className = 'ob-social-proof';
            _spBadge.innerHTML = '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 70%);margin-bottom:16px">' +
                '<span style="font-size:11px;color:var(--primary-hex);font-weight:600">&#9733; 800+ Athleten nutzen BASE</span>' +
                '</div>';
            var _obSubP = _step1El.querySelector('[data-i18n="obWelcomeSub"]');
            if(_obSubP && _obSubP.nextSibling) _obSubP.parentNode.insertBefore(_spBadge, _obSubP.nextSibling);
            else if(_obSubP) _obSubP.parentNode.appendChild(_spBadge);
        }
        setTimeout(function() { document.querySelectorAll('.ob-feature').forEach(function(f) { f.style.opacity = '1'; f.style.transform = 'translateY(0)'; }); }, 100);
    }
    if(step === 3) window._renderObFocusCards();
    if(step === 4) { window._renderObWorkoutCards(); var _sk=document.getElementById('obSkipStep4'); if(_sk) { _sk.classList.add('hidden'); setTimeout(function(){_sk.classList.remove('hidden');},2000); } }
    if(step === '4pt') window._renderObPtSpecChips();
    if(step === 5) {
        // Value proposition before form fields
        var _step5El = document.getElementById('ob-step-5');
        if(_step5El && !_step5El.querySelector('.ob-value-pitch')) {
            var _vpDiv = document.createElement('div');
            _vpDiv.className = 'ob-value-pitch';
            _vpDiv.innerHTML = '<div style="padding:10px 14px;border-radius:10px;background:color-mix(in srgb,var(--primary-hex),transparent 92%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 75%);margin-bottom:16px;font-size:12px;color:var(--text-muted);line-height:1.5">' +
                '<strong style="color:var(--primary-hex)">Warum registrieren?</strong><br>' +
                'Deine Workouts sind aktuell nur auf diesem Geraet. Mit Account: Cloud-Sync, kein Datenverlust bei Geraetewechsel.' +
                '</div>';
            var _googleBtn = _step5El.querySelector('[onclick*="obGoogleSignIn"]');
            if(_googleBtn) _googleBtn.parentNode.insertBefore(_vpDiv, _googleBtn);
            else {
                var _subP = _step5El.querySelector('[data-i18n="lblSecureDataSub"]');
                if(_subP && _subP.nextSibling) _subP.parentNode.insertBefore(_vpDiv, _subP.nextSibling);
            }
        }
    }
    if(window.lucide) setTimeout(function() { lucide.createIcons(); }, 30);
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
    _obFocus[key] = !_obFocus[key];
    window._renderObFocusCards();
};

// PT Onboarding: Spezialisierung Chips
window._renderObPtSpecChips = function() {
    var c = document.getElementById('obPtSpecChips');
    if(!c) return;
    c.innerHTML = _OB_PT_SPECS.map(function(spec) {
        var active = _obPtSpecs.indexOf(spec) !== -1;
        return '<button type="button" onclick="window._toggleObPtSpec(\'' + spec.replace(/'/g, "\\'") + '\')" class="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer pointer-events-auto transition-all ' +
            (active ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700') +
            ' border">' + window._escapeHtml(spec) + '</button>';
    }).join('');
    // Enable/disable Weiter
    var btn = document.getElementById('obPtSpecNext');
    if(btn) { btn.disabled = _obPtSpecs.length === 0; btn.style.opacity = _obPtSpecs.length === 0 ? '0.4' : '1'; }
};
window._toggleObPtSpec = function(spec) {
    var idx = _obPtSpecs.indexOf(spec);
    if(idx === -1) _obPtSpecs.push(spec); else _obPtSpecs.splice(idx, 1);
    window._renderObPtSpecChips();
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
        <div class="flex-1 min-w-0"><p class="text-white font-black text-sm">${window._escapeHtml(ex.de)}</p><p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">${window.t('obTapToTrack','Tippe zum Tracken')}</p></div>
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
    if(fields) fields.innerHTML = _obSelectedExercise.fields.map((f, i) => `<div><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">${window._escapeHtml(f.l)}</p><input type="number" id="obField${i}" value="${f.p}" placeholder="${f.p}" step="any" class="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-bold outline-none focus:border-primary cursor-text pointer-events-auto"></div>`).join('');
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
    if(!email || pw.length < 6) { window.showToast(window.t('toastError','E-Mail + Passwort (min 6 Zeichen) eingeben')); return; }
    const btn = document.getElementById('obAuthBtn');
    if(btn) btn.textContent = window.t('aiGenerating','Bitte warten...');
    try {
        if(window._firebaseAuth && window._firebaseAuth.currentUser) {
            const { EmailAuthProvider, linkWithCredential } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
            const credential = EmailAuthProvider.credential(email, pw);
            await linkWithCredential(window._firebaseAuth.currentUser, credential);
            window.showToast(window.t('toastUpdate','Account erstellt!'));
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
            window.showToast(window.t('toastError','E-Mail bereits registriert — bitte einloggen'));
        } else {
            window.showToast(window.t('toastError') + ': ' + (e.message || e.code));
        }
        if(btn) btn.textContent = window.t('btnCreate','Account erstellen');
        return;
    }
    window.obFinish();
};

window.obAskPush = async function() {
    // Push nicht moeglich oder schon entschieden -> direkt zu Step 5
    if (!('Notification' in window) || !('serviceWorker' in navigator) || Notification.permission !== 'default') {
        window.obNext(5);
        return;
    }
    // Zeige Push-Opt-in Step
    var step = document.getElementById('ob-step-push');
    if (!step) { window.obNext(5); return; }
    // Alle Steps verstecken, Push-Step zeigen
    ['1','2','3','4','5','3pt','4pt'].forEach(function(s) {
        var el = document.getElementById('ob-step-'+s);
        if(el) el.classList.add('hidden');
    });
    step.classList.remove('hidden');
    if(window.lucide) setTimeout(function() { lucide.createIcons(); }, 30);
};

window._obPushAccept = async function() {
    try {
        var permission = await Notification.requestPermission();
        if (permission === 'granted' && typeof window.setupPushSubscription === 'function') {
            await window.setupPushSubscription();
        }
    } catch(e) {
        console.warn('Push setup error:', e);
    }
    window.obNext(5);
};

window.obSkipAuth = function() {
    localStorage.setItem('base_auth_skipped', 'true');
    localStorage.setItem('base_auth_skip_count', '0');
    window.obFinish();
};

window.obFinish = function() {
    if(obRole === 'pt') {
        // PT: Module auf Allround setzen, Spezialisierung + Studio speichern
        window.userProfile.modules = { strength: true, cardio: true, recovery: true, main: false };
        window.userProfile.widgets = { readiness: false, ptMode: true };
        // Studio-Name speichern
        var ptName = (document.getElementById('obPtName')?.value || '').trim();
        if(ptName) {
            var branding = JSON.parse(localStorage.getItem('base_trainer_branding') || '{}');
            branding.name = ptName;
            localStorage.setItem('base_trainer_branding', JSON.stringify(branding));
        }
        // Spezialisierungen (aktuell nicht gelesen, fuer zukuenftige Nutzung)
    } else {
        // Athlet: Module nach Fokus
        window.userProfile.modules = {
            strength: !!_obFocus.strength,
            cardio: !!_obFocus.cardio,
            recovery: !!_obFocus.recovery,
            main: !!_obFocus.main,
        };
        window.userProfile.widgets = { readiness: false, ptMode: false };
    }
    window.userProfile.onboardingDone = true;
    localStorage.setItem('beastmode_v2_profile', JSON.stringify(window.userProfile));
    if (window._syncAppData) window._syncAppData('beastmode_v2_profile', window.userProfile);
    var _obCreatorCode = document.getElementById('onboardingCreatorCode');
    if (_obCreatorCode && _obCreatorCode.value.trim() && window._applyCreatorCode) {
     setTimeout(function() { window._applyCreatorCode(_obCreatorCode.value.trim()); }, 2000);
    }
    window.toggleModal('onboardingModal');
    window.applyModules();
    if(typeof window.renderWidgetStoreUI === 'function') window.renderWidgetStoreUI();
    if(typeof window.populateProfile === 'function') window.populateProfile();
    if(typeof window.renderTable === 'function') window.renderTable();
    if(window.lucide) lucide.createIcons();
    if(obRole === 'pt') {
        // PT-Modus automatisch aktivieren
        if(typeof window.activatePTMode === 'function') setTimeout(function() { window.switchMode('pt'); window.activatePTMode(); }, 300);
        window.showToast(window.t('ptWelcome','Willkommen, Trainer!'));
    } else {
        window.showToast(window.t('onboardWelcome','Willkommen bei BASE!'));
        // Nach Onboarding: Kraft vorauswählen damit das Formular sofort sichtbar ist
        setTimeout(function() {
            if(typeof window.switchCategory === 'function') window.switchCategory('strength');
        }, 200);
        // Post-Onboarding: Zeige dem User was er als nächstes tun soll
        setTimeout(function() {
            if (typeof window.showToast === 'function') {
                window.showToast(window.t('firstWorkoutSub', 'Tracke dein erstes Workout in 30 Sekunden.'), 'info', 5000);
            }
        }, 1500);
    }
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
    if(!name) { window.showToast(window.t('ptEnterName','Bitte einen Namen eingeben!')); return; }
    const activeWorkouts = window.workouts.filter(w => !w.archived);
    if(activeWorkouts.length === 0) { window.showToast(window.t('toastError','Keine aktiven Übungen zum Speichern!')); return; }
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
    window.showToast(`"${name}" ${window.t('ptSaved','gespeichert!')}`);
};

window.loadRoutine = function(id) {
    const routine = window.savedRoutines.find(r => r.id === id);
    if(!routine) return;
    window.showModal(window.t('lblLoad','Vorlage laden?'), `"${routine.name}" ${window.t('lblLoad','laden')}?`, true, () => {
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
        window.showToast(`"${routine.name}" ${window.t('lblLoad','geladen!')}`);
        // Erste Übung ins Formular laden
        if(newWorkouts.length > 0 && document.getElementById('exerciseInput')) {
            document.getElementById('exerciseInput').value = newWorkouts[0].exercise;
        }
    });
};

window.deleteRoutine = function(id) {
    const routine = window.savedRoutines.find(r => r.id === id);
    if(!routine) return;
    window.showModal(window.t('lblDeleteConfirm','Löschen?'), `"${routine.name}" ${window.t('lblDeleteConfirm','wirklich löschen?')}`, true, () => {
        window.savedRoutines = window.savedRoutines.filter(r => r.id !== id);
        localStorage.setItem('beastmode_v2_routines', JSON.stringify(window.savedRoutines));
        window.renderRoutinesList();
        window.showToast(window.t('toastDeleted'));
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
                    <p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">${r.exercises.length} ${window.t('lblExercises','Übungen')} · ${window._escapeHtml(r.createdAt)}</p>
                    <p class="text-zinc-600 text-[10px] truncate mt-0.5">${window._escapeHtml(exNames)}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
                <button onclick="window.loadRoutine('${r.id}')" class="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer pointer-events-auto">${window.t('lblLoad','Laden')}</button>
                <button aria-label="${window.t('lblDeleteConfirm','Löschen')}" onclick="window.deleteRoutine('${r.id}')" class="text-zinc-600 hover:text-rose-400 p-1.5 transition-colors cursor-pointer pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button>
            </div>
        </div>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
};

// ── MODE-SELECTOR & FLOATING MODE SWITCH ──────────────────

window.selectStartMode = function(mode) {
    var remember = document.getElementById('modeRememberCheck');
    if(remember && !remember.checked) {
        localStorage.setItem('base_default_mode', mode);
        localStorage.setItem('base_show_mode_selector', 'false');
    } else {
        localStorage.setItem('base_show_mode_selector', 'true');
    }
    window.toggleModal('modeSelectorModal');
    if(mode === 'pt') {
        window.switchMode('pt');
        window.activatePTMode();
    } else {
        window.switchMode('personal');
        window.deactivatePTMode();
    }
};

window.showModeSelector = function() {
    if(!window.userProfile || !window.userProfile.widgets || !window.userProfile.widgets.ptMode) return;
    var defaultMode = localStorage.getItem('base_default_mode');
    var showSelector = localStorage.getItem('base_show_mode_selector');
    if(showSelector === 'false' && defaultMode) {
        if(defaultMode === 'pt') { window.switchMode('pt'); window.activatePTMode(); }
        else { window.switchMode('personal'); window.deactivatePTMode(); }
        return;
    }
    window.toggleModal('modeSelectorModal');
    if(window.lucide) setTimeout(function() { lucide.createIcons(); }, 30);
};

window.toggleModeQuick = function() {
    if(window.currentMode === 'pt') {
        window.switchMode('personal');
        window.deactivatePTMode();
    } else {
        window.switchMode('pt');
        window.activatePTMode();
    }
    window.updateFloatingModeBtn();
};

window.updateFloatingModeBtn = function() {
    var btn = document.getElementById('floatingModeSwitch');
    if(!btn) return;
    if(!window.userProfile || !window.userProfile.widgets || !window.userProfile.widgets.ptMode) {
        btn.style.display = 'none';
        return;
    }
    btn.style.display = 'flex';
    if(window.currentMode === 'pt') {
        btn.style.background = 'rgba(6,182,212,0.15)';
        btn.style.border = '1px solid rgba(6,182,212,0.3)';
        btn.innerHTML = '<i data-lucide="dumbbell" class="w-5 h-5 pointer-events-none" style="color:#06b6d4"></i>';
    } else {
        btn.style.background = 'rgba(99,102,241,0.15)';
        btn.style.border = '1px solid rgba(99,102,241,0.3)';
        btn.innerHTML = '<i data-lucide="users" class="w-5 h-5 pointer-events-none" style="color:#6366f1"></i>';
    }
    if(window.lucide) lucide.createIcons();
};

// ============================================================
// NUTRITION PROFIL SYSTEM
// ============================================================

window._NUTRITION_PROFILE_KEY = 'base_nutrition_profile';

window._getNutritionProfile = function() {
  return JSON.parse(
    localStorage.getItem(window._NUTRITION_PROFILE_KEY) || '{}'
  );
};

window._saveNutritionProfile = function(data) {
  var existing = window._getNutritionProfile();
  var merged = Object.assign({}, existing, data);
  localStorage.setItem(window._NUTRITION_PROFILE_KEY, JSON.stringify(merged));
  window._syncNutritionProfile(merged);
};

window._syncNutritionProfile = async function(profile) {
  try {
    var db = window._db || window._fbDb;
    var auth = window._fbAuth;
    if (!db || !auth || !auth.currentUser) return;
    var mod = window._firestoreModule;
    if (!mod || !mod.doc || !mod.setDoc) return;
    await mod.setDoc(mod.doc(db, 'artifacts/base-v2-beta-test/users/' + auth.currentUser.uid + '/pt_data', 'nutrition_profile'), Object.assign({}, profile, { updatedAt: new Date().toISOString() }), { merge: true });
  } catch(e) { console.warn('[Nutrition] Sync:', e.message); }
};

window.openNutritionSetup = function() {
  document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(function(m) {
    if (m.id !== 'nutritionSetupModal') { m.classList.add('hidden'); m.classList.remove('flex'); }
  });
  var p = window._getNutritionProfile();
  var modal = document.getElementById('nutritionSetupModal');
  if (!modal) return;

  var fields = ['weight','height','age','gender','activityLevel','goal','intolerances','medicalNotes'];
  fields.forEach(function(f) {
    var el = document.getElementById('ns_' + f);
    if (el && p[f] !== undefined && p[f] !== null) el.value = p[f];
  });

  var ALLERGIES = ['laktose','gluten','nuesse','eier','soja','fisch','schalentiere'];
  ALLERGIES.forEach(function(a) {
    var el = document.getElementById('ns_allergy_' + a);
    if (el) el.checked = !!(p.allergies && p.allergies.indexOf(a) !== -1);
  });

  // Ernaehrungsform Cards rendern
  if (window._renderDietTypeCards) window._renderDietTypeCards(p.dietType || 'flexible');

  window.toggleModal('nutritionSetupModal');

  // Live Preview nach kurzem Delay aktualisieren
  setTimeout(function() { if (window._updateNutritionCalcPreview) window._updateNutritionCalcPreview(); }, 150);
};

window.saveNutritionSetup = function() {
  var ALLERGIES = ['laktose','gluten','nuesse','eier','soja','fisch','schalentiere'];
  var allergies = ALLERGIES.filter(function(a) {
    var el = document.getElementById('ns_allergy_' + a);
    return el && el.checked;
  });

  var profile = {
    weight:       parseFloat(document.getElementById('ns_weight')?.value) || null,
    height:       parseFloat(document.getElementById('ns_height')?.value) || null,
    age:          parseInt(document.getElementById('ns_age')?.value) || null,
    gender:       document.getElementById('ns_gender')?.value || 'male',
    activityLevel: document.getElementById('ns_activityLevel')?.value || 'moderate',
    goal:         document.getElementById('ns_goal')?.value || 'maintain',
    dietType:     window._pendingDietType || 'flexible',
    allergies:    allergies,
    intolerances: document.getElementById('ns_intolerances')?.value || '',
    medicalNotes: document.getElementById('ns_medicalNotes')?.value || '',
    setupComplete: true
  };

  // Automatische Berechnung via Mifflin-St Jeor + PAL + Diaet + Sport
  var calculated = window._calculateNutritionTargets(profile);
  profile.calorieTarget  = calculated.calorieTarget;
  profile.proteinTarget  = calculated.proteinTarget;
  profile.carbTarget     = calculated.carbTarget;
  profile.fatTarget      = calculated.fatTarget;
  profile.tdee           = calculated.tdee;
  profile.bmr            = calculated.bmr;
  profile.lastCalcFormula = calculated.formula;

  window._saveNutritionProfile(profile);

  // Backward-compatible targets in base_nutrition_targets
  var targets = {
    calories: calculated.calorieTarget,
    protein:  calculated.proteinTarget,
    carbs:    calculated.carbTarget,
    fat:      calculated.fatTarget,
    mealsPerDay: 4,
    proteinPerMeal: Math.round(calculated.proteinTarget / 4),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem('base_nutrition_targets', JSON.stringify(targets));

  // Inline-Ergebnis im Setup anzeigen
  var adjLabel = calculated.goalAdj > 0 ? '+' + calculated.goalAdj : calculated.goalAdj === 0 ? '\u00B10' : String(calculated.goalAdj);
  var resultEl = document.getElementById('nutritionCalcResult');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    var sportLine = calculated.sportAdj ? '<p style="font-size:10px;color:#4ab8d4;margin-top:4px">\u26A1 ' + window._escapeHtml(calculated.sportAdj) + ' (+' + calculated.sportCalBonus + ' kcal)</p>' : '';
    var suppLine  = calculated.supplements && calculated.supplements.length > 0 ? '<p style="font-size:10px;color:#e88a8a;margin-top:4px">Supplement-Check: ' + calculated.supplements.join(', ') + '</p>' : '';
    resultEl.innerHTML =
      '<p style="font-size:13px;font-weight:700;color:var(--primary-hex);margin-bottom:6px">TDEE: ' + calculated.tdee.toLocaleString() + ' kcal \u00B7 Ziel: ' + calculated.calorieTarget.toLocaleString() + ' kcal (' + adjLabel + ')</p>' +
      '<p style="font-size:11px;color:var(--text-muted);margin-bottom:4px">' + (calculated.dietEmoji || '') + ' ' + (calculated.dietLabel || '') + ' \u00B7 ' + calculated.proteinTarget + 'g P \u00B7 ' + calculated.carbTarget + 'g C \u00B7 ' + calculated.fatTarget + 'g F</p>' +
      sportLine + suppLine +
      '<p style="font-size:9px;color:var(--text-muted);margin-top:4px">' + calculated.formula + '</p>';
  }

  window.showToast('Tagesziele: ' + calculated.calorieTarget + ' kcal \u00B7 ' + calculated.proteinTarget + 'g Protein');
};

// ============================================================
// ERNAEHRUNGSFORMEN DEFINITIONEN
// ============================================================

window._DIET_TYPES = {
  flexible: {
    id: 'flexible', label: 'Flexibel', emoji: '\uD83D\uDD13',
    description: 'Keine Einschraenkung \u2014 einfach Kalorien und Makros tracken',
    carbPct: 0.45, proteinPct: 0.25, fatPct: 0.30,
    isDefault: true,
    notes: 'Keine diaetspezifischen Einschraenkungen. Makros werden nach Ziel und Sport berechnet.'
  },
  balanced: {
    id: 'balanced', label: 'Ausgewogen', emoji: '\u2696\uFE0F',
    description: 'Klassische Makro-Verteilung \u2014 fuer die meisten Ziele ideal',
    carbPct: 0.45, proteinPct: 0.25, fatPct: 0.30,
    notes: 'DGE Empfehlung \u2014 ausgewogene Basis fuer Gesundheit und Performance'
  },
  highProtein: {
    id: 'highProtein', label: 'High Protein', emoji: '\uD83D\uDCAA',
    description: 'Maximaler Muskelaufbau und Fettabbau bei Erhalt der Muskelmasse',
    carbPct: 0.35, proteinPct: 0.40, fatPct: 0.25,
    proteinMultiplier: 2.4,
    notes: 'Schoenfeld & Aragon 2018: >1.6g/kg fuer maximale Hypertrophie'
  },
  lowCarb: {
    id: 'lowCarb', label: 'Low Carb', emoji: '\uD83E\uDD69',
    description: 'Weniger als 100g Carbs/Tag \u2014 gut fuer Fettabbau und Insulinsensitivitaet',
    carbPct: 0.15, proteinPct: 0.35, fatPct: 0.50, maxCarbsG: 100,
    notes: 'Carbs <100g/Tag. Fuer Ausdauersport nicht empfohlen.'
  },
  keto: {
    id: 'keto', label: 'Ketogen', emoji: '\uD83E\uDD51',
    description: 'Unter 30g Carbs/Tag \u2014 maximale Fettverbrennung via Ketose',
    carbPct: 0.05, proteinPct: 0.25, fatPct: 0.70, maxCarbsG: 30,
    notes: 'Vollmer et al. 2017: Adaptationsphase 3-6 Wochen noetig. Fuer Kraftsport suboptimal.'
  },
  highCarb: {
    id: 'highCarb', label: 'High Carb', emoji: '\uD83C\uDF5A',
    description: 'Optimale Glykogen-Versorgung \u2014 ideal fuer Ausdauer und Teamsport',
    carbPct: 0.60, proteinPct: 0.20, fatPct: 0.20,
    notes: 'Burke 2011: Hohe Carb-Verfuegbarkeit fuer Hochintensitaetsausdauer'
  },
  carbCycling: {
    id: 'carbCycling', label: 'Carb Cycling', emoji: '\uD83D\uDD04',
    description: 'Hohe Carbs an Trainingstagen, niedrig an Ruhetagen',
    carbPct: 0.45, proteinPct: 0.30, fatPct: 0.25,
    trainingDayCarbBoost: 1.5, restDayCarbReduction: 0.5,
    notes: 'Effektiv fuer Body Recomposition \u2014 Muskeln aufbauen und Fett abbauen gleichzeitig'
  },
  mediterranean: {
    id: 'mediterranean', label: 'Mediterran', emoji: '\uD83E\uDED2',
    description: 'Herzgesund, anti-entzuendlich \u2014 ideal fuer Langzeiterfolg',
    carbPct: 0.45, proteinPct: 0.20, fatPct: 0.35,
    notes: 'Estruch et al. 2018 NEJM: Staerkste Evidenz fuer Herz-Kreislauf-Gesundheit'
  },
  vegan: {
    id: 'vegan', label: 'Vegan / Plant-Based', emoji: '\uD83C\uDF31',
    description: 'Pflanzlich \u2014 hoeheres Protein-Ziel wegen geringerer Bioverfuegbarkeit',
    carbPct: 0.50, proteinPct: 0.25, fatPct: 0.25,
    proteinMultiplier: 2.0,
    supplementWarnings: ['Vitamin B12', 'Omega-3 (DHA/EPA)', 'Zink', 'Eisen', 'Kalzium'],
    notes: 'Lynch 2019: Pflanzliche Proteine 20-30% mehr noetig wegen niedrigerer DIAAS'
  },
  vegetarian: {
    id: 'vegetarian', label: 'Vegetarisch', emoji: '\uD83E\uDD5A',
    description: 'Ohne Fleisch \u2014 ausgewogen mit Eiern und Milchprodukten',
    carbPct: 0.48, proteinPct: 0.22, fatPct: 0.30,
    proteinMultiplier: 1.8,
    notes: 'Gut machbar mit Eiern, Milchprodukten und Huelsenfruechten als Protein-Basis'
  },
  paleo: {
    id: 'paleo', label: 'Paleo', emoji: '\uD83E\uDDB4',
    description: 'Unverarbeitete Lebensmittel \u2014 kein Getreide, keine Huelsenfruechte',
    carbPct: 0.25, proteinPct: 0.35, fatPct: 0.40,
    notes: 'Carbs hauptsaechlich aus Gemuese und Obst. Getreide und Huelsenfruechte gemieden.'
  },
  intermittentFasting: {
    id: 'intermittentFasting', label: 'Intervallfasten (16:8)', emoji: '\u23F0',
    description: '16h fasten, 8h Essensfenster \u2014 Kalorien bleiben gleich',
    carbPct: 0.45, proteinPct: 0.25, fatPct: 0.30,
    notes: 'Harris et al. 2018: Gewichtsverlust hauptsaechlich durch Kalorienreduktion, nicht Fasten selbst'
  }
};

// ============================================================
// SPORT-SPEZIFISCHE MAKRO-ANPASSUNGEN
// ============================================================

window._SPORT_NUTRITION_ADJUSTMENTS = {
  krafttraining: {
    label: 'Krafttraining / Bodybuilding',
    proteinBoost: 0.3, carbPctBoost: 0, calorieBoost: 200,
    preWorkout: 'Carbs 1-2h vor Training fuer Kraft-Output (Stark et al. 2012)',
    postWorkout: '20-40g Protein + schnelle Carbs in 2h nach Training (Schoenfeld & Aragon 2018)',
    science: 'Morton 2018: 1.62g/kg/Tag optimal fuer Hypertrophie'
  },
  ausdauer: {
    label: 'Ausdauer / Laufen / Radfahren',
    proteinBoost: 0.1, carbPctBoost: 0.10, calorieBoost: 300,
    preWorkout: 'Carb-Loading 24-48h vor langen Einheiten (>90min)',
    postWorkout: '3:1 Carb:Protein Ratio fuer optimale Glykogen-Resynthese (Ivy 2004)',
    science: 'Burke 2011: Hohe Carb-Verfuegbarkeit fuer Hochintensitaetsausdauer critical'
  },
  teamsport: {
    label: 'Teamsport (Fussball, Basketball etc.)',
    proteinBoost: 0.2, carbPctBoost: 0.08, calorieBoost: 250,
    preWorkout: 'Carbs 2-3h vor Spiel fuer Glykogen-Verfuegbarkeit',
    postWorkout: 'Protein + Carbs innerhalb 30min nach Spiel fuer schnellste Erholung',
    science: 'Maughan & Burke 2012: Spieler verlieren 1-3L Schweiss \u2014 Hydration kritisch'
  },
  kampfsport: {
    label: 'Kampfsport / MMA / Boxing',
    proteinBoost: 0.4, carbPctBoost: 0.05, calorieBoost: 0,
    preWorkout: 'Leicht verdauliche Carbs 2h vorher \u2014 kein schwerer Magen',
    postWorkout: 'Hohe Protein-Zufuhr fuer Muskelreparatur nach Kontaktsport',
    science: 'Optimale Leistung bei minimalem Koerpergewicht \u2014 Protein-Prioritaet'
  },
  yoga: {
    label: 'Yoga / Pilates / Mobility',
    proteinBoost: 0, carbPctBoost: -0.05, calorieBoost: -100,
    preWorkout: 'Leichter Magen \u2014 nichts 2h vor dem Training',
    postWorkout: 'Anti-entzuendliche Lebensmittel: Ingwer, Kurkuma, Beeren',
    science: 'Fokus auf Mikronaehrstoffe und anti-entzuendliche Ernaehrung'
  },
  klettern: {
    label: 'Klettern',
    proteinBoost: 0.2, carbPctBoost: 0, calorieBoost: 100,
    preWorkout: 'Leichter Magen \u2014 kein Essen 2h vor dem Klettern',
    postWorkout: 'Protein fuer Finger/Sehnen-Reparatur + Kollagen (Shaw et al. 2017)',
    science: 'Kollagen + Vitamin C 1h vor Training fuer Sehnen-Adaptation (Shaw 2017)'
  },
  racketSport: {
    label: 'Racket-Sport (Tennis, Squash, Badminton)',
    proteinBoost: 0.15, carbPctBoost: 0.05, calorieBoost: 150,
    preWorkout: 'Leichte Carbs 1-2h vor Match \u2014 kein voller Magen',
    postWorkout: 'Protein + Carbs fuer Schulter-Regeneration',
    science: 'Intermittierende Hochintensitaet \u2014 Glykogen + Kraft kombiniert'
  },
  schwimmen: {
    label: 'Schwimmen',
    proteinBoost: 0.1, carbPctBoost: 0.08, calorieBoost: 200,
    preWorkout: '2h vor dem Schwimmen \u2014 volles Magen-Risiko vermeiden',
    postWorkout: '3:1 Carb:Protein nach intensiven Einheiten',
    science: 'Hoher Energieverbrauch durch Wasserwiderstand + Thermoregulation'
  },
  triathlon: {
    label: 'Triathlon / Mehrkampf',
    proteinBoost: 0.15, carbPctBoost: 0.12, calorieBoost: 400,
    preWorkout: 'Carb-Loading 24-48h vor Wettkampf (7-10g/kg/Tag)',
    postWorkout: 'Sofortige Kohlenhydrate + Protein nach jeder Disziplin',
    science: 'Burke 2011: Hoechster Energiebedarf aller Ausdauersportarten'
  },
  radfahren: {
    label: 'Radfahren / Cycling',
    proteinBoost: 0.1, carbPctBoost: 0.10, calorieBoost: 300,
    preWorkout: 'Carb-Loading bei Etappen >2h, Gels/Riegel waehrend Einheit',
    postWorkout: '1.2g/kg Carbs in 4h nach langer Fahrt',
    science: 'Hargreaves 2015: Race nutrition entscheidet mehr als Training'
  },
  golf: {
    label: 'Golf / Praezisionssport',
    proteinBoost: 0.0, carbPctBoost: 0.0, calorieBoost: 50,
    preWorkout: 'Stabiler Blutzucker fuer Konzentration \u2014 keine Zucker-Spikes',
    postWorkout: 'Ausgewogene Mahlzeit, keine besonderen Anforderungen',
    science: 'Kognitive Performance: stabiler Blutzucker wichtiger als Glykogen-Maximierung'
  },
  tanzen: {
    label: 'Tanzen / Turnen / Artistik',
    proteinBoost: 0.2, carbPctBoost: 0.05, calorieBoost: 150,
    preWorkout: 'Leicht verdauliche Carbs 1-2h vor Auffuehrung',
    postWorkout: 'Protein fuer Sehnen/Gelenk-Regeneration',
    science: 'Hohe aesthetische Anforderungen \u2014 Protein fuer Koerperkomposition wichtig'
  }
};

// Sport-Erkennung aus Workout-Historie
window._detectUserSports = function() {
  var workouts = window.workouts || [];
  var recent = workouts.slice(0, 30);
  var sports = [];
  recent.forEach(function(w) {
    if (w.exercise) sports.push(w.exercise.toLowerCase());
    if (w.sportType) sports.push(w.sportType.toLowerCase());
  });
  return sports;
};

// Sport zu Anpassungs-Mapping (12 Kategorien)
window._mapSportToNutritionAdjustment = function() {
  var sports = window._detectUserSports();
  if (sports.length === 0) return null;

  var joined = sports.join(' ');
  var adj = window._SPORT_NUTRITION_ADJUSTMENTS;

  // Kraftsport
  if (joined.match(/kraft|gym|bodybuilding|powerlifting|crossfit|gewichtheben|bankdr|kniebeug|kreuzh/)) return adj.krafttraining;
  // Triathlon (vor Ausdauer pruefen)
  if (joined.match(/triathlon|duathlon/)) return adj.triathlon;
  // Radfahren (vor Ausdauer pruefen)
  if (joined.match(/rad|cycling|bike|mtb/)) return adj.radfahren;
  // Schwimmen (vor Ausdauer pruefen)
  if (joined.match(/schwimm|swim/)) return adj.schwimmen;
  // Ausdauer
  if (joined.match(/lauf|run|marathon|joggen|jogging|ausdauer|trail/)) return adj.ausdauer;
  // Teamsport
  if (joined.match(/fussball|fu\u00DFball|basketball|volleyball|handball|hockey|rugby|football|soccer/)) return adj.teamsport;
  // Racket-Sport
  if (joined.match(/tennis|squash|badminton|tischtennis|racket|padel/)) return adj.racketSport;
  // Kampfsport
  if (joined.match(/kampf|mma|boxing|boxen|judo|karate|ringen|kickbox|bjj|muay|taekwondo|wrestling/)) return adj.kampfsport;
  // Golf / Praezision
  if (joined.match(/golf|bogenschie|billard|dart|schiessen/)) return adj.golf;
  // Tanzen / Artistik
  if (joined.match(/tanz|ballet|turnen|artistik|cheerleading|gymnastik/)) return adj.tanzen;
  // Yoga / Mobility
  if (joined.match(/yoga|pilates|stretch|mobility|dehnung|meditation/)) return adj.yoga;
  // Klettern
  if (joined.match(/klett|boulder|climb/)) return adj.klettern;

  return null;
};

// ============================================================
// WETTKAMPF-COACH SYSTEM
// ============================================================

window._COMPETITION_KEY = 'base_competition_goals';

window._COMPETITION_TYPES = {
  triathlon: {
    label: 'Triathlon', emoji: '\uD83C\uDFCA\u200D\u2642\uFE0F',
    subtypes: ['Sprint', 'Olympisch', 'Half-Ironman', 'Ironman'],
    minWeeks: 4, maxWeeks: 24,
    phases: function(weeks) {
      if (weeks >= 12) return [
        { name: 'Grundlagenausdauer', pct: 0.40, focus: 'Aerobe Basis, niedrige Intensitaet, hohe Distanz' },
        { name: 'Aufbau', pct: 0.30, focus: 'Schwellentraining, Brickworkouts, Kraft' },
        { name: 'Peak / Spezifisch', pct: 0.20, focus: 'Wettkampfspezifische Intensitaet, Race-Pace' },
        { name: 'Taper', pct: 0.10, focus: 'Volumenreduktion -50%, Intensitaet halten' }
      ];
      if (weeks >= 6) return [
        { name: 'Aufbau', pct: 0.50, focus: 'Aerobe Basis + Schwellentraining' },
        { name: 'Peak', pct: 0.30, focus: 'Race-Pace Einheiten' },
        { name: 'Taper', pct: 0.20, focus: 'Volumen -40%, frisch bleiben' }
      ];
      return [
        { name: 'Spezifisch', pct: 0.60, focus: 'Race-Pace, Bricks' },
        { name: 'Taper', pct: 0.40, focus: 'Frisch werden' }
      ];
    },
    taperWeeks: 1, carbLoadDays: 3,
    nutritionProtocol: {
      buildPhase: 'Carbs 6-8g/kg/Tag, Protein 1.6g/kg (Burke 2011)',
      peakPhase: 'Carbs 8-10g/kg/Tag, erhoehte Fluessigkeitszufuhr',
      taperPhase: 'Carbs schrittweise steigern auf 10-12g/kg/Tag',
      raceDay: 'Fruehstueck 3h vorher: Porridge + Banane. Waehrend: 60g Carbs/h (Gels/Riegel)',
      postRace: '1.2g/kg Carbs + 0.4g/kg Protein in 30min fuer Erholung'
    },
    science: 'Burke 2011, Jeukendrup 2017 Race Nutrition, Maughan & Burke 2012'
  },
  marathon: {
    label: 'Marathon / Halbmarathon', emoji: '\uD83C\uDFC3',
    subtypes: ['5km', '10km', 'Halbmarathon', 'Marathon', 'Ultra'],
    minWeeks: 4, maxWeeks: 20,
    phases: function(weeks) {
      if (weeks >= 16) return [
        { name: 'Basis', pct: 0.35, focus: 'Easy Runs, Grundlage, Krafttraining' },
        { name: 'Aufbau', pct: 0.35, focus: 'Tempolaeufe, Long Runs steigern' },
        { name: 'Peak', pct: 0.20, focus: 'Marathon-Pace Laeufe, Race Simulation' },
        { name: 'Taper', pct: 0.10, focus: 'Volumen -50%, Easy Pace' }
      ];
      return [
        { name: 'Aufbau', pct: 0.55, focus: 'Ausdauerbasis + Tempo' },
        { name: 'Peak', pct: 0.25, focus: 'Race-Pace Einheiten' },
        { name: 'Taper', pct: 0.20, focus: 'Frisch werden' }
      ];
    },
    taperWeeks: 2, carbLoadDays: 3,
    nutritionProtocol: {
      buildPhase: 'Carbs 5-7g/kg/Tag, Protein 1.4-1.7g/kg',
      peakPhase: 'Carbs 7-8g/kg/Tag, Long Runs: 30-60g Carbs/h',
      taperPhase: 'Carbs erhoehen auf 8-10g/kg/Tag',
      raceDay: '3h vorher: Pasta/Reis + Banane. Ab km 30: Gels alle 20min',
      postRace: 'Elektrolyte + Protein-Shake + kohlenhydratreiche Mahlzeit'
    },
    science: 'Pfeiffer et al. 2012, Stellingwerff 2012 Marathon Nutrition'
  },
  bodybuilding: {
    label: 'Bodybuilding / Physique', emoji: '\uD83C\uDFC6',
    subtypes: ['Classic Physique', 'Mens Physique', 'Bikini', 'Bodybuilding'],
    minWeeks: 8, maxWeeks: 24,
    phases: function(weeks) {
      if (weeks >= 16) return [
        { name: 'Reverse Diet / Aufbau', pct: 0.25, focus: 'Kaloriensteigerung, Muskelaufbau maximieren' },
        { name: 'Diaet-Phase', pct: 0.50, focus: 'Kaloriendefizit -300-500kcal, Protein hoch' },
        { name: 'Peak Week', pct: 0.15, focus: 'Wasserretention manipulieren, Glykogen fuellen' },
        { name: 'Wettkampftag', pct: 0.10, focus: 'Backstage Nutrition, Pumping, Stage-Protokoll' }
      ];
      return [
        { name: 'Cut-Phase', pct: 0.65, focus: 'Aggressiveres Defizit, Protein maximal' },
        { name: 'Peak Week', pct: 0.20, focus: 'Carb Depletion \u2192 Carb Load' },
        { name: 'Show Day', pct: 0.15, focus: 'Backstage Nutrition' }
      ];
    },
    taperWeeks: 1, carbLoadDays: 2,
    nutritionProtocol: {
      buildPhase: 'Kalorienueberschuss +200-300kcal, Protein 2.0-2.4g/kg (Helms 2014)',
      cutPhase: 'Defizit -300-500kcal/Tag, Protein 2.3-3.1g/kg (Helms 2014)',
      peakWeek: 'Tag 1-3: Carb Depletion <50g. Tag 4-6: Carb Loading 8-10g/kg',
      showDay: 'Backstage: Reis-Waffeln + Erdnussbutter fuer Pump.'
    },
    science: 'Helms 2014 Natural BB Review, Trexler 2014 Metabolic Adaptation'
  },
  powerlifting: {
    label: 'Powerlifting / Kraftdreikampf', emoji: '\uD83C\uDFCB\uFE0F',
    subtypes: ['Lokal', 'Regional', 'National', 'IPF'],
    minWeeks: 6, maxWeeks: 16,
    phases: function(weeks) {
      return [
        { name: 'Hypertrophie', pct: 0.35, focus: 'Volumen hoch, 8-12 Reps, Technik' },
        { name: 'Kraft', pct: 0.35, focus: 'Intensitaet steigern, 3-6 Reps, 80-90% 1RM' },
        { name: 'Peak', pct: 0.20, focus: 'Maximalgewichte, 1-3 Reps, Opener waehlen' },
        { name: 'Taper', pct: 0.10, focus: 'Volumen -60%, Intensitaet halten' }
      ];
    },
    taperWeeks: 1, carbLoadDays: 1,
    nutritionProtocol: {
      buildPhase: 'Kalorienueberschuss +200-300kcal, Protein 1.8-2.2g/kg',
      peakPhase: 'Kalorien gleich, Carbs 4-6g/kg fuer Glykogen',
      meetDay: 'Weigh-in: Sofort Kohlenhydrate + Elektrolyte. Zwischen Versuchen: Gels, Bananen.'
    },
    science: 'Haff & Triplett NSCA, Zourdos 2016 Daily Undulating Periodization'
  },
  fussball: {
    label: 'Fussball / Teamsport', emoji: '\u26BD',
    subtypes: ['Einzelspiel', 'Turnier', 'Saisonvorbereitung'],
    minWeeks: 1, maxWeeks: 12,
    phases: function(weeks) {
      if (weeks >= 6) return [
        { name: 'Vorbereitung', pct: 0.50, focus: 'Grundlagenausdauer + Kraft, hohe Belastung' },
        { name: 'Aufbau', pct: 0.35, focus: 'Spielspezifische Einheiten, Taktik, Sprint' },
        { name: 'Tapering', pct: 0.15, focus: 'Belastung -30%, frisch und explosiv bleiben' }
      ];
      return [
        { name: 'Spielvorbereitung', pct: 0.70, focus: 'Kondition + Explosivitaet' },
        { name: 'Taper', pct: 0.30, focus: 'Frisch und explosiv' }
      ];
    },
    taperWeeks: 1, carbLoadDays: 1,
    nutritionProtocol: {
      buildPhase: 'Carbs 5-7g/kg/Tag, Protein 1.6g/kg, Hydration 2-3L/Tag',
      matchDay: '3-4h vorher: Reis + Haehnchen + Gemuese. 1h vorher: Banane',
      postMatch: 'In 30min: Protein-Shake + Banane. Abends: vollstaendige Mahlzeit'
    },
    science: 'Maughan & Burke 2012, Carling et al. 2011 Match Nutrition'
  },
  kampfsport: {
    label: 'Kampfsport / MMA', emoji: '\uD83E\uDD4A',
    subtypes: ['Punktekampf', 'K1-Turnier', 'MMA Fight', 'Guertelkampf'],
    minWeeks: 6, maxWeeks: 16,
    phases: function(weeks) {
      return [
        { name: 'Conditioning', pct: 0.40, focus: 'Kraft + Ausdauer, Techniktraining' },
        { name: 'Spezifisch', pct: 0.35, focus: 'Sparring, Kampfsimulation, Gewichtsmanagement' },
        { name: 'Cut / Peak', pct: 0.15, focus: 'Gewichtsklasse erreichen, Kraft halten' },
        { name: 'Fight Week', pct: 0.10, focus: 'Rehydration, Aktivierung, mentale Vorbereitung' }
      ];
    },
    taperWeeks: 1, carbLoadDays: 1,
    nutritionProtocol: {
      buildPhase: 'Protein 2.2-2.6g/kg, Carbs fuer Energie, Kalorienbilanz neutral',
      cutPhase: 'Moderates Defizit -300kcal, Protein maximal 2.8g/kg, kein extremes Cutting',
      fightDay: '3h vorher: leichte Carbs. 1h vorher: Banane + Koffein.',
      safetyWarning: 'WICHTIG: Extremes Cutting (>5% BW in Tagen) ist gefaehrlich!'
    },
    science: 'Artioli 2010 Weight Cutting, Franchini 2012 Combat Sports Nutrition'
  },
  crossfit: {
    label: 'CrossFit / Functional', emoji: '\uD83D\uDD25',
    subtypes: ['Open', 'Regionals', 'Games', 'Local Competition'],
    minWeeks: 4, maxWeeks: 16,
    phases: function(weeks) {
      return [
        { name: 'Strength Base', pct: 0.40, focus: 'Kraft + Olympisches Gewichtheben, Skill Work' },
        { name: 'Conditioning', pct: 0.35, focus: 'WOD-Intensitaet steigern, Competition Prep' },
        { name: 'Peak + Taper', pct: 0.25, focus: 'WOD-Simulation, Volumen -40%, frisch bleiben' }
      ];
    },
    taperWeeks: 1, carbLoadDays: 1,
    nutritionProtocol: {
      buildPhase: 'Hohe Carbs 5-7g/kg + Protein 1.8-2.2g/kg fuer kombinierte Anforderungen',
      compDay: '2h vorher: Reis + Protein. Zwischen WODs: Gels + Bananen + Elektrolyte.',
      postComp: 'Vollstaendige Erholung: Protein + Carbs + Schlafen'
    },
    science: 'Tabata 1996, Schoenfeld Concurrent Training'
  },
  schwimmen: {
    label: 'Schwimm-Wettkampf', emoji: '\uD83C\uDFCA',
    subtypes: ['50m', '100m', '400m', '1500m', 'Open Water'],
    minWeeks: 4, maxWeeks: 16,
    phases: function(weeks) {
      return [
        { name: 'Volumen', pct: 0.45, focus: 'Hohe Distanz, Technik, aerobes System' },
        { name: 'Intensitaet', pct: 0.35, focus: 'Intervalle, Race Pace, Sprinttraining' },
        { name: 'Taper', pct: 0.20, focus: 'Volumen -50-70%, Intensitaet halten' }
      ];
    },
    taperWeeks: 2, carbLoadDays: 2,
    nutritionProtocol: {
      buildPhase: 'Carbs 6-8g/kg, erhoehter Energiebedarf wegen Thermoregulation',
      raceDay: '2-3h vorher: leicht verdauliche Carbs. Zwischen Laeufen: Gels.',
      hydration: 'Im Wasser spuert man Schwitzen nicht \u2014 500ml vor + nach Training'
    },
    science: 'Costill 1988 Swimming Nutrition, Burke 2011'
  }
};

// Wettkampf-Speicherung
window._getCompetitions = function() {
  return JSON.parse(localStorage.getItem(window._COMPETITION_KEY) || '[]');
};

window._saveCompetition = function(comp) {
  var comps = window._getCompetitions();
  comp.id = 'comp_' + Date.now();
  comp.createdAt = new Date().toISOString();
  comps.unshift(comp);
  comps = comps.slice(0, 10);
  localStorage.setItem(window._COMPETITION_KEY, JSON.stringify(comps));
  return comp;
};

window._deleteCompetition = function(id) {
  var comps = window._getCompetitions().filter(function(c) { return c.id !== id; });
  localStorage.setItem(window._COMPETITION_KEY, JSON.stringify(comps));
};

window._getActiveCompetition = function() {
  var comps = window._getCompetitions();
  var today = new Date().toISOString().split('T')[0];
  return comps.find(function(c) { return c.date >= today; }) || null;
};

window._weeksUntilComp = function(dateStr) {
  var diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.round(diff / (7 * 86400000)));
};

window._getCurrentCompPhase = function(comp) {
  var weeksTotal = window._weeksUntilComp(comp.date);
  var type = window._COMPETITION_TYPES[comp.type];
  if (!type) return null;
  var planned = comp.weeksPlanned || weeksTotal || 12;
  var phases = type.phases(planned);
  var weeksDone = planned - weeksTotal;
  var cumulativePct = 0;
  for (var i = 0; i < phases.length; i++) {
    cumulativePct += phases[i].pct;
    var phaseEndWeek = Math.round(cumulativePct * planned);
    if (weeksDone <= phaseEndWeek) {
      return { phase: phases[i], phaseIndex: i, totalPhases: phases.length, weeksLeft: weeksTotal };
    }
  }
  return { phase: phases[phases.length - 1], weeksLeft: weeksTotal };
};

// KI Wettkampfplan generieren
window._generateCompetitionPlan = async function(compId) {
  var comps = window._getCompetitions();
  var comp = comps.find(function(c) { return c.id === compId; });
  if (!comp) return;

  var type = window._COMPETITION_TYPES[comp.type];
  if (!type) { window.showToast('Unbekannter Wettkampftyp', 'error'); return; }
  var weeks = window._weeksUntilComp(comp.date);
  var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
  var aiCtx = window.buildAIContext ? window.buildAIContext() : { prof: '', recentWorkouts: '' };

  if (weeks < 1) { window.showToast('Wettkampf liegt in der Vergangenheit', 'error'); return; }

  var phases = type.phases(weeks);
  var nutrProt = type.nutritionProtocol || {};

  var prompt =
    'Du bist ein Elite-Wettkampfcoach mit Expertise in ' + type.label +
    '. Erstelle einen DETAILLIERTEN ' + weeks + '-Wochen Wettkampfvorbereitungsplan.\n\n' +
    'WETTKAMPF-DETAILS:\n- Disziplin: ' + type.label + (comp.subtype ? ' (' + comp.subtype + ')' : '') +
    '\n- Datum: ' + comp.date + '\n- Wochen bis Wettkampf: ' + weeks +
    (comp.goal ? '\n- Ziel: ' + comp.goal : '') +
    (comp.notes ? '\n- Notizen: ' + comp.notes : '') +
    '\n\nATHLETEN-PROFIL:\n' + aiCtx.prof +
    '\nTRAININGSHISTORIE:\n' + (aiCtx.recentWorkouts || 'Keine Daten') +
    '\n\nPERIODISIERUNG fuer ' + weeks + ' Wochen:\n' +
    phases.map(function(p, i) {
      return 'Phase ' + (i + 1) + ' \u2014 ' + p.name + ' (' + Math.max(1, Math.round(p.pct * weeks)) + ' Wochen): ' + p.focus;
    }).join('\n') +
    '\n\nWISSENSCHAFTLICHE BASIS: ' + (type.science || '') +
    '\n\nERNAEHRUNGS-PROTOKOLL:\n' +
    Object.entries(nutrProt).map(function(e) { return '- ' + e[0] + ': ' + e[1]; }).join('\n') +
    '\n\nERSTELLE (strukturiert, detailliert):\n' +
    '## 1. TRAININGSPLAN UEBERSICHT\nFuer jede Phase: Wochentage, Trainingsarten, Umfang, Intensitaet.\n' +
    '## 2. ERNAEHRUNGSPLAN PRO PHASE\nKalorien, Makros, Timing. Konkrete Mahlzeiten-Beispiele.\n' +
    '## 3. PEAK WEEK / WETTKAMPFWOCHE\nTag-fuer-Tag Protokoll.\n' +
    '## 4. WETTKAMPFTAG PROTOKOLL\nStuendlicher Plan von Aufwachen bis Wettkampf.\n' +
    '## 5. SUPPLEMENT-EMPFEHLUNGEN\nNur evidenzbasierte Supplements mit Dosierung.\n' +
    '## 6. WARNSIGNALE\nHaeufige Fehler bei ' + type.label + '.\n\n' +
    'Nur evidenzbasierte Aussagen. Antworte auf Deutsch. Sei konkret und umsetzbar.';

  window.showModal(
    type.emoji + ' ' + type.label + ' Wettkampfplan',
    '<div style="text-align:center;padding:20px"><p style="font-size:13px;color:var(--text-muted)">KI erstellt deinen ' + weeks + '-Wochen Plan...</p></div>',
    false
  );

  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 30000);
    var res = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, type: 'competition_plan', maxTokens: 4000 }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var text = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '';

    comp.plan = text;
    comp.planDate = new Date().toISOString();
    var idx = comps.findIndex(function(c) { return c.id === compId; });
    if (idx !== -1) comps[idx] = comp;
    localStorage.setItem(window._COMPETITION_KEY, JSON.stringify(comps));

    window.showModal(
      type.emoji + ' ' + type.label + ' \u2014 ' + weeks + '-Wochen Plan',
      '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap;max-height:70vh;overflow-y:auto;padding-right:4px">' +
        window._sanitizeAIHtml(text) + '</div>',
      false
    );
    if (window.awardXP) window.awardXP('scan', 50);
  } catch (e) {
    window.showToast('Plan-Generierung fehlgeschlagen: ' + e.message, 'error');
  }
};

// Wettkampf-Coach UI
window.openCompetitionCoach = function() {
  window.toggleModal('competitionCoachModal');
  window._renderCompetitionCoach();
};

window._selectedCompType = null;

window._renderCompetitionCoach = function() {
  var container = document.getElementById('compCoachContainer');
  if (!container) return;

  var comps = window._getCompetitions();
  var today = new Date().toISOString().split('T')[0];
  var upcoming = comps.filter(function(c) { return c.date >= today; });
  var past = comps.filter(function(c) { return c.date < today; });
  var html = '';

  // Aktiver Wettkampf Banner
  if (upcoming.length > 0) {
    var next = upcoming[0];
    var weeks = window._weeksUntilComp(next.date);
    var type = window._COMPETITION_TYPES[next.type] || {};
    var phase = window._getCurrentCompPhase(next);
    html +=
      '<div style="padding:14px;background:color-mix(in srgb,var(--primary-hex),transparent 90%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 70%);border-radius:13px;margin-bottom:14px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
        '<span style="font-size:24px">' + (type.emoji || '\uD83C\uDFC6') + '</span>' +
        '<div style="flex:1"><p style="font-size:14px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(next.name || next.type) + '</p>' +
        '<p style="font-size:11px;color:var(--text-muted)">' + next.date + ' \u00B7 noch ' + weeks + ' Wochen</p></div></div>' +
      (phase ? '<div style="padding:8px 10px;background:var(--inner-bg-hex);border-radius:9px;margin-bottom:10px">' +
        '<p style="font-size:10px;font-weight:700;color:var(--primary-hex);margin-bottom:2px">Aktuelle Phase: ' + window._escapeHtml(phase.phase.name) + '</p>' +
        '<p style="font-size:10px;color:var(--text-muted)">' + window._escapeHtml(phase.phase.focus) + '</p></div>' : '') +
      '<div style="display:flex;gap:8px">' +
        '<button onclick="window._generateCompetitionPlan(\'' + next.id + '\')" class="pointer-events-auto" aria-label="Plan generieren" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">\u2728 Plan generieren</button>' +
        (next.plan ? '<button onclick="window._showSavedPlan(\'' + next.id + '\')" class="pointer-events-auto" aria-label="Gespeicherter Plan" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\uD83D\uDCCB Plan ansehen</button>' : '') +
      '</div></div>';
  }

  // Neuen Wettkampf hinzufuegen
  html +=
    '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:10px">+ Wettkampf hinzuf\u00FCgen</p>' +
    '<div style="margin-bottom:10px"><input id="compNameInput" type="text" placeholder="z.B. M\u00FCnchen Marathon, IPF Nationals..." aria-label="Wettkampf Name" class="pointer-events-auto w-full" style="padding:10px 12px;border-radius:10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:13px;outline:none"/></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">' +
      '<div><p style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Datum</p><input id="compDateInput" type="date" aria-label="Wettkampf Datum" class="pointer-events-auto w-full" style="padding:9px 10px;border-radius:9px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:13px;outline:none"/></div>' +
      '<div><p style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Subtyp</p><input id="compSubtypeInput" type="text" placeholder="z.B. Ironman, Classic..." aria-label="Subtyp" class="pointer-events-auto w-full" style="padding:9px 10px;border-radius:9px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:13px;outline:none"/></div>' +
    '</div>' +
    '<p style="font-size:10px;color:var(--text-muted);margin-bottom:6px">Wettkampftyp</p>' +
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:10px">';

  Object.keys(window._COMPETITION_TYPES).forEach(function(key) {
    var t = window._COMPETITION_TYPES[key];
    html +=
      '<button onclick="window._selectCompType(\'' + key + '\')" id="compTypeBtn_' + key + '" class="pointer-events-auto" aria-label="' + t.label + '" ' +
      'style="padding:9px;border-radius:10px;text-align:left;cursor:pointer;background:var(--inner-bg-hex);border:1px solid var(--border-hex)">' +
      '<p style="font-size:13px;margin-bottom:2px">' + t.emoji + '</p>' +
      '<p style="font-size:11px;font-weight:600;color:var(--text-main)">' + window._escapeHtml(t.label) + '</p></button>';
  });

  html += '</div>' +
    '<input id="compGoalInput" type="text" placeholder="Ziel (optional) \u2014 z.B. Sub-4h Marathon" aria-label="Ziel" class="pointer-events-auto w-full" style="padding:9px 12px;border-radius:10px;margin-bottom:10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:13px;outline:none"/>' +
    '<button onclick="window._saveAndGenerateComp()" class="pointer-events-auto w-full" aria-label="Wettkampf speichern" style="padding:13px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">\uD83C\uDFC6 Wettkampf speichern & Plan erstellen</button>';

  if (past.length > 0) {
    html += '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin:14px 0 8px">Vergangene Wettk\u00E4mpfe</p>';
    past.slice(0, 3).forEach(function(c) {
      var t = window._COMPETITION_TYPES[c.type] || {};
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-hex)">' +
        '<span style="font-size:16px">' + (t.emoji || '\uD83C\uDFC6') + '</span>' +
        '<div style="flex:1"><p style="font-size:12px;font-weight:600;color:var(--text-muted)">' + window._escapeHtml(c.name || c.type) + '</p>' +
        '<p style="font-size:10px;color:var(--text-muted)">' + c.date + '</p></div>' +
        (c.plan ? '<button onclick="window._showSavedPlan(\'' + c.id + '\')" class="pointer-events-auto" aria-label="Plan ansehen" style="font-size:10px;color:var(--primary-hex);background:none;border:none;cursor:pointer">Plan</button>' : '') +
        '</div>';
    });
  }

  container.innerHTML = html;
  window._refreshLucide();
};

window._selectCompType = function(typeKey) {
  window._selectedCompType = typeKey;
  document.querySelectorAll('[id^="compTypeBtn_"]').forEach(function(btn) {
    btn.style.background = 'var(--inner-bg-hex)';
    btn.style.borderColor = 'var(--border-hex)';
  });
  var sel = document.getElementById('compTypeBtn_' + typeKey);
  if (sel) {
    sel.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 88%)';
    sel.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 65%)';
  }
};

window._saveAndGenerateComp = function() {
  var name = (document.getElementById('compNameInput') || {}).value || '';
  var date = (document.getElementById('compDateInput') || {}).value || '';
  var subtype = (document.getElementById('compSubtypeInput') || {}).value || '';
  var goal = (document.getElementById('compGoalInput') || {}).value || '';
  if (!date) { window.showToast('Bitte Datum angeben', 'error'); return; }
  if (!window._selectedCompType) { window.showToast('Bitte Wettkampftyp w\u00E4hlen', 'error'); return; }
  var weeks = window._weeksUntilComp(date);
  if (weeks < 1) { window.showToast('Datum muss in der Zukunft liegen', 'error'); return; }
  var comp = window._saveCompetition({
    name: name || window._selectedCompType,
    type: window._selectedCompType,
    subtype: subtype,
    date: date,
    goal: goal,
    weeksPlanned: weeks
  });
  window.showToast('\uD83C\uDFC6 Wettkampf gespeichert!');
  window._generateCompetitionPlan(comp.id);
};

window._showSavedPlan = function(compId) {
  var comps = window._getCompetitions();
  var comp = comps.find(function(c) { return c.id === compId; });
  if (!comp || !comp.plan) return;
  var type = window._COMPETITION_TYPES[comp.type] || {};
  window.showModal(
    (type.emoji || '\uD83C\uDFC6') + ' Gespeicherter Wettkampfplan',
    '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap;max-height:70vh;overflow-y:auto">' + window._sanitizeAIHtml(comp.plan) + '</div>',
    false
  );
};

// Aktiver Wettkampf im KI-Kontext
window._getCompetitionContext = function() {
  var comp = window._getActiveCompetition();
  if (!comp) return '';
  var type = window._COMPETITION_TYPES[comp.type] || {};
  var weeks = window._weeksUntilComp(comp.date);
  var phase = window._getCurrentCompPhase(comp);
  var nutr = type.nutritionProtocol || {};
  var ctx = '\n\nAKTIVER WETTKAMPF:\n- Disziplin: ' + (type.label || comp.type) +
    '\n- Datum: ' + comp.date + ' (' + weeks + ' Wochen)' +
    (comp.goal ? '\n- Ziel: ' + comp.goal : '') +
    (phase ? '\n- Aktuelle Phase: ' + phase.phase.name + '\n- Phasen-Fokus: ' + phase.phase.focus : '') +
    '\n- Ernaehrung: ' + Object.values(nutr).slice(0, 2).join(' | ') +
    '\n\nWICHTIG: Alle Empfehlungen muessen auf diesen Wettkampf und die aktuelle Vorbereitungsphase ausgerichtet sein!';
  return ctx;
};

// ============================================================
// ERWEITERTE KALORIENBERECHNUNG MIT DIAET + SPORT
// ============================================================

window._calculateNutritionTargets = function(profile) {
  var weight   = parseFloat(profile.weight)   || 75;
  var height   = parseFloat(profile.height)   || 175;
  var age      = parseInt(profile.age)        || 25;
  var gender   = profile.gender               || 'male';
  var goal     = profile.goal                 || 'maintain';
  var activity = profile.activityLevel        || 'moderate';
  var dietType = profile.dietType             || 'flexible';

  // 1: BMR (Mifflin-St Jeor 2005)
  var bmr;
  if (gender === 'female' || gender === 'w') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  // 2: TDEE (PAL-Faktoren DGE)
  var palFactors = {
    sedentary: 1.2, light: 1.375, moderate: 1.55,
    active: 1.725, veryActive: 1.9
  };
  var pal  = palFactors[activity] || 1.55;
  var tdee = Math.round(bmr * pal);

  // 3: Ziel-Anpassung
  var goalAdjustments = { lose: -500, maintain: 0, gain: +300, recomp: -200 };
  var goalAdj = goalAdjustments[goal] || 0;

  // 4: Sport-Bonus
  var sportAdj       = window._mapSportToNutritionAdjustment();
  var sportCalBonus  = sportAdj ? (sportAdj.calorieBoost || 0) : 0;
  var sportProtBonus = sportAdj ? (sportAdj.proteinBoost || 0) : 0;
  var sportCarbBoost = sportAdj ? (sportAdj.carbPctBoost || 0) : 0;

  var calorieTarget = tdee + goalAdj + sportCalBonus;

  // 5: Ernaehrungsform Makros
  var diet = window._DIET_TYPES[dietType] || window._DIET_TYPES.flexible;

  var proteinPerKg;
  if (diet.proteinMultiplier) {
    proteinPerKg = diet.proteinMultiplier;
  } else if (goal === 'lose' || goal === 'recomp') {
    proteinPerKg = 2.4;
  } else if (goal === 'gain') {
    proteinPerKg = 2.0;
  } else {
    proteinPerKg = 1.8;
  }
  proteinPerKg += sportProtBonus;
  var proteinTarget = Math.round(weight * proteinPerKg);

  // Carbs + Fett nach Ernaehrungsform + Sport-Boost
  var carbPct     = diet.carbPct + sportCarbBoost;
  var fatPct      = diet.fatPct;
  var proteinKcal = proteinTarget * 4;
  var fatTarget   = Math.round(calorieTarget * fatPct / 9);
  var fatKcal     = fatTarget * 9;
  var carbKcal    = calorieTarget - proteinKcal - fatKcal;
  var carbTarget  = Math.max(20, Math.round(carbKcal / 4));

  // Keto/Low Carb: Hard Cap
  if (diet.maxCarbsG && carbTarget > diet.maxCarbsG) {
    carbTarget = diet.maxCarbsG;
    var remainingKcal = calorieTarget - proteinKcal - (carbTarget * 4);
    fatTarget = Math.round(remainingKcal / 9);
  }

  return {
    bmr:            Math.round(bmr),
    tdee:           tdee,
    calorieTarget:  calorieTarget,
    proteinTarget:  proteinTarget,
    carbTarget:     carbTarget,
    fatTarget:      fatTarget,
    pal:            pal,
    goalAdj:        goalAdj,
    sportCalBonus:  sportCalBonus,
    dietType:       dietType,
    dietLabel:      diet.label,
    dietEmoji:      diet.emoji,
    sportAdj:       sportAdj ? sportAdj.label : null,
    preWorkout:     sportAdj ? sportAdj.preWorkout : null,
    postWorkout:    sportAdj ? sportAdj.postWorkout : null,
    scienceNote:    (diet.notes || '') + (sportAdj ? ' ' + sportAdj.science : ''),
    supplements:    diet.supplementWarnings || [],
    formula:        'Mifflin-St Jeor 2005 + PAL DGE + Morton 2018 + ' + diet.label
  };
};

// Backward-compatible Wrapper
window._calculateDailyTargets = function(profile) {
  if (!profile || !profile.weight) return null;
  var calc = window._calculateNutritionTargets(profile);
  var targets = {
    calories: calc.calorieTarget,
    protein:  calc.proteinTarget,
    carbs:    calc.carbTarget,
    fat:      calc.fatTarget,
    mealsPerDay: 4,
    proteinPerMeal: Math.round(calc.proteinTarget / 4),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem('base_nutrition_targets', JSON.stringify(targets));
  return targets;
};

// ============================================================
// ERNAEHRUNGSFORM UI: Cards + Live Preview
// ============================================================

window._pendingDietType = null;

window._renderDietTypeCards = function(selectedId) {
  var container = document.getElementById('dietTypeCards');
  if (!container) return;
  selectedId = selectedId || 'flexible';
  window._pendingDietType = selectedId;

  // Flexibel: volle Breite Hero-Button oben
  var flexSel = selectedId === 'flexible';
  var html =
    '<button onclick="window._selectDietType(\'flexible\')" ' +
      'id="dietBtn_flexible" class="pointer-events-auto w-full" aria-label="Flexibel" ' +
      'style="padding:12px 14px;border-radius:11px;text-align:left;cursor:pointer;margin-bottom:6px;' +
        'display:flex;align-items:center;gap:10px;' +
        'background:' + (flexSel ? 'color-mix(in srgb,var(--primary-hex),transparent 90%)' : 'var(--inner-bg-hex)') + ';' +
        'border:1px solid ' + (flexSel ? 'color-mix(in srgb,var(--primary-hex),transparent 70%)' : 'var(--border-hex)') + '">' +
      '<span style="font-size:22px">\uD83D\uDD13</span>' +
      '<div>' +
        '<p style="font-size:13px;font-weight:700;color:var(--text-main)">Flexibel \u2014 Keine Einschr\u00E4nkung</p>' +
        '<p style="font-size:10px;color:var(--text-muted)">Einfach Kalorien tracken ohne Di\u00E4tform</p>' +
      '</div>' +
      (flexSel ? '<span style="margin-left:auto;font-size:11px;font-weight:700;color:var(--primary-hex)">Aktiv \u2713</span>' : '') +
    '</button>' +
    '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin:10px 0 8px">Oder Ern\u00E4hrungsform w\u00E4hlen</p>' +
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';

  Object.values(window._DIET_TYPES).forEach(function(diet) {
    if (diet.id === 'flexible') return; // bereits oben gerendert
    var isSel = selectedId === diet.id;
    html +=
      '<button onclick="window._selectDietType(\'' + diet.id + '\')" ' +
        'id="dietBtn_' + diet.id + '" ' +
        'class="pointer-events-auto" aria-label="' + diet.label + '" ' +
        'style="padding:10px;border-radius:11px;text-align:left;cursor:pointer;' +
          'background:' + (isSel ? 'color-mix(in srgb,var(--primary-hex),transparent 88%)' : 'var(--inner-bg-hex)') + ';' +
          'border:1px solid ' + (isSel ? 'color-mix(in srgb,var(--primary-hex),transparent 65%)' : 'var(--border-hex)') + '">' +
        '<p style="font-size:16px;margin-bottom:3px">' + diet.emoji + '</p>' +
        '<p style="font-size:11px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(diet.label) + '</p>' +
        '<p style="font-size:9px;color:var(--text-muted);line-height:1.4;margin-top:2px">' + window._escapeHtml(diet.description) + '</p>' +
      '</button>';
  });
  html += '</div>';
  container.innerHTML = html;
};

window._selectDietType = function(dietId) {
  document.querySelectorAll('[id^="dietBtn_"]').forEach(function(btn) {
    btn.style.background  = 'var(--inner-bg-hex)';
    btn.style.borderColor = 'var(--border-hex)';
  });
  var sel = document.getElementById('dietBtn_' + dietId);
  if (sel) {
    sel.style.background  = 'color-mix(in srgb,var(--primary-hex),transparent 88%)';
    sel.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 65%)';
  }
  window._pendingDietType = dietId;
  window._updateNutritionCalcPreview();
};

window._nutritionMacroBox = function(label, value, unit, color) {
  return '<div style="text-align:center;padding:6px;background:var(--bg-hex);border-radius:8px">' +
    '<p style="font-size:14px;font-weight:700;color:' + color + '">' + value + '</p>' +
    '<p style="font-size:8px;color:var(--text-muted)">' + label + ' ' + unit + '</p></div>';
};

window._updateNutritionCalcPreview = function() {
  var preview = document.getElementById('nutritionCalcPreview');
  if (!preview) return;
  var p = window._getNutritionProfile ? window._getNutritionProfile() : {};
  // Override with current form values
  var wEl = document.getElementById('ns_weight');
  var hEl = document.getElementById('ns_height');
  var aEl = document.getElementById('ns_age');
  if (wEl && wEl.value) p.weight = parseFloat(wEl.value);
  if (hEl && hEl.value) p.height = parseFloat(hEl.value);
  if (aEl && aEl.value) p.age = parseInt(aEl.value);
  var gEl = document.getElementById('ns_gender');
  if (gEl) p.gender = gEl.value;
  var actEl = document.getElementById('ns_activityLevel');
  if (actEl) p.activityLevel = actEl.value;
  var goalEl = document.getElementById('ns_goal');
  if (goalEl) p.goal = goalEl.value;
  p.dietType = window._pendingDietType || p.dietType || 'flexible';
  if (!p.weight) { preview.innerHTML = '<p style="font-size:11px;color:var(--text-muted)">Bitte Gewicht eingeben fuer Vorschau</p>'; return; }

  var calc = window._calculateNutritionTargets(p);
  var diet = window._DIET_TYPES[calc.dietType] || {};
  var sportTxt = calc.sportAdj
    ? '<p style="font-size:9px;color:#4ab8d4;margin-top:4px">\u26A1 Sport-Anpassung: ' + window._escapeHtml(calc.sportAdj) + ' (+' + calc.sportCalBonus + ' kcal)</p>'
    : '';

  preview.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:8px">' +
      window._nutritionMacroBox('Kalorien', calc.calorieTarget, 'kcal', 'var(--primary-hex)') +
      window._nutritionMacroBox('Protein', calc.proteinTarget, 'g', '#4ab8d4') +
      window._nutritionMacroBox('Carbs', calc.carbTarget, 'g', '#a3c9a8') +
      window._nutritionMacroBox('Fett', calc.fatTarget, 'g', '#e8c86a') +
    '</div>' +
    '<p style="font-size:9px;color:var(--text-muted)">BMR: ' + calc.bmr + ' \u00B7 TDEE: ' + calc.tdee + ' \u00B7 ' + (diet.emoji || '') + ' ' + (diet.label || '') + '</p>' +
    sportTxt +
    (calc.preWorkout ? '<p style="font-size:9px;color:#a3c9a8;margin-top:4px">Pre-WO: ' + window._escapeHtml(calc.preWorkout) + '</p>' : '');
};

// Post-Workout Nutrition Tip (Schoenfeld, Kerksick ISSN 2017)
window._postWorkoutNutritionTip = function(workoutData) {
  var profile = window._getNutritionProfile();
  var targets = JSON.parse(localStorage.getItem('base_nutrition_targets') || 'null');
  if (!profile.weight || !targets) return;

  var volume = workoutData.volume || 0;
  var duration = workoutData.duration || 30;
  var tip = '';
  var lastMeal = localStorage.getItem('base_last_meal_time');
  var hoursSinceLastMeal = lastMeal ? (Date.now() - parseInt(lastMeal)) / 3600000 : 5;

  if (hoursSinceLastMeal > 3) {
    tip = 'Seit ' + Math.round(hoursSinceLastMeal) + 'h nichts gegessen. Jetzt ' +
      targets.proteinPerMeal + 'g Protein aufnehmen (Fenster: 2h).';
  } else {
    tip = 'Pre-Workout Mahlzeit vorhanden \u2014 Protein-Fenster ist breit (4-6h). ' +
      'Tagesziel: ' + targets.protein + 'g auf 4 Mahlzeiten.';
  }

  if (volume > 5000 || duration > 60) {
    tip += ' Intensives Workout: +' + Math.round(targets.proteinPerMeal * 2) +
      'g Kohlenhydrate f\u00FCr Glykogen.';
  }

  window.showToast(tip, null, null, null, 8000);
};

// ============================================================
// FEATURE: TRAINING JOURNAL
// ============================================================

window._JOURNAL_KEY = 'base_training_journal';

window._getJournalEntries = function() {
  return JSON.parse(localStorage.getItem(window._JOURNAL_KEY) || '[]');
};

window._saveJournalEntry = function(entry) {
  var entries = window._getJournalEntries();
  entry.id = 'j_' + Date.now();
  entry.date = entry.date || new Date().toISOString().split('T')[0];
  entries.unshift(entry);
  entries = entries.slice(0, 365);
  localStorage.setItem(window._JOURNAL_KEY, JSON.stringify(entries));
  if (window.awardXP) window.awardXP('habit', 10);
  return entry;
};

window._deleteJournalEntry = function(id) {
  var entries = window._getJournalEntries().filter(function(e) { return e.id !== id; });
  localStorage.setItem(window._JOURNAL_KEY, JSON.stringify(entries));
};

window._showJournalPrompt = function(sessionId, exerciseCount) {
  var journalId = 'journalPrompt_' + (sessionId || Date.now());
  if (document.getElementById(journalId)) return;
  setTimeout(function() {
    var el = document.createElement('div');
    el.id = journalId;
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:420px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:16px;padding:14px 16px;z-index:9998;animation:slideUpNudge .3s ease';
    el.innerHTML =
      '<p style="font-size:13px;font-weight:700;color:var(--text-main);margin-bottom:6px">\uD83D\uDCD4 Wie war das Training heute?</p>' +
      '<textarea id="journalTextarea" placeholder="Freitext... z.B. Schulter hat gezwickt, aber Kraft war gut." class="pointer-events-auto" style="width:100%;height:72px;background:var(--bg-hex);border:1px solid var(--border-hex);border-radius:9px;padding:8px;color:var(--text-main);font-size:12px;resize:none;outline:none;font-family:inherit;box-sizing:border-box"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
        '<button onclick="(function(){var t=document.getElementById(\'journalTextarea\').value.trim();if(!t){document.getElementById(\'' + journalId + '\').remove();return;}window._saveJournalEntry({text:t,exercises:' + (exerciseCount || 0) + '});document.getElementById(\'' + journalId + '\').remove();window.showToast(\'\uD83D\uDCD4 Journal gespeichert +10 XP\');})()" class="pointer-events-auto" style="flex:1;padding:8px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">Speichern</button>' +
        '<button onclick="document.getElementById(\'' + journalId + '\').remove()" class="pointer-events-auto" style="padding:8px 14px;border-radius:9px;font-size:12px;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\u00DCberspringen</button>' +
      '</div>';
    document.body.appendChild(el);
    setTimeout(function() { var el2 = document.getElementById(journalId); if (el2) el2.remove(); }, 30000);
  }, 6000);
};

window._renderJournal = function(containerId) {
  var container = document.getElementById(containerId || 'journalContainer');
  if (!container) return;
  var entries = window._getJournalEntries();
  if (entries.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px"><p style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:4px">Noch keine Eintr\u00E4ge</p><p style="font-size:11px;color:var(--text-muted)">Nach dem n\u00E4chsten Training wirst du gefragt wie es war.</p></div>';
    return;
  }
  container.innerHTML = entries.slice(0, 20).map(function(e) {
    return '<div style="padding:10px 12px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:11px;margin-bottom:6px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">' +
        '<p style="font-size:10px;font-weight:700;color:var(--primary-hex)">' + e.date + '</p>' +
        (e.exercises ? '<p style="font-size:9px;color:var(--text-muted)">' + e.exercises + ' \u00DCbungen</p>' : '') +
      '</div>' +
      '<p style="font-size:12px;color:var(--text-main);line-height:1.6">' + window._escapeHtml(e.text) + '</p></div>';
  }).join('');
};

// ============================================================
// FEATURE: KOERPERGEWICHT TRACKER
// ============================================================

window._WEIGHT_LOG_KEY = 'base_weight_log';

window._getWeightLog = function() {
  return JSON.parse(localStorage.getItem(window._WEIGHT_LOG_KEY) || '[]');
};

window._addWeightEntry = function(weightKg, note) {
  var entries = window._getWeightLog();
  entries.unshift({
    id: 'w_' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    weight: parseFloat(weightKg),
    note: note || ''
  });
  entries = entries.slice(0, 365);
  localStorage.setItem(window._WEIGHT_LOG_KEY, JSON.stringify(entries));
  window._renderWeightWidget();
};

window._getWeightMovingAverage = function(days) {
  days = days || 7;
  var entries = window._getWeightLog();
  if (entries.length < 2) return null;
  var recent = entries.slice(0, days);
  var avg = recent.reduce(function(s, e) { return s + e.weight; }, 0) / recent.length;
  return Math.round(avg * 10) / 10;
};

window._getWeightTrend = function() {
  var entries = window._getWeightLog().slice(0, 14).reverse();
  if (entries.length < 3) return null;
  var n = entries.length;
  var x = entries.map(function(_, i) { return i; });
  var y = entries.map(function(e) { return e.weight; });
  var sx = x.reduce(function(a, b) { return a + b; }, 0);
  var sy = y.reduce(function(a, b) { return a + b; }, 0);
  var sxy = x.reduce(function(s, v, i) { return s + v * y[i]; }, 0);
  var sxx = x.reduce(function(s, v) { return s + v * v; }, 0);
  var slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  var weekly = slope * 7;
  return {
    weeklyChange: Math.round(weekly * 100) / 100,
    direction: weekly > 0.1 ? 'up' : weekly < -0.1 ? 'down' : 'stable'
  };
};

window._analyzeWeightTrend = async function() {
  var entries = window._getWeightLog().slice(0, 30);
  if (entries.length < 3) { window.showToast('Mindestens 3 Eintr\u00E4ge f\u00FCr Analyse n\u00F6tig', 'warn'); return; }
  var trend = window._getWeightTrend();
  var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
  var goal = (window.userProfile || {}).goal || 'unbekannt';
  var prompt = 'Analysiere diesen Gewichtsverlauf und gib eine kurze, direkte Einschaetzung (max 100 Woerter).\n\n' +
    'GEWICHTS-DATEN (letzte 30 Tage):\n' + entries.map(function(e) { return e.date + ': ' + e.weight + 'kg'; }).join('\n') +
    '\n\nTrend: ' + (trend ? trend.weeklyChange + 'kg/Woche' : 'unklar') +
    '\nZiel: ' + goal + '\nSoll-Kalorien: ' + (profile.calorieTarget || '?') + ' kcal\n\n' +
    'Bewerte ob Verlauf zum Ziel passt. Sei konkret, keine Floskeln.';
  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 25000);
    var res = await fetch('/.netlify/functions/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, type: 'weight_trend' }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var text = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '';
    window.showModal('\u2696\uFE0F Gewichts-Analyse', '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap">' + window._sanitizeAIHtml(text) + '</div>', false);
  } catch (e) { window.showToast('Analyse fehlgeschlagen', 'error'); }
};

window._renderWeightWidget = function(containerId) {
  var container = document.getElementById(containerId || 'weightWidgetContainer');
  if (!container) return;
  var entries = window._getWeightLog();
  var trend = window._getWeightTrend();
  var avg7 = window._getWeightMovingAverage(7);
  var latest = entries[0];
  var trendColor = !trend ? 'var(--text-muted)' : trend.direction === 'up' ? '#e88a8a' : trend.direction === 'down' ? '#a3c9a8' : '#e8c86a';
  var trendArrow = !trend ? '\u2192' : trend.direction === 'up' ? '\u2191' : trend.direction === 'down' ? '\u2193' : '\u2192';

  var html =
    '<div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">' +
      '<input id="weightQuickInput" type="number" inputmode="decimal" step="0.1" placeholder="' + (latest ? latest.weight : '75.0') + '" aria-label="Aktuelles Gewicht in kg" class="pointer-events-auto" style="flex:1;padding:9px 12px;border-radius:10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:16px;font-weight:700;outline:none"/>' +
      '<span style="font-size:12px;color:var(--text-muted)">kg</span>' +
      '<button onclick="(function(){var v=document.getElementById(\'weightQuickInput\').value;if(!v||isNaN(v))return;window._addWeightEntry(parseFloat(v));window.showToast(\'\u2696\uFE0F \'+v+\' kg gespeichert!\');document.getElementById(\'weightQuickInput\').value=\'\';})()" class="pointer-events-auto" style="padding:9px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">+ Eintragen</button>' +
    '</div>';

  if (entries.length > 0) {
    html +=
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">' +
        '<div style="text-align:center;padding:8px;background:var(--inner-bg-hex);border-radius:9px"><p style="font-size:18px;font-weight:700;color:var(--text-main)">' + latest.weight + '</p><p style="font-size:9px;color:var(--text-muted)">Aktuell kg</p></div>' +
        '<div style="text-align:center;padding:8px;background:var(--inner-bg-hex);border-radius:9px"><p style="font-size:18px;font-weight:700;color:var(--text-main)">' + (avg7 || '\u2014') + '</p><p style="font-size:9px;color:var(--text-muted)">\u00D8 7 Tage kg</p></div>' +
        '<div style="text-align:center;padding:8px;background:var(--inner-bg-hex);border-radius:9px"><p style="font-size:18px;font-weight:700;color:' + trendColor + '">' + trendArrow + ' ' + (trend ? (trend.weeklyChange > 0 ? '+' : '') + trend.weeklyChange : '\u2014') + '</p><p style="font-size:9px;color:var(--text-muted)">kg/Woche</p></div>' +
      '</div>';
    var chartData = entries.slice(0, 14).reverse();
    if (chartData.length >= 2) {
      var minW = Math.min.apply(null, chartData.map(function(e) { return e.weight; }));
      var maxW = Math.max.apply(null, chartData.map(function(e) { return e.weight; }));
      var range = maxW - minW || 1;
      html += '<div style="display:flex;align-items:flex-end;gap:3px;height:32px;margin-bottom:8px">';
      chartData.forEach(function(e) {
        var h = Math.max(4, Math.round((e.weight - minW) / range * 28) + 4);
        html += '<div style="flex:1;background:var(--primary-hex);opacity:0.7;border-radius:2px;height:' + h + 'px" title="' + e.date + ': ' + e.weight + 'kg"></div>';
      });
      html += '</div>';
    }
    html += '<button onclick="window._analyzeWeightTrend()" class="pointer-events-auto w-full" style="padding:8px;border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\u2728 KI-Trend Analyse</button>';
  }
  container.innerHTML = html;
};

// ============================================================
// FEATURE: TRAININGS-EFFIZIENZ SCORE
// ============================================================

window._calculateEfficiencyScore = function(session) {
  if (!session || !Array.isArray(session) || session.length === 0) return null;
  var scores = [];
  var details = [];

  // 1. Volumen vs Readiness (0-25)
  var readiness = window.currentReadinessScore || 80;
  var totalSets = session.reduce(function(s, w) { return s + ((w.setDetails || []).length || 1); }, 0);
  var expectedSets = readiness >= 80 ? 15 : readiness >= 60 ? 12 : 9;
  var volumeScore = Math.min(25, Math.round(totalSets / expectedSets * 25));
  scores.push(volumeScore);
  details.push(totalSets >= expectedSets ? '\u2713 Volumen passt zur Tagesform' : '\u2193 Volumen unter Erwartung bei ' + readiness + '% Readiness');

  // 2. Uebungsvielfalt (0-25)
  var uniqueEx = new Set(session.map(function(w) { return w.exercise; })).size;
  var varScore = Math.min(25, uniqueEx * 5);
  scores.push(varScore);
  details.push(uniqueEx + ' verschiedene \u00DCbungen');

  // 3. RIR-Konsistenz (0-25)
  var allSets = []; session.forEach(function(w) { (w.setDetails || []).forEach(function(s) { allSets.push(s); }); });
  var rirSets = allSets.filter(function(s) { return s.rir != null; });
  var rirScore = rirSets.length > 0 ? Math.min(25, Math.round(rirSets.length / Math.max(1, allSets.length) * 25)) : 10;
  scores.push(rirScore);
  if (rirSets.length > 0) details.push(rirSets.length + '/' + allSets.length + ' S\u00E4tze mit RIR getrackt');

  // 4. Uebungen zum Ziel (0-25)
  var goal = (window.userProfile || {}).goal || '';
  var goalScore = 20;
  var strengthEx = session.filter(function(w) { return w.category === 'strength'; }).length;
  var cardioEx = session.filter(function(w) { return w.category === 'cardio'; }).length;
  if (goal.includes('Muskel') || goal.includes('Kraft')) {
    goalScore = Math.min(25, strengthEx * 5);
    details.push(strengthEx + ' Kraft-\u00DCbungen (Ziel: Muskelaufbau)');
  } else if (goal.includes('Ausdauer')) {
    goalScore = Math.min(25, cardioEx * 8);
    details.push(cardioEx + ' Cardio-Einheiten (Ziel: Ausdauer)');
  } else {
    details.push(session.length + ' \u00DCbungen insgesamt');
  }
  scores.push(goalScore);

  var total = scores.reduce(function(a, b) { return a + b; }, 0);
  return {
    score: total,
    label: total >= 85 ? 'Exzellent' : total >= 70 ? 'Gut' : total >= 55 ? 'Solide' : 'Verbesserungspotenzial',
    color: total >= 85 ? '#a3c9a8' : total >= 70 ? '#4ab8d4' : total >= 55 ? '#e8c86a' : '#e88a8a',
    details: details
  };
};

window._showEfficiencyScore = function(todaysWorkouts) {
  if (!todaysWorkouts || todaysWorkouts.length === 0) return;
  var eff = window._calculateEfficiencyScore(todaysWorkouts);
  if (!eff) return;
  setTimeout(function() {
    window.showModal(
      '\u26A1 Training Effizienz: ' + eff.score + '/100',
      '<div style="text-align:center;margin-bottom:14px"><p style="font-size:48px;font-weight:900;color:' + eff.color + '">' + eff.score + '</p><p style="font-size:14px;font-weight:600;color:' + eff.color + '">' + eff.label + '</p></div>' +
      eff.details.map(function(d) { return '<p style="font-size:12px;color:var(--text-muted);margin-bottom:5px;padding:6px 10px;background:var(--inner-bg-hex);border-radius:8px">' + d + '</p>'; }).join(''),
      false
    );
  }, 8000);
};

// ============================================================
// FEATURE: AUTO-REGULATION (RPE nach Satz 1)
// ============================================================

window._isAutoRegEnabled = function() {
  return localStorage.getItem('base_autoreg_enabled') !== 'false';
};

window._setAutoRegEnabled = function(enabled) {
  localStorage.setItem('base_autoreg_enabled', enabled ? 'true' : 'false');
};

window._showAutoRegSuggestion = function(exerciseName, setData) {
  if (setData.setNumber !== 1) return;
  if (!setData.weight || setData.weight <= 0) return;

  var nextWeight = setData.weight;
  var message = '';

  if (setData.rir != null) {
    if (setData.rir <= 0) {
      nextWeight = Math.round(setData.weight * 0.95 / 2.5) * 2.5;
      message = '\uD83D\uDD34 RIR 0 \u2014 zu schwer. N\u00E4chster Satz: ' + nextWeight + 'kg';
    } else if (setData.rir >= 4) {
      nextWeight = Math.round(setData.weight * 1.05 / 2.5) * 2.5;
      message = '\uD83D\uDFE2 RIR ' + setData.rir + ' \u2014 noch Luft. N\u00E4chster Satz: ' + nextWeight + 'kg';
    } else {
      message = '\u2713 RIR ' + setData.rir + ' \u2014 perfekte Intensit\u00E4t. Gewicht halten.';
    }
    if (nextWeight !== setData.weight) {
      var nwi = document.getElementById('weight_s2');
      if (nwi && !nwi.value) nwi.value = nextWeight;
    }
  } else {
    window._showRPEQuickPrompt(exerciseName, setData);
    return;
  }

  if (message) {
    var toastEl = document.createElement('div');
    toastEl.style.cssText = 'position:fixed;bottom:140px;left:50%;transform:translateX(-50%);background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;padding:10px 16px;z-index:9997;font-size:12px;font-weight:600;color:var(--text-main);white-space:nowrap;animation:slideUpNudge .2s ease';
    toastEl.textContent = message;
    toastEl.className = 'pointer-events-auto';
    document.body.appendChild(toastEl);
    setTimeout(function() { toastEl.remove(); }, 5000);
  }
};

window._showRPEQuickPrompt = function(exerciseName, setData) {
  if (document.getElementById('rpePrompt')) return;
  var el = document.createElement('div');
  el.id = 'rpePrompt';
  el.style.cssText = 'position:fixed;bottom:130px;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:380px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:14px;padding:12px 14px;z-index:9997;animation:slideUpNudge .2s ease';
  var w = setData.weight;
  el.innerHTML =
    '<p style="font-size:12px;font-weight:600;color:var(--text-main);margin-bottom:8px">Wie war Satz 1 bei ' + window._escapeHtml(exerciseName) + '?</p>' +
    '<div style="display:flex;gap:6px">' +
      '<button onclick="window._applyAutoReg(' + w + ',4);document.getElementById(\'rpePrompt\').remove()" class="pointer-events-auto" style="flex:1;padding:7px 4px;border-radius:9px;font-size:10px;font-weight:600;cursor:pointer;background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)">\uD83D\uDE24 Zu leicht</button>' +
      '<button onclick="window._applyAutoReg(' + w + ',2);document.getElementById(\'rpePrompt\').remove()" class="pointer-events-auto" style="flex:1;padding:7px 4px;border-radius:9px;font-size:10px;font-weight:600;cursor:pointer;background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)">\uD83D\uDCAA Perfekt</button>' +
      '<button onclick="window._applyAutoReg(' + w + ',0);document.getElementById(\'rpePrompt\').remove()" class="pointer-events-auto" style="flex:1;padding:7px 4px;border-radius:9px;font-size:10px;font-weight:600;cursor:pointer;background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)">\uD83D\uDE30 Zu schwer</button>' +
    '</div>';
  document.body.appendChild(el);
  setTimeout(function() { var r = document.getElementById('rpePrompt'); if (r) r.remove(); }, 15000);
};

window._applyAutoReg = function(currentWeight, rir) {
  var nextWeight = currentWeight;
  var msg = '';
  if (rir >= 4) {
    nextWeight = Math.round(currentWeight * 1.05 / 2.5) * 2.5;
    msg = '\u2191 Gewicht erh\u00F6ht: ' + nextWeight + 'kg';
  } else if (rir <= 0) {
    nextWeight = Math.round(currentWeight * 0.95 / 2.5) * 2.5;
    msg = '\u2193 Gewicht reduziert: ' + nextWeight + 'kg';
  } else {
    msg = '\u2713 Gewicht optimal \u2014 halten';
  }
  var nwi = document.getElementById('weight_s2');
  if (nwi && nextWeight !== currentWeight) nwi.value = nextWeight;
  window.showToast(msg, null, null, null, 4000);
};

// ============================================================
// FEATURE: WOECHENTLICHER KI-BRIEF
// ============================================================

window._WEEKLY_BRIEF_KEY = 'base_weekly_brief';

window._checkWeeklyBrief = async function() {
  var now = new Date();
  var dayOfWeek = now.getDay();
  var thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)).toISOString().split('T')[0];
  var stored = JSON.parse(localStorage.getItem(window._WEEKLY_BRIEF_KEY) || '{}');
  if (stored.weekDate === thisMonday) return;
  var lastWeekStart = new Date(new Date(thisMonday) - 7 * 86400000).toISOString().split('T')[0];
  var lastWeekWorkouts = (window.workouts || []).filter(function(w) { return w.archived && w.date >= lastWeekStart && w.date < thisMonday; });
  if (lastWeekWorkouts.length < 2) return;
  await window._generateWeeklyBrief(thisMonday);
};

window._generateWeeklyBrief = async function(weekDate) {
  var ctx = window.buildAIContext ? window.buildAIContext() : {};
  var weightLog = window._getWeightLog ? window._getWeightLog().slice(0, 7) : [];
  var lastWeekStart = new Date(new Date(weekDate) - 7 * 86400000).toISOString().split('T')[0];
  var lastWeekWorkouts = (window.workouts || []).filter(function(w) { return w.archived && w.date >= lastWeekStart && w.date < weekDate; });
  var prevBrief = JSON.parse(localStorage.getItem(window._WEEKLY_BRIEF_KEY) || '{}');

  var prompt =
    'Du bist der persoenliche KI-Coach von diesem Athleten. Schreibe einen motivierenden, persoenlichen Wochenbrief (max 180 Woerter). Sprich ihn direkt an \u2014 kein "Athlet", sondern "Du".\n\n' +
    'LETZTE WOCHE (' + lastWeekStart + ' bis ' + weekDate + '):\n- ' + lastWeekWorkouts.length + ' Workouts absolviert\n- Uebungen: ' + lastWeekWorkouts.map(function(w) { return w.exercise; }).slice(0, 6).join(', ') + '\n' +
    (weightLog.length > 0 ? '- Gewicht: ' + weightLog[0].weight + 'kg\n' : '') +
    '\nATHLETEN-PROFIL:\n' + (ctx.prof || '') +
    (prevBrief.content ? '\n\nLETZTER BRIEF (Kontinuitaet):\n' + prevBrief.content.slice(0, 200) : '') +
    '\n\nStruktur:\n1. Kurzes Lob fuer letzte Woche (spezifisch!)\n2. Ein konkreter Fokus diese Woche (Training ODER Ernaehrung)\n3. Ein motivierender Satz zum Abschluss\n\nKein Bullet-Point-Format. Fliesstext wie ein Brief. Persoenlich, warm, konkret. Antworte auf Deutsch.';

  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 25000);
    var res = await fetch('/.netlify/functions/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, type: 'weekly_brief' }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var text = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '';
    if (!text) return;
    var brief = { weekDate: weekDate, content: text, created: new Date().toISOString(), read: false };
    localStorage.setItem(window._WEEKLY_BRIEF_KEY, JSON.stringify(brief));
    window._showWeeklyBrief(brief);
  } catch (e) { console.warn('[WeeklyBrief]', e.message); }
};

window._showWeeklyBrief = function(brief) {
  if (!brief || brief.read) return;
  brief.read = true;
  localStorage.setItem(window._WEEKLY_BRIEF_KEY, JSON.stringify(brief));
  var d = new Date(brief.weekDate);
  var weekLabel = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
  window.showModal(
    '\uD83D\uDCEC Dein Wochen-Brief \u2014 ' + weekLabel,
    '<div style="font-size:13px;line-height:1.9;color:var(--text-main);font-style:italic">' + window._escapeHtml(brief.content) + '</div>' +
    '<p style="font-size:9px;color:var(--text-muted);margin-top:12px">Dein BASE Coach</p>',
    false
  );
};

window._readWeeklyBrief = function() {
  var brief = JSON.parse(localStorage.getItem(window._WEEKLY_BRIEF_KEY) || 'null');
  if (!brief) { window.showToast('Noch kein Brief vorhanden', 'warn'); return; }
  brief.read = false;
  window._showWeeklyBrief(brief);
};

window._hasUnreadBrief = function() {
  var brief = JSON.parse(localStorage.getItem(window._WEEKLY_BRIEF_KEY) || 'null');
  return brief && !brief.read;
};

// App-Start: Brief pruefen
setTimeout(function() { if (window._checkWeeklyBrief) window._checkWeeklyBrief(); }, 8000);

// ============================================================
// FEATURE: KI ARTIKEL/VIDEO ANALYSE
// ============================================================

window.openArticleAnalyzer = function() {
  window.toggleModal('articleAnalyzerModal');
};

window._analyzeArticle = async function() {
  var urlInput = document.getElementById('articleUrlInput');
  var textInput = document.getElementById('articleTextInput');
  var url = urlInput ? urlInput.value.trim() : '';
  var text = textInput ? textInput.value.trim() : '';
  if (!url && !text) { window.showToast('URL oder Text eingeben', 'error'); return; }

  var btn = document.getElementById('analyzeArticleBtn');
  if (btn) { btn.textContent = '\u23F3 Analysiere...'; btn.style.opacity = '0.6'; }

  var profile = window.userProfile || {};
  var prompt =
    'Du bist ein evidenzbasierter Sportwissenschaftler. Analysiere folgenden Trainings-/Ernaehrungsinhalt kritisch.\n\n' +
    'INHALT:\n' + (url ? 'URL: ' + url + '\n' : '') + (text ? text + '\n' : '') +
    '\nATHLETEN-KONTEXT:\n- Ziel: ' + (profile.goal || 'Allgemeine Fitness') + '\n- Erfahrung: ' + (profile.experience || 'unbekannt') + '\n\n' +
    'Antworte mit diesen 4 Punkten:\n\n' +
    '\u2705 EVIDENZBASIERT: Was ist wissenschaftlich korrekt? (max 3 Punkte)\n\n' +
    '\u274C VERALTET/FALSCH: Was ist pseudowissenschaftlich oder ueberholt? (mit Quellenangabe wenn moeglich)\n\n' +
    '\uD83C\uDFAF FUER DICH RELEVANT: Was davon passt konkret zu deinem Profil und Ziel?\n\n' +
    '\u26A1 SOFORT UMSETZBAR: Ein konkreter Tipp den du diese Woche anwenden kannst.\n\n' +
    'Sei direkt und klar. Max 200 Woerter gesamt. Deutsch.';

  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 25000);
    var res = await fetch('/.netlify/functions/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, type: 'article_analysis' }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var result = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '';
    window.toggleModal('articleAnalyzerModal');
    window.showModal(
      '\uD83D\uDD2C Artikel-Analyse',
      '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap">' + window._sanitizeAIHtml(result) + '</div>',
      false
    );
    if (window.awardXP) window.awardXP('coachChat', 15);
  } catch (e) {
    window.showToast('Analyse fehlgeschlagen', 'error');
  } finally {
    if (btn) { btn.textContent = '\uD83D\uDD2C Analysieren'; btn.style.opacity = '1'; }
  }
};

// ============================================================
// FEATURE: ERNAEHRUNGS-FOTO LOGGING (Gemini Vision)
// ============================================================

window._analyzeFoodPhoto = async function(imageDataBase64, mealSlot) {
  var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
  var prompt =
    'Du bist Ernaehrungsexperte. Schaetze die Naehrwerte dieses Gerichts.\n\n' +
    'WICHTIG: Nur SCHAETZUNGEN, kein medizinisches Tool. Portionsgroessen visuell schaetzen.\n' +
    (profile.dietType && profile.dietType !== 'flexible' ? 'ERNAEHRUNGSFORM des Users: ' + profile.dietType + '\n\n' : '') +
    'Antworte NUR als JSON (kein Markdown):\n{"name":"Gericht-Name","portion":"geschaetzte Portion","calories":450,"protein":35,"carbs":40,"fat":12,"fiber":5,"confidence":"hoch/mittel/niedrig","note":"kurzer Hinweis falls noetig"}';
  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 25000);
    var res = await fetch('/.netlify/functions/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'food_photo', image: imageDataBase64, prompt: prompt }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var text = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      text = data.candidates[0].content.parts[0].text || '';
    } else {
      text = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '{}';
    }
    var clean = text.replace(/```json|```/g, '').trim();
    var parsed = JSON.parse(clean);
    return {
      name: parsed.name || 'Unbekanntes Gericht', portion: parsed.portion || '1 Portion',
      calories: parseInt(parsed.calories) || 0, protein: parseFloat(parsed.protein) || 0,
      carbs: parseFloat(parsed.carbs) || 0, fat: parseFloat(parsed.fat) || 0,
      fiber: parseFloat(parsed.fiber) || 0, confidence: parsed.confidence || 'mittel',
      note: parsed.note || ''
    };
  } catch (e) { console.warn('[FoodPhoto]', e.message); return null; }
};

window._openFoodCamera = function(mealSlot) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = async function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async function() {
      var maxDim = 800;
      var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      var base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      window.showToast('\uD83D\uDCF8 Analysiere Foto...', null, null, null, 8000);
      var result = await window._analyzeFoodPhoto(base64, mealSlot);
      if (!result) { window.showToast('Analyse fehlgeschlagen', 'error'); return; }
      window._showFoodPhotoResult(result, mealSlot);
    };
  };
  input.click();
};

window._showFoodPhotoResult = function(result, mealSlot) {
  var confColor = result.confidence === 'hoch' ? '#a3c9a8' : result.confidence === 'mittel' ? '#e8c86a' : '#e88a8a';
  window.showModal(
    '\uD83D\uDCF8 Foto-Analyse',
    '<div style="padding:4px 0">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><p style="font-size:15px;font-weight:700;color:var(--text-main);flex:1">' + window._escapeHtml(result.name) + '</p><span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:6px;background:' + confColor + '22;color:' + confColor + '">' + result.confidence + '</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">' +
        window._nutritionMacroBox('Kalorien', result.calories, 'kcal', 'var(--primary-hex)') +
        window._nutritionMacroBox('Protein', result.protein, 'g', '#4ab8d4') +
        window._nutritionMacroBox('Carbs', result.carbs, 'g', '#a3c9a8') +
        window._nutritionMacroBox('Fett', result.fat, 'g', '#e8c86a') +
      '</div>' +
      '<p style="font-size:11px;color:var(--text-muted);margin-bottom:12px">\uD83D\uDCE6 Portion: ' + window._escapeHtml(result.portion) + (result.note ? ' \u00B7 ' + window._escapeHtml(result.note) : '') + '</p>' +
      '<p style="font-size:10px;color:var(--text-muted);margin-bottom:12px;padding:8px;background:var(--inner-bg-hex);border-radius:8px">\u26A0\uFE0F Sch\u00E4tzung via KI \u2014 Werte anpassen falls n\u00F6tig</p>' +
      '<button onclick="window._addFoodEntryFromPhoto({name:\'' + window._escapeHtml(result.name).replace(/'/g, "\\'") + '\',calories:' + result.calories + ',protein:' + result.protein + ',carbs:' + result.carbs + ',fat:' + result.fat + ',fiber:' + (result.fiber || 0) + ',portion:\'' + window._escapeHtml(result.portion).replace(/'/g, "\\'") + '\'},' + (mealSlot || 0) + ')" class="pointer-events-auto w-full" style="padding:12px;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">\u2705 Zum Log hinzuf\u00FCgen</button>' +
    '</div>',
    false
  );
};

window._addFoodEntryFromPhoto = function(result, mealSlot) {
  if (!window._addFoodEntry) { window.showToast('Food Log nicht verf\u00FCgbar', 'error'); return; }
  window._addFoodEntry({ name: result.name, calories: result.calories, protein: result.protein, carbs: result.carbs, fat: result.fat, fiber: result.fiber || 0, portion: result.portion, source: 'photo' }, mealSlot || 0);
  window.showToast('\uD83D\uDCF8 ' + result.name + ' hinzugef\u00FCgt!');
};

// ============================================================
// FEATURE: OFFLINE-MODUS MIT SMART-SYNC
// ============================================================

window._OFFLINE_QUEUE_KEY = 'base_offline_queue';

window._getOfflineQueue = function() {
  return JSON.parse(localStorage.getItem(window._OFFLINE_QUEUE_KEY) || '[]');
};

window._addToOfflineQueue = function(action) {
  var queue = window._getOfflineQueue();
  action.id = 'oq_' + Date.now();
  action.queuedAt = new Date().toISOString();
  action.retries = 0;
  queue.push(action);
  localStorage.setItem(window._OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  window._showOfflineIndicator(queue.length);
};

window._processOfflineQueue = async function() {
  var queue = window._getOfflineQueue();
  if (queue.length === 0) return;
  if (!navigator.onLine) return;
  var auth = window._fbAuth;
  if (!auth || !auth.currentUser) return;
  var remaining = [];
  var synced = 0;
  for (var i = 0; i < queue.length; i++) {
    var action = queue[i];
    try {
      if (action.type === 'save_workout' && window.syncToCloud) { await window.syncToCloud(action.data); synced++; }
      else if (action.type === 'save_nutrition' && window._syncFoodLog) { await window._syncFoodLog(action.data); synced++; }
      else { synced++; }
    } catch (e) {
      action.retries = (action.retries || 0) + 1;
      if (action.retries < 3) remaining.push(action);
    }
  }
  localStorage.setItem(window._OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  if (synced > 0) {
    window.showToast('\u2601\uFE0F ' + synced + ' Eintr\u00E4ge synchronisiert!', null, null, null, 4000);
    window._showOfflineIndicator(remaining.length);
  }
};

window._showOfflineIndicator = function(queueCount) {
  var existing = document.getElementById('offlineIndicator');
  if (!navigator.onLine || queueCount > 0) {
    if (!existing) {
      var el = document.createElement('div');
      el.id = 'offlineIndicator';
      el.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;z-index:8000;animation:slideUpNudge .2s ease;';
      document.body.appendChild(el);
      existing = el;
    }
    if (!navigator.onLine) {
      existing.style.background = 'rgba(232,138,138,0.9)';
      existing.style.color = '#fff';
      existing.textContent = '\uD83D\uDCF5 Offline \u2014 Training wird lokal gespeichert';
    } else if (queueCount > 0) {
      existing.style.background = 'rgba(232,200,106,0.9)';
      existing.style.color = '#333';
      existing.textContent = '\u23F3 ' + queueCount + ' Eintr\u00E4ge werden synchronisiert...';
      setTimeout(function() { var el2 = document.getElementById('offlineIndicator'); if (el2) el2.remove(); }, 5000);
    }
  } else if (existing) { existing.remove(); }
};

window.addEventListener('online', function() {
  window._showOfflineIndicator(0);
  window.showToast('\u2705 Wieder online \u2014 synchronisiere...', null, null, null, 3000);
  setTimeout(function() { window._processOfflineQueue(); }, 1000);
});

window.addEventListener('offline', function() {
  window._showOfflineIndicator(window._getOfflineQueue().length);
});

// Beim App-Start: Queue pruefen
setTimeout(function() {
  if (!navigator.onLine) {
    window._showOfflineIndicator(window._getOfflineQueue().length);
  } else {
    window._processOfflineQueue();
  }
}, 3000);

// ============================================================
// FEATURE: LIVE VOICE COACH (spricht nach jedem Satz)
// ============================================================

window._LIVE_VOICE_KEY = 'base_live_voice_enabled';

window._isLiveVoiceEnabled = function() {
  return localStorage.getItem(window._LIVE_VOICE_KEY) === 'true';
};

window._setLiveVoiceEnabled = function(enabled) {
  localStorage.setItem(window._LIVE_VOICE_KEY, enabled ? 'true' : 'false');
};

window._liveVoiceSpeak = function(msg) {
  if (window._voiceCoachSpeak) { window._voiceCoachSpeak(msg); }
  else if (window._speak) { window._speak(msg); }
  else if (window.speechSynthesis) {
    var u = new SpeechSynthesisUtterance(msg);
    u.lang = (window.currentLang || 'de') === 'de' ? 'de-DE' : 'en-US';
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  }
};

window._liveVoiceAfterSet = function(exerciseName, setNumber, totalSets, setData) {
  if (!window._isLiveVoiceEnabled()) return;
  if (!setData) return;
  var reps = setData.reps || 0;
  var weight = setData.weight || 0;
  var rir = setData.rir != null ? setData.rir : null;
  var lang = window.currentLang || 'de';
  var msg = '';

  if (setNumber === 1) {
    var history = (window.workouts || []).filter(function(w) { return w.archived && w.exercise === exerciseName && w.category === 'strength'; });
    var lastBest = history[0] && history[0].setDetails ? Math.max.apply(null, history[0].setDetails.map(function(s) { return parseFloat(s.weight) || 0; })) : 0;
    if (lastBest > 0 && weight > lastBest) {
      msg = lang === 'de' ? 'Satz 1 erledigt. ' + weight + ' Kilo bei ' + reps + ' Wiederholungen. Neues Bestgewicht!' : 'Set 1 done. ' + weight + ' kilos for ' + reps + ' reps. New personal best!';
    } else {
      msg = lang === 'de' ? 'Satz 1 bei ' + weight + ' Kilo, ' + reps + ' Wiederholungen.' : 'Set 1. ' + weight + ' kilos, ' + reps + ' reps.';
    }
  } else if (setNumber >= totalSets) {
    msg = lang === 'de' ? 'Letzter Satz erledigt! ' + exerciseName + ' abgeschlossen. Gute Arbeit!' : 'Last set done! ' + exerciseName + ' complete. Great work!';
  } else {
    if (rir !== null && rir <= 1) {
      msg = lang === 'de' ? 'Satz ' + setNumber + ' fertig. Sehr intensiv. Pause einhalten!' : 'Set ' + setNumber + ' done. Very intense. Take your rest!';
    } else if (rir !== null && rir >= 4) {
      msg = lang === 'de' ? 'Satz ' + setNumber + ' fertig. Noch Luft \u2014 n\u00E4chsten Satz schwerer.' : 'Set ' + setNumber + ' done. Try heavier next set.';
    } else {
      msg = lang === 'de' ? 'Satz ' + setNumber + '. ' + reps + ' Wiederholungen bei ' + weight + ' Kilo.' : 'Set ' + setNumber + '. ' + reps + ' reps at ' + weight + ' kilos.';
    }
  }
  if (msg) window._liveVoiceSpeak(msg);
};

window._liveVoiceWorkoutStart = function() {
  if (!window._isLiveVoiceEnabled()) return;
  var readiness = window.currentReadinessScore || 80;
  var lang = window.currentLang || 'de';
  var msg = lang === 'de'
    ? 'Training gestartet! Readiness ' + readiness + ' Prozent. ' + (readiness >= 80 ? 'Top Form heute!' : readiness >= 60 ? 'Gute Form. Trainiere smart.' : 'Etwas m\u00FCde \u2014 h\u00F6re auf deinen K\u00F6rper.')
    : 'Workout started! Readiness ' + readiness + ' percent. ' + (readiness >= 80 ? 'Top shape today!' : 'Listen to your body.');
  setTimeout(function() { window._liveVoiceSpeak(msg); }, 1000);
};

window._liveVoiceRestDone = function() {
  if (!window._isLiveVoiceEnabled()) return;
  var lang = window.currentLang || 'de';
  window._liveVoiceSpeak(lang === 'de' ? 'Pause vorbei! N\u00E4chster Satz.' : 'Rest done! Next set.');
};

// ============================================================
// FEATURE: CALORIE BURN PRO UEBUNG (EPOC)
// Ainsworth Compendium 2011, Paoli 2012, Scott 2011
// ============================================================

window._MET_VALUES = {
  strength_light: 3.5, strength_moderate: 5.0, strength_heavy: 6.0, strength_hiit: 8.0,
  cardio_walk: 3.5, cardio_run: 8.0, cardio_bike: 7.5, cardio_swim: 8.0, recovery: 2.5
};

window._EPOC_MULTIPLIER = 1.25;

window._calculateWorkoutCalories = function(workoutEntries, bodyweight) {
  if (!workoutEntries || workoutEntries.length === 0) return null;
  bodyweight = bodyweight || parseFloat((window.userProfile || {}).weight) || 80;
  var totalActive = 0;

  workoutEntries.forEach(function(w) {
    var met = window._MET_VALUES.strength_moderate;
    var durationH = 0;
    if (w.category === 'strength' && w.setDetails && w.setDetails.length > 0) {
      var maxW = 0; (w.setDetails || []).forEach(function(s) { var sw = parseFloat(s.weight) || 0; if (sw > maxW) maxW = sw; });
      var orms = JSON.parse(localStorage.getItem('base_1rm_data') || '{}');
      var est1RM = 0; Object.keys(orms).forEach(function(k) { if (k.toLowerCase().includes((w.exercise || '').toLowerCase().split(' ')[0])) est1RM = orms[k]; });
      var relInt = est1RM > 0 ? maxW / est1RM : 0.65;
      var hasLowRIR = (w.setDetails || []).some(function(s) { return s.rir != null && s.rir <= 1; });
      if (relInt >= 0.85 || hasLowRIR) met = window._MET_VALUES.strength_heavy;
      else if (relInt >= 0.70) met = window._MET_VALUES.strength_moderate;
      else met = window._MET_VALUES.strength_light;
      durationH = (w.setDetails.length * 52) / 3600;
    } else if (w.category === 'cardio' && w.data) {
      var dur = parseFloat(w.data['Dauer (min)'] || w.data['Dauer'] || '0') || 0;
      durationH = dur / 60;
      var sport = (w.exercise || '').toLowerCase();
      if (sport.match(/lauf|run|jogg|marathon/)) met = window._MET_VALUES.cardio_run;
      else if (sport.match(/rad|bike|cycling/)) met = window._MET_VALUES.cardio_bike;
      else if (sport.match(/schwimm|swim/)) met = window._MET_VALUES.cardio_swim;
      else if (sport.match(/walk|gehen|spazier/)) met = window._MET_VALUES.cardio_walk;
      else met = window._MET_VALUES.cardio_run;
    } else if (w.category === 'recovery') {
      durationH = (parseFloat((w.data || {})['Dauer (min)'] || '30')) / 60;
      met = window._MET_VALUES.recovery;
    }
    totalActive += met * bodyweight * durationH;
  });

  var hasStrength = workoutEntries.some(function(w) { return w.category === 'strength'; });
  var epocFactor = hasStrength ? 0.25 : 0.12;
  var totalEPOC = totalActive * epocFactor;

  return {
    active: Math.round(totalActive),
    epoc: Math.round(totalEPOC),
    total: Math.round(totalActive + totalEPOC)
  };
};

window._showCalorieSummary = function(sessionWorkouts) {
  var bw = parseFloat((window.userProfile || {}).weight) || 80;
  var calc = window._calculateWorkoutCalories(sessionWorkouts, bw);
  if (!calc || calc.total === 0) return;
  var container = document.getElementById('sessionCalorieContainer');
  if (!container) return;
  container.style.display = 'block';
  container.innerHTML =
    '<div style="display:flex;gap:8px">' +
      '<div style="flex:1;text-align:center;padding:8px;background:color-mix(in srgb,var(--primary-hex),transparent 90%);border-radius:9px"><p style="font-size:20px;font-weight:700;color:var(--primary-hex)">' + calc.total + '</p><p style="font-size:9px;color:var(--text-muted)">Gesamt kcal</p></div>' +
      '<div style="flex:1;text-align:center;padding:8px;background:var(--inner-bg-hex);border-radius:9px"><p style="font-size:20px;font-weight:700;color:var(--text-main)">' + calc.active + '</p><p style="font-size:9px;color:var(--text-muted)">Aktiv kcal</p></div>' +
      '<div style="flex:1;text-align:center;padding:8px;background:var(--inner-bg-hex);border-radius:9px"><p style="font-size:20px;font-weight:700;color:#e8c86a">+' + calc.epoc + '</p><p style="font-size:9px;color:var(--text-muted)">EPOC kcal</p></div>' +
    '</div>' +
    '<p style="font-size:9px;color:var(--text-muted);margin-top:6px;text-align:center">Sch\u00E4tzung \u00B7 EPOC nach Paoli 2012</p>';
  var today = new Date().toISOString().split('T')[0];
  localStorage.setItem('base_today_burned', JSON.stringify({ date: today, kcal: calc.total }));
};

// DNA, Plateau, Benchmarks, BASE Score, Bio Age, Recovery History, Friends Compare
// → Ausgelagert in base-analytics.js

// ============================================================
// FEATURE: SUPPLEMENT-EVIDENZ DATENBANK (S/A/B/C/F Tiers)
// ============================================================

window._SUPPLEMENT_EVIDENCE = {
  kreatin: { name: 'Kreatin Monohydrat', tier: 'S', tierColor: '#d4af37', dose: '3-5g/Tag', timing: 'T\u00E4glich, Timing egal', benefits: ['Kraft +8-14%', 'Muskelmasse', 'Kognition'], evidence: 'Branch 2003: 500+ Studien. St\u00E4rkst untersuchtes Supplement.', warning: null, cost: '\u20AC\u20AC', goals: ['Muskelaufbau', 'Kraft', 'Performance'] },
  koffein: { name: 'Koffein', tier: 'S', tierColor: '#d4af37', dose: '3-6mg/kg K\u00F6rpergewicht', timing: '45-60 Min vor Training', benefits: ['Ausdauer +11%', 'Kraft +5%', 'Fokus'], evidence: 'Grgic 2018 BJSM: st\u00E4rkste legale Performance-Substanz.', warning: 'Toleranz aufbauen. Nach 14 Uhr vermeiden (Schlaf).', cost: '\u20AC', goals: ['Performance', 'Ausdauer', 'Kraft'] },
  betaAlanin: { name: 'Beta-Alanin', tier: 'S', tierColor: '#d4af37', dose: '3.2-6.4g/Tag', timing: 'Aufgeteilt 2-4x t\u00E4glich', benefits: ['Ausdauerleistung', 'Pufferkapazit\u00E4t', 'HIIT'], evidence: 'Hobson 2012 Meta-Analyse: +2.8% Performance bei 1-4 Min Belastung.', warning: 'Kribbeln (Par\u00E4sthesie) harmlos \u2014 durch geteilte Dosen reduzierbar.', cost: '\u20AC\u20AC', goals: ['Ausdauer', 'HIIT', 'CrossFit'] },
  vitaminD: { name: 'Vitamin D3', tier: 'A', tierColor: '#a3c9a8', dose: '2000-4000 IE/Tag', timing: 'Morgens mit Fett', benefits: ['Testosteron', 'Immunsystem', 'Knochen'], evidence: 'Pilz 2011: +25% Testosteron bei Mangel. Gilbody 2012: Immunfunktion.', warning: 'Bluttest vorher empfohlen. \u00DCber 10.000 IE nur mit Arzt.', cost: '\u20AC', goals: ['Gesundheit', 'Testosteron', 'Recovery'] },
  magnesium: { name: 'Magnesium (Glycinat)', tier: 'A', tierColor: '#a3c9a8', dose: '300-400mg/Tag', timing: 'Abends (Schlaf)', benefits: ['Schlaf', 'Muskelentspannung', 'ATP-Synthese'], evidence: 'Schwalfenberg 2017: 60% unterversorgt. Nachweislich besserer Schlaf.', warning: 'Oxid-Form schlecht verf\u00FCgbar \u2014 Glycinat bevorzugen.', cost: '\u20AC\u20AC', goals: ['Schlaf', 'Recovery'] },
  omega3: { name: 'Omega-3 (EPA/DHA)', tier: 'A', tierColor: '#a3c9a8', dose: '2-3g EPA+DHA/Tag', timing: 'Mit Mahlzeit', benefits: ['Anti-Entz\u00FCndung', 'Recovery', 'Herzgesundheit'], evidence: 'Smith 2011: +3.2% MPS. Stark Anti-Inflammatorisch. Omega-3 Index >8% anstreben.', warning: null, cost: '\u20AC\u20AC\u20AC', goals: ['Recovery', 'Herz'] },
  protein: { name: 'Whey Protein', tier: 'A', tierColor: '#a3c9a8', dose: '20-40g/Portion', timing: 'Post-Workout oder bei Proteinmangel', benefits: ['Muskelaufbau', 'Bequemlichkeit'], evidence: 'Morton 2018: Sinnvoll wenn Tagesprotein nicht durch Nahrung erreicht.', warning: 'Nur n\u00F6tig wenn Tagesprotein-Ziel nicht erreicht wird.', cost: '\u20AC\u20AC', goals: ['Muskelaufbau'] },
  ashwagandha: { name: 'Ashwagandha (KSM-66)', tier: 'B', tierColor: '#8aafe8', dose: '300-600mg/Tag', timing: 'Mit Mahlzeit', benefits: ['Stressreduktion', 'Cortisol -28%', 'Schlaf'], evidence: 'Chandrasekhar 2012: -28% Cortisol. Langanskar 2019: +15% Kraft.', warning: 'KSM-66 oder Sensoril f\u00FCr beste Bioverf\u00FCgbarkeit.', cost: '\u20AC\u20AC\u20AC', goals: ['Stress', 'Schlaf'] },
  zink: { name: 'Zink', tier: 'B', tierColor: '#8aafe8', dose: '15-30mg/Tag', timing: 'Abends, getrennt von Mahlzeit', benefits: ['Testosteron', 'Immunsystem'], evidence: 'Brilla 1992: Testosteron-Boost nur bei Zink-Defizienz.', warning: 'Kein Mehr-hilft-mehr. \u00DCber 40mg/Tag kontraproduktiv.', cost: '\u20AC', goals: ['Testosteron', 'Immunsystem'] },
  bcaa: { name: 'BCAAs', tier: 'C', tierColor: '#e8c86a', dose: '5-10g/Training', timing: 'Peri-workout', benefits: ['MPS (marginal)'], evidence: 'Wolfe 2017: Sinnlos bei ausreichender Proteinzufuhr (>1.6g/kg).', warning: '\u26A0\uFE0F Spare dein Geld wenn du genug Protein isst.', cost: '\u20AC\u20AC\u20AC', goals: [] },
  glutamin: { name: 'Glutamin', tier: 'C', tierColor: '#e8c86a', dose: '5-10g/Tag', timing: 'Post-Workout', benefits: ['Darmgesundheit (marginal)'], evidence: 'Antonio 2002: Kein signifikanter Effekt auf Muskelmasse bei gesunden Athleten.', warning: '\u26A0\uFE0F Sinnlos f\u00FCr Muskelaufbau.', cost: '\u20AC\u20AC', goals: [] },
  testosteronBooster: { name: 'Testosteron-Booster (generisch)', tier: 'F', tierColor: '#e88a8a', dose: 'N/A', timing: 'N/A', benefits: [], evidence: 'Keine klinische Evidenz. Funktioniert nur wenn echter Mangel (Zink, Vitamin D).', warning: '\uD83D\uDEAB Marketing-Produkt. Spar dein Geld.', cost: '\u20AC\u20AC\u20AC\u20AC', goals: [] }
};

window._getPersonalizedSupplementRecs = function() {
  var profile = window.userProfile || {};
  var goal = profile.goal || 'Allgemeine Fitness';
  var bloodwork = window._getLatestBloodwork ? window._getLatestBloodwork() : {};
  var existing = window._getSupplements ? window._getSupplements() : [];
  var existingNames = existing.map(function(s) { return s.name.toLowerCase(); });
  var recommendations = []; var warnings = [];
  var hasKreatin = existingNames.some(function(n) { return n.includes('kreatin') || n.includes('creatine'); });
  if (!hasKreatin) recommendations.push({ supp: window._SUPPLEMENT_EVIDENCE.kreatin, reason: 'St\u00E4rkste Evidenz \u2014 universell empfohlen' });
  if (bloodwork.vitaminD && bloodwork.vitaminD.value < 40) recommendations.push({ supp: window._SUPPLEMENT_EVIDENCE.vitaminD, reason: 'Dein Vitamin D ist bei ' + bloodwork.vitaminD.value + ' ng/ml' });
  if (goal.includes('Ausdauer') || goal.includes('Cardio')) recommendations.push({ supp: window._SUPPLEMENT_EVIDENCE.betaAlanin, reason: 'Beta-Alanin verbessert Ausdauerleistung nachweislich' });
  existing.forEach(function(s) {
    var name = s.name.toLowerCase();
    var found = Object.values(window._SUPPLEMENT_EVIDENCE).find(function(e) { return name.includes(e.name.toLowerCase().split(' ')[0]); });
    if (found && (found.tier === 'C' || found.tier === 'F')) warnings.push({ name: s.name, tier: found.tier, warning: found.warning, evidence: found.evidence });
  });
  return { recommendations: recommendations, warnings: warnings };
};

window._renderSupplementEvidence = function(containerId) {
  var container = document.getElementById(containerId || 'suppEvidenceContainer');
  if (!container) return;
  var recs = window._getPersonalizedSupplementRecs();
  var tierLabels = { S: 'S-Tier \u2014 St\u00E4rkste Evidenz', A: 'A-Tier \u2014 Gute Evidenz', B: 'B-Tier \u2014 Moderate Evidenz', C: 'C-Tier \u2014 Schwache Evidenz', F: 'F-Tier \u2014 Nicht empfohlen' };
  var html = '';
  if (recs.warnings.length > 0) {
    html += '<div style="padding:10px 12px;background:rgba(232,138,138,0.08);border:1px solid rgba(232,138,138,0.2);border-radius:11px;margin-bottom:12px"><p style="font-size:11px;font-weight:700;color:#e88a8a;margin-bottom:6px">\u26A0\uFE0F In deinem Stack:</p>' + recs.warnings.map(function(w) { return '<p style="font-size:10px;color:var(--text-muted);margin-bottom:3px">' + window._escapeHtml(w.name) + ': ' + window._escapeHtml(w.warning || w.evidence) + '</p>'; }).join('') + '</div>';
  }
  if (recs.recommendations.length > 0) {
    html += '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--primary-hex);margin-bottom:8px">\u2728 F\u00FCr dich empfohlen</p>' + recs.recommendations.map(function(r) { var s = r.supp; return '<div style="padding:10px 12px;background:color-mix(in srgb,var(--primary-hex),transparent 92%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 70%);border-radius:11px;margin-bottom:6px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:11px;font-weight:800;padding:2px 7px;border-radius:5px;background:' + s.tierColor + '22;color:' + s.tierColor + '">' + s.tier + '</span><p style="font-size:12px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(s.name) + '</p></div><p style="font-size:10px;color:var(--primary-hex);margin-bottom:3px">' + window._escapeHtml(r.reason) + '</p><p style="font-size:10px;color:var(--text-muted)">' + window._escapeHtml(s.dose) + ' \u00B7 ' + window._escapeHtml(s.timing) + '</p></div>'; }).join('');
  }
  html += '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin:12px 0 8px">Alle Supplements nach Evidenz</p>';
  ['S', 'A', 'B', 'C', 'F'].forEach(function(tier) {
    var supps = Object.entries(window._SUPPLEMENT_EVIDENCE).filter(function(e) { return e[1].tier === tier; });
    if (supps.length === 0) return;
    var color = supps[0][1].tierColor;
    html += '<div style="margin-bottom:6px"><p style="font-size:10px;font-weight:700;color:' + color + ';margin-bottom:4px">' + tierLabels[tier] + '</p>';
    supps.forEach(function(entry) {
      var suppKey = entry[0]; var s = entry[1];
      html += '<div style="padding:10px 12px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:11px;margin-bottom:5px;cursor:pointer" onclick="this.querySelector(\'.supp-detail\').style.display=this.querySelector(\'.supp-detail\').style.display===\'none\'?\'block\':\'none\';if(window._renderAffiliateProducts){var c=this.querySelector(\'.aff-products\');if(c&&!c.dataset.loaded){window._renderAffiliateProducts(\'' + suppKey + '\',c.id);c.dataset.loaded=\'1\'}}">' +
        '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:10px;font-weight:800;padding:2px 7px;border-radius:5px;background:' + s.tierColor + '22;color:' + s.tierColor + '">' + s.tier + '</span><p style="font-size:12px;font-weight:600;color:var(--text-main);flex:1">' + window._escapeHtml(s.name) + '</p><p style="font-size:10px;color:var(--text-muted)">' + s.cost + '</p></div>' +
        '<div class="supp-detail" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid var(--border-hex)"><p style="font-size:10px;color:var(--text-muted);margin-bottom:4px">\uD83D\uDCCA ' + window._escapeHtml(s.evidence) + '</p><p style="font-size:10px;color:var(--primary-hex);margin-bottom:2px">\uD83D\uDC8A ' + window._escapeHtml(s.dose) + ' \u00B7 ' + window._escapeHtml(s.timing) + '</p>' + (s.warning ? '<p style="font-size:10px;color:#e8c86a">' + window._escapeHtml(s.warning) + '</p>' : '') + '<div class="aff-products" id="affProducts_' + suppKey + '" style="display:none;margin-top:8px"></div></div></div>';
    });
    html += '</div>';
  });
  html += '<p style="font-size:9px;color:var(--text-muted);text-align:center;margin-top:8px">Quellen: Examine.com, PubMed, ISSN Position Stands</p>';
  container.innerHTML = html;
};

window.openSuppEvidence = function() {
  window.toggleModal('suppEvidenceModal');
  setTimeout(function() { window._renderSupplementEvidence(); }, 100);
};

// ============================================================
// FEATURE: KI MEAL PLAN GENERATOR (User)
// ============================================================

window.openUserMealPlanGenerator = function() {
  window.toggleModal('userMealPlanModal');
};

window._generateUserMealPlan = async function() {
  var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
  var userProf = window.userProfile || {};
  var weight = parseFloat(userProf.weight) || 80;
  var days = parseInt((document.getElementById('mealPlanDays') || {}).value || '7');
  var dietPref = (document.getElementById('mealPlanDiet') || {}).value || 'flexibel';
  var exclude = (document.getElementById('mealPlanExclude') || {}).value || '';
  var prepTime = (document.getElementById('mealPlanPrepTime') || {}).value || 'mittel';
  var budget = (document.getElementById('mealPlanBudget') || {}).value || 'mittel';
  var cals = profile.calorieTarget || Math.round(weight * 33);
  var protein = profile.proteinTarget || Math.round(weight * 1.8);
  var dietType = profile.dietType || 'flexibel';

  var btn = document.getElementById('generateMealPlanBtn');
  if (btn) { btn.textContent = '\u23F3 Erstelle Plan...'; btn.style.opacity = '0.6'; }

  var prompt = 'Du bist Ern\u00E4hrungsberater mit ISSN-Zertifizierung. Erstelle einen praktischen Ern\u00E4hrungsplan.\n\nPERS\u00D6NLICHE DATEN:\n- Gewicht: ' + weight + 'kg\n- Kalorienziel: ' + cals + ' kcal/Tag\n- Proteinziel: ' + protein + 'g/Tag\n- Ern\u00E4hrungsform: ' + dietType + '\n- Pr\u00E4ferenz: ' + dietPref + '\n- Ausschliessen: ' + (exclude || 'nichts') + '\n- Kochzeit: ' + prepTime + '\n- Budget: ' + budget + '\n\nErstelle einen ' + days + '-Tage Ern\u00E4hrungsplan:\n\nFORMAT fuer jeden Tag:\n## Tag X\n**Fr\u00FChst\u00FCck:** Gericht \u2014 Kalorien/Protein\n**Mittag:** Gericht \u2014 Kalorien/Protein\n**Snack:** Optional\n**Abendessen:** Gericht \u2014 Kalorien/Protein\n**Tagessumme:** X kcal \u00B7 Xg Protein\n\nAm Ende: Einkaufsliste fuer alle ' + days + ' Tage\n\nPraktisch, lecker, realistisch. Deutsch.';

  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 30000);
    var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, type: 'user_meal_plan', maxTokens: 3000 }), signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var text = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '';
    localStorage.setItem('base_user_meal_plan', JSON.stringify({ plan: text, days: days, createdAt: new Date().toISOString(), cals: cals, protein: protein }));
    window.toggleModal('userMealPlanModal');
    window.showModal('\uD83C\uDF7D Dein ' + days + '-Tage Ern\u00E4hrungsplan', '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap;max-height:70vh;overflow-y:auto">' + window._sanitizeAIHtml(text) + '</div><div style="display:flex;gap:8px;margin-top:10px"><button onclick="window._copyMealPlan()" class="pointer-events-auto" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\uD83D\uDCCB Plan kopieren</button><button id="shoppingListBtn" onclick="window._openShoppingListFromMealPlan()" class="pointer-events-auto" aria-label="Einkaufsliste" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">Einkaufsliste</button></div>', false);
    if (window.awardXP) window.awardXP('plan', 40);
  } catch (e) { window.showToast('Meal Plan fehlgeschlagen', 'error'); }
  finally { if (btn) { btn.textContent = '\uD83C\uDF7D Plan erstellen'; btn.style.opacity = '1'; } }
};

window._copyMealPlan = function() {
  var stored = JSON.parse(localStorage.getItem('base_user_meal_plan') || 'null');
  if (!stored || !stored.plan) return;
  if (navigator.clipboard) navigator.clipboard.writeText(stored.plan).then(function() { window.showToast('Plan kopiert!'); });
};

// ============================================================
// FEATURE: "WAS WAERE WENN" TRAININGSPLANER
// ============================================================

window._WHATIF_SCENARIOS = [
  { id: 'more_frequency', label: 'Mehr Trainingstage', icon: '\uD83D\uDCC5', desc: 'Was passiert wenn ich 5x statt 3x trainiere?' },
  { id: 'less_frequency', label: 'Weniger Trainingstage', icon: '\uD83D\uDE34', desc: 'Was wenn ich nur 2x pro Woche trainiere?' },
  { id: 'more_volume', label: 'Mehr Volumen', icon: '\uD83D\uDCC8', desc: 'Was wenn ich 30% mehr Sets mache?' },
  { id: 'deload_week', label: 'Sofortiger Deload', icon: '\uD83D\uDD04', desc: 'Wie wirkt sich ein Deload jetzt aus?' },
  { id: 'calorie_surplus', label: 'Kalorien\u00FCberschuss (+300)', icon: '\uD83C\uDF5A', desc: 'Mehr Kalorien f\u00FCr schnelleren Aufbau?' },
  { id: 'calorie_deficit', label: 'Kaloriendefizit (-300)', icon: '\u2696\uFE0F', desc: 'Cutting bei gleichbleibendem Training?' }
];

window.openWhatIfPlanner = function() {
  window.toggleModal('whatIfModal');
  window._renderWhatIfPlanner();
};

window._renderWhatIfPlanner = function() {
  var container = document.getElementById('whatIfContainer');
  if (!container) return;
  var all = (window.workouts || []).filter(function(w) { return w.archived; });
  var w4ago = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];
  var recent = all.filter(function(w) { return w.date >= w4ago; });
  var currentFreq = Math.round(recent.length / 4);
  var currentVol = Math.round(recent.reduce(function(s, w) { return s + (w.volume || 0); }, 0) / 4);
  var acwr = window._calculateACWR ? window._calculateACWR() : { ratio: 1.0 };

  var html =
    '<div style="padding:10px 12px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;margin-bottom:14px">' +
      '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:6px">Aktueller Status</p>' +
      '<div style="display:flex;gap:8px">' +
        '<div style="flex:1;text-align:center;padding:6px;background:var(--bg-hex);border-radius:8px"><p style="font-size:14px;font-weight:700;color:var(--text-main)">' + currentFreq + 'x</p><p style="font-size:8px;color:var(--text-muted)">Trainings/Woche</p></div>' +
        '<div style="flex:1;text-align:center;padding:6px;background:var(--bg-hex);border-radius:8px"><p style="font-size:14px;font-weight:700;color:var(--text-main)">' + currentVol + 'kg</p><p style="font-size:8px;color:var(--text-muted)">Wochenvolumen</p></div>' +
        '<div style="flex:1;text-align:center;padding:6px;background:var(--bg-hex);border-radius:8px"><p style="font-size:14px;font-weight:700;color:var(--text-main)">' + (acwr.ratio ? acwr.ratio.toFixed(2) : '\u2014') + '</p><p style="font-size:8px;color:var(--text-muted)">ACWR</p></div>' +
      '</div></div>' +
    '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:8px">Szenario w\u00E4hlen</p>' +
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';
  window._WHATIF_SCENARIOS.forEach(function(sc) {
    html += '<button onclick="window._simulateScenario(\'' + sc.id + '\')" class="pointer-events-auto" style="padding:10px;border-radius:11px;text-align:left;cursor:pointer;background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><p style="font-size:16px;margin-bottom:4px">' + sc.icon + '</p><p style="font-size:11px;font-weight:700;color:var(--text-main);margin-bottom:3px">' + window._escapeHtml(sc.label) + '</p><p style="font-size:9px;color:var(--text-muted);line-height:1.4">' + window._escapeHtml(sc.desc) + '</p></button>';
  });
  html += '</div>' +
    '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin:12px 0 6px">Eigenes Szenario</p>' +
    '<input id="whatIfCustom" type="text" placeholder="z.B. Was wenn ich t\u00E4glich 10.000 Schritte gehe?" aria-label="Eigenes Szenario" class="pointer-events-auto w-full" style="padding:9px 12px;border-radius:10px;margin-bottom:8px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:13px;outline:none"/>' +
    '<button onclick="window._simulateCustomScenario()" class="pointer-events-auto w-full" style="padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\u2728 Analysieren</button>';
  container.innerHTML = html;
};

window._simulateScenario = async function(scenarioId) {
  var sc = window._WHATIF_SCENARIOS.find(function(s) { return s.id === scenarioId; });
  if (!sc) return;
  await window._runWhatIfAnalysis(sc.label, sc.desc);
};

window._simulateCustomScenario = async function() {
  var input = document.getElementById('whatIfCustom');
  var text = input ? input.value.trim() : '';
  if (!text) { window.showToast('Bitte Szenario eingeben', 'warn'); return; }
  await window._runWhatIfAnalysis('Eigenes Szenario', text);
};

window._runWhatIfAnalysis = async function(title, scenario) {
  var all = (window.workouts || []).filter(function(w) { return w.archived; });
  var w4ago = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];
  var recent = all.filter(function(w) { return w.date >= w4ago; });
  var profile = window.userProfile || {};
  var nutrP = window._getNutritionProfile ? window._getNutritionProfile() : {};
  var acwr = window._calculateACWR ? window._calculateACWR() : { ratio: 1.0 };
  var currentFreq = Math.round(recent.length / 4);
  var currentVol = Math.round(recent.reduce(function(s, w) { return s + (w.volume || 0); }, 0) / 4);

  var prompt = 'Du bist Performance-Trainer und Sportwissenschaftler. Analysiere dieses Trainings-Szenario konkret und datenbasiert.\n\nAKTUELLER STATUS:\n- Trainings/Woche: ' + currentFreq + '\n- Wochenvolumen: ' + currentVol + 'kg\n- ACWR: ' + (acwr.ratio || 1.0).toFixed(2) + '\n- Kalorien: ' + (nutrP.calorieTarget || 'unbekannt') + ' kcal\n- Ziel: ' + (profile.goal || 'unbekannt') + '\n\nSZENARIO: ' + scenario + '\n\nAnalysiere (max 200 Woerter):\n## Erwarteter Effekt\n## Risiken\n## Optimale Umsetzung\n## Empfehlung (JA/NEIN/VIELLEICHT)\n\nSchoenfeld/Krieger Volumen-Empfehlungen, ACSM Guidelines. Deutsch.';

  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 25000);
    var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, type: 'whatif_analysis' }), signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var text = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '';
    window.toggleModal('whatIfModal');
    window.showModal('\uD83D\uDD2E ' + title, '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap;max-height:65vh;overflow-y:auto">' + window._sanitizeAIHtml(text) + '</div>', false);
  } catch (e) { window.showToast('Analyse fehlgeschlagen', 'error'); }
};

// ============================================================
// FEATURE: TRAINING HISTORY IMPORT (CSV)
// ============================================================

window.openHistoryImport = function() {
  window.toggleModal('historyImportModal');
};

window._parseImportCSV = function(csvText, appFormat) {
  var lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  var header = lines[0].split(',').map(function(h) { return h.trim().replace(/"/g, ''); });
  var mappings = {
    strong: { date: 'Date', exercise: 'Exercise Name', sets: 'Set Order', reps: 'Reps', weight: 'Weight' },
    hevy: { date: 'start_time', exercise: 'exercise_title', sets: 'set_index', reps: 'reps', weight: 'weight_kg' },
    garmin: { date: 'Date', exercise: 'Activity Type', duration: 'Time', distance: 'Distance' },
    generic: {
      date: header.find(function(h) { return h.toLowerCase().match(/date|datum/); }) || header[0],
      exercise: header.find(function(h) { return h.toLowerCase().match(/exercise|uebung|\u00fcbung|activity/); }) || header[1],
      weight: header.find(function(h) { return h.toLowerCase().match(/weight|gewicht/); }),
      reps: header.find(function(h) { return h.toLowerCase().match(/reps|wdh/); })
    }
  };
  var mapping = mappings[appFormat] || mappings.generic;
  var sessions = {};

  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    var row = []; var inQuote = false; var cell = '';
    for (var c = 0; c < lines[i].length; c++) {
      if (lines[i][c] === '"') inQuote = !inQuote;
      else if (lines[i][c] === ',' && !inQuote) { row.push(cell.trim()); cell = ''; }
      else cell += lines[i][c];
    }
    row.push(cell.trim());

    var getCol = function(colName) { var idx = header.indexOf(colName); return idx >= 0 ? (row[idx] || '').replace(/"/g, '').trim() : ''; };
    var dateRaw = getCol(mapping.date);
    if (!dateRaw) continue;
    var dateStr = '';
    var dm = dateRaw.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (dm) { dateStr = dm[1] + '-' + dm[2].padStart(2, '0') + '-' + dm[3].padStart(2, '0'); }
    else { var dm2 = dateRaw.match(/(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})/); if (dm2) { var yr = dm2[3].length === 2 ? '20' + dm2[3] : dm2[3]; dateStr = yr + '-' + dm2[2].padStart(2, '0') + '-' + dm2[1].padStart(2, '0'); } }
    if (!dateStr) continue;

    var exercise = getCol(mapping.exercise) || 'Unbekannte \u00DCbung';
    var weight = parseFloat(getCol(mapping.weight || '') || '0') || 0;
    var reps = parseInt(getCol(mapping.reps || '') || '0') || 0;
    var sessionKey = dateStr + '_' + exercise;
    if (!sessions[sessionKey]) {
      sessions[sessionKey] = { date: dateStr, exercise: exercise, category: weight > 0 ? 'strength' : 'cardio', setDetails: [], volume: 0, maxWeight: 0, data: {}, imported: true, archived: true, id: 'imp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4) };
    }
    if (weight > 0 && reps > 0) {
      sessions[sessionKey].setDetails.push({ reps: reps, weight: weight });
      sessions[sessionKey].volume += weight * reps;
      sessions[sessionKey].maxWeight = Math.max(sessions[sessionKey].maxWeight, weight);
    } else if (appFormat === 'garmin') {
      var dur = getCol('Time') || getCol('Duration') || '';
      var dist = getCol('Distance') || '';
      if (dur) sessions[sessionKey].data['Dauer (min)'] = dur;
      if (dist) sessions[sessionKey].data['Distanz (km)'] = dist;
      sessions[sessionKey].category = 'cardio';
    }
  }
  return Object.values(sessions);
};

window._importHistoryCSV = function(file, appFormat) {
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var imported = window._parseImportCSV(e.target.result, appFormat);
      if (imported.length === 0) { window.showToast('Keine Daten gefunden \u2014 Format pr\u00FCfen', 'error'); return; }
      var existing = window.workouts || [];
      var existingKeys = new Set(existing.map(function(w) { return w.date + '_' + w.exercise; }));
      var newEntries = imported.filter(function(imp) { return !existingKeys.has(imp.date + '_' + imp.exercise); });
      if (newEntries.length === 0) { window.showToast('Alle Eintr\u00E4ge bereits vorhanden', 'warn'); return; }
      window._showImportPreview(newEntries, function(confirmed) {
        if (!confirmed) return;
        window.workouts = existing.concat(newEntries);
        window.workouts.sort(function(a, b) { return b.date.localeCompare(a.date); });
        if (window.saveWorkoutsForCurrentClient) window.saveWorkoutsForCurrentClient();
        if (window.renderTable) window.renderTable();
        window.toggleModal('historyImportModal');
        window.showToast('\u2705 ' + newEntries.length + ' Eintr\u00E4ge importiert!', null, null, null, 5000);
        if (window.awardXP) window.awardXP('workout', 50);
      });
    } catch (er) { window.showToast('Import-Fehler: ' + er.message, 'error'); }
  };
  reader.readAsText(file, 'UTF-8');
};

window._showImportPreview = function(entries, callback) {
  var sample = entries.slice(0, 5);
  var oldest = entries.reduce(function(o, e) { return e.date < o ? e.date : o; }, entries[0].date);
  var newest = entries.reduce(function(n, e) { return e.date > n ? e.date : n; }, entries[0].date);
  window.showModal(
    '\uD83D\uDCE5 Import Vorschau',
    '<div style="margin-bottom:14px"><p style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:6px">' + entries.length + ' neue Eintr\u00E4ge gefunden</p><p style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Zeitraum: ' + oldest + ' bis ' + newest + '</p>' +
    sample.map(function(e) { return '<p style="font-size:11px;color:var(--text-main);padding:4px 0;border-bottom:1px solid var(--border-hex)">' + e.date + ' \u00B7 ' + window._escapeHtml(e.exercise) + (e.maxWeight > 0 ? ' \u00B7 ' + e.maxWeight + 'kg' : '') + '</p>'; }).join('') +
    '</div><div style="padding:8px 10px;background:rgba(163,201,168,0.06);border-radius:8px;margin-bottom:12px"><p style="font-size:10px;color:var(--primary-hex)">\u2705 Bestehende Workouts werden NICHT \u00FCberschrieben.</p></div>',
    true, function() { callback(true); }
  );
};
