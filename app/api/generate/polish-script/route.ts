import { NextRequest, NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/anthropic';
import { SCRIPT_POLISH_PROMPT, SYSTEM_PROMPT } from '@/lib/prompts/all-prompts';

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
    const body: PolishRequest = await request.json();
    const { rawScript, auditReport, targetDuration } = body;

    // Validation
    if (!rawScript || typeof rawScript !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rawScript is required and must be a string' },
        { status: 400 }
      );
    }

    if (!auditReport || typeof auditReport !== 'string') {
      return NextResponse.json(
        { success: false, error: 'auditReport is required and must be a string' },
        { status: 400 }
      );
    }

    if (!targetDuration || typeof targetDuration !== 'number' || targetDuration < 1) {
      return NextResponse.json(
        { success: false, error: 'targetDuration must be a positive number' },
        { status: 400 }
      );
    }

    console.log('[polish-script] Starting script polish...');
    console.log(`[polish-script] Raw script: ${rawScript.length} characters`);
    console.log(`[polish-script] Target duration: ${targetDuration} minutes`);
    console.log(`[polish-script] Target word count: ~${targetDuration * 150} words`);

    const polishPrompt = SCRIPT_POLISH_PROMPT(rawScript, auditReport, targetDuration);

    // Use moderate temperature for creative but controlled rewriting
    // Higher max tokens to accommodate long scripts
    const polishedContent = await generateWithClaude(
      polishPrompt,
      SYSTEM_PROMPT,
      0.7,
      12000 // Allow up to ~9000 words for 35-minute scripts
    );

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
