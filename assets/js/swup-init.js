/**
 * swup-init.js — Initialisation sécurisée de Swup pour williamguindon.me
 * Transition de page fluide & requêtes en direct (cache: false)
 * Pages critiques & interactives complexes explicitement exclues (ignoreVisit).
 * Licence : MIT (Swup) / CC BY-NC-ND 4.0 (Site)
 */

(function () {
  'use strict';

  // Si Swup n'est pas disponible ou support navigation désactivé, sortie silencieuse
  if (typeof window.Swup === 'undefined') {
    return;
  }

  // Liste des pages critiques à exclure impérativement de Swup (navigation native classique)
  // Raison : Moteurs WebGL, PDF.js, Leaflet, ViewerJS, PapaParse, Nostr Crypto, ou consigne utilisateur
  const CRITICAL_PAGES = [
    'reciprocite.html',
    'dossier-journalistes.html',
    'viewer.html',
    'lecteur.html',
    'satellite.html',
    'photos.html',
    'chronologie.html',
    'embed-chronologie.html',
    'messagerie.html',
    'console-admin.html',
    'admin.html',
    'editeur.html',
    'live.html',
    'index.html', // Contient le canvas WebGL Curtains.js du hero 3D
    'actualites.html',
    'txt.html',
    'offline.html',
    'reload.html',
    '404.html'
  ];

  // Extensions de fichiers non-HTML à toujours laisser au navigateur natif
  const FILE_EXTENSIONS = /\.(pdf|xml|json|txt|zip|vcf|svg|mp3|mp4|webm|png|jpg|jpeg|webp|gif|css|js)$/i;

  function isExcludedUrl(urlStr) {
    if (!urlStr) return true;

    try {
      const url = new URL(urlStr, window.location.origin);

      // 1. Domaine externe -> navigation native
      if (url.origin !== window.location.origin) {
        return true;
      }

      // 2. Fichiers binaires, documents, flux -> navigation native
      if (FILE_EXTENSIONS.test(url.pathname)) {
        return true;
      }

      // 3. Extraction du nom de fichier HTML
      const pathname = url.pathname.replace(/\/$/, '') || '/';
      const filename = pathname.split('/').pop() || '';

      // Si c'est la racine '/' ou '/en/' ou '/es/', la page d'accueil possède Curtains.js -> navigation native
      if (pathname === '/' || pathname === '/en' || pathname === '/es') {
        return true;
      }

      for (let i = 0; i < CRITICAL_PAGES.length; i++) {
        const crit = CRITICAL_PAGES[i];
        if (filename === crit || pathname.endsWith('/' + crit)) {
          return true;
        }
      }

      return false;
    } catch (e) {
      return true;
    }
  }

  // Détection d'accessibilité : respect des préférences de mouvement réduit
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    const swup = new window.Swup({
      containers: ['#swup-content', '#main-content', 'main'],
      animationSelector: '[class*="transition-"]',
      animationScope: 'html',
      cache: false, // Toujours récupérer la version la plus récente en direct du serveur
      native: !prefersReducedMotion && !!document.startViewTransition,
      linkSelector: 'a[href]:not([data-no-swup]):not([target="_blank"]):not([download])',
      ignoreVisit: function (url, { el } = {}) {
        // Ignorer si balise ou parent porte data-no-swup
        if (el && el.closest('[data-no-swup]')) {
          return true;
        }
        return isExcludedUrl(url);
      }
    });

    // Hook après remplacement de contenu
    swup.hooks.on('content:replace', function () {
      // 1. Remise à zéro du défilement en haut de page
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // 2. Mise à jour de l'état actif dans la barre de navigation
      try {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a, .nav-item a, nav a');
        navLinks.forEach(function (link) {
          const href = link.getAttribute('href');
          if (href && (href === currentPath || href === currentPath.split('/').pop())) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        });
      } catch (err) {
        // Erreur non bloquante
      }

      // 3. Notification d'événement global pour les modules du site
      document.dispatchEvent(new CustomEvent('swup:page-view', {
        detail: { url: window.location.pathname }
      }));
    });

    // Exposer l'instance de manière sécurisée
    window.__wg_swup = swup;
  } catch (err) {
    console.warn('[Swup] Initialisation annulée, poursuite en navigation standard :', err);
  }
})();
