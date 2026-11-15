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
    'Jours de procédure écoulés': (m) => {
      const v = lookup.get('Jours de procédure écoulés au bilan');
      if (v) m.value = `${v} j`;
    },
    'Avancement CCE': (m) => {
      const steps = lookup.get('Étapes terminées');
      const pct = lookup.get('Avancement du processus');
      if (steps && pct) m.value = `${steps} (${pct})`;
    },
    'Jours restants avant décision 24.28': (m) => {
      const v = lookup.get('Jours restants avant la détermination 24.28');
      if (v) m.value = `${v} j`;
    },
    'Milieux humides visés': (m) => {
      const v = lookup.get('Milieux humides visés (m²)');
      const ha = lookup.get('Milieux humides (hectares)');
      if (v) m.value = `${v} m²`;
      if (ha) {
        m.note_fr = `${ha} hectares`;
        m.note_en = `${ha.replace(',', '.')} hectares`;
      }
    },
    'Part de tourbières': (m) => {
      const v = lookup.get('Part de tourbières');
      if (v) m.value = v;
    },
    'Ratio maximal relevé': (m) => {
      const v = lookup.get('Ratio maximal relevé (× le seuil)');
      if (v) m.value = `${v}×`;
    },
    'Publications 2026': (m) => {
      const v = lookup.get("Publications au fil d'actualités (2026)");
      if (v) m.value = v;
    },
    'Mots publiés en accès libre': (m) => {
      const v = lookup.get('Mots publiés (dernier relevé)');
      if (v) m.value = v;
    },
    'Retombées médias': (m) => {
      const v = lookup.get('Retombées médias en 2026');
      if (v) m.value = v;
    },
    'Vues Zenodo (science ouverte)': (m) => {
      const v = lookup.get('Vues Zenodo — cumul (dernier relevé)');
      const dl = lookup.get('Téléchargements Zenodo — cumul');
      if (v) m.value = v;
      if (dl) {
        m.note_fr = `${dl} téléchargements`;
        m.note_en = `${dl} downloads`;
      }
    }
  };

  for (const sec of current.sections) {
    for (const metric of sec.metrics) {
      const updater = labelMap[metric.label_fr];
      if (updater) updater(metric);
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
