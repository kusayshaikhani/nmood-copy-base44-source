import React from 'react';
import SmartImage from '@/components/shared/SmartImage';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { recordLocalRecommendationSignal } from '@/lib/recommendation-preferences';

export default function ActivityResult({ result }) {
  const { t } = useLocalization();
  const isCircle = result.type === 'circle';
  const to = isCircle ? `/circle/${result.id}` : `/experience/${result.id}`;
  return (
    <Link
      data-search-card={isCircle ? 'circles' : 'experiences'}
      to={to}
      onClick={() => {
        trackProductEvent(PRODUCT_EVENTS.SEARCH_RESULT_SELECTED, { resultType: isCircle ? 'circle' : 'experience' });
        recordLocalRecommendationSignal(result.category, isCircle ? 'open_circle' : 'open_experience');
      }}
      className="discovery-card compact-discovery-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SmartImage src={result.image} alt={result.title} rounded="rounded-none" className="discovery-image" />
      <div className="discovery-body">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge variant={isCircle ? 'secondary' : 'default'} className="text-[10px] py-0 px-1.5">
            {isCircle ? t('discovery.badge.circle') : t('discovery.badge.experience')}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{result.category}</span>
        </div>
        <h3 className="discovery-title">{result.title}</h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {result.distance&&<span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{result.distance}</span>}
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{result.time}</span>
        </div>
      </div>
      <span className="discovery-action">{isCircle?'View Circle':'View Experience'} ↗</span>
    </Link>
  );
}