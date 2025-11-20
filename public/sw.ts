// This is a TypeScript Service Worker

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open('v1');
      // You can add resources to cache here if needed
      // await cache.addAll(['/']);
    })()
  );
  (self as any).skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil((self as any).clients.claim());
});

// Add fetch event handler if needed
self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    (async () => {
      // You can implement custom fetch handling logic here
      return fetch(event.request);
    })()
  );
});
