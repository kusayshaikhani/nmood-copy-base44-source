import React from 'react';
import { LifeBuoy, Phone, BookOpen, Clock, Database } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const TEST_BADGE = { pass: 'bg-success/15 text-success', fail: 'bg-destructive/15 text-destructive', pending: 'bg-warning/15 text-warning' };

/** RRPH-001 Section 12 — Disaster recovery & business continuity. */
export default function PHContinuity({ data }) {
  const { t } = useLocalization();
  const d = data || {};
  const dr = d.drPlan || null;
  return (
    <div className="space-y-4">
      {!dr ? (
        <MCSection icon={LifeBuoy} title={t('mission.business_continuity_section_12')}>
          <p className="text-xs text-muted-foreground">{t('mission.no_disaster_recovery_plan_registered')}</p>
        </MCSection>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <MCSection icon={Clock} title={t('mission.recovery_time_objective')}>
              <p className="text-2xl font-bold text-primary">{dr.rto_target}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('mission.maximum_acceptable_downtime')}</p>
            </MCSection>
            <MCSection icon={Database} title={t('mission.recovery_point_objective')}>
              <p className="text-2xl font-bold text-primary">{dr.rpo_target}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('mission.maximum_acceptable_data_loss')}</p>
            </MCSection>
            <MCSection icon={LifeBuoy} title={t('mission.plan_status')}>
              <p className="text-lg font-bold capitalize">{dr.status}</p>
              <p className="text-xs text-muted-foreground mt-1">Last tested: {dr.last_tested ? new Date(dr.last_tested).toLocaleDateString() : '—'}</p>
              <span className={`inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded-full ${TEST_BADGE[dr.test_result]}`}>{dr.test_result}</span>
            </MCSection>
          </div>

          <MCSection icon={Phone} title={t('mission.emergency_contacts')}>
            <div className="space-y-2">
              {(dr.emergency_contacts || []).map((c, i) => (
                <div key={i} className="rounded-lg border bg-card/60 px-3 py-2 flex items-center justify-between">
                  <p className="text-sm font-medium">{c.name}</p>
                  <span className="text-xs text-muted-foreground">{c.role} · {c.contact}</span>
                </div>
              ))}
              {!(dr.emergency_contacts || []).length && <p className="text-xs text-muted-foreground">{t('mission.no_emergency_contacts_configured')}</p>}
            </div>
          </MCSection>

          <MCSection icon={BookOpen} title={t('mission.operational_runbooks')}>
            <div className="space-y-2">
              {(dr.runbooks || []).map((r, i) => (
                <div key={i} className="rounded-lg border bg-card/60 p-3">
                  <p className="text-sm font-medium">{r.name}</p>
                  <ol className="text-xs text-muted-foreground mt-1 list-decimal list-inside">
                    {(r.steps || []).map((st, j) => <li key={j}>{st}</li>)}
                  </ol>
                </div>
              ))}
              {!(dr.runbooks || []).length && <p className="text-xs text-muted-foreground">{t('mission.no_runbooks_configured')}</p>}
            </div>
          </MCSection>

          <MCSection icon={Database} title={t('mission.backup_strategy')}>
            <p className="text-sm text-muted-foreground">{dr.backup_strategy}</p>
          </MCSection>
        </>
      )}
    </div>
  );
}