import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

/**
 * Generate text using OpenAI's GPT-4o model.
 * Similar pattern to generateWithClaude for consistency.
 */
export async function generateWithOpenAI(
  prompt: string,
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 4096
): Promise<string> {
  const client = getOpenAIClient();

  const messages: ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  return content;
}
