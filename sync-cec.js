

const fs = require('fs');
const path = require('path');

const REGISTRY_URL_FR = "https://www.cec.org/fr/communications/registre-des-communications/enfouissement-de-matieres-dangereuses-a-blainville/";
const REGISTRY_URL_EN = "https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/";
const WP_API_ENDPOINT = "https://www.cec.org/fr/wp-json/wp/v2/submissions/62535";
const STATUS_FILE_PATH = path.join(__dirname, 'status.json');

async function syncDossierStatus() {
  console.log(`[${new Date().toISOString()}] Lancement de la synchronisation CCE SEM-26-003...`);

  let data = {
    id_dossier: "SEM-26-003",
    titre_fr: "Enfouissement de matières dangereuses à Blainville",
    titre_en: "Hazardous Waste Disposal in Blainville",
    etat_fr: "Réponse de la Partie demandée (art. 24.27(3))",
    etat_en: "Response requested from Party (Art. 24.27(3))",
    decision_positive: true,
    prochaine_echeance: "2026-10-16T23:59:59-04:00",
    echeance_libelle_fr: "16 octobre 2026",
    echeance_libelle_en: "October 16, 2026",
    derniere_mise_a_jour: "17 août 2026",
    jalon_historique_fr: "Premier mineur à déposer et réussir dans l'histoire des Soumissions relatives aux questions d'exécution (SEM)",
    jalon_historique_en: "First minor in SEM history to file and achieve a positive determination",
    derniere_action: {
      titre_fr: "Détermination du Secrétariat en vertu de l'article 24.27(2) et (3)",
      titre_en: "Secretariat Determination under Article 24.27(2) and (3)",
      date: "17 août 2026",
      description_fr: "Le Secrétariat a jugé que la communication satisfaisait aux critères énoncés à l'article 24.27(2) et a demandé une réponse au Canada en vertu de l'article 24.27(3) d'ici le 16 octobre 2026.",
      description_en: "The Secretariat determined that the submission satisfies the criteria set out in Article 24.27(2) and requested a response from Canada under Article 24.27(3) by October 16, 2026.",
      document_fr: "https://www.cec.org/wp-content/uploads/wpallimport/files/26-2-det2_fr.pdf",
      document_en: "https://www.cec.org/wp-content/uploads/wpallimport/files/26-2-det2_en.pdf"
    },
    progression: {
      actuelle: 3,
      total: 5,
      pourcentage: 60
    },
    registre_url_fr: REGISTRY_URL_FR,
    registre_url_en: REGISTRY_URL_EN,
    reseaux_sociaux: {
      linkedin: "https://www.linkedin.com/in/william-guindon/",
      facebook: "https://www.facebook.com/profile.php?id=61591437730054",
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
    existingData.prochaine_echeance !== data.prochaine_echeance;

  if (hasChanged) {
    data.timestamp_sync = new Date().toISOString();
    fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[${new Date().toISOString()}] Synchronisation status.json réussie (Mise à jour enregistrée).`);
  } else {
    console.log(`[${new Date().toISOString()}] Aucun changement détecté depuis la CCE. status.json inchangé (évite les commits fantômes).`);
  }
}

syncDossierStatus();
