import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * RM-002 — Release Intelligence (AI Q&A). Admin-only.
 * Answers the 5 supported Release 1.0 questions using the frozen definition
 * (passed from the client lib, the single source of truth) + live signals
 * (ErrorLog severities, SupportTicket open count, FeatureFlags).
 * AI provides recommendations only — it NEVER modifies release status.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '').trim();
    const definition = body.definition;
    if (!question || !definition) {
      return Response.json({ error: 'question and definition are required' }, { status: 400 });
    }

    // --- Live signals --------------------------------------------------------
    const [errors, tickets] = await Promise.all([
      base44.asServiceRole.entities.ErrorLog.filter({}).catch(() => []),
      base44.asServiceRole.entities.SupportTicket.filter({ status: 'open' }).catch(() => []),
    ]);
    const critical = errors.filter((e) => e.severity === 'fatal').length;
    const high = errors.filter((e) => e.severity === 'error').length;
    const openTickets = tickets.length;

    // --- Reconcile live defect gates ---------------------------------------
    const gates = (definition.QUALITY_GATES || []).map((g) => {
      if (g.key === 'no_critical') return { ...g, status: critical === 0 ? 'passed' : 'open' };
      if (g.key === 'no_high_blocking') return { ...g, status: high === 0 ? 'passed' : 'open' };
      return g;
    });

    const modules = definition.MODULES || [];
    const moduleReadiness = modules.length
      ? Math.round(modules.reduce((a, m) => a + (m.completion || 0), 0) / modules.length)
      : 0;
    const gateScore = gates.reduce((a, g) => a + (g.status === 'passed' ? 1 : g.status === 'in_progress' ? 0.5 : 0), 0);
    const gateReadiness = gates.length ? Math.round((gateScore / gates.length) * 100) : 0;
    const overall = Math.round(moduleReadiness * 0.6 + gateReadiness * 0.4);
    const incomplete = modules.filter((m) => m.status !== 'complete');
    const openGates = gates.filter((g) => g.status === 'open');

    const context = [
      `RELEASE 1.0 (architecture frozen: ${definition.RELEASE?.architecture_frozen})`,
      `Vision: ${definition.RELEASE?.vision}`,
      `Overall Readiness: ${overall}% (modules ${moduleReadiness}%, gates ${gateReadiness}%)`,
      `Modules (${modules.length}): ${modules.map((m) => `${m.name}=${m.completion}%/${m.status}`).join(', ')}`,
      `Incomplete modules: ${incomplete.map((m) => `${m.name} (${m.completion}%) — ${m.note || 'in progress'}`).join('; ') || 'none'}`,
      `Open quality gates: ${openGates.map((g) => g.name).join('; ') || 'none'}`,
      `Live signals: critical defects=${critical}, high-severity errors=${high}, open support tickets=${openTickets}`,
      `Deferred (1.1 candidates): ${(definition.DEFERRED || []).join('; ') || 'none'}`,
    ].join('\n');

    const allowedQuestions = [
      'What remains before Release 1.0?',
      'Which modules are incomplete?',
      'Which quality gates remain open?',
      'Which issues block production?',
      'What is the current Release Readiness %?',
    ];

    const answer = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        `You are the Nmood Release 1.0 Intelligence assistant. Answer the founder's question using ONLY the context below.\n` +
        `Rules: recommendations only; never modify release status or claim authority to change scope; ` +
        `if the question is outside the supported set, say it is unsupported and list the supported questions.\n` +
        `Supported questions: ${allowedQuestions.join(' | ')}\n\n` +
        `Founder question: "${question}"\n\nContext:\n${context}\n\n` +
        `Answer concisely in 4-6 lines. End with one recommended next action.`,
    });

    return Response.json({
      answer: typeof answer === 'string' ? answer : answer?.content || JSON.stringify(answer),
      readiness: { overall, moduleReadiness, gateReadiness },
      signals: { critical, high, openTickets },
      liveGates: { no_critical: critical === 0, no_high_blocking: high === 0 },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});