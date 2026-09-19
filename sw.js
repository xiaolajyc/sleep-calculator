const CACHE_NAME = 'sleep-calculator-v8.2';
const APP_SHELL = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-180.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const isDocument =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    event.request.url.endsWith('/index.html');

  if (isDocument) {
    // Always try the current GitHub Pages file first.
    // Only fall back to the cached shell when offline.
    event.respondWith(
      fetch(event.request, {cache: 'no-store'})
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
