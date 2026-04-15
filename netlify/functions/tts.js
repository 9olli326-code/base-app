const https = require('https');

// In-memory rate limit (resets on cold start, but sufficient for abuse protection)
const _rateLimitMap = {};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': 'https://base-app.tech', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'OPENAI_API_KEY not set' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  const text = (body.text || '').trim().substring(0, 300);
  if (!text) return { statusCode: 400, body: 'No text provided' };

  // Rate Limit: Max 50 TTS-Calls pro IP pro Stunde
  const ip = event.headers['x-forwarded-for'] ||
             event.headers['client-ip'] || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;

  if (!_rateLimitMap[ip]) _rateLimitMap[ip] = [];
  _rateLimitMap[ip] = _rateLimitMap[ip].filter(function(t) { return now - t < windowMs; });

  if (_rateLimitMap[ip].length >= 50) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Rate limit exceeded' })
    };
  }
  _rateLimitMap[ip].push(now);

  // Stimmen-Mapping: BASE Voice-Stile -> OpenAI Stimmen
  const VOICE_MAP = {
    'motivator': 'onyx',
    'calm':      'nova',
    'drill':     'echo',
    'funny':     'fable',
    'default':   'alloy'
  };

  const voiceStyle = body.voice || 'default';
  const voice = VOICE_MAP[voiceStyle] || 'alloy';
  const model = 'tts-1';

  const payload = JSON.stringify({
    model: model,
    input: text,
    voice: voice,
    response_format: 'mp3',
    speed: voiceStyle === 'drill' ? 1.1 : voiceStyle === 'calm' ? 0.95 : 1.0
  });

  return new Promise(function(resolve) {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/audio/speech',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, function(res) {
      const chunks = [];
      res.on('data', function(chunk) { chunks.push(chunk); });
      res.on('end', function() {
        if (res.statusCode !== 200) {
          const errText = Buffer.concat(chunks).toString();
          console.error('[TTS] OpenAI Error:', res.statusCode, errText);
          resolve({
            statusCode: res.statusCode,
            body: JSON.stringify({ error: 'OpenAI TTS fehlgeschlagen' })
          });
          return;
        }
        const audioBuffer = Buffer.concat(chunks);
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': 'https://base-app.tech'
          },
          body: audioBuffer.toString('base64'),
          isBase64Encoded: true
        });
      });
    });

    req.setTimeout(10000, function() {
      req.destroy(new Error('TTS Timeout'));
      resolve({
        statusCode: 504,
        body: JSON.stringify({ error: 'TTS Timeout' })
      });
    });

    req.on('error', function(e) {
      console.error('[TTS] Request Error:', e.message);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: e.message })
      });
    });

    req.write(payload);
    req.end();
  });
};
