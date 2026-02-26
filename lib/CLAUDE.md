# lib/ — Implementation Reference

## AI Clients (`ai/`)

### anthropic.ts
```
generateWithClaude(prompt, systemPrompt?, temperature=0.7, maxTokens=8192): Promise<string>
```
Uses `MODELS.CLAUDE_SONNET`. Returns text or empty string on error.

### openai.ts
```
generateWithOpenAI(prompt, systemPrompt?, temperature=0.7, maxTokens=4096): Promise<string>
```
Uses `MODELS.GPT4O`. Throws on error (does not swallow).

### art-style.ts
```
generateArtStyle(era: HistoricalEra, title: string): Promise<string>
```
Uses `MODELS.GPT4O_MINI` + `GENERATE_ART_STYLE_PROMPT`. Returns style description string.

### perplexity.ts
```
queryPerplexity(options: PerplexityOptions): Promise<string>
```
Options: `{ model?, messages: {role, content}[], temperature?, max_tokens?, return_citations? }`.
Defaults: model=`MODELS.SONAR_PRO`, temperature=0.3, max_tokens=4000.

### fal.ts
```
configureFal(): fal client
```
Initializes FAL client with `FAL_API_KEY`. Used in scene-image and character-reference routes.

---

## Validation Schemas (`api/validate.ts`)

```
validateRequest<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T | Response>
isValidationError(result): result is Response
```

| Schema | Fields |
|--------|--------|
| `ScriptAnalysisSchema` | `{ script: string(min 1) }` |
| `TacticalResearchSchema` | `{ title: string(min 1, max 500), targetDuration?: number(1-60) }` |
| `IdentifyCharactersSchema` | `{ script: string(min 1), era?: HistoricalEra }` |
| `ArtStyleSchema` | `{ era: HistoricalEra, title: string(min 1, max 500) }` |
| `FinalScriptSchema` | `{ title, research, targetDuration: number(min 1), scriptDuration?: 'short'\|'medium'\|'long' }` |
| `PolishScriptSchema` | `{ rawScript: string(min 1), auditReport: string(min 1), targetDuration: number(min 1) }` |
| `AuditScriptSchema` | `{ script: string(min 100) }` |
| `SceneImageSchema` | `{ scene: { scene_number, visual_prompt?, scene_type?, shot_type? }, artStyle?, characterReferences?: [] }` |
| `CharacterReferenceSchema` | `{ character: { id, name, visual_description, historical_period_appearance } }` (passthrough) |
| `RepurposeAnalyzeSchema` | `{ extraction: { transcript: { text: string(min 1), wordCount: number } } }` |
| `RepurposeTitlesSchema` | `{ script: string(min 1) }` |

### Error Helpers (`api/error-response.ts`)
```
validationError(message): NextResponse  → 400
configError(message): NextResponse       → 500
internalError(action, error): NextResponse → 500, body: { success: false, error: `Failed to ${action}` }
```

### JSON Parsing (`api/json-parser.ts`)
```
parseJsonObject<T>(text, options?: { fixIncomplete? }): T | null
parseJsonArray<T>(text): T[] | null
```
Strips markdown code blocks, extracts JSON with regex. `fixIncomplete` closes unmatched braces/brackets.

---

## Config (`config/`)

### ai.ts
```
MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  CLAUDE_SONNET: 'claude-sonnet-4-20250514',
  SONAR_PRO: 'sonar-pro',
  FAL_NANO_BANANA: 'fal-ai/nano-banana',
  FAL_NANO_BANANA_EDIT: 'fal-ai/nano-banana/edit',
}

ASPECT_RATIOS = { PORTRAIT: '3:4', LANDSCAPE: '16:9' }
```

### content.ts
```
WORDS_PER_MINUTE = 150
SECTION_SENTENCE_COUNTS = [20]           // all sections get 20 sentences
SECTION_TARGET_DURATIONS = [2, 5, 8]     // seconds: section 1→2s, section 2→5s, section 3+→8s

getSectionSentenceCount(index: number): number
getSectionTargetDuration(index: number): number
getWordsPerScene(targetDuration: number): number  // Math.round((150/60) * targetDuration)
```

### video.ts
```
VIDEO_GENERATION_API_URL = process.env.NEXT_PUBLIC_VIDEO_GENERATION_API_URL || 'https://video-generation-service-production-a91d.up.railway.app'
POLL_INTERVAL_MS = 3000
TERMINAL_STATES = new Set(['completed', 'failed'])
```

### development.ts
```
IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
SCENE_DURATION_SECONDS = 7   // legacy fixed duration
```

---

## Prompts (`prompts/`)

All re-exported through `prompts/index.ts` — always import from `@/lib/prompts`.

### war-room.ts — Script Generation Pipeline
| Export | Type | Purpose |
|--------|------|---------|
| `SYSTEM_PROMPT` | string | War Room system prompt (includes CONTENT_SAFETY_SYSTEM_DIRECTIVE) |
| `WAR_ROOM_STYLE` | object | `{ prohibited_words[], mandatory_terminology[], style_rules[] }` |
| `WORD_COUNT_TARGETS` | Record | `short: {total:1500,perBatch:300}`, `medium: {total:3000,perBatch:600}`, `long: {total:5250,perBatch:1050}` |
| `TACTICAL_RESEARCH_PROMPT(title)` | fn→string | Research extraction prompt for Perplexity |
| `HOOK_PROMPT(research: TacticalResearch)` | fn→string | Battle Cold Open hook (~150 words) |
| `MASTER_OUTLINE_PROMPT(research, hook, targetDuration?)` | fn→string | 5-point Gamified War Arc outline |
| `MASTER_OUTLINE_PROMPT_LEGACY` | fn | Alias for MASTER_OUTLINE_PROMPT |
| `getBatchAssignment(batchNumber, outline)` | fn→string | Maps batch 1-5 to outline sections |
| `getBatchPhase(batchNumber)` | fn→object | `{ phase, name, goal, narrativeMode }` |
| `RECURSIVE_BATCH_PROMPT(batch, outline, research, prevPayload, prevChunks)` | fn→string | Batch script generation (~800 words/batch) |
| `SCRIPT_AUDIT_PROMPT(script)` | fn→string | Redundancy/style audit |
| `SCRIPT_POLISH_PROMPT(original, audit, targetDuration)` | fn→string | Rewrite with audit fixes |

### scene-generation.ts
| Export | Type | Purpose |
|--------|------|---------|
| `SCENE_SECTION_PROMPT(sectionText, sectionIndex, totalSections, startSceneNumber, targetDuration, wordsPerScene)` | fn→string | Visual Director scene breakdown for one section |

### character.ts
| Export | Type | Purpose |
|--------|------|---------|
| `CHARACTER_IDENTIFICATION_PROMPT(script, era)` | fn→string | Extract named historical figures from script |
| `CHARACTER_PORTRAIT_STYLE_SUFFIX` | string | Portrait style: classical oil painting, Rembrandt lighting, 8k |
| `NEGATIVE_PROMPT_PORTRAIT` | string | Excludes cartoon, anime, modern, blur, gore |

### style.ts
| Export | Type | Purpose |
|--------|------|---------|
| `generateStyleSuffix(artStyle?)` | fn→string | Scene image style suffix (8k, unreal engine 5) |
| `OIL_PAINTING_STYLE_SUFFIX` | string | Legacy alias via generateStyleSuffix() |
| `NEGATIVE_PROMPT_HISTORICAL` | string | Extensive negative prompt for scene images |
| `GENERATE_ART_STYLE_PROMPT(era, title)` | fn→string | Art History Specialist — 150-250 word style paragraph |
| `HISTORICAL_MAP_STYLE_SUFFIX` | string | 18th-century cartography style for map scenes |
| `NEGATIVE_PROMPT_MAPS` | string | Excludes satellite imagery, modern maps, neon |

### content-safety.ts
| Export | Type | Purpose |
|--------|------|---------|
| `CONTENT_SAFETY_SYSTEM_DIRECTIVE` | string | System-level "Sanitized Analyst" directive |
| `CONTENT_SAFETY_FILTER` | string | Section-level rejection rules (smell, decay, gore) |
| `CONTENT_SAFETY_VISUAL` | string | Visual-specific filter, requires distant wide shots for battles |
| `CONTENT_SAFETY_TRANSLATION_GUIDE` | string | Mapping table: sensory language → mechanical language |

### repurpose-prompts.ts
| Export | Type | Purpose |
|--------|------|---------|
| `SCRIPT_ANALYSIS_SYSTEM` | string | YouTube retention analyst system prompt |
| `SCRIPT_ANALYSIS_PROMPT(extraction: YouTubeExtraction)` | fn→string | Analyze hook, retention, structure |
| `SCRIPT_REWRITE_SYSTEM` | string | Master scriptwriter system (includes content safety) |
| `SCRIPT_REWRITE_PROMPT(extraction, analysis)` | fn→string | Full rewrite with War Room style |
| `TITLE_GENERATION_SYSTEM` | string | YouTube title expert system prompt |
| `TITLE_GENERATION_PROMPT(script)` | fn→string | Generate 3 titles (50-70 chars) |

---

## Types (`types/index.ts`)

Single barrel file. Key types by domain:

### Input
- `HistoricalEra`: `'Roman Republic' | 'Roman Empire' | 'Medieval' | 'Napoleonic' | 'Prussian' | 'Other'`
- `NarrativeTone`: `'Epic' | 'Documentary' | 'Tragic' | 'Educational'`
- `ScriptDuration`: `'short' | 'medium' | 'long'`
- `CinematicShotType`: `'Establishing Wide' | 'Medium Action' | 'Close-Up' | 'Extreme Close-Up' | 'High Angle' | 'Low Angle' | 'POV'`

### Research
- `TacticalResearch` — `{ topic, era, factions: FactionData[], terrain_analysis: TerrainData, casualty_data: CasualtyData, timeline: TacticalTimelineEvent[], primary_sources[], generated_at }`
- `FactionData` — `{ name, commander, unit_composition: UnitData[], total_strength, buffs[], debuffs[] }`
- `HistoricalResearch` — legacy type with `{ timeline, key_figures, sensory_details, primary_sources, dramatic_arcs }`

### Script
- `RecursiveScript` — `{ hook, master_outline: GamifiedWarOutline, batches: ScriptBatch[], full_script, total_word_count, polished_content?, audit_report? }`
- `GamifiedWarOutline` — `{ the_matchup, the_unit_deep_dive, the_tactical_turn, the_kill_screen, the_aftermath }` (each `GamifiedWarSection`)
- `ScriptBatch` — `{ batch_number(1-7), script_chunk, word_count, next_prompt_payload: RecursivePromptPayload }`
- `Script` — legacy type with `{ content, word_count, polished_content? }`

### Scene
- `Scene` — `{ scene_number, scene_type?: 'visual'|'map', shot_type?, script_snippet, visual_prompt, historical_context?, map_data?, suggested_duration?, character_ids?[] }`
- `StoryboardScene extends Scene` — adds `{ image_url?, generation_status: 'pending'|'generating'|'completed'|'error', error_message?, is_regenerating? }`

### Character
- `CharacterWithReference` — `{ id(UUID), name, role, description, visual_description, historical_period_appearance, reference_image_url?, reference_generation_status, is_approved, prominence: 'primary'|'secondary' }`
- `CharacterApprovalSession` — `{ characters[], status: 'idle'|'identifying'|'awaiting_approval'|'generating_references'|'review_portraits'|'complete'|'error' }`

### Video
- `VideoGenerationStatus` — `{ job_id, status: 'queued'|'processing'|'rendering'|'completed'|'failed', progress?, video_url?, error? }`

### YouTube Repurpose
- `YouTubeExtraction` — `{ transcript: { text, wordCount } }`
- `ScriptAnalysis` — `{ hookQuality, retentionTactics, structureAnalysis, overallScore, keyStrengths[], criticalImprovements[] }`
- `RepurposeSession` — `{ youtubeUrl, extraction?, analysis?, rewrittenScript?, status: RepurposeStatus }`

### Workflow
- `WorkflowStep`: `1 | 2 | 3 | 4`
- `RecursiveGenerationProgress` — `{ phase: 'research'|'hook'|'outline'|'batch'|'complete'|'error', current_batch, total_batches(5), current_word_count, target_word_count }`

---

## Hooks (`hooks/`)

### use-scripting-workflow.ts
```
useScriptingWorkflow() → {
  // Form
  title, setTitle, targetDuration, setTargetDuration,
  // State
  status: 'idle'|'generating'|'completed'|'error',
  steps: Step[], researchData, scriptData, artStyle,
  // UI
  copied, showOutline, setShowOutline, completedBatches, estimatedDuration,
  // Actions
  handleGenerate(), handleCopy(), handleProceedToScenes(), handleReset()
}
```
Pipeline: research/historical → final-script (hook→outline→5 batches) → analyze-repetition → polish-script.

### use-character-approval.ts
```
useCharacterApproval(script, era, onComplete) → {
  characterSession, editingCharacter, setEditingCharacter,
  identifyCharacters(), handleToggleApproval(id), handleEditSave(id, updates),
  generatePortraits(), regeneratePortrait(character), handleContinueToScenes()
}
```
Pipeline: identify/characters → user approval → generate/character-reference per character.

### use-storyboard-pipeline.ts
```
useStoryboardPipeline() → {
  storyboardScenes, sceneGenerationProgress, completedScenes, errorScenes,
  allScenesCompleted, isAnalyzing, isGenerating, showPlaceholders,
  regenerateFailedScenes()
}
```
Pipeline: analyze/script (SSE stream) → generate/scene-image per scene.

### use-repurpose-workflow.ts
```
useRepurposeWorkflow(stepIcons) → {
  youtubeUrl, setYoutubeUrl,
  status, steps, extraction, analysis, rewrittenScript, titles,
  copied, copiedTitle, showAnalysis, setShowAnalysis, showOriginal, setShowOriginal,
  handleGenerate(), handleCopy(), handleReset(), handleCopyTitle(title, index)
}
```
Pipeline: repurpose/extract → repurpose/analyze → repurpose/rewrite → repurpose/titles.

### use-video-generation.ts
```
useVideoGeneration() → {
  jobId, status, isPolling, isSubmitting, error,
  submitJob(audio, originalScript, sceneData), reset()
}
```
Pipeline: video/generate → polls video/status/[jobId] every 3s.

---

## Store (`store.ts`)

Single flat Zustand store: `useSessionStore`.

**State fields:** `currentStep(1)`, `historicalTopic(null)`, `research(null)`, `outline(null)`, `script(null)`, `scenes([])`, `storyboardScenes([])`, `tacticalResearch(null)`, `recursiveScript(null)`, `recursiveProgress(null)`, `repurposeSession(null)`, `characterSession(null)`, `isGenerating(false)`, `errors([])`, `sceneGenerationProgress(0)`.

**Actions:** `setHistoricalTopic`, `setResearch`, `setOutline`, `setScript`, `setScenes`, `setStoryboardScenes`, `updateStoryboardScene(sceneNumber, updates)`, `setStep`, `setGenerating`, `setSceneGenerationProgress`, `addError`, `clearErrors`, `reset`, `setTacticalResearch`, `setRecursiveScript`, `setRecursiveProgress`, `setRepurposeSession`, `updateRepurposeSession`, `setCharacterSession`, `updateCharacter(id, updates)`.

---

## Utils (`utils/`)

| File | Export | Signature |
|------|--------|-----------|
| `cn.ts` | `cn` | `(...inputs: ClassValue[]): string` — Tailwind class merge (clsx + twMerge) |
| `word-count.ts` | `countWords` | `(text: string): number` |
| `sanitize-script.ts` | `sanitizeEmDashes` | `(text: string): string` — em dash→space+hyphen, en dash→hyphen |
| `scene-timing.ts` | `formatTime` | `(seconds: number): string` — returns MM:SS or HH:MM:SS |
| `script-splitter.ts` | `splitTextBySentenceIntegrity` | `(longText, sectionSizes: number[]): SplitResult` — NLP sentence splitting (compromise lib) |
| `export.ts` | `createExportZip` | `(data: ExportData): Promise<void>` — packages project to ZIP download |
