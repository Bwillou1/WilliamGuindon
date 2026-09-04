/**
 * assets/js/pdf-viewer.js — Moteur de lecture PDF Haute Performance (williamguindon.me)
 * Inspiré de KOReader, PDFSlick et react-pdf pour un rendu authentique et fluide.
 */

(function() {
  'use strict';

  // Configuration PDF.js locale
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdfjs/pdf.worker.min.js';
  }

  // Catalogue des documents officiels
  const DOCS_CATALOG = {
    'decision-17-aout-2026': {
      title: "Détermination positive du Secrétariat CCE (17 août 2026)",
      file: "assets/docs/decision-secretariat-17-aout-2026.pdf",
      badge: "SEM-26-003 · CCE / ACEUM",
      date: "17 août 2026",
      pages: 28,
      type: "Décision officielle (Art. 24.27(2) et (3))"
    },
    'soumission-16-juillet-2026': {
      title: "Communication révisée SEM-26-003 (16 juillet 2026)",
      file: "assets/docs/soumission-revisee-16-juillet-2026.pdf",
      badge: "SEM-26-003 · Soumission Citoyenne",
      date: "16 juillet 2026",
      pages: 15,
      type: "Communication formelle (15 pages)"
    },
    'decision-3-juin-2026': {
      title: "Décision préliminaire du Secrétariat CCE (3 juin 2026)",
      file: "assets/docs/decision-secretariat-3-juin-2026.pdf",
      badge: "SEM-26-003 · CCE / ACEUM",
      date: "3 juin 2026",
      pages: 17,
      type: "Décision d'examen initial"
    },
    'onu-mai-2026': {
      title: "Déposition formelle à l'ONU (Mai 2026)",
      file: "assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf",
      badge: "ONU · Droits Humains",
      date: "Mai 2026",
      pages: 14,
      type: "Mémoire au Rapporteur spécial"
    }
  };

  // État de l'application
  const state = {
    pdfDoc: null,
    currentFile: '',
    currentPage: 1,
    totalPages: 0,
    zoomScale: 1.0,
    zoomMode: 'fit-width', // 'fit-width', 'fit-page', 'auto', 'custom'
    rotation: 0,
    layoutMode: 'continuous', // 'continuous', 'single', 'spread'
    readingMode: 'normal', // 'normal', 'dark', 'sepia', 'contrast'
    pageRenderingQueue: new Map(), // pageNum -> renderTask
    renderedPages: new Set(),
    pageHeights: [],
    pageWidths: [],
    searchResults: [],
    currentSearchIndex: -1,
    isSearching: false,
    sidebarOpen: window.innerWidth > 900
  };

  // Éléments du DOM
  const dom = {
    app: document.getElementById('pdf-app'),
    viewport: document.getElementById('viewer-viewport'),
    pagesContainer: document.getElementById('pages-container'),
    sidebar: document.getElementById('viewer-sidebar'),
    btnSidebarToggle: document.getElementById('btn-sidebar-toggle'),
    docSelect: document.getElementById('viewer-doc-select'),
    badge: document.getElementById('viewer-badge'),
    btnPrev: document.getElementById('btn-page-prev'),
    btnNext: document.getElementById('btn-page-next'),
    inputPage: document.getElementById('input-page-num'),
    labelTotalPages: document.getElementById('label-total-pages'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    selectZoom: document.getElementById('select-zoom'),
    selectLayout: document.getElementById('select-layout'),
    selectReadingMode: document.getElementById('select-reading-mode'),
    btnRotate: document.getElementById('btn-rotate'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    btnDownload: document.getElementById('btn-download'),
    btnPrint: document.getElementById('btn-print'),
    btnShare: document.getElementById('btn-share'),
    btnShortcuts: document.getElementById('btn-shortcuts'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    loadingOverlay: document.getElementById('viewer-loading'),
    loadingText: document.getElementById('loading-text'),
    toast: document.getElementById('viewer-toast'),
    // Sidebar panes
    tabThumbnails: document.getElementById('tab-thumbnails'),
    tabOutline: document.getElementById('tab-outline'),
    tabSearch: document.getElementById('tab-search'),
    tabInfo: document.getElementById('tab-info'),
    paneThumbnails: document.getElementById('pane-thumbnails'),
    paneOutline: document.getElementById('pane-outline'),
    paneSearch: document.getElementById('pane-search'),
    paneInfo: document.getElementById('pane-info'),
    thumbnailsGrid: document.getElementById('thumbnails-grid'),
    outlineTree: document.getElementById('outline-tree'),
    inputSearch: document.getElementById('input-search'),
    btnSearchPrev: document.getElementById('btn-search-prev'),
    btnSearchNext: document.getElementById('btn-search-next'),
    searchCountLabel: document.getElementById('search-count-label'),
    searchResultsList: document.getElementById('search-results-list'),
    docMetaTable: document.getElementById('doc-meta-table'),
    // Mobile controls
    mobilePageNum: document.getElementById('mobile-page-num'),
    mobileBtnPrev: document.getElementById('mobile-btn-prev'),
    mobileBtnNext: document.getElementById('mobile-btn-next'),
    shortcutsDialog: document.getElementById('shortcuts-dialog')
  };

  /**
   * Initialisation générale
   */
  async function init() {
    // 1. Initialiser le thème (sync avec site)
    const savedTheme = localStorage.getItem('wg_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      state.readingMode = 'dark';
      dom.app.classList.add('mode-dark');
      if (dom.selectReadingMode) dom.selectReadingMode.value = 'dark';
    }

    // 2. Extraire les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    let targetFile = urlParams.get('file') || urlParams.get('doc');
    let targetPage = parseInt(urlParams.get('page') || window.location.hash.replace('#page=', ''), 10) || 1;
    let targetDocKey = urlParams.get('id');

    // Résolution du document
    if (!targetFile && targetDocKey && DOCS_CATALOG[targetDocKey]) {
      targetFile = DOCS_CATALOG[targetDocKey].file;
    }

    if (!targetFile) {
      // Par défaut : Détermination du 17 août 2026
      targetFile = DOCS_CATALOG['decision-17-aout-2026'].file;
    }

    // Associer le sélecteur
    syncDocSelectWithFile(targetFile);

    // Initialiser les événements UI
    setupEventListeners();

    // Charger le document PDF
    await loadPDF(targetFile, targetPage);
  }

  /**
   * Synchronise le menu déroulant avec le fichier chargé
   */
  function syncDocSelectWithFile(filePath) {
    if (!dom.docSelect) return;
    for (const [key, doc] of Object.entries(DOCS_CATALOG)) {
      if (filePath.includes(doc.file) || doc.file.includes(filePath) || filePath.includes(key)) {
        dom.docSelect.value = key;
        if (dom.badge) dom.badge.textContent = doc.badge;
        document.title = `${doc.title} — Lecteur Officiel · William Guindon`;
        return;
      }
    }
  }

  /**
   * Charge un fichier PDF via PDF.js
   */
  async function loadPDF(url, startPage = 1) {
    showLoading("Chargement du document haute fidélité...");
    state.currentFile = url;

    try {
      // Annuler les tâches précédentes
      for (const [pageNum, task] of state.pageRenderingQueue.entries()) {
        if (task && task.cancel) task.cancel();
      }
      state.pageRenderingQueue.clear();
      state.renderedPages.clear();

      // Charger le document
      const loadingTask = pdfjsLib.getDocument({
        url: url,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        enableXfa: true
      });

      state.pdfDoc = await loadingTask.promise;
      state.totalPages = state.pdfDoc.numPages;
      state.currentPage = Math.min(Math.max(1, startPage), state.totalPages);

      if (dom.labelTotalPages) dom.labelTotalPages.textContent = `/ ${state.totalPages}`;
      if (dom.inputPage) {
        dom.inputPage.value = state.currentPage;
        dom.inputPage.max = state.totalPages;
      }
      updateMobilePageNum();

      // Créer les conteneurs de pages pour le défilement continu
      setupPageContainers();

      // Charger les métadonnées & le sommaire
      loadDocumentOutline();
      loadDocumentMetadata();

      // Générer les vignettes dans la barre latérale
      generateThumbnails();

      // Ajuster le zoom et rendre les pages visibles
      applyZoom();

      hideLoading();

      // Faire défiler vers la page de départ si > 1
      if (state.currentPage > 1) {
        setTimeout(() => scrollToPage(state.currentPage), 150);
      }

      showToast(`Document prêt (${state.totalPages} pages)`);
    } catch (error) {
      console.error("Erreur de chargement PDF:", error);
      hideLoading();
      showToast("Erreur lors du chargement du document. Tentative de rechargement...", true);
    }
  }

  /**
   * Crée la structure DOM de chaque page
   */
  function setupPageContainers() {
    dom.pagesContainer.innerHTML = '';
    state.renderedPages.clear();

    for (let i = 1; i <= state.totalPages; i++) {
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'page-wrapper';
      pageWrapper.id = `page-wrapper-${i}`;
      pageWrapper.dataset.pageNum = i;
      
      // Placeholder pour dimensionnement
      pageWrapper.style.width = '700px';
      pageWrapper.style.height = '990px';

      const canvas = document.createElement('canvas');
      canvas.id = `canvas-page-${i}`;
      pageWrapper.appendChild(canvas);

      const textLayer = document.createElement('div');
      textLayer.className = 'textLayer';
      textLayer.id = `text-layer-${i}`;
      pageWrapper.appendChild(textLayer);

      dom.pagesContainer.appendChild(pageWrapper);
    }

    // Observer pour le lazy loading et le suivi de page active
    setupIntersectionObserver();
  }

  /**
   * IntersectionObserver pour rendre les pages visibles et détecter la page courante
   */
  let pageObserver = null;
  function setupIntersectionObserver() {
    if (pageObserver) pageObserver.disconnect();

    pageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const pageNum = parseInt(entry.target.dataset.pageNum, 10);
        if (entry.isIntersecting) {
          renderPage(pageNum);
          if (entry.intersectionRatio > 0.4) {
            updateCurrentPageIndicator(pageNum);
          }
        }
      });
    }, {
      root: dom.viewport,
      threshold: [0.05, 0.4, 0.8],
      rootMargin: '300px 0px 300px 0px'
    });

    const wrappers = dom.pagesContainer.querySelectorAll('.page-wrapper');
    wrappers.forEach(w => pageObserver.observe(w));
  }

  /**
   * Rendu haute fidélité d'une page individuelle (Canvas + TextLayer)
   */
  async function renderPage(pageNum) {
    if (!state.pdfDoc || state.renderedPages.has(pageNum)) return;

    // Si un rendu est en cours pour cette page, l'annuler d'abord
    if (state.pageRenderingQueue.has(pageNum)) {
      const task = state.pageRenderingQueue.get(pageNum);
      if (task && task.cancel) task.cancel();
      state.pageRenderingQueue.delete(pageNum);
    }

    try {
      const page = await state.pdfDoc.getPage(pageNum);
      const wrapper = document.getElementById(`page-wrapper-${pageNum}`);
      const canvas = document.getElementById(`canvas-page-${pageNum}`);
      const textLayer = document.getElementById(`text-layer-${pageNum}`);
      if (!wrapper || !canvas || !textLayer) return;

      const viewport = page.getViewport({ scale: state.zoomScale, rotation: state.rotation });
      const dpr = window.devicePixelRatio || 1;

      // Dimensions réelles du canvas (HiDPI)
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      wrapper.style.width = `${Math.floor(viewport.width)}px`;
      wrapper.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(dpr, dpr);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      state.pageRenderingQueue.set(pageNum, renderTask);

      await renderTask.promise;
      state.pageRenderingQueue.delete(pageNum);
      state.renderedPages.add(pageNum);

      // Rendre la couche de texte pour la sélection & la recherche
      textLayer.innerHTML = '';
      textLayer.style.width = `${Math.floor(viewport.width)}px`;
      textLayer.style.height = `${Math.floor(viewport.height)}px`;

      const textContent = await page.getTextContent();
      if (pdfjsLib.renderTextLayer) {
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayer,
          viewport: viewport,
          textDivs: []
        });
      }
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.warn(`Rendu annulé ou erreur page ${pageNum}:`, err);
      }
    }
  }

  /**
   * Applique le mode de zoom (fit-width, fit-page, auto, ou échelle fixe)
   */
  async function applyZoom() {
    if (!state.pdfDoc) return;

    try {
      const page = await state.pdfDoc.getPage(state.currentPage || 1);
      const unscaledViewport = page.getViewport({ scale: 1.0, rotation: state.rotation });
      const viewportWidth = dom.viewport.clientWidth - (window.innerWidth <= 640 ? 20 : 60);
      const viewportHeight = dom.viewport.clientHeight - 40;

      let targetScale = 1.0;

      if (state.zoomMode === 'fit-width') {
        targetScale = Math.min(2.5, Math.max(0.4, viewportWidth / unscaledViewport.width));
      } else if (state.zoomMode === 'fit-page') {
        const scaleW = viewportWidth / unscaledViewport.width;
        const scaleH = viewportHeight / unscaledViewport.height;
        targetScale = Math.min(scaleW, scaleH);
      } else if (state.zoomMode === 'auto') {
        targetScale = Math.min(1.3, Math.max(0.8, viewportWidth / unscaledViewport.width));
      } else {
        targetScale = state.zoomScale;
      }

      state.zoomScale = targetScale;

      // Réinitialiser les rendus pour rafraîchir à la nouvelle échelle
      state.renderedPages.clear();
      setupPageContainers();

      // Rendre immédiatement les pages autour de la courante
      renderPage(state.currentPage);
      if (state.currentPage > 1) renderPage(state.currentPage - 1);
      if (state.currentPage < state.totalPages) renderPage(state.currentPage + 1);

      // Mettre à jour l'affichage du zoom
      if (dom.selectZoom) {
        const percent = Math.round(state.zoomScale * 100);
        const matchingOpt = Array.from(dom.selectZoom.options).find(o => o.value === state.zoomMode || o.value === (state.zoomScale).toFixed(2));
        if (matchingOpt) {
          dom.selectZoom.value = matchingOpt.value;
        } else {
          dom.selectZoom.value = state.zoomMode;
        }
      }
    } catch (e) {
      console.warn("Erreur calcul zoom:", e);
    }
  }

  /**
   * Navigation vers une page précise
   */
  function scrollToPage(pageNum) {
    pageNum = Math.min(Math.max(1, pageNum), state.totalPages);
    state.currentPage = pageNum;
    updateCurrentPageIndicator(pageNum);

    if (state.layoutMode === 'single') {
      dom.pagesContainer.querySelectorAll('.page-wrapper').forEach(w => {
        w.classList.toggle('current-single', parseInt(w.dataset.pageNum, 10) === pageNum);
      });
      renderPage(pageNum);
      dom.viewport.scrollTop = 0;
    } else {
      const targetWrapper = document.getElementById(`page-wrapper-${pageNum}`);
      if (targetWrapper) {
        targetWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      renderPage(pageNum);
    }
  }

  /**
   * Met à jour les compteurs de page dans l'UI
   */
  function updateCurrentPageIndicator(pageNum) {
    state.currentPage = pageNum;
    if (dom.inputPage) dom.inputPage.value = pageNum;
    if (dom.btnPrev) dom.btnPrev.disabled = (pageNum <= 1);
    if (dom.btnNext) dom.btnNext.disabled = (pageNum >= state.totalPages);
    updateMobilePageNum();

    // Mettre à jour l'URL hash sans recharger
    history.replaceState(null, '', `#page=${pageNum}`);

    // Mettre en évidence la vignette correspondante
    highlightActiveThumbnail(pageNum);
  }

  function updateMobilePageNum() {
    if (dom.mobilePageNum) {
      dom.mobilePageNum.textContent = `${state.currentPage} / ${state.totalPages}`;
    }
  }

  /**
   * Génération des vignettes (Thumbnails)
   */
  async function generateThumbnails() {
    if (!dom.thumbnailsGrid || !state.pdfDoc) return;
    dom.thumbnailsGrid.innerHTML = '';

    for (let i = 1; i <= state.totalPages; i++) {
      const card = document.createElement('div');
      card.className = `thumb-card ${i === state.currentPage ? 'active' : ''}`;
      card.id = `thumb-card-${i}`;
      card.dataset.pageNum = i;

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'thumb-canvas-wrap';

      const canvas = document.createElement('canvas');
      canvas.id = `thumb-canvas-${i}`;
      canvasWrap.appendChild(canvas);

      const label = document.createElement('div');
      label.className = 'thumb-label';
      label.textContent = `Page ${i}`;

      card.appendChild(canvasWrap);
      card.appendChild(label);

      card.addEventListener('click', () => {
        scrollToPage(i);
        if (window.innerWidth <= 900) toggleSidebar(false);
      });

      dom.thumbnailsGrid.appendChild(card);
    }

    // Observer pour rendu différé des vignettes
    const thumbObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.dataset.pageNum, 10);
          renderThumbnail(pageNum);
          thumbObserver.unobserve(entry.target);
        }
      });
    }, { root: dom.paneThumbnails, rootMargin: '100px' });

    dom.thumbnailsGrid.querySelectorAll('.thumb-card').forEach(c => thumbObserver.observe(c));
  }

  async function renderThumbnail(pageNum) {
    try {
      const page = await state.pdfDoc.getPage(pageNum);
      const canvas = document.getElementById(`thumb-canvas-${pageNum}`);
      if (!canvas) return;

      const viewport = page.getViewport({ scale: 0.22 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d', { alpha: false });
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    } catch (e) {
      // Ignorer si annulé
    }
  }

  function highlightActiveThumbnail(pageNum) {
    if (!dom.thumbnailsGrid) return;
    dom.thumbnailsGrid.querySelectorAll('.thumb-card').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.pageNum, 10) === pageNum);
    });
    const activeThumb = document.getElementById(`thumb-card-${pageNum}`);
    if (activeThumb && dom.paneThumbnails.classList.contains('active')) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Extraction et affichage du Sommaire / Signets
   */
  async function loadDocumentOutline() {
    if (!dom.outlineTree || !state.pdfDoc) return;
    dom.outlineTree.innerHTML = '';

    try {
      const outline = await state.pdfDoc.getOutline();
      if (!outline || outline.length === 0) {
        // Créer un sommaire automatique intelligent basé sur les sections du dossier
        renderDefaultOutline();
        return;
      }

      const ul = document.createElement('ul');
      ul.className = 'outline-list';

      outline.forEach(item => {
        const li = document.createElement('li');
        li.className = 'outline-item';

        const a = document.createElement('a');
        a.className = 'outline-link';
        a.textContent = item.title;
        a.href = '#';
        a.addEventListener('click', async (e) => {
          e.preventDefault();
          if (typeof item.dest === 'string') {
            const dest = await state.pdfDoc.getDestination(item.dest);
            const pageIndex = await state.pdfDoc.getPageIndex(dest[0]);
            scrollToPage(pageIndex + 1);
          } else if (Array.isArray(item.dest)) {
            const pageIndex = await state.pdfDoc.getPageIndex(item.dest[0]);
            scrollToPage(pageIndex + 1);
          }
        });

        li.appendChild(a);
        ul.appendChild(li);
      });

      dom.outlineTree.appendChild(ul);
    } catch (e) {
      renderDefaultOutline();
    }
  }

  function renderDefaultOutline() {
    if (!dom.outlineTree) return;
    const isDecision = state.currentFile.includes('decision') || state.currentFile.includes('det');
    
    const items = isDecision ? [
      { title: "1. Introduction & Historique du dossier SEM-26-003", page: 1 },
      { title: "2. Examen de conformité (Art. 24.27(2) & 24.27(3))", page: 3 },
      { title: "3. Lois environnementales fédérales retenues (LCOM, RCOM, LEP, LP, LCPE)", page: 6 },
      { title: "4. Allégations : Espèces en péril & Milieux humides", page: 19 },
      { title: "5. Allégations : Rejets toxiques & Mortalité de poissons", page: 21 },
      { title: "6. DÉCISION FINALE DU SECRÉTARIAT (Sommation du Canada)", page: 26 },
      { title: "7. Signature officielle & transmission aux Parties", page: 28 }
    ] : [
      { title: "1. Identification de l'auteur & Allégations centrales", page: 1 },
      { title: "2. Contexte transfrontalier & Accord commercial ACEUM (Art. 24.4)", page: 2 },
      { title: "3. Allégation 1 : Loi sur les espèces en péril (LEP)", page: 4 },
      { title: "4. Allégation 2 : Règlement sur les oiseaux migrateurs (ROM)", page: 5 },
      { title: "5. Allégation 3 : Loi sur les pêches (Cadmium, rejets, ruisseau)", page: 6 },
      { title: "6. Données toxicologiques & Mortalité piscicole", page: 9 },
      { title: "7. Allégation 4 : Loi canadienne sur la protection de l'environnement (LCPE)", page: 10 },
      { title: "8. Préjudices subis & Équité intergénérationnelle", page: 11 },
      { title: "9. Communications préalables & Épuisement des recours", page: 11 },
      { title: "10. Synthèse des manquements & Mesures demandées", page: 14 },
      { title: "11. Attestation solennelle & Répertoire des 102 pages d'annexes", page: 15 }
    ];

    const ul = document.createElement('ul');
    ul.className = 'outline-list';

    items.forEach(it => {
      const li = document.createElement('li');
      li.className = 'outline-item';
      const a = document.createElement('a');
      a.className = 'outline-link';
      a.innerHTML = `<strong>${it.title}</strong> <span style="float:right; opacity:0.6;">p. ${it.page}</span>`;
      a.href = `#page=${it.page}`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToPage(it.page);
        if (window.innerWidth <= 900) toggleSidebar(false);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });

    dom.outlineTree.appendChild(ul);
  }

  /**
   * Métadonnées du document
   */
  async function loadDocumentMetadata() {
    if (!dom.docMetaTable || !state.pdfDoc) return;
    try {
      const metadata = await state.pdfDoc.getMetadata();
      const info = metadata.info || {};
      
      let html = `
        <tr><td class="label">Titre :</td><td class="value">${info.Title || document.title}</td></tr>
        <tr><td class="label">Dossier :</td><td class="value"><strong>SEM-26-003</strong> (CCE / ACEUM)</td></tr>
        <tr><td class="label">Pages :</td><td class="value">${state.totalPages}</td></tr>
        <tr><td class="label">Format :</td><td class="value">PDF Original Vectoriel (HiDPI)</td></tr>
        <tr><td class="label">Créateur :</td><td class="value">${info.Creator || 'Secrétariat CCE / William Guindon'}</td></tr>
        <tr><td class="label">Date :</td><td class="value">${info.CreationDate ? formatPDFDate(info.CreationDate) : '2026'}</td></tr>
        <tr><td class="label">Fichier source :</td><td class="value"><a href="${state.currentFile}" download style="color:var(--accent); font-weight:700;">Télécharger le binaire original ↗</a></td></tr>
      `;
      dom.docMetaTable.innerHTML = html;
    } catch (e) {
      console.warn("Erreur métadonnées:", e);
    }
  }

  function formatPDFDate(dStr) {
    if (!dStr) return '';
    const match = dStr.match(/D:(\d{4})(\d{2})(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return dStr;
  }

  /**
   * Recherche de texte dans l'intégralité du document
   */
  async function performSearch(query) {
    if (!query || query.trim() === '' || !state.pdfDoc) {
      dom.searchResultsList.innerHTML = '';
      dom.searchCountLabel.textContent = '0 résultat';
      state.searchResults = [];
      state.currentSearchIndex = -1;
      return;
    }

    query = query.trim();
    dom.searchCountLabel.textContent = 'Recherche en cours...';
    dom.searchResultsList.innerHTML = '';
    state.searchResults = [];
    state.currentSearchIndex = -1;

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let totalMatches = 0;

    for (let i = 1; i <= state.totalPages; i++) {
      const page = await state.pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(it => it.str).join(' ');

      let match;
      while ((match = regex.exec(pageText)) !== null) {
        totalMatches++;
        const startIndex = Math.max(0, match.index - 40);
        const endIndex = Math.min(pageText.length, match.index + query.length + 40);
        let snippet = pageText.substring(startIndex, endIndex);
        snippet = snippet.replace(regex, (m) => `<mark>${m}</mark>`);

        state.searchResults.push({
          page: i,
          index: totalMatches - 1,
          snippet: `...${snippet}...`
        });
      }
    }

    dom.searchCountLabel.textContent = `${totalMatches} résultat${totalMatches > 1 ? 's' : ''}`;

    if (totalMatches === 0) {
      dom.searchResultsList.innerHTML = `<p style="font-size:12px; color:var(--text-faint); padding:8px;">Aucune occurrence trouvée.</p>`;
      return;
    }

    state.searchResults.forEach((res, idx) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <div class="search-result-page">Page ${res.page}</div>
        <div class="search-result-snippet">${res.snippet}</div>
      `;
      item.addEventListener('click', () => {
        state.currentSearchIndex = idx;
        scrollToPage(res.page);
        if (window.innerWidth <= 900) toggleSidebar(false);
      });
      dom.searchResultsList.appendChild(item);
    });

    if (state.searchResults.length > 0) {
      state.currentSearchIndex = 0;
      scrollToPage(state.searchResults[0].page);
    }
  }

  function navigateSearch(direction) {
    if (state.searchResults.length === 0) return;
    state.currentSearchIndex += direction;
    if (state.currentSearchIndex < 0) state.currentSearchIndex = state.searchResults.length - 1;
    if (state.currentSearchIndex >= state.searchResults.length) state.currentSearchIndex = 0;

    const target = state.searchResults[state.currentSearchIndex];
    scrollToPage(target.page);
    showToast(`Résultat ${state.currentSearchIndex + 1} sur ${state.searchResults.length} (Page ${target.page})`);
  }

  /**
   * Gestion de la barre latérale
   */
  function toggleSidebar(forcedState) {
    state.sidebarOpen = (typeof forcedState === 'boolean') ? forcedState : !state.sidebarOpen;
    dom.sidebar.classList.toggle('collapsed', !state.sidebarOpen);
    dom.btnSidebarToggle.classList.toggle('active', state.sidebarOpen);
  }

  function switchSidebarTab(tabName) {
    const tabs = [
      { btn: dom.tabThumbnails, pane: dom.paneThumbnails, name: 'thumbnails' },
      { btn: dom.tabOutline, pane: dom.paneOutline, name: 'outline' },
      { btn: dom.tabSearch, pane: dom.paneSearch, name: 'search' },
      { btn: dom.tabInfo, pane: dom.paneInfo, name: 'info' }
    ];

    tabs.forEach(t => {
      const isActive = (t.name === tabName);
      t.btn.classList.toggle('active', isActive);
      t.pane.classList.toggle('active', isActive);
    });

    if (!state.sidebarOpen) {
      toggleSidebar(true);
    }

    if (tabName === 'search' && dom.inputSearch) {
      setTimeout(() => dom.inputSearch.focus(), 150);
    }
  }

  /**
   * Configuration de tous les écouteurs d'événements
   */
  function setupEventListeners() {
    // Changement de document
    if (dom.docSelect) {
      dom.docSelect.addEventListener('change', () => {
        const docKey = dom.docSelect.value;
        if (DOCS_CATALOG[docKey]) {
          const doc = DOCS_CATALOG[docKey];
          loadPDF(doc.file, 1);
          if (dom.badge) dom.badge.textContent = doc.badge;
        }
      });
    }

    // Toggle Sidebar
    if (dom.btnSidebarToggle) {
      dom.btnSidebarToggle.addEventListener('click', () => toggleSidebar());
    }

    // Onglets Sidebar
    if (dom.tabThumbnails) dom.tabThumbnails.addEventListener('click', () => switchSidebarTab('thumbnails'));
    if (dom.tabOutline) dom.tabOutline.addEventListener('click', () => switchSidebarTab('outline'));
    if (dom.tabSearch) dom.tabSearch.addEventListener('click', () => switchSidebarTab('search'));
    if (dom.tabInfo) dom.tabInfo.addEventListener('click', () => switchSidebarTab('info'));

    // Navigation de pages
    if (dom.btnPrev) dom.btnPrev.addEventListener('click', () => scrollToPage(state.currentPage - 1));
    if (dom.btnNext) dom.btnNext.addEventListener('click', () => scrollToPage(state.currentPage + 1));
    if (dom.mobileBtnPrev) dom.mobileBtnPrev.addEventListener('click', () => scrollToPage(state.currentPage - 1));
    if (dom.mobileBtnNext) dom.mobileBtnNext.addEventListener('click', () => scrollToPage(state.currentPage + 1));

    if (dom.inputPage) {
      dom.inputPage.addEventListener('change', () => {
        const p = parseInt(dom.inputPage.value, 10);
        if (!isNaN(p)) scrollToPage(p);
      });
      dom.inputPage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const p = parseInt(dom.inputPage.value, 10);
          if (!isNaN(p)) scrollToPage(p);
        }
      });
    }

    // Zoom
    if (dom.btnZoomIn) {
      dom.btnZoomIn.addEventListener('click', () => {
        state.zoomMode = 'custom';
        state.zoomScale = Math.min(3.0, state.zoomScale + 0.15);
        applyZoom();
        showToast(`Zoom : ${Math.round(state.zoomScale * 100)}%`);
      });
    }

    if (dom.btnZoomOut) {
      dom.btnZoomOut.addEventListener('click', () => {
        state.zoomMode = 'custom';
        state.zoomScale = Math.max(0.4, state.zoomScale - 0.15);
        applyZoom();
        showToast(`Zoom : ${Math.round(state.zoomScale * 100)}%`);
      });
    }

    if (dom.selectZoom) {
      dom.selectZoom.addEventListener('change', () => {
        const val = dom.selectZoom.value;
        if (val === 'fit-width' || val === 'fit-page' || val === 'auto') {
          state.zoomMode = val;
        } else {
          state.zoomMode = 'custom';
          state.zoomScale = parseFloat(val);
        }
        applyZoom();
      });
    }

    // Mode d'affichage (Continu / Page simple / Deux pages)
    if (dom.selectLayout) {
      dom.selectLayout.addEventListener('change', () => {
        state.layoutMode = dom.selectLayout.value;
        dom.pagesContainer.classList.toggle('layout-spread', state.layoutMode === 'spread');
        dom.pagesContainer.classList.toggle('layout-single', state.layoutMode === 'single');
        scrollToPage(state.currentPage);
      });
    }

    // Mode de lecture (Normal, Nuit, Sépia, Haut Contraste)
    if (dom.selectReadingMode) {
      dom.selectReadingMode.addEventListener('change', () => {
        setReadingMode(dom.selectReadingMode.value);
      });
    }

    // Rotation
    if (dom.btnRotate) {
      dom.btnRotate.addEventListener('click', () => {
        state.rotation = (state.rotation + 90) % 360;
        applyZoom();
        showToast(`Rotation : ${state.rotation}°`);
      });
    }

    // Plein écran
    if (dom.btnFullscreen) {
      dom.btnFullscreen.addEventListener('click', toggleFullscreen);
    }

    // Téléchargement du binaire original
    if (dom.btnDownload) {
      dom.btnDownload.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = state.currentFile;
        a.download = state.currentFile.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Téléchargement du PDF original démarré...");
      });
    }

    // Impression
    if (dom.btnPrint) {
      dom.btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    // Partage
    if (dom.btnShare) {
      dom.btnShare.addEventListener('click', () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}?file=${encodeURIComponent(state.currentFile)}#page=${state.currentPage}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            showToast("Lien direct vers cette page copié !");
          });
        } else {
          prompt("Copiez ce lien vers la page :", shareUrl);
        }
      });
    }

    // Commutateur de thème clair/sombre du site
    if (dom.btnThemeToggle) {
      dom.btnThemeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('wg_theme', nextTheme);

        if (nextTheme === 'dark' && state.readingMode === 'normal') {
          setReadingMode('dark');
        } else if (nextTheme === 'light' && state.readingMode === 'dark') {
          setReadingMode('normal');
        }
      });
    }

    // Recherche
    if (dom.inputSearch) {
      let debounceTimer = null;
      dom.inputSearch.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          performSearch(dom.inputSearch.value);
        }, 300);
      });
      dom.inputSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (e.shiftKey) navigateSearch(-1);
          else navigateSearch(1);
        }
      });
    }

    if (dom.btnSearchPrev) dom.btnSearchPrev.addEventListener('click', () => navigateSearch(-1));
    if (dom.btnSearchNext) dom.btnSearchNext.addEventListener('click', () => navigateSearch(1));

    // Modale Raccourcis
    if (dom.btnShortcuts && dom.shortcutsDialog) {
      dom.btnShortcuts.addEventListener('click', () => dom.shortcutsDialog.showModal());
    }

    // Zoom avec Ctrl+Molette / Cmd+Molette
    dom.viewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        state.zoomMode = 'custom';
        state.zoomScale = Math.min(3.0, Math.max(0.4, state.zoomScale + delta));
        applyZoom();
      }
    }, { passive: false });

    // Redimensionnement de fenêtre
    window.addEventListener('resize', debounce(() => {
      if (state.zoomMode === 'fit-width' || state.zoomMode === 'fit-page' || state.zoomMode === 'auto') {
        applyZoom();
      }
    }, 200));

    // Raccourcis Clavier KOReader & PDFSlick
    window.addEventListener('keydown', handleGlobalKeydown);
  }

  /**
   * Gestionnaire de raccourcis clavier
   */
  function handleGlobalKeydown(e) {
    // Si l'utilisateur tape dans un input, ignorer
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') document.activeElement.blur();
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'j':
      case 'arrowdown':
      case 'pagedown':
        e.preventDefault();
        scrollToPage(state.currentPage + 1);
        break;
      case 'k':
      case 'arrowup':
      case 'pageup':
        e.preventDefault();
        scrollToPage(state.currentPage - 1);
        break;
      case ' ':
        e.preventDefault();
        if (e.shiftKey) scrollToPage(state.currentPage - 1);
        else scrollToPage(state.currentPage + 1);
        break;
      case '+':
      case '=':
        e.preventDefault();
        state.zoomMode = 'custom';
        state.zoomScale = Math.min(3.0, state.zoomScale + 0.15);
        applyZoom();
        showToast(`Zoom : ${Math.round(state.zoomScale * 100)}%`);
        break;
      case '-':
        e.preventDefault();
        state.zoomMode = 'custom';
        state.zoomScale = Math.max(0.4, state.zoomScale - 0.15);
        applyZoom();
        showToast(`Zoom : ${Math.round(state.zoomScale * 100)}%`);
        break;
      case '0':
        e.preventDefault();
        state.zoomMode = 'fit-width';
        applyZoom();
        showToast("Zoom : Ajusté à la largeur");
        break;
      case '9':
        e.preventDefault();
        state.zoomMode = 'fit-page';
        applyZoom();
        showToast("Zoom : Page entière");
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 's':
        e.preventDefault();
        switchSidebarTab('search');
        break;
      case 't':
        e.preventDefault();
        toggleSidebar();
        break;
      case 'd':
        e.preventDefault();
        state.layoutMode = (state.layoutMode === 'spread') ? 'continuous' : 'spread';
        if (dom.selectLayout) dom.selectLayout.value = state.layoutMode;
        dom.pagesContainer.classList.toggle('layout-spread', state.layoutMode === 'spread');
        showToast(`Mode : ${state.layoutMode === 'spread' ? 'Double page' : 'Continu'}`);
        break;
      case 'm':
        e.preventDefault();
        cycleReadingMode();
        break;
      case 'r':
        e.preventDefault();
        state.rotation = (state.rotation + 90) % 360;
        applyZoom();
        showToast(`Rotation : ${state.rotation}°`);
        break;
      case 'escape':
        if (dom.shortcutsDialog && dom.shortcutsDialog.open) {
          dom.shortcutsDialog.close();
        } else if (state.sidebarOpen && window.innerWidth <= 900) {
          toggleSidebar(false);
        }
        break;
    }
  }

  function setReadingMode(mode) {
    state.readingMode = mode;
    dom.app.classList.remove('mode-dark', 'mode-sepia', 'mode-contrast');
    if (mode !== 'normal') {
      dom.app.classList.add(`mode-${mode}`);
    }
    if (dom.selectReadingMode) dom.selectReadingMode.value = mode;
    showToast(`Mode lecture : ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
  }

  function cycleReadingMode() {
    const modes = ['normal', 'dark', 'sepia', 'contrast'];
    const currentIdx = modes.indexOf(state.readingMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    setReadingMode(nextMode);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      if (dom.btnFullscreen) dom.btnFullscreen.classList.add('active');
      showToast("Plein écran activé (F pour quitter)");
    } else {
      document.exitFullscreen().catch(() => {});
      if (dom.btnFullscreen) dom.btnFullscreen.classList.remove('active');
    }
  }

  function showLoading(msg) {
    if (dom.loadingOverlay) dom.loadingOverlay.style.display = 'flex';
    if (dom.loadingText) dom.loadingText.textContent = msg || 'Chargement...';
  }

  function hideLoading() {
    if (dom.loadingOverlay) dom.loadingOverlay.style.display = 'none';
  }

  let toastTimer = null;
  function showToast(message, isError = false) {
    if (!dom.toast) return;
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.style.background = isError ? '#ef4444' : '#131715';
    dom.toast.classList.add('visible');
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('visible');
    }, 2800);
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Lancement automatique au chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
