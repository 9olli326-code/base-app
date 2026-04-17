const webpush = require('web-push');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support.base-app@proton.me';

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'VAPID Keys fehlen' }) };
    }

    var body;
    try { body = JSON.parse(event.body); } catch(e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Ungueltiges JSON' }) };
    }

    const INTERNAL_SECRET = process.env.PUSH_INTERNAL_SECRET;
    if (INTERNAL_SECRET && body.internalSecret !== INTERNAL_SECRET) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!body.subscription || !body.notification) {
        return { statusCode: 400, body: JSON.stringify({ error: 'subscription und notification erforderlich' }) };
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    try {
        await webpush.sendNotification(body.subscription, JSON.stringify(body.notification));
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch(e) {
        console.error('Push error:', e.statusCode, e.body);
        if (e.statusCode === 410) return { statusCode: 410, body: JSON.stringify({ expired: true }) };
        return { statusCode: e.statusCode || 500, body: JSON.stringify({ error: e.body || e.message }) };
    }
};