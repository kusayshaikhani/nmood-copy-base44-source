import React, { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import AdminRowActions from '@/components/admin/AdminRowActions';
import ExperienceEditSheet from '@/components/admin/ExperienceEditSheet';
import { Badge } from '@/components/ui/badge';
import { useAdminList } from '@/hooks/useAdminList';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { useHardDelete } from '@/components/admin/HardDeleteProvider';
import { setExperienceStatus, withAction } from '@/lib/admin-actions';
import { Eye, Edit, Archive, X, Star, EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusColors = {
  active: 'default',
  closed: 'secondary',
  cancelled: 'destructive',
  completed: 'secondary',
};

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminActivities() {
  const { t } = useLocalization();
  const { data, loading, refresh } = useAdminList('Experience', 500);
  const confirm = useAdminConfirm();
  const { requestHardDelete } = useHardDelete();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);

  const act = async (exp, patch, label) => {
    const ok = await confirm({
      title: `${label} “${exp.title}”?`,
      confirmLabel: label,
      variant: patch.status === 'cancelled' || patch.is_archived ? 'destructive' : 'default',
    });
    if (!ok) return;
    await withAction(`Experience ${label.toLowerCase()}`, refresh)(() => setExperienceStatus(exp.id, patch));
  };

  const toggle = async (exp, field, label) => {
    const val = !exp[field];
    await withAction(`${label} ${val ? 'enabled' : 'disabled'}`, refresh)(() => setExperienceStatus(exp.id, { [field]: val }));
  };

  const doHardDelete = async (e) => {
    const res = await requestHardDelete({ entity: 'Experience', id: e.id, label: e.title });
    if (res?.ok) refresh();
  };

  const columns = [
    {
      key: 'title',
      label: 'Experience',
      render: (e) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{e.title}</p>
          {e.is_featured && <Badge className="mr-1 text-[10px]">{t('admin.featured')}</Badge>}
          {e.is_hidden && <Badge variant="secondary" className="text-[10px]">{t('admin.hidden')}</Badge>}
          {e.is_archived && <Badge variant="secondary" className="text-[10px]">{t('admin.archived')}</Badge>}
        </div>
      ),
    },
    { key: 'host_name', label: 'Host', render: (e) => e.host_name || '—' },
    { key: 'category', label: 'Category', render: (e) => <Badge variant="secondary">{e.category || '—'}</Badge> },
    { key: 'date', label: 'Date', render: (e) => e.date || '—' },
    { key: 'spots_filled', label: 'Participants', render: (e) => e.spots_filled || 0 },
    { key: 'status', label: 'Status', render: (e) => <Badge variant={statusColors[e.status]}>{e.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (e) => (
        <AdminRowActions actions={[
          { icon: Eye, label: 'View', onClick: () => navigate(`/experience/${e.id}`) },
          { icon: Edit, label: 'Edit', onClick: () => setEditing(e) },
          { icon: Star, label: e.is_featured ? 'Unfeature' : 'Feature', onClick: () => toggle(e, 'is_featured', 'Feature') },
          { icon: EyeOff, label: e.is_hidden ? 'Unhide' : 'Hide', onClick: () => toggle(e, 'is_hidden', 'Hide') },
          { separator: true },
          ...(e.status !== 'cancelled' ? [{ icon: X, label: 'Cancel', variant: 'destructive', onClick: () => act(e, { status: 'cancelled' }, 'Cancel') }] : []),
          ...(!e.is_archived ? [{ icon: Archive, label: 'Archive', variant: 'destructive', onClick: () => act(e, { is_archived: true }, 'Archive') }] : [{ icon: RotateCcw, label: 'Unarchive', onClick: () => act(e, { is_archived: false }, 'Unarchive') }]),
          { separator: true },
          { icon: Trash2, label: 'Hard Delete', variant: 'destructive', onClick: () => doHardDelete(e) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <AdminListPage
        title={t('admin.experiences')}
        description="Manage all platform experiences"
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search experiences…"
        searchKeys={['title', 'host_name', 'category', 'location']}
        filterOptions={filterOptions}
        filterKey="status"
      />
      <ExperienceEditSheet experience={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} onUpdated={refresh} />
    </>
  );
}