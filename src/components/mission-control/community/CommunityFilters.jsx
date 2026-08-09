import React from 'react';
import { X } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }) {
  const { t } = useLocalization();
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value || undefined)}
      className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
      <option value="">{t('mission.all')}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** MC-UX-001 — Unified filter system with a Content Type filter (All / Experiences / Circles). */
export default function CommunityFilters({ type, filters, onChange, onClear, options, activeCount, contentType, onContentTypeChange }) {
  const { t } = useLocalization();
  const set = (k, v) => onChange({ ...filters, [k]: v });
  const statuses = type === 'experience'
    ? [{ value: 'active', label: 'Active' }, { value: 'closed', label: 'Closed' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'completed', label: 'Completed' }]
    : [{ value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'paused', label: 'Paused' }, { value: 'archived', label: 'Archived' }];
  return (
    <div className="rounded-xl border bg-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Filters {activeCount > 0 && <span className="text-xs text-primary">({activeCount})</span>}</h3>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><X className="w-3 h-3" /> {t('mission.clear_all')}</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Field label="Content Type"><Select value={contentType} onChange={(v) => onContentTypeChange?.(v)} options={[{ value: 'experience', label: 'Experiences' }, { value: 'circle', label: 'Circles' }]} /></Field>
        <Field label="Status"><Select value={filters.status} onChange={(v) => set('status', v)} options={statuses} /></Field>
        <Field label="Category"><Select value={filters.category} onChange={(v) => set('category', v)} options={options.categories.map((c) => ({ value: c, label: c }))} /></Field>
        <Field label="Creator"><input value={filters.creator || ''} onChange={(e) => set('creator', e.target.value)} placeholder={t('mission.host_name')} className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></Field>
        <Field label="Visibility"><Select value={filters.visibility} onChange={(v) => set('visibility', v)} options={[{ value: 'public', label: 'Public' }, { value: 'connections', label: 'Connections' }, { value: 'private', label: 'Private' }]} /></Field>
        <div className="flex items-center gap-4 pt-5">
          <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!filters.featured} onChange={(e) => set('featured', e.target.checked || undefined)} className="accent-primary" /> {t('admin.featured')}</label>
          <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!filters.reported} onChange={(e) => set('reported', e.target.checked || undefined)} className="accent-primary" /> {t('mission.reported')}</label>
          <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!filters.archived} onChange={(e) => set('archived', e.target.checked || undefined)} className="accent-primary" /> {t('admin.archived')}</label>
          <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!filters.hidden} onChange={(e) => set('hidden', e.target.checked || undefined)} className="accent-primary" /> {t('admin.hidden')}</label>
        </div>
        <Field label="Created From"><input type="date" value={filters.dateFrom || ''} onChange={(e) => set('dateFrom', e.target.value || undefined)} className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></Field>
        <Field label="Created To"><input type="date" value={filters.dateTo || ''} onChange={(e) => set('dateTo', e.target.value || undefined)} className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></Field>
      </div>
    </div>
  );
}