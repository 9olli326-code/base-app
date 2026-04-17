const FISH_API_KEY  = process.env.FISH_API_KEY;
const FISH_VOICE_ID = process.env.FISH_VOICE_ID || '612b878b113047d9a770c069c8b4fdfe';

const CORS = {
  'Access-Control-Allow-Origin':  'https://base-app.tech',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  if (!FISH_API_KEY) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'FISH_API_KEY nicht konfiguriert' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Ungültiges JSON' }) }; }

  const text = (body.text || '').trim().slice(0, 500);
  if (!text) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Kein Text' }) };

  try {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + FISH_API_KEY,
        'Content-Type':  'application/json',
        'model':         's2-pro'
      },
      body: JSON.stringify({
        text:         text,
        reference_id: FISH_VOICE_ID,
        format:       'mp3',
        mp3_bitrate:  128,
        sample_rate:  44100,
        latency:      'normal',
        language:     body.lang || 'en',
        normalize:    true,
        prosody: { speed: 0.95, volume: 0, normalize_loudness: true }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Fish Audio]', response.status, errText);
      return { statusCode: response.status, headers: CORS, body: JSON.stringify({ error: 'Fish Audio Fehler: ' + response.status }) };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'no-cache' },
      body: JSON.stringify({ audio: base64, mimeType: 'audio/mpeg' })
    };

  } catch(err) {
    console.error('[Fish Audio] Fehler:', err.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
