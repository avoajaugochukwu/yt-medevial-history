'use client';

import { useState, useCallback } from 'react';
import { useSessionStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { WORDS_PER_MINUTE } from '@/lib/config/content';
import type { TacticalResearch, RecursiveScript } from '@/lib/types';

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';
type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface Step {
  number: number;
  label: string;
  status: StepStatus;
}

const INITIAL_STEPS: Step[] = [
  { number: 1, label: 'Extracting Tactical Telemetry', status: 'pending' },
  { number: 2, label: 'Generating Hook', status: 'pending' },
  { number: 3, label: 'Building Gamified War Outline', status: 'pending' },
  { number: 4, label: 'Generating Batch 1/5 (The Matchup)', status: 'pending' },
  { number: 5, label: 'Generating Batch 2/5 (Unit Deep Dive)', status: 'pending' },
  { number: 6, label: 'Generating Batch 3/5 (Tactical Turn)', status: 'pending' },
  { number: 7, label: 'Generating Batch 4/5 (Kill Screen)', status: 'pending' },
  { number: 8, label: 'Generating Batch 5/5 (Aftermath)', status: 'pending' },
  { number: 9, label: 'Validating Style Compliance', status: 'pending' },
  { number: 10, label: 'Analyzing Repetition & Quality', status: 'pending' },
  { number: 11, label: 'Polishing Narrative', status: 'pending' },
];

export function useScriptingWorkflow() {
  const router = useRouter();
  const { setHistoricalTopic, setTacticalResearch, setRecursiveScript, setRecursiveProgress } =
    useSessionStore();

  // Form inputs
  const [title, setTitle] = useState('');
  const [targetDuration, setTargetDuration] = useState<number>(35);

  // Generation state
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);

  // Generated data
  const [researchData, setResearchData] = useState<TacticalResearch | null>(null);
  const [scriptData, setScriptData] = useState<RecursiveScript | null>(null);
  const [artStyle, setArtStyle] = useState<string | undefined>(undefined);

  // UI state
  const [copied, setCopied] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);

  const updateStepStatus = useCallback((stepNumber: number, newStatus: StepStatus) => {
    setSteps((prev) =>
      prev.map((step) => (step.number === stepNumber ? { ...step, status: newStatus } : step))
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Please provide a battle/engagement title');
      return;
    }

    if (!targetDuration || targetDuration <= 0 || targetDuration > 40) {
      toast.error('Target duration must be between 1 and 40 minutes');
      return;
    }

    setStatus('generating');
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' as StepStatus })));
    setResearchData(null);
    setScriptData(null);
    setCurrentBatch(0);

    try {
      // Step 1: Tactical Research
      updateStepStatus(1, 'in_progress');

      const step1Response = await fetch('/api/research/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, targetDuration }),
      });

      if (!step1Response.ok) {
        const errorData = await step1Response.json();
        throw new Error(errorData.error || 'Tactical research failed');
      }

      const step1Data = await step1Response.json();
      const research: TacticalResearch = step1Data.research;
      const generatedArtStyle: string | undefined = step1Data.artStyle;

      setResearchData(research);
      setArtStyle(generatedArtStyle);
      setTacticalResearch(research);
      updateStepStatus(1, 'completed');

      // Steps 2-9: Recursive Script Generation
      updateStepStatus(2, 'in_progress');
      setRecursiveProgress({
        phase: 'hook',
        current_batch: 0,
        total_batches: 5,
        current_word_count: 0,
        target_word_count: targetDuration * WORDS_PER_MINUTE,
      });

      const scriptResponse = await fetch('/api/generate/final-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          research: JSON.stringify(research),
          targetDuration,
        }),
      });

      if (!scriptResponse.ok) {
        const errorData = await scriptResponse.json();
        throw new Error(errorData.error || 'Script generation failed');
      }

      const scriptResult = await scriptResponse.json();
      let script: RecursiveScript = scriptResult.script;

      for (let i = 2; i <= 9; i++) {
        updateStepStatus(i, 'completed');
      }

      // Step 10: Analyze Repetition
      updateStepStatus(10, 'in_progress');

      const auditResponse = await fetch('/api/generate/analyze-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: script.full_script }),
      });

      if (!auditResponse.ok) {
        const errorData = await auditResponse.json();
        throw new Error(errorData.error || 'Script audit failed');
      }

      const auditData = await auditResponse.json();
      updateStepStatus(10, 'completed');

      // Step 11: Polish Narrative
      updateStepStatus(11, 'in_progress');

      const polishResponse = await fetch('/api/generate/polish-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawScript: script.full_script,
          auditReport: auditData.report,
          targetDuration,
        }),
      });

      if (!polishResponse.ok) {
        const errorData = await polishResponse.json();
        throw new Error(errorData.error || 'Script polish failed');
      }

      const polishData = await polishResponse.json();
      updateStepStatus(11, 'completed');

      script = {
        ...script,
        polished_content: polishData.polishedContent,
        polished_word_count: polishData.wordCount,
        audit_report: auditData.report,
      };

      setScriptData(script);
      setRecursiveScript(script);
      setRecursiveProgress({
        phase: 'complete',
        current_batch: 5,
        total_batches: 5,
        current_word_count: script.polished_word_count || script.total_word_count,
        target_word_count: targetDuration * WORDS_PER_MINUTE,
      });

      setHistoricalTopic({
        title,
        era: research.era,
        tone: 'Documentary',
        created_at: new Date(),
        artStyle: generatedArtStyle,
      });

      setStatus('completed');

      if (scriptResult.metadata?.style_violations?.length > 0) {
        toast.success(
          `Script generated and polished with ${scriptResult.metadata.style_violations.length} style warning(s)`
        );
      } else {
        toast.success('War Room tactical documentary generated and polished!');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setSteps((prev) => {
        const currentStep = prev.find((s) => s.status === 'in_progress');
        if (currentStep) {
          return prev.map((s) =>
            s.number === currentStep.number ? { ...s, status: 'error' as StepStatus } : s
          );
        }
        return prev;
      });
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Generation failed: ${errorMessage}`);
    }
  }, [
    title,
    targetDuration,
    updateStepStatus,
    setTacticalResearch,
    setRecursiveProgress,
    setRecursiveScript,
    setHistoricalTopic,
  ]);

  const handleCopy = useCallback(async () => {
    const textToCopy = scriptData?.polished_content || scriptData?.full_script;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Script copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [scriptData]);

  const handleProceedToScenes = useCallback(() => {
    if (scriptData?.full_script) {
      router.push('/scenes');
    }
  }, [scriptData, router]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' as StepStatus })));
  }, []);

  const estimatedDuration =
    scriptData?.target_duration ||
    (scriptData?.total_word_count ? Math.round((scriptData.total_word_count / WORDS_PER_MINUTE) * 10) / 10 : 0);

  const completedBatches = scriptData?.batches?.length || currentBatch;

  return {
    // Form
    title,
    setTitle,
    targetDuration,
    setTargetDuration,

    // State
    status,
    steps,
    researchData,
    scriptData,
    artStyle,

    // UI
    copied,
    showOutline,
    setShowOutline,
    completedBatches,
    estimatedDuration,

    // Actions
    handleGenerate,
    handleCopy,
    handleProceedToScenes,
    handleReset,
  };
}
