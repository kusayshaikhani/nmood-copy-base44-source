import React from 'react';
import DiscoverCard from './DiscoverCard';
import SectionTitle from '@/components/ui/premium/SectionTitle';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 — Premium horizontal experience rail with snap scrolling.
 */
export default function ExperienceSection({ title, experiences }) {
  const { t } = useLocalization();
  if (!experiences?.length) return null;
  return (
    <div>
      <SectionTitle
        action={
          <button type="button" className="text-sm font-medium text-primary">{t('common.see_all')}</button>
        }
      >
        {title}
      </SectionTitle>
      <div className="flex gap-4 overflow-x-auto no-scrollbar overscroll-x-contain -mx-6 px-6 snap-x snap-mandatory">
        {experiences.map((exp) => <DiscoverCard key={exp.id} experience={exp} compact />)}
      </div>
    </div>
  );
}