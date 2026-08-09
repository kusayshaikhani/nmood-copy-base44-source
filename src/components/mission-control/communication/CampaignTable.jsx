import React from 'react';
import { MCDataGrid } from '@/components/mission-control/ui';
import { STATUS_BADGE, PRIORITY_BADGE, CHANNEL_LABEL, APPROVAL_LABEL } from '@/lib/communication-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Badge({ cls, children }) {
  return <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + cls}>{children}</span>;
}

export default function CampaignTable({ rows, loading, error, selectedIds, onSelectionChange, onRowClick, rowActions, bulkActions }) {
  const { t } = useLocalization();
  const columns = [
    { key: 'name', label: 'Campaign', render: (r) => (
      <div className="min-w-0">
        <p className="font-medium truncate max-w-[200px]">{r.name}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.title || '—'}</p>
      </div>
    ) },
    { key: 'type', label: 'Type', render: (r) => <Badge cls="bg-muted text-muted-foreground">{CHANNEL_LABEL[r.type] || r.type}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge cls={STATUS_BADGE[r.status] || 'bg-muted'}>{r.status}</Badge> },
    { key: 'approval_state', label: 'Approval', render: (r) => <span className="text-xs text-muted-foreground">{APPROVAL_LABEL[r.approval_state] || r.approval_state}</span> },
    { key: 'priority', label: 'Priority', render: (r) => <Badge cls={PRIORITY_BADGE[r.priority] || 'bg-muted'}>{r.priority}</Badge> },
    { key: 'audience', label: 'Audience', render: (r) => <span className="text-sm">{r.actual_audience || r.estimated_audience || 0}</span> },
    { key: 'sent_by', label: 'Sent By', render: (r) => <span className="text-sm text-muted-foreground truncate max-w-[120px]">{r.sent_by || '—'}</span> },
    { key: 'sent_at', label: 'Sent', render: (r) => <span className="text-sm text-muted-foreground">{r.sent_at ? new Date(r.sent_at).toLocaleDateString() : '—'}</span> },
    { key: 'delivery', label: 'Delivery', render: (r) => {
      const ds = r.delivery_stats || {}; const aud = r.actual_audience || 0; const del = ds.delivered || 0;
      return <span className="text-sm">{aud ? Math.round((del / aud) * 100) : 0}%</span>;
    } },
    { key: 'open_rate', label: 'Open', render: (r) => {
      const ds = r.delivery_stats || {}; const del = ds.delivered || 0;
      return <span className="text-sm">{del ? Math.round((ds.opened || 0) / del * 100) : 0}%</span>;
    } },
  ];

  const mobileCardRender = (r) => (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="font-medium truncate">{r.name}</p>
        <Badge cls={STATUS_BADGE[r.status] || 'bg-muted'}>{r.status}</Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{CHANNEL_LABEL[r.type]} · {r.actual_audience || r.estimated_audience || 0} recipients</p>
    </div>
  );

  return (
    <MCDataGrid
      columns={columns} rows={rows} rowKey="id" loading={loading} error={error}
      errorSlot={<div className="text-sm text-destructive p-6">{t('mission.failed_to_load_campaigns')}</div>}
      emptySlot={<div className="text-sm text-muted-foreground py-10 text-center">{t('mission.no_campaigns_match_your_filters')}</div>}
      selectable selectedIds={selectedIds} onSelectionChange={onSelectionChange}
      onRowClick={onRowClick} rowActions={rowActions} mobileCardRender={mobileCardRender} bulkActions={bulkActions}
    />
  );
}