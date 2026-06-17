"use client";

import React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function NeonButton({ children, className, variant = "primary", isLoading, ...props }) {
  const variants = {
    primary:
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    secondary: "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white",
    danger:
      "bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]",
  };

  return (
    <button
      className={cn(
        "relative flex items-center justify-center gap-2 rounded-lg border px-6 py-3 font-medium tracking-wide backdrop-blur-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export default NeonButton;
