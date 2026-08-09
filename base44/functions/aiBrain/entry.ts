import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AI-001 — Nmood AI Brain. Centralized, provider-independent AI orchestration.
// Establishes the architecture only; does not modify existing AI features.

const SUPPORTED_LANGUAGES = ['en', 'ar', 'es', 'fr', 'de', 'hi', 'ko', 'zh', 'ja', 'ru', 'it', 'pt', 'tr', 'fa', 'ur'];

const PROVIDERS = [
  { id: 'automatic', name: 'Automatic', model: 'automatic', status: 'active', note: 'Platform selects the best model per request.' },
  { id: 'openai', name: 'OpenAI', model: 'gpt_5_mini', status: 'ready', note: 'GPT models via the platform LLM integration.' },
  { id: 'anthropic', name: 'Anthropic', model: 'claude_sonnet_4_6', status: 'ready', note: 'Claude models via the platform LLM integration.' },
  { id: 'gemini', name: 'Google Gemini', model: 'gemini_3_flash', status: 'ready', note: 'Gemini models with optional web context.' },
  { id: 'azure', name: 'Azure OpenAI', model: 'gpt_5_mini', status: 'ready', note: 'Azure-hosted OpenAI adapter (maps to GPT models).' },
  { id: 'local', name: 'Local Models', model: 'automatic', status: 'planned', note: 'Self-hosted inference adapter reserved for future.' },
];
const PROVIDER_MODEL = { automatic: 'automatic', openai: 'gpt_5_mini', anthropic: 'claude_sonnet_4_6', gemini: 'gemini_3_flash', azure: 'gpt_5_mini', local: 'automatic' };

const SERVICES = [
  { id: 'recommendation_member', name: 'Member Recommendations', category: 'Recommendation Intelligence', description: 'Personalized member matching recommendations.', status: 'registered', provider: 'automatic' },
  { id: 'recommendation_experience', name: 'Experience Recommendations', category: 'Recommendation Intelligence', description: 'Experience suggestions tailored to a member.', status: 'registered', provider: 'automatic' },
  { id: 'recommendation_circle', name: 'Circle Recommendations', category: 'Recommendation Intelligence', description: 'Circle suggestions based on interests.', status: 'registered', provider: 'automatic' },
  { id: 'recommendation_discovery', name: 'Discovery Recommendations', category: 'Recommendation Intelligence', description: 'Cross-domain discovery recommendations.', status: 'registered', provider: 'automatic' },
  { id: 'discovery_nearby', name: 'Nearby Suggestions', category: 'Discovery Intelligence', description: 'Location-aware nearby suggestions.', status: 'registered', provider: 'automatic' },
  { id: 'discovery_trending_experiences', name: 'Trending Experiences', category: 'Discovery Intelligence', description: 'Trending experience detection.', status: 'registered', provider: 'automatic' },
  { id: 'discovery_trending_circles', name: 'Trending Circles', category: 'Discovery Intelligence', description: 'Trending circle detection.', status: 'registered', provider: 'automatic' },
  { id: 'discovery_interest', name: 'Interest Discovery', category: 'Discovery Intelligence', description: 'Emerging interest discovery.', status: 'registered', provider: 'automatic' },
  { id: 'conversation_icebreakers', name: 'Ice Breakers', category: 'Conversation Intelligence', description: 'Contextual ice breaker suggestions.', status: 'registered', provider: 'anthropic' },
  { id: 'conversation_starters', name: 'Conversation Starters', category: 'Conversation Intelligence', description: 'Conversation starter generation.', status: 'registered', provider: 'anthropic' },
  { id: 'conversation_assistance', name: 'Messaging Assistance', category: 'Conversation Intelligence', description: 'Drafting and reply assistance.', status: 'registered', provider: 'anthropic' },
  { id: 'conversation_contextual', name: 'Contextual Suggestions', category: 'Conversation Intelligence', description: 'Context-aware conversation suggestions.', status: 'registered', provider: 'anthropic' },
  { id: 'trust_score', name: 'Trust Score Assistance', category: 'Trust Intelligence', description: 'Trust score reasoning assistance.', status: 'registered', provider: 'openai' },
  { id: 'trust_behavioral', name: 'Behavioral Signals', category: 'Trust Intelligence', description: 'Behavioral signal interpretation.', status: 'registered', provider: 'openai' },
  { id: 'trust_risk', name: 'Risk Indicators', category: 'Trust Intelligence', description: 'Risk indicator analysis.', status: 'registered', provider: 'openai' },
  { id: 'trust_verification', name: 'Verification Assistance', category: 'Trust Intelligence', description: 'Verification flow assistance.', status: 'registered', provider: 'openai' },
  { id: 'safety_spam', name: 'Spam Detection', category: 'Safety Intelligence', description: 'Spam content detection.', status: 'registered', provider: 'gemini' },
  { id: 'safety_scam', name: 'Scam Detection', category: 'Safety Intelligence', description: 'Scam pattern detection.', status: 'registered', provider: 'gemini' },
  { id: 'safety_abuse', name: 'Abuse Detection', category: 'Safety Intelligence', description: 'Abusive content detection.', status: 'registered', provider: 'gemini' },
  { id: 'safety_harassment', name: 'Harassment Detection', category: 'Safety Intelligence', description: 'Harassment detection.', status: 'registered', provider: 'gemini' },
  { id: 'safety_fake_account', name: 'Fake Account Detection', category: 'Safety Intelligence', description: 'Fake account signal detection.', status: 'registered', provider: 'gemini' },
  { id: 'safety_dangerous_content', name: 'Dangerous Content Detection', category: 'Safety Intelligence', description: 'Dangerous content detection.', status: 'registered', provider: 'gemini' },
  { id: 'localization_language_detection', name: 'Language Detection', category: 'Localization Intelligence', description: 'Language detection from text.', status: 'registered', provider: 'automatic' },
  { id: 'localization_translation', name: 'Translation', category: 'Localization Intelligence', description: 'Translation across supported languages.', status: 'registered', provider: 'automatic' },
  { id: 'localization_rtl', name: 'RTL Awareness', category: 'Localization Intelligence', description: 'RTL layout and direction awareness.', status: 'registered', provider: 'automatic' },
  { id: 'localization_cultural', name: 'Cultural Context', category: 'Localization Intelligence', description: 'Cultural context adaptation.', status: 'registered', provider: 'automatic' },
  { id: 'business_executive_insights', name: 'Executive Insights', category: 'Business Intelligence', description: 'Executive-level insight synthesis.', status: 'registered', provider: 'anthropic' },
  { id: 'business_growth', name: 'Growth Analysis', category: 'Business Intelligence', description: 'Growth trend analysis.', status: 'registered', provider: 'anthropic' },
  { id: 'business_community', name: 'Community Insights', category: 'Business Intelligence', description: 'Community health insights.', status: 'registered', provider: 'anthropic' },
  { id: 'operational', name: 'Operational Intelligence', category: 'Operational Intelligence', description: 'Operational anomaly and status intelligence.', status: 'registered', provider: 'openai' },
];

const FUTURE_SERVICES = [
  { id: 'ai_companion', name: 'AI Companion', category: 'Future Modules', description: 'Personal AI companion.' },
  { id: 'ai_event_planner', name: 'AI Event Planner', category: 'Future Modules', description: 'Event planning assistant.' },
  { id: 'ai_circle_assistant', name: 'AI Circle Assistant', category: 'Future Modules', description: 'Circle management assistant.' },
  { id: 'ai_networking_coach', name: 'AI Networking Coach', category: 'Future Modules', description: 'Networking guidance coach.' },
  { id: 'ai_wellness', name: 'AI Wellness Assistant', category: 'Future Modules', description: 'Wellbeing assistant.' },
  { id: 'ai_travel', name: 'AI Travel Assistant', category: 'Future Modules', description: 'Travel planning assistant.' },
  { id: 'ai_business_communities', name: 'AI Business Communities Assistant', category: 'Future Modules', description: 'Business communities assistant.' },
  { id: 'ai_voice', name: 'AI Voice', category: 'Future Modules', description: 'Voice interface and speech.' },
  { id: 'ai_vision', name: 'AI Vision', category: 'Future Modules', description: 'Image and vision intelligence.' },
  { id: 'ai_agents', name: 'AI Agents', category: 'Future Modules', description: 'Autonomous AI agents.' },
  { id: 'ai_multi_agent', name: 'Multi-Agent Collaboration', category: 'Future Modules', description: 'Coordinated multi-agent workflows.' },
];

const REQUEST_STANDARD = ['Request ID', 'Timestamp', 'Member ID', 'Session ID', 'Language', 'Country', 'Context', 'AI Service', 'Priority', 'Processing Time', 'Confidence Score', 'Status'];
const RESPONSE_STANDARD = ['Response ID', 'Result', 'Confidence Score', 'Safety Status', 'Language', 'Processing Time', 'Reasoning Summary', 'Metadata', 'Explainability Placeholder'];

const PILLARS = ['Modular', 'Provider Independent', 'Secure', 'Scalable', 'Explainable', 'Privacy-Aware', 'Observable', 'Enterprise Ready'];

function genId() { return 'ai_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function topCount(arr, field, n) {
  const c = {};
  arr.forEach((e) => { const v = e[field]; if (v) c[v] = (c[v] || 0) + 1; });
  return Object.entries(c).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, n);
}

function mapStatus(et) {
  if (et === 'timeout') return 'timeout';
  if (et === 'safety_block') return 'safety_block';
  if (et === 'invalid_response') return 'invalid_response';
  if (et === 'service_unavailable' || et === 'temporary_unavailable') return 'unavailable';
  return 'failed';
}

async function computeMetrics(svc) {
  const list = await svc.entities.AiExecution.list('-created_date', 500).catch(() => []);
  const execs = list || [];
  const total = execs.length;
  const success = execs.filter((e) => e.status === 'success');
  const failedCount = total - success.length;
  const successRate = total ? Math.round((success.length / total) * 100) : 0;
  const avgResponseTime = success.length ? Math.round(success.reduce((a, e) => a + (e.processing_time_ms || 0), 0) / success.length) : 0;
  const conf = { low: 0, medium: 0, high: 0 };
  success.forEach((e) => { const c = e.confidence_score || 0; if (c < 0.5) conf.low++; else if (c < 0.8) conf.medium++; else conf.high++; });
  const safetyEvents = execs.filter((e) => e.safety_status !== 'safe').length;
  const langDist = {};
  execs.forEach((e) => { const l = e.language || 'unknown'; langDist[l] = (langDist[l] || 0) + 1; });
  const recExecs = execs.filter((e) => String(e.service_category || '').toLowerCase().includes('recommendation'));
  const recAccepted = recExecs.filter((e) => e.accepted).length;
  const recommendationAcceptance = recExecs.length ? Math.round((recAccepted / recExecs.length) * 100) : 0;
  return {
    totalRequests: total,
    successCount: success.length,
    failedCount,
    successRate,
    errorRate: total ? 100 - successRate : 0,
    avgResponseTime,
    confidenceDistribution: conf,
    aiAvailability: successRate,
    safetyEvents,
    languageDistribution: Object.entries(langDist).map(([name, count]) => ({ name, count })),
    recommendationAcceptance,
    byService: topCount(execs, 'ai_service', 8),
    byCategory: topCount(execs, 'service_category', 8),
    byProvider: topCount(execs, 'provider', 6),
    recent: execs.slice(0, 20).map((e) => ({
      request_id: e.request_id, ai_service: e.ai_service, status: e.status,
      processing_time_ms: e.processing_time_ms, confidence_score: e.confidence_score,
      language: e.language, created_date: e.created_date,
    })),
  };
}

async function finalizeFailure(svc, p) {
  const processing_time_ms = Date.now() - p.t0;
  try {
    await svc.entities.AiExecution.create({
      request_id: p.request_id, ai_service: p.ai_service, service_category: p.service_category,
      provider: p.provider, model: p.model, priority: p.priority, member_id: p.member_id || '',
      session_id: p.session_id || '', language: p.language || 'en', country: p.country || '',
      processing_time_ms, confidence_score: 0, status: mapStatus(p.error_type),
      safety_status: p.error_type === 'safety_block' ? 'blocked' : 'safe',
      error_type: p.error_type, response_summary: p.response_summary, accepted: false, context: {},
    });
  } catch (_e) { /* never fail the response because logging failed */ }
  const errorMap = {
    service_not_found: 'Service not registered in the AI Brain.',
    service_unavailable: 'Requested AI service is not active yet.',
    unsupported_language: 'The requested language is not supported.',
    provider_failure: 'The AI provider failed to respond. Please retry.',
    timeout: 'The request timed out.',
    invalid_response: 'The provider returned an invalid response.',
    safety_block: 'The request was blocked by safety intelligence.',
    temporary_unavailable: 'AI services are temporarily unavailable.',
  };
  return Response.json({
    response_id: genId(), request_id: p.request_id, ai_service: p.ai_service, provider: p.provider,
    model: p.model, result: null, confidence_score: 0,
    safety_status: p.error_type === 'safety_block' ? 'blocked' : 'safe', language: p.language || 'en',
    processing_time_ms, reasoning_summary: errorMap[p.error_type] || 'Request failed.',
    metadata: {}, explainability_placeholder: 'Explainability will be available in a future enhancement.',
    status: 'failed', error_type: p.error_type,
  });
}

async function handleInvoke(svc, body) {
  const { ai_service, prompt, response_json_schema, language, country, member_id, session_id, priority, context, provider } = body;
  const request_id = genId();
  const t0 = Date.now();
  const svc0 = SERVICES.find((s) => s.id === ai_service) || FUTURE_SERVICES.find((s) => s.id === ai_service);
  if (!svc0) {
    return await finalizeFailure(svc, { request_id, ai_service: ai_service || '', service_category: '', provider: provider || 'automatic', model: '', language, country, member_id, session_id, priority: priority || 'normal', t0, error_type: 'service_not_found', response_summary: 'Service not registered' });
  }
  if (svc0.status === 'future') {
    return await finalizeFailure(svc, { request_id, ai_service, service_category: svc0.category, provider: provider || 'automatic', model: '', language, country, member_id, session_id, priority: priority || 'normal', t0, error_type: 'service_unavailable', response_summary: 'Future module not active' });
  }
  if (language && !SUPPORTED_LANGUAGES.includes(language)) {
    return await finalizeFailure(svc, { request_id, ai_service, service_category: svc0.category, provider: provider || svc0.provider || 'automatic', model: '', language, country, member_id, session_id, priority: priority || 'normal', t0, error_type: 'unsupported_language', response_summary: 'Language not supported' });
  }
  const prov = provider || svc0.provider || 'automatic';
  const model = PROVIDER_MODEL[prov] || 'automatic';
  try {
    const invokeArgs = { prompt: prompt || '', model };
    if (response_json_schema && typeof response_json_schema === 'object') invokeArgs.response_json_schema = response_json_schema;
    const result = await svc.integrations.Core.InvokeLLM(invokeArgs);
    const processing_time_ms = Date.now() - t0;
    const confidence = 0.85;
    const response_summary = 'Generated via ' + prov + '/' + model;
    await svc.entities.AiExecution.create({
      request_id, ai_service, service_category: svc0.category, provider: prov, model,
      priority: priority || 'normal', member_id: member_id || '', session_id: session_id || '',
      language: language || 'en', country: country || '', processing_time_ms, confidence_score: confidence,
      status: 'success', safety_status: 'safe', response_summary, accepted: false,
      context: { context_summary: String(context || '').slice(0, 200) },
    });
    return Response.json({
      response_id: genId(), request_id, ai_service, provider: prov, model, result,
      confidence_score: confidence, safety_status: 'safe', language: language || 'en',
      processing_time_ms, reasoning_summary: response_summary,
      metadata: { service_category: svc0.category, priority: priority || 'normal', member_id: member_id || null, session_id: session_id || null, country: country || null },
      explainability_placeholder: 'Explainability will be available in a future enhancement.',
      status: 'success',
    });
  } catch (_e) {
    return await finalizeFailure(svc, { request_id, ai_service, service_category: svc0.category, provider: prov, model, language, country, member_id, session_id, priority: priority || 'normal', t0, error_type: 'provider_failure', response_summary: 'Provider call failed' });
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
      const metrics = await computeMetrics(svc);
      return Response.json({
        services: SERVICES,
        future: FUTURE_SERVICES,
        providers: PROVIDERS,
        pillars: PILLARS,
        requestStandard: REQUEST_STANDARD,
        responseStandard: RESPONSE_STANDARD,
        supportedLanguages: SUPPORTED_LANGUAGES,
        metrics,
      });
    }
    if (mode === 'invoke') {
      return await handleInvoke(svc, body);
    }
    if (mode === 'accept') {
      const { request_id } = body;
      if (!request_id) return Response.json({ error: 'request_id required' }, { status: 400 });
      const list = await svc.entities.AiExecution.filter({ request_id }, '-created_date', 1);
      const exec = list && list[0];
      if (!exec) return Response.json({ error: 'Execution not found' }, { status: 404 });
      await svc.entities.AiExecution.update(exec.id, { accepted: true });
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    console.error('aiBrain error:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
});