// ============================================================================
// SCENE GENERATION PROMPTS
// ============================================================================

import { CONTENT_SAFETY_VISUAL } from './content-safety';

export interface PreviousScene {
  scene_number: number;
  script_snippet: string;
  visual_prompt: string;
  pacing_phase: string;
}

export const SCENE_SECTION_PROMPT = (
  sectionText: string,
  sectionIndex: number,
  totalSections: number,
  startSceneNumber: number,
  globalWordOffset: number,
  previousScenes?: PreviousScene[]
) => {
  const continuitySection = previousScenes && previousScenes.length > 0
    ? `### CONTINUITY CONTEXT (CRITICAL)

The following scenes were generated for the previous section. Your scenes MUST continue seamlessly from where these left off. Do NOT re-cover any script content from these scenes. Begin your first scene's script_snippet immediately after the last snippet shown below.

${previousScenes.map(s => `**Scene ${s.scene_number}** [${s.pacing_phase}]:
- Script: "${s.script_snippet}"
- Visual: "${s.visual_prompt}"`).join('\n\n')}

---
`
    : '';

  return `### ROLE

You are a **Visual Director** for historical documentary content, specialized in translating narration into stunning visual scene descriptions.

${CONTENT_SAFETY_VISUAL}

### OBJECTIVE

This is **section ${sectionIndex + 1} of ${totalSections}** of the script.

**Create as many scenes as the content below requires.** Cover EVERY sentence of the script section below — do not skip or summarize any content. Each scene's script_snippet should contain a portion of the text, and together all snippets must cover the entire section.

### PACING SCHEDULE

You are starting at **word ${globalWordOffset}** of the overall script. As you create scenes, keep a running count of words consumed. Apply the pacing phase that matches your current position in the overall script:

| Word range (overall) | Phase        | Scene duration | Max words per snippet |
|----------------------|--------------|----------------|-----------------------|
| 0–200                | HOOK         | 1.5–2.5s       | 6                     |
| 201–600              | SETUP        | 3–5s           | 13                    |
| 601–2000             | CORE_CONTENT | 5–8s           | 20                    |
| 2001+                | DEEP_CONTENT | 6–10s          | 25                    |

Set each scene's \`"pacing_phase"\` to the phase matching its position. If this section spans a phase boundary, scenes before the boundary use the earlier phase and scenes after use the later phase.

Scene numbers start at **${startSceneNumber}**.

${continuitySection}### SCRIPT SECTION TO COVER

${sectionText}

### MAP SCENE DETECTION

**When to Generate Map Scenes:**
- When the script introduces a NEW significant location for the first time
- When geographic context is essential to understanding the narrative
- When political boundaries or territories are being discussed

**Map Scene Requirements:**
- Generate the map scene BEFORE the related visual scenes
- Include "map_data" object with structured geographic information

**Map Scene Script Snippets (CRITICAL):**
Map scenes MUST have script_snippets that contain ONLY location/geographic references, NOT battle action descriptions.

### DIRECTOR RULES (CINEMATIC SHOT SELECTION)

**1. LIST RULE:** Multiple items in sequence → separate short scenes, "Medium Action"
**2. NOUN RULE:** Specific object/weapon/artifact → "Extreme Close-Up" focused on object
**3. INTRODUCTION RULE:** Major figure first introduced → "Low Angle" or "Medium Action"
**4. SCALE RULE:** Dates, new locations, army sizes → "Establishing Wide"
**5. EMOTION RULE:** Facial expressions, decisions → "Close-Up"
**6. CHAOS RULE:** Battle sequences → "High Angle" or "Medium Action"
**7. WITNESS RULE:** Experiences of those affected → "POV"

### VISUAL PROMPT FORMULA

Each visual_prompt MUST follow: [Shot Type] of [Subject] [Action]. [Lighting/Atmosphere]. [Historical Details].
Each visual_prompt must be 50-100 words.

### OUTPUT FORMAT

Return a JSON array of scenes (ONLY valid JSON, no markdown code blocks).

[
  {
    "scene_number": ${startSceneNumber},
    "scene_type": "visual",
    "shot_type": "...",
    "pacing_phase": "<phase from pacing schedule above>",
    "suggested_duration": ...,
    "script_snippet": "...",
    "visual_prompt": "...",
    "historical_context": "..."
  }
]

### CONSTRAINTS

- Cover the ENTIRE script section above — every sentence must appear in a scene's script_snippet
- Scene numbers start at ${startSceneNumber} and increment sequentially
- **EVERY scene MUST have "pacing_phase", "suggested_duration", and "shot_type" fields**
- Apply Director Rules for shot_type selection
- Split text at natural breakpoints (periods, commas, em-dashes, semicolons) when snippet exceeds the max words for the current pacing phase
- Historical_context is optional but valuable
- Maintain chronological order matching the script
- If the script references modern researchers, archaeologists, historians, or scholars discussing the events, do NOT create a visual scene depicting those modern figures. Instead, keep the visual_prompt focused on the historical subject they are discussing (the artifact, the battlefield, the ruins, etc.). The script_snippet should still include the narration text for coverage, but the visual must depict the historical story, not a modern person.`;
};
