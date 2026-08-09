import React, { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import AdminRowActions from '@/components/admin/AdminRowActions';
import CircleEditSheet from '@/components/admin/CircleEditSheet';
import { Badge } from '@/components/ui/badge';
import { useAdminList } from '@/hooks/useAdminList';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { useHardDelete } from '@/components/admin/HardDeleteProvider';
import { setCircleStatus, withAction } from '@/lib/admin-actions';
import { Edit, Archive, Star, EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusColors = {
  active: 'default',
  draft: 'secondary',
  paused: 'secondary',
  archived: 'secondary',
};

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Paused', value: 'paused' },
  { label: 'Archived', value: 'archived' },
];

export default function AdminCircles() {
  const { t } = useLocalization();
  const { data, loading, refresh } = useAdminList('Circle', 500);
  const confirm = useAdminConfirm();
  const { requestHardDelete } = useHardDelete();
  const [editing, setEditing] = useState(null);

  const act = async (circle, patch, label) => {
    const ok = await confirm({
      title: `${label} “${circle.name}”?`,
      confirmLabel: label,
      variant: patch.is_archived ? 'destructive' : 'default',
    });
    if (!ok) return;
    await withAction(`Circle ${label.toLowerCase()}`, refresh)(() => setCircleStatus(circle.id, patch));
  };

  const toggle = async (circle, field, label) => {
    const val = !circle[field];
    await withAction(`${label} ${val ? 'enabled' : 'disabled'}`, refresh)(() => setCircleStatus(circle.id, { [field]: val }));
  };

  const doHardDelete = async (c) => {
    const res = await requestHardDelete({ entity: 'Circle', id: c.id, label: c.name });
    if (res?.ok) refresh();
  };

  const columns = [
    {
      key: 'name',
      label: 'Circle',
      render: (c) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{c.name}</p>
          {c.is_featured && <Badge className="mr-1 text-[10px]">{t('admin.featured')}</Badge>}
          {c.is_hidden && <Badge variant="secondary" className="text-[10px]">{t('admin.hidden')}</Badge>}
        </div>
      ),
    },
    { key: 'member_count', label: 'Members', render: (c) => c.member_count || 0 },
    { key: 'host_name', label: 'Host', render: (c) => c.host_name || '—' },
    { key: 'category', label: 'Category', render: (c) => c.category || '—' },
    { key: 'status', label: 'Status', render: (c) => <Badge variant={statusColors[c.status]}>{c.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <AdminRowActions actions={[
          { icon: Edit, label: 'Edit', onClick: () => setEditing(c) },
          { icon: Star, label: c.is_featured ? 'Unfeature' : 'Feature', onClick: () => toggle(c, 'is_featured', 'Feature') },
          { icon: EyeOff, label: c.is_hidden ? 'Unhide' : 'Hide', onClick: () => toggle(c, 'is_hidden', 'Hide') },
          { separator: true },
          ...(c.status !== 'archived' ? [{ icon: Archive, label: 'Archive', variant: 'destructive', onClick: () => act(c, { status: 'archived' }, 'Archive') }] : [{ icon: RotateCcw, label: 'Restore', onClick: () => act(c, { status: 'active' }, 'Restore') }]),
          { separator: true },
          { icon: Trash2, label: 'Hard Delete', variant: 'destructive', onClick: () => doHardDelete(c) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <AdminListPage
        title={t('admin.circles')}
        description="Manage all community circles"
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search circles…"
        searchKeys={['name', 'host_name', 'category', 'location']}
        filterOptions={filterOptions}
        filterKey="status"
      />
      <CircleEditSheet circle={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} onUpdated={refresh} />
    </>
  );
}