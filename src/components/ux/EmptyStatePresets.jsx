import React from 'react';
import { Compass, UsersRound, MessageCircle, Bell, Search, Calendar, Sparkles } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-026 — Ready-made empty-state presets with the premium illustration,
 * friendly copy, and a primary action. Each accepts the action handlers
 * from its host page so the wording stays consistent app-wide.
 */

export function NoExperiences({ onAction }) {
  const { t } = useLocalization();
  return (
    <EmptyState
      icon={Compass}
      title={t('ux.empty_experiences_title')}
      description={t('ux.empty_experiments_desc')}
      actionLabel={t('ux.empty_explore_action')}
      onAction={onAction}
    />
  );
}

export function NoCircles({ onAction }) {
  const { t } = useLocalization();
  return (
    <EmptyState
      icon={UsersRound}
      title={t('ux.empty_circles_title')}
      description={t('ux.empty_circles_desc')}
      actionLabel={t('ux.empty_discover_circles')}
      onAction={onAction}
    />
  );
}

export function NoMessages({ onAction }) {
  const { t } = useLocalization();
  return (
    <EmptyState
      icon={MessageCircle}
      title={t('ux.empty_messages_title')}
      description={t('ux.empty_messages_desc')}
      actionLabel={t('ux.empty_start_conversation')}
      onAction={onAction}
    />
  );
}

export function NoNotifications() {
  const { t } = useLocalization();
  return (
    <EmptyState
      icon={Bell}
      title={t('ux.empty_notifications_title')}
      description={t('ux.empty_notifications_desc')}
    />
  );
}

export function NoSearchResults({ onAction, suggestions, onSuggestion }) {
  const { t } = useLocalization();
  return (
    <EmptyState
      icon={Search}
      title={t('ux.empty_search_title')}
      description={t('ux.empty_search_desc')}
      actionLabel={onAction ? t('ux.empty_explore_action') : undefined}
      onAction={onAction}
      illustration={
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full" aria-hidden="true" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-accent/20 flex items-center justify-center border border-primary/10">
              <Search className="w-9 h-9 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      }
    >
      {suggestions && suggestions.length > 0 && (
        <div className="mt-6 w-full max-w-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 text-center">
            {t('ux.empty_search_suggestions')}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion && onSuggestion(s)}
                className="px-3.5 py-1.5 rounded-button bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/70 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </EmptyState>
  );
}

export function NoCalendar({ onAction }) {
  const { t } = useLocalization();
  return (
    <EmptyState
      icon={Calendar}
      title={t('ux.empty_generic_title')}
      description={t('ux.empty_generic_desc')}
      actionLabel={onAction ? t('ux.empty_explore_action') : undefined}
      onAction={onAction}
    />
  );
}

export function GenericEmpty({ onAction, actionLabel }) {
  const { t } = useLocalization();
  return (
    <EmptyState
      icon={Sparkles}
      title={t('ux.empty_generic_title')}
      description={t('ux.empty_generic_desc')}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}