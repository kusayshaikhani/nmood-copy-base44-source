import React from 'react';
import { ShieldCheck, Activity, AlertTriangle, Gauge, CheckCircle2 } from 'lucide-react';
import { MCSection, MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_COLOR = { verified: 'text-success', enabled: 'text-info', prepared: 'text-warning', planned: 'text-muted-foreground', optimized: 'text-success', on_track: 'text-success' };

/** RRPH-001 Overview — platform health + success criteria. */
export default function PHOverview({ data }) {
  const { t } = useLocalization();
  const d = data || {};
  const s = d.summary || {};
  const kpis = [
    { icon: ShieldCheck, label: 'Security Score', value: (s.securityScore || 0) + '/100', color: s.securityScore >= 90 ? 'success' : 'warning' },
    { icon: Activity, label: 'Platform Health', value: (s.platformHealth || 0) + '/100', color: s.platformHealth >= 95 ? 'success' : 'warning' },
    { icon: AlertTriangle, label: 'Degraded Subsystems', value: `${s.degradedSubsystems || 0}/${s.totalSubsystems || 0}`, color: s.degradedSubsystems ? 'warning' : 'success' },
    { icon: AlertTriangle, label: 'Open Incidents', value: s.openIncidents || 0, color: s.openIncidents ? 'destructive' : 'success' },
    { icon: Gauge, label: 'Active Alert Rules', value: s.activeAlertRules || 0, color: 'info' },
    { icon: Activity, label: 'DR Status', value: s.drStatus || 'pending', color: s.drStatus === 'active' ? 'success' : 'warning' },
    { icon: Gauge, label: 'Benchmarks Passing', value: `${s.benchmarksPass || 0}/${s.benchmarksTotal || 0}`, color: 'info' },
    { icon: CheckCircle2, label: 'Latest Backup', value: s.latestBackup ? s.latestBackup.status : 'none', color: s.latestBackup?.status === 'completed' ? 'success' : 'warning' },
  ];
  return (
    <div className="space-y-4">
      <MCKpiGrid>{kpis.map((k) => <MCKpiCard key={k.label} {...k} />)}</MCKpiGrid>
      <MCSection icon={CheckCircle2} title={t('mission.success_criteria_section_15')}>
        <div className="grid sm:grid-cols-2 gap-2">
          {(d.architecture?.successCriteria || []).map((c) => (
            <div key={c.name} className="rounded-lg border bg-card/60 px-3 py-2 flex items-center justify-between">
              <p className="text-sm font-medium">{c.name}</p>
              <span className={`text-xs font-medium capitalize ${STATUS_COLOR[c.status] || 'text-muted-foreground'}`}>{c.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </MCSection>
    </div>
  );
}