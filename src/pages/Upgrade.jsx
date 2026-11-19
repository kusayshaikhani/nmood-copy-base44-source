import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { trackMembershipEvent } from '@/lib/membership-analytics';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import SectionReveal from '@/components/experience/SectionReveal';
import PremiumHero from '@/components/membership/premium/PremiumHero';
import PremiumBenefitsGrid from '@/components/membership/premium/PremiumBenefitsGrid';
import PremiumComparison from '@/components/membership/premium/PremiumComparison';
import PremiumPlans from '@/components/membership/premium/PremiumPlans';
import PremiumTrust from '@/components/membership/premium/PremiumTrust';
import PremiumFaq from '@/components/membership/premium/PremiumFaq';
import MembershipSlogan from '@/components/membership/MembershipSlogan';

// UI-023 — Premium purchase page, fully redesigned. Presentation only.
// Purchase / restore / legal logic preserved exactly as before.
export default function Upgrade() {
  const { t } = useLocalization();
  const { isPremium, loading, entitlementState } = useMembershipAccess();

  useEffect(() => {
    trackMembershipEvent('Premium Page Viewed', { tier: isPremium ? 'premium' : 'explorer' });
    trackProductEvent(PRODUCT_EVENTS.MEMBERSHIP_SCREEN_VIEWED, { source: 'premium_page' });
  }, [isPremium]);

  if (isPremium) return <Navigate to="/membership" replace />;
  // A server-confirmed Explorer can safely browse and purchase plans while
  // the native store continues its slower background reconciliation.
  if (loading && entitlementState !== 'explorer') return <p role="status" className="p-4">Checking membership…</p>;

  return (
    <div className="max-w-2xl mx-auto pb-32">
      <SectionReveal>
        <PremiumHero />
      </SectionReveal>

      <div className="px-4 mt-5 space-y-8">
        <SectionReveal>
          <PremiumBenefitsGrid />
        </SectionReveal>

        <SectionReveal>
          <PremiumComparison currentTier={isPremium ? 'premium' : 'explorer'} />
        </SectionReveal>

        <SectionReveal>
          <div id="premium-plans">
            <PremiumPlans />
          </div>
        </SectionReveal>

        <SectionReveal>
          <PremiumTrust />
        </SectionReveal>

        <SectionReveal>
          <PremiumFaq />
        </SectionReveal>

        <SectionReveal>
          <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <Link to="/subscription-terms" className="hover:text-primary hover:underline">
              Subscription Terms
            </Link>
            <span aria-hidden>·</span>
            <Link to="/refund-policy" className="hover:text-primary hover:underline">
              Refund Policy
            </Link>
            <span aria-hidden>·</span>
            <Link to="/privacy-policy" className="hover:text-primary hover:underline">
              {t('lc002.privacy.privacy_policy')}
            </Link>
            <span aria-hidden>·</span>
            <Link to="/terms" className="hover:text-primary hover:underline">
              {t('lc002.privacy.terms_of_service')}
            </Link>
          </div>
        </SectionReveal>

        <SectionReveal>
          <p className="text-center text-[11px] text-muted-foreground px-4 leading-relaxed">
            {t('membership.store_disclaimer')}
          </p>
        </SectionReveal>

        <SectionReveal>
          <MembershipSlogan className="pt-2" />
        </SectionReveal>
      </div>
    </div>
  );
}
