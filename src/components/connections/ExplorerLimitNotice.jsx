import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';
import { nextAvailableMs, formatCountdown } from '@/lib/relationship-state';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExplorerLimitNotice() {
  const { t } = useLocalization();
  const { membership, isPremium, check } = useMembershipAccess();
  const perm = check(FEATURES.CONNECTION_REQUEST);
  const limitReached = !isPremium && !perm.allowed && perm.reason === 'limit_reached';
  const [, tick] = useState(0);

  useEffect(() => {
    if (!limitReached) return;
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [limitReached]);

  if (!limitReached) return null;
  const ms = nextAvailableMs(membership);

  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30 mb-4">
      <Lock className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
      <div className="text-xs space-y-0.5">
        <p className="font-semibold text-warning">{t('connections.limit.title')}</p>
        <p className="text-muted-foreground">
          {t('connections.limit.desc')}
        </p>
        {ms > 0 && <p className="text-foreground font-medium">{t('connections.limit.next_available', { time: formatCountdown(ms) })}</p>}
      </div>
    </div>
  );
}