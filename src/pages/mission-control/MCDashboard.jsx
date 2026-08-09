import React, { useMemo } from 'react';
import { useCommandCenterData } from '@/hooks/useCommandCenterData';
import { useAuth } from '@/lib/AuthContext';
import {
  computePlatformScore, computeBrief, computeHealth, computeCommunityPulse,
  computeTrustPulse, computeAi, computeActivity, computeFounderInsights,
  computeGlobalInsights, computeFocus, computeAlerts, deployments,
  scoreStatus, scoreColor,
} from '@/lib/command-center-metrics';

import MissionHero from '@/components/mission-control/premium/MissionHero';
import ExecutiveKpiGrid from '@/components/mission-control/premium/ExecutiveKpiGrid';
import LiveActivityFeed from '@/components/mission-control/premium/LiveActivityFeed';
import PlatformHealthGrid from '@/components/mission-control/premium/PlatformHealthGrid';
import GrowthAnalytics from '@/components/mission-control/premium/GrowthAnalytics';
import ModerationCenter from '@/components/mission-control/premium/ModerationCenter';
import MemberExplorer from '@/components/mission-control/premium/MemberExplorer';
import ContentManagement from '@/components/mission-control/premium/ContentManagement';
import AiInsightsPanel from '@/components/mission-control/premium/AiInsightsPanel';
import QuickActionsFab from '@/components/mission-control/premium/QuickActionsFab';
import AlertsBanner from '@/components/mission-control/premium/AlertsBanner';

/**
 * UI-025 — Founder Mission Control, premium redesign.
 * Presentation layer only. Every value is derived through the existing
 * useCommandCenterData hook and the unchanged command-center-metrics
 * helpers — no backend logic, APIs, analytics, or moderation workflows
 * are modified.
 */
export default function MCDashboard() {
  const { user } = useAuth();
  const {
    stats, members, experiences, circles, reports, tickets, memberships,
    connections, messages, aiAudits, aiReviews,
    loading, error, refresh, lastSeen,
  } = useCommandCenterData();

  const data = useMemo(
    () => ({ members, experiences, circles, reports, memberships, connections, messages, error, onlineMembers: stats?.onlineMembers ?? 0, totalMembers: stats?.totalMembers ?? members.length }),
    [members, experiences, circles, reports, memberships, connections, messages, stats, error]
  );

  const score = useMemo(() => computePlatformScore(data), [data]);
  const brief = useMemo(
    () => computeBrief({ members, experiences, circles, reports, memberships, connections, lastSeen }),
    [members, experiences, circles, reports, memberships, connections, lastSeen]
  );
  const focus = useMemo(() => computeFocus({ reports, tickets, members }), [reports, tickets, members]);
  const health = useMemo(() => computeHealth(stats, error), [stats, error]);
  const community = useMemo(() => computeCommunityPulse({ members, memberships, connections, messages, stats }), [members, memberships, connections, messages, stats]);
  const trust = useMemo(() => computeTrustPulse(reports, tickets, members, aiReviews), [reports, tickets, members, aiReviews]);
  const ai = useMemo(() => computeAi(aiAudits, aiReviews), [aiAudits, aiReviews]);
  const activity = useMemo(() => computeActivity({ members, experiences, circles, reports, memberships, tickets }), [members, experiences, circles, reports, memberships, tickets]);
  const founder = useMemo(() => computeFounderInsights({ members, experiences, circles, reports }), [members, experiences, circles, reports]);
  const global = useMemo(() => computeGlobalInsights(members), [members]);
  const alerts = useMemo(() => computeAlerts({ reports, members, error }), [reports, members, error]);
  const deps = useMemo(() => deployments(), []);

  const statusLabel = scoreStatus(score);
  const statusColor = scoreColor(score) === 'success' ? 'text-success' : scoreColor(score) === 'warning' ? 'text-warning' : 'text-destructive';

  return (
    <div className="max-w-[1500px] mx-auto space-y-5 pb-28">
      <MissionHero
        adminName={user?.full_name}
        score={score}
        statusLabel={statusLabel}
        statusColor={statusColor}
        loading={loading}
        onRefresh={refresh}
        brief={brief}
        deps={deps}
      />

      {alerts.length > 0 && <AlertsBanner alerts={alerts} />}

      <ExecutiveKpiGrid
        members={members}
        experiences={experiences}
        circles={circles}
        messages={messages}
        connections={connections}
        memberships={memberships}
        reports={reports}
        stats={stats}
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <GrowthAnalytics
            members={members}
            experiences={experiences}
            circles={circles}
            pulse={community}
            global={global}
            loading={loading}
          />
          <PlatformHealthGrid health={health} loading={loading} />
          <ModerationCenter trust={trust} focus={focus} loading={loading} />
          <MemberExplorer members={members} memberships={memberships} loading={loading} />
          <ContentManagement experiences={experiences} circles={circles} loading={loading} />
        </div>
        <div className="space-y-5">
          <LiveActivityFeed items={activity} loading={loading} />
          <AiInsightsPanel insights={founder} ai={ai} />
        </div>
      </div>

      <QuickActionsFab />
    </div>
  );
}