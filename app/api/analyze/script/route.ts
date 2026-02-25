import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getOpenAIClient } from '@/lib/ai/openai';
import { SYSTEM_PROMPT } from '@/lib/prompts/war-room';
import { SCENE_SECTION_PROMPT, PreviousScene } from '@/lib/prompts/scene-generation';
import { parseJsonArray } from '@/lib/api/json-parser';
import { validateRequest, isValidationError, ScriptAnalysisSchema } from '@/lib/api/validate';
import { splitTextBySentenceIntegrity } from '@/lib/utils/script-splitter';
import { getPacingPhase } from '@/lib/config/pacing';
import { WORDS_PER_MINUTE, SENTENCES_PER_CHUNK } from '@/lib/config/content';
import { MODELS } from '@/lib/config/ai';

export const maxDuration = 600; // 10 minutes timeout for large scene generation
export const runtime = 'nodejs'; // Use Node.js runtime for streaming support

interface ParsedScene {
  scene_number: number;
  script_snippet: string;
  visual_prompt: string;
  pacing_phase: string;
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

    console.log(`[Scene Analysis] Splitting script deterministically (${SENTENCES_PER_CHUNK} sentences per chunk)...`);
    const { management_chunks } = splitTextBySentenceIntegrity(script, SENTENCES_PER_CHUNK);
    const sections = management_chunks.map(chunk => chunk.text_content);

    console.log(`[Scene Analysis] Split into ${management_chunks.length} chunks:`);
    for (const chunk of management_chunks) {
      const chunkWords = chunk.text_content.split(/\s+/).length;
      console.log(`  Chunk ${chunk.chunk_id}: ${chunk.sentence_count} sentences, ${chunkWords} words — "${chunk.text_content.substring(0, 80)}..."`);
    }

    return handleSequentialGeneration(sections, wordCount, durationSeconds, client);
  } catch (error) {
    console.error('[Scene Analysis] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze script', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Process script sections sequentially, letting GPT-4o organically decide
 * how many scenes each section requires. No pre-calculated target.
 */
function handleSequentialGeneration(
  sections: string[],
  wordCount: number,
  durationSeconds: number,
  client: OpenAI
): Response {
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      const allScenes: ParsedScene[] = [];
      const sectionErrors: { sectionIndex: number; error: string }[] = [];
      let nextSceneNumber = 1;
      let cumulativeWordOffset = 0;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionWordCount = section.split(/\s+/).length;
        const { phase: startingPhase } = getPacingPhase(cumulativeWordOffset);

        console.log(`[Scene Analysis] Section ${i + 1}/${sections.length}: ${sectionWordCount} words, globalOffset=${cumulativeWordOffset}, startPhase=${startingPhase}, starting scene ${nextSceneNumber}`);

        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'section_progress',
          sectionIndex: i,
          totalSections: sections.length,
          status: 'started',
          pacingPhase: startingPhase,
        }) + '\n'));

        try {
          const previousScenes: PreviousScene[] | undefined = allScenes.length > 0
            ? allScenes.slice(-3).map(s => ({
                scene_number: s.scene_number,
                script_snippet: s.script_snippet,
                visual_prompt: s.visual_prompt,
                pacing_phase: s.pacing_phase || startingPhase,
              }))
            : undefined;

          const sectionScenes = await generateSection(
            section, i, sections.length, nextSceneNumber,
            cumulativeWordOffset,
            previousScenes, client, controller, encoder
          );

          // Renumber scenes sequentially
          const renumbered = sectionScenes.map((scene, idx) => ({
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
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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

        cumulativeWordOffset += sectionWordCount;
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
  globalWordOffset: number,
  previousScenes: PreviousScene[] | undefined,
  client: OpenAI,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<ParsedScene[]> {
  const prompt = SCENE_SECTION_PROMPT(
    sectionText, sectionIndex, totalSections, startSceneNumber,
    globalWordOffset, previousScenes
  );

  // Each section is ~600 words → at most ~100 scenes (hook) or ~25 scenes (deep_content)
  // Budget generously: 16000 tokens should be plenty for any single section
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
      controller.enqueue(encoder.encode(JSON.stringify({ type: 'progress', text: content }) + '\n'));
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
