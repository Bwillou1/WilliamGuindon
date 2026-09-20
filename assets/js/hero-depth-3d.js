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

  let initialized = false;

  function initHero3D() {
    if (initialized) return;

    const heroSection = document.getElementById('accueil');
    const curtainsContainer = document.getElementById('hero-curtains-canvas');
    const planeElement = document.getElementById('hero-curtains-plane');

    const CurtainsConstructor = window.Curtains || (window.curtains && window.curtains.Curtains);
    const Vec3Constructor = (window.Curtains && window.Curtains.Vec3) || (window.curtains && window.curtains.Vec3);

    if (!heroSection || !curtainsContainer || !planeElement || !CurtainsConstructor) {
      return;
    }

    initialized = true;

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

      varying vec3 vVertexPosition;
      varying vec2 vPhotoCoord;
      varying vec2 vDepthCoord;

      void main() {
        vec3 pos = aVertexPosition;
        gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
        vPhotoCoord = (uPhotoMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
        vDepthCoord = (uDepthMapMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
        vVertexPosition = pos;
      }
    `;

    // Fragment Shader: Striking 3D Parallax Displacement + Luminous Morning Radiance
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
        vec2 depthUv = clamp(vDepthCoord, 0.0, 1.0);
        float depth = texture2D(uDepthMap, depthUv).r;

        // Ambient natural atmospheric drift (breathing mist over the peatland)
        float driftX = sin(uTime * 0.02) * 0.006;
        float driftY = cos(uTime * 0.015) * 0.004;

        // Bold 3D parallax vector with focal plane centered at midground horizon (0.30)
        vec2 totalOffset = (uMouse + vec2(driftX, driftY)) * uMouseStrength;
        vec2 displacement = totalOffset * (depth - 0.30);

        // 3-tap smooth depth interpolation to avoid pixelation on silhouette edges
        vec2 uv1 = clamp(vPhotoCoord + displacement, 0.0, 1.0);
        vec2 uv2 = clamp(vPhotoCoord + displacement * 0.82, 0.0, 1.0);
        vec2 uv3 = clamp(vPhotoCoord + displacement * 1.18, 0.0, 1.0);

        vec4 color1 = texture2D(uPhoto, uv1);
        vec4 color2 = texture2D(uPhoto, uv2);
        vec4 color3 = texture2D(uPhoto, uv3);
        vec4 color = mix(color1, (color2 + color3) * 0.5, 0.35);

        // Radiant sunlight & vibrant natural hues
        color.rgb = pow(color.rgb, vec3(0.92));
        color.rgb += vec3(0.05, 0.035, 0.01) * (1.0 - depth); // Warm sunbeam halo on horizon

        gl_FragColor = color;
      }
    `;

    let curtains;
    try {
      curtains = new CurtainsConstructor({
        container: 'hero-curtains-canvas',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        autoRender: true,
        production: true
      });
    } catch (err) {
      console.warn('WebGL Curtains init error:', err);
      return;
    }

    curtains.onError(() => {
      heroSection.classList.remove('has-webgl-3d');
    });

    curtains.onContextLost(() => {
      curtains.restoreContext();
    });

    // Mouse coordinates tracking with smooth physics interpolation
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      lerpFactor: 0.085
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
          value: [0.22, 0.16] // Strong, striking 3D stereoscopic depth
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

      // Smooth spring interpolation
      mouse.currentX += (mouse.targetX - mouse.currentX) * mouse.lerpFactor;
      mouse.currentY += (mouse.targetY - mouse.currentY) * mouse.lerpFactor;

      plane.uniforms.mouse.value = [mouse.currentX, mouse.currentY];
      plane.uniforms.time.value += 1;

      // 3D Spatial rotational perspective in WebGL space
      if (plane.setRotation && Vec3Constructor) {
        plane.setRotation(new Vec3Constructor(-mouse.currentY * 0.14, mouse.currentX * 0.16, 0));
      }
    });

    // 1. Mouse movement tracking across entire viewport
    function handlePointerMove(clientX, clientY) {
      const rect = heroSection.getBoundingClientRect();
      const x = ((clientX - rect.left) / (rect.width || window.innerWidth)) * 2 - 1;
      const y = ((clientY - rect.top) / (rect.height || window.innerHeight)) * 2 - 1;
      mouse.targetX = Math.max(-1.3, Math.min(1.3, x));
      mouse.targetY = Math.max(-1.3, Math.min(1.3, y));
    }

    window.addEventListener('mousemove', (e) => {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('pointermove', (e) => {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    });

    // 2. Mobile Gyroscope / Device Orientation
    function handleOrientation(e) {
      if (e.gamma === null || e.beta === null) return;
      const tiltX = Math.max(-1.4, Math.min(1.4, e.gamma / 18));
      const tiltY = Math.max(-1.4, Math.min(1.4, (e.beta - 40) / 18));
      mouse.targetX = tiltX;
      mouse.targetY = tiltY;
    }

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    // 3. Performance: Pause WebGL when hero is scrolled out of viewport
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

  // Double check initialization timing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initHero3D();
      // Retry in 100ms if script tags loaded out of order
      setTimeout(initHero3D, 100);
    });
  } else {
    initHero3D();
    setTimeout(initHero3D, 100);
  }
})();
