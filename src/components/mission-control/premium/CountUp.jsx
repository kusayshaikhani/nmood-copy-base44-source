import React, { useEffect, useRef, useState } from 'react';

/**
 * UI-025 — Animated count-up number. Starts from 0 and eases to the target
 * when the element scrolls into view. Respects prefers-reduced-motion.
 */
export default function CountUp({ value = 0, duration = 900, className = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const to = Number(value) || 0;
    if (reduce) { setDisplay(to); return; }

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(to * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const node = ref.current;
    if (!node) { run(); return; }
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { run(); io.disconnect(); } },
      { threshold: 0.3 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [value, duration]);

  return <span ref={ref} className={className}>{display.toLocaleString()}</span>;
}