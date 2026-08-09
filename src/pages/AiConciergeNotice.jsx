import React from 'react';
import { Sparkles } from 'lucide-react';
import LegalPageShell, { LegalSection, LegalBulletList, LEGAL_CONTACTS } from '@/components/legal/LegalPageShell';
import { usePageTitle } from '@/lib/usePageTitle';

// LP-007 — AI Concierge Notice.
// Discloses the capabilities, limitations, and data practices of the Nmood
// AI Concierge feature, including inspirational recommendations and
// conversation history.

const EFFECTIVE_DATE = '31 July 2026';
const LAST_UPDATED = '31 July 2026';

const toc = [
  { id: 'overview', title: '1. Overview' },
  { id: 'what-it-does', title: '2. What the AI Concierge Does' },
  { id: 'accuracy', title: '3. Accuracy & Limitations' },
  { id: 'inspirational', title: '4. Inspirational Recommendations' },
  { id: 'no-actions', title: '5. No Automatic Actions' },
  { id: 'not-advice', title: '6. Not Professional Advice' },
  { id: 'personalization', title: '7. Personalization & Data' },
  { id: 'conversations', title: '8. Conversation History' },
  { id: 'privacy-rights', title: '9. Your Privacy Rights' },
  { id: 'safety', title: '10. Safety' },
  { id: 'contact', title: '11. Contact' },
];

export default function AiConciergeNotice() {
  usePageTitle('AI Concierge Notice');
  return (
    <LegalPageShell
      icon={Sparkles}
      title="AI Concierge Notice"
      docId="LP-007"
      version="1.0"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      toc={toc}
    >
      <LegalSection id="overview" title="1. Overview">
        <p>The Nmood AI Concierge ("Concierge") is an AI-powered assistant that helps you discover Circles, Experiences, and people on the Nmood platform. It can also generate inspirational activity ideas and itineraries based on your interests and location.</p>
        <p>This notice explains how the Concierge works, its limitations, and how your data is used. By using the Concierge, you acknowledge that you have read and understood this notice.</p>
      </LegalSection>

      <LegalSection id="what-it-does" title="2. What the AI Concierge Does">
        <p>The Concierge can:</p>
        <LegalBulletList items={[
          'Recommend real Circles, Experiences, and members from the Nmood database based on your profile, interests, and preferences.',
          'Generate inspirational activity ideas and itineraries based on your interests and general location.',
          'Answer questions about social activities, connections, and community features.',
          'Ask clarifying questions to better understand your preferences.',
        ]} />
        <p>Recommendations from the Nmood database (Circles, Experiences, members) are real listings created by the Nmood community. The Concierge ranks these using a transparent matching score based on your profile and request.</p>
      </LegalSection>

      <LegalSection id="accuracy" title="3. Accuracy & Limitations">
        <p><strong>AI responses may be inaccurate or incomplete.</strong> The Concierge uses large language models that can produce errors, omissions, or outdated information. You should always use your own judgment and verify information before acting on it.</p>
        <p>Specifically:</p>
        <LegalBulletList items={[
          'The Concierge may not have up-to-date information about event schedules, availability, or pricing.',
          'Match scores are estimates based on available profile data and may not reflect real-world compatibility.',
          'The Concierge may misunderstand your request or provide suggestions that do not fully match your preferences.',
          'If the Concierge cannot find matching records, it will tell you honestly rather than fabricating results.',
        ]} />
      </LegalSection>

      <LegalSection id="inspirational" title="4. Inspirational Recommendations">
        <p>When the Concierge generates activity ideas or itineraries, these are <strong>inspirational suggestions only</strong> — not verified live listings.</p>
        <p><strong>You should independently verify:</strong></p>
        <LegalBulletList items={[
          'Prices and cost estimates (all prices are approximate and labeled as estimates).',
          'Opening hours and availability.',
          'Safety and suitability of any suggested activity or location.',
          'Current details, as information may change after the Concierge generates its response.',
        ]} />
        <p>Inspirational recommendations use general area descriptions (e.g., "a cafe in DIFC") and do not name specific businesses, venues, or addresses. The Concierge does not access live venue data, booking systems, or external mapping providers for these suggestions.</p>
        <p>For meeting someone in person, always meet in a public place and follow standard safety practices.</p>
      </LegalSection>

      <LegalSection id="no-actions" title="5. No Automatic Actions">
        <p>The Concierge <strong>does not</strong> automatically complete any action on your behalf. Specifically, it does not:</p>
        <LegalBulletList items={[
          'Join Circles or RSVP to Experiences without your confirmation.',
          'Send connection requests or messages without your confirmation.',
          'Make payments or purchases.',
          'Modify your profile or account settings.',
          'Block or report other members.',
        ]} />
        <p>When the Concierge recommends an action (e.g., "Join this Circle"), you must explicitly tap the action button to confirm. The Concierge only provides information and suggestions — all actions require your direct, intentional confirmation.</p>
      </LegalSection>

      <LegalSection id="not-advice" title="6. Not Professional Advice">
        <p>AI Concierge recommendations <strong>do not constitute</strong> medical, psychological, legal, financial, or professional advice.</p>
        <LegalBulletList items={[
          'The Concierge is not a substitute for professional help or emergency services.',
          'If you are experiencing a mental health crisis, contact a qualified professional or emergency services immediately.',
          'If you need legal, financial, or medical advice, consult a qualified professional in your jurisdiction.',
          'Safety and suitability assessments are your responsibility — the Concierge cannot evaluate whether an activity or location is safe for you.',
        ]} />
      </LegalSection>

      <LegalSection id="personalization" title="7. Personalization & Data">
        <p>The Concierge uses the following data to personalize recommendations:</p>
        <LegalBulletList items={[
          'Your profile information (name, city, country, interests, languages, lifestyle).',
          'Your Circle memberships, Experience attendance, and Pal connections.',
          'Your conversation history within the current Concierge session.',
          'Your stated preferences in each message (e.g., "free activities", "near Dubai").',
        ]} />
        <p>This data is processed in accordance with our Privacy Policy (LP-002). The Concierge does not use sensitive personal characteristics (race, religion, sexual orientation) for matching. You can disable AI personalization in Settings &rarr; Privacy.</p>
      </LegalSection>

      <LegalSection id="conversations" title="8. Conversation History">
        <p>Your Concierge conversations are saved to your account so you can review past recommendations and continue conversations across sessions.</p>
        <LegalBulletList items={[
          'Conversations are private and linked to your account — other members cannot see them.',
          'You can delete individual conversations or clear your entire Concierge history at any time.',
          'Conversation data is retained according to the retention periods in our Privacy Policy.',
          'Deleting a conversation removes it from your view; residual data may be retained for a limited period for audit and security purposes as described in the Privacy Policy.',
        ]} />
      </LegalSection>

      <LegalSection id="privacy-rights" title="9. Your Privacy Rights">
        <p>You have the following rights regarding your Concierge data:</p>
        <LegalBulletList items={[
          'Delete conversations — use the trash icon in the Concierge or "Clear History" to remove all conversations.',
          'Disable personalization — toggle AI personalization in Settings &rarr; Privacy.',
          'Data access — request a copy of your Concierge data through "Export My Data" in Privacy settings.',
          'Account deletion — deleting your account removes all Concierge conversations and associated data.',
        ]} />
        <p>To exercise these rights, see Settings &rarr; Privacy or contact us at <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a>.</p>
      </LegalSection>

      <LegalSection id="safety" title="10. Safety">
        <p>The Concierge is designed with safety in mind:</p>
        <LegalBulletList items={[
          'It respects your blocks — blocked members are never recommended.',
          'It excludes suspended, banned, or deleted accounts from recommendations.',
          'It does not reveal your precise location to other members.',
          'It does not facilitate contact with members you have blocked or who have blocked you.',
        ]} />
        <p>If you encounter a recommendation that feels unsafe or inappropriate, you can dismiss it or report the underlying member, Circle, or Experience through the in-app reporting tools.</p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <p>For questions about the AI Concierge, contact us at <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a>.</p>
        <p>For privacy or data protection enquiries about AI processing, contact us at <a href={`mailto:${LEGAL_CONTACTS.business}`} className="text-primary hover:underline">{LEGAL_CONTACTS.business}</a>.</p>
      </LegalSection>
    </LegalPageShell>
  );
}