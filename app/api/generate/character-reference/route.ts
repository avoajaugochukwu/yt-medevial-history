import { NextRequest, NextResponse } from 'next/server';
import { configureFal } from '@/lib/ai/fal';
import { MODELS, ASPECT_RATIOS } from '@/lib/config/ai';
import {
  CHARACTER_PORTRAIT_STYLE_SUFFIX,
  NEGATIVE_PROMPT_PORTRAIT,
} from '@/lib/prompts/character';
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

    const fal = configureFal();

    // Build portrait-focused prompt
    const portraitPrompt = `Historical portrait of ${character.name}, ${character.role}.

${character.visual_description}

${character.historical_period_appearance}
${CHARACTER_PORTRAIT_STYLE_SUFFIX}`;

    console.log(`[Character Reference] Generating portrait for: ${character.name}`);
    console.log(`[Character Reference] Role: ${character.role}`);
    console.log(`[Character Reference] Prominence: ${character.prominence}`);
    console.log(`[Character Reference] Prompt length: ${portraitPrompt.length} characters`);

    const result = (await fal.subscribe(MODELS.FAL_NANO_BANANA, {
      input: {
        prompt: portraitPrompt,
        negative_prompt: NEGATIVE_PROMPT_PORTRAIT,
        num_images: 1,
        aspect_ratio: ASPECT_RATIOS.PORTRAIT,
        seed: Math.floor(Math.random() * 1000000),
      },
      logs: false,
    })) as FalImageResult;

    console.log('[Character Reference] FAL raw response:', JSON.stringify(result).substring(0, 500));

    // Extract image URL from response
    const imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url;

    console.log('[Character Reference] Extracted URL:', imageUrl);

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log(`[Character Reference] Successfully generated portrait for: ${character.name}`);

    return NextResponse.json({
      success: true,
      character_id: character.id,
      image_url: imageUrl,
      prompt_used: portraitPrompt,
      aspect_ratio: ASPECT_RATIOS.PORTRAIT,
      model: MODELS.FAL_NANO_BANANA,
    });
  } catch (error) {
    console.error('[Character Reference] Generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate character reference',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
