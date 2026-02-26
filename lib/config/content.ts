// ============================================================================
// CONTENT CONFIGURATION
// ============================================================================

/** Average speaking rate for TTS narration (words per minute) */
export const WORDS_PER_MINUTE = 150;

/**
 * Sentence counts per section when splitting scripts.
 * All sections get a uniform 20 sentences (last section may be smaller).
 * The last value repeats for any additional sections.
 */
export const SECTION_SENTENCE_COUNTS = [20];

/**
 * Target scene durations (seconds) per section.
 * Section 1 targets ~2s scenes, section 2 ~5s, section 3+ ~8s.
 * The last value repeats for any additional sections.
 */
export const SECTION_TARGET_DURATIONS = [2, 5, 8];

/** Get the sentence count for a given section index (0-based). Last value repeats. */
export function getSectionSentenceCount(index: number): number {
  return SECTION_SENTENCE_COUNTS[Math.min(index, SECTION_SENTENCE_COUNTS.length - 1)];
}

/** Get the target scene duration for a given section index (0-based). Last value repeats. */
export function getSectionTargetDuration(index: number): number {
  return SECTION_TARGET_DURATIONS[Math.min(index, SECTION_TARGET_DURATIONS.length - 1)];
}

/** Convert a target scene duration (seconds) to approximate words per scene at WORDS_PER_MINUTE. */
export function getWordsPerScene(targetDuration: number): number {
  return Math.round((WORDS_PER_MINUTE / 60) * targetDuration);
}
