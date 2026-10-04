const CACHE_NAME = 'wg-pwa-v82';
const MAX_CACHE_ENTRIES = 128;

const ASSETS_TO_CACHE = [
  '/apercu.html',
  '/dossier-journalistes.html',
  '/viewer.html',
  '/dependances-licences.html',
  '/assets/docs/26-2-det2_fr.pdf',
  '/assets/docs/26-3-det_fr.pdf',
  '/assets/docs/26-3-rsub_fr_redacted.pdf',
  '/assets/js/pdf-viewer.js',
  '/assets/css/pdf-viewer.css',
  '/assets/vendor/pdfjs/pdf.min.js',
  '/assets/vendor/pdfjs/pdf.worker.min.js',
  '/assets/vendor/pdfjs/pdf_viewer.css',
  '/assets/js/papaparse.min.js',
  '/style.css',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32.png',
  '/favicon.ico',
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

  // 1. Uniquement Same-Origin (ne jamais intercepter ni cacher les domaines externes comme GTranslate, Google Translate, Umami, etc.)
  if (url.origin !== self.location.origin) {
    return false;
  }

  // 2. Exclure les requêtes dynamiques d'API et les pages privées protégées par Zero Trust
  if (url.pathname.startsWith('/api/') || url.pathname.includes('admin.html') || url.pathname.includes('console-admin.html') || url.pathname.includes('editeur.html')) {
    return false;
  }

  // 3. Ne mettre en cache hors-ligne QUE les documents, le lecteur et apercu.html
  // Le reste du site ne doit pas être mis en cache hors-ligne pour ne pas perturber les traductions et le contenu dynamique
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html')) {
    const isOfflineAllowedHtml = url.pathname === '/apercu.html' || 
                                 url.pathname === '/dossier-journalistes.html' || 
                                 url.pathname === '/viewer.html' || 
                                 url.pathname === '/dependances-licences.html';
    if (!isOfflineAllowedHtml) {
      return false;
    }
  }

  // 4. Filtrer par en-tête Content-Type éligible
  const eligibleContentType = /^(text\/(html|css|javascript|plain|xml)|application\/(javascript|json|pdf|xml|wasm|octet-stream)|image\/|font\/)/i.test(contentType);

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

  const url = new URL(event.request.url);

  // Ignorer complètement les domaines externes (GTranslate, Google Translate, Analytics, CDN, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigation = event.request.mode === 'navigate';

  // Pour les navigations HTML : ne traiter que les pages de documents et apercu.html
  // Toutes les autres pages naviguent directement en direct sur le réseau sans interception SW (évite tout bug de traduction)
  if (isNavigation) {
    const isOfflineAllowed = url.pathname === '/apercu.html' || 
                             url.pathname === '/dossier-journalistes.html' || 
                             url.pathname === '/viewer.html' || 
                             url.pathname === '/dependances-licences.html';
    if (!isOfflineAllowed) {
      return;
    }
  }

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

        // Fallback pour la navigation apercu.html
        if (isNavigation && url.pathname === '/apercu.html') {
          const apercuFallback = await caches.match('/apercu.html');
          if (apercuFallback) return apercuFallback;
        }

        return Promise.reject(new Error('Ressource hors-ligne indisponible'));
      })
  );
});

// Échéance CCE du 16 octobre 2026 (00:00:00 EDT)
const TARGET_CCE_DEADLINE = new Date("2026-10-16T00:00:00-04:00").getTime();

async function checkDeadlineNotification() {
  if (Date.now() < TARGET_CCE_DEADLINE) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const notifFlagKey = new Request('/__cce_notif_16oct_sent');
    const alreadySent = await cache.match(notifFlagKey);
    if (!alreadySent) {
      await cache.put(notifFlagKey, new Response('sent', { headers: { 'Content-Type': 'text/plain' } }));
      if (self.registration && self.registration.showNotification) {
        await self.registration.showNotification("🚨 ÉCHÉANCE CCE ATTEINTE — 16 OCTOBRE 2026", {
          body: "Le délai officiel de 60 jours imposé au gouvernement du Canada pour répondre dans le dossier SEM-26-003 (Grande Tourbière de Blainville / Stablex) est échu. Consultez les documents officiels.",
          icon: "/icon-192.png",
          badge: "/favicon.svg",
          tag: "cce-deadline-16oct2026",
          requireInteraction: true,
          data: { url: "/live.html" }
        });
      }
    }
  } catch (_) {}
}

// Gestionnaire de messages (Skip Waiting & Purge immédiate & Programmation notif)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'PURGE_CACHE' || event.data?.action === 'purgeCache') {
    caches.keys().then((keys) => Promise.all(keys.map(k => caches.delete(k))));
  }
  if (event.data === 'CHECK_DEADLINE' || event.data?.action === 'checkDeadline') {
    event.waitUntil(checkDeadlineNotification());
  }
  if (event.data?.action === 'showLocalNotification') {
    const d = event.data;
    const title = d.title || "🚨 Dossier CCE SEM-26-003 — Alerte Officielle";
    const options = {
      body: d.subtitle || d.body || "Mise à jour importante concernant le dossier de la Grande Tourbière de Blainville.",
      icon: d.image || "/icon-192.png",
      image: d.image || undefined,
      badge: "/favicon.svg",
      tag: "cce-broadcast-alert",
      requireInteraction: true,
      data: { url: d.url || "/live.html" }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Réception des notifications push (Web Push)
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || "🚨 Dossier CCE SEM-26-003 — Alerte Officielle";
  const options = {
    body: payload.body || payload.subtitle || "Mise à jour importante concernant le dossier de la Grande Tourbière de Blainville.",
    icon: payload.icon || "/icon-192.png",
    image: payload.image || undefined,
    badge: "/favicon.svg",
    tag: payload.tag || "cce-push-alert",
    requireInteraction: true,
    data: { url: payload.url || payload.link || "/live.html" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Synchronisation périodique en arrière-plan
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-cce-feed' || event.tag === 'check-cce-deadline') {
    event.waitUntil(checkDeadlineNotification());
  }
});

// Notifications Web & Alertes d'échéance CCE (clic utilisateur)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/live.html';
  
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


