/**
 * theme-core.js — William Guindon (williamguindon.me)
 * Module central : Thème (clair/sombre), Navigation, Sélecteur de langue,
 * Décompte officiel CCE SEM-26-003, Lecteur audio biographie,
 * Notifications Push, Calendrier ICS et utilitaires globaux.
 */
(function () {
  'use strict';

  const DEBUG = false;
  const themeStorageKey = 'william-guindon-theme';

  function getInitialTheme() {
    const savedTheme = sessionStorage.getItem(themeStorageKey);
    if (savedTheme) {
      return savedTheme;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  const currentTheme = getInitialTheme();
  document.documentElement.setAttribute('data-theme', currentTheme);

  const sunIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41z"/></svg>`;
  const moonIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.3 22c5.3 0 9.7-4.3 9.7-9.7 0-2.7-1.1-5.1-2.9-6.9-.5-.5-1.3-.1-1.2.6.7 3.5-.3 7.3-3 10-2.7 2.7-6.5 3.7-10 3-.7-.1-1.1.7-.6 1.2 1.8 1.8 4.2 2.8 6.8 2.8zm-2.8-5c2.7-.2 5.1-1.5 6.8-3.5C13 13.3 10 9.9 10 6c0-.8.1-1.6.3-2.4C7.4 4.5 5 7.4 5 10.9 5 14.3 7 16.7 9.5 17z"/></svg>`;

  // Gestionnaire de traduction in-place (FR / EN / ES)
  function setGoogTransCookie(lang) {
    const host = window.location.hostname;
    const domainParts = host.split('.');
    const rootDomain = domainParts.length > 1 ? '.' + domainParts.slice(-2).join('.') : '.' + host;

    if (!lang || lang === 'fr') {
      const expire = "expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      const paths = ['/', window.location.pathname];
      paths.forEach(p => {
        document.cookie = `googtrans=; ${expire} path=${p};`;
        document.cookie = `googtrans=; ${expire} path=${p}; domain=${host};`;
        document.cookie = `googtrans=; ${expire} path=${p}; domain=${rootDomain};`;
      });
    } else {
      const values = [`/fr/${lang}`, `/auto/${lang}`];
      values.forEach(val => {
        document.cookie = `googtrans=${val}; path=/; SameSite=Lax;`;
        document.cookie = `googtrans=${val}; path=/; domain=${host}; SameSite=Lax;`;
        document.cookie = `googtrans=${val}; path=/; domain=${rootDomain}; SameSite=Lax;`;
      });
    }
  }

  function triggerGoogleTranslateCombo(lang) {
    const combo = document.querySelector('.goog-te-combo');
    if (!combo || !combo.options || combo.options.length === 0) return false;

    let matchedIndex = -1;
    for (let i = 0; i < combo.options.length; i++) {
      if (combo.options[i].value.toLowerCase() === lang.toLowerCase()) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex >= 0) {
      combo.selectedIndex = matchedIndex;
      combo.value = combo.options[matchedIndex].value;
      if (typeof combo.onchange === 'function') {
        try { combo.onchange(); } catch(_) {}
      }
      combo.dispatchEvent(new Event('change', { bubbles: true }));
      combo.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  }

  function ensureGoogleTranslateLoaded(cb) {
    let gDiv = document.getElementById('google_translate_element');
    if (!gDiv) {
      gDiv = document.createElement('div');
      gDiv.id = 'google_translate_element';
      gDiv.style.cssText = 'display:none;position:absolute;top:-9999px;left:-9999px;';
      document.body.appendChild(gDiv);
    }

    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = function() {
        try {
          if (window.google && window.google.translate && window.google.translate.TranslateElement) {
            new window.google.translate.TranslateElement({
              pageLanguage: 'fr',
              includedLanguages: 'fr,en,es',
              autoDisplay: false
            }, 'google_translate_element');
            if (typeof cb === 'function') cb();
          }
        } catch (e) {
          if (DEBUG) console.warn('GT Init:', e);
        }
      };
    }

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    } else if (window.google && window.google.translate && typeof cb === 'function') {
      cb();
    }
  }

  function applyLanguage(targetLang) {
    const codeEl = document.querySelector('.nav-lang-dropdown .current-lang-code');
    if (codeEl) codeEl.textContent = targetLang.toUpperCase();

    const items = document.querySelectorAll('.nav-lang-dropdown .lang-select-btn');
    items.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === targetLang);
    });

    if (targetLang === 'fr') {
      sessionStorage.removeItem('wg_user_lang');
      localStorage.removeItem('wg_user_lang');
      setGoogTransCookie(null);
      if (triggerGoogleTranslateCombo('fr')) {
        setTimeout(() => { window.location.reload(); }, 200);
      } else {
        window.location.reload();
      }
      return;
    }

    sessionStorage.setItem('wg_user_lang', targetLang);
    localStorage.setItem('wg_user_lang', targetLang);
    setGoogTransCookie(targetLang);

    ensureGoogleTranslateLoaded(() => {
      if (!triggerGoogleTranslateCombo(targetLang)) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (triggerGoogleTranslateCombo(targetLang) || attempts > 20) {
            clearInterval(interval);
          }
        }, 150);
      }
    });
  }

  function initApp() {
    // Module IA documentaire global (accessible sur l'ensemble des pages)
    if (!document.querySelector('script[src*="chat-ai.js"]')) {
      const chatScript = document.createElement('script');
      chatScript.src = (window.location.protocol === 'file:' ? '' : '/') + 'assets/js/chat-ai.js?v=20260920-v1';
      chatScript.defer = true;
      document.head.appendChild(chatScript);
    }

    const nav = document.querySelector('header.site nav');
    const headerWrap = document.querySelector('header.site .wrap');


    // Intégration du sélecteur de langue unique (FR / EN / ES)
    if (nav) {
      let langDropdown = nav.querySelector('.nav-lang-dropdown');
      if (!langDropdown) {
        langDropdown = document.createElement('div');
        langDropdown.className = 'nav-dropdown nav-lang-dropdown';

        const savedLang = sessionStorage.getItem('wg_user_lang') || localStorage.getItem('wg_user_lang') || 'fr';
        const currentLangUpper = (savedLang === 'en' ? 'EN' : savedLang === 'es' ? 'ES' : 'FR');

        langDropdown.innerHTML = `
          <button class="nav-dropdown-btn nav-lang-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-label="Langue / Language">
            <svg class="svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span class="current-lang-code">${currentLangUpper}</span>
            <span>▾</span>
          </button>
          <div class="nav-dropdown-menu nav-lang-menu" role="menu">
            <span class="nav-dropdown-group-title">Langue / Language</span>
            <button type="button" class="nav-dropdown-item lang-select-btn ${savedLang === 'fr' ? 'active' : ''}" data-lang="fr" role="menuitem">
              <span class="lang-name">Français</span>
              <span class="lang-tag">FR</span>
            </button>
            <button type="button" class="nav-dropdown-item lang-select-btn ${savedLang === 'en' ? 'active' : ''}" data-lang="en" role="menuitem">
              <span class="lang-name">English</span>
              <span class="lang-tag">EN</span>
            </button>
            <button type="button" class="nav-dropdown-item lang-select-btn ${savedLang === 'es' ? 'active' : ''}" data-lang="es" role="menuitem">
              <span class="lang-name">Español</span>
              <span class="lang-tag">ES</span>
            </button>
          </div>
        `;

        const notifDropdown = nav.querySelector('.nav-notif-dropdown');
        if (notifDropdown) {
          nav.insertBefore(langDropdown, notifDropdown);
        } else {
          nav.appendChild(langDropdown);
        }

        langDropdown.querySelectorAll('.lang-select-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetLang = btn.getAttribute('data-lang');
            langDropdown.classList.remove('active');
            const navBtn = langDropdown.querySelector('.nav-dropdown-btn');
            if (navBtn) {
              navBtn.setAttribute('aria-expanded', 'false');
              navBtn.blur();
            }
            applyLanguage(targetLang);
          });
        });

        if (savedLang && savedLang !== 'fr') {
          applyLanguage(savedLang);
        }
      }

      // Bouton Recherche Rapide Globale (Cmd+K)
      let searchBtn = nav.querySelector('.nav-search-btn');
      if (!searchBtn) {
        searchBtn = document.createElement('button');
        searchBtn.className = 'nav-search-btn';
        searchBtn.type = 'button';
        searchBtn.setAttribute('aria-label', 'Recherche instantanée (⌘K)');
        searchBtn.innerHTML = `
          <svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span class="nav-search-text">Recherche</span>
          <kbd class="nav-search-kbd">⌘K</kbd>
        `;
        nav.insertBefore(searchBtn, nav.firstChild);
        searchBtn.addEventListener('click', () => openQuickSearch());
      }


      // Bouton Mode Sombre / Clair
      let toggleBtn = nav.querySelector('.theme-toggle-btn');
      if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-label', 'Basculer le mode sombre / clair');
        nav.appendChild(toggleBtn);
      }

      const allThemeBtns = nav.querySelectorAll('.theme-toggle-btn');
      for (let i = 1; i < allThemeBtns.length; i++) {
        allThemeBtns[i].remove();
      }

      const theme = document.documentElement.getAttribute('data-theme');
      toggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;

      toggleBtn.onclick = () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        sessionStorage.setItem(themeStorageKey, newTheme);
        toggleBtn.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
      };
    }

    // Menu Mobile
    if (headerWrap && nav) {
      const hamburgerSvg = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>`;
      const closeSvg = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

      let menuToggle = headerWrap.querySelector('.menu-toggle');
      if (!menuToggle) {
        menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.type = 'button';
        menuToggle.setAttribute('aria-label', 'Menu principal');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = hamburgerSvg;
        headerWrap.appendChild(menuToggle);
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
          <button type="button" class="mobile-menu-close-btn" aria-label="Fermer le menu">
            ${closeSvg}
          </button>
        `;
        nav.insertBefore(mobileNavHeader, nav.firstChild);
      }

      function closeMobileNav() {
        nav.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.classList.remove('no-scroll');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = hamburgerSvg;
      }

      function openMobileNav() {
        nav.classList.add('active');
        backdrop.classList.add('active');
        document.body.classList.add('no-scroll');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.innerHTML = closeSvg;
      }

      menuToggle.addEventListener('click', (e) => {
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
          e.stopPropagation();
          closeMobileNav();
        });
      }

      backdrop.addEventListener('click', () => {
        closeMobileNav();
      });

      nav.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && !link.closest('.nav-dropdown-menu') && !link.closest('.nav-lang-menu') && !link.closest('.nav-notif-menu')) {
          const dropdownsToClose = document.querySelectorAll('.nav-dropdown, .nav-notif-dropdown');
          dropdownsToClose.forEach(d => {
            d.classList.remove('active');
            const btn = d.querySelector('.nav-dropdown-btn, .nav-notif-btn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          });
          closeMobileNav();
        }
      });

      document.addEventListener('click', (e) => {
        if (nav.classList.contains('active') && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
          closeMobileNav();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('active')) {
          closeMobileNav();
        }
      });

      let scrollTicking = false;
      window.addEventListener('scroll', () => {
        if (!scrollTicking) {
          window.requestAnimationFrame(() => {
            const header = headerWrap.closest('header.site');
            if (window.scrollY > 40) {
              header?.classList.add('scrolled');
            } else {
              header?.classList.remove('scrolled');
            }
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      }, { passive: true });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 960 && nav.classList.contains('active')) {
          closeMobileNav();
        }
      });
    }

    // Date calendaire de l'échéance CCE SEM-26-003 (début de journée 00:00:00, pas fin de journée)
    let cceTargetDate = new Date('2026-10-16T00:00:00-04:00').getTime();

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
          const isEn = document.documentElement.lang.startsWith('en');
          badgeState.textContent = isEn ? (data.etat_en || data.etat_fr) : data.etat_fr;
        }

        const syncDateEl = document.getElementById('cce-sync-date');
        if (syncDateEl && data.derniere_mise_a_jour) {
          syncDateEl.textContent = data.derniere_mise_a_jour;
        }
      } catch (err) {
        if (DEBUG) console.warn('Statut CCE local utilisé (impossible de charger status.json)', err);
      }
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => loadDynamicStatus(), { timeout: 3500 });
    } else {
      setTimeout(loadDynamicStatus, 2500);
    }

    if (document.getElementById('countdown-days')) {
      updateCountdown();
      setInterval(updateCountdown, 60000);
    }

    const openDocBtns = document.querySelectorAll('.btn-open-doc');
    openDocBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const docName = btn.getAttribute('data-doc');
        if (docName) {
          sessionStorage.setItem('last_opened_doc', docName);
        }
      });
    });

    const shareButtons = document.querySelectorAll('.btn-share-cce');
    shareButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const title = btn.getAttribute('data-title') || document.title;
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch (_) {}
        } else {
          try {
            await navigator.clipboard.writeText(url);
            const original = btn.textContent;
            btn.textContent = 'Lien copié !';
            setTimeout(() => { btn.textContent = original; }, 2000);
          } catch (_) {}
        }
      });
    });

    // Modale de dialogue accessible
    const docLinks = document.querySelectorAll('.doc-link-preview');
    docLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && (href.endsWith('.pdf') || href.includes('viewer.html'))) {
          // Navigation directe standard
        }
      });
    });

    // Lecteur audio biographie
    const bioCues = [
      { start: 0, end: 45, selector: '#bio-p1' },
      { start: 45, end: 120, selector: '#bio-p2' },
      { start: 120, end: 210, selector: '#bio-p3' },
      { start: 210, end: 320, selector: '#bio-p4' },
      { start: 320, end: 480, selector: '#bio-p5' }
    ];

    let bioAudio = null;
    let floatingPlayer = null;
    let activeCueIndex = -1;

    function formatTime(secs) {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function ensureFloatingPlayer() {
      if (floatingPlayer) return floatingPlayer;

      floatingPlayer = document.createElement('div');
      floatingPlayer.className = 'bio-floating-player';
      floatingPlayer.innerHTML = `
        <div class="bio-floating-player-content">
          <div class="bio-player-track-info">
            <span class="bio-player-badge">Audio</span>
            <span class="bio-player-title">Biographie officielle</span>
            <span id="bio-player-time" class="bio-player-time">0:00 / 8:00</span>
          </div>
          <div class="bio-player-controls">
            <button type="button" class="bio-btn-ctrl" id="bio-btn-rewind" aria-label="Reculer de 10 secondes">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 19l-9-7 9-7v14z"></path><path d="M22 19l-9-7 9-7v14z"></path></svg>
            </button>
            <button type="button" class="bio-btn-ctrl bio-btn-play-pause" id="bio-btn-play-pause" aria-label="Lecture / Pause">
              <span id="bio-play-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </span>
            </button>
            <button type="button" class="bio-btn-ctrl" id="bio-btn-forward" aria-label="Avancer de 10 secondes">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 19l9-7-9-7v14z"></path><path d="M2 19l9-7-9-7v14z"></path></svg>
            </button>
            <button type="button" class="bio-btn-ctrl bio-btn-close" id="bio-btn-close" aria-label="Fermer le lecteur">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(floatingPlayer);

      const btnPlayPause = floatingPlayer.querySelector('#bio-btn-play-pause');
      const btnRewind = floatingPlayer.querySelector('#bio-btn-rewind');
      const btnForward = floatingPlayer.querySelector('#bio-btn-forward');
      const btnClose = floatingPlayer.querySelector('#bio-btn-close');

      btnRewind.addEventListener('click', (e) => {
        e.stopPropagation();
        if (bioAudio) bioAudio.currentTime = Math.max(0, bioAudio.currentTime - 10);
      });

      btnForward.addEventListener('click', (e) => {
        e.stopPropagation();
        if (bioAudio) bioAudio.currentTime = Math.min(bioAudio.duration || 480, bioAudio.currentTime + 10);
      });

      btnPlayPause.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!bioAudio) return;
        if (bioAudio.paused) {
          bioAudio.play().catch(err => { if (DEBUG) console.warn('Audio play error:', err); });
        } else {
          bioAudio.pause();
        }
      });

      btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        stopBioAudio();
      });

      return floatingPlayer;
    }

    function initBioAudio() {
      if (bioAudio) return bioAudio;

      bioAudio = document.createElement('audio');
      bioAudio.preload = 'none';

      const sourceOpus = document.createElement('source');
      sourceOpus.src = 'assets/Audio/biographie-complete.opus';
      sourceOpus.type = 'audio/ogg; codecs=opus';
      bioAudio.appendChild(sourceOpus);

      const sourceMp3 = document.createElement('source');
      sourceMp3.src = 'assets/Audio/biographie-complete.mp3';
      sourceMp3.type = 'audio/mpeg';
      bioAudio.appendChild(sourceMp3);

      bioAudio.addEventListener('loadedmetadata', () => {
        const timeEl = document.getElementById('bio-player-time');
        if (timeEl && bioAudio.duration) {
          timeEl.textContent = `${formatTime(bioAudio.currentTime)} / ${formatTime(bioAudio.duration)}`;
        }
      });

      bioAudio.addEventListener('timeupdate', () => {
        const ct = bioAudio.currentTime;
        const dur = bioAudio.duration || 480.7;

        const timeEl = document.getElementById('bio-player-time');
        if (timeEl) timeEl.textContent = `${formatTime(ct)} / ${formatTime(dur)}`;

        let foundIndex = -1;
        for (let i = 0; i < bioCues.length; i++) {
          if (ct >= bioCues[i].start && ct < bioCues[i].end) {
            foundIndex = i;
            break;
          }
        }

        if (foundIndex !== activeCueIndex) {
          activeCueIndex = foundIndex;
          document.querySelectorAll('.bio-read-block').forEach(el => el.classList.remove('active-speech-cue'));

          if (activeCueIndex >= 0) {
            const cue = bioCues[activeCueIndex];
            const targetEl = document.querySelector(cue.selector);
            if (targetEl) {
              targetEl.classList.add('active-speech-cue');
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      });

      bioAudio.addEventListener('play', () => {
        document.body.classList.add('bio-reading-active');
        const fp = ensureFloatingPlayer();
        fp.classList.add('visible');
        const icon = document.getElementById('bio-play-icon');
        if (icon) icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
        const audioBtn = document.getElementById('btn-listen-bio');
        if (audioBtn) {
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> <span>Pause / Arrêter</span>`;
        }
      });

      bioAudio.addEventListener('pause', () => {
        const icon = document.getElementById('bio-play-icon');
        if (icon) icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        const audioBtn = document.getElementById('btn-listen-bio');
        if (audioBtn) {
          audioBtn.classList.remove('playing');
          audioBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> <span>Écouter la biographie</span>`;
        }
      });

      bioAudio.addEventListener('ended', () => {
        stopBioAudio();
      });

      bioAudio.addEventListener('error', (err) => {
        if (DEBUG) console.warn('Erreur de lecture audio:', err);
        stopBioAudio();
      });

      return bioAudio;
    }

    function stopBioAudio() {
      if (bioAudio) {
        bioAudio.pause();
        bioAudio.currentTime = 0;
      }
      if (floatingPlayer) {
        floatingPlayer.classList.remove('visible');
      }
      document.body.classList.remove('bio-reading-active');
      document.querySelectorAll('.bio-read-block').forEach(el => el.classList.remove('active-speech-cue'));
      const audioBtn = document.getElementById('btn-listen-bio');
      if (audioBtn) {
        audioBtn.classList.remove('playing');
        audioBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> <span>Écouter la biographie</span>`;
      }
    }

    const audioBtn = document.getElementById('btn-listen-bio');
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const player = initBioAudio();
        if (player.paused) {
          player.play().catch(err => {
            if (DEBUG) console.warn('Lecture audio bloquée ou non disponible:', err);
          });
        } else {
          player.pause();
        }
      });
    }

    // Décompte de précision (secondes)
    function updatePrecisionCountdown() {
      const targetDate = new Date('2026-10-16T00:00:00-04:00').getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate - now);

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

    if (document.getElementById('cd-days') || document.getElementById('cd-hours')) {
      updatePrecisionCountdown();
      setInterval(updatePrecisionCountdown, 1000);
    }

    // PWA & Service Worker avec vérification instantanée des mises à jour
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            // Forcer la vérification de mise à jour dès l'ouverture
            reg.update().catch(() => {});

            // Si un nouveau worker est en attente, le promouvoir immédiatement
            if (reg.waiting) {
              reg.waiting.postMessage('SKIP_WAITING');
            }

            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    newWorker.postMessage('SKIP_WAITING');
                  }
                });
              }
            });

            checkBackgroundFeedUpdates(reg);
          })
          .catch((err) => { if (DEBUG) console.log('SW registration skipped:', err); });
      });

      // Rechargement transparent sans cache lors du déploiement d'une nouvelle version
      let isRefreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!isRefreshing) {
          isRefreshing = true;
          window.location.reload();
        }
      });

      // Re-vérifier l'état du site dès que l'utilisateur revient sur l'onglet
      window.addEventListener('focus', () => {
        navigator.serviceWorker.getRegistration().then(reg => reg?.update().catch(() => {}));
      });
    }

    const dropdowns = document.querySelectorAll('.nav-dropdown');
    const notifDropdowns = document.querySelectorAll('.nav-notif-dropdown');

    try {
      const currentPath = window.location.pathname.split('/').pop() || 'index.html';
      dropdowns.forEach((dropdown) => {
        const links = dropdown.querySelectorAll('.nav-dropdown-item');
        const isChildActive = Array.from(links).some(a => {
          const href = a.getAttribute('href');
          if (!href) return false;
          const page = href.split('#')[0].split('/').pop();
          return page && (page === currentPath || (currentPath === '' && page === 'index.html'));
        });
        if (isChildActive && currentPath !== 'index.html' && currentPath !== '') {
          dropdown.querySelector('.nav-dropdown-btn')?.classList.add('nav-rubrique-active');
        }
      });
    } catch (_) {}

    dropdowns.forEach((dropdown) => {
      const btn = dropdown.querySelector('.nav-dropdown-btn');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        notifDropdowns.forEach(nd => {
          nd.classList.remove('active');
          const nb = nd.querySelector('.nav-notif-btn');
          if (nb) nb.setAttribute('aria-expanded', 'false');
        });

        // Fermer les autres menus déroulants
        dropdowns.forEach(d => {
          if (d !== dropdown) {
            d.classList.remove('active');
            const otherBtn = d.querySelector('.nav-dropdown-btn');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        const isOpen = dropdown.classList.toggle('active');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      const items = dropdown.querySelectorAll('.nav-dropdown-item');
      items.forEach(item => {
        item.addEventListener('click', () => {
          if (window.innerWidth > 992) {
            dropdown.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
          } else {
            // Sur mobile, laisser la navigation se produire et fermer proprement le menu
            setTimeout(() => {
              dropdown.classList.remove('active');
              btn.setAttribute('aria-expanded', 'false');
              const navEl = document.querySelector('header.site nav, nav');
              const backdropEl = document.querySelector('.mobile-nav-backdrop');
              const toggleEl = document.querySelector('.menu-toggle');
              if (navEl) navEl.classList.remove('active');
              if (backdropEl) backdropEl.classList.remove('active');
              document.body.classList.remove('no-scroll');
              if (toggleEl) toggleEl.setAttribute('aria-expanded', 'false');
            }, 80);
          }
        });
      });

      dropdown.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdown.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      });
    });

    notifDropdowns.forEach((dropdown) => {
      const btn = dropdown.querySelector('.nav-notif-btn');
      const menu = dropdown.querySelector('.nav-notif-menu');
      const closeBtn = dropdown.querySelector('.nav-notif-close-btn');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        dropdowns.forEach(d => {
          d.classList.remove('active');
          const db = d.querySelector('.nav-dropdown-btn');
          if (db) db.setAttribute('aria-expanded', 'false');
        });

        const isOpen = dropdown.classList.toggle('active');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (isOpen && menu) {
          menu.focus();
        }
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        });
      }

      dropdown.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdown.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        dropdowns.forEach(d => {
          d.classList.remove('active');
          const btn = d.querySelector('.nav-dropdown-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
      if (!e.target.closest('.nav-notif-dropdown')) {
        notifDropdowns.forEach(d => {
          d.classList.remove('active');
          const btn = d.querySelector('.nav-notif-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Web Push / Notifications de l'échéance CCE du 16 octobre 2026
    const notifButtons = document.querySelectorAll('#btn-enable-push, .btn-enable-push, [data-action="enable-cce-push"]');
    const TARGET_16_OCT = new Date("2026-10-16T00:00:00-04:00").getTime();

    function updateNotifButtonsState() {
      const supported = 'Notification' in window;
      notifButtons.forEach(btn => {
        if (!supported) {
          btn.disabled = true;
          btn.textContent = 'Push non supporté';
          return;
        }
        if (Notification.permission === 'granted') {
          btn.classList.add('subscribed');
          btn.innerHTML = '<span aria-hidden="true">✓</span> Alerte 16 oct. activée';
        } else if (Notification.permission === 'denied') {
          btn.disabled = true;
          btn.innerHTML = 'Bloqué par le navigateur';
        } else {
          btn.classList.remove('subscribed');
          btn.innerHTML = '<span aria-hidden="true">🔔</span> M\'alerter le 16 octobre 2026';
        }
      });
    }

    if (notifButtons.length > 0) {
      updateNotifButtonsState();

      notifButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!('Notification' in window)) return;
          try {
            const perm = await Notification.requestPermission();
            updateNotifButtonsState();
            if (perm === 'granted') {
              // Notification de confirmation immédiate
              if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                const reg = await navigator.serviceWorker.ready;
                if (reg.showNotification) {
                  reg.showNotification("Dossier SEM-26-003 · CCE / ACEUM", {
                    body: "Alerte programmée avec succès : vous recevrez une notification le 16 octobre 2026 dès l'échéance officielle imposée au Canada.",
                    icon: "/icon-192.png",
                    badge: "/favicon.svg",
                    tag: "cce-confirm-subscription"
                  });
                }
                if (navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage('CHECK_DEADLINE');
                }
              }
              // Si déjà le 16 octobre ou après
              if (Date.now() >= TARGET_16_OCT && !localStorage.getItem('wg_deadline_notif_fired')) {
                localStorage.setItem('wg_deadline_notif_fired', 'true');
                new Notification("🚨 ÉCHÉANCE CCE ATTEINTE — 16 OCTOBRE 2026", {
                  body: "Le délai légal de 60 jours imposé au Canada pour répondre sur la Grande Tourbière de Blainville (SEM-26-003) est échu.",
                  icon: "/icon-192.png"
                });
              }
            }
          } catch (err) {
            if (DEBUG) console.warn('Erreur permission notification:', err);
          }
        });
      });
    }

    // Vérification automatique au chargement si l'échéance du 16 octobre 2026 est atteinte
    if ('Notification' in window && Notification.permission === 'granted' && Date.now() >= TARGET_16_OCT) {
      if (!localStorage.getItem('wg_deadline_notif_fired')) {
        localStorage.setItem('wg_deadline_notif_fired', 'true');
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(reg => {
            if (reg.showNotification) {
              reg.showNotification("🚨 ÉCHÉANCE CCE ATTEINTE — 16 OCTOBRE 2026", {
                body: "Le délai officiel de 60 jours accordé au Canada dans le dossier SEM-26-003 (Grande Tourbière de Blainville / Stablex) est échu.",
                icon: "/icon-192.png",
                badge: "/favicon.svg",
                tag: "cce-deadline-16oct2026",
                requireInteraction: true,
                data: { url: "/live.html" }
              });
            }
          });
        }
      }
    }

    function checkBackgroundFeedUpdates(reg) {
      if (!('periodicSync' in reg)) return;
      try {
        reg.periodicSync.register('check-cce-deadline', {
          minInterval: 12 * 60 * 60 * 1000
        });
      } catch (_) {}
    }

    // Boutons de copie
    // Boutons d'impression légale
    document.querySelectorAll('.legal-print-button').forEach(btn => {
      btn.addEventListener('click', () => window.print());
    });

    // Boutons de contact courriel
    document.querySelectorAll('.js-secure-mail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'mailto:contact@williamguindon.me';
      });
    });

    const copyBtns = document.querySelectorAll('.btn-copy-id, .btn-copy-session, .btn-copy-box, .js-copy-trigger, .btn-copy-fact');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        let textToCopy = btn.getAttribute('data-copy');
        const targetId = btn.getAttribute('data-target');
        if (!textToCopy && targetId) {
          const targetEl = document.getElementById(targetId);
          if (targetEl) textToCopy = targetEl.innerText.trim();
        }
        if (!textToCopy) {
          const parentBox = btn.closest('.copybox, .ai-press-box');
          if (parentBox) {
            const contentEl = parentBox.querySelector('.copybox-content, .ai-press-code, p');
            if (contentEl) textToCopy = contentEl.innerText.trim();
          }
        }
        if (!textToCopy) return;

        try {
          await navigator.clipboard.writeText(textToCopy);
          const originalText = btn.innerHTML;
          btn.innerHTML = '<svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copié !</span>';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          if (DEBUG) console.error('Erreur copie:', err);
          const originalText = btn.innerHTML;
          btn.innerHTML = '<span>Échec copie</span>';
          setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        }
      });
    });

    // Génération et téléchargement de calendrier natif (.ics)
    function generateAndDownloadCceIcs() {
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//William Guindon//Dossier CCE SEM-26-003//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:cce-sem-26-003-echeance-20261016@williamguindon.me',
        'DTSTAMP:20260905T180000Z',
        'DTSTART;VALUE=DATE:20261016',
        'DTEND;VALUE=DATE:20261017',
        'SUMMARY:Échéance CCE SEM-26-003 — Réponse officielle requise du Canada',
        'DESCRIPTION:Date limite officielle fixée par la Commission de coopération environnementale (CCE / ACEUM Art. 24.27(3)) au gouvernement fédéral canadien pour répondre formellement à la soumission SEM-26-003 visant la protection de la Grande Tourbière de Blainville face aux déchets dangereux Stablex.\\n\\nSuivi en direct : https://williamguindon.me/live.html\\nRegistre documentaire : https://williamguindon.me/registre.html',
        'LOCATION:Commission de coopération environnementale (CCE), Montréal, QC, Canada',
        'URL:https://williamguindon.me/live.html',
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Rappel J-1 : Échéance officielle CCE pour la réponse du Canada (SEM-26-003)',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ];

      const icsData = icsLines.join('\r\n');
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.setAttribute('download', 'echeance-cce-sem-26-003-16-octobre-2026.ics');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    }

    document.querySelectorAll('.btn-add-cce-calendar, [data-action="add-cce-calendar"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        generateAndDownloadCceIcs();
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span aria-hidden="true"><svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Ajouté (.ics téléchargé) !';
        btn.style.pointerEvents = 'none';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.pointerEvents = '';
        }, 3000);
      });
    });

    window.downloadCceIcs = generateAndDownloadCceIcs;

    initQuickSearch();
    initScrollReveal();
    handleLowBandwidth();
  }

  // --- RECHERCHE INSTANTANÉE GLOBALE (CMD+K / CTRL+K) ---
  const SEARCH_INDEX = [
    // Pages principales
    { title: "Accueil & Biographie Officielle", desc: "William Guindon, démarche citoyenne SEM-26-003 et faits officiels", url: "index.html", tag: "Page" },
    { title: "Registre CCE SEM-26-003", desc: "Portail officiel intégré de la Commission de coopération environnementale", url: "registre.html", tag: "Registre" },
    { title: "Enquête Citoyenne : Partis Politiques", desc: "Positionnement des partis québécois et fédéraux face à Stablex", url: "enquete-partis.html", tag: "Rapport" },
    { title: "Revue de Presse & Couverture Médiatique", desc: "Radio-Canada, Le Devoir, La Presse, The Rover, TVBL, Les As de l'info", url: "presse.html", tag: "Presse" },
    { title: "Dossier Stablex & Grande Tourbière", desc: "Enjeux de la cellule 6 et sauvegarde des milieux humides de Blainville", url: "stablex.html", tag: "Dossier" },
    { title: "Communiqués Officiels", desc: "Avis publics, annonces et déclarations de presse de William Guindon", url: "communiques.html", tag: "Presse" },
    { title: "Horloge Live — Échéance 16 Octobre 2026", desc: "Compte à rebours temps réel de la réponse obligatoire du Canada", url: "live.html", tag: "Direct" },
    { title: "Lecteur de Documents PDF Officiels", desc: "Visionneuse haute fidélité des décisions CCE et soumissions intégrales", url: "viewer.html", tag: "Documents" },
    { title: "Espace IA & Registre Technique", desc: "Hub de données ouvertes, prompt ai.txt et exports pour modèles LLM", url: "ai.html", tag: "IA" },
    { title: "Version Texte Ultra-Légère", desc: "Édition textuelle éco-conçue sans JavaScript pour connexions lentes", url: "txt.html", tag: "Éco" },
    { title: "Galerie Photos & Milieux Naturels", desc: "Photographies authentiques de la Grande Tourbière de Blainville", url: "photos.html", tag: "Photos" },
    { title: "Messagerie Chiffrée & Lanceurs d'alerte", desc: "Canal confidentiel anonyme de bout en bout (Nostr / Session)", url: "messagerie.html", tag: "Sécurité" },
    { title: "Ligne Déontologique & Indépendance", desc: "Autonomie citoyenne intégrale et refus de tout financement partisan", url: "deontologie.html", tag: "Éthique" },
    { title: "Miroirs Décentralisés (IPFS / Tor)", desc: "Accès permanent Web3 IPFS, Service Caché Tor v3 et intégrité SHA-256", url: "miroirs.html", tag: "Miroirs" },
    { title: "Politique Anti-SLAPP & Protection", desc: "Protection juridique contre les poursuites-bâillons et intimidation", url: "anti-slapp.html", tag: "Droit" },
    { title: "Traçabilité & Empreintes SHA-256", desc: "Intégrité cryptographique et archivage immuable des pièces", url: "tracabilite.html", tag: "Sécurité" },

    // Lois & Articles Juridiques
    { title: "Loi 93 (Québec - Bâillon du 28 mars 2025)", desc: "Expropriation forcée des terrains municipaux et clauses privatives", url: "stablex.html#loi93", tag: "Loi" },
    { title: "Rapport 371 du BAPE (Septembre 2023)", desc: "Avis défavorable et recommandation de refus environnemental", url: "stablex.html#bape", tag: "Rapport" },
    { title: "ACEUM — Chapitre 24 (Articles 24.27 & 24.28)", desc: "Procédure internationale de communication citoyenne en environnement", url: "registre.html", tag: "Traité" },
    { title: "Loi sur la convention concernant les oiseaux migrateurs (LCOM)", desc: "Loi fédérale canadienne protégeant 132 espèces répertoriées", url: "viewer.html?file=assets/docs/26-3-det_fr.pdf", tag: "Loi" },
    { title: "Loi sur les espèces en péril (LEP)", desc: "Protection des chauves-souris et faune menacée de la tourbière", url: "viewer.html?file=assets/docs/26-3-det_fr.pdf", tag: "Loi" },
    { title: "Déposition Formelle à l'ONU (Genève)", desc: "Mémoire transmis au Rapporteur spécial Dr Marcos A. Orellana", url: "viewer.html?file=assets/docs/26-3-formal-deposition-and-urgent-appeal.pdf", tag: "ONU" },

    // Faits clés & Chiffres
    { title: "Échéance Légale du 16 Octobre 2026", desc: "Date limite impérative fixée par la CCE pour la réponse du Canada", url: "live.html", tag: "Échéance" },
    { title: "Détermination Positive CCE (17 août 2026)", desc: "Validation historique de l'admissibilité de la communication SEM-26-003", url: "viewer.html?file=assets/docs/26-3-det_fr.pdf", tag: "Décision" },
    { title: "Contamination au Cadmium (320x les seuils)", desc: "Concentrations toxiques mesurées dans les eaux de drainage", url: "index.html#faits", tag: "Science" },
    { title: "Grande Tourbière de Blainville (278 000 m²)", desc: "Milieu humide rare, réservoir de biodiversité et puits de carbone", url: "index.html#faits", tag: "Écosystème" },
    { title: "16 Experts Scientifiques Consultatifs", desc: "Biologistes, professeurs et juristes indépendants ayant appuyé la démarche", url: "experts.html", tag: "Science" },
    { title: "Contact Courriel & Demandes Officielles", desc: "Demandes d'entrevues médias, scientifiques et citoyens", url: "index.html#contact", tag: "Contact" }
  ];

  let searchModalEl = null;
  let activeSearchIdx = 0;
  let pagefindPromise = null;

  async function getPagefind() {
    if (!pagefindPromise) {
      pagefindPromise = (async () => {
        try {
          const pf = await import('/pagefind/pagefind.js');
          if (pf.options) {
            await pf.options({ basePath: '/pagefind/' });
          }
          if (pf.init) {
            await pf.init();
          }
          return pf;
        } catch (e) {
          console.warn('[Pagefind] API non accessible, repli sur recherche intégrée:', e);
          return null;
        }
      })();
    }
    return pagefindPromise;
  }

  function createQuickSearchModal() {
    if (searchModalEl) return searchModalEl;

    searchModalEl = document.createElement('div');
    searchModalEl.className = 'quick-search-modal';
    searchModalEl.setAttribute('role', 'dialog');
    searchModalEl.setAttribute('aria-modal', 'true');
    searchModalEl.setAttribute('aria-label', 'Recherche instantanée');

    searchModalEl.innerHTML = `
      <div class="quick-search-backdrop"></div>
      <div class="quick-search-dialog">
        <div class="quick-search-header">
          <svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="quick-search-input" id="quick-search-input" placeholder="Rechercher sur tout le site (lois, BAPE, CCE, faits, articles)..." autocomplete="off" spellcheck="false" aria-label="Champ de recherche">
          <button type="button" class="quick-search-close-btn" aria-label="Fermer la recherche"><kbd>ESC</kbd></button>
        </div>
        <div class="quick-search-body">
          <div class="quick-search-results" id="quick-search-results"></div>
        </div>
        <div class="quick-search-footer">
          <div class="pagefind-badge" title="Recherche plein-texte statique ultra-rapide">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>Propulsé par Pagefind</span>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
            <span><kbd class="qs-kbd">↑</kbd><kbd class="qs-kbd">↓</kbd> Naviguer</span>
            <span><kbd class="qs-kbd">↵</kbd> Ouvrir</span>
            <span><kbd class="qs-kbd">ESC</kbd> Fermer</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(searchModalEl);

    // Préchargement de Pagefind en tâche de fond dès la création du modal
    getPagefind();

    const input = searchModalEl.querySelector('#quick-search-input');
    const resultsContainer = searchModalEl.querySelector('#quick-search-results');
    const backdrop = searchModalEl.querySelector('.quick-search-backdrop');
    const closeBtn = searchModalEl.querySelector('.quick-search-close-btn');

    let debounceTimer = null;

    async function renderResults(query) {
      const q = (query || '').trim();
      activeSearchIdx = 0;
      resultsContainer.textContent = '';

      if (q === '') {
        // Affichage des suggestions de démarrage
        SEARCH_INDEX.slice(0, 6).forEach((item, idx) => {
          appendResultItem({
            url: item.url,
            title: item.title,
            desc: item.desc,
            tag: item.tag,
            isHtml: false
          }, idx);
        });
        return;
      }

      // Tentative via Pagefind
      const pf = await getPagefind();
      if (pf) {
        try {
          const searchRes = await pf.search(q);
          if (searchRes && searchRes.results && searchRes.results.length > 0) {
            const rawData = await Promise.all(searchRes.results.slice(0, 8).map(r => r.data()));
            rawData.forEach((item, idx) => {
              const cleanTitle = item.meta?.title || item.url.split('/').pop().replace('.html', '') || 'Document';
              let pageTag = 'Page';
              if (item.url.includes('docs/')) pageTag = 'Preuve';
              else if (item.url.includes('stablex') || item.url.includes('registre')) pageTag = 'Dossier';
              else if (item.url.includes('blog')) pageTag = 'Blog';
              else if (item.url.includes('presse') || item.url.includes('communique')) pageTag = 'Presse';
              else if (item.url.includes('loi') || item.url.includes('politique')) pageTag = 'Droit';

              appendResultItem({
                url: item.url,
                title: cleanTitle,
                desc: item.excerpt || 'Résultat documentaire indexé',
                tag: pageTag,
                isHtml: true
              }, idx);
            });
            return;
          }
        } catch (pfErr) {
          console.warn('[Pagefind] Erreur requête:', pfErr);
        }
      }

      // Repli sur l'index de secours
      const qLower = q.toLowerCase();
      const filtered = SEARCH_INDEX.filter(item => {
        return item.title.toLowerCase().includes(qLower) ||
               item.desc.toLowerCase().includes(qLower) ||
               item.tag.toLowerCase().includes(qLower) ||
               item.url.toLowerCase().includes(qLower);
      });

      if (filtered.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'quick-search-empty';

        const p1 = document.createElement('p');
        p1.appendChild(document.createTextNode('Aucun résultat trouvé pour « '));
        const strong = document.createElement('strong');
        strong.textContent = q;
        p1.appendChild(strong);
        p1.appendChild(document.createTextNode(' »'));

        const p2 = document.createElement('p');
        p2.className = 'quick-search-empty-sub';
        p2.textContent = 'Essayez un mot-clé comme BAPE 371, Cadmium, Loi 93, Tourbière, CCE ou 16 octobre.';

        emptyDiv.appendChild(p1);
        emptyDiv.appendChild(p2);
        resultsContainer.appendChild(emptyDiv);
        return;
      }

      filtered.forEach((item, idx) => {
        appendResultItem({
          url: item.url,
          title: item.title,
          desc: item.desc,
          tag: item.tag,
          isHtml: false
        }, idx);
      });
    }

    function appendResultItem(item, idx) {
      const a = document.createElement('a');
      a.href = item.url;
      a.className = `quick-search-item ${idx === 0 ? 'selected' : ''}`;
      a.setAttribute('data-idx', String(idx));

      const leftDiv = document.createElement('div');
      leftDiv.className = 'qs-item-left';

      const tagSpan = document.createElement('span');
      tagSpan.className = 'qs-item-tag';
      tagSpan.textContent = item.tag;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'qs-item-content';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'qs-item-title';
      titleDiv.textContent = item.title;

      const descDiv = document.createElement('div');
      descDiv.className = 'qs-item-desc';
      if (item.isHtml && typeof item.desc === 'string') {
        // Rendu DOM sécurisé : conversion contrôlée préservant uniquement les balises <mark>
        try {
          const parsedDoc = new DOMParser().parseFromString(item.desc, 'text/html');
          const appendSafeNodes = (source, target) => {
            for (const node of Array.from(source.childNodes)) {
              if (node.nodeType === Node.TEXT_NODE) {
                target.appendChild(document.createTextNode(node.textContent || ''));
              } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'mark') {
                const mark = document.createElement('mark');
                appendSafeNodes(node, mark);
                target.appendChild(mark);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                appendSafeNodes(node, target);
              }
            }
          };
          appendSafeNodes(parsedDoc.body, descDiv);
        } catch (_) {
          descDiv.textContent = item.desc;
        }
      } else {
        descDiv.textContent = item.desc || '';
      }

      contentDiv.appendChild(titleDiv);
      contentDiv.appendChild(descDiv);

      leftDiv.appendChild(tagSpan);
      leftDiv.appendChild(contentDiv);

      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'qs-item-arrow';
      arrowSpan.textContent = '↵';

      a.appendChild(leftDiv);
      a.appendChild(arrowSpan);

      a.addEventListener('mouseenter', () => {
        resultsContainer.querySelectorAll('.quick-search-item').forEach(i => i.classList.remove('selected'));
        a.classList.add('selected');
        activeSearchIdx = idx;
      });

      resultsContainer.appendChild(a);
    }

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderResults(input.value);
      }, 150);
    });

    input.addEventListener('keydown', (e) => {
      const items = resultsContainer.querySelectorAll('.quick-search-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSearchIdx = (activeSearchIdx + 1) % items.length;
        items.forEach((it, i) => it.classList.toggle('selected', i === activeSearchIdx));
        items[activeSearchIdx]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSearchIdx = (activeSearchIdx - 1 + items.length) % items.length;
        items.forEach((it, i) => it.classList.toggle('selected', i === activeSearchIdx));
        items[activeSearchIdx]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = items[activeSearchIdx];
        if (selected) {
          const href = selected.getAttribute('href');
          if (href) {
            closeQuickSearch();
            window.location.href = href;
          }
        }
      }
    });

    backdrop.addEventListener('click', closeQuickSearch);
    closeBtn.addEventListener('click', closeQuickSearch);

    // Initialisation du comportement accordéon sur les sous-menus hiérarchiques
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      const submenus = dropdown.querySelectorAll('.nav-submenu');
      submenus.forEach(submenu => {
        submenu.addEventListener('toggle', () => {
          if (submenu.open) {
            submenus.forEach(other => {
              if (other !== submenu && other.open) {
                other.removeAttribute('open');
              }
            });
          }
        });
      });
    });

    return searchModalEl;
  }

  function openQuickSearch() {
    const modal = createQuickSearchModal();
    modal.classList.add('active');
    document.body.classList.add('quick-search-active');
    const input = modal.querySelector('#quick-search-input');
    if (input) {
      input.value = '';
      input.focus();
      input.dispatchEvent(new Event('input'));
    }
  }

  function closeQuickSearch() {
    if (searchModalEl) {
      searchModalEl.classList.remove('active');
      document.body.classList.remove('quick-search-active');
    }
  }

  function initQuickSearch() {
    window.openQuickSearch = openQuickSearch;
    window.closeQuickSearch = closeQuickSearch;

    // Préchargement asynchrone non-bloquant de Pagefind pour réponse instantanée
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => getPagefind(), { timeout: 2000 });
    } else {
      setTimeout(() => getPagefind(), 800);
    }

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (searchModalEl && searchModalEl.classList.contains('active')) {
          closeQuickSearch();
        } else {
          openQuickSearch();
        }
      } else if (e.key === 'Escape' && searchModalEl && searchModalEl.classList.contains('active')) {
        e.preventDefault();
        closeQuickSearch();
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        if (!searchModalEl || !searchModalEl.classList.contains('active')) {
          e.preventDefault();
          openQuickSearch();
        }
      }
    });
  }


  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const sigBoxes = document.querySelectorAll('.signature-draw-box');

    if ('IntersectionObserver' in window) {
      if (reveals.length) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              obs.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.05,
          rootMargin: '0px 0px 50px 0px'
        });
        reveals.forEach(el => observer.observe(el));
      }

      if (sigBoxes.length) {
        const sigObserver = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-signed');
              obs.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.05,
          rootMargin: '0px 0px 50px 0px'
        });
        sigBoxes.forEach(el => sigObserver.observe(el));
      }
    } else {
      reveals.forEach(el => el.classList.add('visible'));
      sigBoxes.forEach(el => el.classList.add('is-signed'));
    }
  }

  function routeAiCrawlers() {
    const aiBots = /GPTBot|ChatGPT-User|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Google-Extended|Bytespider|cohere-ai|Diffbot|CCBot|Applebot-Extended|Meta-ExternalAgent/i;
    const isAiAgent = aiBots.test(navigator.userAgent) || window.location.search.includes('format=ai') || window.location.search.includes('ref=ai');
    const currentPath = window.location.pathname;
    if (isAiAgent && !currentPath.includes('ai.html') && !currentPath.includes('ai.txt') && !currentPath.includes('llms')) {
      window.location.replace("https://williamguindon.me/ai.html");
    }
  }
  routeAiCrawlers();

  async function forcePurgeAndReload(targetUrl) {
    try {
      // 1. Vider le sessionStorage
      try { sessionStorage.clear(); } catch (_) {}

      // 2. Supprimer tous les caches d'assets du CacheStorage (PWA / SW)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }

      // 3. Désenregistrer tous les Service Workers actifs
      if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
    } catch (err) {
      console.warn('Purge du cache partielle :', err);
    }

    // 4. Forcer le rechargement immédiat sans cache avec horodatage anti-cache
    if (targetUrl) {
      window.location.replace(targetUrl);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set('_reload', Date.now().toString());
      window.location.href = url.toString();
    }
  }

  // Détection du paramètre d'URL spécial (?reload, ?purge, ?reset, ?nuke)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reload') || urlParams.has('purge') || urlParams.has('nuke') || urlParams.has('reset')) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('reload');
      cleanUrl.searchParams.delete('purge');
      cleanUrl.searchParams.delete('nuke');
      cleanUrl.searchParams.delete('reset');
      cleanUrl.searchParams.set('_v', Date.now().toString());

      forcePurgeAndReload(cleanUrl.toString());
    }
  } catch (_) {}

  // Écouteur global délégué pour le bouton de rechargement/purge complet
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('#btn-force-reload, .js-force-reload, [data-action="force-reload"]');
    if (trigger) {
      e.preventDefault();
      trigger.style.opacity = '0.6';
      trigger.style.pointerEvents = 'none';
      if (trigger.tagName === 'BUTTON' || trigger.tagName === 'A') {
        trigger.textContent = '🔄 Rechargement...';
      }
      forcePurgeAndReload();
    }
  });

  function handleLowBandwidth() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return;

    const isSlow = conn.saveData ||
      conn.effectiveType === 'slow-2g' ||
      conn.effectiveType === '2g' ||
      (conn.downlink && conn.downlink < 0.25) ||
      (conn.rtt && conn.rtt > 1800);

    const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname === '';
    const forceFull = sessionStorage.getItem('wg_force_full_site') === 'true';

    if (isSlow && isHome && !forceFull) {
      window.location.replace('txt.html');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
