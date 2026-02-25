import { NextResponse } from 'next/server';

/**
 * Create a standardized validation error response (400).
 */
export function validationError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Create a standardized configuration error response (500).
 */
export function configError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Create a standardized internal error response (500).
 * Extracts error message from Error objects safely.
 */
export function internalError(action: string, error: unknown) {
  const details = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json(
    { success: false, error: `Failed to ${action}`, details },
    { status: 500 }
  );
}
