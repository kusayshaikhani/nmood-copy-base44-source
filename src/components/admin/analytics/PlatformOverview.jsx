import React from 'react';
import KpiGrid from './KpiGrid';
import { platformOverviewKpis } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PlatformOverview() {
  const { t } = useLocalization();
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{t('admin.platform_overview')}</h2>
      <KpiGrid kpis={platformOverviewKpis} className="grid-cols-2 md:grid-cols-3 lg:grid-cols-5" />
    </div>
  );
}