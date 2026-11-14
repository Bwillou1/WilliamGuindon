(function () {
  'use strict';

  const DB_NAME = 'wg_annotations_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'documents';
  const VAULT_LS_KEY = 'wg_annotations_vault_v1';
  const PREFIX_LS_KEY = 'wg_embedpdf_annotations_';

  let dbPromise = null;

  /**
   * Normalise un chemin de document pour servir de clé unique canonique.
   * @param {string} file
   * @returns {string}
   */
  function normalizeDocPath(file) {
    if (!file || typeof file !== 'string') return '';
    let clean = file.trim();
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const parsed = new URL(clean, window.location.origin);
        if (parsed.origin === window.location.origin) {
          clean = decodeURIComponent(parsed.pathname);
        }
      } else {
        clean = decodeURIComponent(clean);
      }
    } catch (_) {}
    return clean.replace(/^(\.\/|\/)+/, '').normalize('NFC');
  }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      if (!('indexedDB' in window)) {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'path' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
    return dbPromise;
  }

  function readFromLocalStorage(file) {
    const norm = normalizeDocPath(file);
    const candidates = [
      PREFIX_LS_KEY + encodeURIComponent(norm),
      PREFIX_LS_KEY + encodeURIComponent('/' + norm),
      PREFIX_LS_KEY + encodeURIComponent(String(file || ''))
    ];
    for (const k of candidates) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    try {
      const rawVault = localStorage.getItem(VAULT_LS_KEY);
      if (rawVault) {
        const vault = JSON.parse(rawVault);
        if (vault && vault.documents) {
          const doc = vault.documents[norm] || vault.documents['/' + norm];
          if (doc && Array.isArray(doc.annotations) && doc.annotations.length > 0) {
            return doc.annotations;
          }
        }
      }
    } catch (_) {}
    return [];
  }

  function collectLegacyLocalStorageDocs() {
    const docs = {};
    try {
      const rawVault = localStorage.getItem(VAULT_LS_KEY);
      if (rawVault) {
        const parsed = JSON.parse(rawVault);
        if (parsed && parsed.documents && typeof parsed.documents === 'object') {
          for (const rawKey of Object.keys(parsed.documents)) {
            const entry = parsed.documents[rawKey];
            const annots = entry && Array.isArray(entry.annotations) ? entry.annotations : [];
            if (annots.length === 0) continue;
            const norm = normalizeDocPath(rawKey);
            if (!norm) continue;
            const existing = docs[norm];
            if (!existing || (entry.updatedAt || 0) >= (existing.updatedAt || 0)) {
              docs[norm] = {
                path: norm,
                annotations: annots,
                updatedAt: entry.updatedAt || Date.now()
              };
            }
          }
        }
      }
    } catch (_) {}

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(PREFIX_LS_KEY)) continue;
        const rawDoc = decodeURIComponent(k.slice(PREFIX_LS_KEY.length));
        const norm = normalizeDocPath(rawDoc);
        if (!norm) continue;
        const parsed = JSON.parse(localStorage.getItem(k) || '[]');
        if (Array.isArray(parsed) && parsed.length > 0 && !docs[norm]) {
          docs[norm] = {
            path: norm,
            annotations: parsed,
            updatedAt: Date.now()
          };
        }
      }
    } catch (_) {}

    return docs;
  }

  function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function safeLocalStorageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }

  function getCanonicalDocStem(pathStr) {
    const base = String(pathStr || '').split('/').pop() || '';
    return base
      .toLowerCase()
      .replace(/\s*\(\d+\)(?=\.[^.]+$)/, '')
      .replace(/^26-3-det2_fr/, '26-2-det2_fr')
      .trim();
  }

  /**
   * Récupère les annotations d'un document depuis IndexedDB (avec migration auto depuis localStorage et résolution d'alias).
   * @param {string} file
   * @returns {Promise<Array>}
   */
  async function getDocumentAnnotations(file) {
    const norm = normalizeDocPath(file);
    if (!norm) return [];

    const db = await openDB();
    if (db) {
      const record = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(norm);
          req.onsuccess = () => {
            if (req.result && Array.isArray(req.result.annotations) && req.result.annotations.length > 0) {
              resolve(req.result.annotations);
              return;
            }
            const reqAll = store.getAll();
            reqAll.onsuccess = () => {
              const all = Array.isArray(reqAll.result) ? reqAll.result : [];
              const targetStem = getCanonicalDocStem(norm);
              let best = null;
              for (const item of all) {
                if (!item || !Array.isArray(item.annotations) || item.annotations.length === 0) continue;
                const itemNorm = normalizeDocPath(item.path);
                if (itemNorm === norm || (targetStem && getCanonicalDocStem(itemNorm) === targetStem)) {
                  if (!best || (item.updatedAt || 0) >= (best.updatedAt || 0)) {
                    best = item;
                  }
                }
              }
              resolve(best ? best.annotations : null);
            };
            reqAll.onerror = () => resolve(null);
          };
          req.onerror = () => resolve(null);
        } catch (_) {
          resolve(null);
        }
      });

      if (Array.isArray(record) && record.length > 0) {
        return record;
      }
    }

    const legacy = readFromLocalStorage(norm);
    if (legacy.length > 0 && db) {
      setDocumentAnnotations(norm, legacy).catch(() => {});
    }
    return legacy;
  }

  /**
   * Enregistre les annotations d'un document dans IndexedDB (source principale sans limite 5 Mo).
   * @param {string} file
   * @param {Array} annotations
   * @returns {Promise<boolean>}
   */
  async function setDocumentAnnotations(file, annotations) {
    const norm = normalizeDocPath(file);
    if (!norm) return false;
    const list = Array.isArray(annotations) ? annotations : [];
    const now = Date.now();

    const db = await openDB();
    let idbOk = false;
    if (db) {
      idbOk = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          if (list.length > 0) {
            store.put({ path: norm, annotations: list, updatedAt: now });
            store.delete('/' + norm);
          } else {
            store.delete(norm);
            store.delete('/' + norm);
          }
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }

    // Maintien léger dans localStorage si la taille le permet (sans bloquer sur QuotaExceededError)
    const lsKey = PREFIX_LS_KEY + encodeURIComponent(norm);
    const lsKeySlash = PREFIX_LS_KEY + encodeURIComponent('/' + norm);
    safeLocalStorageRemove(lsKeySlash);
    if (list.length > 0) {
      const ok = safeLocalStorageSet(lsKey, JSON.stringify(list));
      if (!ok) {
        // Libérer d'anciennes clés dupliquées si localStorage est saturé (509+ annotations)
        safeLocalStorageRemove(lsKey);
        safeLocalStorageRemove(VAULT_LS_KEY);
      }
    } else {
      safeLocalStorageRemove(lsKey);
    }

    try {
      window.dispatchEvent(new CustomEvent('wg:annotations-vault-updated', { detail: { path: norm } }));
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'wg:annotations-vault-updated', path: norm }, '*');
      }
    } catch (_) {}

    return idbOk;
  }

  /**
   * Exporte l'ensemble des documents annotés (IndexedDB + reliquats localStorage) au format wg-annotations-v1.
   * @returns {Promise<Object>}
   */
  async function exportAllDocuments() {
    const documents = collectLegacyLocalStorageDocs();
    const db = await openDB();
    if (db) {
      const records = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const req = tx.objectStore(STORE_NAME).getAll();
          req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
          req.onerror = () => resolve([]);
        } catch (_) {
          resolve([]);
        }
      });

      for (const rec of records) {
        if (!rec || !rec.path || !Array.isArray(rec.annotations) || rec.annotations.length === 0) continue;
        const norm = normalizeDocPath(rec.path);
        if (!norm) continue;
        const existing = documents[norm];
        if (!existing || (rec.updatedAt || 0) >= (existing.updatedAt || 0)) {
          documents[norm] = {
            path: norm,
            annotations: rec.annotations,
            updatedAt: rec.updatedAt || Date.now()
          };
        }
      }
    }

    return {
      format: 'wg-annotations-v1',
      app: 'williamguindon.me',
      dossier: 'SEM-26-003',
      version: 1,
      updatedAt: new Date().toISOString(),
      documents: documents
    };
  }

  /**
   * Importe un objet wg-annotations-v1 dans IndexedDB en une seule transaction atomique.
   * @param {Object} vaultData
   * @returns {Promise<number>} Nombre de documents importés
   */
  async function importAllDocuments(vaultData) {
    if (!vaultData || vaultData.format !== 'wg-annotations-v1' || typeof vaultData.documents !== 'object') {
      throw new Error('Format de coffre annotations invalide');
    }

    const normalizedMap = new Map();
    for (const rawKey of Object.keys(vaultData.documents)) {
      const entry = vaultData.documents[rawKey];
      const annots = entry && Array.isArray(entry.annotations) ? entry.annotations : [];
      if (annots.length === 0) continue;
      const norm = normalizeDocPath(rawKey);
      if (!norm) continue;
      const prev = normalizedMap.get(norm);
      const updatedAt = (entry && entry.updatedAt) ? entry.updatedAt : Date.now();
      if (!prev || updatedAt >= prev.updatedAt) {
        normalizedMap.set(norm, { path: norm, annotations: annots, updatedAt: updatedAt });
      }
    }

    const db = await openDB();
    if (db) {
      await new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          for (const rec of normalizedMap.values()) {
            store.put(rec);
          }
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error || new Error('Erreur transaction IndexedDB'));
        } catch (err) {
          reject(err);
        }
      });
    }

    // Nettoyage des clés localStorage redondantes pour éviter la saturation 5 Mo
    try {
      const cleanVault = {
        format: 'wg-annotations-v1',
        app: 'williamguindon.me',
        dossier: 'SEM-26-003',
        version: 1,
        updatedAt: new Date().toISOString(),
        documents: Object.fromEntries(normalizedMap.entries())
      };
      if (!safeLocalStorageSet(VAULT_LS_KEY, JSON.stringify(cleanVault))) {
        safeLocalStorageRemove(VAULT_LS_KEY);
      }
    } catch (_) {}

    return normalizedMap.size;
  }

  window.WGAnnotationsIDB = {
    normalizeDocPath,
    getDocumentAnnotations,
    setDocumentAnnotations,
    exportAllDocuments,
    importAllDocuments,
    readFromLocalStorage
  };
})();
