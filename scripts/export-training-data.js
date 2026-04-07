// Export Training Data aus Netlify Blobs als JSONL (Fine-Tuning Format)
// Ausfuehren: npx netlify blob:list --store training-data (zum Pruefen)
// Oder lokal: NETLIFY_AUTH_TOKEN=xxx node scripts/export-training-data.js

const { getStore } = require('@netlify/blobs');

async function exportTrainingData() {
    const store = getStore({ name: 'training-data', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN });
    const { blobs } = await store.list();

    console.log('Found', blobs.length, 'training data entries');

    const data = [];
    for (const blob of blobs) {
        try {
            const raw = await store.get(blob.key);
            if (raw) data.push(JSON.parse(raw));
        } catch(e) {
            console.log('Skip:', blob.key, e.message);
        }
    }

    // Stats
    const types = {};
    data.forEach(d => { types[d.type] = (types[d.type] || 0) + 1; });
    console.log('Types:', JSON.stringify(types));
    console.log('Date range:', data.length > 0 ? data[0].timestamp + ' - ' + data[data.length - 1].timestamp : 'empty');

    // Als JSONL exportieren (Standard Fine-Tuning Format)
    const jsonl = data.filter(d => d.prompt && d.response).map(d => JSON.stringify({
        messages: [
            { role: 'system', content: 'Du bist ein KI Fitness Coach der auf echten Trainingsdaten basiert.' },
            { role: 'user', content: d.prompt },
            { role: 'assistant', content: d.response }
        ]
    })).join('\n');

    require('fs').writeFileSync('training-data.jsonl', jsonl);
    console.log('Exported', data.filter(d => d.prompt && d.response).length, 'valid entries to training-data.jsonl');
}

exportTrainingData().catch(console.error);
