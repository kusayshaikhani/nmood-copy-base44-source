// Release-readiness item: Sign in with Apple integration.
//
// STATUS: RELEASE-BLOCKING — must be completed before App Store submission
// if Sign in with Apple is offered to users.
//
// The Sign in with Apple button is present in the UI (Register.jsx,
// Welcome.jsx) and calls base44.auth.loginWithProvider("apple", ...).
// However, the full server-side token-revocation path required for
// Apple compliance and account-deletion compliance is NOT yet implemented.
//
// Required future Apple configuration (complete when Apple Developer
// credentials exist):
//
// 1. App ID / Services ID client identifier
//    - Configure a Services ID (for web) or App ID (for native) in the
//      Apple Developer portal with Sign in with Apple enabled.
//
// 2. Team ID
//    - Apple Developer Team ID (10-character identifier).
//    - Store as a secret: APPLE_TEAM_ID
//
// 3. Sign in with Apple private key
//    - Generate a Sign in with Apple private key (.p8) in the Apple
//      Developer portal.
//    - Store as a secret: APPLE_KEY_ID (the Key ID)
//    - Store the private key contents as a secret: APPLE_PRIVATE_KEY
//    - NEVER hardcode the private key in source code.
//
// 4. Client secret generation
//    - Generate a JWT client_secret signed with the Apple private key,
//      including iss (Team ID), sub (Services ID), aud, iat, exp.
//    - Regenerate before each expiry (max 180 days).
//
// 5. Authorization-code exchange
//    - POST to https://appleid.apple.com/auth/token with grant_type
//      "authorization_code" to exchange the auth code for access and
//      refresh tokens.
//
// 6. Secure refresh-token storage
//    - Store the Apple refresh_token securely on the user record
//      (encrypted at rest) for later revocation.
//    - NEVER log or expose refresh tokens.
//
// 7. Token revocation on account deletion
//    - When a user deletes their account, POST to Apple's
//      https://appleid.apple.com/auth/revoke endpoint with the user's
//      refresh_token to revoke their Sign in with Apple credentials.
//    - Account deletion MUST still succeed if no valid Apple token exists
//      (e.g., user registered via email/Google, or token already expired).
//    - Present accurate handling: if revocation fails, log the error for
//      manual follow-up but do not block deletion.
//
// 8. Credential-revocation handling
//    - Handle Apple's revocation webhook/notifications if configured.
//    - If Apple notifies that a user revoked credentials, sign them out
//      and mark their account for review.
//
// 9. Test coverage
//    - Test: account deletion with a valid Apple refresh token → token
//      revoked, account soft-deleted.
//    - Test: account deletion with no Apple token (email user) → deletion
//      succeeds, no Apple call made.
//    - Test: account deletion with expired Apple token → deletion
//      succeeds, revocation error logged.
//    - Test: Apple revocation webhook → user signed out.
//
// IMPLEMENTATION NOTE:
// Do NOT hardcode Team ID, Key ID, private key, client secret, access
// token, or refresh token anywhere in source code. Use set_secrets to
// declare APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY, then read
// them from the secrets store in the backend function only.
//
// This file is an internal release-readiness marker. It is not imported
// by any user-facing component and contains no user-facing text.
export const APPLE_SIGNIN_READINESS = {
  status: 'release_blocking',
  required_secrets: ['APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
  required_endpoints: [
    'https://appleid.apple.com/auth/token',
    'https://appleid.apple.com/auth/revoke',
  ],
  completed: false,
};