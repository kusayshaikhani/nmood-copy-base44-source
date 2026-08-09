import React from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '@/components/ui/premium/SectionTitle';
import CompactExperienceCard from '@/components/discover/CompactExperienceCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 3 — "Experiences Near You" horizontal carousel rail.
 * Premium snap-scrolling row of compact experience cards.
 */
export default function ExperiencesNearYouCarousel({ experiences }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  if (!experiences?.length) return null;

  return (
    <div>
      <SectionTitle
        action={
          <button type="button" onClick={() => navigate('/search')} className="text-sm font-semibold text-primary active:scale-95 transition-transform duration-200">
            {t('common.see_all')}
          </button>
        }
      >
        {t('discovery.section.near_you')}
      </SectionTitle>
      <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain -mx-6 px-6 snap-x snap-mandatory">
        {experiences.map((exp) => <CompactExperienceCard key={exp.id} experience={exp} />)}
      </div>
    </div>
  );
}