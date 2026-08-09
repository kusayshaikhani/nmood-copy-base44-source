import React, { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import AdminRowActions from '@/components/admin/AdminRowActions';
import MemberProfileSheet from '@/components/admin/MemberProfileSheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminList } from '@/hooks/useAdminList';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { useHardDelete } from '@/components/admin/HardDeleteProvider';
import { setMemberStatus, withAction } from '@/lib/admin-actions';
import { Eye, Ban, Unlock, PowerOff, CheckCircle, Trash2 } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusColors = {
  active: 'default',
  suspended: 'destructive',
  deactivated: 'secondary',
};

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Deactivated', value: 'deactivated' },
];

export default function AdminMembers() {
  const { t } = useLocalization();
  const { data, loading, refresh } = useAdminList('Member', 2000);
  const confirm = useAdminConfirm();
  const { requestHardDelete } = useHardDelete();
  const [profile, setProfile] = useState(null);

  const doStatus = async (m, status, label) => {
    const ok = await confirm({
      title: `${label} ${m.display_name || m.first_name}?`,
      description: 'This changes the member account status.',
      confirmLabel: label,
      variant: status === 'active' ? 'default' : 'destructive',
    });
    if (!ok) return;
    await withAction(`Member ${status}`, refresh)(() => setMemberStatus(m.id, status));
  };

  const doHardDelete = async (m) => {
    const res = await requestHardDelete({ entity: 'Member', id: m.id, label: m.display_name || m.first_name });
    if (res?.ok) refresh();
  };

  const columns = [
    {
      key: 'name',
      label: 'Member',
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8">
            {m.photo_url ? <AvatarImage src={m.photo_url} /> : null}
            <AvatarFallback className="bg-muted text-xs">{(m.display_name || m.first_name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{m.display_name || m.first_name}</p>
            <p className="text-xs text-muted-foreground truncate">{m.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'city', label: 'City', render: (m) => m.city || '—' },
    { key: 'country', label: 'Country', render: (m) => m.country || '—' },
    {
      key: 'phone_verified',
      label: 'Verified',
      render: (m) => <Badge variant={m.phone_verified ? 'default' : 'secondary'}>{m.phone_verified ? 'Verified' : 'No'}</Badge>,
    },
    {
      key: 'admin_status',
      label: 'Status',
      render: (m) => <Badge variant={statusColors[m.admin_status || 'active']}>{m.admin_status || 'active'}</Badge>,
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (m) => (m.created_date ? new Date(m.created_date).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      label: '',
      render: (m) => {
        const status = m.admin_status || 'active';
        return (
          <AdminRowActions actions={[
            { icon: Eye, label: 'View Profile', onClick: () => setProfile(m) },
            { separator: true },
            ...(status === 'active' ? [{ icon: Ban, label: 'Suspend', variant: 'destructive', onClick: () => doStatus(m, 'suspended', 'Suspend') }] : []),
            ...(status === 'active' ? [{ icon: PowerOff, label: 'Deactivate', variant: 'destructive', onClick: () => doStatus(m, 'deactivated', 'Deactivate') }] : []),
            ...(status !== 'active' ? [{ icon: Unlock, label: 'Reactivate', onClick: () => doStatus(m, 'active', 'Reactivate') }] : []),
            { separator: true },
            { icon: Trash2, label: 'Hard Delete', variant: 'destructive', onClick: () => doHardDelete(m) },
          ]} />
        );
      },
    },
  ];

  return (
    <>
      <AdminListPage
        title={t('admin.members')}
        description="Manage all platform members"
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search by name, email, city…"
        searchKeys={['display_name', 'first_name', 'last_name', 'email', 'city', 'country']}
        filterOptions={filterOptions}
        filterKey="admin_status"
      />
      <MemberProfileSheet member={profile} open={!!profile} onOpenChange={(o) => !o && setProfile(null)} />
    </>
  );
}