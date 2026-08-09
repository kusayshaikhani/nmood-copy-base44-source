import React from 'react';
import { Brain, ShieldCheck } from 'lucide-react';
import { MCSection, MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { BiPieChart } from '../bi/BiChart';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** AI-002 — Memory usage & governance observability. */
export default function PiMemory({ metrics }) {
  const { t } = useLocalization();
  const m = (metrics || {}).memoryUsage || { total: 0, consented: 0, byDomain: {} };
  const byDomain = m.byDomain || {};
  const domainNames = { interest: 'Interest', preference: 'Preference', behavioral: 'Behavioral', conversation: 'Conversation', mood: 'Mood' };
  const pie = Object.entries(byDomain).map(([k, v]) => ({ label: domainNames[k] || k, value: v }));
  const kpis = [
    { icon: Brain, label: 'Memory Records', value: m.total, color: 'primary' },
    { icon: ShieldCheck, label: 'Consented', value: m.consented, color: 'success' },
    { icon: Brain, label: 'Memory Domains', value: Object.keys(byDomain).length, color: 'info' },
    { icon: ShieldCheck, label: 'Consent Rate', value: m.total ? Math.round((m.consented / m.total) * 100) + '%' : '0%', color: 'success' },
  ];
  return (
    <div className="space-y-4">
      <MCKpiGrid>{kpis.map((k) => <MCKpiCard key={k.label} {...k} />)}</MCKpiGrid>
      <MCSection icon={Brain} title={t('mission.memory_by_domain')}>
        {pie.length ? <BiPieChart data={pie} /> : <p className="text-xs text-muted-foreground">{t('mission.no_member_memory_stored_yet')}</p>}
      </MCSection>
      <MCSection icon={ShieldCheck} title={t('mission.governance_capabilities')}>
        <div className="flex flex-wrap gap-1.5">
          {['User Consent', 'Memory Visibility', 'Memory Editing', 'Memory Deletion', 'Automatic Expiration', 'Export', 'Right to be Forgotten'].map((g) => (
            <span key={g} className="text-xs px-2 py-1 rounded-md bg-success/10 text-success font-medium">{g}</span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2">{t('mission.members_can_view_edit_delete')}</p>
      </MCSection>
    </div>
  );
}