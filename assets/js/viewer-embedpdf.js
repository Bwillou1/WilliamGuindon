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
    let clean = rawUrl.trim();
    if (clean.includes('williamguindon.me/assets/docs/')) {
      clean = clean.split('williamguindon.me/')[1];
    }
    const cleanRel = clean.replace(/^(\.\/|\/)/, '');
    if (ALLOWED_DOCS.includes(cleanRel)) return cleanRel;
    if (cleanRel.startsWith('assets/docs/') && cleanRel.endsWith('.pdf') && !cleanRel.includes('..')) {
      return cleanRel;
    }
    // Archives officielles (archive.org, Internet Archive)
    if (/^https:\/\/(?:[a-zA-Z0-9-]+\.)?archive\.org\/.+\.pdf(?:[?#].*)?$/i.test(clean)) {
      return clean;
    }
    // Objets blobs locaux (ex. ouverts depuis dossier-journalistes.html)
    if (clean.startsWith('blob:') || clean.startsWith('data:application/pdf')) {
      return clean;
    }
    // URLs absolues HTTPS directes vers un PDF
    if (/^https:\/\/[a-zA-Z0-9.-]+\/.*\.pdf(?:[?#].*)?$/i.test(clean) && !clean.includes('..')) {
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
    btnAboutOk: document.getElementById('btn-viewer-about-ok'),
    btnDocDark: document.getElementById('btn-doc-dark-toggle'),
    bilingualBox: document.getElementById('embedpdf-bilingual-box'),
    btnOpenOfficialEnglish: document.getElementById('btn-open-official-english'),
    btnFullDocTranslateExternal: document.getElementById('btn-full-doc-translate-external'),
    btnGoogleTranslateWeb: document.getElementById('btn-google-translate-web'),
    btnDeeplTranslateWeb: document.getElementById('btn-deepl-translate-web'),
    translateDocLabel: document.getElementById('embedpdf-translate-doc-label'),
    textToTranslate: document.getElementById('embedpdf-text-to-translate'),
    btnUseSelection: document.getElementById('btn-use-selection'),
    btnSwitchToPageTranslation: document.getElementById('btn-switch-to-page-translation')
  };

  const BILINGUAL_PAIRS = {
    'assets/docs/72-rsp_fr.pdf': 'assets/docs/72-rsp_en.pdf',
    'assets/docs/72-rsp_en.pdf': 'assets/docs/72-rsp_fr.pdf',
    'assets/docs/73-rec_fr.pdf': 'assets/docs/73-rec_en.pdf',
    'assets/docs/73-rec_en.pdf': 'assets/docs/73-rec_fr.pdf'
  };

  const DOCS_TRANSLATIONS = {
    'assets/docs/observations-reponse-canada-sem26003.pdf': {
      en: "Guindon, W. (2026). Citizen Submission SEM-26-003 (Hazardous Waste Landfill in Blainville) — Formal observations on Canada's request to terminate or defer proceedings under CUSMA Article 24.28.\n\nSummary:\nCitizen submission author William Guindon formally opposes Canada's request of October 16, 2026 to dismiss or defer the proceedings. The observations demonstrate that municipal expropriation litigation does not enforce federal environmental law (Fisheries Act, Species at Risk Act) and that the CEC Secretariat must prepare a factual record.",
      es: "Guindon, W. (2026). Comunicación ciudadana SEM-26-003 (Confinamiento de residuos peligrosos en Blainville) — Observaciones formales sobre la solicitud de terminación o aplazamiento formulada en la respuesta de Canadá del 16 de octubre de 2026.\n\nResumen:\nWilliam Guindon se opone formalmente a la solicitud de Canadá de archivar o aplazar el procedimiento. Demuestra que los litigios locales sobre expropiación municipal no equivalen a la aplicación del derecho ambiental federal canadiense y que la Secretaría de la CCA debe preparar un expediente de hechos.",
      de: "Guindon, W. (2026). Bürgereingabe SEM-26-003 (Sondermülldeponie in Blainville) — Formelle Stellungnahme zum Ersuchen Kanadas auf Verfahrensbeendigung oder -aussetzung nach Art. 24.28 CUSMA/USMCA.\n\nZusammenfassung:\nWilliam Guindon widerspricht dem Antrag der kanadischen Regierung vom 16. Oktober 2026 auf Einstellung des Verfahrens. Er legt dar, dass kommunale Enteignungsverfahren keine Durchsetzung der Bundesumweltgesetze darstellen und das CCE-Sekretariat die Ausarbeitung eines Tatsachenberichts veranlassen muss."
    },
    'assets/docs/72-rsp_fr.pdf': {
      en: "Government of Canada (2026). Party Response to SEM-26-003 (Hazardous Waste Landfill in Blainville) under CUSMA Article 24.27(4).\n\nSummary:\nOfficial response submitted by Environment and Climate Change Canada (Amenemhet Sanchez) requesting the CEC Secretariat to dismiss or defer examination of submission SEM-26-003, citing ongoing judicial proceedings in Quebec courts concerning Stablex.\n\n💡 An official certified English version of this filing is available directly: click 'Ouvrir la version anglaise officielle' above.",
      es: "Gobierno de Canadá (2026). Respuesta de la Parte a la comunicación SEM-26-003 en virtud del Artículo 24.27(4) del T-MEC.\n\nResumen:\nRespuesta oficial de Medio Ambiente y Cambio Climático de Canadá solicitando la terminación o el aplazamiento del expediente ante la CCA, invocando litigios judiciales pendientes en Quebec relativos a Stablex.\n\n💡 La versión oficial en inglés está disponible directamente haciendo clic arriba.",
      de: "Regierung von Kanada (2026). Erwiderung der Vertragspartei auf die Eingabe SEM-26-003 gemäß Art. 24.27(4) CUSMA/USMCA.\n\nZusammenfassung:\nOffizielle Stellungnahme von Environment and Climate Change Canada mit dem Antrag an das CCE-Sekretariat, das Prüfverfahren im Hinblick auf anhängige Gerichtsverfahren in Québec auszusetzen oder einzustellen.\n\n💡 Eine offizielle englische Fassung steht direkt über die Schaltfläche oben bereit."
    },
    'assets/docs/72-rsp_en.pdf': {
      en: "Government of Canada (2026). Party Response to SEM-26-003 (Hazardous Waste Landfill in Blainville) under CUSMA Article 24.27(4).\n\nOfficial English version filed by Environment and Climate Change Canada (Sanchez, Amenemhet) requesting dismissal or deferral under Article 24.27(4)(a).",
      es: "Gobierno de Canadá (2026). Respuesta de la Parte a SEM-26-003 en virtud del Artículo 24.27(4) del T-MEC (Versión oficial en inglés).",
      de: "Regierung von Kanada (2026). Offizielle englische Erwiderung der Vertragspartei auf die Eingabe SEM-26-003 gemäß Art. 24.27(4) CUSMA."
    },
    'assets/docs/73-rec_fr.pdf': {
      en: "CEC Secretariat (2026). Formal Acknowledgement of Receipt of Canada's Response under CUSMA Article 24.27(4) (File SEM-26-003).\n\nSummary:\nOfficial notification issued by the Secretariat of the Commission for Environmental Cooperation confirming the timely filing of the Government of Canada's response.\n\n💡 An official certified English version of this registry notice is available directly: click 'Ouvrir la version anglaise officielle' above.",
      es: "Secretariado de la CCA (2026). Acuse de recibo de la respuesta de Canadá de conformidad con el Artículo 24.27(4) del T-MEC (Expediente SEM-26-003).\n\nResumen:\nNotificación formal del registro de la CCA confirmando la recepción en plazo de la respuesta gubernamental canadiense.",
      de: "CCE-Sekretariat (2026). Empfangsbestätigung der Erwiderung Kanadas gemäß Art. 24.27(4) CUSMA (Akte SEM-26-003).\n\nZusammenfassung:\nFormelle Bestätigung des CCE-Registers über den Eingang der Erwiderung der kanadischen Regierung."
    },
    'assets/docs/73-rec_en.pdf': {
      en: "CEC Secretariat (2026). Formal Acknowledgement of Receipt of Canada's Response under CUSMA Article 24.27(4) (Official English Filing).",
      es: "Secretariado de la CCA (2026). Acuse oficial de recibo en inglés de la respuesta de Canadá (SEM-26-003).",
      de: "CCE-Sekretariat (2026). Offizielle englische Empfangsbestätigung der Erwiderung Kanadas (SEM-26-003)."
    },
    'assets/docs/petition-546-cedd-bvg.pdf': {
      en: "William Guindon & Office of the Auditor General of Canada (2026). Environmental Petition No. 0546: Application of Federal Environmental Laws to the Stablex Site in Blainville (Fisheries Act, SARA, MBCA).\n\nSummary:\nStatutory environmental petition filed pursuant to Section 22 of the Auditor General Act with the Commissioner of the Environment and Sustainable Development (CESD), requesting federal ministers to enforce aquatic habitat and migratory bird protections.",
      es: "William Guindon y Auditoría General de Canadá (2026). Petición ambiental no 0546: Aplicación de leyes ambientales federales en el sitio Stablex en Blainville.\n\nResumen:\nPetición estatutaria presentada bajo el art. 22 de la Ley del Auditor General ante el Comisionado de Medio Ambiente y Desarrollo Sostenible (CEDD).",
      de: "William Guindon & Büro des Generalauditors von Kanada (2026). Umweltpetition Nr. 0546: Vollzug der Bundesumweltgesetze am Standort Stablex in Blainville.\n\nZusammenfassung:\nGesetzliche Umweltpetition nach Art. 22 des Generalauditorgesetzes an den Beauftragten für Umwelt und nachhaltige Entwicklung (CESD)."
    },
    'assets/docs/26-2-det2_fr.pdf': {
      en: "CEC Secretariat (2026). Positive Determination under CUSMA Articles 24.27(2) & 24.27(3) on Submission SEM-26-003 (28 pages).\n\nSummary:\nThe CEC Secretariat concludes that the submission by William Guindon satisfies all requirements of the North American Agreement on Environmental Cooperation and formally instructs Canada to submit its official response within 60 days.",
      es: "Secretariado de la CCA (2026). Determinación favorable de conformidad con los Artículos 24.27(2) y (3) del T-MEC sobre la petición SEM-26-003 (28 páginas).\n\nResumen:\nLa CCA determina que la petición ciudadana cumple con todos los criterios y solicita una respuesta formal al gobierno de Canadá en un plazo de 60 días.",
      de: "CCE-Sekretariat (2026). Positive Feststellung nach Art. 24.27(2) und (3) CUSMA zur Eingabe SEM-26-003 (28 Seiten).\n\nZusammenfassung:\nDas CCE-Sekretariat stellt die Zulässigkeit fest und fordert die kanadische Regierung auf, binnen 60 Tagen eine formelle Antwort einzureichen."
    },
    'assets/docs/26-3-rsub_fr_redacted.pdf': {
      en: "William Guindon (2026). Revised Submission SEM-26-003: Protection of the Grande Tourbière de Blainville and CUSMA environmental compliance (15 pages).\n\nSummary:\nDetailed citizen submission documenting assertions of failure to enforce the federal Fisheries Act and Species at Risk Act in relation to the industrial expansion of hazardous waste disposal cells in Blainville.",
      es: "William Guindon (2026). Petición revisada SEM-26-003: Protección de la Gran Turbera de Blainville y cumplimiento ambiental bajo el T-MEC (15 páginas).\n\nResumen:\nPetición ciudadana revisada que detalla las omisiones en la aplicación efectiva de la legislación ambiental federal canadiense.",
      de: "William Guindon (2026). Überarbeitete Bürgereingabe SEM-26-003: Schutz des Großen Moores von Blainville und Einhaltung des CUSMA (15 Seiten).\n\nZusammenfassung:\nAusführliche Dokumentation der Nichtvollziehung von Bundesumweltgesetzen hinsichtlich der Erweiterung der Sondermülldeponie Stablex."
    },
    'assets/docs/26-3-det_fr.pdf': {
      en: "CEC Secretariat (2026). Preliminary Determination on Submission SEM-26-003 under CUSMA Article 24.27(1) (17 pages).\n\nSummary:\nFirst procedural review determining that the initial citizen submission met basic requirements while setting out the timeline for filing the revised submission.",
      es: "Secretariado de la CCA (2026). Determinación preliminar sobre la petición SEM-26-003 bajo el Artículo 24.27(1) del T-MEC (17 páginas).\n\nResumen:\nDictamen preliminar que establece el calendario procedimental para la versión revisada de la petición.",
      de: "CCE-Sekretariat (2026). Vorläufige Feststellung zur Eingabe SEM-26-003 gemäß Art. 24.27(1) CUSMA (17 Seiten).\n\nZusammenfassung:\nVerfahrensentscheidung des CCE-Sekretariats zur Fristsetzung für die überarbeitete Eingabe."
    },
    'assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf': {
      en: "William Guindon (2026). Urgent Appeal and Formal Deposition: Environmental and human rights violations regarding toxic waste expansion in Blainville (Geneva: UN / OHCHR, 14 pages).\n\nSummary:\nFormal submission addressed to United Nations Special Rapporteurs on toxics and human rights, highlighting toxic exposure risks, youth environmental rights, and international commitments.",
      es: "William Guindon (2026). Llamamiento urgente y deposición formal ante relatores especiales de la ONU (14 páginas).\n\nResumen:\nDenuncia ante los Procedimientos Especiales de la ONU sobre violaciones de derechos ambientales y de la juventud en Blainville.",
      de: "William Guindon (2026). Dringlichkeitsappell und formelle Eingabe an UN-Sonderberichterstatter (Genf: UN / OHCHR, 14 Seiten).\n\nZusammenfassung:\nFormelle Eingabe an die Sonderberichterstatter der Vereinten Nationen bezüglich giftiger Abfälle und Jugendrechte."
    },
    'assets/docs/declaration-appui-manfred-liebel-e7834.pdf': {
      en: "Prof. Dr. Manfred Liebel (TU Berlin) & Philip Meade, M.A. (2026). International Scientific Declaration of Support: Civic Capacity, Youth Agency, and Anti-Adultism.\n\nSummary:\nCertified expert declaration recognizing the legal and civic agency of minor petition authors, and validating William Guindon's leadership in international environmental proceedings.",
      es: "Prof. Dr. Manfred Liebel (TU Berlín) y Philip Meade, M.A. (2026). Declaración científica internacional de apoyo: Capacidad cívica, agencia juvenil y anti-adultismo.\n\nResumen:\nDictamen académico que respalda la plena legitimidad y capacidad jurídica de autores menores de edad en procedimientos ambientales.",
      de: "Prof. Dr. Manfred Liebel (TU Berlin) & Philip Meade, M.A. (2026). Internationale wissenschaftliche Unterstützungserklärung: Bürgerliche Handlungsfähigkeit, Jugend-Agency und Anti-Adultismus.\n\nZusammenfassung:\nWissenschaftliches Gutachten zur Bestätigung der bürgerlichen Handlungsfähigkeit von Minderjährigen im Umwelt- und Völkerrecht."
    }
  };

  let currentTargetFile = 'assets/docs/observations-reponse-canada-sem26003.pdf';
  let embedViewerInstance = null;
  let isDocDark = false;
  try {
    isDocDark = localStorage.getItem('wg_pdf_doc_dark') === 'true';
  } catch (_) {}

  let saveAnnotationTimeout = null;
  function debounceSaveAnnotations(annotationApi, file) {
    clearTimeout(saveAnnotationTimeout);
    saveAnnotationTimeout = setTimeout(() => {
      try {
        if (!annotationApi || typeof annotationApi.exportAnnotations !== 'function') return;
        annotationApi.exportAnnotations().wait((items) => {
          if (items && Array.isArray(items)) {
            const key = `wg_embedpdf_annotations_${encodeURIComponent(file)}`;
            localStorage.setItem(key, JSON.stringify(items));
          }
        }, (err) => console.warn('Erreur export annotations:', err));
      } catch (e) {
        console.warn('Erreur sauvegarde annotations:', e);
      }
    }, 400);
  }

  function getEmbedPdfShadowRoot() {
    const hostEl = embedViewerInstance || (dom.container ? dom.container.querySelector('embedpdf-container') : null);
    return hostEl ? (hostEl.shadowRoot || hostEl.root) : null;
  }

  function injectEmbedPDFStyles() {
    const s = getEmbedPdfShadowRoot();
    if (!s) return;

    let style = s.getElementById('wg-embedpdf-custom-ui-rules');
    if (!style) {
      style = document.createElement('style');
      style.id = 'wg-embedpdf-custom-ui-rules';
      s.appendChild(style);
    }
    style.textContent = `
      /* 1. Surlignage et sélection de texte en vert émeraude */
      ::selection {
        background: rgba(16, 185, 129, 0.45) !important;
        color: inherit !important;
      }
      ::-moz-selection {
        background: rgba(16, 185, 129, 0.45) !important;
        color: inherit !important;
      }

      /* 2. Cacher Form, Insert, Redact, Shapes (onglets et menus) */
      [data-epdf-i="shapes-mode"],
      [data-epdf-i="insert-mode"],
      [data-epdf-i="form-mode"],
      [data-epdf-i="redact-mode"],
      [data-epdf-i="mode:shapes"],
      [data-epdf-i="mode:insert"],
      [data-epdf-i="mode:form"],
      [data-epdf-i="mode:redact"],
      [data-epdf-i="overflow-tabs-button"],
      [data-epdf-cat~="annotation-shape"],
      [data-epdf-cat~="mode-shapes"],
      [data-epdf-cat~="mode-insert"],
      [data-epdf-cat~="mode-form"],
      [data-epdf-cat~="mode-redact"],
      [data-epdf-cat~="redaction"],
      [data-epdf-cat~="form"],

      /* Cacher les outils d'insertion et modification de texte direct sur le document (Tt, T->, T↩, Callout) */
      [data-epdf-i="annotation:add-text"],
      [data-epdf-i="annotation:add-callout"],
      [data-epdf-i="annotation:add-insert-text"],
      [data-epdf-i="annotation:add-replace-text"],
      [data-epdf-i="add-text"],
      [data-epdf-i="add-callout"],
      [data-epdf-i="add-insert-text"],
      [data-epdf-i="add-replace-text"],
      [data-epdf-cat~="annotation-text"],
      [data-epdf-cat~="annotation-callout"],
      [data-epdf-cat~="annotation-insert-text"],
      [data-epdf-cat~="annotation-replace-text"],
      button[title*="Texte" i],
      button[title*="Text" i],
      button[title*="Callout" i],
      button[title*="Insert" i],
      button[title*="Replace" i],
      button[aria-label*="Texte" i],
      button[aria-label*="Text" i],
      button[aria-label*="Callout" i],
      button[aria-label*="Insert" i],
      button[aria-label*="Replace" i],

      /* 3. Cacher le menu Document (Open, Close, Security / Protect) et empêcher l'import */
      [data-epdf-i="document-menu-button"],
      [data-epdf-i="document:open"],
      [data-epdf-i="document:close"],
      [data-epdf-i="document:protect"],
      [data-epdf-cat~="document-menu"],
      [data-epdf-i="divider-1"] {
        display: none !important;
      }

      /* 4. Fond vert pâle derrière le document */
      :host, .embedpdf-snippet-root, [data-epdf-i="main-viewport"], .bg-bg-app {
        background-color: var(--viewer-bg, #f0fdf4) !important;
      }
    `;

    applyDocDarkMode(isDocDark);
  }

  function applyDocDarkMode(enabled) {
    isDocDark = enabled;
    try {
      localStorage.setItem('wg_pdf_doc_dark', enabled ? 'true' : 'false');
    } catch (_) {}
    if (dom.btnDocDark) {
      dom.btnDocDark.classList.toggle('doc-dark-active', enabled);
      dom.btnDocDark.title = enabled
        ? 'Couleur du document : Rétablir clair'
        : 'Couleur du document : Inverser en mode sombre';
    }
    const s = getEmbedPdfShadowRoot();
    if (s) {
      let style = s.getElementById('wg-doc-dark-mode-style');
      if (enabled) {
        if (!style) {
          style = document.createElement('style');
          style.id = 'wg-doc-dark-mode-style';
          s.appendChild(style);
        }
        style.textContent = `
          /* Inversion sombre haute précision des pages PDF et des tuiles de rendu */
          .bg-bg-app img,
          .bg-bg-app canvas,
          div[style*="transform-origin"] img,
          div[style*="matrix"] img,
          img[src^="blob:"],
          [data-epdf-i="thumbnail"] img,
          .thumbnail-item img,
          [data-epdf-i="page-canvas"],
          .embedpdf-page-canvas {
            filter: invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(1.15) !important;
            background-color: transparent !important;
            transition: filter 0.2s ease-in-out;
          }

          /* Fond sombre pour les conteneurs de page (élimination complète de la feuille blanche) */
          div[style*="background-color: rgb(255, 255, 255)"],
          div[style*="background-color: #fff"],
          div[style*="background-color:#fff"],
          div[style*="background-color: #ffffff"],
          div[style*="background-color:#ffffff"],
          div[style*="backgroundColor: rgb(255, 255, 255)"],
          div[style*="backgroundColor: #fff"],
          div[style*="position: absolute"][style*="transform-origin"],
          div[style*="position:absolute"][style*="transform-origin"],
          div[style*="position: absolute"][style*="matrix"],
          div[style*="position:absolute"][style*="matrix"] {
            background-color: #141a17 !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45) !important;
          }

          /* Fond sombre du viewport de lecture et des zones de défilement */
          :host,
          .bg-bg-app,
          [data-epdf-i="main-viewport"],
          [data-epdf-i="document-viewport"] {
            background-color: #0c1612 !important;
          }

          /* Sélection de texte et surlignage lisibles en mode sombre */
          ::selection {
            background: rgba(16, 185, 129, 0.45) !important;
            color: #ffffff !important;
          }
          ::-moz-selection {
            background: rgba(16, 185, 129, 0.45) !important;
            color: #ffffff !important;
          }
        `;
      } else if (style) {
        style.remove();
      }
    }
  }

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

    // Filtre automatique pour le document : sombre si theme === 'dark', clair sinon
    applyDocDarkMode(theme === 'dark');

    setTimeout(injectEmbedPDFStyles, 50);
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
    // Si document hors catalogue (ex: archive web, mémoire d'expert, etc.)
    const filename = decodeURIComponent(targetFile.split('/').pop().split('?')[0]);
    const cleanLabel = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    let foundOption = null;
    for (let opt of dom.docSelect.options) {
      if (opt.value === targetFile) {
        foundOption = opt;
        break;
      }
    }
    if (!foundOption) {
      foundOption = document.createElement('option');
      foundOption.value = targetFile;
      dom.docSelect.appendChild(foundOption);
    }
    foundOption.textContent = `Pièce d'archive : ${cleanLabel}`;
    dom.docSelect.value = targetFile;
    document.title = `${cleanLabel} — Archive SEM-26-003 · William Guindon`;
  }

  function initEmbedPDF(fileUrl) {
    currentTargetFile = getSafeDocUrl(fileUrl);
    syncDocSelect(currentTargetFile);

    if (!dom.container) return;
    dom.container.innerHTML = '';

    const themePref = getCurrentTheme() === 'dark' ? 'dark' : 'light';
    const origin = window.location.origin;
    const fullWasmUrl = `${origin}/assets/vendor/embedpdf/pdfium.wasm`;
    const fullDocUrl = (currentTargetFile.startsWith('http://') || currentTargetFile.startsWith('https://') || currentTargetFile.startsWith('blob:') || currentTargetFile.startsWith('data:'))
      ? currentTargetFile
      : `${origin}/${currentTargetFile}`;

    try {
      embedViewerInstance = EmbedPDF.init({
        type: 'container',
        target: dom.container,
        src: fullDocUrl,
        wasmUrl: fullWasmUrl,
        worker: true,
        theme: { preference: themePref },
        tabBar: 'never',
        fontFallback: null,
        fonts: {
          ui: null,
          signature: null
        },
        stamp: {
          manifests: []
        },
        i18n: {
          defaultLocale: 'fr',
          locales: [
            {
              code: 'fr',
              name: 'Français',
              translations: {
                page: {
                  spreadMode: "Disposition des pages",
                  single: "Une page",
                  twoOdd: "Deux pages (reliure impaire)",
                  twoEven: "Deux pages (reliure paire)",
                  scrollLayout: "Sens de défilement",
                  vertical: "Défilement vertical",
                  horizontal: "Défilement horizontal",
                  rotation: "Rotation des pages",
                  settings: "Options d'affichage",
                  next: "Page suivante",
                  previous: "Page précédente"
                },
                "page.spreadMode": "Disposition des pages",
                "page.single": "Une page",
                "page.twoOdd": "Deux pages (reliure impaire)",
                "page.twoEven": "Deux pages (reliure paire)",
                "page.scrollLayout": "Sens de défilement",
                "page.vertical": "Défilement vertical",
                "page.horizontal": "Défilement horizontal",
                "page.rotation": "Rotation des pages",
                "page.settings": "Options d'affichage",
                "page.next": "Page suivante",
                "page.previous": "Page précédente",

                rotate: {
                  clockwise: "Pivoter vers la droite",
                  counterClockwise: "Pivoter vers la gauche",
                  counterclockwise: "Pivoter vers la gauche"
                },
                "rotate.clockwise": "Pivoter vers la droite",
                "rotate.counterClockwise": "Pivoter vers la gauche",
                "rotate.counterclockwise": "Pivoter vers la gauche",

                document: {
                  fullscreen: "Plein écran",
                  open: "Ouvrir",
                  close: "Fermer",
                  export: "Exporter",
                  print: "Imprimer",
                  menu: "Menu du document"
                },
                "document.fullscreen": "Plein écran",
                "document.open": "Ouvrir",
                "document.close": "Fermer",
                "document.export": "Exporter",
                "document.print": "Imprimer",
                "document.menu": "Menu du document",

                zoom: {
                  in: "Zoom avant",
                  out: "Zoom arrière",
                  fitWidth: "Ajuster à la largeur",
                  fitPage: "Ajuster à la page",
                  automatic: "Automatique",
                  level: "Niveau de zoom ({level}%)",
                  marquee: "Zoomer sur une zone",
                  menu: "Menu zoom"
                },
                "zoom.in": "Zoom avant",
                "zoom.out": "Zoom arrière",
                "zoom.fitWidth": "Ajuster à la largeur",
                "zoom.fitPage": "Ajuster à la page",
                "zoom.automatic": "Automatique",
                "zoom.level": "Niveau de zoom ({level}%)",
                "zoom.marquee": "Zoomer sur une zone",

                pan: {
                  toggle: "Déplacer la page (Main)"
                },
                "pan.toggle": "Déplacer la page (Main)",

                pointer: {
                  toggle: "Sélectionner du texte (Curseur)"
                },
                "pointer.toggle": "Sélectionner du texte (Curseur)",

                history: {
                  undo: "Annuler",
                  redo: "Rétablir"
                },
                "history.undo": "Annuler",
                "history.redo": "Rétablir",

                selection: {
                  copy: "Copier",
                  copyToClipboard: "Copier dans le presse-papier"
                },
                "selection.copy": "Copier",
                "selection.copyToClipboard": "Copier dans le presse-papier",

                capture: {
                  screenshot: "Capture d'écran"
                },
                "capture.screenshot": "Capture d'écran",

                menu: {
                  moreOptions: "Plus d'options",
                  viewControls: "Contrôles d'affichage",
                  zoomControls: "Contrôles du zoom"
                },
                "menu.moreOptions": "Plus d'options",
                "menu.viewControls": "Contrôles d'affichage",
                "menu.zoomControls": "Contrôles du zoom",

                mode: {
                  view: "Mode lecture",
                  annotate: "Mode annotation"
                },
                "mode.view": "Mode lecture",
                "mode.annotate": "Mode annotation",

                panel: {
                  sidebar: "Volet latéral",
                  thumbnails: "Vignettes des pages",
                  outline: "Plan du document",
                  search: "Rechercher",
                  comment: "Commentaires",
                  annotationStyle: "Style d'annotation"
                },
                "panel.sidebar": "Volet latéral",
                "panel.thumbnails": "Vignettes des pages",
                "panel.outline": "Plan du document",
                "panel.search": "Rechercher",
                "panel.comment": "Commentaires",
                "panel.annotationStyle": "Style d'annotation",

                annotation: {
                  highlight: "Surligner",
                  underline: "Souligner",
                  strikeout: "Biffer",
                  squiggly: "Soulignement ondulé",
                  ink: "Dessin à main levée",
                  inkHighlighter: "Feutre surligneur",
                  comment: "Note / Commentaire",
                  deleteSelected: "Supprimer la sélection",
                  deleteAllSelected: "Tout supprimer"
                },
                "annotation.highlight": "Surligner",
                "annotation.underline": "Souligner",
                "annotation.strikeout": "Biffer",
                "annotation.squiggly": "Soulignement ondulé",
                "annotation.ink": "Dessin à main levée",
                "annotation.inkHighlighter": "Feutre surligneur",
                "annotation.comment": "Note / Commentaire",
                "annotation.deleteSelected": "Supprimer la sélection",
                "annotation.deleteAllSelected": "Tout supprimer"
              }
            }
          ]
        },
        disabledCategories: [
          'form',
          'mode-form',
          'insert',
          'mode-insert',
          'redaction',
          'mode-redact',
          'annotation-shape',
          'mode-shapes',
          'shape',
          'document-open',
          'document-close',
          'security',
          'document-protect',
          'annotation-text',
          'annotation-callout',
          'annotation-insert-text',
          'annotation-replace-text'
        ],
        theme: {
          preference: themePref,
          light: {
            accent: {
              primary: '#059669',
              primaryHover: '#047857',
              primaryActive: '#065f46',
              primaryLight: 'rgba(16, 185, 129, 0.15)',
              primaryForeground: '#ffffff'
            },
            background: {
              app: '#f0fdf4',
              surface: '#ffffff',
              surfaceAlt: '#f8fafc'
            }
          },
          dark: {
            accent: {
              primary: '#10b981',
              primaryHover: '#34d399',
              primaryActive: '#059669',
              primaryLight: 'rgba(16, 185, 129, 0.25)',
              primaryForeground: '#ffffff'
            },
            background: {
              app: '#0c1612',
              surface: '#15241e',
              surfaceAlt: '#0c1612'
            }
          }
        }
      });

      // Configuration de la persistance des annotations
      if (embedViewerInstance && embedViewerInstance.registry) {
        embedViewerInstance.registry.then(registry => {
          const annotationApi = registry.getPlugin('annotation')?.provides();
          if (!annotationApi) return;

          // 1. Restaurer annotations existantes pour ce document
          try {
            const key = `wg_embedpdf_annotations_${encodeURIComponent(currentTargetFile)}`;
            const saved = localStorage.getItem(key);
            if (saved) {
              const items = JSON.parse(saved);
              if (Array.isArray(items) && items.length > 0) {
                annotationApi.importAnnotations(items);
              }
            }
          } catch (err) {
            console.warn('Erreur restauration annotations:', err);
          }

          // 2. Écouter les événements d'annotation et sauvegarder
          if (typeof annotationApi.onAnnotationEvent === 'function') {
            annotationApi.onAnnotationEvent(() => {
              debounceSaveAnnotations(annotationApi, currentTargetFile);
            });
          }
        }).catch(err => {
          console.warn('Erreur registre EmbedPDF:', err);
        });
      }

  function localizeEmbedPdfUI() {
    const s = getEmbedPdfShadowRoot();
    if (!s) return;
    const FR_LABELS = {
      'Hand Tool': 'Main (Déplacer la vue)',
      'Select Text': 'Sélectionner le texte',
      'Highlight': 'Surligner (Vert naturel)',
      'Underline': 'Souligner',
      'Strikeout': 'Barrer',
      'Squiggly': 'Onduler',
      'Ink': 'Dessiner / Stylet',
      'Ink Highlighter': 'Feutre surligneur',
      'Note': 'Note en marge',
      'Comment': 'Commentaire',
      'Zoom In': 'Zoom avant',
      'Zoom Out': 'Zoom arrière',
      'Fit to Width': 'Ajuster à la largeur',
      'Fit to Page': 'Ajuster à la page',
      'Automatic': 'Automatique',
      'Full Screen': 'Plein écran',
      'Thumbnails': 'Vignettes des pages',
      'Outline': 'Plan du document',
      'Search': 'Rechercher dans le document',
      'Print': 'Imprimer',
      'Download': 'Télécharger le PDF',
      'Rotate Clockwise': 'Pivoter vers la droite',
      'Rotate Counterclockwise': 'Pivoter vers la gauche',
      'Settings': 'Paramètres',
      'Annotate': 'Annoter'
    };
    s.querySelectorAll('button, [title], [aria-label]').forEach(el => {
      const title = el.getAttribute('title');
      if (title && FR_LABELS[title]) {
        el.setAttribute('title', FR_LABELS[title]);
      }
      const aria = el.getAttribute('aria-label');
      if (aria && FR_LABELS[aria]) {
        el.setAttribute('aria-label', FR_LABELS[aria]);
      }
    });

    const TEXT_MAP = {
      'page.spreadmode': 'Disposition des pages',
      'page.single': 'Une page',
      'page.twoodd': 'Deux pages (reliure impaire)',
      'page.twoeven': 'Deux pages (reliure paire)',
      'page.scrolllayout': 'Sens de défilement',
      'page.vertical': 'Défilement vertical',
      'page.horizontal': 'Défilement horizontal',
      'page.rotation': 'Rotation des pages',
      'rotate.clockwise': 'Pivoter vers la droite',
      'rotate.counterclockwise': 'Pivoter vers la gauche',
      'document.fullscreen': 'Plein écran',
      'document.open': 'Ouvrir',
      'document.close': 'Fermer',
      'document.print': 'Imprimer',
      'spread mode': 'Disposition des pages',
      'scroll layout': 'Sens de défilement',
      'page rotation': 'Rotation des pages'
    };

    s.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && el.textContent) {
        const raw = el.textContent.trim().toLowerCase();
        if (TEXT_MAP[raw]) {
          el.textContent = TEXT_MAP[raw];
        }
      }
    });
  }

      // Observation et injection continue des styles personnalisés et traductions
      const s = getEmbedPdfShadowRoot();
      if (s) {
        injectEmbedPDFStyles();
        localizeEmbedPdfUI();
        try {
          const obs = new MutationObserver(() => {
            if (!s.getElementById('wg-embedpdf-custom-ui-rules')) {
              injectEmbedPDFStyles();
            }
            if (isDocDark && !s.getElementById('wg-doc-dark-mode-style')) {
              applyDocDarkMode(true);
            }
            localizeEmbedPdfUI();
          });
          obs.observe(s, { childList: true, subtree: true });
        } catch (_) {}
      }
      setTimeout(() => { injectEmbedPDFStyles(); localizeEmbedPdfUI(); }, 80);
      setTimeout(() => { injectEmbedPDFStyles(); localizeEmbedPdfUI(); }, 300);
      setTimeout(() => { injectEmbedPDFStyles(); localizeEmbedPdfUI(); }, 800);
      setTimeout(() => { injectEmbedPDFStyles(); localizeEmbedPdfUI(); }, 1800);

    } catch (err) {
      console.error('Erreur initialisation EmbedPDF:', err);
      // Secours immédiat : lecteur natif si échec de chargement WebAssembly
      dom.container.innerHTML = `<iframe src="${currentTargetFile}" style="width:100%;height:100%;border:none;"></iframe>`;
    }
  }

  // Empêcher l'importation de fichiers PDF externes par glisser-déposer
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  }, false);
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, false);

  function openDocument(fileUrl) {
    const safeFile = getSafeDocUrl(fileUrl);
    if (safeFile === currentTargetFile && embedViewerInstance) return;

    // Mise à jour de l'URL sans rechargement
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('file', safeFile);
    window.history.replaceState({}, '', newUrl.toString());

    initEmbedPDF(safeFile);
  }

  // Bouton Retour : redirection directe et propre vers la racine (williamguindon.me)
  const backBtn = document.querySelector('.viewer-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/';
    });
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

  if (dom.licenseDialog) {
    dom.licenseDialog.addEventListener('click', (e) => {
      const rect = dom.licenseDialog.getBoundingClientRect();
      const isIn = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isIn) dom.licenseDialog.close();
    });
  }

  if (dom.aboutDialog) {
    dom.aboutDialog.addEventListener('click', (e) => {
      const rect = dom.aboutDialog.getBoundingClientRect();
      const isIn = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isIn) dom.aboutDialog.close();
    });
  }

  // Bascule du mode Document Sombre / Inversion
  if (dom.btnDocDark) {
    dom.btnDocDark.addEventListener('click', () => {
      applyDocDarkMode(!isDocDark);
    });
  }

  function getSelectedDocText() {
    try {
      if (window.getSelection) {
        const sel = window.getSelection().toString().trim();
        if (sel) return sel;
      }
    } catch (_) {}
    return '';
  }

  function updateTranslateModal() {
    const lang = dom.selectTranslateLang ? dom.selectTranslateLang.value : 'en';
    const meta = getDocMeta(currentTargetFile);

    if (dom.translateDocLabel) {
      dom.translateDocLabel.textContent = meta.title || currentTargetFile;
    }

    // Version officielle bilingue si disponible
    const pair = BILINGUAL_PAIRS[currentTargetFile];
    if (pair && dom.bilingualBox) {
      dom.bilingualBox.style.display = 'block';
      if (dom.btnOpenOfficialEnglish) {
        dom.btnOpenOfficialEnglish.onclick = () => {
          openDocument(pair);
          if (dom.translateDialog) dom.translateDialog.close();
        };
      }
    } else if (dom.bilingualBox) {
      dom.bilingualBox.style.display = 'none';
    }

    // Texte source
    const textVal = dom.textToTranslate ? dom.textToTranslate.value.trim() : '';
    const defaultMetaText = `${meta.title}\n\n${meta.citation || ''}\n\nType : ${meta.type || ''}`.trim();

    // Traduction officielle ou extrait
    const docTrans = DOCS_TRANSLATIONS[currentTargetFile];
    const officialSummary = (docTrans && docTrans[lang]) ? docTrans[lang] : null;

    if (!textVal || textVal === defaultMetaText) {
      if (officialSummary) {
        if (dom.translateOutput) dom.translateOutput.textContent = officialSummary;
        if (dom.translateStatus) dom.translateStatus.textContent = `Traduction officielle certifiée (${lang.toUpperCase()})`;
      } else {
        if (dom.translateOutput) {
          dom.translateOutput.textContent = `Titre : ${meta.title}\n\nCitation : ${meta.citation || 'SEM-26-003'}\n\n💡 Cliquez sur « Traduire sur Google Traduction ↗ » ci-dessous pour traduire ce document ou un extrait sélectionné.`;
        }
        if (dom.translateStatus) dom.translateStatus.textContent = `Notice (${lang.toUpperCase()})`;
      }
    } else {
      // Extrait sélectionné personnalisé
      if (dom.translateOutput) {
        dom.translateOutput.textContent = `Extrait sélectionné (${textVal.length} caractères) :\n"${textVal}"\n\n👉 Cliquez ci-dessous sur « Traduire sur Google Traduction ↗ » ou « DeepL ↗ » pour ouvrir la traduction instantanée de ce passage sans aucune limite de taille.\n\n${officialSummary ? ('---\nNotice officielle du document :\n' + officialSummary) : ''}`;
      }
      if (dom.translateStatus) dom.translateStatus.textContent = `Extrait personnalisé (${lang.toUpperCase()})`;
    }

    // Mise à jour des liens externes sécurisés
    const textForExternal = textVal || defaultMetaText;
    if (dom.btnGoogleTranslateWeb) {
      dom.btnGoogleTranslateWeb.href = `https://translate.google.com/?sl=auto&tl=${encodeURIComponent(lang)}&text=${encodeURIComponent(textForExternal)}&op=translate`;
    }

    if (dom.btnDeeplTranslateWeb) {
      dom.btnDeeplTranslateWeb.href = `https://www.deepl.com/translator#fr/${encodeURIComponent(lang)}/${encodeURIComponent(textForExternal.slice(0, 1500))}`;
    }

    const fullDocUrl = `https://williamguindon.me/${currentTargetFile}`;
    if (dom.btnFullDocTranslateExternal) {
      dom.btnFullDocTranslateExternal.href = `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(lang)}&u=${encodeURIComponent(fullDocUrl)}`;
    }
  }

  if (dom.selectTranslateLang) {
    dom.selectTranslateLang.addEventListener('change', updateTranslateModal);
  }

  if (dom.textToTranslate) {
    dom.textToTranslate.addEventListener('input', updateTranslateModal);
  }

  if (dom.btnUseSelection) {
    dom.btnUseSelection.addEventListener('click', () => {
      const sel = getSelectedDocText();
      if (sel) {
        if (dom.textToTranslate) {
          dom.textToTranslate.value = sel;
          updateTranslateModal();
        }
      } else {
        if (dom.translateStatus) {
          dom.translateStatus.textContent = 'Aucun texte sélectionné au curseur';
          setTimeout(() => {
            updateTranslateModal();
          }, 2000);
        }
      }
    });
  }

  // Gestion de la modale de Traduction (Ouverture & Fermeture sécurisée)
  const closeTranslateModal = () => {
    if (dom.translateDialog) {
      try {
        if (typeof dom.translateDialog.close === 'function') {
          dom.translateDialog.close();
        }
      } catch (err) {}
      dom.translateDialog.removeAttribute('open');
      dom.translateDialog.style.display = 'none';
    }
  };

  const openTranslateModal = () => {
    const sel = getSelectedDocText();
    const meta = getDocMeta(currentTargetFile);
    const defaultMetaText = `${meta.title}\n\n${meta.citation || ''}\n\nType : ${meta.type || ''}`.trim();

    if (dom.textToTranslate) {
      if (sel) {
        dom.textToTranslate.value = sel;
      } else if (!dom.textToTranslate.value.trim()) {
        dom.textToTranslate.value = defaultMetaText;
      }
    }

    updateTranslateModal();
    if (dom.translateDialog) {
      dom.translateDialog.style.display = '';
      if (typeof dom.translateDialog.showModal === 'function') {
        try {
          dom.translateDialog.showModal();
        } catch (e) {
          dom.translateDialog.setAttribute('open', '');
        }
      } else {
        dom.translateDialog.setAttribute('open', '');
      }
    }
  };

  // Fermé obligatoirement par défaut
  closeTranslateModal();

  if (dom.btnTranslateDoc) {
    dom.btnTranslateDoc.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const targetDoc = currentTargetFile || 'assets/docs/observations-reponse-canada-sem26003.pdf';
      window.location.href = `lecteur.html?file=${encodeURIComponent(targetDoc)}&tab=translation&theme=${encodeURIComponent(currentTheme)}`;
    });
  }

  if (dom.btnTranslateClose) {
    dom.btnTranslateClose.addEventListener('click', closeTranslateModal);
  }

  const btnFooterTranslateClose = document.getElementById('btn-embedpdf-translate-footer-close');
  if (btnFooterTranslateClose) {
    btnFooterTranslateClose.addEventListener('click', closeTranslateModal);
  }

  if (dom.translateDialog) {
    dom.translateDialog.addEventListener('click', (e) => {
      const rect = dom.translateDialog.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        closeTranslateModal();
      }
    });
    dom.translateDialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeTranslateModal();
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

  if (dom.btnSwitchToPageTranslation) {
    dom.btnSwitchToPageTranslation.addEventListener('click', () => {
      const lang = dom.selectTranslateLang ? dom.selectTranslateLang.value : 'en';
      const theme = getCurrentTheme();
      window.location.href = `lecteur.html?file=${encodeURIComponent(currentTargetFile)}&lang=${encodeURIComponent(lang)}&theme=${encodeURIComponent(theme)}&tab=translation`;
    });
  }

  // Écoute des messages cross-fenêtres (ex: depuis dossier-journalistes.html)
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'wg_theme_change') {
      applyViewerTheme(e.data.theme || 'light');
    } else if (e.data && e.data.type === 'wg_toggle_translation') {
      const lang = dom.selectTranslateLang ? dom.selectTranslateLang.value : 'en';
      const theme = getCurrentTheme();
      window.location.href = `lecteur.html?file=${encodeURIComponent(currentTargetFile)}&lang=${encodeURIComponent(lang)}&theme=${encodeURIComponent(theme)}&tab=translation`;
    }
  });

  // Détection du mode intégré (iFrame)
  if (window.self !== window.top) {
    document.body.classList.add('is-embedded');
    const header = document.querySelector('.viewer-header');
    if (header) header.style.display = 'none';
    if (dom.container) dom.container.style.height = '100vh';
  }

  // Démarrage initial avec synchronisation du thème et assombrissement automatique
  const urlParams = new URLSearchParams(window.location.search);
  const urlTheme = urlParams.get('theme');
  const storedTheme = (function() {
    try {
      return localStorage.getItem('wg_theme') || localStorage.getItem('william-guindon-theme');
    } catch (_) { return null; }
  })();
  const initialTheme = urlTheme || storedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyViewerTheme(initialTheme);

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
