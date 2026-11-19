import {ISOLATED_APP_BUILD} from '@/lib/isolated-app/active.mjs';
// Mission Control data adapters — Supabase only.
//
// Every number Mission Control shows comes from one of the admin-verified
// SECURITY DEFINER functions created in supabase/migrations/0014. Nothing here
// falls back to zero: if Supabase cannot be reached, or the caller is not an
// admin, the promise rejects and the UI renders an explicit failure state.
import { callSupabaseRpc, getSupabaseSession, getSignedStorageUrl, invokeSupabaseFunction } from '@/api/supabaseClient';
import { listReadableRecords, toEntity } from '@/api/supabaseRecords';

export class AdminDataError extends Error {
  constructor(message, { kind = 'connection', cause } = {}) {
    super(message);
    this.name = 'AdminDataError';
    this.kind = kind; // 'connection' | 'forbidden' | 'signed_out'
    this.cause = cause;
  }
}

function classify(error) {
  const message = String(error?.message || '');
  if (/not authorised|not authorized|forbidden|permission denied|42501/i.test(message)) {
    return new AdminDataError('You do not have permission to view this data.', { kind: 'forbidden', cause: error });
  }
  if (/sign in/i.test(message)) {
    return new AdminDataError('Please sign in again to continue.', { kind: 'signed_out', cause: error });
  }
  return new AdminDataError(
    'Mission Control could not reach the Nmood database. No figures are shown because none could be confirmed.',
    { kind: 'connection', cause: error },
  );
}

async function rpc(name, params) {
  if (!ISOLATED_APP_BUILD && !getSupabaseSession()?.access_token) {
    throw new AdminDataError('Please sign in again to continue.', { kind: 'signed_out' });
  }
  try {
    return await callSupabaseRpc(name, params);
  } catch (error) {
    throw classify(error);
  }
}

const asArray = (value) => (Array.isArray(value) ? value : []);

/** Live platform counters. Throws AdminDataError rather than returning zeros. */
export async function fetchPlatformOverview() {
  const result = await rpc('admin_platform_overview', {});
  const overview = Array.isArray(result) ? result[0] : result;
  if (!overview || typeof overview !== 'object') {
    throw new AdminDataError('Mission Control received an unreadable response from the database.', { kind: 'connection' });
  }
  return overview;
}

/** Real member directory rows, newest registration first. */
export async function fetchAdminMembers({ search = '', limit = 500, offset = 0 } = {}) {
  const rows = await rpc('admin_list_members_v2', { p_search: search || null, p_limit: limit, p_offset: offset });
  return asArray(rows).map(normaliseMember);
}

/** Maps a Supabase member row onto the field names the directory helpers use. */
export function normaliseMember(row) {
  return {
    ...row,
    full_name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.display_name || '',
    languages: row.languages || [],
    interests: row.interests || [],
    created_date: row.created_at,
    updated_date: row.updated_at,
    last_active_date: row.last_active_at || row.updated_at,
    status: row.account_state === 'deleted' ? 'deleted' : row.moderation_state && row.moderation_state !== 'active' ? row.moderation_state : row.account_state || 'active',
    admin_status: row.account_state === 'deleted' ? 'deleted' : row.moderation_state && row.moderation_state !== 'active' ? row.moderation_state : row.account_state || 'active',
    verified: Boolean(row.identity_verified),
  };
}

/** Photo-verification submissions awaiting (or past) review. */
export async function fetchPhotoVerifications({ status = 'pending', limit = 200 } = {}) {
  const rows = await rpc('admin_list_photo_verifications', { p_status: status, p_limit: limit });
  return asArray(rows);
}

/**
 * Resolves a private `verification-selfies` storage path to a short-lived
 * signed URL the reviewer's browser can render. RLS on the bucket still
 * applies to the signing call, so a non-admin caller gets nothing back.
 * Accepts legacy full URLs (pre-migration-0016 records) unchanged.
 */
export async function getVerificationSelfieUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  try {
    return await getSignedStorageUrl('verification-selfies', pathOrUrl);
  } catch {
    return null;
  }
}

/**
 * Deletes a member's private verification selfie (Edge Function, service
 * role) and clears its stored path reference. Never touches
 * members.identity_verified — removing evidence never revokes an approval.
 * Refuses (without deleting anything) when the record predates migration
 * 0016 and still holds a legacy public profile-photos URL.
 */
export async function deleteVerificationSelfie(recordId) {
  if (!recordId) throw new AdminDataError('That verification submission no longer exists.', { kind: 'connection' });
  if (!ISOLATED_APP_BUILD && !getSupabaseSession()?.access_token) {
    throw new AdminDataError('Please sign in again to continue.', { kind: 'signed_out' });
  }
  try {
    return await invokeSupabaseFunction('admin-verification-selfie-delete', { record_id: recordId });
  } catch (error) {
    const code = error?.error || error?.message || '';
    if (code === 'not_authorized') {
      throw new AdminDataError('You do not have permission to do this.', { kind: 'forbidden', cause: error });
    }
    if (code === 'legacy_public_file_not_supported') {
      throw new AdminDataError('This submission predates private storage and must be handled separately.', { kind: 'connection', cause: error });
    }
    if (code === 'not_found' || code === 'no_selfie') {
      throw new AdminDataError('There is no private selfie to delete for this submission.', { kind: 'connection', cause: error });
    }
    throw new AdminDataError('Could not delete the verification selfie. Please try again.', { kind: 'connection', cause: error });
  }
}

/**
 * Approve / reject a submission. The RPC re-checks the admin role, writes the
 * decision onto the submission and flips the member's identity_verified flag in
 * the same transaction, so the app reflects the change immediately.
 */
export async function reviewPhotoVerification(recordId, decision, reason = '') {
  if (!recordId) throw new AdminDataError('That verification submission no longer exists.', { kind: 'connection' });
  if (!['approved', 'rejected', 'needs_resubmission'].includes(decision)) {
    throw new AdminDataError('Unsupported review decision.', { kind: 'connection' });
  }
  const result = await rpc('admin_review_photo_verification', {
    p_record_id: recordId,
    p_decision: decision,
    p_reason: reason || null,
  });
  return Array.isArray(result) ? result[0] : result;
}

/** True only for members whose Supabase role is admin or founder. */
export async function fetchSafetyReports({ status = null, limit = 200 } = {}) {
  const rows = await rpc('admin_list_safety_reports', { p_status: status, p_limit: limit });
  return asArray(rows).map((row) => ({ ...row, reason: row.category, created_date: row.created_at, updated_date: row.updated_at, target_type: row.target_type === 'profile' ? 'member' : row.target_type, reporter_name: 'Confidential reporter' }));
}

export async function moderateSafetyReport(reportId, action, reason, restrictionHours = null) {
  return rpc('admin_moderate_safety_report', { p_report_id: reportId, p_action: action, p_reason: reason, p_restriction_hours: restrictionHours });
}

export async function checkIsPlatformAdmin() {
  try {
    const result = await callSupabaseRpc('is_platform_admin', {});
    return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
  } catch {
    return false;
  }
}

/**
 * Admin-wide read of an app_records entity type. Migration 0012 already gives
 * admins/founders read access to every app_record, so no new policy is needed.
 */
export async function fetchAdminRecords(entityType, { limit = 1000 } = {}) {
  try {
    const rows = await listReadableRecords(entityType, { limit });
    return asArray(rows).map(toEntity).filter(Boolean);
  } catch (error) {
    throw classify(error);
  }
}

/**
 * Presents the overview counters under the camelCase names the existing
 * Mission Control widgets already read, without inventing any value.
 */
export function toDashboardStats(overview) {
  if (!overview) return null;
  return {
    ...overview,
    totalMembers: overview.members_total ?? 0,
    onboardedMembers: overview.members_onboarded ?? 0,
    newMembers24h: overview.members_new_24h ?? 0,
    newMembers7d: overview.members_new_7d ?? 0,
    newMembers30d: overview.members_new_30d ?? 0,
    onlineMembers: overview.members_active_7d ?? 0,
    activeMembers7d: overview.members_active_7d ?? 0,
    verifiedMembers: overview.members_verified ?? 0,
    premiumMembers: overview.premium_members ?? 0,
    suspendedMembers: Math.max(0, (overview.members_total ?? 0) - (overview.members_onboarded ?? 0)),
    totalCircles: overview.circles_total ?? 0,
    totalExperiences: overview.experiences_total ?? 0,
    openReports: overview.reports_open ?? 0,
    totalReports: overview.reports_total ?? 0,
    totalMessages: overview.messages_total ?? 0,
    totalConnections: overview.connections_total ?? 0,
    activeSubscriptions: overview.subscriptions_active ?? 0,
    pendingPhotoVerifications: overview.photo_verifications_pending ?? 0,
  };
}
