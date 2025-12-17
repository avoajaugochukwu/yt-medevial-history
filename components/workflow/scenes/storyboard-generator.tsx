"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useSessionStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StoryboardScene } from '@/lib/types';
import { Film, CheckCircle, AlertCircle } from 'lucide-react';

interface StoryboardGeneratorProps {
  onComplete?: () => void;
}

export function StoryboardGenerator({ onComplete }: StoryboardGeneratorProps) {
  const {
    scenes,
    storyboardScenes,
    setStoryboardScenes,
    updateStoryboardScene,
    setSceneGenerationProgress,
    sceneGenerationProgress,
    historicalTopic,
  } = useSessionStore();

  const [generatingScenes, setGeneratingScenes] = useState(false);
  const [currentGeneratingScene, setCurrentGeneratingScene] = useState(0);
  const hasGeneratedScenesRef = useRef(false);

  const generateSceneImage = async (scene: StoryboardScene) => {
    try {
      updateStoryboardScene(scene.scene_number, {
        generation_status: 'generating',
      });

      const response = await fetch('/api/generate/scene-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene,
          artStyle: historicalTopic?.artStyle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scene image');
      }

      const data = await response.json();
      console.log(`Scene ${scene.scene_number} generated with ${data.style} style`);

      updateStoryboardScene(scene.scene_number, {
        image_url: data.image_url,
        visual_prompt: data.prompt_used,
        generation_status: 'completed',
      });

      return true;
    } catch (error) {
      console.error(`Scene ${scene.scene_number} generation error:`, error);
      updateStoryboardScene(scene.scene_number, {
        generation_status: 'error',
        error_message: 'Failed to generate image',
      });
      return false;
    }
  };

  const generateAllScenes = async () => {
    hasGeneratedScenesRef.current = true;
    setGeneratingScenes(true);

    // Initialize storyboard scenes from regular scenes
    const initialStoryboardScenes: StoryboardScene[] = scenes.map((scene) => ({
      ...scene,
      generation_status: 'pending',
      image_url: undefined, // Ensure image_url is undefined initially
    }));
    setStoryboardScenes(initialStoryboardScenes);

    // Call onComplete callback to switch to reviewing phase
    if (onComplete) {
      onComplete();
    }

    // Generate all images in parallel for maximum speed
    const generationPromises = scenes.map((scene) =>
      generateSceneImage({
        ...scene,
        generation_status: 'pending',
      } as StoryboardScene)
    );

    // Wait for all generations to complete
    await Promise.all(generationPromises);

    setGeneratingScenes(false);
  };

  useEffect(() => {
    if (!hasGeneratedScenesRef.current && scenes.length > 0 && storyboardScenes.length === 0) {
      generateAllScenes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedScenes = storyboardScenes.filter((s) => s.generation_status === 'completed').length;
  const errorScenes = storyboardScenes.filter((s) => s.generation_status === 'error').length;

  // Update progress tracking based on actual completed scenes
  useEffect(() => {
    if (storyboardScenes.length > 0) {
      setCurrentGeneratingScene(completedScenes);
      const progress = (completedScenes / storyboardScenes.length) * 100;
      setSceneGenerationProgress(progress);
    }
  }, [completedScenes, storyboardScenes.length, setCurrentGeneratingScene, setSceneGenerationProgress]);

  return (
    <Card className="p-8">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Film className="h-16 w-16 text-primary" />
            {generatingScenes && (
              <div className="absolute -bottom-1 -right-1">
                <div className="animate-ping absolute h-3 w-3 bg-primary/40 rounded-full"></div>
                <div className="h-3 w-3 bg-primary rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold font-serif">Generating Historical Storyboard</h3>
          <p className="text-muted-foreground">
            Creating cinematic {historicalTopic?.artStyle ? 'era-appropriate' : 'oil painting'} style visuals for each scene
          </p>
        </div>

        {/* Progress Information */}
        <div className="space-y-4 max-w-md mx-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {currentGeneratingScene} / {scenes.length} scenes
              </span>
            </div>
            <Progress value={sceneGenerationProgress} className="h-2" />
          </div>

          {/* Status Badges */}
          <div className="flex items-center justify-center gap-2">
            {completedScenes > 0 && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {completedScenes} Completed
              </Badge>
            )}
            {errorScenes > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errorScenes} Failed
              </Badge>
            )}
            {generatingScenes && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Generating
              </Badge>
            )}
          </div>
        </div>

        {/* Scene Grid Preview */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {storyboardScenes.map((scene) => (
            <div
              key={scene.scene_number}
              className={`
                aspect-video rounded border-2 flex items-center justify-center
                ${scene.generation_status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                ${scene.generation_status === 'generating' ? 'border-primary bg-primary/10' : ''}
                ${scene.generation_status === 'error' ? 'border-destructive bg-destructive/10' : ''}
                ${scene.generation_status === 'pending' ? 'border-border bg-muted/50' : ''}
              `}
            >
              {scene.generation_status === 'completed' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : scene.generation_status === 'generating' ? (
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              ) : scene.generation_status === 'error' ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <div className="text-xs text-muted-foreground">{scene.scene_number}</div>
              )}
            </div>
          ))}
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>Images are being generated with {historicalTopic?.artStyle ? 'AI-generated era-appropriate painting' : 'oil painting'} style.</p>
          <p>Each scene will feature historically accurate, dramatic visuals.</p>
          <p className="text-xs">Using nano-banana model (~7-10 seconds per scene)</p>
        </div>
      </div>
    </Card>
  );
}
