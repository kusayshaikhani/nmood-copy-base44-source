import React, { useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, RotateCcw, HelpCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { isLegacyMembership } from '@/lib/membership-engine';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useToast } from '@/components/ui/use-toast';
import { LEGAL_CONTACTS } from '@/components/legal/LegalPageShell';
import SectionReveal from '@/components/experience/SectionReveal';
import PremiumHero from '@/components/membership/premium/PremiumHero';
import PremiumMembershipCard from '@/components/membership/premium/PremiumMembershipCard';
import PremiumBenefitsGrid from '@/components/membership/premium/PremiumBenefitsGrid';
import PremiumComparison from '@/components/membership/premium/PremiumComparison';
import PremiumFaq from '@/components/membership/premium/PremiumFaq';
import PremiumStickyCta from '@/components/membership/premium/PremiumStickyCta';
import MembershipSlogan from '@/components/membership/MembershipSlogan';

// UI-023 — Membership center, fully redesigned. Only presentation changed.
// All subscription rules (cancel/restore, tracking, status) are preserved.
export default function Membership() {
  const { t } = useLocalization();
  const { isPremium, loading, cancel, restore, showUpgrade, membership } = useMembershipAccess();
  const navigate = useNavigate();
  const { toast } = useToast();

  // SUPPORTED_PROVIDERS — only Apple App Store and Google Play are recognized
  // active purchase channels. Any other value (stripe, manual, admin, unknown,
  // missing) is rejected and the cancellation/restore flow is NOT called.
  const SUPPORTED_PROVIDERS = new Set(['apple', 'google']);
  const resolveSupportedProvider = (m) => {
    const raw = m?.payment_provider || m?.billing_platform;
    if (!raw) return null;
    const normalized = String(raw).toLowerCase().trim();
    return SUPPORTED_PROVIDERS.has(normalized) ? normalized : null;
  };

  useEffect(() => {
    trackMembershipEvent(MEMBERSHIP_EVENTS.VIEWED, { tier: isPremium ? 'premium' : 'explorer' });
    trackProductEvent(PRODUCT_EVENTS.MEMBERSHIP_SCREEN_VIEWED, { tier: isPremium ? 'premium' : 'explorer' });
  }, [isPremium]);

  const handlePrimary = useCallback(() => {
    if (isPremium) {
      document.getElementById('manage-membership')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      navigate('/upgrade');
    }
  }, [isPremium, navigate]);

  const handleCancel = async () => {
    if (!window.confirm(t('membership.cancel_confirm'))) return;
    const provider = resolveSupportedProvider(membership);
    if (!provider) {
      // Fail-closed: do not call a provider-specific cancellation flow.
      // Log safely without exposing payment data; preserve access and status.
      console.warn('[membership] cancel blocked — unsupported provider', {
        has_payment_provider: !!membership?.payment_provider,
        has_billing_platform: !!membership?.billing_platform,
      });
      toast({
        title: 'Cannot cancel automatically',
        description: `We could not identify your subscription provider. Please contact ${LEGAL_CONTACTS.support} to cancel your subscription.`,
        variant: 'destructive',
      });
      return;
    }
    try {
      await cancel(provider);
    } catch {
      // ignore
    }
  };

  const handleRestore = async () => {
    trackMembershipEvent(MEMBERSHIP_EVENTS.UPGRADE_CLICKED, { action: 'restore' });
    const provider = resolveSupportedProvider(membership);
    if (!provider) {
      console.warn('[membership] restore blocked — unsupported provider', {
        has_payment_provider: !!membership?.payment_provider,
        has_billing_platform: !!membership?.billing_platform,
      });
      toast({
        title: 'Cannot restore automatically',
        description: `We could not identify your subscription provider. Please contact ${LEGAL_CONTACTS.support} to restore your subscription.`,
        variant: 'destructive',
      });
      return;
    }
    try {
      await restore(provider);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {!isPremium && (
        <SectionReveal>
          <PremiumHero />
        </SectionReveal>
      )}

      <div className="px-4 mt-5 space-y-7">
        <SectionReveal>
          <PremiumMembershipCard onPrimary={handlePrimary} />
        </SectionReveal>

        {!isPremium && (
          <SectionReveal>
            <PremiumBenefitsGrid />
          </SectionReveal>
        )}

        {!isPremium && (
          <SectionReveal>
            <PremiumComparison currentTier={isPremium ? 'premium' : 'explorer'} />
          </SectionReveal>
        )}

        {!isPremium && (
          <SectionReveal>
            <PremiumFaq />
          </SectionReveal>
        )}

        {isPremium && (
          <SectionReveal>
            <div id="manage-membership">
              <h2 className="font-heading text-xl font-bold tracking-tight px-1 mb-4">{t('membership.manage_membership')}</h2>
              {isLegacyMembership(membership) && (
                <div className="mb-3 rounded-card border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-warning-foreground">Legacy/Test Membership.</strong> This membership has no verified App Store or Google Play transaction and cannot trigger cancellation through Apple, Google, or any web payment provider. Please contact{' '}
                  <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a>{' '}
                  for assistance.
                </div>
              )}
              <Card className="divide-y divide-border/50 rounded-card overflow-hidden shadow-soft">
                <ManageRow icon={CreditCard} label={t('membership.billing')} onClick={() => showUpgrade('billing')} />
                <ManageRow icon={RotateCcw} label={t('membership.restore_purchase')} onClick={handleRestore} />
                <ManageRow icon={HelpCircle} label={t('membership.help')} onClick={() => navigate('/help')} />
              </Card>
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive mt-3 rounded-button h-12"
                onClick={handleCancel}
              >
                <XCircle className="w-4 h-4" /> {t('membership.cancel_membership')}
              </Button>
              <p className="text-[11px] text-muted-foreground mt-2 px-1 leading-relaxed">
                Cancellation prevents future renewal charges but does not automatically entitle you to a refund for the current billing period.{' '}
                <Link to="/refund-policy" className="text-primary hover:underline">See Refund Policy</Link>.
              </p>
            </div>
          </SectionReveal>
        )}

        <SectionReveal>
          <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <Link to="/subscription-terms" className="hover:text-primary hover:underline">Subscription Terms</Link>
            <span aria-hidden>·</span>
            <Link to="/refund-policy" className="hover:text-primary hover:underline">Refund Policy</Link>
            <span aria-hidden>·</span>
            <Link to="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
          </div>
        </SectionReveal>

        <SectionReveal>
          <MembershipSlogan className="pt-2" />
        </SectionReveal>
      </div>

      <PremiumStickyCta isPremium={isPremium} onClick={handlePrimary} />
    </div>
  );
}

function ManageRow({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-4 py-4 hover:bg-muted/40 transition-default text-start"
    >
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className="text-sm font-medium flex-1">{label}</span>
    </button>
  );
}