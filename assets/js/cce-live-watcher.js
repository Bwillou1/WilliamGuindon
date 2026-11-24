/**
 * cce-live-watcher.js — Synchronisation et veille en direct CCE SEM-26-003
 * Connecte le site williamguindon.me directement à l'API publique de la CCE (cec.org).
 * Détecte les modifications du Secrétariat en temps réel et avertit les visiteurs.
 */
(function() {
  'use strict';

  const CCE_API_URL = 'https://www.cec.org/fr/wp-json/wp/v2/submissions/62535';
  const LOCAL_STATUS_URL = '/status.json';
  const CHECK_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes entre deux vérifications
  const STORAGE_KEY = 'wg_cce_last_check';
  const STORAGE_DATA_KEY = 'wg_cce_last_modified';

  async function checkCCELiveUpdate() {
    try {
      // 1. Récupérer le statut local pour connaître la version connue
      let localModified = null;
      try {
        const localRes = await fetch(LOCAL_STATUS_URL + '?_t=' + Date.now(), { cache: 'no-cache' });
        if (localRes.ok) {
          const localData = await localRes.json();
          localModified = localData.wp_modified || localData.cce_officiel?.derniere_modif_wp || null;
        }
      } catch (_) {}

      // Vérifier le cooldown de vérification
      const lastCheck = sessionStorage.getItem(STORAGE_KEY);
      if (lastCheck && (Date.now() - parseInt(lastCheck, 10)) < CHECK_INTERVAL_MS) {
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));

      // 2. Interroger directement l'API REST de la CCE
      const cceRes = await fetch(CCE_API_URL + '?_t=' + Date.now(), {
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!cceRes.ok) return;
      const cceData = await cceRes.json();
      if (!cceData || !cceData.modified) return;

      const remoteModified = cceData.modified;
      sessionStorage.setItem(STORAGE_DATA_KEY, remoteModified);

      // 3. Comparer avec la version locale enregistrée
      if (localModified && remoteModified !== localModified) {
        console.info('[CCE Live Watcher] Nouvelle modification détectée sur cec.org :', remoteModified, 'vs local :', localModified);
        notifyLiveUpdate(remoteModified, cceData);
      } else {
        markLiveConnected(remoteModified);
      }
    } catch (e) {
      // Échec silencieux si le réseau du visiteur bloque cec.org
    }
  }

  function markLiveConnected(timestamp) {
    const indicators = document.querySelectorAll('.js-cce-live-status');
    indicators.forEach(el => {
      el.innerHTML = `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; margin-right:5px; box-shadow:0 0 6px #10b981;" aria-hidden="true"></span><span style="font-size:11px; font-weight:600; color:#059669;">Flux CCE direct actif</span>`;
      el.title = `Connecté au registre officiel CCE (Dernière vérification du serveur : ${timestamp || 'récente'})`;
    });
  }

  function notifyLiveUpdate(remoteDate, cceData) {
    // Émettre l'événement pour les composants de la page
    window.dispatchEvent(new CustomEvent('cce:live-update', {
      detail: { modified: remoteDate, title: cceData.title?.rendered }
    }));

    // Notification visuelle discrète dans la topbar ou en toast
    const topbar = document.querySelector('.site-deadline-topbar');
    if (topbar && !document.getElementById('cce-live-update-badge')) {
      const pill = document.createElement('a');
      pill.id = 'cce-live-update-badge';
      pill.href = '/live.html';
      pill.setAttribute('style', 'display:inline-flex; align-items:center; gap:5px; background:#ecfdf5; border:1px solid #10b981; color:#065f46; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; margin-left:8px; text-decoration:none; animation:pulse 2s infinite;');
      pill.innerHTML = `<span>🟢 Mise à jour CCE en direct</span> <span style="text-decoration:underline;">Consulter →</span>`;

      const rightArea = topbar.querySelector('.site-deadline-right');
      if (rightArea) {
        rightArea.prepend(pill);
      }
    }
  }

  // Lancement automatique différé pour ne pas bloquer le chargement initial
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(checkCCELiveUpdate, 1500));
  } else {
    setTimeout(checkCCELiveUpdate, 1500);
  }

  // Export global pour invocation manuelle
  window.checkCCELiveUpdate = checkCCELiveUpdate;
})();
