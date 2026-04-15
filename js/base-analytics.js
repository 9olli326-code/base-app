// ============================================================
// BASE ANALYTICS — Scores, Bio Age, DNA, Plateaus, Benchmarks
// Extrahiert aus base-settings.js fuer Modularisierung
// ============================================================

// ============================================================
// FEATURE: BASE SCORE (Gesamtfitness-Index 0-1000)
// ============================================================

window._calculateBASEScore = function() {
  var now = Date.now();
  var w4ago = new Date(now - 28 * 86400000).toISOString().split('T')[0];
  var w1ago = new Date(now - 7 * 86400000).toISOString().split('T')[0];
  var allWorkouts = (window.workouts || []).filter(function(w) { return w.archived; });
  var last4weeks = allWorkouts.filter(function(w) { return w.date >= w4ago; });
  var lastWeek = allWorkouts.filter(function(w) { return w.date >= w1ago; });

  // 1. Frequenz (0-250)
  var freqScore = Math.min(250, Math.round(last4weeks.length / 16 * 250));

  // 2. Volumen-Trend (0-250)
  var w1Vol = lastWeek.reduce(function(s, w) { return s + (w.volume || 0); }, 0);
  var w2Start = new Date(now - 14 * 86400000).toISOString().split('T')[0];
  var prevWeek = allWorkouts.filter(function(w) { return w.date >= w2Start && w.date < w1ago; });
  var w2Vol = prevWeek.reduce(function(s, w) { return s + (w.volume || 0); }, 0);
  var volTrend = w2Vol > 0 ? (w1Vol - w2Vol) / w2Vol : 0;
  var volScore = Math.min(250, Math.max(0, 125 + Math.round(volTrend * 125)));

  // 3. Recovery (0-200)
  var readiness = window.currentReadinessScore || 70;
  var recScore = Math.round(readiness / 100 * 200);

  // 4. Ernaehrung (0-150)
  var np = window._getNutritionProfile ? window._getNutritionProfile() : {};
  var nutrScore = 0;
  if (np.setupComplete) nutrScore += 50;
  var today = new Date().toISOString().split('T')[0];
  var todayFoods = window._getFoodLog ? window._getFoodLog(today) : [];
  if (todayFoods.length > 0) nutrScore += 50;
  var waterLog = window._getWaterLog ? window._getWaterLog(today) : { total: 0 };
  var waterGoal = window._calculateWaterTarget ? window._calculateWaterTarget().target : 2500;
  if (waterLog.total >= waterGoal * 0.8) nutrScore += 50;
  nutrScore = Math.min(150, nutrScore);

  // 5. Habits (0-150)
  var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
  var habitDates = Object.keys(habits).filter(function(d) { return d >= w1ago; });
  var habitScore = Math.min(150, habitDates.length * 20);

  var total = freqScore + volScore + recScore + nutrScore + habitScore;

  return {
    score: total, max: 1000, pct: Math.round(total / 10),
    components: {
      frequency: { label: 'Frequenz', score: freqScore, max: 250 },
      volume: { label: 'Volumen', score: volScore, max: 250 },
      recovery: { label: 'Recovery', score: recScore, max: 200 },
      nutrition: { label: 'Ern\u00E4hrung', score: nutrScore, max: 150 },
      habits: { label: 'Habits', score: habitScore, max: 150 }
    },
    rank: total >= 850 ? { name: 'Elite Athlet \uD83C\uDFC6', color: '#d4af37' } :
          total >= 700 ? { name: 'Veteran \uD83D\uDCAA', color: '#a3c9a8' } :
          total >= 500 ? { name: 'Aufsteiger \u26A1', color: '#4ab8d4' } :
          total >= 300 ? { name: 'Trainee \uD83C\uDF31', color: '#8aafe8' } :
                         { name: 'Rookie \uD83C\uDFAF', color: '#e8c86a' }
  };
};

window._renderBASEScore = function(containerId) {
  var container = document.getElementById(containerId || 'baseScoreContainer');
  if (!container) return;
  var s = window._calculateBASEScore();
  var color = s.rank.color;
  var html =
    '<div style="text-align:center;padding:20px 10px">' +
      '<p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--text-muted);margin-bottom:4px">BASE Score</p>' +
      '<p style="font-size:72px;font-weight:900;color:' + color + ';line-height:1;margin-bottom:4px">' + s.score + '</p>' +
      '<p style="font-size:14px;font-weight:600;color:' + color + ';margin-bottom:2px">' + s.rank.name + '</p>' +
      '<p style="font-size:10px;color:var(--text-muted)">von 1.000 Punkten</p>' +
    '</div><div style="padding:0 4px">';
  Object.values(s.components).forEach(function(c) {
    var pct = Math.round(c.score / c.max * 100);
    html += '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><p style="font-size:10px;font-weight:600;color:var(--text-main)">' + c.label + '</p><p style="font-size:10px;color:var(--text-muted)">' + c.score + '/' + c.max + '</p></div><div style="height:4px;background:var(--border-hex);border-radius:2px"><div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:2px;transition:width .5s ease"></div></div></div>';
  });
  html += '</div><button onclick="window._shareBASEScore()" class="pointer-events-auto w-full" style="margin-top:12px;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\uD83D\uDCE4 Score teilen</button>';
  container.innerHTML = html;
};

window._shareBASEScore = function() {
  var s = window._calculateBASEScore();
  var text = 'Mein BASE Score: ' + s.score + '/1000 \u2014 ' + s.rank.name + '\nTraining, Recovery, Ern\u00E4hrung & Habits kombiniert.\nbase-app.tech';
  if (navigator.share) { navigator.share({ title: 'BASE Score', text: text }); }
  else if (navigator.clipboard) { navigator.clipboard.writeText(text).then(function() { window.showToast('Score kopiert! \uD83D\uDCCB'); }); }
};

window._syncBASEScore = async function() {
  var auth = window._fbAuth;
  if (!auth || !auth.currentUser) return;
  try {
    var db = window._db || window._fbDb;
    var mod = window._firestoreModule;
    if (!db || !mod || !mod.doc || !mod.setDoc) return;
    var s = window._calculateBASEScore();
    await mod.setDoc(mod.doc(db, 'profiles', auth.currentUser.uid), { baseScore: s.score, baseRank: s.rank.name, baseScoreUpdated: new Date().toISOString() }, { merge: true });
  } catch (e) { console.warn('[BaseScore sync]', e.message); }
};

// ============================================================
// FEATURE: FREUNDE-VERGLEICH
// ============================================================

window._renderFriendsCompare = async function(containerId) {
  var container = document.getElementById(containerId || 'friendsCompareContainer');
  if (!container) return;
  var auth = window._fbAuth;
  if (!auth || !auth.currentUser) {
    container.innerHTML = '<p style="text-align:center;font-size:12px;color:var(--text-muted);padding:16px">Einloggen um Freunde zu vergleichen</p>';
    return;
  }
  container.innerHTML = '<p style="font-size:12px;color:var(--text-muted);text-align:center;padding:10px">Lade Freunde...</p>';
  try {
    var db = window._db || window._fbDb;
    var mod = window._firestoreModule;
    if (!db || !mod || !mod.collection || !mod.getDocs) { container.innerHTML = ''; return; }
    var followingSnap = await mod.getDocs(mod.collection(db, 'follows', auth.currentUser.uid, 'following'));
    var followingUids = followingSnap.docs.map(function(d) { return d.id; }).slice(0, 10);
    var myScore = window._calculateBASEScore();
    var myName = (auth.currentUser.displayName || 'Du').substring(0, 15);
    var friends = [{ uid: auth.currentUser.uid, name: myName, score: myScore.score, rank: myScore.rank.name, isMe: true }];
    for (var i = 0; i < followingUids.length; i++) {
      try {
        var snap = await mod.getDoc(mod.doc(db, 'profiles', followingUids[i]));
        if (snap.exists()) { var pd = snap.data(); friends.push({ uid: followingUids[i], name: (pd.displayName || 'Athlet').substring(0, 15), score: pd.baseScore || 0, rank: pd.baseRank || 'Rookie', isMe: false }); }
      } catch (e) {}
    }
    if (friends.length <= 1) {
      container.innerHTML = '<div style="text-align:center;padding:16px"><p style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:4px">Noch keine Freunde</p><p style="font-size:11px;color:var(--text-muted)">Folge Athleten im Community Tab</p></div>';
      return;
    }
    friends.sort(function(a, b) { return b.score - a.score; });
    var myRank = friends.findIndex(function(f) { return f.isMe; }) + 1;
    var maxS = friends[0].score || 1;
    var html = '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:10px">Du bist #' + myRank + ' unter deinen Freunden</p>';
    friends.forEach(function(f, idx) {
      var pct = Math.round(f.score / maxS * 100);
      var color = f.isMe ? 'var(--primary-hex)' : 'var(--text-muted)';
      var medal = idx === 0 ? '\uD83E\uDD47' : idx === 1 ? '\uD83E\uDD48' : idx === 2 ? '\uD83E\uDD49' : '';
      html += '<div style="margin-bottom:10px;padding:10px 12px;background:' + (f.isMe ? 'color-mix(in srgb,var(--primary-hex),transparent 92%)' : 'var(--inner-bg-hex)') + ';border:1px solid ' + (f.isMe ? 'color-mix(in srgb,var(--primary-hex),transparent 70%)' : 'var(--border-hex)') + ';border-radius:11px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><p style="font-size:16px;width:24px">' + medal + '</p><p style="font-size:13px;font-weight:' + (f.isMe ? '700' : '600') + ';color:' + color + ';flex:1">' + window._escapeHtml(f.name) + (f.isMe ? ' (Du)' : '') + '</p><p style="font-size:13px;font-weight:700;color:' + color + '">' + f.score + '</p></div><div style="height:3px;background:var(--border-hex);border-radius:2px"><div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:2px"></div></div></div>';
    });
    container.innerHTML = html;
  } catch (e) { container.innerHTML = '<p style="text-align:center;font-size:12px;color:#e88a8a;padding:10px">Fehler beim Laden</p>'; }
};

// ============================================================
// FEATURE: RECOVERY SCORE VERLAUF
// ============================================================

window._RECOVERY_HISTORY_KEY = 'base_recovery_history';

window._logRecoveryScore = function(score) {
  var history = JSON.parse(localStorage.getItem(window._RECOVERY_HISTORY_KEY) || '[]');
  var today = new Date().toISOString().split('T')[0];
  var existing = history.find(function(e) { return e.date === today; });
  if (existing) { existing.score = score; } else { history.unshift({ date: today, score: score }); history = history.slice(0, 28); }
  localStorage.setItem(window._RECOVERY_HISTORY_KEY, JSON.stringify(history));
};

window._renderRecoveryHistory = function(containerId) {
  var container = document.getElementById(containerId || 'recoveryHistoryContainer');
  if (!container) return;
  var history = JSON.parse(localStorage.getItem(window._RECOVERY_HISTORY_KEY) || '[]');
  if (history.length < 2) { container.innerHTML = '<p style="font-size:11px;color:var(--text-muted);text-align:center;padding:10px">Daten werden gesammelt...</p>'; return; }
  var avg4w = Math.round(history.reduce(function(s, e) { return s + e.score; }, 0) / history.length);
  var week = history.slice(0, 7);
  var avg1w = Math.round(week.reduce(function(s, e) { return s + e.score; }, 0) / week.length);
  var trend = avg1w - avg4w;
  var trendColor = trend > 0 ? '#a3c9a8' : trend < 0 ? '#e88a8a' : '#e8c86a';
  var html =
    '<div style="display:flex;gap:8px;margin-bottom:10px">' +
      '<div style="flex:1;text-align:center;padding:8px;background:var(--inner-bg-hex);border-radius:9px"><p style="font-size:18px;font-weight:700;color:var(--primary-hex)">' + avg1w + '%</p><p style="font-size:9px;color:var(--text-muted)">\u00D8 diese Woche</p></div>' +
      '<div style="flex:1;text-align:center;padding:8px;background:var(--inner-bg-hex);border-radius:9px"><p style="font-size:18px;font-weight:700;color:var(--text-muted)">' + avg4w + '%</p><p style="font-size:9px;color:var(--text-muted)">\u00D8 4 Wochen</p></div>' +
      '<div style="flex:1;text-align:center;padding:8px;background:var(--inner-bg-hex);border-radius:9px"><p style="font-size:18px;font-weight:700;color:' + trendColor + '">' + (trend > 0 ? '+' : '') + trend + '%</p><p style="font-size:9px;color:var(--text-muted)">Trend</p></div>' +
    '</div>';
  var chartData = history.slice(0, 14).reverse();
  html += '<div style="display:flex;align-items:flex-end;gap:3px;height:36px">';
  chartData.forEach(function(e) {
    var h = Math.max(3, Math.round(e.score / 100 * 36));
    var col = e.score >= 80 ? '#a3c9a8' : e.score >= 60 ? '#4ab8d4' : e.score >= 40 ? '#e8c86a' : '#e88a8a';
    html += '<div style="flex:1;background:' + col + ';border-radius:2px;height:' + h + 'px" title="' + e.date + ': ' + e.score + '%"></div>';
  });
  html += '</div>';
  container.innerHTML = html;
};

// ============================================================
// FEATURE: TRAININGSPARTNER-MODUS (Firestore)
// ============================================================

window._PARTNER_SESSION_KEY = 'base_partner_session';

window._createPartnerSession = async function() {
  var auth = window._fbAuth;
  if (!auth || !auth.currentUser) { window.showToast('Bitte einloggen', 'error'); return; }
  try {
    var db = window._db || window._fbDb;
    var mod = window._firestoreModule;
    if (!db || !mod || !mod.addDoc || !mod.collection) { window.showToast('Firestore nicht verf\u00FCgbar', 'error'); return; }
    var sessionCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    var ref = await mod.addDoc(mod.collection(db, 'partner_sessions'), {
      code: sessionCode, creatorId: auth.currentUser.uid, creatorName: auth.currentUser.displayName || 'Athlet',
      partnerId: null, partnerName: null, status: 'waiting', exercises: [],
      createdAt: mod.serverTimestamp ? mod.serverTimestamp() : new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });
    localStorage.setItem(window._PARTNER_SESSION_KEY, JSON.stringify({ id: ref.id, code: sessionCode, role: 'creator' }));
    window.showModal(
      '\uD83E\uDD1D Trainingspartner einladen',
      '<div style="text-align:center;padding:16px">' +
        '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Teile diesen Code mit deinem Trainingspartner:</p>' +
        '<p style="font-size:48px;font-weight:900;color:var(--primary-hex);letter-spacing:8px;margin-bottom:12px">' + sessionCode + '</p>' +
        '<button onclick="navigator.share?navigator.share({title:\'BASE Partner\',text:\'Join my workout! Code: ' + sessionCode + ' \u2014 base-app.tech\'}):navigator.clipboard&&navigator.clipboard.writeText(\'' + sessionCode + '\').then(function(){window.showToast(\'Code kopiert!\')})" class="pointer-events-auto" style="padding:10px 24px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;background:color-mix(in srgb,var(--primary-hex),transparent 88%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 65%);color:var(--primary-hex)">Code teilen \uD83D\uDCE4</button>' +
        '<p style="font-size:10px;color:var(--text-muted);margin-top:12px">Code ist 1 Stunde g\u00FCltig</p></div>',
      false
    );
  } catch (e) { window.showToast('Fehler beim Erstellen', 'error'); }
};

window._joinPartnerSession = async function(code) {
  var auth = window._fbAuth;
  if (!auth || !auth.currentUser) { window.showToast('Bitte einloggen', 'error'); return; }
  if (!code || code.length < 4) { window.showToast('Ung\u00FCltiger Code', 'error'); return; }
  try {
    var db = window._db || window._fbDb;
    var mod = window._firestoreModule;
    if (!db || !mod || !mod.query || !mod.where || !mod.getDocs) { window.showToast('Firestore nicht verf\u00FCgbar', 'error'); return; }
    var q = mod.query(mod.collection(db, 'partner_sessions'), mod.where('code', '==', code.toUpperCase()), mod.where('status', '==', 'waiting'));
    var snap = await mod.getDocs(q);
    if (snap.empty) { window.showToast('Code nicht gefunden oder abgelaufen', 'error'); return; }
    var sessionDoc = snap.docs[0];
    await mod.updateDoc(sessionDoc.ref, { partnerId: auth.currentUser.uid, partnerName: auth.currentUser.displayName || 'Athlet', status: 'active' });
    localStorage.setItem(window._PARTNER_SESSION_KEY, JSON.stringify({ id: sessionDoc.id, code: code.toUpperCase(), role: 'partner' }));
    window.showToast('\uD83E\uDD1D Trainingspartner verbunden!');
    window.toggleModal('partnerJoinModal');
  } catch (e) { window.showToast('Fehler beim Verbinden', 'error'); }
};

window.openPartnerMode = function() {
  window.toggleModal('partnerJoinModal');
};

// ============================================================

// ============================================================
// FEATURE: PROFI-BENCHMARKS (Strength Level / NSCA)
// ============================================================

window._STRENGTH_BENCHMARKS = {
  kniebeuge: {
    de: 'Kniebeuge',
    levels: [
      { label: 'Anf\u00E4nger', bw: 0.75, color: '#8aafe8' },
      { label: 'Intermediate', bw: 1.25, color: '#a3c9a8' },
      { label: 'Fortgeschritten', bw: 1.75, color: '#e8c86a' },
      { label: 'Elite', bw: 2.25, color: '#e88a8a' },
      { label: 'Weltklasse', bw: 2.75, color: '#d4af37' }
    ], source: 'Strength Level / NSCA'
  },
  bankdr\u00FCcken: {
    de: 'Bankdr\u00FCcken',
    levels: [
      { label: 'Anf\u00E4nger', bw: 0.5, color: '#8aafe8' },
      { label: 'Intermediate', bw: 0.75, color: '#a3c9a8' },
      { label: 'Fortgeschritten', bw: 1.0, color: '#e8c86a' },
      { label: 'Elite', bw: 1.25, color: '#e88a8a' },
      { label: 'Weltklasse', bw: 1.5, color: '#d4af37' }
    ], source: 'Strength Level / NSCA'
  },
  kreuzheben: {
    de: 'Kreuzheben',
    levels: [
      { label: 'Anf\u00E4nger', bw: 1.0, color: '#8aafe8' },
      { label: 'Intermediate', bw: 1.5, color: '#a3c9a8' },
      { label: 'Fortgeschritten', bw: 2.0, color: '#e8c86a' },
      { label: 'Elite', bw: 2.5, color: '#e88a8a' },
      { label: 'Weltklasse', bw: 3.0, color: '#d4af37' }
    ], source: 'Strength Level / NSCA'
  },
  schulterdr\u00FCcken: {
    de: 'Schulterdr\u00FCcken',
    levels: [
      { label: 'Anf\u00E4nger', bw: 0.35, color: '#8aafe8' },
      { label: 'Intermediate', bw: 0.55, color: '#a3c9a8' },
      { label: 'Fortgeschritten', bw: 0.75, color: '#e8c86a' },
      { label: 'Elite', bw: 0.9, color: '#e88a8a' },
      { label: 'Weltklasse', bw: 1.1, color: '#d4af37' }
    ], source: 'Strength Level / NSCA'
  },
  klimmz\u00FCge: {
    de: 'Klimmz\u00FCge',
    levels: [
      { label: 'Anf\u00E4nger', reps: 3, bw: 0.3, color: '#8aafe8' },
      { label: 'Intermediate', reps: 8, bw: 0.6, color: '#a3c9a8' },
      { label: 'Fortgeschritten', reps: 15, bw: 1.0, color: '#e8c86a' },
      { label: 'Elite', reps: 20, bw: 1.3, color: '#e88a8a' },
      { label: 'Weltklasse', reps: 30, bw: 1.6, color: '#d4af37' }
    ], source: 'Calisthenics Standards', unit: 'reps'
  }
};

window._getUserBenchmarkLevel = function(exercise, weight, bodyweight) {
  var key = Object.keys(window._STRENGTH_BENCHMARKS).find(function(k) {
    return exercise.toLowerCase().includes(k.toLowerCase()) || (window._STRENGTH_BENCHMARKS[k].de || '').toLowerCase().includes(exercise.toLowerCase());
  });
  if (!key || !bodyweight || bodyweight <= 0) return null;
  var bench = window._STRENGTH_BENCHMARKS[key];
  var ratio = weight / bodyweight;
  var levels = bench.levels;
  var currentLevel = levels[0];
  for (var i = 0; i < levels.length; i++) { if (levels[i].bw && ratio >= levels[i].bw) currentLevel = levels[i]; }
  var nextLevel = null;
  for (var j = 0; j < levels.length; j++) { if (levels[j].bw && levels[j].bw > ratio) { nextLevel = levels[j]; break; } }
  return {
    exercise: bench.de, currentLevel: currentLevel, nextLevel: nextLevel,
    ratio: Math.round(ratio * 100) / 100,
    weightToNext: nextLevel ? Math.round((nextLevel.bw - ratio) * bodyweight * 2) / 2 : 0,
    levels: levels, source: bench.source
  };
};

window._renderBenchmarkDashboard = function(containerId) {
  var container = document.getElementById(containerId || 'benchmarkContainer');
  if (!container) return;
  var profile = window.userProfile || {};
  var bodyweight = parseFloat(profile.weight) || 80;
  var orms = JSON.parse(localStorage.getItem('base_1rm_data') || '{}');
  var results = [];

  Object.keys(window._STRENGTH_BENCHMARKS).forEach(function(key) {
    var bench = window._STRENGTH_BENCHMARKS[key];
    var bestWeight = 0;
    Object.keys(orms).forEach(function(exName) {
      if (exName.toLowerCase().includes(key) || (bench.de || '').toLowerCase().includes(exName.toLowerCase().split(' ')[0])) {
        if (orms[exName] > bestWeight) bestWeight = orms[exName];
      }
    });
    (window.workouts || []).filter(function(w) { return w.archived && w.category === 'strength'; }).forEach(function(w) {
      var exLow = (w.exercise || '').toLowerCase();
      if (exLow.includes(key) || exLow.includes((bench.de || '').toLowerCase().split(' ')[0])) {
        var max = 0; (w.setDetails || []).forEach(function(s) { var sw = parseFloat(s.weight) || 0; if (sw > max) max = sw; });
        if (max > bestWeight) bestWeight = max;
      }
    });
    if (bestWeight > 0) {
      var result = window._getUserBenchmarkLevel(bench.de, bestWeight, bodyweight);
      if (result) { result.key = key; result.weight = bestWeight; results.push(result); }
    }
  });

  if (results.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:16px"><p style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:4px">Noch keine Vergleichsdaten</p><p style="font-size:11px;color:var(--text-muted)">Tracke Kniebeuge, Bankdr\u00FCcken oder Kreuzheben</p></div>';
    return;
  }
  var html = '';
  results.forEach(function(r) {
    html += '<div style="padding:12px 14px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:12px;margin-bottom:8px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><p style="font-size:13px;font-weight:700;color:var(--text-main)">' + window._escapeHtml(r.exercise) + '</p><span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:6px;background:' + r.currentLevel.color + '22;color:' + r.currentLevel.color + '">' + r.currentLevel.label + '</span></div>' +
      '<div style="display:flex;gap:3px;margin-bottom:6px">';
    r.levels.forEach(function(lvl, idx) {
      var isReached = r.levels.indexOf(r.currentLevel) >= idx;
      html += '<div style="flex:1;height:6px;border-radius:3px;background:' + (isReached ? lvl.color : 'var(--border-hex)') + ';opacity:' + (r.currentLevel.label === lvl.label ? '1' : '0.5') + '" title="' + lvl.label + ': ' + (lvl.bw || '') + 'x BW"></div>';
    });
    html += '</div><div style="display:flex;justify-content:space-between"><p style="font-size:10px;color:var(--text-muted)">' + r.weight + 'kg (' + r.ratio + '\u00D7 BW)</p>' +
      (r.nextLevel ? '<p style="font-size:10px;color:var(--primary-hex)">N\u00E4chstes Level: +' + r.weightToNext + 'kg</p>' : '<p style="font-size:10px;color:#d4af37">\uD83C\uDFC6 Weltklasse!</p>') +
      '</div></div>';
  });
  html += '<p style="font-size:9px;color:var(--text-muted);text-align:center;margin-top:6px">Basierend auf: Strength Level / NSCA Standards</p>';
  container.innerHTML = html;
};



// ============================================================
// BASE BIO AGE — Biologisches Alter aus 12 Faktoren
// Levine 2018, Rantanen 1999, Walker 2017, Kellmann 2018
// ============================================================

window._BIO_AGE_FACTORS = {
  kraft: {
    label: 'Muskelkraft', emoji: '\uD83D\uDCAA', weight: 0.16,
    science: 'Rantanen 1999: Relative Kraft = staerkster Einzelpraediktor fuer Mortalitaet',
    calc: function() {
      var bw = parseFloat((window.userProfile || {}).weight) || 80;
      var orms = JSON.parse(localStorage.getItem('base_1rm_data') || '{}');
      var best1RM = 0;
      var keys = ['kniebeuge','squat','kreuzheben','deadlift','bankdr\u00FCcken','bench'];
      Object.keys(orms).forEach(function(ex) { if (keys.some(function(k) { return ex.toLowerCase().includes(k); })) { if (orms[ex] > best1RM) best1RM = orms[ex]; } });
      if (best1RM === 0) { (window.workouts || []).filter(function(w) { return w.archived && w.category === 'strength'; }).forEach(function(w) { if ((w.maxWeight || 0) > best1RM) best1RM = w.maxWeight; }); }
      if (best1RM === 0) return { score: 50, label: 'Keine Daten', delta: 0 };
      var ratio = best1RM / bw;
      var delta = ratio >= 2.0 ? -10 : ratio >= 1.75 ? -7 : ratio >= 1.5 ? -4 : ratio >= 1.25 ? -2 : ratio >= 1.0 ? 0 : ratio >= 0.75 ? +3 : +7;
      return { score: Math.round(Math.max(0, Math.min(100, 50 + (ratio - 1.0) * 40))), label: ratio >= 1.5 ? 'Sehr stark' : ratio >= 1.0 ? 'Durchschnitt' : 'Verbesserungspotenzial', value: Math.round(ratio * 100) / 100 + '\u00D7 BW', delta: delta };
    }
  },
  kardio: {
    label: 'Kardiovaskul\u00E4re Fitness', emoji: '\u2764\uFE0F', weight: 0.15,
    science: 'Lefevre 2000: VO2max korreliert direkt mit biologischem Alter',
    calc: function() {
      var hrData = [];
      (window.workouts || []).filter(function(w) { return w.archived && w.category === 'cardio'; }).slice(0, 20).forEach(function(w) {
        var hr = parseInt(w.data && (w.data['\u00D8 Puls'] || w.data['Avg HR'])) || 0;
        var dist = parseFloat(w.data && (w.data['Distanz (km)'] || w.data['Distanz'] || '0')) || 0;
        var dur = parseFloat(w.data && (w.data['Dauer (min)'] || w.data['Dauer'] || '0')) || 0;
        if (hr > 60 && dist > 0 && dur > 0) hrData.push({ hr: hr, dist: dist, dur: dur });
      });
      if (hrData.length === 0) return { score: 50, label: 'Keine Daten', delta: 0 };
      var age = parseInt((window.userProfile || {}).age) || 30;
      var maxHR = 208 - 0.7 * age;
      var best = hrData.reduce(function(b, d) { return d.dist / d.dur > b.dist / b.dur ? d : b; });
      var hrPct = Math.max(0.5, (best.hr - 50) / ((maxHR - 50) || 150));
      var vo2est = Math.max(20, Math.min(70, ((best.dist / best.dur) * 60 * 3.5) / hrPct));
      var gender = (window.userProfile || {}).gender || 'male';
      var norms = gender === 'female' ? [25, 30, 35, 40, 45, 50] : [35, 42, 48, 54, 60, 65];
      var delta = vo2est >= norms[5] ? -10 : vo2est >= norms[4] ? -7 : vo2est >= norms[3] ? -4 : vo2est >= norms[2] ? -1 : vo2est >= norms[1] ? +2 : vo2est >= norms[0] ? +5 : +9;
      return { score: Math.round(Math.max(0, Math.min(100, (vo2est - 20) / 50 * 100))), label: vo2est >= 50 ? 'Exzellent' : vo2est >= 40 ? 'Gut' : vo2est >= 30 ? 'Durchschnitt' : 'Verbesserungspotenzial', value: Math.round(vo2est) + ' ml/kg/min (est.)', delta: delta };
    }
  },
  erholung: {
    label: 'Erholungsf\u00E4higkeit', emoji: '\u26A1', weight: 0.12,
    science: 'Kellmann 2018: Chronische Unterrekuperation beschleunigt biologisches Altern',
    calc: function() {
      var history = JSON.parse(localStorage.getItem('base_recovery_history') || '[]');
      if (history.length < 3) { var cur = window.currentReadinessScore || 70; return { score: cur, label: cur >= 80 ? 'Exzellent' : cur >= 60 ? 'Gut' : 'Verbesserungspotenzial', value: cur + '% Recovery', delta: cur >= 80 ? -3 : cur >= 60 ? 0 : +4 }; }
      var avg = Math.round(history.slice(0, 14).reduce(function(s, e) { return s + e.score; }, 0) / Math.min(14, history.length));
      return { score: avg, label: avg >= 80 ? 'Exzellent' : avg >= 65 ? 'Gut' : avg >= 50 ? 'Moderat' : 'Kritisch', value: avg + '% \u00D8 14 Tage', delta: avg >= 80 ? -4 : avg >= 65 ? -1 : avg >= 50 ? +2 : +6 };
    }
  },
  schlaf: {
    label: 'Schlafqualit\u00E4t', emoji: '\uD83D\uDE34', weight: 0.13,
    science: 'Walker 2017: Chronischer Schlafmangel (<6h) = epigenetisch 5-8 Jahre aelter',
    calc: function() {
      var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
      var dates = Object.keys(habits).sort().slice(-14);
      var vals = dates.filter(function(d) { return habits[d] && habits[d].sleep > 0; }).map(function(d) { return habits[d].sleep; });
      if (vals.length < 3) return { score: 50, label: 'Keine Daten', delta: 0 };
      var avg = Math.round(vals.reduce(function(a, b) { return a + b; }, 0) / vals.length * 10) / 10;
      var r = avg >= 8.5 ? { d: -4, s: 90 } : avg >= 7.5 ? { d: -2, s: 80 } : avg >= 7.0 ? { d: 0, s: 70 } : avg >= 6.5 ? { d: +2, s: 55 } : avg >= 6.0 ? { d: +4, s: 40 } : avg >= 5.5 ? { d: +6, s: 25 } : { d: +8, s: 10 };
      return { score: r.s, label: avg >= 7.5 ? 'Optimal (' + avg + 'h)' : avg >= 6.5 ? 'Ausreichend (' + avg + 'h)' : 'Zu wenig (' + avg + 'h)', value: avg + 'h/Nacht \u00D8', delta: r.d };
    }
  },
  konsistenz: {
    label: 'Trainings-Konsistenz', emoji: '\uD83D\uDCC5', weight: 0.12,
    science: 'Booth 2012: Regelmaessiges Training = epigenetisch 10+ Jahre juenger',
    calc: function() {
      var all = (window.workouts || []).filter(function(w) { return w.archived; });
      if (all.length === 0) return { score: 20, label: 'Keine Daten', delta: +8 };
      var w4ago = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];
      var recent = all.filter(function(w) { return w.date >= w4ago; });
      var perWeek = recent.length / 4;
      var oldest = all[all.length - 1];
      var months = oldest && oldest.date ? Math.floor((Date.now() - new Date(oldest.date)) / 2592000000) : 0;
      var delta = perWeek >= 5 ? -8 : perWeek >= 4 ? -6 : perWeek >= 3 ? -4 : perWeek >= 2 ? -2 : perWeek >= 1 ? +1 : +6;
      if (months >= 24) delta -= 2; else if (months >= 12) delta -= 1;
      var score = perWeek >= 5 ? 95 : perWeek >= 4 ? 85 : perWeek >= 3 ? 70 : perWeek >= 2 ? 55 : perWeek >= 1 ? 40 : 15;
      return { score: Math.round(score), label: perWeek >= 4 ? 'Sehr aktiv' : perWeek >= 2 ? 'Aktiv' : 'Wenig aktiv', value: Math.round(perWeek * 10) / 10 + 'x/Woche', delta: Math.round(delta) };
    }
  },
  koerper: {
    label: 'K\u00F6rperzusammensetzung', emoji: '\u2696\uFE0F', weight: 0.10,
    science: 'Levine 2018: BMI + K\u00F6rperfett = zentrale Komponenten des biologischen Alters',
    calc: function() {
      var p = window.userProfile || {};
      var w = parseFloat(p.weight) || 80; var h = parseFloat(p.height) || 175;
      if (w <= 0 || h <= 0) return { score: 50, label: 'Keine Daten', delta: 0 };
      var bmi = w / ((h / 100) * (h / 100));
      var delta = bmi >= 18.5 && bmi < 23 ? -2 : bmi < 25 ? 0 : bmi < 27.5 ? +2 : bmi < 30 ? +4 : +7;
      var score = bmi >= 18.5 && bmi < 23 ? 85 : bmi < 25 ? 70 : bmi < 27.5 ? 55 : bmi < 30 ? 40 : 20;
      return { score: score, label: bmi < 25 ? 'Optimal' : bmi < 27.5 ? 'Leicht erh\u00F6ht' : 'Erh\u00F6ht', value: 'BMI ' + Math.round(bmi * 10) / 10, delta: delta };
    }
  },
  mobilitaet: {
    label: 'Mobilit\u00E4t', emoji: '\uD83E\uDD38', weight: 0.08,
    science: 'Leong 2014: Sitz-Aufsteh-Test = unabhaengiger Mortalitaetspraediktor',
    calc: function() {
      var w4ago = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];
      var mob = (window.workouts || []).filter(function(w) { return w.archived && w.category === 'recovery' && w.date >= w4ago; });
      var perWeek = mob.length / 4;
      var delta = perWeek >= 3 ? -3 : perWeek >= 2 ? -1 : perWeek >= 1 ? +1 : perWeek >= 0.5 ? +2 : +4;
      var score = perWeek >= 3 ? 88 : perWeek >= 2 ? 75 : perWeek >= 1 ? 60 : perWeek >= 0.5 ? 45 : 30;
      return { score: score, label: perWeek >= 2 ? 'Aktiv' : perWeek >= 1 ? 'Moderat' : 'Selten', value: Math.round(perWeek * 10) / 10 + 'x Mobility/Woche', delta: Math.round(delta) };
    }
  },
  hydration: {
    label: 'Hydration', emoji: '\uD83D\uDCA7', weight: 0.05,
    science: 'Dmitrieva 2023 NIH: Chronische Dehydration erh\u00F6ht biologisches Alter signifikant',
    calc: function() {
      var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
      var dates = Object.keys(habits).sort().slice(-7);
      var vals = dates.filter(function(d) { return habits[d] && habits[d].water > 0; }).map(function(d) { return habits[d].water; });
      if (vals.length === 0) return { score: 50, label: 'Keine Daten', delta: 0 };
      var avg = vals.reduce(function(a, b) { return a + b; }, 0) / vals.length;
      var delta = avg >= 2.5 ? -2 : avg >= 2.0 ? 0 : avg >= 1.5 ? +1 : +3;
      return { score: Math.max(10, Math.min(100, Math.round(avg / 3 * 100))), label: avg >= 2.5 ? 'Gut hydriert' : avg >= 2.0 ? 'Ausreichend' : 'Zu wenig', value: Math.round(avg * 10) / 10 + 'L/Tag \u00D8', delta: delta };
    }
  },
  stimmung: {
    label: 'Mentale Gesundheit', emoji: '\uD83E\uDDE0', weight: 0.05,
    science: 'Livingston 2020: Chronischer Stress beschleunigt Telomer-Verk\u00FCrzung',
    calc: function() {
      var habits = JSON.parse(localStorage.getItem('base_habits') || '{}');
      var dates = Object.keys(habits).sort().slice(-14);
      var vals = dates.filter(function(d) { return habits[d] && habits[d].mood > 0; }).map(function(d) { return habits[d].mood; });
      if (vals.length < 3) return { score: 60, label: 'Keine Daten', delta: 0 };
      var avg = Math.round(vals.reduce(function(a, b) { return a + b; }, 0) / vals.length * 10) / 10;
      return { score: Math.round(avg / 10 * 100), label: avg >= 7 ? 'Positiv (' + avg + '/10)' : avg >= 5 ? 'Neutral (' + avg + '/10)' : 'Belastet (' + avg + '/10)', value: avg + '/10 \u00D8', delta: avg >= 8 ? -2 : avg >= 6 ? 0 : avg >= 4 ? +2 : +4 };
    }
  },
  entzuendung: {
    label: 'Entz\u00FCndungsstatus', emoji: '\uD83D\uDD2C', weight: 0.10,
    science: 'Franceschi 2018: Inflammaging = Haupttreiber biologischen Alterns',
    calc: function() {
      if (!window._getLatestBloodwork) return { score: 60, label: 'Keine Blutwerte', delta: 0 };
      var latest = window._getLatestBloodwork();
      if (Object.keys(latest).length === 0) return { score: 60, label: 'Keine Blutwerte', delta: 0 };
      var crp = latest.crp ? latest.crp.value : null;
      var score = 60; var delta = 0;
      if (crp !== null) { if (crp <= 0.5) { score += 20; delta -= 3; } else if (crp <= 1) { score += 10; delta -= 1; } else if (crp <= 3) { score -= 5; delta += 2; } else { score -= 20; delta += 5; } }
      return { score: Math.max(10, Math.min(100, score)), label: score >= 75 ? 'Niedrig \u2014 optimal' : score >= 55 ? 'Moderat' : 'Erh\u00F6ht', value: crp !== null ? 'CRP: ' + crp + ' mg/L' : 'Keine Werte', delta: delta };
    }
  },
  naehrstoffe: {
    label: 'N\u00E4hrstoffstatus', emoji: '\uD83C\uDF21\uFE0F', weight: 0.07,
    science: 'Karasik 2005: Vitamin D Mangel = +2-4 Jahre biologisches Alter',
    calc: function() {
      if (!window._getLatestBloodwork) return { score: 60, label: 'Keine Blutwerte', delta: 0 };
      var latest = window._getLatestBloodwork();
      if (Object.keys(latest).length === 0) return { score: 60, label: 'Keine Blutwerte', delta: 0 };
      var vitD = latest.vitaminD ? latest.vitaminD.value : null;
      var score = 60; var delta = 0;
      if (vitD !== null) { if (vitD >= 50) { score += 15; delta -= 2; } else if (vitD >= 40) { score += 8; delta -= 1; } else if (vitD >= 30) { score -= 5; delta += 1; } else { score -= 20; delta += 4; } }
      return { score: Math.max(10, Math.min(100, score)), label: score >= 75 ? 'Optimal' : score >= 55 ? 'Ausreichend' : 'Mangelzust\u00E4nde', value: vitD !== null ? 'Vit D: ' + vitD + ' ng/ml' : 'Keine Werte', delta: delta };
    }
  },
  hormone: {
    label: 'Hormonstatus', emoji: '\u2697\uFE0F', weight: 0.07,
    science: 'Ohlsson 2011: Testosteron-Abfall korreliert mit biologischem Altern',
    calc: function() {
      if (!window._getLatestBloodwork) return { score: 60, label: 'Keine Blutwerte', delta: 0 };
      var latest = window._getLatestBloodwork();
      var testo = latest.testosterone ? latest.testosterone.value : null;
      if (!testo) return { score: 60, label: 'Keine Blutwerte', delta: 0 };
      var score = 60; var delta = 0;
      if (testo >= 600) { score += 15; delta -= 3; } else if (testo >= 400) { score += 5; delta -= 1; } else if (testo < 300) { score -= 15; delta += 4; }
      return { score: Math.max(10, Math.min(100, score)), label: score >= 75 ? 'Optimal' : score >= 55 ? 'Ausreichend' : 'Auff\u00E4llig', value: 'Testo: ' + testo + ' ng/dl', delta: delta };
    }
  }
};

// Hauptberechnung
window._calculateBioAge = function() {
  var chronoAge = parseInt((window.userProfile || {}).age) || 30;
  var results = {};
  var totalDelta = 0; var weightSum = 0; var dataCount = 0;
  Object.keys(window._BIO_AGE_FACTORS).forEach(function(key) {
    var factor = window._BIO_AGE_FACTORS[key];
    try {
      var result = factor.calc();
      results[key] = { label: factor.label, emoji: factor.emoji, weight: factor.weight, score: result.score, delta: result.delta, value: result.value || '', dispLabel: result.label || '', science: factor.science, hasData: result.label !== 'Keine Daten' && result.label !== 'Keine Blutwerte' };
      if (results[key].hasData) { totalDelta += result.delta * factor.weight; weightSum += factor.weight; dataCount++; }
    } catch (e) { results[key] = { label: factor.label, emoji: factor.emoji, score: 50, delta: 0, hasData: false, dispLabel: 'Fehler' }; }
  });
  var normalizedDelta = weightSum > 0 ? totalDelta / weightSum : 0;
  var bioAge = Math.max(16, Math.round(chronoAge + normalizedDelta));
  var ageDiff = bioAge - chronoAge;
  var confidence = dataCount >= 8 ? 'hoch' : dataCount >= 5 ? 'mittel' : 'niedrig';
  return {
    bioAge: bioAge, chronoAge: chronoAge, ageDiff: ageDiff, factors: results,
    dataCount: dataCount, totalFactors: Object.keys(window._BIO_AGE_FACTORS).length,
    confidence: confidence,
    color: ageDiff <= -5 ? '#a3c9a8' : ageDiff <= -2 ? '#4ab8d4' : ageDiff <= 2 ? '#e8c86a' : ageDiff <= 5 ? '#e8a86a' : '#e88a8a',
    label: ageDiff <= -5 ? 'Deutlich j\u00FCnger als dein Alter' : ageDiff <= -2 ? 'J\u00FCnger als dein Alter' : ageDiff <= 2 ? 'Entspricht deinem Alter' : ageDiff <= 5 ? 'Leicht \u00E4lter als dein Alter' : 'Deutlich \u00E4lter \u2014 Handlungsbedarf'
  };
};

// Render
window._renderBioAge = function(containerId) {
  var container = document.getElementById(containerId || 'bioAgeContainer');
  if (!container) return;
  var r = window._calculateBioAge();
  var color = r.color;
  var diffStr = r.ageDiff === 0 ? 'Kein Unterschied' : (r.ageDiff > 0 ? '+' : '') + r.ageDiff + ' Jahre';
  var html =
    '<div style="text-align:center;padding:20px 10px 14px">' +
      '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--text-muted);margin-bottom:8px">Biologisches Alter</p>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:8px">' +
        '<div style="text-align:center"><p style="font-size:52px;font-weight:900;color:' + color + ';line-height:1">' + r.bioAge + '</p><p style="font-size:10px;color:var(--text-muted)">Bio-Alter</p></div>' +
        '<div style="text-align:center;opacity:0.4"><p style="font-size:36px;font-weight:700;color:var(--text-muted);line-height:1">' + r.chronoAge + '</p><p style="font-size:10px;color:var(--text-muted)">Chrono-Alter</p></div>' +
      '</div>' +
      '<div style="display:inline-flex;padding:5px 14px;border-radius:20px;background:' + color + '1a;border:1px solid ' + color + '44;margin-bottom:6px"><p style="font-size:12px;font-weight:700;color:' + color + '">' + diffStr + '</p></div>' +
      '<p style="font-size:11px;color:var(--text-muted);margin-bottom:4px">' + r.label + '</p>' +
      '<p style="font-size:9px;color:var(--text-muted)">' + r.dataCount + '/' + r.totalFactors + ' Faktoren \u00B7 Konfidenz: ' + r.confidence + '</p>' +
    '</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;padding:0 2px">';
  var factorList = Object.values(r.factors).sort(function(a, b) { return a.delta - b.delta; });
  factorList.forEach(function(f) {
    var fc = f.delta <= -2 ? '#a3c9a8' : f.delta <= 0 ? '#4ab8d4' : f.delta <= 3 ? '#e8c86a' : '#e88a8a';
    html += '<div style="padding:10px;background:var(--inner-bg-hex);border:1px solid var(--border-hex);border-radius:10px;opacity:' + (f.hasData ? '1' : '0.5') + '">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px"><span style="font-size:14px">' + f.emoji + '</span>' +
      (f.hasData ? '<span style="font-size:10px;font-weight:700;color:' + fc + '">' + (f.delta > 0 ? '+' : '') + f.delta + 'J</span>' : '<span style="font-size:9px;color:var(--text-muted)">\u2014</span>') +
      '</div><p style="font-size:10px;font-weight:600;color:var(--text-main);margin-bottom:2px">' + window._escapeHtml(f.label) + '</p>' +
      '<p style="font-size:9px;color:var(--text-muted);line-height:1.4">' + (f.hasData ? window._escapeHtml(f.dispLabel) : 'Daten fehlen') + '</p></div>';
  });
  html += '</div>' +
    '<div style="margin-top:10px;padding:10px 12px;background:rgba(138,175,232,0.06);border:1px solid rgba(138,175,232,0.15);border-radius:10px"><p style="font-size:9px;color:#8aafe8;line-height:1.5">\u2695\uFE0F Sch\u00E4tzung aus ' + r.dataCount + ' Datenpunkten. Kein medizinisches Diagnose-Tool.</p></div>' +
    '<button onclick="window._showBioAgeImprovement()" class="pointer-events-auto w-full" style="margin-top:8px;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\uD83D\uDCA1 Wie kann ich mein Bio-Alter verbessern?</button>';
  container.innerHTML = html;
};

// KI-Verbesserungstipps
window._showBioAgeImprovement = async function() {
  var r = window._calculateBioAge();
  var worst = Object.values(r.factors).filter(function(f) { return f.hasData && f.delta > 0; }).sort(function(a, b) { return b.delta - a.delta; }).slice(0, 3);
  if (worst.length === 0) { window.showToast('Dein Bio-Alter ist bereits sehr gut!'); return; }
  var prompt = 'Du bist Sportmediziner und Longevity-Experte.\n\nBIOLOGISCHES ALTER:\n- Chrono: ' + r.chronoAge + '\n- Bio: ' + r.bioAge + '\n- Diff: ' + (r.ageDiff > 0 ? '+' : '') + r.ageDiff + ' Jahre\n\nSCHWAECHSTE FAKTOREN:\n' + worst.map(function(f) { return '- ' + f.label + ': ' + f.dispLabel + ' (+' + f.delta + ' Jahre)'; }).join('\n') + '\n\nGib 3 konkrete, sofort umsetzbare Empfehlungen um das biologische Alter zu verbessern. Max 150 Woerter. Deutsch.';
  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 25000);
    var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, type: 'bio_age_tips' }), signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var text = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '';
    window.showModal('\uD83D\uDCA1 Bio-Alter verbessern', '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap;margin-bottom:12px">' + window._sanitizeAIHtml(text) + '</div><div style="padding:8px 10px;background:rgba(138,175,232,0.06);border-radius:8px"><p style="font-size:9px;color:#8aafe8">\u2695\uFE0F Immer mit Arzt absprechen.</p></div>', false);
  } catch (e) { window.showToast('Tipps konnten nicht geladen werden', 'error'); }
};

// KI-Kontext
window._getBioAgeContext = function() {
  var r = window._calculateBioAge();
  if (!r || r.dataCount < 3) return '';
  var strong = Object.values(r.factors).filter(function(f) { return f.hasData && f.delta <= -2; }).map(function(f) { return f.label; }).slice(0, 3).join(', ');
  var weak = Object.values(r.factors).filter(function(f) { return f.hasData && f.delta >= 2; }).map(function(f) { return f.label; }).slice(0, 3).join(', ');
  return '\n\nBIOLOGISCHES ALTER: ' + r.bioAge + ' (Chrono: ' + r.chronoAge + ', Diff: ' + (r.ageDiff > 0 ? '+' : '') + r.ageDiff + 'J)' + (strong ? '\nStaerken: ' + strong : '') + (weak ? '\nSchwaecheN: ' + weak : '');
};

// Modal
window.openBioAgeModal = function() {
  window.toggleModal('bioAgeModal');
  setTimeout(function() { window._renderBioAge('bioAgeContainer'); }, 100);
};

// ============================================================
// FEATURE: LIVE VOICE COACH (spricht nach jedem Satz)
// ============================================================


// ============================================================
// FEATURE: TRAININGS-DNA PROFIL
// ============================================================

window._DNA_KEY = 'base_training_dna';

window._calculateTrainingDNA = function() {
  var all = (window.workouts || []).filter(function(w) { return w.archived; });
  if (all.length < 15) return null;
  var strengthW = all.filter(function(w) { return w.category === 'strength'; });
  var cardioW = all.filter(function(w) { return w.category === 'cardio'; });
  var mobilityW = all.filter(function(w) { return w.category === 'recovery'; });

  // Muskeltyp-Schaetzung via Rep-Verteilung
  var repDist = { low: 0, mid: 0, high: 0 };
  var totalSets = 0;
  strengthW.forEach(function(w) { (w.setDetails || []).forEach(function(s) { var r = parseInt(s.reps) || 0; if (r > 0) { totalSets++; if (r <= 5) repDist.low++; else if (r <= 12) repDist.mid++; else repDist.high++; } }); });
  var fiberType = 'balanced';
  if (totalSets > 0) { if (repDist.low / totalSets > 0.4) fiberType = 'fast_twitch'; else if (repDist.high / totalSets > 0.4) fiberType = 'slow_twitch'; }

  // Recovery Speed
  var gaps = [];
  for (var i = 0; i < Math.min(all.length - 1, 20); i++) { var d1 = new Date(all[i].date); var d2 = new Date(all[i + 1].date); var diff = (d1 - d2) / 86400000; if (diff > 0 && diff < 10) gaps.push(diff); }
  var avgGap = gaps.length > 0 ? gaps.reduce(function(a, b) { return a + b; }, 0) / gaps.length : 2;
  var recoveryType = avgGap <= 1.2 ? 'fast' : avgGap <= 2.0 ? 'moderate' : 'slow';

  // Progression Speed
  var w4ago = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];
  var prCount = 0;
  all.filter(function(w) { return w.date >= w4ago; }).forEach(function(w) { if (w.progressBadge && String(w.progressBadge).includes('+')) prCount++; });
  var progressionRate = prCount >= 8 ? 'fast' : prCount >= 4 ? 'moderate' : 'slow';

  // Training Style
  var dominantStyle = 'hybrid';
  if (all.length > 0) {
    var sR = strengthW.length / all.length; var cR = cardioW.length / all.length; var mR = mobilityW.length / all.length;
    if (sR > 0.6) dominantStyle = 'powerbuilder'; else if (cR > 0.6) dominantStyle = 'endurance_athlete'; else if (mR > 0.3) dominantStyle = 'wellness_athlete';
  }

  var optimalSplit = avgGap <= 1.5 ? '5-6x/Woche \u2014 Push/Pull/Legs' : avgGap <= 2.5 ? '4x/Woche \u2014 Upper/Lower Split' : '3x/Woche \u2014 Full Body';
  var optimalReps = fiberType === 'fast_twitch' ? '3-6 Reps bei 80-90% 1RM' : fiberType === 'slow_twitch' ? '12-20 Reps bei 60-70% 1RM' : '6-12 Reps bei 70-85% 1RM';

  var dna = { fiberType: fiberType, recoveryType: recoveryType, progressionRate: progressionRate, dominantStyle: dominantStyle, optimalSplit: optimalSplit, optimalReps: optimalReps, avgGap: Math.round(avgGap * 10) / 10, repDistribution: repDist, totalWorkouts: all.length, generatedAt: new Date().toISOString() };
  localStorage.setItem(window._DNA_KEY, JSON.stringify(dna));
  return dna;
};

window._generateDNAReport = async function() {
  var dna = window._calculateTrainingDNA();
  if (!dna) { window.showToast('Mindestens 15 Workouts f\u00FCr DNA-Analyse n\u00F6tig', 'warn'); return; }
  var aiCtx = window.buildAIContext ? window.buildAIContext() : {};
  var fiberLabels = { fast_twitch: 'Fast-Twitch dominiert (Typ II)', slow_twitch: 'Slow-Twitch dominiert (Typ I)', balanced: 'Ausgeglichen (Mix Typ I/II)' };
  var recoveryLabels = { fast: 'Schnelle Erholung (<1.5 Tage)', moderate: 'Moderate Erholung (1.5-2.5 Tage)', slow: 'Langsame Erholung (>2.5 Tage)' };

  var prompt = 'Du bist ein Elite Sportwissenschaftler und erstellst ein personalisiertes Trainings-DNA Profil.\n\nANALYSIERTE DATEN (' + dna.totalWorkouts + ' Workouts):\n- Muskeltyp: ' + fiberLabels[dna.fiberType] + '\n- Erholungstyp: ' + recoveryLabels[dna.recoveryType] + '\n- Progressionsrate: ' + dna.progressionRate + '\n- Trainingsstil: ' + dna.dominantStyle + '\n- \u00D8 Pause: ' + dna.avgGap + ' Tage\n\nATHLETEN-PROFIL:\n' + (aiCtx.prof || '') + '\n\nErstelle ein TRAININGS-DNA PROFIL (max 250 Woerter):\n## Dein Athleten-Typ\n## Deine Staerken\n## Dein optimales Training\n## Dein haeufigster Fehler\n## Kurzfassung (1 Satz zum Teilen)\n\nSei konkret und datenbasiert. Deutsch.';

  var btn = document.getElementById('dnaGenerateBtn');
  if (btn) { btn.textContent = '\u23F3 Analysiere...'; btn.style.opacity = '0.6'; }
  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 30000);
    var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, type: 'training_dna' }), signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var text = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '';
    dna.report = text; dna.reportAt = new Date().toISOString();
    localStorage.setItem(window._DNA_KEY, JSON.stringify(dna));
    window.showModal('\uD83E\uDDEC Dein Trainings-DNA Profil', '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap;max-height:70vh;overflow-y:auto">' + window._sanitizeAIHtml(text) + '</div><button onclick="window._shareDNA()" class="pointer-events-auto w-full" style="margin-top:12px;padding:9px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;border:1px solid var(--border-hex);color:var(--text-muted)">\uD83D\uDCE4 DNA teilen</button>', false);
    if (window.awardXP) window.awardXP('scan', 75);
  } catch (e) { window.showToast('DNA-Analyse fehlgeschlagen', 'error'); }
  finally { if (btn) { btn.textContent = '\uD83E\uDDEC DNA analysieren'; btn.style.opacity = '1'; } }
};

window._shareDNA = function() {
  var dna = JSON.parse(localStorage.getItem(window._DNA_KEY) || 'null');
  if (!dna) return;
  var text = 'Mein Trainings-DNA auf BASE:\n' + (dna.report ? dna.report.split('\n').slice(-3).join(' ') : dna.optimalReps) + '\n\nbase-app.tech';
  if (navigator.share) { navigator.share({ title: 'Mein Trainings-DNA', text: text }); }
  else if (navigator.clipboard) { navigator.clipboard.writeText(text).then(function() { window.showToast('DNA kopiert!'); }); }
};

// ============================================================
// FEATURE: PLATEAU BREAKER (Stagnations-Erkennung)
// ============================================================

window._PLATEAU_KEY = 'base_plateaus';

window._detectPlateaus = function() {
  var all = (window.workouts || []).filter(function(w) { return w.archived && w.category === 'strength'; });
  var byExercise = {};
  all.forEach(function(w) { if (!byExercise[w.exercise]) byExercise[w.exercise] = []; byExercise[w.exercise].push(w); });
  var plateaus = [];
  var threeWeeksAgo = new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0];

  Object.keys(byExercise).forEach(function(ex) {
    var sessions = byExercise[ex].filter(function(w) { return w.date >= threeWeeksAgo; }).sort(function(a, b) { return a.date.localeCompare(b.date); });
    if (sessions.length < 3) return;
    var maxWeights = sessions.map(function(w) { return w.maxWeight || Math.max.apply(null, (w.setDetails || []).map(function(s) { return parseFloat(s.weight) || 0; }).concat([0])); }).filter(function(w) { return w > 0; });
    if (maxWeights.length < 3) return;
    var last3 = maxWeights.slice(-3);
    var maxOf3 = Math.max.apply(null, last3);
    var minOf3 = Math.min.apply(null, last3);
    if (maxOf3 - minOf3 <= 2.5 && maxOf3 > 0) {
      plateaus.push({ exercise: ex, currentMax: maxOf3, sessions: sessions.length, since: sessions[sessions.length - 3].date, weeks: Math.round((new Date() - new Date(sessions[sessions.length - 3].date)) / 604800000) });
    }
  });
  return plateaus;
};

window._generatePlateauBreaker = async function(plateau) {
  if (typeof plateau === 'string') { try { plateau = JSON.parse(plateau); } catch (e) { return; } }
  var profile = window.userProfile || {};
  var orms = JSON.parse(localStorage.getItem('base_1rm_data') || '{}');
  var est1RM = orms[plateau.exercise] || plateau.currentMax * 1.1;
  var prompt = 'Du bist Krafttrainer mit CSCS-Zertifizierung.\n\nPLATEAU-PROBLEM:\n- Uebung: ' + plateau.exercise + '\n- Aktuelles Max: ' + plateau.currentMax + 'kg\n- Stagnation seit: ' + plateau.weeks + ' Wochen\n- Geschaetztes 1RM: ' + Math.round(est1RM) + 'kg\n\nATHLETEN-PROFIL:\n- Ziel: ' + (profile.goal || 'unbekannt') + '\n- Erfahrung: ' + (profile.experience || 'unbekannt') + '\n\nErstelle einen 2-Wochen PLATEAU BREAKER Plan:\n## Woche 1: Deload\n## Woche 2: Ueberladung / Variation\n## Woche 3+: Neuer Versuch\n## Sofortmassnahme heute\n\nWissenschaftlich fundiert (Zourdos 2016, Schoenfeld 2017). Konkret mit Zahlen. Max 200 Woerter. Deutsch.';
  try {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 25000);
    var res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, type: 'plateau_breaker' }), signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var text = data.reply || (data.parts && data.parts[data.parts.length - 1] && data.parts[data.parts.length - 1].text) || '';
    window.showModal('\u26A1 Plateau Breaker: ' + plateau.exercise, '<div style="font-size:12px;line-height:1.8;color:var(--text-main);white-space:pre-wrap;max-height:70vh;overflow-y:auto">' + window._sanitizeAIHtml(text) + '</div>', false);
    if (window.awardXP) window.awardXP('coachChat', 25);
  } catch (e) { window.showToast('Plateau Breaker fehlgeschlagen', 'error'); }
};

window._renderPlateauWidget = function(containerId) {
  var container = document.getElementById(containerId || 'plateauContainer');
  if (!container) return;
  var plateaus = window._detectPlateaus();
  if (plateaus.length === 0) { container.innerHTML = '<p style="font-size:11px;color:var(--text-muted);text-align:center;padding:10px">\u2705 Kein Plateau erkannt \u2014 gute Progression!</p>'; return; }
  container.innerHTML =
    '<p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#e8c86a;margin-bottom:8px">\u26A0\uFE0F ' + plateaus.length + ' Plateau' + (plateaus.length > 1 ? 's' : '') + ' erkannt</p>' +
    plateaus.slice(0, 3).map(function(p) {
      return '<div style="padding:10px 12px;background:rgba(232,200,106,0.06);border:1px solid rgba(232,200,106,0.2);border-radius:11px;margin-bottom:6px">' +
        '<div style="margin-bottom:6px"><p style="font-size:12px;font-weight:600;color:var(--text-main)">' + window._escapeHtml(p.exercise) + '</p><p style="font-size:10px;color:var(--text-muted)">' + p.currentMax + 'kg \u00B7 ' + p.weeks + ' Wochen ohne Fortschritt</p></div>' +
        '<button onclick="window._generatePlateauBreaker(\'' + window._escapeHtml(JSON.stringify(p)).replace(/'/g, "\\'") + '\')" class="pointer-events-auto w-full" style="padding:7px;border-radius:9px;font-size:11px;font-weight:600;cursor:pointer;background:rgba(232,200,106,0.1);border:1px solid rgba(232,200,106,0.25);color:#e8c86a">\u26A1 Plateau Breaker Plan</button></div>';
    }).join('');
};

window._checkPlateausProactive = function() {
  var lastCheck = localStorage.getItem('base_plateau_check');
  var today = new Date().toISOString().split('T')[0];
  if (lastCheck === today) return;
  localStorage.setItem('base_plateau_check', today);
  var plateaus = window._detectPlateaus();
  if (plateaus.length > 0) {
    setTimeout(function() {
      window.showToast('\u26A0\uFE0F Plateau: ' + plateaus[0].exercise + ' \u2014 ' + plateaus[0].weeks + ' Wochen ohne Fortschritt', null, null, null, 8000);
    }, 5000);
  }
};

// App-Start: Plateau-Check
setTimeout(function() { if (window._checkPlateausProactive) window._checkPlateausProactive(); }, 10000);
