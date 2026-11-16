(function () {
  'use strict';

  const WASM_URL = '/assets/wasm/wg_engine.wasm';
  let enginePromise = null;

  function toBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    return new TextEncoder().encode(String(input ?? ''));
  }

  async function load() {
    if (enginePromise) return enginePromise;
    enginePromise = (async () => {
      if (typeof WebAssembly !== 'object') {
        throw new Error('WebAssembly non supporté par ce navigateur.');
      }
      let result;
      if (typeof WebAssembly.instantiateStreaming === 'function') {
        try {
          result = await WebAssembly.instantiateStreaming(fetch(WASM_URL), {});
        } catch (_) {
          const res = await fetch(WASM_URL);
          const buf = await res.arrayBuffer();
          result = await WebAssembly.instantiate(buf, {});
        }
      } else {
        const res = await fetch(WASM_URL);
        const buf = await res.arrayBuffer();
        result = await WebAssembly.instantiate(buf, {});
      }
      return result.instance.exports;
    })();
    return enginePromise;
  }

  async function sha256(input) {
    const exp = await load();
    const bytes = toBytes(input);
    const ptr = exp.wg_buffer_ptr();
    const cap = exp.wg_buffer_cap();
    exp.wg_sha256_init();
    for (let off = 0; off < bytes.length; off += cap) {
      const chunk = bytes.subarray(off, Math.min(off + cap, bytes.length));
      new Uint8Array(exp.memory.buffer, ptr, cap).set(chunk);
      exp.wg_sha256_update(chunk.length);
    }
    exp.wg_sha256_final();
    const digest = new Uint8Array(exp.memory.buffer, ptr, 32);
    let hex = '';
    for (let i = 0; i < 32; i++) {
      hex += digest[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  async function fnv1a(input) {
    const exp = await load();
    const bytes = toBytes(input);
    const ptr = exp.wg_buffer_ptr();
    const cap = exp.wg_buffer_cap();
    const len = Math.min(bytes.length, cap);
    new Uint8Array(exp.memory.buffer, ptr, cap).set(bytes.subarray(0, len));
    return (exp.wg_fnv1a_32(len) >>> 0).toString(16).padStart(8, '0');
  }

  async function countTerm(text, term) {
    const exp = await load();
    const hay = toBytes(text);
    const needle = toBytes(term);
    if (!needle.length || !hay.length) return 0;
    const ptr = exp.wg_buffer_ptr();
    const cap = exp.wg_buffer_cap();
    if (hay.length + needle.length > cap) {
      let total = 0;
      const step = Math.max(1, cap - needle.length * 2);
      for (let off = 0; off < hay.length; off += step) {
        const end = Math.min(hay.length, off + step + needle.length - 1);
        const slice = hay.subarray(off, end);
        const view = new Uint8Array(exp.memory.buffer, ptr, cap);
        view.set(slice, 0);
        view.set(needle, slice.length);
        total += exp.wg_count_term_ci(slice.length, slice.length, needle.length);
      }
      return total;
    }
    const view = new Uint8Array(exp.memory.buffer, ptr, cap);
    view.set(hay, 0);
    view.set(needle, hay.length);
    return exp.wg_count_term_ci(hay.length, hay.length, needle.length);
  }

  window.wgWasm = {
    load,
    sha256,
    fnv1a,
    countTerm
  };
})();
