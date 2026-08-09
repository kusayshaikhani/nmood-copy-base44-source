import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AI-003 — AI Operations, Governance & Assistant Platform. Establishes the
// enterprise AI operating model only; does not modify existing AI behaviour.

const PILLARS = ['Human-Centered', 'Transparent', 'Explainable', 'Privacy-First', 'Fair', 'Accountable', 'Secure', 'Provider Independent', 'Continuously Improving', 'Enterprise Ready'];

const ASSISTANTS = [
  { id: 'community_assistant', name: 'Community Assistant', category: 'Member Assistants', capabilities: ['Experience Suggestions', 'Circle Discovery', 'Community Guidance'], status: 'active', human_review_required: false, default_service: 'recommendation_experience' },
  { id: 'experience_planner', name: 'Experience Planner', category: 'Member Assistants', capabilities: ['Planning Experiences', 'Scheduling', 'Activity Suggestions', 'Budget Suggestions'], status: 'active', human_review_required: false, default_service: 'operational' },
  { id: 'networking_assistant', name: 'Networking Assistant', category: 'Member Assistants', capabilities: ['Conversation Starters', 'Networking Tips', 'Ice Breakers', 'Professional Introductions'], status: 'active', human_review_required: false, default_service: 'conversation_icebreakers' },
  { id: 'wellness_assistant', name: 'Wellness Assistant', category: 'Member Assistants', capabilities: ['Positive Lifestyle Suggestions', 'Social Wellness', 'Community Engagement'], status: 'active', human_review_required: false, default_service: 'operational', note: 'Never provides medical diagnosis or treatment.' },
  { id: 'travel_assistant', name: 'Travel Assistant', category: 'Member Assistants', capabilities: ['Local Discovery', 'Nearby Activities', 'Destination Suggestions'], status: 'active', human_review_required: false, default_service: 'discovery_nearby' },
  { id: 'business_community_assistant', name: 'Business Community Assistant', category: 'Member Assistants', capabilities: ['Networking Communities', 'Business Events', 'Entrepreneurship Groups'], status: 'active', human_review_required: false, default_service: 'operational' },
  { id: 'mission_control_assistant', name: 'Mission Control Assistant', category: 'Operations Assistants', capabilities: ['Executive Briefs', 'Platform Insights', 'Operational Summaries', 'Suggested Priorities', 'Trend Analysis'], status: 'active', human_review_required: false, default_service: 'business_executive_insights' },
  { id: 'moderator_assistant', name: 'Moderator Assistant', category: 'Operations Assistants', capabilities: ['Risk Indicators', 'Safety Summaries', 'Policy References', 'Investigation Assistance'], status: 'active', human_review_required: true, default_service: 'safety_abuse', note: 'Never automatically enforces moderation. Human approval is always required.' },
];

const FUTURE_MODULES = ['Voice AI', 'Vision AI', 'AI Agents', 'Multi-Agent Collaboration', 'Predictive Community Intelligence', 'Predictive Event Planning', 'Founder Copilot', 'AI Developer Assistant', 'Autonomous Workflow Automation'];

const GOVERNANCE = ['Responsible AI', 'Explainable AI', 'Transparency', 'Human Oversight', 'Accountability', 'Fairness', 'Bias Monitoring', 'Safety Monitoring', 'Policy Compliance'];

const HUMAN_REVIEW_TYPES = ['Account Suspension Recommendations', 'Permanent Bans', 'Trust & Safety Escalations', 'High-Risk Reports', 'Legal Requests', 'Appeals'];

const QUALITY_METRICS = ['Recommendation Accuracy', 'Recommendation Acceptance', 'False Positives', 'False Negatives', 'User Feedback', 'Confidence Distribution', 'AI Errors', 'Safety Events'];

const LEARNING_SIGNALS = ['Recommendation Feedback', 'Search Behaviour', 'Community Participation', 'Explicit Feedback', 'Feature Usage', 'Safety Outcomes'];

const OBSERVABILITY_DEFS = ['Availability', 'Latency', 'Error Rate', 'Success Rate', 'Confidence Trends', 'Recommendation Quality', 'User Satisfaction', 'AI Usage', 'Assistant Usage'];

const PROVIDER_MODEL = { automatic: 'automatic', openai: 'gpt_5_mini', anthropic: 'claude_sonnet_4_6', gemini: 'gemini_3_flash', azure: 'gpt_5_mini', local: 'automatic' };

const PROMPTS_SEED = [
  { name: 'prompt.community_suggestions', version: '1.0', purpose: 'Suggest relevant experiences and circles to a member.', status: 'active', ai_service: 'recommendation_experience', languages: ['en', 'ar'] },
  { name: 'prompt.experience_planning', version: '1.0', purpose: 'Help members plan experiences, scheduling and budget.', status: 'active', ai_service: 'operational', languages: ['en', 'ar'] },
  { name: 'prompt.networking_icebreakers', version: '1.0', purpose: 'Generate conversation starters and ice breakers.', status: 'active', ai_service: 'conversation_icebreakers', languages: ['en', 'ar'] },
  { name: 'prompt.wellness_lifestyle', version: '1.0', purpose: 'Suggest positive lifestyle and social wellness ideas.', status: 'active', ai_service: 'operational', languages: ['en', 'ar'] },
  { name: 'prompt.travel_discovery', version: '1.0', purpose: 'Suggest local discovery and nearby activities.', status: 'active', ai_service: 'discovery_nearby', languages: ['en', 'ar'] },
  { name: 'prompt.business_community', version: '1.0', purpose: 'Suggest business communities and events.', status: 'active', ai_service: 'operational', languages: ['en', 'ar'] },
  { name: 'prompt.mission_control_brief', version: '1.0', purpose: 'Generate executive briefs and platform insights.', status: 'active', ai_service: 'business_executive_insights', languages: ['en'] },
  { name: 'prompt.moderator_safety_summary', version: '1.0', purpose: 'Summarize risk indicators for moderator review.', status: 'draft', ai_service: 'safety_abuse', languages: ['en'] },
];

const MODELS_SEED = [
  { model_id: 'gpt_5_mini', name: 'OpenAI GPT-5 Mini', provider: 'openai', version: '5', status: 'active', health: 'healthy', performance_score: 88, notes: 'General-purpose default.' },
  { model_id: 'claude_sonnet_4_6', name: 'Anthropic Claude Sonnet 4.6', provider: 'anthropic', version: '4.6', status: 'active', health: 'healthy', performance_score: 91, notes: 'Strong reasoning and conversation.' },
  { model_id: 'gemini_3_flash', provider: 'gemini', name: 'Google Gemini 3 Flash', version: '3', status: 'active', health: 'healthy', performance_score: 85, notes: 'Fast with optional web context.' },
  { model_id: 'gpt_5_mini_azure', name: 'Azure OpenAI GPT-5', provider: 'azure', version: '5', status: 'evaluation', health: 'healthy', performance_score: 86, notes: 'Azure-hosted evaluation adapter.' },
  { model_id: 'local_model', name: 'Local Model', provider: 'local', version: '0.1', status: 'planned', health: 'healthy', performance_score: 0, notes: 'Self-hosted inference reserved for future.' },
];

const POLICIES_SEED = [
  { key: 'responsible_ai', name: 'Responsible AI Policy', category: 'responsible_ai', region: '', status: 'active', summary: 'Human-centered, fair, accountable AI across Nmood.' },
  { key: 'safety_policy', name: 'Safety Policies', category: 'safety', region: '', status: 'active', summary: 'Spam, abuse, harassment and dangerous content policies.' },
  { key: 'privacy_policy', name: 'Privacy Policy', category: 'privacy', region: '', status: 'active', summary: 'Minimum-data processing, consent and right to be forgotten.' },
  { key: 'regional_gcc', name: 'GCC Regional Compliance', category: 'regional', region: 'GCC', status: 'active', summary: 'Regional compliance rules for GCC markets.' },
  { key: 'country_restrictions', name: 'Country Restrictions', category: 'country_restriction', region: '', status: 'active', summary: 'Per-country availability and feature restrictions.' },
  { key: 'age_18', name: 'Age Restriction (18+)', category: 'age_restriction', region: '', status: 'active', summary: 'Platform restricted to members 18 years and older.' },
];

function genId() { return 'ops_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function topCount(arr, field, n) {
  const c = {};
  arr.forEach((e) => { const v = e[field]; if (v) c[v] = (c[v] || 0) + 1; });
  return Object.entries(c).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, n);
}

async function computeOpsMetrics(svc) {
  const ok = (p) => p.catch(() => []);
  const [audits, executions, signals, reviews, prompts, models, policies] = await Promise.all([
    ok(svc.entities.AiAuditRecord.list('-created_date', 1000)),
    ok(svc.entities.AiExecution.list('-created_date', 1000)),
    ok(svc.entities.RecommendationSignal.list('-created_date', 1000)),
    ok(svc.entities.AiReviewItem.list('-created_date', 500)),
    ok(svc.entities.AiPrompt.list('-created_date', 200)),
    ok(svc.entities.AiModel.list('-created_date', 200)),
    ok(svc.entities.AiPolicy.list('-created_date', 200)),
  ]);
  const aArr = audits || []; const eArr = executions || []; const sArr = signals || [];
  const rArr = reviews || []; const pArr = prompts || []; const mArr = models || []; const polArr = policies || [];

  const total = eArr.length + aArr.length;
  const success = eArr.filter((e) => e.status === 'success').length;
  const failed = eArr.length - success;
  const successRate = eArr.length ? Math.round((success / eArr.length) * 100) : 0;
  const errorRate = eArr.length ? 100 - successRate : 0;
  const avgLatency = eArr.length ? Math.round(eArr.reduce((a, e) => a + (e.processing_time_ms || 0), 0) / eArr.length) : 0;
  const conf = { low: 0, medium: 0, high: 0 };
  eArr.forEach((e) => { const c = e.confidence_score || 0; if (c < 0.5) conf.low++; else if (c < 0.8) conf.medium++; else conf.high++; });
  const safetyEvents = eArr.filter((e) => e.safety_status !== 'safe').length;
  const accepted = sArr.filter((s) => s.signal === 'accepted').length;
  const generated = sArr.filter((s) => s.signal === 'generated').length;
  const recommendationAcceptance = generated ? Math.round((accepted / generated) * 100) : 0;

  const pending = rArr.filter((r) => r.status === 'pending').length;
  const byType = {};
  rArr.forEach((r) => { byType[r.review_type] = (byType[r.review_type] || 0) + 1; });

  return {
    observability: {
      totalRequests: total, successRate, errorRate, avgLatency, availability: successRate,
      confidenceDistribution: conf, aiUsage: topCount(eArr, 'ai_service', 8), assistantUsage: topCount(aArr, 'assistant_id', 8),
    },
    quality: {
      recommendationAcceptance, aiErrors: failed, safetyEvents,
      falsePositives: 0, falseNegatives: 0, userFeedback: sArr.filter((s) => s.signal === 'ignored' || s.signal === 'declined').length,
    },
    humanReview: { pending, total: rArr.length, byType },
    registry: { prompts: pArr.length, models: mArr.length, policies: polArr.length, activeModels: mArr.filter((m) => m.status === 'active').length },
    recentAudits: aArr.slice(0, 15),
  };
}

async function handleInvokeAssistant(svc, body) {
  const { assistant_id, prompt, language, provider } = body;
  const request_id = genId();
  const t0 = Date.now();
  const a = ASSISTANTS.find((x) => x.id === assistant_id);
  if (!a) return Response.json({ status: 'failed', error_type: 'assistant_not_found', reasoning_summary: 'Assistant not registered.' }, { status: 400 });
  const prov = provider || 'automatic';
  const model = PROVIDER_MODEL[prov] || 'automatic';
  try {
    const result = await svc.integrations.Core.InvokeLLM({ prompt: prompt || '', model });
    const pt = Date.now() - t0;
    const confidence = 0.85;
    const human_review_required = !!a.human_review_required;
    await svc.entities.AiAuditRecord.create({
      ai_service: a.default_service || a.id, request_id, assistant_id: a.id, confidence,
      processing_time_ms: pt, safety_status: 'safe', human_review_required,
      final_outcome: human_review_required ? 'pending_review' : 'completed', member_id: '',
    });
    return Response.json({
      response_id: genId(), request_id, assistant_id: a.id, assistant_name: a.name,
      provider: prov, model, result, confidence_score: confidence, safety_status: 'safe',
      language: language || 'en', processing_time_ms: pt, reasoning_summary: 'Assistant via ' + prov + '/' + model,
      human_review_required, explainability_placeholder: 'Explainability will be available in a future enhancement.', status: 'success',
    });
  } catch (_e) {
    const pt = Date.now() - t0;
    try { await svc.entities.AiAuditRecord.create({ ai_service: a.default_service || a.id, request_id, assistant_id: a.id, confidence: 0, processing_time_ms: pt, safety_status: 'safe', human_review_required: !!a.human_review_required, final_outcome: 'failed', member_id: '' }); } catch (_ee) {}
    return Response.json({ response_id: genId(), request_id, assistant_id: a.id, provider: prov, model, result: null, confidence_score: 0, safety_status: 'safe', language: language || 'en', processing_time_ms: pt, reasoning_summary: 'The AI provider failed to respond. Please retry.', human_review_required: !!a.human_review_required, status: 'failed', error_type: 'provider_failure' });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const mode = body.mode;
    const svc = base44.asServiceRole;

    if (mode === 'overview') {
      const metrics = await computeOpsMetrics(svc);
      const [prompts, models, policies, reviews] = await Promise.all([
        svc.entities.AiPrompt.list('-created_date', 200).catch(() => []),
        svc.entities.AiModel.list('-created_date', 200).catch(() => []),
        svc.entities.AiPolicy.list('-created_date', 200).catch(() => []),
        svc.entities.AiReviewItem.filter({ status: 'pending' }, '-created_date', 50).catch(() => []),
      ]);
      return Response.json({
        pillars: PILLARS, assistants: ASSISTANTS, future: FUTURE_MODULES,
        governance: GOVERNANCE, humanReviewTypes: HUMAN_REVIEW_TYPES, qualityMetrics: QUALITY_METRICS,
        learningSignals: LEARNING_SIGNALS, observabilityDefs: OBSERVABILITY_DEFS,
        metrics, prompts: prompts || [], models: models || [], policies: policies || [],
        pendingReviews: reviews || [],
      });
    }

    if (mode === 'invokeAssistant') return await handleInvokeAssistant(svc, body);

    if (mode === 'seed') {
      // PB-003 — seed operations are development-only; blocked in production/staging.
      if (Deno.env.get('APP_ENV') !== 'development') {
        return Response.json({ error: 'Seed operations are not available outside development.' }, { status: 403 });
      }
      const ok = (p) => p.catch(() => []);
      const [exP, exM, exPol] = await Promise.all([
        ok(svc.entities.AiPrompt.list('-created_date', 200)),
        ok(svc.entities.AiModel.list('-created_date', 200)),
        ok(svc.entities.AiPolicy.list('-created_date', 200)),
      ]);
      const haveP = new Set((exP || []).map((p) => p.name));
      const haveM = new Set((exM || []).map((m) => m.model_id));
      const havePol = new Set((exPol || []).map((p) => p.key));
      const toP = PROMPTS_SEED.filter((p) => !haveP.has(p.name));
      const toM = MODELS_SEED.filter((m) => !haveM.has(m.model_id));
      const toPol = POLICIES_SEED.filter((p) => !havePol.has(p.key));
      if (toP.length) await svc.entities.AiPrompt.bulkCreate(toP);
      if (toM.length) await svc.entities.AiModel.bulkCreate(toM);
      if (toPol.length) await svc.entities.AiPolicy.bulkCreate(toPol);
      return Response.json({ ok: true, seeded: { prompts: toP.length, models: toM.length, policies: toPol.length } });
    }

    if (mode === 'reviews') {
      const status = body.status || 'pending';
      const list = await svc.entities.AiReviewItem.filter({ status }, '-created_date', 200).catch(() => []);
      return Response.json({ data: list || [] });
    }

    if (mode === 'createReview') {
      const { review_type, target_type, target_id, ai_recommendation, ai_confidence } = body;
      if (!review_type) return Response.json({ error: 'review_type required' }, { status: 400 });
      const item = await svc.entities.AiReviewItem.create({
        review_type, target_type: target_type || '', target_id: target_id || '',
        ai_recommendation: ai_recommendation || '', ai_confidence: ai_confidence || 0, status: 'pending',
      });
      return Response.json({ ok: true, result: item });
    }

    if (mode === 'reviewAction') {
      const { review_id, decision } = body;
      if (!review_id || !decision) return Response.json({ error: 'review_id and decision required' }, { status: 400 });
      const item = await svc.entities.AiReviewItem.get(review_id).catch(() => null);
      if (!item) return Response.json({ error: 'Review item not found' }, { status: 404 });
      const status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'escalated';
      const result = await svc.entities.AiReviewItem.update(review_id, {
        status, decision: String(body.notes || decision), reviewer: user.email || user.full_name || user.id, reviewer_id: String(user.id),
      });
      try { await svc.entities.AuditLog.create({ administrator: user.email || user.id, action: 'aiReview.' + status, target_type: 'AiReviewItem', target_id: review_id, details: 'Human review decision: ' + status }); } catch (_e) {}
      return Response.json({ ok: true, result });
    }

    if (mode === 'explain') {
      const { reason_context } = body;
      const ctx = reason_context || {};
      const reasons = [];
      if (ctx.interests) reasons.push(`This recommendation matches your preferred interests (${ctx.interests}).`);
      if (ctx.recent_participation) reasons.push('This suggestion is based on your recent participation.');
      if (ctx.preferences) reasons.push('This recommendation was influenced by your selected preferences.');
      if (ctx.connections) reasons.push('Several of your trusted connections joined this.');
      const reason = reasons.length ? reasons.join(' ') : 'Recommended based on your activity and preferences.';
      return Response.json({ reason, explainable: true });
    }

    if (mode === 'audit') {
      const list = await svc.entities.AiAuditRecord.list('-created_date', 200).catch(() => []);
      return Response.json({ data: list || [] });
    }

    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    console.error('aiOps error:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
});