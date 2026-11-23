/**
 * collab-p2p-live.js — Collaboration P2P temps réel & Curseurs multijoueurs
 * Pour williamguindon.me (Dossier CCE SEM-26-003 & Archive documentaire)
 * Technologies : Trystero (Nostr WebRTC) + Perfect-Cursors + Yjs
 * 100% Statique, Zéro Serveur, Chiffré de bout en bout
 * Licences : MIT (Trystero, Perfect-Cursors, Yjs) / CC BY-NC-ND 4.0 (Site)
 */

import { joinRoom } from '/assets/vendor/trystero/trystero-nostr.min.js';
import { PerfectCursor } from '/assets/vendor/perfect-cursors/perfect-cursors.esm.js';

// Palette de couleurs éclatantes et contrastées pour identifier les pairs
const CURSOR_COLORS = [
  '#2563eb', // Bleu Cobalt
  '#059669', // Vert Émeraude
  '#ea580c', // Orange Vif
  '#db2777', // Rose Framboise
  '#7c3aed', // Violet Profond
  '#0891b2'  // Cyan Océan
];

function getRandomColor() {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
}

function getDeviceLabel() {
  try {
    const saved = localStorage.getItem('wg_collab_username');
    if (saved && saved.trim()) return saved.trim();
  } catch (_) {}
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  let dev = 'Appareil';
  if (/Macintosh|Mac OS/i.test(ua)) dev = 'Mac';
  else if (/iPhone/i.test(ua)) dev = 'iPhone';
  else if (/iPad/i.test(ua)) dev = 'iPad';
  else if (/Android/i.test(ua)) dev = 'Android';
  else if (/Windows/i.test(ua)) dev = 'PC';
  else if (/Linux/i.test(ua)) dev = 'Linux';
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${dev} (${rand})`;
}

/**
 * Génère un identifiant de salle cryptographiquement fort (128 bits d'entropie)
 * pour garantir qu'aucun robot ni scanner ne puisse deviner ou énumérer l'URL
 */
function generateSecureRoomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return 'sem26003-sec-' + hex;
  }
  return 'sem26003-sec-' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

// État local de la session
const state = {
  active: false,
  room: null,
  roomId: null,
  name: getDeviceLabel(),
  color: getRandomColor(),
  peers: new Map(), // peerId -> { cursor, perfectCursor, el, name, color }
  targetContainer: null,
  isBroadcasting: true,
  cleanupPointer: null,
  actions: {}
};

/**
 * Affiche un toast d'information temporaire
 */
function showCollabToast(msg) {
  let toast = document.getElementById('drive-toast') || document.getElementById('wg-collab-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wg-collab-toast';
    toast.className = 'wg-collab-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 4000);
}

/**
 * Injection des styles CSS nécessaires aux curseurs et à la barre d'outils
 */
function injectCollabStyles() {
  if (document.getElementById('wg-collab-styles')) return;
  const style = document.createElement('style');
  style.id = 'wg-collab-styles';
  style.textContent = `
    .btn-collab-toggle,
    #btn-collab-toggle {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      padding: 5px 11px !important;
      border-radius: 6px !important;
      border: 1px solid rgba(5, 150, 105, 0.45) !important;
      background: rgba(5, 150, 105, 0.1) !important;
      color: #059669 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      width: auto !important;
      min-width: unset !important;
      height: auto !important;
      min-height: 28px !important;
      text-decoration: none !important;
      box-sizing: border-box !important;
    }
    .btn-collab-toggle:hover,
    #btn-collab-toggle:hover {
      background: rgba(5, 150, 105, 0.2) !important;
      border-color: #059669 !important;
    }
    .btn-collab-toggle.is-active,
    #btn-collab-toggle.is-active {
      background: #059669 !important;
      color: #ffffff !important;
      border-color: #047857 !important;
      box-shadow: 0 0 10px rgba(5, 150, 105, 0.4) !important;
    }

    .wg-collab-cursor {
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 999999;
      transform: translate3d(-100px, -100px, 0);
      will-change: transform;
      transition: opacity 0.2s ease;
    }
    .wg-collab-cursor-svg {
      width: 22px;
      height: 22px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
    }
    .wg-collab-cursor-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      margin-left: 12px;
      margin-top: -6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      user-select: none;
    }

    /* Ruban flottant positionné pour ne pas masquer la barre de zoom en bas */
    .wg-collab-bar {
      position: fixed;
      bottom: 74px;
      right: 20px;
      z-index: 99999;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--line, rgba(0,0,0,0.15));
      border-radius: 28px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: var(--text, #1e293b);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
      max-width: calc(100vw - 40px);
    }
    .wg-collab-bar.is-minimized {
      padding: 4px 10px;
      border-radius: 20px;
      background: var(--bg-surface, #ffffff);
      cursor: pointer;
    }
    .wg-collab-bar.is-minimized .wg-collab-bar-expanded {
      display: none !important;
    }
    .wg-collab-bar.is-minimized .wg-collab-bar-collapsed {
      display: inline-flex !important;
      align-items: center;
      gap: 6px;
    }
    .wg-collab-bar-collapsed {
      display: none;
    }

    .wg-collab-status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
      display: inline-block;
      flex-shrink: 0;
    }
    .wg-collab-btn {
      background: #059669;
      color: #fff;
      border: none;
      padding: 5px 12px;
      border-radius: 16px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      transition: background 0.15s ease;
    }
    .wg-collab-btn:hover {
      background: #047857;
    }
    .wg-collab-btn-stop {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
      padding: 5px 10px;
      border-radius: 16px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .wg-collab-btn-stop:hover {
      background: #fecaca;
      border-color: #ef4444;
      color: #991b1b;
    }
    .wg-collab-btn-icon {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-muted, #64748b);
      padding: 4px 6px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: bold;
    }
    .wg-collab-btn-icon:hover {
      background: rgba(0,0,0,0.06);
      color: var(--text, #1e293b);
    }

    .wg-collab-toast {
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 1000000;
      pointer-events: none;
      opacity: 0;
      transition: all 0.25s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .wg-collab-toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Création visuelle d'un curseur distant
 */
function createRemoteCursorElement(peerId, color, name) {
  const el = document.createElement('div');
  el.id = 'wg-cursor-' + peerId;
  el.className = 'wg-collab-cursor';
  el.innerHTML = `
    <svg class="wg-collab-cursor-svg" viewBox="0 0 24 24" fill="none">
      <path d="M5.65 2.14a1 1 0 0 0-1.28 1.28l5.24 16.3a1 1 0 0 0 1.84.1l3.32-6.64 6.64-3.32a1 1 0 0 0-.1-1.84L5.65 2.14z" fill="${color}" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>
    <div class="wg-collab-cursor-badge" style="background-color: ${color};">${name}</div>
  `;
  document.body.appendChild(el);
  return el;
}

/**
 * Mise à jour de la position d'un curseur distant
 */
function updateRemoteCursorPosition(peerId, data) {
  let peer = state.peers.get(peerId);
  if (!peer) {
    const color = data.color || getRandomColor();
    const name = data.name || 'Analyste';
    const el = createRemoteCursorElement(peerId, color, name);
    
    const perfectCursor = new PerfectCursor((point) => {
      el.style.transform = `translate3d(${point[0]}px, ${point[1]}px, 0)`;
    });

    peer = { el, perfectCursor, color, name };
    state.peers.set(peerId, peer);
    updatePeerCountUI();
  }

  const container = state.targetContainer || document.documentElement;
  const rect = container.getBoundingClientRect();
  const absX = rect.left + (data.rx * rect.width);
  const absY = rect.top + (data.ry * rect.height);

  peer.perfectCursor.addPoint([absX, absY]);
}

function removeRemoteCursor(peerId) {
  const peer = state.peers.get(peerId);
  if (peer) {
    peer.perfectCursor.dispose();
    if (peer.el && peer.el.parentNode) {
      peer.el.style.opacity = '0';
      setTimeout(() => peer.el.remove(), 250);
    }
    state.peers.delete(peerId);
    updatePeerCountUI();
  }
}

function updatePeerCountUI() {
  const label = document.getElementById('wg-collab-peers-count');
  const miniLabel = document.getElementById('wg-collab-mini-count');
  const count = state.peers.size;
  const txt = count === 0 ? 'En attente de pairs...' : (count === 1 ? '1 pair connecté' : `${count} pairs connectés`);
  if (label) label.textContent = txt;
  if (miniLabel) miniLabel.textContent = count === 0 ? 'En direct' : `${count} connecté${count > 1 ? 's' : ''}`;
}

/**
 * Création du ruban flottant de session
 */
function renderCollabBar(roomId) {
  let bar = document.getElementById('wg-collab-bar');
  if (bar) return;

  bar = document.createElement('div');
  bar.id = 'wg-collab-bar';
  bar.className = 'wg-collab-bar';
  bar.innerHTML = `
    <!-- Mode développé -->
    <div class="wg-collab-bar-expanded" style="display:flex; align-items:center; gap:8px;">
      <span class="wg-collab-status-dot" title="Chiffrement WebRTC P2P direct"></span>
      <span id="wg-collab-peers-count" style="font-size:11.5px;">Connexion P2P...</span>
      <button type="button" id="btn-collab-copy-link" class="wg-collab-btn" title="Copier le lien d'accès direct pour inviter ou synchroniser votre autre appareil">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span>Inviter</span>
      </button>
      <button type="button" id="btn-collab-leave" class="wg-collab-btn-stop" title="Arrêter complètement la collaboration et rétablir le mode privé">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
        <span>Arrêter</span>
      </button>
      <button type="button" id="btn-collab-minimize" class="wg-collab-btn-icon" title="Réduire la barre pour dégager la vue du document">_</button>
    </div>

    <!-- Mode réduit (pastille discrète ne masquant pas les contrôles de zoom) -->
    <div class="wg-collab-bar-collapsed" title="Cliquer pour afficher les contrôles de collaboration">
      <span class="wg-collab-status-dot"></span>
      <span id="wg-collab-mini-count" style="font-size:11px; font-weight:700;">En direct</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
    </div>
  `;
  document.body.appendChild(bar);

  // Copier le lien
  document.getElementById('btn-collab-copy-link').addEventListener('click', function () {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      const span = this.querySelector('span');
      if (span) {
        span.textContent = 'Lien copié !';
        setTimeout(() => { span.textContent = 'Inviter'; }, 2000);
      }
      showCollabToast('Lien copié ! Ouvrez-le sur votre autre appareil ou partagez-le');
    }).catch(() => {});
  });

  // Bouton explicite pour arrêter le partage au complet
  document.getElementById('btn-collab-leave').addEventListener('click', function () {
    leaveSession();
  });

  // Réduire / déployer
  const btnMin = document.getElementById('btn-collab-minimize');
  if (btnMin) {
    btnMin.addEventListener('click', function (e) {
      e.stopPropagation();
      bar.classList.add('is-minimized');
    });
  }
  bar.addEventListener('click', function () {
    if (bar.classList.contains('is-minimized')) {
      bar.classList.remove('is-minimized');
    }
  });
}

/**
 * Synchronisation des annotations du document avec les pairs
 */
function initAnnotationSync(room) {
  try {
    const vaultAction = room.makeAction('vaultSync');
    const sendVault = typeof vaultAction.send === 'function' ? vaultAction.send.bind(vaultAction) : vaultAction[0];
    const onReceiveVault = typeof vaultAction.onReceive === 'function'
      ? vaultAction.onReceive.bind(vaultAction)
      : (typeof vaultAction.onMessage === 'function' ? vaultAction.onMessage.bind(vaultAction) : vaultAction[1]);

    const annotAction = room.makeAction('annotSync');
    const sendAnnot = typeof annotAction.send === 'function' ? annotAction.send.bind(annotAction) : annotAction[0];
    const onReceiveAnnot = typeof annotAction.onReceive === 'function'
      ? annotAction.onReceive.bind(annotAction)
      : (typeof annotAction.onMessage === 'function' ? annotAction.onMessage.bind(annotAction) : annotAction[1]);

    // Envoi de tout le coffre d'annotations lorsqu'un pair rejoint
    room.onPeerJoin(async (peerId) => {
      updatePeerCountUI();
      if (window.WGAnnotationsIDB && typeof window.WGAnnotationsIDB.exportAllDocuments === 'function') {
        try {
          const vault = await window.WGAnnotationsIDB.exportAllDocuments();
          if (vault && vault.documents && Object.keys(vault.documents).length > 0 && typeof sendVault === 'function') {
            sendVault(vault, peerId);
          }
        } catch (_) {}
      }
    });

    // Réception du coffre complet (ex: ouverture sur 2e appareil)
    if (typeof onReceiveVault === 'function') {
      onReceiveVault(async (vault, peerId) => {
        if (vault && window.WGAnnotationsIDB && typeof window.WGAnnotationsIDB.importAllDocuments === 'function') {
          try {
            await window.WGAnnotationsIDB.importAllDocuments(vault);
            document.dispatchEvent(new CustomEvent('collab:vault-synced', { detail: vault }));
            showCollabToast('Annotations synchronisées avec votre autre appareil');
          } catch (_) {}
        }
      });
    }

    // Réception d'une annotation individuelle en temps réel
    if (typeof onReceiveAnnot === 'function') {
      onReceiveAnnot(async (data, peerId) => {
        if (data && data.file && data.annotations && window.WGAnnotationsIDB) {
          try {
            await window.WGAnnotationsIDB.setDocumentAnnotations(data.file, data.annotations);
            document.dispatchEvent(new CustomEvent('collab:annotation-received', { detail: data }));
            showCollabToast('Nouvelle annotation synchronisée en direct');
          } catch (_) {}
        }
      });
    }

    // Interception des écritures locales d'annotations pour les synchroniser
    if (window.WGAnnotationsIDB && !window.WGAnnotationsIDB._collabHooked) {
      window.WGAnnotationsIDB._collabHooked = true;
      const originalSet = window.WGAnnotationsIDB.setDocumentAnnotations;
      window.WGAnnotationsIDB.setDocumentAnnotations = async function (file, annotations) {
        const res = await originalSet.apply(this, arguments);
        if (state.active && typeof sendAnnot === 'function') {
          try {
            sendAnnot({ file, annotations, timestamp: Date.now() });
          } catch (_) {}
        }
        return res;
      };
    }

    state.actions.sendVault = sendVault;
    state.actions.sendAnnot = sendAnnot;
  } catch (e) {
    console.warn('[Collab P2P] Initialisation sync annotations :', e);
  }
}

/**
 * Démarrage de la session collaborative
 */
export function startCollabSession(roomId) {
  if (state.active) return;
  injectCollabStyles();

  state.active = true;
  state.roomId = roomId || generateSecureRoomId();
  state.targetContainer = document.getElementById('embedpdf-container') ||
                          document.getElementById('pdf-app') ||
                          document.getElementById('drive-container') ||
                          document.getElementById('drive-tree') ||
                          document.body;

  // Afficher la barre de collaboration et mettre à jour le bouton immédiatement (feedback 0 ms)
  renderCollabBar(state.roomId);
  document.querySelectorAll('#btn-collab-toggle, .btn-collab-toggle').forEach(btn => {
    btn.classList.add('is-active');
    const span = btn.querySelector('span');
    if (span) {
      if (!btn.dataset.origText) btn.dataset.origText = span.textContent;
      span.textContent = 'En direct';
    }
  });

  // Mettre à jour l'URL sans rechargement
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('room', state.roomId);
    window.history.replaceState(null, '', url.toString());
  } catch (_) {}

  showCollabToast('Mode direct activé · Cliquez sur « Inviter » pour synchroniser ou partager');

  try {
    // Connexion à la pièce via Trystero Nostr
    state.room = joinRoom({ appId: 'williamguindon.me' }, state.roomId);

    // Actions Trystero v0.27
    const cursorAction = state.room.makeAction('cursor');
    const sendCursor = typeof cursorAction.send === 'function' ? cursorAction.send.bind(cursorAction) : cursorAction[0];
    const onReceiveCursor = typeof cursorAction.onReceive === 'function'
      ? cursorAction.onReceive.bind(cursorAction)
      : (typeof cursorAction.onMessage === 'function' ? cursorAction.onMessage.bind(cursorAction) : cursorAction[1]);

    if (typeof state.room.onPeerJoin === 'function') {
      state.room.onPeerJoin(() => {
        updatePeerCountUI();
      });
    }

    if (typeof state.room.onPeerLeave === 'function') {
      state.room.onPeerLeave(peerId => {
        removeRemoteCursor(peerId);
      });
    }

    if (typeof onReceiveCursor === 'function') {
      onReceiveCursor((data, peerId) => {
        updateRemoteCursorPosition(peerId, data);
      });
    }

    // Initialisation de la synchronisation bidirectionnelle d'annotations
    initAnnotationSync(state.room);

    // Écouteur de mouvement de souris local (avec throttle requestAnimationFrame)
    let rafPending = false;
    let lastPos = { rx: 0, ry: 0 };

    const onPointerMove = (e) => {
      if (!state.isBroadcasting || rafPending || typeof sendCursor !== 'function') return;
      rafPending = true;

      requestAnimationFrame(() => {
        rafPending = false;
        const container = state.targetContainer || document.body;
        const rect = container.getBoundingClientRect();

        const rx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const ry = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        if (Math.abs(rx - lastPos.rx) > 0.001 || Math.abs(ry - lastPos.ry) > 0.001) {
          lastPos = { rx, ry };
          sendCursor({
            rx,
            ry,
            name: state.name,
            color: state.color
          });
        }
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    state.cleanupPointer = () => window.removeEventListener('pointermove', onPointerMove);

  } catch (err) {
    console.warn('[Collab P2P] Échec d\'initialisation WebRTC/Nostr :', err);
  }
}

/**
 * Arrêt complet de la session et retour au mode privé
 */
export function leaveSession() {
  if (!state.active) return;
  if (state.cleanupPointer) state.cleanupPointer();
  state.peers.forEach((_, peerId) => removeRemoteCursor(peerId));
  if (state.room && typeof state.room.leave === 'function') {
    state.room.leave();
  }
  const bar = document.getElementById('wg-collab-bar');
  if (bar) bar.remove();
  state.active = false;
  state.room = null;

  // Restaurer l'apparence des boutons de bascule
  document.querySelectorAll('#btn-collab-toggle, .btn-collab-toggle').forEach(btn => {
    btn.classList.remove('is-active');
    const span = btn.querySelector('span');
    if (span && btn.dataset.origText) {
      span.textContent = btn.dataset.origText;
    }
  });

  // Nettoyer le paramètre d'URL sans rechargement
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState(null, '', url.toString());
  } catch (_) {}

  showCollabToast('Partage arrêté · Mode privé local rétabli');
}

// Écouteur d'événement délégué sur tous les boutons de collaboration du site
document.addEventListener('click', function(e) {
  const btn = e.target.closest('#btn-collab-toggle, .btn-collab-toggle');
  if (!btn) return;
  e.preventDefault();

  if (state.active) {
    // Déjà actif : copier le lien ou proposer d'arrêter
    const url = new URL(window.location.href);
    url.searchParams.set('room', state.roomId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      const span = btn.querySelector('span');
      if (span) {
        const oldText = span.textContent;
        span.textContent = 'Lien copié !';
        setTimeout(() => { span.textContent = oldText; }, 2000);
      }
      showCollabToast('Lien de session copié dans le presse-papier');
    }).catch(() => {});
  } else {
    startCollabSession();
  }
});

// Détection immédiate du paramètre ?room=... ou #room=... à l'exécution du module
const initialParams = new URLSearchParams(window.location.search);
const initialRoom = initialParams.get('room') || (window.location.hash.startsWith('#room=') ? window.location.hash.replace('#room=', '') : null);

// Détection automatique du paramètre ?room=... ou #room=...
function autoStartIfRequested() {
  const p = new URLSearchParams(window.location.search);
  const roomParam = p.get('room') || (window.location.hash.startsWith('#room=') ? window.location.hash.replace('#room=', '') : null) || initialRoom;
  if (roomParam) {
    setTimeout(() => startCollabSession(roomParam), 300);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoStartIfRequested);
} else {
  autoStartIfRequested();
}

// Exposer sur window
if (typeof window !== 'undefined') {
  window.__wg_collab = {
    start: startCollabSession,
    leave: leaveSession
  };
}
