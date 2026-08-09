import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Shield, Users, Receipt, CreditCard, Cookie, Sparkles, Mail, Trash2,
} from 'lucide-react';
import SettingsGroupCard from '@/components/settings/premium/SettingsGroupCard';
import PremiumSettingsRow from '@/components/settings/premium/PremiumSettingsRow';
import { LEGAL_CONTACTS } from '@/components/legal/LegalPageShell';

// LP-LEGAL-CENTER — Legal & Safety section for Settings.
// Links to all 7 legal documents + Contact Support.

export default function LegalSafetySection() {
  return (
    <SettingsGroupCard title="Legal & Safety" icon={Shield} delay={0.18}>
      <PremiumSettingsRow
        icon={FileText}
        title="Terms of Service"
        subtitle="Your agreement with Nmood"
        to="/terms"
        searchKeys={['terms', 'legal', 'agreement']}
      />
      <PremiumSettingsRow
        icon={Shield}
        title="Privacy Policy"
        subtitle="How we handle your data"
        to="/privacy"
        searchKeys={['privacy', 'data', 'legal']}
      />
      <PremiumSettingsRow
        icon={Users}
        title="Community Guidelines"
        subtitle="Rules for our community"
        to="/community-guidelines"
        searchKeys={['community', 'guidelines', 'rules']}
      />
      <PremiumSettingsRow
        icon={Receipt}
        title="Refund Policy"
        subtitle="Refunds and chargebacks"
        to="/refund-policy"
        searchKeys={['refund', 'billing', 'chargeback']}
      />
      <PremiumSettingsRow
        icon={CreditCard}
        title="Subscription Terms"
        subtitle="Plans, renewal & cancellation"
        to="/subscription-terms"
        searchKeys={['subscription', 'cancellation', 'premium', 'billing']}
      />
      <PremiumSettingsRow
        icon={Cookie}
        title="Cookie Notice"
        subtitle="Cookies and tracking technologies"
        to="/cookie-notice"
        searchKeys={['cookie', 'tracking', 'local storage']}
      />
      <PremiumSettingsRow
        icon={Sparkles}
        title="AI Concierge Notice"
        subtitle="How AI recommendations work"
        to="/ai-concierge-notice"
        searchKeys={['ai', 'concierge', 'artificial intelligence']}
      />
      <PremiumSettingsRow
        icon={Shield}
        title="Safety Center"
        subtitle="Report, block, and stay safe"
        to="/safety-center"
        searchKeys={['safety', 'report', 'block', 'trust']}
      />
      <PremiumSettingsRow
        icon={Trash2}
        title="Account Deletion"
        subtitle="How to delete your account and data"
        to="/delete-account"
        searchKeys={['delete', 'account', 'deletion', 'data']}
      />
      <PremiumSettingsRow
        icon={Mail}
        title="Contact Support"
        subtitle={LEGAL_CONTACTS.support}
        to="/help"
        searchKeys={['support', 'contact', 'help']}
      />
    </SettingsGroupCard>
  );
}