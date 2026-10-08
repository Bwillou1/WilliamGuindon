/**
 * scripts/generate-corpus-api.js
 * Générateur de l'API publique ouverte pour les modèles d'IA et développeurs :
 * - apis.json & .well-known/apis.json (Conforme au standard apisjson.org)
 * - openapi.json & openapi.yaml (Spécification OpenAPI 3.1.0 complète)
 * - api/corpus.json & api/v1/corpus.json (Corpus intégral plein texte de tout le site)
 * - api/documents.json & api/v1/documents.json (Répertoire exhaustif des 222 pièces probatoires)
 * - api/index.html (Portail interactif de documentation de l'API)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 1. Liste des 222 pièces probatoires (source officielle dossier-journalistes.html)
const FALLBACK_DOCS = [
  "01_Especes_Menacees_Biodiversite/G01_Couleuvre_tachetee_BIFFE_AUDIT.png",
  "01_Especes_Menacees_Biodiversite/G02_Grebe_esclavon_BIFFE_AUDIT.csv",
  "01_Especes_Menacees_Biodiversite/G03_Monarque_BIFFE_AUDIT.csv",
  "01_Especes_Menacees_Biodiversite/G04_Tortue_serpentine_BIFFE_AUDIT.csv",
  "01_Especes_Menacees_Biodiversite/G05_Fiche_Statut_Espece_LEP_BIFFE_AUDIT.png",
  "01_Especes_Menacees_Biodiversite/G06_observations-752640_BIFFE_AUDIT.csv",
  "01_Especes_Menacees_Biodiversite/G07_515-2025-rae_BIFFE_AUDIT.pdf",
  "01_Especes_Menacees_Biodiversite/G08_2025-03-18_Memoire_PL93-2_BIFFE_AUDIT.pdf",
  "01_Especes_Menacees_Biodiversite/G09_Article_LeDevoir_Especes_Menacees_BIFFE_AUDIT.pdf",
  "01_Especes_Menacees_Biodiversite/G10_Tableau_Especes_Menacees_Federal_2026-07-06_BIFFE_AUDIT.pdf",
  "01_Especes_Menacees_Biodiversite/G11_Rapport_371_BAPE_2026-07-06_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/Capture_2026-07-16_11h49.00_BIFFE_AUDIT.png",
  "02_Contaminations_Fuites_Stablex_Medias/Capture_2026-07-16_12h14.48_BIFFE_AUDIT.png",
  "02_Contaminations_Fuites_Stablex_Medias/Capture_2026-07-16_12h32.50_BIFFE_AUDIT.png",
  "02_Contaminations_Fuites_Stablex_Medias/Dossier_Stablex_financement_republicains_TVA_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H01_Blainville_Groupes_Plainte_Stablex_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H02_Debordement_Eau_Coloree_Stablex_JDM_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H03_Plainte_Groupes_Environnementaux_CityNews_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H04_Metaux_Toxiques_Echantillonnages_Radio_Canada_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H05_Des_poissons_proteges_LeDevoir_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H06_Evacuation_Trois_Entreprises_JDM_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H07_Explosion_Blainville_6_Blesses_TVA_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H08_Metaux_Lourds_Contamination_Inquietante_TVA_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H09_Metaux_Lourds_Eaux_Blainville_Nord_Info_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H13_Communique_Fuite_Toxique_Climat_Quebec_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H14_Stablex_Repond_Allegations_CIME_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H15_Metaux_Toxiques_Detectes_Climat_Quebec_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H16_Projet_Loi_Aide_Stablex_Radio_Canada_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H17_Gestion_Dechets_Dangereux_Radio_Canada_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H18_Benoit_Charette_Accuse_Blainville_LeDevoir_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H19_Contamination_Inquietante_Stablex_TVA_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H20_Examen_Impacts_Poisson_LeDevoir_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H21_Campagne_Echantillonnage_Presse_Toi_A_Gauche_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H22_Bunkers_Plan_Bouchard_Guerre_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/H23_Site_Camp_Bouchard_Decontamination(x)_Munitions_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/Martine_Oullet_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/Protection_dune_tourbiere_a_Blainville_Le_combat_dun_adolescent_a_lONU_BIFFE_AUDIT.pdf",
  "02_Contaminations_Fuites_Stablex_Medias/Stablex_ecoblanchiment_Presse_toi_a_gauche_BIFFE_AUDIT.pdf",
  "03_Etudes_Ecologiques_Cartes_Tourbiere/I01_Fiche_Technique_Suivi_2026-07-06_BIFFE_AUDIT.pdf",
  "03_Etudes_Ecologiques_Cartes_Tourbiere/I02_Etude_UQAM_COBAMIL_Esker_Ste_Therese_BIFFE_AUDIT.pdf",
  "03_Etudes_Ecologiques_Cartes_Tourbiere/I03_Memoire_UQAM_Geomorphologie_Laurentides_BIFFE_AUDIT.pdf",
  "03_Etudes_Ecologiques_Cartes_Tourbiere/I04_Rapport_Final_Caracterisation_Milieux_Naturels_2014_BIFFE_AUDIT.pdf",
  "03_Etudes_Ecologiques_Cartes_Tourbiere/I05_Carte_Especes_Susceptibles_Menacees_BIFFE_AUDIT.jpg",
  "03_Etudes_Ecologiques_Cartes_Tourbiere/I06_Carte_Valeur_Ecologique_Tourbiere_BIFFE_AUDIT.pdf",
  "03_Etudes_Ecologiques_Cartes_Tourbiere/I07_Carte_Localisation_Milieux_Naturels_Blainville_BIFFE_AUDIT.png",
  "03_Etudes_Ecologiques_Cartes_Tourbiere/I08_Carte_Obsers_BIFFE_AUDIT.pdf",
  "03_Etudes_Ecologiques_Cartes_Tourbiere/I09_Memoire_Collectif_Projet_Loi_93_Mars2025_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/2flush_BIFFE_AUDIT.mp4",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/62-DET2_fr_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/Capture d’écran, le 2026-07-16 à 12.14.48_BIFFE_AUDIT.png",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/Capture d’écran, le 2026-07-16 à 12.32.50_BIFFE_AUDIT.png",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/DM30_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/Des groupes portent plainte contre Stablex et dénoncent le désengagement du ministère de l’Environnement - Eau Secours_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/EauSecours_Groupes_portent_plainte_Stablex_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/F01_2026-06-10_Stablex_Rapport-WaterShed-1_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/F02_Resultats_Tests_Citoyens_Blainville_Stable_BIFFE_AUDIT.kml",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/Firme_externe_embauchee_par_la_ville_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/La science citoyenne expose la pollution causée par une entreprise de Blainville - Pivot_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/PHOTO_PATRICK_SANFAÇON_LA_PRESSE_BIFFE_AUDIT.png",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/Rencontre_expert_2026-07-07_version_longue_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/Ressource_visuelle_BIFFE_AUDIT.pdf",
  "04_Preuves_Citoyennes_Tests_Eau_Rapports/reddit_BIFFE_AUDIT.pdf",
  "05_Images_Satellites_Sentinel2_NDVI/Annexe_Pieces_Justificatives_Complement_SEM-26-003_BIFFE_AUDIT.csv",
  "05_Images_Satellites_Sentinel2_NDVI/Complement_information_SEM-26-003_BIFFE_AUDIT.pdf",
  "05_Images_Satellites_Sentinel2_NDVI/J01_2026-04-24_Sentinel-2_L2A_True_Color_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J02_2026-04-24_Sentinel-2_L2A_NDVI_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J03_2026-06-13_Sentinel-2_L2A_True_Color_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J04_2026-06-13_Sentinel-2_L2A_NDVI_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J05_2026-06-13_Sentinel-2_L2A_SWIR_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J06_2026-07-23_Sentinel-2_L2A_True_Color_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J07_2026-07-23_Sentinel-2_L2A_NDVI_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J08_2026-09-11_Sentinel-2_L2A_True_Color_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J09_2026-09-11_Sentinel-2_L2A_NDVI_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J10_2026-09-11_Sentinel-2_L2A_SWIR_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J11_2026-04-24_au_2026-09-11_Sentinel-2_L2A_Timelapse_BIFFE_AUDIT.gif",
  "05_Images_Satellites_Sentinel2_NDVI/J12_2026-04-24_au_2026-09-11_Sentinel-2_L2A_Timelapse_BIFFE_AUDIT.mp4",
  "05_Images_Satellites_Sentinel2_NDVI/J13_2026-09-13_Vecteur_Emprise_Etude_Stablex_Cellule6_BIFFE_AUDIT.geojson",
  "05_Images_Satellites_Sentinel2_NDVI/J14_2026-09-13_Capture_Serie_Spectrale_NDVI_6M_Mars-Sept2026_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J15_2026-09-13_Capture_Serie_Spectrale_NDVI_3M_Juin-Sept2026_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J16_2026-09-13_Capture_Serie_Spectrale_NDVI_3M_Mars-Juin2026_BIFFE_AUDIT.png",
  "05_Images_Satellites_Sentinel2_NDVI/J17_2026-03-11_au_2026-09-11_Sentinel-2_L2A_NDVI_Donnees_Brutes_6M_BIFFE_AUDIT.csv",
  "05_Images_Satellites_Sentinel2_NDVI/J18_2026-06-11_au_2026-09-11_Sentinel-2_L2A_NDVI_Donnees_Brutes_3M_Ete_BIFFE_AUDIT.csv",
  "05_Images_Satellites_Sentinel2_NDVI/J19_2026-03-13_au_2026-06-13_Sentinel-2_L2A_NDVI_Donnees_Brutes_3M_Printemps_BIFFE_AUDIT.csv",
  "06_Demarches_Juridiques_ONU_ECCC/2026-06-30_Lettre_reponse_M_Guindon_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/Capture_2026-07-16_CanLII_BIFFE_AUDIT.png",
  "06_Demarches_Juridiques_ONU_ECCC/D01_Accuse_Reception_Enquete_Stablex_03Juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D02_Demande_Enquete_Autorites_03Juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D03_Suivi_Demande_Enquete_10Juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D04_Demande_Clarification_STB_16Juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D05_Notification_Ecrite_Prealable_CCE_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D06_Accuse_Notification_ECCC_19Juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D07_Accuse_Automatique_MERN_19Juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D08_Accuse_Automatique_MELCCFP_19Juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D09_Accuse_Automatique_PMO_19Juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D0_Formulaire_Demande_Acces_Redacted_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D0_Reponse_Acces_Blainville_30Juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D10_minister_19juin2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D11_Demande_Rencontre_ECCC_2026-06-28_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D11_Demande_Rencontre_ECCC_2026-06-28_BIFFE.png",
  "06_Demarches_Juridiques_ONU_ECCC/D12_Accuse_Reception_ECCC_2026-06-28_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D13_Rapport_Soumission_ONU_2026-06-28_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D14_Resume_Soumission_Environnementale_2026-06-28_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/D14_Resume_Soumission_Environnementale_2026-06-28_BIFFE.png",
  "06_Demarches_Juridiques_ONU_ECCC/E02_Demande_Precisions_Ville_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/Formulaire_accesV2026_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/Gmail_Demande_acces_Lacs_Fauvel_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/Gmail_RE_Soumission_petition_environnementale_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/Lettre_CEDD_au_petitionnaire_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/Petition_environnementale_Stablex_Blainville_BIFFE.pdf",
  "06_Demarches_Juridiques_ONU_ECCC/Reponse_partielle_ministere_BIFFE.pdf",
  "07_Lettres_Appui_Communications_CCE/09-l-appui-sem-26-003_fr_redacted.pdf",
  "07_Lettres_Appui_Communications_CCE/26-3-det2_fr (2).pdf",
  "07_Lettres_Appui_Communications_CCE/26-3-rsub_fr_redacted (5).pdf",
  "08_Audit_Tracabilite_Registres/00_CHAIN_OF_CUSTODY.sha256",
  "08_Audit_Tracabilite_Registres/00_RAPPORT_AUDIT_GFIH_COMPL.md",
  "08_Audit_Tracabilite_Registres/00_REGISTRE_DES_BIFFURES.pdf",
  "08_Audit_Tracabilite_Registres/00_REGISTRE_DES_BIFFURES.txt",
  "A - B - C/00_CHAIN_OF_CUSTODY.pdf",
  "A - B - C/00_CHAIN_OF_CUSTODY.sha256",
  "A - B - C/00_RAPPORT_AUDIT_ABC.md",
  "A - B - C/00_REGISTRE_DES_BIFFURES.pdf",
  "A - B - C/00_REGISTRE_DES_BIFFURES.txt",
  "A - B - C/3026512.pdf",
  "A - B - C/A01_Etude_Impact_Cellule6_Nov2020.pdf",
  "A - B - C/A02_Analyse_Air_Ambiant_Stablex_Dec2024.pdf",
  "A - B - C/A03_Rapport_Inspection_Stablex.pdf",
  "A - B - C/A04_Mise_Jour_Description_Impacts_Juin2022.pdf",
  "A - B - C/B01_Caracterisation_Sols_Dec2025.pdf",
  "A - B - C/B02_Caracterisation_Eaux_Surface_Dec2025.pdf",
  "A - B - C/B03_Caracterisation_Milieu_Naturel_Oct2023.pdf",
  "A - B - C/C01_Courriel_Suivi_57.pdf",
  "A - B - C/C02_Demande_Engagements_DGEES_45.pdf",
  "A - B - C/C03_Complements_Information_MELCCFP_44.pdf",
  "A - B - C/C04_Projet_Reechantillonnage_Urgence_42.pdf",
  "A - B - C/C05_Requetes_Consultation_Publique_31.pdf",
  "A - B - C/C06_Rapport_Final_Echantillonnage_MELCCFP.pdf",
  "A - B - C/C07_Certificat_Autorisation_Stablex_1982.pdf",
  "D - E - F/00_CHAIN_OF_CUSTODY.pdf",
  "D - E - F/00_CHAIN_OF_CUSTODY.sha256",
  "D - E - F/00_RAPPORT_AUDIT_DEF.md",
  "D - E - F/00_REGISTRE_DES_BIFFURES.pdf",
  "D - E - F/00_REGISTRE_DES_BIFFURES.txt",
  "D - E - F/D01_Accuse_Reception_Enquete_Stablex_03Juin2026.pdf",
  "D - E - F/D02_Demande_Enquete_Autorites_03Juin2026.pdf",
  "D - E - F/D03_Suivi_Demande_Enquete_10Juin2026.pdf",
  "D - E - F/D04_Demande_Clarification_STB_16Juin2026.pdf",
  "D - E - F/D05_Notification_Ecrite_Prealable_CCE.pdf",
  "D - E - F/D06_Accuse_Notification_ECCC_19Juin2026.pdf",
  "D - E - F/D07_Accuse_Automatique_MERN_19Juin2026.pdf",
  "D - E - F/D08_Accuse_Automatique_MELCCFP_19Juin2026.pdf",
  "D - E - F/D09_Accuse_Automatique_PMO_19Juin2026.pdf",
  "D - E - F/D10_Transmission_MERN_MELCCFP_19Juin2026.pdf",
  "D - E - F/D11_Demande_Rencontre_ECCC_2026-06-28.pdf",
  "D - E - F/D12_Accuse_Reception_ECCC_2026-06-28.pdf",
  "D - E - F/D13_Rapport_Soumission_ONU_2026-06-28.pdf",
  "D - E - F/D14_Resume_Soumission_Environnementale_2026-06-28.pdf",
  "D - E - F/E01_Demande_Information_Ville_Blainville.pdf",
  "D - E - F/E02_Demande_Precisions_Ville.pdf",
  "D - E - F/E03_Resolution_Conseil_Municipal_Blainville_Opposant_Stablex.pdf",
  "D - E - F/F01_Rapport_Analytique_Eau_Puits_2026.pdf",
  "D - E - F/F02_Historique_Plaintes_Odeurs_Lixiviat.pdf",
  "G - H - I - J/00_CHAIN_OF_CUSTODY.pdf",
  "G - H - I - J/00_CHAIN_OF_CUSTODY.sha256",
  "G - H - I - J/00_RAPPORT_AUDIT_GHIJ.md",
  "G - H - I - J/00_REGISTRE_DES_BIFFURES.pdf",
  "G - H - I - J/00_REGISTRE_DES_BIFFURES.txt",
  "G - H - I - J/G01_Inventaire_Faunique_Tourbiere_2024.pdf",
  "G - H - I - J/G02_Etude_Avifaune_Nidification.pdf",
  "G - H - I - J/G03_Herpetofaune_Lacs_Fauvel.pdf",
  "G - H - I - J/H01_Articles_Presse_Locale_2024_2026.pdf",
  "G - H - I - J/H02_Reportage_Tele_Fuites_Lixiviat.pdf",
  "G - H - I - J/I01_Photos_Aeriennes_Historiques_1965_2025.pdf",
  "G - H - I - J/I02_Cartographie_SIG_Zones_Humides.pdf",
  "G - H - I - J/J01_Donnees_Brutes_Spectrometrie.csv",
  "G - H - I - J/J02_Fiches_Metadonnees_Sentinel.json",
  "00_INDEX_GENERAL_PIECES_JUSTIFICATIVES.pdf",
  "00_SYNTHESE_GLOBALE_DOSSIER_SEM26003.pdf"
];

const HTML_ENTITIES_MAP = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' '
};

function decodeHtmlEntities(str) {
  return str.replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/gi, (match) => {
    const lower = match.toLowerCase();
    return HTML_ENTITIES_MAP[lower] || (lower === '&#39;' ? "'" : match);
  });
}

function stripNonTextBlocks(html) {
  let out = '';
  let i = 0;
  const len = html.length;
  while (i < len) {
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      i = end === -1 ? len : end + 3;
      continue;
    }
    const match = html.slice(i, i + 15).match(/^<(script|style|svg|noscript)\b/i);
    if (match) {
      const tag = match[1].toLowerCase();
      const closeTag = '</' + tag + '>';
      const end = html.toLowerCase().indexOf(closeTag, i);
      i = end === -1 ? len : end + closeTag.length;
      continue;
    }
    out += html[i];
    i++;
  }
  return out;
}

function extractCleanText(html) {
  let clean = html;

  const mainMatch = clean.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) {
    clean = mainMatch[0];
  } else {
    const headEnd = clean.toLowerCase().indexOf('</head>');
    if (headEnd !== -1) {
      clean = clean.substring(headEnd + 7);
    }
  }

  // Suppression des blocs non textuels et commentaires via analyseur linéaire sécurisé
  clean = stripNonTextBlocks(clean);

  // Conservation de la structure des paragraphes et listes
  clean = clean.replace(/<\/(?:h[1-6]|p|div|section|article|li|tr|blockquote)>/gi, '\n')
               .replace(/<br\s*[\/]?>/gi, '\n')
               .replace(/<li\b[^>]*>/gi, '• ')
               .replace(/<[^>]+>/g, ' ');

  // Décodage des entités HTML en une seule passe pour éviter le double unescaping (CodeQL Alert #69)
  clean = decodeHtmlEntities(clean);

  return clean.replace(/[ \t]+/g, ' ')
              .replace(/\n\s*\n\s*\n+/g, '\n\n')
              .trim();
}

function extractMeta(html, filename) {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  const kickerMatch = html.match(/class=["'](?:kicker|hero-kicker|legal-toolbar-kicker)["'][^>]*>([^<]+)<\//i);

  return {
    title: titleMatch ? titleMatch[1].replace(/— William Guindon.*/, '').trim() : filename,
    description: descMatch ? descMatch[1].trim() : '',
    kicker: kickerMatch ? kickerMatch[1].trim() : ''
  };
}

console.log('Extraction du corpus complet des pages...');
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !f.startsWith('google'));

const sitePages = [];

htmlFiles.forEach(file => {
  const filePath = path.join(ROOT, file);
  const rawHtml = fs.readFileSync(filePath, 'utf8');
  const meta = extractMeta(rawHtml, file);
  const text = extractCleanText(rawHtml);

  let category = 'Général';
  if (file.startsWith('0') || ['deontologie.html', 'independance.html', 'ia-ethique.html', 'anti-slapp.html', 'embargo.html', 'experts.html', 'tracabilite.html', 'opsec.html', 'statut-mineur.html', 'vie-privee-parents.html', 'protection-archive.html', 'terms.html', 'privacy.html', 'netiquette.html', 'dependances-licences.html', 'politiques.html'].includes(file)) {
    category = 'Cadre Normatif, Éthique & Légal';
  } else if (['stablex.html', 'registre.html', 'registre-cce-sem26003.html', 'cce.html', 'dossier-journalistes.html', 'live.html'].includes(file)) {
    category = 'Dossier Juridique CCE / SEM-26-003';
  } else if (['agir.html', 'autochtone.html', 'edition-speciale-reconciliation.html', 'enquete-partis.html'].includes(file)) {
    category = 'Action Citoyenne, Enquêtes & Histoire';
  } else if (['blog.html', 'presse.html', 'communiques.html'].includes(file)) {
    category = 'Publications & Presse';
  } else if (['ai.html', 'txt.html', 'flux.html', 'miroirs.html', 'projets.html'].includes(file)) {
    category = 'Outils, Décentralisation & IA';
  }

  sitePages.push({
    id: file.replace('.html', ''),
    file: file,
    url: `https://williamguindon.me/${file === 'index.html' ? '' : file}`,
    title: meta.title || file,
    kicker: meta.kicker || '',
    description: meta.description || '',
    category: category,
    character_count: text.length,
    word_count: text.split(/\s+/).filter(Boolean).length,
    full_text: text
  });
});

sitePages.sort((a, b) => a.id.localeCompare(b.id));

const statusData = JSON.parse(fs.readFileSync(path.join(ROOT, 'status.json'), 'utf8'));
const blogData = fs.existsSync(path.join(ROOT, 'data/blog.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/blog.json'), 'utf8')) : [];
const communiquesData = fs.existsSync(path.join(ROOT, 'data/communiques.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/communiques.json'), 'utf8')) : [];
const mirrorsData = fs.existsSync(path.join(ROOT, 'data/mirrors.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mirrors.json'), 'utf8')) : {};

const documentsArchive = FALLBACK_DOCS.map((docPath, index) => {
  const parts = docPath.split('/');
  const folder = parts.length > 1 ? parts[0] : 'Documents_Generaux';
  const filename = parts.length > 1 ? parts[1] : parts[0];
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  
  let typeLabel = 'Document';
  if (['pdf'].includes(ext)) typeLabel = 'Rapport / Mémoire (PDF)';
  else if (['png', 'jpg', 'jpeg'].includes(ext)) typeLabel = 'Preuve Visuelle / Carte (Image)';
  else if (['csv'].includes(ext)) typeLabel = 'Données Brutes Scientifiques (CSV)';
  else if (['mp4', 'gif'].includes(ext)) typeLabel = 'Enregistrement / Série Temporelle (Vidéo)';
  else if (['kml', 'geojson'].includes(ext)) typeLabel = 'Vecteur Géographique (SIG)';
  else if (['sha256', 'md', 'txt'].includes(ext)) typeLabel = 'Audit & Chaîne de Garde';

  return {
    index: index + 1,
    id: `doc-${String(index + 1).padStart(3, '0')}`,
    filename: filename,
    path: docPath,
    category: folder.replace(/_/g, ' '),
    type: typeLabel,
    format: ext,
    archive_url: `https://archive.org/download/dossier-journalistes-tourbiere-blainville-stablex/${encodeURI(docPath)}`,
    viewer_url: ext === 'pdf' ? `https://williamguindon.me/viewer.html?file=${encodeURIComponent('https://archive.org/download/dossier-journalistes-tourbiere-blainville-stablex/' + docPath)}` : `https://archive.org/download/dossier-journalistes-tourbiere-blainville-stablex/${encodeURI(docPath)}`,
    license: "Utilisation équitable (art. 29 LDA / Fair Dealing / Fair Use 17 USC § 107) · Droits réservés aux auteurs d'origine"
  };
});

const fullCorpus = {
  version: "1.0.0",
  last_updated: "2026-09-26T20:00:00-04:00",
  platform: "williamguindon.me",
  author: {
    name: "William Guindon",
    full_name: "William Tristan Logan Théo Guindon",
    birth_year: 2011,
    location: "Blainville, Québec, Canada",
    status: "Citoyen mineur, auteur et unique signataire de la soumission SEM-26-003 (CCE / ACEUM)",
    contact: "contact@williamguindon.me",
    website: "https://williamguindon.me/",
    github: "https://github.com/Bwillou1/WilliamGuindon"
  },
  legal_framework: {
    submission_id: "SEM-26-003",
    subject: "Enfouissement de matières dangereuses à Blainville / Cellule 6 de Stablex et protection de la Grande Tourbière de Blainville",
    treaty: "Accord Canada-États-Unis-Mexique (ACEUM / CUSMA), articles 24.27 et 24.28",
    status: statusData.determination || "Détermination positive du Secrétariat (art. 24.27)",
    next_deadline: "16 octobre 2026 (Réponse officielle du gouvernement du Canada)",
    un_procedure: "Communication formelle et appel urgent transmis au Dr Marcos A. Orellana, Rapporteur spécial de l'ONU sur les substances toxiques et les droits de l'homme",
    provincial_statute: "Projet de loi 93 (Loi visant à favoriser la protection des personnes et des biens par la valorisation de certains terrains et modifiant d'autres dispositions législatives), sanctionné sous bâillon le 21 mars 2025"
  },
  license: "Creative Commons Attribution - Pas d'Utilisation Commerciale - Pas de Modification 4.0 International (CC BY-NC-ND 4.0)",
  statistics: {
    total_pages: sitePages.length,
    total_words: sitePages.reduce((acc, p) => acc + p.word_count, 0),
    total_documents: documentsArchive.length,
    total_blog_posts: blogData.length,
    total_communiques: communiquesData.length
  },
  site_pages: sitePages,
  documents_archive: documentsArchive,
  blog_posts: blogData,
  press_releases: communiquesData,
  mirrors: mirrorsData
};

const API_DIR = path.join(ROOT, 'api');
const API_V1_DIR = path.join(ROOT, 'api/v1');
if (!fs.existsSync(API_DIR)) fs.mkdirSync(API_DIR, { recursive: true });
if (!fs.existsSync(API_V1_DIR)) fs.mkdirSync(API_V1_DIR, { recursive: true });

fs.writeFileSync(path.join(API_DIR, 'corpus.json'), JSON.stringify(fullCorpus, null, 2), 'utf8');
fs.writeFileSync(path.join(API_V1_DIR, 'corpus.json'), JSON.stringify(fullCorpus, null, 2), 'utf8');
console.log('✔ [OK] api/corpus.json & api/v1/corpus.json générés (' + fullCorpus.statistics.total_words + ' mots).');

const docsPayload = {
  version: "1.0.0",
  last_updated: "2026-09-26T20:00:00-04:00",
  total_documents: documentsArchive.length,
  internet_archive_id: "dossier-journalistes-tourbiere-blainville-stablex",
  download_zip_url: "https://archive.org/compress/dossier-journalistes-tourbiere-blainville-stablex",
  download_torrent_url: "https://archive.org/download/dossier-journalistes-tourbiere-blainville-stablex/dossier-journalistes-tourbiere-blainville-stablex_archive.torrent",
  metadata_url: "https://archive.org/metadata/dossier-journalistes-tourbiere-blainville-stablex",
  documents: documentsArchive
};
fs.writeFileSync(path.join(API_DIR, 'documents.json'), JSON.stringify(docsPayload, null, 2), 'utf8');
fs.writeFileSync(path.join(API_V1_DIR, 'documents.json'), JSON.stringify(docsPayload, null, 2), 'utf8');
console.log('✔ [OK] api/documents.json & api/v1/documents.json générés (222 pièces probatoires).');

const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "William Guindon — API Publique Ouverte (SEM-26-003)",
    summary: "API d'accès libre au corpus intégral, aux textes complets du site, aux statuts juridiques et aux 222 pièces documentaires probatoires.",
    description: "API REST publique ouverte destinée aux modèles d'IA (LLMs), chercheurs, journalistes et agents autonomes pour interroger et extraire l'ensemble vérifié des documents, politiques et statuts du dossier SEM-26-003 (CCE / ACEUM).",
    version: "1.0.0",
    contact: {
      name: "William Guindon",
      email: "contact@williamguindon.me",
      url: "https://williamguindon.me/"
    },
    license: {
      name: "CC BY-NC-ND 4.0",
      url: "https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr"
    }
  },
  servers: [
    {
      url: "https://williamguindon.me",
      description: "Serveur de production officiel (HTTPS / Cloudflare Edge / GitHub Pages)"
    }
  ],
  paths: {
    "/api/v1/corpus.json": {
      get: {
        summary: "Corpus intégral plein texte du site",
        description: "Retourne l'intégralité du texte brut et structuré de toutes les pages, politiques, analyses et métadonnées du site.",
        operationId: "getFullCorpus",
        responses: {
          "200": {
            description: "Corpus textuel et métadonnées complètes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    version: { type: "string" },
                    platform: { type: "string" },
                    author: { type: "object" },
                    legal_framework: { type: "object" },
                    site_pages: { type: "array" },
                    documents_archive: { type: "array" },
                    blog_posts: { type: "array" },
                    press_releases: { type: "array" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/documents.json": {
      get: {
        summary: "Répertoire exhaustif des 222 pièces probatoires",
        description: "Retourne la liste complète des 222 documents, rapports BAPE, cartes SIG, données satellites Sentinel-2, tests d'eau et correspondances officielles avec leurs URLs Internet Archive et empreintes SHA-256.",
        operationId: "getDocumentsArchive",
        responses: {
          "200": {
            description: "Liste des pièces justificatives avec métadonnées",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total_documents: { type: "integer" },
                    internet_archive_id: { type: "string" },
                    documents: { type: "array" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/status.json": {
      get: {
        summary: "Statut juridique en temps réel du dossier CCE SEM-26-003",
        description: "Retourne l'état officiel de la procédure devant la Commission de coopération environnementale, les dates butoirs et les indicateurs environnementaux.",
        operationId: "getCaseStatus",
        responses: {
          "200": {
            description: "Statut et horodatages CCE",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          }
        }
      }
    },
    "/llms.txt": {
      get: {
        summary: "Manifeste IA synthétique (/llms.txt standard)",
        description: "Retourne les directives de prompt système, la fiche de faits vérifiés et les liens vers les ressources documentaires structurées.",
        operationId: "getLlmsTxt",
        responses: {
          "200": {
            description: "Fichier texte Markdown brut pour LLMs",
            content: {
              "text/plain": {
                schema: { type: "string" }
              }
            }
          }
        }
      }
    },
    "/llms-full.txt": {
      get: {
        summary: "Corpus texte brut non compressé pour LLMs (/llms-full.txt)",
        description: "Document texte continu de plus de 215 Ko contenant la totalité des faits vérifiés, analyses juridiques, transcriptions et repères probatoires pour injection directe dans les contextes LLM.",
        operationId: "getLlmsFullTxt",
        responses: {
          "200": {
            description: "Corpus brut complet pour modèles de langage",
            content: {
              "text/plain": {
                schema: { type: "string" }
              }
            }
          }
        }
      }
    }
  }
};

fs.writeFileSync(path.join(ROOT, 'openapi.json'), JSON.stringify(openApiSpec, null, 2), 'utf8');
fs.writeFileSync(path.join(API_DIR, 'openapi.json'), JSON.stringify(openApiSpec, null, 2), 'utf8');
console.log('✔ [OK] openapi.json généré (OpenAPI 3.1.0).');

const apisJsonSpec = {
  name: "William Guindon — Registre & Dossier SEM-26-003 API Ecosystem",
  description: "Catalogue public et manifeste machine conforme au standard APIs.json (apisjson.org) indexant l'intégralité des points d'accès API, corpus textuels, spécifications OpenAPI, schémas JSON-LD et protocoles d'agents IA (MCP, Agent Skills) de la démarche citoyenne de William Guindon.",
  image: "https://williamguindon.me/og-image.jpg",
  url: "https://williamguindon.me/apis.json",
  created: "2026-09-26",
  modified: "2026-09-26",
  specificationVersion: "0.16",
  tags: [
    "Environment",
    "Legal",
    "CEC",
    "CUSMA",
    "ACEUM",
    "OpenData",
    "AI",
    "LLM",
    "MCP",
    "Wetlands",
    "PublicInterest",
    "Quebec",
    "Canada"
  ],
  apis: [
    {
      name: "Corpus & Full-Text Knowledge API",
      description: "Accès plein texte structuré à toutes les pages, politiques, mémoires, chartes et documents du site williamguindon.me.",
      image: "https://williamguindon.me/icon-192.png",
      humanURL: "https://williamguindon.me/ai.html",
      baseURL: "https://williamguindon.me/api/v1/",
      properties: [
        {
          type: "OpenAPI",
          url: "https://williamguindon.me/openapi.json"
        },
        {
          type: "JSON",
          url: "https://williamguindon.me/api/v1/corpus.json"
        },
        {
          type: "Documentation",
          url: "https://williamguindon.me/api/index.html"
        },
        {
          type: "TermsOfService",
          url: "https://williamguindon.me/terms.html"
        },
        {
          type: "PrivacyPolicy",
          url: "https://williamguindon.me/privacy.html"
        }
      ]
    },
    {
      name: "Documents & Evidence Archive API (222 Pièces)",
      description: "Index et métadonnées de l'archive documentaire complète déposée sur Internet Archive, Zenodo et Felt SIG.",
      image: "https://williamguindon.me/icon-192.png",
      humanURL: "https://williamguindon.me/dossier-journalistes.html",
      baseURL: "https://williamguindon.me/api/v1/",
      properties: [
        {
          type: "JSON",
          url: "https://williamguindon.me/api/v1/documents.json"
        },
        {
          type: "Documentation",
          url: "https://williamguindon.me/dossier-journalistes.html"
        },
        {
          type: "Archive",
          url: "https://archive.org/details/dossier-journalistes-tourbiere-blainville-stablex"
        }
      ]
    },
    {
      name: "Legal Status & Countdown API (SEM-26-003)",
      description: "Point d'accès temps réel pour le statut de la soumission auprès de la Commission de coopération environnementale (CCE / ACEUM).",
      image: "https://williamguindon.me/icon-192.png",
      humanURL: "https://williamguindon.me/live.html",
      baseURL: "https://williamguindon.me/",
      properties: [
        {
          type: "JSON",
          url: "https://williamguindon.me/status.json"
        },
        {
          type: "Documentation",
          url: "https://williamguindon.me/registre.html"
        }
      ]
    },
    {
      name: "LLM & AI Agent Discovery Feeds",
      description: "Manifestes et protocoles de découverte normalisés pour modèles de langage et agents autonomes.",
      image: "https://williamguindon.me/icon-192.png",
      humanURL: "https://williamguindon.me/ai.html",
      baseURL: "https://williamguindon.me/",
      properties: [
        {
          type: "LLMs-Txt",
          url: "https://williamguindon.me/llms.txt"
        },
        {
          type: "LLMs-Full",
          url: "https://williamguindon.me/llms-full.txt"
        },
        {
          type: "MCP",
          url: "https://williamguindon.me/.well-known/mcp.json"
        },
        {
          type: "Agent-Skills",
          url: "https://williamguindon.me/.well-known/agent-skills/index.json"
        },
        {
          type: "WebMCP",
          url: "https://williamguindon.me/.well-known/webmcp/tools.json"
        }
      ]
    },
    {
      name: "Public Agenda & Calendar Feed (iCal / Google Calendar)",
      description: "Flux de calendrier public en direct (norme iCalendar RFC 5545) pour suivre et synchroniser les échéances juridiques, dates de dépôt, points de presse et événements publics de William Guindon.",
      image: "https://williamguindon.me/icon-192.png",
      humanURL: "https://williamguindon.me/live.html",
      baseURL: "https://calendar.google.com/calendar/",
      properties: [
        {
          type: "iCalendar",
          url: "https://calendar.google.com/calendar/ical/afe03776594facb455ca9d2eaeac2535f596aaa1bf30af55bf1f3976b11cad14%40group.calendar.google.com/public/basic.ics"
        },
        {
          type: "Webcal",
          url: "webcal://calendar.google.com/calendar/ical/afe03776594facb455ca9d2eaeac2535f596aaa1bf30af55bf1f3976b11cad14%40group.calendar.google.com/public/basic.ics"
        },
        {
          type: "GoogleCalendar",
          url: "https://calendar.google.com/calendar/render?cid=https%3A%2F%2Fcalendar.google.com%2Fcalendar%2Fical%2Fafe03776594facb455ca9d2eaeac2535f596aaa1bf30af55bf1f3976b11cad14%40group.calendar.google.com%2Fpublic%2Fbasic.ics"
        }
      ]
    }
  ],
  maintainers: [
    {
      FN: "William Guindon",
      email: "contact@williamguindon.me",
      url: "https://williamguindon.me/"
    }
  ]
};

fs.writeFileSync(path.join(ROOT, 'apis.json'), JSON.stringify(apisJsonSpec, null, 2), 'utf8');
const WELL_KNOWN_DIR = path.join(ROOT, '.well-known');
if (!fs.existsSync(WELL_KNOWN_DIR)) fs.mkdirSync(WELL_KNOWN_DIR, { recursive: true });
fs.writeFileSync(path.join(WELL_KNOWN_DIR, 'apis.json'), JSON.stringify(apisJsonSpec, null, 2), 'utf8');
console.log('✔ [OK] apis.json & .well-known/apis.json générés (apisjson.org v0.16).');

console.log('🎉 Génération de l\'API publique ouverte terminée avec succès !');
