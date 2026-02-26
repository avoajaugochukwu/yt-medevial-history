# Historia Engine — Medieval History YouTube Video Generator

AI-powered platform for generating historical documentary videos: scripts, storyboards, scene images, and video assembly.

## Tech Stack
- Next.js 15 (App Router, Turbopack) / React 19 / TypeScript (strict)
- Tailwind CSS 4 + shadcn/ui (Radix primitives)
- Zustand for state management, Zod for validation
- AI: Claude (scripts), OpenAI GPT-4o (analysis/identification), FAL AI (image gen), Perplexity (research)

## Commands
- `npm run dev` — start dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint

## Environment Variables (`.env.local`)
- `ANTHROPIC_API_KEY` — Claude for script generation, polishing, repurpose rewriting
- `OPENAI_API_KEY` — GPT-4o for analysis/identification, GPT-4o-mini for art style
- `PERPLEXITY_API_KEY` — Sonar Pro for historical research
- `FAL_API_KEY` — nano-banana for scene images and character portraits
- `NEXT_PUBLIC_VIDEO_GENERATION_API_URL` — Railway video service endpoint (has default fallback)

## Pages
| URL | Page file | Purpose |
|-----|-----------|---------|
| `/` | `app/page.tsx` | Redirects to `/scripting` |
| `/scripting` | `app/scripting/page.tsx` | War Room script generation (research → script → polish) |
| `/scenes` | `app/scenes/page.tsx` | Character approval + scene analysis + storyboard image generation |
| `/video-generation` | `app/video-generation/page.tsx` | Upload audio/SRT, submit video job, poll status, download |
| `/export` | `app/export/page.tsx` | Download full project as ZIP |
| `/rewrite` | `app/rewrite/page.tsx` | YouTube repurpose: extract → analyze → rewrite → titles |

## Workflow Pipeline (end-to-end)
1. **Research** — User enters title + duration → Perplexity fetches tactical research + OpenAI generates art style
2. **Hook** — Claude writes Battle Cold Open (~150 words, 40 seconds)
3. **Outline** — Claude creates 5-point Gamified War Arc (matchup → unit deep dive → tactical turn → kill screen → aftermath)
4. **Batches** — Claude generates 5 script batches (~800 words each) following outline
5. **Audit** — OpenAI GPT-4o audits script for repetition/style issues
6. **Polish** — Claude rewrites script based on audit report
7. **Characters** — OpenAI identifies historical figures → user approves → FAL generates portraits
8. **Scenes** — OpenAI breaks script into scenes (SSE streaming) → FAL generates images per scene
9. **Video** — User uploads audio + SRT → Railway service assembles video
10. **Export** — ZIP download of all generated content

## Project Structure
```
app/
  page.tsx                          # redirect → /scripting
  layout.tsx                        # Geist + Cinzel fonts, AppHeader, Toaster
  scripting/page.tsx                # script generation UI
  scenes/page.tsx                   # character + storyboard UI
  video-generation/page.tsx         # video assembly UI
  export/page.tsx                   # ZIP export UI
  rewrite/page.tsx                  # YouTube repurpose UI
  api/                              # 16 API routes (see app/api/CLAUDE.md)
components/
  ui/                               # shadcn/ui (button, card, dialog, input, etc.)
  common/                           # app-header, loading-spinner, error-display, navigation-buttons, development-toolbar
  workflow/                         # script-progress-list, scene-breakdown, export-panel
    scenes/                         # storyboard-grid, scene-editor
    characters/                     # character-approval
lib/
  ai/                               # AI client wrappers (see lib/CLAUDE.md)
  api/                              # validate.ts, error-response.ts, json-parser.ts
  config/                           # ai.ts, content.ts, video.ts, development.ts
  hooks/                            # 5 workflow hooks
  prompts/                          # prompt templates (index.ts barrel)
  types/                            # index.ts single barrel
  utils/                            # cn, word-count, sanitize-script, scene-timing, script-splitter, export
  store.ts                          # Zustand session store
```

## API Routes (16 total)

See `app/api/CLAUDE.md` for per-route details (schemas, response shapes, AI chains).

| Method | Route | Runtime | AI Provider | Schema |
|--------|-------|---------|-------------|--------|
| POST | `/api/research/historical` | edge | Perplexity + OpenAI | `TacticalResearchSchema` |
| POST | `/api/generate/art-style` | edge | OpenAI mini | `ArtStyleSchema` |
| POST | `/api/generate/final-script` | nodejs 300s | Claude ×4 | `FinalScriptSchema` |
| POST | `/api/generate/analyze-repetition` | nodejs 60s | OpenAI | `AuditScriptSchema` |
| POST | `/api/generate/polish-script` | nodejs 120s | Claude | `PolishScriptSchema` |
| POST | `/api/identify/characters` | default 60s | OpenAI | `IdentifyCharactersSchema` |
| POST | `/api/generate/character-reference` | default 120s | FAL AI | manual |
| POST | `/api/analyze/script` | nodejs 600s | OpenAI (SSE) | `ScriptAnalysisSchema` |
| POST | `/api/generate/scene-image` | default | FAL AI | manual |
| POST | `/api/repurpose/extract` | nodejs 60s | None | manual |
| POST | `/api/repurpose/analyze` | nodejs 120s | Claude | `RepurposeAnalyzeSchema` |
| POST | `/api/repurpose/rewrite` | nodejs 180s | Claude | manual |
| POST | `/api/repurpose/titles` | nodejs 60s | Claude | `RepurposeTitlesSchema` |
| POST | `/api/video/generate` | default | None (Railway) | FormData |
| GET | `/api/video/status/[jobId]` | default | None (Railway) | — |
| GET | `/api/video/download/[jobId]` | default | None (Railway) | — |

## Component Inventory

| Component | File | Hooks Used |
|-----------|------|------------|
| AppHeader | `components/common/app-header.tsx` | `useRouter`, `usePathname` |
| NavigationButtons | `components/common/navigation-buttons.tsx` | `useSessionStore`, `useRouter` |
| LoadingSpinner | `components/common/loading-spinner.tsx` | — |
| ErrorDisplay | `components/common/error-display.tsx` | — |
| DevelopmentToolbar | `components/common/development-toolbar.tsx` | — |
| ScriptProgressList | `components/workflow/script-progress-list.tsx` | — |
| SceneBreakdown | `components/workflow/scene-breakdown.tsx` | `useSessionStore` |
| ExportPanel | `components/workflow/export-panel.tsx` | `useSessionStore`, `useRouter` |
| StoryboardGrid | `components/workflow/scenes/storyboard-grid.tsx` | `useStoryboardPipeline` |
| SceneEditor | `components/workflow/scenes/scene-editor.tsx` | `useSessionStore` |
| CharacterApproval | `components/workflow/characters/character-approval.tsx` | `useCharacterApproval` |

## Key Conventions
- Path alias: `@/*` maps to project root
- Runtime: most routes use `nodejs` with explicit `maxDuration`. Only 2 routes use `edge` (research/historical, art-style). Some routes use default runtime.
- Request validation: `validateRequest(req, schema)` + `isValidationError()` guard from `lib/api/validate.ts`. Some routes do manual validation instead.
- Error responses: `validationError()` (400), `configError()` (500), `internalError(action, error)` (500) from `lib/api/error-response.ts`
- Console logging: bracketed prefixes like `[Art Style]`, `[Scene Gen]`, `[Final Script]`
- Config values in `lib/config/` — never hardcode model IDs, durations, or constants in routes
- AI model IDs centralized in `lib/config/ai.ts` (`MODELS` object)
- Prompts live in `lib/prompts/` — always import from `@/lib/prompts` (barrel file), not individual files
- Types defined in `lib/types/index.ts` — single barrel file
- Toasts via `react-hot-toast` (already in layout.tsx)
- Streaming: only `/analyze/script` uses SSE (newline-delimited JSON). `/video/download` streams binary.
- FormData: only `/video/generate` uses FormData. All other POST routes use JSON.

## Pattern: Standard API Route
```ts
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, isValidationError, SomeSchema } from '@/lib/api/validate';
import { configError, internalError } from '@/lib/api/error-response';
import { generateWithClaude } from '@/lib/ai/anthropic';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const data = await validateRequest(request, SomeSchema);
  if (isValidationError(data)) return data;
  if (!process.env.SOME_API_KEY) return configError('API key not configured');
  try {
    const result = await generateWithClaude(somePrompt(data), SYSTEM_PROMPT);
    const parsed = parseJsonObject(result);
    return NextResponse.json({ success: true, ...parsed });
  } catch (error) {
    return internalError('generate something', error);
  }
}
```

## Pattern: Workflow Hook
```ts
// hooks call API routes sequentially, updating Zustand store between steps
const handleGenerate = async () => {
  store.setGenerating(true);
  store.clearErrors();
  try {
    const res = await fetch('/api/some/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: value }),
    });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    store.setSomeState(data.result);
  } catch (err) {
    store.addError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    store.setGenerating(false);
  }
};
```

## Deeper References
- **API route details** (schemas, response shapes, AI chains): `app/api/CLAUDE.md`
- **Implementation reference** (function signatures, config values, types): `lib/CLAUDE.md`
