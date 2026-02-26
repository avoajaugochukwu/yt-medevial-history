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

## Project Structure
- `app/` — Next.js pages + API routes (`app/api/`)
- `components/` — React components: `common/`, `ui/` (shadcn), `workflow/`
- `lib/` — Business logic: `ai/`, `api/`, `config/`, `hooks/`, `prompts/`, `types/`, `utils/`, `youtube/`
- `lib/store.ts` — Zustand session store (single flat store)

## Key Conventions
- Path alias: `@/*` maps to project root
- API routes use Edge Runtime (`export const runtime = 'edge'`)
- Request validation: `validateRequest()` + Zod schemas from `lib/api/validate.ts`
- Error responses: use `validationError()`, `configError()`, `internalError()` from `lib/api/error-response.ts`
- Console logging: use bracketed prefixes like `[Art Style]`, `[Scene Gen]`
- Config values live in `lib/config/` — not hardcoded in routes or components
- AI model IDs are centralized in `lib/config/ai.ts` (`MODELS` object)
- Prompts live in `lib/prompts/` and are re-exported through `lib/prompts/index.ts`
- Types are defined in `lib/types/index.ts` — single barrel file

## AI Provider Usage
- **Claude (Anthropic)**: Script generation, polishing, scene analysis
- **OpenAI GPT-4o**: Character identification, script analysis/audit, art style generation
- **OpenAI GPT-4o-mini**: Cheaper tasks (art style variants)
- **FAL AI (nano-banana)**: Image generation (scene images, character portraits)
- **Perplexity (sonar-pro)**: Historical research
