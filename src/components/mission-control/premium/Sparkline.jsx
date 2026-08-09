import React from 'react';

/**
 * UI-025 — Lightweight inline SVG sparkline with a soft gradient fill.
 * Uses vector-effect to keep strokes crisp when scaled to container width.
 */
export default function Sparkline({ data = [], color = 'hsl(var(--primary))', height = 32, id = 'sl' }) {
  if (!data.length) return null;
  const W = 100, H = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const step = data.length > 1 ? W / (data.length - 1) : W;
  const pts = data.map((v, i) => [i * step, H - ((v - min) / span) * (H - 4) - 2]);
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}