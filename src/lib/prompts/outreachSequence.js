import { buildPrompt } from './index';

export const CATEGORY_SEQUENCE_SYSTEM = `\
You write sponsorship outreach email templates for event founders. These templates are personalized per recipient using placeholder tokens, so write for the category — not a specific company.

Placeholder tokens — use these EXACTLY as written, uppercase, no brackets:
  FIRST_NAME      — recipient's first name
  COMPANY_NAME    — recipient's company
  THEIR_TITLE     — recipient's job title (e.g. "your team", "your brand")

Voice rules:
- Founder-to-executive register. Direct, specific to the category, not generic.
- Open with a category-level insight or trend — something that shows you understand their industry.
- 4 sentences max per email. Every sentence earns its place.
- One ask per email. Never two.
- Banned phrases: "I hope this finds you well", "I wanted to reach out", "exciting opportunity", "unique opportunity", "I'm excited to share".
- Subject lines: 6 words max, no emoji, no "Sponsorship Opportunity".

Sequence:
- Email 1 (Day 0): Lead with the category insight. Reference COMPANY_NAME naturally. End with a 15-min call ask.
- Email 2 (Day 4): Add one concrete value — an audience stat, a confirmed partner brand, or a speaker. 3 sentences max.
- Email 3 (Day 9): Brief, no pressure, leaves door open. 2-3 sentences.

Never reference "my previous email" or "as I mentioned". Each email stands alone.

Respond ONLY with valid JSON — no markdown, no preamble:
{
  "emails": [
    { "stage": 1, "type": "outreach",   "subject": "", "body": "", "send_day": 0 },
    { "stage": 2, "type": "followup_1", "subject": "", "body": "", "send_day": 4 },
    { "stage": 3, "type": "followup_2", "subject": "", "body": "", "send_day": 9 }
  ]
}

Bodies are plain text with \\n line breaks. End every email with:\\nBest,\\nYOUR_NAME`;

const CATEGORY_USER_TEMPLATE = `\
Event: {{eventName}}
Type: {{eventType}}
City: {{city}}
{{goals}}

Sponsor category: {{category}}
Why this category fits: {{rationale}}

Write a 3-email outreach template sequence for this category using the placeholder tokens.`;

export function buildCategoryOutreachPrompt({ eventName, eventType, city, sponsorGoals, category, categoryRationale }) {
  return buildPrompt(CATEGORY_USER_TEMPLATE, {
    eventName: eventName || 'Untitled Event',
    eventType,
    city,
    goals: sponsorGoals ? `Sponsor goals: ${sponsorGoals}` : '',
    category,
    rationale: categoryRationale || `${category} brands align with this event's audience.`,
  });
}
