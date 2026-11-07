#!/usr/bin/env python3
"""
Générateur de la Politique de Traduction et de Primauté du Français
(politique-traduction.html, en/politique-traduction.html, es/politique-traduction.html)
"""
import re

def create_fr_page():
    with open("deontologie.html", "r", encoding="utf-8") as f:
        html = f.read()

    # Meta tags
    html = html.replace("<title>Charte de Déontologie de l'Information — William Guindon</title>",
                        "<title>Politique de Traduction & Primauté du Français — William Guindon</title>")
    html = html.replace('<meta name="description" content="Charte de déontologie de l\'information, rigueur documentaire et règles professionnelles applicables aux journalistes et médias couvrant williamguindon.me">',
                        '<meta name="description" content="Politique linguistique officielle : primauté juridique exclusive de la langue française, nature des traductions automatisées et clause de non-responsabilité de bonne foi.">')
    html = html.replace('<link rel="canonical" href="https://williamguindon.me/deontologie.html">',
                        '<link rel="canonical" href="https://williamguindon.me/politique-traduction.html">\n<link rel="alternate" hreflang="en" href="https://williamguindon.me/en/politique-traduction.html">\n<link rel="alternate" hreflang="es" href="https://williamguindon.me/es/politique-traduction.html">')
    html = html.replace('<link rel="alternate" hreflang="fr-CA" href="https://williamguindon.me/deontologie.html">',
                        '<link rel="alternate" hreflang="fr-CA" href="https://williamguindon.me/politique-traduction.html">')
    html = html.replace('<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/deontologie.html">',
                        '<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/politique-traduction.html">')
    html = html.replace("Charte de Déontologie de l'Information & Règles pour les Médias — William Guindon",
                        "Politique de Traduction Automatisée & Primauté du Français — William Guindon")
    html = html.replace('href="https://williamguindon.me/deontologie.html"',
                        'href="https://williamguindon.me/politique-traduction.html"')

    # Lang switcher
    html = html.replace('href="/deontologie"', 'href="/politique-traduction"')
    html = html.replace('href="/en/deontologie"', 'href="/en/politique-traduction"')
    html = html.replace('href="/es/deontologie"', 'href="/es/politique-traduction"')

    # Hero & Content
    hero_pattern = r'<main id="main-content">.*?(?=      <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid var\(--line\);)'
    
    fr_body = """<main id="main-content">
  <section class="hero">
    <div class="wrap">
      <span class="kicker">Cadre légal, primauté linguistique &amp; clause de non-responsabilité</span>
      <h1>Politique de Traduction Automatisée, Primauté du Français &amp; Clause de Non-Responsabilité</h1>
      <p>Cadre formel régissant les versions multilingues du site, la primauté juridique exclusive du français et la décharge de responsabilité relative aux traductions automatisées</p>
    </div>
  </section>

  <section>
    <div class="wrap legal-wrap">
      <div class="legal-toolbar" role="toolbar" aria-label="Actions du document légal">
        <div class="legal-toolbar-label">
          <span class="legal-toolbar-kicker">Document officiel</span>
          <span>Statut : Publique (site) — politique linguistique et décharge de traduction · Version 1.0 — Novembre 2026</span>
        </div>
        <button class="legal-print-button" type="button" aria-label="Imprimer ce document">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path><path d="M18 12h.01"></path></svg>
          <span>Imprimer</span>
        </button>
      </div>

      <div class="legal-callout">
        <h3 class="legal-callout-title">Clarification fondamentale : Cadre d'expression citoyenne et bonne foi</h3>
        <p class="legal-callout-desc">
          <strong>Le français est la langue de travail et d'expression de William Guindon.</strong> Citoyen mineur québécois de 15 ans et auteur de la communication internationale <strong>SEM-26-003</strong> déposée auprès de la Commission de coopération environnementale (CCE / ACEUM), William Guindon publie ce registre documentaire public en français.<br><br>
          Afin de favoriser la transparence transfrontalière dans l'espace nord-américain trilatéral (Canada, États-Unis, Mexique), des versions en langues anglaise et espagnole sont mises à disposition. La présente politique en définit la portée légale, les limites et les conditions d'utilisation.
        </p>
      </div>

      <h2>1. Primauté absolue de la langue française (« Le français fait foi »)</h2>
      <p>La langue française constitue la <strong>seule et unique langue officielle et originale</strong> de l'ensemble des mémoires, pièces probatoires, requêtes juridiques, chartes éthiques, correspondances, communiqués et articles rédigés ou publiés par William Guindon.</p>
      <p>En conséquence :</p>
      <ul>
        <li><strong>Seule la version originale française fait foi</strong> dans tous les contextes juridiques, administratifs, procéduraux, probatoires ou médiatiques.</li>
        <li>En cas de divergence, d'ambiguïté, de nuance sémantique, de contresens ou de contradiction entre la version française et toute version traduite (anglaise, espagnole ou autre), <strong>la version française originale prévaut sans exception</strong>.</li>
        <li>Aucune déduction juridique, interprétation probatoire ou citation formelle ne peut être opposée à l'auteur ou au site sur la base d'un libellé extrait d'une version traduite.</li>
      </ul>

      <h2>2. Nature automatisée des traductions en anglais et en espagnol</h2>
      <p>Les versions du site disponibles sous les préfixes linguistiques <code>/en/</code> (anglais) et <code>/es/</code> (espagnol) sont générées par des <strong>outils et procédés de traduction automatisée</strong>. Elles ne constituent en aucun cas des traductions certifiées conformes, assermentées ou révisées par des traducteurs professionnels agréés.</p>

      <h2>3. Limite des capacités langagières de l'auteur et absence de vérification certifiée</h2>
      <p>William Guindon agit en tant que citoyen mineur individuel, chercheur citoyen et militant indépendant. <strong>Il ne possède pas les compétences linguistiques bilingues ou trilingues certifiées</strong>, ni les qualifications professionnelles requises pour vérifier, valider exhaustivement ou garantir l'exactitude terminologique de l'ensemble des milliers de pages et documents traduits en anglais et en espagnol.</p>
      <p>Par conséquent, aucun contrôle humain certifié n'est garanti sur l'exhaustivité des textes étrangers diffusés sur le site.</p>

      <h2>4. Démarche de stricte bonne foi et accessibilité internationale</h2>
      <p>La mise à disposition des versions en anglais et en espagnol est effectuée <strong>strictement de bonne foi</strong>, dans l'unique but de faciliter l'information des citoyens, universitaires, journalistes et observateurs internationaux intéressés par la protection de la Grande Tourbière de Blainville et la procédure CCE SEM-26-003.</p>

      <h2>5. Avertissement sur les erreurs, contresens et défauts d'affichage (Décharge de responsabilité)</h2>
      <p>L'utilisateur reconnaît et accepte expressément que les versions traduites peuvent comporter :</p>
      <ul>
        <li>Des approximations ou inexactitudes de traduction de termes juridiques, environnementaux ou scientifiques ;</li>
        <li>Des contresens involontaires issus du traitement automatisé ;</li>
        <li>Des anomalies de mise en page ou des défauts d'affichage ponctuels.</li>
      </ul>
      <p>William Guindon et les contributeurs du site déclinent toute responsabilité directe ou indirecte quant aux conséquences, interprétations erronées ou décisions prises sur la base de ces traductions automatisées. Pour toute utilisation probatoire ou publication journalistique, les usagers sont tenus de consulter la version originale française ou les actes officiels du Secrétariat de la CCE.</p>

      <h2>6. Mention sur les actes et politiques signés (« Original signé »)</h2>
      <p>L'ensemble des politiques, chartes éthiques, déclarations d'indépendance et communiqués du site ont été formellement signés par William Guindon sur leurs instruments originaux en langue française.</p>
      <p>Sur toutes les versions traduites en langues étrangères (anglais et espagnol), la mention administrative officielle <strong>« Original signed »</strong> (en anglais) ou <strong>« Original firmado »</strong> (en espagnol) atteste de l'existence de la signature manuscrite sur l'acte original, sans exiger ni constituer une signature réitérée distincte dans la langue traduite.</p>

      <h2>7. Signalement d'anomalies et collaboration loyale</h2>
      <p>Les lecteurs constatant une erreur manifeste de traduction ou un problème d'affichage sur les versions en langues étrangères sont invités à nous en faire part de manière bienveillante à l'adresse de contact officielle : <strong>contact@williamguindon.me</strong>.</p>

      <div class="signature-block">
        <div class="signature-draw-box">
          <svg class="signature-svg-animated" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 338" width="190" height="107" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img">
            <g transform="translate(0,338) scale(0.1,-0.1)" fill="currentColor" stroke="none">
              <path d="M2804 3359 c-16 -26 34 -75 186 -184 150 -107 400 -298 396 -303 -3 -2 -61 1 -128 7 -68 7 -211 18 -319 25 l-196 12 -154 86 c-315 176 -514 249 -557 206 -35 -35 1 -72 188 -194 l135 -89 -210 -6 c-312 -10 -753 -57 -1215 -130 -500 -79 -828 -199 -895 -330 -68 -131 63 -272 585 -630 107 -73 278 -191 380 -261 102 -70 277 -190 390 -267 113 -77 273 -187 355 -245 83 -58 315 -217 516 -355 201 -137 434 -299 517 -360 304 -223 478 -331 535 -331 83 0 66 76 -59 271 -247 384 -323 487 -457 621 -48 48 -82 88 -74 88 29 0 404 -249 602 -400 111 -85 297 -212 382 -264 18 -10 53 11 53 32 0 9 -102 118 -227 240 -146 143 -214 216 -188 201 49 -28 371 -243 560 -375 266 -185 383 -247 424 -225 38 21 21 86 -50 185 -26 35 -185 210 -401 441 -31 33 -55 62 -52 64 6 6 274 -158 399 -244 554 -383 748 -505 798 -505 84 1 64 93 -57 253 -73 98 -347 376 -466 474 -140 114 -192 156 -246 195 -28 21 -90 78 -137 129 -47 50 -91 88 -96 84 -18 -10 -13 -37 12 -63 21 -23 18 -23 -41 7 -72 36 -210 91 -229 91 -21 0 -27 -48 -9 -75 42 -64 163 -172 526 -471 379 -312 402 -328 438 -292 25 25 9 54 -90 162 -56 61 -120 131 -142 155 l-41 45 60 -51 c187 -159 488 -504 462 -529 -5 -5 -397 254 -575 380 -235 167 -486 314 -607 356 -57 20 -95 12 -95 -18 0 -29 23 -57 241 -292 236 -254 332 -371 317 -385 -5 -5 -198 122 -393 259 -309 217 -578 387 -673 423 -51 19 -75 11 -80 -29 -2 -19 16 -41 95 -113 54 -49 130 -121 168 -159 l70 -70 -80 61 c-249 188 -651 424 -747 439 -31 5 -38 3 -48 -17 -12 -21 -3 -32 158 -188 207 -202 296 -310 419 -511 22 -36 64 -105 95 -155 57 -94 84 -155 68 -155 -15 0 -269 167 -430 283 -142 101 -372 257 -695 470 -88 58 -236 159 -330 224 -266 186 -539 379 -670 473 -66 47 -248 173 -405 280 -157 106 -331 227 -388 267 -126 91 -267 223 -293 275 l-20 39 22 39 c64 114 375 223 854 300 532 85 896 125 1267 136 l218 7 62 -39 c116 -71 452 -306 578 -404 218 -169 311 -248 480 -405 227 -211 246 -233 130 -151 -484 341 -679 437 -680 335 0 -21 82 -104 255 -259 77 -68 169 -152 205 -186 161 -152 233 -212 248 -207 11 5 5 15 -26 42 -22 20 -166 152 -320 294 -245 225 -307 287 -286 287 14 0 118 -59 189 -108 323 -224 604 -431 795 -586 103 -83 105 -84 124 -66 14 14 17 24 10 38 -12 25 -546 545 -709 691 -258 231 -534 445 -866 673 l-54 38 55 0 c30 0 72 -4 93 -9 68 -16 485 -274 997 -617 368 -245 506 -324 571 -324 64 0 76 45 33 126 -70 131 -356 437 -612 653 -171 145 -148 148 51 8 56 -40 174 -120 262 -177 281 -183 396 -229 445 -180 19 19 21 30 17 68 -5 50 -54 126 -184 289 -40 51 -73 94 -73 97 0 5 34 11 112 20 46 5 47 5 165 -86 657 -510 697 -538 769 -538 44 0 57 20 52 80 l-5 49 87 -92 c189 -200 501 -564 572 -667 l17 -25 0 42 c1 39 -7 52 -86 150 -117 146 -324 381 -522 593 -90 96 -183 198 -207 225 -23 28 -96 113 -162 190 -197 231 -545 552 -590 543 -8 -2 -20 -11 -26 -21 -9 -15 4 -33 99 -124 400 -388 509 -500 584 -599 76 -103 141 -209 141 -233 0 -9 -5 -9 -21 0 -22 11 -609 451 -664 497 l-30 25 68 -7 c56 -6 68 -5 73 8 13 35 -14 46 -115 46 l-97 0 -109 81 c-245 182 -489 331 -571 349 -44 10 -72 -9 -59 -38 6 -11 95 -107 198 -214 l189 -193 -128 -3 c-70 -1 -171 1 -223 6 l-96 9 -280 185 c-154 101 -320 210 -370 241 -88 55 -169 84 -181 66z m1176 -252 c144 -96 329 -230 330 -239 0 -5 -35 -8 -78 -8 l-77 0 -175 176 c-188 189 -188 196 0 71z m-1739 2 c41 -17 139 -65 219 -108 l144 -76 -63 -3 -64 -3 -154 102 c-138 92 -174 119 -160 119 3 0 38 -14 78 -31z m1258 -235 c14 -12 -19 -1 -35 12 -18 14 -18 14 6 3 14 -6 27 -13 29 -15z m-414 -43 c61 -6 172 -13 249 -17 l138 -7 121 -101 c156 -130 385 -352 499 -485 88 -101 158 -199 158 -221 0 -25 -149 63 -545 325 -240 158 -620 396 -757 474 -32 18 -58 34 -58 37 0 7 76 5 195 -5z m1155 -172 c106 -141 175 -252 160 -257 -16 -6 -117 44 -225 110 -102 63 -392 253 -410 269 -5 6 70 8 185 7 l195 -3 95 -126z m-108 -1583 c68 -44 206 -191 263 -280 19 -28 -389 286 -490 379 l-50 46 112 -56 c62 -30 136 -70 165 -89z"/>
              <path d="M4324 2742 c-6 -4 -13 -15 -17 -24 -7 -21 12 -37 313 -258 229 -168 574 -439 845 -665 262 -218 501 -405 519 -405 4 0 6 19 4 42 -3 41 -7 46 -114 133 -61 49 -192 158 -290 241 -347 292 -687 559 -1007 792 -198 145 -228 161 -253 144z"/>
            </g>
          </svg>
          <div class="signature-pen-spark" aria-hidden="true"></div>
        </div>
        <span class="signature-caption">William Guindon · Auteur &amp; Déclarant</span>
      </div>\n"""
    
    html = re.sub(hero_pattern, fr_body, html, flags=re.DOTALL)
    
    with open("politique-traduction.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("politique-traduction.html created.")


def create_en_page():
    with open("en/deontologie.html", "r", encoding="utf-8") as f:
        html = f.read()

    # Meta tags
    html = html.replace("<title>Code of Information Ethics — William Guindon</title>",
                        "<title>Automated Translation Policy & Primacy of French — William Guindon</title>")
    html = html.replace('<meta name="description" content="Information ethics charter, documentary rigor and professional rules applicable to journalists and media covering williamguindon.me">',
                        '<meta name="description" content="Official linguistic policy: exclusive legal primacy of the French language, automated machine translation framework and good-faith disclaimer.">')
    html = html.replace('<link rel="canonical" href="https://williamguindon.me/en/deontologie.html">',
                        '<link rel="canonical" href="https://williamguindon.me/en/politique-traduction.html">\n<link rel="alternate" hreflang="fr-CA" href="https://williamguindon.me/politique-traduction.html">\n<link rel="alternate" hreflang="es" href="https://williamguindon.me/es/politique-traduction.html">')
    html = html.replace('<link rel="alternate" hreflang="en" href="https://williamguindon.me/en/deontologie.html">',
                        '<link rel="alternate" hreflang="en" href="https://williamguindon.me/en/politique-traduction.html">')
    html = html.replace('<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/deontologie.html">',
                        '<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/politique-traduction.html">')
    html = html.replace('href="https://williamguindon.me/en/deontologie.html"',
                        'href="https://williamguindon.me/en/politique-traduction.html"')

    # Lang switcher
    html = html.replace('href="/deontologie"', 'href="/politique-traduction"')
    html = html.replace('href="/en/deontologie"', 'href="/en/politique-traduction"')
    html = html.replace('href="/es/deontologie"', 'href="/es/politique-traduction"')

    # Hero & Content
    hero_pattern = r'<main id="main-content">.*?(?=      <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid var\(--line\);)'
    
    en_body = """<main id="main-content">
  <section class="hero">
    <div class="wrap">
      <span class="kicker">Legal framework, linguistic primacy &amp; translation disclaimer</span>
      <h1>Automated Translation Policy, Primacy of the French Language &amp; Disclaimer</h1>
      <p>Formal framework governing multilingual site versions, the exclusive legal primacy of French, and machine translation liability disclaimers</p>
    </div>
  </section>

  <section>
    <div class="wrap legal-wrap">
      <div class="legal-toolbar" role="toolbar" aria-label="Actions du document légal">
        <div class="legal-toolbar-label">
          <span class="legal-toolbar-kicker">Official document</span>
          <span>Status: Public (site) — linguistic policy and translation disclaimer · Version 1.0 — November 2026</span>
        </div>
        <button class="legal-print-button" type="button" aria-label="Print this document">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path><path d="M18 12h.01"></path></svg>
          <span>Print</span>
        </button>
      </div>

      <div class="legal-callout">
        <h3 class="legal-callout-title">Fundamental Clarification: Citizen Initiative and Good-Faith Disclosure</h3>
        <p class="legal-callout-desc">
          <strong>French is the sole working and expression language of William Guindon.</strong> As a 15-year-old minor citizen of Quebec and author of international citizen submission <strong>SEM-26-003</strong> filed with the Commission for Environmental Cooperation (CEC / CUSMA), William Guindon produces and publishes this public documentary register in French.<br><br>
          In order to foster cross-border transparency within the trinational North American framework (Canada, United States, Mexico), English and Spanish versions are provided. This policy sets out their legal scope, inherent limitations, and terms of use.
        </p>
      </div>

      <h2>1. Absolute Primacy of the French Language (“Le français fait foi”)</h2>
      <p>The French language constitutes the <strong>sole official, authoritative and original language</strong> of all legal briefs, evidence exhibits, formal requests, ethical charters, correspondences, press releases, and publications authored or released by William Guindon.</p>
      <p>Accordingly:</p>
      <ul>
        <li><strong>The original French version alone is authoritative and legally binding</strong> across all legal, administrative, procedural, evidential, and journalistic contexts.</li>
        <li>In the event of any discrepancy, ambiguity, nuance divergence, mistranslation, or conflict between the original French text and any translated version (English, Spanish, or other), <strong>the original French version shall prevail without exception</strong>.</li>
        <li>No legal deduction, evidential interpretation, or formal citation may be asserted against the author or this site based on terminology extracted from an automated translation.</li>
      </ul>

      <h2>2. Automated Nature of English and Spanish Translations</h2>
      <p>Versions of this site available under the language path prefixes <code>/en/</code> (English) and <code>/es/</code> (Spanish) are generated via <strong>automated machine translation processes</strong>. They do not constitute certified, sworn, or professionally reviewed translations.</p>

      <h2>3. Limitations of Linguistic Capacity and Absence of Certified Human Review</h2>
      <p>William Guindon acts as an individual minor citizen, independent researcher, and activist. <strong>He does not possess certified bilingual or trilingual qualifications</strong>, nor the professional legal translation expertise necessary to comprehensively review, audit, or certify the semantic accuracy of thousands of translated pages in English and Spanish.</p>
      <p>Consequently, no certified human audit is guaranteed across the translated foreign language corpus.</p>

      <h2>4. Good-Faith International Accessibility</h2>
      <p>The publication of English and Spanish translations is undertaken <strong>strictly in good faith</strong>, with the sole objective of facilitating public access for citizens, academics, journalists, and international observers following the protection of the Grande Tourbière of Blainville and the CEC SEM-26-003 proceeding.</p>

      <h2>5. Notice Regarding Inaccuracies, Display Glitches &amp; Liability Disclaimer</h2>
      <p>Users expressly acknowledge and agree that machine translations may contain:</p>
      <ul>
        <li>Approximations or inaccuracies in technical, legal, or environmental terminology;</li>
        <li>Inadvertent distortions or mistranslations resulting from algorithmic processing;</li>
        <li>Occasional layout defects or display anomalies.</li>
      </ul>
      <p>William Guindon and site contributors disclaim all liability, direct or indirect, for any consequences, misinterpretations, or decisions arising from reliance on automated translations. For any evidential or journalistic use, users must consult the original French version or official CEC Secretariat records.</p>

      <h2>6. Administrative Notice on Signed Instruments (“Original signed”)</h2>
      <p>All ethical charters, integrity policies, declarations of independence, and official press releases published on this site were formally executed and signed by William Guindon on their original French instruments.</p>
      <p>On all translated foreign language pages (English and Spanish), the official administrative mention <strong>“Original signed”</strong> (in English) or <strong>“Original firmado”</strong> (in Spanish) certifies the legal existence and validity of the signed original instrument, without requiring or purporting to represent a separate handwritten signature in the translated language.</p>

      <h2>7. Reporting Translation Inaccuracies</h2>
      <p>Readers noting a material mistranslation or display glitch in foreign language versions are kindly invited to notify us in good faith at our official contact address: <strong>contact@williamguindon.me</strong>.</p>

      <div class="signature-block">
        <div class="signature-draw-box">
          <svg class="signature-svg-animated" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 338" width="190" height="107" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img">
            <g transform="translate(0,338) scale(0.1,-0.1)" fill="currentColor" stroke="none">
              <path d="M2804 3359 c-16 -26 34 -75 186 -184 150 -107 400 -298 396 -303 -3 -2 -61 1 -128 7 -68 7 -211 18 -319 25 l-196 12 -154 86 c-315 176 -514 249 -557 206 -35 -35 1 -72 188 -194 l135 -89 -210 -6 c-312 -10 -753 -57 -1215 -130 -500 -79 -828 -199 -895 -330 -68 -131 63 -272 585 -630 107 -73 278 -191 380 -261 102 -70 277 -190 390 -267 113 -77 273 -187 355 -245 83 -58 315 -217 516 -355 201 -137 434 -299 517 -360 304 -223 478 -331 535 -331 83 0 66 76 -59 271 -247 384 -323 487 -457 621 -48 48 -82 88 -74 88 29 0 404 -249 602 -400 111 -85 297 -212 382 -264 18 -10 53 11 53 32 0 9 -102 118 -227 240 -146 143 -214 216 -188 201 49 -28 371 -243 560 -375 266 -185 383 -247 424 -225 38 21 21 86 -50 185 -26 35 -185 210 -401 441 -31 33 -55 62 -52 64 6 6 274 -158 399 -244 554 -383 748 -505 798 -505 84 1 64 93 -57 253 -73 98 -347 376 -466 474 -140 114 -192 156 -246 195 -28 21 -90 78 -137 129 -47 50 -91 88 -96 84 -18 -10 -13 -37 12 -63 21 -23 18 -23 -41 7 -72 36 -210 91 -229 91 -21 0 -27 -48 -9 -75 42 -64 163 -172 526 -471 379 -312 402 -328 438 -292 25 25 9 54 -90 162 -56 61 -120 131 -142 155 l-41 45 60 -51 c187 -159 488 -504 462 -529 -5 -5 -397 254 -575 380 -235 167 -486 314 -607 356 -57 20 -95 12 -95 -18 0 -29 23 -57 241 -292 236 -254 332 -371 317 -385 -5 -5 -198 122 -393 259 -309 217 -578 387 -673 423 -51 19 -75 11 -80 -29 -2 -19 16 -41 95 -113 54 -49 130 -121 168 -159 l70 -70 -80 61 c-249 188 -651 424 -747 439 -31 5 -38 3 -48 -17 -12 -21 -3 -32 158 -188 207 -202 296 -310 419 -511 22 -36 64 -105 95 -155 57 -94 84 -155 68 -155 -15 0 -269 167 -430 283 -142 101 -372 257 -695 470 -88 58 -236 159 -330 224 -266 186 -539 379 -670 473 -66 47 -248 173 -405 280 -157 106 -331 227 -388 267 -126 91 -267 223 -293 275 l-20 39 22 39 c64 114 375 223 854 300 532 85 896 125 1267 136 l218 7 62 -39 c116 -71 452 -306 578 -404 218 -169 311 -248 480 -405 227 -211 246 -233 130 -151 -484 341 -679 437 -680 335 0 -21 82 -104 255 -259 77 -68 169 -152 205 -186 161 -152 233 -212 248 -207 11 5 5 15 -26 42 -22 20 -166 152 -320 294 -245 225 -307 287 -286 287 14 0 118 -59 189 -108 323 -224 604 -431 795 -586 103 -83 105 -84 124 -66 14 14 17 24 10 38 -12 25 -546 545 -709 691 -258 231 -534 445 -866 673 l-54 38 55 0 c30 0 72 -4 93 -9 68 -16 485 -274 997 -617 368 -245 506 -324 571 -324 64 0 76 45 33 126 -70 131 -356 437 -612 653 -171 145 -148 148 51 8 56 -40 174 -120 262 -177 281 -183 396 -229 445 -180 19 19 21 30 17 68 -5 50 -54 126 -184 289 -40 51 -73 94 -73 97 0 5 34 11 112 20 46 5 47 5 165 -86 657 -510 697 -538 769 -538 44 0 57 20 52 80 l-5 49 87 -92 c189 -200 501 -564 572 -667 l17 -25 0 42 c1 39 -7 52 -86 150 -117 146 -324 381 -522 593 -90 96 -183 198 -207 225 -23 28 -96 113 -162 190 -197 231 -545 552 -590 543 -8 -2 -20 -11 -26 -21 -9 -15 4 -33 99 -124 400 -388 509 -500 584 -599 76 -103 141 -209 141 -233 0 -9 -5 -9 -21 0 -22 11 -609 451 -664 497 l-30 25 68 -7 c56 -6 68 -5 73 8 13 35 -14 46 -115 46 l-97 0 -109 81 c-245 182 -489 331 -571 349 -44 10 -72 -9 -59 -38 6 -11 95 -107 198 -214 l189 -193 -128 -3 c-70 -1 -171 1 -223 6 l-96 9 -280 185 c-154 101 -320 210 -370 241 -88 55 -169 84 -181 66z m1176 -252 c144 -96 329 -230 330 -239 0 -5 -35 -8 -78 -8 l-77 0 -175 176 c-188 189 -188 196 0 71z m-1739 2 c41 -17 139 -65 219 -108 l144 -76 -63 -3 -64 -3 -154 102 c-138 92 -174 119 -160 119 3 0 38 -14 78 -31z m1258 -235 c14 -12 -19 -1 -35 12 -18 14 -18 14 6 3 14 -6 27 -13 29 -15z m-414 -43 c61 -6 172 -13 249 -17 l138 -7 121 -101 c156 -130 385 -352 499 -485 88 -101 158 -199 158 -221 0 -25 -149 63 -545 325 -240 158 -620 396 -757 474 -32 18 -58 34 -58 37 0 7 76 5 195 -5z m1155 -172 c106 -141 175 -252 160 -257 -16 -6 -117 44 -225 110 -102 63 -392 253 -410 269 -5 6 70 8 185 7 l195 -3 95 -126z m-108 -1583 c68 -44 206 -191 263 -280 19 -28 -389 286 -490 379 l-50 46 112 -56 c62 -30 136 -70 165 -89z"/>
              <path d="M4324 2742 c-6 -4 -13 -15 -17 -24 -7 -21 12 -37 313 -258 229 -168 574 -439 845 -665 262 -218 501 -405 519 -405 4 0 6 19 4 42 -3 41 -7 46 -114 133 -61 49 -192 158 -290 241 -347 292 -687 559 -1007 792 -198 145 -228 161 -253 144z"/>
            </g>
          </svg>
          <div class="signature-pen-spark" aria-hidden="true"></div>
        </div>
        <span class="signature-caption">Original signed</span>
      </div>\n"""
    
    html = re.sub(hero_pattern, en_body, html, flags=re.DOTALL)
    
    with open("en/politique-traduction.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("en/politique-traduction.html created.")


def create_es_page():
    with open("es/deontologie.html", "r", encoding="utf-8") as f:
        html = f.read()

    # Meta tags
    html = html.replace("<title>Código de Deontología de la Información — William Guindon</title>",
                        "<title>Política de Traducción Automatizada y Primacía del Francés — William Guindon</title>")
    html = html.replace('<meta name="description" content="Carta de deontología de la información, rigor documental y normas profesionales aplicables a periodistas y medios que cubren williamguindon.me">',
                        '<meta name="description" content="Política lingüística oficial: primacía legal exclusiva de la lengua francesa, marco de traducción automatizada y descargo de buena fe.">')
    html = html.replace('<link rel="canonical" href="https://williamguindon.me/es/deontologie.html">',
                        '<link rel="canonical" href="https://williamguindon.me/es/politique-traduction.html">\n<link rel="alternate" hreflang="fr-CA" href="https://williamguindon.me/politique-traduction.html">\n<link rel="alternate" hreflang="en" href="https://williamguindon.me/en/politique-traduction.html">')
    html = html.replace('<link rel="alternate" hreflang="es" href="https://williamguindon.me/es/deontologie.html">',
                        '<link rel="alternate" hreflang="es" href="https://williamguindon.me/es/politique-traduction.html">')
    html = html.replace('<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/deontologie.html">',
                        '<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/politique-traduction.html">')
    html = html.replace('href="https://williamguindon.me/es/deontologie.html"',
                        'href="https://williamguindon.me/es/politique-traduction.html"')

    # Lang switcher
    html = html.replace('href="/deontologie"', 'href="/politique-traduction"')
    html = html.replace('href="/en/deontologie"', 'href="/en/politique-traduction"')
    html = html.replace('href="/es/deontologie"', 'href="/es/politique-traduction"')

    # Hero & Content
    hero_pattern = r'<main id="main-content">.*?(?=      <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid var\(--line\);)'
    
    es_body = """<main id="main-content">
  <section class="hero">
    <div class="wrap">
      <span class="kicker">Marco legal, primacía lingüística y descargo de responsabilidad</span>
      <h1>Política de Traducción Automatizada, Primacía de la Lengua Francesa y Descargo de Responsabilidad</h1>
      <p>Marco formal que rige las versiones multilingües del sitio, la primacía legal exclusiva del francés y el descargo de responsabilidad relativo a las traducciones automáticas</p>
    </div>
  </section>

  <section>
    <div class="wrap legal-wrap">
      <div class="legal-toolbar" role="toolbar" aria-label="Acciones del documento legal">
        <div class="legal-toolbar-label">
          <span class="legal-toolbar-kicker">Documento oficial</span>
          <span>Estado: Público (sitio) — política lingüística y descargo de traducción · Versión 1.0 — Noviembre 2026</span>
        </div>
        <button class="legal-print-button" type="button" aria-label="Imprimir este documento">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path><path d="M18 12h.01"></path></svg>
          <span>Imprimir</span>
        </button>
      </div>

      <div class="legal-callout">
        <h3 class="legal-callout-title">Aclaración fundamental: Marco ciudadano y divulgación de buena fe</h3>
        <p class="legal-callout-desc">
          <strong>El francés es el único idioma de trabajo y expresión de William Guindon.</strong> Como ciudadano menor de edad de Quebec (15 años) y autor de la petición ciudadana internacional <strong>SEM-26-003</strong> presentada ante la Comisión para la Cooperación Ambiental (CCA / T-MEC), William Guindon elabora y publica este registro documental público en francés.<br><br>
          Con el fin de fomentar la transparencia transfronteriza en el espacio trinacional de América del Norte (Canadá, Estados Unidos, México), se ofrecen versiones en inglés y español. Esta política define su alcance legal, límites y condiciones de uso.
        </p>
      </div>

      <h2>1. Primacía absoluta de la lengua francesa (« El francés da fe »)</h2>
      <p>La lengua francesa constituye el <strong>único idioma oficial, original y auténtico</strong> de todos los alegatos, pruebas documentales, peticiones formales, cartas de ética, correspondencias, comunicados de prensa y publicaciones redactadas o publicadas por William Guindon.</p>
      <p>Por lo tanto:</p>
      <ul>
        <li><strong>Únicamente la versión original en francés da fe legalmente</strong> en todos los contextos jurídicos, administrativos, procesales, probatorios y periodísticos.</li>
        <li>En caso de discrepancia, ambigüedad, matiz de significado, error de traducción o contradicción entre la versión francesa original y cualquier versión traducida (inglés, español u otra), <strong>la versión original en francés prevalecerá sin excepción</strong>.</li>
        <li>Ninguna deducción jurídica, interpretación probatoria o citación formal podrá oponerse al autor o a este sitio con base en textos extraídos de una traducción automática.</li>
      </ul>

      <h2>2. Naturaleza automatizada de las traducciones en inglés y español</h2>
      <p>Las versiones disponibles en el sitio bajo los prefijos de idioma <code>/en/</code> (inglés) y <code>/es/</code> (español) se generan mediante <strong>herramientas y procesos de traducción automatizada</strong>. En ningún caso constituyen traducciones certificadas, juradas o revisadas por traductores profesionales colegiados.</p>

      <h2>3. Límite de las capacidades lingüísticas del autor y ausencia de revisión certificada</h2>
      <p>William Guindon actúa como ciudadano menor de edad individual, investigador ciudadano y activista independiente. <strong>No posee títulos lingüísticos certificados bilingües o trilingües</strong>, ni las cualificaciones profesionales necesarias para revisar, auditar exhaustivamente o garantizar la precisión terminológica de miles de páginas y documentos traducidos al inglés y al español.</p>
      <p>Por consiguiente, no se garantiza ninguna revisión humana certificada sobre la totalidad del corpus traducido.</p>

      <h2>4. Publicación estrictamente de buena fe y accesibilidad internacional</h2>
      <p>La difusión de las versiones en inglés y español se lleva a cabo <strong>estrictamente de buena fe</strong>, con el único propósito de facilitar la información de ciudadanos, académicos, periodistas y observadores internacionales interesados en la protección de la Grande Tourbière de Blainville y el procedimiento CCA SEM-26-003.</p>

      <h2>5. Advertencia sobre imprecisiones, erratas y descargo de responsabilidad</h2>
      <p>El usuario reconoce y acepta expresamente que las versiones traducidas pueden contener:</p>
      <ul>
        <li>Aproximaciones o imprecisiones en la traducción de términos legales, ambientales o científicos;</li>
        <li>Contrasentidos involuntarios derivados del procesamiento algorítmico;</li>
        <li>Anomalías puntuales de formato o errores visuales de visualización.</li>
      </ul>
      <p>William Guindon y los colaboradores del sitio declinan toda responsabilidad directa o indirecta por las consecuencias, interpretaciones erróneas o decisiones adoptadas con base en estas traducciones automáticas. Para cualquier uso probatorio o cita de prensa formal, los usuarios deben consultar la versión original francesa o los expedientes oficiales del Secretariado de la CCA.</p>

      <h2>6. Mención administrativa en instrumentos firmados (« Original firmado »)</h2>
      <p>Todas las cartas de integridad, políticas éticas, declaraciones de independencia y comunicados de prensa han sido formalmente firmados por William Guindon en sus instrumentos originales en idioma francés.</p>
      <p>En todas las páginas traducidas a idiomas extranjeros (inglés y español), la mención administrativa oficial <strong>« Original signed »</strong> (en inglés) o <strong>« Original firmado »</strong> (en español) certifica la existencia legal y validez del instrumento original firmado, sin requerir ni pretender constituir una firma manuscrita separada en el idioma traducido.</p>

      <h2>7. Notificación de anomalías terminológicas</h2>
      <p>Se invita a los lectores que detecten un error material manifiesto o un problema de visualización en las versiones traducidas a notificarlo de buena fe a la dirección oficial de contacto: <strong>contact@williamguindon.me</strong>.</p>

      <div class="signature-block">
        <div class="signature-draw-box">
          <svg class="signature-svg-animated" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 338" width="190" height="107" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img">
            <g transform="translate(0,338) scale(0.1,-0.1)" fill="currentColor" stroke="none">
              <path d="M2804 3359 c-16 -26 34 -75 186 -184 150 -107 400 -298 396 -303 -3 -2 -61 1 -128 7 -68 7 -211 18 -319 25 l-196 12 -154 86 c-315 176 -514 249 -557 206 -35 -35 1 -72 188 -194 l135 -89 -210 -6 c-312 -10 -753 -57 -1215 -130 -500 -79 -828 -199 -895 -330 -68 -131 63 -272 585 -630 107 -73 278 -191 380 -261 102 -70 277 -190 390 -267 113 -77 273 -187 355 -245 83 -58 315 -217 516 -355 201 -137 434 -299 517 -360 304 -223 478 -331 535 -331 83 0 66 76 -59 271 -247 384 -323 487 -457 621 -48 48 -82 88 -74 88 29 0 404 -249 602 -400 111 -85 297 -212 382 -264 18 -10 53 11 53 32 0 9 -102 118 -227 240 -146 143 -214 216 -188 201 49 -28 371 -243 560 -375 266 -185 383 -247 424 -225 38 21 21 86 -50 185 -26 35 -185 210 -401 441 -31 33 -55 62 -52 64 6 6 274 -158 399 -244 554 -383 748 -505 798 -505 84 1 64 93 -57 253 -73 98 -347 376 -466 474 -140 114 -192 156 -246 195 -28 21 -90 78 -137 129 -47 50 -91 88 -96 84 -18 -10 -13 -37 12 -63 21 -23 18 -23 -41 7 -72 36 -210 91 -229 91 -21 0 -27 -48 -9 -75 42 -64 163 -172 526 -471 379 -312 402 -328 438 -292 25 25 9 54 -90 162 -56 61 -120 131 -142 155 l-41 45 60 -51 c187 -159 488 -504 462 -529 -5 -5 -397 254 -575 380 -235 167 -486 314 -607 356 -57 20 -95 12 -95 -18 0 -29 23 -57 241 -292 236 -254 332 -371 317 -385 -5 -5 -198 122 -393 259 -309 217 -578 387 -673 423 -51 19 -75 11 -80 -29 -2 -19 16 -41 95 -113 54 -49 130 -121 168 -159 l70 -70 -80 61 c-249 188 -651 424 -747 439 -31 5 -38 3 -48 -17 -12 -21 -3 -32 158 -188 207 -202 296 -310 419 -511 22 -36 64 -105 95 -155 57 -94 84 -155 68 -155 -15 0 -269 167 -430 283 -142 101 -372 257 -695 470 -88 58 -236 159 -330 224 -266 186 -539 379 -670 473 -66 47 -248 173 -405 280 -157 106 -331 227 -388 267 -126 91 -267 223 -293 275 l-20 39 22 39 c64 114 375 223 854 300 532 85 896 125 1267 136 l218 7 62 -39 c116 -71 452 -306 578 -404 218 -169 311 -248 480 -405 227 -211 246 -233 130 -151 -484 341 -679 437 -680 335 0 -21 82 -104 255 -259 77 -68 169 -152 205 -186 161 -152 233 -212 248 -207 11 5 5 15 -26 42 -22 20 -166 152 -320 294 -245 225 -307 287 -286 287 14 0 118 -59 189 -108 323 -224 604 -431 795 -586 103 -83 105 -84 124 -66 14 14 17 24 10 38 -12 25 -546 545 -709 691 -258 231 -534 445 -866 673 l-54 38 55 0 c30 0 72 -4 93 -9 68 -16 485 -274 997 -617 368 -245 506 -324 571 -324 64 0 76 45 33 126 -70 131 -356 437 -612 653 -171 145 -148 148 51 8 56 -40 174 -120 262 -177 281 -183 396 -229 445 -180 19 19 21 30 17 68 -5 50 -54 126 -184 289 -40 51 -73 94 -73 97 0 5 34 11 112 20 46 5 47 5 165 -86 657 -510 697 -538 769 -538 44 0 57 20 52 80 l-5 49 87 -92 c189 -200 501 -564 572 -667 l17 -25 0 42 c1 39 -7 52 -86 150 -117 146 -324 381 -522 593 -90 96 -183 198 -207 225 -23 28 -96 113 -162 190 -197 231 -545 552 -590 543 -8 -2 -20 -11 -26 -21 -9 -15 4 -33 99 -124 400 -388 509 -500 584 -599 76 -103 141 -209 141 -233 0 -9 -5 -9 -21 0 -22 11 -609 451 -664 497 l-30 25 68 -7 c56 -6 68 -5 73 8 13 35 -14 46 -115 46 l-97 0 -109 81 c-245 182 -489 331 -571 349 -44 10 -72 -9 -59 -38 6 -11 95 -107 198 -214 l189 -193 -128 -3 c-70 -1 -171 1 -223 6 l-96 9 -280 185 c-154 101 -320 210 -370 241 -88 55 -169 84 -181 66z m1176 -252 c144 -96 329 -230 330 -239 0 -5 -35 -8 -78 -8 l-77 0 -175 176 c-188 189 -188 196 0 71z m-1739 2 c41 -17 139 -65 219 -108 l144 -76 -63 -3 -64 -3 -154 102 c-138 92 -174 119 -160 119 3 0 38 -14 78 -31z m1258 -235 c14 -12 -19 -1 -35 12 -18 14 -18 14 6 3 14 -6 27 -13 29 -15z m-414 -43 c61 -6 172 -13 249 -17 l138 -7 121 -101 c156 -130 385 -352 499 -485 88 -101 158 -199 158 -221 0 -25 -149 63 -545 325 -240 158 -620 396 -757 474 -32 18 -58 34 -58 37 0 7 76 5 195 -5z m1155 -172 c106 -141 175 -252 160 -257 -16 -6 -117 44 -225 110 -102 63 -392 253 -410 269 -5 6 70 8 185 7 l195 -3 95 -126z m-108 -1583 c68 -44 206 -191 263 -280 19 -28 -389 286 -490 379 l-50 46 112 -56 c62 -30 136 -70 165 -89z"/>
              <path d="M4324 2742 c-6 -4 -13 -15 -17 -24 -7 -21 12 -37 313 -258 229 -168 574 -439 845 -665 262 -218 501 -405 519 -405 4 0 6 19 4 42 -3 41 -7 46 -114 133 -61 49 -192 158 -290 241 -347 292 -687 559 -1007 792 -198 145 -228 161 -253 144z"/>
            </g>
          </svg>
          <div class="signature-pen-spark" aria-hidden="true"></div>
        </div>
        <span class="signature-caption">Original firmado</span>
      </div>\n"""
    
    html = re.sub(hero_pattern, es_body, html, flags=re.DOTALL)
    
    with open("es/politique-traduction.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("es/politique-traduction.html created.")

if __name__ == "__main__":
    create_fr_page()
    create_en_page()
    create_es_page()
