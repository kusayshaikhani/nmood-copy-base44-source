import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const METRIC_LABEL = {
  app_startup: 'App Startup',
  home_load: 'Home Load',
  search_response: 'Search Response',
  experience_creation: 'Experience Creation',
  api_latency: 'API Latency',
};

export default function OpsPerformance() {
  const { t } = useLocalization();
  const [summary, setSummary] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('systemOps', { mode: 'listMetrics' });
      setSummary(res?.summary || []);
      setRecent(res?.data || []);
    } catch {
      setSummary([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('mission.performance_monitoring')}</h1>
          <p className="text-sm text-muted-foreground">{t('mission.latency_across_key_member_flows')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          {t('admin.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {summary.length === 0 && !loading && (
          <Card className="p-6 col-span-full text-center text-sm text-muted-foreground">{t('mission.no_performance_samples_yet')}</Card>
        )}
        {summary.map((s) => (
          <Card key={s.metric_name} className="p-4">
            <h3 className="text-sm font-semibold mb-3">{METRIC_LABEL[s.metric_name] || s.metric_name}</h3>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-2xl font-bold">{s.avg_ms}</span>
              <span className="text-sm text-muted-foreground mb-1">{t('mission.ms_avg')}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{s.count} samples</span>
              <span>{s.min_ms}–{s.max_ms}ms</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">{t('mission.recent_samples')}</h2>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {recent.length === 0 && !loading && <div className="p-6 text-center text-sm text-muted-foreground">{t('mission.no_samples_recorded')}</div>}
          {recent.map((m) => (
            <div key={m.id} className="p-3 flex items-center justify-between text-xs">
              <span className="font-medium">{METRIC_LABEL[m.metric_name] || m.metric_name}</span>
              <span className="text-muted-foreground">{m.screen || '—'}</span>
              <span className="font-mono">{m.duration_ms}ms</span>
              <span className="text-muted-foreground">{m.created_date ? new Date(m.created_date).toLocaleTimeString() : ''}</span>
            </div>
          ))}
          {loading && <div className="p-6 text-center text-sm text-muted-foreground">{t('mission.loading')}</div>}
        </div>
      </Card>
    </div>
  );
}