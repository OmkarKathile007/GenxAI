"use client";

/**
 * Fixed aurora field that sits behind the whole workspace.
 * Three slow-drifting color wells over a near-black base, plus a faint
 * grain layer so the gradients never band. Deliberately low-opacity —
 * it should be felt, not seen. CSS-driven (no JS) so it stays cheap.
 */
export default function AuroraBackground() {
  return (
    <div className="aurora-field aurora-grain" aria-hidden="true">
      <div className="aurora-blob aurora-blob--emerald animate-aurora-slow" />
      <div className="aurora-blob aurora-blob--cyan animate-aurora-slower" />
      <div className="aurora-blob aurora-blob--violet animate-aurora-slow" />
    </div>
  );
}
