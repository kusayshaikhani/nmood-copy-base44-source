// R3 — Pending registration data.
//
// Carries first name, last name, DOB, 18+ confirmation, and terms acceptance
// from the Create Account form to the onboarding flow after OTP verification.
// Stored in sessionStorage with a 30-minute expiry. Cleared on successful
// completion, cancellation, or expiration.
//
// SECURITY: The password is NEVER stored here — only email and profile fields
// that are needed to pre-fill the onboarding form after verification.

const STORAGE_KEY = 'nmood:pending_registration';
const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Save pending registration data to sessionStorage with a 30-minute expiry.
 * @param {Object} data - { email, firstName, lastName, dob, ageConfirmed, termsAccepted }
 */
export function savePendingRegistration(data) {
  const payload = {
    email: data.email || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    dob: data.dob || '',
    ageConfirmed: !!data.ageConfirmed,
    termsAccepted: !!data.termsAccepted,
    _savedAt: Date.now(),
    _expiresAt: Date.now() + EXPIRY_MS,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch { /* storage unavailable */ }
  return payload;
}

/**
 * Read pending registration data. Returns null if missing or expired
 * (expired entries are automatically cleared).
 * @returns {Object|null}
 */
export function getPendingRegistration() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data._expiresAt) return null;
    if (Date.now() > data._expiresAt) {
      clearPendingRegistration();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Clear pending registration data. Called after successful completion,
 * cancellation, or when the user returns to Create Account.
 */
export function clearPendingRegistration() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable */ }
}