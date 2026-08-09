import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Flag, Globe, Cake, Sparkles, Star, ShieldCheck, User, Compass, Target, Heart, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel, lifestyleLabel, genderLabel } from '@/lib/i18n/label-resolvers';
import { getCountry, getLanguage, masterLabel } from '@/lib/master-data';
import { resolveAvatar, normalizeGallery } from '@/lib/gallery-normalizer';
import ConnectButton from '@/components/connections/ConnectButton';
import GalleryLightbox from './GalleryLightbox';

/**
 * Connected-tier full profile — complete profile access for Pal connections
 * and Premium subscribers. Organized into clear cards: About, Basic Info,
 * Lifestyle, Interests, Looking For, Languages, Gallery, Life Journey.
 * Only sections containing actual data are rendered.
 */
export default function ProfileFullView({ profile, displayName, sharedInterests, showAge, connectMember, onReport }) {
  const { t } = useLocalization();
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [failedThumbs, setFailedThumbs] = useState({});
  const triggerRefs = useRef([]);
  const interests = profile?.interests || [];
  const unconnected = !!connectMember;

  // Canonical avatar + gallery — one normalization path for thumbnail + lightbox.
  const avatarUrl = resolveAvatar(profile);
  const galleryItems = normalizeGallery(profile?.photo_gallery, displayName || '');

  // Reset failed-thumbnail flags whenever the gallery data changes so repaired
  // images get a fresh chance to load instead of staying stuck on the placeholder.
  useEffect(() => {
    setFailedThumbs({});
  }, [galleryItems]);

  // Resolve a country value (ISO key or English name) to its display name.
  const countryName = (val) => {
    if (!val) return '';
    const c = getCountry(String(val).toLowerCase()) || getCountry(val);
    return c?.name || val;
  };

  // Resolve a language code to its full display name (en → English).
  const languageName = (code) => {
    if (!code) return '';
    const lang = getLanguage(String(code).toLowerCase()) || getLanguage(code);
    return lang?.name || code;
  };

  // Nationality label (separate from location).
  const natVal = profile?.nationality || '';
  const isPNTS = natVal === 'prefer_not_to_say';
  const nationalityLabel = isPNTS
    ? t('profile.public.nationality_prefer_not_to_say')
    : (natVal ? countryName(natVal) : '');

  // Location string for the Basic Info card.
  const locationStr = [profile?.city, countryName(profile?.country)].filter(Boolean).join(', ');

  // Looking For, Personality, Life Goals from MemberProfile.
  const lookingFor = Array.isArray(profile?.looking_for) ? profile.looking_for : [];
  const personalityTraits = Array.isArray(profile?.personality_traits) ? profile.personality_traits : [];
  const lifeGoals = Array.isArray(profile?.life_goals) ? profile.life_goals : [];

  // Life Journey text from LifeJourney entity.
  const journeyText = profile?.journey_text || '';

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
            {unconnected ? (
              <Badge className="gap-1 mb-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15">
                <Sparkles className="w-3 h-3" /> {t('profile.public.premium_access')}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 mb-1">
                <ShieldCheck className="w-3 h-3 text-success" /> {t('profile.public.connected')}
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-3">{displayName || t('profile.public.pal')}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            {profile?.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city}</span>}
            {showAge && <span className="flex items-center gap-1"><Cake className="w-3.5 h-3.5" /> {t('profile.public.age', { age: profile.age })}</span>}
            {profile?.country && <span className="flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> {countryName(profile.country)}</span>}
          </div>
        </div>
      </div>

      {/* Shared interests */}
      {sharedInterests.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Sparkles className="w-4 h-4 text-primary" /> {t('profile.public.shared_interests')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {sharedInterests.map((i) => (
              <Badge key={i} className="bg-primary/10 text-primary hover:bg-primary/15">{categoryLabel(t, i)}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      {profile?.bio && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-2">{t('profile.public.about')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Basic Information — gender, age, nationality, location */}
      {(() => {
        const hasGender = !!profile?.gender;
        const hasAge = showAge;
        const hasNat = !!nationalityLabel;
        const hasLoc = !!locationStr;
        if (!hasGender && !hasAge && !hasNat && !hasLoc) return null;
        return (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3">{t('profile.public.basic_info')}</h2>
            <div className="space-y-2.5 text-sm">
              {hasGender && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{t('profile.public.gender_label')}:</span>
                  <span className="font-medium">{genderLabel(t, profile.gender)}</span>
                </div>
              )}
              {hasAge && (
                <div className="flex items-center gap-2">
                  <Cake className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{t('profile.public.age_label', { age: '' }).replace(':', '')}:</span>
                  <span className="font-medium">{t('profile.public.age', { age: profile.age })}</span>
                </div>
              )}
              {hasNat && (
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{t('profile.public.nationality', { nationality: '' }).replace(':', '')}:</span>
                  <span className="font-medium">{nationalityLabel}</span>
                </div>
              )}
              {hasLoc && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{t('profile.public.location_label')}:</span>
                  <span className="font-medium">{locationStr}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Lifestyle / Daily Rhythm */}
      {profile?.lifestyle && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-2">{t('profile.public.lifestyle_label')}</h2>
          <p className="text-sm font-medium">{lifestyleLabel(t, profile.lifestyle)}</p>
        </div>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">{t('profile.public.interests_title')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((i) => (
              <Badge key={i} variant="outline" className={sharedInterests.includes(i) ? 'border-primary/40 text-primary' : ''}>
                {sharedInterests.includes(i) && <Star className="w-3 h-3 mr-1 text-primary" />}{categoryLabel(t, i)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Looking For */}
      {lookingFor.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Heart className="w-4 h-4 text-primary" /> {t('profile.public.looking_for_title')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {lookingFor.map((item, i) => (
              <Badge key={i} className="bg-accent/20 text-accent-foreground">{item}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Languages — codes converted to full names */}
      {profile?.languages?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Globe className="w-4 h-4 text-primary" /> {t('profile.public.languages_title')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {profile.languages.map((code) => (
              <Badge key={code} variant="outline">{languageName(code)}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Personality */}
      {personalityTraits.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Sparkles className="w-4 h-4 text-primary" /> {t('profile.public.personality_title')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {personalityTraits.map((key) => (
              <Badge key={key} variant="outline">{masterLabel('personalityTraits', key, t)}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Life Goals */}
      {lifeGoals.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Target className="w-4 h-4 text-primary" /> {t('profile.public.life_goals_title')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {lifeGoals.map((key) => (
              <Badge key={key} variant="outline">{masterLabel('lifeGoals', key, t)}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Gallery — responsive grid with enlarged view. Only valid (normalized)
          images render; the section hides entirely when none remain. */}
      {galleryItems.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">{t('profile.public.gallery_title')}</h2>
          <div className="grid grid-cols-3 gap-2">
            {galleryItems.map((item, i) => (
              <button
                key={item.id}
                type="button"
                ref={(el) => { triggerRefs.current[i] = el; }}
                onClick={() => setLightboxIndex(i)}
                className="aspect-square rounded-xl overflow-hidden bg-muted pressable relative"
                aria-label={item.alt}
              >
                {failedThumbs[i] ? (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                ) : (
                  <img
                    src={item.thumbnailSrc}
                    alt={item.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setFailedThumbs((p) => ({ ...p, [i]: true }))}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Life Journey */}
      {journeyText && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Compass className="w-4 h-4 text-primary" /> {t('profile.public.life_journey_title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{journeyText}</p>
        </div>
      )}

      {/* Connect / report — shown to unconnected Premium viewers */}
      {unconnected && (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
          <ConnectButton member={connectMember} fullWidth={false} className="w-full" />
          <button type="button" onClick={onReport} className="mt-3 text-xs text-muted-foreground hover:text-destructive transition-default">
            {t('profile.safety.report_action')}
          </button>
        </div>
      )}

      {/* Gallery lightbox — same normalized items as the thumbnails. */}
      <GalleryLightbox
        photos={galleryItems}
        startIndex={lightboxIndex}
        open={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        triggerRef={{ current: triggerRefs.current[lightboxIndex] }}
        displayName={displayName}
      />
    </div>
  );
}