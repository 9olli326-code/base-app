// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

var _fcmFirebaseConfig = {
  apiKey: "AIzaSyAW4KVFdyuj4xAvvU-Td-yx6KuSaFb3B4Y",
  authDomain: "beastmode-17f0d.firebaseapp.com",
  projectId: "beastmode-17f0d",
  storageBucket: "beastmode-17f0d.firebasestorage.app",
  messagingSenderId: "276195983881",
  appId: "1:276195983881:web:99d55a5656e6ed7daa2ed8"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(_fcmFirebaseConfig);
}

if (typeof firebase !== 'undefined' && firebase.messaging) {
  var _fcmMessaging = firebase.messaging();
  _fcmMessaging.onBackgroundMessage(function(payload) {
    var title = (payload.notification && payload.notification.title) || '\uD83D\uDCAA BASE Fitness';
    var body = (payload.notification && payload.notification.body) || 'Neues Workout bereit!';
    var data = payload.data || {};
    self.registration.showNotification(title, {
      body: body,
      icon: '/icon-192.png',
      badge: '/icon-48.png',
      tag: 'base-workout-delivery',
      renotify: true,
      requireInteraction: true,
      data: data,
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Workout oeffnen' },
        { action: 'dismiss', title: 'Spaeter' }
      ]
    });
  });
}

const CACHE_NAME = 'base-v5-cache-v318';

const PRECACHE_URLS = [
    '/app.html',
    '/tailwind-production.css',
    '/design-override.css',
    '/manifest.json',
    '/icon-192.png',
    '/icon-48.png',
    '/js/base-timers.min.js?v=17',
    '/js/base-ai.min.js?v=17',
    '/js/base-settings.min.js?v=26',
    '/js/base-analytics.min.js?v=1',
    '/js/base-pt.min.js?v=17',
    '/js/exercise-db.min.js?v=17',
    '/js/machine-db.min.js?v=1',
    '/js/i18n-data.min.js',
    '/js/app-core.min.js',
    '/js/firebase-init.min.js',
    'https://unpkg.com/lucide@0.383.0',
    'https://js-de.sentry-cdn.com/287b90e183061df57c7f18944815186e.min.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return Promise.all(
                PRECACHE_URLS.map(function(url) {
                    return fetch(url)
                        .then(function(response) {
                            if (response.ok || response.type === 'opaque') {
                                return cache.put(url, response);
                            }
                        })
                        .catch(function(err) {
                            console.log('Pre-cache skip:', url);
                        });
                })
            );
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(
                names.filter(function(name) {
                    return name !== CACHE_NAME;
                }).map(function(name) {
                    return caches.delete(name);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    var url = event.request.url;

    if (event.request.url.includes('/js/')) {
      event.respondWith(fetch(event.request));
      return;
    }

    // Skip non-GET, Firestore writes, Netlify functions, Auth
    if (event.request.method !== 'GET' ||
        url.includes('firestore.googleapis.com') ||
        url.includes('/.netlify/') ||
        url.includes('identitytoolkit') ||
        url.includes('securetoken') ||
        url.includes('googleapis.com/google') ||
        url.includes('web.push.apple')) {
        return;
    }

    // CACHE FIRST for navigation + known assets
    // Try cache immediately, update in background
    // Nur /app.html cachen — andere HTML-Seiten (Impressum, Datenschutz) normal laden
    var pathname = new URL(url).pathname;
    if (event.request.mode === 'navigate' && (pathname === '/' || pathname === '/app.html')) {
        event.respondWith(
            caches.match('/app.html').then(function(cached) {
                if (cached) {
                    // Serve from cache, update in background
                    fetch(event.request).then(function(fresh) {
                        if (fresh && fresh.ok) {
                            caches.open(CACHE_NAME).then(function(cache) {
                                cache.put('/app.html', fresh);
                            });
                        }
                    }).catch(function() {});
                    return cached;
                }
                return fetch(event.request).then(function(response) {
                    if (response.ok) {
                        var clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // STALE-WHILE-REVALIDATE for everything else
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            var fetchPromise = fetch(event.request).then(function(response) {
                if (response && (response.ok || response.type === 'opaque')) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(function() {
                return cached;
            });
            return cached || fetchPromise;
        })
    );
});

self.addEventListener('push', function(event) {
    var data = {};
    try { data = event.data ? event.data.json() : {}; } catch(e) {}
    event.waitUntil(self.registration.showNotification(data.title || 'BASE', {
        body: data.body || 'Zeit fuer dein naechstes Training!',
        icon: '/icon-192.png',
        badge: '/icon-48.png',
        data: { url: data.url || '/app.html' },
        vibrate: [100, 50, 100],
        tag: data.tag || 'base-notification',
        renotify: false
    }));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.action === 'dismiss') return;
    var url = '/app.html';
    if (event.notification.data && event.notification.data.url) url = event.notification.data.url;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].url.includes('base-app.tech') && 'focus' in list[i]) return list[i].focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});