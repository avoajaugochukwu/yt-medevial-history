import { NextRequest, NextResponse } from 'next/server';
import { VIDEO_GENERATION_API_URL } from '@/lib/config/video';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    // Fetch job status to get the video URL
    const statusResponse = await fetch(
      `${VIDEO_GENERATION_API_URL}/status/${jobId}`,
    );

    if (!statusResponse.ok) {
      console.error(
        '[Video Download] Status fetch failed:',
        statusResponse.status,
      );
      return NextResponse.json(
        { error: 'Video job not found' },
        { status: 404 },
      );
    }

    const statusData = await statusResponse.json();

    if (statusData.status !== 'completed' || !statusData.output_url) {
      return NextResponse.json(
        { error: 'Video is not ready for download' },
        { status: 404 },
      );
    }

    // Fetch the actual video binary
    const videoResponse = await fetch(statusData.output_url);

    if (!videoResponse.ok || !videoResponse.body) {
      console.error(
        '[Video Download] Video fetch failed:',
        videoResponse.status,
      );
      return NextResponse.json(
        { error: 'Failed to fetch video file' },
        { status: 502 },
      );
    }

    const contentType =
      videoResponse.headers.get('Content-Type') || 'video/mp4';
    const contentLength = videoResponse.headers.get('Content-Length');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': 'attachment; filename="historia-video.mp4"',
    };

    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new Response(videoResponse.body, { headers });
  } catch (error) {
    console.error('[Video Download] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
