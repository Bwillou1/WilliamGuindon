const fs = require('fs');
const path = require('path');

console.log('=== Vérification de l\'intégrité des assets et du Service Worker ===\n');

// 1. Vérification des fichiers de base
const CORE_FILES = [
  'index.html',
  'en.html',
  'es.html',
  'registre-cce-sem26003.html',
  'live.html',
  'communiques.html',
  'presse.html',
  'stablex.html',
  'viewer.html',
  'lecteur.html',
  'ai.html',
  'sitemap.xml',
  'feed.xml',
  'manifest.json',
  'status.json',
  'llms.txt',
  'llms-full.txt',
  'ai.txt',
  'tools.json',
  'agent-skills.json'
];

let errors = [];

for (const file of CORE_FILES) {
  if (!fs.existsSync(path.join(__dirname, '..', file))) {
    errors.push(`[MANQUANT] Fichier critique absent : ${file}`);
  } else {
    console.log(`✔ [OK] Fichier critique : ${file}`);
  }
}

// 2. Vérification stricte des assets en cache dans sw.js
const swPath = path.join(__dirname, '..', 'sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  const match = swContent.match(/ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\];/);
  if (match) {
    let assets = [];
    try {
      assets = eval('[' + match[1] + ']');
    } catch (e) {
      errors.push(`[SYNTAXE] Échec du parsing ASSETS_TO_CACHE dans sw.js : ${e.message}`);
    }

    console.log(`\nVérification des ${assets.length} assets déclarés dans sw.js (caches.addAll) :`);
    for (const a of assets) {
      const relPath = a === '/' ? 'index.html' : a.startsWith('/') ? a.slice(1) : a;
      const cleanPath = relPath.split('?')[0].split('#')[0];
      const fullPath = path.join(__dirname, '..', cleanPath);
      if (!fs.existsSync(fullPath)) {
        errors.push(`[SW CRITIQUE] Asset déclaré dans sw.js inexistant sur disque : "${a}" (cherche: ${cleanPath})`);
      } else {
        console.log(`✔ [SW OK] ${a}`);
      }
    }
  } else {
    errors.push('[SW] Constante ASSETS_TO_CACHE introuvable dans sw.js');
  }
} else {
  errors.push('[SW] sw.js introuvable à la racine');
}

if (errors.length > 0) {
  console.error('\n❌ ERREURS DÉTECTÉES :');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('\n🎉 TOUS LES ASSETS ET ENTRÉES DU SERVICE WORKER SONT VALIDES À 100% !');
}
