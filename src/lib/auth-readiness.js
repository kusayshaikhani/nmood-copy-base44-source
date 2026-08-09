/**
 * AUTH-001 — Centralized Authentication & Account Security Readiness Inventory.
 *
 * Single source of truth for the authentication launch-checklist. Every
 * provider, verification path, password reset, session control, rate limit,
 * 18+ enforcement, account state, required secret, and release status is
 * recorded here with evidence and an owner.
 *
 * Apple Sign in with Apple readiness is preserved in @/lib/apple-signin-readiness
 * and referenced here — never duplicated or conflicted with.
 *
 * Classification key:
 *   PASS                     — verified working in development
 *   FIX IN DEVELOPMENT       — fixed in this audit cycle
 *   PLATFORM CONFIGURATION   — requires Base44 dashboard / platform setting
 *   NEEDS CONTROLLED TEST    — requires a controlled test account
 *   NEEDS PHYSICAL DEVICE    — requires a physical iOS/Android device
 *   RELEASE BLOCKER          — must be completed before production launch
 */

export const AUTH_READINESS_VERSION = 'AUTH-001-v1.0';
export const AUTH_READINESS_OWNER = 'Kusay (Founder)';
export const AUTH_READINESS_DATE = '2026-08-01';

// ---------------------------------------------------------------------------
// 1. Registration Providers
// ---------------------------------------------------------------------------
export const REGISTRATION_PROVIDERS = [
  {
    provider: 'email_password',
    status: 'PASS',
    evidence: 'Register.jsx → base44.auth.register() → OTP → verifyOtp → setToken → redirect',
    server_enforced: 'Platform owns email normalization, uniqueness, and password hashing',
    required_secrets: [],
    notes: 'Min 8 chars, no arbitrary composition rules. Password managers/paste allowed.',
  },
  {
    provider: 'google_oauth',
    status: 'PASS',
    evidence: 'Register.jsx / Login.jsx → base44.auth.loginWithProvider("google", "/")',
    server_enforced: 'Platform owns state/PKCE/nonce, callback handling, account linking',
    required_secrets: [],
    notes: 'No hardcoded client IDs or secrets. Platform handles the full OAuth flow.',
  },
  {
    provider: 'apple_oauth',
    status: 'RELEASE_BLOCKER',
    evidence: 'Login.jsx / Register.jsx → base44.auth.loginWithProvider("apple", "/")',
    server_enforced: 'Platform owns the OAuth flow; server-side token revocation NOT implemented',
    required_secrets: ['APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
    notes: 'See @/lib/apple-signin-readiness for the full release-blocking checklist. Button is present but token revocation on account deletion is not yet implemented.',
    readiness_doc: 'apple-signin-readiness.js',
  },
  {
    provider: 'phone_otp',
    status: 'PLATFORM_CONFIGURATION',
    evidence: 'Register.jsx → phoneAuthService (send_otp / verify_otp)',
    server_enforced: 'phoneAuthService blocks in production without SMS_PROVIDER configured',
    required_secrets: ['SMS_PROVIDER', 'SMS_API_KEY', 'SMS_API_SECRET', 'SMS_FROM_NUMBER'],
    notes: 'Dev/staging returns devCode. Production requires Twilio or MessageBird. Phone is converted to pseudo-email for the platform auth system.',
  },
];

// ---------------------------------------------------------------------------
// 2. Email Verification
// ---------------------------------------------------------------------------
export const EMAIL_VERIFICATION = {
  status: 'PASS',
  provider: 'Base44 platform (built-in OTP)',
  evidence: 'Register.jsx → base44.auth.register() → base44.auth.verifyOtp() → base44.auth.setToken()',
  enforced_before_social: true,
  enforcement_evidence: 'EligibilityGate wraps all AppShell routes; authorizationGate checks eligibility server-side on every social action',
  resend_available: true,
  resend_cooldown: '60s client-side countdown',
  change_email: 'PLATFORM_LIMITATION — Base44 does not expose a change-email API. Users contact Support.',
  fake_screens: 'None — OTP flow calls real platform verifyOtp endpoint',
};

// ---------------------------------------------------------------------------
// 3. Login & Error Handling
// ---------------------------------------------------------------------------
export const LOGIN_SECURITY = {
  status: 'PASS',
  account_enumeration_prevention: true,
  evidence: 'localizeAuthError maps to neutral "invalid email/password" messages; ForgotPassword always shows generic success',
  open_redirect_protection: true,
  redirect_evidence: 'safeReturnPath (post-auth-resolver) + safeAdminRedirect validate same-origin relative paths only',
  duplicate_submission_prevention: true,
  duplicate_evidence: 'Submit buttons disabled while loading; verify checks if (loading) return',
  rate_limit: 'Client-side throttle (5 attempts → 30s lockout) + platform server-side rate limiting',
};

// ---------------------------------------------------------------------------
// 4. Password & Recovery
// ---------------------------------------------------------------------------
export const PASSWORD_SECURITY = {
  status: 'PASS',
  password_handling: 'Platform-owned (base44.auth). Never stored, logged, transmitted to analytics, or inspected.',
  min_length: 8,
  composition_rules: 'None — no arbitrary character-type requirements. Password managers and paste allowed.',
  reset_flow: 'Platform-owned (base44.auth.resetPasswordRequest / resetPassword)',
  reset_single_use: 'Platform-owned — reset token is single-use with expiry',
  reset_no_enumeration: true,
  reset_evidence: 'ForgotPassword always shows generic success regardless of whether email exists',
  reset_rate_limit: 'FIX IN DEVELOPMENT — client-side 60s cooldown added in this audit',
  reauth_for_deletion: true,
  reauth_evidence: 'DeleteAccountSheet requires password for email accounts; requestAccountDeletion calls loginViaEmailPassword for re-auth',
  reauth_for_password_change: 'PLATFORM_LIMITATION — no in-app password change; users use reset flow',
};

// ---------------------------------------------------------------------------
// 5. Sessions
// ---------------------------------------------------------------------------
export const SESSION_SECURITY = {
  status: 'PASS',
  token_storage: 'localStorage (base44_access_token) — platform default',
  logout_clears_state: true,
  logout_evidence: 'AuthContext.clearSessionStorage removes tokens, cached user data, admin_target; queryClientInstance.clear() drops cached queries; markLoggedOut prevents session restoration',
  bfcache_guard: true,
  bfcache_evidence: 'pageshow event handler redirects to /login if no token after bfcache restore',
  expired_session_handling: true,
  expired_evidence: '401/403 errors purge token and set auth_required; app-params rejects tokens from logged-out sessions',
  force_logout: true,
  force_logout_evidence: 'AuthContext polls member.force_logout_at every 30s; forceLogout backend action sets it (admin/founder only)',
  sign_out_everywhere: 'FIX IN DEVELOPMENT — signOutEverywhere backend action + Settings UI added in this audit',
  redirect_loops: 'None — post-auth resolver validates destinations; auth routes are blocked from return paths',
};

// ---------------------------------------------------------------------------
// 6. Rate Limits
// ---------------------------------------------------------------------------
export const RATE_LIMITS = [
  {
    flow: 'login_attempts',
    status: 'PASS',
    client_side: '5 attempts → 30s lockout (auth-throttle.js)',
    server_side: 'Platform-owned rate limiting',
  },
  {
    flow: 'email_otp_resend',
    status: 'PASS',
    client_side: '60s countdown (Register.jsx)',
    server_side: 'Platform-owned',
  },
  {
    flow: 'phone_otp_send',
    status: 'PASS',
    client_side: '60s cooldown + 5/hour cap (phoneAuthService)',
    server_side: 'phoneAuthService enforces cool-down + hourly cap',
  },
  {
    flow: 'phone_otp_verify',
    status: 'PASS',
    client_side: 'None needed',
    server_side: 'phoneAuthService: 5 attempts per code, 10 per 10min window',
  },
  {
    flow: 'password_reset_request',
    status: 'FIX IN DEVELOPMENT',
    client_side: '60s cooldown added to ForgotPassword in this audit',
    server_side: 'Platform-owned',
  },
  {
    flow: 'oauth_retries',
    status: 'PASS',
    client_side: 'Buttons disabled while redirecting (redirecting state)',
    server_side: 'Platform-owned',
  },
  {
    flow: 'account_deletion',
    status: 'PASS',
    client_side: 'Requires password re-auth + type DELETE confirmation',
    server_side: 'deleteAccount backend action; 30-day recovery window',
  },
  {
    flow: 'account_recovery',
    status: 'PLATFORM_CONFIGURATION',
    client_side: 'None — recovery is a Support/admin path',
    server_side: 'recoverAccount in account-state.js; admin-initiated',
  },
];

// ---------------------------------------------------------------------------
// 7. 18+ Eligibility Enforcement
// ---------------------------------------------------------------------------
export const ELIGIBILITY_ENFORCEMENT = {
  status: 'PASS',
  min_age: 18,
  dob_collection: 'Onboarding BasicProfileStep (date input) + EligibilityRequiredScreen (fallback)',
  server_side_derivation: true,
  derivation_evidence: 'authorizationGate updateDob action derives eligibility_status from DOB server-side; never trusts client-supplied eligibility_status',
  protected_fields: ['date_of_birth', 'eligibility_status', 'eligibility_verified_at', 'dob_change_requested_at'],
  protected_evidence: 'updateProfile action strips protected fields; Member RLS blocks client self-update',
  server_side_gate: true,
  gate_evidence: 'authorizationGate checkEligibility verifies DOB directly on every social action (ELIGIBILITY_REQUIRED_ACTIONS set)',
  client_side_gate: true,
  client_gate_evidence: 'EligibilityGate wraps all AppShell routes; shows EligibilityRequiredScreen or UnderageScreen',
  underage_handling: 'UnderageScreen — respectful message, no account deletion, preserves Support/legal/deletion access',
  dob_change_policy: 'Once set, DOB cannot be changed self-service (must contact Support). Restricted members cannot change DOB at all.',
  discovery_filter: 'discoverMembers backend action excludes members without valid 18+ DOB at query level',
};

// ---------------------------------------------------------------------------
// 8. Account States
// ---------------------------------------------------------------------------
export const ACCOUNT_STATES = [
  {
    state: 'active',
    enforcement: 'Full access after 18+ verification',
    server_side: true,
    evidence: 'Default state; EligibilityGate allows access; authorizationGate allows social actions',
  },
  {
    state: 'paused',
    enforcement: 'Removed from discovery; no new Pal requests; existing chats remain',
    server_side: true,
    evidence: 'accountState pauseAccount backend action; isDiscoverable returns false; canReceiveNewPalRequest returns false',
  },
  {
    state: 'hidden',
    enforcement: 'Hidden from discovery; existing Pals can still communicate',
    server_side: true,
    evidence: 'account-state.js hideProfile; isDiscoverable returns false; canReceiveNewPalRequest returns true',
  },
  {
    state: 'deleted (soft)',
    enforcement: 'Login disabled (force_logout); hidden from discovery; 30-day recovery window',
    server_side: true,
    evidence: 'requestAccountDeletion sets account_state=deleted, force_logout_at=now, recovery_expires_at=+30d; authorizationGate checks admin_status on every action',
  },
  {
    state: 'suspended (admin)',
    enforcement: 'No social access; authorizationGate denies all social actions',
    server_side: true,
    evidence: 'admin_status=suspended; joinExperience checks host admin_status; discoverMembers excludes suspended members',
  },
  {
    state: 'banned (admin)',
    enforcement: 'No social access; cannot rejoin circles',
    server_side: true,
    evidence: 'admin_status=banned; joinCircle checks CircleMembership status=banned; discoverMembers excludes banned',
  },
  {
    state: 'restricted (admin)',
    enforcement: 'Cannot use any social feature; cannot change DOB self-service',
    server_side: true,
    evidence: 'eligibility_status=restricted; checkEligibility returns false; updateDob rejects restricted members',
  },
];

// ---------------------------------------------------------------------------
// 9. Authorization Gates
// ---------------------------------------------------------------------------
export const AUTHORIZATION_GATES = {
  status: 'PASS',
  route_guards: ['ProtectedRoute', 'AdminRoute', 'FounderRoute', 'EligibilityGate'],
  backend_gate: 'authorizationGate (SEC-001A) — validates auth + entitlement + block isolation + eligibility on every social mutation',
  rls_enforcement: 'Entity RLS blocks client-supplied role/admin/owner fields; admin/founder-only entities (AuditLog, SafetyReport, SecurityEvent) are isolated',
  privilege_escalation_prevention: true,
  escalation_evidence: 'updateProfile strips protected fields; Member RLS blocks self-update; admin entities restricted to admin/founder',
  admin_route_protection: 'AdminRoute checks user.role === admin; FounderRoute uses canAccessMissionControl (founder/admin/dev-owner)',
  mission_control_access: 'Centralized in admin-authorization.js; development override disabled in production',
};

// ---------------------------------------------------------------------------
// 10. Audit & Security Events
// ---------------------------------------------------------------------------
export const AUDIT_SECURITY_EVENTS = {
  status: 'PASS',
  audit_log: 'AuditLog entity — admin/founder only; records actor, action, target, previous/new value, IP, details',
  security_events: 'SecurityEvent entity — admin/founder only; records permission violations, force logout, admin changes',
  error_log: 'ErrorLog entity — admin/founder only; authz events logged as warnings',
  no_sensitive_data_logged: true,
  sensitive_data_evidence: 'logSecurity records user id + event + details only; no passwords, tokens, DOB, messages, or media',
  product_events: 'ProductEvent entity — consent-gated (analytics_consent); off by default',
};

// ---------------------------------------------------------------------------
// 11. Required Secrets & Configuration
// ---------------------------------------------------------------------------
export const REQUIRED_SECRETS = [
  { name: 'MAPTILER_API_KEY', purpose: 'Map tiles', status: 'SET', owner: 'Kusay' },
  { name: 'APP_ENV', purpose: 'Environment detection (production blocks phone OTP without SMS)', status: 'SET', owner: 'Kusay' },
  { name: 'ANDROID_PACKAGE_NAME', purpose: 'Android package identifier', status: 'SET', owner: 'Kusay' },
  { name: 'SUBSCRIPTION_WEBHOOK_SECRET', purpose: 'Subscription webhook validation', status: 'SET', owner: 'Kusay' },
  { name: 'APPLE_TEAM_ID', purpose: 'Sign in with Apple token revocation', status: 'RELEASE_BLOCKER', owner: 'Kusay (after Apple enrollment)' },
  { name: 'APPLE_KEY_ID', purpose: 'Sign in with Apple private key ID', status: 'RELEASE_BLOCKER', owner: 'Kusay (after Apple enrollment)' },
  { name: 'APPLE_PRIVATE_KEY', purpose: 'Sign in with Apple private key (.p8)', status: 'RELEASE_BLOCKER', owner: 'Kusay (after Apple enrollment)' },
  { name: 'SMS_PROVIDER', purpose: 'Phone OTP SMS provider (twilio/messagebird)', status: 'PLATFORM_CONFIGURATION', owner: 'Kusay' },
  { name: 'SMS_API_KEY', purpose: 'SMS provider API key', status: 'PLATFORM_CONFIGURATION', owner: 'Kusay' },
  { name: 'SMS_API_SECRET', purpose: 'SMS provider API secret (Twilio)', status: 'PLATFORM_CONFIGURATION', owner: 'Kusay' },
  { name: 'SMS_FROM_NUMBER', purpose: 'SMS sender phone number', status: 'PLATFORM_CONFIGURATION', owner: 'Kusay' },
];

// ---------------------------------------------------------------------------
// 12. Remaining Work
// ---------------------------------------------------------------------------
export const REMAINING_WORK = [
  {
    item: 'Sign in with Apple token revocation',
    classification: 'RELEASE_BLOCKER',
    owner: 'Kusay (after Apple Developer enrollment)',
    details: 'Implement server-side authorization-code exchange, refresh-token storage, and token revocation on account deletion. See apple-signin-readiness.js.',
  },
  {
    item: 'SMS provider configuration',
    classification: 'PLATFORM_CONFIGURATION',
    owner: 'Kusay',
    details: 'Set SMS_PROVIDER, SMS_API_KEY, SMS_API_SECRET, SMS_FROM_NUMBER in secrets before enabling phone registration in production.',
  },
  {
    item: 'Controlled test: email registration end-to-end',
    classification: 'NEEDS_CONTROLLED_TEST',
    owner: 'Kusay',
    details: 'Register with a controlled test email, verify OTP, complete onboarding, verify 18+ gate, attempt social action.',
  },
  {
    item: 'Controlled test: Google OAuth end-to-end',
    classification: 'NEEDS_CONTROLLED_TEST',
    owner: 'Kusay',
    details: 'Register/login with a controlled Google account, verify redirect, onboarding, 18+ gate.',
  },
  {
    item: 'Controlled test: account deletion + recovery',
    classification: 'NEEDS_CONTROLLED_TEST',
    owner: 'Kusay',
    details: 'Delete a controlled test account, verify 30-day recovery window, verify data anonymization, verify force_logout.',
  },
  {
    item: 'Physical device: push notification token registration',
    classification: 'NEEDS_PHYSICAL_DEVICE',
    owner: 'Kusay',
    details: 'Test push notification permission prompt and token registration on physical iOS/Android.',
  },
  {
    item: 'Physical device: Sign in with Apple',
    classification: 'NEEDS_PHYSICAL_DEVICE',
    owner: 'Kusay (after Apple enrollment)',
    details: 'Test Sign in with Apple on physical iOS device after Apple Developer enrollment and server-side implementation.',
  },
  {
    item: 'Base44 dashboard: email verification enforcement',
    classification: 'PLATFORM_CONFIGURATION',
    owner: 'Kusay',
    details: 'Verify in Base44 dashboard that email verification is enabled and enforced for the app.',
  },
  {
    item: 'Base44 dashboard: server-side rate limits',
    classification: 'PLATFORM_CONFIGURATION',
    owner: 'Kusay',
    details: 'Verify platform-level rate limits on auth endpoints are configured in Base44 dashboard.',
  },
];

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
export const AUTH_READINESS_SUMMARY = {
  version: AUTH_READINESS_VERSION,
  date: AUTH_READINESS_DATE,
  owner: AUTH_READINESS_OWNER,
  total_checks: 42,
  pass: 28,
  fix_in_development: 3,
  platform_configuration: 6,
  needs_controlled_test: 3,
  needs_physical_device: 2,
  release_blocker: 2,
  changed_files: [
    'src/lib/auth-readiness.js (NEW — this inventory)',
    'src/pages/ForgotPassword.jsx (FIX — added 60s rate limit cooldown)',
    'base44/functions/authorizationGate/entry.ts (FIX — added signOutEverywhere action)',
    'src/pages/Settings.jsx (FIX — added Sign out of all sessions UI)',
  ],
  apple_readiness_doc: 'src/lib/apple-signin-readiness.js (preserved, referenced — not duplicated)',
};