/* theme.js — Script pour le mode sombre dynamique et les animations au défilement */
(function () {
  // 1. Gestion du thème Sombre/Clair
  const themeStorageKey = 'william-guindon-theme';
  
  // Déterminer le thème initial
  function getInitialTheme() {
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (savedTheme) return savedTheme;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  
  const currentTheme = getInitialTheme();
  document.documentElement.setAttribute('data-theme', currentTheme);

  // SVG pour l'icône soleil (mode sombre activé) et lune (mode clair activé)
  const sunIcon = `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41z"/></svg>`;
  const moonIcon = `<svg viewBox="0 0 24 24"><path d="M12.3 22c5.3 0 9.7-4.3 9.7-9.7 0-2.7-1.1-5.1-2.9-6.9-.5-.5-1.3-.1-1.2.6.7 3.5-.3 7.3-3 10-2.7 2.7-6.5 3.7-10 3-.7-.1-1.1.7-.6 1.2 1.8 1.8 4.2 2.8 6.8 2.8zm-2.8-5c2.7-.2 5.1-1.5 6.8-3.5C13 13.3 10 9.9 10 6c0-.8.1-1.6.3-2.4C7.4 4.5 5 7.4 5 10.9 5 14.3 7 16.7 9.5 17z"/></svg>`;

  document.addEventListener('DOMContentLoaded', () => {
    // Injecter le bouton de thème dans la navigation
    const nav = document.querySelector('header.site nav');
    if (nav) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'theme-toggle-btn';
      toggleBtn.setAttribute('aria-label', 'Changer de thème');
      
      const theme = document.documentElement.getAttribute('data-theme');
      toggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
      
      toggleBtn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(themeStorageKey, newTheme);
        toggleBtn.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
      });
      
      nav.appendChild(toggleBtn);
    }

    // 2. Animation d'apparition au défilement (Scroll Reveal)
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.08
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Optionnel : arrêter d'observer après apparition
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Cibler les sections et composants pour l'animation
    const animElements = document.querySelectorAll(
      'section, .factgrid, .keyfacts, blockquote, details.faq, ul.vision li, ul.srcs li'
    );
    
    animElements.forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  });
})();
