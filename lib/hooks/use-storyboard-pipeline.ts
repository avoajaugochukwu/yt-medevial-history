'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/lib/store';
import type { StoryboardScene, Scene } from '@/lib/types';
import { countWords } from '@/lib/utils/word-count';
import { WORDS_PER_MINUTE } from '@/lib/config/content';

type AnalysisPhase = 'idle' | 'analyzing' | 'complete';

export function useStoryboardPipeline() {
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
    characterSession,
    addError,
    clearErrors,
  } = useSessionStore();

  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('idle');

  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(true);

  const createPlaceholderScenes = useCallback((count: number): StoryboardScene[] => {
    return Array.from({ length: count }, (_, i) => ({
      scene_number: i + 1,
      script_snippet: '',
      visual_prompt: '',
      generation_status: 'pending' as const,
      image_url: undefined,
    }));
  }, []);

  const generateSceneImage = useCallback(
    async (scene: StoryboardScene): Promise<boolean> => {
      if (!isMountedRef.current) return false;

      updateStoryboardScene(scene.scene_number, { generation_status: 'generating' });

      try {
        const characterReferences = characterSession?.characters
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
          }));

        const response = await fetch('/api/generate/scene-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene,
            artStyle: historicalTopic?.artStyle,
            characterReferences: characterReferences || [],
          }),
        });

        if (!response.ok) throw new Error('Failed to generate scene image');

        const data = await response.json();

        if (isMountedRef.current) {
          updateStoryboardScene(scene.scene_number, {
            image_url: data.image_url,
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
    },
    [characterSession, historicalTopic, updateStoryboardScene]
  );

  const generateAllSceneImages = useCallback(
    async (scenesToGenerate: StoryboardScene[]) => {
      if (!isMountedRef.current) return;

      await Promise.allSettled(
        scenesToGenerate.map((scene) => generateSceneImage(scene))
      );
    },
    [generateSceneImage]
  );

  const analyzeScriptInBackground = useCallback(async (): Promise<StoryboardScene[] | null> => {
    if (!script || !isMountedRef.current) return null;

    clearErrors();
    setAnalysisPhase('analyzing');

    const scriptContent = script.polished_content || script.content;
    const wordCount = countWords(scriptContent);
    const estimatedDurationMinutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
    const expectedSceneCount = Math.round((estimatedDurationMinutes * 60) / 6);

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
  }, [script, clearErrors, createPlaceholderScenes, setStoryboardScenes, setScenes, addError]);

  // Main pipeline effect
  useEffect(() => {
    isMountedRef.current = true;

    const runPipeline = async () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      if (storyboardScenes.length > 0 && storyboardScenes.some((s) => s.image_url)) {
        const pendingScenes = storyboardScenes.filter(
          (s) => s.generation_status === 'pending' || s.generation_status === 'error'
        );
        if (pendingScenes.length > 0) {
          await generateAllSceneImages(pendingScenes);
        }
        return;
      }

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
  const allScenesCompleted =
    completedScenes === storyboardScenes.length && storyboardScenes.length > 0;

  // Update progress in store
  useEffect(() => {
    if (storyboardScenes.length > 0) {
      const progress = (completedScenes / storyboardScenes.length) * 100;
      setSceneGenerationProgress(progress);
    }
  }, [completedScenes, storyboardScenes.length, setSceneGenerationProgress]);

  const regenerateFailedScenes = useCallback(async () => {
    const failedScenes = storyboardScenes.filter((s) => s.generation_status === 'error');
    await generateAllSceneImages(failedScenes);
  }, [storyboardScenes, generateAllSceneImages]);

  const isAnalyzing = analysisPhase === 'analyzing';
  const isGenerating = generatingScenes > 0;
  const showPlaceholders = isAnalyzing && storyboardScenes.every((s) => !s.script_snippet);

  return {
    storyboardScenes,
    sceneGenerationProgress,
    completedScenes,
    errorScenes,
    allScenesCompleted,
    isAnalyzing,
    isGenerating,
    showPlaceholders,
    regenerateFailedScenes,
  };
}
