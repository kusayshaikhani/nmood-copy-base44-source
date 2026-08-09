import React, { useState } from 'react';
import { ShieldCheck, Play } from 'lucide-react';
import { MCSection, MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_BADGE = { pass: 'bg-success/15 text-success', warning: 'bg-warning/15 text-warning', fail: 'bg-destructive/15 text-destructive', pending: 'bg-muted text-muted-foreground' };

/** RRPH-001 Sections 1 & 13 — Security hardening controls + automated security validation. */
export default function PHSecurity({ data, onRan }) {
  const { t } = useLocalization();
  const d = data || {};
  const assessments = d.assessments || [];
  const controls = d.architecture?.securityControls || [];
  const [running, setRunning] = useState(false);
  const score = d.securityScore || 0;

  const runValidation = async () => {
    setRunning(true);
    try { await base44.functions.invoke('productionHardening', { mode: 'runSecurityValidation' }); onRan?.(); } catch (_e) {}
    setRunning(false);
  };

  return (
    <div className="space-y-4">
      <MCKpiGrid>
        <MCKpiCard icon={ShieldCheck} label="Security Score" value={score + '/100'} color={score >= 90 ? 'success' : 'warning'} />
        <MCKpiCard icon={ShieldCheck} label="Assessments" value={assessments.length} color="info" />
        <MCKpiCard icon={ShieldCheck} label="Critical Findings" value={assessments.reduce((a, x) => a + (x.critical_count || 0), 0)} color="success" />
        <MCKpiCard icon={ShieldCheck} label="Warnings" value={assessments.reduce((a, x) => a + (x.warning_count || 0), 0)} color="warning" />
      </MCKpiGrid>

      <MCSection icon={ShieldCheck} title={t('mission.security_hardening_controls_section_1')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {controls.map((c) => (
            <div key={c.name} className="rounded-lg border bg-card/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{c.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{c.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{c.detail}</p>
            </div>
          ))}
        </div>
      </MCSection>

      <MCSection icon={Play} title={t('mission.automated_security_validation_section_13')}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{t('mission.owasp_dependency_vulnerabilities_security_score')}</p>
          <Button size="sm" variant="outline" onClick={runValidation} disabled={running} className="h-8 gap-1.5"><Play className="w-3.5 h-3.5" /> {running ? 'Running…' : 'Run Validation'}</Button>
        </div>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40"><tr className="text-left">
              <th className="px-3 py-2 font-medium">{t('mission.assessment')}</th><th className="px-3 py-2 font-medium">{t('mission.score')}</th>
              <th className="px-3 py-2 font-medium">{t('admin.status')}</th><th className="px-3 py-2 font-medium">{t('mission.findings')}</th><th className="px-3 py-2 font-medium">{t('mission.recommendations')}</th>
            </tr></thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{a.category}</td>
                  <td className="px-3 py-2">{a.score}/100</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${STATUS_BADGE[a.status]}`}>{a.status}</span></td>
                  <td className="px-3 py-2 text-muted-foreground">{a.findings}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.recommendations}</td>
                </tr>
              ))}
              {!assessments.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">{t('mission.no_assessments_yet_click_seed')}</td></tr>}
            </tbody>
          </table>
        </div>
      </MCSection>
    </div>
  );
}