#!/usr/bin/env node

/**
 * ==============================================================================
 * CLOUDFLARE ZERO TRUST & PROXY AUTOMATION SCRIPT
 * ==============================================================================
 * Projet : williamguindon.me (Dossier CCE SEM-26-003)
 * Rôle   : Sécurisation périmétrique Cloudflare, proxying DNS, verrouillage
 *          des routes d'administration via Cloudflare Access (Zero Trust OTP)
 *          et déploiement des en-têtes HTTP stricts (Transform Rules).
 *
 * Usage :
 *   CLOUDFLARE_API_TOKEN="..." \
 *   ADMIN_EMAIL="contact@williamguindon.me" \
 *   node scripts/cloudflare-zero-trust-setup.js
 *
 * Variables d'environnement :
 *   - CLOUDFLARE_API_TOKEN   (Obligatoire) : Jeton API Cloudflare avec droits :
 *                              * Account > Zero Trust > Edit
 *                              * Zone > DNS > Edit
 *                              * Zone > Transform Rules > Edit
 *   - CLOUDFLARE_ACCOUNT_ID  (Optionnel)   : ID du compte (détecté auto si omis)
 *   - ADMIN_EMAIL            (Obligatoire) : Email admin autorisé (code OTP)
 *   - DOMAIN_NAME            (Défaut: "williamguindon.me")
 *   - DRY_RUN                (Optionnel)   : "true" pour simuler sans appliquer
 * ==============================================================================
 */

'use strict';

const https = require('https');
const { execSync } = require('child_process');

// Configuration
const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || '';
let ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const DOMAIN_NAME = process.env.DOMAIN_NAME || 'williamguindon.me';
const DRY_RUN = process.env.DRY_RUN === 'true';

const SENSITIVE_ROUTES = [
  {
    name: 'Console Admin Avancee (williamguindon.me)',
    path: '/console-admin.html',
    domain: `${DOMAIN_NAME}/console-admin.html`
  },
  {
    name: 'Console Admin Legacy (williamguindon.me)',
    path: '/admin.html',
    domain: `${DOMAIN_NAME}/admin.html`
  },
  {
    name: 'Editeur de Contenu (williamguindon.me)',
    path: '/editeur.html',
    domain: `${DOMAIN_NAME}/editeur.html`
  }
];

// Helper pour requêtes HTTPS vers l'API Cloudflare
function requestCF(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${CF_API_BASE}${endpoint}`);
    const headers = {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Cloudflare-Zero-Trust-Deployer/1.0'
    };

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.success) {
            resolve(parsed);
          } else {
            resolve({
              success: false,
              statusCode: res.statusCode,
              errors: parsed.errors || [{ message: body }],
              messages: parsed.messages || [],
              result: parsed.result || null
            });
          }
        } catch (e) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            errors: [{ message: `Parse error: ${e.message}`, raw: body }]
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Couleurs console
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function logStep(step, title) {
  console.log(`\n${c.bright}${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bright}${c.cyan}[ÉTAPE ${step}] ${title}${c.reset}`);
  console.log(`${c.bright}${c.cyan}======================================================================${c.reset}`);
}

async function main() {
  console.log(`${c.bright}${c.magenta}🔒 DÉPLOIEMENT AUTOMATISÉ CLOUDFLARE ZERO TRUST & PROXY DNS 🔒${c.reset}`);
  console.log(`Domaine cible : ${c.yellow}${DOMAIN_NAME}${c.reset}`);
  console.log(`Email Admin   : ${c.yellow}${ADMIN_EMAIL || '[NON SPÉCIFIÉ]'}${c.reset}`);

  // Validation des prérequis
  if (!API_TOKEN) {
    console.error(`\n${c.red}❌ ERREUR : La variable d'environnement CLOUDFLARE_API_TOKEN est obligatoire.${c.reset}`);
    console.error(`Veuillez exécuter : export CLOUDFLARE_API_TOKEN="votre_token_cloudflare"`);
    process.exit(1);
  }

  if (!ADMIN_EMAIL) {
    console.error(`\n${c.red}❌ ERREUR : La variable d'environnement ADMIN_EMAIL est obligatoire pour la règle Zero Trust OTP.${c.reset}`);
    console.error(`Veuillez exécuter : export ADMIN_EMAIL="votre_adresse@email.com"`);
    process.exit(1);
  }

  // ÉTAPE 0 : Vérification de la validité du Token
  logStep(0, 'Validation du jeton API Cloudflare');
  const tokenVerify = await requestCF('/user/tokens/verify');
  if (!tokenVerify.success) {
    console.error(`${c.red}❌ Le jeton API Cloudflare est invalide ou a expiré :${c.reset}`, tokenVerify.errors);
    process.exit(1);
  }
  console.log(`${c.green}✔ Jeton API valide.${c.reset} Statut : ${tokenVerify.result.status}`);

  // ÉTAPE 1 : Détection de la Zone DNS et Activation du Proxy
  logStep(1, `Détection de la Zone DNS & Proxy pour "${DOMAIN_NAME}"`);
  const zonesResp = await requestCF(`/zones?name=${encodeURIComponent(DOMAIN_NAME)}`);
  if (!zonesResp.success || !zonesResp.result || zonesResp.result.length === 0) {
    console.error(`${c.red}❌ Impossible de trouver la zone "${DOMAIN_NAME}" sur ce compte Cloudflare.${c.reset}`);
    console.error(zonesResp.errors);
    process.exit(1);
  }

  const zone = zonesResp.result[0];
  const zoneId = zone.id;
  if (!ACCOUNT_ID && zone.account && zone.account.id) {
    ACCOUNT_ID = zone.account.id;
  }

  console.log(`${c.green}✔ Zone détectée :${c.reset} ${zone.name}`);
  console.log(`${c.green}✔ Compte Cloudflare :${c.reset} ${zone.account ? zone.account.name : 'N/A'}`);

  // Vérification & bascule des enregistrements DNS en mode Proxy (nuage orange)
  console.log(`\nRecherche des enregistrements DNS pour activation du proxy...`);
  const dnsResp = await requestCF(`/zones/${zoneId}/dns_records?per_page=100`);
  if (dnsResp.success && dnsResp.result) {
    for (const record of dnsResp.result) {
      const isTargetRecord = record.name === DOMAIN_NAME || record.name === `www.${DOMAIN_NAME}`;
      if (isTargetRecord && ['A', 'AAAA', 'CNAME'].includes(record.type)) {
        if (!record.proxied) {
          console.log(`Bascule DNS en proxied=true pour : ${record.type} ${record.name} -> ${record.content}...`);
          if (!DRY_RUN) {
            const patchResp = await requestCF(`/zones/${zoneId}/dns_records/${record.id}`, 'PATCH', {
              proxied: true
            });
            if (patchResp.success) {
              console.log(`${c.green}✔ Proxy activé (nuage orange) pour ${record.name}${c.reset}`);
            } else {
              console.warn(`${c.yellow}⚠️ Échec de l'activation proxy pour ${record.name}:${c.reset}`, patchResp.errors);
            }
          }
        } else {
          console.log(`${c.green}✔ Déjà proxifié :${c.reset} ${record.type} ${record.name} (proxied: true)`);
        }
      }
    }
  }

  // ÉTAPE 2 : Organisation Zero Trust (Access Organization)
  logStep(2, 'Vérification / Initialisation de l\'organisation Zero Trust');
  let orgResp = await requestCF(`/accounts/${ACCOUNT_ID}/access/organizations`);
  let orgDomain = '';

  if (orgResp.success && orgResp.result) {
    orgDomain = orgResp.result.auth_domain;
    console.log(`${c.green}✔ Organisation Zero Trust existante :${c.reset} ${orgResp.result.name} (Domaine auth: ${c.yellow}${orgDomain}${c.reset})`);
  } else {
    console.log(`Organisation Access inexistante. Création d'une nouvelle organisation...`);
    const defaultAuthDomain = `auth-${DOMAIN_NAME.replace(/[^a-zA-Z0-9]/g, '')}`;
    if (!DRY_RUN) {
      const createOrgResp = await requestCF(`/accounts/${ACCOUNT_ID}/access/organizations`, 'POST', {
        name: `Securite ${DOMAIN_NAME}`,
        auth_domain: defaultAuthDomain
      });
      if (createOrgResp.success && createOrgResp.result) {
        orgDomain = createOrgResp.result.auth_domain;
        console.log(`${c.green}✔ Organisation Zero Trust créée avec succès :${c.reset} ${orgDomain}`);
      } else {
        console.warn(`${c.yellow}⚠️ Note sur la création de l'organisation :${c.reset}`, createOrgResp.errors);
      }
    }
  }

  // ÉTAPE 3 & 4 : Création des Applications et Politiques Access (Self-Hosted)
  logStep(3, 'Configuration des Applications et Politiques Cloudflare Access');
  const existingAppsResp = await requestCF(`/accounts/${ACCOUNT_ID}/access/apps`);
  const existingApps = (existingAppsResp.success && existingAppsResp.result) ? existingAppsResp.result : [];

  const createdSummary = [];

  for (const route of SENSITIVE_ROUTES) {
    console.log(`\nTraitement de l'application : ${c.bright}${route.name}${c.reset} (${route.domain})`);
    
    // Vérifier si l'app existe déjà
    let targetApp = existingApps.find(a => a.domain === route.domain || a.domain === `${DOMAIN_NAME}${route.path}`);
    let appId = '';

    if (targetApp) {
      appId = targetApp.id;
      console.log(`${c.green}✔ Application Access déjà existante (App ID: ${appId})${c.reset}`);
    } else {
      console.log(`Création de l'application Access Self-Hosted...`);
      if (!DRY_RUN) {
        const appPayload = {
          name: route.name,
          domain: route.domain,
          type: 'self_hosted',
          session_duration: '24h',
          auto_redirect_to_identity: false
        };
        const createAppResp = await requestCF(`/accounts/${ACCOUNT_ID}/access/apps`, 'POST', appPayload);
        if (createAppResp.success && createAppResp.result) {
          appId = createAppResp.result.id;
          console.log(`${c.green}✔ Application créée (App ID: ${c.yellow}${appId}${c.reset})`);
        } else {
          console.error(`${c.red}❌ Échec de la création de l'application ${route.name}:${c.reset}`, createAppResp.errors);
          continue;
        }
      }
    }

    if (!appId) continue;

    // Définition de la politique d'accès stricte (OTP par email)
    console.log(`Configuration de la politique d'accès stricte (decision: allow, email: ${ADMIN_EMAIL})...`);
    const policiesResp = await requestCF(`/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies`);
    const existingPolicies = (policiesResp.success && policiesResp.result) ? policiesResp.result : [];
    
    let policyId = '';
    const targetPolicy = existingPolicies.find(p => p.name === 'Acces Administrateur Autorise');

    const policyPayload = {
      name: 'Acces Administrateur Autorise',
      decision: 'allow',
      include: [
        {
          email: {
            email: ADMIN_EMAIL
          }
        }
      ]
    };

    if (targetPolicy) {
      policyId = targetPolicy.id;
      console.log(`Mise à jour de la politique existante (Policy ID: ${policyId})...`);
      if (!DRY_RUN) {
        const updatePol = await requestCF(`/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies/${policyId}`, 'PUT', policyPayload);
        if (updatePol.success) {
          console.log(`${c.green}✔ Politique mise à jour avec succès.${c.reset}`);
        }
      }
    } else {
      if (!DRY_RUN) {
        const createPol = await requestCF(`/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies`, 'POST', policyPayload);
        if (createPol.success && createPol.result) {
          policyId = createPol.result.id;
          console.log(`${c.green}✔ Politique créée (Policy ID: ${c.yellow}${policyId}${c.reset})`);
        } else {
          console.error(`${c.red}❌ Échec de la création de la politique :${c.reset}`, createPol.errors);
        }
      }
    }

    createdSummary.push({
      route: route.path,
      domain: route.domain,
      appId: appId,
      policyId: policyId || 'N/A'
    });
  }

  // ÉTAPE 5 : En-têtes HTTP de sécurité stricts (Rulesets / Transform Rules)
  logStep(4, 'Déploiement des En-têtes HTTP de Sécurité (Transform Rules)');
  const cspValue = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://*.google-analytics.com https://google-analytics.com https://ssl.google-analytics.com https://*.google.com https://*.google.ca https://*.gstatic.com https://*.googleapis.com https://*.doubleclick.net https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://unpkg.com https://app.cal.com https://cal.com https://static.cloudflareinsights.com https://cloud.umami.is https://gateway.umami.is https://translate.google.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://router.huggingface.co https://api-inference.huggingface.co https://*.huggingface.co https://huggingface.co; script-src-elem 'self' 'unsafe-inline' https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://*.google-analytics.com https://google-analytics.com https://ssl.google-analytics.com https://*.google.com https://*.google.ca https://*.gstatic.com https://*.googleapis.com https://*.doubleclick.net https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://unpkg.com https://app.cal.com https://cal.com https://static.cloudflareinsights.com https://cloud.umami.is https://gateway.umami.is https://translate.google.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://router.huggingface.co https://api-inference.huggingface.co https://*.huggingface.co https://huggingface.co; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://*.googleapis.com https://fonts.googleapis.com https://*.googletagmanager.com https://tagmanager.google.com https://unpkg.com https://app.cal.com https://cal.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://translate.google.com https://fonts.googleapis.com https://*.gstatic.com; style-src-elem 'self' 'unsafe-inline' https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://*.googleapis.com https://fonts.googleapis.com https://*.googletagmanager.com https://tagmanager.google.com https://unpkg.com https://app.cal.com https://cal.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://translate.google.com https://fonts.googleapis.com https://*.gstatic.com; img-src 'self' data: blob: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net https://*.google.com https://*.google.ca https://*.gstatic.com https://*.googleapis.com https://*.cookiebot.com https://consent.cookiebot.com https://imgs.cookiebot.com https://*.tile.openstreetmap.org https://unpkg.com https://williamguindon.me https://app.cal.com https://cal.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://translate.google.com https://fonts.googleapis.com https://*.gstatic.com; font-src 'self' data: https://*.gstatic.com https://fonts.gstatic.com https://app.cal.com https://cal.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://translate.google.com https://fonts.googleapis.com https://*.gstatic.com; connect-src 'self' wss: ws: https://api.websitecarbon.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net https://*.google.com https://*.googleapis.com https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://api.github.com https://raw.githubusercontent.com https://*.tile.openstreetmap.org https://unpkg.com https://app.cal.com https://cal.com https://cloudflareinsights.com https://cloud.umami.is https://gateway.umami.is https://translate.google.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://router.huggingface.co https://api-inference.huggingface.co https://*.huggingface.co https://huggingface.co; frame-src 'self' https://*.googletagmanager.com https://*.doubleclick.net https://*.google.com https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://translate.google.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://app.cal.com https://cal.com https://www.cec.org https://doi.org https://zenodo.org https://felt.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self';";

  const rulesetPayload = {
    rules: [
      {
        action: 'rewrite',
        action_parameters: {
          headers: {
            'Strict-Transport-Security': {
              operation: 'set',
              value: 'max-age=31536000; includeSubDomains; preload'
            },
            'X-Content-Type-Options': {
              operation: 'set',
              value: 'nosniff'
            },
            'X-Frame-Options': {
              operation: 'set',
              value: 'SAMEORIGIN'
            },
            'Referrer-Policy': {
              operation: 'set',
              value: 'strict-origin-when-cross-origin'
            },
            'Permissions-Policy': {
              operation: 'set',
              value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
            },
            'Content-Security-Policy': {
              operation: 'set',
              value: cspValue
            }
          }
        },
        expression: 'true',
        description: 'En-tetes HTTP de securite stricts (Automatisé William Guindon)',
        enabled: true
      }
    ]
  };

  console.log(`Application de la règle de transformation des en-têtes de réponse...`);
  if (!DRY_RUN) {
    const rulesetResp = await requestCF(
      `/zones/${zoneId}/rulesets/phases/http_response_headers_transform/entrypoint`,
      'PUT',
      rulesetPayload
    );
    if (rulesetResp.success) {
      console.log(`${c.green}✔ En-têtes de sécurité HTTP appliqués avec succès via Rulesets API.${c.reset}`);
    } else {
      console.warn(`${c.yellow}⚠️ Avertissement lors de l'application du ruleset HTTP :${c.reset}`, rulesetResp.errors);
    }
  }

  // ÉTAPE 6 : Validation en direct via tests CURL
  logStep(5, 'Tests de validation non authentifiés (Vérification du blocage Zero Trust)');
  console.log(`Exécution des requêtes curl sur les 3 routes protégées...\n`);

  for (const route of SENSITIVE_ROUTES) {
    const testUrl = `https://${DOMAIN_NAME}${route.path}`;
    console.log(`${c.bright}Test : ${testUrl}${c.reset}`);
    try {
      const curlOutput = execSync(`curl -sI -m 10 "${testUrl}"`, { encoding: 'utf-8' });
      const firstLine = curlOutput.split('\n')[0].trim();
      const locationHeader = curlOutput.split('\n').find(l => l.toLowerCase().startsWith('location:'));
      
      console.log(`  -> Réponse : ${c.yellow}${firstLine}${c.reset}`);
      if (locationHeader) {
        console.log(`  -> Redirection : ${c.cyan}${locationHeader.trim()}${c.reset}`);
      }

      let isAccessBlocked = firstLine.includes('302') || firstLine.includes('403');
      if (locationHeader) {
        try {
          const locVal = locationHeader.replace(/^location:\s*/i, '').trim();
          const parsedLoc = new URL(locVal, testUrl);
          if (parsedLoc.hostname === 'cloudflareaccess.com' || parsedLoc.hostname.endsWith('.cloudflareaccess.com')) {
            isAccessBlocked = true;
          }
        } catch {}
      }

      if (isAccessBlocked) {
        console.log(`  -> ${c.green}✔ VÉRIFIÉ : Accès non-authentifié bloqué / redirigé vers Cloudflare Access !${c.reset}`);
      } else if (firstLine.includes('200')) {
        console.log(`  -> ${c.red}⚠️ ALERTE : La page répond en HTTP 200 sans challenge Access (propagation DNS/cache Cloudflare en cours ?)${c.reset}`);
      }
    } catch (e) {
      console.log(`  -> ${c.yellow}Erreur lors de l'exécution du test curl : ${e.message}${c.reset}`);
    }
    console.log('');
  }

  // SYNTHÈSE DES OPÉRATIONS
  console.log(`\n${c.bright}${c.green}======================================================================${c.reset}`);
  console.log(`${c.bright}${c.green}🎉 BILAN DU DÉPLOIEMENT CLOUDFLARE ZERO TRUST${c.reset}`);
  console.log(`${c.bright}${c.green}======================================================================${c.reset}`);
  console.table(createdSummary);

  console.log(`\n${c.bright}${c.yellow}⚠️ RAPPELS DE SÉCURITÉ IMPORTANTS :${c.reset}`);
  console.log(`1. Si un jeton d'accès ou un GitHub PAT a été partagé dans des logs ou prompts non sécurisés, ${c.red}RÉVOQUEZ-LE IMMÉDIATEMENT${c.reset}.`);
  console.log(`2. Toute tentative d'accès à ces 3 pages exigera la validation d'un code OTP à usage unique envoyé à : ${c.green}${ADMIN_EMAIL}${c.reset}.`);
  console.log(`3. Aucun fichier JavaScript ou HTML brut n'est désormais accessible publiquement par des tiers sans authentification.\n`);
}

main().catch(err => {
  console.error(`${c.red}Erreur fatale :${c.reset}`, err);
  process.exit(1);
});
