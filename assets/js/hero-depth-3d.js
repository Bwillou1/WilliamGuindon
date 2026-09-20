/**
 * Hero Depth 3D Parallax & Spatial Displacement Engine
 * Powered by Curtains.js (Martin Laxenaire, MIT License)
 * Renders high-fidelity 3D stereoscopic depth displacement reacting to mouse & device gyro.
 */
(() => {
  'use strict';

  // Respect user preference for reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Check WebGL availability
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (_) {
      return false;
    }
  }

  if (!isWebGLAvailable()) {
    return;
  }

  function initHero3D() {
    const heroSection = document.getElementById('accueil');
    const curtainsContainer = document.getElementById('hero-curtains-canvas');
    const planeElement = document.getElementById('hero-curtains-plane');

    if (!heroSection || !curtainsContainer || !planeElement || typeof Curtains === 'undefined') {
      return;
    }

    // Vertex Shader with 3D mesh perspective
    const vs = `
      #ifdef GL_ES
      precision mediump float;
      #endif

      attribute vec3 aVertexPosition;
      attribute vec2 aTextureCoord;

      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;

      uniform mat4 uPhotoMatrix;
      uniform mat4 uDepthMapMatrix;

      uniform vec2 uMouse;

      varying vec3 vVertexPosition;
      varying vec2 vPhotoCoord;
      varying vec2 vDepthCoord;

      void main() {
        vec3 pos = aVertexPosition;
        
        // Subtle 3D spatial curve across vertex grid
        gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
        vPhotoCoord = (uPhotoMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
        vDepthCoord = (uDepthMapMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
        vVertexPosition = pos;
      }
    `;

    // Fragment Shader: Multi-layer 3D Parallax Displacement & Luminance Glow
    const fs = `
      #ifdef GL_ES
      precision mediump float;
      #endif

      varying vec3 vVertexPosition;
      varying vec2 vPhotoCoord;
      varying vec2 vDepthCoord;

      uniform sampler2D uPhoto;
      uniform sampler2D uDepthMap;

      uniform vec2 uMouse;
      uniform vec2 uMouseStrength;
      uniform float uTime;

      void main() {
        vec2 uv = vPhotoCoord;
        vec2 depthUv = vDepthCoord;

        // Sample depth map (1.0 = near foreground trees, 0.0 = distant sunrise sky)
        float depth = texture2D(uDepthMap, depthUv).r;

        // Ambient natural atmospheric drift (breathing mist effect)
        float driftX = sin(uTime * 0.025) * 0.004;
        float driftY = cos(uTime * 0.018) * 0.003;

        // Dynamic 3D parallax vector with focal plane centered around midground (0.35)
        vec2 focalOffset = (uMouse + vec2(driftX, driftY));
        vec2 displacement = focalOffset * (depth - 0.35) * uMouseStrength;

        // Multi-sample smooth parallax to eliminate hard edge artifacts
        vec2 sampleUv1 = clamp(uv + displacement, 0.0, 1.0);
        vec2 sampleUv2 = clamp(uv + displacement * 0.7, 0.0, 1.0);

        vec4 color1 = texture2D(uPhoto, sampleUv1);
        vec4 color2 = texture2D(uPhoto, sampleUv2);
        vec4 color = mix(color1, color2, 0.2);

        // Enhance radiant sunrise illumination and morning warmth
        color.rgb = pow(color.rgb, vec3(0.95)); // Soft gamma lift for bright natural light
        color.rgb += vec3(0.04, 0.03, 0.01) * (1.0 - depth); // Warm sunbeam haze on background

        gl_FragColor = color;
      }
    `;

    // Initialize Curtains WebGL instance
    const curtains = new Curtains({
      container: 'hero-curtains-canvas',
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      autoRender: true,
      production: true
    });

    curtains.onError(() => {
      heroSection.classList.remove('has-webgl-3d');
    });

    curtains.onContextLost(() => {
      curtains.restoreContext();
    });

    // Mouse coordinates tracking with smooth spring damping
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      lerpFactor: 0.08
    };

    const params = {
      vertexShader: vs,
      fragmentShader: fs,
      widthSegments: 32,
      heightSegments: 32,
      uniforms: {
        mouse: {
          name: 'uMouse',
          type: '2f',
          value: [0, 0]
        },
        mouseStrength: {
          name: 'uMouseStrength',
          type: '2f',
          value: [0.08, 0.06] // Pronounced, striking 3D parallax
        },
        time: {
          name: 'uTime',
          type: '1f',
          value: 0
        }
      },
      texturesOptions: {
        minFilter: curtains.gl.LINEAR,
        magFilter: curtains.gl.LINEAR
      }
    };

    const plane = curtains.addPlane(planeElement, params);

    if (!plane) return;

    let isVisible = true;

    plane.onReady(() => {
      heroSection.classList.add('has-webgl-3d');
      curtains.resize();
    }).onRender(() => {
      if (!isVisible) return;

      // Smooth interpolation for fluid cinematic 60fps tracking
      mouse.currentX += (mouse.targetX - mouse.currentX) * mouse.lerpFactor;
      mouse.currentY += (mouse.targetY - mouse.currentY) * mouse.lerpFactor;

      plane.uniforms.mouse.value = [mouse.currentX, mouse.currentY];
      plane.uniforms.time.value += 1;

      // 3D Plane rotational tilt in WebGL space
      if (plane.rotation) {
        plane.setRotation(new Curtains.Vec3(-mouse.currentY * 0.04, mouse.currentX * 0.05, 0));
      }
    });

    // 1. Mouse movement tracking across desktop screen
    function handlePointerMove(clientX, clientY) {
      const rect = heroSection.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((clientY - rect.top) / rect.height) * 2 - 1;
      mouse.targetX = Math.max(-1.2, Math.min(1.2, x));
      mouse.targetY = Math.max(-1.2, Math.min(1.2, y));
    }

    window.addEventListener('mousemove', (e) => {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    heroSection.addEventListener('mouseleave', () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    });

    // 2. Mobile Gyroscope / Device Orientation
    function handleOrientation(e) {
      if (e.gamma === null || e.beta === null) return;
      const tiltX = Math.max(-1.5, Math.min(1.5, e.gamma / 20));
      const tiltY = Math.max(-1.5, Math.min(1.5, (e.beta - 40) / 20));
      mouse.targetX = tiltX;
      mouse.targetY = tiltY;
    }

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    // 3. Performance: Pause WebGL when hero is out of view
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            curtains.play();
          } else {
            curtains.stop();
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }

    // 4. Responsive window resize
    window.addEventListener('resize', () => {
      curtains.resize();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHero3D);
  } else {
    initHero3D();
  }
})();
