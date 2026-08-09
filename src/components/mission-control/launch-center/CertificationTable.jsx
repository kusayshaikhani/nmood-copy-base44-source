import React, { useState } from 'react';
import { MCSection } from '@/components/mission-control/ui';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { updateCert } from '@/lib/launch-center-actions';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_OPTIONS = {
  ReleaseCertification: ['pass', 'warning', 'fail', 'pending'],
  StoreReadinessItem: ['complete', 'in_progress', 'pending', 'blocked'],
  LegalCertification: ['verified', 'review_needed', 'outdated', 'missing'],
  LocalizationCertification: ['complete', 'in_progress', 'pending', 'blocked'],
  AccessibilityCertification: ['pass', 'warning', 'fail', 'pending'],
  SecurityCertification: ['verified', 'review_needed', 'failed', 'pending'],
  AiCertification: ['certified', 'review_needed', 'non_compliant', 'pending'],
  LaunchChecklistItem: ['pending', 'complete', 'blocked'],
};

const STATUS_TONE = {
  pass: 'text-success', certified: 'text-success', verified: 'text-success', complete: 'text-success',
  warning: 'text-warning', review_needed: 'text-warning', in_progress: 'text-warning',
  pending: 'text-muted-foreground', blocked: 'text-destructive',
  fail: 'text-destructive', non_compliant: 'text-destructive', failed: 'text-destructive', missing: 'text-destructive', outdated: 'text-destructive',
};

export const certTone = (status) => STATUS_TONE[status] || 'text-muted-foreground';

/** RRPH-002 — Reusable certification table with inline status updates. */
export default function CertificationTable({ entity, items, columns, groupBy, onUpdated, sectionTitle, icon: Icon }) {
  const { t } = useLocalization();
  const [busy, setBusy] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const toggleGroup = (key) => setCollapsed((prev) => {
    const next = { ...prev };
    next[key] = !next[key];
    return next;
  });

  const handleUpdate = async (id, status) => {
    setBusy(id);
    await updateCert(entity, id, { status });
    onUpdated?.();
    setBusy(null);
  };

  const renderRow = (it) => (
    <tr key={it.id} className="border-b last:border-0">
      {columns.map((col) => (
        <td key={col.key} className="px-3 py-2 align-top">
          {col.render ? col.render(it) : <span className="text-sm">{it[col.key] ?? '—'}</span>}
        </td>
      ))}
      <td className="px-3 py-2 text-right">
        <select
          value={it.status}
          disabled={busy === it.id}
          onChange={(e) => handleUpdate(it.id, e.target.value)}
          className="text-xs rounded-md border bg-background px-2 py-1 capitalize focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          aria-label={`Status for ${it[columns[0].key]}`}
        >
          {STATUS_OPTIONS[entity].map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
          ))}
        </select>
      </td>
    </tr>
  );

  let body;
  if (groupBy) {
    const groups = {};
    (items || []).forEach((it) => { const k = it[groupBy]; (groups[k] ||= []).push(it); });
    body = Object.entries(groups).map(([key, rows]) => (
      <React.Fragment key={key}>
        <tr className="bg-muted/30">
          <td colSpan={columns.length + 1} className="px-3 py-2">
            <button onClick={() => toggleGroup(key)} className="flex items-center gap-1.5 text-sm font-medium">
              {collapsed[key] ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {key} <span className="text-xs text-muted-foreground">({rows.length})</span>
            </button>
          </td>
        </tr>
        {!collapsed[key] && rows.map(renderRow)}
      </React.Fragment>
    ));
  } else {
    body = (items || []).map(renderRow);
  }

  return (
    <MCSection icon={Icon} title={sectionTitle}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b">
              {columns.map((col) => <th key={col.key} className="px-3 py-2 font-medium">{col.label}</th>)}
              <th className="px-3 py-2 font-medium text-right">{t('admin.status')}</th>
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
    </MCSection>
  );
}