---
name: video-generation-api
description: Guide for preparing scene data and using the video generation API. Use when building video generation features, preparing scene data for the API, or integrating with the video generation service.
---

# Video Generation API

## 1. API Contract

**Base URL:** `https://video-generation-service-production-a91d.up.railway.app` (defined in `lib/config/video.ts`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/generate` | POST | Submit a video generation job |
| `/status/{job_id}` | GET | Poll job status |

The Next.js app proxies these through local API routes (`/api/video/generate` and `/api/video/status/[job_id]`) so the client never calls Railway directly.

## 2. Building Scene Data

The API expects `scene_data` as a **JSON string** of an array. Each item must have this exact shape:

```json
{ "scene_number": number, "script_snippet": "string", "image_url": "string" }
```

No other fields are accepted. Apps will typically have richer internal types that must be stripped down.

### Transformation pattern

Given any source array of scene objects, map to the required shape and stringify:

```typescript
const sceneData = JSON.stringify(
  scenes.map((s) => ({
    scene_number: s.scene_number,
    script_snippet: s.script_snippet,
    image_url: s.image_url,
  }))
);
```

### Example: this project's StoryboardScene

`StoryboardScene` (defined in `lib/types/index.ts`) extends `Scene` and includes extra fields: `visual_prompt`, `generation_status`, `error_message`, `is_regenerating`, `characters`. All of these must be stripped. The transformation in `app/video-generation/page.tsx` (lines 25-31) does exactly this:

```typescript
const sceneData = JSON.stringify(
  storyboardScenes.map((s) => ({
    scene_number: s.scene_number,
    script_snippet: s.script_snippet,
    image_url: s.image_url,
  }))
);
```

### original_script

The `original_script` field is plain text of the full narration script. In this app it comes from:

```typescript
const originalScript = script?.polished_content || script?.content || '';
```

## 3. Request Format

**Content type:** `multipart/form-data` (use `FormData`)

| Field | Type | Description |
|-------|------|-------------|
| `audio` | File | Audio narration file (mp3, wav, m4a, aac) |
| `original_script` | string | Plain text of the full narration script |
| `scene_data` | string | JSON string of the scene array (see Section 2) |

All three fields are **required**. The proxy route validates this and returns a 400 if any are missing.

```typescript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('original_script', originalScript);
formData.append('scene_data', sceneData);

const response = await fetch('/api/video/generate', {
  method: 'POST',
  body: formData,
});
```

## 4. Response & Status Polling

### Submit response

```json
{ "job_id": "string" }
```

### Status response

```typescript
{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;       // 0-100
  output_url?: string;     // available when status is 'completed'
  error?: string;          // available when status is 'failed'
}
```

### Polling behavior

- **Terminal states:** `completed`, `failed` — stop polling when either is reached
- **Recommended poll interval:** 3 seconds (`POLL_INTERVAL_MS` in `use-video-generation.ts`)
- Poll immediately on submission, then every 3 seconds

```typescript
const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATES = new Set(['completed', 'failed']);
```

## 5. Key Codebase Files

| File | Purpose |
|------|---------|
| `lib/config/video.ts` | API URL constant (`VIDEO_GENERATION_API_URL`) |
| `app/api/video/generate/route.ts` | Proxy route: validates FormData, forwards to Railway |
| `app/api/video/status/[job_id]/route.ts` | Status proxy route: forwards GET to Railway |
| `lib/hooks/use-video-generation.ts` | Client hook: `submitJob()` + automatic polling |
| `lib/types/index.ts` | TypeScript types (`StoryboardScene`, `Scene`, etc.) |
| `app/video-generation/page.tsx` | UI page with scene data transformation example |

## 6. Frontend Upload Workflow

### Prerequisites

The upload UI is only shown when both conditions are met:

```typescript
const hasRequiredData =
  storyboardScenes.length > 0 &&
  !!(script?.content || script?.polished_content);
```

If prerequisites are not met, the page displays a warning card directing users to complete the Scripting and Scenes steps first.

### UI Phases

The page has three mutually exclusive phases, derived from hook state:

```typescript
const isTerminal = status?.status === 'completed' || status?.status === 'failed';
const showUpload  = !jobId && !isPolling;   // no active job
const showPolling = isPolling;               // job submitted, waiting
const showResult  = jobId && isTerminal;     // job finished (success or failure)
```

**Upload** — User selects an audio file, then clicks "Generate Video".
**Polling** — Spinner with progress bar. Displays job ID and percentage.
**Result** — Success card with download link, or error card with message. Both offer a reset button.

### useVideoGeneration Hook

Import: `import { useVideoGeneration } from '@/lib/hooks/use-video-generation';`

```typescript
const { jobId, status, submitJob, isPolling, error, stopPolling } = useVideoGeneration();
```

| Field | Type | Description |
|-------|------|-------------|
| `jobId` | `string \| null` | The job ID returned after submission, `null` before first submit |
| `status` | `VideoGenerationStatus \| null` | Latest polled status object (`status`, `progress`, `output_url`, `error`) |
| `submitJob` | `(audio: File, originalScript: string, sceneData: string) => Promise<string \| null>` | Submit a job; returns the job ID or `null` on failure. Polling starts automatically. |
| `isPolling` | `boolean` | `true` while the hook is actively polling for status updates |
| `error` | `string \| null` | Error message from submission or polling failure |
| `stopPolling` | `() => void` | Stops the polling interval and sets `isPolling` to `false` |

### File Inputs

| Input | Accepted extensions | Drop support |
|-------|-------------------|--------------|
| Audio narration | `.mp3`, `.wav`, `.m4a`, `.aac` | Drag-and-drop validated by extension |

The input supports click-to-browse and drag-and-drop.

### Submit Flow

```typescript
const handleGenerate = async () => {
  if (!audioFile) return;
  await submitJob(audioFile, originalScript, sceneData);
};
```

`submitJob` builds the `FormData`, POSTs to `/api/video/generate`, stores the returned `jobId`, and starts polling automatically — no manual polling setup needed.

### Reset / Retry

To allow re-upload after completion or failure, call `stopPolling()` and clear file state:

```typescript
const handleReset = () => {
  stopPolling();
  setAudioFile(null);
};
