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

export const SCRIPT_REWRITE_SYSTEM = `You are a master YouTube scriptwriter known for creating highly engaging, retention-optimized content. You specialize in "in media res" openings, powerful hooks, and strategic retention tactics that keep viewers watching until the end.`;

export const SCRIPT_REWRITE_PROMPT = (
  extraction: YouTubeExtraction,
  analysis: ScriptAnalysis
) => `### OBJECTIVE

Rewrite the following YouTube script to maximize engagement and retention. The output must be optimized for Text-to-Speech (TTS) narration.

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
- Open with a specific, vivid scene that immediately immerses the viewer
- The first sentence should create instant curiosity

**2. VERY STRONG HOOK (First 60 seconds / ~150 words)**
- Must include: a surprising fact, a bold claim, or a dramatic moment
- Must create a curiosity gap (unanswered question)
- Must establish stakes (why should they care?)
- Must make a promise about what they'll learn/experience

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
