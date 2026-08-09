// Data Retention Policy — owner-confirmed schedule (August 2026).
// Single source of truth for retention periods, referenced by the Privacy
// Policy, Account Deletion page, Terms of Service, and deletion UI.

export const RETENTION_POLICY = {
  accounts: {
    label: 'Active Account & Profile Data',
    period: 'While the account is active',
    detail: 'Retained while the account is active and as needed to provide Nmood.',
  },
  deleted_accounts: {
    label: 'Deleted Accounts',
    period: '30-day recovery, then permanent deletion',
    detail: 'Soft-deleted immediately (profile anonymized, data hidden). After a 30-day recovery window, personal data is permanently removed from active systems.',
  },
  backups: {
    label: 'Backups',
    period: 'Within 90 days after final deletion',
    detail: 'Deletion rolls through normal backup cycles within 90 days after final deletion from active systems.',
  },
  audit_logs: {
    label: 'Security, Access & Audit Logs',
    period: '12 months',
    detail: 'Security, access, and audit logs retained for 12 months.',
  },
  support_records: {
    label: 'Customer-Support Records',
    period: '24 months',
    detail: 'Customer-support records retained for 24 months.',
  },
  reports: {
    label: 'Safety Reports & Investigation Records',
    period: 'Up to 36 months',
    detail: 'Retained for up to 36 months when reasonably required for user safety, abuse prevention, dispute handling, or legal obligations.',
  },
  consent_records: {
    label: 'Consent & Legal-Acceptance Records',
    period: '36 months after account closure',
    detail: 'Consent and legal-acceptance records retained for 36 months after account closure.',
  },
  payment_records: {
    label: 'Payment & Tax Records',
    period: 'As required by law / by the payment provider',
    detail: 'Retained only for the applicable legally required period and/or by the responsible payment provider (Apple App Store / Google Play). Nmood does not store payment card details.',
  },
  analytics: {
    label: 'Anonymized & Aggregated Analytics',
    period: 'Indefinitely (anonymized only)',
    detail: 'Anonymized or aggregated analytics may remain only when they can no longer reasonably identify a user.',
  },
};

export const RETENTION_LAST_UPDATED = 'August 2026';