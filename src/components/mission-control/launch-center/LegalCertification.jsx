import React from 'react';
import { Scale } from 'lucide-react';
import CertificationTable, { certTone } from './CertificationTable';

/** RRPH-002 — Section 3: Legal Certification. */
export default function LegalCertification({ data, onUpdated }) {
  const items = data?.legal || [];
  const columns = [
    { key: 'document', label: 'Document', render: (it) => <span className="text-sm font-medium">{it.document}</span> },
    { key: 'version', label: 'Version', render: (it) => <span className="text-xs text-muted-foreground">{it.version || '—'}</span> },
    { key: 'notes', label: 'Notes', render: (it) => <span className="text-xs text-muted-foreground line-clamp-2">{it.notes}</span> },
  ];
  return <CertificationTable entity="LegalCertification" items={items} columns={columns} sectionTitle="Legal Certification (Section 3)" icon={Scale} onUpdated={onUpdated} />;
}