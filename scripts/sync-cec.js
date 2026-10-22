

const fs = require('fs');
const path = require('path');

const REGISTRY_URL_FR = "https://www.cec.org/fr/communications/registre-des-communications/enfouissement-de-matieres-dangereuses-a-blainville/";
const REGISTRY_URL_EN = "https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/";
const WP_API_ENDPOINT = "https://www.cec.org/fr/wp-json/wp/v2/submissions/62535";
const STATUS_FILE_PATH = path.join(__dirname, '..', 'status.json');

async function syncDossierStatus() {
  console.log(`[${new Date().toISOString()}] Lancement de la synchronisation CCE SEM-26-003...`);

  let data = {
    id_dossier: "SEM-26-003",
    titre_fr: "Enfouissement de matières dangereuses à Blainville",
    titre_en: "Hazardous Waste Disposal in Blainville",
    etat_fr: "Réponse du Canada déposée (16 oct. 2026) & Réplique citoyenne (17 oct. 2026) · Examen par le Secrétariat (art. 24.28)",
    etat_en: "Party Response submitted (Oct 16, 2026) & Submitter Observations (Oct 17, 2026) · Secretariat Review (Art. 24.28)",
    prochaine_echeance: "2026-11-10T00:00:00-05:00",
    echeance_libelle_fr: "10 novembre 2026 (Réponse ministérielle fédérale Pétition 0546 CEDD/BVG) & Suivi parlementaire (Nov. 2026)",
    echeance_libelle_en: "November 10, 2026 (Federal ministerial response to OAG Petition 0546) & Parliamentary meetings (Nov. 2026)",
    derniere_mise_a_jour: "22 octobre 2026",
    jalon_historique_fr: "Premier mineur à déposer et réussir dans l'histoire des Soumissions relatives aux questions d'exécution (SEM)",
    jalon_historique_en: "First minor in SEM history to file and achieve a positive determination",
    derniere_action: {
      titre_fr: "Réplique citoyenne déposée (17 oct. 2026) suite à la réponse du Canada (72-RSP) et rencontres parlementaires confirmées (nov. 2026)",
      titre_en: "Submitter's Legal Observations filed (Oct 17, 2026) following Canada's Response (72-RSP) & Parliamentary meetings confirmed (Nov 2026)",
      date: "17 octobre 2026",
      description_fr: "Suite au dépôt de la réponse du Canada le 16 octobre 2026 (72-RSP, 59 p.) demandant la clôture ou le report du dossier au motif du recours municipal de Blainville et de la pétition fédérale no 0546 (BVG/CEDD), William Guindon a transmis dès le 17 octobre 2026 son mémoire d'observations démontrant l'absence d'identité d'objet sous l'art. 24.27(4)(a) et demandant un dossier factuel (art. 24.28). Deux rencontres parlementaires de suivi sont confirmées pour novembre 2026 avec Nadine Le Gal et Madeleine Chenette.",
      description_en: "Following Canada's official response on October 16, 2026 (72-RSP, 59 p.) requesting termination or deferral citing Blainville's municipal judicial review and federal Environmental Petition 0546 (OAG/CESD), William Guindon submitted his legal observations on October 17, 2026 demonstrating the inapplicability of Art. 24.27(4)(a) and requesting a factual record under Art. 24.28. Two parliamentary follow-up meetings are confirmed for November 2026 with Nadine Le Gal and Madeleine Chenette.",
      document_fr: "https://williamguindon.me/viewer.html?file=assets/docs/observations-reponse-canada-sem26003.pdf",
      document_en: "https://williamguindon.me/viewer.html?file=assets/docs/72-rsp_en.pdf",
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
    veille_folo: {
      url: "https://folo.is/feed/1320323670668607488",
      rss: "https://folo.is/feed/1320323670668607488/rss",
      description_fr: "Abonnement public et flux RSS d'alerte lors des modifications directes sur cec.org",
      description_en: "Public subscription and live alert RSS feed for direct modifications on cec.org"
    },
    reseaux_sociaux: {
      linkedin: "https://www.linkedin.com/in/william-guindon/",
      facebook: "https://www.facebook.com/williamguindon.officiel",
      youtube: "https://www.youtube.com/@william-guindon"
    },
    timestamp_sync: new Date().toISOString()
  };

  let existingData = null;
  if (fs.existsSync(STATUS_FILE_PATH)) {
    try {
      existingData = JSON.parse(fs.readFileSync(STATUS_FILE_PATH, 'utf8'));
    } catch (e) {}
  }

  try {
    const apiRes = await fetch(WP_API_ENDPOINT, {
      headers: { 'User-Agent': 'DossierSyncBot/1.0 (williamguindon.me)' }
    });

    if (apiRes.ok) {
      const wpData = await apiRes.json();
      if (wpData.modified) {
        console.log(`Dernière modification WordPress CCE détectée : ${wpData.modified}`);
        data.wp_modified = wpData.modified;
      }
    }
  } catch (err) {
    console.warn("Notice : API REST CCE non joignable immédiatement, utilisation du statut vérifié local.", err.message);
  }

  // Vérifier s'il y a un réel changement par rapport au fichier existant
  const hasChanged = !existingData ||
    existingData.wp_modified !== data.wp_modified ||
    existingData.etat_fr !== data.etat_fr ||
    existingData.prochaine_echeance !== data.prochaine_echeance ||
    existingData.derniere_action?.document_fr !== data.derniere_action?.document_fr ||
    JSON.stringify(existingData.veille_folo) !== JSON.stringify(data.veille_folo) ||
    JSON.stringify(existingData.reseaux_sociaux) !== JSON.stringify(data.reseaux_sociaux);

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
