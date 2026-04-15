# BASE APP — TIEFENANALYSE V3
**Datum:** 2026-04-13
**Analysiert:** app-core.js (11.270 LOC), base-pt.js (4.326), base-ai.js (1.310), base-settings.js (786), firebase-init.js (678), gemini.js (360), nutritionix.js (116), app.html (4.310), sw.js (195)
**Gesamt:** 23.351 LOC (ohne min-Files)

---

## EXECUTIVE SUMMARY

**Gesamt-Score: 8.4/10** (V2: 7.0/10, Delta: +1.4)

### Top 5 Findings
1. **Nutrition System vollstaendig** — 8 Phasen deployed (Food Log, Rezepte, Supplemente, Mikros, Water, Bloodwork, PT Nutrition, Training-Sync). Einzigartiger USP: Keine andere App verbindet Training + Nutrition + KI kontextbasiert.
2. **KI-Kontext-Tiefe exzellent** — Coach Chat erhaelt: Profil, Workouts, Habits, Meso-Plan, Nutrition (heutige Makros + Supplemente + Allergien), Recovery, ACWR. 9 Datenquellen.
3. **ISSN-Wissenschaft im KI-Prompt** — 13 Referenzen (Schoenfeld, Morton, Areta, Kerksick, Burke, Snijders). Halluzinations-Praevention aktiv. "30-min Anabolic Window" explizit als widerlegt markiert.
4. **Security solide** — _escapeHtml 231x verwendet, _sanitizeAIHtml fuer KI-Output, CORS auf Origin begrenzt, Toast-Debounce gegen Spam, Cloud-Fehler nur bei !navigator.onLine.
5. **PT Mode vollstaendig** — Ernaehrungs-Coach, 7-Tage Meal Plan Generator, Compliance Rings, Check-In, Creator Codes, LexOffice Rechnungen, Workout Delivery.

---

## SCORES PRO BEREICH

| Bereich | V2 Score | V3 Score | Delta | Status |
|---------|:--------:|:--------:|:-----:|--------|
| Training-Kern | 7 | 8 | +1 | Input-Bugs gefixt, Komma-Handling, Superset |
| KI-Tiefe | 8 | 9 | +1 | Nutrition-Kontext, ISSN-Direktiven, 28 KI-Calls |
| Nutrition | N/A | 9 | NEW | 8 Phasen, 55 Funktionen, wissenschaftlich fundiert |
| PT Mode | 7 | 8.5 | +1.5 | Ernaehrungs-Coach, Meal Plan Gen, Chat History |
| Analytics | 7 | 8.5 | +1.5 | ACWR validiert, Enhanced Correlations, Mikro-Analyse |
| Social | 5 | 7 | +2 | Rezepte Feed, Community Recipes, Follow/Like |
| Security | 6 | 8 | +2 | Cloud Toast fix, Debounce, Online-Check |
| Code-Qualitaet | 6 | 7 | +1 | 10 Min-Files, SW v227, aber Dateien sehr gross |
| Sport-Tiefe | 8 | 8 | 0 | Unveraendert — 86 Sportarten, HR-Zonen, Strava |
| UX | 8 | 8.5 | +0.5 | 574 pointer-events-auto, 484 aria-labels, Skeletons |
| **GESAMT** | **7.0** | **8.4** | **+1.4** | |

---

## BLOCK 1: TRAINING-KERN (8/10)

### 1.1 WDH/KG Input-Bugs
**Status:** FIXED
- Komma-zu-Punkt Fix: 23 Stellen mit `.replace(',','.')`
- `inputmode="decimal"` auf 21 Inputs (3 in JS, 18 in HTML)
- `-webkit-text-fill-color` Fix in design-override.css
- Buttons 44px -> 36px, overflow:hidden entfernt

### 1.2 Set-Typen
**Implementiert:** Normal, Warmup, Drop-Set, Failure (16 Referenzen)
**Fehlt:** Myo-Reps, Cluster Sets, Partials, Forced Reps
**Bewertung:** 7/10

### 1.3 Superset
**Status:** IMPLEMENTIERT (12 Referenzen)

### 1.4 Voice Coach
**Status:** AKTIV (48 Referenzen)
**Bewertung:** 8/10

### 1.5 Routinen
**Status:** IMPLEMENTIERT (10 Funktionen)

---

## BLOCK 2: KI-FEATURES (9/10)

### 2.1 Coach Chat — Kontext-Vollstaendigkeit
**Vorhanden im Kontext:**
- [x] Profil (Gewicht, Alter, Groesse, Erfahrung)
- [x] Letzte 20 Workouts mit allen Set-Details
- [x] Habits (Schlaf, Wasser, Schritte, Stimmung)
- [x] Active Plan / Mesozyklus-Phase + Woche + RIR
- [x] Heutige Ernaehrung (Kalorien/Makros vs Ziele)
- [x] Genommene Supplemente
- [x] Verletzungen + medizinische Hinweise
- [x] Allergien als HARD Constraint
- [x] Readiness Score (ZNS)
- [x] ACWR Status
- [x] Muskel-Recovery V3 (Bereit/Erschoepft)

**KI-Kontext Score:** 9.5/10
**Einziges Gap:** Blutwerte fliessen noch nicht in Coach-Kontext

### 2.2 Gemini 2.5 Flash — parts Iteration
**Status:** KORREKT
```js
for(const part of parts){if(part.text) t=part.text;}
```
Iteriert alle Parts, nimmt letzten text-Part. Korrekt fuer Thinking Models.

### 2.3 ISSN-Direktiven
**Vorhanden:** 13 Referenzen in gemini.js
- Schoenfeld & Aragon (Protein Timing)
- Morton 2018 (Protein dose response)
- Areta 2013 (MPS-Refraktaerperiode)
- Kerksick 2017 (Nutrient Timing)
- Snijders 2015 (Pre-Sleep Casein)
- Burke (Carb Periodisation)
- Halluzinations-Praevention: 5 Checks

### 2.4 Scan (Progressionsanalyse)
**Datentiefe:** Alle Set-Details, Volumen-Trend, PR-Erkennung, Plateau-Detektion, Custom-Felder
**Score:** 9/10

### 2.5 Battery (Readiness)
**Datentiefe:** ZNS-Score, letzte 7 Tage Workouts, RPE/RIR Trends, Muskel-Recovery
**Score:** 8/10

### 2.6 Daily Outlook
**Status:** AKTIV (10 Referenzen, generiert morgens 6-12 Uhr)
**Score:** 8/10

### 2.7 KI-Calls Gesamt
**28 fetch-Calls** zu Gemini (15 app-core, 9 base-pt, 4 base-ai)

---

## BLOCK 3: NUTRITION SYSTEM (9/10)

### Phasen-Vollstaendigkeit

| Phase | Feature | Status | Funktionen | Tiefe |
|-------|---------|:------:|:----------:|:-----:|
| 1 | Wissenschaftliche KI-Basis | DEPLOYED | 10 | 9/10 |
| 2 | Food Logging + Donut Dashboard | DEPLOYED | 22 | 9/10 |
| 3 | Rezepte + Social Sharing | DEPLOYED | 16 | 8/10 |
| 4 | Supplement Tracking + Push | DEPLOYED | 9 | 9/10 |
| 5 | Mikronaehrstoffe + KI Analyse | DEPLOYED | 19 | 8/10 |
| 6 | PT Ernaehrungs-Chat + Meal Plan | DEPLOYED | 5 | 8/10 |
| 7 | Training-Nutrition Sync | DEPLOYED | 14 | 9/10 |
| 8 | Water Intake + Bloodwork | DEPLOYED | 20 | 8/10 |
| | **TOTAL** | **8/8** | **115** | **8.5** |

### 3.1 Post-Workout Nutrition Trigger
**Status:** Wird nach Workout aufgerufen: JA (2 Referenzen: Definition + archiveWorkouts Integration)
**Wissenschaft korrekt:** JA — Kerksick ISSN 2017 referenziert, 30-min Window als widerlegt markiert

### 3.2 Open Food Facts API
**Status:** DEPLOYED (6 normalizeOFF Referenzen)
**Makros:** JA (Kalorien, Protein, Carbs, Fat, Fiber, Sugar, Sodium)
**Mikros:** JA (13 OFF-Mapping-Felder, wird beim Food-Entry extrahiert)

### 3.3 Deload Auto-Anpassung
**Status:** AKTIV — Erkennt Deload aus Meso-Plan ODER ACWR danger. Kalorien -15%, Protein gleich.

### 3.4 Nutrient Timing
**Status:** DEPLOYED — 5 Mahlzeiten-Zeitpunkte mit "JETZT" Badge, Pre-Sleep Casein (Snijders 2015)

---

## BLOCK 4: PT MODE (8.5/10)

### 4.1 Client Management
**Funktionen:** 12 (addClient, editClient, deleteClient, openClientDetail, etc.)
**Compliance Rings:** 8 Referenzen
**Check-In System:** 11 Referenzen

### 4.2 Revenue Dashboard
**monthlyRate Input:** VORHANDEN (war Bug in V2, jetzt inline-editierbar)

### 4.3 KI Meal Plan Generator
**Status:** DEPLOYED — 7-Tage Plan mit ISSN-Makros, Trainings- vs Ruhetage, Allergien

### 4.4 PT Ernaehrungs-Chat
**Status:** DEPLOYED — Chat mit Client-Kontext, Quick Actions, 50-Nachrichten History

### 4.5 Workout Delivery
**Status:** AKTIV (4 Referenzen)

### 4.6 Creator Codes
**Status:** AKTIV (3 Referenzen)

### 4.7 LexOffice
**Status:** DEPLOYED (Server-Side Function)

---

## BLOCK 5: ANALYTICS + GAMIFICATION (8.5/10)

### 5.1 ACWR Validierung
**Minimum-Daten-Check:** VORHANDEN (5 Workouts UND 14 Tage, 19 Referenzen)
**Pause-Erkennung:** VORHANDEN (daysSinceLastWorkout > 4)
**Chronic-Load Minimum:** VORHANDEN (chronicAvg < acuteAvg * 0.3)
**Skala:** 2.5 (war 2.0)

### 5.2 Muskel-Recovery V3
**Status:** DEPLOYED (6 Referenzen)
**Liste kollabiert:** JA (muscleRecoveryList hinter Toggle)

### 5.3 Muskel-Ranking
**Status:** DEPLOYED (10 Referenzen: XP, Ranks, Dysbalancen)

### 5.4 XP System
**Sources:** 15 awardXP Calls
**Milestones:** 12 Referenzen

### 5.5 Volume Landmarks
**Status:** AKTIV (7 Referenzen: MEV, MAV, MRV)

### 5.6 Enhanced Correlations
**Status:** DEPLOYED — Protein-Zufuhr Korrelation (highProtDays vs lowProtDays)

### 5.7 Monthly Summary
**Status:** AKTIV (3 Referenzen)

---

## BLOCK 6: SOCIAL (7/10)

### Feed System
**Tabs:** Following, Discover, Routines, Rezepte — 4 Tabs DEPLOYED
**Follow System:** AKTIV
**Like System:** AKTIV
**Community Rezepte:** DEPLOYED (Uebernehmen + useCount)

### Gaps
- Kein Kommentar-System
- Kein Feed-Algorithmus (nur chronologisch/Likes)
- Keine DMs ausser PT-Chat

---

## BLOCK 7: SECURITY (8/10)

### Positiv
- `_escapeHtml`: 231 Verwendungen (153 app-core, 53 base-pt, 19 base-ai + 6 weitere)
- `_sanitizeAIHtml`: Alle KI-Responses
- CORS: Origin auf base-app.tech beschraenkt
- Cloud-Toast nur bei `!navigator.onLine` (7 Checks)
- Toast-Debounce: 5s Duplikat-Schutz
- Rate Limiting: Multi-Tier in gemini.js (Coach 15, Plan 3, Global 60/Tag)
- Prompt Injection: `<user_data>` Tags + System Directive
- Firebase Auth: `onAuthStateChanged` mit korrektem user-Check

### Kritisch
- Keine Probleme gefunden

### Verbesserungswuerdig
- Firestore Rules fuer neue Collections (food_logs, shared_recipes) muessen in Firebase Console gepflegt werden
- Client Portal Tokens: crypto.randomUUID (gut, aber kein Expiry)

---

## BLOCK 8: CODE-QUALITAET (7/10)

### Service Worker
**Version:** v227
**Strategie:** Stale-While-Revalidate

### Dateigroessen
| Datei | LOC | Trend |
|-------|----:|-------|
| app-core.js | 11.270 | GROSS — Refactoring-Kandidat |
| base-pt.js | 4.326 | Akzeptabel |
| app.html | 4.310 | GROSS — viele Modals |
| base-ai.js | 1.310 | OK |
| base-settings.js | 786 | OK |

### Min-Files
**10 von 10** min-Files vorhanden (100%)

### i18n
- `window.t()`: 204 Calls in app-core.js
- `data-i18n`: 441 Attribute in app.html
- Einige hardcoded Strings in Nutrition-System (Phases 1-8 haben deutsche Strings direkt)

### Dead Code
- `buildAthleteSummary()`: WIRD aufgerufen (4x in gemini.js) — kein Dead Code

### Error Handling
- 43 catch-Blocks mit showToast oder console in app-core.js
- 15 Skeleton/Loading States

### Netlify Functions
**11 Functions deployed:** gemini, lexoffice, nutritionix, push, push-scheduler, push-workout, strava-token, stripe-checkout, stripe-webhook, tts, usercount

---

## BLOCK 9: SPORT-TIEFE (8/10)

### Schema System
- 17 Sport-Schema Referenzen
- 86 Sportarten konfigurierbar
- Custom-Felder ueber Extra-Fields

### Cardio
- HR-Zonen: 10 Referenzen
- Strava Integration: 27 Referenzen (OAuth, Import, HR/Pace/Distance)

### Kraft
- 882 Uebungen in exercise-db.js
- Set-Details: 124 Referenzen
- 1RM Rechner (Epley Formel)
- PR-Tracking mit Celebration

---

## BLOCK 10: UX (8.5/10)

### Accessibility
- `pointer-events-auto`: 574 (iOS Safari Touch Fix)
- `aria-label`: 484 Buttons
- `-webkit-text-fill-color`: Fix in CSS

### Empty States
- 25 Empty States (12 JS, 13 HTML)

### Loading States
- 15 Skeleton/Loading Indicators

### Push Notifications
- 14 Notification-Referenzen (Supplement Reminders, Workout Push)

### Onboarding
- 4 Referenzen in base-settings.js (Profil, Sportart, Module)

---

## KRITISCHE BUGS (sofort fixen)

| Prio | Bug | Datei | Aufwand |
|------|-----|-------|---------|
| - | **Keine kritischen Bugs gefunden** | - | - |

---

## FEATURE-TIEFE LUECKEN

| Prio | Feature | Was fehlt | Impact |
|------|---------|-----------|--------|
| 1 | i18n Nutrition | Nutrition-Strings Phase 1-8 sind hardcoded Deutsch | 7 Sprachen betroffen |
| 2 | Bloodwork im Coach-Kontext | Blutwerte fliessen nicht in buildAIContext | KI kennt Blutwerte nicht |
| 3 | Set-Typen | Myo-Reps, Cluster Sets, Partials fehlen | Powerlifting/Bodybuilding Tiefe |
| 4 | Feed DMs | Keine Direktnachrichten zwischen Athleten | Social Engagement |
| 5 | app-core.js Groesse | 11.270 LOC in einer Datei | Wartbarkeit, Ladezeit |

---

## KI-KONTEXT GAPS

| KI-Feature | Fehlende Daten | Impact |
|-----------|----------------|--------|
| Coach Chat | Blutwerte (Vitamin D, Ferritin etc.) | Kann keine blutbasierte Recovery-Empfehlung geben |
| Daily Outlook | Supplement-Compliance | Weiss nicht ob User Supplements genommen hat |
| Scan | Wochen-Nutrition-Trend | Kann Ernaehrungs-Impact auf Progression nicht bewerten |

---

## EMPFEHLUNGEN

### Sofort (diese Woche)
1. **Blutwerte in buildAIContext** — Latest Bloodwork an Coach-Chat senden
2. **i18n fuer Nutrition** — Kritische Strings in window.t() wrappen (Phasen 2-8)
3. **Firestore Rules** — food_logs, shared_recipes, nutrition_profiles in Firebase Console anlegen

### Kurzfristig (naechste 2 Wochen)
1. **app-core.js splitten** — Nutrition-System (Phases 2-8) in eigene `base-nutrition.js` auslagern (~3.000 LOC)
2. **Supplement Compliance im Outlook** — "_Du hast heute noch nicht Kreatin genommen"

### Mittelfristig (naechster Monat)
1. **Water Reminder via Push** — Server-seitig ueber push-scheduler.js (aktuell nur lokale Notification)
2. **Kommentar-System** fuer Social Feed Posts
3. **Set-Typen erweitern** — Myo-Reps, Cluster Sets, Rest-Pause
4. **Bloodwork Trend-Charts** — Vitamin D / Ferritin Verlauf ueber Zeit
