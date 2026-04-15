(function() {
  'use strict';

  // ============================================================
  // RANKING SYSTEM — Ampel (Rot→Gruen)
  // ============================================================
  var RANKS = [
    {n:'Kein Training',c:'#c62828',tc:'#ef9a9a',bg:'rgba(198,40,40,.2)',min:0},
    {n:'Bronze I',c:'#ef6c00',tc:'#ffcc80',bg:'rgba(239,108,0,.2)',min:1},
    {n:'Bronze II',c:'#ef6c00',tc:'#ffcc80',bg:'rgba(239,108,0,.2)',min:300},
    {n:'Bronze III',c:'#ef6c00',tc:'#ffcc80',bg:'rgba(239,108,0,.2)',min:600},
    {n:'Silver I',c:'#f9a825',tc:'#fff176',bg:'rgba(249,168,37,.2)',min:1000},
    {n:'Silver II',c:'#f9a825',tc:'#fff176',bg:'rgba(249,168,37,.2)',min:1500},
    {n:'Gold I',c:'#c6d84c',tc:'#f0f4c3',bg:'rgba(198,216,76,.2)',min:2000},
    {n:'Gold II',c:'#c6d84c',tc:'#f0f4c3',bg:'rgba(198,216,76,.2)',min:3000},
    {n:'Platinum',c:'#43a047',tc:'#a5d6a7',bg:'rgba(67,160,71,.2)',min:4000},
    {n:'Diamond',c:'#00897b',tc:'#80cbc4',bg:'rgba(0,137,123,.2)',min:6000}
  ];

  function getR(xp) {
    if (!xp) return RANKS[0];
    for (var i = RANKS.length - 1; i >= 0; i--) { if (xp >= RANKS[i].min) return RANKS[i]; }
    return RANKS[0];
  }

  // ============================================================
  // MUSKEL-GRUPPEN: Mapping von exercise-db bodyPart/target
  // ============================================================
  var MUSCLE_KEYWORDS = {
    chest:       ['chest','pectorals','pecs','brust'],
    front_delt:  ['delts','shoulders','deltoid','anterior','schulter'],
    rear_delt:   ['rear delt','posterior delt'],
    biceps:      ['biceps','brachialis'],
    triceps:     ['triceps'],
    forearms:    ['lower arms','forearms','brachioradialis','unterarm'],
    traps:       ['traps','trapezius'],
    lats:        ['lats','latissimus'],
    abs:         ['waist','abs','rectus','bauch'],
    obliques:    ['obliques'],
    lower_back:  ['lower back','erector','unterer rücken'],
    quads:       ['quads','quadriceps'],
    hamstrings:  ['hamstrings','beinbeuger'],
    glutes:      ['glutes','gluteus','gesäß','po'],
    calves:      ['lower legs','calves','gastrocnemius','waden']
  };

  var BP_TARGET_MAP = {
    'chest':      {_default:'chest'},
    'shoulders':  {_default:'front_delt','rear delts':'rear_delt','posterior':'rear_delt'},
    'upper arms': {_default:'biceps','triceps':'triceps'},
    'lower arms': {_default:'forearms'},
    'back':       {_default:'lats','traps':'traps','trapezius':'traps','upper back':'traps','lower back':'lower_back','erector':'lower_back'},
    'waist':      {_default:'abs','obliques':'obliques'},
    'upper legs': {_default:'quads','hamstrings':'hamstrings','glutes':'glutes','gluteus':'glutes'},
    'lower legs': {_default:'calves'},
    'cardio':     {}
  };

  // ============================================================
  // XP BERECHNUNG AUS ECHTEN WORKOUTS (90 Tage)
  // ============================================================
  window._calcMuscleXP = function() {
    var xpMap = {};
    Object.keys(MUSCLE_KEYWORDS).forEach(function(k) { xpMap[k] = 0; });
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    (window.workouts || []).forEach(function(w) {
      if (!w.archived) return;
      if (new Date(w.date) < cutoff) return;

      var bp = (w.bodyPart || '').toLowerCase();
      var tg = (w.target || '').toLowerCase();

      var xpGain = 0;
      if (w.setDetails && w.setDetails.length > 0) {
        w.setDetails.forEach(function(s) {
          if (s.type === 'warmup') return;
          var reps = parseInt(s.reps) || 8;
          var weight = parseFloat(s.weight) || 1;
          xpGain += Math.round(reps * Math.min(weight * 0.08, 8) + reps * 0.5);
        });
      } else {
        xpGain = 10;
      }
      if (!xpGain) return;

      var matched = false;
      var bpEntry = BP_TARGET_MAP[bp];
      if (bpEntry) {
        var muscle = null;
        Object.keys(bpEntry).forEach(function(key) {
          if (key !== '_default' && tg.indexOf(key) !== -1) muscle = bpEntry[key];
        });
        if (!muscle) muscle = bpEntry._default;
        if (muscle && xpMap.hasOwnProperty(muscle)) {
          xpMap[muscle] += xpGain;
          matched = true;
        }
      }
      if (!matched) {
        var combined = bp + ' ' + tg + ' ' + (w.exercise || '').toLowerCase();
        Object.keys(MUSCLE_KEYWORDS).forEach(function(muscle) {
          var keywords = MUSCLE_KEYWORDS[muscle];
          for (var i = 0; i < keywords.length; i++) {
            if (combined.indexOf(keywords[i]) !== -1) { xpMap[muscle] += xpGain; break; }
          }
        });
      }
    });
    return xpMap;
  };

  // ============================================================
  // SVG BODY SILHOUETTE (160x420 viewBox, athletisch)
  // ============================================================
  var BODY_PATHS =
    '<ellipse cx="80" cy="20" rx="16" ry="18"/>' +
    '<path d="M73,36 C73,42 68,46 67,52 L93,52 C92,46 87,42 87,36 Z"/>' +
    '<path d="M55,52 C40,56 22,68 16,86 C10,104 10,130 12,154 C14,170 20,180 30,186 C38,190 44,196 46,210 L114,210 C116,196 122,190 130,186 C140,180 146,170 148,154 C150,130 150,104 144,86 C138,68 120,56 105,52 Z"/>' +
    '<path d="M18,72 C10,82 5,104 4,126 C3,142 8,154 18,158 C26,162 34,154 37,140 C40,124 36,98 28,80 Z"/>' +
    '<path d="M142,72 C150,82 155,104 156,126 C157,142 152,154 142,158 C134,162 126,154 123,140 C120,124 124,98 132,80 Z"/>' +
    '<path d="M6,160 C1,172 -1,188 2,202 C4,212 10,218 18,218 C25,218 29,210 29,200 C29,186 16,164 6,160 Z"/>' +
    '<path d="M154,160 C159,172 161,188 158,202 C156,212 150,218 142,218 C135,218 131,210 131,200 C131,186 144,164 154,160 Z"/>' +
    '<path d="M2,202 C-1,212 0,222 5,226 C9,229 16,227 18,220 C20,213 15,205 8,203 Z"/>' +
    '<path d="M158,202 C161,212 160,222 155,226 C151,229 144,227 142,220 C140,213 145,205 152,203 Z"/>' +
    '<path d="M46,212 C36,228 30,254 32,280 C34,300 44,314 58,316 C70,318 78,306 78,290 L80,214 Z"/>' +
    '<path d="M114,212 C124,228 130,254 128,280 C126,300 116,314 102,316 C90,318 82,306 82,290 L80,214 Z"/>' +
    '<path d="M34,314 C24,330 20,356 22,376 C24,390 32,398 44,398 C56,398 62,388 62,374 C62,356 50,320 40,312 Z"/>' +
    '<path d="M126,314 C136,330 140,356 138,376 C136,390 128,398 116,398 C104,398 98,388 98,374 C98,356 110,320 120,312 Z"/>' +
    '<path d="M22,374 C18,384 18,396 22,402 C26,407 36,407 46,405 C54,403 60,397 60,391 L62,374 Z"/>' +
    '<path d="M138,374 C142,384 142,396 138,402 C134,407 124,407 114,405 C106,403 100,397 100,391 L98,374 Z"/>';

  // Vordere Muskelpfade (160x420)
  var FRONT_MUSCLES = [
    {id:'f_ch_l', muscle:'chest', d:'M38,60 C28,54 16,62 12,78 C8,94 12,112 26,118 C38,122 52,115 58,100 C64,84 58,66 38,60 Z'},
    {id:'f_ch_r', muscle:'chest', d:'M122,60 C132,54 144,62 148,78 C152,94 148,112 134,118 C122,122 108,115 102,100 C96,84 102,66 122,60 Z'},
    {id:'f_fd_l', muscle:'front_delt', d:'M34,56 C24,50 8,60 3,77 C-2,94 3,113 17,119 C28,124 44,116 50,98 C56,80 48,62 34,56 Z'},
    {id:'f_fd_r', muscle:'front_delt', d:'M126,56 C136,50 152,60 157,77 C162,94 157,113 143,119 C132,124 116,116 110,98 C104,80 112,62 126,56 Z'},
    {id:'f_bi_l', muscle:'biceps', d:'M13,74 C5,86 1,110 1,130 C1,148 6,160 17,162 C26,164 35,155 38,140 C41,123 37,96 26,78 Z'},
    {id:'f_bi_r', muscle:'biceps', d:'M147,74 C155,86 159,110 159,130 C159,148 154,160 143,162 C134,164 125,155 122,140 C119,123 123,96 134,78 Z'},
    {id:'f_fo_l', muscle:'forearms', d:'M6,162 C1,174 -1,192 2,206 C4,216 11,222 19,222 C27,222 31,213 31,202 C31,188 17,166 6,162 Z'},
    {id:'f_fo_r', muscle:'forearms', d:'M154,162 C159,174 161,192 158,206 C156,216 149,222 141,222 C133,222 129,213 129,202 C129,188 143,166 154,162 Z'},
    {id:'f_a1l', muscle:'abs', d:'M65,116 C60,116 58,120 59,127 C60,133 65,137 71,135 C76,133 77,126 75,120 C73,116 68,116 65,116 Z'},
    {id:'f_a1r', muscle:'abs', d:'M95,116 C90,116 88,120 89,126 C90,132 95,136 101,134 C106,132 107,125 105,119 C103,116 98,116 95,116 Z'},
    {id:'f_a2l', muscle:'abs', d:'M64,138 C59,138 57,142 58,149 C59,155 64,158 70,156 C75,154 76,147 74,141 C72,138 67,138 64,138 Z'},
    {id:'f_a2r', muscle:'abs', d:'M96,138 C91,138 89,141 90,148 C91,154 96,157 102,155 C107,153 108,146 106,140 C104,138 99,138 96,138 Z'},
    {id:'f_a3l', muscle:'abs', d:'M64,159 C59,159 57,163 58,170 C59,176 64,179 70,177 C75,175 76,168 74,162 C72,159 67,159 64,159 Z'},
    {id:'f_a3r', muscle:'abs', d:'M96,159 C91,159 89,162 90,169 C91,175 96,178 102,176 C107,174 108,167 106,161 C104,159 99,159 96,159 Z'},
    {id:'f_ob_l', muscle:'obliques', d:'M32,112 C26,126 24,146 26,164 C28,178 38,190 52,194 C58,196 60,189 58,183 C56,167 52,148 50,132 C48,116 38,108 32,112 Z'},
    {id:'f_ob_r', muscle:'obliques', d:'M128,112 C134,126 136,146 134,164 C132,178 122,190 108,194 C102,196 100,189 102,183 C104,167 108,148 110,132 C112,116 122,108 128,112 Z'},
    {id:'f_hip_l',muscle:'quads', d:'M52,192 C46,202 44,214 49,224 C53,232 63,236 72,231 C79,227 80,219 78,212 C75,203 66,190 52,192 Z'},
    {id:'f_hip_r',muscle:'quads', d:'M108,192 C114,202 116,214 111,224 C107,232 97,236 88,231 C81,227 80,219 82,212 C85,203 94,190 108,192 Z'},
    {id:'f_qu_l', muscle:'quads', d:'M50,216 C40,234 36,260 38,284 C40,304 50,318 66,320 C80,322 86,307 86,292 L82,216 Z'},
    {id:'f_qu_r', muscle:'quads', d:'M110,216 C120,234 124,260 122,284 C120,304 110,318 94,320 C80,322 74,307 74,292 L78,216 Z'},
    {id:'f_vm_l', muscle:'quads', d:'M58,274 C52,286 50,300 55,311 C58,319 65,322 71,320 C78,318 80,309 78,298 C76,285 66,268 58,274 Z'},
    {id:'f_vm_r', muscle:'quads', d:'M102,274 C108,286 110,300 105,311 C102,319 95,322 89,320 C82,318 80,309 82,298 C84,285 94,268 102,274 Z'},
    {id:'f_ti_l', muscle:'calves', d:'M38,316 C28,334 24,358 26,378 C28,392 36,400 46,399 C57,398 63,387 62,372 C61,355 50,320 38,316 Z'},
    {id:'f_ti_r', muscle:'calves', d:'M122,316 C132,334 136,358 134,378 C132,392 124,400 114,399 C103,398 97,387 98,372 C99,355 110,320 122,316 Z'}
  ];

  // Hintere Muskelpfade (160x420)
  var BACK_MUSCLES = [
    {id:'b_tr', muscle:'traps', d:'M80,38 C58,44 32,62 16,84 C6,100 11,122 30,130 C44,136 62,127 70,108 C75,93 77,72 80,58 C83,72 85,93 90,108 C98,127 116,136 130,130 C149,122 154,100 144,84 C128,62 102,44 80,38 Z'},
    {id:'b_rd_l',muscle:'rear_delt', d:'M34,56 C24,50 8,60 3,77 C-2,94 3,113 17,119 C28,124 44,116 50,98 C56,80 48,62 34,56 Z'},
    {id:'b_rd_r',muscle:'rear_delt', d:'M126,56 C136,50 152,60 157,77 C162,94 157,113 143,119 C132,124 116,116 110,98 C104,80 112,62 126,56 Z'},
    {id:'b_la_l',muscle:'lats', d:'M27,128 C14,144 8,170 10,198 C12,218 26,232 46,236 C59,238 67,225 69,210 C71,192 67,162 56,142 C48,126 35,120 27,128 Z'},
    {id:'b_la_r',muscle:'lats', d:'M133,128 C146,144 152,170 150,198 C148,218 134,232 114,236 C101,238 93,225 91,210 C89,192 93,162 104,142 C112,126 125,120 133,128 Z'},
    {id:'b_tc_l',muscle:'triceps', d:'M13,74 C5,86 1,110 1,130 C1,148 6,160 17,162 C26,164 35,155 38,140 C41,123 37,96 26,78 Z'},
    {id:'b_tc_r',muscle:'triceps', d:'M147,74 C155,86 159,110 159,130 C159,148 154,160 143,162 C134,164 125,155 122,140 C119,123 123,96 134,78 Z'},
    {id:'b_rh_l',muscle:'traps', d:'M56,128 C52,136 52,148 56,156 C60,163 67,165 74,162 C79,159 80,152 80,145 C79,137 75,128 70,125 C64,122 58,123 56,128 Z'},
    {id:'b_rh_r',muscle:'traps', d:'M104,128 C108,136 108,148 104,156 C100,163 93,165 86,162 C81,159 80,152 80,145 C81,137 85,128 90,125 C96,122 102,123 104,128 Z'},
    {id:'b_er_l',muscle:'lower_back', d:'M66,162 C62,175 60,192 63,207 C65,219 72,225 79,222 C86,219 87,209 85,196 C82,181 74,162 66,162 Z'},
    {id:'b_er_r',muscle:'lower_back', d:'M94,162 C98,175 100,192 97,207 C95,219 88,225 81,222 C74,219 73,209 75,196 C78,181 86,162 94,162 Z'},
    {id:'b_gl_l',muscle:'glutes', d:'M23,220 C12,238 8,264 10,286 C12,305 25,320 44,322 C59,324 69,311 69,294 C69,272 56,244 40,222 Z'},
    {id:'b_gl_r',muscle:'glutes', d:'M137,220 C148,238 152,264 150,286 C148,305 135,320 116,322 C101,324 91,311 91,294 C91,272 104,244 120,222 Z'},
    {id:'b_ha_l',muscle:'hamstrings', d:'M21,318 C10,338 6,365 8,386 C10,400 22,408 38,406 C54,404 62,390 62,372 C62,352 46,326 32,316 Z'},
    {id:'b_ha_r',muscle:'hamstrings', d:'M139,318 C150,338 154,365 152,386 C150,400 138,408 122,406 C106,404 98,390 98,372 C98,352 114,326 128,316 Z'},
    {id:'b_ca_l',muscle:'calves', d:'M26,372 C20,384 19,397 23,404 C27,410 35,412 44,410 C53,408 57,400 55,390 C53,378 36,367 26,372 Z'},
    {id:'b_ca_r',muscle:'calves', d:'M134,372 C140,384 141,397 137,404 C133,410 125,412 116,410 C107,408 103,400 105,390 C107,378 124,367 134,372 Z'}
  ];

  var MUSCLE_DEF = [
    {id:'chest',      n:'Brust',           cat:'up', ids:['f_ch_l','f_ch_r']},
    {id:'front_delt', n:'Schultern vorn',  cat:'up', ids:['f_fd_l','f_fd_r']},
    {id:'rear_delt',  n:'Schultern hint.', cat:'up', ids:['b_rd_l','b_rd_r']},
    {id:'biceps',     n:'Bizeps',          cat:'up', ids:['f_bi_l','f_bi_r']},
    {id:'triceps',    n:'Trizeps',         cat:'up', ids:['b_tc_l','b_tc_r']},
    {id:'forearms',   n:'Unterarme',       cat:'up', ids:['f_fo_l','f_fo_r']},
    {id:'traps',      n:'Trapez',          cat:'up', ids:['b_tr','b_rh_l','b_rh_r']},
    {id:'lats',       n:'Latissimus',      cat:'up', ids:['b_la_l','b_la_r']},
    {id:'abs',        n:'Bauch',           cat:'co', ids:['f_a1l','f_a1r','f_a2l','f_a2r','f_a3l','f_a3r']},
    {id:'obliques',   n:'Obliques',        cat:'co', ids:['f_ob_l','f_ob_r']},
    {id:'lower_back', n:'Unterer Ruecken', cat:'co', ids:['b_er_l','b_er_r']},
    {id:'quads',      n:'Quadrizeps',      cat:'lo', ids:['f_qu_l','f_qu_r','f_vm_l','f_vm_r','f_hip_l','f_hip_r']},
    {id:'hamstrings', n:'Hamstrings',      cat:'lo', ids:['b_ha_l','b_ha_r']},
    {id:'glutes',     n:'Gesaess',         cat:'lo', ids:['b_gl_l','b_gl_r']},
    {id:'calves',     n:'Waden',           cat:'lo', ids:['f_ti_l','f_ti_r','b_ca_l','b_ca_r']}
  ];

  // ============================================================
  // SVG BUILDER
  // ============================================================
  function buildSVG(muscles) {
    var paths = muscles.map(function(m) {
      return '<path id="' + m.id + '" data-mid="' + m.muscle + '" onclick="window._mmSelect(\'' + m.muscle + '\')" class="mm-muscle" d="' + m.d + '" fill="#192919" stroke="#1e3020" stroke-width="0.6" style="cursor:pointer;transition:opacity .2s,filter .2s;pointer-events:auto"/>';
    }).join('');
    return '<svg viewBox="0 0 160 420" class="mm-svg" style="overflow:visible">' +
      '<g fill="#0d160d" stroke="#1a2e1a" stroke-width="0.8">' + BODY_PATHS + '</g>' +
      paths + '</svg>';
  }

  // ============================================================
  // LIST — sorted ascending (weakest first)
  // ============================================================
  function buildList(xpMap, filter) {
    var maxXP = Math.max.apply(null, Object.keys(xpMap).map(function(k){return xpMap[k];})) || 1;
    var filtered = filter === 'all' ? MUSCLE_DEF : MUSCLE_DEF.filter(function(m){return m.cat === filter;});
    filtered = filtered.slice().sort(function(a,b){return (xpMap[a.id]||0)-(xpMap[b.id]||0);});
    return filtered.map(function(m) {
      var xp = xpMap[m.id] || 0;
      var r = getR(xp);
      var pct = Math.round(xp / maxXP * 100);
      var esc = window._escapeHtml ? window._escapeHtml(m.n) : m.n;
      return '<div onclick="window._mmSelect(\'' + m.id + '\')" data-mid="' + m.id + '" class="mm-item" style="display:flex;align-items:center;gap:6px;padding:7px 9px;background:#111811;border:1px solid #1a281a;border-radius:8px;cursor:pointer;transition:all .15s;pointer-events:auto">' +
        '<div style="width:8px;height:8px;border-radius:3px;background:' + r.c + ';flex-shrink:0"></div>' +
        '<span style="flex:1;font-size:11px;font-weight:600;color:#c8d4c8">' + esc + '</span>' +
        '<div style="width:56px;height:4px;background:#1a281a;border-radius:2px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + r.c + ';border-radius:2px"></div></div>' +
        '<span style="font-size:10px;color:#3a5038;min-width:28px;text-align:right">' + (xp || '\u2014') + '</span>' +
        '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:6px;background:' + r.bg + ';color:' + r.tc + '">' + r.n + '</span>' +
      '</div>';
    }).join('');
  }

  // ============================================================
  // MODAL
  // ============================================================
  window.openMuscleMap = function() {
    var existing = document.getElementById('muscleMapModal');
    if (existing) existing.remove();

    var xpMap = window._calcMuscleXP();
    var total = 0;
    Object.keys(xpMap).forEach(function(k) { total += xpMap[k]; });
    var avg = Math.round(total / Object.keys(xpMap).length);
    var ovRank = getR(avg);

    var frontSVG = buildSVG(FRONT_MUSCLES);
    var backSVG = buildSVG(BACK_MUSCLES);
    var listHTML = buildList(xpMap, 'all');

    var rkIco = {Kein:'\u26A0\uFE0F',Bronze:'\uD83E\uDD49',Silver:'\uD83E\uDD48',Gold:'\uD83E\uDD47',Platinum:'\uD83D\uDCAA',Diamond:'\uD83D\uDC8E'};
    var icoKey = 'Bronze';
    Object.keys(rkIco).forEach(function(k) { if (ovRank.n.indexOf(k) !== -1) icoKey = k; });

    var modal = document.createElement('div');
    modal.id = 'muscleMapModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:800;background:rgba(0,0,0,0.85);display:flex;align-items:flex-end;justify-content:center;pointer-events:auto';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Muskel-Ranking');

    modal.innerHTML =
      '<div style="width:100%;max-width:420px;background:#090c09;border-radius:20px 20px 0 0;max-height:92vh;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:14px 14px 40px">' +

        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">' +
          '<div>' +
            '<div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#2a3e2c;margin-bottom:3px">Muskel-Ranking</div>' +
            '<div style="font-size:17px;font-weight:700;color:' + ovRank.c + '">' + ovRank.n + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#111811;border:1px solid #1c2c1c;border-radius:9px">' +
            '<div style="width:22px;height:22px;border-radius:50%;background:' + ovRank.c + '22;display:flex;align-items:center;justify-content:center;font-size:11px">' + rkIco[icoKey] + '</div>' +
            '<div>' +
              '<div style="font-size:11px;font-weight:600;color:#c8d4c8">' + total.toLocaleString() + ' XP</div>' +
              '<div style="font-size:8px;color:#2a3e2c">90 Tage</div>' +
            '</div>' +
          '</div>' +
          '<button onclick="document.getElementById(\'muscleMapModal\').remove()" style="background:none;border:none;color:#4e6050;font-size:22px;cursor:pointer;pointer-events:auto;padding:0 0 0 8px" aria-label="Schliessen">\u00D7</button>' +
        '</div>' +

        '<div style="display:flex;justify-content:center;gap:60px;margin-bottom:3px">' +
          '<div style="font-size:8px;color:#253228;text-transform:uppercase;letter-spacing:.1em">Vorne</div>' +
          '<div style="font-size:8px;color:#253228;text-transform:uppercase;letter-spacing:.1em">Hinten</div>' +
        '</div>' +

        '<div id="mm-figs" style="display:flex;justify-content:center;gap:8px;margin-bottom:10px">' +
          frontSVG + backSVG +
        '</div>' +

        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;padding:7px 10px;background:#111811;border-radius:7px;align-items:center">' +
          '<span style="font-size:9px;color:#8a3030;font-weight:700">\u26A0 Defizit</span>' +
          '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#6a7868"><div style="width:9px;height:9px;border-radius:3px;background:#c62828"></div>Kein Training</div>' +
          '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#6a7868"><div style="width:9px;height:9px;border-radius:3px;background:#ef6c00"></div>Bronze</div>' +
          '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#6a7868"><div style="width:9px;height:9px;border-radius:3px;background:#f9a825"></div>Silver</div>' +
          '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#6a7868"><div style="width:9px;height:9px;border-radius:3px;background:#c6d84c"></div>Gold</div>' +
          '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#6a7868"><div style="width:9px;height:9px;border-radius:3px;background:#43a047"></div>Platinum</div>' +
          '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#6a7868"><div style="width:9px;height:9px;border-radius:3px;background:#00897b"></div>Diamond</div>' +
          '<span style="font-size:9px;color:#1a6040;font-weight:700">\u2713 Stark</span>' +
        '</div>' +

        '<div style="display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap" id="mm-filters">' +
          '<button onclick="window._mmFilter(\'all\',this)" class="mm-fb" style="padding:4px 12px;border-radius:20px;border:1px solid rgba(163,201,168,.4);font-size:10px;font-weight:600;cursor:pointer;background:rgba(163,201,168,.12);color:#a3c9a8;pointer-events:auto">Alle</button>' +
          '<button onclick="window._mmFilter(\'up\',this)" class="mm-fb" style="padding:4px 12px;border-radius:20px;border:1px solid #1e2c1e;font-size:10px;font-weight:600;cursor:pointer;background:transparent;color:#4e6050;pointer-events:auto">Oberkoerper</button>' +
          '<button onclick="window._mmFilter(\'lo\',this)" class="mm-fb" style="padding:4px 12px;border-radius:20px;border:1px solid #1e2c1e;font-size:10px;font-weight:600;cursor:pointer;background:transparent;color:#4e6050;pointer-events:auto">Unterkoerper</button>' +
          '<button onclick="window._mmFilter(\'co\',this)" class="mm-fb" style="padding:4px 12px;border-radius:20px;border:1px solid #1e2c1e;font-size:10px;font-weight:600;cursor:pointer;background:transparent;color:#4e6050;pointer-events:auto">Core</button>' +
        '</div>' +

        '<div id="mm-list" style="display:flex;flex-direction:column;gap:4px;max-height:280px;overflow-y:auto">' + listHTML + '</div>' +
      '</div>';

    document.body.appendChild(modal);
    window._mmColorAll(xpMap);
    setTimeout(resizeFigs, 50);
    if (window._refreshLucide) window._refreshLucide();
  };

  // ============================================================
  // COLOR MUSCLES — semi-transparent fills
  // ============================================================
  window._mmColorAll = function(xpMap) {
    if (!xpMap) xpMap = window._calcMuscleXP();
    FRONT_MUSCLES.concat(BACK_MUSCLES).forEach(function(m) {
      var el = document.getElementById(m.id);
      if (!el) return;
      var xp = xpMap[m.muscle] || 0;
      var r = getR(xp);
      el.setAttribute('fill', r.c + '40');
      el.setAttribute('stroke', r.c + '99');
      el.setAttribute('stroke-width', '0.8');
    });
  };

  // ============================================================
  // INTERACTIVITY
  // ============================================================
  var mmSel = null;

  window._mmSelect = function(id) {
    var xpMap = window._calcMuscleXP();
    if (mmSel === id) {
      mmSel = null;
      document.querySelectorAll('.mm-muscle').forEach(function(e) {
        e.style.opacity = '1'; e.style.filter = 'none';
      });
      window._mmColorAll(xpMap);
    } else {
      mmSel = id;
      var m = MUSCLE_DEF.find(function(x){return x.id===id;});
      var ids = m ? m.ids : [];
      var col = getR(xpMap[id] || 0).c;
      document.querySelectorAll('.mm-muscle').forEach(function(e) {
        if (ids.indexOf(e.id) !== -1) {
          e.style.opacity = '1';
          e.style.filter = 'brightness(2.2) drop-shadow(0 0 7px ' + col + ')';
        } else {
          e.style.opacity = '0.1';
          e.style.filter = 'none';
        }
      });
    }
    document.querySelectorAll('.mm-item').forEach(function(el) {
      var mid = el.getAttribute('data-mid');
      el.style.borderColor = mid === mmSel ? 'rgba(163,201,168,.4)' : '#1a281a';
      el.style.background = mid === mmSel ? 'rgba(163,201,168,.04)' : '#111811';
    });
  };

  window._mmFilter = function(f, btn) {
    mmSel = null;
    document.querySelectorAll('.mm-fb').forEach(function(b) {
      b.style.background = 'transparent';
      b.style.color = '#4e6050';
      b.style.borderColor = '#1e2c1e';
    });
    btn.style.background = 'rgba(163,201,168,.12)';
    btn.style.color = '#a3c9a8';
    btn.style.borderColor = 'rgba(163,201,168,.4)';
    document.querySelectorAll('.mm-muscle').forEach(function(e) {
      e.style.opacity = '1'; e.style.filter = 'none';
    });
    window._mmColorAll();
    var list = document.getElementById('mm-list');
    if (!list) return;
    list.innerHTML = buildList(window._calcMuscleXP(), f);
  };

  // SVG responsive sizing
  function resizeFigs() {
    var figs = document.getElementById('mm-figs');
    if (!figs) return;
    var w = Math.min((figs.offsetWidth - 16) / 2, 148);
    figs.querySelectorAll('svg').forEach(function(s) {
      s.setAttribute('width', Math.round(w));
    });
  }

  window.addEventListener('resize', function() {
    if (document.getElementById('muscleMapModal')) resizeFigs();
  });

})();
