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

let cookieJar = '';

function updateCookieJar(response) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return;
  const cookies = setCookie.split(/,(?=\s*[^;]+=)/).map(c => c.split(';')[0].trim()).filter(Boolean);
  const existing = new Map();
  if (cookieJar) {
    for (const pair of cookieJar.split('; ')) {
      const [k, ...v] = pair.split('=');
      if (k) existing.set(k.trim(), v.join('='));
    }
  }
  for (const c of cookies) {
    const [k, ...v] = c.split('=');
    if (k) existing.set(k.trim(), v.join('='));
  }
  cookieJar = Array.from(existing.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function requestApi(params, customHeaders = {}) {
  const body = new URLSearchParams(params);
  const headers = {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/x-www-form-urlencoded',
    ...customHeaders
  };
  if (cookieJar) {
    headers['Cookie'] = cookieJar;
  }
  if (ACCESS_TOKEN && !customHeaders['Authorization']) {
    headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
  }

  const res = await fetch(WIKIDATA_API, {
    method: 'POST',
    headers,
    body: body.toString()
  });

  updateCookieJar(res);

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return await res.json();
}

async function loginBot(username, password) {
  console.log(`Authentification du compte ${username} sur Wikidata...`);

  // Étape 1 : Obtenir un login token
  const tokenData = await requestApi({
    action: 'query',
    meta: 'tokens',
    type: 'login',
    format: 'json'
  });

  const logintoken = tokenData?.query?.tokens?.logintoken;
  if (!logintoken) throw new Error('Impossible d’obtenir le logintoken de Wikidata');

  // Étape 2 : Essai de connexion via action=login (format BotPassword standard)
  const loginRes = await requestApi({
    action: 'login',
    lgname: username,
    lgpassword: password,
    lgtoken: logintoken,
    format: 'json'
  });

  if (loginRes?.login?.result === 'Success') {
    console.log('✔ Authentification réussie (action: login) !');
    return;
  }

  // Fallback Étape 2b : Essai via clientlogin si login classique échoue
  if (loginRes?.login?.result !== 'Success') {
    console.log(`Action login retour : ${loginRes?.login?.result || 'Failed'}. Tentative via clientlogin...`);
    const clientLoginRes = await requestApi({
      action: 'clientlogin',
      username: username,
      password: password,
      logintoken: logintoken,
      loginreturnurl: 'https://williamguindon.me',
      format: 'json'
    });

    if (clientLoginRes?.clientlogin?.status !== 'PASS') {
      throw new Error(`Échec de connexion : ${clientLoginRes?.clientlogin?.message || loginRes?.login?.reason || JSON.stringify(clientLoginRes)}`);
    }
    console.log('✔ Authentification réussie (clientlogin) !');
  }
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
    throw new Error('Jeton CSRF invalide ou permissions insuffisantes sur Wikidata.');
  }
  return token;
}

async function fetchCurrentClaims() {
  const res = await requestApi({
    action: 'wbgetentities',
    ids: ITEM_ID,
    props: 'claims|descriptions|aliases',
    format: 'json'
  });
  return res.entities?.[ITEM_ID]?.claims || {};
}

async function removeClaim(csrfToken, claimGuid) {
  console.log(`Suppression de l'ancienne déclaration ${claimGuid}...`);
  const data = {
    action: 'wbremoveclaims',
    claim: claimGuid,
    claims: claimGuid,
    token: csrfToken,
    format: 'json'
  };
  const res = await requestApi(data);
  if (res.error) {
    console.warn(`  ⚠️ Avertissement lors de la suppression : ${res.error.info || JSON.stringify(res.error)}`);
  } else {
    console.log(`  ✔ Déclaration supprimée avec succès :`, JSON.stringify(res));
  }
}

async function setClaimIfMissing(csrfToken, currentClaims, property, snakType, value, label) {
  const existing = currentClaims[property] || [];
  const valStr = typeof value === 'object' ? (value['numeric-id'] || value.id || value.text) : value;

  const alreadyPresent = existing.some(c => {
    const v = c.mainsnak?.datavalue?.value;
    if (typeof v === 'object' && v !== null) {
      return (v['numeric-id'] === valStr || v.id === valStr || v.id === `Q${valStr}` || v.text === valStr);
    }
    return v === valStr;
  });

  if (alreadyPresent) {
    console.log(`  ℹ️ Déjà présent : ${property} (${label || JSON.stringify(value)})`);
    return;
  }

  console.log(`Ajout de la propriété ${property} (${label || JSON.stringify(value)})...`);
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
    console.log('1. Avec mot de passe de robot (Bot Password Wikidata) :');
    console.log('   WIKIMEDIA_USERNAME="Nom@Bot" WIKIMEDIA_BOT_PASSWORD="pwd" node scripts/sync-wikidata.js\n');
    console.log('2. Avec jeton d’accès OAuth :');
    console.log('   WIKIMEDIA_ACCESS_TOKEN="votre_token" node scripts/sync-wikidata.js\n');
    console.log('Alternative directe en 1 clic : Utilisez QuickStatements v2.');
    process.exit(0);
  }

  try {
    if (USERNAME && BOT_PASSWORD) {
      await loginBot(USERNAME, BOT_PASSWORD);
    }

    const csrfToken = await getCsrfToken();
    console.log('✔ Jeton CSRF obtenu avec succès.\n');

    let currentClaims = await fetchCurrentClaims();

    // Correction du lieu de naissance (P19) : supprimer toute ancienne valeur différente de Saint-Eustache (Q141505)
    const p19Claims = currentClaims['P19'] || [];
    for (const c of p19Claims) {
      const v = c.mainsnak?.datavalue?.value;
      if (v?.['numeric-id'] !== 141505 && v?.id !== 'Q141505') {
        await removeClaim(csrfToken, c.id);
      }
    }
    // Recharger après suppression
    currentClaims = await fetchCurrentClaims();

    // 1. Lieu de naissance (Saint-Eustache Q141505) & Résidence (Blainville Q139568)
    await setClaimIfMissing(csrfToken, currentClaims, 'P19', 'value', { 'entity-type': 'item', 'numeric-id': 141505 }, 'Lieu de naissance: Saint-Eustache (Q141505)');
    await setClaimIfMissing(csrfToken, currentClaims, 'P551', 'value', { 'entity-type': 'item', 'numeric-id': 139568 }, 'Résidence: Blainville (Q139568)');

    // 2. Identité & Noms (selon Schema.org Person)
    await setClaimIfMissing(csrfToken, currentClaims, 'P735', 'value', { 'entity-type': 'item', 'numeric-id': 12344159 }, 'Prénom: William (Q12344159)');
    await setClaimIfMissing(csrfToken, currentClaims, 'P734', 'value', { 'entity-type': 'item', 'numeric-id': 37438740 }, 'Nom: Guindon (Q37438740)');
    await setClaimIfMissing(csrfToken, currentClaims, 'P1477', 'value', { 'text': 'William Tristan Logan Théo Guindon', 'language': 'fr' }, 'Nom de naissance complet');

    // 3. Identifiants plateformes
    await setClaimIfMissing(csrfToken, currentClaims, 'P2037', 'value', 'Bwillou1', 'GitHub: Bwillou1');
    await setClaimIfMissing(csrfToken, currentClaims, 'P2013', 'value', 'williamguindon.officiel', 'Facebook: williamguindon.officiel');
    await setClaimIfMissing(csrfToken, currentClaims, 'P12045', 'value', 'Bwillou1', 'Codeberg: Bwillou1');
    await setClaimIfMissing(csrfToken, currentClaims, 'P5715', 'value', 'https://independent.academia.edu/GuindonWilliam', 'Academia.edu: GuindonWilliam');

    // 4. Langues parlées / écrites : Français (Q150), Anglais (Q1860) et Espagnol (Q1321)
    await setClaimIfMissing(csrfToken, currentClaims, 'P1412', 'value', { 'entity-type': 'item', 'numeric-id': 150 }, 'Langue: Français (Q150)');
    await setClaimIfMissing(csrfToken, currentClaims, 'P1412', 'value', { 'entity-type': 'item', 'numeric-id': 1860 }, 'Langue: Anglais (Q1860)');
    await setClaimIfMissing(csrfToken, currentClaims, 'P1412', 'value', { 'entity-type': 'item', 'numeric-id': 1321 }, 'Langue: Espagnol (Q1321)');

    // 5. Domaine d'activité (P101) : Protection de l'environnement & Justice environnementale
    await setClaimIfMissing(csrfToken, currentClaims, 'P101', 'value', { 'entity-type': 'item', 'numeric-id': 832237 }, 'Domaine: Protection de l’environnement (Q832237)');
    await setClaimIfMissing(csrfToken, currentClaims, 'P101', 'value', { 'entity-type': 'item', 'numeric-id': 1479527 }, 'Domaine: Justice environnementale (Q1479527)');

    // 6. Décrit par la source (P1343) : La Presse (Q1337424) & Le Devoir (Q1504424)
    await setClaimIfMissing(csrfToken, currentClaims, 'P1343', 'value', { 'entity-type': 'item', 'numeric-id': 1337424 }, 'Source: La Presse (Q1337424)');
    await setClaimIfMissing(csrfToken, currentClaims, 'P1343', 'value', { 'entity-type': 'item', 'numeric-id': 1504424 }, 'Source: Le Devoir (Q1504424)');

    // 7. Décrit à l'URL (P973) - Articles de presse et sources documentaires officielles (Schema.org subjectOf)
    await setClaimIfMissing(csrfToken, currentClaims, 'P973', 'value', 'https://www.lapresse.ca/actualites/environnement/2026-07-03/protection-d-une-tourbiere-a-blainville/le-combat-d-un-adolescent-a-l-onu.php', 'Article La Presse (03/07/2026)');
    await setClaimIfMissing(csrfToken, currentClaims, 'P973', 'value', 'https://www.ledevoir.com/opinion/lettres/865027/francois-legault-vous-detruisez-notre-avenir', 'Lettre ouverte Le Devoir (08/04/2025)');
    await setClaimIfMissing(csrfToken, currentClaims, 'P973', 'value', 'https://therover.ca/blainville-teenager-takes-stablex-fight-international/', 'Article The Rover (16/07/2026)');

    // 8. Descriptions multilingues
    console.log('\nMise à jour des descriptions multilingues...');
    const descriptions = [
      { lang: 'fr', val: 'militant écologiste et climatique québécois' },
      { lang: 'en', val: 'Quebec environmental and climate activist' },
      { lang: 'es', val: 'activista ambiental y climático quebequense' }
    ];
    for (const d of descriptions) {
      await requestApi({
        action: 'wbsetdescription',
        id: ITEM_ID,
        language: d.lang,
        value: d.val,
        token: csrfToken,
        format: 'json'
      });
      console.log(`  ✔ Description [${d.lang}] : ${d.val}`);
    }

    // 9. Alias multilingues
    console.log('\nMise à jour des alias multilingues...');
    for (const lang of ['fr', 'en', 'es']) {
      await requestApi({
        action: 'wbsetaliases',
        id: ITEM_ID,
        language: lang,
        add: 'William Tristan Logan Théo Guindon|William G.',
        token: csrfToken,
        format: 'json'
      });
      console.log(`  ✔ Alias [${lang}] enregistrés`);
    }

    console.log('\n🎉 Mise à jour complète de la fiche Wikidata Q141439370 terminée avec succès !');
  } catch (err) {
    console.error('Erreur lors de la mise à jour Wikidata :', err.message);
    process.exit(1);
  }
}

run();
