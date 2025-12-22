// Development mode flag
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

// Legacy fixed scene duration (kept for backward compatibility)
export const SCENE_DURATION_SECONDS = 7;

// Variable scene timing configuration
export interface SceneTimingSegment {
  name: 'hook' | 'setup' | 'core_content' | 'deep_dive' | 'long_tail';
  startSeconds: number;
  endSeconds: number | null; // null = extends to video end
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  purpose: string;
}

export const SCENE_TIMING_SEGMENTS: SceneTimingSegment[] = [
  {
    name: 'hook',
    startSeconds: 0,
    endSeconds: 30,
    minDuration: 1.5,
    maxDuration: 2.5,
    avgDuration: 2.0,
    purpose: 'Rapid cuts to grab attention',
  },
  {
    name: 'setup',
    startSeconds: 30,
    endSeconds: 120,
    minDuration: 3.0,
    maxDuration: 5.0,
    avgDuration: 4.0,
    purpose: 'Establish context and stakes',
  },
  {
    name: 'core_content',
    startSeconds: 120,
    endSeconds: 600,
    minDuration: 6.0,
    maxDuration: 10.0,
    avgDuration: 8.0,
    purpose: 'Main narrative with balanced pacing',
  },
  {
    name: 'deep_dive',
    startSeconds: 600,
    endSeconds: 1200,
    minDuration: 12.0,
    maxDuration: 18.0,
    avgDuration: 15.0,
    purpose: 'Extended analysis and detail',
  },
  {
    name: 'long_tail',
    startSeconds: 1200,
    endSeconds: null,
    minDuration: 20.0,
    maxDuration: 30.0,
    avgDuration: 25.0,
    purpose: 'Slow, contemplative conclusion',
  },
];
