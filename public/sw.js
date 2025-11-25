
const CACHE_NAME = 'portapro-v9';
const STATIC_CACHE = 'portapro-static-v9';
const DYNAMIC_CACHE = 'portapro-dynamic-v9';

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

  // Always go network-first for navigations to avoid stale SPA fallbacks
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }
  
  // Icons and manifest - network first to ensure fresh assets
  if (requestUrl.href.includes('apple-touch-icon') || 
      requestUrl.href.includes('/icons/pwa-') || 
      requestUrl.href.includes('/icon-') || 
      requestUrl.href.includes('/favicon') || 
      requestUrl.href.includes('/manifest.json') ||
      requestUrl.href.includes('/site.webmanifest')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // API requests - network first with fallback
  if (apiRoutes.some(route => requestUrl.href.includes(route))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses for offline fallback (only GET requests)
          if (response.status === 200 && request.method === 'GET') {
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
              return new Response('Offline', { status: 503, statusText: 'Offline' });
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
            return caches.match(request).then((cachedResponse) =>
              cachedResponse || new Response('Offline', { status: 503, statusText: 'Offline' })
            );
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
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'PortaPro Notification',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || {},
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions || []
      };
    } catch (e) {
      console.error('Error parsing push notification:', e);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      vibrate: [200, 100, 200]
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);
  // Optional: track notification dismissals for analytics
});
