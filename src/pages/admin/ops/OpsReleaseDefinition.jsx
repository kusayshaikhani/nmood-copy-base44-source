import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, CheckCircle2, AlertCircle, CircleDashed, Sparkles, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  RELEASE, MODULES, QUALITY_GATES, DEFERRED,
  SECURITY_TARGETS, PRIVACY_TARGETS, OPERATIONS_TARGETS, COMPLIANCE_TARGETS,
  PERFORMANCE_TARGETS, AI_QUESTIONS,
} from '@/lib/release-definition';
import {
  moduleReadiness, gateReadiness, overallReadiness, incompleteModules, openGates, blockers,
} from '@/lib/release-engine';

export default function OpsReleaseDefinition() {
  const { t } = useLocalization();
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState(AI_QUESTIONS[0]);
  const [error, setError] = useState('');

  const overall = overallReadiness();
  const mReady = moduleReadiness();
  const gReady = gateReadiness();
  const incomplete = useMemo(() => incompleteModules(), []);
  const gatesOpen = useMemo(() => openGates(), []);
  const blocking = useMemo(() => blockers(), []);

  const ask = async (q) => {
    setAsking(true); setError(''); setAnswer('');
    try {
      const res = await base44.functions.invoke('releaseIntelligence', {
        question: q || question,
        definition: { RELEASE, MODULES, QUALITY_GATES, DEFERRED },
      });
      setAnswer(res?.data?.answer || res?.answer || 'No answer returned.');
    } catch (e) {
      setError(e?.message || 'Unable to reach Release Intelligence.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {t('mission.release_10_definition')} <Lock className="w-4 h-4 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground">{t('mission.architecture_frozen_baseline_scope_for')}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t('mission.readiness')}</p>
          <p className="text-3xl font-bold text-primary">{overall}%</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Module Readiness" value={`${mReady}%`} />
        <Stat label="Gate Readiness" value={`${gReady}%`} />
        <Stat label="Open Blockers" value={String(blocking.length)} tone={blocking.length ? 'warn' : 'ok'} />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-1">{t('mission.product_vision')}</h2>
        <p className="text-sm text-muted-foreground">{RELEASE.vision}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {RELEASE.principles.map((p) => (
            <span key={p} className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{p}</span>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-3">{t('mission.release_10_modules')}</h2>
        <div className="space-y-1.5">
          {MODULES.map((m) => <ModuleRow key={m.key} m={m} />)}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-3">{t('mission.quality_gates')}</h2>
        <div className="space-y-1.5">
          {QUALITY_GATES.map((g) => <GateRow key={g.key} g={g} />)}
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <TargetCard title={t('mission.security_targets')} items={SECURITY_TARGETS} />
        <TargetCard title={t('mission.privacy_targets')} items={PRIVACY_TARGETS} />
        <TargetCard title={t('mission.operations')} items={OPERATIONS_TARGETS} />
        <TargetCard title={t('mission.compliance')} items={COMPLIANCE_TARGETS} />
        <TargetCard title={t('mission.performance_targets')} items={PERFORMANCE_TARGETS} />
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-2">{t('mission.deferred_release_11_candidates')}</h3>
          <ul className="space-y-1.5">
            {DEFERRED.map((d) => (
              <li key={d} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-muted-foreground/50">•</span>{d}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> {t('mission.release_intelligence_ai')}</h2>
        <p className="text-xs text-muted-foreground mb-3">{t('mission.recommendations_only_ai_never_modifies')}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {AI_QUESTIONS.map((q) => (
            <button key={q} onClick={() => { setQuestion(q); ask(q); }}
              className="text-[11px] px-2.5 py-1.5 rounded-full border border-border hover:bg-accent/40 transition-default">
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('mission.ask_about_release_10')} />
          <Button onClick={() => ask()} disabled={asking}>{asking ? 'Thinking…' : 'Ask'} <ArrowRight className="w-4 h-4" /></Button>
        </div>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        {answer && <p className="text-sm mt-3 whitespace-pre-line leading-relaxed">{answer}</p>}
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === 'warn' ? 'text-warning' : tone === 'ok' ? 'text-success' : 'text-foreground';
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function ModuleRow({ m }) {
  const Icon = m.status === 'complete' ? CheckCircle2 : m.status === 'in_progress' ? CircleDashed : AlertCircle;
  const color = m.status === 'complete' ? 'text-success' : m.status === 'in_progress' ? 'text-warning' : 'text-destructive';
  return (
    <div className="flex items-center gap-3 py-1">
      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
      <span className="text-sm font-medium flex-1">{m.name}</span>
      <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${m.completion}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-9 text-right">{m.completion}%</span>
    </div>
  );
}

function GateRow({ g }) {
  const { t } = useLocalization();
  const Icon = g.status === 'passed' ? CheckCircle2 : g.status === 'in_progress' ? CircleDashed : AlertCircle;
  const color = g.status === 'passed' ? 'text-success' : g.status === 'in_progress' ? 'text-warning' : 'text-destructive';
  return (
    <div className="flex items-center gap-3 py-1">
      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
      <span className="text-sm flex-1">{g.name}</span>
      {g.live && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t('mission.live')}</span>}
      <span className="text-xs text-muted-foreground capitalize">{g.status.replace('_', ' ')}</span>
    </div>
  );
}

function TargetCard({ title, items }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((t) => (
          <li key={t} className="text-sm text-muted-foreground flex gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/40 flex-shrink-0" />{t}
          </li>
        ))}
      </ul>
    </Card>
  );
}