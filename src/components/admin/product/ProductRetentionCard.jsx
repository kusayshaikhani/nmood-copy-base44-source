import React from 'react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Metric({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-xl font-bold tracking-tight">{value}</span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

export default function ProductRetentionCard({ retention }) {
  const { t } = useLocalization();
  if (!retention) return null;
  const fmt = (v) => (v === null || v === undefined ? '—' : `${v}%`);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">{t('admin.retention_active_users')}</h3>
      <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border">
        <Metric label="DAU" value={retention.dau ?? '—'} />
        <Metric label="WAU" value={retention.wau ?? '—'} />
        <Metric label="MAU" value={retention.mau ?? '—'} />
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4">
        <Metric label="1-Day Retention" value={fmt(retention.retention1d)} sub="D1 cohort" />
        <Metric label="7-Day Retention" value={fmt(retention.retention7d)} sub="D7 cohort" />
        <Metric label="30-Day Retention" value={fmt(retention.retention30d)} sub="D30 cohort" />
      </div>
      <p className="text-[11px] text-muted-foreground mt-4">
        {t('admin.cohort_retention_of_users_who')}
      </p>
    </Card>
  );
}