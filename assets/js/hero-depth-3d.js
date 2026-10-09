/**
 * Hero Photosphère 360° & Spatial Depth Projection Engine
 * Véritable projection sphérique équirectangulaire 360° en WebGL pur.
 * Affiche la vraie photosphère de la Grande Tourbière de Blainville avec rotation fluide,
 * navigation réactive au curseur / gyroscope, et intégration complète.
 */
(() => {
  'use strict';

  // Respecter la préférence d'accessibilité pour la réduction des mouvements
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initHeroPhotosphere() {
    const heroSection = document.getElementById('accueil') || document.getElementById('section-404') || document.querySelector('.hero-immersive') || document.querySelector('.hero-3d-wrap');
    const curtainsContainer = document.getElementById('hero-curtains-canvas') || document.querySelector('.hero-curtains-container');

    if (!heroSection || !curtainsContainer) {
      return;
    }

    // Empêcher l'initialisation multiple
    if (heroSection.dataset.photosphereInit === 'true') {
      return;
    }
    heroSection.dataset.photosphereInit = 'true';

    // Créer le canvas WebGL dédié pour la photosphère
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-photosphere-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.display = 'block';

    curtainsContainer.innerHTML = '';
    curtainsContainer.appendChild(canvas);

    const glOptions = {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    };

    let gl = canvas.getContext('webgl2', glOptions) ||
             canvas.getContext('webgl', glOptions) ||
             canvas.getContext('experimental-webgl', glOptions);

    if (!gl) {
      console.warn('WebGL non disponible pour la photosphère 360°');
      return;
    }

    // Vertex Shader : quad couvrant tout l'écran
    const vsSource = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Fragment Shader : Projection de sphère 360° équirectangulaire haute fidélité
    const fsSource = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
      #else
        precision mediump float;
      #endif
      varying vec2 vUv;

      uniform sampler2D uPanoTex;
      uniform float uYaw;
      uniform float uPitch;
      uniform float uFov;
      uniform float uAspect;

      const float PI = 3.141592653589793;

      void main() {
        // Rayon optique projeté depuis la caméra dans la sphère 3D
        vec2 screen = (vUv - 0.5) * 2.0;
        float tanFov = tan(uFov * 0.5);
        vec3 ray = normalize(vec3(screen.x * tanFov * uAspect, screen.y * tanFov, 1.0));

        // 1. Rotation Pitch (inclinaison verticale naturelle : haut = ciel, bas = sol)
        float cp = cos(uPitch);
        float sp = sin(uPitch);
        vec3 r1 = vec3(ray.x, ray.y * cp + ray.z * sp, -ray.y * sp + ray.z * cp);

        // 2. Rotation Yaw (azimut / orientation panoramique)
        float cy = cos(uYaw);
        float sy = sin(uYaw);
        vec3 r2 = vec3(r1.x * cy + r1.z * sy, r1.y, -r1.x * sy + r1.z * cy);

        // Conversion cartésienne vers coordonnées UV équirectangulaires sphériques
        float theta = atan(r2.x, r2.z);
        float phi = asin(clamp(r2.y, -0.9999, 0.9999));

        float u = fract((theta / (2.0 * PI)) + 0.5);
        float v = clamp((phi / PI) + 0.5, 0.001, 0.999);

        gl_FragColor = texture2D(uPanoTex, vec2(u, v));
      }
    `;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Géométrie quad 2 triangles
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,   1, -1,  -1,  1,
      -1,  1,   1, -1,   1,  1
    ]), gl.STATIC_DRAW);

    const aPosLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    const uPanoTexLoc = gl.getUniformLocation(program, 'uPanoTex');
    const uYawLoc = gl.getUniformLocation(program, 'uYaw');
    const uPitchLoc = gl.getUniformLocation(program, 'uPitch');
    const uFovLoc = gl.getUniformLocation(program, 'uFov');
    const uAspectLoc = gl.getUniformLocation(program, 'uAspect');

    gl.uniform1i(uPanoTexLoc, 0);

    // Texture panoramique avec filtrage haute qualité
    const panoTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, panoTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Couleur de repli
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 15, 20, 255]));

    let panoLoaded = false;

    function applyTextureImage(imgElement) {
      try {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, panoTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgElement);

        try {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } catch (e) {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        const extAniso = gl.getExtension('EXT_texture_filter_anisotropic') ||
                         gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
                         gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
        if (extAniso) {
          const maxAniso = gl.getParameter(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 4;
          gl.texParameterf(gl.TEXTURE_2D, extAniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(maxAniso, 16));
        }

        panoLoaded = true;
        heroSection.classList.add('has-webgl-3d');
        resize();
      } catch (err) {
        console.warn('Erreur application texture photosphère:', err);
      }
    }

    // Phase 1 : Chargement rapide et léger au premier rendu (2K rapide ~400 Ko)
    const imgFast = new Image();
    imgFast.crossOrigin = 'anonymous';
    imgFast.onload = () => {
      applyTextureImage(imgFast);
    };
    imgFast.onerror = () => {
      loadFullTexture();
    };
    imgFast.src = 'assets/media/tourbiere-photosphere-fast.webp?v=20261008-v5-4k';
    if (imgFast.complete && imgFast.naturalWidth) {
      imgFast.onload();
    }

    // Phase 2 : Décompression totale Ultra-HD 4K (4096x2048 netteté maximale)
    let fullTextureLoaded = false;
    function loadFullTexture() {
      if (fullTextureLoaded) return;
      fullTextureLoaded = true;

      const imgFull = new Image();
      imgFull.crossOrigin = 'anonymous';
      imgFull.onload = () => {
        applyTextureImage(imgFull);
      };
      imgFull.onerror = () => {
        if (imgFull.src.includes('.webp')) {
          imgFull.src = 'assets/media/tourbiere-photosphere-360.jpg?v=20261008-v5-4k';
        }
      };
      imgFull.src = 'assets/media/tourbiere-photosphere-360.webp?v=20261008-v5-4k';
    }

    // Déclenchement fluide dès que le thread est libre (1.2s à 2s)
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        setTimeout(loadFullTexture, 1200);
      }, { timeout: 3000 });
    } else {
      setTimeout(loadFullTexture, 1500);
    }

    // Paramètres optiques et navigation 360° interactive
    const DEG2RAD = Math.PI / 180;
    const TWO_PI = Math.PI * 2;
    let baseYaw = -0.35; // Orientation initiale sur le cœur de la tourbière
    let basePitch = -0.04;
    let baseFov = 75 * DEG2RAD; // FOV équilibré et net

    let currentYaw = baseYaw;
    let currentPitch = basePitch;
    let currentFov = baseFov;

    let targetYaw = baseYaw;
    let targetPitch = basePitch;
    let targetFov = baseFov;

    let isDragging = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let startYaw = baseYaw;
    let startPitch = basePitch;
    let lastUserActionTime = Date.now();
    let isRendering = true;

    function resize() {
      const rect = heroSection.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render() {
      if (!isRendering) {
        requestAnimationFrame(render);
        return;
      }

      const now = Date.now();
      // Reprise douce de l'autotour après 2.5s d'inactivité
      if (!isDragging && !prefersReducedMotion && (now - lastUserActionTime > 2500)) {
        targetYaw += 0.00012;
      }

      // Normalisation du Yaw sur [0, 2PI] pour rotation continue infinie à 360°
      targetPitch = Math.max(-65 * DEG2RAD, Math.min(65 * DEG2RAD, targetPitch));

      // Amortissement cinématique fluide (lerp)
      currentYaw += (targetYaw - currentYaw) * (isDragging ? 0.15 : 0.04);
      currentPitch += (targetPitch - currentPitch) * (isDragging ? 0.15 : 0.04);
      currentFov += (targetFov - currentFov) * 0.08;

      gl.uniform1f(uYawLoc, currentYaw);
      gl.uniform1f(uPitchLoc, currentPitch);
      gl.uniform1f(uFovLoc, currentFov);
      gl.uniform1f(uAspectLoc, canvas.width / canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    }

    // Gestion de l'exploration interactive 360° (Glisser / Drag pour tourner dans toutes les directions)
    function isInteractiveElement(target) {
      if (!target) return false;
      return target.closest('a, button, input, textarea, select, .card, .btn, .interactive, [role="button"]');
    }

    heroSection.style.cursor = 'grab';

    heroSection.addEventListener('pointerdown', (e) => {
      if (isInteractiveElement(e.target)) return;
      isDragging = true;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      startYaw = targetYaw;
      startPitch = targetPitch;
      lastUserActionTime = Date.now();
      heroSection.style.cursor = 'grabbing';
      if (e.target.setPointerCapture) {
        try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
      }
    }, { passive: true });

    window.addEventListener('pointermove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - startPointerX;
        const deltaY = e.clientY - startPointerY;
        const speed = (currentFov / window.innerWidth) * 1.5;
        targetYaw = startYaw - deltaX * speed;
        targetPitch = startPitch + deltaY * speed;
        lastUserActionTime = Date.now();
      }
    }, { passive: true });

    function stopDrag(e) {
      if (isDragging) {
        isDragging = false;
        heroSection.style.cursor = 'grab';
        lastUserActionTime = Date.now();
      }
    }

    window.addEventListener('pointerup', stopDrag, { passive: true });
    window.addEventListener('pointercancel', stopDrag, { passive: true });

    // Zoom molette fluide sur la photosphère
    heroSection.addEventListener('wheel', (e) => {
      if (isInteractiveElement(e.target)) return;
      if (Math.abs(e.deltaY) > 5) {
        targetFov = Math.max(45 * DEG2RAD, Math.min(95 * DEG2RAD, targetFov + Math.sign(e.deltaY) * 0.05));
        lastUserActionTime = Date.now();
      }
    }, { passive: true });

    // Détection de visibilité (IntersectionObserver pour économiser GPU/CPU hors écran)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isRendering = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }

    window.addEventListener('resize', resize, { passive: true });

    resize();
    requestAnimationFrame(render);
  }

  function scheduleInit() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initHeroPhotosphere(), { timeout: 2000 });
    } else {
      setTimeout(initHeroPhotosphere, 150);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
  } else {
    scheduleInit();
  }
})();
