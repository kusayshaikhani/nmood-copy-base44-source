// EX-003 — Legal & Compliance Verification checklist for Release 1.0.
// Verification only; does not implement legal documents.
// Status keys match store-readiness so the shared readiness components can render items.

export const COMPLIANCE_GROUPS = [
  {
    id: 'documents',
    label: 'Required Documents',
    items: [
      { id: 'privacy_policy', label: 'Privacy Policy', hint: 'Privacy Policy published + linked in-app (/privacy) and at privacy_url.', default: 'completed', owner: 'Founder' },
      { id: 'terms', label: 'Terms of Service', hint: 'Terms of Service drafted + published (terms_url configured; no in-app Terms page yet).', default: 'needsFounder', owner: 'Founder' },
      { id: 'community_guidelines', label: 'Community Guidelines', hint: 'Community Guidelines page live (/community-guidelines).', default: 'completed', owner: 'Founder' },
      { id: 'content_moderation', label: 'Content Moderation Policy', hint: 'Formal moderation policy + escalation rules documented.', default: 'needsFounder', owner: 'Founder' },
      { id: 'reporting_policy', label: 'Reporting Policy', hint: 'Report flow + SafetyReport entity in place; policy text to be published.', default: 'needsFounder', owner: 'Founder' },
    ],
  },
  {
    id: 'data',
    label: 'Data Protection',
    items: [
      { id: 'data_retention', label: 'Data Retention', hint: 'Retention schedule + deletion-on-request process documented.', default: 'needsFounder', owner: 'Founder' },
      { id: 'consent', label: 'Consent', hint: 'Onboarding consent + analytics_consent flag captured per member.', default: 'completed', owner: 'Engineering' },
      { id: 'gdpr', label: 'GDPR Considerations', hint: 'DPA, lawful basis, data subject access / erasure flow.', default: 'needsFounder', owner: 'Founder' },
    ],
  },
  {
    id: 'regional',
    label: 'Regional',
    items: [
      { id: 'uae', label: 'UAE Readiness', hint: 'UAE PDPL compliance + data residency review (founder market).', default: 'needsFounder', owner: 'Founder' },
    ],
  },
  {
    id: 'platform',
    label: 'Platform Compliance',
    items: [
      { id: 'apple', label: 'Apple Compliance', hint: 'App Store Review Guidelines + App Tracking Transparency (ATT) review.', default: 'needsFounder', owner: 'Founder' },
      { id: 'google', label: 'Google Play Compliance', hint: 'Play Developer Policy + Data Safety form + Families policy review.', default: 'needsFounder', owner: 'Founder' },
    ],
  },
];

export const ALL_COMPLIANCE_ITEMS = COMPLIANCE_GROUPS.flatMap((g) => g.items);