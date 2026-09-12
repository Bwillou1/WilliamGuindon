/**
 * theme.js — William Guindon (williamguindon.me)
 * Fichier de compatibilité : chargeur modulaire vers assets/js/theme-core.js,
 * assets/js/page-home.js et assets/js/chat-ai.js.
 */
(function () {
  'use strict';

  function loadScript(src) {
    if (document.querySelector(`script[src*="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.defer = true;
    document.head.appendChild(s);
  }

  loadScript('assets/js/theme-core.js');
  loadScript('assets/js/chat-ai.js');

  const path = window.location.pathname;
  const isHome = path === '/' || path.endsWith('index.html') || path === '';
  if (isHome) {
    loadScript('assets/js/page-home.js');
  }
})();
