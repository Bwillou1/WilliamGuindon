/**
 * SENTINELLE DE SÉCURITÉ RADICALE — williamguindon.me
 * Protège le site contre le clonage, applique le blackout, le mode panique et les kill-switches.
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

  // 2. CHARGEMENT DE L'ÉTAT DU SITE
  let state = {};
  try {
    state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    state = {};
  }

  const now = Date.now();

  // Ne pas bloquer la console admin elle-même
  const isConsolePage = window.location.pathname.includes('console-admin.html');
  if (isConsolePage) return;

  // 3. VÉRIFICATION DU MODE BLACKOUT / MAINTENANCE TOTALE
  if (state.maintenanceActive && state.maintenanceUntil && now < state.maintenanceUntil) {
    window.addEventListener('DOMContentLoaded', () => {
      renderMaintenanceScreen(state.maintenanceUntil);
    });
    return;
  }

  // 4. VÉRIFICATION DU MODE CYBER-ATTAQUE / PANIQUE
  if (state.panicActive && state.panicUntil && now < state.panicUntil) {
    // Verrouillage DevTools
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
      }
    });

    window.addEventListener('DOMContentLoaded', () => {
      renderPanicModeBanner();
      if (state.panicTextOnly) {
        renderTextOnlyMode();
      }
    });
  }

  // 5. APPLICATION DES COMMUTATEURS SÉLECTIFS (KILL-SWITCHES)
  window.addEventListener('DOMContentLoaded', () => {
    // Désactiver Copier/Coller
    if (state.disableCopyPaste) {
      document.addEventListener('copy', e => e.preventDefault());
      document.addEventListener('cut', e => e.preventDefault());
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }

    // Désactiver les Iframes
    if (state.disableIframes) {
      document.querySelectorAll('iframe').forEach(f => f.remove());
    }

    // Désactiver les Liens de navigation
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

    // Désactiver Médias
    if (state.disableMedia) {
      document.querySelectorAll('img, video, audio, picture, source').forEach(m => {
        m.style.display = 'none';
      });
    }

    // Désactiver le Module de Traduction
    if (state.disableTranslation) {
      const gEl = document.getElementById('google_translate_element');
      if (gEl) gEl.remove();
      const drop = document.querySelector('.nav-translate-dropdown');
      if (drop) drop.style.display = 'none';
    }

    // Désactiver les animations
    if (state.disableAnimations) {
      const noAnimStyle = document.createElement('style');
      noAnimStyle.innerHTML = '* { animation: none !important; transition: none !important; }';
      document.head.appendChild(noAnimStyle);
    }
  });

  // ==========================================
  // FONCTIONS DE RENDU SPÉCIFIQUES
  // ==========================================

  // Rendu de la page de maintenance inviolable (Blackout)
  function renderMaintenanceScreen(untilTimestamp) {
    // Génération / Récupération de l'identifiant de session
    const sessionId = (sessionStorage.getItem('wg_sid') || (function() {
      const s = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      sessionStorage.setItem('wg_sid', s);
      return s;
    })());

    // Obfuscation / Reconstruction dynamique de l'email client-side
    function getObfuscatedEmail(sid) {
      const parts = ["gui", "ndon", "will", "iam", "2", "@", "gma", "il.", "com"];
      return parts.join('');
    }
    const safeEmail = getObfuscatedEmail(sessionId);
    const timeLeftMin = Math.max(1, Math.round((untilTimestamp - Date.now()) / 60000));

    document.body.innerHTML = `
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
  }

  // Rendu de la bannière d'alerte jaune (Mode Panique)
  function renderPanicModeBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:0;left:0;width:100vw;background:#eab308;color:#000000;font-weight:800;font-size:13px;padding:10px 16px;text-align:center;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;gap:8px;';
    banner.innerHTML = `⚠️ <span>Un bug informatique ou une anomalie a été détecté. Plusieurs fonctions ont été désactivées temporairement pour votre sécurité.</span>`;
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
  }

  // Rendu en mode texte pur ultra-minimaliste
  function renderTextOnlyMode() {
    const textContent = document.body.innerText;
    document.body.innerHTML = `
      <div style="max-width:800px;margin:20px auto;padding:20px;font-family:monospace;white-space:pre-wrap;background:#ffffff;color:#000000;line-height:1.5;">
        ${textContent}
      </div>
    `;
  }
})();
