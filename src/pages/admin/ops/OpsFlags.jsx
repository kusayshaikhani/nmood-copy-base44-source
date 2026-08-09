import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_FLAGS } from '@/lib/feature-flags';
import { useLocalization } from '@/lib/i18n/useLocalization';

const CATEGORY_COLOR = {
  ai: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  premium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  beta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  seasonal: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  core: 'bg-muted text-muted-foreground',
};

export default function OpsFlags() {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('systemOps', { mode: 'listFlags' });
      setFlags(res?.flags || []);
    } catch {
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (key, enabled) => {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)));
    try {
      await base44.functions.invoke('systemOps', { mode: 'setFlag', key, enabled });
      toast({ title: enabled ? 'Feature enabled' : 'Feature disabled', description: key });
    } catch {
      setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !enabled } : f)));
      toast({ title: 'Failed to update flag', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t('admin.feature_flags')}</h1>
        <p className="text-sm text-muted-foreground">{t('mission.enable_or_disable_features_without')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading && <Card className="p-8 text-center text-sm text-muted-foreground col-span-full">{t('mission.loading_flags')}</Card>}
        {flags.map((f) => (
          <Card key={f.key} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">{f.name}</h3>
                  <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ' + (CATEGORY_COLOR[f.category] || CATEGORY_COLOR.core)}>{f.category}</span>
                </div>
                <p className="text-xs text-muted-foreground">{f.description}</p>
                <p className="text-[11px] text-muted-foreground/70 font-mono mt-1">{f.key}</p>
              </div>
              <Switch checked={!!f.enabled} onCheckedChange={(v) => toggle(f.key, v)} />
            </div>
          </Card>
        ))}
        {!loading && flags.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground col-span-full">{t('mission.no_flags_configured')}</Card>
        )}
      </div>
    </div>
  );
}