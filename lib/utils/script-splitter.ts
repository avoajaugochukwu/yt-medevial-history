import nlp from 'compromise';

export interface ScriptChunk {
  chunk_id: number;
  sentence_count: number;
  text_content: string;
}

export interface SplitResult {
  management_chunks: ScriptChunk[];
}

/**
 * Splits a long text block into manageable chunks based on sentence count,
 * ensuring semantic integrity by splitting only at sentence boundaries.
 *
 * Uses the `compromise` NLP library for deterministic sentence tokenization.
 */
export function splitTextBySentenceIntegrity(
  longText: string,
  maxSentencesPerChunk: number = 20
): SplitResult {
  const sentences: string[] = nlp(longText).sentences().json().map((s: { text: string }) => s.text.trim()).filter(Boolean);

  if (sentences.length === 0) {
    return { management_chunks: [] };
  }

  const management_chunks: ScriptChunk[] = [];
  let chunkId = 1;
  let currentSentenceBuffer: string[] = [];

  for (const sentence of sentences) {
    currentSentenceBuffer.push(sentence);

    if (currentSentenceBuffer.length >= maxSentencesPerChunk) {
      management_chunks.push({
        chunk_id: chunkId,
        sentence_count: currentSentenceBuffer.length,
        text_content: currentSentenceBuffer.join(' '),
      });
      chunkId++;
      currentSentenceBuffer = [];
    }
  }

  // Handle remaining sentences (last, potentially smaller chunk)
  if (currentSentenceBuffer.length > 0) {
    management_chunks.push({
      chunk_id: chunkId,
      sentence_count: currentSentenceBuffer.length,
      text_content: currentSentenceBuffer.join(' '),
    });
  }

  return { management_chunks };
}
