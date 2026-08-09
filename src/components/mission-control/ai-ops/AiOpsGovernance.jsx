import React, { useState } from 'react';
import { ShieldCheck, BookOpen, Check, X, ArrowUpRight } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const REVIEW_TYPE_LABEL = {
  account_suspension: 'Account Suspension', permanent_ban: 'Permanent Ban',
  trust_safety_escalation: 'Trust & Safety Escalation', high_risk_report: 'High-Risk Report',
  legal_request: 'Legal Request', appeal: 'Appeal',
};

/** AI-003 — Governance: pillars, policy engine, human review queue with approval/rejection. */
export default function AiOpsGovernance({ data, onRan }) {
  const { t } = useLocalization();
  const d = data || {};
  const policies = d.policies || [];
  const [reviews, setReviews] = useState(d.pendingReviews || []);
  const [acting, setActing] = useState(null);

  const act = async (id, decision) => {
    setActing(id);
    try { await base44.functions.invoke('aiOps', { mode: 'reviewAction', review_id: id, decision }); setReviews((r) => r.filter((x) => x.id !== id)); onRan?.(); }
    catch (_e) {}
    setActing(null);
  };

  return (
    <div className="space-y-4">
      <MCSection icon={ShieldCheck} title={t('mission.ai_governance_framework')}>
        <div className="flex flex-wrap gap-1.5">
          {(d.governance || []).map((g) => <span key={g} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">{g}</span>)}
        </div>
      </MCSection>

      <MCSection icon={BookOpen} title={t('mission.ai_policy_engine_centralized')}>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40"><tr className="text-left">
              <th className="px-3 py-2 font-medium">{t('mission.policy')}</th><th className="px-3 py-2 font-medium">{t('mission.category')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.region')}</th><th className="px-3 py-2 font-medium">{t('admin.status')}</th><th className="px-3 py-2 font-medium">{t('mission.summary')}</th>
            </tr></thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 capitalize">{(p.category || '').replace(/_/g, ' ')}</td>
                  <td className="px-3 py-2">{p.region || 'Global'}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${p.status === 'active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{p.status}</span></td>
                  <td className="px-3 py-2 text-muted-foreground">{p.summary}</td>
                </tr>
              ))}
              {!policies.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">{t('mission.no_policies_yet_click_seed')}</td></tr>}
            </tbody>
          </table>
        </div>
      </MCSection>

      <MCSection icon={ShieldCheck} title={`Human Review Queue (${reviews.length} pending)`}>
        <p className="text-xs text-muted-foreground mb-3">{t('mission.ai_may_assist_humans_make')}</p>
        {reviews.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('mission.no_items_pending_human_review')}</p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border bg-card/60 p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-sm font-medium">{REVIEW_TYPE_LABEL[r.review_type] || r.review_type}</span>
                    {r.target_id && <span className="text-xs text-muted-foreground ml-2">target: {r.target_type}/{r.target_id}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => act(r.id, 'approve')} disabled={acting === r.id} className="gap-1.5 h-7"><Check className="w-3.5 h-3.5 text-success" /> {t('mission.approve')}</Button>
                    <Button size="sm" variant="outline" onClick={() => act(r.id, 'reject')} disabled={acting === r.id} className="gap-1.5 h-7"><X className="w-3.5 h-3.5 text-destructive" /> {t('mission.reject')}</Button>
                    <Button size="sm" variant="outline" onClick={() => act(r.id, 'escalate')} disabled={acting === r.id} className="gap-1.5 h-7"><ArrowUpRight className="w-3.5 h-3.5" /> {t('mission.escalate')}</Button>
                  </div>
                </div>
                {r.ai_recommendation && <p className="text-xs text-muted-foreground mt-1">AI recommendation: {r.ai_recommendation} {r.ai_confidence ? <span className="text-muted-foreground/70">({r.ai_confidence} confidence)</span> : null}</p>}
              </div>
            ))}
          </div>
        )}
      </MCSection>
    </div>
  );
}