import React, { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  Flag, AlertTriangle, Gavel, Ban, ShieldOff, CheckCircle2, Clock, Brain,
  SlidersHorizontal, Download, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { useTrustSafetyData } from '@/hooks/useTrustSafetyData';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { MODULES } from '@/lib/mission-control-modules';
import {
  MCPageShell, MCModuleHeader, MCKpiCard, MCKpiGrid,
  MCActionToolbar, ToolbarSearch, ToolbarSelect, ToolbarButton,
  MCDataGrid, MCActivityTimeline, MCEmptyState, MCErrorState,
} from '@/components/mission-control/ui';
import MCReportSheet from '@/components/mission-control/trust-safety/MCReportSheet';
import MCAppealSheet from '@/components/mission-control/trust-safety/MCAppealSheet';
import MCTrustFilters from '@/components/mission-control/trust-safety/MCTrustFilters';
import PhotoVerificationQueue from '@/components/mission-control/trust-safety/PhotoVerificationQueue';
import {
  ReportStatusBadge, PriorityBadge, ReportTypeBadge, AppealStatusBadge,
} from '@/components/mission-control/trust-safety/MCTrustBadges';
import {
  reportShortId, ticketShortId, formatDate, formatRelative, reporterCountry,
  computeKpis, applyFiltersAndSearch, applySortReports, applySortAppeals,
  countActiveFilters, REPORT_TYPE_LABELS,
} from '@/lib/trust-safety-directory';

const PAGE_SIZE = 10;

const REPORT_SORT_OPTIONS = [
  { value: 'created_date:desc', label: 'Newest first' },
  { value: 'created_date:asc', label: 'Oldest first' },
  { value: 'priority:desc', label: 'Priority (high→low)' },
  { value: 'priority:asc', label: 'Priority (low→high)' },
  { value: 'target_name:asc', label: 'Reported A–Z' },
];
const APPEAL_SORT_OPTIONS = [
  { value: 'created_date:desc', label: 'Newest first' },
  { value: 'created_date:asc', label: 'Oldest first' },
];

const parseSort = (value) => {
  const [key, dir] = (value || 'created_date:desc').split(':');
  return { key, dir };
};

export default function MCTrustSafety() {
  const { t } = useLocalization();
  const { reports, appeals, members, memberByUserId, memberById, loading, error, refresh } = useTrustSafetyData();
  const [tab, setTab] = useState('queue');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ key: 'created_date', dir: 'desc' });
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);

  const kpis = useMemo(() => computeKpis(reports, appeals, members), [reports, appeals, members]);

  const filteredReports = useMemo(() => applyFiltersAndSearch(reports, search, filters, memberByUserId), [reports, search, filters, memberByUserId]);
  const sortedReports = useMemo(() => applySortReports(filteredReports, sort), [filteredReports, sort]);
  const filteredAppeals = useMemo(() => {
    if (!search) return appeals;
    const q = search.toLowerCase();
    return appeals.filter((a) => [a.id, a.subject, a.member_name, a.member_email, a.message].some((v) => v && String(v).toLowerCase().includes(q)));
  }, [appeals, search]);
  const sortedAppeals = useMemo(() => applySortAppeals(filteredAppeals, sort), [filteredAppeals, sort]);

  const activeData = tab === 'queue' ? sortedReports : sortedAppeals;
  const total = activeData.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = activeData.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => { if (page > pageCount - 1) setPage(0); }, [pageCount]);
  useEffect(() => { setPage(0); }, [tab, search, filters]);

  const activeFilterCount = countActiveFilters(filters);

  const filterOptions = useMemo(() => {
    const types = Object.keys(REPORT_TYPE_LABELS).map((k) => ({ value: k, label: REPORT_TYPE_LABELS[k] }));
    const countries = [...new Set(reports.map((r) => reporterCountry(r, memberByUserId)).filter((c) => c && c !== '—'))].sort()
      .map((c) => ({ value: c, label: c }));
    return { types, countries };
  }, [reports, memberByUserId]);

  const activity = useMemo(() => {
    return [...reports]
      .sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0))
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        icon: Flag,
        title: `${reportShortId(r)} · ${r.reason || r.target_type || 'Report'}`,
        subtitle: r.target_name || r.reporter_name || '—',
        time: formatRelative(r.updated_date),
      }));
  }, [reports]);

  const reportColumns = [
    { key: 'id', label: 'Report ID', render: (r) => <span className="font-mono text-muted-foreground">{reportShortId(r)}</span> },
    { key: 'target_type', label: 'Type', render: (r) => <ReportTypeBadge type={r.target_type} /> },
    { key: 'reason', label: 'Category', render: (r) => <span className="truncate block max-w-[160px]">{r.reason || '—'}</span> },
    { key: 'priority', label: 'Priority', sortable: true, render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: 'status', label: 'Status', render: (r) => <ReportStatusBadge status={r.status} /> },
    { key: 'created_date', label: 'Submitted', sortable: true, render: (r) => <span className="text-muted-foreground">{formatDate(r.created_date)}</span> },
    { key: 'reporter_name', label: 'Reporter', render: (r) => <span className="truncate block max-w-[140px]">{r.reporter_name || '—'}</span> },
    { key: 'target_name', label: 'Reported', sortable: true, render: (r) => <span className="truncate block max-w-[140px]">{r.target_name || '—'}</span> },
    { key: 'assigned', label: 'Assigned', render: () => <span className="text-muted-foreground">{t('mission.unassigned')}</span> },
  ];

  const appealColumns = [
    { key: 'id', label: 'Appeal ID', render: (a) => <span className="font-mono text-muted-foreground">{ticketShortId(a)}</span> },
    { key: 'subject', label: 'Subject', render: (a) => <span className="truncate block max-w-[200px]">{a.subject || '—'}</span> },
    { key: 'member_name', label: 'Member', render: (a) => a.member_name || '—' },
    { key: 'status', label: 'Status', render: (a) => <AppealStatusBadge status={a.status} /> },
    { key: 'created_date', label: 'Submitted', sortable: true, render: (a) => <span className="text-muted-foreground">{formatDate(a.created_date)}</span> },
    { key: 'assigned_to', label: 'Reviewer', render: (a) => <span className="text-muted-foreground">{a.assigned_to || 'Unassigned'}</span> },
  ];

  const exportCsv = () => {
    const rows = sortedReports;
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['Report ID', 'Type', 'Category', 'Priority', 'Status', 'Submitted', 'Reporter', 'Reported'];
    const lines = [headers.join(',')];
    rows.forEach((r) => {
      lines.push([esc(reportShortId(r)), esc(r.target_type), esc(r.reason), esc(r.priority), esc(r.status), esc(formatDate(r.created_date)), esc(r.reporter_name), esc(r.target_name)].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nmood-reports-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast({ title: `Exported ${rows.length} reports` });
  };

  return (
    <MCPageShell
      header={
        <MCModuleHeader
          icon={MODULES['trust-safety'].icon}
          title={MODULES['trust-safety'].title}
          description={MODULES['trust-safety'].description}
          breadcrumb={[{ label: MODULES['trust-safety'].title }]}
        />
      }
      kpis={
        <MCKpiGrid>
          <MCKpiCard icon={Flag} label="Total Open Reports" value={kpis.openReports} loading={loading} color="primary" />
          <MCKpiCard icon={AlertTriangle} label="High Priority" value={kpis.highPriority} loading={loading} color="destructive" />
          <MCKpiCard icon={Gavel} label="Pending Appeals" value={kpis.pendingAppeals} loading={loading} color="warning" />
          <MCKpiCard icon={ShieldOff} label="Active Suspensions" value={kpis.activeSuspensions} loading={loading} color="warning" />
          <MCKpiCard icon={Ban} label="Active Bans" value={kpis.activeBans} loading={loading} color="destructive" />
          <MCKpiCard icon={CheckCircle2} label="Resolved Today" value={kpis.resolvedToday} loading={loading} color="success" />
          <MCKpiCard icon={Clock} label="Avg Resolution Time" value={kpis.avgResolution} loading={loading} color="info" />
          <MCKpiCard icon={Brain} label="AI Flagged Cases" value={kpis.aiFlagged} loading={loading} color="primary" sublabel="Coming soon" />
        </MCKpiGrid>
      }
      toolbar={
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-3">
            {[
              { id: 'queue', label: 'Moderation Queue', count: sortedReports.length },
              { id: 'appeals', label: 'Appeals', count: sortedAppeals.length },
              { id: 'photo', label: 'Photo Verification' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={'px-3 h-9 rounded-lg text-sm font-medium border transition-default ' +
                  (tab === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50')}
              >
                {t.label} {t.count != null && <span className="opacity-70">({t.count})</span>}
              </button>
            ))}
          </div>

          <MCActionToolbar>
            <ToolbarSearch value={search} onChange={setSearch} placeholder={tab === 'queue' ? 'Search by report ID, category, member…' : 'Search appeals…'} />
            <ToolbarSelect
              value={`${sort.key}:${sort.dir}`}
              onChange={(v) => setSort(parseSort(v))}
              options={tab === 'queue' ? REPORT_SORT_OPTIONS : APPEAL_SORT_OPTIONS}
              ariaLabel="Sort"
              className="sm:w-44"
            />
            {tab === 'queue' && (
              <ToolbarButton icon={SlidersHorizontal} label={`Filters${activeFilterCount ? ` ${activeFilterCount}` : ''}`} active={showFilters || activeFilterCount > 0} onClick={() => setShowFilters((s) => !s)} />
            )}
            {tab === 'queue' && <ToolbarButton icon={Download} label="Export" onClick={exportCsv} />}
            <ToolbarButton icon={RefreshCw} label="Refresh" onClick={refresh} />
          </MCActionToolbar>

          {tab === 'queue' && showFilters && (
            <MCTrustFilters
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters({})}
              options={filterOptions}
            />
          )}
        </>
      }
      timeline={<MCActivityTimeline title={t('mission.recent_moderation_activity')} items={activity} loading={loading} emptyLabel="No recent moderation activity." />}
    >
      {tab === 'queue' ? (
        <MCDataGrid
          columns={reportColumns}
          rows={pageItems}
          rowKey="id"
          loading={loading}
          error={!!error && !loading}
          errorSlot={<MCErrorState title={t('mission.couldnt_load_reports')} description="We couldn't fetch the moderation queue right now." onRetry={refresh} />}
          emptySlot={<MCEmptyState icon={Flag} title={t('mission.no_reports_found')} description="No reports match your search or filters." action={(search || activeFilterCount > 0) ? <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilters({}); }}>{t('mission.clear_filters')}</Button> : null} />}
          sort={sort}
          onSort={(col) => setSort((s) => ({ key: col, dir: s.key === col && s.dir === 'asc' ? 'desc' : 'asc' }))}
          pagination={{ page: safePage, pageSize: PAGE_SIZE, total, onPageChange: (p) => setPage(Math.max(0, p)) }}
          onRowClick={(r) => setSelectedReport(r)}
          mobileCardRender={(r) => (
            <div className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{reportShortId(r)}</span>
                <ReportStatusBadge status={r.status} />
              </div>
              <p className="font-medium mt-1 truncate">{r.reason || r.target_type}</p>
              <p className="text-xs text-muted-foreground truncate">{r.target_name || '—'}</p>
              <div className="flex items-center gap-2 mt-2">
                <ReportTypeBadge type={r.target_type} />
                <PriorityBadge priority={r.priority} />
                <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(r.created_date)}</span>
              </div>
            </div>
          )}
        />
      ) : tab === 'photo' ? (
        <PhotoVerificationQueue />
      ) : (
        <MCDataGrid
          columns={appealColumns}
          rows={pageItems}
          rowKey="id"
          loading={loading}
          error={!!error && !loading}
          errorSlot={<MCErrorState title={t('mission.couldnt_load_appeals')} description="We couldn't fetch the appeals workspace right now." onRetry={refresh} />}
          emptySlot={<MCEmptyState icon={Gavel} title={t('mission.no_appeals_pending')} description="There are no appeals matching your search." />}
          sort={sort}
          onSort={(col) => setSort((s) => ({ key: col, dir: s.key === col && s.dir === 'asc' ? 'desc' : 'asc' }))}
          pagination={{ page: safePage, pageSize: PAGE_SIZE, total, onPageChange: (p) => setPage(Math.max(0, p)) }}
          onRowClick={(a) => setSelectedAppeal(a)}
          mobileCardRender={(a) => (
            <div className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{ticketShortId(a)}</span>
                <AppealStatusBadge status={a.status} />
              </div>
              <p className="font-medium mt-1 truncate">{a.subject || '—'}</p>
              <p className="text-xs text-muted-foreground truncate">{a.member_name || '—'}</p>
              <span className="text-[10px] text-muted-foreground block mt-1">{formatDate(a.created_date)}</span>
            </div>
          )}
        />
      )}

      <MCReportSheet
        report={selectedReport}
        reports={reports}
        memberByUserId={memberByUserId}
        memberById={memberById}
        open={!!selectedReport}
        onOpenChange={(o) => !o && setSelectedReport(null)}
        onActioned={refresh}
      />
      <MCAppealSheet
        appeal={selectedAppeal}
        open={!!selectedAppeal}
        onOpenChange={(o) => !o && setSelectedAppeal(null)}
        onActioned={refresh}
      />
    </MCPageShell>
  );
}