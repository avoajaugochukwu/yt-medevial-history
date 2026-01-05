import { fetchTranscript, extractVideoId } from './client';
import type { YouTubeExtraction } from '@/lib/types';

export async function extractFromYouTube(url: string): Promise<YouTubeExtraction> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  const data = await fetchTranscript(url);
  const wordCount = data.text.split(/\s+/).filter((w) => w.length > 0).length;

  return {
    metadata: {
      videoId,
      title: '',
      description: '',
      duration: 0,
      channelName: '',
      publishedAt: '',
      thumbnailUrl: undefined,
    },
    transcript: {
      text: data.text,
      segments: data.segments,
      language: 'en',
      wordCount,
    },
    extractedAt: new Date(),
  };
}
