import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getOpenAIClient } from '@/lib/ai/openai';
import { SYSTEM_PROMPT, SCENE_SECTION_PROMPT, PreviousScene } from '@/lib/prompts/all-prompts';

export const maxDuration = 600; // 10 minutes timeout for large scene generation
export const runtime = 'nodejs'; // Use Node.js runtime for streaming support

interface ParsedScene {
  scene_number: number;
  script_snippet: string;
  visual_prompt: string;
  pacing_phase: string;
  [key: string]: unknown;
}

/**
 * Split script text into sections of ~maxWords at paragraph boundaries.
 */
function splitScriptIntoSections(script: string, maxWordsPerSection: number = 600): string[] {
  const paragraphs = script.split(/\n\s*\n/);
  const sections: string[] = [];
  let currentSection = '';
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    const paragraphWords = trimmed.split(/\s+/).length;

    if (currentWordCount + paragraphWords > maxWordsPerSection && currentSection) {
      sections.push(currentSection.trim());
      currentSection = '';
      currentWordCount = 0;
    }

    currentSection += (currentSection ? '\n\n' : '') + trimmed;
    currentWordCount += paragraphWords;
  }

  if (currentSection.trim()) {
    sections.push(currentSection.trim());
  }

  return sections;
}

/**
 * Determine pacing phase based on cumulative word offset in the script.
 */
function getPacingPhase(wordOffset: number): { phase: string; durationRange: string; maxWordsPerScene: number } {
  if (wordOffset < 200) return { phase: 'hook', durationRange: '1.5-2.5 seconds', maxWordsPerScene: 6 };
  if (wordOffset < 600) return { phase: 'setup', durationRange: '3-5 seconds', maxWordsPerScene: 13 };
  if (wordOffset < 2000) return { phase: 'core_content', durationRange: '5-8 seconds', maxWordsPerScene: 20 };
  return { phase: 'deep_content', durationRange: '6-10 seconds', maxWordsPerScene: 25 };
}

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();

    if (!script) {
      return new Response(
        JSON.stringify({ error: 'Script is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const wordCount = script.trim().split(/\s+/).length;
    const durationSeconds = Math.round((wordCount / 150) * 60);
    const sections = splitScriptIntoSections(script, 600);

    console.log(`[Scene Analysis] Analyzing script (${script.length} chars, ${wordCount} words, ~${Math.round(durationSeconds / 60)} min)`);
    console.log(`[Scene Analysis] Split into ${sections.length} sections for sequential processing`);

    const client = getOpenAIClient();

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
        const { phase, durationRange, maxWordsPerScene } = getPacingPhase(cumulativeWordOffset);

        console.log(`[Scene Analysis] Section ${i + 1}/${sections.length}: ${sectionWordCount} words, phase=${phase}, starting scene ${nextSceneNumber}`);

        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'section_progress',
          sectionIndex: i,
          totalSections: sections.length,
          status: 'started',
          pacingPhase: phase,
        }) + '\n'));

        try {
          const previousScenes: PreviousScene[] | undefined = allScenes.length > 0
            ? allScenes.slice(-3).map(s => ({
                scene_number: s.scene_number,
                script_snippet: s.script_snippet,
                visual_prompt: s.visual_prompt,
                pacing_phase: s.pacing_phase || phase,
              }))
            : undefined;

          const sectionScenes = await generateSection(
            section, i, sections.length, nextSceneNumber,
            phase, durationRange, maxWordsPerScene,
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
  pacingPhase: string,
  durationRange: string,
  maxWordsPerScene: number,
  previousScenes: PreviousScene[] | undefined,
  client: OpenAI,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<ParsedScene[]> {
  const prompt = SCENE_SECTION_PROMPT(
    sectionText, sectionIndex, totalSections, startSceneNumber,
    pacingPhase, durationRange, maxWordsPerScene, previousScenes
  );

  // Each section is ~600 words → at most ~100 scenes (hook) or ~25 scenes (deep_content)
  // Budget generously: 16000 tokens should be plenty for any single section
  const maxTokens = 16000;

  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
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
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    }
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    console.error('[Scene Analysis] JSON parse error for text starting with:', text.substring(0, 200));
    return null;
  }
}
