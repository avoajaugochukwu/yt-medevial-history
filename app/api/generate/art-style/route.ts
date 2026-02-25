import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/ai/openai';
import { SYSTEM_PROMPT } from '@/lib/prompts/war-room';
import { GENERATE_ART_STYLE_PROMPT } from '@/lib/prompts/style';
import { validateRequest, isValidationError, ArtStyleSchema } from '@/lib/api/validate';
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
 * Uses OpenAI to analyze the historical era and generate a military/battle-appropriate painting style
 */
export async function POST(request: NextRequest) {
  try {
    const result = await validateRequest(request, ArtStyleSchema);
    if (isValidationError(result)) return result;
    const { era, title } = result;

    console.log(`[Art Style] Generating tactical art style for: "${title}" (${era})`);

    const client = getOpenAIClient();
    const prompt = GENERATE_ART_STYLE_PROMPT(era, title);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected empty response from OpenAI');
    }

    const artStyle = content.trim();

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
