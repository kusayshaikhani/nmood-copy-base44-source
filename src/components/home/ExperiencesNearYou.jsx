import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import HomeWidget from './HomeWidget';
import HomeEmptyState from './HomeEmptyState';
import ExperienceCard from './ExperienceCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * HM-UX-001 Widget 6 — Experiences Near You.
 * Location-based rail (experiences whose venue address matches the member's
 * city), distinct from the AI-ranked "Picked for You". Show All preserves the
 * Experiences discovery flow.
 */
export default function ExperiencesNearYou({ experiences, city }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const title = city ? t('home.experiences_near_city', { city }) : t('home.experiences_near_you');

  const list = useMemo(() => {
    if (!experiences) return [];
    if (!city) return experiences.slice(0, 6);
    const key = city.toLowerCase();
    return experiences
      .filter((e) => (e.venue?.address || '').toLowerCase().includes(key))
      .slice(0, 6);
  }, [experiences, city]);

  return (
    <HomeWidget icon={Calendar} title={title} onSeeAll={() => navigate('/explore')}>
      {list.length === 0 ? (
        <HomeEmptyState
          icon={Calendar}
          message={t('home.experiences.empty_nearby')}
          actionLabel={t('home.experiences.explore_all')}
          onAction={() => navigate('/explore')}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {list.map((e) => (
            <ExperienceCard key={e.id} {...e} />
          ))}
        </div>
      )}
    </HomeWidget>
  );
}