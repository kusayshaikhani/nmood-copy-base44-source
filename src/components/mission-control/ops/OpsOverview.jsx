import React from 'react';
import { ShieldCheck, Clock, Tag, Server, Cloud, Database, ListChecks, AlertTriangle, ScrollText, Flag, Activity, Cpu } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import { APP_VERSION, ENVIRONMENT } from '@/lib/system-config';
import OpsStatusBadge from './OpsStatusBadge';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsOverview({ overview }) {
  const { t } = useLocalization();
  const o = overview || {};
  const cards = [
    { icon: ShieldCheck, label: 'Platform Status', value: o.platformStatus || 'operational', color: o.platformStatus === 'degraded' ? 'warning' : 'success' },
    { icon: Clock, label: 'System Uptime', value: o.systemUptime || '—', color: 'info' },
    { icon: Tag, label: 'Current Version', value: APP_VERSION, color: 'primary' },
    { icon: Server, label: 'Environment', value: ENVIRONMENT, color: 'info' },
    { icon: Cloud, label: 'API Availability', value: o.apiAvailability || '—', color: 'success' },
    { icon: Database, label: 'Database Status', value: o.databaseStatus || 'healthy', color: 'success' },
    { icon: Activity, label: 'Queue Status', value: o.queueStatus || 'idle', color: o.queueStatus === 'congested' ? 'warning' : 'info' },
    { icon: Cpu, label: 'Active Sessions', value: o.activeSessions == null ? 'Soon' : o.activeSessions, color: 'info', sublabel: o.activeSessions == null ? 'Telemetry coming' : '' },
    { icon: ListChecks, label: 'Failed Jobs', value: o.failedJobs ?? 0, color: o.failedJobs ? 'destructive' : 'success' },
    { icon: AlertTriangle, label: 'Security Alerts', value: o.securityAlerts ?? 0, color: o.securityAlerts ? 'warning' : 'success' },
    { icon: ScrollText, label: 'Audit Events Today', value: o.auditEventsToday ?? 0, color: 'info' },
    { icon: Flag, label: 'Feature Flags', value: `${o.enabledFlags ?? 0}/${o.totalFlags ?? 0}`, color: 'primary', sublabel: 'enabled' },
  ];
  return (
    <div className="space-y-4">
      <MCKpiGrid>{cards.map((c) => <MCKpiCard key={c.label} {...c} />)}</MCKpiGrid>
      <MCSection icon={ShieldCheck} title={t('admin.platform_status')}>
        <div className="flex items-center gap-3">
          <OpsStatusBadge status={o.platformStatus === 'degraded' ? 'warning' : 'healthy'} />
          <p className="text-sm text-muted-foreground">
            {o.platformStatus === 'degraded'
              ? 'Some services are reporting warnings or active alerts. Review System Health and Security for details.'
              : 'All core services are operating normally. No critical alerts.'}
          </p>
        </div>
      </MCSection>
    </div>
  );
}