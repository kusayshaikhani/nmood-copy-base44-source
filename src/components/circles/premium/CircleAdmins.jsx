import React from 'react';
import { Crown, BadgeCheck, Star, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Premium admin/organizer cards. Shows the circle host (and any organizer-role
 * members) with avatar, role, trust score, and a View Profile affordance.
 */
export default function CircleAdmins({ circle, admins }) {
  const { t } = useLocalization();
  const list = (admins && admins.length > 0)
    ? admins
    : [{ member_name: circle.host?.name, member_avatar: circle.host?.avatar, role: 'organizer' }];

  return (
    <div className="space-y-3">
      <h2 className="text-section-title font-semibold">{t('circles.detail.admins_title')}</h2>
      <div className="space-y-3">
        {list.map((m, i) => {
          const name = m.member_name || m.name || 'Organizer';
          const avatar = m.member_avatar || m.avatar || '';
          return (
            <div key={i} className="pressable flex items-center gap-3 p-3.5 rounded-card bg-card border border-border/60 shadow-soft">
              <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{name}</p>
                  <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  {circle.is_featured && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </div>
                <p className="text-caption text-muted-foreground capitalize">{t('circles.members.role_organizer')}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-medium text-muted-foreground">{t('circles.detail.trust_score')}: 4.9</span>
                </div>
              </div>
              <button type="button" className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/15 transition-default">
                {t('circles.detail.view_profile')}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}