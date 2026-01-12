import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/ai/openai';
import { SYSTEM_PROMPT, CHARACTER_IDENTIFICATION_PROMPT } from '@/lib/prompts/all-prompts';
import type { CharacterWithReference, HistoricalEra } from '@/lib/types';

export const maxDuration = 60;

interface IdentifyCharactersRequest {
  script: string;
  era: HistoricalEra;
}

interface CharacterFromAI {
  name: string;
  role: string;
  description: string;
  notable_actions?: string[];
  visual_description: string;
  historical_period_appearance: string;
  prominence: 'primary' | 'secondary';
}

interface CharacterIdentificationResponse {
  characters: CharacterFromAI[];
  total_characters: number;
  primary_count: number;
  secondary_count: number;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function POST(request: NextRequest) {
  try {
    const { script, era }: IdentifyCharactersRequest = await request.json();

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }

    const client = getOpenAIClient();
    const prompt = CHARACTER_IDENTIFICATION_PROMPT(script, era || 'Other');

    console.log('[Character Identification] Analyzing script for historical figures...');
    console.log(`[Character Identification] Script length: ${script.length} characters`);
    console.log(`[Character Identification] Era: ${era || 'Other'}`);

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response - handle markdown code blocks
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const data: CharacterIdentificationResponse = JSON.parse(jsonMatch[0]);

    if (!data.characters || !Array.isArray(data.characters)) {
      throw new Error('Invalid response structure: missing characters array');
    }

    // Transform to CharacterWithReference format with generated UUIDs
    const characters: CharacterWithReference[] = data.characters.map((char) => ({
      id: generateUUID(),
      name: char.name,
      role: char.role,
      description: char.description,
      notable_actions: char.notable_actions || [],
      visual_description: char.visual_description,
      historical_period_appearance: char.historical_period_appearance,
      prominence: char.prominence,
      reference_image_url: undefined,
      reference_generation_status: 'pending' as const,
      is_approved: true, // Default to approved, user can deselect
    }));

    console.log(`[Character Identification] Found ${characters.length} characters`);
    console.log(
      `[Character Identification] Primary: ${data.primary_count}, Secondary: ${data.secondary_count}`
    );

    return NextResponse.json({
      success: true,
      characters,
      metadata: {
        total: data.total_characters,
        primary: data.primary_count,
        secondary: data.secondary_count,
      },
    });
  } catch (error) {
    console.error('[Character Identification] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to identify characters',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
