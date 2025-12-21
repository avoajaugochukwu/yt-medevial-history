import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, TACTICAL_RESEARCH_PROMPT } from '@/lib/prompts/all-prompts';
import type { TacticalResearch } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 60;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface TacticalResearchRequest {
  title: string;
  targetDuration: number; // Target video duration in minutes
}

/**
 * POST /api/research/historical
 *
 * PROMPT 1: Tactical Research & Telemetry Extraction
 * Uses Perplexity to gather precise battlefield data
 */
export async function POST(request: NextRequest) {
  try {
    const body: TacticalResearchRequest = await request.json();
    const { title } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    console.log(`[Tactical Research] Starting telemetry extraction for: "${title}"`);

    // Step 1: Conduct initial Perplexity research for raw battle data
    const perplexityResults = await conductTacticalResearch(title);

    console.log(`[Tactical Research] Initial research completed, structuring telemetry...`);

    // Step 2: Use the tactical research prompt to structure the findings
    const prompt = TACTICAL_RESEARCH_PROMPT(title);

    // Call Perplexity again with our structured prompt
    const structuredResponse = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `${prompt}\n\nPrevious research findings to incorporate:\n${perplexityResults}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!structuredResponse.ok) {
      const errorText = await structuredResponse.text();
      throw new Error(`Perplexity API error: ${structuredResponse.status} - ${errorText}`);
    }

    const structuredData = await structuredResponse.json();
    const structuredContent = structuredData.choices[0]?.message?.content;

    if (!structuredContent) {
      throw new Error('No structured content returned from Perplexity API');
    }

    console.log(`[Tactical Research] Structured telemetry completed`);

    // Parse the JSON response
    let researchData: TacticalResearch;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = structuredContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to extract JSON from the response
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];

        // Attempt to fix incomplete JSON by closing open braces/brackets
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/\]/g) || []).length;

        // Add missing closing characters
        jsonStr = jsonStr + '}'.repeat(Math.max(0, openBraces - closeBraces));
        jsonStr = jsonStr + ']'.repeat(Math.max(0, openBrackets - closeBrackets));

        researchData = JSON.parse(jsonStr);
      } else {
        researchData = JSON.parse(cleanedContent);
      }

      // Ensure generated_at is a Date object
      researchData.generated_at = new Date();

      // Validate numeric data - warn if vague terms are detected
      validateTacticalData(researchData);
    } catch (parseError) {
      console.error('[Tactical Research] JSON parse error:', parseError);
      console.error('Response content:', structuredContent.substring(0, 500));

      // Return a fallback structure
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse tactical research data',
          raw_content: structuredContent,
        },
        { status: 500 }
      );
    }

    // Step 3: Generate AI-powered art style based on the inferred era
    console.log(`[Tactical Research] Generating art style for ${researchData.era}...`);
    let artStyle: string | undefined;

    try {
      const artStyleResponse = await fetch(
        new URL('/api/generate/art-style', request.url).toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            era: researchData.era,
            title,
          }),
        }
      );

      if (artStyleResponse.ok) {
        const artStyleData = await artStyleResponse.json();
        if (artStyleData.success && artStyleData.artStyle) {
          artStyle = artStyleData.artStyle;
          console.log(`[Tactical Research] Art style generated successfully`);
        }
      } else {
        console.warn('[Tactical Research] Art style generation failed, will use default');
      }
    } catch (artStyleError) {
      console.warn('[Tactical Research] Art style generation error:', artStyleError);
      console.warn('[Tactical Research] Continuing without custom art style');
    }

    return NextResponse.json({
      success: true,
      research: researchData,
      artStyle, // Include art style in response
    });
  } catch (error) {
    console.error('[Tactical Research] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to conduct tactical research',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate tactical data has specific numbers, not vague terms
 */
function validateTacticalData(research: TacticalResearch): void {
  const vagueTerms = ['thousands', 'many', 'numerous', 'significant', 'several', 'countless'];

  // Check faction strengths
  for (const faction of research.factions || []) {
    if (typeof faction.total_strength !== 'number') {
      console.warn(`[Tactical Validation] Faction ${faction.name} has non-numeric strength`);
    }
  }

  // Check casualty data
  const casualtyData = research.casualty_data;
  if (casualtyData) {
    if (typeof casualtyData.faction_a_casualties !== 'number') {
      console.warn('[Tactical Validation] Faction A casualties is not a number');
    }
    if (typeof casualtyData.faction_b_casualties !== 'number') {
      console.warn('[Tactical Validation] Faction B casualties is not a number');
    }
  }

  // Check for vague terms in string fields
  const jsonStr = JSON.stringify(research).toLowerCase();
  for (const term of vagueTerms) {
    if (jsonStr.includes(term)) {
      console.warn(`[Tactical Validation] Found vague term "${term}" in research data`);
    }
  }
}

/**
 * Conduct initial tactical research using Perplexity AI
 */
async function conductTacticalResearch(title: string): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const searchQuery = buildTacticalQuery(title);

  console.log('[Perplexity] Tactical research query:', searchQuery);

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content:
            'You are a tactical military analyst. Provide precise, quantified military data with specific numbers for troop counts, casualty figures, and unit compositions. NEVER use vague terms like "thousands" - always give specific numbers.',
        },
        {
          role: 'user',
          content: searchQuery,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
      return_citations: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const researchContent = data.choices[0]?.message?.content;

  if (!researchContent) {
    throw new Error('No content returned from Perplexity API');
  }

  console.log('[Perplexity] Tactical research completed, length:', researchContent.length);

  return researchContent;
}

/**
 * Build tactical research query
 */
function buildTacticalQuery(title: string): string {
  return `Research the battle/military engagement: "${title}"

REQUIRED DATA (with SPECIFIC NUMBERS):

1. FORCE COMPOSITION:
   - Exact troop numbers for each side (e.g., "8,000 heavy infantry")
   - Unit types and counts (cavalry, infantry, archers, etc.)
   - Commander names and ranks
   - Weapon types and specifications (lengths, materials)
   - Armor types and coverage
   - Formation doctrines used

2. TERRAIN & ENVIRONMENT:
   - Exact battle location with coordinates if known
   - Elevation data and terrain features
   - Weather conditions on the day
   - Tactical advantages/disadvantages of terrain

3. BATTLE TIMELINE:
   - Opening phase and time
   - Key turning points
   - Critical tactical decisions
   - Collapse/rout timing
   - Pursuit phase

4. CASUALTY DATA:
   - SPECIFIC casualty numbers for each side (not ranges)
   - Kill ratio calculation
   - Prisoner counts
   - Commander fates (killed, captured, escaped)

5. TACTICAL ANALYSIS:
   - What made one side win/lose
   - Key tactical innovations or errors
   - How formations performed
   - Morale factors

CRITICAL: Provide EXACT NUMBERS. If sources give ranges like "30,000-50,000", use the most commonly cited figure. If historians disagree, pick the scholarly consensus. NEVER respond with vague terms like "thousands" or "many".`;
}
