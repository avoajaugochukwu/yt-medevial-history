// ============================================================================
// VISUAL STYLE PROMPTS - Scene Images, Maps, Art Style Generation
// ============================================================================

import type { HistoricalEra } from '@/lib/types';

// ============================================================================
// SCENE IMAGE GENERATION - STYLE INJECTION
// ============================================================================

// Fixed style suffix generator - uses consistent digital illustration style for all scenes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const generateStyleSuffix = (_artStyle?: string): string => {
  // Use fixed high-fidelity digital illustration style for all scenes
  return `

STYLE REQUIREMENTS (CRITICAL):
- High-fidelity digital illustration
- Sharp focus, unreal engine 5, octane render
- Detailed lineage, dramatic lighting
- 8k resolution
- Historically accurate costume, architecture, and props
- Realistic faces and anatomy, detailed expressions
- Atmospheric perspective and depth

NEGATIVE PROMPTS (AVOID):
- NO cartoon, anime, vector art, or minimalist styles
- NO modern clothing, anachronistic elements, or smartphones
- NO blur, distortion, or low quality
- NO text, watermarks, or logos
- NO abstract or surrealist elements
- NO frame, border, or picture frame around the image`;
};

// Legacy export for backward compatibility (uses default style)
export const OIL_PAINTING_STYLE_SUFFIX = generateStyleSuffix();

export const NEGATIVE_PROMPT_HISTORICAL =
  "cartoon, anime, manga, sketch, vector art, minimalist, flat design, modern clothing, contemporary setting, smartphones, blur, distorted faces, low quality, text, watermark, logo, abstract, surrealist, anachronistic, digital art style, 3D render, gore, blood, open wounds, graphic violence, injuries, disfigurement, illness, disease symptoms, suffering, graphic medical procedures, dismemberment, mutilation, decapitation, severed limbs, visible internal organs, graphic bodily harm, torture scenes, close-up wounds, bleeding, graphic death scenes, balance sheet, infographic, chart, graph, data visualization, comparison diagram, statistics, spreadsheet, timeline diagram, nudity, naked, nude, partial nudity, bare chest, bare breasts, exposed skin, revealing clothing, provocative pose, suggestive, sexual, sensual, erotic, NSFW, adult content, cleavage, underwear, lingerie, bikini, shirtless, topless, scantily clad, seductive, intimate, romantic embrace, kissing, corpse, rotting, decay, maggots, vomit, feces, urine, bodily fluids, pus, festering, pustules, boils, rash, sores, deformed body, grotesque, horror, nightmare, demonic, hellscape, disturbing, frame, border, picture frame, ornate frame, decorative border, framed artwork";

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
  "satellite imagery, modern map, GPS, Google Maps, digital cartography, contemporary borders, modern countries, neon colors, sans-serif fonts, photographs, 3D terrain, realistic rendering, highways, airports, modern infrastructure, minimalist, clean design, vector graphics, web map, topographic precision, modern symbols, bright colors, sharp edges, sterile, computational, balance sheet, comparison map, before after, side by side, infographic, chart, graph, data visualization, statistics, numbers overlay, text overlay, figures on map, people on map, human figures, soldiers on map, nudity, naked, nude, revealing clothing, suggestive, sexual, NSFW, gore, blood, corpse, rotting, decay, grotesque, horror, disturbing, frame, border, picture frame, ornate frame, decorative border";
