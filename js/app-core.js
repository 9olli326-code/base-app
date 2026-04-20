  // Exercise Image Helpers
  window._getExerciseImageUrl = function(exerciseId) {
    if (!exerciseId) return null;
    return 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/' + exerciseId + '/0.jpg';
  };
  window._getExerciseGifUrl = function(exerciseId) {
    if (!exerciseId) return null;
    return 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/' + exerciseId + '/0.gif';
  };
  window._findExerciseInDB = function(exerciseName) {
    if (!exerciseName) return null;
    var db = window.EXERCISE_DB || [];
    var q = exerciseName.toLowerCase().trim();
    for (var i = 0; i < db.length; i++) {
      if (db[i].n && db[i].n.toLowerCase() === q) return db[i];
      if (db[i].de && db[i].de.toLowerCase() === q) return db[i];
    }
    return null;
  };
  window._showExerciseImage = function(exerciseName) {
    var container = document.getElementById('exerciseImageContainer');
    var img = document.getElementById('exerciseImage');
    var nameEl = document.getElementById('exerciseImageName');
    var muscleEl = document.getElementById('exerciseImageMuscle');
    if (!container || !img) return;
    var exercise = window._findExerciseInDB(exerciseName);
    if (!exercise || !exercise.id) { container.classList.add('hidden'); return; }
    img.src = window._getExerciseGifUrl(exercise.id);
    img.alt = exerciseName;
    if (nameEl) nameEl.textContent = exerciseName;
    if (muscleEl) muscleEl.textContent = exercise.t || exercise.bp || '';
    container.classList.remove('hidden');
  };

  // Custom Input Modal (ersetzt native prompt())
  window.showInputModal = function(title, placeholder, callback, defaultValue) {
   var overlay = document.createElement('div');
   overlay.id = '_inputModalOverlay';
   overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);padding:24px';
   overlay.innerHTML = '<div style="background:#1a1a1f;border:1px solid #2a2a30;border-radius:20px;padding:24px;max-width:360px;width:100%">' +
    '<p style="font-size:14px;font-weight:800;color:#f4f4f5;margin-bottom:12px">' + window._escapeHtml(title) + '</p>' +
    '<input id="_inputModalField" type="text" value="' + window._escapeHtml(defaultValue || '') + '" placeholder="' + window._escapeHtml(placeholder || '') + '" ' +
    'style="width:100%;background:#111;border:1px solid #333;border-radius:12px;color:#f4f4f5;padding:12px;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:16px" class="pointer-events-auto">' +
    '<div style="display:flex;gap:8px">' +
    '<button aria-label="Abbrechen" onclick="document.getElementById(\'_inputModalOverlay\').remove()" style="flex:1;padding:12px;border-radius:12px;background:none;border:1px solid #333;color:#9898a2;font-weight:600;font-size:13px;cursor:pointer" class="pointer-events-auto">Abbrechen</button>' +
    '<button aria-label="Bestaetigen" id="_inputModalConfirm" style="flex:1;padding:12px;border-radius:12px;background:#a3c9a8;color:#0f110f;border:none;font-weight:800;font-size:13px;cursor:pointer" class="pointer-events-auto">OK</button>' +
    '</div></div>';
   document.body.appendChild(overlay);
   var field = document.getElementById('_inputModalField');
   var confirmBtn = document.getElementById('_inputModalConfirm');
   field.focus(); field.select();
   field.addEventListener('keydown', function(e) { if(e.key === 'Enter') confirmBtn.click(); if(e.key === 'Escape') overlay.remove(); });
   confirmBtn.onclick = function() { var val = field.value; overlay.remove(); if(callback) callback(val); };
  };

  // XSS Protection — Fallback falls app.html Definition noch nicht geladen
  if(!window._escapeHtml) {
   window._escapeHtml = function(str) { if(!str) return ''; var d = document.createElement('div'); d.textContent = String(str); return d.innerHTML; };
  }
  window._sanitizeAIHtml = function(text) {
   if(!text) return '';
   var escaped = window._escapeHtml(text);
   escaped = escaped.replace(/\n/g, '<br>');
   escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
   escaped = escaped.replace(/\*(.+?)\*/g, '<i>$1</i>');
   return escaped;
  };

  // ============================================================
  // RETENTION: Activity Tracking + Re-Engagement Hooks
  // ============================================================
  window._trackActivity = function(type) {
   var now = new Date().toISOString();
   var history = JSON.parse(localStorage.getItem('base_activity_log') || '[]');
   history.push({ type: type, date: now });
   if(history.length > 30) history = history.slice(-30);
   localStorage.setItem('base_activity_log', JSON.stringify(history));
   if(type === 'workout') localStorage.setItem('base_last_workout', now);
   localStorage.setItem('base_first_visit', localStorage.getItem('base_first_visit') || now);
  };
  window._getDaysSince = function(key) {
   var date = localStorage.getItem(key);
   if(!date) return -1;
   return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  };
  window._getVisitCount = function() { return parseInt(localStorage.getItem('base_visit_count') || '0'); };
  (function() {
   var count = parseInt(localStorage.getItem('base_visit_count') || '0') + 1;
   localStorage.setItem('base_visit_count', String(count));
   window._trackActivity('visit');
  })();

  // Mikrofon-Permission einmalig beim ersten Start anfragen
  window._requestMicPermission = function() {
    if (localStorage.getItem('base_mic_granted')) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        stream.getTracks().forEach(function(t) { t.stop(); });
        localStorage.setItem('base_mic_granted', '1');
      })
      .catch(function() {});
  };
  document.addEventListener('click', function() {
    window._requestMicPermission();
  }, { once: true, passive: true });

  window._showRetentionModal = function(hookId, config) {
   var existing = document.getElementById('retentionOverlay');
   if(existing) existing.remove();
   var overlay = document.createElement('div');
   overlay.id = 'retentionOverlay';
   overlay.style.cssText = 'position:fixed;inset:0;z-index:750;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.7);padding:16px';
   overlay.innerHTML = '<div style="background:#1a1a1f;border:1px solid rgba(163,201,168,0.2);border-radius:24px;padding:28px;max-width:360px;width:100%;text-align:center;animation:slideUp 0.3s ease;margin-bottom:env(safe-area-inset-bottom,16px)">' +
    '<p style="font-size:40px;margin-bottom:12px">' + (config.emoji || '') + '</p>' +
    '<p style="font-size:17px;font-weight:800;color:#f4f4f5;margin-bottom:6px">' + window._escapeHtml(config.title) + '</p>' +
    '<p style="font-size:13px;color:#9898a2;margin-bottom:20px;line-height:1.5">' + window._escapeHtml(config.text) + '</p>' +
    '<button id="retentionAction" aria-label="' + window._escapeHtml(config.btnText) + '" style="width:100%;background:#a3c9a8;color:#0f110f;border:none;padding:14px;border-radius:14px;font-weight:800;font-size:14px;cursor:pointer;margin-bottom:10px" class="pointer-events-auto">' + window._escapeHtml(config.btnText) + '</button>' +
    '<button id="retentionDismiss" aria-label="' + window.t('retDismiss','Spaeter') + '" style="width:100%;background:none;border:none;color:#737373;font-size:12px;padding:8px;cursor:pointer" class="pointer-events-auto">' + window.t('retDismiss','Spaeter') + '</button></div>';
   document.body.appendChild(overlay);
   var dismiss = function() {
    overlay.remove();
    var d = JSON.parse(localStorage.getItem('base_retention_dismissed') || '{}');
    d[hookId] = new Date().toISOString().split('T')[0];
    localStorage.setItem('base_retention_dismissed', JSON.stringify(d));
   };
   document.getElementById('retentionAction').onclick = function() { dismiss(); if(config.action) config.action(); };
   document.getElementById('retentionDismiss').onclick = dismiss;
  };

  if(!document.getElementById('retentionStyles')) {
   var _rs = document.createElement('style'); _rs.id = 'retentionStyles';
   _rs.textContent = '@keyframes slideUp{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes fadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(20px)}}';
   document.head.appendChild(_rs);
  }

  window._checkRetentionHooks = function() {
   var visitCount = window._getVisitCount();
   var daysSinceFirst = window._getDaysSince('base_first_visit');
   var daysSinceWorkout = window._getDaysSince('base_last_workout');
   var hasWorkout = localStorage.getItem('base_last_workout') !== null;
   var dismissed = JSON.parse(localStorage.getItem('base_retention_dismissed') || '{}');
   var today = new Date().toISOString().split('T')[0];

   if(visitCount === 2 && !hasWorkout && dismissed.firstWorkout !== today) {
    setTimeout(function() { window._showRetentionModal('firstWorkout', {
     emoji: '\uD83D\uDCAA', title: window.t('retFirstTitle','Bereit für dein erstes Workout?'),
     text: window.t('retFirstText','Starte jetzt und BASE lernt deine Staerken kennen. Nur 5 Minuten.'),
     btnText: window.t('retFirstBtn','Jetzt starten'), action: function() { window.switchView('active'); }
    }); }, 3000);
    return;
   }
   if(daysSinceFirst >= 1 && daysSinceFirst <= 2 && hasWorkout && visitCount <= 4 && dismissed.day2 !== today) {
    setTimeout(function() { window._showRetentionModal('day2', {
     emoji: '\uD83D\uDD25', title: window.t('retDay2Title','Willkommen zurück!'),
     text: window.t('retDay2Text','Dein letztes Workout war stark. Schau dir an was dein KI Coach dazu sagt.'),
     btnText: window.t('retDay2Btn','KI Coach oeffnen'), action: function() { window.switchTab('tools'); }
    }); }, 2000);
    return;
   }
   var streak = parseInt(localStorage.getItem('base_streak_count') || '0');
   if(daysSinceFirst >= 3 && daysSinceFirst <= 5 && hasWorkout && streak > 0 && streak < 7 && dismissed.streak !== today) {
    setTimeout(function() { window._showRetentionModal('streak', {
     emoji: '\uD83D\uDD25', title: streak + ' ' + window.t('retStreakTitle','Tage Streak!'),
     text: window.t('retStreakText','Noch ') + (7 - streak) + window.t('retStreakText2',' Tage bis zum Streak-Bonus (+200 XP)!'),
     btnText: window.t('retStreakBtn','Streak fortsetzen'), action: function() { window.switchView('active'); }
    }); }, 2000);
    return;
   }
   if(daysSinceWorkout >= 7 && hasWorkout && dismissed.winback !== today) {
    setTimeout(function() { window._showRetentionModal('winback', {
     emoji: '\uD83D\uDC4B', title: window.t('retWinbackTitle','Wir vermissen dich!'),
     text: window.t('retWinbackText','Dein letztes Workout war vor ') + daysSinceWorkout + window.t('retWinbackText2',' Tagen. Ein kurzes Workout reicht.'),
     btnText: window.t('retWinbackBtn','Schnelles Workout'), action: function() { window.switchView('active'); }
    }); }, 2000);
    return;
   }
  };

  // Connect existing _showDay2Hook — uses clean modal via _showNextTrainingReminder
  window._showDay2Hook = function() {
   var dismissed = JSON.parse(localStorage.getItem('base_retention_dismissed') || '{}');
   var today = new Date().toISOString().split('T')[0];
   if(dismissed.day2post !== today) {
    if (window._showNextTrainingReminder) window._showNextTrainingReminder();
    else window.toggleModal('day2HookModal');
    var d = JSON.parse(localStorage.getItem('base_retention_dismissed') || '{}');
    d.day2post = today;
    localStorage.setItem('base_retention_dismissed', JSON.stringify(d));
   }
  };

  var _lucideTimer = null;
  window._refreshLucide = function() {
   if(_lucideTimer) clearTimeout(_lucideTimer);
   _lucideTimer = setTimeout(function() {
    if(window.lucide) window.lucide.createIcons();
    _lucideTimer = null;
   }, 50);
  };

  const appIdGlobal = "base-v2-beta-test";

  const hideLoader = () => { const l = document.getElementById('app-loader'); if(l && l.style.display !== 'none') { l.style.opacity = '0'; setTimeout(() => l.style.display = 'none', 300); } };

  window._loadScript = function(src) {
   return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if(existing) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
   });
  };
  window._ensureChartJS = function() {
   if(typeof Chart !== 'undefined') return Promise.resolve();
   return window._loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js');
  };
  window._ensureHtml2Canvas = function() {
   if(typeof html2canvas !== 'undefined') return Promise.resolve();
   return window._loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  };
  
  window.addEventListener('load', () => {
   const form = document.getElementById('workoutForm');
   if (form) {
    form.onsubmit = (e) => { e.preventDefault(); if(window._saveCurrentSet) window._saveCurrentSet(); else if(window.saveWorkout) window.saveWorkout(e); return false; };
   }
   hideLoader(); 
   setTimeout(hideLoader, 2000);
  }); 
  if(document.readyState === 'complete' || document.readyState === 'interactive') { setTimeout(hideLoader, 500); }
  else { document.addEventListener('DOMContentLoaded', function() { setTimeout(hideLoader, 500); }); }

  function checkNetworkStatus() {
   const o = document.getElementById('offlineIndicator'); const c = document.getElementById('cloudStatus');
   if (!navigator.onLine) { 
    if(o) { o.classList.remove('hidden'); o.classList.add('block'); } 
    if(c) { c.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm"; c.innerHTML = `<i data-lucide="wifi-off" class="w-3 h-3"></i> <span data-i18n="statusOffline">${i18nData[window.currentLang]?.statusOffline || 'Offline'}</span>`; } 
    window._refreshLucide(); 
   } else { if(o) { o.classList.add('hidden'); o.classList.remove('block'); } }
  }
  window.addEventListener('online', () => {
   checkNetworkStatus();
   var q = JSON.parse(localStorage.getItem('beastmode_v2_offline_queue') || '[]');
   if(q.length > 0 && window.syncToCloud) {
    localStorage.removeItem('beastmode_v2_offline_queue');
    var synced = 0;
    q.forEach(function(workout) {
     window.syncToCloud(workout);
     synced++;
    });
    window.showToast(synced + ' Offline-Workout' + (synced > 1 ? 's' : '') + ' synchronisiert!');
   }
  }); 
  window.addEventListener('offline', checkNetworkStatus);

  const STRAVA_CLIENT_ID = '211278'; let stravaTokens = null;
  try { stravaTokens = JSON.parse(localStorage.getItem('beastmode_strava_tokens')); } catch(e) { console.error('Fehler beim Laden der Strava-Tokens:', e); }
  
  window.updateStravaUI = function() {
   const btnConnect = document.getElementById('btnStravaConnect'); const btnDisconnect = document.getElementById('btnStravaDisconnect'); const statusText = document.getElementById('stravaStatusText'); const btnSync = document.getElementById('btnStravaSync');
   if(stravaTokens && stravaTokens.access_token) { if(btnConnect) btnConnect.classList.add('hidden'); if(btnDisconnect) btnDisconnect.classList.remove('hidden'); if(statusText) { statusText.textContent = window.t('lblStravaConnected','Verbunden'); statusText.classList.replace('text-zinc-500', 'text-green-500'); } if(btnSync) { btnSync.classList.remove('hidden'); btnSync.classList.add('flex'); } } 
   else { if(btnConnect) btnConnect.classList.remove('hidden'); if(btnDisconnect) btnDisconnect.classList.add('hidden'); if(statusText) { statusText.textContent = window.t('lblNotConnected','Nicht verbunden'); statusText.classList.replace('text-green-500', 'text-zinc-500'); } if(btnSync) { btnSync.classList.add('hidden'); btnSync.classList.remove('flex'); } }
  };
  window.connectStrava = function() { const currentUrl = window.location.origin + window.location.pathname; const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${currentUrl}&approval_prompt=force&scope=activity:read_all`; window.location.href = authUrl; };
  window.disconnectStrava = function() { window.showModal(window.t('lblDisconnect','Strava trennen?'), window.t('lblDisconnect','Strava Verbindung wirklich trennen?'), true, () => { localStorage.removeItem('beastmode_strava_tokens'); stravaTokens = null; window.updateStravaUI(); window.showToast(window.t("toastUpdate", "Strava getrennt.")); }); };
  window.handleStravaCallback = async function(code) { try { const res = await fetch('/.netlify/functions/strava-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code, grant_type: 'authorization_code' }) }); if(!res.ok) throw new Error("Strava Token-Exchange fehlgeschlagen"); const data = await res.json(); stravaTokens = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at }; localStorage.setItem('beastmode_strava_tokens', JSON.stringify(stravaTokens)); window.showToast("Strava erfolgreich verbunden!"); window.updateStravaUI(); } catch(e) { window.showToast('Strava Login fehlgeschlagen: ' + window._escapeHtml(e.message), 'error'); } };
  window.refreshStravaTokenIfNeeded = async function() { if(!stravaTokens) return false; if(Date.now() / 1000 > (stravaTokens.expires_at - 300)) { try { const res = await fetch('/.netlify/functions/strava-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: stravaTokens.refresh_token }) }); if(!res.ok) throw new Error("Token Refresh fehlgeschlagen"); const data = await res.json(); stravaTokens.access_token = data.access_token; stravaTokens.refresh_token = data.refresh_token; stravaTokens.expires_at = data.expires_at; localStorage.setItem('beastmode_strava_tokens', JSON.stringify(stravaTokens)); return true; } catch(e) { return false; } } return true; };
  window.syncStravaActivities = async function() {
   if(!stravaTokens) return window.showToast('Strava nicht verbunden! Bitte im Profil verknuepfen.', 'warn');
   window.showToast(window.t("aiAnalyzing", "Lade Strava Aktivitäten..."));
   await window.refreshStravaTokenIfNeeded();
   try {
    var _stravaCtrl = new AbortController(); var _stravaTimeout = setTimeout(function() { _stravaCtrl.abort(); }, 15000);
    const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', { headers: { 'Authorization': `Bearer ${stravaTokens.access_token}` }, signal: _stravaCtrl.signal });
    clearTimeout(_stravaTimeout);
    if(!res.ok) throw new Error(window.t('aiServerError',"API Fehler beim Abrufen der Aktivitäten.")); const activities = await res.json(); let importedCount = 0;
    activities.forEach(act => {
     const mappedId = `strava_${act.id}`;
     if(!window.workouts.find(w => w.id === mappedId)) {
      let cat = 'cardio'; let sportName = 'Strava Activity';
      if(act.type === 'Run') sportName = 'Laufen'; else if(act.type === 'Ride') sportName = 'Radfahren'; else if(act.type === 'Swim') sportName = 'Schwimmen'; else if(act.type === 'WeightTraining') { cat = 'strength'; sportName = 'Krafttraining'; } else if(act.type === 'Walk') { sportName = 'Gehen'; cat = 'recovery'; } else sportName = act.type;
      let dynData = { "Distanz (km)": (act.distance / 1000).toFixed(2), "Dauer (min)": Math.round(act.moving_time / 60) };
      if(act.average_heartrate) dynData["\u00d8 Puls"] = Math.round(act.average_heartrate);
      if(act.max_heartrate) dynData["Max Puls"] = Math.round(act.max_heartrate);
      if(act.suffer_score) dynData["Belastungsscore"] = act.suffer_score;
      if(act.average_cadence) dynData["Kadenz"] = Math.round(act.average_cadence);
      if(act.average_watts) dynData["Watt (Ø)"] = Math.round(act.average_watts);
      if(act.type === 'Run' && act.average_speed > 0) { const paceDec = (1000 / act.average_speed) / 60; const mins = Math.floor(paceDec); const secs = Math.round((paceDec - mins) * 60).toString().padStart(2, '0'); dynData["Pace (min/km)"] = `${mins}:${secs}`; }
      if(act.total_elevation_gain) dynData["H\u00f6henmeter (m)"] = Math.round(act.total_elevation_gain);
      if(act.calories) dynData["Kalorien (kcal)"] = Math.round(act.calories);
      else if(act.kilojoules) dynData["Kalorien (kcal)"] = Math.round(act.kilojoules * 0.239);
      let entry = { id: mappedId, category: cat, sportCategory: sportName, date: act.start_date_local ? act.start_date_local.substring(0,10) : new Date().toISOString().substring(0,10), exercise: act.name || sportName, data: dynData, archived: true, sessionId: `strava_session_${act.id}`, sessionDuration: Math.round(act.moving_time / 60) + ' min', sessionComment: "Via Strava importiert", maxHeartrate: act.max_heartrate || null, sufferScore: act.suffer_score || null, cadence: act.average_cadence || null, watts: act.average_watts || null };
      window.workouts.push(entry); if(window.syncToCloud) window.syncToCloud(entry); importedCount++;
     }
    });
    if(importedCount > 0) { window.workouts = window.workouts.sort((a,b) => new Date(b.date) - new Date(a.date)); window.saveWorkoutsForCurrentClient(); window.renderTable(); window.calculateReadiness(); if(window.currentView === 'chart') window.initAnalytics(); window.showToast(`${importedCount} ${window.t('stravaImported','Aktivitäten importiert!')}`); } else { window.showToast(window.t("toastUpdate", "Alles auf dem neuesten Stand.")); }
   } catch(e) { window.showToast('Strava Sync Fehler: ' + window._escapeHtml(e.message), 'error'); }
  };

  
  window.toggleInjury = function(btn) { const v = btn.getAttribute('data-val'); if(window.selectedInjuries.has(v)) { window.selectedInjuries.delete(v); btn.classList.remove('chip-active', 'bg-primary', 'text-black', 'border-primary'); btn.classList.add('bg-zinc-900', 'text-zinc-500', 'border-zinc-800'); } else { window.selectedInjuries.add(v); btn.classList.add('chip-active', 'bg-primary', 'text-black', 'border-primary'); btn.classList.remove('bg-zinc-900', 'text-zinc-500', 'border-zinc-800'); } }

  window.workouts = []; window.clients = []; window.savedRoutines = []; let savedCustomFields = []; window.userProfile = { age: '', weight: '', height: '', gender: '', experience: '', injuries: [], medicalDetails: '', modules: { main: false, strength: true, cardio: true, recovery: false }, widgets: { readiness: false, ptMode: false } }; window.selectedInjuries = new Set(); let currentChartType = 'bar'; window.currentMode = 'personal'; window.currentClient = 'personal'; window.currentLang = localStorage.getItem('beastmode_lang') || 'de'; window.currentCategory = 'strength'; window.currentTableFilter = 'all';
  window.editingWorkoutId = null; window.currentReadinessScore = 100; window.currentView = 'active';
  window.isWorkoutTimerRunning = false; window.workoutTimerSeconds = 0; window.workoutTimerInterval = null;
  window.selectedRestTime = 90; window.restTimerSeconds = 0; window.restTimerInterval = null;
  window._exerciseRestTimes = JSON.parse(localStorage.getItem('base_exercise_rest_times') || '{}');
  window._setExerciseRestTime = function(exName, secs) { window._exerciseRestTimes[exName] = secs; localStorage.setItem('base_exercise_rest_times', JSON.stringify(window._exerciseRestTimes)); };
  window._getExerciseRestTime = function(exName) { return window._exerciseRestTimes[exName] || null; };
  window._currentSetIndex = 0; window._savedSets = [];

  // === VOICE COACH ===
  window._voiceCoachEnabled = localStorage.getItem('base_voice_coach') === 'true';

  var LANG_CODE_MAP = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', nl: 'nl-NL', ar: 'ar-SA' };
  var _ttsQueue = [];
  var _ttsPlaying = false;
  var _ttsAudioCtx = null;
  var _ttsGestureUnlocked = false;

  function _unlockAudioCtx() {
    if (_ttsGestureUnlocked) return;
    _ttsGestureUnlocked = true;
    try {
      _ttsAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var buf = _ttsAudioCtx.createBuffer(1, 1, 22050);
      var src = _ttsAudioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(_ttsAudioCtx.destination);
      src.start(0);
    } catch(e) { _ttsGestureUnlocked = false; }
  }
  document.addEventListener('touchstart', _unlockAudioCtx, { once: true, passive: true });
  document.addEventListener('click', _unlockAudioCtx, { once: true, passive: true });

  function _processTtsQueue() {
    if (_ttsPlaying || _ttsQueue.length === 0) return;
    _ttsPlaying = true;
    var item = _ttsQueue.shift();

    fetch('/.netlify/functions/elevenlabs-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: item.text, lang: window.currentLang || 'de' })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.audio) throw new Error('no audio');
      var binary = atob(data.audio);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      if (_ttsAudioCtx && _ttsAudioCtx.state !== 'closed') {
        _ttsAudioCtx.resume().then(function() {
          _ttsAudioCtx.decodeAudioData(bytes.buffer.slice(0), function(decoded) {
            var source = _ttsAudioCtx.createBufferSource();
            source.buffer = decoded;
            source.connect(_ttsAudioCtx.destination);
            source.onended = function() { _ttsPlaying = false; _processTtsQueue(); };
            source.start(0);
          }, function() {
            _ttsPlaying = false;
            window._speakBrowserFallback(item.text);
            _processTtsQueue();
          });
        });
      } else {
        var blob = new Blob([bytes], { type: 'audio/mpeg' });
        var url = URL.createObjectURL(blob);
        var audio = new Audio(url);
        audio.volume = 1.0;
        audio.onended = function() { URL.revokeObjectURL(url); _ttsPlaying = false; _processTtsQueue(); };
        audio.onerror = function() { URL.revokeObjectURL(url); _ttsPlaying = false; window._speakBrowserFallback(item.text); _processTtsQueue(); };
        audio.play().catch(function() {
          URL.revokeObjectURL(url); _ttsPlaying = false;
          window._speakBrowserFallback(item.text);
          _processTtsQueue();
        });
      }
    })
    .catch(function() {
      _ttsPlaying = false;
      window._speakBrowserFallback(item.text);
      _processTtsQueue();
    });
  }

  window._speak = function(text, priority) {
    if (!window._voiceCoachEnabled) return;
    if (!text || !text.trim()) return;
    if (priority === 'high') {
      _ttsQueue = [];
      if (_ttsAudioCtx && _ttsAudioCtx.state !== 'closed') {
        try { _ttsAudioCtx.close().then(function() { _ttsAudioCtx = null; _ttsGestureUnlocked = false; }); } catch(e) {}
      }
      _ttsPlaying = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
    _ttsQueue.push({ text: text.trim() });
    if (!_ttsPlaying) _processTtsQueue();
  };

  window._speakBrowserFallback = function(text) {
    if (!window.speechSynthesis) return;
    var utt = new SpeechSynthesisUtterance(text);
    utt.lang = LANG_CODE_MAP[window.currentLang] || 'de-DE';
    utt.rate = 1.05; utt.pitch = 1.0;
    var voices = window.speechSynthesis.getVoices();
    var lp = (window.currentLang || 'de');
    var pref = voices.find(function(v) { return v.lang.startsWith(lp) && v.localService; });
    if (!pref) pref = voices.find(function(v) { return v.lang.startsWith(lp); });
    if (pref) utt.voice = pref;
    window.speechSynthesis.speak(utt);
  };

  window._voiceCoachSpeak = function(text, priority) {
    window._speak(text, priority);
  };

  window.toggleVoiceCoach = function() {
   window._voiceCoachEnabled = !window._voiceCoachEnabled;
   localStorage.setItem('base_voice_coach', String(window._voiceCoachEnabled));
   var toggle = document.getElementById('mod_voiceCoach');
   if (toggle) toggle.checked = window._voiceCoachEnabled;
   if (window._voiceCoachEnabled) {
    window._speak(window.t('voiceActivated', 'Jarvis aktiviert. Lass uns trainieren!'), 'high');
    window.showToast(window.t('voiceOn', 'Jarvis AN'));
   } else {
    _ttsQueue = [];
    _ttsPlaying = false;
    if (window._ttsCurrentAudio) { window._ttsCurrentAudio.pause(); window._ttsCurrentAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    window.showToast(window.t('voiceOff', 'Voice Coach AUS'));
   }
   window._renderVoiceCoachIndicator();
  };
  window._renderVoiceCoachIndicator = function() {
   var existing = document.getElementById('voiceCoachIndicator');
   if (existing) existing.remove();
   if (!window._voiceCoachEnabled) return;
   var indicator = document.createElement('div');
   indicator.id = 'voiceCoachIndicator';
   indicator.onclick = function() { window.toggleVoiceCoach(); };
   indicator.className = 'pointer-events-auto cursor-pointer';
   indicator.style.cssText = 'position:fixed;top:12px;right:12px;z-index:500;display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.25);font-size:10px;font-weight:700;color:var(--primary-hex)';
   var vs = window._getVoiceStyle ? window._getVoiceStyle() : null;
   indicator.innerHTML = '<i data-lucide="volume-2" class="w-3 h-3 pointer-events-none"></i> <span class="pointer-events-none">VOICE' + (vs ? ' ' + vs.icon : '') + '</span>';
   document.body.appendChild(indicator);
   window._refreshLucide();
  };
  setTimeout(function() { if (window._renderVoiceCoachIndicator) window._renderVoiceCoachIndicator(); }, 2000);

  // === VOICE COACH STYLES (OpenAI TTS) ===
  window._VOICE_COACH_STYLES = {
   motivator: { label: 'Motivator', icon: '\uD83D\uDD25', desc: 'Tiefe kraftvolle Stimme (Onyx)', voice: 'onyx', prefix: { de: 'Komm schon! ', en: 'Come on! ', fr: 'Allez! ', es: 'Vamos! ', it: 'Dai! ', nl: 'Kom op! ', ar: '\u0647\u064A\u0627! ' } },
   calm: { label: 'Coach', icon: '\uD83E\uDDD8', desc: 'Ruhig und klar (Nova)', voice: 'nova', prefix: { de: '', en: '', fr: '', es: '', it: '', nl: '', ar: '' } },
   drill: { label: 'Drill Sergeant', icon: '\uD83C\uDFAF', desc: 'Direkt und pr\u00e4zise (Echo)', voice: 'echo', prefix: { de: 'Los! ', en: 'Move it! ', fr: 'Bouge! ', es: 'Mueve! ', it: 'Muovi! ', nl: 'Bewegen! ', ar: '\u062A\u062D\u0631\u0643! ' } },
   funny: { label: 'Freund', icon: '\uD83E\uDD21', desc: 'Warm und lebendig (Fable)', voice: 'fable', prefix: { de: 'Hey! ', en: 'Hey! ', fr: 'H\u00e9! ', es: 'Oye! ', it: 'Ehi! ', nl: 'H\u00e9! ', ar: '\u0647\u064A! ' } }
  };
  window._voiceCoachStyle = localStorage.getItem('base_voice_style') || 'motivator';
  window._getVoiceStyle = function() { return window._VOICE_COACH_STYLES[window._voiceCoachStyle] || window._VOICE_COACH_STYLES.motivator; };
  window._voiceCoachSpeak = function(text, priority) {
   window._speak(text, priority);
  };
  window._showVoiceStylePicker = function() {
   var current = window._voiceCoachStyle;
   var existing = document.getElementById('voiceStyleSheet');
   if (existing) existing.remove();
   var oldBd = document.getElementById('voiceStyleBackdrop');
   if (oldBd) oldBd.remove();

   var sheet = document.createElement('div');
   sheet.id = 'voiceStyleSheet';
   sheet.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:var(--surface-hex);border-top:1px solid var(--border-hex);border-radius:20px 20px 0 0;padding:20px 16px 40px;pointer-events:auto';

   var html = '<p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:16px">' + window.t('voiceStyleTitle', 'Jarvis Pers\u00f6nlichkeit') + '</p>';
   Object.keys(window._VOICE_COACH_STYLES).forEach(function(key) {
    var s = window._VOICE_COACH_STYLES[key];
    var sel = key === current;
    html += '<button type="button" onclick="window._setVoiceStyle(\'' + key + '\');document.getElementById(\'voiceStyleSheet\').remove();var _bd=document.getElementById(\'voiceStyleBackdrop\');if(_bd)_bd.remove();" ' +
     'aria-label="' + window._escapeHtml(s.label) + '" class="pointer-events-auto" ' +
     'style="width:100%;display:flex;align-items:center;gap:12px;padding:14px 16px;margin-bottom:8px;border-radius:12px;border:1px solid ' + (sel ? 'var(--primary-hex)' : 'var(--border-hex)') + ';background:' + (sel ? 'color-mix(in srgb,var(--primary-hex),transparent 85%)' : 'var(--inner-bg-hex)') + ';color:var(--text-main);cursor:pointer;text-align:left">' +
     '<span style="font-size:22px">' + s.icon + '</span>' +
     '<div><p style="font-size:14px;font-weight:600;margin:0">' + window._escapeHtml(s.label) + '</p>' +
     '<p style="font-size:12px;color:var(--text-muted);margin:2px 0 0">' + window._escapeHtml(s.desc || '') + '</p></div>' +
     (sel ? '<span style="margin-left:auto;color:var(--primary-hex);font-size:16px">\u2713</span>' : '') +
     '</button>';
   });
   html += '<p style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:6px;padding:0 4px;text-align:center">Die gew\u00e4hlte Pers\u00f6nlichkeit gilt f\u00fcr Chat UND Voice Mode</p>';
   html += '<button type="button" onclick="document.getElementById(\'voiceStyleSheet\').remove();var _bd=document.getElementById(\'voiceStyleBackdrop\');if(_bd)_bd.remove();" ' +
    'class="pointer-events-auto" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--border-hex);background:transparent;color:var(--text-muted);cursor:pointer;margin-top:4px">' + window.t('btnClose','Abbrechen') + '</button>';
   sheet.innerHTML = html;

   var backdrop = document.createElement('div');
   backdrop.id = 'voiceStyleBackdrop';
   backdrop.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.5);pointer-events:auto';
   backdrop.onclick = function() { sheet.remove(); backdrop.remove(); };

   document.body.appendChild(backdrop);
   document.body.appendChild(sheet);
  };
  window._setVoiceStyle = function(styleKey) {
   window._voiceCoachStyle = styleKey;
   localStorage.setItem('base_voice_style', styleKey);

   var modal = document.getElementById('customModal');
   if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }

   var s   = window._VOICE_COACH_STYLES[styleKey];
   var lbl = document.getElementById('voiceStyleLabel');
   if (lbl && s) lbl.textContent = s.icon + ' ' + s.label;

   document.querySelectorAll('[onclick*="_setVoiceStyle"]').forEach(function(btn) {
     btn.classList.remove('bg-primary/20', 'border-primary', 'text-white');
     btn.classList.add('bg-zinc-900', 'border-zinc-800', 'text-zinc-300');
     var activeTag = btn.querySelector('.text-primary.text-xs');
     if (activeTag) activeTag.remove();
   });
   var activeBtn = document.querySelector('[onclick*="_setVoiceStyle(\'' + styleKey + '\')"]');
   if (activeBtn) {
     activeBtn.classList.remove('bg-zinc-900', 'border-zinc-800', 'text-zinc-300');
     activeBtn.classList.add('bg-primary/20', 'border-primary', 'text-white');
   }

   if (s) window.showToast(s.icon + ' ' + s.label + ' aktiviert');
   if (window._renderVoiceCoachIndicator) window._renderVoiceCoachIndicator();
   if (window._voiceCoachEnabled && window._voiceCoachSpeak) {
     setTimeout(function() {
       window._speak(window.t('voiceStyleSet', 'Pers\u00f6nlichkeit gewechselt!'), 'high');
     }, 300);
   }
  };

  // === MORNING BRIEFING MODAL (ElevenLabs TTS) ===
  window._currentBriefingText = null;
  window._currentBriefingAudio = null;

  window.openBriefingModal = async function() {
    if (window._briefingModalActive) {
      console.log('[briefing] Modal already active');
      return;
    }
    window._briefingModalActive = true;
    try {
      var modal = document.getElementById('briefingModal');
      if (!modal) { window._briefingModalActive = false; return; }
      // === AUDIO-UNLOCK f\u00fcr iOS Safari ===
      if (!window._briefingAudioUnlocked) {
        try {
          if (!window._audioCtx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) window._audioCtx = new AC();
          }
          if (window._audioCtx) {
            if (window._audioCtx.state === 'suspended') {
              await window._audioCtx.resume().catch(function() {});
            }
            var buffer = window._audioCtx.createBuffer(1, 1, 22050);
            var source = window._audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(window._audioCtx.destination);
            source.start(0);
          }
          var silentAudio = new Audio();
          silentAudio.muted = true;
          silentAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
          silentAudio.play().then(function() { silentAudio.pause(); }).catch(function() {});
          window._briefingAudioUnlocked = true;
        } catch(e) { window._briefingAudioUnlocked = true; }
      }
      modal.classList.remove('hidden');
      modal.style.display = 'flex';

      var profile = window.userProfile || {};
      var firstName = (profile.name || profile.firstName || 'Oliver').split(' ')[0];
      var hour = new Date().getHours();
      var greeting = hour < 11 ? 'Guten Morgen' : hour < 17 ? 'Hallo' : 'Guten Abend';
      var greetEl = document.getElementById('briefingGreeting');
      if (greetEl) greetEl.textContent = greeting + ', ' + firstName;

      var loadEl = document.getElementById('briefingLoading');
      var contentEl = document.getElementById('briefingContent');
      var controlsEl = document.getElementById('briefingControls');
      if (loadEl) loadEl.classList.remove('hidden');
      if (contentEl) contentEl.classList.add('hidden');
      if (controlsEl) controlsEl.classList.add('hidden');

      var orb = document.getElementById('briefingOrb');
      if (orb) orb.style.animation = 'briefingPulse 1.5s ease-in-out infinite';
      if (window._refreshLucide) window._refreshLucide();

      if (!window.generateMorningBriefing) {
        var loadText = document.getElementById('briefingLoadingText');
        if (loadText) loadText.textContent = 'Briefing-Feature nicht verf\u00fcgbar.';
        window._briefingModalActive = false;
        return;
      }

      var text = await window.generateMorningBriefing(false);
      if (!text) {
        var loadText2 = document.getElementById('briefingLoadingText');
        if (loadText2) loadText2.textContent = 'Briefing konnte nicht erstellt werden.';
        if (orb) orb.style.animation = 'none';
        window._briefingModalActive = false;
        return;
      }
      window._currentBriefingText = text;

      if (loadEl) loadEl.classList.add('hidden');
      var textEl = document.getElementById('briefingText');
      if (textEl) textEl.textContent = text;
      if (contentEl) contentEl.classList.remove('hidden');
      if (controlsEl) controlsEl.classList.remove('hidden');

      window.playBriefingAgain();
      if (window.awardXP) window.awardXP('briefingUsed');

    } catch(e) {
      console.error('[briefing] Error:', e);
      var loadText3 = document.getElementById('briefingLoadingText');
      if (loadText3) loadText3.textContent = 'Fehler: ' + e.message;
      var orbErr = document.getElementById('briefingOrb');
      if (orbErr) orbErr.style.animation = 'none';
      window._briefingModalActive = false;
    }
  };

  window.playBriefingAgain = function() {
    if (!window._currentBriefingText) return;
    if (window._briefingTTSInFlight) {
      console.log('[briefing] Ignoring duplicate call \u2014 TTS still in flight');
      return;
    }
    if (window._currentBriefingAudio) {
      try {
        window._currentBriefingAudio.pause();
        window._currentBriefingAudio.currentTime = 0;
        window._currentBriefingAudio.onended = null;
        window._currentBriefingAudio.onerror = null;
        window._currentBriefingAudio.src = '';
      } catch(e) {}
      window._currentBriefingAudio = null;
    }
    if (window._currentBriefingAudioUrl) {
      try { URL.revokeObjectURL(window._currentBriefingAudioUrl); } catch(e) {}
      window._currentBriefingAudioUrl = null;
    }

    var orb = document.getElementById('briefingOrb');
    if (orb) orb.style.animation = 'briefingPulse 0.8s ease-in-out infinite';
    window._briefingTTSInFlight = true;

    fetch('/.netlify/functions/elevenlabs-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: window._currentBriefingText,
        lang: window.currentLang || 'de'
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('TTS HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      window._briefingTTSInFlight = false;
      if (!data.audio) throw new Error('Kein Audio');
      if (!window._currentBriefingText) return;
      if (window._currentBriefingAudio) return;

      var binary = atob(data.audio);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      var blob = new Blob([bytes], { type: 'audio/mpeg' });
      var url = URL.createObjectURL(blob);
      var audio = new Audio(url);
      audio.volume = 1.0;
      audio.onended = function() {
        try { URL.revokeObjectURL(url); } catch(e) {}
        if (orb) orb.style.animation = 'none';
        if (window._currentBriefingAudio === audio) {
          window._currentBriefingAudio = null;
          window._currentBriefingAudioUrl = null;
        }
      };
      audio.onerror = function() {
        try { URL.revokeObjectURL(url); } catch(e) {}
        if (orb) orb.style.animation = 'none';
        if (window._currentBriefingAudio === audio) {
          window._currentBriefingAudio = null;
          window._currentBriefingAudioUrl = null;
        }
        if (window.showToast) window.showToast('Audio-Wiedergabe fehlgeschlagen', 'error');
      };
      window._currentBriefingAudio = audio;
      window._currentBriefingAudioUrl = url;
      var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) {
        if (orb) orb.style.animation = 'none';
        var playBtn = document.getElementById('briefingPlayBtn');
        if (playBtn) playBtn.style.animation = 'briefingPulse 1.2s ease-in-out infinite';
        if (window.showToast) window.showToast('Tippe auf "Abspielen" um zu starten', 'info', 5000);
      } else {
        audio.play().catch(function(err) {
          console.error('[briefing] autoplay blocked:', err);
          if (orb) orb.style.animation = 'none';
          var playBtn2 = document.getElementById('briefingPlayBtn');
          if (playBtn2) playBtn2.style.animation = 'briefingPulse 1.2s ease-in-out infinite';
          if (window.showToast) window.showToast('Tippe auf "Abspielen" um zu starten', 'info', 4000);
        });
      }
    })
    .catch(function(err) {
      window._briefingTTSInFlight = false;
      console.error('[briefing] TTS error:', err);
      if (orb) orb.style.animation = 'none';
      if (window.showToast) window.showToast('TTS Fehler: ' + err.message, 'error');
    });
  };

  window.regenerateBriefing = function() {
    window._currentBriefingText = null;
    if (window._currentBriefingAudio) {
      window._currentBriefingAudio.pause();
      window._currentBriefingAudio = null;
    }
    // Morning Briefing Auto-Trigger deaktiviert
  };

  window.closeBriefingModal = function() {
    var modal = document.getElementById('briefingModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = '';
    }
    window._briefingModalActive = false;
    window._briefingTTSInFlight = false;
    if (window._currentBriefingAudio) {
      try {
        window._currentBriefingAudio.pause();
        window._currentBriefingAudio.onended = null;
        window._currentBriefingAudio.onerror = null;
        window._currentBriefingAudio.src = '';
      } catch(e) {}
      window._currentBriefingAudio = null;
    }
    if (window._currentBriefingAudioUrl) {
      try { URL.revokeObjectURL(window._currentBriefingAudioUrl); } catch(e) {}
      window._currentBriefingAudioUrl = null;
    }
    var orb = document.getElementById('briefingOrb');
    if (orb) orb.style.animation = 'none';
  };

  // === +/- INPUT HELPERS ===
  window._adjustInput = function(inputId, delta) {
   var input = document.getElementById(inputId);
   if (!input) return;
   var raw = String(input.value).replace(',', '.').trim();
   var isWdh = inputId.indexOf('wdh') !== -1;
   var isWeight = inputId.indexOf('weight') !== -1;
   var isRir = inputId.indexOf('rir') !== -1;
   var defaultVal = isWdh ? 8 : isWeight ? 20 : isRir ? 2 : 0;
   var val = parseFloat(raw);
   if (isNaN(val) || raw === '' || raw === '--') { input.value = defaultVal; return; }
   val = val + delta;
   var min = isRir ? 0 : isWeight ? 0 : 1;
   var max = isRir ? 5 : isWeight ? 500 : 999;
   val = Math.max(min, Math.min(max, val));
   if (isWeight) { val = Math.round(val * 2) / 2; input.value = (val % 1 === 0) ? val.toFixed(0) : val.toFixed(1); return; }
   input.value = val;
  };
  window.DEFAULT_STRENGTH_SCHEMA = [ {"id": "saetze", "label": "Sätze", "type": "number", "placeholder": "z.B. 3"}, {"id": "wdh", "label": "Wiederholungen", "type": "number", "placeholder": "z.B. 10"}, {"id": "gewicht", "label": "Gewicht (kg)", "type": "number", "placeholder": "z.B. 80"} ]; // Note: labels translated at render time via schema_ keys
  window.DEFAULT_CARDIO_SCHEMA = [ {"id": "distanz", "label": "Distanz (km)", "type": "number", "placeholder": "z.B. 5.5"}, {"id": "dauer", "label": "Dauer (min)", "type": "number", "placeholder": "z.B. 30"}, {"id": "pace", "label": "Pace (min/km)", "type": "text", "placeholder": "z.B. 5:30"}, {"id": "puls", "label": "\u00d8 Puls", "type": "number", "placeholder": "z.B. 140"}, {"id": "elevation", "label": "H\u00f6henmeter (m)", "type": "number", "placeholder": "z.B. 250"}, {"id": "calories", "label": "Kalorien (kcal)", "type": "number", "placeholder": "z.B. 400"} ];
  window.categorySchemas = { main: null, strength: { sportName: "Klassisches Krafttraining", schema: window.DEFAULT_STRENGTH_SCHEMA }, cardio: { sportName: "Ausdauersport", schema: window.DEFAULT_CARDIO_SCHEMA }, recovery: null };
  window._MOBILITY_EXERCISES = ['Hip Flexor Stretch','Pigeon Pose','90/90 Stretch','Cat-Cow','Thoracic Spine Rotation','Couch Stretch','World\'s Greatest Stretch','Shoulder Dislocates','Deep Squat Hold','Calf Stretch Wall','Hamstring Stretch','Child\'s Pose','Downward Dog','Supine Twist','Foam Roll Quads','Foam Roll IT-Band','Lacrosse Ball Shoulders','Ankle Circles','Wrist Circles','Neck Rolls'];
  window.CAT_UI = { main: { name: 'Mein Sport', nameKey: 'modCus', icon: 'trophy', color: 'text-amber-400', border: 'border-amber-400', bg: 'bg-amber-400/20' }, strength: { name: 'Kraft', nameKey: 'tabStr', icon: 'dumbbell', color: 'text-cyan-400', border: 'border-cyan-400', bg: 'bg-cyan-400/20' }, cardio: { name: 'Ausdauer', nameKey: 'modCar', icon: 'heart-pulse', color: 'text-rose-400', border: 'border-rose-400', bg: 'bg-rose-400/20' }, recovery: { name: 'Mobility', nameKey: 'tabRec', icon: 'stretch-horizontal', color: 'text-emerald-400', border: 'border-emerald-400', bg: 'bg-emerald-400/20' } };

  window.CATEGORY_THEMES = {
   strength: {
    athlete: { accent: '#a3c9a8', glow: 'rgba(163,201,168,0.08)', glowStrong: 'rgba(163,201,168,0.15)' },
    pt:      { accent: '#e0e0e0', glow: 'rgba(255,255,255,0.03)', glowStrong: 'rgba(255,255,255,0.06)' }
   },
   cardio: {
    athlete: { accent: '#e88a8a', glow: 'rgba(232,138,138,0.08)', glowStrong: 'rgba(232,138,138,0.15)' },
    pt:      { accent: '#ef4444', glow: 'rgba(239,68,68,0.04)', glowStrong: 'rgba(239,68,68,0.08)' }
   },
   recovery: {
    athlete: { accent: '#8aafe8', glow: 'rgba(138,175,232,0.08)', glowStrong: 'rgba(138,175,232,0.15)' },
    pt:      { accent: '#22d3ee', glow: 'rgba(34,211,238,0.04)', glowStrong: 'rgba(34,211,238,0.08)' }
   },
   main: {
    athlete: { accent: '#d4b896', glow: 'rgba(212,184,150,0.08)', glowStrong: 'rgba(212,184,150,0.15)' },
    pt:      { accent: '#eab308', glow: 'rgba(234,179,8,0.04)', glowStrong: 'rgba(234,179,8,0.08)' }
   }
  };

  window._applyCategoryTheme = function(cat) {
   if (!window.DESIGN_MORPH_ACTIVE) return;
   if (window.currentMode === 'pt') return;

   var defaults = {
    strength: '#a3c9a8',
    cardio:   '#e88a8a',
    recovery: '#8aafe8',
    main:     '#d4b896'
   };
   var customColors = {};
   try {
    var saved = JSON.parse(localStorage.getItem('beastmode_v2_theme') || '{}');
    if (saved.catKraft) customColors.strength = saved.catKraft;
    if (saved.catAusdauer) customColors.cardio = saved.catAusdauer;
    if (saved.catMobility) customColors.recovery = saved.catMobility;
    if (saved.catSport) customColors.main = saved.catSport;
   } catch(e) {}

   var hex = customColors[cat] || defaults[cat] || defaults['main'];
   var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
   var root = document.documentElement;
   root.style.setProperty('--cat-accent', hex);
   root.style.setProperty('--cat-glow',        'rgba('+r+','+g+','+b+',0.08)');
   root.style.setProperty('--cat-glow-strong',  'rgba('+r+','+g+','+b+',0.15)');
   root.style.setProperty('--cat-glow-3',       'rgba('+r+','+g+','+b+',0.03)');
   root.style.setProperty('--cat-glow-5',       'rgba('+r+','+g+','+b+',0.05)');
   root.style.setProperty('--cat-glow-8',       'rgba('+r+','+g+','+b+',0.08)');
   root.style.setProperty('--cat-glow-10',      'rgba('+r+','+g+','+b+',0.10)');
   root.style.setProperty('--cat-glow-15',      'rgba('+r+','+g+','+b+',0.15)');
   root.style.setProperty('--cat-glow-20',      'rgba('+r+','+g+','+b+',0.20)');
   root.style.setProperty('--cat-glow-25',      'rgba('+r+','+g+','+b+',0.25)');
   root.style.setProperty('--cat-glow-30',      'rgba('+r+','+g+','+b+',0.30)');
   root.style.setProperty('--cat-glow-40',      'rgba('+r+','+g+','+b+',0.40)');
   root.style.setProperty('--primary-hex', hex);
  };

  window.t = function(key, fallback) {
   var lang = window.currentLang || 'de';
   var data = typeof i18nData !== 'undefined' ? i18nData[lang] : null;
   if (data && data[key]) return data[key];
   if (typeof i18nData !== 'undefined' && i18nData.de && i18nData.de[key]) return i18nData.de[key];
   return fallback || key;
  };

  window._i18nLoaded = {};
  window._loadLanguage = function(lang, callback) {
   if (window._i18nLoaded[lang]) { if (callback) callback(); return; }
   var script = document.createElement('script');
   script.src = 'js/i18n/' + lang + '.js?v=' + Date.now();
   script.onload = function() {
    if (window._i18nLang) { window._i18nLoaded[lang] = window._i18nLang; if (window.i18nData) window.i18nData[lang] = window._i18nLang; window._i18nLang = null; }
    if (callback) callback();
   };
   script.onerror = function() { if (callback) callback(); };
   document.head.appendChild(script);
  };
  var _lazyLangs = ['fr', 'es', 'it', 'nl', 'ar'];

  window.switchLanguage = function(lang) {
   window.currentLang = lang; localStorage.setItem('beastmode_lang', lang);
   if (_lazyLangs.indexOf(lang) !== -1 && (!i18nData[lang] || !window._i18nLoaded[lang])) {
    window._loadLanguage(lang, function() { window._applyI18n(lang); });
    return;
   }
   window._applyI18n(lang);
  };
  window._applyI18n = function(lang) {
   document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';            document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18nData[lang] && i18nData[lang][key]) {
     const iconMatch = el.innerHTML.match(/(<i[^>]+>.*?<\/i>)/);
     if(iconMatch) el.innerHTML = iconMatch[0] + " " + i18nData[lang][key];
     else el.textContent = i18nData[lang][key];
    }
   });
   document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18nData[lang] && i18nData[lang][key]) el.placeholder = i18nData[lang][key];
   });
   document.querySelectorAll('select option[data-i18n]').forEach(function(opt) {
    var key = opt.getAttribute('data-i18n');
    var d = i18nData[lang];
    if (d && d[key]) opt.textContent = d[key];
   });
   if(lang === 'ar') document.body.classList.add('text-right'); else document.body.classList.remove('text-right');
   if(typeof window.renderTableFilters === 'function') window.renderTableFilters(); if(typeof window.renderTable === 'function') window.renderTable();
  };

  window.getStorageKey = function() { return window.currentClient === 'personal' ? 'beastmode_v2_cache' : `beastmode_v2_cache_${window.currentClient}`; };
  window._checkStorageLimit = function(data) { try { var size = new Blob([data]).size; if(size > 4 * 1024 * 1024) { console.warn('[BASE] localStorage naehert sich dem Limit:', Math.round(size/1024) + 'KB'); if(size > 4.5 * 1024 * 1024) { window.showToast('Speicher fast voll — aeltere Workouts werden archiviert', 'warn'); var workouts = JSON.parse(data); if(Array.isArray(workouts)) { var archived = workouts.filter(function(w){return w.archived;}).sort(function(a,b){return new Date(a.date)-new Date(b.date);}); var toRemove = Math.ceil(archived.length * 0.1); var idsToRemove = {}; archived.slice(0,toRemove).forEach(function(w){idsToRemove[w.id]=true;}); return JSON.stringify(workouts.filter(function(w){return !idsToRemove[w.id];})); } } } return data; } catch(e) { return data; } };
  window.saveWorkoutsForCurrentClient = function() { if (window._invalidateExerciseMap) window._invalidateExerciseMap(); var _d = JSON.stringify(window.workouts); _d = window._checkStorageLimit(_d); localStorage.setItem(window.getStorageKey(), _d); window.calculateStreak(); if(window._checkFirstWorkoutComplete) window._checkFirstWorkoutComplete(); if(window.currentClient && window.currentClient !== 'personal') { window._syncClientWorkoutsToCloud(window.currentClient); } };

  // ============================================================
  // ATHLETE ROUTINES (nicht PT-Mode, fuer alle User)
  // ============================================================
  window._getAthleteRoutines = function() {
    return JSON.parse(localStorage.getItem('base_athlete_routines') || '[]');
  };

  window._saveAthleteRoutine = function() {
    var active = (window.workouts || []).filter(function(w) { return !w.archived; });
    if (active.length === 0) return window.showToast(window.t('noActiveWorkout', 'Kein aktives Workout zum Speichern'));

    var name = active.map(function(w) { return w.exercise; }).slice(0, 3).join(', ');
    if (active.length > 3) name += ' +' + (active.length - 3);

    var routine = {
      id: 'routine_' + Date.now(),
      name: name,
      createdAt: new Date().toISOString(),
      category: window.currentCategory || 'strength',
      exercises: active.map(function(w) {
        return {
          exercise: w.exercise,
          sets: w.setDetails ? w.setDetails.length : 1,
          lastReps: w.setDetails && w.setDetails[0] ? w.setDetails[0].reps : '',
          lastWeight: w.setDetails && w.setDetails[0] ? w.setDetails[0].weight : '',
          note: w.note || ''
        };
      })
    };

    var routines = window._getAthleteRoutines();
    routines.unshift(routine);
    if (routines.length > 20) routines = routines.slice(0, 20);
    localStorage.setItem('base_athlete_routines', JSON.stringify(routines));
    if (window._syncAppData) window._syncAppData('base_athlete_routines', routines);
    window.showToast(window.t('routineSaved', 'Routine gespeichert: ') + window._escapeHtml(name));
  };

  window._loadAthleteRoutine = function(routineId) {
    var routines = window._getAthleteRoutines();
    var routine = routines.find(function(r) { return r.id === routineId; });
    if (!routine) return;

    if (window.workouts && window.workouts.filter(function(w) { return !w.archived; }).length > 0) {
      window.showModal(
        window.t('loadRoutineTitle', 'Routine laden'),
        window.t('loadRoutineConfirm', 'Aktives Workout verwerfen und Routine laden?'),
        true,
        function() { window._applyAthleteRoutine(routine); }
      );
    } else {
      window._applyAthleteRoutine(routine);
    }
  };

  window._applyAthleteRoutine = function(routine) {
    window.workouts = (window.workouts || []).filter(function(w) { return w.archived; });
    window.currentCategory = routine.category || 'strength';
    if (window.filterTable) window.filterTable(window.currentCategory);

    routine.exercises.forEach(function(ex) {
      var entry = {
        id: 'tmp_' + Date.now() + '_' + Math.random().toString(36).substr(2,6),
        exercise: ex.exercise,
        category: routine.category || 'strength',
        date: new Date().toISOString().split('T')[0],
        archived: false,
        setDetails: []
      };
      for (var i = 0; i < (ex.sets || 1); i++) {
        entry.setDetails.push({ reps: ex.lastReps || '', weight: ex.lastWeight || '', rir: '', type: 'normal' });
      }
      window.workouts.push(entry);
    });

    window.saveWorkoutsForCurrentClient();
    if (window.renderTable) window.renderTable();
    window.toggleModal('athleteRoutinesModal');
    window.showToast(window._escapeHtml(routine.name) + ' geladen!');
  };

  window._deleteAthleteRoutine = function(routineId) {
    var routines = window._getAthleteRoutines().filter(function(r) { return r.id !== routineId; });
    localStorage.setItem('base_athlete_routines', JSON.stringify(routines));
    if (window._syncAppData) window._syncAppData('base_athlete_routines', routines);
    window._renderAthleteRoutinesModal();
  };

  window._renderAthleteRoutinesModal = function() {
    var routines = window._getAthleteRoutines();
    var container = document.getElementById('athleteRoutinesList');
    if (!container) return;

    if (routines.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted)">' +
        '<p style="font-size:32px;margin-bottom:8px">📋</p>' +
        '<p style="font-size:14px;font-weight:700;color:var(--text-main);margin-bottom:6px">' + window.t('noRoutines', 'Noch keine Routinen gespeichert.') + '</p>' +
        '<p style="font-size:12px;margin-bottom:14px">' + window.t('noRoutinesSub', 'Starte ein Workout und tippe auf "Als Routine speichern"') + '</p>' +
        '<button onclick="window.switchTab?window.switchTab(\'training\'):null" class="pointer-events-auto"' +
        ' style="padding:10px 20px;border-radius:10px;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex);font-size:13px;font-weight:700;cursor:pointer"' +
        ' aria-label="Erste Routine erstellen">Erste Routine erstellen</button>' +
        '</div>';
      return;
    }

    container.innerHTML = routines.map(function(r) {
      var exNames = r.exercises.map(function(e) { return window._escapeHtml(e.exercise); }).slice(0, 4).join(' \u00B7 ');
      if (r.exercises.length > 4) exNames += ' +' + (r.exercises.length - 4);
      var date = new Date(r.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
      return '<div style="padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;margin-bottom:8px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
        '<span style="font-size:13px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(r.name) + '</span>' +
        '<span style="font-size:10px;color:var(--text-muted)">' + date + ' \u00B7 ' + r.exercises.length + ' \u00DCbungen</span>' +
        '</div>' +
        '<p style="font-size:11px;color:var(--text-muted);margin-bottom:10px">' + exNames + '</p>' +
        '<div style="display:flex;gap:8px">' +
        '<button onclick="window._loadAthleteRoutine(\'' + r.id + '\')" class="pointer-events-auto" style="flex:1;padding:8px;border-radius:8px;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex);font-size:12px;font-weight:700;cursor:pointer" aria-label="Routine laden">Laden</button>' +
        '<button onclick="window._shareRoutine(\'' + r.id + '\')" class="pointer-events-auto" style="padding:8px 12px;border-radius:8px;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted);font-size:12px;cursor:pointer" aria-label="Routine teilen">\uD83D\uDD17 Teilen</button>' +
        '<button onclick="window._deleteAthleteRoutine(\'' + r.id + '\')" class="pointer-events-auto" style="padding:8px 12px;border-radius:8px;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted);font-size:12px;cursor:pointer" aria-label="Routine loeschen">\u2715</button>' +
        '</div></div>';
    }).join('');
  };

  window.openAthleteRoutines = function() {
    window._renderAthleteRoutinesModal();
    window.toggleModal('athleteRoutinesModal');
  };

  // ============================================================
  // PLATE CALCULATOR (Bottom Sheet)
  // ============================================================
  window.openPlateCalc = function(prefillWeight) {
    var existing = document.getElementById('plateCalcSheet');
    if (existing) existing.remove();
    var old_bd = document.getElementById('pcBackdrop');
    if (old_bd) old_bd.remove();

    var BARBELL = 20;
    var PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
    var PLATE_COLORS = {25:'#e53935',20:'#1565c0',15:'#fdd835',10:'#43a047',5:'#757575',2.5:'#e0e0e0',1.25:'#ffb74d'};

    function calcPlates(totalKg) {
      var perSide = (totalKg - BARBELL) / 2;
      if (perSide < 0) return [];
      var result = [];
      var remaining = perSide;
      PLATES.forEach(function(p) {
        var count = Math.floor(remaining / p);
        if (count > 0) { result.push({kg:p,count:count}); remaining = Math.round((remaining - count * p) * 100) / 100; }
      });
      return result;
    }

    function render(weight) {
      var plates = calcPlates(weight);
      var loaded = plates.reduce(function(s,p){return s+p.kg*p.count;},0);
      var total = BARBELL + loaded * 2;
      var plateHTML = plates.length > 0
        ? plates.map(function(p) {
            var h = Math.min(80, 20 + p.kg * 2);
            var w = 16 + p.kg;
            return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">' +
              '<div style="width:' + w + 'px;height:' + h + 'px;border-radius:4px;background:' + PLATE_COLORS[p.kg] + ';display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;text-shadow:0 1px 2px rgba(0,0,0,.4)">' + p.kg + '</div>' +
              '<span style="font-size:9px;color:var(--text-muted)">\u00D7' + p.count + '</span></div>';
          }).join('')
        : '<span style="color:var(--text-muted);font-size:12px">Nur Stange (' + BARBELL + ' kg)</span>';

      var vis = document.getElementById('pcVis');
      var tot = document.getElementById('pcTotal');
      var rem = document.getElementById('pcRemain');
      if (vis) vis.innerHTML = plateHTML;
      if (tot) tot.textContent = total.toFixed(2).replace(/\\.?0+$/, '') + ' kg';
      var diff = weight - total;
      if (rem) rem.textContent = Math.abs(diff) < 0.01 ? '' : 'Ziel: ' + weight + ' kg \u2192 Geladen: ' + total + ' kg (\u0394 ' + Math.abs(diff).toFixed(2) + ')';
    }

    var sheet = document.createElement('div');
    sheet.id = 'plateCalcSheet';
    sheet.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:var(--surface-hex,#161816);border-top:1px solid var(--border-hex,#1e201e);border-radius:20px 20px 0 0;padding:20px 16px 44px;pointer-events:auto;max-width:500px;margin:0 auto;box-shadow:0 -10px 40px rgba(0,0,0,.5)';
    sheet.innerHTML =
      '<div style="width:40px;height:4px;border-radius:2px;background:var(--border-hex);margin:0 auto 14px"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
        '<p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted)">Scheiben-Rechner</p>' +
        '<button onclick="document.getElementById(\'plateCalcSheet\').remove();document.getElementById(\'pcBackdrop\').remove();" style="background:none;border:none;color:var(--text-muted);font-size:22px;cursor:pointer;pointer-events:auto" aria-label="Schliessen">\u00D7</button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
        '<label style="font-size:12px;color:var(--text-muted);white-space:nowrap">Zielgewicht</label>' +
        '<input id="pcInput" type="number" inputmode="decimal" value="' + (parseFloat(prefillWeight) || 60) + '" min="20" max="500" step="2.5"' +
        ' oninput="window._pcRender(parseFloat(this.value)||20)"' +
        ' style="flex:1;padding:10px;border-radius:10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:16px;font-weight:700;text-align:center;outline:none" aria-label="Zielgewicht"/>' +
        '<span style="font-size:12px;color:var(--text-muted)">kg</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:4px;margin-bottom:16px;min-height:90px;padding:12px;background:var(--inner-bg-hex);border-radius:12px;border:1px solid var(--border-hex)">' +
        '<div style="width:60px;height:12px;border-radius:3px;background:var(--border-hex);flex-shrink:0" title="Stange 20kg"></div>' +
        '<div id="pcVis" style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;flex:1;justify-content:flex-start"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<span style="font-size:12px;color:var(--text-muted)">Stange: ' + BARBELL + ' kg \u00B7 Pro Seite:</span>' +
        '<span id="pcTotal" style="font-size:18px;font-weight:800;color:var(--primary-hex)"></span>' +
      '</div>' +
      '<div id="pcRemain" style="font-size:10px;color:var(--text-muted);text-align:right;margin-top:2px"></div>';

    var backdrop = document.createElement('div');
    backdrop.id = 'pcBackdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.5);pointer-events:auto';
    backdrop.onclick = function() { sheet.remove(); backdrop.remove(); };

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);

    window._pcRender = render;
    render(parseFloat(prefillWeight) || 60);
  };

  window.syncClientsToCloud = async function() {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'clients_list');
    await window._fbSetDoc(ref, { clients: JSON.parse(localStorage.getItem('beastmode_v2_clients') || '[]'), updated: new Date().toISOString() });
   } catch(e) { console.warn('[Cloud] Client sync:', e && e.code, e && e.message); if(!navigator.onLine && window.showToast) window.showToast(window.t('cloudOffline','Offline \u2014 Cloud-Sync pausiert'), 'warn'); }
  };

  window._syncClientWorkoutsToCloud = async function(clientId) {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var data = JSON.parse(localStorage.getItem('beastmode_v2_cache_' + clientId) || '[]');
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'client_workouts_' + clientId);
    await window._fbSetDoc(ref, { workouts: data, updated: new Date().toISOString() });
   } catch(e) { console.warn('[Cloud] Workout sync:', e && e.code, e && e.message); if(!navigator.onLine && window.showToast) window.showToast(window.t('cloudOffline','Offline \u2014 Cloud-Sync pausiert'), 'warn'); }
  };

  window._syncClientProfileToCloud = async function(clientId, profile) {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'client_profile_' + clientId);
    await window._fbSetDoc(ref, { profile: profile, updated: new Date().toISOString() });
   } catch(e) { console.warn('[Cloud] Profile sync:', e && e.code, e && e.message); if(!navigator.onLine && window.showToast) window.showToast(window.t('cloudOffline','Offline \u2014 Cloud-Sync pausiert'), 'warn'); }
  };

  window._syncSessionsToCloud = async function() {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var data = JSON.parse(localStorage.getItem('base_pt_sessions') || '[]');
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'sessions');
    await window._fbSetDoc(ref, { sessions: data, updated: new Date().toISOString() });
   } catch(e) { console.warn('[Cloud] Session sync:', e && e.code, e && e.message); if(!navigator.onLine && window.showToast) window.showToast(window.t('cloudOffline','Offline \u2014 Cloud-Sync pausiert'), 'warn'); }
  };

  window.loadClientDataFromCloud = async function() {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var listRef = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'clients_list');
    var listSnap = await window._fbGetDoc(listRef);
    if(listSnap.exists()) {
     var cloudClients = listSnap.data().clients || [];
     var localClients = JSON.parse(localStorage.getItem('beastmode_v2_clients') || '[]');
     var merged = cloudClients.slice();
     localClients.forEach(function(lc) {
      if(!merged.some(function(mc) { return mc.id === lc.id; })) { merged.push(lc); }
     });
     localStorage.setItem('beastmode_v2_clients', JSON.stringify(merged));
     if(window.clients) window.clients = merged;
     console.log('PT Clients synced from cloud:', merged.length);
    }
    var clients = JSON.parse(localStorage.getItem('beastmode_v2_clients') || '[]');
    for(var i = 0; i < clients.length; i++) {
     var cid = clients[i].id;
     try {
      var wRef = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'client_workouts_' + cid);
      var wSnap = await window._fbGetDoc(wRef);
      if(wSnap.exists() && wSnap.data().workouts) {
       var cloudW = wSnap.data().workouts;
       var localW = JSON.parse(localStorage.getItem('beastmode_v2_cache_' + cid) || '[]');
       if(cloudW.length >= localW.length) { localStorage.setItem('beastmode_v2_cache_' + cid, JSON.stringify(cloudW)); }
      }
     } catch(e) { console.log('Skip workout sync for', cid); }
     try {
      var pRef = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'client_profile_' + cid);
      var pSnap = await window._fbGetDoc(pRef);
      if(pSnap.exists() && pSnap.data().profile) { localStorage.setItem('base_client_profile_' + cid, JSON.stringify(pSnap.data().profile)); }
     } catch(e) { console.log('Skip profile sync for', cid); }
    }
    var sRef = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'sessions');
    var sSnap = await window._fbGetDoc(sRef);
    if(sSnap.exists() && sSnap.data().sessions) {
     var cloudS = sSnap.data().sessions;
     var localS = JSON.parse(localStorage.getItem('base_pt_sessions') || '[]');
     if(cloudS.length >= localS.length) { localStorage.setItem('base_pt_sessions', JSON.stringify(cloudS)); }
    }
    if(typeof window.renderPTClientsDashboard === 'function') window.renderPTClientsDashboard();
   } catch(e) { console.warn('[Cloud] Load error:', e && e.code, e && e.message); if(!navigator.onLine && window.showToast) window.showToast(window.t('cloudOffline','Offline \u2014 Cloud-Sync pausiert'), 'warn'); }
  };

  window.addEventListener('load', () => {
   if (!localStorage.getItem('base_anonymous_id')) {
    localStorage.setItem('base_anonymous_id', 'anon_' + Date.now().toString(36) + Math.random().toString(36).substring(2,8));
   }
   document.getElementById('langSelectApp').value = window.currentLang; window.switchLanguage(window.currentLang);
   const urlParams = new URLSearchParams(window.location.search); const code = urlParams.get('code'); if(code && !stravaTokens) { window.handleStravaCallback(code); window.history.replaceState({}, document.title, window.location.pathname); }
   window.updateStravaUI();
   
   const lsW = localStorage.getItem('beastmode_v2_cache'); if(lsW) window.workouts = JSON.parse(lsW);
   const lsC = localStorage.getItem('beastmode_v2_clients'); if(lsC) window.clients = JSON.parse(lsC);
   const lsR = localStorage.getItem('beastmode_v2_routines'); if(lsR) window.savedRoutines = JSON.parse(lsR);
   if (window._loadAppData && window.currentUser) {
    if (!localStorage.getItem('base_routines')) { window._loadAppData('base_routines').then(function(d) { if(d) localStorage.setItem('base_routines', JSON.stringify(d)); }); }
    if (!localStorage.getItem('base_progress_photos')) { window._loadAppData('base_progress_photos').then(function(d) { if(d) localStorage.setItem('base_progress_photos', JSON.stringify(d)); }); }
    if (!localStorage.getItem('beastmode_v2_profile')) { window._loadAppData('beastmode_v2_profile').then(function(d) { if(d) { localStorage.setItem('beastmode_v2_profile', JSON.stringify(d)); try { window.userProfile = Object.assign(window.userProfile || {}, d); } catch(e) {} } }); }
    if (!localStorage.getItem('base_athlete_profile')) { window._loadAppData('base_athlete_profile').then(function(d) { if(d) localStorage.setItem('base_athlete_profile', JSON.stringify(d)); }); }
   }
   const lsCF = localStorage.getItem('beastmode_v2_custom_fields'); if(lsCF) savedCustomFields = JSON.parse(lsCF);
   const lsP = localStorage.getItem('beastmode_v2_profile'); 
   
   if(lsP) { try { window.userProfile = { ...window.userProfile, ...JSON.parse(lsP) }; if(!window.userProfile.widgets) window.userProfile.widgets = { readiness: false, ptMode: false }; if(!window.userProfile.modules) window.userProfile.modules = { main: false, strength: true, cardio: true, recovery: false }; if(window.userProfile.injuries && Array.isArray(window.userProfile.injuries)) window.selectedInjuries = new Set(window.userProfile.injuries); } catch(e) { console.error('Fehler beim Laden des Profils:', e); } } 

   try { const lsSchemas = localStorage.getItem('beastmode_v2_multi_schemas'); if(lsSchemas) { window.categorySchemas = { ...window.categorySchemas, ...JSON.parse(lsSchemas) }; } } catch(e) { console.error('Fehler beim Laden der Schemas:', e); if(window.showToast) window.showToast('Sport-Schema konnte nicht geladen werden', 'warn'); }
   if (!window.categorySchemas.strength || !window.categorySchemas.strength.schema || window.categorySchemas.strength.schema.length === 0) { window.categorySchemas.strength = { sportName: "Klassisches Krafttraining", schema: window.DEFAULT_STRENGTH_SCHEMA }; localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(window.categorySchemas)); }
   if (!window.categorySchemas.cardio || !window.categorySchemas.cardio.schema || window.categorySchemas.cardio.schema.length === 0) { window.categorySchemas.cardio = { sportName: "Ausdauersport", schema: window.DEFAULT_CARDIO_SCHEMA }; localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(window.categorySchemas)); }
   if (!window.categorySchemas['recovery'] || !window.categorySchemas['recovery'].schema || window.categorySchemas['recovery'].schema.length === 0) {
    window.categorySchemas['recovery'] = {
     sportName: 'Mobility',
     schema: [
      { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: 'z.B. 30' },
      { id: 'fokus', label: 'Fokusbereich', type: 'text', placeholder: 'z.B. H\u00fcfte, Schultern' },
      { id: 'dehnzeit', label: 'Dehnzeit pro \u00dcbung (sek)', type: 'number', placeholder: 'z.B. 30' },
      { id: 'seite', label: 'Seite', type: 'text', placeholder: 'Beide / Links / Rechts' },
      { id: 'intensitaet', label: 'Intensit\u00e4t', type: 'text', placeholder: 'Leicht / Mittel / Tief' },
      { id: 'bewertung', label: 'Bewertung (1-10)', type: 'number', placeholder: 'z.B. 7' }
     ]
    };
   }

   if (!window.userProfile.onboardingDone && !code) {
    if(document.getElementById('onboardingModal')) { window.toggleModal('onboardingModal'); }
    else { window.userProfile.onboardingDone = true; if(typeof window.applyModules === 'function') window.applyModules(); if(typeof window.renderWidgetStoreUI === 'function') window.renderWidgetStoreUI(); }
   } else { if(typeof window.applyModules === 'function') window.applyModules(); if(typeof window.renderWidgetStoreUI === 'function') window.renderWidgetStoreUI(); setTimeout(function() { if(typeof window.showModeSelector === 'function') window.showModeSelector(); }, 500); }
   
   // ============================================================
   // REF / CREATOR CODE URL PARAMETER
   // ============================================================
   window._processRefParameter = function() {
     var params = new URLSearchParams(window.location.search);
     var ref = params.get('ref') || params.get('code') || params.get('creator');
     if (!ref) return;
     ref = ref.toUpperCase().trim();
     localStorage.setItem('base_pending_ref_code', ref);
     localStorage.setItem('base_pending_ref_ts', Date.now().toString());
     var cleanUrl = window.location.pathname;
     window.history.replaceState({}, document.title, cleanUrl);
     console.log('[Ref] Code gespeichert:', ref);
     var row = document.getElementById('refCodeRow');
     var disp = document.getElementById('refCodeDisplay');
     if (row) row.style.display = 'block';
     if (disp) disp.textContent = ref;
   };
   window._processRefParameter();

   window.setupInjuryChips(); window.populateProfile();
   const dateInput = document.getElementById('dateInput'); if (dateInput) dateInput.valueAsDate = new Date();
   
   if ((window.workouts||[]).filter(function(w){return w.archived;}).length === 0) { window._showHistorySkeleton(); } window.renderTableFilters(); window.filterTable(window.currentCategory); window.calculateReadiness(); window.calculateStreak(); window.checkFirstWorkoutBanner(); window.checkAnonRegisterBanner(); window.showSocialProof(); window.checkReviewPrompt(); window.checkWeeklyReview(); if(window._updateSmartWorkoutVisibility) window._updateSmartWorkoutVisibility(); if(window._renderXPBar) window._renderXPBar(); if(window._renderRoutineCards) window._renderRoutineCards(); if(window._renderTodaysWorkout) window._renderTodaysWorkout(); if(window._renderHabitTracker) window._renderHabitTracker(); if(window._renderMicroTasks) window._renderMicroTasks(); if(window._renderProgressPhotos) window._renderProgressPhotos(); setTimeout(function() { if(window._checkRetentionHooks) window._checkRetentionHooks(); if(window._checkDeloadReminder) window._checkDeloadReminder(); if(window._checkWeeklyConsistencyXP) window._checkWeeklyConsistencyXP(); if(window._autoRegulateVolume) window._autoRegulateVolume(); }, 4000); var _idleBatch=function(fn){if(window.requestIdleCallback)requestIdleCallback(fn,{timeout:3000});else setTimeout(fn,600);}; setTimeout(function(){_idleBatch(function(){if(window._calculateMuscleRecovery)window._calculateMuscleRecovery();if(window._calculateACWR)window._calculateACWR();if(window._checkSuppReminders)window._checkSuppReminders();}); setInterval(function(){if(window._checkSuppReminders)window._checkSuppReminders();},60000); var _olHour=new Date().getHours();var _olToday=new Date().toISOString().split('T')[0];if(!localStorage.getItem('base_outlook_shown_'+_olToday)&&_olHour>=6&&_olHour<12){localStorage.setItem('base_outlook_shown_'+_olToday,'1');setTimeout(function(){if(window._generateDailyOutlook)window._generateDailyOutlook();},2000);} }, 5000);
   // Empty States: KI Hint + Meso Plan
   setTimeout(function() {
    var archived = (window.workouts||[]).filter(function(w){return w.archived;});
    var kiHint = document.getElementById('kiEmptyHint');
    if (kiHint) { if (archived.length < 3) kiHint.classList.remove('hidden'); else kiHint.classList.add('hidden'); }
    var mesoEmpty = document.getElementById('mesoEmptyState');
    var activePlan = localStorage.getItem('base_active_plan');
    if (mesoEmpty) { if (!activePlan && archived.length >= 1) mesoEmpty.classList.remove('hidden'); else mesoEmpty.classList.add('hidden'); }
   }, 1000);
   // "Training beenden" Button Init
   var _endBtnInit = document.getElementById('endSessionBtn');
   if (_endBtnInit) { var _tdi = new Date().toISOString().split('T')[0]; var _aWi = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]'); var _tcI = _aWi.filter(function(w) { return w.date === _tdi; }).length; if (_tcI > 0) { _endBtnInit.textContent = 'Training beenden (' + _tcI + ' \u00dcbungen)'; _endBtnInit.style.display = ''; } }
   if (window._checkKiDiscovery) setTimeout(function() { window._checkKiDiscovery('init'); }, 3000);
   if (window.DESIGN_MORPH_ACTIVE && window._applyModeTheme) {
    var _dmInitMode = 'athlete';
    if (window.userProfile && window.userProfile.widgets
     && window.userProfile.widgets.ptMode
     && window.currentMode === 'pt') {
     _dmInitMode = 'pt';
    }
    window._applyModeTheme(_dmInitMode);
    if (window._applyCategoryTheme) {
     window._applyCategoryTheme(window.currentCategory);
    }
   }
   var _initSets = ((window.workouts||[]).filter(function(w){return w.archived;}).length === 0) ? 1 : 3;
   var _setsInput = document.getElementById('setsInput'); if(_setsInput) _setsInput.value = _initSets;
   window.generateSetFields(_initSets);
   window.loadBodyData();
   const bodyDateInput = document.getElementById('bodyDate'); if(bodyDateInput) bodyDateInput.valueAsDate = new Date();
   window._refreshLucide();
   if(window.currentMode === 'personal') {
    var bw = document.getElementById('btnWarmup'); if(bw) { bw.classList.remove('hidden'); bw.style.display = 'flex'; }
    var br = document.getElementById('btnExerciseRec'); if(br) { br.classList.remove('hidden'); br.style.display = 'flex'; }
   }
   const hasActiveWorkouts = Array.isArray(window.workouts) && window.workouts.some(w => !w.archived);
   const fWrapper = document.getElementById('formRevealWrapper');
   const cPrompt = document.getElementById('categoryPrompt');
   if(hasActiveWorkouts) {
    if(fWrapper) fWrapper.classList.add('form-visible');
    if(cPrompt) cPrompt.classList.add('hidden');
   } else {
    if(fWrapper) fWrapper.classList.remove('form-visible');
    if(cPrompt) { cPrompt.classList.remove('hidden'); cPrompt.classList.add('block'); }
    document.querySelectorAll('.cat-pill').forEach(btn => btn.classList.remove('cat-pill-active'));
   }
  });

  window.switchCategory = function(cat) {
   window.currentCategory = cat;
   if (window._applyCategoryTheme) window._applyCategoryTheme(cat);
   document.querySelectorAll('.cat-pill').forEach(btn => { btn.className = `cat-pill flex-shrink-0 cursor-pointer interactive-z`; }); 
   const activeBtn = document.getElementById(`btnCat_${cat}`);
   if(activeBtn) { activeBtn.classList.add(`cat-pill-active`); }
   window.renderDynamicSportTabs();
   if(window._renderCustomTabs) window._renderCustomTabs();
   if(window._applySavedTabOrder) window._applySavedTabOrder();
   var sfp = document.getElementById('stretchFlowPicker'); if(sfp) { if(cat === 'recovery' && window._showStretchFlowPicker) { sfp.classList.remove('hidden'); window._showStretchFlowPicker(); } else sfp.classList.add('hidden'); }
   const stravaContainer = document.getElementById('stravaActionContainer'); if(stravaContainer) { if(cat === 'cardio') stravaContainer.classList.remove('hidden'); else stravaContainer.classList.add('hidden'); }
   var gpsBtn = document.getElementById('gpsQuickBtn'); if (gpsBtn) { gpsBtn.style.display = cat === 'cardio' ? 'flex' : 'none'; }
   const hiitContainer = document.getElementById('hiitTimerContainer');
   if(hiitContainer) { if(cat === 'cardio') hiitContainer.classList.remove('hidden'); else { hiitContainer.classList.add('hidden'); window.resetHiit && window.resetHiit(); } } const catData = window.categorySchemas[cat]; const titleMap = { main: window.t('modCus','Mein Sport'), strength: window.t('modStr','Krafttraining'), cardio: window.t('modCar','Ausdauersport'), recovery: window.t('tabRec','Mobility') }; const fallbackTitle = i18nData[window.currentLang] ? (i18nData[window.currentLang][`mod${cat.charAt(0).toUpperCase() + cat.slice(1,3)}`] || titleMap[cat]) : titleMap[cat]; if(catData && catData.schema && catData.schema.length > 0) { window.renderDynamicForm(catData.sportName, catData.schema, cat); } else { document.getElementById('workoutForm').classList.add('hidden'); document.getElementById('restTimerSection').classList.add('hidden'); document.getElementById('noFormState').classList.remove('hidden'); document.getElementById('noFormState').classList.add('block'); const ui = window.CAT_UI[cat]; const iconContainer = document.getElementById('formCatIcon'); if(iconContainer && ui) { iconContainer.className = 'w-7 h-7 rounded-lg flex items-center justify-center border'; iconContainer.style.color = 'var(--cat-accent)'; iconContainer.style.borderColor = 'var(--cat-accent)'; iconContainer.style.backgroundColor = 'var(--cat-glow-10)'; iconContainer.innerHTML = `<i data-lucide="${ui.icon}" class="w-3.5 h-3.5"></i>`; } const titleEl = document.getElementById('formSportTitle'); if(titleEl) titleEl.textContent = fallbackTitle; const _olEl1 = document.getElementById('formCatOverline'); if(_olEl1) { const _olMap1 = { strength: window.t('modStr','Kraft Modul'), cardio: window.t('modCar','Ausdauer Modul'), recovery: window.t('tabRec','Mobility'), main: window.t('modCus','Mein Sport') }; _olEl1.textContent = _olMap1[cat] || cat; } const placeholders = { main: `z.B. Tennis`, strength: "z.B. Squats", cardio: window.t('phCardio','z.B. 10k Lauf'), recovery: "z.B. Yoga, Stretching" }; const sportInput = document.getElementById('sportTypeInput'); if(sportInput) sportInput.placeholder = placeholders[cat] || window.t('obFocS','Was trackst du?'); } // Reveal form (Progressive Disclosure)
   const wrapper = document.getElementById('formRevealWrapper'); if(wrapper) wrapper.setAttribute('data-cat', cat); const prompt = document.getElementById('categoryPrompt');
   if(wrapper) { wrapper.classList.add('form-visible'); }
   if(prompt) { prompt.classList.add('hidden'); }
   if(typeof window.filterTable === 'function') window.filterTable(cat); window.updateExerciseAutocomplete(); if(window._renderRoutineCards) window._renderRoutineCards(); if(window._renderTodaysWorkout) window._renderTodaysWorkout(); if(window._showDeloadWarning) try{window._showDeloadWarning();}catch(e){} if(window._autoRegulateVolume) try{window._autoRegulateVolume();}catch(e){} if(window._renderHabitTracker) try{window._renderHabitTracker();}catch(e){}
   // Hold Timer for Mobility
   var holdTimerEl = document.getElementById('holdTimerButtons');
   if (holdTimerEl) { if (cat === 'recovery') holdTimerEl.classList.remove('hidden'); else holdTimerEl.classList.add('hidden'); }
   if(cat === 'main' && !localStorage.getItem('base_builder_used')) {
    const hasCustomSchemas = localStorage.getItem('beastmode_v2_multi_schemas');
    const parsed = hasCustomSchemas ? JSON.parse(hasCustomSchemas) : {};
    const hasCustom = Object.keys(parsed).some(k => !['strength','cardio','recovery'].includes(k));
    if(!hasCustom) {
     const builder = document.getElementById('builderSection');
     if(builder && builder.classList.contains('hidden')) {
      builder.classList.remove('hidden'); builder.classList.add('block');
      setTimeout(() => { const input = document.getElementById('sportTypeInput'); if(input) input.focus(); }, 100);
     }
    }
   }
  };
  window.renderDynamicForm = function(name, schema, catId) { const emptyState = document.getElementById('noFormState'); if(emptyState) emptyState.classList.add('hidden'); const form = document.getElementById('workoutForm'); if(form) form.classList.remove('hidden'); const timer = document.getElementById('restTimerSection'); if(timer) { timer.classList.remove('hidden'); timer.classList.add('flex'); } document.getElementById('currentSportType').value = name; const titleMap = { main: window.t('modCus','Mein Sport'), strength: window.t('modStr','Krafttraining'), cardio: window.t('modCar','Ausdauersport'), recovery: window.t('tabRec','Mobility') }; document.getElementById('formSportTitle').textContent = (i18nData[window.currentLang] && i18nData[window.currentLang][`mod${catId.charAt(0).toUpperCase() + catId.slice(1,3)}`]) || titleMap[catId] || name; const _olEl2 = document.getElementById('formCatOverline'); if(_olEl2) { const _olMap2 = { strength: window.t('modStr','Kraft Modul'), cardio: window.t('modCar','Ausdauer Modul'), recovery: window.t('tabRec','Mobility'), main: window.t('modCus','Mein Sport') }; _olEl2.textContent = _olMap2[catId] || catId; } const ui = window.CAT_UI[catId] || window.CAT_UI['main']; const iconContainer = document.getElementById('formCatIcon'); if(iconContainer && ui) { iconContainer.className = 'w-7 h-7 rounded-lg flex items-center justify-center border'; iconContainer.style.color = 'var(--cat-accent)'; iconContainer.style.borderColor = 'var(--cat-accent)'; iconContainer.style.backgroundColor = 'var(--cat-glow-10)'; iconContainer.innerHTML = `<i data-lucide="${ui.icon}" class="w-3.5 h-3.5"></i>`; }
   const strengthFields = document.getElementById('strengthFields'); const setsContainer = document.getElementById('setsContainer'); const dynamicFieldsContainer = document.getElementById('dynamicFieldsContainer'); const addCustomFieldBtnContainer = document.getElementById('addCustomFieldBtnContainer');
   
   const renderField = (field, removeFn) => { const wrapper = document.createElement('div'); wrapper.className = "relative group col-span-1"; const _fl = window.t('schema_' + field.id, field.label); const _fp = window.t('ph_' + field.id, field.placeholder || ''); const _safeId = window._escapeHtml(field.id).replace(/'/g, '&#39;'); wrapper.innerHTML = `<label class="block text-[10px] font-black text-primary uppercase tracking-widest mb-2">${window._escapeHtml(_fl)}</label><div class="relative interactive-z"><input type="${field.type || 'text'}" id="dyn_${_safeId}" data-label="${window._escapeHtml(field.label)}" placeholder="${window._escapeHtml(_fp)}" step="any" class="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-bold outline-none focus:border-primary transition-colors shadow-inner pr-10 pointer-events-auto cursor-text"><button aria-label="Schließen" type="button" data-remove-fn="${window._escapeHtml(removeFn)}" class="remove-field-btn absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-rose-500 transition-colors cursor-pointer pointer-events-auto"><i data-lucide="x" class="w-4 h-4 pointer-events-none"></i></button></div>`; wrapper.querySelector('.remove-field-btn').addEventListener('click', function() { var fn = new Function(removeFn); fn(); }); return wrapper; };

   if(catId === 'strength') {
    if(strengthFields) { strengthFields.classList.remove('hidden'); strengthFields.classList.add('grid'); }
    if(setsContainer) { setsContainer.classList.remove('hidden'); setsContainer.classList.add('grid'); }
    if(addCustomFieldBtnContainer) addCustomFieldBtnContainer.classList.add('hidden');
    if(setsContainer && setsContainer.innerHTML.trim() === '') { const sInput = document.getElementById('setsInput'); if(sInput) window.generateSetFields(sInput.value); }
    const extraFields = window.categorySchemas['strength']?.extraFields || [];
    if(dynamicFieldsContainer) { dynamicFieldsContainer.innerHTML = ''; if(extraFields.length > 0) { dynamicFieldsContainer.classList.remove('hidden'); dynamicFieldsContainer.classList.add('grid'); extraFields.forEach(f => dynamicFieldsContainer.appendChild(renderField(f, `window.removeExtraField('strength','${f.id}')`))); } else { dynamicFieldsContainer.classList.add('hidden'); dynamicFieldsContainer.classList.remove('grid'); } }
   } else {
    if(strengthFields) { strengthFields.classList.add('hidden'); strengthFields.classList.remove('grid'); }
    if(setsContainer) { setsContainer.classList.add('hidden'); setsContainer.classList.remove('grid'); }
    if(addCustomFieldBtnContainer) { addCustomFieldBtnContainer.classList.remove('hidden'); addCustomFieldBtnContainer.classList.add('flex'); }
    if(dynamicFieldsContainer) {
     dynamicFieldsContainer.classList.remove('hidden'); dynamicFieldsContainer.classList.add('grid'); dynamicFieldsContainer.innerHTML = '';
     schema.forEach(f => dynamicFieldsContainer.appendChild(renderField(f, `window.removeField('${f.id}')`)));
     const extraFields = window.categorySchemas[catId]?.extraFields || [];
     extraFields.forEach(f => dynamicFieldsContainer.appendChild(renderField(f, `window.removeExtraField('${catId}','${f.id}')`)));
    }
   }
   window._refreshLucide();
  };
  
  window.generateSetFields = function(count) {
   window._currentSetIndex = 0; window._savedSets = []; window._pendingSavedSets = null;
   var container = document.getElementById('setsContainer');
   if(!container) return;
   // BW-Modus: Toggle fuer bodyweight-faehige Uebungen
   var _bwContainer = document.getElementById('bwModeContainer');
   if (_bwContainer) _bwContainer.remove();
   var _exInput = document.getElementById('exerciseInput');
   var _exName = _exInput ? _exInput.value : '';
   if (window._isBodyweightExercise && window._isBodyweightExercise(_exName)) {
    var _bwDiv = document.createElement('div'); _bwDiv.id = 'bwModeContainer';
    _bwDiv.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;margin-bottom:8px';
    _bwDiv.innerHTML = '<label style="font-size:11px;color:var(--text-muted);font-weight:600">Koerpergewicht-Modus</label>' +
      '<div onclick="window._toggleBWMode()" class="pointer-events-auto" id="bwModeSwitch" role="switch" aria-checked="' + (window._bwModeActive?'true':'false') + '" tabindex="0" style="width:36px;height:20px;border-radius:10px;background:' + (window._bwModeActive?'var(--primary-hex)':'var(--border-hex)') + ';cursor:pointer;position:relative;transition:background .2s">' +
      '<div id="bwModeDot" style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:2px;left:' + (window._bwModeActive?'18':'2') + 'px;transition:left .2s"></div></div>';
    container.parentNode.insertBefore(_bwDiv, container);
   } else { window._bwModeActive = false; }
   container.innerHTML = '';
   var _bb = 'background:var(--surface-hex);border:none;color:#888';
   for(var i = 1; i <= parseInt(count); i++) {
    var row = document.createElement('div');
    row.className = 'p-3.5 rounded-xl mb-2 pointer-events-auto';
    row.setAttribute('data-set-card', '');
    row.style.cssText = 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);transition:background 0.3s';
    row.innerHTML =
     '<div class="flex items-center justify-between mb-3"><span class="text-[11px] font-black" style="color:var(--primary-hex)">' + window.t('lblSet','Satz') + ' ' + i + '</span>' +
     '<button type="button" id="setTypeBtn_s' + i + '" onclick="window._cycleSetType(' + i + ')" class="pointer-events-auto cursor-pointer" style="background:transparent;border:1px solid var(--border-hex);border-radius:8px;padding:10px 12px;font-size:12px;min-height:44px;font-weight:700;color:#737373;font-family:Outfit,sans-serif;transition:all 0.2s" aria-label="Set Type">Normal</button><input type="hidden" id="setType_s' + i + '" value="normal"></div>' +
     '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">' +
      '<div style="background:var(--bg-hex);border:1px solid var(--border-hex);border-radius:12px;padding:8px;display:flex;align-items:center;gap:2px">' +
       '<span style="font-size:8px;font-weight:800;color:#737373;text-transform:uppercase;letter-spacing:0.5px;width:24px;flex-shrink:0">' + window.t('lblReps','Wdh') + '</span>' +
       '<button type="button" onclick="window._adjustInput(\'wdh_s' + i + '\',-1)" style="width:36px;height:36px;border-radius:8px;background:var(--surface-hex);border:none;color:#888;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer" class="pointer-events-auto" aria-label="Wdh minus">\u2212</button>' +
       '<input type="number" inputmode="numeric" id="wdh_s' + i + '" placeholder="--" min="0" style="width:100%;min-width:0;height:32px;text-align:center;background:none;border:none;color:#fff;font-size:20px;font-weight:900;font-family:Outfit,sans-serif;outline:none;flex:1" class="pointer-events-auto">' +
       '<button type="button" onclick="window._adjustInput(\'wdh_s' + i + '\',1)" style="width:36px;height:36px;border-radius:8px;background:var(--surface-hex);border:none;color:#888;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer" class="pointer-events-auto" aria-label="Wdh plus">+</button>' +
      '</div>' +
      '<div style="background:var(--bg-hex);border:1px solid var(--border-hex);border-radius:12px;padding:8px;display:flex;align-items:center;gap:2px">' +
       '<span onclick="window.openPlateCalc(document.getElementById(\'weight_s' + i + '\')&&document.getElementById(\'weight_s' + i + '\').value)" style="font-size:8px;font-weight:800;color:#737373;text-transform:uppercase;letter-spacing:0.5px;width:18px;flex-shrink:0;cursor:pointer;pointer-events:auto" title="Scheiben-Rechner">kg</span>' +
       '<button type="button" onclick="window._adjustInput(\'weight_s' + i + '\',-2.5)" style="width:36px;height:36px;border-radius:8px;background:var(--surface-hex);border:none;color:#888;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer" class="pointer-events-auto" aria-label="kg minus">\u2212</button>' +
       '<input type="number" inputmode="decimal" id="weight_s' + i + '" placeholder="--" min="0" step="0.5" max="999" style="width:100%;min-width:0;height:32px;text-align:center;background:none;border:none;color:#fff;font-size:20px;font-weight:900;font-family:Outfit,sans-serif;outline:none;flex:1" class="pointer-events-auto">' +
       '<button type="button" onclick="window._adjustInput(\'weight_s' + i + '\',2.5)" style="width:36px;height:36px;border-radius:8px;background:var(--surface-hex);border:none;color:#888;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer" class="pointer-events-auto" aria-label="kg plus">+</button>' +
      '</div>' +
     '</div>' +
     '<div class="flex items-center gap-2 py-1.5 px-3 rounded-xl" style="background:rgba(163,201,168,0.05);border:1px solid rgba(163,201,168,0.1)">' +
      '<span class="text-[9px] font-black tracking-wider flex-shrink-0" style="color:var(--primary-hex)">RIR</span>' +
      '<span class="text-[7px] flex-shrink-0" style="color:#737373">0 = Versagen</span>' +
      '<div class="flex items-center ml-auto">' +
       '<button type="button" onclick="window._adjustInput(\'rir_s' + i + '\',-1)" class="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-black cursor-pointer pointer-events-auto" style="' + _bb + '" aria-label="RIR minus">\u2212</button>' +
       '<input type="number" inputmode="numeric" id="rir_s' + i + '" placeholder="--" min="0" max="5" style="width:36px;height:28px;text-align:center;background:none;border:none;color:var(--primary-hex);font-size:20px;font-weight:900;font-family:Outfit,sans-serif;outline:none" class="pointer-events-auto">' +
       '<button type="button" onclick="window._adjustInput(\'rir_s' + i + '\',1)" class="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-black cursor-pointer pointer-events-auto" style="' + _bb + '" aria-label="RIR plus">+</button>' +
      '</div>' +
     '</div>';
    container.appendChild(row);
   }
  };

  window._adjustSetCount = function(delta) {
   var inp = document.getElementById('setsInput');
   var disp = document.getElementById('setCountDisplay');
   if (!inp) return;
   var cur = parseInt(inp.value) || 3;
   var next = Math.max(1, Math.min(10, cur + delta));
   inp.value = next;
   if (disp) disp.textContent = next;
   window.generateSetFields(next);
   if (delta > 0) {
    var _sc = document.getElementById('setsContainer');
    var _newRow = _sc && _sc.lastElementChild;
    if (_newRow) {
     _newRow.style.transition = 'none'; _newRow.style.transform = 'scale(0.92)'; _newRow.style.opacity = '0';
     requestAnimationFrame(function() { requestAnimationFrame(function() {
      _newRow.style.transition = 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1),opacity 0.15s ease';
      _newRow.style.transform = 'scale(1)'; _newRow.style.opacity = '1';
      if (navigator.vibrate) navigator.vibrate(30);
     }); });
    }
   }
  };

  window._toggleBannerStack = function() {
   var inner = document.getElementById('bannerStackInner');
   var txt = document.getElementById('bannerToggleText');
   if (!inner) return;
   var expanded = inner.style.maxHeight !== '80px';
   inner.style.maxHeight = expanded ? '80px' : '600px';
   if (txt) txt.textContent = expanded ? 'Mehr anzeigen \u25BE' : 'Weniger \u25B4';
  };

  window._checkBannerOverflow = function() {
   var inner = document.getElementById('bannerStackInner');
   var toggle = document.getElementById('bannerToggle');
   if (!inner || !toggle) return;
   var visibleCount = 0;
   for (var c = 0; c < inner.children.length; c++) {
    if (inner.children[c].offsetHeight > 0 && !inner.children[c].classList.contains('hidden')) visibleCount++;
   }
   toggle.classList.toggle('hidden', visibleCount <= 1);
  };

  window._cycleSetType = function(setNum) {
   var types = [
    {value:'normal', label:'Normal', color:'#737373', bg:'transparent'},
    {value:'warmup', label:'Warmup', color:'#e8c86a', bg:'rgba(232,200,106,0.04)'},
    {value:'dropset', label:'Drop', color:'#8aafe8', bg:'rgba(138,175,232,0.04)'},
    {value:'failure', label:'Failure', color:'#e88a8a', bg:'rgba(232,138,138,0.04)'}
   ];
   var hidden = document.getElementById('setType_s' + setNum);
   var btn = document.getElementById('setTypeBtn_s' + setNum);
   if (!hidden || !btn) return;
   var curIdx = types.findIndex(function(t) { return t.value === hidden.value; });
   var nextIdx = (curIdx + 1) % types.length;
   var next = types[nextIdx];
   hidden.value = next.value;
   btn.textContent = next.label;
   btn.style.color = next.color;
   btn.style.borderColor = next.color + '33';
   var card = btn.closest('[data-set-card]');
   if (card) card.style.background = next.bg;
  };

  window.saveWorkout = async function(e) {
   if(e) e.preventDefault();
   if(typeof window.initAudio === 'function') window.initAudio(); 
   try {
    const ssExercise = _supersetActive ? document.getElementById('supersetExercise')?.value?.trim() : null;
    const exEl = document.getElementById('exerciseInput'); const dtEl = document.getElementById('dateInput');
    if (!exEl || !dtEl) return;
    if (!exEl.value.trim()) { window.showToast(window.t("toastError", "Bitte eine Aktivität eingeben!")); exEl.focus(); return; }
    if (!dtEl.value) { window.showToast(window.t("toastError", "Bitte ein Datum wählen!")); return; }
    
    var _noteVal = (document.getElementById('exerciseNoteField') || {}).value || '';
    let entry = { id: window.editingWorkoutId || Date.now().toString(), category: window.currentCategory, date: dtEl.value, exercise: exEl.value.trim().substring(0, 200), archived: window.editingWorkoutId ? (window.workouts.find(w => w.id === window.editingWorkoutId)?.archived || false) : false, data: {}, setDetails: [], volume: 0, maxWeight: 0 };
    if (_noteVal.trim()) entry.note = _noteVal.trim().substring(0, 200);
    let isPR = false; let prType = ''; let prSubText = ''; let prValue = ''; let prUnit = ''; let prDiffText = '';
    const exName = exEl.value.trim().toLowerCase(); 
    const pastWorkouts = window.workouts.filter(w => w.category === window.currentCategory && w.exercise.toLowerCase() === exName && w.id !== window.editingWorkoutId);
    
    if (window.currentCategory === 'strength') {
     entry.sportCategory = window.categorySchemas['strength'] ? window.categorySchemas['strength'].sportName : 'Krafttraining';
     let previousMax = 0; if(pastWorkouts.length > 0) { previousMax = Math.max(...pastWorkouts.map(w => w.maxWeight || 0)); }
     const sInput = document.getElementById('setsInput'); const count = sInput ? parseInt(sInput.value) : 0; let vol = 0, maxW = 0; let setsDisplay = [];

     var _usePending = window._pendingSavedSets && window._pendingSavedSets.length > 0;
     if (_usePending) {
      window._pendingSavedSets.forEach(function(s) {
       var setObj = { reps: s.reps, weight: s.weight }; if (s.rir !== null) setObj.rir = s.rir; if (s.type && s.type !== 'normal') setObj.type = s.type;
       entry.setDetails.push(setObj); vol += (s.reps * s.weight);
       if (s.weight > maxW) maxW = s.weight; setsDisplay.push(s.reps + 'x' + s.weight + 'kg');
      });
      window._pendingSavedSets = null;
     } else {
      for (let i = 1; i <= count; i++) {
       const rEl = document.getElementById(`wdh_s${i}`); const wEl = document.getElementById(`weight_s${i}`); const rirEl = document.getElementById(`rir_s${i}`);
       if (rEl && wEl && rEl.value && wEl.value) {
        let r = parseInt(rEl.value) || 0; let w = parseFloat(String(wEl.value).replace(',', '.')) || 0; let rir = (rirEl && rirEl.value !== '') ? parseInt(rirEl.value) : null;
        var _stEl = document.getElementById('setType_s' + i); var _st = _stEl ? _stEl.value : 'normal';
        var setObj = { reps: r, weight: w }; if (rir !== null && !isNaN(rir)) setObj.rir = rir; if (_st !== 'normal') setObj.type = _st;
        entry.setDetails.push(setObj); vol += (r * w);
        if (w > maxW) maxW = w; setsDisplay.push(`${r}x${w}kg`);
       }
      }
     }
     entry.volume = vol; entry.maxWeight = maxW; entry.equipment = document.getElementById('equipmentInput')?.value || 'Standard';
     if (ssExercise) { entry.isSuperset = true; entry.supersetExercise = ssExercise; }
     if (window._bwModeActive) { entry.bwMode = true; entry.bodyweight = window._userBodyweight; }
     if(setsDisplay.length > 0) { entry.data['Sätze'] = setsDisplay.join(' | '); entry.data['Max Gewicht (kg)'] = maxW; entry.data['Volumen (kg)'] = vol; }
     const extraFields = window.categorySchemas['strength']?.extraFields;
     if(extraFields && extraFields.length > 0) { extraFields.forEach(f => { const el = document.getElementById('dyn_' + f.id); if(el && el.value) entry.data[f.label] = el.value; }); }
     
     if (maxW > previousMax && previousMax > 0 && !window.editingWorkoutId) { isPR = true; prType = 'pr_strength'; prSubText = 'Neues Max Gewicht'; prValue = maxW; prUnit = 'kg'; prDiffText = `+${(maxW - previousMax).toFixed(1)}kg Steigerung`; }
    } else if (window.currentCategory === 'cardio') {
     const catData = window.categorySchemas[window.currentCategory]; 
     if (catData && catData.schema) { catData.schema.forEach(f => { const dyn = document.getElementById('dyn_' + f.id); if (dyn) entry.data[f.label] = dyn.value; }); entry.sportCategory = catData.sportName; }
     
     if(!window.editingWorkoutId && pastWorkouts.length > 0 && entry.data) {
      let curDist = parseFloat((entry.data['Distanz (km)'] || entry.data['Distanz'] || '0').toString().replace(',','.')); let curTime = parseFloat((entry.data['Dauer (min)'] || entry.data['Dauer'] || entry.data['Zeit'] || '0').toString().replace(',','.')); let bestDist = 0; let longestTime = 0;
      pastWorkouts.forEach(pw => { if(pw.data) { let d = parseFloat((pw.data['Distanz (km)'] || pw.data['Distanz'] || '0').toString().replace(',','.')); if(d > bestDist) bestDist = d; let t = parseFloat((pw.data['Dauer (min)'] || pw.data['Dauer'] || pw.data['Zeit'] || '0').toString().replace(',','.')); if(t > longestTime) longestTime = t; } });
      if (curDist > bestDist && bestDist > 0) { isPR = true; prType = 'pr_cardio_dist'; prSubText = 'Neue Rekord-Distanz'; prValue = curDist.toFixed(2); prUnit = 'km'; prDiffText = `+${(curDist - bestDist).toFixed(2)}km weiter`; } else if (curTime > longestTime && longestTime > 0) { isPR = true; prType = 'pr_cardio_dur'; prSubText = 'Längste Session'; prValue = curTime; prUnit = 'min'; prDiffText = `+${(curTime - longestTime)}min länger`; }
     }
    } else { 
     const catData = window.categorySchemas[window.currentCategory]; 
     if (catData && catData.schema) { catData.schema.forEach(f => { const dyn = document.getElementById('dyn_' + f.id); if (dyn) entry.data[f.label] = dyn.value; }); entry.sportCategory = catData.sportName; }
     const extraFields = catData?.extraFields || [];
     extraFields.forEach(f => { const el = document.getElementById('dyn_' + f.id); if(el && el.value) entry.data[f.label] = el.value; });
    }
    
    if (window.editingWorkoutId) { 
     const idx = window.workouts.findIndex(w => w.id === window.editingWorkoutId); 
     if (idx !== -1) window.workouts[idx] = entry; 
     window.showToast(window.t("toastUpdate")); 
    } else { 
     window.workouts.unshift(entry); 
     if(isPR) { 
      setTimeout(() => {
       const prOverlay = document.getElementById('prCelebration');
       if(prOverlay) {
        const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
        setText('prCelebExercise', entry.exercise);
        setText('prCelebSub', prSubText);
        setText('prCelebDiff', prDiffText);
        const valEl = document.getElementById('prCelebValue'); if(valEl) valEl.innerHTML = `${prValue}<span class="text-3xl text-zinc-500 ml-1">${prUnit}</span>`;
        const card = document.getElementById('prCelebrationCard');
        if(card) { card.classList.remove('pr-celebration-out'); card.classList.add('pr-celebration'); }
        prOverlay.classList.remove('hidden'); prOverlay.classList.add('flex');
        if(typeof window.playBeep === 'function') { window.playBeep(); setTimeout(window.playBeep, 200); }
        if(window._voiceCoachSpeak || window._speak) { var _prM = { de: 'Neuer persönlicher Rekord! ' + prValue + ' ' + prUnit + '!', en: 'New personal record! ' + prValue + ' ' + prUnit + '!', fr: 'Nouveau record! ' + prValue + ' ' + prUnit + '!', es: 'Nuevo record! ' + prValue + ' ' + prUnit + '!', it: 'Nuovo record! ' + prValue + ' ' + prUnit + '!', nl: 'Nieuw record! ' + prValue + ' ' + prUnit + '!', ar: 'رقم قياسي جديد! ' + prValue + ' ' + prUnit + '!' }; (window._voiceCoachSpeak || window._speak)(_prM[window.currentLang] || _prM.de, 'high'); }
        setTimeout(() => { if(card) card.classList.add('pr-celebration-out'); setTimeout(() => { prOverlay.classList.add('hidden'); prOverlay.classList.remove('flex'); }, 300); }, 2000);
       } else {
        window.showToast(`Neuer PR: ${prValue}${prUnit} bei ${entry.exercise}!`);
        { var _prM2 = { de: 'Neuer Rekord! ' + prValue + ' ' + prUnit + '!', en: 'New record! ' + prValue + ' ' + prUnit + '!' }; (window._voiceCoachSpeak || window._speak)(_prM2[window.currentLang] || _prM2.de, 'high'); }
       }
      }, 500); 
     } else {
      window.showToast(window.t("toastSaved"));
      if(typeof window.startRestCountdown === 'function') window.startRestCountdown(window.selectedRestTime);
      if (entry.category === 'strength' && entry.setDetails && entry.setDetails.length > 0) { var _lastSet = entry.setDetails[entry.setDetails.length - 1]; var _r = _lastSet.reps || 0; var _w = _lastSet.weight || 0; var _sn = entry.setDetails.length; var _vm = { de: _r + ' Wiederholungen mit ' + _w + ' Kilo. Satz ' + _sn + ' gespeichert!', en: _r + ' reps at ' + _w + ' kilos. Set ' + _sn + ' saved!', fr: _r + ' repetitions a ' + _w + ' kilos. Serie ' + _sn + '!', es: _r + ' repeticiones con ' + _w + ' kilos. Serie ' + _sn + '!', it: _r + ' ripetizioni a ' + _w + ' chili. Serie ' + _sn + '!', nl: _r + ' herhalingen met ' + _w + ' kilo. Set ' + _sn + '!', ar: _r + ' تكرار بوزن ' + _w + ' كيلو. مجموعة ' + _sn + '!' }; (window._voiceCoachSpeak || window._speak)(_vm[window.currentLang] || _vm.de); }
     }
    }
    
    window.saveWorkoutsForCurrentClient(); 
    window.renderTable(); 
    window.calculateReadiness();
    if(document.getElementById('prDashboardSection') && !document.getElementById('prDashboardSection').classList.contains('hidden')) { window.renderPRDashboard(); } 
    window.cancelEdit();
    if(window.syncToCloud) window.syncToCloud(entry);
    window._checkAuthSkippedBanner();
    if (window._checkKiDiscovery) setTimeout(function() { window._checkKiDiscovery('workout-saved'); }, 2000);
    // Routine: advance to next exercise or offer save
    if (window._routineQueue) {
     window._advanceRoutineAfterSave(entry);
    } else if (!window.editingWorkoutId && entry.category === 'strength' && entry.setDetails && entry.setDetails.length > 0) {
     setTimeout(function() { if (window._showWorkoutComparison) window._showWorkoutComparison(entry); }, 500);
    }
    // Achievements + Milestones (Feedback + Routine-Speichern NUR bei "Training beenden")
    if (!window.editingWorkoutId) {
     setTimeout(function() { if (window._checkAchievements) window._checkAchievements(); }, 1200);
     setTimeout(function() { if (window._checkMilestones) window._checkMilestones(); }, 1500);
    }
    // Update "Training beenden" Button
    var _endBtn = document.getElementById('endSessionBtn');
    if (_endBtn) {
     var _today = new Date().toISOString().split('T')[0];
     var _allW = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
     var _todayCount = _allW.filter(function(w) { return w.date === _today; }).length;
     _endBtn.textContent = 'Training beenden (' + _todayCount + ' \u00dcbungen)';
     _endBtn.style.display = '';
    }
   } catch (err) { 
    console.error("Speicher-Fehler:", err); 
    window.showToast(window.t("toastError") + ": " + err.message); 
   }
  };

  window._saveCurrentSet = function() {
   var sInput = document.getElementById('setsInput');
   var totalSets = sInput ? parseInt(sInput.value) : 1;
   if (totalSets <= 1 || window.currentCategory !== 'strength') { window.saveWorkout(); return; }
   var n = window._currentSetIndex + 1;
   var rEl = document.getElementById('wdh_s' + n);
   var wEl = document.getElementById('weight_s' + n);
   var rirEl = document.getElementById('rir_s' + n);
   var reps = rEl ? parseFloat(String(rEl.value).replace(',', '.')) : NaN;
   var weight = wEl ? parseFloat(String(wEl.value).replace(',', '.')) : 0;
   var rir = (rirEl && rirEl.value !== '') ? parseInt(rirEl.value) : null;
   var _stEl2 = document.getElementById('setType_s' + n); var _st2 = _stEl2 ? _stEl2.value : 'normal';
   if (isNaN(reps) || reps <= 0) { window.showToast(window.t('enterReps', 'Bitte Wiederholungen eingeben')); return; }
   var _setData = { reps: reps, weight: weight || 0, rir: (rir !== null && !isNaN(rir)) ? rir : null };
   if (_st2 !== 'normal') _setData.type = _st2;
   window._savedSets.push(_setData);
   // Auto-start workout timer on first set
   if (window._currentSetIndex === 0 && window._savedSets.length === 1 && !window.isWorkoutTimerRunning) {
    if (typeof window.toggleWorkoutTimer === 'function') window.toggleWorkoutTimer();
   }
   var setRow = rEl ? rEl.closest('.p-3\\.5') : null;
   if (setRow) {
    setRow.style.opacity = '0.45';
    setRow.style.borderColor = 'rgba(163,201,168,0.3)';
    setRow.querySelectorAll('input,button').forEach(function(el) { el.style.pointerEvents = 'none'; });
    var badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;top:8px;right:12px;font-size:10px;font-weight:800;color:var(--primary-hex);text-transform:uppercase;letter-spacing:0.5px';
    badge.textContent = '\u2713';
    setRow.style.position = 'relative';
    setRow.appendChild(badge);
   }
   window._currentSetIndex++;
   if (window._currentSetIndex < totalSets) {
    if (typeof window.startRestCountdown === 'function') window.startRestCountdown(window.selectedRestTime);
    window.showToast(window.t('setSaved', 'Satz') + ' ' + n + ' \u2713 \u2014 ' + (totalSets - window._currentSetIndex) + ' ' + window.t('setsRemaining', 'übrig'));
    if (n === 1 && window._showAutoRegSuggestion && window._isAutoRegEnabled && window._isAutoRegEnabled()) { var _exName = (document.getElementById('exerciseInput') || {}).value || ''; window._showAutoRegSuggestion(_exName, { reps: reps, weight: weight, rir: rir, setNumber: 1 }); }
    if (window._liveVoiceAfterSet) { var _lvEx = (document.getElementById('exerciseInput') || {}).value || ''; window._liveVoiceAfterSet(_lvEx, n, totalSets, { reps: reps, weight: weight, rir: rir }); }
    var nextInput = document.getElementById('wdh_s' + (n + 1));
    if (nextInput) setTimeout(function() { nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
   } else {
    window.showToast(window.t('lastSet', 'Letzter Satz! Wird gespeichert...'));
    window._pendingSavedSets = window._savedSets;
    window._savedSets = [];
    window._currentSetIndex = 0;
    window.saveWorkout();
   }
  };

  // === TRAINING BEENDEN ===
  window._endTrainingSession = function() {
   var today = new Date().toISOString().split('T')[0];
   var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
   var todaysWorkouts = allWorkouts.filter(function(w) { return w.date === today; });
   if (todaysWorkouts.length === 0) { window.showToast('Kein Training gespeichert heute'); return; }
   // Session-Stats Toast
   var totalSets = 0; var totalVolume = 0;
   todaysWorkouts.forEach(function(w) { (w.setDetails || []).filter(function(s) { return !s.type || s.type !== 'warmup'; }).forEach(function(s) { totalSets++; totalVolume += ((parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0)); }); });
   window.showToast('\ud83d\udcaa ' + todaysWorkouts.length + ' \u00dcbungen \u00b7 ' + totalSets + ' S\u00e4tze \u00b7 ' + (totalVolume >= 1000 ? (totalVolume / 1000).toFixed(1) + 'k' : Math.round(totalVolume)) + ' kg');
   // 1. Feedback-Modal
   if (window._showPostWorkoutFeedback) { window._showPostWorkoutFeedback(); }
   // 2. Routine-Angebot (verzögert)
   setTimeout(function() {
    var kraftWorkouts = todaysWorkouts.filter(function(w) { return w.category === 'strength'; });
    if (kraftWorkouts.length >= 2 && window._offerSaveAsRoutine) {
     var routines = JSON.parse(localStorage.getItem('base_routines') || '[]');
     var todayExercises = kraftWorkouts.map(function(w) { return w.exercise; }).sort().join(',');
     var alreadySaved = routines.some(function(r) { return (r.exercises || []).map(function(e) { return e.name || e.exercise; }).sort().join(',') === todayExercises; });
     if (!alreadySaved) window._offerSaveAsRoutine(kraftWorkouts[kraftWorkouts.length - 1]);
    }
   }, 2000);
   // 3. Pump/Soreness Rating
   setTimeout(function() { if (window._showPumpSorenessRating) window._showPumpSorenessRating(); }, 4000);
  };

  window.cancelEdit = () => { window._currentSetIndex = 0; window._savedSets = []; window._pendingSavedSets = null; const savedDate = document.getElementById('dateInput').value; window.editingWorkoutId = null; document.getElementById('workoutForm').reset(); document.getElementById('dateInput').value = savedDate; if (window.currentCategory === 'strength') { const sInput = document.getElementById('setsInput'); if (sInput) { sInput.value = 3; var _d = document.getElementById('setCountDisplay'); if(_d) _d.textContent = 3; window.generateSetFields(3); } } document.getElementById('btnSaveText').innerHTML = (i18nData[window.currentLang] && i18nData[window.currentLang].fSave) || "Speichern"; document.getElementById('btnSubmitWorkout').classList.replace('bg-primary', 'bg-primary'); document.getElementById('btnSubmitIcon').classList.replace('fill-white/20', 'fill-black/20'); document.getElementById('btnSubmitWorkout').classList.replace('text-white', 'text-black'); document.getElementById('btnCancelEdit').classList.add('hidden'); };
  window.editEntry = (id) => { const w = window.workouts.find(x => x.id === id); if(!w) return; if(window.currentCategory !== w.category) window.switchCategory(w.category); window.editingWorkoutId = id; document.getElementById('dateInput').value = w.date; document.getElementById('exerciseInput').value = w.exercise; if (w.category === 'strength') { const sInput = document.getElementById('setsInput'); if(sInput && w.setDetails) { sInput.value = w.setDetails.length || 3; var _d2 = document.getElementById('setCountDisplay'); if(_d2) _d2.textContent = sInput.value; window.generateSetFields(sInput.value); setTimeout(() => { w.setDetails.forEach((s, idx) => { const i = idx + 1; const rEl = document.getElementById(`wdh_s${i}`); const wEl = document.getElementById(`weight_s${i}`); if(rEl) rEl.value = s.reps; if(wEl) wEl.value = s.weight; }); }, 50); } const eqInput = document.getElementById('equipmentInput'); if(eqInput && w.equipment) eqInput.value = w.equipment; } else { if(window.categorySchemas[w.category] && window.categorySchemas[w.category].schema) { window.categorySchemas[w.category].schema.forEach(field => { const el = document.getElementById('dyn_' + field.id); if(el && w.data[field.label] !== undefined) { el.value = w.data[field.label]; } }); } } document.getElementById('btnSaveText').textContent = "Update"; document.getElementById('btnSubmitWorkout').classList.replace('bg-primary', 'bg-primary'); document.getElementById('btnSubmitIcon').classList.replace('fill-black/20', 'fill-white/20'); document.getElementById('btnSubmitWorkout').classList.replace('text-black', 'text-white'); document.getElementById('btnCancelEdit').classList.remove('hidden'); document.getElementById('workoutForm').scrollIntoView({behavior: 'smooth'}); };
  window.deleteEntry = id => { window.showModal("Löschen?", "Diesen Eintrag wirklich löschen?", true, () => { const deleted = window.workouts.find(w => w.id === id); window.workouts = window.workouts.filter(w => w.id !== id); window.saveWorkoutsForCurrentClient(); window.renderTable(); window.calculateReadiness(); if(window.currentView === 'chart') window.initAnalytics(); if(deleted) { window._undoDeletedCloudId = id; window.showToast('Eintrag gelöscht', null, 'Rückgängig', () => { window.workouts.push(deleted); window.saveWorkoutsForCurrentClient(); window.renderTable(); window.calculateReadiness(); if(window.currentView === 'chart') window.initAnalytics(); if(window.syncToCloud) window.syncToCloud(deleted); window._undoDeletedCloudId = null; window.showToast('Wiederhergestellt!'); }, 5000); setTimeout(() => { if(window._undoDeletedCloudId === id && window.removeFromCloud) { window.removeFromCloud(id); window._undoDeletedCloudId = null; } }, 5500); } else { if(window.removeFromCloud) window.removeFromCloud(id); } }); };

  window.archiveWorkouts = () => { if(!Array.isArray(window.workouts)) return; const activeWorkouts = window.workouts.filter(w => !w.archived); if(activeWorkouts.length === 0) return window.showToast("Nichts zum Beenden da!"); let durationStr = document.getElementById('workoutTimerDisplay').textContent; if (durationStr === "00:00" && !window.isWorkoutTimerRunning) durationStr = ""; const totalDurationSecs = window.workoutTimerSeconds || 0; window.showModal("Workout Beenden", `Dauer: ${durationStr}. Notiz hinzufügen?`, true, async (commentVal) => { if(window.isWorkoutTimerRunning) window.toggleWorkoutTimer(); window.resetWorkoutTimer(); const sessionId = Date.now().toString(); let sessionVolume = 0; let sessionDist = 0; let isCardio = false; let exerciseNames = new Set(); activeWorkouts.forEach(w => { w.archived = true; w.sessionId = sessionId; if(durationStr) w.sessionDuration = durationStr; if(totalDurationSecs > 0) w.workoutDuration = totalDurationSecs; if(commentVal && commentVal.trim() !== '') w.sessionComment = commentVal.trim(); if(w.volume) sessionVolume += w.volume; if(w.category === 'cardio' && w.data) { isCardio = true; if(w.data['Distanz (km)'] || w.data['Distanz']) sessionDist += parseFloat((w.data['Distanz (km)'] || w.data['Distanz']).toString().replace(',','.')); } if(w.exercise) exerciseNames.add(w.exercise); }); window.saveWorkoutsForCurrentClient(); window.switchView('archive'); window.calculateReadiness(); window.showToast(window.t("toastArchived")); if (window._checkKiDiscovery) setTimeout(function() { window._checkKiDiscovery('workout-archived'); }, 3500); let durationDisplay = ''; if(totalDurationSecs > 0) { if(totalDurationSecs < 3600) durationDisplay = Math.floor(totalDurationSecs/60) + ' MIN'; else durationDisplay = Math.floor(totalDurationSecs/3600) + ':' + String(Math.floor((totalDurationSecs%3600)/60)).padStart(2,'0') + ' STD'; } window.showWorkoutCelebration({ mainNumber: isCardio ? sessionDist.toFixed(1) + ' km' : (sessionVolume > 0 ? Math.round(sessionVolume).toLocaleString() + ' kg' : activeWorkouts.length + 'x'), mainUnit: isCardio ? 'Distanz' : (sessionVolume > 0 ? 'Volumen' : 'Übungen'), subText: (durationDisplay ? durationDisplay + ' · ' : durationStr ? durationStr + ' · ' : '') + exerciseNames.size + ' Übungen', hasPR: false }); window._lastWorkoutBrag = { category: window.currentCategory === 'strength' ? 'Krafttraining' : window.currentCategory === 'cardio' ? 'Ausdauer' : window.currentCategory === 'recovery' ? 'Regeneration' : 'Training', duration: durationDisplay || durationStr || 'Beendet', exercises: String(activeWorkouts.length || 0), sets: String(activeWorkouts.reduce(function(sum, w) { return sum + (w.setDetails ? w.setDetails.length : 1); }, 0)), volume: String(Math.round(sessionVolume || 0)), exerciseList: activeWorkouts.slice(0, 6).map(function(w) { var detail = ''; if(w.setDetails && w.setDetails.length > 0) { detail = w.setDetails.length + ' Sets'; if(w.setDetails[0].weight) detail += ' \u00d7 ' + w.setDetails[0].weight + 'kg'; } else if(w.data) { var keys = Object.keys(w.data).slice(0, 2); detail = keys.map(function(k) { return k + ': ' + w.data[k]; }).join(' | '); } return { name: w.exercise || 'Übung', detail: detail }; }) }; setTimeout(() => { let exString = Array.from(exerciseNames).join(', '); if(exString.length > 50) exString = exString.substring(0, 47) + '...'; window.showBragCard('workout', { duration: durationDisplay || durationStr || 'Beendet', volume: sessionVolume, distance: sessionDist.toFixed(2), category: isCardio ? 'cardio' : 'strength', exercises: exString }); }, 3500); if(window.syncToCloud) { for(const w of activeWorkouts) await window.syncToCloud(w); } if(window._updateChallengeProgress) window._updateChallengeProgress(); if(window._pushUpdateTrainingStats) window._pushUpdateTrainingStats(); if(window._postWorkoutToFeed) { activeWorkouts.forEach(function(w) { window._postWorkoutToFeed(w); }); } if(window._triggerPostWorkoutNutrition && activeWorkouts.length > 0) { setTimeout(function() { window._triggerPostWorkoutNutrition(activeWorkouts[0]); }, 2000); } window.checkReviewPrompt(); window.showPostWorkoutSocialProof(); if(window.awardXP) window.awardXP('workout'); if(window._processReferralReward) window._processReferralReward(); if(window._checkGoalProgress) window._checkGoalProgress(); if(window._trackActivity) window._trackActivity('workout'); if(localStorage.getItem('base_anon_challenge_id') && !(window._chGetUid && window._chGetUid() && !window._chGetUid().startsWith('anon_'))) { var cnt = parseInt(localStorage.getItem('base_anon_workout_count') || '0') + 1; localStorage.setItem('base_anon_workout_count', cnt.toString()); } { var _vcS = window._voiceCoachSpeak || window._speak; if (_vcS) { var _eM = { de: 'Workout beendet! ' + (exerciseNames ? exerciseNames.size : 0) + ' Übungen, ' + Math.round(sessionVolume || 0) + ' Kilo Volumen. Starke Leistung!', en: 'Workout complete! ' + (exerciseNames ? exerciseNames.size : 0) + ' exercises, ' + Math.round(sessionVolume || 0) + ' kilos volume. Great work!', fr: 'Entrainement termine! ' + (exerciseNames ? exerciseNames.size : 0) + ' exercices. Beau travail!', es: 'Entrenamiento completo! ' + (exerciseNames ? exerciseNames.size : 0) + ' ejercicios. Gran trabajo!', it: 'Allenamento completato! ' + (exerciseNames ? exerciseNames.size : 0) + ' esercizi. Ottimo lavoro!', nl: 'Workout voltooid! ' + (exerciseNames ? exerciseNames.size : 0) + ' oefeningen. Goed gedaan!', ar: 'انتهى التمرين! ' + (exerciseNames ? exerciseNames.size : 0) + ' تمارين. عمل رائع!' }; _vcS(_eM[window.currentLang] || _eM.de, 'high'); } } setTimeout(function() { if (window._showPostWorkoutCoachNudge) { window._showPostWorkoutCoachNudge({ exercises: String(exerciseNames ? exerciseNames.size : 0), volume: String(Math.round(sessionVolume || 0)), duration: durationDisplay || durationStr || '' }); } }, 5000); if (window._showJournalPrompt) window._showJournalPrompt(sessionId, exerciseNames ? exerciseNames.size : 0); if (window._showEfficiencyScore) window._showEfficiencyScore(activeWorkouts); if (window._showCalorieSummary) window._showCalorieSummary(activeWorkouts); }, true); };
  window._checkAnonConversion = function() {
   var anonId = localStorage.getItem('base_anon_challenge_id');
   if(!anonId) return;
   if(window._chGetUid && window._chGetUid() && !window._chGetUid().startsWith('anon_')) return;
   var count = parseInt(localStorage.getItem('base_anon_workout_count') || '0');
   if(count < 3) return;
   if(window._anonConversionShown) return;
   window._anonConversionShown = true;
   setTimeout(function() {
    var overlay = document.createElement('div');
    overlay.id = 'anonConversionOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:960;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(8px)';
    overlay.innerHTML = '<div style="background:#18181b;border:1px solid rgba(6,182,212,0.2);border-radius:var(--ui-radius,1rem);padding:1.5rem;max-width:340px;width:100%;text-align:center">' +
     '<div style="font-size:32px;margin-bottom:8px">\uD83D\uDD25</div>' +
     '<h3 style="color:#fff;font-size:16px;font-weight:900;margin:0 0 8px 0">Du trainierst wie ein Profi!</h3>' +
     '<p style="color:#a1a1aa;font-size:12px;margin:0 0 20px 0;line-height:1.5">Erstelle einen kostenlosen Account um deinen Fortschritt zu sichern und alle KI-Features freizuschalten.</p>' +
     '<button id="anonConvertBtn" style="width:100%;padding:14px;background:#06b6d4;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;margin-bottom:8px">Account erstellen</button>' +
     '<button id="anonConvertLater" style="width:100%;padding:10px;background:transparent;color:#52525b;border:none;font-size:11px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:0.1em">Sp\u00e4ter</button>' +
     '</div>';
    document.body.appendChild(overlay);
    document.getElementById('anonConvertBtn').onclick = function() {
     overlay.remove();
     window.toggleModal('authModal');
    };
    document.getElementById('anonConvertLater').onclick = function() {
     overlay.remove();
    };
    overlay.addEventListener('click', function(e) { if(e.target === overlay) overlay.remove(); });
   }, 1500);
  };

  window.checkFirstWorkoutBanner = function() {
   if(localStorage.getItem('base_onboarding_done')) return;
   if(!Array.isArray(window.workouts)) return;
   const archived = window.workouts.filter(w => w.archived);
   const banner = document.getElementById('firstWorkoutBanner');
   if(!banner) return;
   if(archived.length === 0) { banner.classList.remove('hidden'); }
   else { banner.classList.add('hidden'); localStorage.setItem('base_onboarding_done', 'true'); }
  };
  window.startFirstWorkout = function() {
   document.getElementById('firstWorkoutBanner')?.classList.add('hidden');
   window.switchCategory('strength');
   var archived = (window.workouts || []).filter(function(w) { return w.archived; });
   if(archived.length === 0) {
    var setsInput = document.getElementById('setsInput');
    if(setsInput) { setsInput.value = '1'; window.generateSetFields(1); }
   }
   setTimeout(function() {
    var exInput = document.getElementById('exerciseInput');
    if(exInput) { exInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function() { exInput.focus(); }, 300); }
   }, 200);
  };
  window._checkFirstWorkoutComplete = function() {
   if(localStorage.getItem('base_onboarding_done')) return;
   if(!Array.isArray(window.workouts)) return;
   const active = window.workouts.filter(w => !w.archived);
   if(active.length === 1) {
    localStorage.setItem('base_onboarding_done', 'true');
    document.getElementById('firstWorkoutBanner')?.classList.add('hidden');
    window.showToast('Erstes Workout getrackt! &#127881;', 'success');
   }
  };

  window.checkAnonRegisterBanner = function() {
   var banner = document.getElementById('anonRegisterBanner');
   if(!banner) return;
   if(!window._firebaseAuth || !window._firebaseAuth.currentUser || !window._firebaseAuth.currentUser.isAnonymous) { banner.classList.add('hidden'); return; }
   var archived = Array.isArray(window.workouts) ? window.workouts.filter(function(w) { return w.archived; }).length : 0;
   if(archived < 2) { banner.classList.add('hidden'); return; }
   var dismissed = localStorage.getItem('base_anon_banner_dismissed');
   if(dismissed) {
    var dismissedDate = new Date(dismissed);
    var now = new Date();
    if(now - dismissedDate < 7 * 24 * 60 * 60 * 1000) { banner.classList.add('hidden'); return; }
   }
   banner.classList.remove('hidden');
  };
  window.dismissAnonBanner = function() {
   localStorage.setItem('base_anon_banner_dismissed', new Date().toISOString());
   var banner = document.getElementById('anonRegisterBanner');
   if(banner) banner.classList.add('hidden');
  };

  window.showSocialProof = async function() {
   const bar = document.getElementById('socialProofBar');
   const text = document.getElementById('socialProofText');
   if(!bar || !text) return;
   try {
    if(!window._fbDb || !window._fbGetDoc || !window._fbDoc) { bar.classList.add('hidden'); return; }
    const statsRef = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'public', 'stats');
    const snap = await window._fbGetDoc(statsRef);
    if(snap.exists() && snap.data().userCount && snap.data().userCount >= 50) {
     text.textContent = snap.data().userCount + ' Athleten trainieren mit BASE';
     bar.classList.remove('hidden'); bar.classList.add('flex');
    } else { bar.classList.add('hidden'); }
   } catch(e) { bar.classList.add('hidden'); }
  };
  window.showPostWorkoutSocialProof = function() {
  };

  window.checkReviewPrompt = function() {
   if(localStorage.getItem('base_review_dismissed_permanent')) return;
   if(!Array.isArray(window.workouts)) return;
   const archived = window.workouts.filter(w => w.archived).length;
   const lastPromptCount = parseInt(localStorage.getItem('base_review_workout_count') || '0');
   const prompted = localStorage.getItem('base_review_prompted');
   if(!prompted && archived >= 5) {
    window._showReviewBanner();
    localStorage.setItem('base_review_prompted', 'true');
    localStorage.setItem('base_review_workout_count', archived);
   } else if(prompted && archived >= lastPromptCount + 10) {
    window._showReviewBanner();
    localStorage.setItem('base_review_workout_count', archived);
   }
  };
  window._showReviewBanner = function() {
   const banner = document.getElementById('reviewPromptBanner');
   if(banner) banner.classList.remove('hidden');
  };
  window.handleReviewAction = function() {
   document.getElementById('reviewPromptBanner')?.classList.add('hidden');
   localStorage.setItem('base_review_dismissed_permanent', 'true');
   if(navigator.share) {
    navigator.share({ title: 'BASE Fitness App', text: 'Probier BASE aus - die beste Fitness App!', url: 'https://base-app.tech' });
   } else {
    navigator.clipboard.writeText('https://base-app.tech').then(() => window.showToast(window.t('toastCopied')));
   }
  };
  window.dismissReview = function() {
   document.getElementById('reviewPromptBanner')?.classList.add('hidden');
   localStorage.setItem('base_review_workout_count', window.workouts.filter(w => w.archived).length);
  };

  let _celebTimeout = null;
  window.showWorkoutCelebration = function(data) {
   const modal = document.getElementById('workoutCelebrationModal');
   if(!modal) return;
   const colors = ['#06b6d4','#f59e0b','#10b981','#8b5cf6','#f43f5e'];
   let confettiHtml = '';
   for(let i = 0; i < 22; i++) {
    const left = Math.random() * 100;
    const delay = (Math.random() * 2).toFixed(1);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 4 + Math.random() * 5;
    confettiHtml += `<div class="confetti-piece" style="left:${left}%;top:-10px;background:${color};width:${size}px;height:${size}px;animation-delay:${delay}s"></div>`;
   }
   const numEl = document.getElementById('celebNumber');
   const unitEl = document.getElementById('celebUnit');
   const subEl = document.getElementById('celebSub');
   const prEl = document.getElementById('celebPR');
   if(numEl) numEl.textContent = data.mainNumber;
   if(unitEl) unitEl.textContent = data.mainUnit;
   if(subEl) subEl.textContent = data.subText;
   if(prEl) { if(data.hasPR) prEl.classList.remove('hidden'); else prEl.classList.add('hidden'); }
   modal.innerHTML = confettiHtml + modal.querySelector('.text-center').outerHTML.replace('class="text-center', 'class="text-center relative z-10');
   const centerDiv = document.createElement('div');
   centerDiv.className = 'text-center relative z-10 pointer-events-none';
   centerDiv.innerHTML = `<p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">${window.t('workoutDone','Workout abgeschlossen!')}</p><p class="celeb-number text-6xl font-black text-white" style="font-family:'Bebas Neue','Barlow Condensed',sans-serif;letter-spacing:-0.02em">${window._escapeHtml(data.mainNumber)}</p><p class="text-sm font-bold text-zinc-400 mt-1">${window._escapeHtml(data.mainUnit)}</p><p class="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-3">${window._escapeHtml(data.subText)}</p>${data.hasPR ? '<div class="mt-4 inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 px-4 py-2 rounded-xl animate-pulse"><span class="text-amber-400 text-xs font-black uppercase tracking-widest">' + window.t('lblNewPR','Neuer PR!') + '</span></div>' : ''}`;
   modal.innerHTML = confettiHtml;
   modal.appendChild(centerDiv);
   modal.classList.remove('hidden');
   modal.classList.add('flex');
   _celebTimeout = setTimeout(() => window._dismissCelebration(), 3000);
  };
  window._dismissCelebration = function() {
   clearTimeout(_celebTimeout);
   const modal = document.getElementById('workoutCelebrationModal');
   if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
   if (typeof window._showDay2Hook === 'function') window._showDay2Hook();
   window._showPostWorkoutChallengeNudge();
   if(window._checkAnonConversion) window._checkAnonConversion();
   setTimeout(function() { if (window._triggerSportNudge) window._triggerSportNudge(); }, 2000);
  };

  window._showPostWorkoutChallengeNudge = function() {
   if(!window._chList || !window._chGetUid) return;
   var myUid = window._chGetUid();
   if(!myUid) return;
   window._chList(function(all) {
    var now = new Date();
    var activeChallenge = null;
    all.forEach(function(ch) {
     if(new Date(ch.endDate) < now) return;
     var parts = ch.participants || [];
     if(parts.some(function(p) { return p.uid === myUid; })) { if(!activeChallenge) activeChallenge = ch; }
    });
    if(!activeChallenge) return;
    var metricUnit = { volume: 'kg', weight: 'kg', distance: 'km', reps: 'Wdh', time: 'min' };
    var unit = metricUnit[activeChallenge.metric] || activeChallenge.metric || '';
    window.showToast('Dein Workout zählt für "' + activeChallenge.title + '"!', null, 'Fortschritt +', function() {
     window.addChallengeProgress(activeChallenge.id, unit);
    }, 6000);
   });
  };

  window._showPostWorkoutCoachNudge = async function(workoutData) {
   var today = new Date().toISOString().split('T')[0];
   var lastNudge = localStorage.getItem('base_coach_nudge_date');
   if (lastNudge === today) return;
   var archived = (window.workouts || []).filter(function(w) { return w.archived; });
   if (archived.length < 3) return;
   localStorage.setItem('base_coach_nudge_date', today);

   // KI-personalisierten Nudge versuchen
   var msg = '';
   try {
    var profile = window.userProfile || {};
    var prompt = 'Du bist ein motivierender Fitness-Coach. Gib eine kurze, persoenliche Motivationsnachricht (1-2 Saetze, max 80 Zeichen) fuer dieses Workout:\n' +
      'Uebungen: ' + (workoutData.exercises || '?') + '\nDauer: ' + (workoutData.duration || '?') + '\n' +
      'Level: ' + (profile.experience || 'Anfaenger') + '\n' +
      'Antworte auf ' + (window.currentLang === 'en' ? 'Englisch' : 'Deutsch') + '. Kein Hallo, direkt zur Sache. Kurz und energetisch.';
    var res = await fetch('/.netlify/functions/gemini', {
     method: 'POST', headers: {'Content-Type':'application/json'},
     body: JSON.stringify({prompt: prompt, type: 'nudge'})
    });
    if (res.ok) {
     var data = await res.json();
     var txt = window._extractGeminiText(data, '');
     txt = txt.trim().replace(/^["']|["']$/g, '');
     if (txt && txt.length > 5 && txt.length < 120) msg = txt;
    }
   } catch(e) { /* Fallback */ }

   if (!msg) {
    var fallbacks = [
     window.t('coachNudge1', 'Dein KI Coach hat dein Workout analysiert \u2014 tippe fuer Tipps'),
     window.t('coachNudge2', 'Basierend auf deinem Workout: Dein Coach hat Empfehlungen'),
     window.t('coachNudge3', 'Starkes Workout! Dein KI Coach hat Verbesserungsvorschlaege')
    ];
    msg = fallbacks[Math.floor(Math.random() * fallbacks.length)];
   }
   var exerciseCount = workoutData.exercises || '0';
   var duration = workoutData.duration || '';
   var nudge = document.createElement('div');
   nudge.id = 'coachNudgeBar';
   nudge.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;z-index:600;animation:slideUp 0.4s ease';
   nudge.innerHTML = '<div onclick="window._openCoachFromNudge()" class="flex items-center gap-3 p-4 rounded-2xl cursor-pointer pointer-events-auto" style="background:linear-gradient(135deg,rgba(163,201,168,0.15),rgba(163,201,168,0.05));border:1px solid rgba(163,201,168,0.25);backdrop-filter:blur(8px)">' +
    '<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.2)">' +
    '<i data-lucide="sparkles" class="w-5 h-5 pointer-events-none" style="color:var(--primary-hex)"></i></div>' +
    '<div class="flex-1 min-w-0">' +
    '<p class="text-xs font-black text-white truncate">' + window._escapeHtml(msg) + '</p>' +
    '<p class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--primary-hex)">KI Coach' + (duration ? ' \u00b7 ' + window._escapeHtml(duration) : '') + ' \u00b7 ' + window._escapeHtml(exerciseCount) + ' ' + window.t('lblExercises', 'Übungen') + '</p>' +
    '</div>' +
    '<i data-lucide="chevron-right" class="w-4 h-4 flex-shrink-0 pointer-events-none" style="color:var(--primary-hex)"></i>' +
    '</div>';
   var dismiss = document.createElement('button');
   dismiss.setAttribute('aria-label', window.t('btnClose', 'Schliessen'));
   dismiss.className = 'pointer-events-auto';
   dismiss.style.cssText = 'position:absolute;top:8px;right:8px;background:none;border:none;color:#737373;font-size:16px;cursor:pointer;padding:4px;line-height:1';
   dismiss.textContent = '\u2715';
   dismiss.onclick = function(e) { e.stopPropagation(); nudge.style.animation = 'fadeOut 0.3s ease'; setTimeout(function() { nudge.remove(); }, 300); };
   nudge.querySelector('div').appendChild(dismiss);
   document.body.appendChild(nudge);
   window._refreshLucide();
   setTimeout(function() { if (document.getElementById('coachNudgeBar')) { nudge.style.animation = 'fadeOut 0.3s ease'; setTimeout(function() { nudge.remove(); }, 300); } }, 15000);
  };

  window._openCoachFromNudge = function() {
   var nudge = document.getElementById('coachNudgeBar');
   if (nudge) nudge.remove();
   if (window.switchTab) window.switchTab('tools');
   setTimeout(function() {
    if (window.analyzeWithAI) window.analyzeWithAI();
   }, 300);
  };

  // ============================================================
  // SPORT NUDGE SYSTEM
  // ============================================================

  window._SPORT_NUDGE_QUESTIONS = {

    'fu\u00dfball': [
      { emoji:'\u26BD', h:'Schneller in den Sprints?', s:'Explosivit\u00e4ts\u00fcbungen die dich auf dem Platz abheben lassen.' },
      { emoji:'\u26BD', h:'Mehr Ausdauer in der 2. Halbzeit?', s:'Wie Krafttraining deine Ausdauer direkt verbessert.' },
      { emoji:'\u26BD', h:'Richtungswechsel sch\u00e4rfen?', s:'Laterale Kraft und Agilit\u00e4t \u2014 die untersch\u00e4tzten Fu\u00dfball-Skills.' },
      { emoji:'\u26BD', h:'H\u00e4rtere Sch\u00fcsse trainieren?', s:'H\u00fcft- und Core-Kraft f\u00fcr mehr Wucht beim Abschluss.' },
      { emoji:'\u26BD', h:'Kopfball-Kraft verbessern?', s:'Nacken- und Rumpfstabilit\u00e4t f\u00fcr sicheres Kopfballspiel.' },
      { emoji:'\u26BD', h:'Zweik\u00e4mpfe gewinnen?', s:'Kraft und Balance im K\u00f6rperkontakt gezielt aufbauen.' },
      { emoji:'\u26BD', h:'Verletzungen vorbeugen?', s:'Knie- und Sprunggelenk-Stabilit\u00e4t f\u00fcr Fu\u00dfballer.' },
      { emoji:'\u26BD', h:'Sprungkraft beim Kopfball?', s:'Vertikalen Sprung und Absprung-Explosivit\u00e4t trainieren.' },
      { emoji:'\u26BD', h:'Bessere Beschleunigung?', s:'Die ersten 5 Meter entscheiden \u2014 so trainierst du sie.' },
      { emoji:'\u26BD', h:'90 Minuten Vollgas?', s:'Kraftausdauer und Erholung f\u00fcr Fu\u00dfballer optimieren.' }
    ],

    'volleyball': [
      { emoji:'\uD83C\uDFD0', h:'Mehr Sprungkraft beim Volleyball?', s:'Gym-\u00dcbungen die deinen Absprung direkt verbessern.' },
      { emoji:'\uD83C\uDFD0', h:'Reaktionsschneller am Netz?', s:'Koordinations- und Explosivit\u00e4tstraining f\u00fcr Volleyballer.' },
      { emoji:'\uD83C\uDFD0', h:'Schultern verletzungsfrei halten?', s:'Stabilisations\u00fcbungen speziell f\u00fcr Volleyball-Spieler.' },
      { emoji:'\uD83C\uDFD0', h:'Mehr Power beim Aufschlag?', s:'Rotationskraft und Core-Training f\u00fcr mehr Schlagkraft.' },
      { emoji:'\uD83C\uDFD0', h:'Blocksprung verbessern?', s:'Reaktiver Absprung und Armkraft f\u00fcr bessere Blocks.' },
      { emoji:'\uD83C\uDFD0', h:'Annahme stabiler machen?', s:'H\u00fcftstabilit\u00e4t und Balance f\u00fcr tiefe Annahme-Positionen.' },
      { emoji:'\uD83C\uDFD0', h:'Schneller in der Abwehr?', s:'Laterale Schnelligkeit und tiefe Positionen trainieren.' },
      { emoji:'\uD83C\uDFD0', h:'Smash-Kraft steigern?', s:'Schulter und Core f\u00fcr h\u00e4rtere Angriffsschl\u00e4ge.' }
    ],

    'basketball': [
      { emoji:'\uD83C\uDFC0', h:'H\u00f6her springen beim Basketball?', s:'Plyometrics und Explosivkraft f\u00fcr mehr Sprungweite.' },
      { emoji:'\uD83C\uDFC0', h:'Schneller zum Korb?', s:'Erste-Schritt-Explosivit\u00e4t \u2014 so trainierst du sie.' },
      { emoji:'\uD83C\uDFC0', h:'Mehr K\u00f6rperstabilit\u00e4t unter dem Korb?', s:'Kraft und Balance f\u00fcr Duelle in der Zone.' },
      { emoji:'\uD83C\uDFC0', h:'Wurfst\u00e4rke verbessern?', s:'Handgelenk-, Schulter- und Core-Kraft f\u00fcr mehr Pr\u00e4zision.' },
      { emoji:'\uD83C\uDFC0', h:'Schnellerer Richtungswechsel?', s:'Agilit\u00e4t und laterale Kraft f\u00fcr Crossover-Moves.' },
      { emoji:'\uD83C\uDFC0', h:'Defensiv-Stance verbessern?', s:'H\u00fcftkraft und Balance f\u00fcr tiefe Defensivposition.' },
      { emoji:'\uD83C\uDFC0', h:'40 Minuten Vollgas?', s:'Kraftausdauer speziell f\u00fcr Basketballer aufbauen.' }
    ],

    'tennis': [
      { emoji:'\uD83C\uDFBE', h:'Mehr Power beim Aufschlag?', s:'Rotationskraft und Schulter-Stabilit\u00e4t gezielt trainieren.' },
      { emoji:'\uD83C\uDFBE', h:'Schneller an den Ball?', s:'Laterale Beweglichkeit und reaktive Kraft f\u00fcr den Court.' },
      { emoji:'\uD83C\uDFBE', h:'Verletzungen vorbeugen?', s:'Schulter- und Ellbogen-Pr\u00e4vention f\u00fcr Tennis-Spieler.' },
      { emoji:'\uD83C\uDFBE', h:'Mehr Slice-Power?', s:'Unterarm- und Rotationskraft f\u00fcr st\u00e4rkere Slice-Schl\u00e4ge.' },
      { emoji:'\uD83C\uDFBE', h:'Ausdauer \u00fcber 3 S\u00e4tze?', s:'Kraftausdauer und mentale St\u00e4rke f\u00fcr lange Matches.' },
      { emoji:'\uD83C\uDFBE', h:'Return-Reaktion verbessern?', s:'Reaktivkraft und Split-Step-Training f\u00fcr Tennis.' }
    ],

    'handball': [
      { emoji:'\uD83E\uDD3E', h:'Mehr Wurfkraft beim Handball?', s:'Schulter- und Core-\u00dcbungen f\u00fcr deinen Wurf.' },
      { emoji:'\uD83E\uDD3E', h:'Explosiver beim Antritt?', s:'Sprungkraft und erste Schritte im Gym trainieren.' },
      { emoji:'\uD83E\uDD3E', h:'Stabilit\u00e4t im Zweikampf?', s:'K\u00f6rperkraft und Balance f\u00fcr Handball-Duelle.' },
      { emoji:'\uD83E\uDD3E', h:'Sprungwurf verbessern?', s:'Absprung-Explosivit\u00e4t und Wurfkraft kombinieren.' },
      { emoji:'\uD83E\uDD3E', h:'60 Minuten durchhalten?', s:'Kondition und Kraftausdauer f\u00fcr Handballer.' },
      { emoji:'\uD83E\uDD3E', h:'Schultern sch\u00fctzen?', s:'Pr\u00e4vention f\u00fcr wurfbelastete Schultergelenke.' }
    ],

    'hockey': [
      { emoji:'\uD83C\uDFD2', h:'Explosiver beim Hockey?', s:'Lateralkraft und Skating-Power im Gym aufbauen.' },
      { emoji:'\uD83C\uDFD2', h:'Mehr Schuss-Power?', s:'Core-Rotation und Handgelenk-St\u00e4rke f\u00fcr h\u00e4rtere Sch\u00fcsse.' },
      { emoji:'\uD83C\uDFD2', h:'Ausdauer \u00fcber 3 Perioden?', s:'Kraft-Ausdauer speziell f\u00fcr Hockey-Spieler.' },
      { emoji:'\uD83C\uDFD2', h:'Schneller auf dem Eis?', s:'Glutenkraft und explosive Abdr\u00fccke f\u00fcr mehr Speed.' },
      { emoji:'\uD83C\uDFD2', h:'Zweik\u00e4mpfe gewinnen?', s:'K\u00f6rperkraft und Balance f\u00fcr Board-Battles.' }
    ],

    'rugby': [
      { emoji:'\uD83C\uDFC9', h:'St\u00e4rker im Tackle?', s:'Kraft\u00fcbungen die dich im Zweikampf unaufhaltsam machen.' },
      { emoji:'\uD83C\uDFC9', h:'Explosiver beim Antritt?', s:'Power-Training f\u00fcr Rugby-spezifische Schnelligkeit.' },
      { emoji:'\uD83C\uDFC9', h:'Scrums gewinnen?', s:'Bein- und Rumpfkraft f\u00fcr dominierende Scrums.' },
      { emoji:'\uD83C\uDFC9', h:'Weiter werfen?', s:'Schulter- und Rotationskraft f\u00fcr l\u00e4ngere P\u00e4sse.' },
      { emoji:'\uD83C\uDFC9', h:'80 Minuten durchhalten?', s:'Kondition und Kraftausdauer f\u00fcr Rugby-Spieler.' }
    ],

    'klettern': [
      { emoji:'\uD83E\uDDD7', h:'Griffkraft verbessern?', s:'Finger- und Unterarmkraft f\u00fcr schwierigere Routen.' },
      { emoji:'\uD83E\uDDD7', h:'\u00dcberh\u00e4nge meistern?', s:'Core-Kraft und Zugst\u00e4rke f\u00fcr steile W\u00e4nde.' },
      { emoji:'\uD83E\uDDD7', h:'Schultern sch\u00fctzen?', s:'Rotatorenmanschette und Stabilit\u00e4t f\u00fcr Kletterer.' },
      { emoji:'\uD83E\uDDD7', h:'Dynamische Moves trainieren?', s:'Explosivit\u00e4t und Koordination f\u00fcr Dynos.' },
      { emoji:'\uD83E\uDDD7', h:'Ausdauer an der Wand?', s:'Kraftausdauer speziell f\u00fcr Kletterer aufbauen.' }
    ],

    '_default': [
      { emoji:'\uD83C\uDFAF', h:'Besser werden in SPORT?', s:'Die KI empfiehlt spezifische Gym-\u00dcbungen f\u00fcr deine Sportart.' },
      { emoji:'\uD83D\uDCAA', h:'Athletischer f\u00fcr SPORT werden?', s:'Sport-spezifisches Krafttraining \u2014 was wirklich hilft.' },
      { emoji:'\uD83C\uDFC6', h:'Performance-Boost f\u00fcr SPORT?', s:'Gezielte \u00dcbungen die deinen Sport direkt verbessern.' },
      { emoji:'\u26A1', h:'Explosiver in SPORT?', s:'Kraft und Schnelligkeit \u2014 die Kombination die Athleten formt.' },
      { emoji:'\uD83D\uDEE1', h:'Verletzungsfrei in SPORT bleiben?', s:'Pr\u00e4vention und Stabilit\u00e4t f\u00fcr deine Sportart.' }
    ]
  };

  window._shouldShowSportNudge = function() {
    if (localStorage.getItem('base_sport_nudge_disabled') === 'true') return false;
    var lastShown = localStorage.getItem('base_sport_nudge_last');
    if (lastShown) {
      var diff = Date.now() - parseInt(lastShown);
      if (diff < 86400000) return false;
    }
    var archived = (window.workouts || []).filter(function(w) { return w.archived; });
    if (archived.length === 0) return false;
    var latest = archived[archived.length - 1];
    if (!latest || latest.category === 'strength') return false;
    if (!latest.exercise) return false;
    return true;
  };

  window._getSportNudgeQuestion = function(sportName) {
    var lower = (sportName || '').toLowerCase().trim();
    var questions = null;
    var keys = Object.keys(window._SPORT_NUDGE_QUESTIONS);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === '_default') continue;
      if (lower.indexOf(keys[i]) !== -1 || keys[i].indexOf(lower) !== -1) {
        questions = window._SPORT_NUDGE_QUESTIONS[keys[i]];
        break;
      }
    }
    if (!questions) questions = window._SPORT_NUDGE_QUESTIONS['_default'];
    var idx = Math.floor(Math.random() * questions.length);
    var q = Object.assign({}, questions[idx]);
    if (q.h) q.h = q.h.replace(/SPORT/g, sportName || 'deinem Sport');
    if (q.s) q.s = q.s.replace(/SPORT/g, sportName || 'deinem Sport');
    return q;
  };

  window._renderSportNudge = function(sportName) {
    var existing = document.getElementById('sportNudgePopup');
    if (existing) existing.remove();
    var q = window._getSportNudgeQuestion(sportName);
    localStorage.setItem('base_sport_nudge_last', String(Date.now()));

    var popup = document.createElement('div');
    popup.id = 'sportNudgePopup';
    popup.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;z-index:600;animation:slideUp 0.4s ease';
    popup.innerHTML =
      '<div class="rounded-2xl pointer-events-auto" style="background:linear-gradient(135deg,rgba(232,200,106,0.12),rgba(232,200,106,0.04));border:1px solid rgba(232,200,106,0.25);backdrop-filter:blur(12px);padding:16px">' +
      '<div style="display:flex;align-items:flex-start;gap:12px">' +
      '<span style="font-size:28px;flex-shrink:0;margin-top:2px">' + q.emoji + '</span>' +
      '<div style="flex:1;min-width:0">' +
      '<p style="font-size:14px;font-weight:800;color:var(--text-main);margin-bottom:4px">' + window._escapeHtml(q.h) + '</p>' +
      '<p style="font-size:11px;color:var(--text-muted);line-height:1.5">' + window._escapeHtml(q.s) + '</p>' +
      '</div>' +
      '<button onclick="document.getElementById(\'sportNudgePopup\').remove()" class="pointer-events-auto" aria-label="' + window.t('btnClose', 'Schliessen') + '" style="background:none;border:none;color:#737373;font-size:16px;cursor:pointer;flex-shrink:0;padding:0;line-height:1">\u2715</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button onclick="window._openSportNudgeCoach(\'' + window._escapeHtml(sportName || '') + '\')" class="pointer-events-auto" aria-label="KI fragen" style="flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;background:color-mix(in srgb,#e8c86a,transparent 85%);border:1px solid color-mix(in srgb,#e8c86a,transparent 60%);color:#e8c86a">\u2728 KI fragen</button>' +
      '<button onclick="document.getElementById(\'sportNudgePopup\').remove()" class="pointer-events-auto" aria-label="Sp\u00e4ter" style="padding:10px 16px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">Sp\u00e4ter</button>' +
      '</div>' +
      '<button onclick="window._setSportNudgeEnabled(false);var _sn=document.getElementById(\'sportNudgePopup\');if(_sn)_sn.remove()" class="pointer-events-auto" aria-label="Nicht mehr anzeigen" style="display:block;width:100%;margin-top:8px;padding:4px;background:none;border:none;cursor:pointer;font-size:10px;color:var(--text-muted);text-align:center">Nicht mehr anzeigen</button>' +
      '</div>';
    document.body.appendChild(popup);
    setTimeout(function() { var el = document.getElementById('sportNudgePopup'); if (el) { el.style.animation = 'fadeOut 0.3s ease'; setTimeout(function() { el.remove(); }, 300); } }, 20000);
  };

  window._openSportNudgeCoach = function(sport) {
    var el = document.getElementById('sportNudgePopup');
    if (el) el.remove();
    if (window.switchTab) window.switchTab('tools');
    setTimeout(function() {
      if (window.analyzeWithAI) window.analyzeWithAI();
    }, 300);
  };

  window._setSportNudgeEnabled = function(enabled) {
    localStorage.setItem('base_sport_nudge_disabled', enabled ? 'false' : 'true');
    window.showToast(enabled ? '\u2705 Sport-Tipps aktiviert' : '\uD83D\uDD15 Sport-Tipps deaktiviert', null, null, null, 3000);
    var btn = document.getElementById('sportNudgeToggle');
    if (btn) {
      btn.textContent = enabled ? 'An' : 'Aus';
      btn.style.color = enabled ? 'var(--primary-hex)' : 'var(--text-muted)';
    }
  };

  window._isSportNudgeEnabled = function() {
    return localStorage.getItem('base_sport_nudge_disabled') !== 'true';
  };

  window._triggerSportNudge = function() {
    if (!window._shouldShowSportNudge()) return;
    var archived = (window.workouts || []).filter(function(w) { return w.archived; });
    var latest = archived[archived.length - 1];
    if (!latest || !latest.exercise) return;
    window._renderSportNudge(latest.exercise);
  };

  window.renderActivityHeatmap = function() {
   if(!Array.isArray(window.workouts)) return;
   const year = new Date().getFullYear();
   const yearEl = document.getElementById('heatmapYear');
   if(yearEl) yearEl.textContent = year;
   const archived = window.workouts.filter(w => w.archived && w.date && w.date.startsWith(String(year)));
   const counts = {};
   archived.forEach(w => { counts[w.date] = (counts[w.date] || 0) + 1; });
   const jan1 = new Date(year, 0, 1);
   const startDay = jan1.getDay() === 0 ? 6 : jan1.getDay() - 1; // Mo=0
   const grid = document.getElementById('heatmapGrid');
   const labels = document.getElementById('heatmapMonthLabels');
   if(!grid || !labels) return;
   let cells = '';
   const cellSize = window.innerWidth < 640 ? 8 : 10;
   let totalDays = 0;
   let maxStreak = 0, curStreak = 0;
   for(let i = 0; i < startDay; i++) cells += `<div style="width:${cellSize}px;height:${cellSize}px"></div>`;
   const today = new Date();
   let monthPositions = [];
   let lastMonth = -1;
   let colIdx = 0;
   const d = new Date(jan1);
   while(d.getFullYear() === year && d <= today) {
    const ds = d.toISOString().split('T')[0];
    const c = counts[ds] || 0;
    const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
    if(dayOfWeek === 0 && d > jan1) colIdx++;
    if(d.getMonth() !== lastMonth) { monthPositions.push({ month: d.getMonth(), col: colIdx }); lastMonth = d.getMonth(); }
    const bg = c === 0 ? 'rgba(24,24,27,0.5)' : c === 1 ? 'rgba(6,182,212,0.2)' : c === 2 ? 'rgba(6,182,212,0.45)' : 'rgba(6,182,212,0.8)';
    cells += `<div style="width:${cellSize}px;height:${cellSize}px;background:${bg};border-radius:2px" title="${ds}: ${c} Workouts"></div>`;
    if(c > 0) { totalDays++; curStreak++; maxStreak = Math.max(maxStreak, curStreak); } else { curStreak = 0; }
    d.setDate(d.getDate() + 1);
   }
   grid.style.gridTemplateRows = `repeat(7, ${cellSize}px)`;
   grid.innerHTML = cells;
   const monthNames = window._getShortMonthNames();
   labels.innerHTML = monthPositions.map(p => `<span class="text-[8px] text-zinc-600 font-bold" style="position:relative;left:${p.col * (cellSize + 1)}px;white-space:nowrap">${monthNames[p.month]}</span>`).join('');
   labels.style.position = 'relative';
   labels.style.height = '14px';
   const summary = document.getElementById('heatmapSummary');
   if(summary) summary.textContent = `${totalDays} Tage trainiert in ${year} · Längster Streak: ${maxStreak} Tage`;
  };

  window.checkWeeklyReview = function() {
   if(window.currentMode !== 'personal') return;
   if(!Array.isArray(window.workouts)) return;
   const lastReview = localStorage.getItem('base_weekly_review_date');
   const today = new Date();
   const dayOfWeek = today.getDay(); // 0=So, 1=Mo
   if(dayOfWeek !== 0 && dayOfWeek !== 1) return;
   if(lastReview) {
    const diff = (today - new Date(lastReview)) / 86400000;
    if(diff < 6) return;
   }
   const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
   const weekWorkouts = window.workouts.filter(w => w.archived && w.date >= weekAgo.toISOString().split('T')[0]);
   if(weekWorkouts.length === 0) return;
   setTimeout(() => window._showWeeklyReview(), 2000);
  };
  window._showWeeklyReview = function() {
   if(!Array.isArray(window.workouts)) return;
   const today = new Date();
   const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
   const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
   const wa = weekAgo.toISOString().split('T')[0];
   const twa = twoWeeksAgo.toISOString().split('T')[0];
   const thisWeek = window.workouts.filter(w => w.archived && w.date >= wa);
   const lastWeek = window.workouts.filter(w => w.archived && w.date >= twa && w.date < wa);
   const thisCount = thisWeek.length;
   const lastCount = lastWeek.length;
   const countDiff = thisCount - lastCount;
   let thisVol = 0; thisWeek.forEach(w => { if(w.volume) thisVol += w.volume; });
   let lastVol = 0; lastWeek.forEach(w => { if(w.volume) lastVol += w.volume; });
   const volDiff = Math.round(thisVol - lastVol);
   const streak = parseInt(localStorage.getItem('base_streak_count') || '0');
   const statsEl = document.getElementById('weeklyReviewStats');
   if(!statsEl) return;
   const diffBadge = (val) => val > 0 ? `<span class="text-[9px] text-emerald-400 font-bold ml-1">+${val}</span>` : val < 0 ? `<span class="text-[9px] text-rose-400 font-bold ml-1">${val}</span>` : '';
   statsEl.innerHTML = `
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center"><p class="text-2xl font-black text-white">${thisCount}${diffBadge(countDiff)}</p><p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Workouts</p></div>
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center"><p class="text-2xl font-black text-white">${thisVol > 0 ? Math.round(thisVol) : '—'}${thisVol > 0 ? diffBadge(volDiff) : ''}</p><p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">${thisVol > 0 ? 'kg Vol.' : 'Volumen'}</p></div>
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center"><p class="text-2xl font-black text-white">${streak}</p><p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Streak</p></div>`;
   const motEl = document.getElementById('weeklyReviewMotivation');
   let msg = 'Weiter so!';
   if(streak > 30) msg = `Legende. ${streak} Tage ohne Pause.`;
   else if(streak > 7) msg = `Streak-Maschine! ${streak} Tage am Stück.`;
   else if(countDiff > 0) msg = 'Stärker als letzte Woche.';
   else if(countDiff < 0) msg = 'Nächste Woche wird deine Woche.';
   if(motEl) motEl.textContent = msg;
   const modal = document.getElementById('weeklyReviewModal');
   if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
   window._refreshLucide();
  };
  window._dismissWeeklyReview = function() {
   const modal = document.getElementById('weeklyReviewModal');
   if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
   localStorage.setItem('base_weekly_review_date', new Date().toISOString().split('T')[0]);
  };

  window.deleteAllArchive = () => { if(!Array.isArray(window.workouts)) return; window.showModal("Leeren?", "Gesamtes Archiv löschen?", true, async () => { const archivedWorkouts = window.workouts.filter(w => w.archived); window.workouts = window.workouts.filter(w => !w.archived); window.saveWorkoutsForCurrentClient(); window.renderTable(); window.calculateReadiness(); if(window.removeFromCloud) { for(const w of archivedWorkouts) await window.removeFromCloud(w.id); } }); };
  window.switchView = function(view) { window.currentView = view; const activeClass = "bg-zinc-800 text-white px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm cursor-pointer interactive-z"; const inactiveClass = "text-zinc-500 hover:text-white px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer interactive-z"; document.getElementById('btnViewActive').className = view === 'active' ? activeClass : inactiveClass; document.getElementById('btnViewArchive').className = view === 'archive' ? activeClass : inactiveClass; document.getElementById('btnViewChart').className = view === 'chart' ? activeClass : inactiveClass; document.getElementById('btnFinish').style.display = view === 'active' ? 'flex' : 'none'; document.getElementById('btnClear').style.display = view === 'archive' ? 'flex' : 'none'; if(view === 'chart') { document.getElementById('viewTableContainer').classList.add('hidden'); document.getElementById('viewAnalyticsContainer').classList.remove('hidden'); window.initAnalytics(); } else { document.getElementById('viewTableContainer').classList.remove('hidden'); document.getElementById('viewAnalyticsContainer').classList.add('hidden'); window.renderTable(); } };
  
  window.filterTable = function(cat) { window.currentTableFilter = cat || 'all'; window.renderTableFilters(); window.renderTable(); };

  let _supersetActive = false;

  window.toggleSuperset = function() {
   _supersetActive = !_supersetActive;
   const field = document.getElementById('supersetField');
   const btn = document.getElementById('btnSuperset');
   if(_supersetActive) {
    field.classList.remove('hidden');
    if(btn) btn.style.cssText = `background:color-mix(in srgb,var(--secondary-hex) 15%,transparent);border:1px solid color-mix(in srgb,var(--secondary-hex) 40%,transparent);color:var(--secondary-hex)`;
    window._refreshLucide();
   } else {
    field.classList.add('hidden');
    if(btn) btn.style.cssText = `background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)`;
    const ssInput = document.getElementById('supersetExercise');
    if(ssInput) ssInput.value = '';
   }
  };

  let _goals = JSON.parse(localStorage.getItem('base_goals') || '[]');

  // openGoalModal: definiert weiter unten bei den Goals V2 Funktionen (cloud-sync Version)

  if(localStorage.getItem('base_invite_dismissed')) {
   const b = document.getElementById('inviteBanner');
   if(b) b.style.display = 'none';
  }

  window.inviteFriend = function() {
   const text = encodeURIComponent(
    "Hey! Ich nutze BASE — eine kostenlose KI-Fitness-App die jeden Sport trackt. Kein App-Store, läuft direkt im Browser. Schau mal rein 👇\nhttps://base-app.tech"
   );
   window.open("https://wa.me/?text=" + text, "_blank");
  };

  window.renderGoals = function() {
   const list = document.getElementById('goalsList');
   const empty = document.getElementById('goalsEmpty');
   if(!list) return;
   if(_goals.length === 0) {
    list.innerHTML = '';
    if(empty) empty.classList.remove('hidden');
    return;
   }
   if(empty) empty.classList.add('hidden');

   list.innerHTML = _goals.map(goal => {
    const relevantWorkouts = window.workouts.filter(w => w.exercise?.toLowerCase() === goal.exercise.toLowerCase() && w.category === 'strength');
    let currentBest = 0;
    relevantWorkouts.forEach(w => {
     if(w.setDetails?.length > 0) {
      const best = Math.max(...w.setDetails.map(s => parseFloat(s.weight) || 0));
      if(best > currentBest) currentBest = best;
     } else if(w.maxWeight && parseFloat(w.maxWeight) > currentBest) {
      currentBest = parseFloat(w.maxWeight);
     }
    });

    const progress = currentBest > 0 ? Math.min(currentBest / goal.targetWeight, 1) : 0;
    const pct = Math.round(progress * 100);
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4';

    let deadlineStr = '';
    let deadlineColor = 'var(--text-muted)';
    if(goal.deadline) {
     const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000*60*60*24));
     if(daysLeft < 0) { deadlineStr = 'Abgelaufen'; deadlineColor = '#ef4444'; }
     else if(daysLeft === 0) { deadlineStr = 'Heute'; deadlineColor = '#f97316'; }
     else if(daysLeft <= 7) { deadlineStr = `${daysLeft}d übrig`; deadlineColor = '#f97316'; }
     else deadlineStr = `${Math.ceil(daysLeft/7)} Wo übrig`;
    }

    const achieved = progress >= 1;

    return `<div class="p-4 rounded-2xl transition-all" style="background:var(--inner-bg-hex);border:1px solid ${achieved ? 'color-mix(in srgb,'+primary+' 40%,transparent)' : 'var(--border-hex)'}${achieved ? ';box-shadow:0 0 20px color-mix(in srgb,'+primary+' 15%,transparent)' : ''}">
     <div class="flex items-start justify-between mb-2">
      <div class="flex-1">
       <p class="font-black text-sm text-white" style="font-family:'Barlow Condensed',sans-serif">${achieved ? '✅ ' : ''}${window._escapeHtml(goal.exercise)}</p>
       <p class="text-[10px] font-bold uppercase tracking-widest mt-0.5" style="color:${deadlineColor}">${deadlineStr}</p>
      </div>
      <div class="text-right flex-shrink-0 ml-3">
       <p class="font-black text-base" style="color:${primary};font-family:'Barlow Condensed',sans-serif">${currentBest > 0 ? currentBest : '—'}<span class="text-xs opacity-60">kg</span></p>
       <p class="text-[10px] font-bold" style="color:var(--text-muted)">Ziel: ${goal.targetWeight}kg</p>
      </div>
      <button aria-label="Schließen" onclick="window.deleteGoal('${goal.id}')" class="ml-2 w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto flex-shrink-0" style="color:var(--text-muted)">
       <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
      </button>
     </div>
     <div class="h-1.5 rounded-full overflow-hidden" style="background:color-mix(in srgb,${primary} 12%,transparent)">
      <div class="h-full rounded-full transition-all duration-700" style="width:${pct}%;background:${achieved ? primary : primary}"></div>
     </div>
     <p class="text-[10px] font-bold mt-1" style="color:var(--text-muted)">${pct}% erreicht</p>
    </div>`;
   }).join('');
   window._refreshLucide();
  };

  // deleteGoal: definiert weiter unten bei den Goals V2 Funktionen (cloud-sync Version)

  let _chartMode = 'exercise';

  window.setChartMode = function(mode) {
   _chartMode = mode;
   const exBtn = document.getElementById('btnChart-exercise');
   const volBtn = document.getElementById('btnChart-volume');
   const exControls = document.getElementById('exerciseChartControls');
   const volStats = document.getElementById('volumeStats');

   if(mode === 'exercise') {
    exBtn.className = exBtn.className.replace('text-zinc-500', 'bg-zinc-800 text-white');
    volBtn.className = volBtn.className.replace('bg-zinc-800 text-white', 'text-zinc-500');
    if(exControls) exControls.classList.remove('hidden');
    if(volStats) volStats.classList.add('hidden');
    window.initAnalytics();
   } else {
    volBtn.className = volBtn.className.replace('text-zinc-500', 'bg-zinc-800 text-white');
    exBtn.className = exBtn.className.replace('bg-zinc-800 text-white', 'text-zinc-500');
    if(exControls) exControls.classList.add('hidden');
    if(volStats) volStats.classList.remove('hidden');
    window.renderVolumeChart();
   }
  };

  window.renderVolumeChart = function() {
   const weeks = [];
   const now = new Date();
   for(let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) - i * 7);
    weekStart.setHours(0,0,0,0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);

    const weekWorkouts = window.workouts.filter(w => {
     if(!w.date || w.category !== 'strength') return false;
     const d = new Date(w.date);
     return d >= weekStart && d <= weekEnd;
    });

    let vol = 0;
    weekWorkouts.forEach(w => {
     if(w.volume) vol += w.volume;
     else if(w.setDetails) vol += w.setDetails.reduce((s, set) => s + (parseFloat(set.weight)||0) * (parseInt(set.reps)||0), 0);
    });

    const label = `${weekStart.getDate()}.${weekStart.getMonth()+1}`;
    weeks.push({ label, volume: Math.round(vol), count: weekWorkouts.length });
   }

   const totalVol = weeks.reduce((s, w) => s + w.volume, 0);
   const avgVol = Math.round(totalVol / weeks.filter(w => w.volume > 0).length || 0);
   const maxVol = Math.max(...weeks.map(w => w.volume));
   const currentWeekVol = weeks[weeks.length - 1].volume;

   const fmt = v => v >= 1000 ? (v/1000).toFixed(1) + 't' : v + 'kg';
   const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4';

   const statFn = (id, label, val) => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = `<p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color:var(--text-muted)">${label}</p><p class="text-lg font-black" style="color:var(--primary-hex);font-family:'Barlow Condensed',sans-serif">${val}</p>`;
   };
   statFn('volStat1', 'Diese Woche', fmt(currentWeekVol));
   statFn('volStat2', 'Ø pro Woche', fmt(avgVol));
   statFn('volStat3', 'Rekord-Woche', fmt(maxVol));

   const canvas = document.getElementById('v2Chart');
   if(!canvas) return;
   if(window.v2ChartInstance) window.v2ChartInstance.destroy();

   window.v2ChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
     labels: weeks.map(w => w.label),
     datasets: [{
      data: weeks.map(w => w.volume),
      backgroundColor: weeks.map((w, i) => i === weeks.length-1
       ? primary
       : `color-mix(in srgb, ${primary} 40%, transparent)`),
      borderRadius: 8,
      borderSkipped: false,
     }]
    },
    options: {
     responsive: true, maintainAspectRatio: false,
     plugins: {
      legend: { display: false },
      tooltip: {
       backgroundColor: '#18181b', titleColor: '#fff',
       bodyColor: primary, bodyFont: { weight: 'bold', size: 14 },
       borderColor: '#27272a', borderWidth: 1, padding: 12,
       cornerRadius: 12, displayColors: false,
       callbacks: { label: ctx => fmt(ctx.raw) + ' Volumen' }
      }
     },
     scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#71717a', font: { size: 10 }, callback: v => fmt(v) } },
      x: { grid: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } }
     }
    }
   });
  };

  let _chCategory = 'strength';
  let _chMetric = 'volume';
  let _chDuration = 7;
  let _chVisibility = 'private';

  window.switchChallengeTab = function(tab) {
   ['my','create','discover'].forEach(function(t) {
    var panel = document.getElementById('chPanel-' + t);
    var btn = document.getElementById('chTab-' + t);
    if(panel) panel.classList.toggle('hidden', t !== tab);
    if(btn) {
     btn.classList.toggle('text-amber-400', t === tab);
     btn.classList.toggle('bg-amber-500/10', t === tab);
     btn.classList.toggle('text-zinc-500', t !== tab);
    }
   });
   if(tab === 'discover') window.loadPublicChallenges();
  };

  function _chSetActive(cls, activeBtn) {
   document.querySelectorAll('.' + cls).forEach(function(b) {
    var on = (b === activeBtn);
    b.classList.toggle('border-amber-500', on);
    b.classList.toggle('bg-amber-500/10', on);
    b.classList.toggle('text-amber-400', on);
    b.classList.toggle('border-zinc-800', !on);
    b.classList.toggle('bg-zinc-900', !on);
    b.classList.toggle('text-zinc-400', !on);
   });
  }
  window.setChCategory = function(cat, btn) {
   _chCategory = cat;
   _chSetActive('ch-cat-btn', btn);
  };
  window.setChMetric = function(m, btn) {
   _chMetric = m;
   _chSetActive('ch-metric-btn', btn);
   var ci = document.getElementById('chCustomMetric');
   if(ci) ci.classList.toggle('hidden', m !== 'custom');
  };
  window.setChDuration = function(d, btn) {
   _chDuration = d;
   _chSetActive('ch-dur-btn', btn);
  };
  window.setChVisibility = function(v, btn) {
   _chVisibility = v;
   _chSetActive('ch-vis-btn', btn);
  };

  window.createChallenge = function() {
   if(!window.checkFeatureGate('challenge')) return;
   var title = (document.getElementById('chTitle') || {}).value || '';
   title = title.trim();
   var exercise = (document.getElementById('chExercise') || {}).value || '';
   exercise = exercise.trim();
   if(!title) { window.showToast(window.t('toastError', 'Bitte einen Namen eingeben!')); return; }
   if(!exercise) { window.showToast(window.t('toastError', 'Bitte Sportart eingeben!')); return; }
   var metricLabel = _chMetric;
   if(_chMetric === 'custom') {
    metricLabel = (document.getElementById('chCustomMetric') || {}).value || '';
    metricLabel = metricLabel.trim();
    if(!metricLabel) { window.showToast('Bitte Metrik eingeben!'); return; }
   }
   var btn = document.getElementById('btnCreateChallenge');
   var btnText = document.getElementById('btnCreateChallengeText');
   if(btn) btn.disabled = true;
   if(btnText) btnText.textContent = 'Erstelle...';
   var uid = window._chGetUid ? window._chGetUid() : null;
   if(!uid) { window.showToast(window.t('aiAnalyzing', 'Warte kurz...')); if(btn) btn.disabled = false; if(btnText) btnText.textContent = 'Challenge erstellen'; return; }
   var cname = window._chGetName ? window._chGetName() : 'Athlet';
   var now = new Date();
   var end = new Date(now.getTime() + _chDuration * 24 * 60 * 60 * 1000);
   var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
   var data = {
    title: title, creatorUid: uid, creatorName: cname,
    category: _chCategory, exercise: exercise, metric: metricLabel,
    duration: _chDuration, visibility: _chVisibility,
    startDate: now.toISOString(), endDate: end.toISOString(), createdAt: now.toISOString(),
    participants: [{ uid: uid, name: cname, progress: 0, lastUpdate: now.toISOString() }]
   };
   window._chCreate(id, data).then(function(result) {
    if(btn) btn.disabled = false;
    if(btnText) btnText.textContent = 'Challenge erstellen';
    if(result === true) {
     window.showToast(window.t('toastUpdate', 'Challenge erstellt!'));
     var ti = document.getElementById('chTitle'); if(ti) ti.value = '';
     var ei = document.getElementById('chExercise'); if(ei) ei.value = '';
     window.switchChallengeTab('my');
     window.loadMyChallenges();
    } else {
     window.showToast('Fehler: ' + result);
    }
   });
  };

  window.loadMyChallenges = function() {
   var list = document.getElementById('myChallengesList');
   var empty = document.getElementById('myChallengesEmpty');
   if(!list || !window._chList) return;
   var myUid = window._chGetUid ? window._chGetUid() : null;
   if(!myUid) { if(empty) empty.classList.remove('hidden'); return; }
   window._chList(function(all) {
    var mine = all.filter(function(ch) {
     return (ch.participants || []).some(function(p) { return p.uid === myUid; });
    });
    var now = new Date();
    mine.sort(function(a, b) {
     var aA = new Date(a.endDate) > now ? 0 : 1;
     var bA = new Date(b.endDate) > now ? 0 : 1;
     return aA !== bA ? aA - bA : new Date(b.startDate) - new Date(a.startDate);
    });
    if(mine.length === 0) { list.innerHTML = ''; if(empty) empty.classList.remove('hidden'); }
    else {
     if(empty) empty.classList.add('hidden');
     list.innerHTML = mine.map(function(ch) { return window.renderChallengeCard(ch, false); }).join('');
     window._refreshLucide();
    }
    var ac = mine.filter(function(c) { return new Date(c.endDate) > now; }).length;
    var badge = document.getElementById('activeChallengesBadge');
    if(badge) { if(ac > 0) { badge.textContent = ac; badge.classList.remove('hidden'); } else { badge.classList.add('hidden'); } }
   });
  };

  window.loadPublicChallenges = function() {
   var list = document.getElementById('publicChallengesList');
   var empty = document.getElementById('publicChallengesEmpty');
   if(!list || !window._chList) return;
   window._chList(function(all) {
    var now = new Date();
    var pub = all.filter(function(ch) { return ch.visibility === 'public' && new Date(ch.endDate) > now; });
    pub.sort(function(a, b) { return (b.participants || []).length - (a.participants || []).length; });
    if(pub.length === 0) { list.innerHTML = ''; if(empty) empty.classList.remove('hidden'); }
    else {
     if(empty) empty.classList.add('hidden');
     list.innerHTML = pub.map(function(ch) { return window.renderChallengeCard(ch, true); }).join('');
     window._refreshLucide();
    }
   });
  };

  window.joinChallenge = function(challengeId) {
   var uid = window._chGetUid ? window._chGetUid() : null;
   var cname = window._chGetName ? window._chGetName() : 'Athlet';
   if(uid) {
    window._doJoinChallenge(challengeId, uid, cname);
    return;
   }
   var overlay = document.createElement('div');
   overlay.id = 'anonJoinOverlay';
   overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:960;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(8px)';
   overlay.innerHTML = '<div style="background:#18181b;border:1px solid rgba(245,158,11,0.2);border-radius:var(--ui-radius,1rem);padding:1.5rem;max-width:340px;width:100%">' +
    '<h3 style="color:#fff;font-size:16px;font-weight:900;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:-0.02em">Tritt der Challenge bei!</h3>' +
    '<p style="color:#71717a;font-size:11px;margin:0 0 16px 0">Kein Account nötig — einfach loslegen.</p>' +
    '<input id="anonJoinName" type="text" required placeholder="Wie sollen dich die anderen sehen?" style="width:100%;box-sizing:border-box;background:#09090b;border:1px solid #27272a;color:#fff;padding:12px 14px;border-radius:12px;font-size:14px;font-weight:600;outline:none;margin-bottom:12px" />' +
    '<button id="anonJoinBtn" style="width:100%;padding:14px;background:#84a98c;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer">Mitmachen</button>' +
    '<p style="color:#52525b;font-size:10px;text-align:center;margin:12px 0 0 0">Optional: <a onclick="document.getElementById(\'anonJoinOverlay\').remove();window.toggleModal(\'authModal\')" style="color:#6366f1;cursor:pointer;text-decoration:underline;pointer-events:auto">Account erstellen</a> für Cloud-Sync</p>' +
    '</div>';
   document.body.appendChild(overlay);
   overlay.addEventListener('click', function(e) { if(e.target === overlay) overlay.remove(); });
   var nameInput = document.getElementById('anonJoinName');
   var joinBtn = document.getElementById('anonJoinBtn');
   if(nameInput) nameInput.focus();
   joinBtn.onclick = function() {
    var name = (nameInput.value || '').trim();
    if(!name) { nameInput.style.borderColor = '#ef4444'; nameInput.focus(); return; }
    var anonId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    localStorage.setItem('base_anon_challenge_id', anonId);
    localStorage.setItem('base_anon_challenge_name', name);
    overlay.remove();
    window._doJoinChallenge(challengeId, anonId, name);
   };
   if(nameInput) nameInput.addEventListener('keydown', function(e) { if(e.key === 'Enter') joinBtn.click(); });
  };

  window._doJoinChallenge = function(challengeId, uid, cname) {
   window._chList(function(all) {
    var found = null;
    all.forEach(function(ch) { if(ch.id === challengeId) found = ch; });
    if(!found) { window.showToast(window.t('toastError', 'Challenge nicht gefunden')); return; }
    var parts = found.participants || [];
    if(parts.some(function(p) { return p.uid === uid; })) { window.showToast(window.t('toastError', 'Bereits beigetreten!')); return; }
    parts.push({ uid: uid, name: cname, progress: 0, lastUpdate: new Date().toISOString() });
    window._chUpdate(challengeId, { participants: parts }).then(function(result) {
     if(result === true) { window.showToast(window.t('toastUpdate', 'Challenge beigetreten!')); window.loadMyChallenges(); if(window.awardXP) window.awardXP('challengeJoin'); }
     else { window.showToast('Fehler: ' + result); }
    });
   });
  };

  window.renderChallengeCard = function(ch, showJoin) {
   var myUid = window._chGetUid ? window._chGetUid() : null;
   var now = new Date();
   var end = new Date(ch.endDate);
   var daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
   var hoursLeft = Math.max(0, Math.ceil((end - now) / 3600000));
   var isExpired = end <= now;
   var timeLabel = isExpired ? 'Beendet' : (daysLeft <= 0 ? hoursLeft + 'h' : daysLeft <= 2 ? daysLeft + 'T ' + (hoursLeft % 24) + 'h' : daysLeft + ' Tage');
   var participants = ch.participants || [];
   var sorted = participants.slice().sort(function(a, b) { return (b.progress || 0) - (a.progress || 0); });
   var catIcons = { strength: 'dumbbell', cardio: 'heart-pulse', main: 'star' };
   var catColors = { strength: 'cyan', cardio: 'rose', main: 'violet' };
   var color = catColors[ch.category] || 'amber';
   var metricUnit = { volume: 'kg', weight: 'kg', distance: 'km', reps: 'Wdh', time: 'min' };
   var unit = metricUnit[ch.metric] || ch.metric || '';
   var h = '<div class="bg-zinc-900/80 border border-' + color + '-500/20 rounded-2xl p-4">';
   h += '<div class="flex items-center justify-between mb-3">';
   h += '<div class="flex items-center gap-2"><i data-lucide="' + (catIcons[ch.category] || 'trophy') + '" class="w-4 h-4 text-' + color + '-400"></i>';
   h += '<span class="text-sm font-black text-white">' + window._escapeHtml(ch.title) + '</span></div>';
   h += '<span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ' + (isExpired ? 'bg-zinc-800 text-zinc-500' : (daysLeft <= 2 && !isExpired ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' : 'bg-' + color + '-500/10 text-' + color + '-400 border border-' + color + '-500/20')) + '">' + timeLabel + '</span></div>';
   h += '<p class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">' + window._escapeHtml(ch.exercise) + ' \u2014 ' + unit + ' \u2014 ' + participants.length + ' Teilnehmer</p>';
   h += '<p class="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-2">Leaderboard</p>';
   if(sorted.length === 1 && (sorted[0].progress || 0) === 0) {
    h += '<div class="text-center py-2"><p class="text-xs text-zinc-600">Noch kein Fortschritt — tracke ein Workout mit <span class="text-amber-400">' + window._escapeHtml(ch.exercise) + '</span>!</p></div>';
   }
   for(var i = 0; i < Math.min(sorted.length, 5); i++) {
    var p = sorted[i];
    var medals = ['', '\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];
    var medal = medals[i + 1] || (i + 1) + '.';
    var isMe = p.uid === myUid;
    h += '<div class="flex items-center justify-between py-1.5 ' + (isMe ? 'bg-amber-500/5 rounded-lg px-2 -mx-2' : '') + '">';
    h += '<span class="text-xs ' + (isMe ? 'text-amber-400 font-black' : 'text-zinc-400 font-bold') + '">' + medal + ' ' + window._escapeHtml(p.name || 'Anonym') + '</span>';
    h += '<span class="text-xs font-black ' + (isMe ? 'text-amber-400' : 'text-white') + '">' + (p.progress || 0) + ' ' + unit + '</span></div>';
   }
   h += '<div class="flex gap-2 mt-3 pt-3 border-t border-zinc-800">';
   if(showJoin && !isExpired) {
    var already = participants.some(function(p) { return p.uid === myUid; });
    if(!already) {
     h += '<button onclick="window.joinChallenge(\'' + ch.id + '\')" class="flex-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto hover:bg-amber-500/20 transition-all">' + window.t('challengeJoin','Beitreten') + '</button>';
    }
   }
   if(!isExpired) {
    h += '<button onclick="window.shareChallenge(\'' + ch.id + '\')" class="flex-1 bg-zinc-800 text-zinc-300 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto hover:bg-zinc-700 transition-all flex items-center justify-center gap-1"><i data-lucide="share-2" class="w-3 h-3 pointer-events-none"></i> Einladen</button>';
   }
   if(!isExpired && participants.some(function(p) { return p.uid === myUid; })) {
    h += '<button onclick="window.addChallengeProgress(\'' + ch.id + '\',\'' + unit + '\')" class="bg-amber-500/10 text-amber-400 border border-amber-500/20 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto hover:bg-amber-500/20 transition-all flex items-center justify-center"><i data-lucide="plus" class="w-3 h-3 pointer-events-none"></i></button>';
   }
   if(ch.creatorUid === myUid) {
    h += '<button onclick="window.deleteChallenge(\'' + ch.id + '\')" class="bg-zinc-800 text-rose-400 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto hover:bg-rose-500/10 transition-all flex items-center justify-center"><i data-lucide="trash-2" class="w-3 h-3 pointer-events-none"></i></button>';
   } else if(participants.some(function(p) { return p.uid === myUid; })) {
    h += '<button onclick="window.leaveChallenge(\'' + ch.id + '\')" class="bg-zinc-800 text-zinc-500 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto hover:bg-zinc-700 transition-all flex items-center justify-center"><i data-lucide="log-out" class="w-3 h-3 pointer-events-none"></i></button>';
   }
   h += '</div></div>';
   return h;
  };

  window.shareChallenge = function(id) {
   var url = window.location.origin + '/app.html?challenge=' + id;
   var doShare = function(challengeTitle) {
    var shareText = '\uD83D\uDCAA Ich habe eine Challenge erstellt: "' + challengeTitle + '"\n\nSchaffst du es? Tritt bei und zeig was du kannst!\n\nKein Account nötig \u2014 einfach Name eingeben und loslegen.';
    var shareData = { title: challengeTitle + ' \u2014 BASE Challenge', text: shareText, url: url };
    if(navigator.share) {
     navigator.share(shareData).catch(function() {});
    } else {
     var waLink = 'https://wa.me/?text=' + encodeURIComponent(shareText + '\n\n' + url);
     window.open(waLink, '_blank');
     navigator.clipboard.writeText(shareText + '\n\n' + url).then(function() {
      window.showToast('Link kopiert! Teile ihn per WhatsApp.');
     }).catch(function() {});
    }
   };
   if(window._chList) {
    window._chList(function(all) {
     var found = null;
     all.forEach(function(ch) { if(ch.id === id) found = ch; });
     doShare(found ? found.title : 'Challenge');
    });
   } else {
    doShare('Challenge');
   }
  };

  window.deleteChallenge = function(id) {
   window.showModal('Challenge löschen?', 'Diese Challenge wird dauerhaft gelöscht.', true, () => {
    window._chDelete(id).then(function(result) {
     if(result === true) { window.showToast(window.t('toastDeleted')); window.loadMyChallenges(); }
     else { window.showToast('Fehler: ' + result); }
    });
   });
  };

  window.addChallengeProgress = function(challengeId, unit) {
   window.showInputModal('Fortschritt hinzufügen (' + unit + ')', '0', function(val) {
   if(!val) return;
   var num = parseFloat(val.replace(',', '.'));
   if(isNaN(num) || num <= 0) { window.showToast(window.t('toastError', 'Bitte eine gueltige Zahl eingeben')); return; }
   var uid = window._chGetUid ? window._chGetUid() : null;
   var cname = window._chGetName ? window._chGetName() : 'Athlet';
   if(!uid) return;
   window._chList(function(all) {
    var found = null;
    all.forEach(function(ch) { if(ch.id === challengeId) found = ch; });
    if(!found) { window.showToast(window.t('toastError', 'Challenge nicht gefunden')); return; }
    var parts = (found.participants || []).slice();
    var myIdx = -1;
    parts.forEach(function(p, i) { if(p.uid === uid) myIdx = i; });
    if(myIdx === -1) return;
    var current = parts[myIdx].progress || 0;
    parts[myIdx] = { uid: uid, name: cname, progress: Math.round((current + num) * 10) / 10, lastUpdate: new Date().toISOString() };
    window._chUpdate(challengeId, { participants: parts }).then(function(result) {
     if(result === true) {
      window.showToast('+' + num + ' ' + unit + ' hinzugefügt!');
      window.loadMyChallenges();
      setTimeout(function() { window._showBragAfterProgress(challengeId); }, 800);
     } else { window.showToast('Fehler: ' + result); }
    });
   });
   }); // showInputModal callback end
  };

  window.leaveChallenge = function(challengeId) {
   window.showModal('Challenge verlassen?', 'Willst du diese Challenge wirklich verlassen?', true, () => {
   var uid = window._chGetUid ? window._chGetUid() : null;
   if(!uid) return;
   window._chList(function(all) {
    var found = null;
    all.forEach(function(ch) { if(ch.id === challengeId) found = ch; });
    if(!found) return;
    var parts = (found.participants || []).filter(function(p) { return p.uid !== uid; });
    window._chUpdate(challengeId, { participants: parts }).then(function(result) {
     if(result === true) { window.showToast(window.t('toastUpdate', 'Challenge verlassen')); window.loadMyChallenges(); }
     else { window.showToast('Fehler: ' + result); }
    });
   });
   });
  };

  function _calcProgress(ch) {
   var startDate = new Date(ch.startDate);
   var total = 0;
   var found = false;
   var exLower = (ch.exercise || '').toLowerCase();

   (window.workouts || []).forEach(function(w) {
    if(!w.archived) return;
    var wDate = new Date(parseInt(w.id));
    if(wDate < startDate) return;
    if(!w.exercise || w.exercise.toLowerCase().indexOf(exLower) === -1) return;

    found = true;
    if(ch.metric === 'volume') {
     (w.setDetails || []).forEach(function(s) { total += (parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0); });
     if(!w.setDetails || w.setDetails.length === 0) {
      var kg = parseFloat(w.data && w.data['Gewicht (kg)']) || 0;
      var reps = parseFloat(w.data && w.data['Wiederholungen']) || 0;
      var sets = parseFloat(w.data && (w.data['Sätze'] || w.data['Sets'])) || 1;
      total += kg * reps * sets;
     }
    } else if(ch.metric === 'weight') {
     (w.setDetails || []).forEach(function(s) { var wt = parseFloat(s.weight) || 0; if(wt > total) total = wt; });
    } else if(ch.metric === 'distance') {
     total += parseFloat(w.data && (w.data['Distanz (km)'] || w.data['Km'] || w.data['km'] || w.data['Distanz'])) || 0;
    } else if(ch.metric === 'reps') {
     (w.setDetails || []).forEach(function(s) { total += parseFloat(s.reps) || 0; });
    } else if(ch.metric === 'time') {
     total += parseFloat(w.data && (w.data['Dauer (min)'] || w.data['Zeit (min)'] || w.data['Minuten'])) || 0;
    } else {
     Object.keys(w.data || {}).forEach(function(key) { var v = parseFloat(w.data[key]); if(!isNaN(v)) total += v; });
    }
   });
   return found ? Math.round(total * 10) / 10 : 0;
  }

  window.checkChallengeInvite = function() {
   var params = new URLSearchParams(window.location.search);
   var chId = params.get('challenge');
   if(chId) {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(function() { window.openChallenges(); window.joinChallenge(chId); }, 1500);
   }
  };
  setTimeout(function() { if(window.checkChallengeInvite) window.checkChallengeInvite(); }, 2000);

  window.showChallengeBragCard = function(ch, myProgress, rank, totalParticipants) {
   var primary = '#f59e0b'; // amber
   var catNames = { strength: 'Kraft', cardio: 'Cardio', main: 'Sport' };
   var metricUnit = { volume: 'kg', weight: 'kg', distance: 'km', reps: 'Wdh', time: 'min' };
   var unit = metricUnit[ch.metric] || ch.metric || '';
   var medals = ['', '\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];
   var medal = medals[rank] || '#' + rank;
   var isWinner = rank === 1;
   var daysLeft = Math.max(0, Math.ceil((new Date(ch.endDate) - new Date()) / 86400000));
   var statusText = daysLeft === 0 ? 'Challenge beendet!' : daysLeft + ' Tage verbleibend';

   var html = '<div style="background:linear-gradient(135deg,#09090b 0%,#1c1917 100%);padding:32px;font-family:Inter,sans-serif;">';
   html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">';
   html += '<div style="width:40px;height:40px;border-radius:12px;background:' + primary + '20;border:1px solid ' + primary + '40;display:flex;align-items:center;justify-content:center;">';
   html += '<span style="font-size:20px;">\ud83c\udfc6</span></div>';
   html += '<div><p style="color:' + primary + ';font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;margin:0;">BASE Challenge</p>';
   html += '<p style="color:#71717a;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0;">' + statusText + '</p></div></div>';
   html += '<p style="color:#fff;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:-0.03em;margin:0 0 4px 0;line-height:1.1;">' + ch.title + '</p>';
   html += '<p style="color:#52525b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 24px 0;">' + ch.exercise + ' \u2014 ' + (catNames[ch.category] || '') + '</p>';
   html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">';
   html += '<div style="background:#ffffff08;border:1px solid ' + primary + '30;border-radius:16px;padding:16px;text-align:center;">';
   html += '<p style="color:#71717a;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px 0;">' + window.t('challengeRank','Platz') + '</p>';
   html += '<p style="color:' + primary + ';font-size:28px;font-weight:900;margin:0;">' + medal + '</p></div>';
   html += '<div style="background:#ffffff08;border:1px solid #ffffff10;border-radius:16px;padding:16px;text-align:center;">';
   html += '<p style="color:#71717a;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px 0;">' + window.t('lblProgress','Fortschritt') + '</p>';
   html += '<p style="color:#fff;font-size:22px;font-weight:900;margin:0;">' + myProgress + ' ' + unit + '</p></div>';
   html += '<div style="background:#ffffff08;border:1px solid #ffffff10;border-radius:16px;padding:16px;text-align:center;">';
   html += '<p style="color:#71717a;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px 0;">' + window.t('challengeParticipants','Teilnehmer') + '</p>';
   html += '<p style="color:#fff;font-size:22px;font-weight:900;margin:0;">' + totalParticipants + '</p></div></div>';
   html += '<div style="height:3px;background:linear-gradient(to right,' + primary + ',#ea580c);border-radius:999px;"></div>';
   html += '<p style="text-align:center;color:#333;font-size:11px;margin-top:16px;">Tracked mit BASE \u2014 base-app.tech</p></div>';

   var container = document.getElementById('bragCardContent');
   if(container) container.innerHTML = html;
   window._bragCardData = { type: 'challenge', title: ch.title, exercise: ch.exercise };
   window.toggleModal('bragCardModal');
  };

  window._showBragAfterProgress = function(challengeId) {
   if(!window._chList) return;
   window._chList(function(all) {
    var myUid = window._chGetUid ? window._chGetUid() : null;
    if(!myUid) return;
    var found = null;
    all.forEach(function(ch) { if(ch.id === challengeId) found = ch; });
    if(!found) return;
    var sorted = (found.participants || []).slice().sort(function(a, b) { return (b.progress || 0) - (a.progress || 0); });
    var rank = 0;
    var myProgress = 0;
    sorted.forEach(function(p, i) { if(p.uid === myUid) { rank = i + 1; myProgress = p.progress || 0; } });
    if(rank > 0 && myProgress > 0) {
     window.showChallengeBragCard(found, myProgress, rank, sorted.length);
    }
   });
  };

  window._updateChallengeProgress = function() {
   if(!window._chList || !window._chGetUid) return;
   var myUid = window._chGetUid();
   if(!myUid) return;
   var myName = window._chGetName ? window._chGetName() : 'Athlet';

   window._chList(function(all) {
    var now = new Date();
    var updatedNames = [];
    all.forEach(function(ch) {
     if(new Date(ch.endDate) < now) return;
     var parts = ch.participants || [];
     var myIdx = -1;
     parts.forEach(function(p, i) { if(p.uid === myUid) myIdx = i; });
     if(myIdx === -1) return;

     var progress = _calcProgress(ch);
     if(progress === null || progress === 0) return;
     var oldProgress = parts[myIdx].progress || 0;
     if(progress <= oldProgress) return;

     var newParts = parts.slice();
     newParts[myIdx] = { uid: myUid, name: myName, progress: progress, lastUpdate: now.toISOString() };
     window._chUpdate(ch.id, { participants: newParts });
     updatedNames.push(ch.title + ': ' + progress + ' ' + (({ volume: 'kg', weight: 'kg', distance: 'km', reps: 'Wdh', time: 'min' })[ch.metric] || ''));
    });
    if(updatedNames.length > 0) {
     setTimeout(function() { window.showToast('Challenge aktualisiert: ' + updatedNames.join(', ')); }, 1500);
    }
   });
  };

  var _origOpenChallenges = window.openChallenges;
  window.openChallenges = function() {
   window.toggleModal('challengeModal');
   window.switchChallengeTab('my');
   window.loadMyChallenges();
   if(!window._chList || !window._chGetUid) return;
   var myUid = window._chGetUid();
   if(!myUid) return;
   var shownKey = 'base_ch_shown_winners';
   var shown = JSON.parse(localStorage.getItem(shownKey) || '[]');
   window._chList(function(all) {
    var now = new Date();
    all.forEach(function(ch) {
     if(new Date(ch.endDate) > now) return;
     if(shown.indexOf(ch.id) > -1) return;
     var parts = ch.participants || [];
     var isParticipant = parts.some(function(p) { return p.uid === myUid; });
     if(!isParticipant || parts.length < 2) return;
     var sorted = parts.slice().sort(function(a, b) { return (b.progress || 0) - (a.progress || 0); });
     var rank = 0;
     var myProgress = 0;
     sorted.forEach(function(p, i) { if(p.uid === myUid) { rank = i + 1; myProgress = p.progress || 0; } });
     shown.push(ch.id);
     localStorage.setItem(shownKey, JSON.stringify(shown));
     if(rank > 0) {
      setTimeout(function() { window.showChallengeBragCard(ch, myProgress, rank, sorted.length); }, 500);
     }
    });

    var savedRanks = {};
    try { savedRanks = JSON.parse(localStorage.getItem('base_ch_ranks') || '{}'); } catch(e) { console.error('Fehler beim Laden der Challenge-Ranks:', e); }
    var newRanks = {};
    var overtakeMessages = [];

    all.forEach(function(ch) {
     if(new Date(ch.endDate) <= now) return;
     var parts = ch.participants || [];
     if(parts.length < 2) return;
     var isP = parts.some(function(p) { return p.uid === myUid; });
     if(!isP) return;
     var sorted = parts.slice().sort(function(a, b) { return (b.progress || 0) - (a.progress || 0); });
     var myRank = 0;
     sorted.forEach(function(p, i) { if(p.uid === myUid) myRank = i + 1; });
     newRanks[ch.id] = myRank;
     var oldRank = savedRanks[ch.id];
     if(oldRank && myRank > oldRank) {
      var whoOvertook = sorted[myRank - 2]; // person now above me
      var name = whoOvertook ? (whoOvertook.name || 'Jemand') : 'Jemand';
      overtakeMessages.push(name + ' hat dich in "' + ch.title + '" überholt!');
     }
    });
    localStorage.setItem('base_ch_ranks', JSON.stringify(newRanks));
    if(overtakeMessages.length > 0) {
     setTimeout(function() { window.showToast(overtakeMessages[0]); }, 800);
    }
   });
  };

  const MUSCLE_MAP = {
   'Brust':        ['bankdrücken','bench','fliegende','butterfly','dips','pushup','liegestütz','pec','chest','kabelzug brust'],
   'Rücken':       ['rudern','kreuzheben','deadlift','klimmzug','pulldown','lat','row','rücken','back','hyperextension'],
   'Schultern':    ['schulter','overhead','press','military','seitheben','frontheben','lateral raise','shoulder'],
   'Bizeps':       ['bizeps','curl','hammer','bicep','preacher'],
   'Trizeps':      ['trizeps','tricep','french press','skull','dips','pushdown','overhead extension'],
   'Bauch':        ['crunch','plank','sit-up','bauch','core','ab ','abs','hollow','dragon flag'],
   'Beine':        ['squat','kniebeuge','leg press','beinpresse','ausfallschritt','lunge','rdl','beinstrecker','leg extension','bein','quad','hamstring','calf','wade'],
   'Gesäß':        ['hip thrust','glute','donkey','abduktor','bridge','gluteus'],
   'Nacken':       ['nacken','neck','traktion','shrug'],
  };

  const MUSCLE_COLORS = {
   'Brust':     { active: '#06b6d4', icon: 'heart' },
   'Rücken':    { active: 'var(--primary-hex)', icon: 'move-vertical' },
   'Schultern': { active: '#f97316', icon: 'sun' },
   'Bizeps':    { active: '#10b981', icon: 'trending-up' },
   'Trizeps':   { active: '#8b5cf6', icon: 'trending-down' },
   'Bauch':     { active: '#eab308', icon: 'minus' },
   'Beine':     { active: '#ef4444', icon: 'arrow-down' },
   'Gesäß':     { active: '#ec4899', icon: 'circle' },
   'Nacken':    { active: '#14b8a6', icon: 'align-center' },
  };

  function detectMuscleGroup(exerciseName) {
   if(!exerciseName) return null;
   const lower = exerciseName.toLowerCase();
   for(const [group, keywords] of Object.entries(MUSCLE_MAP)) {
    if(keywords.some(k => lower.includes(k))) return group;
   }
   return null;
  }

  window.renderMuscleHeatmap = function() {
   const grid = document.getElementById('muscleGrid');
   const empty = document.getElementById('muscleEmpty');
   if(!grid) return;

   const now = new Date();
   const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

   const recentWorkouts = window.workouts.filter(w => {
    if(w.category !== 'strength') return false;
    const d = new Date(w.date);
    return d >= sevenDaysAgo;
   });

   const muscleData = {};
   recentWorkouts.forEach(w => {
    const group = detectMuscleGroup(w.exercise);
    if(!group) return;
    const vol = w.volume || (w.setDetails ? w.setDetails.reduce((sum, s) => sum + (parseFloat(s.weight)||0)*(parseInt(s.reps)||0), 0) : 0);
    if(!muscleData[group]) muscleData[group] = { volume: 0, sessions: 0, lastDate: null };
    muscleData[group].volume += vol;
    muscleData[group].sessions += 1;
    if(!muscleData[group].lastDate || w.date > muscleData[group].lastDate) {
     muscleData[group].lastDate = w.date;
    }
   });

   const allMuscleLastDate = {};
   window.workouts.filter(w => w.category === 'strength').forEach(w => {
    const group = detectMuscleGroup(w.exercise);
    if(!group) return;
    if(!allMuscleLastDate[group] || w.date > allMuscleLastDate[group]) {
     allMuscleLastDate[group] = w.date;
    }
   });

   if(Object.keys(allMuscleLastDate).length === 0) {
    grid.innerHTML = '';
    if(empty) empty.classList.remove('hidden');
    return;
   }
   if(empty) empty.classList.add('hidden');

   const maxVol = Math.max(...Object.values(muscleData).map(d => d.volume), 1);

   const allGroups = Object.keys(MUSCLE_COLORS);
   grid.innerHTML = allGroups.map(group => {
    const data = muscleData[group];
    const lastDate = allMuscleLastDate[group];
    const color = MUSCLE_COLORS[group].active;
    const icon = MUSCLE_COLORS[group].icon;

    const intensity = data ? Math.min(data.volume / maxVol, 1) : 0;
    const hasRecent = !!data;

    let lastStr = '—';
    if(lastDate) {
     const days = Math.floor((now - new Date(lastDate)) / (1000*60*60*24));
     if(days === 0) lastStr = 'Heute';
     else if(days === 1) lastStr = 'Gestern';
     else if(days <= 7) lastStr = `vor ${days}d`;
     else if(days <= 14) lastStr = 'vor 2 Wo';
     else if(days <= 30) lastStr = `vor ${Math.floor(days/7)} Wo`;
     else lastStr = `vor ${Math.floor(days/30)} Mo`;
    }

    const glowAlpha = hasRecent ? (0.15 + intensity * 0.35).toFixed(2) : 0;
    const borderAlpha = hasRecent ? (0.2 + intensity * 0.4).toFixed(2) : '0.08';
    const bgStyle = hasRecent
     ? `background:color-mix(in srgb, ${color}, var(--inner-bg-hex) ${Math.round((1-intensity)*85)}%);border:1px solid color-mix(in srgb, ${color} ${Math.round(parseFloat(borderAlpha)*100)}%, transparent)`
     : `background:var(--inner-bg-hex);border:1px solid var(--border-hex)`;

    const textColor = hasRecent ? color : 'var(--text-muted)';

    return `<div class="rounded-2xl p-4 transition-all" style="${bgStyle}${hasRecent && intensity > 0.3 ? `;box-shadow:0 0 20px color-mix(in srgb, ${color} ${Math.round(parseFloat(glowAlpha)*100)}%, transparent)` : ''}">
     <div class="flex items-start justify-between mb-2">
      <i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0" style="color:${textColor}"></i>
      ${hasRecent ? `<span class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full" style="background:color-mix(in srgb,${color} 15%,transparent);color:${color}">${data.sessions}×</span>` : ''}
     </div>
     <p class="font-black text-white text-sm mt-1" style="font-family:'Barlow Condensed',sans-serif;letter-spacing:0.03em">${group}</p>
     <p class="text-[10px] font-bold mt-0.5" style="color:${hasRecent ? textColor : 'var(--text-muted)'}opacity:0.7">${lastStr}</p>
     ${hasRecent ? `<div class="mt-2 h-1 rounded-full overflow-hidden" style="background:color-mix(in srgb,${color} 12%,transparent)">
      <div class="h-full rounded-full transition-all" style="width:${Math.round(intensity*100)}%;background:${color}"></div>
     </div>` : ''}
    </div>`;
   }).join('');

   window._refreshLucide();
  };

  let _calYear = new Date().getFullYear();
  let _calMonth = new Date().getMonth();
  window._getMonthNames = function() {
   var lang = window.currentLang || 'de';
   var m = { de:['Januar','Februar','M\u00e4rz','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'], en:['January','February','March','April','May','June','July','August','September','October','November','December'], fr:['Janvier','F\u00e9vrier','Mars','Avril','Mai','Juin','Juillet','Ao\u00fbt','Septembre','Octobre','Novembre','D\u00e9cembre'], es:['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'], it:['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'], nl:['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'], ar:['\u064a\u0646\u0627\u064a\u0631','\u0641\u0628\u0631\u0627\u064a\u0631','\u0645\u0627\u0631\u0633','\u0623\u0628\u0631\u064a\u0644','\u0645\u0627\u064a\u0648','\u064a\u0648\u0646\u064a\u0648','\u064a\u0648\u0644\u064a\u0648','\u0623\u063a\u0633\u0637\u0633','\u0633\u0628\u062a\u0645\u0628\u0631','\u0623\u0643\u062a\u0648\u0628\u0631','\u0646\u0648\u0641\u0645\u0628\u0631','\u062f\u064a\u0633\u0645\u0628\u0631'] };
   return m[lang] || m.de;
  };
  window._getShortMonthNames = function() { return window._getMonthNames().map(function(n) { return n.substring(0, 3); }); };
  window._getDayNames = function() {
   var lang = window.currentLang || 'de';
   var d = { de:['Mo','Di','Mi','Do','Fr','Sa','So'], en:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], fr:['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'], es:['Lun','Mar','Mi\u00e9','Jue','Vie','S\u00e1b','Dom'], it:['Lun','Mar','Mer','Gio','Ven','Sab','Dom'], nl:['Ma','Di','Wo','Do','Vr','Za','Zo'], ar:['\u0627\u062b\u0646','\u062b\u0644\u0627','\u0623\u0631\u0628','\u062e\u0645\u064a','\u062c\u0645\u0639','\u0633\u0628\u062a','\u0623\u062d\u062f'] };
   return d[lang] || d.de;
  };
  var MONTH_NAMES = window._getMonthNames();

  window.calendarPrevMonth = function() {
   _calMonth--;
   if(_calMonth < 0) { _calMonth = 11; _calYear--; }
   window.renderCalendar();
  };
  window.calendarNextMonth = function() {
   _calMonth++;
   if(_calMonth > 11) { _calMonth = 0; _calYear++; }
   window.renderCalendar();
  };

  window.renderCalendar = function() {
   const grid = document.getElementById('calendarGrid');
   const title = document.getElementById('calendarTitle');
   const detail = document.getElementById('calendarDayDetail');
   if(!grid || !title) return;

   title.textContent = `${MONTH_NAMES[_calMonth]} ${_calYear}`;
   if(detail) detail.classList.add('hidden');

   const workoutDays = {};
   window.workouts.forEach(w => {
    if(!w.date) return;
    const d = new Date(w.date);
    if(d.getFullYear() === _calYear && d.getMonth() === _calMonth) {
     const day = d.getDate();
     if(!workoutDays[day]) workoutDays[day] = [];
     workoutDays[day].push(w);
    }
   });

   const firstDay = new Date(_calYear, _calMonth, 1).getDay();
   const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mo=0
   const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();
   const today = new Date();
   const isCurrentMonth = today.getFullYear() === _calYear && today.getMonth() === _calMonth;
   const todayDay = today.getDate();

   let html = '';

   for(let i = 0; i < startOffset; i++) {
    html += `<div class="aspect-square"></div>`;
   }

   for(let day = 1; day <= daysInMonth; day++) {
    const hasWorkout = workoutDays[day];
    const count = hasWorkout ? hasWorkout.length : 0;
    const isToday = isCurrentMonth && day === todayDay;
    const isFuture = new Date(_calYear, _calMonth, day) > today;

    const intensity = Math.min(count / 4, 1);
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4';

    let cellStyle = '';
    let textStyle = 'color:var(--text-muted)';
    let dotHtml = '';

    if(isToday) {
     cellStyle = `background:color-mix(in srgb,${primary} 20%,transparent);border:1px solid color-mix(in srgb,${primary} 50%,transparent)`;
     textStyle = `color:${primary};font-weight:900`;
    } else if(hasWorkout) {
     cellStyle = `background:color-mix(in srgb,${primary} ${Math.round(8+intensity*22)}%,transparent);border:1px solid color-mix(in srgb,${primary} ${Math.round(15+intensity*30)}%,transparent)`;
     textStyle = 'color:var(--text-main)';
     if(count > 1) {
      dotHtml = `<div class="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">${Array.from({length:Math.min(count,3)},()=>`<div class="w-1 h-1 rounded-full" style="background:${primary}"></div>`).join('')}</div>`;
     }
    } else if(isFuture) {
     textStyle = 'color:var(--border-hex)';
    }

    html += `<div onclick="window.calendarDayClick(${day})"
     class="aspect-square rounded-xl flex flex-col items-center justify-center relative cursor-pointer pointer-events-auto transition-all hover:opacity-80 active:scale-95"
     style="${cellStyle || 'background:transparent'}">
     <span class="text-[11px] font-bold" style="${textStyle};font-family:'DM Sans',sans-serif">${day}</span>
     ${dotHtml}
     ${hasWorkout && count > 0 && !dotHtml ? `<div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style="background:${primary}"></div>` : ''}
    </div>`;
   }

   grid.innerHTML = html;
  };

  window.calendarDayClick = function(day) {
   const detail = document.getElementById('calendarDayDetail');
   const titleEl = document.getElementById('calendarDayTitle');
   const listEl = document.getElementById('calendarDayWorkouts');
   if(!detail || !titleEl || !listEl) return;

   const dayWorkouts = window.workouts.filter(w => {
    if(!w.date) return false;
    const d = new Date(w.date);
    return d.getFullYear() === _calYear && d.getMonth() === _calMonth && d.getDate() === day;
   });

   if(dayWorkouts.length === 0) { detail.classList.add('hidden'); return; }

   const dateStr = `${day}. ${MONTH_NAMES[_calMonth]} ${_calYear}`;
   titleEl.textContent = dateStr;

   const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4';

   listEl.innerHTML = dayWorkouts.map(w => {
    const ui = window.CAT_UI[w.category] || window.CAT_UI['main'];
    let dataStr = '';
    if(w.setDetails?.length > 0) dataStr = w.setDetails.map(s => `${s.reps}×${s.weight}kg`).join(' · ');
    else if(w.data) dataStr = Object.entries(w.data).slice(0,3).map(([k,v]) => `${window._escapeHtml(String(v))} ${window._escapeHtml(k)}`).join(' · ');

    return `<div class="flex items-center gap-3 py-2" style="border-bottom:1px solid var(--border-hex)">
     <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${ui.bg} ${ui.border} border">
      <i data-lucide="${ui.icon}" class="w-3 h-3 ${ui.color} pointer-events-none"></i>
     </div>
     <div class="flex-1 min-w-0">
      <p class="text-sm font-black text-white truncate" style="font-family:'Barlow Condensed',sans-serif">${window._escapeHtml(w.exercise)}</p>
      ${dataStr ? `<p class="text-[10px] font-bold mt-0.5 truncate" style="color:var(--text-muted)">${dataStr}</p>` : ''}
     </div>
    </div>`;
   }).join('');

   detail.classList.remove('hidden');
   window._refreshLucide();
   detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.renderPRDashboard = function() {
   const content = document.getElementById('prDashboardContent');
   const empty = document.getElementById('prDashboardEmpty');
   if(!content) return;

   const strengthWorkouts = window.workouts.filter(w => {
    if(w.category === 'strength') return true;
    if(w.data) {
     const vals = Object.values(w.data);
     return vals.some(v => typeof v === 'string' && (v.includes('kg') || parseFloat(v) > 0));
    }
    if(w.setDetails && w.setDetails.length > 0) return true;
    return false;
   });

   if(strengthWorkouts.length === 0) {
    content.innerHTML = '';
    if(empty) empty.classList.remove('hidden');
    return;
   }
   if(empty) empty.classList.add('hidden');

   const prMap = {};
   strengthWorkouts.forEach(w => {
    const key = w.exercise?.toLowerCase();
    if(!key) return;

    let bestWeight = 0;
    let bestVolume = 0;
    let bestReps = 0;

    if(w.setDetails && w.setDetails.length > 0) {
     w.setDetails.forEach(s => {
      const kg = parseFloat(s.weight) || 0;
      const reps = parseInt(s.reps) || 0;
      if(kg > bestWeight) { bestWeight = kg; bestReps = reps; }
      bestVolume += kg * reps;
     });
    } else if(w.maxWeight) {
     bestWeight = parseFloat(w.maxWeight) || 0;
     bestVolume = parseFloat(w.volume) || 0;
    }

    if(bestWeight === 0 && bestVolume === 0) return;

    if(!prMap[key] || bestWeight > prMap[key].weight) {
     prMap[key] = {
      exercise: w.exercise,
      weight: bestWeight,
      reps: bestReps,
      volume: bestVolume,
      date: w.date,
      category: w.category
     };
    }
   });

   const prs = Object.values(prMap).filter(p => p.weight > 0)
    .sort((a, b) => b.weight - a.weight);

   if(prs.length === 0) {
    content.innerHTML = '';
    if(empty) empty.classList.remove('hidden');
    return;
   }

   const calc1RM = (w, r) => r === 1 ? w : Math.round(w * (1 + r / 30));

   content.innerHTML = `
    <p class="text-[10px] font-bold uppercase tracking-widest mb-4" style="color:var(--text-muted)">
     ${prs.length} Bestleistung${prs.length > 1 ? 'en' : ''} · Nur Kraftsport
    </p>
    <div class="space-y-2">
     ${prs.map((pr, i) => {
      const orm = pr.reps > 0 ? calc1RM(pr.weight, pr.reps) : null;
      const dateStr = pr.date ? pr.date.substring(5).replace('-', '.') : '';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      return `<div onclick="window.openExerciseHistory('${window._escapeHtml(pr.exercise).replace(/'/g, "&#39;")}')"
       class="flex items-center gap-4 p-4 rounded-2xl cursor-pointer pointer-events-auto transition-all hover:opacity-80 active:scale-[0.99]"
       style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">
       <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
         ${medal ? `<span class="text-base">${medal}</span>` : `<span class="text-[10px] font-black text-zinc-600 w-5">#${i+1}</span>`}
         <p class="font-black text-white text-sm truncate">${window._escapeHtml(pr.exercise)}</p>
        </div>
        <p class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--text-muted);padding-left:${medal ? '28px' : '20px'}">${dateStr}</p>
       </div>
       <div class="text-right flex-shrink-0">
        <p class="text-xl font-black" style="color:var(--primary-hex);font-family:'Barlow Condensed',sans-serif">${pr.weight}<span class="text-sm ml-0.5 opacity-60">kg</span></p>
        ${orm ? `<p class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">1RM ~${orm}kg</p>` : ''}
       </div>
       <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600 flex-shrink-0 pointer-events-none"></i>
      </div>`;
     }).join('')}
    </div>
   `;
   window._refreshLucide();
  };

  window.openExerciseHistory = function(exerciseName) {
   window._ensureChartJS().catch(e => { console.error('Chart.js laden fehlgeschlagen:', e); if(window.showToast) window.showToast('Analytics konnten nicht geladen werden', 'warn'); });
   const modal = document.getElementById('exerciseHistoryModal');
   if(!modal) return;

   const title = document.getElementById('exHistoryTitle');
   const subtitle = document.getElementById('exHistorySubtitle');
   const list = document.getElementById('exHistoryList');
   const stats = document.getElementById('exHistoryStats');
   if(title) title.textContent = exerciseName;

   var _exHero = window._findExerciseInDB ? window._findExerciseInDB(exerciseName) : null;
   var heroContainer = document.getElementById('exHistoryHero');
   if (heroContainer) {
    if (_exHero && _exHero.id) {
     heroContainer.innerHTML = '<img src="' + window._getExerciseGifUrl(_exHero.id) + '" alt="" class="w-full h-32 object-cover rounded-xl" loading="lazy" onerror="this.parentElement.classList.add(\'hidden\')">';
     heroContainer.classList.remove('hidden');
    } else {
     heroContainer.classList.add('hidden');
     heroContainer.innerHTML = '';
    }
   }

   const entries = window.workouts
    .filter(w => w.exercise?.toLowerCase() === exerciseName.toLowerCase())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

   if(subtitle) subtitle.textContent = `${entries.length} Einheit${entries.length !== 1 ? 'en' : ''}`;

   const allWeights = entries.map(w => {
    if(w.setDetails?.length > 0) return Math.max(...w.setDetails.map(s => parseFloat(s.weight) || 0));
    return parseFloat(w.maxWeight) || 0;
   }).filter(v => v > 0);

   const prWeight = allWeights.length > 0 ? Math.max(...allWeights) : 0;
   const lastDate = entries.length > 0 ? entries[0].date?.substring(5).replace('-', '.') : '—';
   const totalSessions = entries.length;

   if(stats) stats.innerHTML = `
    <div class="text-center p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">
     <p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color:var(--text-muted)">Bestes Gewicht</p>
     <p class="text-lg font-black" style="color:var(--primary-hex);font-family:'Barlow Condensed',sans-serif">${prWeight > 0 ? prWeight + 'kg' : '—'}</p>
    </div>
    <div class="text-center p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">
     <p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color:var(--text-muted)">Einheiten</p>
     <p class="text-lg font-black text-white" style="font-family:'Barlow Condensed',sans-serif">${totalSessions}</p>
    </div>
    <div class="text-center p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">
     <p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color:var(--text-muted)">Zuletzt</p>
     <p class="text-lg font-black text-white" style="font-family:'Barlow Condensed',sans-serif">${lastDate}</p>
    </div>
   `;

   const chartEntries = [...entries].reverse().slice(-15); // letzte 15
   const chartWeights = chartEntries.map(w => {
    if(w.setDetails?.length > 0) return Math.max(...w.setDetails.map(s => parseFloat(s.weight) || 0));
    return parseFloat(w.maxWeight) || 0;
   });
   const chartLabels = chartEntries.map(w => w.date?.substring(5).replace('-', '.') || '');

   setTimeout(() => {
    const canvas = document.getElementById('exHistoryChart');
    if(!canvas) return;
    if(window._exHistoryChartInstance) { window._exHistoryChartInstance.destroy(); }
    if(chartWeights.some(v => v > 0)) {
     window._exHistoryChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
       labels: chartLabels,
       datasets: [{
        data: chartWeights,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4',
        backgroundColor: 'rgba(6,182,212,0.08)',
        borderWidth: 2,
        pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4',
        pointRadius: 3,
        tension: 0.3,
        fill: true
       }]
      },
      options: {
       responsive: true, maintainAspectRatio: false,
       plugins: { legend: { display: false } },
       scales: {
        x: { ticks: { color: '#71717a', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#71717a', font: { size: 9 }, callback: v => v + 'kg' }, grid: { color: 'rgba(255,255,255,0.04)' } }
       }
      }
     });
    }
   }, 100);

   if(list) list.innerHTML = entries.slice(0, 20).map(w => {
    let dataStr = '';
    if(w.setDetails?.length > 0) {
     dataStr = w.setDetails.map(s => `${s.reps}×${s.weight}kg`).join(' · ');
    } else if(w.data) {
     dataStr = Object.entries(w.data).map(([k, v]) => `${window._escapeHtml(k)}: ${window._escapeHtml(String(v))}`).join(' · ');
    }
    return `<div class="flex items-start gap-3 py-3" style="border-bottom:1px solid var(--border-hex)">
     <div class="text-center flex-shrink-0 w-10">
      <p class="text-[10px] font-black" style="color:var(--text-muted)">${w.date?.substring(5).replace('-', '.') || ''}</p>
     </div>
     <div class="flex-1 min-w-0">
      <p class="text-sm text-white font-semibold truncate">${dataStr || '—'}</p>
      ${w.sessionDuration ? `<p class="text-[10px] mt-0.5" style="color:var(--text-muted)">⏱ ${w.sessionDuration}</p>` : ''}
     </div>
     ${w.maxWeight ? `<p class="text-sm font-black flex-shrink-0" style="color:var(--primary-hex);font-family:'Barlow Condensed',sans-serif">${w.maxWeight}kg</p>` : ''}
    </div>`;
   }).join('');

   modal.classList.remove('hidden');
   modal.classList.add('flex');
   window._refreshLucide();
  };

  window._showPaywall = false; // Master-Schalter: false = alle Upgrade-UI versteckt
  window._aiCallsToday = 0;
  window._paywallActive = false;
  window._userIsPro = false;

  // === FEATURE GATING SYSTEM ===
  window._GATING_ACTIVE = false;
  window._FEATURE_LIMITS = {
   coach:     { max: 3, period: 'daily',   label: 'KI Coach',            labelKey: 'gateCoach' },
   plan:      { max: 1, period: 'monthly', label: 'Trainingsplan',       labelKey: 'gatePlan' },
   scan:      { max: 1, period: 'weekly',  label: 'KI Analyse/Scan',     labelKey: 'gateScan' },
   challenge: { max: 1, period: 'daily',   label: 'Challenge erstellen', labelKey: 'gateChallenge' },
   client:    { max: 2, period: 'total',   label: 'PT Kunden',           labelKey: 'gateClient' }
  };

  window._getFeatureUsage = function(feature) {
   var key = 'base_gate_' + feature;
   var raw = localStorage.getItem(key);
   if(!raw) return 0;
   try {
    var data = JSON.parse(raw);
    var limit = window._FEATURE_LIMITS[feature];
    if(!limit) return 0;
    if(limit.period === 'total') return data.count || 0;
    var now = new Date();
    if(limit.period === 'daily' && data.date !== now.toISOString().slice(0, 10)) return 0;
    if(limit.period === 'weekly') { var ws = new Date(now); ws.setDate(now.getDate() - now.getDay() + 1); if(!data.week || data.week !== ws.toISOString().slice(0, 10)) return 0; }
    if(limit.period === 'monthly' && (!data.month || data.month !== now.toISOString().slice(0, 7))) return 0;
    return data.count || 0;
   } catch(e) { return 0; }
  };

  window._incrementFeatureUsage = function(feature) {
   var key = 'base_gate_' + feature;
   var limit = window._FEATURE_LIMITS[feature];
   if(!limit) return;
   var now = new Date();
   var data = { count: window._getFeatureUsage(feature) + 1 };
   if(limit.period === 'daily') data.date = now.toISOString().slice(0, 10);
   if(limit.period === 'weekly') { var ws = new Date(now); ws.setDate(now.getDate() - now.getDay() + 1); data.week = ws.toISOString().slice(0, 10); }
   if(limit.period === 'monthly') data.month = now.toISOString().slice(0, 7);
   localStorage.setItem(key, JSON.stringify(data));
  };

  window._cleanupFeatureUsage = function() {
   var now = new Date();
   Object.keys(window._FEATURE_LIMITS).forEach(function(f) {
    var key = 'base_gate_' + f;
    var raw = localStorage.getItem(key);
    if(!raw) return;
    try {
     var data = JSON.parse(raw);
     var limit = window._FEATURE_LIMITS[f];
     if(limit.period === 'daily' && data.date && data.date !== now.toISOString().slice(0, 10)) localStorage.removeItem(key);
     if(limit.period === 'weekly') { var ws = new Date(now); ws.setDate(now.getDate() - now.getDay() + 1); if(data.week && data.week !== ws.toISOString().slice(0, 10)) localStorage.removeItem(key); }
     if(limit.period === 'monthly' && data.month && data.month !== now.toISOString().slice(0, 7)) localStorage.removeItem(key);
    } catch(e) { localStorage.removeItem(key); }
   });
  };

  window.checkFeatureGate = function(feature) {
   if(!window._GATING_ACTIVE) return true;
   if(window._userIsPro) return true;
   var limit = window._FEATURE_LIMITS[feature];
   if(!limit) return true;
   var usage = window._getFeatureUsage(feature);
   if(usage >= limit.max) { window._showUpgradePrompt(feature, limit); return false; }
   window._incrementFeatureUsage(feature);
   return true;
  };

  window._showUpgradePrompt = function(feature, limit) {
   var periodText = { daily: window.t('gateToday','heute'), weekly: window.t('gateWeek','diese Woche'), monthly: window.t('gateMonth','diesen Monat'), total: '' }[limit.period] || '';
   var label = limit.labelKey ? window.t(limit.labelKey, limit.label) : limit.label;
   var msg = label + ': ' + limit.max + 'x ' + periodText + ' ' + window.t('gateFree','im Free-Plan');
   var overlay = document.getElementById('featureGateOverlay');
   if(overlay) {
    var nameEl = document.getElementById('gateFeatureName');
    var infoEl = document.getElementById('gateLimitInfo');
    if(nameEl) nameEl.textContent = label;
    if(infoEl) infoEl.textContent = msg;
    overlay.classList.remove('hidden'); overlay.classList.add('flex');
    window._refreshLucide();
    return;
   }
   if(window.showPaywall) window.showPaywall();
  };

  window._closeFeatureGate = function() {
   var el = document.getElementById('featureGateOverlay');
   if(el) { el.classList.add('hidden'); el.classList.remove('flex'); }
  };

  setTimeout(function() { window._cleanupFeatureUsage(); }, 2000);

  var AI_FREE_LIMIT = 1;

  window._initPaywall = async function() {
   try {
    if(window._aiCheckPaywall) window._paywallActive = await window._aiCheckPaywall();
    if(window._aiGetUsage) window._aiCallsToday = await window._aiGetUsage();
   } catch(e) { console.error('Fehler in _initPaywall:', e); }
  };
  setTimeout(function() { if(window._initPaywall) window._initPaywall(); }, 3000);

  window.aiGate = async function() {
   if(!window._showPaywall) {
    if(window._aiTrackCall) await window._aiTrackCall();
    return true;
   }
   if(!window._paywallActive) {
    if(window._aiTrackCall) await window._aiTrackCall();
    return true;
   }
   if(window._userIsPro) {
    if(window._aiTrackCall) await window._aiTrackCall();
    return true;
   }
   var currentCount = window._aiCallsToday || 0;
   if(window._aiGetUsage) currentCount = await window._aiGetUsage();
   if(currentCount >= AI_FREE_LIMIT) {
    window.showPaywall();
    return false;
   }
   if(window._aiTrackCall) await window._aiTrackCall();
   return true;
  };

  window.showPaywall = function() {
   if(!window._showPaywall) return;
   var m = document.getElementById('paywallModal');
   if(m) { m.classList.remove('hidden'); m.classList.add('flex'); }
  };
  window.closePaywall = function() {
   var m = document.getElementById('paywallModal');
   if(m) { m.classList.add('hidden'); m.classList.remove('flex'); }
  };
  window.upgradeToPro = function() {
   window.showPaywall();
  };

  window.startCheckout = async function(plan) {
   if(!window._firebaseAuth || !window._firebaseAuth.currentUser) {
    window.showToast(window.t('toastError', 'Bitte zuerst Account verknüpfen'), 'error');
    window.closePaywall();
    window.toggleModal('authModal');
    return;
   }
   const user = window._firebaseAuth.currentUser;
   if(user.isAnonymous) {
    window.showToast(window.t('toastError', 'Bitte zuerst Account mit E-Mail verknüpfen'), 'error');
    window.closePaywall();
    window.toggleModal('authModal');
    return;
   }

   try {
    window.showToast(window.t('aiAnalyzing', 'Weiterleitung zu Stripe...'));
    var _stripeCtrl = new AbortController(); var _stripeTimeout = setTimeout(function() { _stripeCtrl.abort(); }, 15000);
    const res = await fetch('/.netlify/functions/stripe-checkout', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     signal: _stripeCtrl.signal,
     body: JSON.stringify({
      plan: plan,
      userId: user.uid,
      userEmail: user.email || ''
     })
    });
    clearTimeout(_stripeTimeout);
    if (!res.ok) throw new Error('Stripe error: ' + res.status);
    const data = await res.json();
    if(data.url) {
     window.location.href = data.url;
    } else {
     window.showToast(data.error || 'Checkout fehlgeschlagen', 'error');
    }
   } catch(e) {
    console.error('Stripe Checkout Error:', e);
    window.showToast(window.t('toastError', 'Verbindungsfehler'), 'error');
   }
  };

  window._handleStripeCallback = function() {
   const params = new URLSearchParams(window.location.search);
   const stripeStatus = params.get('stripe');
   if(stripeStatus === 'success') {
    window.showToast(window.t('toastUpdate', 'Zahlung erfolgreich!'));
    setTimeout(() => { if(window._loadSubscriptionStatus) window._loadSubscriptionStatus(); }, 2000);
    window.history.replaceState({}, '', window.location.pathname);
   } else if(stripeStatus === 'cancel') {
    window.showToast(window.t('toastError', 'Zahlung abgebrochen'));
    window.history.replaceState({}, '', window.location.pathname);
   }
  };
  window.addEventListener('load', () => { window._handleStripeCallback(); });

  window._updatePlanUI = function(plan) {
   const nameEl = document.getElementById('menuPlanName');
   const statusEl = document.getElementById('menuPlanStatus');
   const row = document.getElementById('subscriptionPlanRow');
   if(!nameEl || !statusEl) return;
   if(row) { if(window._showPaywall) row.classList.remove('hidden'); else row.classList.add('hidden'); }

   const plans = {
    free: { name: 'Free Plan', status: 'Upgrade verfügbar', color: 'amber' },
    pro: { name: 'BASE PRO', status: 'Aktiv', color: 'amber' },
    elite_trainer: { name: 'Elite Trainer', status: 'Aktiv', color: 'indigo' }
   };
   const p = plans[plan] || plans.free;
   nameEl.textContent = p.name;
   statusEl.textContent = p.status;

   const btn = row?.querySelector('button');
   if(btn && plan !== 'free') {
    btn.onclick = null; // Kein Upgrade-Dialog für aktive Subscriber
    statusEl.textContent = 'Aktiv';
    const icon = btn.querySelector('[data-lucide="chevron-right"]');
    if(icon) icon.remove();
   }
  };

  window._userSubscriptionPlan = 'free';

  const VAPID_PUBLIC_KEY = 'BL_6HXCJ2EZF1nG40_oIQoJGdEFqieeU0x7t8aI3CMTwbvYxsKROg-UmfOZx1tqqXyeNiIlE8lIlE9ZPXAp_u-c';

  function urlBase64ToUint8Array(base64String) {
   const padding = '='.repeat((4 - base64String.length % 4) % 4);
   const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
   const rawData = window.atob(base64);
   const outputArray = new Uint8Array(rawData.length);
   for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
   return outputArray;
  }

  window.setupPushSubscription = async function() {
   try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
     sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
     });
    }
    localStorage.setItem('base_push_subscribed', 'true');
    if(window._pushSaveSub) {
     var subJson = sub.toJSON();
     window._pushSaveSub({
      subscription: subJson,
      enabled: true,
      lastWorkout: null,
      weeklyCount: 0,
      streak: 0,
      updatedAt: new Date().toISOString()
     });
    }
    window.showToast('Erinnerungen aktiviert!');
   } catch(e) { console.error('Push Setup Fehler:', e); }
  };

  window.requestPushPermission = async function(silent = false) {
   if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return;
   if (Notification.permission === 'denied') return;
   if (Notification.permission === 'granted') { await window.setupPushSubscription(); return; }
   if (!silent) {
    if (typeof window.showModal === 'function') {
     window.showModal('🔔 Trainings-Erinnerungen aktivieren?',
      'BASE erinnert dich smart: Streak in Gefahr, Wochenrückblick, Comeback-Nudge. Kein Spam — max. 1x täglich.',
      true, async () => { await window.setupPushSubscription(); });
    } else { await window.setupPushSubscription(); }
   }
  };

  window.updatePushToggleUI = async function() {
   const toggle = document.getElementById('pushToggle');
   const statusText = document.getElementById('pushStatusText');
   if (!toggle || !statusText) return;
   if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    statusText.textContent = window.t('pushNotAvailable','Nicht verfügbar in diesem Browser');
    toggle.disabled = true; return;
   }
   if (typeof Notification === 'undefined' || Notification.permission === 'denied') {
    statusText.textContent = typeof Notification === 'undefined' ? 'Nicht verfügbar in diesem Browser' : window.t('pushBlocked','In Einstellungen blockiert');
    toggle.checked = false; toggle.disabled = true; return;
   }
   const isSubscribed = !!localStorage.getItem('base_push_subscribed');
   toggle.checked = isSubscribed && Notification.permission === 'granted';
   statusText.textContent = toggle.checked ? window.t('reminderActive','Aktiv — max. 1x täglich') : window.t('lblDisabled','Deaktiviert');
  };

  window.handlePushRowClick = async function() {
   const toggle = document.getElementById('pushToggle');
   const isActive = localStorage.getItem('base_push_subscribed');
   if (isActive) {
    try {
     const reg = await navigator.serviceWorker.ready;
     const sub = await reg.pushManager.getSubscription();
     if (sub) await sub.unsubscribe();
    } catch(e) { console.error('Fehler beim Push-Unsubscribe (handlePushRowClick):', e); }
    localStorage.removeItem('base_push_subscribed');
    localStorage.removeItem('base_push_last_sent');
    if (toggle) toggle.checked = false;
    const statusText = document.getElementById('pushStatusText');
    if (statusText) statusText.textContent = window.t('lblDisabled','Deaktiviert');
    window.showToast(window.t('lblDisabled','Erinnerungen deaktiviert'));
    if(window._pushSaveSub) window._pushSaveSub({ enabled: false });
   } else {
    try {
     window.showToast('⏳ Wird aktiviert...');
     const reg = await navigator.serviceWorker.ready;
     let sub = await reg.pushManager.getSubscription();
     if (!sub) {
      sub = await reg.pushManager.subscribe({
       userVisibleOnly: true,
       applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
     }
     localStorage.setItem('base_push_subscribed', 'true');
     if (toggle) toggle.checked = true;
     const statusText = document.getElementById('pushStatusText');
     if (statusText) statusText.textContent = window.t('reminderActive','Aktiv — max. 1x täglich');
     window.showToast('Erinnerungen aktiviert!');
     if(window._pushSaveSub && sub) {
      window._pushSaveSub({
       subscription: sub.toJSON(),
       enabled: true,
       updatedAt: new Date().toISOString()
      });
     }
    } catch(e) { window.showToast('Fehler: ' + e.message); }
   }
  };

  window.togglePushNotifications = async function(enable) {
   if (enable) { await window.setupPushSubscription(); }
   else {
    try {
     const reg = await navigator.serviceWorker.ready;
     const sub = await reg.pushManager.getSubscription();
     if (sub) await sub.unsubscribe();
    } catch(e) { console.error('Fehler beim Push-Unsubscribe (togglePush):', e); }
    localStorage.removeItem('base_push_subscribed');
    localStorage.removeItem('base_push_last_sent');
    const statusText = document.getElementById('pushStatusText');
    if (statusText) statusText.textContent = window.t('lblDisabled','Deaktiviert');
    window.showToast(window.t('toastUpdate', window.t('lblDisabled','Erinnerungen deaktiviert')));
   }
  };

  window.checkDailyPushLogic = async function() {
   if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
   if (!localStorage.getItem('base_push_subscribed')) return;
   var lastSent = localStorage.getItem('base_push_last_sent');
   var now = new Date();
   if (lastSent && (now - new Date(lastSent)) / (1000 * 60 * 60) < 20) return;
   var hour = now.getHours();
   if (hour < 8 || hour > 21) return;

   try {
    var reg = await navigator.serviceWorker.ready;
    var sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    var notification = window._getSmartNotification();
    if (!notification) return;

    var _pushCtrl = new AbortController(); var _pushTimeout = setTimeout(function() { _pushCtrl.abort(); }, 15000);
    var res = await fetch('/.netlify/functions/push', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     signal: _pushCtrl.signal,
     body: JSON.stringify({
      subscription: sub.toJSON(),
      notification: notification,
      internalSecret: 'BASE_PUSH_2026'
     })
    });
    clearTimeout(_pushTimeout);
    if (!res.ok) throw new Error('Push error: ' + res.status);
    var raw = await res.text();
    try { var data = JSON.parse(raw); } catch(e) { console.error('Fehler beim Parsen der Push-Antwort:', e); }

    localStorage.setItem('base_push_last_sent', now.toISOString());
   } catch(e) { console.error('Push send error:', e); }
  };

  window._getSmartNotification = function() {
   var now = new Date();
   var today = now.toISOString().slice(0, 10);
   var archivedWorkouts = (window.workouts || []).filter(function(w) { return w.archived; });

   var lastWorkoutDate = null;
   var trainDates = new Set();
   archivedWorkouts.forEach(function(w) {
    if(w.date) trainDates.add(w.date);
    var d = new Date(parseInt(w.id));
    if(!lastWorkoutDate || d > lastWorkoutDate) lastWorkoutDate = d;
   });

   var daysSinceLast = lastWorkoutDate ? Math.floor((now - lastWorkoutDate) / 86400000) : 999;

   var getWeekKey = function(date) {
    var d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var week1 = new Date(d.getFullYear(), 0, 4);
    var weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return d.getFullYear() + '-' + weekNum;
   };
   var trainedWeeks = new Set();
   archivedWorkouts.forEach(function(w) { if(w.date) trainedWeeks.add(getWeekKey(new Date(w.date))); });
   var streak = 0;
   var check = new Date(now);
   for(var i = 0; i < 52; i++) {
    var key = getWeekKey(check);
    if(trainedWeeks.has(key)) { streak++; check.setDate(check.getDate() - 7); }
    else if(i === 0) { check.setDate(check.getDate() - 7); continue; }
    else break;
   }

   var weekStart = new Date(now);
   weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
   weekStart.setHours(0,0,0,0);
   var thisWeekCount = archivedWorkouts.filter(function(w) {
    return new Date(parseInt(w.id)) >= weekStart;
   }).length;

   if(trainDates.has(today)) return null;

   var dayOfWeek = now.getDay(); // 0=So, 6=Sa

   if(dayOfWeek === 0 && thisWeekCount === 0 && streak > 0) {
    return {
     title: 'Streak in Gefahr!',
     body: 'Dein ' + streak + '-Wochen Streak endet heute wenn du nicht trainierst!',
     tag: 'streak-warning'
    };
   }

   if(daysSinceLast >= 3 && daysSinceLast < 14) {
    var msgs = [
     'Dein Körper ist erholt — perfekter Tag für ein Workout!',
     daysSinceLast + ' Tage Pause — heute ist der Tag!',
     'Dein ZNS hat sich erholt. Zeit für neue Bestleistungen!'
    ];
    return {
     title: 'Zeit für ein Comeback',
     body: msgs[Math.floor(Math.random() * msgs.length)],
     tag: 'comeback'
    };
   }

   if(daysSinceLast >= 14) {
    return {
     title: 'Wir vermissen dich!',
     body: 'Schon ' + daysSinceLast + ' Tage nicht trainiert. Ein kurzes Workout reicht — 20 Minuten!',
     tag: 'comeback-long'
    };
   }

   if((dayOfWeek === 3 || dayOfWeek === 4) && thisWeekCount < 2) {
    return {
     title: 'Wochenziel erreichbar',
     body: 'Erst ' + thisWeekCount + 'x diese Woche trainiert — noch ' + (3 - thisWeekCount) + ' Einheiten für dein Minimum!',
     tag: 'week-goal'
    };
   }

   if(streak >= 3 && thisWeekCount === 0 && dayOfWeek >= 1 && dayOfWeek <= 3) {
    return {
     title: streak + ' Wochen am Stück!',
     body: 'Lass die Serie nicht reißen — heute ist ein guter Tag!',
     tag: 'streak-keep'
    };
   }

   if(daysSinceLast >= 1 && daysSinceLast <= 2 && hour >= 16) {
    var nudges = [
     'Bereit für die nächste Einheit?',
     'Gestern war stark — heute noch stärker?',
     'Dein nächstes Workout wartet!'
    ];
    return {
     title: 'Training heute?',
     body: nudges[Math.floor(Math.random() * nudges.length)],
     tag: 'daily-nudge'
    };
   }

   return null; // Kein Push nötig
  };

  setTimeout(function() { if(window.checkDailyPushLogic) window.checkDailyPushLogic(); }, 5000);

  window._pushUpdateTrainingStats = function() {
   if(!window._pushUpdateTraining) return;
   if(!localStorage.getItem('base_push_subscribed')) return;
   var archived = (window.workouts || []).filter(function(w) { return w.archived; });
   var lastWorkout = null;
   archived.forEach(function(w) {
    var d = new Date(parseInt(w.id));
    if(!lastWorkout || d > lastWorkout) lastWorkout = d;
   });
   var getWeekKey = function(date) {
    var d = new Date(date); d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var w1 = new Date(d.getFullYear(), 0, 4);
    var wn = 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
    return d.getFullYear() + '-' + wn;
   };
   var trainedWeeks = new Set();
   archived.forEach(function(w) { if(w.date) trainedWeeks.add(getWeekKey(new Date(w.date))); });
   var streak = 0;
   var check = new Date();
   for(var i = 0; i < 52; i++) {
    if(trainedWeeks.has(getWeekKey(check))) { streak++; check.setDate(check.getDate() - 7); }
    else if(i === 0) { check.setDate(check.getDate() - 7); }
    else break;
   }
   var weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); weekStart.setHours(0,0,0,0);
   var weeklyCount = archived.filter(function(w) { return new Date(parseInt(w.id)) >= weekStart; }).length;

   window._pushUpdateTraining({
    lastWorkout: lastWorkout ? lastWorkout.toISOString() : null,
    streak: streak,
    weeklyCount: weeklyCount,
    updatedAt: new Date().toISOString()
   });
  };

  window.renderTableFilters = function() { const container = document.getElementById('timelineFiltersContainer'); if(!container) return; let html = `<button onclick="window.filterTable('all')" class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${window.currentTableFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'} transition-colors shadow-sm flex-shrink-0 cursor-pointer pointer-events-auto interactive-z">${window.t('lblAll','Alle')}</button>`; ['strength', 'cardio', 'recovery', 'main'].forEach(c => { if(window.userProfile.modules && (window.userProfile.modules[c] === true || (c === 'strength' && window.userProfile.modules.strength !== false))) { const isActive = window.currentTableFilter === c; const title = i18nData[window.currentLang] ? (i18nData[window.currentLang][`tab${c.charAt(0).toUpperCase() + c.slice(1,3)}`] || window.CAT_UI[c].name) : window.CAT_UI[c].name; html += `<button onclick="window.filterTable('${c}')" class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'} transition-colors shadow-sm flex-shrink-0 cursor-pointer pointer-events-auto interactive-z">${title}</button>`; } }); container.innerHTML = html; };
  window.updateExerciseAutocomplete = function() {
   const list = document.getElementById('exerciseListV2');
   if(!list) return;
   var seen = new Set();
   var options = [];
   // 1. Vergangene Workouts (höchste Priorität — User-eigene Übungen zuerst)
   if (Array.isArray(window.workouts)) {
    var filtered = window.currentCategory === 'all'
     ? window.workouts
     : window.workouts.filter(function(w) { return w.category === window.currentCategory; });
    filtered.forEach(function(w) {
     if (w.exercise && !seen.has(w.exercise.toLowerCase())) {
      seen.add(w.exercise.toLowerCase());
      options.push(w.exercise);
     }
    });
   }
   // 2. Exercise-DB (882 Übungen) — für Kraft-Kategorie
   if ((window.currentCategory === 'strength' || window.currentCategory === 'all') && window.EXERCISE_DB) {
    var lang = window.currentLang || 'de';
    window.EXERCISE_DB.forEach(function(ex) {
     var name = lang === 'de' ? (ex.de || ex.n) : (ex.n || ex.de);
     if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      options.push(name);
     }
    });
   }
   // 3. Mobility-Übungen
   if (window.currentCategory === 'recovery' && window._MOBILITY_EXERCISES) {
    window._MOBILITY_EXERCISES.forEach(function(ex) {
     if (!seen.has(ex.toLowerCase())) { seen.add(ex.toLowerCase()); options.push(ex); }
    });
   }
   options.sort();
   list.innerHTML = options.map(function(ex) { return '<option value="' + window._escapeHtml(ex) + '">'; }).join('');
  };
  window._tableSortKey = null;
  window._tableSortAsc = true;
  window.sortTable = function(key) {
   if(window._tableSortKey === key) { window._tableSortAsc = !window._tableSortAsc; }
   else { window._tableSortKey = key; window._tableSortAsc = true; }
   ['date','exercise','weight'].forEach(k => { const th = document.getElementById('sortTh_'+k); if(th) th.setAttribute('aria-sort', k === key ? (window._tableSortAsc ? 'ascending' : 'descending') : 'none'); });
   window.renderTable();
  };
  window.renderTable = function() { const body = document.getElementById('historyTableBody'); const mobileList = document.getElementById('mobileCardList'); if(!body) return; body.innerHTML = ''; if(mobileList) mobileList.innerHTML = ''; if(!Array.isArray(window.workouts)) return; let preparedWorkouts = window.workouts.map(w => { if(w.id && String(w.id).startsWith('strava_')) w.category = 'cardio'; return w; }); let filteredWorkouts = preparedWorkouts; if (window.currentTableFilter !== 'all') filteredWorkouts = preparedWorkouts.filter(w => w.category === window.currentTableFilter); filteredWorkouts = filteredWorkouts.filter(w => window.currentView === 'active' ? !w.archived : w.archived); if(window._tableSortKey) { const dir = window._tableSortAsc ? 1 : -1; filteredWorkouts.sort((a, b) => { if(window._tableSortKey === 'date') { return dir * (a.date || '').localeCompare(b.date || ''); } else if(window._tableSortKey === 'exercise') { return dir * (a.exercise || '').localeCompare(b.exercise || ''); } else if(window._tableSortKey === 'weight') { return dir * ((a.maxWeight || 0) - (b.maxWeight || 0)); } return 0; }); } const reversed = window._tableSortKey ? filteredWorkouts : [...filteredWorkouts].reverse(); const hist = {}; reversed.forEach(w => { const k = w.category + '_' + w.exercise.toLowerCase(); w.progressBadge = ''; if(hist[k]) { const l = hist[k]; if (w.category === 'strength') { let curV = w.volume || 0, lastV = l.volume || 0; let curW = w.maxWeight || 0, lastW = l.maxWeight || 0; if (curW > lastW && lastW > 0) { const pct = (((curW - lastW) / lastW) * 100).toFixed(1); w.progressBadge = `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-1.5 py-0.5 rounded-full shadow-sm ml-2">+${pct}% kg</span>`; } else if (curW < lastW && lastW > 0) { const pct = (((lastW - curW) / lastW) * 100).toFixed(1); w.progressBadge = `<span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] px-1.5 py-0.5 rounded-full shadow-sm ml-2">-${pct}% kg</span>`; } } else if (w.category === 'cardio' && w.data && l.data) { let curDist = parseFloat((w.data['Distanz (km)'] || w.data['Distanz'] || '0').toString().replace(',','.')); let lastDist = parseFloat((l.data['Distanz (km)'] || l.data['Distanz'] || '0').toString().replace(',','.')); if(curDist > lastDist && lastDist > 0) { w.progressBadge = `<span class="bg-[#fc4c02]/10 text-[#fc4c02] border border-[#fc4c02]/20 text-[10px] px-1.5 py-0.5 rounded-full shadow-sm ml-2">+${(curDist - lastDist).toFixed(2)} km</span>`; } } } hist[k] = w; }); let lastSessionId = null; filteredWorkouts.forEach(w => { if (window.currentView === 'archive' && w.archived && w.sessionId && w.sessionId !== lastSessionId) { if (w.sessionDuration || w.sessionComment) { const sessionTr = document.createElement('tr'); sessionTr.className = "bg-primary/5 border-b border-primary/20"; sessionTr.innerHTML = `<td colspan="4" class="p-3 px-5 shadow-sm"><div class="flex items-center justify-between"><div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">${w.sessionDuration ? `<span class="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-widest"><i data-lucide="timer" class="w-3.5 h-3.5"></i> ${w.sessionDuration}</span>` : ''}${w.sessionComment ? `<span class="text-[11px] text-zinc-300 italic flex items-center gap-1.5"><i data-lucide="message-square" class="w-3.5 h-3.5 text-zinc-500"></i> "${window._escapeHtml(w.sessionComment)}"</span>` : ''}</div><button onclick="window.shareWorkout(this.dataset.wid)" data-wid="${window._escapeHtml(w.id)}" class="text-[10px] font-black bg-primary/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded uppercase tracking-widest hover:bg-primary/20 transition-colors flex items-center gap-1 shadow-sm cursor-pointer pointer-events-auto interactive-z"><i data-lucide="share-2" class="w-3 h-3"></i> Posten</button></div></td>`; body.appendChild(sessionTr); } lastSessionId = w.sessionId; } let dataHtml = ""; if (w.category === 'strength' && w.setDetails && w.setDetails.length > 0) { dataHtml = `<div class="flex flex-wrap gap-2">`; w.setDetails.forEach((s, i) => { var _tc = {warmup:'#e8c86a',dropset:'#8aafe8',failure:'#e88a8a'}; var _tb = (s.type && s.type !== 'normal') ? '<span style="font-size:7px;font-weight:800;color:'+(_tc[s.type]||'#666')+';margin-left:3px;text-transform:uppercase">'+s.type+'</span>' : ''; dataHtml += `<span class="bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-zinc-700">${s.reps}x${s.weight}kg${s.rir != null ? '<span class="ml-1 text-[8px]" style="color:var(--primary-hex)">R'+s.rir+'</span>' : ''}${_tb}</span>`; }); dataHtml += `</div>`; } else if(w.data) { const keys = Object.keys(w.data); const det = keys.map(k => `<div class="flex flex-col mb-1 sm:mb-0 mr-4"><span class="text-[9px] text-zinc-500 uppercase font-black tracking-widest">${window._escapeHtml(k)}</span><span class="text-white font-bold text-xs">${window._escapeHtml(String(w.data[k]))}</span></div>`).join(''); dataHtml = `<div class="flex flex-wrap items-center">${det}</div>`; } let sportCatDisplay = w.sportCategory || 'Aktivität'; if(w.category === 'strength') sportCatDisplay = w.equipment || 'Krafttraining'; else if(w.category === 'cardio') sportCatDisplay = w.sportCategory || 'Ausdauer'; const cat = w.category || 'main'; const ui = window.CAT_UI[cat] || window.CAT_UI['main']; const isStrava = w.id && String(w.id).startsWith('strava_'); const stravaBadge = isStrava ? `<span class="bg-[#fc4c02]/20 text-[#fc4c02] text-[9px] uppercase font-black px-1.5 py-0.5 rounded ml-2">Strava</span>` : ''; const tr = document.createElement('tr'); tr.className = "hover:bg-white/5 border-b border-zinc-800/40 transition-colors group"; tr.innerHTML = ` <td class="px-5 py-4 shadow-sm"><div class="flex flex-col gap-1"><span class="text-zinc-500 text-[10px] font-black italic">${w.date.substring(5)}</span><span class="inline-flex items-center justify-center w-6 h-6 rounded border ${ui.bg} ${ui.border} ${ui.color}"><i data-lucide="${ui.icon}" class="w-3 h-3"></i></span></div></td> <td class="px-5 py-4 shadow-sm"><div class="flex flex-col"><span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5 flex items-center">${window._escapeHtml(sportCatDisplay)} ${stravaBadge}</span><span onclick="event.stopPropagation(); window.openExerciseHistory('${window._escapeHtml(w.exercise).replace(/'/g, "&#39;")}')" class="font-bold text-white text-sm tracking-tight flex items-center cursor-pointer pointer-events-auto hover:text-primary transition-colors">${w.isSuperset ? '<span style="color:#8aafe8;margin-right:4px" title="Superset">\u26D3</span>' : ''}${window._escapeHtml(w.exercise)} ${w.progressBadge || ''}${w.supersetExercise ? '<span style="font-size:9px;padding:1px 6px;border-radius:4px;background:rgba(138,175,232,0.15);color:#8aafe8;font-weight:700;margin-left:6px">+ ' + window._escapeHtml(w.supersetExercise) + '</span>' : ''}</span></div></td> <td class="px-5 py-4 shadow-sm">${dataHtml}</td> <td class="px-5 py-4 text-right whitespace-nowrap"><button aria-label="Teilen" onclick="window.shareWorkout(this.dataset.wid)" data-wid="${window._escapeHtml(w.id)}" class="text-zinc-600 hover:text-primary transition-all p-2 cursor-pointer pointer-events-auto interactive-z"><i data-lucide="share-2" class="w-4 h-4 pointer-events-none"></i></button>${!isStrava && !w.archived ? `<button aria-label="Edit 2" onclick="window.editEntry(this.dataset.wid)" data-wid="${window._escapeHtml(w.id)}" class="text-zinc-600 hover:text-primary transition-all p-2 opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto interactive-z"><i data-lucide="edit-2" class="w-4 h-4 pointer-events-none"></i></button>` : ''}<button aria-label="Löschen" onclick="window.deleteEntry(this.dataset.wid)" data-wid="${window._escapeHtml(w.id)}" class="text-zinc-600 hover:text-rose-500 transition-all p-2 cursor-pointer pointer-events-auto interactive-z"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button></td> `; body.appendChild(tr);
  if(mobileList) {
    const card = document.createElement('div');
    card.className = 'relative rounded-2xl p-5 transition-all group hover:-translate-y-0.5';
    card.style.cssText = 'background:var(--surface-hex);border:1px solid var(--border-hex)';

    let setsDisplay = '';
    let weightDisplay = '';
    if (w.category === 'strength' && w.setDetails && w.setDetails.length > 0) {
  const totalSets = w.setDetails.length;
  const topSet = w.setDetails.reduce((best, s) => parseFloat(s.weight) > parseFloat(best.weight) ? s : best, w.setDetails[0]);
  const avgReps = Math.round(w.setDetails.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0) / totalSets);
  setsDisplay = totalSets + '×' + avgReps;
  weightDisplay = topSet.weight + 'kg';
    } else if (w.data) {
  const keys = Object.keys(w.data);
  if (keys.length >= 2) {
   setsDisplay = String(w.data[keys[0]] || '');
   weightDisplay = String(w.data[keys[1]] || '');
  } else if (keys.length === 1) {
   setsDisplay = String(w.data[keys[0]] || '');
  }
    }

    const dateObj = new Date(w.date + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    let dateStr = w.date.substring(5).replace('-', '.');
    if (dateObj.getTime() === today.getTime()) dateStr = 'Heute';
    else if (dateObj.getTime() === yesterday.getTime()) dateStr = 'Gestern';

    var _exDb = window._findExerciseInDB ? window._findExerciseInDB(w.exercise) : null;
    var _exThumb = (_exDb && _exDb.id) ? '<img src="' + window._getExerciseImageUrl(_exDb.id) + '" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0 inline-block mr-2 align-middle" loading="lazy" onerror="this.style.display=\'none\'">' : '';
    card.innerHTML = `
  <div class="flex justify-between items-start mb-3">
   <div class="flex-1 min-w-0">
    <p onclick="event.stopPropagation(); window.openExerciseHistory('${window._escapeHtml(w.exercise).replace(/'/g, "&#39;")}')" class="font-bold text-white text-[15px] tracking-tight cursor-pointer pointer-events-auto hover:text-primary transition-colors flex items-center" style="font-family:'Sora',sans-serif">${w.isSuperset ? '<span style="color:#8aafe8;margin-right:4px" title="Superset">\u26D3</span>' : ''}${_exThumb}${window._escapeHtml(w.exercise)}${w.bwMode ? '<span style="font-size:9px;padding:1px 5px;border-radius:4px;background:rgba(163,201,168,0.15);color:#a3c9a8;margin-left:4px;font-weight:700">BW</span>' : ''}</p>
    ${w.supersetExercise ? '<p style="font-size:10px;color:#8aafe8;margin-top:2px;padding-left:2px">+ ' + window._escapeHtml(w.supersetExercise) + ' <span style="font-size:8px;padding:1px 5px;border-radius:3px;background:rgba(138,175,232,0.12);color:#8aafe8;font-weight:700;margin-left:3px">SUPERSET</span></p>' : ''}
    <p class="text-[11px] mt-1" style="color:var(--text-muted);font-family:'Outfit',sans-serif">${dateStr}${w.sessionDuration ? ' · ' + w.sessionDuration : ''}</p>
   </div>
   <div class="flex items-center gap-2 flex-shrink-0">
    ${w.progressBadge || ''}
    <span class="w-8 h-8 rounded-full flex items-center justify-center" style="background:color-mix(in srgb, var(--primary-hex), transparent 90%);border:1px solid color-mix(in srgb, var(--primary-hex), transparent 85%)">
     <i data-lucide="${ui.icon}" class="w-3.5 h-3.5 pointer-events-none" style="color:var(--primary-hex)"></i>
    </span>
   </div>
  </div>
  ${(setsDisplay || weightDisplay) ? `
  <div class="flex items-center gap-4">
   ${setsDisplay ? `<div><span class="text-xl font-bold tracking-tight text-white" style="font-family:'Sora',sans-serif">${window._escapeHtml(setsDisplay)}</span><span class="text-xs ml-1.5" style="color:var(--text-muted)">${window.t('lblSets','Sätze')}</span></div>` : ''}
   ${setsDisplay && weightDisplay ? '<div class="h-6 w-px" style="background:rgba(255,255,255,0.06)"></div>' : ''}
   ${weightDisplay ? `<div><span class="text-xl font-bold tracking-tight text-white" style="font-family:'Sora',sans-serif">${window._escapeHtml(weightDisplay)}</span><span class="text-xs ml-1.5" style="color:var(--text-muted)">${window.t('lblWeight','Gewicht')}</span></div>` : ''}
  </div>` : ''}
  <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
   ${!isStrava && !w.archived ? `<button onclick="window.editEntry(this.dataset.wid)" data-wid="${window._escapeHtml(w.id)}" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><i data-lucide="edit-2" class="w-3 h-3 text-zinc-500 pointer-events-none"></i></button>` : ''}
   <button onclick="window.shareWorkout(this.dataset.wid)" data-wid="${window._escapeHtml(w.id)}" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><i data-lucide="share-2" class="w-3 h-3 text-zinc-500 pointer-events-none"></i></button>
   <button onclick="window.deleteEntry(this.dataset.wid)" data-wid="${window._escapeHtml(w.id)}" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><i data-lucide="trash-2" class="w-3 h-3 text-zinc-500 hover:text-rose-400 pointer-events-none"></i></button>
  </div>
    `;
    mobileList.appendChild(card);
} }); window._refreshLucide(); window.updateExerciseAutocomplete(); const emptyState = document.getElementById('emptyWorkoutState'); if(emptyState) { const hasRows = body.children.length > 0 || (mobileList && mobileList.children.length > 0); if(!hasRows) { emptyState.classList.remove('hidden'); emptyState.classList.add('block'); } else { emptyState.classList.add('hidden'); emptyState.classList.remove('block'); } } const vc = document.getElementById('verlaufCount'); if(vc) vc.textContent = filteredWorkouts.length + ' Sessions'; };
  (function() { var _origRT = window.renderTable; var _rtTimer = null; window.renderTable = function() { clearTimeout(_rtTimer); _rtTimer = setTimeout(_origRT, 50); }; })();
  document.body.addEventListener('click', function(e) { if(!e.target.closest('.workout-card-menu') && !e.target.closest('[onclick*="nextElementSibling"]')) { document.querySelectorAll('.workout-card-menu.show').forEach(m => m.classList.remove('show')); } });
  window.exportToCSV = () => { if(!Array.isArray(window.workouts) || window.workouts.length === 0) { window.showToast(window.t("toastNoData")); return; } let allDynamicKeys = new Set(); window.workouts.forEach(w => { if(w.data) Object.keys(w.data).forEach(k => allDynamicKeys.add(k)); }); const dynamicHeaders = Array.from(allDynamicKeys); let csv = "Datum;Kategorie;Sportart;Aktivitaet;Dauer;Notiz;" + dynamicHeaders.join(";") + "\n"; window.workouts.forEach(w => { let row = [ w.date || "", w.category || "", w.sportCategory || "", w.exercise || "", w.sessionDuration || "", (w.sessionComment || "").replace(/;/g, ',').replace(/\n/g, ' ') ]; dynamicHeaders.forEach(header => { let val = (w.data && w.data[header] !== undefined) ? w.data[header] : ""; row.push(String(val).replace(/;/g, ',')); }); csv += row.join(";") + "\n"; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `BASE_Export.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.showToast(window.t("toastExported")); };

  window.initAnalytics = function() { if(!Array.isArray(window.workouts)) return; if(window._renderMuscleBalance) window._renderMuscleBalance(); window._ensureChartJS().then(() => window._initAnalyticsCore()).catch(e => { console.error('Chart.js laden fehlgeschlagen:', e); if(window.showToast) window.showToast('Analytics konnten nicht geladen werden', 'warn'); }); };
  window._initAnalyticsCore = function() { const exSelect = document.getElementById('analyticsExercise'); const uniqueExercises = [...new Set(window.workouts.map(w => w.exercise))].filter(Boolean); if (uniqueExercises.length === 0) { exSelect.innerHTML = '<option value="">' + window.t('toastNoData','Keine Daten') + '</option>'; document.getElementById('analyticsMetric').innerHTML = '<option value="">-</option>'; if(window.v2ChartInstance) window.v2ChartInstance.destroy(); return; } const currentSelection = exSelect.value; exSelect.innerHTML = uniqueExercises.map(ex => `<option value="${window._escapeHtml(ex)}">${window._escapeHtml(ex)}</option>`).join(''); if (currentSelection && uniqueExercises.includes(currentSelection)) exSelect.value = currentSelection; window.updateAnalyticsMetrics(); }
  window.updateAnalyticsMetrics = function() { const selectedExercise = document.getElementById('analyticsExercise').value; const metricSelect = document.getElementById('analyticsMetric'); if(!selectedExercise || !Array.isArray(window.workouts)) return; const relevantWorkouts = window.workouts.filter(w => w.exercise === selectedExercise); let allKeys = new Set(); relevantWorkouts.forEach(w => { if(w.data) Object.keys(w.data).forEach(k => allKeys.add(k)); }); const keysArray = Array.from(allKeys); if (keysArray.length === 0) { metricSelect.innerHTML = '<option value="">' + window.t('noMetrics','Keine Metriken') + '</option>'; if(window.v2ChartInstance) window.v2ChartInstance.destroy(); return; } const currentMetric = metricSelect.value; metricSelect.innerHTML = keysArray.map(k => `<option value="${window._escapeHtml(k)}">${window._escapeHtml(k)}</option>`).join(''); if(currentMetric && keysArray.includes(currentMetric)) metricSelect.value = currentMetric; window.renderV2Chart(); };
  window.renderV2Chart = function() { const ex = document.getElementById('analyticsExercise').value; const metric = document.getElementById('analyticsMetric').value; if(!ex || !metric || !Array.isArray(window.workouts)) return; let chartData = window.workouts.filter(w => w.exercise === ex && w.data && w.data[metric] !== undefined).sort((a,b) => new Date(a.date) - new Date(b.date)); const labels = chartData.map(w => w.date.substring(5)); const dataPoints = chartData.map(w => { if((metric === 'S\u00e4tze' || metric === 'Sets') && w.setDetails && w.setDetails.length > 0) { return w.setDetails.length; } let val = String(w.data[metric]).replace(',', '.'); if(val.includes(':')) { const parts = val.split(':'); if(parts.length === 2) return parseInt(parts[0]) + (parseInt(parts[1])/60); } let floatVal = parseFloat(val); return isNaN(floatVal) ? 0 : floatVal; }); const ctx = document.getElementById('v2Chart').getContext('2d'); if(window.v2ChartInstance) window.v2ChartInstance.destroy(); const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4'; window.v2ChartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: metric, data: dataPoints, backgroundColor: primaryColor + '20', borderColor: primaryColor, borderWidth: 3, fill: true, tension: 0.4, pointBackgroundColor: primaryColor, pointBorderColor: '#000', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#a1a1aa', font: { family: 'Inter' } } }, x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { family: 'Inter', weight: 'bold' } } } }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#18181b', titleColor: '#fff', bodyColor: primaryColor, bodyFont: { weight: 'bold', size: 14 }, borderColor: '#27272a', borderWidth: 1, padding: 12, cornerRadius: 12, displayColors: false } } } }); };

  window.showToast = function(msg, type, actionLabel, actionCallback, duration) {
   const toast = document.getElementById('toast');
   const msgEl = document.getElementById('toastMessage');
   const iconEl = document.getElementById('toastIcon');
   if (!toast || !msgEl) return;
   msgEl.textContent = msg;
   if (iconEl) iconEl.setAttribute('data-lucide', (type === 'error') ? 'x-circle' : 'check');
   const existingBtn = toast.querySelector('.toast-action');
   if(existingBtn) existingBtn.remove();
   if(actionLabel && actionCallback) {
    toast.classList.remove('pointer-events-none'); toast.classList.add('pointer-events-auto');
    const btn = document.createElement('button');
    btn.className = 'toast-action ml-3 px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors cursor-pointer';
    btn.textContent = actionLabel;
    btn.onclick = () => { actionCallback(); toast.style.opacity = '0'; toast.style.transform = 'translate(-50%, 1rem)'; toast.classList.add('pointer-events-none'); toast.classList.remove('pointer-events-auto'); clearTimeout(window._toastTimer); };
    toast.appendChild(btn);
   } else {
    toast.classList.add('pointer-events-none'); toast.classList.remove('pointer-events-auto');
   }
   toast.style.opacity = '1'; toast.style.transform = 'translate(-50%, 0)';
   window._refreshLucide();
   clearTimeout(window._toastTimer);
   window._toastTimer = setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translate(-50%, 1rem)';
    toast.classList.add('pointer-events-none'); toast.classList.remove('pointer-events-auto');
    const btn = toast.querySelector('.toast-action'); if(btn) btn.remove();
   }, duration || 3000);
  };

  // Toast Debounce — gleiche Nachricht nicht öfter als 1x alle 5s
  var _lastToastMsg = '';
  var _lastToastTime = 0;
  window.showToast = (function(orig) {
    return function(msg, type, actionLabel, actionCallback, duration) {
      var now = Date.now();
      if (msg === _lastToastMsg && now - _lastToastTime < 5000) return;
      _lastToastMsg = msg;
      _lastToastTime = now;
      return orig(msg, type, actionLabel, actionCallback, duration);
    };
  })(window.showToast);

  window.showModal = function(title, msg, hasConfirm, callback, hasTextInput) {
   const titleEl = document.getElementById('modalTitle');
   const msgEl = document.getElementById('modalMessage');
   const textInput = document.getElementById('modalTextInput');
   const confirmBtn = document.getElementById('modalBtnConfirm');
   if (titleEl) titleEl.textContent = title;
   if (msgEl) {
    if (msg && typeof msg === 'string' && msg.includes('<') && msg.includes('>')) {
     var tmp = document.createElement('div');
     tmp.innerHTML = msg;
     tmp.querySelectorAll('script,iframe,object,embed,form,svg,math,meta,link,base').forEach(function(el) { el.remove(); });
     tmp.querySelectorAll('*').forEach(function(el) {
      Array.from(el.attributes).forEach(function(attr) { if(attr.name.startsWith('on') || attr.value.indexOf('javascript:') !== -1) el.removeAttribute(attr.name); });
     });
     msgEl.innerHTML = tmp.innerHTML;
    } else {
     msgEl.textContent = msg || '';
    }
   }
   if (textInput) {
    if (hasTextInput) { textInput.classList.remove('hidden'); } 
    else { textInput.classList.add('hidden'); textInput.value = ''; }
   }
   if (confirmBtn) {
    if(callback) {
     confirmBtn.classList.remove('hidden');
     confirmBtn.onclick = () => {
      window.toggleModal('customModal');
      callback(textInput ? textInput.value : '');
     };
    } else {
     confirmBtn.classList.add('hidden');
    }
   }
   window.toggleModal('customModal');
  };

  let bodyMeasurements = [];
  let currentBodyMetric = 'weight';
  let bodyChartInstance = null;

  window.loadBodyData = function() {
   const raw = localStorage.getItem('beastmode_v2_body');
   bodyMeasurements = raw ? JSON.parse(raw) : [];
  };

  window.saveBodyData = function() {
   localStorage.setItem('beastmode_v2_body', JSON.stringify(bodyMeasurements));
  };

  window.saveBodyEntry = function() {
   const date = document.getElementById('bodyDate')?.value;
   const weight = parseFloat(document.getElementById('bodyWeight')?.value);
   const fat = parseFloat(document.getElementById('bodyFat')?.value) || null;
   const chest = parseFloat(document.getElementById('bodyChest')?.value) || null;
   const waist = parseFloat(document.getElementById('bodyWaist')?.value) || null;
   const hip = parseFloat(document.getElementById('bodyHip')?.value) || null;

   if(!date || !weight) { window.showToast('Bitte Datum und Gewicht eintragen!'); return; }

   const bicep_left = parseFloat(document.getElementById('bodyBicepLeft')?.value) || null;
   const bicep_right = parseFloat(document.getElementById('bodyBicepRight')?.value) || null;
   const thigh_left = parseFloat(document.getElementById('bodyThighLeft')?.value) || null;
   const thigh_right = parseFloat(document.getElementById('bodyThighRight')?.value) || null;
   const calf_left = parseFloat(document.getElementById('bodyCalfLeft')?.value) || null;
   const calf_right = parseFloat(document.getElementById('bodyCalfRight')?.value) || null;
   const entry = { id: Date.now().toString(), date, weight, fat, chest, waist, hip, bicep_left, bicep_right, thigh_left, thigh_right, calf_left, calf_right };
   const existing = bodyMeasurements.findIndex(e => e.date === date);
   if(existing > -1) bodyMeasurements[existing] = entry;
   else bodyMeasurements.unshift(entry);
   bodyMeasurements.sort((a,b) => new Date(b.date) - new Date(a.date));

   window.saveBodyData();
   window.renderBodySection();

   ['bodyWeight','bodyFat','bodyChest','bodyWaist','bodyHip','bodyBicepLeft','bodyBicepRight','bodyThighLeft','bodyThighRight','bodyCalfLeft','bodyCalfRight'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
   });
   window.showToast('Messung gespeichert! ✅');
  };

  window.deleteBodyEntry = function(id) {
   bodyMeasurements = bodyMeasurements.filter(e => e.id !== id);
   window.saveBodyData();
   window.renderBodySection();
   window.showToast('Messung gelöscht.');
  };

  window.switchBodyMetric = function(metric) {
   currentBodyMetric = metric;
   document.querySelectorAll('.body-metric-btn').forEach(b => {
    const isActive = b.id === 'bodyBtn-' + metric;
    b.className = `body-metric-btn px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer flex-shrink-0 ${isActive ? 'bg-primary border-primary text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`;
   });
   window.renderBodyChart();
  };

  window.renderBodySection = function() {
   const empty = document.getElementById('bodyEmpty');
   const stats = document.getElementById('bodyStatsSection');
   const list = document.getElementById('bodyHistoryList');

   if(bodyMeasurements.length === 0) {
    if(empty) { empty.classList.remove('hidden'); empty.classList.add('block'); }
    if(stats) stats.classList.add('hidden');
    if(list) list.innerHTML = '';
    return;
   }

   if(empty) { empty.classList.add('hidden'); empty.classList.remove('block'); }
   if(stats) stats.classList.remove('hidden');

   const latest = bodyMeasurements[0];
   const prev = bodyMeasurements[1];
   const oldest = bodyMeasurements[bodyMeasurements.length - 1];

   const weightDiff = prev ? (latest.weight - prev.weight).toFixed(1) : null;
   const weightTotal = oldest !== latest ? (latest.weight - oldest.weight).toFixed(1) : null;

   const statsEl = document.getElementById('bodyStatsRow');
   if(statsEl) statsEl.innerHTML = `
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
     <p class="text-[10px] font-black text-primary uppercase tracking-widest">Aktuell</p>
     <p class="text-3xl font-black text-white mt-1">${latest.weight}<span class="text-sm text-zinc-500 ml-1">kg</span></p>
     ${weightDiff !== null ? `<p class="text-[10px] font-bold mt-1 ${parseFloat(weightDiff) <= 0 ? 'text-emerald-400' : 'text-rose-400'}">${parseFloat(weightDiff) > 0 ? '+' : ''}${weightDiff} kg zur letzten</p>` : '<p class="text-[10px] text-zinc-600 font-bold mt-1">' + window.t('lblFirstMeasurement','Erste Messung') + '</p>'}
    </div>
    ${latest.fat ? `<div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">${window.t('lblBodyFatShort','Körperfett')}</p><p class="text-2xl font-black text-white mt-1">${latest.fat}<span class="text-sm text-zinc-500 ml-0.5">%</span></p></div>` : ''}
    ${weightTotal !== null ? `<div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center"><p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gesamt</p><p class="text-2xl font-black ${parseFloat(weightTotal) <= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-1">${parseFloat(weightTotal) > 0 ? '+' : ''}${weightTotal}<span class="text-sm ml-0.5">kg</span></p></div>` : ''}
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
     <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Messungen</p>
     <p class="text-2xl font-black text-white mt-1">${bodyMeasurements.length}</p>
    </div>`;

   window.renderBodyChart();

   if(list) list.innerHTML = bodyMeasurements.map(e => {
    const parts = [];
    if(e.weight) parts.push(`${e.weight} kg`);
    if(e.fat) parts.push(`${e.fat}% KF`);
    if(e.chest) parts.push(`Brust: ${e.chest}cm`);
    if(e.waist) parts.push(`Taille: ${e.waist}cm`);
    if(e.hip) parts.push(`Hüfte: ${e.hip}cm`);
    return `<div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3">
     <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><i data-lucide="scale" class="w-3.5 h-3.5 text-primary"></i></div>
      <div>
       <p class="text-white font-black text-sm">${e.weight} kg ${e.fat ? `<span class="text-zinc-500 font-bold text-xs">· ${e.fat}%</span>` : ''}</p>
       <p class="text-zinc-500 text-[10px] font-bold">${parts.slice(2).join(' · ') || '—'}</p>
      </div>
     </div>
     <div class="flex items-center gap-2 flex-shrink-0">
      <p class="text-zinc-600 text-[10px] font-bold">${e.date.substring(5)}</p>
      <button aria-label="Löschen" onclick="window.deleteBodyEntry('${e.id}')" class="text-zinc-700 hover:text-rose-400 transition-colors cursor-pointer pointer-events-auto"><i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i></button>
     </div>
    </div>`;
   }).join('');

   window._refreshLucide();
  };

  window.renderBodyChart = function() {
   window._ensureChartJS().then(() => window._renderBodyChartCore()).catch(e => { console.error('Chart.js laden fehlgeschlagen:', e); if(window.showToast) window.showToast('Analytics konnten nicht geladen werden', 'warn'); });
  };
  window._renderBodyChartCore = function() {
   const ctx = document.getElementById('bodyChart');
   if(!ctx || bodyMeasurements.length < 2) return;

   const metricMap = { weight:'weight', fat:'fat', chest:'chest', waist:'waist', hip:'hip' };
   const labelMap = { weight:window.t('pW','Gewicht (kg)'), fat:window.t('lblBodyFatShort','Körperfett (%)'), chest:window.t('lblChest','Brust')+' (cm)', waist:window.t('lblWaist','Taille')+' (cm)', hip:window.t('lblHip','Hüfte')+' (cm)' };

   const field = metricMap[currentBodyMetric];
   const filtered = [...bodyMeasurements].reverse().filter(e => e[field] != null);
   if(filtered.length < 2) return;

   const labels = filtered.map(e => e.date.substring(5));
   const values = filtered.map(e => e[field]);
   const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4';

   if(bodyChartInstance) bodyChartInstance.destroy();
   bodyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
     labels,
     datasets: [{
      label: labelMap[currentBodyMetric],
      data: values,
      borderColor: primary,
      backgroundColor: primary + '15',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: primary,
      pointBorderColor: '#000',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
     }]
    },
    options: {
     responsive: true,
     maintainAspectRatio: false,
     plugins: { legend: { display: false }, tooltip: { backgroundColor: '#18181b', titleColor: '#fff', bodyColor: primary, bodyFont: { weight: 'bold' }, borderColor: '#27272a', borderWidth: 1, padding: 10, cornerRadius: 10, displayColors: false } },
     scales: {
      y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#71717a', font: { family: 'Inter', size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#71717a', font: { family: 'Inter', size: 10, weight: 'bold' } } }
     }
    }
   });
  };

  window.switchAnalyseMode = function(mode) {
   const prSection = document.getElementById('prDashboardSection');
   if(prSection) prSection.classList.add('hidden');
   const prBtn = document.getElementById('btnAnalyse-prs');
   if(prBtn) { prBtn.classList.remove('bg-zinc-800','text-white','shadow-sm'); prBtn.classList.add('text-zinc-500'); }

   if(mode === 'prs') {
    const wc = document.getElementById('analyseWorkoutControls');
    if(wc) wc.classList.add('hidden');
    const bt = document.getElementById('bodyTrackerSection');
    if(bt) bt.classList.add('hidden');
    const bb = document.getElementById('btnAnalyse-body');
    if(bb) { bb.classList.remove('bg-zinc-800','text-white','shadow-sm'); bb.classList.add('text-zinc-500'); }
    const vtc = document.getElementById('viewTableContainer');
    if(vtc) vtc.classList.add('hidden');
    const vac = document.getElementById('viewAnalyticsContainer');
    if(vac) vac.classList.add('hidden');
    if(prSection) prSection.classList.remove('hidden');
    if(prBtn) { prBtn.classList.add('bg-zinc-800','text-white','shadow-sm'); prBtn.classList.remove('text-zinc-500'); }
    if(prBtn) window._refreshLucide();
    window.renderPRDashboard();
    return;
   }
   ['muscleSection','calendarSection','heatmapSection','acwrSection','rankingSection'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
   });
   ['btnAnalyse-muscles','btnAnalyse-calendar','btnAnalyse-heatmap','btnAnalyse-acwr','btnAnalyse-ranking'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn) { btn.classList.remove('bg-zinc-800','text-white','shadow-sm'); btn.classList.add('text-zinc-500'); }
   });

   if(mode === 'muscles') {
    const wc = document.getElementById('analyseWorkoutControls'); if(wc) wc.classList.add('hidden');
    const hc = document.getElementById('analyseHeaderControls'); if(hc) hc.classList.add('hidden');
    const vtc = document.getElementById('viewTableContainer'); if(vtc) vtc.classList.add('hidden');
    const vac = document.getElementById('viewAnalyticsContainer'); if(vac) vac.classList.add('hidden');
    const bt = document.getElementById('bodyTrackerSection'); if(bt) bt.classList.add('hidden');
    document.getElementById('muscleSection')?.classList.remove('hidden');
    const btn = document.getElementById('btnAnalyse-muscles');
    if(btn) { btn.classList.add('bg-zinc-800','text-white','shadow-sm'); btn.classList.remove('text-zinc-500'); }
    window.renderMuscleHeatmap();
    if (window._renderMuscleDistributionChart) window._renderMuscleDistributionChart();
    if (window._renderPRTimeline) window._renderPRTimeline();
    if (window._renderMuscleFrequencyHeatmap) window._renderMuscleFrequencyHeatmap();
    if (window._renderVolumeLandmarks) window._renderVolumeLandmarks();
    if (window._renderPeriodizationChart) window._renderPeriodizationChart();
    window._refreshLucide();
    return;
   }

   if(mode === 'ranking') {
    const wc = document.getElementById('analyseWorkoutControls'); if(wc) wc.classList.add('hidden');
    const hc = document.getElementById('analyseHeaderControls'); if(hc) hc.classList.add('hidden');
    const vtc = document.getElementById('viewTableContainer'); if(vtc) vtc.classList.add('hidden');
    const vac = document.getElementById('viewAnalyticsContainer'); if(vac) vac.classList.add('hidden');
    const bt = document.getElementById('bodyTrackerSection'); if(bt) bt.classList.add('hidden');
    document.getElementById('rankingSection')?.classList.remove('hidden');
    const btn = document.getElementById('btnAnalyse-ranking');
    if(btn) { btn.classList.add('bg-zinc-800','text-white','shadow-sm'); btn.classList.remove('text-zinc-500'); }
    if (window._renderMuscleRanking) window._renderMuscleRanking('muscleRankingContainer');
    return;
   }

   if(mode === 'acwr') {
    const wc = document.getElementById('analyseWorkoutControls'); if(wc) wc.classList.add('hidden');
    const hc = document.getElementById('analyseHeaderControls'); if(hc) hc.classList.add('hidden');
    const vtc = document.getElementById('viewTableContainer'); if(vtc) vtc.classList.add('hidden');
    const vac = document.getElementById('viewAnalyticsContainer'); if(vac) vac.classList.add('hidden');
    const bt = document.getElementById('bodyTrackerSection'); if(bt) bt.classList.add('hidden');
    document.getElementById('acwrSection')?.classList.remove('hidden');
    const btn = document.getElementById('btnAnalyse-acwr');
    if(btn) { btn.classList.add('bg-zinc-800','text-white','shadow-sm'); btn.classList.remove('text-zinc-500'); }
    if (window._renderACWR) window._renderACWR('acwrContainer');
    return;
   }

   if(mode === 'heatmap') {
    const wc = document.getElementById('analyseWorkoutControls'); if(wc) wc.classList.add('hidden');
    const hc = document.getElementById('analyseHeaderControls'); if(hc) hc.classList.add('hidden');
    const vtc = document.getElementById('viewTableContainer'); if(vtc) vtc.classList.add('hidden');
    const vac = document.getElementById('viewAnalyticsContainer'); if(vac) vac.classList.add('hidden');
    const bt = document.getElementById('bodyTrackerSection'); if(bt) bt.classList.add('hidden');
    document.getElementById('heatmapSection')?.classList.remove('hidden');
    const btn = document.getElementById('btnAnalyse-heatmap');
    if(btn) { btn.classList.add('bg-zinc-800','text-white','shadow-sm'); btn.classList.remove('text-zinc-500'); }
    window.renderActivityHeatmap();
    return;
   }

   if(mode === 'calendar') {
    const wc = document.getElementById('analyseWorkoutControls'); if(wc) wc.classList.add('hidden');
    const hc = document.getElementById('analyseHeaderControls'); if(hc) hc.classList.add('hidden');
    const vtc = document.getElementById('viewTableContainer'); if(vtc) vtc.classList.add('hidden');
    const vac = document.getElementById('viewAnalyticsContainer'); if(vac) vac.classList.add('hidden');
    const bt = document.getElementById('bodyTrackerSection'); if(bt) bt.classList.add('hidden');
    document.getElementById('calendarSection')?.classList.remove('hidden');
    const btn = document.getElementById('btnAnalyse-calendar');
    if(btn) { btn.classList.add('bg-zinc-800','text-white','shadow-sm'); btn.classList.remove('text-zinc-500'); }
    window.renderCalendar();
    window._refreshLucide();
    return;
   }

   document.getElementById('btnAnalyse-workouts')?.classList.toggle('bg-zinc-800', mode === 'workouts');
   document.getElementById('btnAnalyse-workouts')?.classList.toggle('text-white', mode === 'workouts');
   document.getElementById('btnAnalyse-workouts')?.classList.toggle('text-zinc-500', mode !== 'workouts');
   document.getElementById('btnAnalyse-body')?.classList.toggle('bg-zinc-800', mode === 'body');
   document.getElementById('btnAnalyse-body')?.classList.toggle('text-white', mode === 'body');
   document.getElementById('btnAnalyse-body')?.classList.toggle('text-zinc-500', mode !== 'body');

   const headerControls = document.getElementById('analyseHeaderControls');
   if(headerControls) headerControls.classList.remove('hidden');
   const workoutControls = document.getElementById('analyseWorkoutControls');
   if(workoutControls) workoutControls.classList.toggle('hidden', mode === 'body');

   const workoutPanels = [document.getElementById('viewTableContainer'), document.getElementById('viewAnalyticsContainer')];
   const bodyPanel = document.getElementById('bodyTrackerSection');

   if(mode === 'body') {
    workoutPanels.forEach(p => p?.classList.add('hidden'));
    if(bodyPanel) { bodyPanel.classList.remove('hidden'); bodyPanel.classList.add('block'); }
    window.renderBodySection();
    if (window._renderSymmetryCheck) window._renderSymmetryCheck();
   } else {
    workoutPanels.forEach(p => { if(p && p.id === 'viewTableContainer') p.classList.remove('hidden'); });
    if(bodyPanel) { bodyPanel.classList.add('hidden'); bodyPanel.classList.remove('block'); }
    window.renderTable();
   }
  };

  let currentTab = 'training';

  window.switchTab = function(tab) {
   var oldTab = currentTab;
   currentTab = tab;
   var oldPanel = oldTab ? document.getElementById('tab-' + oldTab) : null;
   var newPanel = document.getElementById('tab-' + tab);
   document.querySelectorAll('.tab-panel').forEach(function(p) { if (p !== oldPanel && p !== newPanel) p.classList.add('hidden'); });
   if (oldPanel && oldPanel !== newPanel) {
    oldPanel.style.opacity = '0'; oldPanel.style.transform = 'translateX(-8px)';
    setTimeout(function() { oldPanel.classList.add('hidden'); oldPanel.style.opacity = ''; oldPanel.style.transform = ''; }, 160);
   }
   if (newPanel) {
    newPanel.classList.remove('hidden'); newPanel.style.opacity = '0'; newPanel.style.transform = 'translateX(8px)';
    requestAnimationFrame(function() { requestAnimationFrame(function() {
     newPanel.style.transition = 'opacity 0.18s ease,transform 0.18s ease';
     newPanel.style.opacity = '1'; newPanel.style.transform = 'translateX(0)';
     setTimeout(function() { newPanel.style.transition = ''; }, 200);
    }); });
   }
   document.querySelectorAll('.nav-tab-btn').forEach(b => {
    b.classList.remove('text-primary');
    b.classList.add('text-zinc-600');
    const iconDiv = b.querySelector('div');
    if(iconDiv) iconDiv.style.background = 'transparent';
    const tabId = b.id.replace('navBtn-', '');
    const indicator = document.getElementById('navIndicator-' + tabId);
    if(indicator) indicator.style.opacity = '0';
   });
   const activeBtn = document.getElementById('navBtn-' + tab);
   if(activeBtn) {
    activeBtn.classList.add('text-primary');
    activeBtn.classList.remove('text-zinc-600');
    const iconDiv = activeBtn.querySelector('div');
    if(iconDiv) iconDiv.style.background = 'color-mix(in srgb, var(--primary-hex), transparent 88%)';
    const indicator = document.getElementById('navIndicator-' + tab);
    if(indicator) indicator.style.opacity = '1';
   }
   if(tab === 'tools') {
    const el = document.getElementById('toolsZnsScore');
    if(el) el.textContent = window.currentReadinessScore + '%';
    if (window._checkKiDiscovery) window._checkKiDiscovery('tools-tab');
    if (window._renderKiDiscoveryHints) window._renderKiDiscoveryHints();
    setTimeout(function() { if (window._renderMuscleRecoveryUI) window._renderMuscleRecoveryUI('muscleRecoveryContainer'); if (window._renderACWR) window._renderACWR('acwrBatteryContainer'); if (window._renderHabitCorrelations) window._renderHabitCorrelations('habitCorrelationsContainer'); }, 100);
   }
   if(tab === 'analyse' && window.currentView === 'chart') { window._showAnalyticsSkeleton(); window.initAnalytics(); }
   if(tab === 'analyse') { ['_renderMonthlySummary','_renderWeeklyVolumeChart','_renderVolumeLandmarks','_renderMuscleDistributionChart','_renderMuscleFrequencyHeatmap','_renderPeriodizationChart','_renderPRTimeline','_renderHRZonesWidget','_renderPlanAdherence','_renderSymmetryCheck'].forEach(function(fn) { if (window[fn]) { try { window[fn](); } catch(e) { console.warn(fn + ' error:', e); } } }); setTimeout(function() { if (window._renderMicroTasks) window._renderMicroTasks('microTasksContainer'); if (window._initLazyAnalyse) window._initLazyAnalyse(); }, 200); }
   if(tab === 'social') {
    if (!window._socialLoaded) {
     window._socialLoaded = true;
     if (window._socialInit) window._socialInit();
     setTimeout(function() { window._loadFeed('following', document.getElementById('feedTabFollowing')); }, 200);
    }
   }
   if(tab === 'menu') { setTimeout(() => { if(window.updatePushToggleUI) window.updatePushToggleUI(); }, 100); window.renderGoals && window.renderGoals(); if(window._renderProgressPhotos) try{window._renderProgressPhotos();}catch(e){} if(window._updateReferralUI) window._updateReferralUI(); }
   if(tab === 'nutrition') { var _np = window._getNutritionProfile ? window._getNutritionProfile() : {}; if (_np.setupComplete) { window._renderNutritionDashboard(); } if (window._checkSuppReminders) window._checkSuppReminders(); setTimeout(function() { if (window._renderNutrientTimingWidget) window._renderNutrientTimingWidget('nutrientTimingContainer'); var _db = window._renderDeloadBanner ? window._renderDeloadBanner() : ''; if (_db) { var _dd = document.getElementById('nutritionDashboard'); if (_dd && !_dd.querySelector('[data-deload-banner]')) _dd.insertAdjacentHTML('afterbegin', '<div data-deload-banner>'+_db+'</div>'); } }, 300); }
   window._refreshLucide();
  };

  // Focus Trap Utility for Accessibility
  window._focusTrap = (function() {
    var _lastFocus = null;
    var FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    function trap(modalEl) {
      if (!modalEl) return;
      _lastFocus = document.activeElement;
      var focusable = Array.from(modalEl.querySelectorAll(FOCUSABLE)).filter(function(el){return el.offsetParent!==null;});
      if (focusable.length > 0) focusable[0].focus(); else modalEl.setAttribute('tabindex','-1'), modalEl.focus();
      modalEl._trapHandler = function(e) {
        if (e.key !== 'Tab') return;
        var f = Array.from(modalEl.querySelectorAll(FOCUSABLE)).filter(function(el){return el.offsetParent!==null;});
        if (f.length === 0) return;
        if (e.shiftKey) { if (document.activeElement === f[0]) { e.preventDefault(); f[f.length-1].focus(); } }
        else { if (document.activeElement === f[f.length-1]) { e.preventDefault(); f[0].focus(); } }
      };
      modalEl.addEventListener('keydown', modalEl._trapHandler);
    }
    function release(modalEl) {
      if (modalEl && modalEl._trapHandler) { modalEl.removeEventListener('keydown', modalEl._trapHandler); modalEl._trapHandler = null; }
      if (_lastFocus && _lastFocus.focus) try { _lastFocus.focus(); } catch(e) {}
      _lastFocus = null;
    }
    return {trap:trap, release:release};
  })();

  window.toggleModal = function(id) {
   if(id === 'settingsModal') { window.switchTab('menu'); return; }
   var modal = document.getElementById(id);
   if (!modal) return;
   if (modal.classList.contains('hidden')) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    void modal.offsetHeight;
    setTimeout(function() { window._focusTrap.trap(modal); }, 50);
    if (id === 'feedbackModal') {
     document.querySelectorAll('input[name="fbstar"], input[name="fbcat"]').forEach(function(r) { r.checked = false; });
     document.querySelectorAll('.feedback-star, .feedback-cat').forEach(function(el) { el.style.borderColor = ''; el.style.color = ''; el.style.background = ''; });
     _feedbackStar = 0; _feedbackCat = '';
     var ft = document.getElementById('feedbackText'); if(ft) ft.value = '';
     var fe = document.getElementById('feedbackEmail'); if(fe) fe.value = '';
    }
   } else {
    window._focusTrap.release(modal);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
   }
   window._refreshLucide();
  };

  // --- Hardware Back-Button: close topmost modal ---
  window._modalStack = [];
  (function() {
   var origToggle = window.toggleModal;
   window.toggleModal = function(id) {
    var modal = document.getElementById(id);
    if (modal && modal.classList.contains('hidden')) {
     window._modalStack.push(id);
     history.pushState({ modal: id }, '');
    } else {
     window._modalStack = window._modalStack.filter(function(m) { return m !== id; });
    }
    origToggle(id);
   };
   window.addEventListener('popstate', function(e) {
    if (window._modalStack.length > 0) {
     var topModal = window._modalStack.pop();
     var el = document.getElementById(topModal);
     if (el && !el.classList.contains('hidden')) {
      el.classList.add('hidden');
      el.classList.remove('flex');
     }
    }
   });
  })();

  // --- Skeleton Screen Helper ---
  window._showSkeleton = function(containerId, lines) {
   var el = document.getElementById(containerId);
   if (!el) return;
   var html = '';
   var widths = ['w-full', 'w-3/4', 'w-1/2', 'w-full', 'w-3/4'];
   for (var i = 0; i < (lines || 3); i++) {
    html += '<div class="skeleton-line ' + widths[i % widths.length] + '"></div>';
   }
   el.innerHTML = html;
  };

  window._showAnalyticsSkeleton = function() {
   var container = document.getElementById('analyticsContent') ||
    document.getElementById('diagrammeContent') ||
    document.querySelector('[id*="analytic"], [id*="chart"]');
   if (!container) return;
   container.innerHTML =
    '<div style="padding:12px;display:flex;flex-direction:column;gap:12px">' +
    '<div class="skeleton-line" style="height:20px;width:40%"></div>' +
    '<div class="skeleton-line" style="height:160px;width:100%;border-radius:12px"></div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="skeleton-line" style="height:60px;flex:1;border-radius:10px"></div>' +
    '<div class="skeleton-line" style="height:60px;flex:1;border-radius:10px"></div>' +
    '<div class="skeleton-line" style="height:60px;flex:1;border-radius:10px"></div>' +
    '</div>' +
    '<div class="skeleton-line" style="height:120px;width:100%;border-radius:12px"></div>' +
    '</div>';
  };

  window._showHistorySkeleton = function() {
   var container = document.getElementById('mobileCardList') ||
    document.getElementById('workoutTableBody') ||
    document.querySelector('.workout-list, [id*="archive"]');
   if (!container) return;
   var rows = '';
   for (var i = 0; i < 5; i++) {
    rows += '<div style="padding:12px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;display:flex;flex-direction:column;gap:8px;margin-bottom:8px">' +
     '<div style="display:flex;justify-content:space-between">' +
     '<div class="skeleton-line" style="height:14px;width:35%"></div>' +
     '<div class="skeleton-line" style="height:14px;width:20%"></div>' +
     '</div>' +
     '<div class="skeleton-line" style="height:12px;width:55%"></div>' +
     '</div>';
   }
   container.innerHTML = rows;
  };

  window._showPTDashboardSkeleton = function() {
   var container = document.getElementById('ptDashboardContent') ||
    document.getElementById('ptClientsList');
   if (!container) return;
   var cards = '';
   for (var i = 0; i < 3; i++) {
    cards += '<div style="padding:14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:14px;margin-bottom:10px">' +
     '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">' +
     '<div class="skeleton-line" style="width:40px;height:40px;border-radius:50%"></div>' +
     '<div style="flex:1;display:flex;flex-direction:column;gap:6px">' +
     '<div class="skeleton-line" style="height:14px;width:50%"></div>' +
     '<div class="skeleton-line" style="height:11px;width:35%"></div>' +
     '</div></div>' +
     '<div class="skeleton-line" style="height:8px;width:100%;border-radius:4px"></div>' +
     '</div>';
   }
   container.innerHTML = cards;
  };

  (function() {
   function setupLastTimeOverlay() {
    var input = document.getElementById('exerciseInput');
    if(!input) return;
    var debounce = null;
    function onExerciseChange() {
     clearTimeout(debounce);
     window._savedSets = []; window._currentSetIndex = 0; window._pendingSavedSets = null;
     debounce = setTimeout(function() {
      var name = input.value.trim();
      if(name.length < 2) { window._hideLastTime(); if(window._showExerciseImage) { var c = document.getElementById('exerciseImageContainer'); if(c) c.classList.add('hidden'); } return; }
      window._showLastTime(name);
      clearTimeout(window._exerciseImageTimeout);
     }, 300);
    }
    input.addEventListener('input', onExerciseChange);
    input.addEventListener('change', onExerciseChange);
    input.addEventListener('blur', function() { setTimeout(onExerciseChange, 100); });
   }
   if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(setupLastTimeOverlay, 1000); });
   else setTimeout(setupLastTimeOverlay, 1000);
  })();

  window._hideLastTime = function() {
   var el = document.getElementById('lastTimeOverlay');
   if(el) el.classList.add('hidden');
  };

  // Exercise Map Cache for O(1) lookup instead of O(n) filter
  var _exerciseMapCache = null;
  window._getExerciseMap = function() {
    if (_exerciseMapCache) return _exerciseMapCache;
    var map = {};
    (window.workouts || []).forEach(function(w) {
      if (!w.archived || !w.exercise) return;
      var key = w.exercise.toLowerCase();
      if (!map[key]) map[key] = [];
      map[key].push(w);
    });
    _exerciseMapCache = map;
    return map;
  };
  window._invalidateExerciseMap = function() { _exerciseMapCache = null; };

  // Bodyweight + Added Weight Modus
  window._BODYWEIGHT_EXERCISES = ['klimmz','pull-up','pullup','chin-up','chinup','dips','liegest','push-up','pushup','muscle-up','muscleup','ring dip','pistol squat','handstand push','australian pull','inverted row','bar dip'];
  window._isBodyweightExercise = function(name) { if(!name) return false; var l=name.toLowerCase(); return window._BODYWEIGHT_EXERCISES.some(function(bw){return l.indexOf(bw)!==-1;}); };
  window._bwModeActive = false;
  window._userBodyweight = parseFloat((window.userProfile||{}).weight) || 80;
  window._toggleBWMode = function() {
    window._bwModeActive = !window._bwModeActive;
    var sw = document.getElementById('bwModeSwitch');
    var dot = document.getElementById('bwModeDot');
    if(sw) { sw.style.background = window._bwModeActive ? 'var(--primary-hex)' : 'var(--border-hex)'; sw.setAttribute('aria-checked', window._bwModeActive ? 'true' : 'false'); }
    if(dot) dot.style.left = window._bwModeActive ? '18px' : '2px';
    document.querySelectorAll('[id^="weight_s"]').forEach(function(el) { el.placeholder = window._bwModeActive ? '+kg' : '--'; });
    if(window._bwModeActive) window.showToast('BW-Modus: ' + window._userBodyweight + 'kg + Zusatzgewicht');
  };

  window._lastTimeValues = null;
  window._showLastTime = function(exerciseName) {
   var overlay = document.getElementById('lastTimeOverlay');
   var valuesEl = document.getElementById('lastTimeValues');
   var dateEl = document.getElementById('lastTimeDate');
   var suggestionEl = document.getElementById('lastTimeSuggestion');
   var sugTextEl = document.getElementById('lastTimeSugText');
   if(!overlay || !valuesEl) return;
   var nameLower = exerciseName.toLowerCase();
   var matches = window._getExerciseMap()[nameLower] || [];
   if(matches.length === 0) {
    matches = workouts.filter(function(w) { return w.exercise && (w.exercise.toLowerCase().includes(nameLower) || nameLower.includes(w.exercise.toLowerCase())); });
   }
   if(matches.length === 0) { window._hideLastTime(); window._lastTimeValues = null; return; }
   matches.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
   var last = matches[0];
   var category = last.category || window.currentCategory || 'strength';
   // Save last set values for auto-fill
   if(category === 'strength' && last.setDetails && last.setDetails.length > 0) {
    window._lastTimeValues = last.setDetails.map(function(s) { return { reps: s.reps, weight: s.weight, rir: s.rir != null ? s.rir : null }; });
   } else { window._lastTimeValues = null; }
   // Load exercise-specific rest timer
   var _savedRest = window._getExerciseRestTime ? window._getExerciseRestTime(exerciseName) : null;
   if (_savedRest) window.selectedRestTime = _savedRest;
   var daysDiff = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
   var dateStr = daysDiff === 0 ? 'Heute' : daysDiff === 1 ? 'Gestern' : daysDiff < 7 ? 'vor ' + daysDiff + ' Tagen' : daysDiff < 30 ? 'vor ' + Math.floor(daysDiff/7) + ' Wo' : new Date(last.date).toLocaleDateString('de-DE',{day:'numeric',month:'short'});
   dateEl.textContent = dateStr;
   var result = window._getProgressionData(last, matches, category);
   var noteHtml = last.note ? '<div class="text-[9px] mt-1 italic" style="color:var(--primary-hex)">\uD83D\uDCDD ' + window._escapeHtml(last.note) + '</div>' : '';
   var applyBtn = (window._lastTimeValues && window._lastTimeValues.length > 0) ? '<button onclick="window._applyLastValues()" class="w-full mt-2 py-2 rounded-xl text-[10px] font-bold cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.25);color:var(--primary-hex)" aria-label="Letzte Werte uebernehmen">' + window.t('applyLast','Letzte Werte \u00fcbernehmen') + '</button>' : '';
   valuesEl.innerHTML = result.display + noteHtml + applyBtn;
   // Progressive Overload check
   if (window._checkProgressiveOverload) {
    var plateau = window._checkProgressiveOverload(exerciseName, matches);
    if (plateau) setTimeout(function() { window.showToast('\u26a0\ufe0f ' + window._escapeHtml(exerciseName) + ': ' + plateau.workouts + ' Workouts bei ' + plateau.weight + 'kg \u2014 ' + plateau.suggestion, null, null, null, 5000); }, 1500);
   }
   if(result.suggestion) { suggestionEl.classList.remove('hidden'); sugTextEl.textContent = result.suggestion; }
   else { suggestionEl.classList.add('hidden'); }
   overlay.classList.remove('hidden');
   // Auto-fill last values when exercise matches exactly and not editing
   if (window._lastTimeValues && window._lastTimeValues.length > 0 && !window.editingWorkoutId) {
    var autoFillPref = localStorage.getItem('base_autofill_last') !== '0';
    if (autoFillPref && last.exercise && last.exercise.toLowerCase() === nameLower) {
     setTimeout(function() { window._applyLastValues(true); }, 150);
    }
   }
  };

  window._applyLastValues = function(silent) {
   if (!window._lastTimeValues || !window._lastTimeValues.length) return;
   var sInput = document.getElementById('setsInput');
   if (sInput && window._lastTimeValues.length !== parseInt(sInput.value)) {
    sInput.value = window._lastTimeValues.length;
    var disp = document.getElementById('setCountDisplay');
    if (disp) disp.textContent = window._lastTimeValues.length;
    window.generateSetFields(window._lastTimeValues.length);
   }
   setTimeout(function() {
    for (var i = 0; i < window._lastTimeValues.length; i++) {
     var n = i + 1;
     var last = window._lastTimeValues[i];
     var repsInput = document.getElementById('wdh_s' + n);
     var weightInput = document.getElementById('weight_s' + n);
     var rirInput = document.getElementById('rir_s' + n);
     if (repsInput && last.reps) repsInput.value = last.reps;
     if (weightInput && last.weight) weightInput.value = last.weight % 1 === 0 ? last.weight.toFixed(0) : last.weight.toFixed(1);
     if (rirInput && last.rir != null) rirInput.value = last.rir;
    }
    if (!silent) window.showToast(window.t('lastValuesApplied', 'Letzte Werte \u00fcbernommen!'));
   }, 100);
  };

  window._getProgressionData = function(last, allMatches, category) {
   var display = '', suggestion = '';
   if(category === 'strength' && last.setDetails && last.setDetails.length > 0) {
    var sets = last.setDetails;
    var maxWeight = Math.max.apply(null, sets.map(function(s) { return parseFloat(s.weight) || 0; }));
    var totalSets = sets.length;
    var repRange = sets.map(function(s) { return parseInt(s.reps) || 0; });
    var minReps = Math.min.apply(null, repRange);
    var maxReps = Math.max.apply(null, repRange);
    var repStr = minReps === maxReps ? minReps + ' Wdh' : minReps + '-' + maxReps + ' Wdh';
    display = '<span style="color:var(--primary-hex)">' + maxWeight + ' kg</span> \u00d7 ' + totalSets + ' Sets \u00d7 ' + repStr;
    var allRepsHit = sets.every(function(s) { return (parseInt(s.reps)||0) >= (parseInt(sets[0].reps)||8); });
    var exName = (last.exercise || '').toLowerCase();
    var lowerKw = ['squat','kniebeuge','beinpresse','leg','bein','deadlift','kreuzheben','hip thrust','lunge','ausfallschritt','wadenheben','calf'];
    var isLower = lowerKw.some(function(kw) { return exName.includes(kw); });
    var inc = isLower ? 5 : 2.5;
    if(allRepsHit && maxWeight > 0) suggestion = (maxWeight + inc) + ' kg versuchen (+' + inc + ')';
    else if(maxWeight > 0) suggestion = maxWeight + ' kg, alle Sets ' + (parseInt(sets[0].reps)||8) + ' Wdh schaffen';
    if(allMatches.length >= 3) {
     var w3 = allMatches.slice(0,3).map(function(w) { return Math.max.apply(null,(w.setDetails||[]).map(function(s){return parseFloat(s.weight)||0;})); });
     if(w3[0]>w3[2]) display += ' <span class="text-emerald-400 text-[10px]">\u2191</span>';
     else if(w3[0]<w3[2]) display += ' <span class="text-rose-400 text-[10px]">\u2193</span>';
     else display += ' <span class="text-zinc-500 text-[10px]">\u2192</span>';
    }
   } else if(category === 'cardio' && last.data) {
    var distance = 0, duration = 0, pace = 0;
    Object.entries(last.data).forEach(function(e) {
     var k = e[0].toLowerCase(), v = parseFloat(e[1])||0;
     if(k.includes('distanz')||k.includes('km')||k.includes('distance')) distance = v;
     if(k.includes('dauer')||k.includes('min')||k.includes('duration')||k.includes('zeit')) duration = v;
     if(k.includes('pace')||k.includes('tempo')) pace = v;
    });
    var parts = [];
    if(distance > 0) parts.push('<span style="color:var(--primary-hex)">' + distance + ' km</span>');
    if(duration > 0) parts.push(duration + ' min');
    if(pace > 0) parts.push(pace + ' min/km');
    display = parts.join(' \u00b7 ') || 'Keine Details';
    if(distance > 0) suggestion = Math.round(distance*1.05*10)/10 + ' km (+5%)';
    else if(duration > 0) suggestion = (duration + 2) + ' min (+2)';
   } else if(category === 'recovery' && last.data) {
    var holdTime = 0, rounds = 0, durMob = 0;
    Object.entries(last.data).forEach(function(e) {
     var k = e[0].toLowerCase(), v = parseFloat(e[1])||0;
     if(k.includes('haltezeit')||k.includes('hold')||k.includes('sek')) holdTime = v;
     if(k.includes('runden')||k.includes('round')) rounds = v;
     if(k.includes('dauer')||k.includes('min')||k.includes('duration')) durMob = v;
    });
    var pts = [];
    if(holdTime > 0) pts.push(holdTime + ' Sek');
    if(rounds > 0) pts.push(rounds + ' Runden');
    if(durMob > 0) pts.push(durMob + ' min');
    display = pts.join(' \u00d7 ') || 'Keine Details';
    if(holdTime > 0 && holdTime < 45) suggestion = (holdTime+5) + ' Sek (+5)';
    else if(rounds > 0) suggestion = (rounds+1) + ' Runden';
    else if(durMob > 0) suggestion = (durMob+2) + ' min (+2)';
   } else if(last.data) {
    var pts2 = [];
    Object.entries(last.data).forEach(function(e) { if(e[1] && String(e[1]).trim()) pts2.push(e[0]+': '+e[1]); });
    display = pts2.join(' \u00b7 ') || 'Keine Details';
   } else if(last.setDetails && last.setDetails.length > 0) {
    var mxW = Math.max.apply(null, last.setDetails.map(function(s){return parseFloat(s.weight)||0;}));
    display = mxW + ' kg \u00d7 ' + last.setDetails.length + ' Sets';
   }
   return { display: display || 'Keine Daten', suggestion: suggestion };
  };

  // === WORKOUT ROUTINEN / TEMPLATES ===
  window._routineQueue = null;
  window._routineIndex = 0;
  window._routineName = null;

  window._renderRoutineCards = function() {
   var container = document.getElementById('routinesList');
   var section = document.getElementById('routinesSection');
   if (!container || !section) return;
   var routines = JSON.parse(localStorage.getItem('base_routines') || '[]');
   if (routines.length === 0 || window.currentCategory !== 'strength') { section.classList.add('hidden'); return; }
   section.classList.remove('hidden');
   routines.sort(function(a, b) { return new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0); });
   var show = routines.slice(0, 5);
   container.innerHTML = show.map(function(r) {
    var exCount = r.exercises ? r.exercises.length : 0;
    var exNames = (r.exercises || []).slice(0, 3).map(function(e) { return window._escapeHtml(e.name); }).join(', ');
    if (exCount > 3) exNames += ' +' + (exCount - 3);
    var usedText = r.timesUsed ? r.timesUsed + 'x' : 'Neu';
    return '<button onclick="window._loadRoutine(\'' + window._escapeHtml(r.id).replace(/'/g,'&#39;') + '\')" class="flex-shrink-0 p-3 rounded-xl text-left cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex);min-width:200px;max-width:240px" aria-label="Routine laden">' +
     '<div class="flex items-center justify-between mb-1">' +
     '<span class="text-xs font-bold text-white truncate" style="max-width:150px">' + window._escapeHtml(r.name) + '</span>' +
     '<span class="text-[8px] font-bold px-1.5 py-0.5 rounded" style="background:rgba(163,201,168,0.1);color:var(--primary-hex)">' + usedText + '</span>' +
     '</div>' +
     '<p class="text-[9px] truncate" style="color:#9898a2">' + exCount + ' ' + window.t('lblExercises','\u00dcbungen') + ' \u00b7 ' + exNames + '</p>' +
     '</button>';
   }).join('');
  };

  window._loadRoutine = function(routineId) {
   var routines = JSON.parse(localStorage.getItem('base_routines') || '[]');
   var routine = routines.find(function(r) { return r.id === routineId; });
   if (!routine || !routine.exercises || routine.exercises.length === 0) return;
   routine.lastUsed = new Date().toISOString();
   routine.timesUsed = (routine.timesUsed || 0) + 1;
   localStorage.setItem('base_routines', JSON.stringify(routines));
   if (window._syncAppData) window._syncAppData('base_routines', routines);
   window._routineQueue = routine.exercises.slice();
   window._routineName = routine.name;
   window._routineIndex = 0;
   window._loadNextRoutineExercise();
   window.showToast(window.t('routineLoaded', 'Routine geladen') + ' \u2014 ' + routine.exercises.length + ' ' + window.t('lblExercises','\u00dcbungen'));
  };

  window._loadNextRoutineExercise = function() {
   window._savedSets = []; window._currentSetIndex = 0; window._pendingSavedSets = null;
   if (!window._routineQueue || window._routineIndex >= window._routineQueue.length) {
    window._routineQueue = null; window._routineIndex = 0;
    var badge = document.getElementById('routineProgressBadge');
    if (badge) badge.style.display = 'none';
    return;
   }
   var ex = window._routineQueue[window._routineIndex];
   var nameInput = document.getElementById('exerciseInput');
   if (nameInput) { nameInput.value = ex.name; nameInput.dispatchEvent(new Event('input')); nameInput.dispatchEvent(new Event('change')); }
   var setsInput = document.getElementById('setsInput');
   if (setsInput) { setsInput.value = ex.sets || 3; window.generateSetFields(ex.sets || 3); }
   var eqInput = document.getElementById('equipmentInput');
   if (eqInput && ex.equipment) eqInput.value = ex.equipment;
   setTimeout(function() {
    for (var i = 1; i <= (ex.sets || 3); i++) {
     var rI = document.getElementById('wdh_s' + i);
     var wI = document.getElementById('weight_s' + i);
     var riI = document.getElementById('rir_s' + i);
     if (rI) rI.value = ex.reps || 8;
     if (wI && ex.weight) wI.value = ex.weight % 1 === 0 ? ex.weight.toFixed(0) : ex.weight.toFixed(1);
     if (riI && ex.rir != null) riI.value = ex.rir;
    }
   }, 200);
   var total = window._routineQueue.length;
   var current = window._routineIndex + 1;
   var badge = document.getElementById('routineProgressBadge');
   if (!badge) {
    var b = document.createElement('div'); b.id = 'routineProgressBadge';
    b.style.cssText = 'position:fixed;top:110px;left:50%;transform:translateX(-50%);z-index:100;display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:rgba(163,201,168,0.1);border:1px solid rgba(163,201,168,0.2)';
    document.body.appendChild(b); badge = b;
   }
   badge.innerHTML = '<span style="font-size:9px;font-weight:800;color:var(--primary-hex);letter-spacing:1px">' + window._escapeHtml(window._routineName || 'Routine') + '</span><span style="font-size:9px;color:#666">\u00b7</span><span style="font-size:9px;font-weight:700;color:#fff">' + window.t('lblExercise','\u00dcbung') + ' ' + current + '/' + total + '</span>';
   badge.style.display = 'flex';
  };

  window._advanceRoutineAfterSave = function(entry) {
   if (!window._routineQueue) return;
   if (window._routineIndex < window._routineQueue.length - 1) {
    window._routineIndex++;
    setTimeout(function() { window._loadNextRoutineExercise(); }, 500);
   } else {
    var badge = document.getElementById('routineProgressBadge');
    if (badge) badge.style.display = 'none';
    var rName = window._routineName;
    window._routineQueue = null; window._routineIndex = 0;
    window.showToast(window.t('routineComplete', 'Routine abgeschlossen!'));
    setTimeout(function() { window._offerUpdateRoutine(rName); }, 1000);
   }
  };

  window._offerSaveAsRoutine = function(entry) {
   var html = '<div class="text-center">';
   html += '<div style="font-size:32px;margin-bottom:12px">\uD83D\uDCBE</div>';
   html += '<p class="text-sm text-white font-bold mb-2">' + window.t('saveAsRoutine', 'Als Routine speichern?') + '</p>';
   html += '<p class="text-[10px] mb-4" style="color:#9898a2">' + window.t('saveAsRoutineSub', 'Beim n\u00e4chsten Mal mit einem Tap laden.') + '</p>';
   html += '<input id="routineNameInput" type="text" placeholder="' + window.t('routineName', 'Name (z.B. Push Day)') + '" class="w-full px-3 py-2.5 rounded-xl text-sm text-white font-bold outline-none pointer-events-auto mb-3" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">';
   html += '<div class="flex gap-2">';
   html += '<button onclick="window.toggleModal(\'routineSaveModal\')" class="flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer pointer-events-auto" style="background:none;border:1px solid var(--border-hex);color:#888" aria-label="Nicht jetzt">' + window.t('notNow', 'Nicht jetzt') + '</button>';
   html += '<button onclick="window._confirmSaveRoutine()" class="flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.25);color:var(--primary-hex)" aria-label="Routine speichern">' + window.t('saveRoutine', 'Speichern') + '</button>';
   html += '</div></div>';
   window._pendingRoutineEntry = entry;
   var content = document.getElementById('routineSaveContent');
   if (content) content.innerHTML = html;
   window.toggleModal('routineSaveModal');
  };

  window._confirmSaveRoutine = function() {
   var name = (document.getElementById('routineNameInput') || {}).value || '';
   if (!name.trim()) { window.showToast(window.t('routineNeedName', 'Bitte Name eingeben')); return; }
   var today = new Date().toISOString().split('T')[0];
   var allW = (window.workouts || []).filter(function(w) { return w.date === today && w.category === 'strength' && w.archived; });
   if (allW.length === 0 && window._pendingRoutineEntry) allW = [window._pendingRoutineEntry];
   var routine = { id: crypto.randomUUID ? crypto.randomUUID() : 'r_' + Date.now(), name: name.trim(), category: 'strength', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), timesUsed: 1, exercises: [] };
   allW.forEach(function(w) {
    var sets = w.setDetails || [];
    var avgReps = 0, avgWeight = 0, avgRir = null;
    if (sets.length > 0) {
     avgReps = Math.round(sets.reduce(function(a, s) { return a + (parseFloat(s.reps) || 0); }, 0) / sets.length);
     avgWeight = Math.round(sets.reduce(function(a, s) { return a + (parseFloat(s.weight) || 0); }, 0) / sets.length * 2) / 2;
     var rirsV = sets.filter(function(s) { return s.rir != null && !isNaN(s.rir); });
     if (rirsV.length > 0) avgRir = Math.round(rirsV.reduce(function(a, s) { return a + parseFloat(s.rir); }, 0) / rirsV.length);
    }
    routine.exercises.push({ name: w.exercise || '', sets: sets.length || 1, reps: avgReps || 8, weight: avgWeight || 0, rir: avgRir, equipment: w.equipment || '', restSeconds: 120, notes: '' });
   });
   var routines = JSON.parse(localStorage.getItem('base_routines') || '[]');
   routines.unshift(routine);
   localStorage.setItem('base_routines', JSON.stringify(routines));
   if (window._syncAppData) window._syncAppData('base_routines', routines);
   window._pendingRoutineEntry = null;
   window.toggleModal('routineSaveModal');
   window.showToast(window.t('routineSaved', 'Routine gespeichert!'));
   window._renderRoutineCards();
  };

  window._offerUpdateRoutine = function(rName) {
   if (!rName) return;
   window.showModal(window.t('updateRoutineQ', 'Routine aktualisieren?'), window.t('updateRoutineText', 'Gewichte in "' + window._escapeHtml(rName) + '" mit heutigen Werten aktualisieren?'), true, function() {
    var routines = JSON.parse(localStorage.getItem('base_routines') || '[]');
    var routine = routines.find(function(r) { return r.name === rName; });
    if (!routine) return;
    var today = new Date().toISOString().split('T')[0];
    var todaysW = (window.workouts || []).filter(function(w) { return w.date === today && w.category === 'strength' && w.archived; });
    todaysW.forEach(function(w, i) {
     if (routine.exercises[i]) {
      var sets = w.setDetails || [];
      if (sets.length > 0) {
       routine.exercises[i].sets = sets.length;
       routine.exercises[i].reps = Math.round(sets.reduce(function(a, s) { return a + (parseFloat(s.reps) || 0); }, 0) / sets.length);
       routine.exercises[i].weight = Math.round(sets.reduce(function(a, s) { return a + (parseFloat(s.weight) || 0); }, 0) / sets.length * 2) / 2;
      }
     }
    });
    localStorage.setItem('base_routines', JSON.stringify(routines));
    if (window._syncAppData) window._syncAppData('base_routines', routines);
    window.showToast(window.t('routineUpdated', 'Routine aktualisiert!'));
    window._renderRoutineCards();
   });
  };

  window._showAllRoutines = function() {
   var routines = JSON.parse(localStorage.getItem('base_routines') || '[]');
   var html = '';
   if (routines.length === 0) {
    html = '<div class="text-center py-8"><p class="text-sm" style="color:#9898a2">' + window.t('noRoutines', 'Noch keine Routinen.') + '</p></div>';
   } else {
    routines.forEach(function(r) {
     var exList = (r.exercises || []).map(function(e) {
      return '<div class="flex items-center justify-between py-1"><span class="text-[10px] text-white">' + window._escapeHtml(e.name) + '</span><span class="text-[9px]" style="color:#9898a2">' + e.sets + '\u00d7' + e.reps + ' \u00b7 ' + e.weight + 'kg</span></div>';
     }).join('');
     html += '<div class="p-4 rounded-xl mb-3" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">';
     html += '<div class="flex items-center justify-between mb-2">';
     html += '<span class="text-sm font-bold text-white">' + window._escapeHtml(r.name) + '</span>';
     html += '<div class="flex gap-2">';
     html += '<button onclick="window._loadRoutine(\'' + window._escapeHtml(r.id).replace(/'/g,'&#39;') + '\');window.toggleModal(\'allRoutinesModal\')" class="text-[9px] font-bold px-2 py-1 rounded cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.1);color:var(--primary-hex)" aria-label="Laden">' + window.t('btnLoad','Laden') + '</button>';
     html += '<button onclick="window._deleteRoutine(\'' + window._escapeHtml(r.id).replace(/'/g,'&#39;') + '\')" class="text-[9px] font-bold px-2 py-1 rounded cursor-pointer pointer-events-auto" style="color:#e88a8a" aria-label="L\u00f6schen">' + window.t('btnDelete','L\u00f6schen') + '</button>';
     html += '</div></div>';
     html += '<div class="text-[8px] mb-2" style="color:#9898a2">' + (r.exercises||[]).length + ' ' + window.t('lblExercises','\u00dcbungen') + ' \u00b7 ' + (r.timesUsed || 0) + 'x</div>';
     html += exList + '</div>';
    });
   }
   var content = document.getElementById('allRoutinesContent');
   if (content) content.innerHTML = html;
   window.toggleModal('allRoutinesModal');
  };

  window._deleteRoutine = function(id) {
   var routines = JSON.parse(localStorage.getItem('base_routines') || '[]');
   routines = routines.filter(function(r) { return r.id !== id; });
   localStorage.setItem('base_routines', JSON.stringify(routines));
   if (window._syncAppData) window._syncAppData('base_routines', routines);
   window._showAllRoutines();
   window._renderRoutineCards();
   window.showToast(window.t('routineDeleted', 'Routine gel\u00f6scht'));
  };
  // === END ROUTINEN ===

  window.startVoiceInput = function() {
   var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
   if(!SpeechRec) { window.showToast(window.t('toastError', 'Spracheingabe nicht verfügbar')); return; }
   var recognition = new SpeechRec();
   recognition.lang = window.currentLang === 'en' ? 'en-US' : 'de-DE';
   recognition.continuous = false;
   recognition.interimResults = false;
   var btn = document.getElementById('voiceInputBtn');
   if(btn) { btn.style.background = 'rgba(239,68,68,0.15)'; btn.style.borderColor = 'rgba(239,68,68,0.3)'; btn.style.color = '#ef4444'; }
   window.showToast(window.t('toastUpdate', 'Sprich jetzt...'));
   recognition.onresult = function(event) {
    var transcript = event.results[0][0].transcript;
    if(btn) { btn.style.background = 'var(--inner-bg-hex)'; btn.style.borderColor = 'var(--border-hex)'; btn.style.color = 'var(--text-muted)'; }
    window._parseVoiceWorkout(transcript);
   };
   recognition.onerror = function() {
    if(btn) { btn.style.background = 'var(--inner-bg-hex)'; btn.style.borderColor = 'var(--border-hex)'; btn.style.color = 'var(--text-muted)'; }
    window.showToast(window.t('toastError', 'Spracheingabe fehlgeschlagen'));
   };
   recognition.onend = function() {
    if(btn) { btn.style.background = 'var(--inner-bg-hex)'; btn.style.borderColor = 'var(--border-hex)'; btn.style.color = 'var(--text-muted)'; }
   };
   recognition.start();
  };
  window._parseVoiceWorkout = function(text) {
   var exerciseInput = document.getElementById('exerciseInput');
   var match = text.match(/^(.+?)\s+(\d+)\s*(?:mal|sets|sätze|x)\s*(\d+)\s*(?:mit|bei|at|@)?\s*(\d+(?:[.,]\d+)?)\s*(?:kilo|kg)?$/i);
   if(match) {
    var exercise = match[1].trim();
    var sets = parseInt(match[2]);
    var reps = parseInt(match[3]);
    var weight = parseFloat(match[4].replace(',', '.'));
    if(exerciseInput) exerciseInput.value = exercise;
    var setsInput = document.getElementById('setsInput');
    if(setsInput && window.currentCategory === 'strength') {
     setsInput.value = sets;
     if(window.generateSetFields) window.generateSetFields(sets);
     setTimeout(function() {
      for(var s = 1; s <= sets; s++) {
       var r = document.getElementById('wdh_s' + s);
       var w = document.getElementById('weight_s' + s);
       if(r) r.value = reps;
       if(w) w.value = weight;
      }
     }, 100);
    }
    window.showToast(exercise + ': ' + sets + 'x' + reps + ' @ ' + weight + 'kg');
   } else {
    if(exerciseInput) exerciseInput.value = text.trim();
    window.showToast('"' + text.trim() + '" erkannt');
   }
  };
  if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
   var vb = document.getElementById('voiceInputBtn');
   if(vb) vb.style.display = 'none';
  }

  window.generateStoryImage = function() {
   var archived = (window.workouts || []).filter(function(w) { return w.archived; });
   var today = new Date().toISOString().split('T')[0];
   var todayWorkouts = archived.filter(function(w) { return w.date === today; });
   if(todayWorkouts.length === 0) todayWorkouts = archived.slice(-5);
   var canvas = document.createElement('canvas');
   canvas.width = 1080; canvas.height = 1920;
   var ctx = canvas.getContext('2d');
   ctx.fillStyle = '#07070a'; ctx.fillRect(0, 0, 1080, 1920);
   var grad = ctx.createLinearGradient(0, 0, 1080, 1920);
   grad.addColorStop(0, 'rgba(6,182,212,0.08)'); grad.addColorStop(0.5, 'transparent'); grad.addColorStop(1, 'color-mix(in srgb, var(--primary-hex), transparent 94%)');
   ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1920);
   ctx.fillStyle = '#06b6d4'; ctx.fillRect(80, 120, 200, 3);
   ctx.fillStyle = '#06b6d4'; ctx.font = '600 28px sans-serif'; ctx.textAlign = 'left';
   ctx.fillText(new Date().toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase(), 80, 180);
   ctx.fillStyle = '#ffffff'; ctx.font = '900 80px sans-serif';
   ctx.fillText('WORKOUT', 80, 300); ctx.fillText('DONE.', 80, 390);
   var y = 500;
   todayWorkouts.slice(0, 7).forEach(function(w) {
    ctx.fillStyle = '#ffffff'; ctx.font = '700 36px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText((w.exercise || '').toUpperCase(), 80, y);
    var detail = '';
    if(w.setDetails && w.setDetails.length > 0) {
     var maxW = Math.max.apply(null, w.setDetails.map(function(s) { return parseFloat(s.weight) || 0; }));
     detail = w.setDetails.length + ' Sets x ' + (w.setDetails[0].reps || '') + ' Wdh' + (maxW > 0 ? ' @ ' + maxW + ' kg' : '');
    }
    ctx.fillStyle = '#52525b'; ctx.font = '500 24px sans-serif'; ctx.fillText(detail, 80, y + 35);
    y += 100;
   });
   var totalVol = 0;
   todayWorkouts.forEach(function(w) { if(w.setDetails) w.setDetails.forEach(function(s) { totalVol += (parseFloat(s.reps)||0) * (parseFloat(s.weight)||0); }); });
   ctx.fillStyle = 'rgba(6,182,212,0.06)';
   ctx.beginPath(); ctx.roundRect(60, 1620, 960, 140, 24); ctx.fill();
   ctx.strokeStyle = 'rgba(6,182,212,0.15)'; ctx.lineWidth = 1; ctx.stroke();
   ctx.fillStyle = '#ffffff'; ctx.font = '900 56px sans-serif'; ctx.textAlign = 'center';
   if(totalVol > 0) { ctx.fillText(Math.round(totalVol).toLocaleString('de-DE') + ' KG', 540, 1700); ctx.fillStyle = '#52525b'; ctx.font = '600 22px sans-serif'; ctx.fillText('GESAMTVOLUMEN', 540, 1735); }
   else { ctx.fillText(todayWorkouts.length + ' ÜBUNGEN', 540, 1700); ctx.fillStyle = '#52525b'; ctx.font = '600 22px sans-serif'; ctx.fillText('ABSOLVIERT', 540, 1735); }
   ctx.fillStyle = '#27272a'; ctx.font = '700 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('base-app.tech', 540, 1860);
   canvas.toBlob(function(blob) {
    if(!blob) return;
    var file = new File([blob], 'BASE-Workout.png', { type: 'image/png' });
    if(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
     navigator.share({ files: [file], title: 'Mein BASE Workout' }).catch(function() {});
    } else {
     var link = document.createElement('a'); link.download = 'BASE-Workout-' + today + '.png'; link.href = URL.createObjectURL(blob); link.click(); URL.revokeObjectURL(link.href);
    }
   }, 'image/png');
  };

  window.calculateStreak = function() {
   if(!Array.isArray(window.workouts)) return;

   const getWeekKey = (date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-${String(weekNum).padStart(2,'0')}`;
   };

   const trainedWeeks = new Set(
    window.workouts.filter(w => w.archived).map(w => getWeekKey(w.date))
   );

   let streak = 0;
   const now = new Date();
   let check = new Date(now);
   for(let i = 0; i < 104; i++) { // max 2 Jahre zurück
    const key = getWeekKey(check);
    if(trainedWeeks.has(key)) {
     streak++;
     check.setDate(check.getDate() - 7);
    } else {
     if(i === 0) { check.setDate(check.getDate() - 7); continue; }
     break;
    }
   }

   // Wochen-Streak Badge entfernt — nur Tage-Streak bleibt

   const archived = window.workouts.filter(w => w.archived && w.date).sort((a,b) => b.date.localeCompare(a.date));
   let dayStreak = 0;
   if(archived.length > 0) {
    const uniqueDates = [...new Set(archived.map(w => w.date))].sort((a,b) => b.localeCompare(a));
    const today = new Date(); today.setHours(0,0,0,0);
    for(let i = 0; i < uniqueDates.length; i++) {
     const d = new Date(uniqueDates[i]); d.setHours(0,0,0,0);
     const expected = new Date(today); expected.setDate(expected.getDate() - i);
     if(Math.abs(expected - d) < 86400000) { dayStreak++; } else break;
    }
   }
   var prevStreak = parseInt(localStorage.getItem('base_streak_count') || '0');
   localStorage.setItem('base_streak_count', dayStreak);
   localStorage.setItem('base_streak_last_date', new Date().toISOString().split('T')[0]);
   if(dayStreak >= 7 && prevStreak < 7 && window.awardXP) window.awardXP('streak7');
   if(dayStreak >= 30 && prevStreak < 30 && window.awardXP) window.awardXP('streak30');

   const bar = document.getElementById('streakBar');
   const countEl = document.getElementById('streakCount');
   if(bar && countEl) {
    if(dayStreak <= 0) { bar.classList.add('hidden'); bar.classList.remove('flex'); }
    else {
     countEl.textContent = dayStreak;
     bar.classList.remove('hidden'); bar.classList.add('flex');
     bar.className = bar.className.replace(/bg-amber-\S+|border-amber-\S+/g, '');
     if(dayStreak > 30) { bar.style.cssText = 'background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4)'; }
     else if(dayStreak > 7) { bar.style.cssText = 'background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3)'; countEl.classList.add('animate-pulse'); }
     else { bar.style.cssText = ''; bar.classList.add('bg-amber-500/5', 'border', 'border-amber-500/10'); countEl.classList.remove('animate-pulse'); }
    }
   }
   // Streak-Warnung wenn Streak in Gefahr
   if(dayStreak >= 3) {
    var _lwDate = localStorage.getItem('base_last_workout');
    if(_lwDate) {
     var _hoursSince = (Date.now() - new Date(_lwDate).getTime()) / 3600000;
     if(_hoursSince >= 20 && _hoursSince < 28) {
      var xpBar = document.getElementById('xpBarContainer');
      if(xpBar && !xpBar.querySelector('.streak-warning')) {
       var _sw = document.createElement('div'); _sw.className = 'streak-warning';
       _sw.style.cssText = 'text-align:center;padding:4px;font-size:10px;font-weight:700;color:#e88a8a';
       _sw.textContent = '\u26a0\ufe0f ' + window.t('streakWarning','Deine ' + dayStreak + '-Tage Streak endet bald!');
       xpBar.appendChild(_sw);
      }
     }
    }
   }
  };

  window.shareWorkout = function(id) {
   const w = window.workouts.find(x => x.id === id);
   if(!w) return;
   let details = '';
   if(w.setDetails && w.setDetails.length > 0) details = w.setDetails.map(s=>`${s.reps}×${s.weight}kg`).join(' | ');
   else if(w.data) details = Object.entries(w.data).map(([k,v])=>`${k}: ${v}`).join(' | ');
   const text = `🏋️ ${w.exercise} — ${w.date}\n${details}\n\nTracked with BASE V2`;
   if(navigator.share) { navigator.share({title:'Workout', text}); }
   else { navigator.clipboard?.writeText(text).then(()=>window.showToast(window.t("toastCopied"))); }
  };

  window.calc1RM = function(weight, reps, rpe) {
   let w = parseFloat(weight), r = parseInt(reps), rpeVal = parseFloat(rpe) || 10;
   if(!w || !r || r < 1) return null;
   const rpeFactor = rpeVal < 10 ? 1 + (10 - rpeVal) * 0.03 : 1;
   const adjusted = w * rpeFactor;
   return Math.round(adjusted * (1 + r / 30));
  };

  window.calcORM = function() {
   const w = document.getElementById('orm_weight')?.value;
   const r = document.getElementById('orm_reps')?.value;
   const rpe = document.getElementById('orm_rpe')?.value;
   const result = document.getElementById('orm_result');
   const valueEl = document.getElementById('orm_value');
   const pctEl = document.getElementById('orm_percentages');
   if(!w || !r) { if(result) result.classList.add('hidden'); return; }
   const orm = window.calc1RM(w, r, rpe);
   if(!orm) return;
   if(valueEl) valueEl.textContent = orm + ' kg';
   if(result) result.classList.remove('hidden');
   if(pctEl) {
    const pcts = [90, 80, 70, 60];
    pctEl.innerHTML = pcts.map(p => `
     <div class="bg-zinc-900 rounded-lg p-2 text-center">
      <p class="text-[10px] font-black text-zinc-500 uppercase">${p}%</p>
      <p class="text-white font-black text-sm">${Math.round(orm * p / 100)} kg</p>
     </div>`).join('');
   }
  };

  window.get1RMsFromHistory = function() {
   const orms = {};
   window.workouts.filter(w => w.category === 'strength' && w.setDetails && w.setDetails.length > 0)
    .forEach(w => {
     const extraRPE = w.data ? Object.entries(w.data).find(([k]) => k.toLowerCase().includes('rpe')) : null;
     const rpe = extraRPE ? parseFloat(extraRPE[1]) : 10;
     w.setDetails.forEach(s => {
      if(s.weight > 0 && s.reps > 0) {
       const orm = window.calc1RM(s.weight, s.reps, rpe);
       if(orm && (!orms[w.exercise] || orm > orms[w.exercise].value)) {
        orms[w.exercise] = { value: orm, weight: s.weight, reps: s.reps, date: w.date };
       }
      }
     });
    });
   try { var _1rmStore = {}; Object.entries(orms).forEach(function(e) { _1rmStore[e[0]] = e[1].value; }); localStorage.setItem('base_1rm_data', JSON.stringify(_1rmStore)); } catch(e) {}
   return orms;
  };

  window._ormSortMode = 'value';
  window._ormData = null;

  window._render1RMList = function(sortBy) {
   var orms = window._ormData;
   if (!orms) return;
   window._ormSortMode = sortBy || window._ormSortMode || 'value';
   var listEl = document.getElementById('orm_history_list');
   var emptyEl = document.getElementById('orm_history_empty');
   var sortBtnsEl = document.getElementById('orm_sort_buttons');
   var entries = Object.entries(orms);
   if (window._ormSortMode === 'value') entries.sort(function(a,b) { return b[1].value - a[1].value; });
   else if (window._ormSortMode === 'name') entries.sort(function(a,b) { return a[0].localeCompare(b[0]); });
   else if (window._ormSortMode === 'date') entries.sort(function(a,b) { return (b[1].date || '').localeCompare(a[1].date || ''); });
   if (entries.length === 0) {
    if(listEl) listEl.innerHTML = '';
    if(emptyEl) { emptyEl.classList.remove('hidden'); emptyEl.classList.add('block'); }
    if(sortBtnsEl) sortBtnsEl.classList.add('hidden');
   } else {
    if(emptyEl) { emptyEl.classList.add('hidden'); emptyEl.classList.remove('block'); }
    var _sm = window._ormSortMode;
    var _btnStyle = function(mode) { return mode === _sm ? 'background:rgba(232,168,78,0.15);border:1px solid rgba(232,168,78,0.3);color:#e8a84e' : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:#9898a2'; };
    if (sortBtnsEl) {
     sortBtnsEl.classList.remove('hidden');
     sortBtnsEl.innerHTML = '<span class="text-[8px] font-bold uppercase tracking-wider" style="color:#9898a2">Sortieren:</span>' +
      '<button type="button" onclick="window._render1RMList(\'value\')" class="px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer pointer-events-auto" style="' + _btnStyle('value') + '" aria-label="Sort by 1RM">1RM</button>' +
      '<button type="button" onclick="window._render1RMList(\'name\')" class="px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer pointer-events-auto" style="' + _btnStyle('name') + '" aria-label="Sort by Name">Name</button>' +
      '<button type="button" onclick="window._render1RMList(\'date\')" class="px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer pointer-events-auto" style="' + _btnStyle('date') + '" aria-label="Sort by Date">Datum</button>';
    }
    if(listEl) listEl.innerHTML = entries.map(function(e) { var ex = e[0]; var d = e[1]; return '<div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:border-orange-500/30 transition-all cursor-pointer pointer-events-auto" onclick="document.getElementById(\'orm_weight\').value=' + d.weight + '; document.getElementById(\'orm_reps\').value=' + d.reps + '; window.calcORM();"><div><p class="text-white font-black text-sm">' + window._escapeHtml(ex) + '</p><p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">' + d.weight + 'kg \u00d7 ' + d.reps + 'Wdh \u00b7 ' + d.date + '</p></div><div class="text-right"><p class="text-[10px] font-black text-orange-400 uppercase tracking-widest">~1RM</p><p class="text-2xl font-black text-white">' + d.value + ' <span class="text-sm text-zinc-500">kg</span></p></div></div>'; }).join('');
   }
  };

  window.openOneRMModal = function() {
   window._ormData = window.get1RMsFromHistory();
   var listEl = document.getElementById('orm_history_list');
   if (listEl && !document.getElementById('orm_sort_buttons')) {
    var sortDiv = document.createElement('div');
    sortDiv.id = 'orm_sort_buttons';
    sortDiv.className = 'flex items-center gap-2 mb-3 hidden';
    listEl.parentNode.insertBefore(sortDiv, listEl);
   }
   window._render1RMList('value');
   window.toggleModal('oneRMModal');
   window._refreshLucide();
  };

  let _bragCardData = null;

  window.showBragCard = function(type, data) {
   _bragCardData = data;
   const isCardio = data.category === 'cardio';
   const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4';

   const stat1Label = isCardio ? 'Distanz' : 'Volumen';
   const stat1Value = isCardio ? (parseFloat(data.distance) > 0 ? data.distance + ' km' : '—') : (data.volume > 0 ? Math.round(data.volume) + ' kg' : '—');
   const stat2Label = 'Dauer';
   const stat2Value = data.duration || '—';

   const html = `
    <div style="background: linear-gradient(135deg, #09090b 0%, #18181b 100%); padding: 32px; font-family: 'Inter', sans-serif;">
     <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
      <div style="width:40px;height:40px;border-radius:12px;background:${primary}20;border:1px solid ${primary}40;display:flex;align-items:center;justify-content:center;">
       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${primary}" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>
      <div>
       <p style="color:${primary};font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;margin:0;">BASE Tracker</p>
       <p style="color:#71717a;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0;">${new Date().toLocaleDateString('de-DE')}</p>
      </div>
     </div>
     <p style="color:#fff;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:-0.03em;margin:0 0 6px 0;line-height:1.1;">Workout<br>Complete 💪</p>
     <p style="color:#52525b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 24px 0;">${data.exercises || 'Training'}</p>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
      <div style="background:#ffffff08;border:1px solid #ffffff10;border-radius:16px;padding:16px;">
       <p style="color:#71717a;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px 0;">${stat1Label}</p>
       <p style="color:#fff;font-size:22px;font-weight:900;margin:0;">${stat1Value}</p>
      </div>
      <div style="background:#ffffff08;border:1px solid #ffffff10;border-radius:16px;padding:16px;">
       <p style="color:#71717a;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px 0;">${stat2Label}</p>
       <p style="color:#fff;font-size:22px;font-weight:900;margin:0;">${stat2Value}</p>
      </div>
     </div>
     <div style="height:3px;background:linear-gradient(to right,${primary},var(--primary-hex));border-radius:999px;"></div>
     <p style="text-align:center;color:#333;font-size:11px;margin-top:16px;">Tracked mit BASE \u2014 base-app.tech</p>
    </div>`;

   const container = document.getElementById('bragCardContent');
   if(container) container.innerHTML = html;
   window.toggleModal('bragCardModal');
  };

  window.downloadBragCard = function() {
   var canvas = window._bragCardCanvas;
   if (!canvas) { window.showToast('Karte nicht verfügbar'); return; }
   var format = window._bragFormat || 'tiktok';
   var a = document.createElement('a');
   a.download = 'BASE_Workout_' + format + '_' + new Date().toISOString().slice(0,10) + '.png';
   a.href = canvas.toDataURL('image/png', 1.0);
   a.click();
   window.showToast('Gespeichert — bereit für ' + (format === 'instagram' ? 'Instagram' : format === 'story' ? 'Story' : 'TikTok') + '!');
  };

  window.shareBragCard = function() {
   const el = document.getElementById('bragCardContent');
   if(!el) {
    const d = _bragCardData;
    const text = `💪 Workout Complete!\n${d?.exercises || ''}\n⏱ ${d?.duration || ''}\nTracked with BASE Tracker`;
    navigator.share ? navigator.share({ title: 'Workout', text }) : navigator.clipboard?.writeText(text).then(() => window.showToast(window.t('toastCopied')));
    return;
   }
   window._ensureHtml2Canvas().then(() => html2canvas(el, { backgroundColor: '#09090b', scale: 2, useCORS: true })).then(async canvas => {
    canvas.toBlob(async blob => {
     if(navigator.share && blob) {
      try {
       await navigator.share({ title: 'Workout Complete', files: [new File([blob], 'workout.png', { type: 'image/png' })] });
      } catch(e) { window.showToast(window.t('toastError', 'Teilen abgebrochen')); }
     } else {
      window.downloadBragCard();
     }
    });
   }).catch(() => window.showToast(window.t('toastError')));
  };

  // --- Brag Card Format System ---
  window._bragFormat = 'tiktok';
  window._lastBragCardData = null;

  window._setBragFormat = function(format, btn) {
   window._bragFormat = format;
   document.querySelectorAll('[id^="bragFmt"]').forEach(function(b) {
    b.style.background = 'transparent';
    b.style.borderColor = 'var(--border-hex)';
    b.style.color = 'var(--text-muted)';
   });
   if (btn) {
    btn.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 85%)';
    btn.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 60%)';
    btn.style.color = 'var(--primary-hex)';
   }
   if (window._lastBragCardData) {
    window.generateWorkoutBragCard(window._lastBragCardData);
   }
  };

  window.generateWorkoutBragCard = function(data) {
   window._lastBragCardData = data;
   var format = window._bragFormat || 'tiktok';
   var canvas = document.createElement('canvas');
   var W, H;
   if (format === 'instagram') { W = 1080; H = 1080; }
   else { W = 1080; H = 1920; }
   canvas.width = W; canvas.height = H;
   var ctx = canvas.getContext('2d');
   var primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#a3c9a8';
   var grad = ctx.createLinearGradient(0, 0, W, H);
   grad.addColorStop(0, '#080f08'); grad.addColorStop(0.5, '#0a140a'); grad.addColorStop(1, '#060c06');
   ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
   ctx.strokeStyle = 'rgba(163,201,168,0.04)'; ctx.lineWidth = 1;
   for (var gx = 0; gx < W; gx += 80) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
   for (var gy = 0; gy < H; gy += 80) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
   var glowGrad = ctx.createRadialGradient(W/2, 0, 0, W/2, 0, H*0.5);
   glowGrad.addColorStop(0, 'rgba(163,201,168,0.08)'); glowGrad.addColorStop(1, 'rgba(163,201,168,0)');
   ctx.fillStyle = glowGrad; ctx.fillRect(0, 0, W, H);
   var scale = W / 1080;
   var centerY = H / 2;
   ctx.font = 'bold ' + Math.round(32*scale) + 'px Outfit, sans-serif'; ctx.fillStyle = primary; ctx.textAlign = 'center';
   ctx.fillText('BASE', W/2, Math.round(80*scale));
   var badgeY = Math.round(130*scale);
   ctx.fillStyle = 'rgba(163,201,168,0.1)';
   var bw = Math.round(380*scale), bh = Math.round(52*scale), bx = (W-bw)/2, by = badgeY - bh*0.75;
   ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, Math.round(26*scale)); ctx.fill();
   ctx.strokeStyle = 'rgba(163,201,168,0.25)'; ctx.lineWidth = 1.5*scale; ctx.stroke();
   ctx.font = 'bold ' + Math.round(20*scale) + 'px Outfit, sans-serif'; ctx.fillStyle = primary;
   ctx.fillText('WORKOUT COMPLETE', W/2, badgeY);
   var volY = format === 'instagram' ? centerY - Math.round(80*scale) : Math.round(360*scale);
   ctx.font = 'bold ' + Math.round(140*scale) + 'px Outfit, sans-serif'; ctx.fillStyle = '#ffffff';
   ctx.fillText(data.volume || '0', W/2, volY);
   ctx.font = Math.round(28*scale) + 'px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
   ctx.fillText('KG VOLUMEN', W/2, volY + Math.round(44*scale));
   var statsY = format === 'instagram' ? centerY + Math.round(80*scale) : Math.round(600*scale);
   var stats = [
    { label: 'DAUER', value: data.duration || '\u2014' },
    { label: '\u00dcBUNGEN', value: String(data.exerciseCount || data.exercises || '\u2014') },
    { label: 'SETS', value: String(data.sets || '\u2014') },
    { label: 'PRs', value: String(data.prs || '0') }
   ];
   var colW = W / 4;
   stats.forEach(function(s, i) {
    var cx = colW * i + colW/2;
    if (i > 0) { ctx.strokeStyle = 'rgba(163,201,168,0.15)'; ctx.lineWidth = 1*scale; ctx.beginPath(); ctx.moveTo(cx - colW/2, statsY - Math.round(30*scale)); ctx.lineTo(cx - colW/2, statsY + Math.round(50*scale)); ctx.stroke(); }
    ctx.font = 'bold ' + Math.round(44*scale) + 'px Outfit, sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    ctx.fillText(s.value, cx, statsY);
    ctx.font = Math.round(18*scale) + 'px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(s.label, cx, statsY + Math.round(32*scale));
   });
   ctx.textAlign = 'center';
   if (format !== 'instagram' && (data.exerciseList || data.exercises)) {
    var exY = Math.round(780*scale);
    var exList = Array.isArray(data.exerciseList) ? data.exerciseList.slice(0, 5).map(function(e) { return e.name || e; }) : Array.isArray(data.exercises) ? data.exercises.slice(0, 5) : String(data.exercises).split(',').slice(0, 5);
    ctx.font = Math.round(26*scale) + 'px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
    exList.forEach(function(ex, i) { ctx.fillText('\u2022 ' + String(ex).trim(), W/2, exY + i * Math.round(44*scale)); });
   }
   var lineY = format === 'instagram' ? H - Math.round(140*scale) : H - Math.round(200*scale);
   var lineGrad = ctx.createLinearGradient(W*0.1, 0, W*0.9, 0);
   lineGrad.addColorStop(0, 'rgba(163,201,168,0)'); lineGrad.addColorStop(0.5, 'rgba(163,201,168,0.4)'); lineGrad.addColorStop(1, 'rgba(163,201,168,0)');
   ctx.strokeStyle = lineGrad; ctx.lineWidth = 1.5*scale; ctx.beginPath(); ctx.moveTo(W*0.1, lineY); ctx.lineTo(W*0.9, lineY); ctx.stroke();
   var dateStr = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
   ctx.font = Math.round(22*scale) + 'px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
   ctx.fillText(dateStr + ' \u00B7 base-app.tech', W/2, lineY + Math.round(48*scale));
   if (format === 'tiktok') {
    ctx.font = 'bold ' + Math.round(28*scale) + 'px Outfit, sans-serif'; ctx.fillStyle = primary;
    ctx.fillText('Tracke dein Training \u00B7 base-app.tech', W/2, H - Math.round(80*scale));
   }
   var img = canvas.toDataURL('image/png');
   var preview = document.getElementById('bragCardContent');
   if (preview) {
    var maxH = format === 'instagram' ? '320px' : '480px';
    preview.innerHTML = '<img src="' + img + '" style="width:100%;max-height:' + maxH + ';object-fit:contain;border-radius:12px" alt="Brag Card"/>';
   }
   window._bragCardCanvas = canvas;
   return canvas;
  };

  window.shareWorkoutBragCard = function(data) {
   if(!data) return;
   var canvas = window.generateWorkoutBragCard(data);
   canvas.toBlob(function(blob) {
    if(!blob) { window.showToast('Fehler beim Erstellen'); return; }
    var file = new File([blob], 'base-workout.png', { type: 'image/png' });
    if(navigator.canShare && navigator.canShare({ files: [file] })) {
     navigator.share({ files: [file], title: 'Mein Workout', text: 'Tracked mit BASE \u2014 base-app.tech' }).catch(function() {});
    } else {
     var a = document.createElement('a');
     a.href = canvas.toDataURL('image/png'); a.download = 'base-workout.png';
     document.body.appendChild(a); a.click(); document.body.removeChild(a);
     window.showToast('Bild gespeichert! Teile es auf Instagram oder WhatsApp.');
    }
   }, 'image/png');
  };

  window.removeField = function(fieldId) {
   const catData = window.categorySchemas[window.currentCategory];
   if(!catData || !catData.schema) return;
   catData.schema = catData.schema.filter(f => f.id !== fieldId);
   const all = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas')||'{}');
   all[window.currentCategory] = catData;
   localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(all));
   window.renderDynamicForm(catData.sportName, catData.schema, window.currentCategory);
  };

  window.removeExtraField = function(cat, fieldId) {
   if(!window.categorySchemas[cat] || !window.categorySchemas[cat].extraFields) return;
   window.categorySchemas[cat].extraFields = window.categorySchemas[cat].extraFields.filter(f => f.id !== fieldId);
   const all = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas')||'{}');
   all[cat] = window.categorySchemas[cat];
   localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(all));
   window.switchCategory(cat);
  };

  let _feedbackStar = 0;
  let _feedbackCat = '';

  window._feedbackCatSelect = function(cat) {
   _feedbackCat = cat;
   document.querySelectorAll('.feedback-cat').forEach(function(el) {
    el.classList.remove('active');
    if (el.textContent.trim() === cat) { el.classList.add('active'); }
   });
  };

  (function() {
   function initFeedbackDelegation() {
    var modal = document.getElementById('feedbackModal');
    if (!modal || modal._delegationReady) return;
    modal._delegationReady = true;
    console.log('FEEDBACK DELEGATION INITIALIZED');

    modal.addEventListener('click', function(e) {
     var star = e.target.closest('.feedback-star');
     if (star) {
      var n = parseInt(star.getAttribute('data-star'));
      if (n) window.setFeedbackStar(n);
      return;
     }
     var cat = e.target.closest('.feedback-cat');
     if (cat) {
      var text = cat.textContent.trim();
      window._feedbackCatSelect(text);
      return;
     }
    }, true);
   }
   if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(initFeedbackDelegation, 300); });
   } else {
    setTimeout(initFeedbackDelegation, 300);
   }
  })();

  window.setFeedbackStar = function(n) {
   _feedbackStar = n;
   document.querySelectorAll('.feedback-star').forEach(function(el, i) {
    if (i < n) { el.classList.add('active'); } else { el.classList.remove('active'); }
   });
  };

  window.toggleFeedbackCat = function(btn) {
   const isActive = btn.classList.contains('cat-active-fb');
   document.querySelectorAll('.feedback-cat').forEach(b => {
    b.classList.remove('cat-active-fb');
    b.style.borderColor = '';
    b.style.color = '';
    b.style.background = '';
   });
   if(!isActive) {
    btn.classList.add('cat-active-fb');
    btn.style.borderColor = 'rgba(6,182,212,0.5)';
    btn.style.color = '#06b6d4';
    btn.style.background = 'rgba(6,182,212,0.08)';
    _feedbackCat = btn.textContent.trim();
   } else {
    _feedbackCat = '';
   }
  };

  window.submitFeedback = async function() {
   const text = document.getElementById('feedbackText')?.value?.trim();
   const email = document.getElementById('feedbackEmail')?.value?.trim();
   const btn = document.getElementById('btnSubmitFeedback');

   if(!text && _feedbackStar === 0) {
    window.showToast(window.t('toastError', 'Bitte Feedback ausfüllen'));
    return;
   }

   const entry = {
    stars: _feedbackStar,
    category: _feedbackCat || 'Allgemein',
    text: text || '',
    email: email || '',
    lang: window.currentLang,
    appVersion: 'V2.8',
    workoutCount: Array.isArray(window.workouts) ? window.workouts.filter(w => w.archived).length : 0,
    timestamp: new Date().toISOString(),
    uid: window._firebaseUser?.uid || 'anonymous'
   };

   if(btn) { btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin pointer-events-none inline-block mr-2"></i> Sendet...'; window._refreshLucide(); }

   try {
    if(window._db && window.firestoreLib) {
     const { collection, addDoc } = window.firestoreLib;
     await addDoc(collection(window._db, 'feedback'), entry);
    } else {
     const stored = JSON.parse(localStorage.getItem('beastmode_feedback_queue') || '[]');
     stored.push(entry);
     localStorage.setItem('beastmode_feedback_queue', JSON.stringify(stored));
    }

    window.toggleModal('feedbackModal');
    window.showToast(window.t('toastUpdate', '❤️ Danke!'));
    document.getElementById('feedbackText').value = '';
    document.getElementById('feedbackEmail').value = '';
    _feedbackStar = 0; _feedbackCat = '';
    document.querySelectorAll('.feedback-star').forEach(b => { b.style.color=''; b.style.borderColor=''; b.style.background=''; });
    document.querySelectorAll('.feedback-cat').forEach(b => { b.classList.remove('cat-active-fb'); b.style.color=''; b.style.borderColor=''; b.style.background=''; });
   } catch(e) {
    window.showToast(window.t('toastError'));
   }

   if(btn) { btn.innerHTML = '<i data-lucide="send" class="w-4 h-4 pointer-events-none inline-block mr-2"></i> Feedback senden'; window._refreshLucide(); }
  };

  window.SPORT_LIBRARY = [

   { id: 'tennis', name: 'Tennis', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'sets_won', label: 'Sets gewonnen', type: 'number', placeholder: '2' },
    { id: 'sets_lost', label: 'Sets verloren', type: 'number', placeholder: '1' },
    { id: 'aces', label: 'Asse', type: 'number', placeholder: '8' },
    { id: 'double_faults', label: 'Doppelfehler', type: 'number', placeholder: '2' },
    { id: 'opponent', label: 'Gegner', type: 'text', placeholder: 'Name' },
   ]},
   { id: 'padel', name: 'Padel', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'sets_won', label: 'Sets gewonnen', type: 'number', placeholder: '2' },
    { id: 'sets_lost', label: 'Sets verloren', type: 'number', placeholder: '1' },
    { id: 'smashes', label: 'Smashes', type: 'number', placeholder: '12' },
    { id: 'partner', label: 'Partner', type: 'text', placeholder: 'Name' },
   ]},
   { id: 'pickleball', name: 'Pickleball', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'games_won', label: 'Spiele gewonnen', type: 'number', placeholder: '3' },
    { id: 'points', label: 'Punkte gesamt', type: 'number', placeholder: '33' },
    { id: 'dinks', label: 'Dinks', type: 'number', placeholder: '45' },
   ]},
   { id: 'badminton', name: 'Badminton', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'dauer', label: 'Spielzeit (min)', type: 'number', placeholder: '45' },
    { id: 'sets_won', label: 'Sätze gewonnen', type: 'number', placeholder: '2' },
    { id: 'points', label: 'Punkte gesamt', type: 'number', placeholder: '42' },
    { id: 'smash', label: 'Smash-Winner', type: 'number', placeholder: '8' },
    { id: 'fehler', label: 'Unforced Errors', type: 'number', placeholder: '5' },
    { id: 'gegner', label: 'Gegner / Niveau', type: 'text', placeholder: 'Name / Level' },
   ]},
   { id: 'squash', name: 'Squash', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'dauer', label: 'Spielzeit (min)', type: 'number', placeholder: '45' },
    { id: 'saetze', label: 'Sätze (z.B. 3:1)', type: 'text', placeholder: '3:1' },
    { id: 'points', label: 'Punkte gesamt', type: 'number', placeholder: '35' },
    { id: 'winner', label: 'Winner-Shots', type: 'number', placeholder: '12' },
    { id: 'fehler', label: 'Unforced Errors', type: 'number', placeholder: '6' },
    { id: 'gegner', label: 'Gegner / Niveau', type: 'text', placeholder: 'Name / Level' },
   ]},
   { id: 'tischtennis', name: 'Tischtennis', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'sets_won', label: 'Sätze gewonnen', type: 'number', placeholder: '3' },
    { id: 'sets_lost', label: 'Sätze verloren', type: 'number', placeholder: '2' },
    { id: 'punkte', label: 'Punkte gesamt', type: 'number', placeholder: '55' },
    { id: 'aufschlag_winner', label: 'Aufschlag-Winner', type: 'number', placeholder: '5' },
    { id: 'gegner', label: 'Gegner / Niveau', type: 'text', placeholder: 'Name / Level' },
   ]},
   { id: 'racquetball', name: 'Racquetball', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'dauer', label: 'Spielzeit (min)', type: 'number', placeholder: '40' },
    { id: 'sets_won', label: 'Games gewonnen', type: 'number', placeholder: '2' },
    { id: 'points', label: 'Punkte gesamt', type: 'number', placeholder: '30' },
    { id: 'kills', label: 'Kill Shots', type: 'number', placeholder: '8' },
    { id: 'fehler', label: 'Unforced Errors', type: 'number', placeholder: '4' },
   ]},

   { id: 'laufen', name: 'Laufen', icon: 'footprints', category: 'Ausdauer', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '10' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '50' },
    { id: 'pace', label: 'Pace (min/km)', type: 'text', placeholder: '5:00' },
    { id: 'puls', label: 'Ø Puls', type: 'number', placeholder: '155' },
    { id: 'hoehenmeter', label: 'Höhenmeter', type: 'number', placeholder: '120' },
   ]},
   { id: 'trailrunning', name: 'Trailrunning', icon: 'footprints', category: 'Ausdauer', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '15' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '90' },
    { id: 'hoehenmeter', label: 'Höhenmeter', type: 'number', placeholder: '800' },
    { id: 'trail', label: 'Trail', type: 'text', placeholder: 'Name der Strecke' },
    { id: 'puls', label: 'Ø Puls', type: 'number', placeholder: '158' },
   ]},
   { id: 'radfahren', name: 'Radfahren', icon: 'bike', category: 'Ausdauer', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '40' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '90' },
    { id: 'schnitt', label: 'Ø Geschw. (km/h)', type: 'number', placeholder: '28' },
    { id: 'watt', label: 'Ø Watt', type: 'number', placeholder: '200' },
    { id: 'hoehenmeter', label: 'Höhenmeter', type: 'number', placeholder: '500' },
   ]},
   { id: 'triathlon', name: 'Triathlon', icon: 'activity', category: 'Ausdauer', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/30', schema: [
    { id: 'schwimm_km', label: 'Schwimmen (km)', type: 'number', placeholder: '1.5' },
    { id: 'rad_km', label: 'Rad (km)', type: 'number', placeholder: '40' },
    { id: 'lauf_km', label: 'Laufen (km)', type: 'number', placeholder: '10' },
    { id: 'gesamtzeit', label: 'Gesamtzeit', type: 'text', placeholder: '2:15:30' },
   ]},
   { id: 'hindernislauf', name: 'Hindernislauf', icon: 'zap', category: 'Ausdauer', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '8' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '65' },
    { id: 'hindernisse', label: 'Hindernisse', type: 'number', placeholder: '25' },
    { id: 'event', label: 'Event', type: 'text', placeholder: 'z.B. Spartan Sprint' },
   ]},
   { id: 'inline', name: 'Inline Skating', icon: 'move-right', category: 'Ausdauer', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '20' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '60' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Fitness / Speed / Slalom / Aggressive' },
    { id: 'schnitt', label: 'Ø Geschw. (km/h)', type: 'number', placeholder: '20' },
    { id: 'strecke', label: 'Strecke/Route', type: 'text', placeholder: 'z.B. Rheinufer' },
   ]},

   { id: 'golf', name: 'Golf', icon: 'flag', category: 'Golf & Präzision', color: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/30', schema: [
    { id: 'course', label: 'Golfplatz', type: 'text', placeholder: 'z.B. München GC' },
    { id: 'holes', label: 'Löcher', type: 'number', placeholder: '18' },
    { id: 'score', label: 'Score (Brutto)', type: 'number', placeholder: '82' },
    { id: 'handicap', label: 'Handicap', type: 'number', placeholder: '18.4' },
    { id: 'gir', label: 'GIR', type: 'number', placeholder: '10' },
    { id: 'putts', label: 'Putts', type: 'number', placeholder: '32' },
    { id: 'fairways', label: 'Fairways getroffen', type: 'number', placeholder: '9' },
   ]},
   { id: 'bogenschiessen', name: 'Bogenschießen', icon: 'target', category: 'Golf & Präzision', color: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/30', schema: [
    { id: 'distance', label: 'Distanz (m)', type: 'number', placeholder: '30' },
    { id: 'arrows', label: 'Pfeile', type: 'number', placeholder: '30' },
    { id: 'score', label: 'Punktzahl', type: 'number', placeholder: '265' },
    { id: 'inner_10', label: 'Innen-10', type: 'number', placeholder: '5' },
   ]},
   { id: 'darts', name: 'Darts', icon: 'target', category: 'Golf & Präzision', color: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/30', schema: [
    { id: 'legs_won', label: 'Legs gewonnen', type: 'number', placeholder: '5' },
    { id: 'sets_won', label: 'Sets gewonnen', type: 'number', placeholder: '2' },
    { id: 'avg', label: 'Ø Score (3 Darts)', type: 'number', placeholder: '72' },
    { id: 'highfinish', label: 'Höchstes Finish', type: 'number', placeholder: '112' },
    { id: 'hundertachtziger', label: '180er', type: 'number', placeholder: '2' },
   ]},
   { id: 'bowling', name: 'Bowling', icon: 'circle', category: 'Golf & Präzision', color: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/30', schema: [
    { id: 'score', label: 'Score', type: 'number', placeholder: '185' },
    { id: 'strikes', label: 'Strikes', type: 'number', placeholder: '6' },
    { id: 'spares', label: 'Spares', type: 'number', placeholder: '3' },
    { id: 'spiele', label: 'Spiele', type: 'number', placeholder: '3' },
   ]},
   { id: 'schiessen', name: 'Schießsport', icon: 'target', category: 'Golf & Präzision', color: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/30', schema: [
    { id: 'disziplin', label: 'Disziplin', type: 'text', placeholder: 'z.B. Luftgewehr 10m' },
    { id: 'score', label: 'Score', type: 'number', placeholder: '380' },
    { id: 'schuesse', label: 'Schüsse', type: 'number', placeholder: '40' },
    { id: 'teiler', label: 'Teiler', type: 'number', placeholder: '12' },
   ]},

   { id: 'schwimmen', name: 'Schwimmen', icon: 'waves', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'distanz', label: 'Distanz (m)', type: 'number', placeholder: '2000' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '45' },
    { id: 'stil', label: 'Schwimmstil', type: 'text', placeholder: 'Kraul / Brust / Rücken' },
    { id: 'bahnen', label: 'Bahnen', type: 'number', placeholder: '40' },
    { id: 'tempo', label: 'Ø Tempo (min/100m)', type: 'text', placeholder: '2:15' },
   ]},
   { id: 'freiwasser', name: 'Freiwasserschwimmen', icon: 'waves', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '2' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '38' },
    { id: 'wassertemp', label: 'Wassertemperatur (°C)', type: 'number', placeholder: '18' },
    { id: 'location', label: 'Gewässer', type: 'text', placeholder: 'z.B. Starnberger See' },
   ]},
   { id: 'surfen', name: 'Surfen', icon: 'waves', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'waves', label: 'Wellen geritten', type: 'number', placeholder: '25' },
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '90' },
    { id: 'wellenhoehe', label: 'Wellenhöhe (m)', type: 'number', placeholder: '1.5' },
    { id: 'spot', label: 'Spot', type: 'text', placeholder: 'Ort' },
   ]},
   { id: 'sup', name: 'Stand Up Paddling', icon: 'waves', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '8' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '60' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Touring / Race / Wave / Yoga / Fitness' },
    { id: 'wind', label: 'Wind', type: 'text', placeholder: 'Windstill / Leicht / Moderat / Stark' },
    { id: 'gewaesser', label: 'Gewässer', type: 'text', placeholder: 'z.B. Bodensee' },
   ]},
   { id: 'kajak', name: 'Kajak / Kanu', icon: 'waves', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '12' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '90' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Touring / Wildwasser / See / Sprint' },
    { id: 'schwierigkeit', label: 'Schwierigkeit', type: 'text', placeholder: 'Flachwasser / WW I-IV+' },
    { id: 'gewaesser', label: 'Gewässer', type: 'text', placeholder: 'z.B. Isar, Bodensee' },
   ]},
   { id: 'kitesurf', name: 'Kitesurfen', icon: 'wind', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '90' },
    { id: 'wind', label: 'Windstärke (Knoten)', type: 'number', placeholder: '18' },
    { id: 'tricks', label: 'Tricks landed', type: 'number', placeholder: '5' },
   ]},
   { id: 'wakeboard', name: 'Wakeboarden', icon: 'waves', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '45' },
    { id: 'jumps', label: 'Sprünge', type: 'number', placeholder: '20' },
    { id: 'tricks', label: 'Tricks', type: 'text', placeholder: 'z.B. Backroll, Heelside' },
   ]},
   { id: 'rudern', name: 'Rudern', icon: 'waves', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'distanz', label: 'Distanz (m)', type: 'number', placeholder: '5000' },
    { id: 'dauer', label: 'Zeit (min)', type: 'number', placeholder: '22' },
    { id: 'schlaege', label: 'Schläge/min', type: 'number', placeholder: '24' },
    { id: 'watt', label: 'Ø Watt', type: 'number', placeholder: '180' },
   ]},
   { id: 'wasserball', name: 'Wasserball', icon: 'waves', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'tore', label: 'Tore', type: 'number', placeholder: '3' },
    { id: 'assists', label: 'Assists', type: 'number', placeholder: '2' },
    { id: 'minuten', label: 'Spielminuten', type: 'number', placeholder: '32' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: '8:6' },
   ]},
   { id: 'tauchen', name: 'Tauchen / Freediving', icon: 'arrow-down', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'tiefe', label: 'Max. Tiefe (m)', type: 'number', placeholder: '18' },
    { id: 'dauer', label: 'Tauchzeit (min)', type: 'number', placeholder: '45' },
    { id: 'tauchgaenge', label: 'Tauchgänge', type: 'number', placeholder: '3' },
    { id: 'ort', label: 'Ort', type: 'text', placeholder: 'z.B. Rotes Meer' },
   ]},

   { id: 'boxing', name: 'Boxen', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'runden', label: 'Runden', type: 'number', placeholder: '6' },
    { id: 'runden_dauer', label: 'Rundendauer (min)', type: 'number', placeholder: '3' },
    { id: 'sparring', label: 'Sparring', type: 'text', placeholder: 'Ja / Nein' },
    { id: 'technik', label: 'Fokus', type: 'text', placeholder: 'z.B. Jab-Cross' },
   ]},
   { id: 'muay_thai', name: 'Muay Thai', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'runden', label: 'Runden', type: 'number', placeholder: '5' },
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '90' },
    { id: 'sparring', label: 'Sparring-Runden', type: 'number', placeholder: '3' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Ellbogen, Teep' },
   ]},
   { id: 'kickboxen', name: 'Kickboxen', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '75' },
    { id: 'runden', label: 'Runden', type: 'number', placeholder: '6' },
    { id: 'rundendauer', label: 'Rundendauer (min)', type: 'number', placeholder: '3' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Sparring / Technik / Bag / Pad / Kondition' },
    { id: 'fokus', label: 'Technik-Fokus', type: 'text', placeholder: 'z.B. Low Kicks, Combos' },
    { id: 'intensitaet', label: 'Intensität', type: 'text', placeholder: 'Leicht / Mittel / Hart' },
   ]},
   { id: 'mma', name: 'MMA', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '90' },
    { id: 'runden', label: 'Runden', type: 'number', placeholder: '5' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Sparring / Grappling / Striking / Drill' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Takedowns, Ground & Pound' },
    { id: 'takedowns', label: 'Takedowns (Erfolg/Versuch)', type: 'text', placeholder: '3/5' },
    { id: 'submissions', label: 'Submissions (Erfolg/Versuch)', type: 'text', placeholder: '2/4' },
   ]},
   { id: 'judo', name: 'Judo', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '60' },
    { id: 'randori', label: 'Randori-Runden', type: 'number', placeholder: '5' },
    { id: 'ippons', label: 'Ippons', type: 'number', placeholder: '2' },
   ]},
   { id: 'bjj', name: 'BJJ', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '90' },
    { id: 'rolls', label: 'Rolls', type: 'number', placeholder: '6' },
    { id: 'submissions', label: 'Submissions', type: 'number', placeholder: '3' },
    { id: 'fokus', label: 'Technik-Fokus', type: 'text', placeholder: 'z.B. Guard Passing' },
   ]},
   { id: 'karate', name: 'Karate', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '60' },
    { id: 'kata', label: 'Kata', type: 'text', placeholder: 'z.B. Heian Shodan' },
    { id: 'kumite', label: 'Kumite-Runden', type: 'number', placeholder: '4' },
   ]},
   { id: 'taekwondo', name: 'Taekwondo', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '60' },
    { id: 'sparring', label: 'Sparring-Runden', type: 'number', placeholder: '4' },
    { id: 'poomsae', label: 'Poomsae', type: 'text', placeholder: 'Name der Form' },
    { id: 'kicks', label: 'Kick-Fokus', type: 'text', placeholder: 'z.B. Roundhouse / Axe' },
   ]},
   { id: 'wrestling', name: 'Ringen / Wrestling', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '75' },
    { id: 'runden', label: 'Sparring-Runden', type: 'number', placeholder: '5' },
    { id: 'takedowns', label: 'Takedowns', type: 'number', placeholder: '8' },
    { id: 'stil', label: 'Stil', type: 'text', placeholder: 'Greco / Freestyle' },
   ]},
   { id: 'fechten', name: 'Fechten', icon: 'sword', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'treffer', label: 'Treffer gesetzt', type: 'number', placeholder: '15' },
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '60' },
    { id: 'waffe', label: 'Waffe', type: 'text', placeholder: 'Florett / Degen / Säbel' },
    { id: 'gefechte', label: 'Gefechte', type: 'number', placeholder: '8' },
   ]},
   { id: 'krav_maga', name: 'Krav Maga', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '60' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Technik / Szenario / Sparring / Fitness' },
    { id: 'fokus', label: 'Fokus-Thema', type: 'text', placeholder: 'z.B. Messerabwehr, Bodenkampf' },
    { id: 'level', label: 'Level/Gürtel', type: 'text', placeholder: 'P1-P5 / G1-G5 / E1-E5' },
    { id: 'intensitaet', label: 'Intensität', type: 'text', placeholder: 'Leicht / Mittel / Hart' },
   ]},
   { id: 'capoeira', name: 'Capoeira', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '75' },
    { id: 'jogos', label: 'Jogos', type: 'number', placeholder: '6' },
    { id: 'nivel', label: 'Nivel', type: 'text', placeholder: 'z.B. Cordão Gelb' },
   ]},

   { id: 'klettern', name: 'Klettern', icon: 'mountain', category: 'Outdoor & Berg', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30', schema: [
    { id: 'routen', label: 'Routen geklettert', type: 'number', placeholder: '5' },
    { id: 'schwierigkeitsgrad', label: 'Max. Grad', type: 'text', placeholder: '7a+' },
    { id: 'art', label: 'Art', type: 'text', placeholder: 'Lead / Top Rope / Outdoor' },
    { id: 'versuche', label: 'Versuche Projekt', type: 'number', placeholder: '8' },
   ]},
   { id: 'bouldern', name: 'Bouldern', icon: 'mountain', category: 'Outdoor & Berg', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30', schema: [
    { id: 'probleme', label: 'Probleme geflasht', type: 'number', placeholder: '4' },
    { id: 'max_grad', label: 'Max. Grad', type: 'text', placeholder: 'V6 / 7A' },
    { id: 'versuche', label: 'Versuche gesamt', type: 'number', placeholder: '40' },
    { id: 'halle', label: 'Halle / Spot', type: 'text', placeholder: 'Name' },
   ]},
   { id: 'wandern', name: 'Wandern', icon: 'mountain', category: 'Outdoor & Berg', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '12' },
    { id: 'hoehenmeter', label: 'Höhenmeter', type: 'number', placeholder: '800' },
    { id: 'dauer', label: 'Dauer (h)', type: 'number', placeholder: '4' },
    { id: 'route', label: 'Route', type: 'text', placeholder: 'Name der Tour' },
   ]},
   { id: 'klettersteig', name: 'Klettersteig', icon: 'mountain', category: 'Outdoor & Berg', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30', schema: [
    { id: 'route', label: 'Route', type: 'text', placeholder: 'Name' },
    { id: 'schwierigkeitsgrad', label: 'Schwierigkeitsgrad', type: 'text', placeholder: 'A / B / C / D / E' },
    { id: 'hoehenmeter', label: 'Höhenmeter', type: 'number', placeholder: '400' },
    { id: 'dauer', label: 'Dauer (h)', type: 'number', placeholder: '3' },
   ]},
   { id: 'mountainbike', name: 'Mountainbike', icon: 'bike', category: 'Outdoor & Berg', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '30' },
    { id: 'hoehenmeter', label: 'Höhenmeter', type: 'number', placeholder: '600' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '90' },
    { id: 'trail', label: 'Trail / Route', type: 'text', placeholder: 'Name' },
   ]},
   { id: 'skifahren', name: 'Skifahren', icon: 'mountain', category: 'Outdoor & Berg', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30', schema: [
    { id: 'abfahrten', label: 'Abfahrten', type: 'number', placeholder: '15' },
    { id: 'hoehenmeter', label: 'Höhenmeter', type: 'number', placeholder: '12000' },
    { id: 'dauer', label: 'Stunden auf Piste', type: 'number', placeholder: '5' },
    { id: 'gebiet', label: 'Skigebiet', type: 'text', placeholder: 'z.B. Zugspitzplatt' },
   ]},
   { id: 'snowboard', name: 'Snowboarden', icon: 'mountain', category: 'Outdoor & Berg', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30', schema: [
    { id: 'abfahrten', label: 'Abfahrten', type: 'number', placeholder: '12' },
    { id: 'hoehenmeter', label: 'Höhenmeter', type: 'number', placeholder: '8000' },
    { id: 'tricks', label: 'Tricks', type: 'text', placeholder: 'z.B. 180, Cab' },
    { id: 'gebiet', label: 'Skigebiet', type: 'text', placeholder: 'Name' },
   ]},
   { id: 'paragliding', name: 'Paragliding', icon: 'wind', category: 'Outdoor & Berg', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30', schema: [
    { id: 'flugzeit', label: 'Flugzeit (min)', type: 'number', placeholder: '45' },
    { id: 'hoehe', label: 'Max. Höhe (m)', type: 'number', placeholder: '2200' },
    { id: 'distanz', label: 'Strecke (km)', type: 'number', placeholder: '18' },
    { id: 'startplatz', label: 'Startplatz', type: 'text', placeholder: 'Name' },
   ]},
   { id: 'biathlon', name: 'Biathlon', icon: 'mountain', category: 'Outdoor & Berg', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '10' },
    { id: 'dauer', label: 'Zeit (min)', type: 'number', placeholder: '28' },
    { id: 'treffer', label: 'Treffer', type: 'text', placeholder: '9/10 stehend / 8/10 liegend' },
    { id: 'strafrunden', label: 'Strafrunden', type: 'number', placeholder: '3' },
   ]},

   { id: 'fussball', name: 'Fußball', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'tore', label: 'Tore', type: 'number', placeholder: '1' },
    { id: 'assists', label: 'Assists', type: 'number', placeholder: '2' },
    { id: 'minuten', label: 'Spielminuten', type: 'number', placeholder: '90' },
    { id: 'position', label: 'Position', type: 'text', placeholder: 'z.B. Stürmer' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: '3:1' },
   ]},
   { id: 'basketball', name: 'Basketball', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'punkte', label: 'Punkte', type: 'number', placeholder: '18' },
    { id: 'rebounds', label: 'Rebounds', type: 'number', placeholder: '7' },
    { id: 'assists', label: 'Assists', type: 'number', placeholder: '5' },
    { id: 'minuten', label: 'Spielminuten', type: 'number', placeholder: '32' },
    { id: 'dreier', label: '3-Punkte-Treffer', type: 'number', placeholder: '3' },
   ]},
   { id: 'volleyball', name: 'Volleyball', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'saetze', label: 'Sätze gewonnen', type: 'number', placeholder: '3' },
    { id: 'angriffe', label: 'Erfolgreiche Angriffe', type: 'number', placeholder: '12' },
    { id: 'asse', label: 'Aufschlag-Asse', type: 'number', placeholder: '4' },
    { id: 'bloecke', label: 'Blocks', type: 'number', placeholder: '3' },
   ]},
   { id: 'beachvolleyball', name: 'Beachvolleyball', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'saetze', label: 'Sätze gewonnen', type: 'number', placeholder: '2' },
    { id: 'punkte', label: 'Punkte gesamt', type: 'number', placeholder: '42' },
    { id: 'asse', label: 'Asse', type: 'number', placeholder: '5' },
   ]},
   { id: 'handball', name: 'Handball', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'tore', label: 'Tore', type: 'number', placeholder: '5' },
    { id: 'assists', label: 'Assists', type: 'number', placeholder: '3' },
    { id: 'wuerfe', label: 'Würfe gesamt', type: 'number', placeholder: '12' },
    { id: 'minuten', label: 'Spielminuten', type: 'number', placeholder: '60' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: '28:24' },
   ]},
   { id: 'hockey', name: 'Hockey', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'tore', label: 'Tore', type: 'number', placeholder: '1' },
    { id: 'assists', label: 'Assists', type: 'number', placeholder: '1' },
    { id: 'minuten', label: 'Spielminuten', type: 'number', placeholder: '60' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: '3:2' },
   ]},
   { id: 'rugby', name: 'Rugby', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'versuche', label: 'Versuche', type: 'number', placeholder: '1' },
    { id: 'tackles', label: 'Tackles', type: 'number', placeholder: '8' },
    { id: 'minuten', label: 'Spielminuten', type: 'number', placeholder: '80' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: '24:18' },
   ]},
   { id: 'american_football', name: 'American Football', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'touchdowns', label: 'Touchdowns', type: 'number', placeholder: '1' },
    { id: 'yards', label: 'Yards', type: 'number', placeholder: '85' },
    { id: 'tackles', label: 'Tackles', type: 'number', placeholder: '5' },
    { id: 'position', label: 'Position', type: 'text', placeholder: 'z.B. QB / WR / LB' },
   ]},
   { id: 'baseball', name: 'Baseball / Softball', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'hits', label: 'Hits', type: 'number', placeholder: '2' },
    { id: 'at_bats', label: 'At-bats', type: 'number', placeholder: '4' },
    { id: 'rbis', label: 'RBIs', type: 'number', placeholder: '1' },
    { id: 'position', label: 'Position', type: 'text', placeholder: 'z.B. Pitcher / SS' },
   ]},
   { id: 'cricket', name: 'Cricket', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'runs', label: 'Runs', type: 'number', placeholder: '45' },
    { id: 'wickets', label: 'Wickets', type: 'number', placeholder: '2' },
    { id: 'overs', label: 'Overs gebowlt', type: 'number', placeholder: '6' },
    { id: 'catches', label: 'Catches', type: 'number', placeholder: '1' },
   ]},
   { id: 'ultimate', name: 'Ultimate Frisbee', icon: 'disc', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'goals', label: 'Goals', type: 'number', placeholder: '3' },
    { id: 'assists', label: 'Assists', type: 'number', placeholder: '4' },
    { id: 'scores', label: 'Team-Score', type: 'text', placeholder: '13:9' },
    { id: 'dauer', label: 'Spieldauer (min)', type: 'number', placeholder: '90' },
   ]},
   { id: 'floorball', name: 'Floorball / Unihockey', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'tore', label: 'Tore', type: 'number', placeholder: '2' },
    { id: 'assists', label: 'Assists', type: 'number', placeholder: '3' },
    { id: 'minuten', label: 'Spielminuten', type: 'number', placeholder: '60' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: '7:4' },
   ]},
   { id: 'curling', name: 'Curling', icon: 'circle', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'ends', label: 'Ends gespielt', type: 'number', placeholder: '10' },
    { id: 'punkte', label: 'Punkte eigenes Team', type: 'number', placeholder: '6' },
    { id: 'punkte_gegner', label: 'Punkte Gegner', type: 'number', placeholder: '4' },
    { id: 'position', label: 'Position', type: 'text', placeholder: 'Skip / Third / Second / Lead' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: 'Sieg / Niederlage' },
   ]},

   { id: 'langlauf', name: 'Langlauf', icon: 'snowflake', category: 'Wintersport', color: 'text-sky-300', bg: 'bg-sky-300/20', border: 'border-sky-300/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '15' },
    { id: 'dauer', label: 'Zeit (min)', type: 'number', placeholder: '55' },
    { id: 'technik', label: 'Technik', type: 'text', placeholder: 'Klassisch / Skating' },
    { id: 'puls', label: 'Ø Puls', type: 'number', placeholder: '160' },
   ]},
   { id: 'eisschnelllauf', name: 'Eisschnelllauf', icon: 'snowflake', category: 'Wintersport', color: 'text-sky-300', bg: 'bg-sky-300/20', border: 'border-sky-300/30', schema: [
    { id: 'distanz', label: 'Distanz (m)', type: 'number', placeholder: '1500' },
    { id: 'zeit', label: 'Zeit', type: 'text', placeholder: '1:55.40' },
    { id: 'runden', label: 'Runden', type: 'number', placeholder: '6' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Sprint 500m / Mittel / Lang / Marathon' },
    { id: 'pb', label: 'Persönliche Bestzeit?', type: 'text', placeholder: 'Ja / Nein' },
   ]},
   { id: 'eishockey', name: 'Eishockey', icon: 'snowflake', category: 'Wintersport', color: 'text-sky-300', bg: 'bg-sky-300/20', border: 'border-sky-300/30', schema: [
    { id: 'tore', label: 'Tore', type: 'number', placeholder: '1' },
    { id: 'assists', label: 'Assists', type: 'number', placeholder: '2' },
    { id: 'plusminus', label: 'Plus/Minus', type: 'number', placeholder: '+2' },
    { id: 'strafminuten', label: 'Strafminuten', type: 'number', placeholder: '2' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: '4:2' },
   ]},
   { id: 'eiskunstlauf', name: 'Eiskunstlauf', icon: 'snowflake', category: 'Wintersport', color: 'text-sky-300', bg: 'bg-sky-300/20', border: 'border-sky-300/30', schema: [
    { id: 'dauer', label: 'Trainingsdauer (min)', type: 'number', placeholder: '60' },
    { id: 'sprünge', label: 'Sprünge', type: 'text', placeholder: 'z.B. Axel, Lutz, Flip' },
    { id: 'programm', label: 'Programm', type: 'text', placeholder: 'Kür / Pflicht / Freestyle' },
   ]},

   { id: 'crossfit', name: 'CrossFit', icon: 'zap', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'wod', label: 'WOD Name', type: 'text', placeholder: 'z.B. Fran' },
    { id: 'zeit', label: 'Zeit (mm:ss)', type: 'text', placeholder: '5:45' },
    { id: 'runden', label: 'Runden (AMRAP)', type: 'number', placeholder: '8' },
    { id: 'rpe', label: 'RPE (1-10)', type: 'number', placeholder: '9' },
   ]},
   { id: 'powerlifting', name: 'Powerlifting', icon: 'dumbbell', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'squat', label: 'Squat (kg)', type: 'number', placeholder: '180' },
    { id: 'bench', label: 'Bankdrücken (kg)', type: 'number', placeholder: '120' },
    { id: 'deadlift', label: 'Kreuzheben (kg)', type: 'number', placeholder: '220' },
    { id: 'total', label: 'Total (kg)', type: 'number', placeholder: '520' },
    { id: 'wettkampf', label: 'Wettkampf', type: 'text', placeholder: 'Ja / Training' },
   ]},
   { id: 'gewichtheben', name: 'Gewichtheben', icon: 'dumbbell', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'snatch', label: 'Snatch (kg)', type: 'number', placeholder: '80' },
    { id: 'clean_jerk', label: 'Clean & Jerk (kg)', type: 'number', placeholder: '100' },
    { id: 'total', label: 'Total (kg)', type: 'number', placeholder: '180' },
   ]},
   { id: 'kettlebell', name: 'Kettlebell', icon: 'dumbbell', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '30' },
    { id: 'gewicht', label: 'Hauptgewicht (kg)', type: 'number', placeholder: '24' },
    { id: 'wdh', label: 'Wiederholungen gesamt', type: 'number', placeholder: '200' },
    { id: 'ubung', label: 'Hauptübung', type: 'text', placeholder: 'z.B. Swing, Snatch' },
   ]},
   { id: 'turnen', name: 'Turnen / Gymnastics', icon: 'star', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '90' },
    { id: 'geraet', label: 'Gerät', type: 'text', placeholder: 'Boden / Reck / Barren / Ringe / Sprung' },
    { id: 'elemente', label: 'Geübte Elemente', type: 'text', placeholder: 'z.B. Salto vorwärts, Kippe' },
    { id: 'schwierigkeit', label: 'Schwierigkeit', type: 'text', placeholder: 'A / B / C / D / E / F' },
    { id: 'sauberkeit', label: 'Ausführung (1-10)', type: 'number', placeholder: '8' },
   ]},
   { id: 'yoga', name: 'Yoga', icon: 'sunrise', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '60' },
    { id: 'stil', label: 'Yoga-Stil', type: 'text', placeholder: 'z.B. Vinyasa / Hatha / Yin' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Hüftöffner / Schultern' },
   ]},
   { id: 'pilates', name: 'Pilates', icon: 'sunrise', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '50' },
    { id: 'art', label: 'Art', type: 'text', placeholder: 'Mat / Reformer / Cadillac / Chair / Barrel' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'Core / Beine / Arme / Rücken / Ganzkörper' },
    { id: 'level', label: 'Level', type: 'text', placeholder: 'Anfänger / Mittel / Fortgeschritten' },
    { id: 'uebungen', label: 'Key-Übungen', type: 'text', placeholder: 'z.B. Hundred, Roll-Up, Teaser' },
   ]},
   { id: 'calisthenics', name: 'Calisthenics', icon: 'zap', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'skill', label: 'Skill-Fokus', type: 'text', placeholder: 'z.B. Muscle-Up / Planche' },
    { id: 'versuche', label: 'Versuche', type: 'number', placeholder: '10' },
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '60' },
   ]},

   { id: 'tanzen', name: 'Tanzen', icon: 'music', category: 'Tanz & Bühne', color: 'text-pink-400', bg: 'bg-pink-400/20', border: 'border-pink-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '90' },
    { id: 'stil', label: 'Tanzstil', type: 'text', placeholder: 'Salsa / Bachata / Hip Hop / Contemporary / Jazz' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Kurs / Social Dance / Training / Aufführung' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Footwork, Spins, Partnering' },
    { id: 'level', label: 'Level', type: 'text', placeholder: 'Anfänger / Mittel / Fortgeschritten' },
   ]},
   { id: 'ballett', name: 'Ballett', icon: 'music', category: 'Tanz & Bühne', color: 'text-pink-400', bg: 'bg-pink-400/20', border: 'border-pink-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '75' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Barre / Center / Pointe / Variation / Aufführung' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Pirouetten, Grand Allegro' },
    { id: 'level', label: 'Level', type: 'text', placeholder: 'Anfänger / Mittel / Fortgeschritten / Profi' },
    { id: 'schuhe', label: 'Schuhe', type: 'text', placeholder: 'Schläppchen / Spitzenschuhe' },
   ]},
   { id: 'breakdance', name: 'Breaking / B-Boy', icon: 'music', category: 'Tanz & Bühne', color: 'text-pink-400', bg: 'bg-pink-400/20', border: 'border-pink-400/30', schema: [
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '60' },
    { id: 'moves', label: 'Neue Moves', type: 'text', placeholder: 'z.B. Windmill, Flare' },
    { id: 'battles', label: 'Battles', type: 'number', placeholder: '4' },
   ]},
   { id: 'rhythmik', name: 'Rhythmische Sportgymn.', icon: 'music', category: 'Tanz & Bühne', color: 'text-pink-400', bg: 'bg-pink-400/20', border: 'border-pink-400/30', schema: [
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '90' },
    { id: 'geraet', label: 'Gerät', type: 'text', placeholder: 'Seil / Ball / Band / Keulen / Reifen' },
    { id: 'kür', label: 'Kür / Pflicht', type: 'text', placeholder: 'Name des Programms' },
   ]},

   { id: 'parkour', name: 'Parkour / Freerunning', icon: 'zap', category: 'Trend & Urban', color: 'text-violet-400', bg: 'bg-violet-400/20', border: 'border-violet-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '60' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Freerunning / Parkour / Drill / Indoor' },
    { id: 'moves', label: 'Geübte Moves', type: 'text', placeholder: 'z.B. Precision Jump, Wall Flip' },
    { id: 'neue_moves', label: 'Neue Moves gelernt', type: 'number', placeholder: '2' },
    { id: 'spot', label: 'Spot/Location', type: 'text', placeholder: 'Ort' },
   ]},
   { id: 'skateboard', name: 'Skateboarden', icon: 'zap', category: 'Trend & Urban', color: 'text-violet-400', bg: 'bg-violet-400/20', border: 'border-violet-400/30', schema: [
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '90' },
    { id: 'tricks', label: 'Tricks landed', type: 'text', placeholder: 'z.B. Kickflip, Heelflip' },
    { id: 'spot', label: 'Spot / Skatepark', type: 'text', placeholder: 'Name' },
   ]},
   { id: 'bmx', name: 'BMX', icon: 'bike', category: 'Trend & Urban', color: 'text-violet-400', bg: 'bg-violet-400/20', border: 'border-violet-400/30', schema: [
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '60' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Street / Park / Dirt / Flatland / Race' },
    { id: 'tricks', label: 'Geübte Tricks', type: 'text', placeholder: 'z.B. Barspin, Tailwhip' },
    { id: 'neue_tricks', label: 'Neue Tricks gelandet', type: 'number', placeholder: '1' },
    { id: 'spot', label: 'Spot/Park', type: 'text', placeholder: 'Ort' },
   ]},
   { id: 'slacklinen', name: 'Slacklinen', icon: 'zap', category: 'Trend & Urban', color: 'text-violet-400', bg: 'bg-violet-400/20', border: 'border-violet-400/30', schema: [
    { id: 'laenge', label: 'Leinenlänge (m)', type: 'number', placeholder: '15' },
    { id: 'hoehe', label: 'Höhe (m)', type: 'number', placeholder: '0.5' },
    { id: 'schritte', label: 'Max. Schritte', type: 'number', placeholder: '12' },
    { id: 'tricks', label: 'Tricks', type: 'text', placeholder: 'z.B. Drop Knee, Jump' },
   ]},

   { id: 'reiten', name: 'Reiten', icon: 'chevrons-right', category: 'Sonstige', color: 'text-stone-400', bg: 'bg-stone-400/20', border: 'border-stone-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '45' },
    { id: 'gangart', label: 'Gangarten', type: 'text', placeholder: 'Schritt / Trab / Galopp' },
    { id: 'pferd', label: 'Pferd', type: 'text', placeholder: 'Name des Pferdes' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Dressur / Springen' },
   ]},
   { id: 'esports', name: 'Esports', icon: 'monitor', category: 'Sonstige', color: 'text-stone-400', bg: 'bg-stone-400/20', border: 'border-stone-400/30', schema: [
    { id: 'game', label: 'Spiel', type: 'text', placeholder: 'z.B. CS2, Valorant' },
    { id: 'matches', label: 'Matches', type: 'number', placeholder: '5' },
    { id: 'wins', label: 'Siege', type: 'number', placeholder: '3' },
    { id: 'kd', label: 'K/D Ratio', type: 'number', placeholder: '1.4' },
    { id: 'rank', label: 'Rank', type: 'text', placeholder: 'z.B. Diamond 2' },
   ]},
   { id: 'schach', name: 'Schach', icon: 'grid', category: 'Sonstige', color: 'text-stone-400', bg: 'bg-stone-400/20', border: 'border-stone-400/30', schema: [
    { id: 'partien', label: 'Partien', type: 'number', placeholder: '5' },
    { id: 'siege', label: 'Siege', type: 'number', placeholder: '3' },
    { id: 'elo', label: 'ELO Rating', type: 'number', placeholder: '1450' },
    { id: 'zeitkontrolle', label: 'Zeitkontrolle', type: 'text', placeholder: '10+0 / Blitz / Rapid' },
   ]},
   { id: 'billard', name: 'Billard / Pool', icon: 'circle', category: 'Sonstige', color: 'text-stone-400', bg: 'bg-stone-400/20', border: 'border-stone-400/30', schema: [
    { id: 'games', label: 'Spiele gespielt', type: 'number', placeholder: '10' },
    { id: 'wins', label: 'Siege', type: 'number', placeholder: '7' },
    { id: 'disziplin', label: 'Disziplin', type: 'text', placeholder: '8-Ball / 9-Ball / 10-Ball / Snooker' },
    { id: 'highrun', label: 'Highest Run', type: 'number', placeholder: '5' },
    { id: 'break_and_run', label: 'Break & Run', type: 'number', placeholder: '1' },
   ]},

   // === NEUE SPORTARTEN (April 2026) ===
   { id: 'hyrox', name: 'Hyrox', icon: 'flame', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'gesamtzeit', label: 'Gesamtzeit', type: 'text', placeholder: 'z.B. 1:12:34' },
    { id: 'laufzeit', label: 'Laufzeit gesamt (min)', type: 'number', placeholder: '32' },
    { id: 'stationen', label: 'Stationen-Splits', type: 'text', placeholder: 'Ski 3:20, Sled 2:45...' },
    { id: 'division', label: 'Division', type: 'text', placeholder: 'Open / Pro / Doubles / Relay' },
    { id: 'platzierung', label: 'Platzierung', type: 'number', placeholder: '15' },
    { id: 'pb', label: 'Persönliche Bestzeit?', type: 'text', placeholder: 'Ja / Nein' },
   ]},
   { id: 'spinning', name: 'Spinning / Indoor Cycling', icon: 'bike', category: 'Ausdauer', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '45' },
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '20' },
    { id: 'kalorien', label: 'Kalorien', type: 'number', placeholder: '500' },
    { id: 'avg_watt', label: 'Ø Watt', type: 'number', placeholder: '180' },
    { id: 'max_watt', label: 'Max Watt', type: 'number', placeholder: '350' },
    { id: 'avg_hr', label: 'Ø Herzfrequenz', type: 'number', placeholder: '145' },
   ]},
   { id: 'taichi', name: 'Tai Chi / Qigong', icon: 'wind', category: 'Tanz & Bühne', color: 'text-pink-400', bg: 'bg-pink-400/20', border: 'border-pink-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '45' },
    { id: 'stil', label: 'Stil', type: 'text', placeholder: 'Yang / Chen / Wu / Qigong / Ba Duan Jin' },
    { id: 'form', label: 'Form/Übung', type: 'text', placeholder: 'z.B. 24er Form, 8 Brokate' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'Form / Push Hands / Meditation / Atmung' },
    { id: 'level', label: 'Level', type: 'text', placeholder: 'Anfänger / Mittel / Fortgeschritten' },
   ]},
   { id: 'discgolf', name: 'Disc Golf', icon: 'disc', category: 'Golf & Präzision', color: 'text-lime-400', bg: 'bg-lime-400/20', border: 'border-lime-400/30', schema: [
    { id: 'kurs', label: 'Kurs/Parcours', type: 'text', placeholder: 'z.B. Volkspark 18er' },
    { id: 'bahnen', label: 'Bahnen gespielt', type: 'number', placeholder: '18' },
    { id: 'score', label: 'Score (vs. Par)', type: 'text', placeholder: 'z.B. -3 oder +5' },
    { id: 'aces', label: 'Aces (Hole-in-One)', type: 'number', placeholder: '0' },
    { id: 'birdies', label: 'Birdies', type: 'number', placeholder: '4' },
    { id: 'disc', label: 'Lieblings-Disc', type: 'text', placeholder: 'z.B. Innova Destroyer' },
   ]},
   { id: 'lacrosse', name: 'Lacrosse', icon: 'trophy', category: 'Teamsport', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30', schema: [
    { id: 'dauer', label: 'Spielzeit (min)', type: 'number', placeholder: '60' },
    { id: 'tore', label: 'Tore', type: 'number', placeholder: '3' },
    { id: 'assists', label: 'Assists', type: 'number', placeholder: '2' },
    { id: 'groundballs', label: 'Ground Balls', type: 'number', placeholder: '5' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Spiel / Training / Scrimmage' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: 'z.B. 8:5' },
   ]},
   { id: 'segeln', name: 'Segeln', icon: 'wind', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'dauer', label: 'Dauer (h)', type: 'number', placeholder: '4' },
    { id: 'distanz', label: 'Distanz (sm)', type: 'number', placeholder: '15' },
    { id: 'wind', label: 'Wind (kn)', type: 'number', placeholder: '12' },
    { id: 'windrichtung', label: 'Windrichtung', type: 'text', placeholder: 'N / NO / O / SO / S / SW / W / NW' },
    { id: 'bootstyp', label: 'Bootstyp', type: 'text', placeholder: 'z.B. Laser, J/70' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Regatta / Training / Törnfahrt' },
   ]},
   { id: 'pole_aerial', name: 'Pole Dance / Aerial', icon: 'star', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '60' },
    { id: 'typ', label: 'Typ', type: 'text', placeholder: 'Pole Dance / Pole Fitness / Aerial Hoop / Silk' },
    { id: 'tricks', label: 'Geübte Tricks', type: 'text', placeholder: 'z.B. Ayesha, Jade Split' },
    { id: 'neue_tricks', label: 'Neue Tricks gelernt', type: 'number', placeholder: '1' },
    { id: 'level', label: 'Level', type: 'text', placeholder: 'Beginner / Intermediate / Advanced' },
   ]},
   { id: 'indoor_rudern', name: 'Indoor Rudern (Concept2)', icon: 'waves', category: 'Ausdauer', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/30', schema: [
    { id: 'distanz', label: 'Distanz (m)', type: 'number', placeholder: '2000' },
    { id: 'zeit', label: 'Zeit', type: 'text', placeholder: 'z.B. 7:12.5' },
    { id: 'pace', label: 'Split (/500m)', type: 'text', placeholder: 'z.B. 1:48.2' },
    { id: 'spm', label: 'Ø Schlagfrequenz', type: 'number', placeholder: '28' },
    { id: 'watt', label: 'Ø Watt', type: 'number', placeholder: '220' },
    { id: 'kalorien', label: 'Kalorien', type: 'number', placeholder: '120' },
   ]},
  ];

  window.activeSports = JSON.parse(localStorage.getItem('beastmode_v2_active_sports') || '[]');

  window.saveActiveSports = function() {
   localStorage.setItem('beastmode_v2_active_sports', JSON.stringify(window.activeSports));
  };

  window.openSportPicker = function() {
   window.renderSportPicker();
   window.toggleModal('sportPickerModal');
   window._refreshLucide();
  };

  window.filterSportList = function(query) {
   window.renderSportPicker(query);
  };

  window.renderSportPicker = function(query = '') {
   const q = query.toLowerCase().trim();

   const activeSection = document.getElementById('activeSportsSection');
   const activeList = document.getElementById('activeSportsList');
   if(window.activeSports.length > 0) {
    activeSection?.classList.remove('hidden');
    if(activeList) activeList.innerHTML = window.activeSports.map(id => {
     const sport = window.SPORT_LIBRARY.find(s => s.id === id);
     if(!sport) return '';
     const isCustom = !!sport.isCustom || 
      JSON.parse(localStorage.getItem('beastmode_v2_custom_sports') || '[]').some(s => s.id === id);
     return `<div class="flex items-center gap-1 rounded-lg ${sport.bg} border ${sport.border} ${sport.color} overflow-hidden">
      <button onclick="window.toggleSport('${sport.id}')" class="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto transition-all hover:opacity-80">
       <i data-lucide="${sport.icon}" class="w-3 h-3 pointer-events-none"></i> ${window._escapeHtml(sport.name)}
       <i data-lucide="x" class="w-2.5 h-2.5 pointer-events-none ml-0.5 opacity-60"></i>
      </button>
      ${isCustom ? `<button aria-label="Löschen" onclick="window.deleteCustomSport('${sport.id}', event)" class="px-1.5 py-1.5 hover:bg-rose-500/20 hover:text-rose-400 transition-colors border-l border-current/20 cursor-pointer pointer-events-auto" title="Sport komplett löschen">
       <i data-lucide="trash-2" class="w-2.5 h-2.5 pointer-events-none"></i>
      </button>` : ''}
     </div>`;
    }).join('');
   } else {
    activeSection?.classList.add('hidden');
   }

   const listEl = document.getElementById('sportLibraryList');
   if(!listEl) return;

   const filtered = q ? window.SPORT_LIBRARY.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)) : window.SPORT_LIBRARY;
   const grouped = {};
   filtered.forEach(s => {
    if(!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
   });

   if(Object.keys(grouped).length === 0) {
    listEl.innerHTML = `<div class="text-center py-8"><p class="text-zinc-500 text-sm font-bold">${window.t('noSportFound','Keine Sportart gefunden')}</p><p class="text-zinc-600 text-xs mt-1">${window.t('noSportFoundSub','Nutze den KI Builder für individuelle Sportarten')}</p></div>`;
    return;
    return;
   }

   listEl.innerHTML = Object.entries(grouped).map(([cat, sports]) => `
    <div class="mb-4">
     <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">${cat}</p>
     <div class="grid grid-cols-2 gap-2">
      ${sports.map(s => {
       const isActive = window.activeSports.includes(s.id);
       const isCustomSport = JSON.parse(localStorage.getItem('beastmode_v2_custom_sports') || '[]').some(cs => cs.id === s.id);
       return `<div class="relative rounded-xl border transition-all overflow-hidden ${isActive ? `${s.bg} ${s.border} ${s.color}` : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'}">
        <button onclick="window.toggleSport('${s.id}')" class="flex items-center gap-2.5 p-3 w-full text-left cursor-pointer pointer-events-auto hover:opacity-90 transition-opacity">
         <i data-lucide="${s.icon}" class="w-4 h-4 flex-shrink-0 pointer-events-none"></i>
         <span class="text-xs font-black uppercase tracking-tight pointer-events-none flex-1">${window._escapeHtml(s.name)}</span>
         ${isCustomSport ? '<span class="text-[9px] font-bold uppercase tracking-widest opacity-50 pointer-events-none">KI</span>' : ''}
         ${isActive ? '<i data-lucide="check" class="w-3 h-3 flex-shrink-0 pointer-events-none"></i>' : ''}
        </button>
        ${isCustomSport ? `<button aria-label="Löschen" onclick="window.deleteCustomSport('${s.id}', event)" class="absolute top-1 right-1 w-6 h-6 rounded-lg bg-rose-500/0 hover:bg-rose-500/20 text-rose-400/0 hover:text-rose-400 transition-all flex items-center justify-center cursor-pointer pointer-events-auto" title="Löschen">
         <i data-lucide="trash-2" class="w-3 h-3 pointer-events-none"></i>
        </button>` : ''}
       </div>`;
      }).join('')}
     </div>
    </div>
   `).join('');

   window._refreshLucide();
  };

  window.toggleSport = function(sportId) {
   const coreCategories = ['strength', 'cardio', 'recovery', 'main'];
   const isCore = coreCategories.includes(sportId);
   const idx = window.activeSports.indexOf(sportId);

   if(idx > -1) {
    window.activeSports.splice(idx, 1);
    delete window.categorySchemas[sportId];
    const all = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas') || '{}');
    delete all[sportId];
    localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(all));
    if(window.currentCategory === sportId) window.switchCategory('strength');
   } else {
    window.activeSports.push(sportId);
    const sport = window.SPORT_LIBRARY.find(s => s.id === sportId);
    if(sport) {
     window.categorySchemas[sportId] = { sportName: sport.name, schema: sport.schema };
     const all = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas') || '{}');
     all[sportId] = window.categorySchemas[sportId];
     localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(all));
    }

    if(!isCore) {
     window.saveActiveSports();
     window.renderDynamicSportTabs();
     window.renderSportPicker(document.getElementById('sportSearchInput')?.value || '');
     window.toggleModal('sportPickerModal');
     window.switchCategory(sportId);
     window.showToast(`✅ ${sport?.name || sportId} hinzugefügt!`);
     return;
    }
   }
   window.saveActiveSports();
   window.renderDynamicSportTabs();
   window.renderMeinSportSelector();
   window.renderSportPicker(document.getElementById('sportSearchInput')?.value || '');
  };

  window.renderMeinSportSelector = function() {
   const selector = document.getElementById('meinSportSelector');
   const listEl = document.getElementById('meinSportList');
   if(!selector || !listEl) return;

   const coreCategories = ['strength', 'cardio', 'recovery', 'main'];
   const meinSports = window.activeSports.filter(id => !coreCategories.includes(id));

   const isMeinSportActive = window.currentCategory === 'main' || !coreCategories.includes(window.currentCategory);

   if(meinSports.length > 0 && isMeinSportActive) {
    selector.classList.remove('hidden');
    listEl.innerHTML = meinSports.map(id => {
     const sport = window.SPORT_LIBRARY.find(s => s.id === id);
     if(!sport) return '';
     const isActive = window.currentCategory === id;
     return `<button onclick="window.switchCategory('${id}')" 
      class="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all pointer-events-auto
      ${isActive ? `${sport.bg} ${sport.border} ${sport.color} shadow-sm` : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}">
      <i data-lucide="${sport.icon}" class="w-3 h-3 pointer-events-none"></i>
      ${window._escapeHtml(sport.name)}
     </button>`;
    }).join('');
    window._refreshLucide();
   } else {
    selector.classList.add('hidden');
   }
  };

  window.deleteCustomSport = function(sportId, event) {
   if(event) event.stopPropagation();

   window.showModal(
    'Sport löschen?',
    'Dieser KI-erstellte Sport und alle zugehörigen Daten werden dauerhaft gelöscht.',
    true,
    () => {
     const idx = window.activeSports.indexOf(sportId);
     if(idx > -1) window.activeSports.splice(idx, 1);
     window.saveActiveSports();

     delete window.categorySchemas[sportId];

     const all = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas') || '{}');
     delete all[sportId];
     localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(all));

     const customSports = JSON.parse(localStorage.getItem('beastmode_v2_custom_sports') || '[]');
     const filteredCustom = customSports.filter(s => s.id !== sportId);
     localStorage.setItem('beastmode_v2_custom_sports', JSON.stringify(filteredCustom));

     const libIdx = window.SPORT_LIBRARY.findIndex(s => s.id === sportId);
     if(libIdx > -1) window.SPORT_LIBRARY.splice(libIdx, 1);

     if(window.currentCategory === sportId) window.switchCategory('strength');

     window.renderDynamicSportTabs();
     window.renderSportPicker('');
     window.showToast(window.t('toastDeleted'));
    }
   );
  };

  window.renderDynamicSportTabs = function() {
   const container = document.getElementById('dynamicSportTabs');
   if(!container) return;
   const modules = window.userProfile.modules || { strength: true, cardio: true, recovery: false, main: false };
   const mainEnabled = modules.main !== false;
   const coreCategories = ['strength', 'cardio', 'recovery', 'main'];

   const sportTabs = mainEnabled ? window.activeSports.filter(id => !coreCategories.includes(id)) : [];

   const mainBtn = document.getElementById('btnCat_main');
   if(mainBtn) mainBtn.style.display = mainEnabled && sportTabs.length === 0 ? '' : 'none';

   const addBtn = document.getElementById('btnAddSport');
   if(addBtn) addBtn.style.display = mainEnabled ? '' : 'none';

   if(!mainEnabled) {
    container.innerHTML = '';
    window._refreshLucide();
    return;
   }

   container.innerHTML = sportTabs.map(id => {
    const sport = window.SPORT_LIBRARY.find(s => s.id === id);
    if(!sport) return '';
    const isActive = window.currentCategory === id;
    if(!window.CAT_UI[id]) {
     window.CAT_UI[id] = { name: sport.name, icon: sport.icon, color: sport.color || 'text-cyan-400', border: sport.border || 'border-cyan-400/30', bg: sport.bg || 'bg-cyan-400/20' };
    }
    return `<button onclick="window.switchCategory('${sport.id}')" id="btnCat_${sport.id}"
     class="cat-pill flex-shrink-0 cursor-pointer pointer-events-auto interactive-z ${isActive ? 'cat-pill-active' : ''}">
     <i data-lucide="${sport.icon}" class="w-3.5 h-3.5 pointer-events-none"></i> ${window._escapeHtml(sport.name)}
    </button>`;
   }).join('');

   window._refreshLucide();
   window.renderMeinSportSelector();
  };

  window.addEventListener('load', () => {
   const customSports = JSON.parse(localStorage.getItem('beastmode_v2_custom_sports') || '[]');
   customSports.forEach(sport => {
    if(!window.SPORT_LIBRARY.find(s => s.id === sport.id)) {
     window.SPORT_LIBRARY.push(sport);
    }
    if(!window.CAT_UI[sport.id]) {
     window.CAT_UI[sport.id] = {
      name: sport.name,
      icon: sport.icon || 'trophy',
      color: sport.color || 'text-cyan-400',
      border: sport.border || 'border-cyan-400/30',
      bg: sport.bg || 'bg-cyan-400/20'
     };
    }
   });

   window.activeSports.forEach(id => {
    const sport = window.SPORT_LIBRARY.find(s => s.id === id);
    if(sport && !window.categorySchemas[id]) {
     const savedSchemas = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas') || '{}');
     if(savedSchemas[id]) {
      window.categorySchemas[id] = savedSchemas[id];
     } else {
      window.categorySchemas[id] = { sportName: sport.name, schema: sport.schema };
     }
    }
   });
   window.renderDynamicSportTabs();
   window.renderMeinSportSelector();
  });

  window.SPORT_LIBRARY.forEach(s => {
   if(!window.CAT_UI[s.id]) {
    window.CAT_UI[s.id] = { name: s.name, icon: s.icon, color: s.color, border: s.border.replace('/30','/40'), bg: s.bg };
   }
  });

  window._customTabs = JSON.parse(localStorage.getItem('base_custom_tabs') || '[]');
  var _CT_ICONS = ['target','flame','mountain','bike','sword','music','leaf','star','waves','compass'];

  window._renderCustomTabs = function() {
   var container = document.getElementById('dynamicSportTabs');
   if(!container) return;
   var existing = container.querySelectorAll('.custom-tab-btn');
   existing.forEach(function(el) { el.remove(); });
   window._customTabs.forEach(function(tab) {
    var isActive = window.currentCategory === tab.id;
    var btn = document.createElement('button');
    btn.className = 'cat-pill flex-shrink-0 cursor-pointer pointer-events-auto custom-tab-btn' + (isActive ? ' cat-pill-active' : '');
    btn.id = 'btnCat_' + tab.id;
    btn.setAttribute('onclick', "window.switchCategory('" + tab.id + "')");
    btn.innerHTML = '<i data-lucide="' + (tab.icon || 'target') + '" class="w-3.5 h-3.5 pointer-events-none"></i> ' + window._escapeHtml(tab.name);
    container.appendChild(btn);
    if(!window.CAT_UI[tab.id]) {
     window.CAT_UI[tab.id] = { name: tab.name, icon: tab.icon || 'target', color: 'text-amber-400', border: 'border-amber-400', bg: 'bg-amber-400/20' };
    }
    if(!window.categorySchemas[tab.id]) {
     window.categorySchemas[tab.id] = { sportName: tab.name, schema: tab.fields.map(function(f, i) {
      return { id: 'custom_' + tab.id + '_' + i, label: f.label, type: f.type || 'text', placeholder: f.placeholder || '' };
     }) };
    }
   });
   var addBtn = document.getElementById('btnAddSport');
   if(addBtn && window._customTabs.length >= 3) {
    addBtn.style.opacity = '0.3';
    addBtn.title = 'Maximum 3 Custom Tabs erreicht';
   } else if(addBtn) {
    addBtn.style.opacity = '1';
    addBtn.title = 'Sport hinzufügen';
   }
   window._refreshLucide();
  };

  window.openCustomTabCreator = function() {
   if(window._customTabs.length >= 3) { window.showToast(window.t('toastError', 'Maximum 3 Custom Tabs')); return; }
   var iconGrid = _CT_ICONS.map(function(ic) {
    return '<button type="button" onclick="window._selectCtIcon(this,\'' + ic + '\')" class="ct-icon-btn w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)"><i data-lucide="' + ic + '" class="w-5 h-5 pointer-events-none"></i></button>';
   }).join('');
   var html = '<div class="space-y-4 mt-3 text-left">' +
    '<div><p class="text-[10px] font-bold uppercase tracking-widest mb-1.5" style="color:var(--text-muted)">Tab-Name</p>' +
    '<input type="text" id="ctName" maxlength="15" placeholder="z.B. Yoga" class="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none cursor-text pointer-events-auto" style="background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)"></div>' +
    '<div><p class="text-[10px] font-bold uppercase tracking-widest mb-1.5" style="color:var(--text-muted)">Icon</p>' +
    '<div class="flex flex-wrap gap-2" id="ctIconGrid">' + iconGrid + '</div>' +
    '<input type="hidden" id="ctIconVal" value="target"></div>' +
    '<div id="ctFieldsContainer"><p class="text-[10px] font-bold uppercase tracking-widest mb-1.5" style="color:var(--text-muted)">Felder (1-6)</p>' +
    '<div id="ctFields" class="space-y-2">' +
    '<div class="flex gap-2"><input type="text" placeholder="Feld-Name (z.B. Dauer)" class="ct-field-input flex-1 px-2.5 py-2 rounded-lg text-xs font-bold outline-none cursor-text pointer-events-auto" style="background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)"><select class="ct-field-type px-2 py-2 rounded-lg text-xs font-bold outline-none cursor-pointer pointer-events-auto" style="background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)"><option value="number">Zahl</option><option value="text">Text</option></select></div>' +
    '</div>' +
    '<button type="button" onclick="window._addCtField()" class="mt-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer pointer-events-auto" style="color:var(--primary-hex)">+ Feld hinzufügen</button>' +
    '</div></div>';
   window.showModal('Custom Tab', html, true, function() {
    var name = (document.getElementById('ctName')?.value || '').trim();
    if(!name) { window.showToast(window.t('toastError', 'Bitte Name eingeben')); return; }
    var icon = document.getElementById('ctIconVal')?.value || 'target';
    var fieldInputs = document.querySelectorAll('.ct-field-input');
    var fieldTypes = document.querySelectorAll('.ct-field-type');
    var fields = [];
    fieldInputs.forEach(function(inp, i) {
     var label = inp.value.trim();
     if(label) fields.push({ label: label, type: fieldTypes[i]?.value || 'text', placeholder: '' });
    });
    if(fields.length === 0) { window.showToast(window.t('toastError', 'Mindestens 1 Feld')); return; }
    var tab = { id: 'ct_' + Date.now().toString(36), name: name, icon: icon, fields: fields };
    window._customTabs.push(tab);
    localStorage.setItem('base_custom_tabs', JSON.stringify(window._customTabs));
    window._renderCustomTabs();
    window.switchCategory(tab.id);
    window.showToast(name + ' Tab erstellt!');
   });
   setTimeout(function() {
    window._selectCtIcon(document.querySelector('.ct-icon-btn'), 'target');
    window._refreshLucide();
   }, 100);
  };

  window._selectCtIcon = function(btn, icon) {
   document.querySelectorAll('.ct-icon-btn').forEach(function(b) {
    b.style.background = 'var(--inner-bg-hex)';
    b.style.borderColor = 'var(--border-hex)';
    b.style.color = 'var(--text-muted)';
   });
   if(btn) { btn.style.background = 'rgba(6,182,212,0.15)'; btn.style.borderColor = 'rgba(6,182,212,0.3)'; btn.style.color = '#06b6d4'; }
   var inp = document.getElementById('ctIconVal');
   if(inp) inp.value = icon;
  };

  window._addCtField = function() {
   var container = document.getElementById('ctFields');
   if(!container) return;
   if(container.children.length >= 6) { window.showToast(window.t('toastError', 'Maximum 6 Felder')); return; }
   var div = document.createElement('div');
   div.className = 'flex gap-2';
   div.innerHTML = '<input type="text" placeholder="Feld-Name" class="ct-field-input flex-1 px-2.5 py-2 rounded-lg text-xs font-bold outline-none cursor-text pointer-events-auto" style="background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)"><select class="ct-field-type px-2 py-2 rounded-lg text-xs font-bold outline-none cursor-pointer pointer-events-auto" style="background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)"><option value="number">Zahl</option><option value="text">Text</option></select>';
   container.appendChild(div);
  };

  window.deleteCustomTab = function(tabId) {
   window.showModal('Tab löschen?', 'Dieser Custom Tab wird entfernt. Bereits getrackte Daten bleiben im Archiv.', true, function() {
    window._customTabs = window._customTabs.filter(function(t) { return t.id !== tabId; });
    localStorage.setItem('base_custom_tabs', JSON.stringify(window._customTabs));
    delete window.CAT_UI[tabId];
    delete window.categorySchemas[tabId];
    window._renderCustomTabs();
    window.switchCategory('strength');
    window.showToast(window.t('toastDeleted'));
   });
  };

  window._renderCustomTabs();
  if (window._initDraggableTabs) window._initDraggableTabs();

  window._applySavedTabOrder = function() {
   var saved = localStorage.getItem('base_tab_order');
   if(!saved) return;
   try {
    var order = JSON.parse(saved);
    var container = document.getElementById('categoryNavContainer');
    if(!container) return;
    var buttons = Array.from(container.querySelectorAll('.cat-pill:not(#btnAddSport)'));
    var sorted = [];
    order.forEach(function(id) {
     var btn = buttons.find(function(b) { return b.id === 'btnCat_' + id; });
     if(btn) sorted.push(btn);
    });
    buttons.forEach(function(b) { if(sorted.indexOf(b) === -1) sorted.push(b); });
    var addBtn = document.getElementById('btnAddSport');
    var dynTabs = document.getElementById('dynamicSportTabs');
    sorted.forEach(function(btn) { container.insertBefore(btn, dynTabs || addBtn); });
   } catch(e) {}
  };

  window._initDraggableTabs = function() {
   var container = document.getElementById('categoryNavContainer');
   if (!container) return;
   var dragEl = null;
   var longPressTimer = null;
   var isDragging = false;

   var saved = localStorage.getItem('base_tab_order');
   if (saved) {
    try {
     var order = JSON.parse(saved);
     var pills = Array.from(container.querySelectorAll('.cat-pill[id^="btnCat_"]'));
     var dynamicTabs = document.getElementById('dynamicSportTabs');
     var addBtn = container.querySelector('#btnAddSport');
     order.forEach(function(catId) {
      var pill = document.getElementById('btnCat_' + catId);
      if (pill && dynamicTabs) {
       container.insertBefore(pill, dynamicTabs);
      }
     });
     if (addBtn) container.appendChild(addBtn);
    } catch(e) {}
   }

   if (container._dragListenersAttached) return;
   container._dragListenersAttached = true;
   container.addEventListener('touchstart', function(e) {
    var pill = e.target.closest('.cat-pill[id^="btnCat_"]');
    if (!pill) return;
    longPressTimer = setTimeout(function() {
     isDragging = true;
     dragEl = pill;
     pill.style.opacity = '0.5';
     pill.style.transform = 'scale(0.9)';
     pill.style.zIndex = '100';
     if (navigator.vibrate) navigator.vibrate(30);
    }, 300);
   }, { passive: true });

   container.addEventListener('touchmove', function(e) {
    if (!isDragging || !dragEl) return;
    e.preventDefault();
    var touch = e.touches[0];
    var pills = container.querySelectorAll('.cat-pill[id^="btnCat_"]');
    for (var j = 0; j < pills.length; j++) {
     var p = pills[j];
     if (p === dragEl) continue;
     var rect = p.getBoundingClientRect();
     if (touch.clientX > rect.left && touch.clientX < rect.right) {
      var parent = dragEl.parentNode;
      if (touch.clientX > rect.left + rect.width / 2) {
       parent.insertBefore(dragEl, p.nextSibling);
      } else {
       parent.insertBefore(dragEl, p);
      }
      break;
     }
    }
   }, { passive: false });

   container.addEventListener('touchend', function() {
    if (longPressTimer) clearTimeout(longPressTimer);
    if (isDragging && dragEl) {
     dragEl.style.opacity = '';
     dragEl.style.transform = '';
     dragEl.style.zIndex = '';
     isDragging = false;
     var pills = container.querySelectorAll('.cat-pill[id^="btnCat_"]');
     var order = [];
     pills.forEach(function(p) {
      var id = p.id.replace('btnCat_', '');
      if (id) order.push(id);
     });
     localStorage.setItem('base_tab_order', JSON.stringify(order));
     dragEl = null;
    }
   });
  };

  let _recognition = null;
  let _isListening = false;

  window.toggleVoiceInput = function() {
   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

   if(!SpeechRecognition) {
    window.showToast(window.t('toastError', 'Spracheingabe nicht unterstützt'));
    return;
   }

   if(_isListening) {
    _recognition?.stop();
    return;
   }

   _recognition = new SpeechRecognition();
   const langCodes = { de:'de-DE', en:'en-US', fr:'fr-FR', es:'es-ES', it:'it-IT', nl:'nl-NL', ar:'ar-SA' };
   _recognition.lang = langCodes[window.currentLang] || 'en-US';
   _recognition.interimResults = true;
   _recognition.maxAlternatives = 1;
   _recognition.continuous = false;

   const btn = document.getElementById('btnMic');
   const icon = document.getElementById('micIcon');
   const input = document.getElementById('sportTypeInput');

   _isListening = true;
   if(btn) btn.classList.add('mic-active');
   if(icon) { icon.setAttribute('data-lucide', 'mic-2'); window._refreshLucide(); }
   window.showToast(window.t('toastUpdate', '🎙 Spreche jetzt...'));

   _recognition.onresult = (e) => {
    const transcript = Array.from(e.results)
     .map(r => r[0].transcript)
     .join('');
    if(input) input.value = transcript;
   };

   _recognition.onend = () => {
    _isListening = false;
    if(btn) btn.classList.remove('mic-active');
    if(icon) { icon.setAttribute('data-lucide', 'mic'); window._refreshLucide(); }
    const val = input?.value?.trim();
    if(val) {
     window.showToast('✅ Erkannt: "' + val + '"');
     setTimeout(() => window.generateForm(), 600);
    }
   };

   _recognition.onerror = (e) => {
    _isListening = false;
    if(btn) btn.classList.remove('mic-active');
    if(icon) { icon.setAttribute('data-lucide', 'mic'); window._refreshLucide(); }
    if(e.error === 'not-allowed') {
     window.showToast(window.t('toastError', 'Mikrofon-Zugriff verweigert'));
    } else if(e.error !== 'no-speech') {
     window.showToast('Spracheingabe Fehler: ' + e.error);
    }
   };

   _recognition.start();
  };

  window.addEventListener('load', () => {
   const onboarding = document.getElementById('onboardingModal');
   if(onboarding && !window.userProfile.onboardingDone) {
    setTimeout(() => { window._refreshLucide(); }, 100);
   }
  });

  const _kiHints = [
   {
    threshold: 1,
    flag: 'base_ki_hint_coach',
    icon: 'sparkles',
    get title() { return window.t('kiHintCoachTitle','Scan ist bereit'); },
    get text() { return window.t('kiHintCoachText','Du hast dein erstes Workout gespeichert! Scan analysiert deine Daten und gibt dir personalisierte Empfehlungen.'); },
    get ctaText() { return window.t('toolCoach','Scan starten'); },
    ctaAction: function() {
     window.switchTab('tools');
     setTimeout(function() {
      var btn = document.querySelector('[onclick*="analyzeWithAI"]') || document.querySelector('[onclick*="openAICoach"]');
      if (btn) btn.click();
     }, 300);
    }
   },
   {
    threshold: 3,
    flag: 'base_ki_hint_plan',
    icon: 'calendar-check',
    get title() { return window.t('kiHintPlanTitle','Planner verfügbar'); },
    get text() { return window.t('kiHintPlanText','Mit 3 Workouts hat die KI genug Daten für einen intelligenten Trainingsplan.'); },
    get ctaText() { return window.t('planGenerate','Plan erstellen'); },
    ctaAction: function() {
     window.switchTab('tools');
     setTimeout(function() {
      var btn = document.querySelector('[onclick*="openTrainingPlanModal"]') || document.querySelector('[onclick*="generatePlan"]');
      if (btn) btn.click();
     }, 300);
    }
   },
   {
    threshold: 5,
    flag: 'base_ki_hint_zns',
    icon: 'activity',
    get title() { return window.t('kiHintZnsTitle','Battery freigeschaltet'); },
    get text() { return window.t('kiHintZnsText','Dein Energie-Score zeigt dir ob du heute voll belasten kannst oder besser leicht trainierst.'); },
    get ctaText() { return window.t('toolZns','Battery checken'); },
    ctaAction: function() {
     window.switchTab('tools');
     setTimeout(function() {
      var btn = document.querySelector('[onclick*="analyzeReadiness"]');
      if (btn) btn.click();
     }, 300);
    }
   },
   {
    threshold: 7,
    flag: 'base_ki_hint_prehab',
    icon: 'shield-check',
    get title() { return window.t('kiHintPrehabTitle','Armor: Verletzungen vorbeugen'); },
    get text() { return window.t('kiHintPrehabText','Die KI erkennt einseitige Belastungen und schlägt Aktivierungsübungen vor.'); },
    get ctaText() { return window.t('toolPrehab','Armor starten'); },
    ctaAction: function() {
     window.switchTab('tools');
     setTimeout(function() {
      var btn = document.querySelector('[onclick*="generatePreHab"]');
      if (btn) btn.click();
     }, 300);
    }
   },
   {
    threshold: 10,
    flag: 'base_ki_hint_copilot',
    icon: 'cpu',
    get title() { return window.t('kiHintCopilotTitle','Spotter freigeschaltet'); },
    get text() { return window.t('kiHintCopilotText','Der Spotter schlägt dir für jede Übung Sätze, Gewicht und RPE vor.'); },
    get ctaText() { return window.t('toolCopilot','Spotter testen'); },
    ctaAction: function() {
     window.switchTab('tools');
    }
   }
  ];

  const _kiOverviewHint = {
   flag: 'base_ki_hint_overview',
   icon: 'sparkles',
   get title() { return window.t('kiHintOverviewTitle','5 KI-Werkzeuge für dein Training'); },
   get text() { return window.t('kiHintOverviewText','Scan, Planner, Battery, Armor und Spotter — alle arbeiten mit deinen echten Daten.'); },
   ctaText: null
  };

  window._checkKiDiscovery = function(context) {
   if (window.currentMode === 'pt') return;

   var container = document.getElementById('kiDiscoveryContainer');
   if (!container) {
    var trackerMain = document.getElementById('trackerMain');
    if (!trackerMain || !trackerMain.parentNode) return;
    container = document.createElement('div');
    container.id = 'kiDiscoveryContainer';
    trackerMain.parentNode.insertBefore(container, trackerMain);
   }

   if (container.children.length > 0) return;

   var archivedCount = 0;
   if (Array.isArray(window.workouts)) {
    archivedCount = window.workouts.filter(function(w) { return w.archived; }).length;
   }

   if (context === 'tools-tab') {
    if (!localStorage.getItem(_kiOverviewHint.flag)) {
     _renderKiHint(container, _kiOverviewHint);
     return;
    }
   }

   for (var i = _kiHints.length - 1; i >= 0; i--) {
    var hint = _kiHints[i];
    if (archivedCount >= hint.threshold && !localStorage.getItem(hint.flag)) {
     _renderKiHint(container, hint);
     return;
    }
   }
  };

  function _renderKiHint(container, hint) {
   var hasAction = hint.ctaAction && hint.ctaText;
   var hintId = 'kiHint_' + hint.flag;

   container.innerHTML =
    '<div class="ki-hint-card" id="' + hintId + '">' +
     '<button class="ki-hint-dismiss pointer-events-auto" onclick="window._dismissKiHint(\'' + hint.flag + '\', \'' + hintId + '\')" aria-label="Schliessen">' +
      '<i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>' +
     '</button>' +
     '<div class="flex items-start gap-3">' +
      '<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(163,201,168,0.12);border:1px solid rgba(163,201,168,0.2)">' +
       '<i data-lucide="' + hint.icon + '" class="w-4 h-4" style="color:var(--primary-hex)"></i>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
       '<p class="ki-hint-title">' + hint.title + '</p>' +
       '<p class="ki-hint-text">' + hint.text + '</p>' +
       (hasAction ? '<button class="ki-hint-cta pointer-events-auto" onclick="window._dismissKiHint(\'' + hint.flag + '\', \'' + hintId + '\'); (' + hint.ctaAction.toString() + ')()">' +
        '<i data-lucide="arrow-right" class="w-3 h-3 pointer-events-none"></i> ' + hint.ctaText +
       '</button>' : '') +
      '</div>' +
     '</div>' +
    '</div>';

   window._refreshLucide();
  }

  window._dismissKiHint = function(flag, elementId) {
   localStorage.setItem(flag, '1');
   var el = document.getElementById(elementId);
   if (el) {
    el.classList.add('ki-hint-out');
    setTimeout(function() {
     if (el.parentNode) el.parentNode.removeChild(el);
    }, 350);
   }
  };

  window._markFeatureUsed = function(feature) {
   var usage = JSON.parse(localStorage.getItem('base_ki_discovery') || '{}');
   usage[feature] = true;
   localStorage.setItem('base_ki_discovery', JSON.stringify(usage));
  };

  window._renderKiDiscoveryHints = function() {
   var container = document.getElementById('kiDiscoveryHints');
   if (!container) return;
   var usage = JSON.parse(localStorage.getItem('base_ki_discovery') || '{}');
   var hints = [];
   if (!usage.coach_used) hints.push({ icon: 'brain', label: window.t('hintCoach', 'KI Coach'), desc: window.t('hintCoachDesc', 'Analysiert dein Training und gibt dir persönliche Empfehlungen'), action: 'analyzeWithAI' });
   if (!usage.plan_used) hints.push({ icon: 'calendar', label: window.t('hintPlan', 'Trainingsplan'), desc: window.t('hintPlanDesc', 'KI erstellt einen personalisierten Plan basierend auf deinen Daten'), action: 'openPlanBuilder' });
   if (!usage.prehab_used) hints.push({ icon: 'shield', label: window.t('hintPrehab', 'Verletzungsprävention'), desc: window.t('hintPrehabDesc', 'Aktivierungsübungen und Warm-Up basierend auf deinem Training'), action: 'generatePreHab' });
   if (hints.length === 0) { container.classList.add('hidden'); return; }
   container.classList.remove('hidden');
   container.innerHTML = '<p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">' + window.t('hintTitle', 'Noch nicht entdeckt') + '</p>' +
    hints.slice(0, 2).map(function(h) {
     return '<div onclick="if(window.' + h.action + ')window.' + h.action + '()" class="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer pointer-events-auto transition-all" style="background:rgba(163,201,168,0.05);border:1px solid rgba(163,201,168,0.1)">' +
      '<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(163,201,168,0.1)"><i data-lucide="' + h.icon + '" class="w-4 h-4 pointer-events-none" style="color:var(--primary-hex)"></i></div>' +
      '<div><p class="text-xs font-bold text-white">' + window._escapeHtml(h.label) + '</p>' +
      '<p class="text-[9px]" style="color:var(--text-muted)">' + window._escapeHtml(h.desc) + '</p></div>' +
      '<i data-lucide="chevron-right" class="w-3 h-3 flex-shrink-0 pointer-events-none" style="color:#737373"></i></div>';
    }).join('');
   window._refreshLucide();
  };

  // ============================================================
  // FOCUS MUSCLES + DAY ASSIGNMENT + INJURIES HELPER + MESOCYCLE
  // ============================================================
  window._FOCUS_MUSCLES = {
   upper: [
    { id: 'chest', de: 'Brust', en: 'Chest' },
    { id: 'upper_back', de: 'Rücken (oben)', en: 'Upper Back' },
    { id: 'lats', de: 'Latissimus', en: 'Lats' },
    { id: 'front_delts', de: 'Vordere Schulter', en: 'Front Delts' },
    { id: 'rear_delts', de: 'Hintere Schulter', en: 'Rear Delts' },
    { id: 'mid_delts', de: 'Mittlere Schulter', en: 'Side Delts' },
    { id: 'biceps', de: 'Bizeps', en: 'Biceps' },
    { id: 'triceps', de: 'Trizeps', en: 'Triceps' },
    { id: 'traps', de: 'Nacken/Trapez', en: 'Traps' }
   ],
   lower: [
    { id: 'quads', de: 'Beinstrecker', en: 'Quads' },
    { id: 'hamstrings', de: 'Beinbeuger', en: 'Hamstrings' },
    { id: 'glutes', de: 'Po', en: 'Glutes' },
    { id: 'calves', de: 'Waden', en: 'Calves' }
   ],
   core: [
    { id: 'abs', de: 'Bauch', en: 'Abs' },
    { id: 'obliques', de: 'Seitl. Bauch', en: 'Obliques' },
    { id: 'lower_back_muscle', de: 'Unterer Rücken', en: 'Lower Back' }
   ]
  };
  window._selectedFocusMuscles = new Set();

  window._renderFocusMuscleChips = function(containerId) {
   var container = document.getElementById(containerId || 'focusMuscleChips');
   if (!container) return;
   var lang = window.currentLang || 'de';
   var html = '';
   ['upper', 'lower', 'core'].forEach(function(group) {
    var gl = { upper: { de: 'Oberkoerper', en: 'Upper Body' }, lower: { de: 'Unterkoerper', en: 'Lower Body' }, core: { de: 'Core', en: 'Core' } }[group];
    html += '<p class="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-3 mb-1">' + (lang === 'de' ? gl.de : gl.en) + '</p><div class="flex flex-wrap gap-1.5 mb-2">';
    window._FOCUS_MUSCLES[group].forEach(function(m) {
     var sel = window._selectedFocusMuscles.has(m.id);
     var label = lang === 'de' ? m.de : m.en;
     html += '<button type="button" onclick="window._toggleFocusMuscle(\'' + m.id + '\',\'' + (containerId || 'focusMuscleChips') + '\')" class="px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer pointer-events-auto transition-all" style="' + (sel ? 'background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.3);color:var(--primary-hex)' : 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)') + '">' + window._escapeHtml(label) + '</button>';
    });
    html += '</div>';
   });
   if (window._selectedFocusMuscles.size >= 2) html += '<p class="text-[9px] text-amber-500 mt-1">' + window.t('focusMax', 'Max. 2 Fokus-Muskelgruppen empfohlen') + '</p>';
   container.innerHTML = html;
  };

  window._toggleFocusMuscle = function(muscleId, containerId) {
   if (window._selectedFocusMuscles.has(muscleId)) { window._selectedFocusMuscles.delete(muscleId); }
   else { if (window._selectedFocusMuscles.size >= 3) { window.showToast(window.t('focusTooMany', 'Maximal 3 Fokus-Muskelgruppen')); return; } window._selectedFocusMuscles.add(muscleId); }
   window._renderFocusMuscleChips(containerId);
  };

  // Day Assignment
  window._trainingDayAssignment = {};
  window._renderDayAssignment = function(containerId, numDays) {
   var container = document.getElementById(containerId || 'dayAssignmentContainer');
   if (!container) return;
   numDays = numDays || 3;
   var dayLabels = ['Mo','Di','Mi','Do','Fr','Sa','So'];
   var dayIds = ['mon','tue','wed','thu','fri','sat','sun'];
   var html = '<button type="button" onclick="window._autoDistributeDays(' + numDays + ')" class="w-full mb-3 py-2 rounded-xl text-[10px] font-bold cursor-pointer pointer-events-auto flex items-center justify-center gap-2" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)"><i data-lucide="shuffle" class="w-3 h-3 pointer-events-none"></i> ' + window.t('dayAutoDistribute', 'Gleichmaessig verteilen') + '</button>';
   for (var d = 0; d < numDays; d++) {
    var dn = d + 1; var assigned = window._trainingDayAssignment['day' + dn] || '';
    html += '<div class="p-3 rounded-xl mb-2" style="background:var(--inner-bg-hex);border:1px solid ' + (assigned ? 'rgba(163,201,168,0.3)' : 'var(--border-hex)') + '"><div class="flex items-center gap-2 mb-2"><span class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black" style="background:rgba(163,201,168,0.15);color:var(--primary-hex)">' + dn + '</span><span class="text-xs font-bold text-white">' + window.t('lblDay', 'Tag') + ' ' + dn + '</span></div><div class="flex gap-1.5">';
    for (var i = 0; i < 7; i++) {
     var isSel = assigned === dayIds[i];
     var isUsed = false;
     for (var k in window._trainingDayAssignment) { if (k !== 'day' + dn && window._trainingDayAssignment[k] === dayIds[i]) { isUsed = true; break; } }
     html += '<button type="button" onclick="window._assignDay(' + dn + ',\'' + dayIds[i] + '\')" class="flex-1 py-2 rounded-lg text-[10px] font-bold cursor-pointer pointer-events-auto transition-all" style="' + (isSel ? 'background:rgba(163,201,168,0.2);border:1px solid rgba(163,201,168,0.4);color:var(--primary-hex)' : isUsed ? 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:#333;opacity:0.4' : 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)') + '">' + dayLabels[i] + '</button>';
    }
    html += '</div></div>';
   }
   container.innerHTML = html;
   window._refreshLucide();
  };

  window._assignDay = function(dayNum, dayId) {
   for (var k in window._trainingDayAssignment) { if (window._trainingDayAssignment[k] === dayId) delete window._trainingDayAssignment[k]; }
   window._trainingDayAssignment['day' + dayNum] = dayId;
   window._renderDayAssignment(null, Object.keys(window._trainingDayAssignment).length > 0 ? Math.max.apply(null, Object.keys(window._trainingDayAssignment).map(function(k) { return parseInt(k.replace('day', '')); })) : 3);
  };

  window._autoDistributeDays = function(n) {
   window._trainingDayAssignment = {};
   var maps = { 2: { day1: 'mon', day2: 'thu' }, 3: { day1: 'mon', day2: 'wed', day3: 'fri' }, 4: { day1: 'mon', day2: 'tue', day3: 'thu', day4: 'fri' }, 5: { day1: 'mon', day2: 'tue', day3: 'wed', day4: 'fri', day5: 'sat' }, 6: { day1: 'mon', day2: 'tue', day3: 'wed', day4: 'thu', day5: 'fri', day6: 'sat' } };
   window._trainingDayAssignment = maps[n] || maps[3];
   window._renderDayAssignment(null, n);
  };

  // Injuries helper for AI prompts
  window._getInjuriesForAI = function() {
   var injuries = Array.from(window.selectedInjuries || []);
   return injuries.length > 0 ? injuries.join(', ') : 'keine';
  };

  // Mesocycle overview renderer
  window._renderMesoCycleOverview = function(plan) {
   if (!plan.mesoCycle || !plan.mesoCycle.phases) return '';
   var _cw = window._getCurrentMesoWeek ? window._getCurrentMesoWeek() : 0;
   var html = '<div class="mb-4 p-4 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><p class="text-xs font-black text-white uppercase tracking-widest mb-3">' + window.t('mesoTitle', 'Mesozyklus') + '</p>';
   plan.mesoCycle.phases.forEach(function(phase, i) {
    var isDeload = phase.type === 'deload';
    var isCurrent = i === _cw;
    var bg = isDeload ? 'rgba(138,175,232,0.1)' : isCurrent ? 'rgba(163,201,168,0.1)' : 'var(--inner-bg-hex)';
    var bc = isDeload ? 'rgba(138,175,232,0.25)' : isCurrent ? 'rgba(163,201,168,0.25)' : 'var(--border-hex)';
    var lc = isDeload ? '#8aafe8' : '#a3c9a8';
    var tl = { accumulation: window.t('mesoAccum', 'Akkumulation'), overreach: window.t('mesoOverreach', 'Overreach'), deload: 'Deload' }[phase.type] || phase.type;
    html += '<div class="flex items-center gap-3 p-3 rounded-xl mb-2" style="background:' + bg + ';border:1px solid ' + bc + '"><span class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black" style="background:' + (isCurrent ? 'rgba(163,201,168,0.2)' : 'var(--inner-bg-hex)') + ';color:' + lc + '">' + phase.week + '</span><div class="flex-1"><p class="text-xs font-bold text-white">' + window._escapeHtml(phase.name) + '</p><p class="text-[9px] text-zinc-500">Sets \u00d7' + phase.setsMultiplier + ' \u00b7 RIR ' + phase.targetRIR + '</p></div><span class="text-[8px] font-black uppercase px-2 py-1 rounded" style="color:' + lc + '">' + tl + (isCurrent ? ' \u00b7 ' + window.t('mesoCurrent', 'AKTUELL') : '') + '</span></div>';
   });
   html += '</div>';
   return html;
  };

  // === MESO WEEK TRACKING ===
  window._getCurrentMesoWeek = function() {
   var plan = null; try { plan = JSON.parse(localStorage.getItem('base_active_plan')); } catch(e) {}
   if (!plan || !plan.startDate) return 0;
   var diffDays = Math.floor((new Date() - new Date(plan.startDate)) / 86400000);
   return Math.max(0, Math.min(Math.floor(diffDays / 7), (plan.totalWeeks || 4) - 1));
  };

  window._checkDeloadReminder = function() {
   var plan = null; try { plan = JSON.parse(localStorage.getItem('base_active_plan')); } catch(e) {}
   if (!plan || !plan.startDate) return;
   var currentWeek = window._getCurrentMesoWeek();
   if (currentWeek >= (plan.totalWeeks || 4) - 1) {
    if (!localStorage.getItem('base_deload_dismissed_' + plan.startDate)) {
     window.showToast(window.t('deloadReminder', 'Deload-Woche! Reduziere Volumen um 40%.'), null, null, null, 5000);
     localStorage.setItem('base_deload_dismissed_' + plan.startDate, '1');
    }
   }
  };

  // === AUTO-REGULATION (RPE/RIR-basierte Volumen-Anpassung) ===
  window._autoRegulateVolume = function() {
   var plan = null; try { plan = JSON.parse(localStorage.getItem('base_active_plan')); } catch(e) {}
   if (!plan || !plan.planData) return;
   var currentWeek = window._getCurrentMesoWeek ? window._getCurrentMesoWeek() : 0;
   if (currentWeek === 0) return;
   var weekStart = new Date(plan.startDate);
   weekStart.setDate(weekStart.getDate() + ((currentWeek - 1) * 7));
   var weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
   var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
   var lastWeekWorkouts = allWorkouts.filter(function(w) {
    var d = new Date(w.date); return d >= weekStart && d < weekEnd && w.category === 'strength' && w.setDetails;
   });
   if (lastWeekWorkouts.length === 0) return;
   var totalRir = 0, rirCount = 0;
   lastWeekWorkouts.forEach(function(w) {
    (w.setDetails || []).forEach(function(s) {
     if (s.rir != null && !isNaN(parseFloat(s.rir)) && s.type !== 'warmup') { totalRir += parseFloat(s.rir); rirCount++; }
    });
   });
   if (rirCount === 0) return;
   var avgRir = totalRir / rirCount;
   var pumpData = JSON.parse(localStorage.getItem('base_pump_soreness') || '{}');
   var avgSoreness = 0, avgPump = 0, pumpCount = 0;
   Object.keys(pumpData).forEach(function(d) {
    var date = new Date(d);
    if (date >= weekStart && date < weekEnd) {
     Object.values(pumpData[d]).forEach(function(m) { if (m.soreness) { avgSoreness += m.soreness; pumpCount++; } if (m.pump) avgPump += m.pump; });
    }
   });
   if (pumpCount > 0) { avgSoreness = avgSoreness / pumpCount; avgPump = avgPump / pumpCount; }
   var adjustment = 0, reason = '';
   if (avgRir <= 0.5 && avgSoreness >= 4) { adjustment = -2; reason = 'RIR nahe 0 + hohe Soreness: Volumen deutlich reduzieren (-2 Sets/Muskelgruppe)'; }
   else if (avgRir <= 1 && avgSoreness >= 3) { adjustment = -1; reason = 'Niedrige RIR + moderate Soreness: Volumen leicht reduzieren (-1 Set/Muskelgruppe)'; }
   else if (avgRir >= 3.5 && avgSoreness <= 2 && avgPump >= 3) { adjustment = 1; reason = 'Hoher RIR + niedrige Soreness + guter Pump: Volumen steigern (+1 Set/Muskelgruppe)'; }
   else if (avgRir >= 4 && avgSoreness <= 1.5) { adjustment = 2; reason = 'Sehr hoher RIR + minimale Soreness: Volumen deutlich steigern (+2 Sets/Muskelgruppe)'; }
   else { return; }
   if (localStorage.getItem('base_autoreg_dismissed_w' + currentWeek)) return;
   var color = adjustment > 0 ? '#a3c9a8' : '#e8c86a';
   var icon = adjustment > 0 ? '📈' : '📉';
   var dir = adjustment > 0 ? 'steigern' : 'reduzieren';
   var html = '<div class="p-4 rounded-xl mb-4" style="background:' + color + '08;border:1px solid ' + color + '25">';
   html += '<div class="flex items-center justify-between mb-2">';
   html += '<div class="flex items-center gap-2"><span style="font-size:18px">' + icon + '</span><span class="text-sm font-bold" style="color:' + color + '">Auto-Regulation: Volumen ' + dir + '</span></div>';
   html += '<button onclick="localStorage.setItem(\'base_autoreg_dismissed_w' + currentWeek + '\',\'1\');this.closest(\'#autoRegWidget\').remove()" class="text-xs cursor-pointer pointer-events-auto" style="color:#737373" aria-label="Schliessen">✕</button>';
   html += '</div>';
   html += '<div class="text-[10px] mb-2" style="color:#ccc">' + reason + '</div>';
   html += '<div class="text-[8px]" style="color:#9898a2">Letzte Woche: RIR ' + avgRir.toFixed(1) + ' | Soreness ' + avgSoreness.toFixed(1) + '/5 | Pump ' + avgPump.toFixed(1) + '/5</div>';
   html += '</div>';
   var widget = document.getElementById('autoRegWidget');
   if (!widget) {
    widget = document.createElement('div');
    widget.id = 'autoRegWidget';
    widget.className = 'px-4';
    var target = document.getElementById('todaysWorkoutSection') || document.getElementById('routinesSection');
    if (target && target.parentNode) target.parentNode.insertBefore(widget, target);
    else return;
   }
   widget.innerHTML = html;
  };

  // === TODAY'S WORKOUT ===
  window._getTodaysWorkout = function() {
   var plan = null; try { plan = JSON.parse(localStorage.getItem('base_active_plan')); } catch(e) {}
   if (!plan || !plan.planData || !plan.planData.weeks) return null;
   var currentWeek = window._getCurrentMesoWeek();
   var week = plan.planData.weeks[currentWeek];
   if (!week || !week.sessions) return null;
   var dayMap = {0:'So',1:'Mo',2:'Di',3:'Mi',4:'Do',5:'Fr',6:'Sa'};
   var today = dayMap[new Date().getDay()];
   return week.sessions.find(function(s) { return s.day && s.day.indexOf(today) !== -1; }) || null;
  };

  window._renderTodaysWorkout = function() {
   var container = document.getElementById('todaysWorkoutSection');
   if (!container) return;
   var session = window._getTodaysWorkout();
   if (!session) { container.classList.add('hidden'); return; }
   container.classList.remove('hidden');
   var plan = null; try { plan = JSON.parse(localStorage.getItem('base_active_plan')); } catch(e) {}
   var cw = window._getCurrentMesoWeek() + 1;
   var phase = plan && plan.planData && plan.planData.mesoCycle && plan.planData.mesoCycle.phases ? plan.planData.mesoCycle.phases[cw - 1] : null;
   var phaseName = phase ? phase.name : 'Woche ' + cw;
   var exList = (session.exercises || []).slice(0, 4).map(function(ex) { return window._escapeHtml(ex.name); }).join(', ');
   container.innerHTML = '<button onclick="window._loadTodaysWorkout()" class="w-full p-4 rounded-xl text-left cursor-pointer pointer-events-auto" style="background:linear-gradient(135deg,rgba(163,201,168,0.08),rgba(163,201,168,0.02));border:1px solid rgba(163,201,168,0.15)" aria-label="Heutiges Workout laden">' +
    '<div class="flex items-center justify-between mb-1">' +
    '<span class="text-[9px] font-black uppercase tracking-widest" style="color:var(--primary-hex)">' + window.t('todaysWorkout','Heutiges Workout') + ' \u00b7 ' + window._escapeHtml(phaseName) + '</span>' +
    '<span class="text-[8px] font-bold" style="color:#737373">' + window.t('lblWeek','Woche') + ' ' + cw + '</span></div>' +
    '<div class="text-sm font-bold text-white mb-1">' + window._escapeHtml(session.name || 'Training') + '</div>' +
    '<div class="text-[9px]" style="color:#9898a2">' + (session.exercises ? session.exercises.length : 0) + ' ' + window.t('lblExercises','\u00dcbungen') + ' \u00b7 ' + exList + '</div></button>';
  };

  window._loadTodaysWorkout = function() {
   var session = window._getTodaysWorkout();
   if (!session || !session.exercises) return;
   window._routineQueue = session.exercises.map(function(ex) {
    return { name: ex.name || '', sets: ex.sets || 3, reps: parseInt(ex.reps) || 8, weight: 0, rir: ex.rir != null ? ex.rir : 2, equipment: '', restSeconds: parseInt(ex.rest) || 120, notes: ex.notes || '' };
   });
   window._routineName = session.name || 'Workout';
   window._routineIndex = 0;
   window._loadNextRoutineExercise();
   window.showToast(window.t('workoutLoaded', 'Workout geladen!'));
  };

  // === MUSCLE DISTRIBUTION CHART ===
  window._renderMuscleDistributionChart = function() {
   var container = document.getElementById('muscleDistChart');
   if (!container) return;
   var thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
   var kraftW = (window.workouts || []).filter(function(w) { return w.category === 'strength' && w.setDetails && w.archived && new Date(w.date) >= thirtyDaysAgo; });
   if (kraftW.length < 2) { container.innerHTML = '<p class="text-[10px] text-center py-4" style="color:#737373">' + window.t('needMoreData','Mindestens 2 Kraft-Workouts in 30 Tagen n\u00f6tig') + '</p>'; return; }
   var muscleSets = {};
   var exDb = window.exerciseDB || [];
   kraftW.forEach(function(w) {
    var ex = window._findExerciseInDB ? window._findExerciseInDB(w.exercise) : null;
    var bp = ex ? (ex.bp || 'other') : 'other';
    var sc = (w.setDetails || []).length;
    muscleSets[bp] = (muscleSets[bp] || 0) + sc;
   });
   var total = Object.values(muscleSets).reduce(function(a, b) { return a + b; }, 0) || 1;
   var sorted = Object.entries(muscleSets).sort(function(a, b) { return b[1] - a[1]; });
   var colors = { chest:'#e88a8a', back:'#8aafe8', shoulders:'#e8c86a', 'upper legs':'#a3c9a8', 'lower legs':'#7aab82', 'upper arms':'#c9a3c9', 'lower arms':'#a3a3c9', waist:'#c9c9a3', cardio:'#e8b88a' };
   var deLabels = { chest:'Brust', back:'R\u00fccken', shoulders:'Schultern', 'upper legs':'Oberschenkel', 'lower legs':'Unterschenkel', 'upper arms':'Oberarme', 'lower arms':'Unterarme', waist:'Core', cardio:'Cardio', other:'Sonstige' };
   var barsHtml = sorted.map(function(e) {
    var m = e[0], s = e[1], pct = Math.round(s / total * 100);
    var c = colors[m] || '#9898a2';
    var l = (window.currentLang === 'de' && deLabels[m]) ? deLabels[m] : m.charAt(0).toUpperCase() + m.slice(1);
    return '<div class="flex items-center gap-2 mb-1.5"><span class="text-[9px] font-bold w-20 text-right truncate" style="color:' + c + '">' + window._escapeHtml(l) + '</span><div style="flex:1;height:12px;background:#1a1c1a;border-radius:6px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + c + ';border-radius:6px;min-width:2px"></div></div><span class="text-[8px] font-bold w-8" style="color:' + c + '">' + pct + '%</span></div>';
   }).join('');
   container.innerHTML = '<div class="mb-2 flex items-center justify-between"><span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">' + window.t('muscleDistTitle','Muskelgruppen (30 Tage)') + '</span><span class="text-[8px]" style="color:#737373">' + total + ' Sets</span></div>' + barsHtml;
  };

  // ============================================================
  // EXERCISE SWAP
  // === HABIT TRACKING ===
  window._HABITS = [
   { id:'sleep', label:'Schlaf', icon:'\uD83D\uDE34', unit:'h', placeholder:'7.5' },
   { id:'water', label:'Wasser', icon:'\uD83D\uDCA7', unit:'L', placeholder:'2.5' },

   { id:'steps', label:'Schritte', icon:'\uD83D\uDC5F', unit:'', placeholder:'8000' },
   { id:'mood', label:'Stimmung', icon:'\uD83E\uDDE0', unit:'/5', placeholder:'4' }
  ];

  window._renderHabitTracker = function() {
   var container = document.getElementById('habitTrackerSection');
   if (!container) return;
   var today = new Date().toISOString().split('T')[0];
   var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
   var td = habits[today] || {};
   var html = '<div class="flex items-center justify-between mb-2 px-1"><span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">' + window.t('dailyHabits','T\u00e4gliche Habits') + '</span><span class="text-[8px]" style="color:#737373">' + today.slice(5) + '</span></div>';
   html += '<div class="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">';
   var allHabits = window._getAllHabits ? window._getAllHabits() : (window._HABITS || []);
   allHabits.forEach(function(h) {
    var val = td[h.id];
    var filled = val !== undefined && val !== null && val !== '';
    html += '<button onclick="window._editHabit(\'' + h.id + '\')" class="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer pointer-events-auto" style="background:' + (filled ? 'rgba(163,201,168,0.08)' : 'var(--inner-bg-hex)') + ';border:1px solid ' + (filled ? 'rgba(163,201,168,0.15)' : 'var(--border-hex)') + ';min-width:56px" aria-label="' + h.label + '">';
    html += '<span style="font-size:18px">' + h.icon + '</span>';
    if (filled) html += '<span class="text-[9px] font-bold" style="color:var(--primary-hex)">' + val + h.unit + '</span>';
    else html += '<span class="text-[7px]" style="color:#737373">' + h.label + '</span>';
    html += '</button>';
   });
   html += '</div>';
   container.innerHTML = html;
  };

  window._editHabit = function(habitId) {
   var allHabits = window._getAllHabits ? window._getAllHabits() : (window._HABITS || []);
   var h = allHabits.find(function(x) { return x.id === habitId; });
   if (!h) return;
   var today = new Date().toISOString().split('T')[0];
   var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
   var cur = (habits[today] || {})[habitId] || '';
   window.showInputModal(h.icon + ' ' + h.label + (h.unit ? ' (' + h.unit + ')' : ''), h.placeholder, function(val) {
    if (!val) return;
    var num = parseFloat(val);
    if (isNaN(num)) return;
    if (!habits[today]) habits[today] = {};
    habits[today][habitId] = num;
    localStorage.setItem('base_habits', JSON.stringify(habits));
    window._renderHabitTracker();
    window.showToast(h.icon + ' ' + num + (h.unit||''));
   }, String(cur));
  };

  // ============================================================
  // CUSTOM HABITS SYSTEM
  // ============================================================

  window._CUSTOM_HABITS_KEY = 'base_custom_habits';

  window._DEFAULT_HABIT_IDS = ['sleep','water','steps','mood'];

  window._getCustomHabits = function() {
    return JSON.parse(localStorage.getItem(window._CUSTOM_HABITS_KEY) || '[]');
  };

  window._saveCustomHabits = function(habits) {
    localStorage.setItem(window._CUSTOM_HABITS_KEY, JSON.stringify(habits));
  };

  window._addCustomHabit = function(habit) {
    var habits = window._getCustomHabits();
    habit.id = 'custom_' + Date.now();
    habit.isCustom = true;
    habit.createdAt = new Date().toISOString();
    habits.push(habit);
    window._saveCustomHabits(habits);
    window._refreshHabits();
    window.showToast('\u2705 Habit "' + window._escapeHtml(habit.label) + '" erstellt!');
    return habit;
  };

  window._deleteCustomHabit = function(id) {
    var habits = window._getCustomHabits().filter(function(h) { return h.id !== id; });
    window._saveCustomHabits(habits);
    window._refreshHabits();
  };

  window._getAllHabits = function() {
    var custom = window._getCustomHabits();
    return (window._HABITS || []).concat(custom);
  };

  window._refreshHabits = function() {
    if (window._renderHabitTracker) window._renderHabitTracker();
  };

  window.openCustomHabitForm = function() {
    window.toggleModal('customHabitModal');
  };

  window.saveCustomHabitForm = function() {
    var label = (document.getElementById('ch_label')||{}).value||'';
    var icon  = (document.getElementById('ch_icon')||{}).value||'\u2B50';
    var unit  = (document.getElementById('ch_unit')||{}).value||'';
    var type  = (document.getElementById('ch_type')||{}).value||'number';
    var goal  = (document.getElementById('ch_goal')||{}).value||'';

    if (!label.trim()) {
      window.showToast('Bitte einen Namen eingeben', 'error');
      return;
    }

    window._addCustomHabit({
      label:       label.trim(),
      icon:        icon,
      unit:        unit,
      type:        type,
      goal:        goal ? parseFloat(goal) : null,
      placeholder: goal || '0'
    });

    window.toggleModal('customHabitModal');
  };

  // ============================================================
  // KI MICRO-TASKS SYSTEM
  // ============================================================

  window._MICRO_TASKS_KEY = 'base_micro_tasks';

  window._getMicroTasks = function() {
    var raw = JSON.parse(localStorage.getItem(window._MICRO_TASKS_KEY) || '[]');
    var cutoff = Date.now() - 7 * 86400000;
    return raw.filter(function(t) { return new Date(t.createdAt).getTime() > cutoff; });
  };

  window._saveMicroTasks = function(tasks) {
    localStorage.setItem(window._MICRO_TASKS_KEY, JSON.stringify(tasks));
  };

  window._completeMicroTask = function(taskId) {
    var tasks = window._getMicroTasks();
    var task  = tasks.find(function(t) { return t.id === taskId; });
    if (!task || task.completed) return;

    task.completed   = true;
    task.completedAt = new Date().toISOString();
    window._saveMicroTasks(tasks);

    if (window.awardXP) window.awardXP('habit', task.xp || 50);

    window.showToast('\uD83C\uDFAF Aufgabe erledigt! +' + (task.xp||50) + ' XP', null, null, null, 3000);
    window._renderMicroTasks();
  };

  window._dismissMicroTask = function(taskId) {
    var tasks = window._getMicroTasks().filter(function(t) { return t.id !== taskId; });
    window._saveMicroTasks(tasks);
    window._renderMicroTasks();
  };

  window._generateMicroTasks = async function() {
    var allHabits  = window._getAllHabits();
    var habits     = JSON.parse(localStorage.getItem('base_habits') || '{}');

    var habitHistory = {};
    allHabits.forEach(function(h) {
      var values = [];
      for (var i = 0; i < 7; i++) {
        var d = new Date(Date.now() - i*86400000).toISOString().split('T')[0];
        if (habits[d] && habits[d][h.id] !== undefined) {
          values.push({ date: d, value: habits[d][h.id] });
        }
      }
      if (values.length > 0) habitHistory[h.id] = {
        label:  h.label,
        unit:   h.unit || '',
        goal:   h.goal || null,
        values: values
      };
    });

    if (Object.keys(habitHistory).length === 0) {
      window.showToast('Tracke erst ein paar Habits f\u00fcr KI-Aufgaben', 'warn');
      return;
    }

    var profile  = window._getNutritionProfile ? window._getNutritionProfile() : {};
    var archived = (window.workouts||[]).filter(function(w) { return w.archived; });
    var weekWorkouts = archived.filter(function(w) {
      return w.date && w.date >= new Date(Date.now()-7*86400000).toISOString().split('T')[0];
    });

    var prompt =
      'Du bist ein pers\u00f6nlicher Fitness-Coach. ' +
      'Analysiere diese Habit-Daten und erstelle 3 konkrete, kleine Aufgaben f\u00fcr heute.\n\n' +
      'HABIT-VERLAUF (letzte 7 Tage):\n' +
      JSON.stringify(habitHistory, null, 2) + '\n\n' +
      'TRAININGS DIESE WOCHE: ' + weekWorkouts.length + '\n' +
      'ZIEL: ' + (profile.goal||'nicht angegeben') + '\n\n' +
      'REGELN f\u00fcr die Aufgaben:\n' +
      '- Jede Aufgabe ist heute in 5-30 Minuten umsetzbar\n' +
      '- Basiert direkt auf einem Habit-Defizit oder -Muster\n' +
      '- Konkret und messbar ("Trinke 2 Gl\u00e4ser Wasser jetzt")\n' +
      '- Nicht allgemein ("Sei ges\u00fcnder")\n' +
      '- XP zwischen 25-100 je nach Schwierigkeit\n\n' +
      'Antworte NUR als JSON Array, kein Markdown:\n' +
      '[\n  {\n    "title": "Kurzer Aufgabentitel",\n' +
      '    "description": "Genau was zu tun ist",\n' +
      '    "habitId": "schlaf|wasser|schritte|stimmung|custom_id",\n' +
      '    "xp": 50,\n    "icon": "emoji",\n' +
      '    "difficulty": "easy|medium|hard"\n  }\n]\n\n' +
      'Nur JSON. Kein Text davor oder danach.';

    var btn = document.getElementById('generateMicroTasksBtn');
    if (btn) { btn.style.opacity='0.6'; btn.textContent='\u23F3 Analysiere...'; }

    try {
      var res = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt, type: 'micro_tasks' })
      });
      var data = await res.json();
      var text = window._extractGeminiText(data, '[]');

      var clean = text.replace(/```json|```/g,'').trim();
      var newTasks = JSON.parse(clean);

      var existing = window._getMicroTasks();
      var today2 = new Date().toISOString().split('T')[0];

      newTasks.forEach(function(t) {
        t.id        = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2,4);
        t.createdAt = new Date().toISOString();
        t.completed = false;
        t.date      = today2;
      });

      var open = existing.filter(function(t) { return !t.completed; });
      if (open.length >= 5) {
        window.showToast('Erst bestehende Aufgaben erledigen!', 'warn');
        return;
      }

      existing = existing.concat(newTasks);
      window._saveMicroTasks(existing);
      window._renderMicroTasks();
      window.showToast('\uD83C\uDFAF ' + newTasks.length + ' neue Aufgaben erstellt!');

    } catch(e) {
      console.warn('[MicroTasks]', e);
      window.showToast('Fehler beim Generieren', 'error');
    } finally {
      if (btn) { btn.style.opacity='1'; btn.textContent='\u2728 KI-Aufgaben generieren'; }
    }
  };

  window._renderMicroTasks = function(containerId) {
    var container = document.getElementById(containerId || 'microTasksContainer');
    if (!container) return;

    var tasks = window._getMicroTasks();
    var open  = tasks.filter(function(t) { return !t.completed; });
    var done  = tasks.filter(function(t) { return t.completed; });

    if (open.length === 0 && done.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:16px">' +
        '<p style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:6px">Keine Aufgaben</p>' +
        '<p style="font-size:11px;color:var(--text-muted);margin-bottom:12px">Lass die KI Aufgaben aus deinen Habits erstellen</p>' +
        '<button id="generateMicroTasksBtn" onclick="window._generateMicroTasks()" class="pointer-events-auto" aria-label="KI-Aufgaben generieren" style="padding:9px 20px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex)">\u2728 KI-Aufgaben generieren</button>' +
        '</div>';
      return;
    }

    var diffColor = {
      easy:   { bg:'rgba(163,201,168,0.1)', c:'#a3c9a8' },
      medium: { bg:'rgba(232,200,106,0.1)', c:'#e8c86a' },
      hard:   { bg:'rgba(138,175,232,0.1)', c:'#8aafe8' }
    };
    var diffLabel = { easy:'Leicht', medium:'Mittel', hard:'Schwer' };

    var html = '';

    if (open.length > 0) {
      html += open.map(function(t) {
        var dc = diffColor[t.difficulty] || diffColor.easy;
        return '<div style="padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;margin-bottom:6px">' +
          '<div style="display:flex;align-items:flex-start;gap:10px">' +
          '<button onclick="window._completeMicroTask(\'' + t.id + '\')" class="pointer-events-auto" aria-label="Aufgabe erledigen" style="width:26px;height:26px;border-radius:7px;flex-shrink:0;margin-top:1px;background:transparent;border:1.5px solid var(--border-hex);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s" onmouseover="this.style.borderColor=\'var(--primary-hex)\'" onmouseout="this.style.borderColor=\'var(--border-hex)\'"></button>' +
          '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">' +
          '<span style="font-size:16px">' + (t.icon||'\uD83C\uDFAF') + '</span>' +
          '<p style="font-size:13px;font-weight:600;color:var(--text-main)">' + window._escapeHtml(t.title||'') + '</p>' +
          '</div>' +
          '<p style="font-size:11px;color:var(--text-muted);margin-bottom:7px;line-height:1.5">' + window._escapeHtml(t.description||'') + '</p>' +
          '<div style="display:flex;align-items:center;gap:6px">' +
          '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:6px;background:' + dc.bg + ';color:' + dc.c + '">' + (diffLabel[t.difficulty]||'Leicht') + '</span>' +
          '<span style="font-size:10px;font-weight:600;color:var(--primary-hex)">+' + (t.xp||50) + ' XP</span>' +
          '</div></div>' +
          '<button onclick="window._dismissMicroTask(\'' + t.id + '\')" class="pointer-events-auto" aria-label="Aufgabe entfernen" style="color:var(--text-muted);background:none;border:none;font-size:16px;cursor:pointer;flex-shrink:0">\u00d7</button>' +
          '</div></div>';
      }).join('');
    }

    if (done.length > 0) {
      html += '<p style="font-size:10px;color:var(--text-muted);margin:10px 0 6px;font-weight:600">\u2713 Erledigt heute</p>' +
        done.slice(0,3).map(function(t) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;opacity:0.5">' +
            '<span style="font-size:12px;color:var(--primary-hex)">\u2713</span>' +
            '<span style="font-size:11px;color:var(--text-muted);text-decoration:line-through">' + window._escapeHtml(t.title||'') + '</span>' +
            '<span style="font-size:10px;color:var(--primary-hex);margin-left:auto">+' + (t.xp||50) + ' XP</span>' +
            '</div>';
        }).join('');
    }

    html += '<button id="generateMicroTasksBtn" onclick="window._generateMicroTasks()" class="pointer-events-auto w-full" aria-label="KI-Aufgaben generieren" style="margin-top:10px;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\u2728 KI-Aufgaben generieren</button>';

    container.innerHTML = html;
  };

  // ============================================================
  // IN-APP FAQ SYSTEM
  // ============================================================

  window._FAQ_DATA = {
    athlete: [
      { category:'Training', icon:'\uD83C\uDFCB', items:[
        { q:'Wie starte ich ein Training?', a:'Tippe auf "Training" \u2192 dann auf die Kategorie (Kraft, Cardio, etc.). Gib deine \u00dcbung ein und trage Sets, Wiederholungen und Gewicht ein. Zum Beenden auf "Speichern" tippen.' },
        { q:'Was ist RIR?', a:'RIR = Reps in Reserve. 0 = du h\u00e4ttest nicht eine Wiederholung mehr geschafft. 3 = du h\u00e4ttest noch 3 Wiederholungen k\u00f6nnen. Niedrigeres RIR = h\u00f6here Intensit\u00e4t. Ideal f\u00fcr Progression-Tracking.' },
        { q:'Wie funktionieren Routinen?', a:'Nach dem Training kannst du es als Routine speichern. Beim n\u00e4chsten Mal l\u00e4dst du die Routine \u2014 alle \u00dcbungen, Sets und Gewichte sind vorausgef\u00fcllt.' },
        { q:'Was ist ein Superset?', a:'Zwei \u00dcbungen ohne Pause hintereinander. Tippe auf den "Superset" Button neben einer \u00dcbung um sie mit der n\u00e4chsten zu verkn\u00fcpfen.' },
        { q:'Wie tracke ich Cardio oder eine Sportart?', a:'Training \u2192 Ausdauer f\u00fcr Cardio, oder "Mein Sport" f\u00fcr Sportarten wie Fu\u00dfball, Volleyball etc. Jede Sportart hat eigene Felder.' },
        { q:'Was bedeutet der Voice Coach?', a:'Der Voice Coach gibt dir nach dem Training Sprachfeedback. Du kannst zwischen 4 Pers\u00f6nlichkeiten w\u00e4hlen: Motivator, Ruhig, Drill Sergeant und Comedy.' }
      ]},
      { category:'KI Tools', icon:'\u2728', items:[
        { q:'Was ist der KI Coach?', a:'Der Coach kennt dein komplettes Profil: Workouts, Habits, Ern\u00e4hrung, Verletzungen, Mesozyklus-Phase und mehr. Stell ihm jede Trainingsfrage \u2014 er antwortet personalisiert.' },
        { q:'Was macht der Scan?', a:'Scan analysiert deine Trainingshistorie und zeigt dir Progressions-Trends, Plateaus und konkrete Empfehlungen zur Verbesserung.' },
        { q:'Was ist Battery / Readiness?', a:'Battery zeigt deinen aktuellen ZNS-Erholungsstatus in Prozent. 100% = voll erholt. Wird berechnet aus Trainingsvolumen, Intensit\u00e4t, RIR-Trends und Habits.' },
        { q:'Was ist Armor?', a:'Armor = Pre-Hab. Gibt dir Aktivierungs- und Pr\u00e4ventions\u00fcbungen basierend auf deinen Verletzungen und dem letzten Training.' },
        { q:'Was ist der Planner?', a:'Der KI-Planner erstellt einen kompletten Mesozyklus (Trainingsplan \u00fcber mehrere Wochen) basierend auf deinem Ziel, deiner Erfahrung und verf\u00fcgbaren Tagen.' },
        { q:'Was ist der Spotter?', a:'Der Spotter (Co-Pilot) gibt dir w\u00e4hrend des Trainings Live-Empfehlungen f\u00fcr die aktuelle \u00dcbung \u2014 Sets, Gewicht, RIR basierend auf deiner History.' }
      ]},
      { category:'Ern\u00e4hrung', icon:'\uD83E\uDD57', items:[
        { q:'Wie richte ich mein Ern\u00e4hrungs-Profil ein?', a:'Ern\u00e4hrung \u2192 \u2699 Ziele. Trage Gewicht, Gr\u00f6\u00dfe, Alter und Ziel ein. BASE berechnet automatisch deine Kalorien- und Protein-Ziele nach ISSN-Wissenschaft.' },
        { q:'Wie logge ich Mahlzeiten?', a:'Ern\u00e4hrung \u2192 auf einen Mahlzeit-Slot tippen \u2192 "+" \u2192 Lebensmittel suchen oder Barcode scannen. N\u00e4hrwerte werden automatisch berechnet.' },
        { q:'Wie erstelle ich ein eigenes Lebensmittel?', a:'Im Food Search Modal \u2192 "Neu" Tab \u2192 Name, N\u00e4hrwerte und Portionsgr\u00f6\u00dfe eingeben. Das Lebensmittel ist danach dauerhaft in deiner Liste.' },
        { q:'Was sind die Supplement-Erinnerungen?', a:'Ern\u00e4hrung \u2192 \uD83D\uDC8A Supplemente \u2192 dein Supplement antippen \u2192 Optionen \u2192 Zeit einstellen. BASE sendet t\u00e4glich eine Push-Benachrichtigung.' },
        { q:'Was ist der Meal Prep Planer?', a:'Ern\u00e4hrung \u2192 \uD83E\uDD66 Meal Prep. Die KI erstellt basierend auf deiner Trainingswoche einen Sonntags-Prep-Plan mit Einkaufsliste.' },
        { q:'Was ist das Nutrient Timing Widget?', a:'Zeigt dir basierend auf der aktuellen Uhrzeit welche Mahlzeit als n\u00e4chste empfohlen wird \u2014 inklusive "JETZT" Markierung f\u00fcr das optimale Zeitfenster.' }
      ]},
      { category:'Analyse & Gamification', icon:'\uD83D\uDCCA', items:[
        { q:'Was ist ACWR?', a:'ACWR = Acute:Chronic Workload Ratio. Vergleicht deine Trainingsbelastung der letzten 7 Tage mit den letzten 28 Tagen. Sweet Spot: 0.8-1.3. \u00dcber 1.5 = erh\u00f6htes Verletzungsrisiko.' },
        { q:'Was sind Volume Landmarks?', a:'MEV (Minimum Effective Volume), MAV (Maximum Adaptive Volume), MRV (Maximum Recoverable Volume) \u2014 wissenschaftliche Grenzwerte f\u00fcr optimales Trainingsvolumen pro Muskelgruppe.' },
        { q:'Wie funktioniert das XP und Level System?', a:'XP gibt es f\u00fcr Workouts, Coach-Chats, Pl\u00e4ne, Challenges, Habits und Ziele. Mit mehr XP steigst du von Rookie \u00fcber Contender, Veteran, Elite bis zu Legend auf.' },
        { q:'Was sind Challenges?', a:'Challenges sind Wettbewerbe die du erstellen oder joinen kannst \u2014 z.B. "Meiste Kniebeugen diese Woche". Mit Leaderboard und XP-Belohnung.' },
        { q:'Was zeigt das Muskel-Ranking?', a:'Analyse \u2192 Muskeln. Zeigt dir welche Muskelgruppen du h\u00e4ufig trainierst (Bronze \u2192 Diamond) und warnt bei Dysbalancen zwischen Antagonisten.' }
      ]},
      { category:'Account & Einstellungen', icon:'\u2699\uFE0F', items:[
        { q:'Wie \u00e4ndere ich mein Athleten-Profil?', a:'Men\u00fc \u2192 Athleten Profil. Dort kannst du Alter, Gewicht, Verletzungen, Erfahrungslevel und Ziel \u00e4ndern. Das Profil flie\u00dft direkt in alle KI-Empfehlungen ein.' },
        { q:'Wie aktiviere ich PRO?', a:'Wenn du einen Creator Code oder Beta-Code hast: Gib ihn beim Registrieren ein oder \u00f6ffne base-app.tech?ref=DEIN_CODE. PRO schaltet unbegrenzte KI-Nutzung frei.' },
        { q:'Sind meine Daten sicher?', a:'Ja. Deine Daten werden verschl\u00fcsselt in Firebase gespeichert und nur du hast Zugriff. Daten werden nie an Dritte verkauft.' },
        { q:'Wie verbinde ich Strava?', a:'Men\u00fc \u2192 Athleten Profil \u2192 Strava verbinden. Nach der OAuth-Verbindung werden alle deine Strava-Aktivit\u00e4ten automatisch importiert.' }
      ]}
    ],
    pt: [
      { category:'Erste Schritte', icon:'\uD83D\uDE80', items:[
        { q:'Wie wechsle ich in den PT Mode?', a:'Men\u00fc \u2192 unten auf "Personal Trainer" tippen. Das Design wechselt zu Carbon Elite (goldene Akzente). Zur\u00fcck zu Athlet-Mode: wieder Men\u00fc \u2192 "Athlete Mode".' },
        { q:'Wie lege ich meinen ersten Kunden an?', a:'PT Dashboard \u2192 "+ Neu" Button. Name und Ziel eintragen \u2014 das reicht f\u00fcr den Anfang. Gewicht, Trainingsfrequenz und Details kannst du sp\u00e4ter erg\u00e4nzen.' },
        { q:'Was sieht mein Kunde?', a:'Jeder Kunde bekommt ein eigenes Client-Portal. Dort sieht er seinen Trainingsplan, Check-In History und Fortschritts-Charts. Kein eigener BASE-Account n\u00f6tig.' },
        { q:'Wie starte ich das Onboarding nochmal?', a:'Men\u00fc \u2192 Hilfe \u2192 PT Onboarding neu starten. Oder in der FAQ unten auf "\uD83D\uDD04 PT Onboarding neu starten" tippen.' }
      ]},
      { category:'Client Management', icon:'\uD83D\uDC65', items:[
        { q:'Wie logge ich eine Session f\u00fcr einen Kunden?', a:'PT Dashboard \u2192 Kunden-Karte antippen \u2192 "Session loggen". Datum, \u00dcbungen und Notizen eintragen. Die Session erscheint im Client-Portal.' },
        { q:'Was ist ein Check-In?', a:'Check-Ins sind w\u00f6chentliche Status-Updates eines Kunden: Gewicht, Schlaf, Stimmung, Energie, Ern\u00e4hrungs-Compliance. Du siehst alle Check-Ins im Client-Dashboard.' },
        { q:'Wie sehe ich den Fortschritt eines Kunden?', a:'Kunden-Detail \u00f6ffnen \u2192 Progress Charts Tab. Zeigt Gewichtsverlauf, Session-H\u00e4ufigkeit und Compliance-Rings \u00fcber Zeit.' },
        { q:'Wie l\u00f6sche ich einen Kunden?', a:'Kunden-Detail \u2192 ganz unten \u2192 "Kunden l\u00f6schen". Achtung: Alle Daten dieses Kunden werden dauerhaft gel\u00f6scht.' }
      ]},
      { category:'Trainingspl\u00e4ne', icon:'\uD83D\uDCC5', items:[
        { q:'Wie erstelle ich einen KI-Plan f\u00fcr einen Kunden?', a:'Kunden-Detail \u2192 "KI-Plan erstellen". Die KI nutzt automatisch das Profil des Kunden (Ziel, Gewicht, Erfahrung) um einen Mesozyklus-Plan zu erstellen.' },
        { q:'Kann ich den Plan anpassen?', a:'Ja. Nach der Generierung kannst du einzelne \u00dcbungen, Sets und Gewichte manuell \u00e4ndern. Der Plan wird im Client-Portal sofort aktualisiert.' },
        { q:'Wie schicke ich den Plan an den Kunden?', a:'Plan erstellen \u2192 "An Client senden". Der Plan erscheint im Client-Portal und kann auch als Text kopiert werden (f\u00fcr WhatsApp etc.).' }
      ]},
      { category:'Ern\u00e4hrungs-Coach', icon:'\uD83E\uDD57', items:[
        { q:'Wie nutze ich den PT Ern\u00e4hrungs-Coach?', a:'KI Tools \u2192 Ern\u00e4hrungs-Coach. Du kannst allgemeine Fragen stellen oder einen Kunden ausw\u00e4hlen \u2014 dann kennt die KI automatisch das Profil des Kunden.' },
        { q:'Wie erstelle ich einen Ern\u00e4hrungsplan f\u00fcr einen Kunden?', a:'Im PT Ern\u00e4hrungs-Chat \u2192 "Ern\u00e4hrungsplan" Button. Die KI erstellt einen 7-Tage Plan basierend auf Kunden-Gewicht, Ziel und Allergien.' },
        { q:'Kann der Kunde seine eigene Ern\u00e4hrung tracken?', a:'Ja \u2014 wenn der Kunde selbst BASE nutzt und sein Profil \u00f6ffentlich hat, siehst du seine Ern\u00e4hrungsdaten im Client-Dashboard.' }
      ]},
      { category:'Revenue & Abrechnung', icon:'\uD83D\uDCB6', items:[
        { q:'Wie stelle ich mein monatliches Honorar ein?', a:'PT Dashboard \u2192 Revenue-Karte \u2192 Betrag direkt antippen und eingeben. BASE berechnet automatisch deinen Gesamtumsatz \u00fcber alle Kunden.' },
        { q:'Wie erstelle ich eine Rechnung mit LexOffice?', a:'PT Dashboard \u2192 Rechnungen \u2192 LexOffice verbinden (einmalig API-Key eingeben). Danach kannst du mit einem Klick Rechnungen f\u00fcr Kunden erstellen.' },
        { q:'Was sind Creator Codes?', a:'Creator Codes sind pers\u00f6nliche Empfehlungs-Links. Wenn jemand \u00fcber deinen Code BASE installiert, verl\u00e4ngerst du deinen PRO-Zugang. Codes verwaltest du im Creator-Bereich des PT Dashboards.' }
      ]}
    ]
  };

  window._renderFAQ = function(mode, searchQuery) {
    var container = document.getElementById('faqContainer');
    if (!container) return;
    var data = window._FAQ_DATA[mode || 'athlete'] || [];
    var query = (searchQuery || '').toLowerCase().trim();
    var html = '';

    data.forEach(function(cat) {
      var items = cat.items;
      if (query) {
        items = items.filter(function(item) {
          return item.q.toLowerCase().indexOf(query) !== -1 || item.a.toLowerCase().indexOf(query) !== -1;
        });
      }
      if (items.length === 0) return;

      html += '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin:14px 0 8px;display:flex;align-items:center;gap:6px"><span style="font-size:14px">' + cat.icon + '</span>' + window._escapeHtml(cat.category) + '</p>';

      items.forEach(function(item) {
        var id = 'faq_' + Math.random().toString(36).substr(2, 6);
        html += '<div style="background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:11px;margin-bottom:6px;overflow:hidden">' +
          '<button onclick="var a=document.getElementById(\'' + id + '\');a.style.display=a.style.display===\'none\'?\'block\':\'none\';this.querySelector(\'.faq-arrow\').textContent=a.style.display===\'none\'?\'\u203a\':\'\u2039\'" class="pointer-events-auto w-full" aria-label="FAQ" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:transparent;border:none;cursor:pointer;text-align:left">' +
          '<span style="font-size:13px;font-weight:600;color:var(--text-main);flex:1;padding-right:10px">' + window._escapeHtml(item.q) + '</span>' +
          '<span class="faq-arrow" style="color:var(--primary-hex);font-size:18px;flex-shrink:0">\u203a</span>' +
          '</button>' +
          '<div id="' + id + '" style="display:none;padding:0 14px 12px">' +
          '<p style="font-size:12px;color:var(--text-muted);line-height:1.7;border-top:1px solid var(--border-hex);padding-top:10px">' + window._escapeHtml(item.a) + '</p>' +
          '</div></div>';
      });
    });

    if (!html) {
      html = '<div style="text-align:center;padding:24px"><p style="font-size:13px;color:var(--text-muted)">Keine Ergebnisse f\u00fcr "' + window._escapeHtml(query) + '"</p></div>';
    }
    container.innerHTML = html;
  };

  window.openFAQ = function(mode, category) {
    window._faqCurrentMode = mode || (window._isPTMode ? 'pt' : 'athlete');
    window.toggleModal('faqModal');
    setTimeout(function() {
      window._renderFAQ(window._faqCurrentMode);
      var athleteBtn = document.getElementById('faqModeAthlete');
      var ptBtn = document.getElementById('faqModePT');
      if (window._faqCurrentMode === 'pt') {
        if (ptBtn) { ptBtn.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 88%)'; ptBtn.style.color = 'var(--primary-hex)'; }
        if (athleteBtn) { athleteBtn.style.background = 'transparent'; athleteBtn.style.color = 'var(--text-muted)'; }
      } else {
        if (athleteBtn) { athleteBtn.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 88%)'; athleteBtn.style.color = 'var(--primary-hex)'; }
        if (ptBtn) { ptBtn.style.background = 'transparent'; ptBtn.style.color = 'var(--text-muted)'; }
      }
      if (category) {
        setTimeout(function() {
          var headings = document.querySelectorAll('#faqContainer p');
          headings.forEach(function(h) { if (h.textContent.toLowerCase().indexOf(category.toLowerCase()) !== -1) h.scrollIntoView({ behavior:'smooth' }); });
        }, 200);
      }
    }, 100);
  };

  window._switchFAQMode = function(mode, btn) {
    window._faqCurrentMode = mode;
    document.querySelectorAll('[id^="faqMode"]').forEach(function(b) {
      b.style.background = 'transparent'; b.style.color = 'var(--text-muted)'; b.style.borderColor = 'var(--border-hex)';
    });
    if (btn) { btn.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 88%)'; btn.style.color = 'var(--primary-hex)'; btn.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 65%)'; }
    var searchInput = document.getElementById('faqSearch');
    window._renderFAQ(mode, searchInput ? searchInput.value : '');
  };

  var _faqSearchTimeout = null;
  window._debounceFAQSearch = function(query) {
    clearTimeout(_faqSearchTimeout);
    _faqSearchTimeout = setTimeout(function() { window._renderFAQ(window._faqCurrentMode || 'athlete', query); }, 250);
  };

  // === PROGRESS PHOTOS ===
  window._addProgressPhoto = function(clientId) {
   var input = document.createElement('input');
   input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
   input.className = 'pointer-events-auto';
   input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
     var img = new Image();
     img.onload = function() {
      var canvas = document.createElement('canvas');
      var s = Math.min(1, 800 / img.width);
      canvas.width = img.width * s; canvas.height = img.height * s;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      var compressed = canvas.toDataURL('image/jpeg', 0.7);
      window._saveProgressPhoto(clientId, compressed);
     };
     img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
   };
   input.click();
  };

  window._saveProgressPhoto = function(clientId, dataUrl) {
   var key = clientId ? 'base_progress_photos_' + clientId : 'base_progress_photos';
   var photos = JSON.parse(localStorage.getItem(key) || '[]');
   photos.push({ id: 'p_' + Date.now(), date: new Date().toISOString().split('T')[0], data: dataUrl });
   if (photos.length > 20) photos = photos.slice(-20);
   localStorage.setItem(key, JSON.stringify(photos));
   if (window._syncAppData && !clientId) window._syncAppData('base_progress_photos', photos);
   window.showToast(window.t('photoSaved', 'Foto gespeichert!'));
   if (window._renderProgressPhotos) window._renderProgressPhotos(clientId);
  };

  window._renderProgressPhotos = function(clientId) {
   var key = clientId ? 'base_progress_photos_' + clientId : 'base_progress_photos';
   var containerId = clientId ? 'clientPhotos_' + clientId : 'progressPhotosSection';
   var container = document.getElementById(containerId);
   if (!container) return;
   var photos = JSON.parse(localStorage.getItem(key) || '[]');
   if (photos.length === 0) {
    container.innerHTML = '<button onclick="window._addProgressPhoto(\'' + (clientId || '') + '\')" class="w-full py-4 rounded-xl text-center cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);border:1px dashed var(--border-hex)" aria-label="Foto aufnehmen"><span style="font-size:24px">\uD83D\uDCF8</span><br><span class="text-[10px] font-bold" style="color:#9898a2">' + window.t('firstPhoto','Erstes Progress-Foto aufnehmen') + '</span></button>';
    return;
   }
   var html = '<div class="flex items-center justify-between mb-2"><span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Progress Fotos</span><button onclick="window._addProgressPhoto(\'' + (clientId || '') + '\')" class="text-[9px] font-bold cursor-pointer pointer-events-auto" style="color:var(--primary-hex)" aria-label="Neues Foto">+ Neu</button></div>';
   html += '<div class="flex gap-2 overflow-x-auto pb-2 hide-scrollbar" style="-webkit-overflow-scrolling:touch">';
   photos.slice().reverse().forEach(function(p) {
    html += '<div class="flex-shrink-0 relative" style="width:90px"><img src="' + p.data + '" class="w-full h-24 object-cover rounded-xl" loading="lazy" alt="Progress"><div class="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[7px] font-bold" style="background:rgba(0,0,0,0.7);color:#fff">' + p.date.slice(5) + '</div></div>';
   });
   html += '</div>';
   if (photos.length >= 2) {
    var first = photos[0], last = photos[photos.length - 1];
    var dd = Math.round((new Date(last.date) - new Date(first.date)) / 86400000);
    html += '<div class="mt-2 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="text-[9px] font-bold text-center mb-2" style="color:var(--primary-hex)">Vorher / Nachher \u00b7 ' + dd + ' Tage</div><div class="flex gap-2"><div class="flex-1 text-center"><img src="' + first.data + '" class="w-full h-32 object-cover rounded-lg" alt="Vorher"><span class="text-[7px]" style="color:#737373">' + first.date + '</span></div><div class="flex-1 text-center"><img src="' + last.data + '" class="w-full h-32 object-cover rounded-lg" alt="Nachher"><span class="text-[7px]" style="color:#737373">' + last.date + '</span></div></div></div>';
   }
   container.innerHTML = html;
  };

  // === PR TIMELINE CHART ===
  window._renderPRTimeline = function() {
   var container = document.getElementById('prTimelineChart'); if (!container) return;
   var kw = (window.workouts || []).filter(function(w) { return w.category === 'strength' && w.setDetails && w.archived; });
   var ec = {}; kw.forEach(function(w) { ec[w.exercise] = (ec[w.exercise] || 0) + 1; });
   var top5 = Object.entries(ec).sort(function(a,b) { return b[1]-a[1]; }).slice(0,5).map(function(e) { return e[0]; });
   if (top5.length === 0) { container.innerHTML = ''; return; }
   var colors = ['#a3c9a8','#e88a8a','#8aafe8','#e8c86a','#c9a3c9'];
   var html = '<div class="mb-2"><span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">PR Verlauf</span></div>';
   top5.forEach(function(ex, idx) {
    var exW = kw.filter(function(w) { return w.exercise === ex; }).sort(function(a,b) { return new Date(a.date)-new Date(b.date); });
    var mw = exW.map(function(w) { return Math.max.apply(null, (w.setDetails||[]).map(function(s) { return parseFloat(s.weight)||0; }).concat([0])); });
    if (mw.length < 2) return;
    var first = mw[0], last = mw[mw.length-1], diff = last - first;
    var dc = diff > 0 ? '#a3c9a8' : diff < 0 ? '#e88a8a' : '#9898a2';
    var maxV = Math.max.apply(null, mw)||1, minV = Math.min.apply(null, mw)||0, range = maxV-minV||1;
    var sw = 120, sh = 20;
    var pts = mw.map(function(m, i) { return (i/(mw.length-1))*sw + ',' + (sh-((m-minV)/range)*sh); }).join(' ');
    html += '<div class="flex items-center gap-3 py-1.5" style="border-bottom:1px solid var(--border-hex)"><div class="w-2 h-2 rounded-full flex-shrink-0" style="background:'+colors[idx]+'"></div><span class="text-[9px] font-bold text-white truncate" style="width:80px">'+window._escapeHtml(ex)+'</span><svg width="'+sw+'" height="'+sh+'" class="flex-shrink-0"><polyline points="'+pts+'" fill="none" stroke="'+colors[idx]+'" stroke-width="1.5"/></svg><span class="text-[9px] font-black" style="color:'+dc+'">'+(diff>0?'\u2191+':diff<0?'\u2193':'\u2192')+Math.abs(diff).toFixed(1)+'kg</span></div>';
   });
   container.innerHTML = html;
  };

  // === WEEKLY CONSISTENCY XP ===
  window._checkWeeklyConsistencyXP = function() {
   var now = new Date(); var ws = new Date(now); ws.setDate(ws.getDate()-ws.getDay()+1);
   var wk = ws.toISOString().split('T')[0];
   if (localStorage.getItem('base_consistency_week') === wk) return;
   var lws = new Date(ws); lws.setDate(lws.getDate()-7);
   var allW = (window.workouts||[]).filter(function(w) { var d = new Date(w.date); return d >= lws && d < ws; });
   localStorage.setItem('base_consistency_week', wk);
   if (allW.length >= 3) {
    if (window.awardXP) window.awardXP('weeklyConsistency');
    window.showToast('\uD83D\uDD25 +100 XP f\u00fcr 3+ Workouts letzte Woche!');
   }
  };

  // === MILESTONES ===
  window._checkMilestones = function() {
   var allW = (window.workouts||[]).filter(function(w) { return w.archived; });
   var count = allW.length;
   var ms = [5,10,25,50,100,200,500];
   var reached = JSON.parse(localStorage.getItem('base_milestones_reached') || '[]');
   var msgs = {5:'5 Workouts! \uD83C\uDFAF',10:'10 Workouts! Gewohnheit! \uD83D\uDCAA',25:'25 Workouts! \uD83C\uDFC5',50:'50 Workouts! \uD83E\uDD47',100:'100 WORKOUTS! CENTURION! \uD83D\uDC51',200:'200 Workouts! Maschine! \uD83E\uDD16',500:'500 Workouts! LEGENDE! \uD83C\uDFC6'};
   ms.forEach(function(m) {
    if (count >= m && reached.indexOf(m) === -1) {
     reached.push(m); localStorage.setItem('base_milestones_reached', JSON.stringify(reached));
     setTimeout(function() { window.showToast(msgs[m] || '\uD83C\uDF89 ' + m + ' Workouts!', null, null, null, 4000); }, 1500);
     if (window.awardXP) window.awardXP('milestone');
    }
   });
  };

  // === READINESS V2 ===
  window._calculateReadinessV2 = function() {
   var kw = (window.workouts||[]).filter(function(w) { return w.category === 'strength' && w.setDetails && w.archived; });
   var now = new Date(); var score = 100;
   // 1RM-Sch\u00e4tzungen f\u00fcr relative Intensit\u00e4t
   var estimated1RMs = {};
   kw.forEach(function(w) {
    (w.setDetails||[]).forEach(function(s) {
     var reps = parseFloat(s.reps)||0; var weight = parseFloat(s.weight)||0;
     if (reps > 0 && weight > 0 && reps <= 12) {
      var est1RM = weight * (1 + reps / 30);
      if (!estimated1RMs[w.exercise] || est1RM > estimated1RMs[w.exercise]) estimated1RMs[w.exercise] = est1RM;
     }
    });
   });
   var last7 = kw.filter(function(w) { return (now - new Date(w.date)) / 86400000 <= 7; });
   last7.forEach(function(w) {
    var daysAgo = Math.max(1, Math.floor((now - new Date(w.date)) / 86400000));
    var recencyFactor = 1 / daysAgo;
    var sets = (w.setDetails||[]).filter(function(s) { return s.type !== 'warmup'; });
    var setCount = sets.length;
    var maxW = Math.max.apply(null, sets.map(function(s){return parseFloat(s.weight)||0;}).concat([0]));
    // Relative Intensit\u00e4t basierend auf per-workout 1RM Sch\u00e4tzung
    var estimated1RM = 0;
    if (w.setDetails && w.setDetails.length > 0) {
      var _mxW = 0, _mxR = 1;
      w.setDetails.forEach(function(s) {
        var _sw = parseFloat(s.weight) || 0;
        var _sr = parseInt(s.reps) || 1;
        if (_sw > _mxW) { _mxW = _sw; _mxR = _sr; }
      });
      estimated1RM = _mxW > 0 ? _mxW * (1 + _mxR / 30) : 0;
    }
    var relIntensity = estimated1RM > 0 ? Math.min(1, (w.maxWeight || 0) / estimated1RM) : 0.5;
    var intensityMult = relIntensity > 0.85 ? 1.5 : relIntensity > 0.70 ? 1.2 : relIntensity > 0.55 ? 1.0 : 0.8;
    if (setCount >= 6) intensityMult *= 1.2;
    else if (setCount >= 4) intensityMult *= 1.1;
    // RIR-Staffelung
    var rirsV = sets.filter(function(s){return s.rir!=null && !isNaN(parseFloat(s.rir));});
    var avgRir = 3;
    if (rirsV.length > 0) avgRir = rirsV.reduce(function(a,s){return a+parseFloat(s.rir);},0)/rirsV.length;
    var rirMult = avgRir <= 1 ? 1.4 : avgRir <= 2 ? 1.2 : avgRir <= 3 ? 1.0 : avgRir <= 4 ? 0.85 : 0.7;
    score -= (setCount * 1.5 * intensityMult * rirMult * recencyFactor);
   });
   // Strava/Cardio HR-basierte Fatigue
   var allRecent = (window.workouts||[]).filter(function(w) { return w.archived && (now - new Date(w.date)) / 86400000 <= 7; });
   allRecent.forEach(function(w) {
    if (w.maxHeartrate && w.maxHeartrate > 0) {
     var hrFatigue = 0;
     if (w.maxHeartrate >= 180) hrFatigue = 8;
     else if (w.maxHeartrate >= 165) hrFatigue = 5;
     else if (w.maxHeartrate >= 150) hrFatigue = 3;
     else hrFatigue = 1;
     var daysAgo = Math.max(1, Math.floor((now - new Date(w.date)) / 86400000));
     score -= (hrFatigue / daysAgo);
    }
   });
   // Schlaf: 7-Tage-Durchschnitt
   var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
   var sleepValues = [];
   for (var d = 0; d < 7; d++) {
     var _day = new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
     if (habits[_day] && habits[_day].sleep) sleepValues.push(parseFloat(habits[_day].sleep));
   }
   var avgSleep = sleepValues.length > 0 ? sleepValues.reduce(function(a,b){return a+b;},0) / sleepValues.length : 7;
   if (sleepValues.length >= 3) {
    if (avgSleep >= 8.5) score += 8;
    else if (avgSleep >= 7.5) score += 3;
    else if (avgSleep >= 6.5) score -= 5;
    else if (avgSleep >= 5.5) score -= 12;
    else score -= 20;
   }
   // Workout-Feedback: Rolling Window
   var fb = JSON.parse(localStorage.getItem('base_workout_feedback') || '{}');
   var recentFB = Object.keys(fb).sort().slice(-5);
   if (recentFB.length >= 2) {
    var avgFB = recentFB.reduce(function(a,d){return a+fb[d].rating;},0)/recentFB.length;
    score += (avgFB - 3) * 4;
   }
   // Pump/Soreness
   var pumpData = JSON.parse(localStorage.getItem('base_pump_soreness') || '{}');
   var recentPump = Object.keys(pumpData).sort().slice(-3);
   if (recentPump.length >= 2) {
    var totalSoreness = 0; var sorenessCount = 0;
    recentPump.forEach(function(d) { Object.values(pumpData[d]).forEach(function(m) { if (m.soreness) { totalSoreness += m.soreness; sorenessCount++; } }); });
    if (sorenessCount > 0) { var avgSoreness = totalSoreness / sorenessCount; if (avgSoreness >= 4) score -= 10; else if (avgSoreness >= 3) score -= 5; }
   }
   score = Math.max(0, Math.min(100, Math.round(score)));
   if (window._logRecoveryScore) window._logRecoveryScore(score);
   return { score: score, label: score>=80?'Voll erholt':score>=60?'Bereit':score>=40?'Moderat':score>=20?'Erm\u00fcdet':'\u00dcbertraining-Risiko', color: score>=80?'#a3c9a8':score>=60?'#8aafe8':score>=40?'#e8c86a':'#e88a8a', emoji: score>=80?'\ud83d\udfe2':score>=60?'\ud83d\udfe2':score>=40?'\ud83d\udfe1':'\ud83d\udd34' };
  };

  // ============================================================
  // READINESS V3 — PER-MUSKELGRUPPE RECOVERY SYSTEM
  // ============================================================

  window._MUSCLE_RECOVERY_TIMES = {
   chest:      { base: 48, label: 'Brust',          emoji: '\uD83D\uDCAA' },
   front_delt: { base: 48, label: 'Schultern vorn', emoji: '\uD83C\uDFAF' },
   rear_delt:  { base: 48, label: 'Schultern hint.', emoji: '\uD83C\uDFAF' },
   biceps:     { base: 40, label: 'Bizeps',          emoji: '\uD83D\uDCAA' },
   triceps:    { base: 40, label: 'Trizeps',         emoji: '\uD83D\uDCAA' },
   forearms:   { base: 36, label: 'Unterarme',       emoji: '\uD83E\uDD1D' },
   traps:      { base: 48, label: 'Trapez',          emoji: '\uD83C\uDFD4' },
   lats:       { base: 56, label: 'Latissimus',      emoji: '\uD83E\uDD85' },
   abs:        { base: 32, label: 'Bauch',           emoji: '\uD83D\uDD25' },
   obliques:   { base: 32, label: 'Obliques',        emoji: '\uD83D\uDD25' },
   lower_back: { base: 72, label: 'Unterer R\u00fccken', emoji: '\u26A0\uFE0F' },
   quads:      { base: 56, label: 'Quadrizeps',      emoji: '\uD83E\uDDB5' },
   hamstrings: { base: 56, label: 'Hamstrings',      emoji: '\uD83E\uDDB5' },
   glutes:     { base: 56, label: 'Ges\u00e4\u00df', emoji: '\uD83C\uDF51' },
   calves:     { base: 36, label: 'Waden',           emoji: '\uD83E\uDDB6' }
  };

  window._MUSCLE_EXERCISE_MAP = {
   chest:      ['chest','pectorals','bankdruck','bench','flys','cable crossover','pec'],
   front_delt: ['shoulder','delt','schulter','press','ohp','lateral','seitheben'],
   rear_delt:  ['rear delt','face pull','reverse fly','hintere schulter'],
   biceps:     ['bicep','bizep','curl','hammer','chin'],
   triceps:    ['tricep','trizep','dip','pushdown','extension','skull'],
   forearms:   ['forearm','unterarm','wrist','handgelenk'],
   traps:      ['trap','shrug'],
   lats:       ['lat','lats','pull','pulldown','klimmzug','row','rudern','kabel'],
   abs:        ['abs','crunch','plank','bauch','core','sit-up'],
   obliques:   ['oblique','side','russian','windmill'],
   lower_back: ['lower back','deadlift','kreuzheben','good morning','hyperextension'],
   quads:      ['quad','squat','knie','leg press','lunge','ausfallschritt','leg extension'],
   hamstrings: ['hamstring','leg curl','romanian','rdl','stiff'],
   glutes:     ['glute','hip thrust','bridge','abductor'],
   calves:     ['calf','wade','calves','standing calf','seated calf']
  };

  window._getMuscleFromExercise = function(exerciseName, bodyPart, target) {
   if (!exerciseName) return [];
   var lower = (exerciseName + ' ' + (bodyPart||'') + ' ' + (target||'')).toLowerCase();
   var found = [];
   Object.entries(window._MUSCLE_EXERCISE_MAP).forEach(function(entry) {
    if (entry[1].some(function(k) { return lower.includes(k); })) {
     if (!found.includes(entry[0])) found.push(entry[0]);
    }
   });
   return found;
  };

  window._calculateMuscleRecovery = function() {
   var now = Date.now();
   var muscleState = {};
   Object.keys(window._MUSCLE_RECOVERY_TIMES).forEach(function(m) {
    muscleState[m] = { lastTrainedAt: null, fatigueScore: 0, recoveryPct: 100, hoursUntilReady: 0 };
   });
   var cutoff = now - 14 * 24 * 3600 * 1000;
   var archived = (window.workouts || []).filter(function(w) {
    return w.archived && new Date(w.date).getTime() > cutoff;
   }).sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

   archived.forEach(function(w) {
    var muscles = window._getMuscleFromExercise(w.exercise, w.bodyPart, w.target);
    if (muscles.length === 0) return;
    var volume = 0; var maxIntensity = 0;
    if (w.setDetails && w.setDetails.length > 0) {
     w.setDetails.forEach(function(s) {
      if (s.type === 'warmup') return;
      var r = parseInt(s.reps) || 8; var wt = parseFloat(s.weight) || 0;
      volume += r * wt;
      var rir = parseInt(s.rir); var intensity = isNaN(rir) ? 0.7 : Math.max(0.3, 1 - (rir / 10));
      maxIntensity = Math.max(maxIntensity, intensity);
     });
    } else { volume = 100; maxIntensity = 0.6; }
    var normalizedVol = Math.min(1, volume / 5000);
    var fatigue = (0.4 + normalizedVol * 0.6) * (0.7 + maxIntensity * 0.3);
    var workoutTime = new Date(w.date).getTime();
    muscles.forEach(function(muscle) {
     var state = muscleState[muscle]; if (!state) return;
     if (!state.lastTrainedAt || workoutTime > state.lastTrainedAt) {
      state.lastTrainedAt = workoutTime; state.fatigueScore = Math.min(1, fatigue);
     } else if (workoutTime === state.lastTrainedAt) {
      state.fatigueScore = Math.min(1, state.fatigueScore + fatigue * 0.3);
     }
    });
   });

   Object.entries(muscleState).forEach(function(entry) {
    var muscle = entry[0], state = entry[1];
    if (!state.lastTrainedAt) { state.recoveryPct = 100; state.hoursUntilReady = 0; return; }
    var hoursAgo = (now - state.lastTrainedAt) / 3600000;
    var baseRecovery = window._MUSCLE_RECOVERY_TIMES[muscle].base;
    var scaledRecovery = baseRecovery * (0.7 + state.fatigueScore * 0.6);
    var recoveryPct = Math.min(100, Math.round((1 - Math.exp(-hoursAgo / (scaledRecovery * 0.5))) * 100));
    state.recoveryPct = recoveryPct;
    state.hoursUntilReady = recoveryPct >= 90 ? 0 : Math.max(0, Math.round(scaledRecovery - hoursAgo));
   });
   return muscleState;
  };

  window._getMuscleReadinessScore = function(muscleState) {
   var values = Object.values(muscleState).map(function(s) { return s.recoveryPct; });
   return Math.round(values.reduce(function(a, b) { return a + b; }, 0) / values.length);
  };

  window._getReadyMuscles = function(muscleState, threshold) {
   threshold = threshold || 75;
   return Object.entries(muscleState).filter(function(e) { return e[1].recoveryPct >= threshold; }).map(function(e) { return e[0]; });
  };

  window._getFatiguedMuscles = function(muscleState, threshold) {
   threshold = threshold || 50;
   return Object.entries(muscleState).filter(function(e) { return e[1].recoveryPct < threshold; }).sort(function(a, b) { return a[1].recoveryPct - b[1].recoveryPct; });
  };

  window._renderMuscleRecoveryUI = function(containerId) {
   var container = document.getElementById(containerId);
   if (!container) return;
   var muscleState = window._calculateMuscleRecovery();
   var overallScore = window._getMuscleReadinessScore(muscleState);
   var fatigued = window._getFatiguedMuscles(muscleState, 60);
   var ready = window._getReadyMuscles(muscleState, 85);
   var scoreColor = overallScore >= 75 ? '#a3c9a8' : overallScore >= 50 ? '#e8c86a' : '#e88a8a';

   var html = '<div style="text-align:center;padding:16px 0 12px">' +
    '<div style="font-size:52px;font-weight:700;color:' + scoreColor + '">' + overallScore + '%</div>' +
    '<div style="font-size:12px;color:var(--text-muted);margin-top:2px">Muskel-Bereitschaft \u00B7 V3</div></div>';

   if (fatigued.length > 0) {
    html += '<div style="padding:10px 12px;background:rgba(232,138,138,0.08);border:1px solid rgba(232,138,138,0.2);border-radius:10px;margin-bottom:12px">' +
     '<p style="font-size:11px;font-weight:700;color:#e88a8a;margin-bottom:4px">\u26A0\uFE0F Noch erholt sich: ' +
     fatigued.slice(0,3).map(function(e) { return window._MUSCLE_RECOVERY_TIMES[e[0]].label + ' (' + e[1].recoveryPct + '%)'; }).join(', ') + '</p>' +
     (fatigued[0][1].hoursUntilReady > 0 ? '<p style="font-size:10px;color:var(--text-muted)">N\u00e4chste Session: in ~' + fatigued[0][1].hoursUntilReady + 'h</p>' : '') + '</div>';
   }

   var sorted = Object.entries(muscleState).sort(function(a, b) { return a[1].recoveryPct - b[1].recoveryPct; });

   html += '<button onclick="var l=document.getElementById(\'muscleRecoveryList\');var b=this;if(l.style.display===\'none\'){l.style.display=\'flex\';b.textContent=\'Weniger anzeigen \u25B2\';}else{l.style.display=\'none\';b.textContent=\'Alle Muskeln anzeigen \u25BC (' + sorted.length + ')\';}" class="pointer-events-auto w-full" aria-label="Muskelliste umschalten" style="padding:9px 12px;border-radius:10px;margin-bottom:6px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted);font-size:11px;font-weight:600;cursor:pointer">Alle Muskeln anzeigen \u25BC (' + sorted.length + ')</button>';

   html += '<div id="muscleRecoveryList" style="display:none;flex-direction:column;gap:6px">';
   sorted.forEach(function(entry) {
    var muscle = entry[0], state = entry[1];
    var info = window._MUSCLE_RECOVERY_TIMES[muscle]; if (!info) return;
    var pct = state.recoveryPct;
    var barColor = pct >= 85 ? '#a3c9a8' : pct >= 60 ? '#e8c86a' : '#e88a8a';
    var status = pct >= 85 ? 'Bereit' : pct >= 60 ? 'Fast erholt' : state.hoursUntilReady > 0 ? 'in ~' + state.hoursUntilReady + 'h' : 'M\u00fcde';
    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:9px">' +
     '<span style="font-size:14px;width:20px;text-align:center">' + info.emoji + '</span>' +
     '<span style="font-size:12px;font-weight:600;color:var(--text-main);width:100px;flex-shrink:0">' + info.label + '</span>' +
     '<div style="flex:1;height:6px;background:var(--border-hex);border-radius:3px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px;transition:width .5s ease"></div></div>' +
     '<span style="font-size:10px;color:' + barColor + ';font-weight:700;min-width:68px;text-align:right">' + status + '</span></div>';
   });
   html += '</div>';

   if (ready.length > 0) {
    var readyLabels = ready.slice(0, 4).map(function(m) { return window._MUSCLE_RECOVERY_TIMES[m] && window._MUSCLE_RECOVERY_TIMES[m].label; }).filter(Boolean);
    html += '<div style="margin-top:12px;padding:10px 12px;background:rgba(163,201,168,0.06);border:1px solid rgba(163,201,168,0.2);border-radius:10px">' +
     '<p style="font-size:11px;font-weight:700;color:#a3c9a8;margin-bottom:3px">\u2705 Empfehlung f\u00fcr heute</p>' +
     '<p style="font-size:11px;color:var(--text-muted)">' + readyLabels.join(' \u00B7 ') + '</p></div>';
   }
   container.innerHTML = html;
  };

  // ============================================================
  // MUSKEL-RANKING SYSTEM
  // ============================================================

  window._MUSCLE_DEFS = [
    {id:'chest',      label:'Brust',           emoji:'\uD83D\uDCAA', cat:'upper', antagonist:'lats'},
    {id:'front_delt', label:'Schultern vorn',   emoji:'\uD83C\uDFAF', cat:'upper', antagonist:'rear_delt'},
    {id:'rear_delt',  label:'Schultern hinten', emoji:'\uD83C\uDFAF', cat:'upper', antagonist:'front_delt'},
    {id:'biceps',     label:'Bizeps',           emoji:'\uD83D\uDCAA', cat:'upper', antagonist:'triceps'},
    {id:'triceps',    label:'Trizeps',          emoji:'\uD83D\uDCAA', cat:'upper', antagonist:'biceps'},
    {id:'forearms',   label:'Unterarme',        emoji:'\uD83E\uDD1D', cat:'upper', antagonist:null},
    {id:'traps',      label:'Trapez',           emoji:'\uD83C\uDFD4', cat:'upper', antagonist:null},
    {id:'lats',       label:'Latissimus',       emoji:'\uD83E\uDD85', cat:'upper', antagonist:'chest'},
    {id:'abs',        label:'Bauch',            emoji:'\uD83D\uDD25', cat:'core',  antagonist:'lower_back'},
    {id:'obliques',   label:'Obliques',         emoji:'\uD83D\uDD25', cat:'core',  antagonist:null},
    {id:'lower_back', label:'Unterer R\u00FCcken', emoji:'\u26A0\uFE0F', cat:'core',  antagonist:'abs'},
    {id:'quads',      label:'Quadrizeps',       emoji:'\uD83E\uDDB5', cat:'lower', antagonist:'hamstrings'},
    {id:'hamstrings', label:'Hamstrings',       emoji:'\uD83E\uDDB5', cat:'lower', antagonist:'quads'},
    {id:'glutes',     label:'Ges\u00E4\u00DF', emoji:'\uD83C\uDF51', cat:'lower', antagonist:null},
    {id:'calves',     label:'Waden',            emoji:'\uD83E\uDDB6', cat:'lower', antagonist:null}
  ];

  window._MUSCLE_RANKS = [
    {name:'Kein Training', color:'#c04030', min:0,    icon:'\u26A0\uFE0F'},
    {name:'Bronze I',      color:'#d4733a', min:1,    icon:'\uD83E\uDD49'},
    {name:'Bronze II',     color:'#d4874a', min:300,  icon:'\uD83E\uDD49'},
    {name:'Bronze III',    color:'#d49a5a', min:600,  icon:'\uD83E\uDD49'},
    {name:'Silver I',      color:'#c9a830', min:1000, icon:'\uD83E\uDD48'},
    {name:'Silver II',     color:'#d4b840', min:1500, icon:'\uD83E\uDD48'},
    {name:'Gold I',        color:'#7ec84a', min:2000, icon:'\uD83E\uDD47'},
    {name:'Gold II',       color:'#98d85a', min:3000, icon:'\uD83E\uDD47'},
    {name:'Platinum',      color:'#4ab8d4', min:4000, icon:'\uD83D\uDC8E'},
    {name:'Diamond',       color:'#34d9b0', min:6000, icon:'\uD83D\uDC51'}
  ];

  window._getMuscleRank = function(xp) {
    if (!xp) return window._MUSCLE_RANKS[0];
    for (var i = window._MUSCLE_RANKS.length - 1; i >= 0; i--) {
      if (xp >= window._MUSCLE_RANKS[i].min) return window._MUSCLE_RANKS[i];
    }
    return window._MUSCLE_RANKS[0];
  };

  window._calculateMuscleXP = function() {
    var archived = (window.workouts || []).filter(function(w) { return w.archived; });
    var muscleXP = {};

    window._MUSCLE_DEFS.forEach(function(m) { muscleXP[m.id] = 0; });

    archived.forEach(function(w) {
      var muscles = window._getMuscleFromExercise
        ? window._getMuscleFromExercise(w.exercise, w.bodyPart, w.target)
        : [];
      if (muscles.length === 0) return;

      var volume = 0;
      if (w.setDetails && w.setDetails.length > 0) {
        w.setDetails.forEach(function(s) {
          if (s.type === 'warmup') return;
          volume += (parseFloat(s.weight) || 1) * (parseInt(s.reps) || 8);
        });
      } else { volume = 50; }

      var xpPerMuscle = Math.round(Math.min(volume * 0.8, 500) / muscles.length);
      muscles.forEach(function(m) {
        if (muscleXP[m] !== undefined) muscleXP[m] += xpPerMuscle;
      });
    });

    return muscleXP;
  };

  window._getMuscleImbalances = function(muscleXP) {
    var warnings = [];
    var pairs = [
      ['quads','hamstrings','Quadrizeps vs. Hamstrings'],
      ['biceps','triceps','Bizeps vs. Trizeps'],
      ['chest','lats','Brust vs. Latissimus'],
      ['abs','lower_back','Bauch vs. R\u00FCcken'],
      ['front_delt','rear_delt','Vordere vs. Hintere Schulter']
    ];

    pairs.forEach(function(pair) {
      var a = muscleXP[pair[0]] || 0;
      var b = muscleXP[pair[1]] || 0;
      if (a === 0 && b === 0) return;
      var max = Math.max(a, b);
      var min = Math.min(a, b);
      if (max > 0 && min / max < 0.5) {
        var stronger = a > b
          ? window._MUSCLE_DEFS.find(function(m) { return m.id === pair[0]; })
          : window._MUSCLE_DEFS.find(function(m) { return m.id === pair[1]; });
        var weaker = a > b
          ? window._MUSCLE_DEFS.find(function(m) { return m.id === pair[1]; })
          : window._MUSCLE_DEFS.find(function(m) { return m.id === pair[0]; });
        warnings.push({
          label: pair[2],
          stronger: stronger ? stronger.label : pair[0],
          weaker: weaker ? weaker.label : pair[1],
          ratio: Math.round(min / max * 100)
        });
      }
    });

    return warnings;
  };

  window._renderMuscleRanking = function(containerId) {
    var container = document.getElementById(containerId || 'muscleRankingContainer');
    if (!container) return;

    var muscleXP = window._calculateMuscleXP();
    var imbalances = window._getMuscleImbalances(muscleXP);
    var totalXP = Object.values(muscleXP).reduce(function(s, v) { return s + v; }, 0);
    var avgXP = Math.round(totalXP / window._MUSCLE_DEFS.length);
    var overallRank = window._getMuscleRank(avgXP);

    var html = '';

    html += '<div style="padding:12px 14px;background:var(--inner-bg-hex);' +
      'border:1px solid var(--border-hex);border-radius:12px;margin-bottom:10px;' +
      'display:flex;align-items:center;justify-content:space-between">' +
      '<div>' +
      '<p style="font-size:9px;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.1em;color:var(--text-muted);margin-bottom:2px">Gesamt-Rang</p>' +
      '<p style="font-size:20px;font-weight:700;color:' + overallRank.color + '">' +
        overallRank.icon + ' ' + overallRank.name + '</p>' +
      '<p style="font-size:10px;color:var(--text-muted);margin-top:2px">' +
        totalXP.toLocaleString() + ' Gesamt-XP</p>' +
      '</div>' +
      '<div style="text-align:right">' +
      '<p style="font-size:28px;font-weight:700;color:' + overallRank.color + '">' +
        window._MUSCLE_DEFS.filter(function(m) {
          return (muscleXP[m.id] || 0) >= 1;
        }).length + '/' + window._MUSCLE_DEFS.length + '</p>' +
      '<p style="font-size:10px;color:var(--text-muted)">Muskeln trainiert</p>' +
      '</div>' +
      '</div>';

    if (imbalances.length > 0) {
      html += '<div style="padding:10px 12px;background:rgba(232,200,106,0.06);' +
        'border:1px solid rgba(232,200,106,0.2);border-radius:10px;margin-bottom:10px">' +
        '<p style="font-size:10px;font-weight:700;color:#e8c86a;margin-bottom:6px">' +
          '\u26A0\uFE0F Muskel-Dysbalancen erkannt</p>' +
        imbalances.map(function(w) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;' +
            'padding:4px 0;border-top:1px solid rgba(232,200,106,0.1)">' +
            '<p style="font-size:11px;color:var(--text-main)">' + w.label + '</p>' +
            '<p style="font-size:10px;color:#e8c86a">' +
              w.weaker + ' nur ' + w.ratio + '%</p>' +
            '</div>';
        }).join('') +
        '</div>';
    }

    html += '<div style="display:flex;gap:4px;margin-bottom:8px" id="muscleRankFilter">' +
      ['all','upper','core','lower'].map(function(cat, i) {
        var labels = ['Alle','Oberk\u00F6rper','Core','Unterk\u00F6rper'];
        var active = i === 0;
        return '<button onclick="window._filterMuscleRank(\'' + cat + '\',this)" ' +
          'class="pointer-events-auto" aria-label="' + labels[i] + ' filtern" ' +
          'style="flex:1;padding:6px 2px;border-radius:9px;font-size:10px;font-weight:600;' +
          'cursor:pointer;font-family:inherit;transition:all .12s;' +
          (active
            ? 'background:color-mix(in srgb,var(--primary-hex),transparent 88%);' +
              'border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);' +
              'color:var(--primary-hex);'
            : 'background:transparent;border:1px solid var(--border-hex);color:var(--text-muted);') +
          '">' + labels[i] + '</button>';
      }).join('') +
      '</div>';

    var sortedMuscles = window._MUSCLE_DEFS.slice().sort(function(a, b) {
      return (muscleXP[b.id] || 0) - (muscleXP[a.id] || 0);
    });

    var maxXP = Math.max.apply(null, Object.values(muscleXP).concat([1]));

    html += '<div id="muscleRankList" style="display:flex;flex-direction:column;gap:4px">' +
      sortedMuscles.map(function(m) {
        var xp = muscleXP[m.id] || 0;
        var rank = window._getMuscleRank(xp);
        var pct = Math.round(xp / maxXP * 100);
        var nextRank = window._MUSCLE_RANKS.find(function(r) { return r.min > xp; });
        var progress = nextRank
          ? Math.round((xp - rank.min) / (nextRank.min - rank.min) * 100)
          : 100;

        return '<div class="pointer-events-auto" data-cat="' + m.cat + '" ' +
          'style="padding:10px 12px;background:var(--inner-bg-hex);' +
          'border:1px solid var(--border-hex);border-radius:11px;cursor:pointer"' +
          ' onclick="var _d=this.querySelector(\'.mr-detail\');if(_d)_d.style.display=_d.style.display===\'none\'?\'block\':\'none\'">' +

          '<div style="display:flex;align-items:center;gap:9px">' +
          '<span style="font-size:16px;width:22px;text-align:center">' + m.emoji + '</span>' +
          '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">' +
          '<span style="font-size:12px;font-weight:600;color:var(--text-main)">' + m.label + '</span>' +
          '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:6px;' +
            'background:' + rank.color + '22;color:' + rank.color + '">' +
            rank.icon + ' ' + rank.name + '</span>' +
          '</div>' +
          '<div style="height:4px;background:var(--border-hex);border-radius:2px;overflow:hidden">' +
          '<div style="width:' + pct + '%;height:100%;background:' + rank.color + ';' +
            'border-radius:2px;transition:width .5s ease"></div>' +
          '</div>' +
          '</div></div>' +

          '<div class="mr-detail" style="display:none;margin-top:10px;padding-top:10px;' +
            'border-top:1px solid var(--border-hex)">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px">' +
          '<span style="font-size:10px;color:var(--text-muted)">' + xp.toLocaleString() + ' XP</span>' +
          (nextRank
            ? '<span style="font-size:10px;color:var(--text-muted)">' +
                'N\u00E4chster Rang: ' + (nextRank.min - xp).toLocaleString() + ' XP</span>'
            : '<span style="font-size:10px;color:' + rank.color + '">Max-Rang erreicht \u2713</span>') +
          '</div>' +
          (nextRank
            ? '<div style="height:3px;background:var(--border-hex);border-radius:2px;overflow:hidden">' +
              '<div style="width:' + progress + '%;height:100%;background:' + rank.color + ';' +
              'border-radius:2px"></div></div>'
            : '') +
          '</div>' +

          '</div>';
      }).join('') +
      '</div>';

    container.innerHTML = html;

    window._filterMuscleRank = function(cat, btn) {
      document.querySelectorAll('#muscleRankFilter button').forEach(function(b) {
        b.style.background = 'transparent';
        b.style.borderColor = 'var(--border-hex)';
        b.style.color = 'var(--text-muted)';
      });
      if (btn) {
        btn.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 88%)';
        btn.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 65%)';
        btn.style.color = 'var(--primary-hex)';
      }
      document.querySelectorAll('#muscleRankList [data-cat]').forEach(function(el) {
        el.style.display = (cat === 'all' || el.dataset.cat === cat) ? 'block' : 'none';
      });
    };
  };

  // ============================================================
  // FOOD LOGGING SYSTEM — Phase 2
  // ============================================================

  window._MEAL_SLOTS = [
    {id:'breakfast', label:'Fr\u00FChst\u00FCck', icon:'\u2600\uFE0F', defaultTime:'08:00'},
    {id:'lunch',     label:'Mittagessen',          icon:'\uD83C\uDF7D', defaultTime:'12:30'},
    {id:'snack',     label:'Snack',                icon:'\uD83C\uDF4E', defaultTime:'15:00'},
    {id:'dinner',    label:'Abendessen',           icon:'\uD83C\uDF19', defaultTime:'19:00'},
    {id:'preworkout',label:'Pre-Workout',           icon:'\u26A1',       defaultTime:'17:00'},
    {id:'postworkout',label:'Post-Workout',         icon:'\uD83D\uDCAA', defaultTime:'20:00'}
  ];

  window._getFoodLog = function(dateStr) {
    var key = 'base_food_log_' + (dateStr || new Date().toISOString().split('T')[0]);
    return JSON.parse(localStorage.getItem(key) || '{}');
  };

  window._saveFoodLog = function(dateStr, log) {
    var key = 'base_food_log_' + (dateStr || new Date().toISOString().split('T')[0]);
    localStorage.setItem(key, JSON.stringify(log));
    window._syncFoodLog(dateStr, log);
  };

  window._syncFoodLog = async function(dateStr, log) {
    try {
      var db = window._db || window._fbDb;
      var auth = window._fbAuth;
      if (!db || !auth || !auth.currentUser) return;
      var mod = window._firestoreModule;
      if (!mod || !mod.doc || !mod.setDoc) return;
      await mod.setDoc(
        mod.doc(db, 'food_logs', auth.currentUser.uid + '_' + (dateStr || new Date().toISOString().split('T')[0])),
        { log: log, uid: auth.currentUser.uid, date: dateStr, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch(e) { console.warn('[FoodLog] Sync:', e.message); }
  };

  window._addFoodEntry = function(mealId, foodItem, dateStr) {
    var log = window._getFoodLog(dateStr);
    if (!log[mealId]) log[mealId] = [];
    var entry = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2,5),
      name:     foodItem.name || foodItem.food_name || 'Unbekannt',
      calories: Math.round(foodItem.nf_calories || foodItem.calories || 0),
      protein:  Math.round((foodItem.nf_protein || foodItem.protein || 0) * 10) / 10,
      carbs:    Math.round((foodItem.nf_total_carbohydrate || foodItem.carbs || 0) * 10) / 10,
      fat:      Math.round((foodItem.nf_total_fat || foodItem.fat || 0) * 10) / 10,
      fiber:    Math.round((foodItem.nf_dietary_fiber || 0) * 10) / 10,
      servingQty:  foodItem.serving_qty || 1,
      servingUnit: foodItem.serving_unit || 'Portion',
      servingG:    foodItem.serving_weight_grams || 100,
      isCustom: foodItem.isCustom || false,
      addedAt:  new Date().toISOString(),
      micros: window._extractMicros ? window._extractMicros(foodItem, (foodItem.serving_weight_grams || 100) / 100) : {}
    };
    log[mealId].push(entry);
    window._saveFoodLog(dateStr, log);
    return entry;
  };

  window._removeFoodEntry = function(mealId, entryId, dateStr) {
    var log = window._getFoodLog(dateStr);
    if (!log[mealId]) return;
    log[mealId] = log[mealId].filter(function(e) { return e.id !== entryId; });
    window._saveFoodLog(dateStr, log);
  };

  window._getDayTotals = function(dateStr) {
    var log = window._getFoodLog(dateStr);
    var totals = { calories:0, protein:0, carbs:0, fat:0, fiber:0, entries:0 };
    Object.values(log).forEach(function(meal) {
      (meal || []).forEach(function(e) {
        totals.calories += e.calories || 0;
        totals.protein  += e.protein  || 0;
        totals.carbs    += e.carbs    || 0;
        totals.fat      += e.fat      || 0;
        totals.fiber    += e.fiber    || 0;
        totals.entries++;
      });
    });
    totals.calories = Math.round(totals.calories);
    totals.protein  = Math.round(totals.protein * 10) / 10;
    totals.carbs    = Math.round(totals.carbs * 10) / 10;
    totals.fat      = Math.round(totals.fat * 10) / 10;
    return totals;
  };

  // Nutritionix API
  window._searchFood = async function(query) {
    try {
      var res = await fetch('/.netlify/functions/nutritionix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: query })
      });
      if (!res.ok) throw new Error('Suche fehlgeschlagen');
      var data = await res.json();
      return data.foods || [];
    } catch(e) { console.warn('[Food Search]', e.message); return []; }
  };

  window._getFoodNutrients = async function(foodName, barcode) {
    try {
      var res = await fetch('/.netlify/functions/nutritionix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barcode ? { action: 'barcode', barcode: barcode } : { action: 'search', query: foodName })
      });
      if (!res.ok) throw new Error('Fehler');
      var data = await res.json();
      return data.foods && data.foods[0] ? data.foods[0] : null;
    } catch(e) { console.warn('[Food Nutrients]', e.message); return null; }
  };

  // Custom Foods
  window._CUSTOM_FOODS_KEY = 'base_custom_foods';
  window._getCustomFoods = function() { return JSON.parse(localStorage.getItem(window._CUSTOM_FOODS_KEY) || '[]'); };
  window._saveCustomFood = function(food) {
    var foods = window._getCustomFoods();
    food.id = 'custom_' + Date.now();
    food.isCustom = true;
    food.createdAt = new Date().toISOString();
    foods.unshift(food);
    localStorage.setItem(window._CUSTOM_FOODS_KEY, JSON.stringify(foods));
    window.showToast('Lebensmittel gespeichert!');
    return food;
  };
  window._deleteCustomFood = function(id) {
    var foods = window._getCustomFoods().filter(function(f) { return f.id !== id; });
    localStorage.setItem(window._CUSTOM_FOODS_KEY, JSON.stringify(foods));
  };

  // ============================================================
  // REZEPT-SYSTEM — Phase 3
  // ============================================================

  window._RECIPES_KEY = 'base_recipes';
  window._getRecipes = function() { return JSON.parse(localStorage.getItem(window._RECIPES_KEY) || '[]'); };

  window._saveRecipe = function(recipe) {
    var recipes = window._getRecipes();
    if (recipe.id) { recipes = recipes.map(function(r) { return r.id === recipe.id ? recipe : r; }); }
    else { recipe.id = 'recipe_' + Date.now(); recipe.createdAt = new Date().toISOString(); recipes.unshift(recipe); }
    localStorage.setItem(window._RECIPES_KEY, JSON.stringify(recipes));
    return recipe;
  };

  window._deleteRecipe = function(id) {
    var recipes = window._getRecipes().filter(function(r) { return r.id !== id; });
    localStorage.setItem(window._RECIPES_KEY, JSON.stringify(recipes));
  };

  window._calculateRecipeNutrition = function(ingredients, servings) {
    servings = servings || 1;
    var totals = { calories:0, protein:0, carbs:0, fat:0, fiber:0 };
    (ingredients || []).forEach(function(ing) {
      var mult = (ing.amount || 100) / (ing.servingG || 100);
      totals.calories += (ing.nf_calories || 0) * mult;
      totals.protein  += (ing.nf_protein  || 0) * mult;
      totals.carbs    += (ing.nf_total_carbohydrate || 0) * mult;
      totals.fat      += (ing.nf_total_fat || 0) * mult;
      totals.fiber    += (ing.nf_dietary_fiber || 0) * mult;
    });
    return {
      calories: Math.round(totals.calories / servings),
      protein:  Math.round(totals.protein  / servings * 10) / 10,
      carbs:    Math.round(totals.carbs    / servings * 10) / 10,
      fat:      Math.round(totals.fat      / servings * 10) / 10,
      fiber:    Math.round(totals.fiber    / servings * 10) / 10
    };
  };

  window._logRecipeAsMeal = function(recipeId, mealId, dateStr) {
    var recipe = window._getRecipes().find(function(r) { return r.id === recipeId; });
    if (!recipe) return;
    var nutrition = recipe.nutritionPerServing || window._calculateRecipeNutrition(recipe.ingredients, recipe.servings);
    window._addFoodEntry(mealId || 'snack', {
      name: recipe.name, nf_calories: nutrition.calories, nf_protein: nutrition.protein,
      nf_total_carbohydrate: nutrition.carbs, nf_total_fat: nutrition.fat, nf_dietary_fiber: nutrition.fiber,
      serving_qty: 1, serving_unit: 'Portion', serving_weight_grams: 100, isRecipe: true, recipeId: recipeId
    }, dateStr);
    window.showToast(window._escapeHtml(recipe.name) + ' geloggt!');
    window._renderNutritionDashboard(dateStr);
  };

  window._shareRecipeToFeed = async function(recipeId) {
    var recipe = window._getRecipes().find(function(r) { return r.id === recipeId; });
    if (!recipe) return;
    var db = window._db || window._fbDb; var auth = window._fbAuth;
    if (!db || !auth || !auth.currentUser) { window.showToast('Bitte einloggen um Rezepte zu teilen', 'warn'); return; }
    try {
      var mod = window._firestoreModule;
      var uid = auth.currentUser.uid;
      var profileSnap = await mod.getDoc(mod.doc(db, 'profiles', uid));
      var profileData = profileSnap.exists() ? profileSnap.data() : {};
      var nutrition = recipe.nutritionPerServing || window._calculateRecipeNutrition(recipe.ingredients, recipe.servings);
      var sharedRef = await mod.addDoc(mod.collection(db, 'shared_recipes'), {
        uid: uid, displayName: profileData.displayName || 'Athlet', level: profileData.level || 1,
        name: recipe.name, description: recipe.description || '', ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || '', servings: recipe.servings || 1, prepTime: recipe.prepTime || null,
        tags: recipe.tags || [], nutrition: nutrition, useCount: 0, likeCount: 0,
        createdAt: new Date().toISOString(), isPublic: true
      });
      await mod.addDoc(mod.collection(db, 'feed'), {
        uid: uid, displayName: profileData.displayName || 'Athlet', level: profileData.level || 1,
        type: 'recipe', recipeId: sharedRef.id, recipeName: recipe.name, nutrition: nutrition,
        date: new Date().toISOString(), likeCount: 0, isPublic: true
      });
      recipe.sharedId = sharedRef.id; recipe.isShared = true;
      window._saveRecipe(recipe);
      window.showToast('Rezept in der Community geteilt!');
    } catch(e) { window.showToast('Fehler: ' + window._escapeHtml(e.message), 'error'); }
  };

  window._loadCommunityRecipes = async function() {
    var container = document.getElementById('socialFeedContainer');
    if (!container) return;
    var db = window._db || window._fbDb;
    if (!db) { container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted)">Nicht verbunden</p>'; return; }
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">Lade Rezepte...</div>';
    try {
      var mod = window._firestoreModule;
      var snap = await mod.getDocs(mod.query(mod.collection(db, 'shared_recipes'), mod.orderBy('createdAt', 'desc'), mod.limit(20)));
      var recipes = []; snap.forEach(function(d) { recipes.push(Object.assign({ id: d.id }, d.data())); });
      window._renderCommunityRecipes(recipes, container);
    } catch(e) { container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">Konnte nicht laden</p>'; }
  };

  window._renderCommunityRecipes = function(recipes, container) {
    if (!recipes || recipes.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:32px 16px"><p style="font-size:24px;margin-bottom:8px">\uD83C\uDF73</p><p style="font-size:14px;font-weight:700;color:var(--text-main);margin-bottom:6px">Noch keine Rezepte</p><p style="font-size:12px;color:var(--text-muted)">Sei der Erste!</p></div>';
      return;
    }
    container.innerHTML = recipes.map(function(r) {
      var n = r.nutrition || {};
      return '<div style="padding:14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:14px;margin-bottom:10px">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">' +
        '<div style="width:36px;height:36px;border-radius:50%;flex-shrink:0;background:color-mix(in srgb,var(--primary-hex),transparent 80%);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--primary-hex)">' + window._escapeHtml((r.displayName||'A')[0].toUpperCase()) + '</div>' +
        '<div style="flex:1"><p style="font-size:14px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(r.name||'Rezept') + '</p>' +
        '<p style="font-size:10px;color:var(--text-muted)">von ' + window._escapeHtml(r.displayName||'Athlet') + (r.prepTime ? ' \u00B7 ' + r.prepTime + ' min' : '') + '</p></div></div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">' +
        [{l:'Kalorien',v:Math.round(n.calories||0),c:'var(--primary-hex)'},{l:'Protein',v:(n.protein||0)+'g',c:'#4ab8d4'},{l:'Carbs',v:(n.carbs||0)+'g',c:'#7ec84a'},{l:'Fett',v:(n.fat||0)+'g',c:'#d4733a'}].map(function(m) {
          return '<div style="padding:7px;background:var(--bg-hex);border-radius:8px;border:1px solid var(--border-hex);text-align:center"><p style="font-size:13px;font-weight:700;color:'+m.c+'">'+m.v+'</p><p style="font-size:8px;color:var(--text-muted)">'+m.l+'</p></div>';
        }).join('') + '</div>' +
        (r.ingredients && r.ingredients.length > 0 ? '<p style="font-size:10px;color:var(--text-muted);margin-bottom:10px">' + r.ingredients.slice(0,3).map(function(i) { return window._escapeHtml(i.name||i.food_name||''); }).join(' \u00B7 ') + (r.ingredients.length > 3 ? ' +' + (r.ingredients.length-3) + ' weitere' : '') + '</p>' : '') +
        '<div style="display:flex;gap:8px;margin-top:10px">' +
        '<button onclick="window._openRecipeDetail(\'' + r.id + '\')" class="pointer-events-auto" aria-label="Details" style="flex:1;padding:8px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">Details</button>' +
        '<button onclick="window._useSharedRecipe(\'' + r.id + '\')" class="pointer-events-auto" aria-label="\u00DCbernehmen" style="flex:1;padding:8px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex)">\u00DCbernehmen</button>' +
        '</div></div>';
    }).join('');
  };

  window._useSharedRecipe = async function(sharedRecipeId) {
    var db = window._db || window._fbDb; if (!db) return;
    try {
      var mod = window._firestoreModule;
      var snap = await mod.getDoc(mod.doc(db, 'shared_recipes', sharedRecipeId));
      if (!snap.exists()) { window.showToast('Rezept nicht gefunden', 'error'); return; }
      var r = snap.data();
      window._saveRecipe({ name: r.name + ' (von ' + (r.displayName||'Athlet') + ')', description: r.description || '', ingredients: r.ingredients || [], instructions: r.instructions || '', servings: r.servings || 1, prepTime: r.prepTime || null, tags: r.tags || [], fromShared: sharedRecipeId, isShared: false });
      await mod.updateDoc(mod.doc(db, 'shared_recipes', sharedRecipeId), { useCount: mod.increment(1) });
      window.showToast('Rezept \u00FCbernommen!');
    } catch(e) { window.showToast('Fehler: ' + window._escapeHtml(e.message), 'error'); }
  };

  window._openRecipeDetail = async function(sharedOrLocalId) {
    var localRecipe = window._getRecipes().find(function(r) { return r.id === sharedOrLocalId || r.sharedId === sharedOrLocalId; });
    if (!localRecipe && window._fbDb) {
      try { var mod = window._firestoreModule; var snap = await mod.getDoc(mod.doc(window._fbDb, 'shared_recipes', sharedOrLocalId)); if (snap.exists()) localRecipe = snap.data(); } catch(e) {}
    }
    if (!localRecipe) return;
    window._currentRecipeDetail = localRecipe;
    window._renderRecipeDetail(localRecipe);
    window.toggleModal('recipeDetailModal');
  };

  window._renderRecipeDetail = function(r) {
    var container = document.getElementById('recipeDetailContent'); if (!container) return;
    var nutrition = r.nutritionPerServing || r.nutrition || window._calculateRecipeNutrition(r.ingredients, r.servings);
    container.innerHTML =
      '<h2 style="font-size:20px;font-weight:700;color:var(--text-main);margin-bottom:4px">' + window._escapeHtml(r.name||'Rezept') + '</h2>' +
      (r.description ? '<p style="font-size:12px;color:var(--text-muted);margin-bottom:14px;line-height:1.5">' + window._escapeHtml(r.description) + '</p>' : '') +
      '<div style="display:flex;gap:10px;margin-bottom:14px">' +
      (r.servings ? '<span style="font-size:11px;padding:4px 9px;border-radius:7px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)">' + r.servings + ' Portionen</span>' : '') +
      (r.prepTime ? '<span style="font-size:11px;padding:4px 9px;border-radius:7px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)">' + r.prepTime + ' min</span>' : '') + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px">' +
      [{l:'Kalorien',v:nutrition.calories,c:'var(--primary-hex)'},{l:'Protein',v:nutrition.protein+'g',c:'#4ab8d4'},{l:'Carbs',v:nutrition.carbs+'g',c:'#7ec84a'},{l:'Fett',v:nutrition.fat+'g',c:'#d4733a'}].map(function(m) {
        return '<div style="padding:8px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:9px;text-align:center"><p style="font-size:14px;font-weight:700;color:'+m.c+'">'+m.v+'</p><p style="font-size:9px;color:var(--text-muted)">'+m.l+'</p></div>';
      }).join('') + '</div>' +
      '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:8px">Zutaten</p>' +
      '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:16px">' +
      (r.ingredients||[]).map(function(ing) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--inner-bg-hex);border-radius:8px;border:1px solid var(--border-hex)">' +
          '<span style="font-size:12px;color:var(--text-main)">' + window._escapeHtml(ing.name||ing.food_name||'') + '</span>' +
          '<span style="font-size:11px;color:var(--text-muted)">' + (ing.amount||100) + (ing.unit||'g') + ' \u00B7 ' + Math.round(ing.nf_calories||0) + ' kcal</span></div>';
      }).join('') + '</div>' +
      (r.instructions ? '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:8px">Zubereitung</p><p style="font-size:12px;color:var(--text-main);line-height:1.7;margin-bottom:16px">' + window._escapeHtml(r.instructions) + '</p>' : '') +
      '<button onclick="window._pickMealForRecipe()" class="pointer-events-auto w-full" aria-label="Als Mahlzeit loggen" style="padding:12px;border-radius:12px;margin-bottom:8px;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex);font-size:13px;font-weight:700;cursor:pointer">Als Mahlzeit loggen</button>';
  };

  window._pickMealForRecipe = function() {
    var recipe = window._currentRecipeDetail; if (!recipe) return;
    var opts = window._MEAL_SLOTS.map(function(s) {
      return '<button onclick="window._logRecipeAsMeal(\'' + (recipe.id||recipe.sharedId||'') + '\',\'' + s.id + '\');window.toggleModal(\'recipeDetailModal\')" class="pointer-events-auto w-full" aria-label="' + s.label + '" style="padding:10px;border-radius:10px;margin-bottom:6px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px">' + s.icon + ' ' + s.label + '</button>';
    }).join('');
    window.showModal('Als welche Mahlzeit loggen?', '<div style="margin-top:8px">' + opts + '</div>', false);
  };

  // Rezept Editor
  window._recipeIngredients = [];
  window._editingRecipeId = null;

  window.openRecipeEditor = function(recipeId) {
    window._recipeIngredients = []; window._editingRecipeId = null;
    var titleEl = document.getElementById('recipeEditorTitle');
    if (recipeId) {
      var existing = window._getRecipes().find(function(r) { return r.id === recipeId; });
      if (existing) {
        window._editingRecipeId = recipeId;
        window._recipeIngredients = (existing.ingredients || []).slice();
        if (titleEl) titleEl.textContent = 'Rezept bearbeiten';
        setTimeout(function() {
          var f = { re_name: existing.name||'', re_description: existing.description||'', re_servings: existing.servings||2, re_preptime: existing.prepTime||'', re_instructions: existing.instructions||'' };
          Object.keys(f).forEach(function(id) { var el = document.getElementById(id); if (el) el.value = f[id]; });
          window._renderRecipeIngredientsList();
        }, 100);
      }
    } else {
      if (titleEl) titleEl.textContent = 'Neues Rezept';
      ['re_name','re_description','re_instructions'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
      var srv = document.getElementById('re_servings'); if (srv) srv.value = '2';
      var pt = document.getElementById('re_preptime'); if (pt) pt.value = '';
      window._renderRecipeIngredientsList();
    }
    window.toggleModal('recipeEditorModal');
  };

  window._renderRecipeIngredientsList = function() {
    var container = document.getElementById('recipeIngredientsList'); if (!container) return;
    if (window._recipeIngredients.length === 0) {
      container.innerHTML = '<p style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px">Noch keine Zutaten</p>';
      var preview = document.getElementById('recipeNutritionPreview'); if (preview) preview.style.display = 'none';
      return;
    }
    container.innerHTML = window._recipeIngredients.map(function(ing, i) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:9px">' +
        '<div style="flex:1;min-width:0"><p style="font-size:12px;font-weight:500;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + window._escapeHtml(ing.name||ing.food_name||'') + '</p>' +
        '<p style="font-size:10px;color:var(--text-muted)">' + Math.round(ing.nf_calories||0) + ' kcal \u00B7 P ' + Math.round(ing.nf_protein||0) + 'g</p></div>' +
        '<input type="number" inputmode="decimal" value="' + (ing.amount||100) + '" step="10" min="1" aria-label="Menge" class="pointer-events-auto" style="width:52px;padding:4px 6px;border-radius:7px;background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:12px;text-align:center;-webkit-text-fill-color:var(--text-main)" oninput="window._updateIngredientAmount(' + i + ',this.value)"/>' +
        '<span style="font-size:10px;color:var(--text-muted)">' + (ing.unit||'g') + '</span>' +
        '<button onclick="window._removeIngredient(' + i + ')" class="pointer-events-auto" aria-label="Entfernen" style="color:var(--text-muted);background:none;border:none;font-size:14px;cursor:pointer;flex-shrink:0">\u2715</button></div>';
    }).join('');
    window._updateRecipeNutritionPreview();
  };

  window._updateIngredientAmount = function(idx, val) {
    if (window._recipeIngredients[idx]) { window._recipeIngredients[idx].amount = parseFloat(String(val).replace(',','.')) || 100; window._updateRecipeNutritionPreview(); }
  };
  window._removeIngredient = function(idx) { window._recipeIngredients.splice(idx, 1); window._renderRecipeIngredientsList(); };

  window._updateRecipeNutritionPreview = function() {
    var servings = parseInt((document.getElementById('re_servings')||{}).value || 1) || 1;
    var nutrition = window._calculateRecipeNutrition(window._recipeIngredients, servings);
    var preview = document.getElementById('recipeNutritionPreview');
    var grid = document.getElementById('recipeNutritionGrid');
    if (!preview || !grid) return;
    if (window._recipeIngredients.length === 0) { preview.style.display = 'none'; return; }
    preview.style.display = 'block';
    grid.innerHTML = [{l:'Kalorien',v:nutrition.calories,c:'var(--primary-hex)'},{l:'Protein',v:nutrition.protein+'g',c:'#4ab8d4'},{l:'Carbs',v:nutrition.carbs+'g',c:'#7ec84a'},{l:'Fett',v:nutrition.fat+'g',c:'#d4733a'}].map(function(m) {
      return '<div style="padding:7px;background:var(--bg-hex);border-radius:8px;border:1px solid var(--border-hex);text-align:center"><p style="font-size:13px;font-weight:700;color:'+m.c+'">'+m.v+'</p><p style="font-size:9px;color:var(--text-muted)">'+m.l+'</p></div>';
    }).join('');
  };

  window._saveRecipeFromEditor = async function(shareAfterSave) {
    var name = (document.getElementById('re_name')||{}).value || '';
    if (!name.trim()) { window.showToast('Bitte Rezeptname eingeben', 'error'); return; }
    if (window._recipeIngredients.length === 0) { window.showToast('Bitte mindestens eine Zutat hinzuf\u00FCgen', 'error'); return; }
    var servings = parseInt((document.getElementById('re_servings')||{}).value || 2) || 2;
    var recipe = {
      id: window._editingRecipeId || null, name: name.trim(),
      description: (document.getElementById('re_description')||{}).value || '',
      servings: servings, prepTime: parseInt((document.getElementById('re_preptime')||{}).value||0) || null,
      instructions: (document.getElementById('re_instructions')||{}).value || '',
      ingredients: window._recipeIngredients,
      nutritionPerServing: window._calculateRecipeNutrition(window._recipeIngredients, servings), tags: []
    };
    var saved = window._saveRecipe(recipe);
    window.toggleModal('recipeEditorModal');
    window.showToast('Rezept "' + window._escapeHtml(saved.name) + '" gespeichert!');
    if (shareAfterSave) await window._shareRecipeToFeed(saved.id);
    if (window._currentFeedTab === 'recipes') window._renderMyRecipes();
  };

  window._renderMyRecipes = function() {
    var container = document.getElementById('socialFeedContainer'); if (!container) return;
    var recipes = window._getRecipes();
    if (recipes.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:32px 16px"><p style="font-size:24px;margin-bottom:8px">\uD83C\uDF73</p><p style="font-size:14px;font-weight:700;color:var(--text-main);margin-bottom:6px">Noch keine Rezepte</p><button onclick="window.openRecipeEditor()" class="pointer-events-auto" aria-label="Rezept erstellen" style="padding:10px 20px;border-radius:10px;margin-top:8px;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex);font-size:13px;font-weight:700;cursor:pointer">+ Erstes Rezept erstellen</button></div>';
      return;
    }
    container.innerHTML = recipes.map(function(r) {
      var n = r.nutritionPerServing || {};
      return '<div style="padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:13px;margin-bottom:8px">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div style="flex:1"><p style="font-size:14px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(r.name) + '</p><p style="font-size:10px;color:var(--text-muted);margin-top:2px">' + (r.ingredients||[]).length + ' Zutaten \u00B7 ' + (r.servings||1) + ' Portionen' + (r.prepTime ? ' \u00B7 ' + r.prepTime + ' min' : '') + '</p></div>' +
        (r.isShared ? '<span style="font-size:9px;padding:2px 7px;border-radius:6px;background:rgba(163,201,168,0.12);color:var(--primary-hex);flex-shrink:0;margin-left:8px">\u2713 Geteilt</span>' : '') + '</div>' +
        '<div style="display:flex;gap:8px"><span style="font-size:11px;color:var(--primary-hex);font-weight:600">' + Math.round(n.calories||0) + ' kcal</span><span style="font-size:11px;color:#4ab8d4">P ' + Math.round(n.protein||0) + 'g</span><span style="font-size:11px;color:#7ec84a">K ' + Math.round(n.carbs||0) + 'g</span><span style="font-size:11px;color:#d4733a">F ' + Math.round(n.fat||0) + 'g</span></div>' +
        '<div style="display:flex;gap:6px;margin-top:10px">' +
        '<button onclick="window._openRecipeDetail(\'' + r.id + '\')" class="pointer-events-auto" aria-label="Details" style="flex:1;padding:7px;border-radius:8px;font-size:11px;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">Details</button>' +
        '<button onclick="window.openRecipeEditor(\'' + r.id + '\')" class="pointer-events-auto" aria-label="Bearbeiten" style="flex:1;padding:7px;border-radius:8px;font-size:11px;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">Bearbeiten</button>' +
        (!r.isShared ? '<button onclick="window._shareRecipeToFeed(\'' + r.id + '\')" class="pointer-events-auto" aria-label="Teilen" style="flex:1;padding:7px;border-radius:8px;font-size:11px;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">Teilen</button>' : '') +
        '</div></div>';
    }).join('');
  };

  // ============================================================
  // SUPPLEMENT TRACKING — Phase 4
  // ============================================================

  window._SUPPLEMENT_KEY = 'base_supplements';
  window._SUPPLEMENT_PRESETS = [
    {name:'Kreatin Monohydrat',dose:'5g',timing:'t\u00E4glich',icon:'\u26A1',note:'ISSN Grade A'},
    {name:'Protein Pulver',dose:'25-40g',timing:'post-workout',icon:'\uD83D\uDCAA',note:'Bei Bedarf'},
    {name:'Vitamin D3',dose:'2000 IU',timing:'morgens',icon:'\u2600\uFE0F',note:'Okt-Apr empfohlen'},
    {name:'Omega-3 / Fisch\u00F6l',dose:'2g EPA+DHA',timing:'mit Mahlzeit',icon:'\uD83D\uDC1F',note:'Entz\u00FCndungsreduktion'},
    {name:'Magnesium',dose:'400mg',timing:'abends',icon:'\uD83C\uDF19',note:'Schlaf, Kr\u00E4mpfe'},
    {name:'Zink',dose:'10mg',timing:'morgens',icon:'\uD83D\uDD2C',note:'Immunsystem'},
    {name:'Koffein',dose:'3-6mg/kg',timing:'pre-workout',icon:'\u2615',note:'ISSN Grade A'},
    {name:'Beta-Alanin',dose:'3.2-6.4g',timing:'t\u00E4glich',icon:'\uD83D\uDD25',note:'Kribbeln harmlos'},
    {name:'Citrullin Malat',dose:'6-8g',timing:'60 min pre-workout',icon:'\uD83C\uDFCB',note:'Pump + Ausdauer'},
    {name:'Ashwagandha',dose:'300-600mg',timing:'abends',icon:'\uD83C\uDF3F',note:'Moderate Evidenz'}
  ];

  window._getSupplements = function() { return JSON.parse(localStorage.getItem(window._SUPPLEMENT_KEY) || '[]'); };
  window._saveSupplements = function(supplements) { localStorage.setItem(window._SUPPLEMENT_KEY, JSON.stringify(supplements)); };

  window._addSupplement = function(supp) {
    var supplements = window._getSupplements();
    supp.id = 'supp_' + Date.now(); supp.createdAt = new Date().toISOString(); supp.takenDates = [];
    supplements.push(supp); window._saveSupplements(supplements); return supp;
  };
  window._deleteSupplement = function(id) { window._saveSupplements(window._getSupplements().filter(function(s) { return s.id !== id; })); };

  window._toggleSuppTaken = function(id) {
    var today = new Date().toISOString().split('T')[0];
    var supps = window._getSupplements().map(function(s) {
      if (s.id !== id) return s;
      var dates = s.takenDates || [];
      if (dates.indexOf(today) !== -1) { s.takenDates = dates.filter(function(d) { return d !== today; }); }
      else { dates.push(today); s.takenDates = dates.slice(-30); if (window.awardXP) window.awardXP('habit'); }
      return s;
    });
    window._saveSupplements(supps); window._renderSupplementTracker();
  };

  window._isSuppTakenToday = function(supp) { var today = new Date().toISOString().split('T')[0]; return (supp.takenDates || []).indexOf(today) !== -1; };

  window._getSuppStreak = function(supp) {
    var streak = 0; var dates = (supp.takenDates || []).sort(); if (dates.length === 0) return 0;
    var today = new Date();
    for (var i = 0; i < 30; i++) { var d = new Date(today - i * 86400000).toISOString().split('T')[0]; if (dates.indexOf(d) !== -1) streak++; else if (i > 0) break; }
    return streak;
  };

  window._scheduleSuppReminder = function(suppId, time) {
    var supps = window._getSupplements().map(function(s) { if (s.id === suppId) s.reminderTime = time; return s; });
    window._saveSupplements(supps);
    if ('Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();
    window.showToast('Erinnerung f\u00FCr ' + time + ' Uhr gesetzt');
  };
  window._removeSuppReminder = function(suppId) {
    var supps = window._getSupplements().map(function(s) { if (s.id === suppId) delete s.reminderTime; return s; });
    window._saveSupplements(supps); window.showToast('Erinnerung entfernt');
  };

  window._checkSuppReminders = function() {
    var now = new Date();
    var hhmm = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    window._getSupplements().forEach(function(s) {
      if (!s.reminderTime || s.reminderTime !== hhmm || window._isSuppTakenToday(s)) return;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('BASE \u2014 Supplement Reminder', { body: '\u23F0 ' + s.name + ' \u2014 ' + s.dose, icon: '/icons/icon-192.png', tag: 'supp_' + s.id });
      }
      window.showToast(window._escapeHtml(s.name) + ' \u2014 ' + s.dose, null, null, null, 8000);
    });
  };

  window._renderSupplementTracker = function() {
    var container = document.getElementById('supplementTrackerContainer'); if (!container) return;
    var supps = window._getSupplements();
    var takenCount = supps.filter(function(s) { return window._isSuppTakenToday(s); }).length;

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
      '<div><p style="font-size:22px;font-weight:700;color:var(--text-main)">' + takenCount + '/' + supps.length + '</p>' +
      '<p style="font-size:10px;color:var(--text-muted)">heute eingenommen</p></div>' +
      (supps.length > 0 ? '<div style="width:56px;height:56px;position:relative"><svg width="56" height="56" style="transform:rotate(-90deg)"><circle cx="28" cy="28" r="22" fill="none" stroke="var(--border-hex)" stroke-width="5"/><circle cx="28" cy="28" r="22" fill="none" stroke="var(--primary-hex)" stroke-width="5" stroke-dasharray="' + Math.round(138.2*takenCount/supps.length) + ' 138.2" stroke-linecap="round"/></svg><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--primary-hex)">' + Math.round(takenCount/supps.length*100) + '%</div></div>' : '') +
      '</div>';

    if (supps.length === 0) {
      html += '<div style="text-align:center;padding:20px 0"><p style="font-size:24px;margin-bottom:8px">\uD83D\uDC8A</p><p style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:4px">Noch keine Supplemente</p><p style="font-size:11px;color:var(--text-muted);margin-bottom:14px">F\u00FCge deine Supplemente hinzu</p><button onclick="window.openSuppEditor()" class="pointer-events-auto" aria-label="Supplement hinzufuegen" style="padding:9px 20px;border-radius:10px;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex);font-size:12px;font-weight:700;cursor:pointer">+ Supplement hinzuf\u00FCgen</button></div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">';
      supps.forEach(function(s) {
        var taken = window._isSuppTakenToday(s);
        var streak = window._getSuppStreak(s);
        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--inner-bg-hex);border:1px solid ' + (taken ? 'rgba(163,201,168,0.3)' : 'var(--border-hex)') + ';border-radius:11px;transition:border-color .2s">' +
          '<button onclick="window._toggleSuppTaken(\'' + s.id + '\')" class="pointer-events-auto" aria-label="' + (taken?'R\u00FCckg\u00E4ngig':'Genommen') + '" style="width:28px;height:28px;border-radius:8px;flex-shrink:0;border:1.5px solid ' + (taken ? 'var(--primary-hex)' : 'var(--border-hex)') + ';background:' + (taken ? 'rgba(163,201,168,0.2)' : 'transparent') + ';font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--primary-hex)">' + (taken ? '\u2713' : '') + '</button>' +
          '<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px"><span style="font-size:14px">' + (s.icon||'\uD83D\uDC8A') + '</span><p style="font-size:13px;font-weight:600;color:' + (taken ? 'var(--text-muted)' : 'var(--text-main)') + ';' + (taken ? 'text-decoration:line-through;' : '') + '">' + window._escapeHtml(s.name) + '</p>' + (streak >= 3 ? '<span style="font-size:10px;color:#e8c86a">\uD83D\uDD25' + streak + '</span>' : '') + '</div>' +
          '<p style="font-size:10px;color:var(--text-muted)">' + window._escapeHtml(s.dose||'') + (s.timing ? ' \u00B7 ' + window._escapeHtml(s.timing) : '') + (s.reminderTime ? ' \u00B7 \u23F0 ' + s.reminderTime : '') + '</p></div>' +
          '<button onclick="window._openSuppOptions(\'' + s.id + '\')" class="pointer-events-auto" aria-label="Optionen" style="color:var(--text-muted);background:none;border:none;font-size:18px;cursor:pointer;flex-shrink:0">\u22EF</button></div>';
      });
      html += '</div>';
      html += '<div style="display:flex;gap:8px"><button onclick="window.openSuppEditor()" class="pointer-events-auto" aria-label="Hinzufuegen" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">+ Hinzuf\u00FCgen</button>' +
        '<button onclick="window._analyzeSupplementStack()" class="pointer-events-auto" aria-label="KI Analyse" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">KI Stack-Analyse</button></div>';
    }
    container.innerHTML = html;
  };

  window._openSuppOptions = function(suppId) {
    var s = window._getSupplements().find(function(x) { return x.id === suppId; }); if (!s) return;
    window.showModal(window._escapeHtml(s.name),
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">' +
      '<div style="padding:10px 12px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:10px"><p style="font-size:11px;color:var(--text-muted);margin-bottom:6px">\u23F0 Erinnerung</p><div style="display:flex;gap:8px;align-items:center"><input type="time" id="suppReminderTime" value="' + (s.reminderTime||'08:00') + '" class="pointer-events-auto" aria-label="Erinnerungszeit" style="flex:1;padding:7px 10px;border-radius:8px;background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main);font-size:13px;outline:none"/><button onclick="window._scheduleSuppReminder(\'' + suppId + '\',document.getElementById(\'suppReminderTime\').value);window.toggleModal(\'customModal\')" class="pointer-events-auto" aria-label="Setzen" style="padding:7px 14px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex)">Setzen</button>' + (s.reminderTime ? '<button onclick="window._removeSuppReminder(\'' + suppId + '\');window.toggleModal(\'customModal\')" class="pointer-events-auto" aria-label="Entfernen" style="padding:7px 10px;border-radius:8px;font-size:11px;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">Entf.</button>' : '') + '</div></div>' +
      '<button onclick="window._deleteSupplement(\'' + suppId + '\');window.toggleModal(\'customModal\');window._renderSupplementTracker()" class="pointer-events-auto w-full" aria-label="Loeschen" style="padding:10px;border-radius:10px;font-size:13px;cursor:pointer;background:rgba(232,138,138,0.08);border:1px solid rgba(232,138,138,0.2);color:#e88a8a">Supplement l\u00F6schen</button></div>', false);
  };

  window._analyzeSupplementStack = async function() {
    var supps = window._getSupplements();
    if (supps.length === 0) { window.showToast('F\u00FCge erst Supplemente hinzu', 'warn'); return; }
    var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
    var stackList = supps.map(function(s) { return '- ' + s.name + ': ' + s.dose + (s.timing ? ', Timing: ' + s.timing : ''); }).join('\n');
    var prompt = 'Du bist ein Sportsernaehrungs-Experte (ISSN zertifiziert).\n\nAnalysiere diesen Supplement-Stack:\n' + stackList + '\n\nNutzer-Profil: Ziel: ' + (profile.goal||'nicht angegeben') + ', Gewicht: ' + (profile.weight||'?') + 'kg\n\nAntworte auf Deutsch:\n1. SYNERGIEN: Welche verstaerken sich?\n2. KONFLIKTE: Timing-Konflikte oder Wechselwirkungen?\n3. OPTIMIERUNG: Was am Timing aendern?\n4. EVIDENZ: ISSN Grade A/B/C pro Supplement\n5. FAZIT: Stack-Rating 1-10\n\nNur ISSN/EFSA Evidenz. Max 300 Woerter.';
    var btn = document.querySelector('[onclick*="_analyzeSupplementStack"]');
    if (btn) btn.textContent = 'Analysiere...';
    try {
      var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, userId: window._getAiUserId ? window._getAiUserId() : '' }) });
      var data = await res.json();
      var text = window._extractGeminiText(data, '');
      window.showModal('KI Stack-Analyse', '<div style="font-size:12px;line-height:1.7;color:var(--text-main);max-height:60vh;overflow-y:auto">' + window._sanitizeAIHtml(text) + '</div>', false);
    } catch(e) { window.showToast('KI Analyse fehlgeschlagen', 'error'); }
    finally { if (btn) btn.textContent = 'KI Stack-Analyse'; }
  };

  // Supplement Editor
  window.openSuppEditor = function() {
    var presetList = document.getElementById('suppPresetList');
    if (presetList) {
      presetList.innerHTML = window._SUPPLEMENT_PRESETS.map(function(p) {
        var added = window._getSupplements().some(function(s) { return s.name.toLowerCase() === p.name.toLowerCase(); });
        return '<button onclick="window._addPresetSupp(' + JSON.stringify(p).replace(/"/g,'&quot;').replace(/'/g,'&#39;') + ')" class="pointer-events-auto" aria-label="' + window._escapeHtml(p.name) + '" ' + (added ? 'disabled ' : '') + 'style="padding:6px 10px;border-radius:9px;font-size:11px;font-weight:600;cursor:' + (added?'default':'pointer') + ';background:' + (added ? 'rgba(163,201,168,0.08)' : 'var(--inner-bg-hex)') + ';border:1px solid ' + (added ? 'rgba(163,201,168,0.2)' : 'var(--border-hex)') + ';color:' + (added ? 'var(--primary-hex)' : 'var(--text-muted)') + '">' + p.icon + ' ' + window._escapeHtml(p.name) + (added ? ' \u2713' : '') + '</button>';
      }).join('');
    }
    ['supp_name','supp_dose'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
    window.toggleModal('suppEditorModal');
  };

  window._addPresetSupp = function(preset) {
    window._addSupplement({ name: preset.name, dose: preset.dose, timing: preset.timing, icon: preset.icon, note: preset.note });
    window.toggleModal('suppEditorModal');
    window._renderSupplementTracker();
    window.showToast(preset.icon + ' ' + preset.name + ' hinzugef\u00FCgt!');
  };

  window._saveSuppFromEditor = function() {
    var name = (document.getElementById('supp_name')||{}).value || '';
    if (!name.trim()) { window.showToast('Bitte Namen eingeben', 'error'); return; }
    var supp = { name: name.trim(), dose: (document.getElementById('supp_dose')||{}).value || '', timing: (document.getElementById('supp_timing')||{}).value || '', reminderTime: (document.getElementById('supp_reminder')||{}).value || null, icon: '\uD83D\uDC8A' };
    window._addSupplement(supp);
    window.toggleModal('suppEditorModal');
    window._renderSupplementTracker();
    window.showToast(window._escapeHtml(supp.name) + ' gespeichert!');
  };

  // ============================================================
  // MIKRONÄHRSTOFF-TRACKING — Phase 5
  // ============================================================

  window._MICRONUTRIENTS = [
    {id:'calcium',label:'Calcium',unit:'mg',dv:1000,icon:'\uD83E\uDDB4',sources:'Milch, K\u00E4se, Brokkoli'},
    {id:'iron',label:'Eisen',unit:'mg',dv:14,icon:'\uD83E\uDE78',sources:'Fleisch, H\u00FClsenfr\u00FCchte, Spinat'},
    {id:'magnesium',label:'Magnesium',unit:'mg',dv:375,icon:'\u26A1',sources:'N\u00FCsse, Vollkorn'},
    {id:'zinc',label:'Zink',unit:'mg',dv:10,icon:'\uD83D\uDD2C',sources:'Fleisch, K\u00FCrbiskerne'},
    {id:'potassium',label:'Kalium',unit:'mg',dv:2000,icon:'\uD83C\uDF4C',sources:'Bananen, Kartoffeln'},
    {id:'sodium',label:'Natrium',unit:'mg',dv:2000,icon:'\uD83E\uDDC2',sources:'Salz',warn:true},
    {id:'vitaminC',label:'Vitamin C',unit:'mg',dv:80,icon:'\uD83C\uDF4A',sources:'Paprika, Zitrusfr\u00FCchte'},
    {id:'vitaminD',label:'Vitamin D',unit:'\u00B5g',dv:15,icon:'\u2600\uFE0F',sources:'Fettfisch, Sonnenlicht'},
    {id:'vitaminB12',label:'Vitamin B12',unit:'\u00B5g',dv:2.4,icon:'\uD83D\uDC89',sources:'Fleisch, Fisch, Eier'},
    {id:'vitaminA',label:'Vitamin A',unit:'\u00B5g',dv:800,icon:'\uD83D\uDC41',sources:'Leber, Karotten'},
    {id:'vitaminE',label:'Vitamin E',unit:'mg',dv:12,icon:'\uD83C\uDF3B',sources:'Pflanzen\u00F6le, N\u00FCsse'},
    {id:'fiber',label:'Ballaststoffe',unit:'g',dv:25,icon:'\uD83C\uDF3E',sources:'H\u00FClsenfr\u00FCchte, Vollkorn'},
    {id:'omega3',label:'Omega-3',unit:'g',dv:2,icon:'\uD83D\uDC1F',sources:'Lachs, Leinsamen, Waln\u00FCsse'}
  ];

  window._OFF_MICRO_MAP = {
    calcium:['calcium_100g','calcium'],iron:['iron_100g','iron'],magnesium:['magnesium_100g','magnesium'],
    zinc:['zinc_100g','zinc'],potassium:['potassium_100g','potassium'],sodium:['sodium_100g','sodium'],
    vitaminC:['vitamin-c_100g','vitamin-c'],vitaminD:['vitamin-d_100g','vitamin-d'],
    vitaminB12:['vitamin-b12_100g','vitamin-b12'],vitaminA:['vitamin-a_100g','vitamin-a'],
    vitaminE:['vitamin-e_100g','vitamin-e'],fiber:['fiber_100g','fiber'],omega3:['omega-3-fat_100g','omega-3-fat']
  };

  window._extractMicros = function(foodItem, mult) {
    mult = mult || 1; var micros = {}; var n = foodItem.nutriments || foodItem;
    window._MICRONUTRIENTS.forEach(function(micro) {
      var keys = window._OFF_MICRO_MAP[micro.id] || []; var val = 0;
      keys.forEach(function(k) { if (n[k] && !val) val = parseFloat(n[k]) || 0; });
      if (!val && foodItem['nf_' + micro.id]) val = parseFloat(foodItem['nf_' + micro.id]) || 0;
      if (val) micros[micro.id] = Math.round(val * mult * 100) / 100;
    });
    return micros;
  };

  window._getDayMicros = function(dateStr) {
    var log = window._getFoodLog(dateStr); var totals = {};
    window._MICRONUTRIENTS.forEach(function(m) { totals[m.id] = 0; });
    Object.values(log).forEach(function(meal) {
      (meal || []).forEach(function(entry) {
        if (entry.micros) Object.keys(entry.micros).forEach(function(key) { if (totals[key] !== undefined) totals[key] += entry.micros[key] || 0; });
      });
    });
    return totals;
  };

  window._getWeeklyMicroAvg = function() {
    var weekAvg = {}; window._MICRONUTRIENTS.forEach(function(m) { weekAvg[m.id] = 0; });
    var days = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      var log = window._getFoodLog(d);
      if (!Object.values(log).some(function(m) { return m && m.length > 0; })) continue;
      days++; var micros = window._getDayMicros(d);
      Object.keys(micros).forEach(function(key) { weekAvg[key] += micros[key]; });
    }
    if (days > 0) Object.keys(weekAvg).forEach(function(key) { weekAvg[key] = Math.round(weekAvg[key] / days * 10) / 10; });
    return { averages: weekAvg, days: days };
  };

  window._renderMicronutrientDashboard = function(containerId) {
    var container = document.getElementById(containerId || 'micronutrientContainer'); if (!container) return;
    var dateStr = window._nutritionCurrentDate || new Date().toISOString().split('T')[0];
    var todayMicros = window._getDayMicros(dateStr);
    var weekData = window._getWeeklyMicroAvg(); var weekAvg = weekData.averages; var trackedDays = weekData.days;
    var deficits = window._MICRONUTRIENTS.filter(function(m) { return !m.warn && weekAvg[m.id] < m.dv * 0.6 && weekAvg[m.id] > 0; }).sort(function(a, b) { return (weekAvg[a.id]/a.dv) - (weekAvg[b.id]/b.dv); });
    var html = '';
    if (deficits.length > 0 && trackedDays >= 3) {
      html += '<div style="padding:10px 12px;background:rgba(232,200,106,0.08);border:1px solid rgba(232,200,106,0.2);border-radius:10px;margin-bottom:12px"><p style="font-size:10px;font-weight:700;color:#e8c86a;margin-bottom:4px">\u26A0\uFE0F Diese Woche unterversorgt</p>' +
        deficits.slice(0,3).map(function(m) { var pct = Math.round(weekAvg[m.id]/m.dv*100); return '<p style="font-size:11px;color:var(--text-main);margin-top:3px">' + m.icon + ' ' + m.label + ': nur ' + pct + '% \u00B7 <span style="color:var(--text-muted)">' + m.sources + '</span></p>'; }).join('') + '</div>';
    }
    html += '<div style="display:flex;gap:5px;margin-bottom:10px"><button onclick="window._microTab(\'today\',this)" id="mtab_today" class="pointer-events-auto" aria-label="Heute" style="flex:1;padding:6px;border-radius:8px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">Heute</button><button onclick="window._microTab(\'week\',this)" id="mtab_week" class="pointer-events-auto" aria-label="Wochenschnitt" style="flex:1;padding:6px;border-radius:8px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\u00D8 ' + trackedDays + ' Tage</button></div>';
    html += '<div id="microList">' + window._renderMicroList(todayMicros) + '</div>';
    if (trackedDays >= 3) html += '<button onclick="window._generateMicroAnalysis()" class="pointer-events-auto w-full" aria-label="KI Analyse" style="margin-top:10px;padding:10px;border-radius:11px;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex);font-size:12px;font-weight:700;cursor:pointer">KI Mikron\u00E4hrstoff-Analyse</button>';
    else html += '<p style="font-size:10px;color:var(--text-muted);text-align:center;margin-top:8px">Tracke ' + (3-trackedDays) + ' weitere Tage f\u00FCr KI-Analyse</p>';
    container.innerHTML = html;
  };

  window._renderMicroList = function(micros) {
    return window._MICRONUTRIENTS.map(function(m) {
      var val = micros[m.id] || 0; var pct = Math.min(100, Math.round(val / m.dv * 100)); var hasData = val > 0;
      var color = m.warn ? (pct > 100 ? '#e88a8a' : '#a3c9a8') : (pct >= 80 ? '#a3c9a8' : pct >= 50 ? '#e8c86a' : hasData ? '#e88a8a' : 'var(--border-hex)');
      return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border-hex)">' +
        '<span style="font-size:14px;width:20px;text-align:center;flex-shrink:0">' + m.icon + '</span>' +
        '<span style="font-size:11px;font-weight:500;color:var(--text-main);width:90px;flex-shrink:0">' + m.label + '</span>' +
        '<div style="flex:1;height:5px;background:var(--border-hex);border-radius:3px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + color + ';border-radius:3px;transition:width .5s ease"></div></div>' +
        '<span style="font-size:10px;color:' + color + ';font-weight:600;min-width:38px;text-align:right">' + (hasData ? pct + '%' : '\u2014') + '</span></div>';
    }).join('');
  };

  window._microTab = function(tab, btn) {
    document.querySelectorAll('[id^="mtab_"]').forEach(function(b) { b.style.background = 'transparent'; b.style.borderColor = 'var(--border-hex)'; b.style.color = 'var(--text-muted)'; });
    if (btn) { btn.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 88%)'; btn.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 65%)'; btn.style.color = 'var(--primary-hex)'; }
    var micros = tab === 'week' ? window._getWeeklyMicroAvg().averages : window._getDayMicros(window._nutritionCurrentDate || new Date().toISOString().split('T')[0]);
    var list = document.getElementById('microList'); if (list) list.innerHTML = window._renderMicroList(micros);
  };

  window._generateMicroAnalysis = async function() {
    var weekData = window._getWeeklyMicroAvg(); var weekAvg = weekData.averages;
    var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
    var microStatus = window._MICRONUTRIENTS.map(function(m) { var pct = weekAvg[m.id] > 0 ? Math.round(weekAvg[m.id]/m.dv*100) : 0; return m.label + ': ' + pct + '% (' + weekAvg[m.id] + m.unit + '/' + m.dv + m.unit + ')'; }).join('\n');
    var prompt = 'Du bist Sporternaehrungs-Experte (ISSN/EFSA).\n\nWoechentlicher Mikronaehrstoff-Status (\u00D8 ' + weekData.days + ' Tage):\n' + microStatus + '\n\nAthlet: ' + (profile.weight||'?') + 'kg, Ziel: ' + (profile.goal||'?') + ', Ernaehrung: ' + (profile.dietType||'omnivor') + '\n\nAnalysiere auf Deutsch (max 250 Woerter):\n1. TOP 3 DEFIZITE\n2. VERBINDUNG ZU TRAINING\n3. PRAKTISCHE LOESUNG: Je Defizit 2 Lebensmittel\n4. SUPPLEMENT-TIPP\n\nNur EFSA/DGE Referenzwerte.';
    var btn = document.querySelector('[onclick*="_generateMicroAnalysis"]'); if (btn) btn.textContent = 'Analysiere...';
    try {
      var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, userId: window._getAiUserId ? window._getAiUserId() : '' }) });
      var data = await res.json(); var text = window._extractGeminiText(data, '');
      window.showModal('Mikron\u00E4hrstoff-Analyse', '<div style="font-size:12px;line-height:1.7;color:var(--text-main);max-height:60vh;overflow-y:auto">' + window._sanitizeAIHtml(text) + '</div>', false);
    } catch(e) { window.showToast('Analyse fehlgeschlagen', 'error'); }
    finally { if (btn) btn.textContent = 'KI Mikron\u00E4hrstoff-Analyse'; }
  };

  // KI WOCHEN-ANALYSE
  window._generateWeeklyNutritionAnalysis = async function() {
    var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
    var targets = JSON.parse(localStorage.getItem('base_nutrition_targets') || 'null');
    var acwr = window._calculateACWR ? window._calculateACWR() : null;
    var macroSum = { calories:0, protein:0, carbs:0, fat:0, days:0 };
    for (var i = 0; i < 7; i++) { var d = new Date(Date.now()-i*86400000).toISOString().split('T')[0]; var t = window._getDayTotals(d); if (t.entries > 0) { macroSum.calories += t.calories; macroSum.protein += t.protein; macroSum.carbs += t.carbs; macroSum.fat += t.fat; macroSum.days++; } }
    if (macroSum.days < 3) { window.showToast('Tracke mindestens 3 Tage f\u00FCr Wochen-Analyse', 'warn'); return; }
    var macroAvg = { calories: Math.round(macroSum.calories/macroSum.days), protein: Math.round(macroSum.protein/macroSum.days*10)/10, carbs: Math.round(macroSum.carbs/macroSum.days*10)/10, fat: Math.round(macroSum.fat/macroSum.days*10)/10 };
    var prompt = 'Du bist KI-Coach fuer Training und Ernaehrung.\n\n7-TAGE RUECKBLICK:\n\nMAKROS (\u00D8 ' + macroSum.days + ' Tage):\n- Kalorien: ' + macroAvg.calories + ' kcal' + (targets ? ' / Ziel: ' + targets.calories : '') + '\n- Protein: ' + macroAvg.protein + 'g' + (targets ? ' / Ziel: ' + targets.protein + 'g' : '') + '\n- Carbs: ' + macroAvg.carbs + 'g\n- Fett: ' + macroAvg.fat + 'g\n' + (acwr && acwr.acwr ? '\nTRAINING (ACWR): ' + acwr.acwr + ' \u2014 ' + acwr.label + '\n' : '') + '\nATHLET: ' + (profile.weight||'?') + 'kg, Ziel: ' + (profile.goal||'?') + '\n\nAntworte auf Deutsch (max 300 Woerter):\n1. MAKRO-BILANZ\n2. TRAINING-ERNAEHRUNG SYNC\n3. TOP 3 HANDLUNGEN fuer naechste Woche\n4. PROGNOSE\n\nNur evidenzbasierte Aussagen.';
    var btn = document.querySelector('[onclick*="_generateWeeklyNutritionAnalysis"]'); if (btn) { btn.style.opacity = '0.6'; btn.textContent = 'Analysiere...'; }
    try {
      var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, userId: window._getAiUserId ? window._getAiUserId() : '' }) });
      var data = await res.json(); var text = window._extractGeminiText(data, '');
      window.showModal('Wochen-Analyse', '<div style="font-size:12px;line-height:1.7;color:var(--text-main);max-height:60vh;overflow-y:auto">' + window._sanitizeAIHtml(text) + '</div>', false);
    } catch(e) { window.showToast('Analyse fehlgeschlagen', 'error'); }
    finally { if (btn) { btn.style.opacity = '1'; btn.textContent = 'Wochen-Analyse'; } }
  };

  // ============================================================
  // TRAINING-NUTRITION SYNC — Phase 7
  // ============================================================

  window._triggerPostWorkoutNutrition = function(workoutData) {
    var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
    var targets = JSON.parse(localStorage.getItem('base_nutrition_targets') || 'null');
    if (!profile.setupComplete || !targets) return;

    var volume = 0; var duration = workoutData.workoutDuration || workoutData.sessionDuration || 45;
    if (workoutData.setDetails && workoutData.setDetails.length > 0) {
      workoutData.setDetails.forEach(function(s) { if (s.type === 'warmup') return; volume += (parseFloat(s.weight)||0) * (parseInt(s.reps)||0); });
    }

    var today = new Date().toISOString().split('T')[0];
    var log = window._getFoodLog ? window._getFoodLog(today) : {};
    var lastMealTime = null;
    Object.values(log).forEach(function(meal) { (meal||[]).forEach(function(e) { if (e.addedAt) { var t = new Date(e.addedAt).getTime(); if (!lastMealTime || t > lastMealTime) lastMealTime = t; } }); });
    var hoursSinceLastMeal = lastMealTime ? (Date.now() - lastMealTime) / 3600000 : 4;

    var todayTotals = window._getDayTotals ? window._getDayTotals(today) : { protein: 0 };
    var proteinRemaining = Math.max(0, targets.protein - todayTotals.protein);
    var tip = '';

    if (hoursSinceLastMeal > 3) {
      tip = 'Seit ' + Math.round(hoursSinceLastMeal) + 'h nichts gegessen \u2014 jetzt ' + targets.proteinPerMeal + 'g Protein aufnehmen (Fenster: 2h, Kerksick ISSN 2017).';
    } else {
      tip = 'Pre-Workout gegessen \u2713 \u2014 Protein-Fenster breit (4-6h). Noch ' + Math.round(proteinRemaining) + 'g Protein f\u00FCr dein Tagesziel.';
    }
    if (volume > 6000 || (typeof duration === 'number' && duration > 3600)) {
      tip += ' Intensive Session: +40-80g Kohlenhydrate f\u00FCr Glykogen (Burke ISSN).';
    }

    window.showToast(tip, null, 'Details', function() { window._showPostWorkoutNutritionDetail(workoutData, targets, tip); }, 10000);
  };

  window._showPostWorkoutNutritionDetail = function(workout, targets, tip) {
    var today = new Date().toISOString().split('T')[0];
    var todayTotals = window._getDayTotals ? window._getDayTotals(today) : { protein: 0, calories: 0 };
    window.showModal('Post-Workout Ern\u00E4hrung',
      '<div style="font-size:12px;line-height:1.6;color:var(--text-main)">' +
      '<div style="padding:10px 12px;background:rgba(163,201,168,0.08);border:1px solid rgba(163,201,168,0.2);border-radius:10px;margin-bottom:12px"><p style="font-size:11px;color:var(--text-muted)">Empfehlung</p><p style="font-size:12px;color:var(--text-main);margin-top:4px">' + window._escapeHtml(tip) + '</p></div>' +
      '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:8px">Tagesstand</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' +
      [{l:'Protein',v:Math.round(todayTotals.protein)+'g',t:targets.protein+'g',c:'#4ab8d4'},{l:'Kalorien',v:todayTotals.calories,t:targets.calories,c:'var(--primary-hex)'}].map(function(m) {
        var pct = Math.min(100, Math.round(parseFloat(m.v)/parseFloat(m.t)*100));
        return '<div style="padding:8px;background:var(--inner-bg-hex);border-radius:9px;border:1px solid var(--border-hex)"><p style="font-size:13px;font-weight:700;color:'+m.c+'">'+m.v+'</p><p style="font-size:9px;color:var(--text-muted);margin-bottom:4px">'+m.l+' / '+m.t+'</p><div style="height:3px;background:var(--border-hex);border-radius:2px"><div style="width:'+pct+'%;height:100%;background:'+m.c+';border-radius:2px"></div></div></div>';
      }).join('') + '</div>' +
      '<button onclick="window.openFoodSearch(\'postworkout\',\'' + today + '\');window.toggleModal(\'customModal\')" class="pointer-events-auto w-full" aria-label="Post-Workout loggen" style="padding:11px;border-radius:11px;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex);font-size:13px;font-weight:700;cursor:pointer">+ Post-Workout Mahlzeit loggen</button></div>', false);
  };

  // Deload-Nutrition Auto-Anpassung
  window._checkDeloadNutrition = function() {
    var activePlan = JSON.parse(localStorage.getItem('base_active_plan') || 'null');
    var isDeload = false;
    if (activePlan && activePlan.planData) {
      var currentWeek = window._getCurrentMesoWeek ? window._getCurrentMesoWeek() : null;
      if (currentWeek && activePlan.planData.weeks && activePlan.planData.weeks[currentWeek - 1]) {
        isDeload = !!activePlan.planData.weeks[currentWeek - 1].isDeload;
      }
    }
    var acwr = window._calculateACWR ? window._calculateACWR() : null;
    var acwrDeload = acwr && acwr.status === 'danger';
    if (!isDeload && !acwrDeload) return null;
    var targets = JSON.parse(localStorage.getItem('base_nutrition_targets') || 'null');
    if (!targets) return null;
    return { calories: Math.round(targets.calories * 0.85), protein: targets.protein, carbs: Math.round(targets.carbs * 0.7), fat: Math.round(targets.fat * 0.9), proteinPerMeal: targets.proteinPerMeal, isDeload: true, reason: isDeload ? 'Deload-Woche' : 'ACWR \u00DCberbelastung' };
  };

  window._getEffectiveNutritionTargets = function() {
    var deload = window._checkDeloadNutrition();
    if (deload) return deload;
    return JSON.parse(localStorage.getItem('base_nutrition_targets') || 'null');
  };

  window._renderDeloadBanner = function() {
    var deload = window._checkDeloadNutrition();
    if (!deload) return '';
    return '<div style="padding:10px 12px;background:rgba(138,175,232,0.08);border:1px solid rgba(138,175,232,0.2);border-radius:10px;margin-bottom:12px"><p style="font-size:11px;font-weight:700;color:#8aafe8;margin-bottom:2px">' + deload.reason + ' \u2014 Ziele angepasst</p><p style="font-size:10px;color:var(--text-muted)">Kalorien -15% \u00B7 Protein gleich \u00B7 Carbs reduziert (Israetel/RP)</p></div>';
  };

  // Meal Prep Planer
  window._generateMealPrepPlan = async function() {
    var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
    var targets = window._getEffectiveNutritionTargets();
    if (!targets) { window.showToast('Bitte erst Ern\u00E4hrungsprofil einrichten', 'warn'); return; }
    var weekWorkouts = (window.workouts || []).filter(function(w) { var d = new Date(w.date); var now = new Date(); var ws = new Date(now); ws.setDate(now.getDate() - now.getDay() + 1); ws.setHours(0,0,0,0); var we = new Date(ws); we.setDate(ws.getDate()+6); return w.archived && d >= ws && d <= we; });
    var trainingDays = weekWorkouts.length;
    var deload = window._checkDeloadNutrition(); var isDeload = !!deload;
    var prompt = 'Du bist Ernaehrungscoach. Erstelle einen Meal-Prep Plan fuer Sonntag.\n\nDIESE WOCHE:\n- Trainingstage: ' + trainingDays + 'x\n' + (isDeload ? '- DELOAD WOCHE\n' : '') + '\nZIELE:\n- Kalorien: ' + targets.calories + ' kcal/Tag\n- Protein: ' + targets.protein + 'g/Tag\n- Ernaehrung: ' + (profile.dietType||'Alles') + '\n' + (profile.allergies && profile.allergies.length > 0 ? '- Allergien: ' + profile.allergies.join(', ') + '\n' : '') + '\nERSTELLE:\n1. EINKAUFSLISTE (5 Werktage, mit Mengen)\n2. PREP-PLAN (Sonntag, 2-3h, Reihenfolge)\n3. TAGES-VERTEILUNG (Trainings- vs Ruhetage)\n\nPraktisch, max 300 Woerter. Deutsch.';
    var btn = document.querySelector('[onclick*="_generateMealPrepPlan"]'); if (btn) { btn.style.opacity = '0.6'; btn.textContent = 'Erstelle...'; }
    try {
      var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, userId: window._getAiUserId ? window._getAiUserId() : '' }) });
      var data = await res.json(); var plan = window._extractGeminiText(data, '');
      localStorage.setItem('base_meal_prep_plan', JSON.stringify({ plan: plan, week: new Date().toISOString().split('T')[0] }));
      window.showModal('Meal Prep Plan', '<div style="font-size:12px;line-height:1.7;color:var(--text-main);white-space:pre-wrap;max-height:65vh;overflow-y:auto">' + window._sanitizeAIHtml(plan) + '</div><button onclick="navigator.clipboard&&navigator.clipboard.writeText(JSON.parse(localStorage.getItem(\'base_meal_prep_plan\')||\'{}\').plan||\'\')" class="pointer-events-auto w-full" aria-label="Kopieren" style="margin-top:12px;padding:11px;border-radius:11px;font-size:13px;font-weight:600;cursor:pointer;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)">In Zwischenablage kopieren</button>', false);
    } catch(e) { window.showToast('Fehler: ' + e.message, 'error'); }
    finally { if (btn) { btn.style.opacity = '1'; btn.textContent = 'Meal Prep'; } }
  };

  // Nutrient Timing Widget
  window._renderNutrientTimingWidget = function(containerId) {
    var container = document.getElementById(containerId || 'nutrientTimingContainer'); if (!container) return;
    var targets = window._getEffectiveNutritionTargets();
    if (!targets) { container.innerHTML = '<p style="font-size:11px;color:var(--text-muted);text-align:center;padding:10px">Profil einrichten f\u00FCr Timing</p>'; return; }
    var protPerMeal = targets.proteinPerMeal || Math.round(targets.protein / 4);
    var hour = new Date().getHours();
    var recs = [
      {time:'07:00',meal:'Fr\u00FChst\u00FCck',icon:'\u2600\uFE0F',tip:protPerMeal+'g Protein + langsame Carbs',why:'MPS starten nach Overnight-Fasten',done:hour>9},
      {time:'12:30',meal:'Mittagessen',icon:'\uD83C\uDF7D',tip:protPerMeal+'g Protein + Gem\u00FCse',why:'3-5h nach Fr\u00FChst\u00FCck f\u00FCr optimale MPS',done:hour>13},
      {time:'16:30',meal:'Pre-Workout',icon:'\u26A1',tip:'20-30g Protein + 40-60g Carbs',why:'90-120min vorher, Aminos\u00E4uren verf\u00FCgbar',done:hour>17},
      {time:'19:00',meal:'Abendessen',icon:'\uD83C\uDF19',tip:protPerMeal+'g Protein + moderate Carbs',why:'3-5h nach Mittagessen',done:hour>20},
      {time:'22:00',meal:'Pre-Sleep',icon:'\uD83D\uDECC',tip:'30-40g Casein (Quark, H\u00FCttk\u00E4se)',why:'Overnight MPS \u2014 Snijders 2015',done:hour>22}
    ];
    var html = '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:8px">Optimales Timing heute</p>';
    html += recs.map(function(r) {
      var isNow = !r.done && parseInt(r.time) <= hour+1 && parseInt(r.time) >= hour-1;
      return '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-hex);opacity:' + (r.done ? '0.45' : '1') + '"><div style="text-align:center;width:38px;flex-shrink:0"><p style="font-size:11px;font-weight:600;color:' + (isNow ? 'var(--primary-hex)' : 'var(--text-muted)') + '">' + r.time + '</p><span style="font-size:14px">' + r.icon + '</span></div><div style="flex:1"><div style="display:flex;align-items:center;gap:6px;margin-bottom:2px"><p style="font-size:12px;font-weight:600;color:var(--text-main)">' + r.meal + '</p>' + (isNow ? '<span style="font-size:8px;padding:1px 6px;border-radius:5px;background:rgba(163,201,168,0.15);color:var(--primary-hex);font-weight:700">JETZT</span>' : '') + (r.done ? '<span style="font-size:10px;color:var(--text-muted)">\u2713</span>' : '') + '</div><p style="font-size:11px;color:var(--primary-hex)">' + r.tip + '</p><p style="font-size:10px;color:var(--text-muted)">' + r.why + '</p></div></div>';
    }).join('');
    container.innerHTML = html;
  };

  // ============================================================
  // WATER INTAKE — Phase 8
  // ============================================================

  window._WATER_KEY = 'base_water_log';
  window._getWaterLog = function(dateStr) { dateStr = dateStr || new Date().toISOString().split('T')[0]; var all = JSON.parse(localStorage.getItem(window._WATER_KEY) || '{}'); return all[dateStr] || { entries: [], total: 0 }; };
  window._saveWaterLog = function(dateStr, log) { dateStr = dateStr || new Date().toISOString().split('T')[0]; var all = JSON.parse(localStorage.getItem(window._WATER_KEY) || '{}'); all[dateStr] = log; var keys = Object.keys(all).sort(); if (keys.length > 30) delete all[keys[0]]; localStorage.setItem(window._WATER_KEY, JSON.stringify(all)); };

  window._addWater = function(ml, dateStr) {
    dateStr = dateStr || new Date().toISOString().split('T')[0];
    var log = window._getWaterLog(dateStr);
    log.entries.push({ ml: ml, time: new Date().toISOString() });
    log.total = log.entries.reduce(function(s, e) { return s + e.ml; }, 0);
    window._saveWaterLog(dateStr, log);
    window._renderWaterWidget(); window._renderWaterWidget('waterMiniContainer');
    if (window.awardXP) window.awardXP('habit');
  };
  window._removeLastWater = function(dateStr) {
    dateStr = dateStr || new Date().toISOString().split('T')[0];
    var log = window._getWaterLog(dateStr);
    if (log.entries.length === 0) return;
    log.entries.pop();
    log.total = log.entries.reduce(function(s, e) { return s + e.ml; }, 0);
    window._saveWaterLog(dateStr, log);
    window._renderWaterWidget(); window._renderWaterWidget('waterMiniContainer');
  };

  window._calculateWaterTarget = function() {
    var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
    var weight = profile.weight || 75;
    var base = weight * 35;
    var today = new Date().toISOString().split('T')[0];
    var todayWorkouts = (window.workouts || []).filter(function(w) { return w.date && w.date.startsWith(today) && w.archived; });
    var sessionDuration = todayWorkouts.reduce(function(sum, w) { return sum + (parseInt(w.workoutDuration)||0); }, 0);
    var trainingVolume = todayWorkouts.reduce(function(sum, w) { return sum + ((w.setDetails||[]).reduce(function(sv, s) { return sv + (parseFloat(s.weight)||0)*(parseInt(s.reps)||0); }, 0)); }, 0);
    var trainingBonus = 0;
    if (sessionDuration > 0) trainingBonus = 500 + Math.round(sessionDuration / 1800) * 200;
    else if (trainingVolume > 3000) trainingBonus = 600;
    var supps = window._getSupplements ? window._getSupplements() : [];
    var creatineBonus = supps.some(function(s) { return s.name && s.name.toLowerCase().indexOf('kreatin') !== -1; }) ? 300 : 0;
    return { target: Math.round((base + trainingBonus + creatineBonus) / 100) * 100, base: Math.round(base), trainingBonus: trainingBonus, creatineBonus: creatineBonus, hasTraining: sessionDuration > 0 || trainingVolume > 3000 };
  };

  window._renderWaterWidget = function(containerId) {
    var container = document.getElementById(containerId || 'waterWidgetContainer'); if (!container) return;
    var today = new Date().toISOString().split('T')[0];
    var log = window._getWaterLog(today); var water = window._calculateWaterTarget();
    var totalMl = log.total || 0; var pct = Math.min(100, Math.round(totalMl / water.target * 100));
    var remainL = Math.max(0, (water.target - totalMl) / 1000).toFixed(1);
    var color = pct >= 100 ? '#a3c9a8' : pct >= 70 ? '#4ab8d4' : pct >= 40 ? '#e8c86a' : '#e88a8a';

    var html = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">' +
      '<div style="position:relative;width:72px;height:72px;flex-shrink:0"><svg width="72" height="72" style="transform:rotate(-90deg)"><circle cx="36" cy="36" r="30" fill="none" stroke="var(--border-hex)" stroke-width="7"/><circle cx="36" cy="36" r="30" fill="none" stroke="' + color + '" stroke-width="7" stroke-dasharray="' + Math.round(188.5*pct/100) + ' 188.5" stroke-linecap="round" style="transition:stroke-dasharray .5s ease"/></svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="font-size:16px">\uD83D\uDCA7</span><p style="font-size:10px;font-weight:700;color:' + color + '">' + pct + '%</p></div></div>' +
      '<div style="flex:1"><div style="display:flex;align-items:baseline;gap:4px;margin-bottom:2px"><p style="font-size:22px;font-weight:700;color:var(--text-main)">' + (totalMl/1000).toFixed(2).replace('.',',') + '</p><p style="font-size:12px;color:var(--text-muted)">/' + (water.target/1000).toFixed(1) + 'L</p></div>' +
      (pct < 100 ? '<p style="font-size:10px;color:var(--text-muted)">noch ' + remainL + 'L \u00FCbrig</p>' : '<p style="font-size:10px;color:var(--primary-hex)">Tagesziel erreicht \u2713</p>') +
      (water.trainingBonus > 0 ? '<p style="font-size:9px;color:#4ab8d4;margin-top:2px">\u26A1 +' + (water.trainingBonus/1000).toFixed(1) + 'L Training-Bonus</p>' : '') +
      (water.creatineBonus > 0 ? '<p style="font-size:9px;color:#7ec84a;margin-top:1px">+300ml Kreatin-Bonus</p>' : '') +
      '</div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px">' +
      [150,250,330,500].map(function(ml) { return '<button onclick="window._addWater(' + ml + ')" class="pointer-events-auto" aria-label="+' + ml + 'ml" style="padding:8px 4px;border-radius:9px;font-size:11px;font-weight:600;cursor:pointer;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)">+' + ml + 'ml</button>'; }).join('') +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between"><p style="font-size:10px;color:var(--text-muted)">' + log.entries.length + ' Eintr\u00E4ge heute</p>' +
      (log.entries.length > 0 ? '<button onclick="window._removeLastWater()" class="pointer-events-auto" aria-label="R\u00FCckg\u00E4ngig" style="font-size:10px;color:var(--text-muted);background:none;border:none;cursor:pointer;padding:4px 8px">\u21A9 R\u00FCckg\u00E4ngig</button>' : '') + '</div>';

    if (log.entries.length > 0) {
      var maxE = Math.max.apply(null, log.entries.map(function(e) { return e.ml; }));
      html += '<div style="display:flex;gap:3px;margin-top:8px;align-items:flex-end;height:24px">';
      log.entries.slice(-20).forEach(function(e) { var h = Math.max(4, Math.round(e.ml / maxE * 24)); html += '<div style="flex:1;background:' + color + ';opacity:0.7;border-radius:2px;height:' + h + 'px" title="' + e.ml + 'ml"></div>'; });
      html += '</div>';
    }
    container.innerHTML = html;
  };

  // ============================================================
  // BLOODWORK INTEGRATION — Phase 8
  // ============================================================

  window._BLOODWORK_KEY = 'base_bloodwork';
  window._BLOODWORK_MARKERS = [
    {id:'vitaminD',label:'Vitamin D',unit:'ng/ml',low:20,optimal_low:40,optimal_high:80,high:100,icon:'\u2600\uFE0F',category:'energie',sport_note:'Unter 30: Muskelkraft -20%, Verletzungsrisiko erh\u00F6ht'},
    {id:'ferritin',label:'Ferritin',unit:'\u00B5g/L',low:12,optimal_low:70,optimal_high:200,high:300,icon:'\uD83E\uDE78',category:'energie',sport_note:'Unter 30: VO2max sinkt \u2014 h\u00E4ufig bei Frauen + Vegetariern'},
    {id:'b12',label:'Vitamin B12',unit:'pg/ml',low:200,optimal_low:400,optimal_high:900,high:2000,icon:'\uD83D\uDC89',category:'energie',sport_note:'Unter 300: Ersch\u00F6pfung, wichtig f\u00FCr Veganer'},
    {id:'testosterone',label:'Testosteron',unit:'ng/dl',low:300,optimal_low:600,optimal_high:900,high:1000,icon:'\u26A1',category:'hormone',sport_note:'600-900: beste Hypertrophie-Response'},
    {id:'cortisol',label:'Cortisol (morgens)',unit:'\u00B5g/dl',low:6,optimal_low:10,optimal_high:20,high:25,icon:'\uD83D\uDE24',category:'hormone',sport_note:'Chronisch >22: \u00DCbertraining-Signal'},
    {id:'tsh',label:'TSH',unit:'mIU/L',low:0.1,optimal_low:0.5,optimal_high:2.5,high:4.5,icon:'\uD83E\uDD8B',category:'hormone',sport_note:'\u00DCber 2.5: M\u00FCdigkeit, langsamerer Stoffwechsel'},
    {id:'crp',label:'CRP',unit:'mg/L',low:0,optimal_low:0,optimal_high:1,high:3,icon:'\uD83D\uDD25',category:'entzuendung',warn_high:true,sport_note:'\u00DCber 3: chronische Entz\u00FCndung, Recovery gest\u00F6rt'},
    {id:'magnesium',label:'Magnesium',unit:'mmol/L',low:0.7,optimal_low:0.85,optimal_high:1.0,high:1.1,icon:'\u26A1',category:'minerale',sport_note:'Unter 0.8: Kr\u00E4mpfe, schlechter Schlaf'},
    {id:'zinc_blood',label:'Zink',unit:'\u00B5mol/L',low:10,optimal_low:12,optimal_high:18,high:20,icon:'\uD83D\uDD2C',category:'minerale',sport_note:'Unter 12: Testosteron-Produktion sinkt'},
    {id:'omega3_index',label:'Omega-3 Index',unit:'%',low:4,optimal_low:8,optimal_high:12,high:15,icon:'\uD83D\uDC1F',category:'entzuendung',sport_note:'Unter 4%: erh\u00F6htes Herzrisiko, mehr Entz\u00FCndung'}
  ];

  window._getBloodwork = function() { return JSON.parse(localStorage.getItem(window._BLOODWORK_KEY) || '[]'); };
  window._saveBloodworkEntry = function(entry) {
    var entries = window._getBloodwork();
    entry.id = 'bw_' + Date.now(); entry.date = entry.date || new Date().toISOString().split('T')[0];
    entries.unshift(entry); entries = entries.slice(0, 20);
    localStorage.setItem(window._BLOODWORK_KEY, JSON.stringify(entries)); return entry;
  };
  window._getLatestBloodwork = function() {
    var entries = window._getBloodwork(); if (entries.length === 0) return {};
    var latest = {};
    entries.forEach(function(entry) { if (!entry.values) return; Object.keys(entry.values).forEach(function(key) { if (!latest[key]) latest[key] = { value: entry.values[key], date: entry.date }; }); });
    return latest;
  };
  window._getBloodworkStatus = function(markerId, value) {
    var marker = window._BLOODWORK_MARKERS.find(function(m) { return m.id === markerId; });
    if (!marker || value === null || value === undefined) return 'unknown';
    if (marker.warn_high) { if (value <= marker.optimal_high) return 'optimal'; if (value <= marker.high) return 'borderline'; return 'high'; }
    if (value < marker.low) return 'deficient'; if (value < marker.optimal_low) return 'low';
    if (value >= marker.optimal_low && value <= marker.optimal_high) return 'optimal';
    if (value <= marker.high) return 'elevated'; return 'high';
  };

  window._renderBloodworkDashboard = function(containerId) {
    var container = document.getElementById(containerId || 'bloodworkContainer'); if (!container) return;
    var latest = window._getLatestBloodwork(); var hasData = Object.keys(latest).length > 0;
    if (!hasData) { container.innerHTML = '<div style="text-align:center;padding:24px 16px"><p style="font-size:24px;margin-bottom:8px">\uD83E\uDE7A</p><p style="font-size:14px;font-weight:700;color:var(--text-main);margin-bottom:6px">Blutwerte eingeben</p><p style="font-size:11px;color:var(--text-muted);margin-bottom:16px;line-height:1.6">Gib deine Laborwerte ein \u2014 die KI verbindet sie mit Training und Ern\u00E4hrung.</p><button onclick="window.openBloodworkEntry()" class="pointer-events-auto" aria-label="Blutwerte eingeben" style="padding:10px 24px;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex)">+ Blutwerte eingeben</button></div>'; return; }

    var html = '';
    var criticalCount = 0;
    window._BLOODWORK_MARKERS.forEach(function(m) { if (!latest[m.id]) return; var s = window._getBloodworkStatus(m.id, latest[m.id].value); if (s === 'deficient' || s === 'high') criticalCount++; });
    if (criticalCount > 0) html += '<div style="padding:10px 12px;background:rgba(232,138,138,0.08);border:1px solid rgba(232,138,138,0.2);border-radius:10px;margin-bottom:12px"><p style="font-size:11px;font-weight:700;color:#e88a8a;margin-bottom:4px">\u26A0\uFE0F ' + criticalCount + ' Wert' + (criticalCount>1?'e':'') + ' im kritischen Bereich</p><p style="font-size:10px;color:var(--text-muted)">Bitte mit Arzt besprechen</p></div>';

    var cats = {energie:{l:'\u26A1 Energie & Erholung'},hormone:{l:'\uD83D\uDD2C Hormone'},entzuendung:{l:'\u2764\uFE0F Entz\u00FCndung'},minerale:{l:'\uD83D\uDC8A Mineralien'}};
    Object.keys(cats).forEach(function(cat) {
      var markers = window._BLOODWORK_MARKERS.filter(function(m) { return m.category === cat; });
      html += '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin:10px 0 6px">' + cats[cat].l + '</p>';
      markers.forEach(function(m) {
        var entry = latest[m.id]; var hasVal = !!entry; var val = hasVal ? entry.value : null;
        var status = hasVal ? window._getBloodworkStatus(m.id, val) : 'unknown';
        var sc = {optimal:'#a3c9a8',low:'#e8c86a',deficient:'#e88a8a',elevated:'#d4733a',high:'#e88a8a',borderline:'#e8c86a',unknown:'var(--border-hex)'}[status] || 'var(--border-hex)';
        var sl = {optimal:'Optimal',low:'Niedrig',deficient:'Mangel',elevated:'Erh\u00F6ht',high:'Zu hoch',borderline:'Grenzwertig',unknown:'\u2014'}[status] || '\u2014';
        var barPct = hasVal ? Math.max(0, Math.min(100, Math.round((val - m.low) / (m.high - m.low) * 100))) : 0;
        var optLeft = Math.round((m.optimal_low - m.low) / (m.high - m.low) * 100);
        var optWidth = Math.round((m.optimal_high - m.optimal_low) / (m.high - m.low) * 100);
        html += '<div style="padding:10px 12px;background:var(--inner-bg-hex);border:1px solid ' + (status==='deficient'||status==='high' ? 'rgba(232,138,138,0.25)' : 'var(--border-hex)') + ';border-radius:11px;margin-bottom:5px;cursor:pointer" onclick="var _d=this.querySelector(\'.bw-detail\');if(_d)_d.style.display=_d.style.display===\'none\'?\'block\':\'none\'">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:14px">' + m.icon + '</span><p style="font-size:12px;font-weight:600;color:var(--text-main);flex:1">' + m.label + '</p><span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:6px;background:' + sc + '22;color:' + sc + '">' + sl + '</span>' + (hasVal ? '<span style="font-size:12px;font-weight:700;color:var(--text-main);margin-left:4px">' + val + ' ' + m.unit + '</span>' : '<span style="font-size:10px;color:var(--text-muted)">kein Wert</span>') + '</div>' +
          '<div style="position:relative;height:4px;background:var(--border-hex);border-radius:2px;margin-bottom:4px"><div style="position:absolute;left:' + optLeft + '%;width:' + optWidth + '%;height:100%;background:rgba(163,201,168,0.3);border-radius:2px"></div>' + (hasVal ? '<div style="position:absolute;left:' + barPct + '%;transform:translateX(-50%);width:8px;height:8px;border-radius:50%;background:' + sc + ';top:-2px"></div>' : '') + '</div>' +
          '<div style="display:flex;justify-content:space-between"><span style="font-size:8px;color:var(--text-muted)">' + m.low + '</span><span style="font-size:8px;color:var(--primary-hex)">Optimal: ' + m.optimal_low + '\u2013' + m.optimal_high + '</span><span style="font-size:8px;color:var(--text-muted)">' + m.high + '</span></div>' +
          '<div class="bw-detail" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid var(--border-hex)"><p style="font-size:10px;color:#4ab8d4;line-height:1.5">\uD83C\uDFCB ' + m.sport_note + '</p>' + (hasVal && entry.date ? '<p style="font-size:9px;color:var(--text-muted);margin-top:4px">Gemessen: ' + entry.date + '</p>' : '') + '</div></div>';
      });
    });
    html += '<div style="display:flex;gap:8px;margin-top:12px"><button onclick="window.openBloodworkEntry()" class="pointer-events-auto" aria-label="Neue Werte" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">+ Neue Werte</button><button onclick="window._analyzeBloodwork()" class="pointer-events-auto" aria-label="KI-Analyse" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">KI-Analyse</button></div>';
    container.innerHTML = html;
  };

  window._analyzeBloodwork = async function() {
    var latest = window._getLatestBloodwork(); if (Object.keys(latest).length === 0) { window.showToast('Keine Blutwerte vorhanden', 'warn'); return; }
    var profile = window._getNutritionProfile ? window._getNutritionProfile() : {};
    var supps = window._getSupplements ? window._getSupplements() : [];
    var valuesText = window._BLOODWORK_MARKERS.map(function(m) { if (!latest[m.id]) return null; var s = window._getBloodworkStatus(m.id, latest[m.id].value); return m.label + ': ' + latest[m.id].value + ' ' + m.unit + ' (' + s + ') \u2014 Optimal: ' + m.optimal_low + '\u2013' + m.optimal_high; }).filter(Boolean).join('\n');
    var prompt = 'Du bist Sportmediziner.\n\nWICHTIG: BASE ersetzt keine aerztliche Beratung.\n\nBLUTWERTE:\n' + valuesText + '\n\nATHLET: ' + (profile.weight||'?') + 'kg, Ziel: ' + (profile.goal||'?') + ', Ernaehrung: ' + (profile.dietType||'omnivor') + '\n' + (supps.length > 0 ? 'Supplements: ' + supps.map(function(s) { return s.name; }).join(', ') + '\n' : '') + '\nAnalysiere auf Deutsch (max 300 Woerter):\n1. KRITISCHE WERTE\n2. SPORT-PERFORMANCE Auswirkung\n3. ERNAEHRUNGS-ANPASSUNG\n4. SUPPLEMENT-OPTIMIERUNG\n5. ARZT-EMPFEHLUNGEN\n\nEvidenzbasiert. Keine Diagnosen. Immer Arzt empfehlen.';
    var btn = document.querySelector('[onclick*="_analyzeBloodwork"]'); if (btn) { btn.style.opacity = '0.6'; btn.textContent = 'Analysiere...'; }
    try {
      var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, userId: window._getAiUserId ? window._getAiUserId() : '' }) });
      var data = await res.json(); var text = window._extractGeminiText(data, '');
      window.showModal('Blutwert-Analyse', '<div style="padding:8px 10px;background:rgba(138,175,232,0.08);border:1px solid rgba(138,175,232,0.2);border-radius:8px;margin-bottom:10px"><p style="font-size:10px;color:#8aafe8">Diese Analyse ersetzt keine \u00E4rztliche Beratung.</p></div><div style="font-size:12px;line-height:1.7;color:var(--text-main);max-height:60vh;overflow-y:auto">' + window._sanitizeAIHtml(text) + '</div>', false);
    } catch(e) { window.showToast('Analyse fehlgeschlagen', 'error'); }
    finally { if (btn) { btn.style.opacity = '1'; btn.textContent = 'KI-Analyse'; } }
  };

  window.openBloodworkEntry = function() {
    var latest = window._getLatestBloodwork();
    window.toggleModal('bloodworkEntryModal');
    setTimeout(function() { window._BLOODWORK_MARKERS.forEach(function(m) { var el = document.getElementById('bw_' + m.id); if (el && latest[m.id]) el.value = latest[m.id].value; }); }, 100);
  };
  window.saveBloodworkEntry = function() {
    var values = {};
    window._BLOODWORK_MARKERS.forEach(function(m) { var el = document.getElementById('bw_' + m.id); if (el && el.value) values[m.id] = parseFloat(el.value.replace(',','.')); });
    if (Object.keys(values).length === 0) { window.showToast('Bitte mindestens einen Wert eingeben', 'warn'); return; }
    var dateEl = document.getElementById('bw_date');
    window._saveBloodworkEntry({ values: values, date: dateEl ? dateEl.value : new Date().toISOString().split('T')[0] });
    window.toggleModal('bloodworkEntryModal');
    window._renderBloodworkDashboard();
    window.showToast('Blutwerte gespeichert!');
  };

  // Enhanced Habit-Korrelationen mit Nutrition
  window._calculateEnhancedCorrelations = function() {
    var correlations = window._calculateHabitCorrelations ? window._calculateHabitCorrelations() : [];
    var archived = (window.workouts || []).filter(function(w) { return w.archived; });
    var targets = JSON.parse(localStorage.getItem('base_nutrition_targets') || 'null');
    var protTarget = targets ? targets.protein : 160;
    var highProtDays = [], lowProtDays = [];
    for (var i = 0; i < 30; i++) { var d = new Date(Date.now()-i*86400000).toISOString().split('T')[0]; var t = window._getDayTotals(d); if (t.entries === 0) continue; if (t.protein >= protTarget * 0.9) highProtDays.push(d); else if (t.protein < protTarget * 0.6) lowProtDays.push(d); }
    function avgPerf(days) { if (!days || days.length < 2) return null; var scores = []; days.forEach(function(date) { var nextDay = new Date(new Date(date).getTime()+86400000).toISOString().split('T')[0]; var wNext = archived.filter(function(w) { return w.date && w.date.startsWith(nextDay); }); if (wNext.length === 0) return; var vol = wNext.reduce(function(s,w) { return s + ((w.setDetails||[]).reduce(function(sv,st) { return sv + (parseFloat(st.weight)||0)*(parseInt(st.reps)||0); },0)); },0); if (vol > 0) scores.push(Math.min(100,vol/50)); }); return scores.length < 2 ? null : Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length); }
    var highProt = avgPerf(highProtDays); var lowProt = avgPerf(lowProtDays);
    if (highProt !== null && lowProt !== null && Math.abs(highProt-lowProt) > 5) {
      correlations.push({ habit: 'Protein-Zufuhr', habitId: 'protein_intake', highLabel: '\u2265' + Math.round(protTarget*0.9) + 'g', lowLabel: '<' + Math.round(protTarget*0.6) + 'g', highAvg: highProt, lowAvg: lowProt, diff: highProt-lowProt, highCount: highProtDays.length, lowCount: lowProtDays.length, isNutrition: true });
    }
    return correlations.sort(function(a,b) { return Math.abs(b.diff)-Math.abs(a.diff); });
  };

  // Nutrition Sub-Tab (erweitert mit Mikros)
  window._nutritionSubTab = function(tab, btn) {
    document.querySelectorAll('[id^="ntab_"]').forEach(function(b) { b.style.background = 'transparent'; b.style.borderColor = 'var(--border-hex)'; b.style.color = 'var(--text-muted)'; });
    if (btn) { btn.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 88%)'; btn.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 65%)'; btn.style.color = 'var(--primary-hex)'; }
    var foodView = document.getElementById('nutritionDashboard');
    var suppView = document.getElementById('supplementsView');
    var microView = document.getElementById('microsView');
    var waterView = document.getElementById('waterView');
    var bloodView = document.getElementById('bloodView');
    [foodView, suppView, microView, waterView, bloodView].forEach(function(v) { if (v) v.style.display = 'none'; });
    if (tab === 'supplements') { if (suppView) suppView.style.display = 'block'; window._renderSupplementTracker(); }
    else if (tab === 'micros') { if (microView) microView.style.display = 'block'; window._renderMicronutrientDashboard(); }
    else if (tab === 'water') { if (waterView) waterView.style.display = 'block'; window._renderWaterWidget('waterWidgetContainer'); }
    else if (tab === 'blood') { if (bloodView) bloodView.style.display = 'block'; window._renderBloodworkDashboard('bloodworkContainer'); }
    else { if (foodView) foodView.style.display = 'block'; window._renderNutritionDashboard(window._nutritionCurrentDate); }
  };

  // Barcode Scanner
  window._startBarcodeScanner = async function(mealId) {
    var modal = document.getElementById('barcodeScannerModal');
    if (!modal) return;
    window._currentScanMeal = mealId;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (!window.Quagga) {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js';
      script.onload = window._initScanner;
      document.head.appendChild(script);
    } else { window._initScanner(); }
  };
  window._initScanner = function() {
    if (!window.Quagga) return;
    Quagga.init({
      inputStream: { name: 'Live', type: 'LiveStream', target: document.getElementById('barcodeVideo'), constraints: { facingMode: 'environment', width: 320, height: 240 } },
      decoder: { readers: ['ean_reader', 'ean_8_reader', 'upc_reader'] }
    }, function(err) {
      if (err) { console.warn('[Scanner]', err); return; }
      Quagga.start();
      Quagga.onDetected(async function(result) {
        var code = result.codeResult.code;
        if (!code) return;
        Quagga.stop();
        window._closeBarcodeScanner();
        window.showToast('Barcode erkannt: ' + code);
        var food = await window._getFoodNutrients(null, code);
        if (food) { window._openAddFoodModal(window._currentScanMeal, food); }
        else { window.showToast('Lebensmittel nicht gefunden', 'warn'); }
      });
    });
  };
  window._closeBarcodeScanner = function() {
    if (window.Quagga) { try { Quagga.stop(); } catch(e) {} }
    var modal = document.getElementById('barcodeScannerModal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  };

  // Nutrition Dashboard Render (Donut-Style)
  window._nutritionCurrentDate = new Date().toISOString().split('T')[0];

  window._renderNutritionDashboard = function(dateStr) {
    var container = document.getElementById('nutritionDashboard');
    if (!container) return;
    dateStr = dateStr || window._nutritionCurrentDate || new Date().toISOString().split('T')[0];
    window._nutritionCurrentDate = dateStr;
    var totals  = window._getDayTotals(dateStr);
    var targets = window._getEffectiveNutritionTargets ? window._getEffectiveNutritionTargets() : null;
    targets = targets || { calories:2000, protein:160, carbs:200, fat:70 };
    var calPct = Math.min(100, Math.round(totals.calories / targets.calories * 100));
    var remCal = Math.max(0, targets.calories - totals.calories);

    function donut(pct, color, r, cx, cy, sw) {
      var circ = 2 * Math.PI * r;
      var dash = circ * Math.min(pct, 100) / 100;
      return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="var(--border-hex)" stroke-width="'+sw+'"/>' +
        '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="'+sw+'"' +
        ' stroke-dasharray="'+dash+' '+circ+'" stroke-dashoffset="'+(circ*0.25)+'" stroke-linecap="round" style="transition:stroke-dasharray .6s ease"/>';
    }

    var html =
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px;margin-bottom:14px">' +
      '<button onclick="window._nutritionPrevDay()" class="pointer-events-auto" aria-label="Vorheriger Tag" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:9px;padding:6px 12px;color:var(--text-muted);cursor:pointer;font-size:16px">\u2039</button>' +
      '<p style="font-size:13px;font-weight:600;color:var(--text-main)" id="nutritionDateLabel">' + window._formatNutritionDate(dateStr) + '</p>' +
      '<button onclick="window._nutritionNextDay()" class="pointer-events-auto" aria-label="N\u00E4chster Tag" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:9px;padding:6px 12px;color:var(--text-muted);cursor:pointer;font-size:16px">\u203A</button>' +
      '</div>' +

      '<div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:20px">' +
      '<div style="position:relative;width:140px;height:140px">' +
      '<svg width="140" height="140" style="transform:rotate(-90deg)">' + donut(calPct, '#a3c9a8', 60, 70, 70, 12) + '</svg>' +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">' +
      '<p style="font-size:28px;font-weight:700;color:var(--text-main);line-height:1">' + totals.calories.toLocaleString() + '</p>' +
      '<p style="font-size:9px;color:var(--text-muted);margin-top:2px">KALORIEN</p>' +
      '<p style="font-size:10px;color:var(--primary-hex);margin-top:3px">' + (remCal > 0 ? remCal.toLocaleString() + ' \u00FCbrig' : 'Ziel erreicht \u2713') + '</p>' +
      '</div></div>' +

      '<div style="display:flex;flex-direction:column;gap:10px">';

    var macros = [
      { val: totals.protein, target: targets.protein, label: 'Protein', color: '#4ab8d4' },
      { val: totals.carbs,   target: targets.carbs,   label: 'Carbs',   color: '#7ec84a' },
      { val: totals.fat,     target: targets.fat,     label: 'Fett',    color: '#d4733a' }
    ];
    macros.forEach(function(m) {
      var pct = Math.min(100, Math.round(m.val / m.target * 100));
      html += '<div style="display:flex;align-items:center;gap:10px">' +
        '<div style="position:relative;width:52px;height:52px"><svg width="52" height="52" style="transform:rotate(-90deg)">' +
        donut(pct, m.color, 22, 26, 26, 5) + '</svg>' +
        '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:'+m.color+'">' + m.val + '</div></div>' +
        '<div><p style="font-size:10px;font-weight:600;color:'+m.color+'">'+m.label+'</p>' +
        '<p style="font-size:9px;color:var(--text-muted)">'+m.target+'g Ziel</p></div></div>';
    });
    html += '</div></div>';

    // Meal Slots
    html += '<div style="display:flex;flex-direction:column;gap:8px" id="mealSlotsContainer">';
    var log = window._getFoodLog(dateStr);

    window._MEAL_SLOTS.forEach(function(slot) {
      var entries = log[slot.id] || [];
      var slotCals = entries.reduce(function(s,e) { return s + (e.calories||0); }, 0);
      var slotProt = entries.reduce(function(s,e) { return s + (e.protein||0); }, 0);

      html += '<div style="background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;overflow:hidden">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:16px">' + slot.icon + '</span>' +
        '<p style="font-size:13px;font-weight:600;color:var(--text-main)">' + slot.label + '</p>' +
        (entries.length > 0
          ? '<span style="font-size:10px;color:var(--text-muted)">' + slotCals + ' kcal \u00B7 ' + slotProt.toFixed(1) + 'g P</span>'
          : '<span style="font-size:10px;color:var(--text-muted)">leer</span>') +
        '</div>' +
        '<button onclick="event.stopPropagation();window.openFoodSearch(\'' + slot.id + '\',\'' + dateStr + '\')" class="pointer-events-auto" aria-label="Lebensmittel hinzuf\u00FCgen" style="width:28px;height:28px;border-radius:8px;font-size:16px;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex);cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>' +
        '</div>' +
        '<div style="' + (entries.length > 0 ? '' : 'display:none') + '">';

      entries.forEach(function(e) {
        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;border-top:1px solid var(--border-hex)">' +
          '<div style="flex:1;min-width:0"><p style="font-size:11px;font-weight:500;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + window._escapeHtml(e.name) + '</p>' +
          '<p style="font-size:9px;color:var(--text-muted)">' + e.servingQty + ' ' + e.servingUnit + ' \u00B7 P ' + e.protein + 'g \u00B7 K ' + e.carbs + 'g \u00B7 F ' + e.fat + 'g</p></div>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0"><span style="font-size:11px;font-weight:600;color:var(--text-main)">' + e.calories + ' kcal</span>' +
          '<button onclick="window._removeFoodEntry(\'' + slot.id + '\',\'' + e.id + '\',\'' + dateStr + '\');window._renderNutritionDashboard(\'' + dateStr + '\')" class="pointer-events-auto" aria-label="Entfernen" style="color:var(--text-muted);background:none;border:none;font-size:14px;cursor:pointer">\u2715</button></div></div>';
      });
      html += '</div></div>';
    });

    html += '</div>';
    html += '<button onclick="window.openFoodSearch(\'snack\',\'' + dateStr + '\')" class="pointer-events-auto w-full" aria-label="Lebensmittel hinzuf\u00FCgen" style="margin-top:12px;padding:12px;border-radius:12px;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">Lebensmittel hinzuf\u00FCgen</button>';
    html += '<div style="margin-top:14px;padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px"><div id="waterMiniContainer"></div></div>';
    container.innerHTML = html;
    setTimeout(function() { if (window._renderWaterWidget) window._renderWaterWidget('waterMiniContainer'); }, 50);
  };

  window._nutritionPrevDay = function() {
    var d = new Date(window._nutritionCurrentDate);
    d.setDate(d.getDate() - 1);
    window._nutritionCurrentDate = d.toISOString().split('T')[0];
    window._renderNutritionDashboard(window._nutritionCurrentDate);
  };
  window._nutritionNextDay = function() {
    var d = new Date(window._nutritionCurrentDate);
    d.setDate(d.getDate() + 1);
    var today = new Date().toISOString().split('T')[0];
    if (d.toISOString().split('T')[0] > today) return;
    window._nutritionCurrentDate = d.toISOString().split('T')[0];
    window._renderNutritionDashboard(window._nutritionCurrentDate);
  };
  window._formatNutritionDate = function(dateStr) {
    var d = new Date(dateStr);
    var today = new Date().toISOString().split('T')[0];
    var yest = new Date(Date.now()-86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Heute';
    if (dateStr === yest)  return 'Gestern';
    return d.toLocaleDateString('de-DE', { weekday:'short', day:'numeric', month:'short' });
  };

  // Food Search + Detail Logic
  var _foodSearchDebounce = null;
  window._foodSearchMealId = 'snack';
  window._foodSearchDate   = null;
  window._foodDetailItem   = null;
  window._foodDetailMult   = 1;

  window.openFoodSearch = function(mealId, dateStr) {
    window._foodSearchMealId = mealId || 'snack';
    window._foodSearchDate = dateStr || new Date().toISOString().split('T')[0];
    var slot = window._MEAL_SLOTS.find(function(s) { return s.id === mealId; });
    var titleEl = document.getElementById('foodSearchTitle');
    if (titleEl && slot) titleEl.textContent = slot.label + ' \u2014 hinzuf\u00FCgen';
    var input = document.getElementById('foodSearchInput');
    if (input) input.value = '';
    window._showFoodResults([]);
    window.toggleModal('foodSearchModal');
    setTimeout(function() { if (input) input.focus(); window._foodTab('search', document.getElementById('ftab_search')); }, 300);
  };
  window.closeFoodSearch = function() { window.toggleModal('foodSearchModal'); };
  window.closeFoodDetail = function() { window.toggleModal('foodDetailModal'); };

  window._foodTab = function(tab, btn) {
    document.querySelectorAll('[id^="ftab_"]').forEach(function(b) {
      b.style.background = 'transparent'; b.style.borderColor = 'var(--border-hex)'; b.style.color = 'var(--text-muted)';
    });
    if (btn) {
      btn.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 88%)';
      btn.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 65%)';
      btn.style.color = 'var(--primary-hex)';
    }
    if (tab === 'custom') { window._showFoodResults(window._getCustomFoods()); }
    else if (tab === 'recent') { window._showFoodResults(JSON.parse(localStorage.getItem('base_recent_foods') || '[]')); }
    else { var input = document.getElementById('foodSearchInput'); if (input && input.value.trim()) window._debounceFoodSearch(input.value); else window._showFoodResults([]); }
  };

  window._debounceFoodSearch = function(query) {
    clearTimeout(_foodSearchDebounce);
    if (!query || query.trim().length < 2) { window._showFoodResults([]); return; }
    var container = document.getElementById('foodSearchResults');
    if (container) container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">Suche...</p>';
    _foodSearchDebounce = setTimeout(async function() {
      var results = await window._searchFood(query.trim());
      window._showFoodResults(results);
    }, 400);
  };

  window._showFoodResults = function(items) {
    var container = document.getElementById('foodSearchResults');
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:24px"><p style="font-size:13px;color:var(--text-muted)">Keine Ergebnisse</p>' +
        '<button onclick="window.openCustomFoodForm()" class="pointer-events-auto" aria-label="Eigenes Lebensmittel" style="margin-top:10px;padding:8px 16px;border-radius:9px;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted);font-size:12px;cursor:pointer">+ Eigenes Lebensmittel</button></div>';
      return;
    }
    container.innerHTML = items.map(function(item, idx) {
      var cal  = item.nf_calories || item.calories || '?';
      var prot = item.nf_protein  || item.protein  || 0;
      var name = item.food_name   || item.name     || 'Unbekannt';
      var unit = (item.serving_qty || 1) + ' ' + (item.serving_unit || 'Portion');
      var brand = item.brand_name ? '<span style="font-size:9px;color:var(--text-muted);margin-left:4px">' + window._escapeHtml(item.brand_name) + '</span>' : '';
      var custom = item.isCustom ? '<span style="font-size:8px;padding:1px 5px;border-radius:4px;background:rgba(163,201,168,0.12);color:var(--primary-hex);margin-left:4px">eigenes</span>' : '';
      return '<div class="pointer-events-auto" data-food-idx="' + idx + '" onclick="window._selectFoodResult(' + idx + ')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 4px;border-bottom:1px solid var(--border-hex);cursor:pointer">' +
        '<div style="flex:1;min-width:0"><p style="font-size:12px;font-weight:500;color:var(--text-main)">' + window._escapeHtml(name) + brand + custom + '</p>' +
        '<p style="font-size:10px;color:var(--text-muted)">' + unit + '</p></div>' +
        '<div style="text-align:right;flex-shrink:0;margin-left:10px"><p style="font-size:13px;font-weight:600;color:var(--text-main)">' + Math.round(cal) + ' kcal</p>' +
        '<p style="font-size:9px;color:#4ab8d4">P ' + Math.round(prot) + 'g</p></div></div>';
    }).join('');
    window._foodSearchResultsCache = items;
  };

  window._selectFoodResult = function(idx) {
    var items = window._foodSearchResultsCache || [];
    if (items[idx]) window._openAddFoodModal(window._foodSearchMealId, items[idx]);
  };

  window._openAddFoodModal = async function(mealId, item) {
    if (!item) return;
    window._foodSearchMealId = mealId;
    if (!item.nf_calories && item.food_name) {
      window.showToast('Lade N\u00E4hrstoffe...', null, null, null, 2000);
      var details = await window._getFoodNutrients(item.food_name);
      if (details) item = Object.assign({}, item, details);
    }
    window._foodDetailItem = item;
    var nameEl = document.getElementById('foodDetailName');
    if (nameEl) nameEl.textContent = item.food_name || item.name || 'Lebensmittel';
    var qtyEl = document.getElementById('foodDetailQty');
    if (qtyEl) qtyEl.value = item.serving_qty || 1;
    window._updateFoodDetailPreview();
    window.closeFoodSearch();
    window.toggleModal('foodDetailModal');
  };

  window._updateFoodDetailPreview = function() {
    var item = window._foodDetailItem;
    if (!item) return;
    var qty = parseFloat(String((document.getElementById('foodDetailQty') || {}).value || 1).replace(',','.')) || 1;
    var base = item.serving_qty || 1;
    var mult = qty / base;
    window._foodDetailMult = mult;
    var macros = [
      { label:'Kalorien', val: Math.round((item.nf_calories||item.calories||0)*mult), color:'var(--primary-hex)' },
      { label:'Protein',  val: Math.round((item.nf_protein||item.protein||0)*mult*10)/10, color:'#4ab8d4' },
      { label:'Carbs',    val: Math.round((item.nf_total_carbohydrate||item.carbs||0)*mult*10)/10, color:'#7ec84a' },
      { label:'Fett',     val: Math.round((item.nf_total_fat||item.fat||0)*mult*10)/10, color:'#d4733a' }
    ];
    var container = document.getElementById('foodDetailMacros');
    if (!container) return;
    container.innerHTML = macros.map(function(m) {
      return '<div style="padding:8px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:9px;text-align:center">' +
        '<p style="font-size:14px;font-weight:700;color:'+m.color+'">'+m.val+'</p>' +
        '<p style="font-size:9px;color:var(--text-muted)">'+m.label+'</p></div>';
    }).join('');
  };

  window._confirmAddFood = function() {
    // Recipe ingredient mode
    if (window._foodSearchMealId === '_recipe_ingredient') {
      var _ri = window._foodDetailItem; if (!_ri) return;
      var _rm = window._foodDetailMult || 1;
      var _rq = parseFloat(String((document.getElementById('foodDetailQty')||{}).value||100).replace(',','.')) || 100;
      window._recipeIngredients.push({
        name: _ri.food_name || _ri.name, food_name: _ri.food_name || _ri.name,
        amount: _rq, unit: (document.getElementById('foodDetailUnit')||{}).value || 'g',
        servingG: _ri.serving_weight_grams || 100,
        nf_calories: (_ri.nf_calories||0)*_rm, nf_protein: (_ri.nf_protein||0)*_rm,
        nf_total_carbohydrate: (_ri.nf_total_carbohydrate||0)*_rm,
        nf_total_fat: (_ri.nf_total_fat||0)*_rm, nf_dietary_fiber: (_ri.nf_dietary_fiber||0)*_rm
      });
      window.closeFoodDetail();
      window._renderRecipeIngredientsList();
      window.toggleModal('recipeEditorModal');
      return;
    }
    var item = window._foodDetailItem;
    if (!item) return;
    var mult = window._foodDetailMult || 1;
    var qty = parseFloat(String((document.getElementById('foodDetailQty') || {}).value || 1).replace(',','.')) || 1;
    var scaledItem = {
      name: item.food_name || item.name,
      nf_calories: (item.nf_calories||item.calories||0) * mult,
      nf_protein: (item.nf_protein||item.protein||0) * mult,
      nf_total_carbohydrate: (item.nf_total_carbohydrate||item.carbs||0) * mult,
      nf_total_fat: (item.nf_total_fat||item.fat||0) * mult,
      nf_dietary_fiber: (item.nf_dietary_fiber||0) * mult,
      serving_qty: qty,
      serving_unit: (document.getElementById('foodDetailUnit')||{}).value || 'Portion',
      serving_weight_grams: (item.serving_weight_grams||100) * mult,
      isCustom: item.isCustom || false
    };
    window._addFoodEntry(window._foodSearchMealId, scaledItem, window._foodSearchDate);
    var recent = JSON.parse(localStorage.getItem('base_recent_foods') || '[]');
    recent = [item].concat(recent.filter(function(f) { return (f.food_name||f.name) !== (item.food_name||item.name); })).slice(0, 20);
    localStorage.setItem('base_recent_foods', JSON.stringify(recent));
    window.closeFoodDetail();
    window.showToast(window._escapeHtml(scaledItem.name) + ' hinzugef\u00FCgt!');
    window._renderNutritionDashboard(window._foodSearchDate);
  };

  // Custom Food Form
  window.openCustomFoodForm = function() {
    window.closeFoodSearch();
    window.toggleModal('customFoodModal');
  };
  window.saveCustomFoodForm = function() {
    var name = (document.getElementById('cf_name')||{}).value || '';
    if (!name.trim()) { window.showToast('Bitte Namen eingeben', 'error'); return; }
    var food = {
      name: name.trim(), food_name: name.trim(),
      nf_calories: parseFloat((document.getElementById('cf_cal')||{}).value||0),
      nf_protein: parseFloat((document.getElementById('cf_protein')||{}).value||0),
      nf_total_carbohydrate: parseFloat((document.getElementById('cf_carbs')||{}).value||0),
      nf_total_fat: parseFloat((document.getElementById('cf_fat')||{}).value||0),
      nf_dietary_fiber: parseFloat((document.getElementById('cf_fiber')||{}).value||0),
      serving_qty: parseFloat((document.getElementById('cf_serving')||{}).value||100),
      serving_unit: (document.getElementById('cf_unit')||{}).value || 'g',
      isCustom: true
    };
    window._saveCustomFood(food);
    window.toggleModal('customFoodModal');
  };

  // ============================================================
  // ACWR — ACUTE:CHRONIC WORKLOAD RATIO
  // Hulin et al. 2016: 0.8-1.3 = Sweet Spot, >1.5 = Verletzungsrisiko
  // ============================================================

  window._calculateACWR = function() {
   var archived = (window.workouts || []).filter(function(w) { return w.archived; }).sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
   var oldestWorkout = archived.length > 0 ? new Date(archived[0].date) : new Date();
   var daysSinceFirst = (Date.now() - oldestWorkout.getTime()) / 86400000;
   if (archived.length < 5 || daysSinceFirst < 14) {
    return { acwr: null, acuteLoad: 0, chronicLoad: 0, status: 'insufficient', label: 'Zu wenig Daten', color: '#82828c', recommendation: 'Tracke mindestens 2 Wochen f\u00fcr aussagekr\u00e4ftiges ACWR', daysSinceLastWorkout: 0 };
   }
   var dailyLoad = {};
   archived.forEach(function(w) {
    var date = (w.date || '').split('T')[0]; var load = 0;
    if (w.setDetails && w.setDetails.length > 0) {
     w.setDetails.forEach(function(s) {
      if (s.type === 'warmup') return;
      var reps = parseInt(s.reps) || 8; var weight = parseFloat(s.weight) || 0;
      var rpe = s.rir != null ? Math.max(5, 10 - parseInt(s.rir)) : 7;
      load += (reps * (weight || 1)) * (rpe / 10);
     });
    } else { load = parseInt(w.duration) || 30; }
    dailyLoad[date] = (dailyLoad[date] || 0) + load;
   });
   var now = new Date(); var acuteLoad = 0; var acuteDays = 0;
   for (var i = 0; i < 7; i++) { var d = new Date(now - i * 86400000).toISOString().split('T')[0]; if (dailyLoad[d] !== undefined) { acuteLoad += dailyLoad[d]; acuteDays++; } }
   var acuteAvg = acuteLoad / 7;
   var chronicLoad = 0; var chronicDays = 0;
   for (var j = 0; j < 28; j++) { var cd = new Date(now - j * 86400000).toISOString().split('T')[0]; if (dailyLoad[cd] !== undefined) { chronicLoad += dailyLoad[cd]; chronicDays++; } }
   var chronicAvg = chronicLoad / 28;
   var daysSinceLastWorkout = archived.length > 0 ? (Date.now() - new Date(archived[archived.length-1].date).getTime()) / 86400000 : 999;
   if (chronicAvg > 0 && chronicAvg < acuteAvg * 0.3) {
    return { acwr: null, acuteLoad: Math.round(acuteAvg), chronicLoad: Math.round(chronicAvg), status: 'insufficient', label: 'Nicht genug Historie', color: '#82828c', recommendation: 'Noch zu wenig Verlaufsdaten \u2014 ACWR wird genauer je mehr Wochen du trackst', daysSinceLastWorkout: Math.floor(daysSinceLastWorkout) };
   }
   var acwr = chronicAvg > 0 ? Math.round((acuteAvg / chronicAvg) * 100) / 100 : null;
   var status, label, color, recommendation;
   if (acwr === null) { status='insufficient'; label='Nicht genug Daten'; color='#82828c'; recommendation='Tracke 4 Wochen f\u00fcr ACWR'; }
   else if (daysSinceLastWorkout > 4 && acuteAvg < chronicAvg * 0.5) { status='undertraining'; label='Kaum trainiert diese Woche'; color='#8aafe8'; recommendation='Seit ' + Math.floor(daysSinceLastWorkout) + ' Tagen kein Training \u2014 Zeit wieder einzusteigen'; }
   else if (acwr < 0.8) { status='undertraining'; label='Untertrainiert'; color='#8aafe8'; recommendation='Trainingsvolumen kann gesteigert werden'; }
   else if (acwr <= 1.3) { status='optimal'; label='Sweet Spot \u2713'; color='#a3c9a8'; recommendation='Optimale Trainingsbelastung \u2014 weiter so!'; }
   else if (acwr <= 1.5) { status='caution'; label='Vorsicht'; color='#e8c86a'; recommendation='Leicht erh\u00f6htes Verletzungsrisiko \u2014 Intensit\u00e4t reduzieren'; }
   else { status='danger'; label='\u00dcberbelastung \u26A0\uFE0F'; color='#e88a8a'; recommendation='Hohes Verletzungsrisiko! Deload oder Pause empfohlen'; }
   return { acwr: acwr, acuteLoad: Math.round(acuteAvg), chronicLoad: Math.round(chronicAvg), acuteTotal: Math.round(acuteLoad), chronicTotal: Math.round(chronicLoad), status: status, label: label, color: color, recommendation: recommendation, daysSinceLastWorkout: Math.floor(daysSinceLastWorkout) };
  };

  window._renderACWR = function(containerId) {
   var container = document.getElementById(containerId || 'acwrContainer');
   if (!container) return;
   var data = window._calculateACWR();
   if (data.status === 'insufficient') {
    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted)"><p style="font-size:13px;font-weight:600;margin-bottom:4px">Acute:Chronic Workload Ratio</p><p style="font-size:11px">' + data.recommendation + '</p></div>';
    return;
   }
   var acwrStr = data.acwr !== null ? data.acwr.toFixed(2) : '\u2014';
   var scalePos = data.acwr !== null ? Math.min(100, Math.round((data.acwr / 2.5) * 100)) : 50;
   container.innerHTML =
    '<div style="padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
    '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:2px">ACWR</p>' +
    '<p style="font-size:24px;font-weight:700;color:' + data.color + '">' + acwrStr + '</p></div>' +
    '<div style="text-align:right"><p style="font-size:13px;font-weight:700;color:' + data.color + '">' + data.label + '</p>' +
    '<p style="font-size:10px;color:var(--text-muted)">Acute:Chronic</p></div></div>' +
    '<div style="position:relative;margin-bottom:8px"><div style="height:10px;border-radius:5px;background:linear-gradient(to right,#8aafe8 0%,#8aafe8 40%,#a3c9a8 40%,#a3c9a8 65%,#e8c86a 65%,#e8c86a 75%,#e88a8a 75%,#e88a8a 100%)"></div>' +
    '<div style="position:absolute;top:-3px;left:' + scalePos + '%;transform:translateX(-50%);width:16px;height:16px;border-radius:50%;background:white;border:2.5px solid ' + data.color + ';box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);margin-bottom:12px"><span>0.0</span><span style="color:#a3c9a8">0.8\u20131.3 Sweet Spot</span><span>2.5</span></div>' +
    '<div style="display:flex;gap:8px;margin-bottom:10px">' +
    '<div style="flex:1;padding:8px;background:var(--bg-hex);border-radius:8px;border:1px solid var(--border-hex);text-align:center"><p style="font-size:16px;font-weight:700;color:var(--text-main)">' + data.acuteLoad.toLocaleString() + '</p><p style="font-size:9px;color:var(--text-muted)">Akute Last (7T)</p></div>' +
    '<div style="flex:1;padding:8px;background:var(--bg-hex);border-radius:8px;border:1px solid var(--border-hex);text-align:center"><p style="font-size:16px;font-weight:700;color:var(--text-main)">' + data.chronicLoad.toLocaleString() + '</p><p style="font-size:9px;color:var(--text-muted)">Chron. Last (28T)</p></div></div>' +
    '<div style="padding:8px 10px;background:' + data.color + '12;border:1px solid ' + data.color + '30;border-radius:8px"><p style="font-size:11px;color:' + data.color + ';font-weight:600">' + data.recommendation + '</p></div>' +
    (data.daysSinceLastWorkout > 1 ? '<p style="font-size:10px;color:var(--text-muted);margin-top:6px;text-align:center">Letztes Training: vor ' + data.daysSinceLastWorkout + ' Tagen</p>' : '') +
    '</div>';
  };

  // ============================================================
  // SOCIAL FEED SYSTEM
  // ============================================================

  window._currentFeedTab = 'following';

  window._loadFeed = async function(tab, btn) {
   window._currentFeedTab = tab;
   ['feedTabFollowing','feedTabDiscover','feedTabRoutines','feedTabRecipes'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.background = 'transparent';
    el.style.borderColor = 'var(--border-hex)';
    el.style.color = 'var(--text-muted)';
   });
   if (btn) {
    btn.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 85%)';
    btn.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 60%)';
    btn.style.color = 'var(--primary-hex)';
   }
   var container = document.getElementById('socialFeedContainer');
   if (!container) return;
   container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted)"><div style="font-size:12px">Laden...</div></div>';

   if (tab === 'routines') { window._loadSharedRoutines(); return; }
   if (tab === 'recipes') { window._renderMyRecipes(); return; }
   if (tab === 'community_recipes') { window._loadCommunityRecipes(); return; }

   var db = window._fbDb;
   if (!db) { container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted)">Nicht verbunden</p>'; return; }

   try {
    var posts = [];
    if (tab === 'following' && window._fbAuth && window._fbAuth.currentUser) {
     var followingUids = await window._getFollowingUids();
     if (followingUids.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:32px 16px"><p style="font-size:24px;margin-bottom:8px">\uD83D\uDC65</p><p style="font-size:14px;font-weight:700;color:var(--text-main);margin-bottom:6px">Noch niemanden gefolgt</p><p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Entdecke Athleten und folge ihnen</p><button onclick="window._loadFeed(\'discover\',document.getElementById(\'feedTabDiscover\'))" class="pointer-events-auto" style="padding:10px 20px;border-radius:10px;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex);font-size:13px;font-weight:700;cursor:pointer" aria-label="Athleten entdecken">Athleten entdecken \u2192</button></div>';
      return;
     }
     var uidsChunk = followingUids.slice(0, 10);
     var feedSnap = await window._fbGetDocs(window._fbQuery(window._fbCollection(db, 'feed'), window._fbWhere('uid', 'in', uidsChunk), window._fbOrderBy('date', 'desc'), window._fbLimit(20)));
     feedSnap.forEach(function(d) { posts.push(Object.assign({ id: d.id }, d.data())); });
    } else {
     var discoverSnap = await window._fbGetDocs(window._fbQuery(window._fbCollection(db, 'feed'), window._fbOrderBy('date', 'desc'), window._fbLimit(30)));
     discoverSnap.forEach(function(d) { posts.push(Object.assign({ id: d.id }, d.data())); });
    }
    window._renderFeedPosts(posts, container);
   } catch(e) {
    console.warn('[Social Feed]', e.message);
    container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">Feed konnte nicht geladen werden</p>';
   }
  };

  window._renderFeedPosts = function(posts, container) {
   if (posts.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:32px 16px"><p style="font-size:24px;margin-bottom:8px">\uD83C\uDFCB\uFE0F</p><p style="font-size:14px;font-weight:700;color:var(--text-main)">Noch keine Aktivit\u00e4ten</p></div>';
    return;
   }
   var myUid = window._fbAuth && window._fbAuth.currentUser ? window._fbAuth.currentUser.uid : '';
   container.innerHTML = posts.map(function(post) {
    var timeAgo = window._timeAgo(post.date);
    var catColors = { strength: '#a3c9a8', cardio: '#e88a8a', recovery: '#8aafe8', main: '#e8c86a' };
    var catColor = catColors[post.category] || 'var(--primary-hex)';
    return '<div style="padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:14px;margin-bottom:10px">' +
     '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
     '<div onclick="window.openSocialProfile(\'' + post.uid + '\')" class="pointer-events-auto" style="width:38px;height:38px;border-radius:50%;background:color-mix(in srgb,var(--primary-hex),transparent 80%);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--primary-hex);cursor:pointer;flex-shrink:0">' + window._escapeHtml((post.displayName || 'A')[0].toUpperCase()) + '</div>' +
     '<div style="flex:1"><p onclick="window.openSocialProfile(\'' + post.uid + '\')" class="pointer-events-auto" style="font-size:13px;font-weight:700;color:var(--text-main);cursor:pointer">' + window._escapeHtml(post.displayName || 'Athlet') + '<span style="font-size:10px;font-weight:500;color:var(--primary-hex);margin-left:6px">Lvl ' + (post.level || 1) + '</span></p><p style="font-size:10px;color:var(--text-muted)">' + timeAgo + '</p></div>' +
     (post.uid !== myUid ? '<button onclick="window._followUser(\'' + post.uid + '\')" class="pointer-events-auto" style="padding:5px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)" aria-label="Folgen">Folgen</button>' : '') +
     '</div>' +
     '<div style="padding:10px 12px;background:var(--bg-hex);border-radius:10px;border:1px solid var(--border-hex);margin-bottom:10px">' +
     (post.isPR ? '<span style="font-size:11px;color:#e8c86a;font-weight:700;margin-right:6px">\uD83C\uDFC6 PR!</span>' : '') +
     '<span style="font-size:14px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(post.exercise || '\u2014') + '</span>' +
     '<div style="display:flex;gap:12px;margin-top:5px">' +
     (post.sets ? '<span style="font-size:11px;color:var(--text-muted)">' + post.sets + ' Sets</span>' : '') +
     (post.volume ? '<span style="font-size:11px;color:var(--text-muted)">' + post.volume.toLocaleString() + ' kg</span>' : '') +
     '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:' + catColor + '20;color:' + catColor + ';font-weight:700">' + window._escapeHtml(post.category || '') + '</span>' +
     '</div></div>' +
     '<div style="display:flex;align-items:center;gap:8px"><button data-like-post="' + post.id + '" data-liked="false" onclick="window._toggleLike(\'' + post.id + '\',this.getAttribute(\'data-liked\'))" class="pointer-events-auto" style="display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:8px;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted);font-size:12px;cursor:pointer" aria-label="Like">\u2665 <span class="like-count">' + (post.likeCount || 0) + '</span></button></div>' +
     '</div>';
   }).join('');
  };

  window._timeAgo = function(dateStr) {
   var diff = Date.now() - new Date(dateStr).getTime();
   var mins = Math.floor(diff / 60000);
   if (mins < 1) return 'Gerade eben';
   if (mins < 60) return 'vor ' + mins + ' Min';
   var hours = Math.floor(mins / 60);
   if (hours < 24) return 'vor ' + hours + ' Std';
   var days = Math.floor(hours / 24);
   if (days < 7) return 'vor ' + days + ' Tagen';
   return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  };

  window.openSocialProfile = async function(uid) {
   window.toggleModal('socialProfileModal');
   var content = document.getElementById('socialProfileContent');
   if (content) content.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Laden...</div>';
   var db = window._fbDb;
   if (!db) return;
   try {
    var profileSnap = await window._fbGetDoc(window._fbDoc(db, 'profiles', uid));
    if (!profileSnap.exists()) { if (content) content.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted)">Profil nicht gefunden</p>'; return; }
    var p = profileSnap.data();
    var isMe = window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid === uid;
    var isFollowing = isMe ? false : (window._isFollowing ? await window._isFollowing(uid) : false);
    var postsSnap = await window._fbGetDocs(window._fbQuery(window._fbCollection(db, 'feed'), window._fbWhere('uid', '==', uid), window._fbOrderBy('date', 'desc'), window._fbLimit(5)));
    var recentPosts = []; postsSnap.forEach(function(d) { recentPosts.push(Object.assign({ id: d.id }, d.data())); });
    var routinesSnap = await window._fbGetDocs(window._fbQuery(window._fbCollection(db, 'shared_routines'), window._fbWhere('uid', '==', uid), window._fbLimit(3)));
    var routines = []; routinesSnap.forEach(function(d) { routines.push(Object.assign({ id: d.id }, d.data())); });

    content.innerHTML =
     '<div style="text-align:center;margin-bottom:20px"><div style="width:70px;height:70px;border-radius:50%;margin:0 auto 12px;background:color-mix(in srgb,var(--primary-hex),transparent 80%);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:var(--primary-hex)">' + window._escapeHtml((p.displayName||'A')[0].toUpperCase()) + '</div><p style="font-size:18px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(p.displayName||'Athlet') + '</p><p style="font-size:12px;color:var(--primary-hex);margin-top:2px">Level ' + (p.level||1) + ' \u00B7 ' + (p.totalXP||0).toLocaleString() + ' XP</p></div>' +
     '<div style="display:flex;gap:8px;margin-bottom:16px">' +
     '<div style="flex:1;text-align:center;padding:10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:10px"><p style="font-size:18px;font-weight:700;color:var(--text-main)">' + (p.workoutCount||0) + '</p><p style="font-size:9px;color:var(--text-muted)">Workouts</p></div>' +
     '<div style="flex:1;text-align:center;padding:10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:10px"><p style="font-size:18px;font-weight:700;color:var(--text-main)">' + (p.followerCount||0) + '</p><p style="font-size:9px;color:var(--text-muted)">Follower</p></div>' +
     '<div style="flex:1;text-align:center;padding:10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:10px"><p style="font-size:18px;font-weight:700;color:var(--text-main)">' + (p.routineCount||0) + '</p><p style="font-size:9px;color:var(--text-muted)">Routinen</p></div></div>' +
     (!isMe ? '<button onclick="window.' + (isFollowing ? '_unfollowUser' : '_followUser') + '(\'' + uid + '\')" class="pointer-events-auto w-full" style="padding:12px;border-radius:12px;margin-bottom:16px;font-size:14px;font-weight:700;cursor:pointer;' + (isFollowing ? 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)' : 'background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex)') + '" aria-label="' + (isFollowing ? 'Entfolgen' : 'Folgen') + '">' + (isFollowing ? 'Entfolgen' : '+ Folgen') + '</button>' : '') +
     (routines.length > 0 ? '<div style="margin-bottom:16px"><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:8px">Geteilte Routinen</p>' + routines.map(function(r) { return '<div style="padding:10px 12px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:10px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between"><div><p style="font-size:12px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(r.name||'Routine') + '</p><p style="font-size:10px;color:var(--text-muted)">' + (r.exerciseCount||0) + ' \u00dcbungen \u00B7 ' + (r.useCount||0) + '\u00d7 verwendet</p></div><button onclick="window._useSharedRoutine(\'' + r.id + '\')" class="pointer-events-auto" style="padding:6px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)" aria-label="Verwenden">Verwenden</button></div>'; }).join('') + '</div>' : '') +
     (recentPosts.length > 0 ? '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:8px">Letzte Workouts</p>' + recentPosts.map(function(post) { return '<div style="padding:8px 10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:9px;margin-bottom:5px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;font-weight:600;color:var(--text-main)">' + window._escapeHtml(post.exercise||'\u2014') + '</span><span style="font-size:10px;color:var(--text-muted)">' + window._timeAgo(post.date) + '</span></div>'; }).join('') + '</div>' : '');
   } catch(e) {
    console.warn('[Social Profile]', e.message);
    if (content) content.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted)">Fehler beim Laden</p>';
   }
  };

  // Routine Sharing
  window._shareRoutine = async function(routineId) {
   var routines = window._getAthleteRoutines ? window._getAthleteRoutines() : JSON.parse(localStorage.getItem('base_athlete_routines') || '[]');
   var routine = routines.find(function(r) { return r.id === routineId; });
   if (!routine) return;
   var db = window._fbDb; var auth = window._fbAuth;
   if (!db || !auth || !auth.currentUser || auth.currentUser.isAnonymous) { window.showToast('Bitte erst einloggen um Routinen zu teilen', 'warn'); return; }
   var uid = auth.currentUser.uid;
   try {
    var profileSnap = await window._fbGetDoc(window._fbDoc(db, 'profiles', uid));
    var pd = profileSnap.exists() ? profileSnap.data() : {};
    var shared = { uid: uid, displayName: pd.displayName || 'Athlet', level: pd.level || 1, name: routine.name, category: routine.category || 'strength', exercises: routine.exercises || [], exerciseCount: (routine.exercises || []).length, useCount: 0, likeCount: 0, createdAt: new Date().toISOString() };
    var ref = await window._fbAddDoc(window._fbCollection(db, 'shared_routines'), shared);
    await window._fbUpdateDoc(window._fbDoc(db, 'profiles', uid), { routineCount: window._fbIncrement(1) });
    routine.sharedId = ref.id; routine.isShared = true;
    var all = routines.map(function(r) { return r.id === routineId ? routine : r; });
    localStorage.setItem('base_athlete_routines', JSON.stringify(all));
    window.showToast('\uD83D\uDD17 Routine in der Community geteilt!');
    if (window.awardXP) window.awardXP('share');
   } catch(e) { window.showToast('Fehler: ' + e.message, 'error'); }
  };

  window._loadSharedRoutines = async function() {
   var container = document.getElementById('socialFeedContainer');
   if (!container) return;
   var db = window._fbDb;
   if (!db) return;
   try {
    var snap = await window._fbGetDocs(window._fbQuery(window._fbCollection(db, 'shared_routines'), window._fbOrderBy('useCount', 'desc'), window._fbLimit(20)));
    var routines = []; snap.forEach(function(d) { routines.push(Object.assign({ id: d.id }, d.data())); });
    if (routines.length === 0) { container.innerHTML = '<div style="text-align:center;padding:32px 16px"><p style="font-size:24px;margin-bottom:8px">\uD83D\uDCCB</p><p style="font-size:14px;font-weight:700;color:var(--text-main);margin-bottom:6px">Noch keine geteilten Routinen</p><p style="font-size:12px;color:var(--text-muted)">Sei der Erste!</p></div>'; return; }
    container.innerHTML = routines.map(function(r) {
     return '<div style="padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:14px;margin-bottom:10px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div onclick="window.openSocialProfile(\'' + r.uid + '\')" class="pointer-events-auto" style="width:36px;height:36px;border-radius:50%;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 80%);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--primary-hex);flex-shrink:0">' + window._escapeHtml((r.displayName||'A')[0].toUpperCase()) + '</div><div style="flex:1"><p style="font-size:13px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(r.name||'Routine') + '</p><p style="font-size:10px;color:var(--text-muted)">von ' + window._escapeHtml(r.displayName||'Athlet') + ' \u00B7 Lvl ' + (r.level||1) + '</p></div></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">' + (r.exercises||[]).slice(0,4).map(function(ex) { return '<span style="font-size:10px;padding:2px 8px;border-radius:6px;background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)">' + window._escapeHtml(ex.exercise||ex.name||ex) + '</span>'; }).join('') + (r.exerciseCount > 4 ? '<span style="font-size:10px;color:var(--text-muted)">+' + (r.exerciseCount-4) + ' weitere</span>' : '') + '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;gap:12px"><span style="font-size:11px;color:var(--text-muted)">\uD83D\uDCCB ' + r.exerciseCount + ' \u00dcbungen</span><span style="font-size:11px;color:var(--text-muted)">\u25B6\uFE0F ' + (r.useCount||0) + '\u00d7 verwendet</span></div><button onclick="window._useSharedRoutine(\'' + r.id + '\')" class="pointer-events-auto" style="padding:7px 14px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 85%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex)" aria-label="Verwenden">Verwenden</button></div></div>';
    }).join('');
   } catch(e) { console.warn('[Shared Routines]', e.message); }
  };

  window._useSharedRoutine = async function(sharedRoutineId) {
   var db = window._fbDb;
   if (!db) return;
   try {
    var snap = await window._fbGetDoc(window._fbDoc(db, 'shared_routines', sharedRoutineId));
    if (!snap.exists()) { window.showToast('Routine nicht gefunden', 'error'); return; }
    var r = snap.data();
    var localRoutine = { id: 'routine_' + Date.now(), name: r.name + ' (von ' + (r.displayName||'Athlet') + ')', category: r.category || 'strength', createdAt: new Date().toISOString(), exercises: r.exercises || [], fromShared: sharedRoutineId };
    var routines = window._getAthleteRoutines ? window._getAthleteRoutines() : JSON.parse(localStorage.getItem('base_athlete_routines') || '[]');
    routines.unshift(localRoutine);
    localStorage.setItem('base_athlete_routines', JSON.stringify(routines));
    await window._fbUpdateDoc(window._fbDoc(db, 'shared_routines', sharedRoutineId), { useCount: window._fbIncrement(1) });
    window.toggleModal('socialProfileModal');
    window.showToast('\u2705 Routine \u00fcbernommen!');
   } catch(e) { window.showToast('Fehler: ' + e.message, 'error'); }
  };

  // ============================================================
  // DAILY OUTLOOK — MORNING BRIEFING
  // ============================================================

  window._generateDailyOutlook = async function() {
   var today = new Date().toISOString().split('T')[0];
   var cached = localStorage.getItem('base_daily_outlook_' + today);
   if (cached) { try { window._showDailyOutlook(JSON.parse(cached)); return; } catch(e) {} }

   var acwr = window._calculateACWR ? window._calculateACWR() : null;
   var muscleState = window._calculateMuscleRecovery ? window._calculateMuscleRecovery() : null;
   var readiness = window._calculateReadinessV2 ? window._calculateReadinessV2() : null;
   var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
   var yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
   var yh = habits[yesterday] || {};
   var ready = muscleState ? window._getReadyMuscles(muscleState, 80) : [];
   var fatigued = muscleState ? window._getFatiguedMuscles(muscleState, 50) : [];

   var context = 'Datum: ' + today +
    '\nAthlet: ' + ((window.userProfile && window.userProfile.name) || 'Athlet') +
    '\nBattery/Readiness Score: ' + (readiness ? readiness.score : '?') + '%' +
    '\nACWR: ' + (acwr && acwr.acwr ? acwr.acwr + ' (' + acwr.label + ')' : 'Nicht verf\u00fcgbar') +
    '\nErholte Muskeln (>80%): ' + (ready.length > 0 ? ready.slice(0,4).map(function(m) { return window._MUSCLE_RECOVERY_TIMES[m] && window._MUSCLE_RECOVERY_TIMES[m].label; }).filter(Boolean).join(', ') : 'Noch keine') +
    '\nErholt sich noch: ' + (fatigued.length > 0 ? fatigued.slice(0,3).map(function(e) { return window._MUSCLE_RECOVERY_TIMES[e[0]].label; }).join(', ') : 'Alle erholt') +
    '\nSchlaf gestern: ' + (yh.sleep || '?') + 'h' +
    '\nStress: ' + (yh.stress || '?') + '/10' +
    '\nWasser: ' + (yh.water || '?') + 'L';

   var suppCompliance = '';
   if (window._getSupplements && window._isSuppTakenToday) {
    var _olSupps = window._getSupplements();
    if (_olSupps.length > 0) {
     var _olTaken = _olSupps.filter(function(s) { return window._isSuppTakenToday(s); });
     var _olMissing = _olSupps.filter(function(s) { return !window._isSuppTakenToday(s); });
     suppCompliance = '\nSUPPLEMENT STATUS HEUTE:';
     if (_olTaken.length > 0) suppCompliance += '\nGenommen: ' + _olTaken.map(function(s) { return s.name; }).join(', ');
     if (_olMissing.length > 0) suppCompliance += '\nNoch ausstehend: ' + _olMissing.map(function(s) { return s.name + ' (' + (s.dose||'') + ')'; }).join(', ');
    }
   }
   context += suppCompliance;

   var langName = window.getPromptLang ? window.getPromptLang() : 'Deutsch';
   var prompt = 'Du bist ein pers\u00f6nlicher KI-Fitness-Coach. Erstelle ein kurzes Morning Briefing f\u00fcr heute basierend auf diesen Daten:\n\n' + context + '\n\nFormat (genau so):\n{"greeting":"Motivierender Morgengruss (1 Satz)","status":"Ampel-Status: Gr\u00fcn/Gelb/Rot","recommendation":"Konkrete Trainingsempfehlung f\u00fcr heute (1-2 S\u00e4tze)","focus":"Welche Muskelgruppen heute trainieren","tip":"1 praktischer Tipp f\u00fcr heute","emoji":"1 passendes Emoji"}\n\nAntworte auf ' + langName + '. NUR JSON, kein Text davor/danach.';

   try {
    var res = await fetch('/.netlify/functions/gemini', {
     method: 'POST', headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ prompt: prompt, type: 'outlook' })
    });
    if (!res.ok) throw new Error('KI nicht verf\u00fcgbar');
    var data = await res.json();
    var text = window._extractGeminiText(data, '');
    text = text.replace(/```json|```/g, '').trim();
    var match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Kein JSON');
    var outlook = JSON.parse(match[0]);
    localStorage.setItem('base_daily_outlook_' + today, JSON.stringify(outlook));
    window._showDailyOutlook(outlook);
   } catch(e) {
    var score = readiness ? readiness.score : 70;
    window._showDailyOutlook({
     greeting: 'Guten Morgen! Bereit f\u00fcr heute?',
     status: score >= 70 ? 'Gr\u00fcn' : score >= 50 ? 'Gelb' : 'Rot',
     recommendation: score >= 70 ? 'Du bist gut erholt \u2014 gutes Training heute m\u00f6glich.' : 'Dein K\u00f6rper braucht noch Erholung. Leichtes Training oder Pause empfohlen.',
     focus: ready.length > 0 ? ready.slice(0,3).map(function(m) { return window._MUSCLE_RECOVERY_TIMES[m] && window._MUSCLE_RECOVERY_TIMES[m].label; }).filter(Boolean).join(', ') : 'Mobility oder Cardio',
     tip: 'Trink 500ml Wasser direkt nach dem Aufwachen.',
     emoji: score >= 70 ? '\uD83D\uDCAA' : '\uD83D\uDE34'
    });
   }
  };

  window._showDailyOutlook = function(outlook) {
   var existing = document.getElementById('dailyOutlookBanner');
   if (existing) existing.remove();
   var statusColor = (outlook.status || '').indexOf('Gr') !== -1 ? '#a3c9a8' : (outlook.status || '').indexOf('Gelb') !== -1 ? '#e8c86a' : '#e88a8a';
   var banner = document.createElement('div');
   banner.id = 'dailyOutlookBanner';
   banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:8000;pointer-events:auto;max-width:500px;margin:0 auto';
   banner.innerHTML =
    '<div style="margin:8px 12px;padding:14px 16px;border-radius:16px;background:var(--bg-hex);border:1px solid ' + statusColor + '44;box-shadow:0 4px 20px rgba(0,0,0,0.4)">' +
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">' +
    '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:22px">' + (outlook.emoji || '\uD83D\uDCAA') + '</span><div><p style="font-size:13px;font-weight:700;color:var(--text-main);line-height:1.3">' + window._escapeHtml(outlook.greeting || '') + '</p><p style="font-size:10px;color:' + statusColor + ';font-weight:700;margin-top:2px">\u25CF ' + window._escapeHtml(outlook.status || '') + '</p></div></div>' +
    '<button onclick="document.getElementById(\'dailyOutlookBanner\').remove()" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;pointer-events:auto;flex-shrink:0" aria-label="Schliessen">\u00d7</button></div>' +
    '<p style="font-size:12px;color:var(--text-muted);margin-bottom:6px;line-height:1.5">' + window._escapeHtml(outlook.recommendation || '') + '</p>' +
    (outlook.focus ? '<p style="font-size:11px;color:' + statusColor + ';margin-bottom:6px">\uD83C\uDFAF Fokus heute: ' + window._escapeHtml(outlook.focus) + '</p>' : '') +
    (outlook.tip ? '<p style="font-size:11px;color:var(--text-muted);padding:6px 10px;background:var(--inner-bg-hex);border-radius:8px">\uD83D\uDCA1 ' + window._escapeHtml(outlook.tip) + '</p>' : '') +
    '</div>';
   document.body.appendChild(banner);
   setTimeout(function() {
    var el = document.getElementById('dailyOutlookBanner');
    if (el) { el.style.transition = 'opacity 0.5s ease,transform 0.5s ease'; el.style.opacity = '0'; el.style.transform = 'translateY(-10px)'; setTimeout(function() { if (el.parentNode) el.remove(); }, 500); }
   }, 15000);
  };

  // ============================================================
  // HABIT CORRELATIONS
  // ============================================================

  window._calculateHabitCorrelations = function() {
   var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
   var correlations = [];
   var HABIT_LABELS = { sleep: 'Schlaf', water: 'Wasser', stress: 'Stress', steps: 'Schritte', protein: 'Protein' };
   var thresholds = {
    sleep: { high: 7, label: '>7h', lowLabel: '<6h', lowMult: 0.85 },
    water: { high: 2, label: '>2L', lowLabel: '<1.5L', lowMult: 0.75 },
    stress: { high: 5, label: '<5', lowLabel: '>7', invert: true },
    steps: { high: 8000, label: '>8k', lowLabel: '<5k', lowMult: 0.6 },
    protein: { high: 150, label: '>150g', lowLabel: '<100g', lowMult: 0.66 }
   };

   Object.keys(HABIT_LABELS).forEach(function(habitId) {
    var highDays = []; var lowDays = [];
    var thresh = thresholds[habitId]; if (!thresh) return;
    Object.entries(habits).forEach(function(entry) {
     var val = entry[1][habitId]; if (val === undefined) return;
     if (thresh.invert) { if (val <= thresh.high) highDays.push(entry[0]); else if (val > 7) lowDays.push(entry[0]); }
     else { if (val >= thresh.high) highDays.push(entry[0]); else if (val < thresh.high * (thresh.lowMult || 0.75)) lowDays.push(entry[0]); }
    });

    var readinessData = JSON.parse(localStorage.getItem('base_readiness_log') || '{}');
    function avgScore(days) {
     if (days.length < 3) return null;
     var scores = days.map(function(d) { return readinessData[d]; }).filter(function(s) { return s != null; });
     if (scores.length < 2) return null;
     return Math.round(scores.reduce(function(a,b){return a+b;},0) / scores.length);
    }
    var highAvg = avgScore(highDays); var lowAvg = avgScore(lowDays);
    if (highAvg !== null && lowAvg !== null && Math.abs(highAvg - lowAvg) > 5) {
     correlations.push({ habit: HABIT_LABELS[habitId], highLabel: thresh.label, lowLabel: thresh.lowLabel, highAvg: highAvg, lowAvg: lowAvg, diff: highAvg - lowAvg, highCount: highDays.length, lowCount: lowDays.length });
    }
   });
   return correlations.sort(function(a,b) { return Math.abs(b.diff) - Math.abs(a.diff); });
  };

  window._renderHabitCorrelations = function(containerId) {
   var container = document.getElementById(containerId || 'habitCorrelationsContainer');
   if (!container) return;
   var correlations = window._calculateEnhancedCorrelations ? window._calculateEnhancedCorrelations() : (window._calculateHabitCorrelations ? window._calculateHabitCorrelations() : []);
   if (correlations.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px">Noch nicht genug Daten f\u00fcr Korrelationen.<br>Tracke 2-3 Wochen Habits f\u00fcr Insights.</p>';
    return;
   }
   container.innerHTML = '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:10px">Habit-Korrelationen</p>' +
    correlations.slice(0, 4).map(function(c) {
     var positive = c.diff > 0; var color = positive ? '#a3c9a8' : '#e88a8a';
     return '<div style="padding:10px 12px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:10px;margin-bottom:8px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:var(--text-main)">' + c.habit + '</span><span style="font-size:11px;color:' + color + ';font-weight:700">' + (positive ? '\u25B2' : '\u25BC') + ' ' + Math.abs(c.diff) + '% Unterschied</span></div>' +
      '<div style="display:flex;gap:10px">' +
      '<div style="flex:1;padding:6px;background:rgba(163,201,168,0.08);border-radius:7px;border:1px solid rgba(163,201,168,0.2)"><p style="font-size:9px;color:#a3c9a8;margin-bottom:2px">' + c.highLabel + ' (' + c.highCount + ' Tage)</p><p style="font-size:14px;font-weight:700;color:#a3c9a8">' + c.highAvg + '%</p></div>' +
      '<div style="flex:1;padding:6px;background:rgba(232,138,138,0.08);border-radius:7px;border:1px solid rgba(232,138,138,0.2)"><p style="font-size:9px;color:#e88a8a;margin-bottom:2px">' + c.lowLabel + ' (' + c.lowCount + ' Tage)</p><p style="font-size:14px;font-weight:700;color:#e88a8a">' + c.lowAvg + '%</p></div></div></div>';
    }).join('');
  };

  // ============================================================
  // CREATOR CODE SYSTEM
  // ============================================================

  window._applyCreatorCode = async function(code) {
   if (!code || code.trim().length < 3) return;
   code = code.trim().toUpperCase();
   var usedCode = localStorage.getItem('base_creator_code_used');
   if (usedCode) { window.showToast('Du hast bereits Code "' + usedCode + '" eingel\u00f6st', 'warn'); return; }
   var db = window._fbDb;
   if (!db) { window.showToast('Nicht verbunden', 'error'); return; }
   try {
    var q = window._fbQuery(window._fbCollection(db, 'creator_codes'), window._fbWhere('code', '==', code), window._fbWhere('active', '==', true));
    var snap = await window._fbGetDocs(q);
    if (snap.empty) { window.showToast('Code "' + code + '" nicht gefunden', 'error'); return; }
    var codeDoc = snap.docs[0]; var codeData = codeDoc.data();
    localStorage.setItem('base_creator_code_used', code);
    localStorage.setItem('base_creator_name', codeData.creatorName || code);
    var bonus = codeData.xpBonus || 200;
    var currentXP = parseInt(localStorage.getItem('base_total_xp') || '0');
    localStorage.setItem('base_total_xp', String(currentXP + bonus));
    if (window._renderXPBar) window._renderXPBar();
    await window._fbUpdateDoc(window._fbDoc(db, 'creator_codes', codeDoc.id), { useCount: window._fbIncrement(1) });
    localStorage.setItem('base_creator_badge', codeData.badge || '\uD83C\uDFAF');
    window.showToast('\uD83C\uDF89 Code "' + code + '" eingel\u00f6st! +' + bonus + ' XP Bonus!', null, null, null, 6000);
    window._updateCreatorCodeUI();
   } catch(e) { window.showToast('Fehler: ' + e.message, 'error'); }
  };

  window._updateCreatorCodeUI = function() {
   var section = document.getElementById('creatorCodeSection');
   if (!section) return;
   var usedCode = localStorage.getItem('base_creator_code_used');
   if (usedCode) {
    var creatorName = localStorage.getItem('base_creator_name') || usedCode;
    section.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(163,201,168,0.08);border-radius:9px;border:1px solid rgba(163,201,168,0.2)"><span style="font-size:14px">\u2705</span><span style="font-size:12px;color:#a3c9a8;font-weight:700">Code "' + window._escapeHtml(usedCode) + '" von ' + window._escapeHtml(creatorName) + ' aktiv</span></div>';
   }
  };
  setTimeout(function() { window._updateCreatorCodeUI(); }, 1500);

  // URL-Parameter ?code=XYZ automatisch einloesen
  (function() {
   var params = new URLSearchParams(window.location.search);
   var code = params.get('code');
   if (code && code.length >= 3 && !localStorage.getItem('base_creator_code_used')) {
    setTimeout(function() { window._applyCreatorCode(code); }, 3000);
    history.replaceState({}, '', location.pathname);
   }
  })();

  // === HOLD TIMER (MOBILITY) ===
  window._showHoldTimer = function(seconds) {
   seconds = seconds || 30; var remaining = seconds;
   var ov = document.createElement('div'); ov.id = 'holdTimerOverlay';
   ov.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.95)';
   var circ = 2 * Math.PI * 80;
   var update = function() {
    var pct = Math.round((1 - remaining/seconds)*100);
    var dash = circ - (pct/100)*circ;
    ov.innerHTML = '<svg width="200" height="200" style="transform:rotate(-90deg)"><circle cx="100" cy="100" r="80" fill="none" stroke="#1e201e" stroke-width="8"/><circle cx="100" cy="100" r="80" fill="none" stroke="#a3c9a8" stroke-width="8" stroke-dasharray="'+circ+'" stroke-dashoffset="'+dash+'" stroke-linecap="round" style="transition:stroke-dashoffset 1s linear"/></svg>' +
     '<div style="position:absolute;font-size:48px;font-weight:900;color:#fff;font-family:Outfit,sans-serif">'+remaining+'</div>' +
     '<div style="margin-top:80px;font-size:11px;font-weight:700;color:var(--primary-hex)">HALTEN</div>' +
     '<button onclick="document.getElementById(\'holdTimerOverlay\').remove();clearInterval(window._holdTimerInt)" class="mt-6 px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer pointer-events-auto" style="background:rgba(232,138,138,0.1);border:1px solid rgba(232,138,138,0.2);color:#e88a8a" aria-label="Abbrechen">Abbrechen</button>';
   };
   update(); document.body.appendChild(ov);
   window._holdTimerInt = setInterval(function() {
    remaining--;
    if (remaining <= 0) {
     clearInterval(window._holdTimerInt);
     if (navigator.vibrate) navigator.vibrate([200,100,200]);
     ov.innerHTML = '<div style="font-size:64px;margin-bottom:16px">\u2705</div><div style="font-size:24px;font-weight:900;color:var(--primary-hex)">Fertig!</div><div style="font-size:11px;color:#9898a2;margin-top:8px">'+seconds+' Sekunden gehalten</div>';
     setTimeout(function() { if (ov.parentNode) ov.remove(); }, 2000);
    } else {
     update();
     if (remaining <= 3 && navigator.vibrate) navigator.vibrate(100);
    }
   }, 1000);
  };

  // === PROGRESSIVE OVERLOAD CHECK ===
  window._checkProgressiveOverload = function(exerciseName, matches) {
   if (!matches || matches.length < 3) return null;
   // Kein Plateau-Alert w\u00e4hrend Deload
   var _plan = JSON.parse(localStorage.getItem('base_active_plan') || 'null');
   if (_plan && _plan.planData) { var _cw = window._getCurrentMesoWeek ? window._getCurrentMesoWeek() : 0; var _wks = _plan.planData.weeks || []; if (_wks[_cw]) { var _wn = (_wks[_cw].name || _wks[_cw].focus || '').toLowerCase(); if (_wn.indexOf('deload') !== -1) return null; } }
   var last3 = matches.slice(0, 3);
   var maxW = last3.map(function(w) { return Math.max.apply(null, (w.setDetails || []).map(function(s) { return parseFloat(s.weight) || 0; })); });
   if (maxW[0] === maxW[1] && maxW[1] === maxW[2] && maxW[0] > 0) {
    var inc = maxW[0] < 40 ? '+1.25kg' : maxW[0] < 80 ? '+2.5kg' : '+5kg';
    return { exercise: exerciseName, weight: maxW[0], workouts: 3, suggestion: inc + ' versuchen' };
   }
   return null;
  };

  // === WORKOUT COMPARISON ===
  window._showWorkoutComparison = function(entry) {
   if (entry.category !== 'strength' || !entry.setDetails || entry.setDetails.length === 0) return;
   var prev = null;
   for (var i = 0; i < (window.workouts || []).length; i++) {
    var w = window.workouts[i];
    if (w.exercise === entry.exercise && w.id !== entry.id && w.archived) { prev = w; break; }
   }
   if (!prev || !prev.setDetails) return;
   var calcVol = function(s) { return (s || []).reduce(function(a, x) { return a + (parseFloat(x.reps)||0) * (parseFloat(x.weight)||0); }, 0); };
   var calcMax = function(s) { return Math.max.apply(null, (s || []).map(function(x) { return parseFloat(x.weight)||0; })); };
   var cV = calcVol(entry.setDetails), pV = calcVol(prev.setDetails);
   var cM = calcMax(entry.setDetails), pM = calcMax(prev.setDetails);
   var cS = entry.setDetails.length, pS = prev.setDetails.length;
   var arrow = function(d, u) { if (d > 0) return '<span style="color:var(--primary-hex)">\u2191+' + (d%1===0?d:d.toFixed(1)) + (u||'') + '</span>'; if (d < 0) return '<span style="color:#e88a8a">\u2193' + (d%1===0?d:d.toFixed(1)) + (u||'') + '</span>'; return '<span style="color:#9898a2">\u2192</span>'; };
   var html = '<div class="text-center mb-3"><p class="text-sm font-bold text-white mb-1">' + window.t('vsLast','vs. letztes Mal') + '</p><p class="text-[9px] mb-3" style="color:#9898a2">' + window._escapeHtml(entry.exercise) + ' \u00b7 ' + prev.date + '</p></div>';
   var currEffective = window._calculateEffectiveReps ? window._calculateEffectiveReps(entry.setDetails) : null;
   var prevEffective = prev && window._calculateEffectiveReps ? window._calculateEffectiveReps(prev.setDetails) : null;
   var effDiff = (currEffective && prevEffective) ? currEffective.ratio - prevEffective.ratio : 0;
   html += '<div class="grid grid-cols-4 gap-3 mb-2">';
   html += '<div class="text-center p-2.5 rounded-xl" style="background:var(--inner-bg-hex)"><div class="text-[8px] font-bold mb-1" style="color:#9898a2">Volumen</div><div class="text-xs font-black">' + arrow(cV-pV,'kg') + '</div></div>';
   html += '<div class="text-center p-2.5 rounded-xl" style="background:var(--inner-bg-hex)"><div class="text-[8px] font-bold mb-1" style="color:#9898a2">Max kg</div><div class="text-xs font-black">' + arrow(cM-pM,'kg') + '</div></div>';
   html += '<div class="text-center p-2.5 rounded-xl" style="background:var(--inner-bg-hex)"><div class="text-[8px] font-bold mb-1" style="color:#9898a2">Sets</div><div class="text-xs font-black">' + arrow(cS-pS) + '</div></div>';
   html += '<div class="text-center p-2.5 rounded-xl" style="background:var(--inner-bg-hex)"><div class="text-[8px] font-bold mb-1" style="color:#9898a2">Effective Reps</div><div class="text-xs font-black">' + arrow(effDiff) + '</div>' + (currEffective ? '<div class="text-[8px]" style="color:#737373">' + currEffective.ratio + '% effektiv</div>' : '') + '</div>';
   html += '</div>';
   var c = document.getElementById('workoutCompContent');
   if (c) { c.innerHTML = html; window.toggleModal('workoutCompModal'); }
  };

  // === ACHIEVEMENTS ===
  window._ACHIEVEMENTS = [
   { id:'first_workout', name:'First Blood', desc:'Erstes Workout', icon:'\uD83C\uDFAF', check:function(w){return w.length>=1;} },
   { id:'ten_workouts', name:'Dedicated', desc:'10 Workouts', icon:'\uD83D\uDD25', check:function(w){return w.length>=10;} },
   { id:'twentyfive', name:'Iron Will', desc:'25 Workouts', icon:'\uD83D\uDCAA', check:function(w){return w.length>=25;} },
   { id:'first_pr', name:'New Heights', desc:'Erster PR', icon:'\uD83C\uDFC6', check:function(w,m){return m.hasPR;} },
   { id:'streak7', name:'Unbreakable', desc:'7 Tage Streak', icon:'\u26A1', check:function(w,m){return m.streak>=7;} },
   { id:'vol10k', name:'Volume King', desc:'10.000 kg Volumen', icon:'\uD83D\uDC51', check:function(w){return w.reduce(function(a,wo){return a+(wo.setDetails||[]).filter(function(s){return s.type!=='warmup';}).reduce(function(b,s){return b+((parseFloat(s.reps)||0)*(parseFloat(s.weight)||0));},0);},0)>=10000;} },
   { id:'five_ex', name:'Variety Pack', desc:'5 verschiedene \u00dcbungen', icon:'\uD83C\uDFB2', check:function(w){return new Set(w.map(function(x){return x.exercise;})).size>=5;} },
   { id:'consist4', name:'Machine', desc:'4 Wochen mit 3+ Workouts', icon:'\uD83E\uDD16', check:function(w){var wk={};w.forEach(function(wo){var d=new Date(wo.date);d.setDate(d.getDate()-d.getDay()+1);wk[d.toISOString().split('T')[0]]=(wk[d.toISOString().split('T')[0]]||0)+1;});return Object.values(wk).filter(function(c){return c>=3;}).length>=4;} }
  ];

  window._checkAchievements = function() {
   var allW = (window.workouts || []).filter(function(w) { return w.archived; });
   var unlocked = JSON.parse(localStorage.getItem('base_achievements') || '[]');
   var streak = parseInt(localStorage.getItem('base_streak_count') || '0');
   var meta = { hasPR: !!localStorage.getItem('base_1rm_data'), streak: streak };
   var newU = [];
   window._ACHIEVEMENTS.forEach(function(a) {
    if (unlocked.indexOf(a.id) !== -1) return;
    try { if (a.check(allW, meta)) { unlocked.push(a.id); newU.push(a); } } catch(e) {}
   });
   if (newU.length > 0) {
    localStorage.setItem('base_achievements', JSON.stringify(unlocked));
    window._showAchievementCelebration(newU[0]);
    if (window.awardXP) window.awardXP('achievement');
   }
  };

  window._showAchievementCelebration = function(ach) {
   var ov = document.createElement('div');
   ov.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.9)';
   ov.innerHTML = '<div class="text-center" style="animation:scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)"><div style="font-size:64px;margin-bottom:16px">' + ach.icon + '</div><div class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color:var(--primary-hex)">Achievement Unlocked</div><div class="text-2xl font-black text-white mb-2">' + window._escapeHtml(ach.name) + '</div><div class="text-sm" style="color:#9898a2">' + window._escapeHtml(ach.desc) + '</div></div>';
   ov.onclick = function() { ov.remove(); };
   document.body.appendChild(ov);
   setTimeout(function() { if (ov.parentNode) ov.remove(); }, 4000);
  };

  // === POST-WORKOUT FEEDBACK ===
  window._showPostWorkoutFeedback = function() {
   var html = '<div class="text-center"><p class="text-sm font-bold text-white mb-3">' + window.t('howWasWorkout','Wie war dein Training?') + '</p><div class="flex justify-center gap-3 mb-2">';
   [{v:1,e:'\uD83D\uDE2B',l:'Schlecht'},{v:2,e:'\uD83D\uDE10',l:'M\u00e4\u00dfig'},{v:3,e:'\uD83D\uDE42',l:'OK'},{v:4,e:'\uD83D\uDE0A',l:'Gut'},{v:5,e:'\uD83D\uDD25',l:'Hammer'}].forEach(function(f) {
    html += '<button onclick="window._saveWorkoutFeedback(' + f.v + ')" class="flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex);min-width:48px" aria-label="' + f.l + '"><span style="font-size:24px">' + f.e + '</span><span class="text-[7px] font-bold" style="color:#9898a2">' + f.l + '</span></button>';
   });
   html += '</div></div>';
   var c = document.getElementById('wkFeedbackContent');
   if (c) { c.innerHTML = html; window.toggleModal('wkFeedbackModal'); }
  };

  window._saveWorkoutFeedback = function(rating) {
   var today = new Date().toISOString().split('T')[0];
   var fb = JSON.parse(localStorage.getItem('base_workout_feedback') || '{}');
   fb[today] = { rating: rating, ts: new Date().toISOString() };
   localStorage.setItem('base_workout_feedback', JSON.stringify(fb));
   window.toggleModal('wkFeedbackModal');
   var msgs = ['','N\u00e4chstes Mal wird besser! \uD83D\uDCAA','Akzeptiert, weitermachen!','Solide Session! \u2705','Starke Leistung! \uD83C\uDFAF','BEAST MODE! \uD83D\uDD25'];
   window.showToast(msgs[rating] || '\u2705');
   setTimeout(function() { if (window._showPumpSorenessRating) window._showPumpSorenessRating(); }, 500);
  };

  // ============================================================
  // MASCHINEN-BIBLIOTHEK UI
  // ============================================================
  window._openMachineLibrary = function() {
   window._renderMachineCategories();
   var det = document.getElementById('machineDetail');
   var cat = document.getElementById('machineCategories');
   var res = document.getElementById('machineSearchResults');
   var inp = document.getElementById('machineSearchInput');
   if (det) det.classList.add('hidden');
   if (cat) cat.classList.remove('hidden');
   if (res) res.innerHTML = '';
   if (inp) inp.value = '';
   window.toggleModal('machineLibModal');
  };

  window._onMachineSearch = function(query) {
   var resultsC = document.getElementById('machineSearchResults');
   var catC = document.getElementById('machineCategories');
   var detC = document.getElementById('machineDetail');
   if (!resultsC) return;
   if (!query || query.length < 2) {
    resultsC.innerHTML = '';
    if (catC) catC.classList.remove('hidden');
    if (detC) detC.classList.add('hidden');
    return;
   }
   if (catC) catC.classList.add('hidden');
   if (detC) detC.classList.add('hidden');
   var results = window._searchMachines ? window._searchMachines(query) : [];
   if (results.length === 0) {
    var eq = window._escapeHtml(query);
    resultsC.innerHTML = '<div class="text-center py-6"><p class="text-[10px]" style="color:#9898a2">Keine Maschine gefunden</p><button onclick="window._askAIMachineInfo(\'' + eq.replace(/'/g,'') + '\')" class="mt-3 px-4 py-2 rounded-xl text-[10px] font-bold cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.1);border:1px solid rgba(163,201,168,0.2);color:var(--primary-hex)">KI fragen</button></div>';
    return;
   }
   var html = results.map(function(m) {
    var muscles = (m.primaryMuscles || []).slice(0, 2).join(', ');
    var sc = window._STRENGTH_CURVES || {};
    var curveColor = m.strengthCurve === 'ascending' ? '#a3c9a8' : m.strengthCurve === 'descending' ? '#8aafe8' : m.strengthCurve === 'constant' ? '#e8c86a' : '#c9a3c9';
    var curveName = sc[m.strengthCurve] ? sc[m.strengthCurve].de : (m.strengthCurve || '');
    return '<button onclick="window._showMachineDetail(\'' + m.id + '\')" class="w-full p-3 rounded-xl text-left cursor-pointer pointer-events-auto mb-2 transition-colors" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="flex items-center justify-between mb-1"><span class="text-xs font-bold text-white">' + window._escapeHtml(m.name) + '</span><span class="text-[7px] font-bold px-2 py-0.5 rounded-full" style="background:' + curveColor + '22;color:' + curveColor + '">' + window._escapeHtml(curveName) + '</span></div><div class="text-[9px]" style="color:#9898a2">' + window._escapeHtml(muscles) + ' \u00b7 ' + window._escapeHtml(m.manufacturer || '') + '</div></button>';
   }).join('');
   resultsC.innerHTML = html;
  };

  window._renderMachineCategories = function() {
   var container = document.getElementById('machineCategories');
   if (!container || !window._MACHINE_DB) return;
   var categories = {};
   window._MACHINE_DB.forEach(function(m) {
    var muscle = (m.primaryMuscles || ['Sonstige'])[0];
    var group = 'Sonstige';
    if (/Brust|Pector/i.test(muscle)) group = 'Brust';
    else if (/Lat|Rauten|Trapez/i.test(muscle)) group = 'R\u00fccken';
    else if (/Quad|Hamstring|Glut|Gastro/i.test(muscle)) group = 'Beine';
    else if (/Schulter|Delt/i.test(muscle)) group = 'Schultern';
    else if (/Bizeps|Trizeps|Brachi/i.test(muscle)) group = 'Arme';
    else if (/Obliq|Rectus|Transver/i.test(muscle)) group = 'Core';
    else if (/Abh/i.test(muscle)) group = 'Sonstige';
    if (!categories[group]) categories[group] = [];
    categories[group].push(m);
   });
   var order = ['Brust', 'R\u00fccken', 'Beine', 'Schultern', 'Arme', 'Core', 'Sonstige'];
   var html = '<div class="text-[9px] font-bold uppercase tracking-wider mb-3" style="color:#9898a2">Nach Muskelgruppe (' + window._MACHINE_DB.length + ' Maschinen)</div>';
   order.forEach(function(group) {
    if (!categories[group]) return;
    html += '<div class="mb-3"><div class="text-[10px] font-bold text-white mb-2">' + group + ' (' + categories[group].length + ')</div><div class="flex flex-wrap gap-1">';
    categories[group].forEach(function(m) {
     html += '<button onclick="window._showMachineDetail(\'' + m.id + '\')" class="px-2.5 py-1.5 rounded-lg text-[8px] font-bold cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:#ccc">' + window._escapeHtml(m.name.replace('Maschine','').replace('Machine','').trim().substring(0, 28)) + '</button>';
    });
    html += '</div></div>';
   });
   html += '<div class="mt-4 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="text-[9px] font-bold uppercase tracking-wider mb-2" style="color:#9898a2">Kraftkurven-Guide</div>';
   var sc = window._STRENGTH_CURVES || {};
   var colors = { ascending: '#a3c9a8', descending: '#8aafe8', constant: '#e8c86a', 'bell-shaped': '#c9a3c9' };
   Object.keys(sc).forEach(function(key) {
    html += '<div class="flex items-start gap-2 mb-2"><div class="w-2 h-2 rounded-full mt-1 flex-shrink-0" style="background:' + (colors[key]||'#888') + '"></div><div><span class="text-[9px] font-bold" style="color:' + (colors[key]||'#888') + '">' + sc[key].de + '</span><div class="text-[8px]" style="color:#737373">' + sc[key].desc + '</div></div></div>';
   });
   html += '</div>';
   container.innerHTML = html;
  };

  window._showMachineDetail = function(machineId) {
   var m = window._getMachineById ? window._getMachineById(machineId) : null;
   if (!m) return;
   var container = document.getElementById('machineDetail');
   var catC = document.getElementById('machineCategories');
   var resC = document.getElementById('machineSearchResults');
   if (!container) return;
   if (catC) catC.classList.add('hidden');
   if (resC) resC.innerHTML = '';
   container.classList.remove('hidden');
   var sc = window._STRENGTH_CURVES || {};
   var curveColor = m.strengthCurve === 'ascending' ? '#a3c9a8' : m.strengthCurve === 'descending' ? '#8aafe8' : m.strengthCurve === 'constant' ? '#e8c86a' : '#c9a3c9';
   var curveName = sc[m.strengthCurve] ? sc[m.strengthCurve].de : (m.strengthCurve || '');
   var h = '<button onclick="document.getElementById(\'machineDetail\').classList.add(\'hidden\');document.getElementById(\'machineCategories\').classList.remove(\'hidden\')" class="flex items-center gap-1 mb-3 text-[10px] font-bold cursor-pointer pointer-events-auto" style="color:var(--primary-hex)">\u2190 Zur\u00fcck</button>';
   h += '<div class="mb-4"><h4 class="text-base font-black text-white mb-1">' + window._escapeHtml(m.name) + '</h4><div class="flex items-center gap-2 flex-wrap"><span class="text-[8px] font-bold px-2 py-0.5 rounded-full" style="background:' + curveColor + '22;color:' + curveColor + '">Kraftkurve: ' + window._escapeHtml(curveName) + '</span><span class="text-[8px] font-bold px-2 py-0.5 rounded-full" style="background:rgba(255,255,255,0.05);color:#9898a2">' + window._escapeHtml(m.manufacturer || '') + '</span><span class="text-[8px] font-bold px-2 py-0.5 rounded-full" style="background:rgba(255,255,255,0.05);color:#9898a2">' + window._escapeHtml(m.category || '') + '</span></div></div>';
   h += '<div class="mb-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="text-[8px] font-bold uppercase tracking-wider mb-2" style="color:#9898a2">Muskelaktivierung</div><div class="mb-1">';
   (m.primaryMuscles || []).forEach(function(p) { h += '<span class="inline-block text-[9px] font-bold mr-1 mb-1 px-2 py-0.5 rounded" style="background:rgba(163,201,168,0.15);color:var(--primary-hex)">' + window._escapeHtml(p) + '</span>'; });
   h += '</div>';
   if (m.secondaryMuscles && m.secondaryMuscles.length > 0) { (m.secondaryMuscles).forEach(function(s) { h += '<span class="inline-block text-[9px] mr-1 mb-1 px-2 py-0.5 rounded" style="background:rgba(255,255,255,0.03);color:#666">' + window._escapeHtml(s) + '</span>'; }); }
   h += '</div>';
   h += '<div class="mb-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="text-[8px] font-bold uppercase tracking-wider mb-2" style="color:#9898a2">Biomechanik</div><p class="text-[10px] leading-relaxed text-white">' + window._escapeHtml(m.biomechanics || '') + '</p></div>';
   h += '<div class="mb-3 p-3 rounded-xl" style="background:' + curveColor + '08;border:1px solid ' + curveColor + '20"><div class="text-[8px] font-bold uppercase tracking-wider mb-1" style="color:' + curveColor + '">Kraftkurve: ' + window._escapeHtml(curveName) + '</div><p class="text-[9px]" style="color:#aaa">' + window._escapeHtml(m.strengthCurveDE || '') + '</p></div>';
   h += '<div class="grid grid-cols-2 gap-2 mb-3"><div class="p-3 rounded-xl" style="background:rgba(163,201,168,0.05);border:1px solid rgba(163,201,168,0.1)"><div class="text-[8px] font-bold mb-1" style="color:var(--primary-hex)">Ideal f\u00fcr</div><p class="text-[9px]" style="color:#ccc">' + window._escapeHtml(m.bestFor || '') + '</p></div><div class="p-3 rounded-xl" style="background:rgba(232,138,138,0.05);border:1px solid rgba(232,138,138,0.1)"><div class="text-[8px] font-bold mb-1" style="color:#e88a8a">Weniger geeignet</div><p class="text-[9px]" style="color:#ccc">' + window._escapeHtml(m.notIdealFor || '') + '</p></div></div>';
   h += '<div class="mb-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="text-[8px] font-bold uppercase tracking-wider mb-2" style="color:#9898a2">Tipps</div><p class="text-[10px] leading-relaxed" style="color:#ccc">' + window._escapeHtml(m.tips || '') + '</p></div>';
   if (m.commonMistakes && m.commonMistakes.length > 0) {
    h += '<div class="mb-3 p-3 rounded-xl" style="background:rgba(232,138,138,0.03);border:1px solid rgba(232,138,138,0.08)"><div class="text-[8px] font-bold uppercase tracking-wider mb-2" style="color:#e88a8a">H\u00e4ufige Fehler</div>';
    m.commonMistakes.forEach(function(err) { h += '<div class="flex items-start gap-2 mb-1"><span class="text-[8px] mt-0.5" style="color:#e88a8a">\u2022</span><span class="text-[9px]" style="color:#ccc">' + window._escapeHtml(err) + '</span></div>'; });
    h += '</div>';
   }
   if (m.alternatives && m.alternatives.length > 0) {
    h += '<div class="mb-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="text-[8px] font-bold uppercase tracking-wider mb-2" style="color:#9898a2">Alternativen</div><div class="flex flex-wrap gap-1">';
    m.alternatives.forEach(function(alt) { h += '<span class="text-[9px] px-2 py-1 rounded-lg" style="background:rgba(163,201,168,0.08);color:var(--primary-hex)">' + window._escapeHtml(alt) + '</span>'; });
    h += '</div></div>';
   }
   h += '<button onclick="window._askAIMachineInfo(\'' + window._escapeHtml(m.name).replace(/'/g,'') + '\')" class="w-full py-3 rounded-xl text-xs font-bold cursor-pointer pointer-events-auto flex items-center justify-center gap-2" style="background:rgba(163,201,168,0.1);border:1px solid rgba(163,201,168,0.2);color:var(--primary-hex)"><i data-lucide="sparkles" class="w-3.5 h-3.5 pointer-events-none"></i> KI Coach zu dieser Maschine fragen</button>';
   container.innerHTML = h;
   container.scrollTop = 0;
   window._refreshLucide();
  };

  window._askAIMachineInfo = function(machineName) {
   window.toggleModal('machineLibModal');
   if (typeof window.switchTab === 'function') window.switchTab('tools');
   setTimeout(function() {
    var chatInput = document.getElementById('coachInput') || document.getElementById('chatInput');
    if (chatInput) {
     chatInput.value = 'Erkl\u00e4re mir die Maschine "' + machineName + '": Welche Muskeln trainiert sie, Kraftkurve, Biomechanik, h\u00e4ufige Fehler, und Alternativen?';
     chatInput.focus();
    }
   }, 500);
  };

  // ============================================================
  // PUMP & SORENESS RATING
  // ============================================================
  window._showPumpSorenessRating = function() {
   var today = new Date().toISOString().split('T')[0];
   var sk = window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache';
   var allW = JSON.parse(localStorage.getItem(sk) || '[]');
   var todaysW = allW.filter(function(w) { return w.date === today && w.category === 'strength'; });
   if (todaysW.length === 0) return;
   var exDb = window.EXERCISE_DB || [];
   var muscleGroups = {};
   var deLabels = { 'chest': 'Brust', 'back': 'R\u00fccken', 'shoulders': 'Schultern', 'upper legs': 'Beine', 'lower legs': 'Waden', 'legs': 'Beine', 'upper arms': 'Arme', 'lower arms': 'Unterarme', 'arms': 'Arme', 'waist': 'Core', 'core': 'Core', 'cardio': 'Cardio' };
   todaysW.forEach(function(w) {
    for (var i = 0; i < exDb.length; i++) { if (exDb[i].n === w.exercise || exDb[i].de === w.exercise) { var g = deLabels[exDb[i].bp] || exDb[i].bp; muscleGroups[g] = true; break; } }
   });
   var muscles = Object.keys(muscleGroups);
   if (muscles.length === 0) return;
   var html = '<div class="text-center mb-3"><p class="text-sm font-bold text-white mb-1">' + window.t('pumpSorenessTitle', 'Pump & Muskelgef\u00fchl') + '</p><p class="text-[9px] mb-4" style="color:#9898a2">Rate jede trainierte Muskelgruppe</p></div>';
   muscles.forEach(function(muscle) {
    var mid = muscle.replace(/\s/g,'_').replace(/[^a-zA-Z0-9_]/g,'');
    html += '<div class="mb-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)" data-muscle="' + window._escapeHtml(muscle) + '">';
    html += '<div class="text-[10px] font-bold text-white mb-2">' + window._escapeHtml(muscle) + '</div>';
    html += '<div class="flex items-center justify-between mb-1"><span class="text-[8px]" style="color:#9898a2">Pump</span><div class="flex gap-1" id="pump_' + mid + '">';
    for (var p = 1; p <= 5; p++) { html += '<button onclick="window._setPumpBtn(this,' + p + ')" data-val="' + p + '" class="w-11 h-11 rounded text-[12px] font-bold cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);color:#737373;border:1px solid var(--border-hex)">' + p + '</button>'; }
    html += '</div></div>';
    html += '<div class="flex items-center justify-between"><span class="text-[8px]" style="color:#9898a2">Soreness</span><div class="flex gap-1" id="sore_' + mid + '">';
    for (var s = 1; s <= 5; s++) { html += '<button onclick="window._setSoreBtn(this,' + s + ')" data-val="' + s + '" class="w-11 h-11 rounded text-[12px] font-bold cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);color:#737373;border:1px solid var(--border-hex)">' + s + '</button>'; }
    html += '</div></div></div>';
   });
   html += '<button onclick="window._savePumpSoreness()" class="w-full py-3 rounded-xl text-sm font-bold cursor-pointer pointer-events-auto mt-2" style="background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.25);color:var(--primary-hex)" aria-label="Speichern">Speichern</button>';
   var content = document.getElementById('pumpSorenessContent');
   if (content) { content.innerHTML = html; window.toggleModal('pumpSorenessModal'); }
  };

  window._setPumpBtn = function(btn, val) {
   var par = btn.parentElement;
   par.dataset.pump = val;
   par.querySelectorAll('button').forEach(function(b) { var v = parseInt(b.dataset.val); b.style.background = v <= val ? 'rgba(163,201,168,0.3)' : 'var(--inner-bg-hex)'; b.style.color = v <= val ? '#a3c9a8' : '#737373'; });
  };
  window._setSoreBtn = function(btn, val) {
   var par = btn.parentElement;
   par.dataset.soreness = val;
   par.querySelectorAll('button').forEach(function(b) { var v = parseInt(b.dataset.val); b.style.background = v <= val ? 'rgba(232,138,138,0.3)' : 'var(--inner-bg-hex)'; b.style.color = v <= val ? '#e88a8a' : '#737373'; });
  };

  window._savePumpSoreness = function() {
   var today = new Date().toISOString().split('T')[0];
   var data = JSON.parse(localStorage.getItem('base_pump_soreness') || '{}');
   if (!data[today]) data[today] = {};
   document.querySelectorAll('#pumpSorenessContent [data-muscle]').forEach(function(el) {
    var muscle = el.dataset.muscle;
    var pumpEl = el.querySelector('[id^="pump_"]');
    var soreEl = el.querySelector('[id^="sore_"]');
    data[today][muscle] = { pump: parseInt(pumpEl ? pumpEl.dataset.pump || 0 : 0), soreness: parseInt(soreEl ? soreEl.dataset.soreness || 0 : 0) };
   });
   localStorage.setItem('base_pump_soreness', JSON.stringify(data));
   window.toggleModal('pumpSorenessModal');
   window.showToast('Pump & Soreness gespeichert!');
  };

  // ============================================================
  // MUSCLE FREQUENCY HEATMAP (4 Wochen)
  // ============================================================
  window._renderMuscleFrequencyHeatmap = function(containerId) {
   var container = document.getElementById(containerId || 'muscleFreqHeatmap');
   if (!container) return;
   var sk = window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache';
   var allW = JSON.parse(localStorage.getItem(sk) || '[]');
   var kraftW = allW.filter(function(w) { return w.category === 'strength' && w.setDetails; });
   if (kraftW.length < 5) { container.innerHTML = '<p class="text-[10px] text-center py-4" style="color:#737373">Mindestens 5 Kraft-Workouts n\u00f6tig</p>'; return; }
   var exDb = window.EXERCISE_DB || [];
   var deMap = { 'chest': 'Brust', 'back': 'R\u00fccken', 'shoulders': 'Schultern', 'upper legs': 'Beine', 'lower legs': 'Beine', 'legs': 'Beine', 'upper arms': 'Arme', 'lower arms': 'Arme', 'arms': 'Arme', 'waist': 'Core', 'core': 'Core', 'cardio': 'Cardio' };
   var now = new Date(); var weeks = [];
   for (var w = 0; w < 4; w++) {
    var ws = new Date(now); ws.setDate(ws.getDate() - ws.getDay() + 1 - (w * 7)); var we = new Date(ws); we.setDate(we.getDate() + 7);
    weeks.push({ start: ws, end: we, label: w === 0 ? 'Aktuell' : 'W-' + w });
   }
   weeks.reverse();
   var muscles = ['Brust', 'R\u00fccken', 'Schultern', 'Beine', 'Arme', 'Core'];
   var heatData = {}; muscles.forEach(function(m) { heatData[m] = [0, 0, 0, 0]; });
   kraftW.forEach(function(wo) {
    var woDate = new Date(wo.date);
    var weekIdx = -1; for (var i = 0; i < weeks.length; i++) { if (woDate >= weeks[i].start && woDate < weeks[i].end) { weekIdx = i; break; } }
    if (weekIdx === -1) return;
    var found = false;
    for (var j = 0; j < exDb.length; j++) { if (exDb[j].n === wo.exercise || exDb[j].de === wo.exercise || (exDb[j].a && exDb[j].a.some(function(a) { return a.toLowerCase() === wo.exercise.toLowerCase(); }))) { var group = deMap[exDb[j].bp] || 'Sonstige'; if (heatData[group] !== undefined) heatData[group][weekIdx]++; found = true; break; } }
    if (!found) {
     var exLower = wo.exercise.toLowerCase();
     var FALLBACK_MAP = {
      'Brust': ['bench','bankdr\u00fccken','butterfly','fliegende','dips','pec','chest','pushup','liegest\u00fctz'],
      'R\u00fccken': ['rudern','row','deadlift','kreuzheben','lat','pulldown','klimmzug','pull-up','chin-up','hyperextension'],
      'Schultern': ['schulter','shoulder','press','military','seitheben','lateral','frontheben','overhead'],
      'Beine': ['squat','kniebeuge','leg press','beinpresse','lunge','ausfallschritt','bein','leg extension','leg curl','hip thrust','glute','wade','calf','hack squat','rdl'],
      'Arme': ['curl','bizeps','trizeps','tricep','hammer','preacher','pushdown','french press','skull'],
      'Core': ['crunch','plank','sit-up','bauch','core','ab ','hollow','dragon']
     };
     for (var g in FALLBACK_MAP) { if (FALLBACK_MAP[g].some(function(kw) { return exLower.indexOf(kw) !== -1; })) { if (heatData[g] !== undefined) heatData[g][weekIdx]++; break; } }
    }
   });
   var html = '<div class="mb-2"><span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Trainingsfrequenz / Muskelgruppe</span></div>';
   html += '<div class="flex mb-1"><div style="width:60px"></div>';
   weeks.forEach(function(w) { html += '<div class="flex-1 text-center text-[7px] font-bold" style="color:#737373">' + w.label + '</div>'; });
   html += '</div>';
   muscles.forEach(function(muscle) {
    html += '<div class="flex items-center mb-1"><div class="text-[8px] font-bold" style="width:60px;color:#9898a2">' + muscle + '</div>';
    heatData[muscle].forEach(function(count) {
     var intensity = Math.min(count / 3, 1);
     var bg = count === 0 ? '#0f110f' : 'rgba(163,201,168,' + (0.15 + intensity * 0.45) + ')';
     var tc = count === 0 ? '#333' : count >= 3 ? '#fff' : '#a3c9a8';
     html += '<div class="flex-1 text-center py-2 mx-0.5 rounded text-[10px] font-bold" style="background:' + bg + ';color:' + tc + '">' + count + '</div>';
    });
    html += '</div>';
   });
   var lowFreq = muscles.filter(function(m) { return heatData[m].reduce(function(a,b){return a+b;},0) < 4; });
   if (lowFreq.length > 0) { html += '<div class="mt-3 p-2 rounded-lg text-[9px]" style="background:rgba(232,138,138,0.05);border:1px solid rgba(232,138,138,0.1);color:#e88a8a">Untertrainiert: ' + lowFreq.join(', ') + ' \u2014 empfohlen: min. 2x/Woche</div>'; }
   container.innerHTML = html;
  };

  window._getStrengthCurve = function(exerciseName) {
   if (window._MACHINE_DB) { for (var i = 0; i < window._MACHINE_DB.length; i++) { var m = window._MACHINE_DB[i]; if ((m.name || '').toLowerCase().indexOf(exerciseName.toLowerCase()) !== -1) return m.strengthCurve || 'unknown'; if (m.aliases) { for (var a = 0; a < m.aliases.length; a++) { if (m.aliases[a].toLowerCase().indexOf(exerciseName.toLowerCase()) !== -1) return m.strengthCurve || 'unknown'; } } } }
   var name = exerciseName.toLowerCase();
   if (name.match(/kabel|cable|pulley|lat.*pull|ruder.*kabel/)) return 'constant';
   if (name.match(/curl|bizeps|preacher/)) return 'descending';
   if (name.match(/fly|butterfly|pec.*deck/)) return 'bell-shaped';
   if (name.match(/press|drück|squat|beuge|deadlift|push|bankdr/)) return 'ascending';
   return 'unknown';
  };

  // ============================================================
  window._findExerciseAlternatives = function(exerciseName, maxResults) {
   maxResults = maxResults || 6;
   var exDb = window.EXERCISE_DB || [];
   var current = null;
   for (var i = 0; i < exDb.length; i++) { if (exDb[i].n === exerciseName || exDb[i].de === exerciseName) { current = exDb[i]; break; } }
   if (!current) return [];
   var alts = [];
   var lang = window.currentLang || 'de';
   for (var j = 0; j < exDb.length; j++) {
    var ex = exDb[j]; if (ex.n === current.n) continue;
    var score = 0;
    if (ex.bp && current.bp && ex.bp === current.bp) score += 40;
    if (ex.t && current.t && ex.t === current.t) score += 30;
    if (ex.bp === current.bp && ex.t === current.t) score += 10;
    var currentCurve = window._getStrengthCurve(current.de || current.n);
    var altCurve = window._getStrengthCurve(ex.de || ex.n);
    if (currentCurve !== 'unknown' && currentCurve === altCurve) score += 20;
    else if (currentCurve !== 'unknown' && altCurve !== 'unknown') score += 5;
    if (score > 0) alts.push({ name: lang === 'de' ? (ex.de || ex.n) : ex.n, bodyPart: ex.bp, target: ex.t, id: ex.id, matchScore: Math.min(score, 100), strengthCurve: altCurve });
   }
   alts.sort(function(a, b) { return b.matchScore - a.matchScore; });
   return alts.slice(0, maxResults);
  };

  window.openExerciseSwap = function(exerciseName) {
   if (!exerciseName || !exerciseName.trim()) return;
   var alts = window._findExerciseAlternatives(exerciseName);
   if (alts.length === 0) { window.showToast(window.t('swapNoAlts', 'Keine Alternativen gefunden')); return; }
   var html = '<div class="mb-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">' + window.t('swapCurrent', 'Aktuelle Übung') + '</p><p class="text-sm font-bold text-white">' + window._escapeHtml(exerciseName) + '</p></div>';
   html += '<p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">' + window.t('swapChoose', 'Waehle eine Alternative') + '</p>';
   alts.forEach(function(alt) {
    var mc = alt.matchScore >= 80 ? '#a3c9a8' : alt.matchScore >= 60 ? '#e8c86a' : '#e88a8a';
    var imgUrl = (alt.id && window._getExerciseImageUrl) ? window._getExerciseImageUrl(alt.id) : '';
    var imgHtml = imgUrl ? '<img src="' + imgUrl + '" alt="" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" onerror="this.style.display=\'none\'">' : '<div class="w-10 h-10 rounded-lg flex-shrink-0" style="background:var(--inner-bg-hex)"></div>';
    html += '<div onclick="window._confirmSwap(\'' + window._escapeHtml(alt.name).replace(/'/g, "\\'") + '\')" class="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">' + imgHtml + '<div class="flex-1 min-w-0"><p class="text-sm font-bold text-white truncate">' + window._escapeHtml(alt.name) + '</p><p class="text-[8px] text-zinc-500">' + window._escapeHtml(alt.bodyPart || '') + ' \u00b7 ' + window._escapeHtml(alt.target || '') + (alt.strengthCurve && alt.strengthCurve !== 'unknown' ? ' · <span style="color:' + ({ascending:'#a3c9a8',descending:'#8aafe8',constant:'#e8c86a','bell-shaped':'#c9a3c9'}[alt.strengthCurve] || '#737373') + '">' + ({ascending:'Aufsteigend',descending:'Absteigend',constant:'Konstant','bell-shaped':'Glockenförmig'}[alt.strengthCurve] || '') + '</span>' : '') + '</p></div><div class="text-right flex-shrink-0"><p class="text-sm font-black" style="color:' + mc + '">' + alt.matchScore + '%</p><div class="w-12 h-1.5 rounded-full mt-1" style="background:#1a1a1a"><div class="h-full rounded-full" style="width:' + alt.matchScore + '%;background:' + mc + '"></div></div></div></div>';
   });
   html += '<button onclick="window.toggleModal(\'exerciseSwapModal\')" class="w-full mt-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer pointer-events-auto" style="background:none;color:#888;border:1px solid var(--border-hex)">' + window.t('swapKeepOriginal', 'Original beibehalten') + '</button>';
   var content = document.getElementById('exerciseSwapContent');
   if (content) content.innerHTML = html;
   window.toggleModal('exerciseSwapModal');
  };

  window._confirmSwap = function(newName) {
   var input = document.getElementById('exerciseInput');
   if (input) { input.value = newName; input.dispatchEvent(new Event('change')); }
   window.toggleModal('exerciseSwapModal');
   window.showToast(window.t('swapDone', 'Übung getauscht!'));
  };

  // Swap button visibility
  (function() {
   function setupSwapBtn() {
    var exInput = document.getElementById('exerciseInput');
    var swapBtn = document.getElementById('btnSwapExercise');
    if (!exInput || !swapBtn) return;
    exInput.addEventListener('input', function() { swapBtn.style.display = exInput.value.trim() ? 'flex' : 'none'; });
    exInput.addEventListener('change', function() { swapBtn.style.display = exInput.value.trim() ? 'flex' : 'none'; });
   }
   if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { setTimeout(setupSwapBtn, 500); });
   else setTimeout(setupSwapBtn, 500);
  })();

  // ============================================================
  // KI FORM CHECK
  // ============================================================
  window._FORM_CHECK_DISCLAIMER = {
   de: '\u26a0\ufe0f Dies ist eine KI-gestuetzte Einschaetzung und ersetzt keine professionelle Beratung durch einen Trainer oder Physiotherapeuten. Bei Schmerzen oder Unsicherheit konsultiere einen Fachmann.',
   en: '\u26a0\ufe0f This is an AI-based assessment and does not replace professional advice from a trainer or physiotherapist. If you experience pain or uncertainty, consult a professional.',
   fr: '\u26a0\ufe0f Ceci est une evaluation basee sur l\'IA et ne remplace pas les conseils professionnels. En cas de douleur, consultez un professionnel.',
   es: '\u26a0\ufe0f Esta es una evaluacion basada en IA y no reemplaza el consejo profesional. Si sientes dolor, consulta a un profesional.',
   it: '\u26a0\ufe0f Questa e una valutazione basata sull\'IA e non sostituisce la consulenza professionale. In caso di dolore, consulta un professionista.',
   nl: '\u26a0\ufe0f Dit is een AI-gebaseerde beoordeling en vervangt geen professioneel advies. Bij pijn of twijfel, raadpleeg een professional.',
   ar: '\u26a0\ufe0f هذا تقييم قائم على الذكاء الاصطناعي ولا يحل محل المشورة المهنية. في حالة الألم استشر متخصصاً.'
  };
  window._FORM_CHECK_EXERCISES = [
   { id: 'squat', name: { de: 'Kniebeuge (Squat)', en: 'Squat' }, icon: '\ud83e\uddb5' },
   { id: 'deadlift', name: { de: 'Kreuzheben (Deadlift)', en: 'Deadlift' }, icon: '\ud83c\udfcb\ufe0f' },
   { id: 'bench', name: { de: 'Bankdrücken', en: 'Bench Press' }, icon: '\ud83d\udcaa' },
   { id: 'ohp', name: { de: 'Schulterdrücken', en: 'Overhead Press' }, icon: '\ud83d\ude46' },
   { id: 'row', name: { de: 'Rudern (Row)', en: 'Barbell Row' }, icon: '\ud83d\udea3' },
   { id: 'pullup', name: { de: 'Klimmzug', en: 'Pull-Up' }, icon: '\ud83e\uddd7' },
   { id: 'lunge', name: { de: 'Ausfallschritt', en: 'Lunge' }, icon: '\ud83e\uddbe' },
   { id: 'plank', name: { de: 'Plank', en: 'Plank' }, icon: '\ud83e\uddd8' },
   { id: 'pushup', name: { de: 'Liegestütz', en: 'Push-Up' }, icon: '\ud83e\udef8' }
  ];
  window._selectedFormCheckExercise = null;

  window.openFormCheck = function() {
   if (!window.checkFeatureGate || !window.checkFeatureGate('scan')) return;
   var lang = window.currentLang || 'de';
   var disclaimer = window._FORM_CHECK_DISCLAIMER[lang] || window._FORM_CHECK_DISCLAIMER.de;
   var exerciseHtml = window._FORM_CHECK_EXERCISES.map(function(ex) {
    var name = ex.name[lang] || ex.name.en || ex.name.de;
    return '<button onclick="window._selectFormCheckExercise(\'' + ex.id + '\')" class="flex items-center gap-3 w-full p-3 rounded-xl text-left cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)" id="fcEx_' + ex.id + '"><span style="font-size:20px">' + ex.icon + '</span><span class="text-sm font-bold text-white">' + window._escapeHtml(name) + '</span></button>';
   }).join('');
   var content = document.getElementById('formCheckContent');
   if (content) {
    content.innerHTML = '<div class="mb-4 p-3 rounded-xl" style="background:rgba(232,138,138,0.08);border:1px solid rgba(232,138,138,0.15)"><p class="text-[10px] text-zinc-400 leading-relaxed">' + window._escapeHtml(disclaimer) + '</p></div>' +
     '<p class="text-sm font-black text-white mb-3">' + window.t('fcSelectExercise', 'Welche Übung möchtest du prüfen?') + '</p>' +
     '<div class="grid grid-cols-2 gap-2 mb-4">' + exerciseHtml + '</div>';
   }
   window.toggleModal('formCheckModal');
   window._refreshLucide();
  };

  window._selectFormCheckExercise = function(exerciseId) {
   window._selectedFormCheckExercise = exerciseId;
   window._FORM_CHECK_EXERCISES.forEach(function(ex) {
    var el = document.getElementById('fcEx_' + ex.id);
    if (el) { el.style.background = ex.id === exerciseId ? 'rgba(163,201,168,0.15)' : 'var(--inner-bg-hex)'; el.style.borderColor = ex.id === exerciseId ? 'rgba(163,201,168,0.3)' : 'var(--border-hex)'; }
   });
   var lang = window.currentLang || 'de';
   var ex = window._FORM_CHECK_EXERCISES.find(function(e) { return e.id === exerciseId; });
   var exName = ex ? (ex.name[lang] || ex.name.en) : exerciseId;
   var old = document.getElementById('formCheckCameraSection');
   if (old) old.remove();
   var cam = document.createElement('div');
   cam.id = 'formCheckCameraSection';
   cam.innerHTML = '<div class="mt-4 p-4 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><p class="text-xs font-bold text-white mb-1">' + window._escapeHtml(exName) + '</p><p class="text-[10px] text-zinc-500 mb-4">' + window.t('fcInstructions', 'Filme dich von der Seite. Ganzer Koerper sichtbar. 1 Wiederholung reicht.') + '</p><div class="flex gap-3"><button onclick="window._captureFormCheck(\'camera\')" class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.15);color:var(--primary-hex);border:1px solid rgba(163,201,168,0.25)"><i data-lucide="camera" class="w-4 h-4 pointer-events-none"></i> ' + window.t('fcTakePhoto', 'Foto aufnehmen') + '</button><button onclick="window._captureFormCheck(\'upload\')" class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);color:#ccc;border:1px solid var(--border-hex)"><i data-lucide="upload" class="w-4 h-4 pointer-events-none"></i> ' + window.t('fcUpload', 'Bild hochladen') + '</button></div><div id="formCheckPreview" class="hidden mt-4"></div><div id="formCheckResult" class="hidden mt-4"></div></div>';
   var content = document.getElementById('formCheckContent');
   if (content) content.appendChild(cam);
   window._refreshLucide();
  };

  window._captureFormCheck = function(mode) {
   var input = document.createElement('input');
   input.type = 'file'; input.accept = 'image/*';
   if (mode === 'camera') input.capture = 'environment';
   input.onchange = function(e) {
    var file = e.target.files[0]; if (!file) return;
    if (file.size > 4 * 1024 * 1024) { window.showToast(window.t('fcTooBig', 'Bild zu gross. Bitte unter 4MB.')); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
     var base64 = ev.target.result;
     var preview = document.getElementById('formCheckPreview');
     if (preview) {
      preview.classList.remove('hidden');
      preview.innerHTML = '<img src="' + base64 + '" class="w-full rounded-xl mb-3" style="max-height:300px;object-fit:contain" alt="Form Check"><button onclick="window._analyzeFormCheck(\'' + window._selectedFormCheckExercise + '\')" class="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest cursor-pointer pointer-events-auto" style="background:#a3c9a8;color:#0f110f"><i data-lucide="sparkles" class="w-4 h-4 inline pointer-events-none"></i> ' + window.t('fcAnalyze', 'Form analysieren') + '</button>';
      window._refreshLucide();
     }
     window._formCheckImageData = base64.split(',')[1];
     window._formCheckMimeType = file.type || 'image/jpeg';
    };
    reader.readAsDataURL(file);
   };
   input.click();
  };

  window._analyzeFormCheck = async function(exerciseId) {
   if (!exerciseId || !window._formCheckImageData) return;
   var lang = window.currentLang || 'de';
   var ex = window._FORM_CHECK_EXERCISES.find(function(e) { return e.id === exerciseId; });
   var exName = ex ? (ex.name.en || ex.name.de) : exerciseId;
   var resultEl = document.getElementById('formCheckResult');
   if (resultEl) { resultEl.classList.remove('hidden'); resultEl.innerHTML = '<div class="flex items-center justify-center gap-2 py-6"><i data-lucide="loader-2" class="w-5 h-5 animate-spin" style="color:var(--primary-hex)"></i><span class="text-sm text-zinc-400">' + window.t('fcAnalyzing', 'Analysiere deine Form...') + '</span></div>'; window._refreshLucide(); }
   var langName = { de: 'Deutsch', en: 'English', fr: 'Francais', es: 'Espanol', it: 'Italiano', nl: 'Nederlands', ar: 'العربية' }[lang] || 'Deutsch';
   var _fcProfile = window.userProfile || {};
   var _fcInjCtx = '';
   if (_fcProfile.injuries && _fcProfile.injuries.length > 0) _fcInjCtx += '\n\nWICHTIG: Der Athlet hat folgende Beschwerden: ' + _fcProfile.injuries.join(', ') + '. Achte besonders auf Bewegungsmuster die diese Bereiche belasten.';
   if (_fcProfile.age) _fcInjCtx += '\nAlter: ' + _fcProfile.age;
   if (_fcProfile.experience) _fcInjCtx += '\nErfahrungslevel: ' + _fcProfile.experience;
   var prompt = 'Du bist ein erfahrener Strength & Conditioning Coach. Analysiere dieses Bild einer ' + exName + ' \u00dcbung.\n\nWICHTIG: Du gibst NUR allgemeine Hinweise zur \u00dcbungsform. Du stellst KEINE medizinischen Diagnosen.\n\nWenn das Bild KEINE erkennbare \u00dcbungsausf\u00fchrung zeigt, sage das klar.\n\nWenn du eine ' + exName + ' erkennst, analysiere:\n1. K\u00f6rperhaltung (R\u00fccken, Knie, H\u00fcfte)\n2. Bewegungstiefe\n3. Erkennbare Asymmetrien\n4. 2-3 konkrete Verbesserungsvorschl\u00e4ge\n\nWenn du dir bei einem Aspekt NICHT sicher bist, sage "Aus diesem Winkel kann ich X nicht eindeutig beurteilen."' + _fcInjCtx + '\n\nMax 150 W\u00f6rter. Freundlich und motivierend.\n\nAntworte auf ' + langName + '.';
   try {
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 30000);
    var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ image: window._formCheckImageData, mimeType: window._formCheckMimeType || 'image/jpeg', prompt: prompt, type: 'scan', userId: window._getAiUserId ? window._getAiUserId() : 'anon' }) });
    clearTimeout(timeout);
    if (res.status === 429) { try { var errData = await res.json(); window.showToast(errData.error || window.t('lblRateLimit', 'Tageslimit erreicht.'), 'error', 4000); } catch(e) {} if (resultEl) resultEl.classList.add('hidden'); return; }
    if (!res.ok) { window.showToast(window.t('lblServerError', 'Server-Fehler.'), 'error', 4000); if (resultEl) resultEl.classList.add('hidden'); return; }
    var raw = await res.text();
    var responseText = '';
    try { var parsed = JSON.parse(raw); if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts) { var parts = parsed.candidates[0].content.parts; for (var i = parts.length - 1; i >= 0; i--) { if (parts[i].text) { responseText = parts[i].text; break; } } } else if (parsed.reply) { responseText = parsed.reply; } else if (parsed.text) { responseText = parsed.text; } } catch(e) { responseText = raw; }
    if (!responseText || responseText.trim().length === 0) { window.showToast(window.t('lblEmptyResponse', 'Keine Antwort erhalten.'), 'error'); if (resultEl) resultEl.classList.add('hidden'); return; }
    if (window.awardXP) window.awardXP('scanAnalysis');
    if (window._markFeatureUsed) window._markFeatureUsed('formcheck_used');
    var disclaimer = window._FORM_CHECK_DISCLAIMER[lang] || window._FORM_CHECK_DISCLAIMER.de;
    if (resultEl) { resultEl.innerHTML = '<div class="p-4 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="flex items-center gap-2 mb-3"><i data-lucide="scan-eye" class="w-4 h-4" style="color:var(--primary-hex)"></i><p class="text-xs font-black uppercase tracking-widest" style="color:var(--primary-hex)">' + window.t('fcResultTitle', 'Form-Analyse') + ' (Beta)</p></div><div class="text-sm text-zinc-300 leading-relaxed mb-4">' + window._sanitizeAIHtml(responseText) + '</div><div class="p-3 rounded-lg" style="background:rgba(232,138,138,0.06);border:1px solid rgba(232,138,138,0.12)"><p class="text-[9px] text-zinc-500 leading-relaxed">' + window._escapeHtml(disclaimer) + '</p></div><div class="flex gap-2 mt-3"><button onclick="window._captureFormCheck(\'camera\')" class="flex-1 py-2.5 rounded-lg text-[10px] font-bold cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.1);color:var(--primary-hex);border:1px solid rgba(163,201,168,0.2)">' + window.t('fcRetry', 'Nochmal filmen') + '</button><button onclick="window.toggleModal(\'formCheckModal\')" class="flex-1 py-2.5 rounded-lg text-[10px] font-bold cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);color:#888;border:1px solid var(--border-hex)">' + window.t('btnClose', 'Schliessen') + '</button></div></div>'; window._refreshLucide(); }
   } catch(err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') window.showToast(window.t('lblTimeout', 'Zeitueberschreitung.'), 'error', 4000);
    else window.showToast(window.t('lblError', 'Fehler') + ': ' + err.message, 'error', 4000);
    if (resultEl) resultEl.classList.add('hidden');
   }
   window._formCheckImageData = null; window._formCheckMimeType = null;
  };

  // ============================================================
  // MUSKELBALANCE ANALYSE
  // ============================================================
  window._computeMuscleBalance = function() {
   var workouts = window.workouts || [];
   var archived = workouts.filter(function(w) { return w.archived && w.category === 'strength'; });
   if (archived.length < 5) return null;
   var exDb = window.EXERCISE_DB || [];
   var exMap = {};
   for (var i = 0; i < exDb.length; i++) {
    var ex = exDb[i];
    if (ex.n) exMap[ex.n.toLowerCase()] = { bp: ex.bp || '', t: ex.t || '' };
    if (ex.de) exMap[ex.de.toLowerCase()] = { bp: ex.bp || '', t: ex.t || '' };
   }
   var bodyPartCounts = {};
   var targetCounts = {};
   var totalSets = 0;
   var last30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
   archived.forEach(function(w) {
    if (w.date < last30) return;
    var lookup = exMap[(w.exercise || '').toLowerCase()];
    if (!lookup) return;
    var sets = (w.setDetails && w.setDetails.length) || 1;
    totalSets += sets;
    if (lookup.bp) bodyPartCounts[lookup.bp] = (bodyPartCounts[lookup.bp] || 0) + sets;
    if (lookup.t) targetCounts[lookup.t] = (targetCounts[lookup.t] || 0) + sets;
   });
   if (totalSets === 0) return null;
   var bodyParts = Object.keys(bodyPartCounts).map(function(bp) {
    return { name: bp, sets: bodyPartCounts[bp], pct: Math.round((bodyPartCounts[bp] / totalSets) * 100) };
   }).sort(function(a, b) { return b.sets - a.sets; });
   var targets = Object.keys(targetCounts).map(function(t) {
    return { name: t, sets: targetCounts[t], pct: Math.round((targetCounts[t] / totalSets) * 100) };
   }).sort(function(a, b) { return b.sets - a.sets; });
   var bpMap = {};
   bodyParts.forEach(function(bp) { bpMap[bp.name] = bp.pct; });
   var warnings = [];
   // Push/Pull: chest+shoulders vs back
   var pushPct = (bpMap['chest'] || 0) + (bpMap['shoulders'] || 0);
   var pullPct = bpMap['back'] || 0;
   var ppRatio = pullPct > 0 ? (pushPct / pullPct) : null;
   if (ppRatio && ppRatio > 1.8) {
    warnings.push({ type: 'imbalance', text: window.t('balancePushHeavy', 'Push-Muskeln (Brust/Schultern) deutlich mehr als Pull (Rücken). Kann zu Haltungsproblemen führen.'), suggestion: window.t('balancePushFix', 'Empfehlung: 2-3 Rückenübungen pro Woche (Rudern, Klimmzüge, Face Pulls)') });
   } else if (ppRatio && ppRatio < 0.6) {
    warnings.push({ type: 'imbalance', text: window.t('balancePullHeavy', 'Pull-Muskeln deutlich mehr als Push. Ergänze Brust- und Schulterübungen.'), suggestion: window.t('balancePullFix', 'Empfehlung: Bankdrücken, Schulterdrücken und Dips hinzufügen') });
   }
   // Upper/Lower: chest+back+shoulders+arms vs legs
   var upperPct = (bpMap['chest'] || 0) + (bpMap['back'] || 0) + (bpMap['shoulders'] || 0) + (bpMap['arms'] || 0);
   var lowerPct = bpMap['legs'] || 0;
   var ulRatio = lowerPct > 0 ? (upperPct / lowerPct) : null;
   if (ulRatio && ulRatio > 3) {
    warnings.push({ type: 'skip_leg_day', text: window.t('balanceLegs', 'Beine machen nur ' + lowerPct + '% deines Trainings aus. Never skip leg day!'), suggestion: window.t('balanceLegsFix', 'Empfehlung: Squats, Lunges und Romanian Deadlifts 2x pro Woche') });
   }
   // Neglected groups
   var expected = ['chest', 'back', 'shoulders', 'legs', 'core'];
   var bpLabels = { chest: 'Brust', back: 'Rücken', shoulders: 'Schultern', legs: 'Beine', core: 'Core/Bauch', arms: 'Arme' };
   expected.forEach(function(g) {
    if (!bpMap[g] || bpMap[g] < 3) {
     warnings.push({ type: 'neglected', text: (bpLabels[g] || g) + ' ' + window.t('balanceNeglected', 'wird kaum trainiert') + ' (' + (bpMap[g] || 0) + '%)' });
    }
   });
   return { bodyParts: bodyParts, targets: targets, totalSets: totalSets, warnings: warnings, pushPullRatio: ppRatio ? ppRatio.toFixed(1) : null, upperLowerRatio: ulRatio ? ulRatio.toFixed(1) : null };
  };

  window._renderMuscleBalance = function() {
   var container = document.getElementById('muscleBalanceContainer');
   if (!container) return;
   var data = window._computeMuscleBalance();
   if (!data) { container.innerHTML = '<p class="text-xs text-zinc-600 text-center py-4">' + window.t('balanceNoData', 'Tracke mindestens 5 Kraft-Workouts für die Muskelbalance-Analyse') + '</p>'; return; }
   var colors = { chest: '#e88a8a', back: '#8aafe8', shoulders: '#e8c86a', arms: '#a3c9a8', legs: '#e8b08a', core: '#a8a8e8', cardio: '#e88ab8' };
   var bpLabels = { chest: 'Brust', back: 'Rücken', shoulders: 'Schultern', arms: 'Arme', legs: 'Beine', core: 'Core/Bauch', cardio: 'Cardio' };
   var html = '';
   if (data.warnings.length > 0) {
    html += '<div class="mb-4">';
    data.warnings.slice(0, 3).forEach(function(w) {
     var icon = w.type === 'skip_leg_day' ? '\ud83e\uddb5' : w.type === 'imbalance' ? '\u2696\ufe0f' : '\u26a0\ufe0f';
     html += '<div class="p-3 rounded-xl mb-2" style="background:rgba(232,138,138,0.08);border:1px solid rgba(232,138,138,0.15)">';
     html += '<p class="text-xs font-bold text-white flex items-center gap-2">' + icon + ' ' + window._escapeHtml(w.text) + '</p>';
     if (w.suggestion) html += '<p class="text-[10px] mt-1" style="color:var(--primary-hex)">' + window._escapeHtml(w.suggestion) + '</p>';
     html += '</div>';
    });
    html += '</div>';
   }
   if (data.pushPullRatio || data.upperLowerRatio) {
    html += '<div class="grid grid-cols-2 gap-3 mb-4">';
    if (data.pushPullRatio) {
     var ppColor = parseFloat(data.pushPullRatio) > 1.5 || parseFloat(data.pushPullRatio) < 0.7 ? '#e88a8a' : '#a3c9a8';
     html += '<div class="p-3 rounded-xl text-center" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Push/Pull</p><p class="text-xl font-black" style="color:' + ppColor + '">' + data.pushPullRatio + '</p><p class="text-[9px] text-zinc-600">' + window.t('balanceIdeal', 'Ideal: 1.0 - 1.5') + '</p></div>';
    }
    if (data.upperLowerRatio) {
     var ulColor = parseFloat(data.upperLowerRatio) > 2.5 ? '#e88a8a' : '#a3c9a8';
     html += '<div class="p-3 rounded-xl text-center" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Upper/Lower</p><p class="text-xl font-black" style="color:' + ulColor + '">' + data.upperLowerRatio + '</p><p class="text-[9px] text-zinc-600">' + window.t('balanceIdeal2', 'Ideal: 1.0 - 2.0') + '</p></div>';
    }
    html += '</div>';
   }
   html += '<p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">' + window.t('balanceDistribution', 'Verteilung (letzte 30 Tage)') + '</p>';
   var maxPct = data.bodyParts.length > 0 ? data.bodyParts[0].pct : 100;
   data.bodyParts.forEach(function(bp) {
    var color = colors[bp.name] || '#888';
    var barWidth = Math.max(4, Math.round((bp.pct / maxPct) * 100));
    var label = bpLabels[bp.name] || bp.name;
    html += '<div class="flex items-center gap-3 mb-2"><span class="text-[10px] font-bold text-zinc-400 w-20 text-right flex-shrink-0">' + window._escapeHtml(label) + '</span><div class="flex-1 h-5 rounded-md overflow-hidden" style="background:#1a1a1a"><div style="width:' + barWidth + '%;height:100%;background:' + color + ';border-radius:6px;transition:width 0.5s ease"></div></div><span class="text-[10px] font-black w-10 text-right flex-shrink-0" style="color:' + color + '">' + bp.pct + '%</span><span class="text-[9px] text-zinc-600 w-8 text-right flex-shrink-0">' + bp.sets + 'x</span></div>';
   });
   html += '<p class="text-[9px] text-zinc-600 text-center mt-3">' + data.totalSets + ' Sets total \u00b7 ' + window.t('balancePeriod', 'Letzte 30 Tage') + '</p>';
   container.innerHTML = html;
  };

  // ============================================================
  // XP / LEVEL / RANG SYSTEM
  // ============================================================
  // ============================================================
  // REFERRAL SYSTEM
  // ============================================================
  window._getReferralCode = function() {
    var stored = localStorage.getItem('base_referral_code');
    if (stored) return stored;
    var uid = (window._fbAuth && window._fbAuth.currentUser) ? window._fbAuth.currentUser.uid : null;
    if (!uid) return null;
    var code = uid.substring(0, 8) + Math.random().toString(36).substring(2, 6).toUpperCase();
    localStorage.setItem('base_referral_code', code);
    return code;
  };

  window._getReferralLink = function() {
    var code = window._getReferralCode();
    if (!code) return 'https://base-app.tech';
    return 'https://base-app.tech?ref=' + code;
  };

  window._shareReferralLink = function() {
    var link = window._getReferralLink();
    var text = '\uD83D\uDCAA Ich trainiere mit BASE \u2014 der KI-Fitness-App fuer alle Sportarten.\nMelde dich an und wir bekommen beide 500 XP:\n' + link;
    if (navigator.share) {
      navigator.share({ title: 'BASE Fitness App', text: text, url: link }).catch(function() { window._copyReferralLink(link); });
    } else { window._copyReferralLink(link); }
  };

  window._copyReferralLink = function(link) {
    var l = link || window._getReferralLink();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(l).then(function() { window.showToast('\uD83D\uDD17 Einlade-Link kopiert!'); });
    } else { window.showToast('Link: ' + l); }
  };

  window._processReferralReward = function() {
    var pendingRef = localStorage.getItem('base_pending_referral');
    if (!pendingRef) return;
    var allArchived = (window.workouts || []).filter(function(w) { return w.archived; });
    if (allArchived.length !== 1) return;
    localStorage.removeItem('base_pending_referral');
    localStorage.setItem('base_referral_used', '1');
    if (window.awardXP) window.awardXP('referral_new');
    setTimeout(function() { window.showToast('\uD83C\uDF89 +500 XP! Du wurdest von einem Freund eingeladen.', null, null, null, 5000); }, 2000);
    // Einladenden User in Firestore belohnen
    try {
      var db = window._fbDb;
      if (db && window._fbGetDoc && window._fbDoc) {
        // Referral-Count des Einladenden erhoehen
        var refDocRef = window._fbDoc(db, 'referrals', pendingRef);
        window._fbSetDoc(refDocRef, { count: 1, lastUsed: new Date().toISOString() }, { merge: true });
      }
    } catch(e) { console.warn('[Referral] Firestore update failed:', e.message); }
  };

  window._updateReferralUI = function() {
    var code = window._getReferralCode();
    var display = document.getElementById('referralLinkDisplay');
    if (display) display.textContent = code ? 'base-app.tech?ref=' + code : 'Zuerst registrieren';
    var count = parseInt(localStorage.getItem('base_referral_count') || '0');
    var countEl = document.getElementById('referralCountDisplay');
    if (countEl) countEl.textContent = count;
    var xpEl = document.getElementById('referralXPDisplay');
    if (xpEl) xpEl.textContent = (count * 500).toLocaleString();
  };

  window.BASE_XP = {
   sources: { workout: 50, coachChat: 15, scanAnalysis: 25, planGenerated: 40, challengeJoin: 30, goalComplete: 500, streak7: 200, streak30: 1000, weeklyConsistency: 100, milestone: 100, achievement: 200, referral_new: 500, referral_invite: 500, briefingUsed: 10 },
   maxPerDay: { workout: 2, coachChat: 3, scanAnalysis: 1, planGenerated: 1, challengeJoin: 1, weeklyConsistency: 1, milestone: 99, achievement: 99 },
   ranks: [
    { name: 'Rookie', minXP: 0, maxLevel: 4 },
    { name: 'Contender', minXP: 500, maxLevel: 9 },
    { name: 'Veteran', minXP: 2000, maxLevel: 14 },
    { name: 'Elite', minXP: 6000, maxLevel: 19 },
    { name: 'Legend', minXP: 15000, maxLevel: 99 }
   ]
  };

  window._xpForLevel = function(level) {
   if(level <= 1) return 0;
   return Math.floor(100 * Math.pow(1.3, level - 1));
  };

  window._getLevelFromXP = function(totalXP) {
   var level = 1, xpNeeded = 0;
   while(true) {
    var nextLevel = window._xpForLevel(level + 1);
    if(totalXP < xpNeeded + nextLevel) break;
    xpNeeded += nextLevel;
    level++;
    if(level > 99) break;
   }
   return { level: level, currentXP: totalXP - xpNeeded, nextLevelXP: window._xpForLevel(level + 1), totalXP: totalXP };
  };

  window._getRank = function(totalXP) {
   var ranks = window.BASE_XP.ranks;
   var rank = ranks[0];
   for(var i = ranks.length - 1; i >= 0; i--) {
    if(totalXP >= ranks[i].minXP) { rank = ranks[i]; break; }
   }
   return rank;
  };

  window.awardXP = function(source) {
   var xpData = JSON.parse(localStorage.getItem('base_xp_data') || '{"totalXP":0,"history":[],"dailyCounts":{}}');
   var today = new Date().toISOString().split('T')[0];
   var maxPerDay = window.BASE_XP.maxPerDay[source];
   if(maxPerDay) {
    var dailyKey = source + '_' + today;
    var count = xpData.dailyCounts[dailyKey] || 0;
    if(count >= maxPerDay) return null;
    xpData.dailyCounts[dailyKey] = count + 1;
   }
   Object.keys(xpData.dailyCounts).forEach(function(key) {
    if(!key.endsWith(today) && !key.endsWith(new Date(Date.now() - 86400000).toISOString().split('T')[0])) { delete xpData.dailyCounts[key]; }
   });
   var amount = window.BASE_XP.sources[source];
   if(!amount) return null;
   var oldLevel = window._getLevelFromXP(xpData.totalXP).level;
   xpData.totalXP += amount;
   var newLevel = window._getLevelFromXP(xpData.totalXP).level;
   xpData.history.push({ source: source, amount: amount, date: today });
   if(xpData.history.length > 100) xpData.history = xpData.history.slice(-100);
   localStorage.setItem('base_xp_data', JSON.stringify(xpData));
   window._renderXPBar();
   if(newLevel > oldLevel) { window._showLevelUp(newLevel, window._getRank(xpData.totalXP)); }
   window._syncXPToCloud(xpData);
   return { amount: amount, totalXP: xpData.totalXP, level: newLevel };
  };

  window._renderXPBar = function() {
   var container = document.getElementById('xpBarContainer');
   if(!container) return;
   var xpData = JSON.parse(localStorage.getItem('base_xp_data') || '{"totalXP":0}');
   var info = window._getLevelFromXP(xpData.totalXP);
   var rank = window._getRank(xpData.totalXP);
   var pct = info.nextLevelXP > 0 ? Math.min(100, Math.round((info.currentXP / info.nextLevelXP) * 100)) : 100;
   container.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:4px 0">' +
    '<span style="font-size:10px;font-weight:800;color:var(--primary-hex);text-transform:uppercase;letter-spacing:0.1em;white-space:nowrap">' + rank.name + ' \u00b7 Lv ' + info.level + '</span>' +
    '<div style="flex:1;height:4px;background:var(--surface-hex);border-radius:99px;overflow:hidden">' +
    '<div style="height:100%;width:' + pct + '%;background:#a3c9a8;border-radius:99px;transition:width 0.5s ease"></div></div>' +
    '<span style="font-size:9px;color:#9898a2;white-space:nowrap">' + info.currentXP + '/' + info.nextLevelXP + ' XP</span>' +
    '<button onclick="if(window._showAchievementGallery)window._showAchievementGallery()" style="font-size:9px;font-weight:700;color:var(--primary-hex);cursor:pointer;pointer-events:auto;background:none;border:none;white-space:nowrap" aria-label="Achievements">\ud83c\udfc6</button></div>';
  };

  window._showLevelUp = function(level, rank) {
   var overlay = document.createElement('div');
   overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85)';
   overlay.innerHTML = '<div style="text-align:center"><p style="font-size:14px;color:var(--primary-hex);font-weight:800;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:8px">LEVEL UP!</p><p style="font-size:72px;font-weight:900;color:#f4f4f5;line-height:1">' + level + '</p><p style="font-size:18px;color:var(--primary-hex);font-weight:700;margin-top:8px">' + rank.name + '</p><p style="font-size:13px;color:#9898a2;margin-top:16px">Weiter so!</p></div>';
   overlay.onclick = function() { overlay.remove(); };
   document.body.appendChild(overlay);
   setTimeout(function() { overlay.remove(); }, 3000);
  };

  window._syncXPToCloud = async function(xpData) {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'xp_progress');
    await window._fbSetDoc(ref, { totalXP: xpData.totalXP, history: xpData.history.slice(-20), updated: new Date().toISOString() });
   } catch(e) { console.log('XP sync error:', e); }
  };

  // ============================================================
  // PERSOENLICHE ZIELE
  // ============================================================
  window.getGoals = function() { return JSON.parse(localStorage.getItem('base_goals') || '[]'); };
  window.saveGoals = function(goals) { localStorage.setItem('base_goals', JSON.stringify(goals)); window._syncGoalsToCloud(goals); };
  window._syncGoalsToCloud = async function(goals) {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'goals');
    await window._fbSetDoc(ref, { goals: goals, updated: new Date().toISOString() });
   } catch(e) { console.log('Goals sync error:', e); }
  };

  window.openGoalModal = function() {
   var goals = window.getGoals();
   var activeGoals = goals.filter(function(g) { return !g.completed; });
   var completedGoals = goals.filter(function(g) { return g.completed; });
   var html = '<div style="margin-bottom:16px"><p class="text-sm font-bold text-zinc-300 mb-3">Aktive Ziele</p>';
   if(activeGoals.length === 0) { html += '<p class="text-xs text-zinc-600 mb-4">Noch keine Ziele gesetzt. Setze dir dein erstes Ziel!</p>'; }
   else { activeGoals.forEach(function(g) {
    var pct = g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
    var daysLeft = Math.max(0, Math.ceil((new Date(g.deadline) - new Date()) / 86400000));
    html += '<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3"><div class="flex items-center justify-between mb-2"><p class="text-sm font-bold text-white">' + window._escapeHtml(g.title) + '</p>';
    html += '<button onclick="window.deleteGoal(\'' + g.id + '\')" class="text-zinc-600 hover:text-rose-400 cursor-pointer pointer-events-auto"><i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i></button></div>';
    html += '<div class="flex items-center gap-2 mb-2"><div style="flex:1;height:6px;background:var(--surface-hex);border-radius:99px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:#a3c9a8;border-radius:99px;transition:width 0.3s"></div></div>';
    html += '<span class="text-xs font-bold" style="color:var(--primary-hex)">' + pct + '%</span></div>';
    html += '<div class="flex items-center justify-between"><span class="text-[10px] text-zinc-500">' + g.currentValue + ' / ' + g.targetValue + ' ' + window._escapeHtml(g.unit || '') + '</span>';
    html += '<span class="text-[10px] text-zinc-500">' + (daysLeft > 0 ? daysLeft + ' Tage' : 'Abgelaufen') + '</span></div>';
    if(pct >= 100) { html += '<button onclick="window.completeGoal(\'' + g.id + '\')" class="w-full mt-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.15);color:var(--primary-hex);border:1px solid rgba(163,201,168,0.3)">Ziel erreicht \u2014 500 XP!</button>'; }
    html += '</div>';
   }); }
   html += '</div>';
   if(completedGoals.length > 0) { html += '<p class="text-sm font-bold text-zinc-300 mb-3">Erreichte Ziele</p>';
    completedGoals.slice(0, 5).forEach(function(g) {
     html += '<div class="flex items-center gap-3 py-2 border-b border-zinc-800/50"><span style="color:var(--primary-hex);font-size:16px">\u2713</span><div>';
     html += '<p class="text-xs font-bold text-zinc-400">' + window._escapeHtml(g.title) + '</p>';
     html += '<p class="text-[10px] text-zinc-600">Erreicht am ' + (g.completedDate || '\u2014') + ' \u00b7 +500 XP</p></div></div>';
    });
   }
   html += '<button onclick="window.openCreateGoal()" class="w-full mt-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest cursor-pointer pointer-events-auto" style="background:#a3c9a8;color:#0f110f">+ Neues Ziel setzen</button>';
   var container = document.getElementById('goalModalContent');
   if(container) container.innerHTML = html;
   window.toggleModal('goalModal');
   if(window.lucide) setTimeout(function() { lucide.createIcons(); }, 50);
  };

  window.openCreateGoal = function() {
   var html = '<div><p class="text-sm font-bold text-zinc-300 mb-2">Was ist dein Ziel?</p>';
   html += '<input id="goalTitle" type="text" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 mb-4 outline-none focus:border-zinc-600 pointer-events-auto" placeholder="z.B. 100kg Bankdrücken, 5km unter 25min...">';
   html += '<div class="grid grid-cols-2 gap-3 mb-4"><div><p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Zielwert</p>';
   html += '<input id="goalTarget" type="number" inputmode="numeric" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 outline-none focus:border-zinc-600 pointer-events-auto" placeholder="100"></div>';
   html += '<div><p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Einheit</p>';
   html += '<input id="goalUnit" type="text" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 outline-none focus:border-zinc-600 pointer-events-auto" placeholder="kg, km, min..."></div></div>';
   html += '<p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Aktueller Stand</p>';
   html += '<input id="goalCurrent" type="number" inputmode="numeric" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 mb-4 outline-none focus:border-zinc-600 pointer-events-auto" placeholder="80">';
   html += '<p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Deadline</p>';
   html += '<input id="goalDeadline" type="date" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 mb-4 outline-none focus:border-zinc-600 pointer-events-auto">';
   html += '<div class="flex gap-3"><button onclick="window.openGoalModal()" class="flex-1 py-3 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-bold cursor-pointer pointer-events-auto">Zurück</button>';
   html += '<button onclick="window.saveNewGoal()" class="flex-1 py-3 rounded-xl text-sm font-black cursor-pointer pointer-events-auto" style="background:#a3c9a8;color:#0f110f">Speichern</button></div></div>';
   var container = document.getElementById('goalModalContent');
   if(container) container.innerHTML = html;
  };

  window.saveNewGoal = function() {
   var title = (document.getElementById('goalTitle') || {}).value || '';
   var target = parseFloat((document.getElementById('goalTarget') || {}).value) || 0;
   var unit = (document.getElementById('goalUnit') || {}).value || '';
   var current = parseFloat((document.getElementById('goalCurrent') || {}).value) || 0;
   var deadline = (document.getElementById('goalDeadline') || {}).value || '';
   if(!title.trim()) { window.showToast('Bitte Ziel eingeben'); return; }
   if(!target) { window.showToast('Bitte Zielwert eingeben'); return; }
   if(!deadline) { window.showToast('Bitte Deadline waehlen'); return; }
   var goals = window.getGoals();
   goals.push({ id: 'goal_' + Date.now(), title: title.trim(), targetValue: target, currentValue: current, unit: unit.trim(), deadline: deadline, completed: false, completedDate: null, createdDate: new Date().toISOString().split('T')[0] });
   window.saveGoals(goals);
   window.showToast('Ziel gesetzt!');
   window.openGoalModal();
  };

  window.completeGoal = function(goalId) {
   var goals = window.getGoals();
   var goal = goals.find(function(g) { return g.id === goalId; });
   if(!goal) return;
   goal.completed = true; goal.completedDate = new Date().toISOString().split('T')[0];
   window.saveGoals(goals);
   if(window.awardXP) window.awardXP('goalComplete');
   window._showGoalComplete(goal);
   window.openGoalModal();
  };

  window.deleteGoal = function(goalId) {
   var goals = window.getGoals().filter(function(g) { return g.id !== goalId; });
   window.saveGoals(goals);
   window.openGoalModal();
  };

  window.updateGoalProgress = function(goalId, newValue) {
   var goals = window.getGoals();
   var goal = goals.find(function(g) { return g.id === goalId; });
   if(!goal) return;
   goal.currentValue = newValue;
   window.saveGoals(goals);
  };

  window._showGoalComplete = function(goal) {
   var overlay = document.createElement('div');
   overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.9)';
   overlay.innerHTML = '<div style="text-align:center"><p style="font-size:48px;margin-bottom:16px">\uD83C\uDFAF</p><p style="font-size:14px;color:var(--primary-hex);font-weight:800;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:8px">ZIEL ERREICHT!</p><p style="font-size:24px;font-weight:900;color:#f4f4f5;margin-bottom:8px">' + window._escapeHtml(goal.title) + '</p><p style="font-size:36px;font-weight:900;color:var(--primary-hex)">+500 XP</p><p style="font-size:13px;color:#9898a2;margin-top:16px">Setze dir dein naechstes Ziel!</p></div>';
   overlay.onclick = function() { overlay.remove(); };
   document.body.appendChild(overlay);
   setTimeout(function() { overlay.remove(); }, 4000);
  };

  window._checkGoalProgress = function() {
   var goals = window.getGoals().filter(function(g) { return !g.completed; });
   if(goals.length === 0) return;
   goals.forEach(function(goal) {
    var title = goal.title.toLowerCase();
    if(Array.isArray(window.workouts)) {
     window.workouts.forEach(function(w) {
      if(!w.archived) return;
      if(w.setDetails) { w.setDetails.forEach(function(set) { var weight = parseFloat(set.weight) || 0; if(weight > 0 && w.exercise && title.includes(w.exercise.toLowerCase()) && weight >= goal.targetValue) { goal.currentValue = Math.max(goal.currentValue, weight); } }); }
      if(w.data) { var dist = parseFloat(w.data['Distanz (km)'] || w.data['Distanz'] || 0); if(dist > 0 && (title.includes('km') || title.includes('lauf') || title.includes('run'))) { goal.currentValue = Math.max(goal.currentValue, dist); } }
     });
    }
   });
   window.saveGoals(goals);
  };


  // === VOLUME LANDMARKS (MEV/MAV/MRV) — DYNAMISCH ===
  window._BASE_VOLUME_LANDMARKS = {
    'chest':      { mev: 8,  mav: 14, mrv: 22 },
    'back':       { mev: 10, mav: 16, mrv: 24 },
    'shoulders':  { mev: 6,  mav: 12, mrv: 20 },
    'upper legs': { mev: 8,  mav: 14, mrv: 22 },
    'lower legs': { mev: 6,  mav: 10, mrv: 16 },
    'upper arms': { mev: 4,  mav: 10, mrv: 18 },
    'lower arms': { mev: 2,  mav: 6,  mrv: 12 },
    'waist':      { mev: 0,  mav: 8,  mrv: 16 }
  };

  window._deLabels = {
    'chest': 'Brust', 'back': 'R\u00fccken', 'shoulders': 'Schultern',
    'upper legs': 'Oberschenkel', 'lower legs': 'Waden',
    'upper arms': 'Oberarme', 'lower arms': 'Unterarme', 'waist': 'Core'
  };

  window._getVolumeLandmarks = function() {
    var base = window._BASE_VOLUME_LANDMARKS;
    var profile = window.userProfile || JSON.parse(localStorage.getItem('beastmode_v2_profile') || localStorage.getItem('base_athlete_profile') || '{}');

    // === FAKTOR 1: Erfahrungslevel ===
    var experience = (profile.experience || profile.erfahrung || 'mittel').toLowerCase();
    var expMultiplier = 1.0;
    if (experience.indexOf('anf\u00e4nger') !== -1 || experience.indexOf('beginner') !== -1 || experience === '<1') {
      expMultiplier = 0.65;
    } else if (experience.indexOf('leicht fortgeschritten') !== -1 || experience === '1-2') {
      expMultiplier = 0.80;
    } else if (experience.indexOf('fortgeschritten') !== -1 || experience.indexOf('intermediate') !== -1 || experience === '2-5') {
      expMultiplier = 1.0;
    } else if (experience.indexOf('weit fortgeschritten') !== -1 || experience.indexOf('advanced') !== -1 || experience === '5+') {
      expMultiplier = 1.15;
    } else if (experience.indexOf('profi') !== -1 || experience.indexOf('elite') !== -1 || experience === '10+') {
      expMultiplier = 1.25;
    }

    // Trainings-Historie als Proxy falls kein explizites Level
    var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
    var kraftWorkouts = allWorkouts.filter(function(w) { return w.category === 'strength'; });
    if (kraftWorkouts.length > 0 && expMultiplier === 1.0) {
      var firstDate = new Date(kraftWorkouts[kraftWorkouts.length - 1].date || kraftWorkouts[0].date);
      var monthsTraining = Math.floor((new Date() - firstDate) / (1000 * 60 * 60 * 24 * 30));
      var totalWorkouts = kraftWorkouts.length;
      if (totalWorkouts < 20 || monthsTraining < 3) expMultiplier = 0.70;
      else if (totalWorkouts < 50 || monthsTraining < 6) expMultiplier = 0.85;
      else if (totalWorkouts < 150 || monthsTraining < 18) expMultiplier = 1.0;
      else if (totalWorkouts < 400 || monthsTraining < 36) expMultiplier = 1.15;
      else expMultiplier = 1.25;
    }

    // === FAKTOR 2: Alter ===
    var age = parseInt(profile.age || profile.alter || profile.Age) || 25;
    var ageMultiplier = 1.0;
    if (age < 20) ageMultiplier = 0.90;
    else if (age <= 30) ageMultiplier = 1.0;
    else if (age <= 40) ageMultiplier = 0.95;
    else if (age <= 50) ageMultiplier = 0.85;
    else if (age <= 60) ageMultiplier = 0.75;
    else ageMultiplier = 0.65;

    // === FAKTOR 3: Schlaf ===
    var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
    var sleepDays = Object.keys(habits).sort().slice(-7);
    var avgSleep = 7.5;
    var sleepCount = 0;
    sleepDays.forEach(function(d) {
      if (habits[d] && habits[d].sleep) {
        avgSleep = (avgSleep * sleepCount + habits[d].sleep) / (sleepCount + 1);
        sleepCount++;
      }
    });
    var sleepMultiplier = 1.0;
    if (sleepCount > 0) {
      if (avgSleep >= 8.5) sleepMultiplier = 1.10;
      else if (avgSleep >= 7.5) sleepMultiplier = 1.0;
      else if (avgSleep >= 6.5) sleepMultiplier = 0.90;
      else if (avgSleep >= 5.5) sleepMultiplier = 0.75;
      else sleepMultiplier = 0.60;
    }

    // === FAKTOR 4: Pump/Soreness ===
    var pumpData = JSON.parse(localStorage.getItem('base_pump_soreness') || '{}');
    var recentPumpDates = Object.keys(pumpData).sort().slice(-5);
    var recoveryMultiplier = 1.0;
    if (recentPumpDates.length >= 3) {
      var totalSoreness = 0;
      var totalPump = 0;
      var dataPoints = 0;
      recentPumpDates.forEach(function(d) {
        var day = pumpData[d];
        Object.values(day).forEach(function(muscle) {
          if (muscle.soreness) { totalSoreness += muscle.soreness; dataPoints++; }
          if (muscle.pump) totalPump += muscle.pump;
        });
      });
      if (dataPoints > 0) {
        var avgSoreness = totalSoreness / dataPoints;
        var avgPump = totalPump / dataPoints;
        if (avgSoreness >= 4 && avgPump <= 2) recoveryMultiplier = 0.80;
        else if (avgSoreness <= 2 && avgPump >= 4) recoveryMultiplier = 1.05;
        else if (avgSoreness >= 3.5) recoveryMultiplier = 0.85;
      }
    }

    // === FAKTOR 5: Workout-Feedback ===
    var feedback = JSON.parse(localStorage.getItem('base_workout_feedback') || '{}');
    var recentFB = Object.keys(feedback).sort().slice(-5);
    var feedbackMultiplier = 1.0;
    if (recentFB.length >= 3) {
      var avgFB = recentFB.reduce(function(a, d) { return a + feedback[d].rating; }, 0) / recentFB.length;
      if (avgFB <= 2) feedbackMultiplier = 0.85;
      else if (avgFB >= 4.5) feedbackMultiplier = 1.05;
    }

    // === GESAMT-MULTIPLIKATOR ===
    var mrvFactor = expMultiplier * ageMultiplier * sleepMultiplier * recoveryMultiplier * feedbackMultiplier;
    var mavFactor = expMultiplier * ageMultiplier * ((sleepMultiplier + 1) / 2) * ((recoveryMultiplier + 1) / 2);
    var mevFactor = expMultiplier * ((ageMultiplier + 1) / 2);
    mevFactor = Math.max(0.5, Math.min(1.3, mevFactor));
    mavFactor = Math.max(0.6, Math.min(1.4, mavFactor));
    mrvFactor = Math.max(0.5, Math.min(1.5, mrvFactor));

    var result = {};
    Object.keys(base).forEach(function(bp) {
      var b = base[bp];
      result[bp] = {
        mev: Math.max(2, Math.round(b.mev * mevFactor)),
        mav: Math.max(4, Math.round(b.mav * mavFactor)),
        mrv: Math.max(6, Math.round(b.mrv * mrvFactor)),
        de: window._deLabels[bp] || bp
      };
      if (result[bp].mav <= result[bp].mev) result[bp].mav = result[bp].mev + 2;
      if (result[bp].mrv <= result[bp].mav) result[bp].mrv = result[bp].mav + 4;
    });

    result._factors = {
      experience: expMultiplier.toFixed(2) + 'x (' + experience + ')',
      age: ageMultiplier.toFixed(2) + 'x (' + age + ' Jahre)',
      sleep: sleepMultiplier.toFixed(2) + 'x (\u00d8 ' + avgSleep.toFixed(1) + 'h)',
      recovery: recoveryMultiplier.toFixed(2) + 'x (Pump/Soreness)',
      feedback: feedbackMultiplier.toFixed(2) + 'x (Workout-Gef\u00fchl)',
      totalMRV: mrvFactor.toFixed(2) + 'x'
    };
    return result;
  };

  // Initialisiere dynamisch
  window._VOLUME_LANDMARKS = window._getVolumeLandmarks();

  window._renderVolumeLandmarks = function(containerId) {
    var container = document.getElementById(containerId || 'volumeLandmarksChart');
    if (!container) return;
    // Refresh dynamische Werte
    if (window._getVolumeLandmarks) window._VOLUME_LANDMARKS = window._getVolumeLandmarks();
    var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
    var now = new Date();
    var weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    var weekWorkouts = allWorkouts.filter(function(w) {
      return w.category === 'strength' && w.setDetails && new Date(w.date) >= weekAgo;
    });
    if (weekWorkouts.length < 2) {
      container.innerHTML = '<p class="text-[10px] text-center py-4" style="color:#737373">Mindestens 2 Kraft-Workouts diese Woche n\u00f6tig</p>';
      return;
    }
    var exDb = window.exerciseDB || window._exerciseDB || [];
    if (typeof exDb === 'function') exDb = exDb();
    var setsPerMuscle = {};
    weekWorkouts.forEach(function(w) {
      var ex = exDb.find(function(e) { return e.n === w.exercise || e.de === w.exercise || (e.a && e.a.some(function(a) { return a.toLowerCase() === w.exercise.toLowerCase(); })); });
      var bp = ex ? ex.bp : null;
      if (bp === 'legs') bp = 'upper legs';
      if (bp === 'arms') bp = 'upper arms';
      if (!bp) return;
      if (!setsPerMuscle[bp]) setsPerMuscle[bp] = 0;
      setsPerMuscle[bp] += (w.setDetails || []).filter(function(s) { return s.type !== 'warmup'; }).length;
    });
    var html = '<div class="mb-3 flex items-center justify-between">';
    html += '<span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">W\u00f6chentliches Satz-Volumen</span>';
    html += '</div>';
    html += '<div class="p-2.5 rounded-lg mb-3" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">';
    html += '<p class="text-[9px] font-bold mb-1.5" style="color:#ccc">Wie viele S\u00e4tze pro Muskelgruppe brauchst du?</p>';
    html += '<div class="flex flex-wrap gap-x-4 gap-y-1 text-[8px]">';
    html += '<span style="color:#e88a8a">\u25a0 Zu wenig \u2014 kein Wachstum</span>';
    html += '<span style="color:var(--primary-hex)">\u25a0 Sweet Spot \u2014 optimales Wachstum</span>';
    html += '<span style="color:#e8c86a">\u25a0 Viel \u2014 funktioniert, aber hart</span>';
    html += '<span style="color:#e88a8a">\u25a0 Zu viel \u2014 \u00dcbertraining-Risiko</span>';
    html += '</div></div>';
    Object.keys(window._VOLUME_LANDMARKS).forEach(function(bp) {
      var lm = window._VOLUME_LANDMARKS[bp];
      var current = setsPerMuscle[bp] || 0;
      var maxDisplay = Math.max(lm.mrv + 4, current + 2);
      var zone, zoneColor, zoneLabel;
      if (current < lm.mev) { zone = 'under'; zoneColor = '#e88a8a'; zoneLabel = 'Zu wenig'; }
      else if (current <= lm.mav) { zone = 'optimal'; zoneColor = '#a3c9a8'; zoneLabel = 'Sweet Spot'; }
      else if (current <= lm.mrv) { zone = 'high'; zoneColor = '#e8c86a'; zoneLabel = 'Viel'; }
      else { zone = 'over'; zoneColor = '#e88a8a'; zoneLabel = 'Zu viel!'; }
      var mevPct = (lm.mev / maxDisplay * 100).toFixed(1);
      var mavPct = (lm.mav / maxDisplay * 100).toFixed(1);
      var mrvPct = (lm.mrv / maxDisplay * 100).toFixed(1);
      var currentPct = Math.min(100, (current / maxDisplay * 100)).toFixed(1);
      html += '<div class="mb-3">';
      html += '<div class="flex items-center justify-between mb-1">';
      html += '<span class="text-[9px] font-bold" style="color:#ccc">' + window._escapeHtml(lm.de) + '</span>';
      html += '<div class="flex items-center gap-2">';
      html += '<span class="text-[10px] font-black" style="color:' + zoneColor + '">' + current + ' Sets</span>';
      html += '<span class="text-[7px] font-bold px-1.5 py-0.5 rounded" style="background:' + zoneColor + '22;color:' + zoneColor + '">' + zoneLabel + '</span>';
      html += '</div></div>';
      html += '<div style="position:relative;height:16px;background:var(--bg-hex);border-radius:8px;overflow:hidden">';
      html += '<div style="position:absolute;left:' + mevPct + '%;width:' + (mavPct - mevPct) + '%;height:100%;background:rgba(163,201,168,0.08)"></div>';
      html += '<div style="position:absolute;left:' + mavPct + '%;width:' + (mrvPct - mavPct) + '%;height:100%;background:rgba(232,200,106,0.06)"></div>';
      html += '<div style="position:absolute;left:' + mevPct + '%;width:1px;height:100%;background:rgba(163,201,168,0.3)"></div>';
      html += '<div style="position:absolute;left:' + mavPct + '%;width:1px;height:100%;background:rgba(232,200,106,0.3)"></div>';
      html += '<div style="position:absolute;left:' + mrvPct + '%;width:1px;height:100%;background:rgba(232,138,138,0.4)"></div>';
      html += '<div style="position:absolute;left:0;width:' + currentPct + '%;height:100%;background:' + zoneColor + ';border-radius:8px;opacity:0.4"></div>';
      html += '<div style="position:absolute;left:calc(' + currentPct + '% - 4px);top:2px;width:8px;height:12px;background:' + zoneColor + ';border-radius:4px;box-shadow:0 0 6px ' + zoneColor + '"></div>';
      html += '</div>';
      html += '<div style="position:relative;height:12px;margin-top:2px">';
      html += '<span class="text-[6px]" style="position:absolute;left:' + mevPct + '%;transform:translateX(-50%);color:#737373">Min ' + lm.mev + '</span>';
      html += '<span class="text-[6px]" style="position:absolute;left:' + mavPct + '%;transform:translateX(-50%);color:#737373">Ideal ' + lm.mav + '</span>';
      html += '<span class="text-[6px]" style="position:absolute;left:' + mrvPct + '%;transform:translateX(-50%);color:#737373">Max ' + lm.mrv + '</span>';
      html += '</div></div>';
    });
    var underMev = Object.keys(setsPerMuscle).length > 0 ? Object.keys(window._VOLUME_LANDMARKS).filter(function(bp) {
      return (setsPerMuscle[bp] || 0) < window._VOLUME_LANDMARKS[bp].mev;
    }) : [];
    var overMrv = Object.keys(window._VOLUME_LANDMARKS).filter(function(bp) {
      return (setsPerMuscle[bp] || 0) > window._VOLUME_LANDMARKS[bp].mrv;
    });
    if (underMev.length > 0) {
      html += '<div class="p-2 rounded-lg mt-2 text-[9px]" style="background:rgba(232,138,138,0.05);border:1px solid rgba(232,138,138,0.1);color:#e88a8a">';
      html += '\ud83d\udcc9 ' + underMev.map(function(bp) { return window._VOLUME_LANDMARKS[bp].de; }).join(', ') + ' \u2014 zu wenige S\u00e4tze diese Woche f\u00fcr Muskelwachstum. Mehr Sets einbauen!';
      html += '</div>';
    }
    if (overMrv.length > 0) {
      html += '<div class="p-2 rounded-lg mt-2 text-[9px]" style="background:rgba(232,138,138,0.05);border:1px solid rgba(232,138,138,0.1);color:#e88a8a">';
      html += '\u26a0\ufe0f ' + overMrv.map(function(bp) { return window._VOLUME_LANDMARKS[bp].de; }).join(', ') + ' \u2014 zu viele S\u00e4tze! \u00dcbertraining-Risiko. Weniger Sets oder Deload-Woche einplanen.';
      html += '</div>';
    }
    var factors = window._VOLUME_LANDMARKS._factors;
    if (factors) {
      html += '<div class="mt-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">';
      html += '<div class="text-[8px] font-bold uppercase tracking-wider mb-2" style="color:#9898a2">Deine pers\u00f6nlichen Faktoren</div>';
      html += '<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px]">';
      html += '<span style="color:#9898a2">Dein Level:</span><span style="color:#ccc">' + window._escapeHtml(factors.experience) + '</span>';
      html += '<span style="color:#9898a2">Dein Alter:</span><span style="color:#ccc">' + window._escapeHtml(factors.age) + '</span>';
      html += '<span style="color:#9898a2">Schlafqualit\u00e4t:</span><span style="color:#ccc">' + window._escapeHtml(factors.sleep) + '</span>';
      html += '<span style="color:#9898a2">Erholung:</span><span style="color:#ccc">' + window._escapeHtml(factors.recovery) + '</span>';
      html += '<span style="color:#9898a2">Energie im Training:</span><span style="color:#ccc">' + window._escapeHtml(factors.feedback) + '</span>';
      html += '<span style="color:#9898a2">Dein pers\u00f6nlicher Faktor:</span><span class="font-bold" style="color:var(--primary-hex)">' + window._escapeHtml(factors.totalMRV) + '</span>';
      html += '</div>';
      html += '<div class="text-[7px] mt-2" style="color:#737373">Basierend auf Israetel/Schoenfeld Richtlinien, angepasst an dein Profil und aktuelle Recovery-Daten.</div>';
      html += '</div>';
    }
    container.innerHTML = html;
  };

  // === DELOAD AUTO-DETECTION ===
  window._checkDeloadNeeded = function() {
    var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
    var kraftWorkouts = allWorkouts.filter(function(w) { return w.category === 'strength' && w.setDetails; });
    if (kraftWorkouts.length < 10) return null;
    // Pr\u00fcfe ob User bereits in Deload-Woche ist
    var plan = JSON.parse(localStorage.getItem('base_active_plan') || 'null');
    if (plan && plan.planData) {
      var cw = window._getCurrentMesoWeek ? window._getCurrentMesoWeek() : 0;
      var planWeeks = plan.planData.weeks || [];
      if (planWeeks[cw]) { var wn = (planWeeks[cw].name || planWeeks[cw].focus || '').toLowerCase(); if (wn.indexOf('deload') !== -1 || wn.indexOf('erholung') !== -1) return null; }
    }
    var signals = { score: 0, reasons: [] };
    var exDb = window.exerciseDB || window._exerciseDB || [];
    if (typeof exDb === 'function') exDb = exDb();
    var exercises = {};
    kraftWorkouts.forEach(function(w) {
      if (!exercises[w.exercise]) exercises[w.exercise] = [];
      var maxW = Math.max.apply(null, (w.setDetails || []).map(function(s) { return parseFloat(s.weight) || 0; }));
      exercises[w.exercise].push({ date: w.date, max: maxW });
    });
    var decliningExercises = [];
    Object.keys(exercises).forEach(function(ex) {
      var data = exercises[ex].sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
      if (data.length < 3) return;
      var last3 = data.slice(-3);
      var dropPct = last3[0].max > 0 ? (last3[0].max - last3[2].max) / last3[0].max : 0;
      if (dropPct > 0.05) { decliningExercises.push(ex); }
    });
    if (decliningExercises.length >= 2) {
      signals.score += 3;
      signals.reasons.push('Gewicht sinkt bei ' + decliningExercises.slice(0, 3).join(', '));
    }
    var readiness = window._calculateReadinessV2 ? window._calculateReadinessV2() : null;
    if (readiness && readiness.score < 40) {
      signals.score += 2;
      signals.reasons.push('Readiness nur ' + readiness.score + '% (' + readiness.label + ')');
    }
    var pumpData = JSON.parse(localStorage.getItem('base_pump_soreness') || '{}');
    var recentDates = Object.keys(pumpData).sort().slice(-3);
    if (recentDates.length >= 2) {
      var highSoreness = recentDates.filter(function(d) {
        var day = pumpData[d];
        return Object.values(day).some(function(m) { return m.soreness >= 4; });
      });
      if (highSoreness.length >= 2) {
        signals.score += 2;
        signals.reasons.push('Hohe Soreness in ' + highSoreness.length + ' der letzten ' + recentDates.length + ' Trainings');
      }
    }
    var feedback = JSON.parse(localStorage.getItem('base_workout_feedback') || '{}');
    var recentFeedback = Object.keys(feedback).sort().slice(-3);
    var lowFeedback = recentFeedback.filter(function(d) { return feedback[d].rating <= 2; });
    if (lowFeedback.length >= 2) {
      signals.score += 2;
      signals.reasons.push('Schlechtes Workout-Feedback (' + lowFeedback.length + 'x unter 3)');
    }
    var now = new Date();
    var weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    var weekWorkouts = kraftWorkouts.filter(function(w) { return new Date(w.date) >= weekAgo; });
    var setsPerMuscle = {};
    weekWorkouts.forEach(function(w) {
      var ex = exDb.find(function(e) { return e.n === w.exercise || e.de === w.exercise || (e.a && e.a.some(function(a) { return a.toLowerCase() === w.exercise.toLowerCase(); })); });
      var bp = ex ? ex.bp : null;
      if (bp === 'legs') bp = 'upper legs';
      if (bp === 'arms') bp = 'upper arms';
      if (!bp) return;
      setsPerMuscle[bp] = (setsPerMuscle[bp] || 0) + (w.setDetails || []).length;
    });
    var overMrv = Object.keys(setsPerMuscle).filter(function(bp) {
      return window._VOLUME_LANDMARKS[bp] && setsPerMuscle[bp] > window._VOLUME_LANDMARKS[bp].mrv;
    });
    if (overMrv.length > 0) {
      signals.score += 1;
      signals.reasons.push('\u00dcber MRV bei ' + overMrv.map(function(bp) { return window._VOLUME_LANDMARKS[bp].de; }).join(', '));
    }
    if (signals.score >= 4) return signals;
    return null;
  };

  window._showDeloadWarning = function() {
    var dismissed = localStorage.getItem('base_deload_auto_dismissed');
    if (dismissed) {
      var dismissDate = new Date(dismissed);
      var daysSince = (new Date() - dismissDate) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }
    var signals = window._checkDeloadNeeded();
    if (!signals) return;
    var html = '<div class="p-4 rounded-xl mb-4" style="background:rgba(232,200,106,0.06);border:1px solid rgba(232,200,106,0.15)">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<div class="flex items-center gap-2"><span style="font-size:18px">\u26a0\ufe0f</span><span class="text-sm font-bold" style="color:#e8c86a">Deload empfohlen</span></div>';
    html += '<button onclick="localStorage.setItem(\'base_deload_auto_dismissed\',new Date().toISOString());this.closest(\'[id=deloadWarning]\').remove()" class="text-[9px] font-bold cursor-pointer pointer-events-auto" style="color:#737373" aria-label="Ignorieren">Ignorieren</button>';
    html += '</div>';
    html += '<div class="text-[10px] mb-2" style="color:#ccc">Mehrere Signale deuten auf \u00dcbertraining hin:</div>';
    signals.reasons.forEach(function(r) {
      html += '<div class="flex items-start gap-2 mb-1"><span class="text-[8px] mt-0.5" style="color:#e8c86a">\u2022</span><span class="text-[9px]" style="color:#aaa">' + window._escapeHtml(r) + '</span></div>';
    });
    html += '<div class="text-[10px] mt-3 p-2 rounded-lg" style="background:rgba(163,201,168,0.05);color:var(--primary-hex)"><strong>Empfehlung:</strong> Diese Woche Volumen um 40% reduzieren, Gewichte bei 60% halten, RIR 4+ anstreben. Fokus auf Recovery: Schlaf, Ern\u00e4hrung, leichte Mobility.</div>';
    html += '</div>';
    var warning = document.getElementById('deloadWarning');
    if (!warning) {
      warning = document.createElement('div');
      warning.id = 'deloadWarning';
      warning.className = 'px-4';
      var target = document.getElementById('todaysWorkoutSection') || document.getElementById('routinesSection');
      if (target) target.parentNode.insertBefore(warning, target);
    }
    warning.innerHTML = html;
  };

  // === EFFECTIVE REPS COUNTER ===
  window._calculateEffectiveReps = function(setDetails) {
    if (!setDetails || setDetails.length === 0) return { total: 0, effective: 0, ratio: 0 };
    var totalReps = 0;
    var effectiveReps = 0;
    setDetails.forEach(function(s) {
      if (s.type === 'warmup') return;
      var reps = parseFloat(s.reps) || 0;
      var rir = s.rir != null ? parseFloat(s.rir) : 3;
      totalReps += reps;
      var effectiveInSet = Math.max(0, Math.min(5, reps) - rir);
      effectiveReps += effectiveInSet;
    });
    return { total: totalReps, effective: effectiveReps, ratio: totalReps > 0 ? Math.round(effectiveReps / totalReps * 100) : 0 };
  };

  // === BODY SYMMETRY TRACKING ===
  window._renderSymmetryCheck = function(containerId) {
    var container = document.getElementById(containerId || 'symmetryCheck');
    if (!container) return;
    var measurements = JSON.parse(localStorage.getItem('beastmode_v2_body') || '[]');
    if (measurements.length === 0) { container.innerHTML = ''; return; }
    var latest = measurements[measurements.length - 1] || measurements[0];
    var pairs = [
      { name: 'Oberarm', left: latest.bicep_left, right: latest.bicep_right },
      { name: 'Oberschenkel', left: latest.thigh_left, right: latest.thigh_right },
      { name: 'Wade', left: latest.calf_left, right: latest.calf_right }
    ];
    var hasData = pairs.some(function(p) { return p.left && p.right; });
    if (!hasData) { container.innerHTML = ''; return; }
    var html = '<div class="text-[9px] font-black uppercase tracking-widest mb-2" style="color:var(--text-muted)">Symmetrie-Check</div>';
    pairs.forEach(function(p) {
      if (!p.left || !p.right) return;
      var l = parseFloat(p.left);
      var r = parseFloat(p.right);
      var diff = Math.abs(l - r);
      var avg = (l + r) / 2;
      var pct = avg > 0 ? (diff / avg * 100) : 0;
      var color, label;
      if (pct < 3) { color = '#a3c9a8'; label = 'Symmetrisch'; }
      else if (pct < 5) { color = '#e8c86a'; label = 'Leichte Imbalance'; }
      else { color = '#e88a8a'; label = 'Imbalance'; }
      var bigger = l > r ? 'Links' : l < r ? 'Rechts' : '-';
      html += '<div class="flex items-center justify-between py-2" style="border-bottom:1px solid var(--border-hex)">';
      html += '<span class="text-[10px] font-bold text-white">' + p.name + '</span>';
      html += '<div class="flex items-center gap-2">';
      html += '<span class="text-[9px]" style="color:#9898a2">L ' + l.toFixed(1) + ' | R ' + r.toFixed(1) + '</span>';
      html += '<span class="text-[8px] font-bold px-1.5 py-0.5 rounded" style="background:' + color + '22;color:' + color + '">' + (pct < 0.5 ? '\u2713' : diff.toFixed(1) + 'cm \u00b7 ' + bigger) + '</span>';
      html += '</div></div>';
    });
    container.innerHTML = html;
  };

  // === PERIODISIERUNGS-VISUALISIERUNG ===
  window._renderPeriodizationChart = function(containerId) {
    var container = document.getElementById(containerId || 'periodizationChart');
    if (!container) return;
    var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
    var kraftWorkouts = allWorkouts.filter(function(w) { return w.category === 'strength' && w.setDetails; });
    if (kraftWorkouts.length < 10) {
      container.innerHTML = '<p class="text-[10px] text-center py-4" style="color:#737373">Mindestens 10 Kraft-Workouts n\u00f6tig</p>';
      return;
    }
    var exDb = window.exerciseDB || window._exerciseDB || [];
    if (typeof exDb === 'function') exDb = exDb();
    var muscleSets = {};
    kraftWorkouts.forEach(function(w) {
      var ex = exDb.find(function(e) { return e.n === w.exercise || e.de === w.exercise || (e.a && e.a.some(function(a) { return a.toLowerCase() === w.exercise.toLowerCase(); })); });
      var bp = ex ? ex.bp : null;
      if (bp === 'legs') bp = 'upper legs';
      if (bp === 'arms') bp = 'upper arms';
      if (!bp || !window._VOLUME_LANDMARKS[bp]) return;
      muscleSets[bp] = (muscleSets[bp] || 0) + (w.setDetails || []).length;
    });
    var topMuscles = Object.entries(muscleSets).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 3).map(function(e) { return e[0]; });
    if (topMuscles.length === 0) { container.innerHTML = ''; return; }
    var now = new Date();
    var weeks = [];
    for (var wi = 7; wi >= 0; wi--) {
      var weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - (wi * 7));
      var weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weeks.push({ start: weekStart, end: weekEnd, label: 'W' + (8 - wi) });
    }
    var colors = ['#a3c9a8', '#8aafe8', '#e8c86a'];
    var html = '<div class="mb-2"><span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Periodisierung \u2014 Volumen \u00fcber Zeit</span></div>';
    topMuscles.forEach(function(bp, idx) {
      var lm = window._VOLUME_LANDMARKS[bp];
      var weeklyData = weeks.map(function(week) {
        var ww = kraftWorkouts.filter(function(wo) { var d = new Date(wo.date); return d >= week.start && d < week.end; });
        var sets = 0;
        ww.forEach(function(wo) {
          var ex = exDb.find(function(e) { return e.n === wo.exercise || e.de === wo.exercise; });
          if (ex && ex.bp === bp) sets += (wo.setDetails || []).filter(function(s) { return s.type !== 'warmup'; }).length;
        });
        return sets;
      });
      var maxSets = Math.max(lm.mrv + 4, Math.max.apply(null, weeklyData) + 2);
      var svgW = 280;
      var svgH = 60;
      var points = weeklyData.map(function(sets, i) {
        var x = (i / (weeklyData.length - 1)) * svgW;
        var y = svgH - (sets / maxSets) * svgH;
        return x + ',' + y;
      }).join(' ');
      var mevY = svgH - (lm.mev / maxSets) * svgH;
      var mavY = svgH - (lm.mav / maxSets) * svgH;
      var mrvY = svgH - (lm.mrv / maxSets) * svgH;
      html += '<div class="mb-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">';
      html += '<div class="flex items-center justify-between mb-1">';
      html += '<span class="text-[9px] font-bold" style="color:' + colors[idx] + '">' + lm.de + '</span>';
      html += '<span class="text-[7px]" style="color:#737373">MEV ' + lm.mev + ' \u00b7 MAV ' + lm.mav + ' \u00b7 MRV ' + lm.mrv + '</span>';
      html += '</div>';
      html += '<svg width="100%" viewBox="0 0 ' + svgW + ' ' + svgH + '" style="overflow:visible">';
      html += '<rect x="0" y="' + mavY + '" width="' + svgW + '" height="' + (mevY - mavY) + '" fill="rgba(163,201,168,0.06)"/>';
      html += '<line x1="0" y1="' + mrvY + '" x2="' + svgW + '" y2="' + mrvY + '" stroke="rgba(232,138,138,0.2)" stroke-dasharray="4,4"/>';
      html += '<line x1="0" y1="' + mevY + '" x2="' + svgW + '" y2="' + mevY + '" stroke="rgba(163,201,168,0.2)" stroke-dasharray="4,4"/>';
      html += '<polyline points="' + points + '" fill="none" stroke="' + colors[idx] + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      weeklyData.forEach(function(sets, i) {
        var x = (i / (weeklyData.length - 1)) * svgW;
        var y = svgH - (sets / maxSets) * svgH;
        html += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + colors[idx] + '"/>';
      });
      html += '</svg></div>';
    });
    container.innerHTML = html;
  };

  // Deload check on startup
  setTimeout(function() { if (window._showDeloadWarning) window._showDeloadWarning(); }, 4000);

  // === HR-ZONEN ANALYSE (Karvonen-Formel) ===
  window._calculateHRZones = function() {
    var profile = window.userProfile || JSON.parse(localStorage.getItem('beastmode_v2_profile') || localStorage.getItem('base_athlete_profile') || '{}');
    var age = parseInt(profile.age) || 30;
    var restHR = parseInt(profile.restingHR) || 60;
    var maxHR = parseInt(profile.maxHR) || Math.round(208 - (0.7 * age)); // Tanaka-Formel
    var reserve = maxHR - restHR;
    return {
      maxHR: maxHR, restHR: restHR,
      zones: [
        { zone: 1, name: 'Recovery', de: 'Erholung', min: Math.round(restHR + reserve * 0.50), max: Math.round(restHR + reserve * 0.60), color: '#8aafe8', benefit: 'Aktive Erholung, Fettstoffwechsel' },
        { zone: 2, name: 'Aerobic Base', de: 'Grundlage', min: Math.round(restHR + reserve * 0.60), max: Math.round(restHR + reserve * 0.70), color: '#a3c9a8', benefit: 'Ausdauer aufbauen, l\u00e4ngere Einheiten' },
        { zone: 3, name: 'Tempo', de: 'Tempo', min: Math.round(restHR + reserve * 0.70), max: Math.round(restHR + reserve * 0.80), color: '#e8c86a', benefit: 'Laktatschwelle verbessern' },
        { zone: 4, name: 'Threshold', de: 'Schwelle', min: Math.round(restHR + reserve * 0.80), max: Math.round(restHR + reserve * 0.90), color: '#e8a86a', benefit: 'VO2max steigern, Wettkampftempo' },
        { zone: 5, name: 'Max Effort', de: 'Maximum', min: Math.round(restHR + reserve * 0.90), max: maxHR, color: '#e88a8a', benefit: 'Sprintf\u00e4higkeit, anaerobe Kapazit\u00e4t' }
      ]
    };
  };

  window._getHRZone = function(hr) {
    var zones = window._calculateHRZones().zones;
    for (var i = zones.length - 1; i >= 0; i--) { if (hr >= zones[i].min) return zones[i]; }
    return zones[0];
  };

  window._renderHRZonesWidget = function(containerId) {
    var container = document.getElementById(containerId || 'hrZonesWidget');
    if (!container) return;
    var hrData = window._calculateHRZones();
    var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
    var thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    var cardioWorkouts = allWorkouts.filter(function(w) {
      if (new Date(w.date) < thirtyDaysAgo) return false;
      var hr = w.averageHeartRate || w.avg_hr || (w.data ? (w.data.puls || w.data.heartrate || w.data['\u00d8 Puls']) : null);
      return hr && parseFloat(hr) > 40;
    });
    var zoneMinutes = [0, 0, 0, 0, 0]; var totalMinutes = 0;
    cardioWorkouts.forEach(function(w) {
      var hr = parseFloat(w.averageHeartRate || w.avg_hr || (w.data ? (w.data.puls || w.data.heartrate || w.data['\u00d8 Puls']) : 0));
      var duration = parseFloat(w.duration || w.sessionDuration || (w.data ? (w.data.dauer || w.data.duration || w.data['Dauer (min)']) : 0)) || 30;
      if (hr < 40) return;
      var zone = window._getHRZone(hr);
      zoneMinutes[zone.zone - 1] += duration; totalMinutes += duration;
    });
    var html = '<div class="mb-3 flex items-center justify-between">';
    html += '<span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Herzfrequenz-Zonen (30 Tage)</span>';
    html += '<span class="text-[8px]" style="color:#737373">Max HR: ' + hrData.maxHR + ' bpm</span></div>';
    hrData.zones.forEach(function(z, idx) {
      var minutes = zoneMinutes[idx];
      var pct = totalMinutes > 0 ? Math.round(minutes / totalMinutes * 100) : 0;
      var barWidth = totalMinutes > 0 ? Math.max(2, Math.round(minutes / totalMinutes * 100)) : 0;
      html += '<div class="flex items-center gap-2 mb-2">';
      html += '<div class="flex-shrink-0" style="width:14px"><span class="text-[10px] font-black" style="color:' + z.color + '">Z' + z.zone + '</span></div>';
      html += '<div class="flex-shrink-0" style="width:55px"><span class="text-[8px] font-bold" style="color:#ccc">' + z.de + '</span></div>';
      html += '<div style="flex:1;height:20px;background:var(--bg-hex);border-radius:6px;overflow:hidden;position:relative">';
      html += '<div style="width:' + barWidth + '%;height:100%;background:' + z.color + ';opacity:0.35;border-radius:6px"></div>';
      html += '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">';
      if (minutes > 0) html += '<span class="text-[8px] font-bold" style="color:' + z.color + '">' + Math.round(minutes) + ' min (' + pct + '%)</span>';
      html += '</div></div>';
      html += '<div class="flex-shrink-0 text-right" style="width:55px"><span class="text-[7px]" style="color:#737373">' + z.min + '-' + z.max + '</span></div></div>';
    });
    if (totalMinutes > 0) {
      var z2pct = (zoneMinutes[1] / totalMinutes * 100);
      var z4z5pct = ((zoneMinutes[3] + zoneMinutes[4]) / totalMinutes * 100);
      html += '<div class="mt-3 p-2 rounded-lg text-[9px]" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">';
      html += '<div class="text-[8px] font-bold mb-1" style="color:#9898a2">\ud83d\udca1 80/20 Analyse</div>';
      if (z2pct >= 70 && z4z5pct >= 10 && z4z5pct <= 25) {
        html += '<span style="color:var(--primary-hex)">\u2705 Perfekte Verteilung! ~' + Math.round(z2pct) + '% niedrige Intensit\u00e4t, ~' + Math.round(z4z5pct) + '% hohe Intensit\u00e4t.</span>';
      } else if (z4z5pct > 30) {
        html += '<span style="color:#e8c86a">\u26a0\ufe0f Zu viel hochintensives Training (' + Math.round(z4z5pct) + '% in Zone 4-5). Mehr Zone 2 einbauen.</span>';
      } else if (z2pct < 50) {
        html += '<span style="color:#e8c86a">\u26a0\ufe0f Zu wenig Grundlagentraining (' + Math.round(z2pct) + '% Zone 2). L\u00e4ngere lockere Einheiten einbauen.</span>';
      } else {
        html += '<span style="color:#9898a2">Zone 2: ' + Math.round(z2pct) + '% \u00b7 Zone 4-5: ' + Math.round(z4z5pct) + '%. Ziel: 80/20.</span>';
      }
      html += '</div>';
    }
    html += '<div class="mt-3 flex gap-2">';
    html += '<div class="flex-1"><label class="text-[7px] font-bold uppercase tracking-wider block mb-1" style="color:#737373">Ruhe-HR (bpm)</label>';
    html += '<input type="number" inputmode="numeric" id="hrZoneRestHR" value="' + hrData.restHR + '" placeholder="60" class="w-full px-2 py-1.5 rounded-lg text-[10px] text-white outline-none pointer-events-auto" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)" onchange="window._saveHRProfile()" aria-label="Ruhe-Herzfrequenz"></div>';
    html += '<div class="flex-1"><label class="text-[7px] font-bold uppercase tracking-wider block mb-1" style="color:#737373">Max HR (bpm)</label>';
    html += '<input type="number" inputmode="numeric" id="hrZoneMaxHR" value="' + hrData.maxHR + '" placeholder="190" class="w-full px-2 py-1.5 rounded-lg text-[10px] text-white outline-none pointer-events-auto" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)" onchange="window._saveHRProfile()" aria-label="Maximale Herzfrequenz"></div></div>';
    container.innerHTML = html;
  };

  window._saveHRProfile = function() {
    var profile = JSON.parse(localStorage.getItem('base_athlete_profile') || '{}');
    var restVal = parseInt((document.getElementById('hrZoneRestHR') || {}).value);
    var maxVal = parseInt((document.getElementById('hrZoneMaxHR') || {}).value);
    if (restVal && restVal >= 30 && restVal <= 120) profile.restingHR = restVal;
    if (maxVal && maxVal >= 120 && maxVal <= 230) profile.maxHR = maxVal;
    if (profile.restingHR && profile.maxHR && profile.restingHR >= profile.maxHR) {
      window.showToast('\u26a0\ufe0f Ruhepuls muss unter dem Maximalpuls liegen', 'error');
      return;
    }
    localStorage.setItem('base_athlete_profile', JSON.stringify(profile));
    if (window._syncAppData) window._syncAppData('base_athlete_profile', profile);
    window._renderHRZonesWidget();
  };

  // === HABITS SUMMARY FÜR KI ===
  window._getHabitSummaryForAI = function() {
    var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
    var dates = Object.keys(habits).sort().slice(-7);
    if (dates.length === 0) return '';
    var summary = '\nT\u00c4GLICHE HABITS (letzte ' + dates.length + ' Tage):\n';
    var avgSleep = 0, avgWater = 0, avgSteps = 0, avgMood = 0;
    var count = { sleep: 0, water: 0, steps: 0, mood: 0 };
    dates.forEach(function(d) {
      var h = habits[d];
      if (h.sleep) { avgSleep += h.sleep; count.sleep++; }
      if (h.water) { avgWater += h.water; count.water++; }

      if (h.steps) { avgSteps += h.steps; count.steps++; }
      if (h.mood) { avgMood += h.mood; count.mood++; }
    });
    if (count.sleep > 0) summary += '- Schlaf \u00d8: ' + (avgSleep / count.sleep).toFixed(1) + 'h/Nacht\n';
    if (count.water > 0) summary += '- Wasser \u00d8: ' + (avgWater / count.water).toFixed(1) + 'L/Tag\n';

    if (count.steps > 0) summary += '- Schritte \u00d8: ' + Math.round(avgSteps / count.steps) + '/Tag\n';
    if (count.mood > 0) summary += '- Stimmung \u00d8: ' + (avgMood / count.mood).toFixed(1) + '/5\n';
    // Custom Habits
    var customHabits = window._getCustomHabits ? window._getCustomHabits() : [];
    if (customHabits.length > 0) {
      summary += '\nEIGENE HABITS:\n';
      customHabits.forEach(function(ch) {
        summary += '- ' + ch.label;
        if (ch.goal) summary += ' (Ziel: ' + ch.goal + ' ' + (ch.unit||'') + ')';
        var chValues = [];
        dates.forEach(function(d) { var hd = habits[d]; if (hd && hd[ch.id] !== undefined) chValues.push(hd[ch.id]); });
        if (chValues.length > 0) {
          var chAvg = chValues.reduce(function(a,b){return a+b;},0) / chValues.length;
          summary += ' \u00d8: ' + (ch.type === 'boolean' ? (Math.round(chAvg*100) + '% erledigt') : chAvg.toFixed(1) + (ch.unit||''));
        }
        summary += '\n';
      });
    }
    var feedback = JSON.parse(localStorage.getItem('base_workout_feedback') || '{}');
    var recentFB = Object.keys(feedback).sort().slice(-5);
    if (recentFB.length > 0) {
      var avgFB = recentFB.reduce(function(a, d) { return a + feedback[d].rating; }, 0) / recentFB.length;
      summary += '- Workout-Gef\u00fchl \u00d8: ' + avgFB.toFixed(1) + '/5 (letzte ' + recentFB.length + ' Workouts)\n';
    }
    // Pump/Soreness Daten
    var pumpData = JSON.parse(localStorage.getItem('base_pump_soreness') || '{}');
    var recentPumpDates = Object.keys(pumpData).sort().slice(-3);
    if (recentPumpDates.length > 0) {
      summary += '\nPUMP & SORENESS (letzte ' + recentPumpDates.length + ' Trainings):\n';
      recentPumpDates.forEach(function(d) {
        var muscles = pumpData[d]; var parts = [];
        Object.keys(muscles).forEach(function(m) {
          var md = muscles[m];
          if (md.pump || md.soreness) parts.push(m + ': Pump ' + (md.pump || '-') + '/5, Soreness ' + (md.soreness || '-') + '/5');
        });
        if (parts.length > 0) summary += d + ': ' + parts.join('; ') + '\n';
      });
    }
    // Volume Landmarks Status
    if (window._VOLUME_LANDMARKS) {
      var _now = new Date(); var _wa = new Date(_now); _wa.setDate(_wa.getDate() - 7);
      var _allWo = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
      var _weekWo = _allWo.filter(function(w) { return w.category === 'strength' && w.setDetails && new Date(w.date) >= _wa; });
      var _exDb = window.exerciseDB || window._exerciseDB || []; if (typeof _exDb === 'function') _exDb = _exDb();
      var _spm = {};
      _weekWo.forEach(function(w) {
        var ex = _exDb.find(function(e) { return e.n === w.exercise || e.de === w.exercise; });
        if (ex && ex.bp) _spm[ex.bp] = (_spm[ex.bp] || 0) + (w.setDetails || []).filter(function(s) { return s.type !== 'warmup'; }).length;
      });
      var _vs = [];
      Object.keys(window._VOLUME_LANDMARKS).forEach(function(bp) {
        if (bp === '_factors') return; var lm = window._VOLUME_LANDMARKS[bp]; var cur = _spm[bp] || 0;
        var zone = cur < lm.mev ? 'UNTER MEV' : cur <= lm.mav ? 'optimal' : cur <= lm.mrv ? 'hoch' : '\u00dcBER MRV';
        if (cur > 0) _vs.push(lm.de + ': ' + cur + '/' + lm.mav + ' Sets (' + zone + ')');
      });
      if (_vs.length > 0) { summary += '\nVOLUMEN-STATUS DIESE WOCHE:\n'; _vs.forEach(function(v) { summary += '- ' + v + '\n'; }); }
    }
    return summary;
  };

  // === PLAN ADHERENCE TRACKING ===
  window._checkPlanAdherence = function() {
    var plan = JSON.parse(localStorage.getItem('base_active_plan') || 'null');
    if (!plan || !plan.planData) return null;
    var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
    var weeks = plan.planData.weeks || [];
    var adherenceData = [];
    for (var w = 0; w < weeks.length; w++) {
      var weekData = weeks[w];
      if (!weekData || !weekData.sessions) continue;
      var weekStart = new Date(plan.startDate || plan.created);
      weekStart.setDate(weekStart.getDate() + (w * 7));
      var weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
      if (weekEnd > new Date()) { if (weekStart > new Date()) break; }
      var plannedSessions = weekData.sessions.length;
      var actualWorkouts = allWorkouts.filter(function(wo) {
        var d = new Date(wo.date); return d >= weekStart && d < weekEnd && wo.category === 'strength';
      });
      var completedSessions = actualWorkouts.length;
      var plannedExercises = [];
      weekData.sessions.forEach(function(s) { (s.exercises || []).forEach(function(ex) { plannedExercises.push((ex.name || '').toLowerCase()); }); });
      var matchedExercises = 0;
      actualWorkouts.forEach(function(wo) {
        var woEx = (wo.exercise || '').toLowerCase();
        var isMatched = plannedExercises.some(function(planned) {
          if (planned === woEx) return true;
          if (woEx.indexOf(planned) !== -1 || planned.indexOf(woEx) !== -1) return true;
          var planWords = planned.split(/[\s\-\/]+/);
          var woWords = woEx.split(/[\s\-\/]+/);
          var overlap = planWords.filter(function(pw) { return woWords.some(function(ww) { return ww.indexOf(pw) !== -1 || pw.indexOf(ww) !== -1; }); });
          return overlap.length >= Math.ceil(planWords.length * 0.5);
        });
        if (isMatched) matchedExercises++;
      });
      var sessionAdherence = plannedSessions > 0 ? Math.min(100, Math.round(completedSessions / plannedSessions * 100)) : 0;
      var exerciseAdherence = plannedExercises.length > 0 ? Math.min(100, Math.round(matchedExercises / plannedExercises.length * 100)) : 0;
      adherenceData.push({ week: w + 1, planned: plannedSessions, completed: completedSessions, sessionAdherence: sessionAdherence, exerciseAdherence: exerciseAdherence, overall: Math.round((sessionAdherence + exerciseAdherence) / 2) });
    }
    return adherenceData.length > 0 ? adherenceData : null;
  };

  window._renderPlanAdherence = function(containerId) {
    var container = document.getElementById(containerId || 'planAdherenceWidget');
    if (!container) return;
    var data = window._checkPlanAdherence();
    if (!data || data.length === 0) { container.innerHTML = ''; return; }
    var avgAdherence = Math.round(data.reduce(function(a, d) { return a + d.overall; }, 0) / data.length);
    var adherenceColor = avgAdherence >= 80 ? '#a3c9a8' : avgAdherence >= 60 ? '#e8c86a' : '#e88a8a';
    var adherenceLabel = avgAdherence >= 80 ? 'Exzellent' : avgAdherence >= 60 ? 'Gut' : avgAdherence >= 40 ? 'Ausbauf\u00e4hig' : 'Kritisch';
    var html = '<div class="mb-3 flex items-center justify-between">';
    html += '<span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Plan-Adherence</span>';
    html += '<div class="flex items-center gap-2"><span class="text-lg font-black" style="color:' + adherenceColor + '">' + avgAdherence + '%</span>';
    html += '<span class="text-[8px] font-bold px-1.5 py-0.5 rounded" style="background:' + adherenceColor + '22;color:' + adherenceColor + '">' + adherenceLabel + '</span></div></div>';
    html += '<div class="flex gap-1 mb-2">';
    data.forEach(function(d) {
      var color = d.overall >= 80 ? '#a3c9a8' : d.overall >= 60 ? '#e8c86a' : '#e88a8a';
      var height = Math.max(8, Math.round(d.overall / 100 * 40));
      html += '<div class="flex-1 flex flex-col items-center gap-1">';
      html += '<div class="w-full rounded" style="height:' + height + 'px;background:' + color + ';opacity:0.5"></div>';
      html += '<span class="text-[7px] font-bold" style="color:' + color + '">' + d.overall + '%</span>';
      html += '<span class="text-[6px]" style="color:#737373">W' + d.week + '</span></div>';
    });
    html += '</div>';
    var lastWeek = data[data.length - 1];
    html += '<div class="flex gap-2 text-[8px]"><span style="color:#9898a2">Letzte Woche: ' + lastWeek.completed + '/' + lastWeek.planned + ' Sessions</span>';
    html += '<span style="color:#9898a2">\u00b7</span><span style="color:#9898a2">' + lastWeek.exerciseAdherence + '% \u00dcbungs-Match</span></div>';
    container.innerHTML = html;
  };

  // === ACHIEVEMENT GALLERY ===
  window._showAchievementGallery = function() {
    var unlocked = JSON.parse(localStorage.getItem('base_achievements') || '[]');
    var html = '';
    (window._ACHIEVEMENTS || []).forEach(function(ach) {
      var isUnlocked = unlocked.indexOf(ach.id) !== -1;
      html += '<div class="flex items-center gap-3 p-3 rounded-xl mb-2" style="background:' + (isUnlocked ? 'rgba(163,201,168,0.06)' : 'var(--inner-bg-hex)') + ';border:1px solid ' + (isUnlocked ? 'rgba(163,201,168,0.15)' : 'var(--border-hex)') + ';' + (isUnlocked ? '' : 'opacity:0.5') + '">';
      html += '<div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style="background:' + (isUnlocked ? 'rgba(163,201,168,0.1)' : '#0f110f') + ';font-size:20px">' + (isUnlocked ? ach.icon : '\ud83d\udd12') + '</div>';
      html += '<div class="flex-1 min-w-0"><div class="text-[11px] font-bold ' + (isUnlocked ? 'text-white' : '') + '" style="' + (isUnlocked ? '' : 'color:#737373') + '">' + window._escapeHtml(ach.name) + '</div>';
      html += '<div class="text-[9px]" style="color:#9898a2">' + window._escapeHtml(ach.desc) + '</div></div>';
      if (isUnlocked) html += '<span class="flex-shrink-0 text-[8px] font-bold px-2 py-0.5 rounded" style="background:rgba(163,201,168,0.1);color:var(--primary-hex)">\u2713</span>';
      html += '</div>';
    });
    html += '<div class="mt-4 p-3 rounded-xl text-center" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">';
    html += '<span class="text-sm font-black" style="color:var(--primary-hex)">' + unlocked.length + '/' + (window._ACHIEVEMENTS || []).length + '</span>';
    html += '<span class="text-[10px] ml-1" style="color:#9898a2">Achievements freigeschaltet</span></div>';
    var content = document.getElementById('achievementGalleryContent');
    if (content) { content.innerHTML = html; window.toggleModal('achievementGalleryModal'); }
  };

  // === GUIDED STRETCH FLOWS ===
  window._STRETCH_FLOWS = {
    'H\u00fcft\u00f6ffner': {
      duration: '8 min',
      exercises: [
        { name: 'Hip Flexor Stretch (Links)', holdSeconds: 45, transition: 5 },
        { name: 'Hip Flexor Stretch (Rechts)', holdSeconds: 45, transition: 5 },
        { name: 'Pigeon Pose (Links)', holdSeconds: 60, transition: 5 },
        { name: 'Pigeon Pose (Rechts)', holdSeconds: 60, transition: 5 },
        { name: '90/90 Stretch (Links)', holdSeconds: 45, transition: 5 },
        { name: '90/90 Stretch (Rechts)', holdSeconds: 45, transition: 5 },
        { name: 'Deep Squat Hold', holdSeconds: 60, transition: 0 }
      ]
    },
    'Oberk\u00f6rper Mobility': {
      duration: '7 min',
      exercises: [
        { name: 'Thoracic Spine Rotation (Links)', holdSeconds: 30, transition: 5 },
        { name: 'Thoracic Spine Rotation (Rechts)', holdSeconds: 30, transition: 5 },
        { name: 'Shoulder Dislocates', holdSeconds: 45, transition: 5 },
        { name: 'Cat-Cow', holdSeconds: 60, transition: 5 },
        { name: "Child's Pose", holdSeconds: 45, transition: 5 },
        { name: 'Thread the Needle (Links)', holdSeconds: 30, transition: 5 },
        { name: 'Thread the Needle (Rechts)', holdSeconds: 30, transition: 0 }
      ]
    },
    'Ganzk\u00f6rper (Post-Workout)': {
      duration: '10 min',
      exercises: [
        { name: 'Standing Quad Stretch (Links)', holdSeconds: 30, transition: 5 },
        { name: 'Standing Quad Stretch (Rechts)', holdSeconds: 30, transition: 5 },
        { name: 'Hamstring Stretch (Links)', holdSeconds: 30, transition: 5 },
        { name: 'Hamstring Stretch (Rechts)', holdSeconds: 30, transition: 5 },
        { name: 'Pigeon Pose (Links)', holdSeconds: 45, transition: 5 },
        { name: 'Pigeon Pose (Rechts)', holdSeconds: 45, transition: 5 },
        { name: "World's Greatest Stretch (Links)", holdSeconds: 30, transition: 5 },
        { name: "World's Greatest Stretch (Rechts)", holdSeconds: 30, transition: 5 },
        { name: 'Chest Doorway Stretch', holdSeconds: 30, transition: 5 },
        { name: 'Downward Dog', holdSeconds: 45, transition: 5 },
        { name: "Child's Pose", holdSeconds: 60, transition: 0 }
      ]
    },
    'Unterk\u00f6rper (Leg Day)': {
      duration: '8 min',
      exercises: [
        { name: 'Couch Stretch (Links)', holdSeconds: 45, transition: 5 },
        { name: 'Couch Stretch (Rechts)', holdSeconds: 45, transition: 5 },
        { name: 'Calf Stretch Wall (Links)', holdSeconds: 30, transition: 5 },
        { name: 'Calf Stretch Wall (Rechts)', holdSeconds: 30, transition: 5 },
        { name: 'Hamstring Stretch (Links)', holdSeconds: 45, transition: 5 },
        { name: 'Hamstring Stretch (Rechts)', holdSeconds: 45, transition: 5 },
        { name: 'Deep Squat Hold', holdSeconds: 60, transition: 0 }
      ]
    }
  };

  window._showStretchFlowPicker = function() {
    var html = '<div class="text-[9px] font-black uppercase tracking-widest mb-3" style="color:var(--text-muted)">Gef\u00fchrte Stretch-Flows</div>';
    Object.keys(window._STRETCH_FLOWS).forEach(function(name) {
      var flow = window._STRETCH_FLOWS[name];
      var safeName = window._escapeHtml(name).replace(/'/g, '&#39;');
      html += '<button onclick="window._startStretchFlow(\'' + safeName + '\')" class="w-full p-3 rounded-xl text-left cursor-pointer pointer-events-auto mb-2 transition-colors" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)" aria-label="' + safeName + ' starten">';
      html += '<div class="flex items-center justify-between"><div>';
      html += '<span class="text-xs font-bold text-white">' + window._escapeHtml(name) + '</span>';
      html += '<div class="text-[9px]" style="color:#9898a2">' + flow.exercises.length + ' \u00dcbungen \u00b7 ' + flow.duration + '</div>';
      html += '</div><span class="text-[9px] font-bold" style="color:var(--primary-hex)">Starten \u2192</span></div></button>';
    });
    var container = document.getElementById('stretchFlowPicker');
    if (container) container.innerHTML = html;
  };

  window._startStretchFlow = function(flowName) {
    // Decode HTML entities back
    var decoded = flowName.replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    var flow = window._STRETCH_FLOWS[decoded];
    if (!flow) { Object.keys(window._STRETCH_FLOWS).forEach(function(k) { if (window._escapeHtml(k).replace(/'/g, '&#39;') === flowName) flow = window._STRETCH_FLOWS[k]; }); }
    if (!flow) return;
    window._currentFlow = { name: decoded, exercises: flow.exercises.slice(), currentIndex: 0, isTransition: false };
    window._runFlowStep();
  };

  window._runFlowStep = function() {
    var flow = window._currentFlow; if (!flow) return;
    if (flow.currentIndex >= flow.exercises.length) { window._showFlowComplete(flow.name, flow.exercises.length); return; }
    var ex = flow.exercises[flow.currentIndex];
    if (flow.isTransition && ex.transition > 0) {
      window._showFlowTimer(ex.transition, '\u27a1\ufe0f N\u00e4chste: ' + ex.name, '#e8c86a', function() { flow.isTransition = false; window._runFlowStep(); });
    } else {
      flow.isTransition = true;
      var progress = (flow.currentIndex + 1) + '/' + flow.exercises.length;
      window._showFlowTimer(ex.holdSeconds, ex.name + ' (' + progress + ')', '#a3c9a8', function() { flow.currentIndex++; window._runFlowStep(); });
    }
  };

  window._showFlowTimer = function(seconds, label, color, onComplete) {
    var overlay = document.getElementById('flowTimerOverlay');
    if (!overlay) { overlay = document.createElement('div'); overlay.id = 'flowTimerOverlay'; overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.97)'; document.body.appendChild(overlay); }
    var remaining = seconds; var total = seconds;
    var updateDisplay = function() {
      var pct = (1 - remaining / total);
      var circ = 2 * Math.PI * 80;
      var dash = circ - pct * circ;
      overlay.innerHTML = '<div class="text-center" style="position:relative;width:200px;height:200px">' +
        '<svg width="200" height="200" style="transform:rotate(-90deg)"><circle cx="100" cy="100" r="80" fill="none" stroke="#1e201e" stroke-width="8"/>' +
        '<circle cx="100" cy="100" r="80" fill="none" stroke="' + color + '" stroke-width="8" stroke-dasharray="' + circ + '" stroke-dashoffset="' + dash + '" stroke-linecap="round" style="transition:stroke-dashoffset 0.3s linear"/></svg>' +
        '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">' +
        '<div style="font-size:48px;font-weight:900;color:#fff;font-family:Outfit,sans-serif">' + remaining + '</div>' +
        '<div style="font-size:10px;font-weight:700;color:' + color + ';margin-top:4px">HALTEN</div></div></div>' +
        '<div class="mt-8 text-center"><div class="text-sm font-bold text-white mb-1">' + window._escapeHtml(label) + '</div>' +
        '<div class="text-[9px]" style="color:#9898a2">' + window._escapeHtml(window._currentFlow ? window._currentFlow.name : '') + '</div></div>' +
        '<button onclick="clearInterval(window._flowTimerInterval);document.getElementById(\'' + 'flowTimerOverlay' + '\').remove();window._currentFlow=null" class="mt-6 px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer pointer-events-auto" style="background:rgba(232,138,138,0.1);border:1px solid rgba(232,138,138,0.2);color:#e88a8a" aria-label="Flow beenden">Flow beenden</button>';
    };
    updateDisplay();
    window._flowTimerInterval = setInterval(function() {
      remaining--;
      if (remaining <= 0) { clearInterval(window._flowTimerInterval); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); setTimeout(onComplete, 300); }
      else { updateDisplay(); if (remaining <= 3 && navigator.vibrate) navigator.vibrate(100); }
    }, 1000);
  };

  window._showFlowComplete = function(flowName, exerciseCount) {
    var overlay = document.getElementById('flowTimerOverlay');
    if (overlay) {
      overlay.innerHTML = '<div class="text-center"><div style="font-size:64px;margin-bottom:16px">\ud83e\uddd8</div>' +
        '<div class="text-2xl font-black text-white mb-2">Flow komplett!</div>' +
        '<div class="text-sm" style="color:#9898a2">' + window._escapeHtml(flowName) + ' \u00b7 ' + exerciseCount + ' \u00dcbungen</div>' +
        '<button onclick="document.getElementById(\'' + 'flowTimerOverlay' + '\').remove()" class="mt-6 px-8 py-3 rounded-xl text-sm font-bold cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.25);color:var(--primary-hex)" aria-label="Fertig">Fertig \u2705</button></div>';
      if (window.awardXP) window.awardXP('workout');
    }
  };

  // === WEEKLY VOLUME CHART ===
  window._renderWeeklyVolumeChart = function(containerId) {
    var container = document.getElementById(containerId || 'weeklyVolumeChart');
    if (!container) return;
    var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
    var now = new Date();
    var weeks = [];
    for (var w = 0; w < 8; w++) {
      var weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() - (w * 7));
      var weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 6);
      var weekWorkouts = allWorkouts.filter(function(wk) { var d = new Date(wk.date); return d >= weekStart && d <= weekEnd; });
      var vol = weekWorkouts.reduce(function(a, wk) { return a + (wk.setDetails || []).reduce(function(b, s) { return b + ((parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0)); }, 0); }, 0);
      var count = weekWorkouts.length;
      weeks.unshift({ label: 'KW' + (w === 0 ? '' : '-' + w), vol: Math.round(vol), count: count });
    }
    var maxVol = Math.max.apply(null, weeks.map(function(w) { return w.vol; }).concat([1]));
    if (maxVol === 0) { container.innerHTML = ''; return; }
    var html = '<div class="mb-3 flex items-center justify-between"><span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Volumen \u00b7 8 Wochen</span></div>';
    html += '<div class="flex items-end gap-1" style="height:100px">';
    weeks.forEach(function(w) {
      var pct = Math.max((w.vol / maxVol) * 100, 4);
      var volLabel = w.vol >= 1000 ? (w.vol / 1000).toFixed(1) + 'k' : w.vol;
      html += '<div class="flex-1 flex flex-col items-center gap-1">';
      html += '<span class="text-[7px] font-bold" style="color:#9898a2">' + volLabel + '</span>';
      html += '<div class="w-full rounded-t" style="height:' + pct + '%;background:rgba(163,201,168,' + (0.3 + (pct / 100) * 0.7) + ')"></div>';
      html += '<span class="text-[7px]" style="color:#737373">' + w.label + '</span>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  };

  // === MONTHLY SUMMARY ===
  window._renderMonthlySummary = function(containerId) {
    var container = document.getElementById(containerId || 'monthlySummaryWidget');
    if (!container) return;
    var allWorkouts = JSON.parse(localStorage.getItem(window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache') || '[]');
    var now = new Date();
    var thisMonth = now.getMonth(); var thisYear = now.getFullYear();
    var lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    var lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    var thisMonthWorkouts = allWorkouts.filter(function(w) { var d = new Date(w.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
    var lastMonthWorkouts = allWorkouts.filter(function(w) { var d = new Date(w.date); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; });
    if (thisMonthWorkouts.length === 0 && lastMonthWorkouts.length === 0) { container.innerHTML = ''; return; }
    var calcVolume = function(wk) { return wk.reduce(function(a, w) { return a + (w.setDetails || []).reduce(function(b, s) { return b + ((parseFloat(s.reps) || 0) * (parseFloat(s.weight) || 0)); }, 0); }, 0); };
    var thisCount = thisMonthWorkouts.length; var lastCount = lastMonthWorkouts.length;
    var thisVol = calcVolume(thisMonthWorkouts); var lastVol = calcVolume(lastMonthWorkouts);
    var monthNames = ['Januar', 'Februar', 'M\u00e4rz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    var arrow = function(curr, prev) { var diff = curr - prev; if (diff > 0) return '<span style="color:var(--primary-hex)">\u2191' + Math.abs(diff) + '</span>'; if (diff < 0) return '<span style="color:#e88a8a">\u2193' + Math.abs(diff) + '</span>'; return '<span style="color:#9898a2">\u2192</span>'; };
    var volLabel = function(v) { return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v); };
    var html = '<div class="mb-3 flex items-center justify-between"><span class="text-[10px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Monats-Zusammenfassung \u00b7 ' + monthNames[thisMonth] + '</span></div>';
    html += '<div class="grid grid-cols-3 gap-2">';
    html += '<div class="p-3 rounded-xl text-center" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="text-[8px] font-bold mb-1" style="color:#9898a2">Workouts</div><div class="text-lg font-black text-white">' + thisCount + '</div><div class="text-[8px]">' + arrow(thisCount, lastCount) + ' <span style="color:#737373">vs. ' + monthNames[lastMonth] + '</span></div></div>';
    html += '<div class="p-3 rounded-xl text-center" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="text-[8px] font-bold mb-1" style="color:#9898a2">Volumen</div><div class="text-lg font-black text-white">' + volLabel(thisVol) + ' kg</div>';
    var volDiffPct = lastVol > 0 ? Math.round((thisVol - lastVol) / lastVol * 100) : 0;
    html += '<div class="text-[8px]">' + (volDiffPct >= 0 ? '<span style="color:var(--primary-hex)">\u2191' + volDiffPct + '%</span>' : '<span style="color:#e88a8a">\u2193' + Math.abs(volDiffPct) + '%</span>') + '</div></div>';
    var thisMonthPRs = 0;
    var exerciseMaxes = {};
    var allPrevious = allWorkouts.filter(function(w) { var d = new Date(w.date); return d < new Date(thisYear, thisMonth, 1) && w.category === 'strength' && w.setDetails; });
    allPrevious.forEach(function(w) { var maxW = Math.max.apply(null, (w.setDetails || []).map(function(s) { return parseFloat(s.weight) || 0; }).concat([0])); if (!exerciseMaxes[w.exercise] || maxW > exerciseMaxes[w.exercise]) { exerciseMaxes[w.exercise] = maxW; } });
    thisMonthWorkouts.forEach(function(w) { if (w.category !== 'strength' || !w.setDetails) return; var maxW = Math.max.apply(null, (w.setDetails || []).map(function(s) { return parseFloat(s.weight) || 0; }).concat([0])); if (maxW > (exerciseMaxes[w.exercise] || 0)) { thisMonthPRs++; exerciseMaxes[w.exercise] = maxW; } });
    html += '<div class="p-3 rounded-xl text-center" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="text-[8px] font-bold mb-1" style="color:#9898a2">PRs</div><div class="text-lg font-black" style="color:#e8c86a">' + thisMonthPRs + '</div><div class="text-[8px]" style="color:#737373">diesen Monat</div></div>';
    html += '</div>';
    container.innerHTML = html;
  };

  // ============================================================
  // COACH MULTI-TURN MEMORY (Session-übergreifend)
  // ============================================================
  window._COACH_MEMORY_KEY = 'base_coach_memory';
  window._COACH_HISTORY_KEY = 'base_coach_history';

  window._coachMemorySchema = {
    injuries: [],
    goals: [],
    weaknesses: [],
    preferences: [],
    lastMentioned: {},
    openQuestions: [],
    lastSessionNotes: ''
  };

  window._getCoachMemory = function() {
    try {
      return JSON.parse(localStorage.getItem(window._COACH_MEMORY_KEY) || JSON.stringify(window._coachMemorySchema));
    } catch(e) { return JSON.parse(JSON.stringify(window._coachMemorySchema)); }
  };

  window._saveCoachMemory = function(memory) {
    localStorage.setItem(window._COACH_MEMORY_KEY, JSON.stringify(memory));
  };

  window._getCoachHistory = function() {
    try { return JSON.parse(localStorage.getItem(window._COACH_HISTORY_KEY) || '[]'); }
    catch(e) { return []; }
  };

  window._addToCoachHistory = function(role, text) {
    var history = window._getCoachHistory();
    history.push({ role: role, text: text, date: new Date().toISOString() });
    history = history.slice(-30);
    localStorage.setItem(window._COACH_HISTORY_KEY, JSON.stringify(history));
  };

  window._updateCoachMemoryFromChat = function(userMsg, aiReply) {
    var memory = window._getCoachMemory();
    var lower = userMsg.toLowerCase();

    var injuryKeywords = ['schmerz','zwickt','wehtut','verletzt','knie','schulter','rücken','hüfte','ellenbogen','handgelenk','nacken'];
    injuryKeywords.forEach(function(kw) {
      if (lower.includes(kw) && !memory.injuries.some(function(i) { return i.toLowerCase().includes(kw); })) {
        var idx = lower.indexOf(kw);
        var ctx = userMsg.substring(Math.max(0, idx - 10), Math.min(userMsg.length, idx + 30)).trim();
        memory.injuries.push(ctx);
        memory.injuries = memory.injuries.slice(-5);
        memory.lastMentioned[kw] = new Date().toISOString().split('T')[0];
      }
    });

    var goalKeywords = ['möchte','will','ziel','schaffe','erreichen','abnehmen','aufbauen','steigern'];
    goalKeywords.forEach(function(kw) {
      if (lower.includes(kw)) {
        var idx = lower.indexOf(kw);
        var ctx = userMsg.substring(idx, Math.min(userMsg.length, idx + 60)).trim();
        if (ctx.length > 10 && !memory.goals.some(function(g) { return g.toLowerCase().slice(0, 20) === ctx.toLowerCase().slice(0, 20); })) {
          memory.goals.push(ctx);
          memory.goals = memory.goals.slice(-5);
        }
      }
    });

    var weakKeywords = ['schwach','schwäche','problem','defizit','kann nicht','schaffe nicht'];
    weakKeywords.forEach(function(kw) {
      if (lower.includes(kw)) {
        var idx = lower.indexOf(kw);
        var ctx = userMsg.substring(Math.max(0, idx - 10), Math.min(userMsg.length, idx + 40)).trim();
        if (ctx.length > 8 && !memory.weaknesses.some(function(w) { return w.toLowerCase().slice(0, 15) === ctx.toLowerCase().slice(0, 15); })) {
          memory.weaknesses.push(ctx);
          memory.weaknesses = memory.weaknesses.slice(-4);
        }
      }
    });

    var prefKeywords = ['mag keine','hasse','lieber','bevorzuge','morgens','abends','gerne'];
    prefKeywords.forEach(function(kw) {
      if (lower.includes(kw)) {
        var idx = lower.indexOf(kw);
        var ctx = userMsg.substring(idx, Math.min(userMsg.length, idx + 50)).trim();
        if (ctx.length > 8 && !memory.preferences.some(function(p) { return p.toLowerCase().slice(0, 15) === ctx.toLowerCase().slice(0, 15); })) {
          memory.preferences.push(ctx);
          memory.preferences = memory.preferences.slice(-4);
        }
      }
    });

    if (aiReply && aiReply.includes('?')) {
      var questions = aiReply.split('\n').filter(function(l) { return l.includes('?') && l.length < 150; });
      if (questions.length > 0) {
        memory.openQuestions = questions.slice(-2);
      }
    }

    if (userMsg.length > 20) {
      memory.lastSessionNotes = userMsg.slice(0, 200);
    }

    window._saveCoachMemory(memory);
  };

  window._buildCoachMemoryContext = function() {
    var memory = window._getCoachMemory();
    var history = window._getCoachHistory();
    var ctx = '';

    if (memory.injuries && memory.injuries.length > 0) {
      ctx += '\n\nBEKANNTE VERLETZUNGEN/BESCHWERDEN (aus frueheren Chats):\n';
      memory.injuries.slice(-5).forEach(function(i) { ctx += '- ' + i + '\n'; });
      ctx += '-> Proaktiv nachfragen wie es damit geht!\n';
    }

    if (memory.goals && memory.goals.length > 0) {
      ctx += '\nBEKANNTE ZIELE (aus frueheren Chats):\n';
      memory.goals.slice(-3).forEach(function(g) { ctx += '- ' + g + '\n'; });
    }

    if (memory.weaknesses && memory.weaknesses.length > 0) {
      ctx += '\nBEKANNTE SCHWAECHEN:\n';
      memory.weaknesses.slice(-3).forEach(function(w) { ctx += '- ' + w + '\n'; });
    }

    if (memory.preferences && memory.preferences.length > 0) {
      ctx += '\nPRAEFERENZEN:\n';
      memory.preferences.slice(-3).forEach(function(p) { ctx += '- ' + p + '\n'; });
    }

    if (memory.openQuestions && memory.openQuestions.length > 0) {
      ctx += '\nOFFENE FRAGEN AUS LETZTEM CHAT:\n';
      memory.openQuestions.forEach(function(q) { ctx += '- ' + q + '\n'; });
      ctx += '-> Falls relevant: auf diese Fragen eingehen!\n';
    }

    if (history.length > 0) {
      ctx += '\nCHAT-VERLAUF (letzte Sessions):\n';
      history.slice(-6).forEach(function(h) {
        ctx += '[' + h.date.split('T')[0] + '] ';
        ctx += (h.role === 'user' ? 'User: ' : 'Coach: ');
        ctx += h.text.slice(0, 100) + (h.text.length > 100 ? '...' : '');
        ctx += '\n';
      });
    }

    return ctx;
  };

  window._renderCoachMemoryHints = function() {
    var memory = window._getCoachMemory();
    var container = document.getElementById('coachMemoryHints');
    if (!container) return;

    var hints = [];
    if (memory.injuries && memory.injuries.length > 0) hints.push(memory.injuries.length + ' bekannte Beschwerden');
    if (memory.goals && memory.goals.length > 0) hints.push(memory.goals.length + ' gespeicherte Ziele');
    if (memory.openQuestions && memory.openQuestions.length > 0) hints.push('Offene Frage aus letztem Chat');

    if (hints.length === 0) { container.style.display = 'none'; return; }

    container.style.display = 'flex';
    container.innerHTML =
      '<p style="font-size:9px;color:var(--primary-hex);font-weight:600">' +
      'Coach erinnert sich: ' + window._escapeHtml(hints.join(' \u00b7 ')) + '</p>' +
      '<button onclick="window._showCoachMemoryDetail()" class="pointer-events-auto" aria-label="Memory Details" ' +
      'style="font-size:9px;color:var(--text-muted);background:none;border:none;cursor:pointer;text-decoration:underline">Details</button>';
  };

  window._showCoachMemoryDetail = function() {
    var memory = window._getCoachMemory();
    var html = '<div style="font-size:12px;color:var(--text-main)">';
    if (memory.injuries.length > 0) {
      html += '<p style="font-weight:700;margin-bottom:4px">Verletzungen/Beschwerden:</p>';
      memory.injuries.forEach(function(i) { html += '<p style="color:var(--text-muted);padding:3px 0">' + window._escapeHtml(i) + '</p>'; });
    }
    if (memory.goals.length > 0) {
      html += '<p style="font-weight:700;margin:10px 0 4px">Ziele:</p>';
      memory.goals.forEach(function(g) { html += '<p style="color:var(--text-muted);padding:3px 0">' + window._escapeHtml(g) + '</p>'; });
    }
    if (memory.weaknesses.length > 0) {
      html += '<p style="font-weight:700;margin:10px 0 4px">Schwaechen:</p>';
      memory.weaknesses.forEach(function(w) { html += '<p style="color:var(--text-muted);padding:3px 0">' + window._escapeHtml(w) + '</p>'; });
    }
    if (memory.preferences.length > 0) {
      html += '<p style="font-weight:700;margin:10px 0 4px">Praeferenzen:</p>';
      memory.preferences.forEach(function(p) { html += '<p style="color:var(--text-muted);padding:3px 0">' + window._escapeHtml(p) + '</p>'; });
    }
    html += '<button onclick="window._clearCoachMemory();window.closeModal&&window.closeModal()" class="pointer-events-auto" aria-label="Gedaechtnis loeschen" ' +
      'style="margin-top:14px;padding:7px 14px;border-radius:8px;font-size:11px;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">Ged\u00e4chtnis l\u00f6schen</button>';
    html += '</div>';
    window.showModal('Coach-Ged\u00e4chtnis', html, false);
  };

  window._clearCoachMemory = function() {
    localStorage.removeItem(window._COACH_MEMORY_KEY);
    localStorage.removeItem(window._COACH_HISTORY_KEY);
    window.showToast('Ged\u00e4chtnis gel\u00f6scht');
    var container = document.getElementById('coachMemoryHints');
    if (container) container.style.display = 'none';
  };

  // ============================================================
  // TRAININGSPLAN-FEHLER-ERKENNER
  // ============================================================
  window.openPlanChecker = function() {
    window.toggleModal('planCheckerModal');
  };

  window._analyzePlanErrors = async function() {
    var planInput = document.getElementById('planCheckerInput');
    var planText = planInput ? planInput.value.trim() : '';

    if (!planText) { window.showToast('Bitte Plan eingeben', 'error'); return; }
    if (!window.checkOnlineForAI || !window.checkOnlineForAI()) return;

    var profile = window.userProfile || {};
    var orms = JSON.parse(localStorage.getItem('base_1rm_data') || '{}');
    var allW = (window.workouts || []).filter(function(w) { return w.archived; });

    var w4ago = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];
    var recent = allW.filter(function(w) { return w.date >= w4ago && w.category === 'strength'; });
    var pushEx = ['bankdr\u00fccken','press','dips','flyes','push'];
    var pullEx = ['rudern','row','pulldown','klimmzug','curl','face pull'];
    var pushCount = 0; var pullCount = 0;
    recent.forEach(function(w) {
      var n = (w.exercise || '').toLowerCase();
      if (pushEx.some(function(k) { return n.includes(k); })) pushCount++;
      if (pullEx.some(function(k) { return n.includes(k); })) pullCount++;
    });

    var btn = document.getElementById('planCheckerBtn');
    if (btn) { btn.textContent = 'Analysiere...'; btn.style.opacity = '0.6'; btn.disabled = true; }

    var prompt =
      'Du bist CSCS-zertifizierter Sportwissenschaftler und Trainingsplan-Analyst.\n\n' +
      'Analysiere diesen Trainingsplan auf Fehler und Optimierungspotenzial.\n\n' +
      'TRAININGSPLAN:\n' + planText + '\n\n' +
      'ATHLETEN-PROFIL:\n' +
      '- Ziel: ' + (profile.goal || 'unbekannt') + '\n' +
      '- Erfahrung: ' + (profile.experience || 'unbekannt') + '\n' +
      '- Alter: ' + (profile.age || 'unbekannt') + '\n' +
      '- Bekannte Verletzungen: ' + (profile.injuries || 'keine') + '\n\n' +
      'EIGENE TRAINING-DATEN (letzte 4 Wochen):\n' +
      '- Push/Pull Verhaeltnis bisher: ' + pushCount + ':' + pullCount + '\n' +
      '- Beste 1RMs: ' + Object.entries(orms).slice(0, 5).map(function(e) { return e[0] + ': ' + e[1] + 'kg'; }).join(', ') + '\n\n' +
      'UEBERPRUEFE auf:\n\n' +
      '## KRITISCHE FEHLER (verletzungsriskant oder kontraproduktiv)\n' +
      '[Jeder Fehler: Konkrete Stelle im Plan + Warum + Wie korrigieren]\n\n' +
      '## OPTIMIERUNGSPOTENZIAL\n' +
      '[Was koennte besser sein: Volume, Intensitaet, Frequenz, Uebungsauswahl, Reihenfolge]\n\n' +
      '## WAS GUT IST\n' +
      '[Positives — max 3 Punkte]\n\n' +
      '## KORRIGIERTE VERSION\n' +
      '[Verbesserte Version des Plans — konkret und vollstaendig]\n\n' +
      'Wissenschaftliche Basis: Schoenfeld 2017, Krieger 2010 Volume, ACSM Guidelines, Zourdos 2016. Deutsch. Konkret mit Zahlen.';

    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function() { controller.abort(); }, 30000);
      var res = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ prompt: prompt, type: 'plan_checker', maxTokens: 2500, userId: window._getAiUserId ? window._getAiUserId() : '' })
      });
      clearTimeout(timeoutId);
      if (res.status === 429) {
        try { var errData = await res.json(); window.showToast(errData.error || 'Tageslimit erreicht.', 'error', 4000); } catch(e) { window.showToast('Tageslimit erreicht.', 'error'); }
        return;
      }
      if (!res.ok) throw new Error('Server Fehler');
      var data = await res.json();
      var text = window._extractGeminiText(data, '');

      window.toggleModal('planCheckerModal');
      window.showModal(
        'Plan-Analyse',
        '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap;max-height:70vh;overflow-y:auto">' +
        window._sanitizeAIHtml(text) +
        '</div>',
        false
      );
      if (window.awardXP) window.awardXP('scan', 30);
    } catch(e) {
      if (e.name === 'AbortError') window.showToast('Zeitueberschreitung. Bitte erneut versuchen.', 'error');
      else window.showToast('Analyse fehlgeschlagen: ' + (e.message || ''), 'error');
    } finally {
      if (btn) { btn.textContent = 'Plan analysieren'; btn.style.opacity = '1'; btn.disabled = false; }
    }
  };

  // ============================================================
  // GPS TRACKING ENGINE
  // Haversine-Formel, Rauschen-Filterung, Pace-Zonen
  // ============================================================
  window._GPS_KEY = 'base_gps_sessions';
  window._GPS_ACTIVE_KEY = 'base_gps_active';

  window._haversine = function(lat1, lon1, lat2, lon2) {
    var R = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  window._isValidGPSPoint = function(pos, lastPos, lastTime) {
    if (pos.coords.accuracy > 50) return false;
    if (!lastPos) return true;
    var dist = window._haversine(lastPos.coords.latitude, lastPos.coords.longitude, pos.coords.latitude, pos.coords.longitude);
    var timeDiff = (pos.timestamp - lastTime) / 1000;
    if (timeDiff < 1) return false;
    var speed = dist / timeDiff;
    if (speed > 12) return false;
    return true;
  };

  window._calcPace = function(distanceM, timeSeconds) {
    if (distanceM < 10 || timeSeconds < 5) return null;
    var secsPerKm = (timeSeconds / distanceM) * 1000;
    var mins = Math.floor(secsPerKm / 60);
    var secs = Math.round(secsPerKm % 60);
    return { raw: secsPerKm, label: mins + ':' + (secs < 10 ? '0' : '') + secs + ' /km' };
  };

  window._getPaceZone = function(paceSecsPerKm) {
    if (paceSecsPerKm > 420) return { zone: 1, label: 'Z1 Regeneration', color: '#8aafe8' };
    if (paceSecsPerKm > 360) return { zone: 2, label: 'Z2 Ausdauer', color: '#a3c9a8' };
    if (paceSecsPerKm > 300) return { zone: 3, label: 'Z3 Tempo', color: '#e8c86a' };
    if (paceSecsPerKm > 240) return { zone: 4, label: 'Z4 Schwelle', color: '#e8a06a' };
    return { zone: 5, label: 'Z5 VO2max', color: '#e88a8a' };
  };

  window._gpsSession = null;
  window._gpsWatcher = null;
  window._gpsWakeLock = null;
  window._gpsUIInterval = null;

  window._startGPS = function(activityType) {
    if (!navigator.geolocation) { window.showToast('GPS nicht verf\u00fcgbar auf diesem Ger\u00e4t', 'error'); return; }

    var startTime = Date.now();
    window._gpsSession = {
      id: 'gps_' + startTime,
      activityType: activityType || 'laufen',
      startTime: startTime,
      points: [],
      totalDist: 0,
      lastValidPos: null,
      lastValidTime: null,
      paused: false,
      pausedAt: null,
      totalPauseMs: 0,
      autoPauseThreshold: 8,
      manualHR: null,
      splits: [],
      _autoPauseWarned: false
    };

    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(function(lock) { window._gpsWakeLock = lock; }).catch(function() {});
    }

    window._gpsWatcher = navigator.geolocation.watchPosition(
      window._onGPSUpdate, window._onGPSError,
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    window._renderGPSLive();
    window.showToast('GPS gestartet \u2014 warte auf Signal...', null, null, null, 3000);
  };

  window._onGPSUpdate = function(pos) {
    var session = window._gpsSession;
    if (!session || session.paused) return;
    if (!window._isValidGPSPoint(pos, session.lastValidPos ? { coords: { latitude: session.lastValidPos.lat, longitude: session.lastValidPos.lng } } : null, session.lastValidTime)) return;

    var newPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, alt: pos.coords.altitude || 0, time: pos.timestamp, accuracy: pos.coords.accuracy, speed: pos.coords.speed || 0 };

    if (session.lastValidPos) {
      var dist = window._haversine(session.lastValidPos.lat, session.lastValidPos.lng, newPoint.lat, newPoint.lng);
      var timeDiff = (newPoint.time - session.lastValidTime) / 1000;
      var speed = dist / timeDiff;

      if (speed < 0.5 && timeDiff > 5) {
        session._autoPauseWarned = true;
      } else {
        session._autoPauseWarned = false;
        session.totalDist += dist;
        var km = Math.floor(session.totalDist / 1000);
        if (km > session.splits.length) {
          var splitTime = (newPoint.time - session.startTime - session.totalPauseMs) / 1000;
          var lastSplitTime = session.splits.length > 0 ? session.splits[session.splits.length - 1].totalTime : 0;
          session.splits.push({ km: km, splitSecs: splitTime - lastSplitTime, totalTime: splitTime });
        }
      }
    }

    session.points.push(newPoint);
    session.lastValidPos = newPoint;
    session.lastValidTime = newPoint.time;
    window._updateGPSLiveUI();
  };

  window._onGPSError = function(err) {
    var msgs = { 1: 'GPS-Zugriff verweigert', 2: 'GPS Position nicht verf\u00fcgbar', 3: 'GPS Timeout' };
    window.showToast(msgs[err.code] || 'GPS-Fehler', 'error');
  };

  window._pauseGPS = function() {
    if (!window._gpsSession) return;
    window._gpsSession.paused = true;
    window._gpsSession.pausedAt = Date.now();
    window.showToast('Pausiert');
    window._updateGPSLiveUI();
  };

  window._resumeGPS = function() {
    if (!window._gpsSession || !window._gpsSession.paused) return;
    window._gpsSession.totalPauseMs += Date.now() - window._gpsSession.pausedAt;
    window._gpsSession.paused = false;
    window._gpsSession.pausedAt = null;
    window.showToast('Weiter');
    window._updateGPSLiveUI();
  };

  window._stopGPS = function() {
    if (window._gpsWatcher) { navigator.geolocation.clearWatch(window._gpsWatcher); window._gpsWatcher = null; }
    if (window._gpsWakeLock) { window._gpsWakeLock.release().catch(function() {}); window._gpsWakeLock = null; }
    if (window._gpsUIInterval) { clearInterval(window._gpsUIInterval); window._gpsUIInterval = null; }

    var session = window._gpsSession;
    if (!session) return;

    var endTime = Date.now();
    var activeMs = endTime - session.startTime - session.totalPauseMs;
    var activeSecs = Math.round(activeMs / 1000);
    var distKm = Math.round(session.totalDist) / 1000;
    var avgPace = window._calcPace(session.totalDist, activeSecs);
    var bw = parseFloat((window.userProfile || {}).weight) || 80;
    var met = session.activityType === 'radfahren' ? 7.5 : 8.0;
    var kcal = Math.round(met * bw * (activeSecs / 3600));

    var finalSession = {
      id: session.id, activityType: session.activityType,
      date: new Date().toISOString().split('T')[0],
      startTime: session.startTime, endTime: endTime,
      activeSecs: activeSecs,
      distanceKm: Math.round(distKm * 100) / 100,
      avgPace: avgPace ? avgPace.label : '\u2014',
      avgPaceSecs: avgPace ? avgPace.raw : 0,
      kcal: kcal, splits: session.splits,
      pointCount: session.points.length,
      routePoints: session.points.filter(function(_, i) { return i % 5 === 0; }).map(function(p) { return [Math.round(p.lat * 100000) / 100000, Math.round(p.lng * 100000) / 100000]; }),
      manualHR: session.manualHR
    };

    var stored = JSON.parse(localStorage.getItem(window._GPS_KEY) || '[]');
    stored.unshift(finalSession);
    stored = stored.slice(0, 50);
    localStorage.setItem(window._GPS_KEY, JSON.stringify(stored));

    window._gpsSessionToWorkout(finalSession);
    window._gpsSession = null;
    window.toggleModal('gpsTrackingModal');
    window._showGPSResult(finalSession);
  };

  window._gpsSessionToWorkout = function(session) {
    var entry = {
      id: session.id, date: session.date, category: 'cardio',
      exercise: session.activityType.charAt(0).toUpperCase() + session.activityType.slice(1),
      archived: true, volume: 0,
      data: { 'Distanz (km)': session.distanceKm.toString(), 'Dauer (min)': Math.round(session.activeSecs / 60).toString(), 'Pace (min/km)': session.avgPace, '\u00d8 Puls': session.manualHR || '', 'Kalorien': session.kcal.toString() },
      gpsSessionId: session.id
    };
    if (!window.workouts) window.workouts = [];
    window.workouts.unshift(entry);
    var storageKey = window._getStorageKey ? window._getStorageKey() : 'beastmode_v2_cache';
    localStorage.setItem(storageKey, JSON.stringify(window.workouts));
    if (window.renderTable) window.renderTable();
  };

  // ============================================================
  // GPS LIVE UI
  // ============================================================
  window._renderGPSLive = function() {
    window.toggleModal('gpsTrackingModal');
  };

  window._updateGPSLiveUI = function() {
    var session = window._gpsSession;
    if (!session) return;

    var now = Date.now();
    var activeMs = now - session.startTime - session.totalPauseMs - (session.paused ? (now - session.pausedAt) : 0);
    var secs = Math.max(0, Math.round(activeMs / 1000));
    var distKm = Math.round(session.totalDist / 10) / 100;
    var pace = window._calcPace(session.totalDist, secs);
    var paceZone = pace ? window._getPaceZone(pace.raw) : null;

    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    var timeStr = (h > 0 ? h + ':' : '') + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;

    var els = { gpsTime: timeStr, gpsDist: distKm.toFixed(2) + ' km', gpsPace: pace ? pace.label : '\u2014', gpsZone: paceZone ? paceZone.label : '\u2014', gpsPoints: session.points.length + ' GPS-Punkte', gpsAccuracy: session.lastValidPos ? '\u00b1' + Math.round(session.lastValidPos.accuracy) + 'm' : 'Kein Signal' };
    Object.keys(els).forEach(function(id) { var el = document.getElementById(id); if (el) el.textContent = els[id]; });

    var zoneEl = document.getElementById('gpsPaceZoneBadge');
    if (zoneEl && paceZone) { zoneEl.style.color = paceZone.color; zoneEl.style.background = paceZone.color + '22'; zoneEl.textContent = paceZone.label; }

    var pauseBtn = document.getElementById('gpsPauseBtn');
    if (pauseBtn) pauseBtn.textContent = session.paused ? '\u25b6 Weiter' : '\u23f8 Pause';
  };

  window._startGPSUIInterval = function() {
    if (window._gpsUIInterval) clearInterval(window._gpsUIInterval);
    window._gpsUIInterval = setInterval(function() {
      if (!window._gpsSession) { clearInterval(window._gpsUIInterval); return; }
      window._updateGPSLiveUI();
    }, 1000);
  };

  window._showGPSResult = function(session) {
    var mins = Math.floor(session.activeSecs / 60);
    var secs = session.activeSecs % 60;

    var mapHtml = '';
    if (session.routePoints && session.routePoints.length > 5) {
      mapHtml = '<div id="gpsResultMap" style="height:220px;border-radius:12px;margin-bottom:12px;overflow:hidden;background:var(--inner-bg-hex)"></div>';
    }

    var splitsHtml = '';
    if (session.splits && session.splits.length > 0) {
      splitsHtml = '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin:12px 0 6px">Splits</p>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">' +
        session.splits.map(function(sp) {
          var sm = Math.floor(sp.splitSecs / 60);
          var ss = Math.round(sp.splitSecs % 60);
          return '<div style="padding:6px;background:var(--inner-bg-hex);border-radius:8px;text-align:center"><p style="font-size:9px;color:var(--text-muted)">km ' + sp.km + '</p><p style="font-size:12px;font-weight:700;color:var(--text-main)">' + sm + ':' + (ss < 10 ? '0' : '') + ss + '</p></div>';
        }).join('') + '</div>';
    }

    var statsGrid = [
      { l: 'Distanz', v: session.distanceKm + ' km', c: 'var(--primary-hex)' },
      { l: 'Zeit', v: mins + ':' + (secs < 10 ? '0' : '') + secs, c: 'var(--text-main)' },
      { l: '\u00d8 Pace', v: session.avgPace, c: '#4ab8d4' },
      { l: 'Kalorien', v: session.kcal + ' kcal', c: '#e8c86a' },
      { l: 'Splits', v: session.splits.length + ' km', c: 'var(--text-muted)' },
      { l: 'Punkte', v: session.pointCount, c: 'var(--text-muted)' }
    ].map(function(s) {
      return '<div style="text-align:center;padding:8px;background:var(--inner-bg-hex);border-radius:9px"><p style="font-size:16px;font-weight:700;color:' + s.c + '">' + s.v + '</p><p style="font-size:8px;color:var(--text-muted)">' + s.l + '</p></div>';
    }).join('');

    var actTitle = session.activityType.charAt(0).toUpperCase() + session.activityType.slice(1);
    window.showModal(
      actTitle + ' abgeschlossen',
      '<div>' + mapHtml + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">' + statsGrid + '</div>' + splitsHtml + '</div>',
      false
    );

    if (session.routePoints && session.routePoints.length > 5) {
      setTimeout(function() { window._initGPSResultMap(session.routePoints); }, 300);
    }
  };

  window._initGPSResultMap = function(points) {
    var mapEl = document.getElementById('gpsResultMap');
    if (!mapEl) return;
    if (!window.L) {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = function() {
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(css);
        setTimeout(function() { window._drawLeafletRoute(mapEl, points); }, 100);
      };
      document.head.appendChild(script);
    } else {
      window._drawLeafletRoute(mapEl, points);
    }
  };

  window._drawLeafletRoute = function(mapEl, points) {
    if (!window.L) return;
    var map = window.L.map(mapEl, { zoomControl: false, attributionControl: false });
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);
    var latlngs = points.map(function(p) { return p; });
    var route = window.L.polyline(latlngs, { color: '#a3c9a8', weight: 4, opacity: 0.9 }).addTo(map);
    var startIcon = window.L.divIcon({ html: '<div style="width:12px;height:12px;border-radius:50%;background:#a3c9a8;border:2px solid white"></div>', iconSize: [12, 12] });
    var endIcon = window.L.divIcon({ html: '<div style="width:12px;height:12px;border-radius:50%;background:#e88a8a;border:2px solid white"></div>', iconSize: [12, 12] });
    window.L.marker(latlngs[0], { icon: startIcon }).addTo(map);
    window.L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map);
    map.fitBounds(route.getBounds(), { padding: [15, 15] });
  };

  // GPS Aktivitaets-Selektion
  window._selectedGPSActivity = 'laufen';
  window._selectGPSActivity = function(type) {
    window._selectedGPSActivity = type;
    document.querySelectorAll('[id^="gpsAct_"]').forEach(function(btn) {
      btn.style.background = 'var(--inner-bg-hex)';
      btn.style.borderColor = 'var(--border-hex)';
      var lbl = btn.querySelector('p:last-child');
      if (lbl) lbl.style.color = 'var(--text-main)';
    });
    var sel = document.getElementById('gpsAct_' + type);
    if (sel) {
      sel.style.background = 'color-mix(in srgb,var(--primary-hex),transparent 90%)';
      sel.style.borderColor = 'color-mix(in srgb,var(--primary-hex),transparent 65%)';
      var lbl2 = sel.querySelector('p:last-child');
      if (lbl2) lbl2.style.color = 'var(--primary-hex)';
    }
  };

  window._confirmStartGPS = function() {
    window.toggleModal('gpsStartModal');
    var title = document.getElementById('gpsActivityTitle');
    var icons = { laufen: '\ud83c\udfc3', radfahren: '\ud83d\udeb4', wandern: '\ud83e\uddb6', schwimmen: '\ud83c\udfca', inline: '\u26f7\ufe0f', andere: '\u26a1' };
    if (title) title.textContent = (icons[window._selectedGPSActivity] || '\ud83d\udccd') + ' ' + window._selectedGPSActivity.charAt(0).toUpperCase() + window._selectedGPSActivity.slice(1);
    setTimeout(function() {
      window._startGPS(window._selectedGPSActivity);
      window._startGPSUIInterval();
    }, 300);
  };

  window.openGPSTracking = function() {
    window.toggleModal('gpsStartModal');
  };

  // ============================================================
  // WORKOUT LIVE-SHARE (Firestore Real-Time)
  // ============================================================
  window._LIVE_SHARE_KEY = 'base_live_share_enabled';

  window._isLiveShareEnabled = function() {
    return localStorage.getItem(window._LIVE_SHARE_KEY) === 'true';
  };

  window._toggleLiveShare = function() {
    var enabled = window._isLiveShareEnabled();
    localStorage.setItem(window._LIVE_SHARE_KEY, enabled ? 'false' : 'true');
    window.showToast(enabled ? 'Live-Share deaktiviert' : 'Live-Share aktiviert — Freunde sehen dein Training');
    var badge = document.getElementById('liveShareBadge');
    if (badge) badge.style.display = enabled ? 'none' : 'inline-flex';
  };

  window._updateLiveShareData = async function(entry, setData) {
    if (!window._isLiveShareEnabled()) return;
    var auth = window._fbAuth;
    if (!auth || !auth.currentUser || !window._fbDb) return;
    try {
      var uid = auth.currentUser.uid;
      var displayName = auth.currentUser.displayName || (window.userProfile || {}).displayName || 'Athlet';
      var ref = window._fbDoc(window._fbDb, 'live_workouts', uid);
      await window._fbSetDoc(ref, {
        uid: uid, displayName: displayName,
        exercise: entry.exercise || '', category: entry.category || 'strength',
        setNumber: setData ? (setData.setNumber || 0) : 0,
        weight: setData ? (setData.weight || 0) : 0,
        reps: setData ? (setData.reps || 0) : 0,
        totalSets: entry.setDetails ? entry.setDetails.length : 0,
        volume: entry.volume || 0,
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        isActive: true
      });
    } catch(e) { console.warn('[LiveShare]', e.message); }
  };

  window._endLiveShare = async function() {
    var auth = window._fbAuth;
    if (!auth || !auth.currentUser || !window._fbDb) return;
    try {
      var ref = window._fbDoc(window._fbDb, 'live_workouts', auth.currentUser.uid);
      await window._fbSetDoc(ref, { isActive: false }, { merge: true });
    } catch(e) {}
  };

  window._liveShareListener = null;

  window._subscribeLiveFeed = function(containerId) {
    var auth = window._fbAuth;
    if (!auth || !auth.currentUser || !window._fbDb || !window._fbOnSnapshot) return;
    var uid = auth.currentUser.uid;
    var now = new Date().toISOString();
    var q = window._fbQuery(
      window._fbCollection(window._fbDb, 'live_workouts'),
      window._fbWhere('isActive', '==', true),
      window._fbWhere('expiresAt', '>', now)
    );
    if (window._liveShareListener) { window._liveShareListener(); window._liveShareListener = null; }
    window._liveShareListener = window._fbOnSnapshot(q, function(snap) {
      var liveUsers = [];
      snap.forEach(function(doc) { var d = doc.data(); if (d.uid !== uid) liveUsers.push(d); });
      window._renderLiveFeed(liveUsers, containerId);
    });
  };

  window._renderLiveFeed = function(liveUsers, containerId) {
    var container = document.getElementById(containerId || 'liveFeedContainer');
    if (!container) return;
    if (liveUsers.length === 0) {
      container.innerHTML = '<p style="font-size:11px;color:var(--text-muted);text-align:center;padding:8px">Gerade trainiert niemand aus deinem Netzwerk</p>';
      return;
    }
    container.innerHTML =
      '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#a3c9a8;margin-bottom:8px">' +
      liveUsers.length + ' trainier' + (liveUsers.length === 1 ? 't' : 'en') + ' gerade</p>' +
      liveUsers.map(function(u) {
        var timeAgo = Math.round((Date.now() - new Date(u.updatedAt)) / 60000);
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(163,201,168,0.06);border:1px solid rgba(163,201,168,0.15);border-radius:10px;margin-bottom:5px">' +
          '<div style="width:8px;height:8px;border-radius:50%;background:#a3c9a8;flex-shrink:0;animation:pulse 2s infinite"></div>' +
          '<div style="flex:1">' +
            '<p style="font-size:12px;font-weight:600;color:var(--text-main)">' + window._escapeHtml(u.displayName) + '</p>' +
            '<p style="font-size:10px;color:var(--text-muted)">' + window._escapeHtml(u.exercise || 'Training') +
              (u.weight > 0 ? ' \u00b7 ' + u.weight + 'kg' : '') +
              (u.setNumber > 0 ? ' \u00b7 Satz ' + u.setNumber : '') + '</p>' +
          '</div>' +
          '<p style="font-size:9px;color:var(--text-muted)">' + (timeAgo < 1 ? 'gerade' : 'vor ' + timeAgo + 'min') + '</p>' +
        '</div>';
      }).join('');
  };

  // ============================================================
  // SQUAD GOALS (Gruppen-Jahresziele)
  // ============================================================
  window._SQUAD_KEY = 'base_squads';

  window._getSquads = function() {
    try { return JSON.parse(localStorage.getItem(window._SQUAD_KEY) || '[]'); }
    catch(e) { return []; }
  };

  window._saveSquads = function(squads) {
    localStorage.setItem(window._SQUAD_KEY, JSON.stringify(squads));
  };

  window._createSquad = async function(squadData) {
    var auth = window._fbAuth;
    if (!auth || !auth.currentUser) { window.showToast('Bitte einloggen', 'error'); return; }
    var db = window._fbDb;
    var uid = auth.currentUser.uid;
    var name = auth.currentUser.displayName || 'Athlet';
    var code = Math.random().toString(36).substr(2, 8).toUpperCase();
    try {
      var ref = await window._fbAddDoc(window._fbCollection(db, 'squads'), {
        name: squadData.name, goal: squadData.goal, metric: squadData.metric || 'workouts',
        target: squadData.target, deadline: squadData.deadline, code: code,
        creatorId: uid,
        members: [{ uid: uid, displayName: name, progress: 0, joinedAt: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      });
      var squads = window._getSquads();
      squads.push({ firestoreId: ref.id, code: code, name: squadData.name, goal: squadData.goal, metric: squadData.metric, target: squadData.target, deadline: squadData.deadline });
      window._saveSquads(squads);
      window.toggleModal('squadCreateModal');
      window.showModal(
        'Squad erstellt!',
        '<div style="text-align:center;padding:16px">' +
          '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Teile diesen Code mit deinen Trainingspartnern:</p>' +
          '<p style="font-size:40px;font-weight:900;letter-spacing:6px;color:var(--primary-hex);margin-bottom:12px">' + code + '</p>' +
          '<button onclick="navigator.share?navigator.share({title:\'BASE Squad: ' + window._escapeHtml(squadData.name) + '\',text:\'Tritt meinem Squad bei! Code: ' + code + ' \u2014 base-app.tech\'}):navigator.clipboard.writeText(\'' + code + '\').then(function(){window.showToast(\'Code kopiert\')})" ' +
            'class="pointer-events-auto" aria-label="Code teilen" ' +
            'style="padding:10px 24px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">Code teilen</button>' +
        '</div>', false
      );
    } catch(e) { window.showToast('Squad-Erstellung fehlgeschlagen', 'error'); }
  };

  window._joinSquad = async function(code) {
    var auth = window._fbAuth;
    if (!auth || !auth.currentUser) { window.showToast('Bitte einloggen', 'error'); return; }
    if (!code || code.trim().length < 4) { window.showToast('Bitte g\u00fcltigen Code eingeben', 'error'); return; }
    var db = window._fbDb;
    var uid = auth.currentUser.uid;
    var name = auth.currentUser.displayName || 'Athlet';
    try {
      var q = window._fbQuery(window._fbCollection(db, 'squads'), window._fbWhere('code', '==', code.toUpperCase()));
      var snap = await window._fbGetDocs(q);
      if (snap.empty) { window.showToast('Squad-Code nicht gefunden', 'error'); return; }
      var squadDoc = snap.docs[0];
      var squadData = squadDoc.data();
      var alreadyMember = (squadData.members || []).some(function(m) { return m.uid === uid; });
      if (alreadyMember) { window.showToast('Du bist bereits in diesem Squad', 'warn'); return; }
      if ((squadData.members || []).length >= 8) { window.showToast('Squad ist voll (max 8 Mitglieder)', 'error'); return; }
      await window._fbUpdateDoc(squadDoc.ref, {
        members: window._fbArrayUnion({ uid: uid, displayName: name, progress: 0, joinedAt: new Date().toISOString() })
      });
      var squads = window._getSquads();
      squads.push({ firestoreId: squadDoc.id, code: squadData.code, name: squadData.name, goal: squadData.goal, metric: squadData.metric, target: squadData.target, deadline: squadData.deadline });
      window._saveSquads(squads);
      window.showToast('Squad beigetreten: ' + squadData.name);
      window._renderSquadDashboard(squadDoc.id);
    } catch(e) { window.showToast('Fehler beim Beitreten', 'error'); }
  };

  window._updateSquadProgress = async function() {
    var auth = window._fbAuth;
    if (!auth || !auth.currentUser || !window._fbDb) return;
    var squads = window._getSquads();
    if (squads.length === 0) return;
    var uid = auth.currentUser.uid;
    var allWorkouts = (window.workouts || []).filter(function(w) { return w.archived; });
    var myWorkoutCount = allWorkouts.length;
    var myVolume = allWorkouts.reduce(function(s, w) { return s + (w.volume || 0); }, 0);
    squads.forEach(async function(squad) {
      if (!squad.firestoreId) return;
      var progress = squad.metric === 'volume' ? myVolume : myWorkoutCount;
      try {
        var ref = window._fbDoc(window._fbDb, 'squads', squad.firestoreId);
        var snap = await window._fbGetDoc(ref);
        if (!snap.exists()) return;
        var data = snap.data();
        var members = (data.members || []).map(function(m) {
          if (m.uid === uid) return { uid: m.uid, displayName: m.displayName, progress: progress, joinedAt: m.joinedAt };
          return m;
        });
        await window._fbUpdateDoc(ref, { members: members });
      } catch(e) {}
    });
  };

  window._renderSquadDashboard = async function(squadId) {
    var auth = window._fbAuth;
    if (!auth || !auth.currentUser || !squadId) return;
    try {
      var snap = await window._fbGetDoc(window._fbDoc(window._fbDb, 'squads', squadId));
      if (!snap.exists()) return;
      var squad = snap.data();
      var members = (squad.members || []).sort(function(a, b) { return (b.progress || 0) - (a.progress || 0); });
      var totalProgress = members.reduce(function(s, m) { return s + (m.progress || 0); }, 0);
      var pct = Math.min(100, Math.round(totalProgress / squad.target * 100));
      var daysLeft = Math.max(0, Math.round((new Date(squad.deadline) - Date.now()) / 86400000));
      var uid = auth.currentUser.uid;
      window.showModal(
        window._escapeHtml(squad.name),
        '<div>' +
          '<div style="text-align:center;padding:14px 0">' +
            '<p style="font-size:36px;font-weight:900;color:var(--primary-hex)">' + pct + '%</p>' +
            '<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">' + totalProgress + ' von ' + squad.target + ' \u00b7 ' + daysLeft + ' Tage verbleibend</p>' +
            '<div style="height:8px;background:var(--border-hex);border-radius:4px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:var(--primary-hex);border-radius:4px;transition:width .5s ease"></div></div>' +
          '</div>' +
          '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin:12px 0 8px">' + members.length + ' Mitglieder</p>' +
          members.map(function(m, idx) {
            var memberPct = Math.min(100, Math.round((m.progress || 0) / (squad.target / members.length) * 100));
            var medal = idx === 0 ? '\ud83e\udd47' : idx === 1 ? '\ud83e\udd48' : idx === 2 ? '\ud83e\udd49' : '';
            var isMe = m.uid === uid;
            return '<div style="margin-bottom:8px">' +
              '<div style="display:flex;justify-content:space-between;margin-bottom:3px">' +
                '<p style="font-size:12px;font-weight:' + (isMe ? '700' : '600') + ';color:' + (isMe ? 'var(--primary-hex)' : 'var(--text-main)') + '">' + medal + ' ' + window._escapeHtml(m.displayName) + (isMe ? ' (Du)' : '') + '</p>' +
                '<p style="font-size:11px;color:var(--text-muted)">' + (m.progress || 0) + '</p>' +
              '</div>' +
              '<div style="height:4px;background:var(--border-hex);border-radius:2px"><div style="height:100%;width:' + memberPct + '%;background:' + (isMe ? 'var(--primary-hex)' : 'var(--text-muted)') + ';border-radius:2px"></div></div>' +
            '</div>';
          }).join('') +
        '</div>', false
      );
    } catch(e) { window.showToast('Squad konnte nicht geladen werden', 'error'); }
  };

  window.openSquads = function() {
    window.toggleModal('squadsModal');
    window._renderSquadList();
  };

  window._renderSquadList = function() {
    var container = document.getElementById('squadsContainer');
    if (!container) return;
    var squads = window._getSquads();
    var html =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">' +
        '<button onclick="window.toggleModal(\'squadCreateModal\')" class="pointer-events-auto" aria-label="Squad erstellen" style="padding:12px;border-radius:11px;font-size:12px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 90%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">+ Squad erstellen</button>' +
        '<button onclick="window._showSquadJoin()" class="pointer-events-auto" aria-label="Squad beitreten" style="padding:12px;border-radius:11px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">Code eingeben</button>' +
      '</div>';
    if (squads.length > 0) {
      html += '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:8px">Deine Squads</p>';
      squads.forEach(function(sq) {
        html += '<div style="padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;margin-bottom:6px;cursor:pointer" class="pointer-events-auto" onclick="window._renderSquadDashboard(\'' + window._escapeHtml(sq.firestoreId || '') + '\')">' +
          '<div style="display:flex;align-items:center;justify-content:space-between">' +
            '<div><p style="font-size:13px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(sq.name || 'Squad') + '</p>' +
            '<p style="font-size:10px;color:var(--text-muted)">' + window._escapeHtml(sq.goal || 'Gemeinsames Ziel') + '</p></div>' +
            '<i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600"></i>' +
          '</div></div>';
      });
    } else {
      html += '<div style="text-align:center;padding:20px"><p style="font-size:32px;margin-bottom:8px">&#127919;</p><p style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:4px">Noch kein Squad</p><p style="font-size:11px;color:var(--text-muted)">Erstelle einen Squad und erreich Ziele gemeinsam</p></div>';
    }
    container.innerHTML = html;
    if (window._refreshLucide) window._refreshLucide();
  };

  window._showSquadJoin = function() {
    window.showModal(
      'Squad beitreten',
      '<div>' +
        '<p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Code eingeben den dein Freund geteilt hat:</p>' +
        '<input id="squadJoinInput" type="text" maxlength="8" placeholder="ABC123XY" class="pointer-events-auto w-full" aria-label="Squad Code" ' +
          'style="padding:12px;border-radius:10px;font-size:20px;font-weight:700;letter-spacing:4px;text-align:center;text-transform:uppercase;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-main);outline:none;-webkit-text-fill-color:var(--text-main);margin-bottom:10px"/>' +
        '<button onclick="window._joinSquad(document.getElementById(\'squadJoinInput\').value);window.closeModal&&window.closeModal()" ' +
          'class="pointer-events-auto w-full" aria-label="Beitreten" ' +
          'style="padding:12px;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">Beitreten</button>' +
      '</div>', false
    );
  };

  window._submitSquadCreate = function() {
    var name = document.getElementById('squadNameInput');
    var goal = document.getElementById('squadGoalInput');
    var target = document.getElementById('squadTargetInput');
    var deadline = document.getElementById('squadDeadlineInput');
    var metricEl = document.querySelector('input[name="squadMetric"]:checked');
    if (!name || !name.value.trim()) { window.showToast('Bitte Squad-Name eingeben', 'error'); return; }
    if (!target || !target.value) { window.showToast('Bitte Zielwert eingeben', 'error'); return; }
    window._createSquad({
      name: name.value.trim(),
      goal: goal ? goal.value.trim() : '',
      target: parseInt(target.value) || 100,
      metric: metricEl ? metricEl.value : 'workouts',
      deadline: deadline && deadline.value ? deadline.value : new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    });
  };

  // ============================================================
  // EINKAUFSLISTEN-EXPORT AUS MEAL PLAN
  // ============================================================
  window._extractShoppingList = async function(mealPlanText) {
    if (!mealPlanText || mealPlanText.length < 100) { window.showToast('Kein Meal Plan vorhanden', 'warn'); return; }
    if (!window.checkOnlineForAI || !window.checkOnlineForAI()) return;

    var prompt = 'Extrahiere alle Zutaten aus diesem Ern\u00e4hrungsplan als Einkaufsliste.\n\nERN\u00c4HRUNGSPLAN:\n' + mealPlanText.slice(0, 3000) + '\n\n' +
      'Antworte NUR als JSON (kein Markdown, keine Erkl\u00e4rung):\n' +
      '{"categories":[{"name":"Fleisch & Fisch","items":[{"name":"H\u00e4hnchenbrust","amount":"600g"}]},{"name":"Gem\u00fcse & Obst","items":[...]},{"name":"H\u00fclsenfr\u00fcchte & Kohlenhydrate","items":[...]},{"name":"Milchprodukte & Eier","items":[...]},{"name":"Gew\u00fcrze & Sonstiges","items":[...]}]}\n\n' +
      'Gleiches Produkt zusammenfassen. Mengen aufaddieren. Deutsche Namen.';

    var btn = document.getElementById('shoppingListBtn');
    if (btn) { btn.textContent = 'Erstelle Liste...'; btn.style.opacity = '0.6'; btn.disabled = true; }

    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function() { controller.abort(); }, 30000);
      var res = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ prompt: prompt, type: 'shopping_list', userId: window._getAiUserId ? window._getAiUserId() : '' })
      });
      clearTimeout(timeoutId);
      if (res.status === 429) { window.showToast('Tageslimit erreicht.', 'error'); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      var text = window._extractGeminiText(data, '{}');
      var clean = text.replace(/```json|```/g, '').trim();
      var parsed;
      try { parsed = JSON.parse(clean); } catch(e) { window.showToast('Liste konnte nicht erstellt werden', 'error'); return; }
      window._showShoppingListModal(parsed);
    } catch(e) {
      if (e.name === 'AbortError') window.showToast('Zeit\u00fcberschreitung', 'error');
      else window.showToast('Fehler beim Erstellen', 'error');
    } finally {
      if (btn) { btn.textContent = 'Einkaufsliste'; btn.style.opacity = '1'; btn.disabled = false; }
    }
  };

  window._showShoppingListModal = function(listData) {
    var categories = listData.categories || [];
    var totalItems = categories.reduce(function(s, c) { return s + (c.items || []).length; }, 0);
    var html = '<p style="font-size:11px;color:var(--text-muted);margin-bottom:12px">' + totalItems + ' Artikel in ' + categories.length + ' Kategorien</p>';
    categories.forEach(function(cat, catIdx) {
      if (!cat.items || cat.items.length === 0) return;
      html += '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--primary-hex);margin:10px 0 6px">' + window._escapeHtml(cat.name) + '</p>';
      cat.items.forEach(function(item, itemIdx) {
        var id = 'shp_' + catIdx + '_' + itemIdx;
        html += '<label class="pointer-events-auto" style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:9px;cursor:pointer;margin-bottom:3px;background:var(--inner-bg-hex)">' +
          '<input type="checkbox" id="' + id + '" class="pointer-events-auto" style="width:16px;height:16px;flex-shrink:0;accent-color:var(--primary-hex)" onchange="this.closest(\'label\').style.opacity=this.checked?\'0.4\':\'1\'"/>' +
          '<span style="flex:1;font-size:12px;color:var(--text-main)">' + window._escapeHtml(item.name) + '</span>' +
          '<span style="font-size:11px;color:var(--text-muted);flex-shrink:0">' + window._escapeHtml(item.amount || '') + '</span>' +
        '</label>';
      });
    });
    html += '<div style="display:flex;gap:8px;margin-top:14px">' +
      '<button onclick="window._copyShoppingList()" class="pointer-events-auto" aria-label="Liste kopieren" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">Kopieren</button>' +
      '<button onclick="window._shareShoppingList()" class="pointer-events-auto" aria-label="Liste teilen" style="flex:1;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">Teilen</button>' +
    '</div>';
    window._lastShoppingList = listData;
    window.showModal('Einkaufsliste', '<div style="max-height:65vh;overflow-y:auto">' + html + '</div>', false);
  };

  window._copyShoppingList = function() {
    var listData = window._lastShoppingList;
    if (!listData) return;
    var text = 'EINKAUFSLISTE\n\n';
    (listData.categories || []).forEach(function(cat) {
      if (!cat.items || cat.items.length === 0) return;
      text += cat.name.toUpperCase() + '\n';
      cat.items.forEach(function(item) { text += '\u2610 ' + item.name + (item.amount ? ' \u2014 ' + item.amount : '') + '\n'; });
      text += '\n';
    });
    text += 'Erstellt mit BASE App';
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function() { window.showToast('Liste kopiert!'); });
  };

  window._shareShoppingList = function() {
    var listData = window._lastShoppingList;
    if (!listData) return;
    var text = 'EINKAUFSLISTE\n\n';
    (listData.categories || []).forEach(function(cat) {
      if (!cat.items || cat.items.length === 0) return;
      text += cat.name.toUpperCase() + '\n';
      cat.items.forEach(function(item) { text += '\u2610 ' + item.name + (item.amount ? ' \u2014 ' + item.amount : '') + '\n'; });
      text += '\n';
    });
    text += 'Erstellt mit BASE App';
    if (navigator.share) navigator.share({ title: 'Einkaufsliste', text: text });
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function() { window.showToast('Liste kopiert!'); });
  };

  window._openShoppingListFromMealPlan = function() {
    try {
      var stored = JSON.parse(localStorage.getItem('base_user_meal_plan') || 'null');
      if (stored && stored.plan) window._extractShoppingList(stored.plan);
      else window.showToast('Erstelle zuerst einen Ern\u00e4hrungsplan', 'warn');
    } catch(e) { window.showToast('Kein Plan gefunden', 'warn'); }
  };

  // ============================================================
  // SUPPLEMENT AFFILIATE SYSTEM
  // Liest Produkte aus window._AFFILIATE_CONFIG (affiliate-config.js)
  // ============================================================
  window._renderAffiliateProducts = function(supplementKey, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var config = window._AFFILIATE_CONFIG;
    if (!config || !config.products) { container.style.display = 'none'; return; }
    var products = Object.values(config.products).filter(function(p) { return p.supplement === supplementKey; });
    if (products.length === 0) { container.style.display = 'none'; return; }

    var html = '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:8px">Produkte kaufen</p>';
    products.forEach(function(p) {
      html += '<a href="' + window._escapeHtml(p.url) + '" target="_blank" rel="noopener noreferrer" ' +
        'onclick="window._trackAffiliateClick(\'' + window._escapeHtml(supplementKey) + '\',\'' + window._escapeHtml(p.name).replace(/'/g, "\\'") + '\')" ' +
        'class="pointer-events-auto" ' +
        'style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:11px;margin-bottom:5px;text-decoration:none;cursor:pointer">' +
        '<div style="flex:1">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">' +
            '<p style="font-size:11px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(p.name) + '</p>' +
            (p.badge ? '<span style="font-size:8px;font-weight:700;padding:1px 6px;border-radius:4px;background:' + (p.badgeColor || 'var(--primary-hex)') + '22;color:' + (p.badgeColor || 'var(--primary-hex)') + '">' + window._escapeHtml(p.badge) + '</span>' : '') +
          '</div>' +
          '<p style="font-size:10px;color:var(--text-muted)">' + window._escapeHtml(p.logo) + ' \u00b7 ' + window._escapeHtml(p.size) + '</p>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
          (p.price ? '<p style="font-size:13px;font-weight:700;color:var(--primary-hex)">' + window._escapeHtml(p.price) + '</p>' : '') +
          '<p style="font-size:9px;color:var(--text-muted)">\u2192 Shop</p>' +
        '</div>' +
      '</a>';
    });
    html += '<p style="font-size:8px;color:var(--text-muted);margin-top:4px;line-height:1.5">' + window._escapeHtml(config.disclosure) + '</p>';
    container.innerHTML = html;
    container.style.display = 'block';
  };

  window._trackAffiliateClick = function(supplement, productName) {
    var clicks = JSON.parse(localStorage.getItem('base_affiliate_clicks') || '[]');
    clicks.push({ supplement: supplement, product: productName, date: new Date().toISOString() });
    clicks = clicks.slice(-100);
    localStorage.setItem('base_affiliate_clicks', JSON.stringify(clicks));
  };

  // ============================================================
  // SUPPLEMENT SHOP (Full-Page Modal via showModal)
  // ============================================================
  window.openSuppShop = function() {
    var config = window._AFFILIATE_CONFIG;
    if (!config || !config.products) { window.showToast('Supplement-Daten werden geladen...', 'warn'); return; }
    var existing = document.getElementById('suppShopOverlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'suppShopOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:900;background:var(--bg-hex);display:flex;flex-direction:column;overflow:hidden';
    var bySupp = {};
    Object.values(config.products).forEach(function(p) {
      if (!bySupp[p.supplement]) bySupp[p.supplement] = [];
      bySupp[p.supplement].push(p);
    });
    var suppLabels = { kreatin: '\uD83D\uDCAA Kreatin', protein: '\uD83E\uDD5B Protein', koffein: '\u2615 Pre-Workout', vitaminD: '\u2600\uFE0F Vitamin D3', omega3: '\uD83D\uDC1F Omega-3', magnesium: '\uD83C\uDF19 Magnesium', zink: '\u26A1 Zink', ashwagandha: '\uD83C\uDF3F Ashwagandha' };
    var productsHtml = '';
    Object.keys(bySupp).forEach(function(suppKey) {
      var products = bySupp[suppKey];
      productsHtml += '<p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--primary-hex);margin:16px 0 8px">' + (suppLabels[suppKey] || suppKey) + '</p>';
      products.forEach(function(p) {
        productsHtml += '<a href="' + window._escapeHtml(p.url) + '" target="_blank" rel="noopener noreferrer" class="pointer-events-auto" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;margin-bottom:6px;text-decoration:none">' +
          '<div style="flex:1"><p style="font-size:13px;font-weight:700;color:var(--text-main);margin-bottom:4px">' + window._escapeHtml(p.name) + '</p>' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
            '<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:5px;background:rgba(212,175,55,0.15);color:#d4af37">' + p.tier + '-Tier</span>' +
            '<span style="font-size:10px;color:var(--text-muted)">' + window._escapeHtml(p.size || '') + '</span>' +
            (p.badge ? '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;background:' + (p.badgeColor || '#a3c9a8') + '22;color:' + (p.badgeColor || '#a3c9a8') + '">' + window._escapeHtml(p.badge) + '</span>' : '') +
          '</div></div>' +
          '<div style="flex-shrink:0;text-align:right"><p style="font-size:12px;font-weight:700;color:var(--primary-hex)">Kaufen \u2192</p><p style="font-size:10px;color:var(--text-muted)">Amazon</p></div></a>';
      });
    });
    overlay.innerHTML =
      '<div style="flex-shrink:0;padding:14px 16px;border-bottom:1px solid var(--border-hex);display:flex;align-items:center;justify-content:space-between;background:var(--bg-hex);position:sticky;top:0;z-index:10">' +
        '<div><p style="font-size:17px;font-weight:700;color:var(--text-main)">\uD83D\uDED2 Supplement Shop</p>' +
        '<p style="font-size:10px;color:var(--text-muted);margin-top:2px">Nur evidenzbasierte S/A/B-Tier Supplements</p></div>' +
        '<button onclick="document.getElementById(\'suppShopOverlay\').remove()" class="pointer-events-auto" aria-label="Schliessen" style="width:36px;height:36px;border-radius:10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">\u00d7</button>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:0 16px 40px;-webkit-overflow-scrolling:touch">' +
        productsHtml +
        '<p style="font-size:9px;color:var(--text-muted);text-align:center;margin-top:16px;line-height:1.5;padding:10px;background:var(--inner-bg-hex);border-radius:8px">* Affiliate-Links: Bei Kauf erhalten wir eine kleine Provision. Beeinflusst unsere Empfehlungen nicht.</p>' +
      '</div>';
    document.body.appendChild(overlay);
  };

  // ============================================================
  // KI TOOLS — COLLAPSIBLE KATEGORIEN
  // ============================================================
  window._toggleKICategory = function(catId) {
    var content = document.getElementById('kiCat_' + catId);
    var arrow = document.getElementById('kiArrow_' + catId);
    if (!content || !arrow) return;
    var isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : 'block';
    arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  };

  // ============================================================
  // ANALYSE TAB — LEERE WIDGETS AUSBLENDEN
  // ============================================================
  window._hideEmptyWidget = function(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    setTimeout(function() {
      var txt = (el.textContent || '').trim();
      var html = el.innerHTML.trim();
      var isEmpty =
        html === '' ||
        txt === 'Lade...' ||
        txt === 'Wird geladen...' ||
        txt === 'Berechne...' ||
        html.indexOf('Noch keine Daten') !== -1 ||
        html.indexOf('Keine Eintr\u00e4ge') !== -1 ||
        html.indexOf('0 Workouts') !== -1 ||
        (el.children.length === 1 && el.children[0].textContent.trim().length < 20) ||
        txt.length < 15;
      var wrapper = el.closest('[data-widget-wrapper]') || el;
      if (isEmpty) {
        wrapper.style.display = 'none';
        wrapper.dataset.hiddenEmpty = 'true';
      } else {
        wrapper.style.display = '';
        wrapper.dataset.hiddenEmpty = '';
      }
    }, 300);
  };

  // Apply data-widget-wrapper to known lazy containers
  (function() {
    var lazyContainers = [
      'recoveryHistoryContainer', 'friendsCompareContainer',
      'plateauContainer', 'benchmarkContainer',
      'weightWidgetContainer', 'journalContainer',
      'baseScoreContainer', 'bioAgeContainer'
    ];
    setTimeout(function() {
      lazyContainers.forEach(function(id) {
        var el = document.getElementById(id);
        if (el && !el.closest('[data-widget-wrapper]')) {
          var parent = el.parentElement;
          if (parent && parent.style && parent.style.padding) {
            parent.setAttribute('data-widget-wrapper', '');
          } else {
            el.setAttribute('data-widget-wrapper', '');
          }
        }
      });
    }, 100);
  })();

  // ============================================================
  // TRANSPARENZ — ALGORITHMUS-OFFENLEGUNG
  // ============================================================
  window._TRANSPARENCY_DATA = {

    battery: {
      title: '\u26A1 Battery Score',
      subtitle: 'Deine t\u00e4gliche Trainingsbereitschaft',
      formula: 'Score = 100 \u2212 (Trainingsbelastung \u00d7 Gewichtungsfaktoren)',
      factors: [
        { label: 'Trainingsvolumen letzte 7 Tage', weight: '40%', source: 'Deine gespeicherten Workouts' },
        { label: 'Schlaf-Durchschnitt (Habits)', weight: '25%', source: 'Habit-Tracking \u2192 Schlaf' },
        { label: 'Workout-Feedback (Rating)', weight: '20%', source: 'Bewertung nach Training' },
        { label: 'Muskel-Soreness', weight: '15%', source: 'Pump & Soreness Tracking' }
      ],
      science: 'Kellmann 2018: Recovery-Monitoring im Leistungssport. ACWR (Acute:Chronic Workload Ratio) nach Gabbett 2016.',
      note: 'Kein medizinisches Tool. Orientierungswert f\u00fcr Trainingssteuerung.'
    },

    baseScore: {
      title: '\uD83C\uDFC6 BASE Score',
      subtitle: 'Dein Gesamtfitness-Index (0\u20131000)',
      formula: 'Score = Frequenz + Volumen + Recovery + Ern\u00e4hrung + Habits',
      factors: [
        { label: 'Trainingsfrequenz (letzte 4 Wochen)', weight: '250 Pkt', source: 'Workout-Archiv' },
        { label: 'Volumen-Trend (Woche zu Woche)', weight: '250 Pkt', source: 'Gespeicherte Sets \u00d7 Gewicht' },
        { label: 'Recovery Score (Battery)', weight: '200 Pkt', source: 'ZNS/Battery Berechnung' },
        { label: 'Ern\u00e4hrungs-Compliance', weight: '150 Pkt', source: 'Ern\u00e4hrungs-Setup + Food Log' },
        { label: 'Habit-Konsistenz', weight: '150 Pkt', source: 'Habit-Tracking letzte 7 Tage' }
      ],
      science: 'Composite Fitness Index nach ACSM Health-Related Fitness. Gewichtung basiert auf Adherence-Forschung (Sperandei 2016).',
      note: 'T\u00e4glich aktualisiert. Vergleich nur mit dir selbst sinnvoll.'
    },

    bioAge: {
      title: '\uD83E\uDDEC Biologisches Alter',
      subtitle: 'Sch\u00e4tzung aus bis zu 12 Datenpunkten',
      formula: 'Bio-Alter = Chrono-Alter + gewichteter Delta aus allen Faktoren',
      factors: [
        { label: 'Muskelkraft (1RM/K\u00f6rpergewicht)', weight: '16%', source: '1RM Tabelle oder Workout-Maximum' },
        { label: 'Kardiovaskul\u00e4re Fitness (VO2max)', weight: '15%', source: 'Cardio-Daten: HR + Pace' },
        { label: 'Erholungsf\u00e4higkeit', weight: '12%', source: 'Recovery History (14 Tage)' },
        { label: 'Schlafqualit\u00e4t', weight: '13%', source: 'Habit-Tracking \u2192 Schlaf' },
        { label: 'Trainings-Konsistenz', weight: '12%', source: 'Workout-Frequenz + Dauer' },
        { label: 'K\u00f6rperzusammensetzung', weight: '10%', source: 'Gewicht + Gr\u00f6\u00dfe (BMI)' },
        { label: 'Mobilit\u00e4t', weight: '8%', source: 'Mobility-Workouts/Woche' },
        { label: 'Hydration', weight: '5%', source: 'Wasser-Habit oder Water Tracker' },
        { label: 'Mentale Gesundheit', weight: '5%', source: 'Mood-Habit (1\u201310)' },
        { label: 'Entz\u00fcndungsstatus', weight: '10%', source: 'Blutwerte: CRP + Omega-3 Index' },
        { label: 'N\u00e4hrstoffstatus', weight: '7%', source: 'Blutwerte: Vitamin D, Ferritin, B12' },
        { label: 'Hormonstatus', weight: '7%', source: 'Blutwerte: Testosteron, Cortisol' }
      ],
      science: 'Levine et al. 2018 (PhenoAge), Rantanen 1999 (Kraft/Mortalit\u00e4t), Walker 2017 (Schlaf), Franceschi 2018 (Inflammaging).',
      note: '\u2695\uFE0F KEINE medizinische Diagnose. Sch\u00e4tzung aus verf\u00fcgbaren Daten. Faktoren ohne Daten werden nicht einberechnet. Arzt aufsuchen f\u00fcr klinische Einsch\u00e4tzung.'
    },

    readiness: {
      title: '\uD83D\uDFE2 Readiness Score',
      subtitle: 'Kurzfristige Erholungsbereitschaft',
      formula: 'Score = Battery \u2212 Muskelbelastung der letzten 72h',
      factors: [
        { label: 'Intensit\u00e4t letzter Workouts', weight: 'Hoch', source: 'Gewicht \u00d7 Sets \u00d7 RIR-Multiplikator' },
        { label: 'Stunden seit letztem Training', weight: 'Mittel', source: 'Workout-Zeitstempel' },
        { label: 'Schlaf letzte Nacht', weight: 'Mittel', source: 'Habit \u2192 Schlafstunden' },
        { label: 'Subjektives Feedback', weight: 'Niedrig', source: 'Post-Workout Rating' }
      ],
      science: 'Gabbett 2016: ACWR als Verletzungspr\u00e4ventions-Tool. Meeusen 2013: Overtraining Syndrome Pr\u00e4vention.',
      note: 'Aktualisiert nach jedem gespeicherten Workout.'
    },

    kiCoach: {
      title: '\uD83E\uDD16 KI Coach',
      subtitle: 'Was der Coach \u00fcber dich wei\u00df',
      formula: 'Kontext = Profil + Workouts + Habits + Ern\u00e4hrung + Verletzungen',
      factors: [
        { label: 'Athleten-Profil', weight: '\u2014', source: 'Einstellungen \u2192 Profil' },
        { label: 'Letzte 20 Workouts', weight: '\u2014', source: 'Workout-Archiv' },
        { label: 'Habit-Daten (7 Tage)', weight: '\u2014', source: 'Habit-Tracker' },
        { label: 'Ern\u00e4hrungs-Ziele', weight: '\u2014', source: 'Nutrition Setup' },
        { label: 'Verletzungen/Einschr.', weight: '\u2014', source: 'Profil \u2192 Verletzungen' },
        { label: 'Blutwerte (wenn vorhanden)', weight: '\u2014', source: 'Blut-Tab im Ern\u00e4hrungs-Bereich' },
        { label: 'Coach-Ged\u00e4chtnis', weight: '\u2014', source: 'Gespeicherte Chat-Inhalte (lokal)' }
      ],
      science: 'Kontext-basiertes Prompting via Gemini 2.5 Flash. Wissenschaftliche Grundlage: ACSM, Schoenfeld 2017, Morton 2018.',
      note: 'Der Coach hat keinen Zugriff auf das Internet. Alle Daten bleiben auf deinem Ger\u00e4t. Keine Weitergabe an Dritte.'
    },

    calories: {
      title: '\uD83D\uDD25 Kalorienberechnung',
      subtitle: 'Dein t\u00e4glicher Energiebedarf',
      formula: 'Ziel = BMR \u00d7 PAL-Faktor + Ziel-Anpassung + Sport-Bonus',
      factors: [
        { label: 'BMR (Grundumsatz)', weight: 'Basis', source: 'Mifflin-St Jeor 2005: 10\u00d7Gewicht + 6.25\u00d7Gr\u00f6\u00dfe \u2212 5\u00d7Alter \u00b1 5' },
        { label: 'PAL-Faktor (Aktivit\u00e4t)', weight: '\u00d71.2\u20131.9', source: 'Aktivit\u00e4tslevel in deinem Profil' },
        { label: 'Ziel-Anpassung', weight: '\u00b1300\u2013500 kcal', source: 'Trainingsziel (Abnehmen/Aufbauen)' },
        { label: 'Sport-Bonus', weight: '+0\u2013400 kcal', source: 'Erkannte Sportart aus Workouts' },
        { label: 'Ern\u00e4hrungsform', weight: 'Makro-Verteilung', source: 'Gew\u00e4hlte Di\u00e4tform (Keto, High Protein etc.)' }
      ],
      science: 'Mifflin-St Jeor 2005 (pr\u00e4ziseste Formel f\u00fcr Normalgewichtige). PAL-Faktoren nach DGE 2015. Protein-Berechnung nach Morton 2018.',
      note: 'Sch\u00e4tzung \u00b1200\u2013300 kcal. F\u00fcr klinische Ern\u00e4hrungsberatung Ern\u00e4hrungsberater aufsuchen.'
    },

    efficiency: {
      title: '\u26A1 Trainings-Effizienz Score',
      subtitle: 'Wie effektiv war dein heutiges Training',
      formula: 'Score = Volumen + Vielfalt + RIR-Tracking + Ziel-Passung',
      factors: [
        { label: 'Volumen vs. Readiness', weight: '25 Pkt', source: 'Heutige Sets vs. erwartete Sets' },
        { label: '\u00dcbungsvielfalt', weight: '25 Pkt', source: 'Anzahl unterschiedlicher \u00dcbungen' },
        { label: 'RIR-Konsistenz', weight: '25 Pkt', source: 'Anteil S\u00e4tze mit RIR-Eintrag' },
        { label: 'Ziel-Passung', weight: '25 Pkt', source: '\u00dcbungstypen vs. Trainingsziel' }
      ],
      science: 'Krieger 2010: Volumen-Response Kurve. Zourdos 2016: RPE/RIR als Intensit\u00e4ts-Marker.',
      note: 'Wird nach jedem abgeschlossenen Training berechnet.'
    }
  };

  // ============================================================
  // TRANSPARENZ — INFO-MODAL RENDERER
  // ============================================================
  window._showTransparency = function(key) {
    var data = window._TRANSPARENCY_DATA[key];
    if (!data) return;

    var factorsHtml = data.factors.map(function(f) {
      return '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-hex)">' +
        '<div style="flex:1">' +
          '<p style="font-size:12px;font-weight:600;color:var(--text-main)">' + window._escapeHtml(f.label) + '</p>' +
          '<p style="font-size:10px;color:var(--text-muted);margin-top:2px">\uD83D\uDCC2 ' + window._escapeHtml(f.source) + '</p>' +
        '</div>' +
        '<span style="font-size:10px;font-weight:700;color:var(--primary-hex);flex-shrink:0;padding:2px 8px;border-radius:6px;background:color-mix(in srgb,var(--primary-hex),transparent 90%)">' + window._escapeHtml(f.weight) + '</span>' +
      '</div>';
    }).join('');

    window.showModal(
      data.title,
      '<div>' +
        '<p style="font-size:11px;color:var(--text-muted);margin-bottom:12px">' + window._escapeHtml(data.subtitle) + '</p>' +
        '<div style="padding:10px 12px;background:rgba(163,201,168,0.06);border:1px solid rgba(163,201,168,0.15);border-radius:10px;margin-bottom:14px">' +
          '<p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--primary-hex);margin-bottom:4px">Formel</p>' +
          '<p style="font-size:11px;color:var(--text-main);font-family:monospace">' + window._escapeHtml(data.formula) + '</p>' +
        '</div>' +
        '<p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:8px">Verwendete Daten</p>' +
        factorsHtml +
        '<div style="margin-top:12px;padding:10px 12px;background:rgba(138,175,232,0.06);border:1px solid rgba(138,175,232,0.15);border-radius:10px">' +
          '<p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#8aafe8;margin-bottom:4px">Wissenschaftliche Basis</p>' +
          '<p style="font-size:10px;color:var(--text-muted);line-height:1.6">' + window._escapeHtml(data.science) + '</p>' +
        '</div>' +
        (data.note ? '<p style="font-size:10px;color:var(--text-muted);margin-top:10px;padding:8px 10px;background:var(--inner-bg-hex);border-radius:8px;line-height:1.5">\u2139\uFE0F ' + window._escapeHtml(data.note) + '</p>' : '') +
      '</div>',
      false
    );
  };

  window._ti = window._showTransparency;

  // ============================================================
  // TRANSPARENZ — SEITE RENDERER
  // ============================================================
  window.openTransparencyPage = function() {
    window.toggleModal('transparencyModal');
    var list = document.getElementById('transparencyList');
    if (!list) return;
    var items = Object.keys(window._TRANSPARENCY_DATA || {});
    list.innerHTML = items.map(function(key) {
      var d = window._TRANSPARENCY_DATA[key];
      return '<button onclick="window._ti(\'' + key + '\')" ' +
        'class="pointer-events-auto w-full" aria-label="' + window._escapeHtml(d.title) + ' Details" ' +
        'style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;margin-bottom:6px;cursor:pointer;text-align:left">' +
        '<span style="font-size:22px;flex-shrink:0">' + d.title.split(' ')[0] + '</span>' +
        '<div style="flex:1">' +
          '<p style="font-size:13px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(d.title.split(' ').slice(1).join(' ')) + '</p>' +
          '<p style="font-size:10px;color:var(--text-muted)">' + d.factors.length + ' Faktoren \u00b7 ' + window._escapeHtml(d.subtitle) + '</p>' +
        '</div>' +
        '<span style="font-size:11px;color:var(--primary-hex)">Details \u2192</span>' +
      '</button>';
    }).join('');
  };

  // ============================================================
  // TRAININGS-DNA ANALYSE
  // ============================================================

  window._generateDNAReport = async function() {
    var workouts = (window.workouts || []).filter(function(w) { return w.archived; });
    if (workouts.length < 20) {
      window.showToast('F\u00fcr die DNA-Analyse ben\u00f6tige ich noch ' + (20 - workouts.length) + ' weitere Workouts.');
      return;
    }

    window.showToast('\uD83E\uDDEC Analysiere dein Trainings-DNA...');
    window._openKiChat && window._openKiChat();
    setTimeout(function() {
      if (typeof _addChatMessage === 'function') {
        _addChatMessage('ai', '\uD83E\uDDEC **Trainings-DNA Analyse l\u00e4uft...**\n\nIch analysiere ' + workouts.length + ' Workouts nach Mustern. Einen Moment...');
      }
    }, 400);

    var dayCount = {};
    var dayNames = ['So','Mo','Di','Mi','Do','Fr','Sa'];
    var exerciseCount = {};
    var categoryCount = {strength:0, cardio:0, recovery:0, main:0};
    var monthlyVolume = {};

    workouts.forEach(function(w) {
      var d = new Date(w.date);
      var day = dayNames[d.getDay()];
      dayCount[day] = (dayCount[day]||0) + 1;
      if (w.category) categoryCount[w.category] = (categoryCount[w.category]||0) + 1;
      if (w.exercise) exerciseCount[w.exercise] = (exerciseCount[w.exercise]||0) + 1;
      var month = w.date.substring(0,7);
      if (!monthlyVolume[month]) monthlyVolume[month] = 0;
      if (w.volume) monthlyVolume[month] += w.volume;
    });

    var bestDay = Object.keys(dayCount).sort(function(a,b){ return dayCount[b]-dayCount[a]; })[0];
    var topEx = Object.keys(exerciseCount).sort(function(a,b){ return exerciseCount[b]-exerciseCount[a]; }).slice(0,5);
    var mainCat = Object.keys(categoryCount).sort(function(a,b){ return categoryCount[b]-categoryCount[a]; })[0];
    var weeks = Math.ceil(workouts.length / 3.5);
    var freq = (workouts.length / Math.max(weeks, 1)).toFixed(1);

    var summary = 'Analysiere ' + workouts.length + ' Workouts:\n' +
      'H\u00e4ufigster Trainingstag: ' + bestDay + ' (' + (dayCount[bestDay]||0) + 'x)\n' +
      'Hauptkategorie: ' + mainCat + '\n' +
      'Top-\u00dcbungen: ' + topEx.join(', ') + '\n' +
      'Durchschnittliche Frequenz: ' + freq + ' Einheiten/Woche\n' +
      'Gesamtworkouts: ' + workouts.length;

    try {
      var profile = window.userProfile || {};
      var prompt = 'Du bist Jarvis, ein KI Fitness-Coach. Analysiere diese Trainingsdaten und erstelle ein pr\u00e4gnantes "Trainings-DNA Profil".\n\n' +
        summary + '\n\n' +
        'Profil: ' + (profile.age||'?') + 'J, ' + (profile.experience||'?') + ', Ziel: ' + (profile.goal||'allgemeine Fitness') + '\n\n' +
        'Erstelle ein DNA-Profil mit:\n' +
        '1. Athleten-Typ (1 Satz)\n' +
        '2. St\u00e4rken (2-3 Punkte)\n' +
        '3. Blinde Flecken (1-2 Punkte)\n' +
        '4. Kern-Empfehlung (1 Satz)\n\n' +
        'Stil: direkt, pers\u00f6nlich, motivierend. Kein Essay. Markdown erlaubt.';

      var res = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: prompt, systemPrompt: 'Du bist Jarvis, Fitness-Coach.', userId: window._getAiUserId ? window._getAiUserId() : 'anon' })
      });
      var data = await res.json();
      var reply = window._extractGeminiText(data, 'Analyse nicht m\u00f6glich.');

      if (typeof _addChatMessage === 'function') {
        _addChatMessage('ai', '\uD83E\uDDEC **Dein Trainings-DNA Profil**\n\n' + reply);
      }
      if (window._jarvisSpeak) window._jarvisSpeak('Dein Trainings-DNA Profil ist fertig. Schau in den Chat.');

    } catch(e) {
      if (typeof _addChatMessage === 'function') {
        _addChatMessage('ai', 'DNA-Analyse konnte nicht abgeschlossen werden. Versuch es sp\u00e4ter.');
      }
    }
  };

  // ============================================================
  // JARVIS INTENT ENGINE
  // ============================================================

  window._JARVIS_INTENTS = {
    navigate_training: {
      patterns: ['training starten','training \u00f6ffnen','trainieren','zum training','workout starten','start training','open training','let\'s train','lass uns loslegen','ich will trainieren','leg los','starten wir','let\'s go','loslegen'],
      action: function() { window.switchTab && window.switchTab('training'); return 'Ich \u00f6ffne deinen Training-Tab. Los geht\u2019s! \uD83D\uDCAA'; }
    },
    navigate_analyse: {
      patterns: ['analyse','\u00f6ffne analyse','analytics','statistiken','stats','meine daten','charts','diagramme','fortschritt','progress','show stats','show analytics','wie war meine woche','wie lief es','mein fortschritt','zeig mir meine zahlen','was hab ich diese woche','meine statistiken'],
      action: function() { window.switchTab && window.switchTab('analyse'); return 'Hier sind deine Statistiken und Fortschritte.'; }
    },
    navigate_nutrition: {
      patterns: ['ern\u00e4hrung','nutrition','was essen','ern\u00e4hrungs-tab','open nutrition'],
      action: function() { window.switchTab && window.switchTab('nutrition'); return 'Ich \u00f6ffne deinen Ern\u00e4hrungs-Tab.'; }
    },
    navigate_tools: {
      patterns: ['ki tools','tools','werkzeuge','ki features','ai tools','open tools'],
      action: function() { window.switchTab && window.switchTab('tools'); return 'Hier sind alle KI-Werkzeuge.'; }
    },
    open_planner: {
      patterns: ['trainingsplan','plan erstellen','plan generieren','neuer plan','create plan','generate plan','erstell mir einen plan','ich brauche einen plan','planner \u00f6ffnen','open planner'],
      action: function() {
        setTimeout(function() { window._openKiChat && window._openKiChat(); setTimeout(function() { if (typeof _addChatMessage === 'function') _addChatMessage('ai', 'Ich erstelle dir jetzt einen personalisierten Trainingsplan! Um ihn perfekt auf dich abzustimmen, habe ich ein paar Fragen:\n\n**1.** Was ist dein Hauptziel? (Muskelaufbau, Abnehmen, Kraft, Ausdauer)\n**2.** Wie viele Tage pro Woche kannst du trainieren?\n**3.** Wie lange hast du Zeit pro Einheit? (z.B. 45 Min, 60 Min, 90 Min)\n**4.** Welches Equipment hast du? (Gym, Hanteln, K\u00f6rpergewicht)\n\nBeantworte einfach alle Fragen und ich generiere deinen Plan! \uD83D\uDCAA'); }, 400); }, 200);
        return null;
      }
    },
    open_bioage: {
      patterns: ['bio age','biologisches alter','bio-alter','wie alt bin ich biologisch','mein biologisches alter','open bio age','show bio age'],
      action: function() {
        setTimeout(function() { window._openKiChat && window._openKiChat(); setTimeout(function() { if (typeof _addChatMessage === 'function') _addChatMessage('ai', 'Dein **Biologisches Alter** wird aus bis zu 12 Faktoren berechnet:\n\n\uD83D\uDCAA Muskelkraft \u00b7 \u2764\uFE0F Cardio-Fitness \u00b7 \uD83D\uDE34 Schlaf \u00b7 \uD83C\uDFC3 Konsistenz\n\nF\u00fcr eine genaue Berechnung \u00f6ffne ich jetzt das Bio-Age Modul.'); setTimeout(function() { window.openBioAgeModal && window.openBioAgeModal(); }, 1500); }, 400); }, 200);
        return null;
      }
    },
    open_battery: {
      patterns: ['battery','zns','readiness','bereit','wie fit bin ich','energielevel','energie heute','battery score','show battery'],
      action: function() {
        setTimeout(function() { window._openKiChat && window._openKiChat(); setTimeout(function() {
          var score = window._lastReadinessScore || (window._calculateReadiness ? (function() { try { return window._calculateReadiness().score; } catch(e) { return null; } })() : null) || '\u2014';
          var msg = 'Dein aktueller **Battery Score: ' + score + '/100**\n\n';
          if (typeof score === 'number' && score >= 80) msg += '\uD83D\uDFE2 Du bist top erholt \u2014 perfekt f\u00fcr ein intensives Training heute!\n\n';
          else if (typeof score === 'number' && score >= 50) msg += '\uD83D\uDFE1 Moderate Erholung \u2014 mittlere Intensit\u00e4t empfohlen.\n\n';
          else if (typeof score === 'number') msg += '\uD83D\uDD34 Dein K\u00f6rper braucht mehr Erholung. Leichtes Training oder Rest Day.\n\n';
          msg += 'Willst du mehr Details oder eine Trainingsempfehlung f\u00fcr heute?';
          if (typeof _addChatMessage === 'function') _addChatMessage('ai', msg);
        }, 400); }, 200);
        return null;
      }
    },
    open_competition: {
      patterns: ['wettkampf','competition','wettkampf-coach','wettkampfplan','ich habe einen wettkampf','open competition'],
      action: function() { setTimeout(function() { window.openCompetitionCoach && window.openCompetitionCoach(); }, 500); return 'Ich \u00f6ffne den Wettkampf-Coach.'; }
    },
    open_whatif: {
      patterns: ['was w\u00e4re wenn','what if','szenario','scenario planner','was passiert wenn','open what if'],
      action: function() { setTimeout(function() { window.openWhatIfPlanner && window.openWhatIfPlanner(); }, 500); return 'Lass uns verschiedene Trainingsszenarien durchspielen.'; }
    },
    open_supplements: {
      patterns: ['supplement','supplements','nahrungserg\u00e4nzung','kreatin','protein kaufen','supplement shop','supplement check'],
      action: function() {
        setTimeout(function() { window._openKiChat && window._openKiChat(); setTimeout(function() { if (typeof _addChatMessage === 'function') _addChatMessage('ai', '\uD83D\uDED2 Ich \u00f6ffne den Supplement Shop.\n\nAlle Produkte sind evidenzbasiert (S/A/B-Tier Bewertung). Kreatin und Protein sind die wissenschaftlich am besten belegten Supplements \u00fcberhaupt.\n\nHast du Fragen zu einem bestimmten Supplement?'); setTimeout(function() { window.openSuppShop && window.openSuppShop(); }, 1500); }, 400); }, 200);
        return null;
      }
    },
    open_gps: {
      patterns: ['gps','laufen gehen','radfahren','outdoor','gps tracking','drau\u00dfen trainieren','start gps','open gps'],
      action: function() {
        setTimeout(function() { window._openKiChat && window._openKiChat(); setTimeout(function() { if (typeof _addChatMessage === 'function') _addChatMessage('ai', '\uD83D\uDCCD GPS-Tracking wird gestartet!\n\nIch tracke: Distanz, Pace, Splits und H\u00f6henmeter.\nGeh nach drau\u00dfen und tippe auf "Start" im GPS-Fenster.'); setTimeout(function() { window.openGPSTracking && window.openGPSTracking(); }, 1000); }, 400); }, 200);
        return null;
      }
    },
    open_dna: {
      patterns: ['trainings dna','dna','trainingstyp','mein trainingstyp','dna analyse'],
      action: function() { setTimeout(function() { window._generateDNAReport && window._generateDNAReport(); }, 500); return null; }
    },
    query_weight: {
      patterns: ['gewicht','k\u00f6rpergewicht','wie viel wiege ich','weight','mein gewicht'],
      action: function() {
        var profile = window.userProfile || {};
        var log = window._getWeightLog ? window._getWeightLog() : [];
        if (log.length > 0) return 'Dein letztes Gewicht: ' + log[0].weight + 'kg vom ' + log[0].date + '.';
        return 'Dein Profilgewicht: ' + (profile.weight || '\u2014') + 'kg.';
      }
    },
    query_workouts: {
      patterns: ['wie viele workouts','trainings diese woche','workout count','wie oft trainiert','training diese woche'],
      action: function() {
        setTimeout(function() { window._openKiChat && window._openKiChat(); setTimeout(function() {
          var allW = (window.workouts||[]).filter(function(w) { return w.archived; });
          var w7 = new Date(Date.now()-7*86400000).toISOString().split('T')[0];
          var thisWeek = allW.filter(function(w) { return w.date >= w7; });
          var msg = '\uD83D\uDCCA **Deine Trainings-Stats:**\n\n\u2022 Diese Woche: **' + thisWeek.length + ' Workouts**\n\u2022 Gesamt: **' + allW.length + ' Trainingseinheiten**\n\n';
          if (thisWeek.length >= 4) msg += '\uD83D\uDD25 Starke Woche! Du bist sehr konsistent.';
          else if (thisWeek.length >= 2) msg += '\uD83D\uDC4D Guter Start. Noch ' + (4-thisWeek.length) + ' Workouts f\u00fcr dein Wochenziel!';
          else msg += '\uD83D\uDCA1 Noch ' + (3-thisWeek.length) + ' Workouts diese Woche w\u00e4ren ideal.';
          if (typeof _addChatMessage === 'function') _addChatMessage('ai', msg);
        }, 400); }, 200);
        return null;
      }
    },
    query_calories: {
      patterns: ['kalorien heute','kalorienziel','wie viele kalorien','calories today','tages kalorien'],
      action: function() {
        var p = window._getNutritionProfile ? window._getNutritionProfile() : {};
        return 'Kalorienziel: ' + (p.calorieTarget||'\u2014') + ' kcal/Tag. Protein: ' + (p.proteinTarget||'\u2014') + 'g/Tag.';
      }
    },
    query_streak: {
      patterns: ['streak','serie','tage in folge','mein streak'],
      action: function() {
        var s = window.currentStreak || 0;
        return s >= 7 ? 'Streak: ' + s + ' Tage! Stark! \uD83D\uDD25' : 'Streak: ' + s + ' Tage. Trainiere heute!';
      }
    },
    query_last_workout: {
      patterns: ['letztes training','last workout','was habe ich zuletzt','wann war mein letztes'],
      action: function() {
        var allW = (window.workouts||[]).filter(function(w) { return w.archived; });
        if (!allW.length) return 'Noch kein Training aufgezeichnet.';
        return 'Letztes Training: ' + allW[0].exercise + ' am ' + allW[0].date + '.';
      }
    },
    query_base_score: {
      patterns: ['base score','mein score','fitness score','wie ist mein score','my base score'],
      action: function() {
        var s = window._calculateBASEScore ? window._calculateBASEScore() : null;
        if (!s) return 'BASE Score wird noch berechnet.';
        return 'BASE Score: ' + s.score + '/1000 \u2014 ' + s.rank.name + '.';
      }
    },
    action_meal_plan: {
      patterns: ['ern\u00e4hrungsplan','meal plan','was soll ich essen','mahlzeitenplan','create meal plan','erstell mir einen ern\u00e4hrungsplan'],
      action: function() {
        setTimeout(function() { window._openKiChat && window._openKiChat(); setTimeout(function() { if (typeof _addChatMessage === 'function') _addChatMessage('ai', 'Ich erstelle dir einen personalisierten Ern\u00e4hrungsplan! Kurz ein paar Fragen:\n\n**1.** Was ist dein Ziel? (Abnehmen, Aufbauen, Halten)\n**2.** Wie viele Kalorien t\u00e4glich? (oder soll ich es berechnen?)\n**3.** Gibt es Lebensmittel die du nicht magst oder nicht vertr\u00e4gst?\n**4.** Wie viele Mahlzeiten pro Tag?\n\nSchreib mir deine Antworten und ich erstelle deinen Plan! \uD83C\uDF7D'); }, 400); }, 200);
        return null;
      }
    },
    action_article_check: {
      patterns: ['artikel pr\u00fcfen','check article','ist das evidenz','stimmt das','fact check','artikel analysieren'],
      action: function() { setTimeout(function() { window.openArticleAnalyzer && window.openArticleAnalyzer(); }, 500); return 'Ich \u00f6ffne den Artikel-Checker.'; }
    },
    action_history_import: {
      patterns: ['history importieren','daten importieren','strong importieren','hevy importieren','import history','csv importieren'],
      action: function() { setTimeout(function() { window.openHistoryImport && window.openHistoryImport(); }, 500); return 'Ich \u00f6ffne den History-Import.'; }
    },
    action_show_prs: {
      patterns: ['meine prs','meine rekorde','pers\u00f6nliche rekorde',
                 'best lifts','meine bestleistungen','was sind meine prs',
                 'show my prs','my records'],
      action: function() {
        window.switchTab && window.switchTab('analyse');
        return 'Ich zeige dir deine pers\u00f6nlichen Rekorde.';
      }
    },

    action_streak: {
      patterns: ['mein streak','wie viele tage','meine serie',
                 'streak check','how many days','my streak'],
      action: function() {
        var s = parseInt(localStorage.getItem('base_streak_count') || '0');
        return s > 0
          ? 'Du bist auf einem ' + s + '-Tage Streak. Stark! Mach weiter so.'
          : 'Noch kein aktiver Streak. Ein Workout heute \u00e4ndert das sofort.';
      }
    },

    action_last_workout: {
      patterns: ['letztes training details','was hab ich zuletzt gemacht','wann war ich zuletzt im gym',
                 'last workout details','was habe ich trainiert gestern','mein letztes workout'],
      action: function() {
        var ws = (window.workouts || []).filter(function(w){ return w.archived; });
        if (!ws.length) return 'Noch kein Training aufgezeichnet. Lass uns das \u00e4ndern!';
        ws.sort(function(a,b){ return new Date(b.date)-new Date(a.date); });
        var l = ws[0];
        var days = Math.floor((Date.now()-new Date(l.date))/86400000);
        var when = days === 0 ? 'heute' : days === 1 ? 'gestern' : 'vor ' + days + ' Tagen';
        return 'Dein letztes Training war ' + when + ': ' + (l.exercise || l.sportCategory || 'Training') + '.';
      }
    },

    action_battery: {
      patterns: ['wie ist meine battery','battery check','readiness check',
                 'bin ich erholt','wie fit bin ich heute','energie heute check',
                 'zns score check','wie erholt bin ich','can i train hard'],
      action: function() {
        var score = window.currentReadinessScore || 100;
        return score >= 80
          ? 'Deine Battery steht bei ' + score + '%. Gr\u00fcnes Licht \u2014 voll belasten heute.'
          : score >= 60
          ? 'Battery ' + score + '%. Moderate Belastung empfohlen.'
          : 'Battery bei ' + score + '%. Heute lieber leicht oder Mobility.';
      }
    },

    action_body_weight: {
      patterns: ['mein aktuelles gewicht','aktuelles k\u00f6rpergewicht','wie viel wiege ich genau',
                 'my current weight','body weight check','k\u00f6rpergewicht aktuell'],
      action: function() {
        var p = window.userProfile || {};
        if (p.weight) return 'Dein eingetragenes Gewicht: ' + p.weight + 'kg. Zum Aktualisieren: Men\u00fc \u2192 Profil.';
        return 'Noch kein Gewicht eingetragen. Geh zu Men\u00fc \u2192 Profil.';
      }
    },

    plan_meso: {
      patterns: ['mesozyklus','mesozyklus erstellen','neuen plan',
                 'trainingsplan erstellen','erstell mir einen plan',
                 'create plan','new plan','training plan',
                 'plan erstellen','ich will einen plan'],
      action: function() {
        setTimeout(function() {
          window._openKiChat && window._openKiChat();
          setTimeout(function() {
            if (typeof _addChatMessage === 'function') {
              _addChatMessage('ai',
                'Ich erstelle deinen Mesozyklus. Drei kurze Fragen:\n\n' +
                '**Was ist dein Hauptziel?**\n\n' +
                '\uD83D\uDCAA Muskelmasse \u00b7 \u26A1 Kraft \u00b7 \uD83C\uDFC3 Ausdauer \u00b7 \uD83D\uDD25 Abnehmen'
              );
              window._jarvisConvState = { flow: 'plan_meso', step: 1 };
            }
          }, 400);
        }, 200);
        return null;
      }
    },

    plan_competition: {
      patterns: ['wettkampf','competition','wettkampfvorbereitung',
                 'ich habe einen wettkampf','vorbereitung wettkampf',
                 'prepare competition','peaking','peak phase',
                 'wettkampf vorbereiten','auf wettkampf vorbereiten',
                 'turnier','meisterschaft','race','rennen vorbereiten'],
      action: function() {
        setTimeout(function() {
          window._openKiChat && window._openKiChat();
          setTimeout(function() {
            if (typeof _addChatMessage === 'function') {
              _addChatMessage('ai',
                '\uD83C\uDFC6 Wettkampfvorbereitung \u2014 ich plane das f\u00fcr dich.\n\n' +
                '**Wann ist dein Wettkampf?**\n' +
                'Schreib mir das Datum (z.B. "15. Juni" oder "in 10 Wochen")'
              );
              window._jarvisConvState = { flow: 'plan_competition', step: 1 };
            }
          }, 400);
        }, 200);
        return null;
      }
    },

    pt_client_summary: {
      patterns: ['wie war','woche von','training von','progress von',
                 'wie l\u00e4uft es bei','client check','kunden check',
                 'wie macht sich','wie trainiert','update zu'],
      action: function() {
        if (window.currentMode !== 'pt') {
          return 'Ich bin gerade im Athleten-Modus. Wechsle zum PT-Modus um Kunden-Infos abzurufen.';
        }
        setTimeout(function() {
          window._openKiChat && window._openKiChat();
          var clients = window.clients || [];
          if (clients.length === 0) {
            setTimeout(function() {
              if (typeof _addChatMessage === 'function')
                _addChatMessage('ai', 'Du hast noch keine Kunden angelegt.');
            }, 400);
            return;
          }
          var clientList = clients.map(function(c,i){ return (i+1) + '. ' + c.name; }).join(', ');
          setTimeout(function() {
            if (typeof _addChatMessage === 'function') {
              _addChatMessage('ai', '\u00dcber welchen Kunden soll ich berichten?\n\n' + clientList);
              window._jarvisConvState = { flow: 'pt_summary', step: 1, clients: clients };
            }
          }, 400);
        }, 200);
        return null;
      }
    },

    pt_all_clients: {
      patterns: ['alle kunden','kunden \u00fcbersicht','alle clients',
                 'wer hat diese woche','weekly overview','pt \u00fcbersicht'],
      action: function() {
        if (window.currentMode !== 'pt') return 'Wechsle zum PT-Modus f\u00fcr Kunden-Infos.';
        setTimeout(function() {
          var clients = window.clients || [];
          window._openKiChat && window._openKiChat();
          setTimeout(function() {
            if (typeof _addChatMessage !== 'function') return;
            if (clients.length === 0) { _addChatMessage('ai', 'Keine Kunden angelegt.'); return; }
            var weekAgo = new Date(Date.now()-7*86400000).toISOString().split('T')[0];
            var summary = clients.map(function(c) {
              var ws = (window.workouts||[]).filter(function(w){ return w.client === c.id && w.archived && w.date >= weekAgo; });
              return '**' + c.name + '**: ' + ws.length + ' Workouts diese Woche' + (ws.length === 0 ? ' \u26a0\ufe0f kein Training' : ' \u2705');
            }).join('\n');
            _addChatMessage('ai', '\uD83D\uDCCB **Kunden-\u00dcbersicht \u2014 Diese Woche**\n\n' + summary);
          }, 400);
        }, 200);
        return null;
      }
    },

    start_experiment: {
      patterns: ['experiment starten','experiment','teste','4 wochen test',
                 'start experiment','ich will testen','experiment modus'],
      action: function() {
        setTimeout(function() {
          window._openKiChat && window._openKiChat();
          setTimeout(function() {
            if (typeof _addChatMessage !== 'function') return;
            var current = JSON.parse(localStorage.getItem('base_active_experiment') || 'null');
            if (current && current.status === 'active') {
              _addChatMessage('ai', '\uD83E\uDDEA Du hast bereits ein aktives Experiment: **' + current.name + '** (l\u00e4uft bis ' + current.endDate + ').');
              return;
            }
            var opts = window._EXPERIMENT_TEMPLATES.map(function(t,i) {
              return (i+1) + '. **' + t.name + '** \u2014 ' + t.desc;
            }).join('\n');
            _addChatMessage('ai', '\uD83E\uDDEA **Experiment-Modus**\n\nW\u00e4hle einen 4-Wochen-Test:\n\n' + opts + '\n\nSchreib die Nummer oder beschreibe dein eigenes Experiment.');
            window._jarvisConvState = { flow: 'experiment', step: 1 };
          }, 400);
        }, 200);
        return null;
      }
    },

    habit_correlation: {
      patterns: ['welche habits','habit analyse','habits und training',
                 'habit korrelation','was hilft meinem training',
                 'habits performance'],
      action: function() {
        setTimeout(async function() {
          var log = JSON.parse(localStorage.getItem('base_habit_loop_log') || '[]');
          if (log.length < 7) {
            window._openKiChat && window._openKiChat();
            setTimeout(function() {
              if (typeof _addChatMessage === 'function')
                _addChatMessage('ai', 'Ich brauche noch mehr Check-In Daten. Aktiviere den Habit Loop in Einstellungen und checke t\u00e4glich ein!');
            }, 400);
            return;
          }

          window._openKiChat && window._openKiChat();
          setTimeout(async function() {
            if (typeof _addChatMessage !== 'function') return;
            _addChatMessage('ai', '\uD83D\uDCCA Analysiere deine Habit-Performance-Korrelation...');

            var habitStats = {};
            log.forEach(function(entry) {
              if (!entry.habits) return;
              Object.keys(entry.habits).forEach(function(k) {
                if (!habitStats[k]) habitStats[k] = { done: 0, total: 0 };
                habitStats[k].total++;
                if (entry.habits[k]) habitStats[k].done++;
              });
            });

            var habitSummary = Object.keys(habitStats).map(function(k) {
              var rate = Math.round((habitStats[k].done / habitStats[k].total) * 100);
              return k + ': ' + rate + '% Einhaltung';
            }).join(', ');

            try {
              var prompt = 'Habit Check-In Daten der letzten ' + log.length + ' Tage:\n' + habitSummary + '\n\n' +
                'Analysiere kurz welche Habits regelm\u00e4\u00dfig eingehalten werden und was das f\u00fcr das Training bedeutet. ' +
                'Max 60 W\u00f6rter, direkt und konkret.';

              var res = await fetch('/.netlify/functions/gemini', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ prompt: prompt, type: 'nudge' })
              });
              var data = await res.json();
              var reply = window._extractGeminiText(data, '');
              _addChatMessage('ai', '\uD83D\uDCCA **Deine Habit-Analyse**\n\n' + reply);
            } catch(e) {
              _addChatMessage('ai', 'Habit-Analyse konnte nicht geladen werden.');
            }
          }, 400);
        }, 200);
        return null;
      }
    },

    check_goals: {
      patterns: ['meine ziele','ziel fortschritt','wie stehe ich bei meinen zielen',
                 'check goals','ziele check','bin ich on track',
                 'mein ziel','ziel status'],
      action: function() {
        setTimeout(function() {
          var goals = window.getGoals ? window.getGoals() : [];
          var active = goals.filter(function(g) { return !g.completed; });
          window._openKiChat && window._openKiChat();
          setTimeout(function() {
            if (typeof _addChatMessage !== 'function') return;
            if (active.length === 0) {
              _addChatMessage('ai', 'Du hast noch keine aktiven Ziele. Geh zu Men\u00fc \u2192 Meine Ziele um dein erstes Ziel zu setzen.');
              return;
            }
            var summary = active.map(function(g) {
              var pct = g.targetValue > 0 ? Math.round((g.currentValue/g.targetValue)*100) : 0;
              var days = Math.max(0, Math.ceil((new Date(g.deadline)-new Date())/86400000));
              return '**' + g.title + '**: ' + pct + '% ' + (days > 0 ? '(' + days + ' Tage verbleibend)' : '(abgelaufen)');
            }).join('\n');
            _addChatMessage('ai', '\uD83C\uDFAF **Deine aktiven Ziele:**\n\n' + summary);
          }, 400);
        }, 200);
        return null;
      }
    },

    help: {
      patterns: ['hilfe','help','was kannst du','was kannst du alles','what can you do','jarvis hilfe','jarvis help','zeig mir was du kannst'],
      action: function() {
        setTimeout(function() { window._openKiChat && window._openKiChat(); setTimeout(function() { if (typeof _addChatMessage === 'function') _addChatMessage('ai', 'Ich bin **Jarvis**, dein pers\u00f6nlicher KI Fitness-Coach! \uD83E\uDD16\n\n**Was ich kann:**\n\n\uD83D\uDCC5 Trainingsplan erstellen\n\uD83C\uDF7D Ern\u00e4hrungsplan generieren\n\uD83D\uDCCA Deine Stats erkl\u00e4ren\n\u26A1 Battery & Readiness checken\n\uD83E\uDDEC Bio Age berechnen\n\uD83D\uDCCD GPS Tracking starten\n\uD83D\uDED2 Supplements empfehlen\n\u2753 Jede Fitness-Frage beantworten\n\nSag mir einfach was du brauchst \u2014 per Text oder Sprache (\uD83C\uDFA4 Mikrofon)!'); }, 400); }, 200);
        return null;
      }
    }
  };

  window._detectJarvisIntent = function(text) {
    if (!text) return null;
    var lower = text.toLowerCase().trim();
    var matched = null, bestScore = 0;
    Object.keys(window._JARVIS_INTENTS).forEach(function(key) {
      window._JARVIS_INTENTS[key].patterns.forEach(function(p) {
        if (lower.indexOf(p.toLowerCase()) !== -1 && p.length > bestScore) {
          bestScore = p.length; matched = key;
        }
      });
    });
    return matched ? window._JARVIS_INTENTS[matched] : null;
  };

  window._executeJarvis = async function(userText, isVoice) {
    if (!userText || !userText.trim()) return null;
    var intent = window._detectJarvisIntent(userText);
    // Gelernte Phrasen pr\u00fcfen
    if (!intent && window._jarvisCheckLearned) {
      var learnedIntent = window._jarvisCheckLearned(userText);
      if (learnedIntent && window._JARVIS_INTENTS[learnedIntent]) {
        intent = window._JARVIS_INTENTS[learnedIntent];
      }
    }
    if (intent) {
      // Intent lernen falls User-Text noch nicht bekannt
      if (window._jarvisLearnPhrase) {
        var matchedKey = Object.keys(window._JARVIS_INTENTS).find(function(k) {
          return window._JARVIS_INTENTS[k] === intent;
        });
        if (matchedKey) window._jarvisLearnPhrase(userText, matchedKey);
      }
      if (isVoice) {
        var intentResult = intent.action();
        if (intentResult === null) {
          // Nicht crashen — Gemini-Fallthrough für gesprochene Antwort
        } else {
          return { response: intentResult, wasIntent: true };
        }
      } else {
        var intentResult = intent.action();
        if (intentResult === null) return { response: null, wasIntent: true };
        return { response: intentResult, wasIntent: true };
      }
    }
    if (window.checkFeatureGate && !window.checkFeatureGate('coach')) return null;
    try {
      window._kiChatHistory = window._kiChatHistory || [];
      window._kiChatHistory.push({ role: 'user', content: userText });
      var systemPrompt = typeof window._buildChatSystemPrompt === 'function'
        ? window._buildChatSystemPrompt() : 'Du bist Jarvis, der pers\u00f6nliche KI Fitness Coach in BASE.';
      var _persona = localStorage.getItem('base_voice_style') || 'motivator';
      var _personaInstructions = {
        motivator: 'PERS\u00d6NLICHKEIT: Energetisch, direkt, motivierend. Kurze kraftvolle S\u00e4tze. Keine langen Erkl\u00e4rungen. Feiere Fortschritte laut.',
        calm:      'PERS\u00d6NLICHKEIT: Ruhig, pr\u00e4zise, professionell. Erkl\u00e4re Dinge klar und strukturiert. Keine Ausrufezeichen.',
        drill:     'PERS\u00d6NLICHKEIT: Drill Sergeant \u2014 knapp, direkt, keine Ausreden gelten. Maximal 2 S\u00e4tze. Milit\u00e4rischer Ton.',
        funny:     'PERS\u00d6NLICHKEIT: Warm, freundlich, leicht humorvoll. Sprich wie ein guter Freund. Darf gelegentlich scherzen.'
      };
      systemPrompt += '\n\n' + (_personaInstructions[_persona] || _personaInstructions.motivator);
      systemPrompt += isVoice
        ? '\n\nVOICE: Max 2-3 S\u00e4tze. Kein Markdown. Nat\u00fcrlich sprechen.'
        : '\n\nTEXT: Antworte hilfreich und konkret. Markdown ist erlaubt.';
      var history = window._kiChatHistory.slice(-8);
      var conversation = '';
      history.forEach(function(m) { conversation += (m.role === 'user' ? 'User: ' : 'Jarvis: ') + m.content + '\n'; });
      var res = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: conversation + '\nJarvis:', systemPrompt: systemPrompt, userId: window._getAiUserId ? window._getAiUserId() : 'anonymous' })
      });
      var data = await res.json();
      var response = window._extractGeminiText(data, 'Keine Antwort.');
      window._kiChatHistory.push({ role: 'assistant', content: response });
      return { response: response, wasIntent: false };
    } catch(e) { return { response: 'Entschuldigung, ein Fehler ist aufgetreten.', wasIntent: false }; }
  };

  // ── Jarvis Sprachlernmodul ──
  // ── Goal Coaching ──
  window._runGoalCoaching = async function() {
    if (localStorage.getItem('base_goal_coaching_enabled') !== 'true') return;
    var goals = window.getGoals ? window.getGoals() : [];
    var active = goals.filter(function(g) { return !g.completed && g.deadline; });
    if (active.length === 0) return;

    var today = new Date().toISOString().split('T')[0];
    var lastCoaching = localStorage.getItem('base_goal_coaching_last');
    var daysSinceLast = lastCoaching ? Math.floor((new Date(today) - new Date(lastCoaching)) / 86400000) : 999;
    if (daysSinceLast < 6) return;
    localStorage.setItem('base_goal_coaching_last', today);

    var goalSummary = active.map(function(g) {
      var pct = g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0;
      var daysLeft = Math.max(0, Math.ceil((new Date(g.deadline) - new Date()) / 86400000));
      return '"' + g.title + '": ' + pct + '% erreicht, ' + daysLeft + ' Tage verbleibend';
    }).join('; ');

    try {
      var prompt = 'W\u00f6chentlicher Ziel-Check-In. Aktive Ziele: ' + goalSummary + '. ' +
        'Gib einen kurzen motivierenden Check-In (max 3 S\u00e4tze): Was l\u00e4uft gut, was braucht Aufmerksamkeit, eine konkrete Empfehlung f\u00fcr diese Woche.';

      var res = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: prompt, type: 'nudge' })
      });
      var data = await res.json();
      var reply = window._extractGeminiText(data, '');
      reply = reply.trim();

      if (reply) {
        window.showToast('\uD83C\uDFAF Jarvis: ' + reply.substring(0, 80) + '...', 'info', 6000);
        setTimeout(function() {
          window._openKiChat && window._openKiChat();
          setTimeout(function() {
            if (typeof _addChatMessage === 'function') {
              _addChatMessage('ai', '\uD83C\uDFAF **W\u00f6chentlicher Ziel-Check-In**\n\n' + reply);
            }
          }, 400);
        }, 2000);
        if (window._jarvisSpeak) window._jarvisSpeak('Ich habe deinen w\u00f6chentlichen Ziel-Check-In. Schau in den Chat.');
      }
    } catch(e) { console.log('Goal coaching error:', e); }
  };

  window._jarvisLearnPhrase = function(userText, intent) {
    if (!userText || !intent) return;
    var learned = JSON.parse(localStorage.getItem('base_jarvis_learned') || '{}');
    var key = userText.toLowerCase().trim();
    if (key.length < 3 || key.length > 60) return;
    if (!learned[key]) learned[key] = { intent: intent, count: 0, learned: new Date().toISOString() };
    learned[key].count++;
    var keys = Object.keys(learned);
    if (keys.length > 100) {
      keys.sort(function(a,b){ return learned[a].count - learned[b].count; });
      delete learned[keys[0]];
    }
    localStorage.setItem('base_jarvis_learned', JSON.stringify(learned));
  };

  // ── Experiment-Modus ──
  window._EXPERIMENT_TEMPLATES = [
    { id: 'volume_plus', name: '+20% Volumen', desc: 'Erh\u00f6he dein Trainingsvolumen um 20%', metric: 'volume', change: '+20%' },
    { id: 'frequency_plus', name: 'Mehr Frequenz', desc: '1 Trainingstag pro Woche mehr', metric: 'frequency', change: '+1 Tag' },
    { id: 'intensity_plus', name: 'Mehr Intensit\u00e4t', desc: 'Reduziere RIR um 1 (schwerer trainieren)', metric: 'intensity', change: 'RIR -1' },
    { id: 'sleep_focus', name: 'Schlaf-Fokus', desc: '8h Schlaf pro Nacht f\u00fcr 4 Wochen', metric: 'sleep', change: '8h/Nacht' },
    { id: 'custom', name: 'Eigenes Experiment', desc: 'Beschreibe selbst was du testen willst', metric: 'custom', change: '' }
  ];

  window._startExperiment = function(templateId, customDesc) {
    var template = window._EXPERIMENT_TEMPLATES.find(function(t){ return t.id === templateId; });
    if (!templateId && !customDesc) return;

    var experiment = {
      id: Date.now().toString(),
      templateId: templateId || 'custom',
      name: template ? template.name : 'Eigenes Experiment',
      description: customDesc || (template ? template.desc : ''),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
      metric: template ? template.metric : 'custom',
      baselineWorkouts: (window.workouts||[]).filter(function(w){return w.archived;}).length,
      baselineAvgVolume: 0,
      status: 'active'
    };

    var ws = (window.workouts||[]).filter(function(w){return w.archived;}).slice(-8);
    if (ws.length > 0) {
      var totalVol = ws.reduce(function(s,w){ return s + (w.volume||0); }, 0);
      experiment.baselineAvgVolume = Math.round(totalVol / ws.length);
    }

    localStorage.setItem('base_active_experiment', JSON.stringify(experiment));
    window.showToast('\uD83E\uDDEA Experiment gestartet! L\u00e4uft 4 Wochen bis ' + experiment.endDate);

    if (window._openKiChat) {
      window._openKiChat();
      setTimeout(function() {
        if (typeof _addChatMessage === 'function') {
          _addChatMessage('ai',
            '\uD83E\uDDEA **Experiment gestartet!**\n\n' +
            '**Was:** ' + experiment.description + '\n' +
            '**Dauer:** 4 Wochen (bis ' + experiment.endDate + ')\n' +
            '**Baseline:** ' + experiment.baselineAvgVolume + 'kg Durchschnittsvolumen\n\n' +
            'Nach 4 Wochen werde ich dir eine vollst\u00e4ndige Auswertung geben \u2014 ob die \u00c4nderung gewirkt hat oder nicht.'
          );
        }
      }, 400);
    }
  };

  window._checkExperimentStatus = async function() {
    var exp = JSON.parse(localStorage.getItem('base_active_experiment') || 'null');
    if (!exp || exp.status !== 'active') return;

    var today = new Date().toISOString().split('T')[0];
    if (today < exp.endDate) return;

    exp.status = 'completed';
    localStorage.setItem('base_active_experiment', JSON.stringify(exp));

    var ws = (window.workouts||[]).filter(function(w){ return w.archived && w.date >= exp.startDate; });
    var newAvgVol = 0;
    if (ws.length > 0) {
      var total = ws.reduce(function(s,w){ return s + (w.volume||0); }, 0);
      newAvgVol = Math.round(total / ws.length);
    }
    var volChange = exp.baselineAvgVolume > 0 ? Math.round(((newAvgVol - exp.baselineAvgVolume) / exp.baselineAvgVolume) * 100) : 0;

    try {
      var prompt = 'Experiment-Auswertung nach 4 Wochen:\n' +
        'Was getestet wurde: ' + exp.description + '\n' +
        'Baseline-Volumen: ' + exp.baselineAvgVolume + 'kg/Session\n' +
        'Neues Volumen: ' + newAvgVol + 'kg/Session (' + (volChange > 0 ? '+' : '') + volChange + '%)\n' +
        'Anzahl Workouts im Experiment: ' + ws.length + '\n\n' +
        'Gib eine klare Auswertung: Hat das Experiment funktioniert? Was empfiehlst du jetzt? Max 4 S\u00e4tze.';

      var res = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: prompt, type: 'nudge' })
      });
      var data = await res.json();
      var reply = window._extractGeminiText(data, '');

      if (window._openKiChat) {
        window._openKiChat();
        setTimeout(function() {
          if (typeof _addChatMessage === 'function') {
            _addChatMessage('ai',
              '\uD83E\uDDEA **Experiment abgeschlossen!**\n\n' +
              '**' + exp.name + '** \u2014 4 Wochen\n\n' +
              '\uD83D\uDCCA Volumen: ' + exp.baselineAvgVolume + ' \u2192 ' + newAvgVol + 'kg (' + (volChange > 0 ? '+' : '') + volChange + '%)\n\n' +
              reply
            );
          }
        }, 400);
      }
      if (window._jarvisSpeak) window._jarvisSpeak('Dein 4-Wochen Experiment ist abgeschlossen. Ich habe die Auswertung im Chat.');
    } catch(e) { console.log('Experiment eval error:', e); }
  };

  window._jarvisCheckLearned = function(text) {
    var learned = JSON.parse(localStorage.getItem('base_jarvis_learned') || '{}');
    var lower = text.toLowerCase().trim();
    if (learned[lower] && learned[lower].count >= 2) return learned[lower].intent;
    var keys = Object.keys(learned);
    for (var i = 0; i < keys.length; i++) {
      if (learned[keys[i]].count >= 3 && lower.indexOf(keys[i]) !== -1) {
        return learned[keys[i]].intent;
      }
    }
    return null;
  };
