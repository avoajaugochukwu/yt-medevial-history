import Anthropic from '@anthropic-ai/sdk';
import { MODELS } from '@/lib/config/ai';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient() {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured in environment variables');
    }

    anthropicClient = new Anthropic({
      apiKey,
    });
  }

  return anthropicClient;
}

export async function generateWithClaude(
  prompt: string,
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 8192
) {
  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: MODELS.CLAUDE_SONNET,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : '';
  } catch (error) {
    console.error('Anthropic API error:', error);
    throw new Error('Failed to generate content with Claude');
  }
}
