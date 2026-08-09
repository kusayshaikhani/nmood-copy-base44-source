import React from 'react';
import { X } from 'lucide-react';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, APPROVAL_OPTIONS } from '@/lib/communication-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Field({ label, children }) {
  return (<label className="flex flex-col gap-1 text-xs"><span className="font-medium text-muted-foreground">{label}</span>{children}</label>);
}
function Select({ value, onChange, options }) {
  const { t } = useLocalization();
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value || undefined)} className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
      <option value="">{t('mission.all')}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function CampaignFilters({ filters, onChange, onClear, activeCount }) {
  const { t } = useLocalization();
  const set = (k, v) => onChange({ ...filters, [k]: v });
  return (
    <div className="rounded-xl border bg-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Filters {activeCount > 0 && <span className="text-xs text-primary">({activeCount})</span>}</h3>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><X className="w-3 h-3" /> {t('mission.clear_all')}</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Field label="Status"><Select value={filters.status} onChange={(v) => set('status', v)} options={STATUS_OPTIONS} /></Field>
        <Field label="Priority"><Select value={filters.priority} onChange={(v) => set('priority', v)} options={PRIORITY_OPTIONS} /></Field>
        <Field label="Approval"><Select value={filters.approval} onChange={(v) => set('approval', v)} options={APPROVAL_OPTIONS} /></Field>
        <Field label="Created From"><input type="date" value={filters.dateFrom || ''} onChange={(e) => set('dateFrom', e.target.value || undefined)} className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></Field>
        <Field label="Created To"><input type="date" value={filters.dateTo || ''} onChange={(e) => set('dateTo', e.target.value || undefined)} className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></Field>
      </div>
    </div>
  );
}