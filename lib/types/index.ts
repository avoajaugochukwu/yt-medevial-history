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

// Extended character with reference image support for visual consistency
export interface CharacterWithReference extends HistoricalFigure {
  id: string;                          // UUID
  reference_image_url?: string;        // Generated portrait URL
  reference_generation_status: 'pending' | 'generating' | 'completed' | 'error';
  visual_description: string;          // Detailed physical description for image gen
  historical_period_appearance: string; // Era-appropriate clothing/armor
  is_approved: boolean;
  prominence: 'primary' | 'secondary';
  error_message?: string;
}

// Character approval session state
export interface CharacterApprovalSession {
  characters: CharacterWithReference[];
  status: 'idle' | 'identifying' | 'awaiting_approval' | 'generating_references' | 'review_portraits' | 'complete' | 'error';
  error?: string;
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

// Cinematic shot types for Director Engine
export type CinematicShotType =
  | 'Establishing Wide'
  | 'Medium Action'
  | 'Close-Up'
  | 'Extreme Close-Up'
  | 'High Angle'
  | 'Low Angle'
  | 'POV';

export interface Scene {
  scene_number: number;
  scene_type?: 'visual' | 'map';
  shot_type?: CinematicShotType;
  script_snippet: string;
  visual_prompt: string;
  historical_context?: string;
  map_data?: MapData;
  // Variable timing
  suggested_duration?: number;
  // Character reference support
  character_ids?: string[];  // IDs of characters appearing in this scene
}

export interface StoryboardScene extends Scene {
  image_url?: string;
  generation_status: 'pending' | 'generating' | 'completed' | 'error';
  error_message?: string;
  is_regenerating?: boolean;
  // Generation artifacts
  prompt_used?: string;
  negative_prompt_used?: string;
  model_used?: string;
  style_category?: string;
  character_conditioned?: boolean;
  character_count?: number;
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

  // YouTube repurposing state
  repurposeSession: RepurposeSession | null;

  // Character reference state
  characterSession: CharacterApprovalSession | null;

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

  // Repurpose actions
  setRepurposeSession: (session: RepurposeSession | null) => void;
  updateRepurposeSession: (updates: Partial<RepurposeSession>) => void;

  // Character reference actions
  setCharacterSession: (session: CharacterApprovalSession | null) => void;
  updateCharacter: (id: string, updates: Partial<CharacterWithReference>) => void;
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

// Target duration options for script generation
export type ScriptDuration = 'short' | 'medium' | 'long'; // 8-12 min, 20 min, 35 min

// 4-Point analytical framework for each chapter
export interface ChapterAnalysis {
  stat_rehook: string; // Number/ratio to re-engage viewer's "strategy brain"
  hollywood_myth?: string; // The "movie version" or common misconception
  tactical_reality: string; // The Meta - factual explanation via Unit Counter Framework
  total_war_parallel?: string; // Historical comparison or strategy game equivalent
}

// Enhanced section for Gamified War outline
export interface GamifiedWarSection {
  title: string;
  key_points: string[];
  chapter_analysis: ChapterAnalysis;
  engagement_spike?: string; // Comment prompt for viewer engagement
  visual_note?: string; // Note for "Tactical Map Graphics" or "Oil Painting Visuals"
  estimated_word_count: number;
}

// Gamified War Outline (5 points with 3-phase timing)
export interface GamifiedWarOutline {
  // Phase 1: Build & Matchup (1:30-4:00 for short, scales with duration)
  the_matchup: GamifiedWarSection; // Win Condition, odds, "1 vs 10" disparity
  the_unit_deep_dive: GamifiedWarSection; // The specific weapon/soldier that changed the game

  // Phase 2: Tactical Turn (4:00-7:30 for short)
  the_tactical_turn: GamifiedWarSection; // The maneuver/exploit that trapped the enemy

  // Phase 3: Kill Screen & Aftermath (7:30-10:00+ for short)
  the_kill_screen: GamifiedWarSection; // Vivid rout/destruction description
  the_aftermath: GamifiedWarSection; // Final casualty stats, kill ratios, "patch notes"

  // Meta
  target_duration: ScriptDuration;
  generated_at: Date;
}

// Legacy type alias for backwards compatibility during migration
export type TacticalOutline = GamifiedWarOutline;

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

  // Polishing step results (optional - populated after audit+polish workflow)
  polished_content?: string; // Rewritten script after quality optimization
  polished_word_count?: number; // Word count of polished script
  audit_report?: string; // Raw audit report from OpenAI analysis
}

// Generation progress tracking
export interface RecursiveGenerationProgress {
  phase: 'research' | 'hook' | 'outline' | 'batch' | 'complete' | 'error';
  current_batch: number; // 0-5 (0 = not started, 5 = complete)
  total_batches: number; // Always 5 (one per Gamified War section)
  current_word_count: number;
  target_word_count: number; // Varies by duration: 1500 (short), 3000 (medium), 5250 (long)
  error?: string;
}

// Style constraints for validation
export interface WarRoomStyleConstraints {
  prohibited_words: string[];
  mandatory_terminology: string[];
  style_rules: string[];
}

// ============================================================================
// YOUTUBE REPURPOSING TYPES
// ============================================================================

export interface YouTubeTranscript {
  text: string;
  wordCount: number;
}

export interface YouTubeExtraction {
  transcript: YouTubeTranscript;
}

// Phase 1: Analysis output
export interface ScriptAnalysis {
  hookQuality: {
    score: number; // 1-10
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  retentionTactics: {
    score: number; // 1-10
    identifiedTactics: string[];
    missingTactics: string[];
    suggestions: string[];
  };
  structureAnalysis: {
    score: number; // 1-10
    pacing: string;
    transitions: string;
    payoffs: string;
  };
  overallScore: number;
  keyStrengths: string[];
  criticalImprovements: string[];
  analyzedAt: Date;
}

// Phase 2: Rewrite output
export interface RewrittenScript {
  content: string; // TTS-ready plain paragraphs
  wordCount: number;
  estimatedDuration: number; // minutes (target: 25)
  appliedTechniques: string[];
  rewrittenAt: Date;
}

// Combined repurpose session
export type RepurposeStatus =
  | 'idle'
  | 'extracting'
  | 'analyzing'
  | 'rewriting'
  | 'complete'
  | 'error';

export interface RepurposeSession {
  youtubeUrl: string;
  extraction: YouTubeExtraction | null;
  analysis: ScriptAnalysis | null;
  rewrittenScript: RewrittenScript | null;
  status: RepurposeStatus;
  error?: string;
}

// ============================================================================
// VIDEO GENERATION TYPES
// ============================================================================

export interface ApiSceneItem {
  scene_number: number;
  script_snippet: string;
  image_url: string;
}

export interface VideoGenerationStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'rendering' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  video_url?: string;
  error?: string;
}
