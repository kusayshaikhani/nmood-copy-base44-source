// InMood AI Concierge — backend conversation handler.
// Authenticates the user, builds member context from real profile data,
// fetches real experiences/circles/members from the database, scores them
// with the centralized matching service, selects the top 3 per category,
// then calls InvokeLLM to generate a conversational message.
//
// The BACKEND — not the LLM — selects which items to recommend. This ensures
// eligible records are always shown, even when match scores are modest.
// The LLM only writes a warm conversational message about the selections.
//
// Free members: 3 requests / 24h. Premium members: unlimited.
//
// Safety: never invents venues/prices, clearly labels demo suggestions,
// respects blocks, excludes self, only recommends from real app data.
// All matching scores are computed server-side — the LLM never fabricates scores.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { json, isPremium, getMembership, getMember } from '../../shared/concierge-utils.ts';
import { scoreMember, scoreCircle, scoreExperience, type UserContext } from '../../shared/concierge-matching.ts';

function lower(s: any): string {
  return String(s || '').toLowerCase();
}

const SYSTEM_PROMPT = `You are the Nmood Concierge — a warm, intelligent social assistant for the Nmood platform.

The system has ALREADY selected the best available recommendations for the member from real database records. Your job is to write a warm, conversational message (2-4 sentences) introducing these selections.

CORE RULES:
- Be warm, conversational, and genuine — like a thoughtful friend who knows the city.
- Keep responses concise (2-4 sentences). Don't over-explain.
- Address the member by first name when natural.
- Explain WHY the selected items are good matches, using the match reasons provided.
- If some preferences couldn't be fully met, mention the compromise gently. Example: "These are the closest available matches. Some may not match every preference."
- When important info is missing (budget, group size, travel distance, timing), ask ONE short clarifying question.
- Never ask for info already provided in the member context or recent messages.
- Never invent or fabricate items, venues, prices, or IDs.
- Never present emergency, medical, legal, or financial guidance as professional advice.
- For meeting someone, remind them to meet in a public place.
- Never describe lower-scoring results as poor or incompatible. Focus on the positive matching factors.

ACCURACY RULES — CRITICAL:
- NEVER claim live opening hours, prices, ratings, availability, capacity, bookings, addresses, or travel times.
- NEVER present inspirational ideas as verified live listings.
- If the system selected real Nmood Experiences, Circles, or Members, refer to them as real listings from the community.
- If the system also generated inspirational ideas, mention them as "inspirational ideas to explore" — NOT as verified venues.
- Use approximate price ranges and label them as estimates when discussing costs.
- Do not mention Google Places or any external venue provider.

RESPONSE FORMAT:
Respond as a JSON object:
{
  "message": "Your conversational response (2-4 sentences).",
  "clarifying_question": null or "one short question when info is missing"
}

Do NOT include a recommendations array — the system handles that. Only return the message and optional clarifying_question.`;

// Parse the LLM response — just message + clarifying_question
function parseLLMMessage(raw: any): { message: string; clarifying_question: string | null } {
  if (!raw) return { message: '', clarifying_question: null };
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    let message = String(raw.message || '').trim();
    let q = raw.clarifying_question ? String(raw.clarifying_question).trim() : null;
    if (q === 'null') q = null;
    if (!message && q) { message = q; q = null; }
    return { message, clarifying_question: q };
  }
  if (typeof raw === 'string') {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed === 'object') return parseLLMMessage(parsed);
    } catch { /* not JSON */ }
    return { message: raw.trim(), clarifying_question: null };
  }
  return { message: '', clarifying_question: null };
}

// Parse strict filters from the user's message.
// "only," "must," "exclude" trigger strict filtering.
// Other preferences are soft ranking signals (handled by the scoring service).
function parseStrictFilters(message: string): { freeOnly: boolean; nearCity: string | null } {
  const l = lower(message);
  const freeOnly = /(?:\bonly\b[^\n]{0,20}\bfree\b|\bfree\b[^\n]{0,20}\bonly\b|\bmust\s+be\s+free\b|\bexclude.*paid\b)/.test(l);
  const nearMatch = l.match(/\bnear\s+([a-z][a-z\s]+?)(?:\.|,|$|only|options)/);
  const nearCity = nearMatch ? nearMatch[1].trim() : null;
  return { freeOnly, nearCity };
}

// Detect if the user is asking for an itinerary.
function isItineraryRequest(message: string): boolean {
  const l = lower(message);
  return /\b(itinerary|plan a (day|weekend|night|trip|date)|day plan|weekend plan|full day|half day|schedule|agenda|route)\b/.test(l);
}

// Detect if the user is asking for general ideas/inspiration.
function isIdeasRequest(message: string): boolean {
  const l = lower(message);
  return /\b(ideas?|suggest|what should i do|inspire|something to do|activities|things to do|give me some)\b/.test(l);
}

// Generate inspirational activity ideas using the LLM.
// These are clearly labeled as "Inspirational" — never presented as verified listings.
async function generateInspirational(base44: any, memberContext: any, userMessage: string): Promise<any[]> {
  const prompt = `You are the Nmood Concierge. Generate 1-3 inspirational activity ideas for the member.

MEMBER CONTEXT:
- First name: ${memberContext.firstName}
- Current location: ${memberContext.city}
- Interests: ${memberContext.interests.join(', ') || 'none set'}
- Lifestyle: ${memberContext.lifestyle || 'not specified'}

REQUEST: "${userMessage}"

STRICT RULES:
- Generate activity ideas based on the member's interests and location.
- Use GENERAL area descriptions only (e.g., "a cafe in DIFC", "a park in Jumeirah", "the Marina waterfront"). NEVER use specific venue names, business names, addresses, or phone numbers.
- Use approximate price ranges labeled as estimates (e.g., "~AED 50-100", "Free", "~AED 200+").
- NEVER claim live opening hours, ratings, availability, capacity, or bookings.
- Each idea should be a general activity type, not a specific business.
- Keep descriptions concise (1-2 sentences).
- Do not mention Google Places or any external provider.

Respond as JSON:
{
  "ideas": [
    {
      "title": "Activity name",
      "description": "1-2 sentence description",
      "category": "Activity category",
      "area": "General area (e.g., 'DIFC, Dubai')",
      "estimated_cost": "Approximate price range (e.g., '~AED 50-100')",
      "why_it_matches": "Why this fits the member's request"
    }
  ]
}`;

  try {
    const raw = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                area: { type: 'string' },
                estimated_cost: { type: 'string' },
                why_it_matches: { type: 'string' },
              },
            },
          },
        },
        required: ['ideas'],
      },
    });

    const ideas = (raw?.ideas || []).filter((idea: any) => idea && idea.title).map((idea: any, i: number) => ({
      id: `inspirational-${Date.now()}-${i}`,
      type: 'inspirational',
      source: 'inspirational',
      title: String(idea.title).slice(0, 100),
      category: String(idea.category || '').slice(0, 50),
      image_url: '',
      short_explanation: String(idea.description || '').slice(0, 150),
      location: String(idea.area || '').slice(0, 100),
      price_range: idea.estimated_cost ? `${idea.estimated_cost} (estimate)` : '',
      why_it_matches: String(idea.why_it_matches || 'Inspirational idea based on your interests.').slice(0, 200),
      is_inspirational: true,
      match_score: 0,
      match_label: 'Inspirational',
    }));
    return ideas;
  } catch (err) {
    console.error('generateInspirational error:', err);
    return [];
  }
}

// Generate an inspirational itinerary using the LLM.
// Clearly labeled as "Inspirational" — never presented as a verified plan.
async function generateItinerary(base44: any, memberContext: any, userMessage: string): Promise<any | null> {
  const prompt = `You are the Nmood Concierge. Generate an inspirational itinerary for the member.

MEMBER CONTEXT:
- First name: ${memberContext.firstName}
- Current location: ${memberContext.city}
- Interests: ${memberContext.interests.join(', ') || 'none set'}
- Lifestyle: ${memberContext.lifestyle || 'not specified'}

REQUEST: "${userMessage}"

STRICT RULES:
- Generate a multi-step itinerary (3-5 steps).
- Use GENERAL time periods (e.g., "Morning", "Afternoon", "Evening") not specific clock times.
- Use GENERAL area descriptions only (e.g., "a cafe in DIFC", "a park in Jumeirah"). NEVER use specific venue names, business names, addresses, or phone numbers.
- Use approximate price ranges labeled as estimates (e.g., "~AED 50-100", "Free").
- NEVER claim live opening hours, ratings, availability, capacity, bookings, or exact travel times.
- Do not mention Google Places or any external provider.

Respond as JSON:
{
  "itinerary": {
    "title": "Itinerary title",
    "steps": [
      {
        "time_period": "Morning",
        "activity": "Activity description",
        "area": "General area",
        "estimated_cost": "~AED 50-100",
        "notes": "Optional notes"
      }
    ],
    "total_cost": "~AED 200-400 (estimated)"
  }
}`;

  try {
    const raw = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          itinerary: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    time_period: { type: 'string' },
                    activity: { type: 'string' },
                    area: { type: 'string' },
                    estimated_cost: { type: 'string' },
                    notes: { type: 'string' },
                  },
                },
              },
              total_cost: { type: 'string' },
            },
          },
        },
        required: ['itinerary'],
      },
    });

    const it = raw?.itinerary;
    if (!it || !Array.isArray(it.steps) || it.steps.length === 0) return null;

    return {
      title: String(it.title || 'Your Inspirational Plan').slice(0, 100),
      is_inspirational: true,
      steps: it.steps.map((step: any) => ({
        start_time: String(step.time_period || '').slice(0, 20),
        activity: String(step.activity || '').slice(0, 150),
        venue: String(step.area || '').slice(0, 100),
        estimated_cost: step.estimated_cost ? `${step.estimated_cost} (estimate)` : '',
        notes: String(step.notes || '').slice(0, 200),
      })),
      total_cost: it.total_cost ? `${it.total_cost} (estimate)` : '',
    };
  } catch (err) {
    console.error('generateItinerary error:', err);
    return null;
  }
}

// Count user messages in the last 24h for free-member quota.
async function countRecentMessages(svc: any, userId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600000).toISOString();
  const rows = await svc.entities.ConciergeMessage.filter({
    user_id: String(userId), role: 'user', created_date: { $gte: since },
  }).catch(() => []);
  return (rows || []).length;
}

// Build the user context for matching.
async function buildUserContext(svc: any, user: any, member: any): Promise<UserContext> {
  const userId = String(user.id);
  const [myCircles, myAttendance, myPals, myBlocks, myPendingOut] = await Promise.all([
    svc.entities.CircleMembership.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.Attendance.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.PalConnection.filter({ user_id: userId, is_active: true }).catch(() => []),
    svc.entities.BlockedMember.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.PalRequest.filter({ sender_user_id: userId, status: 'pending' }).catch(() => []),
  ]);
  return {
    userId,
    interests: Array.isArray(member?.interests) ? member.interests : [],
    languages: Array.isArray(member?.languages) ? member.languages : [],
    city: member?.city || '',
    lifestyle: member?.lifestyle || '',
    circleIds: (myCircles || []).map((c: any) => String(c.circle_id)),
    experienceIds: (myAttendance || []).map((a: any) => String(a.experience_id)),
    palUserIds: (myPals || []).map((p: any) => String(p.pal_user_id)),
    blockedUserIds: (myBlocks || []).map((b: any) => String(b.blocked_user_id)),
    pendingUserIds: (myPendingOut || []).map((p: any) => String(p.receiver_user_id)),
  };
}

// Fetch, filter, and score all recommendation data. Returns top 3 per category.
// Hard exclusions (safety/access) are always enforced.
// Strict filters (from "only"/"must"/"exclude" in the message) are applied as hard filters.
// Soft preferences (mood, timing, interests) are handled by the scoring service as ranking signals.
async function fetchScoredData(svc: any, user: any, member: any, ctx: UserContext, userMessage: string) {
  const userId = String(user.id);
  const filters = parseStrictFilters(userMessage);

  // Fetch hidden/not-interested preferences to exclude
  const prefs = await svc.entities.ConciergePreference.filter({ user_id: userId }).catch(() => []);
  const hiddenIds = new Set((prefs || []).filter((p: any) => p.action === 'hidden' || p.action === 'not_interested').map((p: any) => String(p.item_id)));

  // Fetch all data in parallel
  const [experiences, circles, members, circleMemberships] = await Promise.all([
    svc.entities.Experience.list('-created_date', 30).catch(() => []),
    svc.entities.Circle.list('-created_date', 30).catch(() => []),
    svc.entities.Member.list('-created_date', 50).catch(() => []),
    svc.entities.CircleMembership.list('-created_date', 100).catch(() => []),
  ]);

  // ─── Score and filter Circles ─────────────────────────────────────────
  const myCircleIds = new Set(ctx.circleIds);
  const scoredCircles = (circles || [])
    .filter((c: any) => {
      // Hard exclusions (safety/access) — never relaxed
      if (hiddenIds.has(String(c.id))) return false;
      if (c.status !== 'active') return false;
      if (c.is_hidden) return false;
      if (c.is_demo) return false;
      if (!c.name) return false;
      if (myCircleIds.has(String(c.id))) return false;
      if (c.max_members && (c.member_count || 0) >= c.max_members && c.registrations_open === false) return false;
      // Strict filter: free only (check both budget_amount and budget string)
      if (filters.freeOnly && ((c.budget_amount || 0) > 0 || (c.budget && !['free', ''].includes(lower(c.budget))))) return false;
      // Strict filter: near city
      if (filters.nearCity && c.location && !lower(c.location).includes(filters.nearCity)) return false;
      return true;
    })
    .map((c: any) => {
      const match = scoreCircle(c, ctx, userMessage);
      const actualCount = (circleMemberships || []).filter((m: any) => String(m.circle_id) === String(c.id) && m.status === 'member').length;
      return {
        id: c.id,
        type: 'circle',
        source: c.is_demo ? 'demo' : 'inmood_circle',
        title: c.name || '',
        category: c.category || '',
        image_url: c.cover_photo || '',
        short_explanation: (c.description || '').slice(0, 120),
        location: c.location || 'Online',
        price_range: c.budget || '',
        match_score: match.score,
        match_label: match.label,
        why_it_matches: match.reasons.join('. ') || `Suggested because this Circle is active${c.location ? ` in ${c.location}` : ''}.`,
        is_demo: c.is_demo || false,
        privacy: c.privacy || 'public',
        member_count: actualCount || c.member_count || 0,
        max_members: c.max_members || 0,
        registrations_open: c.registrations_open !== false,
      };
    })
    .sort((a: any, b: any) => b.match_score - a.match_score)
    .slice(0, 3);

  // ─── Score and filter Experiences ─────────────────────────────────────
  const myExpIds = new Set(ctx.experienceIds);
  const now = new Date();
  const scoredExperiences = (experiences || [])
    .filter((e: any) => {
      // Hard exclusions (safety/access) — never relaxed
      if (hiddenIds.has(String(e.id))) return false;
      if (e.is_hidden || e.is_archived) return false;
      if (e.is_demo) return false;
      if (e.status === 'cancelled' || e.status === 'completed') return false;
      if (e.status !== 'active') return false;
      if (!e.title) return false;
      if (myExpIds.has(String(e.id))) return false;
      if (e.max_participants && (e.spots_filled || 0) >= e.max_participants) return false;
      if (e.date) {
        const expDate = new Date(e.date);
        if (!isNaN(expDate.getTime()) && expDate < now) return false;
      }
      if (e.host_user_id && ctx.blockedUserIds.includes(String(e.host_user_id))) return false;
      // Strict filter: free only (check both budget_amount and budget string)
      if (filters.freeOnly && ((e.budget_amount || 0) > 0 || (e.budget && !['free', ''].includes(lower(e.budget))))) return false;
      // Strict filter: near city
      if (filters.nearCity && e.location && !lower(e.location).includes(filters.nearCity)) return false;
      return true;
    })
    .map((e: any) => {
      const match = scoreExperience(e, ctx, userMessage);
      const spotsLeft = e.max_participants ? Math.max(0, e.max_participants - (e.spots_filled || 0)) : null;
      return {
        id: e.id,
        type: 'experience',
        source: e.is_demo ? 'demo' : 'inmood_experience',
        title: e.title || '',
        category: e.category || '',
        image_url: e.cover_image || '',
        short_explanation: (e.description || '').slice(0, 120),
        location: e.location || '',
        date_time: [e.date, e.time].filter(Boolean).join(' at '),
        price_range: e.budget || '',
        match_score: match.score,
        match_label: match.label,
        why_it_matches: match.reasons.join('. ') || `Suggested because this Experience fits your timing.`,
        is_demo: e.is_demo || false,
        host_name: e.host_name || '',
        spots_remaining: spotsLeft,
        max_participants: e.max_participants || 0,
      };
    })
    .sort((a: any, b: any) => b.match_score - a.match_score)
    .slice(0, 3);

  // ─── Score and filter Members ────────────────────────────────────────
  const blockedSet = new Set(ctx.blockedUserIds);
  const palSet = new Set(ctx.palUserIds);
  const pendingSet = new Set(ctx.pendingUserIds);
  const myEmail = (member?.email || '').toLowerCase();

  const memberCircleMap = new Map<string, Set<string>>();
  for (const cm of (circleMemberships || [])) {
    if (cm.status !== 'member') continue;
    const uid = String(cm.created_by_id);
    if (!memberCircleMap.has(uid)) memberCircleMap.set(uid, new Set());
    memberCircleMap.get(uid)!.add(String(cm.circle_id));
  }

  const scoredMembers = (members || [])
    .filter((m: any) => {
      // Hard exclusions (safety/access) — never relaxed
      if (hiddenIds.has(String(m.id))) return false;
      if (member?.id && String(m.id) === String(member.id)) return false;
      if (myEmail && m.email && String(m.email).toLowerCase() === myEmail) return false;
      if (blockedSet.has(String(m.created_by_id)) || blockedSet.has(String(m.id))) return false;
      if (palSet.has(String(m.created_by_id)) || palSet.has(String(m.id))) return false;
      if (pendingSet.has(String(m.created_by_id))) return false;
      if (['suspended', 'deleted', 'banned', 'deactivated'].includes(m.admin_status)) return false;
      if (m.account_state === 'deleted' || m.account_state === 'hidden' || m.account_state === 'paused') return false;
      if (!m.onboarding_completed) return false;
      if (m.profile_visibility === 'private') return false;
      if (!m.display_name) return false;
      // AGE-001 — Exclude members without a valid 18+ DOB.
      if (!m.date_of_birth) return false;
      const mBirth = new Date(m.date_of_birth);
      if (isNaN(mBirth.getTime()) || mBirth.getTime() > Date.now()) return false;
      let mAge = now.getFullYear() - mBirth.getFullYear();
      if (now.getMonth() < mBirth.getMonth() ||
          (now.getMonth() === mBirth.getMonth() && now.getDate() < mBirth.getDate())) mAge--;
      if (mAge < 18) return false;
      // Strict filter: near city (for members, check their city)
      if (filters.nearCity && m.city && !lower(m.city).includes(filters.nearCity)) return false;
      return true;
    })
    .map((m: any) => {
      const match = scoreMember(m, ctx, userMessage);
      const theirCircles = memberCircleMap.get(String(m.created_by_id)) || new Set();
      const mutualCircles = [...theirCircles].filter((c) => ctx.circleIds.includes(c));
      return {
        id: m.id,
        user_id: m.created_by_id,
        type: 'member',
        source: 'inmood_member',
        title: m.display_name || '',
        category: '',
        image_url: m.photo_url || '',
        short_explanation: (m.bio || '').slice(0, 100),
        location: m.city || '',
        match_score: match.score,
        match_label: match.label,
        why_it_matches: match.reasons.join('. ') || `Suggested because this member is active${m.city ? ` in ${m.city}` : ''}.`,
        is_demo: false,
        interests: Array.isArray(m.interests) ? m.interests.slice(0, 5) : [],
        languages: Array.isArray(m.languages) ? m.languages.slice(0, 3) : [],
        mutual_circles_count: mutualCircles.length,
      };
    })
    .sort((a: any, b: any) => b.match_score - a.match_score)
    .slice(0, 3);

  return { circles: scoredCircles, experiences: scoredExperiences, members: scoredMembers };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json(401, { error: 'unauthorized' });
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));

    // AGE-001 — Server-side eligibility check. The Concierge must independently
    // resolve the caller's Member record and verify 18+ from the DOB. Never
    // rely on client-side EligibilityGate or route visibility alone.
    const member = await getMember(svc, user.id);
    if (!member || !member.date_of_birth) {
      return json(403, { code: 'eligibility_required', message: 'Please confirm your date of birth to use the AI Concierge.' });
    }
    const eligBirth = new Date(member.date_of_birth);
    if (isNaN(eligBirth.getTime()) || eligBirth.getTime() > Date.now()) {
      return json(403, { code: 'eligibility_required', message: 'Please confirm your date of birth to use the AI Concierge.' });
    }
    const eligToday = new Date();
    let eligAge = eligToday.getFullYear() - eligBirth.getFullYear();
    if (eligToday.getMonth() < eligBirth.getMonth() ||
        (eligToday.getMonth() === eligBirth.getMonth() && eligToday.getDate() < eligBirth.getDate())) eligAge--;
    if (eligAge < 18) {
      return json(403, { code: 'eligibility_required', message: 'You must be at least 18 to use the AI Concierge.' });
    }

    // --- Quota check (free members) ---
    const membership = await getMembership(svc, user.id);
    const premium = isPremium(membership);
    if (!premium) {
      const used = await countRecentMessages(svc, user.id);
      if (used >= 3) {
        return json(403, {
          error: 'limit_reached',
          message: 'You have used all 3 free Concierge requests today. Upgrade to Premium for unlimited conversations.',
          used, limit: 3,
        });
      }
    }

    // --- Build member context (member already resolved above for eligibility) ---
    const memberContext = {
      firstName: member?.first_name || member?.display_name?.split(' ')[0] || user.full_name?.split(' ')[0] || 'there',
      city: member?.city || 'Dubai',
      country: member?.country || '',
      nationality: member?.nationality || '',
      interests: Array.isArray(member?.interests) ? member.interests : [],
      languages: Array.isArray(member?.languages) ? member.languages : [],
      lifestyle: member?.lifestyle || '',
      bio: member?.bio || '',
    };

    const userMessage = String(body.message || '').trim();
    if (!userMessage) return json(400, { error: 'empty_message' });

    // --- Build user context for matching ---
    const ctx = await buildUserContext(svc, user, member);

    // --- Fetch, filter, and score all recommendation data (top 3 per category) ---
    const scoredData = await fetchScoredData(svc, user, member, ctx, userMessage);

    // --- Generate inspirational content when appropriate ---
    // Priority: real Experiences > Circles > Members > Inspirational ideas
    // Generate inspirational ideas when:
    // 1. User explicitly asks for an itinerary → generate itinerary
    // 2. User explicitly asks for ideas → generate inspirational ideas
    // 3. Real records are sparse (total < 3) → supplement with inspirational ideas
    const totalReal = scoredData.experiences.length + scoredData.circles.length + scoredData.members.length;
    const wantsItinerary = isItineraryRequest(userMessage);
    const wantsIdeas = isIdeasRequest(userMessage);
    const shouldSupplement = totalReal < 3;
    const strictFilters = parseStrictFilters(userMessage);

    // --- Truthful empty state: no real Nmood connections matched. ---
    // Skip all LLM calls and return a successful, useful empty-state response
    // so the client shows a helpful message instead of a generic failure.
    if (totalReal === 0 && !wantsItinerary) {
      const firstName = memberContext.firstName;
      const emptyMessage = `Hi ${firstName}! I searched our live Nmood community but couldn't find any matching Experiences, Circles, or Pals right now. This is common in a growing community — try broadening your request (a different category, a wider area, or another day), or explore the Discover feed to see what's happening near you.`;
      return json(200, {
        ok: true,
        premium,
        response: {
          message: emptyMessage,
          clarifying_question: null,
          experiences: [],
          circles: [],
          people: [],
          inspirational: [],
          itinerary: null,
          empty_state: true,
          next_steps: [
            { label: 'Browse Discover', path: '/explore' },
            { label: 'Find Circles', path: '/communities' },
            { label: 'Meet people', path: '/discover-people' },
          ],
          inspirational_notice: null,
          category_availability: { experiences: 0, circles: 0, members: 0, inspirational: 0 },
        },
        timed_out: false,
        remaining: premium ? null : Math.max(0, 3 - (await countRecentMessages(svc, user.id)) - 1),
        diagnostics: {
          eligible_experiences: 0, eligible_circles: 0, eligible_members: 0,
          inspirational_count: 0, has_itinerary: false,
          member_found: !!member, member_interests: member?.interests || [],
          member_city: member?.city || '', strict_filters: strictFilters,
        },
      });
    }

    let inspirational: any[] = [];
    let itinerary: any | null = null;

    // Run independent inspirational generators in parallel (latency win) with
    // a per-call timeout so a hung InvokeLLM cannot stall the whole request.
    // The main message LLM call runs after, since it references these results.
    const INSPIRATIONAL_TIMEOUT_MS = 15000;
    const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
      Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), ms))]);

    const inspTasks: Promise<void>[] = [];
    if (wantsItinerary) {
      inspTasks.push(
        withTimeout(generateItinerary(base44, memberContext, userMessage), INSPIRATIONAL_TIMEOUT_MS)
          .then((v) => { itinerary = v; })
          .catch(() => { itinerary = null; })
      );
    }
    if (wantsIdeas || shouldSupplement) {
      inspTasks.push(
        withTimeout(generateInspirational(base44, memberContext, userMessage), INSPIRATIONAL_TIMEOUT_MS)
          .then((v) => { inspirational = v; })
          .catch(() => { inspirational = []; })
      );
    }
    if (inspTasks.length) await Promise.all(inspTasks);

    // Diagnostic logging
    console.log('conciergeChat diagnostic:', {
      userId: String(user.id),
      memberFound: !!member,
      memberInterests: member?.interests || [],
      memberCity: member?.city || '',
      selectedCircles: scoredData.circles.length,
      selectedExperiences: scoredData.experiences.length,
      selectedMembers: scoredData.members.length,
      inspirationalCount: inspirational.length,
      hasItinerary: !!itinerary,
      wantsItinerary,
      wantsIdeas,
      shouldSupplement,
      strictFilters,
    });

    // --- Get conversation history ---
    let history: any[] = [];
    if (body.conversation_id) {
      const msgs = await svc.entities.ConciergeMessage.filter({
        conversation_id: String(body.conversation_id),
      }).catch(() => []);
      history = (msgs || []).slice(-8).map((m) => ({ role: m.role, content: m.content }));
    }

    // --- Build the prompt for the LLM (message generation only) ---
    const now = new Date().toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai',
    });

    const selectedSummary = [
      scoredData.experiences.length > 0
        ? `Experiences: ${scoredData.experiences.map((e: any) => `${e.title} (${e.match_label}, ${e.why_it_matches})`).join('; ')}`
        : 'Experiences: none available',
      scoredData.circles.length > 0
        ? `Circles: ${scoredData.circles.map((c: any) => `${c.title} (${c.match_label}, ${c.why_it_matches})`).join('; ')}`
        : 'Circles: none available',
      scoredData.members.length > 0
        ? `People: ${scoredData.members.map((m: any) => `${m.title} (${m.match_label}, ${m.why_it_matches})`).join('; ')}`
        : 'People: none available',
      inspirational.length > 0
        ? `Inspirational ideas (NOT verified listings — clearly label as inspirational): ${inspirational.map((i: any) => `${i.title} (${i.location || 'no area'}, ${i.price_range || 'no price'})`).join('; ')}`
        : null,
      itinerary
        ? `Inspirational itinerary (NOT a verified plan — clearly label as inspirational): ${itinerary.title} with ${itinerary.steps.length} steps`
        : null,
    ].filter(Boolean).join('\n');

    const allEmpty = scoredData.circles.length === 0 && scoredData.experiences.length === 0 && scoredData.members.length === 0 && inspirational.length === 0 && !itinerary;

    const prompt = `${SYSTEM_PROMPT}

MEMBER CONTEXT:
- First name: ${memberContext.firstName}
- Current location: ${memberContext.city}${memberContext.country ? ', ' + memberContext.country : ''}
- Interests: ${memberContext.interests.join(', ') || 'none set'}
- Languages: ${memberContext.languages.join(', ') || 'not specified'}
- Lifestyle: ${memberContext.lifestyle || 'not specified'}
- Current date/time: ${now}

SELECTED RECOMMENDATIONS (already chosen by the system — do NOT change or invent):
${selectedSummary}

CONVERSATION HISTORY (most recent):
${history.map((h) => `${h.role === 'user' ? 'Member' : 'Concierge'}: ${h.content}`).join('\n') || 'none'}

MEMBER MESSAGE: "${userMessage}"

${allEmpty
  ? 'No eligible records were found in any category. Write an honest message explaining that there are no matching records right now, and suggest broadening the request.'
  : `Write a warm message introducing the selected recommendations. Priority order: Experiences, Circles, Members, then Inspirational ideas.
${inspirational.length > 0 || itinerary ? 'If you mention inspirational ideas or the itinerary, clearly call them "inspirational ideas to explore" — NOT verified venues or confirmed plans. Remind the member to verify current details, prices, and availability.' : ''}
If some preferences couldn't be fully met, mention the compromise gently — for example: "These are the closest available matches. Some may not match every preference."`
}

Respond as JSON: { "message": "...", "clarifying_question": null }`;

    // --- Call the LLM with a timeout ---
    const LLM_TIMEOUT_MS = 20000;
    let llmResult: { message: string; clarifying_question: string | null } = { message: '', clarifying_question: null };
    let llmTimedOut = false;

    try {
      const llmPromise = base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            clarifying_question: { type: 'string' },
          },
          required: ['message'],
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('LLM_TIMEOUT')), LLM_TIMEOUT_MS)
      );

      const rawResponse = await Promise.race([llmPromise, timeoutPromise]);
      llmResult = parseLLMMessage(rawResponse);
    } catch (llmErr) {
      llmTimedOut = (llmErr as Error).message === 'LLM_TIMEOUT';
      console.error('conciergeChat LLM error:', llmErr);
    }

    // --- Build the response with backend-selected items ---
    let message = llmResult.message;
    if (!message) {
      // Fallback message if LLM failed
      const firstName = memberContext.firstName;
      if (allEmpty) {
        message = `Hi ${firstName}! I searched our community but couldn't find matching records right now. Try broadening your request for more options.`;
      } else {
        const parts: string[] = [];
        if (scoredData.experiences.length) parts.push(`${scoredData.experiences.length} Experience${scoredData.experiences.length > 1 ? 's' : ''}`);
        if (scoredData.circles.length) parts.push(`${scoredData.circles.length} Circle${scoredData.circles.length > 1 ? 's' : ''}`);
        if (scoredData.members.length) parts.push(`${scoredData.members.length} person${scoredData.members.length > 1 ? 's' : ''}`);
        if (inspirational.length) parts.push(`${inspirational.length} inspirational idea${inspirational.length > 1 ? 's' : ''}`);
        if (itinerary) parts.push('an inspirational itinerary');
        const realParts = parts.filter(p => !p.includes('inspirational'));
        const inspParts = parts.filter(p => p.includes('inspirational'));
        if (realParts.length && inspParts.length) {
          message = `Hi ${firstName}! I found ${realParts.join(', ')} for you, plus ${inspParts.join(' and ')}. These are the closest available matches — some may not match every preference. Inspirational ideas are suggestions to explore — please verify current details, prices, and availability.`;
        } else if (realParts.length) {
          message = `Hi ${firstName}! I found ${realParts.join(', ')} for you. These are the closest available matches — some may not match every preference.`;
        } else if (inspParts.length) {
          message = `Hi ${firstName}! I put together ${inspParts.join(' and ')} for you. These are inspirational suggestions to explore — please verify current details, prices, and availability.`;
        } else {
          message = `Hi ${firstName}! I searched but couldn't find matching records right now. Try broadening your request for more options.`;
        }
      }
    }

    const response = {
      message,
      clarifying_question: llmResult.clarifying_question,
      // Backend-selected items — always included when eligible records exist.
      // Priority order: Experiences > Circles > Members > Inspirational.
      experiences: scoredData.experiences,
      circles: scoredData.circles,
      people: scoredData.members,
      inspirational,
      itinerary,
      inspirational_notice: (inspirational.length > 0 || itinerary)
        ? 'Suggestions are inspirational. Please verify current details, prices, opening hours, and availability.'
        : null,
      category_availability: {
        experiences: scoredData.experiences.length,
        circles: scoredData.circles.length,
        members: scoredData.members.length,
        inspirational: inspirational.length,
      },
    };

    return json(200, {
      ok: true,
      premium,
      response,
      timed_out: llmTimedOut,
      remaining: premium ? null : Math.max(0, 3 - (await countRecentMessages(svc, user.id)) - 1),
      diagnostics: {
        eligible_experiences: scoredData.experiences.length,
        eligible_circles: scoredData.circles.length,
        eligible_members: scoredData.members.length,
        inspirational_count: inspirational.length,
        has_itinerary: !!itinerary,
        member_found: !!member,
        member_interests: member?.interests || [],
        member_city: member?.city || '',
        strict_filters: strictFilters,
      },
    });
  } catch (error) {
    console.error('conciergeChat error:', error);
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
});