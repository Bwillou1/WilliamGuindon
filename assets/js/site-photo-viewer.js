/**
 * site-photo-viewer.js — William Guindon (williamguindon.me)
 * Intégration universelle et haute performance de Viewer.js (© Chen Fengyuan - MIT)
 * Permet l'inspection détaillée, le zoom optique, le déplacement tactile / souris (pan & drag),
 * la rotation, le basculement et la consultation plein écran de toutes les photographies,
 * documents graphiques et archives médias du site (JPEG, PNG, WebP, AVIF, TIFF, Web Archive).
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
    const validExtensions = /\.(jpe?g|png|webp|avif|tiff?|bmp)(\?.*)?$/i;
    const isImageKit = src.includes('ik.imagekit.io');
    const isWebArchive = src.includes('web.archive.org');
    const isMediaDir = src.includes('/assets/media/') || src.includes('/photos/') || src.includes('/uploads/');
    const hasPhotoClass = img.classList.contains('photo-img') || img.classList.contains('blog-card-img') || img.classList.contains('article-modal-banner-img');

    if (!validExtensions.test(src) && !isImageKit && !isWebArchive && !isMediaDir && !hasPhotoClass) {
      return false;
    }

    return true;
  }

  // 4. Calcul de l'URL haute définition originale
  function getHighResUrl(img) {
    if (!img) return '';
    // A. Attribut explicite de haute résolution
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
          // Remplacer les vignettes étroites par la pleine résolution
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
    button: true,
    navbar: 1,
    title: [1, (image, imageData) => {
      const caption = image.alt || image.title || 'Photographie officielle — William Guindon';
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
    keyboard: true,
    loading: true,
    loop: true,
    zoomRatio: 0.15,
    minZoomRatio: 0.2,
    maxZoomRatio: 6,
    url(image) {
      return getHighResUrl(image);
    }
  };

  const attachedViewers = new WeakMap();

  // 5. Initialisation d'une galerie d'images
  function setupGallery(container, customOptions) {
    if (!container || attachedViewers.has(container)) return attachedViewers.get(container);

    const options = Object.assign({}, defaultViewerOptions, {
      filter(image) {
        return isViewableImage(image);
      }
    }, customOptions || {});

    const viewer = new window.Viewer(container, options);
    attachedViewers.set(container, viewer);
    return viewer;
  }

  // 6. Attacher Viewer.js à une image isolée
  function setupSingleImage(img) {
    if (!img || attachedViewers.has(img)) return;

    // Stylisation du curseur de zoom
    img.classList.add('wg-viewable-image');
    if (!img.title) {
      img.title = "Cliquer pour agrandir et inspecter (Viewer.js)";
    }

    const singleOptions = Object.assign({}, defaultViewerOptions, {
      navbar: false, // Pas de vignettes pour une image seule
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

  // 7. Balayage et initialisation de toutes les photographies de la page
  function scanAndInitPhotos(root = document) {
    if (!window.Viewer) {
      ensureViewerJS(() => scanAndInitPhotos(root));
      return;
    }

    // A. Galeries identifiées
    const galleries = root.querySelectorAll('#photos-grid, .photos-grid, .photo-grid, .articles-grid, .blog-grid');
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
      // Si l'image est déjà dans une galerie gérée par Viewer.js, ne pas créer de visualiseur isolé en doublon
      if (img.closest('#photos-grid, .photos-grid, .photo-grid, .articles-grid, .blog-grid')) {
        img.classList.add('wg-viewable-image');
        return;
      }
      setupSingleImage(img);
    });
  }

  // 8. Style global additionnel pour le curseur et l'intégration visuelle
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
      .viewer-backdrop {
        background-color: rgba(6, 12, 10, 0.94) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
      }
      .viewer-toolbar > ul > li {
        background-color: rgba(255, 255, 255, 0.15) !important;
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
        font-family: inherit !important;
        font-size: 13.5px !important;
        font-weight: 600 !important;
        letter-spacing: 0.01em !important;
        text-shadow: 0 2px 8px rgba(0,0,0,0.8) !important;
        padding: 6px 14px !important;
        background: rgba(0,0,0,0.5) !important;
        border-radius: 20px !important;
        margin-top: 10px !important;
        display: inline-block !important;
      }
      .viewer-button {
        background-color: rgba(255, 255, 255, 0.2) !important;
        border-radius: 50% !important;
        top: 20px !important;
        right: 20px !important;
        width: 44px !important;
        height: 44px !important;
      }
      .viewer-button:hover {
        background-color: #ef4444 !important;
      }
      .viewer-navbar {
        background-color: rgba(0, 0, 0, 0.6) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 9. Initialisation automatique dès le chargement du DOM
  function init() {
    ensureViewerCSS();
    injectViewerCustomStyles();
    ensureViewerJS(() => {
      scanAndInitPhotos(document);
    });

    // Observation des ajouts dynamiques (modales, filtres de photos, chargement infini)
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        for (const mut of mutations) {
          if (mut.addedNodes && mut.addedNodes.length > 0) {
            for (const node of mut.addedNodes) {
              if (node.nodeType === 1) {
                if (node.tagName === 'IMG' || node.querySelector('img')) {
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
    getHighResUrl
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
