# BASE — Projekt-Kontext für Claude Code (Stand: April 2026)

## Was ist BASE?
BASE ist eine KI-getriebene All-in-One Fitness PWA für alle Sportarten. 86 Sportarten, 882 Übungen, 11 KI-Features, PT Business Mode, 7 Sprachen. Solo-Founder Projekt von Oliver Angermann.

**Domain:** base-app.tech
**Firebase:** beastmode-17f0d
**App-ID:** base-v2-beta-test
**GitHub:** github.com/9olli326-code/base-app
**Netlify:** base-tracker
**TikTok:** @basetracker1

---

## Tech-Stack
- **Frontend:** Vanilla JS, Tailwind CSS (Production Build), Lucide Icons
- **Backend:** Firebase Auth + Firestore, Netlify Serverless Functions
- **KI:** Google Gemini 2.5 Flash via Netlify Function (gemini.js) — Server-Side Prompts
- **PWA:** Service Worker (sw.js), Manifest, Offline-Modus
- **Push:** Web Push via VAPID (push.js + push-scheduler)
- **Strava:** OAuth via Netlify Function (strava-token.js)
- **Payments:** Stripe Checkout + Webhook (stripe-checkout.js, stripe-webhook.js)
- **Monitoring:** Sentry (lazy loaded), Google Analytics

---

## Dateistruktur & Größen

### Frontend (App)
```
app.html                    343 KB   HTML + CSS + kleine inline Scripts, 38 Modals
js/app-core.js              562 KB   Haupt-Logik (200+ window.* Funktionen)
js/app-core.min.js          420 KB   Minified
js/base-ai.js                73 KB   KI-Features (32 Funktionen)
js/base-ai.min.js            54 KB   Minified
js/base-pt.js               203 KB   PT Business Mode (115 Funktionen)
js/base-pt.min.js           150 KB   Minified
js/muscle-map.js              25 KB   Muskel-Ranking SVG Map
js/muscle-map.min.js          18 KB   Minified
js/base-settings.js          31 KB   Profil, Module, Onboarding
js/base-settings.min.js      23 KB   Minified
js/base-timers.js             13 KB   Rest/Workout/HIIT Timer
js/base-timers.min.js          9 KB   Minified
js/exercise-db.js            114 KB   882 Übungen (DE+EN, bodyPart, target)
js/exercise-db.min.js        112 KB   Minified
js/firebase-init.js           25 KB   Firebase Auth + Cloud Sync + Google Sign-In
js/firebase-init.min.js       18 KB   Minified
js/i18n-data.js              203 KB   7 Sprachen (de, en, fr, es, it, nl, ar)
design-override.css           33 KB   Custom Styles, CSS Variables, Zen Flow + Carbon Elite
```

### Frontend (Landing + SEO)
```
index.html                  426 KB   Landing Page (Stitch Design + Screenshots)
datenschutz.html                     GDPR Privacy Policy
impressum.html                       TMG §5 Impressum
blog/                                SEO Blog-Seiten
sport/                               15 Sport-spezifische SEO-Seiten
```

### Backend (Netlify Functions)
```
netlify/functions/gemini.js          Gemini API Proxy + Rate Limiting (@netlify/blobs) + Training Data Collector
netlify/functions/push.js            Web Push senden
netlify/functions/push-scheduler.js  Scheduled Push (Cron)
netlify/functions/strava-token.js    Strava OAuth Token Exchange
netlify/functions/stripe-checkout.js Stripe Checkout Session erstellen
netlify/functions/stripe-webhook.js  Stripe Webhook Handler
netlify/functions/usercount.js       User Counter
```

### PWA + Config
```
sw.js                       Service Worker (Cache v152, Stale-While-Revalidate)
manifest.json               PWA Manifest
netlify.toml                Redirects, Functions, Headers
robots.txt                  SEO
sitemap.xml                 SEO
```

### Android
```
android/                    Capacitor TWA Wrapper für Google Play Store
BASE-Android.apk            Signed APK
```

---

## Script-Ladereihenfolge (WICHTIG!)

```html
1. <script> inline          Kleine Blöcke: Theme-Apply, Design Morph Flag
2. js/i18n-data.js          Synchron — muss vor app-core.js geladen sein
3. js/app-core.min.js       Synchron — Haupt-Logik, definiert alle window.* Funktionen
4. js/exercise-db.min.js    defer — Übungsdatenbank
5. js/base-timers.min.js    defer — Timer
6. js/base-ai.min.js        defer — KI Features
7. js/base-settings.min.js  defer — Settings + Onboarding
8. js/base-pt.min.js        defer — PT Business Mode (überschreibt einige Funktionen wie switchPTTab)
9. js/firebase-init.min.js  type="module" — Firebase Auth (läuft immer NACH defer Scripts)
```

**Regel:** Funktionen die in mehreren Dateien definiert werden: Die LETZTE geladene Definition gewinnt. base-pt.js überschreibt z.B. switchPTTab und switchMode aus app-core.js.

---

## Design System

### Zwei visuelle Modi:
- **Zen Flow (Athlet):** Sage Green #a3c9a8, Dark Forest #0f110f, 18px Radius, Sora/Outfit Fonts
- **Carbon Elite (PT):** Gold #d4af37, Pure Black #0a0a0a, 8px Radius, Sora/Outfit Fonts

### CSS Variables (in :root):
```css
--primary-hex: #a3c9a8;
--secondary-hex: #7aab82;
--bg-hex: #0f110f;
--surface-hex: color-mix(in srgb, var(--bg-hex), white 5%);
--inner-bg-hex: color-mix(in srgb, var(--bg-hex), black 30%);
--border-hex: color-mix(in srgb, var(--bg-hex), white 10%);
--text-main: #f4f4f5;
--text-muted: #82828c;
```

### Kategorie-Farben:
- Kraft: Sage Green #a3c9a8
- Ausdauer: Coral #e88a8a
- Mobility: Blue #8aafe8
- Mein Sport: Gold #e8c86a

---

## Features (vollständig implementiert)

### Workout Tracking
- 86 Sportarten mit dynamischen KI-Formularen
- 882 Kraft-Übungen mit Bildern (CDN), DE+EN, Autocomplete
- Sets/Reps/Gewicht + RIR (Reps in Reserve) + +/- Buttons
- Satz-Markierungen (Warmup, Failure, Drop-Set)
- Übung ersetzen mit Match-% (basierend auf bodyPart + target)
- PR-Tracking mit Celebration Animation
- Auto Rest-Timer, Workout-Timer, HIIT Timer
- Strava Integration (OAuth Import)
- Voice Input (Web Speech API)
- CSV Export

### KI Features (11 Funktionen via Gemini 2.5 Flash)
- Coach (Trainingsanalyse)
- Copilot (Übungsspezifische Empfehlungen)
- Scan (Progressionsanalyse)
- Plan (Trainingsplan-Generator mit Mesozyklus-Periodisierung)
- PreHab (Verletzungsprävention)
- Warmup Generator
- Exercise Recommendation
- Smart Workout Generator
- Form Builder (dynamische Sport-Formulare)
- Form Check (Kamera → Gemini Vision, Beta + Disclaimer)
- KI Chat (15 free/Tag, Coach Nudge nach Workout)

### Plan Generator (erweitert)
- Mesozyklus-Periodisierung (Akkumulation → Overreach → Deload)
- Sets-Multiplikator pro Woche (×1.0, ×1.1, ×1.2, ×0.6)
- Fokus-Muskelgruppen wählen (Ober-/Unterkörper/Core)
- Schmerzbereiche als klickbare Chips
- Wochentag-Zuweisung mit "Gleichmäßig verteilen"

### Analytics
- Progress Charts (Chart.js)
- Body Tracker
- Heatmap (Trainings-Häufigkeit)
- Kalender
- 1RM Calculator
- Muscle Balance Analyse (Push/Pull Ratio, Upper/Lower, Verteilung)
- Streak Tracking

### PT Business Mode (81 Funktionen in base-pt.js)
- Design Morphing (Zen Flow ↔ Carbon Elite)
- Client Management (CRUD, Onboarding-Wizard, Profile)
- Session Planner (Kalender, Templates, Custom Types mit Icon-Picker)
- Quick Track (6 Metrik-Typen: setsRepsWeight, distanceDuration, holdRounds etc.)
- Compliance Tracking (SVG-Ringe, Woche/Monat/Gesamt)
- Client Portal (Token-basiert via crypto.randomUUID)
- KI Wochenbericht pro Kunde
- KI Check-In mit WhatsApp-Sharing
- PDF Export (jsPDF, Branding, Charts)
- Trainer Directory (Firestore, Reviews, Google Maps Fallback)
- Trainer Branding (Logo, Name, Farbe, Tagline)

### Gamification
- XP System (50 XP/Workout, 15 Coach, 25 Scan, 40 Plan, 30 Challenge, 500 Goal)
- Level 1-99 mit 5 Rängen (Rookie → Contender → Veteran → Elite → Legend)
- XP-Bar unter Header (Sage Green)
- Level-Up Fullscreen Animation
- Persönliche Ziele ("100kg Bankdrücken bis Juli") mit 500 XP Bonus
- Streak-Bonus (7 Tage = 200 XP, 30 Tage = 1000 XP)

### Social
- Challenges (CRUD, Anonym beitreten, Leaderboard, Share)
- Brag Cards (Canvas 1080×1920, Share API, "base-app.tech" Watermark)
- WhatsApp Sharing

### Voice Coach (optional, Toggle in Settings)
- Web Speech Synthesis API (kostenlos, offline)
- 7 Sprachen
- Ansagen bei: Set-Completion, PR, Rest-Timer (30s, 10s, 3-2-1), Workout-Ende
- Visueller "VOICE" Indikator oben rechts

### Retention
- 5 Hooks: First Workout, Day 2, Streak, Win-Back (7+ Tage), Challenge Suggest
- Activity Tracking (Visits, Workouts, Zeitstempel)
- Streak Warning ("Deine 12-Tage Streak endet bald!")
- KI Coach Nudge nach jedem Workout
- KI Discovery Hints im Tools-Tab

### Monetarisierung (vorbereitet, INAKTIV)
- Feature-Gating: window._GATING_ACTIVE = false (Master-Switch)
- Aktivierung per Firebase Console: artifacts/base-v2-beta-test/public/config → gatingActive: true
- Free Limits: Coach 3x/Tag, Plan 1x/Monat, Scan 1x/Woche, Challenge 1x/Tag, PT max 2 Kunden
- Stripe Checkout + Webhook deployed
- Pricing: Athlete PRO 4,99€/Mo, PT Elite 19,99€/Mo

### Security
- Gemini Rate Limiting: @netlify/blobs, Multi-Tier (Coach 15, Plan 3, Global 60/Tag)
- Prompt Injection: User-Daten in <user_data> XML-Tags, System Directive
- XSS: _escapeHtml() + _sanitizeAIHtml() auf allen User-Inputs
- Client Portal: crypto.randomUUID Token mit Validierung
- Firebase Rules: Alle Pfade geschützt (eigene Daten nur für eigenen User)
- CORS: Netlify Functions Origin-Check

### Accessibility
- aria-label auf allen Buttons
- Focus-Styles (outline: 2px solid #a3c9a8)
- prompt() durch Custom Modals ersetzt
- aria-live="polite" auf Toast, KI-Chat, AI-Output (April 2026)
- Farbkontrast #82828c → #9898a2 in app.html (April 2026)
- inputmode="numeric" auf allen Zahlen-Inputs (Reps, Gewicht, RIR, HR)

### Fixes April 2026
- Anti-Halluzination in Plan Generator (NSCA/Schoenfeld/Zourdos Referenzen)
- Injuries an Smart Workout Prompt gesendet
- AbortController + 25s Timeout auf Plan Generator
- HTTP-Timeout 22s auf Gemini Server-Side Request
- DSGVO: Training Data Collection auf 100 Chars + Name-Anonymisierung
- localStorage 5MB Limit Warnung + Auto-Cleanup
- Strava alert() → showToast()
- 8 console.error → User-facing Toast Meldungen
- Plausible Analytics auf Landing Page
- og:image + canonical + JSON-LD Schema auf Landing Page

### i18n
- 7 Sprachen: de, en, fr, es, it, nl, ar
- 773+ Keys in i18n-data.js
- window.t('key', 'fallback') für dynamische Texte
- data-i18n Attribute für statische HTML-Texte
- Monatsnamen + Wochentage internationalisiert

---

## Firebase Firestore Pfade

```
artifacts/base-v2-beta-test/users/{uid}/workouts/{id}          Persönliche Workouts
artifacts/base-v2-beta-test/users/{uid}/clients/{cid}/workouts  Kunden-Workouts
artifacts/base-v2-beta-test/users/{uid}/pt_data/clients_list   Kundenliste
artifacts/base-v2-beta-test/users/{uid}/pt_data/client_workouts_{cid}
artifacts/base-v2-beta-test/users/{uid}/pt_data/client_profile_{cid}
artifacts/base-v2-beta-test/users/{uid}/pt_data/sessions       PT Sessions
artifacts/base-v2-beta-test/users/{uid}/pt_data/xp_progress    XP + Level
artifacts/base-v2-beta-test/users/{uid}/pt_data/goals          Persönliche Ziele
artifacts/base-v2-beta-test/public/stats                       User Counter
artifacts/base-v2-beta-test/public/config                      Remote Config (Feature-Gating)
challenges/{id}                                                 Challenges
trainer_profiles/{uid}                                          Trainer Directory
trainer_reviews/{id}                                            Reviews
push_subscriptions/{uid}                                        Push Tokens
ai_usage/{uid}                                                  KI Usage Counter
```

---

## localStorage Keys (40+)

### Workouts & Tracking
- `beastmode_v2_cache` — Persönliche Workouts
- `beastmode_v2_cache_${clientId}` — Kunden-Workouts
- `beastmode_v2_clients` — Kundenliste
- `beastmode_v2_multi_schemas` — Custom Sport-Schemas

### PT Business
- `base_pt_sessions` — Session Planner
- `base_pt_session_templates` — Session Templates
- `base_pt_custom_session_types` — Custom Session Typen
- `base_pt_onboard_specs` — PT Onboarding Daten
- `base_client_profile_${clientId}` — Kundenprofile
- `base_portal_token_${clientId}` — Client Portal Tokens
- `base_trainer_logo` — Trainer Logo (Base64)
- `base_trainer_branding` — Trainer Name/Farbe/Tagline

### Gamification & Goals
- `base_xp_data` — XP, Level, History, Daily Counts
- `base_goals` — Persönliche Ziele
- `base_streak_count` / `base_streak_last_date` — Streak

### Retention & Activity
- `base_activity_log` — Letzte 30 Aktivitäten
- `base_first_visit` / `base_last_active` / `base_last_workout`
- `base_visit_count` — Besuchszähler
- `base_retention_dismissed` — Welche Hooks dismissed wurden
- `base_coach_nudge_date` — Letzter Coach Nudge
- `base_ki_discovery` — Welche KI-Features schon genutzt wurden

### Feature Gating
- `base_gate_${feature}` — Usage Counter pro Feature
- `base_plan` — Aktueller Plan (free/pro/elite)
- `base_usage` — Feature Usage Tracking

### Settings & UI
- `beastmode_v2_theme` — Theme Farben
- `beastmode_lang` — Sprache
- `base_voice_coach` — Voice Coach Toggle (true/false)
- `base_onboarding_done` — Onboarding abgeschlossen
- `base_custom_tabs` / `base_tab_order` — Tab-Konfiguration
- `base_default_mode` — personal oder pt

---

## Coding-Regeln (PFLICHT)

### Grundregeln
1. **Kein Framework** — Kein React, Vue, Svelte. Reines Vanilla JS.
2. **Kein Build-Tool** — Kein Webpack, Vite. Einfache `<script src="..." defer>` Tags.
3. **Alle Funktionen auf `window.*`** — Damit HTML onclick und andere Module sie erreichen.
4. **Mobile First** — Alles muss auf iPhone SE (375px) funktionieren.
5. **Offline-fähig** — Kritische Daten in localStorage. Firebase ist Cloud-Backup.

### Security-Regeln
6. **XSS-Schutz** — `window._escapeHtml()` für ALLE User-Inputs in innerHTML.
7. **KI-Antworten** — `window._sanitizeAIHtml()` für alle Gemini-Responses in innerHTML.
8. **Kein Raten** — "Hinterfrage deine Antwort, kein Raten" — immer im Code verifizieren.

### UI-Regeln
9. **pointer-events-auto** — Auf JEDEM klickbaren Element (Buttons, Labels, Inputs). iOS Safari Touch-Bug.
10. **aria-label** — Auf JEDEM Button. Accessibility.
11. **Lucide Icons** — `window._refreshLucide()` statt direkt `lucide.createIcons()`. Debounced.
12. **Tailwind** — Nur Klassen aus `tailwind-production.css`. Keine CDN.

### Performance-Regeln
13. **Min-Dateien** — Nach JEDER JS-Änderung: `npx terser js/datei.js -o js/datei.min.js --compress --mangle`
14. **SW Cache** — Version in sw.js nach JEDEM Deploy erhöhen.
15. **Lazy Loading** — `loading="lazy"` auf allen Bildern. `onerror="this.style.display='none'"` als Fallback.
16. **Kein großes Batch auf app.html** — 343KB Datei kann Node.js Heap overflow verursachen. Bei Problemen: `set NODE_OPTIONS=--max-old-space-size=8192`

### i18n-Regeln
17. **Keine hardcoded Strings** — `window.t('key', 'Fallback')` für dynamische Texte, `data-i18n="key"` für HTML.
18. **KI Tool-Namen bleiben englisch** — Coach, Scan, Planner, Battery, Armor in allen 7 Sprachen.

### Gemini-Regeln
19. **Multi-Part Response** — Gemini 2.5 Flash ist ein Thinking Model. Immer alle `parts` iterieren, letzten text-Part nehmen.
20. **Parallel Calls** — `Promise.all` für Training Plan Generation (Netlify 26s Timeout).
21. **Error Handling** — Jeder fetch braucht: AbortController (30s), res.ok Check, 429 Check, catch mit User-Toast.

### Git-Regeln
22. **firebase-admin-key.json** — In .gitignore! Darf NIE auf GitHub.
23. **Commit Messages** — Deutsch, beschreibend: "Feature: Übungsbilder aus CDN" oder "Fix: Firestore-Pfade korrigiert"

---

## Dev Environment
- **Rechner:** Samsung Galaxy Book (Windows)
- **Pfad:** `C:\Users\olli-\Desktop\Base-App\` (Achtung: Hyphen im Username)
- **Windows sed:** Keine leeren Anführungszeichen verwenden
- **Workflow:** Claude Desktop → Befehle/Prompts → Claude Code CLI → grep verify → `npx netlify deploy --prod`

---

## Selbst-Verifikation (PFLICHT bei jeder Änderung)

### Nach JEDER JS-Änderung:
```bash
node -c js/dateiname.js && echo "OK"
npx terser js/dateiname.js -o js/dateiname.min.js --compress --mangle
```

### Nach JEDER HTML-Änderung:
```bash
# Inline Scripts prüfen
node -e "var fs=require('fs');var c=fs.readFileSync('app.html','utf8');/* ... */"
```

### VOR jedem Deploy:
```bash
grep "CACHE_NAME" sw.js | head -1    # Cache Version erhöht?
grep "pointer-events-auto" app.html | wc -l   # Alle Buttons?
npx netlify deploy --prod
```

### Debugging-Prinzip:
- ERST lesen, DANN ändern, DANN verifizieren.
- Kein Raten. Im Zweifel: grep, nicht annehmen.
- Bei Heap Overflow: `set NODE_OPTIONS=--max-old-space-size=8192` oder frische Claude Code Session.

---

## Bekannte Einschränkungen
- **localStorage Caching** — Alte Theme-Keys können :root Defaults überschreiben. Bei Bugs: Cache leeren.
- **CSS Stacking Context** — z-index ist irrelevant zwischen Elementen inside vs. outside `<main>`. Modals müssen AUSSERHALB von `<main>` stehen.
- **iOS Safari** — Touch Events auf Buttons in verschachtelten `overflow-y-auto` Containern: Immer native radio/label oder pointer-events-auto nutzen.
- **i18n Schema Labels** — Nie übersetzte Strings in localStorage speichern. Immer `window.t()` zur Render-Zeit nutzen.

---

## User-Metriken (Stand April 2026)
- 806+ anonyme User (Feb: 31, März: 746, April: 29)
- 15 registrierte User (davon 8 Spam)
- 1.8% Conversion (anon → email)
- 30 AI-Usage User (~50 Calls)
- 3 Push Subscriber
- 0 aktive Challenges, 0 Feedback, 0 Trainer Profiles
- Cloud Sync funktioniert seit Firestore-Pfad Fix (vorher kaputt)

---

## Kontakt
Oliver Angermann
Akazienweg 7, 49808 Lingen
support.base-app@proton.me

---

## Landing Page — Design & Code Standards

### Role
Senior UI/UX Engineer Mindset: Awwwards-Level Qualität. Obsession für Micro-Interactions, Typografie, Whitespace und Performance.

### Design Principles
- Clarity over cleverness
- Whitespace is a feature, not empty space
- Every animation must have a purpose
- Mobile-first, but desktop-refined
- Accessibility is non-negotiable (WCAG AA minimum)
- Performance budget: LCP < 2s, CLS < 0.1

### Tech Stack (Landing Page)
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- shadcn/ui for base components
- Framer Motion + GSAP for animations
- Lucide icons

### Code Standards (Landing Page)
- Semantic HTML
- No inline styles — Tailwind only
- Component-driven, reusable
- Comments only for non-obvious logic

### Forbidden
- Generic purple/blue gradient hero backgrounds
- Stock hero illustrations
- "Lorem ipsum" — always ask for real copy
- Default shadcn color palette without customization
