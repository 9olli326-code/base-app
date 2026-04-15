# BASE — Tiefenanalyse: Wo sind wir oberflächlich?
## Stand: April 2026 | Brutal ehrlich.

---

## 1. KRAFT-TRACKING — Score: 5/10

### Was existiert (verifiziert):
- ✅ Sets/Reps/Weight + RIR pro Satz
- ✅ Satz-für-Satz Tracking (neu implementiert)
- ✅ Superset-Toggle (ein zweites Übungs-Feld)
- ✅ PR-Detection bei maxWeight > previousMax + Fullscreen-Celebration
- ✅ 1RM-Berechnung (Epley-Formel) + 1RM-Modal mit History
- ✅ Exercise-DB mit 882 Übungen (Name DE+EN, bodyPart, target, GIF-URL)
- ✅ "Last Time" Overlay zeigt letzte Werte + Progressions-Empfehlung
- ✅ Progressions-Pfeile (↑↓→) basierend auf letzten 3 Workouts
- ✅ Equipment-Auswahl (Standard/Kurzhantel/etc.)
- ✅ Muscle Balance (Push/Pull Ratio, Upper/Lower Ratio)
- ✅ Exercise History Modal (alle Workouts einer Übung)
- ✅ Autocomplete für Übungsnamen

### Was FEHLT (vs. Strong/Hevy):
- ❌ **Workout Templates / Routinen** — DAS #1 fehlende Feature. Kein "Last Workout wiederholen"
- ❌ **Auto-Fill letzte Werte in Inputs** — _showLastTime zeigt Werte als TEXT, füllt aber nicht die Input-Felder vor
- ❌ **Drop-Sets, Warmup-Sets, Failure-Sets** — Kein Set-Type-Marker. Nur Superset-Toggle.
- ❌ **Notizen pro Set/Übung** — Kein Textfeld für "Grip slipped" oder "Felt easy"
- ❌ **Rest Timer pro Übung** — Globaler Timer, nicht pro Übung konfigurierbar
- ❌ **Volume-Trend Charts** — Kein Wochen-/Monats-Volumen-Chart. Nur Exercise-spezifische Charts.
- ❌ **Workout-Vergleich** — Kein "Dieses Workout vs. letztes Workout"-View
- ❌ **Progressive Overload Tracking** — Kein "Du bist seit 3 Wochen bei 80kg stecken geblieben"
- ❌ **Muskelgruppen-Tracking pro Workout** — Muscle Balance existiert aggregiert, aber nicht "heute hast du Brust 12 Sets, Rücken 0 Sets" in Echtzeit

### Quick Wins:
1. **Auto-Fill letzte Werte** (S) — _showLastTime ruft bereits die Daten ab. Fehlt nur: beim Klick die Werte in wdh_s/weight_s Inputs setzen.
2. **Set-Type Tags** (S) — Dropdown pro Set: Normal/Warmup/Drop/Failure. Nur ein string-Feld `setObj.type` speichern.
3. **Workout Templates** (M) — "Als Routine speichern" Button, Routine-Auswahl beim Workout-Start. Datenestruktur: `{ name, exercises: [{name, sets, reps, weight}] }`.

---

## 2. AUSDAUER/CARDIO — Score: 4/10

### Was existiert:
- ✅ Default-Schema: Distanz (km), Dauer (min), Pace (min/km), Ø Puls
- ✅ Strava-Import (letzte 10 Aktivitäten, Distanz + Dauer + Pace + Puls)
- ✅ PR-Detection für Distanz und Dauer
- ✅ HIIT Timer (in base-timers.js)
- ✅ Progressions-Badges in Verlauf ("+0.5 km" Badges)

### Was FEHLT (vs. Strava/Garmin/Nike Run Club):
- ❌ **Splits / Zwischenzeiten** — Keine Runden-Aufzeichnung
- ❌ **Herzfrequenz-Zonen** — Kein Zone 1-5 Tracking
- ❌ **Kalorien-Berechnung** — Nicht automatisch aus Dauer/Puls/Gewicht
- ❌ **Höhenmeter / Elevation** — Feld existiert nicht
- ❌ **Pace-Charts** — Keine Visualisierung von Pace über Zeit
- ❌ **Lauf-Typen** — Keine Unterscheidung (Easy Run, Tempo, Intervall, Long Run)
- ❌ **VO2max Schätzung** — Keine Berechnung
- ❌ **Cadence / Schrittfrequenz** — Kein Feld
- ❌ **GPS-Track Anzeige** — Keine Karten-Visualisierung (auch nicht von Strava importiert)

### Ehrliche Wahrheit:
Cardio-Tracking ist ein reines Zahlen-Logging-Formular. 4 Felder (Distanz, Dauer, Pace, Puls). Strava liefert mehr Daten die ignoriert werden. Keinerlei Cardio-spezifische Analyse.

### Quick Wins:
1. **Elevation + Kalorien Felder** (S) — Zwei Felder zum Default-Cardio-Schema hinzufügen
2. **Strava Import erweitern** (S) — `act.total_elevation_gain`, `act.calories` bereits in API vorhanden, nur nicht importiert
3. **Pace-Chart** (M) — In Exercise History ein Pace-über-Zeit Chart für Läufe

---

## 3. MOBILITY/YOGA/STRETCHING — Score: 2/10

### Was existiert:
- ✅ Kategorie "Mobility" mit eigener Farbe (Emerald Green) + Icon
- ✅ Recovery-Schema (aber leer per Default — kein vordefiniertes Schema!)
- ✅ KI kann Mobility-Formulare generieren (Form Builder)

### Was FEHLT:
- ❌ **Kein vordefiniertes Mobility-Schema** — "Mobility" Tab zeigt nur "Sportart wählen". User muss erst über KI ein Formular generieren lassen.
- ❌ **Keine Hold-Timer** — Kein "30 Sekunden halten" Timer
- ❌ **Keine Flexibility-Metriken** — Keine ROM-Messung
- ❌ **Keine Stretch-Bibliothek** — 882 Kraft-Übungen aber 0 Stretching-Übungen
- ❌ **Kein Mobility-Assessment** — Kein "Schulter-Mobilität Test"
- ❌ **Kein Yoga-Flow** — Kein geführter Ablauf

### Ehrliche Wahrheit:
Mobility ist de facto ein leerer Tab. Der User sieht "Sportart wählen" und muss selbst wissen was er tracken will. Keine Struktur, keine Anleitungen, keine Übungen. Existiert nur als Kategorie-Container.

### Quick Wins:
1. **Default Mobility Schema** (S) — `[{id:"uebung",label:"Übung"},{id:"dauer",label:"Dauer (min)"},{id:"koerperbereich",label:"Körperbereich"}]`
2. **Hold-Timer** (S) — Button "30s/45s/60s halten" der runterzählt. Kann den bestehenden Rest-Timer wiederverwenden.
3. **10 vordefinierte Stretches** (S) — Hardcoded in Exercise-DB: Hip Flexor Stretch, Pigeon Pose, etc.

---

## 4. "MEIN SPORT" / 86 Sportarten — Score: 3/10

### Was existiert:
- ✅ KI Form Builder — Gemini generiert dynamische Felder für beliebige Sportarten
- ✅ Sport Picker mit Icon-Auswahl
- ✅ Schemas werden in localStorage gespeichert (beastmode_v2_multi_schemas)
- ✅ Felder können hinzugefügt/entfernt werden

### Was FEHLT:
- ❌ **Keine vordefinierten Schemas für die 86 Sportarten** — Die "86 Sportarten" existieren NUR als Marketing-Claim. Es gibt KEINE vordefinierte Liste von 86 Sportarten im Code. Der User muss für JEDE Sportart die KI ein Formular generieren lassen.
- ❌ **Keine Sport-spezifische Analyse** — Tennis hat keine "Erste-Aufschlag-Quote", Schwimmen keine "SWOLF-Werte"
- ❌ **Keine Sport-spezifische Progression** — Wie misst man Fortschritt bei Klettern vs. Tennis vs. Kampfsport?
- ❌ **Keine Übungsdatenbank pro Sportart** — 882 Kraft-Übungen, 0 für andere Sportarten

### Ehrliche Wahrheit:
"86 Sportarten" bedeutet in der Realität: "Du kannst einen beliebigen Text in ein Feld tippen und die KI generiert ein Formular." Das ist ein generisches Tool, keine sportartspezifische Lösung. Die 86 kommen wahrscheinlich von den 86 Strava Activity-Typen oder einer Marketing-Zählung.

### Quick Wins:
1. **10 vordefinierte Sport-Schemas** (M) — Tennis, Schwimmen, Klettern, Kampfsport, Yoga, Fußball, Basketball, Radfahren, Wandern, CrossFit. Mit sinnvollen Feldern.
2. **Sport-Picker mit Vorlagen** (S) — Beim "Sportart wählen" vordefinierte Optionen anzeigen statt leerer State
3. **Schema-Sharing** (M) — User können ihre KI-generierten Schemas mit anderen teilen

---

## 5. KI-FEATURES — Score: 7/10

### Überraschung: Die KI-Prompts sind DEUTLICH tiefer als erwartet

Die Server-Seite (gemini.js) hat eine `buildAthleteSummary()` Funktion die echte statistische Analyse macht BEVOR sie an Gemini geht: Trainingshäufigkeit, Consistency-%, Kraft-Progression pro Übung (kg/Woche), Plateau-Detection, Muskelgruppen-Balance, und ein intensitäts-gewichteter ZNS 2.0 Score.

### Tiefe pro KI-Feature (verifiziert aus Prompts):

| Feature | Score | Workouts | Profil | Verletzungen | Wissenschaft | Details |
|---------|-------|----------|--------|--------------|--------------|---------|
| **Coach/Scan** | 9/10 | 20 | ✅ | ✅ | Aaberg 2007, ACSM | "Sportwissenschaftler mit Expertise in Leistungsdiagnostik". Anti-Halluzination. |
| **Copilot/Spotter** | 9/10 | 5 (Übungs-spezifisch) + 20 | ✅ | ✅ | Schoenfeld 2010, Zourdos 2016, Krieger 2010, Rhea 2003 | CSCS-Credential. Übungs-spezifische History! |
| **Battery/ZNS** | 8/10 | 20 + ZNS-Calc | ✅ | ✅ | Kellmann 2018, Meeusen 2013, Soligard 2016 | Recovery-Spezialist. Aber Client-Side ZNS ist simpel. |
| **Smart Workout** | 8/10 | 30 + Wochen/48h-Analyse | Teilweise | ❌ im User-Prompt | Schoenfeld 2016/2017 | Detaillierte Volumen/Frequenz/Intensität-Regeln. |
| **Plan/Mesozyklus** | 8/10 | 15 + 1RMs | ✅ | ✅ | Periodisierung | Mesozyklus-Phasen, Sets-Multiplikator, RIR-Targets. |
| **Armor/PreHab** | 7/10 | 20 | ✅ | ✅ | Mittel | Physiotherapeut. RPE-basierte Mobilisation. |
| **Exercise Recommend** | 7/10 | 20 | ✅ | ✅ | Mittel | Progressive Overload erwähnt. |
| **Warmup** | 6/10 | 20 | ✅ | ✅ | Keine | Generisch "Fitness-Coach". Max 8 Übungen als JSON. |
| **Form Check** | 5/10 | 0 (nur Bild) | ❌ | ❌ | Mittel | Vision-basiert. Kein Athleten-Kontext. Max 150 Wörter. |
| **Coach Nudge** | 2/10 | 0 | ❌ | ❌ | Keine | Nur Marketing-Hook, kein AI-Call. |

### Server-Side Tiefe (gemini.js — `buildAthleteSummary()`):
- Trainingsfrequenz (Ø Workouts/Woche)
- Consistency % (Wochen mit 2+ Workouts)
- Kraft-Progression pro Übung (erstes vs. letztes Max, kg/Woche Gain-Rate, Trend: steigend/stabil/fallend)
- Plateau-Detection (letzte 3 haben gleiches Max-Gewicht)
- Muskelgruppen-Balance (Brust/Push, Rücken/Pull, Beine, Schultern, Arme, Core)
- ZNS 2.0 (intensitäts-gewichtet: 5+ Sets = höherer Multiplikator, 100kg+ = höher, RPE 9+ = +0.5, Recovery = 0.3x)
- Anti-Halluzination: User-Daten in `<user_data>` XML-Tags, Schoenfeld/Ralston/Zourdos/Kellmann Referenzen
- Rate-Limiting: Coach 15/Tag, Plan 3/Tag, Global 60/Tag

### Tiefe-Probleme die BLEIBEN:
- **Client-Side Readiness ist simpel** — `100 - (7d×8) - (3d×5)`. Server-Side ZNS 2.0 ist besser aber wird nur im Prompt-Kontext benutzt, nicht im UI-Widget angezeigt.
- **Mesozyklus: generate-and-forget** — Plan kennt Wochen, aber User-Fortschritt wird NICHT in localStorage persistiert. "AKTUELL" ist immer Woche 1 (hardcoded `i === 0`).
- **Plan-Wochen werden PARALLEL generiert** — Promise.all(), kein carry-over von Woche 1 Ergebnis in Woche 2 Prompt. Jede Woche ist unabhängig.
- **Form Check bekommt KEINEN Athleten-Kontext** — Nur Bild + Übungsname, kein Profil, keine Verletzungen.
- **Kein subjektives Feedback** — "Wie hast du dich gefühlt?" fließt nirgends ein.

### Quick Wins:
1. **ZNS 2.0 Score im UI anzeigen** (S) — Server-Side berechnet schon den besseren Score. Diesen statt dem simplen Client-Score anzeigen.
2. **Form Check + Profil** (S) — Athleten-Profil + Verletzungen an den Form-Check-Prompt anhängen. 3 Zeilen Code.
3. **Subjektives Post-Workout Feedback** (S) — 1-5 Smiley nach Workout. In `buildAthleteSummary()` als Kontext speisen.

---

## 6. MESOZYKLUS — Score: 3/10

### Was existiert:
- ✅ Prompt beschreibt Mesozyklus-Phasen (Akkumulation, Overreach, Deload)
- ✅ Sets-Multiplikatoren pro Woche (×1.0 bis ×0.6 für Deload)
- ✅ Target-RIR pro Phase
- ✅ Visuelle Darstellung der Phasen im Plan-Modal (Akkum/Overreach/Deload Badges)
- ✅ Erste Phase markiert als "AKTUELL"

### Was FEHLT:
- ❌ **Kein Tracking welche Woche aktiv ist** — "AKTUELL" ist immer Woche 1 (hardcoded: `i === 0`)
- ❌ **Kein Auto-Advance** — Plan geht nicht automatisch zur nächsten Woche
- ❌ **Kein Deload-Reminder** — Keine Benachrichtigung "Du bist in Woche 6, Zeit für Deload"
- ❌ **Keine Auto-Regulation** — Wenn RIR sinkt (User wird müder), keine automatische Volumen-Anpassung
- ❌ **Kein "Today's Workout"** — Plan existiert als PDF-artiges Dokument, nicht als interaktives Tagesprogramm
- ❌ **Kein Fortschritts-Tracking** — "Habe ich die Phasen-Ziele erreicht?"

### Ehrliche Wahrheit:
Der Mesozyklus ist ein reiner Prompt-Trick. Die KI generiert einen Plan der wie Periodisierung aussieht, aber die App hat KEINE Datenstruktur die Wochen trackt, KEINE Logik die den Plan mit dem täglichen Training verknüpft. Es ist ein statischer PDF-Export mit hübschen Labels.

### Quick Wins:
1. **Active Week Tracking** (S) — `localStorage.setItem('base_plan_current_week', weekNum)`. Beim Plan-View: aktuelle Woche highlighten statt immer Woche 1.
2. **Today's Workout Button** (M) — Basierend auf Wochentag + aktueller Woche den richtigen Session anzeigen
3. **Deload Reminder** (S) — Wenn aktuelle Woche = letzte Woche des Plans: Toast "Deload-Woche! Reduziere Volumen."

---

## 7. GAMIFICATION — Score: 5/10

### Was existiert:
- ✅ XP System (50 XP/Workout, 15 Coach, 25 Scan, 40 Plan, 30 Challenge, 500 Goal)
- ✅ Level 1-99 mit 5 Rängen (Rookie → Legend)
- ✅ XP-Bar unter Header
- ✅ Level-Up Animation
- ✅ Streak-Tracking (Tage am Stück)
- ✅ Streak-Bonus (7d = 200 XP, 30d = 1000 XP)
- ✅ Streak-Warning ("Deine Streak endet bald!")
- ✅ Persönliche Ziele mit 500 XP Bonus
- ✅ Challenges (CRUD, Leaderboard, Share)

### Was FEHLT:
- ❌ **Keine Achievements / Badges** — Kein "100 Workouts", "1000kg Volumen", "Erste PR"
- ❌ **Keine Milestones** — Kein "Du hast 50 Squats gemacht!"
- ❌ **Kein Leaderboard (global)** — Nur Challenge-spezifisch
- ❌ **Kein Daily Quest / Challenge** — Kein "Heute: 3 Sets Klimmzüge"
- ❌ **Kein XP für Consistency** — XP nur für Events, nicht für "3x/Woche trainiert"

### Quick Wins:
1. **5 Basis-Achievements** (M) — First Workout, 10 Workouts, First PR, 7-Day Streak, 100kg Volumen. Fullscreen-Animation bei Unlock.
2. **Weekly Consistency XP** (S) — +100 XP wenn User 3+ Workouts diese Woche hat
3. **Milestone-Toasts** (S) — "50. Workout! 🎉" basierend auf workouts.length

---

## 8. ANALYTICS/CHARTS — Score: 5/10

### Was existiert:
- ✅ Exercise-spezifischer Chart (Weight/Volume über Zeit)
- ✅ Metric-Auswahl pro Übung
- ✅ Body-Tracker Chart (Gewicht, Fett, Maße über Zeit)
- ✅ Heatmap (Trainings-Häufigkeit im GitHub-Contribution-Style)
- ✅ Kalender-View
- ✅ 1RM-Tabelle
- ✅ Muscle Balance (Push/Pull, Upper/Lower Ratios)
- ✅ Readiness Score

### Was FEHLT:
- ❌ **Kein Volumen-Trend-Chart** — Wöchentliches Gesamtvolumen über Zeit
- ❌ **Kein Muskelgruppen-Verteilungs-Chart** — "Diese Woche: 40% Brust, 30% Rücken, 30% Beine"
- ❌ **Kein Workout-Dauer-Trend** — Werden Workouts länger oder kürzer?
- ❌ **Keine Vergleichs-Ansicht** — "Letzte Woche vs. diese Woche"
- ❌ **Kein PR-Dashboard mit Zeitverlauf** — PR-Tabelle existiert, aber kein Chart der PRs über Monate zeigt
- ❌ **Keine Export-Charts** — Charts können nicht als Bild geteilt werden (Brag Card teilt nur Zahlen)

### Quick Wins:
1. **Weekly Volume Chart** (M) — Aggregiertes Volumen pro Woche als Balken-Chart
2. **Muskelgruppen-Pie-Chart** (M) — bodyPart aus Exercise-DB nutzen, Sets pro bodyPart aggregieren
3. **PR Timeline** (S) — 1RM-Werte über Zeit als Linien-Chart (Daten sind via get1RMsFromHistory() schon da)

---

## 9. PT MODE — Score: 4/10

### Was existiert:
- ✅ Client CRUD + Onboarding Wizard (Ziel, Erfahrung, Verletzungen, Trainingstage)
- ✅ Client Profile (Ziel, Erfahrung, Verletzungen, Kontakt)
- ✅ Session Planner (Kalender, Custom Types mit Icon-Picker)
- ✅ Session Templates (speichern + laden)
- ✅ Quick Track (6 Metrik-Typen)
- ✅ Compliance Tracking (SVG-Ringe: Woche/Monat/Gesamt)
- ✅ KI Wochenbericht (Gemini-basiert)
- ✅ KI Check-In + WhatsApp Sharing
- ✅ Client Portal (Token-basiert)
- ✅ PDF Export mit Trainer-Branding
- ✅ Trainer Directory + Reviews
- ✅ Custom Branding (Logo, Name, Farbe)
- ✅ Design Morphing (Zen Flow ↔ Carbon Elite)

### Was FEHLT (vs. Trainerize/TrueCoach):
- ❌ **Workout Delivery** — Kann keinen Plan an Client senden
- ❌ **In-App Messaging** — Nur WhatsApp-Deeplink
- ❌ **Client Progress Charts** — Keine Charts pro Client
- ❌ **Progress Photos** — Kein Vorher/Nachher
- ❌ **Habit Tracking** — Kein Schlaf/Wasser/Ernährung
- ❌ **Automated Reminders** — Keine Push an Clients
- ❌ **Revenue Dashboard** — Kein Umsatz/Client
- ❌ **Client Trends** — Keine "Kunde X hat 15% mehr Volumen als letzten Monat"
- ❌ **Group Sessions** — Keine Gruppen-Planung

### Ehrliche Wahrheit:
PT Mode ist eine Client-Verwaltung mit KI-Reports. Es fehlen die 3 Deal-Breaker: Workout Delivery, Messaging, Payments. Ohne diese ist es für einen arbeitenden PT nicht nutzbar — er wird trotzdem WhatsApp für alles nutzen.

### Quick Wins:
1. **Client Volume/PR Chart** (M) — Die gleiche initAnalytics-Logik pro Client aufrufen. Daten sind bereits da (client workouts).
2. **Workout Delivery via Portal** (M) — Plan generieren → als JSON im Portal speichern → Client kann es im Portal sehen
3. **Session Nächste-Schritte** (S) — Nach Session: "Nächstes Mal: +2.5kg auf Squat, Fokus auf Tiefe"

---

## GESAMT-TIEFE RANKING

| Bereich | Score | Tiefster Mangel |
|---------|-------|-----------------|
| Kraft-Tracking | 5/10 | Keine Templates/Routinen, kein Auto-Fill |
| Ausdauer/Cardio | 4/10 | Nur 4 Felder, keine Analyse, keine Zonen |
| Mobility | 2/10 | De facto leerer Tab |
| "86 Sportarten" | 3/10 | Marketing-Claim, keine vordefinierten Schemas |
| KI Features | 7/10 | Prompts überraschend tief (9/10 für Coach/Copilot), aber Mesozyklus nicht getrackt |
| Mesozyklus | 3/10 | Generate-and-forget, kein Weekly Tracking |
| Gamification | 5/10 | Keine Achievements/Badges, kein Daily Quest |
| Analytics | 5/10 | Kein Volume-Trend, kein Muskelgruppen-Chart |
| PT Mode | 4/10 | Kein Delivery, kein Messaging, kein Revenue |

### **Durchschnitt: 4.2 / 10**

---

## PRIORISIERTE TIEFE-FEATURES NACH IMPACT/AUFWAND

| # | Feature | Bereich | Aufwand | Impact | Ratio | Beschreibung |
|---|---------|---------|---------|--------|-------|--------------|
| 1 | Auto-Fill letzte Werte | Kraft | S | 9 | 9.0 | Daten sind in _showLastTime schon da. Button "Übernehmen" der wdh_s/weight_s befüllt. |
| 2 | Default Mobility Schema | Mobility | S | 7 | 7.0 | 3 Felder hardcoden statt leerer Tab. |
| 3 | Workout Templates | Kraft | M | 9 | 4.5 | "Als Routine speichern" + "Routine laden". Wichtigstes fehlendes Feature überhaupt. |
| 4 | Set-Type Tags | Kraft | S | 6 | 6.0 | Warmup/Drop/Failure Marker pro Set. 1 Dropdown + 1 String-Feld. |
| 5 | Active Week Tracking | Meso | S | 6 | 6.0 | localStorage Key für aktuelle Woche. Phase-Badge aktualisieren. |
| 6 | 10 vordefinierte Sportarten | Mein Sport | M | 7 | 3.5 | Tennis, Schwimmen etc. mit sinnvollen Feldern. |
| 7 | Weekly Volume Chart | Analytics | M | 7 | 3.5 | Volumen-Trend über Wochen. Basis-Chart.js. |
| 8 | Readiness v2 (Volumen-basiert) | KI | M | 7 | 3.5 | Volumen pro Muskelgruppe statt nur Workout-Count. |
| 9 | Strava Import erweitern | Cardio | S | 5 | 5.0 | Elevation + Kalorien importieren (API-Felder da). |
| 10 | Subjektives Feedback Post-Workout | KI | S | 5 | 5.0 | 1-5 Smiley nach Workout. In Coach-Kontext speisen. |
| 11 | 5 Basis-Achievements | Gamification | M | 6 | 3.0 | First Workout, 10 Workouts, First PR, 7-Day Streak, 100kg. |
| 12 | Notizen pro Set | Kraft | S | 4 | 4.0 | Optionales Textfeld pro Set. |
| 13 | Today's Workout Button | Meso | M | 6 | 3.0 | Plan + Wochentag → heutiges Workout anzeigen. |
| 14 | Client Volume Chart | PT | M | 5 | 2.5 | initAnalytics pro Client aufrufen. |
| 15 | Muskelgruppen-Pie-Chart | Analytics | M | 5 | 2.5 | bodyPart aus exercise-db aggregieren. |
| 16 | Deload Reminder | Meso | S | 4 | 4.0 | Toast wenn aktuelle Woche = Deload-Woche. |
| 17 | Pace Chart | Cardio | M | 4 | 2.0 | Pace über Zeit für Läufer. |
| 18 | Weekly Consistency XP | Gamification | S | 3 | 3.0 | +100 XP bei 3+ Workouts/Woche. |
| 19 | PR Timeline Chart | Analytics | S | 3 | 3.0 | 1RM über Monate als Linien-Chart. |
| 20 | Workout Delivery via Portal | PT | M | 5 | 2.5 | Plan → Client Portal. |

---

## DIE EHRLICHSTE ZUSAMMENFASSUNG

BASE hat beeindruckende **BREITE** — 86 Sportarten (Marketing), 11 KI-Features, PT Mode, 7 Sprachen, Challenges, Gamification, Strava. Für ein Solo-Founder-Projekt ist das außergewöhnlich.

Aber die **TIEFE** ist das Problem:
- **Kraft-Tracking** ist 50% so tief wie Strong (kein Auto-Fill, keine Templates)
- **Cardio** ist 20% so tief wie Strava (nur 4 Felder)
- **Mobility** ist ein leerer Tab
- **"86 Sportarten"** ist ein generischer Form Builder, keine sportspezifischen Tools
- **Mesozyklus** ist ein Prompt-Trick, keine echte Periodisierungsdatenstruktur
- **Readiness** basiert auf Workout-Count, nicht auf Trainingsbelastung

**Die Strategie sollte sein:** Erst EINE Kategorie auf Wettbewerbs-Tiefe bringen (Kraft — weil 882 Übungen bereits existieren und die meisten User Kraft tracken), dann die Breite mit echten vordefinierten Schemas füllen.

**Feature #1 und #3 zusammen** (Auto-Fill + Templates) würden den Kraft-Tracking Score von 5 auf 7 heben und die App für Power-User nutzbar machen.
