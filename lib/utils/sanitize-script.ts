/**
 * Remove all em dashes from script text, replacing with spaced hyphens.
 * Applied as a safety net after AI generation.
 */
export function sanitizeEmDashes(text: string): string {
  return text.replace(/\u2014/g, ' -').replace(/\u2013/g, '-');
}
