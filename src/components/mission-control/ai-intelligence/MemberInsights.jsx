import React from 'react';
import { Users } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

function BarList({ title, items, emptyLabel }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground/70 py-2">{emptyLabel || 'No data yet.'}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => {
            const max = items[0].count || 1;
            const pct = max ? Math.max(4, Math.round((it.count / max) * 100)) : 4;
            return (
              <li key={it.name} className="text-xs">
                <div className="flex justify-between mb-0.5"><span className="truncate">{it.name}</span><span className="text-muted-foreground ml-2">{it.count}</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: pct + '%' }} /></div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function MemberInsights({ insights }) {
  const { t } = useLocalization();
  return (
    <MCSection icon={Users} title={t('admin.member_insights')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BarList title={t('admin.most_popular_interests')} items={insights.popularInterests} />
        <BarList title={t('mission.emerging_interests_last_30d')} items={insights.emergingInterests} />
        <BarList title={t('mission.trending_categories')} items={insights.trendingCategories} />
        <BarList title={t('mission.popular_experiences')} items={insights.popularExperiences} />
        <BarList title={t('mission.popular_circles')} items={insights.popularCircles} />
        <BarList title={t('mission.engagement_by_age_group')} items={insights.byAgeGroup} />
        <BarList title={t('mission.engagement_by_country')} items={insights.byCountry} />
        <BarList title={t('mission.engagement_by_language')} items={insights.byLanguage} />
      </div>
    </MCSection>
  );
}