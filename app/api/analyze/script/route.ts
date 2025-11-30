import { NextRequest } from 'next/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { SYSTEM_PROMPT, SCENE_BREAKDOWN_PROMPT } from '@/lib/prompts/all-prompts';
import { SCENE_DURATION_SECONDS } from '@/lib/config/development';

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

    // Calculate expected scene count based on script duration
    const wordCount = script.trim().split(/\s+/).length;
    const wordsPerMinute = 150; // Average narration speed
    const durationSeconds = Math.round((wordCount / wordsPerMinute) * 60);
    const targetSceneCount = Math.round(durationSeconds / SCENE_DURATION_SECONDS);

    console.log(`[Scene Analysis] Analyzing script (${script.length} characters, ${wordCount} words, ~${Math.round(durationSeconds / 60)} minutes)`);
    console.log(`[Scene Analysis] Target scene count: ${targetSceneCount} (${durationSeconds}s / ${SCENE_DURATION_SECONDS}s per scene)`);

    const client = getAnthropicClient();
    const prompt = SCENE_BREAKDOWN_PROMPT(script, targetSceneCount);

    // Cap max_tokens at 32000 to accommodate large scene counts
    // Sonnet 4 supports up to 64K output tokens
    // Formula: 350 tokens per scene + buffer (e.g., 83 scenes × 350 = 29,050 tokens)
    const maxTokens = Math.min(32000, Math.max(4000, targetSceneCount * 350));

    // Use Claude Sonnet 4 with streaming for long scene generation
    console.log(`[Scene Analysis] Starting streaming generation with max_tokens: ${maxTokens}`);

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
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
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              accumulatedText += chunk.delta.text;

              // Send progress update
              const progressData = JSON.stringify({
                type: 'progress',
                text: chunk.delta.text,
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

          console.log(`[Scene Analysis] Successfully parsed ${scenes.length} scenes (target: ${targetSceneCount})`);

          // Send final result
          const resultData = JSON.stringify({
            type: 'complete',
            scenes,
            metadata: {
              total_scenes: scenes.length,
              target_scenes: targetSceneCount,
              script_word_count: wordCount,
              estimated_duration_seconds: durationSeconds,
              average_snippet_length: Math.round(
                scenes.reduce((sum, s) => sum + s.script_snippet.length, 0) / scenes.length
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
