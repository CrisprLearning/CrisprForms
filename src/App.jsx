import React, { useEffect, useState } from 'react';
import { getTemplate } from './formTemplates.js';
import { fetchRecipient, fetchSubmission } from './lib/api.js';
import SubmissionForm from './SubmissionForm.jsx';

// Read the route + params from the URL.
//   /submission?id=<FORM_ID>&key=<RECIPIENT_KEY>  → live, submittable form
//   /preview?id=<FORM_ID>                          → read-only, disabled, empty
//   /read?id=<FORM_ID>&secret=<SECRET>             → read-only, filled with the
//                                                     recorded submission + print
function parseParams() {
  const p = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/\/+$/, '');
  const route = path.endsWith('/preview') ? 'preview' : path.endsWith('/read') ? 'read' : 'submission';
  return { id: p.get('id') || '', key: p.get('key') || '', secret: p.get('secret') || '', route };
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
    fetchRecipient(id, key)
      .then((info) => {
        if (!alive) return;
        setRecipient(info);
        setStatus(info?.submitted ? 'submitted' : 'ready');
      })
      .catch((err) => {
        if (!alive) return;
        setError(err);
        setStatus('error');
      });
    return () => { alive = false; };
  }, [id, key, secret, template, preview, isRead]);

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
