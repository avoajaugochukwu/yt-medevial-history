import { fetchTranscript } from './client';
import type { YouTubeExtraction } from '@/lib/types';

export async function extractFromYouTube(url: string): Promise<YouTubeExtraction> {
  const data = await fetchTranscript(url);
  const wordCount = data.text.split(/\s+/).filter((w) => w.length > 0).length;

  return {
    transcript: {
      text: data.text,
      wordCount,
    },
  };
}
