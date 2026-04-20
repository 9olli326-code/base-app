const ELEVENLABS_API_KEY   = process.env.ELEVENLABS_API_KEY;
const VOICE_ID_DE          = process.env.ELEVENLABS_VOICE_ID_DE;
const VOICE_ID_EN          = process.env.ELEVENLABS_VOICE_ID_EN;
const VOICE_ID_FALLBACK    = VOICE_ID_DE || VOICE_ID_EN;

const CORS = {
  'Access-Control-Allow-Origin':  'https://base-app.tech',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  if (!ELEVENLABS_API_KEY)            return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'ELEVENLABS_API_KEY nicht konfiguriert' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Ungültiges JSON' }) }; }

  const text = (body.text || '').trim().slice(0, 500);
  const lang = (body.lang || 'de').toLowerCase();
  if (!text) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Kein Text' }) };

  // Voice ID nach Sprache auswählen
  let voiceId;
  if (lang === 'en') {
    voiceId = VOICE_ID_EN || VOICE_ID_FALLBACK;
  } else {
    voiceId = VOICE_ID_DE || VOICE_ID_FALLBACK;
  }
  if (!voiceId) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Keine Voice ID konfiguriert' }) };

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key':   ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept':       'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability:        0.5,
          similarity_boost: 0.85,
          style:            0.2,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ElevenLabs]', response.status, errText);
      return { statusCode: response.status, headers: CORS, body: JSON.stringify({ error: 'ElevenLabs Fehler: ' + response.status }) };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'no-cache' },
      body: JSON.stringify({ audio: base64, mimeType: 'audio/mpeg' })
    };

  } catch(err) {
    console.error('[ElevenLabs] Fehler:', err.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
