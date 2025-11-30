import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { SYSTEM_PROMPT, NARRATIVE_OUTLINE_PROMPT } from '@/lib/prompts/all-prompts';
import type { NarrativeTone, NarrativeOutline } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 60;

interface NarrativeOutlineRequest {
  title: string;
  research: string; // JSON stringified HistoricalResearch
  tone: NarrativeTone;
  targetDuration: number; // Target video duration in minutes (passed through)
}

/**
 * POST /api/generate/narrative-outline
 *
 * PROMPT 2: Narrative Structure & Outline
 * Uses Claude to create a three-act dramatic structure from historical research
 */
export async function POST(request: NextRequest) {
  try {
    const body: NarrativeOutlineRequest = await request.json();
    const { title, research, tone } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!research || research.trim().length === 0) {
      return NextResponse.json({ error: 'Research data is required' }, { status: 400 });
    }

    if (!tone) {
      return NextResponse.json({ error: 'Narrative tone is required' }, { status: 400 });
    }

    console.log(`[Narrative Outline] Generating outline for: "${title}" (${tone} tone)`);

    const client = getAnthropicClient();
    const prompt = NARRATIVE_OUTLINE_PROMPT(title, research, tone);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.7,
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

    const outlineText = content.text;

    console.log(`[Narrative Outline] Claude response received`);

    // Parse the JSON response
    let outlineData: NarrativeOutline;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = outlineText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        outlineData = JSON.parse(jsonMatch[0]);
      } else {
        outlineData = JSON.parse(outlineText);
      }

      // Ensure generated_at is a Date object
      outlineData.generated_at = new Date();
    } catch (parseError) {
      console.error('[Narrative Outline] JSON parse error:', parseError);
      console.error('Response content:', outlineText);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse narrative outline',
          raw_content: outlineText,
        },
        { status: 500 }
      );
    }

    console.log(`[Narrative Outline] Successfully generated outline with ${outlineData.act1_setup.scenes.length + outlineData.act2_conflict.scenes.length + outlineData.act3_resolution.scenes.length} total scenes`);

    return NextResponse.json({
      success: true,
      outline: outlineData,
    });
  } catch (error) {
    console.error('[Narrative Outline] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate narrative outline',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
