import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_CONFIG, BRAND } from '@/lib/system-config';
import { Save } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const GROUPS = [
  { id: 'branding', label: 'Branding', keys: ['app_name', 'slogan_line_1', 'slogan_line_2', 'slogan_inline'] },
  { id: 'contact', label: 'Contact', keys: ['support_email', 'contact_email', 'contact_phone'] },
  { id: 'legal', label: 'Legal', keys: ['terms_url', 'privacy_url'] },
  { id: 'build', label: 'Build', keys: ['version', 'build_number', 'environment'] },
];

export default function OpsConfig() {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [draft, setDraft] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('systemOps', { mode: 'getConfig' });
      const merged = { ...DEFAULT_CONFIG, ...(res?.config || {}) };
      setConfig(merged);
      setDraft(merged);
    } catch {
      setConfig(DEFAULT_CONFIG);
      setDraft(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (key, category) => {
    setSaving(key);
    try {
      await base44.functions.invoke('systemOps', { mode: 'setConfig', key, value: draft[key], category });
      setConfig((c) => ({ ...c, [key]: draft[key] }));
      toast({ title: 'Saved', description: `${key} updated` });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">{t('mission.loading_configuration')}</Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t('mission.system_configuration')}</h1>
        <p className="text-sm text-muted-foreground">{t('mission.centralized_values_branding_contact_legal')}</p>
      </div>

      <Card className="p-4 bg-primary/5 border-primary/20">
        <p className="text-xs text-muted-foreground mb-1">{t('mission.official_slogan_locked_source')}</p>
        <p className="text-base font-semibold">{BRAND.slogan_line_1}<br />{BRAND.slogan_line_2}</p>
        <p className="text-xs text-muted-foreground mt-2">{t('mission.the_slogan_literal_lives_only')} <code>{t('mission.srclibsystemconfigjs')}</code>{t('mission.overrides_below_are_applied_at')}</p>
      </Card>

      {GROUPS.map((g) => (
        <Card key={g.id} className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">{g.label}</h2>
          <div className="space-y-3">
            {g.keys.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-32 flex-shrink-0 font-mono">{k}</label>
                <Input
                  value={draft[k] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant={draft[k] !== config[k] ? 'default' : 'outline'}
                  disabled={draft[k] === config[k] || saving === k}
                  onClick={() => save(k, g.id)}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving === k ? 'Saving…' : 'Save'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}