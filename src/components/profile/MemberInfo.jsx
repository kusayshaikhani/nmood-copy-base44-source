import React from 'react';
import { Calendar, Activity, Compass, Users, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MemberInfo({ member, user }) {
  const { t } = useLocalization();
  const info = [
    { icon: Calendar, label: t('profile.info.member_since'), value: user?.created_date ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : t('profile.info.recently') },
    { icon: Activity, label: t('profile.info.activities_joined'), value: '—' },
    { icon: Compass, label: t('profile.info.activities_hosted'), value: '—' },
    { icon: Users, label: t('profile.info.circles_created'), value: '—' },
    { icon: Users, label: t('profile.info.pals'), value: '—' },
    { icon: Globe, label: t('profile.info.languages_spoken'), value: (member?.languages?.join(', ')) || '—' },
  ];

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-4">{t('profile.info.title')}</h2>
      <div className="space-y-0.5">
        {info.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground flex-1">{item.label}</span>
              <span className="text-sm font-medium text-end">{item.value}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}