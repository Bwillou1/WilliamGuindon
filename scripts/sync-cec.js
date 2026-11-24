const fs = require('fs');
const path = require('path');

const REGISTRY_URL_FR = "https://www.cec.org/fr/communications/registre-des-communications/enfouissement-de-matieres-dangereuses-a-blainville/";
const REGISTRY_URL_EN = "https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/";
const WP_API_ENDPOINT = "https://www.cec.org/fr/wp-json/wp/v2/submissions/62535";
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
    etat_fr: "Réponses fédérales Pétition 0546 reçues (10 nov. 2026) & Observations complémentaires transmises · Examen par le Secrétariat (art. 24.28)",
    etat_en: "Federal Petition 0546 Responses received (Nov 10, 2026) & Supplementary Observations submitted · Secretariat Review (Art. 24.28)",
    prochaine_echeance: "2027-01-15T00:00:00-05:00",
    echeance_libelle_fr: "Examen CCE en cours (60 jours ouvrables, art. 24.28 ACEUM) · Réponses Pétition 0546 reçues le 10 nov. 2026 (/bgv)",
    echeance_libelle_en: "CEC Secretariat Review underway (60 business days, Art. 24.28 CUSMA) · Petition 0546 responses received Nov 10, 2026 (/bgv)",
    derniere_mise_a_jour: "10 novembre 2026",
    jalon_historique_fr: "Premier mineur à déposer et réussir dans l'histoire des Soumissions relatives aux questions d'exécution (SEM)",
    jalon_historique_en: "First minor in SEM history to file and achieve a positive determination",
    derniere_action: {
      titre_fr: "Réponses d'ECCC et du MPO à la pétition 0546 reçues (10 nov. 2026) et observations complémentaires transmises à la CCE",
      titre_en: "ECCC and DFO responses to Petition 0546 received (Nov 10, 2026) and supplementary observations submitted to the CEC",
      date: "10 novembre 2026",
      description_fr: "Le 10 novembre 2026, ECCC et le MPO ont transmis leurs réponses aux 24 questions de la pétition environnementale no 0546 (BVG/CEDD), indiquant notamment l'absence d'inspection sur le terrain, d'échantillonnage indépendant et d'autorisation fédérale pour la cellule 6. William Guindon a transmis le même jour ses observations complémentaires au Secrétariat de la CCE démontrant que le motif d'attente invoqué par le Canada le 16 octobre 2026 (72-RSP) n'a plus d'objet et demandant la recommandation d'un dossier factuel en vertu de l'article 24.28 de l'ACEUM.",
      description_en: "On November 10, 2026, ECCC and DFO provided their responses to the 24 questions of Environmental Petition No. 0546 (OAG/CESD), indicating no on-site inspection, no independent sampling, and no federal authorization for Cell 6. On the same day, William Guindon submitted supplementary observations to the CEC Secretariat showing that the deferral ground invoked by Canada on October 16, 2026 (72-RSP) is now moot and requesting a factual record recommendation under CUSMA Article 24.28.",
      document_fr: "https://williamguindon.me/bgv",
      document_en: "https://williamguindon.me/en/bgv.html",
      reponse_canada_fr: "https://williamguindon.me/viewer.html?file=assets/docs/72-rsp_fr.pdf",
      accuse_reception_cce_fr: "https://williamguindon.me/viewer.html?file=assets/docs/73-rec_fr.pdf"
    },
    progression: {
      actuelle: 4,
      total: 5,
      pourcentage: 80
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
        data.cce_officiel.timeline_en = parsedEn.items;
        console.log(`Extraction CCE EN réussie : ${parsedEn.items.length} jalons en anglais.`);
      }
    }
  } catch (err) {
    console.warn("Notice : Page EN CCE non joignable pour scraping :", err.message);
  }

  // 4. Vérifier s'il y a un réel changement par rapport au fichier existant
  const hasChanged = !existingData ||
    existingData.wp_modified !== data.wp_modified ||
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
