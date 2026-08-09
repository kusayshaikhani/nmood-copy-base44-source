import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import HealthDot from '@/components/ops/HealthDot';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsHealth() {
  const { t } = useLocalization();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('systemOps', { mode: 'health' });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('mission.system_health')}</h1>
          <p className="text-sm text-muted-foreground">{t('mission.live_status_of_all_platform')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          {t('admin.refresh')}
        </Button>
      </div>

      <Card className="p-4 flex items-center gap-3">
        <HealthDot status={data?.overall || 'healthy'} />
        <span className="font-semibold">Overall: {data?.overall ? data.overall.charAt(0).toUpperCase() + data.overall.slice(1) : '—'}</span>
        <span className="text-xs text-muted-foreground">Last checked {new Date().toLocaleTimeString()}</span>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data?.probes || []).map((p) => (
          <Card key={p.name} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{p.name}</h3>
              <HealthDot status={p.status} withLabel />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.detail}</span>
              <span className="font-mono">{p.latency}</span>
            </div>
          </Card>
        ))}
        {loading && !data && (
          <Card className="p-8 col-span-full text-center text-sm text-muted-foreground">{t('mission.probing_subsystems')}</Card>
        )}
        {!loading && !data && (
          <Card className="p-8 col-span-full text-center text-sm text-destructive">{t('mission.unable_to_reach_health_endpoint')}</Card>
        )}
      </div>
    </div>
  );
}