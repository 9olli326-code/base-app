# BASE — Feature-Gap Analyse 2026

> Erstellt: 30. März 2026 | Für: BASE (base-app.tech)
> Methode: Web-Recherche der Top-10 Feature-Requests + Konkurrenz-Vergleich

---

## Top-10 meistgewünschte Features bei Fitness-Apps 2025/2026

| # | Feature | Adoptionsrate | Bereits bei |
|---|---------|--------------|-------------|
| 1 | Adaptive KI-Workout-Generierung | 85% | Fitbod, Freeletics |
| 2 | Apple Watch / Smartwatch Companion App | 80% | Hevy, Strong, JEFIT, Strava |
| 3 | Social Feed & Community | 78% | Hevy, Strava, JEFIT, MFP |
| 4 | Übungsvideos mit Form-Korrektur | 75% | Fitbod, JEFIT, TrueCoach |
| 5 | Ernährungstracking-Integration | 72% | MFP, Freeletics, Trainerize |
| 6 | Native App Store Präsenz (iOS/Android) | 70% | Alle außer BASE |
| 7 | Gamification (Leaderboards, Challenges, Streaks) | 68% | Strava, JEFIT, Freeletics |
| 8 | Wearable-Daten (HRV, Schlaf, Recovery) | 65% | TrueCoach, Strava, Fitbod |
| 9 | In-App Messaging (Coach ↔ Client) | 60% | TrueCoach, Trainerize, TrainHeroic |
| 10 | Automatisierte Check-Ins & Habit Tracking | 55% | TrueCoach, Freeletics |

---

## Priorisierte Feature-Gap Liste für BASE

### 🔴 SOFORT (nächste 6 Wochen)

| Feature | Konkurrenten | Retention-Impact | Aufwand | Warum sofort? |
|---------|-------------|-----------------|---------|---------------|
| **Apple Health / Google Health Connect Integration** | Alle 10 Konkurrenten | **Hoch** | Mittel | Basis-Erwartung jeder Fitness-App. Ohne das fehlt Glaubwürdigkeit. Unified APIs statt 5 Einzelintegrationen. |
| **Social Activity Feed** | Hevy, Strava, JEFIT, MFP | **Hoch** (+40% Retention) | Mittel | Stärkster Retention-Treiber. Workout-Feed mit Kudos/Likes. BASE hat Brag Cards — erweitern zum Feed. |
| **Gamification: Streaks & Achievements** | Strava, Freeletics, JEFIT | **Hoch** (+25-45% Retention) | Einfach | Tägliche Login-Streaks, Workout-Milestones, Badges. Niedrigster Aufwand, höchster Impact. |
| **Ernährungstracking (Basis)** | MFP, Freeletics | **Hoch** | Mittel | Bereits geplant in Roadmap. Nutritionix API als Datenbank. Nicht MFP klonen — KI-gestütztes Makro-Tracking. |

### 🟡 NÄCHSTE 3 MONATE

| Feature | Konkurrenten | Retention-Impact | Aufwand | Details |
|---------|-------------|-----------------|---------|---------|
| **Übungsvideo-Bibliothek** | JEFIT (1.400+), TrueCoach (3.000+), Fitbod | **Mittel** | Komplex | Eigene Videos oder Lizenzierung. Mindestens 200 Grundübungen mit korrekter Form. |
| **Leaderboards & Challenges** | Strava (KOM/QOM), JEFIT | **Hoch** (+35% Retention) | Mittel | Gruppen-Challenges (z.B. "Wer schafft 100 Workouts in 30 Tagen?"). Push-Benachrichtigungen nutzen. |
| **Garmin Connect Integration** | Strava, Fitbod, TrueCoach | **Mittel** | Mittel | Garmin hat 25% Marktanteil bei Sportuhren. REST API verfügbar. Elite-Athleten erwarten das. |
| **In-App Coach-Client Messaging** | TrueCoach, Trainerize | **Hoch** (für PT-Retention) | Mittel | Chat-System für PT-Modus. Fotos, Videos, Feedback. Differenziert BASE von reinen Trackern. |
| **Apple Watch Companion (Basis)** | Hevy, Strong, JEFIT | **Mittel** | Komplex | PWA-Limitation: Kein nativer Watch-Support. Option: Minimale native Watch-App als Companion. |

### 🟢 SPÄTER (3-6 Monate)

| Feature | Konkurrenten | Retention-Impact | Aufwand | Details |
|---------|-------------|-----------------|---------|---------|
| **Native App Store Wrapper (TWA/Capacitor)** | Alle Konkurrenten | **Mittel** | Mittel | PWA hat <5% Discoverability vs. App Store. Capacitor-Wrapper für iOS/Android mit Push + Store Listing. |
| **KI Form-Korrektur via Kamera** | Freeletics (Rep-Counting) | **Mittel** | Komplex | Freeletics nutzt Kamera für Rep-Counting und Form-Feedback. Technisch anspruchsvoll, aber starkes Differenzierungsmerkmal. |
| **Oura / Whoop Integration** | TrueCoach | **Niedrig** | Mittel | Nischen-Wearables mit wachsendem Marktanteil. Recovery/HRV-Daten für den KI-Coach. |
| **White-Label für PT-Studios** | Trainerize | **Niedrig** | Komplex | Custom Branding + eigene Domain für Studios. Erst relevant bei >100 PT-Kunden. |
| **Marketplace für Coach-Programme** | TrainHeroic | **Niedrig** | Komplex | Coaches verkaufen Trainingspläne. Monetarisierung für Coaches. Erst bei größerer Coach-Community. |
| **Automatisierte Billing/Scheduling** | TrueCoach, Trainerize | **Mittel** (für PT) | Komplex | Stripe-Integration für PT-Abrechnung. Kalender-Integration für Session-Buchungen. |

---

## Was BASE BEREITS besser macht als die Konkurrenz

| Feature | BASE-Status | Konkurrenz-Status |
|---------|------------|------------------|
| **86 Sportarten** | ✅ Vorhanden | Kein Konkurrent hat >30 |
| **5 KI-Systeme** (Coach, Builder, PreHab, Co-Pilot, Analyse) | ✅ Vorhanden | Fitbod: 1 KI, Freeletics: 1 KI |
| **7 Sprachen** | ✅ Vorhanden | 9/10 Konkurrenten: nur Englisch |
| **PT-Modus + Athleten-Tracking** | ✅ Vorhanden | Nur TrueCoach/Trainerize (ab $49/Mo) |
| **Voller Offline-Modus** | ✅ Vorhanden (PWA) | Hevy/Strong: begrenzt, MFP: begrenzt |
| **Dark Theme** | ✅ Standard | Nicht alle bieten das |
| **Kostenloser Einstieg** | ✅ Geplant | Fitbod: kein Free-Tier |

---

## Was Personal Trainer 2025/2026 erwarten

Basierend auf der Recherche erwarten PTs von einer Coaching-Software:

1. **Übungsvideo-Bibliothek** (1.000+ Videos) — damit Kunden Übungen korrekt ausführen
2. **In-App Messaging** — direkte Kommunikation mit Kunden (Text, Foto, Video)
3. **Wearable-Daten** — Schlaf, HRV, Recovery-Daten der Kunden einsehen
4. **Automatisierte Check-Ins** — wöchentliche Fortschritts-Abfragen automatisieren
5. **Payment-Integration** — Abrechnung direkt in der App (Stripe, PayPal)
6. **Kalender-Integration** — Session-Buchung und Erinnerungen
7. **Client-Dashboard** — Übersicht über alle Kunden auf einen Blick
8. **Branded App** — eigenes Logo, Farben, ggf. White-Label
9. **Ernährungs-Pläne** — nicht nur Training, sondern ganzheitliches Coaching
10. **Progress-Fotos** — Vorher/Nachher-Vergleich automatisiert

**BASE-Status:** Punkte 7 und 8 (teilweise) sind vorhanden. Die anderen 8 Punkte fehlen noch.

---

## Wearable-Integrationen: Nachfrage-Ranking

| Wearable | Marktanteil | Daten | Empfehlung für BASE |
|----------|-----------|-------|-------------------|
| **Apple Watch / Apple Health** | ~50% Smartwatches | HR, Workouts, Schlaf, Schritte | **#1 Priorität** — Unified API, deckt iPhone-Nutzer ab |
| **Google Health Connect** | Android-Ökosystem | HR, Workouts, Schlaf, Schritte | **#2 Priorität** — Ein API für alle Android-Wearables |
| **Garmin** | ~25% Sportuhren | HR, GPS, HRV, Schlaf, VO2max | **#3 Priorität** — Elite-Athleten, REST API verfügbar |
| **Fitbit** | ~15% Fitness-Tracker | HR, Schlaf, Schritte | Via Google Health Connect abgedeckt |
| **Oura Ring** | Wachsend (Recovery-Fokus) | HRV, Schlaf, Temperatur | Später — Nische, aber wachsend |
| **Whoop** | Nische (Performance) | HRV, Strain, Recovery | Später — API begrenzt |
| **Polar** | ~5% Sportuhren | HR, GPS, Training Load | Später — kleiner Marktanteil |

---

## Social/Community Features die Retention treiben

| Feature | Retention-Boost | Beispiel-App | Empfehlung |
|---------|----------------|-------------|-----------|
| Activity Feed + Kudos | +40% | Strava, Hevy | **Sofort** — Erweiterung der Brag Cards zum Feed |
| Leaderboards / Segmente | +25-45% | Strava (KOM/QOM) | **3 Monate** — Angepasst für Multi-Sport |
| Gruppen-Challenges | +35% | Strava, Freeletics | **3 Monate** — z.B. "30-Tage Challenge" |
| Workout-Sharing | +20% | Hevy, Strava | **Sofort** — BASE hat Brag Cards, erweitern |
| Streak-System | +30% | Freeletics, Duolingo | **Sofort** — Login/Workout-Streaks mit Badges |
| Kommentare & Reaktionen | +15% | Hevy, Strava | **Sofort** — Auf geteilten Workouts |

**Kombinierter Effekt:** Social + Gamification können Day-30 Retention von ~4% (Branchendurchschnitt) auf 25%+ steigern.

---

## Empfohlene Reihenfolge der Implementierung

```
Woche 1-2:  Streaks + Achievements (einfachste Gamification)
Woche 3-4:  Activity Feed (Brag Cards → Social Feed)
Woche 5-6:  Apple Health / Google Health Connect
Woche 7-8:  Ernährungstracking (Basis mit Nutritionix API)
Monat 3:    Leaderboards + Challenges
Monat 3-4:  Garmin Connect Integration
Monat 4-5:  Übungsvideo-Bibliothek (200 Grundübungen)
Monat 5-6:  In-App Messaging (PT-Modus)
Monat 6+:   Native App Store Wrapper (Capacitor)
```
