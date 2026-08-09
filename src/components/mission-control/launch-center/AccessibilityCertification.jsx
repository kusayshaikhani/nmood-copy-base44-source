import React from 'react';
import { Accessibility } from 'lucide-react';
import CertificationTable, { certTone } from './CertificationTable';

/** RRPH-002 — Section 5: Accessibility Certification. */
export default function AccessibilityCertification({ data, onUpdated }) {
  const items = data?.access || [];
  const columns = [
    { key: 'criterion', label: 'Criterion', render: (it) => <span className="text-sm font-medium">{it.criterion}</span> },
    { key: 'score', label: 'Score', render: (it) => <span className={`text-sm font-semibold ${certTone(it.status)}`}>{it.score}/100</span> },
    { key: 'notes', label: 'Notes', render: (it) => <span className="text-xs text-muted-foreground line-clamp-2">{it.notes}</span> },
  ];
  return <CertificationTable entity="AccessibilityCertification" items={items} columns={columns} sectionTitle="Accessibility Certification (Section 5)" icon={Accessibility} onUpdated={onUpdated} />;
}