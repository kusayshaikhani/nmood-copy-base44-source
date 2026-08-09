import React from 'react';
import { MessageSquare, Link2, CalendarCheck, CheckCircle2, UsersRound, Activity } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import { BiLineChart } from './BiChart';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** FM-010 — Engagement analytics with historical trend charts. */
export default function BiEngagement({ engagement }) {
  const { t } = useLocalization();
  const e = engagement || {};
  return (
    <div className="space-y-4">
      <MCKpiGrid>
        <MCKpiCard icon={MessageSquare} label="Messages Sent" value={e.messagesSent ?? 0} color="info" />
        <MCKpiCard icon={Link2} label="Connections Created" value={e.connectionsCreated ?? 0} color="primary" />
        <MCKpiCard icon={CalendarCheck} label="Experiences Joined" value={e.experiencesJoined ?? 0} color="success" />
        <MCKpiCard icon={CheckCircle2} label="Experiences Completed" value={e.experiencesCompleted ?? 0} color="success" />
        <MCKpiCard icon={UsersRound} label="Circles Joined" value={e.circlesJoined ?? 0} color="primary" />
        <MCKpiCard icon={Activity} label="Circle Activity" value={e.circleActivity ?? 0} color="info" />
        <MCKpiCard icon={Activity} label="Session Duration" value="Soon" color="warning" sublabel="Awaiting telemetry" />
        <MCKpiCard icon={Activity} label="Daily Engagement Score" value="Soon" color="warning" sublabel="Awaiting telemetry" />
      </MCKpiGrid>
      <MCSection icon={MessageSquare} title={t('mission.messages_sent_14_days')}>
        <BiLineChart data={e.trend || []} lines={[{ key: 'value', name: 'Messages', color: 'hsl(var(--chart-1))' }]} />
      </MCSection>
    </div>
  );
}