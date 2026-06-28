// HTTP transport for the public forms runtime.
//
// The app is opened as:
//   /submission?id=<FORM_ID>&key=<RECIPIENT_KEY>
// where `key` is the unique, single-use token tying a dispatched form to the
// person it was sent to. Every call carries the key so the backend can resolve
// the recipient and record the submission against them.

import { API_BASE, USE_MOCK } from '../config.js';

const BASE = `${API_BASE}/api/forms`;

// Public PHP endpoints that back the live submission flow.
const PUBLIC_FORMS_BASE = 'https://crisprtech.app/crispr-apis/public/forms';

async function parseError(res) {
  let body = null;
  try { body = await res.json(); } catch { /* ignore */ }
  const env = body?.error || {};
  const err = new Error(env.message || `HTTP ${res.status}`);
  err.code = env.code || (res.status === 404 ? 'NOT_FOUND' : res.status === 410 ? 'ALREADY_SUBMITTED' : 'HTTP_ERROR');
  err.status = res.status;
  return err;
}

// Resolve the recipient behind a key and confirm the form is still open.
// Returns { recipientName, submitted, prefill } — any field may be absent.
export async function fetchRecipient(formId, key) {
  if (USE_MOCK) {
    return { recipientName: 'Demo Recipient', submitted: false, prefill: {} };
  }
  const res = await fetch(`${BASE}/submission?id=${encodeURIComponent(formId)}&key=${encodeURIComponent(key)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw await parseError(res);
  const body = await res.json();
  return body.data || body;
}

// Resolve a read-only view of a completed submission from its `secret`.
// The secret encodes the user id + submission id server-side; the backend
// returns the recorded answers so they can be rendered uneditable.
// Returns { recipientName, submittedAt, data }.
export async function fetchSubmission(formId, secret) {
  if (USE_MOCK) {
    return {
      recipientName: 'Abhijith C S',
      submittedAt: 1717372839492,
      data: {
        studentName: 'Abhijith C S',
        gender: 'Male',
        bloodGroup: 'O+',
        dob: '2006-06-09',
        dateOfAdmission: '2024-06-01',
        mothersName: 'Suja C',
        fathersName: 'Sunil C',
        permanentAddress: '12 Garden Lane, Malappuram',
        permanentPincode: '676505',
        communicationAddress: '12 Garden Lane, Malappuram',
        communicationPincode: '676505',
        contactNumber: '+91 98470 12345',
        whatsappNumber: '+91 98470 12345',
        email: 'abhijith@example.com',
        studentAppAccessNumber: 'STU-1341',
        parentAppAccessNumber: 'PAR-1341',
        previousInstitute: 'Govt. HSS Malappuram',
        boardType: 'State',
        physicsScore: '92',
        chemistryScore: '88',
        mathsScore: '95',
        biologyScore: '90',
        iatScore: '210',
        signedOn: 1717372839492,
      },
    };
  }
  const res = await fetch(`${BASE}/read?id=${encodeURIComponent(formId)}&secret=${encodeURIComponent(secret)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw await parseError(res);
  const body = await res.json();
  return body.data || body;
}

// Fetch any previously recorded responses for this recipient's form.
// Returns the raw response body; the caller decides whether it holds answers.
// A recipient who has not submitted yet yields an empty/absent `data`.
export async function fetchFormResponses(formId, key) {
  if (USE_MOCK) {
    return { data: null };
  }
  const res = await fetch(`${PUBLIC_FORMS_BASE}/fetch.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id: formId, key }),
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON body */ }

  // "No submission found" is the expected first-time state, not a failure —
  // return empty so the caller leaves the form open for the user to fill in.
  const message = String(body?.message || body?.error?.message || '').toLowerCase();
  if (message.includes('no submission')) return { data: null };

  if (!res.ok) {
    const env = body?.error || {};
    const err = new Error(env.message || body?.message || `HTTP ${res.status}`);
    err.code = env.code || (res.status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR');
    err.status = res.status;
    throw err;
  }
  return body;
}

// --- Admin view -----------------------------------------------------------
// The admin view is opened as /admin-view?id=<mobile> and looks up the
// submission status of every form for that mobile number, then lets a reviewer
// open any submitted form as a PDF. Both calls hit admin-fetch.php via GET.

const ADMIN_FETCH = `${PUBLIC_FORMS_BASE}/admin-fetch.php`;

// Fetch the submission status of all forms for a mobile number.
//   admin-fetch.php?mobile=<mobile>
// The response embeds each form's recorded `data`, so the caller can render a
// PDF straight from this without a second request.
export async function fetchAdminFormStatuses(mobile) {
  const res = await fetch(`${ADMIN_FETCH}?mobile=${encodeURIComponent(mobile)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// Fetch one form's recorded answers for a mobile number, for the PDF.
//   admin-fetch.php?mobile=<mobile>&id=<FORM_ID>
export async function fetchAdminFormData(mobile, formId) {
  const res = await fetch(
    `${ADMIN_FETCH}?mobile=${encodeURIComponent(mobile)}&id=${encodeURIComponent(formId)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// Submit the completed form. `data` is keyed by the template field keys.
export async function submitForm(formId, key, data) {
  if (USE_MOCK) {
    return { ok: true, submittedAt: Date.now(), data };
  }
  const res = await fetch(`${PUBLIC_FORMS_BASE}/submit.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id: formId, key, data }),
  });
  if (!res.ok) throw await parseError(res);
  const body = await res.json();
  return body.data || body;
}
