# Sponsorship Copilot — Implementation Roadmap

> Current state: Event intake → PDF parsing → AI sponsor analysis → CRM dashboard → Gmail draft sequences.
> All state is in-memory. No backend. No persistence. No deployment.

---

## Phase 1 — Outreach Generation

**Goal:** Replace the generic email generation with a structured, tone-consistent outreach sequence engine that returns objects ready for database storage.

### 1.1 Outreach Sequence Service

**File:** `src/services/outreach.js`

Generate a full sequence per sponsor in one Claude call:

```js
// Input
{
  event: { name, type, city, goals, audienceSummary },
  sponsor: { company, contact, title, email, category, rationale, fit_score }
}

// Output
{
  sponsor_email: "jordan.mills@stripe.com",
  sequence: [
    {
      stage: 1,
      type: "outreach",
      subject: "...",
      body: "...",
      send_day: 0
    },
    {
      stage: 2,
      type: "followup_1",
      subject: "Re: ...",
      body: "...",
      send_day: 3
    },
    {
      stage: 3,
      type: "followup_2",
      subject: "...",
      body: "...",
      send_day: 7
    }
  ],
  generated_at: "ISO timestamp"
}
```

**Tone guidelines for prompt:**
- Founder-to-founder register — written as if from the event organizer personally
- No corporate filler ("I hope this email finds you well")
- Lead with a specific insight about the company, not a generic ask
- 3–5 sentences max per email
- Subject lines: specific, no emoji, no "Exciting Opportunity"
- Partnership framing, not vendor pitch

**File:** `src/lib/prompts/outreachSequence.js`

Single system prompt that generates all 3 emails + subject lines in one call. Structured JSON return. Use `MODELS.smart` (Sonnet).

**Schema:** `src/lib/schemas/outreach.js`

Normalize and validate the returned sequence. Guard against missing stages.

---

## Phase 2 — Outreach Console

**Goal:** A dedicated CRM-style communication dashboard showing every sponsor, their sequence state, and next action.

### 2.1 New Page

**File:** `src/pages/OutreachConsole.jsx`

**Navigation:** Add a third app state `'console'` to `useAppState`. Accessible from the dashboard via a "View Outreach" button or top nav.

### 2.2 Table Columns

| Column | Details |
|---|---|
| Company | Avatar + name |
| Contact | Name + title |
| Latest Email | Subject line of most recent sent email |
| Sequence Stage | "Outreach", "Follow-up 1", "Follow-up 2", "Complete" |
| Status | Drafted / Queued / Sent / Replied (chip) |
| Next Follow-up | Date or "—" if complete/replied |

### 2.3 Status Chips

```
Drafted   → zinc     (email generated, not sent)
Queued    → blue     (handed to n8n, awaiting send)
Sent      → amber    (confirmed sent via Gmail/n8n)
Replied   → emerald  (reply detected, sequence paused)
```

### 2.4 Activity Timeline Panel

Right-side slide-in panel per sponsor showing a vertical timeline:

```
● May 20  Outreach sent
○ May 23  Follow-up 1 — scheduled
○ May 27  Follow-up 2 — pending
```

Each event shows: type, subject, timestamp, status dot.

**Files:**
- `src/components/console/OutreachTable.jsx`
- `src/components/console/OutreachRow.jsx`
- `src/components/console/StatusChip.jsx`
- `src/components/console/ActivityTimeline.jsx`

### 2.5 Data Hook

**File:** `src/hooks/useOutreach.js`

Manages outreach state: generated sequences, per-sponsor status, timeline events. Seeds from Airtable once Phase 3 is live; falls back to localStorage in the interim.

---

## Phase 3 — Airtable Persistence

**Goal:** Replace all in-memory and localStorage state with Airtable as the source of truth.

### 3.1 Airtable Base Schema

**Table: Events**
| Field | Type |
|---|---|
| id | Auto |
| name | Text |
| type | Single select |
| city | Text |
| sponsor_goals | Long text |
| brief_text | Long text |
| audience_summary | Long text |
| created_at | Date |

**Table: Sponsors**
| Field | Type |
|---|---|
| id | Auto |
| event_id | Link → Events |
| company | Text |
| contact | Text |
| title | Text |
| email | Email |
| category | Text |
| rationale | Long text |
| fit_score | Number |
| outreach_status | Single select (new/approved/contacted/replied/declined) |

**Table: Outreach Sequences**
| Field | Type |
|---|---|
| id | Auto |
| sponsor_id | Link → Sponsors |
| stage | Number (1/2/3) |
| type | Single select (outreach/followup_1/followup_2) |
| subject | Text |
| body | Long text |
| status | Single select (drafted/queued/sent/replied) |
| send_day | Number |
| sent_at | Date |
| gmail_thread_id | Text |

**Table: Communication Events**
| Field | Type |
|---|---|
| id | Auto |
| sponsor_id | Link → Sponsors |
| sequence_id | Link → Outreach Sequences |
| event_type | Single select (sent/opened/replied/bounced) |
| occurred_at | Date |
| metadata | Long text (JSON) |

### 3.2 Airtable Service

**File:** `src/services/airtable.js`

Reusable helper architecture:

```js
// Base client
const base = (table) => ({
  list:   (params)  => airtableFetch(`/${table}`, params),
  get:    (id)      => airtableFetch(`/${table}/${id}`),
  create: (fields)  => airtableFetch(`/${table}`, {}, 'POST', { fields }),
  update: (id, fields) => airtableFetch(`/${table}/${id}`, {}, 'PATCH', { fields }),
  remove: (id)      => airtableFetch(`/${table}/${id}`, {}, 'DELETE'),
});

export const Events    = base('Events');
export const Sponsors  = base('Sponsors');
export const Sequences = base('Outreach Sequences');
export const CommEvents = base('Communication Events');
```

**Environment variables:**
```
VITE_AIRTABLE_API_KEY=pat_...
VITE_AIRTABLE_BASE_ID=app...
```

> ⚠️ Airtable API keys must move to a backend proxy before production — do not expose `pat_` tokens in the browser bundle.

### 3.3 Migration Points

| Currently in | Move to |
|---|---|
| `useLeads` React state | Airtable Sponsors table |
| `useSequenceProgress` localStorage | Airtable Outreach Sequences table |
| `useAppState` event fields | Airtable Events table |
| Outreach email objects | Airtable Outreach Sequences table |

---

## Phase 4 — CSV Export

**Goal:** One-click download from the Outreach Console covering all leads and their sequences.

### 4.1 Export Service

**File:** `src/services/export.js`

```js
export function exportLeadsCSV(leads, sequences) { ... }
// Triggers browser download of leads.csv
```

**CSV columns:**
```
Company, Contact, Title, Email, Category, Fit Score, Status,
Outreach Subject, Outreach Body,
Followup 1 Subject, Followup 1 Body,
Followup 2 Subject, Followup 2 Body,
Sequence Stage, Last Updated
```

### 4.2 UI

Export button in the Outreach Console toolbar. Respects active filters — exports only the currently visible rows, or all rows if no filter is active.

---

## Phase 5 — n8n Webhook Integration

**Goal:** A "Launch Campaign" button that hands the approved leads + their sequences to n8n for automated outreach. No scheduling logic inside React.

### 5.1 Webhook Service

**File:** `src/services/webhook.js`

```js
export async function sendToN8N(payload) {
  // POST to VITE_N8N_WEBHOOK_URL
  // Returns { success, executionId }
}
```

**Payload shape:**
```json
{
  "event": { "name", "type", "city" },
  "leads": [
    {
      "company", "contact", "title", "email",
      "sequence": [
        { "stage", "type", "subject", "body", "send_day" }
      ]
    }
  ],
  "triggered_at": "ISO timestamp"
}
```

**Environment variable:**
```
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
```

### 5.2 Launch Campaign Button

Located in the Outreach Console header. Only active when at least one lead is `Approved`.

States:
- Default: "Launch Campaign" (white button)
- Loading: spinner + "Sending to n8n…"
- Success: green check + "Campaign launched" (3s, then reset)
- Error: red + error message inline

On success: update all sent leads' status to `Queued` in Airtable.

### 5.3 n8n Workflow (outside React)

The n8n side should handle:
1. Receive webhook payload
2. For each lead: wait `send_day` days, then send via Gmail node
3. On send: POST back to app webhook to update status to `Sent`
4. On reply detected: POST back to update status to `Replied`

The React app only needs to handle the webhook callback — not the scheduling.

---

## Phase 6 — Gmail Communication Tracking

**Goal:** A structured communication event model that supports future Gmail/n8n automation and feeds the activity timeline.

### 6.1 Communication Event Model

**File:** `src/lib/models/communicationEvent.js`

```js
// Event types
export const EVENT_TYPES = {
  SEQUENCE_CREATED: 'sequence_created',
  EMAIL_DRAFTED:    'email_drafted',
  EMAIL_QUEUED:     'email_queued',
  EMAIL_SENT:       'email_sent',
  EMAIL_OPENED:     'email_opened',   // future: via tracking pixel or Gmail API
  EMAIL_REPLIED:    'email_replied',
  SEQUENCE_PAUSED:  'sequence_paused',
  SEQUENCE_COMPLETE:'sequence_complete',
};

// Lead status lifecycle
export const LEAD_STATUS_FLOW = {
  new:       ['approved'],
  approved:  ['contacted'],
  contacted: ['replied', 'declined'],
  replied:   [],           // terminal — manage manually
  declined:  [],           // terminal
};
```

### 6.2 Lead Status Lifecycle

```
new → approved → contacted → replied
                           → declined
```

Status transitions are guarded by `LEAD_STATUS_FLOW` — no illegal jumps (e.g., `new → replied`).

### 6.3 Activity Timeline Structure

Each lead maintains an ordered array of communication events:

```js
[
  { type: 'sequence_created', occurred_at, metadata: { stage_count: 3 } },
  { type: 'email_drafted',    occurred_at, metadata: { stage: 1, subject } },
  { type: 'email_queued',     occurred_at, metadata: { stage: 1 } },
  { type: 'email_sent',       occurred_at, metadata: { stage: 1, gmail_thread_id } },
  { type: 'email_replied',    occurred_at, metadata: { gmail_message_id } },
]
```

Stored in Airtable `Communication Events` table. Rendered in `ActivityTimeline.jsx`.

### 6.4 Gmail Tracking Preparation

- Store `gmail_thread_id` on every sent sequence record
- `gmailSearchReply()` already exists in `src/services/gmail.js` — wire it to update `Communication Events` when a reply is detected
- Future: n8n watches the Gmail inbox and POSTs reply events back to the app webhook

---

## Environment Variables (Full List)

```env
# Current
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_CLIENT_ID=....apps.googleusercontent.com

# Phase 3
VITE_AIRTABLE_API_KEY=pat_...
VITE_AIRTABLE_BASE_ID=app...

# Phase 5
VITE_N8N_WEBHOOK_URL=https://...
VITE_APP_WEBHOOK_SECRET=...    # for verifying n8n callbacks
```

---

## Technical Debt to Resolve Before Production

| Issue | Fix |
|---|---|
| `VITE_ANTHROPIC_API_KEY` exposed in browser | Move all Claude calls to a backend proxy (Supabase Edge Function or Express) |
| Airtable `pat_` token in browser | Same backend proxy pattern |
| `SponsorLeads.jsx` is orphaned dead code | Delete |
| `components/leads/` may be orphaned | Audit after deleting `SponsorLeads.jsx` |
| Gmail token expires after 1 hour | Add token refresh or prompt re-auth on 401 |
| `useLeads` doesn't re-seed if sponsors change | Add `useEffect` to re-initialize on `sponsors` prop change |
| No error boundaries | Wrap page-level components in `<ErrorBoundary>` |
| No React Router | Add before Phase 2 — console needs its own URL |

---

## Recommended Implementation Order

```
Week 1
  ├── Clean up orphaned files (SponsorLeads.jsx, components/leads/)
  ├── Add React Router (3 routes: /, /dashboard, /console)
  ├── Phase 1: Outreach generation service + prompts + schema
  └── Phase 2: Outreach Console page + components

Week 2
  ├── Phase 3: Airtable base setup + service layer
  ├── Migrate useLeads → Airtable Sponsors
  └── Migrate useSequenceProgress → Airtable Sequences

Week 3
  ├── Phase 4: CSV export
  ├── Phase 5: n8n webhook + Launch Campaign button
  └── Phase 6: Communication event model + activity timeline

Week 4
  ├── Backend proxy for API keys (Supabase or Express)
  ├── Error boundaries + loading skeletons
  └── Deployment (Vercel or Netlify)
```

---

## Deployment Notes

**Recommended:** Vercel (zero config for Vite)

```bash
npm run build   # outputs to dist/
vercel --prod   # deploy dist/
```

Set all `VITE_*` env vars in Vercel's project settings. For production, move sensitive keys (`ANTHROPIC`, `AIRTABLE`) to server-side environment variables in a proxy function — not `VITE_` prefixed (those are bundled into the client).
