import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Row({ label, value }) {
  const placeholder = value === null || value === undefined;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={placeholder ? 'text-sm text-muted-foreground/60 font-medium' : 'text-sm font-semibold'}>{placeholder ? 'Awaiting telemetry' : value}</span>
    </div>
  );
}

export default function AiSafety({ safety }) {
  const { t } = useLocalization();
  return (
    <MCSection icon={ShieldAlert} title={t('mission.ai_safety')}>
      <Row label="Safety Flags" value={safety.safetyFlags} />
      <Row label="Blocked Responses" value={safety.blockedResponses} />
      <Row label="Sensitive Content Events" value={safety.sensitiveContentEvents} />
      <Row label="Bias Alerts" value={safety.biasAlerts} />
      <Row label="Harm Prevention Events" value={safety.harmPreventionEvents} />
      <Row label="Policy Violations" value={safety.policyViolations} />
      <p className="text-[10px] text-muted-foreground/70 mt-2">{t('mission.drilldown_investigation_reserved_for_future')}</p>
    </MCSection>
  );
}