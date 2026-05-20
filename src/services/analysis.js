import { callClaude, MODELS } from './claude';
import { SPONSOR_ANALYSIS_SYSTEM, buildAnalysisPrompt } from '../lib/prompts/sponsorAnalysis';
import { parseJSON } from '../lib/schemas/index';
import { normalizeAnalysis } from '../lib/schemas/analysis';

/**
 * Runs a full sponsorship analysis against an event brief.
 *
 * @param {object} params
 * @param {string} params.eventName
 * @param {string} params.eventType
 * @param {string} params.city
 * @param {string} [params.sponsorGoals]
 * @param {string} [params.rawText]   — extracted document text from parsedDoc.raw
 *
 * @returns {Promise<{
 *   audience: { summary, estimated_size, demographics, interests },
 *   categories: { name, rationale, priority }[],
 *   sponsors: { company, name, category, rationale, fit_score, contact, title, email }[],
 * }>}
 */
export async function runSponsorAnalysis({ eventName, eventType, city, sponsorGoals, rawText }) {
  const userPrompt = buildAnalysisPrompt({ eventName, eventType, city, sponsorGoals, rawText });

  const raw = await callClaude(SPONSOR_ANALYSIS_SYSTEM, userPrompt, {
    model: MODELS.smart,
    maxTokens: 8000,
  });

  const parsed = parseJSON(raw);
  return normalizeAnalysis(parsed);
}
