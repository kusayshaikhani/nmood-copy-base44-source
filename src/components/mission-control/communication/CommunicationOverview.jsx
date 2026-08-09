import React from 'react';
import { Send, Bell, MessageSquare, Mail, Megaphone, Clock, AlertTriangle, CheckCircle, Eye, MousePointerClick } from 'lucide-react';
import { MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';

export default function CommunicationOverview({ overview, loading }) {
  return (
    <MCKpiGrid>
      <MCKpiCard icon={Send} label="Sent Today" value={overview.sentToday} loading={loading} color="primary" />
      <MCKpiCard icon={Bell} label="Push" value={overview.push} loading={loading} color="info" />
      <MCKpiCard icon={MessageSquare} label="In-App" value={overview.inApp} loading={loading} color="info" />
      <MCKpiCard icon={Mail} label="Email" value={overview.email} loading={loading} color="info" />
      <MCKpiCard icon={Megaphone} label="Announcements" value={overview.announcements} loading={loading} color="info" />
      <MCKpiCard icon={Clock} label="Scheduled" value={overview.scheduled} loading={loading} color="warning" />
      <MCKpiCard icon={AlertTriangle} label="Failed" value={overview.failed} loading={loading} color="destructive" />
      <MCKpiCard icon={CheckCircle} label="Delivery Rate" value={overview.deliveryRate + '%'} loading={loading} color="success" />
      <MCKpiCard icon={Eye} label="Open Rate" value={overview.openRate + '%'} loading={loading} color="primary" />
      <MCKpiCard icon={MousePointerClick} label="Click Rate" value={overview.clickRate + '%'} loading={loading} color="primary" />
    </MCKpiGrid>
  );
}