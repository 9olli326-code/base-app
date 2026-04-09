# BASE Datenqualität Audit — Phase 1-7 Features

Stand: April 2026 | Audit-Methode: Vollständige Code-Analyse aller Funktionen

---

## A) Volume Landmarks (MEV/MAV/MRV) — `_getVolumeLandmarks`

**Status: ✅ Dynamisch und korrekt**

- **Dynamisch:** JA — 5 Faktoren (Erfahrung 0.65-1.25x, Alter 0.65-1.0x, Schlaf 0.60-1.10x, Soreness 0.80-1.05x, Feedback 0.85-1.05x)
- **Multiplikatoren wissenschaftlich fundiert:** JA — Anfänger 0.65x (Schoenfeld 2017 ✓), Alter 50+ 0.75x (Häkkinen 2000 ✓), Schlaf <6h 0.75x (Knowles 2018 ✓)
- **Warmup-Sets ausgeschlossen:** JA — `filter(function(s) { return s.type !== 'warmup'; })`
- **7-Tage-Fenster:** JA — `weekAgo.setDate(weekAgo.getDate() - 7)`

**⚠️ Kleinere Probleme:**
- Schlaf-Durchschnittsberechnung hat Floating-Point-Akkumulationsfehler (aber vernachlässigbar)
- Gesamtmultiplikator wird auf 0.5-1.5x geclamped — korrekt

---

## B) Readiness V2 / ZNS Score — `_calculateReadinessV2`

**Status: ❌ Mehrere Fehler**

1. **KEINE relative Intensität (Gewicht/1RM):** Nutzt absolutes Max-Gewicht. Ein 60kg-Bankdrücker der 55kg drückt wird gleich bewertet wie ein 140kg-Bankdrücker der 55kg drückt. Das ist FALSCH.
2. **RIR nur bei ≤1 berücksichtigt:** RIR 2-4 wird komplett ignoriert. Schwere Sets mit RIR 2 belasten das ZNS deutlich mehr als RIR 4.
3. **Schlaf nur von gestern:** Kein 7-Tage-Durchschnitt wie bei Volume Landmarks.
4. **Feedback nur von gestern:** Kein Rolling-Window.
5. **Formel-Problem:** Deduction `sets * 1.5 * mult / daysAgo` — bei daysAgo=1 (gestern) ist die Division durch 1 = volle Deduktion, bei daysAgo=7 = 1/7 Deduktion. Das ist KORREKT (Recency-Weighting).

**Fix-Empfehlung (Priorität HOCH):**
```
// Relative Intensität einbauen:
var estimated1RM = window.calc1RM ? ... : maxWeight;
var relativeIntensity = maxWeight / (estimated1RM || maxWeight);
if (relativeIntensity > 0.85) intensityMult *= 1.4;
else if (relativeIntensity > 0.70) intensityMult *= 1.1;

// RIR-Staffelung statt nur ≤1:
if (avgRIR <= 1) rirMult = 1.3;
else if (avgRIR <= 2) rirMult = 1.15;
else if (avgRIR <= 3) rirMult = 1.0;
else rirMult = 0.85;

// Schlaf: 7-Tage-Durchschnitt statt nur gestern
```

---

## C) Effective Reps — `_calculateEffectiveReps`

**Status: ⚠️ Funktioniert, aber cap bei 5 ist problematisch**

- **Formel:** `Math.max(0, Math.min(5, reps) - rir)` — Cap bei 5 effektiven Reps pro Satz
- **Warmup-Sets ausgeschlossen:** JA ✓
- **Default RIR = 3:** Konservativ, korrekt ✓
- **Problem:** Bei einem 12-Rep-Satz mit RIR 0 werden nur 5 effektive Reps gezählt. Die Forschung (Beardsley 2020) sagt ~5 Reps nah am Failure sind am effektivsten, aber höhere Reps haben trotzdem Hypertrophie-Stimulus.

**Fix-Empfehlung (Priorität NIEDRIG):**
Die Vereinfachung ist wissenschaftlich vertretbar. Kein Fix nötig, aber Dokumentation dass dies ein konservativer Schätzer ist.

---

## D) Progressive Overload Alert — `_checkProgressiveOverload`

**Status: ⚠️ Funktioniert, aber zu simpel**

- **Plateau-Erkennung:** Nur wenn 3 identische Max-Gewichte. Ignoriert Gewichtsschwankungen (95→92→95kg).
- **Gewichts-Empfehlung:** <40kg: +1.25kg, <80kg: +2.5kg, 80kg+: +5kg — Standard-Mikroloading ✓
- **Deload-Awareness:** KEINE — Könnte Plateau-Alert während geplanter Deload-Woche zeigen
- **Pro Übung:** JA ✓
- **Volume-Progression ignoriert:** Nur Gewicht, nicht Reps/Sets-Steigerung

**Fix-Empfehlung (Priorität MITTEL):**
```
// Deload-Check hinzufügen:
var plan = JSON.parse(localStorage.getItem('base_active_plan') || 'null');
if (plan && plan.planData && plan.planData.weeks) {
  var currentWeekData = plan.planData.weeks[currentWeek];
  if (currentWeekData && currentWeekData.focus && currentWeekData.focus.toLowerCase().indexOf('deload') !== -1) return null;
}
```

---

## E) Deload Auto-Detection — `_checkDeloadNeeded`

**Status: ⚠️ Funktioniert, aber Gewichtsdrop absolut statt relativ**

- **Signale:** Gewicht sinkt (+3), Readiness <40 (+2), Soreness hoch (+2), Feedback schlecht (+2), Über MRV (+1)
- **Gewichtung sinnvoll:** JA — Gewichtsdrop am stärksten gewichtet ✓
- **Dismiss-Timer:** JA — 7 Tage cooldown ✓
- **Problem 1:** Gewichtsdrop ABSOLUT, nicht RELATIV. 2kg Drop bei 50kg = 4% (relevant), 2kg Drop bei 200kg = 1% (irrelevant).
- **Problem 2:** KEINE Deload-Woche-Erkennung. Warnt auch wenn User bereits im Deload ist.

**Fix-Empfehlung (Priorität MITTEL):**
```
// Relativer Gewichtsdrop:
var dropPct = (last3[0].max - last3[2].max) / last3[0].max;
if (dropPct > 0.05) decliningExercises.push(ex); // >5% Drop = relevant

// Deload-Check:
var plan = JSON.parse(localStorage.getItem('base_active_plan') || 'null');
if (plan && /* in deload week */) return null;
```

---

## F) HR-Zonen — `_calculateHRZones`

**Status: ✅ Korrekt**

- **MaxHR-Formel:** 220 - Alter (Haskell-Fox) — Standard, akzeptabel
- **RestHR/MaxHR aus Profil:** JA, mit editierbaren Inputs ✓
- **Karvonen-Formel korrekt:** JA — `restHR + reserve × %` ✓
- **Zonen-Grenzen:** 50/60/70/80/90% — ACSM-konsistent ✓

**⚠️ Verbesserbar:**
- Tanaka-Formel (208 - 0.7 × Alter) wäre genauer für ältere Athleten
- Keine Validierung wenn RestHR > MaxHR

---

## G) Workout-Vergleich — `_showWorkoutComparison`

**Status: ✅ Korrekt**

- **Vergleicht richtige Übung:** JA — `w.exercise === entry.exercise && w.archived` ✓
- **Metriken korrekt:** Volumen (Reps×Weight), Max Weight, Sets, Effective Reps ✓
- **Nimmt erstes Archived Match:** Korrekt da Array reverse-chronologisch sortiert ✓

---

## H) Muscle Frequency Heatmap — `_renderMuscleFrequencyHeatmap`

**Status: ⚠️ Nur Primary Muscles**

- **Mapping via exercise-db:** JA, über `exDb[j].bp` (bodyPart) ✓
- **NUR Primary Muscles:** Sekundäre Muskeln (z.B. Trizeps bei Bankdrücken) werden NICHT gezählt
- **Zeitraum:** 4 Wochen, hardcoded ✓
- **Compound-Handling fehlt:** Bankdrücken zählt nur für "Brust", nicht für "Arme" oder "Schultern"

**Fix-Empfehlung (Priorität NIEDRIG):**
Sekundäre Muskeln mit 0.5× Sets zählen wäre ideal, erfordert aber Secondary-Target-Mapping in exercise-db.

---

## I) Plan Adherence — `_checkPlanAdherence`

**Status: ❌ Exakter String-Match ist zu streng**

- **Session-Definition:** Innerhalb der Woche (nicht Wochentag-gebunden) ✓
- **Übungs-Match:** EXAKTER lowercase String-Vergleich. "Bankdrücken" ≠ "Langhantel Bankdrücken"
- **Unvollständige Wochen:** Werden einberechnet (aktuelle Woche mit weniger Tagen = schlechterer Score)

**Fix-Empfehlung (Priorität MITTEL):**
```
// Fuzzy-Match statt exakt:
var matched = plannedExercises.some(function(planned) {
  return woEx.indexOf(planned) !== -1 || planned.indexOf(woEx) !== -1;
});
```

---

## J) Pump/Soreness — `base_pump_soreness`

**Status: ✅ Korrekt integriert**

- **Speicherung:** Pro Muskelgruppe, pro Tag, Pump 1-5 + Soreness 1-5 ✓
- **Fließt in Readiness:** Nicht direkt, aber indirekt über Feedback
- **Fließt in Deload:** JA — Soreness ≥4 an 2/3 Tagen → Score +2 ✓
- **Fließt in Volume Landmarks:** JA — recoveryMultiplier 0.80-1.05x ✓

---

## K) KI Prompts — Halluzinations-Check

**Status: ⚠️ Teilweise geschützt**

### gemini.js (Server-Side) — ✅ GUT
- System Directive (SD) hat explizite Anti-Halluzinations-Anweisung ✓
- Alle Prompts wrappen User-Daten in `<user_data>` Tags ✓
- Prompt-Injection-Schutz vorhanden ✓
- Wissenschaftliche Referenzen (Schoenfeld 2017, Ralston 2017, Zourdos 2016, Kellmann 2018) ✓

### base-ai.js (Client-Side) — ⚠️ LÜCKENHAFT
- ✅ ZNS Readiness Prompt: Anti-Halluzinations-Direktive vorhanden
- ✅ Coach/Progression Prompt: Anti-Halluzinations-Direktive vorhanden
- ❌ Warmup Generator: KEINE Anti-Halluzinations-Direktive
- ❌ Exercise Recommendation: KEINE Anti-Halluzinations-Direktive
- ❌ Sport Decision Prompt: KEINE Anti-Halluzinations-Direktive

### Daten an KI:
- ✅ Habits-Daten: Werden via `_getHabitSummaryForAI()` an `buildAIContext()` angehängt
- ❌ Pump/Soreness: Werden NICHT an KI-Prompts gesendet
- ❌ Volume Landmarks (aktuelle Zone): Werden NICHT an KI gesendet

---

## L) Achievements — Trigger-Check

**Status: ⚠️ Volume King zählt Warmup-Sets**

| Achievement | Trigger | Status |
|-------------|---------|--------|
| First Blood (1 Workout) | `w.length >= 1` | ✅ Korrekt |
| Dedicated (10 Workouts) | `w.length >= 10` | ✅ Korrekt |
| Iron Will (25 Workouts) | `w.length >= 25` | ✅ Korrekt |
| New Heights (erster PR) | `m.hasPR` via `base_1rm_data` | ✅ Korrekt |
| Unbreakable (7-Day Streak) | `m.streak >= 7` via `base_streak_count` | ✅ Korrekt |
| **Volume King (10.000 kg)** | `setDetails.reduce(reps×weight)` | **❌ Inkludiert Warmup-Sets** |
| Variety Pack (5 Übungen) | `new Set(exercises).size >= 5` | ✅ Korrekt |
| Machine (4 Wochen×3+) | Wochen-Gruppierung nach Montag | ✅ Korrekt |

**Fix für Volume King:**
```
// s.type !== 'warmup' Filter hinzufügen:
return a+(wo.setDetails||[]).filter(function(s){return s.type!=='warmup';}).reduce(...)
```

---

## M) Maschinen-DB

**Status: ✅ Vorhanden in js/machine-db.js** (separat, nicht im Detail auditiert)

---

## N) Stretch Flows

**Status: ✅ Korrekt**

- Hold-Zeiten: 30-60s — ACSM-Standard ✓
- Links/Rechts: ALLE unilateralen Übungen haben beide Seiten ✓
- Reihenfolge: Proximal vor Distal ✓
- 4 Flows: Hüftöffner, Oberkörper, Ganzkörper, Unterkörper ✓

---

## Formeln

| Formel | Implementierung | Status |
|--------|----------------|--------|
| 1RM (Epley) | `weight × (1 + reps/30)` + RPE-Adjustment | ✅ Korrekt |
| MaxHR | `220 - age` (Haskell-Fox) | ✅ Standard (Tanaka wäre besser) |
| Karvonen HR-Zonen | `restHR + reserve × %` | ✅ Korrekt |
| Volume | `Σ(reps × weight)` | ✅ Korrekt |
| Effective Reps | `max(0, min(5, reps) - rir)` | ⚠️ Cap bei 5 |

---

## Priorisierte Fix-Liste

### HOCH (Falsche/fehlende Berechnung)
1. **Readiness V2: Relative Intensität fehlt** — Score ignoriert 1RM, behandelt 55kg Bankdrücken gleich für alle Athleten
2. **Readiness V2: RIR-Staffelung** — Nur RIR ≤1 berücksichtigt, RIR 2-4 wird ignoriert
3. **Readiness V2: Schlaf 7-Tage-Schnitt** — Nur gestern statt Rolling-Average

### MITTEL (Funktioniert, aber ungenau)
4. **Deload: Relativer statt absoluter Gewichtsdrop** — 5% Drop als Schwelle statt absolute Differenz
5. **Deload: Deload-Woche-Erkennung** — Kein Alert wenn User bereits im Deload
6. **Plan Adherence: Fuzzy Exercise Matching** — indexOf statt exaktem String-Match
7. **Progressive Overload: Deload-Awareness** — Kein Plateau-Alert während Deload
8. **Volume King Achievement: Warmup-Filter** — Warmup-Sets aus Volume-Berechnung ausschließen

### NIEDRIG (Nice-to-have)
9. **Muscle Heatmap: Secondary Muscles** — Compound-Übungen nur Primary
10. **MaxHR: Tanaka-Formel als Option** — 208 - 0.7×Alter genauer für Ältere
11. **KI Prompts: Anti-Halluzination in allen Prompts** — Warmup Gen, Exercise Rec, Sport Decision
12. **KI Prompts: Pump/Soreness Daten senden** — Aktuell nicht im Kontext
13. **Plan Adherence: Unvollständige Wochen anteilig** — Aktuelle Woche nicht als volle Woche zählen
