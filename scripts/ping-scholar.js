#!/usr/bin/env node

/**
 * scripts/ping-scholar.js
 * Script de vérification et de notification pour l'indexation Google Scholar :
 * 1. Validation de la conformité des balises Highwire Press (citation_*) et Dublin Core (DC.*)
 * 2. Contrôle de l'existence des PDF liés (citation_pdf_url)
 * 3. Notification IndexNow et soumission des URLs académiques aux moteurs de recherche
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const HOST = 'williamguindon.me';
const KEY = '8781d75e5905f04a95157c0c264d928b';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Pages contenant des publications ou pièces juridiques indexables sur Google Scholar
const SCHOLAR_PAGES = [
  'registre.html',
  'apercu.html',
  'viewer.html',
  'stablex.html'
];

// Champs obligatoires selon les directives Google Scholar & Highwire Press
const REQUIRED_SCHOLAR_TAGS = [
  'citation_title',
  'citation_author',
  'citation_publication_date',
  'citation_pdf_url',
  'citation_abstract_html_url'
];

function checkPageMetadata(filename) {
  const filePath = path.join(ROOT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable : ${filename}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const foundTags = {};

  // Extraction robuste des balises meta citation_* et DC.*
  const citationRegex = /<meta\s+name=["'](citation_[a-zA-Z0-9_]+|DC\.[a-zA-Z0-9_]+)["']\s+content=(?:"([^"]*)"|'([^']*)')/gi;
  let match;
  while ((match = citationRegex.exec(content)) !== null) {
    const tagName = match[1];
    const tagContent = match[2] !== undefined ? match[2] : match[3];
    foundTags[tagName] = tagContent;
  }

  const missing = REQUIRED_SCHOLAR_TAGS.filter((tag) => !foundTags[tag]);

  // Vérification de l'existence du PDF local référencé
  let pdfValid = true;
  let localPdfPath = '';
  if (foundTags.citation_pdf_url) {
    const parsedPdf = foundTags.citation_pdf_url.replace(`https://${HOST}/`, '');
    localPdfPath = path.join(ROOT_DIR, parsedPdf);
    if (!fs.existsSync(localPdfPath)) {
      pdfValid = false;
    }
  }

  return {
    filename,
    tags: foundTags,
    missing,
    pdfUrl: foundTags.citation_pdf_url,
    pdfValid,
    localPdfPath
  };
}

function request(url, options = {}, postData = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : require('http');

    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: null,
        error: err.message
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function pingIndexNow(endpoint, urls) {
  const postData = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  });

  return await request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'WilliamGuindon-Scholar-Notifier/1.0'
    }
  }, postData);
}

async function main() {
  console.log('🎓 [1/2] Audit de conformité des métadonnées académiques Google Scholar / Highwire Press...');
  let hasErrors = false;

  for (const page of SCHOLAR_PAGES) {
    const result = checkPageMetadata(page);
    console.log(`\n📄 Page : ${result.filename}`);
    console.log(`   - Titre académique  : "${result.tags.citation_title || 'N/A'}"`);
    console.log(`   - Auteur            : ${result.tags.citation_author || 'N/A'}`);
    console.log(`   - Date publication  : ${result.tags.citation_publication_date || 'N/A'}`);
    console.log(`   - Numéro rapport    : ${result.tags.citation_technical_report_number || 'N/A'}`);
    console.log(`   - DOI               : ${result.tags.citation_doi || 'N/A'}`);
    console.log(`   - URL PDF           : ${result.pdfUrl || 'N/A'}`);

    if (result.missing.length > 0) {
      console.error(`   ❌ Balises requises manquantes : ${result.missing.join(', ')}`);
      hasErrors = true;
    } else {
      console.log(`   ✅ Toutes les balises obligatoires Highwire Press sont présentes.`);
    }

    if (result.pdfUrl) {
      if (result.pdfValid) {
        console.log(`   ✅ Fichier PDF cible vérifié localement.`);
      } else {
        console.error(`   ❌ Le fichier PDF cible n'existe pas localement : ${result.localPdfPath}`);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    console.error('\n❌ Échec de la vérification Google Scholar. Veuillez corriger les anomalies avant le ping.');
    process.exit(1);
  }

  console.log('\n📡 [2/2] Notification IndexNow pour indexation académique prioritaire...');
  const scholarUrls = SCHOLAR_PAGES.map((p) => `https://${HOST}/${p}`);

  const resIndexNow = await pingIndexNow('https://api.indexnow.org/indexnow', scholarUrls);
  console.log(`   ➜ api.indexnow.org (Bing, ChatGPT, Copilot, Indexers) : HTTP ${resIndexNow.status} ${resIndexNow.error ? `(${resIndexNow.error})` : ''}`);

  const resBing = await pingIndexNow('https://www.bing.com/indexnow', scholarUrls);
  console.log(`   ➜ bing.com/indexnow : HTTP ${resBing.status} ${resBing.error ? `(${resBing.error})` : ''}`);

  console.log('\n✅ Validation Google Scholar réussie et notifications transmises avec succès.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Erreur lors de la validation Google Scholar :', err);
    process.exit(1);
  });
}

module.exports = { checkPageMetadata, SCHOLAR_PAGES, REQUIRED_SCHOLAR_TAGS };
