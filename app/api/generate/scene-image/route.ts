import { NextRequest, NextResponse } from 'next/server';
import { configureFal } from '@/lib/ai/fal';
import { MODELS, ASPECT_RATIOS } from '@/lib/config/ai';
import {
  generateStyleSuffix,
  HISTORICAL_MAP_STYLE_SUFFIX,
  NEGATIVE_PROMPT_HISTORICAL,
  NEGATIVE_PROMPT_MAPS,
} from '@/lib/prompts/style';

interface FalImageResult {
  data?: {
    images: Array<{ url: string }>;
  };
  images?: Array<{ url: string }>;
}

interface CharacterReference {
  name: string;
  visual_description: string;
  reference_image_url: string;
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { scene, artStyle, characterReferences, prompt_override } = requestData as {
      scene: {
        scene_number: number;
        visual_prompt?: string;
        scene_type?: string;
        shot_type?: string;
      };
      artStyle?: string;
      characterReferences?: CharacterReference[];
      prompt_override?: string;
    };

    if (!scene) {
      return NextResponse.json({ error: 'Scene data is required' }, { status: 400 });
    }

    const fal = configureFal();

    // Build enhanced prompt with appropriate style based on scene type
    const basePrompt = scene.visual_prompt || 'Historical scene';
    const isMapScene = scene.scene_type === 'map';

    // Inject shot type prefix for visual scenes (not maps)
    const shotTypePrefix = !isMapScene && scene.shot_type ? `${scene.shot_type}: ` : '';

    // Inject appropriate style suffix: historical map for maps, AI-generated or default style for visual scenes
    const styleSuffix = isMapScene ? HISTORICAL_MAP_STYLE_SUFFIX : generateStyleSuffix(artStyle);
    const negativePrompt = isMapScene ? NEGATIVE_PROMPT_MAPS : NEGATIVE_PROMPT_HISTORICAL;
    const styledPrompt = `${shotTypePrefix}${basePrompt}${styleSuffix}`;

    // Check if we have valid character references with image URLs
    const validCharacterRefs = characterReferences?.filter(
      (ref) => ref.reference_image_url && ref.reference_image_url.trim() !== ''
    ) || [];
    const hasCharacterReferences = validCharacterRefs.length > 0 && !isMapScene;

    // Build character context for the prompt if we have character references
    let characterContext = '';
    if (hasCharacterReferences) {
      characterContext = '\n\nCHARACTER CONSISTENCY - Maintain exact appearance from reference images:\n';
      validCharacterRefs.forEach((ref) => {
        characterContext += `- ${ref.name}: ${ref.visual_description}\n`;
      });
    }

    // Final prompt: use prompt_override if provided (user edited full prompt), otherwise build normally
    const finalPrompt = prompt_override
      ? prompt_override
      : hasCharacterReferences
        ? `${styledPrompt}${characterContext}`
        : styledPrompt;

    const sceneTypeLabel = isMapScene ? 'MAP' : 'VISUAL';
    const styleDescription = artStyle ? 'AI-generated era-appropriate' : 'default oil painting';
    console.log(`[Scene Image] Generating ${sceneTypeLabel} image for scene ${scene.scene_number}`);
    console.log(`[Scene Image] Shot type: ${scene.shot_type || 'none'}`);
    console.log(`[Scene Image] Using ${styleDescription} style`);
    console.log(`[Scene Image] Character references: ${validCharacterRefs.length}`);
    console.log(`[Scene Image] Prompt length: ${finalPrompt.length} characters`);

    let result: FalImageResult;
    let modelUsed: string;

    if (hasCharacterReferences) {
      // Use nano-banana/edit endpoint with image references for character consistency
      const imageUrls = validCharacterRefs.map((ref) => ref.reference_image_url);

      console.log(`[Scene Image] Using /edit endpoint with ${imageUrls.length} reference images`);

      modelUsed = MODELS.FAL_NANO_BANANA_EDIT;
      result = (await fal.subscribe(modelUsed, {
        input: {
          prompt: finalPrompt,
          image_urls: imageUrls,
          num_images: 1,
          aspect_ratio: ASPECT_RATIOS.LANDSCAPE,
          output_format: 'png',
        },
        logs: false,
      })) as FalImageResult;
    } else {
      // Use standard nano-banana text-to-image for scenes without character references
      modelUsed = MODELS.FAL_NANO_BANANA;
      result = (await fal.subscribe(modelUsed, {
        input: {
          prompt: finalPrompt,
          negative_prompt: negativePrompt,
          num_images: 1,
          aspect_ratio: ASPECT_RATIOS.LANDSCAPE,
          seed: Math.floor(Math.random() * 1000000),
        },
        logs: false,
      })) as FalImageResult;
    }

    // Extract image URL from response
    const imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log(`[Scene Image] Successfully generated image for scene ${scene.scene_number}`);

    return NextResponse.json({
      image_url: imageUrl,
      prompt_used: finalPrompt,
      negative_prompt: negativePrompt,
      aspect_ratio: '16:9',
      model: modelUsed,
      style: isMapScene ? 'historical-map' : 'oil-painting-historical',
      character_conditioned: hasCharacterReferences,
      character_count: validCharacterRefs.length,
    });
  } catch (error) {
    console.error('[Scene Image] Generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate scene image',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
