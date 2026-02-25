/**
 * Safe JSON extraction from AI responses.
 *
 * AI models often wrap JSON in markdown code blocks or return extra text
 * around the JSON payload. These utilities handle those cases.
 */

/**
 * Clean markdown code block wrappers from AI response text.
 */
function cleanMarkdownBlocks(text: string): string {
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
}

/**
 * Attempt to fix incomplete JSON by closing open braces/brackets.
 * Useful when AI responses are truncated.
 */
function fixIncompleteJson(json: string): string {
  const openBraces = (json.match(/\{/g) || []).length;
  const closeBraces = (json.match(/\}/g) || []).length;
  const openBrackets = (json.match(/\[/g) || []).length;
  const closeBrackets = (json.match(/\]/g) || []).length;

  return (
    json +
    ']'.repeat(Math.max(0, openBrackets - closeBrackets)) +
    '}'.repeat(Math.max(0, openBraces - closeBraces))
  );
}

/**
 * Extract and parse a JSON object from AI response text.
 *
 * Handles: markdown code blocks, extra surrounding text, and incomplete JSON.
 * Returns null if parsing fails.
 */
export function parseJsonObject<T = Record<string, unknown>>(
  text: string,
  options?: { fixIncomplete?: boolean }
): T | null {
  try {
    const cleaned = cleanMarkdownBlocks(text);
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const raw = options?.fixIncomplete ? fixIncompleteJson(jsonMatch[0]) : jsonMatch[0];
      return JSON.parse(raw) as T;
    }
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

/**
 * Extract and parse a JSON array from AI response text.
 *
 * Handles: markdown code blocks, extra surrounding text.
 * Returns null if parsing fails or the result is not an array.
 */
export function parseJsonArray<T = unknown>(text: string): T[] | null {
  try {
    const cleaned = cleanMarkdownBlocks(text);
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed as T[];
    }
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as T[];
    return null;
  } catch {
    return null;
  }
}
