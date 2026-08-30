import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

/**
 * UI-026 — Premium empty state. A soft gradient orb illustration with the
 * icon, a friendly headline, a helpful explanation, and a primary action
 * (plus optional secondary). Animates in with a gentle spring and fades
 * content into place. Replaces every visually-empty screen app-wide.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  illustration,
  compact = false,
  children,
  contentClassName = '',
  titleClassName = '',
  descriptionClassName = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-16'} px-4 ${contentClassName}`}>
      {illustration ? (
        illustration
      ) : Icon ? (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 blur-2xl bg-primary/25 rounded-full nmood-empty-glow" aria-hidden="true" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-accent/20 flex items-center justify-center border border-primary/15 shadow-md shadow-primary/10">
            <Icon className="w-9 h-9 text-primary" strokeWidth={1.5} />
          </div>
        </motion.div>
      ) : null}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className={`text-lg font-semibold mb-1.5 max-w-sm text-balance ${titleClassName}`}
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className={`text-sm max-w-sm mb-6 leading-relaxed ${descriptionClassName || 'text-muted-foreground'}`}
        >
          {description}
        </motion.p>
      )}
      {(actionLabel || secondaryLabel) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          {actionLabel && onAction && <Button onClick={onAction} size="lg" className="gap-2 min-w-[10rem] bg-nmood-cta border-transparent hover:brightness-105 shadow-md shadow-primary/25">{actionLabel}</Button>}
          {secondaryLabel && onSecondary && <Button variant="ghost" onClick={onSecondary} className="min-w-[10rem]">{secondaryLabel}</Button>}
        </motion.div>
      )}
      {children}
    </div>
  );
}