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

  function initApp() {
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

    // 3. Injecter le bouton de menu mobile (Hamburger) & Gestionnaire de fermeture robuste
    if (headerWrap && nav) {
      const menuToggle = document.createElement('button');
      menuToggle.className = 'menu-toggle';
      menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
      menuToggle.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line class="line-1" x1="4" y1="6" x2="20" y2="6"></line><line class="line-2" x1="4" y1="12" x2="20" y2="12"></line><line class="line-3" x1="4" y1="18" x2="20" y2="18"></line></svg>`;
      
      function closeMobileNav() {
        if (nav.classList.contains('active')) {
          nav.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
        }
      }

      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = nav.classList.toggle('active');
        menuToggle.classList.toggle('active', isActive);
        menuToggle.setAttribute('aria-label', isActive ? 'Fermer le menu' : 'Ouvrir le menu');
      });

      // Fermer le menu mobile lors d'un clic sur un lien du menu
      nav.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
          closeMobileNav();
          // Fermer aussi les dropdowns
          const dropdownsToClose = document.querySelectorAll('.nav-dropdown, .nav-notif-dropdown');
          dropdownsToClose.forEach(d => {
            d.classList.remove('active');
            const btn = d.querySelector('.nav-dropdown-btn, .nav-notif-btn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          });
        }
      });

      // Fermer le menu si on clique en dehors
      document.addEventListener('click', (e) => {
        if (nav.classList.contains('active') && !nav.contains(e.target) && e.target !== menuToggle) {
          closeMobileNav();
        }
      });

      // Fermer le menu sur touche Échap
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeMobileNav();
        }
      });

      // Réinitialiser si la fenêtre est redimensionnée en mode desktop
      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          closeMobileNav();
        }
      }, { passive: true });
      
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
          const viewer = dialog.querySelector('.dialog-doc-viewer[data-src]');
          if (viewer && !viewer.querySelector('iframe')) {
            const src = viewer.getAttribute('data-src');
            const title = viewer.getAttribute('data-title') || 'Document officiel';
            const iframe = document.createElement('iframe');
            iframe.src = src;
            iframe.title = title;
            iframe.setAttribute('loading', 'lazy');
            viewer.appendChild(iframe);
          }
          dialog.showModal();
          document.body.style.overflow = 'hidden';
        }
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

    // 11. Service Worker & PWA Support
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            checkBackgroundFeedUpdates(reg);
          })
          .catch((err) => console.log('SW registration skipped:', err));
      });
    }

    // 12. Dropdown Navigation Handler (Accessible click, hover, keyboard)
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    const notifDropdowns = document.querySelectorAll('.nav-notif-dropdown');

    dropdowns.forEach((dropdown) => {
      const btn = dropdown.querySelector('.nav-dropdown-btn');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Fermer les panneaux de notification
        notifDropdowns.forEach(nd => {
          nd.classList.remove('active');
          const nb = nd.querySelector('.nav-notif-btn');
          if (nb) nb.setAttribute('aria-expanded', 'false');
        });

        const isOpen = dropdown.classList.toggle('active');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (!isOpen) {
          btn.blur();
        }
      });

      // Fermer le dropdown lors d'un clic sur un élément interne
      dropdown.querySelectorAll('.nav-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          dropdown.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          btn.blur();
        });
      });

      dropdown.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdown.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          btn.blur();
        }
      });
    });

    // 12b. Gestion de la Cloche de Notification & Panneau d'Alerte Médias
    notifDropdowns.forEach((dropdown) => {
      const btn = dropdown.querySelector('.nav-notif-btn');
      const closeBtn = dropdown.querySelector('.nav-notif-close');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Fermer les autres menus
        dropdowns.forEach(d => {
          d.classList.remove('active');
          const b = d.querySelector('.nav-dropdown-btn');
          if (b) {
            b.setAttribute('aria-expanded', 'false');
            b.blur();
          }
        });

        const isOpen = dropdown.classList.toggle('active');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (!isOpen) {
          btn.blur();
        }
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          btn.blur();
        });
      }

      dropdown.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdown.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          btn.blur();
        }
      });
    });

    document.addEventListener('click', (e) => {
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('active');
          const btn = dropdown.querySelector('.nav-dropdown-btn');
          if (btn) {
            btn.setAttribute('aria-expanded', 'false');
            btn.blur();
          }
        }
      });

      notifDropdowns.forEach((dropdown) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('active');
          const btn = dropdown.querySelector('.nav-notif-btn');
          if (btn) {
            btn.setAttribute('aria-expanded', 'false');
            btn.blur();
          }
        }
      });
    });

    // 13. Gestion des Notifications de Nouvelles Étapes (RSS & CCE)
    const notifBtn = document.getElementById('btn-enable-notifications');
    const notifStorageKey = 'wg_cce_notif_enabled';

    function updateNotifBtnState() {
      if (!notifBtn) return;
      const isEnabled = localStorage.getItem(notifStorageKey) === 'true' && Notification.permission === 'granted';
      const lang = document.documentElement.lang || 'fr';
      
      if (isEnabled) {
        notifBtn.classList.add('active');
        notifBtn.innerHTML = lang.startsWith('en') ? '🔔 Alerts Active' : (lang.startsWith('es') ? '🔔 Alertas Activas' : '🔔 Alertes CCE Activées');
      } else {
        notifBtn.classList.remove('active');
        notifBtn.innerHTML = lang.startsWith('en') ? '🔔 Enable CCE Alerts' : (lang.startsWith('es') ? '🔔 Activar Alertas CCA' : '🔔 Activer les Alertes CCE');
      }
    }

    if (notifBtn) {
      updateNotifBtnState();
      notifBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) {
          alert("Ce navigateur ne supporte pas les notifications.");
          return;
        }

        if (Notification.permission === 'granted') {
          const currentlyEnabled = localStorage.getItem(notifStorageKey) === 'true';
          localStorage.setItem(notifStorageKey, currentlyEnabled ? 'false' : 'true');
          updateNotifBtnState();
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          localStorage.setItem(notifStorageKey, 'true');
          updateNotifBtnState();

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              const lang = document.documentElement.lang || 'fr';
              const title = lang.startsWith('en') ? 'William Guindon — CCE Alerts Enabled' : (lang.startsWith('es') ? 'William Guindon — Alertas CCA Activadas' : 'William Guindon — Alertes CCE Activées');
              const body = lang.startsWith('en') 
                ? 'You will receive real-time notifications for the next steps (Canada response on Oct 16, 2026).'
                : (lang.startsWith('es') 
                  ? 'Recibirá notificaciones en tiempo real sobre los próximos pasos (respuesta de Canadá el 16 de oct. 2026).' 
                  : 'Vous recevrez des notifications en direct pour les prochaines étapes (réponse du Canada le 16 oct. 2026).');

              reg.showNotification(title, {
                body: body,
                icon: '/icon-192.png',
                badge: '/apple-touch-icon.png',
                data: { url: '/#tracker' }
              });
            });
          }
        }
      });
    }

    // 14. Vérification en arrière-plan du flux RSS pour envoyer une notification lors de nouvelles étapes
    function checkBackgroundFeedUpdates(reg) {
      if (localStorage.getItem(notifStorageKey) !== 'true' || Notification.permission !== 'granted') return;

      fetch('/feed.xml')
        .then((res) => res.text())
        .then((xmlText) => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          const firstItem = xmlDoc.querySelector('item');
          if (!firstItem) return;

          const title = firstItem.querySelector('title')?.textContent || '';
          const link = firstItem.querySelector('link')?.textContent || '/#tracker';
          const pubDate = firstItem.querySelector('pubDate')?.textContent || '';
          const lastSeenDate = localStorage.getItem('wg_last_feed_notif');

          if (lastSeenDate && lastSeenDate !== pubDate) {
            reg.showNotification(`📢 CCE / SEM-26-003 : Nouvelle Étape`, {
              body: title,
              icon: '/icon-192.png',
              badge: '/apple-touch-icon.png',
              data: { url: link }
            });
          }
          localStorage.setItem('wg_last_feed_notif', pubDate);
        })
        .catch(() => {});
    }

    // 15. Désobfuscation sécurisée de l'adresse courriel (Anti-Scraping / Anti-Bots / Anti-Spam)
    // Aucun texte brut dans le HTML. L'adresse est assemblée dynamiquement au runtime uniquement lors d'un clic humain.
    const secureMailBtns = document.querySelectorAll('.js-secure-mail');
    secureMailBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const u = [103, 117, 105, 110, 100, 111, 110, 119, 105, 108, 108, 105, 97, 109, 50].map(c => String.fromCharCode(c)).join('');
        const d = [103, 109, 97, 105, 108, 46, 99, 111, 109].map(c => String.fromCharCode(c)).join('');
        const lang = document.documentElement.lang || 'fr';
        const subj = lang.startsWith('en') 
          ? encodeURIComponent("Media / Citizen Inquiry — William Guindon") 
          : (lang.startsWith('es') 
            ? encodeURIComponent("Contacto Medios / Ciudadanos — William Guindon") 
            : encodeURIComponent("Contact Médias / Citoyens — William Guindon"));
        window.location.href = 'mai' + 'lto:' + u + '@' + d + '?subject=' + subj;
      });
    });

    // 16. Copie du communiqué de presse dans le presse-papiers
    const copyPrBtns = document.querySelectorAll('.js-copy-pr');
    copyPrBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const prContainer = document.querySelector('.press-release-container') || document.querySelector('.communique-paper');
        if (!prContainer) return;
        try {
          await navigator.clipboard.writeText(prContainer.innerText);
          const oldHtml = btn.innerHTML;
          btn.innerHTML = '✓ Communiqué copié dans le presse-papiers !';
          setTimeout(() => { btn.innerHTML = oldHtml; }, 3000);
        } catch (err) {
          console.error('Erreur copie:', err);
        }
      });
    });

    // 17. Carrousel Revue de Presse & Embeds Médias (Moteur Slider basé sur Transform)
    const carouselWrapper = document.querySelector('.press-carousel-wrapper');
    const carouselContainer = document.querySelector('.press-carousel-container');
    const prevBtn = document.querySelector('.js-carousel-prev');
    const nextBtn = document.querySelector('.js-carousel-next');
    const dots = document.querySelectorAll('.carousel-dot');
    const cards = carouselContainer ? carouselContainer.querySelectorAll('.press-card') : [];

    if (carouselContainer && cards.length > 0) {
      let currentIndex = 0;
      let autoPlayTimer = null;

      // Forcer immédiatement la structure flex et l'overflow caché pour éviter tout empilement
      if (carouselWrapper) {
        carouselWrapper.style.overflow = 'hidden';
        carouselWrapper.style.position = 'relative';
        carouselWrapper.style.width = '100%';
      }
      carouselContainer.style.display = 'flex';
      carouselContainer.style.flexDirection = 'row';
      carouselContainer.style.flexWrap = 'nowrap';
      carouselContainer.style.alignItems = 'stretch';
      carouselContainer.style.gap = '24px';
      carouselContainer.style.width = 'max-content';
      carouselContainer.style.minWidth = '100%';
      carouselContainer.style.willChange = 'transform';
      carouselContainer.style.transform = 'translateX(0px)';

      cards.forEach(c => {
        c.style.flex = '0 0 350px';
        c.style.width = '350px';
        c.style.minWidth = '290px';
        c.style.maxWidth = '380px';
        c.style.boxSizing = 'border-box';
        c.style.position = 'relative';
      });

      const getGap = () => 24;

      const getCardWidth = () => {
        const first = cards[0];
        return first ? first.getBoundingClientRect().width : 350;
      };

      const getVisibleCards = () => {
        const wrapWidth = carouselWrapper ? carouselWrapper.getBoundingClientRect().width : window.innerWidth;
        const cardW = getCardWidth();
        return Math.max(1, Math.floor(wrapWidth / (cardW + getGap())));
      };

      const getMaxIndex = () => {
        const visible = getVisibleCards();
        return Math.max(0, cards.length - visible);
      };

      const updateSlider = (index, smooth = true) => {
        const maxIdx = getMaxIndex();
        currentIndex = Math.max(0, Math.min(index, maxIdx));

        const cardW = getCardWidth();
        const gap = getGap();
        const offset = currentIndex * (cardW + gap);

        carouselContainer.style.transition = smooth ? 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none';
        carouselContainer.style.transform = `translateX(-${offset}px)`;

        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === currentIndex);
        });

        if (prevBtn) {
          prevBtn.style.opacity = currentIndex === 0 ? '0.45' : '1';
          prevBtn.style.cursor = currentIndex === 0 ? 'default' : 'pointer';
        }
        if (nextBtn) {
          nextBtn.style.opacity = currentIndex >= maxIdx ? '0.45' : '1';
        }
      };

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (currentIndex > 0) {
            updateSlider(currentIndex - 1);
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const maxIdx = getMaxIndex();
          if (currentIndex < maxIdx) {
            updateSlider(currentIndex + 1);
          } else {
            updateSlider(0); // Boucle au début
          }
        });
      }

      dots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          updateSlider(idx);
        });
      });

      // Navigation Tactile (Touch / Swipe)
      let touchStartX = 0;
      let touchCurrentX = 0;
      let isTouching = false;

      carouselContainer.addEventListener('touchstart', (e) => {
        stopAutoPlay();
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        touchCurrentX = touchStartX;
        carouselContainer.style.transition = 'none';
      }, { passive: true });

      carouselContainer.addEventListener('touchmove', (e) => {
        if (!isTouching) return;
        touchCurrentX = e.touches[0].clientX;
        const diff = touchCurrentX - touchStartX;
        const cardW = getCardWidth();
        const gap = getGap();
        const baseOffset = currentIndex * (cardW + gap);
        carouselContainer.style.transform = `translateX(${-baseOffset + diff}px)`;
      }, { passive: true });

      carouselContainer.addEventListener('touchend', () => {
        if (!isTouching) return;
        isTouching = false;
        const diff = touchCurrentX - touchStartX;
        const threshold = 45;
        const maxIdx = getMaxIndex();

        if (diff < -threshold && currentIndex < maxIdx) {
          updateSlider(currentIndex + 1);
        } else if (diff > threshold && currentIndex > 0) {
          updateSlider(currentIndex - 1);
        } else {
          updateSlider(currentIndex);
        }
        setTimeout(startAutoPlay, 3500);
      }, { passive: true });

      // Défilement automatique
      const startAutoPlay = () => {
        stopAutoPlay();
        autoPlayTimer = setInterval(() => {
          const maxIdx = getMaxIndex();
          if (currentIndex >= maxIdx) {
            updateSlider(0);
          } else {
            updateSlider(currentIndex + 1);
          }
        }, 5000);
      };

      const stopAutoPlay = () => {
        if (autoPlayTimer) {
          clearInterval(autoPlayTimer);
          autoPlayTimer = null;
        }
      };

      if (carouselWrapper) {
        carouselWrapper.addEventListener('mouseenter', stopAutoPlay);
        carouselWrapper.addEventListener('mouseleave', startAutoPlay);
        carouselWrapper.addEventListener('focusin', stopAutoPlay);
        carouselWrapper.addEventListener('focusout', startAutoPlay);
      }

      window.addEventListener('resize', () => {
        updateSlider(currentIndex, false);
      }, { passive: true });

      // Initialisation immédiate
      updateSlider(0, false);
      startAutoPlay();

      // Audio Player Quotes Toggle
      const audioBtns = document.querySelectorAll('.js-press-audio-btn');
      audioBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const isPlaying = btn.getAttribute('data-playing') === 'true';
          // Stop all other buttons
          audioBtns.forEach(b => {
            b.setAttribute('data-playing', 'false');
            b.innerHTML = '▶';
          });
          if (!isPlaying) {
            btn.setAttribute('data-playing', 'true');
            btn.innerHTML = '❚❚';
            // Resume/Play link trigger if requested
            const targetUrl = btn.getAttribute('data-target-url');
            if (targetUrl) {
              setTimeout(() => {
                window.open(targetUrl, '_blank', 'noopener,noreferrer');
                btn.setAttribute('data-playing', 'false');
                btn.innerHTML = '▶';
              }, 1200);
            }
          }
        });
      });
    }

    // 13. Bouton Flottant & Hub IA (Résumé & Questions)
    initFloatingAiHub();
  }

  // 14. Détection et redirection automatique des robots d'IA vers ai.html
  function routeAiCrawlers() {
    const aiBots = /GPTBot|ChatGPT-User|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Google-Extended|Bytespider|cohere-ai|Diffbot|CCBot|Applebot-Extended|Meta-ExternalAgent/i;
    const isAiAgent = aiBots.test(navigator.userAgent) || window.location.search.includes('format=ai') || window.location.search.includes('ref=ai');
    const currentPath = window.location.pathname;
    if (isAiAgent && !currentPath.includes('ai.html') && !currentPath.includes('ai.txt') && !currentPath.includes('llms')) {
      window.location.replace("https://williamguindon.me/ai.html");
    }
  }
  routeAiCrawlers();

  // 15. Initialisation du widget flottant IA & Modal
  function initFloatingAiHub() {
    if (window.location.pathname.includes('ai.html') || window.location.pathname.includes('ai.txt')) return;

    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'floating-ai-btn';
    floatingBtn.setAttribute('aria-label', 'Résumer ou analyser avec une IA');
    floatingBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <span>Analyser avec l'IA</span>
    `;

    const aiModal = document.createElement('div');
    aiModal.className = 'ai-modal-overlay';
    aiModal.innerHTML = `
      <div class="ai-modal-card" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
        <div class="ai-modal-header">
          <div class="ai-modal-title" id="ai-modal-title">
            <span>✨</span> Résumer & Analyser avec l'IA
          </div>
          <button class="ai-modal-close" aria-label="Fermer le menu IA">✕</button>
        </div>
        <p class="ai-modal-desc">
          Analysez instantanément le dossier SEM-26-003, la chronologie Stablex et les faits vérifiés sur William Guindon dans votre assistant IA :
        </p>
        <div class="ai-modal-buttons">
          <a href="https://chatgpt.com/?q=R%C3%A9sume+et+synth%C3%A9tise+le+dossier+SEM-26-003+de+William+Guindon+%C3%A0+partir+de+https%3A%2F%2Fwilliamguindon.me%2Fai.html" target="_blank" rel="noopener noreferrer" class="ai-btn-option">
            <div class="ai-btn-option-left">
              <span>🟢</span>
              <span>Ouvrir dans ChatGPT</span>
            </div>
            <span>↗</span>
          </a>
          <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer" class="ai-btn-option">
            <div class="ai-btn-option-left">
              <span>🔵</span>
              <span>Ouvrir dans Google Gemini</span>
            </div>
            <span>↗</span>
          </a>
          <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer" class="ai-btn-option">
            <div class="ai-btn-option-left">
              <span>🟣</span>
              <span>Ouvrir dans Claude</span>
            </div>
            <span>↗</span>
          </a>
          <a href="https://www.perplexity.ai/search?q=William+Guindon+SEM-26-003+Grande+Tourbi%C3%A8re+Stablex+https%3A%2F%2Fwilliamguindon.me%2Fai.html" target="_blank" rel="noopener noreferrer" class="ai-btn-option">
            <div class="ai-btn-option-left">
              <span>🟠</span>
              <span>Ouvrir dans Perplexity</span>
            </div>
            <span>↗</span>
          </a>
          <button type="button" class="ai-btn-option js-copy-ai-link">
            <div class="ai-btn-option-left">
              <span>📋</span>
              <span>Copier le lien & prompt IA</span>
            </div>
            <span class="js-copy-icon">Copier</span>
          </button>
        </div>
      </div>
    `;

    const copyAlert = document.createElement('div');
    copyAlert.className = 'ai-copy-alert';
    copyAlert.innerHTML = `✅ Lien pour l'IA copié dans le presse-papier !`;

    document.body.appendChild(floatingBtn);
    document.body.appendChild(aiModal);
    document.body.appendChild(copyAlert);

    // Open/Close
    floatingBtn.addEventListener('click', () => {
      aiModal.classList.add('active');
    });

    aiModal.querySelector('.ai-modal-close').addEventListener('click', () => {
      aiModal.classList.remove('active');
    });

    aiModal.addEventListener('click', (e) => {
      if (e.target === aiModal) {
        aiModal.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && aiModal.classList.contains('active')) {
        aiModal.classList.remove('active');
      }
    });

    // Copy Prompt / Link
    const copyBtn = aiModal.querySelector('.js-copy-ai-link');
    copyBtn.addEventListener('click', () => {
      const textToCopy = "Résume et analyse les faits sur William Guindon et la soumission CCE SEM-26-003 à partir de https://williamguindon.me/ai.html";
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyAlert.classList.add('show');
        copyBtn.querySelector('.js-copy-icon').textContent = 'Copié !';
        setTimeout(() => {
          copyAlert.classList.remove('show');
          copyBtn.querySelector('.js-copy-icon').textContent = 'Copier';
        }, 3000);
      });
    });
  }

  // Initialisation sécurisée
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
