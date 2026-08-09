import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Motivating empty state. Encourages the next real-life action instead
// of leaving a blank screen. Supports an optional secondary CTA.
export default function MotivatingEmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {Icon && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"
        >
          <Icon className="w-9 h-9 text-primary" strokeWidth={1.5} />
        </motion.div>
      )}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="text-lg font-semibold mb-2 max-w-sm text-balance"
      >
        {title}
      </motion.h3>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="text-sm text-muted-foreground max-w-sm mb-6"
        >
          {subtitle}
        </motion.p>
      )}
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <Button onClick={onAction} size="lg">{actionLabel}</Button>
          {secondaryLabel && onSecondary && (
            <Button variant="ghost" onClick={onSecondary}>{secondaryLabel}</Button>
          )}
        </motion.div>
      )}
    </div>
  );
}