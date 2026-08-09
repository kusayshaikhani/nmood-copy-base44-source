import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalPageShell, { LegalSection, LegalBulletList, LEGAL_CONTACTS, LEGAL_OPERATOR } from '@/components/legal/LegalPageShell';
import { LEGAL_DATES } from '@/lib/legal-config';
import { usePageTitle } from '@/lib/usePageTitle';

// Public Safety Center — unauthenticated, mobile-responsive.
// Explains report, block, emergency/immediate-danger guidance, moderation
// expectations, and appeals/support paths. Does NOT imply Nmood is an
// emergency service. Interactive safety tools (block list, report history)
// are available to signed-in members at /safety-center.

const toc = [
  { id: 'overview', title: '1. Overview' },
  { id: 'report', title: '2. Reporting' },
  { id: 'block', title: '3. Blocking' },
  { id: 'emergency', title: '4. Immediate Danger' },
  { id: 'moderation', title: '5. Moderation' },
  { id: 'appeals', title: '6. Appeals & Support' },
  { id: 'contact', title: '7. Contact' },
];

export default function SafetyCenterPublic() {
  usePageTitle('Safety Center');
  const dates = LEGAL_DATES.safety_center;

  return (
    <LegalPageShell
      icon={Shield}
      title="Safety Center"
      docId="LP-008"
      version="1.0"
      effectiveDate={dates.effective}
      lastUpdated={dates.updated}
      toc={toc}
    >
      <LegalSection id="overview" title="1. Overview">
        <p>Your safety is a priority at Nmood. This Safety Center explains the tools available to help you stay safe on the platform, how to report and block other members, what to do in an emergency, and how our moderation process works.</p>
        <p>Nmood is operated by {LEGAL_OPERATOR}. The Service is for adults aged 18 and over only.</p>
        <p><strong>Nmood is not an emergency service.</strong> If you or someone else is in immediate danger, contact your local emergency services directly — do not rely on Nmood for emergency response.</p>
      </LegalSection>

      <LegalSection id="report" title="2. Reporting">
        <p>If you encounter content or behavior that violates our <Link to="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link>, you can report it in the app:</p>
        <LegalBulletList items={[
          'Tap the "Report" option on any member profile, message, Circle, or Experience.',
          'Choose a reason and add optional details.',
          'Reports are reviewed by our Trust & Safety team.',
          'You can view your report history in the in-app Safety Center (Settings → Safety).',
          'You can also block the member at the same time you report them.',
        ]} />
        <p>We do not disclose specific enforcement methods to prevent circumvention of safety controls.</p>
      </LegalSection>

      <LegalSection id="block" title="3. Blocking">
        <p>You can block any member at any time. Blocking is bidirectional:</p>
        <LegalBulletList items={[
          'Blocked members cannot see your profile, send you messages, or appear in your recommendations.',
          'You cannot see blocked members or receive messages from them.',
          'You can view and manage your block list in the in-app Safety Center (Settings → Safety).',
          'Blocking takes effect immediately and does not require Nmood approval.',
        ]} />
      </LegalSection>

      <LegalSection id="emergency" title="4. Immediate Danger">
        <p><strong>If you or someone else is in immediate danger, contact your local emergency services immediately.</strong> Nmood cannot provide emergency assistance and is not a substitute for emergency services.</p>
        <LegalBulletList items={[
          'In the UAE, dial 999 for police, ambulance, or civil defence.',
          'If you are outside the UAE, use your country\'s emergency number.',
          'After contacting emergency services, you can also report the member in the app so we can take appropriate action.',
          'For child safety concerns, contact your local law enforcement or child protection authority. Nmood cooperates fully with law enforcement.',
        ]} />
        <p>Nmood does not continuously monitor conversations and cannot respond to emergencies in real time.</p>
      </LegalSection>

      <LegalSection id="moderation" title="5. Moderation">
        <p>Nmood uses a combination of automated detection and human review to identify and address violations of our Community Guidelines. We may:</p>
        <LegalBulletList items={[
          'Remove content that violates our Community Guidelines.',
          'Issue warnings to members who violate our Guidelines.',
          'Temporarily restrict features for members who violate our Guidelines.',
          'Permanently ban members for serious or repeated violations.',
          'Report serious violations (e.g., child safety, sexual exploitation, threats of violence) to law enforcement where appropriate.',
        ]} />
        <p>Moderation decisions are based on our <Link to="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link> and applicable law. We do not disclose specific enforcement methods to prevent circumvention of safety controls.</p>
      </LegalSection>

      <LegalSection id="appeals" title="6. Appeals & Support">
        <p>If your account is suspended or terminated and you believe it was a mistake, you may appeal:</p>
        <LegalBulletList items={[
          <>Email us at <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a> with your account details and a description of the issue.</>,
          'We will review your appeal and respond within a reasonable timeframe.',
          'We do not guarantee that any suspension or termination will be reversed.',
          'For data access, rectification, or erasure requests, see our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.',
        ]} />
        <p>Signed-in members can access interactive safety tools — including block list management and report history — at the in-app Safety Center (Settings → Safety).</p>
      </LegalSection>

      <LegalSection id="contact" title="7. Contact">
        <p>For safety concerns, reports, or appeals, contact us:</p>
        <div className="rounded-xl border border-border p-4 space-y-2 not-prose">
          <p className="text-sm text-muted-foreground">Support & safety reports: <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a></p>
        </div>
        <p>Nmood is operated by {LEGAL_OPERATOR} (Trade Licence No. 2625417982888).</p>
      </LegalSection>
    </LegalPageShell>
  );
}