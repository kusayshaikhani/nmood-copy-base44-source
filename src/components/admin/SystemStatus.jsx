import React from 'react';
import { Card } from '@/components/ui/card';
import { Server, Database, HardDrive, Activity } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusColors = {
  healthy: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-destructive',
  offline: 'bg-muted-foreground',
};

const iconMap = {
  'API Service': Server,
  Database: Database,
  Storage: HardDrive,
  'Background Jobs': Activity,
};

export default function SystemStatus({ items }) {
  const { t } = useLocalization();
  const list = (items || []).map((item) => ({
    ...item,
    icon: item.icon || iconMap[item.name] || Server,
  }));
  const allHealthy = list.length > 0 && list.every((i) => i.status === 'healthy');

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{t('admin.system_status')}</h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={'w-2 h-2 rounded-full ' + (allHealthy ? 'bg-success' : 'bg-warning')} />
          {allHealthy ? 'All systems operational' : 'Degraded performance'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {list.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className={'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card ' + (statusColors[item.status] || statusColors.offline)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.latency}</p>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted-foreground col-span-full py-2">{t('admin.loading_system_health')}</p>}
      </div>
    </Card>
  );
}