// Service Worker for PWA functionality
const CACHE_NAME = 'veilo-v1';
const STATIC_CACHE = 'veilo-static-v1';
const DYNAMIC_CACHE = 'veilo-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/veilo-logo.png',
  '/favicon-veilo.png',
  '/experts/expert-1.jpg',
  '/experts/expert-2.jpg',
  '/experts/expert-3.jpg',
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/experts',
  '/api/posts',
  '/api/sanctuary',
  '/api/recommendations'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {credentials: 'same-origin'})));
    }).then(() => {
      console.log('[SW] Static assets cached');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Cache installation failed:', error);
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and chrome-extension
  if (url.origin !== location.origin && !url.origin.includes('chrome-extension')) {
    return;
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request));
  }
});

async function handleGetRequest(request) {
  const url = new URL(request.url);
  
  // Static assets - cache first, then network
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset)) || 
      url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/)) {
    return cacheFirstStrategy(request, STATIC_CACHE);
  }
  
  // API requests - network first, then cache
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    return networkFirstStrategy(request, DYNAMIC_CACHE);
  }
  
  // HTML pages - stale while revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    return staleWhileRevalidate(request, DYNAMIC_CACHE);
  }
  
  // Default to network first
  return networkFirstStrategy(request, DYNAMIC_CACHE);
}

// Cache strategies
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline - Content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Network response cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/') || new Response('Offline', { 
        status: 503, 
        statusText: 'Service Unavailable' 
      });
    }
    
    return new Response('Offline - Content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);
  
  return cachedResponse || await networkResponsePromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Process any queued offline actions
    const queuedActions = await getQueuedActions();
    
    for (const action of queuedActions) {
      try {
        await fetch(action.url, action.options);
        await removeQueuedAction(action.id);
        console.log('[SW] Synced offline action:', action.url);
      } catch (error) {
        console.error('[SW] Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Helper functions for queued actions (simplified - would use IndexedDB in production)
async function getQueuedActions() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

async function removeQueuedAction(actionId) {
  // In a real implementation, this would remove from IndexedDB
  console.log('[SW] Action processed:', actionId);
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/veilo-logo.png',
    badge: '/favicon-veilo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/veilo-logo.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon-veilo.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Veilo', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    // Sync critical content in background
    const criticalEndpoints = ['/api/experts', '/api/posts/featured'];
    
    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(endpoint, response.clone());
        }
      } catch (error) {
        console.log('[SW] Background content sync failed for:', endpoint);
      }
    }
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}

console.log('[SW] Service worker loaded');