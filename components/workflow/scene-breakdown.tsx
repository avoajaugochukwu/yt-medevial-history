"use client";

import React from 'react';
import { useSessionStore } from '@/lib/store';
import { StoryboardGrid } from './scenes/storyboard-grid';

export function SceneBreakdown() {
  const { script } = useSessionStore();

  // If no script, show placeholder
  if (!script) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Please generate a script first before creating scenes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-serif mb-2">Scene Generation</h2>
        <p className="text-muted-foreground">
          Creating cinematic historical storyboard with oil painting style
        </p>
      </div>

      <StoryboardGrid />
    </div>
  );
}
