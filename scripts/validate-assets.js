const fs = require('fs');
const path = require('path');

console.log('=== Vérification de l\'intégrité des assets et du Service Worker ===\n');

// 1. Vérification des fichiers de base
const CORE_FILES = [
  'index.html',
  'agir.html',
  'apercu.html',
  'edition-speciale-reconciliation.html',
  'autochtone.html',
  'dossier-journalistes.html',
  'registre.html',
  'enquete-partis.html',
  'live.html',
  'communiques.html',
  'presse.html',
  'apparitions-publiques.html',
  'stablex.html',
  'contamination.html',
  'loi-93.html',
  'flux.html',
  'viewer.html',
  'sphere-360.html',
  'ai.html',
  'txt.html',
  'reload.html',
  'miroirs.html',
  'politiques.html',
  'netiquette.html',
  'deontologie.html',
  'independance.html',
  'ia-ethique.html',
  'anti-slapp.html',
  'embargo.html',
  'experts.html',
  'tracabilite.html',
  'opsec.html',
  'statut-mineur.html',
  'age.html',
  'vie-privee-parents.html',
  'dependances-licences.html',
  'THIRD-PARTY-NOTICES.md',
  'sitemap.xml',
  'sitemap-news.xml',
  'feed.xml',
  'manifest.json',
  'status.json',
  'llms.txt',
  'llms-full.txt',
  'apis.json',
  'openapi.json',
  'api/index.html',
  'api/v1/corpus.json',
  'api/v1/documents.json',
  'tools.json',
  'agent-skills.json',
  '.well-known/security.txt',
  'security.txt'
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
let cachedAssets = [];
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  const match = swContent.match(/ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\];/);
  if (match) {
    const rawItems = match[1].match(/['"]([^'"]+)['"]/g) || [];
    cachedAssets = rawItems.map(s => s.replace(/['"]/g, ''));

    console.log(`\nVérification des ${cachedAssets.length} assets déclarés dans sw.js (caches.addAll) :`);
    for (const a of cachedAssets) {
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

// 2b. Vérification de la présence de dependances-licences.html dans sw.js et sitemap.xml
const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemapContent.includes('dependances-licences.html')) {
    errors.push('[SITEMAP] Entrée dependances-licences.html manquante dans sitemap.xml');
  } else {
    console.log('✔ [SITEMAP OK] dependances-licences.html présent dans sitemap.xml');
  }
}

if (!cachedAssets.includes('/dependances-licences.html') && !cachedAssets.includes('dependances-licences.html')) {
  errors.push('[SW] dependances-licences.html manquant dans ASSETS_TO_CACHE de sw.js');
} else {
  console.log('✔ [SW OK] dependances-licences.html présent dans ASSETS_TO_CACHE');
}

// 2c. Vérification des en-têtes de licences tierces (Apache-2.0 / MIT)
console.log('\nVérification des avis de licences tierces dans les bundles distribués :');
const licenseChecks = [
  { file: 'assets/vendor/pdfjs/pdf.min.js', required: 'Apache License' },
  { file: 'assets/vendor/pdfjs/pdf.worker.min.js', required: 'Apache License' },
  { file: 'assets/vendor/pdfjs/pdf_viewer.css', required: 'Apache License' },
  { file: 'assets/js/nostr-bundle.js', required: 'Bundled license information' },
  { file: 'assets/vendor/curtains/curtains.umd.min.js', required: 'MIT License' },
  { file: 'assets/js/papaparse.min.js', required: 'License: MIT' }
];

for (const check of licenseChecks) {
  const checkPath = path.join(__dirname, '..', check.file);
  if (fs.existsSync(checkPath)) {
    const fileContent = fs.readFileSync(checkPath, 'utf8');
    if (!fileContent.includes(check.required)) {
      errors.push(`[LICENCE] En-tête de licence tierce manquant dans "${check.file}" (obligation Apache-2.0 / MIT) : un rebuild a probablement supprimé les avis. Restaure output.legalComments.`);
    } else {
      console.log(`✔ [LICENCE OK] En-tête validé dans ${check.file}`);
    }
  }
}

// 2d. Vérification d'absence de b.min.js GPL auto-hébergé sous assets/
function findFilesRecursive(dir, filename, found = []) {
  if (!fs.existsSync(dir)) return found;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFilesRecursive(full, filename, found);
    } else if (entry.name === filename) {
      found.push(full);
    }
  }
  return found;
}

const gplFiles = findFilesRecursive(path.join(__dirname, '..', 'assets'), 'b.min.js');
if (gplFiles.length > 0) {
  errors.push(`[GPL DETECTE] Badge carbone GPL-3.0 détecté en local (${gplFiles.join(', ')}) : il doit rester chargé depuis unpkg.com.`);
} else {
  console.log('✔ [GPL OK] Aucun fichier GPL-3.0 (b.min.js) auto-hébergé dans assets/');
}

// 2e. Vérification de la mitigation CVE-2024-4367 dans assets/js/pdf-viewer.js
const pdfViewerJsPath = path.join(__dirname, '..', 'assets', 'js', 'pdf-viewer.js');
if (fs.existsSync(pdfViewerJsPath)) {
  const viewerContent = fs.readFileSync(pdfViewerJsPath, 'utf8');
  if (!viewerContent.includes('isEvalSupported: false')) {
    errors.push('[SECURITE CRITIQUE] isEvalSupported: false manquant dans assets/js/pdf-viewer.js (protection CVE-2024-4367 requise).');
  } else {
    console.log('✔ [SECURITE OK] Mitigation CVE-2024-4367 active (isEvalSupported: false)');
  }
}

// 2f. Vérification d'absence de liens non chiffrés vers www.cec.org
console.log('\nVérification de l\'absence de liens non chiffrés vers www.cec.org :');
const scanExts = ['.html', '.json', '.js', '.xml'];
const forbiddenCecPattern = /http:\/\/www\.cec\.org(?=[/?#\s"'>]|$)/i;

function scanDirForHttpCec(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'scripts') {
        scanDirForHttpCec(full);
      }
    } else if (scanExts.some(ext => entry.name.endsWith(ext))) {
      const content = fs.readFileSync(full, 'utf8');
      if (forbiddenCecPattern.test(content)) {
        const rel = path.relative(path.join(__dirname, '..'), full);
        errors.push(`[HTTP CEC] Lien non chiffré "http://www.cec.org" trouvé dans : ${rel}`);
      }
    }
  }
}
scanDirForHttpCec(path.join(__dirname, '..'));
console.log('✔ [HTTPS CEC OK] 0 occurrence de lien http vers www.cec.org trouvée.');

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
  // Décodage d'entités en une seule passe pour éviter le double-unescaping (CodeQL alert #33)
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };
  return out.replace(/&(?:amp|lt|gt|quot|#39|apos);/g, match => entityMap[match] || match);
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
    if (clean.startsWith('/api/') || clean.startsWith('api/')) {
      return null;
    }
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

// 7. Vérification de la santé SEO & Prévention des baisses de trafic Google Search
console.log('\nVérification de la santé SEO & Prévention des anomalies Google Search :');

// 7.1 Vérification de robots.txt
const robotsPath = path.join(__dirname, '..', 'robots.txt');
if (fs.existsSync(robotsPath)) {
  const robotsTxt = fs.readFileSync(robotsPath, 'utf8');
  if (!robotsTxt.includes('Allow: /')) {
    errors.push('[SEO ERREUR] robots.txt ne contient pas "Allow: /" pour les moteurs de recherche.');
  }
  if (!robotsTxt.includes('sitemap.xml')) {
    errors.push('[SEO ERREUR] robots.txt ne référence pas le sitemap principal sitemap.xml.');
  }
  console.log('✔ [ROBOTS OK] robots.txt autorise l\'exploration et déclare les sitemaps.');
} else {
  errors.push('[SEO ERREUR] Fichier robots.txt introuvable.');
}

// 7.2 Vérification de l'absence de noindex accidentel sur les pages publiques
const PRIVATE_NOINDEX_PAGES = new Set([
  'admin.html',
  'console-admin.html',
  'editeur.html',
  'studio.html',
  'reload.html',
  'navbar.html',
  '404.html'
]);

let publicPagesAudited = 0;
let jsonLdBlocksAudited = 0;

for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(__dirname, '..', htmlFile);
  const content = fs.readFileSync(htmlPath, 'utf8');

  // Audit noindex
  if (content.toLowerCase().includes('noindex')) {
    if (!PRIVATE_NOINDEX_PAGES.has(htmlFile)) {
      errors.push(`[SEO ALERTE NOINDEX] Page publique contenant "noindex" non autorisée : "${htmlFile}". Risque de désindexation subite.`);
    }
  } else if (!PRIVATE_NOINDEX_PAGES.has(htmlFile)) {
    publicPagesAudited++;
  }

  // Audit balise canonique sur les pages publiques indexables
  if (!PRIVATE_NOINDEX_PAGES.has(htmlFile) && htmlFile !== 'google57da095d83ebd58e.html') {
    if (!content.includes('rel="canonical"')) {
      errors.push(`[SEO ALERTE CANONICAL] Page publique sans balise rel="canonical" : "${htmlFile}".`);
    }
  }

  // Audit syntaxe JSON-LD
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let ldMatch;
  while ((ldMatch = jsonLdRegex.exec(content)) !== null) {
    jsonLdBlocksAudited++;
    try {
      JSON.parse(ldMatch[1]);
    } catch (e) {
      errors.push(`[JSON-LD SYNTAXE] Erreur de parsing JSON-LD dans "${htmlFile}" : ${e.message}`);
    }
  }
}

console.log(`✔ [NOINDEX OK] ${publicPagesAudited} pages publiques vérifiées sans directive noindex accidentelle.`);
console.log(`✔ [CANONICAL OK] Balises rel="canonical" vérifiées sur l'ensemble des pages publiques.`);
console.log(`✔ [JSON-LD OK] ${jsonLdBlocksAudited} blocs de données structurées analysés et 100% valides.`);

if (errors.length > 0) {
  console.error('\n❌ ERREURS DÉTECTÉES :');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('\n🎉 TOUS LES ASSETS, ENTRÉES DU SERVICE WORKER, FAQ ET LIENS SONT VALIDES À 100% !');
}

