import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const DEFAULT_MESSAGES = [
  'Finding members who match your interests…',
  'Preparing personalized recommendations…',
  'Looking at your mood and recent activity…',
  'Almost there…',
];

/**
 * DP-002 — Meaningful AI loading. Rotates contextual, human messages so
 * members always understand what the app is doing — never a lone spinner.
 * Pass `messages` to customize, or omit for the default Nmood set.
 */
export default function AILoadingMessage({ messages, icon: Icon = Sparkles, className = '' }) {
  const list = messages?.length ? messages : DEFAULT_MESSAGES;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 2200);
    return () => clearInterval(t);
  }, [list.length]);

  return (
    <div className={`flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary animate-pulse" />
      </div>
      <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-muted flex items-center gap-2">
        <span className="w-3 h-3 border-2 border-muted-foreground/40 border-t-primary rounded-full animate-spin" />
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            {list[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}