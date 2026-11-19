import {lookingForDetails} from '@/lib/display-detail';
import ProfileCover from '../ProfileCover';
import React, { useMemo } from 'react';
import ProfileMediaHeader from '../ProfileMediaHeader';
import { MapPin, Flag, Globe, Cake, Sparkles, Star, ShieldCheck, User, Compass, Target, Heart, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel, lifestyleLabel, genderLabel } from '@/lib/i18n/label-resolvers';
import { getCountry, getLanguage, masterLabel } from '@/lib/master-data';
import { resolveAvatar, normalizeGallery } from '@/lib/gallery-normalizer';
import { useSignedMemberGallery } from '@/lib/member-gallery';
import VerifiedBadge from '@/components/profile/VerifiedBadge';
import MemberIndicators from '@/components/profile/MemberIndicators';
import { heightLabel } from '@/lib/height';
import { lookingForTagLabel } from '@/lib/looking-for-tags';
import { familyPlanLabel as getFamilyPlanLabel, maritalStatusOptions } from '@/lib/onboarding-data';
import { smokingOptions, drinkingOptions, preferenceLabel } from '@/lib/profile-habits';

/**
 * Connected-tier full profile — complete profile access for Pal connections
 * and Premium subscribers. Organized into clear cards: About, Basic Info,
 * Lifestyle, Interests, Looking For, Languages, Gallery, Life Journey.
 * Only sections containing actual data are rendered.
 */
export default function ProfileFullView({ profile, displayName, identityVerified, sharedInterests = [], showAge, isConnected = false }) {
  const { t } = useLocalization();
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const ageVisible = showAge && profile?.show_age === true && Number.isFinite(profile?.age);
  const unconnected = !isConnected;

  // Canonical avatar + gallery — one normalization path for thumbnail + lightbox.
  const avatarUrl = resolveAvatar(profile);
  const signedGallery = useSignedMemberGallery(profile?.photo_gallery, profile?.id);
  const galleryItems = useMemo(() => normalizeGallery(signedGallery, displayName || ''), [signedGallery, displayName]);

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
    ? ''
    : (natVal ? countryName(natVal) : '');

  // Location string for the Basic Info card.
  const locationStr = [profile?.city, countryName(profile?.country)].filter(Boolean).join(', ');

  // Looking For, Personality, Life Goals from MemberProfile.
  const tags = lookingForDetails(profile?.looking_for_tags);
  const relationshipKeys = ['soulmate','serious_relationship','long_term_partner','dating','casual_dating','figuring_it_out'];
  const relationships = tags.filter(tag => relationshipKeys.includes(tag));
  const lookingFor = tags.filter(tag => !relationshipKeys.includes(tag));
  const personalityTraits = Array.isArray(profile?.personality_traits) ? profile.personality_traits : [];
  const lifeGoals = Array.isArray(profile?.life_goals) ? profile.life_goals : [];
  const recentActivity = Array.isArray(profile?.recent_activity) ? profile.recent_activity : [];
  const familyPlanLabel = getFamilyPlanLabel(profile?.family_plan);
  const hasPublishedDetails = Boolean(tags.length || profile?.lifestyle || personalityTraits.length || lifeGoals.length || profile?.journey_text || profile?.height_cm || profile?.work_text || profile?.photo_url || profile?.bio || interests.length || profile?.languages?.length || galleryItems.length || recentActivity.length || ageVisible || nationalityLabel || locationStr || profile?.family_plan || profile?.marital_status || profile?.smoking || profile?.drinking);

  // Life Journey text from LifeJourney entity.
  const journeyText = profile?.journey_text || '';

  return (
    <div className="space-y-5 pb-[calc(10rem+env(safe-area-inset-bottom))] break-words">
      <ProfileCover key={profile.id} ownerId={profile.id} renderMedia={cover=><ProfileMediaHeader {...cover}
        avatarUrl={avatarUrl} gallery={galleryItems} displayName={displayName||t('profile.public.pal')}
        age={ageVisible?profile.age:null} location={locationStr}
        verified={identityVerified?<VerifiedBadge className="text-white"/>:null}
        badge={<Badge className="gap-1 border border-white/25 bg-white/10 text-white">{unconnected?<Sparkles size={12}/>:<ShieldCheck size={12}/>} {t(unconnected?'profile.public.premium_access':'profile.public.connected')}</Badge>}
        indicators={<MemberIndicators memberId={profile?.id} profile className="text-white/90"/>}
        sharedInterestNote={sharedInterests.length?`You both enjoy ${sharedInterests.slice(0,2).map(i=>categoryLabel(t,i)).join(' and ')}.`:null}
      />}/>

      {!hasPublishedDetails && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center">
          <p className="text-sm text-muted-foreground">This member has not published any profile details yet.</p>
        </div>
      )}

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
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}

      {heightLabel(profile?.height_cm) && <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">Height</h2><p>{heightLabel(profile.height_cm)}</p></section>}
      {profile?.work_text && <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">Work</h2><p className="whitespace-pre-wrap break-words">{profile.work_text}</p></section>}
      {/* Basic Information — gender, age, nationality, location */}
      {(() => {
        const hasGender = !!profile?.gender;
        const hasAge = ageVisible;
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

      {profile?.zodiac && <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold mb-2">Zodiac</h2><p className="text-sm">{profile.zodiac}</p></div>}

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
      {tags.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Heart className="w-4 h-4 text-primary" /> {t('profile.public.looking_for_title')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {lookingFor.map((item, i) => (
              <Badge key={i} className="bg-accent/20 text-accent-foreground">{lookingForTagLabel(t, item)}</Badge>
            ))}
          </div>
          {relationships.length > 0 && <div className="mt-3">
            <h3 className="text-sm font-semibold mb-2">Relationship preferences</h3>
            <div className="flex flex-wrap gap-1.5">{relationships.map(tag => <Badge key={tag} variant="outline">{lookingForTagLabel(t, tag)}</Badge>)}</div>
          </div>}
        </div>
      )}

      {(profile?.circle_summaries?.length > 0 || profile?.experience_summaries?.length > 0) && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Community activity</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            {profile.circle_summaries?.length > 0 && <p>Circles: {profile.circle_summaries.map((item) => item.title).filter(Boolean).join(', ')}</p>}
            {profile.experience_summaries?.length > 0 && <p>Experiences: {profile.experience_summaries.map((item) => item.title).filter(Boolean).join(', ')}</p>}
          </div>
        </div>
      )}

      {profile?.family_plan && profile.share_family_plan !== false && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-2">Children preference</h2>
          <p className="text-sm font-medium">{familyPlanLabel}</p>
        </div>
      )}

      {profile?.marital_status && profile.share_marital_status !== false && <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold mb-2">Marital status</h2><p className="text-sm">{maritalStatusOptions.find(option => option.value === profile.marital_status)?.label || profile.marital_status.replaceAll('_', ' ')}</p></div>}
      {(profile?.smoking && profile.share_smoking !== false) || (profile?.drinking && profile.share_drinking !== false) ? <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold mb-3">Smoking and drinking</h2><div className="space-y-2 text-sm">{profile?.smoking && profile.share_smoking !== false && <p><span className="text-muted-foreground">Smoking:</span> {preferenceLabel(smokingOptions, profile.smoking)}</p>}{profile?.drinking && profile.share_drinking !== false && <p><span className="text-muted-foreground">Drinking:</span> {preferenceLabel(drinkingOptions, profile.drinking)}</p>}</div></div> : null}

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

      {/* Life Journey */}
      {journeyText && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Compass className="w-4 h-4 text-primary" /> {t('profile.public.life_journey_title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{journeyText}</p>
        </div>
      )}

      {recentActivity.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><CalendarDays className="w-4 h-4 text-primary" /> Recent activity</h2>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium truncate">{activity.title}</span>
                {activity.date && <span className="text-xs text-muted-foreground flex-shrink-0">{activity.date}</span>}
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}