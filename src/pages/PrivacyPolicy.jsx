import React from 'react';
import { Shield } from 'lucide-react';
import LegalPageShell, { LegalSection, LegalBulletList, LEGAL_CONTACTS, LEGAL_OPERATOR } from '@/components/legal/LegalPageShell';
import { RETENTION_POLICY, RETENTION_LAST_UPDATED } from '@/lib/data-retention';
import { LEGAL_DATES } from '@/lib/legal-config';
import { usePageTitle } from '@/lib/usePageTitle';

// LP-002 — Privacy Policy.
// Reflects actual data collection, actual privacy controls, actual third-party
// processors, 18+ age, no data selling, no E2E encryption claim.

const EFFECTIVE_DATE = LEGAL_DATES.privacy_policy.effective;
const LAST_UPDATED = LEGAL_DATES.privacy_policy.updated;

const toc = [
  { id: 'overview', title: '1. Overview' },
  { id: 'data-collected', title: '2. Data We Collect' },
  { id: 'why', title: '3. Why We Collect Your Data' },
  { id: 'legal-basis', title: '4. Legal Basis' },
  { id: 'ai-usage', title: '5. AI Usage' },
  { id: 'location', title: '6. Location' },
  { id: 'analytics', title: '7. Analytics & Cookies' },
  { id: 'retention', title: '8. Data Retention' },
  { id: 'third-parties', title: '9. Third-Party Processors' },
  { id: 'security', title: '10. Security' },
  { id: 'transfers', title: '11. International Transfers' },
  { id: 'rights', title: '12. Your Rights' },
  { id: 'controls', title: '13. Privacy Controls' },
  { id: 'minors', title: '14. Minors' },
  { id: 'contact', title: '15. Contact' },
];

export default function PrivacyPolicy() {
  usePageTitle('Privacy Policy');
  return (
    <LegalPageShell
      icon={Shield}
      title="Privacy Policy"
      docId="LP-002"
      version="1.0"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      toc={toc}
    >
      <LegalSection id="overview" title="1. Overview">
        <p>Nmood ("we", "us") is an AI-powered social platform that helps people build meaningful connections, discover social experiences, and grow emotionally. The Service is operated by {LEGAL_OPERATOR}.</p>
        <p>This Privacy Policy explains what data we collect, why we collect it, how we use it, and the rights you have over your data. We are committed to transparency and to minimizing the data we collect.</p>
      </LegalSection>

      <LegalSection id="data-collected" title="2. Data We Collect">
        <p>We collect the following categories of personal data:</p>
        <LegalBulletList items={[
          <><strong>Account data:</strong> Email address, phone number (optional), password (hashed), and authentication tokens.</>,
          <><strong>Profile data:</strong> Display name, first name, last name, gender, bio, profile photo, photo gallery, interests, languages, lifestyle, nationality, and location (city and country only — never precise GPS coordinates).</>,
          <><strong>Date of birth (private):</strong> Used to verify eligibility and, only when the member enables Show Age, to calculate a derived age for display. The complete date of birth remains private — it is never displayed on your profile, shared with other members, sent to AI, or included in analytics.</>,
          <><strong>Connection data:</strong> Your connections ("Pals"), Circle memberships, and Experience attendance records.</>,
          <><strong>Message data:</strong> Experience chat messages, Circle chat messages, and private direct messages you send or receive.</>,
          <><strong>Concierge data:</strong> AI Concierge conversations, recommendations, and feedback (thumbs up/down).</>,
          <><strong>Usage data:</strong> Feature interactions, app events, and preferences — only with your consent for optional analytics.</>,
          <><strong>Device data:</strong> Platform type (iOS/Android/Web), app version, and crash reports — used solely for diagnostics.</>,
          <><strong>Location data:</strong> City-level location derived from GPS or IP address. Precise coordinates are never stored.</>,
        ]} />
      </LegalSection>

      <LegalSection id="why" title="3. Why We Collect Your Data">
        <p>We process your data for the following purposes:</p>
        <LegalBulletList items={[
          'To create and manage your account and authenticate you.',
          'To verify you are at least 18 years old (using your date of birth, which is kept private and never shared). A derived age may be calculated for display only when you enable Show Age.',
          'To build and display your profile to other members (per your visibility settings).',
          'To recommend nearby people, Circles, and Experiences based on your interests and location.',
          'To facilitate communication between members (chats, messages, invitations).',
          'To provide AI-powered features (Concierge, recommendations).',
          'To ensure platform safety, detect abuse, and resolve disputes.',
          'To process Premium subscriptions and validate receipts.',
          'To improve our services (with optional analytics consent only).',
        ]} />
      </LegalSection>

      <LegalSection id="legal-basis" title="4. Legal Basis for Processing">
        <p>We process your personal data based on the following grounds:</p>
        <LegalBulletList items={[
          <><strong>Consent:</strong> You agree to this policy when creating an account and when enabling optional features (analytics, AI personalization).</>,
          <><strong>Contract:</strong> Processing is necessary to provide the Nmood service you registered for.</>,
          <><strong>Legal obligation:</strong> We retain certain records (audit logs, safety reports) as required by applicable law.</>,
          <><strong>Legitimate interest:</strong> We process data for platform security, fraud prevention, and abuse detection.</>,
        ]} />
        <p>Where you are located in a jurisdiction with specific data protection laws (such as the UAE Personal Data Protection Law or the EU General Data Protection Regulation), we process your data based on your consent and the necessity of providing the service you requested.</p>
      </LegalSection>

      <LegalSection id="ai-usage" title="5. AI Usage & Transparency">
        <p>Nmood uses artificial intelligence to provide personalized recommendations and conversational assistance via the AI Concierge. For full details, see our AI Concierge Notice (LP-007).</p>
        <LegalBulletList items={[
          'AI processes your profile data, interests, and activity to suggest relevant Circles, Experiences, and members.',
          'AI-generated inspirational recommendations are clearly labeled and are not verified live listings.',
          'AI conversation context is retained for your session continuity and can be deleted at any time.',
          'You can disable AI personalization in Settings &rarr; Privacy.',
          'AI suggestions are advisory only and do not constitute professional advice.',
        ]} />
      </LegalSection>

      <LegalSection id="location" title="6. Location Usage">
        <p>We use your device's GPS or your network IP address to automatically determine your approximate city and country. This helps us recommend nearby people, Circles, and Experiences.</p>
        <LegalBulletList items={[
          'We only store city-level location on your profile — never precise GPS coordinates.',
          'If GPS permission is denied, we use approximate IP-based location as a fallback.',
          'We never repeatedly ask for GPS permission after it is denied.',
          'You can manually change your location at any time in Settings &rarr; Profile.',
          'You can disable location features in Settings &rarr; Privacy.',
        ]} />
      </LegalSection>

      <LegalSection id="analytics" title="7. Analytics & Cookies">
        <p>We separate analytics into two categories:</p>
        <LegalBulletList items={[
          <><strong>Essential analytics (always on):</strong> Login events, authentication, security monitoring, fraud detection, crash reporting, and performance diagnostics. These are necessary for the safe operation of the platform and cannot be disabled.</>,
          <><strong>Optional analytics (consent-based):</strong> Product analytics, usage analytics, feature usage, and engagement tracking. These are only collected with your explicit consent and can be toggled in Settings &rarr; Privacy or during onboarding.</>,
        ]} />
        <p>Nmood does not use third-party advertising cookies. We use local storage for session management, theme preference, and language selection only. For full details, see our Cookie Notice (LP-006).</p>
        <p>Analytics data is aggregated and anonymized — no message content, profile data, or personally identifiable information is ever attached to analytics events.</p>
      </LegalSection>

      <LegalSection id="retention" title="8. Data Retention">
        <p>We retain personal data only as long as necessary for the purposes described in this policy. Retention periods are defined below:</p>
        <div className="rounded-xl border border-border overflow-hidden not-prose">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start p-2.5 font-semibold">Data Type</th>
                <th className="text-start p-2.5 font-semibold">Retention Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(RETENTION_POLICY).map(([key, val]) => (
                <tr key={key}>
                  <td className="p-2.5 font-medium">{val.label}</td>
                  <td className="p-2.5 text-muted-foreground">{val.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">Retention policy last updated: {RETENTION_LAST_UPDATED}</p>
      </LegalSection>

      <LegalSection id="third-parties" title="9. Third-Party Processors">
        <p>We use the following third-party services to operate Nmood. These providers process data on our behalf as service providers — they do not use your data for their own commercial purposes, and we do not sell your data to any of them.</p>
        <LegalBulletList items={[
          <><strong>Base44</strong> — Backend infrastructure, database, authentication, and hosting.</>,
          <><strong>BigDataCloud</strong> — Reverse geocoding (converting coordinates to city names). No data stored.</>,
          <><strong>ipwho.is</strong> — IP-based approximate location (fallback when GPS is unavailable). No data stored.</>,
          <><strong>AI providers</strong> — LLM inference for Concierge features. Conversation context sent for processing.</>,
          <><strong>Apple App Store / Google Play</strong> — Subscription billing and receipt validation. We do not process or store your payment card details.</>,
        ]} />
        <p><strong>We do not sell your personal data to any third party.</strong> Our service providers process data only to operate the Services on our behalf.</p>
      </LegalSection>

      <LegalSection id="security" title="10. Security">
        <p>We implement industry-standard security measures to protect your data:</p>
        <LegalBulletList items={[
          'All data in transit is encrypted via TLS/SSL.',
          'Passwords are hashed using industry-standard algorithms.',
          'Authentication tokens are stored securely and invalidated on logout.',
          'Error reports redact all sensitive information (passwords, tokens, secrets) before logging.',
          'Access to personal data is restricted to authorized personnel and logged via audit trails.',
          'We conduct regular security assessments and monitor for suspicious activity.',
        ]} />
        <p>Note: Messages are not end-to-end encrypted. Do not share highly sensitive information through the messaging feature.</p>
      </LegalSection>

      <LegalSection id="transfers" title="11. International Data Transfers">
        <p>Your data may be processed by our third-party providers in countries outside your country of residence. We ensure appropriate safeguards are in place, including:</p>
        <LegalBulletList items={[
          'Data Processing Agreements with all providers.',
          'Transfer of personal data only where adequate protection levels are ensured.',
          'Compliance with applicable cross-border data transfer requirements under the laws of the United Arab Emirates and other jurisdictions where you are located.',
        ]} />
      </LegalSection>

      <LegalSection id="rights" title="12. Your Rights">
        <p>Depending on where you are located, you may have the following rights over your personal data under applicable data protection laws:</p>
        <LegalBulletList items={[
          <><strong>Right of access:</strong> Request a copy of your personal data (use "Export My Data" in Privacy settings).</>,
          <><strong>Right to rectification:</strong> Correct inaccurate or incomplete data in your profile settings.</>,
          <><strong>Right to erasure:</strong> Delete your account and associated personal data (use "Delete Account" in Privacy settings).</>,
          <><strong>Right to data portability:</strong> Receive your data in a structured, machine-readable format (JSON export).</>,
          <><strong>Right to restrict processing:</strong> Limit how we process your data.</>,
          <><strong>Right to object:</strong> Object to processing based on legitimate interests.</>,
          <><strong>Right to withdraw consent:</strong> Withdraw consent for optional analytics and AI personalization at any time in Settings.</>,
          <><strong>Right to lodge a complaint:</strong> Contact your local data protection authority.</>,
        ]} />
        <p>To exercise any of these rights, contact us at {LEGAL_CONTACTS.support}.</p>
      </LegalSection>

      <LegalSection id="controls" title="13. Privacy Controls">
        <p>Nmood provides the following privacy controls, all accessible in Settings &rarr; Privacy:</p>
        <LegalBulletList items={[
          <><strong>Profile visibility:</strong> Set your profile to public, connections only, or private.</>,
          <><strong>Location visibility:</strong> Enable or disable location-based discovery. City-level only — precise coordinates are never stored.</>,
          <><strong>Nationality:</strong> Your nationality is a self-selected field, independent from your location. It is never auto-inferred.</>,
          <><strong>Blocks and reports:</strong> Block any member (bidirectional) or report any content/behavior. View your block list and report history in Settings &rarr; Safety.</>,
          <><strong>AI conversation history:</strong> Delete individual Concierge conversations or clear your entire Concierge history at any time.</>,
          <><strong>Notification preferences:</strong> Toggle push notifications and email notifications independently.</>,
          <><strong>Analytics consent:</strong> Toggle optional product analytics on or off.</>,
          <><strong>AI personalization:</strong> Toggle AI personalization on or off.</>,
          <><strong>Data access requests:</strong> Export your data in JSON format through "Export My Data".</>,
          <><strong>Account deletion:</strong> Delete your account through "Delete Account" with a 30-day recovery window.</>,
        ]} />
      </LegalSection>

      <LegalSection id="minors" title="14. Minors">
        <p>Nmood is not directed to minors. You must be at least 18 years of age (Gregorian) to use the Service. We do not knowingly collect personal data from anyone under 18.</p>
        <LegalBulletList items={[
          'Age verification is enforced during registration and onboarding by collecting your complete date of birth.',
          'Your date of birth is kept private — it is never displayed on your profile, shared with other members, sent to AI, or included in analytics.',
          'If your date of birth indicates you are under 18, your account is placed in limited access mode. You can correct an incorrectly entered date of birth, contact Support, review our policies, or delete your account. The account is not automatically deleted.',
          'If we later discover through reports or other means that a user is under 18, we may restrict or terminate their account immediately.',
          'We take reports of child safety extremely seriously and cooperate fully with law enforcement.',
          'Confirmed offenders are permanently banned and reported to authorities.',
        ]} />
        <p>If you believe a child is at risk, contact us immediately at {LEGAL_CONTACTS.support}.</p>
      </LegalSection>

      <LegalSection id="contact" title="15. Contact Information">
        <p>If you have questions about this Privacy Policy or your personal data, contact us:</p>
        <div className="rounded-xl border border-border p-4 space-y-2 not-prose">
          <p className="text-sm text-muted-foreground">Privacy & legal requests: <a href={`mailto:${LEGAL_CONTACTS.business}`} className="text-primary hover:underline">{LEGAL_CONTACTS.business}</a></p>
          <p className="text-sm text-muted-foreground">Data access & deletion requests: <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a></p>
        </div>
      </LegalSection>
    </LegalPageShell>
  );
}