import React, { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import AdminRowActions from '@/components/admin/AdminRowActions';
import BottomSheet from '@/components/shared/BottomSheet';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminList } from '@/hooks/useAdminList';
import { setTicketStatus, withAction } from '@/lib/admin-actions';
import { Eye, Clock, CheckCircle } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusColors = {
  open: 'default',
  waiting: 'secondary',
  resolved: 'default',
};

const typeColors = {
  feedback: 'secondary',
  appeal: 'destructive',
  contact: 'default',
  bug: 'destructive',
};

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Resolved', value: 'resolved' },
];

export default function AdminSupport() {
  const { t } = useLocalization();
  const { data, loading, refresh } = useAdminList('SupportTicket', 500);
  const [detail, setDetail] = useState(null);
  const [response, setResponse] = useState('');

  const setStatus = async (ticket, status) => {
    await withAction(`Case ${status}`, refresh)(() => setTicketStatus(ticket.id, { status }));
    setDetail(null);
  };

  const reply = async () => {
    if (!detail || !response.trim()) return;
    await withAction('Reply sent & case updated', refresh)(() => setTicketStatus(detail.id, { status: 'waiting', response: response.trim() }));
    setDetail(null);
    setResponse('');
  };

  const columns = [
    { key: 'type', label: 'Type', render: (c) => <Badge variant={typeColors[c.type]}>{c.type}</Badge> },
    { key: 'member_name', label: 'Member', render: (c) => c.member_name || '—' },
    { key: 'subject', label: 'Subject', render: (c) => <span className="font-medium">{c.subject}</span> },
    { key: 'assigned_to', label: 'Assigned', render: (c) => c.assigned_to || 'Unassigned' },
    { key: 'status', label: 'Status', render: (c) => <Badge variant={statusColors[c.status]}>{c.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <AdminRowActions actions={[
          { icon: Eye, label: 'View', onClick: () => { setDetail(c); setResponse(c.response || ''); } },
          ...(c.status !== 'waiting' ? [{ icon: Clock, label: 'Mark Waiting', onClick: () => setStatus(c, 'waiting') }] : []),
          ...(c.status !== 'resolved' ? [{ icon: CheckCircle, label: 'Resolve', onClick: () => setStatus(c, 'resolved') }] : []),
        ]} />
      ),
    },
  ];

  return (
    <>
      <AdminListPage
        title={t('admin.support')}
        description="Feedback, appeals, and contact requests"
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search cases…"
        searchKeys={['subject', 'member_name', 'member_email']}
        filterOptions={filterOptions}
        filterKey="status"
      />
      <BottomSheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={t('admin.support_case')} footerLabel="Send Reply" onFooterAction={reply}>
        {detail && (
          <div className="space-y-3 pb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-[10px] text-muted-foreground uppercase">{t('admin.from')}</p><p className="font-medium">{detail.member_name || '—'}</p>{detail.member_email && <p className="text-xs text-muted-foreground">{detail.member_email}</p>}</div>
              <div><p className="text-[10px] text-muted-foreground uppercase">{t('admin.status')}</p><Badge variant={statusColors[detail.status]}>{detail.status}</Badge></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.subject')}</p>
              <p className="text-sm font-medium">{detail.subject}</p>
            </div>
            {detail.message && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.message')}</p>
                <p className="text-sm">{detail.message}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.reply_response')}</p>
              <Textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={4} placeholder={t('admin.write_a_response')} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setStatus(detail, 'waiting')}>{t('admin.mark_waiting')}</Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setStatus(detail, 'resolved')}>{t('admin.resolve')}</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}