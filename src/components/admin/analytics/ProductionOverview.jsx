import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { RELEASE } from '@/lib/release-config';
import { ShieldCheck, Activity, Database, HardDrive, Bell, Users, Flag, AlertTriangle, Clock } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// RM-003 Production Overview — admin-only dashboard section.
const STATUS_TONE = { healthy: 'text-success', warning: 'text-warning', critical: 'text-destructive' };

export default function ProductionOverview() {
  const { t } = useLocalization();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [health, release, errors, stats] = await Promise.all([
        base44.functions.invoke('systemOps', { mode: 'health' }).catch(() => null),
        base44.functions.invoke('systemOps', { mode: 'releaseInfo' }).catch(() => null),
        base44.functions.invoke('systemOps', { mode: 'listErrors' }).catch(() => null),
        base44.functions.invoke('adminConsole', { mode: 'stats' }).catch(() => null),
      ]);
      const now = Date.now();
      const errCount = (errors?.data || []).filter((e) => {
        const t = e.created_date ? new Date(e.created_date).getTime() : 0;
        return now - t < 24 * 3600 * 1000;
      }).length;
      const probe = (name) => (health?.probes || []).find((p) => p.name === name);
      setData({
        overall: health?.overall || 'unknown',
        avgLatency: health?.avg_response_time_ms,
        db: probe('Database'),
        storage: probe('Storage'),
        notifications: probe('Notification Service'),
        onlineMembers: stats?.data?.onlineMembers ?? '—',
        pendingReports: stats?.data?.pendingReports ?? '—',
        errorCount24h: errCount,
        release: release || {
          version: RELEASE.version,
          build_number: RELEASE.buildNumber,
          environment: RELEASE.environment,
        },
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return <Card className="p-4"><p className="text-sm text-muted-foreground">{t('admin.loading_production_overview')}</p></Card>;
  }
  if (!data) return null;

  const rows = [
    { label: 'Current Release', value: `${data.release.version || '—'} (${data.release.build_number || '—'})`, icon: ShieldCheck },
    { label: 'Environment', value: data.release.environment || '—', icon: Activity },
    { label: 'System Health', value: data.overall, tone: STATUS_TONE[data.overall] || '', icon: Activity },
    { label: 'API Latency', value: data.avgLatency != null ? `${data.avgLatency}ms avg` : '—', icon: Clock },
    { label: 'Database Status', value: data.db?.status || '—', tone: STATUS_TONE[data.db?.status] || '', icon: Database },
    { label: 'Storage Status', value: data.storage?.status || '—', tone: STATUS_TONE[data.storage?.status] || '', icon: HardDrive },
    { label: 'Notifications', value: data.notifications?.status || '—', tone: STATUS_TONE[data.notifications?.status] || '', icon: Bell },
    { label: 'Online Members', value: data.onlineMembers, icon: Users },
    { label: 'Pending Reports', value: data.pendingReports, icon: Flag },
    { label: 'Error Count (24h)', value: data.errorCount24h, tone: data.errorCount24h > 0 ? 'text-warning' : 'text-success', icon: AlertTriangle },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{t('admin.production_overview')}</h3>
        <button type="button" onClick={load} className="text-xs text-primary">{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.label} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30">
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{r.label}</p>
                <p className={`text-sm font-semibold capitalize ${r.tone || ''}`}>{r.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}