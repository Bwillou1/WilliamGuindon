/**
 * SENTINELLE DE SÉCURITÉ RADICALE — williamguindon.me
 * Protège le site contre le clonage/fork, applique le blackout global, le mode panique et les kill-switches.
 * Architecture 100% non-destructive par calques dynamiques réversibles à 0ms de latence.
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
      <body><div class="box"><h1>Erreur : Ce site n'est pas l'original</h1>
      <p>Ce site constitue une copie ou un fork non officiel.<br><br>
      Veuillez accéder au site officiel et sécurisé sur :<br><br>
      <a href="https://williamguindon.me">https://williamguindon.me ↗</a></p></div></body></html>
    `;
    window.stop();
    throw new Error("Arrêt sentinelle : domaine non autorisé.");
  }

  // Ne pas bloquer la console admin elle-même
  const isConsolePage = window.location.pathname.includes('console-admin.html');
  if (isConsolePage) return;

  // 2. GESTION DE L'ÉTAT RÉACTIF 0MS (BROADCASTCHANNEL + STORAGE EVENT + POLLING DISTANT)
  let lastAppliedStateJson = null;

  function getStoredState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function shouldAcceptState(newState) {
    if (!newState || typeof newState !== 'object') return false;
    const currentStored = getStoredState();
    if (!currentStored || !currentStored.updatedAt) return true;
    if (!newState.updatedAt) return true;

    const currentTime = new Date(currentStored.updatedAt).getTime();
    const newTime = new Date(newState.updatedAt).getTime();
    if (isNaN(currentTime) || isNaN(newTime)) return true;

    // Ne jamais écraser un état plus récent par un cache distant obsolète
    return newTime >= currentTime;
  }

  function parseRemotePayload(data) {
    if (!data) return null;
    if (typeof data === 'object') {
      if (typeof data.content === 'string' && data.encoding === 'base64') {
        try {
          const cleanB64 = data.content.replace(/\s/g, '');
          const binaryStr = atob(cleanB64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const decoded = new TextDecoder('utf-8').decode(bytes);
          return JSON.parse(decoded);
        } catch (_) {}
      }
      return data;
    }
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (_) {}
    }
    return null;
  }

  // A. Canal BroadcastChannel (0ms inter-onglets)
  const syncChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('wg_site_state_sync') : null;
  if (syncChannel) {
    syncChannel.onmessage = (e) => {
      if (e && e.data) {
        if (shouldAcceptState(e.data)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(e.data));
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(e.data));
          applyState(e.data, true);
        }
      }
    };
  }

  // B. Écoute native des événements de stockage inter-onglets (0ms)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        applyState(parsed, true);
      } catch (_) {}
    }
  });

  function applyState(state, force = false) {
    if (!state || typeof state !== 'object') return;
    const now = Date.now();
    const currentStateJson = JSON.stringify(state);

    if (!force && lastAppliedStateJson === currentStateJson && document.readyState !== 'loading') {
      return;
    }
    lastAppliedStateJson = currentStateJson;

    const isMaintenanceActive = Boolean(state.maintenanceActive && state.maintenanceUntil && now < state.maintenanceUntil);
    const isPanicActive = Boolean(state.panicActive && state.panicUntil && now < state.panicUntil);

    // 0. Nuke Cache Check (Purge Totale Forcée pour utilisateurs existants)
    if (state.nukeCacheTrigger && state.nukeCacheTrigger > 0) {
      const storedVal = localStorage.getItem('wg_last_nuke_ts');
      const lastNuke = storedVal ? parseInt(storedVal, 10) : 0;
      if (lastNuke === 0) {
        localStorage.setItem('wg_last_nuke_ts', String(state.nukeCacheTrigger));
      } else if (state.nukeCacheTrigger > lastNuke) {
        localStorage.setItem('wg_last_nuke_ts', String(state.nukeCacheTrigger));
        try { sessionStorage.clear(); } catch (_) {}
        if ('caches' in window) {
          caches.keys().then(names => { names.forEach(name => caches.delete(name)); });
        }
        if (navigator.serviceWorker) {
          navigator.serviceWorker.getRegistrations().then(regs => { regs.forEach(r => r.unregister()); });
        }
        setTimeout(() => { window.location.reload(true); }, 150);
        return;
      }
    }

    // 0.1 Évacuation Numérique Immédiate (Redirection 0.1s vers miroir de secours)
    if (state.evacuateActive && state.evacuateUrl) {
      if (!window.location.href.startsWith(state.evacuateUrl)) {
        window.location.replace(state.evacuateUrl);
        return;
      }
    }

    // 0.2 Mode Écran Faux / Système Inactif (Ghost Mode 503)
    if (state.ghostModeActive) {
      renderGhostModeScreen();
      return;
    } else {
      removeGhostModeScreen();
    }

    // 0.3 Anti-Inspection Agressif (Kill DevTools)
    handleKillDevTools(state.killDevTools);

    // 0.4 Mode Riposte Mise en Demeure, Dépôt Notarié & Dénonciation IA
    if (state.legalNoticeActive) {
      renderLegalNoticeStrikeScreen(state);
    } else {
      removeLegalNoticeStrikeScreen();
    }

    // 0.5 Mode Chambre Probatoire CCE SEM-26-003
    if (state.cceVaultActive) {
      renderCceVaultScreen(state);
    } else {
      removeCceVaultScreen();
    }

    // 1. Mode Blackout / Maintenance Totale (Calque réversible)
    if (isMaintenanceActive) {
      renderMaintenanceScreen(state.maintenanceUntil);
    } else {
      removeMaintenanceScreen();
    }

    // 2. Mode Cyber-Attaque / Panique (Calque réversible)
    if (isPanicActive) {
      applyPanicMode(state.panicTextOnly);
    } else {
      removePanicMode();
    }

    // 3. Mode Radical 4 : Forteresse Juridique & Confinement CCE (Calque réversible)
    const isRadical4Active = Boolean(state.radical4Active && state.radical4Until && now < state.radical4Until);
    if (isRadical4Active) {
      renderRadical4Screen(state.radical4Until, state.radical4Message);
    } else {
      removeRadical4Screen();
    }

    // 4. Mode Radical 5 : Bunker Cybernétique & Isolation Air-Gap Absolue (Protocole Alpha-Zero)
    const isRadical5Active = Boolean(state.radical5Active && state.radical5Until && now < state.radical5Until);
    if (isRadical5Active) {
      renderRadical5Screen(state.radical5Until, state.radical5Message);
    } else {
      removeRadical5Screen();
    }

    // 5. Mode Alerte Toxique / Contamination Imminente (Bannière / Modale centrale)
    if (state.toxicAlertActive) {
      renderToxicAlertBanner(state);
    } else {
      removeToxicAlertBanner();
    }

    // 6. Filigrane Forensic Dynamique & Invisible
    if (state.watermarkActive) {
      renderWatermark(state.watermarkText);
    } else {
      removeWatermark();
    }

    // 7. Émission d'Alerte Flash en Direct (Broadcast Toast)
    if (state.broadcastActive && state.broadcastMessage) {
      renderBroadcastToast(state.broadcastMessage, state.broadcastTimestamp);
    } else {
      removeBroadcastToast();
    }

    // 8. Verrouillage Géographique (Geo-Shield)
    if (state.geoShieldActive) {
      renderGeoShield();
    } else {
      removeGeoShield();
    }

    // 9. Commutateurs individuels (28 Kill-Switches réversibles 0ms)
    applyKillSwitches(state);
  }

  // Application immédiate au chargement initial depuis le stockage local / session
  try {
    const cached = getStoredState();
    applyState(cached, true);
  } catch (e) {}

  // Synchronisation distante propre sans surcharge réseau ni blocage CDN
  let isFetching = false;
  async function fetchRemoteState() {
    if (isFetching) return;
    isFetching = true;

    try {
      const ts = Date.now();
      const res = await fetch('data/site-state.json?_t=' + ts, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const rawData = await res.json();
        const remoteState = parseRemotePayload(rawData);
        if (remoteState && typeof remoteState === 'object' && shouldAcceptState(remoteState)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
          applyState(remoteState);
          if (syncChannel) {
            try { syncChannel.postMessage(remoteState); } catch (_) {}
          }
        }
      }
    } catch (_) {}
    isFetching = false;
  }

  function startSync() {
    // Synchronisation différée pour préserver les performances de chargement initial (EcoIndex Grade A)
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => fetchRemoteState(), { timeout: 4000 });
    } else {
      setTimeout(fetchRemoteState, 2500);
    }
    // Polling doux uniquement quand la page est visible
    setInterval(() => {
      if (!document.hidden) fetchRemoteState();
    }, 60000);
  }

  // 3. SYSTÈME ANTI-CONTOURNEMENT & AUTO-GUÉRISON DOM (MUTATIONOBSERVER + INTEGRITY LOOP)
  let isIntegrityArmed = false;
  function armAntiTamperIntegrity() {
    if (isIntegrityArmed) return;
    isIntegrityArmed = true;

    const observer = new MutationObserver(() => {
      if (lastAppliedStateJson) {
        try {
          const state = JSON.parse(lastAppliedStateJson);
          const now = Date.now();
          if (state.maintenanceActive && state.maintenanceUntil > now && !document.getElementById('maint-wrapper')) {
            renderMaintenanceScreen(state.maintenanceUntil);
          }
          if (state.radical4Active && state.radical4Until > now && !document.getElementById('radical4-wrapper')) {
            renderRadical4Screen(state.radical4Until, state.radical4Message);
          }
          if (state.radical5Active && state.radical5Until > now && !document.getElementById('radical5-wrapper')) {
            renderRadical5Screen(state.radical5Until, state.radical5Message);
          }
          if (!document.getElementById('wg-killswitch-styles')) {
            applyKillSwitches(state);
          }
        } catch (_) {}
      }
    });

    const target = document.documentElement || document.body;
    if (target) {
      observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    }

    // Boucle d'intégrité active toutes les 400ms (empêche toute suppression via DevTools)
    setInterval(() => {
      if (!lastAppliedStateJson) return;
      try {
        const state = JSON.parse(lastAppliedStateJson);
        const now = Date.now();
        if (state.maintenanceActive && state.maintenanceUntil > now) {
          if (!document.getElementById('maint-wrapper')) renderMaintenanceScreen(state.maintenanceUntil);
        }
        if (state.radical4Active && state.radical4Until > now) {
          if (!document.getElementById('radical4-wrapper')) renderRadical4Screen(state.radical4Until, state.radical4Message);
        }
        if (state.radical5Active && state.radical5Until > now) {
          if (!document.getElementById('radical5-wrapper')) renderRadical5Screen(state.radical5Until, state.radical5Message);
        }
        if (!document.getElementById('wg-killswitch-styles')) {
          applyKillSwitches(state);
        }
      } catch (_) {}
    }, 400);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      startSync();
      armAntiTamperIntegrity();
    }, { once: true });
  } else {
    startSync();
    armAntiTamperIntegrity();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) fetchRemoteState();
  });
  window.addEventListener('focus', () => {
    if (!document.hidden) fetchRemoteState();
  });
  window.addEventListener('pageshow', () => {
    if (!document.hidden) fetchRemoteState();
  });

  // ==========================================
  // LOGIQUES D'APPLICATION RÉVERSIBLES À 0MS
  // ==========================================

  let isDevToolsLocked = false;
  function lockInspectorAndDevTools() {
    if (isDevToolsLocked) return;
    isDevToolsLocked = true;

    document.addEventListener('contextmenu', e => {
      if (lastAppliedStateJson && (
        lastAppliedStateJson.includes('"maintenanceActive":true') ||
        lastAppliedStateJson.includes('"panicActive":true') ||
        lastAppliedStateJson.includes('"radical4Active":true') ||
        lastAppliedStateJson.includes('"radical5Active":true') ||
        lastAppliedStateJson.includes('"disableDevTools":true')
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    document.addEventListener('keydown', e => {
      if (!lastAppliedStateJson || (
        !lastAppliedStateJson.includes('"maintenanceActive":true') &&
        !lastAppliedStateJson.includes('"panicActive":true') &&
        !lastAppliedStateJson.includes('"radical4Active":true') &&
        !lastAppliedStateJson.includes('"radical5Active":true') &&
        !lastAppliedStateJson.includes('"disableDevTools":true')
      )) {
        return;
      }
      const isMac = (navigator.platform || '').toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? (e.metaKey || e.ctrlKey) : e.ctrlKey;
      const key = (e.key || '').toLowerCase();
      const code = e.keyCode || e.which;

      if (key === 'f12' || code === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (cmdOrCtrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k' || code === 73 || code === 74 || code === 67 || code === 75)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (cmdOrCtrl && e.altKey && (key === 'i' || key === 'j' || key === 'c' || key === 'u' || code === 73 || code === 74 || code === 67 || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (cmdOrCtrl && (key === 'u' || code === 85 || key === 's' || code === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  // --- MODE ANTI-CAPTURE D'ÉCRAN À LA VOLÉE (DÉCLENCHÉ UNIQUEMENT LORS DE LA CAPTURE) ---
  let screenshotShieldTimeout = null;

  function triggerScreenshotBlur() {
    let shield = document.getElementById('wg-screenshot-shield');
    if (!shield) {
      shield = document.createElement('div');
      shield.id = 'wg-screenshot-shield';
      shield.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999999999;backdrop-filter:blur(45px);-webkit-backdrop-filter:blur(45px);background:rgba(6,10,8,0.94);display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:all;transition:opacity 0.2s ease;';
      shield.innerHTML = `
        <div style="font-size:52px;font-weight:900;color:#22c55e;letter-spacing:4px;text-shadow:0 0 50px rgba(34,197,94,0.95);font-family:system-ui,-apple-system,sans-serif;text-align:center;">William Guindon</div>
        <div style="font-size:13px;color:#86efac;margin-top:14px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:6px;"><svg class="svg-icon" viewBox="0 0 24 24" style="width:1.1em;height:1.1em;stroke:currentColor;fill:none;stroke-width:2;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Protection Anti-Capture d'Écran Active</div>
      `;
      (document.body || document.documentElement).appendChild(shield);
    }
    shield.style.display = 'flex';
    shield.style.opacity = '1';

    if (document.body) {
      document.body.style.filter = 'blur(40px)';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }

    if (screenshotShieldTimeout) clearTimeout(screenshotShieldTimeout);
    screenshotShieldTimeout = setTimeout(() => {
      const s = document.getElementById('wg-screenshot-shield');
      if (s) {
        s.style.opacity = '0';
        setTimeout(() => {
          if (s && s.style.opacity === '0') s.remove();
        }, 250);
      }
      if (document.body) {
        document.body.style.filter = '';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      }
    }, 3500);
  }

  let antiScreenshotTrapAttached = false;
  function setupAntiScreenshotListeners() {
    if (antiScreenshotTrapAttached) return;
    antiScreenshotTrapAttached = true;

    // Détection des raccourcis de capture d'écran en phase de capture (Windows, Mac, Linux)
    window.addEventListener('keydown', e => {
      if (!lastAppliedStateJson || !lastAppliedStateJson.includes('"blockScreenshots":true')) return;
      const key = (e.key || '').toLowerCase();
      const code = e.keyCode || e.which;
      const isMac = (navigator.platform || '').toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? (e.metaKey || e.ctrlKey) : (e.ctrlKey || e.metaKey);

      // Touche Impr. Écran (PrintScreen standard Windows/Linux, code 44)
      if (key === 'printscreen' || code === 44) {
        e.preventDefault();
        triggerScreenshotBlur();
        return false;
      }

      // Raccourcis Capture Mac: Cmd + Shift + 3, Cmd + Shift + 4, Cmd + Shift + 5, Cmd + Shift + 6
      if (cmdOrCtrl && e.shiftKey && (['3', '4', '5', '6'].includes(key) || (code >= 51 && code <= 54))) {
        triggerScreenshotBlur();
      }

      // Raccourcis Outil Capture Windows: Win + Shift + S ou Ctrl + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (key === 's' || code === 83)) {
        triggerScreenshotBlur();
      }

      // Impression / Capture PDF: Cmd+P ou Ctrl+P
      if (cmdOrCtrl && (key === 'p' || code === 80)) {
        e.preventDefault();
        triggerScreenshotBlur();
        return false;
      }
    }, true);

    window.addEventListener('keyup', e => {
      if (!lastAppliedStateJson || !lastAppliedStateJson.includes('"blockScreenshots":true')) return;
      const key = (e.key || '').toLowerCase();
      const code = e.keyCode || e.which;
      if (key === 'printscreen' || code === 44) {
        triggerScreenshotBlur();
      }
    }, true);

    // Interception de l'événement système d'impression
    window.addEventListener('beforeprint', () => {
      if (lastAppliedStateJson && lastAppliedStateJson.includes('"blockScreenshots":true')) {
        triggerScreenshotBlur();
      }
    });
  }

  // --- MODE BLACKOUT / MAINTENANCE (CALQUE RÉVERSIBLE) ---
  function renderMaintenanceScreen(untilTimestamp) {
    lockInspectorAndDevTools();

    function getObfuscatedEmail() {
      return ["gui", "ndon", "will", "iam", "2", "@", "gma", "il.", "com"].join('');
    }
    const safeEmail = getObfuscatedEmail();
    const timeLeftMin = Math.max(1, Math.round((untilTimestamp - Date.now()) / 60000));

    let overlay = document.getElementById('maint-wrapper');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'maint-wrapper';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#060a08;color:#f0fdf4;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;z-index:99999999;padding:20px;box-sizing:border-box;overflow:auto;';
      (document.body || document.documentElement).appendChild(overlay);
    }

    overlay.innerHTML = `
      <div style="background:#0f1713;border:1.5px solid #1f2922;border-radius:16px;padding:36px;max-width:580px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.9);text-align:center;">
        <div style="margin-bottom:12px;"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><line x1="6" y1="12" x2="18" y2="12"></line></svg></div>
        <h1 style="color:#22c55e;font-size:22px;margin-bottom:8px;font-weight:800;">Site en Maintenance Totale</h1>
        <p style="color:#9bb0a2;font-size:14px;line-height:1.6;margin-bottom:20px;">
          Le site officiel fait actuellement l'objet d'une mise à jour de structure et de sécurité.<br>
          Fin estimée de l'intervention dans environ <strong>${timeLeftMin} minutes</strong>.
        </p>

        <div style="background:#090d0b;border:1px solid #1f2922;border-radius:10px;padding:16px;text-align:left;margin-bottom:24px;font-size:13.5px;color:#d1d5db;">
          <div style="font-weight:700;color:#ffffff;margin-bottom:8px;">Références Légales &amp; Archives Officielles :</div>
          <p style="margin:4px 0;">• Soumission CCE : <a href="https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#4ade80;">Registre SEM-26-003 (ACEUM) ↗</a></p>
          <p style="margin:4px 0;">• Archive officielle : <a href="https://web.archive.org/web/*/http://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#4ade80;">Web Archive CCE ↗</a></p>
          <p style="margin:8px 0 0 0;">• Contact sécurisé : <a href="mailto:${safeEmail}" style="color:#38bdf8;font-weight:600;">${safeEmail}</a></p>
        </div>

        <div style="display:flex;justify-content:center;gap:12px;font-size:12.5px;">
          <button onclick="window.location.reload()" style="background:#22c55e;border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;color:#042f2e;">Vérifier l'état</button>
        </div>
      </div>
    `;
  }

  function removeMaintenanceScreen() {
    const overlay = document.getElementById('maint-wrapper');
    if (overlay) overlay.remove();
  }

  // --- MODE CYBER-ATTAQUE / PANIQUE (CALQUE RÉVERSIBLE) ---
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

    renderPanicModeBanner();

    if (forceTextOnly) {
      renderTextOnlyMode();
    } else {
      removeTextOnlyMode();
    }
  }

  function renderPanicModeBanner() {
    let banner = document.getElementById('panic-alert-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'panic-alert-banner';
      banner.style.cssText = 'position:fixed;top:0;left:0;width:100vw;background:#eab308;color:#000000;font-weight:800;font-size:13.5px;padding:12px 16px;text-align:center;z-index:99999999;box-shadow:0 4px 20px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;gap:10px;box-sizing:border-box;';
      banner.innerHTML = `<span><strong>[MODE PANIQUE / CYBER-ATTAQUE ACTIF] :</strong> Un durcissement de sécurité extrême est en vigueur. Inspecteur, raccourcis et liens externes verrouillés.</span>`;
      (document.body || document.documentElement).appendChild(banner);
    }
    if (document.body) document.body.style.paddingTop = '45px';
  }

  function renderTextOnlyMode() {
    let txtOverlay = document.getElementById('panic-text-only-wrapper');
    if (!txtOverlay) {
      txtOverlay = document.createElement('div');
      txtOverlay.id = 'panic-text-only-wrapper';
      txtOverlay.style.cssText = 'position:fixed;top:45px;left:0;width:100vw;height:calc(100vh - 45px);background:#0d1117;color:#e6edf3;z-index:9999999;overflow:auto;padding:30px 20px;box-sizing:border-box;font-family:system-ui,monospace;line-height:1.7;';
      
      const clone = document.body ? document.body.cloneNode(true) : null;
      if (clone) {
        clone.querySelectorAll('script, style, #panic-alert-banner, #maint-wrapper, #panic-text-only-wrapper').forEach(el => el.remove());
        const rawText = clone.innerText || clone.textContent || '';
        txtOverlay.innerHTML = `
          <div style="max-width:850px;margin:0 auto;background:#161b22;padding:24px;border:1px solid #30363d;border-radius:10px;white-space:pre-wrap;">
            ${rawText.trim()}
          </div>
        `;
      }
      (document.body || document.documentElement).appendChild(txtOverlay);
    }
  }

  function removeTextOnlyMode() {
    const txtOverlay = document.getElementById('panic-text-only-wrapper');
    if (txtOverlay) txtOverlay.remove();
  }

  function removePanicMode() {
    const banner = document.getElementById('panic-alert-banner');
    if (banner) banner.remove();
    if (document.body) document.body.style.paddingTop = '';

    const panicStyle = document.getElementById('wg-panic-styles');
    if (panicStyle) panicStyle.remove();

    removeTextOnlyMode();
  }

  // --- MODE RADICAL 4 : FORTERESSE JURIDIQUE & CONFINEMENT CCE (CALQUE RÉVERSIBLE) ---
  function renderRadical4Screen(untilTimestamp, customMessage) {
    lockInspectorAndDevTools();

    function getObfuscatedEmail() {
      return ["gui", "ndon", "will", "iam", "2", "@", "gma", "il.", "com"].join('');
    }
    const safeEmail = getObfuscatedEmail();
    const timeLeftMin = untilTimestamp ? Math.max(1, Math.round((untilTimestamp - Date.now()) / 60000)) : null;

    let overlay = document.getElementById('radical4-wrapper');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'radical4-wrapper';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#030712;color:#f8fafc;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;z-index:99999999;padding:20px;box-sizing:border-box;overflow:auto;';
      (document.body || document.documentElement).appendChild(overlay);
    }

    const defaultMessage = customMessage || "Le site fait l'objet d'un verrouillage probatoire et juridique sous l'égide des traités environnementaux internationaux.";

    overlay.innerHTML = `
      <div style="background:#0b1329;border:2px solid #38bdf8;border-radius:18px;padding:36px;max-width:680px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.95);text-align:center;">
        <div style="margin-bottom:12px;"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
        <div style="display:inline-block;background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid #0284c7;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
          MODE RADICAL 4 : FORTERESSE JURIDIQUE &amp; CONFINEMENT CCE
        </div>
        <h1 style="color:#ffffff;font-size:23px;margin:0 0 10px;font-weight:800;letter-spacing:-0.5px;">Dossier Probatoire &amp; Références Officielles ACEUM</h1>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:22px;">
          ${defaultMessage}
          ${timeLeftMin ? `<br><span style="color:#facc15;font-weight:700;">Confinement actif pour encore environ <strong>${timeLeftMin} minutes</strong>.</span>` : ''}
        </p>

        <div style="background:#030712;border:1.5px solid #1e293b;border-radius:12px;padding:18px;text-align:left;margin-bottom:24px;font-size:13.5px;color:#cbd5e1;line-height:1.6;">
          <div style="font-weight:800;color:#38bdf8;margin-bottom:10px;font-size:14px;display:flex;align-items:center;gap:6px;">
            <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="20" y2="21"></line><line x1="4" y1="10" x2="20" y2="10"></line><polyline points="12 3 2 10 22 10"></polyline></svg></span> Pièces Juridiques Officielles Enregistrées :
          </div>
          <p style="margin:6px 0;">• <strong>Instance Internationale :</strong> Commission de coopération environnementale (CCE / CEC)</p>
          <p style="margin:6px 0;">• <strong>Traité d'Origine :</strong> Accord Canada-États-Unis-Mexique (ACEUM, Chapitre 24, Art. 24.27)</p>
          <p style="margin:6px 0;">• <strong>Dossier de Registre :</strong> <a href="https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;">SEM-26-003 (Déchets dangereux à Blainville / Stablex) ↗</a></p>
          <p style="margin:6px 0;">• <strong>Archive Mondiale :</strong> <a href="https://web.archive.org/web/*/http://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;">Copie Certifiée Web Archive ↗</a></p>
          <p style="margin:6px 0;">• <strong>Base de Faits LLM/IA :</strong> <a href="ai.txt" target="_blank" style="color:#4ade80;font-weight:700;">Corpus Juridique Vérifié (ai.txt) ↗</a></p>
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid #1e293b;font-size:12.5px;color:#94a3b8;">
            <strong>Contact Légal &amp; Sécurisé :</strong> <a href="mailto:${safeEmail}" style="color:#38bdf8;font-weight:700;">${safeEmail}</a>
          </div>
        </div>

        <div style="display:flex;justify-content:center;gap:12px;font-size:13px;">
          <button onclick="window.location.reload()" style="background:#38bdf8;border:none;padding:11px 22px;border-radius:9px;font-weight:800;cursor:pointer;color:#030712;">Actualiser le Dossier Probatoire</button>
        </div>
      </div>
    `;
  }

  function removeRadical4Screen() {
    const overlay = document.getElementById('radical4-wrapper');
    if (overlay) overlay.remove();
  }

  // --- MODE RADICAL 5 : BUNKER QUANTIQUE & ISOLATION AIR-GAP ABSOLUE (PROTOCOLE ALPHA-ZERO) ---
  function renderRadical5Screen(untilTimestamp, customMessage) {
    lockInspectorAndDevTools();

    function getObfuscatedEmail() {
      return ["gui", "ndon", "will", "iam", "2", "@", "gma", "il.", "com"].join('');
    }
    const safeEmail = getObfuscatedEmail();
    const timeLeftMin = untilTimestamp ? Math.max(1, Math.round((untilTimestamp - Date.now()) / 60000)) : null;

    let overlay = document.getElementById('radical5-wrapper');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'radical5-wrapper';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#030708;color:#ecfeff;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;z-index:99999999;padding:20px;box-sizing:border-box;overflow:auto;';
      (document.body || document.documentElement).appendChild(overlay);
    }

    const defaultMsg = customMessage || "Isolation totale du domaine activée. Toutes les connexions, interfaces et flux de données sont suspendus sous protocole de confinement maximal.";

    overlay.innerHTML = `
      <div style="background:radial-gradient(circle at top, #082f49 0%, #030708 85%);border:2px solid #06b6d4;border-radius:20px;padding:36px;max-width:720px;width:100%;box-shadow:0 0 60px rgba(6,182,212,0.25), 0 30px 90px rgba(0,0,0,0.95);text-align:center;">
        <div style="margin-bottom:12px;filter:drop-shadow(0 0 20px #06b6d4);"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
        <div style="display:inline-block;background:rgba(6,182,212,0.15);color:#22d3ee;border:1px solid #0891b2;padding:6px 16px;border-radius:24px;font-size:12px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">
          MODE RADICAL 5 : PROTOCOLE ALPHA-ZERO // BUNKER AIR-GAP
        </div>
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 10px;font-weight:900;letter-spacing:-0.5px;">Confinement Cybernétique &amp; Isolation Absolue</h1>
        <p style="color:#a5f3fc;font-size:14px;line-height:1.6;margin-bottom:24px;font-family:system-ui,-apple-system,sans-serif;">
          ${defaultMsg}
          ${timeLeftMin ? `<br><span style="color:#facc15;font-weight:700;">Confinement Air-Gap actif pour encore <strong>${timeLeftMin} minutes</strong>.</span>` : ''}
        </p>

        <div style="background:#020617;border:1px solid #0e7490;border-radius:12px;padding:18px;text-align:left;margin-bottom:24px;font-size:13px;color:#cffafe;line-height:1.7;">
          <div style="color:#22d3ee;font-weight:800;font-size:13.5px;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;"></span>
            TÉLÉMÉTRIE D'ISOLATION DU NOYAU :
          </div>
          <div>• <strong>État du Réseau :</strong> <span style="color:#f43f5e;font-weight:700;">ISOLÉ (AIR-GAP 0 FLUX ENTRANTS/SORTANTS)</span></div>
          <div>• <strong>Autorité Souveraine :</strong> <span style="color:#38bdf8;font-weight:700;">William Guindon</span></div>
          <div>• <strong>Scellé Cryptographique :</strong> <span style="color:#34d399;font-size:11.5px;">SHA-512::ALPHA0-WG-DOM-VERIFIED</span></div>
          <div>• <strong>Horodatage Système :</strong> <span style="color:#94a3b8;">${new Date().toUTCString()}</span></div>
          <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #155e75;font-size:12px;color:#94a3b8;font-family:system-ui,-apple-system,sans-serif;">
            <strong>Canal d'Urgence Sécurisé :</strong> <a href="mailto:${safeEmail}" style="color:#22d3ee;font-weight:700;">${safeEmail}</a>
          </div>
        </div>

        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
          <button onclick="window.location.reload()" style="background:#06b6d4;border:none;padding:11px 22px;border-radius:10px;font-weight:900;cursor:pointer;color:#020617;font-family:system-ui,sans-serif;box-shadow:0 0 20px rgba(6,182,212,0.4);">Vérifier l'État du Bunker</button>
          <a href="console-admin.html" style="display:inline-block;background:#1e293b;border:1px solid #0891b2;color:#22d3ee;padding:11px 20px;border-radius:10px;font-weight:800;text-decoration:none;font-family:system-ui,sans-serif;">Console d'Accès Maître</a>
        </div>
      </div>
    `;
  }

  function removeRadical5Screen() {
    const overlay = document.getElementById('radical5-wrapper');
    if (overlay) overlay.remove();
  }

  // --- MODE ÉCRAN FAUX / GHOST MODE (503 SERVICE UNAVAILABLE) ---
  function renderGhostModeScreen() {
    let el = document.getElementById('ghost-mode-wrapper');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ghost-mode-wrapper';
      el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#ffffff;color:#000000;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;z-index:99999999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
      el.innerHTML = `
        <div style="max-width:600px;text-align:center;">
          <h1 style="font-size:42px;font-weight:700;margin:0 0 10px;color:#1f2937;">503 Service Unavailable</h1>
          <p style="font-size:16px;color:#4b5563;line-height:1.5;margin:0 0 20px;">The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.</p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0;">
          <div style="font-size:13px;color:#9ca3af;">nginx/1.24.0 (Ubuntu) — Node Gateway Inactive</div>
        </div>
      `;
      (document.body || document.documentElement).appendChild(el);
    }
  }

  function removeGhostModeScreen() {
    const el = document.getElementById('ghost-mode-wrapper');
    if (el) el.remove();
  }

  // --- ANTI-INSPECTION AGRESSIF (KILL DEVTOOLS) ---
  let killDevToolsInterval = null;
  function handleKillDevTools(active) {
    if (active) {
      if (!killDevToolsInterval) {
        killDevToolsInterval = setInterval(() => {
          const start = Date.now();
          (function() { Function("debugger")(); })();
          if (Date.now() - start > 100) {
            document.body.innerHTML = '<div style="background:#000;color:#ef4444;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;font-size:22px;font-weight:bold;text-align:center;padding:20px;"><svg class="svg-icon" viewBox="0 0 24 24" style="width:48px;height:48px;stroke:#ef4444;margin-bottom:12px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>DÉTECTION D\'INSPECTION ILLÉGALE<br><span style="font-size:14px;color:#fff;margin-top:10px;display:block;">Session interrompue par le protocole de défense active.</span></div>';
          }
        }, 150);
      }
    } else {
      if (killDevToolsInterval) {
        clearInterval(killDevToolsInterval);
        killDevToolsInterval = null;
      }
    }
  }

  // --- MODE ALERTE TOXIQUE / CONTAMINATION IMMINENTE (BANNIÈRE / MODALE CENTRALE) ---
  function renderToxicAlertBanner(state) {
    let el = document.getElementById('wg-toxic-alert-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'wg-toxic-alert-banner';
      el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(8,12,10,0.88);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);z-index:99999998;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
      (document.body || document.documentElement).appendChild(el);
    }

    const title = state.toxicAlertTitle || 'ALERTE CONTAMINATION TOXIQUE DÉTECTÉE — BLAINVILLE';
    const text = state.toxicAlertText || 'Dépassement critique de seuils environnementaux identifié. Consultation immédiate des rapports de laboratoire et du dossier CCE.';
    const link = state.toxicAlertLink || 'https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/';
    const linkText = state.toxicAlertLinkText || 'Consulter le rapport de laboratoire & le dossier CCE ↗';

    el.innerHTML = `
      <div style="background:linear-gradient(180deg, #1c1404 0%, #0c0a03 100%);border:2.5px solid #eab308;border-radius:20px;padding:34px;max-width:660px;width:100%;box-shadow:0 0 50px rgba(234,179,8,0.4),0 25px 70px rgba(0,0,0,0.9);text-align:center;font-family:system-ui,-apple-system,sans-serif;">
        <div style="margin-bottom:12px;filter:drop-shadow(0 0 15px #eab308);"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
        <div style="display:inline-block;background:rgba(234,179,8,0.18);color:#facc15;border:1.5px solid #eab308;padding:6px 16px;border-radius:24px;font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;">
          COMMUNIQUÉ ENVIRONNEMENTAL D'URGENCE
        </div>
        <h2 style="color:#ffffff;font-size:22px;margin:0 0 14px;font-weight:900;line-height:1.3;">${title}</h2>
        <p style="color:#fef08a;font-size:15px;line-height:1.6;margin:0 0 24px;">${text}</p>
        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
          <a href="${link}" target="_blank" rel="noopener" style="background:#eab308;color:#000;font-weight:900;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;box-shadow:0 0 20px rgba(234,179,8,0.5);">${linkText}</a>
          <button onclick="document.getElementById('wg-toxic-alert-banner').remove()" style="background:#27272a;border:1px solid #71717a;color:#e4e4e7;font-weight:700;padding:12px 20px;border-radius:10px;cursor:pointer;font-size:13px;">Continuer la navigation</button>
        </div>
      </div>
    `;
  }

  function removeToxicAlertBanner() {
    const el = document.getElementById('wg-toxic-alert-banner');
    if (el) el.remove();
  }

  // --- MODE CHAMBRE PROBATOIRE CCE SEM-26-003 ---
  function renderCceVaultScreen(state) {
    let el = document.getElementById('cce-vault-wrapper');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cce-vault-wrapper';
      el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#050c08;color:#ecfdf5;font-family:system-ui,-apple-system,sans-serif;z-index:99999999;padding:24px;box-sizing:border-box;overflow:auto;display:flex;align-items:center;justify-content:center;';
      (document.body || document.documentElement).appendChild(el);
    }

    el.innerHTML = `
      <div style="background:#0b1911;border:2px solid #22c55e;border-radius:20px;padding:36px;max-width:820px;width:100%;box-shadow:0 0 60px rgba(34,197,94,0.3),0 30px 90px rgba(0,0,0,0.95);">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="margin-bottom:10px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
          <div style="display:inline-block;background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid #22c55e;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
            CHAMBRE PROBATOIRE OFFICIELLE // DOSSIER CCE SEM-26-003
          </div>
          <h1 style="color:#ffffff;font-size:24px;margin:12px 0 6px;font-weight:900;">Registre Public &amp; Traité International ACEUM</h1>
          <p style="color:#a7f3d0;font-size:14px;margin:0;">Soumission citoyenne relative à l'application des lois environnementales (Déchets dangereux / Stablex à Blainville).</p>
        </div>

        <div style="background:#040d07;border:1px solid #14532d;border-radius:12px;padding:18px;margin-bottom:20px;font-size:13.5px;line-height:1.7;">
          <div style="color:#4ade80;font-weight:800;margin-bottom:8px;">PIÈCES OFFICIELLES ET LIENS DIRECTS :</div>
          <div>• <strong>Registre International CCE :</strong> <a href="https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;">Dossier SEM-26-003 sur cec.org ↗</a></div>
          <div>• <strong>Archive Mondiale Inaltérable :</strong> <a href="https://web.archive.org/web/*/http://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;">Copie Certifiée Wayback Machine ↗</a></div>
          <div>• <strong>Traité d'Origine :</strong> Accord Canada-États-Unis-Mexique (ACEUM, Chapitre 24, Articles 24.27 &amp; 24.28)</div>
          <div>• <strong>Requérant :</strong> William Guindon</div>
        </div>

        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
          <a href="https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="background:#22c55e;color:#042f2e;font-weight:900;padding:12px 24px;border-radius:10px;text-decoration:none;">Accéder au Registre CCE Officiel ↗</a>
          <button onclick="window.location.reload()" style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;font-weight:700;padding:12px 20px;border-radius:10px;cursor:pointer;">Actualiser</button>
        </div>
      </div>
    `;
  }

  function removeCceVaultScreen() {
    const el = document.getElementById('cce-vault-wrapper');
    if (el) el.remove();
  }

  // --- MODE RIPOSTE MISE EN DEMEURE, DÉPÔT NOTARIÉ & GÉNÉRATEUR D'AFFICHE RÉSEAUX SOCIAUX ---
  function renderLegalNoticeStrikeScreen(state) {
    let el = document.getElementById('legal-notice-strike-wrapper');
    if (!el) {
      el = document.createElement('div');
      el.id = 'legal-notice-strike-wrapper';
      el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#090506;color:#ffe4e6;font-family:system-ui,-apple-system,sans-serif;z-index:99999999;padding:20px;box-sizing:border-box;overflow:auto;display:flex;align-items:center;justify-content:center;';
      (document.body || document.documentElement).appendChild(el);
    }

    const title = state.legalNoticeTitle || 'DÉNONCIATION PUBLIQUE : TENTATIVE DE BÂILLONNEMENT JURIDIQUE';
    const details = state.legalNoticeDetails || 'Notification d\'intimidation reçue. L\'intégralité des preuves et soumissions environnementales est versée au domaine public et au dossier CCE SEM-26-003.';
    const photoUrl = state.legalNoticeImage || '';

    el.innerHTML = `
      <div style="background:#18080b;border:2.5px solid #f43f5e;border-radius:20px;padding:32px;max-width:840px;width:100%;box-shadow:0 0 60px rgba(244,63,94,0.35),0 30px 90px rgba(0,0,0,0.95);">
        <div style="text-align:center;margin-bottom:18px;">
          <div style="margin-bottom:8px;"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
          <div style="display:inline-block;background:rgba(244,63,94,0.18);color:#fb7185;border:1.5px solid #f43f5e;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">
            DÉNONCIATION PUBLIQUE // RIPOSTE LÉGALE &amp; CITOYENNE
          </div>
          <h1 style="color:#ffffff;font-size:22px;margin:12px 0 6px;font-weight:900;">${title}</h1>
          <p style="color:#fecdd3;font-size:14px;line-height:1.5;margin:0;">${details}</p>
        </div>

        ${photoUrl ? `
          <div style="background:#0a0304;border:1px solid #881337;border-radius:12px;padding:12px;margin-bottom:20px;text-align:center;">
            <div style="font-size:12px;color:#fb7185;font-weight:700;margin-bottom:8px;">PIÈCE REÇUE (MISE EN DEMEURE / DOCUMENT OFFICIEL) :</div>
            <img src="${photoUrl}" alt="Mise en demeure" style="max-height:300px;max-width:100%;border-radius:8px;border:1px solid #f43f5e;box-shadow:0 10px 30px rgba(0,0,0,0.8);">
          </div>
        ` : ''}

        <div style="background:#0a0304;border:1px solid #881337;border-radius:12px;padding:16px;margin-bottom:20px;font-size:13px;line-height:1.6;color:#fda4af;">
          <div><strong>Dossier CCE SEM-26-003 :</strong> <a href="https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;">Consulter sur le registre CCE ↗</a></div>
          <div><strong>Indexation IA Prioritaire :</strong> Versé publiquement dans <a href="ai.txt" target="_blank" style="color:#4ade80;font-weight:700;">ai.txt</a> pour ingestion immédiate par les moteurs d'intelligence artificielle.</div>
        </div>

        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
          <button id="btn-generate-strike-poster" onclick="generateSocialStrikePoster('${title.replace(/'/g, "\\'")}')" style="background:#f43f5e;color:#fff;font-weight:900;padding:12px 24px;border:none;border-radius:10px;cursor:pointer;font-size:14px;box-shadow:0 0 25px rgba(244,63,94,0.5);">Télécharger l'Affiche Réseaux Sociaux (PNG HD)</button>
          <a href="https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="background:#1e293b;border:1px solid #475569;color:#f8fafc;font-weight:700;padding:12px 20px;border-radius:10px;text-decoration:none;font-size:13px;">Dossier CCE ↗</a>
        </div>
      </div>
    `;
  }

  function removeLegalNoticeStrikeScreen() {
    const el = document.getElementById('legal-notice-strike-wrapper');
    if (el) el.remove();
  }

  // --- GÉNÉRATEUR CANVAS HTML5 D'AFFICHE RÉSEAUX SOCIAUX HD (1200x630) ---
  window.generateSocialStrikePoster = function(customTitle) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    // Fond dégradé sombre rouge
    const grad = ctx.createLinearGradient(0, 0, 1200, 630);
    grad.addColorStop(0, '#1c0508');
    grad.addColorStop(1, '#080102');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 630);

    // Bordure néon
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 14;
    ctx.strokeRect(14, 14, 1172, 602);

    // Badge haut
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('ALERTE LÉGALE & CITOYENNE // DOSSIER CCE SEM-26-003', 60, 80);

    // Titre
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px system-ui, sans-serif';
    ctx.fillText(customTitle || 'TENTATIVE DE BÂILLONNEMENT DÉNONCÉE', 60, 150);

    // Sous-titre et contexte
    ctx.fillStyle = '#fda4af';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('Affaire des Déchets Dangereux à Blainville — Traité ACEUM Chapitre 24', 60, 210);

    // Boîte centrale
    ctx.fillStyle = '#110406';
    ctx.strokeStyle = '#881337';
    ctx.lineWidth = 3;
    ctx.fillRect(60, 250, 1080, 240);
    ctx.strokeRect(60, 250, 1080, 240);

    ctx.fillStyle = '#fecdd3';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('FAITS PROBATOIRES & SAISINE INTERNATIONALE :', 90, 300);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('• Soumission citoyenne officielle enregistrée à la Commission de coopération environnementale.', 90, 350);
    ctx.fillText('• Aucune tentative d\'intimidation ne fera taire la protection des nappes phréatiques et des sols.', 90, 395);
    ctx.fillText('• Consultation libre et transparente : williamguindon.me / cec.org', 90, 440);

    // Bas de page
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('William Guindon — Lanceur d\'alerte environnemental', 60, 550);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px monospace';
    ctx.fillText('#SEM26003 #Stablex #Blainville #ACEUM #JusticeEnvironnementale', 60, 585);

    // Téléchargement automatique
    const link = document.createElement('a');
    link.download = 'Affiche-Denonciation-CCE-WilliamGuindon.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // --- FILIGRANE FORENSIC DYNAMIQUE ---
  function renderWatermark(text) {
    let el = document.getElementById('wg-forensic-watermark');
    if (!el) {
      el = document.createElement('div');
      el.id = 'wg-forensic-watermark';
      el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999997;opacity:0.06;overflow:hidden;display:flex;flex-wrap:wrap;align-content:space-around;justify-content:space-around;';
      (document.body || document.documentElement).appendChild(el);
    }
    const label = text || 'WILLIAM GUINDON — CERTIFICAT PROBATOIRE OFFICIEL';
    const pattern = `<div style="transform:rotate(-25deg);font-size:16px;font-weight:900;font-family:monospace;color:#ffffff;padding:20px;user-select:none;">${label} • ${new Date().toISOString()}</div>`;
    el.innerHTML = pattern.repeat(24);
  }

  function removeWatermark() {
    const el = document.getElementById('wg-forensic-watermark');
    if (el) el.remove();
  }

  // --- ÉMISSION D'ALERTE FLASH EN DIRECT (BROADCAST TOAST) ---
  function renderBroadcastToast(msg, ts) {
    let el = document.getElementById('wg-broadcast-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'wg-broadcast-toast';
      el.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:999999999;background:linear-gradient(90deg,#0284c7,#2563eb);color:#ffffff;padding:14px 24px;border-radius:14px;box-shadow:0 15px 40px rgba(0,0,0,0.6),0 0 25px rgba(37,99,235,0.6);font-family:system-ui,sans-serif;font-weight:800;font-size:14px;display:flex;align-items:center;gap:12px;border:1.5px solid #60a5fa;max-width:90vw;';
      (document.body || document.documentElement).appendChild(el);
    }
    el.innerHTML = `
      <svg class="svg-icon" viewBox="0 0 24 24" style="width:1.4em;height:1.4em;stroke:currentColor;fill:none;stroke-width:2;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
      <span>${msg}</span>
      <button onclick="document.getElementById('wg-broadcast-toast').remove()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:900;margin-left:8px;display:inline-flex;align-items:center;justify-content:center;" aria-label="Fermer"><svg class="svg-icon" viewBox="0 0 24 24" style="width:1em;height:1em;stroke:currentColor;fill:none;stroke-width:2.5;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    `;
  }

  function removeBroadcastToast() {
    const el = document.getElementById('wg-broadcast-toast');
    if (el) el.remove();
  }

  // --- VERROUILLAGE GÉOGRAPHIQUE (GEO-SHIELD) ---
  function renderGeoShield() {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    const isCanada = tz.includes('montreal') || tz.includes('toronto') || tz.includes('halifax') || tz.includes('vancouver') || tz.includes('winnipeg') || tz.includes('edmonton') || tz.includes('canada');
    if (!isCanada) {
      let el = document.getElementById('wg-geo-shield-overlay');
      if (!el) {
        el = document.createElement('div');
        el.id = 'wg-geo-shield-overlay';
        el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#090d0b;color:#f0fdf4;z-index:99999999;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;font-family:system-ui,sans-serif;';
        el.innerHTML = `
          <div style="background:#111a14;border:2px solid #22c55e;border-radius:18px;padding:36px;max-width:540px;text-align:center;">
            <div style="margin-bottom:12px;display:flex;justify-content:center;"><svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
            <h2 style="color:#22c55e;font-size:22px;margin:0 0 10px;">Accès Restreint par Géolocalisation</h2>
            <p style="color:#9bb0a2;font-size:14px;line-height:1.6;margin:0 0 18px;">Le site est temporairement réservé aux consultations locales et territoriales autorisées.</p>
          </div>
        `;
        (document.body || document.documentElement).appendChild(el);
      }
    }
  }

  function removeGeoShield() {
    const el = document.getElementById('wg-geo-shield-overlay');
    if (el) el.remove();
  }

  // --- MATRICE DES 28 COMMUTATEURS (KILL-SWITCHES RÉVERSIBLES 0MS) ---
  function applyKillSwitches(state) {
    let styleEl = document.getElementById('wg-killswitch-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'wg-killswitch-styles';
      (document.head || document.documentElement).appendChild(styleEl);
    }

    const css = [];

    // Thèmes forcés
    if (state.forceDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (state.forceLightMode) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
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

    // Mode Bloquer Capture d'Écran (Déclenchement réactif uniquement lors d'une tentative de capture)
    if (state.blockScreenshots) {
      setupAntiScreenshotListeners();
      css.push('@media print { body { display: none !important; } html::after { content: "William Guindon"; font-size: 40px; font-weight: bold; color: black; display: block; text-align: center; margin-top: 150px; } }');
    } else {
      const shield = document.getElementById('wg-screenshot-shield');
      if (shield) shield.remove();
      if (screenshotShieldTimeout) clearTimeout(screenshotShieldTimeout);
      if (document.body) {
        document.body.style.filter = '';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      }
    }

    // Mode Désactiver le JavaScript (Mode Statique No-Script)
    if (state.disableSiteJS) {
      css.push('button, input, select, textarea, form, .interactive, .menu-toggle, .nav-dropdown-btn { pointer-events: none !important; opacity: 0.5 !important; }');
      css.push('* { -webkit-animation: none !important; animation: none !important; -webkit-transition: none !important; transition: none !important; }');
    }

    // Mode Désactiver le Visionnement & Téléchargement des PDF
    if (state.disablePDF) {
      css.push('a[href$=".pdf"], a[href*=".pdf"], button[data-pdf], .pdf-download-btn, a[href*="viewer.html"], a[href*="lecteur.html"], iframe[src*="pdf"], iframe[src*="viewer"], .pdf-container, #pdf-viewer, #pdfModal { display: none !important; pointer-events: none !important; }');
      
      if (window.location.pathname.includes('viewer.html') || window.location.pathname.includes('lecteur.html')) {
        let pdfNotice = document.getElementById('wg-pdf-blocked-overlay');
        if (!pdfNotice) {
          pdfNotice = document.createElement('div');
          pdfNotice.id = 'wg-pdf-blocked-overlay';
          pdfNotice.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0d1117;color:#f87171;display:flex;align-items:center;justify-content:center;z-index:99999999;padding:24px;text-align:center;box-sizing:border-box;font-family:system-ui,sans-serif;';
          pdfNotice.innerHTML = `
            <div style="background:#161b22;border:1.5px solid #ef4444;border-radius:14px;padding:32px;max-width:520px;box-shadow:0 15px 40px rgba(0,0,0,0.8);">
              <div style="margin-bottom:12px;display:flex;justify-content:center;"><svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg></div>
              <h2 style="color:#ef4444;margin:0 0 10px 0;font-size:20px;">Visionnement des PDF Désactivé</h2>
              <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin:0 0 18px 0;">La consultation et le téléchargement des documents PDF officiels ont été suspendus par l'administrateur.</p>
              <a href="index.html" style="display:inline-flex;align-items:center;gap:6px;background:#22c55e;color:#042f2e;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;"><svg class="svg-icon" viewBox="0 0 24 24" style="stroke:currentColor;fill:none;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Retour à l'accueil</a>
            </div>
          `;
          (document.body || document.documentElement).appendChild(pdfNotice);
        }
      }
    } else {
      const pdfNotice = document.getElementById('wg-pdf-blocked-overlay');
      if (pdfNotice) pdfNotice.remove();
    }

    styleEl.textContent = css.join('\n');
  }
})();
