"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ContactRound,
  Loader2,
  PhoneCall,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlassCard, RadialGauge, StatTile } from "@/components/features/workspace/ui";

const workflow = [
  {
    title: "Complete business profile",
    description:
      "Store business context so the voice agent speaks with product, pricing, and audience awareness.",
    href: "/business-profile",
  },
  {
    title: "Upload target contacts",
    description: "Import CSV data, map columns, validate details, and segment leads by source.",
    href: "/imports",
  },
  {
    title: "Launch a voice campaign",
    description: "Pick contacts, set schedule windows, define qualification questions, place AI calls.",
    href: "/campaigns",
  },
  {
    title: "Read lead intelligence",
    description: "Turn transcripts into lead scores, objections, intent, and next best action.",
    href: "/lead-insights",
  },
];

export default function DashboardPage() {
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const response = await apiClient.get("/api/businesses/me/profile");
        if (response.status === 200) setBusiness(response.data);
      } catch (error) {
        console.error("Unable to load business profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBusiness();
  }, []);

  const profileReady = Boolean(business?.setupComplete);

  // Honest readiness: only the business profile is wired so far.
  const readiness = useMemo(
    () => [
      { label: "Business knowledge", done: profileReady },
      { label: "Contact database", done: false },
      { label: "Campaign scheduler", done: false },
      { label: "Vapi connection", done: false },
      { label: "Lead intelligence", done: false },
    ],
    [profileReady]
  );

  const readyCount = readiness.filter((r) => r.done).length;
  const readyPct = Math.round((readyCount / readiness.length) * 100);

  // Current step in the build sequence = first not-yet-done stage.
  const currentStep = profileReady ? 1 : 0;

  return (
    <div className="space-y-7">
      {/* Hero */}
      <GlassCard className="glass-panel animate-rise p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                profileReady
                  ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                  : "border-amber-400/20 bg-amber-400/[0.08] text-amber-300"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {isLoading ? "Loading workspace" : profileReady ? "Workspace configured" : "Needs setup"}
            </span>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white text-balance md:text-4xl">
              {isLoading ? (
                <span className="inline-flex items-center gap-3 text-zinc-400">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
                  Loading…
                </span>
              ) : (
                business?.businessName || "Set up your first business workspace"
              )}
            </h2>

            <p className="mt-3 text-sm leading-7 text-zinc-400 md:text-base">
              Targeted contacts, AI phone-call campaigns, qualification insights, follow-ups, and
              sales analysis — one command center for a single business.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="group relative h-11 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 font-medium text-black shadow-glow-emerald transition-transform hover:scale-[1.02]"
              >
                <Link href="/imports">
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-white/30 [mask-image:linear-gradient(90deg,transparent,white,transparent)] group-hover:animate-sheen" />
                  Prepare CSV Import
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-white/10 bg-white/[0.03] px-5 text-white hover:bg-white/[0.07]"
              >
                <Link href="/business-profile">View Profile</Link>
              </Button>
            </div>
          </div>

          {/* Readiness ring */}
          <div className="flex shrink-0 items-center gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <RadialGauge value={readyPct} size={120} label="Ready" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Launch readiness</p>
              <p className="text-xs text-zinc-500">
                {readyCount} of {readiness.length} systems online
              </p>
              <p className="mt-2 text-xs text-zinc-500">Business context first, Vapi next.</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Contacts" value="0" icon={ContactRound} hint="CSV import comes next" />
        <StatTile label="Calls Scheduled" value="0" icon={CalendarClock} hint="No active call jobs" />
        <StatTile label="Qualified Leads" value="0" icon={Sparkles} hint="Awaiting voice analysis" />
        <StatTile label="Conversion Rate" value="0%" icon={TrendingUp} hint="No campaign data yet" />
      </section>

      {/* Build sequence + readiness checklist */}
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="p-0">
          <div className="border-b border-white/[0.06] p-5 md:p-6">
            <h3 className="text-base font-semibold text-white">Build sequence</h3>
            <p className="mt-1 text-sm text-zinc-500">
              The platform comes online in this exact order.
            </p>
          </div>

          <ol className="relative p-5 md:p-6">
            {/* connecting rail */}
            <span className="absolute left-[34px] top-9 bottom-9 w-px bg-white/[0.08] md:left-[42px]" />
            {workflow.map((item, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <li key={item.title} className="relative">
                  <Link
                    href={item.href}
                    className="group flex gap-4 rounded-xl p-3 transition-colors hover:bg-white/[0.03]"
                  >
                    <span
                      className={cn(
                        "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                        done && "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
                        active && "border-emerald-400/40 bg-gradient-to-br from-emerald-400 to-cyan-400 text-black shadow-glow-emerald",
                        !done && !active && "border-white/10 bg-white/[0.03] text-zinc-500"
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-medium text-white">{item.title}</h4>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[11px] font-medium",
                            done && "bg-emerald-400/10 text-emerald-300",
                            active && "bg-cyan-400/10 text-cyan-300",
                            !done && !active && "text-zinc-600"
                          )}
                        >
                          {done ? "Done" : active ? "Next" : "Planned"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">{item.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </GlassCard>

        <GlassCard className="p-5 md:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-emerald-400/[0.08] text-emerald-300">
              <PhoneCall className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Voice agent readiness</h3>
              <p className="text-sm text-zinc-500">Each system lights up as you build.</p>
            </div>
          </div>

          <div className="mt-6 space-y-1">
            {readiness.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-white/[0.03]"
              >
                <span className="text-zinc-300">{r.label}</span>
                {r.done ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                    <Check className="h-3.5 w-3.5" /> Online
                  </span>
                ) : (
                  <span className="text-xs text-zinc-600">Not started</span>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
