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

    // 4. Commutateurs individuels (28 Kill-Switches réversibles 0ms)
    applyKillSwitches(state);
  }

  // Application immédiate au chargement initial depuis le stockage local / session
  try {
    const cached = getStoredState();
    applyState(cached, true);
  } catch (e) {}

  // Synchronisation distante continue multi-sources sans blocage ni délai CDN
  let isFetching = false;
  async function fetchRemoteState() {
    if (isFetching) return;
    isFetching = true;

    const ts = Date.now();
    const endpoints = [
      {
        url: `https://api.github.com/repos/Bwillou1/WilliamGuindon/contents/data/site-state.json?ref=main&_t=${ts}`,
        headers: { 'Accept': 'application/vnd.github.v3+json, application/vnd.github.v3.raw', 'Cache-Control': 'no-cache' }
      },
      {
        url: `https://raw.githubusercontent.com/Bwillou1/WilliamGuindon/main/data/site-state.json?_t=${ts}`,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      },
      {
        url: new URL('data/site-state.json?_t=' + ts, window.location.href).href,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      }
    ];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(ep.url, {
          cache: 'no-store',
          signal: controller.signal,
          headers: ep.headers
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          let rawData = null;
          try {
            rawData = await res.json();
          } catch (_) {
            try { rawData = await res.text(); } catch (__) {}
          }
          const remoteState = parseRemotePayload(rawData);
          if (remoteState && typeof remoteState === 'object' && shouldAcceptState(remoteState)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
            applyState(remoteState);
            if (syncChannel) {
              try { syncChannel.postMessage(remoteState); } catch (_) {}
            }
            break;
          }
        }
      } catch (_) {}
    }
    isFetching = false;
  }

  function startSync() {
    fetchRemoteState();
    setInterval(() => {
      if (!document.hidden) fetchRemoteState();
    }, 1500);
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
          if (state.blockScreenshots && !document.getElementById('wg-screenshot-shield')) {
            applyKillSwitches(state);
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
        if (state.blockScreenshots) {
          if (!document.getElementById('wg-screenshot-shield')) applyKillSwitches(state);
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
        lastAppliedStateJson.includes('"blockScreenshots":true')
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
        !lastAppliedStateJson.includes('"blockScreenshots":true')
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
      banner.innerHTML = `⚠️ <span><strong>MODE PANIQUE / CYBER-ATTAQUE ACTIF :</strong> Un durcissement de sécurité extrême est en vigueur. Inspecteur, raccourcis et liens externes verrouillés.</span>`;
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
        <div style="font-size:46px;margin-bottom:12px;">⚖️</div>
        <div style="display:inline-block;background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid #0284c7;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
          MODE RADICAL 4 : FORTERESSE JURIDIQUE & CONFINEMENT CCE
        </div>
        <h1 style="color:#ffffff;font-size:23px;margin:0 0 10px;font-weight:800;letter-spacing:-0.5px;">Dossier Probatoire & Références Officielles ACEUM</h1>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:22px;">
          ${defaultMessage}
          ${timeLeftMin ? `<br><span style="color:#facc15;font-weight:700;">⏱️ Confinement actif pour encore environ <strong>${timeLeftMin} minutes</strong>.</span>` : ''}
        </p>

        <div style="background:#030712;border:1.5px solid #1e293b;border-radius:12px;padding:18px;text-align:left;margin-bottom:24px;font-size:13.5px;color:#cbd5e1;line-height:1.6;">
          <div style="font-weight:800;color:#38bdf8;margin-bottom:10px;font-size:14px;display:flex;align-items:center;gap:6px;">
            <span>🏛️</span> Pièces Juridiques Officielles Enregistrées :
          </div>
          <p style="margin:6px 0;">• <strong>Instance Internationale :</strong> Commission de coopération environnementale (CCE / CEC)</p>
          <p style="margin:6px 0;">• <strong>Traité d'Origine :</strong> Accord Canada-États-Unis-Mexique (ACEUM, Chapitre 24, Art. 24.27)</p>
          <p style="margin:6px 0;">• <strong>Dossier de Registre :</strong> <a href="https://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;">SEM-26-003 (Déchets dangereux à Blainville / Stablex) ↗</a></p>
          <p style="margin:6px 0;">• <strong>Archive Mondiale :</strong> <a href="https://web.archive.org/web/*/http://www.cec.org/submissions/registry-of-submissions/hazardous-waste-disposal-in-blainville/" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;">Copie Certifiée Web Archive ↗</a></p>
          <p style="margin:6px 0;">• <strong>Base de Faits LLM/IA :</strong> <a href="ai.txt" target="_blank" style="color:#4ade80;font-weight:700;">Corpus Juridique Vérifié (ai.txt) ↗</a></p>
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid #1e293b;font-size:12.5px;color:#94a3b8;">
            🔒 <strong>Contact Légal & Sécurisé :</strong> <a href="mailto:${safeEmail}" style="color:#38bdf8;font-weight:700;">${safeEmail}</a>
          </div>
        </div>

        <div style="display:flex;justify-content:center;gap:12px;font-size:13px;">
          <button onclick="window.location.reload()" style="background:#38bdf8;border:none;padding:11px 22px;border-radius:9px;font-weight:800;cursor:pointer;color:#030712;">🔄 Actualiser le Dossier Probatoire</button>
        </div>
      </div>
    `;
  }

  function removeRadical4Screen() {
    const overlay = document.getElementById('radical4-wrapper');
    if (overlay) overlay.remove();
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

    // Mode Bloquer Capture d'Écran (Flou total + Nom William Guindon)
    if (state.blockScreenshots) {
      css.push('body { filter: blur(35px) !important; user-select: none !important; -webkit-user-select: none !important; pointer-events: none !important; }');
      css.push('@media print { body { display: none !important; } html::after { content: "William Guindon"; font-size: 40px; font-weight: bold; color: black; display: block; text-align: center; margin-top: 150px; } }');
      
      let shield = document.getElementById('wg-screenshot-shield');
      if (!shield) {
        shield = document.createElement('div');
        shield.id = 'wg-screenshot-shield';
        shield.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999999999;backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);background:rgba(6,10,8,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;';
        shield.innerHTML = `
          <div style="font-size:46px;font-weight:900;color:#22c55e;letter-spacing:3px;text-shadow:0 0 40px rgba(34,197,94,0.8);font-family:system-ui,-apple-system,sans-serif;text-align:center;">William Guindon</div>
          <div style="font-size:13px;color:#9bb0a2;margin-top:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">🔒 Protection Anti-Capture d'Écran Active</div>
        `;
        (document.body || document.documentElement).appendChild(shield);
      }
    } else {
      const shield = document.getElementById('wg-screenshot-shield');
      if (shield) shield.remove();
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
              <div style="font-size:40px;margin-bottom:12px;">📄🚫</div>
              <h2 style="color:#ef4444;margin:0 0 10px 0;font-size:20px;">Visionnement des PDF Désactivé</h2>
              <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin:0 0 18px 0;">La consultation et le téléchargement des documents PDF officiels ont été suspendus par l'administrateur.</p>
              <a href="index.html" style="display:inline-block;background:#22c55e;color:#042f2e;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;">⬅ Retour à l'accueil</a>
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
