/**
 * theme-core.js — William Guindon (williamguindon.me)
 * Module central : Thème (clair/sombre), Navigation, Sélecteur de langue,
 * Décompte officiel CCE SEM-26-003, Lecteur audio biographie,
 * Notifications Push, Calendrier ICS et utilitaires globaux.
 */
(function () {
  'use strict';

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

  function initApp() {
    const nav = document.querySelector('header.site nav');
    const headerWrap = document.querySelector('header.site .wrap');

    // Intégration du sélecteur de langue fluide et autonome (FR / EN / ES)
    if (nav) {
      let langDropdown = nav.querySelector('#nav-lang-dropdown');
      if (!langDropdown) {
        langDropdown = document.createElement('div');
        langDropdown.id = 'nav-lang-dropdown';
        langDropdown.className = 'nav-lang-dropdown';

        const path = window.location.pathname;
        let currentLang = 'FR';
        if (path.includes('en.html')) currentLang = 'EN';
        else if (path.includes('es.html')) currentLang = 'ES';

        langDropdown.innerHTML = `
          <button class="nav-lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Changer de langue / Change language">
            <svg class="svg-icon lang-globe-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span class="current-lang-code">${currentLang}</span>
            <svg class="svg-icon lang-chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="nav-lang-menu" role="menu">
            <a href="index.html" class="nav-lang-item ${currentLang === 'FR' ? 'active' : ''}" role="menuitem" hreflang="fr" lang="fr">
              <span class="lang-name">Français</span>
              <span class="lang-tag">FR</span>
            </a>
            <a href="en.html" class="nav-lang-item ${currentLang === 'EN' ? 'active' : ''}" role="menuitem" hreflang="en" lang="en">
              <span class="lang-name">English</span>
              <span class="lang-tag">EN</span>
            </a>
            <a href="es.html" class="nav-lang-item ${currentLang === 'ES' ? 'active' : ''}" role="menuitem" hreflang="es" lang="es">
              <span class="lang-name">Español</span>
              <span class="lang-tag">ES</span>
            </a>
          </div>
        `;
        nav.appendChild(langDropdown);
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
        nav.classList.remove('open');
        backdrop.classList.remove('active');
        document.body.classList.remove('no-scroll');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = hamburgerSvg;
      }

      function openMobileNav() {
        nav.classList.add('open');
        backdrop.classList.add('active');
        document.body.classList.add('no-scroll');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.innerHTML = closeSvg;
      }

      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (nav.classList.contains('open')) {
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
        if (nav.classList.contains('open') && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
          closeMobileNav();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('open')) {
          closeMobileNav();
        }
      });

      window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
          headerWrap.closest('header.site')?.classList.add('scrolled');
        } else {
          headerWrap.closest('header.site')?.classList.remove('scrolled');
        }
      }, { passive: true });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 960 && nav.classList.contains('open')) {
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
        console.warn('Statut CCE local utilisé (impossible de charger status.json)', err);
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
          bioAudio.play().catch(err => console.warn('Audio play error:', err));
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
        console.warn('Erreur de lecture audio:', err);
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
            console.warn('Lecture audio bloquée ou non disponible:', err);
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

    // PWA & Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            checkBackgroundFeedUpdates(reg);
          })
          .catch((err) => console.log('SW registration skipped:', err));
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
        e.stopPropagation();
        
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

      const items = dropdown.querySelectorAll('.nav-dropdown-item');
      items.forEach(item => {
        item.addEventListener('click', () => {
          dropdown.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
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

    // Web Push / Notifications
    const notifBtn = document.getElementById('btn-enable-push');
    if (notifBtn) {
      function updateNotifBtnState() {
        if (!('Notification' in window)) {
          notifBtn.disabled = true;
          notifBtn.textContent = 'Non supporté';
          return;
        }
        if (Notification.permission === 'granted') {
          notifBtn.classList.add('subscribed');
          notifBtn.textContent = 'Notifications activées ✓';
        } else if (Notification.permission === 'denied') {
          notifBtn.disabled = true;
          notifBtn.textContent = 'Bloquées dans le navigateur';
        } else {
          notifBtn.classList.remove('subscribed');
          notifBtn.textContent = 'M\'alerter des développements';
        }
      }

      updateNotifBtnState();

      notifBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) return;
        try {
          const perm = await Notification.requestPermission();
          updateNotifBtnState();
          if (perm === 'granted') {
            const reg = await navigator.serviceWorker.ready;
            if (reg.showNotification) {
              reg.showNotification("Dossier SEM-26-003", {
                body: "Vous recevrez les alertes officielles concernant l'échéance fédérale du 16 octobre 2026.",
                icon: "/icon-192.png",
                badge: "/favicon.svg"
              });
            }
          }
        } catch (err) {
          console.warn('Erreur notification push:', err);
        }
      });
    }

    function checkBackgroundFeedUpdates(reg) {
      if (!('periodicSync' in reg)) return;
      try {
        reg.periodicSync.register('check-cce-feed', {
          minInterval: 24 * 60 * 60 * 1000
        });
      } catch (_) {}
    }

    // Boutons de copie
    const copyBtns = document.querySelectorAll('.btn-copy-id, .btn-copy-session');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const textToCopy = btn.getAttribute('data-copy');
        if (!textToCopy) return;

        try {
          await navigator.clipboard.writeText(textToCopy);
          const originalText = btn.innerHTML;
          btn.innerHTML = '<span>Copié !</span>';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Erreur copie:', err);
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

    handleLowBandwidth();
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
