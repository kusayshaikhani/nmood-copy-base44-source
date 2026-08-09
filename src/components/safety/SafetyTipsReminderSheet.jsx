import React from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { MapPin, UserCheck, Heart, Shield } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const DISMISS_KEY = 'inmood_safety_tips_dismissed';

const tips = [
  { icon: MapPin, key: 'safety.tips.meet_public' },
  { icon: UserCheck, key: 'safety.tips.tell_someone' },
  { icon: Heart, key: 'safety.tips.trust_instincts' },
];

export function isSafetyTipsDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissSafetyTips() {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // ignore
  }
}

// Helpful reminders shown before a user's first Experience. Dismissable permanently.
export default function SafetyTipsReminderSheet({ open, onOpenChange, onContinue }) {
  const { t } = useLocalization();
  const handleContinue = () => {
    dismissSafetyTips();
    onOpenChange(false);
    if (onContinue) onContinue();
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('safety.staying_safe.stay_safe')} description={t('safety.tips.subtitle')}>
      <div className="pb-2 space-y-3">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div key={tip.key} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm flex-1 pt-1.5">{t(tip.key)}</p>
            </div>
          );
        })}
        <div className="flex items-start gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
          <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80">{t('safety.tips.review_anytime')}</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Button className="w-full" onClick={handleContinue}>{t('safety.tips.got_it')}</Button>
          <Button variant="ghost" className="w-full text-xs" onClick={handleContinue}>{t('safety.tips.dont_show')}</Button>
        </div>
      </div>
    </BottomSheet>
  );
}