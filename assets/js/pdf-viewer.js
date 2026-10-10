/**
 * assets/js/pdf-viewer.js — Moteur de lecture PDF Haute Performance (williamguindon.me)
 * Inspiré de KOReader, PDFSlick et react-pdf pour un rendu authentique et fluide.
 */

(function() {
  'use strict';

  // Configuration PDF.js locale
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdfjs/pdf.worker.min.js';

    // Exposition conforme de l'API pdfjsLib.TextLayer pour pdfjs-dist 3.11.174
    if (!pdfjsLib.TextLayer) {
      pdfjsLib.TextLayer = class TextLayer {
        constructor({ textContentSource, container, viewport, textDivs = [] }) {
          this.textContentSource = textContentSource;
          this.container = container;
          this.viewport = viewport;
          this.textDivs = textDivs;
          this._renderTask = null;
        }

        async render() {
          this.container.style.setProperty('--scale-factor', this.viewport.scale);
          if (typeof pdfjsLib.setLayerDimensions === 'function') {
            pdfjsLib.setLayerDimensions(this.container, this.viewport);
          } else {
            this.container.style.width = `${Math.floor(this.viewport.width)}px`;
            this.container.style.height = `${Math.floor(this.viewport.height)}px`;
          }

          this._renderTask = pdfjsLib.renderTextLayer({
            textContentSource: this.textContentSource,
            container: this.container,
            viewport: this.viewport,
            textDivs: this.textDivs
          });

          if (this._renderTask && this._renderTask.promise) {
            await this._renderTask.promise;
          }

          // Ajout de la balise .endOfContent pour la sélection multi-lignes fluide (spécification pdf.js)
          if (!this.container.querySelector('.endOfContent')) {
            const endDiv = document.createElement('div');
            endDiv.className = 'endOfContent';
            this.container.appendChild(endDiv);
          }
        }

        cancel() {
          if (this._renderTask && typeof this._renderTask.cancel === 'function') {
            this._renderTask.cancel();
          }
        }
      };
    }
  }

  // Catalogue des documents officiels avec empreinte SHA-256 et métadonnées juridiques
  const DOCS_CATALOG = {
    'decision-17-aout-2026': {
      title: "Détermination positive du Secrétariat CCE (17 août 2026)",
      file: "assets/docs/26-2-det2_fr.pdf",
      badge: "SEM-26-003 · CCE / ACEUM",
      date: "17 août 2026",
      pages: 28,
      type: "Décision officielle (Art. 24.27(2) et (3))",
      sha256: "33dc8c088e6b9d24b8c8f2ca45b279a7ac4dd2ab15e83c19b3af76e93715e59c",
      ipfsCid: "QmQkos64r4ddnqvNJTA1PJVhVsdyFXNvSqbDdhUkNk8Vvf",
      ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmQkos64r4ddnqvNJTA1PJVhVsdyFXNvSqbDdhUkNk8Vvf",
      author: "Secrétariat de la CCE",
      citation: "Secrétariat de la CCE. (2026). Détermination en vertu des paragraphes 24.27(2) et (3) de l'ACEUM concernant la communication SEM-26-003 (Enfouissement de matières dangereuses à Blainville). Commission de coopération environnementale.",
      license: "Document public officiel CCE (Art. 24.27 de l'ACEUM)",
      isOriginalWork: false,
      isCCE: true
    },
    'soumission-16-juillet-2026': {
      title: "Communication révisée SEM-26-003 (16 juillet 2026)",
      file: "assets/docs/26-3-rsub_fr_redacted.pdf",
      badge: "SEM-26-003 · Soumission Citoyenne",
      date: "16 juillet 2026",
      pages: 15,
      type: "Communication formelle (15 pages)",
      sha256: "d8aade13059b957f7bc6dde13a73b4e996871d95907af1ee42b4f7137b773710",
      ipfsCid: "QmbB7oBxudna3cYDGr5XK2iUhDf3qcvzNHCwEqVAQ8zfaV",
      ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmbB7oBxudna3cYDGr5XK2iUhDf3qcvzNHCwEqVAQ8zfaV",
      author: "William Guindon",
      citation: "Guindon, W. (2026). Soumission révisée SEM-26-003 : Protection de la Grande Tourbière de Blainville et conformité environnementale ACEUM (Art. 24.27). Commission de coopération environnementale.",
      license: "Creative Commons CC BY-NC-ND 4.0 International",
      isOriginalWork: true,
      isCCE: false
    },
    'decision-3-juin-2026': {
      title: "Décision préliminaire du Secrétariat CCE (3 juin 2026)",
      file: "assets/docs/26-3-det_fr.pdf",
      badge: "SEM-26-003 · CCE / ACEUM",
      date: "3 juin 2026",
      pages: 17,
      type: "Décision d'examen initial",
      sha256: "8f8998becc91e8398852a048a5472d498dd888e79874265fe86aa387422aad5b",
      ipfsCid: "QmTKmiUFHimaFx2n2KGqSY6L7ccknSazes6Zb2YkgK8Kug",
      ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmTKmiUFHimaFx2n2KGqSY6L7ccknSazes6Zb2YkgK8Kug",
      author: "Secrétariat de la CCE",
      citation: "Secrétariat de la CCE. (2026). Détermination préliminaire SEM-26-003 en vertu de l'article 24.27(1). Commission de coopération environnementale.",
      license: "Document public officiel CCE (Art. 24.27 de l'ACEUM)",
      isOriginalWork: false,
      isCCE: true
    },
    'onu-mai-2026': {
      title: "Déposition formelle à l'ONU (Mai 2026)",
      file: "assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf",
      badge: "ONU · Droits Humains",
      date: "Mai 2026",
      pages: 14,
      type: "Mémoire au Rapporteur spécial",
      sha256: "db8818c7668e85efa4e977f5a7a3478f811933fbc20562b22c92fdc193b9767f",
      ipfsCid: "QmQ8dva4AQ98StCWdVZFK7jNGWGbX91PgmPbNyuFTyh3Dx",
      ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmQ8dva4AQ98StCWdVZFK7jNGWGbX91PgmPbNyuFTyh3Dx",
      author: "William Guindon",
      citation: "Guindon, W. (2026). Formal Deposition and Urgent Appeal: Human Rights Violations and Denial of Justice – The Stablex Case and Bill 93 in Quebec. Mandate of the UN Special Rapporteur on Toxics and Human Rights.",
      license: "Creative Commons CC BY-NC-ND 4.0 International",
      isOriginalWork: true,
      isCCE: false
    }
  };

  const ALLOWED_LOCAL_DOCS = new Set(Object.values(DOCS_CATALOG).map(d => d.file));

  /**
   * Échappement sécurisé des caractères HTML
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Validation et sanitisation stricte des chemins et URLs de documents
   */
  function getSafeDocUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return DOCS_CATALOG['decision-17-aout-2026'].file;
    }
    const clean = rawUrl.trim();
    for (const doc of Object.values(DOCS_CATALOG)) {
      if (clean === doc.file || clean.endsWith(doc.file)) {
        return doc.file;
      }
    }
    if (/^assets\/docs\/[a-zA-Z0-9_\-\.]+\.pdf$/.test(clean)) {
      return clean;
    }
    if (clean.startsWith('blob:')) {
      return clean;
    }
    // Mappage instantané des pièces phares hébergées localement sur williamguindon.me
    if (clean.includes('26-3-rsub_fr_redacted')) {
      return 'assets/docs/26-3-rsub_fr_redacted.pdf';
    }
    if (clean.includes('26-3-det_fr') || clean.includes('26-3-det2_fr')) {
      return 'assets/docs/26-3-det_fr.pdf';
    }
    if (clean.includes('26-2-det2_fr') || clean.includes('62-DET2_fr')) {
      return 'assets/docs/26-2-det2_fr.pdf';
    }
    if (clean.includes('formal-deposition')) {
      return 'assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf';
    }
    // Validation sécurisée des URLs distantes d'archive probatoire avec support natif CORS
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const parsed = new URL(clean);
        if (parsed.protocol === 'https:' && (parsed.hostname === 'archive.org' || parsed.hostname.endsWith('.archive.org'))) {
          if (parsed.pathname.toLowerCase().endsWith('.pdf') || parsed.pathname.includes('.pdf')) {
            let pathname = parsed.pathname;
            if (pathname.startsWith('/download/')) {
              pathname = '/cors/' + pathname.substring(10);
            }
            return `https://archive.org${pathname}${parsed.search}`;
          }
        }
      }
    } catch (e) {
      // Ignorer URL invalide
    }
    return DOCS_CATALOG['decision-17-aout-2026'].file;
  }

  let cachedDynamicSha256 = null;

  async function computeCurrentDocSha256() {
    if (cachedDynamicSha256) return cachedDynamicSha256;
    try {
      if (state.pdfDoc && typeof state.pdfDoc.getData === 'function') {
        const rawBytes = await state.pdfDoc.getData();
        const hashBuf = await crypto.subtle.digest('SHA-256', rawBytes);
        const hashHex = Array.from(new Uint8Array(hashBuf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        cachedDynamicSha256 = hashHex;
        return hashHex;
      }
    } catch (e) {
      console.warn("Calcul SHA-256 dynamique non disponible:", e);
    }
    return null;
  }

  /**
   * Résout les métadonnées juridiques et documentaires réelles d'un fichier.
   * RÈGLE JURIDIQUE ABSOLUE : Seules les soumissions rédigées par William Guindon
   * (ex. SEM-26-003, déposition ONU) sont sous sa licence CC BY-NC-ND 4.0.
   * Toutes les autres pièces de l'archive (rapports BAPE, mémoires tiers, articles
   * de presse, décisions de la CCE, lois) sont des pièces documentaires versées
   * au dossier public d'intérêt général (fair dealing / art. 29 LDA).
   */
  function resolveDocInfo(fileUrl, pdfInfo = {}) {
    const rawUrl = fileUrl || state.currentFile || '';
    const cleanUrl = rawUrl.trim();
    
    // 1. Recherche dans le catalogue prédéfini
    const currentDocKey = Object.keys(DOCS_CATALOG).find(k => {
      const catFile = DOCS_CATALOG[k].file;
      return cleanUrl === catFile || cleanUrl.endsWith(catFile);
    });
    
    if (currentDocKey && DOCS_CATALOG[currentDocKey]) {
      const doc = DOCS_CATALOG[currentDocKey];
      return {
        key: currentDocKey,
        title: doc.title,
        file: doc.file,
        date: doc.date,
        pages: state.totalPages || doc.pages,
        type: doc.type,
        sha256: doc.sha256,
        citation: doc.citation,
        author: doc.author,
        license: doc.license,
        isOriginalWork: !!doc.isOriginalWork,
        isCCE: !!doc.isCCE
      };
    }

    // 2. Document hors catalogue (pièces d'archive, études, mémoires tiers, etc.)
    const decodedUrl = decodeURIComponent(cleanUrl);
    const fileName = decodedUrl.split('/').pop().replace(/\?.*$/, '') || 'document.pdf';
    const baseName = fileName.replace(/\.pdf$/i, '');

    const isOriginalWork = false;
    let isCCE = false;
    let author = "Auteur tiers (Dossier public SEM-26-003)";
    let docType = "Pièce documentaire probatoire";
    let license = "Archive publique · Droits réservés aux auteurs d'origine (art. 29 LDA / Fair Dealing)";
    let year = "2026";
    let cleanTitle = baseName;

    // Détection d'année dans le nom de fichier
    const yearMatch = fileName.match(/(?:19|20)\d{2}/);
    if (yearMatch) {
      year = yearMatch[0];
    }

    // Identification de la source / organisme selon le nom de fichier
    if (/26-[23]-|det2|det_|cec\.org/i.test(fileName)) {
      isCCE = true;
      author = "Secrétariat de la CCE";
      docType = "Décision / Document officiel public CCE";
      license = "Document officiel du registre public CCE (Art. 24.27 de l'ACEUM)";
      cleanTitle = `Décision officielle CCE — ${baseName}`;
    } else if (/LeDevoir|Le_Devoir/i.test(fileName)) {
      author = "Le Devoir";
      docType = "Article de presse / Enquête d'intérêt public";
      license = "Droits réservés au journal Le Devoir · Utilisation équitable (art. 29 LDA)";
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    } else if (/LaPresse|La_Presse/i.test(fileName)) {
      author = "La Presse";
      docType = "Article de presse / Enquête d'intérêt public";
      license = "Droits réservés à La Presse · Utilisation équitable (art. 29 LDA)";
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    } else if (/Radio[-_]Canada|RC/i.test(fileName)) {
      author = "Radio-Canada";
      docType = "Reportage journalistique d'intérêt public";
      license = "Droits réservés à Radio-Canada · Utilisation équitable (art. 29 LDA)";
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    } else if (/TVA/i.test(fileName)) {
      author = "TVA Nouvelles";
      docType = "Reportage journalistique d'information";
      license = "Droits réservés à TVA Nouvelles · Utilisation équitable (art. 29 LDA)";
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    } else if (/JDM|Journal_de_Montreal/i.test(fileName)) {
      author = "Le Journal de Montréal";
      docType = "Article de presse";
      license = "Droits réservés au Journal de Montréal · Utilisation équitable (art. 29 LDA)";
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    } else if (/BAPE|rapport371|371/i.test(fileName)) {
      author = "Bureau d'audiences publiques sur l'environnement (BAPE)";
      docType = "Rapport d'enquête et d'audience publique n° 371";
      license = "Document public officiel (Gouvernement du Québec)";
      cleanTitle = "Rapport 371 du BAPE — Lieux d'élimination de résidus industriels stabilisés";
    } else if (/BIFFE|Memoire/i.test(fileName)) {
      author = "Coalition citoyenne & experts du milieu (BIFFE)";
      docType = "Mémoire citoyen d'audit et d'analyse technique";
      license = "Mémoire public déposé à l'Assemblée nationale · Utilisation équitable (art. 29 LDA)";
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    } else if (/EauSecours|Eau_Secours/i.test(fileName)) {
      author = "Eau Secours";
      docType = "Plainte environnementale d'intérêt public";
      license = "Document d'alerte citoyenne · Utilisation équitable (art. 29 LDA)";
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    } else if (/UQAM|COBAMIL/i.test(fileName)) {
      author = "UQAM / COBAMIL";
      docType = "Étude scientifique hydrogéologique";
      license = "Rapport de recherche universitaire · Utilisation équitable (art. 29 LDA)";
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    } else if (/Sentinel|NDVI/i.test(fileName)) {
      author = "Programme Copernicus (ESA / Union Européenne)";
      docType = "Données d'observation satellite ouvertes (Sentinel-2)";
      license = "Données ouvertes Copernicus (Open Access)";
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    } else if (pdfInfo && pdfInfo.Title && pdfInfo.Title.length > 3) {
      cleanTitle = pdfInfo.Title;
      if (pdfInfo.Author && !/William Guindon/i.test(pdfInfo.Author)) {
        author = pdfInfo.Author;
      }
    } else {
      cleanTitle = baseName.replace(/_/g, ' ').replace(/BIFFE AUDIT/gi, '').trim();
    }

    let citation = '';
    if (isCCE) {
      citation = `Secrétariat de la CCE. (${year}). ${cleanTitle}. Procédure citoyenne SEM-26-003. Commission de coopération environnementale (CCE / ACEUM).`;
    } else {
      citation = `${author} (${year}). ${cleanTitle}. Pièce versée au dossier public SEM-26-003 (Enfouissement de matières dangereuses à Blainville). Archive publique consultable sur williamguindon.me.`;
    }

    return {
      key: null,
      title: cleanTitle || fileName,
      file: cleanUrl,
      date: year,
      pages: state.totalPages || 1,
      type: docType,
      sha256: null,
      citation: citation,
      author: author,
      license: license,
      isOriginalWork: isOriginalWork,
      isCCE: isCCE
    };
  }

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
    textLayerRenderingQueue: new Map(), // pageNum -> textLayerInstance
    renderedPages: new Set(),
    pageHeights: [],
    pageWidths: [],
    searchResults: [],
    currentSearchIndex: -1,
    isSearching: false,
    sidebarOpen: false,
    translationMode: false,
    translatedPagesCache: new Map() // pageNum -> html string
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
    btnTranslateDoc: document.getElementById('btn-translate-doc'),
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
    tabTranslation: document.getElementById('tab-translation'),
    tabSearch: document.getElementById('tab-search'),
    tabExplorer: document.getElementById('tab-explorer'),
    tabAi: document.getElementById('tab-ai'),
    tabInfo: document.getElementById('tab-info'),
    paneThumbnails: document.getElementById('pane-thumbnails'),
    paneOutline: document.getElementById('pane-outline'),
    paneTranslation: document.getElementById('pane-translation'),
    paneSearch: document.getElementById('pane-search'),
    paneExplorer: document.getElementById('pane-explorer'),
    paneAi: document.getElementById('pane-ai'),
    paneInfo: document.getElementById('pane-info'),
    btnToggleDocTranslation: document.getElementById('btn-toggle-doc-translation'),
    btnToggleDocTranslationText: document.getElementById('btn-toggle-doc-translation-text'),
    btnTranslateCurrentPage: document.getElementById('btn-translate-current-page'),
    btnOpenGoogleDocsMode: document.getElementById('btn-open-google-docs-mode'),
    btnCopyTranslation: document.getElementById('btn-copy-translation'),
    selectTranslateLang: document.getElementById('select-translate-lang'),
    translationStatus: document.getElementById('translation-status'),
    translationOutput: document.getElementById('translation-output'),
    translationPageBadge: document.getElementById('translation-page-badge'),
    inputExplorerSearch: document.getElementById('viewer-explorer-search'),
    explorerTree: document.getElementById('viewer-explorer-tree'),
    thumbnailsGrid: document.getElementById('thumbnails-grid'),
    outlineTree: document.getElementById('outline-tree'),
    inputSearch: document.getElementById('input-search'),
    btnSearchPrev: document.getElementById('btn-search-prev'),
    btnSearchNext: document.getElementById('btn-search-next'),
    searchCountLabel: document.getElementById('search-count-label'),
    searchResultsList: document.getElementById('search-results-list'),
    // Mobile & Responsive controls
    sidebarBackdrop: document.getElementById('viewer-sidebar-backdrop'),
    btnSidebarClose: document.getElementById('btn-sidebar-close'),
    mobilePageNum: document.getElementById('mobile-page-num'),
    mobileBtnSidebar: document.getElementById('mobile-btn-sidebar'),
    mobileBtnPrev: document.getElementById('mobile-btn-prev'),
    mobileBtnNext: document.getElementById('mobile-btn-next'),
    mobileBtnSearch: document.getElementById('mobile-btn-search'),
    mobileBtnMode: document.getElementById('mobile-btn-mode'),
    mobileBtnFit: document.getElementById('mobile-btn-fit'),
    shortcutsDialog: document.getElementById('shortcuts-dialog'),
    // Modale de Notice documentaire & Téléchargement
    licenseDialog: document.getElementById('license-download-dialog'),
    btnLicenseDialogClose: document.getElementById('btn-license-dialog-close'),
    licenseBadgePill: document.getElementById('license-badge-pill'),
    licenseDialogHeading: document.getElementById('license-dialog-heading'),
    licenseDocTitle: document.getElementById('license-doc-title'),
    licenseDocMeta: document.getElementById('license-doc-meta'),
    licenseTermsCard: document.getElementById('license-terms-card'),
    licenseTermsHeader: document.getElementById('license-terms-header'),
    licenseTermsTitle: document.getElementById('license-terms-title'),
    licenseTermsText: document.getElementById('license-terms-text'),
    licenseAiClause: document.getElementById('license-ai-clause'),
    licenseDocHash: document.getElementById('license-doc-hash'),
    licenseCitationText: document.getElementById('license-citation-text'),
    licenseCitationLabel: document.getElementById('license-citation-label'),
    licenseCheckbox: document.getElementById('license-checkbox'),
    licenseCheckboxLabel: document.getElementById('license-checkbox-label'),
    licenseCheckboxText: document.getElementById('license-checkbox-text'),
    btnConfirmDownload: document.getElementById('btn-confirm-download'),
    btnCopyShareLink: document.getElementById('btn-copy-share-link'),
    btnCopyHash: document.getElementById('btn-copy-hash'),
    btnCopyCitation: document.getElementById('btn-copy-citation'),
    btnCite: document.getElementById('btn-cite'),
    btnExportBibtex: document.getElementById('btn-export-bibtex'),
    btnExportRis: document.getElementById('btn-export-ris')
  };

  function broadcastThemeChange(themeName) {
    try {
      localStorage.setItem('wg_theme', themeName);
      localStorage.setItem('william-guindon-theme', themeName);
      sessionStorage.setItem('william-guindon-theme', themeName);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'wg_theme_change', theme: themeName }, '*');
      }
    } catch (_) {}
  }

  /**
   * Initialisation générale
   */
  async function init() {
    // 1. Initialiser le thème (sync avec site et paramètre d'URL)
    const urlParamsObj = new URLSearchParams(window.location.search);
    const themeFromUrl = urlParamsObj.get('theme');
    const savedTheme = themeFromUrl || localStorage.getItem('wg_theme') || localStorage.getItem('william-guindon-theme') || sessionStorage.getItem('william-guindon-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      state.readingMode = 'dark';
      dom.app.classList.add('mode-dark');
      if (dom.selectReadingMode) dom.selectReadingMode.value = 'dark';
    } else {
      state.readingMode = 'normal';
      dom.app.classList.remove('mode-dark', 'mode-sepia', 'mode-contrast');
      if (dom.selectReadingMode) dom.selectReadingMode.value = 'normal';
    }

    // Écouteur de synchronisation de thème depuis la page parente
    window.addEventListener('message', (e) => {
      if (e.data && (e.data.type === 'wg_theme_change' || e.data.type === 'theme_change')) {
        const nextTheme = e.data.theme;
        document.documentElement.setAttribute('data-theme', nextTheme);
        if (nextTheme === 'dark') {
          if (state.readingMode === 'normal') {
            state.readingMode = 'dark';
            dom.app.classList.remove('mode-sepia', 'mode-contrast');
            dom.app.classList.add('mode-dark');
            if (dom.selectReadingMode) dom.selectReadingMode.value = 'dark';
          }
        } else if (nextTheme === 'light') {
          if (state.readingMode === 'dark') {
            state.readingMode = 'normal';
            dom.app.classList.remove('mode-dark', 'mode-sepia', 'mode-contrast');
            if (dom.selectReadingMode) dom.selectReadingMode.value = 'normal';
          }
        }
      } else if (e.data && (e.data.type === 'wg_toggle_translation' || e.data.type === 'toggle_translation')) {
        toggleTranslationMode(e.data.force);
      }
    });

    // Détection mode intégré (iFrame) pour adapter l'interface
    if (window.self !== window.top) {
      document.body.classList.add('is-embedded');
      state.sidebarOpen = false;
      if (dom.sidebar) dom.sidebar.classList.add('collapsed');
      if (dom.btnSidebarToggle) dom.btnSidebarToggle.classList.remove('active');
    }

    // 2. Extraire et assainir les paramètres de l'URL (query string et hash)
    const urlParams = new URLSearchParams(window.location.search);
    const hashStr = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    const hashParams = new URLSearchParams(hashStr);

    let rawFile = urlParams.get('file') || urlParams.get('doc') || hashParams.get('file') || hashParams.get('doc') || '';
    let targetPage = parseInt(urlParams.get('page') || hashParams.get('page') || (window.location.hash.match(/#page=(\d+)/)?.[1]), 10) || 1;
    let targetDocKey = urlParams.get('id') || hashParams.get('id');

    // Résolution sécurisée du document
    if (!rawFile && targetDocKey && DOCS_CATALOG[targetDocKey]) {
      rawFile = DOCS_CATALOG[targetDocKey].file;
    }

    const targetFile = getSafeDocUrl(rawFile);

    // Associer le sélecteur
    syncDocSelectWithFile(targetFile);

    // Initialiser les événements UI
    setupEventListeners();

    // Charger le document PDF
    await loadPDF(targetFile, targetPage);

    const initialTab = urlParams.get('tab') || hashParams.get('tab');
    if (initialTab === 'translation') {
      toggleTranslationMode(true);
      switchSidebarTab('translation');
    } else if (initialTab && ['thumbnails', 'outline', 'search', 'explorer', 'info'].includes(initialTab)) {
      switchSidebarTab(initialTab);
    }
  }

  /**
   * Synchronise le menu déroulant avec le fichier chargé
   */
  function syncDocSelectWithFile(filePath) {
    if (!dom.docSelect) return;
    const safePath = getSafeDocUrl(filePath);
    for (const [key, doc] of Object.entries(DOCS_CATALOG)) {
      if (safePath === doc.file || safePath.includes(key)) {
        dom.docSelect.value = key;
        if (dom.badge) dom.badge.textContent = doc.badge;
        document.title = `${doc.title} — Lecteur Officiel · William Guindon`;
        return;
      }
    }
    // Document externe ou archive probatoire
    if (dom.badge) dom.badge.textContent = "Archive Probatoire";
    const filename = decodeURIComponent(safePath.split('/').pop() || 'Document PDF');
    document.title = `${filename} — Lecteur Officiel · William Guindon`;

    let customOpt = dom.docSelect.querySelector('option[data-custom="true"]');
    if (!customOpt) {
      customOpt = document.createElement('option');
      customOpt.setAttribute('data-custom', 'true');
      dom.docSelect.prepend(customOpt);
    }
    customOpt.value = safePath;
    customOpt.textContent = filename;
    dom.docSelect.value = safePath;
  }

  /**
   * Charge un fichier PDF via PDF.js
   */
  async function loadPDF(url, startPage = 1) {
    showLoading("Chargement du document haute fidélité...");
    cachedDynamicSha256 = null;
    const safeUrl = getSafeDocUrl(url);
    state.currentFile = safeUrl;

    try {
      // Annuler les tâches précédentes
      for (const [pageNum, task] of state.pageRenderingQueue.entries()) {
        if (task && task.cancel) task.cancel();
      }
      state.pageRenderingQueue.clear();
      for (const [pageNum, textTask] of state.textLayerRenderingQueue.entries()) {
        if (textTask && typeof textTask.cancel === 'function') textTask.cancel();
      }
      state.textLayerRenderingQueue.clear();
      state.renderedPages.clear();

      // Charger le document
      let isRemoteArchive = false;
      try {
        const parsed = new URL(safeUrl, window.location.href);
        isRemoteArchive = parsed.hostname === 'archive.org' || parsed.hostname.endsWith('.archive.org');
      } catch (_) {
        isRemoteArchive = false;
      }
      const docOptions = {
        url: safeUrl,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
        enableXfa: true,
        // CVE-2024-4367 (exécution de JS arbitraire à l'ouverture d'un PDF piégé) : neutralisée en conservant isEvalSupported à false. Ne jamais repasser à true.
        isEvalSupported: false
      };
      if (isRemoteArchive) {
        docOptions.disableRange = true;
        docOptions.disableStream = true;
      }
      const loadingTask = pdfjsLib.getDocument(docOptions);

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
      if (dom.pagesContainer) {
        const fileName = (safeUrl.split('/').pop() || 'document.pdf').split('?')[0];
        dom.pagesContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 420px; padding: 40px 20px; text-align: center; color: var(--text, #111); width: 100%;">
            <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(220, 38, 38, 0.1); color: #dc2626; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 700; color: #064e3b;">Document temporairement indisponible en prévisualisation</h3>
            <p style="margin: 0 0 18px 0; max-width: 480px; font-size: 0.92rem; color: var(--text-muted, #52796f); line-height: 1.5;">
              Le serveur distant d'archivage (Internet Archive) est actuellement instable ou en maintenance. Vous pouvez télécharger le fichier original ou retenter le chargement.
            </p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
              <a href="${safeUrl}" download="${fileName}" class="btn" style="display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; background: #064e3b; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 0.88rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Télécharger le PDF original (${fileName})</span>
              </a>
              <button type="button" onclick="window.location.reload()" class="btn" style="display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; background: var(--surface, #f4f4f4); border: 1px solid var(--border, #cbd7cf); color: var(--text, #111); cursor: pointer; font-weight: 600; font-size: 0.88rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                <span>Réessayer</span>
              </button>
            </div>
          </div>
        `;
      }
      showToast("Serveur distant inaccessible — options de téléchargement direct disponibles", true);
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

      const translationLayer = document.createElement('div');
      translationLayer.className = 'translation-layer';
      translationLayer.id = `translation-layer-${i}`;
      translationLayer.style.display = 'none';
      pageWrapper.appendChild(translationLayer);

      const restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.className = 'btn-restore-translation-badge';
      restoreBtn.id = `btn-restore-trans-${i}`;
      restoreBtn.style.display = 'none';
      restoreBtn.title = 'Afficher la traduction de cette page';
      restoreBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        <span>Traduction (EN)</span>
      `;
      restoreBtn.addEventListener('click', () => {
        translationLayer.style.display = 'block';
        canvas.style.display = 'none';
        if (textLayer) textLayer.style.display = 'none';
        restoreBtn.style.display = 'none';
      });
      pageWrapper.appendChild(restoreBtn);

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
    if (state.textLayerRenderingQueue.has(pageNum)) {
      const textTask = state.textLayerRenderingQueue.get(pageNum);
      if (textTask && typeof textTask.cancel === 'function') textTask.cancel();
      state.textLayerRenderingQueue.delete(pageNum);
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

      // Fond blanc papier garanti pour éviter tout compositeur sombre par défaut
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      state.pageRenderingQueue.set(pageNum, renderTask);

      await renderTask.promise;
      state.pageRenderingQueue.delete(pageNum);
      state.renderedPages.add(pageNum);

      // Rendre la couche de texte pour la sélection & la recherche avec l'API TextLayer synchronisée
      textLayer.innerHTML = '';
      textLayer.style.setProperty('--scale-factor', viewport.scale);
      if (typeof pdfjsLib.setLayerDimensions === 'function') {
        pdfjsLib.setLayerDimensions(textLayer, viewport);
      } else {
        textLayer.style.width = `${Math.floor(viewport.width)}px`;
        textLayer.style.height = `${Math.floor(viewport.height)}px`;
      }

      const textContent = await page.getTextContent();
      const textLayerInstance = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport: viewport
      });
      state.textLayerRenderingQueue.set(pageNum, textLayerInstance);

      await textLayerInstance.render();
      state.textLayerRenderingQueue.delete(pageNum);

      if (state.translationMode) {
        applyTranslationToPage(pageNum);
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

      // Annuler les rendus en cours
      state.pageRenderingQueue.forEach(task => {
        if (task && task.cancel) task.cancel();
      });
      state.pageRenderingQueue.clear();
      state.textLayerRenderingQueue.forEach(task => {
        if (task && typeof task.cancel === 'function') task.cancel();
      });
      state.textLayerRenderingQueue.clear();
      state.renderedPages.clear();

      // Mettre à jour les dimensions de tous les wrappers existants
      const scaledW = Math.floor(unscaledViewport.width * targetScale);
      const scaledH = Math.floor(unscaledViewport.height * targetScale);
      
      const wrappers = dom.pagesContainer.querySelectorAll('.page-wrapper');
      if (wrappers.length === state.totalPages) {
        wrappers.forEach(w => {
          w.style.width = `${scaledW}px`;
          w.style.height = `${scaledH}px`;
        });
      } else {
        setupPageContainers();
      }

      // Rendre immédiatement les pages autour de la courante
      renderPage(state.currentPage);
      if (state.currentPage > 1) renderPage(state.currentPage - 1);
      if (state.currentPage < state.totalPages) renderPage(state.currentPage + 1);

      // Mettre à jour l'affichage du zoom
      if (dom.selectZoom) {
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

    // Mettre à jour le libellé IA
    if (dom.viewerAiCurrentPageLabel) {
      dom.viewerAiCurrentPageLabel.textContent = `Page ${pageNum}`;
    }

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
      const doc = resolveDocInfo(state.currentFile, info);
      const sha = doc.sha256 || cachedDynamicSha256 || '';
      
      let licenseBadge = '';
      if (doc.isOriginalWork) {
        licenseBadge = `<span style="background:rgba(34,197,94,0.15); color:var(--accent); font-weight:700; padding:2px 6px; border-radius:4px; font-size:11px;">CC BY-NC-ND 4.0 (Auteur: William Guindon)</span>`;
      } else if (doc.isCCE) {
        licenseBadge = `<span style="background:rgba(14,165,233,0.15); color:#0284c7; font-weight:700; padding:2px 6px; border-radius:4px; font-size:11px;">Document public officiel CCE (Art. 24.27)</span>`;
      } else {
        licenseBadge = `<span style="background:rgba(100,116,139,0.15); color:var(--text); font-weight:600; padding:2px 6px; border-radius:4px; font-size:11px;">Pièce versée au dossier public (art. 29 LDA)</span>`;
      }

      let html = `
        <tr><td class="label">Titre :</td><td class="value">${escapeHTML(doc.title || info.Title || document.title)}</td></tr>
        <tr><td class="label">Dossier :</td><td class="value"><strong>SEM-26-003</strong> (CCE / ACEUM)</td></tr>
        <tr><td class="label">Pages :</td><td class="value">${state.totalPages}</td></tr>
        <tr><td class="label">Format :</td><td class="value">PDF Original Vectoriel (HiDPI)</td></tr>
        <tr><td class="label">Créateur / Auteur :</td><td class="value">${escapeHTML(doc.author)}</td></tr>
        <tr><td class="label">Date :</td><td class="value">${info.CreationDate ? formatPDFDate(info.CreationDate) : escapeHTML(doc.date)}</td></tr>
        <tr><td class="label">Licence / Statut :</td><td class="value">${licenseBadge}</td></tr>
        ${sha ? `<tr><td class="label">SHA-256 :</td><td class="value"><code style="font-size:11px; word-break:break-all; background:rgba(0,0,0,0.06); padding:2px 4px; border-radius:3px;">${escapeHTML(sha)}</code></td></tr>` : ''}
        ${doc.key && DOCS_CATALOG[doc.key] ? `<tr><td class="label">Miroir Git (Raw) :</td><td class="value"><a href="https://raw.githubusercontent.com/Bwillou1/WilliamGuindon/main/${DOCS_CATALOG[doc.key].file}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-weight:700;">Ouvrir la copie certifiée Git ↗</a></td></tr>` : ''}
        <tr><td class="label">Fichier :</td><td class="value"><a href="${state.currentFile}" download style="color:var(--accent); font-weight:700;">Télécharger le binaire original ↗</a></td></tr>
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
        const rawSnippet = pageText.substring(startIndex, endIndex);
        const escapedSnippet = escapeHTML(rawSnippet);
        const markedSnippet = escapedSnippet.replace(regex, (m) => `<mark>${escapeHTML(m)}</mark>`);

        state.searchResults.push({
          page: i,
          index: totalMatches - 1,
          snippet: `...${markedSnippet}...`
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
    if (dom.sidebar) dom.sidebar.classList.toggle('collapsed', !state.sidebarOpen);
    if (dom.btnSidebarToggle) dom.btnSidebarToggle.classList.toggle('active', state.sidebarOpen);
    if (dom.mobileBtnSidebar) dom.mobileBtnSidebar.classList.toggle('active', state.sidebarOpen);
    
    if (dom.sidebarBackdrop) {
      dom.sidebarBackdrop.classList.toggle('active', state.sidebarOpen && window.innerWidth <= 900);
    }

    // Sur PC, adapter immédiatement le zoom à la nouvelle largeur du viewport
    if (window.innerWidth > 900) {
      setTimeout(() => {
        if (['fit-width', 'fit-page', 'auto'].includes(state.zoomMode)) {
          applyZoom();
        }
      }, 300);
    }
  }

  function switchSidebarTab(tabName) {
    const tabs = [
      { btn: dom.tabThumbnails, pane: dom.paneThumbnails, name: 'thumbnails' },
      { btn: dom.tabOutline, pane: dom.paneOutline, name: 'outline' },
      { btn: dom.tabTranslation, pane: dom.paneTranslation, name: 'translation' }
    ];

    tabs.forEach(t => {
      if (!t.btn || !t.pane) return;
      const isActive = (t.name === tabName);
      t.btn.classList.toggle('active', isActive);
      t.pane.classList.toggle('active', isActive);
    });

    if (!state.sidebarOpen) {
      toggleSidebar(true);
    }

    if (tabName === 'search' && dom.inputSearch) {
      setTimeout(() => dom.inputSearch.focus(), 150);
    } else if (tabName === 'explorer') {
      renderExplorerInSidebar();
      if (dom.inputExplorerSearch) setTimeout(() => dom.inputExplorerSearch.focus(), 150);
    } else if (tabName === 'info') {
      renderDocInfoPane();
    } else if (tabName === 'translation') {
      const targetLang = dom.selectTranslateLang ? dom.selectTranslateLang.value : 'en';
      translateCurrentPage(targetLang);
    }
  }

  async function translateCurrentPage(targetLang = 'en') {
    if (!state.pdfDoc) {
      showToast("Document non chargé", true);
      return;
    }
    const pageNum = state.currentPage || 1;
    if (dom.translationPageBadge) dom.translationPageBadge.textContent = `Page ${pageNum}`;
    if (dom.translationStatus) dom.translationStatus.innerHTML = `<span style="color:var(--brand-primary, #0d652d);">⏳ Extraction du texte de la page ${pageNum} et traduction...</span>`;
    if (dom.translationOutput) dom.translationOutput.textContent = "Extraction et traduction du texte en cours...";

    try {
      const page = await state.pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const textPieces = [];
      let lastY = null;
      let currentBlock = '';

      textContent.items.forEach(item => {
        if (!item.str) return;
        const y = item.transform ? Math.round(item.transform[5]) : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 14) {
          if (currentBlock.trim()) {
            textPieces.push(currentBlock.trim());
            currentBlock = '';
          }
        }
        currentBlock += item.str + ' ';
        if (y !== null) lastY = y;
      });
      if (currentBlock.trim()) textPieces.push(currentBlock.trim());

      const validLines = textPieces.filter(l => l.length > 0);
      if (validLines.length === 0) {
        if (dom.translationStatus) dom.translationStatus.textContent = "Aucun texte extractible sur cette page.";
        if (dom.translationOutput) dom.translationOutput.textContent = "Cette page ne contient pas de texte vectoriel indexé (ou est un scan d'image pur).";
        return;
      }

      // Regrouper par blocs cohérents de taille optimale
      const paragraphs = [];
      let temp = '';
      validLines.forEach(line => {
        if (temp.length + line.length > 450) {
          paragraphs.push(temp.trim());
          temp = line + ' ';
        } else {
          temp += line + ' ';
        }
      });
      if (temp.trim()) paragraphs.push(temp.trim());

      const translatedParagraphs = [];
      for (const p of paragraphs) {
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(p)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          if (data && Array.isArray(data[0])) {
            const piece = data[0].map(s => s[0]).join('');
            translatedParagraphs.push(piece);
          } else {
            translatedParagraphs.push(p);
          }
        } catch (e) {
          translatedParagraphs.push(p);
        }
      }

      const resultText = translatedParagraphs.join('\n\n');
      if (dom.translationOutput) dom.translationOutput.textContent = resultText;
      if (dom.translationStatus) dom.translationStatus.innerHTML = `<span style="color:#059669; font-weight:600;">✔ Traduction de la page ${pageNum} prête (${targetLang.toUpperCase()}) !</span>`;
    } catch (err) {
      if (dom.translationStatus) dom.translationStatus.textContent = "Erreur lors de la traduction.";
      if (dom.translationOutput) dom.translationOutput.textContent = "Impossible d'extraire ou de traduire cette page automatiquement.";
    }
  }

  async function applyTranslationToPage(pageNum, targetLang = 'en') {
    const layer = document.getElementById(`translation-layer-${pageNum}`);
    const canvas = document.getElementById(`canvas-page-${pageNum}`);
    const textLayer = document.getElementById(`text-layer-${pageNum}`);
    const restoreBtn = document.getElementById(`btn-restore-trans-${pageNum}`);
    if (!layer) return;

    if (canvas) canvas.style.display = 'none';
    if (textLayer) textLayer.style.display = 'none';
    if (restoreBtn) restoreBtn.style.display = 'none';
    layer.style.display = 'block';

    const cacheKey = `${pageNum}_${targetLang}`;
    if (state.translatedPagesCache.has(cacheKey)) {
      layer.innerHTML = state.translatedPagesCache.get(cacheKey);
      wireToggleOriginal(layer, pageNum);
      return;
    }

    layer.innerHTML = `
      <div class="translation-layer-header">
        <span class="translation-layer-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          Page ${pageNum} / ${state.totalPages} · Traduction en cours...
        </span>
      </div>
      <div style="display:flex; align-items:center; justify-content:center; padding: 48px 20px; color:#064e3b; gap:12px; font-weight:600;">
        <div class="spinner" style="width:22px; height:22px; border-width:2.5px;"></div>
        <span>Traduction en direct vers l'anglais...</span>
      </div>
    `;

    try {
      const page = await state.pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let fullText = '';
      let prevY = null;
      textContent.items.forEach(it => {
        if (!it.str || !it.str.trim()) return;
        const y = it.transform ? Math.round(it.transform[5]) : null;
        if (prevY !== null && y !== null) {
          const diff = Math.abs(prevY - y);
          if (diff > 20) {
            fullText += '\n\n';
          } else if (diff > 8) {
            fullText += '\n';
          } else {
            fullText += ' ';
          }
        }
        fullText += it.str.trim();
        if (y !== null) prevY = y;
      });

      if (!fullText.trim()) {
        layer.innerHTML = `
          <div class="translation-layer-header">
            <span class="translation-layer-title">Page ${pageNum} / ${state.totalPages} · Aucun texte détecté</span>
            <button type="button" class="btn-toggle-original-btn">Voir original (FR)</button>
          </div>
          <p class="translation-layer-p" style="color:#6b7280; font-style:italic;">Cette page ne contient pas de texte vectoriel extractible (illustration ou scan graphique).</p>
        `;
        wireToggleOriginal(layer, pageNum);
        return;
      }

      const rawParagraphs = fullText.split(/\n\n+/);
      const chunks = [];
      let currentChunk = '';
      for (const p of rawParagraphs) {
        if (!p.trim()) continue;
        if (currentChunk.length + p.length > 1800) {
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          currentChunk = p + '\n\n';
        } else {
          currentChunk += p + '\n\n';
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim());

      const translatedChunks = [];
      for (const chunk of chunks) {
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(chunk)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          if (data && Array.isArray(data[0])) {
            const piece = data[0].map(s => s[0]).join('');
            translatedChunks.push(piece);
          } else {
            translatedChunks.push(chunk);
          }
        } catch (_) {
          translatedChunks.push(chunk);
        }
      }

      const allTranslatedText = translatedChunks.join('\n\n');
      const paragraphs = allTranslatedText.split(/\n\n+/).filter(p => p.trim().length > 0);
      const pTags = paragraphs.map(p => {
        const safeLines = p.split('\n').map(line => escapeHTML(line.trim())).filter(Boolean).join('<br>');
        return `<p class="translation-layer-p">${safeLines}</p>`;
      }).join('');

      const fullHtml = `
        <div class="translation-layer-header">
          <span class="translation-layer-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Page ${pageNum} / ${state.totalPages} · Traduit en anglais (${targetLang.toUpperCase()})
          </span>
          <button type="button" class="btn-toggle-original-btn" title="Afficher la page originale en français">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:3px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            Voir original (FR)
          </button>
        </div>
        <div class="translation-layer-body">
          ${pTags}
        </div>
      `;

      state.translatedPagesCache.set(cacheKey, fullHtml);
      layer.innerHTML = fullHtml;
      wireToggleOriginal(layer, pageNum);
    } catch (e) {
      layer.innerHTML = `
        <div class="translation-layer-header">
          <span class="translation-layer-title">Page ${pageNum} / ${state.totalPages} · Erreur</span>
          <button type="button" class="btn-toggle-original-btn">Voir original (FR)</button>
        </div>
        <p class="translation-layer-p" style="color:#dc2626;">Impossible de traduire automatiquement cette page.</p>
      `;
      wireToggleOriginal(layer, pageNum);
    }
  }

  function wireToggleOriginal(layer, pageNum) {
    const btn = layer.querySelector('.btn-toggle-original-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const canvas = document.getElementById(`canvas-page-${pageNum}`);
      const textLayer = document.getElementById(`text-layer-${pageNum}`);
      const restoreBtn = document.getElementById(`btn-restore-trans-${pageNum}`);
      
      layer.style.display = 'none';
      if (canvas) canvas.style.display = 'block';
      if (textLayer) textLayer.style.display = 'block';
      if (restoreBtn) restoreBtn.style.display = 'inline-flex';
    });
  }

  function toggleTranslationMode(forceState) {
    state.translationMode = (typeof forceState === 'boolean') ? forceState : !state.translationMode;
    
    if (dom.btnTranslateDoc) {
      dom.btnTranslateDoc.classList.toggle('active', state.translationMode);
      dom.btnTranslateDoc.title = state.translationMode 
        ? "Revenir au document original (FR)" 
        : "Traduire ce document en direct (EN)";
    }

    if (dom.btnToggleDocTranslationText) {
      dom.btnToggleDocTranslationText.textContent = state.translationMode 
        ? "Revenir à l'original (FR)" 
        : "Traduire le document sur la page";
    }

    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'wg_translation_status', active: state.translationMode }, '*');
      } catch (_) {}
    }

    const targetLang = dom.selectTranslateLang ? dom.selectTranslateLang.value : 'en';

    if (state.translationMode) {
      showToast("Traduction activée : document affiché en direct");
      
      const current = state.currentPage || 1;
      applyTranslationToPage(current, targetLang);
      
      for (let i = 1; i <= state.totalPages; i++) {
        if (i !== current) {
          applyTranslationToPage(i, targetLang);
        }
      }
    } else {
      showToast("Affichage du document original en français");
      for (let i = 1; i <= state.totalPages; i++) {
        const layer = document.getElementById(`translation-layer-${i}`);
        const canvas = document.getElementById(`canvas-page-${i}`);
        const textLayer = document.getElementById(`text-layer-${i}`);
        const restoreBtn = document.getElementById(`btn-restore-trans-${i}`);
        if (layer) layer.style.display = 'none';
        if (canvas) canvas.style.display = 'block';
        if (textLayer) textLayer.style.display = 'block';
        if (restoreBtn) restoreBtn.style.display = 'none';
      }
    }
  }

  function openGoogleDocsTranslationMode() {
    let absUrl = state.pdfUrl || '';
    if (absUrl && !absUrl.startsWith('http://') && !absUrl.startsWith('https://')) {
      absUrl = window.location.origin + (absUrl.startsWith('/') ? absUrl : '/' + absUrl);
    }
    const downloadName = (state.currentFile && state.currentFile.name) ? state.currentFile.name : 'document.pdf';
    
    if (absUrl) {
      const a = document.createElement('a');
      a.href = absUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    alert(`Le document « ${downloadName} » a été téléchargé dans vos Téléchargements.\n\nGlissez-le simplement dans la zone de dépôt de Google Traduction qui vient de s'ouvrir pour obtenir le document traduit dans sa mise en page d'origine.`);
    window.open('https://translate.google.com/?hl=fr&sl=auto&tl=en&op=docs', '_blank', 'noopener,noreferrer');
  }

  function renderDocInfoPane() {
    if (!dom.paneInfo) return;
    const doc = resolveDocInfo(state.currentFile);
    const sha = doc.sha256 || cachedDynamicSha256 || '';

    let licenseLine = '';
    let authorLabel = 'Auteur :';
    let btnText = 'Notice documentaire &amp; Téléchargement';

    if (doc.isOriginalWork) {
      licenseLine = '<div><strong>Licence :</strong> Creative Commons CC BY-NC-ND 4.0 International</div>';
      authorLabel = 'Auteur :';
      btnText = 'Licence d\'auteur &amp; Téléchargement';
    } else if (doc.isCCE) {
      licenseLine = '<div><strong>Statut :</strong> Document public officiel CCE (Procédure SEM-26-003)</div>';
      authorLabel = 'Émetteur :';
      btnText = 'Document officiel CCE &amp; Téléchargement';
    } else {
      licenseLine = `<div><strong>Statut juridique :</strong> ${escapeHTML(doc.license)}</div>`;
      authorLabel = 'Source / Auteur :';
      btnText = 'Notice documentaire &amp; Téléchargement';
    }

    dom.paneInfo.innerHTML = `
      <div style="padding: 16px;">
        <h4 style="font-size: 1.05rem; margin: 0 0 12px; color: var(--text);">${escapeHTML(doc.title)}</h4>
        <div style="font-size: 0.85rem; line-height: 1.6; color: var(--text-muted); margin-bottom: 16px;">
          <div><strong>${authorLabel}</strong> ${escapeHTML(doc.author)}</div>
          <div><strong>Date :</strong> ${escapeHTML(doc.date || '2026')}</div>
          <div><strong>Pages :</strong> ${state.totalPages}</div>
          ${licenseLine}
          ${sha ? `
            <div style="margin-top: 8px;"><strong>Empreinte SHA-256 :</strong></div>
            <code style="font-size: 11px; word-break: break-all; color: var(--accent); background: var(--bg-card); padding: 4px 6px; border-radius: 4px; display: block; margin-top: 4px;">${escapeHTML(sha)}</code>
          ` : `
            <div style="margin-top: 8px;"><strong>Empreinte SHA-256 :</strong></div>
            <span style="font-size: 11.5px; color: var(--text-muted); display: block; margin-top: 4px;">Calculable au téléchargement du binaire</span>
          `}
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Référence &amp; Citation Recommandée</div>
          <p style="font-size: 0.8rem; margin: 0 0 10px; line-height: 1.5; color: var(--text);">${escapeHTML(doc.citation)}</p>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="btn-copy-mini" id="sidebar-btn-copy-cit">Copier</button>
            <button type="button" class="btn-copy-mini" id="sidebar-btn-bibtex">BibTeX (.bib)</button>
            <button type="button" class="btn-copy-mini" id="sidebar-btn-ris">RIS (.ris)</button>
          </div>
        </div>
        <button type="button" class="btn btn-primary" id="sidebar-btn-full-license" style="width: 100%; font-size: 0.88rem; padding: 8px 12px;">
          ${btnText}
        </button>
      </div>
    `;

    const btnCop = dom.paneInfo.querySelector('#sidebar-btn-copy-cit');
    const btnBib = dom.paneInfo.querySelector('#sidebar-btn-bibtex');
    const btnRis = dom.paneInfo.querySelector('#sidebar-btn-ris');
    const btnFull = dom.paneInfo.querySelector('#sidebar-btn-full-license');

    if (btnCop) {
      btnCop.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(doc.citation).then(() => showToast("Citation copiée !"));
        }
      });
    }
    if (btnBib && dom.btnExportBibtex) {
      btnBib.addEventListener('click', () => dom.btnExportBibtex.click());
    }
    if (btnRis && dom.btnExportRis) {
      btnRis.addEventListener('click', () => dom.btnExportRis.click());
    }
    if (btnFull) {
      btnFull.addEventListener('click', () => openLicenseDialog());
    }
  }

  let explorerLoaded = false;
  const SIDEBAR_ARCHIVE_FILES = ["01_Especes_Menacees_Biodiversite/G01_Couleuvre_tachetee_BIFFE_AUDIT.png", "01_Especes_Menacees_Biodiversite/G02_Grebe_esclavon_BIFFE_AUDIT.csv", "01_Especes_Menacees_Biodiversite/G03_Monarque_BIFFE_AUDIT.csv", "01_Especes_Menacees_Biodiversite/G04_Tortue_serpentine_BIFFE_AUDIT.csv", "01_Especes_Menacees_Biodiversite/G05_Fiche_Statut_Espece_LEP_BIFFE_AUDIT.png", "01_Especes_Menacees_Biodiversite/G06_observations-752640_BIFFE_AUDIT.csv", "01_Especes_Menacees_Biodiversite/G07_515-2025-rae_BIFFE_AUDIT.pdf", "01_Especes_Menacees_Biodiversite/G08_2025-03-18_Memoire_PL93-2_BIFFE_AUDIT.pdf", "01_Especes_Menacees_Biodiversite/G09_Article_LeDevoir_Especes_Menacees_BIFFE_AUDIT.pdf", "01_Especes_Menacees_Biodiversite/G10_Tableau_Especes_Menacees_Federal_2026-07-06_BIFFE_AUDIT.pdf", "01_Especes_Menacees_Biodiversite/G11_Rapport_371_BAPE_2026-07-06_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/Capture_2026-07-16_11h49.00_BIFFE_AUDIT.png", "02_Contaminations_Fuites_Stablex_Medias/Capture_2026-07-16_12h14.48_BIFFE_AUDIT.png", "02_Contaminations_Fuites_Stablex_Medias/Capture_2026-07-16_12h32.50_BIFFE_AUDIT.png", "02_Contaminations_Fuites_Stablex_Medias/Dossier_Stablex_financement_republicains_TVA_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H01_Blainville_Groupes_Plainte_Stablex_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H02_Debordement_Eau_Coloree_Stablex_JDM_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H03_Plainte_Groupes_Environnementaux_CityNews_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H04_Metaux_Toxiques_Echantillonnages_Radio_Canada_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H05_Des_poissons_proteges_LeDevoir_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H06_Evacuation_Trois_Entreprises_JDM_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H07_Explosion_Blainville_6_Blesses_TVA_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H08_Metaux_Lourds_Contamination_Inquietante_TVA_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H09_Metaux_Lourds_Eaux_Blainville_Nord_Info_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H13_Communique_Fuite_Toxique_Climat_Quebec_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H14_Stablex_Repond_Allegations_CIME_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H15_Metaux_Toxiques_Detectes_Climat_Quebec_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H16_Projet_Loi_Aide_Stablex_Radio_Canada_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H17_Gestion_Dechets_Dangereux_Radio_Canada_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H18_Benoit_Charette_Accuse_Blainville_LeDevoir_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H19_Contamination_Inquietante_Stablex_TVA_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H20_Examen_Impacts_Poisson_LeDevoir_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H21_Campagne_Echantillonnage_Presse_Toi_A_Gauche_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H22_Bunkers_Plan_Bouchard_Guerre_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/H23_Site_Camp_Bouchard_Decontamination(x)_Munitions_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/Martine_Oullet_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/Protection_dune_tourbiere_a_Blainville_Le_combat_dun_adolescent_a_lONU_BIFFE_AUDIT.pdf", "02_Contaminations_Fuites_Stablex_Medias/Stablex_ecoblanchiment_Presse_toi_a_gauche_BIFFE_AUDIT.pdf", "03_Etudes_Ecologiques_Cartes_Tourbiere/I01_Fiche_Technique_Suivi_2026-07-06_BIFFE_AUDIT.pdf", "03_Etudes_Ecologiques_Cartes_Tourbiere/I02_Etude_UQAM_COBAMIL_Esker_Ste_Therese_BIFFE_AUDIT.pdf", "03_Etudes_Ecologiques_Cartes_Tourbiere/I03_Memoire_UQAM_Geomorphologie_Laurentides_BIFFE_AUDIT.pdf", "03_Etudes_Ecologiques_Cartes_Tourbiere/I04_Rapport_Final_Caracterisation_Milieux_Naturels_2014_BIFFE_AUDIT.pdf", "03_Etudes_Ecologiques_Cartes_Tourbiere/I05_Carte_Especes_Susceptibles_Menacees_BIFFE_AUDIT.jpg", "03_Etudes_Ecologiques_Cartes_Tourbiere/I06_Carte_Valeur_Ecologique_Tourbiere_BIFFE_AUDIT.pdf", "03_Etudes_Ecologiques_Cartes_Tourbiere/I07_Carte_Localisation_Milieux_Naturels_Blainville_BIFFE_AUDIT.png", "03_Etudes_Ecologiques_Cartes_Tourbiere/I08_Carte_Obsers_BIFFE_AUDIT.pdf", "03_Etudes_Ecologiques_Cartes_Tourbiere/I09_Memoire_Collectif_Projet_Loi_93_Mars2025_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/2flush_BIFFE_AUDIT.mp4", "04_Preuves_Citoyennes_Tests_Eau_Rapports/62-DET2_fr_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/Capture d’écran, le 2026-07-16 à 12.14.48_BIFFE_AUDIT.png", "04_Preuves_Citoyennes_Tests_Eau_Rapports/Capture d’écran, le 2026-07-16 à 12.32.50_BIFFE_AUDIT.png", "04_Preuves_Citoyennes_Tests_Eau_Rapports/DM30_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/Des groupes portent plainte contre Stablex et dénoncent le désengagement du ministère de l’Environnement - Eau Secours_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/EauSecours_Groupes_portent_plainte_Stablex_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/F01_2026-06-10_Stablex_Rapport-WaterShed-1_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/F02_Resultats_Tests_Citoyens_Blainville_Stable_BIFFE_AUDIT.kml", "04_Preuves_Citoyennes_Tests_Eau_Rapports/Firme_externe_embauchee_par_la_ville_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/La science citoyenne expose la pollution causée par une entreprise de Blainville - Pivot_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/PHOTO_PATRICK_SANFAÇON_LA_PRESSE_BIFFE_AUDIT.png", "04_Preuves_Citoyennes_Tests_Eau_Rapports/Rencontre_expert_2026-07-07_version_longue_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/Ressource_visuelle_BIFFE_AUDIT.pdf", "04_Preuves_Citoyennes_Tests_Eau_Rapports/reddit_BIFFE_AUDIT.pdf", "05_Images_Satellites_Sentinel2_NDVI/Annexe_Pieces_Justificatives_Complement_SEM-26-003_BIFFE_AUDIT.csv", "05_Images_Satellites_Sentinel2_NDVI/Complement_information_SEM-26-003_BIFFE_AUDIT.pdf", "05_Images_Satellites_Sentinel2_NDVI/J01_2026-04-24_Sentinel-2_L2A_True_Color_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J02_2026-04-24_Sentinel-2_L2A_NDVI_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J03_2026-06-13_Sentinel-2_L2A_True_Color_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J04_2026-06-13_Sentinel-2_L2A_NDVI_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J05_2026-06-13_Sentinel-2_L2A_SWIR_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J06_2026-07-23_Sentinel-2_L2A_True_Color_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J07_2026-07-23_Sentinel-2_L2A_NDVI_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J08_2026-09-11_Sentinel-2_L2A_True_Color_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J09_2026-09-11_Sentinel-2_L2A_NDVI_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J10_2026-09-11_Sentinel-2_L2A_SWIR_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J11_2026-04-24_au_2026-09-11_Sentinel-2_L2A_Timelapse_BIFFE_AUDIT.gif", "05_Images_Satellites_Sentinel2_NDVI/J12_2026-04-24_au_2026-09-11_Sentinel-2_L2A_Timelapse_BIFFE_AUDIT.mp4", "05_Images_Satellites_Sentinel2_NDVI/J13_2026-09-13_Vecteur_Emprise_Etude_Stablex_Cellule6_BIFFE_AUDIT.geojson", "05_Images_Satellites_Sentinel2_NDVI/J14_2026-09-13_Capture_Serie_Spectrale_NDVI_6M_Mars-Sept2026_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J15_2026-09-13_Capture_Serie_Spectrale_NDVI_3M_Juin-Sept2026_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J16_2026-09-13_Capture_Serie_Spectrale_NDVI_3M_Mars-Juin2026_BIFFE_AUDIT.png", "05_Images_Satellites_Sentinel2_NDVI/J17_2026-03-11_au_2026-09-11_Sentinel-2_L2A_NDVI_Donnees_Brutes_6M_BIFFE_AUDIT.csv", "05_Images_Satellites_Sentinel2_NDVI/J18_2026-06-11_au_2026-09-11_Sentinel-2_L2A_NDVI_Donnees_Brutes_3M_Ete_BIFFE_AUDIT.csv", "05_Images_Satellites_Sentinel2_NDVI/J19_2026-03-13_au_2026-06-13_Sentinel-2_L2A_NDVI_Donnees_Brutes_3M_Printemps_BIFFE_AUDIT.csv", "06_Demarches_Juridiques_ONU_ECCC/2026-06-30_Lettre_reponse_M_Guindon_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/Capture_2026-07-16_CanLII_BIFFE_AUDIT.png", "06_Demarches_Juridiques_ONU_ECCC/D01_Accuse_Reception_Enquete_Stablex_03Juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D02_Demande_Enquete_Autorites_03Juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D03_Suivi_Demande_Enquete_10Juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D04_Demande_Clarification_STB_16Juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D05_Notification_Ecrite_Prealable_CCE_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D06_Accuse_Notification_ECCC_19Juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D07_Accuse_Automatique_MERN_19Juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D08_Accuse_Automatique_MELCCFP_19Juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D09_Accuse_Automatique_PMO_19Juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D0_Formulaire_Demande_Acces_Redacted_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D0_Reponse_Acces_Blainville_30Juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D10_minister_19juin2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D11_Demande_Rencontre_ECCC_2026-06-28_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D11_Demande_Rencontre_ECCC_2026-06-28_BIFFE.png", "06_Demarches_Juridiques_ONU_ECCC/D12_Accuse_Reception_ECCC_2026-06-28_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D13_Rapport_Soumission_ONU_2026-06-28_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D14_Resume_Soumission_Environnementale_2026-06-28_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/D14_Resume_Soumission_Environnementale_2026-06-28_BIFFE.png", "06_Demarches_Juridiques_ONU_ECCC/E02_Demande_Precisions_Ville_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/Formulaire_accesV2026_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/Gmail_Demande_acces_Lacs_Fauvel_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/Gmail_RE_Soumission_petition_environnementale_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/Lettre_CEDD_au_petitionnaire_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/Petition_environnementale_Stablex_Blainville_BIFFE.pdf", "06_Demarches_Juridiques_ONU_ECCC/Reponse_partielle_ministere_BIFFE.pdf", "07_Lettres_Appui_Communications_CCE/09-l-appui-sem-26-003_fr_redacted.pdf", "07_Lettres_Appui_Communications_CCE/26-3-det2_fr (2).pdf", "07_Lettres_Appui_Communications_CCE/26-3-rsub_fr_redacted (5).pdf", "08_Audit_Tracabilite_Registres/00_CHAIN_OF_CUSTODY.sha256", "08_Audit_Tracabilite_Registres/00_RAPPORT_AUDIT_GFIH_COMPL.md", "08_Audit_Tracabilite_Registres/00_REGISTRE_DES_BIFFURES.pdf", "08_Audit_Tracabilite_Registres/00_REGISTRE_DES_BIFFURES.txt", "A - B - C/00_CHAIN_OF_CUSTODY.pdf", "A - B - C/00_CHAIN_OF_CUSTODY.sha256", "A - B - C/00_RAPPORT_AUDIT_ABC.md", "A - B - C/00_REGISTRE_DES_BIFFURES.pdf", "A - B - C/00_REGISTRE_DES_BIFFURES.txt", "A - B - C/3026512.pdf", "A - B - C/A01_Etude_Impact_Cellule6_Nov2020.pdf", "A - B - C/A02_Analyse_Air_Ambiant_Stablex_Dec2024.pdf", "A - B - C/A03_Rapport_Inspection_Stablex.pdf", "A - B - C/A04_Mise_Jour_Description_Impacts_Juin2022.pdf", "A - B - C/B01_Caracterisation_Sols_Dec2025.pdf", "A - B - C/B02_Caracterisation_Eaux_Surface_Dec2025.pdf", "A - B - C/B03_Caracterisation_Milieu_Naturel_Oct2023.pdf", "A - B - C/C01_Courriel_Suivi_57.pdf", "A - B - C/C02_Demande_Engagements_DGEES_45.pdf", "A - B - C/C03_Complements_Information_MELCCFP_44.pdf", "A - B - C/C04_Projet_Reechantillonnage_Urgence_42.pdf", "A - B - C/C05_Requetes_Consultation_Publique_31.pdf", "A - B - C/C06_Document_Officiel_Suivi_22.pdf", "A - B - C/C07_Document_Officiel_Suivi_16.pdf", "A - B - C/C08_Directive_Ministerielle_MELCCFP.pdf", "A - B - C/CCE - À l’heure des comptes - Résultats de la requête.pdf", "A - B - C/Capture d’écran, le 2026-07-06 à 13.29.47.png", "A - B - C/Capture d’écran, le 2026-07-16 à 12.17.05.png", "A - B - C/DB14_Rapport d_enquête 7122-02-89-0000022.pdf", "A - B - C/Dossier Stablex_ du financement à des républicains controversés _ TVA Nouvelles.pdf", "A - B - C/Profil de lobbying de Republic Services • OpenSecrets.pdf", "A - B - C/Recensement 2021 Blainvillois.pdf", "A - B - C/Rejets polluants/Analyse de conformité LCPE – Cas Stablex.pdf", "A - B - C/Rejets polluants/INRP_2012_5491.pdf", "A - B - C/Rejets polluants/INRP_2024_5491 (Tableau).pdf", "A - B - C/Rejets polluants/INRP_2024_5491.pdf", "A - B - C/Rejets polluants/INRP_2025_5491.pdf", "A - B - C/Rejets polluants/Journal des débats de l_Assemblée nationale - Assemblée nationale du Québec.pdf", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.37.50.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.37.57.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.38.04.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.38.12.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.38.18.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.38.25.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.38.32.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.38.38.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.38.45.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.38.53.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.39.04.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.39.22.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.39.29.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.39.35.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.39.42.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.39.48.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.39.53.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.39.59.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.40.05.png", "A - B - C/Rejets polluants/Plan Bouchard/Renseignements financiers-annuels/Capture d’écran, le 2026-07-14 à 10.40.12.png", "A - B - C/Rejets polluants/Plan Bouchard/Site 06875001 - Camp Bouchard, ancien dépôt de munitions.pdf", "A - B - C/Rejets polluants/rejet.pdf", "A - B - C/Sealosafe/https_www.britishnewspaperarchive.co.uk_search_results_1989-06-20_NewspaperTitle=Birmingham_2BNews&IssueId=BL_2F0003661_2F19890620_2F&County=Warwickshire_2C_20England.png", "A - B - C/Sealosafe/pr84.pdf", "A - B - C/Sealosafe/rapport371.pdf", "A - B - C/Sealosafe/seal12.png", "A - B - C/Sealosafe/seal13.png", "A - B - C/Sealosafe/seal14.png", "A - B - C/Sealosafe/seal15.png", "A - B - C/Sealosafe/seal16.png", "A - B - C/Sealosafe/seal18.png", "A - B - C/Sealosafe/seal20.png", "A - B - C/compte-rendu-rencontre-2-stablex.pdf", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/10mars_CCBC6S.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/10mars_CCBC6S_2.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/18_juin_fuite_CCBC6S.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/18_juin_fuite_CCBC6S_2.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/18_juin_fuite_CCBC6S_3.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/18_juin_fuite_CCBC6S_4.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/471362605_557192947288793_7552720520798828378_n.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/486693577_628236726851081_4669035421769396090_n.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/488581095_634855336189220_7127364322750908112_n.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/488595555_635345709473516_6276673584910527341_n.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/498641043_668527152822038_5242990835995525266_n.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/8_oct_fuite_CCBC6S.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_10.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_11.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_12.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_13.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_14.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_15.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_16.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_17.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_18.JPG", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_19.JPG", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_20.JPG", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_21.JPG.png", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_6.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_7.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/CCBC6S_9.jpg", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/Capture d’écran, le 2026-07-15 à 14.22.14.png", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/Capture d’écran, le 2026-07-15 à 14.22.25.png", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/Capture d’écran, le 2026-07-15 à 14.22.32.png", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/Capture d’écran, le 2026-07-15 à 14.22.40.png", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/Capture d’écran, le 2026-07-15 à 14.58.55.png", "H11_Recueil_Preuves_Visuelles_Fuites_Terrain (png)/PHOTO PATRICK SANFAÇON, LA PRESSE.webp", "RC/RC _ Enquête.docx", "RC/RC-1.pdf", "RC/RC-2.pdf", "RC/RC-3.pdf", "RC/RC-4.pdf"];

  function renderExplorerInSidebar() {
    if (!dom.explorerTree || explorerLoaded) return;
    explorerLoaded = true;

    dom.explorerTree.innerHTML = '<div style="padding: 12px; font-size: 11.5px; color: var(--text-faint); text-align: center;">Chargement de l\'arborescence probatoire...</div>';

    function buildSidebarTree(fileList) {
      const root = { subfolders: {}, files: [] };
      fileList.forEach(fullPath => {
        let clean = fullPath;
        if (clean.startsWith('00_DOSSIER_POUR_JOURNALISTES_BIFFE/')) {
          clean = clean.replace('00_DOSSIER_POUR_JOURNALISTES_BIFFE/', '');
        }
        const parts = clean.split('/');
        const fileName = parts.pop();
        let cur = root;
        parts.forEach(p => {
          if (!cur.subfolders[p]) cur.subfolders[p] = { subfolders: {}, files: [] };
          cur = cur.subfolders[p];
        });
        cur.files.push({
          name: fileName,
          originalPath: fullPath,
          cleanPath: clean,
          isPdf: fileName.toLowerCase().endsWith('.pdf')
        });
      });
      return root;
    }

    function countFolder(n) {
      let c = n.files.length;
      for (const k in n.subfolders) c += countFolder(n.subfolders[k]);
      return c;
    }

    function renderNode(node, container, isRoot) {
      const folders = Object.keys(node.subfolders).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
      folders.forEach((fName, idx) => {
        const sub = node.subfolders[fName];
        const total = countFolder(sub);
        const div = document.createElement('div');
        div.className = 'tree-node' + (isRoot && idx === 0 ? ' open' : '');
        div.style.marginBottom = '2px';

        const header = document.createElement('div');
        header.style.cssText = 'display:flex; align-items:center; gap:6px; padding:5px 8px; cursor:pointer; font-size:12px; font-weight:600; border-radius:6px; color:var(--text);';
        header.innerHTML = `
          <span style="font-size:9px; width:12px; text-align:center; color:var(--text-faint);">▶</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHTML(fName)}">${escapeHTML(fName)}</span>
          <span style="font-size:10px; color:var(--accent-deep); background:var(--accent-wash); padding:1px 6px; border-radius:10px;">${total}</span>
        `;

        const children = document.createElement('div');
        children.style.cssText = 'display:none; padding-left:10px; border-left:1.5px dashed var(--line); margin-left:8px; margin-top:2px;';

        header.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = div.classList.toggle('open');
          children.style.display = isOpen ? 'block' : 'none';
          header.querySelector('span').textContent = isOpen ? '▼' : '▶';
        });

        if (isRoot && idx === 0) {
          children.style.display = 'block';
          header.querySelector('span').textContent = '▼';
        }

        renderNode(sub, children, false);
        div.appendChild(header);
        div.appendChild(children);
        container.appendChild(div);
      });

      const files = node.files.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
      files.forEach(f => {
        const item = document.createElement('div');
        item.className = 'sidebar-file-item';
        item.style.cssText = 'display:flex; align-items:center; gap:6px; padding:4px 8px; cursor:pointer; font-size:11.5px; border-radius:5px; margin:1px 0; color:var(--text); transition:background 0.12s;';
        item.dataset.fileName = f.name.toLowerCase();

        let svgIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
        if (f.isPdf) {
          svgIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>';
        }

        item.innerHTML = `
          <span style="display:inline-flex;align-items:center;flex-shrink:0;">${svgIcon}</span>
          <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHTML(f.name)}">${escapeHTML(f.name)}</span>
        `;

        item.addEventListener('mouseenter', () => item.style.background = 'var(--accent-wash)');
        item.addEventListener('mouseleave', () => {
          if (!item.classList.contains('active')) item.style.background = 'transparent';
        });

        const archiveUrl = 'https://archive.org/download/dossier-journalistes-tourbiere-blainville-stablex/' + encodeURI(f.originalPath);

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          document.querySelectorAll('.sidebar-file-item').forEach(el => {
            el.classList.remove('active');
            el.style.background = 'transparent';
          });
          item.classList.add('active');
          item.style.background = 'var(--accent-wash)';

          if (f.isPdf) {
            loadPDF(archiveUrl, 1);
            if (dom.badge) dom.badge.textContent = 'Archive Probatoire';
            document.title = `${f.name} — Lecteur Officiel · William Guindon`;
            if (window.innerWidth < 900) toggleSidebar(false);
          } else {
            window.open(archiveUrl, '_blank');
          }
        });

        container.appendChild(item);
      });
    }

    const treeData = buildSidebarTree(SIDEBAR_ARCHIVE_FILES);
    dom.explorerTree.innerHTML = '';
    renderNode(treeData, dom.explorerTree, true);

    // Filtrage en direct
    if (dom.inputExplorerSearch) {
      dom.inputExplorerSearch.addEventListener('input', () => {
        const q = dom.inputExplorerSearch.value.trim().toLowerCase();
        const items = dom.explorerTree.querySelectorAll('.sidebar-file-item');
        items.forEach(it => {
          const isMatch = !q || (it.dataset.fileName || '').includes(q);
          it.style.display = isMatch ? 'flex' : 'none';
          if (isMatch && q) {
            let p = it.parentElement;
            while (p && p !== dom.explorerTree) {
              if (p.style.display === 'none') p.style.display = 'block';
              p = p.parentElement;
            }
          }
        });
      });
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
        if (docKey === '__open_drive__') {
          window.location.href = 'dossier-journalistes.html';
          return;
        }
        if (DOCS_CATALOG[docKey]) {
          const doc = DOCS_CATALOG[docKey];
          loadPDF(doc.file, 1);
          if (dom.badge) dom.badge.textContent = doc.badge;
        }
      });
    }

    // Toggle Sidebar (En-tête & Mobile)
    if (dom.btnSidebarToggle) {
      dom.btnSidebarToggle.addEventListener('click', () => toggleSidebar());
    }
    if (dom.mobileBtnSidebar) {
      dom.mobileBtnSidebar.addEventListener('click', () => toggleSidebar());
    }
    if (dom.btnSidebarClose) {
      dom.btnSidebarClose.addEventListener('click', () => toggleSidebar(false));
    }
    if (dom.sidebarBackdrop) {
      dom.sidebarBackdrop.addEventListener('click', () => toggleSidebar(false));
    }

    // Onglets Sidebar
    if (dom.tabThumbnails) dom.tabThumbnails.addEventListener('click', () => switchSidebarTab('thumbnails'));
    if (dom.tabOutline) dom.tabOutline.addEventListener('click', () => switchSidebarTab('outline'));
    if (dom.tabTranslation) dom.tabTranslation.addEventListener('click', () => switchSidebarTab('translation'));
    if (dom.tabSearch) dom.tabSearch.addEventListener('click', () => switchSidebarTab('search'));
    if (dom.tabExplorer) dom.tabExplorer.addEventListener('click', () => switchSidebarTab('explorer'));
    if (dom.tabAi) dom.tabAi.addEventListener('click', () => switchSidebarTab('ai'));
    if (dom.tabInfo) dom.tabInfo.addEventListener('click', () => switchSidebarTab('info'));

    // Actions du volet de traduction
    if (dom.btnToggleDocTranslation) {
      dom.btnToggleDocTranslation.addEventListener('click', () => {
        toggleTranslationMode();
      });
    }
    if (dom.btnTranslateCurrentPage) {
      dom.btnTranslateCurrentPage.addEventListener('click', () => {
        const targetLang = dom.selectTranslateLang ? dom.selectTranslateLang.value : 'en';
        translateCurrentPage(targetLang);
        applyTranslationToPage(state.currentPage || 1, targetLang);
      });
    }
    if (dom.selectTranslateLang) {
      dom.selectTranslateLang.addEventListener('change', () => {
        const lang = dom.selectTranslateLang.value;
        translateCurrentPage(lang);
        if (state.translationMode) {
          for (let i = 1; i <= state.totalPages; i++) {
            applyTranslationToPage(i, lang);
          }
        }
      });
    }
    if (dom.btnOpenGoogleDocsMode) {
      dom.btnOpenGoogleDocsMode.addEventListener('click', () => {
        openGoogleDocsTranslationMode();
      });
    }
    if (dom.btnCopyTranslation) {
      dom.btnCopyTranslation.addEventListener('click', () => {
        const text = dom.translationOutput ? dom.translationOutput.textContent : '';
        if (text && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => showToast("Texte traduit copié dans le presse-papiers !"));
        }
      });
    }



    // Navigation de pages (Barre supérieure & Barre mobile)
    if (dom.btnPrev) dom.btnPrev.addEventListener('click', () => scrollToPage(state.currentPage - 1));
    if (dom.btnNext) dom.btnNext.addEventListener('click', () => scrollToPage(state.currentPage + 1));
    if (dom.mobileBtnPrev) dom.mobileBtnPrev.addEventListener('click', () => scrollToPage(state.currentPage - 1));
    if (dom.mobileBtnNext) dom.mobileBtnNext.addEventListener('click', () => scrollToPage(state.currentPage + 1));

    // Contrôles rapides barre mobile
    if (dom.mobileBtnSearch) {
      dom.mobileBtnSearch.addEventListener('click', () => switchSidebarTab('search'));
    }
    if (dom.mobileBtnMode) {
      dom.mobileBtnMode.addEventListener('click', () => cycleReadingMode());
    }
    if (dom.mobileBtnFit) {
      dom.mobileBtnFit.addEventListener('click', () => {
        state.zoomMode = 'fit-width';
        applyZoom();
        showToast("Zoom : Ajusté à la largeur");
      });
    }

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

    /**
     * Vérifie si le document est une soumission originale de William Guindon
     */
    function isAuthorSubmission(filePath) {
      if (!filePath) return false;
      const clean = filePath.trim();
      return clean.includes('26-3-rsub_fr_redacted.pdf') || 
             clean.includes('26-3-formal-deposition-and-urgent-appeal.pdf');
    }

    /**
     * Ajoute le numéro du dossier après la lettre de classification du document
     * (ex: dossier 01 et pièce G08 -> G1_08_...)
     */
    function formatDocumentFileName(filePath) {
      if (!filePath) return 'document.pdf';
      const rawName = filePath.split('/').pop().split('?')[0] || 'document.pdf';
      
      const folderMatch = filePath.match(/(?:^|\/)0*([1-9]\d*)_[^\/]+\//);
      const folderNum = folderMatch ? folderMatch[1] : null;

      if (folderNum) {
        const letterMatch = rawName.match(/^([A-Za-z])(?!\d*[A-Za-z])(\d+.*)$/);
        if (letterMatch) {
          const letter = letterMatch[1];
          const rest = letterMatch[2];
          if (!rest.startsWith(folderNum)) {
            return `${letter}${folderNum}_${rest}`;
          }
        }
      }
      return rawName;
    }

    /**
     * Déclenche le téléchargement direct d'une pièce tierce sans imposer la licence CC BY-NC-ND
     */
    function triggerDirectDownload(filePath) {
      const rawSafe = getSafeDocUrl(filePath);
      const safeFile = ALLOWED_LOCAL_DOCS.has(rawSafe) ? rawSafe : filePath;
      const downloadName = formatDocumentFileName(filePath || safeFile);
      const a = document.createElement('a');
      a.href = encodeURI(safeFile);
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Téléchargement de « ${downloadName} » initié`);
    }

    // Téléchargement du binaire : la licence CC BY-NC-ND 4.0 ne s'affiche que sur la soumission de William
    if (dom.btnDownload) {
      dom.btnDownload.addEventListener('click', () => {
        if (isAuthorSubmission(state.currentFile)) {
          openLicenseDialog('download');
        } else {
          triggerDirectDownload(state.currentFile);
        }
      });
    }

    // Impression Haute Fidélité
    if (dom.btnPrint) {
      dom.btnPrint.addEventListener('click', printDocument);
    }

    // Partage
    if (dom.btnShare) {
      dom.btnShare.addEventListener('click', () => {
        if (isAuthorSubmission(state.currentFile)) {
          openLicenseDialog('share');
        } else {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
              showToast("Lien de la pièce copié dans le presse-papiers !");
            }).catch(() => {});
          }
        }
      });
    }

    // Gestionnaires de la modale de notice & téléchargement
    if (dom.btnConfirmDownload) {
      dom.btnConfirmDownload.addEventListener('click', () => {
        const docInfo = resolveDocInfo(state.currentFile);

        if (dom.licenseCheckbox && !dom.licenseCheckbox.checked) {
          const warnMsg = docInfo.isOriginalWork
            ? "Veuillez accepter la licence CC BY-NC-ND 4.0 pour continuer."
            : "Veuillez accepter la notice de diffusion pour continuer.";
          showToast(warnMsg, true);
          return;
        }

        const rawSafe = getSafeDocUrl(state.currentFile);
        const safeFile = ALLOWED_LOCAL_DOCS.has(rawSafe) ? rawSafe : state.currentFile;
        const downloadName = formatDocumentFileName(safeFile);
        const a = document.createElement('a');
        a.href = encodeURI(safeFile);
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Copie de l'empreinte & citation dans le presse-papiers avec attribution respectueuse
        const sha = docInfo.sha256 || cachedDynamicSha256 || '';
        let attributionText = '';
        if (docInfo.isOriginalWork) {
          attributionText = `[Document Officiel CCE SEM-26-003]\nTitre: ${docInfo.title}\nAuteur: William Guindon\nLicence: Creative Commons CC BY-NC-ND 4.0 International\n${sha ? 'Empreinte SHA-256: ' + sha + '\n' : ''}Citation: ${docInfo.citation}\nSource officielle: https://williamguindon.me/viewer.html?file=${encodeURIComponent(state.currentFile)}`;
        } else if (docInfo.isCCE) {
          attributionText = `[Document Officiel du Registre CCE SEM-26-003]\nTitre: ${docInfo.title}\nÉmetteur: Secrétariat de la CCE\nStatut: Document public officiel (Art. 24.27 ACEUM)\n${sha ? 'Empreinte SHA-256: ' + sha + '\n' : ''}Citation: ${docInfo.citation}\nConsultable sur: https://williamguindon.me/viewer.html?file=${encodeURIComponent(state.currentFile)}`;
        } else {
          attributionText = `[Pièce Documentaire · Dossier Public SEM-26-003]\nTitre: ${docInfo.title}\nAuteur / Source: ${docInfo.author}\nStatut juridique: ${docInfo.license}\n${sha ? 'Empreinte SHA-256: ' + sha + '\n' : ''}Citation: ${docInfo.citation}\nConsultable sur: https://williamguindon.me/viewer.html?file=${encodeURIComponent(state.currentFile)}`;
        }

        if (navigator.clipboard) {
          navigator.clipboard.writeText(attributionText).catch(() => {});
        }

        if (dom.licenseDialog) dom.licenseDialog.close();

        if (docInfo.isOriginalWork) {
          showToast("Soumission téléchargée · Empreinte SHA-256 certifiée !");
        } else if (docInfo.isCCE) {
          showToast("Décision CCE téléchargée · Registre officiel SEM-26-003");
        } else {
          showToast("Document téléchargé · Pièce du dossier public SEM-26-003");
        }
      });
    }

    if (dom.btnCopyHash) {
      dom.btnCopyHash.addEventListener('click', () => {
        if (dom.licenseDocHash && navigator.clipboard) {
          navigator.clipboard.writeText(dom.licenseDocHash.textContent).then(() => {
            showToast("Empreinte SHA-256 copiée !");
          });
        }
      });
    }

    if (dom.btnCopyCitation) {
      dom.btnCopyCitation.addEventListener('click', () => {
        if (dom.licenseCitationText && navigator.clipboard) {
          navigator.clipboard.writeText(dom.licenseCitationText.textContent).then(() => {
            showToast("Référence / Citation copiée !");
          });
        }
      });
    }

    function downloadFile(filename, content, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    if (dom.btnExportBibtex) {
      dom.btnExportBibtex.addEventListener('click', () => {
        const doc = resolveDocInfo(state.currentFile);
        const bibKey = (doc.file ? doc.file.split('/').pop().replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_') : 'sem26003_doc');
        const sha = doc.sha256 || cachedDynamicSha256 || '';
        const authorField = doc.isOriginalWork ? 'Guindon, William' : doc.author;
        const howPub = doc.isCCE
          ? 'Commission de coopération environnementale (CCE / ACEUM)'
          : 'Dossier documentaire public SEM-26-003 (CCE / ACEUM)';

        const bibContent = `@misc{${bibKey}_${doc.date || 2026},
  author = {${authorField}},
  title = {${doc.title}},
  year = {${doc.date || 2026}},
  howpublished = {${howPub}},
  url = {https://williamguindon.me/viewer.html?file=${encodeURIComponent(state.currentFile)}},
  note = {${doc.license}${sha ? ' · SHA-256: ' + sha : ''}}
}
`;
        downloadFile(`${bibKey}.bib`, bibContent, 'application/x-bibtex;charset=utf-8');
        showToast("Fichier BibTeX (.bib) téléchargé !");
      });
    }

    if (dom.btnExportRis) {
      dom.btnExportRis.addEventListener('click', () => {
        const doc = resolveDocInfo(state.currentFile);
        const risKey = (doc.file ? doc.file.split('/').pop().replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_') : 'sem26003_doc');
        const sha = doc.sha256 || cachedDynamicSha256 || '';
        const authorField = doc.isOriginalWork ? 'Guindon, William' : doc.author;
        const risContent = `TY  - ELEC
AU  - ${authorField}
TI  - ${doc.title}
PY  - ${doc.date || 2026}
PB  - Commission de coopération environnementale
UR  - https://williamguindon.me/viewer.html?file=${encodeURIComponent(state.currentFile)}
M3  - Dossier CCE SEM-26-003
N1  - ${doc.license}${sha ? ' · Empreinte SHA-256: ' + sha : ''}
ER  - 
`;
        downloadFile(`${risKey}.ris`, risContent, 'application/x-research-info-systems;charset=utf-8');
        showToast("Fichier RIS (.ris) téléchargé !");
      });
    }

    if (dom.btnCite) {
      dom.btnCite.addEventListener('click', () => {
        openLicenseDialog();
      });
    }

    if (dom.btnCopyShareLink) {
      dom.btnCopyShareLink.addEventListener('click', () => {
        const docInfo = resolveDocInfo(state.currentFile);
        const shareUrl = `${window.location.origin}${window.location.pathname}?file=${encodeURIComponent(state.currentFile)}#page=${state.currentPage}`;
        const citation = dom.licenseCitationText ? dom.licenseCitationText.textContent : docInfo.citation;
        let fullShare = '';
        if (docInfo.isOriginalWork) {
          fullShare = `${citation}\nSource: ${shareUrl}\nLicence: Creative Commons CC BY-NC-ND 4.0 (Auteur: William Guindon)`;
        } else if (docInfo.isCCE) {
          fullShare = `${citation}\nSource: ${shareUrl}\nStatut: Document public officiel CCE (SEM-26-003)`;
        } else {
          fullShare = `${citation}\nSource: ${shareUrl}\nNotice: Pièce documentaire versée au dossier public SEM-26-003 (Droits des auteurs d'origine)`;
        }
        if (navigator.clipboard) {
          navigator.clipboard.writeText(fullShare).then(() => {
            showToast("Lien & citation avec attribution copiés !");
          });
        }
        if (dom.licenseDialog) dom.licenseDialog.close();
      });
    }

    if (dom.licenseCheckbox && dom.btnConfirmDownload) {
      dom.licenseCheckbox.addEventListener('change', () => {
        dom.btnConfirmDownload.disabled = !dom.licenseCheckbox.checked;
      });
    }

    if (dom.btnLicenseDialogClose && dom.licenseDialog) {
      dom.btnLicenseDialogClose.addEventListener('click', () => {
        dom.licenseDialog.close();
      });
    }

    // Commutateur de thème clair/sombre du site
    if (dom.btnThemeToggle) {
      dom.btnThemeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        broadcastThemeChange(nextTheme);

        if (nextTheme === 'dark') {
          if (state.readingMode === 'normal') setReadingMode('dark', true);
        } else {
          if (state.readingMode === 'dark') setReadingMode('normal', true);
          dom.app.classList.remove('mode-dark');
        }
      });
    }

    // Traduction automatique du document
    if (dom.btnTranslateDoc) {
      dom.btnTranslateDoc.addEventListener('click', () => {
        toggleTranslationMode();
      });
    }

    // Infobulle flottante de traduction de sélection de texte
    const setupSelectionTranslator = () => {
      let translateBadge = document.getElementById('viewer-selection-translate-btn');
      if (!translateBadge) {
        translateBadge = document.createElement('button');
        translateBadge.id = 'viewer-selection-translate-btn';
        translateBadge.className = 'viewer-selection-translate-btn';
        translateBadge.type = 'button';
        translateBadge.setAttribute('aria-label', 'Traduire le texte sélectionné avec Google Traduction');
        translateBadge.innerHTML = `
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          <span>Traduire la sélection</span>
        `;
        document.body.appendChild(translateBadge);
      }

      let activeSelectedText = '';

      const hideBadge = () => {
        if (translateBadge) translateBadge.style.display = 'none';
        activeSelectedText = '';
      };

      const handleSelection = () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          hideBadge();
          return;
        }
        const text = sel.toString().trim();
        if (!text || text.length < 2) {
          hideBadge();
          return;
        }

        const range = sel.getRangeAt(0);
        const container = dom.pagesContainer || dom.viewport;
        if (!container || !container.contains(range.commonAncestorContainer)) {
          hideBadge();
          return;
        }

        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) {
          hideBadge();
          return;
        }

        activeSelectedText = text;
        const top = Math.max(10, window.scrollY + rect.top - 38);
        const left = Math.min(window.innerWidth - 180, Math.max(10, window.scrollX + rect.left + (rect.width / 2) - 80));

        translateBadge.style.top = `${top}px`;
        translateBadge.style.left = `${left}px`;
        translateBadge.style.display = 'inline-flex';
      };

      document.addEventListener('mouseup', () => {
        setTimeout(handleSelection, 80);
      });
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') hideBadge();
        else setTimeout(handleSelection, 80);
      });
      document.addEventListener('mousedown', (e) => {
        if (translateBadge && !translateBadge.contains(e.target)) {
          hideBadge();
        }
      });

      translateBadge.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (activeSelectedText) {
          const targetUrl = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(activeSelectedText)}`;
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
          showToast("Extrait ouvert dans Google Traduction");
          hideBadge();
        }
      });
    };

    setupSelectionTranslator();

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

    // Gestes tactiles sur la barre latérale pour fermeture par glissement (Swipe left)
    if (dom.sidebar) {
      let touchStartX = 0;
      let touchStartY = 0;
      dom.sidebar.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      dom.sidebar.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const diffX = e.changedTouches[0].clientX - touchStartX;
          const diffY = Math.abs(e.changedTouches[0].clientY - touchStartY);
          if (diffX < -50 && diffY < 60 && window.innerWidth <= 900) {
            toggleSidebar(false);
          }
        }
      }, { passive: true });
    }

    // Redimensionnement de fenêtre fluide et réactif
    let prevWidth = window.innerWidth;
    window.addEventListener('resize', debounce(() => {
      const curWidth = window.innerWidth;
      
      // Gestion de la transition de breakpoint (Desktop <-> Mobile)
      if (curWidth > 900 && prevWidth <= 900) {
        if (dom.sidebarBackdrop) dom.sidebarBackdrop.classList.remove('active');
      } else if (curWidth <= 900 && prevWidth > 900) {
        if (state.sidebarOpen && dom.sidebarBackdrop) {
          dom.sidebarBackdrop.classList.add('active');
        }
      }
      prevWidth = curWidth;

      // Recalcul du zoom pour s'adapter parfaitement à la nouvelle largeur
      if (state.zoomMode === 'fit-width' || state.zoomMode === 'fit-page' || state.zoomMode === 'auto') {
        applyZoom();
      }
    }, 150));

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
      case 'p':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          printDocument();
        }
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

  /**
   * Ouvre la modale de notice documentaire / licence, empreinte SHA-256 et téléchargement
   */
  async function openLicenseDialog(action = 'download') {
    if (!dom.licenseDialog) return;

    const docInfo = resolveDocInfo(state.currentFile);

    // Titre et métadonnées du document
    if (dom.licenseDocTitle) dom.licenseDocTitle.textContent = docInfo.title;
    if (dom.licenseDocMeta) {
      if (docInfo.isOriginalWork) {
        dom.licenseDocMeta.textContent = `${docInfo.date} · ${state.totalPages || docInfo.pages} pages · Auteur : William Guindon`;
      } else if (docInfo.isCCE) {
        dom.licenseDocMeta.textContent = `${docInfo.date} · ${state.totalPages || docInfo.pages} pages · Émetteur : Secrétariat de la CCE (SEM-26-003)`;
      } else {
        dom.licenseDocMeta.textContent = `${state.totalPages || docInfo.pages} pages · Dossier public SEM-26-003 · Source / Auteur : ${docInfo.author}`;
      }
    }

    // Badge pill et Titre du dialogue
    if (dom.licenseBadgePill) {
      dom.licenseBadgePill.classList.remove('pill-cce', 'pill-third-party');
      if (docInfo.isOriginalWork) {
        dom.licenseBadgePill.textContent = "CC BY-NC-ND 4.0";
      } else if (docInfo.isCCE) {
        dom.licenseBadgePill.textContent = "Registre Officiel CCE";
        dom.licenseBadgePill.classList.add('pill-cce');
      } else {
        dom.licenseBadgePill.textContent = "Archive Publique · Pièce Documentaire";
        dom.licenseBadgePill.classList.add('pill-third-party');
      }
    }

    if (dom.licenseDialogHeading) {
      if (docInfo.isOriginalWork) {
        dom.licenseDialogHeading.textContent = "Téléchargement & Licence d'Auteur";
      } else if (docInfo.isCCE) {
        dom.licenseDialogHeading.textContent = "Téléchargement & Document Officiel CCE";
      } else {
        dom.licenseDialogHeading.textContent = "Téléchargement & Notice de Diffusion Publique";
      }
    }

    // Carte des termes & licence
    if (dom.licenseTermsCard) {
      dom.licenseTermsCard.classList.remove('card-cce', 'card-third-party');
      if (docInfo.isOriginalWork) {
        // Mode Auteur (William Guindon)
        if (dom.licenseTermsTitle) dom.licenseTermsTitle.textContent = "Conditions de Licence Creative Commons (CC BY-NC-ND 4.0)";
        if (dom.licenseTermsText) {
          dom.licenseTermsText.innerHTML = "Vous êtes libre de partager, copier et redistribuer ce document original rédigé par William Guindon dans tout format. Vous devez obligatoirement <strong>créditer l'auteur (William Guindon)</strong>, intégrer un lien vers la source officielle et indiquer si des modifications ont été effectuées (pas d'utilisation commerciale ni d'œuvres dérivées sans accord préalable).";
        }
        if (dom.licenseAiClause) {
          dom.licenseAiClause.innerHTML = "<span><strong>Consultation &amp; Indexation IA :</strong> L'indexation, la lecture automatisée et la citation par les intelligences artificielles ou moteurs de recherche sont autorisées dans le strict respect de la licence <strong>CC BY-NC-ND 4.0</strong> (usage non commercial, pas de dérivation) avec l'obligation de citer l'auteur : <em>William Guindon (SEM-26-003 / williamguindon.me)</em>.</span>";
        }
      } else if (docInfo.isCCE) {
        // Mode CCE officiel
        dom.licenseTermsCard.classList.add('card-cce');
        if (dom.licenseTermsTitle) dom.licenseTermsTitle.textContent = "Statut Juridique — Document Officiel du Registre Public CCE";
        if (dom.licenseTermsText) {
          dom.licenseTermsText.innerHTML = "Ce document est une décision ou un acte officiel rendu par le Secrétariat de la <strong>Commission de coopération environnementale (CCE)</strong> en vertu du Chapitre 24 de l'Accord Canada–États-Unis–Mexique (ACEUM). Il appartient au dossier public international de la procédure SEM-26-003 et n'a pas été rédigé par William Guindon.";
        }
        if (dom.licenseAiClause) {
          dom.licenseAiClause.innerHTML = "<span><strong>Diffusion officielle &amp; Archivage :</strong> Document public accessible à tous les citoyens, chercheurs et journalistes. La citation officielle doit mentionner le Secrétariat de la CCE et la procédure SEM-26-003.</span>";
        }
      } else {
        // Mode Pièce d'archive / Auteur tiers
        dom.licenseTermsCard.classList.add('card-third-party');
        if (dom.licenseTermsTitle) dom.licenseTermsTitle.textContent = "Notice de Propriété Intellectuelle & Droits des Auteurs Tiers";
        if (dom.licenseTermsText) {
          dom.licenseTermsText.innerHTML = "<strong>Ce contenu n'appartient pas à William Guindon.</strong> Il s'agit d'une pièce probatoire, d'un mémoire d'expert, d'une étude environnementale ou d'un article de presse versé au dossier public d'intérêt général SEM-26-003. Les droits d'auteur demeurent la propriété exclusive de leurs auteurs et éditeurs respectifs, ou relèvent du domaine public.";
        }
        if (dom.licenseAiClause) {
          dom.licenseAiClause.innerHTML = "<span><strong>Intérêt public &amp; Utilisation équitable :</strong> La consultation et le téléchargement sont offerts à des fins d'information citoyenne, de couverture journalistique et de recherche juridique, en conformité avec l'exception pour utilisation équitable (art. 29 de la Loi sur le droit d'auteur du Canada / Fair Dealing). En cas de citation, veillez à créditer les auteurs originaux du document.</span>";
        }
      }
    }

    // Empreinte SHA-256
    if (dom.licenseDocHash) {
      if (docInfo.sha256) {
        dom.licenseDocHash.textContent = docInfo.sha256;
      } else {
        dom.licenseDocHash.textContent = "Calcul de l'empreinte SHA-256 en cours...";
        computeCurrentDocSha256().then(computed => {
          if (computed && dom.licenseDocHash) {
            dom.licenseDocHash.textContent = computed;
          } else if (dom.licenseDocHash) {
            dom.licenseDocHash.textContent = "Empreinte vérifiable sur le binaire original téléchargé";
          }
        });
      }
    }

    // Citation
    if (dom.licenseCitationText) dom.licenseCitationText.textContent = docInfo.citation;
    if (dom.licenseCitationLabel) {
      dom.licenseCitationLabel.textContent = docInfo.isOriginalWork
        ? "Citation Recommandée (ISO 690 / APA / Juridique) :"
        : "Référence & Citation Recommandée :";
    }

    // Case à cocher
    if (dom.licenseCheckboxText) {
      if (docInfo.isOriginalWork) {
        dom.licenseCheckboxText.innerHTML = "J'accepte les conditions de la licence <strong>CC BY-NC-ND 4.0</strong> et m'engage à citer l'auteur (William Guindon).";
      } else if (docInfo.isCCE) {
        dom.licenseCheckboxText.innerHTML = "Je prends acte du statut de document officiel public de la CCE et m'engage à en respecter l'intégrité.";
      } else {
        dom.licenseCheckboxText.innerHTML = "Je prends acte que ce document provient d'un dossier documentaire public et m'engage à respecter les droits des auteurs d'origine.";
      }
    }

    if (dom.licenseCheckbox) dom.licenseCheckbox.checked = true;
    if (dom.btnConfirmDownload) dom.btnConfirmDownload.disabled = false;

    dom.licenseDialog.showModal();
  }

  /**
   * Impression Haute Qualité & Rendu Total
   */
  async function printDocument() {
    if (!state.pdfDoc) return;

    showToast("Préparation de l'impression haute résolution...");

    // 1. Tenter l'impression vectorielle directe native par iframe (100% vectoriel, netteté absolue)
    try {
      let printIframe = document.getElementById('pdf-print-iframe');
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'pdf-print-iframe';
        printIframe.style.position = 'fixed';
        printIframe.style.top = '-9999px';
        printIframe.style.left = '-9999px';
        printIframe.style.width = '1px';
        printIframe.style.height = '1px';
        printIframe.style.border = 'none';
        printIframe.setAttribute('aria-hidden', 'true');
        document.body.appendChild(printIframe);
      }

      let iframePrintTriggered = false;
      printIframe.onload = function() {
        if (iframePrintTriggered) return;
        iframePrintTriggered = true;
        setTimeout(() => {
          try {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
          } catch (err) {
            console.warn("Impression iframe non disponible, bascule vers le rendu multi-pages:", err);
            fallbackPrintAllPages();
          }
        }, 300);
      };

      const rawPrint = getSafeDocUrl(state.currentFile);
      const safePrintFile = ALLOWED_LOCAL_DOCS.has(rawPrint) ? rawPrint : null;
      if (!safePrintFile) {
        await fallbackPrintAllPages();
        return;
      }

      printIframe.src = encodeURI(safePrintFile);
      return;
    } catch (e) {
      console.warn("Échec iframe native print:", e);
    }

    // 2. Fallback universel : rendu haute résolution de toutes les pages dans #print-container
    await fallbackPrintAllPages();
  }

  async function fallbackPrintAllPages() {
    const printContainer = document.getElementById('print-container');
    if (!printContainer || !state.pdfDoc) {
      window.print();
      return;
    }

    showLoading(`Préparation de l'impression (1 / ${state.totalPages} pages)...`);
    printContainer.innerHTML = '';

    try {
      for (let i = 1; i <= state.totalPages; i++) {
        showLoading(`Rendu haute résolution pour impression (${i} / ${state.totalPages} pages)...`);
        const page = await state.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2.0, rotation: state.rotation });

        const item = document.createElement('div');
        item.className = 'print-page-item';

        const canvas = document.createElement('canvas');
        canvas.className = 'print-page-canvas';
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        item.appendChild(canvas);
        printContainer.appendChild(item);
      }

      hideLoading();
      setTimeout(() => {
        window.print();
      }, 200);
    } catch (err) {
      console.error("Erreur génération impression:", err);
      hideLoading();
      showToast("Erreur lors de la préparation de l'impression", true);
    }
  }

  // Nettoyage après impression pour libérer la mémoire vive
  window.addEventListener('afterprint', () => {
    const printContainer = document.getElementById('print-container');
    if (printContainer) printContainer.innerHTML = '';
  });

  function setReadingMode(mode, fromThemeToggle = false) {
    state.readingMode = mode;
    dom.app.classList.remove('mode-dark', 'mode-sepia', 'mode-contrast');
    if (mode !== 'normal') {
      dom.app.classList.add(`mode-${mode}`);
    }
    if (dom.selectReadingMode) dom.selectReadingMode.value = mode;

    if (!fromThemeToggle) {
      if (mode === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        broadcastThemeChange('dark');
      } else if (mode === 'normal') {
        document.documentElement.setAttribute('data-theme', 'light');
        broadcastThemeChange('light');
      }
    }

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
