#!/usr/bin/env node
/**
 * scripts/upload-to-imagekit.js
 * 
 * Script utilitaire pour téléverser automatiquement des photographies et médias
 * vers ImageKit Media Library (https://imagekit.io/dashboard/media-library).
 *
 * Usage :
 *   IMAGEKIT_PRIVATE_KEY="private_..." node scripts/upload-to-imagekit.js [fichier_ou_dossier] [dossier_destination]
 *
 * Exemples :
 *   IMAGEKIT_PRIVATE_KEY="private_xxx" node scripts/upload-to-imagekit.js assets/media/signalement-faunique-plan-bouchard.webp /photos
 *   IMAGEKIT_PRIVATE_KEY="private_xxx" node scripts/upload-to-imagekit.js assets/media /assets/media
 */

'use strict';

const fs = require('fs');
const path = require('path');

const privateKey = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim();
const urlEndpoint = (process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/williamguindon/').replace(/\/+$/, '');

const targetPath = process.argv[2] || 'assets/media';
const destinationFolder = process.argv[3] || '/photos';

if (!privateKey) {
  console.log(`
ℹ️ ImageKit Media Library — Téléversement automatique

Pour téléverser directement des images vers votre Media Library ImageKit (https://imagekit.io/dashboard/media-library) :

1. Récupérez votre clé privée sur :
   👉 https://imagekit.io/dashboard/developer/api-keys

2. Lancez la commande suivante dans votre terminal :
   IMAGEKIT_PRIVATE_KEY="votre_cle_privee" node scripts/upload-to-imagekit.js ${targetPath} ${destinationFolder}

Note : Vos images dans assets/media/ sont également servies et optimisées automatiquement via le CDN ImageKit :
   ${urlEndpoint}/assets/media/<nom_de_fichier>
`);
  process.exit(0);
}

const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

async function uploadFile(filePath, folder) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const base64File = fileBuffer.toString('base64');

  const formData = new URLSearchParams();
  formData.append('file', base64File);
  formData.append('fileName', fileName);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'false');

  try {
    const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const data = await res.json();
    if (!res.ok) {
      console.error(`❌ Échec pour ${fileName}:`, data.message || res.statusText);
      return null;
    }

    console.log(`✔ [OK] Téléversé : ${fileName} -> ${data.url}`);
    return data;
  } catch (err) {
    console.error(`❌ Erreur réseau pour ${fileName}:`, err.message);
    return null;
  }
}

async function main() {
  const fullPath = path.resolve(process.cwd(), targetPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Le chemin "${targetPath}" n'existe pas.`);
    process.exit(1);
  }

  const stat = fs.statSync(fullPath);
  let filesToUpload = [];

  if (stat.isDirectory()) {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    const files = fs.readdirSync(fullPath);
    filesToUpload = files
      .filter(f => allowedExts.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(fullPath, f));
  } else {
    filesToUpload = [fullPath];
  }

  console.log(`🚀 Démarrage du téléversement de ${filesToUpload.length} fichier(s) vers ImageKit folder "${destinationFolder}"...`);

  for (const f of filesToUpload) {
    await uploadFile(f, destinationFolder);
  }

  console.log(`\n🎉 Terminé ! Consultez votre médiathèque sur : https://imagekit.io/dashboard/media-library`);
}

main().catch(err => {
  console.error("Erreur inattendue :", err);
  process.exit(1);
});
