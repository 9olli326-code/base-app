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
let obExp = '';

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

window.obSetExp = function(exp) {
    obExp = exp;
    document.querySelectorAll('.ob-exp-btn').forEach(b => {
        b.classList.remove('border-primary','bg-primary/10','text-primary');
        b.classList.add('border-zinc-800','bg-zinc-900','text-zinc-400');
        if(b.textContent.trim() === exp) {
            b.classList.add('border-primary','bg-primary/10','text-primary');
            b.classList.remove('border-zinc-800','bg-zinc-900','text-zinc-400');
        }
    });
};

window.obNext = function(step) {
    [1,2,3].forEach(s => {
        const el = document.getElementById('ob-step-'+s);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById('ob-step-'+step);
    if(target) target.classList.remove('hidden');
    if(window.lucide) lucide.createIcons();
};

window.obFinish = function() {
    // Profil aus Onboarding übernehmen
    window.userProfile.age = document.getElementById('ob_age')?.value || '';
    window.userProfile.weight = document.getElementById('ob_weight')?.value || '';
    window.userProfile.experience = obExp || 'Anfänger';
    window.userProfile.modules = {
        strength: !!(document.getElementById('ob_mod_strength')?.checked),
        cardio: !!(document.getElementById('ob_mod_cardio')?.checked),
        recovery: !!(document.getElementById('ob_mod_recovery')?.checked),
        main: !!(document.getElementById('ob_mod_main')?.checked),
    };
    window.userProfile.widgets = {
        readiness: false,
        ptMode: obRole === 'pt'  // wird in applyModules aktiviert
    };
    window.userProfile.onboardingDone = true;
    localStorage.setItem('beastmode_v2_profile', JSON.stringify(window.userProfile));
    window.toggleModal('onboardingModal');
    window.applyModules();
    window.renderWidgetStoreUI();
    window.populateProfile();
    if(window.lucide) lucide.createIcons();
    window.showToast('Willkommen bei BASE! 🚀');
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
