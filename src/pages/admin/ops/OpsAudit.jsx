import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsAudit() {
  const { t } = useLocalization();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('systemOps', { mode: 'listAudit' });
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
          <h1 className="text-xl font-bold">{t('mission.audit_log')}</h1>
          <p className="text-sm text-muted-foreground">{t('mission.every_administrative_action_recorded_with')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          {t('admin.refresh')}
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-border">
          {data.length === 0 && !loading && (
            <div className="p-8 text-center text-sm text-muted-foreground">{t('mission.no_administrative_actions_recorded_yet')}</div>
          )}
          {data.map((a) => (
            <div key={a.id} className="p-4 hover:bg-muted/30 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold font-mono">{a.action}</span>
                  {a.target_type && <span className="text-xs text-muted-foreground">→ {a.target_type}{a.target_id ? ':' + a.target_id.slice(-6) : ''}</span>}
                </div>
                {a.details && <p className="text-xs text-muted-foreground">{a.details}</p>}
                <p className="text-xs text-muted-foreground mt-1">by {a.administrator}</p>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {a.created_date ? new Date(a.created_date).toLocaleString() : ''}
              </div>
            </div>
          ))}
          {loading && <div className="p-8 text-center text-sm text-muted-foreground">{t('mission.loading_audit_log')}</div>}
        </div>
      </Card>
    </div>
  );
}