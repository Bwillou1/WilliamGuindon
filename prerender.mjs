/**
 * prerender.mjs — Pré-rendu statique automatisé au build (Zero-framework SSR)
 * Site officiel de William Guindon (williamguindon.me)
 * 
 * Injecte le contenu substantiel dans le HTML brut entre les balises de commentaires :
 * - dossier-journalistes.html : <!--PRERENDER:pieces:START--> ... <!--PRERENDER:pieces:END-->
 * - flux.html : <!--PRERENDER:feed:START--> ... <!--PRERENDER:feed:END-->
 * 
 * Valide le seuil minimal de 400 mots visibles sans JavaScript sur chaque page critique.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("=== Début du Pré-rendu Statique Automatisé (prerender.mjs) ===\n");

// 1. Pré-rendu de flux.html depuis feed.xml
function prerenderFlux() {
  const feedXmlPath = path.join(__dirname, "feed.xml");
  const fluxHtmlPath = path.join(__dirname, "flux.html");

  if (!fs.existsSync(feedXmlPath) || !fs.existsSync(fluxHtmlPath)) {
    console.warn("⚠️ feed.xml ou flux.html introuvable, étape ignorée.");
    return;
  }

  const feedXml = fs.readFileSync(feedXmlPath, "utf8");
  const itemMatches = [...feedXml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  let cardsHtml = `\n<div class="flux-feed-cards" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin: 24px 0;">\n`;

  itemMatches.forEach(match => {
    const itemContent = match[1];
    const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/i);

    const title = titleMatch ? titleMatch[1].trim() : "Actualité";
    const link = linkMatch ? linkMatch[1].trim() : "#";
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";
    const desc = descMatch ? (descMatch[1] || descMatch[2] || "").trim() : "";

    cardsHtml += `  <article class="flux-card" style="background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
    <div>
      <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent); text-transform: uppercase; margin-bottom: 8px;">${pubDate}</div>
      <h3 style="margin: 0 0 10px; font-size: 1.15rem; line-height: 1.4;"><a href="${link}" style="color: var(--text); text-decoration: none;">${title}</a></h3>
      <p style="margin: 0 0 16px; font-size: 0.92rem; color: var(--text-muted); line-height: 1.55;">${desc}</p>
    </div>
    <div>
      <a href="${link}" class="btn-flux-read" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; font-weight: 700; color: var(--accent-deep); text-decoration: underline;">Lire l'article ↗</a>
    </div>
  </article>\n`;
  });

  cardsHtml += `</div>\n`;

  let fluxHtml = fs.readFileSync(fluxHtmlPath, "utf8");
  const startTag = "<!--PRERENDER:feed:START-->";
  const endTag = "<!--PRERENDER:feed:END-->";

  if (fluxHtml.includes(startTag) && fluxHtml.includes(endTag)) {
    const before = fluxHtml.substring(0, fluxHtml.indexOf(startTag) + startTag.length);
    const after = fluxHtml.substring(fluxHtml.indexOf(endTag));
    fluxHtml = before + cardsHtml + after;
    fs.writeFileSync(fluxHtmlPath, fluxHtml, "utf8");
    console.log(`✔ [OK] flux.html pré-rendu avec ${itemMatches.length} articles RSS.`);
  } else {
    console.warn("⚠️ Balises PRERENDER:feed introuvables dans flux.html.");
  }
}

// 2. Vérification du seuil minimal de 400 mots visibles sans JS
function verifyWordCountThreshold() {
  const pagesToCheck = [
    "dossier-journalistes.html",
    "flux.html",
    "blog.html",
    "stablex.html",
    "contamination.html",
    "loi-93.html",
    "registre.html"
  ];

  let hasError = false;
  console.log("\n=== Vérification du seuil minimal (>= 400 mots visibles sans JS) ===");

  pagesToCheck.forEach(pageName => {
    const filePath = path.join(__dirname, pageName);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ [ERREUR] Page manquante : ${pageName}`);
      hasError = true;
      return;
    }

    const html = fs.readFileSync(filePath, "utf8");
    const textOnly = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = textOnly.split(" ").filter(Boolean).length;
    if (words < 400) {
      console.error(`❌ [ÉCHEC] ${pageName} : ${words} mots (< 400 mots requis pour indexation IA)`);
      hasError = true;
    } else {
      console.log(`✔ [CONFORME] ${pageName} : ${words} mots visibles sans JS.`);
    }
  });

  if (hasError) {
    console.error("\n❌ Erreur de seuil minimal : certaines pages sont sous les 400 mots.");
    process.exit(1);
  } else {
    console.log("\n🎉 Toutes les pages critiques dépassent le seuil de 400 mots !");
  }
}

// Exécution
prerenderFlux();
verifyWordCountThreshold();
