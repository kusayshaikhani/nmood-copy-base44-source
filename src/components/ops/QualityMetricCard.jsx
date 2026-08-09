import React from 'react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function QualityMetricCard({ icon: Icon, label, value, target, status }) {
  const { t } = useLocalization();
  const statusColor = status === 'healthy' ? 'text-success' : 'text-warning';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className={'text-xs font-medium flex items-center gap-1 ' + statusColor}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {status}
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">{t('mission.target_2')} <span className="font-medium text-foreground">{target}</span></p>
      </div>
    </Card>
  );
}