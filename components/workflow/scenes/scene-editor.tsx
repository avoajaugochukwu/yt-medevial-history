"use client";

import React, { useState } from 'react';
import { useSessionStore } from '@/lib/store';
import { StoryboardScene, CinematicShotType } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Image as ImageIcon,
  Map,
  Camera,
  Bell,
} from 'lucide-react';

interface SceneEditorProps {
  scene: StoryboardScene | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const SHOT_TYPES: CinematicShotType[] = [
  'Establishing Wide',
  'Medium Action',
  'Close-Up',
  'Extreme Close-Up',
  'High Angle',
  'Low Angle',
  'POV',
];

export function SceneEditor({ scene, isOpen, onClose, onNavigate }: SceneEditorProps) {
  const {
    updateStoryboardScene,
    storyboardScenes,
  } = useSessionStore();

  const [editedPrompt, setEditedPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editedShotType, setEditedShotType] = useState<CinematicShotType | undefined>(undefined);

  React.useEffect(() => {
    if (scene) {
      setEditedPrompt(scene.visual_prompt);
      setEditedShotType(scene.shot_type);
      setIsEditing(false);
    }
  }, [scene]);

  const handleRegenerate = async () => {
    if (!scene) return;

    setIsRegenerating(true);
    updateStoryboardScene(scene.scene_number, {
      is_regenerating: true,
      generation_status: 'generating',
    });

    try {
      const response = await fetch('/api/generate/scene-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene: {
            ...scene,
            visual_prompt: isEditing ? editedPrompt : scene.visual_prompt,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate scene');
      }

      const { image_url, prompt_used } = await response.json();
      
      updateStoryboardScene(scene.scene_number, {
        image_url,
        visual_prompt: prompt_used,
        generation_status: 'completed',
        is_regenerating: false,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Scene regeneration error:', error);
      updateStoryboardScene(scene.scene_number, {
        generation_status: 'error',
        error_message: 'Failed to regenerate image',
        is_regenerating: false,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSavePrompt = () => {
    if (scene) {
      updateStoryboardScene(scene.scene_number, {
        visual_prompt: editedPrompt,
      });
      handleRegenerate();
    }
  };

  const handleShotTypeChange = async (newShotType: CinematicShotType) => {
    if (!scene) return;

    setEditedShotType(newShotType);
    updateStoryboardScene(scene.scene_number, { shot_type: newShotType });

    // Trigger regeneration with new shot type
    setIsRegenerating(true);
    updateStoryboardScene(scene.scene_number, {
      is_regenerating: true,
      generation_status: 'generating',
    });

    try {
      const response = await fetch('/api/generate/scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: { ...scene, shot_type: newShotType },
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate');

      const { image_url, prompt_used } = await response.json();

      updateStoryboardScene(scene.scene_number, {
        image_url,
        visual_prompt: prompt_used,
        shot_type: newShotType,
        generation_status: 'completed',
        is_regenerating: false,
      });
    } catch (error) {
      console.error('Shot type change error:', error);
      updateStoryboardScene(scene.scene_number, {
        generation_status: 'error',
        error_message: 'Failed to regenerate with new shot type',
        is_regenerating: false,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!scene) return null;

  const currentIndex = storyboardScenes.findIndex(s => s.scene_number === scene.scene_number);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < storyboardScenes.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Scene {scene.scene_number}</span>
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
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('prev')}
                disabled={!hasPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('next')}
                disabled={!hasNext}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scene Image */}
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {scene.scene_type === 'subscribe' ? (
              // Subscribe placeholder display
              <div className="flex flex-col items-center justify-center h-full bg-red-50">
                <Bell className="h-16 w-16 text-red-500 mb-2" />
                <span className="text-lg font-medium text-red-600">Subscribe CTA Placeholder</span>
                <span className="text-sm text-red-400 mt-1">Replace with your subscribe animation in video editing</span>
              </div>
            ) : isRegenerating ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" text="Regenerating scene..." />
              </div>
            ) : scene.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={scene.image_url}
                alt={`Scene ${scene.scene_number}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ImageIcon className="h-16 w-16 mb-2" />
                <span>No image generated</span>
              </div>
            )}

            {scene.generation_status === 'error' && (
              <div className="absolute inset-x-0 bottom-0 bg-red-500 text-white p-2 text-sm">
                {scene.error_message || 'Generation failed'}
              </div>
            )}
          </div>

          {/* Script Snippet */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Scene Script:</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">{scene.script_snippet}</p>
            </div>
          </div>

          {/* Map Data (if map scene) */}
          {scene.scene_type === 'map' && scene.map_data && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Map Information:</label>
              <div className="p-3 bg-blue-50 rounded-md space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Location:</span> {scene.map_data.location}
                  </div>
                  <div>
                    <span className="font-medium">Time Period:</span> {scene.map_data.time_period}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Focus:</span> {scene.map_data.geographic_focus}
                </div>
                {scene.map_data.territories && scene.map_data.territories.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Territories:</span>{' '}
                    {scene.map_data.territories.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shot Type Selector (for visual scenes only - not maps or subscribe) */}
          {scene.scene_type !== 'map' && scene.scene_type !== 'subscribe' && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Shot Type:
              </label>
              <Select
                value={editedShotType || scene.shot_type || ''}
                onValueChange={(value) => handleShotTypeChange(value as CinematicShotType)}
                disabled={isRegenerating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select shot type..." />
                </SelectTrigger>
                <SelectContent>
                  {SHOT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Changing shot type will regenerate the image with the new framing.
              </p>
            </div>
          )}

          {/* Visual Prompt (not shown for subscribe scenes) */}
          {scene.scene_type !== 'subscribe' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Visual Description:</label>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Description
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Describe the visual scene..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSavePrompt}
                      disabled={isRegenerating}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save & Regenerate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedPrompt(scene.visual_prompt);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">{scene.visual_prompt}</p>
                </div>
              )}
            </div>
          )}

          {/* Subscribe Scene Info */}
          {scene.scene_type === 'subscribe' && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-700 mb-2">Subscribe CTA Placeholder</h4>
              <p className="text-sm text-red-600">
                This is a placeholder for your subscribe call-to-action. Replace this scene with your own subscribe animation or overlay in your video editing software.
              </p>
            </div>
          )}

        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          {scene.scene_type !== 'subscribe' && (
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating || isEditing}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Regenerate Image
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}