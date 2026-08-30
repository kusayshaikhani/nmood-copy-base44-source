import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles } from 'lucide-react';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import UpgradeMembershipCTA from '@/components/membership/UpgradeMembershipCTA';
import { getPlan, formatRenewalDate } from '@/lib/membership-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isFounderAccessEnabled } from '@/lib/launch-mode';

export default function ProfileMembershipSection() {
  const { t } = useLocalization();
  const { isPremium, membership, cancel } = useMembershipAccess();
  const navigate = useNavigate();
  const currentPlan = isPremium ? getPlan(membership?.plan) : null;
  const renewalDate = isPremium ? formatRenewalDate(membership) : null;

  // Founder Access state — replaces Premium/Explorer label and upgrade button.
  if (isFounderAccessEnabled()) {
    return (
      <Card className="p-5 mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">{t('founder_access.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('founder_access.message')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/settings')}>
          {t('founder_access.got_it')}
        </Button>
      </Card>
    );
  }

  return (
    <Card className={`p-5 mb-6 ${isPremium ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30' : 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPremium ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {isPremium ? <Crown className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <h3 className="font-bold">{isPremium ? t('membership.premium_member_label') : t('membership.explorer_member_label')}</h3>
          {isPremium ? (
            <p className="text-xs text-muted-foreground">
              {currentPlan?.label ? `${currentPlan.label}` : null}
              {currentPlan?.label && renewalDate ? ' · ' : ''}
              {renewalDate ? `Renews ${renewalDate}` : null}
              {!currentPlan?.label && !renewalDate ? <span className="capitalize">{membership?.status || 'active'}</span> : null}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground capitalize">{membership?.status || 'active'}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {isPremium ? (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => cancel()}>
            {t('membership.manage')}
          </Button>
        ) : (
          <UpgradeMembershipCTA source="profile_membership_section" className="flex-1" />
        )}
      </div>
    </Card>
  );
}