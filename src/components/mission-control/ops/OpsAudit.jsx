import React, { useState, useMemo } from 'react';
import { ScrollText } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import BiTable from '../bi/BiTable';
import { downloadCsv } from '@/lib/ops-export';
import { dayKey } from '@/lib/bi-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const PAGE = 20;

export default function OpsAudit({ data }) {
  const { t } = useLocalization();
  const logs = data?.auditLogs || [];
  const [q, setQ] = useState('');
  const [action, setAction] = useState('all');
  const [page, setPage] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);

  const actions = useMemo(() => [...new Set(logs.map((l) => l.action).filter(Boolean))].sort(), [logs]);
  const filtered = useMemo(() => {
    let r = logs.filter((l) => {
      if (action !== 'all' && l.action !== action) return false;
      if (q && !(String(l.administrator || '') + l.action + (l.target_type || '') + (l.details || '')).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    r = [...r].sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
    if (sortDesc) r.reverse();
    return r;
  }, [logs, q, action, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const rows = pageRows.map((l) => ({
    date: dayKey(l.created_date),
    time: new Date(l.created_date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    administrator: l.administrator,
    action: l.action,
    target: (l.target_type || '') + (l.target_id ? ':' + String(l.target_id).slice(-6) : ''),
    ip: l.ip_address || '—',
  }));

  return (
    <MCSection icon={ScrollText} title={t('mission.audit_history_immutable')}
      action={<button onClick={() => downloadCsv(`nmood-audit-${dayKey(Date.now())}.csv`, filtered.map((l) => ({ date: dayKey(l.created_date), administrator: l.administrator, action: l.action, target_type: l.target_type, target_id: l.target_id, previous: l.previous_value, new: l.new_value, ip: l.ip_address, details: l.details })))} className="text-xs px-2 py-1 rounded-lg border hover:bg-muted">{t('mission.export_csv')}</button>}>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={t('mission.search_administrator_action_target')} className="bg-card border rounded-lg text-sm px-3 py-1.5 flex-1 min-w-[200px]" />
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} className="bg-card border rounded-lg text-sm px-2 py-1.5"><option value="all">{t('mission.all_actions')}</option>{actions.map((a) => <option key={a} value={a}>{a}</option>)}</select>
        <button onClick={() => setSortDesc((d) => !d)} className="text-xs px-2 py-1.5 rounded-lg border hover:bg-muted">{sortDesc ? 'Newest first' : 'Oldest first'}</button>
      </div>
      <BiTable columns={[{ key: 'date', label: 'Date' }, { key: 'time', label: 'Time' }, { key: 'administrator', label: 'Administrator' }, { key: 'action', label: 'Action' }, { key: 'target', label: 'Entity' }, { key: 'ip', label: 'IP' }]} rows={rows} />
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>{filtered.length} records · page {page + 1} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded-lg border disabled:opacity-40">{t('mission.prev')}</button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded-lg border disabled:opacity-40">{t('mission.next')}</button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground/70 mt-2">{t('mission.audit_records_are_appendonly_and')}</p>
    </MCSection>
  );
}