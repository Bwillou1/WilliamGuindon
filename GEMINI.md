# GEMINI.md — williamguindon.me (Google Antigravity)

> **Fichier autonome, volontairement.** Antigravity injecte ce fichier dans **chaque** appel de
> modèle. S'il se contentait de dire « va lire AGENTS.md », l'agent grillerait un appel
> supplémentaire et des tokens pour ouvrir le fichier. Les règles essentielles sont donc
> **écrites ici**, pas déléguées. `AGENTS.md` reste la référence détaillée d'architecture.
> Limite Antigravity : 12 000 caractères par fichier de règles.

---

## 1. Mission

Travail **exact, vérifié, réversible**, en français. Jamais un fait inventé.
Une réponse honnête et incomplète vaut mieux qu'une réponse complète et fausse.

---

## 2. Règles absolues

**Interdit :**
1. Inventer un fait, une date, un chiffre, une citation, une URL, un article de loi, un nom de
   fichier ou un résultat de test.
2. Écrire « testé », « validé », « corrigé » sans avoir réellement exécuté la commande et lu sa sortie.
3. Écrire un secret (clé, jeton, mot de passe) dans un fichier versionné, un log ou une réponse.
4. Détruire sans retour : suppression de fichiers, `git push --force`, `git reset --hard`, `rm -rf`.
5. Élargir un périmètre de sécurité : CSP, liste blanche de domaines, CORS, droits d'un jeton.
6. Modifier `assets/docs/**` (pièces déposées au dossier CCE), `assets/vendor/**`,
   `package-lock.json`, `LICENSE`, `status.json` (généré automatiquement).
7. Présenter une hypothèse comme un fait.

**Obligatoire :**
8. Annoncer ce qui a été exécuté et son résultat réel.
9. Signaler explicitement ce qui n'a pas pu être vérifié.
10. Demander quand une ambiguïté changerait le résultat.
11. Nommer le chemin de code réellement traversé par la vérification. Sinon : dire qu'aucune
    vérification n'a eu lieu.

---

## 3. Le projet

Site officiel et registre documentaire public de **William Guindon** — `williamguindon.me`,
dépôt `Bwillou1/WilliamGuindon`.

- **Nature :** pièce au dossier public de la communication citoyenne **SEM-26-003** (CCE / ACEUM)
  sur l'expansion du site d'enfouissement de déchets dangereux de Stablex à Blainville et la
  protection de la Grande Tourbière de Blainville. Licence CC BY-NC-ND 4.0.
- **Conséquence :** aucune date, aucun chiffre, aucun article de loi, aucune citation ne peut être
  inventé, arrondi ou « amélioré ». Ce qui manque est écrit comme manquant.
- **Stack :** HTML/CSS/JS statique. **Aucun framework, aucun build, aucune dépendance npm runtime.**
  Une seule fonction serveur : `workers/groq-chat.js` (Cloudflare Worker). Données dans `status.json` et
  `data/*.json`. CI et synchronisation par GitHub Actions.
- **Échéance structurante :** 16 octobre 2026 (réponse du Canada à la CCE).

### Fichiers volumineux — ne jamais charger en entier
`style.css` (4 837 l.), `console-admin.html` (2 647), `theme.js` (1 908), `messagerie.html` (1 750),
`admin.html` (1 351), `assets/js/pdf-viewer.js` (1 757).
→ Localiser au `grep`, puis lire une plage précise.

### Ne jamais ouvrir
`assets/vendor/**`, `*.min.js`, `package-lock.json`, `assets/Audio/*.mp3`, `assets/docs/*.pdf`
(sauf demande explicite).

---

## 4. Discipline de quota — calibrée Google AI Pro

Compte **Google AI Pro** : allocation de calcul environ **4x** le palier standard, fenêtre de
contexte **1 M de tokens**, rafraîchissement **toutes les 5 heures jusqu'au plafond hebdomadaire**.

**La contrainte réelle n'est pas la fenêtre de 5 heures — c'est le plafond hebdomadaire.**
Précédent de mars 2026 : des abonnés Pro bloqués **168 heures** après avoir épuisé leur quota
hebdomadaire en ~20 minutes de travail intensif. Donc : travailler normalement, mais **protéger
la semaine**.

Ce qui vide le quota hebdomadaire le plus vite : le contexte rechargé à chaque tour (la fenêtre
1 M rend la surcharge tentante et invisible) · les lectures de fichiers complets · les agents
parallèles (consommation × nombre d'agents) · les relances d'une approche qui échoue ·
Deep Research / Deep Think.

1. **Ne pas confondre « la fenêtre le permet » et « c'est utile ».** 1 M de tokens n'est pas une
   autorisation à charger `style.css` (4 837 lignes) en entier.
2. **`grep` d'abord, plage d'environ 80 lignes ensuite.** Jamais de fichier complet au-delà de
   ~500 lignes.
3. **Un changement = un fichier ciblé.** Pas de refactor transversal non demandé.
4. **Agents parallèles seulement pour des tâches réellement indépendantes** (ex. vérifier trois
   pages distinctes). Jamais pour découper une seule tâche.
5. **Ne jamais relancer deux fois la même approche qui a échoué.** Diagnostiquer l'échec d'abord :
   trois tentatives identiques coûtent trois fois le même quota pour le même résultat.
6. **Les diffs géants gonflent le contexte de _tous_ les tours suivants**, pas seulement du tour
   courant.
7. **Routage de modèle — le levier le plus efficace.** Tâches routinières (éditions simples,
   renommages, formatage, commits) sur le modèle Flash ; réserver les modèles lourds au
   raisonnement difficile : diagnostic d'un bug subtil, décision d'architecture, relecture de
   sécurité. Proposer explicitement le modèle quand la tâche est coûteuse.
8. **Si le plafond hebdomadaire approche : basculer sur Flash et le dire**, plutôt que de bâcler
   ou d'acheter des crédits en silence.

> La disponibilité des modèles Claude sur AI Pro varie selon les sources : vérifier dans le
> sélecteur de modèles, ne jamais la présumer.

---

## 5. Vérification — commandes réelles

```bash
npm run validate              # 6 assets core présents
npm test                      # = validate
python3 -m http.server 8080   # prévisualisation locale
```

**Séquence obligatoire avant de déclarer un travail terminé :**
1. `npm run validate`
2. Validation de **tous** les JSON du dépôt + `sitemap.xml` et `feed.xml` en XML
3. Présence de `CNAME`, `.nojekyll`, `robots.txt`, `llms.txt`
4. **Existence réelle de chaque chemin listé dans `sw.js` (`ASSETS_TO_CACHE`)** — `caches.addAll()`
   rejette dès qu'une seule requête échoue, donc un seul fichier manquant empêche l'installation
   du service worker
5. Existence de chaque page `.html` citée dans `sitemap.xml`
6. Cohérence des trois politiques CSP : `netlify.toml`, `_headers`, `vercel.json`
7. Si une page a bougé : mettre à jour `sitemap.xml`, `feed.xml`, `llms.txt`,
   `.well-known/agent-skills/index.json` **dans le même commit**

Un code de sortie à zéro n'est pas une réussite quand le contenu est faux.

---

## 6. Usage des fonctions Antigravity

- **Agent navigateur (Chromium intégré)** : utile pour vérifier le rendu réel d'une page modifiée.
  Le domaine de test autorisé est `localhost` / `127.0.0.1` — voir §7, point 4.
- **Manager View / agents parallèles** : à réserver aux tâches réellement indépendantes
  (ex. vérifier trois pages distinctes). Jamais pour diviser une seule tâche.
- **Artifacts** : produire un plan ou une liste de tâches avant d'éditer sur tout changement
  touchant plus de deux fichiers.
- **Strict Mode** : à laisser activé. Ne pas demander à le désactiver.
- **Allowlist de domaines du navigateur** : ne jamais y ajouter de domaine sans instruction explicite.

---

## 7. Interdits propres à ce projet

1. **`GROQ_API_KEY`** est une variable d'environnement Netlify. Jamais dans le dépôt, le HTML ou
   le JS client.
2. Ne pas élargir la CSP (`netlify.toml`, `_headers`, `vercel.json`), la liste blanche
   `AUTHORIZED_SEARCH_DOMAINS` ni le CORS de `workers/groq-chat.js`.
3. Ne pas augmenter les garde-fous de la fonction Groq (corps ≤ 32 Ko, ≤ 12 messages,
   ≤ 7 000 caractères/message, `max_tokens` 700, `temperature` 0.2).
4. **Anti-fork :** `assets/js/security-guard.js` bloque tout domaine hors
   `williamguindon.me`, `www.`, `localhost`, `127.0.0.1`, `bwillou1.github.io`. Un déploiement
   miroir non listé affichera un écran d'erreur : ce n'est pas un bug.
5. Ne pas toucher à `data/site-state.json` (66 interrupteurs de sécurité) ni au mécanisme
   d'authentification de `console-admin.html` / `admin.html` sans instruction explicite.
6. `status.json` est **généré** par `sync-cec.js` : ne jamais l'éditer à la main.

---

## 8. Conventions

- **Commits :** Conventional Commits **en français** — `feat(blog):`, `fix(ai-audit):`,
  `chore(repo):`, `ci(security):`. Le bot de sync utilise `chore(sync): … [skip ci]` :
  **toujours conserver `[skip ci]`**.
- **Données bilingues :** toute clé de contenu porte `_fr` et `_en`. Jamais une seule langue.
- **Langue :** commentaires, messages d'erreur utilisateur, issues et commits en français.
- **Nommage :** minuscules, tirets, sans accents.
- **Images :** `.jpg` + `.webp` (+ `.svg` pour les logos de presse).
- **JSON :** 2 espaces, UTF-8, sans commentaire.
- **Accessibilité :** conserver le HTML5 sémantique, les FAQ en accordéons visibles et les ARIA.
- **`txt.html`** est la version texte ultra-légère. Le `README.md` l'annonce « < 4 Ko » alors
  qu'elle pèse actuellement **9 152 octets** : l'objectif affiché est déjà dépassé.
  Ne pas l'alourdir davantage, et signaler la divergence plutôt que de la masquer.

---

## 9. Rapport de fin de tâche

Toujours terminer par :
- **ce qui a changé** (fichiers, lignes),
- **ce qui a été exécuté et son résultat réel** (commande + sortie pertinente),
- **le chemin de code réellement traversé** par la vérification,
- **ce qui reste ouvert ou non vérifié.**

Aucune complaisance. Un trou honnête coûte zéro ; une devinette dite du même ton qu'un fait
vérifié coûte le dossier.
