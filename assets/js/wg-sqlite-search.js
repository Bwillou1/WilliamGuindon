(function () {
  'use strict';

  const SQLJS_CDN = 'https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/';
  const DB_URL = '/data/corpus.sqlite';
  let dbPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (typeof window.initSqlJs === 'function') return resolve(window.initSqlJs);
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve(window.initSqlJs);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = (async () => {
      const initSqlJs = await loadScript(SQLJS_CDN + 'sql-wasm.js');
      const [SQL, dbBuf] = await Promise.all([
        initSqlJs({ locateFile: (file) => SQLJS_CDN + file }),
        fetch(DB_URL).then((r) => r.arrayBuffer())
      ]);
      return new SQL.Database(new Uint8Array(dbBuf));
    })();
    return dbPromise;
  }

  async function search(query, limit) {
    const clean = String(query || '').trim().replace(/["*]/g, ' ');
    if (!clean) return [];
    const db = await openDb();
    const maxRows = Math.min(Math.max(1, Number(limit) || 12), 50);
    const stmt = db.prepare(
      "SELECT url, title, substr(body, 1, 220) AS snippet, kind FROM documents_fts WHERE documents_fts MATCH ? ORDER BY rank LIMIT ?"
    );
    const terms = clean.split(/\s+/).filter(Boolean).map((t) => `${t}*`).join(' ');
    stmt.bind([terms, maxRows]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  window.wgSqliteSearch = { search };
})();
