import React, { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  Users, Wifi, Crown, Ban, SlidersHorizontal, Download, RefreshCw,
  CheckSquare, Square, Trash2, User as UserIcon,
} from 'lucide-react';
import { useMembersDirectory } from '@/hooks/useMembersDirectory';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { withAction, updateMember, membershipOverrideAction, forceLogoutAction } from '@/lib/admin-actions';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { MODULES } from '@/lib/mission-control-modules';
import {
  MCPageShell, MCModuleHeader, MCKpiCard, MCKpiGrid,
  MCActionToolbar, ToolbarSearch, ToolbarSelect, ToolbarButton,
  MCDataGrid, MCActivityTimeline, MCEmptyState, MCErrorState,
} from '@/components/mission-control/ui';
import MCMemberFilters from '@/components/mission-control/members/MCMemberFilters';
import MCMemberActionsMenu from '@/components/mission-control/members/MCMemberActionsMenu';
import MCMemberProfileSheet from '@/components/mission-control/members/MCMemberProfileSheet';
import MCMemberEditSheet from '@/components/mission-control/members/MCMemberEditSheet';
import DevHardDeleteDialog from '@/components/mission-control/members/DevHardDeleteDialog';
import { useDevFounderAccess } from '@/hooks/useDevFounderAccess';
import {
  AvatarCell, StatusBadge, MembershipBadge, VerificationBadge, TrustCell, OnlineDot,
} from '@/components/mission-control/members/MCMemberShared';
import {
  fullName, memberShortId, primaryLanguage, membershipTier, trustScore,
  formatDate, formatRelative, applyFiltersAndSearch, applySort, countActiveFilters,
} from '@/lib/member-directory';

const PAGE_SIZE = 100;

const SORT_OPTIONS = [
  { value: 'created_date:desc', label: 'Newest first' },
  { value: 'created_date:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name A–Z' },
  { value: 'name:desc', label: 'Name Z–A' },
  { value: 'last_active:desc', label: 'Last active' },
  { value: 'trust:desc', label: 'Trust (high→low)' },
  { value: 'trust:asc', label: 'Trust (low→high)' },
  { value: 'country:asc', label: 'Country A–Z' },
];

const parseSort = (value) => {
  const [key, dir] = (value || 'created_date:desc').split(':');
  return { key, dir };
};

function NameCell({ m }) {
  return (
    <div className="flex items-center gap-2.5">
      <AvatarCell member={m} />
      <div className="min-w-0">
        <p className="font-medium truncate">{fullName(m)}</p>
        <p className="text-[10px] text-muted-foreground truncate">{m.email || '—'}</p>
      </div>
    </div>
  );
}

export default function MCMembers() {
  const { t } = useLocalization();
  const { members, memberships, membershipMap, stats, loading, error, refresh } = useMembersDirectory();
  const confirm = useAdminConfirm();
  const { isDevFounder } = useDevFounderAccess();
  const [hardDeleteTargets, setHardDeleteTargets] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ key: 'created_date', dir: 'desc' });
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [profileMember, setProfileMember] = useState(null);
  const [editMember, setEditMember] = useState(null);

  const enriched = useMemo(
    () => members.map((m) => ({ ...m, _tier: membershipTier(m, membershipMap) })),
    [members, membershipMap]
  );

  const filtered = useMemo(() => applyFiltersAndSearch(enriched, search, filters), [enriched, search, filters]);
  const sorted = useMemo(() => applySort(filtered, sort), [filtered, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => { if (page > pageCount - 1) setPage(0); }, [pageCount]);
  useEffect(() => { setSelectedIds([]); }, [search, filters]);

  const activeFilterCount = countActiveFilters(filters);

  // KPIs — live production counts from adminConsole stats (paginated DB
  // queries), never the capped member list. Premium is counted from the full
  // loaded memberships. All four update in realtime via the Member /
  // Membership subscription in useMembersDirectory.
  const kpis = useMemo(() => ({
    total: stats?.totalMembers ?? 0,
    online: stats?.onlineMembers ?? 0,
    premium: memberships.filter((m) => m.type === 'premium' && m.status === 'active').length,
    suspended: stats?.suspendedMembers ?? 0,
  }), [stats, memberships]);

  // Activity timeline (recent member updates, newest first)
  const activity = useMemo(() => {
    return [...enriched]
      .sort((a, b) => new Date(b.updated_date || 0).getTime() - new Date(a.updated_date || 0).getTime())
      .slice(0, 6)
      .map((m) => ({
        id: m.id,
        icon: UserIcon,
        title: `${fullName(m)} profile updated`,
        subtitle: m.email || '—',
        time: formatRelative(m.updated_date),
      }));
  }, [enriched]);

  const lastUpdated = useMemo(() => {
    const latest = [...enriched].sort((a, b) => new Date(b.updated_date || 0).getTime() - new Date(a.updated_date || 0).getTime())[0];
    return latest?.updated_date ? formatRelative(latest.updated_date) : undefined;
  }, [enriched]);

  const filterOptions = useMemo(() => {
    const countries = new Set();
    const cities = new Set();
    const langs = new Set();
    members.forEach((m) => {
      if (m.country) countries.add(m.country);
      if (m.city) cities.add(m.city);
      (m.languages || []).forEach((l) => langs.add(l));
    });
    const toOpts = (set) => [...set].sort().map((v) => ({ value: v, label: v }));
    return { countries: toOpts(countries), cities: toOpts(cities), languages: toOpts(langs) };
  }, [members]);

  // --- actions (business logic unchanged) ---
  const runUpdate = async (m, patch, label) => {
    await withAction(label, refresh)(() => updateMember(m.id, patch, label));
    setProfileMember((cur) => (cur && cur.id === m.id ? { ...cur, ...patch } : cur));
  };

  const doStatus = async (m, status, label) => {
    const ok = await confirm({
      title: `${label} ${fullName(m)}?`,
      description: 'This changes the account status. The action is audit-logged.',
      confirmLabel: label,
      variant: status === 'active' ? 'default' : 'destructive',
    });
    if (!ok) return;
    await runUpdate(m, { admin_status: status }, `Member ${label.toLowerCase()}`);
  };

  const doResetVerification = async (m) => {
    const ok = await confirm({ title: 'Reset verification?', description: 'The member will be marked as unverified.', confirmLabel: 'Reset', variant: 'destructive' });
    if (!ok) return;
    await runUpdate(m, { phone_verified: false }, 'Verification reset');
  };

  const doResetCompletion = async (m) => {
    const ok = await confirm({ title: 'Reset profile completion?', description: 'The member will be prompted to re-complete their profile.', confirmLabel: 'Reset' });
    if (!ok) return;
    await runUpdate(m, { onboarding_completed: false }, 'Profile completion reset');
  };

  const doMembership = async (m, action, label) => {
    const ok = await confirm({ title: `${label} ${fullName(m)}?`, description: 'This changes the membership tier (no payment is processed). The action is audit-logged.', confirmLabel: label, variant: action === 'upgrade' ? 'default' : 'destructive' });
    if (!ok) return;
    try {
      await membershipOverrideAction(m.created_by_id, action, { permanent: true, reason: `Mission Control: ${label}` });
      toast({ title: `Member ${label.toLowerCase()}` });
      refresh();
    } catch (e) {
      toast({ title: 'Action failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const doForceLogout = async (m) => {
    const ok = await confirm({
      title: `Force logout ${fullName(m)}?`,
      description: 'All active sessions for this member will be immediately invalidated. They will need to log in again. This action is audit-logged.',
      confirmLabel: 'Force Logout',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await forceLogoutAction(m.id, 'Manual force logout by Mission Control');
      toast({ title: `${fullName(m)} has been force logged out` });
    } catch (e) {
      toast({ title: 'Force logout failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const handleAction = (m, actionId) => {
    switch (actionId) {
      case 'view': setProfileMember(m); break;
      case 'edit': setEditMember(m); break;
      case 'resetVerification': doResetVerification(m); break;
      case 'resetCompletion': doResetCompletion(m); break;
      case 'upgrade': doMembership(m, 'upgrade', 'Upgrade to Premium'); break;
      case 'downgrade': doMembership(m, 'downgrade', 'Downgrade to Explorer'); break;
      case 'suspend': doStatus(m, 'suspended', 'Suspend'); break;
      case 'reactivate': doStatus(m, 'active', 'Reactivate'); break;
      case 'ban': doStatus(m, 'banned', 'Ban'); break;
      case 'unban': doStatus(m, 'active', 'Unban'); break;
      case 'softDelete': doStatus(m, 'deleted', 'Soft delete'); break;
      case 'restore': doStatus(m, 'active', 'Restore'); break;
      case 'hardDelete': setHardDeleteTargets([m]); break;
      case 'forceLogout': doForceLogout(m); break;
      default: break;
    }
  };

  // --- bulk actions ---
  const bulkSuspend = async () => {
    const ok = await confirm({ title: `Suspend ${selectedIds.length} members?`, confirmLabel: 'Suspend', variant: 'destructive' });
    if (!ok) return;
    await Promise.all(selectedIds.map((id) => updateMember(id, { admin_status: 'suspended' }).catch(() => {})));
    toast({ title: `${selectedIds.length} members suspended` });
    setSelectedIds([]);
    refresh();
  };
  const bulkActivate = async () => {
    const ok = await confirm({ title: `Reactivate ${selectedIds.length} members?`, confirmLabel: 'Reactivate' });
    if (!ok) return;
    await Promise.all(selectedIds.map((id) => updateMember(id, { admin_status: 'active' }).catch(() => {})));
    toast({ title: `${selectedIds.length} members reactivated` });
    setSelectedIds([]);
    refresh();
  };
  const bulkHardDelete = async () => {
    const targets = enriched.filter((m) => selectedIds.includes(m.id));
    if (targets.length === 0) return;
    setHardDeleteTargets(targets);
  };
  const bulkActions = [
    { label: 'Suspend', icon: Ban, variant: 'destructive', onClick: bulkSuspend },
    { label: 'Reactivate', icon: UserIcon, onClick: bulkActivate },
    ...(isDevFounder
      ? [{ label: 'Hard Delete Selected', icon: Trash2, variant: 'destructive', onClick: bulkHardDelete }]
      : []),
  ];

  // --- export ---
  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['Display Name', 'Email', 'Phone', 'Country', 'City', 'Membership', 'Status', 'Joined'];
    const lines = [headers.join(',')];
    sorted.forEach((m) => {
      lines.push([esc(fullName(m)), esc(m.email), esc(m.phone), esc(m.country), esc(m.city), esc(m._tier), esc(m.admin_status || 'active'), esc(formatDate(m.created_date))].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmood-members-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${sorted.length} members` });
  };

  // --- grid columns ---
  const columns = [
    { key: 'name', label: 'Member', sortable: true, render: (m) => <NameCell m={m} /> },
    { key: 'member_id', label: 'Member ID', render: (m) => <span className="font-mono text-muted-foreground">{memberShortId(m)}</span> },
    { key: 'email', label: 'Email', render: (m) => <span className="text-muted-foreground max-w-[180px] truncate block">{m.email || '—'}</span> },
    { key: 'country', label: 'Country', sortable: true, render: (m) => m.country || '—' },
    { key: 'city', label: 'City', render: (m) => m.city || '—' },
    { key: 'language', label: 'Language', render: (m) => primaryLanguage(m) },
    { key: 'membership', label: 'Membership', sortable: true, render: (m) => <MembershipBadge member={m} membershipMap={membershipMap} /> },
    { key: 'trust', label: 'Trust', sortable: true, render: (m) => <TrustCell member={m} /> },
    { key: 'verified', label: 'Verified', render: (m) => <VerificationBadge member={m} /> },
    { key: 'status', label: 'Status', render: (m) => <StatusBadge status={m.admin_status} /> },
    { key: 'created_date', label: 'Registered', sortable: true, render: (m) => <span className="text-muted-foreground">{formatDate(m.created_date)}</span> },
    { key: 'last_active', label: 'Last Active', sortable: true, render: (m) => <span className="text-muted-foreground">{formatDate(m.updated_date)}</span> },
    { key: 'online', label: 'Online', render: (m) => <OnlineDot member={m} /> },
  ];

  const renderMemberCard = (m, { selected, toggle }) => (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={(e) => { e.stopPropagation(); toggle(); }} aria-label={t('mission.select_row')} className="text-muted-foreground">
          {selected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
        </button>
        <AvatarCell member={m} size="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{fullName(m)}</p>
          <p className="text-xs text-muted-foreground truncate">{m.email || '—'}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{memberShortId(m)}</p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <MCMemberActionsMenu member={m} tier={m._tier} onAction={handleAction} showDevHardDelete={isDevFounder} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        <MembershipBadge member={m} membershipMap={membershipMap} />
        <StatusBadge status={m.admin_status} />
        <VerificationBadge member={m} />
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><OnlineDot member={m} /> Trust {trustScore(m)}</span>
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
        <span>{[m.city, m.country].filter(Boolean).join(', ') || '—'}</span>
        <span>Last active {formatDate(m.updated_date)}</span>
      </div>
    </div>
  );

  return (
    <MCPageShell
      header={
        <MCModuleHeader
          icon={MODULES.members.icon}
          title={MODULES.members.title}
          description={MODULES.members.description}
          breadcrumb={[{ label: MODULES.members.title }]}
          lastUpdated={lastUpdated}
        />
      }
      kpis={
        <MCKpiGrid>
          <MCKpiCard icon={Users} label="Total Members" value={kpis.total} loading={loading} color="primary" />
          <MCKpiCard icon={Wifi} label="Online Members" value={kpis.online} loading={loading} color="success" />
          <MCKpiCard icon={Crown} label="Premium Members" value={kpis.premium} loading={loading} color="warning" />
          <MCKpiCard icon={Ban} label="Suspended Members" value={kpis.suspended} loading={loading} color="destructive" />
        </MCKpiGrid>
      }
      toolbar={
        <>
          <MCActionToolbar>
            <ToolbarSearch value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder={t('mission.search_by_name_email_member')} />
            <ToolbarSelect value={`${sort.key}:${sort.dir}`} onChange={(v) => setSort(parseSort(v))} options={SORT_OPTIONS} ariaLabel="Sort members" className="sm:w-44" />
            <ToolbarButton icon={SlidersHorizontal} label={`Filters${activeFilterCount ? ` ${activeFilterCount}` : ''}`} active={showFilters || activeFilterCount > 0} onClick={() => setShowFilters((s) => !s)} />
            <ToolbarButton icon={Download} label="Export" onClick={exportCsv} />
            <ToolbarButton icon={RefreshCw} label="Refresh" onClick={refresh} />
          </MCActionToolbar>
          {showFilters && (
            <MCMemberFilters
              filters={filters}
              onChange={(f) => { setFilters(f); setPage(0); }}
              onClear={() => { setFilters({}); setPage(0); }}
              options={filterOptions}
            />
          )}
        </>
      }
      timeline={<MCActivityTimeline items={activity} loading={loading} emptyLabel="No recent member activity." />}
    >
      <MCDataGrid
        columns={columns}
        rows={pageItems}
        rowKey="id"
        loading={loading}
        error={!!error && !loading}
        errorSlot={<MCErrorState title={t('mission.could_not_load_members')} description={t('mission.could_not_fetch_member_directory')} onRetry={refresh} />}
        emptySlot={
          <MCEmptyState
            icon={Users}
            title={t('mission.no_members_found')}
            description={t('mission.no_members_match_search')}
            action={((search || activeFilterCount > 0) && (
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilters({}); }}>{t('mission.clear_filters')}</Button>
            ))}
          />
        }
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sort={sort}
        onSort={(col) => setSort((s) => ({ key: col, dir: s.key === col && s.dir === 'asc' ? 'desc' : 'asc' }))}
        pagination={{ page: safePage, pageSize: PAGE_SIZE, total: sorted.length, onPageChange: (p) => setPage(Math.max(0, p)) }}
        onRowClick={(m) => handleAction(m, 'view')}
        rowActions={(m) => <MCMemberActionsMenu member={m} tier={m._tier} onAction={handleAction} showDevHardDelete={isDevFounder} />}
        mobileCardRender={renderMemberCard}
        bulkActions={bulkActions}
      />

      <MCMemberProfileSheet
        member={profileMember}
        membershipMap={membershipMap}
        open={!!profileMember}
        onOpenChange={(o) => !o && setProfileMember(null)}
        onAction={handleAction}
        showDevHardDelete={isDevFounder}
      />
      <DevHardDeleteDialog
        targets={hardDeleteTargets}
        open={hardDeleteTargets.length > 0}
        onClose={() => setHardDeleteTargets([])}
        onSuccess={() => { refresh(); setSelectedIds([]); }}
      />
      <MCMemberEditSheet
        member={editMember}
        open={!!editMember}
        onOpenChange={(o) => !o && setEditMember(null)}
        onSaved={refresh}
      />
    </MCPageShell>
  );
}