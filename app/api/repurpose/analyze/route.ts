import { NextRequest, NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/anthropic';
import {
  SCRIPT_ANALYSIS_SYSTEM,
  SCRIPT_ANALYSIS_PROMPT,
} from '@/lib/prompts/repurpose-prompts';
import { parseJsonObject } from '@/lib/api/json-parser';
import { validateRequest, isValidationError, RepurposeAnalyzeSchema } from '@/lib/api/validate';
import type { YouTubeExtraction, ScriptAnalysis } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for analysis

interface AnalyzeRequest {
  extraction: YouTubeExtraction;
}

export async function POST(request: NextRequest) {
  try {
    const result = await validateRequest(request, RepurposeAnalyzeSchema);
    if (isValidationError(result)) return result;
    const { extraction } = result as { extraction: YouTubeExtraction };

    console.log(`[Repurpose Analyze] Analyzing script (${extraction.transcript.wordCount} words)`);

    const prompt = SCRIPT_ANALYSIS_PROMPT(extraction);
    const response = await generateWithClaude(prompt, SCRIPT_ANALYSIS_SYSTEM, 0.7, 4096);

    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from Claude');
    }

    // Parse JSON response
    const analysis = parseJsonObject<ScriptAnalysis>(response);
    if (!analysis) {
      console.error('[Repurpose Analyze] Parse error. Raw response:', response);
      throw new Error('Failed to parse analysis response');
    }
    analysis.analyzedAt = new Date();

    console.log(`[Repurpose Analyze] Complete. Overall score: ${analysis.overallScore}/10`);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('[Repurpose Analyze] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze script',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
