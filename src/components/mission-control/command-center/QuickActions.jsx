import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import CommandSection from './CommandSection';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  Search, ShieldCheck, Megaphone, Bell, Mail, Star, UsersRound, Wrench, Siren, BarChart3, Lock,
} from 'lucide-react';

const ACTIONS = [
  { label: 'Search Member', icon: Search, to: '/mission-control/members' },
  { label: 'Open Trust & Safety', icon: ShieldCheck, to: '/mission-control/trust-safety' },
  { label: 'Send Announcement', icon: Megaphone, to: '/mission-control/notifications' },
  { label: 'Send Push Notification', icon: Bell, to: '/mission-control/notifications' },
  { label: 'Send Email Broadcast', icon: Mail, to: '/mission-control/notifications' },
  { label: 'Feature Experience', icon: Star, to: '/mission-control/community' },
  { label: 'Feature Circle', icon: UsersRound, to: '/mission-control/community' },
  { label: 'Maintenance Mode', icon: Wrench, to: '/mission-control/platform-settings' },
  { label: 'Emergency Broadcast', icon: Siren, to: '/mission-control/notifications' },
  { label: 'Open Analytics', icon: BarChart3, to: '/mission-control/analytics' },
  { label: 'Open Security', icon: Lock, to: '/mission-control/security' },
];

export default function QuickActions() {
  const { t } = useLocalization();
  return (
    <CommandSection icon={Zap} title={t('admin.quick_actions')}>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <Link key={a.label} to={a.to}
            className="flex flex-col items-center gap-1.5 rounded-lg border bg-card/60 p-3 hover:bg-primary/10 hover:border-primary/30 transition-default">
            <a.icon className="w-5 h-5 text-primary" />
            <span className="text-[11px] font-medium text-center leading-tight">{a.label}</span>
          </Link>
        ))}
      </div>
    </CommandSection>
  );
}