const fs = require('fs');
const path = require('path');

console.log('=== Vérification de l\'intégrité des assets et du Service Worker ===\n');

// 1. Vérification des fichiers de base
const CORE_FILES = [
  'index.html',
  'en.html',
  'es.html',
  'registre.html',
  'live.html',
  'communiques.html',
  'presse.html',
  'stablex.html',
  'viewer.html',
  'ai.html',
  'txt.html',
  'sitemap.xml',
  'feed.xml',
  'manifest.json',
  'status.json',
  'llms.txt',
  'llms-full.txt',
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

// 3. Validation de cohérence FAQ (HTML visible vs JSON-LD Schema.org FAQPage)
const indexPath = path.join(__dirname, '..', 'index.html');
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  // Parse JSON-LD FAQPage
  const scripts = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  let faqJsonLd = null;
  for (const s of scripts) {
    const raw = s.replace(/<\/?script[^>]*>/g, "");
    try {
      const data = JSON.parse(raw);
      if (data["@graph"]) {
        const f = data["@graph"].find(x => x["@type"] === "FAQPage");
        if (f) faqJsonLd = f;
      } else if (data["@type"] === "FAQPage") {
        faqJsonLd = data;
      }
    } catch (e) {}
  }

  // Parse HTML visible FAQs
  const visibleFaqs = [];
  const detailsRegex = /<details[^>]*class="[^"]*faq[^"]*"[^>]*>[\s\S]*?<summary>(.*?)<\/summary>[\s\S]*?<p class="faq-content">([\s\S]*?)<\/p>[\s\S]*?<\/details>/g;
  let m;
  while ((m = detailsRegex.exec(indexHtml)) !== null) {
    const q = m[1].replace(/<[^>]+>/g, "").trim();
    const a = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    visibleFaqs.push({ q, a });
  }

  console.log(`\nVérification de la cohérence FAQ (${visibleFaqs.length} questions visibles vs JSON-LD) :`);
  if (!faqJsonLd || !faqJsonLd.mainEntity) {
    errors.push('[FAQ] Schéma JSON-LD FAQPage introuvable dans index.html');
  } else if (visibleFaqs.length !== faqJsonLd.mainEntity.length) {
    errors.push(`[FAQ] Nombre de questions différent : ${visibleFaqs.length} dans le HTML vs ${faqJsonLd.mainEntity.length} dans le JSON-LD`);
  } else {
    for (let i = 0; i < visibleFaqs.length; i++) {
      const v = visibleFaqs[i];
      const j = faqJsonLd.mainEntity[i];
      const jText = (j.acceptedAnswer?.text || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

      if (v.q !== j.name) {
        errors.push(`[FAQ Q${i+1}] Intitulé question différent : HTML "${v.q}" vs JSON-LD "${j.name}"`);
      } else if (v.a !== jText) {
        errors.push(`[FAQ A${i+1}] Réponse texte différente : HTML "${v.a}" vs JSON-LD "${jText}"`);
      } else {
        console.log(`✔ [FAQ OK] Q${i+1} : "${v.q}"`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ ERREURS DÉTECTÉES :');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('\n🎉 TOUS LES ASSETS, ENTRÉES DU SERVICE WORKER ET FAQ SONT VALIDES À 100% !');
}
