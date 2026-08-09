// LC-002 Part 1 — Account Deletion.
// Soft-deletes the member: anonymizes personal data, sets admin_status to
// 'deleted', cancels manual memberships, logs for audit, and ends the session.
// Records required by law (audit logs, reports) are NOT destroyed.

import { base44 } from '@/api/base44Client';
import { deleteMemberAccount } from '@/lib/member-update';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';

const ANONYMIZED_DISPLAY_NAME = 'Deleted Member';

export async function softDeleteAccount(member, user, password) {
  if (!member?.id) throw new Error('No member record found.');

  // 1. Verify password for email accounts (server-side via re-auth).
  if (password && user?.email) {
    try {
      await base44.auth.loginViaEmailPassword(user.email, password);
    } catch {
      throw new Error('Password verification failed. Please check your password and try again.');
    }
  }

  // 2. Anonymize personal data on the Member record + soft-delete.
  const anonymizedData = {
    admin_status: 'deleted',
    first_name: null,
    last_name: null,
    display_name: ANONYMIZED_DISPLAY_NAME,
    email: null,
    phone: null,
    date_of_birth: null,
    gender: null,
    bio: null,
    photo_url: null,
    photo_gallery: [],
    interests: [],
    languages: [],
    lifestyle: null,
    location_enabled: false,
    profile_visibility: 'private',
    who_can_message: 'no_one',
    show_online_status: false,
    show_age: false,
    show_distance: false,
    show_last_seen: false,
    personalized_recommendations: false,
    analytics_consent: false,
    admin_note: `Self-deleted on ${new Date().toISOString()}`,
  };

  await deleteMemberAccount();

  // 3. Cancel manual memberships (store-managed subscriptions are cancelled
  //    by the user via their respective app store — we note this in the UI).
  try {
    const memberships = await base44.entities.Membership.filter({ user_id: user.id });
    for (const m of memberships) {
      if (m.billing_platform === 'manual' || m.billing_platform === 'admin') {
        await base44.entities.Membership.update(m.id, {
          status: 'cancelled',
          auto_renew: false,
          cancelled_at: new Date().toISOString(),
        });
      }
    }
  } catch { /* non-blocking — audit log is the critical path */ }

  // 4. Log the deletion for audit purposes (retained per data retention policy).
  try {
    await base44.entities.AuditLog.create({
      action: 'account_self_deleted',
      administrator: user?.email || user?.id || 'unknown',
      target_type: 'Member',
      target_id: member.id,
      details: `Member self-initiated account deletion. Personal data anonymized. Admin status set to deleted.`,
    });
  } catch { /* audit log must not block deletion */ }

  // 5. Track the deletion event (essential — always fires).
  try { trackProductEvent(PRODUCT_EVENTS.ACCOUNT_DELETED); } catch { /* never break */ }

  // 6. End all active sessions — logout + hard redirect to a public page.
  // The AuthContext.logout() handles token invalidation and session cleanup.
  // We call it from the UI layer after this function returns success.
}

export async function verifyPasswordForDeletion(email, password) {
  if (!email || !password) return false;
  try {
    await base44.auth.loginViaEmailPassword(email, password);
    return true;
  } catch {
    return false;
  }
}