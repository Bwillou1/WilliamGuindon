(function () {
  'use strict';

  const PDFLIB_URL = '/assets/vendor/pdf-lib/pdf-lib.min.js';
  let pdfLibPromise = null;

  function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (pdfLibPromise) return pdfLibPromise;
    pdfLibPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PDFLIB_URL;
      s.async = true;
      s.onload = () => (window.PDFLib ? resolve(window.PDFLib) : reject(new Error('PDFLib indisponible')));
      s.onerror = () => reject(new Error('Échec chargement pdf-lib'));
      document.head.appendChild(s);
    });
    return pdfLibPromise;
  }

  function formatTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function triggerBlobDownload(blobOrUrl, filename) {
    const isBlob = blobOrUrl instanceof Blob;
    const url = isBlob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (isBlob) setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function drawMiniWgLogo(page, x, y, size, black) {
    // Mini monogramme vectoriel WG en noir pur (dimensions ~ size x size)
    const s = size / 12;
    const t = Math.max(0.85, s * 1.35);
    // Lettre W
    page.drawLine({ start: { x: x + 0.5 * s, y: y + 10 * s }, end: { x: x + 2.2 * s, y: y + 2 * s }, thickness: t, color: black });
    page.drawLine({ start: { x: x + 2.2 * s, y: y + 2 * s }, end: { x: x + 3.8 * s, y: y + 7.2 * s }, thickness: t, color: black });
    page.drawLine({ start: { x: x + 3.8 * s, y: y + 7.2 * s }, end: { x: x + 5.4 * s, y: y + 2 * s }, thickness: t, color: black });
    page.drawLine({ start: { x: x + 5.4 * s, y: y + 2 * s }, end: { x: x + 7.1 * s, y: y + 10 * s }, thickness: t, color: black });
    // Lettre G
    page.drawLine({ start: { x: x + 11.4 * s, y: y + 9.2 * s }, end: { x: x + 8.6 * s, y: y + 9.8 * s }, thickness: t, color: black });
    page.drawLine({ start: { x: x + 8.6 * s, y: y + 9.8 * s }, end: { x: x + 7.6 * s, y: y + 6 * s }, thickness: t, color: black });
    page.drawLine({ start: { x: x + 7.6 * s, y: y + 6 * s }, end: { x: x + 8.6 * s, y: y + 2.2 * s }, thickness: t, color: black });
    page.drawLine({ start: { x: x + 8.6 * s, y: y + 2.2 * s }, end: { x: x + 11.4 * s, y: y + 2.8 * s }, thickness: t, color: black });
    page.drawLine({ start: { x: x + 11.4 * s, y: y + 2.8 * s }, end: { x: x + 11.4 * s, y: y + 5.6 * s }, thickness: t, color: black });
    page.drawLine({ start: { x: x + 11.4 * s, y: y + 5.6 * s }, end: { x: x + 9.7 * s, y: y + 5.6 * s }, thickness: t, color: black });
  }

  async function downloadWatermarkedPdf(pdfUrl, filename, originPageUrl) {
    const cleanName = filename || String(pdfUrl).split('/').pop().split('?')[0] || 'document.pdf';
    const rawOrigin = originPageUrl || window.location.href || 'https://williamguindon.me';
    const originText = rawOrigin.length > 78 ? rawOrigin.slice(0, 75) + '...' : rawOrigin;
    try {
      const targetUrl = new URL(pdfUrl, window.location.origin);
      if (targetUrl.origin !== window.location.origin) {
        triggerBlobDownload(targetUrl.href, cleanName);
        return false;
      }
      const [PDFLib, res] = await Promise.all([
        loadPdfLib(),
        fetch(targetUrl.href)
      ]);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const bytes = await res.arrayBuffer();
      const pdfDoc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const black = PDFLib.rgb(0.05, 0.05, 0.05);
      const muted = PDFLib.rgb(0.22, 0.22, 0.22);
      const stamp = formatTimestamp();
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width } = page.getSize();
        const marginX = 24;
        const barY = 16;

        page.drawLine({
          start: { x: marginX, y: barY + 13 },
          end: { x: Math.max(marginX + 40, width - marginX), y: barY + 13 },
          thickness: 0.45,
          color: black,
          opacity: 0.25
        });

        drawMiniWgLogo(page, marginX, barY + 0.5, 10, black);

        page.drawText('William Guindon', {
          x: marginX + 14,
          y: barY + 2.5,
          size: 7.5,
          font: fontBold,
          color: black,
          opacity: 0.92
        });

        const metaText = `Source : ${originText}  ·  Imprimé le ${stamp}`;
        const textWidth = font.widthOfTextAtSize(metaText, 6.2);
        const rightX = Math.max(marginX + 95, width - marginX - textWidth);
        page.drawText(metaText, {
          x: rightX,
          y: barY + 2.8,
          size: 6.2,
          font,
          color: muted,
          opacity: 0.88
        });
      }

      const outBytes = await pdfDoc.save();
      triggerBlobDownload(new Blob([outBytes], { type: 'application/pdf' }), cleanName);
      return true;
    } catch (err) {
      console.warn('[WG PDF Watermark] repli direct:', err);
      triggerBlobDownload(pdfUrl, cleanName);
      return false;
    }
  }

  window.wgDownloadWatermarkedPdf = downloadWatermarkedPdf;
})();
