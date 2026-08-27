const CACHE_NAME = 'orem-dashboard-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Установка service worker
self.addEventListener('install', event => {
  console.log('📦 Service Worker: установка');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✓ Service Worker: кеш готов');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Активация service worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: активация');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: удаляю старый кеш', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Обработка запросов
self.addEventListener('fetch', event => {
  // Игнорируем POST/PUT/DELETE запросы - они идут на сервер
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Если есть в кеше - возвращаем
      if (response) {
        return response;
      }

      // Иначе загружаем с сервера
      return fetch(event.request).then(response => {
        // Если это не успешный ответ - игнорируем
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Кешируем ответ
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(error => {
        console.error('🔴 Service Worker fetch error:', error);
        // Возвращаем кешированную версию если есть
        return caches.match(event.request);
      });
    })
  );
});
