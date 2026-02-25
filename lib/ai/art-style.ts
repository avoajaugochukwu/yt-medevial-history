import { getOpenAIClient } from '@/lib/ai/openai';
import { SYSTEM_PROMPT } from '@/lib/prompts/war-room';
import { GENERATE_ART_STYLE_PROMPT } from '@/lib/prompts/style';
import { MODELS } from '@/lib/config/ai';
import type { HistoricalEra } from '@/lib/types';

/**
 * Generate an AI-powered art style description for a given historical era and title.
 * Extracted from the art-style route for direct use without HTTP self-calls.
 */
export async function generateArtStyle(era: HistoricalEra, title: string): Promise<string> {
  const client = getOpenAIClient();
  const prompt = GENERATE_ART_STYLE_PROMPT(era, title);

  const response = await client.chat.completions.create({
    model: MODELS.GPT4O_MINI,
    max_tokens: 1000,
    temperature: 0.8,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Unexpected empty response from OpenAI');
  }

  return content.trim();
}
