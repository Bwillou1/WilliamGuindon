const fs = require('fs');
const path = require('path');

console.log('=== Vérification de l\'intégrité des assets et du Service Worker ===\n');

// 1. Vérification des fichiers de base
const CORE_FILES = [
  'index.html',
  'registre.html',
  'live.html',
  'communiques.html',
  'presse.html',
  'stablex.html',
  'viewer.html',
  'ai.html',
  'txt.html',
  'netiquette.html',
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

// Helper pour extraire le texte brut sans regex tag stripping (évite alertes CodeQL)
function stripHtml(input) {
  if (!input || typeof input !== 'string') return '';
  let out = '';
  let inTag = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '<') {
      inTag = true;
    } else if (ch === '>') {
      inTag = false;
    } else if (!inTag) {
      out += ch;
    }
  }
  return out.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// 3. Validation de cohérence FAQ (HTML visible vs JSON-LD Schema.org FAQPage)
const indexPath = path.join(__dirname, '..', 'index.html');
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  // Parse JSON-LD FAQPage
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let faqJsonLd = null;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(indexHtml)) !== null) {
    const raw = scriptMatch[1].trim();
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
    const q = stripHtml(m[1]).trim();
    const a = stripHtml(m[2]).replace(/\s+/g, " ").trim();
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
      const jText = stripHtml(j.acceptedAnswer?.text || "").replace(/\s+/g, " ").trim();

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

// 4. Vérification de l'intégrité des liens internes et ressources locales dans toutes les pages HTML
console.log('\nVérification des liens internes et ressources locales dans les fichiers HTML :');
const htmlFiles = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.endsWith('.html'));
let checkedLinksCount = 0;

function getInternalPath(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.includes('${')) return null;

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const parsed = new URL(trimmed);
      if (parsed.hostname === 'williamguindon.me' || parsed.hostname === 'www.williamguindon.me') {
        const p = parsed.pathname;
        return p === '/' ? 'index.html' : p;
      }
      return null;
    }

    // Autres protocoles (mailto, tel, javascript, data, blob, etc.)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      return null;
    }

    const clean = trimmed.split('?')[0].split('#')[0];
    return clean === '' || clean === '/' ? 'index.html' : clean;
  } catch {
    return null;
  }
}

for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(__dirname, '..', htmlFile);
  const content = fs.readFileSync(htmlPath, 'utf8');

  // Match href and src attributes
  const linkRegex = /(?:href|src)=["']([^"']+)["']/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const rawLink = match[1].trim();
    const cleanUrl = getInternalPath(rawLink);

    if (cleanUrl === null) {
      continue;
    }

    checkedLinksCount++;

    const targetRelPath = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl;
    const targetFullPath = path.join(__dirname, '..', targetRelPath);

    if (!fs.existsSync(targetFullPath)) {
      errors.push(`[LIEN CASSE] Dans "${htmlFile}" : cible introuvable "${rawLink}" (résolu en: ${targetRelPath})`);
    }

    // If it's a viewer.html with ?file= param, also check the file parameter
    if (rawLink.includes('viewer.html?file=')) {
      const queryPart = rawLink.split('?')[1] || '';
      const urlParams = new URLSearchParams(queryPart.split('#')[0]);
      const docFile = urlParams.get('file');
      if (docFile && !docFile.startsWith('http')) {
        const docClean = docFile.startsWith('/') ? docFile.slice(1) : docFile;
        const docFullPath = path.join(__dirname, '..', docClean);
        if (!fs.existsSync(docFullPath)) {
          errors.push(`[DOC MANQUANT] Dans "${htmlFile}" via viewer : document introuvable "${docFile}"`);
        }
      }
    }
  }
}

console.log(`✔ [LIENS OK] ${checkedLinksCount} liens/ressources internes vérifiés sans erreur.`);

if (errors.length > 0) {
  console.error('\n❌ ERREURS DÉTECTÉES :');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('\n🎉 TOUS LES ASSETS, ENTRÉES DU SERVICE WORKER, FAQ ET LIENS SONT VALIDES À 100% !');
}

