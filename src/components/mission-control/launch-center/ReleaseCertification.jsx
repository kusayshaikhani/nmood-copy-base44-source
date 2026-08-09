import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import CertificationTable, { certTone } from './CertificationTable';

/** RRPH-002 — Section 1: Release Certification across 19 platform modules. */
export default function ReleaseCertification({ data, onUpdated }) {
  const items = data?.release || [];
  const columns = [
    { key: 'module', label: 'Module', render: (it) => <span className="text-sm font-medium">{it.module}</span> },
    { key: 'category', label: 'Category', render: (it) => <span className="text-xs text-muted-foreground capitalize">{it.category}</span> },
    { key: 'score', label: 'Score', render: (it) => <span className={`text-sm font-semibold ${certTone(it.status)}`}>{it.score}/100</span> },
    { key: 'notes', label: 'Notes', render: (it) => <span className="text-xs text-muted-foreground line-clamp-2">{it.notes}</span> },
  ];
  return <CertificationTable entity="ReleaseCertification" items={items} columns={columns} sectionTitle="Platform Module Certification (Section 1)" icon={CheckCircle2} onUpdated={onUpdated} groupBy="category" />;
}