/**
 * scripts/sync-google-photos.js
 * Synchronisation automatique des photographies et images de blog vers Google Photos
 * Site officiel : https://williamguindon.me
 */

const fs = require("fs");
const path = require("path");

const CLIENT_ID = process.env.GOOGLE_PHOTOS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_PHOTOS_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_PHOTOS_REFRESH_TOKEN;
const TARGET_ALBUM_ID = process.env.GOOGLE_PHOTOS_ALBUM_ID;

const LOG_FILE = path.join(__dirname, "..", "data", "google-photos-sync-log.json");
const PHOTOS_FILE = path.join(__dirname, "..", "data", "photos.json");
const BLOG_FILE = path.join(__dirname, "..", "data", "blog.json");

const ALBUM_NAME = "William Guindon — Site officiel & Blog";

async function getAccessToken() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: "refresh_token"
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error("Échec d'actualisation du token Google OAuth : " + errText);
  }

  const data = await res.json();
  return data.access_token;
}

async function getOrCreateAlbum(accessToken, cachedAlbumId) {
  if (TARGET_ALBUM_ID) {
    return TARGET_ALBUM_ID;
  }
  if (cachedAlbumId) {
    // Vérifie si l'album existe toujours
    const checkRes = await fetch("https://photoslibrary.googleapis.com/v1/albums/" + cachedAlbumId, {
      headers: { "Authorization": "Bearer " + accessToken }
    });
    if (checkRes.ok) return cachedAlbumId;
  }

  // Chercher un album existant nommé "William Guindon — Site officiel & Blog"
  let nextPageToken = null;
  do {
    let url = "https://photoslibrary.googleapis.com/v1/albums?pageSize=50";
    if (nextPageToken) url += "&pageToken=" + encodeURIComponent(nextPageToken);
    const listRes = await fetch(url, {
      headers: { "Authorization": "Bearer " + accessToken }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData.albums) {
        const found = listData.albums.find(a => a.title === ALBUM_NAME);
        if (found) return found.id;
      }
      nextPageToken = listData.nextPageToken;
    } else {
      break;
    }
  } while (nextPageToken);

  // Créer l'album s'il n'existe pas
  console.log("Création de l'album Google Photos : " + ALBUM_NAME);
  const createRes = await fetch("https://photoslibrary.googleapis.com/v1/albums", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      album: { title: ALBUM_NAME }
    })
  });

  if (!createRes.ok) {
    console.warn("Impossible de créer l'album spécifique, téléversement dans la bibliothèque principale.");
    return null;
  }

  const created = await createRes.json();
  return created.id;
}

function resolveLocalPath(url) {
  if (!url || typeof url !== "string") return null;
  const clean = url.split("?")[0].trim().replace(/^\//, "");
  const candidate = path.join(__dirname, "..", clean);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }
  return null;
}

function getMimeType(filePathOrUrl) {
  const lower = filePathOrUrl.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function getImageBuffer(item) {
  const local = resolveLocalPath(item.imageUrl);
  if (local) {
    return {
      buffer: fs.readFileSync(local),
      mimeType: getMimeType(local),
      fileName: path.basename(local)
    };
  }

  if (item.imageUrl && (item.imageUrl.startsWith("http://") || item.imageUrl.startsWith("https://"))) {
    const res = await fetch(item.imageUrl);
    if (!res.ok) throw new Error("HTTP " + res.status + " sur " + item.imageUrl);
    const arrayBuf = await res.arrayBuffer();
    const mimeType = res.headers.get("content-type") || getMimeType(item.imageUrl);
    const urlParts = item.imageUrl.split("?")[0].split("/");
    const fileName = urlParts[urlParts.length - 1] || "photo.jpg";
    return {
      buffer: Buffer.from(arrayBuf),
      mimeType: mimeType,
      fileName: fileName
    };
  }

  throw new Error("Source d'image introuvable pour : " + item.id);
}

async function uploadToGooglePhotos(accessToken, buffer, mimeType) {
  const uploadRes = await fetch("https://photoslibrary.googleapis.com/v1/uploads", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Content-type": "application/octet-stream",
      "X-Goog-Upload-Content-Type": mimeType,
      "X-Goog-Upload-Protocol": "raw"
    },
    body: buffer
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error("Échec d'envoi binaire vers Google Photos : " + err);
  }

  return await uploadRes.text();
}

async function createMediaItem(accessToken, uploadToken, fileName, description, albumId) {
  const body = {
    newMediaItems: [
      {
        description: description,
        simpleMediaItem: {
          uploadToken: uploadToken,
          fileName: fileName
        }
      }
    ]
  };

  if (albumId) {
    body.albumId = albumId;
  }

  const res = await fetch("https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Échec batchCreate sur Google Photos : " + err);
  }

  const data = await res.json();
  const result = data.newMediaItemResults && data.newMediaItemResults[0];
  if (!result || (result.status && result.status.message && result.status.message !== "Success")) {
    throw new Error("Création média refusée : " + JSON.stringify(result));
  }

  return result.mediaItem;
}

async function main() {
  console.log("=== Synchronisation Google Photos — William Guindon ===\n");

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.log("ℹ️ Information : Variables GOOGLE_PHOTOS_CLIENT_ID, GOOGLE_PHOTOS_CLIENT_SECRET ou GOOGLE_PHOTOS_REFRESH_TOKEN non configurées.");
    console.log("Pour activer la synchronisation automatique vers Google Photos :");
    console.log("1. Ouvrez Google Cloud Console (https://console.cloud.google.com).");
    console.log("2. Activez l'API 'Photos Library API'.");
    console.log("3. Créez un ID client OAuth 2.0 (Type : Application de bureau ou Web).");
    console.log("4. Lancez localement : node scripts/get-google-photos-token.js");
    console.log("5. Ajoutez les secrets dans votre dépôt GitHub (Settings -> Secrets and variables -> Actions) :\n");
    console.log("   - GOOGLE_PHOTOS_CLIENT_ID");
    console.log("   - GOOGLE_PHOTOS_CLIENT_SECRET");
    console.log("   - GOOGLE_PHOTOS_REFRESH_TOKEN\n");
    process.exit(0);
  }

  let syncLog = { lastSync: null, albumId: null, albumTitle: ALBUM_NAME, synced: [] };
  if (fs.existsSync(LOG_FILE)) {
    try {
      syncLog = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
    } catch (e) {
      console.warn("Registre sync corrompu, réinitialisation.");
    }
  }
  if (!Array.isArray(syncLog.synced)) syncLog.synced = [];

  const candidates = [];

  // 1. Photos de data/photos.json
  if (fs.existsSync(PHOTOS_FILE)) {
    try {
      const photos = JSON.parse(fs.readFileSync(PHOTOS_FILE, "utf8"));
      photos.forEach(p => {
        if (p.imageUrl) {
          candidates.push({
            id: p.id,
            source: "photos",
            title: p.title || "Photographie terrain",
            description: p.description || p.title || "William Guindon — williamguindon.me",
            imageUrl: p.imageUrl,
            date: p.date
          });
        }
      });
    } catch (e) {
      console.warn("Erreur lecture photos.json:", e);
    }
  }

  // 2. Images d'articles de blog dans data/blog.json
  if (fs.existsSync(BLOG_FILE)) {
    try {
      const blog = JSON.parse(fs.readFileSync(BLOG_FILE, "utf8"));
      blog.forEach(b => {
        const img = b.coverImage || b.image;
        if (img) {
          candidates.push({
            id: "blog-" + (b.slug || b.id),
            source: "blog",
            title: b.title || "Article de blog",
            description: (b.title ? b.title + " — " : "") + "Article de blog de William Guindon (williamguindon.me)",
            imageUrl: img,
            date: b.date
          });
        }
      });
    } catch (e) {
      console.warn("Erreur lecture blog.json:", e);
    }
  }

  const toUpload = candidates.filter(c => !syncLog.synced.some(s => s.id === c.id));

  if (toUpload.length === 0) {
    console.log("✔ Toutes les photos et images de blog sont déjà synchronisées avec Google Photos.");
    process.exit(0);
  }

  console.log(`📡 ${toUpload.length} image(s) à téléverser vers Google Photos.\n`);

  console.log("1. Authentification Google OAuth 2.0...");
  const accessToken = await getAccessToken();
  console.log("✔ Token d'accès obtenu.");

  console.log("2. Vérification de l'album Google Photos...");
  const albumId = await getOrCreateAlbum(accessToken, syncLog.albumId);
  syncLog.albumId = albumId;
  console.log(`✔ Album ciblé : ${albumId || "Bibliothèque principale"}\n`);

  for (let i = 0; i < toUpload.length; i++) {
    const item = toUpload[i];
    console.log(`[${i + 1}/${toUpload.length}] Téléversement : "${item.title}" (${item.id})...`);

    try {
      const { buffer, mimeType, fileName } = await getImageBuffer(item);
      const uploadToken = await uploadToGooglePhotos(accessToken, buffer, mimeType);
      const mediaItem = await createMediaItem(
        accessToken,
        uploadToken,
        fileName,
        `${item.title} — William Guindon (williamguindon.me)`,
        albumId
      );

      console.log(`✔ Réussi : ${mediaItem.productUrl || mediaItem.id}`);

      syncLog.synced.push({
        id: item.id,
        source: item.source,
        title: item.title,
        googlePhotosUrl: mediaItem.productUrl || null,
        mediaItemId: mediaItem.id,
        albumId: albumId,
        syncedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(`❌ Erreur sur ${item.id} : ${err.message}`);
    }
  }

  syncLog.lastSync = new Date().toISOString();
  fs.writeFileSync(LOG_FILE, JSON.stringify(syncLog, null, 2) + "\n", "utf8");
  console.log("\n✔ Registre data/google-photos-sync-log.json mis à jour.");
}

main().catch(err => {
  console.error("Erreur critique:", err);
  process.exit(1);
});
