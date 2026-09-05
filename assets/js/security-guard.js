/**
 * SENTINELLE DE SÉCURITÉ RADICALE — williamguindon.me
 * Protège le site contre le clonage/fork, applique le blackout global, le mode panique et les kill-switches.
 */
(function () {
  'use strict';

  const ALLOWED_HOSTS = ['williamguindon.me', 'www.williamguindon.me', 'localhost', '127.0.0.1', 'bwillou1.github.io'];
  const STORAGE_KEY = 'wg_radical_site_state';

  // 1. DÉTECTION ANTI-FORK & ANTI-DUPLICATION IMMÉDIATE
  const currentHost = window.location.hostname.toLowerCase();
  const isAuthorized = ALLOWED_HOSTS.some(h => currentHost === h || currentHost.endsWith('.' + h));

  if (!isAuthorized && currentHost !== "") {
    document.documentElement.innerHTML = `
      <html lang="fr"><head><meta charset="utf-8"><title>Accès Non Autorisé</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>body{background:#0a0d0b;color:#f87171;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;box-sizing:border-box}
      .box{background:#181212;border:1.5px solid #ef4444;border-radius:14px;padding:36px;max-width:540px;box-shadow:0 10px 40px rgba(0,0,0,0.85)}
      h1{color:#ef4444;font-size:22px;margin-bottom:12px;font-weight:800}p{color:#d1d5db;font-size:14.5px;line-height:1.6}
      a{color:#22c55e;font-weight:700;text-decoration:none}a:hover{text-decoration:underline}</style></head>
      <body><div class="box"><h1>⚠️ Erreur : Ce site n'est pas l'original</h1>
      <p>Ce site constitue une copie ou un fork non officiel.<br><br>
      Veuillez accéder au site officiel et sécurisé sur :<br><br>
      👉 <a href="https://williamguindon.me">https://williamguindon.me</a></p></div></body></html>
    `;
    window.stop();
    throw new Error("Arrêt sentinelle : domaine non autorisé.");
  }

  // Ne pas bloquer la console admin elle-même
  const isConsolePage = window.location.pathname.includes('console-admin.html');
  if (isConsolePage) return;

  // 2. GESTION DE L'ÉTAT (SYNCHRONISATION ULTRA-RAPIDE MULTI-ONGLETS 0MS & DISTANTE GITHUB)
  let lastAppliedStateJson = null;

  // A. Canal BroadcastChannel (0ms entre onglets)
  const syncChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('wg_site_state_sync') : null;
  if (syncChannel) {
    syncChannel.onmessage = (e) => {
      if (e && e.data) {
        applyState(e.data);
      }
    };
  }

  // B. Écoute des événements de stockage inter-onglets natifs (0ms)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        applyState(parsed);
      } catch (_) {}
    }
  });

  function applyState(state) {
    if (!state || typeof state !== 'object') return;
    const now = Date.now();
    const currentStateJson = JSON.stringify(state);

    const isMaintenanceActive = Boolean(state.maintenanceActive && state.maintenanceUntil && now < state.maintenanceUntil);
    const isPanicActive = Boolean(state.panicActive && state.panicUntil && now < state.panicUntil);

    // Si la maintenance était affichée et vient de se terminer ou d'être désactivée
    if (!isMaintenanceActive && document.getElementById('maint-wrapper')) {
      window.location.reload();
      return;
    }

    // Éviter ré-exécution inutile si l'état n'a pas changé
    if (lastAppliedStateJson === currentStateJson && document.readyState !== 'loading') {
      return;
    }
    lastAppliedStateJson = currentStateJson;

    // 1. Mode Blackout / Maintenance Totale
    if (isMaintenanceActive) {
      renderMaintenanceScreen(state.maintenanceUntil);
      return;
    }

    // 2. Mode Cyber-Attaque / Panique
    if (isPanicActive) {
      applyPanicMode(state.panicTextOnly);
    } else {
      removePanicMode();
    }

    // 3. Commutateurs individuels (Kill-Switches)
    applyKillSwitches(state);
  }

  // Application immédiate depuis le stockage local / session (0ms de latence au chargement)
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || '{}');
    applyState(cached);
  } catch (e) {}

  // Synchronisation distante ultra-rapide multi-sources (Local + GitHub Raw direct sans cache)
  let isFetching = false;
  async function fetchRemoteState() {
    if (isFetching) return;
    isFetching = true;

    const endpoints = [
      new URL('data/site-state.json?_t=' + Date.now(), window.location.href).href,
      'https://raw.githubusercontent.com/Bwillou1/WilliamGuindon/main/data/site-state.json?_t=' + Date.now()
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(url, {
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const remoteState = await res.json();
          if (remoteState && typeof remoteState === 'object') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
            applyState(remoteState);
            if (syncChannel) {
              try { syncChannel.postMessage(remoteState); } catch (_) {}
            }
            break; // Succès immédiat obtenu, arrêt
          }
        }
      } catch (_) {}
    }
    isFetching = false;
  }

  // Lancement propre de la synchronisation après le chargement
  function startSync() {
    fetchRemoteState();
    setInterval(() => {
      if (!document.hidden) fetchRemoteState();
    }, 4000);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startSync, { once: true });
  } else {
    startSync();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) fetchRemoteState();
  });
  window.addEventListener('focus', () => {
    if (!document.hidden) fetchRemoteState();
  });

  // ==========================================
  // LOGIQUES D'APPLICATION SPÉCIFIQUES & SÉCURITÉ
  // ==========================================

  let isDevToolsLocked = false;
  function lockInspectorAndDevTools() {
    if (isDevToolsLocked) return;
    isDevToolsLocked = true;

    // 1. Bloquer le clic droit et le menu contextuel
    document.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    // 2. Bloquer les raccourcis clavier F12, Inspecteur, Code source, Enregistrer
    document.addEventListener('keydown', e => {
      const isMac = (navigator.platform || '').toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? (e.metaKey || e.ctrlKey) : e.ctrlKey;
      const key = (e.key || '').toLowerCase();
      const code = e.keyCode || e.which;

      // F12
      if (key === 'f12' || code === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + Shift + I / J / C / K
      if (cmdOrCtrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k' || code === 73 || code === 74 || code === 67 || code === 75)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Cmd + Option + I / J / C / U (Mac)
      if (cmdOrCtrl && e.altKey && (key === 'i' || key === 'j' || key === 'c' || key === 'u' || code === 73 || code === 74 || code === 67 || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + U (Code source)
      if (cmdOrCtrl && (key === 'u' || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + S (Sauvegarde)
      if (cmdOrCtrl && (key === 's' || code === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // 3. Bloquer la sélection de texte et le copier-coller
    document.addEventListener('selectstart', e => { e.preventDefault(); return false; }, true);
    document.addEventListener('copy', e => { e.preventDefault(); return false; }, true);
    document.addEventListener('cut', e => { e.preventDefault(); return false; }, true);

    if (document.body) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }
  }

  function applyPanicMode(forceTextOnly) {
    lockInspectorAndDevTools();

    // Style de neutralisation des liens externes
    let panicStyle = document.getElementById('wg-panic-styles');
    if (!panicStyle) {
      panicStyle = document.createElement('style');
      panicStyle.id = 'wg-panic-styles';
      panicStyle.textContent = `
        a[target="_blank"], a[href^="http://"]:not([href*="williamguindon.me"]):not([href*="bwillou1.github.io"]):not([href*="localhost"]),
        a[href^="https://"]:not([href*="williamguindon.me"]):not([href*="bwillou1.github.io"]):not([href*="localhost"]) {
          pointer-events: none !important;
          opacity: 0.45 !important;
          cursor: not-allowed !important;
        }
      `;
      (document.head || document.documentElement).appendChild(panicStyle);
    }

    const onReady = () => {
      renderPanicModeBanner();
      if (forceTextOnly) {
        renderTextOnlyMode();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady, { once: true });
    } else {
      onReady();
    }
  }

  function removePanicMode() {
    const banner = document.getElementById('panic-alert-banner');
    if (banner) {
      banner.remove();
      if (document.body) document.body.style.paddingTop = '';
    }

    const panicStyle = document.getElementById('wg-panic-styles');
    if (panicStyle) panicStyle.remove();

    if (document.getElementById('panic-text-only-container')) {
      window.location.reload();
    }
  }

  function applyKillSwitches(state) {
    let styleEl = document.getElementById('wg-killswitch-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'wg-killswitch-styles';
      (document.head || document.documentElement).appendChild(styleEl);
    }

    const css = [];

    // Thème forcé
    if (state.forceDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (state.forceLightMode) {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // 1-8. Commutateurs de base
    if (state.disableAnimations) {
      css.push('* { animation: none !important; transition: none !important; }');
    }
    if (state.disableMedia) {
      css.push('img, video, audio, picture, source, svg:not(.nav-icon):not(.theme-icon) { display: none !important; }');
    }
    if (state.disableIframes) {
      css.push('iframe { display: none !important; }');
    }
    if (state.disableCopyPaste) {
      css.push('body, * { user-select: none !important; -webkit-user-select: none !important; }');
    }
    if (state.disableNavLinks) {
      css.push('a:not(.allow-emergency) { pointer-events: none !important; opacity: 0.45 !important; cursor: not-allowed !important; }');
    }
    if (state.disableTranslation) {
      css.push('#google_translate_element, .nav-translate-dropdown, .goog-te-banner-frame, .goog-te-combo { display: none !important; }');
    }
    if (state.disableAI) {
      css.push('#leafMenuContainer, .leaf-menu, .ai-mega-dropdown, #ai-nav-item, a[href*="ai.html"], a[href*="llms.txt"] { display: none !important; }');
    }
    if (state.disablePDF) {
      css.push('a[href$=".pdf"], button[data-pdf], .pdf-download-btn, a[href*="viewer.html"], a[href*="lecteur.html"] { display: none !important; }');
    }

    // 9-28. Les 20 Nouveaux Commutateurs
    if (state.highContrastMode) {
      css.push('html { filter: contrast(175%) !important; }');
      css.push('body { background: #000000 !important; color: #ffffff !important; }');
    }
    if (state.disableSounds) {
      css.push('audio, video { pointer-events: none !important; }');
      document.querySelectorAll('audio, video').forEach(media => {
        try { media.pause(); media.muted = true; } catch(_) {}
      });
    }
    if (state.disableExternalTracking) {
      css.push('iframe[src*="google"], iframe[src*="youtube"], iframe[src*="cal.com"], iframe[src*="felt"], iframe[src*="vimeo"] { display: none !important; }');
    }
    if (state.disableModals) {
      css.push('dialog, .modal, .popup, [role="dialog"], .backdrop, .modal-backdrop { display: none !important; pointer-events: none !important; }');
    }
    if (state.hideContactForms) {
      css.push('form, .contact-box, .media-contact-box, a[href^="mailto:"], a[href*="cal.com"], .booking-widget { display: none !important; }');
    }
    if (state.disableSmoothScroll) {
      css.push('html, body, * { scroll-behavior: auto !important; }');
    }
    if (state.disableHeaderSticky) {
      css.push('header.site, header, .nav-sticky, .sticky { position: static !important; }');
    }
    if (state.hideSocialButtons) {
      css.push('.social-links, .nav-social, a[href*="twitter.com"], a[href*="x.com"], a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"], .share-btn, .social-icon { display: none !important; }');
    }
    if (state.hidePressSection) {
      css.push('#presse, .presse-section, a[href*="presse.html"], a[href*="communiques.html"], .press-card, .communique-item { display: none !important; }');
    }
    if (state.hideTimeline) {
      css.push('.timeline, .chronology, #timeline, .timeline-item, .steps-container, .cce-timeline { display: none !important; }');
    }
    if (state.disableTooltips) {
      css.push('.tooltip, [data-tooltip]:after, [data-tooltip]:before, .badge-floating, .floating-badge { display: none !important; }');
    }
    if (state.monochromeMode) {
      css.push('html, body { filter: grayscale(100%) !important; }');
    }
    if (state.disableSearchFilters) {
      css.push('input[type="search"], .search-box, .filter-btn, .filter-bar, .search-container, .table-filters { display: none !important; }');
    }
    if (state.disableMaps) {
      css.push('#map, .leaflet-container, .felt-container, #felt-map, iframe[src*="felt"], iframe[src*="openstreetmap"], .map-wrapper { display: none !important; }');
    }
    if (state.dyslexiaFont) {
      css.push('body, body * { font-family: "OpenDyslexic", "Comic Sans MS", Arial, sans-serif !important; letter-spacing: 0.08em !important; word-spacing: 0.15em !important; line-height: 1.85 !important; }');
    }
    if (state.hideBioSection) {
      css.push('#bio, .bio-section, .author-profile, .about-section, .biography, .bio-card { display: none !important; }');
    }
    if (state.disableBackToTop) {
      css.push('#backToTop, .scroll-to-top, .back-to-top-btn, a[href="#top"], .leaf-scroll-top { display: none !important; }');
    }

    // Bannière d'alerte défilante urgente
    if (state.emergencyBannerOnly) {
      if (!document.getElementById('wg-emergency-marquee')) {
        const marq = document.createElement('div');
        marq.id = 'wg-emergency-marquee';
        marq.style.cssText = 'position:fixed;bottom:0;left:0;width:100vw;background:#ef4444;color:#ffffff;font-weight:800;font-size:13px;padding:8px 16px;text-align:center;z-index:9999998;box-shadow:0 -4px 15px rgba(0,0,0,0.5);letter-spacing:0.5px;';
        marq.innerHTML = '🚨 <strong>ALERTE OFFICIELLE :</strong> Mode d\'information prioritaire activé par l\'administration.';
        document.body.appendChild(marq);
      }
    } else {
      const marq = document.getElementById('wg-emergency-marquee');
      if (marq) marq.remove();
    }

    styleEl.textContent = css.join('\n');
  }

  function renderMaintenanceScreen(untilTimestamp) {
    lockInspectorAndDevTools();

    function getObfuscatedEmail() {
      const parts = ["gui", "ndon", "will", "iam", "2", "@", "gma", "il.", "com"];
      return parts.join('');
    }
    const safeEmail = getObfuscatedEmail();
    const timeLeftMin = Math.max(1, Math.round((untilTimestamp - Date.now()) / 60000));

    const html = `
      <div id="maint-wrapper" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#060a08;color:#f0fdf4;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;z-index:9999999;padding:20px;box-sizing:border-box;">
        <div style="background:#0f1713;border:1.5px solid #1f2922;border-radius:16px;padding:36px;max-width:580px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.9);text-align:center;">
          <div style="font-size:42px;margin-bottom:12px;">🚧</div>
          <h1 style="color:#22c55e;font-size:22px;margin-bottom:8px;font-weight:800;">Site en Maintenance Totale</h1>
          <p style="color:#9bb0a2;font-size:14px;line-height:1.6;margin-bottom:20px;">
            Le site officiel fait actuellement l'objet d'une mise à jour de structure et de sécurité.<br>
            Fin estimée de l'intervention dans environ <strong>${timeLeftMin} minutes</strong>.
          </p>

          <div style="background:#090d0b;border:1px solid #1f2922;border-radius:10px;padding:16px;text-align:left;margin-bottom:24px;font-size:13.5px;color:#d1d5db;">
            <div style="font-weight:700;color:#ffffff;margin-bottom:8px;">📋 Références Légales & Archives Officielles :</div>
            <p style="margin:4px 0;">• Soumission CCE : <a href="https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#4ade80;">Registre SEM-26-003 (ACEUM) ↗</a></p>
            <p style="margin:4px 0;">• Archive officielle : <a href="https://web.archive.org/web/*/http://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#4ade80;">Web Archive CCE ↗</a></p>
            <p style="margin:8px 0 0 0;">• Contact sécurisé : <a href="mailto:${safeEmail}" style="color:#38bdf8;font-weight:600;">${safeEmail}</a></p>
          </div>

          <div style="display:flex;justify-content:center;gap:12px;font-size:12.5px;">
            <button onclick="window.location.reload()" style="background:#22c55e;border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;color:#042f2e;">🔄 Vérifier l'état</button>
            <button onclick="document.getElementById('maint-translate').style.display='block'" style="background:transparent;border:1px solid #1f2922;color:#9bb0a2;padding:10px 14px;border-radius:8px;cursor:pointer;">🌐 Traduire</button>
          </div>
          <div id="maint-translate" style="display:none;margin-top:16px;">
            <div id="google_translate_element"></div>
          </div>
        </div>
      </div>
    `;

    if (document.body) {
      document.body.innerHTML = html;
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = html;
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
      }, { once: true });
    }
  }

  function renderPanicModeBanner() {
    if (document.getElementById('panic-alert-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'panic-alert-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;width:100vw;background:#eab308;color:#000000;font-weight:800;font-size:13.5px;padding:12px 16px;text-align:center;z-index:9999999;box-shadow:0 4px 20px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;gap:10px;box-sizing:border-box;';
    banner.innerHTML = `⚠️ <span><strong>MODE PANIQUE / CYBER-ATTAQUE ACTIF :</strong> Un durcissement de sécurité extrême est en vigueur. Inspecteur, raccourcis et liens externes verrouillés.</span>`;
    
    if (document.body) {
      document.body.prepend(banner);
      document.body.style.paddingTop = '45px';
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.prepend(banner);
        document.body.style.paddingTop = '45px';
      }, { once: true });
    }
  }

  function renderTextOnlyMode() {
    if (document.getElementById('panic-text-only-container')) return;
    const rawText = document.body ? (document.body.innerText || document.body.textContent || '') : '';
    const banner = document.getElementById('panic-alert-banner');

    const container = document.createElement('div');
    container.id = 'panic-text-only-container';
    container.style.cssText = 'max-width:850px;margin:20px auto;padding:24px;font-family:system-ui,-apple-system,monospace;white-space:pre-wrap;background:#0d1117;color:#e6edf3;line-height:1.6;border:1px solid #30363d;border-radius:8px;';
    container.textContent = rawText.replace(/⚠️.*verrouillés\./g, '').trim();

    document.body.replaceChildren(container);
    if (banner) {
      document.body.prepend(banner);
      document.body.style.paddingTop = '45px';
    }
  }
})();
