// Service Worker for Rass 1 Hub
const CACHE_NAME = 'rass1-hub-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/logo.png'
];

// Install - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API calls (Google Sheets)
    if (event.request.url.includes('googleapis.com')) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            // Return cached version immediately
            const fetchPromise = fetch(event.request).then(response => {
                // Update cache with new version
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
