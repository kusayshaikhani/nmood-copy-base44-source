import React from 'react';
import { MapPin, Flag, Sparkles, Star, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';
import { getCountry } from '@/lib/master-data';
import { resolveAvatar } from '@/lib/gallery-normalizer';
import ConnectButton from '@/components/connections/ConnectButton';

/**
 * Free-tier teaser — the lightest access level for unconnected, non-paying
 * viewers. Shows just enough to feel the person (photo, name, location, a few
 * interests) and an elegant upgrade CTA. No bio, languages, lifestyle, gallery
 * or age — those are reserved for Premium / connections.
 */
export default function ProfileTeaserView({ profile, displayName, isSelf, sharedInterests, onReport, onUpgrade, connectMember }) {
  const { t } = useLocalization();
  const interests = (profile?.interests || []).slice(0, 4);
  const avatarUrl = resolveAvatar(profile);

  // Resolve a country value (ISO key or English name) to its display name.
  const countryName = (val) => {
    if (!val) return '';
    const c = getCountry(String(val).toLowerCase()) || getCountry(val);
    return c?.name || val;
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Hero */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-primary/20 via-accent/15 to-emerald-200/20 dark:to-emerald-900/20" />
        <div className="px-5 pb-5 -mt-12">
          <div className="flex items-end justify-between">
            <Avatar className="w-24 h-24 border-4 border-card shadow-sm">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {(displayName || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isSelf && (
              <Badge variant="outline" className="gap-1 text-muted-foreground mb-1">
                <Sparkles className="w-3 h-3" /> {t('profile.public.self_note')}
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-3">{displayName || t('profile.public.pal')}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            {profile?.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city}</span>}
            {profile?.country && <span className="flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> {countryName(profile.country)}</span>}
          </div>
        </div>
      </div>

      {/* A few visible interests */}
      {interests.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Sparkles className="w-4 h-4 text-primary" /> {t('profile.about.interests')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((i) => (
              <Badge key={i} className={sharedInterests.includes(i) ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'bg-secondary text-secondary-foreground'}>
                {sharedInterests.includes(i) && <Star className="w-3 h-3 mr-1" />}{categoryLabel(t, i)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Connect prompt — encourages a Pal link without a hard wall */}
      {connectMember && (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
          <ConnectButton member={connectMember} fullWidth={false} className="w-full" />
          <button type="button" onClick={onReport} className="mt-3 text-xs text-muted-foreground hover:text-destructive transition-default">
            {t('profile.safety.report_action')}
          </button>
        </div>
      )}

      {/* Premium upsell — spacious vertical block, clear hierarchy, full-width CTA */}
      {!isSelf && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-accent/[0.05] to-transparent p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Crown className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold tracking-tight text-foreground">{t('profile.public.upgrade_title')}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('profile.public.teaser_desc')}</p>
            </div>
          </div>
          <Button onClick={onUpgrade} className="mt-4 w-full h-11 gap-2">
            <Crown className="w-4 h-4" /> {t('profile.public.upgrade_cta')}
          </Button>
        </div>
      )}
    </div>
  );
}