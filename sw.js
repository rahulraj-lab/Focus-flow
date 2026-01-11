
const CACHE_NAME = 'aura-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Standard fetch bypass for PWA criteria
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
