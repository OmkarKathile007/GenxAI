"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Mic, PhoneOff, Sparkles, XCircle } from "lucide-react";

import apiClient from "@/lib/apiClient";
import { VoicePoweredOrb } from "@/components/features/voice/VoicePoweredOrb";
import { TranscriptPanel } from "@/components/features/voice/TranscriptPanel";
import { useVapi } from "@/hooks/useVapi";

const STATUS_HUE = { disconnected: 0, connecting: 55, listening: 140, thinking: 270, speaking: 185 };

export default function InviteConsultationPage() {
  const { token } = useParams();
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const { status, isSessionActive, transcript, toggleCall, callId } = useVapi({
    assistantOverrides: resolved?.assistantOverrides,
  });

  const wasActive = useRef(false);
  const recordedRef = useRef(false);

  useEffect(() => {
    apiClient
      .get(`/api/invite/${token}`)
      .then((res) => setResolved(res.data))
      .catch(() => setResolved({ valid: false }))
      .finally(() => setLoading(false));
  }, [token]);

  // When the consultation ends, record the call so its analysis is extracted.
  useEffect(() => {
    if (isSessionActive) wasActive.current = true;
    if (wasActive.current && !isSessionActive && callId && !recordedRef.current) {
      recordedRef.current = true;
      apiClient
        .post(`/api/invite/${token}/consultation`, { vapiCallId: callId })
        .catch((e) => console.error("Failed to record consultation", e))
        .finally(() => setFinished(true));
    }
  }, [isSessionActive, callId, token]);

  if (loading) {
    return (
      <Shell>
        <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
      </Shell>
    );
  }

  if (!resolved?.valid) {
    return (
      <Shell>
        <div className="text-center">
          <XCircle className="mx-auto h-10 w-10 text-rose-400" />
          <h1 className="mt-4 text-xl font-semibold text-white">This invite link is invalid</h1>
          <p className="mt-2 text-sm text-slate-400">Please check the link or ask for a new one.</p>
        </div>
      </Shell>
    );
  }

  const first = (resolved.contactName || "there").split(" ")[0];

  return (
    <Shell>
      <div className="w-full max-w-2xl text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-800/40 bg-cyan-950/40 px-3 py-1">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300">
            {resolved.businessName || "Voice consultation"}
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {finished ? "Thank you!" : `Hi ${first}, welcome 👋`}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          {finished
            ? "Your consultation is complete — our team has received your details and will follow up shortly."
            : `Tap the orb to start a quick voice consultation${
                resolved.agentName ? ` with ${resolved.agentName}` : ""
              }. It takes just a couple of minutes.`}
        </p>

        {!finished && (
          <>
            <div className="relative mx-auto my-8 flex h-64 items-center justify-center">
              <div
                className="absolute h-56 w-56 rounded-full blur-[70px] transition-all duration-1000"
                style={{
                  background:
                    status === "listening"
                      ? "rgba(16,185,129,0.16)"
                      : status === "speaking"
                      ? "rgba(6,182,212,0.18)"
                      : "rgba(6,182,212,0.06)",
                }}
              />
              <button
                onClick={toggleCall}
                aria-label={`Consultation: ${status}`}
                className="relative z-10 h-52 w-52 rounded-full transition-transform duration-300 hover:scale-[1.03] active:scale-95"
                style={{ filter: status !== "disconnected" ? "drop-shadow(0 0 32px rgba(99,102,241,0.45))" : "none" }}
              >
                <VoicePoweredOrb
                  hue={STATUS_HUE[status] ?? 0}
                  enableVoiceControl={status === "listening"}
                  className="overflow-hidden rounded-full"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {status === "connecting" ? (
                    <Loader2 className="h-9 w-9 animate-spin text-white/80" />
                  ) : isSessionActive ? (
                    <PhoneOff className="h-9 w-9 text-white/90" />
                  ) : (
                    <Mic className="h-9 w-9 text-white/90" />
                  )}
                </div>
              </button>
            </div>

            <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
              {status === "disconnected"
                ? "Tap to start"
                : status === "connecting"
                ? "Connecting…"
                : status === "listening"
                ? "Listening — speak now"
                : status === "speaking"
                ? "Assistant speaking"
                : "Processing…"}
            </p>

            {transcript.length > 0 && (
              <div className="mx-auto mt-6 h-56 max-w-xl overflow-hidden rounded-xl border border-white/[0.05] bg-slate-950/50 p-4 text-left">
                <TranscriptPanel items={transcript} />
              </div>
            )}
          </>
        )}

        {finished && <CheckCircle2 className="mx-auto mt-8 h-14 w-14 text-emerald-400" />}
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#020810] p-4">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-5%] top-[-15%] h-[420px] w-[420px] animate-pulse rounded-full bg-cyan-600/15 blur-[120px]" style={{ animationDuration: "6s" }} />
        <div className="absolute bottom-[-10%] right-[-8%] h-[380px] w-[380px] animate-pulse rounded-full bg-emerald-600/12 blur-[130px]" style={{ animationDuration: "8s", animationDelay: "2s" }} />
      </div>
      <div className="relative z-10 flex w-full items-center justify-center">{children}</div>
    </main>
  );
}
