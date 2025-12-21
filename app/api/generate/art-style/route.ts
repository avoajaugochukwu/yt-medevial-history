import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { SYSTEM_PROMPT, GENERATE_ART_STYLE_PROMPT } from '@/lib/prompts/all-prompts';
import type { HistoricalEra } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 30;

interface ArtStyleRequest {
  era: HistoricalEra;
  title: string;
}

/**
 * POST /api/generate/art-style
 *
 * AI-Generated Art Style Determination for Tactical Documentaries
 * Uses Claude to analyze the historical era and generate a military/battle-appropriate painting style
 */
export async function POST(request: NextRequest) {
  try {
    const body: ArtStyleRequest = await request.json();
    const { era, title } = body;

    // Validation
    if (!era) {
      return NextResponse.json({ error: 'Era is required' }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    console.log(`[Art Style] Generating tactical art style for: "${title}" (${era})`);

    const client = getAnthropicClient();
    const prompt = GENERATE_ART_STYLE_PROMPT(era, title);

    const response = await client.messages.create({
      model: 'claude-haiku-3-5-20241022', // Using Haiku for speed and cost efficiency
      max_tokens: 1000,
      temperature: 0.8, // Higher temperature for creative style generation
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const artStyle = content.text.trim();

    console.log(`[Art Style] Generated tactical art style (${artStyle.length} chars)`);
    console.log(`[Art Style] Preview: ${artStyle.substring(0, 150)}...`);

    return NextResponse.json({
      success: true,
      artStyle,
    });
  } catch (error) {
    console.error('[Art Style] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate art style',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
