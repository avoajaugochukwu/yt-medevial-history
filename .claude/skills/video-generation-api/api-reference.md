# Video Generation API — Detailed Reference

## TypeScript Interfaces

### API scene data item (what the Railway service expects)

```typescript
interface ApiSceneItem {
  scene_number: number;
  script_snippet: string;
  image_url: string;
}
```

### Video generation status response

```typescript
interface VideoGenerationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;       // 0-100
  output_url?: string;     // present when completed
  error?: string;          // present when failed
  [key: string]: unknown;  // API may include additional fields
}
```

### Source types in this project

```typescript
// Base scene (lib/types/index.ts)
interface Scene {
  scene_number: number;
  script_snippet: string;
  visual_prompt: string;
  characters?: string[];
}

// Extended with image generation state (lib/types/index.ts)
interface StoryboardScene extends Scene {
  image_url?: string;
  generation_status: 'pending' | 'generating' | 'completed' | 'error';
  error_message?: string;
  is_regenerating?: boolean;
}
```

## StoryboardScene to API Shape Transformation

The exact code used in `app/video-generation/page.tsx` (lines 25-31):

```typescript
// From the Zustand store
const { storyboardScenes, script } = useSessionStore();

// Build the original_script string
const originalScript = script?.polished_content || script?.content || '';

// Transform StoryboardScene[] → ApiSceneItem[] → JSON string
// Strips: visual_prompt, generation_status, error_message, is_regenerating, characters
const sceneData = JSON.stringify(
  storyboardScenes.map((s) => ({
    scene_number: s.scene_number,
    script_snippet: s.script_snippet,
    image_url: s.image_url,
  }))
);
```

## Proxy Route Architecture

```
Client (browser)
  │
  ├─ POST /api/video/generate        (Next.js route handler)
  │      │
  │      └─ POST Railway /generate    (forwards FormData as-is)
  │
  └─ GET  /api/video/status/{job_id}  (Next.js route handler)
         │
         └─ GET  Railway /status/{job_id}
```

The proxy routes in `app/api/video/` exist so the client never needs to know the Railway URL. The generate proxy validates that all 4 required fields are present before forwarding. The status proxy simply passes through the job_id parameter.

## curl Examples

### Submit a job directly to Railway

```bash
curl -X POST \
  https://video-generation-service-production-a91d.up.railway.app/generate \
  -F "audio=@narration.mp3" \
  -F "srt=@subtitles.srt" \
  -F "original_script=This is the full narration text..." \
  -F 'scene_data=[{"scene_number":1,"script_snippet":"Opening line...","image_url":"https://example.com/scene1.png"},{"scene_number":2,"script_snippet":"Next part...","image_url":"https://example.com/scene2.png"}]'
```

### Submit via the Next.js proxy (local dev)

```bash
curl -X POST \
  http://localhost:3000/api/video/generate \
  -F "audio=@narration.mp3" \
  -F "srt=@subtitles.srt" \
  -F "original_script=This is the full narration text..." \
  -F 'scene_data=[{"scene_number":1,"script_snippet":"Opening line...","image_url":"https://example.com/scene1.png"}]'
```

### Poll job status

```bash
# Via Railway directly
curl https://video-generation-service-production-a91d.up.railway.app/status/JOB_ID_HERE

# Via Next.js proxy
curl http://localhost:3000/api/video/status/JOB_ID_HERE
```

### Expected responses

**Submit success:**
```json
{ "job_id": "abc-123-def" }
```

**Status — in progress:**
```json
{ "status": "processing", "progress": 45 }
```

**Status — completed:**
```json
{ "status": "completed", "progress": 100, "output_url": "https://storage.example.com/video.mp4" }
```

**Status — failed:**
```json
{ "status": "failed", "error": "Scene 3 image URL returned 404" }
```

## Error Handling Patterns

### Client-side (from use-video-generation.ts)

The `useVideoGeneration` hook handles errors at two levels:

1. **Submission errors** — If the fetch to `/api/video/generate` fails or returns non-OK:
   ```typescript
   if (!response.ok) {
     const data = await response.json();
     throw new Error(data.error || 'Failed to submit video generation job');
   }
   ```

2. **Polling errors** — If any status poll fails, polling stops and the error is surfaced:
   ```typescript
   // In the poll function
   if (!response.ok) {
     const data = await response.json();
     throw new Error(data.error || 'Failed to fetch status');
   }
   // On terminal failure status, polling also stops naturally
   if (TERMINAL_STATES.has(data.status)) {
     stopPolling();
   }
   ```

### Server-side (proxy routes)

- **Missing fields:** Returns `400` with `{ error: 'Missing required fields: audio, srt, original_script, scene_data' }`
- **Railway unreachable / errors:** Returns `500` with `{ error: 'Failed to start video generation' }` or `{ error: 'Failed to fetch video generation status' }`
- **Railway non-OK response:** The proxy forwards the Railway response status and body as-is

### Recommended error handling for new integrations

```typescript
try {
  const jobId = await submitJob(audioFile, srtFile, originalScript, sceneData);
  if (!jobId) {
    // Submission failed — check the `error` state from the hook
  }
  // Polling starts automatically; watch `status` and `error` reactively
} catch (err) {
  // Unexpected error
}
```

## Frontend Component Patterns

### useVideoGeneration Hook Return Type

```typescript
interface UseVideoGenerationReturn {
  jobId: string | null;
  // The job ID returned from /api/video/generate. null before first submission.

  status: VideoGenerationStatus | null;
  // Latest polled status. null before first poll response.
  // Contains: status, progress?, output_url?, error?

  submitJob: (
    audio: File,
    srt: File,
    originalScript: string,
    sceneData: string
  ) => Promise<string | null>;
  // Submits the job and starts polling automatically.
  // Returns the job ID on success, null on failure (error state is set).

  isPolling: boolean;
  // true while the hook is actively polling /api/video/status/{job_id}.

  error: string | null;
  // Error message from submission failure or polling failure.

  stopPolling: () => void;
  // Clears the polling interval and sets isPolling to false.
  // Call this before resetting UI state for retry.
}
```

### UI Phase Derivation

The upload page derives three mutually exclusive display phases from hook state:

```typescript
const isTerminal = status?.status === 'completed' || status?.status === 'failed';

const showUpload  = !jobId && !isPolling;   // No active job — show file inputs
const showPolling = isPolling;               // Job submitted — show spinner/progress
const showResult  = jobId && isTerminal;     // Job done — show success or error
```

Use these flags to conditionally render the appropriate section:

```tsx
{showUpload  && <UploadForm />}
{showPolling && <PollingSpinner status={status} jobId={jobId} />}
{showResult  && status?.status === 'completed' && <SuccessCard url={status.output_url} />}
{showResult  && status?.status === 'failed'    && <ErrorCard error={status.error} />}
```

### Minimal Wiring Example

```tsx
"use client";

import { useState } from 'react';
import { useSessionStore } from '@/lib/store';
import { useVideoGeneration } from '@/lib/hooks/use-video-generation';

export default function VideoUploader() {
  const { storyboardScenes, script } = useSessionStore();
  const { jobId, status, submitJob, isPolling, error, stopPolling } = useVideoGeneration();

  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const originalScript = script?.polished_content || script?.content || '';
  const sceneData = JSON.stringify(
    storyboardScenes.map((s) => ({
      scene_number: s.scene_number,
      script_snippet: s.script_snippet,
      image_url: s.image_url,
    }))
  );

  const handleSubmit = async () => {
    if (!srtFile || !audioFile) return;
    await submitJob(audioFile, srtFile, originalScript, sceneData);
  };

  const handleReset = () => {
    stopPolling();
    setSrtFile(null);
    setAudioFile(null);
  };

  // Derive UI phase
  const isTerminal = status?.status === 'completed' || status?.status === 'failed';
  const showUpload  = !jobId && !isPolling;
  const showPolling = isPolling;
  const showResult  = jobId && isTerminal;

  return (
    <div>
      {showUpload && (
        <div>
          <input type="file" accept=".srt" onChange={(e) => setSrtFile(e.target.files?.[0] ?? null)} />
          <input type="file" accept=".mp3,.wav,.m4a,.aac" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} />
          <button onClick={handleSubmit} disabled={!srtFile || !audioFile}>Generate</button>
        </div>
      )}
      {showPolling && <p>Generating... {status?.progress ?? 0}%</p>}
      {showResult && status?.status === 'completed' && (
        <div>
          <p>Done!</p>
          <a href={status.output_url as string}>Download</a>
          <button onClick={handleReset}>Reset</button>
        </div>
      )}
      {showResult && status?.status === 'failed' && (
        <div>
          <p>Error: {status.error || error}</p>
          <button onClick={handleReset}>Retry</button>
        </div>
      )}
    </div>
  );
}
```
