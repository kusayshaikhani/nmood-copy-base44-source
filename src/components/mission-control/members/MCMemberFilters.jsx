import React from 'react';
import { X } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Select({ label, value, onChange, options }) {
  const { t } = useLocalization();
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">{t('mission.all')}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
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

export default function MCMemberFilters({ filters, onChange, onClear, options }) {
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
        <Select label="Membership" value={filters.membership} onChange={(v) => set('membership', v)} options={[{ value: 'explorer', label: 'Explorer' }, { value: 'premium', label: 'Premium' }]} />
        <Select label="Verification" value={filters.verification} onChange={(v) => set('verification', v)} options={[{ value: 'verified', label: 'Verified' }, { value: 'email', label: 'Email only' }]} />
        <Select label="Account Status" value={filters.status} onChange={(v) => set('status', v)} options={[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'deactivated', label: 'Deactivated' }, { value: 'banned', label: 'Banned' }, { value: 'deleted', label: 'Deleted' }]} />
        <Select label="Trust Score" value={filters.trustMin} onChange={(v) => set('trustMin', v)} options={[{ value: '80', label: '80+' }, { value: '60', label: '60+' }, { value: '40', label: '40+' }]} />
        <Select label="Country" value={filters.country} onChange={(v) => set('country', v)} options={options.countries} />
        <Select label="City" value={filters.city} onChange={(v) => set('city', v)} options={options.cities} />
        <Select label="Language" value={filters.language} onChange={(v) => set('language', v)} options={options.languages} />
        <Select label="Online" value={filters.online} onChange={(v) => set('online', v)} options={[{ value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }]} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Toggle label="Recently registered (7d)" active={!!filters.recentlyRegistered} onClick={() => set('recentlyRegistered', !filters.recentlyRegistered)} />
        <Toggle label="Recently active (7d)" active={!!filters.recentlyActive} onClick={() => set('recentlyActive', !filters.recentlyActive)} />
      </div>
    </div>
  );
}