import PremiumMoment from '@/components/membership/PremiumMoment';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import React from 'react';
import { Sparkles, Star, Crown } from 'lucide-react';
import ProfileMediaHeader from '../ProfileMediaHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';
import { getCountry } from '@/lib/master-data';
import { resolveAvatar } from '@/lib/gallery-normalizer';
import VerifiedBadge from '@/components/profile/VerifiedBadge';
import MemberIndicators from '@/components/profile/MemberIndicators';

/**
 * Free-tier teaser — the lightest access level for unconnected, non-paying
 * viewers. Shows just enough to feel the person (photo, name, location, a few
 * interests) and an elegant upgrade CTA. No bio, languages, lifestyle, gallery
 * or age — those are reserved for Premium / connections.
 */
export default function ProfileTeaserView({ profile, displayName, identityVerified, isSelf, sharedInterests, onUpgrade, showUpgradePrompt = true }) {
  const { t } = useLocalization();
  const interests = (profile?.interests || []).slice(0, 4);
  const avatarUrl = resolveAvatar({ photo_url:profile?.photo_url });

  // Resolve a country value (ISO key or English name) to its display name.
  const countryName = (val) => {
    if (!val) return '';
    const c = getCountry(String(val).toLowerCase()) || getCountry(val);
    return c?.name || val;
  };

  return (
    <div className="space-y-5 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <ProfileMediaHeader key={profile?.id} avatarUrl={avatarUrl} displayName={displayName||t('profile.public.pal')}
        location={[profile?.city,countryName(profile?.country)].filter(Boolean).join(', ')}
        verified={identityVerified?<VerifiedBadge className="text-white"/>:null}
        badge={isSelf?<Badge className="border-white/25 bg-white/10 text-white">{t('profile.public.self_note')}</Badge>:null}
        indicators={<MemberIndicators memberId={profile?.id} profile className="text-white/90"/>}
      />

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

      {/* Premium upsell — spacious vertical block, clear hierarchy, full-width CTA */}
      {MAIN_PASSPORT && !isSelf && showUpgradePrompt && <PremiumMoment moment="profile"/>}
      {!MAIN_PASSPORT && !isSelf && showUpgradePrompt && (
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