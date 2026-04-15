const https = require('https');

const HEADERS = {
  'Access-Control-Allow-Origin': 'https://base-app.tech',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: {
      ...HEADERS,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  var action = body.action;
  var query = body.query;
  var barcode = body.barcode;

  if (action === 'search') {
    var encoded = encodeURIComponent(query || '');
    return offRequest(
      'world.openfoodfacts.org',
      '/cgi/search.pl?search_terms=' + encoded +
      '&search_simple=1&action=process&json=1' +
      '&fields=product_name,brands,nutriments,serving_size,image_thumb_url' +
      '&page_size=20&lc=de,en',
      'search'
    );
  }

  if (action === 'barcode') {
    return offRequest(
      'world.openfoodfacts.org',
      '/api/v2/product/' + encodeURIComponent(barcode || '') +
      '?fields=product_name,brands,nutriments,serving_size,image_thumb_url',
      'barcode'
    );
  }

  return { statusCode: 400,
    body: JSON.stringify({ error: 'Unbekannte action' }) };
};

function offRequest(host, path, type) {
  return new Promise(function(resolve) {
    var req = https.request({
      hostname: host,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'BASE-FitnessApp/1.0 (base-app.tech)'
      }
    }, function(res) {
      var d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
        try {
          var raw = JSON.parse(d);
          var normalized = type === 'barcode'
            ? [normalizeOFF(raw.product)].filter(Boolean)
            : (raw.products || []).map(normalizeOFF).filter(Boolean);

          resolve({
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ foods: normalized })
          });
        } catch(e) {
          resolve({ statusCode: 500, headers: HEADERS,
            body: JSON.stringify({ error: 'Parse Error' }) });
        }
      });
    });
    req.setTimeout(10000, function() {
      req.destroy();
      resolve({ statusCode: 504, headers: HEADERS,
        body: JSON.stringify({ error: 'Timeout' }) });
    });
    req.on('error', function(e) {
      resolve({ statusCode: 500, headers: HEADERS,
        body: JSON.stringify({ error: e.message }) });
    });
    req.end();
  });
}

function normalizeOFF(p) {
  if (!p || !p.product_name) return null;
  var n = p.nutriments || {};
  var per = '100g';
  return {
    food_name:    p.product_name,
    brand_name:   p.brands || null,
    serving_qty:  100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories:             parseFloat(n['energy-kcal_' + per] || n['energy-kcal'] || 0),
    nf_protein:              parseFloat(n['proteins_' + per]     || n['proteins']     || 0),
    nf_total_carbohydrate:   parseFloat(n['carbohydrates_' + per]|| n['carbohydrates']|| 0),
    nf_total_fat:            parseFloat(n['fat_' + per]          || n['fat']          || 0),
    nf_dietary_fiber:        parseFloat(n['fiber_' + per]        || n['fiber']        || 0),
    nf_sugars:               parseFloat(n['sugars_' + per]       || n['sugars']       || 0),
    nf_sodium:               parseFloat(n['sodium_' + per]       || n['sodium']       || 0) * 1000,
    photo: p.image_thumb_url ? { thumb: p.image_thumb_url } : null,
    _source: 'openfoodfacts'
  };
}
