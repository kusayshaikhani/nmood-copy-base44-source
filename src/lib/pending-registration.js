// R3 — Pending registration data.
//
// Carries first name, last name, DOB, 18+ confirmation, and terms acceptance
// from the Create Account form to the onboarding flow after OTP verification.
// Profile fields stay in sessionStorage for 30 minutes. Only the normalized email
// is also kept in localStorage for 24 hours so verification resend survives an iOS
// relaunch. Both are cleared on successful
// completion, cancellation, or expiration.
//
// SECURITY: The password is NEVER stored here — only email and profile fields
// that are needed to pre-fill the onboarding form after verification.

const STORAGE_KEY = 'nmood:pending_registration';
const VERIFICATION_EMAIL_KEY = 'nmood:pending_verification_email';
const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const VERIFICATION_EMAIL_EXPIRY_MS = 24 * 60 * 60 * 1000; // survives an iOS relaunch

/**
 * Save pending registration data to sessionStorage with a 30-minute expiry.
 * @param {Object} data - { email, firstName, lastName, dob, ageConfirmed, termsAccepted }
 */
export function savePendingVerificationEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return '';
  try {
    localStorage.setItem(VERIFICATION_EMAIL_KEY, JSON.stringify({
      email: normalizedEmail,
      expiresAt: Date.now() + VERIFICATION_EMAIL_EXPIRY_MS,
    }));
  } catch { /* storage unavailable */ }
  return normalizedEmail;
}

export function getPendingVerificationEmail() {
  try {
    const value = JSON.parse(localStorage.getItem(VERIFICATION_EMAIL_KEY) || 'null');
    if (!value?.email || !value?.expiresAt || Date.now() > value.expiresAt) {
      localStorage.removeItem(VERIFICATION_EMAIL_KEY);
      return '';
    }
    return String(value.email).trim().toLowerCase();
  } catch {
    return '';
  }
}

// Used only when a person corrects a mistyped address before verification.
// Keep the non-sensitive draft so they do not have to re-enter their details.
export function clearPendingVerificationEmail() {
  try { localStorage.removeItem(VERIFICATION_EMAIL_KEY); } catch { /* storage unavailable */ }
}

export function savePendingRegistration(data) {
  savePendingVerificationEmail(data.email);
  const payload = {
    email: data.email || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    displayName: data.displayName || '',
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
      sessionStorage.removeItem(STORAGE_KEY);
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
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
  clearPendingVerificationEmail();
}
