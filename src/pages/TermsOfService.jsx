import React from 'react';
import { FileText } from 'lucide-react';
import LegalPageShell, { LegalSection, LegalBulletList, LEGAL_CONTACTS, LEGAL_OPERATOR } from '@/components/legal/LegalPageShell';
import { LEGAL_DATES } from '@/lib/legal-config';
import { usePageTitle } from '@/lib/usePageTitle';
import { isFounderAccessEnabled } from '@/lib/launch-mode';

// LP-001 — Terms of Service.
// Comprehensive coverage of all Nmood features: registration, 18+ eligibility,
// profiles, Discover, connections, Circles, Experiences, UGC, moderation,
// Premium subscriptions, AI Concierge, notifications, IP, liability, UAE law.

const EFFECTIVE_DATE = LEGAL_DATES.terms_of_service.effective;
const LAST_UPDATED = LEGAL_DATES.terms_of_service.updated;

const toc = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'eligibility', title: '2. Eligibility & Age Requirement' },
  { id: 'accounts', title: '3. Registration & Accounts' },
  { id: 'profiles', title: '4. Profiles & Personal Information' },
  { id: 'discover', title: '5. Discover & Member Matching' },
  { id: 'connections', title: '6. Connections & Messaging' },
  { id: 'circles', title: '7. Circles' },
  { id: 'experiences', title: '8. Experiences' },
  { id: 'ugc', title: '9. User-Generated Content' },
  { id: 'moderation', title: '10. Blocking, Reporting & Moderation' },
  { id: 'premium', title: '11. Premium Subscriptions' },
  { id: 'ai', title: '12. AI Concierge' },
  { id: 'notifications', title: '13. Notifications' },
  { id: 'privacy-tech', title: '14. Cookies & Tracking' },
  { id: 'deletion', title: '15. Account Deletion & Data Requests' },
  { id: 'ip', title: '16. Intellectual Property' },
  { id: 'prohibited', title: '17. Prohibited Conduct' },
  { id: 'disclaimers', title: '18. Disclaimers & Limitation of Liability' },
  { id: 'changes', title: '19. Changes to the Service & Legal Documents' },
  { id: 'governing-law', title: '20. Governing Law & Disputes' },
  { id: 'contact', title: '21. Contact' },
];

export default function TermsOfService() {
  usePageTitle('Terms of Service');
  return (
    <LegalPageShell
      icon={FileText}
      title="Terms of Service"
      docId="LP-001"
      version="1.0"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      toc={toc}
    >
      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <p>These Terms of Service ("Terms") govern your access to and use of the Nmood platform, including the mobile application and website (collectively, the "Service"). The Service is operated by {LEGAL_OPERATOR} ("Nmood", "we", "us").</p>
        <p>By creating an account, registering, or using the Service, you agree to these Terms, our Privacy Policy (LP-002), Community Guidelines (LP-003), and all other applicable policies referenced herein. If you do not agree, you may not use the Service.</p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility & Age Requirement">
        <LegalBulletList items={[
          <><strong>You must be at least 18 years of age (Gregorian) to use Nmood.</strong> By registering, you confirm that you are at least 18 years old and have the legal capacity to enter into a binding agreement.</>,
          'You must provide your complete date of birth during registration or onboarding. Your date of birth is used to verify eligibility and, only when you enable Show Age, to calculate a derived age for display. The complete date of birth is kept private — it is never displayed on your profile or shared with other members.',
          'Accounts that cannot confirm eligibility, or that indicate the user is under 18, may be placed in limited-access mode. You will not be able to access Discover, messaging, Circles, Experiences, or AI Concierge, but you can correct an incorrectly entered date of birth, contact Support, review our policies, or delete your account.',
          'Nmood is not directed to minors. We do not knowingly collect personal data from anyone under 18. Nmood may review an account and take appropriate action under these Terms and applicable requirements. Accounts are not automatically deleted solely by the age-checking system. Support, legal information, and account-deletion options remain available.',
          'You must provide accurate and truthful information during registration and keep it updated.',
          'One account per person. Creating multiple accounts to circumvent restrictions, bans, or limits is prohibited.',
        ]} />
      </LegalSection>

      <LegalSection id="accounts" title="3. Registration & Accounts">
        <p>You may register using an email address and password, or through Google or Apple single sign-on. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.</p>
        <LegalBulletList items={[
          'Keep your password secure and do not share it with others.',
          'Notify us immediately if you suspect unauthorized access to your account.',
          'You may not transfer, sell, or assign your account to another person.',
          'We may suspend or terminate your account if you violate these Terms, our Community Guidelines, or applicable law.',
        ]} />
      </LegalSection>

      <LegalSection id="profiles" title="4. Profiles & Personal Information">
        <p>Your profile is how other members discover and connect with you. You may provide:</p>
        <LegalBulletList items={[
          'Display name, first name, last name, and bio.',
          'Profile photo and optional photo gallery.',
          'Date of birth (used for age verification — not displayed unless you choose to show your age).',
          'Gender, nationality, and location (city and country).',
          'Interests, languages, and lifestyle preferences.',
          'Location is city-level only — Nmood never stores or shares your precise GPS coordinates.',
        ]} />
        <p>Nationality and location are independent fields. Your nationality is never auto-inferred from your location, IP address, device language, or timezone.</p>
        <p>You can control who sees your profile through visibility settings (public, connections only, or private) in Settings &rarr; Privacy.</p>
      </LegalSection>

      <LegalSection id="discover" title="5. Discover & Member Matching">
        <p>Nmood's Discover feature helps you find and connect with other members based on shared interests, location, languages, and lifestyle. Matching is based on profile data you provide and your stated preferences.</p>
        <p>Matching does not use sensitive personal characteristics such as race, religion, or sexual orientation. You can adjust your discovery scope (nearby, same country, or anywhere) and search preferences in Settings &rarr; Discovery.</p>
      </LegalSection>

      <LegalSection id="connections" title="6. Connections & Messaging">
        <p>You can send connection requests ("Pal requests") to other members. If accepted, you become Pals and can send private direct messages to each other.</p>
        <LegalBulletList items={[
          ...(isFounderAccessEnabled() ? [
            'During the launch period, all members have unlimited connection requests under Founder Access.',
          ] : [
            'Free (Explorer) members have a limited number of connection requests. Premium members have unlimited requests.',
          ]),
          'You can block any member at any time. Blocked members cannot see your profile, send you messages, or appear in your recommendations.',
          'You can control who can message you (everyone, connections only, or no one) in Settings &rarr; Privacy.',
          'Messages are not end-to-end encrypted. Do not share sensitive information through the messaging feature.',
        ]} />
      </LegalSection>

      <LegalSection id="circles" title="7. Circles">
        <p>Circles are member-created groups organized around shared interests. Any member can create a Circle or join existing ones.</p>
        <LegalBulletList items={[
          'Circle creators (organizers) can set privacy (public, approval-required, private, or invite-only).',
          'Organizers can manage members, remove members, and set rules for their Circle.',
          ...(isFounderAccessEnabled() ? [
            'During the launch period, all members have unlimited Circle joins under Founder Access.',
          ] : [
            'Free (Explorer) members have a limited number of Circle joins. Premium members have unlimited joins.',
          ]),
          'Circle chat messages are visible to all members of that Circle.',
        ]} />
      </LegalSection>

      <LegalSection id="experiences" title="8. Experiences">
        <p>Experiences are member-organized activities (e.g., coffee meetups, hikes, workshops). Any member can create an Experience or RSVP to existing ones.</p>
        <LegalBulletList items={[
          'Experience hosts can set capacity, location, date, time, and budget.',
          ...(isFounderAccessEnabled() ? [
            'During the launch period, all members have unlimited Experience joins under Founder Access.',
          ] : [
            'Free (Explorer) members have a limited number of Experience joins. Premium members have unlimited joins.',
          ]),
          'Experience chat is available to all confirmed attendees.',
          'Hosts can cancel Experiences and manage attendee lists.',
        ]} />
        <p>Experiences involve meeting other members in person. You are solely responsible for your personal safety. Nmood does not organize, verify, or guarantee the safety of any Experience, host, or attendee. Always meet in public places, inform someone you trust of your plans, and follow standard personal safety practices.</p>
      </LegalSection>

      <LegalSection id="ugc" title="9. User-Generated Content">
        <p>You are responsible for all content you post on Nmood, including profile photos, bio text, messages, Circle posts, and Experience chat messages.</p>
        <LegalBulletList items={[
          'You retain ownership of your content. By posting it, you grant Nmood a worldwide, non-exclusive, royalty-free license to host, display, and process your content solely for operating the Service.',
          'You represent that your content does not violate any law or these Terms, and that you have all necessary rights to post it.',
          'We may remove content that violates these Terms or our Community Guidelines at any time, without notice.',
        ]} />
      </LegalSection>

      <LegalSection id="moderation" title="10. Blocking, Reporting & Moderation">
        <p>Nmood provides tools to help you stay safe:</p>
        <LegalBulletList items={[
          <><strong>Blocking:</strong> You can block any member. Blocked members cannot see your profile, send you messages, or appear in your recommendations. Blocks are bidirectional.</>,
          <><strong>Reporting:</strong> You can report any member, Circle, Experience, or message that violates our Community Guidelines. Reports are reviewed by our Trust & Safety team.</>,
          <><strong>Moderation:</strong> We may suspend, restrict, or terminate accounts that violate these Terms or Community Guidelines. We use automated detection and human review to identify violations.</>,
          <><strong>Appeals:</strong> If your account is suspended or terminated, you may appeal by contacting us at {LEGAL_CONTACTS.support}. We will review your appeal and respond within a reasonable timeframe.</>,
        ]} />
        <p>We do not disclose specific enforcement methods to prevent circumvention of safety controls.</p>
      </LegalSection>

      <LegalSection id="premium" title="11. Premium Subscriptions">
        {isFounderAccessEnabled() ? (
          <>
            <p>During our launch period, Nmood is offered free of charge under Founder Access. All members receive the full feature set — profiles, experiences, circles, discovery, connections, messaging, and AI Concierge — at no cost.</p>
            <p>Nmood does not offer paid subscriptions or in-app purchases during the launch period. There are no checkout flows, purchase buttons, or billing screens in the app.</p>
            <p>We may introduce optional paid features in a future update. When paid subscriptions become available, this section will be updated and our Subscription Terms (LP-005) will become effective. Any paid features will be clearly presented and require explicit opt-in before purchase.</p>
          </>
        ) : (
          <>
            <p>Nmood offers an optional Premium membership with enhanced features. Premium subscriptions are purchased through the Apple App Store or Google Play Store.</p>
            <LegalBulletList items={[
              'Subscriptions automatically renew unless cancelled before the renewal date.',
              'You can cancel at any time through your Apple Account or Google Play Account settings.',
              'Premium benefits remain available until the end of the current billing period after cancellation.',
              'For refund and cancellation details, see our Refund Policy (LP-004) and Subscription Terms (LP-005).',
            ]} />
            <p>Nmood does not offer website-based checkout or direct web payment. All Premium subscriptions must be purchased through the Apple App Store or Google Play Store.</p>
          </>
        )}
      </LegalSection>

      <LegalSection id="ai" title="12. AI Concierge">
        <p>Nmood includes an AI Concierge that provides personalized recommendations and inspirational ideas. AI Concierge features are subject to our AI Concierge Notice (LP-007).</p>
        <LegalBulletList items={[
          'AI responses may be inaccurate, incomplete, delayed, or unavailable. Always use your own judgment and verify important information independently.',
          'Inspirational recommendations are not verified live listings. Verify prices, hours, and availability independently.',
          'The Concierge does not complete bookings, payments, connections, or messages without your explicit confirmation.',
          'AI recommendations do not constitute medical, legal, financial, professional, or emergency advice.',
          'You can delete Concierge conversations and disable AI personalization in Settings &rarr; Privacy.',
        ]} />
      </LegalSection>

      <LegalSection id="notifications" title="13. Notifications">
        <p>Nmood may send push notifications and email notifications to keep you informed about connections, messages, Circle updates, and Experience reminders. You can manage notification preferences in Settings &rarr; Notifications.</p>
      </LegalSection>

      <LegalSection id="privacy-tech" title="14. Cookies & Tracking">
        <p>Nmood uses local storage for session management, theme preference, and language selection. We do not use third-party advertising cookies or cross-site tracking. For details, see our Cookie Notice (LP-006) and Privacy Policy (LP-002).</p>
      </LegalSection>

      <LegalSection id="deletion" title="15. Account Deletion & Data Requests">
        <p>You can delete your account at any time through Settings &rarr; Privacy &rarr; Delete Account. Account deletion:</p>
        <LegalBulletList items={[
          'Anonymizes your profile and removes it from discovery immediately.',
          'Enters a 30-day recovery window during which you can reactivate your account.',
          'After the recovery window, your personal data is permanently removed from active systems.',
          'Backup copies are removed within 90 days after final deletion, through normal backup cycles.',
          'Security logs, safety reports, support records, and consent records are retained as described in the Privacy Policy.',
        ]} />
        <p>You can request a copy of your data ("Export My Data") in Settings &rarr; Privacy. For data access, rectification, or erasure requests, contact us at {LEGAL_CONTACTS.support}.</p>
      </LegalSection>

      <LegalSection id="ip" title="16. Intellectual Property">
        <p>Nmood, the Nmood logo, the Service design, and all software, features, and content provided by Nmood (excluding user-generated content) are the intellectual property of Nmood and are protected by copyright, trademark, and other applicable laws.</p>
        <p>You may not copy, modify, distribute, or create derivative works from the Service without our express written permission.</p>
      </LegalSection>

      <LegalSection id="prohibited" title="17. Prohibited Conduct">
        <p>You agree not to engage in any conduct prohibited by our Community Guidelines (LP-003), including but not limited to:</p>
        <LegalBulletList items={[
          'Harassment, threats, bullying, stalking, and hate speech.',
          'Impersonation and fraud.',
          'Sexual exploitation and non-consensual content.',
          'Content involving minors.',
          'Illegal goods or activities.',
          'Dangerous activity.',
          'Spam and deceptive promotion.',
          'Unauthorized sharing of personal information.',
          'Attempts to bypass blocks, suspensions, or privacy controls.',
        ]} />
        <p>Violation of these rules may result in content removal, account suspension, permanent ban, and reporting to law enforcement where appropriate.</p>
      </LegalSection>

      <LegalSection id="disclaimers" title="18. Disclaimers & Limitation of Liability">
        <p>To the maximum extent permitted by law:</p>
        <LegalBulletList items={[
          'The Service is provided "as is" and "as available" without warranties of any kind.',
          'Nmood is not liable for any indirect, incidental, special, or consequential damages.',
          'Nmood is not liable for the conduct of other members or for any interactions between members.',
          'Nmood is not liable for any data loss resulting from service interruptions, bugs, or third-party failures.',
          'Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.',
        ]} />
        <p><strong>Member Safety:</strong> Nmood cannot verify the identity, conduct, intentions, or suitability of any member. We do not conduct background checks. You are solely responsible for evaluating the safety and trustworthiness of other members before meeting in person, sharing contact information, or attending Experiences.</p>
        <p><strong>Third-Party Services:</strong> The Service may include or link to third-party services, including maps, app stores, payment providers, and AI providers. Nmood is not responsible for the availability, accuracy, or content of third-party services, and is not liable for any damage or loss caused by them.</p>
      </LegalSection>

      <LegalSection id="changes" title="19. Changes to the Service & Legal Documents">
        <p>We may modify, suspend, or discontinue the Service, or any part of it, at any time, with or without notice. We may also update these Terms and other legal documents from time to time.</p>
        <p>For material changes to these Terms or our Privacy Policy, we will provide notice through the app or via email. Your continued use of the Service after changes take effect constitutes acceptance of the updated documents, except where applicable law requires explicit consent.</p>
        <p>If a material legal update requires renewed consent, we will present a clear review-and-accept flow within the app.</p>
      </LegalSection>

      <LegalSection id="governing-law" title="20. Governing Law & Disputes">
        <p>These Terms are governed by the applicable laws and regulations of the United Arab Emirates. The Service is operated by {LEGAL_OPERATOR} (Trade Licence No. 2625417982888).</p>
        <p>Any disputes arising from these Terms or your use of the Service shall be resolved in the competent courts of the United Arab Emirates, unless required otherwise by mandatory consumer protection laws in your jurisdiction.</p>
        <p>Where applicable law provides greater consumer rights than those stated here, those rights shall prevail.</p>
      </LegalSection>

      <LegalSection id="contact" title="21. Contact">
        <p>For questions about these Terms, contact us:</p>
        <div className="rounded-xl border border-border p-4 space-y-2 not-prose">
          <p className="text-sm text-muted-foreground">Legal & business: <a href={`mailto:${LEGAL_CONTACTS.business}`} className="text-primary hover:underline">{LEGAL_CONTACTS.business}</a></p>
          <p className="text-sm text-muted-foreground">Support: <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a></p>
        </div>
      </LegalSection>
    </LegalPageShell>
  );
}