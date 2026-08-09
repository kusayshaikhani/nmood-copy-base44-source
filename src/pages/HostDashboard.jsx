import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Sparkles, Users } from 'lucide-react';
import HostHeader from '@/components/host/HostHeader';
import HostSummaryCards from '@/components/host/HostSummaryCards';
import HostActivityCard from '@/components/host/HostActivityCard';
import HostRequestCard from '@/components/host/HostRequestCard';
import HostAnalytics from '@/components/host/HostAnalytics';
import HostFilterSheet from '@/components/host/HostFilterSheet';
import EmptyState from '@/components/shared/EmptyState';
import CircleCard from '@/components/circles/CircleCard';
import { hostActivities, joinRequests, hostAnalytics, hostStats } from '@/lib/host-data';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { normalizeCircle } from '@/lib/circle-store';
import InterestPollWizard from '@/components/interest-poll/InterestPollWizard';
import InterestPollDashboard from '@/components/interest-poll/InterestPollDashboard';
import { useLocalization } from '@/lib/i18n/useLocalization';

const tabIds = ['upcoming', 'live', 'drafts', 'completed', 'cancelled'];
const tabLabelMap = { upcoming: 'hosting.dashboard.tab_upcoming', live: 'hosting.dashboard.tab_live', drafts: 'hosting.dashboard.tab_drafts', completed: 'hosting.dashboard.tab_completed', cancelled: 'hosting.dashboard.tab_cancelled' };

function matchesSearch(activity, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    activity.title.toLowerCase().includes(q) ||
    activity.category.toLowerCase().includes(q) ||
    activity.status.toLowerCase().includes(q)
  );
}

function matchesFilters(activity, filters) {
  if (filters.type !== 'all' && activity.type !== filters.type) return false;
  if (filters.location && !activity.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
  return true;
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', date: 'all', location: '' });
  const [showPollWizard, setShowPollWizard] = useState(false);
  const [myCircles, setMyCircles] = useState([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const mine = await base44.entities.Circle.filter({ created_by_id: user.id }, '-created_date', 50);
        if (active) setMyCircles((mine || []).map(normalizeCircle));
      } catch {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [user]);

  const filtered = hostActivities
    .filter((a) => a.status === activeTab)
    .filter((a) => matchesSearch(a, search))
    .filter((a) => matchesFilters(a, filters));

  const hasFilters = filters.type !== 'all' || filters.location !== '';
  const hasAnyActivities = hostActivities.length > 0;
  const showEmptyState = !hasAnyActivities || (filtered.length === 0 && (search !== '' || hasFilters));

  return (
    <div className="max-w-2xl mx-auto">
      <HostHeader
        search={search}
        setSearch={setSearch}
        onFilterClick={() => setFilterOpen(true)}
        onCreate={() => navigate('/host/create')}
        hasFilters={hasFilters}
      />

      <HostSummaryCards stats={hostStats} />

      {myCircles.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> {t('hosting.dashboard.my_circles')}</h2>
            <span className="text-xs text-muted-foreground">{myCircles.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {myCircles.map((c) => <CircleCard key={c.id} circle={c} />)}
          </div>
        </div>
      )}

      <button onClick={() => setShowPollWizard(true)} type="button" className="w-full flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-default text-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{t('hosting.dashboard.whos_interested')}</p>
          <p className="text-xs text-muted-foreground">{t('hosting.dashboard.whos_interested_desc')}</p>
        </div>
      </button>

      <InterestPollDashboard />

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabIds.map((tab) => {
          const isActive = activeTab === tab;
          const tabClass = isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/70';
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={tabClass + ' px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-default'}
            >
              {t(tabLabelMap[tab])}
            </button>
          );
        })}
      </div>

      {!hasAnyActivities ? (
        <EmptyState
          icon={Inbox}
          title={t("hosting.dashboard.no_activities_title")}
          description={t("hosting.dashboard.no_activities_desc")}
          actionLabel={t("hosting.dashboard.no_activities_action")}
          onAction={() => navigate('/host/create')}
        />
      ) : showEmptyState ? (
        <EmptyState
          icon={Inbox}
          title={t("hosting.dashboard.no_results_title")}
          description={t("hosting.dashboard.no_results_desc")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((activity) => (
            <HostActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {joinRequests.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold">{t('hosting.dashboard.join_requests')}</h2>
            <span className="text-xs text-muted-foreground">{t('hosting.dashboard.pending_count', { count: joinRequests.length })}</span>
          </div>
          <div className="space-y-3">
            {joinRequests.map((req) => (
              <HostRequestCard key={req.id} request={req} />
            ))}
          </div>
        </div>
      )}

      <HostAnalytics analytics={hostAnalytics} />

      <InterestPollWizard open={showPollWizard} onOpenChange={setShowPollWizard} />

      <HostFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}