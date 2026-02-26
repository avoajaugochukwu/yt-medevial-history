'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store';
import { useVideoGeneration } from '@/lib/hooks/use-video-generation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileAudio,
  FileText,
  Video,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
} from 'lucide-react';

export default function VideoGenerationPage() {
  const router = useRouter();
  const { script, storyboardScenes } = useSessionStore();
  const { jobId, status, isPolling, isSubmitting, error, submitJob, reset } =
    useVideoGeneration();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  // Derive state from store
  const originalScript = script?.polished_content || script?.content || '';
  const sceneData = JSON.stringify(
    storyboardScenes.map((s) => ({
      scene_number: s.scene_number,
      script_snippet: s.script_snippet,
      image_url: s.image_url,
    })),
  );
  const hasPrerequisites =
    storyboardScenes.length > 0 && originalScript.length > 0;
  const wordCount = originalScript.split(/\s+/).filter(Boolean).length;
  const imageCount = storyboardScenes.filter((s) => s.image_url).length;

  // UI phase
  const isUploading = !jobId && !status;
  const isComplete = status?.status === 'completed';
  const isFailed = status?.status === 'failed';

  const handleSubmit = () => {
    if (!audioFile || !srtFile) return;
    submitJob(audioFile, srtFile, originalScript, sceneData);
  };

  const handleReset = () => {
    reset();
    setAudioFile(null);
    setSrtFile(null);
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (srtInputRef.current) srtInputRef.current.value = '';
  };

  const progressPercent = status?.progress ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Video Generation
            </h1>
            <p className="text-sm text-gray-600">
              Upload audio and subtitles to generate your final video
            </p>
          </div>

          {/* Prerequisites Warning */}
          {!hasPrerequisites && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Missing prerequisites
                  </p>
                  <p className="text-sm text-amber-700">
                    You need generated scenes and a script before generating a
                    video. Go back to{' '}
                    <button
                      onClick={() => router.push('/scenes')}
                      className="underline font-medium"
                    >
                      Scenes
                    </button>{' '}
                    to generate them first.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scene / Script Summary */}
          {hasPrerequisites && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Project Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm text-gray-600">
                  <div>
                    <span className="font-medium text-gray-900">
                      {storyboardScenes.length}
                    </span>{' '}
                    scenes
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      {wordCount.toLocaleString()}
                    </span>{' '}
                    words
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      {imageCount} / {storyboardScenes.length}
                    </span>{' '}
                    images
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 select-none">
                    Scene images ({imageCount} / {storyboardScenes.length})
                  </summary>
                  <ol className="mt-2 max-h-64 overflow-y-auto space-y-1 text-xs font-mono list-decimal list-inside">
                    {storyboardScenes.map((s, i) => (
                      <li
                        key={s.scene_number ?? i}
                        className={s.image_url ? 'text-gray-600' : 'text-red-600 font-semibold'}
                      >
                        <span className="ml-1">
                          {s.image_url ? s.image_url : 'MISSING'}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              </CardContent>
            </Card>
          )}

          {/* Upload Phase */}
          {isUploading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Files
                </CardTitle>
                <CardDescription>
                  Provide your audio narration and subtitle file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileAudio className="h-4 w-4" />
                    Audio File
                  </label>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,.aac"
                    onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  />
                  <p className="text-xs text-gray-500">
                    Supported: .mp3, .wav, .m4a, .aac
                  </p>
                </div>

                {/* SRT Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Subtitle File (SRT)
                  </label>
                  <input
                    ref={srtInputRef}
                    type="file"
                    accept=".srt"
                    onChange={(e) => setSrtFile(e.target.files?.[0] ?? null)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  />
                  <p className="text-xs text-gray-500">Supported: .srt</p>
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !audioFile || !srtFile || !hasPrerequisites || isSubmitting
                    }
                    className="gap-2"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                    {isSubmitting ? 'Submitting...' : 'Generate Video'}
                  </Button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Polling Phase */}
          {isPolling && status && !isComplete && !isFailed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Video
                </CardTitle>
                <CardDescription>
                  Job ID: {jobId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progressPercent} />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{status.message || status.status}</span>
                  <span>{progressPercent}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result Phase — Success */}
          {isComplete && status && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Video Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobId && (
                  <a
                    href={`/api/video/download/${jobId}`}
                    className="inline-flex items-center gap-2 rounded-md bg-green-700 px-6 py-3 text-sm font-medium text-white hover:bg-green-800 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Video
                  </a>
                )}
                <div>
                  <Button variant="outline" onClick={handleReset}>
                    Generate Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result Phase — Failure */}
          {isFailed && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  Generation Failed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-red-700">
                  {status?.error || error || 'An unexpected error occurred.'}
                </p>
                <Button variant="outline" onClick={handleReset}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.push('/scenes')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Scenes
            </Button>
            <Button
              onClick={() => router.push('/export')}
              className="gap-2"
            >
              Continue to Export
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Footer */}
          <footer className="text-center text-sm text-gray-500 py-4">
            <p>
              Session-only application · No data is saved · Export your work
              before leaving
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
