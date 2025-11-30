"use client";

import React from 'react';

/**
 * Development toolbar for debugging and development utilities
 * Only visible in development mode
 */
export function DevelopmentToolbar() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
      <div className="bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <div className="font-mono">DEV MODE</div>
      </div>
    </div>
  );
}
