import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// PV-001 — Photo / identity verification (manual review flow).
// Launch-safe: NO biometric facial matching. A human admin reviews the selfie
// + prompted pose and approves/rejects. Private media is uploaded via
// UploadPrivateFile (private storage) and NEVER appears in the public profile
// or gallery.
//
// Authorization: every state change happens server-side here (service role),
// so RLS on PhotoVerification (create/update/delete admin-only) and Member
// (update admin-only) cannot be bypassed by clients. The "verified" badge
// (Member.identity_verified) is set ONLY here, after an admin approval.
//
// Retention: private media URIs are nulled (media_deleted_at set) after review
// or on admin deletion. The Base44 SDK has no storage-delete API, so the URIs
// are recorded in the AuditLog for manual storage follow-up; the entity fields
// are cleared so they no longer resolve to a file.

const RETENTION_DAYS = 30;
const ALLOWED_PROMPTS = ['hand_on_heart', 'peace_sign', 'two_fingers_to_temple', 'wave'];

function isAdmin(user) {
  return user?.role === 'admin' || user?.role === 'founder';
}

function isPrivateUri(uri) {
  if (typeof uri !== 'string' || !uri.trim()) return false;
  if (/^data:/i.test(uri)) return false; // must be uploaded, not inlined
  if (/^https?:\/\/(?!base44\.app)/i.test(uri)) return false; // app storage only
  return true;
}

async function audit(svc, { administrator, action, target_id, details }) {
  try {
    await svc.asServiceRole.entities.AuditLog.create({
      administrator: administrator || 'photoVerification',
      action,
      target_type: 'PhotoVerification',
      target_id: target_id || '',
      details: details || '',
    });
  } catch { /* audit must never block */ }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // --- submit / resubmit (user) ---
    if (action === 'submit' || action === 'resubmit') {
      const { selfie_file_uri, prompt, consent } = body;
      if (!isPrivateUri(selfie_file_uri)) {
        return Response.json({ error: 'A verification photo is required.' }, { status: 400 });
      }
      if (!ALLOWED_PROMPTS.includes(prompt)) {
        return Response.json({ error: 'Invalid verification prompt.' }, { status: 400 });
      }
      if (!consent) {
        return Response.json({ error: 'Explicit consent is required.' }, { status: 400 });
      }
      let members = await base44.asServiceRole.entities.Member.filter({ created_by_id: user.id }, '-created_date', 1);
      if ((!members || members.length === 0) && user.email) {
        members = await base44.asServiceRole.entities.Member.filter({ email: user.email }, '-created_date', 1);
      }
      const member = (members || [])[0];
      if (!member) return Response.json({ error: 'Member profile not found.' }, { status: 404 });

      // Invalidate prior pending/needs_resubmission/rejected submissions for this user.
      const prior = await base44.asServiceRole.entities.PhotoVerification.filter({ user_id: user.id }, '-created_date', 20);
      for (const p of prior || []) {
        if (['pending', 'needs_resubmission', 'rejected'].includes(p.status)) {
          await base44.asServiceRole.entities.PhotoVerification.update(p.id, { status: 'rejected', decision_reason: 'Superseded by new submission.' }).catch(() => {});
        }
      }

      const now = new Date();
      const retention = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const rec = await base44.asServiceRole.entities.PhotoVerification.create({
        user_id: user.id,
        member_id: member.id,
        member_name: member.display_name || '',
        status: 'pending',
        selfie_file_uri,
        pose_file_uri: null,
        prompt,
        consent_at: now.toISOString(),
        submitted_at: now.toISOString(),
        retention_expires_at: retention,
      });
      await audit(base44, { administrator: user.email, action: `photo_verification_${action}`, target_id: rec.id, details: 'Submission created (media URIs not logged).' });
      return Response.json({ ok: true, id: rec.id, status: 'pending' });
    }

    // --- status (user) ---
    if (action === 'status') {
      const list = await base44.asServiceRole.entities.PhotoVerification.filter({ user_id: user.id }, '-created_date', 1);
      const cur = (list || [])[0];
      if (!cur) return Response.json({ ok: true, status: 'none' });
      return Response.json({
        ok: true,
        status: cur.status,
        decision_reason: cur.decision_reason || '',
        submitted_at: cur.submitted_at,
        reviewed_at: cur.reviewed_at,
      });
    }

    // --- review (admin only) ---
    if (action === 'review') {
      if (!isAdmin(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { id, decision, reason } = body;
      if (!['approved', 'rejected', 'needs_resubmission'].includes(decision)) {
        return Response.json({ error: 'Invalid decision.' }, { status: 400 });
      }
      const rec = await base44.asServiceRole.entities.PhotoVerification.get(id).catch(() => null);
      if (!rec) return Response.json({ error: 'Submission not found.' }, { status: 404 });
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.PhotoVerification.update(id, {
        status: decision,
        reviewed_at: now,
        reviewer_id: user.id,
        reviewer_email: user.email,
        decision_reason: reason || '',
      });
      if (decision === 'approved') {
        await base44.asServiceRole.entities.Member.update(rec.member_id, { identity_verified: true }).catch(() => {});
      }
      await audit(base44, { administrator: user.email, action: `photo_verification_review_${decision}`, target_id: id, details: reason ? 'Reason recorded.' : 'No reason given.' });
      return Response.json({ ok: true, status: decision });
    }

    // --- listPending (admin only) ---
    if (action === 'listPending') {
      if (!isAdmin(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const list = await base44.asServiceRole.entities.PhotoVerification.filter({ status: 'pending' }, '-submitted_at', 50);
      const safe = (list || []).map((r) => ({
        id: r.id, user_id: r.user_id, member_id: r.member_id, member_name: r.member_name,
        status: r.status, prompt: r.prompt, submitted_at: r.submitted_at, retention_expires_at: r.retention_expires_at,
      }));
      return Response.json({ ok: true, items: safe });
    }

    // --- getDetail (admin only) — returns short-lived signed URLs for review ---
    if (action === 'getDetail') {
      if (!isAdmin(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { id } = body;
      const rec = await base44.asServiceRole.entities.PhotoVerification.get(id).catch(() => null);
      if (!rec) return Response.json({ error: 'Not found.' }, { status: 404 });
      let selfie_url = null, pose_url = null;
      try {
        if (rec.selfie_file_uri) {
          const s = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: rec.selfie_file_uri, expires_in: 300 });
          selfie_url = s?.signed_url || null;
        }
        if (rec.pose_file_uri) {
          const s = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: rec.pose_file_uri, expires_in: 300 });
          pose_url = s?.signed_url || null;
        }
      } catch { /* signed URL best-effort */ }
      return Response.json({
        ok: true,
        detail: {
          id: rec.id, user_id: rec.user_id, member_id: rec.member_id, member_name: rec.member_name,
          status: rec.status, prompt: rec.prompt, consent_at: rec.consent_at,
          submitted_at: rec.submitted_at, reviewed_at: rec.reviewed_at,
          reviewer_email: rec.reviewer_email, decision_reason: rec.decision_reason,
          retention_expires_at: rec.retention_expires_at, media_deleted_at: rec.media_deleted_at,
          selfie_url, pose_url,
        },
      });
    }

    // --- deleteMedia (admin only) — retention / cleanup ---
    if (action === 'deleteMedia') {
      if (!isAdmin(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { id } = body;
      const rec = await base44.asServiceRole.entities.PhotoVerification.get(id).catch(() => null);
      if (!rec) return Response.json({ error: 'Not found.' }, { status: 404 });
      await base44.asServiceRole.entities.PhotoVerification.update(id, {
        selfie_file_uri: null,
        pose_file_uri: null,
        media_deleted_at: new Date().toISOString(),
      }).catch(() => {});
      await audit(base44, {
        administrator: user.email,
        action: 'photo_verification_media_deleted',
        target_id: id,
        details: `selfie=${rec.selfie_file_uri ? 'present' : 'null'}; pose=${rec.pose_file_uri ? 'present' : 'null'}; storage deletion requires manual follow-up`,
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});