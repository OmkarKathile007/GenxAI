"use client";

import { useId } from "react";

/**
 * Minimal area sparkline drawn from a number[]. Pure SVG, no deps.
 * Smooths the path with simple Catmull-Rom-ish midpoint curves so it
 * reads as hand-tuned rather than a jagged polyline.
 */
export default function Sparkline({
  data = [],
  width = 220,
  height = 56,
  stroke = "#34d399",
  className,
}) {
  const id = useId();
  if (!data.length) return null;

  const pad = 3;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (data.length - 1 || 1);

  const pts = data.map((v, i) => [
    pad + i * stepX,
    height - pad - ((v - min) / span) * (height - pad * 2),
  ]);

  // Smooth curve through points via quadratic midpoints.
  let line = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const mx = (px + cx) / 2;
    const my = (py + cy) / 2;
    line += ` Q ${px},${py} ${mx},${my}`;
  }
  line += ` T ${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;

  const area = `${line} L ${width - pad},${height} L ${pad},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      role="img"
    >
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#fill-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
