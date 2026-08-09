// Centralized legal configuration — single source of truth for legal entity,
// contact channels, effective dates, document versions, governing law, and
// retention schedule.
//
// All fields below are owner-confirmed (August 2026). No raw TODO text is
// rendered to end users.

// ── Legal entity ──────────────────────────────────────────────────────
// Owner-confirmed: Lazy Panda FZE LLC, Ajman Free Zone, UAE.
// Trade licence number: 2625417982888.
export const LEGAL_ENTITY = {
  name: 'Lazy Panda FZE LLC',
  location: 'Ajman Free Zone, United Arab Emirates',
  registration_number: '2625417982888',
};

// Formatted operator string for display in legal documents.
export const LEGAL_OPERATOR = `${LEGAL_ENTITY.name}, ${LEGAL_ENTITY.location}`;

// ── Governing law & dispute forum ─────────────────────────────────────
export const GOVERNING_LAW = 'the applicable laws and regulations of the United Arab Emirates';
export const DISPUTE_FORUM = 'the competent courts of the United Arab Emirates';

// ── Contact channels ─────────────────────────────────────────────────
// Owner-confirmed active official contact emails.
// Purpose mapping:
//   privacy_requests  → business@nmood.app  (privacy & legal)
//   support_deletion  → support@nmood.app   (support, account deletion, data requests)
//   business_legal    → business@nmood.app  (business & legal)
//   general           → hello@nmood.app     (general enquiries)
export const LEGAL_CONTACTS = {
  general: 'hello@nmood.app',
  support: 'support@nmood.app',
  business: 'business@nmood.app',
};

// Purpose-specific contact addresses for use in legal pages.
export const LEGAL_CONTACT_BY_PURPOSE = {
  privacy_requests: LEGAL_CONTACTS.business,
  support_deletion: LEGAL_CONTACTS.support,
  business_legal: LEGAL_CONTACTS.business,
  general: LEGAL_CONTACTS.general,
};

// ── Internal legal review status ──────────────────────────────────────
// Internal marker — NOT displayed to end users. Indicates that professional
// legal review is recommended when resources permit. No claim of lawyer
// review or guaranteed compliance is made anywhere in the app.
export const LEGAL_REVIEW_STATUS = 'not_reviewed — professional review recommended when resources permit';

// ── Document effective dates ──────────────────────────────────────────
export const LEGAL_DATES = {
  privacy_policy:       { effective: '31 July 2026', updated: '1 August 2026' },
  terms_of_service:     { effective: '31 July 2026', updated: '1 August 2026' },
  community_guidelines: { effective: '31 July 2026', updated: '1 August 2026' },
  safety_center:        { effective: '31 July 2026', updated: '1 August 2026' },
  account_deletion:     { effective: '31 July 2026', updated: '1 August 2026' },
  cookie_notice:        { effective: '31 July 2026', updated: '1 August 2026' },
};

// ── Document versions (for consent tracking) ───────────────────────────
// Synced with src/lib/legal-consent.js. Increment to trigger re-consent.
// Versions are NOT changed in this update — the user-facing substance of
// Terms and Privacy Policy has not materially changed; only citations and
// retention wording were refined to plain language.
export const LEGAL_VERSIONS = {
  terms: 'LP-001-v1.0',
  privacy: 'LP-002-v1.0',
  community_guidelines: 'LP-003-v1.0',
  refund_policy: 'LP-004-v1.0',
  subscription_terms: 'LP-005-v1.0',
  cookie_notice: 'LP-006-v1.0',
  ai_concierge_notice: 'LP-007-v1.0',
};

// ── Public legal page routes ──────────────────────────────────────────
export const PUBLIC_LEGAL_LINKS = [
  { to: '/privacy',             label: 'Privacy Policy' },
  { to: '/terms',               label: 'Terms of Service' },
  { to: '/cookie-notice',       label: 'Cookie Notice' },
  { to: '/community-guidelines', label: 'Community Guidelines' },
  { to: '/safety',              label: 'Safety Center' },
  { to: '/delete-account',     label: 'Account Deletion' },
];