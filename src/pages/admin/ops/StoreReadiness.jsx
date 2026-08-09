import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Store, RefreshCw, FileDown } from 'lucide-react';
import { APPLE_ITEMS, GOOGLE_ITEMS, ALL_ITEMS, STATUS_META } from '@/lib/store-readiness';
import StoreReadinessItem from '@/components/ops/StoreReadinessItem';
import StoreReadinessSummary from '@/components/ops/StoreReadinessSummary';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STORAGE_KEY = 'nmood:store-readiness-v1';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

export default function StoreReadiness() {
  const { t } = useLocalization();
  const [states, setStates] = useState(() => {
    const saved = load();
    const init = {};
    ALL_ITEMS.forEach((i) => { init[i.id] = saved[i.id] || i.default; });
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
    ALL_ITEMS.forEach((i) => { init[i.id] = i.default; });
    setStates(init);
    setNotes({});
  };

  const totals = ALL_ITEMS.reduce(
    (acc, i) => {
      const st = states[i.id] || i.default;
      if (st !== 'notApplicable') acc.actionable++;
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { completed: 0, missing: 0, needsFounder: 0, notApplicable: 0, actionable: 0 }
  );
  const overallReady = totals.actionable > 0 && totals.completed === totals.actionable && totals.missing === 0;
  const overallProgress = totals.actionable ? Math.round((totals.completed / totals.actionable) * 100) : 0;

  const exportReport = () => {
    const date = new Date().toISOString();
    const lines = [
      'NMOOD — STORE READINESS VERIFICATION',
      'Generated: ' + date,
      'Overall: ' + (overallReady ? 'READY FOR SUBMISSION' : 'NOT READY') + ` (${overallProgress}%)`,
      '',
      '— APPLE APP STORE —',
      ...APPLE_ITEMS.map((i) => `  [${STATUS_META[states[i.id] || i.default].label}] ${i.label} — ${i.hint}`),
      '',
      '— GOOGLE PLAY —',
      ...GOOGLE_ITEMS.map((i) => `  [${STATUS_META[states[i.id] || i.default].label}] ${i.label} — ${i.hint}`),
      '',
      '— End of report —',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmood-store-readiness-${date.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> {t('mission.store_readiness_verification')}</h1>
          <p className="text-sm text-muted-foreground">{t('mission.ex002_verify_complete_readiness_for')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}><RefreshCw className="w-4 h-4" /> {t('mission.reset')}</Button>
          <Button size="sm" onClick={exportReport}><FileDown className="w-4 h-4" /> {t('mission.export_report')}</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t('mission.submission_readiness')}</span>
          <span className={'text-sm font-bold ' + (overallReady ? 'text-success' : 'text-muted-foreground')}>
            {overallProgress}% · {overallReady ? 'READY' : 'IN PROGRESS'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={'h-full rounded-full transition-all ' + (overallReady ? 'bg-success' : 'bg-primary')} style={{ width: overallProgress + '%' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <StoreReadinessSummary label="Apple App Store" items={APPLE_ITEMS} states={states} />
        <StoreReadinessSummary label="Google Play" items={GOOGLE_ITEMS} states={states} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section>
          <h2 className="text-sm font-bold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /> {t('mission.apple_app_store')}</h2>
          <div className="space-y-2">
            {APPLE_ITEMS.map((item) => (
              <StoreReadinessItem key={item.id} item={item} status={states[item.id] || item.default} onCycle={cycle} note={notes[item.id]} onNote={setNote} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" /> {t('mission.google_play')}</h2>
          <div className="space-y-2">
            {GOOGLE_ITEMS.map((item) => (
              <StoreReadinessItem key={item.id} item={item} status={states[item.id] || item.default} onCycle={cycle} note={notes[item.id]} onNote={setNote} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}