import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import {
  buildOwaspReport, buildRiskAssessment, buildDailySummary, buildIncidentReport, buildAbuseReport, OWASP_FINDINGS,
} from '@/lib/security-manager';
import { ShieldCheck, ShieldAlert, Lock, Ban, Activity, Users, AlertTriangle, Upload, Bell, FileDown } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const THREAT_TONE = { low: 'text-success', medium: 'text-warning', high: 'text-destructive', critical: 'text-destructive' };

function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function SecurityCenter() {
  const { t } = useLocalization();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('securityOps', { mode: 'dashboard' });
      setData(res);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const score = data?.security_score ?? 0;
  const scoreTone = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';

  const cards = [
    { label: 'Failed Logins (24h)', value: data?.failed_logins_24h ?? '—', icon: Lock, tone: 'text-destructive' },
    { label: 'Blocked Requests', value: data?.blocked_requests ?? '—', icon: Ban, tone: 'text-destructive' },
    { label: 'Rate Limit Events', value: data?.rate_limit_events ?? '—', icon: Activity, tone: 'text-warning' },
    { label: 'Suspicious Accounts', value: data?.suspicious_accounts ?? '—', icon: Users, tone: 'text-warning' },
    { label: 'Spam Detection', value: data?.spam_detection ?? '—', icon: AlertTriangle, tone: 'text-warning' },
    { label: 'Upload Rejections', value: data?.upload_rejections ?? '—', icon: Upload, tone: 'text-destructive' },
    { label: 'Security Alerts', value: data?.security_alerts ?? '—', icon: Bell, tone: 'text-destructive' },
    { label: 'Total Events', value: data?.total_events ?? '—', icon: Activity, tone: 'text-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('admin.security_center')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.threat_monitoring_incident_tracking_owasp')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 flex flex-col items-center justify-center">
          <ShieldCheck className={`w-6 h-6 mb-1 ${scoreTone}`} />
          <p className="text-3xl font-bold">{score}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t('admin.security_score')}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <ShieldAlert className={`w-6 h-6 mb-1 ${THREAT_TONE[data?.threat_level] || 'text-muted-foreground'}`} />
          <p className="text-lg font-bold capitalize">{data?.threat_level || '—'}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t('admin.threat_level')}</p>
        </Card>
        {cards.slice(0, 2).map((c) => (
          <Card key={c.label} className="p-4 flex flex-col items-center justify-center">
            <c.icon className={`w-6 h-6 mb-1 ${c.tone}`} />
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.slice(2).map((c) => (
          <Card key={c.label} className="p-4 flex items-center gap-3">
            <c.icon className={`w-5 h-5 ${c.tone}`} />
            <div>
              <p className="text-xl font-bold">{c.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.latest_incidents')}</h3>
        {data?.latest_incidents?.length ? (
          <div className="space-y-1.5">
            {data.latest_incidents.map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-1.5 border-b border-border/60 last:border-0 text-sm">
                <span className={`text-xs font-semibold capitalize w-20 ${THREAT_TONE[i.risk_level] || ''}`}>{i.risk_level}</span>
                <span className="text-xs text-muted-foreground w-32 truncate">{i.category}</span>
                <span className="flex-1 truncate">{i.action} — {i.details}</span>
                <span className="text-xs text-muted-foreground">{i.created_date ? new Date(i.created_date).toLocaleTimeString() : ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('admin.no_recent_security_incidents')}</p>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.owasp_top_10_compliance')}</h3>
        <div className="space-y-2">
          {OWASP_FINDINGS.map((f) => (
            <div key={f.id} className="flex items-start gap-3 py-1.5 border-b border-border/60 last:border-0">
              <span className="text-xs font-mono text-muted-foreground w-8">{f.id}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.detail}</p>
              </div>
              <span className={`text-xs font-semibold capitalize ${f.status === 'compliant' ? 'text-success' : 'text-warning'}`}>{f.status}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.security_reports')}</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => download('security-daily-summary.json', buildDailySummary(data))}><FileDown className="w-4 h-4" /> {t('admin.daily_summary')}</Button>
          <Button variant="outline" size="sm" onClick={() => download('security-incidents.json', buildIncidentReport(data?.latest_incidents || []))}><FileDown className="w-4 h-4" /> {t('admin.incident_report')}</Button>
          <Button variant="outline" size="sm" onClick={() => download('security-risk-assessment.json', buildRiskAssessment(data))}><FileDown className="w-4 h-4" /> {t('admin.risk_assessment')}</Button>
          <Button variant="outline" size="sm" onClick={() => download('security-owasp.json', buildOwaspReport())}><FileDown className="w-4 h-4" /> {t('admin.owasp_report')}</Button>
          <Button variant="outline" size="sm" onClick={() => download('security-abuse.json', buildAbuseReport(data?.latest_incidents || []))}><FileDown className="w-4 h-4" /> {t('admin.abuse_report')}</Button>
        </div>
      </Card>
    </div>
  );
}