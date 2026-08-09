import React from 'react';
import { Card } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-022 — Soft red premium "Danger Zone" card for destructive actions.
 * Presentation only; the rows inside carry the real behaviour.
 */
export default function DangerZoneCard({ children }) {
  const { t } = useLocalization();
  return (
    <Card className="overflow-hidden rounded-card border-destructive/20 bg-destructive/[0.03] divide-y divide-destructive/10">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/[0.04]">
        <ShieldAlert className="w-4 h-4 text-destructive" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-destructive">
          {t('settings.danger_zone')}
        </h3>
      </div>
      {children}
    </Card>
  );
}