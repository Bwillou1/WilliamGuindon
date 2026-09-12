<div align="center">

# William Guindon — Site Officiel & Registre Public

[![Site Web](https://img.shields.io/badge/Site_Officiel-williamguindon.me-00875a?style=flat-square&logo=safari)](https://williamguindon.me)
[![CCE Dossier](https://img.shields.io/badge/CCE%20SEM--26--003-R%C3%A9ponse%20du%20Canada%20requise-d9381e?style=flat-square)](https://williamguindon.me/registre.html)
[![Licence](https://img.shields.io/badge/Licence-CC%20BY--NC--ND%204.0-blue?style=flat-square)](LICENSE)
[![CI Status](https://img.shields.io/badge/CI-V%C3%A9rification%20Int%C3%A8gre-2ea44f?style=flat-square)](.github/workflows/ci.yml)
[![AI Ready](https://img.shields.io/badge/AI%20Protocol-llms.txt%20%7C%20WebMCP-8a2be2?style=flat-square)](https://williamguindon.me/llms.txt)
[![Langues](https://img.shields.io/badge/Langues-FR%20%7C%20EN%20%7C%20ES-555?style=flat-square)](https://williamguindon.me)

**Dépôt officiel du site web, de la documentation juridique et des ressources publiques de William Guindon.**

[Site Officiel](https://williamguindon.me) • [Suivi en direct CCE](https://williamguindon.me/live.html) • [Dossier SEM-26-003](https://williamguindon.me/registre.html) • [Espace IA (llms.txt)](https://williamguindon.me/ai.html) • [Version Texte Ultra-Légère](https://williamguindon.me/txt.html)

</div>

---

## 📌 Aperçu

**William Guindon** (né en 2011 au Québec, Canada) est un militant écologiste québécois et étudiant dans les Laurentides. Il est l'auteur de la communication citoyenne internationale **SEM-26-003** auprès de la Commission de coopération environnementale (CCE / ACEUM) visant la protection de la **Grande Tourbière de Blainville** contre l'expansion du site d'enfouissement de déchets dangereux Stablex.

Ce dépôt GitHub constitue la source de vérité publique hébergeant le site officiel, les intégrations pour modèles de langage (LLMs / Agents IA), ainsi que le registre documentaire des décisions et pièces juridiques.

---

## ⚖️ Chronologie & Faits Vérifiables

- **8 avril 2025** — Publication de la lettre ouverte *« [François Legault, vous détruisez notre avenir](https://www.ledevoir.com/opinion/lettres/865027/francois-legault-vous-detruisez-notre-avenir) »* dans *Le Devoir*.
- **1ᵉʳ mai 2026** — Dépôt de la communication officielle **[SEM-26-003](https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/)** auprès de la Commission de coopération environnementale (CCE / ACEUM).
- **Mai 2026** — Transmission d'une [Déposition formelle et appel urgent (PDF)](https://williamguindon.me/viewer.html?file=assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf) au Rapporteur spécial de l'ONU sur les substances toxiques et les droits de l'homme (*Dr Marcos A. Orellana*).
- **16 juillet 2026** — Dépôt de la [Communication révisée SEM-26-003 (PDF)](https://williamguindon.me/viewer.html?file=assets/docs/26-3-rsub_fr_redacted.pdf) au Secrétariat de la CCE.
- **17 août 2026** — **[Détermination positive historique de la CCE (PDF)](https://williamguindon.me/viewer.html?file=assets/docs/26-2-det2_fr.pdf)** : le Secrétariat valide la recevabilité de la communication et demande une réponse officielle du gouvernement du Canada avant le **16 octobre 2026** (art. 24.27(2) & 24.27(3) de l'ACEUM).
- **Couverture médiatique** : [The Rover](https://therover.ca/blainville-teenager-takes-stablex-fight-international/) · [Le Devoir](https://www.ledevoir.com/) · [CBC News](https://www.cbc.ca/) · [Journal de Montréal](https://www.journaldemontreal.com/2021/11/28/francois-legault-felicite-le-premier-enfant-vaccine-1).

---

## 📂 Organisation du Dépôt

```
.
├── 📄 index.html              # Page d'accueil officielle (Français) + Données Schema.org JSON-LD (Multilingue in-place)
├── 📄 registre.html # Registre documentaire interactif du dossier CCE
├── 📄 live.html               # Compte à rebours temps réel de l'échéance fédérale CCE
├── 📄 communiques.html        # Archives des communiqués de presse officiels
├── 📄 presse.html             # Revue de presse et mentions médiatiques
├── 📄 stablex.html            # Synthèse technique et environnementale du dossier Stablex
├── 📄 txt.html                # Version texte ultra-légère (< 4 Ko) pour basse bande passante
├── 📄 viewer.html / lecteur.html # Lecteur PDF intégré haute fidélité
├── 📄 ai.html                 # Hub d'exploration interactif pour agents IA
├── 🤖 llms.txt / llms-full.txt # Données structurées et corpus factuel pour les LLMs
├── 🤖 ai.txt                  # Corpus condensé pour l'ingestion par les IA
├── 🌐 sitemap.xml / feed.xml  # Plan du site et flux RSS / Atom
├── 🛠️ tools.json / agent-skills.json / mcp.json # Déclarations d'outils et de protocoles WebMCP
├── 📁 assets/
│   ├── 📁 css/                # Feuilles de styles modulaires (pdf-viewer.css)
│   ├── 📁 js/                 # Scripts clients (pdf-viewer.js)
│   ├── 📁 docs/               # Pièces officielles PDF (Décisions CCE, Dépositions ONU)
│   ├── 📁 media/              # Logos de presse et ressources visuelles
│   └── 📁 vendor/             # Dépendances embarquées (PDF.js)
├── 📁 .well-known/            # Protocoles MCP (Model Context Protocol) et WebMCP
├── 📁 .github/
│   ├── 📁 workflows/          # CI & automatisations (ci.yml, sync-cec.yml, indexnow.yml)
│   └── 📁 ISSUE_TEMPLATE/     # Modèles de signalement et de contribution
├── 📄 package.json            # Métadonnées du projet et scripts de test
├── 📄 LICENSE                 # Licence Creative Commons CC BY-NC-ND 4.0
├── 📄 CONTRIBUTING.md         # Directives de contribution
├── 📄 SECURITY.md             # Politique de sécurité et signalement confidentiel
└── 📄 CODE_OF_CONDUCT.md      # Code de conduite de la communauté
```

---

## 🤖 Protocoles IA & Référencement

Ce dépôt intègre les standards les plus récents en matière de découvrabilité pour agents autonomes et moteurs d'indexation :

- **`llms.txt` / `llms-full.txt`** : Standardisé pour fournir un contexte factuel précis aux agents IA (ChatGPT, Claude, Gemini, Perplexity).
- **WebMCP & MCP (`.well-known/mcp.json`)** : Schémas et cartes de serveur pour l'interopérabilité des agents intelligents.
- **Données structurées Schema.org** : Microdonnées `Person`, `ProfilePage`, `FAQPage` et `NewsArticle` validées.
- **IndexNow (`.github/workflows/indexnow.yml`)** : Notification automatique des moteurs de recherche (Bing, Yandex, ChatGPT Search) à chaque publication.

---

## 🛠️ Développement Local & Scripts

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- [Python 3](https://www.python.org/) (pour les scripts d'analyse)

### Commandes utiles

```bash
# Vérifier la validité des fichiers JSON, XML et des assets critiques
npm test

# Synchroniser automatiquement le statut du dossier auprès de la CCE
npm run sync:cec

# Régénérer le badge SVG dynamique du décompte
npm run generate:countdown

# Démarrer un serveur local de prévisualisation
npx serve .
# ou
python3 -m http.server 8080
```

---

## 🛡️ Sécurité (Cloudflare)

Le site est hébergé statiquement sur GitHub Pages et positionné derrière le proxy **Cloudflare** (mode proxy / DNS orange cloud). GitHub Pages ne permettant pas de configurer nativement les en-têtes HTTP de réponse, la politique de sécurité et le verrouillage sont appliqués directement au niveau de Cloudflare (ou via le script d'automatisation [`scripts/cloudflare-zero-trust-setup.js`](scripts/cloudflare-zero-trust-setup.js)) :

### 1. Transform Rule (« Modify Response Header » sur `/*`)
Dans le tableau de bord Cloudflare (**Rules** ➔ **Transform Rules** ➔ **Modify Response Header**) :
- `Strict-Transport-Security` : `max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options` : `nosniff`
- `X-Frame-Options` : `SAMEORIGIN`
- `Referrer-Policy` : `strict-origin-when-cross-origin`
- `Permissions-Policy` : `camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Content-Security-Policy` : `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://*.google-analytics.com https://google-analytics.com https://ssl.google-analytics.com https://*.google.com https://*.google.ca https://*.gstatic.com https://*.googleapis.com https://*.doubleclick.net https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://unpkg.com https://app.cal.com https://cal.com https://static.cloudflareinsights.com https://cloud.umami.is https://gateway.umami.is https://translate.google.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://router.huggingface.co https://api-inference.huggingface.co https://*.huggingface.co https://huggingface.co; script-src-elem 'self' 'unsafe-inline' https://*.googletagmanager.com https://googletagmanager.com https://tagmanager.google.com https://*.google-analytics.com https://google-analytics.com https://ssl.google-analytics.com https://*.google.com https://*.google.ca https://*.gstatic.com https://*.googleapis.com https://*.doubleclick.net https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://unpkg.com https://app.cal.com https://cal.com https://static.cloudflareinsights.com https://cloud.umami.is https://gateway.umami.is https://translate.google.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://router.huggingface.co https://api-inference.huggingface.co https://*.huggingface.co https://huggingface.co; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://*.googleapis.com https://fonts.googleapis.com https://*.googletagmanager.com https://tagmanager.google.com https://unpkg.com https://app.cal.com https://cal.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://translate.google.com https://fonts.googleapis.com https://*.gstatic.com; style-src-elem 'self' 'unsafe-inline' https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://*.googleapis.com https://fonts.googleapis.com https://*.googletagmanager.com https://tagmanager.google.com https://unpkg.com https://app.cal.com https://cal.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://translate.google.com https://fonts.googleapis.com https://*.gstatic.com; img-src 'self' data: blob: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net https://*.google.com https://*.google.ca https://*.gstatic.com https://*.googleapis.com https://*.cookiebot.com https://consent.cookiebot.com https://imgs.cookiebot.com https://*.tile.openstreetmap.org https://unpkg.com https://williamguindon.me https://app.cal.com https://cal.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://translate.google.com https://fonts.googleapis.com https://*.gstatic.com; font-src 'self' data: https://*.gstatic.com https://fonts.gstatic.com https://app.cal.com https://cal.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://translate.google.com https://fonts.googleapis.com https://*.gstatic.com; connect-src 'self' wss: ws: https://api.websitecarbon.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net https://*.google.com https://*.googleapis.com https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://api.github.com https://raw.githubusercontent.com https://*.tile.openstreetmap.org https://unpkg.com https://app.cal.com https://cal.com https://cloudflareinsights.com https://cloud.umami.is https://gateway.umami.is https://translate.google.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://router.huggingface.co https://api-inference.huggingface.co https://*.huggingface.co https://huggingface.co; frame-src 'self' https://*.googletagmanager.com https://*.doubleclick.net https://*.google.com https://*.cookiebot.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://translate.google.com https://translate.googleapis.com https://cdn.gtranslate.net https://*.gtranslate.net https://gtranslate.com https://app.cal.com https://cal.com https://www.cec.org https://doi.org https://zenodo.org https://felt.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self';`

### 2. SSL/TLS & HSTS
Dans le tableau de bord Cloudflare (**SSL/TLS** ➔ **Edge Certificates** ➔ **HTTP Strict Transport Security (HSTS)**) :
- **Status** : Activé (`Enable HSTS`)
- **Max Age Header** : `1 year (31536000 seconds)`
- **Apply HSTS policy to subdomains (includeSubDomains)** : Coché
- **Preload (Enable HSTS preload)** : Coché

### 3. Accès administration (Cloudflare Access)
Les interfaces d'administration (`admin.html`, `console-admin.html`, `editeur.html`) sont retirées de toute navigation publique et protégées au niveau réseau par **Cloudflare Zero Trust (Access)** (gratuit jusqu'à 50 utilisateurs). L'accès direct aux URLs exige une authentification par code à usage unique (OTP) envoyé par e-mail.

#### Paramétrage manuel (Cloudflare Zero Trust Dashboard) :
1. Se rendre dans **Zero Trust** ➔ **Access** ➔ **Applications** ➔ cliquer sur **Add an application**.
2. Choisir **Self-hosted**.
3. Renseigner l'application :
   - **Application name** : `Administration - William Guindon`
   - **Application domain** : `williamguindon.me`
   - **Path** : `/admin.html` (créer de même pour `/console-admin.html` et `/editeur.html` ou un préfixe commun).
4. Configurer la politique d'accès (**Policy**) :
   - **Policy name** : `Admin Only`
   - **Action** : `Allow`
   - **Rule configuration** : Selector `Emails`, Value `contact@williamguindon.me` (ou votre e-mail administrateur).
5. Enregistrer l'application.

#### Paramétrage automatisé :
Le script [`scripts/cloudflare-zero-trust-setup.js`](scripts/cloudflare-zero-trust-setup.js) configure automatiquement ces 3 applications et la politique d'accès associée via l'API REST Cloudflare v4.

> **Sécurité du jeton GitHub (PAT)** : Le PAT ne doit être utilisé qu'avec une portée minimale (repo seul), une expiration courte, et depuis une session protégée par Cloudflare Access.

### 4. Déploiement du Worker Groq (`/api/groq-chat`)
L'assistant IA documentaire repose sur un Cloudflare Worker autonome ([`workers/groq-chat.js`](workers/groq-chat.js)) servant de proxy sécurisé pour l'API Groq (sans exposer de secret côté client) avec aiguillage intelligent en 4 niveaux (`FAIBLE`, `NORMAL`, `MOYEN`, `EXPERT`).

#### Déploiement via Wrangler :
1. **Déployer le worker** :
   ```bash
   npx wrangler deploy
   ```
2. **Définir la clé secrète Groq** (chiffrée dans Cloudflare, jamais versionnée) :
   ```bash
   npx wrangler secret put GROQ_API_KEY
   ```
3. **Associer la route sur le domaine personnalisé** :
   Dans le tableau de bord Cloudflare (**Workers & Pages** ➔ **williamguindon-groq-chat** ➔ **Settings** ➔ **Domains & Routes**) :
   - Cliquer sur **Add route**
   - **Route** : `williamguindon.me/api/groq-chat*`
   - **Zone** : `williamguindon.me`

*En cas d'indisponibilité ou avant le déploiement du Worker, l'interface bascule instantanément et de façon transparente sur le moteur documentaire local intégré.*

---

## 🔒 Contact & Canaux Sécurisés

- **Site web officiel & Formulaire sécurisé** : [https://williamguindon.me/#contact](https://williamguindon.me/#contact)
- **Session (Messagerie anonyme & chiffrée)** : `05dc60b62a6ed477b1f0dc5ce1b6a9db7603bf39f1a0efe13c68d63a6cb8a7c072`
- **Réseaux officiels** :
  - LinkedIn : [in/william-guindon](https://ca.linkedin.com/in/william-guindon)
  - YouTube : [@william-guindon](https://www.youtube.com/@william-guindon)
  - Facebook : [williamguindon](https://www.facebook.com/profile.php?id=61591437730054)
  - GitHub : [@Bwillou1](https://github.com/Bwillou1)

---

<div align="center">
  <sub>© 2026 William Guindon. Contenu protégé sous licence <a href="LICENSE">CC BY-NC-ND 4.0</a>.</sub>
</div>
