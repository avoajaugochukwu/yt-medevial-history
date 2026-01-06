import { NextRequest, NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/anthropic';
import {
  SCRIPT_REWRITE_SYSTEM,
  SCRIPT_REWRITE_PROMPT,
} from '@/lib/prompts/repurpose-prompts';
import type { YouTubeExtraction, ScriptAnalysis, RewrittenScript } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 180; // 3 minutes for rewrite

interface RewriteRequest {
  extraction: YouTubeExtraction;
  analysis: ScriptAnalysis;
}

export async function POST(request: NextRequest) {
  try {
    const body: RewriteRequest = await request.json();
    const { extraction, analysis } = body;

    // Validation
    if (!extraction || !analysis) {
      return NextResponse.json(
        { error: 'Extraction and analysis data required' },
        { status: 400 }
      );
    }

    console.log(`[Repurpose Rewrite] Rewriting script (${extraction.transcript.wordCount} words)`);

    const prompt = SCRIPT_REWRITE_PROMPT(extraction, analysis);
    // Use higher max tokens for 25-minute script (~3750 words * 1.3 tokens/word)
    const response = await generateWithClaude(prompt, SCRIPT_REWRITE_SYSTEM, 0.8, 8192);

    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from Claude');
    }

    const content = response.trim();
    const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
    const estimatedDuration = Math.round((wordCount / 150) * 10) / 10;

    const rewrittenScript: RewrittenScript = {
      content,
      wordCount,
      estimatedDuration,
      appliedTechniques: [
        'In media res opening',
        'Strong hook with curiosity gap',
        'Open loops throughout',
        'Pattern interrupts',
        'Re-hooks every 2-3 minutes',
        'Stakes escalation',
        'Strategic payoffs',
      ],
      rewrittenAt: new Date(),
    };

    console.log(
      `[Repurpose Rewrite] Complete. ${wordCount} words (~${estimatedDuration} min)`
    );

    return NextResponse.json({
      success: true,
      rewrittenScript,
    });
  } catch (error) {
    console.error('[Repurpose Rewrite] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to rewrite script',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
