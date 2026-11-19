export function maskVerificationEmail(email) {
  const [local, domain, extra] = String(email || '').trim().split('@');
  if (!local || !domain?.includes('.') || extra) return 'your email address';
  return `${local[0]}***@${domain}`;
}
export const VERIFICATION_ACCEPTED = 'Verification request accepted. Check your inbox and Junk/Spam folder. Delivery may take a few minutes. If already verified, sign in.';
export function verificationFailure(error) {
  const code = String(error?.code || '').toLowerCase();
  const text = String(error?.message || '').toLowerCase(); // Classify only; never render or log server text.
  if (error?.status === 429 || /over_.*rate_limit/.test(code)) return { code: 'RATE_LIMIT', message: 'Too many email requests. Wait for the countdown before trying again.' };
  if (code === 'email_not_confirmed') return { code: 'UNVERIFIED', message: 'This account needs email verification. Resend the link or review the address.' };
  if (['user_already_exists','email_exists'].includes(code) || /already registered|already exists/.test(text)) return { code: 'EXISTING_ACCOUNT', message: 'Sign in to your existing account. If verification is still needed, use Resend verification email.' };
  if (code === 'email_address_invalid' || /invalid email|email.*invalid/.test(text)) return { code: 'INVALID_ADDRESS', message: 'Check the email address and correct its format.' };
  if (['email_provider_disabled','signup_disabled','email_address_not_authorized'].includes(code)) return { code: 'EMAIL_CONFIGURATION', message: 'Email registration is not available for this address right now. Contact support.' };
  if (error?.verificationReason === 'EMAIL_SEND_FAILED' || /sending.*(email|mail)|(smtp|mailer)/.test(text)) return { code: 'EMAIL_SEND_FAILED', message: 'The email service could not send the verification message. Please retry later or contact support.' };
  if (code === 'weak_password') return { code: 'WEAK_PASSWORD', message: 'Choose a stronger password and try again.' };
  return { code: 'REQUEST_FAILED', message: 'The verification request could not be completed. Check your connection and try again.' };
}
export function verificationSignupState(result) {
  const user = result?.user || result;
  if (user?.email_confirmed_at || (Array.isArray(user?.identities) && user.identities.length === 0)) return 'sign_in';
  return 'pending'; // A successful response is not proof of inbox delivery.
}
export function verificationRetrySeconds(error) {
  const seconds = Number(error?.retryAfterSeconds);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
}
