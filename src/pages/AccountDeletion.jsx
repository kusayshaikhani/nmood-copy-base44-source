import React from 'react';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalPageShell, { LegalSection, LegalBulletList, LEGAL_CONTACTS } from '@/components/legal/LegalPageShell';
import { RETENTION_POLICY } from '@/lib/data-retention';
import { LEGAL_DATES } from '@/lib/legal-config';
import { usePageTitle } from '@/lib/usePageTitle';

// Account Deletion — derived from the approved Privacy Policy (LP-002 §12, §13)
// and Terms of Service (LP-001 §15), and the actual in-app Delete Account flow.
// Does not invent new policy; it surfaces what the approved documents and the
// DeleteAccountSheet already state.

const EFFECTIVE_DATE = LEGAL_DATES.account_deletion.effective;
const LAST_UPDATED = LEGAL_DATES.account_deletion.updated;

const toc = [
  { id: 'overview', title: '1. Overview' },
  { id: 'how-to-request', title: '2. How to Request Deletion' },
  { id: 'what-happens', title: '3. What Happens When You Delete' },
  { id: 'data-deleted', title: '4. Data That Is Deleted' },
  { id: 'data-retained', title: '5. Data That Is Retained' },
  { id: 'recovery', title: '6. No Recovery for New Requests' },
  { id: 'contact', title: '7. Contact' },
];

export default function AccountDeletion() {
  usePageTitle('Account Deletion');
  return (
    <LegalPageShell
      icon={Trash2}
      title="Account Deletion"
      docId="LP-002 §12 · LP-001 §15"
      version="1.0"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      toc={toc}
    >
      <LegalSection id="overview" title="1. Overview">
        <p>You can delete your Nmood account at any time. This page explains how to request deletion and what data is deleted or retained, based on our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.</p>
      </LegalSection>

      <LegalSection id="how-to-request" title="2. How to Request Deletion">
        <p><strong>If you can sign in to your account:</strong></p>
        <LegalBulletList items={[
          'Open Settings → Privacy → Delete Account.',
          'Verify with your linked password, Apple or Google method, review the irreversible-deletion notice, and type DELETE to confirm.',
          'Permanent erasure begins immediately and you are signed out. New requests cannot be recovered.',
        ]} />
        <p><strong>If you cannot sign in</strong> (for example, you no longer have access to your email or phone):</p>
        <LegalBulletList items={[
          <>Email us at <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a> from the email address associated with your account, and we will assist you with account deletion after verifying your identity.</>,
        ]} />
      </LegalSection>

      <LegalSection id="what-happens" title="3. What Happens When You Delete">
        <LegalBulletList items={[
          'Your profile is immediately hidden from everyone and removed from discovery.',
          'Login is disabled and you are signed out of all devices.',
          'Pending Pal requests are cancelled automatically.',
          'Your account, profile, associated personal data and owned media are permanently erased, except the disclosed retained records.',
          'Access stays blocked if an external service temporarily delays an erasure step.',
        ]} />
      </LegalSection>

      <LegalSection id="data-deleted" title="4. Data That Is Deleted">
        <p>The following personal data is removed or anonymized when you delete your account:</p>
        <LegalBulletList items={[
          'Display name, first name, last name, and bio.',
          'Email address and phone number.',
          'Date of birth, gender, and nationality.',
          'Profile photo and photo gallery.',
          'Interests, languages, and lifestyle preferences.',
          'Location settings and profile visibility preferences.',
          'AI personalization and analytics consent flags.',
        ]} />
        <p>Permanent deletion, including invalidation of hosted media links, can take up to 60 seconds after server erasure. Copies already downloaded or stored in a browser cache cannot be recalled. If a service fails, deletion remains in progress while we retry.</p>
        <p>Photos and associated media are erased as part of immediate permanent deletion, subject to the retained-record and backup disclosures below.</p>
      </LegalSection>

      <LegalSection id="data-retained" title="5. Data That Is Retained">
        <p>Certain records are retained after account deletion for legal, security, and safety purposes, as described in our Privacy Policy and data retention policy:</p>
        <div className="rounded-xl border border-border overflow-hidden not-prose">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start p-2.5 font-semibold">Record Type</th>
                <th className="text-start p-2.5 font-semibold">Retention Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="p-2.5 font-medium">{RETENTION_POLICY.deleted_accounts.label}</td><td className="p-2.5 text-muted-foreground">{RETENTION_POLICY.deleted_accounts.period} — {RETENTION_POLICY.deleted_accounts.detail}</td></tr>
              <tr><td className="p-2.5 font-medium">{RETENTION_POLICY.backups.label}</td><td className="p-2.5 text-muted-foreground">{RETENTION_POLICY.backups.period} — {RETENTION_POLICY.backups.detail}</td></tr>
              <tr><td className="p-2.5 font-medium">{RETENTION_POLICY.audit_logs.label}</td><td className="p-2.5 text-muted-foreground">{RETENTION_POLICY.audit_logs.period} — {RETENTION_POLICY.audit_logs.detail}</td></tr>
              <tr><td className="p-2.5 font-medium">{RETENTION_POLICY.support_records.label}</td><td className="p-2.5 text-muted-foreground">{RETENTION_POLICY.support_records.period} — {RETENTION_POLICY.support_records.detail}</td></tr>
              <tr><td className="p-2.5 font-medium">{RETENTION_POLICY.reports.label}</td><td className="p-2.5 text-muted-foreground">{RETENTION_POLICY.reports.period} — {RETENTION_POLICY.reports.detail}</td></tr>
              <tr><td className="p-2.5 font-medium">{RETENTION_POLICY.consent_records.label}</td><td className="p-2.5 text-muted-foreground">{RETENTION_POLICY.consent_records.period} — {RETENTION_POLICY.consent_records.detail}</td></tr>
              <tr><td className="p-2.5 font-medium">{RETENTION_POLICY.payment_records.label}</td><td className="p-2.5 text-muted-foreground">{RETENTION_POLICY.payment_records.period} — {RETENTION_POLICY.payment_records.detail}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">These records are retained in an anonymized form where possible and minimized where legally possible; retained records do not permit account recovery.</p>
      </LegalSection>

      <LegalSection id="recovery" title="6. No Recovery for New Requests">
        <p>New confirmed deletion requests have no recovery period. Permanent erasure starts immediately and cannot be undone. If an external service fails, your account remains locked while erasure is retried. A processing status is not confirmation that all erasure steps have finished.</p>
        <p>Requests accepted under the previous recovery policy retain their already-recorded terms. Contact Support about an existing request; signing in never cancels deletion.</p>
      </LegalSection>

      <LegalSection id="contact" title="7. Contact">
        <p>For account deletion requests or questions about your data, contact us:</p>
        <div className="rounded-xl border border-border p-4 space-y-2 not-prose">
          <p className="text-sm text-muted-foreground">Account deletion & data requests: <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a></p>
          <p className="text-sm text-muted-foreground">Privacy & legal: <a href={`mailto:${LEGAL_CONTACTS.business}`} className="text-primary hover:underline">{LEGAL_CONTACTS.business}</a></p>
        </div>
      </LegalSection>
    </LegalPageShell>
  );
}