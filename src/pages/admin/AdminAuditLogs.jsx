import React from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import { adminAuditLogs } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

const columns = [
  { key: 'action', label: 'Action', render: (l) => <span className="font-medium">{l.action}</span> },
  { key: 'user', label: 'Administrator' },
  { key: 'target', label: 'Target' },
  { key: 'reason', label: 'Reason' },
  { key: 'timestamp', label: 'Date' },
  { key: 'ip', label: 'IP Address', render: (l) => <span className="font-mono text-xs">{l.ip}</span> },
];

export default function AdminAuditLogs() {
  const { t } = useLocalization();
  return (
    <AdminListPage
      title={t('admin.audit_logs')}
      description="All administrative actions are logged"
      columns={columns}
      data={adminAuditLogs}
    />
  );
}