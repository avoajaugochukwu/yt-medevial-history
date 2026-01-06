const LAMBDA_URL = 'https://bepu4kbnoghbb2kx5tjfi7duom0mofcd.lambda-url.us-west-2.on.aws/';

export interface TranscriptResponse {
  text: string;
}

export async function fetchTranscript(videoUrl: string): Promise<TranscriptResponse> {
  const response = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl }),
  });

  if (!response.ok) {
    throw new Error(`Lambda request failed: ${response.status}`);
  }

  const data = await response.json();

  // Lambda function URL returns the body content directly
  if (!data.transcript) {
    throw new Error('No transcript returned from Lambda');
  }

  return { text: data.transcript };
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
