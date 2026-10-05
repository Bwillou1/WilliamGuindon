#!/usr/bin/env node
/**
 * scripts/update-dynamic-dates.js — William Guindon (williamguindon.me)
 * 
 * Automatisation calendaire :
 * 1. Le 3 août : recalcul de l'âge de William Guindon (né le 3 août 2011).
 * 2. À Noël (25 décembre) : passage au millésime suivant des accords de la CCE
 *    (1994 -> 32 ans en 2026, 33 ans dès Noël 2026, 34 ans dès Noël 2027...)
 *    et des années d'exploitation de Stablex (1983).
 *
 * Utilisation :
 *   node scripts/update-dynamic-dates.js
 *   node scripts/update-dynamic-dates.js --date 2026-12-25 --dry-run
 *   node scripts/update-dynamic-dates.js --date 2027-08-03
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

// Date de naissance officielle de William Guindon
const BIRTH_YEAR = 2011;
const BIRTH_MONTH = 7; // 0-indexé : 7 = août
const BIRTH_DAY = 3;   // 3 août

// Accord CCE / ANACDE (1994) et Stablex (1983)
const CCE_START_YEAR = 1994;
const STABLEX_START_YEAR = 1983;

function parseArgs() {
  const args = process.argv.slice(2);
  let targetDate = new Date();
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      targetDate = new Date(args[i + 1] + 'T12:00:00Z');
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { targetDate, dryRun };
}

function calculateDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = jan, 7 = août, 11 = déc
  const day = date.getDate();

  // 1. Âge actuel de William Guindon
  let age = year - BIRTH_YEAR;
  if (month < BIRTH_MONTH || (month === BIRTH_MONTH && day < BIRTH_DAY)) {
    age--;
  }

  // 2. Années CCE (depuis 1994) avec bascule à Noël (25 décembre)
  const isChristmasOrLater = (month === 11 && day >= 25);
  let cceRefYear = year;
  if (isChristmasOrLater) {
    cceRefYear += 1;
  }
  const cceYears = cceRefYear - CCE_START_YEAR;
  const stablexYears = cceRefYear - STABLEX_START_YEAR;

  return {
    referenceDate: date.toISOString().split('T')[0],
    age,
    cceYears,
    stablexYears,
    isMinor: age < 18,
    isChristmasOrLater
  };
}

function getFilesToScan() {
  const extensions = ['.html', '.json', '.xml', '.txt', '.md'];
  const excludeDirs = ['node_modules', '.git', 'assets/vendor', 'assets/docs', 'cosmic-space-background'];
  const scannedFiles = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(REPO_ROOT, fullPath);

      if (excludeDirs.some(ex => relPath === ex || relPath.startsWith(ex + path.sep))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          scannedFiles.push(fullPath);
        }
      }
    }
  }

  walk(REPO_ROOT);
  return scannedFiles;
}

function updateFileContent(content, metrics) {
  let updated = content;
  let changesCount = 0;

  const { age, cceYears, isMinor } = metrics;

  // 1. Âge de William : remplacement ciblé des occurrences actuelles (15..25 ans)
  // Règle d'or : préserver formellement les faits historiques (ex. "à 14 ans de la communication", "décision positive à 15 ans", "né le 3 août 2011")
  const agePatterns = [
    {
      regex: /(William Guindon \()(?:1[5-9]|2\d) ans(\))/g,
      replace: `$1${age} ans$2`
    },
    {
      regex: /(aujourd'hui âgé de )(?:1[5-9]|2\d) ans/gi,
      replace: `$1${age} ans`
    },
    {
      regex: /(personne mineure de )(?:1[5-9]|2\d) ans/gi,
      replace: isMinor ? `$1${age} ans` : `personne majeure de ${age} ans`
    },
    {
      regex: /(sollicitant William Guindon \()(?:1[5-9]|2\d) ans(\))/gi,
      replace: `$1${age} ans$2`
    },
    {
      regex: /(militant écologiste québécois \()(?:1[5-9]|2\d) ans(\))/gi,
      replace: `$1${age} ans$2`
    },
    {
      regex: /(Statut légal de citoyen mineur \()(?:1[5-9]|2\d) ans(\))/gi,
      replace: isMinor ? `$1${age} ans$2` : `Statut légal de citoyen majeur (${age} ans)`
    }
  ];

  for (const p of agePatterns) {
    const next = updated.replace(p.regex, (match, ...args) => {
      changesCount++;
      return match.replace(p.regex, p.replace);
    });
    updated = next;
  }

  // 2. Années CCE (depuis 1994) : bascule à Noël (32..45 ans)
  const ccePatterns = [
    {
      regex: /\ben (?:3[2-9]|[4-5]\d) ans d'(histoire|existence)\b/gi,
      replace: `en ${cceYears} ans d'$1`
    },
    {
      regex: /\bpremier mineur en (?:3[2-9]|[4-5]\d) ans\b/gi,
      replace: `premier mineur en ${cceYears} ans`
    },
    {
      regex: /\btout premier mineur en (?:3[2-9]|[4-5]\d) ans\b/gi,
      replace: `tout premier mineur en ${cceYears} ans`
    }
  ];

  for (const p of ccePatterns) {
    const next = updated.replace(p.regex, (match, p1) => {
      changesCount++;
      return p.replace.includes('$1') ? p.replace.replace('$1', p1) : p.replace;
    });
    updated = next;
  }

  return { updated, changesCount };
}

function run() {
  const { targetDate, dryRun } = parseArgs();
  const metrics = calculateDates(targetDate);

  console.log("=== Mise à jour automatique des dates dynamiques (William Guindon) ===");
  console.log(`📅 Date de référence : ${metrics.referenceDate}`);
  console.log(`🎂 Âge calculé (né le 3 août 2011) : ${metrics.age} ans (${metrics.isMinor ? 'Mineur' : 'Majeur'})`);
  console.log(`📜 Années CCE (depuis 1994, bascule à Noël) : ${metrics.cceYears} ans`);
  console.log(`🏭 Années Stablex (depuis 1983) : ${metrics.stablexYears} ans`);
  if (dryRun) {
    console.log("🔍 MODE SIMULATION (dry-run) : aucun fichier ne sera modifié sur disque.\n");
  }

  const files = getFilesToScan();
  let totalFilesModified = 0;
  let totalModifications = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const { updated, changesCount } = updateFileContent(content, metrics);

    if (changesCount > 0 && updated !== content) {
      totalFilesModified++;
      totalModifications += changesCount;
      const relPath = path.relative(REPO_ROOT, filePath);
      console.log(`  ✔ [${dryRun ? 'SIMULATION' : 'MODIFIÉ'}] ${relPath} (${changesCount} remplacement(s))`);

      if (!dryRun) {
        fs.writeFileSync(filePath, updated, 'utf8');
      }
    }
  }

  console.log("\n=== Résumé de l'opération ===");
  if (totalFilesModified === 0) {
    console.log("✔ Tous les fichiers sont déjà parfaitement à jour pour cette date.");
  } else {
    console.log(`✔ ${totalFilesModified} fichier(s) concerné(s), ${totalModifications} mention(s) synchronisée(s).`);
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  calculateDates,
  updateFileContent
};
