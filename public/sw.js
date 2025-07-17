// Minimal service worker for PWA deep linking
const CACHE_NAME = 'pixie-director-v1';

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event - basic caching
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests (deep links)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline, return cached version of root
        return caches.match('/');
      })
    );
  }
});