// prerender.mjs — Script de pré-rendu statique IA et de garde-fou GEO
import fs from "node:fs";
import https from "node:https";

const PAGES_TO_CHECK = [
  "index.html",
  "stablex.html",
  "contamination.html",
  "loi-93.html",
  "dossier-journalistes.html",
  "flux.html"
];

const MIN_WORDS_REQUIRED = 400;

function stripHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

console.log("=== EXÉCUTION DU PRÉ-RENDU ET VÉRIFICATION GEO ===");

let hasError = false;

// 1. Vérification des balises de pré-rendu
for (const [file, tag] of [["dossier-journalistes.html", "pieces"], ["flux.html", "feed"]]) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, "utf-8");
    const startTag = `<!--PRERENDER:${tag}:START-->`;
    const endTag = `<!--PRERENDER:${tag}:END-->`;
    if (!content.includes(startTag) || !content.includes(endTag)) {
      console.error(`❌ Erreur: Délimiteurs de pré-rendu manquants dans ${file} (${startTag})`);
      hasError = true;
    } else {
      console.log(`✅ Délimiteurs de pré-rendu validés dans ${file}`);
    }
  }
}

// 2. Garde-fou de contenu textuel visible sans JS (>= 400 mots)
console.log("\n=== VÉRIFICATION DU VOLUME TEXTUEL VISIBLE (MIN 400 MOTS) ===");
for (const file of PAGES_TO_CHECK) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Fichier introuvable : ${file}`);
    hasError = true;
    continue;
  }
  const content = fs.readFileSync(file, "utf-8");
  const visibleText = stripHtml(content);
  const words = countWords(visibleText);
  if (words < MIN_WORDS_REQUIRED) {
    console.error(`❌ ÉCHEC GARDE-FOU: ${file} ne contient que ${words} mots visibles (minimum requis: ${MIN_WORDS_REQUIRED})`);
    hasError = true;
  } else {
    console.log(`✅ ${file.padEnd(26)} : ${words} mots visibles (>= ${MIN_WORDS_REQUIRED})`);
  }
}

// 3. Option --ping pour IndexNow et WebSub
if (process.argv.includes("--ping")) {
  console.log("\n=== ENVOI DES NOTIFICATIONS INDEXNOW & WEBSUB ===");
  const host = "williamguindon.me";
  const key = "e99f6ecae641477484dfceba07ce8032";
  const keyLocation = `https://${host}/e99f6ecae641477484dfceba07ce8032.txt`;
  const urlList = PAGES_TO_CHECK.map(p => `https://${host}/${p === "index.html" ? "" : p}`);

  const postData = JSON.stringify({
    host: host,
    key: key,
    keyLocation: keyLocation,
    urlList: urlList
  });

  const req = https.request({
    hostname: "api.indexnow.org",
    port: 443,
    path: "/indexnow",
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(postData)
    },
    timeout: 5000
  }, (res) => {
    console.log(`📡 IndexNow API response status: ${res.statusCode}`);
  });

  req.on("error", (e) => {
    console.warn(`⚠️ Avertissement IndexNow (non-bloquant) : ${e.message}`);
  });

  req.write(postData);
  req.end();
}

if (hasError) {
  console.error("\n❌ Le pré-rendu ou les garde-fous ont échoué.");
  process.exit(1);
} else {
  console.log("\n✨ Pré-rendu et garde-fous validés avec succès !");
}
