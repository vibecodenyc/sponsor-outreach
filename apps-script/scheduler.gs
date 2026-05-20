// Sponsorship Copilot — Gmail Draft Scheduler
// Paste into script.google.com → New Project
// No Advanced Services needed.

// ── Create a draft with the scheduled date annotated at the top ───────────────

function createScheduledDraft_(to, subject, body, sendAtISO) {
  const dateStr = Utilities.formatDate(
    new Date(sendAtISO),
    Session.getScriptTimeZone(),
    "EEEE, MMMM d 'at' h:mm a"
  );

  const annotatedBody = '[ Schedule this to send: ' + dateStr + ' ]\n\n' + body;

  GmailApp.createDraft(to, subject, annotatedBody);
  console.log('Draft created → ' + to + ' | ' + subject + ' | ' + dateStr);
}

// ── Webhook: receives emails from the React app ───────────────────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.parameter.payload);
    createScheduledDraft_(data.to, data.subject, data.body, data.sendAt);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error('doPost error: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── One-time setup (run once manually) ───────────────────────────────────────

function setup() {
  // No recurring trigger needed — drafts are created on demand via doPost.
  console.log('Setup complete. Deploy as Web App and paste the URL into .env');
}
