import React from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import AdminRowActions from '@/components/admin/AdminRowActions';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { adminHosts } from '@/lib/admin-data';
import { Check, Pause, ShieldOff, Eye } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusColors = {
  verified: 'default',
  pending: 'secondary',
  suspended: 'destructive',
};

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
];

const columns = [
  {
    key: 'name',
    label: 'Organizer',
    render: (h) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-muted text-xs">{h.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{h.name}</p>
          <p className="text-xs text-muted-foreground">Since {h.joined}</p>
        </div>
      </div>
    ),
  },
  { key: 'activities', label: 'Hosted' },
  { key: 'completion_rate', label: 'Completion', render: (h) => <span className="text-success font-medium">{h.completion_rate}%</span> },
  { key: 'cancellation_rate', label: 'Cancellations', render: (h) => <span className="text-destructive font-medium">{h.cancellation_rate}%</span> },
  { key: 'rating', label: 'Rating', render: (h) => <span>{h.rating} ★</span> },
  { key: 'status', label: 'Status', render: (h) => <Badge variant={statusColors[h.status]}>{h.status}</Badge> },
  {
    key: 'actions',
    label: '',
    render: (h) => (
      <AdminRowActions actions={[
        { icon: Eye, label: 'View Profile' },
        { separator: true },
        ...(h.status === 'pending' ? [{ icon: Check, label: 'Verify' }] : []),
        ...(h.status === 'verified' ? [{ icon: Pause, label: 'Suspend Hosting', variant: 'destructive' }] : []),
        ...(h.status === 'verified' ? [{ icon: ShieldOff, label: 'Remove Verification', variant: 'destructive' }] : []),
        ...(h.status === 'suspended' ? [{ icon: Check, label: 'Reactivate' }] : []),
      ]} />
    ),
  },
];

export default function AdminHosts() {
  const { t } = useLocalization();
  return (
    <AdminListPage
      title={t('admin.organizers')}
      description="Manage organizer verifications and hosting privileges"
      columns={columns}
      data={adminHosts}
      searchPlaceholder="Search organizers..."
      searchKeys={['name']}
      filterOptions={filterOptions}
      filterKey="status"
    />
  );
}