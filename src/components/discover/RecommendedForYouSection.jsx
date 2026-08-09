import React from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '@/components/ui/premium/SectionTitle';
import FeaturedExperienceCard from '@/components/discover/FeaturedExperienceCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 2 — "Recommended for You" section.
 * Section title + See All button + single immersive featured card.
 * Replaces the old horizontal-scroll Featured ExperienceSection.
 */
export default function RecommendedForYouSection({ experiences }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  if (!experiences || experiences.length === 0) return null;
  const featured = experiences[0];

  return (
    <div>
      <SectionTitle
        action={
          <button type="button" onClick={() => navigate('/search')} className="text-sm font-semibold text-primary active:scale-95 transition-transform duration-200">
            {t('discovery.featured.see_all')}
          </button>
        }
      >
        {t('discovery.section.recommended_for_you')}
      </SectionTitle>
      <FeaturedExperienceCard experience={featured} />
    </div>
  );
}