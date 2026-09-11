const CACHE_NAME = 'wg-pwa-v23';
const MAX_CACHE_ENTRIES = 75;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/registre.html',
  '/enquete-partis.html',
  '/presse.html',
  '/stablex.html',
  '/communiques.html',
  '/live.html',
  '/viewer.html',
  '/ai.html',
  '/txt.html',
  '/netiquette.html',
  '/deontologie.html',
  '/independance.html',
  '/ia-ethique.html',
  '/anti-slapp.html',
  '/embargo.html',
  '/experts.html',
  '/tracabilite.html',
  '/opsec.html',
  '/statut-mineur.html',
  '/vie-privee-parents.html',
  '/llms.txt',
  '/llms-full.txt',
  '/style.css',
  '/theme.js',
  '/assets/js/theme-core.js',
  '/assets/js/page-home.js',
  '/assets/js/chat-ai.js',
  '/assets/css/pdf-viewer.css',
  '/assets/js/pdf-viewer.js',
  '/assets/vendor/pdfjs/pdf.min.js',
  '/assets/vendor/pdfjs/pdf.worker.min.js',
  '/assets/vendor/pdfjs/pdf_viewer.css',
  '/assets/docs/26-2-det2_fr.pdf',
  '/assets/docs/26-3-det_fr.pdf',
  '/assets/docs/26-3-rsub_fr_redacted.pdf',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.jpg',
  '/feed.xml',
  '/status.json'
];

/**
 * Purge les entrées les plus anciennes du cache lorsque la taille maximale est atteinte
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const itemsToDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(itemsToDelete.map((key) => cache.delete(key)));
    }
  } catch (err) {
    console.warn('[SW] Échec du nettoyage du quota de cache:', err);
  }
}

/**
 * Vérifie si une réponse peut être mise en cache en respectant les critères de sécurité et de type
 */
function isCacheable(request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') {
    return false;
  }

  const url = new URL(request.url);

  // 1. Uniquement Same-Origin
  if (url.origin !== self.location.origin) {
    return false;
  }

  // 2. Exclure les requêtes dynamiques d'API
  if (url.pathname.startsWith('/api/')) {
    return false;
  }

  // 3. Filtrer par en-tête Content-Type (HTML, CSS, JS, Images, Fonts, JSON, PDF, XML, Text)
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const eligibleContentType = /^(text\/(html|css|javascript|plain|xml)|application\/(javascript|json|pdf|xml)|image\/|font\/)/i.test(contentType);

  return eligibleContentType;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(ASSETS_TO_CACHE);
      } catch (err) {
        console.warn('[SW] addAll failed, executing resilient fallback:', err);
        await Promise.allSettled(
          ASSETS_TO_CACHE.map(url => cache.add(url).catch(e => console.warn(`[SW] Skip cache ${url}:`, e.message)))
        );
      }
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

  const isNavigation = event.request.mode === 'navigate';

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (isCacheable(event.request, networkResponse)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(async (cache) => {
            await cache.put(event.request, responseClone);
            await trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Recherche dans le cache local
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fallback pour les navigations hors-ligne
        if (isNavigation) {
          const fallback = await caches.match('/index.html');
          if (fallback) {
            return fallback;
          }
        }

        return Promise.reject(new Error('Ressource hors-ligne indisponible'));
      })
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
