import React from 'react';
import { Download } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { downloadCsv } from '@/lib/ops-export';
import { dayKey } from '@/lib/bi-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsExport({ data }) {
  const { t } = useLocalization();
  const d = dayKey(Date.now());
  const reports = [
    { label: 'Audit Logs', name: 'audit', rows: (data?.auditLogs || []).map((l) => ({ date: dayKey(l.created_date), administrator: l.administrator, action: l.action, target_type: l.target_type, target_id: l.target_id, ip: l.ip_address, details: l.details })) },
    { label: 'Security Report', name: 'security', rows: (data?.securityEvents || []).map((s) => ({ date: dayKey(s.created_date), actor: s.actor, risk: s.risk_level, category: s.category, action: s.action, ip: s.ip_address, details: s.details })) },
    { label: 'System Report', name: 'system', rows: (data?.errorLogs || []).map((e) => ({ date: dayKey(e.created_date), severity: e.severity, screen: e.screen, platform: e.platform, message: e.message })) },
    { label: 'Configuration Report', name: 'configuration', rows: (data?.systemConfig || []).map((c) => ({ key: c.key, value: c.value, category: c.category })) },
  ];
  return (
    <MCSection icon={Download} title={t('mission.export_center')}>
      <div className="grid sm:grid-cols-2 gap-3">
        {reports.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-xl border bg-card/60 p-3">
            <div><p className="text-sm font-medium">{r.label}</p><p className="text-xs text-muted-foreground">{r.rows.length} rows</p></div>
            <Button size="sm" variant="outline" disabled={!r.rows.length} onClick={() => downloadCsv(`nmood-${r.name}-${d}.csv`, r.rows)} className="gap-2"><Download className="w-4 h-4" /> {t('admin.csv')}</Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/70 mt-3">{t('mission.excel_and_pdf_exports_are')}</p>
    </MCSection>
  );
}