/**
 * Pacing configuration for scene generation.
 *
 * Controls how script content is broken into scenes at different points
 * in the video, matching viewer attention patterns:
 * - HOOK: Fast cuts to grab attention (first ~80 seconds)
 * - SETUP: Slightly longer scenes for context (next ~160 seconds)
 * - CORE_CONTENT: Standard pacing for main narrative
 * - DEEP_CONTENT: Longer scenes for detailed analysis
 */

export interface PacingPhase {
  phase: string;
  durationRange: string;
  maxWordsPerScene: number;
}

export interface PacingThreshold {
  /** Word offset upper bound (exclusive). Use Infinity for the last phase. */
  maxWordOffset: number;
  phase: PacingPhase;
}

export const PACING_THRESHOLDS: PacingThreshold[] = [
  { maxWordOffset: 200,      phase: { phase: 'hook',         durationRange: '1.5-2.5 seconds', maxWordsPerScene: 6 } },
  { maxWordOffset: 600,      phase: { phase: 'setup',        durationRange: '3-5 seconds',     maxWordsPerScene: 13 } },
  { maxWordOffset: 2000,     phase: { phase: 'core_content', durationRange: '5-8 seconds',     maxWordsPerScene: 20 } },
  { maxWordOffset: Infinity, phase: { phase: 'deep_content', durationRange: '6-10 seconds',    maxWordsPerScene: 25 } },
];

/**
 * Determine pacing phase based on cumulative word offset in the script.
 */
export function getPacingPhase(wordOffset: number): PacingPhase {
  for (const threshold of PACING_THRESHOLDS) {
    if (wordOffset < threshold.maxWordOffset) {
      return threshold.phase;
    }
  }
  return PACING_THRESHOLDS[PACING_THRESHOLDS.length - 1].phase;
}
