import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ONBOARDING_INTEREST_IDS = new Set(['coffee','travel','fitness','walking','photography','technology','business','movies','gaming','reading','cooking','networking','art','music','nature','wellness']);

/**
 * HM-UX-001 Widget 3 — Magic Card.
 * At most ONE card, shown only when a genuinely valuable opportunity exists.
 * Derives the opportunity deterministically from already-recommended circles
 * that match the member's interests (no AI call, no fabricated data). Hidden
 * otherwise.
 */
export default function MagicCard({ circles = [], interests = [] }) {
  const navigate = useNavigate();
  const { t } = useLocalization();

  const opportunity = useMemo(() => {
    if (!interests.length || !circles.length) return null;
    for (const interest of interests) {
      const key = interest.toLowerCase();
      const matches = circles.filter((c) =>
        (c.shared_interests || []).some((si) => {
          const s = si.toLowerCase();
          return s.includes(key) || key.includes(s);
        })
      );
      if (matches.length >= 2) return { interest, count: matches.length };
    }
    return null;
  }, [circles, interests]);

  if (!opportunity) return null;
  const lc = opportunity.interest.toLowerCase();
  const interestLabel = ONBOARDING_INTEREST_IDS.has(lc)
    ? t('onboarding.interest.' + lc)
    : opportunity.interest.charAt(0).toUpperCase() + opportunity.interest.slice(1);

  return (
    <button
      onClick={() => navigate('/communities')}
      type="button"
      className="w-full flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 text-left hover-lift"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{t('home.magic_card.title', { count: opportunity.count, interest: interestLabel })}</p>
        <p className="text-xs text-muted-foreground">{t('home.magic_card.subtitle')}</p>
      </div>
    </button>
  );
}