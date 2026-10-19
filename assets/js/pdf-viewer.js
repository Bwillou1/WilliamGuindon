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
          // L'affectation de --scale-factor doit être faite avant renderTextLayer
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

          // Ajout et liaison de l'élément .endOfContent (spécification Mozilla PDF.js TextLayerBuilder)
          let endDiv = this.container.querySelector('.endOfContent');
          if (!endDiv) {
            endDiv = document.createElement('div');
            endDiv.className = 'endOfContent';
            this.container.appendChild(endDiv);
          }

          // Liaison des interactions de sélection souris et du presse-papier
          this._bindMouse();
        }

        _bindMouse() {
          const div = this.container;
          if (div.dataset.mouseBound === 'true') return;
          div.dataset.mouseBound = 'true';

          div.addEventListener('mousedown', (evt) => {
            const end = div.querySelector('.endOfContent');
            if (!end) return;
            let adjustTop = (evt.target !== div);
            if (adjustTop) {
              const divBounds = div.getBoundingClientRect();
              if (divBounds.height > 0) {
                const r = Math.max(0, (evt.clientY - divBounds.top) / divBounds.height);
                end.style.top = (r * 100).toFixed(2) + '%';
              }
            }
            end.classList.add('active');
          });

          div.addEventListener('mouseup', () => {
            const end = div.querySelector('.endOfContent');
            if (end) {
              end.style.top = '';
              end.classList.remove('active');
            }
          });

          // Événement copy avec normalisation Unicode (suppression des césures et des caractères nuls)
          div.addEventListener('copy', (event) => {
            const selection = document.getSelection();
            if (!selection || selection.isCollapsed) return;

            let text = selection.toString();
            if (text) {
              // Nettoyer les caractères nuls et normaliser Unicode
              text = text.replace(/\0/g, '');
              if (typeof pdfjsLib.normalizeUnicode === 'function') {
                text = pdfjsLib.normalizeUnicode(text);
              }
              if (event.clipboardData) {
                event.clipboardData.setData('text/plain', text);
                event.preventDefault();
              }
            }
          });
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
    'observations-reponse-canada-17-octobre-2026': {
      title: "Observations de l'auteur sur la réponse du Canada (17 octobre 2026)",
      file: "assets/docs/observations-reponse-canada-sem26003.pdf",
      badge: "SEM-26-003 · Observations citoyennes (17 oct. 2026)",
      date: "17 octobre 2026",
      pages: 3,
      type: "Observations formelles de l'auteur (Art. 24.28 ACEUM)",
      sha256: "b6f045810fdcf995acf5a6b5775cbaace353ba7f7eb3007003c0692a4e281da7",
      author: "William Tristan Logan Théo Guindon (Auteur SEM-26-003)",
      citation: "Guindon, W. (2026). Communication SEM-26-003 (Enfouissement de matières dangereuses à Blainville) — Observations sur la demande de fermeture ou de report formulée dans la réponse du Canada du 16 octobre 2026. Blainville : Secrétariat de la CCE.",
      license: "Document officiel déposé auprès de la CCE (CC BY-NC-ND 4.0)",
      isOriginalWork: true,
      isCCE: true
    },
    'reponse-canada-16-octobre-2026': {
      title: "Réponse officielle du gouvernement du Canada (16 octobre 2026)",
      file: "assets/docs/72-rsp_fr.pdf",
      badge: "SEM-26-003 · Réponse du Canada (72-RSP)",
      date: "16 octobre 2026",
      pages: 2,
      type: "Réponse de la Partie (Art. 24.27(4) ACEUM)",
      sha256: "31ce88255e51b47118532da9e121f52d550ca421f583ebfa20a57cd8b6f0f5e2",
      author: "Sanchez,Amenemhet (elle | she, her) (ECCC) — Pour le gouvernement du Canada",
      internalTitle: "Microsoft Word - 04 - FR - Canada's Notification - Request to Terminate SEM-26-003.docx",
      exportTimestamp: "16/10/2026 15:43:27 HAE (UTC-4)",
      converterTool: "Microsoft: Print To PDF (PDF v1.7, 267 Ko)",
      citation: "Gouvernement du Canada. (2026). Réponse de la Partie à la communication SEM-26-003 (Enfouissement de matières dangereuses à Blainville) en vertu de l'article 24.27(4) de l'ACEUM. Ottawa / Montréal.",
      license: "Document officiel déposé auprès de la CCE (Domaine public probatoire)",
      isOriginalWork: false,
      isCCE: true
    },
    'accuse-reception-cce-16-octobre-2026': {
      title: "Accusé de réception du Secrétariat CCE (16 octobre 2026)",
      file: "assets/docs/73-rec_fr.pdf",
      badge: "SEM-26-003 · Greffe CCE (73-REC)",
      date: "16 octobre 2026",
      pages: 1,
      type: "Accusé de réception officiel du greffe",
      sha256: "c7a7498caab9176aa8b80367dedf4b6471dfff26236f4f76ff0d89209f2a7432",
      author: "Secrétariat de la CCE (Paolo Solano)",
      citation: "Secrétariat de la CCE. (2026). Accusé de réception de la réponse du Canada en vertu de l'article 24.27(4) de l'ACEUM (Dossier SEM-26-003). Montréal : CCE.",
      license: "Document officiel du greffe de la CCE (Domaine public probatoire)",
      isOriginalWork: false,
      isCCE: true
    },
    'petition-546-bvg-cedd': {
      title: "Pétition environnementale no 0546 (CEDD / BVG) & Accusé officiel",
      file: "assets/docs/petition-546-cedd-bvg.pdf",
      badge: "Pétition 0546 · CEDD / BVG (Loi sur le vérificateur général)",
      date: "13 juillet 2026",
      pages: 7,
      type: "Pétition environnementale statutaire (art. 22)",
      sha256: "4f84c0e44495257dbe3b0756bbc8c224b6952cb2ef343b1b53d44051da9dd243",
      author: "William Guindon (pétitionnaire) / Bureau du vérificateur général du Canada",
      citation: "Guindon, W. & Bureau du vérificateur général du Canada. (2026). Pétition environnementale no 0546 : Application des lois environnementales fédérales au site Stablex à Blainville et accusé de réception officiel du CEDD. Ottawa : BVG.",
      license: "Document officiel déposé en vertu de l'art. 22 de la Loi sur le vérificateur général",
      isOriginalWork: true,
      isCCE: false
    },
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
   * Validation stricte des URLs autorisées pour le téléchargement direct (CodeQL Client-side URL redirect mitigation)
   */
  function validateDownloadUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const clean = url.trim();
    if (ALLOWED_LOCAL_DOCS.has(clean)) return clean;
    if (/^assets\/docs\/[a-zA-Z0-9_\-\.]+\.pdf$/.test(clean)) return clean;
    try {
      const parsed = new URL(clean, window.location.href);
      if (parsed.origin === window.location.origin) {
        const path = parsed.pathname.replace(/^\//, '');
        if (ALLOWED_LOCAL_DOCS.has(path) || /^assets\/docs\/[a-zA-Z0-9_\-\.]+\.pdf$/.test(path)) {
          return path;
        }
      }
      if (parsed.protocol === 'https:' && (parsed.hostname === 'archive.org' || parsed.hostname.endsWith('.archive.org'))) {
        if (parsed.pathname.toLowerCase().endsWith('.pdf') || parsed.pathname.includes('.pdf')) {
          return parsed.href;
        }
      }
    } catch (_) {}
    return null;
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
    searchQuery: '',
    matchCase: false,
    matchWord: false,
    sidebarOpen: false,
    translationMode: false,
    translationLayout: 'overlay', // 'overlay' | 'fluid'
    translatedPagesCache: new Map(), // cacheKey -> pageData object
    // Surlignages persistants (User Highlights)
    userHighlights: [], // [{ id, page, text, color, timestamp }]
    // Comparateur double document côte à côte (Split-screen)
    splitMode: false,
    splitPdfDoc: null,
    splitDocKey: 'observations-reponse-canada-17-octobre-2026',
    splitCurrentPage: 1,
    splitTotalPages: 0,
    splitPageRenderingQueue: new Map(),
    splitRenderedPages: new Set()
  };

  // Éléments du DOM
  const dom = {
    app: document.getElementById('pdf-app'),
    main: document.querySelector('.viewer-main'),
    viewport: document.getElementById('viewer-viewport'),
    pagesContainer: document.getElementById('pages-container'),
    sidebar: document.getElementById('viewer-sidebar'),
    btnSidebarToggle: document.getElementById('btn-sidebar-toggle'),
    btnSplitToggle: document.getElementById('btn-split-toggle'),
    btnNativeToggle: document.getElementById('btn-native-toggle'),
    // Split Viewport Elements
    splitViewport: document.getElementById('split-viewport'),
    splitDocSelect: document.getElementById('split-doc-select'),
    splitPagesContainer: document.getElementById('split-pages-container'),
    splitLoading: document.getElementById('split-loading'),
    splitPageCounter: document.getElementById('split-page-counter'),
    btnSplitPrev: document.getElementById('btn-split-prev'),
    btnSplitNext: document.getElementById('btn-split-next'),
    btnSplitClose: document.getElementById('btn-split-close'),
    // Bulle de sélection de surlignage
    selectionTooltip: document.getElementById('pdf-selection-tooltip'),
    btnCopySelection: document.getElementById('btn-copy-selection'),
    // Volet surlignages
    tabHighlights: document.getElementById('tab-highlights'),
    paneHighlights: document.getElementById('pane-highlights'),
    highlightsList: document.getElementById('highlights-list'),
    highlightsCountBadge: document.getElementById('highlights-count-badge'),
    btnSearchToggle: document.getElementById('btn-search-toggle'),
    // Barre de recherche in-document (Findbar)
    findbar: document.getElementById('pdf-findbar'),
    findbarInput: document.getElementById('findbar-input'),
    findbarCount: document.getElementById('findbar-count'),
    findbarBtnPrev: document.getElementById('findbar-btn-prev'),
    findbarBtnNext: document.getElementById('findbar-btn-next'),
    findbarBtnCase: document.getElementById('findbar-btn-case'),
    findbarBtnWord: document.getElementById('findbar-btn-word'),
    findbarBtnSidebar: document.getElementById('findbar-btn-sidebar'),
    findbarBtnClose: document.getElementById('findbar-btn-close'),
    checkMatchCase: document.getElementById('check-match-case'),
    checkMatchWord: document.getElementById('check-match-word'),
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
    btnSwitchEmbedpdf: document.getElementById('btn-switch-embedpdf'),
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

    // Sécurisation stricte de l'état initial des modes secondaires (Split & Natif fermés par défaut)
    state.splitMode = false;
    if (dom.main) dom.main.classList.remove('split-active');
    if (dom.splitViewport) {
      dom.splitViewport.classList.add('hidden');
      dom.splitViewport.style.setProperty('display', 'none', 'important');
    }
    if (dom.btnSplitToggle) dom.btnSplitToggle.classList.remove('active');

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

    // Vérifier si l'utilisateur a défini le format Navigateur ou Intégré comme mode par défaut
    const readerPref = (function () {
      try {
        const stored = localStorage.getItem('wg_pdf_reader_pref');
        if (stored === 'native' || stored === 'custom') return stored;
        const isLargeScreen = window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        return (isLargeScreen && !isTouch) ? 'native' : 'custom';
      } catch (_) {
        return 'custom';
      }
    })();
    const forceCustom = urlParams.get('mode') === 'custom' || urlParams.get('force') === 'custom' || hashParams.get('mode') === 'custom';

    if (readerPref === 'native' && !forceCustom) {
      const pageHash = targetPage > 1 ? `#page=${targetPage}` : '';
      window.location.replace(`${targetFile}${pageHash}`);
      return;
    }

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
        updateNativeViewerLink();
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
    updateNativeViewerLink();
  }

  function isPdfViewerLockdown() {
    try {
      const raw = localStorage.getItem('wg_radical_site_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        const now = Date.now();
        if (parsed.pdfLockdownActive && (!parsed.pdfLockdownUntil || now < parsed.pdfLockdownUntil)) {
          return true;
        }
        if (parsed.disablePDF) {
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  /**
   * Charge un fichier PDF via PDF.js
   */
  async function loadPDF(url, startPage = 1) {
    if (isPdfViewerLockdown()) {
      showLoading("Vérification des autorisations documentaires...");
      // Verrouillage probatoire absolu : suspension infinie (spinner permanent sans requête réseau ni blob)
      return new Promise(() => {});
    }
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

      // Charger les surlignages persistants du document
      loadSavedHighlights();

      // Ajuster le zoom et rendre les pages visibles
      applyZoom();

      hideLoading();

      // Faire défiler vers la page de départ si > 1
      if (state.currentPage > 1) {
        setTimeout(() => scrollToPage(state.currentPage), 150);
      }

      updateNativeViewerLink();
      showToast(`Document prêt (${state.totalPages} pages)`);
    } catch (error) {
      console.error("Erreur de chargement PDF:", error);
      hideLoading();
      if (dom.pagesContainer) {
        const rawFileName = (safeUrl.split('/').pop() || 'document.pdf').split('?')[0];
        const fileName = rawFileName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const validatedUrl = validateDownloadUrl(safeUrl) || DOCS_CATALOG['decision-17-aout-2026'].file;

        dom.pagesContainer.textContent = '';
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 420px; padding: 40px 20px; text-align: center; color: var(--text, #111); width: 100%;';

        const iconCircle = document.createElement('div');
        iconCircle.style.cssText = 'width: 58px; height: 58px; border-radius: 50%; background: rgba(220, 38, 38, 0.1); color: #dc2626; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;';
        iconCircle.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

        const h3 = document.createElement('h3');
        h3.style.cssText = 'margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 700; color: #064e3b;';
        h3.textContent = 'Document temporairement indisponible en prévisualisation';

        const p = document.createElement('p');
        p.style.cssText = 'margin: 0 0 18px 0; max-width: 480px; font-size: 0.92rem; color: var(--text-muted, #52796f); line-height: 1.5;';
        p.textContent = "Le serveur distant d'archivage (Internet Archive) est actuellement instable ou en maintenance. Vous pouvez télécharger le fichier original ou retenter le chargement.";

        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;';

        const dlBtn = document.createElement('a');
        dlBtn.href = encodeURI(validatedUrl);
        dlBtn.download = fileName;
        dlBtn.className = 'btn';
        dlBtn.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; background: #064e3b; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 0.88rem;';
        dlBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
        const dlSpan = document.createElement('span');
        dlSpan.textContent = `Télécharger le PDF original (${fileName})`;
        dlBtn.appendChild(dlSpan);

        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'btn';
        retryBtn.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; background: var(--surface, #f4f4f4); border: 1px solid var(--border, #cbd7cf); color: var(--text, #111); cursor: pointer; font-weight: 600; font-size: 0.88rem;';
        retryBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>';
        const retrySpan = document.createElement('span');
        retrySpan.textContent = 'Réessayer';
        retryBtn.appendChild(retrySpan);
        retryBtn.addEventListener('click', () => {
          window.location.reload();
        });

        actions.appendChild(dlBtn);
        actions.appendChild(retryBtn);

        wrapper.appendChild(iconCircle);
        wrapper.appendChild(h3);
        wrapper.appendChild(p);
        wrapper.appendChild(actions);

        dom.pagesContainer.appendChild(wrapper);
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
        if (state.translationLayout === 'overlay') {
          canvas.style.display = 'block';
        } else {
          canvas.style.display = 'none';
        }
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
      const translationLayer = document.getElementById(`translation-layer-${pageNum}`);
      if (translationLayer) translationLayer.style.setProperty('--scale-factor', viewport.scale);
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

      // Si une recherche est active, appliquer les surbrillances sur la nouvelle page rendue
      if (state.searchQuery && state.searchQuery.trim() !== '') {
        const activeItem = state.searchResults[state.currentSearchIndex];
        const activeMatchInPage = (activeItem && activeItem.page === pageNum) ? activeItem.matchIndexInPage : -1;
        highlightMatchesOnPage(pageNum, state.searchQuery, activeMatchInPage);
      }

      // Appliquer les surlignages personnalisés de l'utilisateur
      renderSavedHighlightsOnPage(pageNum);

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

  // Fonctions de surbrillance et recherche in-document
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function clearHighlightsOnPage(pageNum) {
    const textLayer = document.getElementById(`text-layer-${pageNum}`);
    if (!textLayer) return;
    const marks = textLayer.querySelectorAll('.highlight:not(.user-highlight)');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
  }

  function clearAllHighlights() {
    for (let i = 1; i <= state.totalPages; i++) {
      clearHighlightsOnPage(i);
    }
  }

  function highlightMatchesOnPage(pageNum, query, activeMatchIndexInPage = -1) {
    const textLayer = document.getElementById(`text-layer-${pageNum}`);
    if (!textLayer) return;

    clearHighlightsOnPage(pageNum);
    if (!query || query.trim() === '') return;

    let pattern = escapeRegExp(query.trim());
    if (state.matchWord) pattern = `\\b${pattern}\\b`;
    const flags = state.matchCase ? 'g' : 'gi';
    let regex;
    try {
      regex = new RegExp(pattern, flags);
    } catch (_) {
      return;
    }

    const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    let matchCounter = 0;
    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      if (parent && parent.classList && parent.classList.contains('highlight')) return;
      const text = textNode.nodeValue;
      if (!text || !regex.test(text)) return;

      regex.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.substring(lastIdx, match.index)));
        }
        const mark = document.createElement('span');
        mark.className = 'highlight';
        mark.dataset.page = pageNum;
        mark.dataset.matchIdx = matchCounter;
        if (matchCounter === activeMatchIndexInPage) {
          mark.classList.add('selected');
          setTimeout(() => {
            mark.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }, 60);
        }
        mark.textContent = match[0];
        frag.appendChild(mark);
        lastIdx = regex.lastIndex;
        matchCounter++;
      }

      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.substring(lastIdx)));
      }

      parent.replaceChild(frag, textNode);
    });
  }

  function openFindbar(focusInput = true) {
    switchSidebarTab('search');
    if (dom.btnSearchToggle) dom.btnSearchToggle.classList.add('active');

    const selection = window.getSelection().toString().trim();
    if (selection && dom.inputSearch) {
      dom.inputSearch.value = selection;
      performSearch(selection);
    }

    if (focusInput && dom.inputSearch) {
      setTimeout(() => {
        dom.inputSearch.focus();
        dom.inputSearch.select();
      }, 150);
    }
  }

  function closeFindbar() {
    if (state.sidebarOpen && dom.tabSearch && dom.tabSearch.classList.contains('active')) {
      toggleSidebar(false);
    }
    if (dom.btnSearchToggle) dom.btnSearchToggle.classList.remove('active');
  }

  function toggleFindbar() {
    if (state.sidebarOpen && dom.tabSearch && dom.tabSearch.classList.contains('active')) {
      closeFindbar();
    } else {
      openFindbar(true);
    }
  }

  function updateSearchCounts() {
    const total = state.searchResults.length;
    const current = total > 0 ? (state.currentSearchIndex + 1) : 0;
    const label = `${current}/${total}`;

    if (dom.findbarCount) {
      dom.findbarCount.textContent = label;
      dom.findbarCount.style.color = (total === 0 && state.searchQuery) ? '#ef4444' : 'var(--text-muted)';
    }
    if (dom.searchCountLabel) {
      dom.searchCountLabel.textContent = total === 0 
        ? (state.searchQuery ? '0 résultat' : '0 résultat')
        : `${current} / ${total} résultat${total > 1 ? 's' : ''}`;
    }
  }

  /**
   * Recherche de texte exacte dans l'intégralité du document
   */
  async function performSearch(query) {
    state.searchQuery = (query || '').trim();

    // Synchroniser les deux champs de saisie
    if (dom.findbarInput && dom.findbarInput.value !== state.searchQuery) {
      dom.findbarInput.value = state.searchQuery;
    }
    if (dom.inputSearch && dom.inputSearch.value !== state.searchQuery) {
      dom.inputSearch.value = state.searchQuery;
    }

    if (!state.searchQuery || !state.pdfDoc) {
      if (dom.searchResultsList) dom.searchResultsList.innerHTML = '';
      state.searchResults = [];
      state.currentSearchIndex = -1;
      clearAllHighlights();
      updateSearchCounts();
      return;
    }

    if (dom.findbarCount) dom.findbarCount.textContent = '...';
    if (dom.searchCountLabel) dom.searchCountLabel.textContent = 'Recherche en cours...';
    if (dom.searchResultsList) dom.searchResultsList.innerHTML = '';
    state.searchResults = [];
    state.currentSearchIndex = -1;
    clearAllHighlights();

    let pattern = escapeRegExp(state.searchQuery);
    if (state.matchWord) pattern = `\\b${pattern}\\b`;
    const flags = state.matchCase ? 'g' : 'gi';
    let regex;
    try {
      regex = new RegExp(pattern, flags);
    } catch (_) {
      updateSearchCounts();
      return;
    }

    let totalMatches = 0;

    for (let i = 1; i <= state.totalPages; i++) {
      const page = await state.pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(it => it.str).join(' ');

      let match;
      let pageMatchCount = 0;
      while ((match = regex.exec(pageText)) !== null) {
        totalMatches++;
        const startIndex = Math.max(0, match.index - 40);
        const endIndex = Math.min(pageText.length, match.index + state.searchQuery.length + 40);
        const rawSnippet = pageText.substring(startIndex, endIndex);
        const escapedSnippet = escapeHTML(rawSnippet);
        const markedSnippet = escapedSnippet.replace(regex, (m) => `<mark>${escapeHTML(m)}</mark>`);

        state.searchResults.push({
          page: i,
          matchIndexInPage: pageMatchCount,
          totalIndex: totalMatches - 1,
          snippet: `...${markedSnippet}...`
        });
        pageMatchCount++;
      }
    }

    updateSearchCounts();

    if (totalMatches === 0) {
      if (dom.searchResultsList) {
        dom.searchResultsList.innerHTML = `<p style="font-size:12px; color:var(--text-faint); padding:8px;">Aucune occurrence trouvée pour « ${escapeHTML(state.searchQuery)} ».</p>`;
      }
      return;
    }

    if (dom.searchResultsList) {
      state.searchResults.forEach((res, idx) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.index = idx;
        item.innerHTML = `
          <div class="search-result-page">Page ${res.page} · Résultat #${idx + 1}</div>
          <div class="search-result-snippet">${res.snippet}</div>
        `;
        item.addEventListener('click', () => {
          selectSearchResult(idx);
          if (window.innerWidth <= 900) toggleSidebar(false);
        });
        dom.searchResultsList.appendChild(item);
      });
    }

    if (state.searchResults.length > 0) {
      selectSearchResult(0);
    }
  }

  function selectSearchResult(idx) {
    if (idx < 0 || idx >= state.searchResults.length) return;
    state.currentSearchIndex = idx;
    const target = state.searchResults[idx];

    // Mettre à jour l'élément actif dans la liste du volet
    if (dom.searchResultsList) {
      const items = dom.searchResultsList.querySelectorAll('.search-result-item');
      items.forEach((it, i) => it.classList.toggle('active', i === idx));
    }

    updateSearchCounts();

    // Défiler vers la page et surligner
    scrollToPage(target.page);

    // Attendre le rendu de la page puis surligner l'occurrence active
    setTimeout(() => {
      highlightMatchesOnPage(target.page, state.searchQuery, target.matchIndexInPage);
    }, 120);
  }

  function navigateSearch(direction) {
    if (state.searchResults.length === 0) {
      if (state.searchQuery) performSearch(state.searchQuery);
      return;
    }
    let nextIdx = state.currentSearchIndex + direction;
    if (nextIdx < 0) nextIdx = state.searchResults.length - 1;
    if (nextIdx >= state.searchResults.length) nextIdx = 0;

    selectSearchResult(nextIdx);
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
      { btn: dom.tabHighlights, pane: dom.paneHighlights, name: 'highlights' },
      { btn: dom.tabSearch, pane: dom.paneSearch, name: 'search' },
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

    if (tabName === 'highlights') {
      renderHighlightsSidebarList();
    } else if (tabName === 'search' && dom.inputSearch) {
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

  function normalizeTextString(str) {
    if (!str) return '';
    let s = str.replace(/\u00A0/g, ' ');
    // Fusionner les lettres capitales artificiellement espacées dans les titres (ex: "M É M O I R E" -> "MÉMOIRE", "S N A P" -> "SNAP")
    s = s.replace(/(?<=[\p{Lu}]) (?=[\p{Lu}](?: |$))/gu, '');
    s = s.replace(/[ \t]+/g, ' ');
    // Normaliser les unités métriques et indices (km 2 -> km², m 2 -> m²)
    s = s.replace(/\b(km|m|cm|mm)\s*2\b/gi, '$1²').replace(/\b(km|m|cm|mm)\s*3\b/gi, '$1³');
    return s;
  }

  function finalizeParagraph(para, pw, ph) {
    const lines = para.lines;
    const firstLine = lines[0];
    const lastLine = lines[lines.length - 1];
    const left = Math.min(...lines.map(l => l.left));
    const right = Math.max(...lines.map(l => l.right));
    const top = firstLine.top;
    const bottom = lastLine.bottom;
    const width = Math.max(10, right - left);
    const height = Math.max(12, bottom - top);

    // Reconnecter les césures de fin de ligne : "environne-" + "ment" -> "environnement"
    let fullText = '';
    for (let i = 0; i < lines.length; i++) {
      const cur = lines[i].text;
      if (i > 0) {
        const prev = lines[i - 1].text;
        if (/(\p{L}+)-\s*$/u.test(prev) && /^\s*(\p{Ll}+)/u.test(cur)) {
          fullText = fullText.replace(/-$/, '') + cur;
          continue;
        } else {
          fullText += ' ';
        }
      }
      fullText += cur;
    }
    fullText = fullText.trim();

    const isSerif = lines.some(l => l.isSerif);
    const isBold = lines.some(l => l.isBold);
    const avgFontSize = lines.reduce((acc, l) => acc + l.fontSize, 0) / lines.length;
    const isNumeric = para.isNumeric || /^\s*\d+([\.,]\d+)?\s*$/.test(fullText) || /^\s*Page\s+\d+(\s*\/\s*\d+)?\s*$/i.test(fullText);

    return {
      text: fullText,
      translatedText: isNumeric ? fullText : '',
      isNumeric,
      leftPct: Math.max(0, (left / pw) * 100),
      topPct: Math.max(0, (top / ph) * 100),
      widthPct: Math.min(100, Math.max(2, (width / pw) * 100)),
      heightPct: Math.max(1, (height / ph) * 100),
      baseFontSize: Math.max(8, Math.min(32, Math.round(avgFontSize * 10) / 10)),
      fontFamily: isSerif ? 'Georgia, "Times New Roman", "Liberation Serif", serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeight: isBold ? '700' : '400',
      lineCount: lines.length
    };
  }

  async function extractStructuredPageBlocks(page) {
    const vp = page.getViewport({ scale: 1 });
    const pw = vp.width;
    const ph = vp.height;
    const textContent = await page.getTextContent();
    const rawItems = (textContent.items || []).filter(it => it.str && it.str.trim());
    if (rawItems.length === 0) {
      return [];
    }

    // 1. Extraire les coordonnées et typographies de chaque segment
    const items = rawItems.map(it => {
      const tx = it.transform[4];
      const ty = it.transform[5];
      const fs = Math.hypot(it.transform[0], it.transform[1]) || 11;
      const w = it.width || (it.str.length * fs * 0.55);
      const h = it.height || fs;
      const top = ph - ty - (fs * 0.85);
      const str = normalizeTextString(it.str);
      const fontName = (it.fontName || '').toLowerCase();
      const isSerif = fontName.includes('times') || fontName.includes('serif') || fontName.includes('georgia') || fontName.includes('minion') || fontName.includes('cambria') || !fontName.includes('sans');
      const isBold = fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy') || fontName.includes('b1') || fontName.includes('b2');

      return {
        str,
        x: tx,
        top,
        baseline: ty,
        width: w,
        height: h,
        fontSize: fs,
        fontName,
        isSerif,
        isBold
      };
    }).filter(it => it.str.length > 0);

    // 2. Regrouper par lignes géométriques horizontales (tolérance 3.5px sur la ligne de base)
    const lineTolerance = 3.5;
    const rawLines = [];
    items.forEach(it => {
      let foundLine = null;
      for (const line of rawLines) {
        if (Math.abs(line.baseline - it.baseline) <= lineTolerance) {
          foundLine = line;
          break;
        }
      }
      if (foundLine) {
        foundLine.items.push(it);
        foundLine.minY = Math.min(foundLine.minY, it.top);
        foundLine.maxY = Math.max(foundLine.maxY, it.top + it.height);
        foundLine.baseline = (foundLine.baseline + it.baseline) / 2;
      } else {
        rawLines.push({
          baseline: it.baseline,
          minY: it.top,
          maxY: it.top + it.height,
          items: [it]
        });
      }
    });

    // Trier les lignes par position verticale réelle (du haut vers le bas)
    rawLines.sort((a, b) => a.minY - b.minY);

    // 3. Pour chaque ligne, trier les fragments de gauche à droite
    const structuredLines = rawLines.map(l => {
      l.items.sort((a, b) => a.x - b.x);
      const first = l.items[0];
      const last = l.items[l.items.length - 1];
      const left = first.x;
      const right = last.x + last.width;
      const width = Math.max(1, right - left);
      const fontSize = l.items.reduce((acc, it) => acc + it.fontSize, 0) / l.items.length;
      const isBold = l.items.some(it => it.isBold);
      const isSerif = l.items.some(it => it.isSerif);

      let text = '';
      for (let i = 0; i < l.items.length; i++) {
        const cur = l.items[i];
        if (i > 0) {
          const prev = l.items[i - 1];
          const gap = cur.x - (prev.x + prev.width);
          if (gap > 2) text += ' ';
        }
        text += cur.str;
      }
      text = text.trim();

      return {
        text,
        left,
        right,
        width,
        top: l.minY,
        bottom: l.maxY,
        fontSize,
        isBold,
        isSerif
      };
    }).filter(l => l.text.length > 0);

    // 4. Fusionner les lignes adjacentes en paragraphes cohérents
    const paragraphs = [];
    let curPara = null;

    for (let i = 0; i < structuredLines.length; i++) {
      const line = structuredLines[i];
      const isPureNumber = /^\s*\d+([\.,]\d+)?\s*$/.test(line.text);
      const isPageFooter = (line.top / ph > 0.88) && (isPureNumber || /^\s*Page\s+\d+(\s*\/\s*\d+)?\s*$/i.test(line.text));
      const isPageHeader = (line.top / ph < 0.08) && line.width < (pw * 0.5);

      // Si c'est un pied de page, en-tête ou numéro isolé : ne pas mélanger aux paragraphes
      if (isPageFooter || isPageHeader || isPureNumber) {
        if (curPara) {
          paragraphs.push(finalizeParagraph(curPara, pw, ph));
          curPara = null;
        }
        paragraphs.push(finalizeParagraph({
          lines: [line],
          isIsolated: true,
          isNumeric: isPureNumber || isPageFooter
        }, pw, ph));
        continue;
      }

      if (!curPara) {
        curPara = { lines: [line] };
        continue;
      }

      const prevLine = curPara.lines[curPara.lines.length - 1];
      const verticalGap = line.top - prevLine.bottom;
      const leftDiff = Math.abs(line.left - prevLine.left);
      const sizeDiff = Math.abs(line.fontSize - prevLine.fontSize);
      const prevEndsSentence = /[.!?:]\s*$/.test(prevLine.text);
      const prevIsShort = prevLine.width < (pw * 0.45);

      const canMerge = (
        verticalGap <= Math.max(12, prevLine.fontSize * 0.95) &&
        leftDiff <= 28 &&
        sizeDiff <= 2.5 &&
        !(prevEndsSentence && prevIsShort)
      );

      if (canMerge) {
        curPara.lines.push(line);
      } else {
        paragraphs.push(finalizeParagraph(curPara, pw, ph));
        curPara = { lines: [line] };
      }
    }
    if (curPara) {
      paragraphs.push(finalizeParagraph(curPara, pw, ph));
    }

    return paragraphs;
  }

  async function requestRobustTranslation(text, targetLang) {
    if (!text || !text.trim()) return text;
    const cleanText = text.trim();

    // 1. Appel principal : Google Translate GTX
    try {
      const c1 = new AbortController();
      const t1 = setTimeout(() => c1.abort(), 3500);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(cleanText)}`;
      const res = await fetch(url, { signal: c1.signal });
      clearTimeout(t1);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data[0])) {
          const trans = data[0].map(s => s[0]).join('');
          if (trans && trans.trim()) return trans;
        }
      }
    } catch (_) {}

    // 2. Secours alternatif : Google Translate TE
    try {
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 3500);
      const url2 = `https://translate.googleapis.com/translate_a/t?client=te&format=html&v=1.0&sl=auto&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(cleanText)}`;
      const res2 = await fetch(url2, { signal: c2.signal });
      clearTimeout(t2);
      if (res2.ok) {
        const data2 = await res2.json();
        if (typeof data2 === 'string' && data2.trim()) return data2;
        if (Array.isArray(data2) && data2[0] && typeof data2[0] === 'string') return data2[0];
      }
    } catch (_) {}

    // 3. Secours automatique vers notre fonction serveur (/api/groq-chat) (Garantie 0 blocage)
    try {
      const c3 = new AbortController();
      const t3 = setTimeout(() => c3.abort(), 5500);
      const res3 = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          targetLang: targetLang,
          text: cleanText
        }),
        signal: c3.signal
      });
      clearTimeout(t3);
      if (res3.ok) {
        const json3 = await res3.json();
        const t3 = json3?.translatedText || json3?.answer;
        if (t3 && t3.trim()) return t3.trim();
      }
    } catch (_) {}

    return cleanText;
  }

  async function translateCurrentPage(targetLang = 'en') {
    if (!state.pdfDoc) {
      showToast("Document non chargé", true);
      return;
    }
    const pageNum = state.currentPage || 1;
    if (dom.translationPageBadge) dom.translationPageBadge.textContent = `Page ${pageNum}`;
    if (dom.translationStatus) {
      dom.translationStatus.innerHTML = `<span style="color:var(--brand-primary, #0d652d);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Extraction du texte et traduction...</span>`;
    }
    if (dom.translationOutput) dom.translationOutput.textContent = "Extraction et traduction du texte en cours...";

    try {
      const cacheKey = `${pageNum}_${targetLang}`;
      let pageData = state.translatedPagesCache.get(cacheKey);

      if (!pageData) {
        const page = await state.pdfDoc.getPage(pageNum);
        const paragraphs = await extractStructuredPageBlocks(page);

        if (paragraphs.length === 0) {
          if (dom.translationStatus) dom.translationStatus.textContent = "Aucun texte extractible sur cette page.";
          if (dom.translationOutput) dom.translationOutput.textContent = "Cette page ne contient pas de texte vectoriel indexé (ou est un scan d'image pur).";
          return;
        }

        const toTranslate = paragraphs.filter(b => !b.isNumeric && b.text.trim().length > 0);
        await Promise.all(toTranslate.map(async (block) => {
          block.translatedText = await requestRobustTranslation(block.text, targetLang);
        }));

        paragraphs.forEach(b => {
          if (!b.translatedText) b.translatedText = b.text;
        });

        pageData = {
          flatBlocks: paragraphs,
          fluidParagraphs: paragraphs.map(b => b.translatedText || b.text).filter(Boolean)
        };
        state.translatedPagesCache.set(cacheKey, pageData);
      }

      const resultText = pageData.fluidParagraphs.join('\n\n');
      if (dom.translationOutput) dom.translationOutput.textContent = resultText;
      if (dom.translationStatus) {
        dom.translationStatus.textContent = '';
        const statusSpan = document.createElement('span');
        statusSpan.style.cssText = 'color:#059669; font-weight:600;';
        statusSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        const statusText = document.createTextNode(`Traduction de la page ${pageNum} prête (${targetLang.toUpperCase()})`);
        statusSpan.appendChild(statusText);
        dom.translationStatus.appendChild(statusSpan);
      }
    } catch (err) {
      if (dom.translationStatus) dom.translationStatus.textContent = "Erreur lors de la traduction.";
      if (dom.translationOutput) dom.translationOutput.textContent = "Impossible d'extraire ou de traduire cette page automatiquement.";
    }
  }

  function createTranslationToolbarElement(pageNum, totalPages, targetLang, isOverlay, onLayoutToggle, onToggleOriginal) {
    const toolbar = document.createElement('div');
    toolbar.className = 'translation-layer-toolbar';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'translation-layer-title';
    titleSpan.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>';
    const titleText = document.createTextNode(`Page ${pageNum} / ${totalPages} · Traduit (${targetLang.toUpperCase()})`);
    titleSpan.appendChild(titleText);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'translation-layer-actions';

    if (typeof onLayoutToggle === 'function') {
      const layoutBtn = document.createElement('button');
      layoutBtn.type = 'button';
      layoutBtn.className = 'btn-layout-toggle';
      layoutBtn.title = 'Basculer entre la superposition exacte et le mode texte continu';
      layoutBtn.textContent = isOverlay ? 'Mode texte continu' : 'Superposition exacte';
      layoutBtn.addEventListener('click', onLayoutToggle);
      actionsDiv.appendChild(layoutBtn);
    }

    const origBtn = document.createElement('button');
    origBtn.type = 'button';
    origBtn.className = 'btn-toggle-original-btn';
    origBtn.title = 'Afficher la page originale en français';
    origBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
    const origSpan = document.createElement('span');
    origSpan.textContent = 'Voir original (FR)';
    origBtn.appendChild(origSpan);
    origBtn.addEventListener('click', onToggleOriginal);
    actionsDiv.appendChild(origBtn);

    toolbar.appendChild(titleSpan);
    toolbar.appendChild(actionsDiv);
    return toolbar;
  }

  function renderTranslatedPageContent(layer, pageData, pageNum, targetLang) {
    const isOverlay = (state.translationLayout === 'overlay');
    layer.className = `translation-layer ${isOverlay ? 'layout-overlay' : 'layout-fluid'}`;
    layer.style.setProperty('--scale-factor', state.zoomScale || 1);
    
    const canvas = document.getElementById(`canvas-page-${pageNum}`);
    if (canvas) {
      canvas.style.display = isOverlay ? 'block' : 'none';
    }

    layer.textContent = '';

    const handleOriginalToggle = () => {
      const c = document.getElementById(`canvas-page-${pageNum}`);
      const textLayer = document.getElementById(`text-layer-${pageNum}`);
      const restoreBtn = document.getElementById(`btn-restore-trans-${pageNum}`);
      layer.style.display = 'none';
      if (c) c.style.display = 'block';
      if (textLayer) textLayer.style.display = 'block';
      if (restoreBtn) restoreBtn.style.display = 'inline-flex';
    };

    const handleLayoutToggle = () => {
      state.translationLayout = (state.translationLayout === 'overlay') ? 'fluid' : 'overlay';
      for (let i = 1; i <= state.totalPages; i++) {
        const l = document.getElementById(`translation-layer-${i}`);
        const c = document.getElementById(`canvas-page-${i}`);
        const cached = state.translatedPagesCache.get(`${i}_${targetLang}`);
        if (l && cached && l.style.display !== 'none') {
          renderTranslatedPageContent(l, cached, i, targetLang);
        } else if (c && state.translationMode) {
          c.style.display = (state.translationLayout === 'overlay') ? 'block' : 'none';
        }
      }
    };

    if (!pageData.flatBlocks || pageData.flatBlocks.length === 0) {
      const emptyToolbar = document.createElement('div');
      emptyToolbar.className = 'translation-layer-toolbar';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'translation-layer-title';
      titleSpan.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>';
      const emptyTitleText = document.createTextNode(`Page ${pageNum} / ${state.totalPages} · Aucun texte détecté`);
      titleSpan.appendChild(emptyTitleText);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'translation-layer-actions';
      const origBtn = document.createElement('button');
      origBtn.type = 'button';
      origBtn.className = 'btn-toggle-original-btn';
      origBtn.title = 'Afficher la page originale en français';
      origBtn.textContent = 'Voir original (FR)';
      origBtn.addEventListener('click', handleOriginalToggle);
      actionsDiv.appendChild(origBtn);

      emptyToolbar.appendChild(titleSpan);
      emptyToolbar.appendChild(actionsDiv);

      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'translation-layer-p';
      emptyMsg.style.cssText = 'color:#6b7280; font-style:italic; margin-top:50px; text-align:center;';
      emptyMsg.textContent = 'Cette page ne contient pas de texte vectoriel extractible (illustration ou scan graphique).';

      layer.appendChild(emptyToolbar);
      layer.appendChild(emptyMsg);
      return;
    }

    const toolbar = createTranslationToolbarElement(
      pageNum,
      state.totalPages,
      targetLang,
      isOverlay,
      handleLayoutToggle,
      handleOriginalToggle
    );
    layer.appendChild(toolbar);

    if (isOverlay) {
      pageData.flatBlocks.forEach(b => {
        const text = String(b.translatedText || b.text || '');
        const textAlign = b.isNumeric ? 'center' : 'inherit';
        const blockDiv = document.createElement('div');
        blockDiv.className = b.isNumeric ? 'translated-block is-numeric' : 'translated-block';
        blockDiv.style.cssText = `top:${b.topPct.toFixed(3)}%; left:${b.leftPct.toFixed(3)}%; width:${b.widthPct.toFixed(3)}%; font-size:calc(${b.baseFontSize}px * var(--scale-factor, 1)); font-family:${b.fontFamily}; font-weight:${b.fontWeight}; text-align:${textAlign};`;
        blockDiv.textContent = text;
        layer.appendChild(blockDiv);
      });
    } else {
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'translation-layer-body';
      bodyDiv.style.marginTop = '36px';

      pageData.fluidParagraphs.forEach(p => {
        const pElem = document.createElement('p');
        pElem.className = 'translation-layer-p';
        const lines = String(p).split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed) {
            pElem.appendChild(document.createTextNode(trimmed));
            if (idx < lines.length - 1) {
              pElem.appendChild(document.createElement('br'));
            }
          }
        });
        bodyDiv.appendChild(pElem);
      });
      layer.appendChild(bodyDiv);
    }
  }

  async function applyTranslationToPage(pageNum, targetLang = 'en') {
    const layer = document.getElementById(`translation-layer-${pageNum}`);
    const canvas = document.getElementById(`canvas-page-${pageNum}`);
    const textLayer = document.getElementById(`text-layer-${pageNum}`);
    const restoreBtn = document.getElementById(`btn-restore-trans-${pageNum}`);
    if (!layer) return;

    if (state.translationLayout === 'overlay') {
      if (canvas) canvas.style.display = 'block';
    } else {
      if (canvas) canvas.style.display = 'none';
    }
    if (textLayer) textLayer.style.display = 'none';
    if (restoreBtn) restoreBtn.style.display = 'none';
    layer.style.display = 'block';

    const cacheKey = `${pageNum}_${targetLang}`;
    if (state.translatedPagesCache.has(cacheKey)) {
      const pageData = state.translatedPagesCache.get(cacheKey);
      renderTranslatedPageContent(layer, pageData, pageNum, targetLang);
      return;
    }

    layer.className = 'translation-layer layout-overlay';
    layer.textContent = '';

    const loadingToolbar = document.createElement('div');
    loadingToolbar.className = 'translation-layer-toolbar';
    const loadingTitle = document.createElement('span');
    loadingTitle.className = 'translation-layer-title';
    loadingTitle.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>';
    const loadingTitleText = document.createTextNode(`Page ${pageNum} / ${state.totalPages} · Traduction en cours...`);
    loadingTitle.appendChild(loadingTitleText);
    loadingToolbar.appendChild(loadingTitle);

    const spinnerBox = document.createElement('div');
    spinnerBox.style.cssText = 'display:flex; align-items:center; justify-content:center; padding:48px 20px; color:#064e3b; gap:12px; font-weight:600; background:rgba(255,255,255,0.92); border-radius:8px; margin:40px 20px;';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.cssText = 'width:22px; height:22px; border-width:2.5px;';
    const spinnerText = document.createElement('span');
    spinnerText.textContent = 'Traduction haute fidélité en cours...';
    spinnerBox.appendChild(spinner);
    spinnerBox.appendChild(spinnerText);

    layer.appendChild(loadingToolbar);
    layer.appendChild(spinnerBox);

    try {
      const page = await state.pdfDoc.getPage(pageNum);
      const paragraphs = await extractStructuredPageBlocks(page);

      if (paragraphs.length === 0) {
        const pageData = { flatBlocks: [], fluidParagraphs: [] };
        state.translatedPagesCache.set(cacheKey, pageData);
        renderTranslatedPageContent(layer, pageData, pageNum, targetLang);
        return;
      }

      // Filtrer les blocs nécessitant une traduction (ignorer numéros purs et codes)
      const toTranslate = paragraphs.filter(b => !b.isNumeric && b.text.trim().length > 0);

      // Traduction parallèle directe avec secours automatique serveur
      await Promise.all(toTranslate.map(async (block) => {
        block.translatedText = await requestRobustTranslation(block.text, targetLang);
      }));

      // Les blocs numériques conservent leur texte original
      paragraphs.forEach(b => {
        if (!b.translatedText) b.translatedText = b.text;
      });

      const fluidParagraphs = paragraphs.map(b => b.translatedText || b.text).filter(Boolean);

      const pageData = {
        flatBlocks: paragraphs,
        fluidParagraphs
      };

      state.translatedPagesCache.set(cacheKey, pageData);
      renderTranslatedPageContent(layer, pageData, pageNum, targetLang);
    } catch (e) {
      layer.textContent = '';

      const errToolbar = document.createElement('div');
      errToolbar.className = 'translation-layer-toolbar';
      const errTitle = document.createElement('span');
      errTitle.className = 'translation-layer-title';
      errTitle.textContent = `Page ${pageNum} / ${state.totalPages} · Erreur`;
      errToolbar.appendChild(errTitle);

      const errActions = document.createElement('div');
      errActions.className = 'translation-layer-actions';
      const errOrigBtn = document.createElement('button');
      errOrigBtn.type = 'button';
      errOrigBtn.className = 'btn-toggle-original-btn';
      errOrigBtn.textContent = 'Voir original (FR)';
      errOrigBtn.addEventListener('click', () => {
        const canvas = document.getElementById(`canvas-page-${pageNum}`);
        const textLayer = document.getElementById(`text-layer-${pageNum}`);
        const restoreBtn = document.getElementById(`btn-restore-trans-${pageNum}`);
        layer.style.display = 'none';
        if (canvas) canvas.style.display = 'block';
        if (textLayer) textLayer.style.display = 'block';
        if (restoreBtn) restoreBtn.style.display = 'inline-flex';
      });
      errActions.appendChild(errOrigBtn);
      errToolbar.appendChild(errActions);

      const errMsg = document.createElement('p');
      errMsg.className = 'translation-layer-p';
      errMsg.style.cssText = 'color:#dc2626; margin-top:50px; text-align:center;';
      errMsg.textContent = 'Impossible de traduire automatiquement cette page.';

      layer.appendChild(errToolbar);
      layer.appendChild(errMsg);
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

  // =========================================================================
  // BOUCLIER DE CONFIDENTIALITÉ & ANTI-CAPTURE (MODE TRADUCTION UNIQUEMENT)
  // Même style de floutage et bouclier de sécurité que l'assistant Chat IA
  // =========================================================================

  let translationAnticaptureTimer = null;

  function triggerTranslationAnticapture(reason) {
    if (!state.translationMode) return;

    // 1. Appliquer le floutage haute intensité sur toutes les couches de traduction
    const translationLayers = document.querySelectorAll('.translation-layer');
    translationLayers.forEach(layer => {
      layer.classList.add('anticapture-blurred');
    });

    // 2. Vider le presse-papiers si capture ou devtools tenté
    if ((reason === 'screenshot' || reason === 'devtools') && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        navigator.clipboard.writeText('');
      } catch (_) {}
    }

    // 3. Afficher la carte bouclier anticapture au centre du visualiseur
    let shield = document.getElementById('translation-shield-overlay');
    if (!shield) {
      shield = document.createElement('div');
      shield.id = 'translation-shield-overlay';
      shield.className = 'anticapture-shield-card';

      const badge = document.createElement('div');
      badge.className = 'anticapture-shield-badge';
      badge.textContent = 'Protection active contre la capture';

      const title = document.createElement('div');
      title.className = 'anticapture-shield-title';
      title.textContent = 'Traduction documentaire masquée temporairement';

      const p = document.createElement('p');
      p.className = 'anticapture-shield-text';
      p.textContent = "La traduction automatique en direct est un outil d'assistance non officiel. Pour préserver l'authenticité probatoire du dossier SEM-26-003, les captures d'écran, l'inspection F12 et le téléchargement des traductions sont restreints.";

      const hint = document.createElement('div');
      hint.className = 'anticapture-shield-hint';
      hint.textContent = 'Cliquez ou revenez sur la page pour réafficher la traduction';

      shield.appendChild(badge);
      shield.appendChild(title);
      shield.appendChild(p);
      shield.appendChild(hint);

      shield.addEventListener('click', () => {
        clearTranslationAnticapture();
      });
      document.body.appendChild(shield);
    }
    shield.style.display = 'block';

    // 4. Toast informatif
    if (reason === 'screenshot') {
      showToast("Protection anti-capture : capture d'écran interdite sur la traduction", true);
    } else if (reason === 'devtools') {
      showToast("Inspection (F12) désactivée sur la traduction documentaire", true);
    }

    if (translationAnticaptureTimer) {
      clearTimeout(translationAnticaptureTimer);
      translationAnticaptureTimer = null;
    }

    // Réactivation automatique après 3s pour un événement ponctuel (raccourci)
    if (reason === 'screenshot' || reason === 'devtools') {
      translationAnticaptureTimer = setTimeout(() => {
        clearTranslationAnticapture();
      }, 3000);
    }
  }

  function clearTranslationAnticapture() {
    if (translationAnticaptureTimer) {
      clearTimeout(translationAnticaptureTimer);
      translationAnticaptureTimer = null;
    }
    const shield = document.getElementById('translation-shield-overlay');
    if (shield) shield.style.display = 'none';

    document.querySelectorAll('.translation-layer').forEach(layer => {
      layer.classList.remove('anticapture-blurred');
    });
  }

  function setupTranslationAnticaptureListeners() {
    // 1. Interception de la perte de focus de la fenêtre (uniquement en mode traduction)
    window.addEventListener('blur', () => {
      if (state.translationMode) {
        triggerTranslationAnticapture('blur');
      }
    });

    window.addEventListener('focus', () => {
      if (state.translationMode) {
        clearTranslationAnticapture();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (state.translationMode) {
        if (document.hidden) {
          triggerTranslationAnticapture('blur');
        } else {
          clearTranslationAnticapture();
        }
      }
    });

    // 2. Blocage des raccourcis F12, DevTools et Capture d'écran (uniquement en mode traduction)
    window.addEventListener('keydown', (e) => {
      if (!state.translationMode) return; // En français : libre et sans restriction

      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerTranslationAnticapture('devtools');
        return;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Cmd+Option+I, Cmd+Option+J, Cmd+Option+C
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const isInspectKey = ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key);
      if (isCmdOrCtrl && (e.shiftKey || e.altKey) && isInspectKey) {
        e.preventDefault();
        e.stopPropagation();
        triggerTranslationAnticapture('devtools');
        return;
      }

      // Ctrl+U (code source)
      if (isCmdOrCtrl && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        triggerTranslationAnticapture('devtools');
        return;
      }

      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        triggerTranslationAnticapture('screenshot');
        return;
      }

      // Raccourcis capture d'écran macOS (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5) et Windows (Win+Shift+S)
      if (isCmdOrCtrl && e.shiftKey && ['3', '4', '5', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerTranslationAnticapture('screenshot');
        return;
      }
    }, true);

    // 3. Gestion du copier-coller :
    // - Pas de copier-coller pour la traduction imbriquée (overlay)
    // - Texte suivi (fluid) OK
    // - Document original français OK
    document.addEventListener('copy', (e) => {
      if (!state.translationMode) return; // Document français : copie autorisée

      if (state.translationLayout === 'overlay') {
        e.preventDefault();
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', '');
        }
        showToast("Copie interdite sur la traduction superposée · Basculez en mode texte continu pour copier");
      }
    });

    document.addEventListener('cut', (e) => {
      if (!state.translationMode) return;
      if (state.translationLayout === 'overlay') {
        e.preventDefault();
      }
    });

    document.addEventListener('contextmenu', (e) => {
      if (!state.translationMode) return;
      if (state.translationLayout === 'overlay') {
        const target = e.target;
        if (target && target.closest('.translation-layer.layout-overlay')) {
          e.preventDefault();
          showToast("Menu contextuel restreint sur la traduction superposée");
        }
      }
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

    if (dom.btnDownload) {
      if (state.translationMode) {
        dom.btnDownload.title = "Téléchargement désactivé en mode traduction (disponible sur l'original FR)";
        dom.btnDownload.classList.add('translation-active');
      } else {
        dom.btnDownload.title = "Télécharger le document PDF";
        dom.btnDownload.classList.remove('translation-active');
      }
    }

    if (dom.btnPrint) {
      if (state.translationMode) {
        dom.btnPrint.title = "Impression désactivée en mode traduction (disponible sur l'original FR)";
        dom.btnPrint.classList.add('translation-active');
      } else {
        dom.btnPrint.title = "Imprimer le document";
        dom.btnPrint.classList.remove('translation-active');
      }
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
      clearTranslationAnticapture();
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
    // Initialisation du bouclier anticapture (actif uniquement en mode traduction)
    setupTranslationAnticaptureListeners();

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
          updateNativeViewerLink();
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
    if (dom.tabHighlights) dom.tabHighlights.addEventListener('click', () => switchSidebarTab('highlights'));
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
      const targetPath = ALLOWED_LOCAL_DOCS.has(rawSafe) ? rawSafe : filePath;
      const safeFile = validateDownloadUrl(targetPath) || DOCS_CATALOG['decision-17-aout-2026'].file;
      const downloadName = formatDocumentFileName(safeFile);
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
      dom.btnDownload.addEventListener('click', (e) => {
        if (state.translationMode) {
          e.preventDefault();
          e.stopPropagation();
          showToast("Téléchargement désactivé en mode traduction · Revenez au document original en français pour télécharger la pièce officielle certifiée", true);
          return;
        }
        if (isAuthorSubmission(state.currentFile)) {
          openLicenseDialog('download');
        } else {
          triggerDirectDownload(state.currentFile);
        }
      });
    }

    // Impression Haute Fidélité
    if (dom.btnPrint) {
      dom.btnPrint.addEventListener('click', (e) => {
        if (state.translationMode) {
          e.preventDefault();
          e.stopPropagation();
          showToast("L'impression est désactivée sur la traduction automatique · Disponible sur le document original en français", true);
          return;
        }
        printDocument();
      });
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
        if (state.translationMode) {
          showToast("Téléchargement désactivé en mode traduction · Revenez au document original en français pour télécharger la pièce officielle certifiée", true);
          return;
        }
        const docInfo = resolveDocInfo(state.currentFile);

        if (dom.licenseCheckbox && !dom.licenseCheckbox.checked) {
          const warnMsg = docInfo.isOriginalWork
            ? "Veuillez accepter la licence CC BY-NC-ND 4.0 pour continuer."
            : "Veuillez accepter la notice de diffusion pour continuer.";
          showToast(warnMsg, true);
          return;
        }

        const rawSafe = getSafeDocUrl(state.currentFile);
        const targetPath = ALLOWED_LOCAL_DOCS.has(rawSafe) ? rawSafe : state.currentFile;
        const safeFile = validateDownloadUrl(targetPath) || DOCS_CATALOG['decision-17-aout-2026'].file;
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

    // Commutateur instantané vers le moteur EmbedPDF (annotations et lecture rapide)
    if (dom.btnSwitchEmbedpdf) {
      dom.btnSwitchEmbedpdf.addEventListener('click', (e) => {
        e.preventDefault();
        const currentFile = state.targetFile || 'assets/docs/observations-reponse-canada-sem26003.pdf';
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        window.location.href = `viewer.html?file=${encodeURIComponent(currentFile)}&theme=${encodeURIComponent(currentTheme)}`;
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

    // Recherche in-document (Bouton d'en-tête, Findbar flottante et Volet latéral)
    if (dom.btnSearchToggle) {
      dom.btnSearchToggle.addEventListener('click', () => toggleFindbar());
    }
    if (dom.mobileBtnSearch) {
      dom.mobileBtnSearch.addEventListener('click', () => toggleFindbar());
    }

    if (dom.findbarInput) {
      let debounceTimer = null;
      dom.findbarInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          performSearch(dom.findbarInput.value);
        }, 180);
      });
      dom.findbarInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) navigateSearch(-1);
          else navigateSearch(1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeFindbar();
        }
      });
    }

    if (dom.findbarBtnPrev) dom.findbarBtnPrev.addEventListener('click', () => navigateSearch(-1));
    if (dom.findbarBtnNext) dom.findbarBtnNext.addEventListener('click', () => navigateSearch(1));
    if (dom.findbarBtnClose) dom.findbarBtnClose.addEventListener('click', () => closeFindbar());

    if (dom.findbarBtnCase) {
      dom.findbarBtnCase.addEventListener('click', () => {
        state.matchCase = !state.matchCase;
        dom.findbarBtnCase.classList.toggle('active', state.matchCase);
        if (dom.checkMatchCase) dom.checkMatchCase.checked = state.matchCase;
        if (state.searchQuery) performSearch(state.searchQuery);
      });
    }

    if (dom.findbarBtnWord) {
      dom.findbarBtnWord.addEventListener('click', () => {
        state.matchWord = !state.matchWord;
        dom.findbarBtnWord.classList.toggle('active', state.matchWord);
        if (dom.checkMatchWord) dom.checkMatchWord.checked = state.matchWord;
        if (state.searchQuery) performSearch(state.searchQuery);
      });
    }

    if (dom.findbarBtnSidebar) {
      dom.findbarBtnSidebar.addEventListener('click', () => {
        switchSidebarTab('search');
      });
    }

    if (dom.checkMatchCase) {
      dom.checkMatchCase.addEventListener('change', () => {
        state.matchCase = dom.checkMatchCase.checked;
        if (dom.findbarBtnCase) dom.findbarBtnCase.classList.toggle('active', state.matchCase);
        if (state.searchQuery) performSearch(state.searchQuery);
      });
    }

    if (dom.checkMatchWord) {
      dom.checkMatchWord.addEventListener('change', () => {
        state.matchWord = dom.checkMatchWord.checked;
        if (dom.findbarBtnWord) dom.findbarBtnWord.classList.toggle('active', state.matchWord);
        if (state.searchQuery) performSearch(state.searchQuery);
      });
    }

    if (dom.inputSearch) {
      let debounceTimer = null;
      dom.inputSearch.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          performSearch(dom.inputSearch.value);
        }, 200);
      });
      dom.inputSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) navigateSearch(-1);
          else navigateSearch(1);
        } else if (e.key === 'Escape') {
          dom.inputSearch.blur();
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

    // Événements du mode comparatif (Split-screen 2 PDF)
    if (dom.btnSplitToggle) {
      dom.btnSplitToggle.addEventListener('click', () => toggleSplitMode());
    }
    if (dom.btnNativeToggle) {
      dom.btnNativeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        openNativeViewer();
      });
    }
    if (dom.btnSplitClose) {
      dom.btnSplitClose.addEventListener('click', () => toggleSplitMode(false));
    }
    if (dom.btnSplitPrev) {
      dom.btnSplitPrev.addEventListener('click', () => scrollSplitPage(state.splitCurrentPage - 1));
    }
    if (dom.btnSplitNext) {
      dom.btnSplitNext.addEventListener('click', () => scrollSplitPage(state.splitCurrentPage + 1));
    }
    if (dom.splitDocSelect) {
      dom.splitDocSelect.addEventListener('change', () => {
        const val = dom.splitDocSelect.value;
        if (DOCS_CATALOG[val]) {
          state.splitDocKey = val;
          loadSplitPDF(DOCS_CATALOG[val].file, 1);
        }
      });
    }

    // Événements de surlignage utilisateur (User Highlights)
    if (dom.viewport) {
      dom.viewport.addEventListener('mouseup', handleTextSelection);
      dom.viewport.addEventListener('keyup', handleTextSelection);
    }
    document.addEventListener('selectionchange', debounce(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        hideSelectionTooltip();
      }
    }, 200));

    // Clic sur les pastilles de couleur de la bulle de surlignage
    if (dom.selectionTooltip) {
      dom.selectionTooltip.querySelectorAll('.hl-color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const color = btn.dataset.color || 'yellow';
          applyUserHighlight(color);
        });
      });
    }

    if (dom.btnCopySelection) {
      dom.btnCopySelection.addEventListener('click', (e) => {
        e.stopPropagation();
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (text && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            showToast("Texte copié !");
            hideSelectionTooltip();
          });
        }
      });
    }
  }

  /**
   * Gestionnaire de raccourcis clavier
   */
  function handleGlobalKeydown(e) {
    // 1. Raccourci natif universel Ctrl+F (Windows/Linux) / Cmd+F (Mac)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F' || e.keyCode === 70)) {
      e.preventDefault();
      e.stopPropagation();
      openFindbar(true);
      return;
    }

    // 2. F3 et Shift+F3 (recherche suivante / précédente universelle)
    if (e.key === 'F3' || e.keyCode === 114) {
      e.preventDefault();
      e.stopPropagation();
      navigateSearch(e.shiftKey ? -1 : 1);
      return;
    }

    // 3. Touche Escape globale
    if (e.key === 'Escape') {
      if (dom.findbar && !dom.findbar.classList.contains('hidden')) {
        e.preventDefault();
        closeFindbar();
        return;
      }
      if (dom.shortcutsDialog && dom.shortcutsDialog.open) {
        dom.shortcutsDialog.close();
        return;
      }
      if (dom.licenseDialog && dom.licenseDialog.open) {
        dom.licenseDialog.close();
        return;
      }
      if (state.sidebarOpen && window.innerWidth <= 900) {
        toggleSidebar(false);
        return;
      }
    }

    // Si l'utilisateur tape dans un input, ignorer les autres raccourcis
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
        openFindbar(true);
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
          dom.licenseTermsText.innerHTML = "Ce document est une décision ou un acte officiel rendu par le Secrétariat de la <strong>Commission de coopération environnementale (CCE)</strong> ou déposé par une Partie en vertu du Chapitre 24 de l'Accord Canada–États-Unis–Mexique (ACEUM). Il appartient au dossier public international de la procédure SEM-26-003.";
          if (docInfo.internalTitle) {
            dom.licenseTermsText.innerHTML += `
              <div style="margin-top:10px; padding:10px; background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.3); border-radius:6px; font-size:11.5px; line-height:1.45;">
                <strong style="color:#0284c7; display:flex; align-items:center; gap:5px; margin-bottom:4px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Métadonnées forensiques certifiées du fichier (ECCC) :
                </strong>
                <div>• <strong>Fichier source Word interne :</strong> <code>${escapeHTML(docInfo.internalTitle)}</code></div>
                <div>• <strong>Auteure numérique :</strong> ${escapeHTML(docInfo.author)}</div>
                <div>• <strong>Génération :</strong> ${escapeHTML(docInfo.exportTimestamp)} via ${escapeHTML(docInfo.converterTool)}</div>
              </div>
            `;
          }
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

  // ==========================================================================
  // SYSTÈME DE SURLIGNAGE PERSISTANT (USER HIGHLIGHTS)
  // ==========================================================================
  function getDocStorageKey() {
    const rawKey = dom.docSelect ? dom.docSelect.value : (state.currentFile || 'default');
    const safeKey = rawKey.replace(/[^a-zA-Z0-9_\-]/g, '_');
    return `wg_pdf_highlights_${safeKey}`;
  }

  function loadSavedHighlights() {
    try {
      const storageKey = getDocStorageKey();
      const raw = localStorage.getItem(storageKey);
      state.userHighlights = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(state.userHighlights)) state.userHighlights = [];
    } catch (e) {
      console.warn("Erreur chargement surlignages:", e);
      state.userHighlights = [];
    }
    updateHighlightsBadge();
  }

  function persistHighlights() {
    try {
      const storageKey = getDocStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(state.userHighlights));
    } catch (e) {
      console.warn("Erreur sauvegarde surlignages:", e);
    }
    updateHighlightsBadge();
  }

  function updateHighlightsBadge() {
    if (dom.highlightsCountBadge) {
      dom.highlightsCountBadge.textContent = state.userHighlights.length;
    }
  }

  function renderHighlightsSidebarList() {
    if (!dom.highlightsList) return;
    dom.highlightsList.innerHTML = '';

    if (state.userHighlights.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.cssText = 'padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 12px; font-style: italic;';
      emptyMsg.textContent = "Aucun surlignage enregistré pour ce document. Sélectionnez du texte avec votre curseur pour commencer !";
      dom.highlightsList.appendChild(emptyMsg);
      return;
    }

    // Trier du plus récent au plus ancien
    const sorted = [...state.userHighlights].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    sorted.forEach(hl => {
      const item = document.createElement('div');
      item.className = 'highlight-item';

      const colorMap = {
        yellow: '#fde047',
        green: '#86efac',
        pink: '#f9a8d4',
        blue: '#93c5fd'
      };

      item.innerHTML = `
        <div class="highlight-item-header">
          <span style="display:flex; align-items:center; gap:6px;">
            <span class="highlight-item-color-tag" style="background:${colorMap[hl.color] || '#fde047'};"></span>
            <span>Page ${hl.page}</span>
          </span>
          <span style="font-size:10px; color:var(--text-muted);">${hl.date || ''}</span>
        </div>
        <div class="highlight-item-text">« ${escapeHtml(hl.text)} »</div>
        <div class="highlight-item-actions">
          <button type="button" class="highlight-item-del-btn" data-id="${hl.id}">Supprimer</button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('highlight-item-del-btn')) return;
        scrollToPage(hl.page);
        // Faire clignoter ou scroller vers le surlignage
        setTimeout(() => {
          const el = document.querySelector(`.user-highlight[data-highlight-id="${hl.id}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.filter = 'brightness(0.7)';
            setTimeout(() => el.style.filter = '', 600);
          }
        }, 150);
      });

      const delBtn = item.querySelector('.highlight-item-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteHighlight(hl.id);
        });
      }

      dom.highlightsList.appendChild(item);
    });
  }

  function deleteHighlight(highlightId) {
    state.userHighlights = state.userHighlights.filter(h => h.id !== highlightId);
    persistHighlights();
    // Retirer du DOM si affiché
    document.querySelectorAll(`.user-highlight[data-highlight-id="${highlightId}"]`).forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });
    renderHighlightsSidebarList();
    showToast("Surlignage supprimé");
  }

  function handleTextSelection(e) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      hideSelectionTooltip();
      return;
    }

    const text = sel.toString().trim();
    if (!text || text.length < 2) {
      hideSelectionTooltip();
      return;
    }

    const range = sel.getRangeAt(0);
    // Vérifier si la sélection provient bien d'un textLayer
    const startTextLayer = range.startContainer.parentElement?.closest('.textLayer');
    const endTextLayer = range.endContainer.parentElement?.closest('.textLayer');

    if (!startTextLayer && !endTextLayer) {
      hideSelectionTooltip();
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hideSelectionTooltip();
      return;
    }

    showSelectionTooltip(rect.left + rect.width / 2, rect.top);
  }

  function showSelectionTooltip(clientX, clientY) {
    if (!dom.selectionTooltip) return;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    dom.selectionTooltip.style.left = `${clientX + scrollX}px`;
    dom.selectionTooltip.style.top = `${clientY + scrollY}px`;
    dom.selectionTooltip.classList.remove('hidden');
  }

  function hideSelectionTooltip() {
    if (!dom.selectionTooltip) return;
    dom.selectionTooltip.classList.add('hidden');
  }

  function applyUserHighlight(color = 'yellow') {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      hideSelectionTooltip();
      return;
    }

    const text = sel.toString().trim();
    if (!text) {
      hideSelectionTooltip();
      return;
    }

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;

    const pageWrapper = container.closest('.page-wrapper');
    const pageNum = pageWrapper ? parseInt(pageWrapper.dataset.pageNum, 10) : (state.currentPage || 1);

    const highlightId = 'hl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newHl = {
      id: highlightId,
      page: pageNum,
      text: text,
      color: color,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    // Insérer visuellement dans la page
    const textLayer = document.getElementById(`text-layer-${pageNum}`);
    if (textLayer) {
      highlightTextInPageNode(textLayer, text, highlightId, color);
    }

    state.userHighlights.push(newHl);
    persistHighlights();
    renderHighlightsSidebarList();
    hideSelectionTooltip();
    sel.removeAllRanges();
    showToast(`Surligné en ${color === 'yellow' ? 'jaune' : color === 'green' ? 'vert' : color === 'pink' ? 'rose' : 'bleu'} & sauvegardé !`);
  }

  function renderSavedHighlightsOnPage(pageNum) {
    const textLayer = document.getElementById(`text-layer-${pageNum}`);
    if (!textLayer) return;

    const pageHighlights = state.userHighlights.filter(h => h.page === pageNum);
    if (pageHighlights.length === 0) return;

    pageHighlights.forEach(hl => {
      highlightTextInPageNode(textLayer, hl.text, hl.id, hl.color);
    });
  }

  function highlightTextInPageNode(textLayer, queryText, hlId, color) {
    if (!textLayer || !queryText) return;

    // Éviter de doubler le surlignage s'il est déjà injecté
    if (textLayer.querySelector(`.user-highlight[data-highlight-id="${hlId}"]`)) {
      return;
    }

    const pattern = escapeRegExp(queryText.trim());
    let regex;
    try {
      regex = new RegExp(pattern, 'i');
    } catch (_) {
      return;
    }

    const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    for (const textNode of textNodes) {
      const parent = textNode.parentNode;
      if (parent && parent.classList && parent.classList.contains('user-highlight')) continue;
      const text = textNode.nodeValue;
      if (!text || !regex.test(text)) continue;

      const match = regex.exec(text);
      if (match) {
        const frag = document.createDocumentFragment();
        if (match.index > 0) {
          frag.appendChild(document.createTextNode(text.substring(0, match.index)));
        }
        const span = document.createElement('span');
        span.className = `user-highlight color-${color}`;
        span.dataset.highlightId = hlId;
        span.textContent = match[0];
        span.title = "Surlignage utilisateur · Cliquer pour supprimer";
        span.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm("Supprimer ce surlignage ?")) {
            deleteHighlight(hlId);
          }
        });
        frag.appendChild(span);
        if (match.index + match[0].length < text.length) {
          frag.appendChild(document.createTextNode(text.substring(match.index + match[0].length)));
        }
        parent.replaceChild(frag, textNode);
        break; // Traité
      }
    }
  }

  // ==========================================================================
  // MODE DOUBLE PDF CÔTE À CÔTE (SPLIT-SCREEN COMPARISON)
  // ==========================================================================
  function toggleSplitMode(forceState) {
    state.splitMode = (typeof forceState === 'boolean') ? forceState : !state.splitMode;

    if (dom.main) {
      dom.main.classList.toggle('split-active', state.splitMode);
    }
    if (dom.splitViewport) {
      dom.splitViewport.classList.toggle('hidden', !state.splitMode);
      dom.splitViewport.style.setProperty('display', state.splitMode ? 'flex' : 'none', 'important');
    }
    if (dom.btnSplitToggle) {
      dom.btnSplitToggle.classList.toggle('active', state.splitMode);
    }

    if (state.splitMode) {
      initSplitViewer();
      showToast("Mode comparatif 2 PDF activé");
    } else {
      showToast("Mode comparatif fermé");
    }

    // Réajuster le zoom du document principal pour la demi-largeur
    setTimeout(() => {
      applyZoom();
    }, 200);
  }

  function initSplitViewer() {
    if (!dom.splitDocSelect) return;

    // Remplir le sélecteur du 2e document s'il est vide
    if (dom.splitDocSelect.children.length === 0) {
      for (const [key, doc] of Object.entries(DOCS_CATALOG)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${doc.badge} · ${doc.title}`;
        dom.splitDocSelect.appendChild(opt);
      }
      dom.splitDocSelect.value = state.splitDocKey;
    }

    const currentKey = dom.splitDocSelect.value || state.splitDocKey;
    if (DOCS_CATALOG[currentKey]) {
      loadSplitPDF(DOCS_CATALOG[currentKey].file, 1);
    }
  }

  async function loadSplitPDF(url, startPage = 1) {
    if (dom.splitLoading) dom.splitLoading.classList.remove('hidden');
    if (dom.splitPagesContainer) dom.splitPagesContainer.innerHTML = '';

    try {
      const safeUrl = getSafeDocUrl(url);
      const docOptions = {
        url: safeUrl,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
        enableXfa: true,
        isEvalSupported: false
      };

      const task = pdfjsLib.getDocument(docOptions);
      state.splitPdfDoc = await task.promise;
      state.splitTotalPages = state.splitPdfDoc.numPages;
      state.splitCurrentPage = Math.min(Math.max(1, startPage), state.splitTotalPages);
      state.splitRenderedPages.clear();

      updateSplitPageCounter();
      setupSplitPageContainers();
      renderSplitPage(state.splitCurrentPage);

      if (dom.splitLoading) dom.splitLoading.classList.add('hidden');
    } catch (err) {
      console.error("Erreur chargement PDF comparatif:", err);
      if (dom.splitLoading) dom.splitLoading.classList.add('hidden');
      if (dom.splitPagesContainer) {
        dom.splitPagesContainer.innerHTML = `
          <div style="padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
            Impossible de charger le document comparatif.<br>
            <button type="button" class="btn" style="margin-top:10px; padding:6px 14px; font-size:12px;" onclick="loadSplitPDF('${url}', 1)">Réessayer</button>
          </div>
        `;
      }
    }
  }

  function setupSplitPageContainers() {
    if (!dom.splitPagesContainer || !state.splitPdfDoc) return;
    dom.splitPagesContainer.innerHTML = '';

    for (let i = 1; i <= state.splitTotalPages; i++) {
      const wrapper = document.createElement('div');
      wrapper.id = `split-page-wrapper-${i}`;
      wrapper.className = 'page-wrapper';
      wrapper.dataset.pageNum = i;
      wrapper.style.minHeight = '360px';

      const canvas = document.createElement('canvas');
      canvas.id = `split-canvas-page-${i}`;
      canvas.className = 'pdf-canvas';

      const textLayer = document.createElement('div');
      textLayer.id = `split-text-layer-${i}`;
      textLayer.className = 'textLayer';

      wrapper.appendChild(canvas);
      wrapper.appendChild(textLayer);
      dom.splitPagesContainer.appendChild(wrapper);
    }
  }

  async function renderSplitPage(pageNum) {
    if (!state.splitPdfDoc || pageNum < 1 || pageNum > state.splitTotalPages) return;
    if (state.splitRenderedPages.has(pageNum)) return;

    try {
      const page = await state.splitPdfDoc.getPage(pageNum);
      const wrapper = document.getElementById(`split-page-wrapper-${pageNum}`);
      const canvas = document.getElementById(`split-canvas-page-${pageNum}`);
      const textLayer = document.getElementById(`split-text-layer-${pageNum}`);
      if (!wrapper || !canvas || !textLayer) return;

      const viewportWidth = (dom.splitViewport.clientWidth || 400) - 40;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const targetScale = Math.min(2.0, Math.max(0.4, viewportWidth / unscaledViewport.width));
      const viewport = page.getViewport({ scale: targetScale });
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      wrapper.style.width = `${Math.floor(viewport.width)}px`;
      wrapper.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      state.splitRenderedPages.add(pageNum);

      // TextLayer pour sélection dans le comparatif
      textLayer.innerHTML = '';
      textLayer.style.setProperty('--scale-factor', viewport.scale);
      textLayer.style.width = `${Math.floor(viewport.width)}px`;
      textLayer.style.height = `${Math.floor(viewport.height)}px`;

      const textContent = await page.getTextContent();
      const textLayerInstance = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport: viewport
      });
      await textLayerInstance.render();
    } catch (err) {
      console.warn(`Erreur rendu split page ${pageNum}:`, err);
    }
  }

  function scrollSplitPage(pageNum) {
    if (!state.splitPdfDoc || pageNum < 1 || pageNum > state.splitTotalPages) return;
    state.splitCurrentPage = pageNum;
    updateSplitPageCounter();

    const targetWrapper = document.getElementById(`split-page-wrapper-${pageNum}`);
    if (targetWrapper) {
      targetWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    renderSplitPage(pageNum);
    if (pageNum > 1) renderSplitPage(pageNum - 1);
    if (pageNum < state.splitTotalPages) renderSplitPage(pageNum + 1);
  }

  function updateSplitPageCounter() {
    if (dom.splitPageCounter) {
      dom.splitPageCounter.textContent = `${state.splitCurrentPage} / ${state.splitTotalPages}`;
    }
  }

  // ==========================================================================
  // MODE LECTEUR PDF NATIF DU NAVIGATEUR (FOND NOIR / ZERO BOGUE)
  // ==========================================================================
  function openNativeViewer() {
    const fileUrl = state.currentFile || (dom.docSelect && DOCS_CATALOG[dom.docSelect.value]?.file) || 'assets/docs/observations-reponse-canada-sem26003.pdf';
    const pageHash = (state.currentPage && state.currentPage > 1) ? `#page=${state.currentPage}` : '';
    const targetUrl = `${fileUrl}${pageHash}`;
    window.location.replace(targetUrl);
  }

  function updateNativeViewerLink() {
    if (!dom.btnNativeToggle) return;
    const fileUrl = state.currentFile || (dom.docSelect && DOCS_CATALOG[dom.docSelect.value]?.file) || 'assets/docs/observations-reponse-canada-sem26003.pdf';
    const pageHash = (state.currentPage && state.currentPage > 1) ? `#page=${state.currentPage}` : '';
    if (dom.btnNativeToggle.tagName === 'A') {
      dom.btnNativeToggle.setAttribute('href', `${fileUrl}${pageHash}`);
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  // Lancement automatique au chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
