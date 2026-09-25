# Avis et Licences de Logiciels Tiers (Third-Party Notices)

Ce document répertorie les avis légaux, attributions et licences des composants logiciels tiers inclus, distribués ou utilisés par le site officiel de William Guindon ([williamguindon.me](https://williamguindon.me)).

---

## 1. Contenu original du site
Les textes, analyses, documents, images et données originaux produits par William Guindon sont mis à disposition selon les termes de la licence [Creative Commons Attribution - Pas d’Utilisation Commerciale - Pas de Modification 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr).

© 2026 William Guindon — Blainville, Québec, Canada.

---

## 2. Logiciels tiers distribués

### PDF.js (v3.11.174)
- **Auteurs :** Copyright © 2023 Mozilla Foundation
- **Licence :** Apache License 2.0
- **URL :** https://github.com/mozilla/pdf.js
- **Sécurité & Mitigation CVE-2024-4367 :** La vulnérabilité CVE-2024-4367 (exécution de code JavaScript arbitraire via polices piégées) est neutralisée en conservant le paramètre `isEvalSupported: false` lors de l'instanciation `pdfjsLib.getDocument(...)`. Cible de mise à niveau future : `pdfjs-dist >= 4.2.67` (les 3 composants `pdf.min.js`, `pdf.worker.min.js` et `pdf_viewer.css` devant être migrés de concert).

```text
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

### Nostr Tools (v2.25.2)
- **Auteur :** fiatjaf et contributeurs
- **Licence :** Unlicense (Domaine Public)
- **URL :** https://github.com/nbd-wtf/nostr-tools

```text
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.
```

---

### Bibliothèques Cryptographiques (@noble/curves, @noble/hashes, @noble/ciphers, @scure/base, @scure/bip32, @scure/bip39)
- **Auteur :** Copyright (c) 2022-2023 Paul Miller (https://paulmillr.com)
- **Licence :** MIT License

```text
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### GrapesJS (v0.23.6) & GrapesJS Preset Webpage (v1.0.3)
- **Auteurs :** Copyright (c) 2016-2026 Artur Arseniev et contributeurs
- **Licence :** BSD 3-Clause License
- **URL :** https://github.com/GrapesJS/grapesjs
- **Description :** Cadre de travail pour l'éditeur visuel de pages web intégré (`editeur.html` et console d'administration `console-admin.html`), permettant la composition, modification directe et prévisualisation modulaire des pages HTML du site.

```text
BSD 3-Clause License

Copyright (c) 2016-2026, Artur Arseniev
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

---

### Pagefind (v1.5.2)
- **Auteurs :** Copyright (c) 2022-2026 Liam Bigelow, CloudCannon et contributeurs
- **Licence :** MIT License
- **URL :** https://github.com/Pagefind/pagefind / https://pagefind.app
- **Description :** Moteur de recherche statique côté client ultra-performant. Indexe l'intégralité du site et fournit la recherche textuelle instantanée WebAssembly avec surbrillance des termes trouvés, connectée directement au bouton `⌘K Recherche` du site (chargement asynchrone dynamique via `import('/pagefind/pagefind.js')` sans impacter la vitesse de chargement initial).

```text
MIT License

Copyright (c) 2022 CloudCannon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### Curtains.js (v8.1.6)
- **Auteur :** Copyright (c) 2019-2026 Martin Laxenaire
- **Licence :** MIT License
- **URL :** https://github.com/martinlaxenaire/curtainsjs
- **Description :** Moteur d'animation et de rendu WebGL interactif haute performance utilisé pour le déplacement 3D par carte de profondeur (depth map displacement) de l'image de la Grande Tourbière au lever du soleil sur la page d'accueil (`index.html`), réagissant dynamiquement au curseur de souris sur ordinateur et à l'orientation / gyroscope sur mobile.

```text
MIT License

Copyright (c) 2019-2026 Martin Laxenaire

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### Add to Calendar Button (v2)
- **Auteurs :** Copyright (c) 2021-2026 Jens Kuerschner (jekuer) et contributeurs
- **Licence :** MIT License
- **URL :** https://github.com/jekuer/add-to-calendar-button / https://add-to-calendar-button.com
- **Description :** Composant Web universel et accessible permettant d'ajouter facilement les événements et rappels officiels (notamment l'échéance CCE du 16 octobre 2026) dans Apple Calendar, Google Calendar, Office 365, Outlook.com, Microsoft Teams, Yahoo et iCal (.ics) sans pistage ni collecte de données personnelles.

```text
MIT License

Copyright (c) 2021-2026 Jens Kuerschner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### x-frame-bypass
- **Auteurs :** Copyright (c) Jerzy Głowacki (niutech)
- **Licence :** MIT License
- **URL :** https://github.com/niutech/x-frame-bypass
- **Description :** Web Component étendant les éléments iframe (`HTMLIFrameElement`) permettant l'intégration et la consultation transparente de ressources documentaires, cartographiques et de plateformes citoyennes sans blocage d'en-têtes de cadrage (X-Frame-Options / CSP frame-ancestors) via des proxys CORS sécurisés.

```text
MIT License

Copyright (c) Jerzy Głowacki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### Gutenberg (Web Typography & Print Framework)
- **Auteur :** Copyright (c) 2016 Bård Farstad (bafs)
- **Licence :** MIT License
- **URL :** https://github.com/bafs/gutenberg
- **Description :** Cadre de travail pour la typographie web moderne et les feuilles de style d'impression. Fournit les fondations typographiques, le rythme vertical, les échelles modulaires proportionnelles et la mise en page d'impression de haute précision pour l'ensemble des pages du site, notamment les politiques et chartes éthiques, les communiqués de presse, les déclarations publiques et les pages d'analyses documentaires.

```text
The MIT License (MIT)

Copyright (c) 2016 Bård Farstad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### Satori (HTML/CSS to SVG Vector Engine)
- **Auteurs :** Copyright (c) Vercel, Inc.
- **Licence :** Mozilla Public License 2.0 (MPL-2.0)
- **URL :** https://github.com/vercel/satori
- **Description :** Architecture et principes de rendu vectoriel convertissant le modèle HTML/CSS flexbox en graphiques vectoriels SVG purs et exports Retina 2K pour le studio de création de visuels et de déclarations citoyennes (`studio.html`).

```text
Mozilla Public License Version 2.0
==================================

1. Definitions
--------------
...
Full license text available at: https://www.mozilla.org/en-US/MPL/2.0/
and https://github.com/vercel/satori/blob/main/LICENSE
```

---

## 3. Ressources et services tiers

- **Website Carbon Badge :** Copyright © Wholegrain Digital — Licence GNU GPLv3 / MIT (calcul d'empreinte carbone).
  - *Intégrité des sous-ressources (SRI) :* Chargé dynamiquement depuis `unpkg.com` avec contrôle cryptographique `integrity="sha384-5Sivu2UajgUNg6Sxu3UHsZKjZlq9v6/slTAhA0/s21XcfNcrkSZRRO9K/0Cg14iP" crossorigin="anonymous"`.
  - *Non auto-hébergement :* Ce script n'est pas distribué localement dans `assets/` ni pré-mis en cache dans le Service Worker en raison de la clause copyleft de la GPL-3.0, incompatible avec la licence CC BY-NC-ND 4.0 du site.
- **Umami Analytics :** Licence MIT (mesure d'audience sans traceurs publicitaires ni collecte de données personnelles nominatives).
- **Google Traduction :** Outil de traduction automatique fourni par Google à titre d'accessibilité internationale multilingue. Seul le texte original français fait foi juridique.
- **Cal.com :** Plateforme de prise de rendez-vous avec la presse (conditions d'utilisation : [cal.com/terms](https://cal.com/terms)).
- **Meta Platforms (Plugin Page Facebook) :** Flux d'actualités et publications en direct de la page officielle (politique : [facebook.com/privacy/policy](https://www.facebook.com/privacy/policy/)).
- **Google LLC (YouTube No-Cookie) :** Diffusion vidéo et archives citoyennes via le domaine à confidentialité renforcée `youtube-nocookie.com` (politique : [policies.google.com/privacy](https://policies.google.com/privacy)).
- **ImageKit (ik.imagekit.io) :** Réseau de diffusion de contenu média (CDN) et moteur d'optimisation en temps réel pour photographies de terrain et médias ([imagekit.io](https://imagekit.io)).
- **Commission de Coopération Environnementale (CCE / cec.org) :** Consultation en direct des données et pièces officielles du registre public SEM-26-003 ([cec.org](https://www.cec.org)).
- **uMap / OpenStreetMap Suisse (umap.osm.ch) :** Service libre de cartographie vectorielle et interactive basé sur les données ouvertes OpenStreetMap.
- **OpenStreetMap :** © Les contributeurs d'OpenStreetMap (données sous licence Open Database License - ODbL).

---

## 4. Marques et médias cités
Les logotypes de presse (*La Presse*, *Le Devoir*, *CBC/Radio-Canada*, *TVBL*, *Curium*, *The Rover*, *Les As de l'info*) sont utilisés à des fins d'information et de citation documentaire. Ils restent la propriété intégrale de leurs détenteurs respectifs.
