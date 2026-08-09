import React from 'react';
import KpiGrid from './KpiGrid';
import { relationshipInsightKpis } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function RelationshipInsights() {
  const { t } = useLocalization();
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{t('admin.relationship_insights')}</h2>
      <KpiGrid kpis={relationshipInsightKpis} className="grid-cols-2 md:grid-cols-4" />
    </div>
  );
}