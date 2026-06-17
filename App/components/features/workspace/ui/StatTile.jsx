"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";
import Sparkline from "./Sparkline";

/**
 * Metric tile: label + icon, large tabular value, optional trend chip and
 * sparkline. Trend defaults to neutral; pass `trend` as a signed number.
 */
export default function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  spark,
  accent = "#34d399",
  className,
}) {
  const hasTrend = typeof trend === "number" && trend !== 0;
  const up = (trend ?? 0) >= 0;

  return (
    <GlassCard interactive className={cn("group p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition-colors group-hover:text-emerald-300">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="nums font-mono text-[2rem] font-semibold leading-none text-white">
            {value}
          </p>
          {(hint || hasTrend) && (
            <div className="mt-2 flex items-center gap-2">
              {hasTrend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                    up
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-rose-400/10 text-rose-300"
                  )}
                >
                  {up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(trend)}%
                </span>
              )}
              {hint && <span className="text-xs text-zinc-500">{hint}</span>}
            </div>
          )}
        </div>

        {spark?.length ? (
          <Sparkline
            data={spark}
            width={92}
            height={40}
            stroke={accent}
            className="h-10 w-24 shrink-0 opacity-80 transition-opacity group-hover:opacity-100"
          />
        ) : null}
      </div>
    </GlassCard>
  );
}
