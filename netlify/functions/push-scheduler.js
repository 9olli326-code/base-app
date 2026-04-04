const https = require('https');
const webpush = require('web-push');
const { schedule } = require('@netlify/functions');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support.base-app@proton.me';
const FS_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAW4KVFdyuj4xAvvU-Td-yx6KuSaFb3B4Y';
const FS_PROJECT = 'beastmode-17f0d';

function fsGet(path) {
    return new Promise(function(resolve, reject) {
        var url = 'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT + '/databases/(default)/documents/' + path + '?key=' + FS_KEY;
        https.get(url, function(res) {
            var d = '';
            res.on('data', function(c) { d += c; });
            res.on('end', function() {
                try { resolve(JSON.parse(d)); } catch(e) { resolve(null); }
            });
        }).on('error', reject);
    });
}

function fv(v) {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return parseInt(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('nullValue' in v) return null;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fv);
    if ('mapValue' in v) {
        var o = {};
        for (var k in (v.mapValue.fields || {})) o[k] = fv(v.mapValue.fields[k]);
        return o;
    }
    return null;
}

function pickNotification(user) {
    var now = new Date();
    var dow = now.getUTCDay();
    var last = user.lastWorkout ? new Date(user.lastWorkout) : null;
    var days = last ? Math.floor((now - last) / 86400000) : 999;
    var streak = user.streak || 0;
    var weekly = user.weeklyCount || 0;

    // Heute trainiert -> kein Push
    if (days === 0) return null;

    // Sonntag, diese Woche nicht trainiert, Streak laeuft
    if (dow === 0 && weekly === 0 && streak > 0) {
        return { title: 'Streak in Gefahr!', body: 'Dein ' + streak + '-Wochen Streak endet heute ohne Training!' };
    }

    // 3-13 Tage Pause
    if (days >= 3 && days < 14) {
        var m = ['Dein Koerper ist erholt — perfekter Tag!', days + ' Tage Pause — heute ist der Tag!', 'Neue Bestleistungen warten auf dich!'];
        return { title: 'Zeit fuer ein Comeback', body: m[Math.floor(Math.random() * m.length)] };
    }

    // 14+ Tage Pause — Feature-basierte Win-Back statt Guilt-Trip
    if (days >= 14) {
        var wb = [
            { title: 'Dein Trainingsplan wartet', body: 'Der KI Planner hat einen neuen Plan fuer dich erstellt.' },
            { title: 'Battery-Score: 100%', body: 'Voll erholt — perfekter Zeitpunkt fuer ein starkes Workout.' },
            { title: 'Neues Feature: Coach Chat', body: 'Frag die KI alles ueber dein Training — sie kennt dein Profil.' }
        ];
        return wb[Math.floor(Math.random() * wb.length)];
    }

    // Mitte der Woche, wenig trainiert
    if ((dow === 3 || dow === 4) && weekly < 2) {
        return { title: 'Wochenziel erreichbar', body: 'Erst ' + weekly + 'x diese Woche — noch ' + (3 - weekly) + ' fuer dein Minimum!' };
    }

    // Streak laeuft, Wochenanfang
    if (streak >= 3 && weekly === 0 && dow >= 1 && dow <= 3) {
        return { title: streak + ' Wochen am Stueck!', body: 'Lass die Serie nicht reissen!' };
    }

    // 1-2 Tage Pause, Standard Nudge
    if (days >= 1 && days <= 2) {
        var n = ['Bereit fuer die naechste Einheit?', 'Gestern war stark — heute noch staerker?', 'Dein naechstes Workout wartet!'];
        return { title: 'Training heute?', body: n[Math.floor(Math.random() * n.length)] };
    }

    return null;
}

module.exports.handler = schedule('0 17 * * *', async function() {
    console.log('[Push Scheduler] Start:', new Date().toISOString());

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.error('[Push Scheduler] VAPID Keys fehlen');
        return;
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    try {
        var res = await fsGet('push_subscriptions');
        if (!res || !res.documents) {
            console.log('[Push Scheduler] Keine Subscriptions gefunden');
            return;
        }

        var docs = res.documents.map(function(d) {
            var o = {};
            for (var k in (d.fields || {})) o[k] = fv(d.fields[k]);
            o._id = d.name.split('/').pop();
            return o;
        });

        console.log('[Push Scheduler] Subscriptions:', docs.length);

        var sent = 0;
        var skipped = 0;

        for (var i = 0; i < docs.length; i++) {
            var user = docs[i];

            if (!user.enabled || !user.subscription || !user.subscription.endpoint) {
                skipped++;
                continue;
            }

            var msg = pickNotification(user);
            if (!msg) {
                skipped++;
                continue;
            }

            try {
                await webpush.sendNotification(user.subscription, JSON.stringify(msg));
                sent++;
                console.log('[Push Scheduler] Gesendet an', user._id, ':', msg.title);
            } catch (e) {
                if (e.statusCode === 410) {
                    console.log('[Push Scheduler] Abgelaufen:', user._id);
                } else {
                    console.error('[Push Scheduler] Fehler:', user._id, e.statusCode || e.message);
                }
                skipped++;
            }
        }

        console.log('[Push Scheduler] Fertig:', sent, 'gesendet,', skipped, 'uebersprungen');
    } catch (e) {
        console.error('[Push Scheduler] Fehler:', e.message);
    }
});