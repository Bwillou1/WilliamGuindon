(function () {
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

    // Thème toggle
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

    // Navigation mobile
    if (headerWrap && nav) {
      const hamburgerSvg = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>`;
      const closeSvg = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

      let menuToggle = headerWrap.querySelector('.menu-toggle');
      if (!menuToggle) {
        menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.setAttribute('aria-label', 'Ouvrir le menu de navigation');
        menuToggle.setAttribute('type', 'button');
        menuToggle.innerHTML = hamburgerSvg;
        headerWrap.insertBefore(menuToggle, nav);
      }
      
      let backdrop = document.querySelector('.mobile-nav-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'mobile-nav-backdrop';
        document.body.appendChild(backdrop);
      }

      if (!nav.querySelector('.mobile-nav-header')) {
        const mobileNavHeader = document.createElement('div');
        mobileNavHeader.className = 'mobile-nav-header';
        mobileNavHeader.innerHTML = `
          <span class="mobile-nav-title">Navigation</span>
          <button class="mobile-menu-close-btn" type="button" aria-label="Fermer le menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span>Fermer</span>
          </button>
        `;
        nav.insertBefore(mobileNavHeader, nav.firstChild);
      }

      function closeMobileNav() {
        nav.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-label', 'Ouvrir le menu de navigation');
        menuToggle.innerHTML = hamburgerSvg;
        if (backdrop) backdrop.classList.remove('active');
        document.body.classList.remove('mobile-nav-open');
      }

      function openMobileNav() {
        nav.classList.add('active');
        menuToggle.classList.add('active');
        menuToggle.setAttribute('aria-label', 'Fermer le menu de navigation');
        menuToggle.innerHTML = closeSvg;
        if (backdrop) backdrop.classList.add('active');
        document.body.classList.add('mobile-nav-open');
      }

      menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (nav.classList.contains('active')) {
          closeMobileNav();
        } else {
          openMobileNav();
        }
      });

      const closeBtnInside = nav.querySelector('.mobile-menu-close-btn');
      if (closeBtnInside) {
        closeBtnInside.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeMobileNav();
        });
      }

      backdrop.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileNav();
      });

      nav.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
          closeMobileNav();
        }
      });

      document.addEventListener('click', (e) => {
        if (nav.classList.contains('active') && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
          closeMobileNav();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
          closeMobileNav();
        }
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          closeMobileNav();
        }
      }, { passive: true });
    }

    // Échéance CCE
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

      const isEn = (document.documentElement.lang || '').startsWith('en');
      daysElement.textContent = isEn ? `${days}d ${hours}h ${mins}m` : `${days}j ${hours}h ${mins}m`;
    }

    async function loadDynamicStatus() {
      try {
        const res = await fetch('status.json');
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.prochaine_echeance) {
          cceTargetDate = new Date(data.prochaine_echeance).getTime();
          updateCountdown();
        }

        const badgeState = document.getElementById('cce-live-state');
        if (badgeState) {
          const isEn = (document.documentElement.lang || '').startsWith('en');
          badgeState.textContent = isEn ? (data.etat_en || data.etat_fr) : data.etat_fr;
        }

        const syncDateEl = document.getElementById('cce-sync-date');
        if (syncDateEl && data.derniere_mise_a_jour) {
          syncDateEl.textContent = data.derniere_mise_a_jour;
        }
      } catch (err) {
        // Mode hors-ligne ou fallback statique
      }
    }

    loadDynamicStatus();

    if (document.getElementById('countdown-days')) {
      updateCountdown();
      setInterval(updateCountdown, 60000);
    }

    // Horloge précise (live.html)
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

    if (document.getElementById('cd-days')) {
      updatePrecisionCountdown();
      setInterval(updatePrecisionCountdown, 1000);
    }

    // Modals de visualisation de documents officiels
    const openDocBtns = document.querySelectorAll('.btn-open-doc');
    openDocBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const dialogId = btn.getAttribute('data-dialog');
        const dialog = document.getElementById(dialogId);
        if (dialog) {
          const viewer = dialog.querySelector('.dialog-doc-viewer[data-src]');
          if (viewer && !viewer.querySelector('iframe')) {
            const rawSrc = viewer.getAttribute('data-src') || '';
            const title = viewer.getAttribute('data-title') || 'Document officiel';
            if (/^(viewer\.html\?file=|assets\/docs\/|\.\/|\/)[a-zA-Z0-9_\-\.\?=&%#]+$/.test(rawSrc)) {
              const iframe = document.createElement('iframe');
              iframe.src = encodeURI(rawSrc);
              iframe.title = title;
              iframe.setAttribute('loading', 'lazy');
              viewer.appendChild(iframe);
            }
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
          document.body.style.overflow = '';
        }
      });
    });

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
      dialog.addEventListener('cancel', () => {
        document.body.style.overflow = '';
      });
    });

    // Synthèse vocale de la biographie
    const audioBtn = document.getElementById('btn-audio-read');
    if (audioBtn) {
      let isSpeaking = false;
      const statusLabel = document.getElementById('audio-status-text');
      const lang = document.documentElement.lang || 'fr-CA';

      audioBtn.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) {
          alert("La synthèse vocale n'est pas supportée par votre navigateur.");
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
          if (statusLabel) statusLabel.textContent = lang.startsWith('en') ? 'Reading...' : (lang.startsWith('es') ? 'Leyendo...' : 'Lecture audio...');
        }
      });
    }

    // Courriel sécurisé obfusqué
    const secureMailBtns = document.querySelectorAll('.js-secure-mail');
    secureMailBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const k = 85;
        const u = [50, 32, 60, 59, 49, 58, 59, 34, 60, 57, 57, 60, 52, 56, 103].map(c => String.fromCharCode(c ^ k)).join('');
        const d = [50, 56, 52, 60, 57, 123, 54, 58, 56].map(c => String.fromCharCode(c ^ k)).join('');
        const lang = document.documentElement.lang || 'fr';
        const subj = lang.startsWith('en') 
          ? encodeURIComponent("Media / Citizen Inquiry — William Guindon") 
          : (lang.startsWith('es') 
            ? encodeURIComponent("Contacto Medios / Ciudadanos — William Guindon") 
            : encodeURIComponent("Contact Médias / Citoyens — William Guindon"));
        window.location.href = 'mai' + 'lto:' + u + '@' + d + '?subject=' + subj;
      });
    });

    // Copie de communiqué presse
    const copyPrBtns = document.querySelectorAll('.js-copy-pr');
    copyPrBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const prContainer = document.querySelector('.press-release-container') || document.querySelector('.communique-paper');
        if (!prContainer) return;
        try {
          await navigator.clipboard.writeText(prContainer.innerText);
          const oldHtml = btn.innerHTML;
          btn.innerHTML = 'Communiqué copié !';
          setTimeout(() => { btn.innerHTML = oldHtml; }, 3000);
        } catch (err) {
          console.error('Erreur copie:', err);
        }
      });
    });

    // Carrousel de presse (défilement contrôlé sans saut de layout)
    const carouselWrapper = document.querySelector('.press-carousel-wrapper');
    const carouselContainer = document.querySelector('.press-carousel-container');
    const prevBtn = document.querySelector('.js-carousel-prev');
    const nextBtn = document.querySelector('.js-carousel-next');
    const dots = document.querySelectorAll('.carousel-dot');
    const cards = carouselContainer ? carouselContainer.querySelectorAll('.press-card') : [];

    if (carouselContainer && cards.length > 0) {
      let currentIndex = 0;

      const getGap = () => 20;
      const getCardWidth = () => cards[0] ? cards[0].getBoundingClientRect().width : 320;
      const getVisibleCards = () => {
        const wrapWidth = carouselWrapper ? carouselWrapper.getBoundingClientRect().width : window.innerWidth;
        return Math.max(1, Math.floor(wrapWidth / (getCardWidth() + getGap())));
      };
      const getMaxIndex = () => Math.max(0, cards.length - getVisibleCards());

      const updateSlider = (index) => {
        const maxIdx = getMaxIndex();
        currentIndex = Math.max(0, Math.min(index, maxIdx));
        const offset = currentIndex * (getCardWidth() + getGap());

        carouselContainer.style.transition = 'transform 0.3s ease';
        carouselContainer.style.transform = `translateX(-${offset}px)`;

        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === currentIndex);
        });

        if (prevBtn) {
          prevBtn.style.opacity = currentIndex === 0 ? '0.4' : '1';
          prevBtn.style.cursor = currentIndex === 0 ? 'default' : 'pointer';
        }
        if (nextBtn) {
          nextBtn.style.opacity = currentIndex >= maxIdx ? '0.4' : '1';
          nextBtn.style.cursor = currentIndex >= maxIdx ? 'default' : 'pointer';
        }
      };

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (currentIndex > 0) updateSlider(currentIndex - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const maxIdx = getMaxIndex();
          if (currentIndex < maxIdx) updateSlider(currentIndex + 1);
          else updateSlider(0);
        });
      }

      dots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          updateSlider(idx);
        });
      });

      window.addEventListener('resize', () => {
        updateSlider(currentIndex);
      }, { passive: true });

      updateSlider(0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
