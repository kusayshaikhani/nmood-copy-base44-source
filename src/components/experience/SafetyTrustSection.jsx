import React from 'react';
import { BadgeCheck, Shield, Flag } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SafetyTrustSection({ experience, onReport }) {
  const { t } = useLocalization();
  const { verified } = experience;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg">{t('experiences.safety.trust_title')}</h2>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${verified ? 'bg-success/10' : 'bg-muted'}`}>
            <BadgeCheck className={`w-5 h-5 ${verified ? 'text-success' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{verified ? t('experiences.safety.verified') : t('experiences.safety.unverified')}</p>
            <p className="text-xs text-muted-foreground">{verified ? t('experiences.safety.verified_desc') : t('experiences.safety.unverified_desc')}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
          <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-info" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1.5">
            {t('experiences.safety.tip')}
          </p>
        </div>

        <button
          onClick={onReport}
          type="button"
          className="w-full flex items-center gap-2 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-default text-start"
        >
          <Flag className="w-4 h-4 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive font-medium">{t('experiences.safety.report')}</span>
        </button>
      </div>
    </div>
  );
}