import React from 'react';
import { ListChecks } from 'lucide-react';
import CertificationTable, { certTone } from './CertificationTable';

const CATEGORY_LABEL = {
  infrastructure: 'Infrastructure', security: 'Security', legal: 'Legal', ai: 'AI',
  mission_control: 'Mission Control', monitoring: 'Monitoring', backups: 'Backups',
  localization: 'Localization', accessibility: 'Accessibility', app_store: 'App Store',
  google_play: 'Google Play', notifications: 'Notifications', payments: 'Payments',
  disaster_recovery: 'Disaster Recovery',
};

/** RRPH-002 — Section 10: Interactive Launch Checklist. */
export default function LaunchChecklist({ data, onUpdated }) {
  const items = (data?.checklist || []).map((it) => ({ ...it, categoryLabel: CATEGORY_LABEL[it.category] || it.category }));
  const columns = [
    { key: 'item', label: 'Item', render: (it) => <span className="text-sm font-medium">{it.item}</span> },
    { key: 'owner', label: 'Owner', render: (it) => <span className="text-xs text-muted-foreground">{it.owner || '—'}</span> },
    { key: 'notes', label: 'Notes', render: (it) => <span className="text-xs text-muted-foreground line-clamp-2">{it.notes}</span> },
  ];
  return <CertificationTable entity="LaunchChecklistItem" items={items} columns={columns} sectionTitle="Launch Checklist (Section 10)" icon={ListChecks} onUpdated={onUpdated} groupBy="categoryLabel" />;
}