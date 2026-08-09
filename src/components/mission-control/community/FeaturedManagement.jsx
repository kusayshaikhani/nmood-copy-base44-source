import React from 'react';
import { Star, CalendarClock } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import SmartImage from '@/components/shared/SmartImage';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function FeaturedManagement({ experiences, circles, onAction }) {
  const { t } = useLocalization();
  const featuredExp = experiences.filter((e) => e.is_featured);
  const featuredCircles = circles.filter((c) => c.is_featured);

  const Row = ({ item, type }) => (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
      <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {(item.cover_image || item.cover_photo) ? <SmartImage src={item.cover_image || item.cover_photo} alt={item.title || item.name} rounded="rounded-lg" blur={false} /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.title || item.name}</p>
        <p className="text-xs text-muted-foreground truncate">{item.host_name || '—'}</p>
      </div>
      <Button size="sm" variant="ghost" onClick={() => onAction(item, type, 'unfeature')} className="text-xs"><Star className="w-3.5 h-3.5 fill-warning text-warning" /> {t('mission.unfeature')}</Button>
    </div>
  );

  return (
    <MCSection icon={Star} title={t('mission.featured_management')}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Featured Experiences ({featuredExp.length})</h4>
          {featuredExp.length === 0 ? <p className="text-sm text-muted-foreground">{t('mission.no_featured_experiences')}</p> : <div className="space-y-2">{featuredExp.map((e) => <Row key={e.id} item={e} type="experience" />)}</div>}
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Featured Circles ({featuredCircles.length})</h4>
          {featuredCircles.length === 0 ? <p className="text-sm text-muted-foreground">{t('mission.no_featured_circles')}</p> : <div className="space-y-2">{featuredCircles.map((c) => <Row key={c.id} item={c} type="circle" />)}</div>}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        <CalendarClock className="w-4 h-4 text-primary" />
        Scheduled featured periods &amp; automatic featuring reserved for a future phase.
      </div>
    </MCSection>
  );
}