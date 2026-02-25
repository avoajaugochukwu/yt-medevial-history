// ============================================================================
// AI MODEL CONFIGURATION
// ============================================================================

// --- Model identifiers ---

export const MODELS = {
  /** OpenAI model for character identification and script analysis */
  GPT4O: 'gpt-4o' as const,
  /** OpenAI model for art-style generation (cheaper, faster) */
  GPT4O_MINI: 'gpt-4o-mini' as const,
  /** Anthropic model for script generation and polishing */
  CLAUDE_SONNET: 'claude-sonnet-4-20250514' as const,
  /** Perplexity model for research */
  SONAR_PRO: 'sonar-pro' as const,
  /** FAL.ai model for image generation */
  FAL_NANO_BANANA: 'fal-ai/nano-banana' as const,
  /** FAL.ai model for image-conditioned generation */
  FAL_NANO_BANANA_EDIT: 'fal-ai/nano-banana/edit' as const,
};

// --- Image aspect ratios ---

export const ASPECT_RATIOS = {
  /** Portrait aspect ratio (3:4) for character references */
  PORTRAIT: '3:4' as const,
  /** Landscape aspect ratio (16:9) for scene images */
  LANDSCAPE: '16:9' as const,
};
