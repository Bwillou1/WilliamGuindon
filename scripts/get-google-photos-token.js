/**
 * scripts/get-google-photos-token.js
 * Utilitaire interactif pour générer le GOOGLE_PHOTOS_REFRESH_TOKEN nécessaire à GitHub Actions.
 *
 * Usage :
 *   node scripts/get-google-photos-token.js
 * ou :
 *   GOOGLE_PHOTOS_CLIENT_ID="votre_id" GOOGLE_PHOTOS_CLIENT_SECRET="votre_secret" node scripts/get-google-photos-token.js
 */

const http = require("http");
const readline = require("readline");

const PORT = 8085;
const REDIRECT_URI = "http://localhost:" + PORT + "/oauth2callback";
const SCOPE = "https://www.googleapis.com/auth/photoslibrary.appendonly https://www.googleapis.com/auth/photoslibrary.sharing";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function run() {
  console.log("=== Assistant de configuration Google Photos (OAuth 2.0) ===\n");
  console.log("Cet utilitaire va vous aider à obtenir un REFRESH_TOKEN permanent");
  console.log("pour que GitHub Actions puisse téléverser automatiquement vos photos.\n");

  let clientId = process.env.GOOGLE_PHOTOS_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_PHOTOS_CLIENT_SECRET;

  if (!clientId) {
    console.log("1. Allez sur Google Cloud Console : https://console.cloud.google.com");
    console.log("2. Activez 'Photos Library API'");
    console.log("3. Créez un ID client OAuth 2.0 (Type: Application Web)");
    console.log("   -> URI de redirection autorisés : " + REDIRECT_URI + "\n");
    clientId = (await question("Entrez votre CLIENT_ID : ")).trim();
  }

  if (!clientSecret) {
    clientSecret = (await question("Entrez votre CLIENT_SECRET : ")).trim();
  }

  if (!clientId || !clientSecret) {
    console.error("Identifiants manquants. Annulation.");
    rl.close();
    process.exit(1);
  }

  const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent"
  }).toString();

  console.log("\n2. Ouvrez ce lien dans votre navigateur pour autoriser la publication :\n");
  console.log(authUrl);
  console.log("\nEn attente de connexion sur " + REDIRECT_URI + "...\n");

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, "http://localhost:" + PORT);
      if (parsedUrl.pathname === "/oauth2callback") {
        const code = parsedUrl.searchParams.get("code");
        const error = parsedUrl.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>Erreur d'autorisation : " + error + "</h1>");
          console.error("Erreur reçue : " + error);
          server.close();
          rl.close();
          return;
        }

        if (code) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1 style='color:#0d652d;font-family:sans-serif;'>✔ Autorisation réussie !</h1><p style='font-family:sans-serif;'>Vous pouvez fermer cet onglet et revenir à votre terminal.</p>");

          console.log("Code d'autorisation reçu. Échange avec Google contre un Refresh Token...");

          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code: code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: REDIRECT_URI,
              grant_type: "authorization_code"
            })
          });

          if (!tokenRes.ok) {
            const errBody = await tokenRes.text();
            throw new Error("Erreur token Google : " + errBody);
          }

          const tokenData = await tokenRes.json();
          const refreshToken = tokenData.refresh_token;

          console.log("\n=======================================================");
          console.log("🎉 CONFIGURATION RÉUSSIE !");
          console.log("=======================================================\n");
          console.log("Ajoutez ces 3 secrets dans votre dépôt GitHub :");
          console.log("(Sur GitHub : Settings -> Secrets and variables -> Actions -> New repository secret)\n");
          console.log("1. Nom : GOOGLE_PHOTOS_CLIENT_ID");
          console.log("   Valeur : " + clientId + "\n");
          console.log("2. Nom : GOOGLE_PHOTOS_CLIENT_SECRET");
          console.log("   Valeur : " + clientSecret + "\n");
          console.log("3. Nom : GOOGLE_PHOTOS_REFRESH_TOKEN");
          console.log("   Valeur : " + refreshToken + "\n");
          console.log("=======================================================\n");

          server.close();
          rl.close();
          process.exit(0);
        }
      }
    } catch (e) {
      console.error("Erreur serveur:", e.message);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Erreur interne");
      server.close();
      rl.close();
      process.exit(1);
    }
  });

  server.listen(PORT);
}

run().catch(err => {
  console.error("Erreur:", err.message);
  rl.close();
  process.exit(1);
});
