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

export type NarrativeTone =
  | 'Epic'
  | 'Documentary'
  | 'Tragic'
  | 'Educational';

export interface HistoricalTopic {
  title: string;
  era?: HistoricalEra; // AI-inferred from title during research
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

  // War Room recursive generation state
  tacticalResearch: TacticalResearch | null;
  recursiveScript: RecursiveScript | null;
  recursiveProgress: RecursiveGenerationProgress | null;

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

  // War Room actions
  setTacticalResearch: (research: TacticalResearch) => void;
  setRecursiveScript: (script: RecursiveScript) => void;
  setRecursiveProgress: (progress: RecursiveGenerationProgress) => void;
}

// ============================================================================
// WAR ROOM TACTICAL DOCUMENTARY TYPES
// ============================================================================

// Recursive script state machine payload
export interface RecursivePromptPayload {
  summary_of_previous: string; // What was covered in prior chunks
  current_momentum: string; // Pacing/energy state (e.g., "building tension", "peak action")
  next_objectives: string[]; // What the next batch must cover
  style_reminder: string; // Reinforce prohibited words, mandatory terms
}

// Single batch output from recursive generation
export interface ScriptBatch {
  batch_number: number; // 1-7
  script_chunk: string; // ~800 words of spoken content
  word_count: number;
  next_prompt_payload: RecursivePromptPayload;
  generated_at: Date;
}

// Tactical section for outline
export interface TacticalSection {
  title: string;
  key_points: string[];
  estimated_word_count: number; // Target ~500-700 words per section
}

// Master Tactical Outline (10 points)
export interface TacticalOutline {
  the_map_meta: TacticalSection; // Point 1: Terrain Analysis
  faction_a_build: TacticalSection; // Point 2: Equipment/Stats
  faction_b_build: TacticalSection; // Point 3: Counter-measures
  opening_skirmish: TacticalSection; // Point 4: The Probing
  the_critical_error: TacticalSection; // Point 5: The Spawn Trap
  the_unit_collision: TacticalSection; // Point 6: The Grind
  the_flanking_exploit: TacticalSection; // Point 7: The Finisher
  the_rout: TacticalSection; // Point 8: The Kill Screen
  aftermath_telemetry: TacticalSection; // Point 9: Total Casualties
  historical_patch_notes: TacticalSection; // Point 10: Long-term Impact
  generated_at: Date;
}

// Equipment data for unit analysis
export interface EquipmentData {
  primary_weapon: string;
  weapon_length?: string; // E.g., "18-foot sarissa"
  armor_type: string;
  armor_material: string; // E.g., "Bronze", "Iron", "Leather"
  shield?: string;
}

// Unit composition data
export interface UnitData {
  unit_type: string; // E.g., "Heavy Infantry", "Cavalry"
  count: number; // Exact number
  equipment: EquipmentData;
  formation: string; // E.g., "Phalanx", "Wedge"
  phalanx_depth?: number; // If applicable
}

// Faction data for tactical research
export interface FactionData {
  name: string;
  commander: string;
  unit_composition: UnitData[];
  total_strength: number; // Exact count, not "thousands"
  buffs: string[]; // E.g., "High ground advantage"
  debuffs: string[]; // E.g., "Mud reducing mobility"
}

// Terrain analysis data
export interface TerrainData {
  location: string;
  elevation: string; // E.g., "Valley floor, 200m below ridgeline"
  terrain_type: string; // E.g., "Open plain", "Forested hills"
  weather_conditions: string;
  tactical_advantages: string[];
  tactical_disadvantages: string[];
}

// Casualty data for aftermath telemetry
export interface CasualtyData {
  faction_a_casualties: number;
  faction_b_casualties: number;
  kill_ratio: string; // E.g., "12-to-1"
  total_deaths: number;
}

// Timeline event for tactical research
export interface TacticalTimelineEvent {
  phase: string; // E.g., "Opening", "Main Collision", "Rout"
  time_marker: string; // E.g., "Dawn", "Midday", "2 hours into battle"
  event: string;
  tactical_significance: string;
}

// Research telemetry from Perplexity (replaces HistoricalResearch)
export interface TacticalResearch {
  topic: string;
  era: HistoricalEra;

  // Raw telemetry data
  factions: FactionData[];
  terrain_analysis: TerrainData;
  casualty_data: CasualtyData;
  timeline: TacticalTimelineEvent[];

  // Sources
  primary_sources: string[];

  generated_at: Date;
}

// Aggregated recursive script result
export interface RecursiveScript {
  hook: string; // 60-second hook (~150 words)
  master_outline: TacticalOutline;
  batches: ScriptBatch[];
  full_script: string; // Concatenated final script
  total_word_count: number;
  topic: string;
  era: HistoricalEra;
  target_duration: number;
  generated_at: Date;
}

// Generation progress tracking
export interface RecursiveGenerationProgress {
  phase: 'research' | 'hook' | 'outline' | 'batch' | 'complete' | 'error';
  current_batch: number; // 0-7 (0 = not started, 7 = complete)
  total_batches: number; // Always 7
  current_word_count: number;
  target_word_count: number; // 5250-6000 for 35 min
  error?: string;
}

// Style constraints for validation
export interface WarRoomStyleConstraints {
  prohibited_words: string[];
  mandatory_terminology: string[];
  style_rules: string[];
}
