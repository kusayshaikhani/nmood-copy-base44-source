import React, { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import BiTable from '../bi/BiTable';
import { downloadCsv } from '@/lib/ops-export';
import { dayKey } from '@/lib/bi-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const SEV = ['info', 'warning', 'error', 'fatal'];

export default function OpsLogs({ data }) {
  const { t } = useLocalization();
  const logs = data?.errorLogs || [];
  const [q, setQ] = useState('');
  const [sev, setSev] = useState('all');
  const [range, setRange] = useState('all');
  const now = Date.now();
  const since = range === 'today' ? now - 86400000 : range === '7d' ? now - 7 * 86400000 : 0;
  const rows = useMemo(() => logs.filter((l) => {
    if (sev !== 'all' && l.severity !== sev) return false;
    if (since && new Date(l.created_date).getTime() < since) return false;
    if (q && !((l.message || '') + (l.screen || '')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [logs, sev, range, q]);
  const tableRows = rows.slice(0, 100).map((l) => ({ date: dayKey(l.created_date), severity: l.severity, screen: l.screen || '—', message: String(l.message || '').slice(0, 120) }));
  return (
    <MCSection icon={FileText} title={t('mission.system_logs')}
      action={<button onClick={() => downloadCsv(`nmood-logs-${dayKey(Date.now())}.csv`, rows.map((l) => ({ date: dayKey(l.created_date), severity: l.severity, screen: l.screen, platform: l.platform, app_version: l.app_version, message: l.message })))} className="text-xs px-2 py-1 rounded-lg border hover:bg-muted">{t('mission.export_csv')}</button>}>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('mission.search_message_screen')} className="bg-card border rounded-lg text-sm px-3 py-1.5 flex-1 min-w-[200px]" />
        <select value={sev} onChange={(e) => setSev(e.target.value)} className="bg-card border rounded-lg text-sm px-2 py-1.5"><option value="all">{t('mission.all_severity')}</option>{SEV.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="bg-card border rounded-lg text-sm px-2 py-1.5"><option value="all">{t('mission.all_time')}</option><option value="today">{t('mission.today')}</option><option value="7d">{t('mission.7_days')}</option></select>
      </div>
      <BiTable columns={[{ key: 'date', label: 'Date' }, { key: 'severity', label: 'Severity' }, { key: 'screen', label: 'Screen' }, { key: 'message', label: 'Message' }]} rows={tableRows} emptyLabel="No logs" />
      <p className="text-xs text-muted-foreground/70 mt-2">Showing first 100 of {rows.length}. Sensitive system information is never exposed.</p>
    </MCSection>
  );
}