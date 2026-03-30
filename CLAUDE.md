# BASE — Projekt-Kontext für Claude Code

## Was ist BASE?
BASE ist eine KI-getriebene Progressive Web App (PWA) für universelles Sport-Tracking. Alles läuft als Single-Page-App ohne Framework — reines HTML, CSS (Tailwind Production Build), und Vanilla JavaScript. Gehostet auf Netlify, Backend via Firebase + Netlify Functions.

## Tech-Stack
- **Frontend:** Vanilla JS, Tailwind CSS (Production Build in `tailwind-production.css`), Lucide Icons
- **Backend:** Firebase Auth + Firestore (Cloud Sync), Netlify Serverless Functions
- **KI:** Google Gemini 2.5 Flash via Netlify Function (`gemini.js`) — Server-Side Prompts
- **PWA:** Service Worker (`sw.js`), Manifest (`manifest.json`), Offline-Modus
- **Push:** Web Push via VAPID (`push.js` + `push-scheduler` Netlify Scheduled Function)
- **Strava:** OAuth Integration via Netlify Function (`strava-token.js`)

## Dateistruktur
```
app.html          — Die GESAMTE App (~8.400 Zeilen) — HTML + CSS + JS in einer Datei
index.html         — Landing Page (Marketing)
firebaselogic.js   — Firebase Auth + Firestore Sync (separates ES Module)
gemini.js          — Netlify Function: Gemini KI Proxy
push.js            — Netlify Function: Web Push Senden
strava-token.js    — Netlify Function: Strava OAuth Token Exchange
sw.js              — Service Worker (Caching + Push Handler)
manifest.json      — PWA Manifest
tailwind-production.css — Kompiliertes Tailwind CSS
netlify.toml       — Netlify Config (Redirects, Functions)
```

## Architektur-Problem
`app.html` ist ein Monolith mit ~8.400 Zeilen. Alles ist in einer Datei: HTML, CSS-Overrides, und ~6.000 Zeilen JavaScript. Das macht Wartung, Debugging und Zusammenarbeit schwierig.

### Geplante Modularisierung (siehe `BASE_Architektur_Migration.md`):
```
app.html            → ~1.500 Zeilen (nur HTML + CSS + State-Init)
js/base-state.js    → Shared State, Konstanten, Globale Variablen
js/base-ui.js       → Modals, Tabs, Toasts, Navigation
js/base-ai.js       → AI Coach, Co-Pilot, PreHab, Builder
js/base-workouts.js → Tracking, Tabelle, Filter, Formulare
js/base-analytics.js → Charts, Body Tracker, PRs, Kalender
js/base-pt.js       → PT Business Modus (Kunden, Sessions, Kalender, Quick-Track)
js/base-settings.js → Profil, i18n, Design, Onboarding
js/base-social.js   → Brag Cards, Share, Invite, Challenges
js/base-timers.js   → Rest Timer, Workout Timer, HIIT
js/base-nutrition.js → Ernährungstracking (NEU)
firebaselogic.js    → Auth + Cloud Sync (bleibt)
```

## Wichtige Patterns
- **Alle Funktionen auf `window.*`** — Kein Modul-System, alles global via `window.functionName = function() {...}`
- **Shared State:** Variablen wie `workouts`, `clients`, `currentMode`, `currentClient`, `currentCategory` sind global im Haupt-Script-Block deklariert
- **i18n:** 7 Sprachen (DE, EN, FR, ES, IT, NL, AR) als `i18nData`-Objekt inline
- **localStorage Keys:**
  - `beastmode_v2_cache` — Persönliche Workouts
  - `beastmode_v2_cache_${clientId}` — Kunden-Workouts
  - `beastmode_v2_clients` — Kundenliste
  - `base_pt_sessions` — PT Session-Planer
  - `base_client_profile_${clientId}` — Kundenprofile
  - `beastmode_v2_multi_schemas` — Custom Sport-Schemas
  - `base_trainer_logo` — Trainer Logo (Base64)
  - `base_trainer_branding` — Trainer Name/Farbe/Tagline
- **Firebase:** ES Modules via CDN, Auth + Firestore in `<script type="module">` am Ende von `app.html`
- **Lucide Icons:** `lucide.createIcons()` muss nach jedem DOM-Update aufgerufen werden

## Coding-Regeln
1. **Kein Framework** — Kein React, Vue, Svelte. Reines Vanilla JS.
2. **Kein Build-Tool** — Kein Webpack, Vite, Rollup. Einfache `<script src="..." defer>` Tags.
3. **Alle Funktionen auf `window.*`** — Damit sie aus HTML-onclick und anderen Modulen erreichbar sind.
4. **XSS-Schutz** — `window._escapeHtml()` für alle User-Inputs bevor sie in innerHTML landen.
5. **DRY** — Keine doppelten Funktionen. Zentrale Data Layer (`getClientWorkouts()`, `computeClientStats()`).
6. **Mobile First** — Alles muss auf iPhone SE (375px) gut aussehen.
7. **Offline-fähig** — Kritische Daten in localStorage. Firebase ist optional (Cloud Sync).
8. **Tailwind Klassen** — Nur Klassen aus `tailwind-production.css` verwenden. Keine CDN.
9. **Design-System:** Dark Theme, Indigo (#6366f1) als PT-Farbe, Cyan (#06b6d4) als Primary.
10. **Performance:** `_refreshLucide()` statt überall `lucide.createIcons()`. Client-Workout-Cache nutzen.

## Sicherheits-Hinweise
- Strava Client Secret ist noch im Browser-Code (muss in Netlify Function verschoben werden)
- KI-Calls haben kein Rate Limiting (max 20/Tag pro User fehlt noch)
- Push-Subscriptions werden in Firestore unter `push_subscriptions/{uid}` gespeichert

## Deploy
- Netlify Auto-Deploy via Git Push
- Netlify Functions in `/netlify/functions/` (oder Root für legacy)
- Domain: base-app.tech

## Sprache
Der Entwickler spricht Deutsch. Code-Kommentare und Commit-Messages auf Deutsch.

## Selbst-Verifikation (PFLICHT bei jeder Änderung)

### Nach JEDER CSS-Änderung:
1. Lies die geänderte CSS-Datei und prüfe: Werden die neuen Variablen/Werte tatsächlich in den Selektoren verwendet die du ändern wolltest?
2. Suche mit grep nach dem alten Wert — er darf NICHT mehr vorkommen (außer in Fallbacks oder Kommentaren).
3. Beispiel: `grep -n "rgba(163,201,168" design-override.css` → Wenn du die ersetzen solltest, darf hier nichts mehr stehen.

### Nach JEDER JS-Änderung:
1. Suche die geänderte Funktion und prüfe ob sie syntaktisch korrekt ist.
2. Prüfe ob alle IDs die saveWorkout() liest noch im generierten HTML existieren.

### Nach JEDER HTML-Änderung:
1. Prüfe ob die geänderte Stelle keine kaputten Tags hat.

### VOR jedem Deploy:
1. Prüfe dass sw.js Cache-Version erhöht wurde: `grep "cache-v" sw.js | head -1`
2. Wenn design-override.css geändert wurde: Zeige die relevanten Zeilen als Beweis dass die Änderung drin ist.
3. Mache KEINEN Deploy bevor die Verifikation gezeigt wurde.

### Debugging-Prinzip:
- Bevor du rätst was falsch sein könnte: LIES die aktuelle Datei.
- Immer ERST lesen, DANN ändern, DANN verifizieren.
