(function () {
  'use strict';

  const CRC_WASM_URL = '/assets/wasm/wg_crc32.wasm';
  let crcExportsPromise = null;

  async function loadCrcWasm() {
    if (crcExportsPromise) return crcExportsPromise;
    crcExportsPromise = (async () => {
      const res = await fetch(CRC_WASM_URL);
      const buf = await res.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(buf, {});
      return instance.exports;
    })();
    return crcExportsPromise;
  }

  async function crc32Wasm(bytes) {
    const exp = await loadCrcWasm();
    const ptr = exp.wg_c_buffer_ptr();
    const cap = exp.wg_c_buffer_cap();
    let crc = 0;
    for (let off = 0; off < bytes.length; off += cap) {
      const chunk = bytes.subarray(off, Math.min(off + cap, bytes.length));
      new Uint8Array(exp.memory.buffer, ptr, cap).set(chunk);
      crc = exp.wg_crc32_update(crc, chunk.length) >>> 0;
    }
    return crc >>> 0;
  }

  function u16(v) { return [v & 0xff, (v >>> 8) & 0xff]; }
  function u32(v) { return [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]; }

  /**
   * Construit une archive .zip valide (méthode Store, UTF-8) côté client avec CRC-32 en C/Wasm.
   * @param {Array<{name: string, data: Uint8Array|ArrayBuffer|string}>} entries
   * @returns {Promise<Blob>}
   */
  async function buildZip(entries) {
    const enc = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBytes = enc.encode(String(entry.name || 'document.bin'));
      const raw = entry.data instanceof Uint8Array
        ? entry.data
        : entry.data instanceof ArrayBuffer
          ? new Uint8Array(entry.data)
          : enc.encode(String(entry.data || ''));
      const crc = await crc32Wasm(raw);
      const size = raw.length;

      const localHeader = new Uint8Array([
        0x50, 0x4b, 0x03, 0x04, // Local file header signature
        20, 0,                  // Version needed
        0x00, 0x08,             // UTF-8 flag (bit 11)
        0, 0,                   // Compression: 0 (Store)
        0, 0, 0, 0,             // Mod time & date
        ...u32(crc),
        ...u32(size),
        ...u32(size),
        ...u16(nameBytes.length),
        0, 0                    // Extra len
      ]);
      localParts.push(localHeader, nameBytes, raw);

      const centralHeader = new Uint8Array([
        0x50, 0x4b, 0x01, 0x02, // Central directory signature
        20, 0, 20, 0,           // Versions made/needed
        0x00, 0x08,             // UTF-8 flag
        0, 0,                   // Store
        0, 0, 0, 0,             // Mod time & date
        ...u32(crc),
        ...u32(size),
        ...u32(size),
        ...u16(nameBytes.length),
        0, 0, 0, 0, 0, 0,       // Extra, comment, disk
        0, 0, 0, 0, 0, 0,       // Attributes
        ...u32(offset)
      ]);
      centralParts.push(centralHeader, nameBytes);

      offset += localHeader.length + nameBytes.length + raw.length;
    }

    let centralSize = 0;
    for (const p of centralParts) centralSize += p.length;

    const eocd = new Uint8Array([
      0x50, 0x4b, 0x05, 0x06,
      0, 0, 0, 0,
      ...u16(entries.length),
      ...u16(entries.length),
      ...u32(centralSize),
      ...u32(offset),
      0, 0
    ]);

    return new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
  }

  async function downloadUrlsAsZip(urls, zipFilename) {
    const entries = [];
    for (const url of urls) {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const name = String(url).split('/').pop().split('?')[0] || 'piece.pdf';
      entries.push({ name, data: new Uint8Array(buf) });
    }
    const blob = await buildZip(entries);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = zipFilename || 'dossier-sem-26-003.zip';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1500);
    return entries.length;
  }

  window.wgZipWasm = {
    crc32: crc32Wasm,
    buildZip,
    downloadUrlsAsZip
  };
})();
