/**
 * Hero Depth 3D Parallax & Spatial Displacement Engine — William Guindon
 * Rendu stéréoscopique natif haute définition en WebGL pur avec carte de profondeur (Depth Map).
 * Image 3D simple (non-sphérique) : netteté native 1:1, zéro pixelisation, relief spatial fluide.
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

    // Créer le canvas WebGL dédié pour le relief 3D stéréoscopique
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

    // Vertex Shader : Quad plein écran
    const vsSource = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Fragment Shader : Parallaxe stéréoscopique par occlusion de relief (Depth Occlusion)
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

      // Échantillonnage adaptatif haute netteté (Contrast Adaptive Sharpening - Zéro Flou)
      vec4 sampleCrisp(sampler2D tex, vec2 uv, vec2 texRes) {
        vec2 step = 1.0 / texRes;
        vec4 c = texture2D(tex, uv);
        vec4 n = texture2D(tex, uv + vec2(0.0, step.y));
        vec4 s = texture2D(tex, uv - vec2(0.0, step.y));
        vec4 e = texture2D(tex, uv + vec2(step.x, 0.0));
        vec4 w = texture2D(tex, uv - vec2(step.x, 0.0));

        vec4 minVal = min(c, min(min(n, s), min(e, w)));
        vec4 maxVal = max(c, max(max(n, s), max(e, w)));

        vec4 sharp = c * 1.55 - (n + s + e + w) * 0.1375;
        return clamp(sharp, minVal, maxVal);
      }

      void main() {
        vec2 coverUv = getCoverUv(vUv, uResolution, uImageResolution);
        coverUv = clamp(coverUv, 0.001, 0.999);

        // Échantillonnage de la carte de profondeur (1.0 = premier plan arbres & mousse, 0.0 = horizon lointain & ciel)
        float depth = texture2D(uDepth, coverUv).r;

        // Plan focal centré : 0.20 (l'horizon reste stable, la tourbière et les arbres avancent en 3D stéréoscopique)
        float depthFactor = depth - 0.20;

        // Déplacement parallaxe physique fluide sans cisaillement
        vec2 parallax = -uMouse * vec2(0.038, 0.024) * depthFactor;
        vec2 finalUv = clamp(coverUv + parallax, 0.001, 0.999);

        // Rendu à la pleine netteté native avec filtre anti-flou
        vec4 color = sampleCrisp(uPhoto, finalUv, uImageResolution);
        gl_FragColor = color;
      }
    `;

    function createShader(glCtx, type, source) {
      const shader = glCtx.createShader(type);
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error('Shader compile error:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad couvrant [-1, 1]
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
      ]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uPhotoLoc = gl.getUniformLocation(program, 'uPhoto');
    const uDepthLoc = gl.getUniformLocation(program, 'uDepth');
    const uMouseLoc = gl.getUniformLocation(program, 'uMouse');
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
    const uImageResolutionLoc = gl.getUniformLocation(program, 'uImageResolution');

    gl.uniform1i(uPhotoLoc, 0);
    gl.uniform1i(uDepthLoc, 1);

    function createTexture(glCtx, unit) {
      const tex = glCtx.createTexture();
      glCtx.activeTexture(glCtx.TEXTURE0 + unit);
      glCtx.bindTexture(glCtx.TEXTURE_2D, tex);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.LINEAR);
      glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, 1, 1, 0, glCtx.RGBA, glCtx.UNSIGNED_BYTE, new Uint8Array([11, 15, 20, 255]));
      return tex;
    }

    const photoTexture = createTexture(gl, 0);
    const depthTexture = createTexture(gl, 1);

    let imgWidth = 4096;
    let imgHeight = 2048;
    let imagesLoaded = 0;

    function uploadImageTexture(img, unit, tex) {
      try {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        try {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          const extAniso = gl.getExtension('EXT_texture_filter_anisotropic') ||
                           gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
                           gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
          if (extAniso) {
            const maxAniso = gl.getParameter(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 4;
            gl.texParameterf(gl.TEXTURE_2D, extAniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(maxAniso, 16));
          }
        } catch (_) {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        imagesLoaded++;
        if (imagesLoaded >= 2) {
          heroSection.classList.add('has-webgl-3d');
          resizeCanvas();
        }
      } catch (err) {
        console.warn('[Hero 3D] Erreur upload texture:', err);
      }
    }

    const CACHE_KEY = 'v=20261009-v12-classic3d';

    const imgPhoto = new Image();
    imgPhoto.crossOrigin = 'anonymous';
    imgPhoto.onload = () => {
      imgWidth = imgPhoto.naturalWidth || 4096;
      imgHeight = imgPhoto.naturalHeight || 2048;
      uploadImageTexture(imgPhoto, 0, photoTexture);
    };
    imgPhoto.onerror = () => {
      if (imgPhoto.src.includes('.webp')) {
        imgPhoto.src = 'assets/media/tourbiere-hero-3d.jpg?' + CACHE_KEY;
      }
    };
    imgPhoto.src = 'assets/media/tourbiere-hero-3d.webp?' + CACHE_KEY;
    if (imgPhoto.complete && imgPhoto.naturalWidth) {
      imgPhoto.onload();
    }

    const imgDepth = new Image();
    imgDepth.crossOrigin = 'anonymous';
    imgDepth.onload = () => {
      uploadImageTexture(imgDepth, 1, depthTexture);
    };
    imgDepth.onerror = () => {
      if (imgDepth.src.includes('.webp')) {
        imgDepth.src = 'assets/media/tourbiere-hero-depth.png?' + CACHE_KEY;
      }
    };
    imgDepth.src = 'assets/media/tourbiere-hero-depth.webp?' + CACHE_KEY;
    if (imgDepth.complete && imgDepth.naturalWidth) {
      imgDepth.onload();
    }

    // Gestion de la souris et du mouvement
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      lerp: 0.065
    };

    let isRendering = true;
    let lastUserAction = Date.now();

    function resizeCanvas() {
      const rect = heroSection.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const displayWidth = Math.max(1, Math.round(rect.width * dpr));
      const displayHeight = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(uImageResolutionLoc, imgWidth, imgHeight);
    }

    function render() {
      if (!isRendering) {
        requestAnimationFrame(render);
        return;
      }

      const now = Date.now();
      // Respiration vivante douce si inactif depuis 2s
      if (now - lastUserAction > 2000) {
        const time = now * 0.0008;
        mouse.targetX = Math.sin(time) * 0.22;
        mouse.targetY = Math.cos(time * 0.7) * 0.14;
      }

      // Amortissement cinématique
      mouse.currentX += (mouse.targetX - mouse.currentX) * mouse.lerp;
      mouse.currentY += (mouse.targetY - mouse.currentY) * mouse.lerp;

      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, photoTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);

      gl.uniform2f(uMouseLoc, mouse.currentX, mouse.currentY);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    }

    function onPointerMove(clientX, clientY) {
      if (!window.innerWidth || !window.innerHeight) return;
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = (clientY / window.innerHeight) * 2 - 1;
      mouse.targetX = Math.max(-1.5, Math.min(1.5, x));
      mouse.targetY = Math.max(-1.5, Math.min(1.5, -y));
      lastUserAction = Date.now();
    }

    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('pointermove', (e) => onPointerMove(e.clientX, e.clientY), { passive: true });

    document.addEventListener('mouseleave', () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
      lastUserAction = Date.now();
    });

    // Gyroscope mobile (DeviceOrientation)
    if (window.DeviceOrientationEvent && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma === null || e.beta === null) return;
        mouse.targetX = Math.max(-1.5, Math.min(1.5, e.gamma / 18));
        mouse.targetY = Math.max(-1.5, Math.min(1.5, (e.beta - 40) / 18));
        lastUserAction = Date.now();
      }, { passive: true });
    }

    // Observateur d'intersection
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isRendering = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }

    window.addEventListener('resize', resizeCanvas, { passive: true });

    resizeCanvas();
    requestAnimationFrame(render);
  }

  function scheduleInit() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initHero3D(), { timeout: 2000 });
    } else {
      setTimeout(initHero3D, 150);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
  } else {
    scheduleInit();
  }
})();
