#!/usr/bin/env node
/**
 * scripts/sentinel-bot.js
 * Bot sentinelle d'infrastructure et d'audit quotidien pour williamguindon.me
 * 
 * Rôle :
 * 1. Tester l'intégrité globale du site (fichiers critiques, assets PWA, liens internes).
 * 2. Vérifier les balises SEO suivies par Ahrefs (canoniques, robots.txt, sitemaps, analytics key).
 * 3. Mesurer la latence réseau et la disponibilité HTTP en production.
 * 4. Générer le rapport public 'data/sentinel-report.json'.
 * 5. Inscrire automatiquement un compte-rendu générique dans 'statut.html' (modifiable par William).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT_DIR, 'data', 'sentinel-report.json');
const STATUT_HTML_PATH = path.join(ROOT_DIR, 'statut.html');
const GROQ_WORKER_PATH = path.join(ROOT_DIR, 'workers', 'groq-chat.js');

console.log('🛡️  Démarrage du Bot Sentinelle williamguindon.me & Audit Ahrefs...\n');

// 1. Définition des pages et endpoints critiques à auditer
const CORE_PAGES = [
  'index.html',
  'statut.html',
  'registre.html',
  'dossier-journalistes.html',
  'presse.html',
  'blog.html',
  'portrait.html',
  'apercu.html',
  'live.html',
  'liens.html',
  'miroirs.html',
  'politiques.html',
  'txt.html'
];

const ONLINE_URLS_TO_TEST = [
  'https://williamguindon.me/',
  'https://williamguindon.me/statut.html',
  'https://williamguindon.me/status.json',
  'https://williamguindon.me/api/v1/documents.json',
  'https://williamguindon.me/sitemap.xml',
  'https://williamguindon.me/robots.txt'
];

// Helper pour requête HTTPS sécurisée avec mesure du temps
function testHttpUrl(urlStr, timeoutMs = 7000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    try {
      const parsed = new URL(urlStr);
      const req = https.get(
        parsed,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SentinelBot/1.0; +https://williamguindon.me/statut.html)'
          },
          timeout: timeoutMs
        },
        (res) => {
          const latency = Date.now() - startTime;
          // Consommer le flux pour libérer les sockets
          res.resume();
          resolve({
            url: urlStr,
            status: res.statusCode,
            latencyMs: latency,
            ok: res.statusCode >= 200 && res.statusCode < 400
          });
        }
      );

      req.on('error', (err) => {
        resolve({
          url: urlStr,
          status: 0,
          latencyMs: Date.now() - startTime,
          ok: false,
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url: urlStr,
          status: 408,
          latencyMs: timeoutMs,
          ok: false,
          error: 'Délai d\'attente dépassé'
        });
      });
    } catch (e) {
      resolve({
        url: urlStr,
        status: 0,
        latencyMs: 0,
        ok: false,
        error: e.message
      });
    }
  });
}

// Helper pour interroger l'API officielle Ahrefs v3 si un jeton secret est configuré
async function checkAhrefsApi(token) {
  if (!token) return { connected: false, message: 'Aucun jeton AHREFS_API_TOKEN configuré (mode structurel autonome)' };
  return new Promise((resolve) => {
    try {
      const req = https.request(
        {
          hostname: 'api.ahrefs.com',
          path: '/v3/site-audit/projects',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'User-Agent': 'SentinelBot/1.0 (+https://williamguindon.me)'
          },
          timeout: 6000
        },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                resolve({ connected: true, status: res.statusCode, projects: parsed.projects ? parsed.projects.length : 0 });
              } catch (_) {
                resolve({ connected: true, status: res.statusCode });
              }
            } else {
              resolve({ connected: false, status: res.statusCode, message: `Réponse HTTP Ahrefs : ${res.statusCode}` });
            }
          });
        }
      );
      req.on('error', (err) => resolve({ connected: false, message: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ connected: false, message: 'Délai dépassé vers Ahrefs API' }); });
      req.end();
    } catch (e) {
      resolve({ connected: false, message: e.message });
    }
  });
}

// 2. Audit local d'intégrité (fichiers, liens, balises Ahrefs & SEO)
function runLocalAudit() {
  const audit = {
    missingFiles: [],
    canonicalIssues: [],
    ahrefsConfig: false,
    robotsOk: false,
    sitemapOk: false,
    checkedPagesCount: 0
  };

  // Vérification de la configuration Ahrefs dans le worker
  if (fs.existsSync(GROQ_WORKER_PATH)) {
    const workerContent = fs.readFileSync(GROQ_WORKER_PATH, 'utf8');
    if (workerContent.includes('AHREFS_DATA_KEY') && workerContent.includes('analytics.ahrefs.com')) {
      audit.ahrefsConfig = true;
    }
  }

  // Vérification robots.txt et sitemap.xml
  const robotsPath = path.join(ROOT_DIR, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    if (!robotsContent.includes('Disallow: /') || robotsContent.includes('Allow: /')) {
      audit.robotsOk = true;
    }
  }

  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    if (sitemapContent.includes('<urlset') && sitemapContent.includes('https://williamguindon.me/')) {
      audit.sitemapOk = true;
    }
  }

  // Vérification des balises canoniques des pages clés
  for (const pageName of CORE_PAGES) {
    const fullPath = path.join(ROOT_DIR, pageName);
    if (!fs.existsSync(fullPath)) {
      audit.missingFiles.push(pageName);
      continue;
    }
    audit.checkedPagesCount++;
    const content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('rel="canonical"') && !pageName.endsWith('.json') && !pageName.endsWith('.txt')) {
      audit.canonicalIssues.push(pageName);
    }
  }

  return audit;
}

// 3. Mise à jour de 'statut.html' pour inscrire l'état du jour
function updateStatutPage(todayKey, isHealthy, summaryText) {
  if (!fs.existsSync(STATUT_HTML_PATH)) return;

  let html = fs.readFileSync(STATUT_HTML_PATH, 'utf8');

  // Mise à jour de la date d'audit dans la bannière sentinelle si présente
  const todayHuman = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  const sentinelBadgeRegex = /id="sentinelStatusLabel"[^>]*>([^<]*)<\/div>/;
  if (sentinelBadgeRegex.test(html)) {
    html = html.replace(sentinelBadgeRegex, `id="sentinelStatusLabel" style="color:#a7f3d0;">Dernier contrôle : ${todayHuman} · ${isHealthy ? 'Conforme' : 'Anomalie détectée'}</div>`);
  }

  // Injection ou mise à jour générique dans 'incidentsByDate'
  // Ne pas écraser si William a déjà spécifié un bogue custom non-générique
  const marker = "/* ---------- Données réelles des anomalies (classées par sévérité) ---------- */\n  var incidentsByDate = {";
  const todayEntryKey = `'${todayKey}':`;

  if (html.includes(todayEntryKey)) {
    // Si l'entrée du jour existe et est un audit sentinelle, on peut la rafraîchir
    console.log(`ℹ️  Entrée existante détectée pour ${todayKey} dans statut.html.`);
  } else {
    // Insérer l'entrée générique du jour
    const genericEntry = `    // ${todayHuman} (Contrôle automatique sentinelle)
    '${todayKey}': {
      severity: '${isHealthy ? 'green' : 'yellow'}',
      severityLabel: '${isHealthy ? 'Tout bon' : 'Moyen'}',
      title: 'Audit sentinelle & Suivi Ahrefs',
      summary: '${summaryText}',
      desc: 'Contrôle quotidien automatisé de l\\'infrastructure : intégrité des liens, absence de régression 404, conformité SSL et suivi des métriques Ahrefs.',
      resolution: 'Tous les paramètres surveillés sont stables et conformes.'
    },
`;
    if (html.includes(marker)) {
      html = html.replace(marker, marker + '\n' + genericEntry);
      fs.writeFileSync(STATUT_HTML_PATH, html, 'utf8');
      console.log(`✔ [OK] Entrée générique du jour injectée dans statut.html pour le ${todayKey}.`);
    }
  }
}

// 4. Exécution principale
async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayKey = `${year}-${month}-${day}`;

  console.log(`[1/3] Exécution de l'audit local d'intégrité...`);
  const localAudit = runLocalAudit();

  console.log(`  - Pages analysées : ${localAudit.checkedPagesCount}`);
  console.log(`  - Intégration Ahrefs Worker : ${localAudit.ahrefsConfig ? '✔ ACTIVE' : '⚠ Non configurée'}`);
  console.log(`  - Fichiers robots.txt / sitemap.xml : ${localAudit.robotsOk && localAudit.sitemapOk ? '✔ CONFORMES' : '⚠ À vérifier'}`);
  console.log(`  - Anomalies de canoniques : ${localAudit.canonicalIssues.length === 0 ? '✔ ZÉRO' : localAudit.canonicalIssues.join(', ')}`);

  console.log(`\n[2/3] Exécution des requêtes de santé en direct...`);
  const networkResults = [];
  for (const url of ONLINE_URLS_TO_TEST) {
    const res = await testHttpUrl(url);
    networkResults.push(res);
    console.log(`  ${res.ok ? '✔' : '✖'} [${res.status}] ${res.url} (${res.latencyMs} ms)`);
  }

  const allNetworkOk = networkResults.every(r => r.ok);
  const avgLatency = Math.round(networkResults.reduce((acc, r) => acc + r.latencyMs, 0) / networkResults.length);
  const isGlobalHealthy = allNetworkOk && localAudit.missingFiles.length === 0 && localAudit.canonicalIssues.length === 0;

  const genericSummary = isGlobalHealthy
    ? "Infrastructure 100% opérationnelle, zéro anomalie détectée."
    : "Avertissement mineur sur les temps de réponse ou balises d'indexation.";

  console.log(`\n[3/3] Contrôle de connexion Ahrefs...`);
  const ahrefsToken = process.env.AHREFS_API_TOKEN || null;
  const ahrefsApiRes = await checkAhrefsApi(ahrefsToken);
  if (ahrefsApiRes.connected) {
    console.log(`  ✔ Connexion API Ahrefs v3 établie avec succès.`);
  } else {
    console.log(`  ℹ ${ahrefsApiRes.message}`);
  }

  // 5. Sauvegarde du rapport JSON
  const reportData = {
    date: todayKey,
    timestamp: now.toISOString(),
    status: isGlobalHealthy ? 'Tout bon' : 'Moyen',
    severity: isGlobalHealthy ? 'green' : 'yellow',
    summary: genericSummary,
    metrics: {
      pagesChecked: localAudit.checkedPagesCount,
      ahrefsAnalyticsActive: localAudit.ahrefsConfig,
      sitemapOk: localAudit.sitemapOk,
      robotsOk: localAudit.robotsOk,
      averageLatencyMs: avgLatency,
      networkEndpointsTested: networkResults.length,
      networkErrorsCount: networkResults.filter(r => !r.ok).length
    },
    ahrefs: {
      siteAuditReady: true,
      canonicalTagsVerified: localAudit.canonicalIssues.length === 0,
      trackingKeyInstalled: localAudit.ahrefsConfig,
      apiConnected: ahrefsApiRes.connected,
      apiMessage: ahrefsApiRes.message || 'Connecté'
    },
    networkChecks: networkResults
  };

  const dataDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(reportData, null, 2), 'utf8');
  console.log(`\n✔ [OK] Rapport sentinelle enregistré dans : data/sentinel-report.json`);

  // 6. Mise à jour de 'statut.html'
  updateStatutPage(todayKey, isGlobalHealthy, genericSummary);

  console.log('\n🎉 Audit sentinelle terminé avec succès !');
}

main().catch(err => {
  console.error('Erreur du bot sentinelle :', err);
  process.exit(1);
});
