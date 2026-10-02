/**
 * scripts/generate-countdown-svg.js
 * 
 * Générateur du compte à rebours vectoriel officiel pour l'échéance CCE SEM-26-003.
 * Produit countdown-live.svg avec architecture hybride :
 * 1. Vue directe & <iframe> : horloge JavaScript embarquée autonome calculant en temps réel
 *    le temps restant à la seconde près (jours, heures, minutes, secondes, total minutes).
 * 2. Balise <img> & Markdown : animation purement vectorielle et CSS par images-clés (@keyframes)
 *    cadencée selon la technique d'animation sans JavaScript inspirée du projet open source svgasm.
 * 
 * Remerciements chaleureux à Tom Kwok pour le projet svgasm :
 * https://github.com/tomkwok/svgasm (Licence Apache-2.0)
 */

const fs = require('fs');
const path = require('path');

function generateCountdownSvg() {
  // Date calendaire de l'échéance CCE SEM-26-003 (début de journée 00:00:00, pas fin de journée)
  const target = new Date('2026-10-16T00:00:00-04:00').getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  const totalMins = Math.floor(diff / (1000 * 60));
  const totalMinsFormatted = totalMins.toLocaleString('fr-CA');

  const pad = (n) => String(n).padStart(2, '0');

  // Génération des 60 règles d'animation CSS et frames textuelles selon la technique svgasm (Tom Kwok)
  // Permet le défilement cadencé des secondes en boucle de 60s sans aucun JavaScript (pour balises <img>)
  let cssKeyframeDelays = '';
  let cssSecsFrames = '';
  for (let i = 0; i < 60; i++) {
    const secVal = pad((secs - i + 60) % 60);
    cssKeyframeDelays += `    .sf-${i} { animation-delay: ${i}s; }\n`;
    cssSecsFrames += `      <text x="107" y="105" class="unit-num-sec sf-frame sf-${i}">${secVal}</text>\n`;
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" style="background:#02150e;font-family:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!--
    Compte à rebours officiel CCE / ACEUM SEM-26-003 — William Guindon
    Architecture hybride :
    - Mode interactif (vue directe / iframe) : horloge JavaScript temps réel synchronisée
    - Mode statique (balise <img> / Markdown) : animation vectorielle pure CSS cadencée
    Remerciements à Tom Kwok pour le projet open source svgasm :
    https://github.com/tomkwok/svgasm (Licence Apache-2.0)
  -->
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#02150e" />
      <stop offset="45%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="card-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.09)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.45)" />
    </linearGradient>
    <linearGradient id="sec-card-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(34,197,94,0.15)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)" />
    </linearGradient>
    <filter id="card-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <style>
    @keyframes pulse {
      0% { r: 5px; opacity: 1; }
      50% { r: 9px; opacity: 0.35; }
      100% { r: 5px; opacity: 1; }
    }
    .pulse-dot {
      animation: pulse 2s infinite ease-in-out;
      transform-origin: 132px 58px;
    }
    .unit-card {
      rx: 16px;
      fill: url(#card-grad);
      stroke: rgba(52, 211, 153, 0.35);
      stroke-width: 1.5;
    }
    .unit-card-sec {
      rx: 16px;
      fill: url(#sec-card-grad);
      stroke: rgba(52, 211, 153, 0.6);
      stroke-width: 2;
    }
    .unit-num {
      font-size: 72px;
      font-weight: 800;
      fill: #ffffff;
      text-anchor: middle;
      font-variant-numeric: tabular-nums;
    }
    .unit-num-sec {
      font-size: 72px;
      font-weight: 800;
      fill: #34d399;
      text-anchor: middle;
      font-variant-numeric: tabular-nums;
    }
    .unit-lbl {
      font-size: 15px;
      font-weight: 700;
      fill: #a7f3d0;
      text-anchor: middle;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    /* Animation d'images-clés CSS sans JavaScript inspirée de svgasm (Tom Kwok) */
    @keyframes svgasm-step {
      0% { opacity: 1; visibility: visible; }
      1.666% { opacity: 1; visibility: visible; }
      1.667% { opacity: 0; visibility: hidden; }
      100% { opacity: 0; visibility: hidden; }
    }
    .sf-frame {
      opacity: 0;
      visibility: hidden;
      animation: svgasm-step 60s infinite;
    }
    .sf-0 {
      opacity: 1;
      visibility: visible;
    }
${cssKeyframeDelays}  </style>

  <!-- Fond avec dégradé riche -->
  <rect width="1200" height="630" fill="url(#bg-grad)" />

  <!-- Motif géométrique d'arrière-plan -->
  <circle cx="600" cy="315" r="460" fill="none" stroke="rgba(52,211,153,0.04)" stroke-width="2" />
  <circle cx="600" cy="315" r="320" fill="none" stroke="rgba(52,211,153,0.06)" stroke-width="1.5" />
  <circle cx="600" cy="315" r="180" fill="none" stroke="rgba(52,211,153,0.08)" stroke-width="1" />

  <!-- Header : Badge officiel CCE -->
  <g>
    <rect x="110" y="38" width="460" height="38" rx="19" fill="rgba(6,78,59,0.85)" stroke="#34d399" stroke-width="1.2" />
    <circle cx="134" cy="57" r="6" fill="#34d399" class="pulse-dot" />
    <text x="152" y="62" font-size="13" font-weight="700" fill="#a7f3d0" letter-spacing="0.08em">CCE / ACEUM · DOSSIER SEM-26-003 · EN DIRECT</text>
    
    <text x="1090" y="62" font-size="14" font-weight="700" fill="#6ee7b7" text-anchor="end">ÉCHÉANCE : 16 OCTOBRE 2026</text>
  </g>

  <!-- Titre Principal -->
  <text x="600" y="132" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="-0.02em">
    HORLOGE OFFICIELLE — RÉPONSE DU CANADA
  </text>
  <text x="600" y="168" font-size="17" font-weight="500" fill="#93c5fd" text-anchor="middle">
    Décompte en temps réel avant la réponse exigée au gouvernement fédéral (Art. 24.27 ACEUM)
  </text>

  <!-- Grille du Décompte (4 Unités Principales) -->
  <!-- Jours -->
  <g transform="translate(120, 205)">
    <rect width="215" height="175" class="unit-card" />
    <text id="cd-days" x="107" y="105" class="unit-num">${pad(days)}</text>
    <text x="107" y="148" class="unit-lbl">Jours</text>
  </g>

  <!-- Heures -->
  <g transform="translate(365, 205)">
    <rect width="215" height="175" class="unit-card" />
    <text id="cd-hours" x="107" y="105" class="unit-num">${pad(hours)}</text>
    <text x="107" y="148" class="unit-lbl">Heures</text>
  </g>

  <!-- Minutes -->
  <g transform="translate(610, 205)">
    <rect width="215" height="175" class="unit-card" />
    <text id="cd-mins" x="107" y="105" class="unit-num">${pad(mins)}</text>
    <text x="107" y="148" class="unit-lbl">Minutes</text>
  </g>

  <!-- Secondes -->
  <g transform="translate(855, 205)">
    <rect width="215" height="175" class="unit-card-sec" />
    <!-- Ticker JS actif en affichage direct dans le navigateur ou via iframe -->
    <text id="cd-secs" x="107" y="105" class="unit-num-sec" style="display:none;">${pad(secs)}</text>
    <!-- Ticker CSS pur inspiré de svgasm pour contextes <img>, prévisualisations et Markdown sans JS -->
    <g id="css-secs-container">
${cssSecsFrames}    </g>
    <text x="107" y="148" class="unit-lbl">Secondes</text>
  </g>

  <!-- Total Minutes Callout Badge -->
  <g transform="translate(200, 415)">
    <rect width="800" height="54" rx="27" fill="rgba(16,185,129,0.15)" stroke="#10b981" stroke-width="1.5" />
    <text x="400" y="34" font-size="18" font-weight="700" fill="#6ee7b7" text-anchor="middle" dominant-baseline="middle">
      <tspan id="cd-total-mins" fill="#ffffff" font-weight="800">${totalMinsFormatted}</tspan> minutes restantes au total avant la réponse officielle
    </text>
  </g>

  <!-- Footer Info & Signature -->
  <g>
    <line x1="110" y1="505" x2="1090" y2="505" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
    
    <text x="110" y="546" font-size="16" font-weight="600" fill="#e2e8f0">
      Sauvegarde de la Grande Tourbière de Blainville (278 000 m²)
    </text>
    <text x="110" y="572" font-size="14" font-weight="400" fill="#94a3b8">
      William Guindon — Premier mineur plaignant de l'histoire du registre CCE (Art. 24.27)
    </text>

    <!-- URL Pill -->
    <rect x="860" y="530" width="230" height="44" rx="22" fill="#10b981" />
    <text x="975" y="557" font-size="15" font-weight="800" fill="#02150e" text-anchor="middle" dominant-baseline="middle">williamguindon.me/live</text>
  </g>

  <!-- Script d'horloge dynamique temps réel pour vue directe et iframe -->
  <script type="text/javascript">
    <![CDATA[
    (function() {
      // Date cible : Échéance officielle CCE SEM-26-003 (16 octobre 2026 à 00:00:00 HAE)
      var targetTime = new Date('2026-10-16T00:00:00-04:00').getTime();
      function pad(n) { return (n < 10 ? '0' : '') + n; }

      function updateClock() {
        var now = Date.now();
        var diff = Math.max(0, targetTime - now);
        var d = Math.floor(diff / (1000 * 60 * 60 * 24));
        var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        var s = Math.floor((diff % (1000 * 60)) / 1000);
        var totalMins = Math.floor(diff / (1000 * 60));

        var elDays = document.getElementById('cd-days');
        var elHours = document.getElementById('cd-hours');
        var elMins = document.getElementById('cd-mins');
        var elSecs = document.getElementById('cd-secs');
        var elTotal = document.getElementById('cd-total-mins');
        var cssSecs = document.getElementById('css-secs-container');

        if (cssSecs) {
          cssSecs.style.display = 'none';
        }
        if (elDays) elDays.textContent = pad(d);
        if (elHours) elHours.textContent = pad(h);
        if (elMins) elMins.textContent = pad(m);
        if (elSecs) {
          elSecs.style.display = 'inline';
          elSecs.textContent = pad(s);
        }
        if (elTotal) {
          try {
            elTotal.textContent = totalMins.toLocaleString('fr-CA');
          } catch(e) {
            elTotal.textContent = totalMins;
          }
        }
      }

      try {
        updateClock();
        setInterval(updateClock, 1000);
      } catch(err) {
        // En cas de blocage d'exécution de scripts, l'animation CSS svgasm assure l'animation
      }
    })();
    ]]>
  </script>
</svg>`;

  fs.writeFileSync(path.join(__dirname, '..', 'countdown-live.svg'), svgContent, 'utf8');
  console.log('Successfully generated countdown-live.svg with ' + days + ' days, ' + hours + ' hours, ' + mins + ' mins, ' + secs + ' secs (' + totalMinsFormatted + ' mins total).');
}

generateCountdownSvg();
