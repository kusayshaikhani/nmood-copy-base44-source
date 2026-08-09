import React from 'react';
import AnalyticsFilterBar from '@/components/admin/analytics/AnalyticsFilterBar';
import AnalyticsExportBar from '@/components/admin/analytics/AnalyticsExportBar';
import PlatformOverview from '@/components/admin/analytics/PlatformOverview';
import MemberInsights from '@/components/admin/analytics/MemberInsights';
import ExperienceInsights from '@/components/admin/analytics/ExperienceInsights';
import OrganizerInsights from '@/components/admin/analytics/OrganizerInsights';
import CommunityHealth from '@/components/admin/analytics/CommunityHealth';
import RelationshipInsights from '@/components/admin/analytics/RelationshipInsights';
import TrendAnalytics from '@/components/admin/analytics/TrendAnalytics';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AdminAnalytics() {
  const { t } = useLocalization();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t('admin.analytics')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.platform_intelligence_and_actionable_insights')}</p>
        </div>
        <AnalyticsExportBar />
      </div>

      <AnalyticsFilterBar />

      <PlatformOverview />
      <MemberInsights />
      <ExperienceInsights />
      <OrganizerInsights />
      <CommunityHealth />
      <RelationshipInsights />
      <TrendAnalytics />
    </div>
  );
}