import React, { useState } from 'react';
import { FileBarChart, Download, Printer } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { safe, dayKey } from '@/lib/bi-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const REPORTS = [
  { id: 'member', label: 'Member Report', cols: ['display_name', 'email', 'country', 'city', 'phone_verified', 'created_date'] },
  { id: 'growth', label: 'Growth Report', cols: ['label', 'members', 'experiences', 'circles', 'connections'] },
  { id: 'membership', label: 'Membership Report', cols: ['type', 'status', 'plan', 'started_date', 'renewal_date', 'billing_platform'] },
  { id: 'experience', label: 'Experience Report', cols: ['title', 'category', 'status', 'date', 'location', 'spots_filled', 'max_participants'] },
  { id: 'circle', label: 'Circle Report', cols: ['name', 'category', 'status', 'privacy', 'member_count', 'max_members'] },
  { id: 'geographic', label: 'Geographic Report', cols: ['name', 'count'] },
  { id: 'language', label: 'Language Report', cols: ['name', 'count'] },
  { id: 'engagement', label: 'Engagement Report', cols: ['metric', 'value'] },
];

function buildRows(type, data, metrics) {
  switch (type) {
    case 'member':
      return safe(data?.members).map((m) => ({
        display_name: m.display_name, email: m.email || '', country: m.country || '', city: m.city || '',
        phone_verified: m.phone_verified ? 'Yes' : 'No', created_date: dayKey(m.created_date),
      }));
    case 'growth':
      return metrics?.growth?.daily || [];
    case 'membership':
      return safe(data?.memberships).map((m) => ({
        type: m.type, status: m.status, plan: m.plan || '', started_date: m.started_date || '',
        renewal_date: m.renewal_date || '', billing_platform: m.billing_platform || '',
      }));
    case 'experience':
      return safe(data?.experiences).map((e) => ({
        title: e.title, category: e.category || '', status: e.status, date: e.date || '',
        location: e.location || '', spots_filled: e.spots_filled || 0, max_participants: e.max_participants || 0,
      }));
    case 'circle':
      return safe(data?.circles).map((c) => ({
        name: c.name, category: c.category || '', status: c.status, privacy: c.privacy,
        member_count: c.member_count || 0, max_members: c.max_members || '',
      }));
    case 'geographic':
      return metrics?.geographic?.byCountry || [];
    case 'language':
      return metrics?.language?.preferred || [];
    case 'engagement': {
      const e = metrics?.engagement || {};
      return [
        { metric: 'Messages Sent', value: e.messagesSent || 0 },
        { metric: 'Connections Created', value: e.connectionsCreated || 0 },
        { metric: 'Experiences Joined', value: e.experiencesJoined || 0 },
        { metric: 'Experiences Completed', value: e.experiencesCompleted || 0 },
        { metric: 'Circles Joined', value: e.circlesJoined || 0 },
        { metric: 'Circle Activity', value: e.circleActivity || 0 },
      ];
    }
    default:
      return [];
  }
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** FM-010 — Report builder with CSV export (Excel/PDF prepared). */
export default function BiReportBuilder({ data, metrics, filters }) {
  const { t } = useLocalization();
  const [type, setType] = useState('member');
  const report = REPORTS.find((r) => r.id === type);
  const rows = buildRows(type, data, metrics);

  const handleCsv = () => download(`nmood-${type}-report-${dayKey(Date.now())}.csv`, toCsv(rows));
  const activeFilters = Object.entries(filters || {})
    .filter(([k, v]) => v !== 'all' && v !== 30)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  return (
    <div className="space-y-4">
      <MCSection icon={FileBarChart} title={t('mission.report_builder')}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted-foreground">{t('mission.report_type')}</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-card border rounded-lg text-sm px-3 py-2">
            {REPORTS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">Active filters: {activeFilters || 'none'}</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="default" onClick={handleCsv} className="gap-2">
              <Download className="w-4 h-4" /> {t('admin.csv')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" /> {t('mission.pdf_print')}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {rows.length} rows ready · Columns: {report.cols.join(', ')}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {t('mission.excel_export_is_coming_soon')}
        </p>
      </MCSection>
      <MCSection title={t('mission.preview')}>
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="text-left text-xs text-muted-foreground border-b">
                {report.cols.map((c) => <th key={c} className="py-2 px-2 font-medium">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  {report.cols.map((c) => <td key={c} className="py-2 px-2">{String(r[c] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="text-sm text-muted-foreground text-center py-6">{t('mission.no_rows_for_the_current')}</p>}
        </div>
      </MCSection>
    </div>
  );
}