function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeHeader(value) {
  // RFC 2047 encoded-word for non-ASCII characters in headers (e.g. em dashes)
  if (/[^\x00-\x7F]/.test(value)) {
    return `=?utf-8?B?${btoa(unescape(encodeURIComponent(value)))}?=`;
  }
  return value;
}

function buildRaw(headers, body) {
  const hStr = Object.entries(headers)
    .map(([k, v]) => `${k}: ${encodeHeader(v)}`)
    .join('\r\n');
  return toBase64Url(`${hStr}\r\n\r\n${body}`);
}

/** Get the authenticated user's email address */
export async function gmailGetProfile(accessToken) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Could not fetch Gmail profile');
  return res.json(); // { emailAddress, messagesTotal, ... }
}

/** Get the authenticated user's display name from Google People API */
export async function gmailGetUserName(accessToken) {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me?personFields=names',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.names?.[0]?.displayName ?? data.names?.[0]?.givenName ?? null;
}

/**
 * Schedules an email send.
 *
 * If VITE_APPS_SCRIPT_URL is set, the email is handed to the Google Apps Script
 * scheduler which sends it automatically at scheduledTime (±5 min).
 *
 * Otherwise falls back to an annotated Gmail draft the user schedules manually.
 *
 * Returns { type: 'scheduled' | 'draft', scheduledTime }
 */
export async function gmailScheduledSend({ to, subject, body, accessToken, scheduledTime }) {
  const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;

  if (appsScriptUrl && !appsScriptUrl.includes('your_apps_script')) {
    // Hand off to Apps Script scheduler — fire-and-forget (no-cors)
    const params = new URLSearchParams({
      payload: JSON.stringify({ to, subject, body, sendAt: scheduledTime.toISOString() }),
    });

    await fetch(appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors', // response is opaque but the request goes through
      body: params,
    });

    return { type: 'scheduled', scheduledTime };
  }

  // Fallback: annotated draft for manual Gmail "Schedule Send"
  const dateStr = scheduledTime.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  const annotatedBody = `[ Send this on: ${dateStr} ]\n\n${body}`;
  const headers = {
    To: to, Subject: subject,
    'MIME-Version': '1.0', 'Content-Type': 'text/plain; charset=utf-8',
  };

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw: buildRaw(headers, annotatedBody) } }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || 'Gmail draft creation failed');
  }

  return { type: 'draft', scheduledTime };
}

/**
 * Sends a notification email from the user to themselves summarising
 * what outreach has been scheduled.
 */
export async function gmailSendNotification({ toSelf, subject, body, accessToken }) {
  const headers = {
    To: toSelf,
    From: toSelf,
    Subject: subject,
    'MIME-Version': '1.0',
    'Content-Type': 'text/plain; charset=utf-8',
  };

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: buildRaw(headers, body) }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || 'Notification send failed');
  }

  return res.json();
}

export async function gmailCreateDraft({ to, subject, body, accessToken }) {
  const headers = {
    To: to, Subject: subject,
    'MIME-Version': '1.0', 'Content-Type': 'text/plain; charset=utf-8',
  };
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw: buildRaw(headers, body) } }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || 'Gmail draft creation failed');
  }
  return res.json();
}

export async function gmailSearchReply({ leadEmail, afterTimestamp, accessToken }) {
  const afterSec = Math.floor(afterTimestamp / 1000);
  const query = `from:${leadEmail} after:${afterSec}`;
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return false;
  const data = await res.json();
  return (data.messages?.length ?? 0) > 0;
}
