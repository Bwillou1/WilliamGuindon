/**
 * navbar.js — Composant de Navigation Web Réutilisable (<site-nav>)
 * Site officiel de William Guindon (williamguindon.me)
 * 
 * Architecture : Web Component natif (Custom Elements v1 + Shadow DOM)
 * Ergonomie : Menu tiroir mobile latéral fluide inspiré des concepts de Slideout.js (mango/slideout) et mmenu.js.
 * Licence : MIT / CC BY-NC-ND 4.0
 */

// =============================================================================
// 1. CONFIGURATION FACILE DES LIENS DE NAVIGATION
// =============================================================================
const NAV_LINKS = [
  { label: 'Accueil', url: './', icon: '🏠' },
  { label: 'Dossier Stablex & CCE', url: 'stablex.html', icon: '📁' },
  { label: 'Agir & Soutenir', url: 'agir.html', icon: '✊', highlight: true },
  { label: 'Vulgarisation (SEM-26-003)', url: 'apercu.html', icon: '💡' },
  { label: 'Registre officiel CCE (222 pièces)', url: 'registre.html', icon: '⚖️' },
  { label: 'Histoire autochtone & Écologie', url: 'autochtone.html', icon: '🌿' },
  { label: 'Blog & Carnet', url: 'blog.html', icon: '📝' },
  { label: 'Espace Presse', url: 'presse.html', icon: '📰' },
  { label: 'À propos & Contact', url: 'index.html#contact', icon: '✉️' }
];

// Configuration de la marque / Logo
const BRAND_CONFIG = {
  name: 'William',
  accent: 'Guindon',
  url: './',
  title: 'William Guindon — Militant écologiste & Chercheur citoyen'
};

// =============================================================================
// 2. DÉFINITION DU WEB COMPONENT NATIF (<site-nav>)
// =============================================================================
class SiteNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
    this.highlightActiveLink();
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._handleKeydown);
    document.removeEventListener('click', this._handleOutsideClick);
    this.unlockScroll();
  }

  // Détection de la page active via l'URL courante
  highlightActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const currentHash = window.location.hash;

    const links = this.shadowRoot.querySelectorAll('.nav-link');
    links.forEach(link => {
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

      if (isActive) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // Verrouillage du scroll lors de l'ouverture du tiroir mobile
  lockScroll() {
    this._prevScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }

  unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  toggleMenu() {
    if (this._isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this._isOpen = true;
    const drawer = this.shadowRoot.querySelector('.nav-drawer');
    const backdrop = this.shadowRoot.querySelector('.nav-backdrop');
    const burger = this.shadowRoot.querySelector('.burger-btn');

    drawer.classList.add('open');
    backdrop.classList.add('visible');
    burger.classList.add('active');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');

    this.lockScroll();
  }

  closeMenu() {
    this._isOpen = false;
    const drawer = this.shadowRoot.querySelector('.nav-drawer');
    const backdrop = this.shadowRoot.querySelector('.nav-backdrop');
    const burger = this.shadowRoot.querySelector('.burger-btn');

    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');
    if (burger) {
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
    }

    this.unlockScroll();
  }

  _handleKeydown(e) {
    if (e.key === 'Escape' && this._isOpen) {
      this.closeMenu();
    }
  }

  _handleOutsideClick(e) {
    if (!this._isOpen) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this.closeMenu();
    }
  }

  setupEvents() {
    const burger = this.shadowRoot.querySelector('.burger-btn');
    const backdrop = this.shadowRoot.querySelector('.nav-backdrop');
    const closeBtn = this.shadowRoot.querySelector('.drawer-close-btn');
    const drawerLinks = this.shadowRoot.querySelectorAll('.drawer-nav .nav-link');

    if (burger) {
      burger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeMenu());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeMenu());
    }

    // Fermeture automatique au clic sur un lien du menu
    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.closeMenu();
      });
    });

    document.addEventListener('keydown', this._handleKeydown);
    document.addEventListener('click', this._handleOutsideClick);

    // Écouteur pour mettre à jour la page active en cas de changement de hash
    window.addEventListener('hashchange', () => this.highlightActiveLink());
    window.addEventListener('popstate', () => this.highlightActiveLink());
  }

  render() {
    const linksHtmlDesktop = NAV_LINKS.map(item => `
      <a href="${item.url}" class="nav-link desktop-link ${item.highlight ? 'link-highlight' : ''}">
        ${item.label}
      </a>
    `).join('');

    const linksHtmlMobile = NAV_LINKS.map(item => `
      <a href="${item.url}" class="nav-link mobile-link ${item.highlight ? 'link-highlight' : ''}">
        <span class="link-icon">${item.icon || '•'}</span>
        <span class="link-text">${item.label}</span>
      </a>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          --nav-height: 64px;
          --nav-accent: #059669;
          --nav-accent-rgb: 5, 150, 105;
          --nav-bg: rgba(255, 255, 255, 0.85);
          --nav-text: #1e293b;
          --nav-text-muted: #64748b;
          --nav-border: rgba(226, 232, 240, 0.85);
          --drawer-bg: rgba(255, 255, 255, 0.98);
          --drawer-shadow: -10px 0 35px rgba(0, 0, 0, 0.15);
        }

        /* Support automatique du mode sombre hérité du site */
        :host-context([data-theme="dark"]),
        :host-context(.dark-theme) {
          --nav-bg: rgba(15, 23, 42, 0.85);
          --nav-text: #f8fafc;
          --nav-text-muted: #94a3b8;
          --nav-border: rgba(51, 65, 85, 0.7);
          --drawer-bg: rgba(15, 23, 42, 0.98);
          --drawer-shadow: -10px 0 35px rgba(0, 0, 0, 0.45);
        }

        @media (prefers-color-scheme: dark) {
          :host-context(:not([data-theme="light"])) {
            --nav-bg: rgba(15, 23, 42, 0.85);
            --nav-text: #f8fafc;
            --nav-text-muted: #94a3b8;
            --nav-border: rgba(51, 65, 85, 0.7);
            --drawer-bg: rgba(15, 23, 42, 0.98);
            --drawer-shadow: -10px 0 35px rgba(0, 0, 0, 0.45);
          }
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Barre principale avec effet de verre dépoli */
        .header-bar {
          height: var(--nav-height);
          background: var(--nav-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--nav-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }

        /* Logo / Marque */
        .brand {
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-decoration: none;
          color: var(--nav-text);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          user-select: none;
        }

        .brand span {
          color: var(--nav-accent);
        }

        /* Navigation Desktop */
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nav-link {
          text-decoration: none;
          color: var(--nav-text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          position: relative;
        }

        .nav-link:hover {
          color: var(--nav-text);
          background: rgba(var(--nav-accent-rgb), 0.08);
        }

        .nav-link.active {
          color: var(--nav-accent);
          font-weight: 700;
          background: rgba(var(--nav-accent-rgb), 0.12);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 14px;
          right: 14px;
          height: 2px;
          background: var(--nav-accent);
          border-radius: 2px;
        }

        .link-highlight {
          color: var(--nav-accent) !important;
          font-weight: 700;
        }

        /* Bouton Hamburger Animé */
        .burger-btn {
          display: none;
          background: none;
          border: none;
          width: 42px;
          height: 42px;
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          color: var(--nav-text);
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .burger-btn:hover {
          background: rgba(var(--nav-accent-rgb), 0.1);
        }

        .burger-icon {
          width: 22px;
          height: 16px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .burger-icon span {
          display: block;
          height: 2px;
          width: 100%;
          background: currentColor;
          border-radius: 2px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center;
        }

        .burger-btn.active .burger-icon span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }

        .burger-btn.active .burger-icon span:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }

        .burger-btn.active .burger-icon span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        /* Voile d'ombrage (Backdrop) */
        .nav-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s ease;
          z-index: 10000;
          pointer-events: none;
        }

        .nav-backdrop.visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        /* Tiroir Latéral Mobile (Drawer inspiré de Slideout.js / mmenu) */
        .nav-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: 82%;
          max-width: 340px;
          height: 100vh;
          background: var(--drawer-bg);
          box-shadow: var(--drawer-shadow);
          z-index: 10001;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          will-change: transform;
        }

        .nav-drawer.open {
          transform: translateX(0);
        }

        /* En-tête du tiroir */
        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px 16px 20px;
          border-bottom: 1px solid var(--nav-border);
        }

        .drawer-title {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--nav-text-muted);
        }

        .drawer-close-btn {
          background: none;
          border: 1px solid var(--nav-border);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--nav-text-muted);
          transition: all 0.2s ease;
        }

        .drawer-close-btn:hover {
          background: rgba(var(--nav-accent-rgb), 0.1);
          color: var(--nav-accent);
          border-color: var(--nav-accent);
          transform: scale(1.05);
        }

        /* Liste de liens mobile */
        .drawer-nav {
          display: flex;
          flex-direction: column;
          padding: 14px 12px;
          gap: 6px;
          flex: 1;
        }

        .mobile-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: 10px;
          border: 1px solid transparent;
        }

        .mobile-link:hover,
        .mobile-link:active {
          background: rgba(var(--nav-accent-rgb), 0.08);
          border-color: rgba(var(--nav-accent-rgb), 0.15);
          color: var(--nav-accent);
        }

        .mobile-link.active {
          background: rgba(var(--nav-accent-rgb), 0.12);
          border-color: rgba(var(--nav-accent-rgb), 0.25);
          color: var(--nav-accent);
          font-weight: 700;
        }

        .mobile-link.active::after {
          display: none;
        }

        .link-icon {
          font-size: 1.1rem;
          width: 24px;
          text-align: center;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* Pied de page du tiroir */
        .drawer-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--nav-border);
          font-size: 0.78rem;
          color: var(--nav-text-muted);
          text-align: center;
          line-height: 1.4;
        }

        /* Règle Responsive (Mobile / Tablette < 960px) */
        @media (max-width: 960px) {
          .desktop-nav {
            display: none;
          }
          .burger-btn {
            display: flex;
          }
        }
      </style>

      <header class="header-bar">
        <a href="${BRAND_CONFIG.url}" class="brand" title="${BRAND_CONFIG.title}">
          ${BRAND_CONFIG.name} <span>${BRAND_CONFIG.accent}</span>
        </a>

        <!-- Menu Desktop Horizontal -->
        <nav class="desktop-nav" aria-label="Navigation principale (Bureau)">
          ${linksHtmlDesktop}
        </nav>

        <!-- Déclencheur Mobile Burger -->
        <button class="burger-btn" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mobile-drawer">
          <div class="burger-icon" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </header>

      <!-- Voile sombre -->
      <div class="nav-backdrop" aria-hidden="true"></div>

      <!-- Tiroir mobile latéral (Slideout Drawer) -->
      <aside class="nav-drawer" id="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu mobile">
        <div class="drawer-header">
          <span class="drawer-title">Navigation</span>
          <button class="drawer-close-btn" type="button" aria-label="Fermer le menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav class="drawer-nav" aria-label="Navigation mobile">
          ${linksHtmlMobile}
        </nav>

        <div class="drawer-footer">
          Registre public · SEM-26-003<br>
          Commission de coopération environnementale
        </div>
      </aside>
    `;
  }
}

// Enregistrement du Custom Element <site-nav>
if (!customElements.get('site-nav')) {
  customElements.define('site-nav', SiteNav);
}
