// ============================================================================
// CHARACTER IDENTIFICATION & PORTRAIT PROMPTS
// ============================================================================

import type { HistoricalEra } from '@/lib/types';

export const CHARACTER_IDENTIFICATION_PROMPT = (
  script: string,
  era: HistoricalEra
) => `### ROLE

You are a **Historical Figure Analyst** specialized in identifying key characters for visual documentary production. Your task is to extract historical figures whose names appear explicitly in the script and provide detailed visual descriptions suitable for AI portrait generation.

CRITICAL: You must ONLY identify characters whose names (first name, last name, or full name) appear explicitly in the script text. Do NOT infer or guess characters based on historical context, roles, or groups mentioned.

### OBJECTIVE

Analyze the script and identify historical figures whose names are explicitly written in the script text. For each character, provide detailed visual descriptions suitable for portrait generation.

### INPUT SCRIPT

${script}

### HISTORICAL ERA

${era}

### REQUIREMENTS

For each identified character, provide:

1. **Basic Information:**
   - name: Full historical name
   - role: Their role in the narrative (e.g., "Roman General", "Persian King", "Mongol Warlord")
   - description: Brief character summary (2-3 sentences)
   - notable_actions: Array of key actions they take in the script

2. **Visual Description (CRITICAL for portrait generation):**
   - visual_description: Detailed physical appearance description (150-200 words) including:
     - Estimated age and build (based on historical records if known)
     - Facial features (if historically documented)
     - Expression and demeanor befitting their role
     - Any distinctive physical characteristics

3. **Historical Period Appearance:**
   - historical_period_appearance: Era-appropriate clothing/armor description including:
     - Specific garments, armor types, headwear appropriate for their rank and role
     - Materials and colors historically accurate for their position
     - Accessories, regalia, and symbols of their status

4. **Prominence Level:**
   - prominence: "primary" (commanders, central figures with 5+ mentions) or "secondary" (mentioned but not central)

### ERA-SPECIFIC VISUAL GUIDELINES

**Roman Republic/Empire:**
- Generals: Muscle cuirass (bronze or iron), crimson paludamentum cloak, laurel wreath or plumed Attic helmet, pteruges (leather strips)
- Emperors/Senators: Toga praetexta (white with purple border), ceremonial armor for military occasions
- Soldiers: Lorica segmentata, rectangular scutum, gladius at right hip

**Medieval (5th-15th century):**
- Kings: Crown, ermine-trimmed robes over chainmail or plate, ceremonial sword
- Knights: Full plate armor (15th c) or chainmail with surcoat (earlier), heraldic devices, great helm/bascinet/sallet
- Commanders: Plate armor with gold inlay, cape, plumed helmet

**Napoleonic (1789-1815):**
- French Officers: Bicorne hat, elaborately decorated blue coat with gold frogging, epaulettes, white breeches
- Generals: Grand uniform with medals, ceremonial sash, cavalry boots
- Other Nations: Distinctive national colors (British red, Russian green, Austrian white)

**Prussian/German (19th century):**
- Officers: Picklehaube helmet (spiked), Prussian blue uniform with red piping
- Generals: Iron Cross decorations, fur-trimmed collar, ceremonial sword
- Cavalry: Distinctive hussar uniforms with braiding

**Mongol/Steppe:**
- Khans: Deel robe with gold embroidery, fur-lined cap with earflaps, ornate belt
- Warriors: Lamellar armor, composite bow, fur hat

### OUTPUT FORMAT

Return a JSON object (and ONLY valid JSON, no markdown code blocks):

{
  "characters": [
    {
      "name": "Full Name",
      "role": "Historical role",
      "description": "Brief narrative description",
      "notable_actions": ["action1", "action2"],
      "visual_description": "Detailed physical appearance for portrait generation - 150-200 words describing age, build, facial features, expression, and any distinctive characteristics...",
      "historical_period_appearance": "Era-accurate clothing and accessories - specific garments, armor, colors, materials appropriate for their rank and era...",
      "prominence": "primary"
    }
  ],
  "total_characters": 5,
  "primary_count": 2,
  "secondary_count": 3
}

### MODERN FIGURE EXCLUSION (CRITICAL)

Do NOT identify any modern or contemporary figures as characters, even if they are named in the script. This includes:
- Modern researchers, archaeologists, or historians
- Contemporary scholars or academics
- Authors, journalists, or documentary narrators
- Anyone from the modern era commenting on or analyzing the historical events

The script may quote or reference these people (e.g., "Historian John Smith argues..." or "Archaeologist Dr. Jane Doe discovered..."), but they are NOT characters in the story. Only identify historical figures from the era being depicted.

### CONSTRAINTS

- ONLY include individuals whose NAME (first name, last name, or full name) appears explicitly in the script text
- Do NOT infer or guess characters based on historical context, era, or groups
- If the script mentions groups like "Roman soldiers", "Spanish conquistadors", or "the Aztec army" without naming specific individuals, do NOT identify any characters for those groups
- A valid name must be an actual person's name that appears in the script, not a title or role
- Distinguish between primary (5+ mentions or central role) and secondary characters
- Visual descriptions must be specific enough for AI image generation
- Historical accuracy is paramount - research appropriate period dress
- For figures with known portraits (Caesar, Napoleon, Alexander, etc.), incorporate historically documented features
- Limit to 10 characters maximum (prioritize by prominence)
- NO fictional characters - only historical figures explicitly named in the script
- Descriptions should be suitable for dignified portrait generation (no violence, gore, or inappropriate content)
- If no named individuals are found in the script, return an empty characters array`;

// ============================================================================
// CHARACTER PORTRAIT GENERATION PROMPT
// ============================================================================

export const CHARACTER_PORTRAIT_STYLE_SUFFIX = `

STYLE REQUIREMENTS (HISTORICAL PORTRAIT - CRITICAL):
- High-fidelity digital portrait illustration in classical oil painting style
- Sharp focus on face and upper body, museum-quality detail
- Dramatic chiaroscuro lighting reminiscent of Rembrandt or Caravaggio
- Heroic, dignified composition suitable for historical documentation
- 8k resolution, photorealistic quality with painterly brushstrokes
- Historically accurate costume, armor, and accessories for the era
- Detailed, expressive face with realistic features and intelligent eyes
- Classical portrait composition (bust or 3/4 view)
- Period-appropriate background (subtle, non-distracting - neutral tones or architectural elements)
- Warm, rich color palette befitting old master paintings`;

export const NEGATIVE_PROMPT_PORTRAIT =
  'cartoon, anime, manga, sketch, vector art, modern clothing, contemporary elements, blur, distorted, low quality, text, watermark, logo, full body shot, multiple people, group shot, crowd, nudity, gore, violence, weapons pointed at viewer, frame, border, cropped face, deformed face, extra limbs, bad anatomy, disfigured, poorly drawn face, mutation, mutated, ugly, blurry, bad art, bad proportions';
