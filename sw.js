const CACHE_NAME = 'wg-pwa-v259';
const MAX_CACHE_ENTRIES = 256;

// Pré-cache léger (coque applicative uniquement) pour ne jamais saturer la bande passante lors de la 1re visite.
// Les PDF, WASM et médias sont mis en cache à la demande (Cache-First) dès leur première ouverture.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/dossier-journalistes.html',
  '/viewer.html',
  '/lecteur.html',
  '/dependances-licences.html',
  '/style.css',
  '/theme.js',
  '/navbar.js',
  '/navbar.html',
  '/assets/js/navbar-loader.js',
  '/assets/js/theme-core.js',
  '/assets/js/annotations-idb.js',
  '/assets/js/viewer-embedpdf.js',
  '/manifest.json',
  '/favicon.svg',
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
  if (!response || response.status !== 200 || response.type === 'opaque' || response.redirected) {
    return false;
  }

  const url = new URL(request.url);

  // 1. Uniquement Same-Origin (ne jamais intercepter ni cacher les domaines externes comme GTranslate, Google Translate, Umami, etc.)
  if (url.origin !== self.location.origin) {
    return false;
  }

  // 2. Exclure les requêtes dynamiques d'API, images satellites et les pages privées protégées par Zero Trust
  if (url.pathname.startsWith('/blainville_') || url.pathname === '/meta.json' || url.pathname.startsWith('/api/') || url.pathname.includes('admin.html') || url.pathname.includes('console-admin.html') || url.pathname.includes('editeur.html')) {
    return false;
  }

  // 3. Ne mettre en cache hors-ligne QUE les documents, le lecteur, apercu.html, la racine et offline.html
  // Le reste du HTML dynamique est protégé pour préserver le fonctionnement en direct des traductions
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html')) {
    const isOfflineAllowedHtml = url.pathname === '/' || url.pathname === '' ||
                                 url.pathname === '/index.html' || url.pathname === '/index' ||
                                 url.pathname === '/apercu.html' || url.pathname === '/apercu' ||
                                 url.pathname === '/dossier-journalistes.html' || url.pathname === '/dossier-journalistes' ||
                                 url.pathname === '/viewer.html' || url.pathname === '/viewer' ||
                                 url.pathname === '/lecteur.html' || url.pathname === '/lecteur' ||
                                 url.pathname === '/dependances-licences.html' || url.pathname === '/dependances-licences' ||
                                 url.pathname === '/offline.html' || url.pathname === '/offline';
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

const SECURITY_FLAG_CACHE = 'wg-sec-flags';
let isReciprocityLocked = false;
let isDeviceImmune = false;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'LOCK_RECIPROCITY') {
    if (!isDeviceImmune) {
      isReciprocityLocked = true;
    }
  } else if (event.data && event.data.type === 'UNLOCK_RECIPROCITY') {
    isReciprocityLocked = false;
    caches.delete(SECURITY_FLAG_CACHE).catch(() => {});
  } else if (event.data && event.data.type === 'IMMUNIZE_DEVICE') {
    isReciprocityLocked = false;
    isDeviceImmune = true;
    caches.delete(SECURITY_FLAG_CACHE).catch(() => {});
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorer complètement les domaines externes (GTranslate, Google Translate, Analytics, CDN, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Ne jamais intercepter les requêtes partielles (Range requests) ni les requêtes de préchargement (prefetch)
  if (
    event.request.headers.has('range') ||
    event.request.headers.get('Purpose') === 'prefetch' ||
    event.request.headers.get('Sec-Purpose') === 'prefetch'
  ) {
    return;
  }

  // 0. Pièces documentaires (/assets/docs/ et fichiers PDF) : ne JAMAIS les enregistrer automatiquement sur l'appareil via le SW.
  // En ligne, le navigateur les charge directement depuis GitHub/Cloudflare sans clonage ni écriture disque.
  // Hors-ligne uniquement, on vérifie si l'utilisateur a explicitement activé le "Mode Local".
  if (url.pathname.startsWith('/assets/docs/') || url.pathname.toLowerCase().endsWith('.pdf')) {
    if (self.navigator && self.navigator.onLine !== false) {
      return;
    }
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request);
      })
    );
    return;
  }

  // 1. Moteur de rendu embarqué (/assets/vendor/) : Cache-First pur sans re-téléchargement redondant
  if (url.pathname.startsWith('/assets/vendor/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (isCacheable(event.request, networkResponse)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 1b. Accélération locale pour les images, styles, polices, scripts et données JSON (hors /assets/docs/)
  const isAcceleratedLocalAsset = event.request.destination === 'image' || 
                                  event.request.destination === 'style' || 
                                  event.request.destination === 'script' || 
                                  event.request.destination === 'font' ||
                                  url.pathname.endsWith('.json') ||
                                  url.pathname.endsWith('.svg') ||
                                  /\.(webp|jpg|jpeg|png|svg|ico|gif|css|js|woff2?|ttf|eot|json)$/i.test(url.pathname);

  if (isAcceleratedLocalAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          event.waitUntil(
            fetch(event.request).then((networkResponse) => {
              if (isCacheable(event.request, networkResponse)) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(async (cache) => {
                  await cache.put(event.request, responseClone);
                  await trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
                });
              }
            }).catch(() => {})
          );
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (isCacheable(event.request, networkResponse)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(async (cache) => {
              await cache.put(event.request, responseClone);
              await trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  const isNavigation = event.request.mode === 'navigate';

  // 2. Pour les navigations HTML : mode réseau prioritaire (Network-First) avec repli hors-ligne élégant
  // Ne met en cache que les pièces autorisées afin de préserver les traductions en direct
  if (isNavigation) {
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
          // 1. Recherche directe dans le cache local
          let cachedResponse = await caches.match(event.request);
          if (!cachedResponse && !url.pathname.endsWith('.html')) {
            cachedResponse = await caches.match(url.pathname + '.html');
          }
          if (cachedResponse) {
            return cachedResponse;
          }

          // 2. Recherche tolérante pour la page d'accueil (start_url PWA)
          if (url.pathname === '/' || url.pathname === '' || url.pathname === '/index.html' || url.pathname === '/index') {
            const homeCached = await caches.match('/index.html') || await caches.match('/');
            if (homeCached) return homeCached;
          }

          // 3. Fallback universel pour toute navigation hors-ligne vers l'écran d'accueil hors-ligne
          const offlineFallback = await caches.match('/offline.html', { ignoreSearch: true }) ||
                                 await caches.match(new URL('/offline.html', self.location.origin).href) ||
                                 await caches.match('offline.html');
          if (offlineFallback) {
            return offlineFallback;
          }

          // 4. Filet de secours synthétique 200 OK : prévient tout rejet WebKit et élimine l'erreur "connexion non sécurisée" sur iOS
          return new Response(
            '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Mode Hors-Ligne · William Guindon</title><style>body{background:#0b1310;color:#f1f5f3;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;box-sizing:border-box;}div{max-width:540px;background:#101a15;border:1px solid #1f3329;border-radius:18px;padding:32px 24px;box-shadow:0 12px 30px rgba(0,0,0,0.5);}h1{font-size:1.35rem;margin:0 0 10px 0;color:#34d399;}p{font-size:0.95rem;color:#94a3b8;line-height:1.5;margin:0 0 20px 0;}a{display:inline-block;background:#10b981;color:#051a11;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:8px;}</style></head><body><div><h1>Mode Hors-Ligne Probatoire</h1><p>L\'environnement sécurisé et les pièces probatoires enregistrées restent opérationnels sur cet appareil.</p><a href="/dossier-journalistes.html">Consulter les pièces hors ligne ↗</a></div></body></html>',
            {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        })
    );
    return;
  }

  // 3. Pour les ressources lourdes et immuables (moteur PDF/WASM, pièces PDF, médias) : Cache-First ultra-rapide
  const isHeavyStaticAsset =
    url.pathname.startsWith('/assets/vendor/') ||
    url.pathname.startsWith('/assets/docs/') ||
    url.pathname.startsWith('/assets/media/') ||
    url.pathname.startsWith('/assets/img/');

  if (isHeavyStaticAsset && event.request.method === 'GET' && !event.request.headers.has('range')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (isCacheable(event.request, networkResponse)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(async (cache) => {
              await cache.put(event.request, responseClone);
              await trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
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
        let cachedResponse = await caches.match(event.request);
        if (!cachedResponse && !url.pathname.endsWith('.html')) {
          cachedResponse = await caches.match(url.pathname + '.html');
        }
        if (cachedResponse) {
          return cachedResponse;
        }

        return new Response('', { status: 504, statusText: 'Offline' });
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
        await self.registration.showNotification("[ALERTE] ÉCHÉANCE CCE ATTEINTE — 16 OCTOBRE 2026", {
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
    const title = d.title || "[ALERTE] Dossier CCE SEM-26-003 — Alerte Officielle";
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
  const title = payload.title || "[ALERTE] Dossier CCE SEM-26-003 — Alerte Officielle";
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


