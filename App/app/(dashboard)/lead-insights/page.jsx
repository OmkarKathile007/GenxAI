"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/features/workspace/ui";

// Fields we surface from the consultation's extracted structuredData.
const DETAIL_FIELDS = [
  ["Services interested", "servicesInterested"],
  ["Need / goal", "userNeed"],
  ["Current problem", "currentProblem"],
  ["Budget", "budgetRange"],
  ["Timeline", "decisionTimeline"],
  ["Objections", "objections"],
  ["Recommended offer", "recommendedOffer"],
  ["Next best action", "nextBestAction"],
];

function parseData(raw) {
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export default function LeadInsightsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/consultations");
      setSessions(res.data || []);
    } catch (e) {
      console.error("Failed to load consultations", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async (id) => {
    setSyncingId(id);
    try {
      const res = await apiClient.post(`/api/consultations/${id}/sync`);
      setSessions((prev) => prev.map((s) => (s.id === id ? res.data : s)));
      toast.success("Insights refreshed.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't refresh insights.");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="glass-panel animate-rise p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              <Sparkles className="h-3 w-3 text-violet-300" />
              Sales intelligence
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Lead Insights</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
              Details and service needs the AI extracted from each customer&apos;s on-platform voice
              consultation.
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

      {loading ? (
        <GlassCard className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
        </GlassCard>
      ) : sessions.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-zinc-500">
            <Sparkles className="h-7 w-7" />
          </span>
          <p className="text-base font-medium text-white">No consultations yet</p>
          <p className="max-w-md text-sm text-zinc-500">
            When a customer opens their invite link and completes the voice consultation, their
            extracted profile appears here.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {sessions.map((s) => {
            const data = parseData(s.structuredData);
            const prob = data?.conversionProbability;
            return (
              <GlassCard key={s.id} className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{s.contactName || "Customer"}</h3>
                    <p className="font-mono text-xs text-zinc-500">{s.contactPhone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {typeof prob === "number" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-300">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {prob}%
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => sync(s.id)}
                      disabled={syncingId === s.id}
                      className="h-8 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    >
                      {syncingId === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <span
                  className={cn(
                    "mt-3 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium",
                    s.status === "ENDED"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                  )}
                >
                  {s.status === "ENDED" ? "Completed" : "In progress"}
                </span>

                {data ? (
                  <dl className="mt-4 space-y-2.5">
                    {DETAIL_FIELDS.map(([label, key]) =>
                      data[key] ? (
                        <div key={key} className="grid grid-cols-[130px_1fr] gap-2 text-sm">
                          <dt className="text-zinc-500">{label}</dt>
                          <dd className="text-zinc-200">{String(data[key])}</dd>
                        </div>
                      ) : null
                    )}
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">
                    {s.status === "ENDED"
                      ? "No structured details extracted. Hit refresh to re-pull from Vapi."
                      : "Awaiting completion — analysis appears after the consultation ends."}
                  </p>
                )}

                {s.summary && (
                  <p className="mt-4 border-t border-white/[0.06] pt-4 text-sm leading-6 text-zinc-400">
                    {s.summary}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
