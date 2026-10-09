/**
 * Hero Photosphère 360° & Spatial 3D Engine — William Guindon
 * Moteur WebGL 2 immersif 360° ultra-haute fidélité (façon Google Street View).
 * Échantillonnage forcé à pleine résolution LOD 0 + Contrast Adaptive Sharpening (CAS).
 * Zéro pixelisation, rotation complète à 360° (souris, tactile, gyroscope, molette, inertie).
 */
(() => {
  'use strict';

  // Respecter la préférence de réduction de mouvement
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initHeroPhotosphere() {
    const heroSection = document.getElementById('accueil') || document.getElementById('section-404') || document.querySelector('.hero-immersive') || document.querySelector('.hero-3d-wrap');
    const curtainsContainer = document.getElementById('hero-curtains-canvas') || document.querySelector('.hero-curtains-container');

    if (!heroSection || !curtainsContainer) {
      return;
    }

    // Empêcher l'initialisation multiple
    if (heroSection.dataset.photosphere3dInit === 'true') {
      return;
    }
    heroSection.dataset.photosphere3dInit = 'true';

    // Créer le canvas WebGL dédié pour la photosphère 360°
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
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    };

    const isWebGL2 = !!window.WebGL2RenderingContext;
    let gl = isWebGL2 ? canvas.getContext('webgl2', glOptions) : null;
    const isUsingWebGL2 = !!gl;
    if (!gl) {
      gl = canvas.getContext('webgl', glOptions) || canvas.getContext('experimental-webgl', glOptions);
    }

    if (!gl) {
      console.warn('[Hero 360°] WebGL non supporté sur cet appareil.');
      return;
    }

    // Vertex Shader : Quad plein écran (1 seul draw call)
    const vsSource = isUsingWebGL2 ? `#version 300 es
      in vec2 aPosition;
      out vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    ` : `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Fragment Shader : Raytracer sphérique 360° équirectangulaire avec échantillonnage forcé LOD 0 & CAS
    const fsSource = isUsingWebGL2 ? `#version 300 es
      precision highp float;
      in vec2 vUv;
      out vec4 fragColor;

      uniform sampler2D uPanoTex;
      uniform float uYaw;
      uniform float uPitch;
      uniform float uFov;
      uniform float uAspect;
      uniform vec2 uTexRes;

      const float PI = 3.141592653589793;
      const float TWO_PI = 6.283185307179586;

      // Échantillonnage ultra-net à LOD 0 avec filtre anti-flou adaptatif (CAS)
      vec4 sampleLOD0Sharpened(sampler2D tex, vec2 uv, vec2 res) {
        vec2 step = 1.0 / res;
        vec4 c = textureLod(tex, uv, 0.0);
        vec4 n = textureLod(tex, uv + vec2(0.0, step.y), 0.0);
        vec4 s = textureLod(tex, uv - vec2(0.0, step.y), 0.0);
        vec4 e = textureLod(tex, uv + vec2(step.x, 0.0), 0.0);
        vec4 w = textureLod(tex, uv - vec2(step.x, 0.0), 0.0);

        vec4 minC = min(c, min(min(n, s), min(e, w)));
        vec4 maxC = max(c, max(max(n, s), max(e, w)));

        vec4 sharp = c * 1.55 - (n + s + e + w) * 0.1375;
        return clamp(sharp, minC, maxC);
      }

      void main() {
        vec2 screen = (vUv - 0.5) * 2.0;
        float tanFov = tan(uFov * 0.5);
        vec3 d = normalize(vec3(screen.x * tanFov * uAspect, screen.y * tanFov, 1.0));

        // 1. Rotation Pitch (inclinaison verticale axe X : haut = ciel, bas = sol)
        float cp = cos(uPitch);
        float sp = sin(uPitch);
        vec3 r1 = vec3(d.x, d.y * cp + d.z * sp, -d.y * sp + d.z * cp);

        // 2. Rotation Yaw (azimut panoramique axe Y)
        float cy = cos(uYaw);
        float sy = sin(uYaw);
        vec3 r2 = vec3(r1.x * cy + r1.z * sy, r1.y, -r1.x * sy + r1.z * cy);

        // Coordonnées équirectangulaires 360° standard :
        // u = 0.5 + atan(d.x, -d.z) / 2π
        // v = 0.5 + asin(clamp(d.y, -1, 1)) / π
        float u = 0.5 + atan(r2.x, -r2.z) / TWO_PI;
        float v = 0.5 + asin(clamp(r2.y, -0.9999, 0.9999)) / PI;

        fragColor = sampleLOD0Sharpened(uPanoTex, vec2(u, v), uTexRes);
      }
    ` : `
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
      uniform vec2 uTexRes;

      const float PI = 3.141592653589793;
      const float TWO_PI = 6.283185307179586;

      vec4 sampleSharpened(sampler2D tex, vec2 uv, vec2 res) {
        vec2 step = 1.0 / res;
        vec4 c = texture2D(tex, uv);
        vec4 n = texture2D(tex, uv + vec2(0.0, step.y));
        vec4 s = texture2D(tex, uv - vec2(0.0, step.y));
        vec4 e = texture2D(tex, uv + vec2(step.x, 0.0));
        vec4 w = texture2D(tex, uv - vec2(step.x, 0.0));

        vec4 minC = min(c, min(min(n, s), min(e, w)));
        vec4 maxC = max(c, max(max(n, s), max(e, w)));

        vec4 sharp = c * 1.55 - (n + s + e + w) * 0.1375;
        return clamp(sharp, minC, maxC);
      }

      void main() {
        vec2 screen = (vUv - 0.5) * 2.0;
        float tanFov = tan(uFov * 0.5);
        vec3 d = normalize(vec3(screen.x * tanFov * uAspect, screen.y * tanFov, 1.0));

        float cp = cos(uPitch);
        float sp = sin(uPitch);
        vec3 r1 = vec3(d.x, d.y * cp + d.z * sp, -d.y * sp + d.z * cp);

        float cy = cos(uYaw);
        float sy = sin(uYaw);
        vec3 r2 = vec3(r1.x * cy + r1.z * sy, r1.y, -r1.x * sy + r1.z * cy);

        float u = 0.5 + atan(r2.x, -r2.z) / TWO_PI;
        float v = 0.5 + asin(clamp(r2.y, -0.9999, 0.9999)) / PI;

        gl_FragColor = sampleSharpened(uPanoTex, vec2(u, v), uTexRes);
      }
    `;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[Shader 360° error]', gl.getShaderInfoLog(s));
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
      console.error('[Program 360° error]', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad plein écran
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
    const uTexResLoc = gl.getUniformLocation(program, 'uTexRes');

    gl.uniform1i(uPanoTexLoc, 0);
    gl.uniform2f(uTexResLoc, 4096, 2048);

    // Texture 360° avec couture invisible et filtrage haute fidélité
    const panoTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, panoTex);

    if (isUsingWebGL2) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 15, 20, 255]));

    let panoLoaded = false;
    let panoWidth = 4096;
    let panoHeight = 2048;

    function uploadTexture(imgElement) {
      try {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, panoTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
        let uploadSource = imgElement;
        const nw = imgElement.naturalWidth || imgElement.width;
        const nh = imgElement.naturalHeight || imgElement.height;

        panoWidth = nw;
        panoHeight = nh;

        // Protection MAX_TEXTURE_SIZE pour mobile
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
          panoWidth = targetW;
          panoHeight = targetH;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, uploadSource);

        // Mipmapping propre & filtrage anisotrope 16x
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

        gl.uniform2f(uTexResLoc, panoWidth, panoHeight);

        panoLoaded = true;
        heroSection.classList.add('has-webgl-3d');
        resize();
      } catch (err) {
        console.warn('[Hero 360°] Erreur application texture:', err);
      }
    }

    const CACHE_KEY = 'v=20261009-v11-sharp-360';

    // 1. Prévisualisation rapide 2K (pour premier affichage sans attente)
    const fastImg = new Image();
    fastImg.crossOrigin = 'anonymous';
    fastImg.onload = () => {
      if (!panoLoaded) {
        uploadTexture(fastImg);
      }
    };
    fastImg.src = 'assets/media/tourbiere-photosphere-fast.webp?' + CACHE_KEY;

    // 2. Décompression 4K Ultra-HD native
    const fullImg = new Image();
    fullImg.crossOrigin = 'anonymous';
    fullImg.onload = () => {
      uploadTexture(fullImg);
    };
    fullImg.onerror = () => {
      if (fullImg.src.includes('.webp')) {
        fullImg.src = 'assets/media/tourbiere-photosphere-360.jpg?' + CACHE_KEY;
      }
    };
    fullImg.src = 'assets/media/tourbiere-photosphere-360.webp?' + CACHE_KEY;

    // Paramètres caméra 360°
    const DEG2RAD = Math.PI / 180;
    const MIN_FOV = 35 * DEG2RAD;
    const MAX_FOV = 95 * DEG2RAD;
    const DEFAULT_FOV = 75 * DEG2RAD;
    const MAX_PITCH = 85 * DEG2RAD;

    let yaw = 0;
    let pitch = 0;
    let fov = DEFAULT_FOV;

    let targetYaw = 0;
    let targetPitch = 0;
    let targetFov = DEFAULT_FOV;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragStartYaw = 0;
    let dragStartPitch = 0;
    let lastActionTime = Date.now();
    let isRendering = true;

    function resize() {
      const rect = heroSection.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3.0);
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
      // Rotation automatique douce (autotour) après 2.5s d'inactivité
      if (!isDragging && !prefersReducedMotion && (now - lastActionTime > 2500)) {
        targetYaw += 0.0006;
      }

      // Amortissement cinématique fluide (lerp)
      yaw += (targetYaw - yaw) * (isDragging ? 0.18 : 0.06);
      pitch += (targetPitch - pitch) * (isDragging ? 0.18 : 0.06);
      fov += (targetFov - fov) * 0.12;

      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, panoTex);

      gl.uniform1f(uYawLoc, yaw);
      gl.uniform1f(uPitchLoc, pitch);
      gl.uniform1f(uFovLoc, fov);
      gl.uniform1f(uAspectLoc, canvas.width / canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    }

    // Gestion des interactions 360° sur tout l'en-tête
    function isInteractiveElement(target) {
      if (!target) return false;
      return target.closest('a, button, input, textarea, select, .card, .btn, .interactive, [role="button"]');
    }

    heroSection.style.cursor = 'grab';

    heroSection.addEventListener('pointerdown', (e) => {
      if (isInteractiveElement(e.target)) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      dragStartYaw = targetYaw;
      dragStartPitch = targetPitch;
      lastActionTime = Date.now();
      heroSection.style.cursor = 'grabbing';
      if (e.target.setPointerCapture) {
        try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Sensibilité naturelle : le paysage suit exactement le curseur
      const k = fov / Math.max(1, heroSection.clientHeight);
      targetYaw = dragStartYaw - dx * k;
      targetPitch = dragStartPitch + dy * k;
      targetPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, targetPitch));

      lastActionTime = Date.now();
    });

    function stopDrag(e) {
      if (isDragging) {
        isDragging = false;
        heroSection.style.cursor = 'grab';
        lastActionTime = Date.now();
      }
    }

    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    // Zoom molette exponentiel et fluide
    heroSection.addEventListener('wheel', (e) => {
      if (isInteractiveElement(e.target)) return;
      e.preventDefault();
      targetFov *= Math.exp(e.deltaY * 0.001);
      targetFov = Math.max(MIN_FOV, Math.min(MAX_FOV, targetFov));
      lastActionTime = Date.now();
    }, { passive: false });

    // Double clic : recentrage / bascule zoom 75° ↔ 45°
    heroSection.addEventListener('dblclick', (e) => {
      if (isInteractiveElement(e.target)) return;
      e.preventDefault();
      targetFov = (targetFov < 60 * DEG2RAD) ? DEFAULT_FOV : 45 * DEG2RAD;
      lastActionTime = Date.now();
    });

    // Gyroscope mobile (réalité virtuelle sans casque)
    if (window.DeviceOrientationEvent && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma === null || e.beta === null || isDragging) return;
        const pitchRad = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, ((e.beta - 45) * DEG2RAD)));
        targetPitch = pitchRad;
        lastActionTime = Date.now();
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

    window.addEventListener('resize', resize, { passive: true });
    resize();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroPhotosphere);
  } else {
    initHeroPhotosphere();
  }
})();
