// ═══════════════════════════════════════════════════════════════════════════
// CENTRALIZED LAUNCH CONFIGURATION — the single source of truth for Nmood v1
// Founder Access free launch.
//
// FOUNDER_ACCESS_ENABLED (true):
//   Every authenticated adult member gets the full social experience for free
//   — profiles, experiences, circles, discovery, connections, joins, messaging,
//   profile visitors, saved content, and all social/discovery features.
//   Explorer/Premium entitlement gates and quotas are removed at runtime.
//   No Membership records are created, modified, or destroyed; existing
//   membership history (explorer, premium, cancelled, expired) is preserved
//   and receives identical Founder Access.
//
// PAID_SUBSCRIPTIONS_ENABLED (false):
//   All checkout, purchase, upgrade, restore-purchase, manage-subscription,
//   and simulated payment actions are disabled and fail closed. Native and
//   web/preview can never start a transaction. The IAP architecture
//   (subscription-service, native-billing-bridge, subscriptionService backend)
//   is preserved behind this flag for activation in a later release.
//
// Safety/abuse protections (rate limits for spam, mass invitations, harassment
// prevention, blocking, reporting, moderation, 18+ enforcement, AI cost limits)
// are NOT controlled by these flags and remain fully active at all times.
//
// Backward-compatible aliases (FREE_LAUNCH_V1, MONETIZATION_V1, SOCIAL_AUTH_V1)
// are kept so existing imports continue to work; new code should use the
// canonical names.
// ═══════════════════════════════════════════════════════════════════════════

// ── Canonical launch flags ──────────────────────────────────────────────────
export const FOUNDER_ACCESS_ENABLED = false;
export const PAID_SUBSCRIPTIONS_ENABLED = true;
export const SOCIAL_AUTH_V1 = true;

// ── Canonical accessors ─────────────────────────────────────────────────────
export function isFounderAccessEnabled() { return FOUNDER_ACCESS_ENABLED; }
export function isPaidSubscriptionsEnabled() { return PAID_SUBSCRIPTIONS_ENABLED; }
export function isSocialAuthEnabled() { return SOCIAL_AUTH_V1; }

// ── Backward-compatible aliases ─────────────────────────────────────────────
// FREE_LAUNCH_V1 mirrors FOUNDER_ACCESS_ENABLED for existing imports.
export const FREE_LAUNCH_V1 = FOUNDER_ACCESS_ENABLED;
// MONETIZATION_V1 mirrors PAID_SUBSCRIPTIONS_ENABLED for existing imports
// that gate paywall/upgrade UI visibility.
export const MONETIZATION_V1 = PAID_SUBSCRIPTIONS_ENABLED;

export function isFreeLaunch() { return FOUNDER_ACCESS_ENABLED; }
export function isMonetizationEnabled() { return PAID_SUBSCRIPTIONS_ENABLED; }

// ── Settings dev features ───────────────────────────────────────────────────
// Unfinished settings rows (2FA, trusted devices, login history, accent color,
// text size, animations, AI recommendations, experience reminders, message
// notifications, announcements, password change) are hidden from the
// production UI behind this flag. The underlying code is preserved so they
// can be re-enabled in a future release by flipping this to true.
export const SETTINGS_DEV_FEATURES_ENABLED = false;
export function isSettingsDevFeaturesEnabled() { return SETTINGS_DEV_FEATURES_ENABLED; }

// Runtime effective tier — during Founder Access, all users get premium-tier
// access WITHOUT persisted Membership records. This is a runtime computation
// only; no DB writes, no role changes, no persistent flags.
export function launchEffectiveTier() {
  return FOUNDER_ACCESS_ENABLED ? 'premium' : null;
}