"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";

export default function CallRecording({ callId }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setUrl(null);
    setError("");
    apiClient.get(`/api/calls/${callId}/recording`, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          if (data?.url) setUrl(data.url);
          else setError("No playback link is available. Please retry.");
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.response?.data?.message || "Couldn't load the recording. Please retry.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [callId, attempt]);

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Recording</p>
      {loading && <p role="status" className="text-sm text-zinc-400">Loading recording…</p>}
      {url && !error && (
        <audio
          key={`${callId}-${attempt}`}
          controls
          preload="metadata"
          src={url}
          aria-label="Call recording"
          className="w-full max-w-xl"
          onError={() => setError("The audio couldn't be played. Retry to get a fresh playback link.")}
        >
          Your browser does not support audio playback.
        </audio>
      )}
      {error && (
        <div role="alert" className="space-y-2">
          <p className="text-sm text-amber-200">{error}</p>
          <Button size="sm" variant="outline" onClick={() => setAttempt((value) => value + 1)}>
            Retry recording
          </Button>
        </div>
      )}
    </div>
  );
}
