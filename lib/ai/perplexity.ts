import { MODELS } from '@/lib/config/ai';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

let apiKey: string | null = null;

function getApiKey(): string {
  if (!apiKey) {
    apiKey = process.env.PERPLEXITY_API_KEY || null;

    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY is not configured in environment variables');
    }
  }

  return apiKey;
}

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityOptions {
  model?: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
  return_citations?: boolean;
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function queryPerplexity(options: PerplexityOptions): Promise<string> {
  const key = getApiKey();

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: options.model || MODELS.SONAR_PRO,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 4000,
      ...(options.return_citations !== undefined && { return_citations: options.return_citations }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data: PerplexityResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from Perplexity API');
  }

  return content;
}
