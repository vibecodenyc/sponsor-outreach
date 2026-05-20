/**
 * Strips markdown fences and parses a JSON string from a Claude response.
 * Throws a descriptive error if parsing fails.
 */
export function parseJSON(raw) {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned invalid JSON. Raw response:\n${cleaned.slice(0, 300)}`);
  }
}

/**
 * Asserts that all required top-level keys are present in an object.
 * Returns the object unchanged if valid.
 */
export function requireKeys(obj, keys, label = 'response') {
  const missing = keys.filter(k => !(k in obj));
  if (missing.length) {
    throw new Error(`AI ${label} missing required fields: ${missing.join(', ')}`);
  }
  return obj;
}
