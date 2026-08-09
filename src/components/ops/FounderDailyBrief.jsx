import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import HealthDot from '@/components/ops/HealthDot';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Sunrise, TrendingUp, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/lib/i18n/useLocalization';

// OPS-001 Founder Daily Brief — a single executive summary of yesterday's
// business, community, platform, security and AI signals, with actionable
// recommendations. Reuses adminConsole + systemOps; no new data sources.
const DAY = 86400000;
const withinLastDay = (iso) => iso && Date.now() - new Date(iso).getTime() < DAY;

export default function FounderDailyBrief() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, health, errors, metrics] = await Promise.all([
        base44.functions.invoke('adminConsole', { mode: 'stats' }).catch(() => null),
        base44.functions.invoke('systemOps', { mode: 'health' }).catch(() => null),
        base44.functions.invoke('systemOps', { mode: 'listErrors' }).catch(() => null),
        base44.functions.invoke('systemOps', { mode: 'listMetrics' }).catch(() => null),
      ]);

      const errArr = (errors?.data || []).filter((e) => withinLastDay(e.created_date));
      const fatalCount = errArr.filter((e) => e.severity === 'fatal').length;
      const warnCount = errArr.filter((e) => e.severity === 'warning').length;

      const perf = metrics?.summary || [];
      const startup = perf.find((m) => m.metric_name === 'app_startup');
      const homeLoad = perf.find((m) => m.metric_name === 'home_load');

      const recommendations = [];
      if (stats?.pendingReports > 0) recommendations.push({ text: `Review ${stats.pendingReports} pending safety report(s).`, path: '/admin/reports' });
      if (fatalCount > 0) recommendations.push({ text: `${fatalCount} fatal error(s) in the last 24h — investigate now.`, path: '/admin/ops/errors' });
      if (health?.overall === 'warning' || health?.overall === 'critical') recommendations.push({ text: 'Platform health is degraded — check subsystem status.', path: '/admin/ops/health' });
      if (startup && startup.avg_ms > 2000) recommendations.push({ text: `App startup averaging ${startup.avg_ms}ms — above the 2s budget.`, path: '/admin/ops/performance' });
      if (stats && stats.premiumMembers / Math.max(stats.totalMembers, 1) < 0.05 && stats.totalMembers > 20) recommendations.push({ text: 'Premium conversion below 5% — review upgrade friction.', path: '/admin/memberships' });
      if (recommendations.length === 0) recommendations.push({ text: 'All systems nominal. No urgent action required today.', path: null });

      setBrief({
        stats,
        health: health?.overall || 'unknown',
        probes: health?.probes || [],
        errors: { total: errArr.length, fatal: fatalCount, warnings: warnCount },
        perf: { startup: startup?.avg_ms, homeLoad: homeLoad?.avg_ms },
        recommendations,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading && !brief) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" /> {t('mission.preparing_your_daily_brief')}
        </div>
      </Card>
    );
  }
  if (!brief) return null;

  const s = brief.stats || {};
  const metrics = [
    { label: 'New Members', value: s.newRegistrations ?? '—', icon: TrendingUp, to: '/admin/members' },
    { label: 'Premium Members', value: s.premiumMembers ?? '—', icon: Sparkles, to: '/admin/memberships' },
    { label: 'Experiences Today', value: s.experiencesToday ?? '—', icon: ArrowRight, to: '/admin/activities' },
    { label: 'Circles Today', value: s.circlesToday ?? '—', icon: ArrowRight, to: '/admin/circles' },
    { label: 'Online (24h)', value: s.onlineMembers ?? '—', icon: TrendingUp, to: '/admin/members' },
    { label: 'Pending Reports', value: s.pendingReports ?? '—', icon: ShieldAlert, to: '/admin/reports' },
  ];

  return (
    <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sunrise className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold">{greeting}. Here's yesterday at Nmood.</h2>
            <p className="text-xs text-muted-foreground">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t('admin.platform')}</span>
            <HealthDot status={brief.health} withLabel />
          </div>
          <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {metrics.map((m) => (
          <button key={m.label} onClick={() => m.to && navigate(m.to)} className="text-left">
            <div className="p-2.5 rounded-lg bg-card border border-border hover:border-primary/30 transition-default">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
              <p className="text-lg font-bold mt-0.5">{m.value}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t('mission.security_summary')}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-muted">{brief.errors.total} errors (24h)</span>
            {brief.errors.fatal > 0 && <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive font-medium">{brief.errors.fatal} fatal</span>}
            {brief.errors.warnings > 0 && <span className="px-2 py-1 rounded-md bg-warning/10 text-warning font-medium">{brief.errors.warnings} warnings</span>}
            {brief.errors.fatal === 0 && brief.errors.warnings === 0 && <span className="px-2 py-1 rounded-md bg-success/10 text-success font-medium">{t('mission.no_critical_issues')}</span>}
          </div>
          {(brief.perf.startup || brief.perf.homeLoad) && (
            <p className="text-xs text-muted-foreground mt-2">
              Startup {brief.perf.startup ? `${brief.perf.startup}ms` : '—'} · Home load {brief.perf.homeLoad ? `${brief.perf.homeLoad}ms` : '—'}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t('mission.recommendations')}</p>
          <ul className="space-y-1.5">
            {brief.recommendations.slice(0, 3).map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  disabled={!r.path}
                  onClick={() => r.path && navigate(r.path)}
                  className="text-left text-xs flex items-start gap-1.5 text-foreground hover:text-primary disabled:hover:text-foreground transition-default"
                >
                  <span className="text-primary mt-0.5">•</span>
                  <span>{r.text}{r.path && <ArrowRight className="w-3 h-3 inline ml-1 opacity-60" />}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}