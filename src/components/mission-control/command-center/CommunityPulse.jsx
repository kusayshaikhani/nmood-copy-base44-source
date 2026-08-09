import React from 'react';
import { Users, Link2, MessageCircle, Calendar, UsersRound, ShieldCheck, Crown } from 'lucide-react';
import CommandSection from './CommandSection';
import { MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * MC-R1 — Community group: Members · Connections · Experiences · Circles.
 * All values are live (zero when no records). No "Awaiting data".
 */
export default function CommunityPulse({ pulse, loading }) {
  const { t } = useLocalization();
  const val = (v) => (v === null || v === undefined ? 0 : v);
  return (
    <CommandSection icon={Users} title={t('mission.community')} action={<span className="text-[10px] text-muted-foreground">{t('mission.members_connections_experiences_circles')}</span>}>
      <MCKpiGrid>
        <MCKpiCard icon={Users} label="Members Online" value={val(pulse.online)} loading={loading} color="primary" />
        <MCKpiCard icon={Users} label="Daily Active" value={val(pulse.dau)} loading={loading} color="info" />
        <MCKpiCard icon={Users} label="Weekly Active" value={val(pulse.wau)} loading={loading} color="info" />
        <MCKpiCard icon={Users} label="Monthly Active" value={val(pulse.mau)} loading={loading} color="info" />
        <MCKpiCard icon={Users} label="New Today" value={val(pulse.newToday)} loading={loading} color="success" />
        <MCKpiCard icon={ShieldCheck} label="Verified Members" value={val(pulse.verified)} loading={loading} color="primary" />
        <MCKpiCard icon={Crown} label="Premium Members" value={val(pulse.premium)} loading={loading} color="warning" />
        <MCKpiCard icon={Link2} label="Connections Today" value={val(pulse.connectionsToday)} loading={loading} color="primary" />
        <MCKpiCard icon={MessageCircle} label="Messages Today" value={val(pulse.messagesToday)} loading={loading} color="primary" />
        <MCKpiCard icon={Calendar} label="Experiences Today" value={val(pulse.experiencesToday)} loading={loading} color="primary" />
        <MCKpiCard icon={UsersRound} label="Circles Today" value={val(pulse.circlesToday)} loading={loading} color="primary" />
      </MCKpiGrid>
    </CommandSection>
  );
}