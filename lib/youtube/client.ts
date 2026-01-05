import { YoutubeTranscript } from '@danielxceron/youtube-transcript';
import type { TranscriptSegment } from '@/lib/types';

export interface TranscriptResponse {
  segments: TranscriptSegment[];
  text: string;
}

export async function fetchTranscript(videoUrl: string): Promise<TranscriptResponse> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

  const segments: TranscriptSegment[] = transcriptItems.map((item) => ({
    start: item.offset / 1000, // Convert ms to seconds
    duration: item.duration / 1000, // Convert ms to seconds
    text: item.text,
  }));

  const text = segments.map((s) => s.text).join(' ');

  return { segments, text };
}

export function extractVideoId(url: string): string | null {
  // Handle various YouTube URL formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}
