import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import AsyncButton from '@/components/shared/AsyncButton';
import { ERROR_COPY } from '@/lib/copy';

const KIND_COPY = {
  network: ERROR_COPY.network,
  server: { title: "We're having trouble on our end", description: 'Please try again in a moment.' },
  timeout: { title: 'This is taking longer than usual', description: 'Please try again.' },
  permission: { title: "You don't have access to this", description: 'You may need a different role or plan.' },
  membership: { title: 'This is a Premium moment', description: 'Upgrade to unlock this.' },
  auth: { title: 'Your session expired', description: 'Please sign in again to continue.' },
  rateLimit: { title: 'Slow down a little', description: "You've done a lot — try again in a moment." },
  load: { title: "Couldn't load this", description: "Let's try again." },
  generic: ERROR_COPY.generic,
};

/**
 * UI-026 — Premium error state. A soft gradient orb illustration, friendly
 * human language (never stack traces), and a large Retry action. Replaces
 * every technical error surface across the app.
 */
export default function ErrorState({ kind = 'generic', title, description, onRetry, retryLabel = 'Try again', icon: Icon = AlertCircle, className }) {
  const copy = KIND_COPY[kind] || KIND_COPY.generic;
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className || ''}`} role="alert" aria-live="assertive">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 blur-2xl bg-destructive/20 rounded-full" aria-hidden="true" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-destructive/15 to-warning/15 flex items-center justify-center border border-destructive/10">
          <Icon className="w-9 h-9 text-destructive" strokeWidth={1.5} />
        </div>
      </motion.div>
      <h3 className="text-lg font-semibold mb-1.5 max-w-sm text-balance">{title || copy.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-7 leading-relaxed">{description || copy.description}</p>
      {onRetry && (
        <AsyncButton variant="default" size="lg" onClick={onRetry} busyLabel="Retrying…" className="min-w-[10rem] gap-2">
          <RefreshCw className="w-4 h-4" /> {retryLabel}
        </AsyncButton>
      )}
    </div>
  );
}