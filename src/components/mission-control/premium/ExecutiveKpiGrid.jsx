import React from 'react';
import {
  Users, Wifi, Calendar, UsersRound, MessageCircle, Link2, UserPlus,
  Crown, DollarSign, Flag, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import CountUp from './CountUp';
import Sparkline from './Sparkline';
import { dayBuckets, trendFor } from './series';
import { isOpen } from '@/lib/trust-safety-directory';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ACCENTS = {
  primary: { bg: 'bg-primary/15', text: 'text-primary', stroke: 'hsl(var(--primary))' },
  info: { bg: 'bg-info/15', text: 'text-info', stroke: 'hsl(var(--info))' },
  success: { bg: 'bg-success/15', text: 'text-success', stroke: 'hsl(var(--success))' },
  warning: { bg: 'bg-warning/15', text: 'text-warning', stroke: 'hsl(var(--warning))' },
  destructive: { bg: 'bg-destructive/15', text: 'text-destructive', stroke: 'hsl(var(--destructive))' },
  accent: { bg: 'bg-accent/25', text: 'text-accent-foreground', stroke: 'hsl(var(--accent))' },
};

function KpiCard({ icon: Icon, label, value, series, trend, accent, loading, live }) {
  const { t } = useLocalization();
  if (loading) return <div className="rounded-card glass p-4 h-[136px] shimmer" />;

  const a = ACCENTS[accent] || ACCENTS.primary;
  const tr = trend || { dir: 'flat', pct: 0 };
  const TrendIcon = tr.dir === 'up' ? TrendingUp : tr.dir === 'down' ? TrendingDown : Minus;
  const trendColor = tr.dir === 'up' ? 'text-success' : tr.dir === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="rounded-card glass p-4 shadow-card transition-default hover:-translate-y-0.5 hover:shadow-elevated animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.bg} ${a.text}`}>
          <Icon className="w-5 h-5" />
        </div>
        {live ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            {t('mission.live')}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" /> {tr.pct}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight mt-3">
        <CountUp value={value} />
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {!live && series && (
        <div className="mt-2 -mx-1">
          <Sparkline data={series} color={a.stroke} height={32} id={label.replace(/\s/g, '')} />
        </div>
      )}
    </div>
  );
}

export default function ExecutiveKpiGrid({ members, experiences, circles, messages, connections, memberships, reports, stats, loading }) {
  const { t } = useLocalization();
  const todayKey = new Date().toISOString().slice(0, 10);
  const isToday = (d) => d && new Date(d).toISOString().slice(0, 10) === todayKey;

  const activeCircles = circles.filter((c) => c.status !== 'closed' && !c.is_archived).length;
  const premiumActive = memberships.filter((m) => m.type === 'premium' && m.status === 'active').length;
  const openReports = reports.filter((r) => isOpen(r.status)).length;
  const msgArr = messages || [];
  const connArr = connections || [];

  const kpis = [
    { icon: Users, label: t('mission.kpi_members'), value: stats?.totalMembers ?? 0, series: dayBuckets(members, 'created_date'), accent: 'primary' },
    { icon: Wifi, label: t('mission.kpi_online'), value: stats?.onlineMembers ?? 0, accent: 'success', live: true },
    { icon: Calendar, label: t('mission.kpi_experiences_today'), value: stats?.experiencesToday ?? experiences.filter((e) => isToday(e.date || e.created_date)).length, series: dayBuckets(experiences, 'created_date'), accent: 'info' },
    { icon: UsersRound, label: t('mission.kpi_active_circles'), value: activeCircles, series: dayBuckets(circles, 'created_date'), accent: 'accent' },
    { icon: MessageCircle, label: t('mission.kpi_messages_today'), value: msgArr.filter((m) => isToday(m.created_date)).length, series: dayBuckets(msgArr, 'created_date'), accent: 'primary' },
    { icon: Link2, label: t('mission.kpi_connections'), value: connArr.filter((c) => isToday(c.created_date)).length, series: dayBuckets(connArr, 'created_date'), accent: 'info' },
    { icon: UserPlus, label: t('mission.kpi_new_signups'), value: members.filter((m) => isToday(m.created_date)).length, series: dayBuckets(members, 'created_date'), accent: 'success' },
    { icon: Crown, label: t('mission.kpi_premium'), value: premiumActive, series: dayBuckets(memberships.filter((m) => m.type === 'premium'), 'started_date'), accent: 'warning' },
    { icon: DollarSign, label: t('mission.kpi_revenue'), value: premiumActive, series: dayBuckets(memberships.filter((m) => m.type === 'premium'), 'started_date'), accent: 'success' },
    { icon: Flag, label: t('mission.kpi_reports_pending'), value: openReports, series: dayBuckets(reports, 'created_date'), accent: 'destructive' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {kpis.map((k) => (
        <KpiCard key={k.label} {...k} trend={k.series ? trendFor(k.series) : null} loading={loading} />
      ))}
    </div>
  );
}