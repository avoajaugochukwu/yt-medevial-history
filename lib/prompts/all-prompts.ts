// ============================================================================
// WAR ROOM ENGINE - TACTICAL DOCUMENTARY PROMPT SYSTEM
// ============================================================================

import type {
  HistoricalEra,
  TacticalResearch,
  TacticalOutline,
  RecursivePromptPayload,
} from '@/lib/types';

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
// PROMPT 3: MASTER TACTICAL OUTLINE (10 POINTS)
// ============================================================================

export const MASTER_OUTLINE_PROMPT = (research: TacticalResearch, hook: string) => `### ROLE

You are a **Tactical Documentary Architect** creating a 10-point master outline for a 35-minute War Room analysis.

### THE 10-POINT TACTICAL STRUCTURE

1. **THE MAP META** - Terrain Analysis
   How geography shapes the tactical options. Elevation buffs, chokepoint exploits, terrain debuffs.

2. **FACTION A BUILD** - Equipment/Stats
   Unit composition, weapons, armor, formation doctrine. The "character build" of this army.

3. **FACTION B BUILD** - Counter-measures
   How the opposing force is configured. What counters what.

4. **OPENING SKIRMISH** - The Probing
   Initial contact, testing enemy response, gathering intel.

5. **THE CRITICAL ERROR** - The Spawn Trap
   The decisive mistake that creates vulnerability. The exploit that will be punished.

6. **THE UNIT COLLISION** - The Grind
   Main engagement, attrition phase, morale threshold testing.

7. **THE FLANKING EXPLOIT** - The Finisher
   The tactical move that breaks the stalemate and shifts kill ratio decisively.

8. **THE ROUT** - The Kill Screen
   Collapse, pursuit, the mathematics of fleeing units vs pursuing cavalry.

9. **AFTERMATH TELEMETRY** - Total Casualties
   Final numbers, prisoner counts, commander fates, the kill ratio summary.

10. **HISTORICAL PATCH NOTES** - Long-term Impact
    How this battle changed warfare, politics, or the meta of future conflicts.

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

### HOOK (for continuity)
${hook}

### OUTPUT FORMAT

Return a JSON object (and ONLY valid JSON, no markdown code blocks):

{
  "the_map_meta": {
    "title": "The Map Meta",
    "key_points": ["Point 1", "Point 2", "Point 3"],
    "estimated_word_count": 600
  },
  "faction_a_build": {
    "title": "Faction A Build",
    "key_points": ["Unit breakdown", "Weapon stats", "Formation doctrine"],
    "estimated_word_count": 600
  },
  "faction_b_build": {
    "title": "Faction B Build",
    "key_points": ["Counter-composition", "Tactical approach"],
    "estimated_word_count": 500
  },
  "opening_skirmish": {
    "title": "Opening Skirmish",
    "key_points": ["Initial deployment", "Probing attacks"],
    "estimated_word_count": 500
  },
  "the_critical_error": {
    "title": "The Critical Error",
    "key_points": ["The mistake", "Why it was exploitable"],
    "estimated_word_count": 700
  },
  "the_unit_collision": {
    "title": "The Unit Collision",
    "key_points": ["Main engagement mechanics", "Attrition"],
    "estimated_word_count": 700
  },
  "the_flanking_exploit": {
    "title": "The Flanking Exploit",
    "key_points": ["The winning move", "Kill ratio shift"],
    "estimated_word_count": 600
  },
  "the_rout": {
    "title": "The Rout",
    "key_points": ["Collapse mechanics", "Pursuit phase"],
    "estimated_word_count": 500
  },
  "aftermath_telemetry": {
    "title": "Aftermath Telemetry",
    "key_points": ["Final casualty numbers", "Kill ratio summary"],
    "estimated_word_count": 400
  },
  "historical_patch_notes": {
    "title": "Historical Patch Notes",
    "key_points": ["Long-term tactical impact", "How warfare changed"],
    "estimated_word_count": 400
  },
  "generated_at": "${new Date().toISOString()}"
}

### TARGET WORD COUNT

Total script target: 5,250-6,000 words (35 minutes at 150 words/min)
Distribute across 10 sections, with more words for critical moments (Error, Collision, Exploit)`;

// ============================================================================
// PROMPT 4: RECURSIVE BATCH GENERATOR (800 WORDS PER BATCH)
// ============================================================================

// Helper function to get batch assignment from outline
export const getBatchAssignment = (
  batchNumber: number,
  outline: TacticalOutline
): string => {
  const assignments: Record<number, (keyof Omit<TacticalOutline, 'generated_at'>)[]> = {
    1: ['the_map_meta', 'faction_a_build'],
    2: ['faction_b_build', 'opening_skirmish'],
    3: ['the_critical_error'],
    4: ['the_unit_collision'],
    5: ['the_flanking_exploit'],
    6: ['the_rout'],
    7: ['aftermath_telemetry', 'historical_patch_notes'],
  };

  const sections = assignments[batchNumber] || [];
  return sections
    .map((key) => {
      const section = outline[key];
      return `**${section.title}:** ${section.key_points.join('; ')}`;
    })
    .join('\n');
};

export const RECURSIVE_BATCH_PROMPT = (
  batchNumber: number,
  outline: TacticalOutline,
  research: TacticalResearch,
  previousPayload: RecursivePromptPayload | null,
  _previousChunks: string[] // Reserved for future context window management
) => `### ROLE

You are a **War Room Narrator** generating batch ${batchNumber} of 7 for a tactical documentary.

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

### MASTER OUTLINE REFERENCE

${JSON.stringify(outline, null, 2)}

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
  "script_chunk": "Your ~800 words of narration here...",
  "next_prompt_payload": {
    "summary_of_previous": "Brief summary of what this batch covered (2-3 sentences)",
    "current_momentum": "Pacing state: 'building tension' | 'peak action' | 'falling action' | 'resolution'",
    "next_objectives": ["What batch ${batchNumber + 1} should cover", "Key transitions to make"],
    "style_reminder": "Any style notes for the next batch"
  }
}

### TARGET

~800 words for this batch.
Total script target: 5,250-6,000 words across all 7 batches.
Current batch: ${batchNumber}/7

### CRITICAL REMINDERS

1. Do NOT repeat content from previous batches
2. Flow naturally from where the previous batch ended
3. Use specific numbers from the research (exact casualty counts, unit sizes)
4. End the batch at a natural transition point
5. The script_chunk should be PURE NARRATION - no headers, no formatting, just spoken text`;

// ============================================================================
// PROMPT 4: SCENE VISUAL BREAKDOWN
// ============================================================================

export const SCENE_BREAKDOWN_PROMPT = (script: string, targetSceneCount: number) => `### ROLE

You are a **Visual Director** for historical documentary content, specialized in translating narration into stunning visual scene descriptions and historical cartography.

### OBJECTIVE

Analyze the provided script and break it into approximately ${targetSceneCount} distinct visual scenes. Each scene should be either:
1. **Visual Scene (scene_type: "visual"):** A dramatic, painterly image in classical historical art style
2. **Map Scene (scene_type: "map"):** A historical cartographic map showing geographic context

**TARGET SCENE COUNT:** ${targetSceneCount} scenes (based on script duration and ~7-8 seconds per scene)

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

**Content Sensitivity Guidelines (CRITICAL):**
- AVOID graphic depictions of violence: no close-ups of wounds, injuries, blood, or gore
- For battle scenes: focus on formations, banners, cavalry charges, soldiers in combat stance - NOT graphic wounds or suffering
- For medical/illness topics: use symbolic imagery (physicians, herbs, hospitals) - NEVER show symptoms, disfigurement, or suffering
- NO torture scenes, executions with visible gore, or graphic death depictions
- Keep battle imagery heroic and distant rather than graphic and close-up

**PROHIBITED SCENE TYPES (CRITICAL - These reveal AI generation):**
- NO balance sheets, spreadsheets, charts, graphs, or data visualizations
- NO comparison maps showing "before vs after" territorial changes - these have high error rates
- NO infographics, statistics overlays, or numerical data displays
- NO text-heavy scenes with labels, timelines, or educational diagrams
- For MAP SCENES: Do NOT add people, figures, or characters unless depicting a specific war room or command tent scene. Maps should show ONLY cartographic elements (territories, borders, terrain, city markers, labels)

### OUTPUT FORMAT

Return a JSON array of scenes (ONLY valid JSON, no markdown code blocks):

[
  {
    "scene_number": 1,
    "scene_type": "map",
    "script_snippet": "January 10th, 49 BC. The Rubicon River, northern Italy...",
    "visual_prompt": "Historical cartographic map of Roman Italy in 49 BC. Shows the Italian peninsula with Cisalpine Gaul (Gallia Cisalpina) in the north beyond the Rubicon River, the Roman territories of Italia proper, and the city of Rome in Latium. Political boundaries clearly marked in distinct colors showing Roman administrative regions. The Rubicon River prominently labeled as the sacred boundary. Major cities indicated: Rome, Ravenna, Ariminum. Apennine mountain range shown in relief style, Tyrrhenian Sea and Adriatic Sea labeled with decorative calligraphy. Aged parchment texture, ornate compass rose, baroque cartouche with title 'Italia 49 BC'. Muted earth tones: sepia, sage green, dusty blue. 18th-century cartographic art style, museum quality.",
    "historical_context": "The Rubicon River marked the legal boundary between Cisalpine Gaul (Caesar's province) and Italia. Crossing it with an army was an act of treason.",
    "map_data": {
      "location": "Roman Italy",
      "time_period": "49 BC",
      "geographic_focus": "Rubicon River boundary between Cisalpine Gaul and Italia",
      "territories": ["Cisalpine Gaul", "Italia", "Roman Republic territories", "Latium"]
    }
  },
  {
    "scene_number": 2,
    "scene_type": "visual",
    "script_snippet": "January 10th, 49 BC. The Rubicon River, northern Italy...",
    "visual_prompt": "Cinematic oil painting in the style of Jacques-Louis David. Julius Caesar on horseback at the edge of the Rubicon River at dawn, Roman general in red paludamentum cloak and polished bronze muscle cuirass, one hand raised dramatically. Behind him, the Thirteenth Legion in formation - Roman legionaries in lorica segmentata armor with rectangular scutum shields, red tunics, iron helmets with red plumes. Misty winter morning, golden sunlight breaking through clouds, the shallow river reflecting the sky. Aquila eagle standard prominent. Dramatic chiaroscuro lighting, heroic composition, 8k detail, historically accurate, cinematic atmosphere. Renaissance master technique, rich oil painting textures.",
    "historical_context": "Caesar's decision to cross the Rubicon with his legion was illegal and precipitated the Roman Civil War"
  },
  {
    "scene_number": 3,
    "scene_type": "visual",
    "script_snippet": "The clash of bronze echoes across the valley...",
    "visual_prompt": "Epic battle scene in Romantic era oil painting style. Aerial view of the Battle of Cannae, 216 BC. Carthaginian forces in crescent formation enveloping Roman legions in the center. Mass of 100,000+ soldiers, dust clouds rising, Carthaginian war elephants visible on flanks. Bronze weapons catching sunlight, red and white of Roman standards contrasting with Carthaginian purple. August heat, southern Italian landscape, dramatic sky. Painted in the style of Peter Paul Rubens' battle scenes - dynamic movement, muscular figures, theatrical lighting, rich colors, grand scale, 8k resolution.",
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

- Generate approximately ${targetSceneCount} scenes to match the script duration
- Each visual_prompt must be 50-100 words (detailed enough for quality image generation)
- Script_snippet should be the actual text from the script this scene illustrates
- Historical_context is optional but valuable for understanding
- Space scenes evenly throughout the script to maintain consistent pacing
- Maintain chronological order matching the script`;

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
  "cartoon, anime, manga, sketch, vector art, minimalist, flat design, modern clothing, contemporary setting, smartphones, blur, distorted faces, low quality, text, watermark, logo, abstract, surrealist, anachronistic, digital art style, 3D render, gore, blood, open wounds, graphic violence, injuries, disfigurement, illness, disease symptoms, suffering, graphic medical procedures, dismemberment, mutilation, decapitation, severed limbs, visible internal organs, graphic bodily harm, torture scenes, close-up wounds, bleeding, graphic death scenes, balance sheet, infographic, chart, graph, data visualization, comparison diagram, statistics, spreadsheet, timeline diagram";

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
  "satellite imagery, modern map, GPS, Google Maps, digital cartography, contemporary borders, modern countries, neon colors, sans-serif fonts, photographs, 3D terrain, realistic rendering, highways, airports, modern infrastructure, minimalist, clean design, vector graphics, web map, topographic precision, modern symbols, bright colors, sharp edges, sterile, computational, balance sheet, comparison map, before after, side by side, infographic, chart, graph, data visualization, statistics, numbers overlay, text overlay, figures on map, people on map, human figures, soldiers on map";
