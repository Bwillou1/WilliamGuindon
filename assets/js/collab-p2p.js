/**
 * collab-p2p.js — Collaboration P2P temps réel & Curseurs multijoueurs
 * Pour williamguindon.me (Dossier CCE SEM-26-003 & Archive documentaire)
 * Technologies : Trystero (Nostr WebRTC) + Perfect-Cursors + Yjs
 * 100% Statique, Zéro Serveur, Chiffré de bout en bout
 * Licences : MIT (Trystero, Perfect-Cursors, Yjs) / CC BY-NC-ND 4.0 (Site)
 */

import { joinRoom } from '/assets/vendor/trystero/trystero-nostr.min.js';
import { PerfectCursor } from '/assets/vendor/perfect-cursors/perfect-cursors.esm.js';

// Palette de couleurs pour les curseurs collaboratifs (haute lisibilité)
const CURSOR_COLORS = [
  '#059669', // Émeraude (dossier environnemental)
  '#2563eb', // Cobalt
  '#d97706', // Ambre
  '#7c3aed', // Violet
  '#db2777', // Framboise
  '#0891b2', // Cyan
  '#ea580c'  // Orange
];

  function getRandomColor() {
    return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
  }

  function getStoredOrRandomName() {
    try {
      const stored = localStorage.getItem('wg_collab_username');
      if (stored && stored.trim()) return stored.trim();
    } catch (_) {}
    const randId = Math.random().toString(36).substring(2, 6).toUpperCase();
    return 'Analyste #' + randId;
  }

  // État local de la session
  const state = {
    active: false,
    room: null,
    roomId: null,
    selfId: null,
    name: getStoredOrRandomName(),
    color: getRandomColor(),
    peers: new Map(), // peerId -> { cursor, perfectCursor, el }
    targetContainer: null,
    isBroadcasting: true
  };

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
        pointer-events: none;
        z-index: 999999;
        transition: opacity 0.2s ease;
        will-change: transform;
        top: 0;
        left: 0;
      }
      .wg-collab-cursor-svg {
        width: 24px;
        height: 24px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }
      .wg-collab-cursor-badge {
        position: absolute;
        top: 18px;
        left: 14px;
        padding: 2px 7px;
        border-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        pointer-events: none;
      }
      .wg-collab-bar {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        background: var(--bg-card, #ffffff);
        border: 1.5px solid var(--border-color, #e2e8f0);
        border-radius: 30px;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.18), 0 8px 10px -6px rgba(0,0,0,0.1);
        padding: 6px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        color: var(--text, #1e293b);
      }
      .wg-collab-status-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
        display: inline-block;
      }
      .wg-collab-btn {
        background: #059669;
        color: #fff;
        border: none;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .wg-collab-btn:hover {
        background: #047857;
      }
      .wg-collab-btn-close {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--text-muted, #64748b);
        padding: 4px;
        font-size: 14px;
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
        <path d="M5.65 2.14a1 1 0 0 0-1.28 1.28l5.24 16.3a1 1 0 0 0 1.84.1l3.32-6.64 6.64-3.32a1 1 0 0 0-.1-1.84L5.65 2.14z" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      <div class="wg-collab-cursor-badge" style="background-color: ${color};">${name}</div>
    `;
    document.body.appendChild(el);
    return el;
  }

  /**
   * Mise à jour de la position d'un curseur distant via coordonnées relatives
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

    // Calcul des pixels absolus par rapport au viewport
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
    if (label) {
      const count = state.peers.size;
      label.textContent = count === 0 ? 'En attente de pairs...' : (count === 1 ? '1 pair en direct' : `${count} pairs en direct`);
    }
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
      <span class="wg-collab-status-dot" title="Chiffré P2P WebRTC / Nostr"></span>
      <span id="wg-collab-peers-count">Connexion P2P...</span>
      <button type="button" id="btn-collab-copy-link" class="wg-collab-btn" title="Inviter un collaborateur">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span>Inviter</span>
      </button>
      <button type="button" id="btn-collab-leave" class="wg-collab-btn-close" title="Quitter la session">&times;</button>
    `;
    document.body.appendChild(bar);

    document.getElementById('btn-collab-copy-link').addEventListener('click', function () {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      navigator.clipboard.writeText(url.toString()).then(() => {
        const span = this.querySelector('span');
        span.textContent = 'Copié !';
        setTimeout(() => { span.textContent = 'Inviter'; }, 2000);
      }).catch(() => {});
    });

    document.getElementById('btn-collab-leave').addEventListener('click', function () {
      leaveSession();
    });
  }

  /**
   * Démarrage de la session collaborative
   */
  export function startCollabSession(roomId) {
    if (state.active) return;
    injectCollabStyles();

    state.roomId = roomId || ('sem26003-' + Math.random().toString(36).substring(2, 8));
    state.targetContainer = document.getElementById('embedpdf-container') ||
                            document.getElementById('pdf-app') ||
                            document.getElementById('drive-container') ||
                            document.getElementById('drive-tree') ||
                            document.body;

    try {
      // Connexion à la pièce via Trystero Nostr
      state.room = joinRoom({ appId: 'williamguindon.me' }, state.roomId);

      // Déclaration de l'état de curseur multijoueur
      const [sendCursor, getCursor] = state.room.makeAction('cursor');
      const [sendAnnotation, getAnnotation] = state.room.makeAction('annotation');

      state.room.onPeerJoin(peerId => {
        updatePeerCountUI();
      });

      state.room.onPeerLeave(peerId => {
        removeRemoteCursor(peerId);
      });

      getCursor((data, peerId) => {
        updateRemoteCursorPosition(peerId, data);
      });

      getAnnotation((data, peerId) => {
        document.dispatchEvent(new CustomEvent('collab:annotation', { detail: { data, peerId } }));
      });

      // Écouteur de mouvement de souris local (avec throttle animation frame)
      let rafPending = false;
      let lastPos = { rx: 0, ry: 0 };

      const onPointerMove = (e) => {
        if (!state.isBroadcasting || rafPending) return;
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

      renderCollabBar(state.roomId);
      state.active = true;

      // Mettre à jour l'apparence des boutons de bascule
      document.querySelectorAll('#btn-collab-toggle, .btn-collab-toggle').forEach(btn => {
        btn.classList.add('is-active');
        const span = btn.querySelector('span');
        if (span) {
          if (!btn.dataset.origText) btn.dataset.origText = span.textContent;
          span.textContent = 'En direct';
        }
      });

      // Mettre à jour l'URL sans rechargement
      const url = new URL(window.location.href);
      url.searchParams.set('room', state.roomId);
      window.history.replaceState(null, '', url.toString());

    } catch (err) {
      console.warn('[Collab P2P] Échec d\'initialisation WebRTC/Nostr :', err);
    }
  }

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

    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState(null, '', url.toString());
  }

  // Écouteur d'événement délégué sur tous les boutons de collaboration du site
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('#btn-collab-toggle, .btn-collab-toggle');
    if (!btn) return;
    e.preventDefault();

    if (state.active) {
      // Déjà actif : copier le lien de partage
      const url = new URL(window.location.href);
      url.searchParams.set('room', state.roomId);
      navigator.clipboard.writeText(url.toString()).then(() => {
        const span = btn.querySelector('span');
        if (span) {
          const oldText = span.textContent;
          span.textContent = 'Lien copié !';
          setTimeout(() => { span.textContent = oldText; }, 2000);
        }
      }).catch(() => {});
    } else {
      startCollabSession();
    }
  });

  // Détection automatique du paramètre ?room=... ou #room=...
  function autoStartIfRequested() {
    const p = new URLSearchParams(window.location.search);
    const roomParam = p.get('room') || (window.location.hash.startsWith('#room=') ? window.location.hash.replace('#room=', '') : null);
    if (roomParam) {
      setTimeout(() => startCollabSession(roomParam), 600);
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
