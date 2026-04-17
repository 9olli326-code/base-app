// netlify/functions/cost-check.js
// Tägliche Cost-Summary für BASE — loggt geschätzte Gemini-Kosten basierend auf
// rate-limits Blob-Store. Läuft 1x täglich per Cron (20:00 UTC = 22:00 MEZ).
// Bei Überschreitung einer Schwelle: console.error (sichtbar im Netlify Dashboard).

const { schedule } = require('@netlify/functions');
const { getStore, connectLambda } = require('@netlify/blobs');

// Durchschnittliche Kosten pro Gemini 2.5 Flash Call
// Basis: 2500 input + 500 output tokens
// Input: 2500 × $0.30/1M = $0.00075
// Output: 500 × $2.50/1M = $0.00125
// Summe: ~$0.002
const COST_PER_CALL_USD = 0.002;
const ALERT_THRESHOLD_USD = 5.0;

const handler = async (event) => {
  try { connectLambda(event); } catch(e) { console.warn('connectLambda failed:', e.message); }
  const today = new Date().toISOString().split('T')[0];
  try {
    const store = getStore('rate-limits');
    const list = await store.list();
    let totalCalls = 0;
    let userCount = 0;
    const planBreakdown = { free: 0, pro: 0, elite: 0 };

    for (const entry of list.blobs || []) {
      if (!entry.key.endsWith('_' + today)) continue;
      try {
        const raw = await store.get(entry.key);
        const data = JSON.parse(raw);
        const t = data.total || 0;
        totalCalls += t;
        userCount++;
        const p = data.plan || 'free';
        if (planBreakdown[p] !== undefined) planBreakdown[p] += t;
      } catch(e) {
        // Ignore malformed entries
      }
    }

    const estimatedCostUSD = totalCalls * COST_PER_CALL_USD;
    const estimatedCostEUR = estimatedCostUSD * 0.92;

    const summary = {
      date: today,
      totalCalls,
      userCount,
      estimatedCostUSD: estimatedCostUSD.toFixed(2),
      estimatedCostEUR: estimatedCostEUR.toFixed(2),
      planBreakdown,
      threshold: ALERT_THRESHOLD_USD,
      alert: estimatedCostUSD > ALERT_THRESHOLD_USD
    };

    if (summary.alert) {
      console.error('[COST-ALERT]', JSON.stringify(summary));
    } else {
      console.log('[cost-check]', JSON.stringify(summary));
    }

    return { statusCode: 200, body: JSON.stringify(summary) };
  } catch(e) {
    console.error('[cost-check] Error:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

// Täglich 20:00 UTC = 22:00 MEZ / 21:00 MESZ
exports.handler = schedule('0 20 * * *', handler);
