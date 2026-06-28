// Client-side PDF generation for a recorded form submission.
//
// We build the file with jsPDF (lazy-loaded) instead of the browser print
// dialog — mobile Chrome's "Save as PDF" pipeline is unreliable, so a direct
// download works consistently across desktop and mobile. Each form section
// becomes a heading + 40:60 two-column table; scoreTable columns and the
// signature image each become their own row.
//
// Shared by SubmissionForm (the recipient's own "Download PDF") and the admin
// view ("View PDF" per form), so the output is identical in both places.

import logoSvg from '../images/logo.svg?raw';

// Normalise a stored signature into an <img> src. New captures are already a
// "data:image/png;base64,…" URL; tolerate a bare base64 string from the backend.
export function signatureSrc(v) {
  const s = String(v);
  return s.startsWith('data:') ? s : `data:image/png;base64,${s}`;
}

// Load a raster image (data URL) and resolve its natural dimensions, so the PDF
// can preserve the signature's aspect ratio. Resolves null if it fails to load.
function loadImageDims(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ dataUrl, w: img.naturalWidth || 300, h: img.naturalHeight || 120 });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

// Rasterize an inline SVG (the logo) to a PNG data URL for embedding in the PDF.
// Resolves null on any failure so the PDF can render without the logo.
function rasterizeSvg(svgRaw, targetWidthPx = 240) {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([svgRaw], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const ratio = img.height && img.width ? img.height / img.width : 0.3;
        const w = targetWidthPx;
        const h = Math.max(1, Math.round(targetWidthPx * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve({ dataUrl: canvas.toDataURL('image/png'), w, h });
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

// Reduce note markdown (**bold**, [text](url)) to plain text for the PDF.
function richToText(s) {
  return String(s)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

// "09:00 am, 23 June, 2026" — used for the PDF's submitted-at footer.
function formatSubmittedAt(ts) {
  const d = new Date(Number(ts));
  if (Number.isNaN(d.getTime())) return '';
  const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  const month = d.toLocaleString('en-US', { month: 'long' });
  return `${time}, ${d.getDate()} ${month}, ${d.getFullYear()}`;
}

// Render `values` (keyed by the template's field keys) into a downloaded PDF.
export async function generateFormPdf({ template, values, submittedAt = null }) {
  const { fields } = template;

  // Lazy-load the PDF library so it (and its sizeable deps) only download
  // when a PDF is actually requested, keeping initial load fast.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  // Collect the answers into section "blocks". Each row is either a text
  // value or a signature image (kept as a data URL for later embedding).
  const blocks = [];
  let current = { title: null, notes: [], rows: [] };
  const addRow = (label, value) => current.rows.push({ label, value });
  const addSig = (label, dataUrl) => current.rows.push({ label, sig: dataUrl });

  fields.forEach((f) => {
    if (f.type === 'section') {
      if (current.rows.length || current.notes.length) blocks.push(current);
      const notes = f.noteEmphasis && f.note != null
        ? (Array.isArray(f.note) ? f.note : [f.note]).map(richToText)
        : [];
      current = { title: f.label, notes, rows: [] };
      return;
    }
    if (f.type === 'scoreTable') {
      (f.columns || []).forEach((c) => {
        const v = String(values[c.key] ?? '').trim();
        addRow(c.label, v || '—');
      });
      return;
    }
    const v = values[f.key];
    if (f.type === 'signature') {
      if (v) addSig(f.label, signatureSrc(v));
      else addRow(f.label, '—');
    } else if (f.type === 'checkbox') {
      addRow(f.label, v ? 'Yes' : 'No');
    } else {
      const s = String(v ?? '').trim();
      addRow(f.label, s || '—');
    }
  });
  if (current.rows.length || current.notes.length) blocks.push(current);

  // Preload the logo (SVG → PNG) and every signature image so we have their
  // dimensions and decoded pixels before drawing. Failures resolve to null
  // and are simply skipped.
  const logo = await rasterizeSvg(logoSvg, 240);
  const sigRows = blocks.flatMap((b) => b.rows.filter((r) => r.sig));
  const sigDims = await Promise.all(sigRows.map((r) => loadImageDims(r.sig)));
  const sigDimMap = new Map();
  sigRows.forEach((r, i) => { if (sigDims[i]) sigDimMap.set(r.sig, sigDims[i]); });

  const docTitle = template.title || 'Form Response';
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const labelW = contentW * 0.4;
  const valueW = contentW - labelW;
  let cursorY = margin;

  // Logo, top-right.
  if (logo) {
    const logoW = 32; // mm
    const logoH = logoW * (logo.h / logo.w);
    doc.addImage(logo.dataUrl, 'PNG', pageW - margin - logoW, cursorY, logoW, logoH);
    cursorY += logoH + 2;
  }

  // Title.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text(docTitle, margin, cursorY + 4);
  cursorY += 10;

  blocks.forEach((b) => {
    if (b.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(b.title, contentW);
      doc.text(lines, margin, cursorY + 4);
      cursorY += lines.length * 5 + 2;
    }
    (b.notes || []).forEach((n) => {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(n, contentW);
      doc.text(lines, margin, cursorY + 3.5);
      cursorY += lines.length * 4.5 + 1;
    });

    if (!b.rows.length) return;

    autoTable(doc, {
      startY: cursorY + 1,
      margin: { left: margin, right: margin },
      tableWidth: contentW,
      styles: { fontSize: 9, cellPadding: 2, lineColor: [203, 213, 225], lineWidth: 0.2, textColor: [30, 41, 59], valign: 'top', overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: labelW, fontStyle: 'bold', fillColor: [241, 245, 249] },
        1: { cellWidth: valueW },
      },
      body: b.rows.map((r) => {
        if (r.sig) {
          const dim = sigDimMap.get(r.sig);
          // Reserve cell height for the signature (drawn in didDrawCell).
          const drawW = Math.min(valueW - 4, dim ? (dim.w / dim.h) * 28 : 60);
          const drawH = dim ? drawW * (dim.h / dim.w) : 24;
          return [r.label, { content: '', _sig: r.sig, _w: drawW, _h: drawH, styles: { minCellHeight: drawH + 4 } }];
        }
        return [r.label, r.value];
      }),
      didDrawCell: (data) => {
        const raw = data.cell.raw;
        if (raw && raw._sig) {
          try {
            doc.addImage(raw._sig, 'PNG', data.cell.x + 2, data.cell.y + 2, raw._w, raw._h);
          } catch { /* skip an image that fails to embed */ }
        }
      },
    });
    cursorY = doc.lastAutoTable.finalY + 4;
  });

  if (submittedAt) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Digitally submitted at ${formatSubmittedAt(submittedAt)}`, margin, cursorY + 4);
  }

  const fileName = `${docTitle}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'form-response';
  doc.save(`${fileName}.pdf`);
}
