# Claude Code Command: Screen 5 — PT Dashboard "Carbon Elite" Komplett-Redesign

## KONTEXT FÜR NEUE SESSION
BASE App (base-app.tech), PWA Fitness Tracker. Vanilla JS + Tailwind CSS + Firebase.
Projektordner: ~/Desktop/Base App V2 Beta/
Hauptdateien: app.html (~8000 Zeilen), js/base-pt.js, design-override.css, sw.js.

Das PT Business Mode Design wird von "Indigo-Generic" auf "Carbon Elite" umgebaut.
Referenz: Stitch v3 Design (Gold #d4af37 auf schwarzem Hintergrund, Sora Font).
Der PT-Mode setzt bereits --primary-hex auf #d4af37 via _applyModeTheme('pt').

LIES ZUERST die CLAUDE.md im Repo-Root — dort stehen Projektregeln.

## KRITISCHE REGELN
1. **Vor jeder Änderung**: `grep` die betroffene Stelle, zeige mir die aktuelle Zeile
2. **Nach jeder Änderung**: Verifiziere mit `grep` dass die Änderung drin ist
3. **IDs NIEMALS ändern**: ptStatClients, ptStatSessions, ptStatWeekly, ptClientsList, ptClientsEmpty, ptBottomNav, alle ptNavBtn-* und ptNavIndicator-*
4. **Funktionsnamen NIEMALS ändern**: renderPTClientsDashboard, switchPTTab, renderDayView, etc.
5. **SW Cache Version erhöhen** vor jedem Deploy
6. **Deploye NUR nach Verifikation** — zeige mir grep-Output bevor du deployest
7. **Git commit vor dem Start**: `git add -A && git commit -m "pre-pt-redesign checkpoint"`

## SCHRITT 1: Inline Indigo → var(--primary-hex) (ALLE 64 Stellen in app.html)

Das ist die Basis. Ohne das funktioniert nichts.

```bash
# Vorher zählen
echo "VORHER:" && grep -c "#6366f1\|rgba(99,102,241" app.html

# Alle Replacements
sed -i '' 's/color:#6366f1/color:var(--primary-hex)/g' app.html
sed -i '' 's/background:#6366f1/background:var(--primary-hex)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.8)/var(--primary-hex)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.7)/color-mix(in srgb, var(--primary-hex), transparent 30%)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.3)/color-mix(in srgb, var(--primary-hex), transparent 70%)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.25)/color-mix(in srgb, var(--primary-hex), transparent 75%)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.2)/color-mix(in srgb, var(--primary-hex), transparent 80%)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.15)/color-mix(in srgb, var(--primary-hex), transparent 85%)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.12)/color-mix(in srgb, var(--primary-hex), transparent 88%)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.1)/color-mix(in srgb, var(--primary-hex), transparent 90%)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.08)/color-mix(in srgb, var(--primary-hex), transparent 92%)/g' app.html
sed -i '' 's/rgba(99,102,241,0\.06)/color-mix(in srgb, var(--primary-hex), transparent 94%)/g' app.html

# Nachher zählen
echo "NACHHER:" && grep -c "#6366f1\|rgba(99,102,241" app.html
```

NACHHER muss 0 sein. Falls nicht, zeige die verbleibenden Zeilen und fixe manuell.

## SCHRITT 2: PT Dashboard Header — "Carbon Elite" Redesign

Finde in app.html den Block (ca. Zeile 584-615) der den PT Clients Tab Header + Stats enthält.

Ersetze den GESAMTEN Inhalt von `<div id="pt-tab-clients" class="pt-tab-panel">` 
(von der öffnenden bis zur schließenden Tag-Zeile `</div>` vor `<!-- PT: Pläne Tab -->`)
durch:

```html
<div id="pt-tab-clients" class="pt-tab-panel">
    <!-- Carbon Elite Dashboard Header -->
    <div class="mb-6">
        <p class="text-[9px] font-bold uppercase tracking-[0.18em] mb-1" style="color:var(--primary-hex);font-family:'Outfit',sans-serif">Statusbericht heute</p>
        <div class="flex items-center justify-between">
            <h2 class="text-3xl font-black uppercase tracking-tight text-white" style="font-family:'Sora',sans-serif">Dashboard</h2>
            <button onclick="window.addNewClient()" class="flex items-center gap-2 px-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all pointer-events-auto active:scale-95" style="background:color-mix(in srgb, var(--primary-hex), transparent 85%);border:1px solid color-mix(in srgb, var(--primary-hex), transparent 70%);color:var(--primary-hex)">
                <i data-lucide="user-plus" class="w-3.5 h-3.5 pointer-events-none"></i> Neu
            </button>
        </div>
    </div>

    <!-- Stat Cards — Carbon Elite 3-Column -->
    <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="p-4 rounded-lg" style="background:#141414;border:1px solid #222">
            <p class="text-[9px] font-bold uppercase tracking-[0.15em] mb-2" style="color:var(--text-muted);font-family:'Outfit',sans-serif">Kunden</p>
            <p id="ptStatClients" class="text-3xl font-black text-white" style="font-family:'Sora',sans-serif">0</p>
        </div>
        <div class="p-4 rounded-lg" style="background:#141414;border:1px solid #222">
            <p class="text-[9px] font-bold uppercase tracking-[0.15em] mb-2" style="color:var(--text-muted);font-family:'Outfit',sans-serif">Sessions</p>
            <p id="ptStatSessions" class="text-3xl font-black text-white" style="font-family:'Sora',sans-serif">0</p>
        </div>
        <div class="p-4 rounded-lg" style="background:#141414;border:1px solid color-mix(in srgb, var(--primary-hex), transparent 70%)">
            <p class="text-[9px] font-bold uppercase tracking-[0.15em] mb-2" style="color:var(--primary-hex);font-family:'Outfit',sans-serif">Woche</p>
            <p id="ptStatWeekly" class="text-3xl font-black" style="font-family:'Sora',sans-serif;color:var(--primary-hex)">0</p>
        </div>
    </div>

    <!-- Section Header -->
    <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-black uppercase tracking-tight text-white" style="font-family:'Sora',sans-serif">Meine Kunden</h3>
        <span class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--text-muted)">Alle ansehen</span>
    </div>

    <!-- Kunden Liste -->
    <div id="ptClientsList" class="space-y-3"></div>
    <div id="ptClientsEmpty" class="hidden text-center py-12">
        <i data-lucide="users-2" class="w-10 h-10 mx-auto mb-3" style="color:color-mix(in srgb, var(--primary-hex), transparent 70%)"></i>
        <p class="font-black text-white mb-1">Noch keine Kunden</p>
        <p class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--text-muted)">Füge deinen ersten Kunden hinzu</p>
    </div>
</div>
```

WICHTIG: ptClientsList ist jetzt `space-y-3` statt `grid grid-cols-2 gap-3` — das Layout wechselt von 2-Spalten-Grid zu einer einspaltigen Liste wie im Stitch-Design.

## SCHRITT 3: Client-Cards Render-Funktion — Gold Avatare + Status Badges

In js/base-pt.js (NICHT base-pt.min.js!) befindet sich KEINE renderPTClientsDashboard — die ist in der minified Version. Suche stattdessen in app.html nach `renderPTClientsDashboard` oder direkt in base-pt.min.js.

ACHTUNG: base-pt.js ist die LESBARE Version, base-pt.min.js ist die GELADENE Version. Änderungen müssen in BEIDEN oder nur in der .min.js gemacht werden — prüfe welche geladen wird:

```bash
grep -n "base-pt" app.html | head -5
```

Falls base-pt.min.js geladen wird: Ändere die renderPTClientsDashboard in base-pt.min.js.
Falls base-pt.js geladen wird: Ändere dort.

Finde in der geladenen Datei die Funktion `renderPTClientsDashboard`. Der Teil der die Client-Cards HTML generiert (der .map() Block) muss so geändert werden dass jede Client-Card dieses HTML erzeugt:

```javascript
// Innerhalb des .map() Blocks, ersetze das return-Template durch:
return `<div role="button" tabindex="0" aria-label="${s} Details öffnen" onclick="window.openClientDetail('${e.id}')"
    class="p-4 rounded-lg cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] pointer-events-auto flex items-center gap-4"
    style="background:#141414;border:1px solid color-mix(in srgb, var(--primary-hex), transparent 80%)">
    <div class="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0" style="background:color-mix(in srgb, var(--primary-hex), transparent 80%);border:2px solid var(--primary-hex);color:var(--primary-hex)">${r}</div>
    <div class="flex-1 min-w-0">
        <p class="font-black text-white text-sm truncate">${s}</p>
        <p class="text-[10px] font-bold uppercase tracking-widest truncate" style="color:var(--text-muted)">${o>0 ? o+'× diese Woche' : i}</p>
        ${l}
    </div>
    <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest" style="background:${o>0?'rgba(16,185,129,0.15)':'rgba(82,82,91,0.3)'};color:${o>0?'#10b981':'#52525b'}">${o>0?'Aktiv':'Pause'}</span>
        <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-zinc-600 pointer-events-none"></i>
    </div>
</div>`;
```

HINWEIS: Die Variablen r (Initialen), s (Name), i (letztes Datum), o (Workouts diese Woche), l (Goal Badge) müssen exakt die gleichen Namen haben wie in der aktuellen Funktion. Lies den aktuellen Code ZUERST.

## SCHRITT 4: PT KI Tools als 2x2 Grid

Finde den Block `<div id="pt-tab-pttools"` (ca. Zeile 678). Ersetze den Inhalt durch:

```html
<div id="pt-tab-pttools" class="pt-tab-panel hidden">
    <h2 class="text-2xl font-black uppercase tracking-tight text-white mb-2" style="font-family:'Sora',sans-serif">KI Tools</h2>
    <p class="text-[10px] font-bold uppercase tracking-widest mb-5" style="color:var(--text-muted)">PT Business Suite</p>

    <!-- 2x2 Tool Grid -->
    <div class="grid grid-cols-2 gap-3 mb-6">
        <button onclick="window.openTrainingPlanModal()" class="flex flex-col items-center justify-center p-6 rounded-lg cursor-pointer transition-all pointer-events-auto active:scale-95" style="background:#141414;border:1px solid color-mix(in srgb, var(--primary-hex), transparent 80%)">
            <i data-lucide="calendar-days" class="w-7 h-7 mb-3 pointer-events-none" style="color:var(--primary-hex)"></i>
            <span class="text-[10px] font-black uppercase tracking-widest text-white" style="font-family:'Outfit',sans-serif">Plan</span>
        </button>
        <button onclick="window.generateClientWeeklyReport()" class="flex flex-col items-center justify-center p-6 rounded-lg cursor-pointer transition-all pointer-events-auto active:scale-95" style="background:#141414;border:1px solid color-mix(in srgb, var(--primary-hex), transparent 80%)">
            <i data-lucide="bar-chart-3" class="w-7 h-7 mb-3 pointer-events-none" style="color:var(--primary-hex)"></i>
            <span class="text-[10px] font-black uppercase tracking-widest text-white" style="font-family:'Outfit',sans-serif">Bericht</span>
        </button>
        <button onclick="window.generatePreHab()" class="flex flex-col items-center justify-center p-6 rounded-lg cursor-pointer transition-all pointer-events-auto active:scale-95" style="background:#141414;border:1px solid color-mix(in srgb, var(--primary-hex), transparent 80%)">
            <i data-lucide="shield-plus" class="w-7 h-7 mb-3 pointer-events-none" style="color:var(--primary-hex)"></i>
            <span class="text-[10px] font-black uppercase tracking-widest text-white" style="font-family:'Outfit',sans-serif">Pre-Hab</span>
        </button>
        <button onclick="window.exportClientPDF()" class="flex flex-col items-center justify-center p-6 rounded-lg cursor-pointer transition-all pointer-events-auto active:scale-95" style="background:#141414;border:1px solid color-mix(in srgb, var(--primary-hex), transparent 80%)">
            <i data-lucide="file-text" class="w-7 h-7 mb-3 pointer-events-none" style="color:var(--primary-hex)"></i>
            <span class="text-[10px] font-black uppercase tracking-widest text-white" style="font-family:'Outfit',sans-serif">PDF</span>
        </button>
    </div>

    <!-- Kunden-Link -->
    <div class="rounded-lg p-4 mb-4" style="background:#141414;border:1px solid color-mix(in srgb, var(--primary-hex), transparent 80%)">
        <div class="flex items-center gap-3 mb-3">
            <i data-lucide="globe" class="w-5 h-5 pointer-events-none" style="color:var(--primary-hex)"></i>
            <div>
                <p class="text-white font-black text-sm">Kunden-Link</p>
                <p class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--text-muted)">Kunden sehen DEINE Marke</p>
            </div>
        </div>
        <div class="flex gap-2">
            <button onclick="window.shareTrainerBrandLink()" class="flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto transition-all flex items-center justify-center gap-1.5" style="background:color-mix(in srgb, var(--primary-hex), transparent 90%);border:1px solid color-mix(in srgb, var(--primary-hex), transparent 80%);color:var(--primary-hex)">
                <i data-lucide="share-2" class="w-3.5 h-3.5 pointer-events-none"></i> Link teilen
            </button>
            <button onclick="window.previewTrainerBrand()" class="py-2.5 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto transition-all flex items-center justify-center gap-1.5" style="background:#1a1a1a;border:1px solid #333;color:var(--text-muted)">
                <i data-lucide="eye" class="w-3.5 h-3.5 pointer-events-none"></i>
            </button>
        </div>
    </div>

    <!-- Trainer Profil + Branding (bestehendes Markup beibehalten) -->
    <div id="trainerProfileCTA" class="pt-4 mt-2" style="border-top:1px solid var(--border-hex)">
        <p class="text-[10px] font-black uppercase tracking-widest mb-3" style="color:var(--text-muted)">Kunden-Akquise</p>
        <div id="trainerProfileStatus"></div>
        <button onclick="window.openTrainerProfileEditor()" class="w-full flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all pointer-events-auto text-left" style="background:#141414;border:1px solid color-mix(in srgb, var(--primary-hex), transparent 80%)">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background:color-mix(in srgb, var(--primary-hex), transparent 85%);border:1px solid color-mix(in srgb, var(--primary-hex), transparent 70%)">
                <i data-lucide="badge" class="w-5 h-5 pointer-events-none" style="color:var(--primary-hex)"></i>
            </div>
            <div>
                <p class="font-black text-white text-sm" id="trainerProfileBtnLabel">Öffentliches Profil erstellen</p>
                <p class="text-[10px] font-bold uppercase tracking-widest mt-0.5" style="color:var(--text-muted)" id="trainerProfileBtnSub">Werde von Kunden gefunden!</p>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600 ml-auto pointer-events-none"></i>
        </button>
        <div id="trainerStatsBar" class="hidden grid grid-cols-3 gap-2 mt-3">
            <div class="rounded-lg p-3 text-center" style="background:#141414;border:1px solid #222">
                <p class="text-[9px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Aufrufe</p>
                <p class="text-lg font-black text-white" id="trainerStatViews">0</p>
            </div>
            <div class="rounded-lg p-3 text-center" style="background:#141414;border:1px solid #222">
                <p class="text-[9px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Kontakte</p>
                <p class="text-lg font-black text-white" id="trainerStatContacts">0</p>
            </div>
            <div class="rounded-lg p-3 text-center" style="background:#141414;border:1px solid #222">
                <p class="text-[9px] font-black uppercase tracking-widest" style="color:var(--text-muted)">Bewertung</p>
                <p class="text-lg font-black text-white" id="trainerStatRating">—</p>
            </div>
        </div>
    </div>

    <!-- Branding -->
    <div class="pt-4 mt-4" style="border-top:1px solid var(--border-hex)">
        <p class="text-[10px] font-black uppercase tracking-widest mb-3" style="color:var(--text-muted)">Dein Branding</p>
        <div class="grid grid-cols-2 gap-2">
            <button onclick="window.setTrainerLogo()" class="flex items-center gap-3 p-3 rounded-lg cursor-pointer pointer-events-auto text-left transition-all" style="background:#141414;border:1px solid #222">
                <i data-lucide="image" class="w-4 h-4 flex-shrink-0 pointer-events-none" style="color:var(--primary-hex)"></i>
                <div><p class="font-black text-white text-xs">Logo</p><p class="text-[9px] font-bold uppercase" style="color:var(--text-muted)">Für PDFs</p></div>
            </button>
            <button onclick="window.setTrainerBranding()" class="flex items-center gap-3 p-3 rounded-lg cursor-pointer pointer-events-auto text-left transition-all" style="background:#141414;border:1px solid #222">
                <i data-lucide="palette" class="w-4 h-4 flex-shrink-0 pointer-events-none" style="color:var(--primary-hex)"></i>
                <div><p class="font-black text-white text-xs">Stil</p><p class="text-[9px] font-bold uppercase" style="color:var(--text-muted)">Name & Farbe</p></div>
            </button>
        </div>
    </div>
</div>
```

## SCHRITT 5: PT Bottom Nav — Dynamic Colors + Dot Indicator

Ersetze den gesamten `<nav id="ptBottomNav"...>` Block (Zeile ~512-543) durch:

```html
<nav id="ptBottomNav" class="fixed bottom-0 left-0 right-0 z-[200] shadow-2xl hidden transition-all duration-300" style="background:rgba(7,7,10,0.95);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid color-mix(in srgb, var(--primary-hex), transparent 80%);">
    <div class="max-w-4xl mx-auto flex px-2" style="padding-bottom:env(safe-area-inset-bottom,0px)">
        <button onclick="window.switchPTTab('clients')" id="ptNavBtn-clients" class="nav-tab-btn flex-1 flex flex-col items-center justify-center py-3 gap-1.5 transition-all relative pointer-events-auto" style="color:var(--primary-hex)">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300" style="background:var(--primary-hex);box-shadow:0 0 6px var(--primary-hex)" id="ptNavIndicator-clients"></div>
            <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200" style="background:color-mix(in srgb, var(--primary-hex), transparent 85%)">
                <i data-lucide="users-2" class="w-4 h-4 pointer-events-none"></i>
            </div>
            <span class="text-[9px] font-bold uppercase tracking-[0.12em]" style="font-family:'Outfit',sans-serif">Kunden</span>
        </button>
        <button onclick="window.switchPTTab('plans')" id="ptNavBtn-plans" class="nav-tab-btn flex-1 flex flex-col items-center justify-center py-3 gap-1.5 text-zinc-600 transition-all relative pointer-events-auto">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-0 transition-all duration-300" style="background:var(--primary-hex)" id="ptNavIndicator-plans"></div>
            <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200">
                <i data-lucide="calendar-days" class="w-4 h-4 pointer-events-none"></i>
            </div>
            <span class="text-[9px] font-bold uppercase tracking-[0.12em]" style="font-family:'Outfit',sans-serif">Pläne</span>
        </button>
        <button onclick="window.switchPTTab('pttools')" id="ptNavBtn-pttools" class="nav-tab-btn flex-1 flex flex-col items-center justify-center py-3 gap-1.5 text-zinc-600 transition-all relative pointer-events-auto">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-0 transition-all duration-300" style="background:var(--primary-hex)" id="ptNavIndicator-pttools"></div>
            <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200">
                <i data-lucide="sparkles" class="w-4 h-4 pointer-events-none"></i>
            </div>
            <span class="text-[9px] font-bold uppercase tracking-[0.12em]" style="font-family:'Outfit',sans-serif">KI Tools</span>
        </button>
        <button onclick="window.switchPTTab('mytraining')" id="ptNavBtn-mytraining" class="nav-tab-btn flex-1 flex flex-col items-center justify-center py-3 gap-1.5 text-zinc-600 transition-all relative pointer-events-auto">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-0 transition-all duration-300" style="background:var(--primary-hex)" id="ptNavIndicator-mytraining"></div>
            <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200">
                <i data-lucide="dumbbell" class="w-4 h-4 pointer-events-none"></i>
            </div>
            <span class="text-[9px] font-bold uppercase tracking-[0.12em]" style="font-family:'Outfit',sans-serif">Training</span>
        </button>
    </div>
</nav>
```

## SCHRITT 6: PT Kalender Header Overline

Finde die Zeile mit "Session-Planer" Overline (~Zeile 624) und ersetze den Header:

```html
<div class="flex items-center justify-between mb-4">
    <div>
        <p class="text-[9px] font-bold uppercase tracking-[0.18em] mb-1" style="color:var(--primary-hex);font-family:'Outfit',sans-serif">Session-Planer</p>
        <h2 class="text-2xl font-black uppercase tracking-tight text-white" style="font-family:'Sora',sans-serif">Kalender</h2>
    </div>
    <button onclick="window.openSessionModal()" class="flex items-center gap-2 px-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all pointer-events-auto active:scale-95" style="background:color-mix(in srgb, var(--primary-hex), transparent 85%);border:1px solid color-mix(in srgb, var(--primary-hex), transparent 70%);color:var(--primary-hex)">
        <i data-lucide="plus" class="w-3.5 h-3.5 pointer-events-none"></i> Session
    </button>
</div>
```

## SCHRITT 7: PT Mein Training Tab — Gold statt Indigo

Finde den Block `id="pt-tab-mytraining"` (~Zeile 783-789). Das Info-Banner nutzt noch Indigo. Ersetze:

```html
<div id="pt-tab-mytraining" class="pt-tab-panel hidden">
    <div class="flex items-center gap-3 mb-5 p-3 rounded-lg" style="background:color-mix(in srgb, var(--primary-hex), transparent 94%);border:1px solid color-mix(in srgb, var(--primary-hex), transparent 88%)">
        <i data-lucide="user" class="w-4 h-4 flex-shrink-0" style="color:var(--primary-hex)"></i>
        <p class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--primary-hex)">Dein persönliches Training</p>
    </div>
    <div id="ptMyTrainingInner"></div>
</div>
```

## SCHRITT 8: CSS — Carbon Elite Spezifische Regeln

Füge am Ende von design-override.css hinzu:

```css
/* ══════════════════════════════════════════════════════════
   Carbon Elite — PT Business Mode Overrides
   ══════════════════════════════════════════════════════════ */

/* PT Nav Dots statt Bars */
#ptBottomNav [id^="ptNavIndicator-"] {
    width: 4px !important;
    height: 4px !important;
    border-radius: 50% !important;
}

/* PT Cards: sharp radius (8px statt 18px) */
#ptTabsContainer .rounded-2xl {
    border-radius: 8px !important;
}
#ptTabsContainer .rounded-xl {
    border-radius: 6px !important;
}

/* PT Font Override: Sora for headings */
#ptTabsContainer h2,
#ptTabsContainer h3 {
    font-family: 'Sora', var(--ui-font-heading), sans-serif !important;
}
```

## SCHRITT 9: Verifizierung + Deploy

```bash
# 1. Keine hardcoded Indigo mehr
echo "=== Hardcoded Indigo ===" 
grep -c "#6366f1\|rgba(99,102,241" app.html

# 2. Dashboard Header existiert
echo "=== Dashboard Header ===" 
grep -c "Statusbericht heute" app.html

# 3. 2x2 Grid in KI Tools
echo "=== KI Tools Grid ===" 
grep -c "grid-cols-2 gap-3 mb-6" app.html

# 4. Carbon Elite CSS
echo "=== Carbon Elite CSS ===" 
grep -c "Carbon Elite" design-override.css

# Erwartung: 0, 1, 1, 1
# Erst wenn alle stimmen:
# SW Cache erhöhen
# npx netlify deploy --prod
```

## SCHRITT 10 (NUR bei base-pt.min.js Problemen):

Falls base-pt.min.js geladen wird und die indigo-Klassen in den JS-Render-Funktionen noch stehen:

```bash
# Prüfe welche Datei geladen wird
grep "base-pt" app.html | grep "script"

# Falls .min.js: Ersetze dort auch
sed -i '' 's/bg-indigo-500/bg-primary/g' js/base-pt.min.js
sed -i '' 's/text-indigo-400/text-primary/g' js/base-pt.min.js  
sed -i '' 's/text-indigo-300/text-primary/g' js/base-pt.min.js
sed -i '' 's/border-indigo-500/border-primary/g' js/base-pt.min.js
```

Aber VORSICHT: Die min.js enthält tausende Zeilen. Prüfe mit grep -c vorher und nachher.

## ROLLBACK
```bash
git checkout -- app.html design-override.css js/base-pt.min.js
# SW Cache trotzdem erhöhen und deployen
```
