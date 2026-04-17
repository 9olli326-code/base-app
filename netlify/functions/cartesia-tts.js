// netlify/functions/cartesia-tts.js
// TTS via Cartesia Sonic — Alistair British Male Voice (Jarvis-Persona)
const https = require('https');

const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
const CARTESIA_VOICE_ID = process.env.CARTESIA_VOICE_ID || 'c8f7835e-28a3-4f0c-80d7-c1302ac62aae';
const CARTESIA_MODEL = 'sonic-2';
const MAX_TEXT_LENGTH = 800;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  if (!CARTESIA_API_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'CARTESIA_API_KEY nicht konfiguriert' }) };

  let body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiges JSON' }) };
  }

  const text = String(body.text || '').slice(0, MAX_TEXT_LENGTH);
  if (!text.trim()) return { statusCode: 400, headers, body: JSON.stringify({ error: 'text erforderlich' }) };

  const lang = body.lang || 'de';
  const voiceId = body.voiceId || CARTESIA_VOICE_ID;
  const speed = Math.max(0.5, Math.min(2.0, parseFloat(body.speed) || 1.0));

  const payload = JSON.stringify({
    model_id: CARTESIA_MODEL,
    transcript: text,
    voice: { mode: 'id', id: voiceId },
    output_format: {
      container: 'mp3',
      encoding: 'mp3',
      sample_rate: 44100
    },
    language: lang === 'de' ? 'de' : 'en',
    speed: speed
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cartesia.ai',
      path: '/tts/bytes',
      method: 'POST',
      headers: {
        'X-API-Key': CARTESIA_API_KEY,
        'Cartesia-Version': '2024-11-13',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 20000
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          console.error('[Cartesia]', res.statusCode, buf.toString('utf-8').slice(0, 500));
          resolve({ statusCode: res.statusCode, headers, body: JSON.stringify({ error: 'Cartesia ' + res.statusCode, message: buf.toString('utf-8').slice(0, 200) }) });
          return;
        }
        resolve({ statusCode: 200, headers, body: JSON.stringify({ audio: buf.toString('base64'), format: 'mp3' }) });
      });
    });

    req.on('error', (err) => {
      console.error('[Cartesia] request error:', err.message);
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: err.message }) });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 504, headers, body: JSON.stringify({ error: 'Cartesia timeout' }) });
    });

    req.write(payload);
    req.end();
  });
};
