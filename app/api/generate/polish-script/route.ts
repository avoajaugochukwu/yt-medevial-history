import { NextRequest, NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/anthropic';
import { SCRIPT_POLISH_PROMPT, SYSTEM_PROMPT } from '@/lib/prompts/war-room';
import { validateRequest, isValidationError, PolishScriptSchema } from '@/lib/api/validate';
import { WORDS_PER_MINUTE } from '@/lib/config/content';
import { sanitizeEmDashes } from '@/lib/utils/sanitize-script';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for rewriting long scripts

interface PolishRequest {
  rawScript: string;
  auditReport: string;
  targetDuration: number;
}

/**
 * POST /api/generate/polish-script
 *
 * Rewrites a script based on an audit report to eliminate repetition
 * and produce a linear, professional narrative.
 * Uses Claude (Sonnet) for high-quality creative writing.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await validateRequest(request, PolishScriptSchema);
    if (isValidationError(result)) return result;
    const { rawScript, auditReport, targetDuration } = result;

    console.log('[polish-script] Starting script polish...');
    console.log(`[polish-script] Raw script: ${rawScript.length} characters`);
    console.log(`[polish-script] Target duration: ${targetDuration} minutes`);
    console.log(`[polish-script] Target word count: ~${targetDuration * WORDS_PER_MINUTE} words`);

    const polishPrompt = SCRIPT_POLISH_PROMPT(rawScript, auditReport, targetDuration);

    // Use moderate temperature for creative but controlled rewriting
    // Higher max tokens to accommodate long scripts
    let polishedContent = await generateWithClaude(
      polishPrompt,
      SYSTEM_PROMPT,
      0.7,
      12000 // Allow up to ~9000 words for 35-minute scripts
    );

    polishedContent = sanitizeEmDashes(polishedContent);

    // Calculate word count
    const wordCount = polishedContent.split(/\s+/).filter(Boolean).length;

    console.log('[polish-script] Polish complete');
    console.log(`[polish-script] Polished word count: ${wordCount}`);

    return NextResponse.json({
      success: true,
      polishedContent,
      wordCount,
    });
  } catch (error) {
    console.error('[polish-script] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to polish script',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
