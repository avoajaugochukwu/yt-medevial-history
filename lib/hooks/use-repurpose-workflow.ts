'use client';

import React, { useState, useCallback } from 'react';
import { useSessionStore } from '@/lib/store';
import toast from 'react-hot-toast';
import type {
  YouTubeExtraction,
  ScriptAnalysis,
  RewrittenScript,
  RepurposeSession,
} from '@/lib/types';

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface RepurposeStep {
  number: number;
  label: string;
  icon: React.ReactNode;
  status: StepStatus;
}

export function useRepurposeWorkflow(stepIcons: {
  youtube: React.ReactNode;
  barChart: React.ReactNode;
  wand: React.ReactNode;
  type: React.ReactNode;
}) {
  const { setRepurposeSession, updateRepurposeSession } = useSessionStore();

  // Form state
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Generation state
  const [status, setStatus] = useState<RepurposeSession['status']>('idle');
  const [steps, setSteps] = useState<RepurposeStep[]>([
    { number: 1, label: 'Extracting transcript', icon: stepIcons.youtube, status: 'pending' },
    { number: 2, label: 'Analyzing script quality', icon: stepIcons.barChart, status: 'pending' },
    { number: 3, label: 'Rewriting with retention tactics', icon: stepIcons.wand, status: 'pending' },
    { number: 4, label: 'Generating title options', icon: stepIcons.type, status: 'pending' },
  ]);

  // Generated data
  const [extraction, setExtraction] = useState<YouTubeExtraction | null>(null);
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [rewrittenScript, setRewrittenScript] = useState<RewrittenScript | null>(null);
  const [titles, setTitles] = useState<string[]>([]);

  // UI state
  const [copied, setCopied] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);

  const updateStepStatus = useCallback((stepNumber: number, newStatus: StepStatus) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.number === stepNumber ? { ...step, status: newStatus } : step
      )
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setStatus('extracting');
    setSteps((prev) => prev.map((step) => ({ ...step, status: 'pending' as StepStatus })));
    setExtraction(null);
    setAnalysis(null);
    setRewrittenScript(null);
    setTitles([]);

    setRepurposeSession({
      youtubeUrl,
      extraction: null,
      analysis: null,
      rewrittenScript: null,
      status: 'extracting',
    });

    try {
      // Step 1: Extract from YouTube
      updateStepStatus(1, 'in_progress');

      const extractResponse = await fetch('/api/repurpose/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.details || errorData.error || 'Extraction failed');
      }

      const extractData = await extractResponse.json();
      const extractedData: YouTubeExtraction = extractData.extraction;
      setExtraction(extractedData);
      updateRepurposeSession({ extraction: extractedData });
      updateStepStatus(1, 'completed');

      // Step 2: Analyze Script
      setStatus('analyzing');
      updateRepurposeSession({ status: 'analyzing' });
      updateStepStatus(2, 'in_progress');

      const analyzeResponse = await fetch('/api/repurpose/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraction: extractedData }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.details || errorData.error || 'Analysis failed');
      }

      const analyzeData = await analyzeResponse.json();
      const analysisResult: ScriptAnalysis = analyzeData.analysis;
      setAnalysis(analysisResult);
      updateRepurposeSession({ analysis: analysisResult });
      updateStepStatus(2, 'completed');

      // Step 3: Rewrite Script
      setStatus('rewriting');
      updateRepurposeSession({ status: 'rewriting' });
      updateStepStatus(3, 'in_progress');

      const rewriteResponse = await fetch('/api/repurpose/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraction: extractedData, analysis: analysisResult }),
      });

      if (!rewriteResponse.ok) {
        let errorMessage = 'Rewrite failed';
        try {
          const errorData = await rewriteResponse.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch {
          // Response wasn't valid JSON
        }
        throw new Error(errorMessage);
      }

      const rewriteData = await rewriteResponse.json();
      const rewrittenResult: RewrittenScript = rewriteData.rewrittenScript;
      setRewrittenScript(rewrittenResult);
      updateRepurposeSession({ rewrittenScript: rewrittenResult, status: 'complete' });
      updateStepStatus(3, 'completed');

      // Step 4: Generate Titles
      updateStepStatus(4, 'in_progress');

      const titlesResponse = await fetch('/api/repurpose/titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: rewrittenResult.content }),
      });

      if (!titlesResponse.ok) {
        const errorData = await titlesResponse.json();
        throw new Error(errorData.details || errorData.error || 'Title generation failed');
      }

      const titlesData = await titlesResponse.json();
      const generatedTitles: string[] = titlesData.titles;
      setTitles(generatedTitles);
      updateStepStatus(4, 'completed');

      setStatus('complete');
      toast.success('Script rewritten and titles generated!');
    } catch (error) {
      console.error('Repurpose error:', error);

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
      updateRepurposeSession({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed: ${errorMessage}`);
    }
  }, [youtubeUrl, updateStepStatus, setRepurposeSession, updateRepurposeSession]);

  const handleCopy = useCallback(async () => {
    if (rewrittenScript?.content) {
      await navigator.clipboard.writeText(rewrittenScript.content);
      setCopied(true);
      toast.success('Script copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [rewrittenScript]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setSteps((prev) => prev.map((step) => ({ ...step, status: 'pending' as StepStatus })));
    setExtraction(null);
    setAnalysis(null);
    setRewrittenScript(null);
    setTitles([]);
    setYoutubeUrl('');
    setRepurposeSession(null);
  }, [setRepurposeSession]);

  const handleCopyTitle = useCallback(async (title: string, index: number) => {
    await navigator.clipboard.writeText(title);
    setCopiedTitle(index);
    toast.success('Title copied!');
    setTimeout(() => setCopiedTitle(null), 2000);
  }, []);

  return {
    // Form
    youtubeUrl,
    setYoutubeUrl,

    // State
    status,
    steps,
    extraction,
    analysis,
    rewrittenScript,
    titles,

    // UI
    copied,
    copiedTitle,
    showAnalysis,
    setShowAnalysis,
    showOriginal,
    setShowOriginal,

    // Actions
    handleGenerate,
    handleCopy,
    handleReset,
    handleCopyTitle,
  };
}
