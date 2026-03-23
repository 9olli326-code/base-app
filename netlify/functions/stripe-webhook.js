const Stripe = require('stripe');
const https = require('https');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FIREBASE_PROJECT_ID = 'beastmode-17f0d';

// Firestore REST API Helper
function firestoreRequest(method, path, data) {
    return new Promise((resolve, reject) => {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
        const parsed = new URL(url);
        const options = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { resolve(body); }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Subscription-Status in Firestore speichern
async function setSubscriptionStatus(userId, plan, stripeCustomerId, stripeSubscriptionId) {
    const data = {
        fields: {
            plan: { stringValue: plan },
            active: { booleanValue: plan !== 'free' },
            stripeCustomerId: { stringValue: stripeCustomerId || '' },
            stripeSubscriptionId: { stringValue: stripeSubscriptionId || '' },
            updatedAt: { stringValue: new Date().toISOString() }
        }
    };

    // Pfad: artifacts/base-v2-beta-test/users/{userId}/subscription/status
    const path = `artifacts/base-v2-beta-test/users/${userId}/subscription/status`;
    await firestoreRequest('PATCH', path + '?updateMask.fieldPaths=plan&updateMask.fieldPaths=active&updateMask.fieldPaths=stripeCustomerId&updateMask.fieldPaths=stripeSubscriptionId&updateMask.fieldPaths=updatedAt', data);
}

exports.handler = async function(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    if (!STRIPE_SECRET_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe nicht konfiguriert' }) };
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    let stripeEvent;

    // Webhook-Signatur verifizieren wenn Secret vorhanden
    if (STRIPE_WEBHOOK_SECRET) {
        const sig = event.headers['stripe-signature'];
        try {
            stripeEvent = stripe.webhooks.constructEvent(event.body, sig, STRIPE_WEBHOOK_SECRET);
        } catch (e) {
            console.error('Webhook Signatur ungültig:', e.message);
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültige Signatur' }) };
        }
    } else {
        // Ohne Webhook Secret: Event direkt parsen (nur für Entwicklung)
        try {
            stripeEvent = JSON.parse(event.body);
        } catch (e) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiges JSON' }) };
        }
    }

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object;
                const userId = session.metadata?.userId || session.client_reference_id;
                if (!userId) {
                    console.error('Kein userId in checkout.session.completed');
                    break;
                }

                // Plan bestimmen anhand des Preises
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                const priceId = lineItems.data[0]?.price?.id;
                const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
                const STRIPE_TRAINER_PRICE_ID = process.env.STRIPE_TRAINER_PRICE_ID;

                let plan = 'pro'; // Default
                if (priceId === STRIPE_TRAINER_PRICE_ID) plan = 'elite_trainer';
                else if (priceId === STRIPE_PRO_PRICE_ID) plan = 'pro';

                await setSubscriptionStatus(
                    userId,
                    plan,
                    session.customer,
                    session.subscription
                );
                console.log(`Subscription aktiviert: ${userId} → ${plan}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object;
                // userId aus Subscription Metadata finden
                const customerId = subscription.customer;

                // Alle Sessions mit diesem Customer suchen
                const sessions = await stripe.checkout.sessions.list({
                    customer: customerId,
                    limit: 1
                });
                const userId = sessions.data[0]?.metadata?.userId || sessions.data[0]?.client_reference_id;

                if (userId) {
                    await setSubscriptionStatus(userId, 'free', customerId, '');
                    console.log(`Subscription gekündigt: ${userId} → free`);
                } else {
                    console.error('Kein userId für gekündigte Subscription gefunden:', customerId);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object;
                // Bei Änderungen (Downgrade, Upgrade) Status aktualisieren
                if (subscription.status === 'active') {
                    const customerId = subscription.customer;
                    const sessions = await stripe.checkout.sessions.list({
                        customer: customerId,
                        limit: 1
                    });
                    const userId = sessions.data[0]?.metadata?.userId || sessions.data[0]?.client_reference_id;
                    if (userId) {
                        const priceId = subscription.items.data[0]?.price?.id;
                        const STRIPE_TRAINER_PRICE_ID = process.env.STRIPE_TRAINER_PRICE_ID;
                        const plan = priceId === STRIPE_TRAINER_PRICE_ID ? 'elite_trainer' : 'pro';
                        await setSubscriptionStatus(userId, plan, customerId, subscription.id);
                        console.log(`Subscription aktualisiert: ${userId} → ${plan}`);
                    }
                }
                break;
            }

            default:
                console.log('Unbehandeltes Webhook Event:', stripeEvent.type);
        }
    } catch (e) {
        console.error('Webhook Handler Error:', e);
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
};
