import React from 'react';
import { X } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Select({ label, value, onChange, options, disabled }) {
  const { t } = useLocalization();
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
      >
        <option value="">{t('mission.all')}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function Toggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={'h-9 px-3 rounded-lg text-xs font-medium border transition-default ' +
        (active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50')}
    >
      {label}
    </button>
  );
}

export default function MCTrustFilters({ filters, onChange, onClear, options }) {
  const { t } = useLocalization();
  const set = (k, v) => onChange({ ...filters, [k]: v });
  return (
    <div className="rounded-xl border bg-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{t('mission.filters')}</h3>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <X className="w-3 h-3" /> {t('mission.clear_all')}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Select label="Report Type" value={filters.type} onChange={(v) => set('type', v)} options={options.types} />
        <Select label="Status" value={filters.status} onChange={(v) => set('status', v)} options={[
          { value: 'submitted', label: 'Submitted' }, { value: 'reviewing', label: 'Reviewing' }, { value: 'resolved', label: 'Resolved' }, { value: 'dismissed', label: 'Dismissed' },
        ]} />
        <Select label="Priority" value={filters.priority} onChange={(v) => set('priority', v)} options={[
          { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' },
        ]} />
        <Select label="Resolution State" value={filters.resolution} onChange={(v) => set('resolution', v)} options={[
          { value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'dismissed', label: 'Dismissed' },
        ]} />
        <Select label="Country" value={filters.country} onChange={(v) => set('country', v)} options={options.countries} />
        <Select label="Assigned Moderator" value={filters.assigned} onChange={(v) => set('assigned', v)} options={[]} disabled />
        <DateField label="Date From" value={filters.dateFrom} onChange={(v) => set('dateFrom', v)} />
        <DateField label="Date To" value={filters.dateTo} onChange={(v) => set('dateTo', v)} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Toggle label="AI Flagged only" active={!!filters.aiFlagged} onClick={() => set('aiFlagged', !filters.aiFlagged)} />
      </div>
    </div>
  );
}