import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AI-002 — Personal Intelligence Platform. Privacy-first AI memory, semantic
// intelligence, knowledge graph architecture, personalization & recommendation
// learning. Establishes the architecture only; does not modify existing AI.

const PILLARS = ['Privacy First', 'Consent Driven', 'Explainable', 'Transparent', 'Human-Centric', 'Context Aware', 'Multilingual', 'Provider Independent', 'Enterprise Ready'];

const MEMORY_DOMAINS = [
  { id: 'interest', name: 'Interest Memory', fields: ['Interests', 'Hobbies', 'Preferred Activities', 'Favorite Categories', 'Frequently Joined Experiences', 'Frequently Joined Circles'] },
  { id: 'preference', name: 'Preference Memory', fields: ['Preferred Experience Types', 'Preferred Group Size', 'Preferred Time of Day', 'Preferred Days', 'Budget Preferences', 'Travel Distance', 'Social Preferences', 'Energy Level Preferences'] },
  { id: 'behavioral', name: 'Behavioral Memory', fields: ['Connection Acceptance', 'Experience Attendance', 'Circle Participation', 'Recommendation Acceptance', 'Recommendation Rejection', 'Search Behaviour'] },
  { id: 'conversation', name: 'Conversation Memory', fields: ['Conversation Style', 'Ice Breaker Success', 'Communication Preferences'], note: 'No private conversation content is stored — only interaction patterns where consent permits.' },
  { id: 'mood', name: 'Mood Memory', fields: ['Morning Explorer', 'Weekend Social', 'Evening Networking', 'Coffee Lover', 'Nature Explorer'], note: 'Recurring mood patterns used only to improve recommendations.' },
];

const GOVERNANCE = ['User Consent', 'Memory Visibility', 'Memory Editing', 'Memory Deletion', 'Automatic Expiration', 'Export', 'Right to be Forgotten'];

const SEMANTIC = ['Concept Recognition', 'Similar Meaning Detection', 'Intent Recognition', 'Topic Relationships', 'Context Awareness', 'Similar Interest Detection', 'Related Activity Detection'];

const SEARCH = ['Semantic Search', 'Natural Language Search', 'Typo Tolerance', 'Related Concepts', 'Synonyms', 'Cross-language Search', 'Intent-based Search'];

const PERSONALIZATION_INPUTS = ['Memory', 'Semantic Intelligence', 'Behavior', 'Context', 'Time', 'Location', 'Trust', 'Privacy Preferences', 'Language'];

const CONTEXT_SIGNALS = ['Current Mood', 'Current Location', 'Time', 'Day', 'Weather (future)', 'Travel Radius', 'Language', 'Country', 'Community Activity'];

const FUTURE = ['Life Journey Intelligence', 'Community Evolution', 'Friendship Predictions', 'Shared Interest Discovery', 'Social Graph Intelligence', 'Digital Twin (Opt-In Only)', 'Predictive Personalization', 'Wellness Signals (Opt-In Only)'];

const CONCEPTS_SEED = [
  { concept_id: 'coffee', category: 'interest', label_en: 'Coffee', labels: { en: 'Coffee', ar: 'قهوة', es: 'Café', fr: 'Café', de: 'Kaffee', it: 'Caffè' }, synonyms: ['espresso', 'latte', 'cappuccino', 'qahwa'], related: ['cafe_culture', 'foodie'] },
  { concept_id: 'photography', category: 'interest', label_en: 'Photography', labels: { en: 'Photography', ar: 'التصوير', es: 'Fotografía', fr: 'Photographie', de: 'Fotografie', it: 'Fotografia' }, synonyms: ['photo', 'camera'], related: ['art', 'travel'] },
  { concept_id: 'hiking', category: 'activity', label_en: 'Hiking', labels: { en: 'Hiking', ar: 'المشي لمسافات طويلة', es: 'Senderismo', fr: 'Randonnée', de: 'Wandern', it: 'Trekking' }, synonyms: ['trekking', 'trail'], related: ['nature', 'outdoor'] },
  { concept_id: 'yoga', category: 'activity', label_en: 'Yoga', labels: { en: 'Yoga', ar: 'اليوجا', es: 'Yoga', fr: 'Yoga', de: 'Yoga', it: 'Yoga' }, synonyms: ['meditation', 'mindfulness'], related: ['wellness'] },
  { concept_id: 'cooking', category: 'interest', label_en: 'Cooking', labels: { en: 'Cooking', ar: 'الطبخ', es: 'Cocina', fr: 'Cuisine', de: 'Kochen', it: 'Cucina' }, synonyms: ['culinary', 'chef'], related: ['foodie'] },
  { concept_id: 'music', category: 'interest', label_en: 'Music', labels: { en: 'Music', ar: 'الموسيقى', es: 'Música', fr: 'Musique', de: 'Musik', it: 'Musica' }, synonyms: ['concert', 'live music'], related: ['art'] },
  { concept_id: 'reading', category: 'interest', label_en: 'Reading', labels: { en: 'Reading', ar: 'القراءة', es: 'Lectura', fr: 'Lecture', de: 'Lesen', it: 'Lettura' }, synonyms: ['books', 'literature'], related: ['art'] },
  { concept_id: 'travel', category: 'interest', label_en: 'Travel', labels: { en: 'Travel', ar: 'السفر', es: 'Viajes', fr: 'Voyage', de: 'Reisen', it: 'Viaggi' }, synonyms: ['trips', 'adventure'], related: ['photography', 'nature'] },
  { concept_id: 'art', category: 'interest', label_en: 'Art', labels: { en: 'Art', ar: 'الفن', es: 'Arte', fr: 'Art', de: 'Kunst', it: 'Arte' }, synonyms: ['painting', 'gallery'], related: ['photography', 'music'] },
  { concept_id: 'cycling', category: 'activity', label_en: 'Cycling', labels: { en: 'Cycling', ar: 'ركوب الدراجات', es: 'Ciclismo', fr: 'Cyclisme', de: 'Radfahren', it: 'Ciclismo' }, synonyms: ['biking', 'bike'], related: ['fitness', 'nature'] },
  { concept_id: 'running', category: 'activity', label_en: 'Running', labels: { en: 'Running', ar: 'الجري', es: 'Correr', fr: 'Course', de: 'Laufen', it: 'Corsa' }, synonyms: ['jogging', 'marathon'], related: ['fitness'] },
  { concept_id: 'meditation', category: 'activity', label_en: 'Meditation', labels: { en: 'Meditation', ar: 'التأمل', es: 'Meditación', fr: 'Méditation', de: 'Meditation', it: 'Meditazione' }, synonyms: ['mindfulness', 'zen'], related: ['yoga', 'wellness'] },
  { concept_id: 'foodie', category: 'interest', label_en: 'Foodie', labels: { en: 'Foodie', ar: 'ذواقة', es: 'Gourmet', fr: 'Gastronomie', de: 'Feinschmecker', it: 'Gastronomo' }, synonyms: ['gourmet', 'food lover'], related: ['cooking'] },
  { concept_id: 'nature', category: 'interest', label_en: 'Nature', labels: { en: 'Nature', ar: 'الطبيعة', es: 'Naturaleza', fr: 'Nature', de: 'Natur', it: 'Natura' }, synonyms: ['outdoors', 'wilderness'], related: ['hiking', 'photography'] },
  { concept_id: 'fitness', category: 'activity', label_en: 'Fitness', labels: { en: 'Fitness', ar: 'اللياقة', es: 'Fitness', fr: 'Fitness', de: 'Fitness', it: 'Fitness' }, synonyms: ['gym', 'workout'], related: ['running', 'cycling'] },
  { concept_id: 'wellness', category: 'interest', label_en: 'Wellness', labels: { en: 'Wellness', ar: 'العافية', es: 'Bienestar', fr: 'Bien-être', de: 'Wellness', it: 'Benessere' }, synonyms: ['health', 'self-care'], related: ['yoga', 'meditation'] },
];

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + c);
  }
  return dp[m][n];
}

function searchableTerms(concept) {
  const out = [];
  const labels = concept.labels || {};
  Object.values(labels).forEach((v) => { if (v) out.push(String(v).toLowerCase()); });
  (concept.synonyms || []).forEach((s) => { if (s) out.push(String(s).toLowerCase()); });
  if (concept.label_en) out.push(String(concept.label_en).toLowerCase());
  if (concept.concept_id) out.push(String(concept.concept_id).toLowerCase());
  return out;
}

function matchScore(query, terms) {
  let best = 0;
  for (const t of terms) {
    if (t === query) return 100;
    if (t.startsWith(query)) best = Math.max(best, 85);
    else if (t.includes(query)) best = Math.max(best, 65);
    else {
      const d = levenshtein(query, t);
      const maxAllowed = query.length <= 6 ? 2 : 3;
      if (d > 0 && d <= maxAllowed) best = Math.max(best, 50 - d * 5);
    }
  }
  return best;
}

async function computeMetrics(svc) {
  const ok = (p) => p.catch(() => []);
  const [memories, signals, concepts] = await Promise.all([
    ok(svc.entities.AiMemory.list('-created_date', 1000)),
    ok(svc.entities.RecommendationSignal.list('-created_date', 1000)),
    ok(svc.entities.AiSemanticConcept.list('-created_date', 500)),
  ]);
  const memArr = memories || [];
  const sigArr = signals || [];
  const conArr = concepts || [];

  const byDomain = {};
  memArr.forEach((m) => { byDomain[m.domain] = (byDomain[m.domain] || 0) + 1; });
  const consented = memArr.filter((m) => m.consent).length;

  const bySignal = {};
  sigArr.forEach((s) => { bySignal[s.signal] = (bySignal[s.signal] || 0) + 1; });
  const accepted = bySignal.accepted || 0;
  const declined = bySignal.declined || 0;
  const generated = bySignal.generated || 0;
  const acceptanceRate = generated ? Math.round((accepted / generated) * 100) : 0;
  const declineRate = generated ? Math.round((declined / generated) * 100) : 0;

  const langs = new Set();
  conArr.forEach((c) => Object.keys(c.labels || {}).forEach((l) => langs.add(l)));
  sigArr.forEach((s) => { if (s.language) langs.add(s.language); });

  // Knowledge graph stats — server-side only, never exposed to members.
  const [members, experiences, circles, circleMems, attendances] = await Promise.all([
    ok(svc.entities.Member.list('-created_date', 1000)),
    ok(svc.entities.Experience.list('-created_date', 1000)),
    ok(svc.entities.Circle.list('-created_date', 1000)),
    ok(svc.entities.CircleMembership.list('-created_date', 1000)),
    ok(svc.entities.Attendance.list('-created_date', 1000)),
  ]);
  const mArr = members || []; const eArr = experiences || []; const cArr = circles || [];
  const cmArr = circleMems || []; const aArr = attendances || [];

  const interestSet = new Set();
  const locationSet = new Set();
  const langSet = new Set();
  const categorySet = new Set();
  mArr.forEach((m) => {
    (m.interests || []).forEach((i) => interestSet.add(i));
    if (m.city) locationSet.add(m.city);
    if (m.country) locationSet.add(m.country);
    (m.languages || []).forEach((l) => langSet.add(l));
  });
  eArr.forEach((e) => { if (e.category) categorySet.add(e.category); });
  cArr.forEach((c) => { if (c.category) categorySet.add(c.category); });

  const memberInterestEdges = mArr.reduce((a, m) => a + (m.interests || []).length, 0);
  const nodes = {
    members: mArr.length, experiences: eArr.length, circles: cArr.length,
    interests: interestSet.size, locations: locationSet.size, languages: langSet.size,
    categories: categorySet.size,
  };
  nodes.total = nodes.members + nodes.experiences + nodes.circles + nodes.interests + nodes.locations + nodes.languages + nodes.categories;
  const edges = {
    member_interest: memberInterestEdges,
    member_circle: cmArr.length,
    member_experience: aArr.length,
    concept_related: conArr.reduce((a, c) => a + (c.related || []).length, 0),
  };
  edges.total = edges.member_interest + edges.member_circle + edges.member_experience + edges.concept_related;

  return {
    memoryUsage: { total: memArr.length, consented, byDomain },
    recommendationLearning: { ...bySignal, generated, accepted, declined, acceptanceRate, declineRate },
    semanticAccuracy: { conceptCount: conArr.size, relatedLinks: edges.concept_related, coverageLanguages: langs.size },
    crossLanguageUsage: { languages: Array.from(langs), count: langs.size },
    personalizationEffectiveness: acceptanceRate,
    graphStats: { nodes, edges },
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const mode = body.mode;
    const svc = base44.asServiceRole;

    // --- Admin (Mission Control) modes ---
    if (mode === 'overview') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const metrics = await computeMetrics(svc);
      const concepts = await svc.entities.AiSemanticConcept.list('-created_date', 100).catch(() => []);
      return Response.json({
        pillars: PILLARS,
        memoryDomains: MEMORY_DOMAINS,
        governance: GOVERNANCE,
        semantic: SEMANTIC,
        search: SEARCH,
        personalizationInputs: PERSONALIZATION_INPUTS,
        contextSignals: CONTEXT_SIGNALS,
        future: FUTURE,
        metrics,
        concepts: concepts || [],
      });
    }

    if (mode === 'semanticSearch') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const q = String(body.query || '').toLowerCase().trim();
      if (!q) return Response.json({ matches: [] });
      const concepts = await svc.entities.AiSemanticConcept.list('-created_date', 500).catch(() => []);
      const matches = (concepts || []).map((c) => {
        const terms = searchableTerms(c);
        const score = matchScore(q, terms);
        let matchedTerm = null, matchedLang = null;
        for (const [lang, val] of Object.entries(c.labels || {})) {
          if (val && String(val).toLowerCase() === q) { matchedTerm = val; matchedLang = lang; break; }
        }
        if (!matchedTerm) for (const s of (c.synonyms || [])) { if (s && String(s).toLowerCase() === q) { matchedTerm = s; matchedLang = 'synonym'; break; } }
        return { concept_id: c.concept_id, label_en: c.label_en, score, matchedTerm, matchedLang, related: c.related || [] };
      }).filter((m) => m.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
      return Response.json({ query: body.query, matches });
    }

    if (mode === 'seedConcepts') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      // PB-003 — seed operations are development-only; blocked in production/staging.
      if (Deno.env.get('APP_ENV') !== 'development') {
        return Response.json({ error: 'Seed operations are not available outside development.' }, { status: 403 });
      }
      const existing = await svc.entities.AiSemanticConcept.list('-created_date', 500).catch(() => []);
      if ((existing || []).length >= CONCEPTS_SEED.length) {
        return Response.json({ ok: true, seeded: 0, total: (existing || []).length, message: 'Concepts already seeded.' });
      }
      const have = new Set((existing || []).map((c) => c.concept_id));
      const toCreate = CONCEPTS_SEED.filter((c) => !have.has(c.concept_id));
      if (toCreate.length) await svc.entities.AiSemanticConcept.bulkCreate(toCreate);
      return Response.json({ ok: true, seeded: toCreate.length, total: (existing || []).length + toCreate.length });
    }

    if (mode === 'memberMemory') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const memberId = String(body.member_id || '');
      if (!memberId) return Response.json({ error: 'member_id required' }, { status: 400 });
      const mems = await svc.entities.AiMemory.filter({ member_id: memberId }, '-created_date', 200).catch(() => []);
      const arr = mems || [];
      const byDomain = {};
      arr.forEach((m) => { byDomain[m.domain] = (byDomain[m.domain] || 0) + 1; });
      // Governance summary only — no raw private content exposed.
      return Response.json({
        member_id: memberId,
        total: arr.length,
        consented: arr.filter((m) => m.consent).length,
        byDomain,
        lastUpdated: arr[0]?.created_date || null,
      });
    }

    if (mode === 'explain') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { member_id, target_type, target_id } = body;
      if (!member_id) return Response.json({ error: 'member_id required' }, { status: 400 });
      const mems = await svc.entities.AiMemory.filter({ member_id, domain: 'interest' }, '-weight', 20).catch(() => []);
      const interests = (mems || []).map((m) => m.value).filter(Boolean).slice(0, 4);
      let reason;
      if (interests.length) reason = `Recommended because you enjoy ${interests.join(', ')}.`;
      else reason = 'Suggested based on activity in your community.';
      return Response.json({ reason, interests, target_type, target_id });
    }

    // --- Member governance modes (member controls own memory; user-scoped) ---
    if (mode === 'getMyMemory') {
      const list = await base44.entities.AiMemory.list('-created_date', 500).catch(() => []);
      return Response.json({ data: list || [] });
    }
    if (mode === 'setMyConsent') {
      const { memory_id, consent, visibility } = body;
      if (!memory_id) return Response.json({ error: 'memory_id required' }, { status: 400 });
      const patch = {};
      if (typeof consent === 'boolean') patch.consent = consent;
      if (visibility) patch.visibility = visibility;
      const result = await base44.entities.AiMemory.update(memory_id, patch);
      return Response.json({ ok: true, result });
    }
    if (mode === 'deleteMyMemory') {
      const { memory_id } = body;
      if (!memory_id) return Response.json({ error: 'memory_id required' }, { status: 400 });
      await base44.entities.AiMemory.delete(memory_id);
      return Response.json({ ok: true });
    }
    if (mode === 'exportMyMemory') {
      const list = await base44.entities.AiMemory.list('-created_date', 1000).catch(() => []);
      return Response.json({ exported: list || [], exported_at: new Date().toISOString() });
    }
    if (mode === 'forgetMe') {
      const list = await base44.entities.AiMemory.list('-created_date', 1000).catch(() => []);
      const sigs = await base44.entities.RecommendationSignal.list('-created_date', 1000).catch(() => []);
      let removed = 0;
      for (const m of (list || [])) { try { await base44.entities.AiMemory.delete(m.id); removed++; } catch (_e) {} }
      for (const s of (sigs || [])) { try { await base44.entities.RecommendationSignal.delete(s.id); } catch (_e) {} }
      return Response.json({ ok: true, removed });
    }
    if (mode === 'recordSignal') {
      const { target_type, target_id, signal, ai_service, language } = body;
      if (!target_type || !target_id || !signal) return Response.json({ error: 'target_type, target_id and signal required' }, { status: 400 });
      const result = await base44.entities.RecommendationSignal.create({
        member_id: String(user.id), target_type, target_id, signal, ai_service: ai_service || '', language: language || '',
      });
      return Response.json({ ok: true, result });
    }

    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    console.error('aiMemory error:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
});