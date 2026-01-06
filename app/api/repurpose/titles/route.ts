import { NextRequest, NextResponse } from 'next/server';
import { generateWithClaude } from '@/lib/ai/anthropic';
import {
  TITLE_GENERATION_SYSTEM,
  TITLE_GENERATION_PROMPT,
} from '@/lib/prompts/repurpose-prompts';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute for title generation

interface TitlesRequest {
  script: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TitlesRequest = await request.json();
    const { script } = body;

    // Validation
    if (!script || script.trim().length === 0) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }

    console.log(`[Repurpose Titles] Generating titles for script (${script.split(/\s+/).length} words)`);

    const prompt = TITLE_GENERATION_PROMPT(script);
    const response = await generateWithClaude(prompt, TITLE_GENERATION_SYSTEM, 0.8, 1024);

    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from Claude');
    }

    // Parse JSON response
    let titles: string[];
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        titles = JSON.parse(jsonMatch[0]);
      } else {
        titles = JSON.parse(cleaned);
      }

      if (!Array.isArray(titles) || titles.length !== 3) {
        throw new Error('Expected exactly 3 titles');
      }
    } catch (parseError) {
      console.error('[Repurpose Titles] Parse error:', parseError);
      console.error('[Repurpose Titles] Raw response:', response);
      throw new Error('Failed to parse titles response');
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
