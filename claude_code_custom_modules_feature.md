# Claude Code Command: Feature — Custom Module (max. 3 Extra-Kategorien)

## KONTEXT
BASE App. Projektordner: ~/Desktop/Base App V2 Beta/
User können aktuell 4 Kategorien nutzen: Kraft, Ausdauer, Mobility, Mein Sport.
Dieses Feature erlaubt bis zu 3 ZUSÄTZLICHE benutzerdefinierte Module 
(z.B. "Entspannung", "Kampfsport", "Schwimmen") mit eigenem Formular-Schema.

LIES ZUERST die CLAUDE.md im Repo-Root.
Git checkpoint: `git add -A && git commit -m "pre-custom-modules-feature"`

## BESTEHENDE INFRASTRUKTUR (NICHT NEU BAUEN)
- `window.categorySchemas` — speichert Schemas pro Kategorie
- `window.switchCategory(cat)` — wechselt aktive Kategorie
- `window.renderDynamicForm()` — rendert Formular aus Schema
- `window._applyCategoryTheme(cat)` — setzt Farben
- KI Builder (`generateForm()`) — generiert Schema per Gemini API
- Custom Tabs existieren bereits: `renderDynamicSportTabs()` und `_renderCustomTabs()`
- Drag-to-reorder für Tabs existiert bereits: `_applySavedTabOrder()`
- localStorage Key: `beastmode_v2_multi_schemas` — speichert alle Schemas

## WAS ZU BAUEN IST

### 1. "+" Button neben den Kategorie-Pills

In app.html gibt es bereits einen "+" Button (suche `btnCat_main` oder den letzten cat-pill Button).
Prüfe: `grep -n "+" app.html | grep "cat-pill\|addSport\|newModule" | head -5`

Wenn ein "+" Button existiert, nutze ihn. Falls nicht, füge nach dem letzten 
cat-pill Button hinzu:

```html
<button onclick="window.openNewModuleModal()" id="btnAddModule" 
    class="cat-pill flex-shrink-0 cursor-pointer pointer-events-auto flex items-center justify-center w-10 h-10 !p-0" 
    style="border:1px dashed var(--border-hex);color:var(--text-muted)">
    <i data-lucide="plus" class="w-4 h-4 pointer-events-none"></i>
</button>
```

Der Button wird VERSTECKT wenn bereits 3 Custom Module existieren 
(Standard-Kategorien zählen nicht).

### 2. Modal: Neues Modul erstellen

Füge VOR dem schließenden `</main>` Tag in app.html ein neues Modal ein:

```html
<!-- Custom Module Modal -->
<div id="newModuleModal" class="fixed inset-0 z-[600] hidden items-center justify-center px-4" 
    style="background:rgba(0,0,0,0.8)">
    <div class="card-bg p-6 max-w-sm w-full shadow-2xl relative" style="border-radius:var(--ui-radius)">
        <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-black text-white uppercase tracking-tight" 
                style="font-family:'Sora',sans-serif">Neues Modul</h3>
            <button onclick="window.toggleModal('newModuleModal')" 
                class="text-zinc-500 hover:text-white cursor-pointer pointer-events-auto">
                <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
            </button>
        </div>
        
        <div class="space-y-4">
            <div>
                <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    Modul-Name
                </label>
                <input type="text" id="newModuleName" placeholder="z.B. Entspannung, Kampfsport..." 
                    maxlength="20"
                    class="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-bold outline-none focus:border-primary cursor-text pointer-events-auto">
            </div>
            
            <div>
                <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    Icon
                </label>
                <div id="moduleIconPicker" class="grid grid-cols-6 gap-2">
                    <!-- Wird per JS befüllt -->
                </div>
            </div>
            
            <div>
                <label class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    Felder (KI generiert das Formular)
                </label>
                <input type="text" id="newModuleDescription" 
                    placeholder="z.B. Dauer, Technik, Atmung, Bewertung" 
                    class="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-bold outline-none focus:border-primary cursor-text pointer-events-auto">
                <p class="text-[9px] text-zinc-600 mt-1">Beschreibe welche Daten du tracken willst. Die KI baut das Formular.</p>
            </div>
        </div>
        
        <div class="flex gap-3 mt-6">
            <button onclick="window.toggleModal('newModuleModal')" 
                class="flex-1 bg-zinc-800 text-zinc-400 font-black py-3.5 rounded-xl uppercase tracking-widest text-xs cursor-pointer pointer-events-auto">
                Abbrechen
            </button>
            <button onclick="window.createCustomModule()" id="btnCreateModule"
                class="flex-1 bg-primary text-black font-black py-3.5 rounded-xl uppercase tracking-widest text-xs cursor-pointer pointer-events-auto active:scale-95 transition-all">
                Erstellen
            </button>
        </div>
    </div>
</div>
```

### 3. JavaScript — Custom Module Logik

Füge in app.html (am Ende des JS-Blocks, VOR den letzten `</script>` Tags) hinzu:

```javascript
// ============================================================
// CUSTOM MODULE SYSTEM (max 3 extra Kategorien)
// ============================================================

const MODULE_ICONS = [
    'heart', 'moon', 'sun', 'wind', 'waves', 'mountain',
    'swords', 'shield', 'target', 'music', 'brain', 'leaf',
    'flame', 'snowflake', 'cloud', 'compass', 'anchor', 'star'
];
let _selectedModuleIcon = 'heart';

window.openNewModuleModal = function() {
    // Prüfe Limit
    const existing = JSON.parse(localStorage.getItem('base_custom_modules') || '[]');
    if (existing.length >= 3) {
        window.showToast('Maximum 3 eigene Module erlaubt');
        return;
    }
    
    // Icon Picker rendern
    const picker = document.getElementById('moduleIconPicker');
    if (picker) {
        picker.innerHTML = MODULE_ICONS.map(icon => 
            `<button onclick="window._selectModuleIcon('${icon}')" 
                class="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer pointer-events-auto transition-all ${icon === _selectedModuleIcon ? 'bg-primary/20 border border-primary/30' : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'}"
                style="color:${icon === _selectedModuleIcon ? 'var(--primary-hex)' : '#71717a'}">
                <i data-lucide="${icon}" class="w-5 h-5 pointer-events-none"></i>
            </button>`
        ).join('');
        if (window.lucide) lucide.createIcons();
    }
    
    // Reset
    const nameInput = document.getElementById('newModuleName');
    const descInput = document.getElementById('newModuleDescription');
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    _selectedModuleIcon = 'heart';
    
    window.toggleModal('newModuleModal');
};

window._selectModuleIcon = function(icon) {
    _selectedModuleIcon = icon;
    window.openNewModuleModal(); // Re-render picker
};

window.createCustomModule = async function() {
    const nameInput = document.getElementById('newModuleName');
    const descInput = document.getElementById('newModuleDescription');
    const name = (nameInput?.value || '').trim();
    const desc = (descInput?.value || '').trim();
    
    if (!name) return window.showToast('Bitte einen Namen eingeben');
    if (name.length > 20) return window.showToast('Name max. 20 Zeichen');
    
    // Eindeutige ID aus Name
    const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15) + '_' + Date.now().toString(36);
    
    // Schema per KI generieren lassen (falls Beschreibung vorhanden)
    let schema = [];
    const btn = document.getElementById('btnCreateModule');
    
    if (desc) {
        // KI generiert Schema
        if (btn) btn.textContent = '⏳ KI generiert...';
        try {
            const prompt = `Erstelle ein JSON-Array mit Formularfeldern für die Sportart "${name}". 
                Gewünschte Felder: ${desc}. 
                Format: [{"id":"feldname","label":"Anzeigename","type":"number|text","placeholder":"z.B. ..."}]
                Maximal 6 Felder. Antworte NUR mit dem JSON-Array.`;
            
            const res = await fetch('/.netlify/functions/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await res.text();
            const parsed = window._parseGeminiResponse(data);
            const cleaned = parsed.replace(/```json|```/g, '').trim();
            schema = JSON.parse(cleaned);
            if (!Array.isArray(schema)) schema = [];
        } catch(e) {
            console.error('KI Schema Fehler:', e);
            // Fallback: einfaches Schema
            schema = [
                { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: 'z.B. 30' },
                { id: 'notizen', label: 'Notizen', type: 'text', placeholder: 'z.B. Fokus, Technik...' }
            ];
        }
    } else {
        // Default Schema ohne KI
        schema = [
            { id: 'dauer', label: 'Dauer (min)', type: 'number', placeholder: 'z.B. 30' },
            { id: 'intensitaet', label: 'Intensität (1-10)', type: 'number', placeholder: 'z.B. 7' },
            { id: 'notizen', label: 'Notizen', type: 'text', placeholder: 'Anmerkungen...' }
        ];
    }
    
    // Modul speichern
    const existing = JSON.parse(localStorage.getItem('base_custom_modules') || '[]');
    existing.push({
        id: id,
        name: name,
        icon: _selectedModuleIcon,
        schema: schema,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('base_custom_modules', JSON.stringify(existing));
    
    // Schema in categorySchemas registrieren
    window.categorySchemas[id] = {
        sportName: name,
        schema: schema
    };
    
    // In multi_schemas speichern (Persistenz)
    const multiSchemas = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas') || '{}');
    multiSchemas[id] = { sportName: name, schema: schema };
    localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(multiSchemas));
    
    // CAT_UI für neues Modul registrieren
    window.CAT_UI[id] = {
        name: name,
        icon: _selectedModuleIcon,
        color: 'text-amber-400', // Mein Sport Farbe
        border: 'border-amber-400',
        bg: 'bg-amber-400/20'
    };
    
    // ZEN_COLORS für neues Modul (Warm Gold wie Mein Sport)
    // Die _applyCategoryTheme nutzt ZEN_COLORS — aber die ist lokal in der Funktion.
    // Wir setzen den Fallback auf 'main' Farbe, das reicht.
    
    // Tab hinzufügen und wechseln
    window._renderCustomModuleTabs();
    window._updateAddModuleButton();
    window.toggleModal('newModuleModal');
    window.switchCategory(id);
    window.showToast(`"${name}" erstellt!`);
    
    if (btn) btn.textContent = 'Erstellen';
    if (window.lucide) lucide.createIcons();
};

// Custom Module Tabs rendern (nach Standard-Tabs)
window._renderCustomModuleTabs = function() {
    const modules = JSON.parse(localStorage.getItem('base_custom_modules') || '[]');
    
    // Entferne alte custom module tabs
    document.querySelectorAll('.custom-module-tab').forEach(el => el.remove());
    
    const addBtn = document.getElementById('btnAddModule');
    const container = addBtn?.parentElement;
    if (!container) return;
    
    modules.forEach(mod => {
        // Prüfe ob Tab schon existiert (von renderDynamicSportTabs)
        if (document.getElementById('btnCat_' + mod.id)) return;
        
        const btn = document.createElement('button');
        btn.id = 'btnCat_' + mod.id;
        btn.className = 'cat-pill custom-module-tab flex-shrink-0 cursor-pointer pointer-events-auto';
        btn.setAttribute('onclick', `window.switchCategory('${mod.id}')`);
        btn.innerHTML = `<i data-lucide="${mod.icon}" class="w-3.5 h-3.5 pointer-events-none"></i> ${mod.name}`;
        
        // VOR dem + Button einfügen
        container.insertBefore(btn, addBtn);
    });
    
    if (window.lucide) lucide.createIcons();
};

// + Button Sichtbarkeit
window._updateAddModuleButton = function() {
    const modules = JSON.parse(localStorage.getItem('base_custom_modules') || '[]');
    const btn = document.getElementById('btnAddModule');
    if (btn) {
        btn.style.display = modules.length >= 3 ? 'none' : 'flex';
    }
};

// Custom Module löschen (Long Press auf Tab → Option)
window.deleteCustomModule = function(moduleId) {
    window.showModal('Modul löschen?', 'Dieses Modul und alle zugehörigen Daten werden gelöscht.', true, () => {
        // Aus localStorage entfernen
        let modules = JSON.parse(localStorage.getItem('base_custom_modules') || '[]');
        modules = modules.filter(m => m.id !== moduleId);
        localStorage.setItem('base_custom_modules', JSON.stringify(modules));
        
        // Aus categorySchemas entfernen
        delete window.categorySchemas[moduleId];
        
        // Aus multi_schemas entfernen
        const multiSchemas = JSON.parse(localStorage.getItem('beastmode_v2_multi_schemas') || '{}');
        delete multiSchemas[moduleId];
        localStorage.setItem('beastmode_v2_multi_schemas', JSON.stringify(multiSchemas));
        
        // Tab entfernen
        const tab = document.getElementById('btnCat_' + moduleId);
        if (tab) tab.remove();
        
        // Zurück zu Kraft
        window.switchCategory('strength');
        window._updateAddModuleButton();
        window.showToast('Modul gelöscht');
    });
};

// Long Press Handler für Tab-Reorder und Löschen
window._initTabLongPress = function() {
    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(pill => {
        let timer = null;
        const startPress = (e) => {
            timer = setTimeout(() => {
                const catId = pill.id?.replace('btnCat_', '');
                if (!catId) return;
                
                // Custom Module → Löschen anbieten
                const modules = JSON.parse(localStorage.getItem('base_custom_modules') || '[]');
                const isCust = modules.find(m => m.id === catId);
                
                if (isCust) {
                    window.showModal(
                        isCust.name,
                        'Was möchtest du tun?',
                        true,
                        () => window.deleteCustomModule(catId)
                    );
                    const confirmBtn = document.getElementById('modalBtnConfirm');
                    if (confirmBtn) confirmBtn.textContent = 'Modul löschen';
                }
            }, 600);
        };
        const cancelPress = () => { if (timer) clearTimeout(timer); timer = null; };
        
        pill.addEventListener('touchstart', startPress, { passive: true });
        pill.addEventListener('touchend', cancelPress);
        pill.addEventListener('touchmove', cancelPress);
        pill.addEventListener('mousedown', startPress);
        pill.addEventListener('mouseup', cancelPress);
        pill.addEventListener('mouseleave', cancelPress);
    });
};

// Beim App-Start: Custom Module laden
window._initCustomModules = function() {
    const modules = JSON.parse(localStorage.getItem('base_custom_modules') || '[]');
    
    // Schemas registrieren
    modules.forEach(mod => {
        if (!window.categorySchemas[mod.id]) {
            window.categorySchemas[mod.id] = {
                sportName: mod.name,
                schema: mod.schema
            };
        }
        if (!window.CAT_UI[mod.id]) {
            window.CAT_UI[mod.id] = {
                name: mod.name,
                icon: mod.icon,
                color: 'text-amber-400',
                border: 'border-amber-400',
                bg: 'bg-amber-400/20'
            };
        }
    });
    
    // Tabs rendern
    window._renderCustomModuleTabs();
    window._updateAddModuleButton();
    
    // Long Press initialisieren (nach kurzer Verzögerung für DOM)
    setTimeout(() => window._initTabLongPress(), 500);
};
```

### 4. Init-Aufruf beim App-Start

Finde die Stelle in app.html wo die App initialisiert wird — 
suche nach `window.checkFirstWorkoutBanner` oder dem Block der 
nach dem Laden aufgerufen wird (ca. Zeile 3095).

Füge DIREKT DANACH ein:

```javascript
if (window._initCustomModules) window._initCustomModules();
```

### 5. _applyCategoryTheme Fallback für Custom Module

In der `_applyCategoryTheme` Funktion gibt es `ZEN_COLORS` mit 
strength/cardio/recovery/main. Custom Module werden dort nicht 
gefunden und fallen auf 'strength' zurück.

Finde: `var hex = ZEN_COLORS[cat] || ZEN_COLORS['strength'];`
Ersetze durch: `var hex = ZEN_COLORS[cat] || ZEN_COLORS['main'];`

Dadurch bekommen Custom Module automatisch die Warm Gold Farbe (#d4b896).

### 6. Verifizierung

```bash
echo "=== Modal exists ==="
grep -c "newModuleModal" app.html

echo "=== JS functions ==="
grep -c "createCustomModule\|openNewModuleModal\|_initCustomModules" app.html

echo "=== Init call ==="
grep -c "_initCustomModules" app.html

echo "=== ZEN_COLORS fallback ==="
grep "ZEN_COLORS\[cat\]" app.html

# Erwartung: >0, >0, >1 (Definition + Aufruf), 'main' nicht 'strength'
```

### 7. Test-Checkliste
- [ ] "+" Button sichtbar neben den Kategorie-Pills
- [ ] Klick auf "+" öffnet das Modal
- [ ] Name eingeben + Icon wählen + "Erstellen" klicken
- [ ] Neues Modul erscheint als Tab
- [ ] Klick auf neuen Tab zeigt das generierte Formular
- [ ] Daten eingeben und Speichern → Workout erscheint in History
- [ ] Seite neu laden → Custom Module Tab ist noch da
- [ ] Long Press auf Custom Tab → "Modul löschen" Option
- [ ] Nach 3 Custom Modulen: "+" Button verschwindet
- [ ] Standard-Tabs (Kraft/Ausdauer/Mobility/Mein Sport) unverändert

## ROLLBACK
```bash
git checkout -- app.html design-override.css
```
