import React from 'react';
import { Circle } from 'lucide-react';

// Linked Rings — the selected Nmood Circles direction, kept crisp at nav size.
export default function CirclesNavIcon({ active = false, size = 20 }) {
  const color = active ? 'text-primary' : 'nav-inactive';
  const ring = Math.round(size * 0.62);
  return <span className={`relative inline-block ${color}`} style={{ width: size, height: size }} aria-hidden="true">
    <Circle className="absolute left-0 top-[35%]" width={ring} height={ring} strokeWidth={2.25} />
    <Circle className="absolute right-0 top-[35%]" width={ring} height={ring} strokeWidth={2.25} />
    <Circle className="absolute left-1/2 top-0 -translate-x-1/2" width={ring} height={ring} strokeWidth={2.25} />
  </span>;
}
