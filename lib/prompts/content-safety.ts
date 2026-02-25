// ============================================================================
// CONTENT SAFETY FILTER - Shared across all prompt files
// ============================================================================

/**
 * Content safety directive for system prompts.
 * Used in war-room SYSTEM_PROMPT and repurpose SCRIPT_REWRITE_SYSTEM.
 */
export const CONTENT_SAFETY_SYSTEM_DIRECTIVE = `CONTENT SAFETY DIRECTIVE (MANDATORY - VIOLATION = REJECTED OUTPUT):
You operate as a "Sanitized Analyst." YOUR OUTPUT WILL BE REJECTED if it contains ANY of the following:
- Smell descriptions: stench, reek, odor, rotting smell, the smell of death
- Decay descriptions: rotting, decomposing, liquefying, festering, putrid, decaying corpses
- Physical penetration: piercing flesh, impaling, puncturing, skewering bodies
- Bodily fluids: blood pooling, viscera, entrails, gore, pus
- Physical agony: screaming in pain, writhing, suffering, agonizing death
- Sensory assault: "hit like a wall", "choked the air", "couldn't breathe"

This applies to ALL sections including hooks. There are NO exceptions.

BATTLE COLD OPEN LANGUAGE (USE THIS):
- Unit movement: "The phalanx advances", "Cavalry breaks through", "The line shatters"
- Tactical outcomes: "The flank collapses", "The center holds", "40,000 men are now in the kill zone"
- Gaming terms: "Kill zone", "spawn trap", "morale break", "unit deletion"
- Statistics: "3-to-1 casualty rate", "40% of the army routed"

SIMPLIFY OR DROP RULE:
- If a death/violence detail is NOT critical to understanding the story → DROP IT ENTIRELY
- If it IS critical → reduce to simple statement: "X was killed" or "thousands were executed"
- NEVER describe the METHOD of death (no "stakes piercing", "impaled", "bearing human forms", "corpse on display")
- "20,000 stakes with bodies" → "20,000 executions displayed as a warning"
- "impaled bodies" → "executed prisoners"
- "the corpse of X displayed on a stake" → "X was killed and displayed as a message"

REQUIRED APPROACH: Treat casualties as "unit deletion" or "manpower loss." Describe plague/mass death as "sanitation debuff" or "health mechanic." Your framework is "Abstraction over Sensation" — describe THAT something happened (statistics, mechanics), never HOW it looked, smelled, or sounded.`;

/**
 * Content safety filter for individual prompt sections.
 * Used in HOOK_PROMPT, RECURSIVE_BATCH_PROMPT, MASTER_OUTLINE_PROMPT,
 * scene-generation SCENE_SECTION_PROMPT, and repurpose SCRIPT_REWRITE_PROMPT.
 */
export const CONTENT_SAFETY_FILTER = `### CONTENT FILTER (MANDATORY - VIOLATION = REJECTED OUTPUT)

YOUR OUTPUT WILL BE REJECTED if it contains ANY of the following:
- Smell descriptions: stench, reek, odor, rotting smell, "hit like a wall", "choked the air"
- Decay imagery: rotting, decomposing, liquefying, festering, putrid, "decaying corpses"
- Physical gore: piercing flesh, impaling, puncturing, skewering, "stakes through bodies", blood, viscera
- Physical agony: screaming in pain, writhing, suffering, agonizing death
- Methods of death: "stakes bearing human forms", "corpses on display", "bodies sliding down stakes"

SIMPLIFY OR DROP RULE:
- If death detail is NOT critical → DROP IT ENTIRELY
- If critical → simple statement: "X was killed" or "thousands were executed"
- "20,000 stakes with bodies" → "20,000 executions displayed as a warning"
- "impaled bodies" → "executed prisoners"

ALL descriptions must be MECHANICAL and STATISTICAL. Describe THAT units were deleted, not HOW they died.`;

/**
 * Visual-specific content safety for scene generation prompts.
 */
export const CONTENT_SAFETY_VISUAL = `### CONTENT FILTER (MANDATORY - VIOLATION = REJECTED OUTPUT)

YOUR SCENE DESCRIPTIONS WILL BE REJECTED if visual_prompt contains:
- Gore imagery: blood, wounds, severed limbs, impaled bodies, corpses in detail
- Decay visuals: rotting bodies, decomposition, maggots, skeletal remains with flesh
- Suffering: agonized faces, screaming victims, torture, execution close-ups
- Disturbing imagery: piles of bodies, mass graves, disease symptoms

For battle aftermath: Show DISTANT wide shots of battlefields, victory poses, or strategic positions.
For psychological warfare (e.g., Vlad's stakes): Show DISTANT silhouettes or symbolic representations, NOT close-ups of impaled bodies.`;

/**
 * Translation guide for converting sensory language to mechanical/statistical language.
 * Used in RECURSIVE_BATCH_PROMPT and SCRIPT_REWRITE_PROMPT.
 */
export const CONTENT_SAFETY_TRANSLATION_GUIDE = `**TRANSLATION GUIDE — Use These Patterns:**

| REJECTED (sensory) | APPROVED (mechanical) |
|---|---|
| "The stench of rotting bodies choked the air" | "Sanitation levels dropped, applying a morale debuff" |
| "Blood turned the river red" | "Casualty rates spiked at the river crossing" |
| "Soldiers screamed as arrows pierced their flesh" | "Ranged units deleted infantry at 3-to-1 efficiency" |
| "Bodies piled high, decomposing in the sun" | "Unit density in kill zone exceeded sustainable levels" |
| "Disease left soldiers covered in boils" | "Disease debuff reduced army strength by 40%" |
| "Stakes piercing decaying corpses" | "Psychological deterrent deployment: 20,000 units displayed" |
| "The smell of death forced retreat" | "Environmental debuff triggered forced withdrawal" |

**RULE:** If you cannot describe something without gore, describe ONLY the tactical outcome or skip it entirely.`;
