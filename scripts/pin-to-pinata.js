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

// 2. Épinglage d'un fichier PDF
function pinFile(filePath, customName) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const boundary = '----PinataBoundary' + Math.random().toString(36).substring(2);

    const pinataMetadata = JSON.stringify({
      name: customName || fileName,
      keyvalues: {
        dossier: 'SEM-26-003',
        author: 'William Guindon'
      }
    });

    let headerPart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: application/pdf\r\n\r\n`
    );

    let metaPart = Buffer.from(
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="pinataMetadata"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      pinataMetadata +
      `\r\n--${boundary}--\r\n`
    );

    const bodyBuffer = Buffer.concat([headerPart, fileBuffer, metaPart]);

    const req = https.request({
      hostname: 'api.pinata.cloud',
      path: '/pinning/pinFileToIPFS',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          console.log(`✔ [IPFS PINNÉ] ${fileName} -> CID: ${json.IpfsHash} (Taille: ${json.PinSize} octets)`);
          resolve(json);
        } else {
          reject(new Error(`Échec pin ${fileName} (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function run() {
  try {
    await testAuth();

    const docs = [
      { path: 'assets/docs/26-2-det2_fr.pdf', name: 'SEM-26-003_Determination_Positive_CCE_17_Aout_2026.pdf' },
      { path: 'assets/docs/26-3-rsub_fr_redacted.pdf', name: 'SEM-26-003_Soumission_Citoyenne_16_Juillet_2026.pdf' },
      { path: 'assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf', name: 'SEM-26-003_Deposition_Formelle_ONU_Mai_2026.pdf' },
      { path: 'assets/docs/26-3-det_fr.pdf', name: 'SEM-26-003_Decision_Preliminaire_CCE_3_Juin_2026.pdf' }
    ];

    const results = {};
    for (const doc of docs) {
      const fullPath = path.join(ROOT_DIR, doc.path);
      if (fs.existsSync(fullPath)) {
        const res = await pinFile(fullPath, doc.name);
        results[doc.path] = res.IpfsHash;
      }
    }

    console.log('\n=== Résumé des CIDs IPFS réels générés ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Erreur :', err.message);
    process.exit(1);
  }
}

run();
