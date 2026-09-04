const CACHE_NAME = 'wg-pwa-v11';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/en.html',
  '/es.html',
  '/presse.html',
  '/stablex.html',
  '/communiques.html',
  '/live.html',
  '/viewer.html',
  '/lecteur.html',
  '/registre-cce-sem26003.html',
  '/llms.txt',
  '/llms-full.txt',
  '/style.css',
  '/theme.js',
  '/assets/css/pdf-viewer.css',
  '/assets/js/pdf-viewer.js',
  '/assets/vendor/pdfjs/pdf.min.js',
  '/assets/vendor/pdfjs/pdf.worker.min.js',
  '/assets/vendor/pdfjs/pdf_viewer.css',
  '/assets/docs/decision-secretariat-17-aout-2026.pdf',
  '/assets/docs/soumission-revisee-16-juillet-2026.pdf',
  '/manifest.json',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.jpg',
  '/feed.xml',
  '/status.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// Notifications Web & CCE Milestone Alerts
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
