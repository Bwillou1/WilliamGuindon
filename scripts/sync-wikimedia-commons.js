/**
 * scripts/sync-wikimedia-commons.js
 * Synchronisation automatique des photographies de William Guindon vers Wikimedia Commons
 * Licence de publication sur Commons : Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)
 * Site officiel : https://williamguindon.me
 */

const fs = require('fs');
const path = require('path');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'WilliamGuindonOfficialSync/1.0 (https://williamguindon.me; contact@williamguindon.me)';

const USERNAME = process.env.WIKIMEDIA_USERNAME || process.env.COMMONS_USERNAME;
const BOT_PASSWORD = process.env.WIKIMEDIA_BOT_PASSWORD || process.env.COMMONS_BOT_PASSWORD;

const LOG_FILE = path.join(__dirname, '..', 'data', 'wikimedia-sync-log.json');
const PHOTOS_FILE = path.join(__dirname, '..', 'data', 'photos.json');

async function main() {
  console.log('=== Synchronisation Wikimedia Commons — William Guindon ===\n');

  if (!USERNAME || !BOT_PASSWORD) {
    console.log('ℹ️ Information : Variables WIKIMEDIA_USERNAME ou WIKIMEDIA_BOT_PASSWORD non définies.');
    console.log('Pour activer la publication automatique sur Wikimedia Commons :');
    console.log('1. Connectez-vous sur https://commons.wikimedia.org');
    console.log('2. Rendez-vous sur https://commons.wikimedia.org/wiki/Special:BotPasswords');
    console.log('3. Créez un mot de passe de robot avec la permission "Téléverser de nouveaux fichiers" (uploadedit)');
    console.log('4. Ajoutez WIKIMEDIA_USERNAME et WIKIMEDIA_BOT_PASSWORD dans les Secrets GitHub de votre dépôt.\n');
    process.exit(0);
  }

  // Lecture du registre local
  let syncLog = { lastSync: null, synced: [] };
  if (fs.existsSync(LOG_FILE)) {
    try {
      syncLog = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch (e) {
      console.warn('Registre sync corrompu, réinitialisation.');
    }
  }

  if (!fs.existsSync(PHOTOS_FILE)) {
    console.log('Aucun fichier data/photos.json trouvé.');
    process.exit(0);
  }

  const photos = JSON.parse(fs.readFileSync(PHOTOS_FILE, 'utf8'));
  const toUpload = photos.filter(p => {
    const isSynced = syncLog.synced.some(s => s.id === p.id);
    const hasLocalFile = p.imageUrl && fs.existsSync(path.join(__dirname, '..', p.imageUrl.split('?')[0]));
    return !isSynced && hasLocalFile;
  });

  if (toUpload.length === 0) {
    console.log('✔ Aucune nouvelle photographie en attente de téléversement vers Commons.');
    process.exit(0);
  }

  console.log(`📡 ${toUpload.length} image(s) en attente de téléversement vers Wikimedia Commons.`);

  let cookieJar = '';

  // 1. Obtenir un jeton de connexion (login token)
  console.log('1. Récupération du login token...');
  const tokenRes = await fetch(`${COMMONS_API}?action=query&meta=tokens&type=login&format=json`, {
    headers: { 'User-Agent': USER_AGENT }
  });
  
  const setCookie = tokenRes.headers.get('set-cookie');
  if (setCookie) {
    cookieJar = setCookie.split(',').map(c => c.split(';')[0]).join('; ');
  }

  const tokenData = await tokenRes.json();
  const loginToken = tokenData.query?.tokens?.logintoken;
  if (!loginToken) {
    throw new Error('Impossible d\'obtenir le login token de Wikimedia Commons.');
  }

  // 2. Connexion avec mot de passe de robot
  console.log(`2. Authentification sous le compte ${USERNAME}...`);
  const loginBody = new URLSearchParams({
    action: 'login',
    lgname: USERNAME,
    lgpassword: BOT_PASSWORD,
    lgtoken: loginToken,
    format: 'json'
  });

  const loginAttemptRes = await fetch(COMMONS_API, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieJar
    },
    body: loginBody
  });

  const loginSetCookie = loginAttemptRes.headers.get('set-cookie');
  if (loginSetCookie) {
    cookieJar += '; ' + loginSetCookie.split(',').map(c => c.split(';')[0]).join('; ');
  }

  const loginResult = await loginAttemptRes.json();
  if (loginResult.login?.result !== 'Success') {
    throw new Error(`Échec d'authentification Wikimedia Commons: ${loginResult.login?.reason || JSON.stringify(loginResult)}`);
  }
  console.log('✔ Authentification Wikimedia réussie.');

  // 3. Obtenir le jeton CSRF
  console.log('3. Récupération du CSRF token...');
  const csrfRes = await fetch(`${COMMONS_API}?action=query&meta=tokens&type=csrf&format=json`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Cookie': cookieJar
    }
  });
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.query?.tokens?.csrftoken;
  if (!csrfToken) {
    throw new Error('Impossible d\'obtenir le CSRF token.');
  }

  // 4. Téléversement des photos
  const authorAccount = USERNAME.includes('@') ? USERNAME.split('@')[0] : USERNAME;

  for (const item of toUpload) {
    const filePath = path.join(__dirname, '..', item.imageUrl.split('?')[0]);
    const ext = path.extname(filePath).toLowerCase();
    
    // Nettoyage du titre pour respecter les conventions Wikimedia Commons
    const cleanTitle = (item.title || 'Document photographique')
      .replace(/[\/\\:\*\?"<>\|]/g, ' ')
      .replace(/\s+/g, '_')
      .trim();

    const commonsFilename = `William_Guindon_-_${cleanTitle}${ext}`;
    console.log(`\nTéléversement de : ${commonsFilename}...`);

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);

    const wikitext = `== {{int:filedesc}} ==
{{Information
|description={{fr|1=${item.description || item.title || 'Photographie de terrain par William Guindon'}}}
|date=${item.date || new Date().toISOString().split('T')[0]}
|source={{own}} / https://williamguindon.me
|author=[[User:${authorAccount}|William Guindon]]
|permission=
|other versions=
}}

== {{int:license-header}} ==
{{self|cc-by-sa-4.0}}

[[Category:William Guindon]]
[[Category:Grande Tourbière de Blainville]]
[[Category:Environmental activism in Quebec]]
`;

    const formData = new FormData();
    formData.append('action', 'upload');
    formData.append('filename', commonsFilename);
    formData.append('comment', 'Téléversement officiel depuis le site https://williamguindon.me (Auteur: William Guindon)');
    formData.append('text', wikitext);
    formData.append('token', csrfToken);
    formData.append('ignorewarnings', '1');
    formData.append('format', 'json');
    formData.append('file', blob, commonsFilename);

    const uploadRes = await fetch(COMMONS_API, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Cookie': cookieJar
      },
      body: formData
    });

    const uploadData = await uploadRes.json();

    if (uploadData.error) {
      console.error(`❌ Erreur téléversement (${commonsFilename}):`, uploadData.error);
    } else if (uploadData.upload?.result === 'Success') {
      console.log(`✔ Téléversement réussi : https://commons.wikimedia.org/wiki/File:${encodeURIComponent(commonsFilename)}`);
      syncLog.synced.push({
        id: item.id,
        imageUrl: item.imageUrl,
        commonsTitle: commonsFilename,
        commonsUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(commonsFilename)}`,
        syncedAt: new Date().toISOString()
      });
    } else {
      console.warn('Réponse inattendue de l\'API Commons:', uploadData);
    }
  }

  syncLog.lastSync = new Date().toISOString();
  fs.writeFileSync(LOG_FILE, JSON.stringify(syncLog, null, 2) + '\n');
  console.log('\n✔ Registre data/wikimedia-sync-log.json mis à jour avec succès.');
}

main().catch(err => {
  console.error('Erreur critique synchronisation Commons:', err.message);
  process.exit(1);
});
