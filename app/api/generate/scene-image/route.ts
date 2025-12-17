import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import {
  generateStyleSuffix,
  HISTORICAL_MAP_STYLE_SUFFIX,
  NEGATIVE_PROMPT_HISTORICAL,
  NEGATIVE_PROMPT_MAPS,
} from '@/lib/prompts/all-prompts';

interface FalImageResult {
  data?: {
    images: Array<{ url: string }>;
  };
  images?: Array<{ url: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { scene, artStyle } = requestData;

    if (!scene) {
      return NextResponse.json({ error: 'Scene data is required' }, { status: 400 });
    }

    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'FAL_API_KEY is not configured' }, { status: 500 });
    }

    // Configure Fal.ai client
    fal.config({
      credentials: apiKey,
    });

    // Build enhanced prompt with appropriate style based on scene type
    const basePrompt = scene.visual_prompt || 'Historical scene';
    const isMapScene = scene.scene_type === 'map';

    // Inject appropriate style suffix: historical map for maps, AI-generated or default style for visual scenes
    const styleSuffix = isMapScene ? HISTORICAL_MAP_STYLE_SUFFIX : generateStyleSuffix(artStyle);
    const negativePrompt = isMapScene ? NEGATIVE_PROMPT_MAPS : NEGATIVE_PROMPT_HISTORICAL;
    const styledPrompt = `${basePrompt}${styleSuffix}`;

    const sceneTypeLabel = isMapScene ? 'MAP' : 'VISUAL';
    const styleDescription = artStyle ? 'AI-generated era-appropriate' : 'default oil painting';
    console.log(`[Scene Image] Generating ${sceneTypeLabel} image for scene ${scene.scene_number}`);
    console.log(`[Scene Image] Using ${styleDescription} style`);
    console.log(`[Scene Image] Prompt length: ${styledPrompt.length} characters`);

    // Use nano-banana for fast generation (7-10 seconds) with enhanced prompting
    const apiEndpoint = 'fal-ai/nano-banana';
    const apiRequest = {
      input: {
        prompt: styledPrompt,
        negative_prompt: negativePrompt,
        num_images: 1,
        aspect_ratio: '16:9',
        seed: Math.floor(Math.random() * 1000000), // Random seed for variety
      },
      logs: false,
    };

    const result = (await fal.subscribe(apiEndpoint, apiRequest)) as FalImageResult;

    // Extract image URL from response
    const imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log(`[Scene Image] Successfully generated image for scene ${scene.scene_number}`);

    return NextResponse.json({
      image_url: imageUrl,
      prompt_used: styledPrompt,
      aspect_ratio: '16:9',
      model: 'fal-ai/nano-banana',
      style: isMapScene ? 'historical-map' : 'oil-painting-historical',
    });
  } catch (error) {
    console.error('[Scene Image] Generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to generate scene image',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
