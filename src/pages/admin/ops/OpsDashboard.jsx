import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import HealthDot from '@/components/ops/HealthDot';
import FounderDailyBrief from '@/components/ops/FounderDailyBrief';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Activity, ShieldCheck, AlertTriangle, Gauge, Bug, ScrollText, Rocket, ClipboardCheck } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsDashboard() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [backup, setBackup] = useState(null);
  const [perf, setPerf] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, b, p, e] = await Promise.all([
        base44.functions.invoke('systemOps', { mode: 'health' }).catch(() => null),
        base44.functions.invoke('systemOps', { mode: 'backupStatus' }).catch(() => null),
        base44.functions.invoke('systemOps', { mode: 'listMetrics' }).catch(() => null),
        base44.functions.invoke('systemOps', { mode: 'listErrors' }).catch(() => null),
      ]);
      setHealth(h);
      setBackup(b);
      setPerf(p?.summary || []);
      setErrors((e?.data || []).slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tiles = [
    { label: 'System Health', icon: Activity, path: '/admin/ops/health', status: health?.overall },
    { label: 'Release Info', icon: Rocket, path: '/admin/ops/releases' },
    { label: 'Error Log', icon: Bug, path: '/admin/ops/errors', badge: errors.length },
    { label: 'Audit Trail', icon: ScrollText, path: '/admin/ops/audit' },
    { label: 'Feature Flags', icon: ShieldCheck, path: '/admin/ops/flags' },
    { label: 'Performance', icon: Gauge, path: '/admin/ops/performance' },
    { label: 'Acceptance Testing', icon: ClipboardCheck, path: '/admin/ops/acceptance-testing' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('mission.ops_dashboard')}</h1>
          <p className="text-sm text-muted-foreground">{t('mission.production_readiness_platform_health_at')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          {t('admin.refresh')}
        </Button>
      </div>

      <FounderDailyBrief />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map((t) => (
          <button
            key={t.path}
            onClick={() => navigate(t.path)}
            className="text-left"
          >
            <Card className="p-3 hover:bg-muted/30 transition-default h-full">
              <div className="flex items-center justify-between mb-2">
                <t.icon className="w-4 h-4 text-muted-foreground" />
                {t.status && <HealthDot status={t.status} />}
                {t.badge ? <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 rounded-full">{t.badge}</span> : null}
              </div>
              <p className="text-xs font-medium">{t.label}</p>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">{t('mission.subsystem_status')}</h2>
            {health?.overall && <HealthDot status={health.overall} withLabel />}
          </div>
          <div className="space-y-2">
            {(health?.probes || []).map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{p.latency}</span>
                  <HealthDot status={p.status} />
                </div>
              </div>
            ))}
            {loading && !health && <p className="text-xs text-muted-foreground">{t('mission.probing')}</p>}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3">{t('mission.backup_recovery')}</h2>
          {backup ? (
            <div className="space-y-2 text-xs">
              <Row label="Status" value={<HealthDot status={backup.status} withLabel />} />
              <Row label="Provider" value={backup.provider} />
              <Row label="Frequency" value={backup.frequency} />
              <Row label="Last Backup" value={new Date(backup.last_backup).toLocaleString()} />
              <Row label="Retention" value={backup.retention} />
              <Row label="Encryption" value={backup.encryption} />
              <p className="text-muted-foreground pt-2 border-t border-border mt-2">{backup.recovery}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t('mission.loading_backup_status')}</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3">{t('mission.performance_avg_latency')}</h2>
          {perf.length ? (
            <div className="space-y-2">
              {perf.map((s) => (
                <div key={s.metric_name} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{s.metric_name.replace(/_/g, ' ')}</span>
                  <span className="font-mono">{s.avg_ms}ms <span className="text-muted-foreground">({s.count})</span></span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground">{t('mission.no_samples_yet')}</p>}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">{t('mission.recent_errors')}</h2>
            {errors.length > 0 && <AlertTriangle className="w-4 h-4 text-warning" />}
          </div>
          {errors.length ? (
            <div className="space-y-2">
              {errors.map((e) => (
                <div key={e.id} className="text-xs">
                  <p className="font-medium truncate">{e.message}</p>
                  <p className="text-muted-foreground">{e.screen} · {new Date(e.created_date).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground">{t('mission.no_errors_recorded')}</p>}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}