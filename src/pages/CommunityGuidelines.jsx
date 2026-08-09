import React from 'react';
import { Users } from 'lucide-react';
import LegalPageShell, { LegalSection, LegalBulletList, LEGAL_CONTACTS, LEGAL_OPERATOR } from '@/components/legal/LegalPageShell';
import { LEGAL_DATES } from '@/lib/legal-config';
import { usePageTitle } from '@/lib/usePageTitle';

// LP-003 — Community Guidelines.
// Comprehensive prohibited conduct list, reporting/blocking/moderation/
// suspension/termination/appeals at a high level.

const EFFECTIVE_DATE = LEGAL_DATES.community_guidelines.effective;
const LAST_UPDATED = LEGAL_DATES.community_guidelines.updated;

const toc = [
  { id: 'principles', title: '1. Our Principles' },
  { id: 'prohibited', title: '2. Prohibited Conduct' },
  { id: 'content-standards', title: '3. Content Standards' },
  { id: 'reporting', title: '4. Reporting' },
  { id: 'blocking', title: '5. Blocking' },
  { id: 'moderation', title: '6. Moderation' },
  { id: 'suspension', title: '7. Suspension & Termination' },
  { id: 'appeals', title: '8. Appeals' },
  { id: 'contact', title: '9. Contact' },
];

export default function CommunityGuidelines() {
  usePageTitle('Community Guidelines');
  return (
    <LegalPageShell
      icon={Users}
      title="Community Guidelines"
      docId="LP-003"
      version="1.0"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      toc={toc}
    >
      <LegalSection id="principles" title="1. Our Principles">
        <p>Nmood is a community built on respect, authenticity, and meaningful connection. We welcome every nationality, culture, religion, and language. These Community Guidelines apply equally to every member, host, organizer, and employee.</p>
        <p>Respect is the price of entry. We have zero tolerance for hate, harassment, discrimination, violence, extremism, fraud, and exploitation.</p>
      </LegalSection>

      <LegalSection id="prohibited" title="2. Prohibited Conduct">
        <p>The following conduct is strictly prohibited. Violation may result in content removal, account suspension, permanent ban, and reporting to law enforcement where appropriate.</p>

        <p className="font-semibold text-foreground pt-2">Harassment, Threats, Bullying, Stalking & Hate</p>
        <LegalBulletList items={[
          'Harassment, intimidation, or repeated unwanted contact.',
          'Threats of violence or harm to any person.',
          'Bullying, mocking, or targeting another member.',
          'Stalking or persistent surveillance of another member.',
          'Hate speech, racism, discrimination, or slurs based on race, ethnicity, nationality, religion, gender, sexual orientation, disability, or any other protected characteristic.',
        ]} />

        <p className="font-semibold text-foreground pt-2">Impersonation & Fraud</p>
        <LegalBulletList items={[
          'Impersonating another person or creating fake accounts.',
          'Using a false identity to deceive others.',
          'Fraud, scams, or deceptive practices.',
          'Misrepresenting your identity, age, or qualifications.',
        ]} />

        <p className="font-semibold text-foreground pt-2">Sexual Exploitation & Non-Consensual Content</p>
        <LegalBulletList items={[
          'Sexual or explicit content, including nudity.',
          'Non-consensual sharing of private images or information.',
          'Sexual solicitation or exploitation.',
          'Any content that sexualizes or endangers others.',
        ]} />

        <p className="font-semibold text-foreground pt-2">Content Involving Minors</p>
        <LegalBulletList items={[
          'Any content that exploits, endangers, or sexualizes minors.',
          'Grooming or attempting to contact minors for improper purposes.',
          'Creating accounts to target or deceive minors.',
          'Nmood is 18+ only. Any suspected minor safety concern is escalated immediately.',
        ]} />

        <p className="font-semibold text-foreground pt-2">Illegal Goods or Activities</p>
        <LegalBulletList items={[
          'Selling, promoting, or facilitating illegal goods or services.',
          'Content related to illegal drugs, weapons, or contraband.',
          'Facilitating any illegal activity.',
        ]} />

        <p className="font-semibold text-foreground pt-2">Dangerous Activity</p>
        <LegalBulletList items={[
          'Promoting self-harm, eating disorders, or dangerous activities.',
          'Encouraging violence or dangerous challenges.',
          'Content that could cause physical harm to yourself or others.',
        ]} />

        <p className="font-semibold text-foreground pt-2">Spam & Deceptive Promotion</p>
        <LegalBulletList items={[
          'Unsolicited commercial messages, spam, or promotional content.',
          'Deceptive promotion, fake reviews, or manipulated engagement.',
          'Using the Service for commercial solicitation without authorization.',
        ]} />

        <p className="font-semibold text-foreground pt-2">Unauthorized Sharing of Personal Information</p>
        <LegalBulletList items={[
          'Sharing another member\'s personal information (phone, email, address) without consent.',
          'Doxxing or revealing someone\'s private details.',
          'Collecting or storing personal data of other members without their consent.',
        ]} />

        <p className="font-semibold text-foreground pt-2">Attempts to Bypass Blocks, Suspensions, or Privacy Controls</p>
        <LegalBulletList items={[
          'Creating new accounts to bypass a block or suspension.',
          'Using alternative methods to contact someone who has blocked you.',
          'Attempting to circumvent privacy controls or safety features.',
          'Using automated tools, bots, or scrapers to access the Service.',
        ]} />
      </LegalSection>

      <LegalSection id="content-standards" title="3. Content Standards">
        <p>All content you post — profile photos, bios, messages, Circle posts, and Experience chats — must comply with these Guidelines. We may remove content that violates these Guidelines at any time, without notice.</p>
      </LegalSection>

      <LegalSection id="reporting" title="4. Reporting">
        <p>If you encounter content or behavior that violates these Guidelines:</p>
        <LegalBulletList items={[
          'Use the in-app "Report" feature on any profile, message, Circle, or Experience.',
          'Reports are reviewed by our Trust & Safety team.',
          'You can view your report history in Settings &rarr; Safety.',
          'In case of immediate danger, contact your local emergency services first.',
        ]} />
        <p>We do not disclose specific enforcement methods to prevent circumvention of safety controls.</p>
      </LegalSection>

      <LegalSection id="blocking" title="5. Blocking">
        <p>You can block any member at any time. Blocking is bidirectional — blocked members cannot see your profile, send you messages, or appear in your recommendations. You can view and manage your block list in Settings &rarr; Safety.</p>
      </LegalSection>

      <LegalSection id="moderation" title="6. Moderation">
        <p>Nmood uses a combination of automated detection and human review to identify and address violations. We may:</p>
        <LegalBulletList items={[
          'Remove content that violates these Guidelines.',
          'Issue warnings to members who violate these Guidelines.',
          'Temporarily restrict features for members who violate these Guidelines.',
          'Permanently ban members for serious or repeated violations.',
        ]} />
      </LegalSection>

      <LegalSection id="suspension" title="7. Suspension & Termination">
        <p>We may suspend or terminate your account if you violate these Guidelines, our Terms of Service, or applicable law. Serious violations (e.g., child safety, sexual exploitation, threats of violence) result in immediate permanent bans and may be reported to law enforcement.</p>
      </LegalSection>

      <LegalSection id="appeals" title="8. Appeals">
        <p>If your account is suspended or terminated and you believe it was a mistake, you may appeal by contacting us at {LEGAL_CONTACTS.support}. We will review your appeal and respond within a reasonable timeframe. We do not guarantee that any suspension or termination will be reversed.</p>
      </LegalSection>

      <LegalSection id="contact" title="9. Contact">
        <p>For questions about these Community Guidelines, or to report a concern, contact us:</p>
        <div className="rounded-xl border border-border p-4 space-y-2 not-prose">
          <p className="text-sm text-muted-foreground">Support & safety reports: <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a></p>
        </div>
        <p>Nmood is operated by {LEGAL_OPERATOR} (Trade Licence No. 2625417982888).</p>
      </LegalSection>
    </LegalPageShell>
  );
}