import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 5;

/**
 * POST /api/generate/narrative-outline
 *
 * @deprecated This endpoint is deprecated. The War Room system generates
 * the tactical outline directly within the /api/generate/final-script endpoint.
 *
 * Use /api/generate/final-script instead, which handles:
 * 1. Hook generation
 * 2. Master tactical outline (10 points)
 * 3. Recursive script batches (7 x 800 words)
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint is deprecated',
      message:
        'The narrative outline is now generated as part of the recursive script flow. ' +
        'Use /api/generate/final-script instead, which generates the hook, tactical outline, ' +
        'and full script in a single call.',
      migration: {
        old_endpoint: '/api/generate/narrative-outline',
        new_endpoint: '/api/generate/final-script',
        changes: [
          'Outline is now a 10-point tactical structure instead of 3-act narrative',
          'Generated automatically within final-script flow',
          'Returns as part of RecursiveScript.master_outline',
        ],
      },
    },
    { status: 410 } // 410 Gone - resource no longer available
  );
}
