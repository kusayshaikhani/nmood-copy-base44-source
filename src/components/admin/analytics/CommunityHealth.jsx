import React from 'react';
import KpiGrid from './KpiGrid';
import { communityHealthKpis } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CommunityHealth() {
  const { t } = useLocalization();
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{t('admin.community_health')}</h2>
      <KpiGrid kpis={communityHealthKpis} className="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />
    </div>
  );
}