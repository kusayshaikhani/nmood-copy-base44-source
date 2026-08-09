import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function InMoodPeopleEmpty({ onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[22px] border border-dashed border-border/70 bg-secondary/40 p-10 text-center"
    >
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        className="relative w-16 h-16 mx-auto rounded-full bg-nmood-cta flex items-center justify-center mb-5 shadow-lg shadow-primary/25"
      >
        <Sparkles className="w-7 h-7 text-white" />
        <span className="absolute inset-0 rounded-full bg-nmood-cta animate-ping opacity-20" />
      </motion.div>
      <h3 className="relative text-lg font-bold text-foreground mb-1.5">No people found — yet</h3>
      <p className="relative text-sm text-muted-foreground mb-6 max-w-[28ch] mx-auto">
        The mood is quiet for now. Try another category or clear filters to see who's Nmood near you.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="relative h-11 px-6 rounded-full bg-nmood-cta text-white text-sm font-bold shadow-lg shadow-primary/25 active:scale-95 transition-transform"
      >
        Clear filters
      </button>
    </motion.div>
  );
}