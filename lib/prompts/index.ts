// ============================================================================
// PROMPTS - Unified exports for backwards compatibility
// ============================================================================

// War Room prompts (tactical research, hook, outline, batch generation, audit, polish)
export {
  SYSTEM_PROMPT,
  WAR_ROOM_STYLE,
  TACTICAL_RESEARCH_PROMPT,
  HOOK_PROMPT,
  WORD_COUNT_TARGETS,
  MASTER_OUTLINE_PROMPT,
  MASTER_OUTLINE_PROMPT_LEGACY,
  getBatchAssignment,
  getBatchPhase,
  RECURSIVE_BATCH_PROMPT,
  SCRIPT_AUDIT_PROMPT,
  SCRIPT_POLISH_PROMPT,
} from './war-room';

// Scene generation prompts
export {
  SCENE_SECTION_PROMPT,
} from './scene-generation';

// Character prompts (identification & portrait generation)
export {
  CHARACTER_IDENTIFICATION_PROMPT,
  CHARACTER_PORTRAIT_STYLE_SUFFIX,
  NEGATIVE_PROMPT_PORTRAIT,
} from './character';

// Content safety filters (shared across all prompt files)
export {
  CONTENT_SAFETY_SYSTEM_DIRECTIVE,
  CONTENT_SAFETY_FILTER,
  CONTENT_SAFETY_VISUAL,
  CONTENT_SAFETY_TRANSLATION_GUIDE,
} from './content-safety';

// Visual style prompts (scene images, maps, art style)
export {
  generateStyleSuffix,
  OIL_PAINTING_STYLE_SUFFIX,
  NEGATIVE_PROMPT_HISTORICAL,
  GENERATE_ART_STYLE_PROMPT,
  HISTORICAL_MAP_STYLE_SUFFIX,
  NEGATIVE_PROMPT_MAPS,
} from './style';
