══════════════════════════════════════════════════════════════
CLAUDE CODE — SICHERER DESIGN-FIX
Kein HTML ändern. Kein Tailwind ändern. Nur CSS + JS Werte.
══════════════════════════════════════════════════════════════

WICHTIG: Die vorherigen Versuche haben die App kaputt gemacht 
weil HTML-Elemente und Tailwind-Klassen verändert wurden.

DIESER BEFEHL ÄNDERT KEIN EINZIGES HTML-ELEMENT.
Keine Tailwind-Klassen entfernen. Keine class="" Attribute anfassen.
Keine inline-styles in HTML-Tags ändern.

Stattdessen: CSS-Overrides die ÜBER den bestehenden Styles liegen.

══════════════════════════════════════════════════════════════
SCHRITT 1: :root Defaults ändern (3 Werte, 1 Datei)
══════════════════════════════════════════════════════════════

In app.html, Zeile 30. FINDE:

    --primary-hex: #06b6d4; --secondary-hex: #6366f1; --bg-hex: #07070a;

ERSETZE MIT:

    --primary-hex: #a3c9a8; --secondary-hex: #7aab82; --bg-hex: #0f110f;

In app.html, Zeile 35. FINDE:

    --ui-font-heading: 'Barlow Condensed', sans-serif; --ui-font-body: 'DM Sans', sans-serif;

ERSETZE MIT:

    --ui-font-heading: 'Sora', sans-serif; --ui-font-body: 'Outfit', sans-serif;

Das wars für :root. NUR diese 2 Zeilen.

══════════════════════════════════════════════════════════════
SCHRITT 2: Font-Link fixen (1 Zeile)
══════════════════════════════════════════════════════════════

In app.html, Zeile 385. FINDE:

    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">

ERSETZE MIT:

    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

NUR media="print" onload="this.media='all'" entfernen.

══════════════════════════════════════════════════════════════
SCHRITT 3: Neue CSS-Override Datei erstellen
══════════════════════════════════════════════════════════════

Erstelle eine NEUE Datei: design-override.css

Inhalt:

/* ══════════════════════════════════════════════════════════
   BASE Design Override — Zen Flow + Carbon Elite
   Überschreibt Tailwind-Klassen und Inline-Styles
   OHNE HTML zu verändern.
   Entfernen: Lösche diese Datei + den <link> in app.html.
   ══════════════════════════════════════════════════════════ */

/* ── Tailwind Indigo Klassen → var(--primary-hex) ──────── */

/* Backgrounds */
.bg-indigo-500 { background-color: var(--primary-hex) !important; }
.bg-indigo-400 { background-color: var(--primary-hex) !important; }
[class*="bg-indigo-500/5"] { background-color: color-mix(in srgb, var(--primary-hex), transparent 95%) !important; }
[class*="bg-indigo-500/10"] { background-color: color-mix(in srgb, var(--primary-hex), transparent 90%) !important; }
[class*="bg-indigo-500/15"] { background-color: color-mix(in srgb, var(--primary-hex), transparent 85%) !important; }
[class*="bg-indigo-500/20"] { background-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important; }
[class*="bg-indigo-500/25"] { background-color: color-mix(in srgb, var(--primary-hex), transparent 75%) !important; }

/* Text */
.text-indigo-400 { color: var(--primary-hex) !important; }
.text-indigo-300 { color: var(--primary-hex) !important; }
.text-indigo-500 { color: var(--primary-hex) !important; }

/* Borders */
[class*="border-indigo-500/20"] { border-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important; }
[class*="border-indigo-500/30"] { border-color: color-mix(in srgb, var(--primary-hex), transparent 70%) !important; }
[class*="border-indigo-400/40"] { border-color: color-mix(in srgb, var(--primary-hex), transparent 60%) !important; }
[class*="border-indigo-400/20"] { border-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important; }

/* Hover */
[class*="hover:bg-indigo-500/10"]:hover { background-color: color-mix(in srgb, var(--primary-hex), transparent 90%) !important; }
[class*="hover:bg-indigo-500/20"]:hover { background-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important; }
[class*="hover:bg-indigo-500/25"]:hover { background-color: color-mix(in srgb, var(--primary-hex), transparent 75%) !important; }
[class*="hover:bg-indigo-400"]:hover { background-color: var(--primary-hex) !important; opacity: 0.9; }
[class*="hover:text-indigo-300"]:hover { color: var(--primary-hex) !important; }

/* Gradient overrides */
[class*="from-indigo-500"] { --tw-gradient-from: var(--primary-hex) !important; }
[class*="from-indigo-400"] { --tw-gradient-from: var(--primary-hex) !important; }
[class*="to-purple-400"] { --tw-gradient-to: var(--primary-hex) !important; }
[class*="to-purple-500"] { --tw-gradient-to: var(--secondary-hex) !important; }

/* ── Shadows mit Indigo → primary ──────────────────────── */
[style*="box-shadow"][style*="99,102,241"] {
    box-shadow: 0 0 50px color-mix(in srgb, var(--primary-hex), transparent 85%) !important;
}

/* ── Inline Indigo Farben Override ──────────────────────── */
/* Für Elemente die style="color:#6366f1" haben */
[style*="color:#6366f1"] { color: var(--primary-hex) !important; }
[style*="color: #6366f1"] { color: var(--primary-hex) !important; }
[style*="background:#6366f1"] { background: var(--primary-hex) !important; }
[style*="background-color:#6366f1"] { background-color: var(--primary-hex) !important; }

/* Für rgba Inline-Styles — diese sind schwieriger, wir nutzen 
   Selektoren die auf bekannte Container zielen */
#ptDashboard [style*="99,102,241"] { 
    color: var(--primary-hex) !important; 
}
#ptBottomNav [style*="99,102,241"] {
    color: var(--primary-hex) !important;
}

/* ── Inline font-family Override ───────────────────────── */
[style*="font-family:'Barlow Condensed'"],
[style*="font-family:\"Barlow Condensed\""],
[style*="font-family: 'Barlow Condensed'"] {
    font-family: var(--ui-font-heading) !important;
}
[style*="font-family:'DM Sans'"],
[style*="font-family:\"DM Sans\""],
[style*="font-family: 'DM Sans'"] {
    font-family: var(--ui-font-body) !important;
}

/* ── KI Tools Tab: Einheitliche Akzentfarbe ────────────── */
/* Die Tool-Cards haben individuelle Farben (Lila, Orange, Grün).
   Alle bekommen jetzt var(--primary-hex). */

/* Lila AI Coach Card */
[style*="rgba(99,102,241"] {
    border-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important;
}
[style*="background:rgba(99,102,241"],
[style*="background: rgba(99,102,241"] {
    background: color-mix(in srgb, var(--primary-hex), transparent 85%) !important;
}
[style*="color:rgba(99,102,241"],
[style*="color: rgba(99,102,241"] {
    color: var(--primary-hex) !important;
}

/* Orange 1RM Card */
[style*="rgba(249,115,22"],
[style*="rgba(249, 115, 22"] {
    border-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important;
}
[style*="background:rgba(249,115,22"],
[style*="background: rgba(249,115,22"] {
    background: color-mix(in srgb, var(--primary-hex), transparent 85%) !important;
}
[style*="color:rgba(249,115,22"],
[style*="color:#f97316"],
[style*="color: #f97316"] {
    color: var(--primary-hex) !important;
}
.text-orange-400, .text-orange-500 {
    color: var(--primary-hex) !important;
}
[class*="bg-orange-500/10"],
[class*="bg-orange-500/20"],
[class*="bg-orange-400/10"],
[class*="bg-orange-400/20"] {
    background-color: color-mix(in srgb, var(--primary-hex), transparent 85%) !important;
}
[class*="border-orange-500/20"],
[class*="border-orange-500/30"],
[class*="border-orange-400/20"],
[class*="border-orange-400/30"] {
    border-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important;
}

/* Violett KI Trainingsplan Card */
[style*="rgba(139,92,246"],
[style*="rgba(139, 92, 246"] {
    border-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important;
}
[style*="background:rgba(139,92,246"],
[style*="background: rgba(139,92,246"] {
    background: color-mix(in srgb, var(--primary-hex), transparent 85%) !important;
}
[style*="color:rgba(139,92,246"],
[style*="color:#8b5cf6"],
[style*="color: #8b5cf6"] {
    color: var(--primary-hex) !important;
}
.text-violet-400, .text-purple-400 {
    color: var(--primary-hex) !important;
}
[class*="bg-purple-500/10"],
[class*="bg-purple-500/5"],
[class*="bg-violet-500/10"] {
    background-color: color-mix(in srgb, var(--primary-hex), transparent 85%) !important;
}

/* Gelb Challenges Card */
[style*="rgba(234,179,8"],
[style*="rgba(234, 179, 8"] {
    border-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important;
}
[style*="background:rgba(234,179,8"],
[style*="background: rgba(234,179,8"] {
    background: color-mix(in srgb, var(--primary-hex), transparent 85%) !important;
}
[style*="color:rgba(234,179,8"],
[style*="color:#eab308"],
[style*="color: #eab308"] {
    color: var(--primary-hex) !important;
}
.text-yellow-400, .text-yellow-500, .text-amber-400 {
    color: var(--primary-hex) !important;
}
[class*="bg-yellow-500/10"],
[class*="bg-amber-500/10"],
[class*="bg-amber-400/10"] {
    background-color: color-mix(in srgb, var(--primary-hex), transparent 85%) !important;
}
[class*="border-yellow-500/20"],
[class*="border-amber-500/20"],
[class*="border-amber-400/20"] {
    border-color: color-mix(in srgb, var(--primary-hex), transparent 80%) !important;
}

/* Cyan/Teal Override (aktiver Bereich) */
[style*="color:#06b6d4"],
[style*="color: #06b6d4"] {
    color: var(--primary-hex) !important;
}
.text-cyan-400 {
    color: var(--primary-hex) !important;
}

/* ── AUFWÄRMEN Button ──────────────────────────────────── */
[class*="bg-orange-500/10"][class*="border-orange-500"],
[class*="bg-amber-500/10"][class*="border-amber-500"] {
    background-color: color-mix(in srgb, var(--primary-hex), transparent 85%) !important;
    border-color: color-mix(in srgb, var(--primary-hex), transparent 70%) !important;
    color: var(--primary-hex) !important;
}

/* ── Auth Modal Gradient ───────────────────────────────── */
.bg-gradient-to-r.from-indigo-500.to-purple-500,
[class*="from-indigo-500"][class*="to-purple-500"] {
    background: linear-gradient(to right, var(--primary-hex), var(--secondary-hex)) !important;
}

/* ── Design Morph Token Defaults ───────────────────────── */
:root {
    --cat-accent: #a3c9a8;
    --cat-glow: rgba(163,201,168,0.08);
    --cat-glow-strong: rgba(163,201,168,0.15);
    --surface-hex: #171a17;
    --inner-bg-hex: #0c0e0c;
    --border-hex: #242824;
    --text-main: #d4ddd6;
    --text-muted: #5e6e60;
}

══════════════════════════════════════════════════════════════
SCHRITT 4: CSS-Override in app.html einbinden
══════════════════════════════════════════════════════════════

In app.html, DIREKT NACH dem Sora/Outfit Font-Link (Zeile 385),
füge EINE Zeile hinzu:

    <link rel="stylesheet" href="design-override.css">

Das ist ALLES. Kein anderes HTML wird verändert.

══════════════════════════════════════════════════════════════
SCHRITT 5: base-pt.js — NUR Farbwerte ersetzen
══════════════════════════════════════════════════════════════

WICHTIG: Keine HTML-Templates, keine Klassen, keine Struktur ändern.
NUR die Farbwert-Strings.

5a) Füge am Anfang von base-pt.js (nach dem MODE_THEMES Block) ein:

    window._getPrimaryHex = function() {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-hex').trim() || '#a3c9a8';
    };

5b) Ersetze in base-pt.js NUR diese String-Werte:

    FINDE: '#6366f1'  (als String, 13 Vorkommen)
    ERSETZE JEDES mit: (window._getPrimaryHex ? window._getPrimaryHex() : '#a3c9a8')
    
    ABER NUR in Zeilen wo es als FARBE genutzt wird (style=, color, background).
    NICHT in der Zeile wo es als Default-Wert im prompt() steht (Zeile 1901/1906).
    
    Konkret diese Zeilen (prüfe Zeilennummern in DEINER Version):
    - Zeile 334: activeBtn.style.color = '#6366f1'
    - Zeile 387: background:linear-gradient(135deg,#6366f1,#8b5cf6)
    - Zeile 471: color:#6366f1 in cssText
    - Zeile 840: textColor = '#6366f1'
    - Zeile 905: btn.style.color = '#6366f1'
    - Zeile 1171: color:#6366f1 in template string
    - Zeile 1173: background:#6366f1
    - Zeile 1361: textColor = '#6366f1'
    - Zeile 1959: ctx.strokeStyle = '#6366f1'
    - Zeile 1977: ctx.fillStyle = '#6366f1'
    - Zeile 2029: branding.color || '#6366f1' (das ist OK als Fallback)
    
    Für JEDE dieser Zeilen: Ersetze '#6366f1' mit einem Aufruf
    von _getPrimaryHex() ODER mit var(--primary-hex) wenn es in
    einem HTML-Template-String steht.
    
    Beispiele:
    VORHER: activeBtn.style.color = '#6366f1';
    NACHHER: activeBtn.style.color = window._getPrimaryHex();
    
    VORHER: style="background:#6366f1"
    NACHHER: style="background:var(--primary-hex)"
    
    VORHER: style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
    NACHHER: style="background:var(--primary-hex)"

5c) Ersetze rgba(99,102,241,...) Werte in base-pt.js:

    Nutze den gleichen Ansatz — ersetze den String-Wert:
    
    VORHER: 'rgba(99,102,241,0.15)'
    NACHHER: 'color-mix(in srgb,' + window._getPrimaryHex() + ',transparent 85%)'
    
    ODER einfacher für Template-Strings:
    VORHER: style="background:rgba(99,102,241,0.15)"
    NACHHER: style="background:color-mix(in srgb,var(--primary-hex),transparent 85%)"

5d) Ersetze 'DM Sans' Font-Referenzen in base-pt.js:
    
    VORHER: font-family:DM Sans,sans-serif
    NACHHER: font-family:var(--ui-font-body)
    
    Das betrifft ca. 2-3 Stellen.

══════════════════════════════════════════════════════════════
SCHRITT 6: Theme Preset "cyan" aktualisieren
══════════════════════════════════════════════════════════════

In app.html, im _themePresets Objekt (ca. Zeile 353), 
FINDE den "cyan" Preset:

    cyan: { primary:'#06b6d4', secondary:'#6366f1', bg:'#07070a', textMain:'#f4f4f5', textMuted:'#82828c', fontHeading:'Barlow Condensed', fontBody:'DM Sans', radius:'18px' },

ERSETZE MIT:

    cyan: { primary:'#a3c9a8', secondary:'#7aab82', bg:'#0f110f', textMain:'#d4ddd6', textMuted:'#5e6e60', fontHeading:'Sora', fontBody:'Outfit', radius:'18px' },

Damit ist der Standard-Preset "Zen Flow" statt "Cyan".

══════════════════════════════════════════════════════════════
SCHRITT 7: Minifizieren + Cache + Deploy
══════════════════════════════════════════════════════════════

npx terser js/base-pt.js -o js/base-pt.min.js -c -m

Erhöhe SW Cache Version in sw.js um 2.

Füge design-override.css zum SW Cache-Array hinzu 
(suche nach dem Array mit gecachten Dateien und füge 
'design-override.css' hinzu).

git add -A
git commit -m "fix: CSS-Override Ansatz — keine HTML-Änderungen, nur Farben + Fonts

- :root Defaults: Sage Green #a3c9a8, BG #0f110f, Sora+Outfit
- Neues design-override.css überschreibt ALLE Tailwind Indigo-Klassen
- KI Tools: Einheitliche Akzentfarbe statt Regenbogen
- base-pt.js: Farbwerte dynamisch via _getPrimaryHex()
- Font-Link: media=print Trick entfernt
- Kein HTML-Element verändert
- Rollback: design-override.css Link entfernen"

npx netlify deploy --prod

══════════════════════════════════════════════════════════════
SCHRITT 8: Verifizierung
══════════════════════════════════════════════════════════════

curl -s https://base-app.tech/app.html | grep "design-override.css"
→ Muss 1 Treffer zeigen

curl -s https://base-app.tech/app.html | grep "primary-hex: #a3c9a8"
→ Muss 1 Treffer zeigen

curl -s https://base-app.tech/app.html | grep "ui-font-heading: 'Sora'"
→ Muss 1 Treffer zeigen

curl -s https://base-app.tech/design-override.css | head -5
→ Muss CSS-Inhalt zeigen (nicht 404)

══════════════════════════════════════════════════════════════
WARUM DIESER ANSATZ SICHER IST
══════════════════════════════════════════════════════════════

1. KEIN HTML-Element wird verändert → keine kaputten Icons
2. KEINE Tailwind-Klassen aus class="" entfernt → keine Layout-Breaks
3. CSS-Override nutzt !important → überschreibt bestehende Styles
4. Rollback in 5 Sekunden: <link> Tag zu design-override.css entfernen
5. In base-pt.js werden NUR Farbwert-Strings ersetzt, keine 
   HTML-Templates oder Klassen-Namen
6. design-override.css ist eine NEUE Datei die nichts Bestehendes 
   überschreibt oder modifiziert

══════════════════════════════════════════════════════════════
ROLLBACK (falls irgendwas kaputt ist)
══════════════════════════════════════════════════════════════

Option A: Entferne die Zeile <link rel="stylesheet" href="design-override.css">
aus app.html. Die App sieht dann aus wie vorher.

Option B: git revert HEAD --no-edit
