import React from 'react';
import { CreditCard } from 'lucide-react';
import LegalPageShell, { LegalSection, LegalBulletList, LEGAL_CONTACTS } from '@/components/legal/LegalPageShell';
import { usePageTitle } from '@/lib/usePageTitle';
import { isFounderAccessEnabled } from '@/lib/launch-mode';

// LP-005 — Subscription and Cancellation Terms.

const EFFECTIVE_DATE = '31 July 2026';
const LAST_UPDATED = '31 July 2026';

const toc = [
  { id: 'overview', title: '1. Overview' },
  { id: 'plans', title: '2. Subscription Plans & Pricing' },
  { id: 'purchase', title: '3. Purchase & Activation' },
  { id: 'renewal', title: '4. Automatic Renewal' },
  { id: 'cancellation', title: '5. Cancellation' },
  { id: 'downgrade', title: '6. Expiry & Downgrade' },
  { id: 'trial', title: '7. Free Trials & Promotions' },
  { id: 'platforms', title: '8. Platform-Specific Terms' },
  { id: 'changes', title: '9. Price Changes' },
  { id: 'obligations', title: '10. Member Obligations' },
  { id: 'contact', title: '11. Contact' },
];

export default function SubscriptionTerms() {
  usePageTitle('Subscription Terms');
  return (
    <LegalPageShell
      icon={CreditCard}
      title="Subscription and Cancellation Terms"
      docId="LP-005"
      version="1.0"
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={LAST_UPDATED}
      toc={toc}
    >
      {isFounderAccessEnabled() && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 mb-6">
          <h3 className="font-bold text-base mb-1">Founder Access — No Paid Subscriptions</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            During our launch period, Nmood does not offer paid subscriptions or in-app purchases. All members receive the complete Nmood experience free of charge under Founder Access. The subscription terms below are preserved for reference and will become effective only if paid subscriptions are introduced in a future update.
          </p>
        </div>
      )}
      <LegalSection id="overview" title="1. Overview">
        <p>These Subscription and Cancellation Terms ("Subscription Terms") govern your purchase, renewal, and cancellation of Nmood Premium memberships. By purchasing a Premium subscription, you agree to these Subscription Terms, our Refund Policy, and our Terms of Service.</p>
        <p>Nmood Premium is an optional paid membership that unlocks enhanced features, including unlimited Circle and Experience joins, unlimited connection requests, private messaging, and AI Concierge access without daily limits.</p>
      </LegalSection>

      <LegalSection id="plans" title="2. Subscription Plans & Pricing">
        <p>Nmood may offer the following subscription durations:</p>
        <LegalBulletList items={[
          'Weekly',
          'Monthly',
          'Quarterly',
          'Semi-Annual',
          'Annual',
        ]} />
        <p>Available plans and pricing may vary by country, platform, and promotional campaign. The price displayed at the time of purchase in the Apple App Store or Google Play Store is the price that applies to your subscription.</p>
        <p>All prices are shown in the currency of the store region where the purchase is made. Prices may include or exclude applicable taxes depending on your jurisdiction.</p>
      </LegalSection>

      <LegalSection id="purchase" title="3. Purchase & Activation">
        <p>Premium memberships are purchased through the Apple App Store or Google Play Store. Nmood does not directly process or store your payment card information.</p>
        <p>Upon successful purchase, Premium features are activated immediately and remain available for the duration of the subscription period you selected.</p>
        <p>If you restore a previous purchase on a new device, your Premium membership will be re-activated based on the receipt validated by the applicable store.</p>
      </LegalSection>

      <LegalSection id="renewal" title="4. Automatic Renewal">
        <p>Unless you cancel before the renewal date, your Premium subscription automatically renews through the same payment platform used for the original purchase.</p>
        <p>Renewal charges are processed by Apple or Google according to their billing policies. Nmood does not control the timing or method of renewal charges.</p>
        <p>You can manage or disable automatic renewal at any time through your Apple Account or Google Play Account settings. Disabling automatic renewal does not cancel the current subscription period — Premium features remain available until the end of the paid period.</p>
      </LegalSection>

      <LegalSection id="cancellation" title="5. Cancellation">
        <p>You may cancel your Premium subscription at any time. Cancellation prevents future renewal charges but does not automatically entitle you to a refund for the current billing period.</p>
        <p><strong>To cancel through Apple:</strong> Open Settings &rarr; [Your Name] &rarr; Subscriptions &rarr; Nmood &rarr; Cancel Subscription.</p>
        <p><strong>To cancel through Google Play:</strong> Open the Google Play Store &rarr; [Your Profile] &rarr; Payments & subscriptions &rarr; Subscriptions &rarr; Nmood &rarr; Cancel subscription.</p>
        <p>After cancellation, Premium features remain available until the end of the current billing period. No further charges will be applied.</p>
        <p>For refund requests, please refer to our Refund Policy (LP-004).</p>
      </LegalSection>

      <LegalSection id="downgrade" title="6. Expiry & Downgrade">
        <p>When your Premium subscription expires or is cancelled, your account automatically reverts to the standard (Explorer) membership.</p>
        <p>Upon downgrade:</p>
        <LegalBulletList items={[
          'You will no longer have access to unlimited Circle and Experience joins (Explorer limits apply).',
          'You will no longer have access to unlimited connection requests (Explorer limits apply).',
          'Private messaging may be restricted to existing connections only.',
          'AI Concierge requests will be limited to 3 per 24 hours.',
          'Your profile, connections, and Circle memberships are preserved.',
        ]} />
      </LegalSection>

      <LegalSection id="trial" title="7. Free Trials & Promotions">
        <p>Nmood may offer free trials, introductory pricing, or promotional discounts from time to time. Unless otherwise stated:</p>
        <LegalBulletList items={[
          'A free trial converts to a paid subscription at the end of the trial period unless cancelled before the trial ends.',
          'Promotional pricing applies only during the stated promotional period.',
          'Standard pricing applies after the promotional period ends.',
          'Only one promotional offer per account unless otherwise stated.',
        ]} />
        <p>You can cancel a free trial at any time before the trial period ends to avoid being charged.</p>
      </LegalSection>

      <LegalSection id="platforms" title="8. Platform-Specific Terms">
        <p><strong>Apple App Store:</strong> Subscriptions purchased through Apple are governed by Apple's terms of service and Apple's subscription policies. Payment and renewal are managed by Apple. Refund requests for Apple purchases must be submitted to Apple.</p>
        <p><strong>Google Play Store:</strong> Subscriptions purchased through Google Play are governed by Google's terms of service and Google's subscription policies. Payment and renewal are managed by Google. Refund requests for Google purchases must be submitted to Google.</p>
        <p>Nmood validates subscription entitlements using store-provided receipts. If a receipt cannot be validated, Premium access may be temporarily suspended until validation is restored.</p>
      </LegalSection>

      <LegalSection id="changes" title="9. Price Changes">
        <p>Nmood may change subscription pricing for future billing periods. Any price change will be communicated through the app or via email before the new price takes effect.</p>
        <p>If you do not agree with a price change, you may cancel your subscription before the renewal date to avoid being charged at the new price. Continued use after the effective date of a price change constitutes acceptance of the new price, except where applicable law requires additional consent.</p>
      </LegalSection>

      <LegalSection id="obligations" title="10. Member Obligations">
        <p>You agree to:</p>
        <LegalBulletList items={[
          'Provide accurate billing account information and keep it up to date.',
          'Not share, transfer, or resell your Premium subscription or account.',
          'Not attempt to bypass, circumvent, or fraudulently obtain Premium features.',
          'Use Premium features in accordance with our Terms of Service and Community Guidelines.',
        ]} />
        <p>Violation of these obligations may result in suspension or termination of your Premium membership without refund, in accordance with our Terms of Service.</p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <p>For subscription, billing, or cancellation enquiries, contact us at <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a>.</p>
        <p>For legal or business correspondence, contact us at <a href={`mailto:${LEGAL_CONTACTS.business}`} className="text-primary hover:underline">{LEGAL_CONTACTS.business}</a>.</p>
      </LegalSection>
    </LegalPageShell>
  );
}