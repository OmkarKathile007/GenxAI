import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import GlassCard from "./ui/GlassCard";

export default function SectionPlaceholder({ title, eyebrow, description, nextStep, children }) {
  return (
    <div className="space-y-6">
      <GlassCard className="glass-panel animate-rise p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              <Sparkles className="h-3 w-3 text-emerald-300" />
              {eyebrow}
            </span>
          )}
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white text-balance md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{description}</p>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-8">
        {children}
        <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">{nextStep}</p>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07]"
          >
            <Link href="/dashboard">
              Back to Overview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
