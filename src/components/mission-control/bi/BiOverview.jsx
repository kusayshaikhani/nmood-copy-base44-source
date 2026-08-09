import React from 'react';
import {
  Users, UserCheck, Activity, UserPlus, Crown, Compass, Calendar,
  UsersRound, Link2, MessageSquare,
} from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** FM-010 — Executive KPI overview. */
export default function BiOverview({ overview }) {
  const { t } = useLocalization();
  const o = overview || {};
  const cards = [
    { icon: Users, label: 'Total Members', value: o.totalMembers ?? 0, color: 'primary' },
    { icon: UserCheck, label: 'Active Members', value: o.activeMembers ?? 0, color: 'success' },
    { icon: Activity, label: 'Daily Active', value: o.dau ?? 0, color: 'info' },
    { icon: Activity, label: 'Weekly Active', value: o.wau ?? 0, color: 'info' },
    { icon: Activity, label: 'Monthly Active', value: o.mau ?? 0, color: 'info' },
    { icon: UserPlus, label: 'New Today', value: o.newToday ?? 0, color: 'success' },
    { icon: Crown, label: 'Premium', value: o.premium ?? 0, color: 'primary' },
    { icon: Compass, label: 'Explorer', value: o.explorer ?? 0, color: 'warning' },
    { icon: Calendar, label: 'Experiences', value: o.totalExperiences ?? 0, color: 'primary' },
    { icon: UsersRound, label: 'Circles', value: o.totalCircles ?? 0, color: 'primary' },
    { icon: Link2, label: 'Connections', value: o.totalConnections ?? 0, color: 'info' },
    { icon: MessageSquare, label: 'Messages', value: o.totalMessages ?? 0, color: 'info' },
  ];
  return (
    <div className="space-y-4">
      <MCKpiGrid>{cards.map((c) => <MCKpiCard key={c.label} {...c} />)}</MCKpiGrid>
      <MCSection title={t('mission.executive_snapshot')}>
        <p className="text-sm text-muted-foreground">
          {t('mission.live_platform_totals_derived_from')}
        </p>
      </MCSection>
    </div>
  );
}