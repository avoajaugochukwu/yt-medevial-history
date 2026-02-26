export const VIDEO_GENERATION_API_URL =
  process.env.NEXT_PUBLIC_VIDEO_GENERATION_API_URL ||
  'https://video-generation-service-production-a91d.up.railway.app';

export const POLL_INTERVAL_MS = 3000;

export const TERMINAL_STATES = new Set(['completed', 'failed']);

export const MAX_POLL_RETRIES = 5;

export const MAX_CONSECUTIVE_POLL_FAILURES = 3;
