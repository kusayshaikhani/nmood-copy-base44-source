import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireAdminOrCron } from '../../shared/admin-auth.ts';

// MP-006: Membership Intelligence — admin-only, privacy-by-design aggregator.
// Returns AGGREGATES ONLY. No personal data, messages, or individual member analytics.
// mode = "snapshot" (default for scheduled runs) persists a MembershipInsight record.
// mode = "dashboard" returns the full aggregate payload to the admin UI (requires admin).
//
// Privacy:
//  - Only created_by_id is used internally to correlate anonymous events to a membership.
//  - Output never includes user ids, names, or per-person records.
//  - Used only to improve recommendations + member experience. No pricing manipulation.

const DAY = 86400000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const weekKey = (d) => {
  const dt = new Date(d);
  const start = new Date(dt.getFullYear(), 0, 1);
  const week = Math.ceil(((dt - start) / DAY + start.getDay() + 1) / 7);
  return `${dt.getFullYear()}-W${String(week).padStart(2, '0')}`;
};
const within = (ts, days) => ts >= Date.now() - days * DAY;

// Plan price estimates for an indicative recurring-value figure only (no real payments).
const PLAN_VALUE = { monthly: 9.99, annual: 59.99, quarterly: 19.99 };

function aggregate(items, key) {
  const map = {};
  for (const it of items || []) {
    const v = it[key];
    if (v == null || v === '') continue;
    if (Array.isArray(v)) { for (const s of v) if (s) map[s] = (map[s] || 0) + 1; }
    else map[v] = (map[v] || 0) + 1;
  }
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function cohortRetention(activityByUid, offsets) {
  const now = Date.now();
  const out = {};
  for (const off of offsets) {
    const cut = now - off * DAY;
    let cohort = 0, retained = 0;
    for (const uid in activityByUid) {
      const a = activityByUid[uid];
      if (a.first <= cut) {
        cohort++;
        const lo = a.first + (off - 1) * DAY;
        const hi = a.first + (off + 1) * DAY;
        if (a.days.some((dk) => {
          const dt = new Date(dk).getTime();
          return dt >= lo && dt <= hi;
        })) retained++;
      }
    }
    out[`d${off}`] = cohort > 0 ? Math.round((retained / cohort) * 100) : null;
  }
  return out;
}

function buildActivity(events) {
  const map = {};
  for (const e of events || []) {
    const uid = e.created_by_id;
    if (!uid || !e.created_date) continue;
    const t = new Date(e.created_date).getTime();
    const a = map[uid] || (map[uid] = { first: t, last: t, days: new Set([dayKey(t)]) });
    if (t < a.first) a.first = t;
    if (t > a.last) a.last = t;
    a.days.add(dayKey(t));
  }
  return map;
}

async function compute(base44) {
  const svc = base44.asServiceRole;
  const [members, memberships, events, connections, circles, circleMemberships, experiences, attendances] = await Promise.all([
    svc.entities.Member.list('-created_date', 500),
    svc.entities.Membership.list('-created_date', 500),
    svc.entities.ProductEvent.list('-created_date', 2000),
    svc.entities.PalConnection.list('-created_date', 500),
    svc.entities.Circle.list('-created_date', 500),
    svc.entities.CircleMembership.list('-created_date', 1000),
    svc.entities.Experience.list('-created_date', 500),
    svc.entities.Attendance.list('-created_date', 1000),
  ]);

  const memberArr = members || [];
  const membArr = memberships || [];
  const evtArr = events || [];
  const connArr = (connections || []).filter((c) => c.is_active !== false);
  const cmArr = circleMemberships || [];
  const expArr = experiences || [];
  const attArr = attendances || [];

  const now = Date.now();
  const activity = buildActivity(evtArr);

  // --- Membership segments ---
  const premiumMemb = membArr.filter((m) => m.type === 'premium');
  const explorerMemb = membArr.filter((m) => m.type === 'explorer');
  const activePremium = premiumMemb.filter((m) => ['active', 'trial', 'grace_period'].includes(m.status));
  const activeExplorer = explorerMemb.filter((m) => m.status === 'active');
  const monthlyPremium = premiumMemb.filter((m) => /month/i.test(m.plan || ''));
  const annualPremium = premiumMemb.filter((m) => /year|annual/i.test(m.plan || ''));
  const newExplorers = explorerMemb.filter((m) => m.created_date && within(new Date(m.created_date).getTime(), 30));
  const newPremium = premiumMemb.filter((m) => m.started_date && within(new Date(m.started_date).getTime(), 30));
  const renewals = evtArr.filter((e) => e.event_name === 'Subscription Renewed');
  const restores = evtArr.filter((e) => e.event_name === 'Subscription Restored');
  const expired = premiumMemb.filter((m) => m.status === 'expired');
  const grace = premiumMemb.filter((m) => m.status === 'grace_period');
  const cancelled = premiumMemb.filter((m) => m.status === 'cancelled');

  // --- Journey funnel (from anonymous product events, aggregate counts only) ---
  const countEvent = (name) => evtArr.filter((e) => e.event_name === name).length;
  const funnel = {
    explorer_registration: countEvent('Registration Completed'),
    explorer_active: activeExplorer.length,
    first_premium_prompt: countEvent('First Premium Prompt'),
    premium_purchase: countEvent('Subscription Started'),
    premium_active: activePremium.length,
    premium_renewal: renewals.length,
    premium_cancellation: countEvent('Subscription Cancelled'),
    premium_recovery: countEvent('Subscription Recovered'),
  };

  // --- Conversion rate + by-dimension breakdown (aggregated buckets) ---
  const totalMembers = memberArr.length;
  const premiumCount = premiumMemb.length;
  const conversionRate = totalMembers > 0 ? Math.round((premiumCount / totalMembers) * 1000) / 10 : 0;

  // Map user id -> membership for "after premium" impact and dimension lookups.
  const membByUser = {};
  for (const m of membArr) if (m.user_id) membByUser[m.user_id] = m;

  // Bucket helpers — aggregate only, never expose individuals.
  const byCountry = {}, byPlatform = {}, byDevice = {}, byExperienceCount = {}, byCircleCount = {}, byAiUsage = {}, byMembershipAge = {};
  for (const m of premiumMemb) {
    const member = memberArr.find((mem) => mem.email && m.user_id); // best-effort join via activity
    const uid = m.user_id;
    const act = activity[uid];
    const country = (memberArr.find((x) => x.created_by_id === uid))?.country || 'unknown';
    byCountry[country] = (byCountry[country] || 0) + 1;
    const platform = m.billing_platform || 'unknown';
    byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    // experience/circle counts derived from aggregate participation events per user
    const userEvents = evtArr.filter((e) => e.created_by_id === uid);
    const expCount = userEvents.filter((e) => e.event_name === 'Experience Joined').length;
    const circCount = userEvents.filter((e) => e.event_name === 'Circle Joined').length;
    const aiCount = userEvents.filter((e) => ['AI Pick Viewed', 'Magic Door Used'].includes(e.event_name)).length;
    const ageDays = m.started_date ? Math.floor((now - new Date(m.started_date).getTime()) / DAY) : 0;
    const bucket = (n, labels) => labels.find(([, hi]) => n <= hi)?.[0] || labels[labels.length - 1][0];
    const eB = bucket(expCount, [['0', 0], ['1-3', 3], ['4-10', 10], ['10+', Infinity]]);
    const cB = bucket(circCount, [['0', 0], ['1-2', 2], ['3+', Infinity]]);
    const aiB = bucket(aiCount, [['none', 0], ['low', 5], ['high', Infinity]]);
    const ageB = bucket(ageDays, [['<7', 6], ['7-30', 30], ['31-90', 90], ['90+', Infinity]]);
    byExperienceCount[eB] = (byExperienceCount[eB] || 0) + 1;
    byCircleCount[cB] = (byCircleCount[cB] || 0) + 1;
    byAiUsage[aiB] = (byAiUsage[aiB] || 0) + 1;
    byMembershipAge[ageB] = (byMembershipAge[ageB] || 0) + 1;
  }
  const toSorted = (o) => Object.entries(o).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const conversion = {
    rate: conversionRate,
    by_country: toSorted(byCountry).slice(0, 10),
    by_platform: toSorted(byPlatform),
    by_experience_count: toSorted(byExperienceCount),
    by_circle_count: toSorted(byCircleCount),
    by_ai_usage: toSorted(byAiUsage),
    by_membership_age: toSorted(byMembershipAge),
  };

  // --- Retention: split activity by membership tier ---
  const explorerActivity = {}, premiumActivity = {};
  for (const uid in activity) {
    const mb = membByUser[uid];
    if (mb?.type === 'premium') premiumActivity[uid] = activity[uid];
    else explorerActivity[uid] = activity[uid];
  }
  const offsets = [7, 30, 90, 180, 365];
  const retention = {
    explorer: cohortRetention(explorerActivity, offsets),
    premium: cohortRetention(premiumActivity, offsets),
  };

  // --- Feature adoption (aggregate from Premium Feature Used events) ---
  const featMap = {};
  for (const e of evtArr) {
    if (e.event_name !== 'Premium Feature Used') continue;
    const f = e.properties?.feature;
    if (!f) continue;
    const t = new Date(e.created_date).getTime();
    const entry = featMap[f] || (featMap[f] = { feature: f, usage_count: 0, first_usage: t, last_usage: t });
    entry.usage_count += Number(e.properties?.usageCount) ? 1 : 1;
    if (t < entry.first_usage) entry.first_usage = t;
    if (t > entry.last_usage) entry.last_usage = t;
  }
  const featureAdoption = Object.values(featMap).sort((a, b) => b.usage_count - a.usage_count);

  // --- Real-world impact AFTER premium (aggregate deltas for premium members) ---
  const impact = { experiences_joined: 0, circles_joined: 0, new_pals: 0, messages_sent: 0, experiences_hosted: 0, communities_created: 0 };
  for (const m of premiumMemb) {
    const startTs = m.started_date ? new Date(m.started_date).getTime() : 0;
    const userEvents = evtArr.filter((e) => e.created_by_id === m.user_id && new Date(e.created_date).getTime() >= startTs);
    impact.experiences_joined += userEvents.filter((e) => e.event_name === 'Experience Joined').length;
    impact.circles_joined += userEvents.filter((e) => e.event_name === 'Circle Joined').length;
    impact.new_pals += userEvents.filter((e) => e.event_name === 'New Pal Created').length;
    impact.experiences_hosted += userEvents.filter((e) => e.event_name === 'Experience Created').length;
    impact.communities_created += userEvents.filter((e) => e.event_name === 'Circle Created').length;
    // messages_sent is not tracked to preserve privacy; left 0 by design
  }

  // --- Revenue (indicative only — no real payment processing in app) ---
  let recurring = 0;
  for (const m of activePremium) recurring += PLAN_VALUE[(/year|annual/i.test(m.plan || '') ? 'annual' : /month/i.test(m.plan || '') ? 'monthly' : 'monthly')] || 0;
  const revenue = {
    estimated_monthly_recurring: Math.round(recurring * 100) / 100,
    active_premium_count: activePremium.length,
    renewals_30d: renewals.filter((r) => r.created_date && within(new Date(r.created_date).getTime(), 30)).length,
    churn_30d: cancelled.filter((m) => m.cancelled_at && within(new Date(m.cancelled_at).getTime(), 30)).length,
    grace_count: grace.length,
    expired_count: expired.length,
    note: 'Indicative only. Nmood does not process real payments; figures derive from plan metadata.',
  };

  // --- AI insights (aggregated, non-personal, for recommendation + experience improvement) ---
  const topFeatures = featureAdoption.slice(0, 5).map((f) => ({ feature: f.feature, usage_count: f.usage_count }));
  // Best upgrade moment: most common journey stage preceding a Subscription Started event.
  const stageCounts = {};
  const purchases = evtArr.filter((e) => e.event_name === 'Subscription Started');
  for (const p of purchases) {
    const uid = p.created_by_id;
    const prior = evtArr.filter((e) => e.created_by_id === uid && new Date(e.created_date).getTime() <= new Date(p.created_date).getTime());
    const stage = prior.map((e) => e.event_name).filter((n) => ['First Premium Prompt', 'Explorer Limit Reached', 'Membership Screen Viewed', 'Upgrade Clicked', 'AI Pick Viewed', 'Experience Joined'].includes(n)).pop() || 'direct';
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  }
  const bestUpgradeMoment = Object.entries(stageCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)[0]?.name || null;
  // Best onboarding journey: sequence from registration to first premium, aggregated.
  const onboardingPaths = {};
  for (const p of purchases) {
    const uid = p.created_by_id;
    const seq = evtArr
      .filter((e) => e.created_by_id === uid && new Date(e.created_date).getTime() <= new Date(p.created_date).getTime())
      .map((e) => e.event_name)
      .filter((n) => ['Registration Completed', 'Profile Reached 100%', 'Experience Joined', 'AI Pick Viewed', 'First Premium Prompt'])
      .slice(-4);
    const key = seq.join(' → ') || 'direct';
    onboardingPaths[key] = (onboardingPaths[key] || 0) + 1;
  }
  const bestOnboarding = Object.entries(onboardingPaths).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 3);
  // Best recommendation path: discovery source that led to an experience join.
  const recPaths = {};
  for (const j of evtArr.filter((e) => e.event_name === 'Experience Joined')) {
    const uid = j.created_by_id;
    const prior = evtArr.filter((e) => e.created_by_id === uid && new Date(e.created_date).getTime() <= new Date(j.created_date).getTime());
    const src = prior.map((e) => e.event_name).filter((n) => ['Mood Selected', 'AI Pick Viewed', 'Magic Door Used', 'Search Performed'].includes(n)).pop() || 'browse';
    recPaths[src] = (recPaths[src] || 0) + 1;
  }
  const bestRecommendation = Object.entries(recPaths).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  const aiInsights = {
    most_valuable_features: topFeatures,
    best_upgrade_moment: bestUpgradeMoment,
    best_onboarding_journeys: bestOnboarding,
    best_recommendation_paths: bestRecommendation,
    policy: 'Aggregated and non-personal. Used only to improve recommendations and member experience. Never used to personalize pricing or manipulate members.',
  };

  const metrics = {
    total_members: totalMembers,
    new_explorers_30d: newExplorers.length,
    active_explorers: activeExplorer.length,
    new_premium_30d: newPremium.length,
    monthly_premium: monthlyPremium.length,
    annual_premium: annualPremium.length,
    active_premium: activePremium.length,
    renewals_30d: revenue.renewals_30d,
    expired: expired.length,
    grace_period: grace.length,
    restores_30d: restores.filter((r) => r.created_date && within(new Date(r.created_date).getTime(), 30)).length,
    funnel,
  };

  return {
    period_key: dayKey(now),
    period_type: 'daily',
    metrics,
    feature_adoption: featureAdoption,
    conversion,
    retention,
    real_world_impact: impact,
    revenue,
    ai_insights: aiInsights,
    privacy: 'Aggregate only. No personal data, messages, or member identifiers are exposed. Analytics never sold or used for advertising.',
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json().catch(() => ({})) || {}; } catch { /* empty body is fine */ }
    const mode = body.mode || 'dashboard';

    // All modes — including snapshot — require an admin session or a platform
    // cron signature. snapshot is CPU/DB heavy and overwrites the day's
    // MembershipInsight record, so it must not be callable anonymously.
    const auth = await requireAdminOrCron(base44, req);
    if (!auth.ok) return auth.response;

    const result = await compute(base44);

    if (mode === 'snapshot') {
      // Persist a daily snapshot (upsert by period_key) for backend-ready dashboard objects.
      const existing = await base44.asServiceRole.entities.MembershipInsight.filter({ period_key: result.period_key }, '-created_date', 1);
      const record = {
        period_key: result.period_key,
        period_type: result.period_type,
        metrics: result.metrics,
        feature_adoption: result.feature_adoption,
        conversion: result.conversion,
        retention: result.retention,
        real_world_impact: result.real_world_impact,
        revenue: result.revenue,
        ai_insights: result.ai_insights,
      };
      if (existing && existing.length) {
        await base44.asServiceRole.entities.MembershipInsight.update(existing[0].id, record);
      } else {
        await base44.asServiceRole.entities.MembershipInsight.create(record);
      }
      return Response.json({ status: 'ok', period_key: result.period_key, persisted: true });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});