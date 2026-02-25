import { NextRequest } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import { validationError } from './error-response';

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns the validated data or a 400 error response.
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T | Response> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return validationError(messages);
    }
    return validationError('Invalid request body');
  }
}

/**
 * Type guard to check if validateRequest returned an error Response.
 */
export function isValidationError(result: unknown): result is Response {
  return result instanceof Response;
}

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

export const ScriptAnalysisSchema = z.object({
  script: z.string().min(1, 'Script is required'),
});

export const TacticalResearchSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  targetDuration: z.number().int().min(1).max(60).optional(),
});

export const IdentifyCharactersSchema = z.object({
  script: z.string().min(1, 'Script is required'),
  era: z.enum(['Roman Republic', 'Roman Empire', 'Medieval', 'Napoleonic', 'Prussian', 'Other']).optional(),
});

export const ArtStyleSchema = z.object({
  era: z.enum(['Roman Republic', 'Roman Empire', 'Medieval', 'Napoleonic', 'Prussian', 'Other']),
  title: z.string().min(1, 'Title is required').max(500),
});

export const FinalScriptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  research: z.string().min(1, 'Research data is required'),
  targetDuration: z.number().min(1),
  scriptDuration: z.enum(['short', 'medium', 'long']).optional(),
});

export const PolishScriptSchema = z.object({
  rawScript: z.string().min(1, 'Raw script is required'),
  auditReport: z.string().min(1, 'Audit report is required'),
  targetDuration: z.number().min(1),
});

export const AuditScriptSchema = z.object({
  script: z.string().min(100, 'Script must be at least 100 characters'),
});

export const SceneImageSchema = z.object({
  scene: z.object({
    scene_number: z.number(),
    visual_prompt: z.string().optional(),
    scene_type: z.string().optional(),
    shot_type: z.string().optional(),
  }),
  artStyle: z.string().optional(),
  characterReferences: z.array(z.object({
    name: z.string(),
    visual_description: z.string(),
    reference_image_url: z.string(),
  })).optional(),
});

export const CharacterReferenceSchema = z.object({
  character: z.object({
    id: z.string(),
    name: z.string(),
    visual_description: z.string(),
    historical_period_appearance: z.string(),
  }).passthrough(),
});

export const RepurposeExtractSchema = z.object({
  url: z.string().min(1, 'URL is required'),
});

export const RepurposeAnalyzeSchema = z.object({
  extraction: z.object({
    transcript: z.object({
      text: z.string().min(1),
      wordCount: z.number(),
    }),
  }),
});

export const RepurposeRewriteSchema = z.object({
  extraction: z.object({}).passthrough(),
  analysis: z.object({}).passthrough(),
});

export const RepurposeTitlesSchema = z.object({
  script: z.string().min(1, 'Script is required'),
});
