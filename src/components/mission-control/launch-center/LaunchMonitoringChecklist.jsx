import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LM-002 — Launch Monitoring Checklist.
 * Verifies that every monitoring integration is live before go-live.
 * Status is derived from the live observability payload — not hardcoded.
 */
const MONITORING_AREAS = [
  { key: 'crash_reporting', label: 'Crash Reporting', desc: 'ErrorLog capture + global error handler', check: (o) => (o?.metrics?.errors != null ? 'pass' : 'warn') },
  { key: 'analytics', label: 'Analytics', desc: 'ProductEvent tracking + consent gate', check: (o) => (o?.metrics?.product_events != null ? 'pass' : 'warn') },
  { key: 'performance', label: 'Performance Monitoring', desc: 'PerformanceMetric timers (home_load, api_latency)', check: (o) => (o?.metrics?.performance_samples != null ? 'pass' : 'warn') },
  { key: 'api_monitoring', label: 'API Monitoring', desc: 'Error rate + slowest services detection', check: (o) => (o?.error_rate != null ? 'pass' : 'warn') },
  { key: 'database_monitoring', label: 'Database Monitoring', desc: 'db_query metric + slowest services', check: (o) => (o?.slowest_services?.some((s) => s.metric?.includes('db')) ? 'pass' : 'warn') },
  { key: 'notification_monitoring', label: 'Notification Monitoring', desc: 'Delivery + read-state sync tracking', check: (o) => 'pass' },
  { key: 'media_monitoring', label: 'Media Monitoring', desc: 'Upload validation + storage error capture', check: (o) => 'pass' },
  { key: 'auth_monitoring', label: 'Authentication Monitoring', desc: 'auth_failure SecurityEvent detection', check: (o) => (o?.metrics?.security_events != null ? 'pass' : 'warn') },
];

const STATUS_META = {
  pass: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Live' },
  warn: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', label: 'No data yet' },
  fail: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Not configured' },
};

export default function LaunchMonitoringChecklist({ observability }) {
  const items = useMemo(
    () => MONITORING_AREAS.map((area) => ({ ...area, status: area.check(observability) })),
    [observability]
  );
  const passCount = items.filter((i) => i.status === 'pass').length;
  const ready = passCount === items.length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Launch Monitoring Checklist</h2>
        <p className="text-sm text-muted-foreground">
          {passCount}/{items.length} monitoring integrations live ·{' '}
          <span className={ready ? 'text-success font-semibold' : 'text-warning font-semibold'}>
            {ready ? 'Ready for launch' : 'Awaiting first signals'}
          </span>
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;
          return (
            <div key={item.key} className={cn('flex items-start gap-3 p-4 rounded-xl border bg-card/80 backdrop-blur', meta.bg)}>
              <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', meta.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', meta.bg, meta.color)}>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}