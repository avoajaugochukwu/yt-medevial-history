import { NextRequest } from 'next/server';
import { getOpenAIClient } from '@/lib/ai/openai';
import { SYSTEM_PROMPT, SCENE_BREAKDOWN_PROMPT } from '@/lib/prompts/all-prompts';
import { calculateSceneTimingPlan } from '@/lib/utils/scene-timing';

export const maxDuration = 600; // 10 minutes timeout for large scene generation
export const runtime = 'nodejs'; // Use Node.js runtime for streaming support

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();

    if (!script) {
      return new Response(
        JSON.stringify({ error: 'Script is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expected video duration
    const wordCount = script.trim().split(/\s+/).length;
    const wordsPerMinute = 150; // Average narration speed
    const durationSeconds = Math.round((wordCount / wordsPerMinute) * 60);

    // Calculate variable scene timing plan
    const timingPlan = calculateSceneTimingPlan(durationSeconds);

    console.log(`[Scene Analysis] Analyzing script (${script.length} characters, ${wordCount} words, ~${Math.round(durationSeconds / 60)} minutes)`);
    console.log(`[Scene Analysis] Variable timing plan: ${timingPlan.totalScenes} scenes across ${timingPlan.segments.length} segments`);
    timingPlan.segments.forEach(s => {
      console.log(`  - ${s.segment.name}: ${s.sceneCount} scenes (${s.segment.avgDuration}s avg)`);
    });

    const client = getOpenAIClient();
    const prompt = SCENE_BREAKDOWN_PROMPT(script, timingPlan);

    // Cap max_tokens at 16000 for GPT-4o (increase token budget for variable timing)
    const maxTokens = Math.min(16000, Math.max(4000, timingPlan.totalScenes * 400));

    // Use GPT-4o with streaming for long scene generation
    console.log(`[Scene Analysis] Starting streaming generation with max_tokens: ${maxTokens}`);

    const stream = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: true,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    let accumulatedText = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              accumulatedText += content;

              // Send progress update
              const progressData = JSON.stringify({
                type: 'progress',
                text: content,
              }) + '\n';
              controller.enqueue(encoder.encode(progressData));
            }
          }

          // Parse the complete response
          console.log(`[Scene Analysis] Stream complete, parsing JSON...`);

          let scenes;
          try {
            // Try to extract JSON array from the response
            const jsonMatch = accumulatedText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              scenes = JSON.parse(jsonMatch[0]);
            } else {
              scenes = JSON.parse(accumulatedText);
            }
          } catch (parseError) {
            console.error('[Scene Analysis] JSON parse error:', parseError);
            const errorData = JSON.stringify({
              type: 'error',
              error: 'Failed to parse scene breakdown',
              raw_content: accumulatedText.substring(0, 500),
            }) + '\n';
            controller.enqueue(encoder.encode(errorData));
            controller.close();
            return;
          }

          // Validate scenes
          if (!Array.isArray(scenes)) {
            const errorData = JSON.stringify({
              type: 'error',
              error: 'Expected array of scenes',
            }) + '\n';
            controller.enqueue(encoder.encode(errorData));
            controller.close();
            return;
          }

          console.log(`[Scene Analysis] Successfully parsed ${scenes.length} scenes (target: ${timingPlan.totalScenes})`);

          // Send final result
          const resultData = JSON.stringify({
            type: 'complete',
            scenes,
            metadata: {
              total_scenes: scenes.length,
              target_scenes: timingPlan.totalScenes,
              script_word_count: wordCount,
              estimated_duration_seconds: durationSeconds,
              timing_plan: timingPlan.segments.map(s => ({
                segment: s.segment.name,
                scene_count: s.sceneCount,
                start_time: s.cumulativeStartTime,
                end_time: s.cumulativeEndTime,
                avg_duration: s.segment.avgDuration,
              })),
              average_snippet_length: Math.round(
                scenes.reduce((sum: number, s: { script_snippet: string }) => sum + s.script_snippet.length, 0) / scenes.length
              ),
            },
          }) + '\n';
          controller.enqueue(encoder.encode(resultData));
          controller.close();
        } catch (error) {
          console.error('[Scene Analysis] Stream error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorData = JSON.stringify({
            type: 'error',
            error: 'Failed to analyze script',
            details: errorMessage,
          }) + '\n';
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Scene Analysis] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to analyze script',
        details: errorMessage,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
