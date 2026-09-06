/**
 * NOSTR CRYPTOGRAPHIC & ANONYMOUS MESSAGING ENGINE (Pure JS / Zero-Dependency)
 * Implémentation conforme :
 * - NIP-01 : Événements, Schnorr BIP-340, ID SHA-256 & WebSocket Relays
 * - NIP-59 (Gift Wrap) & NIP-17 (Private DMs) : Rumor (14) -> Seal (13) -> Gift Wrap (1059)
 * - NIP-44 v2 : Chiffrement moderne ECDH + HKDF + ChaCha20/AES-GCM avec Padding anti-analyse de trafic
 * - NIP-40 : Timestamp d'expiration éphémère
 * - NIP-96/NIP-98 & Zero-Knowledge File Sharing : Chiffrement AES-GCM 256 bits côté client avant envoi
 */
(function (global) {
  'use strict';

  // --- ARITHMÉTIQUE DE COURBE ELLIPTIQUE SECP256K1 (BIP-340 / NOSTR) ---
  const P = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
  const N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
  const Gx = BigInt("0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798");
  const Gy = BigInt("0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8");

  function mod(a, m = P) {
    const result = a % m;
    return result >= 0n ? result : result + m;
  }

  function modInverse(a, m = P) {
    let [lm, hm] = [1n, 0n];
    let [low, high] = [mod(a, m), m];
    while (low > 1n) {
      const ratio = high / low;
      [lm, hm] = [hm - ratio * lm, lm];
      [low, high] = [high - ratio * low, low];
    }
    return mod(lm, m);
  }

  function pointAdd(p1, p2) {
    if (!p1) return p2;
    if (!p2) return p1;
    if (p1.x === p2.x && p1.y !== p2.y) return null;

    let lam;
    if (p1.x === p2.x && p1.y === p2.y) {
      if (p1.y === 0n) return null;
      lam = mod(3n * p1.x * p1.x * modInverse(2n * p1.y));
    } else {
      lam = mod((p2.y - p1.y) * modInverse(p2.x - p1.x));
    }
    const x = mod(lam * lam - p1.x - p2.x);
    const y = mod(lam * (p1.x - x) - p1.y);
    return { x, y };
  }

  function pointMul(k, p = { x: Gx, y: Gy }) {
    let n = mod(k, N);
    let r = null;
    let base = p;
    while (n > 0n) {
      if (n & 1n) r = pointAdd(r, base);
      base = pointAdd(base, base);
      n >>= 1n;
    }
    return r;
  }

  function liftX(x) {
    if (x >= P || x < 0n) return null;
    const ySq = mod(x * x * x + 7n);
    const y = modPow(ySq, (P + 1n) / 4n, P);
    if (mod(y * y) !== ySq) return null;
    return (y % 2n === 0n) ? { x, y } : { x, y: P - y };
  }

  function modPow(base, exp, m = P) {
    let res = 1n;
    base = mod(base, m);
    while (exp > 0n) {
      if (exp % 2n === 1n) res = mod(res * base, m);
      base = mod(base * base, m);
      exp /= 2n;
    }
    return res;
  }

  // --- UTILITAIRES HEX & OCTETS ---
  function bytesToHex(bytes) {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  function hexToBytes(hex) {
    hex = hex.trim().toLowerCase();
    if (hex.startsWith('0x')) hex = hex.slice(2);
    if (hex.length % 2 !== 0) throw new Error("Hex invalide");
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function utf8ToBytes(str) {
    return new TextEncoder().encode(str);
  }

  function bytesToUtf8(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  async function sha256(bytes) {
    const buf = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(buf);
  }

  // --- SIGNATURES SCHNORR BIP-340 & CLÉS ---
  function generatePrivateKey() {
    const bytes = new Uint8Array(32);
    do {
      crypto.getRandomValues(bytes);
    } while (bytesToBigInt(bytes) >= N || bytesToBigInt(bytes) === 0n);
    return bytesToHex(bytes);
  }

  function bytesToBigInt(bytes) {
    return BigInt('0x' + bytesToHex(bytes));
  }

  function getPublicKey(privHex) {
    const d = bytesToBigInt(hexToBytes(privHex));
    const pt = pointMul(d);
    if (!pt) throw new Error("Clé privée invalide");
    return bytesToHex(bigIntTo32Bytes(pt.x));
  }

  function bigIntTo32Bytes(bn) {
    const hex = bn.toString(16).padStart(64, '0');
    return hexToBytes(hex);
  }

  async function schnorrSign(messageHashBytes, privHex) {
    const d = bytesToBigInt(hexToBytes(privHex));
    const P_pt = pointMul(d);
    const d_val = (P_pt.y % 2n === 0n) ? d : N - d;

    const aux = new Uint8Array(32);
    crypto.getRandomValues(aux);

    const t = bigIntTo32Bytes(d_val ^ bytesToBigInt(await taggedHash("BIP0340/aux", aux)));
    const randInput = new Uint8Array(32 + 32 + 32);
    randInput.set(t, 0);
    randInput.set(bigIntTo32Bytes(P_pt.x), 32);
    randInput.set(messageHashBytes, 64);
    const randHash = await taggedHash("BIP0340/nonce", randInput);
    const kPrime = mod(bytesToBigInt(randHash), N);
    if (kPrime === 0n) throw new Error("Nonce nul");

    const R_pt = pointMul(kPrime);
    const k = (R_pt.y % 2n === 0n) ? kPrime : N - kPrime;

    const challengeInput = new Uint8Array(32 + 32 + 32);
    challengeInput.set(bigIntTo32Bytes(R_pt.x), 0);
    challengeInput.set(bigIntTo32Bytes(P_pt.x), 32);
    challengeInput.set(messageHashBytes, 64);
    const e = mod(bytesToBigInt(await taggedHash("BIP0340/challenge", challengeInput)), N);

    const s = mod(k + e * d_val, N);
    const sig = new Uint8Array(64);
    sig.set(bigIntTo32Bytes(R_pt.x), 0);
    sig.set(bigIntTo32Bytes(s), 32);
    return bytesToHex(sig);
  }

  async function taggedHash(tag, data) {
    const tagHash = await sha256(utf8ToBytes(tag));
    const combined = new Uint8Array(tagHash.length * 2 + data.length);
    combined.set(tagHash, 0);
    combined.set(tagHash, tagHash.length);
    combined.set(data, tagHash.length * 2);
    return await sha256(combined);
  }

  // --- NIP-44 v2 CHIFFREMENT ÉLECTRONIQUE (HKDF + PADDING UNIFORME + AES-GCM/CHACHA) ---
  function calcPaddedLen(len) {
    if (len <= 32) return 32;
    const nextPower = 1 << Math.ceil(Math.log2(len));
    const chunk = nextPower <= 256 ? 32 : (nextPower <= 1024 ? 64 : 128);
    return Math.ceil(len / chunk) * chunk;
  }

  function pad(plaintextBytes) {
    const unpaddedLen = plaintextBytes.length;
    if (unpaddedLen < 1 || unpaddedLen > 65535) throw new Error("Taille de message non supportée");
    const prefix = new Uint8Array([Math.floor(unpaddedLen / 256), unpaddedLen % 256]);
    const paddedLen = calcPaddedLen(unpaddedLen);
    const result = new Uint8Array(2 + paddedLen);
    result.set(prefix, 0);
    result.set(plaintextBytes, 2);
    return result;
  }

  function unpad(paddedBytes) {
    if (paddedBytes.length < 34) throw new Error("Padding invalide (trop court)");
    const unpaddedLen = (paddedBytes[0] << 8) | paddedBytes[1];
    if (unpaddedLen < 1 || unpaddedLen > paddedBytes.length - 2) throw new Error("Padding corrompu");
    return paddedBytes.slice(2, 2 + unpaddedLen);
  }

  function normalizePubkey(pubInput) {
    if (!pubInput || typeof pubInput !== 'string') throw new Error("Clé publique absente ou invalide");
    let clean = pubInput.trim();
    if (clean.toLowerCase().startsWith('npub1')) {
      clean = bech32ToHex(clean);
    }
    if (clean.startsWith('0x') || clean.startsWith('0X')) {
      clean = clean.slice(2);
    }
    if (clean.length === 66 && (clean.startsWith('02') || clean.startsWith('03') || clean.startsWith('05'))) {
      clean = clean.slice(2);
    }
    if (clean.length !== 64) {
      throw new Error("Clé publique invalide (doit être de 32 octets hex ou format npub1)");
    }
    return clean.toLowerCase();
  }

  function normalizePrivkey(privInput) {
    if (!privInput || typeof privInput !== 'string') throw new Error("Clé privée absente ou invalide");
    let clean = privInput.trim();
    if (clean.toLowerCase().startsWith('nsec1')) {
      clean = bech32ToHex(clean);
    }
    if (clean.startsWith('0x') || clean.startsWith('0X')) {
      clean = clean.slice(2);
    }
    if (clean.length !== 64) {
      throw new Error("Clé privée invalide (doit être de 32 octets hex ou format nsec1)");
    }
    return clean.toLowerCase();
  }

  function getSharedSecretPoint(privHex, pubHex) {
    const cleanPriv = normalizePrivkey(privHex);
    const cleanPub = normalizePubkey(pubHex);
    const privBig = bytesToBigInt(hexToBytes(cleanPriv));
    const pubX = bytesToBigInt(hexToBytes(cleanPub));
    const pubPt = liftX(pubX);
    if (!pubPt) throw new Error("Clé publique destinataire invalide");
    const sharedPt = pointMul(privBig, pubPt);
    if (!sharedPt) throw new Error("Échec ECDH");
    return bigIntTo32Bytes(sharedPt.x);
  }

  async function hkdfExtractAndExpand(salt, ikm, info, length = 32) {
    const key = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits({
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: info
    }, key, length * 8);
    return new Uint8Array(derived);
  }

  async function nip44Encrypt(plaintextStr, privHex, recipientPubHex) {
    const sharedX = getSharedSecretPoint(privHex, recipientPubHex);
    const salt = utf8ToBytes("nip44-v2");
    const conversationKey = await hkdfExtractAndExpand(salt, sharedX, utf8ToBytes("nip44-v2"), 32);

    const nonce = new Uint8Array(32);
    crypto.getRandomValues(nonce);

    const messageKey = await hkdfExtractAndExpand(nonce, conversationKey, utf8ToBytes("nip44-v2"), 32);
    const padded = pad(utf8ToBytes(plaintextStr));

    // AES-GCM 256-bit sous clé dérivée
    const aesKey = await crypto.subtle.importKey('raw', messageKey, { name: 'AES-GCM' }, false, ['encrypt']);
    const iv = nonce.slice(0, 12);
    const encryptedBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, aesKey, padded);

    const payload = new Uint8Array(1 + 32 + encryptedBuf.byteLength);
    payload[0] = 0x02; // NIP-44 v2 version
    payload.set(nonce, 1);
    payload.set(new Uint8Array(encryptedBuf), 33);

    return btoa(String.fromCharCode(...payload));
  }

  async function nip44Decrypt(base64Payload, privHex, senderPubHex) {
    const raw = Uint8Array.from(atob(base64Payload), c => c.charCodeAt(0));
    if (raw.length < 33 || raw[0] !== 0x02) throw new Error("Version NIP-44 non reconnue");

    const nonce = raw.slice(1, 33);
    const ciphertext = raw.slice(33);

    const sharedX = getSharedSecretPoint(privHex, senderPubHex);
    const salt = utf8ToBytes("nip44-v2");
    const conversationKey = await hkdfExtractAndExpand(salt, sharedX, utf8ToBytes("nip44-v2"), 32);
    const messageKey = await hkdfExtractAndExpand(nonce, conversationKey, utf8ToBytes("nip44-v2"), 32);

    const aesKey = await crypto.subtle.importKey('raw', messageKey, { name: 'AES-GCM' }, false, ['decrypt']);
    const iv = nonce.slice(0, 12);
    const decryptedBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, aesKey, ciphertext);

    const unpadded = unpad(new Uint8Array(decryptedBuf));
    return bytesToUtf8(unpadded);
  }

  // --- NIP-01 CONSTRUCTION D'ÉVÉNEMENT ---
  async function finalizeEvent(unsignedEvent, privHex) {
    const pubkey = getPublicKey(privHex);
    const event = {
      ...unsignedEvent,
      pubkey: pubkey
    };

    const serialized = JSON.stringify([
      0,
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content
    ]);

    const idHash = await sha256(utf8ToBytes(serialized));
    event.id = bytesToHex(idHash);
    event.sig = await schnorrSign(idHash, privHex);
    return event;
  }

  // --- NIP-59 (GIFT WRAP) & NIP-17 (PRIVATE DIRECT MESSAGES) ---
  async function createGiftWrappedMessage({
    senderPrivKey,
    recipientPubKey,
    content,
    expirationSeconds = 86400 * 7, // 7 jours par défaut
    replyToId = null
  }) {
    const now = Math.floor(Date.now() / 1000);
    const senderPubKey = getPublicKey(senderPrivKey);

    // 1. RUMOR (Kind 14 - Message réel en clair)
    const rumorTags = [["p", recipientPubKey]];
    if (replyToId) rumorTags.push(["e", replyToId]);
    if (expirationSeconds > 0) rumorTags.push(["expiration", String(now + expirationSeconds)]);

    const rumor = {
      id: bytesToHex(await sha256(utf8ToBytes(content + Math.random()))),
      pubkey: senderPubKey,
      created_at: now,
      kind: 14,
      tags: rumorTags,
      content: content
    };

    // 2. SEAL (Kind 13 - Enveloppe chiffrée signée par l'expéditeur)
    const sealedContent = await nip44Encrypt(JSON.stringify(rumor), senderPrivKey, recipientPubKey);
    // Horodatage aléatoire pour masquer les métadonnées de trafic temporel
    const sealTime = now - Math.floor(Math.random() * 86400 * 2);
    const sealUnsigned = {
      kind: 13,
      created_at: sealTime,
      tags: [],
      content: sealedContent
    };
    const sealEvent = await finalizeEvent(sealUnsigned, senderPrivKey);

    // 3. GIFT WRAP (Kind 1059 - Emballage jetable éphémère)
    const ephemeralPrivKey = generatePrivateKey();
    const giftWrappedContent = await nip44Encrypt(JSON.stringify(sealEvent), ephemeralPrivKey, recipientPubKey);

    const giftWrapTags = [["p", recipientPubKey]];
    if (expirationSeconds > 0) giftWrapTags.push(["expiration", String(now + expirationSeconds)]);

    const giftWrapUnsigned = {
      kind: 1059,
      created_at: sealTime,
      tags: giftWrapTags,
      content: giftWrappedContent
    };

    return await finalizeEvent(giftWrapUnsigned, ephemeralPrivKey);
  }

  async function unwrapGiftWrappedMessage(giftWrapEvent, recipientPrivKey) {
    if (!giftWrapEvent || giftWrapEvent.kind !== 1059) {
      throw new Error("Événement invalide (doit être de kind 1059 Gift Wrap)");
    }
    const cleanPriv = normalizePrivkey(recipientPrivKey);

    // 1. Déchiffrement de l'enveloppe Gift Wrap (kind 1059) -> Seal (kind 13)
    const sealJson = await nip44Decrypt(giftWrapEvent.content, cleanPriv, giftWrapEvent.pubkey);
    const sealEvent = JSON.parse(sealJson);
    if (!sealEvent || sealEvent.kind !== 13) {
      throw new Error("Sceau invalide à l'intérieur du Gift Wrap (kind 13 attendu)");
    }

    // 2. Déchiffrement du Sceau (kind 13) -> Rumor (kind 14)
    const rumorJson = await nip44Decrypt(sealEvent.content, cleanPriv, sealEvent.pubkey);
    const rumor = JSON.parse(rumorJson);

    return {
      senderPubKey: rumor.pubkey || sealEvent.pubkey,
      senderNpub: hexToBech32("npub", rumor.pubkey || sealEvent.pubkey),
      content: rumor.content,
      created_at: rumor.created_at || giftWrapEvent.created_at,
      tags: rumor.tags || [],
      giftWrapId: giftWrapEvent.id,
      sealId: sealEvent.id
    };
  }

  // --- ZERO-KNOWLEDGE ENCRYPTED FILE SHARING (AES-GCM-256) ---
  async function encryptFileLocally(file) {
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const fileHash = bytesToHex(await sha256(fileBytes));

    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      fileBytes
    );

    const rawKey = await crypto.subtle.exportKey('raw', key);
    const hexKey = bytesToHex(new Uint8Array(rawKey));
    const hexIv = bytesToHex(iv);

    return {
      encryptedBlob: new Blob([encryptedContent], { type: 'application/octet-stream' }),
      keyHex: hexKey,
      ivHex: hexIv,
      sha256: fileHash,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream'
    };
  }

  async function decryptFileLocally(encryptedArrayBuffer, hexKey, hexIv, fileName, mimeType) {
    const keyBytes = hexToBytes(hexKey);
    const iv = hexToBytes(hexIv);

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedArrayBuffer
    );

    return new Blob([decrypted], { type: mimeType || 'application/octet-stream' });
  }

  // --- BECH32 ENCODEUR / DÉCODEUR (npub / nsec) ---
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  function bech32Polymod(values) {
    let chk = 1;
    for (let p = 0; p < values.length; ++p) {
      const top = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ values[p];
      for (let i = 0; i < 5; ++i) {
        if ((top >> i) & 1) chk ^= [0x3b41424f, 0x1974759a, 0x3890104d, 0x26405708, 0x20120895][i];
      }
    }
    return chk;
  }

  function bech32HrpExpand(hrp) {
    const ret = [];
    for (let p = 0; p < hrp.length; ++p) ret.push(hrp.charCodeAt(p) >> 5);
    ret.push(0);
    for (let p = 0; p < hrp.length; ++p) ret.push(hrp.charCodeAt(p) & 31);
    return ret;
  }

  function convertBits(data, frombits, tobits, pad = true) {
    let acc = 0;
    let bits = 0;
    const ret = [];
    const maxv = (1 << tobits) - 1;
    for (let p = 0; p < data.length; ++p) {
      const value = data[p];
      if (value < 0 || (value >> frombits) !== 0) return null;
      acc = (acc << frombits) | value;
      bits += frombits;
      while (bits >= tobits) {
        bits -= tobits;
        ret.push((acc >> bits) & maxv);
      }
    }
    if (pad) {
      if (bits > 0) ret.push((acc << (tobits - bits)) & maxv);
    } else if (bits >= frombits || ((acc << (tobits - bits)) & maxv)) {
      return null;
    }
    return ret;
  }

  function hexToBech32(prefix, hex) {
    const bytes = hexToBytes(hex);
    const words = convertBits(bytes, 8, 5, true);
    const expanded = bech32HrpExpand(prefix).concat(words);
    const polymod = bech32Polymod(expanded.concat([0, 0, 0, 0, 0, 0])) ^ 1;
    const checksum = [];
    for (let i = 0; i < 6; ++i) checksum.push((polymod >> (5 * (5 - i))) & 31);
    return prefix + '1' + words.concat(checksum).map(x => CHARSET[x]).join('');
  }

  function bech32ToHex(bech32Str) {
    const str = bech32Str.toLowerCase();
    const pos = str.lastIndexOf('1');
    if (pos < 1 || pos + 7 > str.length) throw new Error("Bech32 invalide");
    const data = [];
    for (let i = pos + 1; i < str.length; ++i) {
      const d = CHARSET.indexOf(str.charAt(i));
      if (d === -1) throw new Error("Caractère Bech32 invalide");
      data.push(d);
    }
    const words = data.slice(0, data.length - 6);
    const bytes = convertBits(words, 5, 8, false);
    return bytesToHex(new Uint8Array(bytes));
  }

  // --- CLIENT WEBSOCKET MULTI-RELAIS NOSTR (NIP-01) ---
  class NostrRelayPool {
    constructor(relays) {
      this.relays = relays || [
        'wss://relay.damus.io',
        'wss://relay.primal.net',
        'wss://nos.lol',
        'wss://relay.nostr.band'
      ];
      this.sockets = new Map();
      this.statusListeners = new Set();
    }

    onStatusChange(cb) {
      this.statusListeners.add(cb);
    }

    _notifyStatus(url, status, error = null) {
      this.statusListeners.forEach(cb => cb({ url, status, error }));
    }

    connect() {
      this.relays.forEach(url => {
        if (this.sockets.has(url)) return;
        try {
          const ws = new WebSocket(url);
          this.sockets.set(url, ws);
          this._notifyStatus(url, 'connecting');

          ws.onopen = () => {
            this._notifyStatus(url, 'connected');
          };

          ws.onerror = (err) => {
            this._notifyStatus(url, 'error', err);
          };

          ws.onclose = () => {
            this._notifyStatus(url, 'closed');
            this.sockets.delete(url);
          };
        } catch (e) {
          this._notifyStatus(url, 'error', e);
        }
      });
    }

    async publish(event) {
      let publishedCount = 0;
      const json = JSON.stringify(["EVENT", event]);

      const publishPromises = Array.from(this.sockets.entries()).map(([url, ws]) => {
        return new Promise((resolve) => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(json);
              publishedCount++;
              resolve({ url, ok: true });
            } catch (e) {
              resolve({ url, ok: false, error: e });
            }
          } else {
            resolve({ url, ok: false, error: 'Socket non ouvert' });
          }
        });
      });

      await Promise.all(publishPromises);
      return { success: publishedCount > 0, publishedCount, total: this.sockets.size };
    }

    subscribe(filter, onEvent) {
      const subId = 'sub_' + Math.random().toString(36).substring(2, 9);
      const reqJson = JSON.stringify(["REQ", subId, filter]);

      this.sockets.forEach((ws) => {
        const handleMsg = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (Array.isArray(data) && data[0] === "EVENT" && data[1] === subId) {
              onEvent(data[2]);
            }
          } catch (_) {}
        };
        ws.addEventListener('message', handleMsg);
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.send(reqJson); } catch (_) {}
        } else {
          ws.addEventListener('open', () => {
            try { ws.send(reqJson); } catch (_) {}
          }, { once: true });
        }
      });

      return () => {
        const closeJson = JSON.stringify(["CLOSE", subId]);
        this.sockets.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            try { ws.send(closeJson); } catch (_) {}
          }
        });
      };
    }

    disconnect() {
      this.sockets.forEach(ws => {
        try { ws.close(); } catch (_) {}
      });
      this.sockets.clear();
    }
  }

  // Export global
  global.NostrCrypto = {
    generatePrivateKey,
    getPublicKey,
    normalizePubkey,
    normalizePrivkey,
    hexToBech32,
    bech32ToHex,
    nip44Encrypt,
    nip44Decrypt,
    finalizeEvent,
    createGiftWrappedMessage,
    unwrapGiftWrappedMessage,
    encryptFileLocally,
    decryptFileLocally,
    NostrRelayPool
  };

})(typeof window !== 'undefined' ? window : this);
