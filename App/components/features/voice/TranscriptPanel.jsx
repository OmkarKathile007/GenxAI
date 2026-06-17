"use client";

import React, { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Chat-style transcript for the live voice session. Auto-scrolls to the
 * newest line; tool-call/tool-output rows are hidden for a clean UI.
 */
export function TranscriptPanel({ items = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  const visibleItems = items.filter(
    (item) => item.role === "user" || item.role === "assistant"
  );

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 space-y-6 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-4 shadow-inner backdrop-blur-sm">
        {visibleItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4 text-slate-500 opacity-50">
            <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-white/5">
              <Bot className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-light tracking-wider">AWAITING AUDIO INPUT...</p>
          </div>
        ) : (
          visibleItems.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "flex animate-in slide-in-from-bottom-2 gap-4 duration-500",
                item.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border",
                  item.role === "user"
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                    : "border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                )}
              >
                {item.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div
                className={cn(
                  "relative max-w-[80%] rounded-2xl border p-4 text-sm leading-relaxed shadow-lg backdrop-blur-md",
                  item.role === "user"
                    ? "rounded-tr-none border-emerald-500/30 bg-gradient-to-br from-emerald-900/80 to-emerald-800/80 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "rounded-tl-none border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/90 text-slate-200 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                )}
              >
                <p className="font-light tracking-wide">{item.text}</p>
                <div
                  className={cn(
                    "absolute bottom-0 h-px w-full opacity-30",
                    item.role === "user"
                      ? "right-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                      : "left-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                  )}
                />
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}

export default TranscriptPanel;
