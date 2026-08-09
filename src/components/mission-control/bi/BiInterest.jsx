import React from 'react';
import { Sparkles, TrendingUp, Calendar, UsersRound } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import BiTable from './BiTable';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** FM-010 — Interest intelligence across members, experiences, and circles. */
export default function BiInterest({ interest }) {
  const { t } = useLocalization();
  const i = interest || {};
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <MCSection icon={Sparkles} title={t('admin.most_popular_interests')}>
        <BiTable columns={[{ key: 'name', label: 'Interest' }, { key: 'count', label: 'Members' }]} rows={i.popular || []} />
      </MCSection>
      <MCSection icon={TrendingUp} title={t('mission.fastest_growing_interests')}>
        <BiTable columns={[{ key: 'name', label: 'Interest' }, { key: 'count', label: 'New (30d)' }]} rows={i.fastestGrowing || []} />
      </MCSection>
      <MCSection icon={TrendingUp} title={t('mission.trending_categories')}>
        <BiTable columns={[{ key: 'name', label: 'Category' }, { key: 'count', label: 'Experiences' }]} rows={i.trendingCategories || []} />
      </MCSection>
      <MCSection icon={Calendar} title={t('mission.most_joined_experiences')}>
        <BiTable columns={[{ key: 'name', label: 'Experience' }, { key: 'joins', label: 'Joins' }]} rows={i.mostJoined || []} />
      </MCSection>
      <MCSection icon={UsersRound} title={t('mission.most_active_circles')}>
        <BiTable columns={[{ key: 'name', label: 'Circle' }, { key: 'members', label: 'Members' }]} rows={i.mostActiveCircles || []} />
      </MCSection>
      <MCSection icon={UsersRound} title={t('mission.emerging_communities_14d')}>
        <BiTable columns={[{ key: 'name', label: 'Circle' }, { key: 'members', label: 'Members' }]} rows={i.emergingCommunities || []} />
      </MCSection>
    </div>
  );
}