import { NextRequest, NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/anthropic';
import { SYSTEM_PROMPT, FINAL_SCRIPT_PROMPT } from '@/lib/prompts/all-prompts';
import type { Script, NarrativeTone, HistoricalEra } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 120; // Claude may take longer for long-form content

interface FinalScriptRequest {
  title: string;
  research: string; // JSON stringified HistoricalResearch
  outline: string; // JSON stringified NarrativeOutline
  tone: NarrativeTone;
  era: HistoricalEra;
  targetDuration: number; // Target video duration in minutes
}

/**
 * POST /api/generate/final-script
 *
 * PROMPT 3: Final Script Generation (uses Claude)
 * Converts research and outline into cinematic historical narration
 */
export async function POST(request: NextRequest) {
  try {
    const body: FinalScriptRequest = await request.json();
    const { title, research, outline, tone, era, targetDuration } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!research || research.trim().length === 0) {
      return NextResponse.json({ error: 'Research data is required' }, { status: 400 });
    }

    if (!outline || outline.trim().length === 0) {
      return NextResponse.json({ error: 'Narrative outline is required' }, { status: 400 });
    }

    if (!tone || !era) {
      return NextResponse.json({ error: 'Tone and era are required' }, { status: 400 });
    }

    if (!targetDuration || targetDuration <= 0) {
      return NextResponse.json({ error: 'Target duration is required and must be positive' }, { status: 400 });
    }

    console.log(`[Final Script] Generating historical narrative for: "${title}" (${era}, ${tone} tone, ${targetDuration} minutes)`);

    const prompt = FINAL_SCRIPT_PROMPT(title, research, outline, tone, era, targetDuration);

    // Use Claude for long-form historical narrative generation
    // Calculate target word count (150 words per minute)
    const targetWordCount = targetDuration * 150;

    // Dynamically adjust maxTokens based on target duration
    // Rough estimate: 1 token ≈ 0.75 words, so multiply by ~1.5 for safety margin
    const estimatedTokens = Math.ceil(targetWordCount * 1.5);
    const maxTokens = Math.min(Math.max(estimatedTokens, 2048), 16000); // Clamp between 2k-16k tokens

    const scriptContent = await generateWithClaude(prompt, SYSTEM_PROMPT, 0.8, maxTokens);

    if (!scriptContent || scriptContent.trim().length === 0) {
      throw new Error('Claude returned empty content');
    }

    // Count words in the generated script
    const wordCount = countWords(scriptContent);

    console.log(`[Final Script] Generated historical narrative: ${wordCount} words (target: ${targetWordCount})`);

    const finalScript: Script = {
      content: scriptContent,
      word_count: wordCount,
      topic: title,
      tone,
      era,
      target_duration: targetDuration,
      generated_at: new Date(),
    };

    return NextResponse.json({
      success: true,
      script: finalScript,
      metadata: {
        word_count: wordCount,
        estimated_duration_minutes: Math.round((wordCount / 150) * 10) / 10, // ~150 words per minute
        tone,
        era,
      },
    });
  } catch (error) {
    console.error('[Final Script] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate final script',
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
