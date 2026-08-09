import React, { useMemo } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * HM-UX-001 Widget 1 — Context Greeting.
 * Time-aware greeting enriched with a single, honest "what's happening near
 * you" line derived from already-loaded recommendations. No AI call, no
 * fabricated facts. If nothing meaningful exists, only the greeting shows.
 *
 * MP-002 — all copy is localized via the centralized service, including the
 * plural-aware enrichment sentence (no manual plural building).
 */
function greetingKeyFor(hour) {
  if (hour < 12) return 'home.greeting_morning';
  if (hour < 18) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

const GREETING_EMOJI = {
  'home.greeting_morning': '☀️',
  'home.greeting_afternoon': '🌤️',
  'home.greeting_evening': '🌙',
};

export default function ContextGreeting({ firstName, city, experiencesCount = 0, circlesCount = 0 }) {
  const { t } = useLocalization();
  const key = useMemo(() => greetingKeyFor(new Date().getHours()), []);
  const place = city || t('home.you');

  let enrichment = null;
  if (experiencesCount > 0 && circlesCount > 0) {
    enrichment = t('home.enrichment_both', {
      total: experiencesCount + circlesCount,
      expCount: experiencesCount,
      circCount: circlesCount,
      place,
    });
  } else if (experiencesCount > 0) {
    enrichment = t('home.enrichment_experiences_only', { count: experiencesCount, place });
  } else {
    // Always show circles enrichment — =0 branch renders "no Circles" when empty.
    enrichment = t('home.enrichment_circles_only', { count: circlesCount, place });
  }

  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{GREETING_EMOJI[key]} {t(key)},</p>
      <h1 className="text-xl font-bold tracking-tight mt-1">{firstName}</h1>
      {enrichment && <p className="text-[13px] text-muted-foreground mt-1">{enrichment}</p>}
    </div>
  );
}