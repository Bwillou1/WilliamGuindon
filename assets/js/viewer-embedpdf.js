/**
 * EmbedPDF Integration Controller — William Guindon (williamguindon.me)
 * Moteur moderne WebAssembly PDFium pour la lecture haute fidélité
 */
import EmbedPDF from '../vendor/embedpdf/embedpdf.js';

(function () {
  'use strict';

  // Catalogue officiel des pièces documentaires
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
      isOriginalWork: true
    },
    'reponse-canada-16-octobre-2026': {
      title: "Réponse officielle du gouvernement du Canada (16 octobre 2026)",
      file: "assets/docs/72-rsp_fr.pdf",
      badge: "SEM-26-003 · Réponse du Canada (72-RSP)",
      date: "16 octobre 2026",
      pages: 2,
      type: "Réponse de la Partie (Art. 24.27(4) ACEUM)",
      sha256: "31ce88255e51b47118532da9e121f52d550ca421f583ebfa20a57cd8b6f0f5e2",
      author: "Sanchez,Amenemhet (ECCC) — Pour le gouvernement du Canada",
      citation: "Gouvernement du Canada. (2026). Réponse de la Partie à la communication SEM-26-003 (Enfouissement de matières dangereuses à Blainville) en vertu de l'article 24.27(4) de l'ACEUM. Ottawa / Montréal.",
      license: "Document officiel déposé auprès de la CCE (Domaine public probatoire)",
      isOriginalWork: false
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
      isOriginalWork: false
    },
    'petition-546-bvg-cedd': {
      title: "Pétition environnementale no 0546 (CEDD / BVG) & Accusé officiel",
      file: "assets/docs/petition-546-cedd-bvg.pdf",
      badge: "Pétition 0546 · CEDD / BVG",
      date: "13 juillet 2026",
      pages: 7,
      type: "Pétition environnementale statutaire (art. 22)",
      sha256: "4f84c0e44495257dbe3b0756bbc8c224b6952cb2ef343b1b53d44051da9dd243",
      author: "William Guindon (pétitionnaire) / BVG",
      citation: "Guindon, W. & BVG. (2026). Pétition environnementale no 0546 : Application des lois environnementales fédérales au site Stablex à Blainville. Ottawa : BVG.",
      license: "Document officiel déposé en vertu de l'art. 22 de la Loi sur le vérificateur général",
      isOriginalWork: true
    },
    'decision-17-aout-2026': {
      title: "Détermination positive du Secrétariat CCE (17 août 2026)",
      file: "assets/docs/26-2-det2_fr.pdf",
      badge: "SEM-26-003 · CCE / ACEUM",
      date: "17 août 2026",
      pages: 28,
      type: "Décision officielle (Art. 24.27(2) et (3))",
      sha256: "33dc8c088e6b9d24b8c8f2ca45b279a7ac4dd2ab15e83c19b3af76e93715e59c",
      author: "Secrétariat de la CCE",
      citation: "Secrétariat de la CCE. (2026). Détermination en vertu des paragraphes 24.27(2) et (3) de l'ACEUM concernant la communication SEM-26-003. Montréal : CCE.",
      license: "Document public officiel CCE (Art. 24.27 de l'ACEUM)",
      isOriginalWork: false
    },
    'soumission-16-juillet-2026': {
      title: "Communication révisée SEM-26-003 (16 juillet 2026)",
      file: "assets/docs/26-3-rsub_fr_redacted.pdf",
      badge: "SEM-26-003 · Soumission Citoyenne",
      date: "16 juillet 2026",
      pages: 15,
      type: "Communication formelle (15 pages)",
      sha256: "d8aade13059b957f7bc6dde13a73b4e996871d95907af1ee42b4f7137b773710",
      author: "William Guindon",
      citation: "Guindon, W. (2026). Soumission révisée SEM-26-003 : Protection de la Grande Tourbière de Blainville et conformité environnementale ACEUM (Art. 24.27). Montréal : CCE.",
      license: "Creative Commons CC BY-NC-ND 4.0 International",
      isOriginalWork: true
    },
    'decision-3-juin-2026': {
      title: "Décision préliminaire du Secrétariat CCE (3 juin 2026)",
      file: "assets/docs/26-3-det_fr.pdf",
      badge: "SEM-26-003 · CCE / ACEUM",
      date: "3 juin 2026",
      pages: 17,
      type: "Décision d'examen initial",
      sha256: "8f8998becc91e8398852a048a5472d498dd888e79874265fe86aa387422aad5b",
      author: "Secrétariat de la CCE",
      citation: "Secrétariat de la CCE. (2026). Détermination préliminaire SEM-26-003 en vertu de l'article 24.27(1). Montréal : CCE.",
      license: "Document public officiel CCE (Art. 24.27 de l'ACEUM)",
      isOriginalWork: false
    },
    'onu-mai-2026': {
      title: "Déposition formelle à l'ONU (Mai 2026)",
      file: "assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf",
      badge: "ONU · Droits Humains",
      date: "Mai 2026",
      pages: 14,
      type: "Mémoire au Rapporteur spécial",
      sha256: "db8818c7668e85efa4e977f5a7a3478f811933fbc20562b22c92fdc193b9767f",
      author: "William Guindon",
      citation: "Guindon, W. (2026). Urgent Appeal and Formal Deposition: Environmental and human rights violations regarding toxic waste expansion in Blainville. Genève : HCDH / ONU.",
      license: "Déposition officielle soumise aux procédures spéciales de l'ONU",
      isOriginalWork: true
    }
  };

  // Liste blanche stricte des documents consultables
  const ALLOWED_DOCS = [
    'assets/docs/observations-reponse-canada-sem26003.pdf',
    'assets/docs/72-rsp_fr.pdf',
    'assets/docs/72-rsp_en.pdf',
    'assets/docs/73-rec_fr.pdf',
    'assets/docs/73-rec_en.pdf',
    'assets/docs/petition-546-cedd-bvg.pdf',
    'assets/docs/26-2-det2_fr.pdf',
    'assets/docs/26-3-det_fr.pdf',
    'assets/docs/26-3-rsub_fr_redacted.pdf',
    'assets/docs/declaration-appui-manfred-liebel-e7834.pdf',
    'assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf',
    'assets/docs/26-1-sub_fr.pdf',
    'assets/docs/avis-juridique-protection-tourbiere.pdf',
    'assets/docs/recours-cour-superieure-blainville.pdf'
  ];

  function getSafeDocUrl(rawUrl) {
    if (!rawUrl) return 'assets/docs/observations-reponse-canada-sem26003.pdf';
    let clean = rawUrl.trim().replace(/^(\.\/|\/)/, '');
    if (ALLOWED_DOCS.includes(clean)) return clean;
    if (clean.startsWith('assets/docs/') && clean.endsWith('.pdf') && !clean.includes('..')) {
      return clean;
    }
    return 'assets/docs/observations-reponse-canada-sem26003.pdf';
  }

  // Éléments du DOM
  const dom = {
    docSelect: document.getElementById('viewer-doc-select'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    btnTranslateDoc: document.getElementById('btn-translate-doc'),
    btnDownload: document.getElementById('btn-download'),
    container: document.getElementById('embedpdf-container'),
    translateDialog: document.getElementById('embedpdf-translate-dialog'),
    translateStatus: document.getElementById('embedpdf-translate-status'),
    translateOutput: document.getElementById('embedpdf-translate-output'),
    selectTranslateLang: document.getElementById('select-embedpdf-translate-lang'),
    btnTranslateAction: document.getElementById('btn-embedpdf-do-translate'),
    btnTranslateCopy: document.getElementById('btn-embedpdf-copy-translate'),
    btnTranslateClose: document.getElementById('btn-embedpdf-translate-close'),
    licenseDialog: document.getElementById('license-download-dialog'),
    btnLicenseClose: document.getElementById('btn-license-dialog-close'),
    btnConfirmDownload: document.getElementById('btn-confirm-download'),
    btnCopyShareLink: document.getElementById('btn-copy-share-link'),
    btnCopyHash: document.getElementById('btn-copy-hash'),
    btnCopyCitation: document.getElementById('btn-copy-citation'),
    licenseTitle: document.getElementById('license-doc-title'),
    licenseMeta: document.getElementById('license-doc-meta'),
    licenseHash: document.getElementById('license-doc-hash'),
    licenseCitation: document.getElementById('license-citation-text'),
    licenseBadgePill: document.getElementById('license-badge-pill'),
    btnAbout: document.getElementById('btn-viewer-about'),
    aboutDialog: document.getElementById('viewer-about-dialog'),
    btnAboutClose: document.getElementById('btn-viewer-about-close'),
    btnAboutOk: document.getElementById('btn-viewer-about-ok')
  };

  let currentTargetFile = 'assets/docs/observations-reponse-canada-sem26003.pdf';
  let embedViewerInstance = null;

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function applyViewerTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('wg_theme', theme);
      localStorage.setItem('william-guindon-theme', theme);
    } catch (_) {}

    if (embedViewerInstance && typeof embedViewerInstance.setTheme === 'function') {
      embedViewerInstance.setTheme(theme);
    }
  }

  function syncDocSelect(targetFile) {
    if (!dom.docSelect) return;
    for (const [key, doc] of Object.entries(DOCS_CATALOG)) {
      if (doc.file === targetFile) {
        dom.docSelect.value = key;
        document.title = `${doc.title} — Lecteur Officiel · William Guindon`;
        return;
      }
    }
    // Si document hors catalogue, créer option personnalisée
    const customOpt = document.createElement('option');
    const filename = targetFile.split('/').pop();
    customOpt.value = targetFile;
    customOpt.textContent = filename;
    dom.docSelect.appendChild(customOpt);
    dom.docSelect.value = targetFile;
  }

  function initEmbedPDF(fileUrl) {
    currentTargetFile = getSafeDocUrl(fileUrl);
    syncDocSelect(currentTargetFile);

    if (!dom.container) return;
    dom.container.innerHTML = '';

    const themePref = getCurrentTheme() === 'dark' ? 'dark' : 'light';
    const origin = window.location.origin;
    const fullWasmUrl = `${origin}/assets/vendor/embedpdf/pdfium.wasm`;
    const fullDocUrl = `${origin}/${currentTargetFile}`;

    try {
      embedViewerInstance = EmbedPDF.init({
        type: 'container',
        target: dom.container,
        src: fullDocUrl,
        wasmUrl: fullWasmUrl,
        worker: true,
        tabBar: 'never',
        fontFallback: null,
        fonts: {
          ui: null,
          signature: null
        },
        stamp: {
          manifests: []
        },
        theme: {
          preference: themePref
        }
      });
    } catch (err) {
      console.error('Erreur initialisation EmbedPDF:', err);
      // Secours immédiat : lecteur natif si échec de chargement WebAssembly
      dom.container.innerHTML = `<iframe src="${currentTargetFile}" style="width:100%;height:100%;border:none;"></iframe>`;
    }
  }

  function openDocument(fileUrl) {
    const safeFile = getSafeDocUrl(fileUrl);
    if (safeFile === currentTargetFile && embedViewerInstance) return;

    // Mise à jour de l'URL sans rechargement
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('file', safeFile);
    window.history.replaceState({}, '', newUrl.toString());

    initEmbedPDF(safeFile);
  }

  // Configuration du sélecteur de documents
  if (dom.docSelect) {
    dom.docSelect.addEventListener('change', () => {
      const val = dom.docSelect.value;
      if (val === '__open_drive__') {
        window.location.href = 'dossier-journalistes.html';
        return;
      }
      if (DOCS_CATALOG[val]) {
        openDocument(DOCS_CATALOG[val].file);
      } else {
        openDocument(val);
      }
    });
  }

  // Bascule du thème clair/sombre
  if (dom.btnThemeToggle) {
    dom.btnThemeToggle.addEventListener('click', () => {
      const current = getCurrentTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      applyViewerTheme(next);
    });
  }

  // Gestion de la notice de téléchargement et d'intégrité (modale)
  if (dom.btnDownload) {
    dom.btnDownload.addEventListener('click', () => {
      openDownloadLicenseModal();
    });
  }

  function getDocMeta(targetFile) {
    for (const doc of Object.values(DOCS_CATALOG)) {
      if (doc.file === targetFile) return doc;
    }
    const name = targetFile.split('/').pop();
    return {
      title: name,
      badge: "Pièce Documentaire",
      sha256: "Vérification locale recommandée via shasum -a 256",
      citation: `Guindon, W. (2026). Archive documentaire SEM-26-003. ${name}`,
      file: targetFile
    };
  }

  function openDownloadLicenseModal() {
    const meta = getDocMeta(currentTargetFile);
    if (dom.licenseTitle) dom.licenseTitle.textContent = meta.title;
    if (dom.licenseBadgePill) dom.licenseBadgePill.textContent = meta.badge || "Pièce Officielle";
    if (dom.licenseHash) dom.licenseHash.textContent = meta.sha256 || "Calcul en cours...";
    if (dom.licenseCitation) dom.licenseCitation.textContent = meta.citation || meta.title;

    if (dom.licenseDialog && typeof dom.licenseDialog.showModal === 'function') {
      dom.licenseDialog.showModal();
    }
  }

  if (dom.btnLicenseClose) {
    dom.btnLicenseClose.addEventListener('click', () => {
      if (dom.licenseDialog) dom.licenseDialog.close();
    });
  }

  if (dom.btnConfirmDownload) {
    dom.btnConfirmDownload.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = currentTargetFile;
      a.download = currentTargetFile.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (dom.licenseDialog) dom.licenseDialog.close();
    });
  }

  if (dom.btnCopyHash && dom.licenseHash) {
    dom.btnCopyHash.addEventListener('click', () => {
      navigator.clipboard.writeText(dom.licenseHash.textContent).then(() => {
        dom.btnCopyHash.textContent = 'Copié !';
        setTimeout(() => dom.btnCopyHash.textContent = 'Copier SHA-256', 2000);
      });
    });
  }

  if (dom.btnCopyCitation && dom.licenseCitation) {
    dom.btnCopyCitation.addEventListener('click', () => {
      navigator.clipboard.writeText(dom.licenseCitation.textContent).then(() => {
        dom.btnCopyCitation.textContent = 'Copié !';
        setTimeout(() => dom.btnCopyCitation.textContent = 'Copier', 2000);
      });
    });
  }

  if (dom.btnCopyShareLink) {
    dom.btnCopyShareLink.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}/viewer.html?file=${encodeURIComponent(currentTargetFile)}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        dom.btnCopyShareLink.textContent = 'Lien copié !';
        setTimeout(() => dom.btnCopyShareLink.textContent = 'Copier le lien avec attribution', 2500);
      });
    });
  }

  // À propos et Licences
  if (dom.btnAbout && dom.aboutDialog) {
    dom.btnAbout.addEventListener('click', () => {
      if (typeof dom.aboutDialog.showModal === 'function') {
        dom.aboutDialog.showModal();
      }
    });
  }

  if (dom.btnAboutClose && dom.aboutDialog) {
    dom.btnAboutClose.addEventListener('click', () => {
      dom.aboutDialog.close();
    });
  }

  if (dom.btnAboutOk && dom.aboutDialog) {
    dom.btnAboutOk.addEventListener('click', () => {
      dom.aboutDialog.close();
    });
  }

  // Traduction automatique via Google Traduction (modale dédiée)
  if (dom.btnTranslateDoc) {
    dom.btnTranslateDoc.addEventListener('click', () => {
      if (dom.translateDialog && typeof dom.translateDialog.showModal === 'function') {
        dom.translateDialog.showModal();
      }
    });
  }

  if (dom.btnTranslateClose) {
    dom.btnTranslateClose.addEventListener('click', () => {
      if (dom.translateDialog) dom.translateDialog.close();
    });
  }

  if (dom.btnTranslateAction) {
    dom.btnTranslateAction.addEventListener('click', () => {
      const lang = dom.selectTranslateLang ? dom.selectTranslateLang.value : 'en';
      const meta = getDocMeta(currentTargetFile);
      if (dom.translateStatus) dom.translateStatus.textContent = 'Traduction de la description et du sommaire en cours...';

      const textToTranslate = `${meta.title}\n\n${meta.citation || ''}\n\n${meta.type || ''}`;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(textToTranslate)}`;

      fetch(url)
        .then(r => r.json())
        .then(data => {
          const translated = data[0].map(s => s[0]).join('');
          if (dom.translateOutput) dom.translateOutput.textContent = translated;
          if (dom.translateStatus) dom.translateStatus.textContent = `Traduction prête (${lang.toUpperCase()})`;
        })
        .catch(err => {
          console.error('Erreur traduction:', err);
          if (dom.translateStatus) dom.translateStatus.textContent = 'Traduction externe indisponible. Ouverture dans Google Traduction...';
          const fullDocUrl = `${window.location.origin}/${currentTargetFile}`;
          window.open(`https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(lang)}&u=${encodeURIComponent(fullDocUrl)}`, '_blank');
        });
    });
  }

  if (dom.btnTranslateCopy) {
    dom.btnTranslateCopy.addEventListener('click', () => {
      if (!dom.translateOutput || !dom.translateOutput.textContent) return;
      navigator.clipboard.writeText(dom.translateOutput.textContent).then(() => {
        dom.btnTranslateCopy.textContent = 'Copié !';
        setTimeout(() => dom.btnTranslateCopy.textContent = 'Copier la traduction', 2000);
      });
    });
  }

  // Écoute des messages cross-fenêtres (ex: depuis dossier-journalistes.html)
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'wg_theme_change') {
      applyViewerTheme(e.data.theme || 'light');
    }
  });

  // Détection du mode intégré (iFrame)
  if (window.self !== window.top) {
    document.body.classList.add('is-embedded');
    const header = document.querySelector('.viewer-header');
    if (header) header.style.display = 'none';
    if (dom.container) dom.container.style.height = '100vh';
  }

  // Démarrage initial
  const urlParams = new URLSearchParams(window.location.search);
  const rawFile = urlParams.get('file') || urlParams.get('doc');
  const targetDocKey = urlParams.get('id');

  let initialFile = rawFile;
  if (!initialFile && targetDocKey && DOCS_CATALOG[targetDocKey]) {
    initialFile = DOCS_CATALOG[targetDocKey].file;
  }
  if (!initialFile && dom.docSelect && dom.docSelect.value && DOCS_CATALOG[dom.docSelect.value]) {
    initialFile = DOCS_CATALOG[dom.docSelect.value].file;
  }
  if (!initialFile) {
    initialFile = 'assets/docs/observations-reponse-canada-sem26003.pdf';
  }

  initEmbedPDF(initialFile);

})();
