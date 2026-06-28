import React, { useEffect, useState } from 'react';
import { getTemplate } from './formTemplates.js';
import { fetchSubmission, fetchFormResponses } from './lib/api.js';
import SubmissionForm from './SubmissionForm.jsx';
import AdminView from './AdminView.jsx';

// Read the route + params from the URL.
//   /submission?id=<FORM_ID>&key=<RECIPIENT_KEY>  → live, submittable form
//   /preview?id=<FORM_ID>                          → read-only, disabled, empty
//   /read?id=<FORM_ID>&secret=<SECRET>             → read-only, filled with the
//                                                     recorded submission + print
// Read a query param straight from the raw search string and percent-decode it.
function rawParam(search, name) {
  const entry = search.replace(/^\?/, '').split('&').find((p) => p.startsWith(`${name}=`));
  if (!entry) return '';
  const value = entry.slice(name.length + 1);
  try { return decodeURIComponent(value); } catch { return value; }
}

// The recipient key / secret are base64 tokens whose "+" characters travel
// through the URL as "%20" (and thus decode to a space). Restore those spaces
// back to "+" so the token sent in the API payload matches the original
// (e.g. "U2FsdGVkX1%20mDjz…%3D" → "U2FsdGVkX1+mDjz…=").
function tokenParam(search, name) {
  return rawParam(search, name).replace(/ /g, '+');
}

function parseParams() {
  const search = window.location.search;
  const path = window.location.pathname.replace(/\/+$/, '');
  const route = path.endsWith('/admin-view') ? 'admin-view'
    : path.endsWith('/preview') ? 'preview'
    : path.endsWith('/read') ? 'read'
    : 'submission';
  return {
    id: rawParam(search, 'id'),
    key: tokenParam(search, 'key'),
    secret: tokenParam(search, 'secret'),
    route,
  };
}

// Pull the recorded answers out of the fetch.php response, tolerating a few
// likely envelope shapes ({ data: {...} }, { data: { data: {...} } }, or the
// fields at the top level). Returns null when no real answers are present so
// the form stays open for a first-time submission.
function extractResponses(body) {
  if (!body || typeof body !== 'object') return null;
  let d = body.data && typeof body.data === 'object' ? body.data : body;
  if (d.data && typeof d.data === 'object') d = d.data;
  const META = new Set(['submittedAt', 'recipientName', 'status', 'success', 'message', 'id', 'key']);
  const hasAnswers = Object.keys(d).some((k) => !META.has(k) && d[k] != null && d[k] !== '');
  return hasAnswers ? d : null;
}

function Centered({ icon, title, message, tone = 'neutral' }) {
  return (
    <div className="forms-state">
      <div className={`forms-state-card forms-state-${tone}`}>
        <div className="forms-state-icon">{icon}</div>
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default function App() {
  const { id, key, secret, route } = parseParams();
  const preview = route === 'preview';
  const isRead = route === 'read';
  const template = id ? getTemplate(id) : null;

  const [status, setStatus] = useState('loading'); // loading | ready | submitted | error
  const [recipient, setRecipient] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (preview || !id || !template) return;
    let alive = true;
    setStatus('loading');

    if (isRead) {
      if (!secret) return;
      fetchSubmission(id, secret)
        .then((info) => { if (alive) { setSubmission(info); setStatus('ready'); } })
        .catch((err) => { if (alive) { setError(err); setStatus('error'); } });
      return () => { alive = false; };
    }

    if (!key) return;
    fetchFormResponses(id, key)
      .then((body) => {
        if (!alive) return;
        const data = extractResponses(body);
        if (data) {
          // Already submitted — lock the form and show the recorded answers.
          // The backend returns the timestamp as `submitted_at` (seconds).
          const env = body?.data ?? body;
          const ts = env?.submitted_at ?? env?.submittedAt ?? null;
          setSubmission({ data, submittedAt: ts != null ? Number(ts) * 1000 : null });
          setStatus('prefilled');
        } else {
          // No prior submission — leave the form open for the recipient.
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (!alive) return;
        setError(err);
        setStatus('error');
      });
    return () => { alive = false; };
  }, [id, key, secret, template, preview, isRead]);

  // Admin view: `id` is a mobile number, not a form template. Render the
  // submission-status dashboard before the template-based guards below.
  if (route === 'admin-view') {
    return <AdminView initialId={id} />;
  }

  if (!id) {
    return (
      <Centered
        tone="warn"
        icon="!"
        title="Invalid Link"
        message="This form link is missing required parameters. Please use the exact link that was sent to you."
      />
    );
  }

  if (!template) {
    return (
      <Centered
        tone="warn"
        icon="?"
        title="Unknown Form"
        message={`No form template matches "${id}". Please check your link or contact the sender.`}
      />
    );
  }

  if (preview) {
    return <SubmissionForm template={template} mode="preview" />;
  }

  if ((isRead && !secret) || (!isRead && !key)) {
    return (
      <Centered
        tone="warn"
        icon="!"
        title="Invalid Link"
        message="This form link is missing required parameters. Please use the exact link that was sent to you."
      />
    );
  }

  if (status === 'loading') {
    return <Centered icon="…" title="Loading" message="Fetching your form…" />;
  }

  if (status === 'error') {
    const code = error?.code;
    if (code === 'ALREADY_SUBMITTED') {
      return <Centered tone="success" icon="✓" title="Already Submitted" message="This form has already been completed. Thank you!" />;
    }
    if (code === 'NOT_FOUND') {
      return <Centered tone="warn" icon="?" title="Link Not Recognised" message="This link is invalid or has expired. Please contact the sender for a new one." />;
    }
    return <Centered tone="warn" icon="!" title="Something Went Wrong" message={error?.message || 'Unable to load the form. Please try again later.'} />;
  }

  if (status === 'submitted') {
    return <Centered tone="success" icon="✓" title="Already Submitted" message="This form has already been completed. Thank you!" />;
  }

  if (status === 'prefilled') {
    return (
      <SubmissionForm
        template={template}
        mode="read"
        initialData={submission?.data}
        submittedAt={submission?.submittedAt}
        alreadySubmitted
      />
    );
  }

  if (isRead) {
    return (
      <SubmissionForm
        template={template}
        mode="read"
        initialData={submission?.data}
        recipient={submission}
        submittedAt={submission?.submittedAt}
      />
    );
  }

  return (
    <SubmissionForm
      template={template}
      mode="submit"
      formKey={key}
      recipient={recipient}
      onSubmitted={() => setStatus('submitted')}
    />
  );
}
