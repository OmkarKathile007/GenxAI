"use client";

import { cn } from "@/lib/utils";

/**
 * Frosted glass container. `interactive` adds the hover lift + emerald edge.
 * `as` lets it render as a Link/button when needed.
 */
export default function GlassCard({
  as: Tag = "div",
  interactive = false,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(interactive ? "glass-card" : "glass", "overflow-hidden", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
