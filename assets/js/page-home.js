/**
 * page-home.js — William Guindon (williamguindon.me)
 * Module spécifique à la page d'accueil (index.html) :
 * Carrousel de presse interactif, compteurs animés, aperçu des articles et photos.
 */
(function () {
  'use strict';

  const DEBUG = false;

  function initHomePage() {
    // 1. Compteurs animés avec IntersectionObserver
    const counters = document.querySelectorAll('.counter-num');
    
    function animateCounter(el) {
      const targetVal = el.getAttribute('data-target');
      if (!targetVal) return;
      const target = parseInt(targetVal, 10);
      if (isNaN(target)) return;
      
      const suffix = el.getAttribute('data-suffix') || '';
      const isM2 = el.getAttribute('data-format') === 'k' || el.textContent.includes('m²') || target >= 1000;
      const duration = 1200;
      let startTime = null;
      
      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.floor(progress * target);
        
        const unit = isM2 ? ' m²' : suffix;
        el.textContent = current.toLocaleString('fr-CA').replace(/\s/g, ' ') + unit;
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString('fr-CA').replace(/\s/g, ' ') + unit;
        }
      }
      
      requestAnimationFrame(step);
    }

    if (counters.length > 0) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const numEl = entry.target;
            if (!numEl.classList.contains('animated')) {
              numEl.classList.add('animated');
              animateCounter(numEl);
            }
            counterObserver.unobserve(numEl);
          }
        });
      }, { threshold: 0.1 });

      counters.forEach(c => counterObserver.observe(c));
    }

    // 2. Carrousel de presse
    const carouselWrapper = document.querySelector('.press-carousel-wrapper');
    const carouselContainer = document.querySelector('.press-carousel-container');
    const prevBtn = document.querySelector('.js-carousel-prev');
    const nextBtn = document.querySelector('.js-carousel-next');
    const dots = document.querySelectorAll('.carousel-dot');
    const cards = carouselContainer ? carouselContainer.querySelectorAll('.press-card') : [];

    if (carouselContainer && cards.length > 0) {
      let currentIndex = 0;
      let autoPlayTimer = null;

      if (carouselWrapper) {
        carouselWrapper.style.overflow = 'hidden';
        carouselWrapper.style.position = 'relative';
        carouselWrapper.style.width = '100%';
      }
      carouselContainer.style.display = 'flex';
      carouselContainer.style.flexDirection = 'row';
      carouselContainer.style.flexWrap = 'nowrap';
      carouselContainer.style.alignItems = 'stretch';
      carouselContainer.style.gap = '24px';
      carouselContainer.style.width = 'max-content';
      carouselContainer.style.minWidth = '100%';
      carouselContainer.style.willChange = 'transform';
      carouselContainer.style.transform = 'translateX(0px)';

      cards.forEach(c => {
        c.style.flex = '0 0 350px';
        c.style.width = '350px';
        c.style.minWidth = '290px';
        c.style.maxWidth = '380px';
        c.style.boxSizing = 'border-box';
        c.style.position = 'relative';
      });

      const getGap = () => 24;

      const getCardWidth = () => {
        const first = cards[0];
        return first ? first.getBoundingClientRect().width : 350;
      };

      const getVisibleCards = () => {
        const wrapWidth = carouselWrapper ? carouselWrapper.getBoundingClientRect().width : window.innerWidth;
        const cardW = getCardWidth();
        return Math.max(1, Math.floor(wrapWidth / (cardW + getGap())));
      };

      const getMaxIndex = () => {
        const visible = getVisibleCards();
        return Math.max(0, cards.length - visible);
      };

      const updateSlider = (index, smooth = true) => {
        const maxIdx = getMaxIndex();
        currentIndex = Math.max(0, Math.min(index, maxIdx));

        const cardW = getCardWidth();
        const gap = getGap();
        const offset = currentIndex * (cardW + gap);

        carouselContainer.style.transition = smooth ? 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none';
        carouselContainer.style.transform = `translateX(-${offset}px)`;

        dots.forEach((dot, i) => {
          const isActive = (i === currentIndex);
          dot.classList.toggle('active', isActive);
          if (isActive) {
            dot.setAttribute('aria-current', 'true');
          } else {
            dot.removeAttribute('aria-current');
          }
          dot.setAttribute('aria-label', `Diapositive ${i + 1} sur ${dots.length}`);
        });

        if (prevBtn) {
          prevBtn.style.opacity = currentIndex === 0 ? '0.45' : '1';
          prevBtn.style.cursor = currentIndex === 0 ? 'default' : 'pointer';
        }
        if (nextBtn) {
          nextBtn.style.opacity = currentIndex >= maxIdx ? '0.45' : '1';
        }
      };

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (currentIndex > 0) {
            updateSlider(currentIndex - 1);
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const maxIdx = getMaxIndex();
          if (currentIndex < maxIdx) {
            updateSlider(currentIndex + 1);
          } else {
            updateSlider(0);
          }
        });
      }

      window.__wg_slidePress = (action) => {
        if (typeof action === 'number') {
          updateSlider(action);
        } else if (action === 'prev') {
          if (currentIndex > 0) updateSlider(currentIndex - 1);
        } else if (action === 'next') {
          const maxIdx = getMaxIndex();
          if (currentIndex < maxIdx) updateSlider(currentIndex + 1);
          else updateSlider(0);
        }
      };

      dots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          updateSlider(idx);
        });
      });

      let touchStartX = 0;
      let touchCurrentX = 0;
      let isTouching = false;

      carouselContainer.addEventListener('touchstart', (e) => {
        stopAutoPlay();
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        touchCurrentX = touchStartX;
        carouselContainer.style.transition = 'none';
      }, { passive: true });

      carouselContainer.addEventListener('touchmove', (e) => {
        if (!isTouching) return;
        touchCurrentX = e.touches[0].clientX;
        const diff = touchCurrentX - touchStartX;
        const cardW = getCardWidth();
        const gap = getGap();
        const baseOffset = currentIndex * (cardW + gap);
        carouselContainer.style.transform = `translateX(${-baseOffset + diff}px)`;
      }, { passive: true });

      carouselContainer.addEventListener('touchend', () => {
        if (!isTouching) return;
        isTouching = false;
        const diff = touchCurrentX - touchStartX;
        const threshold = 45;
        const maxIdx = getMaxIndex();

        if (diff < -threshold && currentIndex < maxIdx) {
          updateSlider(currentIndex + 1);
        } else if (diff > threshold && currentIndex > 0) {
          updateSlider(currentIndex - 1);
        } else {
          updateSlider(currentIndex);
        }
        setTimeout(startAutoPlay, 3500);
      }, { passive: true });

      const startAutoPlay = () => {
        stopAutoPlay();
        autoPlayTimer = setInterval(() => {
          const maxIdx = getMaxIndex();
          if (currentIndex >= maxIdx) {
            updateSlider(0);
          } else {
            updateSlider(currentIndex + 1);
          }
        }, 5000);
      };

      const stopAutoPlay = () => {
        if (autoPlayTimer) {
          clearInterval(autoPlayTimer);
          autoPlayTimer = null;
        }
      };

      if (carouselWrapper) {
        carouselWrapper.addEventListener('mouseenter', stopAutoPlay);
        carouselWrapper.addEventListener('mouseleave', startAutoPlay);
        carouselWrapper.addEventListener('focusin', stopAutoPlay);
        carouselWrapper.addEventListener('focusout', startAutoPlay);
      }

      window.addEventListener('resize', () => {
        updateSlider(currentIndex, false);
      }, { passive: true });

      updateSlider(0, false);
      startAutoPlay();

      const audioBtns = document.querySelectorAll('.js-press-audio-btn');
      audioBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const isPlaying = btn.getAttribute('data-playing') === 'true';
          const playSvg = '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
          const pauseSvg = '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
          audioBtns.forEach(b => {
            b.setAttribute('data-playing', 'false');
            b.innerHTML = playSvg;
          });
          if (!isPlaying) {
            btn.setAttribute('data-playing', 'true');
            btn.innerHTML = pauseSvg;
            const targetUrl = btn.getAttribute('data-target-url');
            if (targetUrl) {
              setTimeout(() => {
                window.open(targetUrl, '_blank', 'noopener,noreferrer');
                btn.setAttribute('data-playing', 'false');
                btn.innerHTML = playSvg;
              }, 1200);
            }
          }
        });
      });
    }

    // 3. Chargement asynchrone des aperçus du blog et des photos
    const blogTrack = document.getElementById('home-blog-track');
    const photosTrack = document.getElementById('home-photos-track');
    if (blogTrack || photosTrack) {
      function loadPhotosIfEmpty() {
        if (photosTrack && photosTrack.children.length === 0) {
          fetch('data/photos.json')
            .then(res => res.json())
            .then(photos => {
              if (!photos || photos.length === 0) return;
              photosTrack.innerHTML = photos.slice(0, 6).map(ph => `
                <article class="blog-preview-card">
                  <div class="blog-preview-thumb">
                    <img src="${ph.imageUrl}" alt="${ph.title || 'Photographie de la Grande Tourbière'}" loading="lazy" decoding="async" width="380" height="215">
                    <span class="blog-preview-category">${ph.category || 'Terrain'}</span>
                  </div>
                  <div class="blog-preview-body">
                    <time class="blog-preview-date">${ph.date || ''} ${ph.location ? '· ' + ph.location : ''}</time>
                    <h3 class="blog-preview-title">${ph.title}</h3>
                    <p class="blog-preview-excerpt">${ph.description || ''}</p>
                    <div class="blog-preview-footer">
                      <a href="photos.html" class="blog-preview-link">Voir en grand ↗</a>
                    </div>
                  </div>
                </article>
              `).join('');
            })
            .catch(err => { if (DEBUG) console.warn('Photos preview load:', err); });
        }
      }

      const btnBlogTab = document.getElementById('btn-tab-blog-posts');
      const btnPhotosTab = document.getElementById('btn-tab-blog-photos');
      if (btnBlogTab) btnBlogTab.addEventListener('click', () => window.switchHomeTab('blog'));
      if (btnPhotosTab) btnPhotosTab.addEventListener('click', () => window.switchHomeTab('photos'));

      window.switchHomeTab = function(tab) {
        const btnBlog = document.getElementById('btn-tab-blog-posts');
        const btnPhotos = document.getElementById('btn-tab-blog-photos');
        const carouselBlog = document.getElementById('home-blog-carousel');
        const carouselPhotos = document.getElementById('home-photos-carousel');

        if (tab === 'blog') {
          if (btnBlog) btnBlog.classList.add('active');
          if (btnPhotos) btnPhotos.classList.remove('active');
          if (carouselBlog) carouselBlog.style.display = 'block';
          if (carouselPhotos) carouselPhotos.style.display = 'none';
        } else {
          if (btnPhotos) btnPhotos.classList.add('active');
          if (btnBlog) btnBlog.classList.remove('active');
          if (carouselPhotos) carouselPhotos.style.display = 'block';
          if (carouselBlog) carouselBlog.style.display = 'none';
          loadPhotosIfEmpty();
        }
      };

      if (blogTrack && blogTrack.children.length === 0) {
        fetch('data/blog.json')
          .then(res => res.json())
          .then(posts => {
            if (!posts || posts.length === 0) return;
            blogTrack.innerHTML = posts.slice(0, 6).map(p => `
              <article class="blog-preview-card">
                <div class="blog-preview-thumb">
                  <img src="${p.coverImage || 'tourbiere-thumb.webp'}" alt="${p.title || 'Article du carnet de bord'}" loading="lazy" decoding="async" width="380" height="215">
                  <span class="blog-preview-category">${p.category || 'Actualité'}</span>
                </div>
                <div class="blog-preview-body">
                  <time class="blog-preview-date">${p.date} · Par ${p.author || 'William Guindon'}</time>
                  <h3 class="blog-preview-title">${p.title}</h3>
                  <p class="blog-preview-excerpt">${p.summary || p.content.substring(0, 120) + '...'}</p>
                  <div class="blog-preview-footer">
                    <a href="blog.html#${p.slug || p.id}" class="blog-preview-link">Lire l'article complet ↗</a>
                  </div>
                </div>
              </article>
            `).join('');
          })
          .catch(err => { if (DEBUG) console.warn('Blog preview load:', err); });
      }
    }

    // 6. Lecteur Audio Biographie Synchronisé (Karaoké Citoyen)
    const btnAudioRead = document.getElementById('btn-audio-read');
    if (btnAudioRead) {
      let audio = null;
      let cues = null;
      let floatingPlayer = null;
      let playPauseBtn = null;
      let timerEl = null;
      let currentActiveCueEl = null;

      function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
      }

      function createFloatingPlayer() {
        if (floatingPlayer) return floatingPlayer;
        floatingPlayer = document.createElement('div');
        floatingPlayer.id = 'bio-floating-player';
        floatingPlayer.className = 'bio-floating-player';
        floatingPlayer.setAttribute('role', 'region');
        floatingPlayer.setAttribute('aria-label', 'Lecteur audio biographique');

        floatingPlayer.innerHTML = `
          <button type="button" class="bio-player-btn-circle" id="bio-audio-rewind" aria-label="Reculer de 10 secondes">↺ 10s</button>
          <button type="button" class="bio-player-btn-circle bio-player-btn-main" id="bio-audio-play-pause" aria-label="Pause">⏸</button>
          <button type="button" class="bio-player-btn-circle" id="bio-audio-forward" aria-label="Avancer de 10 secondes">10s ↻</button>
          <div class="bio-player-info">
            <span class="bio-player-title"><span class="bio-player-live-dot"></span> Biographie audio</span>
            <span class="bio-player-timer" id="bio-audio-time">00:00 / 06:10</span>
          </div>
          <button type="button" class="bio-player-close" id="bio-audio-close" aria-label="Fermer le lecteur audio">✕</button>
        `;
        document.body.appendChild(floatingPlayer);

        playPauseBtn = floatingPlayer.querySelector('#bio-audio-play-pause');
        timerEl = floatingPlayer.querySelector('#bio-audio-time');

        floatingPlayer.querySelector('#bio-audio-rewind').addEventListener('click', () => {
          if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
        });

        floatingPlayer.querySelector('#bio-audio-forward').addEventListener('click', () => {
          if (audio) audio.currentTime = Math.min(audio.duration || 370, audio.currentTime + 10);
        });

        playPauseBtn.addEventListener('click', () => {
          if (!audio) return;
          if (audio.paused) {
            audio.play().catch(() => {});
          } else {
            audio.pause();
          }
        });

        floatingPlayer.querySelector('#bio-audio-close').addEventListener('click', stopAudioReading);

        return floatingPlayer;
      }

      function highlightCue(time) {
        if (!cues || !cues.length) return;
        const activeCue = cues.find(c => time >= c.start && time < c.end);
        
        if (activeCue) {
          const targetEl = document.querySelector(activeCue.selector);
          if (targetEl && targetEl !== currentActiveCueEl) {
            if (currentActiveCueEl) currentActiveCueEl.classList.remove('active-speech-cue');
            targetEl.classList.add('active-speech-cue');
            currentActiveCueEl = targetEl;
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (currentActiveCueEl) {
          currentActiveCueEl.classList.remove('active-speech-cue');
          currentActiveCueEl = null;
        }
      }

      function stopAudioReading() {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        document.body.classList.remove('bio-reading-active');
        if (floatingPlayer) floatingPlayer.classList.remove('visible');
        if (currentActiveCueEl) {
          currentActiveCueEl.classList.remove('active-speech-cue');
          currentActiveCueEl = null;
        }
        btnAudioRead.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <span>Écouter la biographie</span>
        `;
      }

      async function startOrToggleAudio() {
        if (!audio) {
          audio = new Audio('assets/Audio/biographie-complete.mp3');
          createFloatingPlayer();

          try {
            const res = await fetch('data/biographie-audio-cues.json');
            const data = await res.json();
            cues = data.cues;
          } catch (_) {
            cues = [];
          }

          audio.addEventListener('play', () => {
            document.body.classList.add('bio-reading-active');
            floatingPlayer.classList.add('visible');
            if (playPauseBtn) playPauseBtn.textContent = '⏸';
            btnAudioRead.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
              <span>Pause audio</span>
            `;
          });

          audio.addEventListener('pause', () => {
            if (playPauseBtn) playPauseBtn.textContent = '▶';
            btnAudioRead.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>
              <span>Reprendre la lecture</span>
            `;
          });

          audio.addEventListener('timeupdate', () => {
            if (timerEl) {
              const cur = formatTime(audio.currentTime);
              const dur = formatTime(audio.duration || 370);
              timerEl.textContent = `${cur} / ${dur}`;
            }
            highlightCue(audio.currentTime);
          });

          audio.addEventListener('ended', stopAudioReading);
        }

        if (audio.paused) {
          audio.play().catch(e => {
            if (DEBUG) console.warn('Audio play error:', e);
          });
        } else {
          audio.pause();
        }
      }

      btnAudioRead.addEventListener('click', (e) => {
        e.preventDefault();
        startOrToggleAudio();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
  } else {
    initHomePage();
  }
})();
