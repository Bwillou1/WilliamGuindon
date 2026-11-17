(function () {
  'use strict';

  // Télémétrie 100 % locale (sessionStorage) — exportée uniquement si l'utilisateur coche l'option dans .wg
  const STORAGE_KEY = 'wg_blackbox_ring_v1';
  const MAX_EVENTS = 1200;
  const sessionStart = Date.now();

  const state = {
    sessionId: 'wg-' + Math.random().toString(36).slice(2, 10),
    startedAt: new Date(sessionStart).toISOString(),
    pages: [location.pathname + location.search],
    vitals: { lcpMs: null, cls: 0, inpMs: 0, longTasks: 0 },
    events: []
  };

  try {
    const prev = sessionStorage.getItem(STORAGE_KEY);
    if (prev) {
      const parsed = JSON.parse(prev);
      if (parsed && Array.isArray(parsed.events)) {
        state.events = parsed.events.slice(-MAX_EVENTS);
        if (parsed.sessionId) state.sessionId = parsed.sessionId;
        if (parsed.startedAt) state.startedAt = parsed.startedAt;
        if (Array.isArray(parsed.pages)) state.pages = parsed.pages;
        if (!state.pages.includes(location.pathname + location.search)) {
          state.pages.push(location.pathname + location.search);
        }
        if (parsed.vitals) Object.assign(state.vitals, parsed.vitals);
      }
    }
  } catch (_) {}

  let flushTimer = null;
  function schedulePersist() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (_) {}
    }, 600);
  }

  function record(type, data) {
    state.events.push({
      t: Date.now() - sessionStart,
      ts: new Date().toISOString(),
      p: location.pathname,
      type,
      d: data || {}
    });
    if (state.events.length > MAX_EVENTS) {
      state.events.splice(0, state.events.length - MAX_EVENTS);
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

  // 2. Médias & Visibilité
  document.addEventListener('play', (e) => record('media_play', { tag: e.target && e.target.tagName }), true);
  document.addEventListener('pause', (e) => record('media_pause', { tag: e.target && e.target.tagName }), true);
  document.addEventListener('seeking', (e) => record('media_seek', { t: e.target && Math.round(e.target.currentTime || 0) }), true);
  document.addEventListener('waiting', (e) => record('media_buffer', { tag: e.target && e.target.tagName }), true);
  document.addEventListener('visibilitychange', () => record('visibility', { state: document.visibilityState }));

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
        const est = await navigator.storage.estimate();
        storage = { usageMB: Number(((est.usage || 0) / 1048576).toFixed(2)), quotaMB: Number(((est.quota || 0) / 1048576).toFixed(1)) };
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
