import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

/**
 * UI-020 — Sticky progress header with animated progress bar.
 * Shows "Step X of 6", current step name, and a back button.
 */
export default function CreateProgress({ currentStep, totalSteps, stepName, title, onBack }) {
  const pct = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40">
      <div className="flex items-center gap-3 px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
          type="button"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight truncate">{title}</h1>
          <p className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {totalSteps} · {stepName}
          </p>
        </div>
      </div>
      <div className="h-1 bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full bg-nmood-cta"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}