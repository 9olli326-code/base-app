# BASE — Technical Due Diligence Report 2026

> Erstellt: 30. März 2026 | Für: Investor-Bewertung von BASE (base-app.tech)
> Analyst: KI-gestützte Code-Analyse + Architektur-Review
> Scope: Architektur, Sicherheit, Skalierung, Technical Debt, Empfehlungen

---

## EXECUTIVE SUMMARY

BASE ist eine ambitionierte PWA für universelles Sport-Tracking mit KI-Integration. Die Technologie-Wahl (Vanilla JS + Firebase + Gemini) ist agil und kostengünstig in der MVP-Phase, aber die Architektur zeigt erhebliche Reife-Defizite. Das kritische Risiko ist nicht der Tech-Stack, sondern die mangelnde Scalability-Vorbereitung und Sicherheitslücken.

**Investoren sollten wissen:** BASE ist ein starker MVP, aber technologisch nicht voll produktionsreif für B2B (Personal Trainer mit zahlenden Kunden). Ein Security Hardening Sprint (10 Stunden) ist vor Beta-Launch zwingend.

---

## 1. ARCHITEKTUR-BEWERTUNG

### 1.1 Ist Vanilla JS + Firebase die richtige Wahl?

**Ja, ABER mit Caveats.**

**Pro:**
- Zero Build-Tools = schnelle Iteration, geringe DevOps-Komplexität
- Firebase Auth + Firestore = automatische Skalierung ohne DBA
- Netlify Functions (Node.js) = kostenlos für <125k Requests/Monat
- PWA-First = native App-Feeling ohne App-Store-Gatekeeper
- Offline-First mit localStorage = gute UX

**Kontra:**
- **app.html = ~7.000+ Zeilen (~595 KB)** — Single-Point-of-Failure
- Jedes Deploy = Cache-Invalidation = alle Users müssen neu downloaden
- Code-Splitting fehlt komplett
- Zero Tree-Shaking = toter Code wird mitgesendet
- **100+ Funktionen direkt auf `window.*`** — unmaintainable nach 50k LoC
- Keine Module/Imports — Dependency-Tracking unmöglich
- i18n inline (7 Sprachen in einer Datei) — schwer zu updaten

**Verdict:** Vanilla JS ist kein Problem für MVP. Die monolithische Struktur wird bei 10k+ Users zum limitierenden Faktor. Die geplante Modularisierung existiert teilweise als Files (`js/base-ai.js`, `js/base-pt.js`), ist aber noch nicht vollständig integriert.

---

### 1.2 Skaliert die Architektur bis 100k Nutzer?

**Ja, aber mit versteckten Kosten und Architektur-Arbeit.**

Die Kern-Infrastruktur (Firebase + Netlify + Gemini) skaliert technisch linear. Die Kosten bleiben sub-linear zum Revenue. Das Problem liegt in der Applikations-Architektur (Monolith, fehlende Tests, fehlende Monitoring).

---

### 1.3 Single Points of Failure

| SPOF | Impact | Severity |
|------|--------|----------|
| **Firebase Outage** | App ist offline (Offline-Modus deckt nur Tracking) | CRITICAL |
| **Gemini API Outage** | AI-Features offline, kein Graceful Fallback implementiert | MAJOR |
| **app.html Parse Error** | Browser lädt ~595 KB, Parser-Fehler = komplett broken | CRITICAL |
| **localStorage Quota** | Bei 1000+ Workouts potentiell voll, alte Daten verschwinden | MAJOR |
| **Firebase Auth Token** | Nach 30+ Tagen offline abgelaufen, Cloud Sync bricht | MEDIUM |

---

## 2. SICHERHEIT

### 2.1 Bekannte Schwachstellen

#### 🔴 CRITICAL: Kein Rate Limiting auf Gemini API
- **Status:** UNFIXED
- **Risk:** Ein Skript das 1000x "AI Coach" aufruft kostet $1. Bei 100k Users: $100k/Tag möglich
- **Fix:** Server-Side Rate Limiting in Netlify Function (Firestore Atomic Counters)
- **Aufwand:** 6 Stunden

#### 🔴 CRITICAL: Keine CSRF Protection auf Netlify Functions
- **Status:** UNFIXED
- **Risk:** Attacker kann Push-Notifications/API-Calls im Namen von Users senden
- **Fix:** Origin-Validation auf allen Netlify Functions
- **Aufwand:** 2 Stunden

#### 🟡 MAJOR: Keine Input Validation auf Netlify Functions
- **Status:** Nur Null-Checks, keine Type-Validation
- **Risk:** Prompt Injection über Workout-Felder in Gemini-Prompts
- **Fix:** Strict JSON Schema Validation (Zod/Joi)
- **Aufwand:** 8 Stunden

#### 🟡 MAJOR: XSS-Risiko bei User-Generated Content
- **Status:** `_escapeHtml()` vorhanden, aber nicht überall eingesetzt
- **Risk:** ~20+ innerHTML-Stellen ohne Escaping identifiziert (Trainer-Branding, Client-Namen)
- **Fix:** DOMPurify Library + globaler Wrapper
- **Aufwand:** 6-8 Stunden

#### 🟡 MEDIUM: Firebase Firestore Rules unbekannt
- **Status:** Rules nicht im Repo sichtbar
- **Risk:** Wenn permissiv = User können andere User-Daten lesen/löschen
- **Fix:** Audit + Strict User-Based Rules
- **Aufwand:** 2 Stunden

#### ✅ Strava Client Secret
- **Status:** FIXED — Secret ist korrekt in `process.env`, nicht im Browser-Code
- **Empfehlung:** Git-History prüfen ob Secret je committed wurde

---

### 2.2 Was MUSS vor dem ersten zahlenden Kunden gefixt werden?

| Item | Status | Aufwand | Deadline |
|------|--------|---------|----------|
| **Gemini Rate Limiting (Server-Side)** | ❌ | 6h | VOR Beta |
| **CSRF Token auf Netlify Functions** | ❌ | 2h | VOR Beta |
| **Firestore Security Rules Audit** | ❓ | 2h | VOR Beta |
| **Input Validation + Type Checking** | ❌ | 8h | Vor GA |
| **XSS Audit + DOMPurify** | ⚠️ | 8h | Vor GA |
| **GDPR Data Processing Agreement** | ❌ | 40h (Legal) | Vor GA |

**Kritisch vor Bezahlstart:** Rate Limit + CSRF + Rules Audit = **10 Stunden Arbeit**

---

## 3. SKALIERUNG — Kosten bei Wachstum

### Firebase Firestore Kostenmodell

**Preise:**
- Read: $0,06 / 100k Reads
- Write: $0,18 / 100k Writes
- Storage: $0,18/GB/Monat

### Kosten-Projektion

| Szenario | Firestore/Mo | Gemini/Mo | Netlify/Mo | **Total/Mo** |
|----------|-------------|-----------|------------|-------------|
| **1k Users** | ~$50 | ~$2 | $0 | **~$60** |
| **10k Users** | ~$300 | ~$20 | $50 | **~$400** |
| **100k Users (normal)** | ~$2-3k | ~$200 | $100-150 | **~$2,5k** |
| **100k Users (PT-heavy)** | ~$5-8k | ~$400 | $150 | **~$6k** |

### Revenue vs. Costs bei 100k Users

```
Revenue: 20k Premium-Users × $9,99/Mo = $200k/Mo
Tech Costs: $3-5k/Mo
Margin: 97-98%
```

**Fazit:** Skalierungskosten sind NICHT das Problem. Firebase + Gemini reichen bis 500k Users ohne Re-Architecture. Die Kosten bleiben unter 3% des Umsatzes.

### Netlify Limits
- Free: 125k Function Invocations/Monat
- Pro ($20/Mo): 1M Invocations
- Bei 100k Users: ~300k Calls/Mo → Pro-Plan reicht ($50-100/Mo)

### Gemini API Kosten
- Aktuell: Gemini 2.5 Flash — sehr günstig ($0.075/1M Input Tokens)
- Bei 10k AI-Calls/Tag: ~$2/Tag = $60/Mo
- **KEIN Rate Limiting** = Kostenexplosion möglich bei Bug/Abuse

---

## 4. TECHNISCHE SCHULDEN

### 4.1 Der Monolith: app.html (~7.000+ Zeilen)

**Ist das nachhaltig?** Nein, nicht langfristig.

**Aktuelle Probleme:**
1. Keine Code-Splitting — Jede Seite lädt alles (PT-Modus, AI, Timer, Analytics)
2. Keine Tree-Shaking — Totes Code wird mitgesendet
3. Keine Dependency-Tracking — Was hängt von was ab?
4. Keine Type Safety — Vanilla JS = Runtime Errors
5. Testing unmöglich — Wie testet man ~6.000 LoC JS ohne Module?

**Parallel existierende Module:**
- `js/base-ai.js` — AI Coach Prompts (1,5 KB, gut modularisiert)
- `js/base-pt.js` — PT Business Logic (120 KB — riesig!)
- `js/base-settings.js` — Settings UI (23 KB)
- `js/base-timers.js` — Timer Logik (11 KB)
- `js/exercise-db.js` — Exercise Database (115 KB)

**Problem:** Diese Module werden separat geladen, aber nicht als echte Dependencies verwaltet.

### 4.2 Wie schwierig wäre ein Refactoring?

**3-Phasen-Plan:**

**Phase 1 (2 Wochen): State Layer extrahieren**
```javascript
// js/base-state.js — globale State + Storage
// Alles andere importiert davon
```

**Phase 2 (4 Wochen): ESM Module-System**
```html
<script type="module">
  import { initApp } from './js/base-state.js';
  import { PT } from './js/base-pt.js';
  import { AI } from './js/base-ai.js';
</script>
```

**Phase 3 (2 Wochen): Lazy Loading**
```javascript
// Nur PT-Module beim PT-Login laden
if (currentMode === 'pt') {
    const { PT } = await import('./js/base-pt.js');
}
```

**Ergebnis:** app.html → 200 KB initial statt 595 KB. PT-Code nur für Trainer. Timers nur bei aktivem Training.

**Gesamtaufwand:** ~8 Wochen für einen Entwickler

### 4.3 Weitere Technical Debt

| Bereich | Status | Aufwand |
|---------|--------|---------|
| **Automatisierte Tests** | Keine vorhanden | 4 Wochen (Playwright + Jest) |
| **Analytics/Funnel-Tracking** | Fehlt komplett | 2 Wochen (PostHog/Mixpanel) |
| **Error Monitoring** | Unklar | 1 Woche (Sentry) |
| **CI/CD Pipeline** | Netlify Auto-Deploy ✅ | Vorhanden |

---

## 5. EMPFEHLUNGEN

### Top 3 Technische Risiken

| # | Risiko | Impact | Wahrscheinlichkeit |
|---|--------|--------|-------------------|
| 1 | **Kein Rate Limiting auf KI-API** → unkontrollierte Kosten | $100k+/Tag bei Bug | Mittel |
| 2 | **CSRF Vulnerability** → Datenmissbrauch/Phishing | Reputation + Daten | Hoch |
| 3 | **Monolith ohne Code-Splitting** → Performance bei Scale | User Retention sinkt | Hoch (ab 50k Users) |

### Top 3 Sofort-Maßnahmen (vor Beta-Launch)

**1. Security Hardening Sprint (10 Stunden)**
- Server-Side Rate Limiting (6h)
- CSRF Token Validation (2h)
- Firestore Security Rules Audit (2h)

**2. Monitoring + Alerts einrichten (6 Stunden)**
- Gemini API Call Counter (Firestore Doc: `_meta/gemini_costs`)
- Firebase Cost Threshold Alert (wenn > $50/Tag)
- Cloud Function Error Rate

**3. Git-History bereinigen (2-4 Stunden)**
- Prüfen ob Secrets je committed wurden
- Falls ja: Secret Rotation + `git filter-branch`

**Summe: ~22 Stunden über 2 Wochen — sehr machbar für einen Entwickler**

### Wann braucht BASE einen zweiten Entwickler?

| User-Count | Revenue | Backend-Load | Team Size |
|-----------|---------|-------------|-----------|
| 1k | $2k/Mo | 2-3 h/Woche | 1 (Founder OK) |
| 10k | $20k/Mo | 10-15 h/Woche | 1 (eng) |
| **50k** | **$100k/Mo** | **30-40 h/Woche** | **1,5 FTE nötig** |
| 100k+ | $200k+/Mo | 50+ h/Woche | 2-3 FTE |

**Heuristik:** Wenn der Gründer anfängt Bugs zu ignorieren, ist die Grenze erreicht.

**Konkret für BASE:**
- **Bis 10k Users:** Ein Entwickler + Gründer bei 50% DevOps
- **Ab 50k Users:** Full-Time Backend Engineer dazu
- **Ab 100k Users:** + Full-Time Frontend Engineer, Gründer wird PM

---

## Code Quality Metrics

| Metrik | Beobachtung | Rating |
|--------|-------------|--------|
| Monolith Size | ~7.000+ Zeilen (app.html) | 🔴 Poor |
| Type Safety | Keine Types (Vanilla JS) | 🔴 Poor |
| Test Coverage | Keine automatisierten Tests | 🔴 Critical |
| Error Handling | Try-Catch vorhanden, nicht comprehensive | 🟡 Medium |
| Documentation | CLAUDE.md ist gut, Code-Comments spärlich | 🟡 Medium |
| Security | Firebase Secrets OK, XSS teilweise, CSRF fehlt | 🟡 Medium |
| PWA/Caching | Service Worker Cache-First-Strategy | 🟢 Good |
| Offline Support | localStorage Fallback korrekt | 🟢 Good |
| i18n | 7 Sprachen implementiert | 🟢 Good |

---

## Investment-Empfehlung

**✅ INVEST — mit bedingtem Go/No-Go**

**Bedingungen:**
- [ ] Security Hardening Sprint (10h) vor Beta
- [ ] Firestore Rules Audit (2h)
- [ ] Rate Limiting auf Gemini API
- [ ] Commitment zu Modularisierung Phase 1 innerhalb 6 Monaten

**Finanzielles Risiko-Profil:**
- MVP bis 10k Users: Sicher skalierbar, Margin >95%
- 10k-100k Users: Rate Limiting + CSRF essentiell
- 100k+ Users: Modularisierung MUSS abgeschlossen sein

---

## 12-Monats-Technologie-Roadmap

| Quartal | Maßnahmen | Kosten |
|---------|----------|--------|
| **Q2 2026** | Security Sprint, Monitoring, Beta Launch | $0 (Eigenleistung) |
| **Q3 2026** | Modularisierung Phase 1, Test Suite, GDPR Audit | $3-5k (Legal) |
| **Q4 2026** | ESM Modules, Lazy Loading, Analytics | $500/Mo (Tools) |
| **Q1 2027** | Performance Audit, A/B Testing | $500/Mo |
| **Q2 2027** | Backend Engineer einstellen | $80-120k/Jahr |

**18-Monats Tech-Budget: ~$40-60k** (40% Developer, 30% Security/Compliance, 20% Tooling, 10% Contingency)
