function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildRaw(headers, body) {
  const hStr = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\r\n');
  return toBase64Url(`${hStr}\r\n\r\n${body}`);
}

export async function gmailCreateDraft({ to, subject, body, accessToken }) {
  const headers = {
    To: to,
    Subject: subject,
    'MIME-Version': '1.0',
    'Content-Type': 'text/plain; charset=utf-8',
  };

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw: buildRaw(headers, body) } }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || 'Gmail draft creation failed');
  }

  return res.json(); // { id: draftId, message: { id, threadId } }
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
