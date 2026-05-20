import { callClaude, MODELS } from './claude';
import { CATEGORY_SEQUENCE_SYSTEM, buildCategoryOutreachPrompt } from '../lib/prompts/outreachSequence';
import { parseJSON } from '../lib/schemas/index';

const STAGE_META = {
  outreach:   { label: 'Initial Outreach', day: 0 },
  followup_1: { label: 'Follow-up',        day: 4 },
  followup_2: { label: 'Final Note',       day: 9 },
};

function normalizeSequence(raw) {
  const emails = Array.isArray(raw.emails) ? raw.emails : [];
  if (emails.length < 3) throw new Error('Incomplete sequence — fewer than 3 emails returned.');
  return emails.slice(0, 3).map(e => ({
    stage:    Number(e.stage),
    type:     String(e.type),
    subject:  String(e.subject || ''),
    body:     String(e.body || ''),
    send_day: Number(e.send_day ?? STAGE_META[e.type]?.day ?? 0),
    label:    STAGE_META[e.type]?.label ?? `Email ${e.stage}`,
  }));
}

/**
 * Generates a 3-email outreach template for an entire sponsor category.
 * Uses placeholder tokens (FIRST_NAME, COMPANY_NAME, etc.) instead of real names.
 */
export async function generateCategorySequence({ eventName, eventType, city, sponsorGoals, category, categoryRationale }) {
  const userPrompt = buildCategoryOutreachPrompt({
    eventName, eventType, city, sponsorGoals, category, categoryRationale,
  });

  const raw = await callClaude(CATEGORY_SEQUENCE_SYSTEM, userPrompt, {
    model: MODELS.smart,
    maxTokens: 2500,
  });

  return normalizeSequence(parseJSON(raw));
}
