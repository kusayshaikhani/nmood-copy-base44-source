import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NmoodHostStats({ post }) {
  const { t } = useLocalization();
  const stats = post.host_stats;
  if (!stats) return null;

  const items = [
    { key: 'attendance_rate', value: `${stats.attendance_rate}%` },
    { key: 'completion_rate', value: `${stats.completion_rate}%` },
    { key: 'response_time', value: stats.response_time },
    { key: 'successful_plans', value: stats.successful_plans },
    { key: 'community_rating', value: `★ ${stats.community_rating}` },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.key} className="rounded-xl border border-border bg-card p-2.5 text-center">
          <p className="text-base font-bold leading-tight">{item.value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t(`nmoods.host_stats.${item.key}`)}</p>
        </div>
      ))}
    </div>
  );
}