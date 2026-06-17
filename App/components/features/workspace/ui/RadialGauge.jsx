"use client";

import { useId } from "react";

/**
 * Circular progress gauge (0–100). Pure SVG. Used for conversion rate,
 * qualification %, lead-score readouts. Center slot holds the value.
 */
export default function RadialGauge({
  value = 0,
  size = 132,
  stroke = 9,
  from = "#34d399",
  to = "#22d3ee",
  label,
  children,
}) {
  const id = useId();
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          <>
            <span className="nums font-mono text-2xl font-semibold text-white">
              {Math.round(clamped)}%
            </span>
            {label && (
              <span className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                {label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
