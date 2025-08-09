
const CACHE_NAME = 'portapro-v2';
const STATIC_CACHE = 'portapro-static-v2';
const DYNAMIC_CACHE = 'portapro-dynamic-v2';

const urlsToCache = [
  '/',
  '/driver',
  '/jobs',
  '/fleet',
  '/inventory',
  '/customers',
  '/analytics',
  '/quotes-invoices',
  '/settings',
  '/manifest.json'
];

const apiRoutes = [
  '/api/',
  'supabase.co'
];

const offlineRoutes = [
  '/fleet/dvir',
  '/fleet/maintenance',
  '/jobs/',
  '/driver'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(urlsToCache)),
      caches.open(DYNAMIC_CACHE)
    ])
  );
  self.skipWaiting();
});

// Enhanced fetch strategy - cache first for app shell, network first for API
self.addEventListener('fetch', event => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  
  // API requests - network first with fallback
  if (apiRoutes.some(route => requestUrl.href.includes(route))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses for offline fallback
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Offline - try cache
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page for navigation requests
              if (request.mode === 'navigate') {
                return caches.match('/');
              }
            });
        })
    );
    return;
  }
  
  // App shell and static assets - cache first
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then(response => {
            // Cache new requests to dynamic cache
            if (response.status === 200 && request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Offline fallback for navigation
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const expectedCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!expectedCaches.includes(cacheName)) {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Background sync for offline updates
self.addEventListener('sync', event => {
  switch (event.tag) {
    case 'dvir-updates':
      event.waitUntil(syncDVIRUpdates());
      break;
    case 'job-updates':
      event.waitUntil(syncJobUpdates());
      break;
    case 'work-order-updates':
      event.waitUntil(syncWorkOrderUpdates());
      break;
  }
});

async function syncDVIRUpdates() {
  console.log('Syncing DVIR updates...');
  // Get queued DVIR data from IndexedDB and sync
  const queuedData = await getQueuedData('dvir');
  await syncToSupabase(queuedData, 'dvir_reports');
}

async function syncJobUpdates() {
  console.log('Syncing job updates...');
  const queuedData = await getQueuedData('jobs');
  await syncToSupabase(queuedData, 'jobs');
}

async function syncWorkOrderUpdates() {
  console.log('Syncing work order updates...');
  const queuedData = await getQueuedData('workorders');
  await syncToSupabase(queuedData, 'work_orders');
}

async function getQueuedData(type) {
  // Placeholder - would implement IndexedDB retrieval
  return JSON.parse(localStorage.getItem(`portapro_offline_${type}`) || '[]');
}

async function syncToSupabase(data, table) {
  // Placeholder - would implement actual sync logic
  console.log(`Syncing ${data.length} records to ${table}`);
}

// Push notification event
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Handle notification action clicks
  if (event.action) {
    switch (event.action) {
      case 'view_job':
        event.waitUntil(clients.openWindow(`/jobs/${event.notification.tag}`));
        break;
      case 'view_dvir':
        event.waitUntil(clients.openWindow('/fleet/dvir'));
        break;
      default:
        event.waitUntil(clients.openWindow('/'));
    }
  } else {
    // Default click action
    event.waitUntil(clients.openWindow('/'));
  }
});
