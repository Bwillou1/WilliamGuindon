(function () {
  'use strict';

  const PDFLIB_URL = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
  let pdfLibPromise = null;

  // Chemin vectoriel simplifié du monogramme WG (issu de favicon.svg) en noir pur
  const WG_SVG_PATH = 'M 229 349 L 352 676 L 362 676 L 449 463 L 505 595 L 520 600 L 543 571 L 450 347 L 359 569 L 274 348 Z M 657 404 L 631 408 L 532 659 L 553 676 L 655 412 Z M 784 398 C 720 335 585 335 510 429 L 505 441 L 534 511 C 540 430 620 385 688 392 L 755 430 Z M 794 490 L 689 490 L 663 533 L 751 534 L 751 601 C 710 638 640 640 592 616 L 577 657 C 640 688 740 676 794 622 Z';

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

  async function downloadWatermarkedPdf(pdfUrl, filename, originPageUrl) {
    const cleanName = filename || String(pdfUrl).split('/').pop().split('?')[0] || 'document.pdf';
    const originText = originPageUrl || 'https://williamguindon.me';
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
      const muted = PDFLib.rgb(0.25, 0.25, 0.25);
      const stamp = formatTimestamp();
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width } = page.getSize();
        const marginX = 24;
        const barY = 18;

        page.drawLine({
          start: { x: marginX, y: barY + 12 },
          end: { x: Math.max(marginX + 40, width - marginX), y: barY + 12 },
          thickness: 0.45,
          color: black,
          opacity: 0.22
        });

        // Mini logo WG en noir (vecteur)
        if (typeof page.drawSvgPath === 'function') {
          try {
            page.drawSvgPath(WG_SVG_PATH, {
              x: marginX - 3,
              y: barY + 11,
              scale: 0.017,
              color: black,
              opacity: 0.92
            });
          } catch (_) {}
        }

        page.drawText('William Guindon', {
          x: marginX + 14,
          y: barY + 1.5,
          size: 7.5,
          font: fontBold,
          color: black,
          opacity: 0.88
        });

        const metaText = `Source : ${originText}  ·  Imprimé / Téléchargé le ${stamp}`;
        const textWidth = font.widthOfTextAtSize(metaText, 6.5);
        const rightX = Math.max(marginX + 95, width - marginX - textWidth);
        page.drawText(metaText, {
          x: rightX,
          y: barY + 1.8,
          size: 6.5,
          font,
          color: muted,
          opacity: 0.85
        });
      }

      const outBytes = await pdfDoc.save();
      triggerBlobDownload(new Blob([outBytes], { type: 'application/pdf' }), cleanName);
      return true;
    } catch (_) {
      triggerBlobDownload(pdfUrl, cleanName);
      return false;
    }
  }

  window.wgDownloadWatermarkedPdf = downloadWatermarkedPdf;
})();
