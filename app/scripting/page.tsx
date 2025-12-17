"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { HistoricalEra, ContentType, NarrativeTone, HistoricalResearch, NarrativeOutline, Script } from '@/lib/types';
import { useSessionStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';
type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

interface Step {
  number: number;
  label: string;
  status: StepStatus;
}

export default function HistoricalScriptingPage() {
  const router = useRouter();
  const { setHistoricalTopic, setResearch, setOutline, setScript } = useSessionStore();

  // Form inputs
  const [title, setTitle] = useState('');
  const [era, setEra] = useState<HistoricalEra>('Roman Empire');
  const [contentType, setContentType] = useState<ContentType>('Battle');
  const [tone, setTone] = useState<NarrativeTone>('Epic');
  const [targetDuration, setTargetDuration] = useState<number>(10);

  // Generation state
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [steps, setSteps] = useState<Step[]>([
    { number: 1, label: 'Researching Historical Facts', status: 'pending' },
    { number: 2, label: 'Creating Narrative Structure', status: 'pending' },
    { number: 3, label: 'Generating Historical Script', status: 'pending' },
  ]);

  // Generated data
  const [researchData, setResearchData] = useState<HistoricalResearch | null>(null);
  const [outlineData, setOutlineData] = useState<NarrativeOutline | null>(null);
  const [scriptData, setScriptData] = useState<Script | null>(null);

  // UI state
  const [copied, setCopied] = useState(false);

  const updateStepStatus = (stepNumber: number, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((step) => (step.number === stepNumber ? { ...step, status } : step))
    );
  };

  const handleGenerate = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Please provide a historical topic title');
      return;
    }

    if (!era || !contentType || !tone) {
      toast.error('Please select era, content type, and tone');
      return;
    }

    if (!targetDuration || targetDuration <= 0) {
      toast.error('Please provide a valid target duration');
      return;
    }

    setStatus('generating');

    // Reset all steps
    setSteps((prev) => prev.map((step) => ({ ...step, status: 'pending' as StepStatus })));

    // Reset generated data
    setResearchData(null);
    setOutlineData(null);
    setScriptData(null);

    try {
      // ============================================================================
      // STEP 1: Historical Research
      // ============================================================================
      updateStepStatus(1, 'in_progress');

      const step1Response = await fetch('/api/research/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, era, contentType, targetDuration }),
      });

      if (!step1Response.ok) {
        const errorData = await step1Response.json();
        throw new Error(errorData.error || 'Historical research failed');
      }

      const step1Data = await step1Response.json();
      const research: HistoricalResearch = step1Data.research;
      const artStyle: string | undefined = step1Data.artStyle;

      setResearchData(research);
      updateStepStatus(1, 'completed');

      console.log('[Step 1] Historical research completed:', research);
      if (artStyle) {
        console.log('[Step 1] Art style generated:', artStyle.substring(0, 100) + '...');
      }

      // ============================================================================
      // STEP 2: Narrative Outline
      // ============================================================================
      updateStepStatus(2, 'in_progress');

      const step2Response = await fetch('/api/generate/narrative-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          research: JSON.stringify(research),
          tone,
          targetDuration,
        }),
      });

      if (!step2Response.ok) {
        const errorData = await step2Response.json();
        throw new Error(errorData.error || 'Narrative outline generation failed');
      }

      const step2Data = await step2Response.json();
      const outline: NarrativeOutline = step2Data.outline;

      setOutlineData(outline);
      updateStepStatus(2, 'completed');

      console.log('[Step 2] Narrative outline completed:', outline);

      // ============================================================================
      // STEP 3: Final Script
      // ============================================================================
      updateStepStatus(3, 'in_progress');

      const step3Response = await fetch('/api/generate/final-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          research: JSON.stringify(research),
          outline: JSON.stringify(outline),
          tone,
          era,
          targetDuration,
        }),
      });

      if (!step3Response.ok) {
        const errorData = await step3Response.json();
        throw new Error(errorData.error || 'Script generation failed');
      }

      const step3Data = await step3Response.json();
      const script: Script = step3Data.script;

      setScriptData(script);
      updateStepStatus(3, 'completed');

      console.log('[Step 3] Final script completed:', script);

      // Save to store
      setHistoricalTopic({ title, era, contentType, tone, created_at: new Date(), artStyle });
      setResearch(research);
      setOutline(outline);
      setScript(script);

      setStatus('completed');
      toast.success('Historical narrative generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);

      // Mark the current in-progress step as error
      const currentStep = steps.find((s) => s.status === 'in_progress');
      if (currentStep) {
        updateStepStatus(currentStep.number, 'error');
      }

      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Generation failed: ${errorMessage}`);
    }
  };

  const handleCopy = async () => {
    if (scriptData?.content) {
      await navigator.clipboard.writeText(scriptData.content);
      setCopied(true);
      toast.success('Script copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProceedToScenes = () => {
    if (scriptData?.content) {
      router.push('/scenes');
    }
  };

  const getStepIcon = (stepStatus: StepStatus) => {
    if (stepStatus === 'completed') return <Check className="h-5 w-5 text-green-600" />;
    if (stepStatus === 'in_progress')
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    if (stepStatus === 'error') return <span className="text-red-600">✗</span>;
    return <span className="text-muted-foreground">○</span>;
  };

  const estimatedDuration = scriptData?.target_duration ||
    (scriptData?.word_count ? Math.round((scriptData.word_count / 150) * 10) / 10 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Configuration Card */}
        {status === 'idle' && (
          <Card className="shadow-lg border-border/50">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-serif">Historical Topic Configuration</CardTitle>
              <CardDescription className="text-base">
                Choose your historical era, content type, and narrative style to generate a
                compelling historical narrative
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., The Crossing of the Rubicon"
                  className="text-base h-12"
                />
              </div>

              {/* Era, Content Type, and Target Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="era" className="text-base font-medium">
                    Historical Era
                  </Label>
                  <Select value={era} onValueChange={(value) => setEra(value as HistoricalEra)}>
                    <SelectTrigger id="era" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Roman Republic">Roman Republic</SelectItem>
                      <SelectItem value="Roman Empire">Roman Empire</SelectItem>
                      <SelectItem value="Medieval">Medieval</SelectItem>
                      <SelectItem value="Napoleonic">Napoleonic</SelectItem>
                      <SelectItem value="Prussian">Prussian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType" className="text-base font-medium">
                    Content Type
                  </Label>
                  <Select
                    value={contentType}
                    onValueChange={(value) => setContentType(value as ContentType)}
                  >
                    <SelectTrigger id="contentType" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Biography">Biography</SelectItem>
                      <SelectItem value="Battle">Battle</SelectItem>
                      <SelectItem value="Culture">Culture</SelectItem>
                      <SelectItem value="Mythology">Mythology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDuration" className="text-base font-medium">
                    Target Duration (min)
                  </Label>
                  <Input
                    id="targetDuration"
                    type="number"
                    min="1"
                    step="1"
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(Number(e.target.value))}
                    placeholder="e.g., 10"
                    className="text-base h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    ~{targetDuration * 150} words
                  </p>
                </div>
              </div>

              {/* Narrative Tone */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Narrative Tone</Label>
                <RadioGroup value={tone} onValueChange={(value) => setTone(value as NarrativeTone)}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="Epic" id="epic" />
                      <Label htmlFor="epic" className="cursor-pointer flex-1">
                        <div className="font-medium">Epic</div>
                        <div className="text-xs text-muted-foreground">
                          Heroic and grand scale
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="Documentary" id="documentary" />
                      <Label htmlFor="documentary" className="cursor-pointer flex-1">
                        <div className="font-medium">Documentary</div>
                        <div className="text-xs text-muted-foreground">
                          Analytical and factual
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="Tragic" id="tragic" />
                      <Label htmlFor="tragic" className="cursor-pointer flex-1">
                        <div className="font-medium">Tragic</div>
                        <div className="text-xs text-muted-foreground">
                          Melancholic and somber
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="Educational" id="educational" />
                      <Label htmlFor="educational" className="cursor-pointer flex-1">
                        <div className="font-medium">Educational</div>
                        <div className="text-xs text-muted-foreground">Clear and accessible</div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Historical Narrative
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
                Creating your historical narrative: {title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Steps */}
              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex-shrink-0">{getStepIcon(step.status)}</div>
                    <div className="flex-1">
                      <p className="font-medium">{step.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Generated Script */}
              {scriptData && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Script</h3>
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
                      <div className="text-xl font-bold">{scriptData.word_count}</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded">
                      <div className="text-muted-foreground">Duration</div>
                      <div className="text-xl font-bold">~{estimatedDuration} min</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded">
                      <div className="text-muted-foreground">Tone</div>
                      <div className="text-xl font-bold">{scriptData.tone}</div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {scriptData.content}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error state */}
              {status === 'error' && (
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setStatus('idle');
                      setSteps((prev) =>
                        prev.map((step) => ({ ...step, status: 'pending' as StepStatus }))
                      );
                    }}
                    variant="outline"
                    className="w-full"
                  >
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
