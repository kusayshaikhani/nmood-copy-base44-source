import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Horizontal avatar carousel — up to 12 member avatars with a "+N more"
 * overflow indicator and a View All affordance.
 */
export default function CircleMembersPreview({ circle, members, onViewAll }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const preview = (members || []).slice(0, 12);
  const total = circle.member_count || members.length || 0;
  const remaining = Math.max(0, total - preview.length);

  if (preview.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-section-title font-semibold">{t('circles.detail.members_preview')}</h2>
        <button type="button" onClick={onViewAll} className="inline-flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline">
          {t('common.see_all')}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar overscroll-x-contain snap-x snap-mandatory pb-1">
        {preview.map((m, i) => {
          const name = m.member_name || m.name || 'Member';
          const avatar = m.member_avatar || m.avatar || '';
          const isOrg = m.role === 'organizer';
          return (
            <button
              key={i}
              type="button"
              onClick={() => navigate('/pal/' + (m.member_user_id || m.created_by_id || ''))}
              className="snap-start flex-shrink-0 flex flex-col items-center gap-1.5 w-16 group"
            >
              <div className="relative">
                <Avatar className={`w-14 h-14 ring-2 ${isOrg ? 'ring-amber-400/50' : 'ring-primary/10'} group-active:scale-95 transition-transform`}>
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{name.charAt(0)}</AvatarFallback>
                </Avatar>
                {isOrg && (
                  <span className="absolute -bottom-0.5 -end-0.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center ring-2 ring-card">
                    <Crown className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-foreground truncate max-w-full">{name.split(' ')[0]}</span>
            </button>
          );
        })}
        {remaining > 0 && (
          <button type="button" onClick={onViewAll} className="snap-start flex-shrink-0 flex flex-col items-center gap-1.5 w-16">
            <div className="w-14 h-14 rounded-full bg-muted border border-border/60 flex items-center justify-center text-xs font-semibold text-muted-foreground">
              +{remaining}
            </div>
            <span className="text-[11px] text-muted-foreground">{t('circles.detail.more_members', { count: remaining })}</span>
          </button>
        )}
      </div>
    </div>
  );
}