import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import HomeWidget from './HomeWidget';
import HomeEmptyState from './HomeEmptyState';
import CircleCard from '@/components/circles/CircleCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * HM-UX-001 Widget 5 — Circles Near You.
 * Horizontal rail of recommended circles titled with the member's city, with a
 * Show All action and a warm, actionable empty state.
 */
export default function CirclesNearYou({ circles, city }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const title = city ? t('home.circles_near_city', { city }) : t('home.circles_near_you');
  const list = (circles || []).slice(0, 6);

  return (
    <HomeWidget icon={MapPin} title={title} onSeeAll={() => navigate('/communities')}>
      {list.length === 0 ? (
        <HomeEmptyState
          icon={MapPin}
          message={t('home.circles.empty')}
          actionLabel={t('home.circles.create')}
          onAction={() => navigate('/host/create')}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {list.map((c) => (
            <CircleCard key={c.id} circle={c} />
          ))}
        </div>
      )}
    </HomeWidget>
  );
}