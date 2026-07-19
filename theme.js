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

    // Compte à rebours de l'échéance CCE
    function updateCountdown() {
      const daysElement = document.getElementById('countdown-days');
      if (!daysElement) return;

      // Échéance fixée à 60 jours après la décision du 3 juin 2026 (soit le 2 août 2026 à 23h59)
      const targetDate = new Date('2026-08-02T23:59:59').getTime();
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        daysElement.textContent = "Échéance atteinte";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      daysElement.textContent = `${days}j ${hours}h ${mins}m`;
    }

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

    // 5. Gestion des modaux de documents (<dialog>)
    const openDocBtns = document.querySelectorAll('.btn-open-doc');
    
    openDocBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const dialogId = btn.getAttribute('data-dialog');
        const dialog = document.getElementById(dialogId);
        if (dialog) {
          dialog.showModal();
          document.body.style.overflow = 'hidden'; // Bloquer le défilement de l'arrière-plan
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
    
    const timelineNodes = document.querySelectorAll('.timeline-awards li, ul.timeline li, .tl-item');
    timelineNodes.forEach(node => timelineObserver.observe(node));
  });
})();
