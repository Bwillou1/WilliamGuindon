// Cloudflare Worker en TypeScript — Générateur dynamique de carte OpenGraph SVG
// Dossier SEM-26-003 · Grande Tourbière de Blainville · williamguindon.me

export interface Env {
  SITE_TITLE?: string;
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const title = escapeXml((url.searchParams.get('title') || env.SITE_TITLE || 'William Guindon — Dossier CCE SEM-26-003').slice(0, 90));
    const subtitle = escapeXml((url.searchParams.get('sub') || 'Protection de la Grande Tourbière de Blainville · ACEUM Art. 24.27 / 24.28').slice(0, 110));
    const badge = escapeXml((url.searchParams.get('badge') || 'REGISTRE PUBLIC · SEM-26-003').slice(0, 40));

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071a14"/>
      <stop offset="100%" stop-color="#0d2e23"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="56" y="56" width="1088" height="518" rx="24" fill="none" stroke="#10b981" stroke-opacity="0.35" stroke-width="2"/>
  <rect x="88" y="96" width="380" height="42" rx="21" fill="#10b981" fill-opacity="0.18" stroke="#10b981" stroke-opacity="0.6"/>
  <text x="112" y="123" fill="#6ee7b7" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" letter-spacing="1.2">${badge}</text>
  <text x="88" y="250" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800">${title}</text>
  <text x="88" y="325" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="400">${subtitle}</text>
  <text x="88" y="520" fill="#10b981" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600">williamguindon.me</text>
</svg>`;

    return new Response(svg, {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': 'public, max-age=3600'
      }
    });
  }
};
