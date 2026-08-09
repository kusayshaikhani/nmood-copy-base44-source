import React from 'react';
import { TrendingUp, TrendingDown, Repeat, UserMinus } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import { BiAreaChart, BiBarChart, BiLineChart } from './BiChart';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** FM-010 — Growth analytics with date-range comparison. */
export default function BiGrowth({ growth }) {
  const { t } = useLocalization();
  const g = growth || {};
  return (
    <div className="space-y-4">
      <MCKpiGrid>
        <MCKpiCard icon={TrendingUp} label="New This Period" value={g.cur ?? 0} color="success" />
        <MCKpiCard icon={TrendingDown} label="Previous Period" value={g.prev ?? 0} color="info"
          sublabel={`Δ ${g.deltaPct >= 0 ? '+' : ''}${g.deltaPct ?? 0}%`} />
        <MCKpiCard icon={Repeat} label="Retention (D7)" value={g.retentionRate == null ? '—' : g.retentionRate + '%'}
          color="success" sublabel="Approx. from activity" />
        <MCKpiCard icon={UserMinus} label="Churn (30d)" value={g.churnRate == null ? '—' : g.churnRate + '%'}
          color="destructive" sublabel="Approx. inactive" />
      </MCKpiGrid>
      <MCSection icon={TrendingUp} title={t('mission.daily_growth_cumulative')}>
        <BiAreaChart data={g.daily || []} areas={[
          { key: 'cumulativeMembers', name: 'Members', color: 'hsl(var(--chart-1))' },
          { key: 'cumulativeExperiences', name: 'Experiences', color: 'hsl(var(--chart-2))' },
          { key: 'cumulativeCircles', name: 'Circles', color: 'hsl(var(--chart-4))' },
        ]} />
      </MCSection>
      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={TrendingUp} title={t('mission.member_acquisition')}>
          <BiBarChart data={g.acquisition || []} bars={[{ key: 'value', name: 'New Members', color: 'hsl(var(--chart-1))' }]} />
        </MCSection>
        <MCSection icon={TrendingUp} title={t('mission.connection_message_growth')}>
          <BiLineChart data={g.daily || []} lines={[
            { key: 'connections', name: 'Connections', color: 'hsl(var(--chart-2))' },
            { key: 'messages', name: 'Messages', color: 'hsl(var(--chart-3))' },
          ]} />
        </MCSection>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection title={t('admin.weekly_growth')}>
          <BiLineChart data={g.weekly || []} lines={[
            { key: 'members', name: 'Members' },
            { key: 'experiences', name: 'Experiences' },
            { key: 'circles', name: 'Circles' },
          ]} />
        </MCSection>
        <MCSection title={t('admin.monthly_growth')}>
          <BiLineChart data={g.monthly || []} lines={[
            { key: 'members', name: 'Members' },
            { key: 'experiences', name: 'Experiences' },
            { key: 'circles', name: 'Circles' },
          ]} />
        </MCSection>
      </div>
    </div>
  );
}