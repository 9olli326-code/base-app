# Claude Code Command: PT Session Planner — Custom Session-Typen (max +3)

## KONTEXT
BASE App. Projektordner: C:\Users\olli\Desktop\Base-App\
WINDOWS: Nutze `sed -i` OHNE leere Anführungszeichen.

Im PT Session Planner gibt es 3 feste Session-Typen:
Kraft, Ausdauer, Mobility. Diese stehen in einem `grid-cols-3` Layout
mit Radio-Buttons (IDs: sessionTypeKraft, sessionTypeAusdauer, sessionTypeMobility).

Wir fügen einen "+" Button hinzu um bis zu 3 Custom Session-Typen
zu erstellen (z.B. "Entspannung", "Kampfsport", "Schwimmen").
Jeder Custom-Typ bekommt eigene Quick-Pick Übungen per KI.

LIES ZUERST die CLAUDE.md im Repo-Root.
Git checkpoint: `git add -A && git commit -m "pre-session-custom-types"`

## BESTEHENDE INFRASTRUKTUR
- `#sessionTypeBtns` — Container mit grid-cols-3 (Zeile ~2303 in app.html)
- `_sessionType` Variable in base-pt.min.js — speichert aktiven Typ
- `_sessionQuickPicks` Object — Quick Picks pro Typ
- `window.setSessionType(type)` — wechselt Typ, rendert Quick Picks
- `window._renderSessionQuickPicks()` — zeigt Übungsvorschläge
- CSS in app.html: `#sessionTypeBtns label:has(input:checked)` Regeln

## SCHRITT 1: Grid von 3 auf dynamisch ändern + "+" Button

In app.html, finde den sessionTypeBtns Container (ca. Zeile 2303):
```html
<div class="grid grid-cols-3 gap-2" id="sessionTypeBtns">
```

Ersetze durch:
```html
<div class="flex flex-wrap gap-2" id="sessionTypeBtns">
```

(flex-wrap statt grid — damit die Buttons bei 4-6 Items umbrechen)

Dann füge NACH dem Mobility Label (dem letzten festen Label) und 
VOR dem schließenden `</div>` von sessionTypeBtns ein:

```html
<!-- Custom Session Types (dynamisch) -->
<div id="customSessionTypes" class="contents"></div>
<!-- + Button -->
<button onclick="window.openCustomSessionTypeModal()" id="btnAddSessionType" 
    class="px-3 py-3 rounded-xl border border-dashed border-zinc-700 text-[10px] font-black uppercase tracking-wider cursor-pointer pointer-events-auto flex flex-col items-center gap-1.5 text-center transition-all hover:border-primary/50 hover:text-primary" 
    style="color:#71717a;min-width:80px">
    <i data-lucide="plus" class="w-4 h-4 pointer-events-none"></i>
    <span>Typ</span>
</button>
```

## SCHRITT 2: Custom Session Type Modal

Füge in app.html VOR `</main>` ein:

```html
<!-- Custom Session Type Modal -->
<div id="customSessionTypeModal" class="fixed inset-0 z-[700] hidden items-center justify-center px-4" style="background:rgba(0,0,0,0.85)">
    <div class="card-bg p-6 max-w-sm w-full shadow-2xl relative" style="border-radius:8px;background:#141414;border:1px solid #222">
        <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-black text-white uppercase tracking-tight" style="font-family:'Sora',sans-serif">Neuer Session-Typ</h3>
            <button onclick="window.toggleModal('customSessionTypeModal')" class="text-zinc-500 hover:text-white cursor-pointer pointer-events-auto"><i data-lucide="x" class="w-5 h-5 pointer-events-none"></i></button>
        </div>
        <div class="space-y-4">
            <div>
                <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Name</label>
                <input type="text" id="cstName" placeholder="z.B. Entspannung, Kampfsport..." maxlength="15" class="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm font-bold outline-none focus:border-primary cursor-text pointer-events-auto">
            </div>
            <div>
                <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Icon</label>
                <div id="cstIconPicker" class="grid grid-cols-6 gap-2"></div>
            </div>
            <div>
                <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Übungsvorschläge (kommagetrennt)</label>
                <input type="text" id="cstExercises" placeholder="z.B. Meditation, Atemübung, Yoga..." class="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm font-bold outline-none focus:border-primary cursor-text pointer-events-auto">
                <p class="text-[9px] text-zinc-600 mt-1.5">Oder lass es leer — die KI generiert passende Vorschläge.</p>
            </div>
        </div>
        <div class="flex gap-3 mt-6">
            <button onclick="window.toggleModal('customSessionTypeModal')" class="flex-1 bg-zinc-800 text-zinc-400 font-black py-3.5 rounded-lg uppercase tracking-widest text-xs cursor-pointer pointer-events-auto">Abbrechen</button>
            <button onclick="window.saveCustomSessionType()" id="btnSaveCST" class="flex-1 font-black py-3.5 rounded-lg uppercase tracking-widest text-xs cursor-pointer pointer-events-auto active:scale-95 transition-all" style="background:var(--primary-hex);color:#000">Erstellen</button>
        </div>
    </div>
</div>
```

## SCHRITT 3: JavaScript — Custom Session Type Logik

Füge in app.html am Ende des JS-Blocks (VOR dem letzten `</script>`) hinzu:

```javascript
// ============================================================
// CUSTOM SESSION TYPES für PT Session Planner (max 3)
// ============================================================

var _cstIcons = ['heart','moon','sun','wind','waves','mountain','swords','shield','target','music','brain','leaf'];
var _cstSelectedIcon = 'heart';

window.openCustomSessionTypeModal = function() {
    var existing = JSON.parse(localStorage.getItem('base_pt_custom_session_types') || '[]');
    if (existing.length >= 3) return window.showToast('Maximum 3 eigene Typen');
    
    _cstSelectedIcon = 'heart';
    var n = document.getElementById('cstName');
    var e = document.getElementById('cstExercises');
    if (n) n.value = '';
    if (e) e.value = '';
    
    var picker = document.getElementById('cstIconPicker');
    if (picker) {
        picker.innerHTML = _cstIcons.map(function(icon) {
            var active = icon === _cstSelectedIcon;
            return '<button onclick="window._cstPickIcon(\'' + icon + '\')" class="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer pointer-events-auto transition-all" style="' +
                (active ? 'background:color-mix(in srgb,var(--primary-hex),transparent 80%);border:1px solid color-mix(in srgb,var(--primary-hex),transparent 60%);color:var(--primary-hex)' : 'background:#1a1a1a;border:1px solid #333;color:#71717a') +
                '"><i data-lucide="' + icon + '" class="w-5 h-5 pointer-events-none"></i></button>';
        }).join('');
        if (window.lucide) setTimeout(function() { lucide.createIcons(); }, 50);
    }
    
    window.toggleModal('customSessionTypeModal');
};

window._cstPickIcon = function(icon) {
    _cstSelectedIcon = icon;
    window.openCustomSessionTypeModal();
};

window.saveCustomSessionType = async function() {
    var nameEl = document.getElementById('cstName');
    var exEl = document.getElementById('cstExercises');
    var name = (nameEl && nameEl.value || '').trim();
    var exercises = (exEl && exEl.value || '').trim();
    
    if (!name) return window.showToast('Bitte Name eingeben');
    
    var id = name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 12);
    
    // Quick Picks: manuell oder per KI
    var quickPicks = [];
    if (exercises) {
        quickPicks = exercises.split(',').map(function(e) { return e.trim(); }).filter(function(e) { return e.length > 0; }).slice(0, 10);
    } else {
        // KI generiert Quick Picks
        var btn = document.getElementById('btnSaveCST');
        if (btn) btn.textContent = 'KI generiert...';
        try {
            var prompt = 'Gib mir 10 typische Übungen für die Trainingsart "' + name + '". ' +
                'Antworte NUR mit den Übungsnamen, kommagetrennt, keine Nummerierung, keine Erklärung.';
            var res = await fetch('/.netlify/functions/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            var data = await res.text();
            var parsed = window._parseGeminiResponse ? window._parseGeminiResponse(data) : data;
            quickPicks = parsed.split(',').map(function(e) { return e.trim(); }).filter(function(e) { return e.length > 0 && e.length < 40; }).slice(0, 10);
        } catch(e) {
            quickPicks = [name + ' Übung 1', name + ' Übung 2', name + ' Übung 3'];
        }
        if (btn) btn.textContent = 'Erstellen';
    }
    
    // Speichern
    var existing = JSON.parse(localStorage.getItem('base_pt_custom_session_types') || '[]');
    existing.push({ id: id, name: name, icon: _cstSelectedIcon, quickPicks: quickPicks, createdAt: new Date().toISOString() });
    localStorage.setItem('base_pt_custom_session_types', JSON.stringify(existing));
    
    // Quick Picks registrieren
    if (typeof _sessionQuickPicks !== 'undefined') {
        _sessionQuickPicks[id] = quickPicks;
    }
    
    // UI aktualisieren
    window._renderCustomSessionTypes();
    window.toggleModal('customSessionTypeModal');
    
    // Direkt den neuen Typ auswählen
    setTimeout(function() { window.setSessionType(id); }, 100);
    window.showToast('"' + name + '" erstellt!');
};

window._renderCustomSessionTypes = function() {
    var container = document.getElementById('customSessionTypes');
    var addBtn = document.getElementById('btnAddSessionType');
    if (!container) return;
    
    var types = JSON.parse(localStorage.getItem('base_pt_custom_session_types') || '[]');
    
    container.innerHTML = types.map(function(t) {
        var radioId = 'sessionType_' + t.id;
        return '<label for="' + radioId + '" class="session-type-label px-3 py-3 rounded-xl border border-zinc-800 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1.5 text-center pointer-events-auto" style="background:rgba(24,24,27,1);color:#a1a1aa;min-width:80px">' +
            '<input type="radio" name="sessionTypeRadio" id="' + radioId + '" value="' + t.id + '" onchange="window.setSessionType(\'' + t.id + '\')" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">' +
            '<i data-lucide="' + t.icon + '" class="w-4 h-4 pointer-events-none"></i>' +
            '<span>' + window._escapeHtml(t.name) + '</span>' +
        '</label>';
    }).join('');
    
    // + Button verstecken wenn 3 erreicht
    if (addBtn) addBtn.style.display = types.length >= 3 ? 'none' : 'flex';
    
    // Quick Picks registrieren
    types.forEach(function(t) {
        if (typeof _sessionQuickPicks !== 'undefined') {
            _sessionQuickPicks[t.id] = t.quickPicks || [];
        }
    });
    
    if (window.lucide) setTimeout(function() { lucide.createIcons(); }, 50);
};

// CSS für Custom Session Type (aktiver Zustand)
// Da CSS :has() den value nicht kennt, setzen wir den Style per JS
var _origSetSessionType2 = window.setSessionType;
if (_origSetSessionType2) {
    window.setSessionType = function(e) {
        _origSetSessionType2(e);
        // Custom Types: aktiven Style setzen
        var customTypes = JSON.parse(localStorage.getItem('base_pt_custom_session_types') || '[]');
        customTypes.forEach(function(t) {
            var label = document.querySelector('label[for="sessionType_' + t.id + '"]');
            if (label) {
                if (e === t.id) {
                    label.style.borderColor = 'color-mix(in srgb, var(--primary-hex), transparent 60%)';
                    label.style.background = 'color-mix(in srgb, var(--primary-hex), transparent 90%)';
                    label.style.color = 'var(--primary-hex)';
                } else {
                    label.style.borderColor = '';
                    label.style.background = 'rgba(24,24,27,1)';
                    label.style.color = '#a1a1aa';
                }
            }
        });
    };
}

// Long Press zum Löschen
window._initCSTLongPress = function() {
    var types = JSON.parse(localStorage.getItem('base_pt_custom_session_types') || '[]');
    types.forEach(function(t) {
        var label = document.querySelector('label[for="sessionType_' + t.id + '"]');
        if (!label || label._cstLongPress) return;
        label._cstLongPress = true;
        var timer = null;
        var start = function(ev) {
            timer = setTimeout(function() {
                window.showModal('"' + t.name + '" löschen?', 'Diesen Session-Typ entfernen?', true, function() {
                    var arr = JSON.parse(localStorage.getItem('base_pt_custom_session_types') || '[]');
                    arr = arr.filter(function(x) { return x.id !== t.id; });
                    localStorage.setItem('base_pt_custom_session_types', JSON.stringify(arr));
                    if (typeof _sessionQuickPicks !== 'undefined') delete _sessionQuickPicks[t.id];
                    window._renderCustomSessionTypes();
                    window.setSessionType('kraft');
                    window.showToast('Typ gelöscht');
                });
            }, 700);
        };
        var cancel = function() { if (timer) clearTimeout(timer); timer = null; };
        label.addEventListener('touchstart', start, { passive: true });
        label.addEventListener('touchend', cancel);
        label.addEventListener('touchmove', cancel);
        label.addEventListener('mousedown', start);
        label.addEventListener('mouseup', cancel);
        label.addEventListener('mouseleave', cancel);
    });
};

// Beim Öffnen des Session Modals: Custom Types rendern
var _origOpenSession2 = window.openSessionModal;
if (_origOpenSession2) {
    window.openSessionModal = function(e) {
        _origOpenSession2(e);
        setTimeout(function() {
            window._renderCustomSessionTypes();
            setTimeout(function() { window._initCSTLongPress(); }, 200);
        }, 100);
    };
}

// Beim App-Start: Quick Picks laden
(function() {
    var types = JSON.parse(localStorage.getItem('base_pt_custom_session_types') || '[]');
    types.forEach(function(t) {
        if (typeof _sessionQuickPicks !== 'undefined') {
            _sessionQuickPicks[t.id] = t.quickPicks || [];
        }
    });
})();
```

## SCHRITT 4: Verifizierung

```bash
echo "=== 1. Modal ==="
grep -c "customSessionTypeModal" app.html

echo "=== 2. JS Functions ==="
grep -c "openCustomSessionTypeModal\|saveCustomSessionType\|_renderCustomSessionTypes" app.html

echo "=== 3. + Button ==="
grep -c "btnAddSessionType" app.html

echo "=== 4. Container ==="
grep -c "customSessionTypes" app.html

echo "=== 5. flex-wrap ==="
grep "sessionTypeBtns" app.html | head -1
```

Erwartung: alle > 0, sessionTypeBtns hat flex-wrap.

## SCHRITT 5: Test-Checkliste
- [ ] Session Planner öffnen → "+" Button neben Mobility sichtbar
- [ ] "+" klicken → Modal öffnet sich
- [ ] Name + Icon + Übungen eingeben → "Erstellen"
- [ ] Neuer Typ-Button erscheint neben Mobility
- [ ] Klick auf neuen Typ → Quick Picks wechseln
- [ ] Session mit Custom Typ speichern → funktioniert
- [ ] Session Planner erneut öffnen → Custom Typ noch da
- [ ] Long Press auf Custom Typ → Löschen Dialog
- [ ] Nach 3 Custom Typen → "+" Button verschwindet
- [ ] Kraft/Ausdauer/Mobility weiterhin normal funktionsfähig

Erhöhe SW Cache und deploye: npx netlify deploy --prod

## ROLLBACK
```bash
git checkout -- app.html
```
