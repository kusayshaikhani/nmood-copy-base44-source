import React, { useMemo } from 'react';
import DiscoverCard from '@/components/discover/DiscoverCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SimilarExperiences({ experience, allExperiences }) {
  const { t } = useLocalization();
  const similar = useMemo(() => {
    return allExperiences
      .filter((e) => e.id !== experience.id)
      .map((e) => ({
        ...e,
        score:
          (e.category === experience.category ? 3 : 0) +
          (e.mood === experience.mood ? 2 : 0) +
          (e.tags || []).filter((t) => (experience.tags || []).includes(t)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [experience, allExperiences]);

  if (similar.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg">{t('experiences.similar.title')}</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {similar.map((exp) => (
          <DiscoverCard key={exp.id} experience={exp} compact />
        ))}
      </div>
    </div>
  );
}