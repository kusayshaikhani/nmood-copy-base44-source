import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, RefreshCw, FileDown } from 'lucide-react';
import { ALL_COMPLIANCE_ITEMS, COMPLIANCE_GROUPS } from '@/lib/compliance-readiness';
import { STATUSES } from '@/lib/store-readiness';
import StoreReadinessItem from '@/components/ops/StoreReadinessItem';
import StoreReadinessSummary from '@/components/ops/StoreReadinessSummary';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STORAGE_KEY = 'nmood:compliance-readiness-v1';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

export default function LegalCompliance() {
  const { t } = useLocalization();
  const [states, setStates] = useState(() => {
    const saved = load();
    const init = {};
    ALL_COMPLIANCE_ITEMS.forEach((i) => { init[i.id] = saved[i.id] || i.default; });
    return init;
  });
  const [notes, setNotes] = useState(() => load().notes || {});

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...states, notes })); } catch { /* quota */ }
  }, [states, notes]);

  const cycle = (id, next) => setStates((s) => ({ ...s, [id]: next }));
  const setNote = (id, val) => setNotes((n) => ({ ...n, [id]: val }));
  const reset = () => {
    const init = {};
    ALL_COMPLIANCE_ITEMS.forEach((i) => { init[i.id] = i.default; });
    setStates(init);
    setNotes({});
  };

  const totals = ALL_COMPLIANCE_ITEMS.reduce(
    (acc, i) => {
      const st = states[i.id] || i.default;
      if (st !== 'notApplicable') acc.actionable++;
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { completed: 0, missing: 0, needsFounder: 0, notApplicable: 0, actionable: 0 }
  );
  const ready = totals.actionable > 0 && totals.completed === totals.actionable && totals.missing === 0;
  const progress = totals.actionable ? Math.round((totals.completed / totals.actionable) * 100) : 0;

  const exportReport = () => {
    const date = new Date().toISOString();
    const meta = (st) => ({ completed: 'Completed', missing: 'Missing', needsFounder: 'Founder Action', notApplicable: 'N/A' }[st] || st);
    const lines = [
      'NMOOD — LEGAL & COMPLIANCE VERIFICATION',
      'Generated: ' + date,
      'Overall: ' + (ready ? 'COMPLIANCE READY' : 'NOT READY') + ` (${progress}%)`,
      '',
      ...COMPLIANCE_GROUPS.flatMap((g) => [
        '— ' + g.label.toUpperCase() + ' —',
        ...g.items.map((i) => `  [${meta(states[i.id] || i.default)}] ${i.label} — ${i.hint}`),
        '',
      ]),
      '— End of report —',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmood-legal-compliance-${date.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> {t('mission.legal_compliance_verification')}</h1>
          <p className="text-sm text-muted-foreground">{t('mission.ex003_verify_nmood_satisfies_legal')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}><RefreshCw className="w-4 h-4" /> {t('mission.reset')}</Button>
          <Button size="sm" onClick={exportReport}><FileDown className="w-4 h-4" /> {t('mission.export_report')}</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t('mission.compliance_readiness')}</span>
          <span className={'text-sm font-bold ' + (ready ? 'text-success' : 'text-muted-foreground')}>
            {progress}% · {ready ? 'READY' : 'IN PROGRESS'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={'h-full rounded-full transition-all ' + (ready ? 'bg-success' : 'bg-primary')} style={{ width: progress + '%' }} />
        </div>
      </div>

      <StoreReadinessSummary label="Overall Compliance" items={ALL_COMPLIANCE_ITEMS} states={states} />

      {COMPLIANCE_GROUPS.map((group) => (
        <section key={group.id}>
          <h2 className="text-sm font-bold mb-2">{group.label}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {group.items.map((item) => (
              <StoreReadinessItem key={item.id} item={item} status={states[item.id] || item.default} onCycle={cycle} note={notes[item.id]} onNote={setNote} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}