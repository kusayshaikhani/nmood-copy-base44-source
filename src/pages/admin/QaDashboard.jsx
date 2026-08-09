import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { runAll, summarize, releaseScore, detectBlockers, buildSummary, buildRegression, buildRelease, buildCritical } from '@/lib/qa/qa-runner';
import { CheckCircle2, AlertTriangle, XCircle, Ban, Play, FileDown, Loader2, ShieldCheck } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const RESULT_META = {
  pass: { icon: CheckCircle2, tone: 'text-success', label: 'Pass' },
  warning: { icon: AlertTriangle, tone: 'text-warning', label: 'Warning' },
  fail: { icon: XCircle, tone: 'text-destructive', label: 'Fail' },
  blocker: { icon: Ban, tone: 'text-destructive', label: 'Blocker' },
};

function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function QaDashboard() {
  const { t } = useLocalization();
  const { user, member } = useAuth();
  const { membership } = useMembershipAccess();
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(null);

  const loadLatest = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('qaEngine', { mode: 'latestRun' });
      if (res?.results?.length) {
        const results = res.results;
        setCurrent({ run_id: res.run_id, started_at: res.started_at, results, summary: summarize(results), score: releaseScore(results), blockers: detectBlockers(results) });
      }
    } catch { /* ignore */ }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('qaEngine', { mode: 'history' });
      setHistory(res?.history || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadLatest(); loadHistory(); }, [loadLatest, loadHistory]);

  const run = async () => {
    setRunning(true);
    try {
      const res = await runAll({ base44, user, member, membership });
      setCurrent(res);
      await loadHistory();
    } finally {
      setRunning(false);
    }
  };

  const data = current;
  const score = data?.score?.overall ?? 0;
  const scoreTone = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('admin.quality_assurance')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.automated_validation_regression_release_readiness')}</p>
        </div>
        <Button onClick={run} disabled={running} className="gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? 'Running…' : 'Run Full QA'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 flex flex-col items-center justify-center">
          <ShieldCheck className={`w-5 h-5 mb-1 ${scoreTone}`} />
          <p className="text-2xl font-bold">{score}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t('admin.health_score')}</p>
        </Card>
        {[
          { k: 'total', label: 'Total Tests', icon: ShieldCheck, tone: 'text-foreground' },
          { k: 'pass', label: 'Passed', icon: CheckCircle2, tone: 'text-success' },
          { k: 'warning', label: 'Warnings', icon: AlertTriangle, tone: 'text-warning' },
          { k: 'fail', label: 'Failures', icon: XCircle, tone: 'text-destructive' },
          { k: 'blocker', label: 'Blockers', icon: Ban, tone: 'text-destructive' },
        ].map((s) => (
          <Card key={s.k} className="p-4 flex flex-col items-center justify-center">
            <s.icon className={`w-5 h-5 mb-1 ${s.tone}`} />
            <p className="text-2xl font-bold">{data?.summary?.[s.k] ?? '—'}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
          </Card>
        ))}
      </div>

      {data?.blockers?.blocked && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <Ban className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">{t('admin.release_blocked')}</h3>
          </div>
          <ul className="space-y-1 text-sm">
            {data.blockers.reasons.map((r, i) => (
              <li key={i} className="text-destructive/90">• {r}</li>
            ))}
          </ul>
        </Card>
      )}

      {data && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Latest Test Run · {data.run_id}</h3>
            <span className="text-xs text-muted-foreground">{data.started_at ? new Date(data.started_at).toLocaleString() : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="py-2 pr-3">{t('admin.module')}</th>
                  <th className="py-2 pr-3">{t('admin.test')}</th>
                  <th className="py-2 pr-3">{t('admin.result')}</th>
                  <th className="py-2 pr-3">{t('admin.time')}</th>
                  <th className="py-2">{t('admin.details')}</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r, i) => {
                  const M = RESULT_META[r.result];
                  return (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-medium">{r.module}</td>
                      <td className="py-2 pr-3">{r.test_name}</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 ${M.tone}`}><M.icon className="w-3.5 h-3.5" />{M.label}</span>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.execution_ms}ms</td>
                      <td className="py-2 text-muted-foreground max-w-md truncate">{r.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.regression_history')}</h3>
        {history.length ? (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.run_id} className="flex items-center gap-3 text-sm py-1.5 border-b border-border/60 last:border-0">
                <span className="font-mono text-xs text-muted-foreground truncate flex-1">{h.run_id}</span>
                <span className="text-success">{h.pass} pass</span>
                <span className="text-warning">{h.warning} warn</span>
                <span className="text-destructive">{h.fail + h.blocker} fail</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('admin.no_runs_yet_run_a')}</p>
        )}
      </Card>

      {data && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">{t('admin.exports')}</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => download('qa-summary.json', buildSummary(data))}><FileDown className="w-4 h-4" /> {t('admin.qa_summary')}</Button>
            <Button variant="outline" size="sm" onClick={() => download('qa-regression.json', buildRegression(data.results, null))}><FileDown className="w-4 h-4" /> {t('admin.regression_report')}</Button>
            <Button variant="outline" size="sm" onClick={() => download('qa-release.json', buildRelease(data))}><FileDown className="w-4 h-4" /> {t('admin.release_report')}</Button>
            <Button variant="outline" size="sm" onClick={() => download('qa-critical.json', buildCritical(data))}><FileDown className="w-4 h-4" /> {t('admin.critical_issues')}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}