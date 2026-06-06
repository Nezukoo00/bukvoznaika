// Service worker 
const CACHE_NAME = 'ucheba-s-leni-v1';

// Файлы, которые кэшируем сразу при установке
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/leni.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/cards/card-leni-cloud.jpg',
  '/cards/pack-letter-a.jpg',
];

// Установка — кэшируем базовые файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Только GET-запросы кэшируем
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Запросы к API не кэшируем — ими занимается офлайн-очередь в приложении
  if (url.pathname.startsWith('/api') || url.hostname.includes('onrender.com') && url.pathname.includes('/api')) {
    return;
  }

  // Стратегия: сначала сеть, при ошибке — кэш (для статики и навигации)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Сохраняем свежую копию в кэш
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Нет сети — отдаём из кэша
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Для навигации (открытие страницы) отдаём index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Офлайн', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
