import { fal } from '@fal-ai/client';

let configured = false;

export function configureFal() {
  if (!configured) {
    const apiKey = process.env.FAL_API_KEY;

    if (!apiKey) {
      throw new Error('FAL_API_KEY is not configured in environment variables');
    }

    fal.config({ credentials: apiKey });
    configured = true;
  }

  return fal;
}
