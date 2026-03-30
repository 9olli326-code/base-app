# Claude Code Command: Feature — Progressive KI Discovery (Kontextuelles KI-Onboarding)

## KONTEXT
BASE App. Projektordner: ~/Desktop/Base App V2 Beta/
Die KI-Features (AI Coach, 1RM Rechner, Trainingsplan, ZNS Readiness, Pre-Hab) sind
der wichtigste USP der App, aber User wissen nicht was sie damit anfangen sollen.
Statt eines klassischen Onboarding-Modals bauen wir Progressive Discovery:
KI-Features erklären sich genau dann, wenn der User sie zum ersten Mal braucht.

LIES ZUERST die CLAUDE.md im Repo-Root.
Git checkpoint: `git add -A && git commit -m "pre-ki-discovery-feature"`

## BESTEHENDE INFRASTRUKTUR
- `window.showToast(msg, type, actionLabel, actionCallback, duration)` — Toast mit Action-Button
- `window.showModal(title, text, confirmable, callback)` — Confirm Modal
- `localStorage.getItem/setItem` — Persistenz für Flags
- `window.workouts` Array — alle Workouts
- `window.switchTab('tools')` — Tab wechseln
- `window.analyzeWithAI()` — AI Coach starten
- `window.openTrainingPlanModal()` — Trainingsplan öffnen
- `window.analyzeReadinessWithAI()` — ZNS analysieren

## DESIGN-PRINZIP
- Keine Modals die blocken
- Dezente, hübsche Hint-Cards die im Flow erscheinen
- Jeder Hint wird NUR EINMAL gezeigt (localStorage Flag)
- User kann Hint wegklicken (dismissbar)
- Timing basiert auf echten Milestones (Workout-Count, Tab-Besuche)
- Zen Flow Styling (Sage Green, Sora Font, subtiler Glow)

## SCHRITT 1: Hint-Card Komponente (CSS + JS)

Füge in design-override.css hinzu:

```css
/* ══════════════════════════════════════════════════════════
   KI Discovery — Kontextuelle Hint Cards
   ══════════════════════════════════════════════════════════ */
.ki-hint {
    background: color-mix(in srgb, var(--primary-hex), transparent 92%);
    border: 1px solid color-mix(in srgb, var(--primary-hex), transparent 80%);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
    position: relative;
    animation: kiHintIn 0.4s ease-out;
    overflow: hidden;
}
.ki-hint::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--primary-hex), transparent);
    opacity: 0.4;
}
.ki-hint-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--primary-hex), transparent 85%);
    border: 1px solid color-mix(in srgb, var(--primary-hex), transparent 75%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--primary-hex);
}
.ki-hint-title {
    font-family: var(--ui-font-heading), 'Sora', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main, #fff);
    margin-bottom: 4px;
}
.ki-hint-text {
    font-family: var(--ui-font-body), 'Outfit', sans-serif;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.5;
}
.ki-hint-action {
    font-family: var(--ui-font-body), 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--primary-hex);
    background: color-mix(in srgb, var(--primary-hex), transparent 85%);
    border: 1px solid color-mix(in srgb, var(--primary-hex), transparent 75%);
    padding: 8px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.ki-hint-action:hover {
    background: color-mix(in srgb, var(--primary-hex), transparent 75%);
}
.ki-hint-dismiss {
    position: absolute;
    top: 12px;
    right: 12px;
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
}
.ki-hint-dismiss:hover {
    opacity: 1;
}
@keyframes kiHintIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
}
```

## SCHRITT 2: Discovery Engine (JavaScript)

Füge in app.html am Ende des JS-Blocks (VOR dem letzten `</script>`) hinzu:

```javascript
// ============================================================
// PROGRESSIVE KI DISCOVERY — Kontextuelles Onboarding
// ============================================================

window._kiDiscovery = {
    // Hint-Definitionen: wann, wo, was
    hints: {
        ai_coach_first: {
            trigger: 'workout_count_1',
            target: 'training',           // In welchem Tab erscheint der Hint
            insertBefore: 'formRevealWrapper',  // Vor welchem Element
            icon: 'sparkles',
            title: 'Dein KI Coach ist bereit',
            text: 'Du hast dein erstes Workout gespeichert! Der AI Coach kann jetzt deine Technik und Progression analysieren.',
            actionText: 'Coach starten',
            action: function() { window.switchTab('tools'); setTimeout(function() { window.analyzeWithAI(); }, 300); },
            flag: 'base_ki_hint_coach'
        },
        training_plan: {
            trigger: 'workout_count_3',
            target: 'training',
            insertBefore: 'formRevealWrapper',
            icon: 'calendar-days',
            title: 'KI Trainingsplan verfügbar',
            text: 'Mit 3+ Workouts hat die KI genug Daten, um dir einen periodisierten Trainingsplan zu erstellen — angepasst an deine Stärken.',
            actionText: 'Plan erstellen',
            action: function() { window.switchTab('tools'); setTimeout(function() { window.openTrainingPlanModal(); }, 300); },
            flag: 'base_ki_hint_plan'
        },
        zns_readiness: {
            trigger: 'workout_count_5',
            target: 'training',
            insertBefore: 'formRevealWrapper',
            icon: 'battery-charging',
            title: 'ZNS Readiness freigeschaltet',
            text: 'Dein Nervensystem braucht Erholung zwischen harten Sessions. BASE misst deine Recovery — damit du weißt wann du Gas geben kannst.',
            actionText: 'Readiness checken',
            action: function() { window.switchTab('tools'); setTimeout(function() { window.analyzeReadinessWithAI(); }, 300); },
            flag: 'base_ki_hint_zns'
        },
        prehab: {
            trigger: 'workout_count_7',
            target: 'training',
            insertBefore: 'formRevealWrapper',
            icon: 'shield-plus',
            title: 'Pre-Hab: Verletzungen vorbeugen',
            text: 'Die KI analysiert deine Trainingsmuster und erstellt ein personalisiertes Aufwärmprogramm — damit du verletzungsfrei bleibst.',
            actionText: 'Pre-Hab starten',
            action: function() { window.generatePreHab(); },
            flag: 'base_ki_hint_prehab'
        },
        tools_overview: {
            trigger: 'first_tools_visit',
            target: 'tools',
            insertBefore: null,            // Am Anfang des Tab-Inhalts
            icon: 'wand-2',
            title: '5 KI-Werkzeuge für dein Training',
            text: 'AI Coach analysiert Progression • Trainingsplan per KI generieren • 1RM Maximalkraft berechnen • ZNS Recovery messen • Pre-Hab Verletzungsprävention',
            actionText: null,              // Kein Action Button, nur Info
            action: null,
            flag: 'base_ki_hint_tools_overview'
        },
        copilot: {
            trigger: 'workout_count_10',
            target: 'training',
            insertBefore: 'formRevealWrapper',
            icon: 'bot',
            title: 'KI Co-Pilot freigeschaltet',
            text: 'Du trainierst regelmäßig — der Co-Pilot kann jetzt live Empfehlungen geben: Gewicht erhöhen? Sätze anpassen? Pause verlängern?',
            actionText: 'Co-Pilot testen',
            action: function() { window.switchTab('tools'); setTimeout(function() { window.triggerCopilot(); }, 300); },
            flag: 'base_ki_hint_copilot'
        }
    },

    // Hint-Card HTML generieren
    createHintCard: function(hint, hintKey) {
        var card = document.createElement('div');
        card.className = 'ki-hint';
        card.id = 'kiHint_' + hintKey;
        card.innerHTML = 
            '<button onclick="window._kiDiscovery.dismiss(\'' + hintKey + '\')" class="ki-hint-dismiss pointer-events-auto">' +
                '<i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>' +
            '</button>' +
            '<div class="flex items-start gap-3">' +
                '<div class="ki-hint-icon">' +
                    '<i data-lucide="' + hint.icon + '" class="w-5 h-5 pointer-events-none"></i>' +
                '</div>' +
                '<div class="flex-1">' +
                    '<p class="ki-hint-title">' + hint.title + '</p>' +
                    '<p class="ki-hint-text">' + hint.text + '</p>' +
                    (hint.actionText ? 
                        '<button onclick="window._kiDiscovery.action(\'' + hintKey + '\')" class="ki-hint-action mt-3 pointer-events-auto">' +
                            '<i data-lucide="' + hint.icon + '" class="w-3.5 h-3.5 inline-block mr-1.5 pointer-events-none" style="vertical-align:-2px"></i>' +
                            hint.actionText +
                        '</button>' : '') +
                '</div>' +
            '</div>';
        return card;
    },

    // Hint anzeigen
    show: function(hintKey) {
        var hint = this.hints[hintKey];
        if (!hint) return;
        
        // Schon gesehen?
        if (localStorage.getItem(hint.flag)) return;
        
        // Schon im DOM?
        if (document.getElementById('kiHint_' + hintKey)) return;
        
        var card = this.createHintCard(hint, hintKey);
        
        if (hint.insertBefore) {
            var target = document.getElementById(hint.insertBefore);
            if (target && target.parentNode) {
                target.parentNode.insertBefore(card, target);
            }
        } else {
            // Am Anfang des Tab-Inhalts
            var tab = document.getElementById('tab-' + hint.target);
            if (tab) {
                var firstChild = tab.querySelector('.space-y-3') || tab.firstElementChild;
                if (firstChild) {
                    firstChild.insertBefore(card, firstChild.firstChild);
                }
            }
        }
        
        if (window.lucide) lucide.createIcons();
    },

    // Hint wegklicken
    dismiss: function(hintKey) {
        var hint = this.hints[hintKey];
        if (hint) localStorage.setItem(hint.flag, '1');
        var el = document.getElementById('kiHint_' + hintKey);
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(-8px)';
            el.style.transition = 'all 0.3s ease';
            setTimeout(function() { el.remove(); }, 300);
        }
    },

    // Action ausführen + Hint dismissn
    action: function(hintKey) {
        var hint = this.hints[hintKey];
        if (hint) {
            localStorage.setItem(hint.flag, '1');
            if (typeof hint.action === 'function') hint.action();
            var el = document.getElementById('kiHint_' + hintKey);
            if (el) el.remove();
        }
    },

    // Check welche Hints gezeigt werden sollen
    check: function() {
        if (!Array.isArray(window.workouts)) return;
        
        var archivedCount = window.workouts.filter(function(w) { return w.archived; }).length;
        var totalCount = window.workouts.length;
        var count = Math.max(archivedCount, totalCount);
        
        // Workout-basierte Triggers
        if (count >= 1) this.show('ai_coach_first');
        if (count >= 3) this.show('training_plan');
        if (count >= 5) this.show('zns_readiness');
        if (count >= 7) this.show('prehab');
        if (count >= 10) this.show('copilot');
    },

    // Erster Besuch des KI Tools Tab
    checkToolsTab: function() {
        if (!localStorage.getItem('base_ki_hint_tools_overview')) {
            this.show('tools_overview');
        }
    }
};
```

## SCHRITT 3: Trigger-Punkte einbauen

### 3a. Nach jedem Workout-Speichern

Finde in app.html die Funktion `saveWorkout` (ca. Zeile 3226).
Am ENDE der Funktion (nach dem letzten Toast/PR-Celebration, vor `}`), füge ein:

```javascript
// KI Discovery Check
setTimeout(function() { if (window._kiDiscovery) window._kiDiscovery.check(); }, 2000);
```

VERIFIZIERE: `grep -c "_kiDiscovery.check" app.html` — muss mindestens 1 sein.

### 3b. Beim App-Start (nach Workouts geladen)

Finde die Stelle wo Workouts geladen werden und renderTable() aufgerufen wird 
(ca. Zeile 3095, nach `window.renderTableFilters()`).

Füge DANACH ein:

```javascript
// KI Discovery: Hints nach Workout-Count prüfen
setTimeout(function() { if (window._kiDiscovery) window._kiDiscovery.check(); }, 1500);
```

### 3c. Beim Tab-Wechsel zu KI Tools

Finde `window.switchTab = function(tab)` (ca. Zeile 3113).
Am ENDE der Funktion, VOR dem schließenden `}`, füge ein:

```javascript
// KI Discovery: Tools Tab Hint
if (tab === 'tools' && window._kiDiscovery) {
    window._kiDiscovery.checkToolsTab();
}
```

### 3d. Nach Workout archivieren (Beenden)

Finde `window.archiveWorkouts` (ca. Zeile 3326).
In der Callback-Funktion, nach `window.showToast("Workout archiviert!")`, füge ein:

```javascript
setTimeout(function() { if (window._kiDiscovery) window._kiDiscovery.check(); }, 3000);
```

## SCHRITT 4: Verifizierung

```bash
echo "=== 1. CSS Hint Styles ==="
grep -c "ki-hint" design-override.css

echo "=== 2. Discovery Engine ==="
grep -c "_kiDiscovery" app.html

echo "=== 3. Trigger: saveWorkout ==="
grep -c "kiDiscovery.check" app.html

echo "=== 4. Trigger: switchTab tools ==="
grep -c "checkToolsTab" app.html

echo "=== 5. Hint definitions ==="
grep "flag:" app.html | wc -l

echo "=== 6. localStorage flags ==="
grep -o "base_ki_hint_[a-z_]*" app.html | sort -u

# Erwartung: >0, >5, >=2, >=1, 6, 6 unique flags
```

## SCHRITT 5: Test-Checkliste

- [ ] Frischen Browser öffnen (Incognito) → App laden
- [ ] 1. Workout speichern → nach 2 Sek erscheint "Dein KI Coach ist bereit" Hint im Training Tab
- [ ] Hint hat X-Button → Klick → Hint verschwindet mit Animation
- [ ] Seite neu laden → Hint kommt NICHT wieder (localStorage Flag)
- [ ] 3 Workouts speichern → "KI Trainingsplan verfügbar" Hint
- [ ] "Plan erstellen" klicken → wechselt zu KI Tools Tab und öffnet Modal
- [ ] KI Tools Tab öffnen (erstes Mal) → "5 KI-Werkzeuge" Übersicht Hint
- [ ] 5 Workouts → ZNS Hint, 7 → Pre-Hab Hint, 10 → Co-Pilot Hint
- [ ] KEIN Hint blockt die UI — alle sind dismissbar
- [ ] Hints respektieren das Zen Flow Design (Sage Green, Sora Font)

## ROLLBACK
```bash
git checkout -- app.html design-override.css
```

## NOTIZEN FÜR DIE ZUKUNFT
- Hints können per A/B Test getauscht werden (anderer Text, anderer Trigger-Count)
- Analytics: Tracke welche Hints geklickt vs. dismissed werden → localStorage
- Potentielle weitere Hints: "Brag Card teilen nach PR", "Strava verbinden nach 5 Cardio", "PT Modus nach 20 Workouts"
- Die Flag-Prefix `base_ki_hint_` macht es einfach alle per Regex zu resetten für Tests
