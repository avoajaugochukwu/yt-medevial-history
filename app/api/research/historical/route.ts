import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, HISTORICAL_RESEARCH_PROMPT } from '@/lib/prompts/all-prompts';
import type { HistoricalEra, ContentType, HistoricalResearch } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 60;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface HistoricalResearchRequest {
  title: string;
  era: HistoricalEra;
  contentType: ContentType;
  targetDuration: number; // Target video duration in minutes (passed through)
}

/**
 * POST /api/research/historical
 *
 * PROMPT 1: Historical Research & Fact Validation
 * Uses Perplexity to gather historically accurate information
 */
export async function POST(request: NextRequest) {
  try {
    const body: HistoricalResearchRequest = await request.json();
    const { title, era, contentType } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!era || !contentType) {
      return NextResponse.json(
        { error: 'Era and content type are required' },
        { status: 400 }
      );
    }

    console.log(`[Historical Research] Starting research for: "${title}" (${era}, ${contentType})`);

    // Step 1: Conduct Perplexity research for raw historical data
    const perplexityResults = await conductHistoricalResearch(title, era, contentType);

    console.log(`[Historical Research] Perplexity research completed, processing...`);

    // Step 2: Use the historical research prompt to structure the findings
    const prompt = HISTORICAL_RESEARCH_PROMPT(title, era, contentType);

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

    console.log(`[Historical Research] Structured research completed`);

    // Parse the JSON response
    let researchData: HistoricalResearch;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = structuredContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

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
    } catch (parseError) {
      console.error('[Historical Research] JSON parse error:', parseError);
      console.error('Response content:', structuredContent.substring(0, 500));

      // Return a fallback structure
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse research data',
          raw_content: structuredContent,
        },
        { status: 500 }
      );
    }

    // Step 3: Generate AI-powered art style based on the era
    console.log(`[Historical Research] Generating art style for ${era}...`);
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
            era,
            contentType,
            title,
          }),
        }
      );

      if (artStyleResponse.ok) {
        const artStyleData = await artStyleResponse.json();
        if (artStyleData.success && artStyleData.artStyle) {
          artStyle = artStyleData.artStyle;
          console.log(`[Historical Research] Art style generated successfully`);
        }
      } else {
        console.warn('[Historical Research] Art style generation failed, will use default');
      }
    } catch (artStyleError) {
      console.warn('[Historical Research] Art style generation error:', artStyleError);
      console.warn('[Historical Research] Continuing without custom art style');
    }

    return NextResponse.json({
      success: true,
      research: researchData,
      artStyle, // Include art style in response
    });
  } catch (error) {
    console.error('[Historical Research] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to conduct historical research',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Conduct initial research using Perplexity AI
 */
async function conductHistoricalResearch(
  title: string,
  era: HistoricalEra,
  contentType: ContentType
): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const searchQuery = buildResearchQuery(title, era, contentType);

  console.log('[Perplexity] Historical research query:', searchQuery);

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
            'You are a historical research specialist. Provide factually accurate, detailed historical information with specific dates, names, and sources.',
        },
        {
          role: 'user',
          content: searchQuery,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
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

  console.log('[Perplexity] Research completed, length:', researchContent.length);

  return researchContent;
}

/**
 * Build research query based on content type
 */
function buildResearchQuery(title: string, era: HistoricalEra, contentType: ContentType): string {
  const baseQuery = `Research the historical topic: "${title}" (${era} era)`;

  const contentTypeQueries = {
    Biography: `
      Provide detailed biographical information including:
      - Complete chronological timeline with specific dates
      - Major life events and turning points
      - Relationships, allies, and enemies
      - Quotes and anecdotes (with sources)
      - Physical descriptions and personality traits
      - Political/cultural context of their era
      - Legacy and historical impact
    `,
    Battle: `
      Provide comprehensive battle information including:
      - Political and strategic context leading to the battle
      - Specific date and location
      - Commanders and their backgrounds
      - Troop numbers, formations, and composition
      - Chronological timeline of battle phases
      - Tactical innovations and decisive moments
      - Casualties and immediate aftermath
      - Long-term historical significance
    `,
    Culture: `
      Provide cultural details including:
      - Daily life and social structures
      - Architecture and urban planning
      - Technology and innovations
      - Religious practices and beliefs
      - Food, clothing, and material culture
      - Arts, literature, and entertainment
      - Economic systems and trade
      - Primary sources and archaeological evidence
    `,
    Mythology: `
      Provide mythological information including:
      - Primary source texts (authors and works)
      - Core narrative arc and plot points
      - Character descriptions and relationships
      - Symbolic meanings and cultural context
      - Variations in different tellings
      - Historical practices connected to the myth
      - Modern interpretations
    `,
  };

  return `${baseQuery}

${contentTypeQueries[contentType]}

IMPORTANT REQUIREMENTS:
- Prioritize factual accuracy over dramatic storytelling
- Include specific dates (year, month, day if known)
- Cite primary sources (ancient texts) and scholarly works
- Provide rich sensory details (what people saw, heard, felt)
- Include architectural, clothing, and equipment details
- Note where historians disagree or evidence is uncertain
- Distinguish clearly between fact and legend`;
}
