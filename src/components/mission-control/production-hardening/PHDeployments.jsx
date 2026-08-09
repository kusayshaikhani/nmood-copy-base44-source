import React, { useState } from 'react';
import { Rocket, Activity, RotateCcw, Play } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const DEPLOY_BADGE = { success: 'bg-success/15 text-success', failed: 'bg-destructive/15 text-destructive', rolled_back: 'bg-warning/15 text-warning', in_progress: 'bg-info/15 text-info', planned: 'bg-muted text-muted-foreground' };
const HEALTH_BADGE = { healthy: 'bg-success/15 text-success', degraded: 'bg-warning/15 text-warning', unstable: 'bg-destructive/15 text-destructive', operational: 'bg-success/15 text-success', partial_outage: 'bg-warning/15 text-warning', major_outage: 'bg-destructive/15 text-destructive', maintenance: 'bg-info/15 text-info' };

/** RRPH-001 Sections 9 & 10 — Deployment management + centralized platform health. */
export default function PHDeployments({ data, onRan }) {
  const { t } = useLocalization();
  const d = data || {};
  const deployments = d.deployments || [];
  const subsystems = d.subsystems || [];
  const stages = d.architecture?.deploymentStages || [];
  const [rolling, setRolling] = useState(null);

  const rollback = async (id) => {
    setRolling(id);
    try { await base44.functions.invoke('productionHardening', { mode: 'rollbackDeployment', deployment_id: id }); onRan?.(); } catch (_e) {}
    setRolling(null);
  };

  return (
    <div className="space-y-4">
      <MCSection icon={Rocket} title={t('mission.deployment_management_section_9')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          {stages.map((s) => (
            <div key={s.name} className="rounded-lg border bg-card/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{s.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{s.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{s.detail}</p>
            </div>
          ))}
        </div>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40"><tr className="text-left">
              <th className="px-3 py-2 font-medium">{t('mission.version')}</th><th className="px-3 py-2 font-medium">{t('mission.environment')}</th>
              <th className="px-3 py-2 font-medium">{t('admin.status')}</th><th className="px-3 py-2 font-medium">{t('mission.health')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.rollback_to')}</th><th className="px-3 py-2 font-medium">{t('mission.commit')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.notes')}</th><th className="px-3 py-2 font-medium">{t('mission.action')}</th>
            </tr></thead>
            <tbody>
              {deployments.map((dep) => (
                <tr key={dep.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{dep.version}</td>
                  <td className="px-3 py-2">{dep.environment}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${DEPLOY_BADGE[dep.status]}`}>{dep.status.replace('_', ' ')}</span></td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${HEALTH_BADGE[dep.health]}`}>{dep.health}</span></td>
                  <td className="px-3 py-2">{dep.rollback_version || '—'}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{dep.commit_sha ? dep.commit_sha.slice(0, 7) : '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{dep.release_notes}</td>
                  <td className="px-3 py-2">
                    {dep.status === 'success' && dep.environment === 'production' && (
                      <Button size="sm" variant="outline" onClick={() => rollback(dep.id)} disabled={rolling === dep.id} className="h-7 gap-1"><RotateCcw className="w-3.5 h-3.5" /> {t('mission.rollback')}</Button>
                    )}
                  </td>
                </tr>
              ))}
              {!deployments.length && <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">{t('mission.no_deployments_yet_click_seed')}</td></tr>}
            </tbody>
          </table>
        </div>
      </MCSection>

      <MCSection icon={Activity} title={t('mission.platform_health_model_section_10')}>
        <p className="text-xs text-muted-foreground mb-3">{t('mission.every_subsystem_exposes_status_health')}</p>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40"><tr className="text-left">
              <th className="px-3 py-2 font-medium">{t('mission.subsystem')}</th><th className="px-3 py-2 font-medium">{t('admin.status')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.score')}</th><th className="px-3 py-2 font-medium">{t('admin.availability')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.latency')}</th><th className="px-3 py-2 font-medium">{t('mission.warnings')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.critical')}</th><th className="px-3 py-2 font-medium">{t('mission.last_check')}</th>
            </tr></thead>
            <tbody>
              {subsystems.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium capitalize">{s.subsystem}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${HEALTH_BADGE[s.status]}`}>{s.status.replace('_', ' ')}</span></td>
                  <td className="px-3 py-2">{s.health_score}/100</td>
                  <td className="px-3 py-2">{s.availability}%</td>
                  <td className="px-3 py-2">{s.latency_ms}ms</td>
                  <td className="px-3 py-2">{s.warnings}</td>
                  <td className="px-3 py-2">{s.critical_alerts}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.last_check ? new Date(s.last_check).toLocaleTimeString() : '—'}</td>
                </tr>
              ))}
              {!subsystems.length && <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">{t('mission.no_subsystems_registered_yet')}</td></tr>}
            </tbody>
          </table>
        </div>
      </MCSection>
    </div>
  );
}