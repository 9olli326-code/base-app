var https = require('https');
var crypto = require('crypto');

function getAccessToken() {
  var serviceAccount;
  try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'); }
  catch(e) { return Promise.reject(new Error('FIREBASE_SERVICE_ACCOUNT ungueltig')); }
  if (!serviceAccount.private_key) {
    return Promise.reject(new Error('FIREBASE_SERVICE_ACCOUNT nicht gesetzt'));
  }

  var header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  var now = Math.floor(Date.now() / 1000);
  var claim = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');

  var sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + claim);
  var signature = sign.sign(serviceAccount.private_key.replace(/\\n/g, '\n'), 'base64url');
  var jwt = header + '.' + claim + '.' + signature;

  return new Promise(function(resolve, reject) {
    var postData = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt;
    var req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try {
          var parsed = JSON.parse(data);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error('Kein Access Token'));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function sendFCMNotification(accessToken, fcmToken, title, body, data) {
  var projectId = process.env.FIREBASE_PROJECT_ID || 'beastmode-17f0d';
  var message = {
    message: {
      token: fcmToken,
      notification: { title: title, body: body },
      data: data || {},
      webpush: {
        notification: {
          icon: '/icon-192.png',
          badge: '/icon-48.png',
          requireInteraction: true
        }
      }
    }
  };

  var payload = JSON.stringify(message);

  return new Promise(function(resolve, reject) {
    var req = https.request({
      hostname: 'fcm.googleapis.com',
      path: '/v1/projects/' + projectId + '/messages:send',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try {
          var parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error('FCM Error ' + res.statusCode + ': ' + data));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, function() { req.destroy(); reject(new Error('Timeout')); });
    req.write(payload);
    req.end();
  });
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  var clientFcmToken = body.clientFcmToken;
  var clientName = body.clientName;
  var ptName = body.ptName;
  var planName = body.planName;
  var workoutCount = body.workoutCount;

  if (!clientFcmToken) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Kein FCM Token' }) };
  }

  try {
    var accessToken = await getAccessToken();
    var title = '\uD83D\uDCAA Neuer Trainingsplan von ' + (ptName || 'deinem Trainer');
    var msgBody = (planName || 'Trainingsplan') +
      (workoutCount ? ' \u00B7 ' + workoutCount + ' Workouts' : '') +
      ' \u00B7 Jetzt ansehen!';

    await sendFCMNotification(accessToken, clientFcmToken, title, msgBody, {
      type: 'workout_delivery',
      clientName: clientName || '',
      url: '/app.html?tab=training'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Push an ' + (clientName || 'Client') + ' gesendet' })
    };
  } catch(e) {
    console.error('[push-workout]', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
