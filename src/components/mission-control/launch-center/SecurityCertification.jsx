import React from 'react';
import { Lock } from 'lucide-react';
import CertificationTable, { certTone } from './CertificationTable';

/** RRPH-002 — Section 6: Security Certification. */
export default function SecurityCertification({ data, onUpdated }) {
  const items = data?.sec || [];
  const columns = [
    { key: 'control', label: 'Control', render: (it) => <span className="text-sm font-medium">{it.control}</span> },
    { key: 'notes', label: 'Notes', render: (it) => <span className="text-xs text-muted-foreground line-clamp-2">{it.notes}</span> },
  ];
  return <CertificationTable entity="SecurityCertification" items={items} columns={columns} sectionTitle="Security Certification (Section 6)" icon={Lock} onUpdated={onUpdated} />;
}