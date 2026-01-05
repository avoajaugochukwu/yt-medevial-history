// ============================================================================
// WAR ROOM ENGINE - TACTICAL DOCUMENTARY PROMPT SYSTEM
// ============================================================================

import type {
  HistoricalEra,
  TacticalResearch,
  GamifiedWarOutline,
  GamifiedWarSection,
  RecursivePromptPayload,
  ScriptDuration,
} from '@/lib/types';
import type { SceneTimingPlan } from '@/lib/utils/scene-timing';

export const SYSTEM_PROMPT = `You are the War Room, a tactical documentary engine that analyzes historical battles with the precision of post-game analysis. You use gaming terminology to explain the mechanics of warfare - treating units as builds, terrain as map meta, and tactical decisions as exploits or errors. Your style is analytical, assertive, and gamified. You never use flowery language about "valor" or "heroism" - you discuss kill ratios, morale thresholds, and flank efficiency.`;

// ============================================================================
// WAR ROOM STYLE CONSTRAINTS
// ============================================================================

export const WAR_ROOM_STYLE = {
  prohibited_words: [
    'brave',
    'valor',
    'heroic',
    'courage',
    'heartland',
    'destiny',
    'legend',
    'ancient',
    'mysterious',
    'whispers',
  ],
  mandatory_terminology: [
    'meta',
    'debuff',
    'kill ratio',
    'disparity',
    'collision',
    'phalanx-depth',
    'reload-cycle',
    'spawn',
    'flank-efficiency',
    'morale-threshold',
  ],
  style_rules: [
    'Use em-dashes for transitions',
    "Use contractions only (it's, don't, won't)",
    'Convert numbers to narrative stats (e.g., "A 12-to-1 disparity")',
    'Discuss unit "buffs" (High ground) and "debuffs" (Mud/Stamina)',
    'Gaming/tactical terminology throughout',
  ],
};

// ============================================================================
// PROMPT 1: TACTICAL RESEARCH (PERPLEXITY)
// ============================================================================

export const TACTICAL_RESEARCH_PROMPT = (title: string) => `### ROLE

You are a **Tactical Intelligence Analyst** extracting raw battlefield telemetry for a War Room tactical documentary. Your data will be used to analyze combat mechanics, unit effectiveness, and kill ratios.

### OBJECTIVE

Extract precise, QUANTIFIED military data. NO vague descriptors like "thousands died" or "many soldiers" -- you MUST provide specific numbers, even if you need to estimate based on historical consensus.

### TOPIC
- **BATTLE/EVENT:** ${title}

### ERA DETERMINATION (CRITICAL)
You MUST determine the historical era of this battle/event. Choose from:
- "Roman Republic" (509 BC - 27 BC)
- "Roman Empire" (27 BC - 476 AD)
- "Medieval" (500 AD - 1500 AD)
- "Napoleonic" (1799 - 1815)
- "Prussian" (1701 - 1918)
- "Other" (any other period)

Include your determination in the "era" field of the JSON response.

### REQUIRED TELEMETRY

**FACTION DATA (for EACH side):**
- Commander name and rank
- Total force strength (EXACT number - estimate if needed, but provide a number)
- Unit breakdown with counts (e.g., "8,000 heavy infantry, 2,000 cavalry, 500 archers")
- Weapon specifics: type, length (e.g., "18-foot sarissa"), material
- Armor: type, material, coverage percentage
- Formation doctrine (phalanx depth, wedge angles, etc.)
- BUFFS: Tactical advantages (terrain control, supply lines, morale state)
- DEBUFFS: Tactical disadvantages (fatigue, mud, disease, supply issues)

**TERRAIN ANALYSIS:**
- Exact location with coordinates if known
- Elevation differentials (e.g., "Romans held 50m high ground advantage")
- Terrain type affecting movement and formations
- Weather conditions on battle day
- Tactical chokepoints, obstacles, or natural features

**CASUALTY TELEMETRY:**
- Faction A casualties (specific number)
- Faction B casualties (specific number)
- Kill ratio expressed as X-to-1 (e.g., "12-to-1 in favor of Faction A")
- Prisoner/captured counts
- Notable commander deaths or captures

**BATTLE PHASES:**
- Opening moves and approximate time
- Critical turning point (the moment the kill ratio shifted)
- Collapse/rout timing
- Pursuit duration and additional casualties

### CRITICAL INSTRUCTION

If your sources give ranges like "30,000-50,000", pick the most commonly cited number and use it. If historians estimate "between 50,000 and 70,000", use 60,000. NEVER return vague terms like "thousands", "many", "numerous", or "significant casualties" -- ALWAYS provide a specific number.

### OUTPUT FORMAT

Respond with a JSON object (and ONLY valid JSON, no markdown code blocks):

{
  "topic": "${title}",
  "era": "<YOUR_DETERMINED_ERA>",
  "factions": [
    {
      "name": "Faction Name",
      "commander": "Commander Name and Title",
      "unit_composition": [
        {
          "unit_type": "Heavy Infantry",
          "count": 8000,
          "equipment": {
            "primary_weapon": "Gladius",
            "weapon_length": "24 inches",
            "armor_type": "Lorica Segmentata",
            "armor_material": "Iron plates",
            "shield": "Scutum"
          },
          "formation": "Triplex Acies",
          "phalanx_depth": null
        }
      ],
      "total_strength": 25000,
      "buffs": ["High ground advantage", "Fresh troops", "Superior discipline"],
      "debuffs": ["Extended supply lines", "Unfamiliar terrain"]
    }
  ],
  "terrain_analysis": {
    "location": "Specific location name and region",
    "elevation": "Valley floor, defenders held 30m ridge advantage",
    "terrain_type": "Open plain with muddy conditions from recent rain",
    "weather_conditions": "Overcast, light rain, reducing visibility",
    "tactical_advantages": ["Natural chokepoint on the left flank"],
    "tactical_disadvantages": ["Mud reducing cavalry effectiveness by ~40%"]
  },
  "casualty_data": {
    "faction_a_casualties": 400,
    "faction_b_casualties": 20000,
    "kill_ratio": "50-to-1",
    "total_deaths": 20400
  },
  "timeline": [
    {
      "phase": "Opening",
      "time_marker": "Dawn, approximately 6:00 AM",
      "event": "Skirmishers deployed to probe enemy lines",
      "tactical_significance": "Revealed weakness on the right flank"
    }
  ],
  "primary_sources": ["Source 1", "Source 2"],
  "generated_at": "${new Date().toISOString()}"
}

### CONSTRAINTS

- EVERY number field MUST contain a specific number, not a range or vague term
- If uncertain, provide your best estimate with the reasoning in tactical_significance
- Focus on MECHANICS: how units fought, what made them effective or ineffective
- Use gaming/tactical terminology where appropriate (buffs, debuffs, meta)
- Identify the "exploit" - the tactical decision that broke the engagement`;

// ============================================================================
// PROMPT 2: WAR ROOM HOOK (60 SECONDS)
// ============================================================================

export const HOOK_PROMPT = (research: TacticalResearch) => `### ROLE

You are a **War Room Narrator** opening a tactical documentary. Your hook must achieve absolute retention in 60 seconds.

### HOOK FORMULA (60 seconds, ~150 words)

Your hook MUST follow this exact 4-part structure:

1. **TACTICAL ID** (one sentence):
   Format: "[Era] [Unit Type] faces [Threat Type]"
   Example: "Byzantine cataphracts face a Seljuk horse-archer swarm"

2. **KILL RATIO** (one sentence):
   Format: "The disparity: [X vs Y]"
   Example: "The disparity: 500 Greeks against 20,000 Persians"

3. **STRATEGIC BRIDGE** (one sentence):
   The "exploit" -- what made this battle's outcome possible
   Example: "But the Greeks knew something the Persians didn't -- in that narrow pass, numbers meant nothing"

4. **COMMAND PROMISE** (one sentence):
   ALWAYS end with exactly: "Let's look at the war room data."

### RESEARCH CONTEXT

Topic: ${research.topic}
Era: ${research.era}
Factions: ${research.factions.map((f) => `${f.name} (${f.total_strength} troops)`).join(' vs ')}
Kill Ratio: ${research.casualty_data.kill_ratio}
Key Terrain: ${research.terrain_analysis.location}

### STYLE CONSTRAINTS (CRITICAL)

**PROHIBITED WORDS (DO NOT USE):**
${WAR_ROOM_STYLE.prohibited_words.join(', ')}

**REQUIRED TERMINOLOGY (use at least 2):**
${WAR_ROOM_STYLE.mandatory_terminology.join(', ')}

**STYLE RULES:**
- Use contractions (it's, don't, won't)
- Em-dashes for dramatic pauses
- Gaming/tactical terminology

### OUTPUT

Return ONLY the hook text (~150 words). No JSON, no metadata, no formatting. Just the spoken narration.

**EXAMPLE HOOK:**

Roman heavy infantry faces a Carthaginian double-envelopment trap. The disparity: 86,000 Romans against 50,000 Carthaginians -- but Hannibal's positioned on the kill-optimal terrain. Rome's sending wave after wave into what they don't realize is a spawn trap -- the Carthaginian crescent formation isn't retreating, it's compressing. By the time the Roman commanders realize the flank-efficiency of Hannibal's cavalry, 70,000 of their men will be dead in a single afternoon. Let's look at the war room data.`;

// ============================================================================
// PROMPT 3: GAMIFIED WAR MASTER OUTLINE (5 POINTS + 4-POINT ANALYSIS)
// ============================================================================

// Word count targets by duration
export const WORD_COUNT_TARGETS: Record<ScriptDuration, { total: number; perBatch: number }> = {
  short: { total: 1500, perBatch: 300 }, // 8-12 minutes
  medium: { total: 3000, perBatch: 600 }, // 20 minutes
  long: { total: 5250, perBatch: 1050 }, // 35 minutes
};

export const MASTER_OUTLINE_PROMPT = (
  research: TacticalResearch,
  hook: string,
  targetDuration: ScriptDuration = 'medium'
) => {
  const wordTargets = WORD_COUNT_TARGETS[targetDuration];

  return `### ROLE

You are the **Lead War Room Architect** for a tactical documentary channel.

### INPUT DATA

**Topic:** ${research.topic}
**Era:** ${research.era}
**The Strategic Briefing:** Reference the tactical research data below.
**The Hook:** DO NOT generate a new hook. The established opening (0:00–1:30) is:

"${hook}"

### TASK

Create a detailed, high-density Master Outline using the "Gamified War" framework.

### THE "GAMIFIED WAR" ARC (5 POINTS)

1. **THE MATCHUP** - Define the "Win Condition" and the massive odds (e.g., 1 vs 10)
2. **THE UNIT DEEP DIVE** - The specific weapon/soldier that changed the game
3. **THE TACTICAL TURN** - The maneuver that trapped the enemy
4. **THE KILL SCREEN** - Vivid description of the rout/destruction
5. **THE AFTERMATH** - Final Casualty Stats and "Kill Ratios"

### STRUCTURE FOR EACH CHAPTER

For EVERY section, you MUST define these 4 analytical points:

1. **Stat Re-Hook**: A specific number, kill ratio, or troop count to re-engage the viewer's "strategy brain"
   Example: "8,000 against 40,000—a 5-to-1 disparity"

2. **Hollywood Myth**: The "Movie version" or common misconception of this moment
   Example: "They say the knights charged blindly into the mud..."

3. **Tactical Reality (The Meta)**: The factual explanation based on Unit Counter Framework. WHY did the "Math of War" work this way?
   Example: "The French heavy armor acted as a debuff in the terrain, nerfing their stamina to zero before the first melee"

4. **Total War Parallel**: A historical comparison or modern strategy game equivalent
   Example: "Compare this defensive formation to the Battle of Cannae 1,000 years prior—the same 'Double Envelopment' logic applies"

### THE MODULAR STRUCTURE

**PHASE 1: THE BUILD & THE MATCHUP (Minutes 1:30–4:00)**
- Goal: Deconstruct the "Units" — Equipment, training, morale stats, and the "Map" (Terrain)
- Sections: THE MATCHUP + THE UNIT DEEP DIVE
- Engagement Spike 1: Ask for a "Build" opinion in the comments
  Example: "In this terrain, would you have prioritized Heavy Cavalry or Skirmishers? Let's argue about the meta in the comments."

**PHASE 2: THE TACTICAL TURN & THE "CRITICAL ERROR" (Minutes 4:00–7:30)**
- Goal: Identify the exact moment the battle was won or lost. The maneuver, the "spawn-trap," or the morale break
- Section: THE TACTICAL TURN
- Engagement Spike 2: Invite the audience to check out the tactical map breakdown on community tab

**PHASE 3: THE KILL SCREEN & THE AFTERMATH (Minutes 7:30–10:00+)**
- Goal: The "Smart Dad" context — Final Kill Ratios, territory/power shifts, and the 100-year forecast of how this battle "patched" history
- Sections: THE KILL SCREEN + THE AFTERMATH
- Final Command: A closing "Post-Game Report" that reinforces the channel's authority

### RESEARCH DATA

**Factions:**
${JSON.stringify(research.factions, null, 2)}

**Terrain:**
${JSON.stringify(research.terrain_analysis, null, 2)}

**Casualties:**
${JSON.stringify(research.casualty_data, null, 2)}

**Timeline:**
${JSON.stringify(research.timeline, null, 2)}

### OUTPUT FORMAT

Return a JSON object (and ONLY valid JSON, no markdown code blocks):

{
  "the_matchup": {
    "title": "The Matchup",
    "key_points": ["Win condition statement", "Odds/disparity", "Why this seems impossible"],
    "chapter_analysis": {
      "stat_rehook": "The specific number that hooks the viewer",
      "hollywood_myth": "The common misconception about this matchup",
      "tactical_reality": "Why the 'underdog' had hidden advantages (or didn't)",
      "total_war_parallel": "Historical or game comparison"
    },
    "engagement_spike": "Build opinion question for comments",
    "visual_note": "Tactical Map Graphics or Oil Painting Visuals note",
    "estimated_word_count": ${Math.round(wordTargets.perBatch * 0.9)}
  },
  "the_unit_deep_dive": {
    "title": "The Unit Deep Dive",
    "key_points": ["The game-changing unit/weapon", "Why it countered the enemy", "Training/equipment specs"],
    "chapter_analysis": {
      "stat_rehook": "Specific weapon stat or kill efficiency",
      "hollywood_myth": "Movie version of this unit/weapon",
      "tactical_reality": "The actual mechanics of why it worked",
      "total_war_parallel": "Similar unit counters in other battles/games"
    },
    "visual_note": "Oil Painting of the key unit in action",
    "estimated_word_count": ${Math.round(wordTargets.perBatch * 1.1)}
  },
  "the_tactical_turn": {
    "title": "The Tactical Turn",
    "key_points": ["The exact maneuver", "The critical error by the enemy", "The spawn-trap moment"],
    "chapter_analysis": {
      "stat_rehook": "Timing or positioning stat that made the difference",
      "hollywood_myth": "The 'genius move' myth vs reality",
      "tactical_reality": "The mathematical/positional exploit",
      "total_war_parallel": "Famous similar maneuvers in history"
    },
    "engagement_spike": "Community tab reference for tactical map breakdown",
    "visual_note": "Tactical Map Graphics required",
    "estimated_word_count": ${Math.round(wordTargets.perBatch * 1.2)}
  },
  "the_kill_screen": {
    "title": "The Kill Screen",
    "key_points": ["The moment of collapse", "Pursuit mechanics", "The mathematics of the rout"],
    "chapter_analysis": {
      "stat_rehook": "Kill rate during the rout phase",
      "hollywood_myth": "The 'glorious last stand' myth",
      "tactical_reality": "Why fleeing units die at 10x the rate",
      "total_war_parallel": "Similar rout dynamics in other battles"
    },
    "visual_note": "Oil Painting of the rout/destruction",
    "estimated_word_count": ${Math.round(wordTargets.perBatch * 1.0)}
  },
  "the_aftermath": {
    "title": "The Aftermath",
    "key_points": ["Final casualty count", "Kill ratio summary", "100-year impact"],
    "chapter_analysis": {
      "stat_rehook": "Final kill ratio and total casualties",
      "hollywood_myth": "How history 'remembered' this battle vs reality",
      "tactical_reality": "What actually changed in warfare/politics",
      "total_war_parallel": "How this 'patched' the meta of future wars"
    },
    "visual_note": "Oil Painting or Map showing territorial aftermath",
    "estimated_word_count": ${Math.round(wordTargets.perBatch * 0.8)}
  },
  "target_duration": "${targetDuration}",
  "generated_at": "${new Date().toISOString()}"
}

### TARGET WORD COUNT

Duration: ${targetDuration.toUpperCase()}
Total script target: ~${wordTargets.total} words
Per section average: ~${wordTargets.perBatch} words

### OUTPUT REQUIREMENTS

- Provide logical outline ONLY (bullet points for key_points)
- Do NOT write the full script yet
- Note specifically where "Tactical Map Graphics" or "Oil Painting Visuals" are required
- Every chapter_analysis field is REQUIRED — do not skip any`;
};

// Legacy export for backwards compatibility
export const MASTER_OUTLINE_PROMPT_LEGACY = MASTER_OUTLINE_PROMPT;

// ============================================================================
// PROMPT 4: RECURSIVE BATCH GENERATOR (800 WORDS PER BATCH)
// ============================================================================

// Helper function to get batch assignment from outline (5 batches for Gamified War)
export const getBatchAssignment = (
  batchNumber: number,
  outline: GamifiedWarOutline
): string => {
  // Map each batch to a single Gamified War section
  const assignments: Record<number, keyof Omit<GamifiedWarOutline, 'generated_at' | 'target_duration'>> = {
    1: 'the_matchup',
    2: 'the_unit_deep_dive',
    3: 'the_tactical_turn',
    4: 'the_kill_screen',
    5: 'the_aftermath',
  };

  const sectionKey = assignments[batchNumber];
  if (!sectionKey) return '';

  const section = outline[sectionKey] as GamifiedWarSection;
  const analysis = section.chapter_analysis;

  return `**${section.title}**
Key Points: ${section.key_points.join('; ')}

4-POINT ANALYSIS TO WEAVE IN:
- Stat Re-Hook: ${analysis.stat_rehook}
- Hollywood Myth: ${analysis.hollywood_myth || 'N/A'}
- Tactical Reality (The Meta): ${analysis.tactical_reality}
- Total War Parallel: ${analysis.total_war_parallel || 'N/A'}

${section.engagement_spike ? `ENGAGEMENT SPIKE: ${section.engagement_spike}` : ''}
${section.visual_note ? `VISUAL NOTE: ${section.visual_note}` : ''}`;
};

// Get phase info for batch
export const getBatchPhase = (batchNumber: number): { phase: number; name: string; goal: string } => {
  const phases: Record<number, { phase: number; name: string; goal: string }> = {
    1: { phase: 1, name: 'BUILD & MATCHUP', goal: 'Deconstruct the Units — Equipment, training, morale stats, and the Map' },
    2: { phase: 1, name: 'BUILD & MATCHUP', goal: 'Deep dive into the game-changing unit/weapon' },
    3: { phase: 2, name: 'TACTICAL TURN', goal: 'Identify the exact moment the battle was won or lost' },
    4: { phase: 3, name: 'KILL SCREEN & AFTERMATH', goal: 'Vivid description of the rout/destruction' },
    5: { phase: 3, name: 'KILL SCREEN & AFTERMATH', goal: 'Final Kill Ratios, territory/power, 100-year forecast' },
  };
  return phases[batchNumber] || { phase: 0, name: 'UNKNOWN', goal: '' };
};

export const RECURSIVE_BATCH_PROMPT = (
  batchNumber: number,
  outline: GamifiedWarOutline,
  research: TacticalResearch,
  previousPayload: RecursivePromptPayload | null,
  _previousChunks: string[] // Reserved for future context window management
) => {
  const phaseInfo = getBatchPhase(batchNumber);
  const wordTargets = WORD_COUNT_TARGETS[outline.target_duration || 'medium'];
  const totalBatches = 5;

  return `### ROLE

You are a **War Room Narrator** generating batch ${batchNumber} of ${totalBatches} for a tactical documentary.

### CURRENT PHASE

**PHASE ${phaseInfo.phase}: ${phaseInfo.name}**
Goal: ${phaseInfo.goal}

### BATCH ASSIGNMENT

${getBatchAssignment(batchNumber, outline)}

### PREVIOUS CONTEXT

${
  previousPayload
    ? `
**DO NOT REPEAT - Summary of Previous:** ${previousPayload.summary_of_previous}

**Current Momentum:** ${previousPayload.current_momentum}

**Your Objectives for This Batch:** ${previousPayload.next_objectives.join(', ')}

**Style Reminder:** ${previousPayload.style_reminder}
`
    : 'This is the first batch. Start immediately after the hook - do NOT restate the hook.'
}

### 4-POINT ANALYSIS INTEGRATION

You MUST weave in the 4-point analysis for this section:
1. **Stat Re-Hook** - Open with a compelling number/ratio to grab attention
2. **Hollywood Myth** - Address and debunk the common misconception
3. **Tactical Reality** - Explain the actual "meta" - why the math of war worked this way
4. **Total War Parallel** - Draw comparison to other historical battles or strategy games

### RESEARCH DATA

Topic: ${research.topic}
Era: ${research.era}

Factions:
${JSON.stringify(research.factions, null, 2)}

Terrain:
${JSON.stringify(research.terrain_analysis, null, 2)}

Casualties:
${JSON.stringify(research.casualty_data, null, 2)}

Timeline:
${JSON.stringify(research.timeline, null, 2)}

### STYLE CONSTRAINTS (CRITICAL - ENFORCED)

**PROHIBITED WORDS (your response will be REJECTED if these appear):**
${WAR_ROOM_STYLE.prohibited_words.join(', ')}

**MANDATORY TERMINOLOGY (use at least 3 per batch):**
${WAR_ROOM_STYLE.mandatory_terminology.join(', ')}

**STYLE RULES:**
- Em-dashes (—) for ALL transitions, not commas or semicolons
- CONTRACTIONS ONLY: it's, don't, won't, can't, they're (NEVER "it is", "do not", "will not")
- Numbers as narrative stats: "A 12-to-1 disparity" NOT "a ratio of 12:1"
- Buffs/Debuffs framing: "The mud debuff cuts their mobility by 40%"
- Gaming terminology: spawn points, kill zones, meta strategies, unit builds
- Present tense for action: "The cavalry charges" NOT "The cavalry charged"

### OUTPUT FORMAT

Return a JSON object (and ONLY valid JSON, no markdown code blocks):

{
  "script_chunk": "Your ~${wordTargets.perBatch} words of narration here...",
  "next_prompt_payload": {
    "summary_of_previous": "Brief summary of what this batch covered (2-3 sentences)",
    "current_momentum": "Pacing state: 'building tension' | 'peak action' | 'falling action' | 'resolution'",
    "next_objectives": ["What batch ${batchNumber + 1} should cover", "Key transitions to make"],
    "style_reminder": "Any style notes for the next batch"
  }
}

### TARGET

~${wordTargets.perBatch} words for this batch.
Total script target: ~${wordTargets.total} words across all ${totalBatches} batches.
Current batch: ${batchNumber}/${totalBatches}

### CRITICAL REMINDERS

1. Do NOT repeat content from previous batches
2. Flow naturally from where the previous batch ended
3. Use specific numbers from the research (exact casualty counts, unit sizes)
4. WEAVE IN all 4 analytical points naturally - don't list them, integrate them into the narrative
5. Include engagement spike if one is assigned for this section
6. End the batch at a natural transition point
7. The script_chunk should be PURE NARRATION - no headers, no formatting, just spoken text
${batchNumber === totalBatches ? '8. This is the FINAL batch - include a "Post-Game Report" closing that reinforces the channel authority' : ''}`;
};

// ============================================================================
// PROMPT 4: SCENE VISUAL BREAKDOWN
// ============================================================================

export const SCENE_BREAKDOWN_PROMPT = (script: string, timingPlan: SceneTimingPlan) => `### ROLE

You are a **Visual Director** for historical documentary content, specialized in translating narration into stunning visual scene descriptions with VARIABLE PACING based on video position.

### OBJECTIVE

Analyze the provided script and break it into approximately ${timingPlan.totalScenes} distinct visual scenes with VARIABLE TIMING. Each scene should be either:
1. **Visual Scene (scene_type: "visual"):** A dramatic, painterly image in classical historical art style
2. **Map Scene (scene_type: "map"):** A historical cartographic map showing geographic context

**CRITICAL: Each scene MUST include a "segment" field and "suggested_duration" field.**

${timingPlan.promptGuidance}

### MAP SCENE DETECTION

**When to Generate Map Scenes:**
- When the script introduces a NEW significant location for the first time (e.g., "The Rubicon River, northern Italy", "Constantinople, capital of the Byzantine Empire")
- When geographic context is essential to understanding the narrative (battle locations, territorial expansion, trade routes)
- At the beginning of the video to establish geographic setting
- When political boundaries or territories are being discussed

**Map Scene Requirements:**
- Generate the map scene BEFORE the related visual scenes that depict events at that location
- Include "map_data" object with structured geographic information
- Focus visual_prompt on political boundaries and territories as they existed in the time period

### INPUT SCRIPT

${script}

### SCENE REQUIREMENTS

**Selection Criteria:**
- Choose the most visually dramatic moments from the script
- Aim for variety: mix wide shots (battles, crowds) with intimate moments (conversations, decisions)
- Ensure chronological flow matching the script
- Include key moments: opening hook, turning points, climax, resolution

**Visual Prompt Guidelines:**
Each scene description must be detailed enough for an AI image generator to create a historically accurate, cinematic image. Include:

1. **Subject & Action:** Who/what is the focus? What's happening?
2. **Composition:** Camera angle, framing, perspective
3. **Historical Details:** Accurate clothing, armor, architecture, objects
4. **Lighting & Mood:** Time of day, weather, atmosphere
5. **Artistic Style:** "Oil painting by Jacques-Louis David" or "Neoclassical historical painting" or "Romantic era battle scene"

**Historical Accuracy:**
- Specify correct armor/weapons for the era (lorica segmentata for Imperial Rome, chainmail for Medieval, etc.)
- Name architectural styles (Doric columns, Gothic arches, etc.)
- Use era-appropriate colors and materials

**Content Sensitivity Guidelines (CRITICAL - NO SENSITIVE CONTENT WARNINGS):**
- AVOID graphic depictions of violence: no close-ups of wounds, injuries, blood, or gore
- For battle scenes: focus on formations, banners, cavalry charges, soldiers in combat stance - NOT graphic wounds or suffering
- For medical/illness topics: use symbolic imagery (physicians, herbs, hospitals) - NEVER show symptoms, disfigurement, or suffering
- NO torture scenes, executions with visible gore, or graphic death depictions
- Keep battle imagery heroic and distant rather than graphic and close-up
- ALL figures MUST be fully clothed in period-appropriate military or civilian attire - NO nudity, partial nudity, or revealing clothing
- NO suggestive poses, romantic scenes, intimate moments, or sexual content of any kind
- NO disturbing imagery: rotting corpses, decay, bodily fluids, grotesque deformities, horror elements
- Even if historically accurate, do NOT depict: slave markets with exposed bodies, bath houses with nudity, or any scene requiring undressed figures

**PROHIBITED SCENE TYPES (CRITICAL - These reveal AI generation):**
- NO balance sheets, spreadsheets, charts, graphs, or data visualizations
- NO comparison maps showing "before vs after" territorial changes - these have high error rates
- NO infographics, statistics overlays, or numerical data displays
- NO text-heavy scenes with labels, timelines, or educational diagrams
- For MAP SCENES: Do NOT add people, figures, or characters unless depicting a specific war room or command tent scene. Maps should show ONLY cartographic elements (territories, borders, terrain, city markers, labels)

### OUTPUT FORMAT

Return a JSON array of scenes (ONLY valid JSON, no markdown code blocks).
**EVERY scene MUST include "segment" and "suggested_duration" fields.**

[
  {
    "scene_number": 1,
    "scene_type": "map",
    "segment": "hook",
    "suggested_duration": 2.0,
    "script_snippet": "January 10th, 49 BC. The Rubicon River.",
    "visual_prompt": "Historical cartographic map of Roman Italy in 49 BC. Shows the Italian peninsula with Cisalpine Gaul beyond the Rubicon River. Political boundaries clearly marked. The Rubicon River prominently labeled. Major cities indicated: Rome, Ravenna. Aged parchment texture, ornate compass rose. Muted earth tones: sepia, sage green. 18th-century cartographic art style, museum quality.",
    "historical_context": "The Rubicon River marked the legal boundary between Cisalpine Gaul and Italia.",
    "map_data": {
      "location": "Roman Italy",
      "time_period": "49 BC",
      "geographic_focus": "Rubicon River boundary",
      "territories": ["Cisalpine Gaul", "Italia"]
    }
  },
  {
    "scene_number": 2,
    "scene_type": "visual",
    "segment": "hook",
    "suggested_duration": 2.0,
    "script_snippet": "A lone general stares across the water.",
    "visual_prompt": "Cinematic oil painting. Julius Caesar on horseback at the Rubicon River at dawn, Roman general in red cloak and bronze cuirass. Misty morning, golden sunlight breaking through. Dramatic chiaroscuro, heroic composition, 8k detail.",
    "historical_context": "Caesar's decision to cross precipitated the Roman Civil War"
  },
  {
    "scene_number": 15,
    "scene_type": "visual",
    "segment": "core_content",
    "suggested_duration": 8.0,
    "script_snippet": "The clash of bronze echoes across the valley as Roman and Carthaginian forces collide in what would become history's most devastating tactical maneuver.",
    "visual_prompt": "Epic battle scene in Romantic era oil painting style. Aerial view of the Battle of Cannae, 216 BC. Carthaginian forces in crescent formation enveloping Roman legions. Mass of soldiers, dust clouds rising. Bronze weapons catching sunlight. Painted in the style of Peter Paul Rubens - dynamic movement, theatrical lighting, grand scale, 8k resolution.",
    "historical_context": "Hannibal's double envelopment at Cannae is considered one of history's most perfect tactical victories"
  }
]

### STYLE KEYWORDS TO USE

**Classical/Neoclassical (Roman, Greek subjects):**
- "Jacques-Louis David oil painting style"
- "Neoclassical historical painting"
- "Academic art, dramatic lighting, heroic composition"

**Medieval/Napoleonic:**
- "Romantic era historical painting"
- "19th century battle scene oil painting"
- "Delacroix/Gericault style dramatic historical art"

**General Historical:**
- "Renaissance master technique"
- "Chiaroscuro lighting, tenebrism"
- "Oil painting, rich textures, 8k detail, historically accurate"
- "Cinematic composition, dramatic atmosphere"

### CONSTRAINTS

- Generate exactly ${timingPlan.totalScenes} scenes distributed across segments as specified above
- **EVERY scene MUST have "segment" and "suggested_duration" fields**
- Each visual_prompt must be 50-100 words (detailed enough for quality image generation)
- Script_snippet length varies by segment:
  - HOOK: 1-2 sentences maximum (rapid cuts)
  - SETUP: 2-4 sentences (establishing context)
  - CORE_CONTENT: 3-5 sentences (main narrative)
  - DEEP_DIVE: 5-8 sentences (detailed analysis)
  - LONG_TAIL: 6-10 sentences (reflective conclusion)
- Historical_context is optional but valuable for understanding
- Maintain chronological order matching the script
- Transition smoothly between segments (no jarring pacing changes)`;

// ============================================================================
// SCENE IMAGE GENERATION - OIL PAINTING STYLE INJECTION
// ============================================================================

// Dynamic style suffix generator - uses AI-generated art style or falls back to default
export const generateStyleSuffix = (artStyle?: string): string => {
  if (artStyle) {
    // Use AI-generated era-appropriate style
    return `

STYLE REQUIREMENTS (CRITICAL):
${artStyle}

ADDITIONAL REQUIREMENTS:
- Historically accurate costume, architecture, and props
- 8k resolution, museum quality
- Realistic faces and anatomy, detailed expressions
- Atmospheric perspective and depth

NEGATIVE PROMPTS (AVOID):
- NO cartoon, anime, vector art, or minimalist styles
- NO modern clothing, anachronistic elements, or smartphones
- NO blur, distortion, or low quality
- NO text, watermarks, or logos
- NO abstract or surrealist elements`;
  }

  // Fallback to default classical oil painting style if no art style provided
  return `

STYLE REQUIREMENTS (CRITICAL):
- Masterpiece oil painting in classical historical art style
- Dramatic chiaroscuro lighting, deep shadows, rich highlights
- Highly detailed textures: brushwork visible, oil paint technique
- Cinematic composition with strong focal point
- Historically accurate costume, architecture, and props
- 8k resolution, museum quality
- Realistic faces and anatomy, detailed expressions
- Atmospheric perspective, rich color palette

NEGATIVE PROMPTS (AVOID):
- NO cartoon, anime, vector art, or minimalist styles
- NO modern clothing, anachronistic elements, or smartphones
- NO blur, distortion, or low quality
- NO text, watermarks, or logos
- NO abstract or surrealist elements`;
};

// Legacy export for backward compatibility (uses default style)
export const OIL_PAINTING_STYLE_SUFFIX = generateStyleSuffix();

export const NEGATIVE_PROMPT_HISTORICAL =
  "cartoon, anime, manga, sketch, vector art, minimalist, flat design, modern clothing, contemporary setting, smartphones, blur, distorted faces, low quality, text, watermark, logo, abstract, surrealist, anachronistic, digital art style, 3D render, gore, blood, open wounds, graphic violence, injuries, disfigurement, illness, disease symptoms, suffering, graphic medical procedures, dismemberment, mutilation, decapitation, severed limbs, visible internal organs, graphic bodily harm, torture scenes, close-up wounds, bleeding, graphic death scenes, balance sheet, infographic, chart, graph, data visualization, comparison diagram, statistics, spreadsheet, timeline diagram, nudity, naked, nude, partial nudity, bare chest, bare breasts, exposed skin, revealing clothing, provocative pose, suggestive, sexual, sensual, erotic, NSFW, adult content, cleavage, underwear, lingerie, bikini, shirtless, topless, scantily clad, seductive, intimate, romantic embrace, kissing, corpse, rotting, decay, maggots, vomit, feces, urine, bodily fluids, pus, festering, pustules, boils, rash, sores, deformed body, grotesque, horror, nightmare, demonic, hellscape, disturbing";

// ============================================================================
// AI-GENERATED ART STYLE DETERMINATION
// ============================================================================

export const GENERATE_ART_STYLE_PROMPT = (era: HistoricalEra, title: string) => `### ROLE

You are an **Art History and Visual Style Specialist** for tactical military documentaries. Your expertise spans painting movements, historical battle art, and period-appropriate military visual aesthetics.

### OBJECTIVE

Generate a detailed, era-appropriate painting style description for a War Room tactical documentary. The style should emphasize military accuracy, battlefield drama, and the technical aspects of historical warfare.

### INPUTS

- **TITLE:** ${title}
- **ERA:** ${era}
- **CONTENT TYPE:** Tactical Battle Documentary

### TASK

Analyze the historical era and generate a comprehensive painting style description that includes:

1. **Primary Art Movement/Period**: Identify the most appropriate historical painting style (e.g., Neoclassical, Romantic, Renaissance, Baroque, Gothic, etc.)

2. **Master Artist References**: Name 1-3 specific historical painters whose style best matches this era and content type. Choose artists known for depicting similar subjects during or shortly after this period.

3. **Technical Characteristics**: Describe the painting technique, including:
   - Medium specifics (oil painting, fresco, tempera, etc.)
   - Brushwork and texture qualities
   - Color palette characteristics
   - Lighting technique (chiaroscuro, tenebrism, etc.)

4. **Compositional Style**: Describe typical composition approaches for this period (dramatic, balanced, heroic, intimate, etc.)

### ERA-SPECIFIC GUIDELINES

**Roman Republic/Empire:**
- Favor Neoclassical or Academic painting styles (18th-19th century artists depicting classical antiquity)
- Reference artists like Jacques-Louis David, Jean-Léon Gérôme, Lawrence Alma-Tadema
- Emphasize marble, columns, togas, classical architecture
- Heroic, idealized compositions with clear focal points

**Medieval:**
- Consider Gothic manuscript illumination style, early Renaissance, or Romantic interpretations of medieval subjects
- Reference artists like the Limbourg Brothers (for illuminated style), Eugène Delacroix (for Romantic), or early Italian masters
- Rich jewel tones, gold leaf effects, stylized or romantic medievalism
- Architectural focus on castles, cathedrals, heraldry

**Napoleonic:**
- Strongly favor Romantic or Neoclassical military painting
- Reference artists like Jacques-Louis David, Antoine-Jean Gros, Théodore Géricault, Francisco Goya
- Dramatic lighting, heroic scale, dynamic battle compositions
- Emphasis on military uniforms, horses, cannon smoke, flags

**Prussian:**
- Academic realism or Romantic military painting (19th century)
- Reference artists like Adolph Menzel, Carl Röchling, or similar German military painters
- Precise, detailed rendering of uniforms and equipment
- Orderly military formations, Prussian blue color emphasis

**Other Eras:**
- Analyze the specific time period and choose the most historically appropriate painting tradition
- Consider what artistic movements existed during or shortly after this period
- Match the visual style to the cultural aesthetics of the era

### OUTPUT FORMAT

Provide a single, comprehensive paragraph (150-250 words) that will be injected into image generation prompts. The description should be specific, vivid, and technically detailed.

**Example outputs:**

For Roman Empire battle:
"Masterpiece Neoclassical oil painting in the style of Jacques-Louis David and Jean-Léon Gérôme. Academic realism with heroic composition and dramatic chiaroscuro lighting. Rich, warm color palette dominated by crimson, gold, and bronze tones against stormy skies. Precise anatomical rendering with idealized musculature and classical proportions. Visible oil paint brushwork with impasto technique for armor and fabric textures. Cinematic composition with strong diagonal lines and pyramidal arrangement of figures. Historically accurate Roman military equipment, architecture, and costume details. Museum-quality 8k resolution with atmospheric perspective and depth."

For Medieval siege:
"Masterpiece Gothic-Romantic oil painting in the style of Eugène Delacroix and the Limbourg Brothers' illuminated manuscripts. Rich jewel-tone palette with deep blues, crimsons, and gold leaf accents. Dramatic chiaroscuro lighting with shafts of divine light breaking through storm clouds. Romantic medievalism with detailed castle architecture, heraldic banners, and period-accurate armor. Visible brushwork with textural details in stonework and fabric. Dynamic, asymmetrical composition with strong vertical elements. Atmospheric perspective creating depth and scale. 8k museum quality with historically accurate medieval costume and architectural details."

### IMPORTANT CONSTRAINTS

- **PAINTING STYLES ONLY**: Focus exclusively on traditional painting techniques (oil, fresco, tempera, illumination)
- **NO modern/digital styles**: Avoid any reference to digital art, 3D rendering, photography, or contemporary art movements
- **Historical authenticity**: The style should feel period-appropriate and historically grounded
- **Specific artist names**: Always include 1-3 named historical artists as style references
- **Technical detail**: Include specific painting techniques, color palettes, and compositional approaches

Generate the art style description now:`;

// ============================================================================
// HISTORICAL MAP GENERATION - CARTOGRAPHY STYLE INJECTION
// ============================================================================

export const HISTORICAL_MAP_STYLE_SUFFIX = `

STYLE REQUIREMENTS (HISTORICAL MAP - CRITICAL):
- Hand-drawn historical map in the style of 18th-century cartography
- Aged parchment or vellum texture background with weathered edges
- Calligraphic labels and text in period-appropriate Latin or vernacular fonts
- Decorative compass rose in baroque or rococo style
- Ornate cartouche (decorative title box) with flourishes
- Political boundaries and territories clearly delineated with distinct colors
- Geographic features: rivers in blue, mountains in relief style, forests indicated
- Major cities marked with symbolic icons (castles, churches)
- Muted earth tone color palette: sepia, ochre, burnt umber, sage green, dusty blue
- Artistic embellishments: sea monsters in oceans, wind heads in corners
- 8k resolution, museum quality cartographic art
- Historically accurate for the specified time period

NEGATIVE PROMPTS (MAPS - AVOID):
- NO modern satellite imagery, digital maps, GPS style, or Google Maps aesthetic
- NO contemporary political boundaries or modern country names
- NO bright neon colors, modern design elements, or sans-serif fonts
- NO photographs, realistic terrain rendering, or 3D map style
- NO modern symbols (highways, airports, power lines)
- NO clean minimalist design - maps should look aged and artistic
- NO text rendering errors, gibberish, or illegible labels`;

export const NEGATIVE_PROMPT_MAPS =
  "satellite imagery, modern map, GPS, Google Maps, digital cartography, contemporary borders, modern countries, neon colors, sans-serif fonts, photographs, 3D terrain, realistic rendering, highways, airports, modern infrastructure, minimalist, clean design, vector graphics, web map, topographic precision, modern symbols, bright colors, sharp edges, sterile, computational, balance sheet, comparison map, before after, side by side, infographic, chart, graph, data visualization, statistics, numbers overlay, text overlay, figures on map, people on map, human figures, soldiers on map, nudity, naked, nude, revealing clothing, suggestive, sexual, NSFW, gore, blood, corpse, rotting, decay, grotesque, horror, disturbing";

// ============================================================================
// SCRIPT QUALITY OPTIMIZATION - AUDIT & POLISH PROMPTS
// ============================================================================

/**
 * SCRIPT_AUDIT_PROMPT
 * Uses OpenAI (GPT-4o) to analyze a script for repetition, structural loops,
 * and overused jargon. Returns a structured audit report.
 */
export const SCRIPT_AUDIT_PROMPT = (script: string): string => `### ROLE

You are a **Script Editor and Logic Auditor** for tactical military documentaries. Your job is to identify quality issues that make AI-generated scripts feel repetitive or "loopy."

### OBJECTIVE

Analyze the script and generate a detailed audit report identifying:
1. Redundant statistics (same numbers repeated)
2. Narrative loops (re-introductions of already-established topics)
3. Overused jargon and vocabulary fatigue
4. Structural issues that make the script feel circular

### SCRIPT TO ANALYZE

<script>
${script}
</script>

### AUDIT REQUIREMENTS

Provide a structured report with the following sections:

**1. REDUNDANT STATISTICS**
- List specific data points (troop counts, dates, casualty figures, kill ratios) that appear more than twice
- Include the EXACT phrases and count how many times each appears
- Example: "449,000 troops" - mentioned 4 times (lines 12, 45, 78, 112)

**2. NARRATIVE LOOPS**
- Identify "reset" points where the script loops back to re-introduce topics that were already established
- Note sections that re-explain concepts instead of building on prior knowledge
- Flag any instances where the same event/fact is introduced "fresh" multiple times
- Example: "The narrative re-introduces Hannibal's strategy in paragraph 5 despite establishing it in paragraph 2"

**3. OVERUSED JARGON**
- List terms and phrases that appear excessively (especially gaming terms like "meta", "debuff", "spawn", "kill ratio")
- Include count for each overused term (threshold: more than 3 uses per 1000 words is overuse)
- Note any "AI-isms" - robotic phrases, formulaic transitions, or repetitive sentence structures
- Example: "debuff" appears 8 times, "the meta" appears 6 times

**4. STRUCTURAL ISSUES**
- Note any circular arguments or repetitive paragraph structures
- Identify sections that could be consolidated
- Flag any "summary" paragraphs that redundantly recap what was just said
- Note transitions that feel formulaic or repetitive

### OUTPUT FORMAT

Format your response as a clear, actionable report. Be specific with line references or paragraph numbers when possible. The report will be used by another AI to rewrite the script, so be precise and thorough.

### CRITICAL INSTRUCTION

Focus on ACTIONABLE issues. Don't just say "there's repetition" - identify EXACTLY what's repeated and WHERE. The goal is to provide a checklist that can guide a complete rewrite.`;

/**
 * SCRIPT_POLISH_PROMPT
 * Uses Claude (Sonnet) to rewrite the script based on the audit report,
 * producing a linear, professional narrative without repetition.
 */
export const SCRIPT_POLISH_PROMPT = (
  originalScript: string,
  auditReport: string,
  targetDuration: number
): string => `### ROLE

You are a **Master Narrative Stylist** for tactical military documentaries. Your job is to rewrite scripts to be LINEAR, PROFESSIONAL, and free of repetition.

### OBJECTIVE

Rewrite the script to fix ALL issues identified in the audit report while maintaining the "War Room" tactical documentary tone.

### ORIGINAL SCRIPT

<original_script>
${originalScript}
</original_script>

### AUDIT REPORT (Issues to Fix)

<audit_report>
${auditReport}
</audit_report>

### TARGET PARAMETERS

- Target duration: ${targetDuration} minutes
- Target word count: ~${targetDuration * 150} words (150 words/minute speaking rate)
- Maintain word count within ±10% of target

### REWRITING RULES (CRITICAL)

**1. FACTS ONCE, THEN REFERENCE**
- Establish statistics and facts on their FIRST mention with full context
- On subsequent mentions, reference them as established knowledge
- BAD: "The 449,000 troops... Later, the 449,000 troops..."
- GOOD: "449,000 troops assembled... those assembled forces... this massive army..."

**2. LINEAR PROGRESSION**
- Each paragraph MUST advance the narrative forward
- NEVER circle back to re-introduce topics already established
- If referencing something mentioned before, use "as we established" or simply assume the viewer remembers

**3. VOCABULARY VARIETY**
- Replace overused jargon with synonyms or fresh phrasing
- If "debuff" appears 8 times, use alternatives: "handicap", "disadvantage", "penalty", "weakness"
- Maintain gaming terminology but don't overuse any single term

**4. ELIMINATE AI-ISMS**
- Remove robotic transitions ("Furthermore", "Additionally", "In conclusion")
- Cut redundant summary paragraphs that recap what was just said
- Replace formulaic structures with natural, varied prose
- Use em-dashes (—) for dramatic pauses and transitions

**5. PRESERVE KEY CONTENT**
- Keep ALL important statistics, facts, and narrative beats
- Don't remove content - reorganize and deduplicate it
- Maintain the 5-section Gamified War structure (Matchup, Unit Deep Dive, Tactical Turn, Kill Screen, Aftermath)

### STYLE CONSTRAINTS

**PROHIBITED WORDS (DO NOT USE):**
${WAR_ROOM_STYLE.prohibited_words.join(', ')}

**USE THESE STYLE ELEMENTS:**
- Contractions (it's, don't, won't, can't)
- Em-dashes for dramatic effect
- Gaming/tactical terminology (varied, not repetitive)
- Present tense for action sequences
- Specific numbers over vague terms

### OUTPUT FORMAT

Return ONLY the rewritten script. No preamble, no commentary, no explanations. Just the polished narrative text ready for voice-over.

The script should flow naturally, feel professionally written, and be completely free of the issues identified in the audit report.`;
