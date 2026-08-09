import React from 'react';
import { Crown, Compass, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import { BiPieChart } from './BiChart';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** FM-010 — Membership intelligence (prepared for future revenue). */
export default function BiMembership({ membership }) {
  const { t } = useLocalization();
  const m = membership || {};
  return (
    <div className="space-y-4">
      <MCKpiGrid>
        <MCKpiCard icon={Compass} label="Explorer Members" value={m.explorer ?? 0} color="warning" />
        <MCKpiCard icon={Crown} label="Premium Members" value={m.premium ?? 0} color="primary" />
        <MCKpiCard icon={TrendingUp} label="Conversion Rate" value={(m.conversionRate ?? 0) + '%'} color="success" sublabel="Premium / total" />
        <MCKpiCard icon={RefreshCw} label="Renewal Rate" value={(m.renewalRate ?? 0) + '%'} color="info" />
        <MCKpiCard icon={TrendingUp} label="Upgrades (7d)" value={m.upgradeTrend ?? 0} color="success" sublabel={`Prev: ${m.upgradePrev ?? 0}`} />
        <MCKpiCard icon={TrendingDown} label="Downgrades (7d)" value={m.downgradeTrend ?? 0} color="destructive" />
        <MCKpiCard icon={Crown} label="Trial Conversions" value="Soon" color="info" sublabel="Future integration" />
        <MCKpiCard icon={Crown} label="Revenue" value="Soon" color="info" sublabel="Future integration" />
      </MCKpiGrid>
      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={Crown} title={t('mission.membership_distribution')}>
          <BiPieChart data={m.distribution || []} />
        </MCSection>
        <MCSection title={t('mission.upgrade_downgrade_trends')}>
          <p className="text-sm text-muted-foreground">
            {t('mission.upgrades_this_week')} <span className="text-success font-semibold">{m.upgradeTrend ?? 0}</span> · Previous: {m.upgradePrev ?? 0}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('mission.downgrades_cancellations_this_week')} <span className="text-destructive font-semibold">{m.downgradeTrend ?? 0}</span>
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            {t('mission.revenue_intelligence_subscription_forecasting_and')}
          </p>
        </MCSection>
      </div>
    </div>
  );
}