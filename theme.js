/* theme.js — Script pour le mode sombre dynamique, menu mobile, compteurs et modaux */
(function () {
  // 1. Gestion du thème Sombre/Clair
  const themeStorageKey = 'william-guindon-theme';
  
  function getInitialTheme() {
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (savedTheme) return savedTheme;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  
  const currentTheme = getInitialTheme();
  document.documentElement.setAttribute('data-theme', currentTheme);

  const sunIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41z"/></svg>`;
  const moonIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.3 22c5.3 0 9.7-4.3 9.7-9.7 0-2.7-1.1-5.1-2.9-6.9-.5-.5-1.3-.1-1.2.6.7 3.5-.3 7.3-3 10-2.7 2.7-6.5 3.7-10 3-.7-.1-1.1.7-.6 1.2 1.8 1.8 4.2 2.8 6.8 2.8zm-2.8-5c2.7-.2 5.1-1.5 6.8-3.5C13 13.3 10 9.9 10 6c0-.8.1-1.6.3-2.4C7.4 4.5 5 7.4 5 10.9 5 14.3 7 16.7 9.5 17z"/></svg>`;

  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('header.site nav');
    const headerWrap = document.querySelector('header.site .wrap');

    // 2. Injecter le bouton de thème dans la navigation
    if (nav) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'theme-toggle-btn';
      toggleBtn.setAttribute('aria-label', 'Changer de thème');
      
      const theme = document.documentElement.getAttribute('data-theme');
      toggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
      
      toggleBtn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(themeStorageKey, newTheme);
        toggleBtn.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
      });
      
      nav.appendChild(toggleBtn);
    }

    // 3. Injecter le bouton de menu mobile (Hamburger)
    if (headerWrap && nav) {
      const menuToggle = document.createElement('button');
      menuToggle.className = 'menu-toggle';
      menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
      menuToggle.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line class="line-1" x1="4" y1="6" x2="20" y2="6"></line><line class="line-2" x1="4" y1="12" x2="20" y2="12"></line><line class="line-3" x1="4" y1="18" x2="20" y2="18"></line></svg>`;
      
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menuToggle.classList.toggle('active');
        nav.classList.toggle('active');
        const isActive = nav.classList.contains('active');
        menuToggle.setAttribute('aria-label', isActive ? 'Fermer le menu' : 'Ouvrir le menu');
      });

      // Fermer le menu si on clique en dehors
      document.addEventListener('click', (e) => {
        if (nav.classList.contains('active') && !nav.contains(e.target) && e.target !== menuToggle) {
          nav.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
        }
      });
      
      headerWrap.insertBefore(menuToggle, nav);
    }

    // 4. Animation des compteurs dynamiques (Live Tracker)
    const counters = document.querySelectorAll('.counter-num');
    
    function animateCounter(el) {
      const targetVal = el.getAttribute('data-target');
      if (!targetVal) return;
      const target = parseInt(targetVal, 10);
      if (isNaN(target)) return;
      
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1800; // 1.8 secondes
      let startTime = null;
      
      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.floor(progress * target);
        
        if (target >= 1000) {
          el.textContent = current.toLocaleString('fr-FR') + suffix;
        } else {
          el.textContent = current + suffix;
        }
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          if (target >= 1000) {
            el.textContent = target.toLocaleString('fr-FR') + suffix;
          } else {
            el.textContent = target + suffix;
          }
        }
      }
      
      requestAnimationFrame(step);
    }

    // Compte à rebours de l'échéance de réponse du Canada à la CCE
    let cceTargetDate = new Date('2026-10-16T23:59:59-04:00').getTime();

    function updateCountdown() {
      const daysElement = document.getElementById('countdown-days');
      if (!daysElement) return;

      const now = new Date().getTime();
      const diff = cceTargetDate - now;

      if (diff <= 0) {
        daysElement.textContent = "Échéance atteinte";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      const isEn = document.documentElement.lang.startsWith('en');
      daysElement.textContent = isEn ? `${days}d ${hours}h ${mins}m` : `${days}j ${hours}h ${mins}m`;
    }

    // Chargement dynamique du statut officiel CCE depuis status.json
    async function loadDynamicStatus() {
      try {
        const res = await fetch('status.json');
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.prochaine_echeance) {
          cceTargetDate = new Date(data.prochaine_echeance).getTime();
          updateCountdown();
        }

        // Mise à jour des éléments UI si présents
        const badgeState = document.getElementById('cce-live-state');
        if (badgeState) {
          const isEn = document.documentElement.lang.startsWith('en');
          badgeState.textContent = isEn ? (data.etat_en || data.etat_fr) : data.etat_fr;
        }

        const syncDateEl = document.getElementById('cce-sync-date');
        if (syncDateEl && data.derniere_mise_a_jour) {
          syncDateEl.textContent = data.derniere_mise_a_jour;
        }
      } catch (err) {
        console.warn('Statut CCE local utilisé (impossible de charger status.json)', err);
      }
    }

    loadDynamicStatus();

    // Initialiser le compte à rebours s'il existe
    if (document.getElementById('countdown-days')) {
      updateCountdown();
      setInterval(updateCountdown, 60000); // Mise à jour chaque minute
    }

    // Observer pour déclencher l'animation des compteurs uniquement au défilement
    if (counters.length > 0) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const numEl = entry.target;
            // Éviter de relancer l'animation
            if (!numEl.classList.contains('animated')) {
              numEl.classList.add('animated');
              animateCounter(numEl);
            }
            counterObserver.unobserve(numEl);
          }
        });
      }, { threshold: 0.1 });

      counters.forEach(c => counterObserver.observe(c));
    }

    // 5. Gestion des modaux de documents (<dialog>) avec chargement différé (Eco-Design A+)
    const openDocBtns = document.querySelectorAll('.btn-open-doc');
    
    openDocBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const dialogId = btn.getAttribute('data-dialog');
        const dialog = document.getElementById(dialogId);
        if (dialog) {
          const iframe = dialog.querySelector('iframe[data-src]');
          if (iframe && !iframe.getAttribute('src')) {
            iframe.setAttribute('src', iframe.getAttribute('data-src'));
          }
          dialog.showModal();
          document.body.style.overflow = 'hidden';
        }
      });
    });

    // Chargement interactif de la carte SIG OpenStreetMap / Leaflet (Zero Iframes, Eco-Design A+)
    const loadMapBtns = document.querySelectorAll('.btn-load-map');
    loadMapBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.felt-map-wrapper');
        if (!wrapper) return;

        wrapper.innerHTML = `<div id="gis-leaflet-map" style="width:100%;height:100%;border-radius:20px;"></div>`;
        
        const leafletCss = document.createElement('link');
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCss);

        const leafletJs = document.createElement('script');
        leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletJs.onload = () => {
          if (typeof L === 'undefined') return;
          const map = L.map('gis-leaflet-map').setView([45.68725, -73.85447], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap · SEM-26-003'
          }).addTo(map);

          // Polygone Grande Tourbière de Blainville (278 000 m²)
          const tourbiere = L.polygon([
            [45.696, -73.868],
            [45.698, -73.845],
            [45.682, -73.840],
            [45.679, -73.862]
          ], { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.35 }).addTo(map);
          tourbiere.bindPopup("<b>🌿 Grande Tourbière de Blainville</b><br>Zone humide menacée (278 000 m²)<br>Puits de carbone majeur");

          // Polygone Site Stablex
          const stablex = L.polygon([
            [45.689, -73.860],
            [45.692, -73.852],
            [45.685, -73.850],
            [45.683, -73.858]
          ], { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.45 }).addTo(map);
          stablex.bindPopup("<b>⚠️ Site d'enfouissement Stablex</b><br>Cellules 1 à 5 & Cellule 6 projetée<br>Déchets industriels dangereux");

          // Lacs Fauvel
          const fauvel = L.circle([45.681, -73.846], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.5,
            radius: 350
          }).addTo(map);
          fauvel.bindPopup("<b>💧 Lacs Fauvel & Bassin Versant</b><br>Zone de biodiversité récréotouristique");

          // Point Cadmium
          const cadmium = L.marker([45.6865, -73.854]).addTo(map);
          cadmium.bindPopup("<b>🧪 Point de prélèvement d'eau</b><br>Concentration en Cadmium : 320x la norme");
        };
        document.body.appendChild(leafletJs);
      });
    });

    const closeDocBtns = document.querySelectorAll('.dialog-close, dialog [command="close"]');
    
    closeDocBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const dialog = btn.closest('dialog');
        if (dialog) {
          dialog.close();
          document.body.style.overflow = ''; // Rétablir le défilement
        }
      });
    });

    // Fermer le modal en cliquant sur le backdrop
    const dialogs = document.querySelectorAll('dialog.doc-dialog');
    dialogs.forEach(dialog => {
      dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          dialog.close();
          document.body.style.overflow = '';
        }
      });
      // Gérer la touche Escape
      dialog.addEventListener('cancel', () => {
        document.body.style.overflow = '';
      });
    });

    // 6. Animation d'apparition au défilement (Scroll Reveal)
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.08
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const animElements = document.querySelectorAll(
      'section, .factgrid, .keyfacts, blockquote, details.faq, ul.vision li, ul.srcs li, .tracker-card, .doc-card, .timeline-awards li'
    );
    
    animElements.forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });

    // 7. Barre de progression de défilement
    window.addEventListener('scroll', () => {
      const progressBar = document.querySelector('.scroll-progress-bar');
      if (!progressBar) return;
      
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      if (limit <= 0) return;
      
      const pct = (window.scrollY / limit) * 100;
      progressBar.style.width = pct + '%';
    });

    // 8. Éléments de Timeline s'activant au défilement (Highlights)
    const timelineOptions = {
      root: null,
      rootMargin: '-30% 0px -30% 0px', // se déclenche dans la zone centrale de lecture
      threshold: 0
    };
    
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active-node');
        } else {
          entry.target.classList.remove('active-node');
        }
      });
    }, timelineOptions);
    
    // 9. Lecteur Audio d'accessibilité WCAG 2.1 AA (Web Speech API)
    const audioBtn = document.getElementById('btn-audio-read');
    if (audioBtn) {
      let isSpeaking = false;
      const statusLabel = document.getElementById('audio-status-text');
      const lang = document.documentElement.lang || 'fr-CA';

      audioBtn.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) {
          alert('La synthèse vocale n\'est pas supportée par votre navigateur.');
          return;
        }

        if (isSpeaking) {
          window.speechSynthesis.cancel();
          isSpeaking = false;
          audioBtn.classList.remove('playing');
          audioBtn.setAttribute('aria-label', 'Écouter la biographie');
          audioBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> <span>Écouter la biographie</span>`;
          if (statusLabel) statusLabel.textContent = '';
        } else {
          const leadText = document.querySelector('p.lead')?.textContent || '';
          const introText = document.querySelector('#apropos p, #about p, #sobre p')?.textContent || '';
          const fullTextToRead = `${leadText}. ${introText}`;

          const utterance = new SpeechSynthesisUtterance(fullTextToRead);
          utterance.lang = lang.startsWith('en') ? 'en-US' : (lang.startsWith('es') ? 'es-ES' : 'fr-CA');

          utterance.onend = () => {
            isSpeaking = false;
            audioBtn.classList.remove('playing');
            audioBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> <span>Écouter la biographie</span>`;
            if (statusLabel) statusLabel.textContent = '';
          };

          utterance.onerror = () => {
            isSpeaking = false;
            audioBtn.classList.remove('playing');
            if (statusLabel) statusLabel.textContent = 'Erreur de lecture';
          };

          window.speechSynthesis.speak(utterance);
          isSpeaking = true;
          audioBtn.classList.add('playing');
          audioBtn.setAttribute('aria-label', 'Arrêter la lecture audio');
          audioBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> <span>Pause / Arrêter</span>`;
          if (statusLabel) statusLabel.textContent = lang.startsWith('en') ? 'Reading in progress...' : (lang.startsWith('es') ? 'Leyendo...' : 'Lecture audio en cours...');
        }
      });
    }

    // 10. Compte à rebours de précision en temps réel (Jours, Heures, Minutes, Secondes)
    function updatePrecisionCountdown() {
      const targetDate = new Date('2026-10-16T23:59:59-04:00').getTime();
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) return;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = document.getElementById('cd-days');
      const hEl = document.getElementById('cd-hours');
      const mEl = document.getElementById('cd-mins');
      const sEl = document.getElementById('cd-secs');

      if (dEl) dEl.textContent = days;
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    }

    updatePrecisionCountdown();
    setInterval(updatePrecisionCountdown, 1000);

    // 11. Copier le code du Widget Partenaire (Embed Widget)
    const copyWidgetBtn = document.getElementById('btn-copy-embed');
    if (copyWidgetBtn) {
      copyWidgetBtn.addEventListener('click', () => {
        const textarea = document.getElementById('embed-code-area');
        if (textarea) {
          textarea.select();
          navigator.clipboard.writeText(textarea.value).then(() => {
            copyWidgetBtn.textContent = '✓ Code copié !';
            setTimeout(() => {
              copyWidgetBtn.textContent = 'Copier le code HTML';
            }, 2500);
          });
        }
      });
    }

    // 12. Menu Flottant Branche / Feuille & Hub Méga-Prompt IA
    initFloatingBranchMenu();
  });

  function initFloatingBranchMenu() {
    if (document.getElementById('floating-leaf-container')) return;

    const lang = document.documentElement.lang || 'fr';
    let megaPrompt = '';
    let texts = {};

    if (lang.startsWith('en')) {
      texts = {
        title: '🌿 Action & AI Hub',
        top: 'Scroll to top',
        chatgpt: 'Ask ChatGPT',
        gemini: 'Ask Gemini',
        claude: 'Ask Claude',
        grok: 'Ask Grok (xAI)',
        copy: 'Copy Mega-Prompt',
        copied: '✓ Mega-Prompt copied to clipboard!',
        toastAi: '✓ Prompt copied! Paste it in your AI chat.'
      };
      megaPrompt = `Act as an expert analyst in international environmental law and climate justice. Analyze the case of William Guindon, a 14-year-old Quebec environmental activist who filed and achieved a positive determination for submission SEM-26-003 before the Commission for Environmental Cooperation (CEC / CUSMA).

Key facts and verified official sources:
- Official CEC Submission: SEM-26-003 ("Hazardous Waste Disposal in Blainville")
- Landmark Determination of August 17, 2026: The CEC Secretariat ruled the submission meets Article 24.27(2) criteria and formally requested a response from Canada under Article 24.27(3) by October 16, 2026. First minor in SEM history to achieve this.
- Environmental Issues: Destruction of 278,000 m² of critical wetlands in the Great Peatland of Blainville by the Stablex Cell 6 expansion enacted under Bill 93, 320x cadmium concentration exceedance, and threats to migratory birds and species at risk.
- United Nations Action: Formal deposition submitted to the UN Special Rapporteur on toxics and human rights (Dr. Marcos A. Orellana).

Official Sources & Links:
- Official Website: https://williamguindon.me/en.html
- CEC Registry: https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/
- Positive Determination (PDF): https://www.cec.org/wp-content/uploads/wpallimport/files/26-2-det2_en.pdf
- The Rover Feature: https://therover.ca/blainville-teenager-takes-stablex-fight-international/

Explain the legal implications for Canada, the importance of preserving this carbon sink (55,600 tonnes of CO2), and what this precedent means for the rights of future generations.`;
    } else if (lang.startsWith('es')) {
      texts = {
        title: '🌿 Menú & Hub IA',
        top: 'Subir al inicio',
        chatgpt: 'Consultar ChatGPT',
        gemini: 'Consultar Gemini',
        claude: 'Consultar Claude',
        grok: 'Consultar Grok (xAI)',
        copy: 'Copiar Mega-Prompt',
        copied: '✓ ¡Mega-Prompt copiado al portapapeles!',
        toastAi: '✓ ¡Prompt copiado! Pégalo en tu IA.'
      };
      megaPrompt = `Actúa como analista experto en derecho ambiental internacional y justicia climática. Analiza el caso de William Guindon, activista ambiental de Quebec de 14 años que presentó y logró una determinación positiva para la petición SEM-26-003 ante la Comisión para la Cooperación Ambiental (CCA / T-MEC).

Puntos clave y fuentes oficiales:
- Registro Oficial CCA: SEM-26-003 ("Enfouissement de matières dangereuses à Blainville")
- Determinación histórica del 17 de agosto de 2026: El Secretariado de la CCA determinó que la petición cumple con el Artículo 24.27(2) y solicitó formalmente una respuesta a Canadá bajo el Artículo 24.27(3) para el 16 de octubre de 2026. Primer menor en la historia de las SEM en lograrlo.
- Impacto ambiental: Destrucción de 278,000 m² de humedales en la Gran Turbera de Blainville por la Celda 6 de Stablex, 320x de cadmio y amenazas a especies protegidas.
- Acción en la ONU: Declaración formal ante el Relator Especial de la ONU sobre sustancias tóxicas y derechos humanos.

Fuentes oficiales:
- Sitio oficial: https://williamguindon.me/es.html
- Registro CCA: https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/

Explica las implicaciones jurídicas para Canadá y lo que este precedente representa para los derechos de las generaciones futuras.`;
    } else {
      texts = {
        title: '🌿 Branche d\'Actions & IA',
        top: 'Haut de page ↑',
        chatgpt: 'Analyser avec ChatGPT',
        gemini: 'Analyser avec Gemini',
        claude: 'Analyser avec Claude',
        grok: 'Analyser avec Grok (xAI)',
        copy: 'Copier le Méga-Prompt',
        copied: '✓ Méga-Prompt copié ! Prêt à coller.',
        toastAi: '✓ Prompt copié ! Collez-le dans votre IA.'
      };
      megaPrompt = `Agis en tant qu'analyste expert en droit de l'environnement international et justice climatique. Analyse le dossier de William Guindon, militant écologiste québécois de 14 ans qui a déposé et fait accepter la soumission SEM-26-003 devant la Commission de coopération environnementale (CCE / ACEUM).

Voici les éléments clés et sources officielles du dossier :
- Dossier officiel CCE : SEM-26-003 (« Enfouissement de matières dangereuses à Blainville »)
- Décision historique du 17 août 2026 : Le Secrétariat de la CCE a rendu une détermination positive sous l'article 24.27(2) et demande une réponse officielle du Canada sous l'article 24.27(3) d'ici le 16 octobre 2026. Premier mineur dans l'histoire des SEM à franchir cette étape.
- Enjeux environnementaux : Destruction de 278 000 m² de milieux humides dans la Grande Tourbière de Blainville par l'expansion du site Stablex (Cellule 6) autorisée par le Projet de loi 93 sous bâillon, contamination en Cadmium (320x la norme) et menace sur les espèces en péril et oiseaux migrateurs.
- Recours à l'ONU : Déposition formelle transmise au Rapporteur spécial des Nations unies sur les substances toxiques et les droits de l'homme (Dr Marcos A. Orellana).

Sources et liens officiels :
- Site officiel : https://williamguindon.me/
- Registre CCE : https://www.cec.org/fr/communications/registre-des-communications/enfouissement-de-matieres-dangereuses-a-blainville/
- Détermination positive CCE (PDF) : https://www.cec.org/wp-content/uploads/wpallimport/files/26-2-det2_fr.pdf
- Article La Presse : https://www.lapresse.ca/actualites/environnement/2026-07-03/protection-d-une-tourbiere-a-blainville/le-combat-d-un-adolescent-a-l-onu.php

Explique-moi les implications juridiques pour le Canada, l'importance de préserver ce puits de carbone (55 600 tonnes de CO2) et ce que ce précédent signifie pour les droits des générations futures.`;
    }

    const container = document.createElement('div');
    container.id = 'floating-leaf-container';
    container.className = 'floating-branch-container';

    container.innerHTML = `
      <div class="leaf-branch-panel" id="leaf-branch-panel" role="dialog" aria-label="${texts.title}">
        <div class="branch-header">
          <span class="branch-title">🍃 ${texts.title}</span>
        </div>
        <button class="branch-action-btn top-scroll-btn" id="btn-branch-top">
          <span class="btn-icon">⬆️</span>
          <span>${texts.top}</span>
        </button>
        <div class="branch-divider"></div>
        <button class="branch-action-btn" id="btn-ai-chatgpt">
          <span class="btn-icon">🤖</span>
          <span>${texts.chatgpt}</span>
        </button>
        <button class="branch-action-btn" id="btn-ai-gemini">
          <span class="btn-icon">✨</span>
          <span>${texts.gemini}</span>
        </button>
        <button class="branch-action-btn" id="btn-ai-claude">
          <span class="btn-icon">🧠</span>
          <span>${texts.claude}</span>
        </button>
        <button class="branch-action-btn" id="btn-ai-grok">
          <span class="btn-icon">⚡</span>
          <span>${texts.grok}</span>
        </button>
        <button class="branch-action-btn" id="btn-ai-copy">
          <span class="btn-icon">📋</span>
          <span>${texts.copy}</span>
        </button>
      </div>
      <button class="leaf-trigger-btn" id="leaf-trigger-btn" aria-label="Ouvrir le menu d'actions" title="Menu Feuille & IA">
        🍃
      </button>
      <div class="prompt-toast" id="prompt-toast"></div>
    `;

    document.body.appendChild(container);

    const triggerBtn = document.getElementById('leaf-trigger-btn');
    const panel = document.getElementById('leaf-branch-panel');
    const toast = document.getElementById('prompt-toast');

    function showToast(msg) {
      toast.textContent = msg;
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 3500);
    }

    triggerBtn.addEventListener('click', () => {
      const isOpen = panel.classList.toggle('open');
      triggerBtn.classList.toggle('active', isOpen);
      triggerBtn.setAttribute('aria-expanded', isOpen);
    });

    // Fermer si clic en dehors
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        panel.classList.remove('open');
        triggerBtn.classList.remove('active');
      }
    });

    // 1. Remonter en haut
    document.getElementById('btn-branch-top').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      panel.classList.remove('open');
      triggerBtn.classList.remove('active');
    });

    // 2. ChatGPT
    document.getElementById('btn-ai-chatgpt').addEventListener('click', () => {
      const url = `https://chatgpt.com/?q=${encodeURIComponent(megaPrompt)}`;
      window.open(url, '_blank');
      showToast(texts.toastAi);
      panel.classList.remove('open');
      triggerBtn.classList.remove('active');
    });

    // 3. Gemini
    document.getElementById('btn-ai-gemini').addEventListener('click', () => {
      navigator.clipboard.writeText(megaPrompt).then(() => {
        window.open('https://gemini.google.com/app', '_blank');
        showToast(texts.toastAi);
        panel.classList.remove('open');
        triggerBtn.classList.remove('active');
      });
    });

    // 4. Claude
    document.getElementById('btn-ai-claude').addEventListener('click', () => {
      navigator.clipboard.writeText(megaPrompt).then(() => {
        window.open('https://claude.ai/new', '_blank');
        showToast(texts.toastAi);
        panel.classList.remove('open');
        triggerBtn.classList.remove('active');
      });
    });

    // 5. Grok
    document.getElementById('btn-ai-grok').addEventListener('click', () => {
      const url = `https://x.com/i/grok?text=${encodeURIComponent(megaPrompt.substring(0, 800))}`;
      window.open(url, '_blank');
      showToast(texts.toastAi);
      panel.classList.remove('open');
      triggerBtn.classList.remove('active');
    });

    // 6. Copier le Méga-Prompt
    document.getElementById('btn-ai-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(megaPrompt).then(() => {
        showToast(texts.copied);
        panel.classList.remove('open');
        triggerBtn.classList.remove('active');
      });
    });
  }
})();
