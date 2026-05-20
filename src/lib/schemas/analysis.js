import { requireKeys } from './index';

/**
 * Validates and normalizes a raw sponsor analysis response from Claude.
 * Guarantees the shape the rest of the app depends on.
 */
export function normalizeAnalysis(raw) {
  requireKeys(raw, ['audience', 'categories', 'sponsors'], 'analysis');

  const audience = {
    summary: raw.audience?.summary ?? '',
    estimated_size: raw.audience?.estimated_size ?? '',
    demographics: Array.isArray(raw.audience?.demographics) ? raw.audience.demographics : [],
    interests: Array.isArray(raw.audience?.interests) ? raw.audience.interests : [],
  };

  const categories = (raw.categories ?? []).map(c => ({
    name: String(c.name ?? ''),
    rationale: String(c.rationale ?? ''),
    priority: ['high', 'medium', 'low'].includes(c.priority) ? c.priority : 'medium',
  }));

  const sponsors = (raw.sponsors ?? []).map(s => ({
    // AI field                    // UI-facing alias
    company:   String(s.company   ?? s.name ?? ''),
    name:      String(s.company   ?? s.name ?? ''), // keeps SponsorRow working
    category:  String(s.category  ?? ''),
    rationale: String(s.rationale ?? ''),
    fit_score: Math.min(100, Math.max(0, Number(s.fit_score ?? 0))),
    contact:   String(s.contact   ?? ''),
    title:     String(s.title     ?? ''),
    email:     String(s.email     ?? ''),
  }));

  return { audience, categories, sponsors };
}
