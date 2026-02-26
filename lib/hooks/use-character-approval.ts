'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/lib/store';
import type { CharacterWithReference, HistoricalEra } from '@/lib/types';

export function useCharacterApproval(
  script: string,
  era: HistoricalEra,
  onComplete: () => void,
) {
  const { characterSession, setCharacterSession, updateCharacter } = useSessionStore();
  const [editingCharacter, setEditingCharacter] = useState<CharacterWithReference | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const hasStartedRef = useRef(false);

  const identifyCharacters = useCallback(async () => {
    setCharacterSession({
      characters: [],
      status: 'identifying',
    });

    try {
      const response = await fetch('/api/identify/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, era }),
      });

      if (!response.ok) {
        throw new Error('Failed to identify characters');
      }

      const data = await response.json();

      setCharacterSession({
        characters: data.characters,
        status: 'awaiting_approval',
      });
    } catch (error) {
      console.error('Character identification error:', error);
      setCharacterSession({
        characters: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [script, era, setCharacterSession]);

  // Identify characters on mount
  useEffect(() => {
    if (!characterSession && !hasStartedRef.current) {
      hasStartedRef.current = true;
      identifyCharacters();
    }
  }, [characterSession, identifyCharacters]);

  const handleToggleApproval = useCallback(
    (id: string) => {
      updateCharacter(id, {
        is_approved: !characterSession?.characters.find((c) => c.id === id)?.is_approved,
      });
    },
    [characterSession, updateCharacter]
  );

  const handleEditSave = useCallback(
    (id: string, updates: Partial<CharacterWithReference>) => {
      updateCharacter(id, updates);
    },
    [updateCharacter]
  );

  const generatePortraits = useCallback(async () => {
    if (!characterSession) return;

    const approvedCharacters = characterSession.characters.filter((c) => c.is_approved);
    if (approvedCharacters.length === 0) {
      onComplete();
      return;
    }

    setCharacterSession({
      ...characterSession,
      status: 'generating_references',
    });

    let completed = 0;

    await Promise.all(
      approvedCharacters.map(async (character) => {
        updateCharacter(character.id, { reference_generation_status: 'generating' });

        try {
          const response = await fetch('/api/generate/character-reference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ character }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate portrait');
          }

          const data = await response.json();

          updateCharacter(character.id, {
            reference_image_url: data.image_url,
            reference_generation_status: 'completed',
          });
        } catch (error) {
          console.error(`Failed to generate portrait for ${character.name}:`, error);
          updateCharacter(character.id, {
            reference_generation_status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        completed++;
        setGenerationProgress(Math.round((completed / approvedCharacters.length) * 100));
      })
    );

    // Read fresh state from store to avoid stale closure
    const latestSession = useSessionStore.getState().characterSession;
    if (latestSession) {
      setCharacterSession({
        ...latestSession,
        status: 'review_portraits',
      });
    }
  }, [characterSession, onComplete, setCharacterSession, updateCharacter]);

  const regeneratePortrait = useCallback(
    async (character: CharacterWithReference) => {
      updateCharacter(character.id, { reference_generation_status: 'generating' });

      try {
        const response = await fetch('/api/generate/character-reference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character }),
        });

        if (!response.ok) {
          throw new Error('Failed to regenerate portrait');
        }

        const data = await response.json();

        updateCharacter(character.id, {
          reference_image_url: data.image_url,
          reference_generation_status: 'completed',
          error_message: undefined,
        });
      } catch (error) {
        console.error(`Failed to regenerate portrait for ${character.name}:`, error);
        updateCharacter(character.id, {
          reference_generation_status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [updateCharacter]
  );

  const handleContinueToScenes = useCallback(() => {
    if (!characterSession) return;

    setCharacterSession({
      ...characterSession,
      status: 'complete',
    });
    onComplete();
  }, [characterSession, onComplete, setCharacterSession]);

  return {
    characterSession,
    editingCharacter,
    setEditingCharacter,
    generationProgress,
    identifyCharacters,
    handleToggleApproval,
    handleEditSave,
    generatePortraits,
    regeneratePortrait,
    handleContinueToScenes,
  };
}
