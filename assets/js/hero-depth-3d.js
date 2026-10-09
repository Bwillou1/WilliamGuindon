/**
 * Hero Depth 3D Parallax & Spatial Displacement Engine
 * Rendu stéréoscopique natif haute définition en WebGL pur avec carte de profondeur (Depth Map).
 * Zéro pixelisation : l'image est rendue à la résolution native exacte de l'écran avec couverture parfaite.
 */
(() => {
  'use strict';

  // Respecter la préférence de réduction de mouvement
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  function initHero3D() {
    const heroSection = document.getElementById('accueil') || document.getElementById('section-404') || document.querySelector('.hero-immersive') || document.querySelector('.hero-3d-wrap');
    const curtainsContainer = document.getElementById('hero-curtains-canvas') || document.querySelector('.hero-curtains-container');

    if (!heroSection || !curtainsContainer) {
      return;
    }

    // Empêcher l'initialisation multiple
    if (heroSection.dataset.webgl3dInit === 'true') {
      return;
    }
    heroSection.dataset.webgl3dInit = 'true';

    // Créer le canvas WebGL dédié pour le relief spatial 3D
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-webgl-3d-canvas';
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
      console.warn('[Hero 3D] WebGL non supporté sur cet appareil.');
      return;
    }

    // Shaders
    const vsSource = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fsSource = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
      #else
        precision mediump float;
      #endif

      varying vec2 vUv;

      uniform sampler2D uPhoto;
      uniform sampler2D uDepth;

      uniform vec2 uMouse;
      uniform vec2 uResolution;
      uniform vec2 uImageResolution;

      // Ajustement de ratio en mode 'cover' préservant 100% de la netteté et des proportions
      vec2 getCoverUv(vec2 uv, vec2 screenRes, vec2 imgRes) {
        float screenAspect = screenRes.x / screenRes.y;
        float imgAspect = imgRes.x / imgRes.y;
        vec2 newUv = uv;
        if (screenAspect > imgAspect) {
          float scale = imgAspect / screenAspect;
          newUv.y = (uv.y - 0.5) * scale + 0.5;
        } else {
          float scale = screenAspect / imgAspect;
          newUv.x = (uv.x - 0.5) * scale + 0.5;
        }
        return newUv;
      }

      void main() {
        vec2 coverUv = getCoverUv(vUv, uResolution, uImageResolution);
        coverUv = clamp(coverUv, 0.001, 0.999);

        // Échantillonnage de la carte de profondeur stéréoscopique
        float depth = texture2D(uDepth, coverUv).r;

        // Plan focal centré : 0.22 (horizon stable, arbres et mousse au premier plan avec relief saisissant)
        float depthFactor = depth - 0.22;

        // Déplacement parallaxe stéréoscopique fluide sans déformation
        vec2 parallax = -uMouse * vec2(0.040, 0.025) * depthFactor;
        vec2 finalUv = clamp(coverUv + parallax, 0.001, 0.999);

        // Échantillonnage à la pleine résolution native 4K
        vec4 color = texture2D(uPhoto, finalUv);
        gl_FragColor = color;
      }
    `;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[Shader 3D error]', gl.getShaderInfoLog(s));
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
      console.error('[Program 3D error]', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Géométrie plein écran
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,   1, -1,  -1,  1,
      -1,  1,   1, -1,   1,  1
    ]), gl.STATIC_DRAW);

    const aPosLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    const uPhotoLoc = gl.getUniformLocation(program, 'uPhoto');
    const uDepthLoc = gl.getUniformLocation(program, 'uDepth');
    const uMouseLoc = gl.getUniformLocation(program, 'uMouse');
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
    const uImageResolutionLoc = gl.getUniformLocation(program, 'uImageResolution');

    gl.uniform1i(uPhotoLoc, 0);
    gl.uniform1i(uDepthLoc, 1);

    function createTexture() {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 15, 20, 255]));
      return tex;
    }

    const photoTex = createTexture();
    const depthTex = createTexture();

    let photoLoaded = false;
    let depthLoaded = false;
    let imageWidth = 4096;
    let imageHeight = 2048;

    function uploadTexture(texUnit, texObj, imgElement) {
      try {
        gl.activeTexture(texUnit);
        gl.bindTexture(gl.TEXTURE_2D, texObj);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
        let uploadSource = imgElement;
        const nw = imgElement.naturalWidth || imgElement.width;
        const nh = imgElement.naturalHeight || imgElement.height;

        if (nw > maxTexSize || nh > maxTexSize) {
          const scale = maxTexSize / Math.max(nw, nh);
          const targetW = Math.floor(nw * scale);
          const targetH = Math.floor(nh * scale);
          const canvasRescale = document.createElement('canvas');
          canvasRescale.width = targetW;
          canvasRescale.height = targetH;
          const ctx = canvasRescale.getContext('2d');
          ctx.drawImage(imgElement, 0, 0, targetW, targetH);
          uploadSource = canvasRescale;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, uploadSource);

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

        if (photoLoaded && depthLoaded) {
          heroSection.classList.add('has-webgl-3d');
          resize();
        }
      } catch (err) {
        console.warn('[Hero 3D] Erreur upload texture:', err);
      }
    }

    const CACHE_KEY = 'v=20261008-v8-sharp4k';

    // 1. Photo HD
    const photoImg = new Image();
    photoImg.crossOrigin = 'anonymous';
    photoImg.onload = () => {
      imageWidth = photoImg.naturalWidth || 4096;
      imageHeight = photoImg.naturalHeight || 2048;
      photoLoaded = true;
      uploadTexture(gl.TEXTURE0, photoTex, photoImg);
    };
    photoImg.onerror = () => {
      if (photoImg.src.includes('.webp')) {
        photoImg.src = 'assets/media/tourbiere-hero-3d.jpg?' + CACHE_KEY;
      }
    };
    photoImg.src = 'assets/media/tourbiere-hero-3d.webp?' + CACHE_KEY;

    // 2. Depth Map
    const depthImg = new Image();
    depthImg.crossOrigin = 'anonymous';
    depthImg.onload = () => {
      depthLoaded = true;
      uploadTexture(gl.TEXTURE1, depthTex, depthImg);
    };
    depthImg.onerror = () => {
      if (depthImg.src.includes('.webp')) {
        depthImg.src = 'assets/media/tourbiere-hero-depth.png?' + CACHE_KEY;
      }
    };
    depthImg.src = 'assets/media/tourbiere-hero-depth.webp?' + CACHE_KEY;

    // Variables de mouvement & interactions
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastActionTime = Date.now();
    let isRendering = true;

    function resize() {
      const rect = heroSection.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
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
      // Respiration vivante douce si inactif
      if (!isDragging && (now - lastActionTime > 2000)) {
        const time = now * 0.0008;
        targetMouseX = Math.sin(time) * 0.25;
        targetMouseY = Math.cos(time * 0.7) * 0.15;
      }

      // Amortissement cinématique (lerp)
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      gl.useProgram(program);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, photoTex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, depthTex);

      gl.uniform2f(uMouseLoc, mouseX, mouseY);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(uImageResolutionLoc, imageWidth, imageHeight);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    }

    // Gestion de la souris / curseur sur tout l'en-tête
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouseX = Math.max(-1, Math.min(1, x));
      targetMouseY = Math.max(-1, Math.min(1, y));
      lastActionTime = Date.now();
    }, { passive: true });

    heroSection.addEventListener('mouseleave', () => {
      targetMouseX = 0;
      targetMouseY = 0;
      lastActionTime = Date.now();
    }, { passive: true });

    // Gyroscope mobile (DeviceOrientation)
    if (window.DeviceOrientationEvent && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma === null || e.beta === null) return;
        const x = Math.max(-1, Math.min(1, e.gamma / 30));
        const y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
        targetMouseX = x;
        targetMouseY = y;
        lastActionTime = Date.now();
      }, { passive: true });
    }

    // Glisser / Toucher sur l'en-tête
    function isInteractiveElement(target) {
      if (!target) return false;
      return target.closest('a, button, input, textarea, select, .card, .btn, .interactive, [role="button"]');
    }

    heroSection.addEventListener('pointerdown', (e) => {
      if (isInteractiveElement(e.target)) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      dragStartX = targetMouseX;
      dragStartY = targetMouseY;
      lastActionTime = Date.now();
    }, { passive: true });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - startX) / (window.innerWidth * 0.5);
      const dy = (e.clientY - startY) / (window.innerHeight * 0.5);
      targetMouseX = Math.max(-1.5, Math.min(1.5, dragStartX + dx));
      targetMouseY = Math.max(-1.5, Math.min(1.5, dragStartY - dy));
      lastActionTime = Date.now();
    }, { passive: true });

    function stopDrag() {
      if (isDragging) {
        isDragging = false;
        lastActionTime = Date.now();
      }
    }

    window.addEventListener('pointerup', stopDrag, { passive: true });
    window.addEventListener('pointercancel', stopDrag, { passive: true });

    // Observateur d'intersection (économiser GPU hors écran)
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
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHero3D);
  } else {
    initHero3D();
  }
})();
