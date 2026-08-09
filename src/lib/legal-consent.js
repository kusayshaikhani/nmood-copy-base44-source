// RC-001A — Legal consent persistence (BUG-002 fix).
//
// Stores Terms + Privacy acceptance timestamps and document versions at the
// moment the user consents (registration). The data is persisted on the Member
// entity when onboarding completes, guaranteeing every new Member carries the
// four required consent fields: terms_accepted_at, terms_version,
// privacy_accepted_at, privacy_version.

import { APP_VERSION } from '@/lib/system-config';

// LP-LEGAL-CENTER — Document versions for consent tracking.
// Each legal document has a stable version string. When a document is
// materially updated, increment its version to trigger re-consent.
export const TERMS_VERSION = 'LP-001-v1.0';
export const PRIVACY_VERSION = 'LP-002-v1.0';
export const COMMUNITY_GUIDELINES_VERSION = 'LP-003-v1.0';
export const REFUND_POLICY_VERSION = 'LP-004-v1.0';
export const SUBSCRIPTION_TERMS_VERSION = 'LP-005-v1.0';
export const COOKIE_NOTICE_VERSION = 'LP-006-v1.0';
export const AI_CONCIERGE_NOTICE_VERSION = 'LP-007-v1.0';
const STORAGE_KEY = 'nmood_legal_consent';

/**
 * Record consent acceptance in localStorage at the moment the user checks the
 * legal consent boxes and submits the registration form. Called before OTP
 * verification — the data is later persisted on the Member entity once
 * onboarding completes.
 */
export function recordConsentAcceptance() {
  const data = {
    terms_accepted_at: new Date().toISOString(),
    terms_version: TERMS_VERSION,
    privacy_accepted_at: new Date().toISOString(),
    privacy_version: PRIVACY_VERSION,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage unavailable */ }
  return data;
}

/**
 * Read the stored consent data (set during registration). Used after OTP
 * verification to sync consent to the User entity via updateMe.
 */
export function getStoredConsent() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

/**
 * Returns consent fields for the Member entity. Uses stored consent from
 * registration if available; falls back to the current timestamp for users
 * who registered via Google/Apple (no consent checkboxes — they accepted via
 * the legal text on the Welcome page).
 */
export function getConsentForMember() {
  const stored = getStoredConsent();
  if (stored) return stored;
  return {
    terms_accepted_at: new Date().toISOString(),
    terms_version: TERMS_VERSION,
    privacy_accepted_at: new Date().toISOString(),
    privacy_version: PRIVACY_VERSION,
  };
}

/** Clear stored consent after the Member entity is created. */
export function clearStoredConsent() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable */ }
}