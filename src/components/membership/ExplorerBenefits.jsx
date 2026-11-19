import { EXPLORER_MESSAGES } from '@/lib/explorer-policy';
import React from 'react';
import { Check, Lock, Gauge } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExplorerBenefits() {
  const { t } = useLocalization();
  const benefits = [
    t('membership.benefit.create_profile'),
    'Browse eligible public people, Circles, Experiences and Nmood Shares.',
  ];
  const limits = [EXPLORER_MESSAGES.allowance];

  const locked = [
    'Premium includes five Ask Nmood questions per rolling 24 hours; Explorer includes one.',
    'AI action drafts and eligible Circle/Experience group chat require Premium.',
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">{t('membership.whats_included')}</h3>
        <ul className="space-y-1.5">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> {b}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">{t('membership.explorer_limits')}</h3>
        <ul className="space-y-1.5">
          {limits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Gauge className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" /> {b}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">{t('membership.locked_on_explorer')}</h3>
        <ul className="space-y-1.5">
          {locked.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" /> {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}