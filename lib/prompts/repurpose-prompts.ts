import type { YouTubeExtraction, ScriptAnalysis } from '@/lib/types';

// ============================================================================
// PHASE 1: SCRIPT ANALYSIS PROMPT
// ============================================================================

export const SCRIPT_ANALYSIS_SYSTEM = `You are an expert YouTube script analyst specializing in viewer retention, hook construction, and engagement optimization. You analyze scripts with a focus on what makes content compelling and binge-worthy.`;

export const SCRIPT_ANALYSIS_PROMPT = (extraction: YouTubeExtraction) => `### OBJECTIVE

Analyze the following YouTube script for quality, retention tactics, and adherence to YouTube best practices. Provide actionable feedback for improvement.

### SCRIPT CONTEXT

**Word Count:** ${extraction.transcript.wordCount} words

### SCRIPT TO ANALYZE

<script>
${extraction.transcript.text}
</script>

### ANALYSIS REQUIREMENTS

Evaluate the script across these dimensions:

**1. HOOK QUALITY (First 30-60 seconds)**
- Does it immediately capture attention?
- Is there a compelling promise or question?
- Does it create curiosity gaps?
- Is there emotional engagement from the start?
- Rate 1-10 with specific strengths, weaknesses, and improvement suggestions

**2. RETENTION TACTICS**
Identify and evaluate the presence of:
- Pattern interrupts (changes in pace, tone, or topic)
- Open loops (unresolved questions that keep viewers watching)
- Payoffs (satisfying resolutions to earlier promises)
- Re-hooks (mini-hooks throughout to re-engage wandering attention)
- Stakes escalation (building tension and importance)
- Bucket brigades (transitional phrases that pull forward)
- Rate 1-10 with identified tactics, missing tactics, and suggestions

**3. STRUCTURE & PACING**
- How well does the content flow?
- Are transitions smooth or jarring?
- Is there a clear narrative arc?
- Are there dead spots or filler sections?
- Do payoffs match the promises made?
- Rate 1-10 with analysis

**4. OVERALL ASSESSMENT**
- Overall score (average of above)
- Top 3 key strengths to preserve
- Top 3 critical improvements needed

### OUTPUT FORMAT

Return a JSON object (and ONLY valid JSON, no markdown code blocks):

{
  "hookQuality": {
    "score": <1-10>,
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "retentionTactics": {
    "score": <1-10>,
    "identifiedTactics": ["tactic 1 with example", "tactic 2 with example"],
    "missingTactics": ["missing tactic 1", "missing tactic 2"],
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "structureAnalysis": {
    "score": <1-10>,
    "pacing": "Description of pacing quality",
    "transitions": "Description of transition quality",
    "payoffs": "Description of how well promises are paid off"
  },
  "overallScore": <1-10>,
  "keyStrengths": ["strength 1", "strength 2", "strength 3"],
  "criticalImprovements": ["improvement 1", "improvement 2", "improvement 3"]
}`;

// ============================================================================
// PHASE 2: SCRIPT REWRITE PROMPT
// ============================================================================

export const SCRIPT_REWRITE_SYSTEM = `You are a master YouTube scriptwriter known for creating highly engaging, retention-optimized content. You specialize in "in media res" openings, powerful hooks, and strategic retention tactics that keep viewers watching until the end.

CONTENT SAFETY DIRECTIVE (MANDATORY - VIOLATION = REJECTED OUTPUT):
You operate as a "Sanitized Narrator." YOUR OUTPUT WILL BE REJECTED if it contains ANY of the following:
- Smell descriptions: stench, reek, odor, rotting smell, "hit like a wall", "choked the air"
- Decay descriptions: rotting, decomposing, liquefying, festering, putrid, decaying corpses
- Physical penetration: piercing flesh, impaling, puncturing, skewering, stakes through bodies
- Bodily fluids: blood pooling, viscera, entrails, gore, pus
- Physical agony: screaming in pain, writhing, suffering, agonizing death

This applies to ALL sections including hooks. There are NO exceptions.

SIMPLIFY OR DROP RULE:
- If death detail is NOT critical → DROP IT ENTIRELY
- If critical → simple statement: "X was killed" or "thousands were executed"
- NEVER describe the METHOD of death (no "stakes piercing", "impaled", "corpses displayed")
- "20,000 stakes with bodies" → "20,000 executions displayed as a warning"
- "impaled bodies" → "executed prisoners"

Focus on STRATEGY, PSYCHOLOGY, IMPACT, and OUTCOMES — never sensory details of death or decay.`;

export const SCRIPT_REWRITE_PROMPT = (
  extraction: YouTubeExtraction,
  analysis: ScriptAnalysis
) => `### OBJECTIVE

Rewrite the following YouTube script to maximize engagement and retention. The output must be optimized for Text-to-Speech (TTS) narration.

### CONTENT FILTER (MANDATORY - VIOLATION = REJECTED OUTPUT)

YOUR SCRIPT WILL BE REJECTED if it contains ANY of the following:
- Smell descriptions: stench, reek, odor, "hit like a wall", "choked the air", "smell of death"
- Decay descriptions: rotting, decomposing, liquefying, festering, putrid, "decaying corpses"
- Physical gore: piercing flesh, impaling, puncturing, skewering, "stakes through bodies", blood, viscera
- Physical agony: screaming in pain, writhing, suffering, agonizing death

**TRANSLATION GUIDE — Use These Patterns:**

| REJECTED (sensory) | APPROVED (psychological) |
|---|---|
| "The stench of rotting bodies choked the air" | "The overwhelming psychological weight of the scene paralyzed the army" |
| "Stakes piercing decaying corpses" | "A forest of stakes — a psychological barrier designed to break morale" |
| "Blood turned the river red" | "Casualty rates spiked at the river crossing" |
| "The smell of death forced retreat" | "The sheer scale of the defeat triggered a forced withdrawal" |
| "Liquefying flesh in the sun" | "The grim reality of the battlefield" |
| "20,000 stakes bearing human forms" | "20,000 executions displayed as a warning" |
| "impaled bodies" | "executed prisoners" |
| "corpse of X displayed on a stake" | "X was killed and displayed as a message" |

**SIMPLIFY OR DROP RULE:**
- If death detail is NOT critical → DROP IT ENTIRELY
- If critical → simple statement: "X was killed" or "thousands were executed"
- NEVER describe the METHOD of death in detail

**FRAMEWORK: ABSTRACTION OVER SENSATION**
Describe the *Strategic* or *Psychological* impact, never the sensory details.
- BAD: "He watched the blood pool around his feet."
- GOOD: "He watched his army's morale disintegrate in an instant."

### ORIGINAL SCRIPT CONTEXT

**Original Word Count:** ${extraction.transcript.wordCount} words

### TARGET PARAMETERS

- **Target Duration:** 25 minutes
- **Target Word Count:** ~3,750 words (150 words per minute speaking rate)
- **Format:** Plain paragraphs only (TTS-ready)

### ANALYSIS FEEDBACK TO ADDRESS

**Key Strengths to Preserve:**
${analysis.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Critical Improvements to Make:**
${analysis.criticalImprovements.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Hook Issues:**
${analysis.hookQuality.weaknesses.join(', ') || 'None identified'}

**Missing Retention Tactics:**
${analysis.retentionTactics.missingTactics.join(', ') || 'None identified'}

### ORIGINAL SCRIPT

<original_script>
${extraction.transcript.text}
</original_script>

### REWRITING REQUIREMENTS

**1. IN MEDIA RES OPENING (CRITICAL)**
- Start in the middle of action or at a dramatic moment
- DO NOT start with background, context, or "Today we're going to talk about..."
- **IMPORTANT:** Do NOT use gore or shock-value decay to create the hook. Use *Irony* or *Strategic Impossibility*.
- Example: "The Ottoman Army wasn't stopped by cannons or walls... they were stopped by fear." (NOT "stopped by the smell of rotting corpses")
- The first sentence should create instant curiosity about the *outcome* or *stakes*, not sensory shock

**2. VERY STRONG HOOK (First 60 seconds / ~150 words)**
- **Identify the Subversion:** Scan the original script to find the specific moment where expectation was subverted
- **Juxtaposition Requirement:** Contrast "The Invincible" (empire/figure at peak power) against "The Ruin" (the unexpected element that destroyed them)
- **DO NOT start with "In this video."** Start with the moment of maximum tragedy or shock (PSYCHOLOGICAL shock, not visual/sensory shock)
- **Use the "Impossible" Keyword:** Frame the central conflict using "Impossible" or "Defies belief"
- **Engagement Bridge:** End the hook with: "If you want to see how [Giant] fell to [Pebble], smash that subscribe button." (BEFORE intro animation/music)

**3. HIGH RETENTION TACTICS THROUGHOUT**
Apply these techniques every 2-3 minutes:

- **Open Loops:** Tease upcoming content ("But that's not even the strangest part...")
- **Pattern Interrupts:** Change pace, tone, or introduce new elements
- **Re-hooks:** Mini-hooks that re-engage attention ("Here's where it gets interesting...")
- **Stakes Escalation:** Build importance over time
- **Bucket Brigades:** Transitional phrases ("And here's the thing:", "But wait:", "It gets better:")
- **Payoffs:** Satisfy previously created curiosity at strategic points

**4. STRONG PAYOFFS**
- Every promise made must be fulfilled
- Save the biggest revelation for the final third
- End with a satisfying conclusion that was earned

**5. TTS-READY FORMAT (CRITICAL)**
- Plain paragraphs ONLY
- NO headers, bullet points, or section markers
- NO stage directions like [pause], [music], [visual]
- NO "Now let's talk about..." or explicit transitions
- Write for the EAR, not the eye
- Use natural spoken language, contractions, and conversational flow

**6. WRITING STYLE (CRITICAL)**
- NO flowery or purple prose - be direct and concrete
- NO clichés or overused phrases like:
  - "What comes next will shock you"
  - "In a world of..."
  - "Little did they know..."
  - "But fate had other plans"
- NO repetitive sentence structures - avoid starting multiple consecutive sentences the same way
  - BAD: "To teach him. To build him. To guide him."
  - GOOD: Combine into a single sentence or vary the structure
- Prefer concrete, specific language over vague dramatic statements

### OUTPUT

Return ONLY the rewritten script as plain text paragraphs. No JSON, no metadata, no commentary. Just the TTS-ready script.

The script should be approximately 3,750 words (25 minutes at 150 wpm).`;

// ============================================================================
// PHASE 3: TITLE GENERATION PROMPT
// ============================================================================

export const TITLE_GENERATION_SYSTEM = `You are an expert YouTube title writer specializing in clickable, curiosity-driven titles that maximize CTR while accurately representing the content.`;

export const TITLE_GENERATION_PROMPT = (script: string) => `Generate 3 YouTube title options for the following script.

### REQUIREMENTS
- Each title should be 50-70 characters
- Use curiosity gaps, numbers, or power words
- Avoid clickbait that doesn't deliver on the content
- Make each title distinctly different in approach (e.g., question-based, statement, number-focused)
- Titles should accurately reflect the script content

### SCRIPT
<script>
${script.substring(0, 5000)}
</script>

### OUTPUT FORMAT

Return a JSON array of exactly 3 title strings (and ONLY valid JSON, no markdown code blocks):

["Title Option 1", "Title Option 2", "Title Option 3"]`;
