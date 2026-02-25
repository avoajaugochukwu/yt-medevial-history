"use client";

import React, { useState } from 'react';
import type { StoryboardScene } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SceneEditor } from './scene-editor';
import {
  Grid3x3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Edit,
  Map,
  Loader2,
  Camera,
  Bell,
} from 'lucide-react';
import { useStoryboardPipeline } from '@/lib/hooks/use-storyboard-pipeline';

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Scene {scene.scene_number}</Badge>
            {scene.scene_type === 'map' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Map className="h-3 w-3" />
                Map
              </Badge>
            )}
            {scene.scene_type === 'subscribe' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                Subscribe
              </Badge>
            )}
            {scene.shot_type && scene.scene_type !== 'map' && scene.scene_type !== 'subscribe' && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Camera className="h-3 w-3" />
                {scene.shot_type}
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

        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
          {scene.scene_type === 'subscribe' ? (
            <div className="flex flex-col items-center justify-center h-full bg-red-50">
              <Bell className="h-12 w-12 text-red-500 mb-2" />
              <span className="text-sm font-medium text-red-600">Subscribe CTA</span>
              <span className="text-xs text-red-400">Replace in video editing</span>
            </div>
          ) : scene.image_url ? (
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

        <p className="text-sm text-gray-600 line-clamp-2">{scene.script_snippet}</p>
      </CardContent>
    </Card>
  );
}

export function StoryboardGrid() {
  const {
    storyboardScenes,
    sceneGenerationProgress,
    completedScenes,
    errorScenes,
    allScenesCompleted,
    isAnalyzing,
    isGenerating,
    showPlaceholders,
    regenerateFailedScenes,
  } = useStoryboardPipeline();

  const [selectedScene, setSelectedScene] = useState<StoryboardScene | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
              ? 'Creating scene images'
              : 'Click on any scene to view details or regenerate the image'}
        </p>

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
          ? storyboardScenes.map((scene) => (
              <SceneCardSkeleton key={scene.scene_number} sceneNumber={scene.scene_number} />
            ))
          : storyboardScenes.map((scene) => (
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
