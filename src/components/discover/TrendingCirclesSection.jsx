import React from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '@/components/ui/premium/SectionTitle';
import TrendingCircleCard from '@/components/discover/TrendingCircleCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 3 — "Trending Circles" horizontal rail.
 * Premium snap-scrolling row of compact circle cards with Join action.
 */
export default function TrendingCirclesSection({ circles }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  if (!circles?.length) return null;

  return (
    <div>
      <SectionTitle
        action={
          <button type="button" onClick={() => navigate('/communities')} className="text-sm font-semibold text-primary active:scale-95 transition-transform duration-200">
            {t('common.see_all')}
          </button>
        }
      >
        {t('discovery.section.trending_circles')}
      </SectionTitle>
      <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain -mx-6 px-6 snap-x snap-mandatory">
        {circles.map((c) => <TrendingCircleCard key={c.id} circle={c} />)}
      </div>
    </div>
  );
}