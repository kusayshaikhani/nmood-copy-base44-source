import React, { useState } from 'react';
import { Bell, AlertTriangle, Plus, Check, ArrowUpRight, X } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const SEV_BADGE = { sev1: 'bg-destructive/15 text-destructive', sev2: 'bg-warning/15 text-warning', sev3: 'bg-info/15 text-info', sev4: 'bg-muted text-muted-foreground' };
const STATUS_BADGE = { open: 'bg-destructive/15 text-destructive', acknowledged: 'bg-warning/15 text-warning', resolved: 'bg-success/15 text-success', postmortem: 'bg-info/15 text-info', closed: 'bg-muted text-muted-foreground' };
const ALERT_SEV = { critical: 'bg-destructive/15 text-destructive', high: 'bg-warning/15 text-warning', warning: 'bg-info/15 text-info', info: 'bg-muted text-muted-foreground' };

/** RRPH-001 Sections 8 & 11 — Intelligent alerting + incident management. */
export default function PHAlerting({ data, onRan }) {
  const { t } = useLocalization();
  const d = data || {};
  const rules = d.alerts || [];
  const types = d.architecture?.alertTypes || [];
  const incidents = d.incidents || [];
  const [acting, setActing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', severity: 'sev3', subsystem: '', description: '' });

  const act = async (id, action) => {
    setActing(id);
    try { await base44.functions.invoke('productionHardening', { mode: 'incidentAction', incident_id: id, action }); onRan?.(); } catch (_e) {}
    setActing(null);
  };
  const create = async () => {
    if (!form.title) return;
    setCreating(true);
    try { await base44.functions.invoke('productionHardening', { mode: 'createIncident', ...form }); setForm({ title: '', severity: 'sev3', subsystem: '', description: '' }); onRan?.(); } catch (_e) {}
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <MCSection icon={Bell} title={t('mission.intelligent_alerts_section_8')}>
        <p className="text-xs text-muted-foreground mb-3">{t('mission.alert_types_and_notification_routing')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          {types.map((t) => (
            <div key={t.name} className="rounded-lg border bg-card/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{t.name.replace(/_/g, ' ')}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ALERT_SEV[t.severity]}`}>{t.severity}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">routes: {(t.channels || []).join(', ')}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{t('mission.configured_alert_rules')}</p>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40"><tr className="text-left">
              <th className="px-3 py-2 font-medium">{t('mission.rule')}</th><th className="px-3 py-2 font-medium">{t('mission.metric')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.condition')}</th><th className="px-3 py-2 font-medium">{t('mission.severity')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.channels')}</th><th className="px-3 py-2 font-medium">{t('mission.enabled')}</th>
            </tr></thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 font-mono">{r.metric}</td>
                  <td className="px-3 py-2">{r.condition}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${ALERT_SEV[r.severity]}`}>{r.severity}</span></td>
                  <td className="px-3 py-2 text-muted-foreground">{(r.channels || []).join(', ')}</td>
                  <td className="px-3 py-2">{r.enabled ? '✓' : '—'}</td>
                </tr>
              ))}
              {!rules.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">{t('mission.no_alert_rules_yet_click')}</td></tr>}
            </tbody>
          </table>
        </div>
      </MCSection>

      <MCSection icon={AlertTriangle} title={`Incident Management (Section 11) — ${incidents.length} records`}>
        <div className="rounded-lg border bg-card/40 p-3 mb-3">
          <p className="text-xs font-medium mb-2">{t('mission.create_incident')}</p>
          <div className="grid sm:grid-cols-4 gap-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('admin.title')} className="bg-card border rounded-lg text-sm px-2.5 py-1.5 sm:col-span-2" />
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="bg-card border rounded-lg text-sm px-2.5 py-1.5">
              {['sev1', 'sev2', 'sev3', 'sev4'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button size="sm" onClick={create} disabled={creating || !form.title} className="h-9 gap-1.5"><Plus className="w-4 h-4" /> {t('mission.create')}</Button>
          </div>
          <input value={form.subsystem} onChange={(e) => setForm({ ...form, subsystem: e.target.value })} placeholder={t('mission.subsystem_eg_api_database')} className="bg-card border rounded-lg text-sm px-2.5 py-1.5 w-full mt-2" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('admin.description')} rows={2} className="bg-card border rounded-lg text-sm px-2.5 py-1.5 w-full mt-2" />
        </div>
        <div className="space-y-2">
          {incidents.map((i) => (
            <div key={i.id} className="rounded-lg border bg-card/60 p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SEV_BADGE[i.severity]}`}>{i.severity}</span>
                  <p className="text-sm font-medium">{i.title}</p>
                  {i.subsystem && <span className="text-xs text-muted-foreground">· {i.subsystem}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_BADGE[i.status]}`}>{i.status}</span>
                  {i.status === 'open' && <Button size="sm" variant="outline" onClick={() => act(i.id, 'acknowledge')} disabled={acting === i.id} className="h-7 gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> {t('mission.acknowledge')}</Button>}
                  {(i.status === 'open' || i.status === 'acknowledged') && <Button size="sm" variant="outline" onClick={() => act(i.id, 'resolve')} disabled={acting === i.id} className="h-7 gap-1"><Check className="w-3.5 h-3.5 text-success" /> {t('admin.resolve')}</Button>}
                  {i.status === 'resolved' && <Button size="sm" variant="outline" onClick={() => act(i.id, 'postmortem')} disabled={acting === i.id} className="h-7 gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {t('mission.postmortem')}</Button>}
                  {i.status === 'postmortem' && <Button size="sm" variant="outline" onClick={() => act(i.id, 'close')} disabled={acting === i.id} className="h-7 gap-1"><X className="w-3.5 h-3.5" /> {t('mission.close')}</Button>}
                </div>
              </div>
              {i.description && <p className="text-xs text-muted-foreground mt-1">{i.description}</p>}
              {i.resolution && <p className="text-xs text-success/80 mt-1">Resolution: {i.resolution}</p>}
            </div>
          ))}
          {!incidents.length && <p className="text-xs text-muted-foreground">{t('mission.no_incidents_recorded')}</p>}
        </div>
      </MCSection>
    </div>
  );
}