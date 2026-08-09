import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import SmartImage from '@/components/shared/SmartImage';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 — Premium search-result row.
 */
export default function SearchResultCard({ item }) {
  const { t } = useLocalization();
  const isExperience = item.type === 'experience';
  const isCommunity = item.type === 'community';
  const isCircle = item.type === 'circle';

  const link = isExperience ? `/experience/${item.id}` : isCommunity ? `/community/${item.id}` : `/circle/${item.id}`;
  const badgeClass = isExperience ? 'bg-primary/10 text-primary' : isCommunity ? 'bg-success/10 text-success' : 'bg-chart-4/10 text-chart-4';
  const badgeText = isExperience ? t('discovery.badge.experience') : isCommunity ? t('discovery.badge.community') : t('discovery.badge.circle');
  const image = isExperience ? item.image : item.cover_photo;
  const title = isExperience ? item.title : item.name;

  return (
    <Link to={link} className="flex gap-3 p-3 rounded-card border border-border/40 bg-card shadow-card hover-lift">
      <SmartImage src={image} alt={title} rounded="rounded-xl" className="w-20 h-20 flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold truncate">{title}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}>{badgeText}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mb-auto">
          {isExperience ? (
            <>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
            </>
          ) : isCommunity ? (
            <>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t('discovery.result.members', { count: item.member_count })}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t('discovery.result.members_ratio', { count: item.member_count, max: item.max_members })}</span>
              <span className="text-primary capitalize">{item.privacy === 'invite' ? t('discovery.result.invite_only') : item.privacy}</span>
            </>
          )}
          {item.distance && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.distance}</span>}
        </div>
        <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full w-fit mt-1">
          {item.mood || item.category || (isCircle && item.community_name) || ''}
        </span>
      </div>
    </Link>
  );
}