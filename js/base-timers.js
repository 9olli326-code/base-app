// ============================================================
// BASE TIMERS — Workout Timer, Rest Timer, HIIT Intervall-Timer, Audio
// Ausgelagert aus app.html für Modularisierung
// ============================================================

// ============================================================
// FEATURE 4: HIIT INTERVALL-TIMER (Timestamp-basiert — Sperrbildschirm-fest)
// ============================================================
let _hiitInterval = null;
let _hiitPhaseEndTime = null;
let _hiitCurrentPhase = 'work';
let _hiitCurrentRound = 0;
let _hiitTotalRounds = 8;
let _hiitRunning = false;
let _hiitPausedRemaining = 0;

window.toggleHiitTimer = function() {
    const settings = document.getElementById('hiitSettings');
    const btn = document.getElementById('btnHiitToggle');
    if(!settings) return;
    const isVisible = !settings.classList.contains('hidden');
    settings.classList.toggle('hidden', isVisible);
    if(btn) btn.textContent = isVisible ? 'Einrichten' : 'Fertig';
};

function _hiitGetWorkSecs() { return parseInt(document.getElementById('hiitWork')?.value) || 40; }
function _hiitGetRestSecs() { return parseInt(document.getElementById('hiitRest')?.value) || 20; }

window.startHiit = function() {
    if(_hiitRunning) {
        _hiitPausedRemaining = Math.max(0, Math.ceil((_hiitPhaseEndTime - Date.now()) / 1000));
        clearInterval(_hiitInterval); _hiitRunning = false; _hiitPhaseEndTime = null;
        const btn = document.getElementById('btnHiitStart');
        if(btn) btn.textContent = '▶ Weiter';
        return;
    }
    if(_hiitCurrentRound === 0) {
        _hiitTotalRounds = parseInt(document.getElementById('hiitRounds')?.value) || 8;
        _hiitCurrentRound = 1; _hiitCurrentPhase = 'work';
        _hiitPausedRemaining = _hiitGetWorkSecs();
    }
    _hiitRunning = true;
    _hiitPhaseEndTime = Date.now() + (_hiitPausedRemaining * 1000);
    const btn = document.getElementById('btnHiitStart');
    if(btn) btn.textContent = '⏸ Pause';
    const tick = () => {
        const remaining = Math.max(0, Math.ceil((_hiitPhaseEndTime - Date.now()) / 1000));
        _hiitPausedRemaining = remaining;
        if(remaining <= 0) {
            if(_hiitCurrentPhase === 'work') {
                _hiitCurrentPhase = 'rest';
                _hiitPhaseEndTime = Date.now() + (_hiitGetRestSecs() * 1000);
                window.playBeep && window.playBeep();
            } else {
                _hiitCurrentRound++;
                if(_hiitCurrentRound > _hiitTotalRounds) {
                    window.resetHiit(); window.showToast('🎉 HIIT abgeschlossen!');
                    window.playBeep && window.playBeep(); return;
                }
                _hiitCurrentPhase = 'work';
                _hiitPhaseEndTime = Date.now() + (_hiitGetWorkSecs() * 1000);
                window.playBeep && window.playBeep();
            }
        }
        window.updateHiitDisplay();
    };
    tick();
    _hiitInterval = setInterval(tick, 1000);
};

window.updateHiitDisplay = function() {
    const timeEl = document.getElementById('hiitTime');
    const phaseEl = document.getElementById('hiitPhaseLabel');
    const roundEl = document.getElementById('hiitRoundLabel');
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4';
    const restColor = '#10b981';
    const secs = _hiitPhaseEndTime ? Math.max(0, Math.ceil((_hiitPhaseEndTime - Date.now()) / 1000)) : _hiitPausedRemaining;
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    if(timeEl) { timeEl.textContent = String(mins).padStart(2,'0') + ':' + String(s).padStart(2,'0'); timeEl.style.color = _hiitCurrentPhase === 'work' ? primary : restColor; }
    if(phaseEl) { phaseEl.textContent = _hiitCurrentPhase === 'work' ? '💪 Arbeit' : '😮‍💨 Pause'; phaseEl.style.color = _hiitCurrentPhase === 'work' ? primary : restColor; }
    if(roundEl) roundEl.textContent = 'Runde ' + _hiitCurrentRound + ' / ' + _hiitTotalRounds;
};

window.resetHiit = function() {
    clearInterval(_hiitInterval); _hiitRunning = false;
    _hiitCurrentRound = 0; _hiitCurrentPhase = 'work';
    _hiitPhaseEndTime = null; _hiitPausedRemaining = 0;
    const timeEl = document.getElementById('hiitTime');
    const phaseEl = document.getElementById('hiitPhaseLabel');
    const roundEl = document.getElementById('hiitRoundLabel');
    const btn = document.getElementById('btnHiitStart');
    if(timeEl) timeEl.textContent = '00:00';
    if(phaseEl) { phaseEl.textContent = 'Bereit'; phaseEl.style.color = 'var(--text-muted)'; }
    if(roundEl) roundEl.textContent = '—';
    if(btn) btn.textContent = '▶ Start';
};


// --- WORKOUT TIMER (Timestamp-basiert — Sperrbildschirm-fest) ---
let _workoutStartedAt = null;
let _workoutAccumulated = 0;
function _updateWorkoutDisplay() {
    let total = _workoutAccumulated;
    if (window.isWorkoutTimerRunning && _workoutStartedAt) total += Math.floor((Date.now() - _workoutStartedAt) / 1000);
    window.workoutTimerSeconds = total;
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    const timeStr = m + ':' + s;
    const display = document.getElementById('workoutTimerDisplay');
    if (display) display.textContent = timeStr;
    const fabText = document.getElementById('fabTimerText');
    if (fabText) fabText.textContent = timeStr;
}
function _showFloatingTimer() {
    const fab = document.getElementById('floatingTimerFab');
    const headerBtn = document.getElementById('btnStartTimerHeader');
    if (fab) { fab.classList.remove('hidden'); }
    if (headerBtn) headerBtn.style.display = 'none';
}
function _hideFloatingTimer() {
    const fab = document.getElementById('floatingTimerFab');
    const headerBtn = document.getElementById('btnStartTimerHeader');
    const expanded = document.getElementById('floatingTimerExpanded');
    const collapsed = document.getElementById('floatingTimerCollapsed');
    if (fab) fab.classList.add('hidden');
    if (headerBtn) headerBtn.style.display = '';
    if (expanded) expanded.classList.add('hidden');
    if (collapsed) collapsed.classList.remove('hidden');
}
window.toggleWorkoutTimer = function() {
    if (window.isWorkoutTimerRunning) {
        _workoutAccumulated += Math.floor((Date.now() - _workoutStartedAt) / 1000);
        _workoutStartedAt = null;
        clearInterval(window.workoutTimerInterval); window.isWorkoutTimerRunning = false;
        const icon = document.getElementById('workoutTimerIcon');
        if (icon) { icon.setAttribute('data-lucide', 'play'); if (window.lucide) lucide.createIcons(); }
        const fabIcon = document.getElementById('btnWorkoutTimer');
        if (fabIcon) { const i = fabIcon.querySelector('[data-lucide]'); if(i) { i.setAttribute('data-lucide', 'play'); if(window.lucide) lucide.createIcons(); } }
    } else {
        _workoutStartedAt = Date.now();
        window.isWorkoutTimerRunning = true;
        const icon = document.getElementById('workoutTimerIcon');
        if (icon) { icon.setAttribute('data-lucide', 'pause'); if (window.lucide) lucide.createIcons(); }
        const fabIcon = document.getElementById('btnWorkoutTimer');
        if (fabIcon) { const i = fabIcon.querySelector('[data-lucide]'); if(i) { i.setAttribute('data-lucide', 'pause'); if(window.lucide) lucide.createIcons(); } }
        _showFloatingTimer();
        window.workoutTimerInterval = setInterval(_updateWorkoutDisplay, 1000);
        _updateWorkoutDisplay();
    }
};
window.resetWorkoutTimer = function() {
    clearInterval(window.workoutTimerInterval); window.isWorkoutTimerRunning = false;
    window.workoutTimerSeconds = 0; _workoutAccumulated = 0; _workoutStartedAt = null;
    const display = document.getElementById('workoutTimerDisplay');
    const icon = document.getElementById('workoutTimerIcon');
    if (display) display.textContent = '00:00';
    if (icon) { icon.setAttribute('data-lucide', 'play'); if (window.lucide) lucide.createIcons(); }
    _hideFloatingTimer();
};

// --- REST TIMER (Timestamp-basiert — Sperrbildschirm-fest) ---
let _restEndTime = null;
window.setAndStartRestTimer = function(secs) { window.selectedRestTime = secs; window.startRestCountdown(secs); };
window.startRestCountdown = function(secs) {
    if (!secs || secs <= 0) return;
    clearInterval(window.restTimerInterval);
    _restEndTime = Date.now() + (secs * 1000);
    const stopBtn = document.getElementById('btnStopRest');
    if (stopBtn) stopBtn.classList.remove('hidden');
    const tick = () => {
        if (!document.getElementById('restDisplay')) { clearInterval(window.restTimerInterval); return; }
        const remaining = Math.max(0, Math.ceil((_restEndTime - Date.now()) / 1000));
        window.restTimerSeconds = remaining;
        const m = String(Math.floor(remaining / 60)).padStart(2, '0');
        const s = String(remaining % 60).padStart(2, '0');
        const d = document.getElementById('restDisplay');
        if (d) { d.textContent = m + ':' + s; d.classList.add('timer-active'); }
        if (remaining <= 0) {
            clearInterval(window.restTimerInterval); _restEndTime = null;
            if (d) { d.textContent = '00:00'; d.classList.remove('timer-active'); }
            if (stopBtn) stopBtn.classList.add('hidden');
            window.playBeep();
        }
    };
    tick();
    window.restTimerInterval = setInterval(tick, 1000);
};
window.startCustomRestTimer = function() {
    const val = parseInt(document.getElementById('customRestInput')?.value);
    if (val > 0) window.startRestCountdown(val);
};
window.stopRestTimer = function() {
    clearInterval(window.restTimerInterval); window.restTimerSeconds = 0; _restEndTime = null;
    const d = document.getElementById('restDisplay');
    if (d) { d.textContent = '00:00'; d.classList.remove('timer-active'); }
    document.getElementById('btnStopRest')?.classList.add('hidden');
};

// --- AUDIO ---
window.initAudio = function() {};
window.playBeep = function() {
    try {
        const ctx = new (window.AudioContext||window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; gain.gain.value = 0.25;
        osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
};
