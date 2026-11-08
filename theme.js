/**
 * theme.js — William Guindon (williamguindon.me)
 * Fichier de compatibilité : chargeur modulaire vers assets/js/theme-core.js,
 * assets/js/page-home.js et assets/js/chat-ai.js.
 */
(function () {
  'use strict';

  function loadScript(src) {
    const cleanSrc = src.startsWith('/') ? src : '/' + src;
    if (document.querySelector(`script[src*="${cleanSrc}"]`)) return;
    const s = document.createElement('script');
    s.src = cleanSrc;
    s.defer = true;
    document.head.appendChild(s);
  }

  loadScript('/assets/js/theme-core.js?v=20261108-v145');
  loadScript('/assets/js/chat-ai.js?v=20261022-v6');
  loadScript('/assets/js/anticapture.js?v=20260925-v5');

  const path = window.location.pathname;
  const isHome = path === '/' || path === '' || path === '/en/' || path === '/en' || path === '/es/' || path === '/es' || path.endsWith('/index.html') || path.endsWith('index.html');
  if (isHome) {
    loadScript('/assets/js/page-home.js');
  }
})();
