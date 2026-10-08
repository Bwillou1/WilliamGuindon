#!/usr/bin/env node
/**
 * scripts/sync-navbar.js
 * 
 * Synchronise automatiquement le fragment navbar.html sur l'ensemble des pages HTML
 * du site officiel de William Guindon (williamguindon.me).
 * 
 * Avantages :
 * 1. Source de vérité UNIQUE : modifiez uniquement navbar.html.
 * 2. Performance et SEO maximales : HTML pré-rendu statique sans FOUC (zéro flash).
 * 3. Indépendance JavaScript : les bots IA lisent le balisage complet sans exécuter de JS.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const NAVBAR_FILE = path.join(ROOT_DIR, 'navbar.html');

if (!fs.existsSync(NAVBAR_FILE)) {
  console.error('❌ Erreur : navbar.html introuvable à la racine.');
  process.exit(1);
}

const navbarContent = fs.readFileSync(NAVBAR_FILE, 'utf8').trim();

// Liste des fichiers à ignorer
const IGNORED_FILES = new Set([
  'navbar.html',
  'google57da095d83ebd58e.html',
  '404.html'
]);

const htmlFiles = fs.readdirSync(ROOT_DIR).filter(file => {
  return file.endsWith('.html') && !IGNORED_FILES.has(file);
});

let updatedCount = 0;
let skippedCount = 0;

// Regex pour cibler le bloc <header class="site"...>...</header>
const headerRegex = /<header\s+class=["'][^"']*site[^"']*["'][\s\S]*?<\/header>/i;

htmlFiles.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');

  if (!headerRegex.test(content)) {
    skippedCount++;
    return;
  }

  // Remplacement du header
  const newContent = content.replace(headerRegex, navbarContent);

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    updatedCount++;
    console.log(`✔ Synchronisé : ${file}`);
  } else {
    skippedCount++;
  }
});

console.log(`\n🎉 Synchronisation de la barre de navigation terminée :`);
console.log(`   - ${updatedCount} fichier(s) mis à jour avec le contenu de navbar.html`);
console.log(`   - ${skippedCount} fichier(s) déjà à jour ou sans header.`);
