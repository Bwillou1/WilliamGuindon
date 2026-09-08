# CLAUDE.md — williamguindon.me

@AGENT.md

> La charte ci-dessus (`AGENT.md`) est la **source de vérité** et s'applique intégralement.
> Ce fichier n'ajoute que ce qui est spécifique à Claude Code. En cas de conflit, `AGENT.md` gagne.

---

## 1. Le projet en une ligne

Site officiel et registre documentaire public de William Guindon — pièce au dossier de la
communication citoyenne **SEM-26-003** (CCE / ACEUM) sur la Grande Tourbière de Blainville.
Statique, sans framework, sans build. Licence CC BY-NC-ND 4.0.

**Architecture détaillée, commandes, bugs connus : `AGENTS.md`.** Ne pas réexplorer le dépôt pour
le comprendre : tout y est écrit.

---

## 2. Commandes de vérification

```bash
npm run validate             # 6 assets core présents
npm test                     # = validate
node sync-cec.js             # régénère status.json (ne pas commiter manuellement)
python3 -m http.server 8080  # prévisualisation locale
```

La CI (`.github/workflows/ci.yml`) valide **tous les JSON**, `sitemap.xml` et `feed.xml`, et la
présence de `CNAME`, `.nojekyll`, `robots.txt`, `llms.txt`. Si ça casse, le push est bloqué.

**Séquence obligatoire avant de déclarer un travail terminé :**
1. `npm run validate`
2. Validation JSON + XML
3. Existence réelle de chaque chemin cité dans `sw.js` (`ASSETS_TO_CACHE`) et `sitemap.xml`
4. Si une page a bougé : `sitemap.xml`, `feed.xml`, `llms.txt`, `.well-known/agent-skills/index.json`

---

## 3. Permissions — `.claude/settings.json`

Les règles sont **appliquées par l'outil**, pas seulement demandées. Précédence :
`deny` > `ask` > `allow` > `defaultMode`. Un `deny` n'est jamais contournable.

| Liste | Contenu | Pourquoi |
|---|---|---|
| **deny** | `Read(.env*)` | Aucun secret ne doit entrer dans le contexte |
| **deny** | `Edit`/`Write` sur `assets/docs/**` | Pièces déposées au dossier CCE : valeur probatoire |
| **deny** | `Edit`/`Write` sur `assets/vendor/**`, `package-lock.json`, `LICENSE` | Dépendances embarquées et licence |
| **deny** | `git push --force`, `rm -rf` | Destruction irréversible |
| **ask** | `Edit(./AGENT.md)`, `Edit(./AGENTS.md)` | Modifier la charte exige une validation humaine |
| **ask** | `git commit`, `git push`, `npm install`, `rm` | Toujours savoir avant |
| **allow** | `npm run validate`, `grep`, `sed`, `find`, `wc`, `git status/diff/log`, `node`, `python3` | Lecture et vérification sans friction |

**Ne jamais** utiliser `--dangerously-skip-permissions` sur ce dépôt, ni demander à élargir un
`allow` pour contourner un `deny`. Si un `deny` bloque, c'est voulu : expliquer à l'utilisateur et
le laisser décider.

⚠️ **Ce dépôt est public.** `.claude/settings.json` est lu et appliqué par toute personne qui
clone le dépôt. C'est volontaire et protecteur. **N'ajouter aucun hook** (`.claude/settings.json`
`hooks`) : un hook exécute du shell chez les autres. Le personnel va dans
`.claude/settings.local.json`, qui est gitignoré.

---

## 4. Outils spécifiques à ce dépôt

- **`/valider`** — commande personnalisée (`.claude/commands/valider.md`) : exécute la séquence
  complète du §2 et rapporte ce qui a été réellement traversé.
- **Sous-agent `verificateur`** (`.claude/agents/verificateur.md`) — lecture seule, chargé de
  prouver qu'une modification est réelle. À invoquer avant d'annoncer « c'est fait » sur un
  changement non trivial.

---

## 5. Économie de contexte

- **Ne jamais lire** : `assets/vendor/**`, `*.min.js`, `package-lock.json`, `assets/Audio/*.mp3`,
  `assets/docs/*.pdf` (sauf demande explicite).
- **Ne jamais charger en entier** : `style.css` (4 837 lignes), `console-admin.html` (2 647),
  `theme.js` (1 908), `messagerie.html` (1 750), `admin.html` (1 351).
  Utiliser `Grep` pour localiser, puis `Read` avec `offset`/`limit`.
- Le dépôt complet ≈ 27 000 lignes ≈ 150-200 K tokens. Il *tient* dans le contexte, mais ce n'est
  pas une raison pour le charger : viser le fichier et la plage utiles.

---

## 6. Conventions

- Commits : **Conventional Commits en français** — `feat(blog):`, `fix(ai-audit):`, `chore(repo):`,
  `ci(security):`. Le bot de sync utilise `chore(sync): … [skip ci]` : **toujours garder `[skip ci]`**.
- Données **bilingues** : toute clé de contenu porte `_fr` et `_en`. Jamais une seule langue.
- Commentaires, messages d'erreur utilisateur et issues **en français**.
- Nommage : minuscules, tirets, sans accents.
- Images : `.jpg` + `.webp` (+ `.svg` pour les logos de presse).
- JSON : 2 espaces, UTF-8, sans commentaire.

---

## 7. Interdits propres à ce projet

1. **Aucun fait inventé.** Dates, chiffres, articles de loi, citations : uniquement depuis
   `assets/docs/`, `status.json`, `llms-full.txt` ou une source institutionnelle vérifiée.
   Ce qui manque est écrit comme manquant.
2. **Aucun secret versionné.** `GROQ_API_KEY` = variable d'environnement Netlify, point.
3. **Ne pas élargir** la CSP (`netlify.toml`, `_headers`, `vercel.json`), la liste blanche
   `AUTHORIZED_SEARCH_DOMAINS` ni le CORS de `netlify/functions/groq-chat.js`.
4. **Ne pas augmenter** les garde-fous de la fonction Groq (32 Ko / 12 messages / 7 000 caractères /
   `max_tokens` 700) sans raison documentée.
5. **Ne pas toucher** à `assets/js/security-guard.js`, `data/site-state.json` ni au mécanisme
   d'authentification des consoles sans instruction explicite.
6. **`status.json` est généré** par `sync-cec.js` : ne pas l'éditer à la main.

---

## 8. Rapport de fin de tâche

Toujours terminer par :
- **ce qui a changé** (fichiers, lignes),
- **ce qui a été exécuté et son résultat réel** (commande + sortie pertinente),
- **le chemin de code réellement traversé** par cette vérification — sinon dire qu'aucune
  vérification n'a eu lieu,
- **ce qui reste ouvert** ou non vérifié.

Un code de sortie à zéro n'est pas une réussite quand le contenu est faux.
