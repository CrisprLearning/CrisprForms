import React, { useMemo, useState, useRef, useEffect } from 'react';
import { submitForm } from './lib/api.js';
import SignaturePad from './SignaturePad.jsx';
import logoSvg from './images/logo.svg?raw';

const INPUT_TYPES = { number: 'number', email: 'email', tel: 'tel', date: 'date' };

// Circumference of the progress ring (r=19 in its 44×44 viewBox).
const RING_CIRCUMFERENCE = 2 * Math.PI * 19;

// Render inline markup in note / intro text: **bold**, [text](url) links,
// and bare URLs / email addresses become clickable links.
function renderRich(text) {
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g;
  return String(text).split(pattern).map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={idx}>{part.slice(2, -2)}</strong>;
    const md = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (md) {
      const isMail = md[2].startsWith('mailto:');
      return <a key={idx} href={md[2]} {...(isMail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>{md[1]}</a>;
    }
    if (/^https?:\/\//.test(part)) return <a key={idx} href={part} target="_blank" rel="noopener noreferrer">{part}</a>;
    if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(part)) return <a key={idx} href={`mailto:${part}`}>{part}</a>;
    return part;
  });
}

// Text-field input rule: keep only letters, digits, comma and space, then
// capitalise the first letter of every space-separated word.
function transformText(raw) {
  return raw
    .replace(/[^a-zA-Z0-9, ]/g, '')
    .replace(/(^|\s)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

// Flatten the template into the list of value-bearing fields: drops section
// headings and expands a scoreTable into one number field per column. Used for
// init, validation and progress so each score column is tracked individually.
function valueFields(fields) {
  const out = [];
  fields.forEach((f) => {
    if (f.type === 'section') return;
    if (f.type === 'scoreTable') {
      (f.columns || []).forEach((c) => out.push({ key: c.key, type: 'number', required: !!c.required }));
    } else {
      out.push(f);
    }
  });
  return out;
}

function initialValues(fields, initialData) {
  const out = {};
  valueFields(fields).forEach((f) => {
    if (initialData && f.key in initialData) { out[f.key] = initialData[f.key]; return; }
    if ('default' in f) { out[f.key] = f.default; return; }
    if (f.type === 'checkbox') out[f.key] = false;
    else if (f.type === 'signature') out[f.key] = null; // signedOn timestamp
    else out[f.key] = '';
  });
  return out;
}

// Normalise a stored signature into an <img> src. New captures are already a
// "data:image/png;base64,…" URL; tolerate a bare base64 string from the backend.
function signatureSrc(v) {
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

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(Number(ts));
  if (Number.isNaN(d.getTime())) return String(ts);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day} ${month} ${d.getFullYear()}, ${time}`;
}

export default function SubmissionForm({
  template,
  formKey,
  recipient,
  onSubmitted,
  mode = 'submit',
  initialData = null,
  submittedAt = null,
  alreadySubmitted = false,
}) {
  const { fields } = template;

  const [values, setValues] = useState(() => initialValues(fields, initialData));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [focused, setFocused] = useState(null);
  // Final-preview step: after a valid submit, the form is shown read-only with
  // Edit / Confirm actions; only Confirm actually sends the submission.
  const [reviewing, setReviewing] = useState(false);
  // Set once the submission is accepted — swaps to the confirmation view.
  const [submitted, setSubmitted] = useState(false);

  const isRead = mode === 'read';
  // Read mode, preview mode, and the final-review step are all non-editable.
  const disabled = mode !== 'submit' || reviewing;
  // Signature has no stored image to redraw, so show the signed-on stamp in any
  // read-only context (read mode or the review step) instead of a blank canvas.
  const showSignatureStamp = isRead || reviewing;

  // Draggable progress ring: horizontal position + click-to-celebrate state.
  const ringRef = useRef(null);
  const dragRef = useRef(null);
  const labelTimer = useRef(null);
  const pulseTimer = useRef(null);
  const [ringLeft, setRingLeft] = useState(null); // null → anchored to the right
  const [ringActive, setRingActive] = useState(false);
  const [ringPulse, setRingPulse] = useState(false);

  useEffect(() => () => { clearTimeout(labelTimer.current); clearTimeout(pulseTimer.current); }, []);

  function ringPointerDown(e) {
    const rect = ringRef.current.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, originLeft: rect.left, moved: false };
    try { ringRef.current.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  }

  function ringPointerMove(e) {
    const ds = dragRef.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    if (Math.abs(dx) > 4) ds.moved = true;
    const maxLeft = window.innerWidth - 56 - 8;
    setRingLeft(Math.min(Math.max(ds.originLeft + dx, 8), maxLeft));
  }

  function ringPointerUp(e) {
    const ds = dragRef.current;
    dragRef.current = null;
    try { ringRef.current.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    if (ds && !ds.moved) celebrateRing();
  }

  function celebrateRing() {
    setRingActive(true);
    clearTimeout(labelTimer.current);
    labelTimer.current = setTimeout(() => setRingActive(false), 2200);
    // Restart the pop animation even on repeat clicks.
    setRingPulse(false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setRingPulse(true);
      clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setRingPulse(false), 420);
    }));
  }

  const recipientName = recipient?.recipientName;

  // Completion progress — every input field (not section headings) contributes.
  const inputFields = useMemo(() => valueFields(fields), [fields]);
  const progress = useMemo(() => {
    if (inputFields.length === 0) return 0;
    const filled = inputFields.filter((f) => {
      const v = values[f.key];
      if (f.type === 'checkbox') return v === true;
      if (f.type === 'signature') return Boolean(v);
      return String(v ?? '').trim() !== '';
    }).length;
    return Math.round((filled / inputFields.length) * 100);
  }, [inputFields, values]);

  function setValue(key, value) {
    setValues((cur) => ({ ...cur, [key]: value }));
    setErrors((cur) => (cur[key] ? { ...cur, [key]: null } : cur));
  }

  function validate() {
    const next = {};
    valueFields(fields).forEach((f) => {
      const v = values[f.key];
      const str = String(v ?? '').trim();
      if (f.required) {
        if (f.type === 'checkbox' && !v) { next[f.key] = 'This must be checked.'; return; }
        if (f.type === 'signature' && !v) { next[f.key] = 'A signature is required.'; return; }
        if (f.type !== 'checkbox' && f.type !== 'signature' && !str) { next[f.key] = 'This field is required.'; return; }
      }
      if (!str) return; // optional and empty — skip format checks
      if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) next[f.key] = 'Enter a valid email address.';
      else if (f.pattern && !new RegExp(f.pattern).test(str)) next[f.key] = f.patternMessage || 'Invalid format.';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // Submitting the form (button or Enter key) validates and opens the review
  // step rather than sending straight away.
  function handleReview(e) {
    e.preventDefault();
    if (mode !== 'submit' || reviewing) return;
    setSubmitError(null);
    if (!validate()) return;
    setReviewing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleEdit() {
    setSubmitError(null);
    setReviewing(false);
  }

  async function handleConfirm() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitForm(template.id, formKey, values);
      setSubmitting(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err?.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  }

  // Build the recorded answers into a PDF and download it directly. We generate
  // the file client-side with jsPDF instead of relying on the browser print
  // dialog — mobile Chrome's "Save as PDF" pipeline is unreliable, so a direct
  // download works consistently across desktop and mobile. Each form section
  // becomes a heading + 40:60 two-column table; scoreTable columns and the
  // signature image each become their own row.
  async function handlePrint() {
    if (printing) return;
    setPrinting(true);
    try {
      // Lazy-load the PDF library so it (and its sizeable deps) only download
      // when the user actually requests a PDF, keeping initial load fast.
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
    } finally {
      setPrinting(false);
    }
  }

  const renderedFields = useMemo(() => {
  const floated = (f) => focused === f.key || String(values[f.key] ?? '').trim() !== '';
  return fields.map((f, i) => {
    if (f.type === 'section') {
      const notes = f.note == null ? [] : (Array.isArray(f.note) ? f.note : [f.note]);
      return (
        <React.Fragment key={`section-${i}`}>
          <h2 className="forms-section">{f.label}</h2>
          {notes.map((n, ni) => (
            <p key={ni} className={`forms-section-note ${f.noteEmphasis ? 'is-emphasis' : (template.termsNotes ? 'forms-section-terms' : '')}`}>{renderRich(n)}</p>
          ))}
          {f.bullets && (
            <ul className={`forms-section-list ${template.termsNotes ? 'forms-section-terms' : ''}`}>
              {f.bullets.map((b, bi) => <li key={bi}>{renderRich(b)}</li>)}
            </ul>
          )}
          {f.footnote != null && (Array.isArray(f.footnote) ? f.footnote : [f.footnote]).map((n, ni) => (
            <p key={`fn-${ni}`} className={`forms-section-note ${template.termsNotes ? 'forms-section-terms' : ''}`}>{renderRich(n)}</p>
          ))}
        </React.Fragment>
      );
    }

    if (f.type === 'scoreTable') {
      return (
        <div key={`scoretable-${i}`} className="forms-field">
          <label className="forms-label">{f.label}{f.required && <span className="forms-req"> *</span>}</label>
          <div className="forms-scoretable">
            {(f.columns || []).map((c) => (
              <div key={c.key} className="forms-score-row">
                <span className="forms-score-label">{c.label}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="00.00"
                  className="forms-input forms-score-input"
                  value={values[c.key] ?? ''}
                  disabled={disabled}
                  onChange={(e) => {
                    // Allow only 00.00–100.00 with up to 2 decimal places (e.g. 87.5, 92.25)
                    const raw = e.target.value;
                    if (raw !== '' && !/^\d{0,3}(\.\d{0,2})?$/.test(raw)) return;
                    if (raw !== '' && Number(raw) > 100) return;
                    setValue(c.key, raw);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    const err = errors[f.key];
    const label = (
      <label className="forms-label" htmlFor={`fld-${f.key}`}>
        {f.label}{f.required && <span className="forms-req"> *</span>}
      </label>
    );

    if (f.type === 'signature') {
      // In read-only contexts there is no canvas to redraw — show the captured
      // signature as a signed-on stamp instead.
      if (showSignatureStamp) {
        return (
          <div key={f.key} className="forms-field">
            {label}
            <div className="forms-read-signature">
              {values[f.key]
                ? <img src={signatureSrc(values[f.key])} alt="Signature" className="forms-sig-image" />
                : 'Not signed'}
            </div>
          </div>
        );
      }
      return (
        <div key={f.key} className="forms-field">
          {label}
          <SignaturePad disabled={disabled} defaultSigned={Boolean(values[f.key])} onChange={(dataUrl) => setValue(f.key, dataUrl)} />
          {err && <span className="forms-error">{err}</span>}
        </div>
      );
    }

    if (f.type === 'checkbox') {
      return (
        <div key={f.key} className="forms-field">
          <label className="forms-check">
            <input
              type="checkbox"
              checked={!!values[f.key]}
              disabled={disabled}
              onChange={(e) => setValue(f.key, e.target.checked)}
            />
            <span>{f.label}{f.required && <span className="forms-req"> *</span>}</span>
          </label>
          {err && <span className="forms-error">{err}</span>}
        </div>
      );
    }

    const floatLabel = (
      <label className="forms-label" htmlFor={`fld-${f.key}`}>
        {f.label}{f.required && <span className="forms-req"> *</span>}
      </label>
    );

    if (f.type === 'select') {
      return (
        <div key={f.key} className={`forms-field forms-float ${floated(f) ? 'is-float' : ''}`}>
          <select
            id={`fld-${f.key}`}
            className={`forms-input ${err ? 'has-error' : ''}`}
            value={values[f.key]}
            disabled={disabled}
            onFocus={() => setFocused(f.key)}
            onBlur={() => setFocused(null)}
            onChange={(e) => setValue(f.key, e.target.value)}
          >
            <option value="" disabled hidden></option>
            {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {floatLabel}
          {f.hint && <span className="forms-hint">{f.hint}</span>}
          {err && <span className="forms-error">{err}</span>}
        </div>
      );
    }

    return (
      <div key={f.key} className={`forms-field forms-float ${floated(f) ? 'is-float' : ''}`}>
        <input
          id={`fld-${f.key}`}
          type={f.type === 'number' ? 'text' : (INPUT_TYPES[f.type] || 'text')}
          inputMode={f.type === 'number' || f.maxDigits ? 'numeric' : undefined}
          min={f.min}
          max={f.max}
          className={`forms-input ${err ? 'has-error' : ''}`}
          value={values[f.key]}
          disabled={disabled}
          onFocus={() => setFocused(f.key)}
          onBlur={() => setFocused(null)}
          onChange={(e) => {
            if (f.type === 'number') {
              const raw = e.target.value;
              const allowNeg = f.min < 0;
              const pattern = allowNeg ? /^-?\d*$/ : /^\d*$/;
              if (!pattern.test(raw)) return;
              if (raw === '' || raw === '-') { setValue(f.key, raw); return; }
              const n = Number(raw);
              if (f.min != null && n < f.min) return;
              if (f.max != null && n > f.max) return;
              setValue(f.key, raw);
              return;
            }
            if (f.type === 'tel') {
              // Only "+" and digits 0-9 allowed in mobile number inputs
              const cleaned = e.target.value.replace(/[^\d+]/g, '');
              setValue(f.key, cleaned);
              return;
            }
            if (f.maxDigits) {
              // Digits only, capped at maxDigits (e.g. 6-digit Pin Code)
              const digits = e.target.value.replace(/\D/g, '').slice(0, f.maxDigits);
              setValue(f.key, digits);
              return;
            }
            setValue(f.key, (f.type === 'text' && !f.freeText) ? transformText(e.target.value) : e.target.value);
          }}
        />
        {floatLabel}
        {f.hint && <span className="forms-hint">{f.hint}</span>}
        {err && <span className="forms-error">{err}</span>}
      </div>
    );
  });
  }, [fields, values, errors, disabled, showSignatureStamp, focused]);

  if (submitted) {
    return (
      <div className="forms-state">
        <div className="forms-state-card forms-state-success">
          <div className="forms-state-icon">✓</div>
          <h1>Form Submitted</h1>
          <p>Your response has been recorded successfully. Thank you!</p>
          <button type="button" className="forms-submit forms-print forms-confirm-download" onClick={handlePrint} disabled={printing}>
            {printing ? 'Generating PDF…' : 'Download PDF for Reference'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forms-page">
      {mode === 'submit' && !reviewing && (
        <div
          ref={ringRef}
          className={`forms-progress-ring ${ringActive ? 'is-active' : ''} ${ringPulse ? 'is-pulse' : ''}`}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          style={ringLeft != null ? { left: `${ringLeft}px`, right: 'auto' } : undefined}
          onPointerDown={ringPointerDown}
          onPointerMove={ringPointerMove}
          onPointerUp={ringPointerUp}
        >
          <svg viewBox="0 0 44 44" width="46" height="46">
            <circle className="forms-ring-track" cx="22" cy="22" r="19" />
            <circle
              className="forms-ring-fill"
              cx="22"
              cy="22"
              r="19"
              style={{ strokeDasharray: RING_CIRCUMFERENCE, strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress / 100) }}
            />
          </svg>
          <span className="forms-ring-label">{progress}%</span>
          <span className={`forms-ring-toast ${ringActive ? 'is-show' : ''}`}>
            You&apos;ve Completed {progress}% of the Form
          </span>
        </div>
      )}
      <form className="forms-card" onSubmit={handleReview} noValidate>
        {alreadySubmitted && (
          <div className="forms-submitted-banner">
            This form was already submitted{submittedAt ? ` at ${formatTimestamp(submittedAt)}` : ''}.
          </div>
        )}
        <div className="forms-head">
          <h1>{template.title}</h1>
          {template.intro && (Array.isArray(template.intro) ? template.intro : [template.intro]).map((p, ii) => (
            <p key={ii} className="forms-intro">{renderRich(p)}</p>
          ))}
          <div className="forms-meta">
            <span className="forms-badge">v{template.version}</span>
            {mode === 'preview' && <span className="forms-recipient">Preview — read only</span>}
            {reviewing && <span className="forms-recipient">Review &amp; confirm</span>}
            {isRead && recipientName && <span className="forms-recipient">{recipientName}</span>}
            {isRead && submittedAt && <span className="forms-recipient">Submitted {formatTimestamp(submittedAt)}</span>}
          </div>
        </div>

        <div className="forms-body">
          {reviewing && (
            <div className="forms-review-banner">
              Please review your details below, then tap <strong>Confirm</strong> to submit. Tap <strong>Edit</strong> to make changes.
            </div>
          )}
          {renderedFields}
          {submitError && <div className="forms-submit-error">{submitError}</div>}
        </div>

        <div className={`forms-foot ${reviewing ? 'is-sticky' : ''}`}>
          {isRead ? (
            <button type="button" className="forms-submit forms-print" onClick={handlePrint} disabled={printing}>
              {printing ? 'Generating PDF…' : 'Save PDF'}
            </button>
          ) : reviewing ? (
            <div className="forms-review-actions">
              <button type="button" className="forms-edit" onClick={handleEdit} disabled={submitting}>
                Edit
              </button>
              <button type="button" className="forms-submit" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Confirm'}
              </button>
            </div>
          ) : (
            <button type="submit" className="forms-submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Review and Submit'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
