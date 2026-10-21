/**
 * site-photo-viewer.js — William Guindon (williamguindon.me)
 * Intégration universelle et haute performance de Viewer.js (© Chen Fengyuan - MIT)
 * Permet l'inspection détaillée, le zoom optique, le déplacement tactile / souris (pan & drag),
 * la rotation, le basculement et la consultation plein écran de toutes les photographies,
 * documents graphiques et archives médias du site (JPEG, PNG, WebP, AVIF, TIFF, Web Archive).
 *
 * Fonctionne avec et sans JavaScript (Progressive Enhancement) :
 * - Sans JavaScript : les liens natifs <a href="..."> ouvrent directement l'image HD dans un nouvel onglet.
 * - Avec JavaScript : Viewer.js s'ouvre avec commandes complètes de zoom, pan, rotation et fermeture sécurisée (X / Échap / Fond).
 *
 * Exclusions strictes : logos officiels, marques partenaires, pictogrammes UI et bannières structurelles.
 */
(function () {
  'use strict';

  const VIEWER_CSS_PATH = '/assets/vendor/viewerjs/viewer.min.css';
  const VIEWER_JS_PATH = '/assets/vendor/viewerjs/viewer.min.js';

  let viewerLibraryLoading = false;
  let viewerLibraryLoaded = false;
  const loadCallbacks = [];

  // Instance active de Viewer pour la fermeture sécurisée
  let currentActiveViewer = null;

  // 1. Injection du CSS de Viewer.js si absent
  function ensureViewerCSS() {
    if (document.querySelector('link[href*="viewer.min.css"], link[href*="viewer.css"]')) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = VIEWER_CSS_PATH;
    document.head.appendChild(link);
  }

  // 2. Chargement asynchrone non-bloquant du JS de Viewer.js
  function ensureViewerJS(callback) {
    if (window.Viewer) {
      viewerLibraryLoaded = true;
      if (typeof callback === 'function') callback();
      return;
    }

    if (callback) loadCallbacks.push(callback);
    if (viewerLibraryLoading) return;
    viewerLibraryLoading = true;

    const script = document.createElement('script');
    script.src = VIEWER_JS_PATH;
    script.async = true;
    script.onload = () => {
      viewerLibraryLoaded = true;
      viewerLibraryLoading = false;
      while (loadCallbacks.length) {
        try {
          const cb = loadCallbacks.shift();
          if (typeof cb === 'function') cb();
        } catch (err) {
          console.warn('[SitePhotoViewer] Callback error:', err);
        }
      }
    };
    script.onerror = () => {
      viewerLibraryLoading = false;
      console.warn('[SitePhotoViewer] Impossible de charger viewer.min.js');
    };
    document.head.appendChild(script);
  }

  // 3. Critères stricts d'éligibilité des images
  function isViewableImage(img) {
    if (!img || !(img instanceof HTMLElement) || img.tagName !== 'IMG') return false;
    if (img.dataset.noViewer === 'true') return false;

    // A. Exclusion explicite des logos et identités visuelles
    if (
      img.classList.contains('brand-mark') ||
      img.classList.contains('brand-logo') ||
      img.classList.contains('site-logo') ||
      img.classList.contains('hero-portrait-avatar') ||
      img.closest('.site-brand, .brand, .brand-container, .navbar-brand, .nav-dropdown, .press-logos, .hero-avatar-wrap')
    ) {
      return false;
    }

    // B. Exclusion des bannières décoratives d'en-tête et fonds de structure
    if (
      img.classList.contains('hero-banner') ||
      img.classList.contains('hero-banner-bg') ||
      img.classList.contains('banner-bg') ||
      img.classList.contains('site-header-bg') ||
      img.closest('.hero-banner, .site-header, nav, site-nav, footer')
    ) {
      return false;
    }

    // C. Exclusion des icônes d'interface et boutons
    if (
      img.classList.contains('svg-icon') ||
      img.classList.contains('icon') ||
      img.classList.contains('lang-flag') ||
      img.closest('button, .tool-btn, .lang-btn, .btn, .icon-wrap')
    ) {
      return false;
    }

    // D. Analyse de la source ou du nom de fichier
    const src = (img.currentSrc || img.src || '').toLowerCase();
    const alt = (img.alt || '').toLowerCase();

    if (
      src.includes('monogram') ||
      src.includes('logo') ||
      alt.includes('logo') ||
      alt.includes('monogramme') ||
      alt.includes('icône')
    ) {
      return false;
    }

    // E. Formats de médias et photographies acceptés (y compris Web Archive et ImageKit)
    const validExtensions = /\.(jpe?g|png|webp|avif|tiff?|bmp|gif)(\?.*)?$/i;
    let urlHost = '';
    try {
      urlHost = new URL(src, window.location.origin).hostname.toLowerCase();
    } catch (_) {}
    const isImageKit = urlHost === 'ik.imagekit.io' || urlHost.endsWith('.imagekit.io');
    const isWebArchive = urlHost === 'archive.org' || urlHost === 'web.archive.org' || urlHost.endsWith('.archive.org');
    const isMediaDir = src.includes('/assets/media/') || src.includes('/photos/') || src.includes('/uploads/');
    const hasPhotoClass = img.classList.contains('photo-img') || 
                          img.classList.contains('blog-card-img') || 
                          img.classList.contains('article-modal-banner-img') ||
                          img.classList.contains('preview-image');

    if (!validExtensions.test(src) && !isImageKit && !isWebArchive && !isMediaDir && !hasPhotoClass) {
      return false;
    }

    return true;
  }

  // 4. Calcul de l'URL haute définition originale
  function getHighResUrl(img) {
    if (!img) return '';
    // A. Lien parent direct ou attribut explicite
    const parentLink = img.closest('a');
    if (parentLink && parentLink.href && /\.(jpe?g|png|webp|avif|tiff?|bmp|gif)(\?.*)?$/i.test(parentLink.href)) {
      return parentLink.href;
    }

    const hdAttr = img.getAttribute('data-original') ||
                   img.getAttribute('data-hd-src') ||
                   img.getAttribute('data-full-src') ||
                   img.getAttribute('data-large-src');
    if (hdAttr) return hdAttr;

    const rawSrc = img.currentSrc || img.src;
    if (!rawSrc) return '';

    try {
      const url = new URL(rawSrc, window.location.href);
      // B. Cas ImageKit : retirer ou maximiser les paramètres de redimensionnement de vignette
      if (url.hostname === 'ik.imagekit.io' || url.hostname.endsWith('.imagekit.io')) {
        const tr = url.searchParams.get('tr');
        if (tr) {
          url.searchParams.set('tr', 'f-auto,q-95');
          return url.toString();
        }
      }
    } catch (_) {}

    return rawSrc;
  }

  // Configuration par défaut de l'interface Viewer.js
  const defaultViewerOptions = {
    inline: false,
    button: true, // Bouton X de fermeture en haut à droite
    navbar: 1,
    zIndex: 999999,
    zIndexInline: 999999,
    backdrop: true, // Permet de fermer en cliquant sur le fond noir
    title: [1, (image, imageData) => {
      const caption = image.alt || image.title || 'Photographie — William Guindon';
      const dimensions = imageData.naturalWidth && imageData.naturalHeight ? ` (${imageData.naturalWidth} × ${imageData.naturalHeight})` : '';
      return `${caption}${dimensions}`;
    }],
    toolbar: {
      zoomIn: 1,
      zoomOut: 1,
      oneToOne: 1,
      reset: 1,
      prev: 1,
      play: 0,
      next: 1,
      rotateLeft: 1,
      rotateRight: 1,
      flipHorizontal: 1,
      flipVertical: 1,
    },
    tooltip: true,
    movable: true,
    zoomable: true,
    rotatable: true,
    scalable: true,
    transition: true,
    fullscreen: true,
    keyboard: true, // Raccourci Échap pour fermer
    loading: true,
    loop: true,
    zoomRatio: 0.15,
    minZoomRatio: 0.1,
    maxZoomRatio: 10,
    url(image) {
      return getHighResUrl(image);
    },
    show() {
      currentActiveViewer = this;
      document.body.classList.add('wg-viewer-open');
    },
    shown() {
      currentActiveViewer = this;
      bindCloseHandlers(this);
    },
    hide() {
      document.body.classList.remove('wg-viewer-open');
      if (currentActiveViewer === this) {
        currentActiveViewer = null;
      }
    }
  };

  // 5. Fermeture garantie du bouton X et du fond
  function bindCloseHandlers(viewerInstance) {
    if (!viewerInstance || !viewerInstance.viewer) return;
    const container = viewerInstance.viewer;

    // A. Bouton X
    const closeBtn = container.querySelector('.viewer-button, .viewer-close, [data-viewer-action="mix"]');
    if (closeBtn && !closeBtn.__wgCloseBound) {
      closeBtn.__wgCloseBound = true;
      closeBtn.setAttribute('title', 'Fermer la vue agrandie (Échap)');
      closeBtn.setAttribute('aria-label', 'Fermer la vue agrandie');

      const handleClose = (e) => {
        e.preventDefault();
        e.stopPropagation();
        viewerInstance.hide();
      };

      closeBtn.addEventListener('click', handleClose, true);
      closeBtn.addEventListener('touchend', handleClose, true);
    }

    // B. Fermeture au clic sur le canvas/fond si on ne glisse pas
    const canvas = container.querySelector('.viewer-canvas');
    if (canvas && !canvas.__wgCloseBound) {
      canvas.__wgCloseBound = true;
      let startX = 0, startY = 0;
      canvas.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
      });
      canvas.addEventListener('mouseup', (e) => {
        // Si clic direct sur le canvas (fond) sans drag
        if (e.target === canvas) {
          const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
          if (dist < 8) {
            viewerInstance.hide();
          }
        }
      });
    }
  }

  // Écouteur global de secours pour la touche Échap
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentActiveViewer) {
      e.preventDefault();
      currentActiveViewer.hide();
    }
  }, true);

  const attachedViewers = new WeakMap();

  // 6. Initialisation d'une galerie d'images
  function setupGallery(container, customOptions) {
    if (!container) return null;
    if (attachedViewers.has(container)) {
      const existing = attachedViewers.get(container);
      if (existing && typeof existing.update === 'function') existing.update();
      return existing;
    }

    const options = Object.assign({}, defaultViewerOptions, {
      filter(image) {
        return isViewableImage(image);
      }
    }, customOptions || {});

    const viewer = new window.Viewer(container, options);
    attachedViewers.set(container, viewer);
    return viewer;
  }

  // 7. Attacher Viewer.js à une image isolée
  function setupSingleImage(img) {
    if (!img || attachedViewers.has(img)) return;

    img.classList.add('wg-viewable-image');
    if (!img.title) {
      img.title = "Cliquer pour agrandir et inspecter (Viewer.js)";
    }

    const singleOptions = Object.assign({}, defaultViewerOptions, {
      navbar: false, // Pas de bande de vignettes pour une image seule
      toolbar: {
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: 0,
        play: 0,
        next: 0,
        rotateLeft: 1,
        rotateRight: 1,
        flipHorizontal: 1,
        flipVertical: 1,
      }
    });

    const viewer = new window.Viewer(img, singleOptions);
    attachedViewers.set(img, viewer);
  }

  // 8. Balayage et initialisation de toutes les photographies de la page
  function scanAndInitPhotos(root = document) {
    if (!window.Viewer) {
      ensureViewerJS(() => scanAndInitPhotos(root));
      return;
    }

    // A. Galeries identifiées
    const galleries = root.querySelectorAll('#photos-grid, .photos-grid, .photo-grid, .articles-grid, .blog-grid, #preview-stage');
    galleries.forEach(gallery => {
      if (!attachedViewers.has(gallery)) {
        setupGallery(gallery);
      } else {
        const v = attachedViewers.get(gallery);
        if (v && typeof v.update === 'function') v.update();
      }
    });

    // B. Images photographiques individuelles
    const allImgs = root.querySelectorAll('img');
    allImgs.forEach(img => {
      if (!isViewableImage(img)) return;
      if (img.closest('#photos-grid, .photos-grid, .photo-grid, .articles-grid, .blog-grid, #preview-stage')) {
        img.classList.add('wg-viewable-image');
        return;
      }
      setupSingleImage(img);
    });
  }

  // 9. Interception des clics sur les liens d'images pour Progressive Enhancement
  document.addEventListener('click', (e) => {
    // Si l'utilisateur clique sur une image éligible ou son lien parent
    const target = e.target;
    if (!target) return;

    // Détection clic sur bouton de fermeture universel
    const closeBtn = target.closest('.viewer-button, .viewer-close, [data-viewer-action="mix"]');
    if (closeBtn && currentActiveViewer) {
      e.preventDefault();
      e.stopPropagation();
      currentActiveViewer.hide();
      return;
    }

    const link = target.closest('a.photo-link-wrap, a.preview-image-link');
    const img = target.tagName === 'IMG' ? target : (link ? link.querySelector('img') : null);

    if (img && isViewableImage(img) && window.Viewer) {
      // Si JavaScript est activé et Viewer prêt, intercepter le lien natif et ouvrir Viewer
      const gallery = img.closest('#photos-grid, .photos-grid, .photo-grid, .articles-grid, .blog-grid, #preview-stage');
      if (gallery && attachedViewers.has(gallery)) {
        e.preventDefault();
        const v = attachedViewers.get(gallery);
        // Trouver l'index de l'image
        const images = Array.from(gallery.querySelectorAll('img')).filter(isViewableImage);
        const imgIndex = images.indexOf(img);
        if (imgIndex !== -1 && v) {
          v.view(imgIndex);
        }
      } else if (attachedViewers.has(img)) {
        e.preventDefault();
        const v = attachedViewers.get(img);
        if (v) v.show();
      }
    }
    // Sans JavaScript, le lien <a href="..."> standard du navigateur s'exécute naturellement !
  });

  // 10. Styles d'interface raffinés pour Viewer.js
  function injectViewerCustomStyles() {
    if (document.getElementById('wg-viewer-custom-css')) return;
    const style = document.createElement('style');
    style.id = 'wg-viewer-custom-css';
    style.textContent = `
      .wg-viewable-image {
        cursor: zoom-in !important;
        transition: filter 0.2s ease, transform 0.2s ease;
      }
      .wg-viewable-image:hover {
        filter: brightness(1.04);
      }
      .viewer-container {
        z-index: 999999 !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      }
      .viewer-backdrop {
        background-color: rgba(6, 12, 10, 0.94) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
      }
      .viewer-toolbar > ul > li {
        background-color: rgba(255, 255, 255, 0.16) !important;
        border-radius: 50% !important;
        margin: 0 4px !important;
        transition: background-color 0.2s ease, transform 0.15s ease !important;
      }
      .viewer-toolbar > ul > li:hover {
        background-color: #059669 !important;
        transform: scale(1.15) !important;
      }
      .viewer-title {
        color: #f1f5f9 !important;
        font-size: 13.5px !important;
        font-weight: 600 !important;
        letter-spacing: 0.01em !important;
        text-shadow: 0 2px 8px rgba(0,0,0,0.8) !important;
        padding: 6px 16px !important;
        background: rgba(0,0,0,0.6) !important;
        border-radius: 20px !important;
        margin-top: 10px !important;
        display: inline-block !important;
      }
      /* Bouton X de fermeture : positionnement clair, cible tactile >= 44px, z-index maximal */
      .viewer-button {
        background-color: rgba(15, 23, 42, 0.85) !important;
        border: 2px solid rgba(255, 255, 255, 0.35) !important;
        border-radius: 50% !important;
        top: 20px !important;
        right: 20px !important;
        width: 46px !important;
        height: 46px !important;
        cursor: pointer !important;
        z-index: 1000000 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.6) !important;
        transition: background-color 0.2s ease, transform 0.15s ease, border-color 0.2s ease !important;
        pointer-events: auto !important;
      }
      .viewer-button:before {
        position: static !important;
        margin: 0 !important;
        pointer-events: none !important;
      }
      .viewer-button:hover,
      .viewer-button:focus {
        background-color: #dc2626 !important;
        border-color: #ef4444 !important;
        transform: scale(1.1) !important;
        outline: none !important;
      }
      .viewer-navbar {
        background-color: rgba(0, 0, 0, 0.65) !important;
      }
      body.wg-viewer-open {
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 11. Initialisation automatique dès le chargement du DOM
  function init() {
    ensureViewerCSS();
    injectViewerCustomStyles();
    ensureViewerJS(() => {
      scanAndInitPhotos(document);
    });

    // Observation des ajouts dynamiques (modales, filtres de photos, prévisualisation drive)
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        for (const mut of mutations) {
          if (mut.addedNodes && mut.addedNodes.length > 0) {
            for (const node of mut.addedNodes) {
              if (node.nodeType === 1) {
                if (node.tagName === 'IMG' || (node.querySelector && node.querySelector('img'))) {
                  shouldUpdate = true;
                  break;
                }
              }
            }
          }
          if (shouldUpdate) break;
        }
        if (shouldUpdate) {
          scanAndInitPhotos(document);
        }
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  // Exposition API pour intégration spécifique
  window.SitePhotoViewer = {
    init,
    scanAndInitPhotos,
    setupGallery,
    setupSingleImage,
    isViewableImage,
    getHighResUrl,
    hideCurrent: () => { if (currentActiveViewer) currentActiveViewer.hide(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
