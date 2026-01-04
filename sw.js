const APP_VERSION = '1.1.0';
const CACHE_NAME = `pesagem-v${APP_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap'
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
  // Solo manejar solicitudes GET y HTTP/HTTPS
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }
  
  // Para solicitudes de la API, siempre ir a la red primero
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si está en caché y es un archivo estático, devolverlo
        if (cachedResponse && 
            (event.request.url.includes('cdnjs.cloudflare.com') || 
             event.request.url.includes('fonts.googleapis.com') ||
             event.request.url.endsWith('.css') ||
             event.request.url.endsWith('.js') ||
             event.request.url.endsWith('.png') ||
             event.request.url.endsWith('.json'))) {
          return cachedResponse;
        }
        
        // Ir a la red para otros recursos
        return fetch(event.request)
          .then(networkResponse => {
            // Solo cachear respuestas exitosas y del mismo origen
            if (networkResponse.ok && 
                event.request.url.startsWith(self.location.origin)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(error => {
            // Si falla la red y no tenemos caché, devolver offline page
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            return new Response('App offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Manejar actualizaciones automáticas
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

async function updateCache() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse);
      }
    } catch (error) {
      console.log('[SW] No se pudo actualizar:', request.url);
    }
  }
}