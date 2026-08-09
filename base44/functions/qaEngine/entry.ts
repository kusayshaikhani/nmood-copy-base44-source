import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// QA-001 Quality Assurance engine — persists and retrieves QA run results.
// Test execution lives client-side (read-only validations); this function
// only stores/reports. Admin-only.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'latestRun';
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole;

    switch (mode) {
      case 'storeRun': return await storeRun(svc, body);
      case 'latestRun': return await latestRun(svc);
      case 'history': return await history(svc);
      default: return Response.json({ error: 'Unknown mode' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function storeRun(svc, body) {
  const { run_id, started_at, results } = body;
  const rows = (results || []).map((r) => ({
    run_id,
    started_at,
    module: String(r.module || ''),
    test_name: String(r.test_name || ''),
    result: ['pass', 'warning', 'fail', 'blocker'].includes(r.result) ? r.result : 'warning',
    details: String(r.details || '').slice(0, 2000),
    execution_ms: Number(r.execution_ms) || 0,
    category: r.category || 'functionality',
  }));
  if (rows.length) await svc.entities.QaResult.bulkCreate(rows);
  return Response.json({ ok: true, run_id, count: rows.length });
}

async function latestRun(svc) {
  const all = await svc.entities.QaResult.list('-created_date', 500);
  const arr = all || [];
  if (!arr.length) return Response.json({ results: [] });
  const runId = arr[0].run_id;
  const results = arr.filter((r) => r.run_id === runId);
  return Response.json({ run_id: runId, started_at: arr[0].started_at, results });
}

async function history(svc) {
  const all = await svc.entities.QaResult.list('-created_date', 1000);
  const arr = all || [];
  const byRun = {};
  for (const r of arr) {
    if (!byRun[r.run_id]) byRun[r.run_id] = { run_id: r.run_id, ts: r.created_date, pass: 0, warning: 0, fail: 0, blocker: 0, total: 0 };
    const b = byRun[r.run_id];
    if (b[r.result] !== undefined) b[r.result]++;
    b.total++;
  }
  const history = Object.values(byRun).sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 20);
  return Response.json({ history });
}