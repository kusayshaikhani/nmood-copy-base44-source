import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { dayKey } from '@/lib/bi-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsGlobalSearch({ data }) {
  const { t } = useLocalization();
  const [q, setQ] = useState('');
  const ql = q.toLowerCase();
  const results = useMemo(() => {
    if (!q) return null;
    const audit = (data?.auditLogs || []).filter((l) => (String(l.administrator || '') + l.action + (l.details || '')).toLowerCase().includes(ql)).slice(0, 5).map((l) => ({ type: 'Audit', label: l.action, meta: l.administrator, date: dayKey(l.created_date) }));
    const sec = (data?.securityEvents || []).filter((s) => (s.actor + s.action + (s.details || '')).toLowerCase().includes(ql)).slice(0, 5).map((s) => ({ type: 'Security', label: s.action, meta: s.actor, date: dayKey(s.created_date) }));
    const logs = (data?.errorLogs || []).filter((e) => ((e.message || '') + (e.screen || '')).toLowerCase().includes(ql)).slice(0, 5).map((e) => ({ type: 'Log', label: String(e.message || '').slice(0, 60), meta: e.severity, date: dayKey(e.created_date) }));
    const flags = (data?.featureFlags || []).filter((f) => ((f.key || '') + (f.name || '')).toLowerCase().includes(ql)).slice(0, 5).map((f) => ({ type: 'Flag', label: f.name || f.key, meta: f.enabled ? 'on' : 'off', date: '' }));
    const cfg = (data?.systemConfig || []).filter((c) => ((c.key || '') + (c.value || '')).toLowerCase().includes(ql)).slice(0, 5).map((c) => ({ type: 'Config', label: c.key, meta: String(c.value || '').slice(0, 40), date: '' }));
    return [...audit, ...sec, ...logs, ...flags, ...cfg];
  }, [q, data, ql]);
  return (
    <MCSection icon={Search} title={t('mission.global_search')}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('mission.search_audit_security_logs_flags')} className="bg-card border rounded-lg text-sm px-3 py-2 w-full" />
      {results && (
        <div className="mt-3 space-y-1">
          {!results.length && <p className="text-sm text-muted-foreground text-center py-4">{t('mission.no_matches')}</p>}
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-card/40 px-3 py-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">{r.type}</span>
              <span className="text-sm truncate flex-1">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.meta}</span>
              {r.date && <span className="text-xs text-muted-foreground">{r.date}</span>}
            </div>
          ))}
        </div>
      )}
    </MCSection>
  );
}