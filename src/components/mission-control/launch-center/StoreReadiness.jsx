import React from 'react';
import { Store } from 'lucide-react';
import CertificationTable, { certTone } from './CertificationTable';

/** RRPH-002 — Section 2: App Store & Google Play Readiness. */
export default function StoreReadiness({ data, onUpdated }) {
  const items = data?.store || [];
  const columns = [
    { key: 'section', label: 'Section', render: (it) => <span className="text-sm font-medium">{it.section}</span> },
    { key: 'item', label: 'Item', render: (it) => <span className="text-sm">{it.item}</span> },
    { key: 'store', label: 'Store', render: (it) => <span className="text-xs text-muted-foreground capitalize">{(it.store || '').replace('_', ' ')}</span> },
    { key: 'notes', label: 'Notes', render: (it) => <span className="text-xs text-muted-foreground line-clamp-2">{it.notes}</span> },
  ];
  return <CertificationTable entity="StoreReadinessItem" items={items} columns={columns} sectionTitle="App Store & Google Play Readiness (Section 2)" icon={Store} onUpdated={onUpdated} groupBy="section" />;
}