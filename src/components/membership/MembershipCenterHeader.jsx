import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLANS, formatRenewalDate } from '@/lib/membership-engine';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MembershipCenterHeader() {
  const { t } = useLocalization();
  const { membership, isPremium } = useMembershipAccess();
  const plan = membership?.plan ? PLANS.find((p) => p.id === membership.plan) : null;

  return (
    <Card className={`p-5 ${isPremium ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPremium ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {isPremium ? <Crown className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{isPremium ? t('membership.premium') : t('membership.explorer')}</h3>
            <Badge variant={isPremium ? 'default' : 'secondary'} className="capitalize">
              {membership?.status || 'active'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>
              {isPremium
                ? plan
                  ? `${plan.label} · ${membership?.auto_renew ? t('membership.renews_automatically') : t('membership.manual_renewal')}`
                  : t('membership.premium_member')
                : t('membership.free_plan')}
            </p>
            {isPremium && membership?.expires_at && (
              <p>{membership?.auto_renew ? t('membership.renews_on') : t('membership.expires_on')} {formatRenewalDate(membership)}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}