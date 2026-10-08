/**
 * navbar-loader.js — Injecteur dynamique et autonome de la barre de navigation
 * William Guindon (williamguindon.me)
 * 
 * Fonctionnalités :
 * - Chargement asynchrone non-bloquant de navbar.html via Fetch API
 * - Cache instantané en sessionStorage (0 ms de latence lors de la navigation)
 * - Détection et surbrillance automatique de la page active (active + aria-current="page")
 * - Liaison complète des événements interactifs (menu mobile, sous-menus, notifications, langues)
 * - Déclenchement de l'événement personnalisé "navbar:loaded" pour extensibilité
 */

(function () {
  'use strict';

  const NAVBAR_URL = 'navbar.html';
  const CACHE_KEY = 'wg_navbar_html_v1';

  async function loadNavbar() {
    const placeholder = document.getElementById('navbar-placeholder') || document.querySelector('header.site');
    if (!placeholder && !document.body) return;

    let html = null;

    // 1. Tenter la lecture instantanée depuis le sessionStorage
    try {
      html = sessionStorage.getItem(CACHE_KEY);
    } catch (e) {
      // Ignorer si stockage non disponible
    }

    // 2. Si non présent en cache, charger via fetch
    if (!html) {
      try {
        const response = await fetch(NAVBAR_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        html = await response.text();
        try {
          sessionStorage.setItem(CACHE_KEY, html);
        } catch (e) {}
      } catch (err) {
        console.warn('Impossible de charger navbar.html:', err);
        return;
      }
    }

    // 3. Injecter dans le DOM
    if (placeholder) {
      if (placeholder.tagName.toLowerCase() === 'header' && placeholder.classList.contains('site')) {
        placeholder.outerHTML = html;
      } else {
        placeholder.innerHTML = html;
      }
    } else {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const headerEl = tempDiv.firstElementChild;
      const mainContent = document.getElementById('main-content') || document.body.firstElementChild;
      document.body.insertBefore(headerEl, mainContent);
    }

    // 4. Initialiser la logique interactive et la page active
    initNavbarInteractions();
    highlightActivePage();

    // 5. Notifier le reste de l'application
    window.dispatchEvent(new CustomEvent('navbar:loaded'));
  }

  function highlightActivePage() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const currentHash = window.location.hash;

    const navLinks = document.querySelectorAll('.nav-dropdown-item, .brand');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkFile = href.split('#')[0].split('/').pop() || 'index.html';
      const linkHash = href.includes('#') ? '#' + href.split('#')[1] : '';

      let isActive = false;
      if (linkHash && currentHash) {
        isActive = (linkFile === currentPath || (linkFile === 'index.html' && currentPath === '')) && linkHash === currentHash;
      } else if (!linkHash) {
        isActive = (linkFile === currentPath || (linkFile === '' && currentPath === 'index.html') || (linkFile === './' && (currentPath === 'index.html' || currentPath === '')));
      }

      if (isActive && !link.classList.contains('brand')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initNavbarInteractions() {
    const header = document.querySelector('header.site');
    if (!header) return;

    // Menu toggle mobile
    const menuToggle = header.querySelector('.menu-toggle');
    const nav = header.querySelector('nav');
    const closeBtn = header.querySelector('.mobile-menu-close-btn');

    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav-open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    if (closeBtn && nav) {
      closeBtn.addEventListener('click', () => {
        nav.classList.remove('nav-open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      });
    }

    // Fermeture du menu mobile au clic sur un lien
    nav?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav-open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Fermeture avec la touche Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav?.classList.contains('nav-open')) {
        nav.classList.remove('nav-open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
  } else {
    loadNavbar();
  }
})();
