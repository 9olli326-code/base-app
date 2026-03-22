// netlify/functions/strava-token.js
// Strava OAuth Token Exchange — Secret bleibt auf dem Server

const https = require('https');

const STRAVA_CLIENT_ID = '211278';
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

exports.handler = async function(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    if (!STRAVA_CLIENT_SECRET) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'STRAVA_CLIENT_SECRET nicht konfiguriert' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiges JSON' }) };
    }

    const { grant_type, code, refresh_token } = body;

    if (!grant_type) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'grant_type erforderlich' }) };
    }

    // Request an Strava zusammenbauen
    const stravaBody = {
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        grant_type: grant_type
    };

    if (grant_type === 'authorization_code' && code) {
        stravaBody.code = code;
    } else if (grant_type === 'refresh_token' && refresh_token) {
        stravaBody.refresh_token = refresh_token;
    } else {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'code oder refresh_token erforderlich' }) };
    }

    try {
        const result = await new Promise((resolve, reject) => {
            const postData = JSON.stringify(stravaBody);
            const req = https.request({
                hostname: 'www.strava.com',
                path: '/oauth/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.errors || parsed.message === 'Bad Request') {
                            reject(new Error(parsed.message || 'Strava API Error'));
                        } else {
                            resolve(parsed);
                        }
                    } catch (e) {
                        reject(new Error('Strava Parse Error'));
                    }
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                expires_at: result.expires_at
            })
        };

    } catch (e) {
        console.error('Strava Token Error:', e);
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};