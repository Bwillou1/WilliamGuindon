(function () {
  'use strict';

  const WGSL_URL = '/assets/shaders/tourbiere.wgsl';
  const VERT_URL = '/assets/shaders/tourbiere.vert';
  const FRAG_URL = '/assets/shaders/tourbiere.frag';

  function isDarkTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return 1.0;
    if (t === 'light') return 0.0;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 1.0 : 0.0;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  async function initWebGPU(canvas, state) {
    if (!navigator.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return false;
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    if (!context) return false;

    const code = await (await fetch(WGSL_URL)).text();
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });

    const module = device.createShaderModule({ code });
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vs_main' },
      fragment: { module, entryPoint: 'fs_main', targets: [{ format }] },
      primitive: { topology: 'triangle-list' }
    });

    const uniformBuffer = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
    });
    const uniforms = new Float32Array(8);

    state.backend = 'webgpu';
    state.render = (elapsedSec) => {
      uniforms[0] = canvas.width;
      uniforms[1] = canvas.height;
      uniforms[2] = elapsedSec;
      uniforms[3] = isDarkTheme();
      uniforms[4] = state.mouseX;
      uniforms[5] = state.mouseY;
      device.queue.writeBuffer(uniformBuffer, 0, uniforms);

      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: context.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 }
        }]
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
      device.queue.submit([encoder.finish()]);
    };
    return true;
  }

  function compileGLShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  async function initWebGL(canvas, state) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) return false;

    const [vertSrc, fragSrc] = await Promise.all([
      fetch(VERT_URL).then((r) => r.text()),
      fetch(FRAG_URL).then((r) => r.text())
    ]);

    const vs = compileGLShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = compileGLShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return false;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uDark = gl.getUniformLocation(program, 'u_dark');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    state.backend = 'webgl';
    state.render = (elapsedSec) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsedSec);
      gl.uniform1f(uDark, isDarkTheme());
      gl.uniform2f(uMouse, state.mouseX, state.mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    return true;
  }

  async function mount(container) {
    if (!container || container.dataset.wgGpuMounted === '1') return null;
    container.dataset.wgGpuMounted = '1';

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const state = {
      backend: 'none',
      mouseX: 0.5,
      mouseY: 0.5,
      visible: true,
      rafId: 0,
      render: null
    };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    }
    resize();

    let ok = false;
    try {
      ok = await initWebGPU(canvas, state);
    } catch (_) {
      ok = false;
    }
    if (!ok) {
      try {
        ok = await initWebGL(canvas, state);
      } catch (_) {
        ok = false;
      }
    }
    if (!ok || !state.render) {
      canvas.remove();
      return null;
    }

    container.setAttribute('data-wg-gpu-backend', state.backend);
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', (e) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        state.mouseX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        state.mouseY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      }
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        state.visible = entries[0] ? entries[0].isIntersecting : true;
        if (state.visible && !prefersReducedMotion() && !state.rafId) {
          state.rafId = requestAnimationFrame(loop);
        }
      });
      io.observe(container);
    }

    const start = performance.now();
    function loop(now) {
      state.rafId = 0;
      if (document.hidden || !state.visible) return;
      state.render((now - start) * 0.001);
      if (!prefersReducedMotion()) {
        state.rafId = requestAnimationFrame(loop);
      }
    }

    state.render(0);
    if (!prefersReducedMotion()) {
      state.rafId = requestAnimationFrame(loop);
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state.visible && !prefersReducedMotion() && !state.rafId) {
        state.rafId = requestAnimationFrame(loop);
      }
    });

    return state.backend;
  }

  function autoMount() {
    document.querySelectorAll('[data-wg-gpu-canvas]').forEach((el) => {
      mount(el);
    });
  }

  window.wgInitTourbiereShader = mount;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
})();
