import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import {
  CHARACTER_PORTRAIT_STYLE_SUFFIX,
  NEGATIVE_PROMPT_PORTRAIT,
} from '@/lib/prompts/all-prompts';
import type { CharacterWithReference } from '@/lib/types';

export const maxDuration = 120;

interface FalImageResult {
  data?: {
    images: Array<{ url: string }>;
  };
  images?: Array<{ url: string }>;
}

interface GenerateReferenceRequest {
  character: CharacterWithReference;
}

export async function POST(request: NextRequest) {
  try {
    const { character }: GenerateReferenceRequest = await request.json();

    if (!character) {
      return NextResponse.json({ error: 'Character data is required' }, { status: 400 });
    }

    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'FAL_API_KEY is not configured' }, { status: 500 });
    }

    fal.config({ credentials: apiKey });

    // Build portrait-focused prompt
    const portraitPrompt = `Historical portrait of ${character.name}, ${character.role}.

${character.visual_description}

${character.historical_period_appearance}
${CHARACTER_PORTRAIT_STYLE_SUFFIX}`;

    console.log(`[Character Reference] Generating portrait for: ${character.name}`);
    console.log(`[Character Reference] Role: ${character.role}`);
    console.log(`[Character Reference] Prominence: ${character.prominence}`);
    console.log(`[Character Reference] Prompt length: ${portraitPrompt.length} characters`);

    // Use nano-banana for portrait generation with 3:4 aspect ratio
    const result = (await fal.subscribe('fal-ai/nano-banana', {
      input: {
        prompt: portraitPrompt,
        negative_prompt: NEGATIVE_PROMPT_PORTRAIT,
        num_images: 1,
        aspect_ratio: '3:4', // Portrait aspect ratio
        seed: Math.floor(Math.random() * 1000000),
      },
      logs: false,
    })) as FalImageResult;

    // Extract image URL from response
    const imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log(`[Character Reference] Successfully generated portrait for: ${character.name}`);

    return NextResponse.json({
      success: true,
      character_id: character.id,
      image_url: imageUrl,
      prompt_used: portraitPrompt,
      aspect_ratio: '3:4',
      model: 'fal-ai/nano-banana',
    });
  } catch (error) {
    console.error('[Character Reference] Generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to generate character reference',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
