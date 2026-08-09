import React, { useMemo, useState } from 'react';
import {
  Plus, Download, FileText, RefreshCw, SlidersHorizontal, LayoutTemplate,
  Copy, Archive, Trash2, XCircle, MoreHorizontal,
} from 'lucide-react';
import { useCommunicationData } from '@/hooks/useCommunicationData';
import {
  MCModuleHeader, MCActionToolbar, ToolbarSearch, ToolbarSelect, ToolbarButton,
} from '@/components/mission-control/ui';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  updateCampaign, duplicateCampaign, deleteCommunication, sendCampaign,
} from '@/lib/communication-actions';
import {
  computeOverview, campaignSearch, campaignFilter, campaignSort, exportCampaignsCsv, exportCampaignsPdf,
} from '@/lib/communication-metrics';
import { MODULES } from '@/lib/mission-control-modules';

import CommunicationOverview from './CommunicationOverview';
import CommunicationTabs from './CommunicationTabs';
import CampaignFilters from './CampaignFilters';
import CampaignTable from './CampaignTable';
import TemplateLibrary from './TemplateLibrary';
import CampaignComposer from './CampaignComposer';
import CampaignDetailSheet from './CampaignDetailSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' },
  { value: 'audience', label: 'Largest Audience' }, { value: 'sent', label: 'Last Sent' },
];

export default function CommunicationCenter({ module = MODULES.notifications }) {
  const { t } = useLocalization();
  const { campaigns, templates, loading, error, refresh } = useCommunicationData();
  const confirm = useAdminConfirm();
  const { toast } = useToast();

  const [tab, setTab] = useState('push');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState([]);
  const [showTemplates, setShowTemplates] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [detail, setDetail] = useState(null);

  const overview = useMemo(() => computeOverview(campaigns), [campaigns]);
  const counts = useMemo(() => {
    const c = { push: 0, in_app: 0, email: 0, announcement: 0 };
    campaigns.forEach((k) => { if (c[k.type] !== undefined) c[k.type]++; });
    return c;
  }, [campaigns]);

  const filtered = useMemo(() => {
    let r = campaigns.filter((c) => c.type === tab);
    r = campaignSearch(r, search);
    r = campaignFilter(r, filters);
    r = campaignSort(r, sort);
    return r;
  }, [campaigns, tab, search, filters, sort]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const openNew = () => { setEditing(null); setPrefill(null); setComposerOpen(true); };
  const openEdit = (item) => { setDetail(null); setPrefill(null); setEditing(item); setComposerOpen(true); };
  const useTemplate = (t) => { setEditing(null); setPrefill(t); setComposerOpen(true); };

  const handleAction = async (item, action) => {
    switch (action) {
      case 'send': {
        if (!await confirm({ title: 'Send campaign now?', description: `"${item.name}" will be delivered to its targeted audience immediately.`, confirmLabel: 'Send' })) return;
        try { const res = await sendCampaign(item.id); toast({ title: `Sent to ${res?.audience ?? 0} members` }); refresh(); } catch { toast({ title: 'Send failed', variant: 'destructive' }); }
        return;
      }
      case 'duplicate': { await duplicateCampaign(item.id); toast({ title: 'Campaign duplicated' }); refresh(); return; }
      case 'cancel': { await updateCampaign(item.id, { status: 'cancelled', scheduled_at: undefined }); toast({ title: 'Scheduled campaign cancelled' }); refresh(); return; }
      case 'archive': { await updateCampaign(item.id, { status: 'archived' }); toast({ title: 'Campaign archived' }); refresh(); return; }
      case 'restore': { await updateCampaign(item.id, { status: 'draft' }); toast({ title: 'Campaign restored' }); refresh(); return; }
      case 'delete': {
        if (!await confirm({ title: 'Delete draft?', description: `Permanently delete "${item.name}"? This cannot be undone.`, confirmLabel: 'Delete', variant: 'destructive' })) return;
        await deleteCommunication('Campaign', item.id); toast({ title: 'Draft deleted' }); setDetail(null); refresh();
        return;
      }
      default: return;
    }
  };

  const rowActions = (item) => (
    <button type="button" onClick={(e) => { e.stopPropagation(); setDetail(item); }} className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground" aria-label={t('mission.open_menu')}><MoreHorizontal className="w-4 h-4" /></button>
  );

  const bulkRun = async (ids, fn, label) => {
    if (!await confirm({ title: `${label} ${ids.length} campaigns?`, confirmLabel: label, variant: 'destructive' })) return;
    await Promise.all(ids.map(fn));
    setSelected([]); refresh();
    toast({ title: `${label} applied to ${ids.length} campaigns` });
  };
  const bulkActions = [
    { label: 'Duplicate', icon: Copy, onClick: () => bulkRun(selected, (id) => duplicateCampaign(id), 'Duplicate') },
    { label: 'Archive', icon: Archive, variant: 'destructive', onClick: () => bulkRun(selected, (id) => updateCampaign(id, { status: 'archived' }), 'Archive') },
    { label: 'Delete Drafts', icon: Trash2, variant: 'destructive', onClick: () => bulkRun(selected, (id) => deleteCommunication('Campaign', id), 'Delete') },
    { label: 'Cancel Scheduled', icon: XCircle, onClick: () => bulkRun(selected, (id) => updateCampaign(id, { status: 'cancelled', scheduled_at: undefined }), 'Cancel') },
    { label: 'Export', icon: Download, onClick: () => exportCampaignsCsv(filtered.filter((i) => selected.includes(i.id))) },
  ];

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader icon={module.icon} title={module.title} description={module.description} breadcrumb={[{ label: module.title }]} />

      <CommunicationOverview overview={overview} loading={loading} />

      <div className="flex justify-end mb-2">
        <Button size="sm" onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> {t('mission.new_campaign')}</Button>
      </div>

      <CommunicationTabs active={tab} onChange={(t) => { setTab(t); setSelected([]); }} counts={counts} />

      <MCActionToolbar>
        <ToolbarSearch value={search} onChange={setSearch} placeholder={t('mission.search_campaigns_by_name_title')} />
        <ToolbarSelect value={sort} onChange={setSort} options={SORT_OPTIONS} ariaLabel="Sort" />
        <ToolbarButton icon={SlidersHorizontal} label={`Filters${activeFilterCount ? ` ${activeFilterCount}` : ''}`} active={showFilters || activeFilterCount > 0} onClick={() => setShowFilters((s) => !s)} />
        <ToolbarButton icon={LayoutTemplate} label="Templates" active={showTemplates} onClick={() => setShowTemplates((s) => !s)} />
        <ToolbarButton icon={Download} label="CSV" onClick={() => exportCampaignsCsv(filtered)} />
        <ToolbarButton icon={FileText} label="PDF" onClick={() => exportCampaignsPdf(filtered)} />
        <ToolbarButton icon={RefreshCw} label="Refresh" onClick={refresh} />
      </MCActionToolbar>

      {showFilters && <CampaignFilters filters={filters} onChange={setFilters} onClear={() => setFilters({})} activeCount={activeFilterCount} />}

      {showTemplates && <TemplateLibrary templates={templates} onUse={useTemplate} onSaved={refresh} />}

      <CampaignTable
        rows={filtered} loading={loading} error={error}
        selectedIds={selected} onSelectionChange={setSelected}
        onRowClick={setDetail} rowActions={rowActions} bulkActions={bulkActions}
      />

      <CampaignComposer
        open={composerOpen} onOpenChange={setComposerOpen} onSaved={refresh}
        editing={editing} prefill={prefill} defaultType={tab}
      />
      <CampaignDetailSheet
        open={!!detail} onOpenChange={(o) => !o && setDetail(null)}
        item={detail} onAction={handleAction} onEdit={openEdit}
      />
    </div>
  );
}