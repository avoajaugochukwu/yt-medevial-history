import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getOpenAIClient } from '@/lib/ai/openai';
import { SYSTEM_PROMPT } from '@/lib/prompts/war-room';
import { SCENE_SECTION_PROMPT } from '@/lib/prompts/scene-generation';
import { parseJsonArray } from '@/lib/api/json-parser';
import { validateRequest, isValidationError, ScriptAnalysisSchema } from '@/lib/api/validate';
import { splitTextBySentenceIntegrity } from '@/lib/utils/script-splitter';
import { WORDS_PER_MINUTE, SECTION_SENTENCE_COUNTS, getSectionTargetDuration, getWordsPerScene } from '@/lib/config/content';
import { MODELS } from '@/lib/config/ai';

export const maxDuration = 600; // 10 minutes timeout for large scene generation
export const runtime = 'nodejs'; // Use Node.js runtime for streaming support

interface ParsedScene {
  scene_number: number;
  script_snippet: string;
  visual_prompt: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const result = await validateRequest(request, ScriptAnalysisSchema);
    if (isValidationError(result)) return result;
    const { script } = result;

    const wordCount = script.trim().split(/\s+/).length;
    const durationSeconds = Math.round((wordCount / WORDS_PER_MINUTE) * 60);

    console.log(`[Scene Analysis] Analyzing script (${script.length} chars, ${wordCount} words, ~${Math.round(durationSeconds / 60)} min)`);

    const client = getOpenAIClient();

    console.log(`[Scene Analysis] Splitting script by section sizes [${SECTION_SENTENCE_COUNTS.join(', ')}]...`);
    const { management_chunks } = splitTextBySentenceIntegrity(script, SECTION_SENTENCE_COUNTS);
    const sections = management_chunks.map(chunk => chunk.text_content);

    console.log(`[Scene Analysis] Split into ${management_chunks.length} chunks:`);
    for (const chunk of management_chunks) {
      const chunkWords = chunk.text_content.split(/\s+/).length;
      console.log(`  Chunk ${chunk.chunk_id}: ${chunk.sentence_count} sentences, ${chunkWords} words — "${chunk.text_content.substring(0, 80)}..."`);
    }

    return handleParallelGeneration(sections, wordCount, durationSeconds, client);
  } catch (error) {
    console.error('[Scene Analysis] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze script', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Process script sections in parallel, letting GPT-4o organically decide
 * how many scenes each section requires. No pre-calculated target.
 */
function handleParallelGeneration(
  sections: string[],
  wordCount: number,
  durationSeconds: number,
  client: OpenAI
): Response {
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      const sectionErrors: { sectionIndex: number; error: string }[] = [];

      // Fire all sections in parallel
      const sectionPromises = sections.map((section, i) => {
        const sectionWordCount = section.split(/\s+/).length;
        const targetDuration = getSectionTargetDuration(i);
        const wordsPerScene = getWordsPerScene(targetDuration);

        console.log(`[Scene Analysis] Section ${i + 1}/${sections.length}: ${sectionWordCount} words, targetDuration=${targetDuration}s (~${wordsPerScene} words/scene) [parallel]`);

        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'section_progress',
          sectionIndex: i,
          totalSections: sections.length,
          status: 'started',
        }) + '\n'));

        return generateSection(
          section, i, sections.length, 1,
          targetDuration, wordsPerScene,
          client, controller, encoder
        );
      });

      const results = await Promise.allSettled(sectionPromises);

      // Collect results in order and renumber scenes sequentially
      const allScenes: ParsedScene[] = [];
      let nextSceneNumber = 1;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (result.status === 'fulfilled') {
          const renumbered = result.value.map((scene, idx) => ({
            ...scene,
            scene_number: nextSceneNumber + idx,
          }));

          allScenes.push(...renumbered);
          nextSceneNumber += renumbered.length;

          console.log(`[Scene Analysis] Section ${i + 1} complete: ${renumbered.length} scenes`);

          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'section_progress',
            sectionIndex: i,
            totalSections: sections.length,
            status: 'completed',
            scenesGenerated: renumbered.length,
          }) + '\n'));
        } else {
          const errorMsg = result.reason instanceof Error ? result.reason.message : 'Unknown error';
          console.error(`[Scene Analysis] Section ${i + 1} failed:`, errorMsg);
          sectionErrors.push({ sectionIndex: i, error: errorMsg });

          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'section_progress',
            sectionIndex: i,
            totalSections: sections.length,
            status: 'error',
            error: errorMsg,
          }) + '\n'));
        }
      }

      if (allScenes.length > 0) {
        console.log(`[Scene Analysis] All sections complete: ${allScenes.length} total scenes`);

        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'complete',
          scenes: allScenes,
          metadata: {
            total_scenes: allScenes.length,
            script_word_count: wordCount,
            estimated_duration_seconds: durationSeconds,
            sections_total: sections.length,
            sections_failed: sectionErrors.length,
            ...(sectionErrors.length > 0 ? { section_errors: sectionErrors } : {}),
            average_snippet_length: Math.round(
              allScenes.reduce((sum, s) => sum + (s.script_snippet?.length || 0), 0) / allScenes.length
            ),
          },
        }) + '\n'));
      } else {
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'error',
          error: 'All scene generation sections failed',
          section_errors: sectionErrors,
        }) + '\n'));
      }

      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Generate scenes for a single script section via GPT-4o streaming.
 */
async function generateSection(
  sectionText: string,
  sectionIndex: number,
  totalSections: number,
  startSceneNumber: number,
  targetDuration: number,
  wordsPerScene: number,
  client: OpenAI,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<ParsedScene[]> {
  const prompt = SCENE_SECTION_PROMPT(
    sectionText, sectionIndex, totalSections, startSceneNumber,
    targetDuration, wordsPerScene
  );

  const maxTokens = 16000;

  const stream = await client.chat.completions.create({
    model: MODELS.GPT4O,
    max_tokens: maxTokens,
    temperature: 0.7,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });

  let accumulatedText = '';

  for await (const streamChunk of stream) {
    const content = streamChunk.choices[0]?.delta?.content;
    if (content) {
      accumulatedText += content;
      controller.enqueue(encoder.encode(JSON.stringify({ type: 'progress', sectionIndex, text: content }) + '\n'));
    }
  }

  const scenes = parseSceneJson(accumulatedText);
  if (!scenes) {
    throw new Error(`Failed to parse JSON from section ${sectionIndex + 1} response`);
  }

  return scenes;
}

/**
 * Extract and parse a JSON array of scenes from GPT-4o output.
 */
function parseSceneJson(text: string): ParsedScene[] | null {
  const result = parseJsonArray<ParsedScene>(text);
  if (!result) {
    console.error('[Scene Analysis] JSON parse error for text starting with:', text.substring(0, 200));
  }
  return result;
}
