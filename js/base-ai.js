// ============================================================
// BASE AI — Design KI, AI Coach, Co-Pilot, PreHab, Form Builder,
// Training Plan Generator, ZNS Readiness
// Ausgelagert aus app.html für Modularisierung
// ============================================================

// --- 4. DESIGN KI (Design Studio) ---
window.runDesignAI = async function() {
    if(!window.checkOnlineForAI()) return;
    var prompt = document.getElementById('designPrompt').value.trim();
    if (!prompt) { window.showToast(window.t("designEnterPrompt","Bitte beschreibe dein Wunsch-Design!")); return; }
    var btn = document.getElementById('btnRunDesignAi');
    var origHTML = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i> ' + window.t('aiGenerating','KI designt...');
    btn.disabled = true;
    if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons();

    var sysPrompt = 'Du bist ein weltklasse UI/UX Designer fuer die Fitness-App BASE.\n\n' +
        'DESIGN-PRINZIPIEN:\n' +
        '- Kohaerentes Farbsystem: Alle Farben muessen harmonisch zusammenpassen\n' +
        '- WCAG AA Kontrast (min 4.5:1 fuer Text auf Hintergrund)\n' +
        '- Die 4 Kategorie-Farben (Kraft, Ausdauer, Mobility, Sport) muessen zum Gesamtdesign passen\n' +
        '  aber trotzdem UNTERSCHEIDBAR sein\n' +
        '- Hintergrund: dunkel und tief, nie flach grau\n' +
        '- Shadow und Blur erzeugen Tiefe\n\n' +
        'VERFUEGBARE GOOGLE FONTS:\n' +
        'Heading: Sora, Barlow Condensed, Bebas Neue, Montserrat, Oswald, Rajdhani, Orbitron, ' +
        'Black Ops One, Exo 2, Oxanium, Russo One, Anton, Teko\n' +
        'Body: Outfit, Inter, DM Sans, IBM Plex Sans, Nunito Sans, Plus Jakarta Sans\n\n' +
        'WICHTIG zu catKraft/catAusdauer/catMobility/catSport:\n' +
        '- Diese 4 Farben werden fuer Kategorie-Tabs und Akzente genutzt\n' +
        '- Sie muessen sich DEUTLICH voneinander unterscheiden\n' +
        '- Sie muessen zum primary und bg Farbschema passen\n' +
        '- Kraft = Staerke/Power-Assoziation\n' +
        '- Ausdauer = Energie/Herz-Assoziation\n' +
        '- Mobility = Ruhe/Flow-Assoziation\n' +
        '- Sport = Warm/Vielseitig-Assoziation\n\n' +
        'Antworte NUR mit JSON (kein Markdown, keine Backticks):\n' +
        '{\n' +
        '  "theme": {\n' +
        '    "primary": "#HEX",\n' +
        '    "secondary": "#HEX",\n' +
        '    "bg": "#HEX — sehr dunkler Hintergrund",\n' +
        '    "surface": "#HEX — Kartenoberflaeche, etwas heller als bg",\n' +
        '    "innerBg": "#HEX — innere Elemente, etwas dunkler als bg",\n' +
        '    "border": "#HEX — subtile Raender",\n' +
        '    "textMain": "#HEX — Haupttext",\n' +
        '    "textMuted": "#HEX — gedaempfter Text",\n' +
        '    "fontHeading": "Exakter Google Font Name",\n' +
        '    "fontBody": "Exakter Google Font Name",\n' +
        '    "radius": "z.B. 16px",\n' +
        '    "shadow": "CSS box-shadow Wert",\n' +
        '    "blur": "CSS backdrop-blur z.B. 12px",\n' +
        '    "catKraft": "#HEX — Kraft-Kategorie Akzentfarbe",\n' +
        '    "catAusdauer": "#HEX — Ausdauer-Kategorie Akzentfarbe",\n' +
        '    "catMobility": "#HEX — Mobility-Kategorie Akzentfarbe",\n' +
        '    "catSport": "#HEX — Mein Sport Kategorie Akzentfarbe"\n' +
        '  },\n' +
        '  "designName": "Kurzer Name",\n' +
        '  "designDescription": "Ein Satz Beschreibung"\n' +
        '}';

    try {
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 30000);
        var res = await fetch('/.netlify/functions/gemini?_cb=' + Date.now(), {
            method: 'POST',
            cache: 'no-store',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: sysPrompt + '\n\nKundenwunsch: ' + prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
                userId: window._getAiUserId()
            })
        });
        clearTimeout(timeoutId);
        if (res.status === 429) { try { var errData = await res.json(); if(typeof window.showToast==='function') window.showToast(errData.error || 'Tageslimit erreicht.', 'error', 4000); } catch(e){} return; }
        if (!res.ok) throw new Error(window.t('aiServerError','Server Fehler'));
        var data = await res.json();
        var jsonStr = (data.reply || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
        var result = JSON.parse(jsonStr);
        if (result.theme) {
            localStorage.setItem('beastmode_v2_theme', JSON.stringify(result.theme));
            var name = result.designName || 'Custom';
            window.showToast(name + ' ' + window.t('aiGenerating','wird geladen...'));
            setTimeout(function() { window.location.reload(); }, 800);
        } else {
            throw new Error('No theme');
        }
    } catch(e) {
        window.showToast(window.t('aiError','KI Fehler') + ': ' + e.message);
    } finally {
        btn.innerHTML = origHTML;
        btn.disabled = false;
        if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons();
    }
};

window.toggleBuilderSection = function() { const b = document.getElementById('builderSection'); if(b.classList.contains('hidden')) { b.classList.remove('hidden'); b.classList.add('block'); } else { b.classList.add('hidden'); b.classList.remove('block'); } };

// --- 5. PRE-HAB / AI COACH SCHLIESSEN ---
window.closeAiModal = function() { const m = document.getElementById('aiModal'); if(m) { m.classList.add('hidden'); m.classList.remove('flex'); } }

// Alle KI-Funktionen rufen dies auf – so kennen sie ALLE Felder und Werte
// ============================================================
// Hilfsfunktion: Sprachname für KI-Prompts
// --- OFFLINE CHECK für KI-Features ---
window.checkOnlineForAI = function() {
    if (!navigator.onLine) {
        window.showToast(window.t('aiNoInternet','Kein Internet — KI-Features benötigen eine Verbindung.'), 'error');
        return false;
    }
    return true;
};

// Robuster Gemini Fetch-Wrapper mit Timeout, Error Handling, res.ok Check
window._aiFetch = async function(body, opts) {
    opts = opts || {};
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, opts.timeout || 30000);
    try {
        var res = await fetch('/.netlify/functions/gemini', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            signal: controller.signal, body: JSON.stringify(body)
        });
        clearTimeout(timeout);
        if(res.status === 429) {
            try { var errData = await res.json(); window.showToast(errData.error || window.t('lblRateLimit','Tageslimit erreicht.'), 'error', 4000); } catch(e) { window.showToast(window.t('lblRateLimit','Tageslimit erreicht.'), 'error', 4000); }
            return null;
        }
        if(!res.ok) { window.showToast(window.t('lblServerError','Server-Fehler. Bitte spaeter erneut versuchen.'), 'error', 4000); return null; }
        var data = await res.json();
        return data;
    } catch(err) {
        clearTimeout(timeout);
        if(err.name === 'AbortError') window.showToast(window.t('lblTimeout','Zeitueberschreitung. Bitte erneut versuchen.'), 'error', 4000);
        else if(!navigator.onLine) window.showToast(window.t('aiNoInternet','Kein Internet.'), 'error', 4000);
        else window.showToast(window.t('lblError','Fehler') + ': ' + (err.message || ''), 'error', 4000);
        return null;
    }
};

window.getPromptLang = function() {
    const names = { de:'Deutsch', en:'English', fr:'Français', es:'Español', it:'Italiano', nl:'Nederlands', ar:'العربية' };
    return names[window.currentLang] || 'English';
};

window.buildAIContext = function() {
    // 1. Athletenprofil
    const prof = `Alter: ${window.userProfile.age||'?'}, Gewicht: ${window.userProfile.weight||'?'}kg, Größe: ${window.userProfile.height||'?'}cm, Geschlecht: ${window.userProfile.gender||'?'}, Erfahrung: ${window.userProfile.experience||'?'}`;
    const injuries = Array.from(window.selectedInjuries);
    const injStr = injuries.length > 0 ? injuries.join(', ') : 'keine bekannt';
    const medStr = window.userProfile.medicalDetails ? ` Weitere Details: ${window.userProfile.medicalDetails}.` : '';

    // 2. Aktuelle Tracking-Schemas inkl. Custom-Felder erklären
    const schemaLines = [];
    Object.entries(window.categorySchemas).forEach(([cat, data]) => {
        if(!data) return;
        const catName = { strength:window.t('modStr','Krafttraining'), cardio:window.t('modCar','Ausdauer'), recovery:window.t('tabRec','Regeneration'), main:window.t('modCus','Mein Sport') }[cat] || cat;
        const baseFields = (data.schema || []).map(f => f.label).join(', ');
        const extraFields = (data.extraFields || []).map(f => f.label).join(', ');
        let line = `${catName}: Basisfelder=[${baseFields}]`;
        if(extraFields) line += `, Zusatzfelder=[${extraFields}]`;
        schemaLines.push(line);
    });

    // 3. Letzte 20 Workouts mit ALLEN Werten (inkl. Custom-Felder)
    const recentWorkouts = window.workouts.slice(0, 20).map(w => {
        let dataStr = '';
        if(w.category === 'strength' && w.setDetails && w.setDetails.length > 0) {
            dataStr = w.setDetails.map(s => `${s.reps}Wdh×${s.weight}kg`).join(', ');
        }
        // Alle gespeicherten Felder inkl. Custom-Felder anhängen
        if(w.data && Object.keys(w.data).length > 0) {
            const extras = Object.entries(w.data)
                .filter(([k]) => !['Sätze','Volumen (kg)'].includes(k))
                .map(([k,v]) => `${k}: ${v}`)
                .join(' | ');
            if(extras) dataStr += (dataStr ? ' — ' : '') + extras;
        }
        return `[${w.date}] ${w.exercise} (${w.category}): ${dataStr || 'keine Daten'}`;
    }).join('\n');

    return { prof, injStr, medStr, schemaLines: schemaLines.join('; '), recentWorkouts };
};

// --- ZNS READINESS ---
window.calculateReadiness = function() {
    if (!Array.isArray(window.workouts)) return;
    // Use V2 calculation if available
    var v2 = window._calculateReadinessV2 ? window._calculateReadinessV2() : null;
    let score;
    if (v2) {
        score = v2.score;
    } else {
        const today = new Date();
        const allArchived = window.workouts.filter(w => w.archived);
        const recent7 = allArchived.filter(w => (today - new Date(w.date)) / 86400000 <= 7);
        const recent3 = allArchived.filter(w => (today - new Date(w.date)) / 86400000 <= 3);
        score = Math.min(100, Math.max(15, Math.round(100 - recent7.length * 8 - recent3.length * 5)));
    }
    window.currentReadinessScore = score;
    const scoreEl = document.getElementById('readinessScoreVal');
    const barEl = document.getElementById('readinessBar');
    const statusEl = document.getElementById('readinessStatusText');
    const iconEl = document.getElementById('readinessIcon');
    const iconBgEl = document.getElementById('readinessIconBg');
    const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    if (scoreEl) scoreEl.textContent = score + '%';
    if (barEl) { barEl.style.width = score + '%'; barEl.style.backgroundColor = color; }
    if (statusEl) statusEl.textContent = score >= 70 ? window.t('znsFresh','Frisch & bereit') : score >= 40 ? window.t('znsModerate','Moderate Belastung') : window.t('znsFatigued','Erhöhte Müdigkeit');
    if (iconEl && iconBgEl) {
        const icon = score >= 70 ? 'battery-full' : score >= 40 ? 'battery-medium' : 'battery-low';
        iconEl.setAttribute('data-lucide', icon);
        iconEl.style.color = color;
        if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons();
    }
    // ✅ Tools-Tab ZNS Card mitaktualisieren
    const toolsScore = document.getElementById('toolsZnsScore');
    const toolsBar = document.getElementById('toolsZnsBar');
    const toolsStatus = document.getElementById('toolsZnsStatus');
    const toolsIcon = document.getElementById('toolsZnsIcon');
    if(toolsScore) { toolsScore.textContent = score + '%'; toolsScore.style.color = color; }
    if(toolsBar) { toolsBar.style.width = score + '%'; toolsBar.style.backgroundColor = color; }
    if(toolsStatus) toolsStatus.textContent = score >= 70 ? window.t('znsFresh','Frisch & bereit') : score >= 40 ? window.t('znsModerate','Moderate Belastung') : window.t('znsFatigued','Erhöhte Müdigkeit');
    if(toolsIcon) { toolsIcon.setAttribute('data-lucide', score >= 70 ? 'battery-full' : score >= 40 ? 'battery-medium' : 'battery-low'); toolsIcon.style.color = color; if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons(); }
};

window.toggleZNS = function() {
    const widget = document.getElementById('readinessWidget');
    if (!widget) return;
    const isHidden = widget.classList.contains('hidden');
    if (isHidden) { widget.classList.remove('hidden'); widget.classList.add('flex'); window.calculateReadiness(); }
    else { widget.classList.add('hidden'); widget.classList.remove('flex'); }
};

window.analyzeReadinessWithAI = async function() {
    if(!window.checkOnlineForAI()) return;
    if(!window.checkFeatureGate('scan')) return;
    window.toggleModal('aiModal');
    document.getElementById('aiLoadingState')?.classList.remove('hidden');
    document.getElementById('aiResultText')?.classList.add('hidden');
    if(document.getElementById('aiModalTitle')) document.getElementById('aiModalTitle').textContent = window.t('znsTitle','ZNS Readiness');
    if(document.getElementById('aiModalSubtitle')) document.getElementById('aiModalSubtitle').textContent = window.t('znsAnalyze','Erholung & Bereitschaft');
    const ctx = window.buildAIContext();
    const prompt = `Du bist Sportwissenschaftler mit Spezialisierung auf Erholung und neuromuskuläre Anpassung.

WICHTIGE DIREKTIVE — ANTI-HALLUZINATION:
- Basiere ALLE Empfehlungen ausschließlich auf den unten stehenden Nutzerdaten
- Verwende nur Konzepte die durch aktuelle Meta-Analysen und systematische Reviews belegt sind (Kellmann et al. 2018 Recovery & Stress, Meeusen et al. 2013 Overtraining Consensus, Soligard et al. 2016 IOC Consensus)
- Erfinde KEINE Zahlen oder Statistiken
- Wenn Daten fehlen, sage es explizit statt zu spekulieren
- Keine pauschalen Aussagen — nur personalisierte Analyse basierend auf den echten Daten

ATHLETENPROFIL: ${ctx.prof}
VERLETZUNGEN/KONTRAINDIKATIONEN: ${ctx.injStr}${ctx.medStr}
TRACKING-SCHEMAS: ${ctx.schemaLines}
ZNS READINESS SCORE: ${window.currentReadinessScore}%

LETZTE WORKOUTS (alle verfügbaren Metriken):
${ctx.recentWorkouts || 'Keine Trainingsdaten vorhanden'}

AUFGABE:
1) Erholungseinschätzung basierend auf RPE-Trend, Volumen und Frequenz aus den echten Daten
2) Konkrete Empfehlung für heute (Training/Pause/Deload) mit Begründung aus den Daten
3) Falls Daten fehlen: sage was du bräuchtest für eine fundierte Einschätzung

Max 180 Wörter. Antworte auf ${window.getPromptLang()}.`;
    try {
        const data = await window._aiFetch({contents:[{parts:[{text:prompt}]}], userId: window._getAiUserId()});
        if(!data) { document.getElementById('aiLoadingState')?.classList.add('hidden'); return; }
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = data.reply || window.t('toastNoData','Keine Antwort.'); }
        if(window.awardXP) window.awardXP('coachChat');
    } catch(e) {
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = window.t('toastError','Fehler') + ': ' + e.message; }
    }
};

// --- AI CO-PILOT ---
window.triggerCopilot = async function() {
    if(!window.checkOnlineForAI()) return;
    if(!window.checkFeatureGate('coach')) return;
    const exercise = document.getElementById('exerciseInput')?.value?.trim();
    window.toggleModal('aiModal');
    document.getElementById('aiLoadingState')?.classList.remove('hidden');
    document.getElementById('aiResultText')?.classList.add('hidden');
    if(document.getElementById('aiModalTitle')) document.getElementById('aiModalTitle').textContent = window.t('copilotTitle','AI Co-Pilot');
    if(document.getElementById('aiModalSubtitle')) document.getElementById('aiModalSubtitle').textContent = window.t('copilotSub','Smarte Trainingsempfehlung');
    const ctx = window.buildAIContext();
    // Letzte Einheiten der gewünschten Übung herausfiltern für direkten Vergleich
    const exHistory = exercise ? window.workouts.filter(w => w.exercise.toLowerCase() === exercise.toLowerCase()).slice(0,5).map(w => {
        let d = w.setDetails ? w.setDetails.map(s=>`${s.reps}×${s.weight}kg`).join(', ') : '';
        const extras = w.data ? Object.entries(w.data).filter(([k])=>!['Sätze','Volumen (kg)'].includes(k)).map(([k,v])=>`${k}:${v}`).join(' | ') : '';
        return `${w.date}: ${d}${extras ? ' — '+extras : ''}`;
    }).join('\n') : '';
    const prompt = `Du bist zertifizierter Strength & Conditioning Specialist (CSCS) und evidenzbasierter Personal Trainer.

WICHTIGE DIREKTIVE — ANTI-HALLUZINATION:
- Basiere ALLE Empfehlungen ausschließlich auf den unten stehenden Nutzerdaten
- Nutze evidenzbasierte Prinzipien: Progressive Overload (Schoenfeld 2010), RPE-Steuerung (Zourdos et al. 2016), Volumenempfehlungen (Krieger 2010 Meta-Analyse), Intensitätssteuerung (Rhea et al. 2003 Meta-Analyse)
- Erfinde KEINE Gewichte oder Wiederholungszahlen die nicht aus dem Verlauf ableitbar sind
- Wenn kein Übungsverlauf vorhanden: konservative Einstiegsempfehlung mit explizitem Hinweis
- Keine pauschalen "Tipps" — nur datenbasierte Empfehlungen

ATHLETENPROFIL: ${ctx.prof}
VERLETZUNGEN/KONTRAINDIKATIONEN: ${ctx.injStr}${ctx.medStr}
TRACKING-SCHEMAS: ${ctx.schemaLines}
ZNS READINESS: ${window.currentReadinessScore}%
${exercise ? `GEWÜNSCHTE ÜBUNG: ${exercise}` : ''}
${exHistory ? `ÜBUNGSVERLAUF (neueste zuerst):
${exHistory}` : 'ÜBUNGSVERLAUF: Keine Daten'}

LETZTE WORKOUTS:
${ctx.recentWorkouts || 'Keine Daten'}

AUFGABE:
1) Empfohlene Sätze/Wdh/Gewicht — direkt aus dem Verlauf abgeleitet mit Begründung
2) Ziel-RPE basierend auf ZNS Readiness und Trainingsziel
3) Verletzungsmodifikation falls relevant

Max 200 Wörter. Antworte auf ${window.getPromptLang()}.`;
    try {
        const data = await window._aiFetch({contents:[{parts:[{text:prompt}]}], userId: window._getAiUserId()});
        if(!data) { document.getElementById('aiLoadingState')?.classList.add('hidden'); return; }
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = data.reply || window.t('toastNoData','Keine Antwort.'); }
    } catch(e) {
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = window.t('toastError','Fehler') + ': ' + e.message; }
    }
};

// --- PRE-HAB ---
window.generatePreHab = async function() {
    if(!window.checkOnlineForAI()) return;
    if(!window.checkFeatureGate('scan')) return;
    if(window._markFeatureUsed) window._markFeatureUsed('prehab_used');
    window.toggleModal('aiModal');
    document.getElementById('aiLoadingState')?.classList.remove('hidden');
    document.getElementById('aiResultText')?.classList.add('hidden');
    if(document.getElementById('aiModalTitle')) document.getElementById('aiModalTitle').textContent = window.t('prehabTitle','Pre-Hab');
    if(document.getElementById('aiModalSubtitle')) document.getElementById('aiModalSubtitle').textContent = window.t('prehabSub','Verletzungsprävention');
    const exercise = document.getElementById('exerciseInput')?.value?.trim();
    const ctx = window.buildAIContext();
    const prompt = `Du bist Physiotherapeut und Athletiktrainer.

ATHLETENPROFIL: ${ctx.prof}
VERLETZUNGEN/KONTRAINDIKATIONEN: ${ctx.injStr}${ctx.medStr}
TRACKING-SCHEMAS: ${ctx.schemaLines}
${exercise ? `GEPLANTE ÜBUNG: ${exercise}` : ''}

LETZTEN WORKOUTS (inkl. RPE und weiterer Custom-Metriken):
${ctx.recentWorkouts || 'Keine Daten'}

Erstelle ein gezieltes Pre-Hab Programm. Berücksichtige alle Custom-Felder (z.B. hohe RPE-Werte = mehr Mobilisation nötig, Laufdaten = Beinachsen-Aktivierung etc.). Gib: 1) 3-5 Aktivierungs-/Mobilisationsübungen mit Dauer/Wdh 2) Was heute unbedingt vermeiden 3) Spezifische Tipps basierend auf den Trainingsdaten. Max 220 Wörter. Antworte auf ${window.getPromptLang()}.`;
    try {
        const data = await window._aiFetch({contents:[{parts:[{text:prompt}]}], userId: window._getAiUserId()});
        if(!data) { document.getElementById('aiLoadingState')?.classList.add('hidden'); return; }
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = data.reply || window.t('toastNoData','Keine Antwort.'); }
    } catch(e) {
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = window.t('toastError','Fehler') + ': ' + e.message; }
    }
};

// --- HAUPT AI ANALYSE ---
window.analyzeWithAI = async function() {
    if(!window.checkOnlineForAI()) return;
    if(!window.checkFeatureGate('scan')) return;
    if(window._markFeatureUsed) window._markFeatureUsed('coach_used');
    window.toggleModal('aiModal');
    document.getElementById('aiLoadingState')?.classList.remove('hidden');
    document.getElementById('aiResultText')?.classList.add('hidden');
    if(document.getElementById('aiModalTitle')) document.getElementById('aiModalTitle').textContent = window.t('aiCoachTitle','AI Coach');
    if(document.getElementById('aiModalSubtitle')) document.getElementById('aiModalSubtitle').textContent = window.t('aiCoachSub','Progression Analyse');
    const ctx = window.buildAIContext();
    const prompt = `Du bist Sportwissenschaftler mit Expertise in Leistungsdiagnostik und evidenzbasiertem Training.

WICHTIGE DIREKTIVE — ANTI-HALLUZINATION:
- Analysiere AUSSCHLIESSLICH die unten stehenden echten Trainingsdaten
- Nenne nur Zahlen die direkt aus den Daten ableitbar sind
- Bewerte Progression nach wissenschaftlichen Standards:
  * Kraftzuwachs: >1% pro Woche = sehr gut (Aaberg 2007)
  * Volumenproression: 5-10% pro Woche maximal safe (ACSM Guidelines)
  * RPE-Trend: steigender RPE bei gleichem Gewicht = Ermüdungszeichen
- Wenn zu wenig Daten für eine fundierte Aussage: sage es klar
- Keine motivationalen Floskeln — nur datenbasierte Fakten

ATHLETENPROFIL: ${ctx.prof}
VERLETZUNGEN: ${ctx.injStr}${ctx.medStr}
TRACKING-SCHEMAS: ${ctx.schemaLines}
ZNS READINESS: ${window.currentReadinessScore}%

KOMPLETTE WORKOUT-TIMELINE:
${ctx.recentWorkouts || 'Keine Daten'}

AUFGABE — PROGRESSIONSANALYSE:
1) Stärken: konkrete Zahlen aus den Daten (Gewichtssteigerungen, Volumen-Trends)
2) Schwächen/Lücken: was fehlt oder stagniert laut Daten
3) Empfehlungen nächste 2 Wochen: direkt aus der Datenanalyse abgeleitet

Max 320 Wörter, präzise und datenbasiert. Antworte auf ${window.getPromptLang()}.`;
    try {
        const data = await window._aiFetch({contents:[{parts:[{text:prompt}]}], userId: window._getAiUserId()});
        if(!data) { document.getElementById('aiLoadingState')?.classList.add('hidden'); return; }
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = data.reply || window.t('toastNoData','Keine Antwort.'); }
    } catch(e) {
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = window.t('toastError','Fehler') + ': ' + e.message; }
    }
};

// --- KI FORM BUILDER ---
window.generateForm = async function() {
    if(!window.checkOnlineForAI()) return;
    if(!window.checkFeatureGate('coach')) return;
    const input = document.getElementById('sportTypeInput')?.value?.trim();
    if (!input) { window.showToast(window.t("aiEnterActivity","Bitte eine Beschreibung eingeben!")); return; }
    const btnText = document.getElementById('btnGenText');
    const btn = document.getElementById('btnGenerateForm');
    if(btnText) btnText.textContent = '⏳ ' + window.t('aiGenerating','KI denkt...');
    if(btn) btn.disabled = true;

    // Prüfen ob Sport bereits in window.SPORT_LIBRARY oder window.activeSports existiert
    const existingLibrarySport = window.SPORT_LIBRARY.find(s => 
        s.name.toLowerCase() === input.toLowerCase() || 
        s.id.toLowerCase() === input.toLowerCase()
    );

    // Bekannte Sport-Namen für Kontext
    const knownSports = window.SPORT_LIBRARY.map(s => s.name).join(', ');

    // Bestehende Felder der aktuellen Kategorie
    const existingFields = [];
    if(window.currentCategory === 'strength') {
        existingFields.push('Sätze', 'Wiederholungen', 'Gewicht');
        (window.categorySchemas['strength']?.extraFields || []).forEach(f => existingFields.push(f.label));
    } else {
        (window.categorySchemas[window.currentCategory]?.schema || []).forEach(f => existingFields.push(f.label));
        (window.categorySchemas[window.currentCategory]?.extraFields || []).forEach(f => existingFields.push(f.label));
    }

    // Prompt: KI entscheidet ob neuer Sport oder extra Felder
    const prompt = `Du bist ein Fitness-App Experte. Der Nutzer hat folgendes eingegeben: "${input}".

AUFGABE: Entscheide zunächst ob "${input}" ein eigenständiger Sport/eine eigenständige Aktivität ist, oder nur ein zusätzliches Tracking-Feld für die aktuelle Kategorie.

REGEL — NEUER SPORT wenn:
- Es ein bekannter Sport oder eine eigenständige Fitnessaktivität ist (z.B. Hyrox, CrossFit, Boxen, Yoga, Klettern, Schwimmen, Radfahren, etc.)
- Es einen eigenen, spezifischen Satz von Tracking-Metriken hat
- Es NICHT in dieser Liste der bereits integrierten Sports ist: ${knownSports.substring(0, 300)}...

REGEL — EXTRA FELDER wenn:
- Es ein spezifisches Messfeld ist (z.B. "RPE", "Herzrate", "Griffstärke")
- Es eine Ergänzung zur aktuellen Kategorie ist
- Bestehende Felder (NICHT nochmal erstellen): ${existingFields.join(', ')}

Antworte NUR mit validem JSON ohne Markdown:

Falls NEUER SPORT:
{
  "type": "new_sport",
  "sportName": "Hyrox",
  "sportId": "hyrox",
  "icon": "lucide-icon-name",
  "color": "text-orange-400",
  "bg": "bg-orange-400/20", 
  "border": "border-orange-400/30",
  "category": "Functional Fitness",
  "schema": [
    {"id": "f1", "label": "Feldname", "type": "number", "placeholder": "z.B. Wert"},
    {"id": "f2", "label": "Feldname2", "type": "text", "placeholder": "z.B. Text"}
  ]
}

Falls EXTRA FELDER:
{
  "type": "extra_fields",
  "sportName": "${input}",
  "schema": [
    {"id": "f1", "label": "Feldname", "type": "number", "placeholder": "z.B. Wert"}
  ]
}

Für Hyrox wären typische Felder: Gesamtzeit, Laufdistanz, Ski Erg (Zeit), Sled Push (Zeit), Sled Pull (Zeit), Burpee Broad Jumps (Zeit), Rowing (Zeit), Farmers Carry (Zeit), Sandbag Lunges (Zeit), Wall Balls (Zeit).
Wähle für jeden Sport die 5-8 wichtigsten Metriken die ein Athlet nach dem Training festhalten würde.`;

    try {
        const data = await window._aiFetch({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.2}, userId: window._getAiUserId() });
        if(!data) return;
        if(!data.reply) throw new Error(window.t('toastNoData','Keine Antwort'));
        let jsonStr = data.reply.replace(/```json/gi,'').replace(/```/g,'').trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if(!jsonMatch) throw new Error('No JSON in response');
        const result = JSON.parse(jsonMatch[0]);
        if(!result.schema || result.schema.length === 0) throw new Error('Empty schema');

        const all = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas')||'{}');

        if(result.type === 'new_sport') {
            // ✨ NEUEN SPORT erstellen und als Tab hinzufügen
            const sportId = result.sportId || input.toLowerCase().replace(/[^a-z0-9]/g, '_');
            
            // Sport-Schema speichern
            window.categorySchemas[sportId] = {
                sportName: result.sportName || input,
                schema: result.schema,
                extraFields: [],
                isCustom: true
            };
            all[sportId] = window.categorySchemas[sportId];

            // window.CAT_UI erweitern damit renderTable etc. den Sport kennt
            window.CAT_UI[sportId] = {
                name: result.sportName || input,
                icon: result.icon || 'trophy',
                color: result.color || 'text-cyan-400',
                border: result.border || 'border-cyan-400/30',
                bg: result.bg || 'bg-cyan-400/20'
            };

            // Als custom Sport in window.SPORT_LIBRARY eintragen (für persistente Anzeige)
            if(!window.SPORT_LIBRARY.find(s => s.id === sportId)) {
                window.SPORT_LIBRARY.push({
                    id: sportId,
                    name: result.sportName || input,
                    icon: result.icon || 'trophy',
                    category: result.category || 'Custom',
                    color: result.color || 'text-cyan-400',
                    bg: result.bg || 'bg-cyan-400/20',
                    border: result.border || 'border-cyan-400/30',
                    schema: result.schema
                });
            }

            // Zu window.activeSports hinzufügen (erscheint unter Mein Sport)
            if(!window.activeSports.includes(sportId)) {
                window.activeSports.push(sportId);
                localStorage.setItem('beastmode_v2_active_sports', JSON.stringify(window.activeSports));
            }

            // Custom Sports auch separat speichern für persistenz nach Page-Reload
            const customSports = JSON.parse(localStorage.getItem('beastmode_v2_custom_sports') || '[]');
            if(!customSports.find(s => s.id === sportId)) {
                customSports.push({
                    id: sportId,
                    name: result.sportName || input,
                    icon: result.icon || 'trophy',
                    category: result.category || 'Custom',
                    color: result.color || 'text-cyan-400',
                    bg: result.bg || 'bg-cyan-400/20',
                    border: result.border || 'border-cyan-400/30',
                    schema: result.schema
                });
                localStorage.setItem('beastmode_v2_custom_sports', JSON.stringify(customSports));
            }

            localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(all));
            localStorage.setItem('base_builder_used', '1');

            // Builder schließen
            const builderSection = document.getElementById('builderSection');
            if(builderSection) { builderSection.classList.add('hidden'); builderSection.classList.remove('block'); }

            // Direkt zum neuen Sport-Tab wechseln
            window.renderDynamicSportTabs();
            window.switchCategory(sportId);
            setTimeout(() => { if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons(); }, 50);

            window.showToast(`🏆 ${result.sportName || input} erstellt mit ${result.schema.length} Feldern!`);

        } else {
            // Extra Felder zur aktuellen Kategorie hinzufügen (bisheriges Verhalten)
            if(window.currentCategory === 'strength') {
                if(!window.categorySchemas['strength']) window.categorySchemas['strength'] = { sportName: 'Krafttraining', schema: window.DEFAULT_STRENGTH_SCHEMA };
                const existing = window.categorySchemas['strength'].extraFields || [];
                window.categorySchemas['strength'].extraFields = [...existing, ...result.schema];
                all['strength'] = window.categorySchemas['strength'];
            } else {
                if(!window.categorySchemas[window.currentCategory]) window.categorySchemas[window.currentCategory] = { sportName: '', schema: [] };
                const existing = window.categorySchemas[window.currentCategory].extraFields || [];
                window.categorySchemas[window.currentCategory].extraFields = [...existing, ...result.schema];
                all[window.currentCategory] = window.categorySchemas[window.currentCategory];
            }
            localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(all));
            localStorage.setItem('base_builder_used', '1');

            const builderSection = document.getElementById('builderSection');
            if(builderSection) { builderSection.classList.add('hidden'); builderSection.classList.remove('block'); }

            window.switchCategory(window.currentCategory);
            setTimeout(() => { if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons(); }, 50);

            const count = result.schema.length;
            window.showToast(`✅ ${count} Feld${count > 1 ? 'er' : ''} hinzugefügt!`);
        }

    } catch(e) {
        console.error("KI Builder Fehler:", e);
        window.showToast(window.t("toastError") + ": " + e.message);
    } finally {
        if(btnText) btnText.textContent = window.t('planGenerate','Generieren');
        if(btn) btn.disabled = false;
    }
};

window.deleteCurrentSchema = function() {
    if(window.currentCategory === 'strength' || window.currentCategory === 'cardio') { window.showToast(window.t("toastError","Standard-Schema kann nicht gelöscht werden.")); return; }
    window.showModal(window.t('ptDeleteSession','Löschen?'), window.t('ptDeleteSessionConfirm','Das aktuelle Schema wird dauerhaft gelöscht.'), true, () => {
        window.categorySchemas[window.currentCategory] = null;
        const all = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas')||'{}');
        delete all[window.currentCategory];
        localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(all));
        window.switchCategory(window.currentCategory);
        window.showToast(window.t("toastDeleted"));
    });
};

let planGoal = '';
let planDuration = 6;
let planDays = 4;
let _generatedPlan = null;

window.setPlanGoal = function(goal) {
    planGoal = goal;
    document.querySelectorAll('.plan-goal-btn').forEach(b => {
        const isActive = b.textContent.trim().includes(goal) || b.getAttribute('onclick')?.includes(goal);
        b.classList.toggle('border-violet-500', isActive);
        b.classList.toggle('bg-violet-500/10', isActive);
        b.classList.toggle('text-violet-300', isActive);
        b.classList.toggle('border-zinc-800', !isActive);
        b.classList.toggle('bg-zinc-900', !isActive);
        b.classList.toggle('text-zinc-400', !isActive);
    });
};

window.setPlanDuration = function(weeks) {
    planDuration = Math.min(weeks, 12);
    document.querySelectorAll('.plan-dur-btn').forEach(b => {
        const active = b.textContent.trim().startsWith(weeks+'');
        b.classList.toggle('border-violet-500', active);
        b.classList.toggle('bg-violet-500/10', active);
        b.classList.toggle('text-violet-300', active);
        b.classList.toggle('border-zinc-800', !active);
        b.classList.toggle('bg-zinc-900', !active);
        b.classList.toggle('text-zinc-400', !active);
    });
};

window.setPlanDays = function(days) {
    planDays = days;
    document.querySelectorAll('.plan-days-btn').forEach(b => {
        const txt = b.textContent.trim();
        const active = txt.startsWith(days+'') || (days === 2 && txt.startsWith('1-2'));
        b.classList.toggle('border-violet-500', active);
        b.classList.toggle('bg-violet-500/10', active);
        b.classList.toggle('text-violet-300', active);
        b.classList.toggle('border-zinc-800', !active);
        b.classList.toggle('bg-zinc-900', !active);
        b.classList.toggle('text-zinc-400', !active);
    });
    window._trainingDayAssignment = {};
    if (window._renderDayAssignment) window._renderDayAssignment('dayAssignmentContainer', days);
};

window.openTrainingPlanModal = function() {
    window.setPlanGoal('Muskelmasse');
    window.setPlanDuration(6);
    window.setPlanDays(4);
    document.getElementById('planResult')?.classList.add('hidden');
    document.getElementById('planConfig')?.classList.remove('hidden');
    window.toggleModal('trainingPlanModal');
    // Init new plan wizard sections
    window._selectedFocusMuscles = new Set();
    window._trainingDayAssignment = {};
    if (window._renderDayAssignment) window._renderDayAssignment('dayAssignmentContainer', 4);
    if (window._renderFocusMuscleChips) window._renderFocusMuscleChips('focusMuscleChips');
    // Show injuries from profile
    var injContainer = document.getElementById('planInjuryChips');
    if (injContainer) {
        var inj = Array.from(window.selectedInjuries || []);
        injContainer.innerHTML = inj.length > 0 ? inj.map(function(v) { return '<span class="px-3 py-1.5 rounded-lg text-[10px] font-bold" style="background:rgba(232,138,138,0.1);border:1px solid rgba(232,138,138,0.2);color:#e88a8a">' + window._escapeHtml(v) + '</span>'; }).join('') : '<span class="text-[10px] text-zinc-600">' + window.t('lblNone','Keine') + '</span>';
    }
    if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons();
};

window.generateTrainingPlan = async function() {
    if(!window.checkOnlineForAI()) return;
    if(!window.checkFeatureGate('plan')) return;
    if(window._markFeatureUsed) window._markFeatureUsed('plan_used');
    if(!planGoal) { window.showToast(window.t('toastError','Bitte ein Ziel wählen!')); return; }
    var btn = document.getElementById('btnGenPlan');
    var btnText = document.getElementById('btnGenPlanText');
    if(btn) btn.disabled = true;
    if(btnText) btnText.textContent = window.t('planGenerating','KI erstellt Plan...');
    var profile = window.userProfile || {};
    var workouts = (window.workouts || []).filter(function(w) { return w.archived; });
    var recent = workouts.slice(-15).map(function(w) {
        return w.date + ': ' + w.exercise + (w.setDetails ? ' (' + w.setDetails.length + 'S, max ' + Math.max.apply(null, w.setDetails.map(function(s) { return parseFloat(s.weight)||0; })) + 'kg)' : '');
    }).join('; ');
    var orms = '';
    try { var od = JSON.parse(localStorage.getItem('base_1rm_data') || '{}'); if(Object.keys(od).length > 0) orms = Object.entries(od).map(function(e) { return e[0] + ': ' + e[1] + 'kg'; }).join(', '); } catch(e) {}
    var totalWeeks = Math.min(planDuration || 6, 12);
    // Collect focus muscles, injuries, day assignments for prompt
    var _focusList = (window._selectedFocusMuscles && window._selectedFocusMuscles.size > 0) ? Array.from(window._selectedFocusMuscles).map(function(id) { var all = [].concat(window._FOCUS_MUSCLES.upper, window._FOCUS_MUSCLES.lower, window._FOCUS_MUSCLES.core); var m = all.find(function(x) { return x.id === id; }); return m ? m.en : id; }).join(', ') : 'ausgewogen';
    var _injuriesStr = window._getInjuriesForAI ? window._getInjuriesForAI() : 'keine';
    var _dayMap = { mon:'Mo', tue:'Di', wed:'Mi', thu:'Do', fri:'Fr', sat:'Sa', sun:'So' };
    var _dayAssign = Object.keys(window._trainingDayAssignment || {}).map(function(k) { return k.replace('day','Tag ') + ': ' + (_dayMap[window._trainingDayAssignment[k]] || '?'); }).join(', ') || 'flexibel';

    function fetchSingleWeek(weekNum) {
        var phase = '', mesoRIR = 2, mesoSets = '1.0';
        if(weekNum === 1) { phase = 'Basiswoche (Akkumulation) — moderate Intensitaet, RIR 3, Technik-Fokus.'; mesoRIR = 3; mesoSets = '1.0'; }
        else if(weekNum === totalWeeks) { phase = 'Deload — 60% Volumen, RIR 4+, aktive Erholung.'; mesoRIR = 4; mesoSets = '0.6'; }
        else if(weekNum <= Math.ceil(totalWeeks * 0.4)) { phase = 'Aufbauphase (Akkumulation) — Volumen steigern, RIR 2.'; mesoRIR = 2; mesoSets = '1.0'; }
        else if(weekNum <= Math.ceil(totalWeeks * 0.8)) { phase = 'Steigerung — progressive Overload, RIR 1-2.'; mesoRIR = 1; mesoSets = '1.1'; }
        else { phase = 'Peak/Overreach — maximale Intensitaet, RIR 0-1.'; mesoRIR = 0; mesoSets = '1.2'; }
        var p = planGoal + ' Plan (Mesozyklus). Woche ' + weekNum + ' von ' + totalWeeks + '. ' + planDays + ' Trainingstage. ' + phase + ' ';
        p += 'MESOZYKLUS: Sets-Multiplikator ' + mesoSets + ', Ziel-RIR ' + mesoRIR + '. ';
        p += 'FOKUS-MUSKELGRUPPEN: ' + _focusList + '. ';
        p += 'EINSCHRAENKUNGEN: ' + _injuriesStr + '. ';
        p += 'TRAININGSTAGE: ' + _dayAssign + '. ';
        p += 'Athlet: ' + (profile.experience || 'Anfaenger') + ', ' + (profile.weight || '?') + 'kg. ';
        if(orms) p += '1RMs: ' + orms + '. ';
        p += 'Letzte Workouts: ' + (recent || 'keine Daten') + '. ';
        p += 'Antworte NUR mit kompaktem JSON: {"week":' + weekNum + ',"focus":"kurzer Fokus","phase":"' + (weekNum === totalWeeks ? 'deload' : weekNum <= Math.ceil(totalWeeks*0.4) ? 'accumulation' : weekNum <= Math.ceil(totalWeeks*0.8) ? 'accumulation' : 'overreach') + '","targetRIR":' + mesoRIR + ',"setsMultiplier":' + mesoSets + ',"sessions":[{"day":"Mo","name":"Push","exercises":[{"name":"Uebung","sets":3,"reps":"8-10","rir":' + mesoRIR + ',"intensity":"RPE 7","notes":""}]}]}';
        return fetch('/.netlify/functions/gemini', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: p }] }], userId: window._getAiUserId() })
        }).then(function(res) { if(res.status === 429) { window.showToast(window.t('lblRateLimit','Tageslimit erreicht.'), 'error', 4000); return null; } if(!res.ok) { window.showToast(window.t('lblServerError','Server-Fehler.'), 'error', 4000); return null; } return res.text(); }).then(function(raw) {
            if(raw === null) return null;
            if(raw.charAt(0) === '<') return null;
            var resp = JSON.parse(raw);
            if(!resp.reply) return null;
            var obj = null;
            try { obj = JSON.parse(resp.reply); } catch(e) {
                var si = resp.reply.indexOf('{'); var ei = resp.reply.lastIndexOf('}');
                if(si > -1 && ei > si) try { obj = JSON.parse(resp.reply.slice(si, ei+1)); } catch(e2) {}
            }
            return obj;
        }).catch(function() { return null; });
    }
    try {
        if(btnText) btnText.textContent = window.t('aiGenerating','Generiere...') + ' ' + totalWeeks + ' ' + window.t('lblWeeks','Wochen');
        var promises = [];
        for(var w = 1; w <= totalWeeks; w++) promises.push(fetchSingleWeek(w));
        var results = await Promise.all(promises);
        var allWeeks = results.filter(function(w) { return w !== null; });
        allWeeks.sort(function(a, b) { return (a.week || 0) - (b.week || 0); });
        if(allWeeks.length === 0) throw new Error(window.t('toastError','Plan konnte nicht generiert werden'));
        if(allWeeks.length < totalWeeks) window.showToast(allWeeks.length + '/' + totalWeeks + ' ' + window.t('lblWeeks','Wochen'));
        // Build mesoCycle phases from week data
        var _mesoPhases = allWeeks.map(function(w) { return { week: w.week, name: w.focus || ('Woche ' + w.week), type: w.phase || 'accumulation', setsMultiplier: w.setsMultiplier || 1.0, targetRIR: w.targetRIR != null ? w.targetRIR : 2 }; });
        var plan = { planName: totalWeeks + '-Wochen ' + planGoal, goal: planGoal, mesoCycle: { totalWeeks: totalWeeks, phases: _mesoPhases }, weeks: allWeeks, focusMuscles: Array.from(window._selectedFocusMuscles || []), injuries: window._getInjuriesForAI ? window._getInjuriesForAI() : 'keine', progressionNotes: 'Progressiver ' + totalWeeks + '-Wochen Mesozyklus mit Periodisierung und Deload.' };
        _generatedPlan = plan;
        try { localStorage.setItem('base_active_plan', JSON.stringify({ planData: plan, startDate: new Date().toISOString().split('T')[0], totalWeeks: totalWeeks })); } catch(e) {}
        window.renderTrainingPlan(plan);
        if(window.awardXP) window.awardXP('planGenerated');
    } catch(e) {
        window.showToast(window.t('toastError') + ': ' + e.message);
    } finally {
        if(btn) btn.disabled = false;
        if(btnText) btnText.textContent = window.t('planGenerate','Plan generieren');
    }
};

window.renderTrainingPlan = function(plan) {
    const content = document.getElementById('planResultContent');
    if(!content || !plan) return;

    const weekColors = ['border-violet-500/30', 'border-indigo-500/30', 'border-cyan-500/30', 'border-emerald-500/30', 'border-amber-500/30', 'border-rose-500/30', 'border-orange-500/30', 'border-pink-500/30'];

    const esc = window._escapeHtml || function(s){return s||'';};
    var mesoHtml = window._renderMesoCycleOverview ? window._renderMesoCycleOverview(plan) : '';
    content.innerHTML = mesoHtml + (plan.weeks || []).map((week, wi) => `
        <div class="bg-zinc-950/60 border ${weekColors[wi % weekColors.length]} rounded-2xl p-4">
            <div class="flex items-center justify-between mb-3">
                <p class="text-white font-black text-sm uppercase tracking-tight">${window.t("lblWeeks","Woche")} ${esc(String(week.week))}</p>
                <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">${esc(week.focus || '')}</span>
            </div>
            <div class="space-y-2">
                ${(week.sessions || []).map(session => `
                    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-zinc-300 font-black text-[11px] uppercase tracking-widest">${esc(session.day)} — ${esc(session.name)}</p>
                        </div>
                        <div class="space-y-1.5">
                            ${(session.exercises || []).map(ex => `
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1">
                                        <p class="text-white text-xs font-bold">${esc(ex.name)}</p>
                                        ${ex.notes ? `<p class="text-zinc-600 text-[10px]">${esc(ex.notes)}</p>` : ''}
                                    </div>
                                    <div class="text-right flex-shrink-0">
                                        <p class="text-primary text-[11px] font-black">${esc(String(ex.sets))}\u00d7${esc(String(ex.reps))}${ex.rir != null ? '<span class="ml-1 text-[8px]" style="color:#a3c9a8">RIR '+ex.rir+'</span>' : ''}</p>
                                        <p class="text-zinc-500 text-[10px] font-bold">${esc(ex.intensity || '')}</p>
                                    </div>
                                </div>`).join('')}
                        </div>
                    </div>`).join('')}
            </div>
        </div>`).join('') + (plan.progressionNotes ? `
        <div class="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-4">
            <p class="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">Progressions-Strategie</p>
            <p class="text-zinc-400 text-sm">${esc(plan.progressionNotes)}</p>
        </div>` : '');

    document.getElementById('planConfig')?.classList.add('hidden');
    document.getElementById('planResult')?.classList.remove('hidden');
    if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons();
};

window.savePlanAsRoutines = function() {
    if(!_generatedPlan) return;
    let saved = 0;
    (_generatedPlan.weeks || []).forEach(week => {
        (week.sessions || []).forEach(session => {
            const routine = {
                id: Date.now().toString() + Math.random().toString(36).slice(2,5),
                name: `W${week.week}: ${session.name}`,
                category: 'strength',
                createdAt: new Date().toISOString().slice(0,10),
                exercises: (session.exercises || []).map(ex => ({
                    exercise: ex.name,
                    category: 'strength',
                    setDetails: [],
                    data: { 'Sätze': ex.sets + '×' + ex.reps, 'Intensität': ex.intensity || '' },
                    equipment: '',
                    sportCategory: 'Krafttraining'
                }))
            };
            window.savedRoutines.push(routine);
            saved++;
        });
    });
    localStorage.setItem('beastmode_v2_routines', JSON.stringify(window.savedRoutines));
    window.showToast(`${saved} ${window.t('planSaved','Vorlagen gespeichert! ✅')}`);
};

// ============================================================
// KI AUFWÄRM-EMPFEHLUNG (nur Athleten-Modus)
// ============================================================
window.getWarmupRecommendation = async function() {
    if(!window.checkOnlineForAI()) return;
    if(!window.checkFeatureGate('coach')) return;
    const ctx = window.buildAIContext();
    const cat = window.currentCategory || 'strength';
    const catName = { strength:'Krafttraining', cardio:'Ausdauer', recovery:'Mobility', main:'Custom' }[cat] || cat;
    const zns = window.currentReadinessScore || 100;
    const lang = window.getPromptLang();

    const modal = document.getElementById('warmupModal');
    const list = document.getElementById('warmupList');
    if(!modal || !list) return;
    list.innerHTML = '<div class="text-center py-8"><i data-lucide="loader-2" class="w-6 h-6 text-amber-400 animate-spin mx-auto"></i><p class="text-zinc-500 text-xs mt-2">KI erstellt Aufwärmprogramm...</p></div>';
    window.toggleModal('warmupModal');
    if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons();

    const prompt = `Du bist ein Fitness-Coach. Erstelle ein 5-10 Minuten Aufwärmprogramm.
Athlet: ${ctx.prof}. Verletzungen: ${ctx.injStr}.${ctx.medStr}
Heutige Kategorie: ${catName}. ZNS Readiness: ${zns}%.
Letzte Workouts:\n${ctx.recentWorkouts}
Erstelle max 8 Aufwärmübungen. Antworte NUR als JSON Array (kein Markdown):
[{"name":"Übungsname","nameEN":"English name","duration":"30s oder 10 Wdh","purpose":"Warum diese Übung","bodyPart":"chest/back/legs/shoulders/arms/core/cardio"}]
Sprache für name und purpose: ${lang}`;

    try {
        const data = await window._aiFetch({ contents: [{ parts: [{ text: prompt }] }], userId: window._getAiUserId() });
        if(!data) return;
        let jsonStr = (data.reply || '[]').replace(/```json/gi,'').replace(/```/g,'').trim();
        const arrMatch = jsonStr.match(/\[[\s\S]*\]/);
        var exercises;
        try { exercises = JSON.parse(arrMatch ? arrMatch[0] : jsonStr); } catch(pe) { window.showToast(window.t('lblParseError','KI-Antwort konnte nicht verarbeitet werden.'), 'error', 4000); return; }
        window._renderWarmupList(exercises);
        if(window.awardXP) window.awardXP('scanAnalysis');
        if(typeof window._aiTrackCall === 'function') window._aiTrackCall();
    } catch(e) {
        console.error('Warmup KI Error:', e);
        list.innerHTML = '<p class="text-rose-400 text-sm p-4">' + window.t('toastError','Fehler') + '</p>';
    }
};

window._renderWarmupList = function(exercises) {
    const list = document.getElementById('warmupList');
    if(!list) return;
    list.innerHTML = exercises.map(function(ex, i) {
        var match = window.findExerciseMatch ? window.findExerciseMatch(ex.nameEN || ex.name) : null;
        var imgHtml = match ? '<img src="' + match.img + '" loading="lazy" alt="" class="w-16 h-16 rounded-lg object-cover flex-shrink-0" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
            '<div class="w-16 h-16 rounded-lg bg-zinc-800 items-center justify-center flex-shrink-0 hidden"><i data-lucide="' + window.getBodyPartIcon(ex.bodyPart) + '" class="w-6 h-6 text-zinc-600"></i></div>' :
            '<div class="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0"><i data-lucide="' + window.getBodyPartIcon(ex.bodyPart) + '" class="w-6 h-6 text-zinc-600"></i></div>';
        return '<div class="flex items-center gap-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">' +
            imgHtml +
            '<div class="flex-1 min-w-0"><p class="text-white text-sm font-bold truncate">' + window._escapeHtml(ex.name) + '</p>' +
            '<p class="text-amber-400 text-[10px] font-black uppercase tracking-widest">' + window._escapeHtml(ex.duration || '') + '</p>' +
            '<p class="text-zinc-500 text-[10px] mt-0.5 truncate">' + window._escapeHtml(ex.purpose || '') + '</p></div>' +
            '<label class="flex-shrink-0 cursor-pointer"><input type="checkbox" class="w-5 h-5 accent-amber-500 cursor-pointer pointer-events-auto"></label></div>';
    }).join('');
    if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) setTimeout(function() { lucide.createIcons(); }, 30);
};

// ============================================================
// KI ÜBUNGS-EMPFEHLUNG (nur Athleten-Modus)
// ============================================================
window.getExerciseRecommendation = async function() {
    if(!window.checkOnlineForAI()) return;
    if(!window.checkFeatureGate('coach')) return;
    const ctx = window.buildAIContext();
    const cat = window.currentCategory || 'strength';
    const catName = { strength:'Krafttraining', cardio:'Ausdauer', recovery:'Mobility', main:'Custom' }[cat] || cat;
    const zns = window.currentReadinessScore || 100;
    const lang = window.getPromptLang();
    const goal = window.userProfile.goal || window.userProfile.experience || 'Allgemeine Fitness';

    const modal = document.getElementById('exerciseRecModal');
    const list = document.getElementById('exerciseRecList');
    if(!modal || !list) return;
    list.innerHTML = '<div class="text-center py-8"><i data-lucide="loader-2" class="w-6 h-6 text-cyan-400 animate-spin mx-auto"></i><p class="text-zinc-500 text-xs mt-2">KI analysiert dein Training...</p></div>';
    window.toggleModal('exerciseRecModal');
    if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) lucide.createIcons();

    const prompt = `Du bist ein erfahrener Kraft- und Fitness-Coach. Empfehle 4-6 Übungen für heute.
Athlet: ${ctx.prof}. Ziel: ${goal}. Verletzungen: ${ctx.injStr}.${ctx.medStr}
Kategorie: ${catName}. ZNS Readiness: ${zns}%.
Trainingshistorie:\n${ctx.recentWorkouts}
Berücksichtige progressive Overload und Erholung. Antworte NUR als JSON Array:
[{"name":"Übungsname","nameEN":"English name","sets":4,"reps":8,"weight":"80kg oder Körpergewicht","reason":"Kurze Begründung","bodyPart":"chest/back/legs/shoulders/arms/core","category":"strength"}]
Sprache für name und reason: ${lang}`;

    try {
        const data = await window._aiFetch({ contents: [{ parts: [{ text: prompt }] }], userId: window._getAiUserId() });
        if(!data) return;
        let jsonStr = (data.reply || '[]').replace(/```json/gi,'').replace(/```/g,'').trim();
        const arrMatch = jsonStr.match(/\[[\s\S]*\]/);
        var exercises;
        try { exercises = JSON.parse(arrMatch ? arrMatch[0] : jsonStr); } catch(pe) { window.showToast(window.t('lblParseError','KI-Antwort konnte nicht verarbeitet werden.'), 'error', 4000); return; }
        window._renderExerciseRecs(exercises);
        if(typeof window._aiTrackCall === 'function') window._aiTrackCall();
    } catch(e) {
        console.error('Exercise Rec KI Error:', e);
        list.innerHTML = '<p class="text-rose-400 text-sm p-4">Fehler bei der KI-Antwort. Bitte erneut versuchen.</p>';
    }
};

window._renderExerciseRecs = function(exercises) {
    const list = document.getElementById('exerciseRecList');
    if(!list) return;
    list.innerHTML = exercises.map(function(ex, i) {
        var match = window.findExerciseMatch ? window.findExerciseMatch(ex.nameEN || ex.name) : null;
        var imgHtml = match ? '<img src="' + match.img + '" loading="lazy" alt="" class="w-20 h-20 rounded-xl object-cover flex-shrink-0" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
            '<div class="w-20 h-20 rounded-xl bg-zinc-800 items-center justify-center flex-shrink-0 hidden"><i data-lucide="' + window.getBodyPartIcon(ex.bodyPart) + '" class="w-8 h-8 text-zinc-600"></i></div>' :
            '<div class="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0"><i data-lucide="' + window.getBodyPartIcon(ex.bodyPart) + '" class="w-8 h-8 text-zinc-600"></i></div>';
        var setsReps = (ex.sets || '?') + '×' + (ex.reps || '?') + (ex.weight ? ' @' + ex.weight : '');
        return '<div class="flex gap-3 p-3 rounded-xl" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)">' +
            imgHtml +
            '<div class="flex-1 min-w-0"><p class="text-white text-sm font-bold">' + window._escapeHtml(ex.name) + '</p>' +
            '<p class="text-primary text-xs font-black mt-0.5">' + window._escapeHtml(setsReps) + '</p>' +
            '<p class="text-zinc-500 text-[10px] mt-1 line-clamp-2">' + window._escapeHtml(ex.reason || '') + '</p>' +
            '<button onclick="window._addRecToWorkout(' + i + ')" class="mt-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg cursor-pointer pointer-events-auto transition-all" style="background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.2);color:#06b6d4">Übernehmen</button>' +
            '</div></div>';
    }).join('');
    window._exerciseRecs = exercises;
    if(window._refreshLucide) window._refreshLucide(); else if(window.lucide) setTimeout(function() { lucide.createIcons(); }, 30);
};

window._exerciseRecs = [];
window._addRecToWorkout = function(idx) {
    var ex = window._exerciseRecs[idx];
    if(!ex) return;
    var input = document.getElementById('exerciseInput');
    if(input) { input.value = ex.name; input.dispatchEvent(new Event('input')); }
    window.showToast(ex.name + ' ✅');
};

window._addAllRecsToWorkout = function() {
    if(!window._exerciseRecs || window._exerciseRecs.length === 0) return;
    window._exerciseRecs.forEach(function(ex) {
        var input = document.getElementById('exerciseInput');
        if(input) input.value = ex.name;
    });
    window.toggleModal('exerciseRecModal');
    window.showToast(window._exerciseRecs.length + ' ' + window.t('lblExercises','Übungen') + ' ✅');
};

// ============================================================
// SMART WORKOUT GENERATOR — Evidence-Based KI
// ============================================================

window._SMART_WORKOUT_SYSTEM_PROMPT = 'Du bist ein Sportwissenschaftler mit 15 Jahren Erfahrung in der Trainingsplanung.\n\nDEINE REGELN:\n\nVOLUMEN (Schoenfeld 2017): 10-20 Sätze/Muskelgruppe/Woche. Max 10 Sätze/Muskelgruppe/Session.\nFREQUENZ (Schoenfeld 2016): Jede Muskelgruppe 2x/Woche, 48-72h Pause.\nINTENSITÄT: Hypertrophie 65-80% 1RM RPE 7-9, Kraft 80-95% RPE 8-10.\nÜBUNGSAUSWAHL: 60-70% Compound, 30-40% Isolation. Schwerste Compound zuerst.\nPROGRESSIVE OVERLOAD: +2.5kg Oberkörper, +5kg Unterkörper wenn Ziel-Wdh erreicht.\nBALANCE: Push:Pull = 1:1, Ober:Unterkörper = 1:1/Woche.\n\nAUSGABE: NUR JSON Array, kein Text davor/danach.\nFormat: [{"exercise":"Bankdrücken","sets":4,"reps":"8-10","weight":80,"rest":"90s","note":"Coaching-Cue"}]\nGewichte MÜSSEN auf den echten Daten des Athleten basieren.';

window.generateSmartWorkout = async function() {
    if(window.checkOnlineForAI && !window.checkOnlineForAI()) return;
    if(!window.checkFeatureGate('plan')) return;
    var workouts = window.workouts || [];
    var archived = workouts.filter(function(w) { return w.archived; });
    if(archived.length < 3) { window.showToast(window.t('toastError','Tracke mindestens 3 Workouts für KI-Planung')); return; }
    var profile = window.userProfile || {};
    var recent = archived.slice(-30).map(function(w) {
        var detail = '';
        if(w.setDetails && w.setDetails.length > 0) {
            var maxW = Math.max.apply(null, w.setDetails.map(function(s) { return parseFloat(s.weight) || 0; }));
            var totalVol = w.setDetails.reduce(function(sum, s) { return sum + (parseFloat(s.reps)||0) * (parseFloat(s.weight)||0); }, 0);
            detail = w.setDetails.length + ' Sets, max ' + maxW + 'kg, Vol ' + Math.round(totalVol) + 'kg';
        }
        return w.date + ' | ' + w.exercise + ' | ' + (w.category || 'strength') + ' | ' + detail;
    }).join('\n');
    var weekAgo = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
    var thisWeek = archived.filter(function(w) { return w.date >= weekAgo; }).map(function(w) { return w.exercise; });
    var twoDaysAgo = new Date(Date.now() - 2*86400000).toISOString().split('T')[0];
    var last48h = archived.filter(function(w) { return w.date >= twoDaysAgo; }).map(function(w) { return w.exercise; });
    var dayNames = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
    var today = dayNames[new Date().getDay()];
    var userPrompt = 'Erstelle mein Workout für heute (' + today + ').\n\nATHLETEN-PROFIL:\nAlter: ' + (profile.age || '?') + '\nGewicht: ' + (profile.weight || '?') + ' kg\nLevel: ' + (profile.experience || 'Anfänger') + '\n\nTRAININGSHISTORIE (letzte 30):\n' + recent + '\n\nDIESE WOCHE TRAINIERT:\n' + (thisWeek.length > 0 ? thisWeek.join(', ') : 'Noch nichts') + '\n\nLETZTE 48H:\n' + (last48h.length > 0 ? last48h.join(', ') : 'Nichts') + '\n\nErstelle 5-7 Übungen. JSON Array.';
    window.showToast(window.t('aiGenerating','Dein Workout wird geplant...'));
    var btn = document.getElementById('smartWorkoutBtn');
    if(btn) btn.style.opacity = '0.5';
    try {
        var data = await window._aiFetch({ prompt: userPrompt, systemPrompt: window._SMART_WORKOUT_SYSTEM_PROMPT, userId: window._getAiUserId() });
        if(!data) { if(btn) btn.style.opacity = '1'; return; }
        var text = '';
        if(data.parts) { for(var i = data.parts.length - 1; i >= 0; i--) { if(data.parts[i].text) { text = data.parts[i].text; break; } } }
        else if(data.reply) text = data.reply;
        else if(data.text) text = data.text;
        var jsonMatch = text.match(/\[[\s\S]*?\]/);
        if(!jsonMatch) { window.showToast(window.t('toastError','Workout konnte nicht erstellt werden')); if(btn) btn.style.opacity = '1'; return; }
        var exercises = JSON.parse(jsonMatch[0]);
        if(btn) btn.style.opacity = '1';
        window._showSmartWorkoutResult(exercises);
    } catch(e) {
        console.error('Smart Workout Error:', e);
        window.showToast(window.t('toastError') + ': ' + e.message);
        if(btn) btn.style.opacity = '1';
    }
};

window._showSmartWorkoutResult = function(exercises) {
    var html = '<div class="space-y-2 max-h-[60vh] overflow-y-auto" style="-webkit-overflow-scrolling:touch">';
    exercises.forEach(function(ex, i) {
        html += '<div class="p-3 rounded-xl" style="background:var(--surface-hex);border:1px solid var(--border-hex)">' +
            '<div class="flex items-center justify-between">' +
            '<p class="text-sm font-black text-white">' + (i+1) + '. ' + window._escapeHtml(ex.exercise || '') + '</p>' +
            '<span class="text-[10px] font-bold" style="color:var(--primary-hex)">' + (ex.sets||3) + ' x ' + window._escapeHtml(String(ex.reps||'10')) + (ex.weight ? ' @ ' + ex.weight + 'kg' : '') + '</span>' +
            '</div>' +
            (ex.rest ? '<span class="text-[9px] text-zinc-600">Pause: ' + window._escapeHtml(ex.rest) + '</span>' : '') +
            (ex.note ? '<p class="text-[10px] text-zinc-400 mt-1 italic">' + window._escapeHtml(ex.note) + '</p>' : '') +
            '</div>';
    });
    html += '</div>';
    window.showModal(window.t('smartWorkout','Dein Workout'), html, true, function() {
        var today = new Date().toISOString().split('T')[0];
        exercises.forEach(function(ex) {
            var sets = [];
            var numSets = parseInt(ex.sets) || 3;
            var reps = String(ex.reps || '10');
            var targetReps = parseInt(reps.split('-')[0]) || 10;
            for(var s = 0; s < numSets; s++) sets.push({ reps: targetReps, weight: ex.weight || '' });
            window.workouts.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2,5),
                date: today, exercise: ex.exercise, category: 'strength',
                setDetails: sets, archived: false
            });
        });
        window.saveWorkoutsForCurrentClient();
        window.renderTable();
        window.showToast(window.t('toastSaved','Workout geladen!'));
    });
};

// Smart Workout Button Sichtbarkeit
window._updateSmartWorkoutVisibility = function() {
    var btn = document.getElementById('smartWorkoutBtn');
    if(!btn) return;
    var archived = (window.workouts || []).filter(function(w) { return w.archived; });
    if(archived.length >= 3) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
};
