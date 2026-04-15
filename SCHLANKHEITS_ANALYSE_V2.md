# BASE APP — UX Schlankheits-Analyse V2
Datum: 2026-04-15
Fokus: Weniger Scrollen, bessere Auffindbarkeit

---

## AUTO-DATEN
- Gesamt Zeilen app.html: 4800
- Modals gesamt: **79**
- Bottom Nav Tabs (Athlet): 5 (Training, Analyse, Tools, Social, Ernährung) + Menü via Header
- Bottom Nav Tabs (PT): 4 (Clients, Plans, PT Tools, My Training)
- KI Tools Tab Buttons: **24 onclick-Handler**
- KI Tools Kategorien: 4 (Training, Analyse & Insights, Tools, Ernährung)
- Ernährungs Sub-Tabs: 5 (Ernährung, Supplemente, Mikros, Wasser, Blut)
- Analyse Tab Widgets: ~15 Container/Charts
- Menü Tab Einträge: ~17 interaktive Elemente

---

## 1. BOTTOM NAVIGATION

### Ist-Zustand
| Tab | Inhalt | Scroll-Tiefe (Zeilen) |
|---|---|---|
| Training (890-1291) | Workout-Form, Table, Timer | 401 |
| Analyse (1291-1611) | Dashboard, Charts, Heatmap, PRs, Muscle Map | 320 |
| Tools (1611-1819) | 24 KI-Buttons in 4 Kategorien | 208 |
| Social (1819-1840) | Feed Tabs (Following/Discover/Routines/Recipes) | 21 |
| Ernährung (1995-~2050) | 5 Sub-Tabs, Supplement Shop | ~55 |
| Menü (1840-1995) | Profil, Goals, Settings, Design, FAQ, Feedback | 155 |

### Befund
- **Social Tab ist fast leer** (21 Zeilen!) — nur Feed-Tabs und ein leerer Container
- **KI Tools Tab ist überladen** — 24 Buttons, User muss endlos scrollen
- **Menü Tab mischt Settings mit Features** — Ziele, Routinen, Ernährungs-Link gehören nicht zu "Einstellungen"

### Empfehlung
- Social + Community-Features (Challenges, Squads) könnten zusammengelegt werden — Social Tab hat Platz
- KI Tools braucht dringend Collapsible-Kategorien oder Sub-Tabs

---

## 2. KI TOOLS TAB — HAUPTPROBLEM

### Ist-Zustand: 24 Buttons in linearer Liste

**Kategorie "Training" (8 Items):**
1. Supplement Shop (prominent, gradient)
2. GPS Tracking (prominent, gradient)
3. KI Coach Chat (prominent, gradient)
4. Scan + Co-Pilot (Split-Button)
5. Form Check
6. 1RM Calculator
7. Plan Generator
8. Plan-Fehler-Check

**Kategorie "Analyse & Insights" (4 Items):**
9. Biologisches Alter
10. Wettkampf-Coach
11. Was-wäre-wenn Planner
12. History Import

**Kategorie "Ernährung" (4 Items):**
13. Supplement-Check (Evidence)
14. Meal Plan Generator
15. Artikel-Analyzer
16. Wochen-Brief

**Kategorie "Tools" (5 Items):**
17. Ernährungsprofil
18. ZNS Readiness Widget
19. Daily Outlook
20. Challenges
21. Squad Goals
22. PreHab / Armor
23. Trainer finden

### Befund
- **24 Buttons = ~7 Bildschirmhöhen scrollen** auf iPhone SE
- Kategorien existieren als Textlabel, aber NICHT collapsible — User sieht trotzdem alles
- "Supplement Shop" ist am ANFANG (vor Training-Tools) — falsche Priorität
- Mischung aus KI-Features, Tracking-Tools und Social Features
- "Ernährungsprofil einrichten" ist hier UND im Menü UND im Ernährungs-Tab (3x)
- GPS Tracking könnte auch direkt im Training-Tab sein

### TOP-EMPFEHLUNG: Collapsible Kategorien
```
[▼ Training]          ← Default offen
   Coach · Co-Pilot · Plan · Plan-Check · 1RM · Form Check · GPS

[► Analyse]           ← Default zu
   Bio-Age · Wettkampf · Was-wäre-wenn · History Import

[► Ernährung]         ← Default zu
   Meal Plan · Supplement-Check · Artikel · Wochen-Brief

[► Community]         ← Default zu
   Challenges · Squad Goals · Trainer finden

[► Recovery]          ← Default zu
   PreHab/Armor · ZNS Readiness · Daily Outlook
```

**Effekt:** Statt 7 Screens Scrollen → 1 Screen mit 5 Kategorien, max 2 Screens bei einer offenen Kategorie.

---

## 3. ANALYSE TAB

### Ist-Zustand: ~15 Widgets
- dashboardSection (Tabelle + Filter)
- viewAnalyticsContainer (Charts: Exercise, Volume)
- prDashboardSection (PR Dashboard)
- muscleSection (Muscle Map)
- monthlySummaryWidget
- weeklyVolumeChart
- volumeLandmarksChart
- periodizationChart
- hrZonesWidget
- planAdherenceWidget
- prTimelineChart
- muscleDistChart
- baseScoreContainer

### Befund
- **Lazy Load existiert** (via `_initLazyAnalyse`) — gut
- Aber ALLE Render-Funktionen feuern gleichzeitig bei Tab-Wechsel (10 Funktionen in Zeile 4262)
- Viele Widgets sind leer wenn keine Daten — verschwendeter Platz
- Sub-Tabs existieren (Tabelle, Diagramme, PRs, Muscle) — das ist gut

### Empfehlung
- Widgets die keine Daten haben → `display:none` statt leerer Container
- Bereits gut strukturiert mit Sub-Tabs — minimaler Handlungsbedarf

---

## 4. MENÜ TAB

### Ist-Zustand: 17 Einträge
1. Profil (Modal)
2. Ernährung (→ Tab-Switch!)
3. Ziele
4. + Ziel setzen
5. Referral/Einlade-Link
6. Einlade-Link teilen
7. Creator Code
8. Module/Widget Store
9. Routinen
10. Design Studio
11. FAQ
12. Feedback
13. Freunde einladen
14. PRO Upgrade
15. Push-Benachrichtigungen
16. Sport-Tipps Toggle
17. Account löschen

### Befund
- **"Ernährung" leitet zum Ernährungs-Tab weiter** — warum ist das im Menü? Es gibt einen Nav-Tab dafür
- **"Ziele" ist ein Feature**, keine Einstellung — gehört eher in den Analyse oder Training Tab
- **3x "Einladen/Teilen"** (Referral-Link, Einlade-Link, Freunde einladen) — Redundanz
- Mischung aus Settings (Design, Push, Sport-Tipps) und Features (Ziele, Routinen, Ernährung)

### Empfehlung
- Ernährungs-Link entfernen (es gibt einen Bottom-Nav Tab)
- Referral/Einladen zusammenlegen zu 1 Button
- Ziele in den Training-Tab oder Analyse-Tab verschieben
- Klare Trennung: **Einstellungen** (oben) vs. **Account** (unten)

---

## 5. ERNÄHRUNG TAB

### Ist-Zustand
- 5 Sub-Tabs: Ernährung, Supplemente, Mikros, Wasser, Blut
- 3 Quick-Actions: Meal Prep, Wochen-Analyse, Mikros
- Supplement Shop Button (oben)
- Nutrition Setup

### Befund
- **Gut strukturiert** — Sub-Tabs verhindern Scrollen
- Supplement Shop Button am Anfang ist prominent genug
- "Mikros" Quick-Action dupliziert den Mikros Sub-Tab
- Blut (Bloodwork) ist sehr nischig — Nutzung wahrscheinlich <1%

### Empfehlung
- Mikros Quick-Action entfernen (redundant mit Sub-Tab)
- Rest ist gut — minimaler Handlungsbedarf

---

## 6. SOCIAL TAB

### Ist-Zustand
- 4 Feed-Tabs: Gefolgte, Entdecken, Routinen, Rezepte
- Rezept-Editor Button
- Live Feed Container (leer)
- Community Placeholder

### Befund
- **Extrem dünn** — nur 21 Zeilen HTML
- Challenges und Squad Goals sind im Tools-Tab versteckt, obwohl sie Social-Features sind
- Live-Share Feed zeigt hier an, aber der Toggle ist nirgends sichtbar

### Empfehlung
- Challenges + Squad Goals in den Social Tab verschieben
- Live-Share Toggle hier sichtbar machen

---

## 7. TOP 5 SOFORT-MASSNAHMEN

### 1. KI Tools Tab: Collapsible Kategorien (GRÖSSTER IMPACT)
24 Buttons → 5 aufklappbare Sektionen. Reduziert initiales Scrollen von ~7 Screens auf 1.

### 2. Social Tab aufwerten
Challenges + Squad Goals vom Tools-Tab hierher verschieben. Social Tab gewinnt Substanz, Tools-Tab verliert 2 Buttons.

### 3. Menü aufräumen
- Ernährungs-Link entfernen (hat eigenen Nav-Tab)
- 3 Einlade-Buttons → 1 zusammenlegen
- "Ziele" zum Training- oder Analyse-Tab verschieben

### 4. Supplement Shop Position optimieren
Im KI-Tools Tab steht der Shop VOR den Training-Tools — falsche Priorität. Supplement Shop ans Ende der "Ernährung"-Kategorie verschieben. Der Nutrition-Tab-Button reicht als prominenter Einstieg.

### 5. Leere Analyse-Widgets ausblenden
Widgets ohne Daten (`innerHTML === '' || textContent === 'Lade...'`) nach Render → `display:none`. Verhindert leere Boxen und reduziert gefühlte Scrolltiefe.

---

## 8. MODALS DIE BOTTOM SHEETS WERDEN SOLLTEN

Aktuell: 79 Modals. Viele davon sind Full-Screen Overlays für kleine Interaktionen.

**Kandidaten für Bottom Sheets (slide-up, max 50vh):**
- `oneRMModal` — kleines Formular, braucht kein Full-Screen
- `goalModal` — Zieleingabe, compact
- `routineSaveModal` — Name + Save
- `exerciseSwapModal` — Liste mit Tap
- `sportPickerModal` — Grid-Auswahl
- `customFoodModal` — Formular
- `bloodworkEntryModal` — Formular
- `pumpSorenessModal` — 2 Slider
- `wkFeedbackModal` — Rating + Text

**Sollten Full-Screen bleiben:**
- `kiChatModal` — braucht Platz für Chat-Verlauf
- `sessionPlannerModal` — komplexes Interface
- `bioAgeModal` — viele Daten
- `gpsTrackingModal` — Live-Tracking Interface
- `trainingPlanModal` — mehrstufiger Wizard

---

## 9. FEATURES DIE VERSTECKT SIND UND PROMINENTER SEIN SOLLTEN

| Feature | Aktueller Ort | Problem | Empfehlung |
|---|---|---|---|
| GPS Tracking | Tools Tab, Position 2 | Nur über Tools erreichbar | Auch im Training-Tab zeigen (z.B. als Toggle neben Sport-Picker) |
| Squad Goals | Tools Tab, Position 21 | Ganz unten, leicht übersehen | In Social Tab verschieben |
| Live-Share | Nirgends sichtbar als Toggle | User weiß nicht dass es existiert | Toggle im Training-Header oder Social Tab |
| Supplement Shop | Tools Tab Position 1 + Nutrition Tab | OK in Nutrition, schlecht in Tools Position 1 | In Tools runter zur Ernährungs-Kategorie |
| Was-wäre-wenn Planner | Tools Tab, Position 11 | Innovatives Feature, aber versteckt | Badge "NEU" hinzufügen |
| Wochen-Brief | Tools Tab, Position 16 | Wertvolles Feature, sehr weit unten | In Analyse-Tab als Banner zeigen |
| Form Check (Kamera) | Tools Tab, Position 5 | Differenzierendes Feature | Prominenter im Training-Tab |

---

## 10. ZUSAMMENFASSUNG

| Metrik | Ist | Soll |
|---|---|---|
| KI Tools Scroll-Tiefe | ~7 Screens | ~1-2 Screens |
| Modals | 79 | 79 (aber 9 als Bottom Sheets) |
| Menü-Einträge | 17 | ~12 |
| Social Tab Substanz | 21 Zeilen | +Challenges +Squads |
| Duplikate (Einladen) | 3 Buttons | 1 Button |
| Duplikate (Ernährung Setup) | 3 Orte | 2 Orte (Nutrition + Menü) |
