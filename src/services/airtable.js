const BASE_URL = 'https://api.airtable.com/v0';

// OAuth token takes priority, falls back to legacy API key
function getBearerToken() {
  return localStorage.getItem('at_token')
    || localStorage.getItem('airtable_api_key')
    || import.meta.env.VITE_AIRTABLE_API_KEY
    || '';
}

function getBaseId() {
  return localStorage.getItem('at_base_id')
    || localStorage.getItem('airtable_base_id')
    || import.meta.env.VITE_AIRTABLE_BASE_ID
    || '';
}

function headers() {
  return {
    Authorization: `Bearer ${getBearerToken()}`,
    'Content-Type': 'application/json',
  };
}

async function airtablePost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Airtable error ${res.status}`);
  }
  return res.json();
}

/**
 * Queues a batch of outreach emails in Airtable.
 * Each record will be picked up by the daily Airtable Automation and sent via Gmail.
 *
 * @param {object[]} emails
 * @param {string}   emails[].leadName
 * @param {string}   emails[].company
 * @param {string}   emails[].category
 * @param {string}   emails[].eventName
 * @param {string}   emails[].to
 * @param {string}   emails[].subject
 * @param {string}   emails[].body
 * @param {string}   emails[].sendAt   ISO timestamp
 * @param {string}   emails[].stage    'Initial Outreach' | 'Follow-up' | 'Final Note'
 */
export async function queueOutreachEmails(emails) {
  const baseId = getBaseId();
  const table  = encodeURIComponent('Outreach Queue');

  // Airtable accepts max 10 records per request
  for (let i = 0; i < emails.length; i += 10) {
    const chunk = emails.slice(i, i + 10);
    await airtablePost(`/${baseId}/${table}`, {
      records: chunk.map(e => ({
        fields: {
          'Lead Name': e.leadName,
          'Company':   e.company,
          'Category':  e.category,
          'Event':     e.eventName,
          'To':        e.to,
          'Subject':   e.subject,
          'Body':      e.body,
          'Send At':   e.sendAt,
          'Stage':     e.stage,
          'Status':    'Pending',
        },
      })),
    });
  }
}
