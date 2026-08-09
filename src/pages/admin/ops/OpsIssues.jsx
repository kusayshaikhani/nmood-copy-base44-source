import React from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import StatusBadge from '@/components/ops/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { knownIssues } from '@/lib/ops-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

const priorityColors = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'secondary',
};

const columns = [
  { key: 'id', label: 'ID', render: (i) => <span className="font-mono text-xs">{i.id}</span> },
  { key: 'title', label: 'Title', render: (i) => <span className="font-medium">{i.title}</span> },
  { key: 'priority', label: 'Priority', render: (i) => <Badge variant={priorityColors[i.priority]}>{i.priority}</Badge> },
  { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
  { key: 'assigned', label: 'Assigned To' },
  { key: 'sprint', label: 'Target Sprint' },
];

export default function OpsIssues() {
  const { t } = useLocalization();
  return (
    <AdminListPage
      title={t('mission.known_issues')}
      description="Track and manage open issues across teams"
      columns={columns}
      data={knownIssues}
    />
  );
}