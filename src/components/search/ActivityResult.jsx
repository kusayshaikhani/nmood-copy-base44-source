import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ActivityResult({ result }) {
  const { t } = useLocalization();
  const isCircle = result.type === 'circle';
  const to = isCircle ? `/circle/${result.id}` : `/experience/${result.id}`;
  return (
    <Link
      to={to}
      onClick={() => trackProductEvent(PRODUCT_EVENTS.SEARCH_RESULT_SELECTED, { resultType: isCircle ? 'circle' : 'experience' })}
      className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-default cursor-pointer"
    >
      <img src={result.image} alt={result.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge variant={isCircle ? 'secondary' : 'default'} className="text-[10px] py-0 px-1.5">
            {isCircle ? t('discovery.badge.circle') : t('discovery.badge.experience')}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{result.category}</span>
        </div>
        <h3 className="text-sm font-semibold truncate">{result.title}</h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{result.distance}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{result.time}</span>
        </div>
      </div>
    </Link>
  );
}