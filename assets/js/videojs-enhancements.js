/**
 * Améliorations Video.js 10 pour williamguindon.me :
 * - Extension <google-cast> automatique sur chaque <video-player> éligible
 * - Persistance des préférences utilisateur (volume/muet, langue des sous-titres, qualité)
 * - Contraste accessible des sous-titres WebVTT (::cue)
 * - Prise en charge des lecteurs injectés dynamiquement (modales presse / journalistes)
 */
(function () {
  'use strict';

  const STORAGE_VOLUME_KEY = 'wg_vjs_prefs:volume';
  const STORAGE_CAPTIONS_KEY = 'wg_vjs_prefs:captions';
  const STORAGE_QUALITY_KEY = 'wg_vjs_prefs:quality';
  const ENHANCED_ATTR = 'data-wg-vjs-enhanced';

  function readJsonStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // Stockage indisponible (navigation privée ou quota) : ignorer silencieusement.
    }
  }

  function injectCueStyles() {
    if (document.getElementById('wg-vjs-cue-style')) return;
    const style = document.createElement('style');
    style.id = 'wg-vjs-cue-style';
    style.textContent = [
      'video::cue {',
      '  background-color: rgba(6, 20, 14, 0.88);',
      '  color: #f8fafc;',
      '  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);',
      '  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
    ].join('\n');
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureGoogleCast(player) {
    if (!player || player.tagName.toLowerCase() !== 'video-player') return;
    if (player.querySelector('google-cast')) return;

    const media = player.querySelector('video, hlsjs-video, mux-video, youtube-video');
    if (media && media.hasAttribute('disableremoteplayback')) return;

    const isYoutube = media && media.tagName.toLowerCase() === 'youtube-video';
    const rawCastSrc = player.getAttribute('data-cast-src') || (media && media.getAttribute('data-cast-src'));

    // Un embed YouTube nécessite un src direct pour que le récepteur Cast puisse le lire.
    if (isYoutube && !rawCastSrc) return;

    let safeCastSrc = null;
    if (rawCastSrc) {
      try {
        const u = new URL(rawCastSrc, window.location.origin);
        if (u.protocol === 'http:' || u.protocol === 'https:') {
          safeCastSrc = u.href;
        }
      } catch (_) {}
    }

    if (isYoutube && !safeCastSrc) return;

    const castEl = document.createElement('google-cast');
    if (safeCastSrc) {
      castEl.setAttribute('src', safeCastSrc);
      const castType = player.getAttribute('data-cast-type') || (media && media.getAttribute('data-cast-type'));
      if (castType) castEl.setAttribute('content-type', castType);
    }
    player.appendChild(castEl);
  }

  function attachVolumePreferences(player, store, selectVolume) {
    if (typeof selectVolume !== 'function') return;

    const media = player.querySelector('video, audio, hlsjs-video, youtube-video');
    const isMutedAutoplay = Boolean(media && media.hasAttribute('autoplay') && media.hasAttribute('muted'));

    const saved = readJsonStorage(STORAGE_VOLUME_KEY);
    const validSaved =
      saved && Number.isFinite(saved.volume) && typeof saved.muted === 'boolean' ? saved : null;

    let volumeRestored = !validSaved;

    function tryRestoreVolume() {
      if (volumeRestored || !store.target) return false;
      const v = selectVolume(store.state);
      if (!v) return false;

      if (typeof v.setVolume === 'function') {
        v.setVolume(Math.min(1, Math.max(0, validSaved.volume)));
      }
      // Toujours appliquer muted après setVolume (qui démute au-dessus de 0).
      if (validSaved.muted && typeof v.setMuted === 'function') {
        v.setMuted(true);
      }
      volumeRestored = true;
      return true;
    }

    if (validSaved) {
      if (isMutedAutoplay) {
        const unlock = () => {
          tryRestoreVolume();
        };
        player.addEventListener('pointerdown', unlock, { once: true, passive: true });
        player.addEventListener('keydown', unlock, { once: true, passive: true });
      } else if (!tryRestoreVolume()) {
        const unsub = store.subscribe(() => {
          if (tryRestoreVolume() && typeof unsub === 'function') unsub();
        });
      }
    }

    let last = validSaved ? { volume: validSaved.volume, muted: validSaved.muted } : {};
    let saveTimer = null;

    store.subscribe(() => {
      const v = selectVolume(store.state);
      if (!v) return;
      if (v.volume === last.volume && v.muted === last.muted) return;
      last = { volume: v.volume, muted: v.muted };
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        writeJsonStorage(STORAGE_VOLUME_KEY, last);
      }, 150);
    });
  }

  function attachCaptionPreferences(store, selectTextTrack) {
    if (typeof selectTextTrack !== 'function') return;

    const saved = readJsonStorage(STORAGE_CAPTIONS_KEY);
    const savedLang = saved && typeof saved.language === 'string' ? saved.language : null;
    let restored = false;
    let lastLanguage = null;

    store.subscribe(() => {
      const t = selectTextTrack(store.state);
      if (!t || !Array.isArray(t.textTrackList)) return;

      const captionTracks = t.textTrackList.filter(
        (tr) => tr && (tr.kind === 'captions' || tr.kind === 'subtitles')
      );
      if (captionTracks.length === 0) return;

      if (!restored) {
        restored = true;
        if (savedLang === 'off' && typeof t.selectSubtitlesTrack === 'function') {
          t.selectSubtitlesTrack(null);
          lastLanguage = 'off';
          return;
        }
        if (savedLang) {
          const match = captionTracks.find((tr) => tr.language === savedLang);
          if (match && typeof t.selectSubtitlesTrack === 'function') {
            t.selectSubtitlesTrack(match.id);
            lastLanguage = match.language;
            return;
          }
        }
        const initialShowing = captionTracks.find((tr) => tr.mode === 'showing');
        lastLanguage = initialShowing ? initialShowing.language || 'on' : 'off';
        return;
      }

      const currentShowing = captionTracks.find((tr) => tr.mode === 'showing');
      const nextLanguage = currentShowing ? currentShowing.language || 'on' : 'off';
      if (nextLanguage !== lastLanguage) {
        lastLanguage = nextLanguage;
        writeJsonStorage(STORAGE_CAPTIONS_KEY, { language: nextLanguage });
      }
    });
  }

  function attachQualityPreferences(store, selectQuality) {
    if (typeof selectQuality !== 'function') return;

    const saved = readJsonStorage(STORAGE_QUALITY_KEY);
    const savedQuality = saved && (saved.quality === 'auto' || Number.isFinite(saved.quality)) ? saved.quality : null;
    let restored = false;
    let lastQuality = null;

    store.subscribe(() => {
      const q = selectQuality(store.state);
      if (!q || !Array.isArray(q.videoRenditionList) || q.videoRenditionList.length === 0) return;

      if (!restored) {
        restored = true;
        if (savedQuality && typeof q.selectVideoRendition === 'function') {
          if (savedQuality === 'auto') {
            q.selectVideoRendition('auto');
            lastQuality = 'auto';
            return;
          }
          const match = q.videoRenditionList.find(
            (r) => r && (r.height === savedQuality || r.id === savedQuality)
          );
          q.selectVideoRendition(match ? match.id : 'auto');
          lastQuality = match ? match.height || match.id : 'auto';
          return;
        }
        lastQuality = q.selected || 'auto';
        return;
      }

      const selectedId = q.selected || 'auto';
      let currentPref = 'auto';
      if (selectedId !== 'auto') {
        const activeEntry = q.videoRenditionList.find((r) => r && r.id === selectedId);
        currentPref = activeEntry && Number.isFinite(activeEntry.height) ? activeEntry.height : selectedId;
      }
      if (currentPref !== lastQuality) {
        lastQuality = currentPref;
        writeJsonStorage(STORAGE_QUALITY_KEY, { quality: currentPref });
      }
    });
  }

  function enhancePlayer(player) {
    if (!player || player.getAttribute(ENHANCED_ATTR) === '1') return;
    player.setAttribute(ENHANCED_ATTR, '1');

    // Retirer les contrôles natifs (utilisés en repli sans JavaScript) dès que Video.js 10 prend le relais
    const nativeMedia = player.querySelector('video[controls], audio[controls]');
    if (nativeMedia) {
      nativeMedia.controls = false;
      nativeMedia.removeAttribute('controls');
    }

    ensureGoogleCast(player);

    const api = window.VideoJS10;
    const store = player.store;
    if (!api || !store || typeof store.subscribe !== 'function') return;

    attachVolumePreferences(player, store, api.selectVolume);
    attachCaptionPreferences(store, api.selectTextTrack);
    attachQualityPreferences(store, api.selectQuality);
  }

  function scanAndEnhance() {
    const players = document.querySelectorAll('video-player, audio-player');
    for (let i = 0; i < players.length; i++) {
      enhancePlayer(players[i]);
    }
  }

  function syncReducedMotion(prefersReducedMotion) {
    if (!prefersReducedMotion) return;
    const videos = document.querySelectorAll('video[autoplay]');
    for (let i = 0; i < videos.length; i++) {
      videos[i].removeAttribute('autoplay');
      if (typeof videos[i].pause === 'function') videos[i].pause();
    }
  }

  function init() {
    injectCueStyles();
    scanAndEnhance();

    if (typeof window.matchMedia === 'function') {
      const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      syncReducedMotion(rmQuery.matches);
      if (typeof rmQuery.addEventListener === 'function') {
        rmQuery.addEventListener('change', (ev) => syncReducedMotion(ev.matches));
      }
    }

    if (typeof MutationObserver === 'function' && document.body) {
      const observer = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          const added = mutations[i].addedNodes;
          for (let j = 0; j < added.length; j++) {
            const node = added[j];
            if (!node || node.nodeType !== 1) continue;
            const tag = node.tagName ? node.tagName.toLowerCase() : '';
            if (tag === 'video-player' || tag === 'audio-player') {
              enhancePlayer(node);
            } else if (node.querySelectorAll) {
              const nested = node.querySelectorAll('video-player, audio-player');
              for (let k = 0; k < nested.length; k++) enhancePlayer(nested[k]);
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function waitForCustomElementsAndInit() {
    if (window.customElements && typeof window.customElements.whenDefined === 'function') {
      Promise.all([
        window.customElements.whenDefined('video-player').catch(() => {}),
      ]).then(() => {
        // Laisser un tick pour que player.store soit initialisé.
        setTimeout(init, 0);
      });
    } else {
      init();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForCustomElementsAndInit);
  } else {
    waitForCustomElementsAndInit();
  }
})();
