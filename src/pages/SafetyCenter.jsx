import React from 'react';
import SafetyHeader from '@/components/safety/SafetyHeader';
import OrganizerTrustCard from '@/components/safety/OrganizerTrustCard';
import { useOrganizerTrust } from '@/lib/organizer-trust';
import { useAuth } from '@/lib/AuthContext';
import { useLocalization } from '@/lib/i18n/useLocalization';
import StayingSafeSection from '@/components/safety/StayingSafeSection';
import EmergencySection from '@/components/safety/EmergencySection';
import ReportSection from '@/components/safety/ReportSection';
import BlockedMembersSection from '@/components/safety/BlockedMembersSection';
import CommunityGuidelinesSection from '@/components/safety/CommunityGuidelinesSection';
import PrivacyShortcutsSection from '@/components/safety/PrivacyShortcutsSection';
import HelpSupportSection from '@/components/safety/HelpSupportSection';

export default function SafetyCenter() {
  const { user } = useAuth();
  const { t } = useLocalization();
  const { trust, loading } = useOrganizerTrust(user?.id);

  return (
    <div className="max-w-2xl mx-auto">
      <SafetyHeader />

      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3">{t('safety.organizer_trust')}</h2>
        <OrganizerTrustCard trust={trust} loading={loading} showHeader={false} />
        <p className="text-xs text-muted-foreground mt-2 px-1">
          {t('safety.organizer.description')}
        </p>
      </section>

      <StayingSafeSection />
      <EmergencySection />
      <ReportSection />
      <BlockedMembersSection />
      <CommunityGuidelinesSection />
      <PrivacyShortcutsSection />
      <HelpSupportSection />
    </div>
  );
}