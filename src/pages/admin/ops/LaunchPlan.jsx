import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rocket, RefreshCw, FileDown, TriangleAlert } from 'lucide-react';
import { PRELAUNCH_PHASES, LAUNCH_DAY_ITEMS, POSTLAUNCH_PHASES, INCIDENTS, METRICS, ALL_PLAN_ITEMS } from '@/lib/launch-plan';
import StoreReadinessItem from '@/components/ops/StoreReadinessItem';
import StoreReadinessSummary from '@/components/ops/StoreReadinessSummary';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STORAGE_KEY = 'nmood:launch-plan-v1';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

const SEVERITY_CHIP = {
  P0: 'bg-destructive/10 text-destructive',
  P1: 'bg-warning/10 text-warning',
};

export default function LaunchPlan() {
  const { t } = useLocalization();
  const [states, setStates] = useState(() => {
    const saved = load();
    const init = {};
    ALL_PLAN_ITEMS.forEach((i) => { init[i.id] = saved[i.id] || i.default; });
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
    ALL_PLAN_ITEMS.forEach((i) => { init[i.id] = i.default; });
    setStates(init);
    setNotes({});
  };

  const completed = ALL_PLAN_ITEMS.filter((i) => states[i.id] === 'completed').length;
  const progress = Math.round((completed / ALL_PLAN_ITEMS.length) * 100);

  const renderSection = (label, items) => (
    <section>
      <h2 className="text-sm font-bold mb-2">{label}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {items.map((item) => (
          <StoreReadinessItem key={item.id} item={{ ...item, default: item.default || 'needsFounder', owner: item.owner || 'Ops' }} status={states[item.id] || 'needsFounder'} onCycle={cycle} note={notes[item.id]} onNote={setNote} />
        ))}
      </div>
    </section>
  );

  const exportReport = () => {
    const date = new Date().toISOString();
    const meta = (st) => ({ completed: 'Completed', missing: 'Missing', needsFounder: 'Pending', notApplicable: 'N/A' }[st] || st);
    const lines = [
      'NMOOD — LAUNCH EXECUTION PLAN',
      'Generated: ' + date,
      `Plan progress: ${progress}% (${completed}/${ALL_PLAN_ITEMS.length})`,
      '',
      '— PRE-LAUNCH —',
      ...PRELAUNCH_PHASES.flatMap((p) => [`  ${p.label}`, ...p.items.map((i) => `    [${meta(states[i.id] || 'needsFounder')}] ${i.label}`)]),
      '',
      '— LAUNCH DAY —',
      ...LAUNCH_DAY_ITEMS.map((i) => `  [${meta(states[i.id] || 'needsFounder')}] ${i.label}`),
      '',
      '— POST-LAUNCH —',
      ...POSTLAUNCH_PHASES.flatMap((p) => [`  ${p.label}`, ...p.items.map((i) => `    [${meta(states[i.id] || 'needsFounder')}] ${i.label}`)]),
      '',
      '— INCIDENT RESPONSE —',
      ...INCIDENTS.map((inc) => `  ${inc.severity} ${inc.title}: ${inc.steps.join(' → ')}`),
      '',
      '— SUCCESS METRICS —',
      ...METRICS.map((m) => `  [${meta(states[m.id] || 'needsFounder')}] ${m.label} — ${m.target}`),
      '',
      '— End of plan —',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmood-launch-plan-${date.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Rocket className="w-5 h-5 text-primary" /> {t('mission.launch_execution_plan')}</h1>
          <p className="text-sm text-muted-foreground">{t('mission.ex004_operational_plan_for_launching')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}><RefreshCw className="w-4 h-4" /> {t('mission.reset')}</Button>
          <Button size="sm" onClick={exportReport}><FileDown className="w-4 h-4" /> {t('mission.export_plan')}</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t('mission.plan_progress')}</span>
          <span className="text-sm font-bold text-primary">{progress}% · {completed}/{ALL_PLAN_ITEMS.length}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: progress + '%' }} />
        </div>
      </div>

      <StoreReadinessSummary label="Pre-Launch" items={PRELAUNCH_PHASES.flatMap((p) => p.items)} states={states} />

      {PRELAUNCH_PHASES.map((phase) => renderSection(phase.label, phase.items))}

      {renderSection('Launch Day Verification', LAUNCH_DAY_ITEMS)}

      <StoreReadinessSummary label="Post-Launch" items={POSTLAUNCH_PHASES.flatMap((p) => p.items)} states={states} />
      {POSTLAUNCH_PHASES.map((phase) => renderSection(phase.label, phase.items))}

      <section>
        <h2 className="text-sm font-bold mb-2 flex items-center gap-2"><TriangleAlert className="w-4 h-4 text-warning" /> {t('mission.incident_response')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {INCIDENTS.map((inc) => (
            <Card key={inc.id} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">{inc.title}</h4>
                <span className={'text-[11px] font-semibold px-2 py-0.5 rounded-full ' + (SEVERITY_CHIP[inc.severity] || 'bg-muted text-muted-foreground')}>{inc.severity}</span>
              </div>
              <ol className="space-y-1">
                {inc.steps.map((s, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex gap-2"><span className="font-semibold text-foreground/70">{idx + 1}.</span>{s}</li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </section>

      {renderSection('Success Metrics', METRICS)}
    </div>
  );
}