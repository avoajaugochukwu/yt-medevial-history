"use client";

import React, { useState, useEffect } from 'react';
import type { CharacterWithReference, HistoricalEra } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Users,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  RefreshCw,
  Crown,
  User,
  ImageIcon,
} from 'lucide-react';
import { useCharacterApproval } from '@/lib/hooks/use-character-approval';

interface CharacterApprovalProps {
  script: string;
  era: HistoricalEra;
  onComplete: () => void;
  onSkip: () => void;
}

// Character card component
function CharacterCard({
  character,
  onToggleApproval,
  onEdit,
  onRegenerate,
  showRegenerate = false,
}: {
  character: CharacterWithReference;
  onToggleApproval: (id: string) => void;
  onEdit: (character: CharacterWithReference) => void;
  onRegenerate?: (character: CharacterWithReference) => void;
  showRegenerate?: boolean;
}) {
  const isGenerating = character.reference_generation_status === 'generating';
  const isCompleted = character.reference_generation_status === 'completed';
  const isError = character.reference_generation_status === 'error';
  const isPrimary = character.prominence === 'primary';

  return (
    <Card
      className={`
        transition-all hover:shadow-md
        ${!character.is_approved ? 'opacity-60' : ''}
        ${isGenerating ? 'ring-2 ring-blue-400' : ''}
        ${isError ? 'ring-2 ring-red-500' : ''}
      `}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Checkbox
                id={`approve-${character.id}`}
                checked={character.is_approved}
                onCheckedChange={() => onToggleApproval(character.id)}
              />
              <h3 className="font-semibold text-sm truncate">{character.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground truncate">{character.role}</p>
          </div>
          <Badge
            variant={isPrimary ? 'default' : 'secondary'}
            className="text-xs flex items-center gap-1"
          >
            {isPrimary ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {isPrimary ? 'Primary' : 'Secondary'}
          </Badge>
        </div>

        <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
          {character.reference_image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={character.reference_image_url}
                alt={`Portrait of ${character.name}`}
                className="w-full h-full object-cover"
              />
              {isCompleted && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                </div>
              )}
            </>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="text-xs text-gray-500 mt-2">Generating portrait...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <AlertCircle className="h-8 w-8 mb-1" />
              <span className="text-xs">Generation failed</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ImageIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">Portrait pending</span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-600 line-clamp-2">{character.description}</p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(character)}
            disabled={isGenerating}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {showRegenerate && onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onRegenerate(character)}
              disabled={isGenerating}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating' : 'Regenerate'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Character editor dialog
function CharacterEditorDialog({
  character,
  isOpen,
  onClose,
  onSave,
}: {
  character: CharacterWithReference | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<CharacterWithReference>) => void;
}) {
  const [visualDescription, setVisualDescription] = useState('');
  const [historicalAppearance, setHistoricalAppearance] = useState('');

  useEffect(() => {
    if (character) {
      setVisualDescription(character.visual_description);
      setHistoricalAppearance(character.historical_period_appearance);
    }
  }, [character]);

  if (!character) return null;

  const handleSave = () => {
    onSave(character.id, {
      visual_description: visualDescription,
      historical_period_appearance: historicalAppearance,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Character: {character.name}</DialogTitle>
          <DialogDescription>{character.role}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {character.reference_image_url && (
            <div className="flex justify-center">
              <div className="w-48 aspect-[3/4] rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={character.reference_image_url}
                  alt={`Portrait of ${character.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="visual-description">Visual Description (for portrait generation)</Label>
            <Textarea
              id="visual-description"
              value={visualDescription}
              onChange={(e) => setVisualDescription(e.target.value)}
              placeholder="Detailed physical appearance..."
              className="min-h-[150px] text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Describe age, build, facial features, expression, and distinctive characteristics.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="historical-appearance">Historical Period Appearance</Label>
            <Textarea
              id="historical-appearance"
              value={historicalAppearance}
              onChange={(e) => setHistoricalAppearance(e.target.value)}
              placeholder="Era-appropriate clothing and armor..."
              className="min-h-[100px] text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Describe garments, armor, headwear, and accessories appropriate for their rank.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CharacterApproval({ script, era, onComplete, onSkip }: CharacterApprovalProps) {
  const {
    characterSession,
    editingCharacter,
    setEditingCharacter,
    identifyCharacters,
    handleToggleApproval,
    handleEditSave,
    generatePortraits,
    regeneratePortrait,
    handleContinueToScenes,
  } = useCharacterApproval(script, era, onComplete);

  // Loading state
  if (!characterSession || characterSession.status === 'identifying') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Identifying Characters</h3>
            <p className="text-sm text-muted-foreground">
              Analyzing script for historical figures...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (characterSession.status === 'error') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Identification Failed</h3>
            <p className="text-sm text-muted-foreground mb-4">{characterSession.error}</p>
            <div className="flex gap-2">
              <Button onClick={identifyCharacters}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={onSkip}>Skip Characters</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generation in progress
  if (characterSession.status === 'generating_references') {
    const approvedCount = characterSession.characters.filter((c) => c.is_approved).length;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generating Character Portraits
          </CardTitle>
          <CardDescription>
            Creating reference images for {approvedCount} characters...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {characterSession.characters
              .filter((c) => c.is_approved)
              .map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onToggleApproval={() => {}}
                  onEdit={() => {}}
                />
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Review portraits state
  if (characterSession.status === 'review_portraits') {
    const approvedCharacters = characterSession.characters.filter((c) => c.is_approved);
    const completedCount = approvedCharacters.filter(
      (c) => c.reference_generation_status === 'completed'
    ).length;
    const errorCount = approvedCharacters.filter(
      (c) => c.reference_generation_status === 'error'
    ).length;
    const isAnyGenerating = approvedCharacters.some(
      (c) => c.reference_generation_status === 'generating'
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Review Character Portraits
          </CardTitle>
          <CardDescription>
            Generated {completedCount} of {approvedCharacters.length} portraits
            {errorCount > 0 && ` (${errorCount} failed)`}.
            Review and regenerate any portraits before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {approvedCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onToggleApproval={() => {}}
                onEdit={setEditingCharacter}
                onRegenerate={regeneratePortrait}
                showRegenerate
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {completedCount} successful, {errorCount} failed
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onSkip} disabled={isAnyGenerating}>
                Skip Characters
              </Button>
              <Button onClick={handleContinueToScenes} disabled={isAnyGenerating || completedCount === 0}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Continue to Scenes
              </Button>
            </div>
          </div>
        </CardContent>

        <CharacterEditorDialog
          character={editingCharacter}
          isOpen={!!editingCharacter}
          onClose={() => setEditingCharacter(null)}
          onSave={handleEditSave}
        />
      </Card>
    );
  }

  // Approval state
  const approvedCount = characterSession.characters.filter((c) => c.is_approved).length;
  const primaryCount = characterSession.characters.filter(
    (c) => c.prominence === 'primary'
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Character Identification
        </CardTitle>
        <CardDescription>
          Found {characterSession.characters.length} characters ({primaryCount} primary).
          Select which characters should have reference portraits generated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {characterSession.characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onToggleApproval={handleToggleApproval}
              onEdit={setEditingCharacter}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {approvedCount} of {characterSession.characters.length} characters selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onSkip}>Skip Characters</Button>
            <Button onClick={generatePortraits} disabled={approvedCount === 0}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Portraits ({approvedCount})
            </Button>
          </div>
        </div>
      </CardContent>

      <CharacterEditorDialog
        character={editingCharacter}
        isOpen={!!editingCharacter}
        onClose={() => setEditingCharacter(null)}
        onSave={handleEditSave}
      />
    </Card>
  );
}
