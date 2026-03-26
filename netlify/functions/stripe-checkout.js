const Stripe = require('stripe');

exports.handler = async function(event) {
    const headers = {
        'Access-Control-Allow-Origin': 'https://base-app.tech',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe nicht konfiguriert' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiges JSON' }) };
    }

    const { plan, userId, userEmail } = body;
    if (!plan || !userId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'plan und userId erforderlich' }) };
    }

    // Price ID serverseitig aus Environment Variables auflösen
    const PRICE_MAP = {
        pro: process.env.STRIPE_PRO_PRICE_ID,
        elite_trainer: process.env.STRIPE_TRAINER_PRICE_ID
    };

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unbekannter Plan: ' + plan }) };
    }

    try {
        const stripe = new Stripe(STRIPE_SECRET_KEY);

        const sessionParams = {
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: 'https://base-app.tech/app.html?stripe=success',
            cancel_url: 'https://base-app.tech/app.html?stripe=cancel',
            metadata: { userId: userId, plan: plan },
            client_reference_id: userId
        };

        // E-Mail vorausfüllen wenn vorhanden
        if (userEmail) {
            sessionParams.customer_email = userEmail;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ url: session.url, sessionId: session.id })
        };
    } catch (e) {
        console.error('Stripe Checkout Error:', e);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Checkout konnte nicht erstellt werden: ' + e.message })
        };
    }
};
