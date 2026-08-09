import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Printer, RefreshCw } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { updateCert } from '@/lib/launch-center-actions';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { cn } from '@/lib/utils';

const STATUSES = ['pending', 'complete', 'blocked'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

const STATUS_BADGE = {
  pending: 'bg-muted text-muted-foreground',
  complete: 'bg-success/15 text-success',
  blocked: 'bg-destructive/15 text-destructive',
};
const PRIORITY_BADGE = {
  critical: 'bg-destructive/15 text-destructive',
  high: 'bg-warning/15 text-warning',
  medium: 'bg-info/15 text-info',
  low: 'bg-muted text-muted-foreground',
};

function todayStr() {
  return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function LaunchDayChecklist() {
  const { t } = useLocalization();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('launchCenter', { mode: 'launchDay' });
      setItems(res?.items || []);
    } catch (_e) {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = async (id, field, value) => {
    setBusyId(id);
    const prev = items;
    setItems((cur) => (cur || []).map((it) => (it.id === id ? { ...it, [field]: value } : it)));
    try {
      await updateCert('LaunchChecklistItem', id, { [field]: value });
    } catch (_e) {
      setItems(prev);
    }
    setBusyId(null);
  };

  const completed = (items || []).filter((i) => i.status === 'complete').length;
  const total = (items || []).length;
  const blocked = (items || []).filter((i) => i.status === 'blocked').length;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #launch-day-print, #launch-day-print * { visibility: visible !important; }
          #launch-day-print { position: absolute; inset: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
          #launch-day-print table { font-size: 12pt; }
          #launch-day-print th, #launch-day-print td { border: 1px solid #ccc !important; color: #000 !important; }
          #launch-day-print select { display: none !important; }
          #launch-day-print .print-val { display: inline !important; }
        }
        @media screen { #launch-day-print .print-val { display: none; } }
      `}</style>
      <div id="launch-day-print">
        <MCSection icon={ClipboardCheck} title="Launch Day Checklist">
          {/* Print-only header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">Nmood — Launch Day Checklist</h1>
            <p className="text-sm">{todayStr()}</p>
            <hr className="my-3" />
          </div>

          {/* Screen controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 no-print">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">{completed}/{total} complete</span>
              {blocked > 0 && <span className="text-destructive">{blocked} blocked</span>}
              <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-success transition-all" style={{ width: total ? `${(completed / total) * 100}%` : '0%' }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8">
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
              </Button>
              <Button size="sm" onClick={() => window.print()} className="h-8">
                <Printer className="w-3.5 h-3.5" /> Print Checklist
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading launch day items…</div>
          ) : !items?.length ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No items found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="px-3 py-2 font-medium w-8">#</th>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium w-32">Status</th>
                    <th className="px-3 py-2 font-medium w-40">Owner</th>
                    <th className="px-3 py-2 font-medium w-32">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2.5 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-medium">{it.item}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('inline-block px-2 py-0.5 rounded-md text-xs font-medium capitalize print-val', STATUS_BADGE[it.status])}>{it.status}</span>
                        <select
                          value={it.status}
                          disabled={busyId === it.id}
                          onChange={(e) => patch(it.id, 'status', e.target.value)}
                          className={cn('no-print rounded-md border bg-background px-2 py-1 text-xs capitalize focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50', STATUS_BADGE[it.status])}
                          aria-label={`Status for ${it.item}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s} className="capitalize bg-background text-foreground">{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="print-val">{it.owner || '—'}</span>
                        <input
                          type="text"
                          value={it.owner || ''}
                          disabled={busyId === it.id}
                          placeholder="Assign…"
                          onChange={(e) => setItems((cur) => (cur || []).map((x) => (x.id === it.id ? { ...x, owner: e.target.value } : x)))}
                          onBlur={(e) => it.owner !== e.target.value && patch(it.id, 'owner', e.target.value)}
                          className="no-print w-full rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                          aria-label={`Owner for ${it.item}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('inline-block px-2 py-0.5 rounded-md text-xs font-medium capitalize print-val', PRIORITY_BADGE[it.priority])}>{it.priority}</span>
                        <select
                          value={it.priority}
                          disabled={busyId === it.id}
                          onChange={(e) => patch(it.id, 'priority', e.target.value)}
                          className={cn('no-print rounded-md border bg-background px-2 py-1 text-xs capitalize focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50', PRIORITY_BADGE[it.priority])}
                          aria-label={`Priority for ${it.item}`}
                        >
                          {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize bg-background text-foreground">{p}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Print-only signature footer */}
          <div className="hidden print:flex justify-between mt-10 text-sm">
            <div>Founder sign-off: ____________________</div>
            <div>DevOps sign-off: ____________________</div>
          </div>
        </MCSection>
      </div>
    </>
  );
}