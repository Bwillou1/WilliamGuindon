#!/usr/bin/env node

/**
 * scripts/archive-wayback.js
 * 
 * Envoie automatiquement l'intégralité du site officiel de William Guindon
 * (williamguindon.me) à l'Internet Archive (Wayback Machine - Save Page Now).
 * 
 * - Extrait toutes les URLs depuis sitemap.xml
 * - Couvre les URLs standard (.html) et les URLs propres sans extension
 * - Archive les documents officiels et métadonnées pour IA (llms.txt, corpus, status)
 * - Gestion automatique du rate limit et affichage des horodatages archivés
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const HOST = 'williamguindon.me';

function getUrls() {
  const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const sitemapUrls = [...xml.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map(m => m[1].trim());

  // URLs propres sans .html
  const cleanUrls = sitemapUrls
    .filter(u => u.endsWith('.html'))
    .map(u => u.replace(/\.html$/, ''));

  // Ressources machine et protocolaires critiques
  const protocolUrls = [
    `https://${HOST}/status.json`,
    `https://${HOST}/feed.xml`,
    `https://${HOST}/llms.txt`,
    `https://${HOST}/llms-full.txt`,
    `https://${HOST}/transcriptions.txt`,
    `https://${HOST}/apis.json`,
    `https://${HOST}/openapi.json`,
    `https://${HOST}/api/v1/corpus.json`,
    `https://${HOST}/api/v1/documents.json`,
    `https://${HOST}/.well-known/agent-skills/index.json`
  ];

  return Array.from(new Set([
    `https://${HOST}/`,
    ...sitemapUrls,
    ...cleanUrls,
    ...protocolUrls
  ]));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function saveWayback(url) {
  return new Promise((resolve) => {
    try {
      const saveUrl = `https://web.archive.org/save/${url}`;
      const req = https.get(saveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WilliamGuindonArchiver/1.0; +https://williamguindon.me/)'
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            location: res.headers.location || null
          });
        });
      });

      req.on('error', (err) => {
        resolve({ status: 0, error: err.message });
      });

      req.setTimeout(35000, () => {
        req.destroy();
        resolve({ status: 408, error: 'Timeout' });
      });
    } catch (e) {
      resolve({ status: 0, error: e.message });
    }
  });
}

async function run() {
  const urls = getUrls();
  console.log(`🏛️ Démarrage de l'archivage complet sur Wayback Machine (${urls.length} URLs au total)...`);

  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const shortPath = url.replace(`https://${HOST}`, '') || '/';
    process.stdout.write(`[${i + 1}/${urls.length}] Archivage : ${shortPath} ... `);

    let res = await saveWayback(url);

    // En cas de rate limit temporaire (HTTP 429), attendre 5 secondes et réessayer une fois
    if (res.status === 429) {
      process.stdout.write('⏳ Rate limit atteint, pause 5s ... ');
      await delay(5000);
      res = await saveWayback(url);
    }

    if (res.status === 200 || res.status === 302) {
      successCount++;
      const loc = res.location ? `-> ${res.location}` : '✔ Enregistré';
      console.log(`[OK ${res.status}] ${loc}`);
    } else {
      skippedCount++;
      console.log(`[HTTP ${res.status}] ${res.error || ''}`);
    }

    // Pause de courtoisie pour respecter l'infrastructure Internet Archive
    await delay(1500);
  }

  console.log(`\n🎉 Archivage terminé avec succès : ${successCount} URLs archivées (${skippedCount} ignorées ou en attente).`);
}

if (require.main === module) {
  run().catch(err => {
    console.error('Erreur archivage :', err);
    process.exit(1);
  });
}

module.exports = { run, getUrls, saveWayback };
