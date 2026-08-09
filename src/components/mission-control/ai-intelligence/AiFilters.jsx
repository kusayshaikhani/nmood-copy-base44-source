import React from 'react';
import { X } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Select({ label, value, onChange, options }) {
  const { t } = useLocalization();
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <select value={value || ''} onChange={(e) => onChange(e.target.value || undefined)}
        className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
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
      <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value || undefined)}
        className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </label>
  );
}

export default function AiFilters({ filters, onChange, onClear, options, services }) {
  const { t } = useLocalization();
  const set = (k, v) => onChange({ ...filters, [k]: v });
  return (
    <div className="rounded-xl border bg-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{t('mission.filters')}</h3>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><X className="w-3 h-3" /> {t('mission.clear_all')}</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        <Select label="AI Service" value={filters.service} onChange={(v) => set('service', v)} options={services} />
        <Select label="Status" value={filters.status} onChange={(v) => set('status', v)} options={[
          { value: 'healthy', label: 'Healthy' }, { value: 'warning', label: 'Warning' }, { value: 'critical', label: 'Critical' }, { value: 'offline', label: 'Offline' },
        ]} />
        <Select label="Country" value={filters.country} onChange={(v) => set('country', v)} options={options.countries} />
        <Select label="Language" value={filters.language} onChange={(v) => set('language', v)} options={options.languages} />
        <DateField label="Date From" value={filters.dateFrom} onChange={(v) => set('dateFrom', v)} />
        <DateField label="Date To" value={filters.dateTo} onChange={(v) => set('dateTo', v)} />
      </div>
    </div>
  );
}