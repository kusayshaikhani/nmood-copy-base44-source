import React from 'react';
import { Info, Zap, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function JoinOptions({ experience, onJoin }) {
  const { t } = useLocalization();
  const { joinType, budget } = experience;
  const hasBudget = budget !== 'Free' && budget !== '$0';

  return (
    <div className="space-y-3">
      {hasBudget && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-info/10 border border-info/20">
          <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            {t('experiences.options.budget_notice')}
          </p>
        </div>
      )}

      {joinType === 'instant' && (
        <div className="space-y-2">
          <Button className="w-full bg-success hover:bg-success/90" size="lg" onClick={onJoin}>
            <Zap className="w-4 h-4" />{t('experiences.options.instant_join')}</Button>
          <p className="text-xs text-center text-muted-foreground">{t('experiences.options.instant_desc')}</p>
        </div>
      )}

      {joinType === 'approval' && (
        <div className="space-y-2">
          <Button className="w-full" size="lg" onClick={onJoin}>
            <Clock className="w-4 h-4" />{t('community.detail.request_join')}</Button>
          <p className="text-xs text-center text-muted-foreground">{t('experiences.options.request_desc')}</p>
        </div>
      )}

      {joinType === 'invite' && (
        <div className="space-y-2">
          <Button className="w-full" size="lg" disabled>
            <Lock className="w-4 h-4" />{t('experiences.confirm.join')}</Button>
          <p className="text-xs text-center text-muted-foreground">{t('experiences.options.invite_desc')}</p>
        </div>
      )}
    </div>
  );
}