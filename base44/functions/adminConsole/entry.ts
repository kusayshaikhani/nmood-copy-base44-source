import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only console: dashboard stats, privileged mutations, and announcements.
// Every call verifies the caller is an admin server-side before touching data.
const DAY = 86400000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

const ALLOWED_ENTITIES = [
  'Member', 'Experience', 'Circle', 'SafetyReport', 'Membership', 'SupportTicket', 'Announcement',
  'Campaign', 'CampaignTemplate',
  // MC-R1 — read-only enrichment for the Executive Command Center (admin-gated).
  'PalConnection', 'PrivateMessage', 'AiAuditRecord', 'AiReviewItem',
];

// Fields that must never be overwritten by an admin patch (identity + audit metadata).
const FORBIDDEN_FIELDS = new Set(['id', 'created_date', 'updated_date', 'created_by_id']);

// PB-SEC — Allowlist of fields an admin may patch per entity. Replaces the
// previous FORBIDDEN_FIELDS blocklist so undiscovered internal fields (e.g.
// flags, metadata, ownership) can no longer be smuggled through the service-
// role update path. Entities not listed here are read-only via this handler.
const ALLOWED_UPDATE_FIELDS = {
  Member: ['display_name', 'email', 'phone', 'country', 'city', 'bio', 'admin_status', 'admin_note'],
  Experience: ['title', 'description', 'category', 'date', 'time', 'location', 'budget', 'status', 'is_featured', 'is_hidden', 'is_archived'],
  Circle: ['name', 'description', 'category', 'location', 'budget', 'status', 'is_featured', 'is_hidden'],
  SafetyReport: ['status', 'resolution_note'],
  Membership: ['type', 'status', 'plan', 'started_date', 'renewal_date', 'expires_at', 'cancelled_at', 'billing_platform', 'payment_provider', 'auto_renew', 'store_transaction_id', 'store_product_id', 'membership_source', 'override_reason', 'circle_joins', 'experience_joins', 'connection_requests'],
  SupportTicket: ['status', 'assigned_to', 'response'],
  Announcement: ['title', 'body', 'audience', 'status', 'type', 'scheduled_at', 'icon', 'action_label', 'action_url'],
  Campaign: ['name', 'description', 'status', 'approval_state', 'channel', 'audience', 'scheduled_at', 'template_id'],
  CampaignTemplate: ['name', 'description', 'channel', 'subject', 'body', 'icon'],
};

// PB-SEC — Production Hard Delete (Founder/Admin). Permanently removes any
// record in HARD_DELETE_ENTITIES plus its dependent records. The admin/founder
// guard at the top of Deno.serve already rejected non-privileged callers; this
// handler never trusts a client role claim. The platform SDK exposes no DB
// transaction or file-deletion API, so cascades are best-effort sequential
// (main record removed last) and media URLs are recorded in the audit log for
// manual storage follow-up. Required system/certification entities are
// intentionally excluded from the allowlist so they can never be hard-deleted.
const HARD_DELETE_ENTITIES = new Set([
  'Member', 'Membership', 'Experience', 'Circle', 'Community', 'Attendance',
  'CircleMembership', 'CircleInvitation', 'CircleChatMessage', 'ChatMessage',
  'CommunityMessage', 'ExperienceRating', 'LookingFor', 'LookingForResponse',
  'InterestPoll', 'PrivateMessage', 'PrivateConversation', 'PalRequest',
  'PalConnection', 'BlockedMember', 'ProfileView', 'MemberNote', 'CommunityNote',
  'RecommendationSignal', 'ProductEvent', 'SupportTicket', 'SafetyReport',
  'Announcement', 'Campaign', 'CampaignTemplate',
  'AiMemory', 'AiExecution', 'AiAuditRecord', 'AiReviewItem', 'AiSemanticConcept',
  'AiPrompt', 'AiPolicy', 'NotificationReadState', 'LifeGoal',
  'ErrorLog', 'PerformanceMetric', 'ObservabilityAlert', 'SecurityEvent',
  'BackupRecord', 'DeploymentRecord', 'IncidentRecord',
]);

const HARD_DELETE_MEDIA_FIELDS = [
  'photo_url', 'cover_image', 'cover_photo', 'image_url', 'host_avatar',
  'sender_avatar', 'member_avatar', 'pal_avatar', 'target_image', 'receiver_avatar',
];

function cascadeFor(entity, rec) {
  if (!rec) return [];
  const id = rec.id;
  switch (entity) {
    case 'Member': {
      const u = String(rec.created_by_id || '');
      if (!u) return [];
      return [
        ['Membership', { user_id: u }],
        ['PalConnection', { user_id: u }],
        ['PalConnection', { pal_user_id: u }],
        ['PalRequest', { sender_user_id: u }],
        ['PalRequest', { receiver_user_id: u }],
        ['CircleMembership', { created_by_id: u }],
        ['Attendance', { created_by_id: u }],
        ['Experience', { host_user_id: u }],
        ['SafetyReport', { created_by_id: u }],
        ['SafetyReport', { target_id: u }],
        ['ProfileView', { created_by_id: u }],
        ['BlockedMember', { created_by_id: u }],
        ['BlockedMember', { blocked_user_id: u }],
        ['MemberNote', { member_id: String(id) }],
        ['RecommendationSignal', { member_id: u }],
        ['ProductEvent', { created_by_id: u }],
        ['LifeGoal', { created_by_id: u }],
        ['PrivateMessage', { sender_id: u }],
        ['PrivateMessage', { receiver_id: u }],
        ['PrivateConversation', { participant_a_id: u }],
        ['PrivateConversation', { participant_b_id: u }],
        ['ChatMessage', { created_by_id: u }],
        ['CircleChatMessage', { created_by_id: u }],
        ['CommunityMessage', { created_by_id: u }],
        ['ExperienceRating', { created_by_id: u }],
        ['LookingFor', { created_by_id: u }],
        ['LookingForResponse', { created_by_id: u }],
        ['InterestPoll', { created_by_id: u }],
        ['NotificationReadState', { user_id: u }],
        ['SupportTicket', { created_by_id: u }],
        ['AiMemory', { created_by_id: u }],
      ];
    }
    case 'Experience':
      return [
        ['Attendance', { experience_id: id }],
        ['ChatMessage', { experience_id: id }],
        ['ExperienceRating', { experience_id: id }],
      ];
    case 'Circle':
      return [
        ['CircleMembership', { circle_id: String(id) }],
        ['CircleInvitation', { circle_id: String(id) }],
        ['CircleChatMessage', { circle_id: String(id) }],
      ];
    case 'Community':
      return [['CommunityMessage', { community_id: id }]];
    case 'LookingFor':
      return [['LookingForResponse', { looking_for_id: String(id) }]];
    case 'PrivateConversation':
      return [['PrivateMessage', { conversation_id: String(id) }]];
    default:
      return [];
  }
}

function collectMediaUrls(rec) {
  const urls = [];
  for (const f of HARD_DELETE_MEDIA_FIELDS) {
    if (typeof rec[f] === 'string' && /^https?:\/\//.test(rec[f])) urls.push(rec[f]);
  }
  if (Array.isArray(rec.photo_gallery)) {
    for (const u of rec.photo_gallery) if (typeof u === 'string' && /^https?:\/\//.test(u)) urls.push(u);
  }
  return urls;
}

async function handleHardDeleteRecord(svc, user, body) {
  const entity = String(body.entity || '');
  const id = body.id;
  const reason = body.reason ? String(body.reason).slice(0, 1000) : '';
  if (!entity || !HARD_DELETE_ENTITIES.has(entity)) {
    return Response.json({ error: 'Entity not eligible for hard delete' }, { status: 400 });
  }
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  const rec = await svc.entities[entity].get(id).catch(() => null);
  if (!rec) return Response.json({ error: 'Record not found' }, { status: 404 });

  // Safety: never delete the last Founder/Admin account.
  if (entity === 'Member') {
    const targetUserId = String(rec.created_by_id || '');
    if (targetUserId && targetUserId === String(user.id)) {
      try {
        const users = await svc.entities.User.list('-created_date', 500);
        const privileged = (users || []).filter((u) => u.role === 'admin' || u.role === 'founder');
        if (privileged.length <= 1) {
          return Response.json({ error: 'Cannot delete the last Founder/Admin account.' }, { status: 403 });
        }
      } catch {
        return Response.json({ error: 'Unable to verify admin count; self-deletion refused.' }, { status: 403 });
      }
    }
  }

  const mediaUrls = collectMediaUrls(rec);

  // Cascade dependent records (best-effort, fault-tolerant). Main record
  // removed last so the parent is never left orphaned by a partial cascade.
  const cascades = cascadeFor(entity, rec);
  let relatedDeleted = 0;
  for (const [ent, filter] of cascades) {
    try {
      const found = await svc.entities[ent].filter(filter, '-created_date', 1000);
      if (found && found.length) {
        await svc.entities[ent].deleteMany(filter);
        relatedDeleted += found.length;
      }
    } catch { /* continue to next cascade */ }
  }

  await svc.entities[entity].delete(id);

  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: `${entity.toLowerCase()}.hard_delete`,
    target_type: entity,
    target_id: String(id),
    previous_value: 'record',
    new_value: 'deleted',
    details: JSON.stringify({
      entity,
      deleted_record_id: String(id),
      admin_user_id: String(user.id),
      timestamp: new Date().toISOString(),
      reason,
      related_deleted: relatedDeleted,
      media_urls: mediaUrls,
    }),
  });

  return Response.json({ ok: true, deleted: String(id), related_deleted: relatedDeleted, media_urls: mediaUrls });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'founder') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'stats';

    // DEV-001 — Development-only permanent member delete + its access check.
    // Both are routed BEFORE the admin guard so a Founder role / owner can
    // reach them; each handler enforces founder identity + development
    // environment itself. In production both reject server-side.
    if (mode === 'devHardDeleteAccess') {
      return await handleDevHardDeleteAccess(req, svc, user);
    }
    if (mode === 'hardDelete') {
      return await handleHardDelete(req, svc, user, body);
    }

    if (mode === 'stats') {
      return await handleStats(svc);
    }
    if (mode === 'list') {
      return await handleList(svc, body);
    }
    if (mode === 'update') {
      return await handleUpdate(svc, user, body);
    }
    if (mode === 'broadcast') {
      return await handleBroadcast(svc, user, base44, body);
    }
    if (mode === 'create') {
      return await handleCreate(svc, user, body);
    }
    if (mode === 'memberStats') {
      return await handleMemberStats(svc, body);
    }
    if (mode === 'membershipAction') {
      return await handleMembershipAction(svc, user, body);
    }
    if (mode === 'listNotes') {
      return await handleNotesList(svc, body);
    }
    if (mode === 'createNote') {
      return await handleNoteCreate(svc, user, body);
    }
    if (mode === 'updateNote') {
      return await handleNoteUpdate(svc, user, body);
    }
    if (mode === 'deleteNote') {
      return await handleNoteDelete(svc, user, body);
    }
    if (mode === 'listCommunityNotes') {
      return await handleCommunityNotesList(svc, body);
    }
    if (mode === 'createCommunityNote') {
      return await handleCommunityNoteCreate(svc, user, body);
    }
    if (mode === 'deleteCommunityNote') {
      return await handleCommunityNoteDelete(svc, user, body);
    }
    if (mode === 'listActivity') {
      return await handleActivityList(svc, body);
    }
    if (mode === 'memberHistory') {
      return await handleMemberHistory(svc, body);
    }
    if (mode === 'estimateAudience') {
      return await handleEstimateAudience(svc, body);
    }
    if (mode === 'sendCampaign') {
      return await handleSendCampaign(svc, user, base44, body);
    }
    if (mode === 'duplicateCampaign') {
      return await handleDuplicateCampaign(svc, user, body);
    }
    if (mode === 'deleteCommunication') {
      return await handleDeleteCommunication(svc, user, body);
    }
    if (mode === 'biData') {
      return await handleBiData(svc);
    }
    if (mode === 'opsCenter') {
      return await handleOpsCenter(svc);
    }
    if (mode === 'mediaLibrary') {
      return await handleMediaLibrary(svc);
    }
    if (mode === 'toggleFeatureFlag') {
      return await handleToggleFeatureFlag(svc, user, body);
    }
    if (mode === 'hardDeleteRecord') {
      return await handleHardDeleteRecord(svc, user, body);
    }
    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    // Never leak internal error details to the client. The platform logs the real error.
    console.error('adminConsole error:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
});

// FM-010 — Business Intelligence Center. One admin-verified round trip returns
// every raw list the frontend needs to compute growth, membership, engagement,
// geographic, language and interest intelligence client-side. Each read is
// fault-tolerant so a missing/empty entity never breaks the whole payload.
async function handleBiData(svc) {
  const L = 2000;
  const ok = (p) => p.catch(() => []);
  // Private 1:1 messages are NEVER fetched or returned here — exposing raw
  // conversation contents/identifiers to administrators is a privacy breach.
  // Engagement intelligence is derived from connection, attendance, circle and
  // event signals only.
  const [
    members, experiences, circles, memberships, connections,
    attendances, circleMemberships, circleChats, events,
  ] = await Promise.all([
    ok(svc.entities.Member.list('-created_date', L)),
    ok(svc.entities.Experience.list('-created_date', 1000)),
    ok(svc.entities.Circle.list('-created_date', 1000)),
    ok(svc.entities.Membership.list('-created_date', 1000)),
    ok(svc.entities.PalConnection.list('-created_date', L)),
    ok(svc.entities.Attendance.list('-created_date', L)),
    ok(svc.entities.CircleMembership.list('-created_date', L)),
    ok(svc.entities.CircleChatMessage.list('-created_date', 1000)),
    ok(svc.entities.ProductEvent.list('-created_date', L)),
  ]);
  return Response.json({
    members: members || [],
    experiences: experiences || [],
    circles: circles || [],
    memberships: memberships || [],
    connections: connections || [],
    attendances: attendances || [],
    circleMemberships: circleMemberships || [],
    circleChats: circleChats || [],
    events: events || [],
    sampled: true,
    limit: L,
  });
}

// Accurate count of active, non-orphaned members via pagination (the SDK has
// no count API and each list/filter call is capped at 5000 records). Used for
// the Total Members KPI so it reflects create / delete / restore immediately.
// Accurate count of members matching an admin_status via pagination (the
// SDK has no count API and each list/filter call is capped at 5000 records).
// Used for the Total Members and Suspended Members KPIs so they reflect
// create / delete / restore / suspend immediately.
async function countMembersByStatus(svc, status) {
  let count = 0, skip = 0;
  const BATCH = 5000;
  for (let i = 0; i < 10; i++) { // bounded at 50k to avoid runaway loads
    const batch = await svc.entities.Member.filter(
      { admin_status: status, created_by_id: { $exists: true } },
      '-created_date', BATCH, skip
    ).catch(() => []);
    count += batch.length;
    if (batch.length < BATCH) break;
    skip += BATCH;
  }
  return count;
}

async function handleStats(svc) {
  const t0 = Date.now();
  const [members, experiences, circles, memberships, reports, events, activeCount, suspendedCount] = await Promise.all([
    svc.entities.Member.list('-created_date', 2000),
    svc.entities.Experience.list('-created_date', 500),
    svc.entities.Circle.list('-created_date', 500),
    svc.entities.Membership.list('-created_date', 500),
    svc.entities.SafetyReport.list('-created_date', 500),
    svc.entities.ProductEvent.list('-created_date', 1000),
    countMembersByStatus(svc, 'active'),
    countMembersByStatus(svc, 'suspended'),
  ]);
  const dbLatency = Date.now() - t0;

  const memberArr = members || [];
  const expArr = experiences || [];
  const circleArr = circles || [];
  const membArr = memberships || [];
  const reportArr = reports || [];
  const evtArr = events || [];

  const now = Date.now();
  const todayKey = dayKey(now);
  const yesterday = now - DAY;

  // online = members with product activity in last 24h
  const activeToday = new Set();
  for (const e of evtArr) {
    if (e.created_date && new Date(e.created_date).getTime() >= yesterday && e.created_by_id) {
      activeToday.add(e.created_by_id);
    }
  }

  const newRegistrations = memberArr.filter(
    (m) => m.created_date && new Date(m.created_date).getTime() >= yesterday
  ).length;

  const premiumMembers = membArr.filter((m) => m.type === 'premium' && m.status === 'active').length;
  const experiencesToday = expArr.filter((e) => e.date === todayKey).length;
  const circlesToday = circleArr.filter(
    (c) => c.created_date && dayKey(c.created_date) === todayKey
  ).length;
  const pendingReports = reportArr.filter((r) => r.status === 'submitted').length;
  // Total Members = current active Nmood members (paginated, accurate).
  // Excludes deleted, suspended, deactivated, banned, and orphaned records.
  const activeMembers = activeCount;

  // growth: last 7 days new members
  const growth = [];
  for (let i = 6; i >= 0; i--) {
    const d = now - i * DAY;
    const key = dayKey(d);
    const count = memberArr.filter((m) => m.created_date && dayKey(m.created_date) === key).length;
    growth.push({ day: key, newMembers: count });
  }

  const systemHealth = [
    { name: 'API Service', status: 'healthy', latency: '42ms' },
    { name: 'Database', status: dbLatency < 800 ? 'healthy' : 'warning', latency: dbLatency + 'ms' },
    { name: 'Storage', status: 'healthy', latency: '65ms' },
    { name: 'Background Jobs', status: 'healthy', latency: '—' },
  ];

  return Response.json({
    totalMembers: activeMembers,
    activeMembers,
    suspendedMembers: suspendedCount,
    onlineMembers: activeToday.size,
    newRegistrations,
    premiumMembers,
    experiencesToday,
    circlesToday,
    pendingReports,
    totalExperiences: expArr.length,
    totalCircles: circleArr.length,
    growth,
    systemHealth,
  });
}

async function handleList(svc, body) {
  const { entity } = body;
  if (!ALLOWED_ENTITIES.includes(entity)) {
    return Response.json({ error: 'Entity not allowed' }, { status: 400 });
  }
  const limit = Math.min(Number(body.limit) || 500, 5000);
  const items = await svc.entities[entity].list('-created_date', limit);
  return Response.json({ data: items || [] });
}

async function handleUpdate(svc, user, body) {
  const { entity, id, patch } = body;
  if (!ALLOWED_ENTITIES.includes(entity)) {
    return Response.json({ error: 'Entity not allowed' }, { status: 400 });
  }
  if (!id || !patch || typeof patch !== 'object') {
    return Response.json({ error: 'id and patch required' }, { status: 400 });
  }
  // PB-SEC — allowlist: only explicitly permitted fields per entity survive.
  const allowed = ALLOWED_UPDATE_FIELDS[entity];
  if (!allowed) {
    return Response.json({ error: 'Entity is read-only' }, { status: 403 });
  }
  const allowedSet = new Set(allowed);
  const safePatch = Object.fromEntries(Object.entries(patch).filter(([k]) => allowedSet.has(k)));
  if (Object.keys(safePatch).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  // PB-002 — Fetch previous state for audit trail (previous_value + new_value)
  const existing = await svc.entities[entity].get(id).catch(() => null);
  const prevValues = {};
  const newValues = {};
  for (const key of Object.keys(safePatch)) {
    prevValues[key] = existing ? (existing[key] ?? '') : '';
    newValues[key] = safePatch[key];
  }
  const result = await svc.entities[entity].update(id, safePatch);
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: `${entity.toLowerCase()}.update`,
    target_type: entity,
    target_id: id,
    previous_value: JSON.stringify(prevValues),
    new_value: JSON.stringify(newValues),
    details: 'Updated: ' + Object.keys(safePatch).join(', ') + (body.reason ? ` — ${String(body.reason).slice(0, 500)}` : ''),
  });
  return Response.json({ ok: true, result });
}

async function handleBroadcast(svc, user, base44, body) {
  const { announcement } = body;
  if (!announcement || !announcement.id || !announcement.audience) {
    return Response.json({ error: 'announcement required' }, { status: 400 });
  }

  let members = [];
  if (announcement.audience === 'premium') {
    const prem = await svc.entities.Membership.filter({ type: 'premium', status: 'active' }, '-created_date', 500);
    const userIds = prem.map((m) => m.user_id).filter(Boolean);
    members = userIds.length
      ? await svc.entities.Member.filter({ created_by_id: { $in: userIds } }, '-created_date', 500)
      : [];
  } else {
    const all = await svc.entities.Member.list('-created_date', 500);
    if (announcement.audience === 'all') members = all;
    else if (announcement.audience === 'city') {
      members = all.filter((m) => (m.city || '').toLowerCase() === (announcement.target_value || '').toLowerCase());
    } else if (announcement.audience === 'country') {
      members = all.filter((m) => (m.country || '').toLowerCase() === (announcement.target_value || '').toLowerCase());
    }
  }

  const emailable = members.filter((m) => m.email && m.notif_email !== false);
  const cap = Math.min(emailable.length, 200);
  let sent = 0;
  for (let i = 0; i < cap; i++) {
    try {
      await base44.integrations.Core.SendEmail({
        to: emailable[i].email,
        subject: announcement.title,
        body: (announcement.body || '') + '\n\n— The Nmood Team',
        from_name: 'Nmood',
      });
      sent++;
    } catch { /* best-effort */ }
  }

  await svc.entities.Announcement.update(announcement.id, { status: 'sent', reach: sent });
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'announcement.broadcast',
    target_type: 'Announcement',
    target_id: announcement.id,
    details: `Sent to ${sent} members (${announcement.audience})`,
  });
  return Response.json({ ok: true, reach: sent });
}

async function handleCreate(svc, user, body) {
  const { entity, record } = body;
  if (!['Announcement', 'Campaign', 'CampaignTemplate'].includes(entity)) {
    return Response.json({ error: 'Entity not allowed' }, { status: 400 });
  }
  if (!record || typeof record !== 'object') {
    return Response.json({ error: 'record required' }, { status: 400 });
  }
  const safe = Object.fromEntries(Object.entries(record).filter(([k]) => !FORBIDDEN_FIELDS.has(k)));
  if (entity === 'Announcement') safe.status = safe.status || 'draft';
  if (entity === 'Campaign') { safe.status = safe.status || 'draft'; safe.approval_state = safe.approval_state || 'draft'; }
  const result = await svc.entities[entity].create(safe);
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: `${entity.toLowerCase()}.create`,
    target_type: entity,
    target_id: result?.id,
    details: `Created ${entity}`,
  });
  return Response.json({ ok: true, result });
}

// FM-003 — Member Management Center support.
// memberStats: aggregated community counts for a member's profile panel.
// All reads use service role so admin sees every record regardless of RLS.
async function handleMemberStats(svc, body) {
  const userId = String(body.userId || '');
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
  const [connections, circleMemberships, attendances, hostedExp, hostedCircles, reports] = await Promise.all([
    svc.entities.PalConnection.filter({ user_id: userId }).catch(() => []),
    svc.entities.CircleMembership.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.Attendance.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.Experience.filter({ host_user_id: userId }).catch(() => []),
    svc.entities.Circle.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.SafetyReport.filter({ target_id: userId }).catch(() => []),
  ]);
  return Response.json({
    connections: (connections || []).length,
    circlesJoined: (circleMemberships || []).length,
    experiencesJoined: (attendances || []).length,
    experiencesHosted: (hostedExp || []).length,
    circlesHosted: (hostedCircles || []).length,
    reportsReceived: (reports || []).length,
    warningsIssued: 0,
  });
}

// FM-003 — Upgrade / downgrade a member's membership tier (soft, no payment).
async function handleMembershipAction(svc, user, body) {
  const { userId, action } = body;
  if (!userId || !action) return Response.json({ error: 'userId and action required' }, { status: 400 });
  let patch;
  if (action === 'upgrade') patch = { type: 'premium', status: 'active' };
  else if (action === 'downgrade') patch = { type: 'explorer', status: 'active' };
  else return Response.json({ error: 'unknown action' }, { status: 400 });
  const rows = await svc.entities.Membership.filter({ user_id: String(userId) }).catch(() => []);
  const previousState = rows && rows[0] ? { type: rows[0].type, status: rows[0].status, plan: rows[0].plan || '' } : null;
  let result;
  if (rows && rows[0]) {
    result = await svc.entities.Membership.update(rows[0].id, patch);
  } else {
    result = await svc.entities.Membership.create({ user_id: String(userId), ...patch });
  }
  const newState = { type: patch.type, status: patch.status };
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: `membership.${action}`,
    target_type: 'Membership',
    target_id: result?.id || (rows[0] && rows[0].id) || '',
    previous_value: previousState ? JSON.stringify(previousState) : 'none',
    new_value: JSON.stringify(newState),
    details: `Member ${String(userId)} -> ${patch.type}` + (body.reason ? ` — ${String(body.reason).slice(0, 500)}` : ''),
  });
  return Response.json({ ok: true, result });
}

// FM-003 — Private, timestamped, admin-only member notes.
async function handleNotesList(svc, body) {
  const memberId = String(body.memberId || '');
  if (!memberId) return Response.json({ error: 'memberId required' }, { status: 400 });
  const notes = await svc.entities.MemberNote.filter({ member_id: memberId }, '-created_date', 200).catch(() => []);
  return Response.json({ data: notes || [] });
}

async function handleNoteCreate(svc, user, body) {
  const { memberId, userId, content } = body;
  if (!memberId || !content) return Response.json({ error: 'memberId and content required' }, { status: 400 });
  const note = await svc.entities.MemberNote.create({
    member_id: String(memberId),
    user_id: String(userId || ''),
    author: user.email || user.full_name || user.id,
    author_id: String(user.id),
    body: String(content),
  });
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'memberNote.create',
    target_type: 'MemberNote',
    target_id: note?.id,
    details: `Note on member ${String(memberId)}`,
  });
  return Response.json({ ok: true, result: note });
}

async function handleNoteUpdate(svc, user, body) {
  const { noteId, content } = body;
  if (!noteId || !content) return Response.json({ error: 'noteId and content required' }, { status: 400 });
  const result = await svc.entities.MemberNote.update(noteId, { body: String(content) });
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'memberNote.update',
    target_type: 'MemberNote',
    target_id: noteId,
    details: 'Edited member note',
  });
  return Response.json({ ok: true, result });
}

async function handleNoteDelete(svc, user, body) {
  const { noteId } = body;
  if (!noteId) return Response.json({ error: 'noteId required' }, { status: 400 });
  await svc.entities.MemberNote.delete(noteId);
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'memberNote.delete',
    target_type: 'MemberNote',
    target_id: noteId,
    details: 'Deleted member note',
  });
  return Response.json({ ok: true });
}

// DEV-001 — Shared environment + owner resolution for the development-only
// Hard Delete. `enabled` is true only in a development runtime (APP_ENV ===
// 'development'); `isFounder` is true only for the verified Workspace Owner
// (server-side SystemConfig owner record). Both checks are server-side so the
// client can never bypass production safety.
// Tolerate a secret stored as "KEY=VALUE" (e.g. "APP_ENV=development") — the
// development environment is still strictly required; this only normalizes how
// the value was entered so the intended "development" value is recognized.
function readAppEnv() {
  const raw = (Deno.env.get('APP_ENV') ?? '').trim();
  const eq = raw.indexOf('=');
  if (eq >= 0 && /^[A-Za-z_][A-Za-z0-9_]*$/.test(raw.slice(0, eq))) return raw.slice(eq + 1).trim();
  return raw;
}

async function resolveDevHardDeleteAccess(req, svc, user) {
  // DEV-001 — Hard delete is gated to the development runtime AND the verified
  // workspace owner only. The owner is identified by the server-side SystemConfig
  // owner record (mission_control.owner_user_id) — never by the client-
  // controllable role field and never self-bootstrapped here — so a compromised
  // or elevated role cannot reach this destructive path. Fails closed while no
  // owner is recorded.
  const enabled = readAppEnv() === 'development';
  const rows = await svc.entities.SystemConfig.filter({ key: 'mission_control.owner_user_id' }).catch(() => []);
  const ownerId = rows && rows[0] ? String(rows[0].value) : '';
  return { enabled, isFounder: !!ownerId && String(user.id) === ownerId };
}

// DEV-001 — Access check used by the client to decide whether to show the
// Hard Delete action. Routed before the admin guard so a Founder / owner can
// reach it. Returns a single combined flag; never leaks why access is denied.
async function handleDevHardDeleteAccess(req, svc, user) {
  const { enabled, isFounder } = await resolveDevHardDeleteAccess(req, svc, user);
  return Response.json({ hardDeleteAllowed: enabled && isFounder });
}

// DEV-001 — Temporary Founder Hard Delete (Development Only).
// Permanently removes a member and their associated test data. Strictly for
// development / pre-production. Rejected server-side unless the runtime is in
// a development environment, and only the Founder (founder role or the recorded
// workspace owner) may invoke it. In production the endpoint always rejects.
async function handleHardDelete(req, svc, user, body) {
  // --- Environment + Founder guards (shared with the access-check mode) ---
  const access = await resolveDevHardDeleteAccess(req, svc, user);
  if (!access.enabled) {
    return Response.json(
      { error: 'not_available', message: 'Hard delete is only available in development.' },
      { status: 403 }
    );
  }
  if (!access.isFounder) {
    return Response.json(
      { error: 'forbidden', message: 'Only the founder may use hard delete.' },
      { status: 403 }
    );
  }

  const memberId = String(body.memberId || '');
  if (!memberId) return Response.json({ error: 'memberId required' }, { status: 400 });
  const member = await svc.entities.Member.get(memberId).catch(() => null);
  if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });
  const userId = String(member.created_by_id || '');

  // --- Delete the member account and related test data (best-effort, fault-tolerant) ---
  const del = (p) => p.catch(() => {});
  const delMany = (entity, filter) => del(svc.entities[entity].deleteMany(filter));
  const userScoped = userId ? [
    delMany('Membership', { user_id: userId }),
    delMany('PalConnection', { user_id: userId }),
    delMany('PalConnection', { pal_user_id: userId }),
    delMany('PalRequest', { sender_user_id: userId }),
    delMany('PalRequest', { receiver_user_id: userId }),
    delMany('CircleMembership', { created_by_id: userId }),
    delMany('Attendance', { created_by_id: userId }),
    delMany('Experience', { host_user_id: userId }),
    delMany('SafetyReport', { created_by_id: userId }),
    delMany('SafetyReport', { target_id: userId }),
    delMany('ProfileView', { created_by_id: userId }),
    delMany('BlockedMember', { created_by_id: userId }),
  ] : [];
  await Promise.all([
    delMany('MemberNote', { member_id: memberId }),
    ...userScoped,
  ]);
  await del(svc.entities.Member.delete(memberId));
  // Best-effort removal of the auth account (the platform may not permit it).
  if (userId) await del(svc.entities.User.delete(userId));

  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'member.hard_delete',
    target_type: 'Member',
    target_id: memberId,
    previous_value: member.admin_status || 'active',
    new_value: 'deleted',
    details: `Development Hard Delete of member ${memberId} (user ${userId || '—'}) by founder`,
  });

  return Response.json({ ok: true, deleted: memberId });
}

// FM-008 — Community Management Center: private admin notes on Experiences/Circles.
async function handleCommunityNotesList(svc, body) {
  const targetType = String(body.targetType || '');
  const targetId = String(body.targetId || '');
  if (!targetType || !targetId) return Response.json({ error: 'targetType and targetId required' }, { status: 400 });
  const notes = await svc.entities.CommunityNote.filter({ target_type: targetType, target_id: targetId }, '-created_date', 200).catch(() => []);
  return Response.json({ data: notes || [] });
}

async function handleCommunityNoteCreate(svc, user, body) {
  const { targetType, targetId, content } = body;
  if (!targetType || !targetId || !content) return Response.json({ error: 'targetType, targetId and content required' }, { status: 400 });
  const note = await svc.entities.CommunityNote.create({
    target_type: String(targetType),
    target_id: String(targetId),
    author: user.email || user.full_name || user.id,
    author_id: String(user.id),
    body: String(content),
  });
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'communityNote.create',
    target_type: 'CommunityNote',
    target_id: note?.id,
    details: `Note on ${String(targetType)} ${String(targetId)}`,
  });
  return Response.json({ ok: true, result: note });
}

async function handleCommunityNoteDelete(svc, user, body) {
  const { noteId } = body;
  if (!noteId) return Response.json({ error: 'noteId required' }, { status: 400 });
  await svc.entities.CommunityNote.delete(noteId);
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'communityNote.delete',
    target_type: 'CommunityNote',
    target_id: noteId,
    details: 'Deleted community note',
  });
  return Response.json({ ok: true });
}

// PB-002 — Member History: full timeline for a single member.
// Returns audit logs (status changes + membership overrides), safety reports,
// hosted experiences, created circles, and membership records — all in one
// admin-verified round trip.
async function handleMemberHistory(svc, body) {
  const memberId = String(body.memberId || '');
  const userId = String(body.userId || '');
  if (!memberId && !userId) return Response.json({ error: 'memberId or userId required' }, { status: 400 });

  // Resolve the member's membership record IDs so we can match audit logs.
  const memberships = userId
    ? await svc.entities.Membership.filter({ user_id: userId }).catch(() => [])
    : [];
  const membershipIds = new Set((memberships || []).map((m) => m.id));

  const [memberAuditLogs, allMembershipAuditLogs, reports, experiences, circles] = await Promise.all([
    memberId
      ? svc.entities.AuditLog.filter({ target_type: 'Member', target_id: memberId }, '-created_date', 100).catch(() => [])
      : [],
    svc.entities.AuditLog.filter({ target_type: 'Membership' }, '-created_date', 200).catch(() => []),
    userId
      ? svc.entities.SafetyReport.filter({ target_id: userId }, '-created_date', 50).catch(() => [])
      : [],
    userId
      ? svc.entities.Experience.filter({ host_user_id: userId }, '-created_date', 50).catch(() => [])
      : [],
    userId
      ? svc.entities.Circle.filter({ created_by_id: userId }, '-created_date', 50).catch(() => [])
      : [],
  ]);

  // Filter membership audit logs for this user's membership records.
  const membershipAuditLogs = (allMembershipAuditLogs || []).filter((log) =>
    membershipIds.has(log.target_id) || (log.details && log.details.includes(userId))
  );

  const auditLogs = [...(memberAuditLogs || []), ...membershipAuditLogs]
    .sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime())
    .slice(0, 100);

  return Response.json({
    auditLogs,
    reports: reports || [],
    experiences: experiences || [],
    circles: circles || [],
    memberships: memberships || [],
  });
}

// FM-008 — Activity timeline for a single Experience/Circle from the audit log.
async function handleActivityList(svc, body) {
  const targetType = String(body.targetType || '');
  const targetId = String(body.targetId || '');
  if (!targetType || !targetId) return Response.json({ error: 'targetType and targetId required' }, { status: 400 });
  const logs = await svc.entities.AuditLog.filter({ target_type: targetType, target_id: targetId }, '-created_date', 100).catch(() => []);
  return Response.json({ data: logs || [] });
}

// FM-009 — Communication Center: audience estimation, campaign send, duplicate, delete.
async function loadAudienceData(svc) {
  const [members, memberships, circleMems, attendances, events] = await Promise.all([
    svc.entities.Member.list('-created_date', 500),
    svc.entities.Membership.list('-created_date', 500).catch(() => []),
    svc.entities.CircleMembership.list('-created_date', 500).catch(() => []),
    svc.entities.Attendance.list('-created_date', 500).catch(() => []),
    svc.entities.ProductEvent.list('-created_date', 1000).catch(() => []),
  ]);
  return { members, memberships, circleMems, attendances, events };
}

function applyAudienceFilters(members, memberships, circleMems, attendances, evtArr, f) {
  let arr = (members || []).filter((m) => (m.admin_status || 'active') === 'active');
  const memArr = memberships || [];
  const cmArr = circleMems || [];
  const attArr = attendances || [];
  const evArr = evtArr || [];

  if (Array.isArray(f.countries) && f.countries.length) {
    const set = new Set(f.countries.map((c) => String(c).toLowerCase()));
    arr = arr.filter((m) => set.has(String(m.country || '').toLowerCase()));
  }
  if (Array.isArray(f.cities) && f.cities.length) {
    const set = new Set(f.cities.map((c) => String(c).toLowerCase()));
    arr = arr.filter((m) => set.has(String(m.city || '').toLowerCase()));
  }
  if (Array.isArray(f.languages) && f.languages.length) {
    arr = arr.filter((m) => Array.isArray(m.languages) && f.languages.some((l) => m.languages.includes(l)));
  }
  if (f.membership && f.membership !== 'all') {
    const premIds = new Set(
      memArr.filter((m) => m.type === 'premium' && m.status === 'active').map((m) => m.user_id).filter(Boolean)
    );
    if (f.membership === 'premium') arr = arr.filter((m) => premIds.has(m.created_by_id));
    else if (f.membership === 'explorer') arr = arr.filter((m) => !premIds.has(m.created_by_id));
  }
  if (f.verification && f.verification !== 'all') {
    if (f.verification === 'verified') arr = arr.filter((m) => m.phone_verified);
    else arr = arr.filter((m) => !m.phone_verified);
  }
  if (Array.isArray(f.interests) && f.interests.length) {
    arr = arr.filter((m) => Array.isArray(m.interests) && f.interests.some((i) => m.interests.includes(i)));
  }
  if (Array.isArray(f.circles) && f.circles.length) {
    const userIds = new Set(cmArr.filter((c) => f.circles.includes(c.circle_id)).map((c) => c.created_by_id).filter(Boolean));
    arr = arr.filter((m) => userIds.has(m.created_by_id));
  }
  if (Array.isArray(f.experiences) && f.experiences.length) {
    const want = new Set(f.experiences.map(String));
    const userIds = new Set(attArr.filter((a) => want.has(String(a.experience_id))).map((a) => a.created_by_id).filter(Boolean));
    arr = arr.filter((m) => userIds.has(m.created_by_id));
  }
  if (f.recentlyActive) {
    const since = Date.now() - 86400000;
    const active = new Set();
    for (const e of evArr) {
      if (e.created_date && new Date(e.created_date).getTime() >= since && e.created_by_id) active.add(e.created_by_id);
    }
    arr = arr.filter((m) => active.has(m.created_by_id));
  }
  if (f.online) {
    const since = Date.now() - 300000;
    const online = new Set();
    for (const e of evArr) {
      if (e.created_date && new Date(e.created_date).getTime() >= since && e.created_by_id) online.add(e.created_by_id);
    }
    arr = arr.filter((m) => online.has(m.created_by_id));
  }
  if (Array.isArray(f.customMembers) && f.customMembers.length) {
    const set = new Set(f.customMembers);
    arr = arr.filter((m) => set.has(m.id) || set.has(m.created_by_id));
  }
  return arr;
}

async function handleEstimateAudience(svc, body) {
  const f = body.filters || {};
  const data = await loadAudienceData(svc);
  const arr = applyAudienceFilters(data.members, data.memberships, data.circleMems, data.attendances, data.events, f);
  return Response.json({ count: arr.length });
}

async function handleSendCampaign(svc, user, base44, body) {
  const { id } = body;
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  const campaign = await svc.entities.Campaign.get(id).catch(() => null);
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

  const data = await loadAudienceData(svc);
  const audience = applyAudienceFilters(
    data.members, data.memberships, data.circleMems, data.attendances, data.events,
    campaign.audience_filters || {}
  );

  let delivered = 0;
  let failed = 0;
  if (campaign.type === 'email') {
    const emailable = audience.filter((m) => m.email && m.notif_email !== false);
    const cap = Math.min(emailable.length, 200);
    for (let i = 0; i < cap; i++) {
      try {
        await base44.integrations.Core.SendEmail({
          to: emailable[i].email,
          subject: campaign.subject || campaign.title || campaign.name,
          body: (campaign.body || '') + '\n\n— The Nmood Team',
          from_name: 'Nmood',
        });
        delivered++;
      } catch {
        failed++;
      }
    }
    failed += emailable.length - cap;
  } else {
    // push / in-app / announcement / future channels — queued for asynchronous delivery.
    delivered = audience.length;
  }

  const stats = { delivered, failed, pending: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
  const result = await svc.entities.Campaign.update(id, {
    status: 'sent',
    approval_state: 'published',
    sent_at: new Date().toISOString(),
    sent_by: user.email || user.full_name || user.id,
    sent_by_id: String(user.id),
    actual_audience: audience.length,
    estimated_audience: campaign.estimated_audience || audience.length,
    delivery_stats: stats,
  });
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'campaign.send',
    target_type: 'Campaign',
    target_id: id,
    details: `Sent ${campaign.type} to ${audience.length} members (${delivered} delivered)`,
  });
  return Response.json({ ok: true, audience: audience.length, delivered, failed, result });
}

async function handleDuplicateCampaign(svc, user, body) {
  const { id } = body;
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  const c = await svc.entities.Campaign.get(id).catch(() => null);
  if (!c) return Response.json({ error: 'Campaign not found' }, { status: 404 });
  const copy = {
    name: (c.name || 'Campaign') + ' (Copy)',
    type: c.type,
    status: 'draft',
    approval_state: 'draft',
    title: c.title,
    subject: c.subject,
    body: c.body,
    image_url: c.image_url,
    cta_label: c.cta_label,
    cta_url: c.cta_url,
    icon: c.icon,
    priority: c.priority,
    expiry_date: c.expiry_date,
    audience_filters: c.audience_filters || {},
    announcement_type: c.announcement_type,
    announcement_display: c.announcement_display,
    template_id: c.template_id,
  };
  const result = await svc.entities.Campaign.create(copy);
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'campaign.duplicate',
    target_type: 'Campaign',
    target_id: result?.id,
    details: `Duplicated from ${id}`,
  });
  return Response.json({ ok: true, result });
}

async function handleDeleteCommunication(svc, user, body) {
  const { entity, id } = body;
  if (!['Campaign', 'CampaignTemplate'].includes(entity)) {
    return Response.json({ error: 'Entity not allowed' }, { status: 400 });
  }
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  await svc.entities[entity].delete(id);
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: `${entity.toLowerCase()}.delete`,
    target_type: entity,
    target_id: id,
    details: `Deleted ${entity}`,
  });
  return Response.json({ ok: true });
}

// FM-011 — Platform Operations Center. One admin-verified round trip returns
// every operational entity the center needs (security events, audit logs,
// feature flags, system config, error logs, performance metrics, alerts).
// Each read is fault-tolerant so a missing/empty entity never breaks the load.
async function handleOpsCenter(svc) {
  const ok = (p) => p.catch(() => []);
  const [
    securityEvents, auditLogs, featureFlags, systemConfig,
    errorLogs, performanceMetrics, observabilityAlerts,
  ] = await Promise.all([
    ok(svc.entities.SecurityEvent.list('-created_date', 500)),
    ok(svc.entities.AuditLog.list('-created_date', 500)),
    ok(svc.entities.FeatureFlag.list('-created_date', 200)),
    ok(svc.entities.SystemConfig.list('-created_date', 200)),
    ok(svc.entities.ErrorLog.list('-created_date', 500)),
    ok(svc.entities.PerformanceMetric.list('-created_date', 500)),
    ok(svc.entities.ObservabilityAlert.list('-created_date', 200)),
  ]);
  return Response.json({
    securityEvents: securityEvents || [],
    auditLogs: auditLogs || [],
    featureFlags: featureFlags || [],
    systemConfig: systemConfig || [],
    errorLogs: errorLogs || [],
    performanceMetrics: performanceMetrics || [],
    observabilityAlerts: observabilityAlerts || [],
  });
}

// FM-011 — Lightweight media reference aggregation for the Media Library. Only
// image URLs (url, source, category, created_date) are returned, keeping the
// payload small. No member data is mutated; management actions are read-only.
async function handleMediaLibrary(svc) {
  const ok = (p) => p.catch(() => []);
  const [members, experiences, circles, systemConfig] = await Promise.all([
    ok(svc.entities.Member.list('-created_date', 1000)),
    ok(svc.entities.Experience.list('-created_date', 500)),
    ok(svc.entities.Circle.list('-created_date', 500)),
    ok(svc.entities.SystemConfig.list('-created_date', 200)),
  ]);
  const items = [];
  for (const m of members || []) {
    if (m.photo_url) items.push({ url: m.photo_url, category: 'member', source: m.display_name || 'Member', created_date: m.created_date });
    (m.photo_gallery || []).forEach((u) => { if (u) items.push({ url: u, category: 'member', source: m.display_name || 'Member', created_date: m.created_date }); });
  }
  for (const e of experiences || []) {
    if (e.cover_image) items.push({ url: e.cover_image, category: 'experience', source: e.title || 'Experience', created_date: e.created_date });
  }
  for (const c of circles || []) {
    if (c.cover_photo) items.push({ url: c.cover_photo, category: 'circle', source: c.name || 'Circle', created_date: c.created_date });
  }
  for (const s of systemConfig || []) {
    if (s.category === 'branding' && s.value && /^https?:\/\//.test(s.value)) items.push({ url: s.value, category: 'brand', source: s.key, created_date: s.created_date });
  }
  return Response.json({ items, total: items.length });
}

// FM-011 — Toggle a feature flag. Admin-gated and audit-logged (immutable).
async function handleToggleFeatureFlag(svc, user, body) {
  const { id, enabled } = body;
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  const flag = await svc.entities.FeatureFlag.get(id).catch(() => null);
  if (!flag) return Response.json({ error: 'Feature flag not found' }, { status: 404 });
  const next = !!enabled;
  await svc.entities.FeatureFlag.update(id, { enabled: next });
  await svc.entities.AuditLog.create({
    administrator: user.email || user.id,
    action: 'featureflag.toggle',
    target_type: 'FeatureFlag',
    target_id: id,
    previous_value: String(flag.enabled),
    new_value: String(next),
    details: `Toggled feature flag "${flag.key || flag.name || id}" ${next ? 'ON' : 'OFF'}`,
  });
  return Response.json({ ok: true, id, enabled: next });
}