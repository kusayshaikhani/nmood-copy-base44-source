import React from 'react';
import { Compass, Check, Users, TrendingUp, Bookmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function HostAnalytics({ analytics }) {
  const { t } = useLocalization();
  const stats = [
    { label: 'Created', value: analytics.activitiesCreated, icon: Compass },
    { label: 'Completed', value: analytics.activitiesCompleted, icon: Check },
    { label: 'Participants', value: analytics.totalParticipants, icon: Users },
    { label: 'Avg Attendance', value: analytics.averageAttendance, icon: TrendingUp },
    { label: 'Saved', value: analytics.savedActivities, icon: Bookmark },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold mb-3 px-1">{t('hosting.analytics.title')}</h2>
      <Card className="p-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex-shrink-0 w-20 text-center">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-1.5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-lg font-bold leading-tight">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}