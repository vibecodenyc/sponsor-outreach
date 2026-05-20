/**
 * Renders a prompt template by replacing {{key}} placeholders with values.
 * Undefined values are replaced with an empty string.
 *
 * Usage:
 *   buildPrompt('Hello {{name}}', { name: 'Jordan' })  →  'Hello Jordan'
 */
export function buildPrompt(template, vars) {
  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replaceAll(`{{${k}}}`, v ?? ''),
    template,
  );
}
