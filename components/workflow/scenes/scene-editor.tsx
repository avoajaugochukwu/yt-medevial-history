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
  ChevronDown,
  Save,
  X,
  Image as ImageIcon,
  Map,
  Camera,
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

function DisclosureSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-md">
      <button
        type="button"
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export function SceneEditor({ scene, isOpen, onClose, onNavigate }: SceneEditorProps) {
  const {
    updateStoryboardScene,
    storyboardScenes,
    historicalTopic,
    characterSession,
  } = useSessionStore();

  const [editedFullPrompt, setEditedFullPrompt] = useState('');
  const [isEditingFullPrompt, setIsEditingFullPrompt] = useState(false);
  const [editedShotType, setEditedShotType] = useState<CinematicShotType | undefined>(undefined);

  // Derive regeneration state from the store (per-scene) instead of local state
  const isRegenerating = scene?.is_regenerating ?? false;

  React.useEffect(() => {
    if (scene) {
      setEditedFullPrompt(scene.prompt_used || '');
      setEditedShotType(scene.shot_type);
      setIsEditingFullPrompt(false);
    }
  }, [scene]);

  const getCharacterReferences = () => {
    return characterSession?.characters
      .filter(
        (c) =>
          c.is_approved &&
          c.reference_generation_status === 'completed' &&
          c.reference_image_url
      )
      .map((c) => ({
        name: c.name,
        visual_description: c.visual_description,
        reference_image_url: c.reference_image_url!,
      })) || [];
  };

  const handleRegenerate = async (promptOverride?: string) => {
    if (!scene) return;

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
          scene,
          artStyle: historicalTopic?.artStyle,
          characterReferences: getCharacterReferences(),
          ...(promptOverride ? { prompt_override: promptOverride } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate scene');
      }

      const data = await response.json();

      updateStoryboardScene(scene.scene_number, {
        image_url: data.image_url,
        generation_status: 'completed',
        is_regenerating: false,
        prompt_used: data.prompt_used,
        negative_prompt_used: data.negative_prompt,
        model_used: data.model,
        style_category: data.style,
        character_conditioned: data.character_conditioned,
        character_count: data.character_count,
      });

      setIsEditingFullPrompt(false);
    } catch (error) {
      console.error('Scene regeneration error:', error);
      updateStoryboardScene(scene.scene_number, {
        generation_status: 'error',
        error_message: 'Failed to regenerate image',
        is_regenerating: false,
      });
    }
  };

  const handleSaveFullPrompt = () => {
    if (scene) {
      handleRegenerate(editedFullPrompt);
    }
  };

  const handleShotTypeChange = async (newShotType: CinematicShotType) => {
    if (!scene) return;

    setEditedShotType(newShotType);
    updateStoryboardScene(scene.scene_number, { shot_type: newShotType });

    // Trigger regeneration with new shot type
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
          artStyle: historicalTopic?.artStyle,
          characterReferences: getCharacterReferences(),
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate');

      const data = await response.json();

      updateStoryboardScene(scene.scene_number, {
        image_url: data.image_url,
        shot_type: newShotType,
        generation_status: 'completed',
        is_regenerating: false,
        prompt_used: data.prompt_used,
        negative_prompt_used: data.negative_prompt,
        model_used: data.model,
        style_category: data.style,
        character_conditioned: data.character_conditioned,
        character_count: data.character_count,
      });
    } catch (error) {
      console.error('Shot type change error:', error);
      updateStoryboardScene(scene.scene_number, {
        generation_status: 'error',
        error_message: 'Failed to regenerate with new shot type',
        is_regenerating: false,
      });
    }
  };

  if (!scene) return null;

  const currentIndex = storyboardScenes.findIndex(s => s.scene_number === scene.scene_number);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < storyboardScenes.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl mx-16 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Scene {scene.scene_number}</span>
            {scene.scene_type === 'map' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Map className="h-3 w-3" />
                Map
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Side chevron navigation */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -left-12 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 disabled:opacity-30"
            onClick={() => onNavigate('prev')}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-12 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 disabled:opacity-30"
            onClick={() => onNavigate('next')}
            disabled={!hasNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

        <div className="space-y-3">
          {/* Scene Image */}
          <div className="relative aspect-video max-h-[300px] bg-gray-100 rounded-lg overflow-hidden">
            {isRegenerating ? (
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

          {/* Shot Type Selector (for visual scenes only) */}
          {scene.scene_type !== 'map' && (
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

          {/* Map Data (if map scene) */}
          {scene.scene_type === 'map' && scene.map_data && (
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
          )}

          {/* Collapsible artifact sections */}
          <DisclosureSection title="Script">
            <p className="text-sm whitespace-pre-wrap text-gray-700">{scene.script_snippet}</p>
          </DisclosureSection>

          <DisclosureSection title="Visual Description">
            <p className="text-sm text-gray-700">{scene.visual_prompt}</p>
          </DisclosureSection>

          <DisclosureSection title="Full Prompt">
            {scene.prompt_used ? (
              isEditingFullPrompt ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedFullPrompt}
                    onChange={(e) => setEditedFullPrompt(e.target.value)}
                    className="min-h-[120px] text-xs font-mono"
                    placeholder="Edit the full prompt sent to the image model..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveFullPrompt}
                      disabled={isRegenerating}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save & Regenerate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingFullPrompt(false);
                        setEditedFullPrompt(scene.prompt_used || '');
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-mono whitespace-pre-wrap text-gray-600 bg-gray-50 p-2 rounded">
                    {scene.prompt_used}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedFullPrompt(scene.prompt_used || '');
                      setIsEditingFullPrompt(true);
                    }}
                  >
                    Edit Prompt
                  </Button>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-400 italic">Not yet available - generate an image first.</p>
            )}
          </DisclosureSection>

          {scene.negative_prompt_used && (
            <DisclosureSection title="Negative Prompt">
              <p className="text-xs font-mono whitespace-pre-wrap text-gray-600 bg-gray-50 p-2 rounded">
                {scene.negative_prompt_used}
              </p>
            </DisclosureSection>
          )}

          {(scene.model_used || scene.style_category) && (
            <DisclosureSection title="Generation Info">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {scene.model_used && (
                  <div>
                    <span className="font-medium text-gray-500">Model:</span>{' '}
                    <span className="font-mono text-xs">{scene.model_used}</span>
                  </div>
                )}
                {scene.style_category && (
                  <div>
                    <span className="font-medium text-gray-500">Style:</span>{' '}
                    {scene.style_category}
                  </div>
                )}
                {scene.character_conditioned !== undefined && (
                  <div>
                    <span className="font-medium text-gray-500">Character conditioned:</span>{' '}
                    {scene.character_conditioned ? 'Yes' : 'No'}
                  </div>
                )}
                {scene.character_count !== undefined && scene.character_count > 0 && (
                  <div>
                    <span className="font-medium text-gray-500">Characters:</span>{' '}
                    {scene.character_count}
                  </div>
                )}
              </div>
            </DisclosureSection>
          )}

        </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={() => handleRegenerate()}
            disabled={isRegenerating || isEditingFullPrompt}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerate Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
