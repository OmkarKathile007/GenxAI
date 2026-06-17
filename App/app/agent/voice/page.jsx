"use client";

import React, { useEffect, useRef } from "react";
import { XCircle, Loader2, Cpu, Zap, Mic } from "lucide-react";

import { VoicePoweredOrb } from "@/components/features/voice/VoicePoweredOrb";
import { TranscriptPanel } from "@/components/features/voice/TranscriptPanel";
import { NeonButton } from "@/components/features/voice/NeonButton";
import { useVapi } from "@/hooks/useVapi";

// Map Vapi status → hue shift for the orb (degrees)
const STATUS_HUE = {
  disconnected: 0, // purple (default)
  connecting: 55, // yellow
  listening: 140, // green
  thinking: 270, // violet
  speaking: 185, // cyan
};

// ── Floating particle canvas ────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = [];
    const COLORS = ["#06b6d4", "#10b981", "#6366f1", "#a855f7", "#0891b2"];

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.5 + 0.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    let raf;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />;
}

// ── Main page ───────────────────────────────────────────────────────────
export default function VoiceAgentPage() {
  const { status, isSessionActive, transcript, toggleCall, error } = useVapi();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#020810] p-4">
      <div className="relative mx-auto flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] border border-cyan-900/30 bg-[#020810] shadow-[0_0_100px_-20px_rgba(8,145,178,0.2)] animate-in fade-in zoom-in-95 duration-700">
        {/* ── Ambient background ─────────────────────────────────────────── */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <ParticleCanvas />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0891b212_1px,transparent_1px),linear-gradient(to_bottom,#0891b212_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_60%,transparent_100%)]" />
          <div className="absolute left-[-5%] top-[-15%] h-[420px] w-[420px] animate-pulse rounded-full bg-cyan-600/15 blur-[120px]" style={{ animationDuration: "6s" }} />
          <div className="absolute bottom-[-10%] right-[-8%] h-[380px] w-[380px] animate-pulse rounded-full bg-indigo-600/12 blur-[130px]" style={{ animationDuration: "8s", animationDelay: "2s" }} />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/4 blur-[160px]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />
        </div>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <div className="relative z-10 flex h-full flex-col p-6 md:p-10">
          {/* HUD Header */}
          <div className="flex-none space-y-3 border-b border-cyan-900/25 pb-6 text-center">
            <div className="mb-2 inline-flex items-center justify-center gap-2 rounded-full border border-cyan-800/40 bg-cyan-950/40 px-3 py-1">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300">
                System Online
              </span>
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
            </div>

            <h1
              className="bg-clip-text text-5xl font-black tracking-tighter text-transparent md:text-6xl"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #67e8f9 0%, #38bdf8 30%, #818cf8 60%, #34d399 100%)",
                backgroundSize: "200% 200%",
                animation: "gradientShift 5s ease infinite",
                filter: "drop-shadow(0 0 20px rgba(34,211,238,0.35))",
              }}
            >
              GenXAI
            </h1>

            <div className="flex h-6 items-center justify-center gap-2">
              {status === "disconnected" ? (
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-600">
                  Awaiting Voice Input
                </p>
              ) : (
                <div
                  className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
                  style={{
                    color:
                      status === "listening"
                        ? "#34d399"
                        : status === "speaking"
                        ? "#06b6d4"
                        : "#a855f7",
                  }}
                >
                  <Zap className="h-3.5 w-3.5 animate-pulse" />
                  {status === "listening"
                    ? "Voice Input Active"
                    : status === "speaking"
                    ? "Generating Response"
                    : status === "thinking"
                    ? "Processing..."
                    : "Connecting..."}
                </div>
              )}
            </div>
          </div>

          {/* Orb area */}
          <div className="relative flex min-h-[250px] flex-1 flex-col items-center justify-center">
            <div
              className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px] transition-all duration-1000"
              style={{
                background:
                  status === "listening"
                    ? "rgba(16,185,129,0.12)"
                    : status === "speaking"
                    ? "rgba(6,182,212,0.15)"
                    : status === "thinking"
                    ? "rgba(168,85,247,0.12)"
                    : "rgba(6,182,212,0.05)",
              }}
            />

            <button
              onClick={toggleCall}
              aria-label={`Voice agent: ${status}`}
              className="relative z-10 h-56 w-56 rounded-full transition-transform duration-300 hover:scale-[1.03] focus:outline-none active:scale-95"
              style={{ filter: status !== "disconnected" ? "drop-shadow(0 0 32px rgba(99,102,241,0.45))" : "none" }}
            >
              <VoicePoweredOrb
                hue={STATUS_HUE[status] ?? 0}
                enableVoiceControl={status === "listening"}
                className="overflow-hidden rounded-full"
              />

              {/* Mic icon overlay — centered inside the orb */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {status === "connecting" ? (
                  <Loader2 className="h-10 w-10 animate-spin text-white/80 drop-shadow-lg" />
                ) : status === "speaking" ? (
                  <Zap className="h-10 w-10 animate-pulse text-white/90 drop-shadow-lg" />
                ) : (
                  <Mic className="h-10 w-10 text-white/90 drop-shadow-lg" />
                )}
              </div>
            </button>

            {status === "connecting" && (
              <div className="absolute bottom-4 flex animate-pulse items-center gap-3 rounded-xl border border-yellow-800/40 bg-yellow-950/40 px-4 py-2 font-mono text-xs tracking-wider text-yellow-300 backdrop-blur-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Establishing secure handshake...
              </div>
            )}

            {status === "disconnected" && error && (
              <div className="absolute bottom-2 left-1/2 max-w-md -translate-x-1/2 rounded-xl border border-red-800/40 bg-red-950/50 px-4 py-2.5 text-center font-mono text-[11px] leading-relaxed tracking-wide text-red-300 backdrop-blur-md">
                {error}
              </div>
            )}
          </div>

          {/* Transcript panel */}
          <div className="group relative mx-auto h-[30vh] w-full max-w-3xl flex-none md:h-[250px]">
            {["tl", "tr", "bl", "br"].map((pos) => (
              <div
                key={pos}
                className={`absolute z-20 h-5 w-5 ${
                  pos === "tl"
                    ? "left-0 top-0 rounded-tl-lg border-l-2 border-t-2"
                    : pos === "tr"
                    ? "right-0 top-0 rounded-tr-lg border-r-2 border-t-2"
                    : pos === "bl"
                    ? "bottom-0 left-0 rounded-bl-lg border-b-2 border-l-2"
                    : "bottom-0 right-0 rounded-br-lg border-b-2 border-r-2"
                } border-cyan-500/40`}
              />
            ))}

            <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border border-cyan-900/40 bg-slate-900/80 px-3 py-0.5 font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-600">
              Transcript
            </div>

            <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/[0.04] bg-slate-950/50 shadow-[inset_0_0_40px_rgba(8,145,178,0.04)] backdrop-blur-xl">
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-14 w-full bg-gradient-to-b from-slate-950/90 to-transparent" />
              <div className="custom-scrollbar h-full w-full overflow-y-auto p-5 pt-8">
                <TranscriptPanel items={transcript} />
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-14 w-full bg-gradient-to-t from-slate-950/90 to-transparent" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex min-h-[80px] flex-none justify-center pt-6">
            {isSessionActive ? (
              <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                <NeonButton
                  variant="danger"
                  onClick={toggleCall}
                  className="group relative w-full overflow-hidden rounded-full border border-red-500/40 bg-red-950/50 px-10 py-3 shadow-[0_0_24px_rgba(239,68,68,0.2)] transition-all hover:border-red-400 hover:bg-red-900/50 hover:shadow-[0_0_36px_rgba(239,68,68,0.45)] md:w-auto"
                >
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-red-400 group-hover:text-red-300">
                    <XCircle className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                    Terminate Session
                  </div>
                </NeonButton>
              </div>
            ) : (
              <div className="h-[46px]" />
            )}
          </div>
        </div>

        {/* Global styles */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6,182,212,0.25);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6,182,212,0.45);
        }
      `,
          }}
        />
      </div>
    </div>
  );
}
