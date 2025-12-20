"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '@/lib/store';
import { StoryboardScene, Scene } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SceneEditor } from './scene-editor';
import { countWords } from '@/lib/utils/word-count';
import {
  Grid3x3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Edit,
  Map,
  Loader2,
} from 'lucide-react';

// Batch size for concurrent image generation
const GENERATION_BATCH_SIZE = 20;

type AnalysisPhase = 'idle' | 'analyzing' | 'complete';
type GenerationPhase = 'idle' | 'generating' | 'complete';

// Skeleton card for scenes being analyzed
function SceneCardSkeleton({ sceneNumber }: { sceneNumber: number }) {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Scene {sceneNumber}</Badge>
          <div className="w-4 h-4 bg-gray-200 rounded-full" />
        </div>
        <div className="aspect-video bg-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

// Scene card with loading states
function SceneCard({
  scene,
  onClick,
}: {
  scene: StoryboardScene;
  onClick: () => void;
}) {
  const isGenerating = scene.generation_status === 'generating';
  const isPending = scene.generation_status === 'pending';
  const isCompleted = scene.generation_status === 'completed';
  const isError = scene.generation_status === 'error';

  return (
    <Card
      className={`
        cursor-pointer transition-all hover:shadow-lg
        ${isError ? 'ring-2 ring-red-500' : ''}
        ${isGenerating ? 'ring-2 ring-blue-400' : ''}
        ${scene.is_regenerating ? 'opacity-75' : ''}
      `}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Scene Number and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Scene {scene.scene_number}</Badge>
            {scene.scene_type === 'map' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Map className="h-3 w-3" />
                Map
              </Badge>
            )}
          </div>
          {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
          {isError && <AlertCircle className="h-4 w-4 text-red-500" />}
          {isGenerating && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          )}
          {isPending && <div className="h-4 w-4 bg-gray-300 rounded-full" />}
        </div>

        {/* Scene Image */}
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
          {scene.image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scene.image_url}
                alt={`Scene ${scene.scene_number}`}
                className="w-full h-full object-cover"
                onError={() =>
                  console.error(`Failed to load image for scene ${scene.scene_number}`)
                }
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                <Edit className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="text-xs text-gray-500 mt-2">Generating...</span>
            </div>
          ) : isPending ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ImageIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">Pending</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ImageIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Scene Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{scene.script_snippet}</p>
      </CardContent>
    </Card>
  );
}

export function StoryboardGrid() {
  const {
    script,
    scenes,
    setScenes,
    storyboardScenes,
    setStoryboardScenes,
    updateStoryboardScene,
    setSceneGenerationProgress,
    sceneGenerationProgress,
    historicalTopic,
    addError,
    clearErrors,
  } = useSessionStore();

  const [selectedScene, setSelectedScene] = useState<StoryboardScene | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('idle');
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle');

  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Utility function to chunk array into batches
  const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  // Create placeholder scenes for immediate display
  const createPlaceholderScenes = (count: number): StoryboardScene[] => {
    return Array.from({ length: count }, (_, i) => ({
      scene_number: i + 1,
      script_snippet: '',
      visual_prompt: '',
      generation_status: 'pending' as const,
      image_url: undefined,
    }));
  };

  // Generate a single scene image
  const generateSceneImage = async (scene: StoryboardScene): Promise<boolean> => {
    if (!isMountedRef.current) return false;

    updateStoryboardScene(scene.scene_number, { generation_status: 'generating' });

    try {
      const response = await fetch('/api/generate/scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene,
          artStyle: historicalTopic?.artStyle,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate scene image');

      const data = await response.json();
      console.log(`Scene ${scene.scene_number} generated with ${data.style} style`);

      if (isMountedRef.current) {
        updateStoryboardScene(scene.scene_number, {
          image_url: data.image_url,
          visual_prompt: data.prompt_used,
          generation_status: 'completed',
        });
      }
      return true;
    } catch (error) {
      console.error(`Scene ${scene.scene_number} generation error:`, error);
      if (isMountedRef.current) {
        updateStoryboardScene(scene.scene_number, {
          generation_status: 'error',
          error_message: 'Failed to generate image',
        });
      }
      return false;
    }
  };

  // Generate all scene images in batches
  const generateAllSceneImages = async (scenesToGenerate: StoryboardScene[]) => {
    if (!isMountedRef.current) return;

    setGenerationPhase('generating');

    const batches = chunkArray(scenesToGenerate, GENERATION_BATCH_SIZE);
    console.log(
      `[Storyboard] Starting batched generation: ${scenesToGenerate.length} scenes in ${batches.length} batches of ${GENERATION_BATCH_SIZE}`
    );

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (!isMountedRef.current) break;

      const batch = batches[batchIndex];
      console.log(
        `[Storyboard] Processing batch ${batchIndex + 1}/${batches.length} (scenes ${batch[0].scene_number}-${batch[batch.length - 1].scene_number})`
      );

      // Generate all scenes in this batch concurrently
      const batchPromises = batch.map((scene) => generateSceneImage(scene));

      // Wait for entire batch to complete before starting next batch
      await Promise.allSettled(batchPromises);
    }

    console.log('[Storyboard] Batched generation complete');
    if (isMountedRef.current) {
      setGenerationPhase('complete');
    }
  };

  // Analyze script in background
  const analyzeScriptInBackground = async (): Promise<StoryboardScene[] | null> => {
    if (!script || !isMountedRef.current) return null;

    clearErrors();
    setAnalysisPhase('analyzing');

    const scriptContent = script.polished_content || script.content;
    const wordCount = countWords(scriptContent);
    const estimatedDurationMinutes = Math.ceil(wordCount / 150);
    const expectedSceneCount = Math.round((estimatedDurationMinutes * 60) / 6);

    // Create placeholder scenes immediately
    const placeholders = createPlaceholderScenes(expectedSceneCount);
    setStoryboardScenes(placeholders);

    try {
      const response = await fetch('/api/analyze/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptContent }),
      });

      if (!response.ok) throw new Error('Failed to analyze script');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('Response body is not readable');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            if (data.type === 'complete' && isMountedRef.current) {
              // Convert scenes to storyboard scenes
              const realScenes: StoryboardScene[] = data.scenes.map((scene: Scene) => ({
                ...scene,
                generation_status: 'pending' as const,
                image_url: undefined,
              }));

              setScenes(data.scenes);
              setStoryboardScenes(realScenes);
              setAnalysisPhase('complete');
              return realScenes;
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Unknown error during scene analysis');
            }
          } catch {
            // Continue processing other lines
          }
        }
      }
    } catch (error) {
      console.error('Script analysis error:', error);
      if (isMountedRef.current) {
        addError('Failed to analyze script. Please try again.');
        setAnalysisPhase('complete');
      }
    }

    return null;
  };

  // Main pipeline effect
  useEffect(() => {
    isMountedRef.current = true;

    const runPipeline = async () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      // Case 1: Already have storyboard scenes with some images - do nothing
      if (storyboardScenes.length > 0 && storyboardScenes.some((s) => s.image_url)) {
        // Check if there are pending scenes that need generation
        const pendingScenes = storyboardScenes.filter(
          (s) => s.generation_status === 'pending' || s.generation_status === 'error'
        );
        if (pendingScenes.length > 0) {
          await generateAllSceneImages(pendingScenes);
        }
        return;
      }

      // Case 2: Have scenes but no storyboard - generate images
      if (scenes.length > 0 && storyboardScenes.length === 0) {
        const storyboardFromScenes: StoryboardScene[] = scenes.map((s) => ({
          ...s,
          generation_status: 'pending' as const,
          image_url: undefined,
        }));
        setStoryboardScenes(storyboardFromScenes);
        await generateAllSceneImages(storyboardFromScenes);
        return;
      }

      // Case 3: No scenes - analyze script first, then generate
      if (scenes.length === 0 && script) {
        const analyzedScenes = await analyzeScriptInBackground();
        if (analyzedScenes && isMountedRef.current) {
          await generateAllSceneImages(analyzedScenes);
        }
      }
    };

    runPipeline();

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track progress
  const completedScenes = storyboardScenes.filter(
    (s) => s.generation_status === 'completed'
  ).length;
  const errorScenes = storyboardScenes.filter(
    (s) => s.generation_status === 'error'
  ).length;
  const generatingScenes = storyboardScenes.filter(
    (s) => s.generation_status === 'generating'
  ).length;
  const allScenesCompleted = completedScenes === storyboardScenes.length && storyboardScenes.length > 0;

  // Update progress in store
  useEffect(() => {
    if (storyboardScenes.length > 0) {
      const progress = (completedScenes / storyboardScenes.length) * 100;
      setSceneGenerationProgress(progress);
    }
  }, [completedScenes, storyboardScenes.length, setSceneGenerationProgress]);

  const openSceneEditor = (scene: StoryboardScene) => {
    setSelectedScene(scene);
    setIsEditorOpen(true);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedScene) return;

    const currentIndex = storyboardScenes.findIndex(
      (s) => s.scene_number === selectedScene.scene_number
    );

    if (direction === 'prev' && currentIndex > 0) {
      setSelectedScene(storyboardScenes[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < storyboardScenes.length - 1) {
      setSelectedScene(storyboardScenes[currentIndex + 1]);
    }
  };

  const regenerateFailedScenes = async () => {
    const failedScenes = storyboardScenes.filter((s) => s.generation_status === 'error');
    await generateAllSceneImages(failedScenes);
  };

  // Determine display state
  const isAnalyzing = analysisPhase === 'analyzing';
  const isGenerating = generationPhase === 'generating' || generatingScenes > 0;
  const showPlaceholders = isAnalyzing && storyboardScenes.every((s) => !s.script_snippet);

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">
          {isAnalyzing
            ? 'Analyzing Script...'
            : isGenerating
              ? 'Generating Images...'
              : 'Review Your Storyboard'}
        </h3>
        <p className="text-gray-600">
          {isAnalyzing
            ? 'Breaking down your script into scenes'
            : isGenerating
              ? `Creating images in batches of ${GENERATION_BATCH_SIZE}`
              : 'Click on any scene to view details or regenerate the image'}
        </p>

        {/* Progress Bar */}
        {(isAnalyzing || isGenerating) && storyboardScenes.length > 0 && (
          <div className="max-w-md mx-auto mt-4">
            <Progress value={sceneGenerationProgress} className="h-2" />
            <p className="text-sm text-gray-500 mt-1">
              {completedScenes} / {storyboardScenes.length} scenes completed
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant={allScenesCompleted ? 'default' : 'outline'}>
            <Grid3x3 className="h-3 w-3 mr-1" />
            {completedScenes} / {storyboardScenes.length} scenes
          </Badge>
          {isAnalyzing && (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Analyzing
            </Badge>
          )}
          {isGenerating && !isAnalyzing && (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Generating
            </Badge>
          )}
          {errorScenes > 0 && (
            <Button variant="destructive" size="sm" onClick={regenerateFailedScenes}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry {errorScenes} Failed
            </Button>
          )}
        </div>
      </div>

      {/* Storyboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {showPlaceholders
          ? // Show skeleton cards during initial analysis
            storyboardScenes.map((scene) => (
              <SceneCardSkeleton key={scene.scene_number} sceneNumber={scene.scene_number} />
            ))
          : // Show actual scene cards
            storyboardScenes.map((scene) => (
              <SceneCard
                key={scene.scene_number}
                scene={scene}
                onClick={() => openSceneEditor(scene)}
              />
            ))}
      </div>

      {/* Scene Editor Dialog */}
      <SceneEditor
        scene={selectedScene}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedScene(null);
        }}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
