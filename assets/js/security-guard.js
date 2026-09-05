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

  // 2. GESTION DE L'ÉTAT (SYNCHRONISATION ULTRA-RAPIDE & MULTI-SOURCES DEPUIS GITHUB)
  let lastAppliedStateJson = null;

  // Canal de synchronisation inter-onglets instantané (0ms)
  const syncChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('wg_site_state_sync') : null;
  if (syncChannel) {
    syncChannel.onmessage = (e) => {
      if (e && e.data) {
        applyState(e.data);
      }
    };
  }

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

    // A. Mode Blackout / Maintenance Totale
    if (isMaintenanceActive) {
      renderMaintenanceScreen(state.maintenanceUntil);
      return;
    }

    // B. Mode Cyber-Attaque / Panique
    if (isPanicActive) {
      applyPanicMode(state.panicTextOnly);
    } else {
      const banner = document.getElementById('panic-alert-banner');
      if (banner) banner.remove();
    }

    // C. Commutateurs individuels (Kill-Switches)
    applyKillSwitches(state);
  }

  // Application immédiate depuis le stockage de session (s'efface à la fermeture de l'onglet)
  try {
    const cached = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    applyState(cached);
  } catch (e) {}

  // Synchronisation distante ultra-rapide multi-sources (Local + GitHub Raw direct sans blocage)
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

  // Lancement propre de la synchronisation après le chargement initial pour éviter tout blocage d'onglet
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

  // Déclenchement instantané lorsque l'utilisateur revient sur l'onglet
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) fetchRemoteState();
  });
  window.addEventListener('focus', () => {
    if (!document.hidden) fetchRemoteState();
  });

  // ==========================================
  // LOGIQUES D'APPLICATION SPÉCIFIQUES & SÉCURITÉ
  // ==========================================

  function lockInspectorAndDevTools() {
    // 1. Bloquer le clic droit et le menu contextuel
    document.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    // 2. Bloquer les raccourcis clavier F12, Inspecteur, Code source, Enregistrer (Windows / Linux / Mac)
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

      // Ctrl/Cmd + Shift + I / J / C / K (DevTools / Console / Inspecteur d'éléments)
      if (cmdOrCtrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k' || code === 73 || code === 74 || code === 67 || code === 75)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Cmd + Option + I / J / C / U (Mac Safari / Chrome DevTools et Afficher le code source)
      if (cmdOrCtrl && e.altKey && (key === 'i' || key === 'j' || key === 'c' || key === 'u' || code === 73 || code === 74 || code === 67 || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + U (Afficher le code source de la page)
      if (cmdOrCtrl && (key === 'u' || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + S (Sauvegarder la page / code source localement)
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

    const onReady = () => {
      renderPanicModeBanner();
      if (forceTextOnly) {
        renderTextOnlyMode();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  function applyKillSwitches(state) {
    const onReady = () => {
      if (state.disableCopyPaste) {
        document.addEventListener('copy', e => e.preventDefault(), true);
        document.addEventListener('cut', e => e.preventDefault(), true);
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
      }

      if (state.disableIframes) {
        document.querySelectorAll('iframe').forEach(f => f.remove());
      }

      if (state.disableNavLinks) {
        document.querySelectorAll('a').forEach(a => {
          if (!a.href.includes('#') && !a.classList.contains('allow-emergency')) {
            a.addEventListener('click', e => {
              e.preventDefault();
              alert("Navigation temporairement restreinte par l'administrateur.");
            });
            a.style.cursor = 'not-allowed';
            a.style.opacity = '0.6';
          }
        });
      }

      if (state.disableMedia) {
        document.querySelectorAll('img, video, audio, picture, source').forEach(m => {
          m.style.display = 'none';
        });
      }

      if (state.disableTranslation) {
        const gEl = document.getElementById('google_translate_element');
        if (gEl) gEl.remove();
        const drop = document.querySelector('.nav-translate-dropdown');
        if (drop) drop.style.display = 'none';
      }

      if (state.disableAnimations) {
        const noAnimStyle = document.createElement('style');
        noAnimStyle.innerHTML = '* { animation: none !important; transition: none !important; }';
        document.head.appendChild(noAnimStyle);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  function renderMaintenanceScreen(untilTimestamp) {
    // Verrouillage immédiat des DevTools, de l'inspecteur et du code source
    lockInspectorAndDevTools();

    // Génération / Récupération cryptographiquement sécurisée de l'identifiant de session
    const sessionId = (sessionStorage.getItem('wg_sid') || (function() {
      const arr = new Uint8Array(16);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(arr);
      }
      const s = 'sid_' + Array.from(arr, b => b.toString(16).padStart(2, '0')).join('') + '_' + Date.now().toString(36);
      sessionStorage.setItem('wg_sid', s);
      return s;
    })());

    // Obfuscation / Reconstruction dynamique de l'email client-side
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
      });
    }
  }

  function renderPanicModeBanner() {
    if (document.getElementById('panic-alert-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'panic-alert-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;width:100vw;background:#eab308;color:#000000;font-weight:800;font-size:13px;padding:10px 16px;text-align:center;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;gap:8px;';
    banner.innerHTML = `⚠️ <span>Un bug informatique ou une anomalie a été détecté. Plusieurs fonctions ont été désactivées temporairement pour votre sécurité.</span>`;
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
  }

  function renderTextOnlyMode() {
    const rawText = document.body ? (document.body.innerText || document.body.textContent || '') : '';
    const container = document.createElement('div');
    container.style.cssText = 'max-width:800px;margin:20px auto;padding:20px;font-family:monospace;white-space:pre-wrap;background:#ffffff;color:#000000;line-height:1.5;';
    container.textContent = rawText;
    document.body.replaceChildren(container);
  }
})();
