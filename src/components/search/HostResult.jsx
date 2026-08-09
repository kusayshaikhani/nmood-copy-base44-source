import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function HostResult({ host }) {
  const { t } = useLocalization();
  const initials = host.name.split(' ').map((n) => n[0]).join('').toUpperCase();
  return (
    <Link
      to="/profile"
      onClick={() => trackProductEvent(PRODUCT_EVENTS.SEARCH_RESULT_SELECTED, { resultType: 'host' })}
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-default cursor-pointer"
    >
      <Avatar className="w-14 h-14 flex-shrink-0">
        <AvatarImage src={host.avatar} alt={host.name} />
        <AvatarFallback className="bg-gradient-to-br from-warning to-primary text-white text-sm font-bold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold truncate">{host.name}</h3>
          <Badge className="text-[10px] py-0 px-1.5 gap-0.5">
            <Crown className="w-2.5 h-2.5" />{t('search.host.badge')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{t('search.host.activities', { count: host.hostedActivities })}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Globe className="w-3 h-3" />{host.languages.join(' · ')}
        </p>
      </div>
    </Link>
  );
}