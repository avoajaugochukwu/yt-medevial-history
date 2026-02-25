import { NextRequest, NextResponse } from 'next/server';
import { VIDEO_GENERATION_API_URL } from '@/lib/config/video';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    const response = await fetch(`${VIDEO_GENERATION_API_URL}/status/${jobId}`);

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
    console.error('[Video Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
