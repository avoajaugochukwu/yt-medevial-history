import { NextRequest, NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/anthropic';
import {
  SYSTEM_PROMPT,
  HOOK_PROMPT,
  MASTER_OUTLINE_PROMPT,
  RECURSIVE_BATCH_PROMPT,
  WAR_ROOM_STYLE,
  WORD_COUNT_TARGETS,
} from '@/lib/prompts/war-room';
import { parseJsonObject } from '@/lib/api/json-parser';
import { validateRequest, isValidationError, FinalScriptSchema } from '@/lib/api/validate';
import type {
  TacticalResearch,
  GamifiedWarOutline,
  ScriptBatch,
  RecursiveScript,
  RecursivePromptPayload,
  ScriptDuration,
} from '@/lib/types';

// Use Node.js runtime for longer timeout (recursive generation takes time)
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for full recursive generation

interface RecursiveScriptRequest {
  title: string;
  research: string; // JSON stringified TacticalResearch
  targetDuration: number; // Minutes (8-12, 20, or 35)
  scriptDuration?: ScriptDuration; // 'short' | 'medium' | 'long'
}

// 5 batches for Gamified War (one per section)
const TOTAL_BATCHES = 5;

// Convert numeric duration to ScriptDuration type
const getScriptDuration = (minutes: number): ScriptDuration => {
  if (minutes <= 12) return 'short';
  if (minutes <= 25) return 'medium';
  return 'long';
};

/**
 * POST /api/generate/final-script
 *
 * Recursive State-Machine Script Generation
 * Generates a 35-minute War Room tactical documentary in 7 batches
 */
export async function POST(request: NextRequest) {
  try {
    const validated = await validateRequest(request, FinalScriptSchema);
    if (isValidationError(validated)) return validated;
    const { title, research: researchJson, targetDuration } = validated;

    // Parse research data
    let research: TacticalResearch;
    try {
      research = JSON.parse(researchJson);
    } catch {
      return NextResponse.json({ error: 'Invalid research data format' }, { status: 400 });
    }

    // Era is now inferred from research data
    const era = research.era;

    // Determine script duration from numeric target
    const scriptDuration: ScriptDuration = validated.scriptDuration || getScriptDuration(targetDuration);
    const wordTargets = WORD_COUNT_TARGETS[scriptDuration];

    console.log(
      `[Recursive Script] Starting generation for: "${title}" (${era}, ${targetDuration} minutes, ${scriptDuration} format)`
    );

    // ========================================================================
    // PHASE 1: Generate Hook (~150 words, 60 seconds)
    // ========================================================================
    console.log('[Recursive Script] Phase 1: Generating hook...');

    const hookPrompt = HOOK_PROMPT(research);
    const hook = await generateWithClaude(hookPrompt, SYSTEM_PROMPT, 0.8, 500);

    if (!hook || hook.trim().length === 0) {
      throw new Error('Failed to generate hook');
    }

    console.log(`[Recursive Script] Hook generated: ${countWords(hook)} words`);

    // ========================================================================
    // PHASE 2: Generate Gamified War Outline (5 points with 4-point analysis)
    // ========================================================================
    console.log('[Recursive Script] Phase 2: Generating Gamified War outline...');

    const outlinePrompt = MASTER_OUTLINE_PROMPT(research, hook, scriptDuration);
    const outlineResponse = await generateWithClaude(outlinePrompt, SYSTEM_PROMPT, 0.7, 6000);

    if (!outlineResponse || outlineResponse.trim().length === 0) {
      throw new Error('Failed to generate outline');
    }

    // Parse the outline JSON
    const outline = parseJsonObject<GamifiedWarOutline>(outlineResponse);
    if (!outline) {
      console.error('[Recursive Script] Outline parse error');
      throw new Error('Failed to parse Gamified War outline');
    }
    outline.generated_at = new Date();
    outline.target_duration = scriptDuration;

    console.log('[Recursive Script] Gamified War outline generated with 5 sections + 4-point analysis');

    // ========================================================================
    // PHASE 3: Recursive Batch Generation (5 batches - one per Gamified War section)
    // ========================================================================
    console.log('[Recursive Script] Phase 3: Starting recursive batch generation...');

    const batches: ScriptBatch[] = [];
    let previousPayload: RecursivePromptPayload | null = null;
    const previousChunks: string[] = [];

    // Calculate max tokens based on word target (rough estimate: 1.3 tokens per word)
    const maxBatchTokens = Math.round(wordTargets.perBatch * 1.5) + 500;

    for (let batchNumber = 1; batchNumber <= TOTAL_BATCHES; batchNumber++) {
      console.log(`[Recursive Script] Generating batch ${batchNumber}/${TOTAL_BATCHES}...`);

      const batchPrompt = RECURSIVE_BATCH_PROMPT(
        batchNumber,
        outline,
        research,
        previousPayload,
        previousChunks
      );

      const batchResponse = await generateWithClaude(batchPrompt, SYSTEM_PROMPT, 0.8, maxBatchTokens);

      if (!batchResponse || batchResponse.trim().length === 0) {
        throw new Error(`Failed to generate batch ${batchNumber}`);
      }

      // Parse the batch response
      let batchData: { script_chunk: string; next_prompt_payload: RecursivePromptPayload };
      const parsed = parseJsonObject<{ script_chunk: string; next_prompt_payload: RecursivePromptPayload }>(batchResponse);
      if (parsed) {
        batchData = parsed;
      } else {
        console.error(`[Recursive Script] Batch ${batchNumber} parse error, using raw response`);
        // If parsing fails, try to extract just the script content
        batchData = {
          script_chunk: batchResponse,
          next_prompt_payload: {
            summary_of_previous: `Batch ${batchNumber} content`,
            current_momentum: batchNumber <= 3 ? 'building tension' : 'peak action',
            next_objectives: [`Continue to batch ${batchNumber + 1}`],
            style_reminder: 'Maintain War Room tactical style',
          },
        };
      }

      const batch: ScriptBatch = {
        batch_number: batchNumber,
        script_chunk: batchData.script_chunk,
        word_count: countWords(batchData.script_chunk),
        next_prompt_payload: batchData.next_prompt_payload,
        generated_at: new Date(),
      };

      batches.push(batch);
      previousPayload = batchData.next_prompt_payload;
      previousChunks.push(batchData.script_chunk);

      console.log(`[Recursive Script] Batch ${batchNumber} complete: ${batch.word_count} words`);
    }

    // ========================================================================
    // PHASE 4: Aggregate and Validate
    // ========================================================================
    console.log('[Recursive Script] Phase 4: Aggregating script...');

    // Combine hook and all batches
    const fullScript = [hook, ...batches.map((b) => b.script_chunk)].join('\n\n');
    const totalWordCount = countWords(fullScript);

    // Validate style compliance
    const styleViolations = validateStyleCompliance(fullScript);
    if (styleViolations.length > 0) {
      console.warn('[Recursive Script] Style violations detected:', styleViolations);
    }

    const recursiveScript: RecursiveScript = {
      hook,
      master_outline: outline,
      batches,
      full_script: fullScript,
      total_word_count: totalWordCount,
      topic: title,
      era,
      target_duration: targetDuration,
      generated_at: new Date(),
    };

    console.log(
      `[Recursive Script] Complete! Total: ${totalWordCount} words (target: ${wordTargets.total})`
    );

    return NextResponse.json({
      success: true,
      script: recursiveScript,
      metadata: {
        total_word_count: totalWordCount,
        estimated_duration_minutes: Math.round((totalWordCount / 150) * 10) / 10,
        batch_count: TOTAL_BATCHES,
        script_duration: scriptDuration,
        target_word_count: wordTargets.total,
        style_violations: styleViolations,
      },
    });
  } catch (error) {
    console.error('[Recursive Script] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recursive script',
        details: errorMessage,
        troubleshooting: {
          apiConfigured: !!process.env.ANTHROPIC_API_KEY,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Validate style compliance against War Room constraints
 */
function validateStyleCompliance(script: string): string[] {
  const violations: string[] = [];
  const lowerScript = script.toLowerCase();

  // Check for prohibited words
  for (const word of WAR_ROOM_STYLE.prohibited_words) {
    if (lowerScript.includes(word.toLowerCase())) {
      violations.push(`Prohibited word detected: "${word}"`);
    }
  }

  // Check for mandatory terminology usage
  let mandatoryCount = 0;
  for (const term of WAR_ROOM_STYLE.mandatory_terminology) {
    if (lowerScript.includes(term.toLowerCase())) {
      mandatoryCount++;
    }
  }

  if (mandatoryCount < 5) {
    violations.push(
      `Low mandatory terminology usage: ${mandatoryCount}/10 terms found (recommend 5+)`
    );
  }

  // Check for contraction usage (should use contractions)
  const expansions = ["it is", "do not", "will not", "can not", "they are"];
  for (const expansion of expansions) {
    if (lowerScript.includes(expansion)) {
      violations.push(`Should use contraction for: "${expansion}"`);
    }
  }

  return violations;
}
