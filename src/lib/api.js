// HTTP transport for the public forms runtime.
//
// The app is opened as:
//   /submission?id=<FORM_ID>&key=<RECIPIENT_KEY>
// where `key` is the unique, single-use token tying a dispatched form to the
// person it was sent to. Every call carries the key so the backend can resolve
// the recipient and record the submission against them.

import { API_BASE, USE_MOCK } from '../config.js';

const BASE = `${API_BASE}/api/forms`;

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

// Submit the completed form. `data` is keyed by the template field keys.
export async function submitForm(formId, key, data) {
  if (USE_MOCK) {
    return { ok: true, submittedAt: Date.now(), data };
  }
  const res = await fetch(`${BASE}/submission?id=${encodeURIComponent(formId)}&key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id: formId, key, data }),
  });
  if (!res.ok) throw await parseError(res);
  const body = await res.json();
  return body.data || body;
}
