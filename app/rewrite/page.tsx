'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Youtube,
  FileText,
  BarChart3,
  Wand2,
  Type,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  YouTubeExtraction,
  ScriptAnalysis,
  RewrittenScript,
  RepurposeSession,
} from '@/lib/types';
import { useSessionStore } from '@/lib/store';

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

interface Step {
  number: number;
  label: string;
  icon: React.ReactNode;
  status: StepStatus;
}

export default function RewritePage() {
  const { setRepurposeSession, updateRepurposeSession } = useSessionStore();

  // Form state
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Generation state
  const [status, setStatus] = useState<RepurposeSession['status']>('idle');
  const [steps, setSteps] = useState<Step[]>([
    {
      number: 1,
      label: 'Extracting transcript',
      icon: <Youtube className="h-4 w-4" />,
      status: 'pending',
    },
    {
      number: 2,
      label: 'Analyzing script quality',
      icon: <BarChart3 className="h-4 w-4" />,
      status: 'pending',
    },
    {
      number: 3,
      label: 'Rewriting with retention tactics',
      icon: <Wand2 className="h-4 w-4" />,
      status: 'pending',
    },
    {
      number: 4,
      label: 'Generating title options',
      icon: <Type className="h-4 w-4" />,
      status: 'pending',
    },
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

  const updateStepStatus = (stepNumber: number, newStatus: StepStatus) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.number === stepNumber ? { ...step, status: newStatus } : step
      )
    );
  };

  const handleGenerate = async () => {
    // Validation
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    // Reset state
    setStatus('extracting');
    setSteps((prev) => prev.map((step) => ({ ...step, status: 'pending' as StepStatus })));
    setExtraction(null);
    setAnalysis(null);
    setRewrittenScript(null);
    setTitles([]);

    // Initialize session in store
    setRepurposeSession({
      youtubeUrl,
      extraction: null,
      analysis: null,
      rewrittenScript: null,
      status: 'extracting',
    });

    try {
      // ============================================================================
      // STEP 1: Extract from YouTube
      // ============================================================================
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

      console.log('[Step 1] Extraction complete:', extractedData.transcript.wordCount, 'words');

      // ============================================================================
      // STEP 2: Analyze Script
      // ============================================================================
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

      console.log('[Step 2] Analysis complete. Score:', analysisResult.overallScore);

      // ============================================================================
      // STEP 3: Rewrite Script
      // ============================================================================
      setStatus('rewriting');
      updateRepurposeSession({ status: 'rewriting' });
      updateStepStatus(3, 'in_progress');

      const rewriteResponse = await fetch('/api/repurpose/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraction: extractedData, analysis: analysisResult }),
      });

      if (!rewriteResponse.ok) {
        const errorData = await rewriteResponse.json();
        throw new Error(errorData.details || errorData.error || 'Rewrite failed');
      }

      const rewriteData = await rewriteResponse.json();
      const rewrittenResult: RewrittenScript = rewriteData.rewrittenScript;
      setRewrittenScript(rewrittenResult);
      updateRepurposeSession({ rewrittenScript: rewrittenResult, status: 'complete' });
      updateStepStatus(3, 'completed');

      console.log('[Step 3] Rewrite complete. Words:', rewrittenResult.wordCount);

      // ============================================================================
      // STEP 4: Generate Titles
      // ============================================================================
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

      console.log('[Step 4] Titles generated:', generatedTitles);

      setStatus('complete');
      toast.success('Script rewritten and titles generated!');
    } catch (error) {
      console.error('Repurpose error:', error);

      // Mark current step as error
      const currentStep = steps.find((s) => s.status === 'in_progress');
      if (currentStep) {
        updateStepStatus(currentStep.number, 'error');
      }

      setStatus('error');
      updateRepurposeSession({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed: ${errorMessage}`);
    }
  };

  const handleCopy = async () => {
    if (rewrittenScript?.content) {
      await navigator.clipboard.writeText(rewrittenScript.content);
      setCopied(true);
      toast.success('Script copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setSteps((prev) => prev.map((step) => ({ ...step, status: 'pending' as StepStatus })));
    setExtraction(null);
    setAnalysis(null);
    setRewrittenScript(null);
    setTitles([]);
    setYoutubeUrl('');
    setRepurposeSession(null);
  };

  const handleCopyTitle = async (title: string, index: number) => {
    await navigator.clipboard.writeText(title);
    setCopiedTitle(index);
    toast.success('Title copied!');
    setTimeout(() => setCopiedTitle(null), 2000);
  };

  const getStepIcon = (step: Step) => {
    if (step.status === 'completed') return <Check className="h-5 w-5 text-green-600" />;
    if (step.status === 'in_progress')
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    if (step.status === 'error') return <span className="text-red-600">✗</span>;
    return step.icon;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Input Card */}
        {status === 'idle' && (
          <Card className="shadow-lg border-border/50">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-serif flex items-center gap-3">
                <Youtube className="h-8 w-8 text-red-600" />
                Rewrite YouTube Content
              </CardTitle>
              <CardDescription className="text-base">
                Transform any YouTube video into an optimized 25-minute script with strong hooks,
                high retention tactics, and an in media res opening.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* YouTube URL Input */}
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl" className="text-base font-medium">
                  YouTube Video URL
                </Label>
                <Input
                  id="youtubeUrl"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="text-base h-12"
                />
                <p className="text-xs text-muted-foreground">
                  The video must have captions/subtitles available
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  What happens:
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Extract transcript from the video</li>
                  <li>Analyze script for hook quality, retention tactics, and structure</li>
                  <li>
                    Rewrite the script with in media res opening, strong hooks, and retention
                    tactics
                  </li>
                  <li>Generate 3 title options based on the rewritten script</li>
                </ol>
              </div>

              {/* Target Info */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-2xl font-bold">25</div>
                  <div className="text-xs text-muted-foreground">Target Minutes</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-2xl font-bold">~3,750</div>
                  <div className="text-xs text-muted-foreground">Target Words</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-2xl font-bold">TTS</div>
                  <div className="text-xs text-muted-foreground">Ready Format</div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Rewrite Video
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress Card */}
        {status !== 'idle' && (
          <div className="space-y-6">
            {/* Extraction Preview */}
            {extraction && (
              <Card className="shadow-lg border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Extracted Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-muted px-3 py-1.5 rounded text-sm font-medium">
                      {extraction.transcript.wordCount.toLocaleString()} words
                    </span>
                  </div>

                  {/* Collapsible Original Transcript */}
                  <div>
                    <button
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {showOriginal ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {showOriginal ? 'Hide' : 'Show'} original transcript
                    </button>
                    {showOriginal && (
                      <div className="mt-2 bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <p className="text-xs whitespace-pre-wrap">
                          {extraction.transcript.text}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Steps */}
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {steps.map((step) => (
                    <div
                      key={step.number}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        step.status === 'in_progress'
                          ? 'bg-primary/10'
                          : step.status === 'completed'
                            ? 'bg-green-50 dark:bg-green-950/20'
                            : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex-shrink-0 w-6">{getStepIcon(step)}</div>
                      <div className="flex-1">
                        <p
                          className={`text-sm ${step.status === 'in_progress' ? 'font-medium' : ''}`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysis && (
              <Card className="shadow-lg border-border/50">
                <CardHeader className="pb-3">
                  <button
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="w-full flex items-center justify-between"
                  >
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Script Analysis
                    </CardTitle>
                    {showAnalysis ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </CardHeader>
                {showAnalysis && (
                  <CardContent className="space-y-4">
                    {/* Score Overview */}
                    <div className="grid grid-cols-4 gap-3">
                      <div
                        className={`text-center p-3 rounded-lg ${getScoreColor(analysis.overallScore)}`}
                      >
                        <div className="text-2xl font-bold">{analysis.overallScore}/10</div>
                        <div className="text-xs">Overall</div>
                      </div>
                      <div
                        className={`text-center p-3 rounded-lg ${getScoreColor(analysis.hookQuality.score)}`}
                      >
                        <div className="text-2xl font-bold">{analysis.hookQuality.score}/10</div>
                        <div className="text-xs">Hook</div>
                      </div>
                      <div
                        className={`text-center p-3 rounded-lg ${getScoreColor(analysis.retentionTactics.score)}`}
                      >
                        <div className="text-2xl font-bold">
                          {analysis.retentionTactics.score}/10
                        </div>
                        <div className="text-xs">Retention</div>
                      </div>
                      <div
                        className={`text-center p-3 rounded-lg ${getScoreColor(analysis.structureAnalysis.score)}`}
                      >
                        <div className="text-2xl font-bold">
                          {analysis.structureAnalysis.score}/10
                        </div>
                        <div className="text-xs">Structure</div>
                      </div>
                    </div>

                    {/* Key Strengths */}
                    <div>
                      <h4 className="font-semibold text-green-700 dark:text-green-400 text-sm mb-2">
                        Key Strengths
                      </h4>
                      <ul className="text-sm space-y-1">
                        {analysis.keyStrengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-600">+</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Critical Improvements */}
                    <div>
                      <h4 className="font-semibold text-red-700 dark:text-red-400 text-sm mb-2">
                        Areas to Improve
                      </h4>
                      <ul className="text-sm space-y-1">
                        {analysis.criticalImprovements.map((improvement, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-600">-</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Missing Tactics */}
                    {analysis.retentionTactics.missingTactics.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-sm mb-2">
                          Missing Retention Tactics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.retentionTactics.missingTactics.map((tactic, i) => (
                            <span
                              key={i}
                              className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded"
                            >
                              {tactic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Rewritten Script */}
            {rewrittenScript && (
              <Card className="shadow-lg border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      Rewritten Script
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-3 rounded text-center">
                      <div className="text-xl font-bold">
                        {rewrittenScript.wordCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Words</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded text-center">
                      <div className="text-xl font-bold">
                        ~{rewrittenScript.estimatedDuration} min
                      </div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded text-center">
                      <div className="text-xl font-bold">TTS Ready</div>
                      <div className="text-xs text-muted-foreground">Format</div>
                    </div>
                  </div>

                  {/* Applied Techniques */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Applied Techniques:</h4>
                    <div className="flex flex-wrap gap-2">
                      {rewrittenScript.appliedTechniques.map((technique, i) => (
                        <span
                          key={i}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                        >
                          {technique}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Script Content */}
                  <div className="bg-card border border-border rounded-lg p-4 max-h-[500px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {rewrittenScript.content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Titles */}
            {titles.length > 0 && (
              <Card className="shadow-lg border-border/50">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Title Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {titles.map((title, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-sm font-medium flex-1">{title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyTitle(title, index)}
                        className="shrink-0"
                      >
                        {copiedTitle === index ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Error / Reset */}
            {(status === 'error' || status === 'complete') && (
              <div className="flex justify-center">
                <Button onClick={handleReset} variant="outline" className="w-full max-w-xs">
                  {status === 'error' ? 'Try Again' : 'Rewrite Another Video'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
