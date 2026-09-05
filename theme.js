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

    if (nav) {
      // Intégration du sélecteur de langue Google Traduction fluide & fiable
      let langDropdown = document.getElementById('nav-lang-dropdown');
      if (!langDropdown) {
        langDropdown = document.createElement('div');
        langDropdown.className = 'nav-dropdown nav-dropdown-right nav-translate-dropdown';
        langDropdown.id = 'nav-lang-dropdown';

        const match = document.cookie.match(/googtrans=\/fr\/([a-zA-Z\-]+)/);
        const activeLangCode = (match && match[1]) || localStorage.getItem('wg_user_lang') || 'fr';
        const langCodeDisplay = activeLangCode.toUpperCase().substring(0, 2);

        langDropdown.innerHTML = `
          <button class="nav-dropdown-btn" type="button" aria-expanded="false" aria-haspopup="true" id="nav-lang-btn" aria-label="Changer de langue / Change language" style="display:inline-flex; align-items:center; gap:5px; font-weight:600;">
            <span>🌐 <span id="current-lang-text">${langCodeDisplay}</span> ▾</span>
          </button>
          <div class="nav-dropdown-menu" style="min-width: 170px;">
            <div class="nav-dropdown-group">
              <span class="nav-dropdown-group-title">Traduire / Translate</span>
              <div class="nav-dropdown-grid single-col">
                <button type="button" class="nav-dropdown-item lang-btn" data-lang="fr" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; text-align:left; cursor:pointer; font-size:13.5px; font-weight:600; padding:8px 12px;">
                  <span>🇫🇷</span> <span>Français (Original)</span>
                </button>
                <button type="button" class="nav-dropdown-item lang-btn" data-lang="en" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; text-align:left; cursor:pointer; font-size:13.5px; font-weight:600; padding:8px 12px;">
                  <span>🇬🇧</span> <span>English</span>
                </button>
                <button type="button" class="nav-dropdown-item lang-btn" data-lang="es" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; text-align:left; cursor:pointer; font-size:13.5px; font-weight:600; padding:8px 12px;">
                  <span>🇪🇸</span> <span>Español</span>
                </button>
                <button type="button" class="nav-dropdown-item lang-btn" data-lang="de" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; text-align:left; cursor:pointer; font-size:13.5px; font-weight:600; padding:8px 12px;">
                  <span>🇩🇪</span> <span>Deutsch</span>
                </button>
                <button type="button" class="nav-dropdown-item lang-btn" data-lang="it" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; text-align:left; cursor:pointer; font-size:13.5px; font-weight:600; padding:8px 12px;">
                  <span>🇮🇹</span> <span>Italiano</span>
                </button>
                <button type="button" class="nav-dropdown-item lang-btn" data-lang="pt" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; text-align:left; cursor:pointer; font-size:13.5px; font-weight:600; padding:8px 12px;">
                  <span>🇵🇹</span> <span>Português</span>
                </button>
                <button type="button" class="nav-dropdown-item lang-btn" data-lang="zh-CN" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; text-align:left; cursor:pointer; font-size:13.5px; font-weight:600; padding:8px 12px;">
                  <span>🇨🇳</span> <span>中文</span>
                </button>
                <button type="button" class="nav-dropdown-item lang-btn" data-lang="ja" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; text-align:left; cursor:pointer; font-size:13.5px; font-weight:600; padding:8px 12px;">
                  <span>🇯🇵</span> <span>日本語</span>
                </button>
                <button type="button" class="nav-dropdown-item lang-btn" data-lang="ar" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; text-align:left; cursor:pointer; font-size:13.5px; font-weight:600; padding:8px 12px;">
                  <span>🇸🇦</span> <span>العربية</span>
                </button>
              </div>
            </div>
          </div>
        `;
        nav.appendChild(langDropdown);

        // Conteneur discret pour le script Google Translate
        let gTranslateDiv = document.getElementById('google_translate_element');
        if (!gTranslateDiv) {
          gTranslateDiv = document.createElement('div');
          gTranslateDiv.id = 'google_translate_element';
          gTranslateDiv.style.cssText = 'position:absolute; left:-9999px; width:1px; height:1px; opacity:0; pointer-events:none;';
          document.body.appendChild(gTranslateDiv);
        }

        // Action de changement de langue
        function setLanguage(lang) {
          const host = window.location.hostname;
          if (lang === 'fr') {
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host};`;
            const parts = host.split('.');
            if (parts.length > 2) {
              const rootDomain = parts.slice(-2).join('.');
              document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain};`;
            }
            localStorage.removeItem('wg_user_lang');
            window.location.reload();
            return;
          }

          localStorage.setItem('wg_user_lang', lang);
          document.cookie = `googtrans=/fr/${lang}; path=/;`;
          document.cookie = `googtrans=/fr/${lang}; path=/; domain=${host};`;
          document.cookie = `googtrans=/fr/${lang}; path=/; domain=.${host};`;
          const parts = host.split('.');
          if (parts.length > 2) {
            const rootDomain = parts.slice(-2).join('.');
            document.cookie = `googtrans=/fr/${lang}; path=/; domain=.${rootDomain};`;
          }

          const combo = document.querySelector('.goog-te-combo');
          if (combo) {
            combo.value = lang;
            combo.dispatchEvent(new Event('change'));
          } else {
            window.location.reload();
          }
        }

        langDropdown.querySelectorAll('.lang-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const chosenLang = btn.getAttribute('data-lang');
            langDropdown.classList.remove('active');
            const navBtn = langDropdown.querySelector('.nav-dropdown-btn');
            if (navBtn) navBtn.setAttribute('aria-expanded', 'false');
            setLanguage(chosenLang);
          });
        });

        // Initialisation du script Google Translate
        if (!window.googleTranslateElementInit) {
          window.googleTranslateElementInit = function() {
            try {
              new google.translate.TranslateElement({
                pageLanguage: 'fr',
                includedLanguages: 'en,es,de,it,pt,ar,zh-CN,ja,ru,uk',
                autoDisplay: false
              }, 'google_translate_element');

              const saved = localStorage.getItem('wg_user_lang');
              if (saved && saved !== 'fr') {
                setTimeout(() => {
                  const cb = document.querySelector('.goog-te-combo');
                  if (cb && cb.value !== saved) {
                    cb.value = saved;
                    cb.dispatchEvent(new Event('change'));
                  }
                }, 400);
              }
            } catch(e) {
              console.warn('Google Translate error:', e);
            }
          };

          if (!document.getElementById('google-translate-script')) {
            const gtScript = document.createElement('script');
            gtScript.id = 'google-translate-script';
            gtScript.type = 'text/javascript';
            gtScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            gtScript.async = true;
            document.head.appendChild(gtScript);
          }
        }
      }

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
          const dropdownsToClose = document.querySelectorAll('.nav-dropdown, .nav-notif-dropdown');
          dropdownsToClose.forEach(d => {
            d.classList.remove('active');
            const btn = d.querySelector('.nav-dropdown-btn, .nav-notif-btn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          });
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

      window.addEventListener('scroll', () => {
        if (window.innerWidth <= 992 && nav.classList.contains('active')) {
          closeMobileNav();
        }
      }, { passive: true });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          closeMobileNav();
        }
      }, { passive: true });
    }

    const counters = document.querySelectorAll('.counter-num');
    
    function animateCounter(el) {
      const targetVal = el.getAttribute('data-target');
      if (!targetVal) return;
      const target = parseInt(targetVal, 10);
      if (isNaN(target)) return;
      
      const suffix = el.getAttribute('data-suffix') || '';
      const isM2 = el.getAttribute('data-format') === 'k' || el.textContent.includes('m²') || target >= 1000;
      const duration = 1200;
      let startTime = null;
      
      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.floor(progress * target);
        
        const unit = isM2 ? ' m²' : suffix;
        el.textContent = current.toLocaleString('fr-CA').replace(/\s/g, ' ') + unit;
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString('fr-CA').replace(/\s/g, ' ') + unit;
        }
      }
      
      requestAnimationFrame(step);
    }

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

    loadDynamicStatus();

    if (document.getElementById('countdown-days')) {
      updateCountdown();
      setInterval(updateCountdown, 60000); // Mise à jour chaque minute
    }

    if (counters.length > 0) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const numEl = entry.target;
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
            // Validation stricte de sécurité (anti-XSS / anti-open-redirect)
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
          document.body.style.overflow = ''; // Rétablir le défilement
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

    window.addEventListener('scroll', () => {
      const progressBar = document.querySelector('.scroll-progress-bar');
      if (!progressBar) return;
      
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      if (limit <= 0) return;
      
      const pct = (window.scrollY / limit) * 100;
      progressBar.style.width = pct + '%';
    });

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

    function updatePrecisionCountdown() {
      const targetDate = new Date('2026-10-16T23:59:59-04:00').getTime();
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

    updatePrecisionCountdown();
    setInterval(updatePrecisionCountdown, 1000);

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

    notifDropdowns.forEach((dropdown) => {
      const btn = dropdown.querySelector('.nav-notif-btn');
      const closeBtn = dropdown.querySelector('.nav-notif-close');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
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

    const carouselWrapper = document.querySelector('.press-carousel-wrapper');
    const carouselContainer = document.querySelector('.press-carousel-container');
    const prevBtn = document.querySelector('.js-carousel-prev');
    const nextBtn = document.querySelector('.js-carousel-next');
    const dots = document.querySelectorAll('.carousel-dot');
    const cards = carouselContainer ? carouselContainer.querySelectorAll('.press-card') : [];

    if (carouselContainer && cards.length > 0) {
      let currentIndex = 0;
      let autoPlayTimer = null;

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

      window.__wg_slidePress = (action) => {
        if (typeof action === 'number') {
          updateSlider(action);
        } else if (action === 'prev') {
          if (currentIndex > 0) updateSlider(currentIndex - 1);
        } else if (action === 'next') {
          const maxIdx = getMaxIndex();
          if (currentIndex < maxIdx) updateSlider(currentIndex + 1);
          else updateSlider(0);
        }
      };

      dots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          updateSlider(idx);
        });
      });

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

      updateSlider(0, false);
      startAutoPlay();

      const audioBtns = document.querySelectorAll('.js-press-audio-btn');
      audioBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const isPlaying = btn.getAttribute('data-playing') === 'true';
          audioBtns.forEach(b => {
            b.setAttribute('data-playing', 'false');
            b.innerHTML = '▶';
          });
          if (!isPlaying) {
            btn.setAttribute('data-playing', 'true');
            btn.innerHTML = '❚❚';
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

    initFloatingAiHub();
    initHomeBlogAndPhotos();

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

  function initFloatingAiHub() {
    const path = window.location.pathname;
    const isHome = path === '/' || path.endsWith('index.html') || path === '' || path.endsWith('/');
    
    if (!isHome) return;
    if (path.includes('ai.html') || path.includes('ai.txt') || path.includes('txt.html')) return;

    if (document.querySelector('.floating-ai-btn')) return;

    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'floating-ai-btn';
    floatingBtn.setAttribute('aria-label', 'Clavarder ou résumer avec l\'IA');
    floatingBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <span>Clavarder / IA</span>
    `;

    const aiModal = document.createElement('div');
    aiModal.className = 'ai-modal-overlay';
    aiModal.innerHTML = `
      <div class="ai-modal-card" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
        <div class="ai-modal-header">
          <div class="ai-modal-title" id="ai-modal-title">
            <span>✨</span> Assistant IA & Dossier SEM-26-003
          </div>
          <button class="ai-modal-close" aria-label="Fermer le menu IA">✕</button>
        </div>

        <!-- Onglets Navigation IA -->
        <div class="ai-tabs" role="tablist">
          <button class="ai-tab-btn active" data-tab="chat" role="tab" aria-selected="true">💬 Clavarder</button>
          <button class="ai-tab-btn" data-tab="summary" role="tab" aria-selected="false">⚡ Résumer</button>
          <button class="ai-tab-btn" data-tab="models" role="tab" aria-selected="false">🤖 Autres IA</button>
        </div>

        <!-- Onglet 1 : Clavardage / Chat en direct -->
        <div class="ai-tab-content active" id="ai-tab-chat">
          <div class="ai-chat-messages" id="ai-chat-box">
            <div class="ai-chat-bubble bot">
              <span class="ai-nano-badge" id="ai-engine-badge">⚡ Assistant Dossier CCE</span>
              <div>Bonjour ! Posez-moi vos questions sur le dossier <strong>SEM-26-003</strong>, la décision CCE, le rapport du BAPE, la Loi 93 ou les faits scientifiques sur la Grande Tourbière de Blainville.</div>
            </div>
          </div>

          <!-- Suggestions rapides -->
          <div class="ai-quick-pills">
            <button type="button" class="ai-pill-btn" data-q="C'est quoi la loi 93 ?">📜 Loi 93</button>
            <button type="button" class="ai-pill-btn" data-q="Qu'a conclu le rapport du BAPE 371 ?">🔍 Rapport BAPE 371</button>
            <button type="button" class="ai-pill-btn" data-q="Pourquoi le 16 octobre 2026 est-il crucial ?">⏳ Échéance 16 oct. 2026</button>
            <button type="button" class="ai-pill-btn" data-q="Quels sont les impacts sur les oiseaux et le cadmium ?">🦅 Faune & Cadmium</button>
            <button type="button" class="ai-pill-btn" data-q="Comment contacter William Guindon anonymement ?">🔒 Contact Session</button>
          </div>

          <!-- Formulaire de saisie -->
          <form class="ai-chat-input-row" id="ai-chat-form">
            <input type="text" class="ai-chat-input" id="ai-user-input" placeholder="Posez une question sur le dossier..." autocomplete="off">
            <button type="submit" class="ai-chat-send-btn" aria-label="Envoyer">Envoyer</button>
          </form>
        </div>

        <!-- Onglet 2 : Résumé instantané (Chrome Summarizer & Synthèse) -->
        <div class="ai-tab-content" id="ai-tab-summary">
          <div class="ai-summary-box">
            <div class="ai-summary-card">
              <div style="font-size:13.5px; font-weight:700; margin-bottom:8px; color:var(--text);">
                ⚡ Génération de résumé automatique :
              </div>
              <div class="ai-summary-actions">
                <button type="button" class="ai-action-btn" id="btn-sum-bullets">📋 Points clés (Bullets)</button>
                <button type="button" class="ai-action-btn" id="btn-sum-tldr">⚡ TL;DR (1 paragraphe)</button>
                <button type="button" class="ai-action-btn" id="btn-sum-legal">⚖️ Résumé Juridique CCE</button>
              </div>
              <div class="ai-summary-result" id="ai-summary-output">
                Cliquez sur un bouton ci-dessus pour générer un résumé instantané du dossier.
              </div>
            </div>
          </div>
        </div>

        <!-- Onglet 3 : Autres Modèles & Liens externes -->
        <div class="ai-tab-content" id="ai-tab-models">
          <p class="ai-modal-desc">
            Analysez directement le dossier SEM-26-003 dans votre assistant d'intelligence artificielle favori :
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
                <span>Copier le prompt et le lien pour l'IA</span>
              </div>
              <span class="js-copy-icon">Copier</span>
            </button>
          </div>
        </div>

      </div>
    `;

    const copyAlert = document.createElement('div');
    copyAlert.className = 'ai-copy-alert';
    copyAlert.innerHTML = `✅ Lien pour l'IA copié dans le presse-papier !`;

    document.body.appendChild(floatingBtn);
    document.body.appendChild(aiModal);
    document.body.appendChild(copyAlert);

    let chromeAiSession = null;
    let hasChromeAi = false;

    async function checkChromeBuiltinAi() {
      try {
        const badge = document.getElementById('ai-engine-badge');
        if (window.ai && (window.ai.languageModel || window.ai.assistant)) {
          const lm = window.ai.languageModel || window.ai.assistant;
          const caps = await lm.capabilities();
          if (caps && caps.available !== 'no') {
            hasChromeAi = true;
            if (badge) badge.innerHTML = '✨ Gemini Nano (Sur votre appareil)';
            chromeAiSession = await lm.create({
              systemPrompt: "Tu es l'assistant officiel d'information sur la soumission citoyenne SEM-26-003 (Enfouissement de matières dangereuses à Blainville / Grande Tourbière) déposée par William Guindon (15 ans) devant la Commission de coopération environnementale (CCE / ACEUM). Tes réponses sont factuelles, rigoureuses, courtoises et concises. Mentionne les faits clés : BAPE 371 (projet prématuré), Loi 93 (bâillon), cadmium (320x les normes), Détermination positive de la CCE du 17 août 2026 ordonnant au Canada de répondre avant le 16 octobre 2026."
            });
          }
        }
      } catch (err) {
        console.log("Chrome Built-in AI mode standard actif");
      }
    }
    checkChromeBuiltinAi();

    const tabBtns = aiModal.querySelectorAll('.ai-tab-btn');
    const tabContents = aiModal.querySelectorAll('.ai-tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabKey = btn.getAttribute('data-tab');
        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const targetContent = document.getElementById('ai-tab-' + tabKey);
        if (targetContent) targetContent.classList.add('active');
      });
    });

    function generateLocalAnswer(query) {
      const q = query.toLowerCase();
      
      if (q.includes('93') || q.includes('loi')) {
        return "<strong>La Loi 93 :</strong> Adoptée sous bâillon le 28 mars 2025 (61 contre 31 voix) par l'Assemblée nationale du Québec. Elle a forcé l'expropriation des terrains municipaux de la Grande Tourbière pour permettre l'expansion de Stablex et a imposé des clauses privatives restreignant tout recours judiciaire sur le fond.";
      }
      if (q.includes('bape') || q.includes('371') || q.includes('rapport')) {
        return "<strong>Le Rapport 371 du BAPE (septembre 2023) :</strong> La commission d'enquête du BAPE a conclu que le projet d'expansion de la cellule n° 6 de Stablex dans la tourbière était <em>« prématuré »</em> et a recommandé le refus environnemental.";
      }
      if (q.includes('16 oct') || q.includes('octobre') || q.includes('date') || q.includes('délai') || q.includes('échéance')) {
        return "<strong>L'échéance du 16 octobre 2026 :</strong> Suite à la détermination positive rendue le 17 août 2026 par la CCE (SEM-26-003), le gouvernement du Canada a une obligation légale de répondre par écrit sous 60 jours (date butoir : 16 octobre 2026) sur l'application de ses lois fédérales environnementales.";
      }
      if (q.includes('cadmium') || q.includes('oiseau') || q.includes('faune') || q.includes('pollution') || q.includes('eau') || q.includes('poisson')) {
        return "<strong>Faune & Contamination :</strong> Le site abrite 132 espèces d'oiseaux (66 % nicheuses, dont la Paruline du Canada et le Pioui de l'Est) et des chauves-souris en péril. Des analyses indépendantes (Eau Secours / WaterShed Monitoring) ont révélé des concentrations de cadmium jusqu'à <strong>320 fois supérieures</strong> aux seuils de protection de la vie aquatique dans les écosystèmes voisins.";
      }
      if (q.includes('william') || q.includes('âge') || q.includes('age') || q.includes('qui')) {
        return "<strong>William Guindon :</strong> Militant écologiste québécois né le 3 août 2011 (15 ans), étudiant à l'Externat Sacré-Cœur de Rosemère. Il a déposé la soumission SEM-26-003 à 14 ans, devenant le premier mineur de l'histoire du traité à forcer un État à rendre des comptes.";
      }
      if (q.includes('session') || q.includes('contact') || q.includes('anonym') || q.includes('whistleblower') || q.includes('document')) {
        return "<strong>Contact sécurisé Session :</strong> Pour transmettre des documents confidentiels ou communiquer dans l'anonymat complet, utilisez l'application <em>Session</em> avec l'ID :<br><code>05dc60b62a6ed477b1f0dc5ce1b6a9db7603bf39f1a0efe13c68d63a6cb8a7c072</code>";
      }
      if (q.includes('onu') || q.includes('nations unies') || q.includes('orellana')) {
        return "<strong>Déposition à l'ONU :</strong> En mai 2026, William Guindon a transmis un mémoire formel au Dr Marcos A. Orellana, Rapporteur spécial de l'ONU sur les substances toxiques et les droits de l'homme, pour dénoncer l'enfouissement de déchets dangereux en milieux humides.";
      }
      if (q.includes('cce') || q.includes('aceum') || q.includes('sem-26-003') || q.includes('traité') || q.includes('cusma')) {
        return "<strong>La procédure SEM-26-003 :</strong> Portée en vertu des articles 24.27 et 24.28 de l'ACEUM (CUSMA). Le Secrétariat de la CCE a validé l'admissibilité du dossier le 17 août 2026 et instruit le Canada de s'expliquer sur l'application de la Loi sur la convention concernant les oiseaux migrateurs et de la Loi sur les espèces en péril.";
      }
      
      return "<strong>Synthèse SEM-26-003 :</strong> Le dossier porte sur l'enfouissement de millions de tonnes de déchets toxiques industriels dans la Grande Tourbière de Blainville, malgré l'avis défavorable du BAPE (Rapport 371) et le passage sous bâillon de la Loi 93. La CCE a officiellement sommé le Canada de répondre d'ici le 16 octobre 2026.";
    }

    const chatForm = document.getElementById('ai-chat-form');
    const chatBox = document.getElementById('ai-chat-box');
    const userInput = document.getElementById('ai-user-input');

    async function sendChatMessage(text) {
      if (!text || !text.trim()) return;
      const question = text.trim();
      
      const userBubble = document.createElement('div');
      userBubble.className = 'ai-chat-bubble user';
      userBubble.textContent = question;
      chatBox.appendChild(userBubble);
      userInput.value = '';
      chatBox.scrollTop = chatBox.scrollHeight;

      const botBubble = document.createElement('div');
      botBubble.className = 'ai-chat-bubble bot';
      botBubble.innerHTML = '<em>🧠 Réflexion en cours...</em>';
      chatBox.appendChild(botBubble);
      chatBox.scrollTop = chatBox.scrollHeight;

      if (hasChromeAi && chromeAiSession) {
        try {
          const response = await chromeAiSession.prompt(question);
          botBubble.innerHTML = response.replace(/\n/g, '<br>');
        } catch (err) {
          botBubble.innerHTML = generateLocalAnswer(question);
        }
      } else {
        setTimeout(() => {
          botBubble.innerHTML = generateLocalAnswer(question);
          chatBox.scrollTop = chatBox.scrollHeight;
        }, 350);
      }
    }

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendChatMessage(userInput.value);
      });
    }

    aiModal.querySelectorAll('.ai-pill-btn').forEach(pill => {
      pill.addEventListener('click', () => {
        const q = pill.getAttribute('data-q');
        sendChatMessage(q);
      });
    });

    const sumOutput = document.getElementById('ai-summary-output');

    async function runSummarizer(type) {
      sumOutput.innerHTML = '<em>⚡ Analyse et génération du résumé par l\'IA...</em>';

      if (window.ai && window.ai.summarizer) {
        try {
          const caps = await window.ai.summarizer.capabilities();
          if (caps && caps.available !== 'no') {
            const sumType = type === 'tldr' ? 'tl;dr' : 'key-points';
            const summarizer = await window.ai.summarizer.create({
              type: sumType,
              format: 'markdown',
              length: 'medium'
            });
            const textToSummarize = document.querySelector('main')?.innerText || document.body.innerText;
            const res = await summarizer.summarize(textToSummarize.slice(0, 7000));
            sumOutput.innerHTML = `<strong>✨ Résumé Gemini Nano (Local) :</strong><br>${res.replace(/\n/g, '<br>')}`;
            return;
          }
        } catch (err) {
          console.log("Fallback résumé certifié");
        }
      }

      setTimeout(() => {
        if (type === 'bullets') {
          sumOutput.innerHTML = `
            <strong>📋 Points clés du dossier SEM-26-003 :</strong>
            <ul style="padding-left:18px; margin:8px 0;">
              <li><strong>Site :</strong> Grande Tourbière de Blainville (278 000 m² de milieux humides menacés par la cellule 6 de Stablex).</li>
              <li><strong>BAPE :</strong> Rapport 371 concluant au caractère « prématuré » du projet et recommandant le refus.</li>
              <li><strong>Loi 93 :</strong> Loi d'exception adoptée sous bâillon en mars 2025 pour restreindre les contestations judiciaires.</li>
              <li><strong>Décision CCE :</strong> Détermination positive du 17 août 2026 obligeant le Canada à répondre d'ici le 16 octobre 2026.</li>
              <li><strong>Auteur :</strong> William Guindon, premier mineur de l'histoire du traité à obtenir une telle décision.</li>
            </ul>
          `;
        } else if (type === 'tldr') {
          sumOutput.innerHTML = `
            <strong>⚡ En 1 paragraphe (TL;DR) :</strong><br>
            À 14 ans, William Guindon a déposé la soumission SEM-26-003 devant la Commission nord-américaine de coopération environnementale (CCE) pour contester l'enfouissement de matières dangereuses dans la tourbière de Blainville après l'adoption sous bâillon de la Loi 93. Le 17 août 2026, la CCE a tranché en sa faveur et sommé le Canada de s'expliquer avant le 16 octobre 2026.
          `;
        } else {
          sumOutput.innerHTML = `
            <strong>⚖️ Synthèse Juridique & Traité CCE (Articles 24.27 & 24.28 ACEUM) :</strong><br>
            Le Secrétariat de la CCE a confirmé que la soumission satisfait l'ensemble des critères d'admissibilité du traité et exige des explications formelles du gouvernement fédéral quant à l'application effective de la <em>Loi sur la convention concernant les oiseaux migrateurs (1994)</em> et de la <em>Loi sur les espèces en péril (2002)</em>. L'étape suivante permettra au Secrétariat d'instruire l'ouverture d'un dossier factuel public indépendant.
          `;
        }
      }, 300);
    }

    const btnBullets = document.getElementById('btn-sum-bullets');
    const btnTldr = document.getElementById('btn-sum-tldr');
    const btnLegal = document.getElementById('btn-sum-legal');

    if (btnBullets) btnBullets.addEventListener('click', () => runSummarizer('bullets'));
    if (btnTldr) btnTldr.addEventListener('click', () => runSummarizer('tldr'));
    if (btnLegal) btnLegal.addEventListener('click', () => runSummarizer('legal'));

    floatingBtn.addEventListener('click', () => {
      aiModal.classList.add('active');
      if (userInput) userInput.focus();
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

    const copyBtn = aiModal.querySelector('.js-copy-ai-link');
    if (copyBtn) {
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
  }

  function initHomeBlogAndPhotos() {
    const blogTrack = document.getElementById('home-blog-track');
    const photosTrack = document.getElementById('home-photos-track');
    if (!blogTrack && !photosTrack) return;

    window.switchHomeTab = function(tab) {
      const btnBlog = document.getElementById('btn-tab-blog-posts');
      const btnPhotos = document.getElementById('btn-tab-blog-photos');
      const carouselBlog = document.getElementById('home-blog-carousel');
      const carouselPhotos = document.getElementById('home-photos-carousel');

      if (tab === 'blog') {
        if (btnBlog) btnBlog.classList.add('active');
        if (btnPhotos) btnPhotos.classList.remove('active');
        if (carouselBlog) carouselBlog.style.display = 'block';
        if (carouselPhotos) carouselPhotos.style.display = 'none';
      } else {
        if (btnPhotos) btnPhotos.classList.add('active');
        if (btnBlog) btnBlog.classList.remove('active');
        if (carouselPhotos) carouselPhotos.style.display = 'block';
        if (carouselBlog) carouselBlog.style.display = 'none';
      }
    };

    if (blogTrack) {
      fetch('data/blog.json?v=' + Date.now())
        .then(res => res.json())
        .then(posts => {
          if (!posts || posts.length === 0) return;
          blogTrack.innerHTML = posts.slice(0, 6).map(p => `
            <article class="blog-preview-card">
              <div class="blog-preview-thumb">
                <img src="${p.coverImage || 'tourbiere.jpg'}" alt="${p.title}" loading="lazy">
                <span class="blog-preview-category">${p.category || 'Actualité'}</span>
              </div>
              <div class="blog-preview-body">
                <time class="blog-preview-date">${p.date} · Par ${p.author || 'William Guindon'}</time>
                <h3 class="blog-preview-title">${p.title}</h3>
                <p class="blog-preview-excerpt">${p.summary || p.content.substring(0, 120) + '...'}</p>
                <div class="blog-preview-footer">
                  <a href="blog.html#${p.slug || p.id}" class="blog-preview-link">Lire l'article complet ↗</a>
                </div>
              </div>
            </article>
          `).join('');
        })
        .catch(err => console.warn('Blog preview load:', err));
    }

    if (photosTrack) {
      fetch('data/photos.json?v=' + Date.now())
        .then(res => res.json())
        .then(photos => {
          if (!photos || photos.length === 0) return;
          photosTrack.innerHTML = photos.slice(0, 6).map(ph => `
            <article class="blog-preview-card">
              <div class="blog-preview-thumb">
                <img src="${ph.imageUrl}" alt="${ph.title}" loading="lazy">
                <span class="blog-preview-category">${ph.category || 'Terrain'}</span>
              </div>
              <div class="blog-preview-body">
                <time class="blog-preview-date">${ph.date || ''} ${ph.location ? '· ' + ph.location : ''}</time>
                <h3 class="blog-preview-title">${ph.title}</h3>
                <p class="blog-preview-excerpt">${ph.description || ''}</p>
                <div class="blog-preview-footer">
                  <a href="photos.html" class="blog-preview-link">Voir en grand ↗</a>
                </div>
              </div>
            </article>
          `).join('');
        })
        .catch(err => console.warn('Photos preview load:', err));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
