

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
    etat_fr: "Réponse du Canada déposée le 16 octobre 2026 · Examen par le Secrétariat (art. 24.28)",
    etat_en: "Party Response submitted on October 16, 2026 · Secretariat Review (Art. 24.28)",
    prochaine_echeance: "2026-11-10T00:00:00-05:00",
    echeance_libelle_fr: "10 novembre 2026 (Réponse ministérielle fédérale Pétition 546 CEDD)",
    echeance_libelle_en: "November 10, 2026 (Federal ministerial response to OAG Petition 546)",
    derniere_mise_a_jour: "16 octobre 2026",
    jalon_historique_fr: "Premier mineur à déposer et réussir dans l'histoire des Soumissions relatives aux questions d'exécution (SEM)",
    jalon_historique_en: "First minor in SEM history to file and achieve a positive determination",
    derniere_action: {
      titre_fr: "Dépôt de la réponse du Canada (72-RSP) et accusé de réception CCE (73-REC)",
      titre_en: "Filing of Canada's Response (72-RSP) & CEC Acknowledgement (73-REC)",
      date: "16 octobre 2026",
      description_fr: "Le gouvernement du Canada a déposé sa réponse officielle le 16 octobre 2026. Il demande au Secrétariat de mettre fin à la communication SEM-26-003 ou de la reporter, en faisant valoir que l'auteur poursuit la pétition environnementale no 0546 auprès du BVG/CEDD dont la réponse ministérielle est due le 10 novembre 2026. Le Secrétariat de la CCE a accusé réception et examine la suite de la procédure en vertu de l'article 24.28.",
      description_en: "The Government of Canada filed its official response on October 16, 2026, requesting termination or deferral of SEM-26-003 citing ongoing domestic Environmental Petition 0546 with the OAG/CESD due November 10, 2026. The CEC Secretariat acknowledged receipt and is evaluating under Article 24.28.",
      document_fr: "https://williamguindon.me/viewer.html?file=assets/docs/72-rsp_fr.pdf",
      document_en: "https://williamguindon.me/viewer.html?file=assets/docs/72-rsp_en.pdf"
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
