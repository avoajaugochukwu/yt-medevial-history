import { NextRequest, NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/anthropic';
import {
  TITLE_GENERATION_SYSTEM,
  TITLE_GENERATION_PROMPT,
} from '@/lib/prompts/repurpose-prompts';
import { parseJsonArray } from '@/lib/api/json-parser';
import { validateRequest, isValidationError, RepurposeTitlesSchema } from '@/lib/api/validate';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute for title generation

interface TitlesRequest {
  script: string;
}

export async function POST(request: NextRequest) {
  try {
    const result = await validateRequest(request, RepurposeTitlesSchema);
    if (isValidationError(result)) return result;
    const { script } = result;

    console.log(`[Repurpose Titles] Generating titles for script (${script.split(/\s+/).length} words)`);

    const prompt = TITLE_GENERATION_PROMPT(script);
    const response = await generateWithClaude(prompt, TITLE_GENERATION_SYSTEM, 0.8, 1024);

    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from Claude');
    }

    // Parse JSON response
    const titles = parseJsonArray<string>(response);
    if (!titles || titles.length !== 3) {
      console.error('[Repurpose Titles] Parse error. Raw response:', response);
      throw new Error('Failed to parse titles response - expected exactly 3 titles');
    }

    console.log('[Repurpose Titles] Generated titles:', titles);

    return NextResponse.json({
      success: true,
      titles,
    });
  } catch (error) {
    console.error('[Repurpose Titles] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate titles',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
