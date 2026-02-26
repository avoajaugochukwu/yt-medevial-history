# lib/ — Business Logic & AI Pipeline

## Prompts (`prompts/`)
- Each domain has its own file: `war-room.ts`, `scene-generation.ts`, `character.ts`, `style.ts`, `content-safety.ts`, `repurpose-prompts.ts`
- All prompts re-exported through `prompts/index.ts` — import from there, not individual files
- Content safety directives (`CONTENT_SAFETY_*`) are shared across prompt files
- Prompts are template strings with embedded variables, not function-generated

## Hooks (`hooks/`)
- Workflow hooks manage multi-step async pipelines (research → script → scenes)
- Pattern: custom hook calls API routes sequentially, updates Zustand store between steps
- Key hooks: `use-video-generation`, `use-character-approval`, `use-scripting-workflow`, `use-repurpose-workflow`, `use-storyboard-pipeline`

## Config (`config/`)
- `ai.ts` — Model IDs (`MODELS`), aspect ratios (`ASPECT_RATIOS`)
- `content.ts` — Words-per-minute, section sentence counts, scene durations. Helper functions: `getSectionSentenceCount()`, `getSectionTargetDuration()`, `getWordsPerScene()`
- `video.ts` — Video generation API URL, polling interval, terminal states
- `development.ts` — Dev-specific settings

## API Utilities (`api/`)
- `error-response.ts` — `validationError()`, `configError()`, `internalError()`
- `validate.ts` — `validateRequest(req, schema)` + `isValidationError()` pattern with Zod schemas
- `json-parser.ts` — Safe JSON extraction from AI responses

## Types (`types/index.ts`)
- Single barrel file for all types
- Core pipeline: `HistoricalTopic` → `HistoricalResearch`/`TacticalResearch` → `NarrativeOutline`/`GamifiedWarOutline` → `Script`/`RecursiveScript` → `Scene[]` → `StoryboardScene[]`
- Two content modes: standard narrative (Script) and War Room tactical (RecursiveScript with batched generation)
- Video pipeline: `StoryboardScene` → `ApiSceneItem` → `VideoGenerationStatus`

## State (`store.ts`)
- Single Zustand store (`useSessionStore`) — flat shape, no nested slices
- Actions are simple setters + one `updateStoryboardScene` updater
- Store holds both standard workflow and War Room state

## Utils (`utils/`)
- `cn.ts` — Tailwind class merging (clsx + tailwind-merge)
- `scene-timing.ts` — Scene duration calculations
- `script-splitter.ts` — Splits scripts into sections for parallel scene generation
- `word-count.ts` — Word counting utilities
- `sanitize-script.ts` — Em dash and character sanitization for TTS
- `export.ts` — ZIP export assembly
