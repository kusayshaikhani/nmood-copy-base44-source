// QA-001 Test runner. Executes suites, scores results, detects blockers,
// persists runs, and builds exportable reports. Read-only — never mutates data.
import { SUITES } from './qa-suites';
import { base44 } from '@/api/base44Client';

const STATUS_SCORE = { pass: 100, warning: 70, fail: 30, blocker: 0 };
const CRITICAL_MODULES = ['Authentication', 'Membership', 'Security Smoke', 'Data Integrity'];
const CRITICAL_TESTS = [
  { module: 'Messaging', name: 'Authorization' },
  { module: 'Messaging', name: 'Premium Requirements' },
];

export async function runAll(ctx) {
  const run_id = `qa_${Date.now()}`;
  const started_at = new Date().toISOString();
  const results = [];
  for (const suite of SUITES) {
    for (const t of suite.tests) {
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      let status = 'warning';
      let details = 'Manual validation required.';
      try {
        if (t.check) {
          const r = await t.check(ctx);
          status = r.status;
          details = r.details || '';
        }
      } catch (e) {
        status = 'fail';
        details = `Auto check threw: ${e.message}`;
      }
      const execution_ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
      results.push({
        run_id, started_at,
        module: suite.module,
        test_name: t.name,
        result: status,
        details,
        execution_ms,
        category: t.cat || suite.cat || 'functionality',
      });
    }
  }
  const summary = summarize(results);
  const score = releaseScore(results);
  const blockers = detectBlockers(results);
  try {
    await base44.functions.invoke('qaEngine', { mode: 'storeRun', run_id, started_at, results });
  } catch { /* non-blocking — results still returned to caller */ }
  return { run_id, started_at, results, summary, score, blockers };
}

export function summarize(results) {
  const s = { pass: 0, warning: 0, fail: 0, blocker: 0, total: results.length };
  for (const r of results) if (s[r.result] !== undefined) s[r.result]++;
  return s;
}

export function releaseScore(results) {
  const byCat = {};
  for (const r of results) {
    const c = r.category || 'functionality';
    if (!byCat[c]) byCat[c] = [];
    byCat[c].push(STATUS_SCORE[r.result] ?? 0);
  }
  const categories = {};
  let sum = 0;
  let count = 0;
  for (const [c, vals] of Object.entries(byCat)) {
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    categories[c] = avg;
    sum += avg;
    count++;
  }
  const overall = count ? Math.round(sum / count) : 0;
  return { overall, categories };
}

export function detectBlockers(results) {
  const reasons = [];
  for (const r of results) {
    if (r.result === 'blocker') reasons.push(`${r.module}: ${r.test_name}`);
    else if (r.result === 'fail' && CRITICAL_MODULES.includes(r.module)) reasons.push(`${r.module}: ${r.test_name} (critical failure)`);
    else if (r.result === 'fail' && CRITICAL_TESTS.some((c) => c.module === r.module && c.name === r.test_name)) reasons.push(`${r.module}: ${r.test_name} (critical failure)`);
  }
  return { blocked: reasons.length > 0, reasons };
}

// --- Export report builders ---
export function buildSummary(run) {
  return {
    type: 'QA Summary',
    run_id: run.run_id,
    started_at: run.started_at,
    summary: run.summary,
    score: run.score,
    blockers: run.blockers,
    generated_at: new Date().toISOString(),
  };
}

export function buildRegression(latest, previous) {
  const map = (r) => `${r.module}:${r.test_name}`;
  const prevMap = {};
  for (const r of previous || []) prevMap[map(r)] = r.result;
  const regressions = [];
  for (const r of latest || []) {
    const p = prevMap[map(r)];
    if (p && p !== r.result && STATUS_SCORE[r.result] < STATUS_SCORE[p]) {
      regressions.push({ test: map(r), from: p, to: r.result });
    }
  }
  return { type: 'Regression Report', run_id: latest?.[0]?.run_id, regressions, count: regressions.length, generated_at: new Date().toISOString() };
}

export function buildRelease(run) {
  return {
    type: 'Release Report',
    run_id: run.run_id,
    started_at: run.started_at,
    release_score: run.score,
    summary: run.summary,
    release_blocked: run.blockers.blocked,
    blocker_reasons: run.blockers.reasons,
    generated_at: new Date().toISOString(),
  };
}

export function buildCritical(run) {
  const critical = (run.results || []).filter((r) => ['fail', 'blocker'].includes(r.result));
  return { type: 'Critical Issues Report', run_id: run.run_id, critical, count: critical.length, generated_at: new Date().toISOString() };
}