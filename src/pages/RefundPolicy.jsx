import React from 'react';
import { Receipt } from 'lucide-react';
import LegalPageShell, { LegalSection, LegalBulletList, LEGAL_CONTACTS } from '@/components/legal/LegalPageShell';
import { usePageTitle } from '@/lib/usePageTitle';

// LP-004 — Refund Policy.
// Authoritative source: approved LP-004 Refund Policy document (v1.0).
// Contact section updated per Legal Center requirements:
//   billing@nmood.app → support@nmood.app
//   legal@nmood.app → business@nmood.app
//   General enquiries → hello@nmood.app

const EFFECTIVE_DATE = '31 July 2026';
const LAST_UPDATED = '31 July 2026';

const toc = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'purchases', title: '2. Subscription Purchases' },
  { id: 'plans', title: '3. Subscription Plans' },
  { id: 'renewal', title: '4. Automatic Renewal' },
  { id: 'cancellation', title: '5. Cancellation of Subscriptions' },
  { id: 'eligibility', title: '6. Refund Eligibility' },
  { id: 'apple', title: '7. Apple App Store Purchases' },
  { id: 'google', title: '8. Google Play Purchases' },
  { id: 'billing-errors', title: '9. Billing Errors' },
  { id: 'promotional', title: '10. Promotional Offers' },
  { id: 'fraud', title: '11. Fraudulent or Unauthorized Purchases' },
  { id: 'chargebacks', title: '12. Chargebacks' },
  { id: 'taxes', title: '13. Taxes' },
  { id: 'consumer-protection', title: '14. Compliance with Consumer Protection Laws' },
  { id: 'changes', title: '15. Changes to this Refund Policy' },
  { id: 'contact', title: '16. Contact Us' },
  { id: 'final-statement', title: '17. Final Statement' },
];

export default function RefundPolicy() {
  usePageTitle('Refund Policy');
  return (
    <LegalPageShell
      icon={Receipt}
      title="Refund Policy"
      docId="LP-004"
      version="1.0"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      toc={toc}
    >
      <LegalSection id="introduction" title="1. Introduction">
        <p>Nmood is operated by <strong>LAZY PANDA L.L.C, Ajman Free Zone, United Arab Emirates</strong>.</p>
        <p>This Refund Policy explains how subscription purchases, cancellations, renewals, and refund requests are handled for Nmood Premium memberships.</p>
        <p>Nmood is committed to providing transparent billing practices while complying with the policies of the Apple App Store, Google Play Store, applicable payment providers, and relevant consumer protection laws.</p>
        <p>By purchasing a Premium Membership, you acknowledge that you have read and understood this Refund Policy.</p>
      </LegalSection>

      <LegalSection id="purchases" title="2. Subscription Purchases">
        <p>Nmood Premium Memberships may be purchased through:</p>
        <LegalBulletList items={[
          'Apple App Store; or',
          'Google Play Store.',
        ]} />
        <p>All purchases are processed by the applicable payment platform. Nmood does not offer website-based checkout or direct web payment.</p>
        <p>Nmood does not directly process or store your payment card information for purchases completed through Apple or Google.</p>
      </LegalSection>

      <LegalSection id="plans" title="3. Subscription Plans">
        <p>Nmood may offer different subscription durations, including but not limited to:</p>
        <LegalBulletList items={[
          'Weekly;',
          'Monthly;',
          'Quarterly;',
          'Semi-Annual; and',
          'Annual subscriptions.',
        ]} />
        <p>Available plans may differ by country, platform, promotional campaigns, or applicable law.</p>
        <p>Prices displayed at the time of purchase govern the applicable subscription.</p>
      </LegalSection>

      <LegalSection id="renewal" title="4. Automatic Renewal">
        <p>Unless cancelled before the renewal date, eligible subscriptions automatically renew through the payment platform used for the original purchase.</p>
        <p>Renewal charges are processed by Apple, Google, or the applicable payment provider according to their billing policies.</p>
        <p>Members are responsible for managing their subscription settings through the applicable marketplace account.</p>
      </LegalSection>

      <LegalSection id="cancellation" title="5. Cancellation of Subscriptions">

        <p>Members may cancel their Premium Membership at any time.</p>
        <p>Cancellation prevents future renewal charges but does not automatically entitle the member to a refund for the current billing period unless otherwise required by applicable law or the policies of the payment provider through which the subscription was purchased.</p>
        <p>Unless otherwise stated, Premium benefits remain available until the end of the active subscription period.</p>
        <p>Upon expiry or cancellation of a Premium Membership, the member's account will automatically revert to the applicable standard membership available at that time.</p>
      </LegalSection>

      <LegalSection id="eligibility" title="6. Refund Eligibility">
        <p>Refund eligibility depends on several factors, including:</p>
        <LegalBulletList items={[
          'the platform through which the subscription was purchased;',
          'applicable consumer protection laws;',
          "the payment provider's policies;",
          'the circumstances of the request; and',
          'any applicable promotional terms.',
        ]} />
        <p>Submitting a refund request does not guarantee that a refund will be approved.</p>
        <p>Each request is reviewed in accordance with the applicable marketplace rules and legal requirements.</p>
      </LegalSection>

      <LegalSection id="apple" title="7. Apple App Store Purchases">
        <p>Subscriptions purchased through the Apple App Store are processed by Apple.</p>
        <p>Refund requests relating to Apple purchases must generally be submitted directly to Apple through the member's Apple Account.</p>
        <p>Nmood cannot approve, reject, or process refunds for purchases made through the Apple App Store where Apple acts as the payment processor.</p>
        <p>Members should refer to Apple's refund procedures and applicable terms for additional information.</p>
      </LegalSection>

      <LegalSection id="google" title="8. Google Play Purchases">
        <p>Subscriptions purchased through Google Play are processed by Google.</p>
        <p>Refund requests relating to Google Play purchases must generally be submitted through the member's Google Play account or in accordance with Google's applicable refund procedures.</p>
        <p>Nmood cannot approve or process refunds where Google acts as the payment processor except where permitted by Google's policies.</p>
        <p>Members should refer to Google's refund procedures for additional information.</p>
      </LegalSection>

      <LegalSection id="billing-errors" title="9. Billing Errors">
        <p>If you believe you have been charged incorrectly, charged multiple times for the same subscription, or experienced another billing error, please contact Nmood as soon as reasonably possible.</p>
        <p>Where the issue relates to an error within Nmood's systems, we will investigate the matter promptly and work with the applicable payment provider to resolve the issue where appropriate.</p>
        <p>Where the issue originates from the payment platform itself, members may also be required to contact the relevant payment provider directly.</p>
      </LegalSection>

      <LegalSection id="promotional" title="10. Promotional Offers">
        <p>Nmood may occasionally offer promotional pricing, introductory offers, trial periods, discounts, vouchers, or other special subscription campaigns.</p>
        <p>Unless otherwise stated:</p>
        <LegalBulletList items={[
          'promotional offers cannot be exchanged for cash;',
          'promotional pricing applies only during the stated promotional period;',
          'standard pricing may apply after the promotional period ends;',
          'promotional offers may be subject to additional eligibility requirements.',
        ]} />
        <p>Nmood reserves the right to modify or discontinue promotional offers at any time, subject to applicable law.</p>
      </LegalSection>

      <LegalSection id="fraud" title="11. Fraudulent or Unauthorized Purchases">
        <p>If you believe your account has been used without your authorization to purchase a subscription, please notify Nmood and the applicable payment provider immediately.</p>
        <p>Nmood may cooperate with payment providers and competent authorities in investigating suspected fraudulent transactions.</p>
        <p>Providing false information in connection with refund requests or payment disputes may result in suspension or termination of your account in accordance with the Terms of Service.</p>
      </LegalSection>

      <LegalSection id="chargebacks" title="12. Chargebacks">
        <p>Members are encouraged to contact Nmood and the applicable payment provider before initiating a chargeback with their financial institution.</p>
        <p>Where a chargeback is initiated, Nmood reserves the right to:</p>
        <LegalBulletList items={[
          'investigate the transaction;',
          'provide relevant transaction information to the payment provider where permitted by law;',
          'temporarily suspend Premium benefits associated with the disputed transaction;',
          'restrict access to paid features until the dispute is resolved; and',
          'take appropriate action where fraudulent or abusive chargeback activity is identified.',
        ]} />
        <p>Nothing in this section limits any rights available to members under applicable law.</p>
      </LegalSection>

      <LegalSection id="taxes" title="13. Taxes">
        <p>Subscription prices may include or exclude applicable taxes depending on the jurisdiction, platform requirements, and local tax regulations.</p>
        <p>Where required by applicable law, taxes may be collected and remitted by Apple, Google, other payment providers, or Nmood, as applicable.</p>
        <p>Members remain responsible for any personal tax obligations arising from their purchase of a Premium Membership where required by law.</p>
      </LegalSection>

      <LegalSection id="consumer-protection" title="14. Compliance with Consumer Protection Laws">

        <p>Nothing in this Refund Policy limits, excludes, or replaces any rights or remedies that cannot lawfully be excluded under applicable consumer protection legislation.</p>
        <p>Where mandatory legal rights provide greater protection than this Refund Policy, those rights shall prevail.</p>
        <p>Nmood is committed to conducting its subscription practices fairly, transparently, and in accordance with applicable laws and marketplace requirements.</p>
      </LegalSection>

      <LegalSection id="changes" title="15. Changes to this Refund Policy">

        <p>Nmood may update this Refund Policy from time to time to reflect:</p>
        <LegalBulletList items={[
          'changes in applicable law;',
          'changes to payment providers;',
          'changes to marketplace policies;',
          'new subscription products;',
          'operational improvements; or',
          'changes to our business practices.',
        ]} />
        <p>Where material changes are made, Nmood will provide reasonable notice through the Services or by other appropriate communication channels.</p>
        <p>The updated Refund Policy becomes effective on the date specified in the revised version.</p>
        <p>Continued use of Premium Membership after the effective date constitutes acceptance of the updated Refund Policy, except where applicable law requires additional consent.</p>
      </LegalSection>

      <LegalSection id="contact" title="16. Contact Us">
        <p>For billing, subscription, or refund-related enquiries, please contact:</p>
        <div className="rounded-xl border border-border p-4 space-y-4 not-prose">
          <div>
            <p className="text-sm font-semibold text-foreground">Billing Support</p>
            <p className="text-sm text-muted-foreground">Email: <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a></p>
            <p className="text-xs text-muted-foreground mt-0.5">For: subscription enquiries; billing questions; payment issues; Premium Membership assistance; refund guidance.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">General Enquiries</p>
            <p className="text-sm text-muted-foreground">Email: <a href={`mailto:${LEGAL_CONTACTS.general}`} className="text-primary hover:underline">{LEGAL_CONTACTS.general}</a></p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Customer Support</p>
            <p className="text-sm text-muted-foreground">Email: <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a></p>
            <p className="text-xs text-muted-foreground mt-0.5">For: account assistance; technical support; subscription access issues; general enquiries.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Business and Legal Correspondence</p>
            <p className="text-sm text-muted-foreground">Email: <a href={`mailto:${LEGAL_CONTACTS.business}`} className="text-primary hover:underline">{LEGAL_CONTACTS.business}</a></p>
            <p className="text-xs text-muted-foreground mt-0.5">For: legal notices; consumer protection matters; regulatory enquiries; formal legal correspondence.</p>
          </div>
        </div>
        <p>Nmood may also be contacted through the official support channels available within the Services or through the official Nmood website.</p>
        <p>We aim to respond to legitimate billing and refund enquiries within a reasonable timeframe.</p>
      </LegalSection>

      <LegalSection id="final-statement" title="17. Final Statement">
        <p>Nmood believes that transparent billing practices build trust.</p>
        <p>Our goal is to ensure that members clearly understand how subscriptions, renewals, cancellations, and refund requests are handled before making a purchase.</p>
        <p>We are committed to fair, transparent, and responsible subscription practices while complying with applicable laws, marketplace policies, and consumer protection requirements.</p>
        <p>Thank you for choosing Nmood Premium.</p>
      </LegalSection>
    </LegalPageShell>
  );
}