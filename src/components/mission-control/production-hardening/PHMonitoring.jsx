import React, { useState } from 'react';
import { Activity, FileText, Play } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const HEALTH_BADGE = { operational: 'bg-success/15 text-success', degraded: 'bg-warning/15 text-warning', partial_outage: 'bg-warning/15 text-warning', major_outage: 'bg-destructive/15 text-destructive', maintenance: 'bg-info/15 text-info' };

/** RRPH-001 Sections 6 & 7 — Centralized monitoring + logging. */
export default function PHMonitoring({ data, onRan }) {
  const { t } = useLocalization();
  const d = data || {};
  const subsystems = d.subsystems || [];
  const targets = d.architecture?.monitoringTargets || [];
  const logs = d.architecture?.loggingSources || [];
  const [checking, setChecking] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    try { await base44.functions.invoke('productionHardening', { mode: 'runHealthCheck' }); onRan?.(); } catch (_e) {}
    setChecking(false);
  };

  return (
    <div className="space-y-4">
      <MCSection icon={Activity} title={t('mission.centralized_monitoring_section_6')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-1.5">
            {targets.map((t) => <span key={t} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">{t}</span>)}
          </div>
          <Button size="sm" variant="outline" onClick={runChecks} disabled={checking} className="h-8 gap-1.5"><Play className="w-3.5 h-3.5" /> {checking ? 'Checking…' : 'Run Health Check'}</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {subsystems.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium capitalize">{s.subsystem}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${HEALTH_BADGE[s.status]}`}>{s.status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                <span>score: {s.health_score}</span><span>avail: {s.availability}%</span><span>{s.latency_ms}ms</span>
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-1">last check: {s.last_check ? new Date(s.last_check).toLocaleTimeString() : '—'}</p>
            </div>
          ))}
          {!subsystems.length && <p className="text-xs text-muted-foreground">{t('mission.no_subsystems_registered_yet_click')}</p>}
        </div>
      </MCSection>

      <MCSection icon={FileText} title={t('mission.centralized_logging_section_7')}>
        <p className="text-xs text-muted-foreground mb-3">{t('mission.application_security_ai_audit_background')}</p>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40"><tr className="text-left">
              <th className="px-3 py-2 font-medium">{t('mission.source')}</th><th className="px-3 py-2 font-medium">{t('admin.status')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.retention')}</th><th className="px-3 py-2 font-medium">{t('mission.detail')}</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.name} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium capitalize">{l.name}</td>
                  <td className="px-3 py-2 capitalize"><span className={`px-1.5 py-0.5 rounded-full ${l.status === 'enabled' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{l.status}</span></td>
                  <td className="px-3 py-2">{l.retention}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MCSection>
    </div>
  );
}