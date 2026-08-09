import React from 'react';
import { motion } from 'framer-motion';

/**
 * UI-026 — Premium inline loading indicator. Three soft brand-gradient dots
 * that breathe, replacing ugly spinners for small inline loaders. For
 * full-screen / list loading, prefer the skeleton layouts from
 * `@/components/ui/skeleton` which match the final content shape.
 */
export default function LoadingState({ label = 'Getting things ready…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`} role="status" aria-live="polite">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
          />
        ))}
      </div>
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}