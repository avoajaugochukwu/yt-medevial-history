"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Copy, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { GamifiedWarSection } from '@/lib/types';
import { useScriptingWorkflow, type Step } from '@/lib/hooks/use-scripting-workflow';
import { WORDS_PER_MINUTE } from '@/lib/config/content';

type StepStatus = Step['status'];

function getStepIcon(stepStatus: StepStatus) {
  if (stepStatus === 'completed') return <Check className="h-5 w-5 text-green-600" />;
  if (stepStatus === 'in_progress')
    return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
  if (stepStatus === 'error') return <span className="text-red-600">✗</span>;
  return <span className="text-muted-foreground">○</span>;
}

export default function WarRoomScriptingPage() {
  const {
    title,
    setTitle,
    targetDuration,
    setTargetDuration,
    status,
    steps,
    scriptData,
    copied,
    showOutline,
    setShowOutline,
    completedBatches,
    estimatedDuration,
    handleGenerate,
    handleCopy,
    handleProceedToScenes,
    handleReset,
  } = useScriptingWorkflow();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Configuration Card */}
        {status === 'idle' && (
          <Card className="shadow-lg border-border/50">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-serif">War Room Configuration</CardTitle>
              <CardDescription className="text-base">
                Configure your tactical documentary. The system will extract battlefield telemetry,
                analyze unit builds, and generate a 5-point Gamified War breakdown with 4-point analytical depth.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Battle / Engagement
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Battle of Cannae, Siege of Constantinople"
                  className="text-base h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDuration" className="text-base font-medium">
                  Target Duration (min)
                </Label>
                <Input
                  id="targetDuration"
                  type="number"
                  min="1"
                  max="40"
                  step="5"
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(Math.min(40, Math.max(1, Number(e.target.value))))}
                  placeholder="35"
                  className="text-base h-12"
                />
                <p className="text-xs text-muted-foreground">
                  ~{targetDuration * WORDS_PER_MINUTE} words • Recommended: 35 min for War Room style
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">War Room Style</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Tactical documentary with gaming terminology. Analyzes battles like post-game breakdowns —
                  unit builds, terrain meta, kill ratios, and tactical exploits. No flowery language about
                  &quot;valor&quot; or &quot;heroism&quot; — pure tactical analysis.
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Tactical Documentary
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generation Progress */}
        {(status === 'generating' || status === 'completed' || status === 'error') && (
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Generation Progress</CardTitle>
              <CardDescription>
                War Room analysis: {title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recursive Progress Bar */}
              {status === 'generating' && (
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Batch Progress</span>
                    <span>{completedBatches}/5 batches</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${(completedBatches / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Progress Steps */}
              <div className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      step.status === 'in_progress' ? 'bg-primary/10' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex-shrink-0 w-6">{getStepIcon(step.status)}</div>
                    <div className="flex-1">
                      <p className={`text-sm ${step.status === 'in_progress' ? 'font-medium' : ''}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Generated Script */}
              {scriptData && (
                <div className="space-y-4 mt-6">
                  {/* Hook Preview */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">
                      HOOK (60 sec)
                    </h4>
                    <p className="text-sm italic text-amber-700 dark:text-amber-300">
                      {scriptData.hook}
                    </p>
                  </div>

                  {/* Master Outline Collapsible */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <button
                      onClick={() => setShowOutline(!showOutline)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="font-bold text-blue-800 dark:text-blue-200">
                        Gamified War Outline (5 Points + 4-Point Analysis)
                      </span>
                      {showOutline ? (
                        <ChevronUp className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-blue-600" />
                      )}
                    </button>
                    {showOutline && scriptData.master_outline && (
                      <div className="px-4 pb-4 space-y-4 text-sm">
                        {Object.entries(scriptData.master_outline)
                          .filter(([key]) => !['generated_at', 'target_duration'].includes(key))
                          .map(([key, section]) => {
                            const typedSection = section as GamifiedWarSection;
                            return (
                              <div key={key} className="border-b border-blue-100 dark:border-blue-800 pb-3">
                                <div className="font-bold text-blue-800 dark:text-blue-200 text-base">
                                  {typedSection.title}
                                </div>

                                <ul className="text-blue-600 dark:text-blue-400 text-xs mt-1 list-disc list-inside">
                                  {typedSection.key_points?.map((point: string, i: number) => (
                                    <li key={i}>{point}</li>
                                  ))}
                                </ul>

                                {typedSection.chapter_analysis && (
                                  <div className="mt-2 pl-3 border-l-2 border-blue-300 dark:border-blue-700 space-y-1">
                                    <div className="text-xs">
                                      <span className="font-semibold text-amber-700 dark:text-amber-400">Stat Re-Hook:</span>{' '}
                                      <span className="text-blue-700 dark:text-blue-300">{typedSection.chapter_analysis.stat_rehook}</span>
                                    </div>
                                    {typedSection.chapter_analysis.hollywood_myth && (
                                      <div className="text-xs">
                                        <span className="font-semibold text-red-700 dark:text-red-400">Hollywood Myth:</span>{' '}
                                        <span className="text-blue-700 dark:text-blue-300">{typedSection.chapter_analysis.hollywood_myth}</span>
                                      </div>
                                    )}
                                    <div className="text-xs">
                                      <span className="font-semibold text-green-700 dark:text-green-400">Tactical Reality:</span>{' '}
                                      <span className="text-blue-700 dark:text-blue-300">{typedSection.chapter_analysis.tactical_reality}</span>
                                    </div>
                                    {typedSection.chapter_analysis.total_war_parallel && (
                                      <div className="text-xs">
                                        <span className="font-semibold text-purple-700 dark:text-purple-400">Total War Parallel:</span>{' '}
                                        <span className="text-blue-700 dark:text-blue-300">{typedSection.chapter_analysis.total_war_parallel}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {typedSection.engagement_spike && (
                                  <div className="mt-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                                    <span className="font-semibold">💬 Engagement:</span> {typedSection.engagement_spike}
                                  </div>
                                )}

                                {typedSection.visual_note && (
                                  <div className="mt-1 text-xs text-muted-foreground italic">
                                    🎨 {typedSection.visual_note}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Actions and Stats */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Full Script</h3>
                    <div className="flex gap-2">
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
                      <Button onClick={handleProceedToScenes} className="bg-primary">
                        Proceed to Scenes →
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-muted/50 p-3 rounded">
                      <div className="text-muted-foreground">Word Count</div>
                      <div className="text-xl font-bold">
                        {scriptData.polished_word_count || scriptData.total_word_count}
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded">
                      <div className="text-muted-foreground">Duration</div>
                      <div className="text-xl font-bold">~{estimatedDuration} min</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded">
                      <div className="text-muted-foreground">Batches</div>
                      <div className="text-xl font-bold">{scriptData.batches?.length || 0}</div>
                    </div>
                  </div>

                  {scriptData.polished_content && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
                      ✓ Script has been audited and polished for quality
                    </div>
                  )}

                  <div className="bg-card border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {scriptData.polished_content || scriptData.full_script}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error state */}
              {status === 'error' && (
                <div className="mt-4">
                  <Button onClick={handleReset} variant="outline" className="w-full">
                    Start Over
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
