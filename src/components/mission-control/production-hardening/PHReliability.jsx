import React, { useState } from 'react';
import { ShieldCheck, Database, Play } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_COLOR = { enabled: 'text-info', prepared: 'text-warning' };

/** RRPH-001 Sections 4 & 5 — Reliability patterns + backup management. */
export default function PHReliability({ data, onRan }) {
  const { t } = useLocalization();
  const d = data || {};
  const patterns = d.architecture?.reliabilityPatterns || [];
  const backups = d.backups || [];
  const [creating, setCreating] = useState(false);

  const createBackup = async () => {
    setCreating(true);
    try { await base44.functions.invoke('productionHardening', { mode: 'createBackup', type: 'database' }); onRan?.(); } catch (_e) {}
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <MCSection icon={ShieldCheck} title={t('mission.reliability_patterns_section_4')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {patterns.map((p) => (
            <div key={p.name} className="rounded-lg border bg-card/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{p.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-muted capitalize ${STATUS_COLOR[p.status] || 'text-muted-foreground'}`}>{p.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{p.detail}</p>
            </div>
          ))}
        </div>
      </MCSection>

      <MCSection icon={Database} title={t('mission.backup_management_section_5')}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{t('mission.automatic_backups_verification_restore_retention')}</p>
          <Button size="sm" variant="outline" onClick={createBackup} disabled={creating} className="h-8 gap-1.5"><Play className="w-3.5 h-3.5" /> {creating ? 'Backing up…' : 'Manual Backup'}</Button>
        </div>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40"><tr className="text-left">
              <th className="px-3 py-2 font-medium">{t('mission.type')}</th><th className="px-3 py-2 font-medium">{t('admin.status')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.size_mb')}</th><th className="px-3 py-2 font-medium">{t('mission.duration')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.verified')}</th><th className="px-3 py-2 font-medium">{t('mission.retention')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.trigger')}</th><th className="px-3 py-2 font-medium">{t('mission.created')}</th>
            </tr></thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium capitalize">{b.type}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${b.status === 'completed' || b.status === 'verified' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>{b.status}</span></td>
                  <td className="px-3 py-2">{b.size_mb}</td>
                  <td className="px-3 py-2">{(b.duration_ms / 1000).toFixed(1)}s</td>
                  <td className="px-3 py-2">{b.verified ? '✓' : '—'}</td>
                  <td className="px-3 py-2">{b.retention_days}d</td>
                  <td className="px-3 py-2 capitalize">{b.trigger}</td>
                  <td className="px-3 py-2 text-muted-foreground">{b.created_date ? new Date(b.created_date).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {!backups.length && <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">{t('mission.no_backups_recorded_yet')}</td></tr>}
            </tbody>
          </table>
        </div>
      </MCSection>
    </div>
  );
}