#!/usr/bin/env node
/**
 * Synchronisation sécurisée du classeur Google Sheets (Bilan 2026) vers data/bilan-2026.json.
 * Aucun secret n'est stocké dans le dépôt : GOOGLE_SERVICE_ACCOUNT_JSON est lu depuis l'environnement.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SPREADSHEET_ID = '1Lok1v0U-sPYY0E6ZAG3n31dER9L_jj3hS7SNcdjTnZ8';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'bilan-2026.json');

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${claim}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = b64url(sign.sign(sa.private_key));
  const assertion = `${unsigned}.${signature}`;

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  if (!res.ok) {
    throw new Error(`OAuth token error: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function fetchRange(token, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Sheets API error (${range}): HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.values || [];
}

function buildLookup(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = (row[0] || '').trim();
    const val = (row[1] || '').trim();
    if (key && val !== undefined) {
      map.set(key, val);
    }
  }
  return map;
}

async function main() {
  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawCreds) {
    console.log('GOOGLE_SERVICE_ACCOUNT_JSON absent : synchronisation ignorée.');
    process.exit(0);
  }

  const sa = JSON.parse(rawCreds);
  const token = await getAccessToken(sa);
  const [dashboardRows, finalRows] = await Promise.all([
    fetchRange(token, 'TABLEAU_DE_BORD!A1:D45'),
    fetchRange(token, 'BILAN_FINAL!A1:D30')
  ]);

  const current = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
  const prevComparable = JSON.stringify({
    synthesis_fr: current.synthesis_fr,
    verdict_fr: current.verdict_fr,
    sections: current.sections
  });

  const lookup = buildLookup(dashboardRows);

  const labelMap = {
    'Jours de procédure écoulés au bilan': 'Jours de procédure écoulés au bilan',
    'Étapes terminées': 'Étapes terminées',
    'Avancement du processus': 'Avancement du processus',
    'Dépôt → détermination positive': 'Dépôt → détermination positive',
    'Temps de réponse du Canada': 'Temps de réponse du Canada (délai)',
    'Temps de la réplique citoyenne': 'Temps de la réplique citoyenne',
    'Jours restants avant détermination 24.28': 'Jours restants avant la détermination 24.28',
    'Milieux humides visés (m²)': 'Milieux humides visés (m²)',
    'Milieux humides (hectares)': 'Milieux humides (hectares)',
    'Équivalent terrains de soccer FIFA': 'Équivalent terrains de soccer FIFA',
    'Part de tourbières': 'Part de tourbières',
    'Mesures compilées': 'Mesures compilées',
    'Dépassements de seuils': 'Dépassements de seuils',
    'Ratio maximal relevé (× le seuil)': 'Ratio maximal relevé (× le seuil)',
    "Publications au fil d'actualités (2026)": "Publications au fil d'actualités (2026)",
    'Pages du corpus (dernier relevé)': 'Pages du corpus (dernier relevé)',
    'Mots publiés (dernier relevé)': 'Mots publiés (dernier relevé)',
    'Documents indexés (dernier relevé)': 'Documents indexés (dernier relevé)',
    'Retombées médias en 2026': 'Retombées médias en 2026',
    'Événements « Fait » en 2026': 'Événements « Fait » en 2026',
    'Documents au registre': 'Documents au registre',
    'Heures consacrées (journal)': 'Heures consacrées (journal)',
    'Vues Zenodo (cumul)': 'Vues Zenodo — cumul (dernier relevé)',
    'Téléchargements Zenodo (cumul)': 'Téléchargements Zenodo — cumul',
    'Étoiles GitHub (total dépôts)': 'Étoiles GitHub (total des dépôts saisis)',
    'Fourches GitHub (total)': 'Fourches GitHub (total)'
  };

  for (const sec of current.sections) {
    for (const metric of sec.metrics) {
      const sheetKey = labelMap[metric.label_fr];
      if (sheetKey && lookup.has(sheetKey)) {
        const nextVal = lookup.get(sheetKey);
        if (nextVal) metric.value = nextVal;
      }
    }
  }

  for (let i = 0; i < finalRows.length; i++) {
    const cell = (finalRows[i][0] || '').trim();
    if (cell.startsWith('En 2026, le dossier CCE SEM-26-003')) {
      current.synthesis_fr = cell;
    }
    if (cell.startsWith('★ VERDICT') && finalRows[i + 1] && finalRows[i + 1][0]) {
      current.verdict_fr = finalRows[i + 1][0].trim();
    }
  }

  const nextComparable = JSON.stringify({
    synthesis_fr: current.synthesis_fr,
    verdict_fr: current.verdict_fr,
    sections: current.sections
  });

  if (prevComparable === nextComparable) {
    console.log('Aucune modification détectée dans Google Sheets.');
    return;
  }

  current.updated_at = new Date().toISOString();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(current, null, 2) + '\n', 'utf8');
  console.log('data/bilan-2026.json mis à jour avec succès.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
