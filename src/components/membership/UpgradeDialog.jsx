import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isFounderAccessEnabled } from '@/lib/launch-mode';

const LIMIT_REASONS = new Set(['join_circle', 'join_experience', 'connection_request']);

export default function UpgradeDialog() {
  const { t } = useLocalization();
  const { upgradeOpen, setUpgradeOpen, upgradeReason } = useMembershipAccess();
  const navigate = useNavigate();

  // Founder Access state — replaces all upgrade/paywall messaging.
  if (isFounderAccessEnabled()) {
    return (
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-sm w-[calc(100%-2rem)] [&>button]:top-[calc(env(safe-area-inset-top)+1.25rem)]">
          <DialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">{t('founder_access.title')}</DialogTitle>
            <DialogDescription className="text-center">{t('founder_access.message')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                setUpgradeOpen(false);
                navigate('/explore');
              }}
            >
              <Sparkles className="w-4 h-4" /> {t('founder_access.explore_cta')}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setUpgradeOpen(false)}>
              {t('founder_access.got_it')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const isLimit = LIMIT_REASONS.has(upgradeReason);
  const message = isLimit
    ? t('membership.upgrade_limit_msg')
    : upgradeReason === 'full_profile'
      ? t('membership.upgrade_full_profile')
      : t('membership.upgrade_default');

  return (
    <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] [&>button]:top-[calc(env(safe-area-inset-top)+1.25rem)]">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{t('membership.upgrade_title')}</DialogTitle>
          <DialogDescription className="text-center">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            className="flex-1 gap-2"
            onClick={() => {
              setUpgradeOpen(false);
              navigate('/membership');
            }}
          >
            <Crown className="w-4 h-4" /> {t('membership.upgrade_title')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setUpgradeOpen(false)}>
            {t('membership.maybe_later')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}