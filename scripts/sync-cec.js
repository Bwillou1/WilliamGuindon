const fs = require('fs');
const path = require('path');

const REGISTRY_URL_FR = "https://www.cec.org/fr/communications/registre-des-communications/enfouissement-de-matieres-dangereuses-a-blainville/";
const REGISTRY_URL_EN = "https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/";
const WP_API_ENDPOINT = "https://www.cec.org/fr/wp-json/wp/v2/submissions/62535";
const PETITION_URL = "https://www.change.org/p/environnement-canada-levez-le-blocage-contre-un-jeune-de-15-ans";
const PETITION_GOAL = 1500; // Objectif de 1500 signatures fixé par William Guindon
const FB_PAGE_URL = "https://www.facebook.com/williamguindon.officiel";
const STATUS_FILE_PATH = path.join(__dirname, '..', 'status.json');

/**
 * Extrait la chronologie et les documents depuis le HTML officiel de la CCE
 */
function parseCECTimeline(html) {
  if (!html) return { stepsDone: null, stepsTotal: null, items: [] };

  // 1. Progrès des étapes
  const progressMatch = html.match(/(\d+)\s+(?:sur|of)\s+(\d+)\s+étapes terminées/i) ||
                        html.match(/(\d+)\s+of\s+(\d+)\s+steps completed/i);
  const stepsDone = progressMatch ? parseInt(progressMatch[1], 10) : 4;
  const stepsTotal = progressMatch ? parseInt(progressMatch[2], 10) : 10;

  // 2. Éléments de chronologie et documents
  const regex = /<div class="timeline-item">.*?<div class="timeline-date">\s*(.*?)\s*<\/div>.*?<h3 class="timeline__step">\s*(.*?)\s*<\/h3>.*?<div class="timeline-docs">\s*(.*?)\s*<\/div>/gis;
  let match;
  const items = [];

  while ((match = regex.exec(html)) !== null) {
    const date = match[1].trim();
    const step = match[2].trim().replace(/\s+/g, ' ');
    const docsRaw = match[3].trim();
    const docs = Array.from(docsRaw.matchAll(/<a[^>]*href=[\x27"]([^\x27"]+)[\x27"][^>]*>(.*?)<\/a>\s*-\s*([^<]+)/gis)).map(m => {
      let docUrl = m[1].trim();
      if (!docUrl.startsWith('http')) {
        docUrl = 'https://www.cec.org' + (docUrl.startsWith('/') ? '' : '/') + docUrl;
      }
      return {
        titre: m[2].trim().replace(/\s+/g, ' '),
        description: m[3].trim().replace(/\s+/g, ' '),
        url: docUrl
      };
    });

    items.push({
      date,
      etape: step,
      documents: docs
    });
  }

  return { stepsDone, stepsTotal, items };
}

async function syncDossierStatus() {
  console.log(`[${new Date().toISOString()}] Lancement de la synchronisation CCE SEM-26-003...`);

  let data = {
    id_dossier: "SEM-26-003",
    titre_fr: "Enfouissement de matières dangereuses à Blainville",
    titre_en: "Hazardous Waste Disposal in Blainville",
    etat_fr: "Notification CCE du 25 nov. 2026 (89/PP) : Rejet de l'exception procédurale du Canada (art. 24.27(4)(a)) · Sommation de déposer la réponse sur le fond (délai de 60 jours écoulé)",
    etat_en: "CEC Notification of Nov 25, 2026 (89/PP): Canada's procedural objection rejected (Art. 24.27(4)(a)) · Party ordered to submit merits response (60-day deadline expired)",
    prochaine_echeance: "2026-10-16T23:59:59-04:00",
    echeance_libelle_fr: "Délai légal de 60 jours écoulé (art. 24.27(4) ACEUM) · Le Canada est sommé par la CCE (25 nov. 2026, 89/PP) de déposer sa réponse sur le fond dans les meilleurs délais",
    echeance_libelle_en: "60-day statutory deadline expired (Art. 24.27(4) CUSMA) · Canada ordered by the CEC (Nov 25, 2026, 89/PP) to submit its merits response without delay",
    derniere_mise_a_jour: "25 novembre 2026",
    jalon_historique_fr: "Premier mineur à déposer et réussir dans l'histoire des Soumissions relatives aux questions d'exécution (SEM)",
    jalon_historique_en: "First minor in SEM history to file and achieve a positive determination",
    derniere_action: {
      titre_fr: "Notification officielle CCE (A24.27(2)(3)/SEM/26-003/89/PP) : Rejet de l'exception du Canada et sommation de répondre sur le fond",
      titre_en: "Official CEC Notification (A24.27(2)(3)/SEM/26-003/89/PP): Canada's pending-proceeding claim rejected and merits response requested without delay",
      date: "25 novembre 2026",
      description_fr: "Par notification officielle de 13 pages signée le 25 novembre 2026 par Paolo Solano (A24.27(2)(3)/SEM/26-003/89/PP), le Secrétariat de la CCE conclut que la pétition environnementale no 0546 au BVG ne constitue pas une procédure judiciaire ou administrative en instance au sens de l'article 24.27(4)(a) de l'ACEUM, qu'elle n'est pas mise en œuvre par le Canada, qu'elle est désormais épuisée depuis les réponses du 10 novembre 2026 et qu'elle ne résout pas les questions d'application effective des lois fédérales (cellule 6 de Stablex). Constatant que le délai de 60 jours de l'article 24.27(4) est déjà écoulé sans informations au titre de l'alinéa 24.27(4)(b), le Secrétariat poursuit son analyse et demande au Canada de présenter le reste de sa réponse officielle dans les meilleurs délais.",
      description_en: "In a 13-page official Notification signed on November 25, 2026 by Paolo Solano (A24.27(2)(3)/SEM/26-003/89/PP), the CEC Secretariat concludes that OAG Environmental Petition No. 0546 does not constitute a pending judicial or administrative proceeding under CUSMA Article 24.27(4)(a), is not pursued by Canada, has already concluded following the November 10, 2026 ministerial responses, and cannot resolve the enforcement issues regarding Stablex Cell 6. Noting that the 60-day deadline under Article 24.27(4) has already expired without information under Article 24.27(4)(b), the Secretariat continues its review and requests that Canada submit the remainder of its official response as soon as possible.",
      document_fr: "https://williamguindon.me/dossier-journalistes.html?file=assets/docs/89-pp_fr.pdf",
      document_en: "https://williamguindon.me/en/dossier-journalistes.html?file=assets/docs/89-pp_fr.pdf",
      notification_cce_fr: "https://williamguindon.me/assets/docs/89-pp_fr.pdf",
      dossier_bgv_fr: "https://williamguindon.me/bgv",
      reponse_canada_fr: "https://williamguindon.me/viewer.html?file=assets/docs/72-rsp_fr.pdf",
      accuse_reception_cce_fr: "https://williamguindon.me/viewer.html?file=assets/docs/73-rec_fr.pdf"
    },
    progression: {
      actuelle: 4,
      total: 5,
      pourcentage: 85
    },
    registre_url_fr: REGISTRY_URL_FR,
    registre_url_en: REGISTRY_URL_EN,
    legislation_fr: [
      "Loi de 1994 sur la convention concernant les oiseaux migrateurs (LC 1994, ch 22), articles 5 et 5.1(1)",
      "Règlement sur les oiseaux migrateurs (DORS/2022-105), article 5(1)a), b) et c)",
      "Loi sur les espèces en péril (LC 2002, ch 29), préambule (paragraphe 13), articles 10.1, 18.1, 32, 33, 34, 39(1)c), 58, 73, 79 et 83",
      "Loi sur les pêches (LRC 1985, ch F-14), articles 34.4, 35, 36(3), 36(4), 37 et 38",
      "Loi canadienne sur la protection de l’environnement (1999) (LC 1999, ch 33), articles 2(1)(a.2), 2(1)(a.3), 5.1(1), 64, 68, 71, 90, 91 et 93",
      "Loi sur l’évaluation d’impact (LC 2019, ch 28, art. 1), article 2(i)(ii)(iii)",
      "Règlement sur les activités concrètes (DORS/2019-285), article 2 (articles 56 et 57 de l’annexe)",
      "Loi sur la Déclaration des Nations Unies sur les droits des peuples autochtones (LC 2021, ch 14), article 5",
      "Accord Canada-États-Unis-Mexique, article 24.4",
      "Principes directeurs nord-américains relatifs à l’intégration des connaissances écologiques traditionnelles de la Commission de coopération environnementale (2017)",
      "Loi constitutionnelle de 1982, constituant l'annexe B de la Loi sur 1982 sur le Canada (R-U 1982, c 11), article 35"
    ],
    legislation_en: [
      "Migratory Birds Convention Act, 1994 (S.C. 1994, c. 22), sections 5 and 5.1(1)",
      "Migratory Birds Regulations, 2022 (SOR/2022-105), paragraphs 5(1)(a), (b) and (c)",
      "Species at Risk Act (S.C. 2002, c. 29), preamble (paragraph 13), sections 10.1, 18.1, 32, 33, 34, 39(1)(c), 58, 73, 79 and 83",
      "Fisheries Act (R.S.C. 1985, c. F-14), sections 34.4, 35, 36(3), 36(4), 37 and 38",
      "Canadian Environmental Protection Act, 1999 (S.C. 1999, c. 33), paragraphs 2(1)(a.2), 2(1)(a.3), sections 5.1(1), 64, 68, 71, 90, 91 et 93",
      "Impact Assessment Act (S.C. 2019, c. 28, s. 1), section 2(i)(ii)(iii)",
      "Physical Activities Regulations (SOR/2019-285), section 2 (items 56 and 57 of the schedule)",
      "United Nations Declaration on the Rights of Indigenous Peoples Act (S.C. 2021, c. 14), section 5",
      "Canada-United States-Mexico Agreement, Article 24.4",
      "CEC North American Principles on Traditional Ecological Knowledge (2017)",
      "Constitution Act, 1982, being Schedule B to the Canada Act 1982 (U.K.), 1982, c. 11, section 35"
    ],
    veille_folo: {
      url: "https://folo.is/feed/1320323670668607488",
      rss: "https://folo.is/feed/1320323670668607488/rss",
      description_fr: "Abonnement public et flux RSS d'alerte lors des modifications directes sur cec.org",
      description_en: "Public subscription and live alert RSS feed for direct modifications on cec.org"
    },
    reseaux_sociaux: {
      linkedin: "https://www.linkedin.com/in/william-guindon/",
      facebook: "https://www.facebook.com/williamguindon.officiel",
      youtube: "https://www.youtube.com/@william-guindon",
      github: "https://github.com/Bwillou1",
      orcid: "https://orcid.org/0009-0009-8845-4456",
      wikidata: "https://www.wikidata.org/wiki/Q141439370"
    },
    cce_officiel: {
      wp_id: 62535,
      api_endpoint: WP_API_ENDPOINT,
      derniere_modif_wp: null,
      etapes_completees: 4,
      etapes_total: 10,
      total_pieces_officielles: 0,
      timeline_fr: [],
      timeline_en: []
    },
    petition: {
      id: "491630232",
      url: "https://www.change.org/williamguindon",
      signatures: 397,
      objectif: PETITION_GOAL,
      pourcentage: 26.5,
      restantes: 1103,
      derniere_synchro: new Date().toISOString()
    },
    social: {
      facebook: {
        url: FB_PAGE_URL,
        abonnes: 2243,
        abonnes_texte: "2 243 abonnés",
        derniere_synchro: new Date().toISOString()
      }
    },
    timestamp_sync: new Date().toISOString()
  };

  let existingData = null;
  if (fs.existsSync(STATUS_FILE_PATH)) {
    try {
      existingData = JSON.parse(fs.readFileSync(STATUS_FILE_PATH, 'utf8'));
      if (existingData.wp_modified) {
        data.wp_modified = existingData.wp_modified;
      }
      if (existingData.cce_officiel) {
        data.cce_officiel = existingData.cce_officiel;
      }
    } catch (e) {}
  }

  // 1. Interrogation de l'API REST WordPress de la CCE
  try {
    const apiRes = await fetch(WP_API_ENDPOINT, {
      headers: { 'User-Agent': 'DossierSyncBot/2.0 (williamguindon.me - Citizen Registry SEM-26-003)' }
    });

    if (apiRes.ok) {
      const wpData = await apiRes.json();
      if (wpData.modified) {
        console.log(`Dernière modification WordPress CCE détectée : ${wpData.modified}`);
        data.wp_modified = wpData.modified;
        data.cce_officiel.derniere_modif_wp = wpData.modified;
      }
    }
  } catch (err) {
    console.warn("Notice : API REST CCE non joignable immédiatement :", err.message);
  }

  // 2. Scraping et extraction structurée de la timeline officielle (FR)
  try {
    const pageResFr = await fetch(REGISTRY_URL_FR, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DossierSyncBot/2.0 (williamguindon.me)' }
    });
    if (pageResFr.ok) {
      const htmlFr = await pageResFr.text();
      const parsedFr = parseCECTimeline(htmlFr);
      if (parsedFr.items.length > 0) {
        data.cce_officiel.etapes_completees = parsedFr.stepsDone;
        data.cce_officiel.etapes_total = parsedFr.stepsTotal;
        data.cce_officiel.timeline_fr = parsedFr.items;

        let totalDocs = 0;
        parsedFr.items.forEach(it => { totalDocs += (it.documents || []).length; });
        data.cce_officiel.total_pieces_officielles = totalDocs;
        console.log(`Extraction CCE FR réussie : ${parsedFr.items.length} jalons, ${totalDocs} pièces officielles (${parsedFr.stepsDone}/${parsedFr.stepsTotal} étapes).`);

        // Publication autorisée jusqu'au 6e jalon inclus (Notification 24.27(4)(a) du 25 novembre 2026 — 89/PP)
        const EMBARGO_PUBLICATION_ACTIF = process.env.RELEASE_CCE_DECISION !== 'true';
        if (EMBARGO_PUBLICATION_ACTIF && parsedFr.items.length > 6) {
          console.log(`[EMBARGO] Nouveaux jalons détectés sur la CCE (${parsedFr.items.length} jalons). Protection éditoriale active.`);
          data.cce_officiel.mise_a_jour_detectee_embargo = true;
          data.cce_officiel.nouveaux_jalons_en_attente = parsedFr.items.slice(6);
          data.etat_fr = "Mise à jour officielle détectée sur le registre de la CCE · Analyse et annonce citoyenne à venir";
          data.etat_en = "Official update detected on the CEC registry · Review and citizen announcement upcoming";
          data.cce_officiel.timeline_fr = parsedFr.items.slice(0, 6);
        }
      }
    }
  } catch (err) {
    console.warn("Notice : Page FR CCE non joignable pour scraping :", err.message);
  }

  // 3. Scraping et extraction structurée de la timeline officielle (EN)
  try {
    const pageResEn = await fetch(REGISTRY_URL_EN, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DossierSyncBot/2.0 (williamguindon.me)' }
    });
    if (pageResEn.ok) {
      const htmlEn = await pageResEn.text();
      const parsedEn = parseCECTimeline(htmlEn);
      if (parsedEn.items.length > 0) {
        if (process.env.RELEASE_CCE_DECISION !== 'true' && parsedEn.items.length > 6) {
          data.cce_officiel.timeline_en = parsedEn.items.slice(0, 6);
        } else {
          data.cce_officiel.timeline_en = parsedEn.items;
        }
        console.log(`Extraction CCE EN réussie : ${parsedEn.items.length} jalons en anglais.`);
      }
    }
  } catch (err) {
    console.warn("Notice : Page EN CCE non joignable pour scraping :", err.message);
  }

  // Garantir la présence du jalon officiel du 25 novembre 2026 (Notification 89/PP) même si le cache CDN de cec.org tarde
  if (Array.isArray(data.cce_officiel.timeline_fr) && !data.cce_officiel.timeline_fr.some(it => (it.date || '').includes('25 novembre 2026'))) {
    data.cce_officiel.timeline_fr.push({
      date: "25 novembre 2026",
      etape: "Le Secrétariat a notifié l’Auteur et le Conseil en vertu de l’article 24.27(4)(a) de l’ACEUM que la pétition BVG ne constitue pas une procédure en instance et a demandé au Canada de présenter le reste de sa réponse officielle dans les meilleurs délais (délai de 60 jours écoulé).",
      documents: [
        {
          titre: "Notification 24.27(4)(a)",
          description: "Notification du Secrétariat à l’Auteur et au Conseil (A24.27(2)(3)/SEM/26-003/89/PP) le 25/11/2026",
          url: "https://williamguindon.me/assets/docs/89-pp_fr.pdf"
        }
      ]
    });
    data.cce_officiel.etapes_completees = Math.max(data.cce_officiel.etapes_completees || 4, 5);
    let totalDocs = 0;
    data.cce_officiel.timeline_fr.forEach(it => { totalDocs += (it.documents || []).length; });
    data.cce_officiel.total_pieces_officielles = totalDocs;
  }
  if (Array.isArray(data.cce_officiel.timeline_en) && !data.cce_officiel.timeline_en.some(it => (it.date || '').includes('25 November 2026') || (it.date || '').includes('November 25, 2026'))) {
    data.cce_officiel.timeline_en.push({
      date: "25 November 2026",
      etape: "The Secretariat notified the Submitter and the Council under CUSMA Article 24.27(4)(a) that the OAG environmental petition does not constitute a pending proceeding and requested that Canada submit the remainder of its official response without delay (60-day deadline expired).",
      documents: [
        {
          titre: "Article 24.27(4)(a) Notification",
          description: "Secretariat Notification to Submitter and Council (A24.27(2)(3)/SEM/26-003/89/PP) on 25/11/2026",
          url: "https://williamguindon.me/assets/docs/89-pp_fr.pdf"
        }
      ]
    });
  }

  // 4. Synchronisation en direct du compteur de la pétition Change.org
  try {
    const petitionRes = await fetch(PETITION_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DossierSyncBot/2.0 (williamguindon.me)' }
    });
    if (petitionRes.ok) {
      const petHtml = await petitionRes.text();
      const matchSig = petHtml.match(/"signatureCount":\s*\{\s*"displayed":\s*(\d+)/i) ||
                       petHtml.match(/"signatureState":\s*\{[^}]*"displayed":\s*(\d+)/i) ||
                       petHtml.match(/"displayed":\s*(\d+)/i);
      if (matchSig) {
        const sigCount = parseInt(matchSig[1], 10);
        data.petition.signatures = sigCount;
        data.petition.objectif = PETITION_GOAL;
        data.petition.pourcentage = parseFloat(((sigCount / PETITION_GOAL) * 100).toFixed(1));
        data.petition.restantes = Math.max(0, PETITION_GOAL - sigCount);
        data.petition.derniere_synchro = new Date().toISOString();
        console.log(`Synchronisation Pétition Change.org : ${sigCount} / ${PETITION_GOAL} signatures (${data.petition.pourcentage}%).`);
      }
    }
  } catch (err) {
    console.warn("Notice : Pétition Change.org non joignable immédiatement :", err.message);
    if (existingData?.petition) {
      data.petition = existingData.petition;
    }
  }

  // 5. Synchronisation du nombre d'abonnés Facebook officiel
  try {
    const fbRes = await fetch(FB_PAGE_URL, {
      headers: { 'User-Agent': 'facebookexternalhit/1.1' }
    });
    if (fbRes.ok) {
      const fbHtml = await fbRes.text();
      const matchFb = fbHtml.match(/content="[^"]*?([0-9,]+)\s*(?:followers|abonn[eé]s)/i);
      if (matchFb) {
        const fbCount = parseInt(matchFb[1].replace(/,/g, ""), 10);
        data.social = data.social || {};
        data.social.facebook = {
          url: FB_PAGE_URL,
          abonnes: fbCount,
          abonnes_texte: `${fbCount.toLocaleString('fr-CA')} abonnés`,
          derniere_synchro: new Date().toISOString()
        };
        console.log(`Synchronisation Facebook officiel : ${fbCount} abonnés.`);
      }
    }
  } catch (err) {
    console.warn("Notice : Page Facebook non joignable immédiatement :", err.message);
    if (existingData?.social?.facebook) {
      data.social = existingData.social;
    }
  }

  // 6. Vérifier s'il y a un réel changement par rapport au fichier existant
  const hasChanged = !existingData ||
    existingData.wp_modified !== data.wp_modified ||
    existingData.petition?.signatures !== data.petition?.signatures ||
    existingData.petition?.objectif !== data.petition?.objectif ||
    existingData.social?.facebook?.abonnes !== data.social?.facebook?.abonnes ||
    existingData.cce_officiel?.derniere_modif_wp !== data.cce_officiel?.derniere_modif_wp ||
    existingData.cce_officiel?.etapes_completees !== data.cce_officiel?.etapes_completees ||
    existingData.cce_officiel?.total_pieces_officielles !== data.cce_officiel?.total_pieces_officielles ||
    JSON.stringify(existingData.cce_officiel?.timeline_fr) !== JSON.stringify(data.cce_officiel?.timeline_fr) ||
    existingData.etat_fr !== data.etat_fr ||
    existingData.prochaine_echeance !== data.prochaine_echeance;

  if (hasChanged) {
    data.timestamp_sync = new Date().toISOString();
    fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[${new Date().toISOString()}] Synchronisation status.json réussie (Mise à jour enregistrée).`);
  } else {
    console.log(`[${new Date().toISOString()}] Aucun changement détecté depuis la CCE. status.json inchangé (évite les commits fantômes).`);
  }

  // Synchronisation des dates dynamiques (âge au 3 août, accords CCE à Noël)
  try {
    require('./update-dynamic-dates');
  } catch (e) {
    console.warn("Notice : Échec synchronisation dates dynamiques :", e.message);
  }
}

syncDossierStatus();
