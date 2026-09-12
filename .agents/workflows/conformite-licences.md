# Workflow — Conformité des licences, sécurité et cohérence documentaire

Ce workflow formalise la procédure d'audit et de validation continue de conformité juridique et de sécurité pour le dépôt `williamguindon.me`.

---

## 1. Périmètre et obligations légales

1. **Licence du contenu original** : `CC BY-NC-ND 4.0` (Textes, analyses, médias originaux, métadonnées).
2. **Dépendances tierces** :
   - Fichiers JavaScript vendor / embarqués (`assets/vendor/pdfjs/`, `assets/js/nostr-crypto.js`, etc.) : conserver intégralement les avis de licence d'origine (Apache 2.0, MIT, Unlicense).
   - Registre public des licences : maintenir à jour `THIRD-PARTY-NOTICES.md` et la page publique `dependances-licences.html`.
   - **Règle stricte GPL** : le script GPL `website-carbon-badges@1.1.3/b.min.js` NE DOIT JAMAIS être copié sous `assets/` ni pré-caché dans `sw.js`. Il est chargé en runtime tiers avec SRI et `crossorigin="anonymous"`.
3. **Sécurité PDF & CVE-2024-4367** :
   - `isEvalSupported: false` DOIT TOUJOURS rester actif dans `assets/js/pdf-viewer.js` pour neutraliser l'exécution de code arbitraire par police de caractères malveillante dans `pdf.js`.
4. **Politique CSP** :
   - Strictement aucun `'unsafe-eval'` dans les pages HTML de production.
   - Respect strict des directives `object-src 'none'`, `base-uri 'self'`, et `worker-src 'self' blob:`.

---

## 2. Commandes de vérification automatisée

Exécuter le script de validation de conformité et d'intégrité :

```bash
npm test
# ou directement :
node scripts/validate-assets.js
```

### Vérifications manuelles / greps de sécurité

```bash
# 1. Vérification de l'absence de fichiers GPL auto-hébergés
test ! -f assets/b.min.js && test ! -f assets/js/b.min.js

# 2. Vérification de l'absence totale de 'unsafe-eval' dans les pages HTML
grep -rn "unsafe-eval" --include="*.html" . | wc -l
# Résultat attendu : 0

# 3. Vérification des liens CCE en HTTPS uniquement
grep -rn "http://www.cec.org" --include="*.html" --include="*.json" --include="*.js" . | wc -l
# Résultat attendu : 0

# 4. Vérification de l'absence de fausse attribution Trumbowyg
grep -rni "trumbowyg" --include="*.html" --include="*.js" . | wc -l
# Résultat attendu : 0

# 5. Vérification du drapeau de mitigation CVE-2024-4367
grep -n "isEvalSupported: false" assets/js/pdf-viewer.js
# Résultat attendu : 1 correspondance active

# 6. Vérification de la mention CC BY-NC-ND dans registre.html
grep -c "CC BY-NC-ND" registre.html
# Résultat attendu : >= 1
```

---

## 3. Protocole de test réseau CCE

Pour valider l'accessibilité des URL de la Commission de coopération environnementale (`cec.org`), toujours spécifier un User-Agent navigateur pour éviter le blocage par le WAF upstream :

```bash
curl -s -o /dev/null -w "%{http_code}\n" -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" https://www.cec.org/fr/communications/registre-des-communications/enfouissement-de-matieres-dangereuses-a-blainville/
# Résultat attendu : 200
```
