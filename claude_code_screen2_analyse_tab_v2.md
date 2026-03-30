# Claude Code Command: Screen 2 — Analyse Tab Komplett (Stitch v8)

## KONTEXT
BASE App. Projektordner: ~/Desktop/Base App V2 Beta/
Der Analyse Tab wird vom aktuellen Tabellen-Layout zum Stitch-v8 Card-Design umgebaut.
Referenz-Design: Stitch v8 — Cards mit großen Zahlen, 3er Action-Button Grid, "letzte aktivitäten" Header.

LIES ZUERST die CLAUDE.md im Repo-Root.

## KRITISCHE REGELN
1. Die Filter/Sort/Progress-Logik in renderTable() wird NICHT angerührt
2. NUR das Card-HTML-Template am Ende von renderTable() wird ersetzt
3. Alle IDs bleiben: historyTableBody, mobileCardList, emptyWorkoutState, btnWarmup, btnExerciseRec, btnFinish, btnClear, btnViewActive, btnViewArchive, btnViewChart
4. Alle Funktionen bleiben: renderTable, filterTable, sortTable, editEntry, deleteEntry, shareWorkout, archiveWorkouts
5. Git checkpoint: `git add -A && git commit -m "pre-analyse-v8-redesign"`

## SCHRITT 1: Cards immer anzeigen, Tabelle verstecken

In app.html, finde die CSS Media Queries (ca. Zeile 256-264):

```css
@media (max-width: 767px) {
    #desktopTableWrapper { display: none !important; }
    #mobileCardList { display: flex !important; }
}
@media (min-width: 768px) {
    #desktopTableWrapper { display: block !important; }
    #mobileCardList { display: none !important; }
}
```

Ersetze durch:

```css
#desktopTableWrapper { display: none !important; }
#mobileCardList { display: flex !important; }
```

VERIFIZIERE: `grep -c "min-width: 768px" app.html` — muss um 1 kleiner sein als vorher (dieser Block weg, eventuelle andere bleiben).

## SCHRITT 2: Action Buttons als 3er Grid

Finde in app.html den Block mit den Action Buttons (ca. Zeile 1159-1165). 
Das ist der `<div class="flex items-center gap-2 w-full sm:w-auto">` Block der btnWarmup, btnExerciseRec, btnFinish, btnClear und den CSV-Export Button enthält.

Ersetze DIESEN `<div class="flex items-center gap-2...">` Block (und seinen schließenden `</div>`) durch:

```html
<div class="grid grid-cols-3 gap-2 w-full mt-2" id="analyseActionGrid">
    <button id="btnWarmup" onclick="window.getWarmupRecommendation()" class="hidden flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all pointer-events-auto active:scale-95" style="background:color-mix(in srgb, var(--primary-hex), transparent 95%);border:1px solid color-mix(in srgb, var(--primary-hex), transparent 90%)">
        <i data-lucide="flame" class="w-5 h-5 mb-2 pointer-events-none" style="color:var(--primary-hex)"></i>
        <span class="text-[10px] font-bold lowercase tracking-wide pointer-events-none" style="color:var(--primary-hex);font-family:'Sora',sans-serif">aufwärmen</span>
    </button>
    <button id="btnExerciseRec" onclick="window.getExerciseRecommendation()" class="hidden flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all pointer-events-auto active:scale-95" style="background:color-mix(in srgb, var(--primary-hex), transparent 95%);border:1px solid color-mix(in srgb, var(--primary-hex), transparent 90%)">
        <i data-lucide="sparkles" class="w-5 h-5 mb-2 pointer-events-none" style="color:var(--primary-hex)"></i>
        <span class="text-[10px] font-bold lowercase tracking-wide pointer-events-none" style="color:var(--primary-hex);font-family:'Sora',sans-serif">ki empfehlung</span>
    </button>
    <button id="btnFinish" onclick="window.archiveWorkouts()" class="flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all pointer-events-auto active:scale-95" style="background:color-mix(in srgb, var(--primary-hex), transparent 95%);border:1px solid color-mix(in srgb, var(--primary-hex), transparent 90%)">
        <i data-lucide="check-circle" class="w-5 h-5 mb-2 pointer-events-none" style="color:var(--primary-hex)"></i>
        <span class="text-[10px] font-bold lowercase tracking-wide pointer-events-none" style="color:var(--primary-hex);font-family:'Sora',sans-serif" data-i18n="btnEnd">beenden</span>
    </button>
</div>
<div class="flex items-center gap-2 mt-2">
    <button id="btnClear" onclick="window.deleteAllArchive()" class="hidden text-[10px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-lg uppercase tracking-widest transition-all justify-center items-center gap-1.5 cursor-pointer pointer-events-auto"><i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i> <span data-i18n="btnDel">Leeren</span></button>
    <button aria-label="CSV Export" onclick="window.exportToCSV()" class="text-[10px] font-black text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer pointer-events-auto"><i data-lucide="download" class="w-3.5 h-3.5 pointer-events-none"></i></button>
</div>
```

WICHTIG: btnWarmup und btnExerciseRec haben `class="hidden flex-col..."` — sie werden per JS sichtbar/unsichtbar geschaltet. Das `hidden` muss bleiben! Prüfe dass switchView() die display-Logik noch funktioniert. switchView setzt `btnFinish.style.display` und `btnClear.style.display` — das funktioniert weiterhin weil die IDs gleich sind.

VERIFIZIERE: `grep -c "analyseActionGrid" app.html` — muss 1 sein.

## SCHRITT 3: "letzte aktivitäten" Section Header

Finde die Zeile mit `id="viewTableContainer"` (ca. Zeile 1168).

DIREKT NACH `<div id="viewTableContainer" class="block">` und VOR den Filter-Buttons füge ein:

```html
<div class="flex items-center justify-between px-5 pt-5 pb-2">
    <h3 class="font-bold text-lg lowercase text-white" style="font-family:'Sora',sans-serif" id="verlaufHeader">letzte aktivitäten</h3>
    <span class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--text-muted)" id="verlaufCount"></span>
</div>
```

Und in renderTable(), am ENDE der Funktion (vor `};`), füge hinzu:

```javascript
const vc = document.getElementById('verlaufCount'); if(vc) vc.textContent = filteredWorkouts.length + ' Sessions';
```

## SCHRITT 4: Workout Card Template — Stitch v8 Layout (KRITISCH)

Das ist die wichtigste Änderung. In app.html, finde die Zeile (ca. 5333):

```javascript
if(mobileList) { const card = document.createElement('div'); card.className = 'relative rounded-2xl p-4 transition-all'; card.style.cssText = 'background:var(--surface-hex);border:1px solid var(--border-hex)';
```

Ersetze den GESAMTEN mobileList Block — von `if(mobileList) {` bis zur schließenden `}` VOR `}); if(window.lucide)` — durch:

```javascript
if(mobileList) { 
    const card = document.createElement('div'); 
    card.className = 'relative rounded-2xl p-5 transition-all group hover:-translate-y-0.5'; 
    card.style.cssText = 'background:var(--surface-hex);border:1px solid var(--border-hex)';
    
    // Satz-Zusammenfassung für Kraft
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
    
    // Datum formatieren
    const dateObj = new Date(w.date + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    let dateStr = w.date.substring(5).replace('-', '.');
    if (dateObj.getTime() === today.getTime()) dateStr = 'Heute';
    else if (dateObj.getTime() === yesterday.getTime()) dateStr = 'Gestern';
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div class="flex-1 min-w-0">
                <p onclick="event.stopPropagation(); window.openExerciseHistory('${w.exercise.replace(/'/g, "\\'")}')" class="font-bold text-white text-[15px] tracking-tight cursor-pointer pointer-events-auto hover:text-primary transition-colors" style="font-family:'Sora',sans-serif">${window._escapeHtml(w.exercise)}</p>
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
            ${setsDisplay ? `<div><span class="text-xl font-bold tracking-tight text-white" style="font-family:'Sora',sans-serif">${window._escapeHtml(setsDisplay)}</span><span class="text-xs ml-1.5" style="color:var(--text-muted)">Sätze</span></div>` : ''}
            ${setsDisplay && weightDisplay ? '<div class="h-6 w-px" style="background:rgba(255,255,255,0.06)"></div>' : ''}
            ${weightDisplay ? `<div><span class="text-xl font-bold tracking-tight text-white" style="font-family:'Sora',sans-serif">${window._escapeHtml(weightDisplay)}</span><span class="text-xs ml-1.5" style="color:var(--text-muted)">Gewicht</span></div>` : ''}
        </div>` : ''}
        <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            ${!isStrava && !w.archived ? `<button onclick="window.editEntry('${w.id}')" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><i data-lucide="edit-2" class="w-3 h-3 text-zinc-500 pointer-events-none"></i></button>` : ''}
            <button onclick="window.shareWorkout('${w.id}')" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><i data-lucide="share-2" class="w-3 h-3 text-zinc-500 pointer-events-none"></i></button>
            <button onclick="window.deleteEntry('${w.id}')" class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="background:var(--inner-bg-hex);border:1px solid var(--border-hex)"><i data-lucide="trash-2" class="w-3 h-3 text-zinc-500 hover:text-rose-400 pointer-events-none"></i></button>
        </div>
    `;
    mobileList.appendChild(card); 
}
```

HINWEIS: Die Variablen `w`, `ui`, `isStrava`, `window._escapeHtml` sind alle bereits im Scope von renderTable(). Du musst NICHTS importieren.

VERIFIZIERE: 
```bash
grep -c "letzte aktivitäten\|verlaufHeader\|text-xl font-bold tracking-tight" app.html
```
Muss > 0 sein.

## SCHRITT 5: Progress Badge Styling — Pill statt eckig

Die Badges werden in der Sortier-Logik generiert (vor dem Card-Template). 
Suche diese Zeilen in renderTable():

```
bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
```

Ersetze in diesen Badge-Zeilen `rounded shadow-sm ml-2` durch `rounded-full shadow-sm ml-2`.
Es gibt 3 Stellen (emerald +%, rose -%, und strava orange).

```bash
sed -i '' 's/rounded shadow-sm ml-2">+/rounded-full shadow-sm ml-2">+/g' app.html
sed -i '' 's/rounded shadow-sm ml-2">-/rounded-full shadow-sm ml-2">-/g' app.html
```

## SCHRITT 6: CSS für Cards

Füge am Ende von design-override.css hinzu:

```css
/* ══════════════════════════════════════════════════════════
   Screen 2: Analyse Tab — Stitch v8 Card Layout
   ══════════════════════════════════════════════════════════ */

#mobileCardList {
    padding: 8px 16px !important;
    gap: 8px !important;
}

/* Analyse Mode Tabs (Workouts/PRs/Muskeln) — pill style */
#dashboardSection .overflow-x-auto button[onclick*="switchAnalyseMode"] {
    border-radius: 9999px !important;
    font-family: var(--ui-font-body), 'Outfit', sans-serif !important;
}

/* Action Grid Cards */
#analyseActionGrid button {
    border-radius: 18px !important;
}
#analyseActionGrid button:hover {
    transform: translateY(-1px);
}

/* Filter pills — lowercase */
#timelineFiltersContainer button {
    text-transform: lowercase !important;
    border-radius: 9999px !important;
    font-family: var(--ui-font-body), 'Outfit', sans-serif !important;
}
```

## SCHRITT 7: Verifizierung + Deploy

```bash
echo "=== 1. Table hidden ==="
grep "desktopTableWrapper.*none" app.html | head -1

echo "=== 2. Cards visible ==="
grep "mobileCardList.*flex" app.html | head -1

echo "=== 3. Action grid ==="
grep -c "analyseActionGrid" app.html

echo "=== 4. Verlauf header ==="
grep -c "letzte aktivitäten" app.html

echo "=== 5. New card template ==="
grep -c "text-xl font-bold tracking-tight" app.html

echo "=== 6. CSS added ==="
grep -c "Stitch v8" design-override.css

# Erwartung: alle > 0
# Erhöhe SW Cache in sw.js und deploye: npx netlify deploy --prod
```

## ROLLBACK
```bash
git checkout -- app.html design-override.css
```
