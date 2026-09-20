/**
 * Hero Depth 3D Parallax Effect
 * Powered by Curtains.js (Martin Laxenaire, MIT License)
 * Renders interactive 3D WebGL depth displacement reacting to mouse & device orientation.
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

  window.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.getElementById('accueil');
    const curtainsContainer = document.getElementById('hero-curtains-canvas');
    const planeElement = document.getElementById('hero-curtains-plane');

    if (!heroSection || !curtainsContainer || !planeElement || typeof Curtains === 'undefined') {
      return;
    }

    // Vertex Shader
    const vs = `
      #ifdef GL_ES
      precision mediump float;
      #endif

      attribute vec3 aVertexPosition;
      attribute vec2 aTextureCoord;

      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;

      uniform mat4 uPhotoMatrix;
      uniform mat4 uDepthMatrix;

      varying vec3 vVertexPosition;
      varying vec2 vPhotoCoord;
      varying vec2 vDepthCoord;

      void main() {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vPhotoCoord = (uPhotoMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
        vDepthCoord = (uDepthMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
        vVertexPosition = aVertexPosition;
      }
    `;

    // Fragment Shader with Depth Displacement
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
        // Read depth map (1.0 = near foreground, 0.0 = far sky)
        vec4 depthSample = texture2D(uDepthMap, vDepthCoord);
        float depth = depthSample.r;

        // Subtle ambient natural breathing
        float idleSwayX = sin(uTime * 0.02) * 0.003;
        float idleSwayY = cos(uTime * 0.015) * 0.002;

        // Depth-based displacement (foreground moves more than background)
        vec2 displacement = (uMouse + vec2(idleSwayX, idleSwayY)) * (depth - 0.45) * uMouseStrength;

        // Sample RGB color from displaced coordinates
        vec2 displacedUv = clamp(vPhotoCoord + displacement, 0.0, 1.0);
        vec4 color = texture2D(uPhoto, displacedUv);

        gl_FragColor = color;
      }
    `;

    // Initialize Curtains instance
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

    // Uniform values
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      lerpFactor: 0.07
    };

    const params = {
      vertexShader: vs,
      fragmentShader: fs,
      widthSegments: 16,
      heightSegments: 16,
      uniforms: {
        mouse: {
          name: 'uMouse',
          type: '2f',
          value: [0, 0]
        },
        mouseStrength: {
          name: 'uMouseStrength',
          type: '2f',
          value: [0.035, 0.03]
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

      // Linear interpolation (lerp) for smooth motion
      mouse.currentX += (mouse.targetX - mouse.currentX) * mouse.lerpFactor;
      mouse.currentY += (mouse.targetY - mouse.currentY) * mouse.lerpFactor;

      plane.uniforms.mouse.value = [mouse.currentX, mouse.currentY];
      plane.uniforms.time.value += 1;
    });

    // 1. Desktop Mouse Movement
    function handleMouseMove(e) {
      const rect = heroSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouse.targetX = Math.max(-1, Math.min(1, x));
      mouse.targetY = Math.max(-1, Math.min(1, y));
    }

    heroSection.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousemove', (e) => {
      if (e.clientY < window.innerHeight * 0.9) {
        handleMouseMove(e);
      }
    }, { passive: true });

    heroSection.addEventListener('mouseleave', () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    });

    // 2. Mobile Gyroscope / Device Orientation
    let hasGyro = false;
    function handleOrientation(e) {
      if (e.gamma === null || e.beta === null) return;
      hasGyro = true;

      // Gamma: left to right [-90, 90], Beta: front to back [-180, 180]
      const tiltX = Math.max(-1, Math.min(1, e.gamma / 25));
      const tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 25));

      mouse.targetX = tiltX;
      mouse.targetY = tiltY;
    }

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    // 3. Performance Optimization with IntersectionObserver
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

    // 4. Handle Window Resize
    window.addEventListener('resize', () => {
      curtains.resize();
    }, { passive: true });
  });
})();
