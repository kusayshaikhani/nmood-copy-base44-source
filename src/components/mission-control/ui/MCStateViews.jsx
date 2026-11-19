import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * FM-004 — Skeleton loading state. Avoids blank screens with graceful shimmer.
 */
export function MCLoadingState({ rows = 6, cols = 5, className = '' }) {
  return (
    <div className={'rounded-xl border bg-card overflow-hidden ' + className}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 shimmer rounded" style={{ width: 70 + ((i + j) % 4) * 35 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * FM-004 — Friendly enterprise error state. Never exposes stack traces.
 */
export function MCErrorState({ title = 'Something went wrong', description = 'An unexpected error occurred while loading this module.', onRetry, errorId }) {
  const { t } = useLocalization();
  return (
    <div className="text-center py-10">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/15 text-destructive mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
      {errorId && <p className="text-[10px] text-muted-foreground/60 mt-2">Reference: {errorId}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-4 gap-2" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" /> {t('mission.retry')}
        </Button>
      )}
    </div>
  );
}

/**
 * Blocking banner shown when Mission Control could not confirm any figure with
 * Supabase. It deliberately replaces the KPIs instead of letting zeros stand in
 * for unknown data.
 */
export function MCConnectionErrorBanner({ error, onRetry }) {
  if (!error) return null;
  const forbidden = error.kind === 'forbidden';
  const Icon = forbidden ? Lock : WifiOff;
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-destructive/15 text-destructive shrink-0">
          <Icon className="w-4.5 h-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-destructive">
            {forbidden ? 'Access denied' : 'Data connection failed'}
          </h3>
          <p className="text-sm text-destructive/90 mt-1">
            {error.message || 'Mission Control could not reach the Nmood database.'}
          </p>
          {!forbidden && (
            <p className="text-xs text-destructive/80 mt-1">
              Figures are hidden rather than shown as zero, because none could be confirmed.
            </p>
          )}
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onRetry}>
              <RefreshCw className="w-4 h-4" /> Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}