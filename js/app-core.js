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
    '<button aria-label="Abbrechen" onclick="document.getElementById(\'_inputModalOverlay\').remove()" style="flex:1;padding:12px;border-radius:12px;background:none;border:1px solid #333;color:#82828c;font-weight:600;font-size:13px;cursor:pointer" class="pointer-events-auto">Abbrechen</button>' +
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

  window._showRetentionModal = function(hookId, config) {
   var existing = document.getElementById('retentionOverlay');
   if(existing) existing.remove();
   var overlay = document.createElement('div');
   overlay.id = 'retentionOverlay';
   overlay.style.cssText = 'position:fixed;inset:0;z-index:750;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.7);padding:16px';
   overlay.innerHTML = '<div style="background:#1a1a1f;border:1px solid rgba(163,201,168,0.2);border-radius:24px;padding:28px;max-width:360px;width:100%;text-align:center;animation:slideUp 0.3s ease;margin-bottom:env(safe-area-inset-bottom,16px)">' +
    '<p style="font-size:40px;margin-bottom:12px">' + (config.emoji || '') + '</p>' +
    '<p style="font-size:17px;font-weight:800;color:#f4f4f5;margin-bottom:6px">' + window._escapeHtml(config.title) + '</p>' +
    '<p style="font-size:13px;color:#82828c;margin-bottom:20px;line-height:1.5">' + window._escapeHtml(config.text) + '</p>' +
    '<button id="retentionAction" aria-label="' + window._escapeHtml(config.btnText) + '" style="width:100%;background:#a3c9a8;color:#0f110f;border:none;padding:14px;border-radius:14px;font-weight:800;font-size:14px;cursor:pointer;margin-bottom:10px" class="pointer-events-auto">' + window._escapeHtml(config.btnText) + '</button>' +
    '<button id="retentionDismiss" aria-label="' + window.t('retDismiss','Spaeter') + '" style="width:100%;background:none;border:none;color:#555;font-size:12px;padding:8px;cursor:pointer" class="pointer-events-auto">' + window.t('retDismiss','Spaeter') + '</button></div>';
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
     emoji: '\uD83D\uDCAA', title: window.t('retFirstTitle','Bereit fuer dein erstes Workout?'),
     text: window.t('retFirstText','Starte jetzt und BASE lernt deine Staerken kennen. Nur 5 Minuten.'),
     btnText: window.t('retFirstBtn','Jetzt starten'), action: function() { window.switchView('active'); }
    }); }, 3000);
    return;
   }
   if(daysSinceFirst >= 1 && daysSinceFirst <= 2 && hasWorkout && visitCount <= 4 && dismissed.day2 !== today) {
    setTimeout(function() { window._showRetentionModal('day2', {
     emoji: '\uD83D\uDD25', title: window.t('retDay2Title','Willkommen zurueck!'),
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

  // Connect existing _showDay2Hook
  window._showDay2Hook = function() {
   var dismissed = JSON.parse(localStorage.getItem('base_retention_dismissed') || '{}');
   var today = new Date().toISOString().split('T')[0];
   if(dismissed.day2post !== today) {
    window.toggleModal('day2HookModal');
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
    form.onsubmit = (e) => { e.preventDefault(); if(window.saveWorkout) window.saveWorkout(e); return false; };
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
  window.handleStravaCallback = async function(code) { try { const res = await fetch('/.netlify/functions/strava-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code, grant_type: 'authorization_code' }) }); if(!res.ok) throw new Error("Strava Token-Exchange fehlgeschlagen"); const data = await res.json(); stravaTokens = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at }; localStorage.setItem('beastmode_strava_tokens', JSON.stringify(stravaTokens)); window.showToast("Strava erfolgreich verbunden!"); window.updateStravaUI(); } catch(e) { alert("Strava Login fehlgeschlagen: " + e.message); } };
  window.refreshStravaTokenIfNeeded = async function() { if(!stravaTokens) return false; if(Date.now() / 1000 > (stravaTokens.expires_at - 300)) { try { const res = await fetch('/.netlify/functions/strava-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: stravaTokens.refresh_token }) }); if(!res.ok) throw new Error("Token Refresh fehlgeschlagen"); const data = await res.json(); stravaTokens.access_token = data.access_token; stravaTokens.refresh_token = data.refresh_token; stravaTokens.expires_at = data.expires_at; localStorage.setItem('beastmode_strava_tokens', JSON.stringify(stravaTokens)); return true; } catch(e) { return false; } } return true; };
  window.syncStravaActivities = async function() {
   if(!stravaTokens) return alert("Strava nicht verbunden! Bitte im Profil verknüpfen."); 
   window.showToast(window.t("aiAnalyzing", "Lade Strava Aktivitäten..."));
   await window.refreshStravaTokenIfNeeded();
   try {
    const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', { headers: { 'Authorization': `Bearer ${stravaTokens.access_token}` } });
    if(!res.ok) throw new Error(window.t('aiServerError',"API Fehler beim Abrufen der Aktivitäten.")); const activities = await res.json(); let importedCount = 0;
    activities.forEach(act => {
     const mappedId = `strava_${act.id}`;
     if(!window.workouts.find(w => w.id === mappedId)) {
      let cat = 'cardio'; let sportName = 'Strava Activity';
      if(act.type === 'Run') sportName = 'Laufen'; else if(act.type === 'Ride') sportName = 'Radfahren'; else if(act.type === 'Swim') sportName = 'Schwimmen'; else if(act.type === 'WeightTraining') { cat = 'strength'; sportName = 'Krafttraining'; } else if(act.type === 'Walk') { sportName = 'Gehen'; cat = 'recovery'; } else sportName = act.type;
      let dynData = { "Distanz (km)": (act.distance / 1000).toFixed(2), "Dauer (min)": Math.round(act.moving_time / 60) };
      if(act.average_heartrate) dynData["Ø Puls"] = Math.round(act.average_heartrate);
      if(act.type === 'Run' && act.average_speed > 0) { const paceDec = (1000 / act.average_speed) / 60; const mins = Math.floor(paceDec); const secs = Math.round((paceDec - mins) * 60).toString().padStart(2, '0'); dynData["Pace (min/km)"] = `${mins}:${secs}`; }
      let entry = { id: mappedId, category: cat, sportCategory: sportName, date: act.start_date_local ? act.start_date_local.substring(0,10) : new Date().toISOString().substring(0,10), exercise: act.name || sportName, data: dynData, archived: true, sessionId: `strava_session_${act.id}`, sessionDuration: Math.round(act.moving_time / 60) + ' min', sessionComment: "Via Strava importiert" };
      window.workouts.push(entry); if(window.syncToCloud) window.syncToCloud(entry); importedCount++;
     }
    });
    if(importedCount > 0) { window.workouts = window.workouts.sort((a,b) => new Date(b.date) - new Date(a.date)); window.saveWorkoutsForCurrentClient(); window.renderTable(); window.calculateReadiness(); if(window.currentView === 'chart') window.initAnalytics(); window.showToast(`${importedCount} ${window.t('stravaImported','Aktivitäten importiert!')}`); } else { window.showToast(window.t("toastUpdate", "Alles auf dem neuesten Stand.")); }
   } catch(e) { alert("Strava Sync Fehler: " + e.message); }
  };

  
  window.toggleInjury = function(btn) { const v = btn.getAttribute('data-val'); if(window.selectedInjuries.has(v)) { window.selectedInjuries.delete(v); btn.classList.remove('chip-active', 'bg-primary', 'text-black', 'border-primary'); btn.classList.add('bg-zinc-900', 'text-zinc-500', 'border-zinc-800'); } else { window.selectedInjuries.add(v); btn.classList.add('chip-active', 'bg-primary', 'text-black', 'border-primary'); btn.classList.remove('bg-zinc-900', 'text-zinc-500', 'border-zinc-800'); } }

  window.workouts = []; window.clients = []; window.savedRoutines = []; let savedCustomFields = []; window.userProfile = { age: '', weight: '', height: '', gender: '', experience: '', injuries: [], medicalDetails: '', modules: { main: false, strength: true, cardio: true, recovery: false }, widgets: { readiness: false, ptMode: false } }; window.selectedInjuries = new Set(); let currentChartType = 'bar'; window.currentMode = 'personal'; window.currentClient = 'personal'; window.currentLang = localStorage.getItem('beastmode_lang') || 'de'; window.currentCategory = 'strength'; window.currentTableFilter = 'all';
  window.editingWorkoutId = null; window.currentReadinessScore = 100; window.currentView = 'active';
  window.isWorkoutTimerRunning = false; window.workoutTimerSeconds = 0; window.workoutTimerInterval = null;
  window.selectedRestTime = 90; window.restTimerSeconds = 0; window.restTimerInterval = null;

  // === VOICE COACH ===
  window._voiceCoachEnabled = localStorage.getItem('base_voice_coach') === 'true';
  window._speak = function(text, priority) {
   if (!window._voiceCoachEnabled || !window.speechSynthesis) return;
   if (priority === 'high') window.speechSynthesis.cancel();
   var utter = new SpeechSynthesisUtterance(text);
   var langMap = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', nl: 'nl-NL', ar: 'ar-SA' };
   utter.lang = langMap[window.currentLang] || 'de-DE';
   utter.rate = 1.0; utter.pitch = 1.0; utter.volume = 0.9;
   var voices = window.speechSynthesis.getVoices();
   if (voices.length > 0) {
    var lp = utter.lang.split('-')[0];
    var pref = voices.find(function(v) { return v.lang.startsWith(lp) && v.localService; }) || voices.find(function(v) { return v.lang.startsWith(lp); });
    if (pref) utter.voice = pref;
   }
   window.speechSynthesis.speak(utter);
  };
  window.toggleVoiceCoach = function() {
   window._voiceCoachEnabled = !window._voiceCoachEnabled;
   localStorage.setItem('base_voice_coach', String(window._voiceCoachEnabled));
   var toggle = document.getElementById('mod_voiceCoach');
   if (toggle) toggle.checked = window._voiceCoachEnabled;
   if (window._voiceCoachEnabled) {
    window._speak(window.t('voiceActivated', 'Voice Coach aktiviert. Lass uns trainieren!'), 'high');
    window.showToast(window.t('voiceOn', 'Voice Coach AN'));
   } else {
    window.speechSynthesis.cancel();
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
   indicator.style.cssText = 'position:fixed;top:12px;right:12px;z-index:500;display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.25);font-size:10px;font-weight:700;color:#a3c9a8';
   indicator.innerHTML = '<i data-lucide="volume-2" class="w-3 h-3 pointer-events-none"></i> <span class="pointer-events-none">VOICE</span>';
   document.body.appendChild(indicator);
   window._refreshLucide();
  };
  setTimeout(function() { if (window._renderVoiceCoachIndicator) window._renderVoiceCoachIndicator(); }, 2000);

  // === +/- INPUT HELPERS ===
  window._adjustInput = function(inputId, delta) {
   var input = document.getElementById(inputId);
   if (!input) return;
   var raw = input.value;
   var isWdh = inputId.indexOf('wdh') !== -1;
   var isWeight = inputId.indexOf('weight') !== -1;
   var isRir = inputId.indexOf('rir') !== -1;
   var defaultVal = isWdh ? 8 : isWeight ? 20 : isRir ? 2 : 0;
   var val = parseFloat(raw);
   if (isNaN(val) || raw === '' || raw === '--') val = defaultVal;
   val = val + delta;
   var min = isRir ? 0 : isWeight ? 0 : 1;
   var max = isRir ? 5 : isWeight ? 500 : 999;
   val = Math.max(min, Math.min(max, val));
   if (isWeight) val = Math.round(val * 2) / 2;
   input.value = val;
   input.dispatchEvent(new Event('change'));
  };
  window.DEFAULT_STRENGTH_SCHEMA = [ {"id": "saetze", "label": "Sätze", "type": "number", "placeholder": "z.B. 3"}, {"id": "wdh", "label": "Wiederholungen", "type": "number", "placeholder": "z.B. 10"}, {"id": "gewicht", "label": "Gewicht (kg)", "type": "number", "placeholder": "z.B. 80"} ]; // Note: labels translated at render time via schema_ keys
  window.DEFAULT_CARDIO_SCHEMA = [ {"id": "distanz", "label": "Distanz (km)", "type": "number", "placeholder": "z.B. 5.5"}, {"id": "dauer", "label": "Dauer (min)", "type": "number", "placeholder": "z.B. 30"}, {"id": "pace", "label": "Pace (min/km)", "type": "text", "placeholder": "z.B. 5:30"}, {"id": "puls", "label": "Ø Puls", "type": "number", "placeholder": "z.B. 140"} ];
  window.categorySchemas = { main: null, strength: { sportName: "Klassisches Krafttraining", schema: window.DEFAULT_STRENGTH_SCHEMA }, cardio: { sportName: "Ausdauersport", schema: window.DEFAULT_CARDIO_SCHEMA }, recovery: null };
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
  window.saveWorkoutsForCurrentClient = function() { localStorage.setItem(window.getStorageKey(), JSON.stringify(window.workouts)); window.calculateStreak(); if(window._checkFirstWorkoutComplete) window._checkFirstWorkoutComplete(); if(window.currentClient && window.currentClient !== 'personal') { window._syncClientWorkoutsToCloud(window.currentClient); } };

  window.syncClientsToCloud = async function() {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'clients_list');
    await window._fbSetDoc(ref, { clients: JSON.parse(localStorage.getItem('beastmode_v2_clients') || '[]'), updated: new Date().toISOString() });
   } catch(e) { console.error('Client sync error:', e); }
  };

  window._syncClientWorkoutsToCloud = async function(clientId) {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var data = JSON.parse(localStorage.getItem('beastmode_v2_cache_' + clientId) || '[]');
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'client_workouts_' + clientId);
    await window._fbSetDoc(ref, { workouts: data, updated: new Date().toISOString() });
   } catch(e) { console.error('Client workout sync error:', e); }
  };

  window._syncClientProfileToCloud = async function(clientId, profile) {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'client_profile_' + clientId);
    await window._fbSetDoc(ref, { profile: profile, updated: new Date().toISOString() });
   } catch(e) { console.error('Client profile sync error:', e); }
  };

  window._syncSessionsToCloud = async function() {
   var auth = window._fbAuth;
   if(!auth || !auth.currentUser || !window._fbDb) return;
   try {
    var data = JSON.parse(localStorage.getItem('base_pt_sessions') || '[]');
    var ref = window._fbDoc(window._fbDb, 'artifacts', 'base-v2-beta-test', 'users', auth.currentUser.uid, 'pt_data', 'sessions');
    await window._fbSetDoc(ref, { sessions: data, updated: new Date().toISOString() });
   } catch(e) { console.error('Session sync error:', e); }
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
   } catch(e) { console.error('Cloud load error:', e); }
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
   const lsCF = localStorage.getItem('beastmode_v2_custom_fields'); if(lsCF) savedCustomFields = JSON.parse(lsCF);
   const lsP = localStorage.getItem('beastmode_v2_profile'); 
   
   if(lsP) { try { window.userProfile = { ...window.userProfile, ...JSON.parse(lsP) }; if(!window.userProfile.widgets) window.userProfile.widgets = { readiness: false, ptMode: false }; if(!window.userProfile.modules) window.userProfile.modules = { main: false, strength: true, cardio: true, recovery: false }; if(window.userProfile.injuries && Array.isArray(window.userProfile.injuries)) window.selectedInjuries = new Set(window.userProfile.injuries); } catch(e) { console.error('Fehler beim Laden des Profils:', e); } } 

   try { const lsSchemas = localStorage.getItem('beastmode_v2_multi_schemas'); if(lsSchemas) { window.categorySchemas = { ...window.categorySchemas, ...JSON.parse(lsSchemas) }; } } catch(e) { console.error('Fehler beim Laden der Schemas:', e); }
   if (!window.categorySchemas.strength || !window.categorySchemas.strength.schema || window.categorySchemas.strength.schema.length === 0) { window.categorySchemas.strength = { sportName: "Klassisches Krafttraining", schema: window.DEFAULT_STRENGTH_SCHEMA }; localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(window.categorySchemas)); }
   if (!window.categorySchemas.cardio || !window.categorySchemas.cardio.schema || window.categorySchemas.cardio.schema.length === 0) { window.categorySchemas.cardio = { sportName: "Ausdauersport", schema: window.DEFAULT_CARDIO_SCHEMA }; localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(window.categorySchemas)); }
   if (!window.categorySchemas['recovery'] || !window.categorySchemas['recovery'].schema || window.categorySchemas['recovery'].schema.length === 0) {
    window.categorySchemas['recovery'] = {
     sportName: 'Mobility',
     schema: [
      { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: 'z.B. 30' },
      { id: 'fokus', label: 'Fokusbereich', type: 'text', placeholder: 'z.B. Hüfte, Schultern' },
      { id: 'dehnzeit', label: 'Dehnzeit (sek)', type: 'number', placeholder: 'z.B. 120' },
      { id: 'bewertung', label: 'Bewertung (1-10)', type: 'number', placeholder: 'z.B. 7' }
     ]
    };
   }

   if (!window.userProfile.onboardingDone && !code) {
    if(document.getElementById('onboardingModal')) { window.toggleModal('onboardingModal'); }
    else { window.userProfile.onboardingDone = true; if(typeof window.applyModules === 'function') window.applyModules(); if(typeof window.renderWidgetStoreUI === 'function') window.renderWidgetStoreUI(); }
   } else { if(typeof window.applyModules === 'function') window.applyModules(); if(typeof window.renderWidgetStoreUI === 'function') window.renderWidgetStoreUI(); setTimeout(function() { if(typeof window.showModeSelector === 'function') window.showModeSelector(); }, 500); }
   
   window.setupInjuryChips(); window.populateProfile(); 
   const dateInput = document.getElementById('dateInput'); if (dateInput) dateInput.valueAsDate = new Date();
   
   window.renderTableFilters(); window.filterTable(window.currentCategory); window.calculateReadiness(); window.calculateStreak(); window.checkFirstWorkoutBanner(); window.checkAnonRegisterBanner(); window.showSocialProof(); window.checkReviewPrompt(); window.checkWeeklyReview(); if(window._updateSmartWorkoutVisibility) window._updateSmartWorkoutVisibility(); if(window._renderXPBar) window._renderXPBar(); setTimeout(function() { if(window._checkRetentionHooks) window._checkRetentionHooks(); }, 4000);
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
   const stravaContainer = document.getElementById('stravaActionContainer'); if(stravaContainer) { if(cat === 'cardio') stravaContainer.classList.remove('hidden'); else stravaContainer.classList.add('hidden'); }
   const hiitContainer = document.getElementById('hiitTimerContainer');
   if(hiitContainer) { if(cat === 'cardio') hiitContainer.classList.remove('hidden'); else { hiitContainer.classList.add('hidden'); window.resetHiit && window.resetHiit(); } } const catData = window.categorySchemas[cat]; const titleMap = { main: window.t('modCus','Mein Sport'), strength: window.t('modStr','Krafttraining'), cardio: window.t('modCar','Ausdauersport'), recovery: window.t('tabRec','Mobility') }; const fallbackTitle = i18nData[window.currentLang] ? (i18nData[window.currentLang][`mod${cat.charAt(0).toUpperCase() + cat.slice(1,3)}`] || titleMap[cat]) : titleMap[cat]; if(catData && catData.schema && catData.schema.length > 0) { window.renderDynamicForm(catData.sportName, catData.schema, cat); } else { document.getElementById('workoutForm').classList.add('hidden'); document.getElementById('restTimerSection').classList.add('hidden'); document.getElementById('noFormState').classList.remove('hidden'); document.getElementById('noFormState').classList.add('block'); const ui = window.CAT_UI[cat]; const iconContainer = document.getElementById('formCatIcon'); if(iconContainer && ui) { iconContainer.className = 'w-7 h-7 rounded-lg flex items-center justify-center border'; iconContainer.style.color = 'var(--cat-accent)'; iconContainer.style.borderColor = 'var(--cat-accent)'; iconContainer.style.backgroundColor = 'var(--cat-glow-10)'; iconContainer.innerHTML = `<i data-lucide="${ui.icon}" class="w-3.5 h-3.5"></i>`; } const titleEl = document.getElementById('formSportTitle'); if(titleEl) titleEl.textContent = fallbackTitle; const _olEl1 = document.getElementById('formCatOverline'); if(_olEl1) { const _olMap1 = { strength: window.t('modStr','Kraft Modul'), cardio: window.t('modCar','Ausdauer Modul'), recovery: window.t('tabRec','Mobility'), main: window.t('modCus','Mein Sport') }; _olEl1.textContent = _olMap1[cat] || cat; } const placeholders = { main: `z.B. Tennis`, strength: "z.B. Squats", cardio: window.t('phCardio','z.B. 10k Lauf'), recovery: "z.B. Yoga, Stretching" }; const sportInput = document.getElementById('sportTypeInput'); if(sportInput) sportInput.placeholder = placeholders[cat] || window.t('obFocS','Was trackst du?'); } // Reveal form (Progressive Disclosure)
   const wrapper = document.getElementById('formRevealWrapper'); if(wrapper) wrapper.setAttribute('data-cat', cat); const prompt = document.getElementById('categoryPrompt');
   if(wrapper) { wrapper.classList.add('form-visible'); }
   if(prompt) { prompt.classList.add('hidden'); }
   if(typeof window.filterTable === 'function') window.filterTable(cat); window.updateExerciseAutocomplete();
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
   
   const renderField = (field, removeFn) => { const wrapper = document.createElement('div'); wrapper.className = "relative group col-span-1"; const _fl = window.t('schema_' + field.id, field.label); const _fp = window.t('ph_' + field.id, field.placeholder || ''); wrapper.innerHTML = `<label class="block text-[10px] font-black text-primary uppercase tracking-widest mb-2">${window._escapeHtml(_fl)}</label><div class="relative interactive-z"><input type="${field.type || 'text'}" id="dyn_${field.id}" data-label="${window._escapeHtml(field.label)}" placeholder="${window._escapeHtml(_fp)}" step="any" class="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-bold outline-none focus:border-primary transition-colors shadow-inner pr-10 pointer-events-auto cursor-text"><button aria-label="Schließen" type="button" onclick="${removeFn}" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-rose-500 transition-colors cursor-pointer pointer-events-auto"><i data-lucide="x" class="w-4 h-4 pointer-events-none"></i></button></div>`; return wrapper; };

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
   const container = document.getElementById('setsContainer');
   if(!container) return;
   container.innerHTML = '';
   for(let i = 1; i <= parseInt(count); i++) {
    const row = document.createElement('div');
    row.className = "zen-set-row animate-in fade-in slide-in-from-left-2 relative z-50 pointer-events-auto";
    var _btnStyle = 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)';
    row.innerHTML = `
     <span class="zen-set-label pointer-events-none">${window.t('lblSet','Satz')} ${i}</span>
     <div style="display:flex;gap:6px;align-items:stretch;width:100%">
      <div style="flex:2;display:flex;align-items:center;gap:2px">
       <button type="button" aria-label="Reps minus" onclick="window._adjustInput('wdh_s${i}',-1)" class="w-6 h-8 rounded-md flex items-center justify-center text-xs font-black cursor-pointer pointer-events-auto flex-shrink-0" style="${_btnStyle}">\u2212</button>
       <input type="number" id="wdh_s${i}" aria-label="${window.t('schema_wdh','Wdh')} ${i}" placeholder="--" min="0" class="zen-set-input relative z-50 pointer-events-auto cursor-text" style="flex:1;min-width:0;text-align:center">
       <button type="button" aria-label="Reps plus" onclick="window._adjustInput('wdh_s${i}',1)" class="w-6 h-8 rounded-md flex items-center justify-center text-xs font-black cursor-pointer pointer-events-auto flex-shrink-0" style="${_btnStyle}">+</button>
       <span class="text-[8px] font-bold uppercase" style="color:var(--text-muted);width:20px">${window.t('lblReps','Wdh')}</span>
      </div>
      <div style="flex:2;display:flex;align-items:center;gap:2px">
       <button type="button" aria-label="Kg minus" onclick="window._adjustInput('weight_s${i}',-2.5)" class="w-6 h-8 rounded-md flex items-center justify-center text-xs font-black cursor-pointer pointer-events-auto flex-shrink-0" style="${_btnStyle}">\u2212</button>
       <input type="number" step="any" id="weight_s${i}" aria-label="${window.t('schema_gewicht','kg')} ${i}" placeholder="--" min="0" class="zen-set-input relative z-50 pointer-events-auto cursor-text" style="flex:1;min-width:0;text-align:center">
       <button type="button" aria-label="Kg plus" onclick="window._adjustInput('weight_s${i}',2.5)" class="w-6 h-8 rounded-md flex items-center justify-center text-xs font-black cursor-pointer pointer-events-auto flex-shrink-0" style="${_btnStyle}">+</button>
       <span class="text-[8px] font-bold uppercase" style="color:var(--text-muted);width:16px">kg</span>
      </div>
      <div style="flex:1;display:flex;align-items:center;gap:2px">
       <button type="button" aria-label="RIR minus" onclick="window._adjustInput('rir_s${i}',-1)" class="w-6 h-8 rounded-md flex items-center justify-center text-xs font-black cursor-pointer pointer-events-auto flex-shrink-0" style="${_btnStyle}">\u2212</button>
       <input type="number" id="rir_s${i}" aria-label="RIR ${i}" placeholder="--" min="0" max="5" class="zen-set-input relative z-50 pointer-events-auto cursor-text" style="flex:1;min-width:0;text-align:center;max-width:32px">
       <button type="button" aria-label="RIR plus" onclick="window._adjustInput('rir_s${i}',1)" class="w-6 h-8 rounded-md flex items-center justify-center text-xs font-black cursor-pointer pointer-events-auto flex-shrink-0" style="${_btnStyle}">+</button>
       <span class="text-[8px] font-bold uppercase" style="color:#a3c9a8;width:18px">RIR</span>
      </div>
     </div>
    `;
    container.appendChild(row);
   }
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
    
    let entry = { id: window.editingWorkoutId || Date.now().toString(), category: window.currentCategory, date: dtEl.value, exercise: exEl.value.trim().substring(0, 200), archived: window.editingWorkoutId ? (window.workouts.find(w => w.id === window.editingWorkoutId)?.archived || false) : false, data: {}, setDetails: [], volume: 0, maxWeight: 0 };
    let isPR = false; let prType = ''; let prSubText = ''; let prValue = ''; let prUnit = ''; let prDiffText = '';
    const exName = exEl.value.trim().toLowerCase(); 
    const pastWorkouts = window.workouts.filter(w => w.category === window.currentCategory && w.exercise.toLowerCase() === exName && w.id !== window.editingWorkoutId);
    
    if (window.currentCategory === 'strength') {
     entry.sportCategory = window.categorySchemas['strength'] ? window.categorySchemas['strength'].sportName : 'Krafttraining';
     let previousMax = 0; if(pastWorkouts.length > 0) { previousMax = Math.max(...pastWorkouts.map(w => w.maxWeight || 0)); }
     const sInput = document.getElementById('setsInput'); const count = sInput ? parseInt(sInput.value) : 0; let vol = 0, maxW = 0; let setsDisplay = [];
     
     for (let i = 1; i <= count; i++) {
      const rEl = document.getElementById(`wdh_s${i}`); const wEl = document.getElementById(`weight_s${i}`); const rirEl = document.getElementById(`rir_s${i}`);
      if (rEl && wEl && rEl.value && wEl.value) {
       let r = parseInt(rEl.value) || 0; let w = parseFloat(wEl.value) || 0; let rir = (rirEl && rirEl.value !== '') ? parseInt(rirEl.value) : null;
       var setObj = { reps: r, weight: w }; if (rir !== null && !isNaN(rir)) setObj.rir = rir;
       entry.setDetails.push(setObj); vol += (r * w);
       if (w > maxW) maxW = w; setsDisplay.push(`${r}x${w}kg`);
      }
     }
     entry.volume = vol; entry.maxWeight = maxW; entry.equipment = document.getElementById('equipmentInput')?.value || 'Standard';
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
        if(window._speak) { var _prM = { de: 'Neuer persoenlicher Rekord! ' + prValue + ' ' + prUnit + '!', en: 'New personal record! ' + prValue + ' ' + prUnit + '!', fr: 'Nouveau record! ' + prValue + ' ' + prUnit + '!', es: 'Nuevo record! ' + prValue + ' ' + prUnit + '!', it: 'Nuovo record! ' + prValue + ' ' + prUnit + '!', nl: 'Nieuw record! ' + prValue + ' ' + prUnit + '!', ar: 'رقم قياسي جديد! ' + prValue + ' ' + prUnit + '!' }; window._speak(_prM[window.currentLang] || _prM.de, 'high'); }
        setTimeout(() => { if(card) card.classList.add('pr-celebration-out'); setTimeout(() => { prOverlay.classList.add('hidden'); prOverlay.classList.remove('flex'); }, 300); }, 2000);
       } else {
        window.showToast(`Neuer PR: ${prValue}${prUnit} bei ${entry.exercise}!`);
        if(window._speak) { var _prM2 = { de: 'Neuer Rekord! ' + prValue + ' ' + prUnit + '!', en: 'New record! ' + prValue + ' ' + prUnit + '!' }; window._speak(_prM2[window.currentLang] || _prM2.de, 'high'); }
       }
      }, 500); 
     } else {
      window.showToast(window.t("toastSaved"));
      if(typeof window.startRestCountdown === 'function') window.startRestCountdown(window.selectedRestTime);
      if (window._speak && entry.category === 'strength' && entry.setDetails && entry.setDetails.length > 0) { var _lastSet = entry.setDetails[entry.setDetails.length - 1]; var _r = _lastSet.reps || 0; var _w = _lastSet.weight || 0; var _sn = entry.setDetails.length; var _vm = { de: _r + ' Wiederholungen mit ' + _w + ' Kilo. Satz ' + _sn + ' gespeichert!', en: _r + ' reps at ' + _w + ' kilos. Set ' + _sn + ' saved!', fr: _r + ' repetitions a ' + _w + ' kilos. Serie ' + _sn + '!', es: _r + ' repeticiones con ' + _w + ' kilos. Serie ' + _sn + '!', it: _r + ' ripetizioni a ' + _w + ' chili. Serie ' + _sn + '!', nl: _r + ' herhalingen met ' + _w + ' kilo. Set ' + _sn + '!', ar: _r + ' تكرار بوزن ' + _w + ' كيلو. مجموعة ' + _sn + '!' }; window._speak(_vm[window.currentLang] || _vm.de); }
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
   } catch (err) { 
    console.error("Speicher-Fehler:", err); 
    window.showToast(window.t("toastError") + ": " + err.message); 
   }
  };

  window.cancelEdit = () => { const savedDate = document.getElementById('dateInput').value; window.editingWorkoutId = null; document.getElementById('workoutForm').reset(); document.getElementById('dateInput').value = savedDate; if (window.currentCategory === 'strength') { const sInput = document.getElementById('setsInput'); if (sInput) { sInput.value = 3; window.generateSetFields(3); } } document.getElementById('btnSaveText').innerHTML = (i18nData[window.currentLang] && i18nData[window.currentLang].fSave) || "Speichern"; document.getElementById('btnSubmitWorkout').classList.replace('bg-primary', 'bg-primary'); document.getElementById('btnSubmitIcon').classList.replace('fill-white/20', 'fill-black/20'); document.getElementById('btnSubmitWorkout').classList.replace('text-white', 'text-black'); document.getElementById('btnCancelEdit').classList.add('hidden'); };
  window.editEntry = (id) => { const w = window.workouts.find(x => x.id === id); if(!w) return; if(window.currentCategory !== w.category) window.switchCategory(w.category); window.editingWorkoutId = id; document.getElementById('dateInput').value = w.date; document.getElementById('exerciseInput').value = w.exercise; if (w.category === 'strength') { const sInput = document.getElementById('setsInput'); if(sInput && w.setDetails) { sInput.value = w.setDetails.length || 3; window.generateSetFields(sInput.value); setTimeout(() => { w.setDetails.forEach((s, idx) => { const i = idx + 1; const rEl = document.getElementById(`wdh_s${i}`); const wEl = document.getElementById(`weight_s${i}`); if(rEl) rEl.value = s.reps; if(wEl) wEl.value = s.weight; }); }, 50); } const eqInput = document.getElementById('equipmentInput'); if(eqInput && w.equipment) eqInput.value = w.equipment; } else { if(window.categorySchemas[w.category] && window.categorySchemas[w.category].schema) { window.categorySchemas[w.category].schema.forEach(field => { const el = document.getElementById('dyn_' + field.id); if(el && w.data[field.label] !== undefined) { el.value = w.data[field.label]; } }); } } document.getElementById('btnSaveText').textContent = "Update"; document.getElementById('btnSubmitWorkout').classList.replace('bg-primary', 'bg-primary'); document.getElementById('btnSubmitIcon').classList.replace('fill-black/20', 'fill-white/20'); document.getElementById('btnSubmitWorkout').classList.replace('text-black', 'text-white'); document.getElementById('btnCancelEdit').classList.remove('hidden'); document.getElementById('workoutForm').scrollIntoView({behavior: 'smooth'}); };
  window.deleteEntry = id => { window.showModal("Löschen?", "Diesen Eintrag wirklich löschen?", true, () => { const deleted = window.workouts.find(w => w.id === id); window.workouts = window.workouts.filter(w => w.id !== id); window.saveWorkoutsForCurrentClient(); window.renderTable(); window.calculateReadiness(); if(window.currentView === 'chart') window.initAnalytics(); if(deleted) { window._undoDeletedCloudId = id; window.showToast('Eintrag gelöscht', null, 'Rückgängig', () => { window.workouts.push(deleted); window.saveWorkoutsForCurrentClient(); window.renderTable(); window.calculateReadiness(); if(window.currentView === 'chart') window.initAnalytics(); if(window.syncToCloud) window.syncToCloud(deleted); window._undoDeletedCloudId = null; window.showToast('Wiederhergestellt!'); }, 5000); setTimeout(() => { if(window._undoDeletedCloudId === id && window.removeFromCloud) { window.removeFromCloud(id); window._undoDeletedCloudId = null; } }, 5500); } else { if(window.removeFromCloud) window.removeFromCloud(id); } }); };

  window.archiveWorkouts = () => { if(!Array.isArray(window.workouts)) return; const activeWorkouts = window.workouts.filter(w => !w.archived); if(activeWorkouts.length === 0) return window.showToast("Nichts zum Beenden da!"); let durationStr = document.getElementById('workoutTimerDisplay').textContent; if (durationStr === "00:00" && !window.isWorkoutTimerRunning) durationStr = ""; const totalDurationSecs = window.workoutTimerSeconds || 0; window.showModal("Workout Beenden", `Dauer: ${durationStr}. Notiz hinzufügen?`, true, async (commentVal) => { if(window.isWorkoutTimerRunning) window.toggleWorkoutTimer(); window.resetWorkoutTimer(); const sessionId = Date.now().toString(); let sessionVolume = 0; let sessionDist = 0; let isCardio = false; let exerciseNames = new Set(); activeWorkouts.forEach(w => { w.archived = true; w.sessionId = sessionId; if(durationStr) w.sessionDuration = durationStr; if(totalDurationSecs > 0) w.workoutDuration = totalDurationSecs; if(commentVal && commentVal.trim() !== '') w.sessionComment = commentVal.trim(); if(w.volume) sessionVolume += w.volume; if(w.category === 'cardio' && w.data) { isCardio = true; if(w.data['Distanz (km)'] || w.data['Distanz']) sessionDist += parseFloat((w.data['Distanz (km)'] || w.data['Distanz']).toString().replace(',','.')); } if(w.exercise) exerciseNames.add(w.exercise); }); window.saveWorkoutsForCurrentClient(); window.switchView('archive'); window.calculateReadiness(); window.showToast(window.t("toastArchived")); if (window._checkKiDiscovery) setTimeout(function() { window._checkKiDiscovery('workout-archived'); }, 3500); let durationDisplay = ''; if(totalDurationSecs > 0) { if(totalDurationSecs < 3600) durationDisplay = Math.floor(totalDurationSecs/60) + ' MIN'; else durationDisplay = Math.floor(totalDurationSecs/3600) + ':' + String(Math.floor((totalDurationSecs%3600)/60)).padStart(2,'0') + ' STD'; } window.showWorkoutCelebration({ mainNumber: isCardio ? sessionDist.toFixed(1) + ' km' : (sessionVolume > 0 ? Math.round(sessionVolume).toLocaleString() + ' kg' : activeWorkouts.length + 'x'), mainUnit: isCardio ? 'Distanz' : (sessionVolume > 0 ? 'Volumen' : 'Übungen'), subText: (durationDisplay ? durationDisplay + ' · ' : durationStr ? durationStr + ' · ' : '') + exerciseNames.size + ' Übungen', hasPR: false }); window._lastWorkoutBrag = { category: window.currentCategory === 'strength' ? 'Krafttraining' : window.currentCategory === 'cardio' ? 'Ausdauer' : window.currentCategory === 'recovery' ? 'Regeneration' : 'Training', duration: durationDisplay || durationStr || 'Beendet', exercises: String(activeWorkouts.length || 0), sets: String(activeWorkouts.reduce(function(sum, w) { return sum + (w.setDetails ? w.setDetails.length : 1); }, 0)), volume: String(Math.round(sessionVolume || 0)), exerciseList: activeWorkouts.slice(0, 6).map(function(w) { var detail = ''; if(w.setDetails && w.setDetails.length > 0) { detail = w.setDetails.length + ' Sets'; if(w.setDetails[0].weight) detail += ' \u00d7 ' + w.setDetails[0].weight + 'kg'; } else if(w.data) { var keys = Object.keys(w.data).slice(0, 2); detail = keys.map(function(k) { return k + ': ' + w.data[k]; }).join(' | '); } return { name: w.exercise || 'Uebung', detail: detail }; }) }; setTimeout(() => { let exString = Array.from(exerciseNames).join(', '); if(exString.length > 50) exString = exString.substring(0, 47) + '...'; window.showBragCard('workout', { duration: durationDisplay || durationStr || 'Beendet', volume: sessionVolume, distance: sessionDist.toFixed(2), category: isCardio ? 'cardio' : 'strength', exercises: exString }); }, 3500); if(window.syncToCloud) { for(const w of activeWorkouts) await window.syncToCloud(w); } if(window._updateChallengeProgress) window._updateChallengeProgress(); if(window._pushUpdateTrainingStats) window._pushUpdateTrainingStats(); window.checkReviewPrompt(); window.showPostWorkoutSocialProof(); if(window.awardXP) window.awardXP('workout'); if(window._checkGoalProgress) window._checkGoalProgress(); if(window._trackActivity) window._trackActivity('workout'); if(localStorage.getItem('base_anon_challenge_id') && !(window._chGetUid && window._chGetUid() && !window._chGetUid().startsWith('anon_'))) { var cnt = parseInt(localStorage.getItem('base_anon_workout_count') || '0') + 1; localStorage.setItem('base_anon_workout_count', cnt.toString()); } if (window._speak) { var _eM = { de: 'Workout beendet! ' + (exerciseNames ? exerciseNames.size : 0) + ' Uebungen, ' + Math.round(sessionVolume || 0) + ' Kilo Volumen. Starke Leistung!', en: 'Workout complete! ' + (exerciseNames ? exerciseNames.size : 0) + ' exercises, ' + Math.round(sessionVolume || 0) + ' kilos volume. Great work!', fr: 'Entrainement termine! ' + (exerciseNames ? exerciseNames.size : 0) + ' exercices. Beau travail!', es: 'Entrenamiento completo! ' + (exerciseNames ? exerciseNames.size : 0) + ' ejercicios. Gran trabajo!', it: 'Allenamento completato! ' + (exerciseNames ? exerciseNames.size : 0) + ' esercizi. Ottimo lavoro!', nl: 'Workout voltooid! ' + (exerciseNames ? exerciseNames.size : 0) + ' oefeningen. Goed gedaan!', ar: 'انتهى التمرين! ' + (exerciseNames ? exerciseNames.size : 0) + ' تمارين. عمل رائع!' }; window._speak(_eM[window.currentLang] || _eM.de, 'high'); } setTimeout(function() { if (window._showPostWorkoutCoachNudge) { window._showPostWorkoutCoachNudge({ exercises: String(exerciseNames ? exerciseNames.size : 0), volume: String(Math.round(sessionVolume || 0)), duration: durationDisplay || durationStr || '' }); } }, 5000); }, true); };
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

  window._showPostWorkoutCoachNudge = function(workoutData) {
   var today = new Date().toISOString().split('T')[0];
   var lastNudge = localStorage.getItem('base_coach_nudge_date');
   if (lastNudge === today) return;
   var archived = (window.workouts || []).filter(function(w) { return w.archived; });
   if (archived.length < 3) return;
   localStorage.setItem('base_coach_nudge_date', today);
   var messages = [
    window.t('coachNudge1', 'Dein KI Coach hat dein Workout analysiert — tippe fuer Tipps'),
    window.t('coachNudge2', 'Basierend auf deinem Workout: Dein Coach hat Empfehlungen'),
    window.t('coachNudge3', 'Starkes Workout! Dein KI Coach hat Verbesserungsvorschlaege')
   ];
   var msg = messages[Math.floor(Math.random() * messages.length)];
   var exerciseCount = workoutData.exercises || '0';
   var duration = workoutData.duration || '';
   var nudge = document.createElement('div');
   nudge.id = 'coachNudgeBar';
   nudge.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;z-index:600;animation:slideUp 0.4s ease';
   nudge.innerHTML = '<div onclick="window._openCoachFromNudge()" class="flex items-center gap-3 p-4 rounded-2xl cursor-pointer pointer-events-auto" style="background:linear-gradient(135deg,rgba(163,201,168,0.15),rgba(163,201,168,0.05));border:1px solid rgba(163,201,168,0.25);backdrop-filter:blur(8px)">' +
    '<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.2)">' +
    '<i data-lucide="sparkles" class="w-5 h-5 pointer-events-none" style="color:#a3c9a8"></i></div>' +
    '<div class="flex-1 min-w-0">' +
    '<p class="text-xs font-black text-white truncate">' + window._escapeHtml(msg) + '</p>' +
    '<p class="text-[10px] font-bold uppercase tracking-widest" style="color:#a3c9a8">KI Coach' + (duration ? ' \u00b7 ' + window._escapeHtml(duration) : '') + ' \u00b7 ' + window._escapeHtml(exerciseCount) + ' ' + window.t('lblExercises', 'Uebungen') + '</p>' +
    '</div>' +
    '<i data-lucide="chevron-right" class="w-4 h-4 flex-shrink-0 pointer-events-none" style="color:#a3c9a8"></i>' +
    '</div>';
   var dismiss = document.createElement('button');
   dismiss.setAttribute('aria-label', window.t('btnClose', 'Schliessen'));
   dismiss.className = 'pointer-events-auto';
   dismiss.style.cssText = 'position:absolute;top:8px;right:8px;background:none;border:none;color:#555;font-size:16px;cursor:pointer;padding:4px;line-height:1';
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

  window.openGoalModal = function() {
   window.showModal(
    '🎯 Neues Ziel',
    `<div class="space-y-3 mt-2">
     <div>
      <p class="text-[10px] font-bold uppercase tracking-widest mb-1.5" style="color:var(--text-muted)" data-i18n="lblExercises">Übung</p>
      <input type="text" id="goalExercise" aria-label="Zielübung" list="exerciseListV2" placeholder="z.B. Bankdrücken" class="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none cursor-text pointer-events-auto" style="background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)">
     </div>
     <div>
      <p class="text-[10px] font-bold uppercase tracking-widest mb-1.5" style="color:var(--text-muted)">Zielgewicht (kg)</p>
      <input type="number" id="goalWeight" aria-label="Zielgewicht in kg" placeholder="z.B. 100" class="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none cursor-text pointer-events-auto" style="background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)">
     </div>
     <div>
      <p class="text-[10px] font-bold uppercase tracking-widest mb-1.5" style="color:var(--text-muted)">Deadline</p>
      <input type="date" id="goalDate" aria-label="Deadline" class="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none cursor-pointer pointer-events-auto" style="background:var(--bg-hex);border:1px solid var(--border-hex);color:var(--text-main)">
     </div>
    </div>`,
    true,
    () => {
     const exercise = document.getElementById('goalExercise')?.value?.trim();
     const weight = parseFloat(document.getElementById('goalWeight')?.value);
     const date = document.getElementById('goalDate')?.value;
     if(!exercise || !weight) { window.showToast(window.t('toastError', 'Bitte Übung und Zielgewicht eingeben')); return; }
     _goals.push({ id: Date.now().toString(), exercise, targetWeight: weight, deadline: date || null, createdAt: new Date().toISOString() });
     localStorage.setItem('base_goals', JSON.stringify(_goals));
     window.renderGoals();
     window.showToast('🎯 Ziel gesetzt!');
    }
   );
   setTimeout(() => {
    const dateEl = document.getElementById('goalDate');
    if(dateEl) {
     const d = new Date(); d.setMonth(d.getMonth() + 3);
     dateEl.value = d.toISOString().split('T')[0];
    }
    window._refreshLucide();
   }, 100);
  };

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

  window.deleteGoal = function(id) {
   _goals = _goals.filter(g => g.id !== id);
   localStorage.setItem('base_goals', JSON.stringify(_goals));
   window.renderGoals();
  };

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
   window.showInputModal('Fortschritt hinzufuegen (' + unit + ')', '0', function(val) {
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
   window._ensureChartJS().catch(e => console.error('Chart.js laden fehlgeschlagen:', e));
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
    const res = await fetch('/.netlify/functions/stripe-checkout', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
      plan: plan,
      userId: user.uid,
      userEmail: user.email || ''
     })
    });
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

    var res = await fetch('/.netlify/functions/push', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
      subscription: sub.toJSON(),
      notification: notification
     })
    });
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
   if(!list || !Array.isArray(window.workouts)) return;
   const filtered = window.currentCategory === 'all'
    ? window.workouts
    : window.workouts.filter(w => w.category === window.currentCategory);
   const unique = [...new Set(filtered.map(w => w.exercise).filter(Boolean))].sort();
   list.innerHTML = unique.map(ex => `<option value="${window._escapeHtml(ex)}">`).join('');
  };
  window._tableSortKey = null;
  window._tableSortAsc = true;
  window.sortTable = function(key) {
   if(window._tableSortKey === key) { window._tableSortAsc = !window._tableSortAsc; }
   else { window._tableSortKey = key; window._tableSortAsc = true; }
   ['date','exercise','weight'].forEach(k => { const th = document.getElementById('sortTh_'+k); if(th) th.setAttribute('aria-sort', k === key ? (window._tableSortAsc ? 'ascending' : 'descending') : 'none'); });
   window.renderTable();
  };
  window.renderTable = function() { const body = document.getElementById('historyTableBody'); const mobileList = document.getElementById('mobileCardList'); if(!body) return; body.innerHTML = ''; if(mobileList) mobileList.innerHTML = ''; if(!Array.isArray(window.workouts)) return; let preparedWorkouts = window.workouts.map(w => { if(w.id && String(w.id).startsWith('strava_')) w.category = 'cardio'; return w; }); let filteredWorkouts = preparedWorkouts; if (window.currentTableFilter !== 'all') filteredWorkouts = preparedWorkouts.filter(w => w.category === window.currentTableFilter); filteredWorkouts = filteredWorkouts.filter(w => window.currentView === 'active' ? !w.archived : w.archived); if(window._tableSortKey) { const dir = window._tableSortAsc ? 1 : -1; filteredWorkouts.sort((a, b) => { if(window._tableSortKey === 'date') { return dir * (a.date || '').localeCompare(b.date || ''); } else if(window._tableSortKey === 'exercise') { return dir * (a.exercise || '').localeCompare(b.exercise || ''); } else if(window._tableSortKey === 'weight') { return dir * ((a.maxWeight || 0) - (b.maxWeight || 0)); } return 0; }); } const reversed = window._tableSortKey ? filteredWorkouts : [...filteredWorkouts].reverse(); const hist = {}; reversed.forEach(w => { const k = w.category + '_' + w.exercise.toLowerCase(); w.progressBadge = ''; if(hist[k]) { const l = hist[k]; if (w.category === 'strength') { let curV = w.volume || 0, lastV = l.volume || 0; let curW = w.maxWeight || 0, lastW = l.maxWeight || 0; if (curW > lastW && lastW > 0) { const pct = (((curW - lastW) / lastW) * 100).toFixed(1); w.progressBadge = `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-1.5 py-0.5 rounded-full shadow-sm ml-2">+${pct}% kg</span>`; } else if (curW < lastW && lastW > 0) { const pct = (((lastW - curW) / lastW) * 100).toFixed(1); w.progressBadge = `<span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] px-1.5 py-0.5 rounded-full shadow-sm ml-2">-${pct}% kg</span>`; } } else if (w.category === 'cardio' && w.data && l.data) { let curDist = parseFloat((w.data['Distanz (km)'] || w.data['Distanz'] || '0').toString().replace(',','.')); let lastDist = parseFloat((l.data['Distanz (km)'] || l.data['Distanz'] || '0').toString().replace(',','.')); if(curDist > lastDist && lastDist > 0) { w.progressBadge = `<span class="bg-[#fc4c02]/10 text-[#fc4c02] border border-[#fc4c02]/20 text-[10px] px-1.5 py-0.5 rounded-full shadow-sm ml-2">+${(curDist - lastDist).toFixed(2)} km</span>`; } } } hist[k] = w; }); let lastSessionId = null; filteredWorkouts.forEach(w => { if (window.currentView === 'archive' && w.archived && w.sessionId && w.sessionId !== lastSessionId) { if (w.sessionDuration || w.sessionComment) { const sessionTr = document.createElement('tr'); sessionTr.className = "bg-primary/5 border-b border-primary/20"; sessionTr.innerHTML = `<td colspan="4" class="p-3 px-5 shadow-sm"><div class="flex items-center justify-between"><div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">${w.sessionDuration ? `<span class="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-widest"><i data-lucide="timer" class="w-3.5 h-3.5"></i> ${w.sessionDuration}</span>` : ''}${w.sessionComment ? `<span class="text-[11px] text-zinc-300 italic flex items-center gap-1.5"><i data-lucide="message-square" class="w-3.5 h-3.5 text-zinc-500"></i> "${window._escapeHtml(w.sessionComment)}"</span>` : ''}</div><button onclick="window.shareWorkout('${w.id}')" class="text-[10px] font-black bg-primary/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded uppercase tracking-widest hover:bg-primary/20 transition-colors flex items-center gap-1 shadow-sm cursor-pointer pointer-events-auto interactive-z"><i data-lucide="share-2" class="w-3 h-3"></i> Posten</button></div></td>`; body.appendChild(sessionTr); } lastSessionId = w.sessionId; } let dataHtml = ""; if (w.category === 'strength' && w.setDetails && w.setDetails.length > 0) { dataHtml = `<div class="flex flex-wrap gap-2">`; w.setDetails.forEach((s, i) => { dataHtml += `<span class="bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-zinc-700">${s.reps}x${s.weight}kg${s.rir != null ? '<span class="ml-1 text-[8px]" style="color:#a3c9a8">R'+s.rir+'</span>' : ''}</span>`; }); dataHtml += `</div>`; } else if(w.data) { const keys = Object.keys(w.data); const det = keys.map(k => `<div class="flex flex-col mb-1 sm:mb-0 mr-4"><span class="text-[9px] text-zinc-500 uppercase font-black tracking-widest">${window._escapeHtml(k)}</span><span class="text-white font-bold text-xs">${window._escapeHtml(String(w.data[k]))}</span></div>`).join(''); dataHtml = `<div class="flex flex-wrap items-center">${det}</div>`; } let sportCatDisplay = w.sportCategory || 'Aktivität'; if(w.category === 'strength') sportCatDisplay = w.equipment || 'Krafttraining'; else if(w.category === 'cardio') sportCatDisplay = w.sportCategory || 'Ausdauer'; const cat = w.category || 'main'; const ui = window.CAT_UI[cat] || window.CAT_UI['main']; const isStrava = w.id && String(w.id).startsWith('strava_'); const stravaBadge = isStrava ? `<span class="bg-[#fc4c02]/20 text-[#fc4c02] text-[9px] uppercase font-black px-1.5 py-0.5 rounded ml-2">Strava</span>` : ''; const tr = document.createElement('tr'); tr.className = "hover:bg-white/5 border-b border-zinc-800/40 transition-colors group"; tr.innerHTML = ` <td class="px-5 py-4 shadow-sm"><div class="flex flex-col gap-1"><span class="text-zinc-500 text-[10px] font-black italic">${w.date.substring(5)}</span><span class="inline-flex items-center justify-center w-6 h-6 rounded border ${ui.bg} ${ui.border} ${ui.color}"><i data-lucide="${ui.icon}" class="w-3 h-3"></i></span></div></td> <td class="px-5 py-4 shadow-sm"><div class="flex flex-col"><span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5 flex items-center">${window._escapeHtml(sportCatDisplay)} ${stravaBadge}</span><span onclick="event.stopPropagation(); window.openExerciseHistory('${window._escapeHtml(w.exercise).replace(/'/g, "&#39;")}')" class="font-bold text-white text-sm tracking-tight flex items-center cursor-pointer pointer-events-auto hover:text-primary transition-colors">${window._escapeHtml(w.exercise)} ${w.progressBadge || ''}</span></div></td> <td class="px-5 py-4 shadow-sm">${dataHtml}</td> <td class="px-5 py-4 text-right whitespace-nowrap"><button aria-label="Teilen" onclick="window.shareWorkout('${w.id}')" class="text-zinc-600 hover:text-primary transition-all p-2 cursor-pointer pointer-events-auto interactive-z"><i data-lucide="share-2" class="w-4 h-4 pointer-events-none"></i></button>${!isStrava && !w.archived ? `<button aria-label="Edit 2" onclick="window.editEntry('${w.id}')" class="text-zinc-600 hover:text-primary transition-all p-2 opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto interactive-z"><i data-lucide="edit-2" class="w-4 h-4 pointer-events-none"></i></button>` : ''}<button aria-label="Löschen" onclick="window.deleteEntry('${w.id}')" class="text-zinc-600 hover:text-rose-500 transition-all p-2 cursor-pointer pointer-events-auto interactive-z"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button></td> `; body.appendChild(tr);
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
    <p onclick="event.stopPropagation(); window.openExerciseHistory('${window._escapeHtml(w.exercise).replace(/'/g, "&#39;")}')" class="font-bold text-white text-[15px] tracking-tight cursor-pointer pointer-events-auto hover:text-primary transition-colors flex items-center" style="font-family:'Sora',sans-serif">${_exThumb}${window._escapeHtml(w.exercise)}</p>
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
   ${!isStrava && !w.archived ? `<button onclick="window.editEntry('${w.id}')" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><i data-lucide="edit-2" class="w-3 h-3 text-zinc-500 pointer-events-none"></i></button>` : ''}
   <button onclick="window.shareWorkout('${w.id}')" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><i data-lucide="share-2" class="w-3 h-3 text-zinc-500 pointer-events-none"></i></button>
   <button onclick="window.deleteEntry('${w.id}')" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><i data-lucide="trash-2" class="w-3 h-3 text-zinc-500 hover:text-rose-400 pointer-events-none"></i></button>
  </div>
    `;
    mobileList.appendChild(card);
} }); window._refreshLucide(); window.updateExerciseAutocomplete(); const emptyState = document.getElementById('emptyWorkoutState'); if(emptyState) { const hasRows = body.children.length > 0 || (mobileList && mobileList.children.length > 0); if(!hasRows) { emptyState.classList.remove('hidden'); emptyState.classList.add('block'); } else { emptyState.classList.add('hidden'); emptyState.classList.remove('block'); } } const vc = document.getElementById('verlaufCount'); if(vc) vc.textContent = filteredWorkouts.length + ' Sessions'; };
  document.body.addEventListener('click', function(e) { if(!e.target.closest('.workout-card-menu') && !e.target.closest('[onclick*="nextElementSibling"]')) { document.querySelectorAll('.workout-card-menu.show').forEach(m => m.classList.remove('show')); } });
  window.exportToCSV = () => { if(!Array.isArray(window.workouts) || window.workouts.length === 0) { window.showToast(window.t("toastNoData")); return; } let allDynamicKeys = new Set(); window.workouts.forEach(w => { if(w.data) Object.keys(w.data).forEach(k => allDynamicKeys.add(k)); }); const dynamicHeaders = Array.from(allDynamicKeys); let csv = "Datum;Kategorie;Sportart;Aktivitaet;Dauer;Notiz;" + dynamicHeaders.join(";") + "\n"; window.workouts.forEach(w => { let row = [ w.date || "", w.category || "", w.sportCategory || "", w.exercise || "", w.sessionDuration || "", (w.sessionComment || "").replace(/;/g, ',').replace(/\n/g, ' ') ]; dynamicHeaders.forEach(header => { let val = (w.data && w.data[header] !== undefined) ? w.data[header] : ""; row.push(String(val).replace(/;/g, ',')); }); csv += row.join(";") + "\n"; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `BASE_Export.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.showToast(window.t("toastExported")); };

  window.initAnalytics = function() { if(!Array.isArray(window.workouts)) return; if(window._renderMuscleBalance) window._renderMuscleBalance(); window._ensureChartJS().then(() => window._initAnalyticsCore()).catch(e => console.error('Chart.js laden fehlgeschlagen:', e)); };
  window._initAnalyticsCore = function() { const exSelect = document.getElementById('analyticsExercise'); const uniqueExercises = [...new Set(window.workouts.map(w => w.exercise))].filter(Boolean); if (uniqueExercises.length === 0) { exSelect.innerHTML = '<option value="">' + window.t('toastNoData','Keine Daten') + '</option>'; document.getElementById('analyticsMetric').innerHTML = '<option value="">-</option>'; if(window.v2ChartInstance) window.v2ChartInstance.destroy(); return; } const currentSelection = exSelect.value; exSelect.innerHTML = uniqueExercises.map(ex => `<option value="${window._escapeHtml(ex)}">${window._escapeHtml(ex)}</option>`).join(''); if (currentSelection && uniqueExercises.includes(currentSelection)) exSelect.value = currentSelection; window.updateAnalyticsMetrics(); }
  window.updateAnalyticsMetrics = function() { const selectedExercise = document.getElementById('analyticsExercise').value; const metricSelect = document.getElementById('analyticsMetric'); if(!selectedExercise || !Array.isArray(window.workouts)) return; const relevantWorkouts = window.workouts.filter(w => w.exercise === selectedExercise); let allKeys = new Set(); relevantWorkouts.forEach(w => { if(w.data) Object.keys(w.data).forEach(k => allKeys.add(k)); }); const keysArray = Array.from(allKeys); if (keysArray.length === 0) { metricSelect.innerHTML = '<option value="">' + window.t('noMetrics','Keine Metriken') + '</option>'; if(window.v2ChartInstance) window.v2ChartInstance.destroy(); return; } const currentMetric = metricSelect.value; metricSelect.innerHTML = keysArray.map(k => `<option value="${window._escapeHtml(k)}">${window._escapeHtml(k)}</option>`).join(''); if(currentMetric && keysArray.includes(currentMetric)) metricSelect.value = currentMetric; window.renderV2Chart(); };
  window.renderV2Chart = function() { const ex = document.getElementById('analyticsExercise').value; const metric = document.getElementById('analyticsMetric').value; if(!ex || !metric || !Array.isArray(window.workouts)) return; let chartData = window.workouts.filter(w => w.exercise === ex && w.data && w.data[metric] !== undefined).sort((a,b) => new Date(a.date) - new Date(b.date)); const labels = chartData.map(w => w.date.substring(5)); const dataPoints = chartData.map(w => { let val = String(w.data[metric]).replace(',', '.'); if(val.includes(':')) { const parts = val.split(':'); if(parts.length === 2) return parseInt(parts[0]) + (parseInt(parts[1])/60); } let floatVal = parseFloat(val); return isNaN(floatVal) ? 0 : floatVal; }); const ctx = document.getElementById('v2Chart').getContext('2d'); if(window.v2ChartInstance) window.v2ChartInstance.destroy(); const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#06b6d4'; window.v2ChartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: metric, data: dataPoints, backgroundColor: primaryColor + '20', borderColor: primaryColor, borderWidth: 3, fill: true, tension: 0.4, pointBackgroundColor: primaryColor, pointBorderColor: '#000', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#a1a1aa', font: { family: 'Inter' } } }, x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { family: 'Inter', weight: 'bold' } } } }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#18181b', titleColor: '#fff', bodyColor: primaryColor, bodyFont: { weight: 'bold', size: 14 }, borderColor: '#27272a', borderWidth: 1, padding: 12, cornerRadius: 12, displayColors: false } } } }); };

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
     tmp.querySelectorAll('script,iframe,object,embed,form').forEach(function(el) { el.remove(); });
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

   const entry = { id: Date.now().toString(), date, weight, fat, chest, waist, hip };
   const existing = bodyMeasurements.findIndex(e => e.date === date);
   if(existing > -1) bodyMeasurements[existing] = entry;
   else bodyMeasurements.unshift(entry);
   bodyMeasurements.sort((a,b) => new Date(b.date) - new Date(a.date));

   window.saveBodyData();
   window.renderBodySection();

   ['bodyWeight','bodyFat','bodyChest','bodyWaist','bodyHip'].forEach(id => {
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
   window._ensureChartJS().then(() => window._renderBodyChartCore()).catch(e => console.error('Chart.js laden fehlgeschlagen:', e));
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
   ['muscleSection','calendarSection','heatmapSection'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
   });
   ['btnAnalyse-muscles','btnAnalyse-calendar','btnAnalyse-heatmap'].forEach(id => {
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
    window._refreshLucide();
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
   } else {
    workoutPanels.forEach(p => { if(p && p.id === 'viewTableContainer') p.classList.remove('hidden'); });
    if(bodyPanel) { bodyPanel.classList.add('hidden'); bodyPanel.classList.remove('block'); }
    window.renderTable();
   }
  };

  let currentTab = 'training';

  window.switchTab = function(tab) {
   currentTab = tab;
   document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
   const panel = document.getElementById('tab-' + tab);
   if(panel) panel.classList.remove('hidden');
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
   }
   if(tab === 'analyse' && window.currentView === 'chart') window.initAnalytics();
   if(tab === 'menu') { setTimeout(() => { if(window.updatePushToggleUI) window.updatePushToggleUI(); }, 100); window.renderGoals && window.renderGoals(); }
   window._refreshLucide();
  };

  window.toggleModal = function(id) {
   if(id === 'settingsModal') { window.switchTab('menu'); return; }
   const modal = document.getElementById(id);
   if (!modal) return;
   if (modal.classList.contains('hidden')) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    void modal.offsetHeight;
    if (id === 'feedbackModal') {
     document.querySelectorAll('input[name="fbstar"], input[name="fbcat"]').forEach(function(r) { r.checked = false; });
     document.querySelectorAll('.feedback-star, .feedback-cat').forEach(function(el) { el.style.borderColor = ''; el.style.color = ''; el.style.background = ''; });
     _feedbackStar = 0; _feedbackCat = '';
     var ft = document.getElementById('feedbackText'); if(ft) ft.value = '';
     var fe = document.getElementById('feedbackEmail'); if(fe) fe.value = '';
    }
   } else {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
   }
   window._refreshLucide();
  };

  (function() {
   function setupLastTimeOverlay() {
    var input = document.getElementById('exerciseInput');
    if(!input) return;
    var debounce = null;
    function onExerciseChange() {
     clearTimeout(debounce);
     debounce = setTimeout(function() {
      var name = input.value.trim();
      if(name.length < 2) { window._hideLastTime(); if(window._showExerciseImage) { var c = document.getElementById('exerciseImageContainer'); if(c) c.classList.add('hidden'); } return; }
      window._showLastTime(name);
      if(window._showExerciseImage) window._showExerciseImage(name);
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

  window._showLastTime = function(exerciseName) {
   var overlay = document.getElementById('lastTimeOverlay');
   var valuesEl = document.getElementById('lastTimeValues');
   var dateEl = document.getElementById('lastTimeDate');
   var suggestionEl = document.getElementById('lastTimeSuggestion');
   var sugTextEl = document.getElementById('lastTimeSugText');
   if(!overlay || !valuesEl) return;
   var workouts = (window.workouts || []).filter(function(w) { return w.archived; });
   var nameLower = exerciseName.toLowerCase();
   var matches = workouts.filter(function(w) { return w.exercise && w.exercise.toLowerCase() === nameLower; });
   if(matches.length === 0) {
    matches = workouts.filter(function(w) { return w.exercise && (w.exercise.toLowerCase().includes(nameLower) || nameLower.includes(w.exercise.toLowerCase())); });
   }
   if(matches.length === 0) { window._hideLastTime(); return; }
   matches.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
   var last = matches[0];
   var category = last.category || window.currentCategory || 'strength';
   var daysDiff = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
   var dateStr = daysDiff === 0 ? 'Heute' : daysDiff === 1 ? 'Gestern' : daysDiff < 7 ? 'vor ' + daysDiff + ' Tagen' : daysDiff < 30 ? 'vor ' + Math.floor(daysDiff/7) + ' Wo' : new Date(last.date).toLocaleDateString('de-DE',{day:'numeric',month:'short'});
   dateEl.textContent = dateStr;
   var result = window._getProgressionData(last, matches, category);
   valuesEl.innerHTML = result.display;
   if(result.suggestion) { suggestionEl.classList.remove('hidden'); sugTextEl.textContent = result.suggestion; }
   else { suggestionEl.classList.add('hidden'); }
   overlay.classList.remove('hidden');
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
    if(window._showExerciseImage) window._showExerciseImage(exercise);
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
    if(window._showExerciseImage) window._showExerciseImage(text.trim());
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

   const badge = document.getElementById('streakBadge');
   if(badge) {
    const badgeCount = badge.querySelector('#streakWeekCount') || badge;
    if(streak > 0) {
     if(badgeCount.id === 'streakWeekCount') badgeCount.textContent = streak;
     badge.classList.remove('hidden');
     badge.classList.add('inline-flex');
    } else {
     badge.classList.add('hidden');
     badge.classList.remove('inline-flex');
    }
   }

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
   return orms;
  };

  window.openOneRMModal = function() {
   const orms = window.get1RMsFromHistory();
   const listEl = document.getElementById('orm_history_list');
   const emptyEl = document.getElementById('orm_history_empty');
   const entries = Object.entries(orms).sort((a,b) => b[1].value - a[1].value);
   if(entries.length === 0) {
    if(listEl) listEl.innerHTML = '';
    if(emptyEl) { emptyEl.classList.remove('hidden'); emptyEl.classList.add('block'); }
   } else {
    if(emptyEl) { emptyEl.classList.add('hidden'); emptyEl.classList.remove('block'); }
    if(listEl) listEl.innerHTML = entries.map(([ex, d]) => `
     <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:border-orange-500/30 transition-all cursor-pointer pointer-events-auto" onclick="document.getElementById('orm_weight').value=${d.weight}; document.getElementById('orm_reps').value=${d.reps}; window.calcORM();">
      <div>
       <p class="text-white font-black text-sm">${window._escapeHtml(ex)}</p>
       <p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">${d.weight}kg × ${d.reps}Wdh · ${d.date}</p>
      </div>
      <div class="text-right">
       <p class="text-[10px] font-black text-orange-400 uppercase tracking-widest">~1RM</p>
       <p class="text-2xl font-black text-white">${d.value} <span class="text-sm text-zinc-500">kg</span></p>
      </div>
     </div>`).join('');
   }
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
   const el = document.getElementById('bragCardContent');
   if(!el) { window.showToast(window.t('toastError', 'Download nicht verfügbar')); return; }
   window._ensureHtml2Canvas().then(() => html2canvas(el, { backgroundColor: '#09090b', scale: 2, useCORS: true })).then(canvas => {
    const a = document.createElement('a');
    a.download = 'BASE_Workout_' + new Date().toISOString().slice(0,10) + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    window.showToast(window.t('toastSaved', 'Bild gespeichert! 📸'));
   }).catch(() => window.showToast(window.t('toastError')));
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

  // --- Canvas Brag Card (Instagram Story Format 1080x1920) ---
  window.generateWorkoutBragCard = function(data) {
   var canvas = document.createElement('canvas');
   canvas.width = 1080; canvas.height = 1920;
   var ctx = canvas.getContext('2d');
   var grad = ctx.createLinearGradient(0, 0, 0, 1920);
   grad.addColorStop(0, '#0f110f'); grad.addColorStop(0.5, '#111411'); grad.addColorStop(1, '#0a0c0a');
   ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1920);
   ctx.fillStyle = '#a3c9a8'; ctx.fillRect(0, 0, 1080, 4);
   ctx.fillStyle = '#a3c9a8'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'left';
   ctx.fillText('BASE', 80, 100);
   ctx.fillStyle = '#82828c'; ctx.font = '400 22px sans-serif';
   ctx.fillText(new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), 80, 140);
   ctx.strokeStyle = '#1e201e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(80, 170); ctx.lineTo(1000, 170); ctx.stroke();
   ctx.fillStyle = '#f4f4f5'; ctx.font = 'bold 64px sans-serif';
   ctx.fillText(data.category || 'Workout', 80, 260);
   ctx.fillStyle = '#a3c9a8'; ctx.font = 'bold 96px sans-serif';
   ctx.fillText(data.duration || '0 min', 80, 380);
   var stats = [
    { label: 'UEBUNGEN', value: String(data.exercises || 0) },
    { label: 'SETS', value: String(data.sets || 0) },
    { label: 'VOLUMEN', value: (data.volume || '0') + ' kg' }
   ];
   var gridY = 460;
   stats.forEach(function(stat, i) {
    var x = 80 + (i * 320);
    ctx.fillStyle = '#161816'; ctx.beginPath(); ctx.roundRect(x, gridY, 280, 100, 16); ctx.fill();
    ctx.strokeStyle = '#1e201e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, gridY, 280, 100, 16); ctx.stroke();
    ctx.fillStyle = '#82828c'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(stat.label, x + 140, gridY + 35);
    ctx.fillStyle = '#f4f4f5'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText(stat.value, x + 140, gridY + 75);
   });
   ctx.textAlign = 'left';
   if(data.exerciseList && data.exerciseList.length > 0) {
    var listY = 620;
    ctx.fillStyle = '#82828c'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('UEBUNGEN', 80, listY); listY += 20;
    data.exerciseList.slice(0, 6).forEach(function(ex, i) {
     var y = listY + (i * 70);
     ctx.fillStyle = i % 2 === 0 ? '#131513' : '#0f110f';
     ctx.beginPath(); ctx.roundRect(60, y, 960, 60, 12); ctx.fill();
     ctx.fillStyle = '#f4f4f5'; ctx.font = 'bold 24px sans-serif';
     ctx.fillText(ex.name || '', 90, y + 28);
     ctx.fillStyle = '#82828c'; ctx.font = '400 18px sans-serif';
     ctx.fillText(ex.detail || '', 90, y + 50);
    });
   }
   ctx.fillStyle = '#333'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
   ctx.fillText('Tracked mit BASE \u2014 base-app.tech', 540, 1860);
   ctx.fillStyle = '#252525'; ctx.font = '400 16px sans-serif';
   ctx.fillText('Kostenlos fuer alle Sportarten', 540, 1890);
   ctx.textAlign = 'left';
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
    { id: 'sets_won', label: 'Sätze gewonnen', type: 'number', placeholder: '2' },
    { id: 'sets_lost', label: 'Sätze verloren', type: 'number', placeholder: '0' },
    { id: 'points', label: 'Punkte gesamt', type: 'number', placeholder: '42' },
   ]},
   { id: 'squash', name: 'Squash', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'sets_won', label: 'Sätze gewonnen', type: 'number', placeholder: '3' },
    { id: 'points', label: 'Punkte gesamt', type: 'number', placeholder: '35' },
    { id: 'duration', label: 'Dauer (min)', type: 'number', placeholder: '45' },
   ]},
   { id: 'tischtennis', name: 'Tischtennis', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'sets_won', label: 'Sätze gewonnen', type: 'number', placeholder: '3' },
    { id: 'sets_lost', label: 'Sätze verloren', type: 'number', placeholder: '2' },
    { id: 'punkte', label: 'Punkte', type: 'number', placeholder: '55' },
   ]},
   { id: 'racquetball', name: 'Racquetball', icon: 'circle-dot', category: 'Rückschlag', color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', schema: [
    { id: 'sets_won', label: 'Sätze gewonnen', type: 'number', placeholder: '2' },
    { id: 'points', label: 'Punkte', type: 'number', placeholder: '30' },
    { id: 'duration', label: 'Dauer (min)', type: 'number', placeholder: '40' },
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
    { id: 'schnitt', label: 'Ø Geschw. (km/h)', type: 'number', placeholder: '20' },
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
    { id: 'art', label: 'Art', type: 'text', placeholder: 'Touring / Race / Surf' },
   ]},
   { id: 'kajak', name: 'Kajak / Kanu', icon: 'waves', category: 'Wasser', color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/30', schema: [
    { id: 'distanz', label: 'Distanz (km)', type: 'number', placeholder: '12' },
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '90' },
    { id: 'art', label: 'Art', type: 'text', placeholder: 'Wildwasser / Flachwater' },
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
    { id: 'runden', label: 'Runden', type: 'number', placeholder: '6' },
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '75' },
    { id: 'sparring', label: 'Sparring-Runden', type: 'number', placeholder: '3' },
   ]},
   { id: 'mma', name: 'MMA', icon: 'shield', category: 'Kampfsport', color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30', schema: [
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '90' },
    { id: 'runden', label: 'Sparring-Runden', type: 'number', placeholder: '3' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Wrestling / Striking' },
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
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '60' },
    { id: 'szenarien', label: 'Szenarien', type: 'number', placeholder: '8' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Befreiungsgriffe' },
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
    { id: 'punkte', label: 'Punkte', type: 'number', placeholder: '6' },
    { id: 'ergebnis', label: 'Ergebnis', type: 'text', placeholder: '7:5' },
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
    { id: 'dauer', label: 'Training (min)', type: 'number', placeholder: '90' },
    { id: 'geraet', label: 'Gerät', type: 'text', placeholder: 'z.B. Boden / Reck / Barren' },
    { id: 'elemente', label: 'Elemente trainiert', type: 'text', placeholder: 'z.B. Felgaufschwung' },
   ]},
   { id: 'yoga', name: 'Yoga', icon: 'sunrise', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '60' },
    { id: 'stil', label: 'Yoga-Stil', type: 'text', placeholder: 'z.B. Vinyasa / Hatha / Yin' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Hüftöffner / Schultern' },
   ]},
   { id: 'pilates', name: 'Pilates', icon: 'sunrise', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '50' },
    { id: 'art', label: 'Art', type: 'text', placeholder: 'Mat / Reformer' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Core / Rücken' },
   ]},
   { id: 'calisthenics', name: 'Calisthenics', icon: 'zap', category: 'Functional & Kraft', color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/30', schema: [
    { id: 'skill', label: 'Skill-Fokus', type: 'text', placeholder: 'z.B. Muscle-Up / Planche' },
    { id: 'versuche', label: 'Versuche', type: 'number', placeholder: '10' },
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '60' },
   ]},

   { id: 'tanzen', name: 'Tanzen', icon: 'music', category: 'Tanz & Bühne', color: 'text-pink-400', bg: 'bg-pink-400/20', border: 'border-pink-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '90' },
    { id: 'stil', label: 'Tanzstil', type: 'text', placeholder: 'z.B. Salsa / Swing / HipHop' },
    { id: 'choreographie', label: 'Choreographie', type: 'text', placeholder: 'Name / Beschreibung' },
   ]},
   { id: 'ballett', name: 'Ballett', icon: 'music', category: 'Tanz & Bühne', color: 'text-pink-400', bg: 'bg-pink-400/20', border: 'border-pink-400/30', schema: [
    { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: '75' },
    { id: 'fokus', label: 'Fokus', type: 'text', placeholder: 'z.B. Barre / Center / Pointe' },
    { id: 'stueck', label: 'Stück', type: 'text', placeholder: 'z.B. Schwanensee' },
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
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '60' },
    { id: 'moves', label: 'Neue Moves', type: 'text', placeholder: 'z.B. Kong, Precision' },
    { id: 'spot', label: 'Spot', type: 'text', placeholder: 'Ort' },
   ]},
   { id: 'skateboard', name: 'Skateboarden', icon: 'zap', category: 'Trend & Urban', color: 'text-violet-400', bg: 'bg-violet-400/20', border: 'border-violet-400/30', schema: [
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '90' },
    { id: 'tricks', label: 'Tricks landed', type: 'text', placeholder: 'z.B. Kickflip, Heelflip' },
    { id: 'spot', label: 'Spot / Skatepark', type: 'text', placeholder: 'Name' },
   ]},
   { id: 'bmx', name: 'BMX', icon: 'bike', category: 'Trend & Urban', color: 'text-violet-400', bg: 'bg-violet-400/20', border: 'border-violet-400/30', schema: [
    { id: 'dauer', label: 'Session (min)', type: 'number', placeholder: '60' },
    { id: 'tricks', label: 'Tricks', type: 'text', placeholder: 'z.B. Barspin, Tailwhip' },
    { id: 'spot', label: 'Spot', type: 'text', placeholder: 'Park / Street' },
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
    { id: 'games', label: 'Spiele', type: 'number', placeholder: '10' },
    { id: 'wins', label: 'Siege', type: 'number', placeholder: '7' },
    { id: 'disziplin', label: 'Disziplin', type: 'text', placeholder: '8-Ball / 9-Ball / Snooker' },
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
    get title() { return window.t('kiHintPlanTitle','Planner verfuegbar'); },
    get text() { return window.t('kiHintPlanText','Mit 3 Workouts hat die KI genug Daten fuer einen intelligenten Trainingsplan.'); },
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
    get text() { return window.t('kiHintPrehabText','Die KI erkennt einseitige Belastungen und schlaegt Aktivierungsuebungen vor.'); },
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
    get text() { return window.t('kiHintCopilotText','Der Spotter schlaegt dir fuer jede Uebung Saetze, Gewicht und RPE vor.'); },
    get ctaText() { return window.t('toolCopilot','Spotter testen'); },
    ctaAction: function() {
     window.switchTab('tools');
    }
   }
  ];

  const _kiOverviewHint = {
   flag: 'base_ki_hint_overview',
   icon: 'sparkles',
   get title() { return window.t('kiHintOverviewTitle','5 KI-Werkzeuge fuer dein Training'); },
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
       '<i data-lucide="' + hint.icon + '" class="w-4 h-4" style="color:#a3c9a8"></i>' +
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
   if (!usage.coach_used) hints.push({ icon: 'brain', label: window.t('hintCoach', 'KI Coach'), desc: window.t('hintCoachDesc', 'Analysiert dein Training und gibt dir persoenliche Empfehlungen'), action: 'analyzeWithAI' });
   if (!usage.plan_used) hints.push({ icon: 'calendar', label: window.t('hintPlan', 'Trainingsplan'), desc: window.t('hintPlanDesc', 'KI erstellt einen personalisierten Plan basierend auf deinen Daten'), action: 'openPlanBuilder' });
   if (!usage.prehab_used) hints.push({ icon: 'shield', label: window.t('hintPrehab', 'Verletzungspraevention'), desc: window.t('hintPrehabDesc', 'Aktivierungsuebungen und Warm-Up basierend auf deinem Training'), action: 'generatePreHab' });
   if (hints.length === 0) { container.classList.add('hidden'); return; }
   container.classList.remove('hidden');
   container.innerHTML = '<p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">' + window.t('hintTitle', 'Noch nicht entdeckt') + '</p>' +
    hints.slice(0, 2).map(function(h) {
     return '<div onclick="if(window.' + h.action + ')window.' + h.action + '()" class="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer pointer-events-auto transition-all" style="background:rgba(163,201,168,0.05);border:1px solid rgba(163,201,168,0.1)">' +
      '<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(163,201,168,0.1)"><i data-lucide="' + h.icon + '" class="w-4 h-4 pointer-events-none" style="color:#a3c9a8"></i></div>' +
      '<div><p class="text-xs font-bold text-white">' + window._escapeHtml(h.label) + '</p>' +
      '<p class="text-[9px]" style="color:var(--text-muted)">' + window._escapeHtml(h.desc) + '</p></div>' +
      '<i data-lucide="chevron-right" class="w-3 h-3 flex-shrink-0 pointer-events-none" style="color:#555"></i></div>';
    }).join('');
   window._refreshLucide();
  };

  // ============================================================
  // FOCUS MUSCLES + DAY ASSIGNMENT + INJURIES HELPER + MESOCYCLE
  // ============================================================
  window._FOCUS_MUSCLES = {
   upper: [
    { id: 'chest', de: 'Brust', en: 'Chest' },
    { id: 'upper_back', de: 'Ruecken (oben)', en: 'Upper Back' },
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
    { id: 'lower_back_muscle', de: 'Unterer Ruecken', en: 'Lower Back' }
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
     html += '<button type="button" onclick="window._toggleFocusMuscle(\'' + m.id + '\',\'' + (containerId || 'focusMuscleChips') + '\')" class="px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer pointer-events-auto transition-all" style="' + (sel ? 'background:rgba(163,201,168,0.15);border:1px solid rgba(163,201,168,0.3);color:#a3c9a8' : 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)') + '">' + window._escapeHtml(label) + '</button>';
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
    html += '<div class="p-3 rounded-xl mb-2" style="background:var(--inner-bg-hex);border:1px solid ' + (assigned ? 'rgba(163,201,168,0.3)' : 'var(--border-hex)') + '"><div class="flex items-center gap-2 mb-2"><span class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black" style="background:rgba(163,201,168,0.15);color:#a3c9a8">' + dn + '</span><span class="text-xs font-bold text-white">' + window.t('lblDay', 'Tag') + ' ' + dn + '</span></div><div class="flex gap-1.5">';
    for (var i = 0; i < 7; i++) {
     var isSel = assigned === dayIds[i];
     var isUsed = false;
     for (var k in window._trainingDayAssignment) { if (k !== 'day' + dn && window._trainingDayAssignment[k] === dayIds[i]) { isUsed = true; break; } }
     html += '<button type="button" onclick="window._assignDay(' + dn + ',\'' + dayIds[i] + '\')" class="flex-1 py-2 rounded-lg text-[10px] font-bold cursor-pointer pointer-events-auto transition-all" style="' + (isSel ? 'background:rgba(163,201,168,0.2);border:1px solid rgba(163,201,168,0.4);color:#a3c9a8' : isUsed ? 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:#333;opacity:0.4' : 'background:var(--inner-bg-hex);border:1px solid var(--border-hex);color:var(--text-muted)') + '">' + dayLabels[i] + '</button>';
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
   var html = '<div class="mb-4 p-4 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><p class="text-xs font-black text-white uppercase tracking-widest mb-3">' + window.t('mesoTitle', 'Mesozyklus') + '</p>';
   plan.mesoCycle.phases.forEach(function(phase, i) {
    var isDeload = phase.type === 'deload';
    var bg = isDeload ? 'rgba(138,175,232,0.1)' : i === 0 ? 'rgba(163,201,168,0.1)' : 'var(--inner-bg-hex)';
    var bc = isDeload ? 'rgba(138,175,232,0.25)' : i === 0 ? 'rgba(163,201,168,0.25)' : 'var(--border-hex)';
    var lc = isDeload ? '#8aafe8' : '#a3c9a8';
    var tl = { accumulation: window.t('mesoAccum', 'Akkumulation'), overreach: window.t('mesoOverreach', 'Overreach'), deload: 'Deload' }[phase.type] || phase.type;
    html += '<div class="flex items-center gap-3 p-3 rounded-xl mb-2" style="background:' + bg + ';border:1px solid ' + bc + '"><span class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black" style="background:' + (i === 0 ? 'rgba(163,201,168,0.2)' : 'var(--inner-bg-hex)') + ';color:' + lc + '">' + phase.week + '</span><div class="flex-1"><p class="text-xs font-bold text-white">' + window._escapeHtml(phase.name) + '</p><p class="text-[9px] text-zinc-500">Sets \u00d7' + phase.setsMultiplier + ' \u00b7 RIR ' + phase.targetRIR + '</p></div><span class="text-[8px] font-black uppercase px-2 py-1 rounded" style="color:' + lc + '">' + tl + (i === 0 ? ' \u00b7 ' + window.t('mesoCurrent', 'AKTUELL') : '') + '</span></div>';
   });
   html += '</div>';
   return html;
  };

  // ============================================================
  // EXERCISE SWAP
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
    if (ex.bp && current.bp && ex.bp === current.bp) score += 50;
    if (ex.t && current.t && ex.t === current.t) score += 30;
    if (ex.bp === current.bp && ex.t === current.t) score += 20;
    if (score > 0) alts.push({ name: lang === 'de' ? (ex.de || ex.n) : ex.n, bodyPart: ex.bp, target: ex.t, id: ex.id, matchScore: Math.min(score, 100) });
   }
   alts.sort(function(a, b) { return b.matchScore - a.matchScore; });
   return alts.slice(0, maxResults);
  };

  window.openExerciseSwap = function(exerciseName) {
   if (!exerciseName || !exerciseName.trim()) return;
   var alts = window._findExerciseAlternatives(exerciseName);
   if (alts.length === 0) { window.showToast(window.t('swapNoAlts', 'Keine Alternativen gefunden')); return; }
   var html = '<div class="mb-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">' + window.t('swapCurrent', 'Aktuelle Uebung') + '</p><p class="text-sm font-bold text-white">' + window._escapeHtml(exerciseName) + '</p></div>';
   html += '<p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">' + window.t('swapChoose', 'Waehle eine Alternative') + '</p>';
   alts.forEach(function(alt) {
    var mc = alt.matchScore >= 80 ? '#a3c9a8' : alt.matchScore >= 60 ? '#e8c86a' : '#e88a8a';
    var imgUrl = (alt.id && window._getExerciseImageUrl) ? window._getExerciseImageUrl(alt.id) : '';
    var imgHtml = imgUrl ? '<img src="' + imgUrl + '" alt="" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" onerror="this.style.display=\'none\'">' : '<div class="w-10 h-10 rounded-lg flex-shrink-0" style="background:var(--inner-bg-hex)"></div>';
    html += '<div onclick="window._confirmSwap(\'' + window._escapeHtml(alt.name).replace(/'/g, "\\'") + '\')" class="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">' + imgHtml + '<div class="flex-1 min-w-0"><p class="text-sm font-bold text-white truncate">' + window._escapeHtml(alt.name) + '</p><p class="text-[8px] text-zinc-500">' + window._escapeHtml(alt.bodyPart || '') + ' \u00b7 ' + window._escapeHtml(alt.target || '') + '</p></div><div class="text-right flex-shrink-0"><p class="text-sm font-black" style="color:' + mc + '">' + alt.matchScore + '%</p><div class="w-12 h-1.5 rounded-full mt-1" style="background:#1a1a1a"><div class="h-full rounded-full" style="width:' + alt.matchScore + '%;background:' + mc + '"></div></div></div></div>';
   });
   html += '<button onclick="window.toggleModal(\'exerciseSwapModal\')" class="w-full mt-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer pointer-events-auto" style="background:none;color:#888;border:1px solid var(--border-hex)">' + window.t('swapKeepOriginal', 'Original beibehalten') + '</button>';
   var content = document.getElementById('exerciseSwapContent');
   if (content) content.innerHTML = html;
   window.toggleModal('exerciseSwapModal');
  };

  window._confirmSwap = function(newName) {
   var input = document.getElementById('exerciseInput');
   if (input) { input.value = newName; input.dispatchEvent(new Event('change')); }
   if (window._showExerciseImage) window._showExerciseImage(newName);
   window.toggleModal('exerciseSwapModal');
   window.showToast(window.t('swapDone', 'Uebung getauscht!'));
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
   { id: 'bench', name: { de: 'Bankdruecken', en: 'Bench Press' }, icon: '\ud83d\udcaa' },
   { id: 'ohp', name: { de: 'Schulterdruecken', en: 'Overhead Press' }, icon: '\ud83d\ude46' },
   { id: 'row', name: { de: 'Rudern (Row)', en: 'Barbell Row' }, icon: '\ud83d\udea3' },
   { id: 'pullup', name: { de: 'Klimmzug', en: 'Pull-Up' }, icon: '\ud83e\uddd7' },
   { id: 'lunge', name: { de: 'Ausfallschritt', en: 'Lunge' }, icon: '\ud83e\uddbe' },
   { id: 'plank', name: { de: 'Plank', en: 'Plank' }, icon: '\ud83e\uddd8' },
   { id: 'pushup', name: { de: 'Liegestuetz', en: 'Push-Up' }, icon: '\ud83e\udef8' }
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
     '<p class="text-sm font-black text-white mb-3">' + window.t('fcSelectExercise', 'Welche Uebung moechtest du pruefen?') + '</p>' +
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
   cam.innerHTML = '<div class="mt-4 p-4 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><p class="text-xs font-bold text-white mb-1">' + window._escapeHtml(exName) + '</p><p class="text-[10px] text-zinc-500 mb-4">' + window.t('fcInstructions', 'Filme dich von der Seite. Ganzer Koerper sichtbar. 1 Wiederholung reicht.') + '</p><div class="flex gap-3"><button onclick="window._captureFormCheck(\'camera\')" class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.15);color:#a3c9a8;border:1px solid rgba(163,201,168,0.25)"><i data-lucide="camera" class="w-4 h-4 pointer-events-none"></i> ' + window.t('fcTakePhoto', 'Foto aufnehmen') + '</button><button onclick="window._captureFormCheck(\'upload\')" class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);color:#ccc;border:1px solid var(--border-hex)"><i data-lucide="upload" class="w-4 h-4 pointer-events-none"></i> ' + window.t('fcUpload', 'Bild hochladen') + '</button></div><div id="formCheckPreview" class="hidden mt-4"></div><div id="formCheckResult" class="hidden mt-4"></div></div>';
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
   if (resultEl) { resultEl.classList.remove('hidden'); resultEl.innerHTML = '<div class="flex items-center justify-center gap-2 py-6"><i data-lucide="loader-2" class="w-5 h-5 animate-spin" style="color:#a3c9a8"></i><span class="text-sm text-zinc-400">' + window.t('fcAnalyzing', 'Analysiere deine Form...') + '</span></div>'; window._refreshLucide(); }
   var langName = { de: 'Deutsch', en: 'English', fr: 'Francais', es: 'Espanol', it: 'Italiano', nl: 'Nederlands', ar: 'العربية' }[lang] || 'Deutsch';
   var prompt = 'Du bist ein erfahrener Strength & Conditioning Coach. Analysiere dieses Bild einer ' + exName + ' Uebung.\n\nWICHTIG: Du gibst NUR allgemeine Hinweise zur Uebungsform. Du stellst KEINE medizinischen Diagnosen.\n\nWenn das Bild KEINE erkennbare Uebungsausfuehrung zeigt, sage das klar.\n\nWenn du eine ' + exName + ' erkennst, analysiere:\n1. Koerperhaltung (Ruecken, Knie, Huefte)\n2. Bewegungstiefe\n3. Erkennbare Asymmetrien\n4. 2-3 konkrete Verbesserungsvorschlaege\n\nWenn du dir bei einem Aspekt NICHT sicher bist, sage "Aus diesem Winkel kann ich X nicht eindeutig beurteilen."\n\nMax 150 Woerter. Freundlich und motivierend.\n\nAntworte auf ' + langName + '.';
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
    if (resultEl) { resultEl.innerHTML = '<div class="p-4 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><div class="flex items-center gap-2 mb-3"><i data-lucide="scan-eye" class="w-4 h-4" style="color:#a3c9a8"></i><p class="text-xs font-black uppercase tracking-widest" style="color:#a3c9a8">' + window.t('fcResultTitle', 'Form-Analyse') + ' (Beta)</p></div><div class="text-sm text-zinc-300 leading-relaxed mb-4">' + window._sanitizeAIHtml(responseText) + '</div><div class="p-3 rounded-lg" style="background:rgba(232,138,138,0.06);border:1px solid rgba(232,138,138,0.12)"><p class="text-[9px] text-zinc-500 leading-relaxed">' + window._escapeHtml(disclaimer) + '</p></div><div class="flex gap-2 mt-3"><button onclick="window._captureFormCheck(\'camera\')" class="flex-1 py-2.5 rounded-lg text-[10px] font-bold cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.1);color:#a3c9a8;border:1px solid rgba(163,201,168,0.2)">' + window.t('fcRetry', 'Nochmal filmen') + '</button><button onclick="window.toggleModal(\'formCheckModal\')" class="flex-1 py-2.5 rounded-lg text-[10px] font-bold cursor-pointer pointer-events-auto" style="background:var(--inner-bg-hex);color:#888;border:1px solid var(--border-hex)">' + window.t('btnClose', 'Schliessen') + '</button></div></div>'; window._refreshLucide(); }
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
    warnings.push({ type: 'imbalance', text: window.t('balancePushHeavy', 'Push-Muskeln (Brust/Schultern) deutlich mehr als Pull (Ruecken). Kann zu Haltungsproblemen fuehren.'), suggestion: window.t('balancePushFix', 'Empfehlung: 2-3 Rueckenuebungen pro Woche (Rudern, Klimmzuege, Face Pulls)') });
   } else if (ppRatio && ppRatio < 0.6) {
    warnings.push({ type: 'imbalance', text: window.t('balancePullHeavy', 'Pull-Muskeln deutlich mehr als Push. Ergaenze Brust- und Schulteruebungen.'), suggestion: window.t('balancePullFix', 'Empfehlung: Bankdruecken, Schulterdruecken und Dips hinzufuegen') });
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
   var bpLabels = { chest: 'Brust', back: 'Ruecken', shoulders: 'Schultern', legs: 'Beine', core: 'Core/Bauch', arms: 'Arme' };
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
   if (!data) { container.innerHTML = '<p class="text-xs text-zinc-600 text-center py-4">' + window.t('balanceNoData', 'Tracke mindestens 5 Kraft-Workouts fuer die Muskelbalance-Analyse') + '</p>'; return; }
   var colors = { chest: '#e88a8a', back: '#8aafe8', shoulders: '#e8c86a', arms: '#a3c9a8', legs: '#e8b08a', core: '#a8a8e8', cardio: '#e88ab8' };
   var bpLabels = { chest: 'Brust', back: 'Ruecken', shoulders: 'Schultern', arms: 'Arme', legs: 'Beine', core: 'Core/Bauch', cardio: 'Cardio' };
   var html = '';
   if (data.warnings.length > 0) {
    html += '<div class="mb-4">';
    data.warnings.slice(0, 3).forEach(function(w) {
     var icon = w.type === 'skip_leg_day' ? '\ud83e\uddb5' : w.type === 'imbalance' ? '\u2696\ufe0f' : '\u26a0\ufe0f';
     html += '<div class="p-3 rounded-xl mb-2" style="background:rgba(232,138,138,0.08);border:1px solid rgba(232,138,138,0.15)">';
     html += '<p class="text-xs font-bold text-white flex items-center gap-2">' + icon + ' ' + window._escapeHtml(w.text) + '</p>';
     if (w.suggestion) html += '<p class="text-[10px] mt-1" style="color:#a3c9a8">' + window._escapeHtml(w.suggestion) + '</p>';
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
  window.BASE_XP = {
   sources: { workout: 50, coachChat: 15, scanAnalysis: 25, planGenerated: 40, challengeJoin: 30, goalComplete: 500, streak7: 200, streak30: 1000 },
   maxPerDay: { workout: 2, coachChat: 3, scanAnalysis: 1, planGenerated: 1, challengeJoin: 1 },
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
    '<span style="font-size:10px;font-weight:800;color:#a3c9a8;text-transform:uppercase;letter-spacing:0.1em;white-space:nowrap">' + rank.name + ' \u00b7 Lv ' + info.level + '</span>' +
    '<div style="flex:1;height:4px;background:#1e201e;border-radius:99px;overflow:hidden">' +
    '<div style="height:100%;width:' + pct + '%;background:#a3c9a8;border-radius:99px;transition:width 0.5s ease"></div></div>' +
    '<span style="font-size:9px;color:#82828c;white-space:nowrap">' + info.currentXP + '/' + info.nextLevelXP + ' XP</span></div>';
  };

  window._showLevelUp = function(level, rank) {
   var overlay = document.createElement('div');
   overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85)';
   overlay.innerHTML = '<div style="text-align:center"><p style="font-size:14px;color:#a3c9a8;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:8px">LEVEL UP!</p><p style="font-size:72px;font-weight:900;color:#f4f4f5;line-height:1">' + level + '</p><p style="font-size:18px;color:#a3c9a8;font-weight:700;margin-top:8px">' + rank.name + '</p><p style="font-size:13px;color:#82828c;margin-top:16px">Weiter so!</p></div>';
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
    html += '<div class="flex items-center gap-2 mb-2"><div style="flex:1;height:6px;background:#1e201e;border-radius:99px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:#a3c9a8;border-radius:99px;transition:width 0.3s"></div></div>';
    html += '<span class="text-xs font-bold" style="color:#a3c9a8">' + pct + '%</span></div>';
    html += '<div class="flex items-center justify-between"><span class="text-[10px] text-zinc-500">' + g.currentValue + ' / ' + g.targetValue + ' ' + window._escapeHtml(g.unit || '') + '</span>';
    html += '<span class="text-[10px] text-zinc-500">' + (daysLeft > 0 ? daysLeft + ' Tage' : 'Abgelaufen') + '</span></div>';
    if(pct >= 100) { html += '<button onclick="window.completeGoal(\'' + g.id + '\')" class="w-full mt-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto" style="background:rgba(163,201,168,0.15);color:#a3c9a8;border:1px solid rgba(163,201,168,0.3)">Ziel erreicht \u2014 500 XP!</button>'; }
    html += '</div>';
   }); }
   html += '</div>';
   if(completedGoals.length > 0) { html += '<p class="text-sm font-bold text-zinc-300 mb-3">Erreichte Ziele</p>';
    completedGoals.slice(0, 5).forEach(function(g) {
     html += '<div class="flex items-center gap-3 py-2 border-b border-zinc-800/50"><span style="color:#a3c9a8;font-size:16px">\u2713</span><div>';
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
   html += '<input id="goalTitle" type="text" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 mb-4 outline-none focus:border-zinc-600 pointer-events-auto" placeholder="z.B. 100kg Bankdruecken, 5km unter 25min...">';
   html += '<div class="grid grid-cols-2 gap-3 mb-4"><div><p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Zielwert</p>';
   html += '<input id="goalTarget" type="number" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 outline-none focus:border-zinc-600 pointer-events-auto" placeholder="100"></div>';
   html += '<div><p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Einheit</p>';
   html += '<input id="goalUnit" type="text" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 outline-none focus:border-zinc-600 pointer-events-auto" placeholder="kg, km, min..."></div></div>';
   html += '<p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Aktueller Stand</p>';
   html += '<input id="goalCurrent" type="number" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 mb-4 outline-none focus:border-zinc-600 pointer-events-auto" placeholder="80">';
   html += '<p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Deadline</p>';
   html += '<input id="goalDeadline" type="date" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm p-3 mb-4 outline-none focus:border-zinc-600 pointer-events-auto">';
   html += '<div class="flex gap-3"><button onclick="window.openGoalModal()" class="flex-1 py-3 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-bold cursor-pointer pointer-events-auto">Zurueck</button>';
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
   overlay.innerHTML = '<div style="text-align:center"><p style="font-size:48px;margin-bottom:16px">\uD83C\uDFAF</p><p style="font-size:14px;color:#a3c9a8;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:8px">ZIEL ERREICHT!</p><p style="font-size:24px;font-weight:900;color:#f4f4f5;margin-bottom:8px">' + window._escapeHtml(goal.title) + '</p><p style="font-size:36px;font-weight:900;color:#a3c9a8">+500 XP</p><p style="font-size:13px;color:#82828c;margin-top:16px">Setze dir dein naechstes Ziel!</p></div>';
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

