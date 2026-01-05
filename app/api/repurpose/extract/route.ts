import { NextRequest, NextResponse } from 'next/server';
import { extractFromYouTube } from '@/lib/youtube/extract';
import { isValidYouTubeUrl } from '@/lib/youtube/client';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute for extraction

interface ExtractRequest {
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequest = await request.json();
    const { url } = body;

    // Validation
    if (!url || url.trim().length === 0) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format. Please provide a valid YouTube video URL.' },
        { status: 400 }
      );
    }

    console.log(`[Repurpose Extract] Extracting from: ${url}`);

    const extraction = await extractFromYouTube(url);

    console.log(
      `[Repurpose Extract] Success: "${extraction.metadata.title}" (${extraction.transcript.wordCount} words)`
    );

    return NextResponse.json({
      success: true,
      extraction,
    });
  } catch (error) {
    console.error('[Repurpose Extract] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extract from YouTube',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
