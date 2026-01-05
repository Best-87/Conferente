const APP_VERSION = '1.2.0';
const CACHE_NAME = `pesagem-v${APP_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap'
];

// Instalar Service Worker
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
  );
});

// Activar Service Worker
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
      
      // Notificar a los clientes sobre la nueva versión
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEW_VERSION_AVAILABLE',
            version: APP_VERSION
          });
        });
      });
      
      return self.clients.claim();
    })
  );
});

// Interceptar fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, devolverlo
        if (response) {
          return response;
        }
        
        // Si no está en caché, ir a la red
        return fetch(event.request)
          .then(networkResponse => {
            // Solo cachear si es del mismo origen
            if (event.request.url.startsWith(self.location.origin)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Si falla la red y es una página, devolver la página offline
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            return new Response('App offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            });
          });
      })
  );
});

// Escuchar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Saltando espera por solicitud del cliente');
    self.skipWaiting();
  }
});

// Verificar actualizaciones periódicamente
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  console.log('[SW] Verificando actualizaciones...');
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse);
        console.log('[SW] Actualizado:', request.url);
      }
    } catch (error) {
      console.log('[SW] No se pudo actualizar:', request.url);
    }
  }
}