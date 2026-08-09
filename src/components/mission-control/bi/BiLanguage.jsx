import React from 'react';
import { Languages, Type, BookOpen } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import { BiPieChart } from './BiChart';
import BiTable from './BiTable';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** FM-010 — Language intelligence (prepared for translation management). */
export default function BiLanguage({ language }) {
  const { t } = useLocalization();
  const l = language || {};
  return (
    <div className="space-y-4">
      <MCKpiGrid>
        <MCKpiCard icon={Languages} label="Supported Languages" value={l.totalLanguages ?? 0} color="primary" />
        <MCKpiCard icon={Type} label="Translation Coverage" value="Soon" color="warning" sublabel="Translation management planned" />
        <MCKpiCard icon={BookOpen} label="Localization Status" value="Soon" color="warning" sublabel="Coming soon" />
      </MCKpiGrid>
      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={Languages} title={t('mission.preferred_languages')}>
          <BiTable columns={[{ key: 'name', label: 'Language' }, { key: 'count', label: 'Members' }]} rows={l.preferred || []} />
        </MCSection>
        <MCSection icon={Languages} title={t('mission.language_distribution')}>
          <BiPieChart data={l.distribution || []} />
        </MCSection>
        <MCSection title={t('mission.language_growth_7d')}>
          <BiTable columns={[{ key: 'name', label: 'Language' }, { key: 'count', label: 'New Members' }]} rows={l.growth || []} />
        </MCSection>
      </div>
    </div>
  );
}