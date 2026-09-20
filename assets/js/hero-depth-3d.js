/**
 * Hero Depth 3D Parallax & Spatial Displacement Engine
 * Inspired by Martin Laxenaire's Curtains.js shaders (MIT License)
 * Renders high-fidelity 3D stereoscopic depth displacement reacting to mouse & device gyro.
 */
(() => {
  'use strict';

  // Respect user preference for reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  function initHero3D() {
    const heroSection = document.getElementById('accueil');
    const curtainsContainer = document.getElementById('hero-curtains-canvas');

    if (!heroSection || !curtainsContainer) {
      return;
    }

    // Prevent double initialization
    if (heroSection.dataset.webgl3dInit === 'true') {
      return;
    }
    heroSection.dataset.webgl3dInit = 'true';

    // Create dedicated WebGL canvas
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
      preserveDrawingBuffer: false
    };

    let gl = canvas.getContext('webgl2', glOptions) ||
             canvas.getContext('webgl', glOptions) ||
             canvas.getContext('experimental-webgl', glOptions);

    if (!gl) {
      console.warn('WebGL not supported on this device/browser');
      return;
    }

    // Vertex Shader: Fullscreen quad
    const vsSource = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Fragment Shader: High-impact 3D Stereoscopic Parallax Displacement
    const fsSource = `
      precision mediump float;

      varying vec2 vUv;

      uniform sampler2D uPhoto;
      uniform sampler2D uDepth;

      uniform vec2 uMouse;
      uniform vec2 uResolution;
      uniform vec2 uImageResolution;
      uniform float uTime;

      // CSS cover aspect ratio fit (preserves natural proportions without stretching)
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

        // Sample depth map (1.0 = near trees & foreground, 0.0 = distant sunrise sky)
        float depth = texture2D(uDepth, coverUv).r;

        // Subtle ambient atmospheric drift (gentle peatland morning mist)
        float driftX = sin(uTime * 0.02) * 0.005;
        float driftY = cos(uTime * 0.015) * 0.003;

        // Pronounced 3D parallax vector with focal plane centered on horizon (depth 0.28)
        vec2 mouseVector = (uMouse + vec2(driftX, driftY)) * vec2(0.09, 0.06);
        vec2 displacement = -mouseVector * (depth - 0.28);

        // 3-tap smooth depth interpolation for anti-aliased stereoscopic edges
        vec2 uv1 = clamp(coverUv + displacement, 0.001, 0.999);
        vec2 uv2 = clamp(coverUv + displacement * 0.75, 0.001, 0.999);
        vec2 uv3 = clamp(coverUv + displacement * 1.25, 0.001, 0.999);

        vec4 col1 = texture2D(uPhoto, uv1);
        vec4 col2 = texture2D(uPhoto, uv2);
        vec4 col3 = texture2D(uPhoto, uv3);
        vec4 color = mix(col1, (col2 + col3) * 0.5, 0.35);

        // Radiant sunlight & vibrant natural hues
        color.rgb = pow(color.rgb, vec3(0.92));
        color.rgb += vec3(0.05, 0.035, 0.01) * (1.0 - depth);

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

    // Quad geometry covering [-1, 1]
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

    // Shader Uniform Locations
    const uPhotoLoc = gl.getUniformLocation(program, 'uPhoto');
    const uDepthLoc = gl.getUniformLocation(program, 'uDepth');
    const uMouseLoc = gl.getUniformLocation(program, 'uMouse');
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
    const uImageResolutionLoc = gl.getUniformLocation(program, 'uImageResolution');
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');

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
      return tex;
    }

    const photoTexture = createTexture(gl, 0);
    const depthTexture = createTexture(gl, 1);

    let imgWidth = 1920;
    let imgHeight = 1080;
    let imagesLoaded = 0;

    function uploadImageTexture(img, unit, tex) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      imagesLoaded++;

      if (imagesLoaded >= 2) {
        heroSection.classList.add('has-webgl-3d');
        resizeCanvas();
      }
    }

    const imgPhoto = new Image();
    imgPhoto.crossOrigin = 'anonymous';
    imgPhoto.onload = () => {
      imgWidth = imgPhoto.naturalWidth || 1920;
      imgHeight = imgPhoto.naturalHeight || 1080;
      uploadImageTexture(imgPhoto, 0, photoTexture);
    };
    imgPhoto.src = 'assets/media/tourbiere-hero-3d.webp';

    const imgDepth = new Image();
    imgDepth.crossOrigin = 'anonymous';
    imgDepth.onload = () => {
      uploadImageTexture(imgDepth, 1, depthTexture);
    };
    imgDepth.src = 'assets/media/tourbiere-hero-depth.webp';

    // Physics mouse tracking
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      lerp: 0.085
    };

    let time = 0;
    let isRendering = true;

    function resizeCanvas() {
      const rect = heroSection.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.max(1, Math.round(rect.width * dpr));
      const displayHeight = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(uImageResolutionLoc, imgWidth, imgHeight);
    }

    function render() {
      if (!isRendering) {
        requestAnimationFrame(render);
        return;
      }

      // Smooth damping interpolation
      mouse.currentX += (mouse.targetX - mouse.currentX) * mouse.lerp;
      mouse.currentY += (mouse.targetY - mouse.currentY) * mouse.lerp;

      time += 1;

      gl.uniform2f(uMouseLoc, mouse.currentX, mouse.currentY);
      gl.uniform1f(uTimeLoc, time);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    }

    // Pointer events across screen
    function onPointerMove(clientX, clientY) {
      const rect = heroSection.getBoundingClientRect();
      const x = ((clientX - rect.left) / (rect.width || window.innerWidth)) * 2 - 1;
      const y = ((clientY - rect.top) / (rect.height || window.innerHeight)) * 2 - 1;
      mouse.targetX = Math.max(-1.4, Math.min(1.4, x));
      mouse.targetY = Math.max(-1.4, Math.min(1.4, -y)); // Invert Y for WebGL UV orientation
    }

    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('pointermove', (e) => onPointerMove(e.clientX, e.clientY), { passive: true });

    document.addEventListener('mouseleave', () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    });

    // Mobile Gyroscope / Tilt
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma === null || e.beta === null) return;
        mouse.targetX = Math.max(-1.5, Math.min(1.5, e.gamma / 18));
        mouse.targetY = Math.max(-1.5, Math.min(1.5, (e.beta - 40) / 18));
      }, { passive: true });
    }

    // Viewport IntersectionObserver
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHero3D);
  } else {
    initHero3D();
  }
})();

