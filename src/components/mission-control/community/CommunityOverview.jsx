import React from 'react';
import { CalendarDays, Users, Flag, Star, Archive, EyeOff } from 'lucide-react';
import { MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';

/** MC-UX-001 — Single shared Community Overview (combined Experiences + Circles). */
export default function CommunityOverview({ overview, loading }) {
  return (
    <MCKpiGrid>
      <MCKpiCard icon={CalendarDays} label="Active Experiences" value={overview.activeExperiences} loading={loading} color="primary" />
      <MCKpiCard icon={Users} label="Active Circles" value={overview.activeCircles} loading={loading} color="primary" />
      <MCKpiCard icon={CalendarDays} label="Experiences Created Today" value={overview.experiencesToday} loading={loading} color="info" />
      <MCKpiCard icon={Users} label="Circles Created Today" value={overview.circlesToday} loading={loading} color="info" />
      <MCKpiCard icon={Star} label="Featured Content" value={overview.featuredContent} loading={loading} color="warning" />
      <MCKpiCard icon={Flag} label="Reported Content" value={overview.reportedContent} loading={loading} color="destructive" />
      <MCKpiCard icon={Archive} label="Archived Content" value={overview.archivedContent} loading={loading} />
      <MCKpiCard icon={EyeOff} label="Hidden Content" value={overview.hiddenContent} loading={loading} />
    </MCKpiGrid>
  );
}