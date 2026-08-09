import React, { useState, useMemo } from 'react';
import { Shield, AlertTriangle, Eye, Lock, KeyRound, Mail, RefreshCw } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import BiTable from '../bi/BiTable';
import { downloadCsv } from '@/lib/ops-export';
import { dayKey } from '@/lib/bi-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const RISKS = ['informational', 'low', 'medium', 'high', 'critical'];
const CATS = ['auth_failure', 'permission_violation', 'rate_limit', 'spam', 'blocked_request', 'security_config', 'abuse', 'suspicious_account', 'bot_detection', 'other'];

export default function OpsSecurity({ security }) {
  const { t } = useLocalization();
  const s = security || {};
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [risk, setRisk] = useState('all');
  const rows = useMemo(() => {
    return (s.events || []).filter((e) => {
      if (cat !== 'all' && e.category !== cat) return false;
      if (risk !== 'all' && e.risk_level !== risk) return false;
      if (q && !(String(e.actor || '') + e.action + e.category + (e.details || '')).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [s.events, q, cat, risk]);

  const kpis = [
    { icon: Lock, label: 'Failed Logins', value: s.failedLogins ?? 0, color: 'warning' },
    { icon: Eye, label: 'Suspicious Activity', value: s.suspiciousActivity ?? 0, color: 'warning' },
    { icon: KeyRound, label: 'Locked Accounts', value: s.lockedAccounts ?? 0, color: 'info' },
    { icon: Shield, label: 'API Security Events', value: s.apiSecurityEvents ?? 0, color: 'info' },
    { icon: AlertTriangle, label: 'Security Incidents', value: s.incidents ?? 0, color: s.incidents ? 'destructive' : 'success' },
    { icon: RefreshCw, label: 'Password Resets', value: s.passwordResets == null ? 'Soon' : s.passwordResets, color: 'info' },
    { icon: Shield, label: 'Active Sessions', value: s.activeSessions == null ? 'Soon' : s.activeSessions, color: 'info' },
    { icon: Mail, label: 'MFA Status', value: s.mfaStatus == null ? 'Soon' : s.mfaStatus, color: 'info' },
  ];

  const exportRows = rows.map((e) => ({ date: dayKey(e.created_date), actor: e.actor, risk: e.risk_level, category: e.category, action: e.action, details: e.details, ip: e.ip_address }));

  return (
    <div className="space-y-4">
      <MCKpiGrid>{kpis.map((k) => <MCKpiCard key={k.label} {...k} />)}</MCKpiGrid>
      <MCSection icon={Shield} title={t('mission.security_events')}
        action={<button onClick={() => downloadCsv(`nmood-security-${dayKey(Date.now())}.csv`, exportRows)} className="text-xs px-2 py-1 rounded-lg border hover:bg-muted">{t('mission.export_csv')}</button>}>
        <div className="flex flex-wrap gap-2 mb-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('mission.search_actor_action_details')} className="bg-card border rounded-lg text-sm px-3 py-1.5 flex-1 min-w-[200px]" />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-card border rounded-lg text-sm px-2 py-1.5"><option value="all">{t('mission.all_categories')}</option>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <select value={risk} onChange={(e) => setRisk(e.target.value)} className="bg-card border rounded-lg text-sm px-2 py-1.5"><option value="all">{t('mission.all_risk')}</option>{RISKS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
        </div>
        <BiTable columns={[{ key: 'date', label: 'Date' }, { key: 'actor', label: 'Actor' }, { key: 'risk', label: 'Risk' }, { key: 'category', label: 'Category' }, { key: 'action', label: 'Action' }, { key: 'ip', label: 'IP' }]} rows={exportRows} />
      </MCSection>
    </div>
  );
}