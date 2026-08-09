import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';
import HealthDot from '@/components/ops/HealthDot';
import { useLocalization } from '@/lib/i18n/useLocalization';

const SEVERITY_COLOR = {
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
  fatal: 'bg-destructive text-destructive-foreground',
};

export default function OpsErrors() {
  const { t } = useLocalization();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('systemOps', { mode: 'listErrors' });
      setData(res?.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('mission.error_log')}</h1>
          <p className="text-sm text-muted-foreground">{t('mission.unexpected_application_errors_captured_automatically')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          {t('admin.refresh')}
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-border">
          {data.length === 0 && !loading && (
            <div className="p-8 text-center text-sm text-muted-foreground">{t('admin.no_errors_recorded')}</div>
          )}
          {data.map((e) => (
            <div key={e.id} className="p-4 hover:bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ' + (SEVERITY_COLOR[e.severity] || SEVERITY_COLOR.error)}>
                      {e.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{e.screen || '—'}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{e.platform}</span>
                    {e.user_id && <span className="text-xs text-muted-foreground">· user {e.user_id.slice(-6)}</span>}
                  </div>
                  <p className="text-sm font-medium truncate">{e.message}</p>
                  {e.stack_trace && (
                    <pre className="mt-2 text-[11px] text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto max-h-24 whitespace-pre-wrap">{e.stack_trace.slice(0, 500)}</pre>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {e.created_date ? new Date(e.created_date).toLocaleString() : ''}
                </div>
              </div>
            </div>
          ))}
          {loading && <div className="p-8 text-center text-sm text-muted-foreground">{t('mission.loading_errors')}</div>}
        </div>
      </Card>
    </div>
  );
}