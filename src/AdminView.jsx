import React, { useEffect, useState } from 'react';
import { getTemplate } from './formTemplates.js';
import { fetchAdminFormStatuses, fetchAdminFormData } from './lib/api.js';
import { generateFormPdf } from './lib/pdf.js';

// The six forms a student completes, shown in this order. Titles come from the
// shared templates so they stay in sync with what recipients actually fill in.
const ADMIN_FORM_IDS = [
  'ADMISSION_FORM',
  'COURSE_TERMS_AND_CONDITIONS',
  'STUDENT_CODE_OF_CONDUCT',
  'DIGITAL_PRIVACY_CONSENT',
  'HOSTEL_REGISTRATION_FORM',
  'RESIDENCE_TERMS_AND_CONDITIONS',
];

const SUBMITTED_WORDS = new Set(['submitted', 'filled', 'completed', 'complete', 'done', 'yes', 'true', '1']);

// Map the admin-fetch status response onto { FORM_ID: entry } regardless of the
// envelope shape the backend returns (array of forms, object keyed by form id,
// or those nested under data / forms).
function statusMap(resp) {
  const root = (resp && typeof resp === 'object') ? resp : {};
  let body = root.data && typeof root.data === 'object' ? root.data : root;
  if (body.data && typeof body.data === 'object') body = body.data;

  const map = {};
  const ingest = (id, entry) => {
    if (id == null) return;
    map[String(id).toUpperCase()] = entry;
  };

  const arr = Array.isArray(body) ? body
    : Array.isArray(body.forms) ? body.forms
    : Array.isArray(root.forms) ? root.forms
    : null;
  if (arr) {
    arr.forEach((e) => ingest(e?.id ?? e?.form_id ?? e?.formId ?? e?.form, e));
  } else if (body && typeof body === 'object') {
    const obj = (body.forms && typeof body.forms === 'object') ? body.forms : body;
    Object.entries(obj).forEach(([k, v]) => ingest(k, v));
  }
  return map;
}

// Decide whether a form's status entry means "submitted", tolerating a boolean,
// a status string, or an object carrying a status / submitted_at.
function isSubmitted(entry) {
  if (entry == null) return false;
  if (entry === true) return true;
  if (typeof entry === 'string') return SUBMITTED_WORDS.has(entry.trim().toLowerCase());
  if (typeof entry === 'object') {
    if (entry.filled === true || entry.filled === 1) return true;
    if (entry.filled === false || entry.filled === 0) return false;
    const s = String(entry.status ?? entry.state ?? '').trim().toLowerCase();
    if (SUBMITTED_WORDS.has(s)) return true;
    if (entry.submitted === true || entry.submitted === 1) return true;
    if (entry.submitted_at || entry.submittedAt || entry.submitted_on) return true;
  }
  return false;
}

// Pull a submitted-at timestamp (ms) out of a status entry or a data response.
function submittedAtMs(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const raw = entry.submitted_at ?? entry.submittedAt ?? entry.submitted_on ?? null;
  if (raw == null) return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  // Heuristic: values below ~10^12 are seconds, not milliseconds.
  return n < 1e12 ? n * 1000 : n;
}

// Unwrap the recorded answers from the per-form data response, tolerating the
// same envelope shapes as the public fetch endpoint.
function extractData(resp) {
  if (!resp || typeof resp !== 'object') return null;
  let d = resp.data && typeof resp.data === 'object' ? resp.data : resp;
  if (d.data && typeof d.data === 'object') d = d.data;
  if (d.responses && typeof d.responses === 'object') d = d.responses;
  if (d.fields && typeof d.fields === 'object') d = d.fields;
  return (d && typeof d === 'object') ? d : null;
}

export default function AdminView({ initialId = '' }) {
  const [query, setQuery] = useState(initialId);
  const [status, setStatus] = useState(initialId ? 'loading' : 'idle'); // idle | loading | ready | error
  const [mobile, setMobile] = useState(initialId); // the id the current results belong to
  const [statuses, setStatuses] = useState({});
  const [error, setError] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(null); // form id currently generating a PDF
  const [pdfError, setPdfError] = useState(null);

  async function runSearch(id) {
    const term = String(id ?? '').trim();
    if (!term) return;
    setStatus('loading');
    setError(null);
    setPdfError(null);
    setMobile(term);
    // Keep the URL shareable / reload-safe.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('id', term);
      window.history.replaceState(null, '', url);
    } catch { /* ignore */ }
    try {
      const resp = await fetchAdminFormStatuses(term);
      setStatuses(statusMap(resp));
      setStatus('ready');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }

  // Auto-search when opened with ?id=<mobile>.
  useEffect(() => {
    if (initialId) runSearch(initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    runSearch(query);
  }

  async function viewPdf(formId, entry) {
    if (pdfBusy) return;
    const template = getTemplate(formId);
    if (!template) return;
    setPdfBusy(formId);
    setPdfError(null);
    try {
      // The status response already embeds each form's answers, so use those
      // directly; only hit the per-form endpoint if they're somehow missing.
      let data = extractData(entry);
      let submittedAt = submittedAtMs(entry);
      if (!data || !Object.keys(data).length) {
        const resp = await fetchAdminFormData(mobile, formId);
        data = extractData(resp);
        submittedAt = submittedAtMs(resp?.data ?? resp) ?? submittedAt;
      }
      if (!data || !Object.keys(data).length) {
        throw new Error('No submission data found for this form.');
      }
      await generateFormPdf({ template, values: data, submittedAt });
    } catch (err) {
      setPdfError({ formId, message: err?.message || 'Could not generate the PDF.' });
    } finally {
      setPdfBusy(null);
    }
  }

  return (
    <div className="forms-page">
      <div className="forms-card admin-card">
        <div className="admin-header">
          <h1>Form Submissions</h1>
          <p>Search by mobile number to see each form's status and download submitted forms as PDF.</p>
        </div>

        <form className="admin-search" onSubmit={onSubmit}>
          <input
            className="forms-input admin-search-input"
            type="text"
            inputMode="numeric"
            placeholder="Enter mobile number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="forms-submit admin-search-btn" disabled={status === 'loading' || !query.trim()}>
            {status === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </form>

        <div className="admin-results">
          {status === 'idle' && (
            <p className="admin-hint">Enter a mobile number above to look up form submissions.</p>
          )}
          {status === 'loading' && (
            <p className="admin-hint">Fetching form statuses…</p>
          )}
          {status === 'error' && (
            <p className="admin-error">{error?.message || 'Unable to fetch form statuses. Please try again.'}</p>
          )}
          {status === 'ready' && (
            <>
              <p className="admin-results-for">Results for <strong>{mobile}</strong></p>
              <ul className="admin-form-list">
                {ADMIN_FORM_IDS.map((formId) => {
                  const template = getTemplate(formId);
                  const entry = statuses[formId];
                  const submitted = isSubmitted(entry);
                  const busy = pdfBusy === formId;
                  return (
                    <li key={formId} className="admin-form-row">
                      <div className="admin-form-meta">
                        <span className="admin-form-title">{template?.title || formId}</span>
                        <span className={`admin-badge ${submitted ? 'is-submitted' : 'is-pending'}`}>
                          {submitted ? 'Submitted' : 'Not submitted'}
                        </span>
                      </div>
                      {submitted && (
                        <button
                          type="button"
                          className="admin-pdf-btn"
                          onClick={() => viewPdf(formId, entry)}
                          disabled={!!pdfBusy}
                        >
                          {busy ? 'Generating…' : 'View PDF'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {pdfError && (
                <p className="admin-error">{pdfError.message}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
