import { NextRequest, NextResponse } from 'next/server';
import { VIDEO_GENERATION_API_URL, MAX_POLL_RETRIES } from '@/lib/config/video';

const TRANSIENT_STATUS_CODES = new Set([502, 503, 504]);

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_POLL_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      if (TRANSIENT_STATUS_CODES.has(response.status) && attempt < MAX_POLL_RETRIES) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 30_000);
        console.warn(`[Video Status] Transient ${response.status}, retry ${attempt}/${MAX_POLL_RETRIES} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_POLL_RETRIES) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 30_000);
        console.warn(`[Video Status] Network error, retry ${attempt}/${MAX_POLL_RETRIES} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    const response = await fetchWithRetry(`${VIDEO_GENERATION_API_URL}/status/${jobId}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Video Status] Railway error:', response.status, errorBody);
      return NextResponse.json(
        { error: `Video service error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Video Status] Error after retries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
