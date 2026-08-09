import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, TrendingUp, Activity, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CommunityInsights({ community }) {
  const { t } = useLocalization();
  const stats = community.insights || {};
  const items = [
    { icon: Users, label: 'Members', value: community.member_count },
    { icon: Calendar, label: 'Experiences Hosted', value: stats.experiences_hosted ?? 0 },
    { icon: Activity, label: 'Avg Attendance', value: stats.avg_attendance ?? 0 },
    { icon: TrendingUp, label: 'Growth (mo)', value: `+${stats.growth_rate ?? 0}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-3.5 text-center">
                <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">{t('hosting.analytics.most_active')}</h3>
        </div>
        <div className="space-y-2">
          {(stats.most_active || []).map((name, i) => {
            const member = community.members?.find((m) => m.name === name);
            return (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <Avatar className="w-7 h-7">
                  <AvatarImage src={member?.avatar} alt={name} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{name}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">{t('hosting.analytics.growth_trend')}</h3>
        <div className="flex items-end gap-1.5 h-20">
          {[40, 55, 50, 70, 65, 85, 100].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="w-full rounded-t bg-gradient-to-t from-primary to-accent min-h-[4px]"
              />
              <span className="text-[9px] text-muted-foreground">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}