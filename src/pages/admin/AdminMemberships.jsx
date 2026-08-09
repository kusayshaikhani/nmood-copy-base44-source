import React, { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import AdminRowActions from '@/components/admin/AdminRowActions';
import BottomSheet from '@/components/shared/BottomSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminList } from '@/hooks/useAdminList';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { adjustMembership, withAction } from '@/lib/admin-actions';
import { Crown, RefreshCw, Pause } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusColors = {
  active: 'default',
  expired: 'secondary',
  cancelled: 'destructive',
};

const typeColors = {
  premium: 'default',
  explorer: 'secondary',
};

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Premium', value: 'premium' },
  { label: 'Explorer', value: 'explorer' },
  { label: 'Active', value: 'active' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminMemberships() {
  const { t } = useLocalization();
  const { data, loading, refresh } = useAdminList('Membership', 500);
  const confirm = useAdminConfirm();
  const [adjusting, setAdjusting] = useState(null);

  const setType = async (m, type) => {
    const ok = await confirm({
      title: `Set membership to ${type}?`,
      description: 'This is a manual tier adjustment.',
      confirmLabel: 'Apply',
    });
    if (!ok) return;
    await withAction(`Membership set to ${type}`, refresh)(() => adjustMembership(m.id, { type, status: 'active' }));
    setAdjusting(null);
  };

  const setStatus = async (m, status) => {
    await withAction(`Membership ${status}`, refresh)(() => adjustMembership(m.id, { status }));
  };

  const columns = [
    { key: 'user_id', label: 'User', render: (m) => <span className="font-mono text-xs">{m.user_id?.slice(0, 8) || '—'}</span> },
    { key: 'type', label: 'Tier', render: (m) => <Badge variant={typeColors[m.type]}>{m.type}</Badge> },
    { key: 'plan', label: 'Plan', render: (m) => m.plan || '—' },
    { key: 'started_date', label: 'Started', render: (m) => m.started_date || '—' },
    { key: 'expires_at', label: 'Renewal Date', render: (m) => (m.expires_at ? new Date(m.expires_at).toLocaleDateString() : '—') },
    { key: 'status', label: 'Status', render: (m) => <Badge variant={statusColors[m.status]}>{m.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (m) => (
        <AdminRowActions actions={[
          { icon: Crown, label: 'Adjust Tier', onClick: () => setAdjusting(m) },
          ...(m.status === 'active' ? [{ icon: Pause, label: 'Cancel', variant: 'destructive', onClick: () => setStatus(m, 'cancelled') }] : [{ icon: RefreshCw, label: 'Reactivate', onClick: () => setStatus(m, 'active') }]),
        ]} />
      ),
    },
  ];

  return (
    <>
      <AdminListPage
        title={t('admin.memberships')}
        description="Manage member subscription plans"
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search by user id…"
        searchKeys={['user_id', 'plan', 'type']}
        filterOptions={filterOptions}
        filterKey="type"
      />
      <BottomSheet open={!!adjusting} onOpenChange={(o) => !o && setAdjusting(null)} title={t('admin.manual_tier_adjustment')}>
        {adjusting && (
          <div className="space-y-2 pb-4">
            <p className="text-sm text-muted-foreground">{t('admin.current_tier')} <span className="font-medium text-foreground">{adjusting.type}</span></p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant={adjusting.type === 'explorer' ? 'secondary' : 'outline'} onClick={() => setType(adjusting, 'explorer')}>{t('admin.set_explorer')}</Button>
              <Button variant={adjusting.type === 'premium' ? 'default' : 'outline'} onClick={() => setType(adjusting, 'premium')}><Crown className="w-4 h-4" />{t('admin.set_premium')}</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}