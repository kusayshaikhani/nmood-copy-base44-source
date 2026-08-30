import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import ExperienceCard from '@/components/home/ExperienceCard';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useOriginState } from '@/lib/safe-navigation';

export default function ExperienceSection({ title, experiences, onSeeAll, emptyMessage }) {
  const navigate = useNavigate();
  const originState = useOriginState();
  const { t } = useLocalization();

  if (!experiences || experiences.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <div className="flex flex-col items-center justify-center py-10 px-4 rounded-2xl border border-dashed border-border bg-muted/20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Compass className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{emptyMessage || t('home.experiences.empty_default')}</p>
          <button
            onClick={() => navigate('/host/create', { state: originState() })}
            className="text-sm text-primary font-medium hover:underline"
            type="button"
          >
            {t('home.experiences.host_one')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-sm text-primary font-medium hover:underline" type="button">
            {t('common.see_all')}
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {experiences.map((exp) => (
          <ExperienceCard key={exp.id} {...exp} />
        ))}
      </div>
    </div>
  );
}