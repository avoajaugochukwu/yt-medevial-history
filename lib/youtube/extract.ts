import { Video } from 'youtubei';
import { getYouTubeClient, extractVideoId } from './client';
import type { YouTubeVideoMetadata, YouTubeTranscript, YouTubeExtraction } from '@/lib/types';

export async function extractFromYouTube(url: string): Promise<YouTubeExtraction> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  const client = getYouTubeClient();
  const videoResult = await client.getVideo(videoId);

  if (!videoResult) {
    throw new Error('Video not found');
  }

  // Check if it's a regular video (not LiveVideo)
  if (!(videoResult instanceof Video)) {
    throw new Error('Live videos are not supported. Please use a regular video.');
  }

  const video = videoResult as Video;

  // Extract metadata
  const metadata: YouTubeVideoMetadata = {
    videoId,
    title: video.title || 'Unknown Title',
    description: video.description || '',
    duration: video.duration || 0,
    channelName: video.channel?.name || 'Unknown Channel',
    publishedAt: video.uploadDate || '',
    thumbnailUrl: video.thumbnails?.[0]?.url,
  };

  // Extract transcript/captions
  const transcript = await extractTranscript(video);

  return {
    metadata,
    transcript,
    extractedAt: new Date(),
  };
}

async function extractTranscript(video: Video): Promise<YouTubeTranscript> {
  if (!video.captions) {
    throw new Error('No captions available for this video');
  }

  // Try to get English captions first
  let captions = await video.captions.get('en');

  // If no English, try auto-generated English
  if (!captions || captions.length === 0) {
    captions = await video.captions.get('a.en');
  }

  // If still no captions, try any available language
  if (!captions || captions.length === 0) {
    // Check available languages
    if (video.captions.languages && video.captions.languages.length > 0) {
      const firstLang = video.captions.languages[0];
      captions = await video.captions.get(firstLang.code);
    }
  }

  if (!captions || captions.length === 0) {
    throw new Error('No captions available for this video. The video may not have subtitles enabled.');
  }

  // Parse caption segments and combine into full text
  // Note: start and duration are in milliseconds in youtubei
  const fullText = captions
    .map((c) => c.text.trim())
    .filter((text) => text.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;

  return {
    text: fullText,
    segments: captions.map((c) => ({
      start: c.start / 1000, // Convert ms to seconds
      duration: c.duration / 1000, // Convert ms to seconds
      text: c.text,
    })),
    language: 'en',
    wordCount,
  };
}
