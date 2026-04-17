// netlify/functions/elevenlabs-tts.js
// TTS via ElevenLabs — sprach-abhängige Voice-Auswahl
const https = require('https');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID_DE = process.env.ELEVENLABS_VOICE_ID_DE || '';
const VOICE_ID_EN = process.env.ELEVENLABS_VOICE_ID_EN || VOICE_ID_DE;
const MAX_TEXT_LENGTH = 800;
const MODEL_ID = 'eleven_multilingual_v2';

function pickVoiceId(lang, explicitVoiceId) {
  if (explicitVoiceId) return explicitVoiceId;
  const l = String(lang || 'de').toLowerCase().slice(0, 2);
  if (l === 'en') return VOICE_ID_EN;
  return VOICE_ID_DE;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  if (!ELEVENLABS_API_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'ELEVENLABS_API_KEY nicht konfiguriert' }) };

  let body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiges JSON' }) };
  }

  const text = String(body.text || '').slice(0, MAX_TEXT_LENGTH);
  if (!text.trim()) return { statusCode: 400, headers, body: JSON.stringify({ error: 'text erforderlich' }) };

  const voiceId = pickVoiceId(body.lang, body.voiceId);
  if (!voiceId) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Keine Voice-ID konfiguriert' }) };

  const payload = JSON.stringify({
    text: text,
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.80,
      style: 0.30,
      use_speaker_boost: true
    }
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: '/v1/text-to-speech/' + voiceId + '?output_format=mp3_44100_128',
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 25000
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          console.error('[ElevenLabs]', res.statusCode, buf.toString('utf-8').slice(0, 500));
          resolve({
            statusCode: res.statusCode,
            headers,
            body: JSON.stringify({ error: 'ElevenLabs ' + res.statusCode, message: buf.toString('utf-8').slice(0, 300) })
          });
          return;
        }
        resolve({
          statusCode: 200,
          headers,
          body: JSON.stringify({ audio: buf.toString('base64'), format: 'mp3' })
        });
      });
    });

    req.on('error', (err) => {
      console.error('[ElevenLabs] request error:', err.message);
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: err.message }) });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 504, headers, body: JSON.stringify({ error: 'ElevenLabs timeout' }) });
    });

    req.write(payload);
    req.end();
  });
};
