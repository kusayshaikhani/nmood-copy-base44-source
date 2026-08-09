import React from 'react';
import { Brain } from 'lucide-react';
import CertificationTable, { certTone } from './CertificationTable';

/** RRPH-002 — Section 7: AI Certification. */
export default function AiCertification({ data, onUpdated }) {
  const items = data?.ai || [];
  const columns = [
    { key: 'principle', label: 'Principle', render: (it) => <span className="text-sm font-medium">{it.principle}</span> },
    { key: 'notes', label: 'Notes', render: (it) => <span className="text-xs text-muted-foreground line-clamp-2">{it.notes}</span> },
  ];
  return <CertificationTable entity="AiCertification" items={items} columns={columns} sectionTitle="AI Certification (Section 7)" icon={Brain} onUpdated={onUpdated} />;
}