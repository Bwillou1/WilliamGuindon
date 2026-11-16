(function () {
  'use strict';

  const VERT_URL = '/assets/shaders/loupe.vert';
  const FRAG_URL = '/assets/shaders/loupe.frag';

  function compileShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  async function attachLoupe(imgEl, zoomFactor) {
    if (!imgEl || imgEl.dataset.wgGlLoupeAttached === '1') return false;
    if (!imgEl.complete) {
      await new Promise((r) => imgEl.addEventListener('load', r, { once: true }));
    }
    const w = imgEl.clientWidth || imgEl.naturalWidth;
    const h = imgEl.clientHeight || imgEl.naturalHeight;
    if (!w || !h) return false;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;display:inline-block;max-width:100%;';
    imgEl.parentNode.insertBefore(wrapper, imgEl);
    wrapper.appendChild(imgEl);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;opacity:0;transition:opacity 0.15s ease;';
    canvas.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) {
      canvas.remove();
      return false;
    }

    const [vsSrc, fsSrc] = await Promise.all([
      fetch(VERT_URL).then((r) => r.text()),
      fetch(FRAG_URL).then((r) => r.text())
    ]);
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) {
      canvas.remove();
      return false;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.remove();
      return false;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgEl);
    } catch (_) {
      canvas.remove();
      return false;
    }

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uActive = gl.getUniformLocation(prog, 'u_active');
    const uZoom = gl.getUniformLocation(prog, 'u_zoom');

    let mx = 0.5;
    let my = 0.5;
    let active = 0;

    function draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uActive, active);
      gl.uniform1f(uZoom, Number(zoomFactor) || 2.4);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    canvas.addEventListener('pointerenter', () => {
      active = 1;
      canvas.style.opacity = '1';
      draw();
    });
    canvas.addEventListener('pointerleave', () => {
      active = 0;
      canvas.style.opacity = '0';
    });
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mx = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      my = Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)));
      draw();
    });

    imgEl.dataset.wgGlLoupeAttached = '1';
    return true;
  }

  window.wgAttachGlLoupe = attachLoupe;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img[data-wg-gl-loupe]').forEach((img) => {
      attachLoupe(img, img.getAttribute('data-wg-gl-loupe'));
    });
  });
})();
