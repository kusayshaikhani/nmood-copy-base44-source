import React from 'react';
import { MoreHorizontal, Star, EyeOff, Flag, ImageOff } from 'lucide-react';
import { MCDataGrid } from '@/components/mission-control/ui';
import { STATUS_BADGE } from '@/lib/community-metrics';
import SmartImage from '@/components/shared/SmartImage';

function Cover({ src, alt }) {
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
      {src ? <SmartImage src={src} alt={alt} rounded="rounded-lg" blur={false} /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageOff className="w-4 h-4" /></div>}
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (STATUS_BADGE[status] || 'bg-muted text-muted-foreground')}>{status}</span>;
}

function RowIndicators({ item }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {item.is_featured && <Star className="w-3 h-3 text-warning fill-warning" />}
      {item.is_hidden && <EyeOff className="w-3 h-3" />}
      <Flag className="w-3 h-3" />
      <span className="text-xs">{item._reportCount || 0}</span>
    </div>
  );
}

export default function CommunityTable({
  type, rows, loading, error, reportCounts,
  selectedIds, onSelectionChange, sort, onSort,
  onRowClick, rowActions, bulkActions,
}) {
  const titleKey = type === 'experience' ? 'title' : 'name';
  const creatorLabel = type === 'experience' ? 'Host' : 'Owner';

  const columns = [
    {
      key: titleKey, label: type === 'experience' ? 'Experience' : 'Circle',
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <Cover src={r.cover_image || r.cover_photo} alt={r[titleKey]} />
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[200px]">{r[titleKey]}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'host_name', label: creatorLabel, render: (r) => <span className="text-sm truncate">{r.host_name || '—'}</span> },
    { key: 'location', label: 'Location', render: (r) => <span className="text-sm text-muted-foreground truncate max-w-[120px]">{r.location || '—'}</span> },
    ...(type === 'experience'
      ? [{ key: 'date', label: 'Date', render: (r) => <span className="text-sm text-muted-foreground">{r.date || '—'}</span> },
         { key: 'spots_filled', label: 'Participants', render: (r) => <span className="text-sm">{r.spots_filled || 0}/{r.max_participants || '∞'}</span> }]
      : [{ key: 'member_count', label: 'Members', render: (r) => <span className="text-sm">{r.member_count || 0}</span> }]),
    { key: 'visibility', label: 'Visibility', render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.visibility || 'public'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: '_reports', label: 'Reports', render: (r) => <RowIndicators item={r} /> },
  ];

  const mobileCardRender = (r) => (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-3">
        <Cover src={r.cover_image || r.cover_photo} alt={r[titleKey]} />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{r[titleKey]}</p>
          <p className="text-xs text-muted-foreground truncate">{r.host_name || '—'} · {r.location || '—'}</p>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <RowIndicators item={r} />
        <span className="text-xs text-muted-foreground">{type === 'experience' ? `${r.spots_filled || 0} participants` : `${r.member_count || 0} members`}</span>
      </div>
    </div>
  );

  return (
    <MCDataGrid
      columns={columns}
      rows={rows}
      rowKey="id"
      loading={loading}
      error={error}
      errorSlot={<div className="text-sm text-destructive p-6">Failed to load {type}s.</div>}
      emptySlot={<div className="text-sm text-muted-foreground py-10 text-center">No {type}s match your filters.</div>}
      selectable
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      sort={sort}
      onSort={onSort}
      onRowClick={onRowClick}
      rowActions={rowActions}
      mobileCardRender={mobileCardRender}
      bulkActions={bulkActions}
    />
  );
}