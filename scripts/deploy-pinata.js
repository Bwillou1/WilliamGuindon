#!/usr/bin/env node
/**
 * scripts/deploy-pinata.js — Déploiement automatique du site statique sur IPFS via Pinata.
 * 
 * Fonctionnalités :
 * 1. Upload récursif de l'intégralité du site en un dossier racine unique (1 seul pin consommé).
 * 2. Support de PINATA_JWT ou du couple PINATA_API_KEY / PINATA_API_SECRET.
 * 3. Récupération et affichage du CID IPFS v1 avec liens passerelles directs.
 * 4. Export du CID dans $GITHUB_OUTPUT et résumé dans $GITHUB_STEP_SUMMARY.
 * 5. Option de désépinglage (unpin) automatique des anciens CIDs pour préserver le quota de stockage.
 */

const fs = require('fs');
const path = require('path');

// Répertoire racine du projet
const ROOT_DIR = path.resolve(__dirname, '..');
const FOLDER_NAME = 'williamguindon-site';

// Clés d'authentification Pinata
const PINATA_JWT = process.env.PINATA_JWT || '';
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_API_SECRET = process.env.PINATA_API_SECRET || process.env.PINATA_SECRET_KEY || '';
const UNPIN_PREVIOUS = process.env.UNPIN_PREVIOUS === 'true' || process.env.UNPIN_PREVIOUS === '1';

// Headers HTTP d'authentification
function getAuthHeaders() {
  if (PINATA_JWT) {
    return {
      'Authorization': `Bearer ${PINATA_JWT.trim()}`
    };
  }
  if (PINATA_API_KEY && PINATA_API_SECRET) {
    return {
      'pinata_api_key': PINATA_API_KEY.trim(),
      'pinata_secret_api_key': PINATA_API_SECRET.trim()
    };
  }
  return null;
}

// Vérification de la configuration
const authHeaders = getAuthHeaders();
if (!authHeaders) {
  console.error('❌ ERREUR : Aucun secret Pinata détecté.');
  console.error('Veuillez configurer soit le secret GitHub PINATA_JWT (recommandé),');
  console.error('soit le couple PINATA_API_KEY et PINATA_API_SECRET.');
  process.exit(1);
}

// Liste des dossiers et motifs exclus du déploiement IPFS
const EXCLUDE_DIRS = new Set([
  '.git',
  '.github',
  'node_modules',
  'tor',
  '.gemini',
  '.idea',
  '.vscode'
]);

const EXCLUDE_FILES = new Set([
  '.DS_Store',
  'Thumbs.db',
  '.gitignore',
  '.npmrc'
]);

function shouldInclude(relPath) {
  const parts = relPath.split(path.sep);
  for (const p of parts) {
    if (EXCLUDE_DIRS.has(p)) return false;
    if (p.startsWith('.env')) return false;
  }
  const basename = path.basename(relPath);
  if (EXCLUDE_FILES.has(basename)) return false;
  return true;
}

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (!shouldInclude(relPath)) continue;

    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push({
        fullPath,
        relPath: relPath.split(path.sep).join('/') // Normalisation POSIX pour IPFS
      });
    }
  }

  return results;
}

async function testAuthentication() {
  console.log('📡 Vérification de la connexion à l\'API Pinata...');
  try {
    const res = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      headers: authHeaders
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Code HTTP ${res.status}: ${body}`);
    }
    const data = await res.json();
    console.log(`✔ Authentification Pinata réussie : ${data.message || 'OK'}`);
  } catch (err) {
    console.error(`❌ Échec de connexion à Pinata : ${err.message}`);
    process.exit(1);
  }
}

async function uploadFolderToPinata(files) {
  console.log(`\n📦 Préparation du déploiement de ${files.length} fichiers dans le dossier racine "${FOLDER_NAME}"...`);

  const formData = new FormData();

  let totalBytes = 0;
  for (const file of files) {
    const buffer = fs.readFileSync(file.fullPath);
    totalBytes += buffer.length;
    const blob = new Blob([buffer]);
    // Pinata requiert que le filepath commence par le nom du répertoire racine
    const pinataFilePath = `${FOLDER_NAME}/${file.relPath}`;
    formData.append('file', blob, pinataFilePath);
  }

  const sizeMb = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`Taille totale du paquet : ${sizeMb} Mo`);

  // Métadonnées Pinata (permettant le regroupement et l'unpin ciblé)
  const pinataMetadata = JSON.stringify({
    name: 'williamguindon-site-main',
    keyvalues: {
      project: 'williamguindon-me',
      branch: process.env.GITHUB_REF_NAME || 'main',
      sha: (process.env.GITHUB_SHA || 'manual').substring(0, 7),
      date: new Date().toISOString()
    }
  });
  formData.append('pinataMetadata', pinataMetadata);

  // Options : CIDv1 recommandé pour IPFS moderne
  const pinataOptions = JSON.stringify({
    cidVersion: 1,
    wrapWithDirectory: false
  });
  formData.append('pinataOptions', pinataOptions);

  console.log('🚀 Envoi vers l\'API Pinata (pinFileToIPFS)...');
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      ...authHeaders
      // Ne pas fixer Content-Type manuellement pour laisser le boundary multipart être généré
    },
    body: formData
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Échec de l'upload Pinata (${res.status}) : ${errorBody}`);
  }

  const result = await res.json();
  return result;
}

async function unpinPreviousCids(currentCid) {
  console.log('\n🧹 Recherche des anciens CIDs à désépingler (unpin)...');
  try {
    const query = new URLSearchParams({
      status: 'pinned',
      'metadata[keyvalues]': JSON.stringify({
        project: { value: 'williamguindon-me', op: 'eq' }
      }),
      pageLimit: '10'
    });

    const res = await fetch(`https://api.pinata.cloud/data/pinList?${query.toString()}`, {
      headers: authHeaders
    });

    if (!res.ok) {
      console.warn(`⚠️ Impossible de récupérer la liste des pins pour désépinglage (${res.status}).`);
      return;
    }

    const data = await res.json();
    const rows = data.rows || [];
    const toUnpin = rows.filter(r => r.ipfs_pin_hash !== currentCid);

    if (toUnpin.length === 0) {
      console.log('Aucun ancien CID à désépingler.');
      return;
    }

    console.log(`Trouvé ${toUnpin.length} ancien(s) pin(s) à supprimer :`);
    for (const pin of toUnpin) {
      const hash = pin.ipfs_pin_hash;
      const unpinRes = await fetch(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (unpinRes.ok) {
        console.log(`✔ [DÉSÉPINGLÉ] ${hash} (${pin.metadata?.name || 'sans nom'})`);
      } else {
        console.warn(`⚠️ Échec du désépinglage de ${hash} (${unpinRes.status})`);
      }
    }
  } catch (err) {
    console.warn(`⚠️ Erreur lors de la procédure de désépinglage : ${err.message}`);
  }
}

async function main() {
  await testAuthentication();

  const files = getAllFiles(ROOT_DIR);
  if (files.length === 0) {
    console.error('❌ Aucun fichier trouvé à uploader.');
    process.exit(1);
  }

  const uploadResult = await uploadFolderToPinata(files);
  const cid = uploadResult.IpfsHash;

  console.log('\n======================================================');
  console.log('🎉 DÉPLOIEMENT IPFS RÉUSSI AVEC PINATA !');
  console.log(`Nouveau CID IPFS : ${cid}`);
  console.log(`Taille épinglée  : ${(uploadResult.PinSize / (1024 * 1024)).toFixed(2)} Mo`);
  console.log('======================================================\n');

  console.log('🌐 Passerelles IPFS publiques disponibles :');
  console.log(`• https://dweb.link/ipfs/${cid}/`);
  console.log(`• https://gateway.pinata.cloud/ipfs/${cid}/`);
  console.log(`• https://ipfs.io/ipfs/${cid}/`);
  console.log(`• https://cloudflare-ipfs.com/ipfs/${cid}/`);
  console.log(`• ipfs://${cid}\n`);

  // Export pour les étapes suivantes dans GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `ipfs_cid=${cid}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `ipfs_gateway=https://dweb.link/ipfs/${cid}/\n`);
  }

  // Écriture dans le résumé de run GitHub Actions ($GITHUB_STEP_SUMMARY)
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = `
## 🚀 Déploiement IPFS Pinata Réussi

| Paramètre | Valeur |
| :--- | :--- |
| **Nouveau CID IPFS** | \`${cid}\` |
| **Fichiers déployés** | ${files.length} |
| **Taille épinglée** | ${(uploadResult.PinSize / (1024 * 1024)).toFixed(2)} Mo |
| **Dossier racine** | \`${FOLDER_NAME}\` (1 seul pin consommé) |

### 🌐 Passerelles IPFS :
- 🔗 [Passerelle dweb.link](https://dweb.link/ipfs/${cid}/)
- 🔗 [Passerelle Pinata](https://gateway.pinata.cloud/ipfs/${cid}/)
- 🔗 [Passerelle IPFS.io](https://ipfs.io/ipfs/${cid}/)
- 🔗 [Passerelle Cloudflare](https://cloudflare-ipfs.com/ipfs/${cid}/)
`;
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }

  if (UNPIN_PREVIOUS) {
    await unpinPreviousCids(cid);
  } else {
    console.log('💡 Note : La suppression automatique des anciens CIDs est désactivée.');
    console.log('   (Passez UNPIN_PREVIOUS=true pour l\'activer et libérer du quota)');
  }
}

main().catch(err => {
  console.error('\n❌ ERREUR FATALE LORS DU DÉPLOIEMENT PINATA :');
  console.error(err);
  process.exit(1);
});
