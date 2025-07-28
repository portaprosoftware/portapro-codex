
const CACHE_NAME = 'portapro-driver-v1';
const urlsToCache = [
  '/',
  '/driver',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Failed to cache some resources:', err);
          // Don't fail the entire installation if some resources can't be cached
        });
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Only cache GET requests for same origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).catch(err => {
          console.log('Network fetch failed:', err);
          // For navigation requests, try to return a fallback page
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          throw err;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline job updates
self.addEventListener('sync', event => {
  if (event.tag === 'job-updates') {
    event.waitUntil(syncJobUpdates());
  }
});

async function syncJobUpdates() {
  // This will be implemented when we add offline sync
  console.log('Syncing job updates...');
}
