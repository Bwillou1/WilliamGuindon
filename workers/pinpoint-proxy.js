/**
 * Cloudflare Worker — Reverse Proxy pour intégration Google Pinpoint en <iframe>
 * William Guindon — Dossier SEM-26-003
 */

const TARGET_HOST = "journaliststudio.google.com";
const TARGET_ORIGIN = `https://${TARGET_HOST}`;
const DEFAULT_COLLECTION = "73bb813da3c5c4b0";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Gestion des requêtes préliminaires CORS (Preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 2. Construction de l'URL cible vers Google Pinpoint
    let relativePath = url.pathname.replace(/^\/api\/pinpoint-proxy\/?/, "/");
    if (!relativePath || relativePath === "/" || relativePath === "") {
      relativePath = "/pinpoint/search";
    } else if (!relativePath.startsWith("/pinpoint/")) {
      relativePath = "/pinpoint" + (relativePath.startsWith("/") ? relativePath : "/" + relativePath);
    }

    const targetUrl = new URL(relativePath + url.search, TARGET_ORIGIN);
    if (targetUrl.pathname === "/pinpoint/search" && !targetUrl.searchParams.has("collection")) {
      targetUrl.searchParams.set("collection", DEFAULT_COLLECTION);
    }

    // 3. Préparation des en-têtes de requête
    const forwardHeaders = new Headers(request.headers);
    forwardHeaders.set("Host", TARGET_HOST);
    forwardHeaders.set("Origin", TARGET_ORIGIN);
    forwardHeaders.set("Referer", `${TARGET_ORIGIN}/`);
    forwardHeaders.set("User-Agent", request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    
    forwardHeaders.delete("Sec-Fetch-Dest");
    forwardHeaders.delete("Sec-Fetch-Mode");
    forwardHeaders.delete("Sec-Fetch-Site");

    // 4. Exécution de la requête vers Google Pinpoint
    let response;
    try {
      response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: forwardHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow",
      });
    } catch (err) {
      return new Response(`Erreur de connexion au serveur source : ${err.message}`, { status: 502 });
    }

    // 5. Modification des en-têtes de réponse (Suppression des blocages iframe)
    const newHeaders = new Headers(response.headers);
    
    newHeaders.delete("x-frame-options");
    newHeaders.delete("content-security-policy");
    newHeaders.delete("content-security-policy-report-only");
    newHeaders.delete("cross-origin-opener-policy");
    newHeaders.delete("cross-origin-embedder-policy");
    newHeaders.delete("cross-origin-resource-policy");

    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Credentials", "true");

    const contentType = response.headers.get("content-type") || "";

    // 6. Réécriture du code HTML pour fixer les chemins relatifs (CSS/JS/Images)
    if (contentType.includes("text/html")) {
      const rewriter = new HTMLRewriter()
        .on("head", {
          element(element) {
            element.prepend(`<base href="${TARGET_ORIGIN}/" target="_blank">`, { html: true });
          },
        })
        .on("a", {
          element(element) {
            if (!element.getAttribute("target")) {
              element.setAttribute("target", "_blank");
            }
          },
        });

      return rewriter.transform(new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      }));
    }

    // 7. Retour direct pour les fichiers statiques / API RPC
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
