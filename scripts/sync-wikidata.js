/**
 * scripts/sync-wikidata.js
 * Synchronisation et enrichissement de l'entité Wikidata Q141439370 (William Guindon)
 * Utilise l'API MediaWiki/Wikibase de Wikidata via BotPassword ou OAuth Token
 * 
 * Usage :
 *   WIKIMEDIA_USERNAME="VotreNom@VotreBot" WIKIMEDIA_BOT_PASSWORD="votre_mot_de_passe" node scripts/sync-wikidata.js
 * ou :
 *   WIKIMEDIA_ACCESS_TOKEN="votre_token_oauth" node scripts/sync-wikidata.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const ITEM_ID = 'Q141439370';
const USER_AGENT = 'WilliamGuindonBot/1.0 (https://williamguindon.me; contact@williamguindon.me)';

// Chargement sécurisé de l'environnement local
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (_) {}
}

loadEnvFile(path.join(__dirname, '..', '.env'));
loadEnvFile(path.join(os.homedir(), '.env'));

const USERNAME = process.env.WIKIMEDIA_USERNAME || process.env.WIKIDATA_USERNAME;
const BOT_PASSWORD = process.env.WIKIMEDIA_BOT_PASSWORD || process.env.WIKIDATA_BOT_PASSWORD;
const ACCESS_TOKEN = process.env.WIKIMEDIA_ACCESS_TOKEN || process.env.WIKIDATA_TOKEN || process.env.WIKIMEDIA_TOKEN;

async function requestApi(params, customHeaders = {}) {
  const body = new URLSearchParams(params);
  const headers = {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/x-www-form-urlencoded',
    ...customHeaders
  };
  if (ACCESS_TOKEN && !customHeaders['Authorization']) {
    headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
  }

  const res = await fetch(WIKIDATA_API, {
    method: 'POST',
    headers,
    body: body.toString()
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return await res.json();
}

async function loginBot(username, password) {
  console.log(`Authentification du robot ${username} sur Wikidata...`);
  // Étape 1 : Obtenir un login token
  const tokenData = await requestApi({
    action: 'query',
    meta: 'tokens',
    type: 'login',
    format: 'json'
  });

  const logintoken = tokenData?.query?.tokens?.logintoken;
  if (!logintoken) throw new Error('Impossible d’obtenir le logintoken');

  // Étape 2 : Connexion clientlogin
  const loginRes = await requestApi({
    action: 'clientlogin',
    username: username,
    password: password,
    logintoken: logintoken,
    loginreturnurl: 'https://williamguindon.me',
    format: 'json'
  });

  if (loginRes?.clientlogin?.status !== 'PASS') {
    throw new Error(`Échec de connexion : ${loginRes?.clientlogin?.message || JSON.stringify(loginRes)}`);
  }

  console.log('✔ Authentification réussie !');
}

async function getCsrfToken() {
  const res = await requestApi({
    action: 'query',
    meta: 'tokens',
    type: 'csrf',
    format: 'json'
  });
  const token = res?.query?.tokens?.csrftoken;
  if (!token || token === '+\\') {
    throw new Error('Jeton CSRF invalide ou permissions insuffisantes.');
  }
  return token;
}

async function setClaim(csrfToken, property, snakType, value) {
  console.log(`Ajout/Vérification de la propriété ${property}...`);
  const data = {
    action: 'wbcreateclaim',
    entity: ITEM_ID,
    property: property,
    snaktype: snakType,
    value: JSON.stringify(value),
    token: csrfToken,
    format: 'json'
  };
  const res = await requestApi(data);
  if (res.error) {
    console.warn(`  ⚠️ Avertissement (${property}) : ${res.error.info || JSON.stringify(res.error)}`);
  } else {
    console.log(`  ✔ Propriété ${property} enregistrée avec succès.`);
  }
}

async function run() {
  console.log('=== Enrichissement Wikidata de l’Entité Q141439370 (William Guindon) ===\n');

  if (!ACCESS_TOKEN && (!USERNAME || !BOT_PASSWORD)) {
    console.log('ℹ️ Identifiants Wikimedia requis.');
    console.log('Options d\'exécution :');
    console.log('1. Avec mot de passe de robot (recommandé) :');
    console.log('   WIKIMEDIA_USERNAME="Nom@Bot" WIKIMEDIA_BOT_PASSWORD="pwd" node scripts/sync-wikidata.js\n');
    console.log('2. Avec jeton d’accès OAuth :');
    console.log('   WIKIMEDIA_ACCESS_TOKEN="votre_token" node scripts/sync-wikidata.js\n');
    console.log('Alternative directe sans terminal : Utilisez QuickStatements (voir guide généré).');
    process.exit(0);
  }

  try {
    if (USERNAME && BOT_PASSWORD) {
      await loginBot(USERNAME, BOT_PASSWORD);
    }

    const csrfToken = await getCsrfToken();
    console.log('Jeton CSRF obtenu.\n');

    // 1. Identifiant GitHub (P2037)
    await setClaim(csrfToken, 'P2037', 'value', 'Bwillou1');

    // 2. Identifiant Page Facebook (P2013)
    await setClaim(csrfToken, 'P2013', 'value', 'williamguindon.officiel');

    // 3. Langues parlées / écrites : Français (Q150) et Anglais (Q1860)
    await setClaim(csrfToken, 'P1412', 'value', { 'entity-type': 'item', 'numeric-id': 150 });
    await setClaim(csrfToken, 'P1412', 'value', { 'entity-type': 'item', 'numeric-id': 1860 });

    // 4. Domaines d'action / Thèmes clés (P921) : Protection de l'environnement (Q213568) & Justice environnementale (Q1414122)
    await setClaim(csrfToken, 'P921', 'value', { 'entity-type': 'item', 'numeric-id': 213568 });
    await setClaim(csrfToken, 'P921', 'value', { 'entity-type': 'item', 'numeric-id': 1414122 });

    // 5. Décrit par la source (P1343) : La Presse (Q1337424) & Le Devoir (Q1504424)
    await setClaim(csrfToken, 'P1343', 'value', { 'entity-type': 'item', 'numeric-id': 1337424 });
    await setClaim(csrfToken, 'P1343', 'value', { 'entity-type': 'item', 'numeric-id': 1504424 });

    console.log('\n🎉 Mise à jour de la fiche Wikidata Q141439370 terminée avec succès !');
  } catch (err) {
    console.error('Erreur lors de la mise à jour Wikidata :', err.message);
    process.exit(1);
  }
}

run();
