import React from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import { Badge } from '@/components/ui/badge';
import { adminContent } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusColors = {
  published: 'default',
  draft: 'secondary',
  archived: 'secondary',
};

const columns = [
  { key: 'title', label: 'Title', render: (c) => <span className="font-medium">{c.title}</span> },
  { key: 'type', label: 'Type', render: (c) => <Badge variant="secondary">{c.type}</Badge> },
  { key: 'author', label: 'Author' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status', render: (c) => <Badge variant={statusColors[c.status]}>{c.status}</Badge> },
];

export default function AdminContent() {
  const { t } = useLocalization();
  return (
    <AdminListPage
      title={t('admin.content')}
      description="Manage platform content and policies"
      columns={columns}
      data={adminContent}
    />
  );
}