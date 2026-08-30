import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useAuth } from '@/lib/AuthContext';
import { getRecommendedNmoods } from '@/lib/nmood-recommendations';
import NmoodStatusBadge from '@/components/nmoods/NmoodStatusBadge';
import NmoodCountdown from '@/components/nmoods/NmoodCountdown';
import { computeNmoodStatus } from '@/lib/nmood-lifecycle';
import EmptyState from '@/components/shared/EmptyState';

export default function NmoodsHomeSection() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { member } = useAuth();
  const nmoods = getRecommendedNmoods({ interests: member?.interests || [] }, 6);

  if (nmoods.length === 0) {
    return (
      <div>
        <h2 className="text-section-title text-foreground min-w-0 mb-4">{t('nmoods.home.section_title')}</h2>
        <EmptyState
          compact
          icon={Sparkles}
          title="No Nmoods yet"
          description="Share what you're up for right now, or see what's happening on Nmood."
          actionLabel="Share a Nmood"
          onAction={() => navigate('/nmoods')}
          secondaryLabel="Explore"
          onSecondary={() => navigate('/explore')}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-section-title text-foreground min-w-0">{t('nmoods.home.section_title')}</h2>
        <button type="button" onClick={() => navigate('/nmoods')} className="flex items-center gap-0.5 text-sm font-medium text-primary whitespace-nowrap shrink-0">
          {t('nmoods.home.see_all')} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain -mx-6 px-6 pb-1">
        {nmoods.map((post) => (
          <button
            key={post.id}
            type="button"
            onClick={() => navigate(`/nmood/${post.id}`)}
            className="shrink-0 w-64 text-left rounded-2xl border border-border bg-card p-4 hover:shadow-card transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl leading-none">{post.category_icon}</span>
              <span className="text-xs text-muted-foreground">{post.category}</span>
              <span className="ml-auto"><NmoodStatusBadge status={computeNmoodStatus(post)} /></span>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground/80 mb-0.5">{t('nmoods.im_nmood_for')}</p>
            <p className="text-sm font-bold leading-snug mb-2 line-clamp-2">{post.intention_text}</p>
            <NmoodCountdown post={post} />
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" /> {post.distance} · {post.location}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}