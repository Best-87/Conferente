const APP_VERSION = '1.0.0';
const CACHE_NAME = `pesagem-${APP_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://raw.githubusercontent.com/Best-87/Conferente/main/icons/icon-192x192.png',
  'https://raw.githubusercontent.com/Best-87/Conferente/main/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando versión:', APP_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando archivos críticos...');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error en instalación:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activando versión:', APP_VERSION);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Activación completada');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http') || event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          updateCache(event.request);
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              const cache = caches.open(CACHE_NAME);
              cache.then(c => c.put(event.request, networkResponse.clone()));
            }
            return networkResponse;
          })
          .catch(error => {
            if (event.request.headers.get('Accept').includes('text/html')) {
              return caches.match('./offline.html');
            }
            
            return new Response('Recurso no disponible offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

async function updateCache(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.log('[SW] Fallo al actualizar caché:', error);
  }
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const title = data.title || 'Controle de Pesagem';
  const options = {
    body: data.body || 'Nova notificação',
    icon: 'https://raw.githubusercontent.com/Best-87/Conferente/main/icons/icon-192x192.png',
    data: {
      url: data.url || './index.html'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});