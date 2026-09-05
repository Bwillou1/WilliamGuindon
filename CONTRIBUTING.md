# Directives de contribution / Contributing Guidelines

Ce dépôt rassemble le code source du site officiel, les intégrations IA et les pièces documentaires publiques de **William Guindon** relatives au dossier CCE SEM-26-003 et à la protection de la Grande Tourbière de Blainville.

---

## 1. Principes et règles de soumission

- **Textes et écrits de l'auteur** : Aucune modification éditoriale, politique ou idéologique n'est admise. L'intégrité de la démarche citoyenne et les textes signés demeurent exclusifs à l'auteur.
- **Contributions acceptées (Pull Requests)** :
  - Corrections techniques matérielles (liens brisés, coquilles d'affichage, correctifs CSS/HTML/JS).
  - Optimisations de performance, de responsive design et d'accessibilité (WCAG / a11y).
  - Améliorations des métadonnées SEO, protocoles IA (`llms.txt`, MCP, JSON-LD) et scripts d'automatisation.
- **Signalements (Issues)** :
  - Pour signaler une erreur factuelle ou matérielle, merci d'ouvrir une *Issue* accompagnée de sources publiques et officielles vérifiables.
  - Pour tout signalement confidentiel ou de sécurité, consultez notre [Politique de sécurité](SECURITY.md).

---

## 2. Processus de développement local

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/Bwillou1/WilliamGuindon.git
   cd WilliamGuindon
   ```

2. **Valider les fichiers et schémas** :
   ```bash
   npm test
   ```

3. **Tester localement** :
   Vous pouvez lancer un serveur HTTP statique simple :
   ```bash
   npx serve .
   # ou
   python3 -m http.server 8080
   ```

4. **Soumettre une Pull Request** :
   - Créez une branche descriptive (`git checkout -b fix/lien-document`).
   - Remplissez le modèle de Pull Request.

---

## 3. Code de conduite

Tous les contributeurs et intervenants sont tenus de respecter le [Code de conduite](CODE_OF_CONDUCT.md).
