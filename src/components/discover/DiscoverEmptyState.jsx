import React from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * UI-004 Phase 4 — Premium empty state for Discover.
 * Soft gradient orb illustration, encouraging copy, primary action.
 * Replaces "No results" / "Tap to retry" with beautiful, motivating states.
 */
export default function DiscoverEmptyState({ title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center text-center py-16 px-4"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" aria-hidden="true" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/15 to-accent/20 flex items-center justify-center border border-primary/10">
          <Compass className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </div>
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-lg font-semibold mb-2 max-w-sm text-balance"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed"
      >
        {description}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Button onClick={onAction} size="lg" className="gap-2 min-w-[10rem]">
          {actionLabel}
        </Button>
      </motion.div>
    </motion.div>
  );
}