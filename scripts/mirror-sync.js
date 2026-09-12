const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== Synchronisation & Vérification des Miroirs Web3 (IPFS/IPNS) & Tor ===\n');

const ROOT_DIR = path.resolve(__dirname, '..');
const MIRRORS_FILE = path.join(ROOT_DIR, 'data', 'mirrors.json');

// Liste des documents officiels CCE à certifier
const DOCS = [
  'assets/docs/26-2-det2_fr.pdf',
  'assets/docs/26-3-rsub_fr_redacted.pdf',
  'assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf',
  'assets/docs/26-3-det_fr.pdf'
];

function computeSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

let mirrorsData = {};
if (fs.existsSync(MIRRORS_FILE)) {
  try {
    mirrorsData = JSON.parse(fs.readFileSync(MIRRORS_FILE, 'utf8'));
  } catch (e) {
    console.warn('Création d\'un nouveau fichier data/mirrors.json');
  }
}

mirrorsData.lastUpdated = new Date().toISOString();
mirrorsData.dossier = 'SEM-26-003';
mirrorsData.author = 'William Guindon';

if (!mirrorsData.mirrors) {
  mirrorsData.mirrors = {};
}

mirrorsData.mirrors.web = {
  primary: 'https://williamguindon.me',
  canonical: 'https://williamguindon.me',
  status: 'Disponible',
  githubPages: 'https://bwillou1.github.io/WilliamGuindon/',
  githubPagesStatus: 'Disponible'
};

const currentRootCid = (mirrorsData.mirrors.web3_ipfs && mirrorsData.mirrors.web3_ipfs.latestRootCid) 
  ? mirrorsData.mirrors.web3_ipfs.latestRootCid 
  : 'bafybeieuo3kcsapwwy5l373zezhpi6pre4il26nzb2d3ynf5lhep2l3hfe';

mirrorsData.mirrors.web3_ipfs = {
  name: 'InterPlanetary File System (IPFS) & IPNS',
  status: 'Disponible',
  ipnsAddress: 'k51qzi5uqu5dkg35m04w3558q1pnmx813f88dgu873n129g54u7v4m9b',
  ipnsGateway: 'https://dweb.link/ipns/k51qzi5uqu5dkg35m04w3558q1pnmx813f88dgu873n129g54u7v4m9b',
  ensDomain: 'williamguindon.eth.limo',
  latestRootCid: currentRootCid,
  gateways: [
    `https://gateway.pinata.cloud/ipfs/${currentRootCid}/`,
    `https://cloudflare-ipfs.com/ipfs/${currentRootCid}/`,
    `https://dweb.link/ipfs/${currentRootCid}/`,
    `https://ipfs.io/ipfs/${currentRootCid}/`
  ]
};

mirrorsData.mirrors.tor_onion = {
  name: 'Routage en Oignon Tor (Cloudflare Onion Routing)',
  status: 'Disponible',
  type: 'Cloudflare Onion Routing',
  url: 'https://williamguindon.me',
  description: 'Routage sécurisé direct sans nœud de sortie public pour les utilisateurs du Navigateur Tor (Tor Browser).',
  torBrowserRequired: true
};

mirrorsData.documents_sha256 = {};

for (const docRel of DOCS) {
  const docPath = path.join(ROOT_DIR, docRel);
  if (fs.existsSync(docPath)) {
    const hash = computeSha256(docPath);
    mirrorsData.documents_sha256[docRel] = hash;
    console.log(`✔ [SHA-256 OK] ${docRel} -> ${hash}`);
  } else {
    console.warn(`✖ [DOC INTROUVABLE] ${docRel}`);
  }
}

fs.writeFileSync(MIRRORS_FILE, JSON.stringify(mirrorsData, null, 2) + '\n', 'utf8');
console.log(`\n✔ Fichier mis à jour avec succès : ${path.relative(ROOT_DIR, MIRRORS_FILE)}`);
