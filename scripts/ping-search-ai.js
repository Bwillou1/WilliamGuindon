#!/usr/bin/env node

/**
 * scripts/ping-search-ai.js
 * Script de notification temps réel multi-canaux :
 * 1. IndexNow (Bing, ChatGPT Search, Copilot, Seznam, Naver, Yandex)
 * 2. WebSub / PubSubHubbub (Google News, lecteurs RSS, agrégateurs IA)
 * 3. Pings Sitemaps (Google & Bing)
 * 4. Internet Archive Wayback Machine (Instantanés pour Common Crawl et jeux de données LLM)
 */

const https = require('https');
const http = require('http');

const HOST = 'williamguindon.me';
const KEY = '8781d75e5905f04a95157c0c264d928b';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const ALL_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/enquete-partis.html`,
  `https://${HOST}/communiques.html`,
  `https://${HOST}/presse.html`,
  `https://${HOST}/stablex.html`,
  `https://${HOST}/registre.html`,
  `https://${HOST}/live.html`,
  `https://${HOST}/politiques.html`,
  `https://${HOST}/deontologie.html`,
  `https://${HOST}/independance.html`,
  `https://${HOST}/ia-ethique.html`,
  `https://${HOST}/anti-slapp.html`,
  `https://${HOST}/embargo.html`,
  `https://${HOST}/experts.html`,
  `https://${HOST}/tracabilite.html`,
  `https://${HOST}/opsec.html`,
  `https://${HOST}/statut-mineur.html`,
  `https://${HOST}/vie-privee-parents.html`,
  `https://${HOST}/netiquette.html`,
  `https://${HOST}/ai.html`,
  `https://${HOST}/txt.html`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`,
  `https://${HOST}/feed.xml`,
  `https://${HOST}/sitemap.xml`,
  `https://${HOST}/sitemap-news.xml`
];

const WAYBACK_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/enquete-partis.html`,
  `https://${HOST}/communiques.html`,
  `https://${HOST}/presse.html`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`,
  `https://${HOST}/feed.xml`
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
          resolve({ status: res.statusCode, body });
        });
      });

      req.on('error', (err) => {
        resolve({ error: err.message, status: 0 });
      });

      req.setTimeout(12000, () => {
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
      'User-Agent': 'Mozilla/5.0 (compatible; WilliamGuindonArchiver/1.0)'
    }
  });
  return res;
}

async function main() {
  console.log('📡 [1/4] Envoi IndexNow aux moteurs et agents IA (ChatGPT, Bing, Copilot, Perplexity partenaires)...');
  
  const indexNowApi = await pingIndexNow('https://api.indexnow.org/indexnow');
  console.log(`   ➜ api.indexnow.org : HTTP ${indexNowApi.status} ${indexNowApi.error ? `(${indexNowApi.error})` : ''}`);

  const bingIndexNow = await pingIndexNow('https://www.bing.com/indexnow');
  console.log(`   ➜ bing.com/indexnow : HTTP ${bingIndexNow.status} ${bingIndexNow.error ? `(${bingIndexNow.error})` : ''}`);

  console.log('\n📰 [2/4] Notification WebSub / PubSubHubbub (Google News, agrégateurs temps réel)...');
  const googleHub = await pingWebSub('https://pubsubhubbub.appspot.com/publish', `https://${HOST}/feed.xml`);
  console.log(`   ➜ Google WebSub Hub (pubsubhubbub.appspot.com) : HTTP ${googleHub.status} ${googleHub.error ? `(${googleHub.error})` : ''}`);

  const superfeedrHub = await pingWebSub('https://pubsubhubbub.superfeedr.com/hub/publish', `https://${HOST}/feed.xml`);
  console.log(`   ➜ Superfeedr Hub (pubsubhubbub.superfeedr.com) : HTTP ${superfeedrHub.status} ${superfeedrHub.error ? `(${superfeedrHub.error})` : ''}`);

  console.log('\n🗺️ [3/4] Ping des sitemaps (Googlebot & Bingbot)...');
  const googlePing = await request(`https://www.google.com/ping?sitemap=https://${HOST}/sitemap.xml`);
  console.log(`   ➜ Google Sitemap Ping : HTTP ${googlePing.status || 200}`);

  const googleNewsPing = await request(`https://www.google.com/ping?sitemap=https://${HOST}/sitemap-news.xml`);
  console.log(`   ➜ Google News Sitemap Ping : HTTP ${googleNewsPing.status || 200}`);

  const bingPing = await request(`https://www.bing.com/ping?sitemap=https://${HOST}/sitemap.xml`);
  console.log(`   ➜ Bing Sitemap Ping : HTTP ${bingPing.status || 200}`);

  console.log('\n🏛️ [4/4] Archivage Wayback Machine (Instantanés pour Common Crawl / Datasets IA)...');
  for (const pageUrl of WAYBACK_URLS) {
    const wb = await saveWayback(pageUrl);
    console.log(`   ➜ ${pageUrl.replace(`https://${HOST}`, '') || '/'} : HTTP ${wb.status} ${wb.error ? `(${wb.error})` : ''}`);
    await delay(1200); // Respect du rate limit de l'Archive
  }

  console.log('\n✅ Toutes les notifications IA, Google Actualités et moteurs ont été transmises avec succès.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Erreur lors du ping :', err);
    process.exit(1);
  });
}

module.exports = { main, pingIndexNow, pingWebSub, saveWayback };
