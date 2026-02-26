# API Routes Handbook

16 routes. All POST except two GETs. See pattern template below, then per-route details.

## Standard Route Pattern

```ts
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, isValidationError, SomeSchema } from '@/lib/api/validate';
import { configError, internalError } from '@/lib/api/error-response';
import { generateWithClaude } from '@/lib/ai/anthropic'; // or openai, perplexity, fal

export const runtime = 'nodejs'; // or 'edge'
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const data = await validateRequest(request, SomeSchema);
  if (isValidationError(data)) return data;

  if (!process.env.SOME_API_KEY) return configError('API key not configured');

  try {
    const result = await generateWithSomeProvider(data.field);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return internalError('do something', error);
  }
}
```

Exceptions to this pattern:
- `/video/generate` uses FormData (not JSON)
- `/video/download/[jobId]` and `/video/status/[jobId]` are GET + proxy to Railway
- `/analyze/script` returns SSE stream (ReadableStream), not JSON
- `/generate/scene-image` and `/generate/character-reference` skip validateRequest (manual validation)
- `/repurpose/extract` and `/repurpose/rewrite` skip validateRequest (manual validation)

## Routes by Domain

### Script Generation

| Route | Runtime | Duration | Schema | AI Provider |
|-------|---------|----------|--------|-------------|
| POST `/api/generate/final-script` | nodejs | 300s | `FinalScriptSchema` | Claude (4 calls: hook, outline, 5 batches) |
| POST `/api/generate/polish-script` | nodejs | 120s | `PolishScriptSchema` | Claude |
| POST `/api/generate/analyze-repetition` | nodejs | 60s | `AuditScriptSchema` | OpenAI GPT-4o |

**`/generate/final-script`** — Orchestrates full War Room script pipeline.
- Schema: `{ title, research, targetDuration, scriptDuration?: 'short'|'medium'|'long' }`
- Calls Claude 4× sequentially: HOOK_PROMPT → MASTER_OUTLINE_PROMPT → 5× RECURSIVE_BATCH_PROMPT
- Response: `{ success, script: RecursiveScript, metadata: { total_word_count, estimated_duration_minutes, batch_count, script_duration, target_word_count, style_violations } }`

**`/generate/polish-script`** — Rewrites script based on audit report.
- Schema: `{ rawScript, auditReport, targetDuration }`
- Response: `{ success, polishedContent: string, wordCount: number }`

**`/generate/analyze-repetition`** — Audits script for redundancy/style issues.
- Schema: `{ script (min 100 chars) }`
- Response: `{ success, report: string }`

### Research & Style

| Route | Runtime | Duration | Schema | AI Provider |
|-------|---------|----------|--------|-------------|
| POST `/api/research/historical` | edge | 60s | `TacticalResearchSchema` | Perplexity (2 calls) + OpenAI |
| POST `/api/generate/art-style` | edge | 30s | `ArtStyleSchema` | OpenAI GPT-4o-mini |

**`/research/historical`** — Historical research + art style in one call.
- Schema: `{ title, targetDuration?: number(1-60) }`
- Chain: Perplexity (raw research) → Perplexity (structured tactical data) → OpenAI (art style)
- Response: `{ success, research: TacticalResearch, artStyle?: string }`

**`/generate/art-style`** — Standalone art style generation.
- Schema: `{ era: HistoricalEra, title }`
- Response: `{ success, artStyle: string }`

### Scene & Character

| Route | Runtime | Duration | Schema | AI Provider |
|-------|---------|----------|--------|-------------|
| POST `/api/analyze/script` | nodejs | 600s | `ScriptAnalysisSchema` | OpenAI GPT-4o (streaming) |
| POST `/api/generate/scene-image` | default | — | manual | FAL AI nano-banana |
| POST `/api/identify/characters` | default | 60s | `IdentifyCharactersSchema` | OpenAI GPT-4o |
| POST `/api/generate/character-reference` | default | 120s | manual | FAL AI nano-banana |

**`/analyze/script`** — Splits script into sections, generates scenes in parallel. **SSE streaming**.
- Schema: `{ script }`
- Streams newline-delimited JSON events:
  - `{ type: 'section_progress', sectionIndex, totalSections, status, ... }`
  - `{ type: 'complete', scenes: Scene[], metadata }`
  - `{ type: 'error', error, section_errors }`
- Content-Type: `text/event-stream`

**`/generate/scene-image`** — Generates a single scene image.
- Body: `{ scene: { scene_number, visual_prompt?, scene_type?, shot_type? }, artStyle?, characterReferences?: { name, visual_description, reference_image_url }[] }`
- Uses nano-banana for standard images, nano-banana/edit for character-conditioned images
- Response: `{ image_url, prompt_used, aspect_ratio, model, style, character_conditioned, character_count }`

**`/identify/characters`** — Identifies historical figures from script.
- Schema: `{ script, era?: HistoricalEra }`
- Response: `{ success, characters: CharacterWithReference[], metadata: { total, primary, secondary } }`

**`/generate/character-reference`** — Generates portrait for one character.
- Body: `{ character: { id, name, visual_description, historical_period_appearance, ... } }`
- Response: `{ success, character_id, image_url, prompt_used, aspect_ratio, model }`

### YouTube Repurpose

| Route | Runtime | Duration | Schema | AI Provider |
|-------|---------|----------|--------|-------------|
| POST `/api/repurpose/extract` | nodejs | 60s | manual | None (YouTube util) |
| POST `/api/repurpose/analyze` | nodejs | 120s | `RepurposeAnalyzeSchema` | Claude |
| POST `/api/repurpose/rewrite` | nodejs | 180s | manual | Claude |
| POST `/api/repurpose/titles` | nodejs | 60s | `RepurposeTitlesSchema` | Claude |

**`/repurpose/extract`** — Extracts transcript from YouTube URL.
- Body: `{ url: string }`
- Response: `{ success, extraction: { transcript: { text, wordCount } } }`

**`/repurpose/analyze`** — Analyzes extracted transcript for retention quality.
- Schema: `{ extraction: { transcript: { text, wordCount } } }`
- Response: `{ success, analysis: ScriptAnalysis }`

**`/repurpose/rewrite`** — Rewrites transcript with War Room style.
- Body: `{ extraction: YouTubeExtraction, analysis: ScriptAnalysis }`
- Response: `{ success, rewrittenScript: { content, wordCount, estimatedDuration, appliedTechniques, rewrittenAt } }`

**`/repurpose/titles`** — Generates 3 clickable title options.
- Schema: `{ script }`
- Response: `{ success, titles: string[] }`

### Video Pipeline

| Route | Runtime | Duration | Schema | AI Provider |
|-------|---------|----------|--------|-------------|
| POST `/api/video/generate` | default | — | FormData | None (Railway proxy) |
| GET `/api/video/status/[jobId]` | default | — | — | None (Railway proxy) |
| GET `/api/video/download/[jobId]` | default | — | — | None (Railway proxy) |

**`/video/generate`** — Submits video generation job. **FormData** (not JSON).
- Fields: `audio` (File), `original_script` (string), `scene_data` (string)
- Proxies to Railway VIDEO_GENERATION_API_URL
- Response: proxied Railway JSON

**`/video/status/[jobId]`** — Polls job status (GET).
- Response: proxied Railway JSON (`VideoGenerationStatus` shape)

**`/video/download/[jobId]`** — Downloads completed video (GET). **Binary stream**.
- Response: video/mp4 binary stream from Railway
