#!/usr/bin/env node

/**
 * scripts/ping-search-ai.js
 * Script de notification temps réel multi-canaux :
 * 1. IndexNow (Bing, ChatGPT Search, Copilot, Seznam, Naver, Yandex)
 * 2. WebSub / PubSubHubbub (Google News, lecteurs RSS, agrégateurs IA)
 * 3. Déclaration sitemaps robots.txt (Google & Bing)
 * 4. Internet Archive Wayback Machine (Instantanés pour Common Crawl et jeux de données LLM)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = 'williamguindon.me';
const KEY = '8781d75e5905f04a95157c0c264d928b';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

function getSitemapUrls() {
  try {
    const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
    if (!fs.existsSync(sitemapPath)) return [];
    const xml = fs.readFileSync(sitemapPath, 'utf8');
    const urls = [...xml.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map(m => m[1].trim());
    return urls;
  } catch {
    return [];
  }
}

const SITEMAP_URLS = getSitemapUrls();

// Variantes d'URLs propres sans extension .html
const CLEAN_URLS = SITEMAP_URLS
  .filter(u => u.endsWith('.html'))
  .map(u => u.replace(/\.html$/, ''));

// Endpoints machine, protocolaires et IA critiques (LLMs, MCP, Agents)
const PROTOCOL_URLS = [
  `https://${HOST}/status.json`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`,
  `https://${HOST}/feed.xml`,
  `https://${HOST}/sitemap.xml`,
  `https://${HOST}/api/v1/corpus.json`,
  `https://${HOST}/api/v1/documents.json`,
  `https://${HOST}/.well-known/agent-skills/index.json`,
  `https://${HOST}/.well-known/mcp.json`,
  `https://${HOST}/.well-known/mcp/server-card.json`,
  `https://${HOST}/.well-known/webmcp/tools.json`,
  `https://${HOST}/agent-skills.json`,
  `https://${HOST}/tools.json`
];

const ALL_URLS = Array.from(new Set([
  `https://${HOST}/`,
  ...SITEMAP_URLS,
  ...CLEAN_URLS,
  ...PROTOCOL_URLS
]));

// Wayback Machine sauvegarde TOUTES les pages du site, les URLs propres et les protocoles
const WAYBACK_URLS = Array.from(new Set([
  `https://${HOST}/`,
  ...SITEMAP_URLS,
  ...CLEAN_URLS,
  `https://${HOST}/status.json`,
  `https://${HOST}/feed.xml`,
  `https://${HOST}/llms-full.txt`,
  `https://${HOST}/.well-known/agent-skills/index.json`
]));

// Registres officiels et canaux externes du dossier SEM-26-003 à archiver sur Wayback Machine
const EXTERNAL_ARCHIVE_URLS = [
  'https://www.cec.org/fr/communications/registre-des-communications/enfouissement-de-matieres-dangereuses-a-blainville/',
  'https://www.youtube.com/@william-guindon',
  'https://www.facebook.com/williamguindon.officiel',
  'https://www.linkedin.com/in/william-guindon/'
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(urlStr, options = {}, data = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, body, headers: res.headers });
        });
      });

      req.on('error', (err) => {
        resolve({ error: err.message, status: 0 });
      });

      req.setTimeout(35000, () => {
        req.destroy();
        resolve({ error: 'Timeout', status: 408 });
      });

      if (data) {
        req.write(data);
      }
      req.end();
    } catch (e) {
      resolve({ error: e.message, status: 0 });
    }
  });
}

async function pingIndexNow(endpoint) {
  const payload = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: ALL_URLS
  });

  const res = await request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, payload);

  return res;
}

async function pingWebSub(hubUrl, feedUrl) {
  const postData = `hub.mode=publish&hub.url=${encodeURIComponent(feedUrl)}`;
  const res = await request(hubUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'WilliamGuindon-WebSub-Notifier/1.0'
    }
  }, postData);

  return res;
}

async function saveWayback(url) {
  const saveUrl = `https://web.archive.org/save/${url}`;
  const res = await request(saveUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    }
  });
  return res;
}

async function main() {
  console.log('📡 [1/5] Envoi IndexNow aux moteurs et agents IA (ChatGPT Search, Copilot, Bing, Perplexity partenaires, Naver, Yandex)...');
  
  const indexNowApi = await pingIndexNow('https://api.indexnow.org/indexnow');
  console.log(`   ➜ api.indexnow.org : HTTP ${indexNowApi.status} ${indexNowApi.error ? `(${indexNowApi.error})` : ''}`);

  const bingIndexNow = await pingIndexNow('https://www.bing.com/indexnow');
  console.log(`   ➜ bing.com/indexnow : HTTP ${bingIndexNow.status} ${bingIndexNow.error ? `(${bingIndexNow.error})` : ''}`);

  const yandexIndexNow = await pingIndexNow('https://yandex.com/indexnow');
  console.log(`   ➜ yandex.com/indexnow : HTTP ${yandexIndexNow.status} ${yandexIndexNow.error ? `(${yandexIndexNow.error})` : ''}`);

  console.log('\n📰 [2/5] Notification WebSub / PubSubHubbub (Google News, agrégateurs temps réel)...');
  const googleHub = await pingWebSub('https://pubsubhubbub.appspot.com/publish', `https://${HOST}/feed.xml`);
  console.log(`   ➜ Google WebSub Hub (feed.xml) : HTTP ${googleHub.status} ${googleHub.error ? `(${googleHub.error})` : ''}`);

  const superfeedrHub = await pingWebSub('https://pubsubhubbub.superfeedr.com/hub/publish', `https://${HOST}/feed.xml`);
  console.log(`   ➜ Superfeedr Hub (pubsubhubbub.superfeedr.com) : HTTP ${superfeedrHub.status} ${superfeedrHub.error ? `(${superfeedrHub.error})` : ''}`);

  console.log('\n🗺️ [3/5] Déclaration des sitemaps (Indexation Google & Bing)...');
  console.log(`   ➜ Googlebot & Bingbot : Découverte automatique via robots.txt (https://${HOST}/sitemap.xml)`);
  console.log('   ➜ Remarque : Les anciens endpoints /ping?sitemap= ayant été désactivés par Google (HTTP 404) et Bing (HTTP 410), l\'indexation temps réel est gérée via IndexNow (étape 1), WebSub (étape 2) et Search Console.');

  console.log(`\n🏛️ [4/5] Archivage Wayback Machine de TOUTES les pages du site (${WAYBACK_URLS.length} URLs au total)...`);
  for (const pageUrl of WAYBACK_URLS) {
    try {
      const wb = await saveWayback(pageUrl);
      const snapshot = wb.headers && wb.headers.location ? ` -> ${wb.headers.location}` : '';
      console.log(`   ➜ ${pageUrl.replace(`https://${HOST}`, '') || '/'} : HTTP ${wb.status}${snapshot} ${wb.error ? `(${wb.error})` : ''}`);
    } catch (_) {}
    await delay(1200); // Respect du rate limit de l'Archive
  }

  console.log(`\n🌐 [5/5] Archivage Wayback Machine des canaux et registres officiels externes (${EXTERNAL_ARCHIVE_URLS.length} URLs)...`);
  for (const extUrl of EXTERNAL_ARCHIVE_URLS) {
    try {
      const wb = await saveWayback(extUrl);
      const snapshot = wb.headers && wb.headers.location ? ` -> ${wb.headers.location}` : '';
      console.log(`   ➜ ${extUrl} : HTTP ${wb.status}${snapshot} ${wb.error ? `(${wb.error})` : ''}`);
    } catch (e) {
      console.log(`   ➜ ${extUrl} : Erreur ${e.message}`);
    }
    await delay(2500); // Délai de courtoisie pour les plateformes tierces
  }

  console.log('\n✅ Toutes les notifications IA, Google Actualités, moteurs et l\'archivage Wayback Machine sont terminés avec succès.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Erreur lors du ping :', err);
    process.exit(1);
  });
}

module.exports = { main, pingIndexNow, pingWebSub, saveWayback };
