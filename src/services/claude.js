const API_URL = 'https://api.anthropic.com/v1/messages';

export const MODELS = {
  fast: 'claude-haiku-4-5-20251001',   // structured data, lead generation
  smart: 'claude-sonnet-4-6',           // analysis, email drafting
};

/**
 * Core Claude API caller. All services import this rather than
 * duplicating fetch logic.
 */
export async function callClaude(system, user, { model = MODELS.smart, maxTokens = 2048 } = {}) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key || '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}
