"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/features/workspace/ui";

const STATUS_STYLES = {
  QUEUED: "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
  RINGING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  IN_PROGRESS: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  ENDED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  FAILED: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

const LIVE = new Set(["QUEUED", "RINGING", "IN_PROGRESS"]);

export default function CallLogsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [needsRestart, setNeedsRestart] = useState(false);
  const pollRef = useRef(null);
  const autoSyncedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/calls");
      setCalls(res.data || []);
    } catch (e) {
      console.error("Failed to load calls", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncCall = useCallback(async (id, silent = false) => {
    if (!silent) setSyncingId(id);
    try {
      const res = await apiClient.post(`/api/calls/${id}/sync`);
      setCalls((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      return res.data;
    } catch (e) {
      if (e?.response?.status === 404) setNeedsRestart(true);
      if (!silent) toast.error(e?.response?.data?.message || "Couldn't refresh the call.");
    } finally {
      if (!silent) setSyncingId(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // One-shot on load: pull recordings/transcripts for any call missing them.
  useEffect(() => {
    if (loading || autoSyncedRef.current || calls.length === 0) return;
    autoSyncedRef.current = true;
    calls.forEach((c) => {
      if (c.vapiCallId && !c.recordingUrl && c.status !== "FAILED") syncCall(c.id, true);
    });
  }, [loading, calls, syncCall]);

  // Auto-poll any live calls every 5s so the recording/transcript fills in.
  useEffect(() => {
    const liveOnes = calls.filter((c) => LIVE.has(c.status) && c.vapiCallId);
    if (!liveOnes.length) return;
    pollRef.current = setInterval(() => {
      liveOnes.forEach((c) => syncCall(c.id, true));
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [calls, syncCall]);

  const sendInvite = async (call, channel) => {
    if (!call.contactId) return;
    setBusyId(call.id);
    try {
      const res = await apiClient.post(`/api/invites/send/${call.contactId}`, { channel });
      if (res.data?.status === "SENT") {
        toast.success(`${channel === "WHATSAPP" ? "WhatsApp" : "SMS"} invite sent to ${call.contactName}.`);
      } else {
        toast.error(res.data?.errorMessage || "Invite could not be sent.");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't send the invite.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="glass-panel animate-rise p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              <PhoneCall className="h-3 w-3 text-cyan-300" />
              Voice activity
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Call Logs</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
              Every AI call with its recording, transcript and the qualification result. Send the
              platform invite to customers who agreed.
            </p>
          </div>
          <Button
            onClick={load}
            variant="outline"
            className="h-10 shrink-0 rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {needsRestart && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
          The call-sync endpoint isn&apos;t responding — <span className="font-medium">restart the Spring Boot backend</span>{" "}
          to load recordings &amp; transcripts (the <span className="font-mono">/api/calls/&#123;id&#125;/sync</span> route is new).
        </div>
      )}

      <GlassCard className="overflow-hidden p-0">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-zinc-500">
              <PhoneCall className="h-7 w-7" />
            </span>
            <p className="text-base font-medium text-white">No calls yet</p>
            <p className="text-sm text-zinc-500">Place a call from the Contacts page to see it here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {calls.map((c) => {
              const isOpen = expanded === c.id;
              const ended = c.status === "ENDED";
              return (
                <div key={c.id}>
                  <div className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-cyan-300">
                      <PhoneCall className="h-4 w-4" />
                    </span>
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-white">{c.contactName || "Unknown"}</p>
                          {c.qualified === true && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" /> Agreed
                            </span>
                          )}
                        </div>
                        <p className="truncate font-mono text-xs text-zinc-500">{c.contactPhone}</p>
                      </div>
                      {c.recordingUrl && (
                        <span className="hidden items-center gap-1 rounded-md bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300 md:inline-flex">
                          <AudioLines className="h-3 w-3" /> Recording
                        </span>
                      )}
                      <span
                        className={cn(
                          "hidden rounded-md border px-2 py-0.5 text-[11px] font-medium sm:inline-flex",
                          STATUS_STYLES[c.status] || STATUS_STYLES.QUEUED
                        )}
                      >
                        {c.status}
                        {LIVE.has(c.status) && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
                      </span>
                      <ChevronDown
                        className={cn("h-4 w-4 shrink-0 text-zinc-500 transition-transform", isOpen && "rotate-180")}
                      />
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => syncCall(c.id)}
                        disabled={syncingId === c.id}
                        className="h-8 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                      >
                        {syncingId === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Sync
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            disabled={busyId === c.id || !c.contactId}
                            className={cn(
                              "h-8 rounded-lg px-3",
                              c.qualified === true
                                ? "bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/30"
                                : "bg-white/[0.05] text-zinc-200 hover:bg-white/[0.1]"
                            )}
                          >
                            {busyId === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Invite
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-white/10 bg-[#0d0f14] text-zinc-200">
                          <DropdownMenuItem
                            onClick={() => sendInvite(c, "WHATSAPP")}
                            className="cursor-pointer focus:bg-white/[0.06] focus:text-white"
                          >
                            <MessageCircle className="h-4 w-4 text-emerald-300" /> Send WhatsApp invite
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => sendInvite(c, "SMS")}
                            className="cursor-pointer focus:bg-white/[0.06] focus:text-white"
                          >
                            <Send className="h-4 w-4 text-cyan-300" /> Send SMS invite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="space-y-4 border-t border-white/[0.05] bg-black/20 px-5 py-5">
                      {c.recordingUrl ? (
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Recording</p>
                          <audio controls src={c.recordingUrl} className="w-full max-w-xl">
                            Your browser does not support audio playback.
                          </audio>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">
                          {ended ? "No recording for this call." : "Recording appears after the call ends — hit Sync."}
                        </p>
                      )}

                      {c.summary && (
                        <div>
                          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Summary</p>
                          <p className="text-sm leading-6 text-zinc-300">{c.summary}</p>
                        </div>
                      )}

                      {c.transcript && (
                        <div>
                          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Transcript</p>
                          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-black/30 p-4 text-sm leading-6 text-zinc-300">
                            {c.transcript}
                          </pre>
                        </div>
                      )}

                      {c.endedReason && (
                        <p className="text-xs text-zinc-500">
                          Ended reason: <span className="font-mono text-zinc-400">{c.endedReason}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
