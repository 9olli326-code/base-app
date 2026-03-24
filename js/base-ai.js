// ============================================================
// BASE AI — Design KI, AI Coach, Co-Pilot, PreHab, Form Builder,
// Training Plan Generator, ZNS Readiness
// Ausgelagert aus app.html für Modularisierung
// ============================================================

// --- 4. DESIGN KI WIEDERHERGESTELLT ---
window.runDesignAI = async function() {
    if(!window.checkOnlineForAI()) return;
    const prompt = document.getElementById('designPrompt').value.trim(); if (!prompt) { window.showToast("Bitte gib einen Wunsch ein!"); return; }
    const btn = document.getElementById('btnRunDesignAi'); const origHTML = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i>`; btn.disabled = true; if(window.lucide) lucide.createIcons();
    const currentTheme = localStorage.getItem('beastmode_v2_theme') || "{}";
    const sysPrompt = `Du bist ein weltklasse UI/UX Designer und Creative Director mit 15 Jahren Erfahrung in App-Design für Premium-Brands. Du designst für die Elite-Fitness-App BASE.

DEINE DESIGNPRINZIPIEN:
- Jede Farbpalette muss ein kohärentes, professionelles System sein — keine zufälligen Farben
- Kontrastverhältnisse müssen WCAG AA erfüllen (min. 4.5:1 für Text)
- Primärfarbe definiert die gesamte Persönlichkeit der App
- Hintergründe: immer dunkel und tief, nie flach
- Typografie: Heading-Font prägt den Charakter, Body-Font maximiert Lesbarkeit
- Border-Radius definiert ob die App "hart & angular" oder "weich & modern" wirkt
- Shadows und Blur schaffen Tiefe und Hierarchie

VERFÜGBARE GOOGLE FONTS (Heading): Barlow Condensed, Bebas Neue, Montserrat, Oswald, Rajdhani, Orbitron, Black Ops One, Exo 2, Oxanium, Russo One, Anton, Teko
VERFÜGBARE GOOGLE FONTS (Body): Inter, DM Sans, IBM Plex Sans, Outfit, Nunito Sans, Plus Jakarta Sans

DESIGN-STILE DIE DU BEHERRSCHST:
- Military/Tactical: Oliv, Khaki, harte Kanten, mono fonts
- Cyberpunk/Neon: Electric Blue/Purple/Green auf tiefem Schwarz, Orbitron
- Luxury/Premium: Gold/Champagne auf Midnight, elegante Fonts
- Minimal/Clean: Reines Weiß/Grau System, viel Luft
- Sports/Energy: Aggressive Rottöne/Orange, kondensierte Fonts
- Nature/Wellness: Erdtöne, Grün, organische Formen
- Ocean/Calm: Tiefes Blau/Türkis, smooth curves

SCHEMA (antworte NUR mit diesem JSON, kein Text davor oder danach):
{
  "theme": {
    "primary": "#HEX — Hauptakzentfarbe, satt und kräftig",
    "secondary": "#HEX — Sekundärfarbe für Highlights",
    "bg": "#HEX — Haupthintergrund, sehr dunkel",
    "surface": "#HEX — Kartenoberfläche, minimal heller als bg",
    "innerBg": "#HEX — Innere Elemente, minimal dunkler als bg",
    "border": "#HEX — Subtile Grenzen, kaum sichtbar",
    "textMain": "#HEX — Haupttext, fast weiß",
    "textMuted": "#HEX — Gedämpfter Text, mittlere Helligkeit",
    "fontHeading": "Exact Google Font Name",
    "fontBody": "Exact Google Font Name",
    "radius": "CSS border-radius z.B. 16px oder 8px oder 24px",
    "shadow": "CSS box-shadow vollständiger Wert",
    "blur": "CSS backdrop-blur Wert z.B. 12px"
  },
  "designName": "Kurzer einprägsamer Name des Stils",
  "designDescription": "Ein Satz der den Stil beschreibt"
}`;
    try {
        const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 12000);
        const res = await fetch('/.netlify/functions/gemini?_cb=' + Date.now(), { method: 'POST', cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: sysPrompt + "\n\nKundenwunsch: " + prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }) });
        clearTimeout(timeoutId); if (!res.ok) throw new Error("Server Fehler");
        const data = await res.json(); let jsonStr = data.reply || "{}"; jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonStr); 
        if(result.theme) {
            localStorage.setItem('beastmode_v2_theme', JSON.stringify(result.theme)); window.showToast("Transformation läuft..."); setTimeout(() => window.location.reload(), 1000); 
        } else { throw new Error("Kein Theme im JSON gefunden"); }
    } catch(e) { window.showToast("KI Fehler beim Design: " + e.message); } finally { btn.innerHTML = origHTML; btn.disabled = false; if(window.lucide) lucide.createIcons(); }
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
        window.showToast('Kein Internet — KI-Features benötigen eine Verbindung.', 'error');
        return false;
    }
    return true;
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
        const catName = { strength:'Krafttraining', cardio:'Ausdauer', recovery:'Regeneration', main:'Mein Sport' }[cat] || cat;
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
    const today = new Date();
    const allArchived = window.workouts.filter(w => w.archived);
    const recent7 = allArchived.filter(w => {
        const d = new Date(w.date);
        return (today - d) / 86400000 <= 7;
    });
    const recent3 = allArchived.filter(w => {
        const d = new Date(w.date);
        return (today - d) / 86400000 <= 3;
    });
    let score = 100;
    score -= recent7.length * 8;
    score -= recent3.length * 5;
    score = Math.min(100, Math.max(15, Math.round(score)));
    window.currentReadinessScore = score;
    const scoreEl = document.getElementById('readinessScoreVal');
    const barEl = document.getElementById('readinessBar');
    const statusEl = document.getElementById('readinessStatusText');
    const iconEl = document.getElementById('readinessIcon');
    const iconBgEl = document.getElementById('readinessIconBg');
    const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    if (scoreEl) scoreEl.textContent = score + '%';
    if (barEl) { barEl.style.width = score + '%'; barEl.style.backgroundColor = color; }
    if (statusEl) statusEl.textContent = score >= 70 ? 'Bereit – Vollgas geben!' : score >= 40 ? 'Moderat erholt' : 'Hohe Ermüdung – Erholen!';
    if (iconEl && iconBgEl) {
        const icon = score >= 70 ? 'battery-full' : score >= 40 ? 'battery-medium' : 'battery-low';
        iconEl.setAttribute('data-lucide', icon);
        iconEl.style.color = color;
        if (window.lucide) lucide.createIcons();
    }
    // ✅ Tools-Tab ZNS Card mitaktualisieren
    const toolsScore = document.getElementById('toolsZnsScore');
    const toolsBar = document.getElementById('toolsZnsBar');
    const toolsStatus = document.getElementById('toolsZnsStatus');
    const toolsIcon = document.getElementById('toolsZnsIcon');
    if(toolsScore) { toolsScore.textContent = score + '%'; toolsScore.style.color = color; }
    if(toolsBar) { toolsBar.style.width = score + '%'; toolsBar.style.backgroundColor = color; }
    if(toolsStatus) toolsStatus.textContent = score >= 70 ? 'Bereit – Vollgas geben!' : score >= 40 ? 'Moderat erholt' : 'Hohe Ermüdung – Erholen!';
    if(toolsIcon) { toolsIcon.setAttribute('data-lucide', score >= 70 ? 'battery-full' : score >= 40 ? 'battery-medium' : 'battery-low'); toolsIcon.style.color = color; if(window.lucide) lucide.createIcons(); }
};

window.toggleZNS = function() {
    const widget = document.getElementById('readinessWidget');
    const btn = document.getElementById('btnToggleZNS');
    if (!widget) return;
    const isHidden = widget.classList.contains('hidden');
    if (isHidden) {
        widget.classList.remove('hidden'); widget.classList.add('flex');
        if (btn) { btn.classList.replace('bg-zinc-900','bg-green-500/10'); btn.classList.replace('border-zinc-800','border-green-500/20'); btn.classList.replace('text-zinc-400','text-green-400'); }
        window.calculateReadiness();
    } else {
        widget.classList.add('hidden'); widget.classList.remove('flex');
        if (btn) { btn.classList.replace('bg-green-500/10','bg-zinc-900'); btn.classList.replace('border-green-500/20','border-zinc-800'); btn.classList.replace('text-green-400','text-zinc-400'); }
    }
};

window.analyzeReadinessWithAI = async function() {
    if(!window.checkOnlineForAI()) return;
    if(window.aiGate && !(await window.aiGate())) return;
    window.toggleModal('aiModal');
    document.getElementById('aiLoadingState')?.classList.remove('hidden');
    document.getElementById('aiResultText')?.classList.add('hidden');
    if(document.getElementById('aiModalTitle')) document.getElementById('aiModalTitle').textContent = 'ZNS Readiness';
    if(document.getElementById('aiModalSubtitle')) document.getElementById('aiModalSubtitle').textContent = 'Erholung & Bereitschaft';
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
        const res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({contents:[{parts:[{text:prompt}]}]}) });
        const data = await res.json();
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = data.reply || 'Keine Antwort.'; }
    } catch(e) {
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = 'Fehler: ' + e.message; }
    }
};

// --- AI CO-PILOT ---
window.triggerCopilot = async function() {
    if(!window.checkOnlineForAI()) return;
    if(window.aiGate && !(await window.aiGate())) return;
    const exercise = document.getElementById('exerciseInput')?.value?.trim();
    window.toggleModal('aiModal');
    document.getElementById('aiLoadingState')?.classList.remove('hidden');
    document.getElementById('aiResultText')?.classList.add('hidden');
    if(document.getElementById('aiModalTitle')) document.getElementById('aiModalTitle').textContent = 'AI Co-Pilot';
    if(document.getElementById('aiModalSubtitle')) document.getElementById('aiModalSubtitle').textContent = 'Smarte Trainingsempfehlung';
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
        const res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({contents:[{parts:[{text:prompt}]}]}) });
        const data = await res.json();
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = data.reply || 'Keine Antwort.'; }
    } catch(e) {
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = 'Fehler: '+e.message; }
    }
};

// --- PRE-HAB ---
window.generatePreHab = async function() {
    if(!window.checkOnlineForAI()) return;
    if(window.aiGate && !(await window.aiGate())) return;
    window.toggleModal('aiModal');
    document.getElementById('aiLoadingState')?.classList.remove('hidden');
    document.getElementById('aiResultText')?.classList.add('hidden');
    if(document.getElementById('aiModalTitle')) document.getElementById('aiModalTitle').textContent = 'Pre-Hab';
    if(document.getElementById('aiModalSubtitle')) document.getElementById('aiModalSubtitle').textContent = 'Verletzungsprävention';
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
        const res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({contents:[{parts:[{text:prompt}]}]}) });
        const data = await res.json();
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = data.reply || 'Keine Antwort.'; }
    } catch(e) {
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = 'Fehler: '+e.message; }
    }
};

// --- HAUPT AI ANALYSE ---
window.analyzeWithAI = async function() {
    if(!window.checkOnlineForAI()) return;
    if(window.aiGate && !(await window.aiGate())) return;
    window.toggleModal('aiModal');
    document.getElementById('aiLoadingState')?.classList.remove('hidden');
    document.getElementById('aiResultText')?.classList.add('hidden');
    if(document.getElementById('aiModalTitle')) document.getElementById('aiModalTitle').textContent = 'AI Coach';
    if(document.getElementById('aiModalSubtitle')) document.getElementById('aiModalSubtitle').textContent = 'Progression Analyse';
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
        const res = await fetch('/.netlify/functions/gemini', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({contents:[{parts:[{text:prompt}]}]}) });
        const data = await res.json();
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = data.reply || 'Keine Antwort.'; }
    } catch(e) {
        document.getElementById('aiLoadingState')?.classList.add('hidden');
        const rEl = document.getElementById('aiResultText');
        if(rEl){ rEl.classList.remove('hidden'); rEl.textContent = 'Fehler: '+e.message; }
    }
};

// --- KI FORM BUILDER ---
window.generateForm = async function() {
    if(!window.checkOnlineForAI()) return;
    if(window.aiGate && !(await window.aiGate())) return;
    const input = document.getElementById('sportTypeInput')?.value?.trim();
    if (!input) { window.showToast("Bitte eine Beschreibung eingeben!"); return; }
    const btnText = document.getElementById('btnGenText');
    const btn = document.getElementById('btnGenerateForm');
    if(btnText) btnText.textContent = '⏳ KI denkt...';
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
        const res = await fetch('/.netlify/functions/gemini', { 
            method: 'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.2} }) 
        });
        if(!res.ok) throw new Error("Server Fehler " + res.status);
        const data = await res.json();
        if(!data.reply) throw new Error("Keine Antwort vom Server");
        let jsonStr = data.reply.replace(/```json/gi,'').replace(/```/g,'').trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if(!jsonMatch) throw new Error("Kein JSON in der Antwort gefunden");
        const result = JSON.parse(jsonMatch[0]);
        if(!result.schema || result.schema.length === 0) throw new Error("Leeres Schema erhalten");

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
            setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 50);

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
            setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 50);

            const count = result.schema.length;
            window.showToast(`✅ ${count} Feld${count > 1 ? 'er' : ''} hinzugefügt!`);
        }

    } catch(e) {
        console.error("KI Builder Fehler:", e);
        window.showToast("Fehler: " + e.message);
    } finally {
        if(btnText) btnText.textContent = 'Generieren';
        if(btn) btn.disabled = false;
    }
};

window.deleteCurrentSchema = function() {
    if(window.currentCategory === 'strength' || window.currentCategory === 'cardio') { window.showToast("Standard-Schema kann nicht gelöscht werden."); return; }
    window.showModal('Schema löschen?', 'Das aktuelle Schema wird dauerhaft gelöscht.', true, () => {
        window.categorySchemas[window.currentCategory] = null;
        const all = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas')||'{}');
        delete all[window.currentCategory];
        localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(all));
        window.switchCategory(window.currentCategory);
        window.showToast("Schema gelöscht.");
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
    planDuration = weeks;
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
};

window.openTrainingPlanModal = function() {
    // Defaults setzen
    window.setPlanGoal('Muskelmasse');
    window.setPlanDuration(6);
    window.setPlanDays(4);
    document.getElementById('planResult')?.classList.add('hidden');
    document.getElementById('planConfig')?.classList.remove('hidden');
    window.toggleModal('trainingPlanModal');
    if(window.lucide) lucide.createIcons();
};

window.generateTrainingPlan = async function() {
    if(!window.checkOnlineForAI()) return;
    if(window.aiGate && !(await window.aiGate())) return;
    if(!planGoal) { window.showToast('Bitte ein Ziel wählen!'); return; }
    var btn = document.getElementById('btnGenPlan');
    var btnText = document.getElementById('btnGenPlanText');
    if(btn) btn.disabled = true;

    async function fetchWeek(weekNum, totalWeeks) {
        var p = planGoal + ' Plan, Woche ' + weekNum + ' von ' + totalWeeks + '. ' + planDays + ' Sessions. ';
        if(weekNum === 1) p += 'Startphase. ';
        else if(weekNum === totalWeeks) p += 'Peak/Deload Woche. ';
        else p += 'Progressive Steigerung. ';
        p += 'Kurzes JSON: {"week":' + weekNum + ',"focus":"Fokus","sessions":[{"day":"Mo","name":"Push","exercises":[{"name":"Bench Press","sets":3,"reps":"8","intensity":"RPE 7","notes":""}]}]}';
        var res = await fetch('/.netlify/functions/gemini', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({contents:[{parts:[{text:p}]}]})});
        var raw = await res.text();
        if(raw.charAt(0) === '<') throw new Error('Server Timeout');
        var resp = JSON.parse(raw);
        if(!resp.reply) throw new Error(resp.error || 'Keine Antwort');
        var obj = null;
        try { obj = JSON.parse(resp.reply); } catch(e) { console.error('Fehler beim Parsen der KI-Antwort:', e); }
        if(!obj) {
            var si = resp.reply.indexOf('{');
            var ei = resp.reply.lastIndexOf('}');
            if(si > -1 && ei > si) try { obj = JSON.parse(resp.reply.slice(si, ei+1)); } catch(e) { console.error('Fehler beim Fallback-Parsen der KI-Antwort:', e); }
        }
        return obj;
    }

    try {
        var allWeeks = [];
        for(var w = 1; w <= planDuration; w++) {
            if(btnText) btnText.textContent = 'Woche ' + w + '/' + planDuration + '...';
            var weekData = await fetchWeek(w, planDuration);
            if(weekData) allWeeks.push(weekData);
        }
        if(allWeeks.length === 0) throw new Error('Keine Wochen generiert');
        var plan = {
            planName: planDuration + '-Wochen ' + planGoal,
            goal: planGoal,
            weeks: allWeeks,
            progressionNotes: 'Progressive Steigerung ueber ' + planDuration + ' Wochen mit Deload in der letzten Woche.'
        };
        _generatedPlan = plan;
        window.renderTrainingPlan(plan);
    } catch(e) {
        window.showToast('Fehler: ' + e.message);
    } finally {
        if(btn) btn.disabled = false;
        if(btnText) btnText.textContent = 'Plan generieren';
    }
};

window.renderTrainingPlan = function(plan) {
    const content = document.getElementById('planResultContent');
    if(!content || !plan) return;

    const weekColors = ['border-violet-500/30', 'border-indigo-500/30', 'border-cyan-500/30', 'border-emerald-500/30', 'border-amber-500/30', 'border-rose-500/30', 'border-orange-500/30', 'border-pink-500/30'];

    content.innerHTML = (plan.weeks || []).map((week, wi) => `
        <div class="bg-zinc-950/60 border ${weekColors[wi % weekColors.length]} rounded-2xl p-4">
            <div class="flex items-center justify-between mb-3">
                <p class="text-white font-black text-sm uppercase tracking-tight">Woche ${week.week}</p>
                <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">${week.focus || ''}</span>
            </div>
            <div class="space-y-2">
                ${(week.sessions || []).map(session => `
                    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-zinc-300 font-black text-[11px] uppercase tracking-widest">${session.day} — ${session.name}</p>
                        </div>
                        <div class="space-y-1.5">
                            ${(session.exercises || []).map(ex => `
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1">
                                        <p class="text-white text-xs font-bold">${ex.name}</p>
                                        ${ex.notes ? `<p class="text-zinc-600 text-[10px]">${ex.notes}</p>` : ''}
                                    </div>
                                    <div class="text-right flex-shrink-0">
                                        <p class="text-primary text-[11px] font-black">${ex.sets}×${ex.reps}</p>
                                        <p class="text-zinc-500 text-[10px] font-bold">${ex.intensity || ''}</p>
                                    </div>
                                </div>`).join('')}
                        </div>
                    </div>`).join('')}
            </div>
        </div>`).join('') + (plan.progressionNotes ? `
        <div class="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-4">
            <p class="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">Progressions-Strategie</p>
            <p class="text-zinc-400 text-sm">${plan.progressionNotes}</p>
        </div>` : '');

    document.getElementById('planConfig')?.classList.add('hidden');
    document.getElementById('planResult')?.classList.remove('hidden');
    if(window.lucide) lucide.createIcons();
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
    window.showToast(`${saved} Vorlagen gespeichert! ✅`);
};
