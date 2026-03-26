// netlify/functions/usercount.js
// Liest die Nutzeranzahl aus Firestore (öffentliches Stats-Dokument)

const https = require('https');

const PROJECT_ID = 'beastmode-17f0d';
const API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAW4KVFdyuj4xAvvU-Td-yx6KuSaFb3B4Y';

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

exports.handler = async function(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // 1 Minute cachen
    };

    try {
        const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/artifacts/base-v2-beta-test/public/stats?key=${API_KEY}`;
        const result = await httpsGet(url);

        if (result.statusCode === 200) {
            const data = JSON.parse(result.body);
            const count = data.fields?.userCount?.integerValue || 
                          data.fields?.userCount?.doubleValue || 0;
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ count: parseInt(count) })
            };
        }

        // Fallback wenn noch kein Dokument existiert
        return { statusCode: 200, headers, body: JSON.stringify({ count: 52 }) };

    } catch(e) {
        console.error('usercount error:', e);
        return { statusCode: 200, headers, body: JSON.stringify({ count: 52 }) };
    }
};