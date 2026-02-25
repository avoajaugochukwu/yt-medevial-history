import { NextRequest, NextResponse } from 'next/server';
import { generateWithOpenAI } from '@/lib/ai/openai';
import { SCRIPT_AUDIT_PROMPT } from '@/lib/prompts/war-room';
import { validateRequest, isValidationError, AuditScriptSchema } from '@/lib/api/validate';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds should be enough for analysis

interface AuditRequest {
  script: string;
}

/**
 * POST /api/generate/analyze-repetition
 *
 * Analyzes a script for repetition, structural loops, and overused jargon.
 * Uses OpenAI GPT-4o to generate a detailed audit report.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await validateRequest(request, AuditScriptSchema);
    if (isValidationError(result)) return result;
    const { script } = result;

    console.log('[analyze-repetition] Starting script audit...');
    console.log(`[analyze-repetition] Script length: ${script.length} characters`);

    const auditPrompt = SCRIPT_AUDIT_PROMPT(script);

    // Use lower temperature for more consistent, analytical output
    const report = await generateWithOpenAI(auditPrompt, undefined, 0.3, 3000);

    console.log('[analyze-repetition] Audit complete');
    console.log(`[analyze-repetition] Report length: ${report.length} characters`);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('[analyze-repetition] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze script for repetition',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
