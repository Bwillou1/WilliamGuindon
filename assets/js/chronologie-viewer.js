/**
 * chronologie-viewer.js — William Guindon (williamguindon.me)
 * Visualiseur interactif vectoriel (SVG) de la frise chronologique officielle
 * du recours international CCE SEM-26-003, propulsé par la bibliothèque libre svg-pan-zoom.
 *
 * Attribution et Remerciements :
 * svg-pan-zoom v3.6.2 — Copyright © 2009-2010 Andrea Leofreddi, Alex Bumbu & contributeurs.
 * Licence BSD-2-Clause (voir THIRD-PARTY-NOTICES.md et assets/vendor/svg-pan-zoom/LICENSE).
 */
(function () {
  'use strict';

  const I18N = {
    fr: {
      title: "Ligne du temps du recours CCE SEM-26-003",
      subtitle: "10 étapes procédurales ACEUM · BAPE 371 & Loi 93 · Litige jusqu'en 2040",
      loading: "Chargement de la frise vectorielle haute résolution...",
      error: "Impossible de charger la frise vectorielle.",
      downloadPdf: "Télécharger PDF HD",
      reset: "100%",
      fullscreen: "Plein écran",
      exitFullscreen: "Quitter",
      instructions: "Glisser pour explorer · Pincer ou molette pour zoomer · Clic sur une étape pour approfondir",
      embedBrand: "Dossier officiel CCE SEM-26-003 · William Guindon",
      embedButton: "Consulter sur williamguindon.me ↗"
    },
    en: {
      title: "CEC SEM-26-003 Procedure Timeline",
      subtitle: "10 USMCA procedural steps · BAPE 371 & Bill 93 · Litigation horizon through 2040",
      loading: "Loading high-resolution vector timeline...",
      error: "Unable to load vector timeline.",
      downloadPdf: "Download HD PDF",
      reset: "100%",
      fullscreen: "Fullscreen",
      exitFullscreen: "Exit",
      instructions: "Drag to explore · Pinch or scroll to zoom · Click an item for details",
      embedBrand: "Official CEC SEM-26-003 Dossier · William Guindon",
      embedButton: "Visit williamguindon.me ↗"
    },
    es: {
      title: "Cronología del procedimiento CCA SEM-26-003",
      subtitle: "10 etapas procesales T-MEC · BAPE 371 y Ley 93 · Litigio hasta 2040",
      loading: "Cargando cronología vectorial de alta resolución...",
      error: "No se pudo cargar la cronología vectorial.",
      downloadPdf: "Descargar PDF HD",
      reset: "100%",
      fullscreen: "Pantalla completa",
      exitFullscreen: "Salir",
      instructions: "Arrastre para explorar · Pellizque o rueda para zoom · Clic en un elemento",
      embedBrand: "Expediente oficial CCA SEM-26-003 · William Guindon",
      embedButton: "Ver williamguindon.me ↗"
    }
  };

  function getLang() {
    const lang = (document.documentElement.lang || 'fr').toLowerCase().slice(0, 2);
    return I18N[lang] ? lang : 'fr';
  }

  function checkIsEmbed() {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('embed') === '1' || p.get('widget') === '1' || p.get('iframe') === '1') return true;
    } catch (_) {}
    if (window.location.pathname.includes('embed-chronologie')) return true;
    try {
      if (window.self !== window.top) return true;
    } catch (_) {
      return true;
    }
    return false;
  }

  function ensureSvgPanZoom(callback) {
    if (window.svgPanZoom) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = '/assets/vendor/svg-pan-zoom/svg-pan-zoom.min.js';
    script.async = true;
    script.onload = () => callback();
    script.onerror = () => {
      console.error('[chronologie-viewer] Impossible de charger svg-pan-zoom.min.js');
    };
    document.head.appendChild(script);
  }

  function initViewer(container) {
    if (container._wgChronologieInitialized) return;
    container._wgChronologieInitialized = true;

    const lang = getLang();
    const t = I18N[lang];
    const isEmbed = checkIsEmbed();

    if (isEmbed) {
      document.documentElement.classList.add('is-embedded-widget');
      document.body.classList.add('is-embed-mode');
    }

    // Détermination dynamique des URL de fichiers selon la langue
    const svgLangSuffix = (lang === 'en') ? '-en' : ((lang === 'es') ? '-es' : '-fr');
    let svgUrl = container.getAttribute('data-svg-url') || `/chronologie-cce-sem26003${svgLangSuffix}.svg`;
    if (!svgUrl.startsWith('/') && !svgUrl.startsWith('http')) {
      svgUrl = '/' + svgUrl;
    }

    const pdfUrl = `/chronologie-cce-sem26003${svgLangSuffix}.pdf`;
    const pdfFilename = `chronologie-cce-sem26003${svgLangSuffix}.pdf`;

    container.classList.add('wg-chronologie-container');

    container.innerHTML = `
      <div class="wg-chronologie-header">
        <div class="wg-chronologie-titles">
          <span class="wg-chronologie-badge">Frise vectorielle HD</span>
          <h3 class="wg-chronologie-title">${t.title}</h3>
          <p class="wg-chronologie-subtitle">${t.subtitle}</p>
        </div>
        <div class="wg-chronologie-toolbar" role="toolbar" aria-label="Contrôles discrets de la frise">
          <button type="button" class="wg-chronologie-btn wg-btn-reset" title="${t.reset}" aria-label="${t.reset}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            <span>${t.reset}</span>
          </button>
          <a href="${pdfUrl}" download="${pdfFilename}" class="wg-chronologie-btn wg-btn-pdf" title="${t.downloadPdf}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <span>${t.downloadPdf}</span>
          </a>
          <button type="button" class="wg-chronologie-btn wg-btn-fullscreen" title="${t.fullscreen}" aria-label="${t.fullscreen}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
            <span class="wg-fs-label">${t.fullscreen}</span>
          </button>
        </div>
      </div>

      <div class="wg-chronologie-stage" tabindex="0" role="region" aria-label="Visualiseur vectoriel interactif">
        <div class="wg-chronologie-loading">
          <div class="wg-chronologie-spinner"></div>
          <p>${t.loading}</p>
        </div>
      </div>

      <div class="wg-chronologie-subtle-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span>${t.instructions}</span>
      </div>

      ${isEmbed ? `
      <div class="wg-embed-brand-banner">
        <div class="wg-embed-brand-left">
          <span class="wg-embed-brand-dot"></span>
          <span class="wg-embed-brand-text">${t.embedBrand}</span>
        </div>
        <a href="https://williamguindon.me/${lang === 'en' ? 'en/chronologie' : (lang === 'es' ? 'es/chronologie' : 'chronologie.html')}" target="_blank" rel="noopener noreferrer" class="wg-embed-brand-btn">
          ${t.embedButton}
        </a>
      </div>
      ` : ''}
    `;

    const stage = container.querySelector('.wg-chronologie-stage');
    const btnReset = container.querySelector('.wg-btn-reset');
    const btnFullscreen = container.querySelector('.wg-btn-fullscreen');
    const fsLabel = container.querySelector('.wg-fs-label');

    let panZoomInstance = null;

    fetch(svgUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(svgText => {
        stage.innerHTML = svgText;
        const svgEl = stage.querySelector('svg');
        if (!svgEl) throw new Error('Balise SVG introuvable');

        svgEl.setAttribute('id', 'wg-chronologie-svg-' + Math.random().toString(36).slice(2, 8));
        svgEl.style.width = '100%';
        svgEl.style.height = '100%';
        svgEl.style.maxWidth = 'none';
        svgEl.style.maxHeight = 'none';
        svgEl.style.display = 'block';

        const links = svgEl.querySelectorAll('a');
        links.forEach(link => {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
          const href = link.getAttribute('href') || link.getAttribute('xlink:href');
          if (href && !link.getAttribute('title')) {
            link.setAttribute('title', `${href} ↗`);
          }
        });

        // Détection fine glisser (pan) vs clic direct sur les liens du SVG
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        stage.addEventListener('pointerdown', (e) => {
          isDragging = false;
          startX = e.clientX;
          startY = e.clientY;
        }, { capture: true, passive: true });

        stage.addEventListener('pointermove', (e) => {
          if (Math.hypot(e.clientX - startX, e.clientY - startY) > 7) {
            isDragging = true;
          }
        }, { capture: true, passive: true });

        stage.addEventListener('click', (e) => {
          const link = e.target.closest('a');
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            isDragging = false;
            return;
          }
          if (link) {
            const rawHref = link.getAttribute('href') || link.getAttribute('xlink:href') || link.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
            if (rawHref && rawHref !== '#' && !rawHref.startsWith('#')) {
              try {
                const parsed = new URL(rawHref, window.location.origin);
                if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(parsed.href, '_blank', 'noopener,noreferrer');
                }
              } catch (_) {}
            }
          }
        }, { capture: true });

        ensureSvgPanZoom(() => {
          panZoomInstance = window.svgPanZoom(svgEl, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.35,
            maxZoom: 16,
            zoomScaleSensitivity: 0.22,
            dblClickZoomEnabled: true,
            mouseWheelZoomEnabled: true,
            preventMouseEventsDefault: false
          });

          // Support tactile à 2 doigts : zoom pinch et pan sans bloquer le scroll vertical à 1 doigt
          let initialPinchDistance = null;
          let initialPinchZoom = 1;

          stage.addEventListener('touchstart', function (e) {
            if (e.touches.length === 2) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              initialPinchDistance = Math.hypot(dx, dy);
              if (panZoomInstance) {
                initialPinchZoom = panZoomInstance.getZoom();
              }
            }
          }, { passive: true });

          stage.addEventListener('touchmove', function (e) {
            if (e.touches.length === 2 && initialPinchDistance && panZoomInstance) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              const currentDistance = Math.hypot(dx, dy);
              const factor = currentDistance / initialPinchDistance;
              const rect = stage.getBoundingClientRect();
              const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
              const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

              panZoomInstance.zoomAtPoint(initialPinchZoom * factor, { x: midX, y: midY });
            }
          }, { passive: true });

          stage.addEventListener('touchend', function () {
            initialPinchDistance = null;
          }, { passive: true });

          // Bouton réinitialiser (100%)
          if (btnReset) {
            btnReset.addEventListener('click', (e) => {
              e.preventDefault();
              if (panZoomInstance) {
                panZoomInstance.reset();
                panZoomInstance.fit();
                panZoomInstance.center();
              }
            });
          }

          // Ajustement lors du redimensionnement de la fenêtre
          window.addEventListener('resize', () => {
            if (panZoomInstance) {
              panZoomInstance.resize();
              panZoomInstance.fit();
              panZoomInstance.center();
            }
          });
        });
      })
      .catch(err => {
        console.error('[chronologie-viewer] Erreur de chargement :', err);
        stage.innerHTML = `
          <div class="wg-chronologie-error">
            <p><strong>${t.error}</strong></p>
            <p style="margin-top:8px;">
              <a href="${pdfUrl}" target="_blank" class="wg-chronologie-btn">${t.downloadPdf} ↗</a>
            </p>
          </div>
        `;
      });

    // Gestion du plein écran
    function toggleFullscreen() {
      const isFs = document.fullscreenElement === container ||
                   document.webkitFullscreenElement === container;

      if (!isFs) {
        const req = container.requestFullscreen || container.webkitRequestFullscreen;
        if (req) {
          req.call(container).catch(err => {
            console.warn('[chronologie-viewer] Plein écran impossible :', err);
          });
        }
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      }
    }

    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', (e) => {
        e.preventDefault();
        toggleFullscreen();
      });
    }

    const onFullscreenChange = () => {
      const isFs = document.fullscreenElement === container ||
                   document.webkitFullscreenElement === container;
      if (isFs) {
        container.classList.add('is-fullscreen');
        if (fsLabel) fsLabel.textContent = t.exitFullscreen;
      } else {
        container.classList.remove('is-fullscreen');
        if (fsLabel) fsLabel.textContent = t.fullscreen;
      }
      setTimeout(() => {
        if (panZoomInstance) {
          panZoomInstance.resize();
          panZoomInstance.fit();
          panZoomInstance.center();
        }
      }, 100);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  }

  function autoInit() {
    const viewers = document.querySelectorAll('.wg-chronologie-viewer, [data-chronologie-viewer]');
    viewers.forEach(initViewer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.initWgChronologieViewer = initViewer;
})();
