(function () {
  'use strict';

  // Exécution uniquement en fenêtre principale sur williamguindon.me (jamais en iframe ni sur clone)
  try {
    if (window.self !== window.top) return;
  } catch (_) {
    return;
  }
  const host = String(location.hostname || '').toLowerCase();
  const ALLOWED_HOSTS = ['williamguindon.me', 'www.williamguindon.me', 'bwillou1.github.io', 'localhost', '127.0.0.1'];
  if (host && !ALLOWED_HOSTS.includes(host)) return;

  // Télémétrie 100 % locale (IndexedDB + localStorage + sessionStorage + Cookie + multi-onglets) — exportée uniquement si l'utilisateur coche l'option dans .wg
  const STORAGE_KEY = 'wg_blackbox_ring_v1';
  const COOKIE_KEY = 'wg_bb_meta';
  const IDB_NAME = 'wg_blackbox_db';
  const IDB_STORE = 'sessions';
  const MAX_EVENTS = 2500;
  const sessionStart = Date.now();

  const state = {
    sessionId: 'wg-' + Math.random().toString(36).slice(2, 10),
    startedAt: new Date(sessionStart).toISOString(),
    pages: [location.pathname + location.search],
    vitals: { lcpMs: null, cls: 0, inpMs: 0, longTasks: 0 },
    events: []
  };

  function readCookieMeta() {
    try {
      const m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_KEY + '=([^;]*)'));
      return m ? JSON.parse(decodeURIComponent(m[1])) : null;
    } catch (_) { return null; }
  }

  function writeCookieMeta() {
    try {
      const meta = {
        sid: state.sessionId,
        st: state.startedAt,
        n: state.events.length,
        p: state.pages.slice(-8)
      };
      document.cookie = COOKIE_KEY + '=' + encodeURIComponent(JSON.stringify(meta)) + '; path=/; max-age=2592000; SameSite=Lax';
    } catch (_) {}
  }

  function openBlackboxIdb() {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) return resolve(null);
      try {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (_) { resolve(null); }
    });
  }

  async function saveToIdb(payload) {
    try {
      const db = await openBlackboxIdb();
      if (!db) return;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(payload, 'current');
    } catch (_) {}
  }

  async function loadFromIdb() {
    try {
      const db = await openBlackboxIdb();
      if (!db) return null;
      return await new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get('current');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (_) { return null; }
  }

  function mergeLoadedState(parsed) {
    if (!parsed || !Array.isArray(parsed.events)) return;
    if (parsed.events.length > state.events.length) {
      state.events = parsed.events.slice(-MAX_EVENTS);
    }
    if (parsed.sessionId) state.sessionId = parsed.sessionId;
    if (parsed.startedAt) state.startedAt = parsed.startedAt;
    if (Array.isArray(parsed.pages)) {
      for (const pg of parsed.pages) {
        if (!state.pages.includes(pg)) state.pages.unshift(pg);
      }
      state.pages = state.pages.slice(-30);
    }
    if (parsed.vitals) Object.assign(state.vitals, parsed.vitals);
  }

  try {
    const rawLs = localStorage.getItem(STORAGE_KEY);
    if (rawLs) mergeLoadedState(JSON.parse(rawLs));
    const rawSs = sessionStorage.getItem(STORAGE_KEY);
    if (rawSs) mergeLoadedState(JSON.parse(rawSs));
    const cm = readCookieMeta();
    if (cm && cm.sid && state.events.length === 0) state.sessionId = cm.sid;
  } catch (_) {}

  loadFromIdb().then((idbData) => {
    if (idbData) {
      mergeLoadedState(idbData);
      if (!readCookieMeta()) writeCookieMeta();
    }
  });

  // Auto-réparation du cookie s'il a été supprimé + synchronisation multi-onglets
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('wg_blackbox_sync') : null;
  if (bc) {
    bc.onmessage = (ev) => {
      if (ev && ev.data && ev.data.type === 'wg_bb_event' && ev.data.ev) {
        const incoming = ev.data.ev;
        const dup = state.events.some((x) => x.ts === incoming.ts && x.type === incoming.type && x.p === incoming.p);
        if (!dup) {
          state.events.push(incoming);
          if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
        }
        if (incoming.p && !state.pages.includes(incoming.p)) state.pages.push(incoming.p);
      }
    };
  }
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { mergeLoadedState(JSON.parse(e.newValue)); } catch (_) {}
    }
  });
  setInterval(() => {
    if (!readCookieMeta()) writeCookieMeta();
  }, 4000);

  let flushTimer = null;
  function schedulePersist() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      const compact = {
        sessionId: state.sessionId,
        startedAt: state.startedAt,
        pages: state.pages,
        vitals: state.vitals,
        events: state.events.slice(-1200)
      };
      const jsonCompact = JSON.stringify(compact);
      try { sessionStorage.setItem(STORAGE_KEY, jsonCompact); } catch (_) {}
      try { localStorage.setItem(STORAGE_KEY, jsonCompact); } catch (_) {}
      writeCookieMeta();
      saveToIdb({
        sessionId: state.sessionId,
        startedAt: state.startedAt,
        pages: state.pages,
        vitals: state.vitals,
        events: state.events
      });
    }, 600);
  }

  function record(type, data) {
    const ev = {
      t: Date.now() - sessionStart,
      ts: new Date().toISOString(),
      p: location.pathname,
      type,
      d: data || {}
    };
    state.events.push(ev);
    if (state.events.length > MAX_EVENTS) {
      state.events.splice(0, state.events.length - MAX_EVENTS);
    }
    if (bc) {
      try { bc.postMessage({ type: 'wg_bb_event', ev }); } catch (_) {}
    }
    schedulePersist();
  }

  function cssSelector(el) {
    if (!el || !el.tagName) return '';
    let s = el.tagName.toLowerCase();
    if (el.id) return s + '#' + el.id;
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) s += '.' + cls;
    }
    return s;
  }

  // 1. DOM Mutations + Friction UX (Rage clicks, Dead clicks, Wild cursor, Scroll, Clavier masqué)
  let lastDomMutationAt = 0;
  try {
    const mo = new MutationObserver((muts) => {
      lastDomMutationAt = Date.now();
      for (const m of muts.slice(0, 5)) {
        if (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'data-theme' || m.attributeName === 'open')) {
          record('dom_attr', { target: cssSelector(m.target), attr: m.attributeName });
        }
      }
    });
    mo.observe(document.documentElement, { attributes: true, childList: true, subtree: true, attributeFilter: ['class', 'data-theme', 'open'] });
  } catch (_) {}

  const recentClicks = [];
  let lastMoveAt = 0;
  let lastPtr = null;
  let thrashScore = 0;

  document.addEventListener('pointerdown', (e) => {
    const sel = cssSelector(e.target);
    const now = Date.now();
    const clickSnap = { x: Math.round(e.clientX), y: Math.round(e.clientY), t: now };
    recentClicks.push(clickSnap);
    while (recentClicks.length && now - recentClicks[0].t > 1000) recentClicks.shift();
    const nearClicks = recentClicks.filter((c) => Math.hypot(c.x - clickSnap.x, c.y - clickSnap.y) <= 40);
    if (nearClicks.length >= 3) {
      record('ux_rage_click', { sel, x: clickSnap.x, y: clickSnap.y, count: nearClicks.length });
    }

    const beforeMut = lastDomMutationAt;
    const beforeHref = location.href;
    record('pointer_down', {
      sel,
      x: clickSnap.x,
      y: clickSnap.y,
      pt: e.pointerType || 'mouse',
      pressure: typeof e.pressure === 'number' ? Number(e.pressure.toFixed(2)) : 0
    });

    const isInteractive = e.target && e.target.closest && e.target.closest('a,button,input,select,textarea,summary,[role="button"]');
    if (!isInteractive) {
      setTimeout(() => {
        if (lastDomMutationAt === beforeMut && location.href === beforeHref) {
          record('ux_dead_click', { sel, x: clickSnap.x, y: clickSnap.y });
        }
      }, 480);
    }
  }, true);

  document.addEventListener('pointermove', (e) => {
    const now = Date.now();
    if (now - lastMoveAt < 180) return;
    lastMoveAt = now;
    const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents().length : 1;
    const x = Math.round(e.clientX);
    const y = Math.round(e.clientY);
    if (lastPtr) {
      const dist = Math.hypot(x - lastPtr.x, y - lastPtr.y);
      if (dist > 280) {
        thrashScore++;
        if (thrashScore >= 4) {
          record('ux_wild_cursor', { dist: Math.round(dist), coalesced });
          thrashScore = 0;
        }
      } else {
        thrashScore = Math.max(0, thrashScore - 1);
      }
    }
    lastPtr = { x, y };
  }, { passive: true });

  window.addEventListener('scrollend', () => {
    const maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.round((window.scrollY / maxY) * 100));
    record('scroll', { pct });
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    const isInput = e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
    const safeKey = isInput ? '***' : e.key;
    if (isInput && !['Enter', 'Escape', 'Tab'].includes(e.key)) return;
    record('key', { k: safeKey, ctrl: !!(e.ctrlKey || e.metaKey), sel: cssSelector(e.target) });
  }, true);

  document.addEventListener('copy', () => {
    const selLen = (window.getSelection && String(window.getSelection()).length) || 0;
    record('copy', { len: selLen });
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (!t || !t.tagName) return;
    const isSensitive = /^(INPUT|TEXTAREA)$/.test(t.tagName) && t.type !== 'checkbox' && t.type !== 'radio';
    record('ui_change', {
      sel: cssSelector(t),
      val: isSensitive ? '***' : (t.type === 'checkbox' ? !!t.checked : String(t.value || '').slice(0, 60))
    });
  }, true);
  document.addEventListener('submit', (e) => {
    record('form_submit', { sel: cssSelector(e.target) });
  }, true);
  record('page_open', { url: location.pathname + location.search });

  // 2. Médias & Visibilité
  document.addEventListener('play', (e) => record('media_play', { tag: e.target && e.target.tagName }), true);
  document.addEventListener('pause', (e) => record('media_pause', { tag: e.target && e.target.tagName }), true);
  document.addEventListener('seeking', (e) => record('media_seek', { t: e.target && Math.round(e.target.currentTime || 0) }), true);
  document.addEventListener('waiting', (e) => record('media_buffer', { tag: e.target && e.target.tagName }), true);
  document.addEventListener('visibilitychange', () => record('visibility', { state: document.visibilityState }));
  window.addEventListener('popstate', () => {
    const p = location.pathname + location.search;
    if (!state.pages.includes(p)) state.pages.push(p);
    record('nav_popstate', { p });
  });
  window.addEventListener('hashchange', () => record('nav_hash', { hash: location.hash }));
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || !e.data.type) return;
    if (String(e.data.type).startsWith('wg_') || String(e.data.type).includes('pdf')) {
      record('iframe_msg', { type: e.data.type });
    }
  });

  // 3. Performance, Core Web Vitals & Long tasks
  if ('PerformanceObserver' in window) {
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length) state.vitals.lcpMs = Math.round(entries[entries.length - 1].startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {}
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) state.vitals.cls = Number((state.vitals.cls + e.value).toFixed(4));
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (_) {}
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          state.vitals.longTasks++;
          if (e.duration > 80) record('long_task', { ms: Math.round(e.duration) });
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch (_) {}
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.duration > state.vitals.inpMs) state.vitals.inpMs = Math.round(e.duration);
        }
      }).observe({ type: 'event', durationThreshold: 40, buffered: true });
    } catch (_) {}
  }

  // 4. Erreurs silencieuses & CSP
  window.addEventListener('error', (e) => {
    if (e.target && e.target !== window) {
      record('resource_error', { tag: e.target.tagName, src: e.target.src || e.target.href || '' });
    } else {
      record('js_error', { msg: e.message, file: e.filename, line: e.lineno, col: e.colno });
    }
  }, true);
  window.addEventListener('unhandledrejection', (e) => {
    record('promise_error', { msg: String(e.reason && (e.reason.message || e.reason) || 'rejected') });
  });
  document.addEventListener('securitypolicyviolation', (e) => {
    record('csp_violation', { dir: e.violatedDirective, blocked: e.blockedURI });
  });

  // 5. Contexte matériel & réseau anonyme (0 IP)
  async function collectSnapshot() {
    let gpu = '';
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) gpu = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '';
      }
    } catch (_) {}

    let storage = null;
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await Promise.race([
          navigator.storage.estimate(),
          new Promise((r) => setTimeout(() => r(null), 400))
        ]);
        if (est) {
          storage = { usageMB: Number(((est.usage || 0) / 1048576).toFixed(2)), quotaMB: Number(((est.quota || 0) / 1048576).toFixed(1)) };
        }
      }
    } catch (_) {}

    const resources = (performance.getEntriesByType && performance.getEntriesByType('resource') || [])
      .slice(-40)
      .map((r) => ({
        name: String(r.name || '').split('?')[0].slice(-80),
        durMs: Math.round(r.duration || 0),
        ttfbMs: Math.round((r.responseStart || 0) - (r.requestStart || 0)),
        size: r.transferSize || 0
      }));

    const conn = navigator.connection || {};
    const mem = performance.memory ? {
      usedJSHeapMB: Number((performance.memory.usedJSHeapSize / 1048576).toFixed(1)),
      limitMB: Number((performance.memory.jsHeapSizeLimit / 1048576).toFixed(1))
    } : null;

    return {
      sessionId: state.sessionId,
      startedAt: state.startedAt,
      exportedAt: new Date().toISOString(),
      pages: state.pages,
      vitals: state.vitals,
      hw: {
        screen: screen.width + 'x' + screen.height,
        viewport: window.innerWidth + 'x' + window.innerHeight,
        dpr: window.devicePixelRatio || 1,
        cores: navigator.hardwareConcurrency || null,
        ramGB: navigator.deviceMemory || null,
        gpu,
        darkSystem: !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches),
        reducedMotion: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
        ua: navigator.userAgent
      },
      net: {
        online: navigator.onLine,
        effectiveType: conn.effectiveType || null,
        downlinkMbps: conn.downlink || null,
        rttMs: conn.rtt || null,
        saveData: !!conn.saveData
      },
      mem,
      storage,
      resources,
      events: state.events
    };
  }

  async function exportPayload() {
    return await collectSnapshot();
  }

  function formatAsTxt(d) {
    const lines = [];
    lines.push('=== WG BLACKBOX DIAGNOSTIC LOG ===');
    lines.push(`Session   : ${d.sessionId}`);
    lines.push(`Début     : ${d.startedAt}`);
    lines.push(`Export    : ${d.exportedAt}`);
    lines.push(`Pages     : ${(d.pages || []).join(', ')}`);
    lines.push('');
    lines.push('--- 1. CORE WEB VITALS & MÉMOIRE ---');
    lines.push(`LCP: ${d.vitals && d.vitals.lcpMs} ms | CLS: ${d.vitals && d.vitals.cls} | INP: ${d.vitals && d.vitals.inpMs} ms | LongTasks: ${d.vitals && d.vitals.longTasks}`);
    if (d.mem) lines.push(`RAM JS: ${d.mem.usedJSHeapMB} Mo / ${d.mem.limitMB} Mo`);
    if (d.storage) lines.push(`Stockage local: ${d.storage.usageMB} Mo / ${d.storage.quotaMB} Mo`);
    lines.push('');
    lines.push('--- 2. MATÉRIEL & RÉSEAU (0 IP) ---');
    if (d.hw) {
      lines.push(`Écran: ${d.hw.screen} | Fenêtre: ${d.hw.viewport} | DPR: ${d.hw.dpr} | Cœurs: ${d.hw.cores} | RAM: ${d.hw.ramGB} Go`);
      lines.push(`GPU: ${d.hw.gpu || 'n/a'} | Thème sombre OS: ${d.hw.darkSystem} | ReducedMotion: ${d.hw.reducedMotion}`);
      lines.push(`UA: ${d.hw.ua}`);
    }
    if (d.net) {
      lines.push(`En ligne: ${d.net.online} | Type: ${d.net.effectiveType} | Débit: ${d.net.downlinkMbps} Mbps | RTT: ${d.net.rttMs} ms | SaveData: ${d.net.saveData}`);
    }
    lines.push('');
    lines.push(`--- 3. RESSOURCES RÉSEAU (${(d.resources || []).length}) ---`);
    for (const r of (d.resources || [])) {
      lines.push(`[${r.durMs} ms | TTFB ${r.ttfbMs} ms | ${r.size} o] ${r.name}`);
    }
    lines.push('');
    lines.push(`--- 4. JOURNAL D'ÉVÉNEMENTS (${(d.events || []).length}) ---`);
    for (const ev of (d.events || [])) {
      lines.push(`+${ev.t}ms [${ev.p}] ${ev.type} ${JSON.stringify(ev.d)}`);
    }
    return lines.join('\n');
  }

  window.WGBlackbox = {
    record,
    collectSnapshot,
    exportPayload,
    formatAsTxt
  };
})();
