import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Square, CheckSquare, X,
} from 'lucide-react';

function BulkButton({ label, icon: Icon, onClick, variant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={'h-8 px-3 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition-default ' +
        (variant === 'destructive' ? 'border-destructive/30 text-destructive hover:bg-destructive/10' : 'border-border text-foreground hover:bg-muted/50')}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

/**
 * FM-004 — Responsive data grid: professional desktop table, adaptive mobile
 * cards, multi-select with a bulk-action bar, sortable headers, and pagination.
 * Reusable across every Mission Control module.
 */
export default function MCDataGrid({
  columns, rows = [], rowKey = 'id',
  loading, error, errorSlot, emptySlot,
  selectable = false, selectedIds = [], onSelectionChange,
  sort, onSort,
  pagination,
  onRowClick, rowActions, mobileCardRender,
  bulkActions = [],
}) {
  const { t } = useLocalization();
  if (error && !loading) {
    return <div className="rounded-xl border bg-card p-8">{errorSlot}</div>;
  }

  const ids = rows.map((r) => r[rowKey]);
  const allOnPageSelected = rows.length > 0 && ids.every((id) => selectedIds.includes(id));
  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allOnPageSelected) onSelectionChange(selectedIds.filter((id) => !ids.includes(id)));
    else onSelectionChange(Array.from(new Set([...selectedIds, ...ids])));
  };
  const toggleOne = (id) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const showBulk = selectable && selectedIds.length > 0 && bulkActions.length > 0;
  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    <div>
      {showBulk && (
        <div className="flex items-center gap-2 mb-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <div className="flex flex-wrap gap-2 ml-auto">
            {bulkActions.map((a) => <BulkButton key={a.label} {...a} />)}
          </div>
          <button type="button" onClick={() => onSelectionChange([])} className="p-1 rounded hover:bg-muted/60" aria-label={t('mission.clear_selection')}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                {selectable && (
                  <th className="px-4 py-3 w-10">
                    <button type="button" onClick={toggleAll} aria-label={t('mission.select_all_on_page')} className="text-muted-foreground hover:text-foreground">
                      {allOnPageSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap uppercase tracking-wide">
                    {col.sortable && onSort ? (
                      <button type="button" onClick={() => onSort(col.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                        {col.label}
                        {sort && sort.key === col.key
                          ? (sort.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                          : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
                      </button>
                    ) : col.label}
                  </th>
                ))}
                {rowActions && <th className="px-4 py-3 w-10" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {selectable && <td className="px-4 py-3"><div className="w-4 h-4 shimmer rounded" /></td>}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 shimmer rounded" style={{ width: 60 + ((i + (col.key.length || 1)) % 4) * 30 }} />
                      </td>
                    ))}
                    {rowActions && <td />}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={colSpan} className="px-4">{emptySlot}</td></tr>
              ) : rows.map((r) => {
                const selected = selectedIds.includes(r[rowKey]);
                return (
                  <tr
                    key={r[rowKey]}
                    className={'border-b last:border-0 hover:bg-muted/20 transition-default ' + (onRowClick ? 'cursor-pointer ' : '') + (selected ? 'bg-primary/5 ' : '')}
                    onClick={() => onRowClick?.(r)}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => toggleOne(r[rowKey])} aria-label={t('mission.select_row')} className="text-muted-foreground hover:text-foreground">
                          {selected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={'px-4 py-3 text-sm ' + (col.className || '')}>{col.render ? col.render(r) : r[col.key]}</td>
                    ))}
                    {rowActions && <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>{rowActions(r)}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-3">
              <div className="h-4 w-1/2 shimmer rounded mb-2" />
              <div className="h-3 w-2/3 shimmer rounded" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="rounded-xl border bg-card p-6">{emptySlot}</div>
        ) : rows.map((r) => (
          <div key={r[rowKey]} onClick={() => onRowClick?.(r)} className="active:scale-[0.99] transition-default">
            {mobileCardRender
              ? mobileCardRender(r, { selected: selectedIds.includes(r[rowKey]), toggle: () => toggleOne(r[rowKey]) })
              : <div className="rounded-xl border bg-card p-3 text-sm">{columns[0]?.render?.(r)}</div>}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Showing {pagination.page * pagination.pageSize + 1}–{Math.min((pagination.page + 1) * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => pagination.onPageChange(pagination.page - 1)} disabled={pagination.page === 0} className="w-8 h-8 rounded-lg border inline-flex items-center justify-center disabled:opacity-40 hover:bg-muted/50" aria-label={t('mission.previous_page')}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground">Page {pagination.page + 1} of {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}</span>
            <button type="button" onClick={() => pagination.onPageChange(pagination.page + 1)} disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize) - 1} className="w-8 h-8 rounded-lg border inline-flex items-center justify-center disabled:opacity-40 hover:bg-muted/50" aria-label={t('mission.next_page')}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}