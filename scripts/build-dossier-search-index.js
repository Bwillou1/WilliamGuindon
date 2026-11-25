#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DOSSIER_HTML = path.join(ROOT, 'dossier-journalistes.html');
const OUT_FILE = path.join(ROOT, 'data', 'dossier-search-index.json');
const MAX_CHARS_PER_DOC = 45000;

function extractTreeItems(html) {
  const items = new Map();
  const re = /<div class="drive-item[^"]*"\s+data-fullpath="([^"]+)"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*class="drive-item-name"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const fullPath = m[1].trim();
    const href = m[2].trim();
    let rawTitle = m[3] || '';
    let sanitizedTitle = '';
    while (rawTitle !== sanitizedTitle) {
      sanitizedTitle = rawTitle;
      rawTitle = rawTitle.replace(/<[^>]*>/g, '');
    }
    const title = sanitizedTitle.replace(/\s+/g, ' ').trim();
    if (!items.has(fullPath)) {
      items.set(fullPath, { title, href });
    }
  }
  return items;
}

function extractTextFromFile(absPath) {
  const lower = absPath.toLowerCase();
  try {
    if (lower.endsWith('.pdf')) {
      return execFileSync('pdftotext', ['-enc', 'UTF-8', '-q', absPath, '-'], {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024
      });
    }
    if (lower.endsWith('.kml')) {
      const xml = fs.readFileSync(absPath, 'utf8');
      return xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ');
    }
    if (
      lower.endsWith('.txt') ||
      lower.endsWith('.md') ||
      lower.endsWith('.csv') ||
      lower.endsWith('.json') ||
      lower.endsWith('.geojson')
    ) {
      return fs.readFileSync(absPath, 'utf8');
    }
  } catch (err) {
    console.warn(`[WARN] Extraction échouée pour ${absPath}: ${err.message}`);
  }
  return '';
}

function main() {
  const html = fs.readFileSync(DOSSIER_HTML, 'utf8');
  const items = extractTreeItems(html);
  const docs = [];

  for (const [fullPath, info] of items.entries()) {
    let absPath = path.join(ROOT, 'assets', 'docs', fullPath);
    if (!fs.existsSync(absPath) && info.href && info.href.startsWith('/assets/docs/')) {
      try {
        const rel = decodeURIComponent(info.href.replace(/^\/+/, ''));
        absPath = path.join(ROOT, rel);
      } catch (_) {}
    }
    if (!fs.existsSync(absPath)) continue;
    const raw = extractTextFromFile(absPath);
    const clean = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    docs.push({
      p: fullPath,
      t: info.title,
      c: clean.slice(0, MAX_CHARS_PER_DOC)
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    count: docs.length,
    docs
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload), 'utf8');
  const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`Index plein texte généré : ${docs.length} documents (${sizeKb} Ko) -> ${OUT_FILE}`);
}

main();
