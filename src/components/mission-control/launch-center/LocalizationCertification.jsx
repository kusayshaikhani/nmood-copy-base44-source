import React from 'react';
import { Languages } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import CertificationTable, { certTone } from './CertificationTable';

/** RRPH-002 — Section 4: Localization Certification. */
export default function LocalizationCertification({ data, onUpdated }) {
  const items = data?.loc || [];
  const langs = items.filter((x) => x.check_type === 'language');
  const globals = items.filter((x) => x.check_type !== 'language');
  const columns = [
    { key: 'language', label: 'Language', render: (it) => <span className="text-sm font-medium uppercase">{it.language}</span> },
    { key: 'coverage_pct', label: 'Coverage', render: (it) => (
      <div className="flex items-center gap-2 w-32">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className={`h-full ${it.coverage_pct >= 90 ? 'bg-success' : it.coverage_pct >= 80 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${it.coverage_pct}%` }} /></div>
        <span className="text-xs">{it.coverage_pct}%</span>
      </div>
    ) },
    { key: 'missing_keys', label: 'Missing', render: (it) => <span className="text-xs">{it.missing_keys}</span> },
    { key: 'notes', label: 'Notes', render: (it) => <span className="text-xs text-muted-foreground line-clamp-1">{it.notes}</span> },
  ];
  return (
    <div className="space-y-4">
      <CertificationTable entity="LocalizationCertification" items={langs} columns={columns} sectionTitle="Supported Languages (Section 4)" icon={Languages} onUpdated={onUpdated} />
      <CertificationTable entity="LocalizationCertification" items={globals} columns={[columns[0], { key: 'check_type', label: 'Check', render: (it) => <span className="text-sm font-medium capitalize">{it.check_type}</span> }, { key: 'notes', label: 'Notes', render: (it) => <span className="text-xs text-muted-foreground">{it.notes}</span> }]} sectionTitle="Platform-wide Checks" icon={Languages} onUpdated={onUpdated} />
    </div>
  );
}