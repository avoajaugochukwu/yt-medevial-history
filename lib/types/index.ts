// ============================================================================
// HISTORIA ENGINE - HISTORICAL NARRATIVE TYPES
// ============================================================================

// Historical Input
export type HistoricalEra =
  | 'Roman Republic'
  | 'Roman Empire'
  | 'Medieval'
  | 'Napoleonic'
  | 'Prussian'
  | 'Other';

export type ContentType =
  | 'Biography'
  | 'Battle'
  | 'Culture'
  | 'Mythology';

export type NarrativeTone =
  | 'Epic'
  | 'Documentary'
  | 'Tragic'
  | 'Educational';

export interface HistoricalTopic {
  title: string;
  era: HistoricalEra;
  contentType: ContentType;
  tone: NarrativeTone;
  created_at: Date;
  artStyle?: string; // AI-generated era-appropriate painting style
}

// Historical Research Output (Prompt 1)
export interface TimelineEvent {
  date: string;
  event: string;
  significance: string;
}

export interface HistoricalFigure {
  name: string;
  role: string;
  description: string;
  notable_actions?: string[];
}

export interface SensoryDetails {
  setting: string;
  weather: string;
  sounds: string;
  visuals: string;
  textures: string;
}

export interface HistoricalResearch {
  topic: string;
  era: HistoricalEra;
  timeline: TimelineEvent[];
  key_figures: HistoricalFigure[];
  sensory_details: SensoryDetails;
  primary_sources: string[];
  dramatic_arcs: string[];
  cultural_context: string;
  raw_research_data: string;
  generated_at: Date;
}

// Narrative Outline (Prompt 2)
export interface NarrativeAct {
  act_name: 'Setup' | 'Conflict' | 'Resolution';
  scenes: string[];
  goal: string;
  emotional_arc?: string;
  key_moments?: string[];
}

export interface NarrativeOutline {
  act1_setup: NarrativeAct;
  act2_conflict: NarrativeAct;
  act3_resolution: NarrativeAct;
  narrative_theme: string;
  dramatic_question: string;
  generated_at: Date;
}

// Final Script (Prompt 3)
export interface Script {
  content: string;
  word_count: number;
  topic: string;
  tone: NarrativeTone;
  era: HistoricalEra;
  target_duration: number; // Target video duration in minutes
  generated_at: Date;
  version?: number;
  polished_content?: string;
  polished_word_count?: number;
  improvement_history?: {
    version: number;
    content: string;
    improvements_applied: string[];
    timestamp: Date;
  }[];
}

// Scene Breakdown (Prompt 4)
export interface MapData {
  location: string;
  time_period: string;
  geographic_focus: string;
  territories: string[];
}

export interface Scene {
  scene_number: number;
  scene_type?: 'visual' | 'map';
  script_snippet: string;
  visual_prompt: string;
  historical_context?: string;
  map_data?: MapData;
}

export interface StoryboardScene extends Scene {
  image_url?: string;
  generation_status: 'pending' | 'generating' | 'completed' | 'error';
  error_message?: string;
  is_regenerating?: boolean;
}

// Workflow Management
export type WorkflowStep = 1 | 2 | 3 | 4;

export interface SessionStore {
  // Current workflow step (1-4: Input → Research → Script → Scenes)
  currentStep: WorkflowStep;

  // User input
  historicalTopic: HistoricalTopic | null;

  // Generated content (in-memory, session only)
  research: HistoricalResearch | null;
  outline: NarrativeOutline | null;
  script: Script | null;
  scenes: Scene[];
  storyboardScenes: StoryboardScene[];

  // Workflow state
  isGenerating: boolean;
  errors: string[];
  sceneGenerationProgress: number;

  // Actions
  setHistoricalTopic: (topic: HistoricalTopic) => void;
  setResearch: (research: HistoricalResearch) => void;
  setOutline: (outline: NarrativeOutline) => void;
  setScript: (script: Script) => void;
  setScenes: (scenes: Scene[]) => void;
  setStoryboardScenes: (scenes: StoryboardScene[]) => void;
  updateStoryboardScene: (sceneNumber: number, updates: Partial<StoryboardScene>) => void;
  setStep: (step: WorkflowStep) => void;
  setGenerating: (isGenerating: boolean) => void;
  setSceneGenerationProgress: (progress: number) => void;
  addError: (error: string) => void;
  clearErrors: () => void;
  reset: () => void;
}
