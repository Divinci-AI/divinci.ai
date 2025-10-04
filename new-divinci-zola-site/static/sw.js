// Service Worker for Performance Optimization
const CACHE_NAME = 'divinci-ai-v1';
const STATIC_CACHE_URLS = [
    '/',
    '/css/optimized.css',
    '/js/optimized.js',
    '/images/favicon-32x32.png',
    '/images/divinci_logo_inverted.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .catch((error) => {
                console.log('Cache install failed:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network (same-origin only)
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Only intercept same-origin requests; let the browser handle cross-origin
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request).then((fetchResponse) => {
                    // Don't cache non-successful responses
                    if (!fetchResponse || !fetchResponse.ok) {
                        return fetchResponse;
                    }

                    // Clone the response before caching
                    const responseToCache = fetchResponse.clone();

                    // Cache static assets only
                    if (event.request.url.includes('.css') ||
                        event.request.url.includes('.js') ||
                        event.request.url.includes('.png') ||
                        event.request.url.includes('.svg')) {
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                    }

                    return fetchResponse;
                });
            })
            .catch(() => {
                // Fallback for offline scenarios (documents only)
                return caches.match('/');
            })
    );
});