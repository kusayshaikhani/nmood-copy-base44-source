import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getDashboard, getTimeline, acknowledgeAlert, resolveAlert,
  buildDailyOpsReport, buildWeeklyHealthReport, buildMonthlyPlatformReport,
  buildIncidentSummary, buildAvailabilityReport,
} from '@/lib/observability-manager';
import { Activity, AlertTriangle, Gauge, Clock, Zap, Bell, TrendingUp, CheckCircle2, FileDown, RefreshCw } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_TONE = { operational: 'text-success', degraded: 'text-warning', partial_outage: 'text-destructive', major_outage: 'text-destructive' };
const LEVEL_TONE = { informational: 'text-muted-foreground', warning: 'text-warning', high: 'text-destructive', critical: 'text-destructive' };

function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function ObservabilityCenter() {
  const { t } = useLocalization();
  const [dash, setDash] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getDashboard();
      setDash(d);
      const t = await getTimeline(range);
      setTimeline(t.series || []);
    } catch { setDash(null); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const handleAck = async (id) => { await acknowledgeAlert(id); load(); };
  const handleResolve = async (id) => { await resolveAlert(id); load(); };

  const cards = [
    { label: 'Error Rate', value: `${dash?.error_rate ?? '—'}%`, icon: AlertTriangle, tone: dash?.error_rate > 15 ? 'text-destructive' : dash?.error_rate > 5 ? 'text-warning' : 'text-success' },
    { label: 'Avg Response', value: dash?.avg_response_time ? `${dash.avg_response_time}ms` : '—', icon: Clock, tone: 'text-foreground' },
    { label: 'Requests (24h)', value: dash?.total_requests_24h ?? '—', icon: Activity, tone: 'text-foreground' },
    { label: 'Failed (24h)', value: dash?.failed_requests_24h ?? '—', icon: AlertTriangle, tone: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('admin.observability_center')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.platform_health_performance_trends_operational')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t('admin.refresh')}</Button>
      </div>

      {/* Overall health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 flex flex-col items-center justify-center">
          <Gauge className={`w-6 h-6 mb-1 ${STATUS_TONE[dash?.status] || 'text-muted-foreground'}`} />
          <p className="text-lg font-bold capitalize">{dash?.status?.replace('_', ' ') || '—'}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t('admin.platform_status')}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <CheckCircle2 className="w-6 h-6 mb-1 text-success" />
          <p className="text-3xl font-bold">{dash?.availability ?? '—'}%</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t('admin.availability')}</p>
        </Card>
        {cards.slice(0, 2).map((c) => (
          <Card key={c.label} className="p-4 flex flex-col items-center justify-center">
            <c.icon className={`w-6 h-6 mb-1 ${c.tone}`} />
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.slice(2).map((c) => (
          <Card key={c.label} className="p-4 flex items-center gap-3">
            <c.icon className={`w-5 h-5 ${c.tone}`} />
            <div>
              <p className="text-xl font-bold">{c.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
            </div>
          </Card>
        ))}
        <Card className="p-4 flex items-center gap-3">
          <Bell className="w-5 h-5 text-destructive" />
          <div>
            <p className="text-xl font-bold">{dash?.open_alerts ?? '—'}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t('admin.open_alerts')}</p>
          </div>
        </Card>
      </div>

      {/* Health timeline */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{t('admin.health_timeline')}</h3>
          <div className="flex gap-1">
            {['24h', '7d', '30d'].map((r) => (
              <Button key={r} variant={range === r ? 'default' : 'outline'} size="sm" onClick={() => setRange(r)}>{r}</Button>
            ))}
          </div>
        </div>
        {timeline.length ? (
          <div className="flex items-end gap-1 h-32">
            {timeline.map((p, i) => {
              const maxErr = Math.max(...timeline.map((x) => x.errors), 1);
              const h = Math.max(4, (p.errors / maxErr) * 100);
              return (
                <div key={i} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full" title={`${p.ts} · ${p.errors} errors · ${p.avg_latency}ms`}>
                  <div className="w-full rounded-t bg-primary/70" style={{ height: `${h}%` }} />
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-muted-foreground py-4 text-center">{t('admin.no_timeline_data_yet')}</p>}
        <p className="text-xs text-muted-foreground mt-2">Bar height = error count per {range === '24h' ? 'hour' : 'day'}.</p>
      </Card>

      {/* Slowest services */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.slowest_services')}</h3>
        {dash?.slowest_services?.length ? (
          <div className="space-y-1.5">
            {dash.slowest_services.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0 text-sm">
                <span className="truncate">{s.metric}{s.screen ? ` · ${s.screen}` : ''}</span>
                <span className="font-semibold">{s.avg_ms}ms</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground py-4 text-center">{t('admin.no_slow_services_detected')}</p>}
      </Card>

      {/* Top errors */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.top_errors_24h')}</h3>
        {dash?.top_errors?.length ? (
          <div className="space-y-1.5">
            {dash.top_errors.map((e, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0 text-sm">
                <span className="truncate flex-1 mr-2">{e.message}</span>
                <span className="text-xs text-muted-foreground capitalize mr-3">{e.severity}</span>
                <span className="font-semibold">{e.count}×</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground py-4 text-center">{t('admin.no_errors_recorded')}</p>}
      </Card>

      {/* Business activity */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.business_activity_24h_aggregated')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {dash?.business_activity && Object.entries(dash.business_activity).map(([cat, n]) => (
            <div key={cat} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50">
              <span className="text-sm capitalize">{cat}</span>
              <span className="font-semibold">{n}</span>
            </div>
          ))}
          {(!dash?.business_activity || !Object.keys(dash.business_activity).length) && <p className="text-sm text-muted-foreground col-span-full text-center py-2">{t('admin.no_activity_yet')}</p>}
        </div>
      </Card>

      {/* Alerts */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.recent_alerts')}</h3>
        {dash?.recent_alerts?.length ? (
          <div className="space-y-2">
            {dash.recent_alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/60 last:border-0">
                <AlertTriangle className={`w-4 h-4 ${LEVEL_TONE[a.level] || ''}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.metric} · {a.value} (threshold {a.threshold})</p>
                </div>
                <span className="text-xs capitalize text-muted-foreground">{a.status}</span>
                {a.status === 'open' && <Button variant="outline" size="sm" onClick={() => handleAck(a.id)}>{t('admin.ack')}</Button>}
                {a.status !== 'resolved' && <Button variant="ghost" size="sm" onClick={() => handleResolve(a.id)}>{t('admin.resolve')}</Button>}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground py-4 text-center">{t('admin.no_alerts')}</p>}
      </Card>

      {/* Incident timeline */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.incident_timeline')}</h3>
        {dash?.incident_timeline?.length ? (
          <div className="space-y-1.5">
            {dash.incident_timeline.map((inc, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/60 last:border-0 text-sm">
                <span className={`text-xs font-semibold capitalize w-20 ${LEVEL_TONE[inc.severity] || ''}`}>{inc.severity}</span>
                <span className="text-xs text-muted-foreground w-16">{inc.type}</span>
                <span className="flex-1 truncate">{inc.title}</span>
                <span className="text-xs text-muted-foreground">{inc.ts ? new Date(inc.ts).toLocaleString() : ''}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground py-4 text-center">{t('admin.no_incidents')}</p>}
      </Card>

      {/* Reports */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.reports')}</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => download('ops-daily.json', buildDailyOpsReport(dash))}><FileDown className="w-4 h-4" /> {t('admin.daily_ops')}</Button>
          <Button variant="outline" size="sm" onClick={() => download('ops-weekly-health.json', buildWeeklyHealthReport(dash, timeline))}><FileDown className="w-4 h-4" /> {t('admin.weekly_health')}</Button>
          <Button variant="outline" size="sm" onClick={() => download('ops-monthly.json', buildMonthlyPlatformReport(dash, timeline))}><FileDown className="w-4 h-4" /> {t('admin.monthly_platform')}</Button>
          <Button variant="outline" size="sm" onClick={() => download('ops-incidents.json', buildIncidentSummary(dash))}><FileDown className="w-4 h-4" /> {t('admin.incident_summary')}</Button>
          <Button variant="outline" size="sm" onClick={() => download('ops-availability.json', buildAvailabilityReport(dash, timeline))}><FileDown className="w-4 h-4" /> {t('admin.availability')}</Button>
        </div>
      </Card>
    </div>
  );
}