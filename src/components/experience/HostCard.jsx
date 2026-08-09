import React from 'react';
import { BadgeCheck, Star, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useOrganizerTrust } from '@/lib/organizer-trust';

/**
 * Nmood Premium host card — large avatar, name + verified badge, trust score,
 * short bio, View Profile button.
 */
export default function HostCard({ experience }) {
  const { t } = useLocalization();
  const { host, verified } = experience;
  const { trust, loading } = useOrganizerTrust(experience.host_user_id);

  return (
    <div className="p-6 rounded-card border border-border/50 bg-card shadow-card">
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="w-16 h-16 rounded-full border-2 border-primary/20 shadow-soft">
          <AvatarImage src={host.avatar} alt={host.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{host.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-foreground truncate">{host.name}</span>
            {verified && <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={2.2} />}
          </div>
          <p className="text-caption text-muted-foreground">{t('experiences.host.organizer')}</p>
        </div>
        {trust && trust.averageRating !== null && (
          <div className="text-end flex-shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <Star className="w-3.5 h-3.5 fill-warning text-warning" />
              <span className="text-base font-bold text-foreground">{trust.averageRating}</span>
            </div>
            <p className="text-caption text-muted-foreground">{t('experiences.host.rating')}</p>
          </div>
        )}
      </div>

      {host.bio && (
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">{host.bio}</p>
      )}

      <div className="flex items-center justify-between">
        {loading ? (
          <span className="text-caption text-muted-foreground">…</span>
        ) : trust ? (
          <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            {t('experiences.host.hosted_count', { count: trust.experiencesHosted })}
          </span>
        ) : (
          <span className="text-caption text-muted-foreground">{t('safety.organizer.not_enough_activity')}</span>
        )}
        <Button variant="outline" size="sm" className="rounded-button">
          {t('experiences.host.view_profile')}
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}