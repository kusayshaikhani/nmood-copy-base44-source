import React, { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import AnnouncementComposer from '@/components/admin/AnnouncementComposer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminList } from '@/hooks/useAdminList';
import { Megaphone } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const audienceLabels = {
  all: 'All Members',
  premium: 'Premium Members',
  city: 'Members in a City',
  country: 'Members in a Country',
};

export default function AdminNotifications() {
  const { t } = useLocalization();
  const { data, loading, refresh } = useAdminList('Announcement', 100);
  const [composing, setComposing] = useState(false);

  const columns = [
    { key: 'title', label: 'Title', render: (n) => <span className="font-medium">{n.title}</span> },
    { key: 'audience', label: 'Target', render: (n) => audienceLabels[n.audience] || n.audience },
    { key: 'target_value', label: 'Filter', render: (n) => n.target_value || '—' },
    { key: 'reach', label: 'Reach', render: (n) => (n.status === 'sent' ? n.reach : '—') },
    { key: 'status', label: 'Status', render: (n) => <Badge variant={n.status === 'sent' ? 'default' : 'secondary'}>{n.status}</Badge> },
    {
      key: 'sent',
      label: 'Sent',
      render: (n) => (n.created_date ? new Date(n.created_date).toLocaleDateString() : '—'),
    },
  ];

  return (
    <>
      <AdminListPage
        title={t('admin.notifications')}
        description="Manage announcements and broadcasts"
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search announcements…"
        searchKeys={['title', 'audience']}
        actions={<Button size="sm" className="gap-2" onClick={() => setComposing(true)}><Megaphone className="w-4 h-4" />{t('admin.new_announcement')}</Button>}
      />
      <AnnouncementComposer open={composing} onOpenChange={setComposing} onCreated={refresh} />
    </>
  );
}