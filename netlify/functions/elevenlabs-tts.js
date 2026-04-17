const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID           = process.env.ELEVENLABS_VOICE_ID
  || 'wDsJlOXPqcvIUKdLXjDs';

const CORS = {
  'Access-Control-Allow-Origin': 'https://base-app.tech',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  if (!ELEVENLABS_API_KEY) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'ElevenLabs API key not configured' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers: CORS, body: 'Invalid JSON' };
  }

  const text = (body.text || '').slice(0, 500);
  if (!text.trim()) {
    return { statusCode: 400, headers: CORS, body: 'No text provided' };
  }

  try {
    const response = await fetch(
      'https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_ID,
      {
        method: 'POST',
        headers: {
          'xi-api-key':   ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg'
        },
        body: JSON.stringify({
          text:           text,
          model_id:       'eleven_multilingual_v2',
          voice_settings: {
            stability:        0.5,
            similarity_boost: 0.85,
            style:            0.2,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ElevenLabs]', response.status, errText);
      return {
        statusCode: response.status,
        headers: CORS,
        body: JSON.stringify({ error: 'ElevenLabs API error: ' + response.status, details: errText.slice(0, 500) })
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64      = Buffer.from(arrayBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        audio:    base64,
        mimeType: 'audio/mpeg'
      })
    };

  } catch(err) {
    console.error('[ElevenLabs] Fetch error:', err.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
