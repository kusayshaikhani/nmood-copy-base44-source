import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import CommandSection from './CommandSection';
import { MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * MC-R1 — Trust & Safety group: Reports · Appeals · Warnings · Suspensions.
 * All values are live (zero when no records). No "Awaiting data".
 */
export default function TrustSafetyPulse({ pulse, loading }) {
  const { t } = useLocalization();
  const val = (v) => (v === null || v === undefined ? 0 : v);
  const action = <Link to="/mission-control/trust-safety" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">{t('mission.open')} <ChevronRight className="w-3 h-3" /></Link>;
  return (
    <CommandSection icon={ShieldCheck} title={t('mission.trust_safety')} action={action}>
      <MCKpiGrid>
        <MCKpiCard icon={ShieldCheck} label="Open Reports" value={val(pulse.openReports)} loading={loading} color="primary" />
        <MCKpiCard icon={ShieldCheck} label="Critical Reports" value={val(pulse.highPriority)} loading={loading} color="destructive" />
        <MCKpiCard icon={ShieldCheck} label="Pending Appeals" value={val(pulse.pendingAppeals)} loading={loading} color="warning" />
        <MCKpiCard icon={ShieldCheck} label="Active Warnings" value={val(pulse.activeWarnings)} loading={loading} color="warning" />
        <MCKpiCard icon={ShieldCheck} label="Suspended Members" value={val(pulse.activeSuspensions)} loading={loading} color="warning" />
        <MCKpiCard icon={ShieldCheck} label="Banned Members" value={val(pulse.activeBans)} loading={loading} color="destructive" />
        <MCKpiCard icon={ShieldCheck} label="AI Flagged Cases" value={val(pulse.aiFlagged)} loading={loading} color="primary" />
        <MCKpiCard icon={ShieldCheck} label="Avg Resolution Time" value={val(pulse.avgResolution)} loading={loading} color="info" />
      </MCKpiGrid>
    </CommandSection>
  );
}