import React, { useMemo, useState } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  SlidersHorizontal, Download, FileText, RefreshCw, Star, EyeOff, Archive,
  RotateCcw, MoreHorizontal, Calendar, UsersRound, Flag,
} from 'lucide-react';
import moment from 'moment';
import { useCommunityData } from '@/hooks/useCommunityData';
import { MCModuleHeader, MCActionToolbar, ToolbarSearch, ToolbarSelect, ToolbarButton } from '@/components/mission-control/ui';
import MCActivityTimeline from '@/components/mission-control/ui/MCActivityTimeline';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { useToast } from '@/components/ui/use-toast';
import { updateExperience, updateCircle } from '@/lib/admin-actions';
import { useHardDelete } from '@/components/admin/HardDeleteProvider';
import {
  computeOverview, reportCountMap, applySearch, applyFilters, applySort,
  filterOptions, archivePatch, restorePatch,
  exportCommunityCsv, exportCommunityPdf, buildActivityTimeline,
} from '@/lib/community-metrics';

import CommunityOverview from './CommunityOverview';
import CommunityFilters from './CommunityFilters';
import CommunityTable from './CommunityTable';
import CommunityDetailSheet from './CommunityDetailSheet';
import CommunityEditSheet from './CommunityEditSheet';
import CommunityTransferSheet from './CommunityTransferSheet';
import FeaturedManagement from './FeaturedManagement';

const SORT_OPTIONS_EXP = [
  { value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' },
  { value: 'participants', label: 'Most Participants' }, { value: 'reports', label: 'Most Reports' },
  { value: 'rated', label: 'Highest Rated' }, { value: 'updated', label: 'Recently Updated' },
];
const SORT_OPTIONS_CIRCLE = [
  { value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' },
  { value: 'members', label: 'Most Members' }, { value: 'reports', label: 'Most Reports' },
  { value: 'rated', label: 'Highest Rated' }, { value: 'updated', label: 'Recently Updated' },
];

const ACTIVITY_ICON = {
  experience: { created: Calendar, archived: Archive, featured: Star, reported: Flag },
  circle: { created: UsersRound, archived: Archive, featured: Star, reported: Flag },
};
const ACTION_LABEL = { created: 'Created', archived: 'Archived', featured: 'Featured', reported: 'Reported' };

/**
 * MC-UX-001 — Unified Community Management Center.
 * One workspace for Experiences + Circles with shared overview, search,
 * filters (incl. Content Type), bulk actions, and a combined activity timeline.
 */
export default function CommunityCenter({ defaultTab = 'experience', module }) {
  const { t } = useLocalization();
  const { experiences, circles, reports, loading, error, refresh } = useCommunityData();
  const confirm = useAdminConfirm();
  const { requestHardDelete } = useHardDelete();
  const { toast } = useToast();

  const [tab, setTab] = useState(defaultTab === 'circle' ? 'circle' : 'experience');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [transferItem, setTransferItem] = useState(null);

  // Content Type filter overrides the active tab; "All" reverts to the tab.
  const type = filters.contentType || tab;

  const overview = useMemo(() => computeOverview(experiences, circles, reports), [experiences, circles, reports]);
  const reportCounts = useMemo(() => ({
    experience: reportCountMap(reports, 'experience'),
    circle: reportCountMap(reports, 'circle'),
  }), [reports]);

  const source = type === 'experience' ? experiences : circles;
  const annotated = useMemo(() => source.map((i) => ({ ...i, _reportCount: (reportCounts[type][i.id] || 0), _allReports: reports })), [source, reportCounts, type, reports]);
  const filtered = useMemo(() => {
    let r = applySearch(annotated, type, search);
    r = applyFilters(r, type, filters, reports);
    r = applySort(r, type, sort, reportCounts[type]);
    return r;
  }, [annotated, type, search, filters, reports, sort, reportCounts]);

  const options = useMemo(() => filterOptions(source, type), [source, type]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const activity = useMemo(() => {
    const raw = buildActivityTimeline(experiences, circles, reports, 15);
    return raw.map((a) => {
      const Icon = (ACTIVITY_ICON[a.kind] && ACTIVITY_ICON[a.kind][a.action]) || Calendar;
      return {
        id: a.id,
        icon: Icon,
        title: `${ACTION_LABEL[a.action] || a.action}: ${a.name || (a.kind === 'experience' ? 'Experience' : 'Circle')}`,
        subtitle: a.kind === 'experience' ? 'Experience' : 'Circle',
        time: a.ts ? moment(a.ts).fromNow() : '',
      };
    });
  }, [experiences, circles, reports]);

  const apply = async (item, patch) => {
    if (type === 'experience') await updateExperience(item.id, patch);
    else await updateCircle(item.id, patch);
    refresh();
  };

  const handleAction = async (item, action) => {
    const name = type === 'experience' ? item.title : item.name;
    const exec = async (patch, msg) => { await apply(item, patch); toast({ title: msg }); };
    switch (action) {
      case 'feature': return exec({ is_featured: !item.is_featured }, `${item.is_featured ? 'Unfeatured' : 'Featured'}: ${name}`);
      case 'hide': return exec({ is_hidden: !item.is_hidden }, `${item.is_hidden ? 'Unhidden' : 'Hidden'}: ${name}`);
      case 'archive': {
        if (!await confirm({ title: 'Archive?', description: `Archive "${name}"? It will be hidden from members but can be restored.`, confirmLabel: 'Archive', variant: 'destructive' })) return;
        return exec(archivePatch(type), `Archived: ${name}`);
      }
      case 'restore': return exec(restorePatch(type), `Restored: ${name}`);
      case 'reopen': return exec({ status: 'active' }, `Reopened: ${name}`);
      case 'cancel': {
        if (!await confirm({ title: 'Cancel experience?', description: `Cancel "${name}"? Members will see it as cancelled.`, confirmLabel: 'Cancel', variant: 'destructive' })) return;
        return exec({ status: 'cancelled' }, `Cancelled: ${name}`);
      }
      case 'hardDelete': {
        const res = await requestHardDelete({ entity: type === 'experience' ? 'Experience' : 'Circle', id: item.id, label: name });
        if (res?.ok) { setDetail(null); refresh(); }
        return;
      }
      case 'transfer': return setTransferItem(item);
      case 'edit': return setEditItem(item);
      case 'view': return setDetail(item);
      default: return;
    }
  };

  const rowActions = (item) => (
    <div className="relative">
      <button type="button" onClick={(e) => { e.stopPropagation(); setDetail(item); }} className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground" aria-label={t('mission.open_menu')}><MoreHorizontal className="w-4 h-4" /></button>
    </div>
  );

  const bulkRun = async (ids, patch, label) => {
    if (!await confirm({ title: `${label} ${ids.length} items?`, description: `This will apply "${label.toLowerCase()}" to ${ids.length} ${type}s.`, confirmLabel: label, variant: 'destructive' })) return;
    await Promise.all(ids.map((id) => (type === 'experience' ? updateExperience(id, patch) : updateCircle(id, patch))));
    setSelected([]);
    refresh();
    toast({ title: `${label} applied to ${ids.length} ${type}s` });
  };

  const bulkActions = [
    { label: 'Feature', icon: Star, onClick: () => bulkRun(selected, { is_featured: true }, 'Feature') },
    { label: 'Unfeature', icon: Star, onClick: () => bulkRun(selected, { is_featured: false }, 'Unfeature') },
    { label: 'Hide', icon: EyeOff, onClick: () => bulkRun(selected, { is_hidden: true }, 'Hide') },
    { label: 'Restore', icon: RotateCcw, onClick: () => bulkRun(selected, restorePatch(type), 'Restore') },
    { label: 'Archive', icon: Archive, variant: 'destructive', onClick: () => bulkRun(selected, archivePatch(type), 'Archive') },
    { label: 'Export', icon: Download, onClick: () => { const items = filtered.filter((i) => selected.includes(i.id)); exportCommunityCsv(items, type); } },
  ];

  const sortOpts = type === 'experience' ? SORT_OPTIONS_EXP : SORT_OPTIONS_CIRCLE;

  // Tabs are the primary navigation; selecting one clears any Content Type override.
  const switchTab = (t) => { setTab(t); setFilters((f) => ({ ...f, contentType: undefined })); setSelected([]); };
  const setContentType = (v) => setFilters((f) => ({ ...f, contentType: v }));

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader icon={module.icon} title={module.title} description={module.description} breadcrumb={[{ label: module.title }]} />

      <div className="mb-4">
        <CommunityOverview overview={overview} loading={loading} />
      </div>

      <FeaturedManagement experiences={experiences} circles={circles} onAction={(item, t, action) => { if (action === 'unfeature') { (t === 'experience' ? updateExperience(item.id, { is_featured: false }) : updateCircle(item.id, { is_featured: false })).then(() => { refresh(); toast({ title: 'Unfeatured' }); }); } }} />

      {/* Tabs — primary navigation inside the workspace */}
      <div className="flex gap-2 my-4">
        <button onClick={() => switchTab('experience')} className={'px-4 py-2 rounded-lg text-sm font-medium border transition-default ' + (tab === 'experience' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50')}>{t('admin.experiences')}</button>
        <button onClick={() => switchTab('circle')} className={'px-4 py-2 rounded-lg text-sm font-medium border transition-default ' + (tab === 'circle' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50')}>{t('admin.circles')}</button>
      </div>

      <MCActionToolbar>
        <ToolbarSearch value={search} onChange={setSearch} placeholder={`Search ${type}s by title, creator, id, location, category…`} />
        <ToolbarSelect value={sort} onChange={setSort} options={sortOpts} ariaLabel="Sort" />
        <ToolbarButton icon={SlidersHorizontal} label={`Filters${activeFilterCount ? ` ${activeFilterCount}` : ''}`} active={showFilters || activeFilterCount > 0} onClick={() => setShowFilters((s) => !s)} />
        <ToolbarButton icon={Download} label="CSV" onClick={() => exportCommunityCsv(filtered, type)} />
        <ToolbarButton icon={FileText} label="PDF" onClick={() => exportCommunityPdf(filtered, type)} />
        <ToolbarButton icon={RefreshCw} label="Refresh" onClick={refresh} />
      </MCActionToolbar>

      {showFilters && <CommunityFilters type={type} filters={filters} onChange={setFilters} onClear={() => setFilters({})} options={options} activeCount={activeFilterCount} contentType={filters.contentType} onContentTypeChange={setContentType} />}

      <CommunityTable
        type={type}
        rows={filtered}
        loading={loading}
        error={error}
        reportCounts={reportCounts[type]}
        selectedIds={selected}
        onSelectionChange={setSelected}
        sort={{ key: sort, dir: 'desc' }}
        onSort={(k) => setSort(k)}
        onRowClick={(r) => setDetail(r)}
        rowActions={rowActions}
        bulkActions={bulkActions}
      />

      <MCActivityTimeline title={t('mission.recent_activity')} items={activity} loading={loading} emptyLabel="No recent experience or circle activity." />

      <CommunityDetailSheet
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        item={detail}
        type={type}
        onEdit={(item) => { setDetail(null); setEditItem(item); }}
        onAction={(item, action) => handleAction(item, action)}
      />
      <CommunityEditSheet open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)} item={editItem} type={type} onSaved={refresh} />
      <CommunityTransferSheet open={!!transferItem} onOpenChange={(o) => !o && setTransferItem(null)} item={transferItem} type={type} onSaved={refresh} />
    </div>
  );
}