// --- PT MODUS V2 ---
// ============================================================
// PT BUSINESS MODE V2 — Data Layer, Session Planer, Tagesansicht
// ============================================================

// ── DATA LAYER (DRY + Cache + XSS Protection) ──────────────
const _clientWorkoutCache = {};
const _clientProfileCache = {};

window._escapeHtml = function(str) {
if(!str) return '';
const d = document.createElement('div');
d.textContent = str;
return d.innerHTML;
};

// Sichere Photo-URL: nur data:image/ oder https:// erlauben
window._safePhotoUrl = function(url) {
if(!url) return '';
if(url.startsWith('data:image/')) return url;
if(url.startsWith('https://')) return url;
return '';
};

window.getClientWorkouts = function(clientId) {
if(_clientWorkoutCache[clientId]) return _clientWorkoutCache[clientId];
const key = `beastmode_v2_cache_${clientId}`;
const raw = localStorage.getItem(key);
const data = raw ? JSON.parse(raw) : [];
_clientWorkoutCache[clientId] = data;
return data;
};

window.invalidateClientCache = function(clientId) {
delete _clientWorkoutCache[clientId];
};

window.getClientProfile = function(clientId) {
if(_clientProfileCache[clientId]) return _clientProfileCache[clientId];
const raw = localStorage.getItem(`base_client_profile_${clientId}`);
const data = raw ? JSON.parse(raw) : { goal:'', experience:'', injuries:'', notes:'' };
_clientProfileCache[clientId] = data;
return data;
};

window.saveClientProfile = function(clientId, profile) {
_clientProfileCache[clientId] = profile;
localStorage.setItem(`base_client_profile_${clientId}`, JSON.stringify(profile));
};

// ── SESSIONS DATA LAYER ────────────────────────────────────
window.getSessions = function() {
const raw = localStorage.getItem('base_pt_sessions');
return raw ? JSON.parse(raw) : [];
};

window.saveSessions = function(sessions) {
localStorage.setItem('base_pt_sessions', JSON.stringify(sessions));
};

// ── STATS (computed once, cached) ──────────────────────────
window.computeClientStats = function(clientId) {
const cw = window.getClientWorkouts(clientId);
const today = new Date().toISOString().split('T')[0];
const weekAgo = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
let sessionsToday = 0, sessionsWeek = 0;
cw.forEach(w => {
    if(w.date === today) sessionsToday++;
    if(w.date >= weekAgo) sessionsWeek++;
});
return { total: cw.length, today: sessionsToday, week: sessionsWeek };
};

// ── PT MODE ACTIVATE / DEACTIVATE ──────────────────────────
window.activatePTMode = function() {
const athleteNav = document.getElementById('bottomNav');
const ptNav = document.getElementById('ptBottomNav');
if(athleteNav) athleteNav.classList.add('hidden');
if(ptNav) ptNav.classList.remove('hidden');
const ptTabs = document.getElementById('ptTabsContainer');
if(ptTabs) ptTabs.classList.remove('hidden');
['tab-training','tab-analyse','tab-tools','tab-menu'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
});
window.switchPTTab('clients');
window._refreshLucide();
};

window.deactivatePTMode = function() {
const athleteNav = document.getElementById('bottomNav');
const ptNav = document.getElementById('ptBottomNav');
if(athleteNav) athleteNav.classList.remove('hidden');
if(ptNav) ptNav.classList.add('hidden');
const ptTabs = document.getElementById('ptTabsContainer');
if(ptTabs) ptTabs.classList.add('hidden');
window.switchTab('training');
};

// ── LUCIDE REFRESH (DRY — called from one place) ──────────
window._refreshLucide = function() {
if(window.lucide) setTimeout(() => lucide.createIcons(), 40);
};

// ── PT TAB SWITCHING ───────────────────────────────────────
window.switchPTTab = function(tab) {
document.querySelectorAll('.pt-tab-panel').forEach(p => p.classList.add('hidden'));
['clients','plans','pttools','mytraining'].forEach(t => {
    const btn = document.getElementById('ptNavBtn-' + t);
    const indicator = document.getElementById('ptNavIndicator-' + t);
    if(btn) btn.style.color = '#52525b';
    if(indicator) indicator.style.opacity = '0';
    const iconDiv = btn?.querySelector('div');
    if(iconDiv) iconDiv.style.background = 'transparent';
});
const panel = document.getElementById('pt-tab-' + tab);
if(panel) panel.classList.remove('hidden');
const activeBtn = document.getElementById('ptNavBtn-' + tab);
const activeIndicator = document.getElementById('ptNavIndicator-' + tab);
if(activeBtn) activeBtn.style.color = '#6366f1';
if(activeIndicator) activeIndicator.style.opacity = '1';
const activeIcon = activeBtn?.querySelector('div');
if(activeIcon) activeIcon.style.background = 'rgba(99,102,241,0.15)';
if(tab === 'clients') window.renderPTClientsDashboard();
if(tab === 'plans') window.renderDayView();
if(tab === 'mytraining') window.renderPTMyTraining();
window._refreshLucide();
};

// ── UNIFIED CLIENT RENDER (replaces renderClientCards + renderPTClientsDashboard) ──
window.renderPTClientsDashboard = function() {
const listEl = document.getElementById('ptClientsList');
const emptyEl = document.getElementById('ptClientsEmpty');
if(!listEl) return;

const statClients = document.getElementById('ptStatClients');
const statSessions = document.getElementById('ptStatSessions');
const statWeekly = document.getElementById('ptStatWeekly');
if(statClients) statClients.textContent = window.clients.length;

let totalToday = 0, totalWeek = 0;
window.clients.forEach(c => {
    const s = window.computeClientStats(c.id);
    totalToday += s.today;
    totalWeek += s.week;
});
if(statSessions) statSessions.textContent = totalToday;
if(statWeekly) statWeekly.textContent = totalWeek;

if(window.clients.length === 0) {
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.classList.remove('hidden');
    return;
}
if(emptyEl) emptyEl.classList.add('hidden');

const weekAgo = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
listEl.innerHTML = window.clients.map(c => {
    const cw = window.getClientWorkouts(c.id);
    const sorted = [...cw].sort((a,b) => (b.date||'').localeCompare(a.date||''));
    const last = sorted[0];
    const lastStr = last ? (last.date||'').substring(5).replace('-','.') : 'Noch kein Training';
    const weekCount = cw.filter(w => w.date >= weekAgo).length;
    const initials = window._escapeHtml(c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2));
    const safeName = window._escapeHtml(c.name);
    const profile = window.getClientProfile(c.id);
    const goalTag = profile.goal ? `<span class="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase" style="background:rgba(99,102,241,0.1);color:rgba(99,102,241,0.7)">${window._escapeHtml(profile.goal)}</span>` : '';

    return `<div role="button" tabindex="0" aria-label="${window._escapeHtml(c.name)} Details öffnen" onclick="window.openClientDetail('${c.id}')"
        class="p-4 rounded-2xl cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] pointer-events-auto"
        style="background:var(--surface-hex);border:1px solid var(--border-hex)">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 text-white" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">${initials}</div>
            <div class="flex-1 min-w-0">
                <p class="font-black text-white text-sm truncate">${safeName}</p>
                <p class="text-[10px] font-bold uppercase tracking-widest truncate" style="color:var(--text-muted)">${lastStr}</p>
            </div>
        </div>
        ${goalTag}
        <div class="flex items-center justify-between mt-2">
            <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full" style="background:${weekCount > 0 ? '#10b981' : '#52525b'}"></div>
                <p class="text-[10px] font-bold" style="color:var(--text-muted)">${weekCount}× diese Woche</p>
            </div>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-zinc-600 pointer-events-none"></i>
        </div>
    </div>`;
}).join('');

// Also update legacy container if present
const legacy = document.getElementById('clientCardsContainer');
if(legacy) legacy.innerHTML = listEl.innerHTML;

window._refreshLucide();
};

// Alias for backward compat
window.renderClientCards = window.renderPTClientsDashboard;

window.renderPTPlansPicker = function() {
// Now handled by renderDayView
window.renderDayView();
};

window.renderPTMyTraining = function() {
window.switchMode('personal');
const inner = document.getElementById('ptMyTrainingInner');
if(inner) inner.innerHTML = '<p class="text-center text-[10px] font-bold uppercase tracking-widest py-4" style="color:rgba(99,102,241,0.6)">Persönlicher Training-Modus aktiv</p>';
window.switchTab('training');
window.deactivatePTMode();
window.showToast('💪 Persönlicher Modus — tippe auf KI Tools um zurückzukehren');
};

window.switchMode = function(mode) {
window.currentMode = mode;
const btnP = document.getElementById('btnModePersonal');
const btnPT = document.getElementById('btnModePT');
const ptDash = document.getElementById('ptDashboard');
// KI-Buttons: nur im Athleten-Modus sichtbar
var bWarm = document.getElementById('btnWarmup');
var bRec = document.getElementById('btnExerciseRec');
if(bWarm) bWarm.style.display = mode === 'personal' ? 'flex' : 'none';
if(bRec) bRec.style.display = mode === 'personal' ? 'flex' : 'none';
if(mode === 'pt') {
    if(btnP) { btnP.classList.remove('bg-zinc-800','text-primary'); btnP.classList.add('text-zinc-500'); }
    if(btnPT) { btnPT.classList.add('bg-zinc-800','text-primary'); btnPT.classList.remove('text-zinc-500'); }
    if(ptDash) { ptDash.classList.remove('hidden'); ptDash.classList.add('flex'); }
    window.renderPTClientsDashboard();
} else {
    window.currentClient = 'personal';
    if(btnP) { btnP.classList.add('bg-zinc-800','text-primary'); btnP.classList.remove('text-zinc-500'); }
    if(btnPT) { btnPT.classList.remove('bg-zinc-800','text-primary'); btnPT.classList.add('text-zinc-500'); }
    if(ptDash) { ptDash.classList.add('hidden'); ptDash.classList.remove('flex'); }
    const banner = document.getElementById('activeClientBanner');
    if(banner) { banner.classList.add('hidden'); banner.classList.remove('flex'); }
    const lsW = localStorage.getItem(window.getStorageKey());
    window.workouts = lsW ? JSON.parse(lsW) : [];
    window.renderTable(); window.calculateReadiness();
    if(window.listenToWorkouts) window.listenToWorkouts();
}
window._updateModeSwitchPill();
};

// ── MODE SWITCH PILL ──────────────────────────────────────
window._updateModeSwitchPill = function() {
    const pill = document.getElementById('modeSwitchPill');
    if(!pill) return;
    const hasPT = window.userProfile && window.userProfile.widgets && window.userProfile.widgets.ptMode;
    if(!hasPT) { pill.classList.add('hidden'); pill.classList.remove('inline-flex'); return; }
    pill.classList.remove('hidden'); pill.classList.add('inline-flex');
    if(window.currentMode === 'pt') {
        pill.textContent = 'ICH';
        pill.style.cssText = 'background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.2);color:#06b6d4;font-family:DM Sans,sans-serif;-webkit-tap-highlight-color:transparent';
    } else {
        pill.textContent = 'PT';
        pill.style.cssText = 'background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);color:#6366f1;font-family:DM Sans,sans-serif;-webkit-tap-highlight-color:transparent';
    }
};

window.togglePTAthleteMode = function() {
    if(window.currentMode === 'pt') {
        window.deactivatePTMode();
        window.switchMode('personal');
    } else {
        window.switchMode('pt');
        window.activatePTMode();
    }
};

// ── CLIENT CRUD ────────────────────────────────────────────
// ── CLIENT ONBOARDING WIZARD ─────────────────────────────
let _onboardStep = 1;
let _onboardData = {};
const _OB_GOALS = ['Muskelaufbau','Abnehmen','Ausdauer','Rehabilitation','Allgemeine Fitness','Wettkampf'];
const _OB_EXP = [{k:'Anfänger',icon:'star'},{k:'Fortgeschritten',icon:'zap'},{k:'Profi',icon:'crown'}];
const _OB_DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const _OB_TIMES = [{k:'Morgens',l:'06-12'},{k:'Mittags',l:'12-17'},{k:'Abends',l:'17-22'}];

window.addNewClient = function() {
_onboardStep = 1;
_onboardData = { goal:'', experience:'', injuries:'', days:[], time:'', age:'', weight:'' };
const el = (id) => document.getElementById(id);
if(el('obName')) el('obName').value = '';
if(el('obAge')) el('obAge').value = '';
if(el('obWeight')) el('obWeight').value = '';
if(el('obInjuries')) el('obInjuries').value = '';
window._renderOnboardStep();
window.toggleModal('clientOnboardModal');
window._refreshLucide();
};

window._renderOnboardStep = function() {
const el = (id) => document.getElementById(id);
[1,2,3].forEach(i => {
    const step = el('obStep' + i);
    const dot = el('obDot' + i);
    if(step) { step.classList.toggle('hidden', i !== _onboardStep); }
    if(dot) { dot.className = 'w-2.5 h-2.5 rounded-full transition-colors ' + (i === _onboardStep ? 'bg-indigo-500' : (i < _onboardStep ? 'bg-indigo-500/40' : 'bg-zinc-700')); }
});
const back = el('obBtnBack');
const next = el('obBtnNext');
if(back) back.classList.toggle('hidden', _onboardStep === 1);
if(next) next.textContent = _onboardStep === 3 ? 'Kunde anlegen' : 'Weiter';
// Render dynamic UI
if(_onboardStep === 2) { window._renderObGoals(); window._renderObExp(); }
if(_onboardStep === 3) { window._renderObDays(); window._renderObTimes(); }
};

window._renderObGoals = function() {
const c = document.getElementById('obGoalChips');
if(!c) return;
c.innerHTML = _OB_GOALS.map(g => {
    const active = _onboardData.goal === g;
    return `<button onclick="window._setObGoal('${g}')" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto transition-all ${active ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}">${window._escapeHtml(g)}</button>`;
}).join('');
};
window._setObGoal = function(g) { _onboardData.goal = g; window._renderObGoals(); };

window._renderObExp = function() {
const c = document.getElementById('obExpCards');
if(!c) return;
c.innerHTML = _OB_EXP.map(e => {
    const active = _onboardData.experience === e.k;
    return `<button onclick="window._setObExp('${e.k}')" class="flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer pointer-events-auto transition-all ${active ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'}"><i data-lucide="${e.icon}" class="w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-600'} pointer-events-none"></i><span class="text-[10px] font-black uppercase tracking-widest ${active ? 'text-indigo-400' : 'text-zinc-500'}">${window._escapeHtml(e.k)}</span></button>`;
}).join('');
window._refreshLucide();
};
window._setObExp = function(e) { _onboardData.experience = e; window._renderObExp(); };

window._renderObDays = function() {
const c = document.getElementById('obDaysRow');
if(!c) return;
c.innerHTML = _OB_DAYS.map(d => {
    const active = _onboardData.days.includes(d);
    return `<button onclick="window._toggleObDay('${d}')" class="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black cursor-pointer pointer-events-auto transition-all ${active ? 'bg-indigo-500 text-black' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}">${d}</button>`;
}).join('');
};
window._toggleObDay = function(d) {
const idx = _onboardData.days.indexOf(d);
if(idx >= 0) _onboardData.days.splice(idx, 1);
else _onboardData.days.push(d);
window._renderObDays();
};

window._renderObTimes = function() {
const c = document.getElementById('obTimeSlots');
if(!c) return;
c.innerHTML = _OB_TIMES.map(t => {
    const active = _onboardData.time === t.k;
    return `<button onclick="window._setObTime('${t.k}')" class="py-2.5 rounded-xl text-center cursor-pointer pointer-events-auto transition-all ${active ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700'}"><p class="text-[10px] font-black uppercase tracking-widest">${t.k}</p><p class="text-[9px] mt-0.5 opacity-60">${t.l}</p></button>`;
}).join('');
};
window._setObTime = function(t) { _onboardData.time = t; window._renderObTimes(); };

window.nextOnboardStep = function() {
if(_onboardStep === 1) {
    const name = (document.getElementById('obName')?.value || '').trim();
    if(!name) { window.showToast('Name ist Pflichtfeld!'); return; }
    _onboardData.name = name.substring(0, 60);
    _onboardData.age = document.getElementById('obAge')?.value || '';
    _onboardData.weight = document.getElementById('obWeight')?.value || '';
    _onboardStep = 2;
} else if(_onboardStep === 2) {
    _onboardData.injuries = (document.getElementById('obInjuries')?.value || '').trim().substring(0, 200);
    _onboardStep = 3;
} else if(_onboardStep === 3) {
    window.saveOnboardClient();
    return;
}
window._renderOnboardStep();
};
window.prevOnboardStep = function() {
if(_onboardStep > 1) { _onboardStep--; window._renderOnboardStep(); }
};

window.saveOnboardClient = function() {
const client = { id: 'client_' + Date.now(), name: _onboardData.name };
window.clients.push(client);
localStorage.setItem('beastmode_v2_clients', JSON.stringify(window.clients));
// Save profile
const profile = {
    goal: _onboardData.goal || '',
    experience: _onboardData.experience || '',
    injuries: _onboardData.injuries || '',
    notes: '',
    age: _onboardData.age || '',
    weight: _onboardData.weight || '',
    availableDays: _onboardData.days || [],
    preferredTime: _onboardData.time || ''
};
window.saveClientProfile(client.id, profile);
window.toggleModal('clientOnboardModal');
window.renderPTClientsDashboard();
window.showToast(`${window._escapeHtml(client.name)} hinzugefügt!`);
};

window.deleteClient = function() {
if(!_activeClientDetailId) return;
const c = window.clients.find(c => c.id === _activeClientDetailId);
if(!c) return;
window.showModal('Kunde löschen?', `"${window._escapeHtml(c.name)}" wirklich löschen? Alle Daten gehen verloren.`, true, () => {
    window.clients = window.clients.filter(c => c.id !== _activeClientDetailId);
    localStorage.setItem('beastmode_v2_clients', JSON.stringify(window.clients));
    localStorage.removeItem(`beastmode_v2_cache_${_activeClientDetailId}`);
    localStorage.removeItem(`base_client_profile_${_activeClientDetailId}`);
    delete _clientWorkoutCache[_activeClientDetailId];
    delete _clientProfileCache[_activeClientDetailId];
    const sessions = window.getSessions().filter(s => s.clientId !== _activeClientDetailId);
    window.saveSessions(sessions);
    window.toggleModal('clientDetailModal');
    window.renderPTClientsDashboard();
    window.showToast('Kunde gelöscht');
});
};

window.shareClientPortal = function() {
    if(!_activeClientDetailId) return;
    const clientId = _activeClientDetailId;
    // Kryptographisch sicheres Token generieren und persistent speichern
    let token = localStorage.getItem('base_portal_token_' + clientId);
    if(!token) {
        token = (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substring(2,10) + Math.random().toString(36).substring(2,10)));
        localStorage.setItem('base_portal_token_' + clientId, token);
    }
    const url = `${window.location.origin}/app.html?client_view=${clientId}&token=${token}`;
    if(navigator.share) {
        navigator.share({ title: 'Dein Training – BASE', url: url }).catch(() => {});
    } else if(navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => window.showToast('Link kopiert! 📋'));
    } else {
        window.showToast('Link: ' + url);
    }
};

window.editClientProfile = function() {
    if(!_activeClientDetailId) return;
    const c = window.clients.find(c => c.id === _activeClientDetailId);
    if(!c) return;
    const profile = window.getClientProfile(_activeClientDetailId);
    // Felder im Modal vorausfüllen
    const el = (id) => document.getElementById(id);
    if(el('cpEditName')) el('cpEditName').value = c.name || '';
    if(el('cpEditAge')) el('cpEditAge').value = profile.age || '';
    if(el('cpEditWeight')) el('cpEditWeight').value = profile.weight || '';
    if(el('cpEditGoal')) el('cpEditGoal').value = profile.goal || '';
    if(el('cpEditExp')) el('cpEditExp').value = profile.experience || '';
    if(el('cpEditInjuries')) el('cpEditInjuries').value = profile.injuries || '';
    if(el('cpEditNotes')) el('cpEditNotes').value = profile.notes || '';
    window.toggleModal('clientProfileEditModal');
    if(window.lucide) setTimeout(() => lucide.createIcons(), 30);
};

window.saveClientProfileFromModal = function() {
    if(!_activeClientDetailId) return;
    const c = window.clients.find(c => c.id === _activeClientDetailId);
    if(!c) return;
    const profile = window.getClientProfile(_activeClientDetailId);
    const el = (id) => document.getElementById(id);
    const newName = (el('cpEditName')?.value || '').trim().substring(0, 60);
    if(newName) {
        c.name = newName;
        localStorage.setItem('beastmode_v2_clients', JSON.stringify(window.clients));
    }
    profile.age = el('cpEditAge')?.value || '';
    profile.weight = el('cpEditWeight')?.value || '';
    profile.goal = (el('cpEditGoal')?.value || '').substring(0, 100);
    profile.experience = (el('cpEditExp')?.value || '').substring(0, 50);
    profile.injuries = (el('cpEditInjuries')?.value || '').trim().substring(0, 200);
    profile.notes = (el('cpEditNotes')?.value || '').trim().substring(0, 500);
    window.saveClientProfile(_activeClientDetailId, profile);
    window.toggleModal('clientProfileEditModal');
    window.openClientDetail(_activeClientDetailId);
    window.showToast('Profil aktualisiert ✅');
};

// ── CLIENT DETAIL (refactored) ─────────────────────────────
let _activeClientDetailId = null;

window.openClientDetail = function(id) {
_activeClientDetailId = id;
const c = window.clients.find(c => c.id === id);
if(!c) return;

const safeName = window._escapeHtml(c.name);
const avatar = document.getElementById('clientDetailAvatar');
const nameEl = document.getElementById('clientDetailName');
const subEl = document.getElementById('clientDetailSub');
if(avatar) avatar.textContent = c.name.charAt(0).toUpperCase();
if(nameEl) nameEl.textContent = c.name;

// Stats
const cw = window.getClientWorkouts(id);
const stats = window.computeClientStats(id);
const orms = {};
cw.filter(w => w.category === 'strength' && w.setDetails?.length > 0).forEach(w => {
    w.setDetails.forEach(s => {
        if(s.weight > 0 && s.reps > 0) {
            const orm = window.calc1RM ? window.calc1RM(s.weight, s.reps, 10) : 0;
            if(orm && (!orms[w.exercise] || orm > orms[w.exercise])) orms[w.exercise] = orm;
        }
    });
});
const topOrm = Object.entries(orms).sort((a,b)=>b[1]-a[1])[0];

const statsEl = document.getElementById('clientDetailStats');
if(statsEl) statsEl.innerHTML = `
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gesamt</p><p class="text-2xl font-black text-white">${stats.total}</p><p class="text-[10px] text-zinc-500">Workouts</p></div>
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Diese Woche</p><p class="text-2xl font-black text-white">${stats.week}</p><p class="text-[10px] text-zinc-500">Sessions</p></div>
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Top 1RM</p><p class="text-xl font-black text-white">${topOrm ? topOrm[1]+'kg' : '—'}</p><p class="text-[10px] text-zinc-500 truncate">${topOrm ? window._escapeHtml(topOrm[0]) : 'Keine Daten'}</p></div>`;
if(subEl) subEl.textContent = `${stats.total} Workouts · ${stats.week} diese Woche`;

// Profile tab
const profile = window.getClientProfile(id);
const goalEl = document.getElementById('clientProfileGoal');
const expEl = document.getElementById('clientProfileExp');
const injEl = document.getElementById('clientProfileInjuries');
const notesEl = document.getElementById('clientProfileNotes');
if(goalEl) goalEl.textContent = profile.goal || '—';
if(expEl) expEl.textContent = profile.experience || '—';
if(injEl) injEl.textContent = profile.injuries || '—';
if(notesEl) notesEl.textContent = profile.notes || '—';

// KI Toggle zurücksetzen
const toggle = document.getElementById('clientKiReportToggle');
const section = document.getElementById('clientKiReportSection');
const result = document.getElementById('clientReportResult');
if(toggle) toggle.checked = false;
if(section) { section.classList.add('hidden'); section.classList.remove('block'); }
if(result) { result.classList.add('hidden'); result.textContent = ''; }

// Workout-Liste
window._renderClientWorkoutsList(cw);

// Sessions for this client
// Reset client calendar to current month
_clientCalMonth = new Date().getMonth();
_clientCalYear = new Date().getFullYear();
_clientCalSelectedDate = new Date().toISOString().split('T')[0];
window._renderClientSessionsList(id);

// Compliance Rings
window._renderComplianceRings(id);

// Show profile tab by default
window.switchClientTab('profile');

window.toggleModal('clientDetailModal');
window._refreshLucide();
};

window._renderClientWorkoutsList = function(clientWorkouts) {
const listEl = document.getElementById('clientDetailWorkouts');
if(!listEl) return;
if(clientWorkouts.length === 0) {
    listEl.innerHTML = '<p class="text-zinc-600 text-xs text-center py-6 font-bold">Noch keine Workout-Daten.</p>';
    return;
}
const sorted = [...clientWorkouts].sort((a,b) => (b.date||'').localeCompare(a.date||''));
listEl.innerHTML = sorted.slice(0,20).map(w => {
    const cat = w.category || 'main';
    const ui = window.CAT_UI[cat] || window.CAT_UI['main'];
    let dataStr = '';
    if(w.setDetails?.length > 0) dataStr = w.setDetails.map(s=>`${s.reps}×${s.weight}kg`).join(' | ');
    else if(w.data) dataStr = Object.entries(w.data).slice(0,3).map(([k,v])=>`${window._escapeHtml(k)}: ${window._escapeHtml(String(v))}`).join(' · ');
    return `<div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg ${ui.bg} border ${ui.border} flex items-center justify-center ${ui.color} flex-shrink-0"><i data-lucide="${ui.icon}" class="w-3.5 h-3.5"></i></div>
        <div class="flex-1 min-w-0">
            <p class="text-white font-black text-sm truncate">${window._escapeHtml(w.exercise)}</p>
            <p class="text-zinc-500 text-[10px] font-bold truncate">${dataStr || '—'}</p>
        </div>
        <p class="text-zinc-600 text-[10px] font-bold flex-shrink-0">${(w.date||'').substring(5)}</p>
    </div>`;
}).join('');
};

let _clientCalMonth = new Date().getMonth();
let _clientCalYear = new Date().getFullYear();
let _clientCalSelectedDate = new Date().toISOString().split('T')[0];

window.clientCalShift = function(dir) {
_clientCalMonth += dir;
if(_clientCalMonth > 11) { _clientCalMonth = 0; _clientCalYear++; }
if(_clientCalMonth < 0) { _clientCalMonth = 11; _clientCalYear--; }
window._renderClientSessionsList(_activeClientDetailId);
};

window._renderClientSessionsList = function(clientId) {
if(!clientId) return;
const monthNames = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const labelEl = document.getElementById('clientCalMonthLabel');
if(labelEl) labelEl.textContent = `${monthNames[_clientCalMonth]} ${_clientCalYear}`;

// Get sessions only for this client
const clientSessions = window.getSessions().filter(s => s.clientId === clientId);
const sessionDates = {};
clientSessions.forEach(s => {
    if(!sessionDates[s.date]) sessionDates[s.date] = [];
    sessionDates[s.date].push(s);
});

const firstDay = new Date(_clientCalYear, _clientCalMonth, 1);
let startDow = firstDay.getDay();
if(startDow === 0) startDow = 7;
const daysInMonth = new Date(_clientCalYear, _clientCalMonth + 1, 0).getDate();
const today = new Date().toISOString().split('T')[0];

const grid = document.getElementById('clientCalGrid');
if(!grid) return;

let html = '';
for(let i = 1; i < startDow; i++) html += '<div class="h-8"></div>';

for(let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${_clientCalYear}-${String(_clientCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const isSelected = dateStr === _clientCalSelectedDate;
    const daySessions = sessionDates[dateStr] || [];
    const hasKraft = daySessions.some(s => s.type === 'kraft');
    const hasAusdauer = daySessions.some(s => s.type === 'ausdauer');
    const hasMobility = daySessions.some(s => s.type === 'mobility');

    let bg = 'transparent';
    let border = 'transparent';
    let textColor = 'var(--text-muted)';
    if(isSelected) { bg = 'rgba(99,102,241,0.2)'; border = 'rgba(99,102,241,0.5)'; textColor = '#6366f1'; }
    else if(isToday) { bg = 'rgba(99,102,241,0.08)'; border = 'rgba(99,102,241,0.2)'; textColor = '#fff'; }
    else if(daySessions.length > 0) { textColor = '#fff'; }

    const dots = (hasKraft ? '<span style="width:3px;height:3px;border-radius:50%;background:#06b6d4;display:inline-block"></span>' : '')
        + (hasAusdauer ? '<span style="width:3px;height:3px;border-radius:50%;background:#ef4444;display:inline-block"></span>' : '')
        + (hasMobility ? '<span style="width:3px;height:3px;border-radius:50%;background:#10b981;display:inline-block"></span>' : '');

    html += `<button onclick="window._selectClientCalDay('${dateStr}','${clientId}')" class="h-8 rounded flex flex-col items-center justify-center cursor-pointer pointer-events-auto transition-all hover:opacity-80" style="background:${bg};border:1px solid ${border}">
        <span class="text-[10px] font-black" style="color:${textColor}">${d}</span>
        ${dots ? `<div class="flex gap-px">${dots}</div>` : ''}
    </button>`;
}
grid.innerHTML = html;

// Render sessions for selected day
window._renderClientDaySessions(clientId, _clientCalSelectedDate);
};

window._selectClientCalDay = function(dateStr, clientId) {
_clientCalSelectedDate = dateStr;
window._renderClientSessionsList(clientId);
};

window._renderClientDaySessions = function(clientId, dateStr) {
const listEl = document.getElementById('clientDetailSessions');
const dayLabel = document.getElementById('clientCalDayLabel');
if(!listEl) return;

const d = new Date(dateStr);
const dayNames = ['So','Mo','Di','Mi','Do','Fr','Sa'];
const today = new Date().toISOString().split('T')[0];
if(dayLabel) dayLabel.textContent = dateStr === today ? 'Heute' : `${dayNames[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.`;

const daySessions = window.getSessions().filter(s => s.clientId === clientId && s.date === dateStr)
    .sort((a,b) => (a.time||'').localeCompare(b.time||''));

if(daySessions.length === 0) {
    listEl.innerHTML = '<p class="text-zinc-600 text-xs text-center py-4 font-bold">Keine Sessions an diesem Tag</p>';
    window._refreshLucide();
    return;
}
const typeMap = { kraft: {icon:'dumbbell',color:'#06b6d4',bg:'rgba(6,182,212,0.1)',border:'rgba(6,182,212,0.2)'}, ausdauer: {icon:'heart-pulse',color:'#ef4444',bg:'rgba(239,68,68,0.1)',border:'rgba(239,68,68,0.2)'}, mobility: {icon:'stretch-horizontal',color:'#10b981',bg:'rgba(16,185,129,0.1)',border:'rgba(16,185,129,0.2)'} };
listEl.innerHTML = daySessions.map(s => {
    const t = typeMap[s.type] || typeMap.kraft;
    return `<div onclick="window.openEditSession('${s.id}')" class="p-3 rounded-xl flex items-center gap-3 cursor-pointer pointer-events-auto transition-all hover:opacity-90" style="background:${t.bg};border:1px solid ${t.border}">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:${t.bg};border:1px solid ${t.border}"><i data-lucide="${t.icon}" class="w-3.5 h-3.5 pointer-events-none" style="color:${t.color}"></i></div>
        <div class="flex-1 min-w-0">
            <p class="text-white font-black text-sm truncate">${window._escapeHtml(s.focus || s.type)}</p>
            <p class="text-[10px] font-bold" style="color:var(--text-muted)">${s.time} · ${s.duration}min${s.exercises?.length ? ' · ' + s.exercises.length + ' Übungen' : ''}</p>
        </div>
    </div>`;
}).join('');
window._refreshLucide();
};

// ── CLIENT DETAIL TABS ─────────────────────────────────────
window.switchClientTab = function(tab) {
['profile','workouts','sessions'].forEach(t => {
    const panel = document.getElementById('clientPanel-' + t);
    const btn = document.getElementById('clientTab-' + t);
    if(panel) panel.classList.toggle('hidden', t !== tab);
    if(btn) {
        if(t === tab) {
            btn.style.background = 'rgba(99,102,241,0.15)';
            btn.style.color = '#6366f1';
        } else {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-muted)';
        }
    }
});
};

window.toggleClientKiReport = function(checked) {
const section = document.getElementById('clientKiReportSection');
if(section) {
    if(checked) { section.classList.remove('hidden'); section.classList.add('block'); }
    else { section.classList.add('hidden'); section.classList.remove('block'); }
}
};

// ── SESSION PLANNER ────────────────────────────────────────
let _sessionType = 'kraft';
let _sessionExercises = [];
let _editingSessionId = null;
let _ptDayOffset = 0;

window.setSessionType = function(type) {
_sessionType = type;
const typeColors = { kraft: {bg:'rgba(6,182,212,0.08)',border:'rgba(6,182,212,0.3)',color:'#06b6d4'}, ausdauer: {bg:'rgba(239,68,68,0.08)',border:'rgba(239,68,68,0.3)',color:'#ef4444'}, mobility: {bg:'rgba(16,185,129,0.08)',border:'rgba(16,185,129,0.3)',color:'#10b981'} };
document.querySelectorAll('.session-type-btn').forEach(btn => {
    btn.style.borderColor = 'rgba(63,63,70,1)';
    btn.style.background = 'rgba(24,24,27,1)';
    btn.style.color = '#a1a1aa';
});
const btns = document.querySelectorAll('.session-type-btn');
const idx = { kraft:0, ausdauer:1, mobility:2 }[type];
if(btns[idx]) {
    const c = typeColors[type];
    btns[idx].style.borderColor = c.border;
    btns[idx].style.background = c.bg;
    btns[idx].style.color = c.color;
}
};

window.addSessionExercise = function() {
    const input = document.getElementById('sessionExInput');
    if(!input || !input.value.trim()) return;
    const isCardio = _sessionType === 'ausdauer';
    const isMobility = _sessionType === 'mobility';
    _sessionExercises.push({
        name: input.value.trim().substring(0, 80),
        sets: isCardio || isMobility ? '' : '3',
        reps: isCardio || isMobility ? '' : '10',
        weight: isCardio ? '' : '',
        duration: isCardio || isMobility ? '30' : '',
        distance: isCardio ? '' : '',
        intensity: isCardio ? '' : '',
        notes: isMobility ? '' : ''
    });
    input.value = '';
    window._renderSessionExercises();
};

window.removeSessionExercise = function(idx) {
    _sessionExercises.splice(idx, 1);
    window._renderSessionExercises();
};

window.updateSessionExField = function(idx, field, value) {
    if(_sessionExercises[idx]) _sessionExercises[idx][field] = value;
};

window._renderSessionExercises = function() {
    const el = document.getElementById('sessionExercisesList');
    if(!el) return;
    const isCardio = _sessionType === 'ausdauer';
    const isMobility = _sessionType === 'mobility';
    el.innerHTML = _sessionExercises.map((ex, i) => {
        const esc = window._escapeHtml;
        const name = typeof ex === 'string' ? ex : ex.name;
        const obj = typeof ex === 'string' ? { name: ex, sets:'3', reps:'10', weight:'' } : ex;
        // Sicherstellen dass _sessionExercises[i] ein Objekt ist
        if(typeof ex === 'string') _sessionExercises[i] = obj;
        let detailHtml = '';
        if(isCardio) {
            detailHtml = `<div class="flex gap-2 mt-2">
                <input type="number" placeholder="Min" value="${esc(obj.duration||'')}" onchange="window.updateSessionExField(${i},'duration',this.value)" class="w-16 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-[10px] font-bold outline-none focus:border-indigo-500 text-center cursor-text pointer-events-auto">
                <input type="text" placeholder="Distanz" value="${esc(obj.distance||'')}" onchange="window.updateSessionExField(${i},'distance',this.value)" class="w-20 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-[10px] font-bold outline-none focus:border-indigo-500 text-center cursor-text pointer-events-auto">
                <input type="text" placeholder="Intensität" value="${esc(obj.intensity||'')}" onchange="window.updateSessionExField(${i},'intensity',this.value)" class="flex-1 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-[10px] font-bold outline-none focus:border-indigo-500 cursor-text pointer-events-auto">
            </div>`;
        } else if(isMobility) {
            detailHtml = `<div class="flex gap-2 mt-2">
                <input type="number" placeholder="Min" value="${esc(obj.duration||'')}" onchange="window.updateSessionExField(${i},'duration',this.value)" class="w-16 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-[10px] font-bold outline-none focus:border-indigo-500 text-center cursor-text pointer-events-auto">
                <input type="text" placeholder="Notizen" value="${esc(obj.notes||'')}" onchange="window.updateSessionExField(${i},'notes',this.value)" class="flex-1 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-[10px] font-bold outline-none focus:border-indigo-500 cursor-text pointer-events-auto">
            </div>`;
        } else {
            detailHtml = `<div class="flex gap-2 mt-2">
                <div class="flex items-center gap-1"><input type="number" placeholder="Sets" value="${esc(obj.sets||'')}" onchange="window.updateSessionExField(${i},'sets',this.value)" class="w-12 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-[10px] font-bold outline-none focus:border-indigo-500 text-center cursor-text pointer-events-auto"><span class="text-zinc-600 text-[10px] font-black">×</span></div>
                <input type="number" placeholder="Reps" value="${esc(obj.reps||'')}" onchange="window.updateSessionExField(${i},'reps',this.value)" class="w-12 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-[10px] font-bold outline-none focus:border-indigo-500 text-center cursor-text pointer-events-auto">
                <div class="flex items-center gap-1"><span class="text-zinc-600 text-[10px] font-black">@</span><input type="number" placeholder="kg" value="${esc(obj.weight||'')}" onchange="window.updateSessionExField(${i},'weight',this.value)" class="w-14 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-[10px] font-bold outline-none focus:border-indigo-500 text-center cursor-text pointer-events-auto"></div>
            </div>`;
        }
        return `<div class="px-3 py-2.5 rounded-lg" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">
            <div class="flex items-center gap-2">
                <span class="flex-1 text-white text-sm font-bold truncate">${esc(name)}</span>
                <button onclick="window.removeSessionExercise(${i})" class="text-zinc-500 hover:text-rose-400 cursor-pointer pointer-events-auto"><i data-lucide="x" class="w-3.5 h-3.5 pointer-events-none"></i></button>
            </div>
            ${detailHtml}
        </div>`;
    }).join('');
    window._refreshLucide();
};

window.openSessionModal = function(preselectedClientId) {
_editingSessionId = null;
_sessionExercises = [];
_sessionType = 'kraft';
const timeEl = document.getElementById('sessionTime');
const durEl = document.getElementById('sessionDuration');
const focusEl = document.getElementById('sessionFocus');
const deleteBtn = document.getElementById('sessionDeleteBtn');
if(timeEl) timeEl.value = '09:00';
if(durEl) durEl.value = '60';
if(focusEl) focusEl.value = '';
if(deleteBtn) deleteBtn.classList.add('hidden');
window.setSessionType('kraft');
window._renderSessionExercises();
window._renderSessionClientPills(preselectedClientId);
window.toggleModal('sessionPlannerModal');
window._refreshLucide();
};

window.openSessionModalForClient = function() {
if(_activeClientDetailId) {
    window.toggleModal('clientDetailModal');
    setTimeout(() => window.openSessionModal(_activeClientDetailId), 200);
}
};

window.openEditSession = function(sessionId) {
const sessions = window.getSessions();
const s = sessions.find(s => s.id === sessionId);
if(!s) return;
_editingSessionId = sessionId;
_sessionExercises = s.exercises || [];
_sessionType = s.type || 'kraft';
const timeEl = document.getElementById('sessionTime');
const durEl = document.getElementById('sessionDuration');
const focusEl = document.getElementById('sessionFocus');
const deleteBtn = document.getElementById('sessionDeleteBtn');
if(timeEl) timeEl.value = s.time || '09:00';
if(durEl) durEl.value = s.duration || 60;
if(focusEl) focusEl.value = s.focus || '';
if(deleteBtn) deleteBtn.classList.remove('hidden');
window.setSessionType(s.type || 'kraft');
window._renderSessionExercises();
window._renderSessionClientPills(s.clientId);
window.toggleModal('sessionPlannerModal');
window._refreshLucide();
};

let _sessionSelectedClient = null;

window._renderSessionClientPills = function(preselected) {
_sessionSelectedClient = preselected || null;
const el = document.getElementById('sessionClientPills');
if(!el) return;
if(window.clients.length === 0) {
    el.innerHTML = '<p class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--text-muted)">Erst Kunden anlegen</p>';
    return;
}
el.innerHTML = window.clients.map(c => {
    const active = c.id === _sessionSelectedClient;
    const style = active ? 'background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);color:#6366f1' : 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)';
    return `<button onclick="window._selectSessionClient('${c.id}')" class="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all pointer-events-auto" style="${style}">
        <div class="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[10px]" style="background:#6366f1">${c.name.charAt(0).toUpperCase()}</div>
        ${window._escapeHtml(c.name)}
    </button>`;
}).join('');
};

window._selectSessionClient = function(clientId) {
_sessionSelectedClient = clientId;
window._renderSessionClientPills(clientId);
};

window.saveSession = function() {
if(!_sessionSelectedClient) { window.showToast('Bitte Kunden wählen'); return; }
const time = document.getElementById('sessionTime')?.value || '09:00';
const duration = parseInt(document.getElementById('sessionDuration')?.value) || 60;
const focus = (document.getElementById('sessionFocus')?.value || '').trim().substring(0, 200);

const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + _ptDayOffset);
const dateStr = targetDate.toISOString().split('T')[0];

const sessions = window.getSessions();

if(_editingSessionId) {
    const idx = sessions.findIndex(s => s.id === _editingSessionId);
    if(idx !== -1) {
        sessions[idx] = { ...sessions[idx], clientId: _sessionSelectedClient, type: _sessionType, time, duration, focus, exercises: [..._sessionExercises], date: sessions[idx].date };
    }
} else {
    sessions.push({
        id: 'sess_' + Date.now(),
        clientId: _sessionSelectedClient,
        type: _sessionType,
        time,
        duration,
        focus,
        exercises: [..._sessionExercises],
        date: dateStr,
        createdAt: new Date().toISOString()
    });
}

window.saveSessions(sessions);
window.toggleModal('sessionPlannerModal');
window.renderDayView();
window.showToast('Session gespeichert ✅');
};

// --- SESSION VORLAGEN ---
window.saveSessionAsTemplate = function() {
    if(_sessionExercises.length === 0) { window.showToast('Keine Übungen zum Speichern'); return; }
    const name = (document.getElementById('sessionFocus')?.value || '').trim() || (_sessionType === 'kraft' ? 'Kraft-Vorlage' : _sessionType === 'ausdauer' ? 'Ausdauer-Vorlage' : 'Mobility-Vorlage');
    const templates = JSON.parse(localStorage.getItem('base_pt_session_templates') || '[]');
    templates.push({
        id: 'tpl_' + Date.now(),
        name: name.substring(0, 80),
        type: _sessionType,
        duration: parseInt(document.getElementById('sessionDuration')?.value) || 60,
        focus: name,
        exercises: JSON.parse(JSON.stringify(_sessionExercises)),
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('base_pt_session_templates', JSON.stringify(templates));
    window.showToast('Vorlage gespeichert ✅');
};

window.showSessionTemplates = function() {
    const templates = JSON.parse(localStorage.getItem('base_pt_session_templates') || '[]');
    if(templates.length === 0) { window.showToast('Noch keine Vorlagen gespeichert'); return; }
    const list = document.getElementById('sessionTemplateList');
    const container = document.getElementById('sessionTemplateSection');
    if(!list || !container) return;
    container.classList.toggle('hidden');
    if(container.classList.contains('hidden')) return;
    list.innerHTML = templates.map((t, i) => {
        const typeLabel = { kraft:'Kraft', ausdauer:'Ausdauer', mobility:'Mobility' }[t.type] || t.type;
        const exCount = (t.exercises || []).length;
        return `<div class="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer pointer-events-auto hover:bg-white/5 transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)" onclick="window.loadSessionTemplate(${i})">
            <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-bold truncate">${window._escapeHtml(t.name)}</p>
                <p class="text-[10px] text-zinc-500 font-bold">${typeLabel} · ${exCount} Übungen · ${t.duration}min</p>
            </div>
            <button onclick="event.stopPropagation();window.deleteSessionTemplate(${i})" class="text-zinc-600 hover:text-rose-400 cursor-pointer pointer-events-auto p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i></button>
        </div>`;
    }).join('');
    window._refreshLucide();
};

window.loadSessionTemplate = function(idx) {
    const templates = JSON.parse(localStorage.getItem('base_pt_session_templates') || '[]');
    const t = templates[idx];
    if(!t) return;
    _sessionType = t.type || 'kraft';
    _sessionExercises = JSON.parse(JSON.stringify(t.exercises || []));
    window.setSessionType(_sessionType);
    const durEl = document.getElementById('sessionDuration');
    const focusEl = document.getElementById('sessionFocus');
    if(durEl) durEl.value = t.duration || 60;
    if(focusEl) focusEl.value = t.focus || '';
    window._renderSessionExercises();
    document.getElementById('sessionTemplateSection')?.classList.add('hidden');
    window.showToast('Vorlage geladen');
};

window.deleteSessionTemplate = function(idx) {
    const templates = JSON.parse(localStorage.getItem('base_pt_session_templates') || '[]');
    templates.splice(idx, 1);
    localStorage.setItem('base_pt_session_templates', JSON.stringify(templates));
    window.showSessionTemplates();
    window.showToast('Vorlage gelöscht');
};

window.deleteSession = function() {
if(!_editingSessionId) return;
window.showModal('Session löschen?', 'Diese Session wird dauerhaft gelöscht.', true, () => {
    const sessions = window.getSessions().filter(s => s.id !== _editingSessionId);
    window.saveSessions(sessions);
    _editingSessionId = null;
    window.toggleModal('sessionPlannerModal');
    window.renderDayView();
    window.showToast('Session gelöscht');
});
};

// ── KALENDER (Month + Year View) ──────────────────────────
let _ptCalMonth = new Date().getMonth();
let _ptCalYear = new Date().getFullYear();
let _ptSelectedDate = new Date().toISOString().split('T')[0];

window.ptShiftMonth = function(dir) {
_ptCalMonth += dir;
if(_ptCalMonth > 11) { _ptCalMonth = 0; _ptCalYear++; }
if(_ptCalMonth < 0) { _ptCalMonth = 11; _ptCalYear--; }
window.renderPTCalendar();
};

// Keep ptShiftDay for backward compat (Quick-Track uses it indirectly)
window.ptShiftDay = function(dir) {
const d = new Date(_ptSelectedDate);
d.setDate(d.getDate() + dir);
_ptSelectedDate = d.toISOString().split('T')[0];
_ptCalMonth = d.getMonth();
_ptCalYear = d.getFullYear();
window.renderPTCalendar();
window.renderDayDetail(_ptSelectedDate);
};

window.renderDayView = function() { window.renderPTCalendar(); };

window.renderPTCalendar = function() {
const monthNames = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const labelEl = document.getElementById('ptCalMonthLabel');
if(labelEl) labelEl.textContent = `${monthNames[_ptCalMonth]} ${_ptCalYear}`;

const allSessions = window.getSessions();
const sessionDates = {};
allSessions.forEach(s => {
    if(!sessionDates[s.date]) sessionDates[s.date] = [];
    sessionDates[s.date].push(s);
});

const firstDay = new Date(_ptCalYear, _ptCalMonth, 1);
let startDow = firstDay.getDay();
if(startDow === 0) startDow = 7;
const daysInMonth = new Date(_ptCalYear, _ptCalMonth + 1, 0).getDate();
const today = new Date().toISOString().split('T')[0];

const grid = document.getElementById('ptCalGrid');
if(!grid) return;

let html = '';
// Empty cells before first day
for(let i = 1; i < startDow; i++) html += '<div class="h-10"></div>';

for(let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${_ptCalYear}-${String(_ptCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const isSelected = dateStr === _ptSelectedDate;
    const daySessions = sessionDates[dateStr] || [];
    const hasKraft = daySessions.some(s => s.type === 'kraft');
    const hasAusdauer = daySessions.some(s => s.type === 'ausdauer');
    const hasMobility = daySessions.some(s => s.type === 'mobility');

    let bg = 'transparent';
    let border = 'transparent';
    let textColor = 'var(--text-muted)';
    if(isSelected) { bg = 'rgba(99,102,241,0.2)'; border = 'rgba(99,102,241,0.5)'; textColor = '#6366f1'; }
    else if(isToday) { bg = 'rgba(99,102,241,0.08)'; border = 'rgba(99,102,241,0.2)'; textColor = '#fff'; }
    else if(daySessions.length > 0) { textColor = '#fff'; }

    const dots = (hasKraft ? '<span style="width:4px;height:4px;border-radius:50%;background:#06b6d4;display:inline-block"></span>' : '')
        + (hasAusdauer ? '<span style="width:4px;height:4px;border-radius:50%;background:#ef4444;display:inline-block"></span>' : '')
        + (hasMobility ? '<span style="width:4px;height:4px;border-radius:50%;background:#10b981;display:inline-block"></span>' : '');

    html += `<button onclick="window.selectCalDay('${dateStr}')" class="h-10 rounded-lg flex flex-col items-center justify-center cursor-pointer pointer-events-auto transition-all hover:opacity-80 relative" style="background:${bg};border:1px solid ${border}">
        <span class="text-xs font-black" style="color:${textColor}">${d}</span>
        ${dots ? `<div class="flex gap-0.5 mt-0.5">${dots}</div>` : ''}
    </button>`;
}
grid.innerHTML = html;

// Show day detail for selected date
window.renderDayDetail(_ptSelectedDate);
};

window.selectCalDay = function(dateStr) {
_ptSelectedDate = dateStr;
window.renderPTCalendar();
};

window.openSessionModalForDay = function() {
_ptDayOffset = Math.round((new Date(_ptSelectedDate) - new Date(new Date().toISOString().split('T')[0])) / 86400000);
window.openSessionModal();
};

window.renderDayDetail = function(dateStr) {
const detailEl = document.getElementById('ptDayDetail');
if(!detailEl) return;
detailEl.classList.remove('hidden');

const d = new Date(dateStr);
const dayNames = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const labelEl = document.getElementById('ptDayDetailLabel');
const today = new Date().toISOString().split('T')[0];
if(labelEl) labelEl.textContent = dateStr === today ? 'Heute' : `${dayNames[d.getDay()]}, ${d.getDate()}.${d.getMonth()+1}.`;

const allSessions = window.getSessions().filter(s => s.date === dateStr);
const sorted = [...allSessions].sort((a,b) => (a.time||'').localeCompare(b.time||''));

let kraft = 0, ausdauer = 0, mobility = 0;
sorted.forEach(s => { if(s.type==='kraft') kraft++; if(s.type==='ausdauer') ausdauer++; if(s.type==='mobility') mobility++; });
const kEl = document.getElementById('ptDayKraft');
const aEl = document.getElementById('ptDayCardio');
const mEl = document.getElementById('ptDayMobility');
if(kEl) kEl.textContent = kraft + ' Kraft';
if(aEl) aEl.textContent = ausdauer + ' Ausdauer';
if(mEl) mEl.textContent = mobility + ' Mobility';

const listEl = document.getElementById('ptDaySessions');
const emptyEl = document.getElementById('ptDayEmpty');
if(sorted.length === 0) {
    if(listEl) listEl.innerHTML = '';
    if(emptyEl) emptyEl.classList.remove('hidden');
    window._refreshLucide();
    return;
}
if(emptyEl) emptyEl.classList.add('hidden');

const typeMap = { kraft: {icon:'dumbbell',color:'#06b6d4',bg:'rgba(6,182,212,0.06)',border:'rgba(6,182,212,0.15)',pill:'rgba(6,182,212,0.15)',pillText:'#06b6d4',label:'Kraft'}, ausdauer: {icon:'heart-pulse',color:'#ef4444',bg:'rgba(239,68,68,0.06)',border:'rgba(239,68,68,0.15)',pill:'rgba(239,68,68,0.15)',pillText:'#ef4444',label:'Ausdauer'}, mobility: {icon:'stretch-horizontal',color:'#10b981',bg:'rgba(16,185,129,0.06)',border:'rgba(16,185,129,0.15)',pill:'rgba(16,185,129,0.15)',pillText:'#10b981',label:'Mobility'} };

if(listEl) listEl.innerHTML = sorted.map(s => {
    const t = typeMap[s.type] || typeMap.kraft;
    const client = window.clients.find(c => c.id === s.clientId);
    const clientName = client ? window._escapeHtml(client.name) : 'Unbekannt';
    const exList = (s.exercises||[]).slice(0,3).map(e => window._escapeHtml(e)).join(' · ');
    return `<div class="p-4 rounded-2xl transition-all" style="background:${t.bg};border:1px solid ${t.border}">
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 cursor-pointer pointer-events-auto" onclick="window.openEditSession('${s.id}')">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background:${t.pill}"><i data-lucide="${t.icon}" class="w-4 h-4 pointer-events-none" style="color:${t.color}"></i></div>
                <div>
                    <p class="text-white font-black text-sm">${clientName}</p>
                    <p class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--text-muted)">${s.time} · ${s.duration} min</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" style="background:${t.pill};color:${t.pillText}">${t.label}</span>
                <button onclick="window.startQuickTrack('${s.id}')" class="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto transition-all active:scale-95 flex items-center gap-1" style="background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.3);color:#06b6d4">
                    <i data-lucide="play" class="w-3 h-3 pointer-events-none"></i> Start
                </button>
            </div>
        </div>
        ${s.focus ? `<p class="text-zinc-300 text-xs font-bold mb-1">${window._escapeHtml(s.focus)}</p>` : ''}
        ${exList ? `<p class="text-zinc-500 text-[10px] font-bold truncate">${exList}</p>` : ''}
    </div>`;
}).join('');
window._refreshLucide();
};

// ── YEAR OVERVIEW ──────────────────────────────────────────
window.toggleYearView = function() {
const el = document.getElementById('ptYearView');
if(!el) return;
const isHidden = el.classList.contains('hidden');
el.classList.toggle('hidden');
if(isHidden) window.renderYearView();
};

window.renderYearView = function() {
const el = document.getElementById('ptYearView');
if(!el) return;
const allSessions = window.getSessions();
const year = _ptCalYear;
const monthNames = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

el.innerHTML = monthNames.map((name, mi) => {
    const daysInMonth = new Date(year, mi + 1, 0).getDate();
    let sessionCount = 0;
    for(let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(mi+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        if(allSessions.some(s => s.date === ds)) sessionCount++;
    }
    const intensity = Math.min(sessionCount / 10, 1);
    const bg = sessionCount > 0 ? `rgba(99,102,241,${0.08 + intensity * 0.2})` : 'var(--inner-bg-hex)';
    const border = sessionCount > 0 ? `rgba(99,102,241,${0.15 + intensity * 0.3})` : 'var(--border-hex)';
    return `<button onclick="window._goToMonth(${mi})" class="p-3 rounded-xl text-center cursor-pointer pointer-events-auto transition-all hover:opacity-80" style="background:${bg};border:1px solid ${border}">
        <p class="text-xs font-black text-white">${name}</p>
        <p class="text-[10px] font-bold" style="color:${sessionCount > 0 ? '#6366f1' : 'var(--text-muted)'}">${sessionCount} Tage</p>
    </button>`;
}).join('');
};

window._goToMonth = function(month) {
_ptCalMonth = month;
window.renderPTCalendar();
document.getElementById('ptYearView')?.classList.add('hidden');
};

// ── SELECT CLIENT (for workout tracking) ──────────────────
window.selectClient = function(id, name) {
window.currentClient = id; window.currentMode = 'client';
const ptDash = document.getElementById('ptDashboard');
if(ptDash) { ptDash.classList.add('hidden'); ptDash.classList.remove('flex'); }
const banner = document.getElementById('activeClientBanner');
const nameEl = document.getElementById('activeClientName');
if(banner) { banner.classList.remove('hidden'); banner.classList.add('flex'); }
if(nameEl) nameEl.textContent = name || '';
window.invalidateClientCache(id);
const lsW = localStorage.getItem(window.getStorageKey());
window.workouts = lsW ? JSON.parse(lsW) : [];
window.renderTable(); window.calculateReadiness();
if(window.listenToWorkouts) window.listenToWorkouts();
};

window.selectClientForPlan = function(clientId, clientName) {
window.selectClient(clientId, clientName);
};

// ── QUICK-TRACK: Live-Session mit Abhaken ──────────────────
let _qtSessionId = null;
let _qtExercises = [];
let _qtTimerInterval = null;
let _qtStartTime = null;

window.startQuickTrack = function(sessionId) {
const sessions = window.getSessions();
const s = sessions.find(s => s.id === sessionId);
if(!s) return;
const client = window.clients.find(c => c.id === s.clientId);
if(!client) return;

_qtSessionId = sessionId;
_qtStartTime = Date.now();
_qtExercises = (s.exercises || []).map((ex, i) => {
    const isObj = typeof ex === 'object' && ex !== null;
    const name = isObj ? ex.name : ex;
    // Pre-fill sets from planned data
    const preSets = [];
    if(isObj && ex.sets && ex.reps) {
        const numSets = parseInt(ex.sets) || 0;
        const reps = parseInt(ex.reps) || 0;
        const weight = parseFloat(ex.weight) || 0;
        for(let s = 0; s < numSets; s++) preSets.push({ reps, weight });
    }
    return { id: 'ex_' + i, name, sets: preSets, done: false, notes: isObj ? (ex.notes || '') : '' };
});

// If session has no exercises, add 3 empty slots
if(_qtExercises.length === 0) {
    _qtExercises = [
        { id: 'ex_0', name: 'Übung 1', sets: [], done: false, notes: '' },
        { id: 'ex_1', name: 'Übung 2', sets: [], done: false, notes: '' },
        { id: 'ex_2', name: 'Übung 3', sets: [], done: false, notes: '' }
    ];
}

// Populate header
const avatarEl = document.getElementById('qtAvatar');
const nameEl = document.getElementById('qtClientName');
const infoEl = document.getElementById('qtSessionInfo');
if(avatarEl) avatarEl.textContent = client.name.charAt(0).toUpperCase();
if(nameEl) nameEl.textContent = client.name;
const typeLabels = { kraft:'Kraft', ausdauer:'Ausdauer', mobility:'Mobility' };
if(infoEl) infoEl.textContent = `${typeLabels[s.type] || s.type} · ${s.duration || 60} min${s.focus ? ' · ' + s.focus : ''}`;

// Start timer
if(_qtTimerInterval) clearInterval(_qtTimerInterval);
_qtTimerInterval = setInterval(window._updateQtTimer, 1000);

window._renderQtExercises();
window.toggleModal('quickTrackModal');
window._refreshLucide();
};

window._updateQtTimer = function() {
if(!_qtStartTime) return;
const elapsed = Math.floor((Date.now() - _qtStartTime) / 1000);
const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
const s = (elapsed % 60).toString().padStart(2, '0');
const el = document.getElementById('qtTimer');
if(el) el.textContent = `${m}:${s}`;
};

window._renderQtExercises = function() {
const listEl = document.getElementById('qtExerciseList');
if(!listEl) return;

const doneCount = _qtExercises.filter(e => e.done).length;
const total = _qtExercises.length;
const pctEl = document.getElementById('qtProgressBar');
const pctText = document.getElementById('qtProgressText');
if(pctEl) pctEl.style.width = (total > 0 ? Math.round(doneCount/total*100) : 0) + '%';
if(pctText) pctText.textContent = `${doneCount}/${total}`;

listEl.innerHTML = _qtExercises.map((ex, idx) => {
    const setRows = ex.sets.map((s, si) => `
        <div class="flex items-center gap-2 mt-1.5">
            <span class="text-[10px] font-bold w-5 text-center" style="color:var(--text-muted)">S${si+1}</span>
            <input type="number" placeholder="Wdh" value="${s.reps||''}" onchange="window._qtUpdateSet(${idx},${si},'reps',this.value)" class="w-16 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-white text-xs font-bold text-center outline-none pointer-events-auto cursor-text">
            <span class="text-zinc-600 text-xs">×</span>
            <input type="number" placeholder="kg" value="${s.weight||''}" onchange="window._qtUpdateSet(${idx},${si},'weight',this.value)" class="w-16 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-white text-xs font-bold text-center outline-none pointer-events-auto cursor-text">
            <button onclick="window._qtRemoveSet(${idx},${si})" class="text-zinc-600 hover:text-rose-400 cursor-pointer pointer-events-auto"><i data-lucide="x" class="w-3 h-3 pointer-events-none"></i></button>
        </div>
    `).join('');

    const doneStyle = ex.done ? 'opacity:0.5;' : '';
    const checkColor = ex.done ? 'background:#10b981;border-color:#10b981;color:#000' : 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)';

    return `<div class="p-3 rounded-xl transition-all" style="background:var(--surface-hex);border:1px solid var(--border-hex);${doneStyle}">
        <div class="flex items-center gap-3 mb-1">
            <button onclick="window._qtToggleDone(${idx})" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all flex-shrink-0 text-xs font-black" style="${checkColor}">
                ${ex.done ? '✓' : (idx+1)}
            </button>
            <input type="text" value="${window._escapeHtml(ex.name)}" onchange="window._qtRenameEx(${idx},this.value)" class="flex-1 bg-transparent text-white font-black text-sm outline-none pointer-events-auto cursor-text truncate" ${ex.done ? 'disabled' : ''}>
        </div>
        ${!ex.done ? `
            ${setRows}
            <div class="flex items-center gap-2 mt-2">
                <button onclick="window._qtAddSet(${idx})" class="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest cursor-pointer pointer-events-auto transition-all" style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.15);color:#06b6d4">
                    <i data-lucide="plus" class="w-2.5 h-2.5 pointer-events-none"></i> Set
                </button>
                <input type="text" placeholder="Notiz..." value="${window._escapeHtml(ex.notes||'')}" onchange="window._qtNoteEx(${idx},this.value)" class="flex-1 px-2 py-1 bg-zinc-900/50 border border-zinc-800/50 rounded text-zinc-400 text-[10px] outline-none pointer-events-auto cursor-text">
            </div>
        ` : `<p class="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mt-1 ml-10">${ex.sets.length} Sets abgeschlossen${ex.notes ? ' · ' + window._escapeHtml(ex.notes) : ''}</p>`}
    </div>`;
}).join('');

window._refreshLucide();
};

window._qtToggleDone = function(idx) {
if(!_qtExercises[idx]) return;
_qtExercises[idx].done = !_qtExercises[idx].done;
window._renderQtExercises();
};

window._qtAddSet = function(idx) {
if(!_qtExercises[idx]) return;
_qtExercises[idx].sets.push({ reps: '', weight: '' });
window._renderQtExercises();
};

window._qtRemoveSet = function(exIdx, setIdx) {
if(!_qtExercises[exIdx]) return;
_qtExercises[exIdx].sets.splice(setIdx, 1);
window._renderQtExercises();
};

window._qtUpdateSet = function(exIdx, setIdx, field, val) {
if(!_qtExercises[exIdx] || !_qtExercises[exIdx].sets[setIdx]) return;
_qtExercises[exIdx].sets[setIdx][field] = parseFloat(val) || 0;
};

window._qtRenameEx = function(idx, val) {
if(!_qtExercises[idx]) return;
_qtExercises[idx].name = val.trim().substring(0, 80) || _qtExercises[idx].name;
};

window._qtNoteEx = function(idx, val) {
if(!_qtExercises[idx]) return;
_qtExercises[idx].notes = val.trim().substring(0, 200);
};

window.qtAddExercise = function() {
const input = document.getElementById('qtAddExInput');
if(!input || !input.value.trim()) return;
_qtExercises.push({ id: 'ex_' + Date.now(), name: input.value.trim().substring(0, 80), sets: [], done: false, notes: '' });
input.value = '';
window._renderQtExercises();
};

window.endQuickTrack = function() {
window.showModal('Abbrechen?', 'Session beenden ohne zu speichern?', true, () => {
    if(_qtTimerInterval) clearInterval(_qtTimerInterval);
    _qtTimerInterval = null;
    _qtStartTime = null;
    window.toggleModal('quickTrackModal');
});
};

window.saveQtAsTemplate = function() {
    if(!_qtExercises || _qtExercises.length === 0) { window.showToast('Keine Übungen zum Speichern'); return; }
    const s = window.getSessions().find(s => s.id === _qtSessionId);
    const name = s?.focus || 'Quick-Track Vorlage';
    const templates = JSON.parse(localStorage.getItem('base_pt_session_templates') || '[]');
    templates.push({
        id: 'tpl_' + Date.now(),
        name: name.substring(0, 80),
        type: s?.type || 'kraft',
        duration: s?.duration || 60,
        focus: name,
        exercises: _qtExercises.map(ex => ({ name: ex.name, sets: String(ex.sets?.length || 3), reps: ex.sets?.[0]?.reps ? String(ex.sets[0].reps) : '10', weight: ex.sets?.[0]?.weight ? String(ex.sets[0].weight) : '' })),
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('base_pt_session_templates', JSON.stringify(templates));
    window.showToast('Vorlage gespeichert ✅');
};

window.finishQuickTrack = function() {
if(!_qtSessionId) return;
const sessions = window.getSessions();
const s = sessions.find(s => s.id === _qtSessionId);
if(!s) return;

// Calculate duration
const elapsed = _qtStartTime ? Math.floor((Date.now() - _qtStartTime) / 1000) : 0;
const durationStr = Math.floor(elapsed/60) + ':' + (elapsed%60).toString().padStart(2,'0');

if(_qtTimerInterval) clearInterval(_qtTimerInterval);
_qtTimerInterval = null;

// Save each completed exercise as a workout for this client
const completedExercises = _qtExercises.filter(ex => ex.done || ex.sets.length > 0);
if(completedExercises.length > 0) {
    const clientKey = `beastmode_v2_cache_${s.clientId}`;
    const raw = localStorage.getItem(clientKey);
    const existingWorkouts = raw ? JSON.parse(raw) : [];
    const today = new Date().toISOString().split('T')[0];
    const sessionId = Date.now().toString();

    completedExercises.forEach(ex => {
        const category = s.type === 'ausdauer' ? 'cardio' : s.type === 'mobility' ? 'recovery' : 'strength';
        const entry = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2,4),
            exercise: ex.name,
            date: today,
            category: category,
            setDetails: ex.sets.filter(st => st.reps > 0 || st.weight > 0).map(st => ({ reps: st.reps || 0, weight: st.weight || 0 })),
            sessionId: sessionId,
            sessionDuration: durationStr,
            notes: ex.notes || '',
            archived: true
        };
        if(entry.setDetails.length > 0) {
            entry.volume = entry.setDetails.reduce((sum, st) => sum + (st.reps * st.weight), 0);
        }
        existingWorkouts.push(entry);
    });

    localStorage.setItem(clientKey, JSON.stringify(existingWorkouts));
    window.invalidateClientCache(s.clientId);
}

// Mark session as completed
const sIdx = sessions.findIndex(ss => ss.id === _qtSessionId);
if(sIdx !== -1) {
    sessions[sIdx].completed = true;
    sessions[sIdx].completedAt = new Date().toISOString();
    sessions[sIdx].actualDuration = durationStr;
    window.saveSessions(sessions);
}

_qtStartTime = null;
_qtSessionId = null;
window.toggleModal('quickTrackModal');
window.renderDayView();

const client = window.clients.find(c => c.id === s.clientId);
window.showToast(`Session mit ${client ? client.name : 'Kunde'} gespeichert! ✅ ${completedExercises.length} Übungen getrackt`);
};

// ── PDF EXPORT V2: Progressions-Charts + Trainer-Branding ──
window.setTrainerLogo = function() {
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/png,image/jpeg,image/webp';
input.onchange = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 500000) { window.showToast('Logo max 500KB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
        localStorage.setItem('base_trainer_logo', reader.result);
        window.showToast('Logo gespeichert! Wird in PDFs angezeigt.');
    };
    reader.readAsDataURL(file);
};
input.click();
};

window.setTrainerBranding = function() {
const current = JSON.parse(localStorage.getItem('base_trainer_branding') || '{}');
const name = prompt('Dein Name / Studio-Name:', current.name || '');
if(name === null) return;
const color = prompt('Akzentfarbe (Hex, z.B. #6366f1):', current.color || '#6366f1');
if(color === null) return;
const tagline = prompt('Slogan / Tagline (optional):', current.tagline || '');
localStorage.setItem('base_trainer_branding', JSON.stringify({
    name: (name||'').trim().substring(0,60),
    color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6366f1',
    tagline: (tagline||'').trim().substring(0,80)
}));
window.showToast('Branding gespeichert! ✅');
};

window._renderProgressionChart = function(exerciseName, dataPoints, width, height) {
const canvas = document.createElement('canvas');
canvas.width = width * 2;
canvas.height = height * 2;
const ctx = canvas.getContext('2d');
ctx.scale(2, 2);

if(dataPoints.length < 2) return null;

const values = dataPoints.map(d => d.value);
const minV = Math.min(...values) * 0.9;
const maxV = Math.max(...values) * 1.1;
const range = maxV - minV || 1;
const pad = { top: 24, right: 10, bottom: 20, left: 35 };
const chartW = width - pad.left - pad.right;
const chartH = height - pad.top - pad.bottom;

// Background
ctx.fillStyle = '#fafafa';
ctx.beginPath();
ctx.roundRect(0, 0, width, height, 6);
ctx.fill();

// Title
ctx.fillStyle = '#1a1a2e';
ctx.font = 'bold 9px Helvetica';
ctx.fillText(exerciseName, pad.left, 14);

// Value labels
ctx.fillStyle = '#999';
ctx.font = '7px Helvetica';
ctx.textAlign = 'right';
const steps = 3;
for(let i = 0; i <= steps; i++) {
    const v = minV + (range * i / steps);
    const yy = pad.top + chartH - (chartH * i / steps);
    ctx.fillText(Math.round(v) + 'kg', pad.left - 4, yy + 3);
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, yy);
    ctx.lineTo(pad.left + chartW, yy);
    ctx.stroke();
}

// Line
ctx.beginPath();
ctx.strokeStyle = '#6366f1';
ctx.lineWidth = 2;
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
dataPoints.forEach((d, i) => {
    const x = pad.left + (chartW * i / (dataPoints.length - 1));
    const y = pad.top + chartH - (chartH * (d.value - minV) / range);
    if(i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
});
ctx.stroke();

// Dots
dataPoints.forEach((d, i) => {
    const x = pad.left + (chartW * i / (dataPoints.length - 1));
    const y = pad.top + chartH - (chartH * (d.value - minV) / range);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
});

// Date labels
ctx.fillStyle = '#aaa';
ctx.font = '6px Helvetica';
ctx.textAlign = 'center';
const labelCount = Math.min(dataPoints.length, 5);
for(let i = 0; i < labelCount; i++) {
    const idx = Math.round(i * (dataPoints.length - 1) / (labelCount - 1));
    const x = pad.left + (chartW * idx / (dataPoints.length - 1));
    ctx.fillText(dataPoints[idx].date.substring(5), x, pad.top + chartH + 12);
}

// Trend arrow
const first = values[0], last = values[values.length - 1];
const pctChange = Math.round((last - first) / first * 100);
if(pctChange !== 0) {
    ctx.fillStyle = pctChange > 0 ? '#10b981' : '#ef4444';
    ctx.font = 'bold 8px Helvetica';
    ctx.textAlign = 'right';
    ctx.fillText((pctChange > 0 ? '+' : '') + pctChange + '%', width - 8, 14);
}

return canvas.toDataURL('image/png');
};

window.exportClientPDF = async function() {
if(!_activeClientDetailId) return;
const c = window.clients.find(c => c.id === _activeClientDetailId);
if(!c) return;

if(!window.jspdf) {
    window.showToast('PDF wird vorbereitet...');
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

const { jsPDF } = window.jspdf;
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const cw = window.getClientWorkouts(_activeClientDetailId);
const branding = JSON.parse(localStorage.getItem('base_trainer_branding') || '{}');
const accentHex = branding.color || '#6366f1';
const accentR = parseInt(accentHex.slice(1,3),16);
const accentG = parseInt(accentHex.slice(3,5),16);
const accentB = parseInt(accentHex.slice(5,7),16);
const w = doc.internal.pageSize.getWidth();
let y = 20;

// ── Header with branding ──
doc.setFillColor(15, 15, 20);
doc.rect(0, 0, w, 38, 'F');

// Trainer logo
const logoData = localStorage.getItem('base_trainer_logo');
if(logoData) {
    try { doc.addImage(logoData, 'PNG', 12, 6, 26, 26); } catch(e) { console.error('Fehler beim Einfügen des Trainer-Logos:', e); }
}
const logoOffset = logoData ? 44 : 15;

// Trainer name or BASE
doc.setTextColor(255, 255, 255);
doc.setFontSize(18);
doc.setFont('helvetica', 'bold');
doc.text(branding.name || 'BASE', logoOffset, 18);

if(branding.tagline) {
    doc.setFontSize(8);
    doc.setTextColor(accentR, accentG, accentB);
    doc.text(branding.tagline, logoOffset, 25);
}

// Client name + date (right aligned)
doc.setFontSize(14);
doc.setTextColor(255, 255, 255);
doc.text(c.name, w - 15, 18, { align: 'right' });
doc.setFontSize(8);
doc.setTextColor(150, 150, 160);
doc.text(new Date().toLocaleDateString('de-DE'), w - 15, 25, { align: 'right' });

// Accent bar
doc.setFillColor(accentR, accentG, accentB);
doc.rect(0, 38, w, 1.5, 'F');

y = 48;

// ── Progression Charts ──
doc.setFontSize(11);
doc.setFont('helvetica', 'bold');
doc.setTextColor(accentR, accentG, accentB);
doc.text('DEINE PROGRESSION', 15, y);
y += 8;

// Build progression data per exercise
const exerciseData = {};
const sorted = [...cw].sort((a,b) => (a.date||'').localeCompare(b.date||''));
sorted.forEach(wo => {
    if(wo.category !== 'strength' || !wo.setDetails?.length) return;
    const maxWeight = Math.max(...wo.setDetails.filter(s => s.weight > 0).map(s => s.weight));
    if(maxWeight <= 0) return;
    if(!exerciseData[wo.exercise]) exerciseData[wo.exercise] = [];
    exerciseData[wo.exercise].push({ date: wo.date, value: maxWeight });
});

// Filter: only exercises with 3+ data points (meaningful progression)
const chartExercises = Object.entries(exerciseData)
    .filter(([_, pts]) => pts.length >= 3)
    .sort((a,b) => b[1].length - a[1].length)
    .slice(0, 6);

if(chartExercises.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 130);
    doc.text('Noch nicht genug Daten für Progressions-Charts (min. 3 Workouts pro Übung).', 15, y);
    y += 12;
} else {
    const chartW = (w - 35) / 2;
    const chartH = 50;
    let col = 0;
    chartExercises.forEach(([name, pts]) => {
        if(y + chartH > 270) { doc.addPage(); y = 20; col = 0; }
        const imgData = window._renderProgressionChart(name, pts.slice(-12), chartW * 3.78, chartH * 3.78);
        if(imgData) {
            const x = col === 0 ? 15 : 15 + chartW + 5;
            doc.addImage(imgData, 'PNG', x, y, chartW, chartH);
            col++;
            if(col >= 2) { col = 0; y += chartH + 5; }
        }
    });
    if(col === 1) y += chartH + 5;
}

// ── Summary stats ──
y += 5;
if(y > 260) { doc.addPage(); y = 20; }
doc.setFillColor(245, 245, 248);
doc.roundedRect(15, y, w - 30, 18, 3, 3, 'F');
doc.setFontSize(8);
doc.setFont('helvetica', 'bold');
doc.setTextColor(80, 80, 90);
const stats = window.computeClientStats(_activeClientDetailId);
const bestExercises = chartExercises.slice(0,3).map(([name, pts]) => {
    const first = pts[0].value, last = pts[pts.length-1].value;
    const pct = Math.round((last - first) / first * 100);
    return `${name}: ${pct > 0 ? '+' : ''}${pct}%`;
}).join('  |  ');
doc.text(`${stats.total} Workouts gesamt  |  ${stats.week} diese Woche`, 20, y + 6);
doc.setFont('helvetica', 'normal');
doc.setTextColor(100, 100, 110);
if(bestExercises) doc.text(bestExercises, 20, y + 13);

// ── Footer ──
const pageCount = doc.internal.getNumberOfPages();
for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 170);
    const footerText = branding.name ? `${branding.name} · Powered by BASE` : 'Erstellt mit BASE';
    doc.text(`${footerText} · ${new Date().toLocaleDateString('de-DE')} · Seite ${i}/${pageCount}`, w/2, 290, { align: 'center' });
}

doc.save(`Report_${c.name.replace(/[^a-zA-Z0-9]/g,'_')}_${new Date().toISOString().split('T')[0]}.pdf`);
window.showToast('PDF heruntergeladen! 📄');
};

window.generateClientWeeklyReport = async function() {
if(!window.checkOnlineForAI()) return;
if(window.aiGate && !(await window.aiGate())) return;
if(!_activeClientDetailId) return;
const btn = document.getElementById('btnGenClientReport');
const resultEl = document.getElementById('clientReportResult');
if(btn) btn.textContent = '⏳ Analysiere...';

const clientWorkouts = window.getClientWorkouts(_activeClientDetailId);
const c = window.clients.find(c => c.id === _activeClientDetailId);
const clientName = c ? c.name : 'Kunde';
const profile = window.getClientProfile(_activeClientDetailId);
const recent = clientWorkouts.slice(0,14).map(w => {
    let d = w.setDetails ? w.setDetails.map(s=>`${s.reps}×${s.weight}kg`).join(', ') : '';
    if(w.data) d += ' ' + Object.entries(w.data).map(([k,v])=>`${k}:${v}`).join(' | ');
    return `[${w.date}] ${w.exercise}: ${d}`;
}).join('\n');

const profileContext = profile.goal || profile.injuries ? `\nKunden-Ziel: ${profile.goal || 'k.A.'}\nVerletzungen: ${profile.injuries || 'keine'}` : '';

const prompt = `Du bist Personal Trainer und erstellst einen professionellen Wochenbericht für einen Kunden.

Kunden-Name: ${clientName}${profileContext}
Letzte Workouts (2 Wochen):
${recent || 'Keine Daten'}

Erstelle einen prägnanten Wochenbericht mit:
1) Kurze Zusammenfassung der Woche (Frequenz, Aktivitäten)
2) Positiv aufgefallenes / Fortschritte
3) Empfehlung für nächste Woche

Schreibe professionell aber motivierend. Max 200 Wörter. Antworte auf ${window.getPromptLang()}. Der Trainer entscheidet selbst was er mit dem Bericht macht.`;

try {
    const res = await fetch('/.netlify/functions/gemini', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({contents:[{parts:[{text:prompt}]}]}) });
    const data = await res.json();
    if(resultEl) { resultEl.classList.remove('hidden'); resultEl.textContent = data.reply || 'Keine Antwort.'; }
} catch(e) {
    if(resultEl) { resultEl.classList.remove('hidden'); resultEl.textContent = 'Fehler: ' + e.message; }
} finally {
    if(btn) { btn.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4 pointer-events-none inline-block mr-2"></i> Wochenbericht generieren'; if(window.lucide) lucide.createIcons(); }
}
};

window.exportClientPlan = function() {
if(!_activeClientDetailId) return;
const clientWorkouts = window.getClientWorkouts(_activeClientDetailId);
const c = window.clients.find(c => c.id === _activeClientDetailId);
const clientName = c ? c.name : 'Kunde';
const recent = clientWorkouts.slice(0,10);
let text = `📊 Trainingsübersicht: ${clientName}\n`;
text += `Stand: ${new Date().toLocaleDateString('de-DE')}\n\n`;
recent.forEach(w => {
    let d = '';
    if(w.setDetails?.length > 0) d = w.setDetails.map(s=>`${s.reps}×${s.weight}kg`).join(' | ');
    else if(w.data) d = Object.entries(w.data).map(([k,v])=>`${k}: ${v}`).join(' · ');
    text += `• ${w.date}: ${w.exercise} — ${d}\n`;
});
text += '\nErstellt mit BASE Tracker';
if(navigator.share) {
    navigator.share({ title: `Training ${clientName}`, text });
} else {
    navigator.clipboard?.writeText(text).then(() => window.showToast('Kopiert! 📋'));
}
};

// ============================================================
// TRAINER-PROFIL & AKQUISE-SYSTEM (8a-8f)
// ============================================================

const TRAINER_SPECS = [
    'Krafttraining', 'Ausdauer', 'Gewichtsverlust', 'Rehabilitation',
    'Bodybuilding', 'CrossFit', 'Yoga/Pilates', 'Kampfsport',
    'Schwimmen', 'Senioren-Fitness', 'Prä/Postnatal', 'Athletik'
];

const CONTACT_TYPES = ['WhatsApp', 'E-Mail', 'Telefon'];

let _trainerProfileCache = null;
let _allTrainersCache = null;
let _selectedSpecs = [];
let _selectedContacts = [];
let _reviewTrainerId = null;
let _reviewRating = 0;

// ── 8a: TRAINER-PROFIL ERSTELLEN ──────────────────────────

window.openTrainerProfileEditor = function() {
    window._renderSpecChips();
    window._renderContactChips();
    // Vorhandenes Profil laden
    if(_trainerProfileCache) {
        const p = _trainerProfileCache;
        const el = (id) => document.getElementById(id);
        if(el('tpName')) el('tpName').value = p.name || '';
        if(el('tpCity')) el('tpCity').value = p.city || '';
        if(el('tpAbout')) el('tpAbout').value = p.about || '';
        if(el('tpPrice')) el('tpPrice').value = p.pricePerSession || '';
        if(el('tpCerts')) el('tpCerts').value = p.certifications || '';
        if(el('tpInstagram')) el('tpInstagram').value = (p.social && p.social.instagram) || '';
        if(el('tpTiktok')) el('tpTiktok').value = (p.social && p.social.tiktok) || '';
        _selectedSpecs = p.specializations || [];
        _selectedContacts = p.contact ? Object.keys(p.contact) : [];
        window._renderSpecChips();
        window._renderContactChips();
        window._renderContactFields();
        if(p.contact) {
            setTimeout(() => {
                if(p.contact.whatsapp && el('tpContactWhatsApp')) el('tpContactWhatsApp').value = p.contact.whatsapp;
                if(p.contact.email && el('tpContactEmail')) el('tpContactEmail').value = p.contact.email;
                if(p.contact.telefon && el('tpContactTelefon')) el('tpContactTelefon').value = p.contact.telefon;
            }, 50);
        }
        if(p.availability) {
            ['wd_m','wd_d','wd_e','sa_m','sa_d','sa_e','so_m','so_d','so_e'].forEach(k => {
                const cb = el('tpAvail_' + k);
                if(cb) cb.checked = !!p.availability[k];
            });
        }
        if(p.photo) {
            const preview = el('tpPhotoPreview');
            if(preview && window._safePhotoUrl(p.photo)) preview.innerHTML = `<img src="${window._safePhotoUrl(p.photo)}" class="w-full h-full object-cover" alt="Foto">`;
        }
        if(el('tpFreeConsult')) el('tpFreeConsult').checked = !!p.freeConsultation;
    } else {
        // Branding-Daten vorausfüllen
        const branding = JSON.parse(localStorage.getItem('base_trainer_branding') || '{}');
        const el = (id) => document.getElementById(id);
        if(branding.name && el('tpName')) el('tpName').value = branding.name;
        _selectedSpecs = [];
        _selectedContacts = [];
        window._renderSpecChips();
        window._renderContactChips();
    }
    window.toggleModal('trainerProfileModal');
    if(window.lucide) setTimeout(() => lucide.createIcons(), 30);
};

window._renderSpecChips = function() {
    const container = document.getElementById('tpSpecChips');
    if(!container) return;
    container.innerHTML = TRAINER_SPECS.map(s => {
        const active = _selectedSpecs.includes(s);
        return `<button onclick="window._toggleSpec('${s}')" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto transition-all ${active ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}">${window._escapeHtml(s)}</button>`;
    }).join('');
};

window._toggleSpec = function(spec) {
    const idx = _selectedSpecs.indexOf(spec);
    if(idx >= 0) _selectedSpecs.splice(idx, 1);
    else _selectedSpecs.push(spec);
    window._renderSpecChips();
};

window._renderContactChips = function() {
    const container = document.getElementById('tpContactChips');
    if(!container) return;
    container.innerHTML = CONTACT_TYPES.map(c => {
        const active = _selectedContacts.includes(c);
        return `<button onclick="window._toggleContact('${c}')" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto transition-all ${active ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}">${window._escapeHtml(c)}</button>`;
    }).join('');
};

window._toggleContact = function(type) {
    const idx = _selectedContacts.indexOf(type);
    if(idx >= 0) _selectedContacts.splice(idx, 1);
    else _selectedContacts.push(type);
    window._renderContactChips();
    window._renderContactFields();
};

window._renderContactFields = function() {
    const container = document.getElementById('tpContactFields');
    if(!container) return;
    if(_selectedContacts.length === 0) { container.classList.add('hidden'); container.innerHTML = ''; return; }
    container.classList.remove('hidden');
    container.innerHTML = _selectedContacts.map(c => {
        const id = 'tpContact' + c;
        const placeholder = c === 'WhatsApp' ? '+49...' : c === 'E-Mail' ? 'mail@example.com' : '+49...';
        const type = c === 'E-Mail' ? 'email' : 'tel';
        return `<div><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">${window._escapeHtml(c)}</p><input type="${type}" id="${id}" placeholder="${placeholder}" class="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-bold outline-none focus:border-indigo-500 cursor-text pointer-events-auto"></div>`;
    }).join('');
};

window.previewTrainerPhoto = function(input) {
    const file = input.files && input.files[0];
    if(!file) return;
    if(file.size > 500 * 1024) { window.showToast('Bild zu groß (max 500KB)'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('tpPhotoPreview');
        if(preview) preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover" alt="Foto">`;
    };
    reader.readAsDataURL(file);
};

window.saveTrainerProfile = async function() {
    const db = window._fbDb;
    const auth = window._fbAuth;
    if(!db || !auth || !auth.currentUser) { window.showToast('Bitte zuerst einloggen!'); return; }
    const el = (id) => document.getElementById(id);
    const name = (el('tpName')?.value || '').trim();
    if(!name) { window.showToast('Name ist Pflichtfeld!'); return; }
    if(_selectedSpecs.length === 0) { window.showToast('Mindestens eine Spezialisierung wählen!'); return; }

    const preview = document.getElementById('tpPhotoPreview');
    const img = preview?.querySelector('img');
    const photo = img ? img.src : '';

    const availability = {};
    ['wd_m','wd_d','wd_e','sa_m','sa_d','sa_e','so_m','so_d','so_e'].forEach(k => {
        const cb = el('tpAvail_' + k);
        if(cb && cb.checked) availability[k] = true;
    });

    const contact = {};
    _selectedContacts.forEach(c => {
        const val = (el('tpContact' + c)?.value || '').trim();
        if(val) contact[c.toLowerCase()] = val;
    });

    const profile = {
        name: name.substring(0, 60),
        photo: photo,
        specializations: _selectedSpecs,
        city: (el('tpCity')?.value || '').trim().substring(0, 60),
        about: (el('tpAbout')?.value || '').trim().substring(0, 500),
        pricePerSession: parseInt(el('tpPrice')?.value) || 0,
        availability: availability,
        contact: contact,
        social: {
            instagram: (el('tpInstagram')?.value || '').trim().substring(0, 60),
            tiktok: (el('tpTiktok')?.value || '').trim().substring(0, 60)
        },
        certifications: (el('tpCerts')?.value || '').trim().substring(0, 200),
        freeConsultation: !!el('tpFreeConsult')?.checked,
        rating: _trainerProfileCache?.rating || 0,
        reviewCount: _trainerProfileCache?.reviewCount || 0,
        active: true,
        createdAt: _trainerProfileCache?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    try {
        const docRef = window._fbDoc(db, 'trainer_profiles', auth.currentUser.uid);
        await window._fbSetDoc(docRef, profile);
        _trainerProfileCache = profile;

        // Stats-Dokument initialisieren falls noch nicht vorhanden
        const statsRef = window._fbDoc(db, 'trainer_profiles', auth.currentUser.uid, 'stats', 'views');
        try {
            const statsSnap = await window._fbGetDoc(statsRef);
            if(!statsSnap.exists()) {
                await window._fbSetDoc(statsRef, { profileViews: 0, contactClicks: 0 });
            }
        } catch(e) { /* ignore */ }

        window.toggleModal('trainerProfileModal');
        window.showToast('Trainer-Profil gespeichert!');
        window._updateTrainerProfileUI();
    } catch(err) {
        console.error('Trainer-Profil Fehler:', err);
        window.showToast('Fehler: ' + err.message);
    }
};

window.loadOwnTrainerProfile = async function() {
    const db = window._fbDb;
    const auth = window._fbAuth;
    if(!db || !auth || !auth.currentUser) return;
    try {
        const docRef = window._fbDoc(db, 'trainer_profiles', auth.currentUser.uid);
        const snap = await window._fbGetDoc(docRef);
        if(snap.exists()) {
            _trainerProfileCache = snap.data();
            window._updateTrainerProfileUI();
        }
    } catch(e) { /* ignore */ }
};

window._updateTrainerProfileUI = function() {
    const label = document.getElementById('trainerProfileBtnLabel');
    const sub = document.getElementById('trainerProfileBtnSub');
    const statsBar = document.getElementById('trainerStatsBar');
    if(_trainerProfileCache) {
        if(label) label.textContent = 'Profil bearbeiten';
        if(sub) sub.textContent = _trainerProfileCache.active ? 'Aktiv — sichtbar für alle' : 'Inaktiv';
        if(statsBar) {
            statsBar.classList.remove('hidden');
            statsBar.classList.add('grid');
            window._loadTrainerStats();
        }
    }
};

window._loadTrainerStats = async function() {
    const db = window._fbDb;
    const auth = window._fbAuth;
    if(!db || !auth || !auth.currentUser) return;
    try {
        const statsRef = window._fbDoc(db, 'trainer_profiles', auth.currentUser.uid, 'stats', 'views');
        const snap = await window._fbGetDoc(statsRef);
        if(snap.exists()) {
            const data = snap.data();
            const viewsEl = document.getElementById('trainerStatViews');
            const contactsEl = document.getElementById('trainerStatContacts');
            if(viewsEl) viewsEl.textContent = data.profileViews || 0;
            if(contactsEl) contactsEl.textContent = data.contactClicks || 0;
        }
        // Rating
        if(_trainerProfileCache) {
            const ratingEl = document.getElementById('trainerStatRating');
            if(ratingEl) {
                if(_trainerProfileCache.reviewCount > 0) {
                    ratingEl.textContent = (_trainerProfileCache.rating || 0).toFixed(1) + ' ★';
                } else {
                    ratingEl.textContent = '—';
                }
            }
        }
    } catch(e) { /* ignore */ }
};

// ── 8b: TRAINER-VERZEICHNIS ────────────────────────────────

window.openTrainerDirectory = async function() {
    window.toggleModal('trainerDirectoryModal');
    if(window.lucide) setTimeout(() => lucide.createIcons(), 30);
    window._renderTrainerSpecFilter();
    await window._loadAllTrainers();
};

let _trainerFilterSpec = '';

window._renderTrainerSpecFilter = function() {
    const container = document.getElementById('trainerSpecFilter');
    if(!container) return;
    container.innerHTML = '<button onclick="window._setTrainerSpecFilter(\'\')" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto transition-all ' + (!_trainerFilterSpec ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800') + '">Alle</button>' +
        TRAINER_SPECS.map(s => {
            const active = _trainerFilterSpec === s;
            return `<button onclick="window._setTrainerSpecFilter('${s}')" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto transition-all ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}">${window._escapeHtml(s)}</button>`;
        }).join('');
};

window._setTrainerSpecFilter = function(spec) {
    _trainerFilterSpec = spec;
    window._renderTrainerSpecFilter();
    window.filterTrainerList();
};

window._loadAllTrainers = async function() {
    const db = window._fbDb;
    if(!db) { document.getElementById('trainerDirectoryList').innerHTML = '<p class="text-zinc-500 text-sm col-span-full text-center py-8">Firebase nicht verfügbar</p>'; return; }
    try {
        const q = window._fbQuery(
            window._fbCollection(db, 'trainer_profiles'),
            window._fbWhere('active', '==', true)
        );
        const snap = await window._fbGetDocs(q);
        _allTrainersCache = [];
        snap.forEach(d => {
            _allTrainersCache.push({ uid: d.id, ...d.data() });
        });
        window.filterTrainerList();
    } catch(err) {
        console.error('Trainer laden Fehler:', err);
        document.getElementById('trainerDirectoryList').innerHTML = '<p class="text-zinc-500 text-sm col-span-full text-center py-8">Fehler beim Laden</p>';
    }
};

window.filterTrainerList = function() {
    if(!_allTrainersCache) return;
    const searchInput = document.getElementById('trainerSearchInput');
    const q = (searchInput?.value || '').toLowerCase().trim();
    let filtered = _allTrainersCache;
    if(q) {
        filtered = filtered.filter(t => (t.name || '').toLowerCase().includes(q) || (t.city || '').toLowerCase().includes(q));
    }
    if(_trainerFilterSpec) {
        filtered = filtered.filter(t => t.specializations && t.specializations.includes(_trainerFilterSpec));
    }
    window._renderTrainerCards(filtered);
};

window._renderTrainerCards = function(trainers) {
    const list = document.getElementById('trainerDirectoryList');
    if(!list) return;
    if(trainers.length === 0) {
        list.innerHTML = '<p class="text-zinc-500 text-sm col-span-full text-center py-8">Keine Trainer gefunden</p>';
        return;
    }
    const esc = window._escapeHtml;
    list.innerHTML = trainers.map(t => {
        const specs = (t.specializations || []).slice(0, 3).map(s => `<span class="bg-cyan-500/10 text-cyan-400 text-[9px] font-bold px-1.5 py-0.5 rounded">${esc(s)}</span>`).join(' ');
        const stars = t.reviewCount > 0 ? (t.rating || 0).toFixed(1) + ' ★ <span class="text-zinc-500">(' + t.reviewCount + ')</span>' : '<span class="text-zinc-500">Neu</span>';
        const safePhoto = window._safePhotoUrl(t.photo);
        const photo = safePhoto ? `<img src="${safePhoto}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="">` : `<div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 text-sm font-black">${esc((t.name || '??').substring(0,2).toUpperCase())}</div>`;
        return `<div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-500/30 transition-all">
            <div class="flex items-center gap-3 mb-3">
                ${photo}
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-black text-white truncate">${esc(t.name)}</p>
                    <p class="text-[10px] text-zinc-500 font-bold truncate">${esc(t.city || 'Keine Stadt')}</p>
                    <p class="text-[10px] font-bold text-amber-400 mt-0.5">${stars}</p>
                </div>
            </div>
            <div class="flex flex-wrap gap-1 mb-3">${specs}${t.freeConsultation ? '<span class="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">Gratis Erstgespräch</span>' : ''}</div>
            <div class="flex items-center justify-between">
                ${t.pricePerSession ? `<span class="text-white font-black text-sm">${t.pricePerSession}€<span class="text-zinc-500 text-[10px] font-bold">/Session</span></span>` : '<span class="text-zinc-500 text-[10px] font-bold">Preis n.V.</span>'}
                <button onclick="window.openTrainerDetail('${t.uid}')" class="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto hover:bg-cyan-500/20 transition-all">Profil</button>
            </div>
        </div>`;
    }).join('');
    if(window.lucide) setTimeout(() => lucide.createIcons(), 30);
};

// ── 8c: TRAINER-DETAILSEITE ────────────────────────────────

window.openTrainerDetail = async function(uid) {
    const db = window._fbDb;
    if(!db) return;

    // View-Counter inkrementieren
    const auth = window._fbAuth;
    if(auth && auth.currentUser && auth.currentUser.uid !== uid) {
        try {
            const statsRef = window._fbDoc(db, 'trainer_profiles', uid, 'stats', 'views');
            await window._fbUpdateDoc(statsRef, { profileViews: window._fbIncrement(1) }).catch(() => {});
        } catch(e) { /* ignore */ }
    }

    let trainer = _allTrainersCache?.find(t => t.uid === uid);
    if(!trainer) {
        try {
            const snap = await window._fbGetDoc(window._fbDoc(db, 'trainer_profiles', uid));
            if(snap.exists()) trainer = { uid: uid, ...snap.data() };
        } catch(e) { /* ignore */ }
    }
    if(!trainer) { window.showToast('Trainer nicht gefunden'); return; }

    // Reviews laden
    let reviews = [];
    try {
        const rq = window._fbQuery(
            window._fbCollection(db, 'trainer_reviews'),
            window._fbWhere('trainerUid', '==', uid),
            window._fbOrderBy('createdAt', 'desc'),
            window._fbLimit(5)
        );
        const rSnap = await window._fbGetDocs(rq);
        rSnap.forEach(d => reviews.push(d.data()));

        // Live Rating berechnen
        if(reviews.length > 0) {
            const allReviewsSnap = await window._fbGetDocs(window._fbQuery(
                window._fbCollection(db, 'trainer_reviews'),
                window._fbWhere('trainerUid', '==', uid)
            ));
            let sum = 0, count = 0;
            allReviewsSnap.forEach(d => { sum += d.data().rating || 0; count++; });
            trainer.rating = count > 0 ? sum / count : 0;
            trainer.reviewCount = count;
        }
    } catch(e) { /* ignore */ }

    window._renderTrainerDetail(trainer, reviews);
    window.toggleModal('trainerDetailModal');
    if(window.lucide) setTimeout(() => lucide.createIcons(), 30);
};

window._renderTrainerDetail = function(t, reviews) {
    const content = document.getElementById('trainerDetailContent');
    if(!content) return;
    const esc = window._escapeHtml;

    const safeDetailPhoto = window._safePhotoUrl(t.photo);
    const photo = safeDetailPhoto ? `<img src="${safeDetailPhoto}" class="w-full h-48 object-cover rounded-2xl mb-4" alt="${esc(t.name)}">` : '';
    const specs = (t.specializations || []).map(s => `<span class="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-lg">${esc(s)}</span>`).join(' ');
    const stars = t.reviewCount > 0 ? `<span class="text-amber-400 font-black">${(t.rating || 0).toFixed(1)} ★</span> <span class="text-zinc-500 text-xs">(${t.reviewCount} Bewertungen)</span>` : '<span class="text-zinc-500 text-xs">Noch keine Bewertungen</span>';

    // Verfügbarkeit Grid
    let availHtml = '';
    if(t.availability && Object.keys(t.availability).length > 0) {
        const days = [['Mo-Fr','wd'],['Sa','sa'],['So','so']];
        const times = [['Morgens','m'],['Mittags','d'],['Abends','e']];
        availHtml = '<div class="mt-4"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Verfügbarkeit</p><div class="grid grid-cols-4 gap-1 text-center">';
        availHtml += '<div></div>' + days.map(d => `<div class="text-[9px] text-zinc-500 font-bold">${d[0]}</div>`).join('');
        times.forEach(time => {
            availHtml += `<div class="text-[9px] text-zinc-500 font-bold text-right pr-2">${time[0]}</div>`;
            days.forEach(day => {
                const key = day[1] + '_' + time[1];
                const active = t.availability[key];
                availHtml += `<div class="flex justify-center"><span class="w-5 h-5 rounded flex items-center justify-center text-[10px] ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-700'}">•</span></div>`;
            });
        });
        availHtml += '</div></div>';
    }

    // Kontakt-Buttons
    let contactHtml = '<div class="flex flex-wrap gap-2 mt-4">';
    if(t.contact) {
        if(t.contact.whatsapp) contactHtml += `<a href="https://wa.me/${t.contact.whatsapp.replace(/[^0-9]/g,'')}?text=${encodeURIComponent('Hi, ich habe dich auf BASE gefunden und hätte Interesse an einem Probetraining!')}" target="_blank" onclick="window._trackTrainerContact('${t.uid}')" class="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-pointer pointer-events-auto hover:bg-emerald-500/20 transition-all">WhatsApp</a>`;
        if(t.contact.email || t.contact['e-mail']) contactHtml += `<a href="mailto:${esc(t.contact.email || t.contact['e-mail'])}?subject=${encodeURIComponent('Trainingsanfrage über BASE')}&body=${encodeURIComponent('Hi, ich habe dein Profil auf BASE gesehen und hätte Interesse an einem Probetraining!')}" onclick="window._trackTrainerContact('${t.uid}')" class="flex-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-pointer pointer-events-auto hover:bg-indigo-500/20 transition-all">E-Mail</a>`;
        if(t.contact.telefon) contactHtml += `<a href="tel:${esc(t.contact.telefon)}" onclick="window._trackTrainerContact('${t.uid}')" class="flex-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-pointer pointer-events-auto hover:bg-cyan-500/20 transition-all">Anrufen</a>`;
    }
    contactHtml += '</div>';

    // Reviews
    let reviewsHtml = '';
    if(reviews.length > 0) {
        reviewsHtml = '<div class="mt-4"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Bewertungen</p>';
        reviews.forEach(r => {
            const starsStr = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));
            reviewsHtml += `<div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 mb-2"><div class="flex items-center justify-between mb-1"><span class="text-amber-400 text-xs font-bold">${starsStr}</span><span class="text-[9px] text-zinc-600">${r.createdAt ? new Date(r.createdAt).toLocaleDateString('de-DE') : ''}</span></div>${r.text ? `<p class="text-zinc-300 text-xs">${esc(r.text)}</p>` : ''}</div>`;
        });
        reviewsHtml += '</div>';
    }

    // Bewerten-Button
    const auth = window._fbAuth;
    const canReview = auth && auth.currentUser && auth.currentUser.uid !== t.uid;
    const reviewBtn = canReview ? `<button onclick="window.openTrainerReview('${t.uid}')" class="w-full mt-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto hover:bg-amber-500/20 transition-all">Bewertung abgeben</button>` : '';

    content.innerHTML = `
        ${t.freeConsultation ? '<div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 flex items-center gap-2"><i data-lucide="gift" class="w-4 h-4 text-emerald-400 pointer-events-none"></i><span class="text-emerald-400 text-xs font-black uppercase tracking-widest">Gratis Erstgespräch verfügbar</span></div>' : ''}
        ${photo}
        <h3 class="text-xl font-black text-white">${esc(t.name)}</h3>
        <p class="text-sm text-zinc-400 mt-1">${esc(t.city || '')}</p>
        <p class="mt-2">${stars}</p>
        <div class="flex flex-wrap gap-1.5 mt-3">${specs}</div>
        ${t.about ? `<div class="mt-4"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Über mich</p><p class="text-zinc-300 text-sm">${esc(t.about)}</p></div>` : ''}
        ${t.certifications ? `<div class="mt-3"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Zertifizierungen</p><p class="text-zinc-300 text-sm">${esc(t.certifications)}</p></div>` : ''}
        ${t.pricePerSession ? `<div class="mt-3"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Preis pro Session</p><p class="text-white text-lg font-black">${t.pricePerSession}€</p></div>` : ''}
        ${t.social && (t.social.instagram || t.social.tiktok) ? `<div class="flex gap-2 mt-3">${t.social.instagram ? `<a href="https://instagram.com/${esc(t.social.instagram.replace('@',''))}" target="_blank" class="text-pink-400 text-xs font-bold hover:underline cursor-pointer pointer-events-auto">Instagram</a>` : ''}${t.social.tiktok ? `<a href="https://tiktok.com/@${esc(t.social.tiktok.replace('@',''))}" target="_blank" class="text-zinc-300 text-xs font-bold hover:underline cursor-pointer pointer-events-auto">TikTok</a>` : ''}</div>` : ''}
        ${availHtml}
        ${contactHtml}
        ${reviewsHtml}
        ${reviewBtn}
    `;
};

// ── 8d: KONTAKT-TRACKING ──────────────────────────────────

window._trackTrainerContact = async function(trainerUid) {
    const db = window._fbDb;
    if(!db) return;
    try {
        const statsRef = window._fbDoc(db, 'trainer_profiles', trainerUid, 'stats', 'views');
        await window._fbUpdateDoc(statsRef, { contactClicks: window._fbIncrement(1) }).catch(() => {});
    } catch(e) { /* ignore */ }
};

// ── 8e: TRAINER-BEWERTUNGEN ────────────────────────────────

window.openTrainerReview = function(trainerUid) {
    _reviewTrainerId = trainerUid;
    _reviewRating = 0;
    document.getElementById('reviewText').value = '';
    window._renderReviewStars();
    window.toggleModal('trainerReviewModal');
};

window._renderReviewStars = function() {
    const container = document.getElementById('reviewStars');
    if(!container) return;
    container.innerHTML = [1,2,3,4,5].map(i => {
        const active = i <= _reviewRating;
        return `<button onclick="window._setReviewRating(${i})" class="text-3xl cursor-pointer pointer-events-auto transition-transform hover:scale-110 ${active ? 'text-amber-400' : 'text-zinc-700'}">${active ? '★' : '☆'}</button>`;
    }).join('');
};

window._setReviewRating = function(rating) {
    _reviewRating = rating;
    window._renderReviewStars();
};

window.submitTrainerReview = async function() {
    const db = window._fbDb;
    const auth = window._fbAuth;
    if(!db || !auth || !auth.currentUser) { window.showToast('Bitte zuerst einloggen!'); return; }
    if(_reviewRating < 1 || _reviewRating > 5) { window.showToast('Bitte Sterne auswählen!'); return; }
    if(!_reviewTrainerId) return;

    const text = (document.getElementById('reviewText')?.value || '').trim().substring(0, 300);

    try {
        await window._fbAddDoc(window._fbCollection(db, 'trainer_reviews'), {
            trainerUid: _reviewTrainerId,
            reviewerUid: auth.currentUser.uid,
            rating: _reviewRating,
            text: text,
            createdAt: new Date().toISOString()
        });

        // Rating im Trainer-Profil aktualisieren
        const allReviewsSnap = await window._fbGetDocs(window._fbQuery(
            window._fbCollection(db, 'trainer_reviews'),
            window._fbWhere('trainerUid', '==', _reviewTrainerId)
        ));
        let sum = 0, count = 0;
        allReviewsSnap.forEach(d => { sum += d.data().rating || 0; count++; });
        const avgRating = count > 0 ? sum / count : 0;
        await window._fbUpdateDoc(window._fbDoc(db, 'trainer_profiles', _reviewTrainerId), {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: count
        });

        window.toggleModal('trainerReviewModal');
        window.showToast('Bewertung abgeschickt!');
        // Detail-Modal aktualisieren
        window.openTrainerDetail(_reviewTrainerId);
    } catch(err) {
        console.error('Review Fehler:', err);
        window.showToast('Fehler: ' + err.message);
    }
};

// ============================================================
// COMPLIANCE TRACKING (SVG Progress-Ringe)
// ============================================================
window.computeCompliance = function(clientId) {
    const sessions = window.getSessions().filter(s => s.clientId === clientId);
    const now = new Date(); now.setHours(23,59,59,999);
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);

    let weekPlanned = 0, weekDone = 0, monthPlanned = 0, monthDone = 0, totalPlanned = 0, totalDone = 0;
    sessions.forEach(s => {
        const d = new Date(s.date);
        if(d > now) return; // Zukünftige ignorieren
        totalPlanned++;
        if(s.completed) totalDone++;
        if(d >= weekAgo) { weekPlanned++; if(s.completed) weekDone++; }
        if(d >= monthAgo) { monthPlanned++; if(s.completed) monthDone++; }
    });
    return {
        week: { done: weekDone, planned: weekPlanned, pct: weekPlanned > 0 ? Math.round((weekDone / weekPlanned) * 100) : -1 },
        month: { done: monthDone, planned: monthPlanned, pct: monthPlanned > 0 ? Math.round((monthDone / monthPlanned) * 100) : -1 },
        total: { done: totalDone, planned: totalPlanned, pct: totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : -1 }
    };
};

window._renderComplianceRings = function(clientId) {
    const row = document.getElementById('complianceRingsRow');
    if(!row) return;
    const c = window.computeCompliance(clientId);
    const rings = [
        { label: 'Woche', color: '#06b6d4', data: c.week },
        { label: 'Monat', color: '#f59e0b', data: c.month },
        { label: 'Gesamt', color: '#10b981', data: c.total }
    ];
    const circumference = 2 * Math.PI * 28; // 175.93
    row.innerHTML = rings.map(r => {
        const pct = r.data.pct;
        const offset = pct >= 0 ? circumference - (circumference * pct / 100) : circumference;
        const label = pct >= 0 ? pct + '%' : '—';
        const sub = pct >= 0 ? r.data.done + '/' + r.data.planned : 'Keine';
        return `<div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center">
            <svg width="56" height="56" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="4"/><circle cx="32" cy="32" r="28" fill="none" stroke="${r.color}" stroke-width="4" stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" stroke-linecap="round" transform="rotate(-90 32 32)" style="transition:stroke-dashoffset 0.8s ease"/><text x="32" y="36" text-anchor="middle" fill="white" font-size="13" font-weight="900" font-family="DM Sans,sans-serif">${label}</text></svg>
            <p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">${r.label}</p>
            <p class="text-[9px] text-zinc-600">${sub}</p>
        </div>`;
    }).join('');
    row.classList.remove('hidden');
    row.classList.add('grid');
};

// ============================================================
// KI CHECK-IN
// ============================================================
let _lastCheckInText = '';

window.generateKiCheckIn = async function() {
    if(!window.checkOnlineForAI()) return;
    if(window.aiGate && !(await window.aiGate())) return;
    if(!_activeClientDetailId) return;
    const btn = document.getElementById('btnKiCheckIn');
    if(btn) btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin pointer-events-none"></i> Generiere...';

    const c = window.clients.find(c => c.id === _activeClientDetailId);
    const clientName = c ? c.name : 'Kunde';
    const profile = window.getClientProfile(_activeClientDetailId);
    const compliance = window.computeCompliance(_activeClientDetailId);
    const cw = window.getClientWorkouts(_activeClientDetailId);
    const recent = cw.slice(0, 10).map(w => {
        let d = w.setDetails ? w.setDetails.map(s => s.reps + '×' + s.weight + 'kg').join(', ') : '';
        if(w.data) d += ' ' + Object.entries(w.data).slice(0, 3).map(([k,v]) => k + ':' + v).join(' | ');
        return w.date + ' ' + w.exercise + ': ' + d;
    }).join('\n');

    const lang = window.currentLang === 'de' ? 'Deutsch' : (window.currentLang === 'en' ? 'Englisch' : window.currentLang || 'Deutsch');
    const prompt = `Du bist ein Personal Trainer und schreibst einen kurzen motivierenden Check-In für deinen Kunden. Sei persönlich, nenne konkrete Übungen und Fortschritte. Kurz und knackig. Max 80 Wörter.

Kunde: ${clientName}
Ziel: ${profile.goal || 'k.A.'}
Verletzungen: ${profile.injuries || 'keine'}
Compliance diese Woche: ${compliance.week.pct >= 0 ? compliance.week.pct + '%' : 'k.A.'}
Letzte Workouts:
${recent || 'Keine Daten'}

Antworte auf ${lang}.`;

    try {
        const res = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        _lastCheckInText = data.result || data.text || 'Keine Antwort erhalten.';
        const textEl = document.getElementById('kiCheckInText');
        if(textEl) textEl.textContent = _lastCheckInText;
        window.toggleModal('kiCheckInModal');
        window._refreshLucide();
    } catch(err) {
        window.showToast('Fehler: ' + err.message);
    }
    if(btn) btn.innerHTML = '<i data-lucide="message-circle" class="w-3.5 h-3.5 pointer-events-none"></i> KI Check-In';
    window._refreshLucide();
};

window._sendCheckInWhatsApp = function() {
    if(!_lastCheckInText) return;
    const text = encodeURIComponent(_lastCheckInText + '\n\n— Dein Trainer via BASE');
    window.open('https://wa.me/?text=' + text, '_blank');
};

window._copyCheckInText = function() {
    if(!_lastCheckInText) return;
    navigator.clipboard.writeText(_lastCheckInText).then(() => window.showToast('Kopiert!'));
};

// ============================================================
// BRANDED TRAINER-LINK
// ============================================================
window.shareTrainerBrandLink = function() {
    const auth = window._fbAuth;
    if(!auth || !auth.currentUser) { window.showToast('Bitte zuerst einloggen!'); return; }
    const url = 'https://base-app.tech/app.html?brand=' + auth.currentUser.uid;
    if(navigator.share) {
        navigator.share({ title: 'BASE Fitness', text: 'Tracke dein Training mit meiner personalisierten App:', url: url });
    } else {
        navigator.clipboard.writeText(url).then(() => window.showToast('Link kopiert!'));
    }
};

window.previewTrainerBrand = function() {
    const auth = window._fbAuth;
    if(!auth || !auth.currentUser) return;
    if(window.openTrainerDetail) window.openTrainerDetail(auth.currentUser.uid);
};

window.applyTrainerBranding = function() {
    const raw = localStorage.getItem('base_brand_override');
    if(!raw) return;
    try {
        const brand = JSON.parse(raw);
        if(brand.name) {
            const subEl = document.querySelector('#profileHeader .text-zinc-500, [data-trainer-brand-name]');
            if(subEl) { subEl.textContent = brand.name; subEl.setAttribute('data-trainer-brand-name', '1'); }
        }
        if(brand.color) {
            document.documentElement.style.setProperty('--primary-hex', brand.color);
        }
    } catch(e) { /* ignore */ }
};

window.clearTrainerBranding = function() {
    localStorage.removeItem('base_brand_override');
    location.reload();
};

// ── INIT: Trainer-Profil beim PT-Tab-Switch laden ──────────
const _origSwitchPTTab = window.switchPTTab;
window.switchPTTab = function(tab) {
    _origSwitchPTTab(tab);
    if(tab === 'pttools') {
        window.loadOwnTrainerProfile();
    }
};
