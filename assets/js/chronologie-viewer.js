/**
 * chronologie-viewer.js — William Guindon (williamguindon.me)
 * Visualiseur interactif vectoriel (SVG) de la frise chronologique officielle
 * du dossier CCE SEM-26-003, propulsé par la bibliothèque libre svg-pan-zoom.
 *
 * Fonctionnalités :
 * - Navigation fluide : Pan (glisser-déposer), Zoom (molette et pincement tactile), Ajustement (100%), Plein écran
 * - Téléchargement multi-formats : SVG (vectoriel), PNG (haute résolution), PDF (document imprimable) et Pack Trilingue
 * - Mode Embed (iFrame sur d'autres sites) : Affiche uniquement la frise vectorielle avec une petite bannière verte officielle menant à williamguindon.me
 *
 * Attribution et Remerciements :
 * svg-pan-zoom v3.6.2 — Copyright © 2009-2010 Andrea Leofreddi, Alex Bumbu & contributeurs.
 * Licence BSD-2-Clause (voir THIRD-PARTY-NOTICES.md et assets/vendor/svg-pan-zoom/LICENSE).
 */
(function () {
  'use strict';

  const I18N = {
    fr: {
      title: "Frise chronologique officielle CCE SEM-26-003",
      subtitle: "10 étapes de la procédure ACEUM · BAPE 371 & Loi 93 · Litige compensatoire jusqu'en 2040",
      loading: "Chargement de la frise vectorielle haute résolution...",
      error: "Impossible de charger la frise vectorielle.",
      downloadSvg: "Télécharger en SVG (Vectoriel, 456 Ko)",
      downloadPng: "Télécharger en PNG (Image HD, 830 Ko)",
      downloadPdf: "Télécharger en PDF (Document officiel, 750 Ko)",
      downloadPack: "Télécharger le pack trilingue PDF (3,3 Mo)",
      zoomIn: "Zoom avant (+)",
      zoomOut: "Zoom arrière (−)",
      reset: "Vue globale (100%)",
      fullscreen: "Plein écran",
      exitFullscreen: "Quitter le plein écran",
      instructions: "Déplacez à la souris ou au doigt · Molette ou pincement pour zoomer · Double-clic pour centrer",
      credits: "Interactions vectorielles propulsées par la bibliothèque libre <a href=\"https://github.com/bumbu/svg-pan-zoom\" target=\"_blank\" rel=\"noopener noreferrer\">svg-pan-zoom</a> (Licence BSD-2-Clause, © Andrea Leofreddi & Alex Bumbu).",
      embedBrand: "Dossier officiel CCE SEM-26-003 · William Guindon",
      embedButton: "Voir le site officiel williamguindon.me ↗"
    },
    en: {
      title: "Official CEC SEM-26-003 Procedure Timeline",
      subtitle: "10 USMCA procedural steps · BAPE 371 & Bill 93 · Ongoing litigation horizon through 2040",
      loading: "Loading high-resolution vector timeline...",
      error: "Unable to load vector timeline.",
      downloadSvg: "Download SVG (Vector, 414 KB)",
      downloadPng: "Download PNG (HD Image, 818 KB)",
      downloadPdf: "Download PDF (Official Document, 1.3 MB)",
      downloadPack: "Download Trilingual PDF Pack (3.3 MB)",
      zoomIn: "Zoom In (+)",
      zoomOut: "Zoom Out (−)",
      reset: "Fit to screen (100%)",
      fullscreen: "Fullscreen",
      exitFullscreen: "Exit Fullscreen",
      instructions: "Drag to pan · Scroll wheel or pinch to zoom · Double-click to focus",
      credits: "Vector interactions powered by the open-source library <a href=\"https://github.com/bumbu/svg-pan-zoom\" target=\"_blank\" rel=\"noopener noreferrer\">svg-pan-zoom</a> (BSD-2-Clause License, © Andrea Leofreddi & Alex Bumbu).",
      embedBrand: "Official CEC SEM-26-003 Dossier · William Guindon",
      embedButton: "Visit official website williamguindon.me ↗"
    },
    es: {
      title: "Cronología oficial del procedimiento CCA SEM-26-003",
      subtitle: "10 etapas procesales T-MEC · BAPE 371 y Ley 93 · Horizonte de litigio hasta 2040",
      loading: "Cargando cronología vectorial de alta resolución...",
      error: "No se pudo cargar la cronología vectorial.",
      downloadSvg: "Descargar SVG (Vectorial, 419 KB)",
      downloadPng: "Descargar PNG (Imagen HD, 835 KB)",
      downloadPdf: "Descargar PDF (Documento oficial, 1.3 MB)",
      downloadPack: "Descargar paquete trilingüe PDF (3.3 MB)",
      zoomIn: "Acercar (+)",
      zoomOut: "Alejar (−)",
      reset: "Vista general (100%)",
      fullscreen: "Pantalla completa",
      exitFullscreen: "Salir de pantalla completa",
      instructions: "Arrastre para desplazarse · Rueda o pellizco para zoom · Doble clic para enfocar",
      credits: "Interacciones vectoriales impulsadas por la biblioteca libre <a href=\"https://github.com/bumbu/svg-pan-zoom\" target=\"_blank\" rel=\"noopener noreferrer\">svg-pan-zoom</a> (Licencia BSD-2-Clause, © Andrea Leofreddi & Alex Bumbu).",
      embedBrand: "Expediente oficial CCA SEM-26-003 · William Guindon",
      embedButton: "Ver sitio web oficial williamguindon.me ↗"
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
    } catch (_) { return true; }
    return false;
  }

  function ensureSvgPanZoom(callback) {
    if (typeof window.svgPanZoom === 'function') {
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

    const pngUrl = `/chronologie-cce-sem26003${svgLangSuffix}.png`;
    const pdfUrl = `/chronologie-cce-sem26003${svgLangSuffix}.pdf`;
    const packUrl = `/chronologie-cce-sem26003-trilingue-fr-en-es.pdf`;

    const svgFilename = `chronologie-cce-sem26003${svgLangSuffix}.svg`;
    const pngFilename = `chronologie-cce-sem26003${svgLangSuffix}.png`;
    const pdfFilename = `chronologie-cce-sem26003${svgLangSuffix}.pdf`;

    container.classList.add('wg-chronologie-container');

    container.innerHTML = `
      <div class="wg-chronologie-header">
        <div class="wg-chronologie-titles">
          <span class="wg-chronologie-badge">SVG Vectoriel Interactif</span>
          <h3 class="wg-chronologie-title">${t.title}</h3>
          <p class="wg-chronologie-subtitle">${t.subtitle}</p>
        </div>
        <div class="wg-chronologie-toolbar" role="toolbar" aria-label="Contrôles d'interaction de la frise">
          <button type="button" class="wg-chronologie-btn wg-btn-zoom-in" title="${t.zoomIn}" aria-label="${t.zoomIn}">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            <span>+</span>
          </button>
          <button type="button" class="wg-chronologie-btn wg-btn-zoom-out" title="${t.zoomOut}" aria-label="${t.zoomOut}">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            <span>−</span>
          </button>
          <button type="button" class="wg-chronologie-btn wg-btn-reset" title="${t.reset}" aria-label="${t.reset}">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            <span>${t.reset}</span>
          </button>
          <button type="button" class="wg-chronologie-btn wg-btn-fullscreen" title="${t.fullscreen}" aria-label="${t.fullscreen}">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
            <span class="wg-fs-label">${t.fullscreen}</span>
          </button>

          <!-- TÉLÉCHARGEMENT MULTI-FORMATS (SVG, PNG, PDF) -->
          <div class="wg-chronologie-downloads" role="group" aria-label="Télécharger en plusieurs formats">
            <a href="${svgUrl}" download="${svgFilename}" class="wg-chronologie-btn" title="${t.downloadSvg}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>SVG</span>
            </a>
            <a href="${pngUrl}" download="${pngFilename}" class="wg-chronologie-btn" title="${t.downloadPng}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <span>PNG</span>
            </a>
            <a href="${pdfUrl}" download="${pdfFilename}" class="wg-chronologie-btn" title="${t.downloadPdf}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              <span>PDF</span>
            </a>
          </div>
        </div>
      </div>

      <div class="wg-chronologie-instructions">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>${t.instructions}</span>
      </div>

      <div class="wg-chronologie-stage" tabindex="0" role="region" aria-label="Visualiseur SVG interactif">
        <div class="wg-chronologie-loading">
          <div class="wg-chronologie-spinner"></div>
          <p>${t.loading}</p>
        </div>
      </div>

      <div class="wg-chronologie-footer">
        <p class="wg-chronologie-credits">
          ${t.credits}
          <span style="margin-left: 10px;">
            <a href="${packUrl}" download="chronologie-cce-sem26003-trilingue-fr-en-es.pdf" style="font-weight:700;">
              📄 ${t.downloadPack} ↗
            </a>
          </span>
        </p>
      </div>

      <!-- BANNIÈRE DISCRÈTE POUR LE MODE EMBED -->
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
    const btnZoomIn = container.querySelector('.wg-btn-zoom-in');
    const btnZoomOut = container.querySelector('.wg-btn-zoom-out');
    const btnReset = container.querySelector('.wg-btn-reset');
    const btnFullscreen = container.querySelector('.wg-btn-fullscreen');
    const fsLabel = container.querySelector('.wg-fs-label');

    let panZoomInstance = null;

    fetch(svgUrl)
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(svgText => {
        stage.innerHTML = svgText;
        const svgEl = stage.querySelector('svg');
        if (!svgEl) throw new Error('SVG introuvable dans la réponse.');

        svgEl.setAttribute('id', 'chronologie-svg-' + Math.random().toString(36).substring(2, 9));
        svgEl.style.width = '100%';
        svgEl.style.height = '100%';
        svgEl.style.display = 'block';
        svgEl.style.userSelect = 'none';
        svgEl.style.webkitUserSelect = 'none';

        // Configuration et renforcement des liens interactifs intégrés dans le SVG
        const svgLinks = svgEl.querySelectorAll('a');
        svgLinks.forEach(link => {
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
            // L'utilisateur glissait/déplaçait la vue : on annule l'activation accidentelle du lien
            e.preventDefault();
            e.stopPropagation();
            isDragging = false;
            return;
          }
          if (link) {
            const href = link.getAttribute('href') || link.getAttribute('xlink:href') || link.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
              e.preventDefault();
              e.stopPropagation();
              window.open(href, '_blank', 'noopener,noreferrer');
            }
          }
        }, { capture: true });

        ensureSvgPanZoom(() => {
          panZoomInstance = window.svgPanZoom(svgEl, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.3,
            maxZoom: 16,
            zoomScaleSensitivity: 0.22,
            dblClickZoomEnabled: true,
            mouseWheelZoomEnabled: true,
            preventMouseEventsDefault: false
          });

          // Mobile touch pinch-to-zoom support
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

          // Boutons de contrôle
          btnZoomIn.addEventListener('click', (e) => {
            e.preventDefault();
            if (panZoomInstance) panZoomInstance.zoomIn();
          });

          btnZoomOut.addEventListener('click', (e) => {
            e.preventDefault();
            if (panZoomInstance) panZoomInstance.zoomOut();
          });

          btnReset.addEventListener('click', (e) => {
            e.preventDefault();
            if (panZoomInstance) {
              panZoomInstance.reset();
              panZoomInstance.fit();
              panZoomInstance.center();
            }
          });

          // Resize sur changement de fenêtre
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
              <a href="${svgUrl}" target="_blank" class="btn btn-outline" style="color:#22c55e;">SVG ↗</a>
              <a href="${pngUrl}" target="_blank" class="btn btn-outline" style="color:#22c55e; margin-left:6px;">PNG ↗</a>
              <a href="${pdfUrl}" target="_blank" class="btn btn-outline" style="color:#22c55e; margin-left:6px;">PDF ↗</a>
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

    btnFullscreen.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFullscreen();
    });

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
