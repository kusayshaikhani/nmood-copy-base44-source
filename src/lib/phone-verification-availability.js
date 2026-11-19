/**
 * Whether SMS phone verification can actually be offered in this build.
 *
 * Phone verification is backed by the independent Supabase Edge Function
 * `phone-verification`, which talks to Twilio Verify with server-side secrets.
 *
 * The UI must not advertise live SMS until the Edge Function and its rate-limit
 * migration have been deployed, so this stays operator-gated. No SMS is ever
 * sent while this returns false.
 */
export function isPhoneVerificationAvailable() {
  return String(import.meta.env.VITE_PHONE_VERIFICATION_ENABLED || '').toLowerCase() === 'true';
}
