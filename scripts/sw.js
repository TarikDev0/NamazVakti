self.addEventListener('install', event => {
  console.log('Service Worker kuruldu.');
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});