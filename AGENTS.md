# AGENTS.md — William Guindon (williamguindon.me)

> **⚠️ La charte de travail de l'agent est dans `AGENT.md` (racine).** Ce fichier-ci décrit
> **l'architecture du projet** ; `AGENT.md` décrit **comment l'agent travaille**. En cas de
> conflit sur la méthode, `AGENT.md` l'emporte.

> **À lire en entier avant toute modification.** Ce fichier existe pour qu'un agent IA n'ait pas à
> redécouvrir le projet à chaque session. Il décrit l'architecture réelle, les règles non
> négociables, les pièges connus et les commandes de vérification.
> Dernière révision : 6 septembre 2026 — basée sur une lecture complète du dépôt (`main`).

---

## 1. Ce qu'est ce projet (et ce qu'il n'est pas)

**Site officiel et registre documentaire public de William Guindon**, militant écologiste québécois,
auteur de la communication citoyenne **SEM-26-003** déposée auprès de la **Commission de coopération
environnementale (CCE / ACEUM)** concernant l'expansion du site d'enfouissement de déchets dangereux
de **Stablex** à Blainville et la protection de la **Grande Tourbière de Blainville**.

- **Nom de domaine :** `williamguindon.me` (fichier `CNAME`)
- **Hébergement :** statique (GitHub Pages / Netlify / Cloudflare Pages / Vercel — plusieurs configs coexistent)
- **Langue :** français en priorité, clés bilingues `*_fr` / `*_en` partout dans les données
- **Licence :** CC BY-NC-ND 4.0 — **pas de dérivés commerciaux, pas de modification redistribuée**
- **Ce n'est PAS :** une application, un SaaS, un projet commercial. C'est une **pièce au dossier
  public d'une procédure juridique internationale**. Une erreur factuelle ici a des conséquences
  réelles.

### ⚖️ Conséquence la plus importante pour un agent
**Aucun fait juridique, date, chiffre ou citation ne peut être inventé, arrondi ou « amélioré ».**
Si une donnée manque, on l'écrit comme manquante. Les chiffres structurants du dossier
(SEM-26-003, art. 24.27/24.28, échéance du 16 octobre 2026, BAPE 371, 278 000 m², cadmium) viennent
de documents sources dans `assets/docs/` — jamais d'une déduction.

---

## 2. Architecture réelle (vérifiée, pas celle du README)

### Racine — pages HTML autonomes (pas de framework, pas de build)
| Fichier | Lignes | Rôle |
|---|---|---|
| `index.html` | 891 | Accueil FR + JSON-LD Schema.org (`Person`, `ProfilePage`, `FAQPage`) |
| `registre-cce-sem26003.html` | 413 | Registre documentaire interactif du dossier |
| `live.html` | — | Compte à rebours temps réel de l'échéance fédérale |
| `blog.html` / `presse.html` / `communiques.html` / `photos.html` | — | Contenus alimentés par `data/*.json` |
| `stablex.html` / `cce.html` / `registre.html` | — | Pages de synthèse du dossier |
| `viewer.html` / `lecteur.html` | — | Lecteurs PDF (PDF.js embarqué) |
| `ai.html` / `txt.html` | 417 / — | Hub IA, version texte ultra-légère |
| `admin.html` | 1 351 | Console admin (écriture dans le dépôt via API GitHub) |
| `console-admin.html` | **2 647** | Console avancée : kill-switches, moniteur de déploiement, CLI simulée |
| `messagerie.html` | 1 750 | Messagerie (Nostr) |
| `editeur.html` | 921 | Éditeur de contenu |
| `404.html`, `privacy.html`, `terms.html` | — | Pages utilitaires |

### Styles et scripts globaux
- `style.css` — **4 837 lignes**, feuille unique pour tout le site
- `theme.js` — **1 908 lignes**, thème + interactions globales
- `assets/js/security-guard.js` — **1 222 lignes**, sentinelle de sécurité (voir §5)
- `assets/js/nostr-crypto.js` (667) + `assets/js/nostr-bundle.js` — messagerie décentralisée
- `assets/js/pdf-viewer.js` (1 757) + `assets/css/pdf-viewer.css` (1 522)
- `sw.js` — service worker PWA, cache `wg-pwa-v15`
- `assets/vendor/pdfjs/` — **dépendance embarquée, ne jamais modifier ni reformater**

### Backend (il n'y en a qu'un)
- `workers/groq-chat.js` (Cloudflare Worker) — **unique fonction serveur**. Proxy vers Groq.
  Exposé sur `/api/groq-chat` via Cloudflare Workers.
- `sync-cec.js` — script Node exécuté par GitHub Actions, réécrit `status.json`.
- `generate-countdown-svg.js` — régénère `countdown-live.svg`.
- `kg-monitor.py` — script manuel de vérification du Google Knowledge Graph (nécessite une clé API).

### Données (source de vérité des contenus)
- `status.json` — statut du dossier CCE, **généré automatiquement par `sync-cec.js`, ne pas éditer à la main**
- `data/site-state.json` — **~60 interrupteurs de sécurité / mode panique** (voir §5)
- `data/blog.json`, `data/photos.json`, `data/biographie-audio-cues.json` — contenus
- `sitemap.xml`, `feed.xml`, `manifest.json`, `robots.txt`

### Protocoles IA / référencement (déjà en place, à maintenir cohérents)
`llms.txt`, `llms-full.txt`, `ai.txt`, `skill.md`, `tools.json`, `agent-skills.json`,
`mcp.json`, `.well-known/mcp.json`, `.well-known/mcp/server-card.json`,
`.well-known/webmcp/tools.json`, `.well-known/agent-skills/index.json`

**Règle :** si tu ajoutes une page, mets à jour `sitemap.xml` + `feed.xml` + `llms.txt`
+ `.well-known/agent-skills/index.json` dans le **même commit**.

### CI / automatisations
| Workflow | Déclencheur | Rôle |
|---|---|---|
| `.github/workflows/ci.yml` | push + PR sur `main` | Valide **JSON** (tous), **XML** (`sitemap.xml`, `feed.xml`), présence de `CNAME`, `.nojekyll`, `robots.txt`, `llms.txt` |
| `.github/workflows/sync-cec.yml` | **cron horaire** + manuel | `node sync-cec.js` → commit de `status.json` |
| `.github/workflows/indexnow.yml` | push | Notification Bing / Yandex / ChatGPT Search |
| `.github/workflows/codeql.yml` | — | Analyse de sécurité |

---

## 3. Développement local et vérification

```bash
npm test                    # = npm run validate (vérifie les 6 assets core)
npm run validate            # sitemap.xml, feed.xml, manifest.json, status.json, agent-skills.json, tools.json
npm run sync:cec            # régénère status.json
npm run generate:countdown  # régénère countdown-live.svg

python3 -m http.server 8080 # prévisualisation locale
# ou : npx serve .
```

**Aucun build, aucun bundler, aucune dépendance npm runtime.** Node 18+, Python 3.

### ✅ À exécuter avant chaque commit
1. `npm run validate`
2. Validation JSON/YAML (c'est ce que fait la CI — si ça casse, le push est bloqué)
3. Vérifier que **tout chemin référencé dans `sw.js` (`ASSETS_TO_CACHE`) existe réellement** — voir §6, bug n°1
4. Si une page a été ajoutée/renommée : `sitemap.xml`, `feed.xml`, `llms.txt`, `.well-known/agent-skills/index.json`
5. Si un domaine externe a été ajouté : **les trois CSP** (`netlify.toml`, `_headers`, `vercel.json`)

### Conventions de commit (déjà en usage, à respecter)
Conventional Commits en **français** : `feat(blog):`, `fix(ai-audit):`, `chore(repo):`,
`ci(security):`, `chore(sync):`. Messages descriptifs, pas de « update files ».
Le bot de sync utilise `chore(sync): … [skip ci]` — **toujours garder `[skip ci]`** sur ce pattern.

---

## 4. Règles absolues (ne jamais franchir)

### 🔒 Secrets
- **Jamais** de clé API, token ou mot de passe dans le dépôt, le HTML ou le JS client.
- `GROQ_API_KEY` **uniquement** en variable d'environnement Netlify.
- Ne jamais écrire un jeton GitHub (`ghp_…`, `github_pat_…`) dans un fichier versionné.
- `.gitignore` couvre `.env`, `*.pem`, `*.key` — ne pas l'affaiblir.

### 📜 Dossier juridique
- **Ne jamais modifier, renommer, recompresser ou régénérer les PDF de `assets/docs/`.**
  Ce sont des pièces déposées. Leur intégrité est probatoire.
- Ne jamais altérer les dates, numéros d'articles, montants ou citations dans les pages
  et dans `status.json` / `llms-full.txt`.
- Ne jamais supprimer de contenu du registre : on **ajoute**, on ne réécrit pas l'historique.

### ⚡ Système de sécurité (voir §5)
- Ne pas toucher à `assets/js/security-guard.js`, `data/site-state.json` ou au mécanisme
  d'authentification de `console-admin.html` / `admin.html` sans instruction explicite.
- Ne pas retirer la liste blanche de domaines ni la politique de routage de `groq-chat.js`.

### 🌐 CSP et en-têtes
- Trois fichiers d'en-têtes coexistent : `netlify.toml`, `_headers`, `vercel.json`.
  **Ils ne sont pas identiques** (dérive connue, voir §6 bug n°4). Toute modification de CSP
  doit être répliquée dans les trois, ou la divergence doit être assumée explicitement.
- Ne jamais ajouter `'unsafe-eval'` ailleurs, ni élargir `frame-ancestors` / `object-src`.

### 📄 Divers
- Ne pas toucher à `assets/vendor/**` (PDF.js) ni aux fichiers minifiés.
- Ne pas reformater massivement : les diffs géants rendent la revue impossible et gonflent
  inutilement l'historique.
- `LICENSE` est CC BY-NC-ND 4.0 — ne pas le changer.

---

## 5. Le système « sentinelle » — à comprendre avant d'y toucher

`assets/js/security-guard.js` est une couche de protection non destructive :

1. **Anti-fork** : liste blanche `ALLOWED_HOSTS` = `williamguindon.me`, `www.`, `localhost`,
   `127.0.0.1`, `bwillou1.github.io`. Hors liste → la page est remplacée par un écran d'erreur.
   **Ajouter un domaine de test ici avant de tester un déploiement miroir**, sinon tout semble cassé.
2. **La console admin est exemptée** (`pathname.includes('console-admin.html')` → `return`).
3. **État réactif** : lecture de `data/site-state.json?_t=<timestamp>` avec anti-régression par
   horodatage (`shouldAcceptState`), `BroadcastChannel`, événement `storage`, et polling distant.
4. `data/site-state.json` contient ~60 drapeaux : `maintenanceActive`, `panicActive`,
   `toxicAlertActive`, `killDevTools`, `blockScreenshots`, `nukeCacheTrigger`, `geoShieldActive`,
   `ipfsRelayActive`, `watermarkActive`, `legalNoticeActive`, `broadcastActive`, etc.
5. `console-admin.html` **écrit ce fichier directement dans le dépôt via l'API GitHub**
   (constantes `GITHUB_REPO = "Bwillou1/WilliamGuindon"`, `GITHUB_API`), donc chaque visiteur
   reçoit les directives sans cache.

**Risque connu à ne pas aggraver :** le jeton GitHub est stocké en `localStorage` sous
`wg_github_pat` (avec mot de passe maître et passkey en complément). C'est un compromis assumé
pour un site statique sans backend. **Ne jamais élargir le périmètre du jeton au-delà de `repo`
sur ce seul dépôt**, et ne jamais ajouter de logique qui enverrait ce jeton ailleurs que
`api.github.com`.

---

## 6. Bugs et dettes techniques réels (constatés le 6 septembre 2026)

À corriger en priorité. **Chacun est vérifié, pas supposé.**

### 🐛 1 — Le service worker ne s'installe jamais (PWA / offline hors service)
`sw.js` déclare 32 assets dans `ASSETS_TO_CACHE`. Deux n'existent pas :
```
/en.html   ← absent du dépôt
/es.html   ← absent du dépôt
```
`caches.addAll()` **rejette dès qu'une seule requête échoue** → `install()` échoue → le service
worker ne s'active pas → cache, mode hors-ligne et notifications ne fonctionnent pas.
**Correctif :** retirer ces deux entrées, **ou** créer réellement `en.html` / `es.html`.
Le README annonce ces deux pages comme existantes : il faut trancher.

### 🐛 2 — `sync-cec.js` ne synchronise pas grand-chose
Tout le contenu de `status.json` est **codé en dur** dans le script. La seule donnée réellement
récupérée est `wpData.modified` (API WordPress de la CCE). Le reste du `try/catch` ne met à jour
qu'un horodatage.
**Conséquence :** le workflow horaire produit un commit par heure qui ne change que
`timestamp_sync` — bruit d'historique, et l'impression d'une synchronisation qui n'existe pas.
**Correctif :** ne commiter que si un champ **autre que** `timestamp_sync` a changé, ou réduire
la fréquence du cron.

### 🐛 3 — README désynchronisé
- Il liste `en.html` et `es.html` dans l'arborescence : **absentes**.
- Il indique `GROQ_MODEL` par défaut `llama-3.3-70b-versatile` ; le code utilise quatre modèles
  (`GROQ_MODEL_LOW`, `GROQ_MODEL_NORMAL`, `GROQ_MODEL_MEDIUM`, `GROQ_MODEL_EXPERT`) avec
  `openai/gpt-oss-20b` / `groq/compound-mini` / `qwen/qwen3.8-27b` / `openai/gpt-oss-120b`.
- Il ne mentionne ni `console-admin.html`, ni `messagerie.html`, ni `editeur.html`, ni
  `kg-monitor.py`, ni `sw.js`.

### 🐛 4 — Trois CSP divergentes
`netlify.toml`, `_headers` et `vercel.json` n'autorisent **pas les mêmes domaines**.
Exemple : GTranslate et Hugging Face sont dans `_headers` mais absents de `netlify.toml`.
Comme Netlify lit `netlify.toml` **et** `_headers`, le comportement dépend de la précédence —
c'est exactement le genre de chose qui casse une traduction un jour sans raison apparente.
**Correctif :** une source unique (générer les trois depuis un seul gabarit), ou un test CI qui
compare les listes de domaines.

### 🐛 5 — La CI ne détecte pas les liens cassés
`ci.yml` valide JSON, XML et quatre fichiers clés. Elle **ne vérifie pas** que les assets
référencés existent. C'est précisément pourquoi le bug n°1 est passé inaperçu.
**Correctif suggéré :** ajouter un pas qui lit `sw.js` et `sitemap.xml` et vérifie l'existence
de chaque chemin.

### ⚠️ 6 — Fichiers monolithiques
`console-admin.html` (2 647 lignes), `theme.js` (1 908), `style.css` (4 837),
`messagerie.html` (1 750), `admin.html` (1 351).
Chaque modification oblige à relire le fichier entier. **C'est la première cause de consommation
de tokens inutile.** Découper en modules ES (`type="module"`) et en feuilles CSS par section
réduit la charge de ~80 % sans changer le comportement.

---

## 7. Conventions de code

- **JavaScript :** IIFE + `'use strict'` (comme `security-guard.js`), pas de framework,
  pas de transpilation. Pas de dépendance npm côté client.
- **Français** dans les commentaires, les messages d'erreur utilisateur, les commits et les issues.
- **Données bilingues :** toute clé de contenu porte un suffixe `_fr` et `_en`
  (voir `status.json`, `sync-cec.js`). Ne jamais ajouter une clé dans une seule langue.
- **Nommage des fichiers :** minuscules, tirets, sans accents (`registre-cce-sem26003.html`).
- **JSON :** 2 espaces d'indentation, UTF-8, pas de commentaire (la CI les validerait mal).
- **Accessibilité :** conserver le HTML5 sémantique, les FAQ en accordéons visibles et les
  attributs ARIA déjà en place ; `txt.html` doit rester < 4 Ko.
- **Images :** fournir `.jpg` + `.webp` (+ `.svg` pour les logos de presse), comme dans `assets/media/`.

---

## 8. Fonction serveur Groq — le contrat à respecter

`workers/groq-chat.js` applique une politique stricte :

- **Aiguillage en 4 niveaux** (`FAIBLE`, `NORMAL`, `MOYEN`, `EXPERT`) par expressions régulières
  dans `classifyQuestion()`, puis par le modèle. Les niveaux `MOYEN` et `EXPERT` renvoient
  `[ROUTE:MOYEN]` / `[ROUTE:EXPERT]` **au client**, qui prend le relais.
- **Modèles :** `GROQ_MODEL_LOW`, `GROQ_MODEL_NORMAL`, `GROQ_MODEL_MEDIUM`, `GROQ_MODEL_EXPERT`.
- **Limites :** corps ≤ 32 Ko, ≤ 12 messages, ≤ 7 000 caractères/message, `max_tokens: 700`,
  `temperature: 0.2`. **Ne pas les augmenter** sans raison documentée : ce sont des garde-fous
  anti-abus et anti-facture.
- **Recherche web** activée seulement pour le niveau `NORMAL`, restreinte à
  `AUTHORIZED_SEARCH_DOMAINS` (12 domaines institutionnels). **Ne jamais élargir cette liste**
  à des réseaux sociaux, plateformes de pétition ou de sociofinancement.
- **Contenus bloqués** (dons, pétitions, campagnes d'opinion, personnes nommément exclues) :
  cette liste est un choix éditorial et juridique assumé. Ne pas la modifier sans instruction.
- CORS verrouillé sur `https://williamguindon.me`.

---

## 9. Pour un agent IA : comment travailler efficacement ici

1. **Lire ce fichier d'abord.** Ne pas explorer le dépôt « pour comprendre » : tout est ici.
2. **Ne jamais charger les gros fichiers en entier.** Cibler :
   ```bash
   grep -n "motif" console-admin.html
   sed -n '1130,1210p' console-admin.html
   ```
3. **Ne jamais lire** `assets/vendor/**`, `*.min.js`, `package-lock.json`,
   `assets/Audio/*.mp3`, `assets/docs/*.pdf`.
4. **Ne pas re-lire `style.css` en entier** : chercher le sélecteur au `grep`.
5. **Un changement = un fichier ciblé.** Éviter les refactors transversaux non demandés.
6. **Vérifier après chaque changement** (§3) et annoncer ce qui a été exécuté et son résultat.
7. **Doute sur un fait juridique → on s'arrête et on demande.** On n'invente pas.
8. **Modèles recommandés** pour ce dépôt (contexte large utile, coût nul) : modèles gratuits à
   1 M de contexte via Kilo Gateway (`minimax/minimax-m3:free`, `thinkingmachines/inkling:free`)
   ou Groq pour les tâches répétitives. Le dépôt entier ≈ 27 000 lignes ≈ 150-200 K tokens :
   il tient dans un seul contexte, mais ce n'est **pas** une raison pour le charger à chaque tour.

---

## 10. Ordre de priorité recommandé pour améliorer le site

1. Corriger `sw.js` (bug n°1) — 2 lignes, remet la PWA en marche.
2. Filtre de commit dans `sync-cec.js` (bug n°2) — supprime ~24 commits/jour de bruit.
3. Ajouter un test CI d'existence des assets (bug n°5) — empêche le retour du bug n°1.
4. Unifier les CSP (bug n°4).
5. Resynchroniser le README (bug n°3).
6. Découper `console-admin.html`, `theme.js`, `style.css` en modules (dette n°6) — le plus gros
   gain de maintenabilité et de coût IA.

---

## 11. Contacts et canaux

- Site : <https://williamguindon.me/#contact>
- Registre CCE : <https://www.cec.org/fr/communications/registre-des-communications/enfouissement-de-matieres-dangereuses-a-blainville/>
- Signalement de sécurité : voir `SECURITY.md`
- Contribution : voir `CONTRIBUTING.md`
