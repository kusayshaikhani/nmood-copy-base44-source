import React, { useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import AdminRowActions from '@/components/admin/AdminRowActions';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { useAdminList } from '@/hooks/useAdminList';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { useHardDelete } from '@/components/admin/HardDeleteProvider';
import { setReportStatus, withAction } from '@/lib/admin-actions';
import { Eye, CheckCircle, X, Trash2 } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusColors = {
  submitted: 'default',
  reviewing: 'secondary',
  resolved: 'default',
  dismissed: 'secondary',
};

const statusLabels = {
  submitted: 'New',
  reviewing: 'Under Review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'submitted' },
  { label: 'Under Review', value: 'reviewing' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
];

export default function AdminReports() {
  const { t } = useLocalization();
  const { data, loading, refresh } = useAdminList('SafetyReport', 500);
  const confirm = useAdminConfirm();
  const { requestHardDelete } = useHardDelete();
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');

  const doHardDelete = async (r) => {
    const res = await requestHardDelete({ entity: 'SafetyReport', id: r.id, label: r.target_name || r.target_type });
    if (res?.ok) { refresh(); setDetail(null); }
  };

  const setStatus = async (report, status, label) => {
    const ok = await confirm({
      title: `Mark as ${label}?`,
      confirmLabel: label,
      variant: status === 'dismissed' ? 'destructive' : 'default',
    });
    if (!ok) return;
    await withAction(`Report ${label.toLowerCase()}`, refresh)(() => setReportStatus(report.id, status));
    setDetail(null);
  };

  const resolveWithNote = async () => {
    if (!detail) return;
    await withAction('Report resolved', refresh)(() => setReportStatus(detail.id, 'resolved', note));
    setDetail(null);
    setNote('');
  };

  const columns = [
    { key: 'target_type', label: 'Type', render: (r) => <Badge variant="secondary">{r.target_type}</Badge> },
    { key: 'target_name', label: 'Reported', render: (r) => r.target_name || r.target_id || '—' },
    { key: 'reporter_name', label: 'Reporter', render: (r) => r.reporter_name || '—' },
    { key: 'reason', label: 'Reason', render: (r) => r.reason || '—' },
    { key: 'priority', label: 'Priority', render: (r) => <Badge variant={r.priority === 'high' ? 'destructive' : 'secondary'}>{r.priority || 'medium'}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={statusColors[r.status]}>{statusLabels[r.status] || r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <AdminRowActions actions={[
          { icon: Eye, label: 'Review', onClick: () => { setDetail(r); setNote(r.resolution_note || ''); } },
          { separator: true },
          ...(r.status === 'submitted' ? [{ icon: Eye, label: 'Start Review', onClick: () => setStatus(r, 'reviewing', 'Under Review') }] : []),
          { icon: CheckCircle, label: 'Resolve', onClick: () => setStatus(r, 'resolved', 'Resolved') },
          { icon: X, label: 'Dismiss', variant: 'destructive', onClick: () => setStatus(r, 'dismissed', 'Dismissed') },
          { separator: true },
          { icon: Trash2, label: 'Hard Delete', variant: 'destructive', onClick: () => doHardDelete(r) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <AdminListPage
        title={t('admin.reports')}
        description="Review and resolve member reports"
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search reports…"
        searchKeys={['target_name', 'reporter_name', 'reason']}
        filterOptions={filterOptions}
        filterKey="status"
      />
      <BottomSheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={t('admin.report_review')} footerLabel="Resolve with Note" onFooterAction={resolveWithNote}>
        {detail && (
          <div className="space-y-3 pb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Info label="Target" value={`${detail.target_type} · ${detail.target_name || detail.target_id || '—'}`} />
              <Info label="Reporter" value={detail.reporter_name || '—'} />
              <Info label="Reason" value={detail.reason || '—'} />
              <Info label="Priority" value={detail.priority || 'medium'} />
            </div>
            {detail.details && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.details')}</p>
                <p className="text-sm">{detail.details}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.resolution_note')}</p>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={t('admin.add_a_note_about_this')} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setStatus(detail, 'reviewing', 'Under Review')}>{t('admin.start_review')}</Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setStatus(detail, 'dismissed', 'Dismissed')}>{t('admin.dismiss')}</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}