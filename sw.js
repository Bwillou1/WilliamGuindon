const CACHE_NAME = 'wg-pwa-v254';
const MAX_CACHE_ENTRIES = 256;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/chronologie.txt',
  '/assets/docs/chronologie-cce-sem26003.txt',
  '/assets/docs/dossier-journalistes-tourbiere-blainville-stablex_archive.torrent',
  '/chronologie.html',
  '/embed-chronologie.html',
  '/chronologie-cce-sem26003.svg',
  '/assets/vendor/svg-pan-zoom/svg-pan-zoom.min.js',
  '/assets/js/chronologie-viewer.js',
  '/assets/css/chronologie-viewer.css',
  '/assets/media/carte-importations-dechets-usa-stablex.webp',
  '/william-guindon.vcf',
  '/diplomatie.html',
  '/state.html',
  '/statut.html',
  '/noel.html',
  '/halloween.html',
  '/adultisme.html',
  '/satellite.html',
  '/apparitions-publiques.html',
  '/apercu.html',
  '/lexique.html',
  '/contamination.html',
  '/loi-93.html',
  '/dossier-journalistes.html',
  '/viewer.html',
  '/lecteur.html',
  '/dependances-licences.html',
  '/licence-et-charte.html',
  '/liens.html',
  '/lobby.html',
  '/dev.html',
  '/portrait.html',
  '/reciprocite.html',
  '/transmission-sem26003.html',
  '/cle.html',
  '/delegation.html',
  '/commentaires.html',
  '/telechargement-archive.html',
  '/assets/media/grande-tourbiere-couverture.webp',
  '/assets/docs/observations-reponse-canada-sem26003.pdf',
  '/assets/docs/72-rsp_fr.pdf',
  '/assets/docs/72-rsp_en.pdf',
  '/assets/docs/73-rec_fr.pdf',
  '/assets/docs/73-rec_en.pdf',
  '/assets/docs/petition-546-cedd-bvg.pdf',
  '/assets/docs/26-2-det2_fr.pdf',
  '/assets/docs/26-2-det2_en.pdf',
  '/assets/docs/26-3-det_fr.pdf',
  '/assets/docs/26-3-rsub_fr_redacted.pdf',
  '/assets/docs/26-3-rsub_fr_clean.pdf',
  '/assets/docs/26-3-rsub_en.pdf',
  '/assets/docs/26-3-rsub_es.pdf',
  '/assets/docs/request-terminate-defer-canada-sem26003-en.pdf',
  '/assets/docs/declaration-appui-manfred-liebel-e7834.pdf',
  '/assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf',
  '/assets/docs/chronologie-cce-sem26003-fr.pdf',
  '/assets/docs/chronologie-cce-sem26003-en.pdf',
  '/assets/docs/chronologie-cce-sem26003-es.pdf',
  '/assets/docs/chronologie-cce-sem26003-trilingue-fr-en-es.pdf',
  '/assets/vendor/embedpdf/embedpdf.js',
  '/assets/vendor/embedpdf/embedpdf-cl9qiF45.js',
  '/assets/vendor/embedpdf/worker-engine-BCCrxWYm.js',
  '/assets/vendor/embedpdf/direct-engine-DVLMOJWp.js',
  '/assets/vendor/embedpdf/browser-BKLM0ThC-BCLQGPD6.js',
  '/assets/vendor/embedpdf/pdfium.wasm',
  '/assets/vendor/embedpdf/LICENSE',
  '/assets/js/viewer-embedpdf.js',
  '/assets/js/pdf-viewer.js',
  '/assets/css/pdf-viewer.css',
  '/assets/vendor/pdfjs/pdf.min.js',
  '/assets/vendor/pdfjs/pdf.worker.min.js',
  '/assets/vendor/pdfjs/pdf_viewer.css',
  '/assets/vendor/viewerjs/viewer.min.js',
  '/assets/vendor/viewerjs/viewer.min.css',
  '/assets/js/site-photo-viewer.js',
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
  '/assets/media/moteur-recherche-pieces.jpg',
  '/assets/media/moteur-recherche-pieces.webp',
  '/assets/media/autonomie-juridique-adolescents.jpg',
  '/assets/media/autonomie-juridique-adolescents.webp',
  '/assets/media/clarification-independance.jpg',
  '/assets/media/clarification-independance.webp',
  '/assets/media/certificat-informea-droit-international-environnement.png',
  '/assets/media/certificat-informea-droit-international-environnement.webp',
  '/assets/media/certificat-un-cc-learn-climat-droits-humains.png',
  '/assets/media/certificat-un-cc-learn-climat-droits-humains.webp',
  '/assets/media/confirmation-cce-premier-mineur-1994.png',
  '/assets/media/confirmation-cce-premier-mineur-1994.webp',
  '/assets/media/declaration-liebel-meade-preview.jpg',
  '/assets/media/declaration-liebel-meade-preview.webp',
  '/assets/media/signatures-liebel-meade.png',
  '/assets/media/signatures-liebel-meade.webp',
  '/assets/media/sem-26-003-apercu-banniere.webp',
  '/assets/media/ndtr-banner-rcaanc.jpg',
  '/assets/media/ndtr-banner-rcaanc.webp',
  '/assets/media/memoire-autochtone-tourbiere.jpg',
  '/assets/media/memoire-autochtone-tourbiere.webp',
  '/assets/media/umap-preview.webp',
  '/assets/media/carte-blainville-milieux-naturels.webp',
  '/assets/media/carte-blainville-milieux-naturels.jpg',
  '/assets/media/lapresse-logo.png',
  '/assets/media/ledevoir-logo.png',
  '/assets/media/cbc-logo.jpg',
  '/assets/media/tvbl-logo.png',
  '/assets/media/lesasdelinfo-logo.png',
  '/assets/media/the-rover-logo.jpg',
  '/assets/media/educaloi-logo.png',
  '/assets/media/educaloi-logo.webp',
  '/assets/media/fcqged-logo.png',
  '/assets/media/fcqged-logo.webp',
  '/assets/media/blainville-logo.png',
  '/assets/media/blainville-logo.webp',
  '/assets/media/jdm-logo.svg',
  '/assets/media/curium-logo.png',
  '/assets/media/curium-logo.webp',
  '/assets/media/lab22-logo.png',
  '/assets/media/lab22-logo.webp',
  '/assets/media/science-presse-logo.png',
  '/assets/media/science-presse-logo.webp',
  '/assets/media/north-shore-news-logo.png',
  '/assets/media/north-shore-news-logo.webp',
  '/assets/media/sgtb-medaillon.png',
  '/assets/media/sgtb-medaillon.webp',
  '/assets/media/logo-areq-csq.png',
  '/assets/media/logo-areq-csq.webp',
  '/assets/media/logo-mouvement-actes-csq.png',
  '/assets/media/logo-mouvement-actes-csq.webp',
  '/assets/media/signalement-faunique-plan-bouchard.jpg',
  '/assets/media/signalement-faunique-plan-bouchard.webp',
  '/assets/media/coulisses-replique-cce-sem26003.jpg',
  '/assets/media/coulisses-replique-cce-sem26003.webp',
  '/assets/media/rencontre-nadine-le-gal-6-nov-2026.webp',
  '/assets/media/affiche-documentaire-sem26003.webp',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.jpg',
  '/assets/img/wg-monogram.svg',
  '/assets/img/wg-monogram-reversed.svg',
  '/assets/img/wg-monogram-mono.svg',
  '/assets/img/og-image-1200x630.png',
  '/assets/img/site.webmanifest',
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

  // Ne jamais intercepter les requêtes partielles (Range requests : streaming vidéo, audio, lecture PDF par morceaux)
  // afin de laisser le navigateur et le serveur traiter directement les codes HTTP 206
  if (event.request.headers.has('range')) {
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


