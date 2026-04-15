var https = require('https');

// CORS Headers
var CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://base-app.tech',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// XOR encrypt/decrypt for key storage
function xorEncrypt(str, salt) {
  return Buffer.from(str.split('').map(function(c, i) {
    return String.fromCharCode(c.charCodeAt(0) ^ salt.charCodeAt(i % salt.length));
  }).join('')).toString('base64');
}
function xorDecrypt(encoded, salt) {
  var str = Buffer.from(encoded, 'base64').toString();
  return str.split('').map(function(c, i) {
    return String.fromCharCode(c.charCodeAt(0) ^ salt.charCodeAt(i % salt.length));
  }).join('');
}

// Firebase Admin REST — get access token
async function getFirebaseToken() {
  var serviceAccount;
  try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'); }
  catch(e) { return null; }
  if (!serviceAccount.private_key) return null;
  var crypto = require('crypto');
  var now = Math.floor(Date.now() / 1000);
  var header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  var claim = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now
  })).toString('base64url');
  var sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + claim);
  var sig = sign.sign(serviceAccount.private_key.replace(/\\n/g, '\n'), 'base64url');
  var jwt = header + '.' + claim + '.' + sig;
  return new Promise(function(resolve) {
    var postData = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt;
    var req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    }, function(res) {
      var d = ''; res.on('data', function(c) { d += c; });
      res.on('end', function() { try { resolve(JSON.parse(d).access_token || null); } catch(e) { resolve(null); } });
    });
    req.on('error', function() { resolve(null); });
    req.write(postData); req.end();
  });
}

// Read lexoffice key from Firestore
async function getLexofficeKey(uid) {
  var token = await getFirebaseToken();
  if (!token) return null;
  var projectId = process.env.FIREBASE_PROJECT_ID || 'beastmode-17f0d';
  return new Promise(function(resolve) {
    var req = https.request({
      hostname: 'firestore.googleapis.com',
      path: '/v1/projects/' + projectId + '/databases/(default)/documents/lexoffice_keys/' + uid,
      method: 'GET', headers: { 'Authorization': 'Bearer ' + token }
    }, function(res) {
      var d = ''; res.on('data', function(c) { d += c; });
      res.on('end', function() {
        try {
          var doc = JSON.parse(d);
          if (doc.fields && doc.fields.encryptedKey) {
            var salt = process.env.LEXOFFICE_SALT || 'base-app-2026';
            resolve(xorDecrypt(doc.fields.encryptedKey.stringValue, salt));
          } else { resolve(null); }
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', function() { resolve(null); }); req.end();
  });
}

// Save lexoffice key to Firestore
async function saveLexofficeKey(uid, key) {
  var token = await getFirebaseToken();
  if (!token) return false;
  var projectId = process.env.FIREBASE_PROJECT_ID || 'beastmode-17f0d';
  var salt = process.env.LEXOFFICE_SALT || 'base-app-2026';
  var encrypted = xorEncrypt(key, salt);
  var payload = JSON.stringify({ fields: { encryptedKey: { stringValue: encrypted }, updatedAt: { stringValue: new Date().toISOString() } } });
  return new Promise(function(resolve) {
    var req = https.request({
      hostname: 'firestore.googleapis.com',
      path: '/v1/projects/' + projectId + '/databases/(default)/documents/lexoffice_keys/' + uid + '?updateMask.fieldPaths=encryptedKey&updateMask.fieldPaths=updatedAt',
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, function(res) {
      var d = ''; res.on('data', function(c) { d += c; });
      res.on('end', function() { resolve(res.statusCode >= 200 && res.statusCode < 300); });
    });
    req.on('error', function() { resolve(false); }); req.write(payload); req.end();
  });
}

// Create invoice via Lexoffice API
function createInvoice(lexofficeKey, invoice, mode) {
  var isKleinunternehmer = invoice.kleinunternehmer || false;
  var lineItems = (invoice.sessions || []).map(function(s) {
    return { type: 'custom', name: s.description || 'Personal Training', quantity: s.quantity || 1, unitName: 'Einheit',
      unitPrice: { currency: 'EUR', netAmount: parseFloat(s.netAmount) || 0, taxRatePercentage: isKleinunternehmer ? 0 : (invoice.taxRate || 19) }, discountPercentage: 0 };
  });
  var invoicePayload = {
    voucherDate: invoice.date || new Date().toISOString(),
    address: { name: invoice.clientName, street: invoice.clientStreet || '', city: invoice.clientCity || '', zip: invoice.clientZip || '', countryCode: 'DE' },
    lineItems: lineItems, totalPrice: { currency: 'EUR' },
    taxConditions: { taxType: isKleinunternehmer ? 'vatfree' : 'net' },
    shippingConditions: { shippingDate: invoice.date || new Date().toISOString(), shippingType: 'service' },
    paymentConditions: { paymentTermLabel: 'Zahlbar innerhalb ' + (invoice.paymentDays || 14) + ' Tagen', paymentTermDuration: invoice.paymentDays || 14 },
    introduction: invoice.intro || 'Vielen Dank für Ihr Vertrauen.',
    remark: isKleinunternehmer ? 'Gemäß §19 UStG wird keine Umsatzsteuer berechnet.' : (invoice.remark || '')
  };
  var createPayload = JSON.stringify(invoicePayload);
  return new Promise(function(resolve) {
    var req = https.request({
      hostname: 'api.lexoffice.io', path: '/v1/invoices' + (mode === 'send' ? '?finalize=true' : ''), method: 'POST',
      headers: { 'Authorization': 'Bearer ' + lexofficeKey, 'Content-Type': 'application/json', 'Accept': 'application/json', 'Content-Length': Buffer.byteLength(createPayload) }
    }, function(res) {
      var data = ''; res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try {
          var parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, id: parsed.id, mode: mode, message: mode === 'send' ? 'Rechnung finalisiert' : 'Entwurf erstellt' }) });
          } else {
            resolve({ statusCode: res.statusCode, headers: CORS_HEADERS, body: JSON.stringify({ error: parsed.message || 'Lexoffice Fehler', details: parsed }) });
          }
        } catch(e) { resolve({ statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Parse Error' }) }); }
      });
    });
    req.setTimeout(15000, function() { req.destroy(); resolve({ statusCode: 504, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Timeout' }) }); });
    req.on('error', function(e) { resolve({ statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: e.message }) }); });
    req.write(createPayload); req.end();
  });
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers: CORS_HEADERS, body: 'Invalid JSON' }; }

  var uid = body.uid;
  var action = body.action;

  // Save key server-side
  if (action === 'save_key') {
    if (!uid || !body.keyToSave) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'uid und keyToSave erforderlich' }) };
    var saved = await saveLexofficeKey(uid, body.keyToSave);
    return { statusCode: saved ? 200 : 500, headers: CORS_HEADERS, body: JSON.stringify({ success: saved }) };
  }

  // Check if key exists
  if (action === 'check_key') {
    if (!uid) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'uid fehlt' }) };
    var key = await getLexofficeKey(uid);
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ hasKey: !!key }) };
  }

  // Create invoice — key from server
  if (!uid) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'uid erforderlich' }) };
  var lexofficeKey = await getLexofficeKey(uid);
  if (!lexofficeKey) return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Kein Lexoffice Key hinterlegt', needsSetup: true }) };

  return createInvoice(lexofficeKey, body.invoice, body.mode === 'finalize' ? 'send' : 'draft');
};
