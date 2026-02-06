import { SCENE_TIMING_SEGMENTS, SceneTimingSegment } from '@/lib/config/development';

export interface SegmentSceneAllocation {
  segment: SceneTimingSegment;
  segmentDuration: number;
  sceneCount: number;
  cumulativeStartTime: number;
  cumulativeEndTime: number;
}

export interface SceneTimingPlan {
  totalDuration: number;
  segments: SegmentSceneAllocation[];
  totalScenes: number;
  promptGuidance: string;
}

/**
 * Calculate scene distribution for a video of given duration.
 * Handles videos of any length by clipping segments that exceed video duration.
 */
export function calculateSceneTimingPlan(durationSeconds: number): SceneTimingPlan {
  const segments: SegmentSceneAllocation[] = [];
  let totalScenes = 0;

  for (const segment of SCENE_TIMING_SEGMENTS) {
    // Skip segments that start after video ends
    if (segment.startSeconds >= durationSeconds) {
      continue;
    }

    // Calculate actual segment end (clipped to video duration)
    const segmentEnd = segment.endSeconds
      ? Math.min(segment.endSeconds, durationSeconds)
      : durationSeconds;

    // Calculate segment duration
    const segmentDuration = segmentEnd - segment.startSeconds;

    // Skip if segment has no duration
    if (segmentDuration <= 0) {
      continue;
    }

    // Calculate scene count using average duration
    const sceneCount = Math.max(1, Math.round(segmentDuration / segment.avgDuration));

    segments.push({
      segment,
      segmentDuration,
      sceneCount,
      cumulativeStartTime: segment.startSeconds,
      cumulativeEndTime: segmentEnd,
    });
    totalScenes += sceneCount;
  }

  const promptGuidance = generatePromptGuidance(segments, durationSeconds);

  return {
    totalDuration: durationSeconds,
    segments,
    totalScenes,
    promptGuidance,
  };
}

/**
 * Generate formatted guidance text for GPT prompt.
 */
function generatePromptGuidance(
  segments: SegmentSceneAllocation[],
  totalDuration: number
): string {
  const lines: string[] = [
    `## VARIABLE SCENE PACING REQUIREMENTS`,
    ``,
    `**Total video duration:** ${formatTime(totalDuration)} (${totalDuration} seconds)`,
    ``,
    `**CRITICAL: Distribute scenes according to this timing breakdown:**`,
    ``,
  ];

  for (const allocation of segments) {
    const { segment, segmentDuration, sceneCount, cumulativeStartTime, cumulativeEndTime } = allocation;
    lines.push(
      `### ${segment.name.toUpperCase()} (${formatTime(cumulativeStartTime)} - ${formatTime(cumulativeEndTime)})`
    );
    lines.push(`- **Purpose:** ${segment.purpose}`);
    lines.push(`- **Target scene count:** ${sceneCount} scenes`);
    lines.push(`- **Scene duration range:** ${segment.minDuration} - ${segment.maxDuration} seconds`);
    lines.push(`- **Segment duration:** ${Math.round(segmentDuration)} seconds`);
    lines.push(``);
  }

  lines.push(`**MANDATORY FIELDS FOR EACH SCENE:**`);
  lines.push(`- "segment": One of ${segments.map(s => `"${s.segment.name}"`).join(', ')}`);
  lines.push(`- "suggested_duration": Number between min and max for that segment`);
  lines.push(``);
  lines.push(`**PACING RULES:**`);
  lines.push(`- HOOK scenes: Maximum 1-2 sentences per script_snippet. High energy, action-focused.`);
  lines.push(`- SETUP scenes: 2-4 sentences. Establish geography and key figures.`);
  lines.push(`- CORE_CONTENT scenes: 3-5 sentences. Main narrative beats.`);
  lines.push(`- DEEP_DIVE scenes: 5-8 sentences. Detailed analysis.`);
  lines.push(`- LONG_TAIL scenes: 6-10 sentences. Reflective, legacy-focused.`);

  return lines.join('\n');
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get the segment for a given timestamp
 */
export function getSegmentForTimestamp(
  timestampSeconds: number,
  durationSeconds: number
): SceneTimingSegment | null {
  for (const segment of SCENE_TIMING_SEGMENTS) {
    if (segment.startSeconds > durationSeconds) continue;

    const segmentEnd = segment.endSeconds
      ? Math.min(segment.endSeconds, durationSeconds)
      : durationSeconds;

    if (timestampSeconds >= segment.startSeconds && timestampSeconds < segmentEnd) {
      return segment;
    }
  }
  return null;
}

/**
 * Get suggested duration for a specific segment name
 */
export function getSuggestedSceneDuration(segmentName: string): number {
  const segment = SCENE_TIMING_SEGMENTS.find(s => s.name === segmentName);
  return segment?.avgDuration ?? 7;
}

export interface SegmentChunk {
  chunkIndex: number;
  segments: SegmentSceneAllocation[];
  totalScenes: number;
  startSceneNumber: number;
  endSceneNumber: number;
}

/**
 * Group timing segments into chunks that each stay under a max scene count.
 * This prevents GPT-4o from exceeding its output token limit on long scripts.
 */
export function chunkSegmentsBySceneCount(
  timingPlan: SceneTimingPlan,
  maxScenesPerChunk: number = 50
): SegmentChunk[] {
  const chunks: SegmentChunk[] = [];
  let currentSegments: SegmentSceneAllocation[] = [];
  let currentSceneCount = 0;
  let globalSceneNumber = 1;

  for (const segment of timingPlan.segments) {
    if (currentSceneCount + segment.sceneCount > maxScenesPerChunk && currentSegments.length > 0) {
      chunks.push({
        chunkIndex: chunks.length,
        segments: currentSegments,
        totalScenes: currentSceneCount,
        startSceneNumber: globalSceneNumber,
        endSceneNumber: globalSceneNumber + currentSceneCount - 1,
      });
      globalSceneNumber += currentSceneCount;
      currentSegments = [];
      currentSceneCount = 0;
    }
    currentSegments.push(segment);
    currentSceneCount += segment.sceneCount;
  }

  if (currentSegments.length > 0) {
    chunks.push({
      chunkIndex: chunks.length,
      segments: currentSegments,
      totalScenes: currentSceneCount,
      startSceneNumber: globalSceneNumber,
      endSceneNumber: globalSceneNumber + currentSceneCount - 1,
    });
  }

  return chunks;
}
