# Refactoring Plan - yt-medieval-history

**Created**: 2026-02-25
**Status**: Awaiting Approval
**Estimated Total Effort**: ~36 hours across 4 phases

---

## Initial State Analysis

- **Architecture**: Next.js 15 app with API routes, Zustand store, AI service integrations (OpenAI, Anthropic, Perplexity, Fal.ai)
- **Total LOC**: ~9,000+ lines (excluding node_modules)
- **Test Coverage**: 0% (no test infrastructure)
- **Zod installed but unused** for validation

### Problem Areas
| File | Lines | Issue |
|------|-------|-------|
| `lib/prompts/all-prompts.ts` | 1,306 | Monolithic prompt file - all prompts in one file |
| `app/pages/rewrite/page.tsx` | 677 | Oversized page component with mixed concerns |
| `components/workflow/characters/character-approval.tsx` | 662 | 15+ useState hooks, mixed UI/logic |
| `app/pages/scripting/page.tsx` | 564 | 11-step workflow with dense state |
| `components/workflow/scenes/storyboard-grid.tsx` | 537 | Complex grid with 4+ loading states per scene |
| `lib/utils/export.ts` | 318 | Mixed concerns (ZIP, FFmpeg, media fetch) |
| 16 API routes | Various | No input validation, inconsistent error handling |

### Key Patterns Found
- JSON parsing duplicated in 5+ routes
- Streaming response setup duplicated in 2+ routes
- Step progress UI duplicated in 2 pages
- Inline fetch with try/catch repeated in every page component
- 40+ console.log statements (no structured logging)

---

## Phase 1: Foundation (Critical)

### Task 1.1 - Split `lib/prompts/all-prompts.ts` (1,306 lines)
**Risk**: Medium | **Impact**: High

Split into domain-specific modules:
```
lib/prompts/
├── war-room.ts              (HOOK_PROMPT, MASTER_OUTLINE, RECURSIVE_BATCH)
├── scene-generation.ts      (SCENE_SECTION_PROMPT, SYSTEM_PROMPT)
├── character.ts             (CHARACTER_IDENTIFICATION_PROMPT)
├── style.ts                 (generateStyleSuffix, NEGATIVE_PROMPT_*, HISTORICAL_MAP)
├── repurpose-prompts.ts     (existing - keep as-is)
└── index.ts                 (re-exports for backwards compat)
```

- [ ] Create domain-specific prompt files
- [ ] Move prompts to respective files
- [ ] Create index.ts with unified exports
- [ ] Update all 16 import sites
- [ ] Verify no broken imports

### Task 1.2 - Extract Reusable API Utilities
**Risk**: Low | **Impact**: High

```
lib/api/
├── json-parser.ts          (safe JSON extraction from AI responses)
├── stream-response.ts      (TextEncoder + ReadableStream wrapper)
├── error-response.ts       (standardized NextResponse error helpers)
└── validate.ts             (Zod-powered request validation wrapper)
```

- [ ] Extract JSON parsing pattern (used in 5+ routes)
- [ ] Extract streaming response setup
- [ ] Create standardized error response helpers
- [ ] Create Zod validation wrapper for route handlers

### Task 1.3 - Add Zod Validation to API Routes
**Risk**: Low | **Impact**: High

- [ ] Create Zod schemas for all request types
- [ ] Apply validation to all 16 API routes
- [ ] Replace manual `if (!field)` checks with schema validation
- [ ] Standardize error responses

### Task 1.4 - Extract Pacing Config (Magic Numbers)
**Risk**: Low | **Impact**: Medium

- [ ] Move hardcoded word offsets (200, 600, 2000) to `lib/config/pacing.ts`
- [ ] Make duration ranges configurable
- [ ] Update `app/api/analyze/script/route.ts`

---

## Phase 2: Component Decomposition (High Value)

### Task 2.1 - Create Custom Hooks for Page Logic
**Risk**: Medium | **Impact**: High

Extract business logic from page components into hooks:

```
lib/hooks/
├── use-repurpose-workflow.ts    (from rewrite/page.tsx)
├── use-scripting-workflow.ts    (from scripting/page.tsx)
├── use-character-approval.ts    (from character-approval.tsx)
└── use-scene-management.ts      (from storyboard-grid.tsx)
```

- [ ] Create `use-repurpose-workflow.ts` - extract all fetch chains + state from rewrite page
- [ ] Create `use-scripting-workflow.ts` - extract 11-step pipeline logic
- [ ] Refactor page components to use hooks (target: <250 lines each)

### Task 2.2 - Split Character Approval Component (662 lines)
**Risk**: Medium | **Impact**: High

```
components/workflow/characters/
├── character-list.tsx           (renders character grid)
├── character-card.tsx           (single character display)
├── character-edit-dialog.tsx    (edit form modal)
├── character-approval.tsx       (orchestration - now ~200 lines)
```

- [ ] Extract CharacterCard component
- [ ] Extract CharacterEditDialog component
- [ ] Extract CharacterList component
- [ ] Create `use-character-approval.ts` hook
- [ ] Slim down main component to orchestration only

### Task 2.3 - Create Shared Step Progress Component
**Risk**: Low | **Impact**: Medium

- [ ] Create `components/workflow/common/step-progress.tsx`
- [ ] Replace duplicated step UI in rewrite + scripting pages
- [ ] Support configurable step count and labels

---

## Phase 3: API Route Cleanup (Maintainability)

### Task 3.1 - Standardize Error Handling
**Risk**: Low | **Impact**: Medium

- [ ] Create consistent error response format across all routes
- [ ] Replace `console.error` with structured logger
- [ ] Add request context to error logs

### Task 3.2 - Create Structured Logger
**Risk**: Low | **Impact**: Medium

```
lib/utils/logger.ts   (debug/info/error with namespaces)
```

- [ ] Create logger utility with namespace support
- [ ] Replace 40+ console.log/console.error calls
- [ ] Add log level support (debug only in dev)

### Task 3.3 - Split Export Utility (318 lines)
**Risk**: Low | **Impact**: Low

```
lib/utils/export/
├── zip-exporter.ts
├── ffmpeg-manifest.ts
├── media-fetcher.ts
└── index.ts
```

- [ ] Split by responsibility
- [ ] Update import sites

---

## Phase 4: Type Safety & Robustness

### Task 4.1 - Remove Inline Type Duplicates
**Risk**: Low | **Impact**: Medium

- [ ] Find inline interfaces that duplicate `lib/types/index.ts`
- [ ] Replace with imports from central types
- [ ] Remove `[key: string]: unknown` escape hatches

### Task 4.2 - Add Environment Validation
**Risk**: Low | **Impact**: Medium

- [ ] Create `lib/config/env.ts` with Zod schema
- [ ] Validate all required env vars at startup
- [ ] Use typed env object throughout codebase

### Task 4.3 - Create Shared Fetch Wrapper
**Risk**: Low | **Impact**: Medium

- [ ] Create `lib/utils/api-client.ts` with error handling + timeout
- [ ] Replace inline fetch calls in page components
- [ ] Add optional Zod response validation

---

## Validation Checklist (Run After Each Phase)

- [ ] All old patterns removed
- [ ] No broken imports
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No orphaned code
- [ ] All exports accessible from new locations

## De-Para Mapping

| Before | After | Status |
|--------|-------|--------|
| `lib/prompts/all-prompts.ts` (monolithic) | `lib/prompts/{war-room,scene-generation,character,style}.ts` | Pending |
| Inline JSON parsing in 5+ routes | `lib/api/json-parser.ts` | Pending |
| Inline streaming setup | `lib/api/stream-response.ts` | Pending |
| Manual `if (!field)` validation | Zod schemas in `lib/api/validate.ts` | Pending |
| 677-line rewrite page | ~200-line page + `use-repurpose-workflow.ts` hook | Pending |
| 662-line character-approval | ~200-line + 3 sub-components + hook | Pending |
| 564-line scripting page | ~200-line page + `use-scripting-workflow.ts` hook | Pending |
| 40+ `console.log` calls | `lib/utils/logger.ts` with namespaces | Pending |
| Hardcoded pacing numbers | `lib/config/pacing.ts` | Pending |
| `process.env.KEY` direct access | `lib/config/env.ts` typed env | Pending |
| Inline fetch in components | `lib/utils/api-client.ts` | Pending |
