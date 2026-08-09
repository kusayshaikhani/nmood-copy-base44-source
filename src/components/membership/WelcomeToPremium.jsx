import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { emitMembershipChanged } from '@/lib/subscription-service';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isFounderAccessEnabled } from '@/lib/launch-mode';

export default function WelcomeToPremium() {
  const { t } = useLocalization();
  const { welcomeOpen, setWelcomeOpen } = useMembershipAccess();
  const navigate = useNavigate();

  const handleDiscover = () => {
    setWelcomeOpen(false);
    emitMembershipChanged({ type: 'premium', event: 'welcome_dismissed' });
    navigate('/explore');
  };

  // Founder Access welcome — replaces "Welcome to Premium".
  if (isFounderAccessEnabled()) {
    return (
      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl">{t('founder_access.welcome_title')}</DialogTitle>
            <DialogDescription className="text-base text-foreground/80">
              {t('founder_access.welcome_desc')}
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" size="lg" onClick={handleDiscover}>
            {t('founder_access.explore_cta')}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">{t('membership.welcome_title')}</DialogTitle>
          <DialogDescription className="text-base text-foreground/80">
            {t('membership.welcome_desc_line1')}<br />{t('membership.welcome_desc_line2')}<br />{t('membership.welcome_desc_line3')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
          <Sparkles className="w-4 h-4 text-accent-foreground" />
          <span>{t('membership.recommendations_refreshing')}</span>
        </div>
        <Button className="w-full" size="lg" onClick={handleDiscover}>
          {t('membership.discover_opportunities')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}