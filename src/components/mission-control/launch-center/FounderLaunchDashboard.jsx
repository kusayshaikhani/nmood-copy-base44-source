import React from 'react';
import { Activity, Users, Repeat, AlertTriangle, Crown, Calendar, UsersRound, HeartPulse } from 'lucide-react';
import { MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui/MCKpiCard';
import { MCErrorState, MCLoadingState } from '@/components/mission-control/ui';
import { useLaunchDashboardData } from '@/hooks/useLaunchDashboardData';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const HEALTH_META = {
  operational: { label: 'Operational', color: 'success' },
  degraded: { label: 'Degraded', color: 'warning' },
  partial_outage: { label: 'Partial Outage', color: 'warning' },
  major_outage: { label: 'Major Outage', color: 'destructive' },
};

/**
 * LM-001 — Founder Launch Dashboard.
 * Eight live launch metrics derived from productAnalytics + monitoringOps +
 * adminConsole. No new backend; reuses existing aggregates.
 */
export default function FounderLaunchDashboard() {
  const { analytics, observability, community, loading, error, refresh } = useLaunchDashboardData();

  if (loading) return <MCLoadingState rows={3} />;
  if (error) return <MCErrorState title="Launch dashboard unavailable" description="Could not load launch metrics." onRetry={refresh} />;

  const dau = analytics?.retention?.dau ?? 0;
  const mau = analytics?.retention?.mau ?? 0;
  const r1 = analytics?.retention?.retention1d;
  const r7 = analytics?.retention?.retention7d;
  const r30 = analytics?.retention?.retention30d;
  const conversion = analytics?.totals?.membershipConversion ?? 0;
  const premiumCount = analytics ? Math.round((conversion / 100) * (analytics.totals?.totalMembers || 0)) : 0;

  const crashRate = observability?.error_rate ?? 0;
  const availability = observability?.availability ?? 100;
  const avgLatency = observability?.avg_response_time ?? 0;
  const platformStatus = observability?.status || 'operational';
  const healthMeta = HEALTH_META[platformStatus] || HEALTH_META.operational;
  const openAlerts = observability?.open_alerts ?? 0;

  const activeExperiences = community?.activeExperiences ?? community?.experiencesActive ?? 0;
  const activeCircles = community?.activeCircles ?? community?.circlesActive ?? 0;

  const retentionLabel = r7 != null ? `${r7}% D7` : r1 != null ? `${r1}% D1` : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Founder Launch Dashboard</h2>
          <p className="text-sm text-muted-foreground">Live launch-day metrics — growth, stability & monetization.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="h-8 gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <MCKpiGrid>
        <MCKpiCard icon={Activity} label="DAU" value={dau.toLocaleString()} sublabel="Daily active users" color="primary" />
        <MCKpiCard icon={Users} label="MAU" value={mau.toLocaleString()} sublabel="Monthly active users" color="info" />
        <MCKpiCard icon={Repeat} label="Retention" value={retentionLabel} sublabel={r30 != null ? `${r30}% D30` : 'Cohort retention'} color="success" />
        <MCKpiCard icon={AlertTriangle} label="Crash Rate" value={`${crashRate}%`} sublabel={`${availability}% availability`} color={crashRate > 5 ? 'destructive' : 'success'} />
      </MCKpiGrid>

      <MCKpiGrid>
        <MCKpiCard icon={Crown} label="Premium Conversions" value={conversion + '%'} sublabel={`${premiumCount} premium members`} color="warning" />
        <MCKpiCard icon={Calendar} label="Active Experiences" value={activeExperiences.toLocaleString()} sublabel="Live & scheduled" color="primary" />
        <MCKpiCard icon={UsersRound} label="Active Circles" value={activeCircles.toLocaleString()} sublabel="Active communities" color="info" />
        <MCKpiCard icon={HeartPulse} label="Platform Health" value={healthMeta.label} sublabel={`${openAlerts} open alert${openAlerts === 1 ? '' : 's'}`} color={healthMeta.color} />
      </MCKpiGrid>

      <div className="rounded-xl border bg-card/80 backdrop-blur p-4">
        <h3 className="text-sm font-semibold mb-2">Operational Detail</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Avg Response</p><p className="font-semibold">{avgLatency} ms</p></div>
          <div><p className="text-xs text-muted-foreground">Errors (24h)</p><p className="font-semibold">{observability?.metrics?.errors ?? 0}</p></div>
          <div><p className="text-xs text-muted-foreground">Product Events (24h)</p><p className="font-semibold">{observability?.metrics?.product_events ?? 0}</p></div>
          <div><p className="text-xs text-muted-foreground">Security Events (24h)</p><p className="font-semibold">{observability?.metrics?.security_events ?? 0}</p></div>
        </div>
      </div>
    </div>
  );
}