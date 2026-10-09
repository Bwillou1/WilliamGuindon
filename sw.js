const CACHE_NAME = 'wg-pwa-v100';
const MAX_CACHE_ENTRIES = 256;

const ASSETS_TO_CACHE = [
  '/apparitions-publiques.html',
  '/apercu.html',
  '/contamination.html',
  '/loi-93.html',
  '/dossier-journalistes.html',
  '/sphere-360.html',
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
  '/theme.js',
  '/navbar.js',
  '/navbar.html',
  '/assets/js/navbar-loader.js',
  '/assets/js/theme-core.js',
  '/assets/js/page-home.js',
  '/assets/js/anticapture.js',
  '/assets/js/hero-depth-3d.js',
  '/assets/vendor/curtains/curtains.umd.min.js',
  '/assets/media/william-guindon.jpg',
  '/assets/media/william-guindon.webp',
  '/assets/media/signature.svg',
  '/assets/media/tourbiere-hero-3d.webp',
  '/assets/media/tourbiere-hero-depth.webp',
  '/assets/media/tourbiere-photosphere-fast.webp',
  '/assets/media/tourbiere-photosphere-360.webp',
  '/assets/media/moteur-recherche-pieces.jpg',
  '/assets/media/moteur-recherche-pieces.webp',
  '/assets/media/autonomie-juridique-adolescents.jpg',
  '/assets/media/autonomie-juridique-adolescents.webp',
  '/assets/media/clarification-independance.jpg',
  '/assets/media/clarification-independance.webp',
  '/assets/media/confirmation-cce-premier-mineur-1994.png',
  '/assets/media/confirmation-cce-premier-mineur-1994.webp',
  '/assets/media/sem-26-003-apercu-banniere.webp',
  '/assets/media/ndtr-banner-rcaanc.jpg',
  '/assets/media/ndtr-banner-rcaanc.webp',
  '/assets/media/memoire-autochtone-tourbiere.jpg',
  '/assets/media/memoire-autochtone-tourbiere.webp',
  '/assets/media/umap-preview.webp',
  '/assets/media/lapresse-logo.png',
  '/assets/media/ledevoir-logo.png',
  '/assets/media/cbc-logo.jpg',
  '/assets/media/tvbl-logo.png',
  '/assets/media/lesasdelinfo-logo.png',
  '/assets/media/the-rover-logo.jpg',
  '/assets/media/educaloi-logo.png',
  '/assets/media/educaloi-logo.webp',
  '/assets/media/sgtb-medaillon.png',
  '/assets/media/sgtb-medaillon.webp',
  '/assets/media/logo-areq-csq.png',
  '/assets/media/logo-areq-csq.webp',
  '/assets/media/logo-mouvement-actes-csq.png',
  '/assets/media/logo-mouvement-actes-csq.webp',
  '/assets/media/signalement-faunique-plan-bouchard.jpg',
  '/assets/media/signalement-faunique-plan-bouchard.webp',
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
  // Le reste du HTML ne doit pas être mis en cache pour préserver le fonctionnement en direct des traductions
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

  // 4. Filtrer par en-tête Content-Type éligible (Images, CSS, JS, Fonts, PDF, JSON, etc.)
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
        keys
          .filter((key) => key !== CACHE_NAME && !key.startsWith('wg-sem26003-docs') && !key.startsWith('wg-docs'))
          .map((key) => caches.delete(key))
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

  // 1. Accélération locale maximale pour les images, styles, polices, scripts et données JSON (Cache-First + synchronisation silencieuse)
  const isAcceleratedLocalAsset = event.request.destination === 'image' || 
                                  event.request.destination === 'style' || 
                                  event.request.destination === 'script' || 
                                  event.request.destination === 'font' ||
                                  url.pathname.startsWith('/assets/') ||
                                  url.pathname.endsWith('.json') ||
                                  url.pathname.endsWith('.svg') ||
                                  /\.(webp|jpg|jpeg|png|svg|ico|gif|css|js|woff2?|ttf|eot|json)$/i.test(url.pathname);

  if (isAcceleratedLocalAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (isCacheable(event.request, networkResponse)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(async (cache) => {
              await cache.put(event.request, responseClone);
              await trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
            });
          }
          return networkResponse;
        }).catch(() => null);

        // Si présent en cache local : rendu immédiat (0 ms) pour une navigation ultra-fluide
        if (cachedResponse) {
          event.waitUntil(fetchPromise);
          return cachedResponse;
        }
        return fetchPromise;
      })
    );
    return;
  }

  const isNavigation = event.request.mode === 'navigate';

  // 2. Pour les navigations HTML : ne traiter en cache hors-ligne que apercu.html et les pièces
  // Toutes les autres pages naviguent en direct réseau sans interception SW (garantit 0 bug de traduction)
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
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => !key.startsWith('wg-sem26003-docs') && !key.startsWith('wg-docs'))
        .map(k => caches.delete(k))
    ));
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


