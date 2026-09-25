/**
 * assets/js/anticapture.js — William Guindon (williamguindon.me)
 * Module de protection et dissuasion contre la capture d'écran, la copie sauvage et l'usurpation visuelle.
 * 
 * Conception inspirée et adaptée des projets open source :
 * 1. react-anticapture : © 2023 Dima Vyshniakov — Licence MIT (https://github.com/dimsp4/react-anticapture)
 * 2. secure-web : © 2024 bmiit145 — Licence MIT (https://github.com/bmiit145/secure-web)
 * 
 * Périmètres protégés :
 * 1. Messagerie chiffrée & échanges confidentiels (messagerie.html)
 * 2. Signature officielle manuscrite et vectorielle de William Guindon
 * 3. Réponses et synthèses générées par le module IA (chat-ai.js / ai.html)
 * 4. Logos de partenaires de presse et d'événements (anti-copie / anti-glisser)
 * 5. Éléments déclarés avec data-anticapture="true" ou .anticapture-zone
 * 
 * NOTE D'INTÉGRITÉ JURIDIQUE : Les pièces probatoires PDF de la CCE (assets/docs/)
 * demeurent librement et publiquement vérifiables conformément au registre CCE SEM-26-003.
 */
(function () {
  'use strict';

  const CONFIG = {
    blurAmount: '28px',
    unblurDuration: 3000,
    toastDuration: 3000
  };

  let activeBlurTimer = null;
  let activeToastTimer = null;
  const protectedElements = new Set();

  function showToast(message) {
    let toast = document.getElementById('anticapture-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'anticapture-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = [
        'position: fixed',
        'bottom: 24px',
        'left: 50%',
        'transform: translateX(-50%)',
        'background: rgba(13, 17, 24, 0.96)',
        'border: 1px solid rgba(16, 185, 129, 0.5)',
        'color: #ffffff',
        'padding: 10px 22px',
        'border-radius: 9999px',
        'font-size: 13px',
        'font-weight: 700',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'display: flex',
        'align-items: center',
        'gap: 10px',
        'box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65)',
        'z-index: 1000000',
        'backdrop-filter: blur(12px)',
        'transition: opacity 0.25s ease, transform 0.25s ease',
        'opacity: 0',
        'pointer-events: none'
      ].join(';');
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span style="font-size:16px;">🛡️</span> <span>${message}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    if (activeToastTimer) clearTimeout(activeToastTimer);
    activeToastTimer = setTimeout(() => {
      if (toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
      }
    }, CONFIG.toastDuration);
  }

  function triggerBlurProtection(reason) {
    if (protectedElements.size === 0) {
      discoverAndProtectElements();
    }

    protectedElements.forEach(el => {
      if (el && el.isConnected) {
        el.style.filter = `blur(${CONFIG.blurAmount})`;
        el.style.opacity = '0.04';
        el.style.pointerEvents = 'none';
        el.style.transition = 'filter 0.06s ease-in-out, opacity 0.06s ease-in-out';
        el.classList.add('anticapture-blurred');
      }
    });

    if ((reason === 'screenshot' || reason === 'copy' || reason === 'devtools') && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        navigator.clipboard.writeText('');
      } catch (_) {}
    }

    if (reason === 'screenshot') {
      showToast("Protection anti-capture active · Éléments sensibles masqués");
    } else if (reason === 'devtools') {
      showToast("Inspection désactivée sur l'assistant IA · Contenu protégé masqué");
    } else if (reason === 'copy') {
      showToast("Protection anti-copie : copie interdite sur les réponses IA");
    }

    if (activeBlurTimer) clearTimeout(activeBlurTimer);
    activeBlurTimer = setTimeout(() => {
      clearBlurProtection();
    }, CONFIG.unblurDuration);
  }

  function clearBlurProtection() {
    if (activeBlurTimer) {
      clearTimeout(activeBlurTimer);
      activeBlurTimer = null;
    }

    protectedElements.forEach(el => {
      if (el && el.isConnected) {
        el.style.filter = '';
        el.style.opacity = '';
        el.style.pointerEvents = '';
        el.classList.remove('anticapture-blurred');
      }
    });
  }

  function applyDeterrenceToElement(el, isStrictConfidential) {
    if (!el || protectedElements.has(el)) return;
    protectedElements.add(el);

    el.classList.add('anticapture-protected');
    el.style.webkitUserSelect = 'none';
    el.style.userSelect = 'none';
    el.style.webkitUserDrag = 'none';
    el.setAttribute('draggable', 'false');

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      const isAiElement = el.closest && (el.closest('.ai-modal-card') || el.closest('#ai-chat-box') || el.closest('#ai-summary-output') || el.classList.contains('ai-chat-bubble'));
      if (isAiElement || isStrictConfidential) {
        triggerBlurProtection('devtools');
        showToast("Inspection et clic droit désactivés dans l'assistant IA.");
      } else {
        showToast("Protection anti-copie : clic droit désactivé sur cet élément.");
      }
      return false;
    }, true);

    el.addEventListener('dragstart', e => {
      e.preventDefault();
      return false;
    }, true);

    el.addEventListener('selectstart', e => {
      if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && !el.classList.contains('ai-chat-input')) {
        e.preventDefault();
        return false;
      }
    }, true);

    el.addEventListener('copy', e => {
      e.preventDefault();
      e.stopPropagation();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { navigator.clipboard.writeText(''); } catch (_) {}
      }
      triggerBlurProtection('copy');
      showToast("Protection active : la copie du texte des réponses IA est désactivée.");
      return false;
    }, true);

    el.addEventListener('cut', e => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);
  }

  function discoverAndProtectElements() {
    // 1. Signature manuscrite et officielle de William Guindon
    const signatureSelectors = [
      'img[src*="signature.svg"]',
      '.signature-svg-animated',
      '.signature-block',
      '.signature-draw-box',
      '.card-signature-svg',
      '#view-sig-img'
    ];
    document.querySelectorAll(signatureSelectors.join(', ')).forEach(el => {
      applyDeterrenceToElement(el, true);
    });

    // 2. Logos des médias partenaires & diffuseurs et logos d'événements
    const logoSelectors = [
      '.media-logos-ticker-wrapper img',
      '.media-logo-item img',
      '.press-logo-img',
      '.event-card-logo-wrap img',
      'img[src*="lapresse-logo"]',
      'img[src*="ledevoir-logo"]',
      'img[src*="cbc-logo"]',
      'img[src*="tvbl-logo"]',
      'img[src*="the-rover-logo"]',
      'img[src*="lesasdelinfo-logo"]',
      'img[src*="logo-areq-csq"]',
      'img[src*="logo-mouvement-actes-csq"]'
    ];
    document.querySelectorAll(logoSelectors.join(', ')).forEach(el => {
      applyDeterrenceToElement(el, false);
    });

    // 3. Messagerie sécurisée Nostr (messagerie.html)
    const isMessageriePage = window.location.pathname.includes('messagerie.html');
    if (isMessageriePage) {
      const msgSelectors = [
        '#msg-content',
        '#view-send-panel .msg-box-container',
        '#inbox-list-container',
        '#burner-nsec-plain',
        '#log-receipt'
      ];
      document.querySelectorAll(msgSelectors.join(', ')).forEach(el => {
        applyDeterrenceToElement(el, true);
      });
    }

    // 4. Réponses, synthèses et interface du Chat IA (chat-ai.js / ai.html)
    const aiSelectors = [
      '.ai-chat-bubble.bot',
      '#ai-chat-box',
      '.ai-chat-messages',
      '#ai-preset-prompt-text',
      '.ai-modal-card',
      '#ai-tab-chat',
      '#ai-tab-models'
    ];
    document.querySelectorAll(aiSelectors.join(', ')).forEach(el => {
      applyDeterrenceToElement(el, true);
    });

    // 5. Cibles universelles déclarées via balisage HTML
    document.querySelectorAll('[data-anticapture="true"], .anticapture-zone, .anticapture-target').forEach(el => {
      applyDeterrenceToElement(el, el.dataset.strict === 'true');
    });
  }

  function setupKeyboardListeners() {
    window.addEventListener('keydown', e => {
      const key = (e.key || '').toLowerCase();
      const code = e.code || '';
      const isMac = (navigator.platform || '').toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? (e.metaKey || e.ctrlKey) : (e.ctrlKey || e.metaKey);
      const isAltOrOption = e.altKey;

      // 1. Touche PrintScreen (Windows/Linux)
      if (key === 'printscreen' || code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        triggerBlurProtection('screenshot');
        return false;
      }

      // 2. Capture macOS : Cmd + Shift + 3, Cmd + Shift + 4, Cmd + Shift + 5, Cmd + Shift + 6
      if (cmdOrCtrl && e.shiftKey && (['Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(code) || ['3', '4', '5', '6'].includes(key))) {
        triggerBlurProtection('screenshot');
      }

      // 3. Outil Capture Windows : Win + Shift + S ou Ctrl + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (code === 'KeyS' || key === 's')) {
        triggerBlurProtection('screenshot');
      }

      // 4. Inspection DevTools : F12, Ctrl+Shift+I/C/J, Cmd+Option+I/C/J, Ctrl+U, Cmd+Option+U
      const isDevToolsShortcut = 
        key === 'f12' ||
        e.keyCode === 123 ||
        (cmdOrCtrl && e.shiftKey && ['KeyI', 'KeyC', 'KeyJ'].includes(code)) ||
        (cmdOrCtrl && e.shiftKey && ['i', 'c', 'j'].includes(key)) ||
        (cmdOrCtrl && isAltOrOption && ['KeyI', 'KeyC', 'KeyJ'].includes(code)) ||
        (cmdOrCtrl && isAltOrOption && ['i', 'c', 'j'].includes(key)) ||
        (cmdOrCtrl && (code === 'KeyU' || key === 'u'));

      if (isDevToolsShortcut) {
        e.preventDefault();
        e.stopPropagation();
        triggerBlurProtection('devtools');
        showToast("Inspection et outils de développement désactivés.");
        return false;
      }

      // 5. Tentative de sélection tout (Cmd+A / Ctrl+A) hors champs de saisie
      if (cmdOrCtrl && (key === 'a' || code === 'KeyA')) {
        const active = document.activeElement;
        const inInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (!inInput) {
          e.preventDefault();
          triggerBlurProtection('copy');
          showToast("Sélection globale désactivée sur les contenus protégés.");
          return false;
        }
      }

      // Touche Entrée pour débloquer
      if (key === 'enter' && !activeBlurTimer) {
        clearBlurProtection();
      }
    }, true);

    window.addEventListener('keyup', e => {
      const key = (e.key || '').toLowerCase();
      if (key === 'printscreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        triggerBlurProtection('screenshot');
      }
    }, true);

    window.addEventListener('beforeprint', () => {
      triggerBlurProtection('screenshot');
    });
  }

  function setupFocusAndVisibilityListeners() {
    // Déclenchement sur toutes les pages pour les éléments protégés
    document.documentElement.addEventListener('mouseleave', () => {
      triggerBlurProtection('window_blur');
    });

    document.documentElement.addEventListener('mouseenter', () => {
      if (!activeBlurTimer) {
        clearBlurProtection();
      }
    });

    window.addEventListener('blur', () => {
      triggerBlurProtection('window_blur');
    });

    window.addEventListener('focus', () => {
      if (!activeBlurTimer) {
        clearBlurProtection();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        triggerBlurProtection('visibility_hidden');
      } else {
        if (!activeBlurTimer) {
          clearBlurProtection();
        }
      }
    });

    document.addEventListener('click', () => {
      if (!activeBlurTimer) {
        clearBlurProtection();
      }
    });
  }

  function injectAntiCaptureStyles() {
    const styleId = 'anticapture-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .anticapture-protected {
        transition: filter 0.08s ease-in-out, opacity 0.08s ease-in-out !important;
        -webkit-user-select: none !important;
        user-select: none !important;
      }
      .anticapture-blurred {
        filter: blur(28px) !important;
        opacity: 0.04 !important;
        pointer-events: none !important;
      }
      .ai-chat-bubble.bot,
      .ai-chat-bubble.bot *,
      .ai-summary-output,
      .ai-summary-output *,
      .ai-summary-result,
      .ai-summary-result * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-user-drag: none !important;
      }
      @media print {
        img[src*="signature.svg"],
        .card-signature-svg,
        .signature-draw-box,
        .signature-block,
        #view-sig-img,
        #view-inbox-panel,
        #msg-content,
        .msg-box-container,
        #inbox-list-container,
        .key-highlight-card,
        .ai-modal-overlay,
        .ai-modal-card,
        #ai-chat-box,
        .ai-chat-messages,
        .ai-chat-bubble,
        .ai-summary-output,
        .ai-summary-box,
        .ai-summary-card {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setupMutationObserver() {
    const observer = new MutationObserver(mutations => {
      let needsScan = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          needsScan = true;
          break;
        }
      }
      if (needsScan) {
        discoverAndProtectElements();
      }
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function init() {
    injectAntiCaptureStyles();
    discoverAndProtectElements();
    setupKeyboardListeners();
    setupFocusAndVisibilityListeners();
    setupMutationObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AntiCapture = {
    protect: applyDeterrenceToElement,
    blurAll: (reason) => triggerBlurProtection(reason || 'manual'),
    unblurAll: clearBlurProtection,
    scan: discoverAndProtectElements
  };

})();
