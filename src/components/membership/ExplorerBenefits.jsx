import React from 'react';
import { Check, Lock, Gauge } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExplorerBenefits() {
  const { t } = useLocalization();
  const benefits = [
    t('membership.benefit.join_experiences'),
    t('membership.benefit.join_circles'),
    t('membership.benefit.become_pals'),
    t('membership.benefit.group_chats'),
    t('membership.benefit.create_profile'),
    t('membership.benefit.search_discover'),
  ];

  const limits = [
    t('membership.limit.connections'),
    t('membership.limit.experiences'),
    t('membership.limit.circles'),
  ];

  const locked = [
    t('membership.locked.profile_views'),
    t('membership.locked.private_messaging'),
    t('membership.locked.advanced_filters'),
    t('membership.locked.priority_visibility'),
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