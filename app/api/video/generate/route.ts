import { NextRequest, NextResponse } from 'next/server';
import { VIDEO_GENERATION_API_URL } from '@/lib/config/video';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const audio = formData.get('audio') as File | null;
    const originalScript = formData.get('original_script') as string | null;
    const sceneData = formData.get('scene_data') as string | null;

    if (!audio || !originalScript || !sceneData) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, original_script, scene_data' },
        { status: 400 },
      );
    }

    // Forward to Railway service
    const forwardData = new FormData();
    forwardData.append('audio', audio);
    forwardData.append('original_script', originalScript);
    forwardData.append('scene_data', sceneData);

    const response = await fetch(`${VIDEO_GENERATION_API_URL}/generate`, {
      method: 'POST',
      body: forwardData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Video Generate] Railway error:', response.status, errorBody);
      return NextResponse.json(
        { error: `Video service error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Video Generate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
