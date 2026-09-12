const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');

// Lecture du token depuis l'environnement ou .env (non versionné)
let jwt = process.env.PINATA_JWT || '';
const envPath = path.join(ROOT_DIR, '.env');
if (!jwt && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/PINATA_JWT\s*=\s*(.*)/);
  if (match) jwt = match[1].trim().replace(/^["']|["']$/g, '');
}

if (!jwt) {
  console.error("Erreur : Aucun token PINATA_JWT trouvé dans l'environnement.");
  process.exit(1);
}

// 1. Test d'authentification
function testAuth() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.pinata.cloud',
      path: '/data/testAuthentication',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✔ Authentification Pinata réussie !');
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Échec auth Pinata (${res.statusCode}): ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Helper pour scanner récursivement les fichiers du site
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const relPath = path.relative(ROOT_DIR, fullPath);

    // Ignorer les dossiers et fichiers non pertinents / secrets
    if (
      file.startsWith('.git') ||
      file.startsWith('.env') ||
      file === 'node_modules' ||
      file === 'tmp' ||
      file === 'temp' ||
      file === 'scratch' ||
      file === '.agent' ||
      file === '.claude' ||
      file === 'dist' ||
      file === 'build'
    ) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push({
        fullPath: fullPath,
        relPath: relPath.replace(/\\/g, '/')
      });
    }
  });

  return arrayOfFiles;
}

// 2. Épinglage du site complet comme dossier IPFS
function pinEntireWebsite() {
  return new Promise((resolve, reject) => {
    console.log('\n--- Préparation de l\'archive du site complet ---');
    const allFiles = getAllFiles(ROOT_DIR);
    console.log(`Nombre total de fichiers à épingler : ${allFiles.length}`);

    const boundary = '----PinataWebsiteBoundary' + Math.random().toString(36).substring(2);
    const pinataMetadata = JSON.stringify({
      name: 'williamguindon.me-complete-site',
      keyvalues: {
        project: 'williamguindon.me',
        dossier: 'SEM-26-003',
        author: 'William Guindon',
        type: 'full-website-mirror'
      }
    });

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false
    });

    const buffers = [];

    // 1. Métadonnées
    buffers.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="pinataMetadata"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      pinataMetadata +
      `\r\n`
    ));

    // 2. Options
    buffers.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="pinataOptions"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      pinataOptions +
      `\r\n`
    ));

    // 3. Chaque fichier avec son chemin relatif sous le dossier "williamguindon"
    let totalBytes = 0;
    for (const f of allFiles) {
      const fileBuffer = fs.readFileSync(f.fullPath);
      totalBytes += fileBuffer.length;
      const ipfsPath = `williamguindon/${f.relPath}`;

      buffers.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${ipfsPath}"\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n`
      ));
      buffers.push(fileBuffer);
      buffers.push(Buffer.from(`\r\n`));
    }

    buffers.push(Buffer.from(`--${boundary}--\r\n`));

    const finalBody = Buffer.concat(buffers);
    console.log(`Taille totale du payload : ${(finalBody.length / 1024 / 1024).toFixed(2)} Mo`);
    console.log('Envoi vers les serveurs IPFS de Pinata en cours...');

    const req = https.request({
      hostname: 'api.pinata.cloud',
      path: '/pinning/pinFileToIPFS',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': finalBody.length
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          console.log(`\n🎉 [SUCCÈS TOTAL] Site complet épinglé sur IPFS !`);
          console.log(`✔ CID Racine du site : ${json.IpfsHash}`);
          console.log(`✔ Taille épinglée : ${(json.PinSize / 1024 / 1024).toFixed(2)} Mo`);
          console.log(`✔ URL d'accès direct Pinata : https://gateway.pinata.cloud/ipfs/${json.IpfsHash}/`);
          console.log(`✔ URL d'accès direct dweb.link : https://dweb.link/ipfs/${json.IpfsHash}/`);
          console.log(`✔ URL d'accès direct Cloudflare : https://cloudflare-ipfs.com/ipfs/${json.IpfsHash}/`);
          console.log(`✔ URL d'accès direct ipfs.io : https://ipfs.io/ipfs/${json.IpfsHash}/`);
          resolve(json);
        } else {
          reject(new Error(`Échec upload site complet (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(finalBody);
    req.end();
  });
}

async function run() {
  try {
    await testAuth();
    await pinEntireWebsite();
  } catch (err) {
    console.error('Erreur :', err.message);
    process.exit(1);
  }
}

run();
