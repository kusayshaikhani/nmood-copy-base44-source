import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import HomeWidget from './HomeWidget';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ONBOARDING_INTEREST_IDS = new Set(['coffee','travel','fitness','walking','photography','technology','business','movies','gaming','reading','cooking','networking','art','music','nature','wellness']);
const CATEGORY_IDS = new Set(['sports', 'food', 'outdoor']);
const POPULAR_CATEGORIES = ['coffee', 'sports', 'photography', 'music', 'food', 'outdoor', 'art', 'wellness'];

/**
 * HM-UX-001 Widget 11 — Continue Exploring.
 * Lightweight surfacing of the member's own interests alongside popular
 * categories. Each chip opens discovery. Maintains existing recommendation
 * logic (no new engine calls).
 */
export default function ContinueExploring({ interests = [] }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const chips = Array.from(new Set([...interests, ...POPULAR_CATEGORIES])).slice(0, 10);

  const chipLabel = (c) => {
    const lc = String(c).toLowerCase();
    if (ONBOARDING_INTEREST_IDS.has(lc)) return t('onboarding.interest.' + lc);
    if (CATEGORY_IDS.has(lc)) return t('home.category.' + lc);
    return String(c).charAt(0).toUpperCase() + String(c).slice(1);
  };

  return (
    <HomeWidget
      icon={Compass}
      title={t('home.continue_exploring')}
      subtitle={t('home.continue_exploring_subtitle')}
      onSeeAll={() => navigate('/explore')}
    >
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => navigate('/explore')}
            type="button"
            className="px-3.5 py-2 rounded-full border border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-default"
          >
            {chipLabel(c)}
          </button>
        ))}
      </div>
    </HomeWidget>
  );
}