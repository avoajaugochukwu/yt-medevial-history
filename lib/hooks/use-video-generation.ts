'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { POLL_INTERVAL_MS, TERMINAL_STATES } from '@/lib/config/video';
import type { VideoGenerationStatus } from '@/lib/types';

export function useVideoGeneration() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoGenerationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const pollStatus = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/video/status/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Status check failed (${res.status})`);
        }
        const data: VideoGenerationStatus = await res.json();
        setStatus(data);

        if (TERMINAL_STATES.has(data.status)) {
          stopPolling();
          if (data.status === 'failed') {
            setError(data.error || 'Video generation failed');
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check status';
        setError(message);
        stopPolling();
      }
    },
    [stopPolling],
  );

  const submitJob = useCallback(
    async (audio: File, originalScript: string, sceneData: string) => {
      setError(null);
      setStatus(null);
      setJobId(null);
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('audio', audio);
      formData.append('original_script', originalScript);
      formData.append('scene_data', sceneData);

      try {
        const res = await fetch('/api/video/generate', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Submission failed (${res.status})`);
        }

        const { job_id } = await res.json();
        setJobId(job_id);
        setIsPolling(true);

        // Start polling
        intervalRef.current = setInterval(() => pollStatus(job_id), POLL_INTERVAL_MS);
        // Immediately poll once
        pollStatus(job_id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit job';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [pollStatus],
  );

  const reset = useCallback(() => {
    stopPolling();
    setJobId(null);
    setStatus(null);
    setError(null);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { jobId, status, isPolling, isSubmitting, error, submitJob, reset };
}
