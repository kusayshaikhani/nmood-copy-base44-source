import React from 'react';
import { Cookie } from 'lucide-react';
import LegalPageShell, { LegalSection, LegalBulletList, LEGAL_CONTACTS } from '@/components/legal/LegalPageShell';
import { usePageTitle } from '@/lib/usePageTitle';
import { LEGAL_DATES, LEGAL_VERSIONS } from '@/lib/legal-config';
import { STORAGE_CATEGORIES, TRACKERS_NOT_FOUND, THIRD_PARTY_PROCESSORS, DEVICE_PERMISSIONS, CONSENT_VERSION } from '@/lib/consent-config';

// LP-006 — Cookie and Tracking Notice.
// Reflects the actual technologies used by Nmood, based on a full code audit.
// No third-party advertising cookies, no cross-site tracking, no service workers.

const dates = LEGAL_DATES.cookie_notice || { effective: '31 July 2026', updated: '1 August 2026' };

const toc = [
  { id: 'overview', title: '1. Overview' },
  { id: 'what-we-use', title: '2. Technologies We Use' },
  { id: 'local-storage', title: '3. Browser Storage We Use' },
  { id: 'analytics', title: '4. Analytics' },
  { id: 'device-permissions', title: '5. Device Permissions (Not Cookies)' },
  { id: 'third-party', title: '6. Third-Party Processors' },
  { id: 'what-we-dont-use', title: "7. What We Don't Use" },
  { id: 'managing', title: '8. Managing Your Preferences' },
  { id: 'contact', title: '9. Contact' },
];

export default function CookieNotice() {
  usePageTitle('Cookie Notice');
  return (
    <LegalPageShell
      icon={Cookie}
      title="Cookie and Tracking Notice"
      docId="LP-006"
      version={LEGAL_VERSIONS.cookie_notice?.replace('LP-006-', '') || '1.0'}
      effectiveDate={dates.effective}
      lastUpdated={dates.updated}
      toc={toc}
    >
      <LegalSection id="overview" title="1. Overview">
        <p>This Cookie and Tracking Notice explains how Nmood uses cookies, local storage, and similar browser technologies on our website and within the Nmood app (the "Services"). It also describes device permissions that are separate from cookies.</p>
        <p>Nmood is designed to minimize tracking. We do not use third-party advertising cookies, cross-site tracking pixels, behavioral advertising networks, or fingerprinting. The technologies we do use are limited to what is necessary to operate the Services and, with your consent, to improve them.</p>
        <p className="text-xs text-muted-foreground">Consent configuration version: {CONSENT_VERSION}</p>
      </LegalSection>

      <LegalSection id="what-we-use" title="2. Technologies We Use">
        <p>Nmood uses the following categories of browser technologies. Each is classified by its function:</p>
        {STORAGE_CATEGORIES.map((cat) => (
          <div key={cat.id} className="mb-4">
            <p className="font-semibold text-sm mb-1">{cat.name}{cat.consentRequired ? ' (consent-based)' : ''}</p>
            <p className="text-sm text-muted-foreground mb-2">{cat.description}</p>
            <LegalBulletList items={cat.items.map((item) => (
              <><strong>{item.name}:</strong> {item.purpose} <span className="text-muted-foreground">({item.storage})</span></>
            ))} />
          </div>
        ))}
      </LegalSection>

      <LegalSection id="local-storage" title="3. Browser Storage We Use">
        <p>Nmood uses browser local storage and session storage for the following purposes. The app code itself does not set any tracking cookies. Our hosting platform may set HTTP-only authentication cookies that are not accessible to JavaScript and cannot be used for tracking.</p>
        <LegalBulletList items={[
          <><strong>Session management (strictly necessary):</strong> Authentication tokens in local storage keep you signed in between app sessions.</>,
          <><strong>Legal consent (strictly necessary):</strong> Your acceptance of Terms and Privacy Policy versions is recorded locally.</>,
          <><strong>Theme &amp; language (functional):</strong> Your light/dark mode and language choices are remembered locally.</>,
          <><strong>Onboarding state (functional):</strong> Your progress through onboarding is saved so you can resume.</>,
          <><strong>Feature usage (functional):</strong> Your premium feature usage is stored locally for your own insights; it is not transmitted to analytics without your consent.</>,
          <><strong>Image cache (functional):</strong> Profile photos are cached locally to reduce network requests.</>,
        ]} />
        <p>Browser storage data is stored on your device. You can clear it at any time through your browser or device settings, though this will sign you out and reset your preferences.</p>
      </LegalSection>

      <LegalSection id="analytics" title="4. Analytics">
        <p>We separate our logging and analytics into two categories:</p>
        <p><strong>Security and account-operation information (always on):</strong> Minimum information required for login, authentication, security monitoring, fraud prevention, and crash reporting. This is necessary for the safe operation of the platform, cannot be disabled, and is classified as security data — not product analytics. It is never sent to advertising, marketing, or optional analytics systems. No passwords, tokens, message contents, profile contents, or payment details are included. Error reports are redacted before transmission.</p>
        <p><strong>Optional product analytics (consent-based, off by default):</strong> Product usage, feature adoption, and engagement tracking. These are only collected with your explicit consent, which you can grant or withdraw at any time in Settings &rarr; Privacy. Analytics data is limited to event names, categories, and non-identifying properties (such as "Experience Joined" or "Circle Created"). No message content, private profile fields, precise coordinates, authentication tokens, safety reports, or uploaded media are ever included. Refusing or disabling product analytics does not affect registration, login, account use, subscription access, cancellation, or account deletion.</p>
        <p>We do not use third-party analytics SDKs, advertising identifiers for ad targeting, or behavioral profiling for advertising purposes.</p>
      </LegalSection>

      <LegalSection id="device-permissions" title="5. Device Permissions (Not Cookies)">
        <p>The following are OS/browser-level device permissions, not browser cookies. They are requested only when the related feature is invoked, and you can deny any of them without losing access to your account.</p>
        {DEVICE_PERMISSIONS.map((perm) => (
          <div key={perm.id} className="mb-4">
            <p className="font-semibold text-sm mb-1">{perm.name}</p>
            <LegalBulletList items={[
              <><strong>Purpose:</strong> {perm.purpose}</>,
              <><strong>When requested:</strong> {perm.whenRequested}</>,
              <><strong>What is stored:</strong> {perm.storedData}</>,
              <><strong>Manual fallback:</strong> {perm.manualFallback}</>,
            ]} />
          </div>
        ))}
        <p>Granting a device permission is not the same as consenting to analytics or marketing. We do not claim consent for data processing when only a device permission is granted.</p>
      </LegalSection>

      <LegalSection id="third-party" title="6. Third-Party Processors">
        <p>The following third-party services process data on our behalf to operate the Services. They are processors, not controllers — they do not use your data for their own commercial purposes.</p>
        <div className="rounded-xl border border-border overflow-hidden not-prose">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start p-2.5 font-semibold">Processor</th>
                <th className="text-start p-2.5 font-semibold">Purpose</th>
                <th className="text-start p-2.5 font-semibold">Data Shared</th>
                <th className="text-start p-2.5 font-semibold">Linked to Identity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {THIRD_PARTY_PROCESSORS.map((p) => (
                <tr key={p.name}>
                  <td className="p-2.5 font-medium">{p.name}</td>
                  <td className="p-2.5 text-muted-foreground">{p.purpose}</td>
                  <td className="p-2.5 text-muted-foreground">{p.dataShared}</td>
                  <td className="p-2.5 text-muted-foreground">{p.linkedToIdentity ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">We do not sell your personal data to third parties.</p>
      </LegalSection>

      <LegalSection id="what-we-dont-use" title="7. What We Don't Use">
        <p>Based on a full code audit, Nmood does <strong>not</strong> use:</p>
        <LegalBulletList items={TRACKERS_NOT_FOUND.map((item) => item)} />
      </LegalSection>

      <LegalSection id="managing" title="8. Managing Your Preferences">
        <p>You can manage your preferences at any time:</p>
        <LegalBulletList items={[
          'Analytics consent — toggle in Settings → Privacy or during onboarding. Off by default.',
          'AI personalization — toggle in Settings → Privacy.',
          'Location features — toggle in Settings → Privacy; manual city selection always available.',
          'Notification preferences — toggle in Settings or your device settings.',
          'Clear browser storage — through your browser or device settings (this signs you out and resets preferences).',
        ]} />
        <p>Disabling optional product analytics does not affect security and account-operation information, which is required for security and platform integrity. Refusing analytics does not affect your ability to register, log in, use your account, access subscriptions, cancel, or delete your account.</p>
      </LegalSection>

      <LegalSection id="contact" title="9. Contact">
        <p>For questions about cookies, local storage, or tracking technologies, contact us at <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a>.</p>
        <p>For privacy or data protection enquiries, contact us at <a href={`mailto:${LEGAL_CONTACTS.business}`} className="text-primary hover:underline">{LEGAL_CONTACTS.business}</a>.</p>
      </LegalSection>
    </LegalPageShell>
  );
}