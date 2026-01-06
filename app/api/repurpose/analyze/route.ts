import { NextRequest, NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/anthropic';
import {
  SCRIPT_ANALYSIS_SYSTEM,
  SCRIPT_ANALYSIS_PROMPT,
} from '@/lib/prompts/repurpose-prompts';
import type { YouTubeExtraction, ScriptAnalysis } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for analysis

interface AnalyzeRequest {
  extraction: YouTubeExtraction;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { extraction } = body;

    // Validation
    if (!extraction || !extraction.transcript?.text) {
      return NextResponse.json({ error: 'Extraction data is required' }, { status: 400 });
    }

    console.log(`[Repurpose Analyze] Analyzing script (${extraction.transcript.wordCount} words)`);

    const prompt = SCRIPT_ANALYSIS_PROMPT(extraction);
    const response = await generateWithClaude(prompt, SCRIPT_ANALYSIS_SYSTEM, 0.7, 4096);

    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from Claude');
    }

    // Parse JSON response
    let analysis: ScriptAnalysis;
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(cleaned);
      }
      analysis.analyzedAt = new Date();
    } catch (parseError) {
      console.error('[Repurpose Analyze] Parse error:', parseError);
      console.error('[Repurpose Analyze] Raw response:', response);
      throw new Error('Failed to parse analysis response');
    }

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
