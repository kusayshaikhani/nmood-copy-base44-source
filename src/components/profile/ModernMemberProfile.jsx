import React, { useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { normalizeGallery, normalizeImageUrl } from '@/lib/gallery-normalizer';
import { useSignedMemberGallery } from '@/lib/member-gallery';
import GalleryLightbox from '@/components/profile/tiers/GalleryLightbox';
import { getLanguage } from '@/lib/master-data';

const humanize = value => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

function DetailRow({ label, value }) {
  if (!value) return null;
  return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-3 py-3 text-sm"><dt className="font-semibold">{label}</dt><dd className="text-right text-muted-foreground">{value}</dd></div>;
}

// The connected-member page intentionally reuses the Home card language while
// receiving only the server-authorized profile projection from ConnectedProfile.
export default function ModernMemberProfile({ profile, displayName, showAge }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [unavailable, setUnavailable] = useState(() => new Set());
  const galleryTriggerRef = useRef(null);
  const signedGallery = useSignedMemberGallery(profile?.photo_gallery || profile?.gallery_photos || [], profile?.id);
  const photos = useMemo(() => {
    const gallery = normalizeGallery(signedGallery, displayName || 'Member');
    const primary = normalizeImageUrl(profile?.photo_url || profile?.avatar || profile?.image_url);
    if (primary && !gallery.some(item => item.src === primary)) gallery.unshift({ id: `primary-${primary.slice(-40)}`, src: primary, thumbnailSrc: primary, alt: `${displayName} — profile photo` });
    return gallery.filter(item => item?.src && !unavailable.has(item.src));
  }, [signedGallery, profile?.photo_url, profile?.avatar, profile?.image_url, displayName, unavailable]);
  const activePhoto = photos[Math.min(photoIndex, Math.max(0, photos.length - 1))];
  const interests = Array.isArray(profile?.interests) ? profile.interests.filter(Boolean).slice(0, 3) : [];
  const lookingFor = Array.isArray(profile?.looking_for_tags) ? profile.looking_for_tags.filter(Boolean) : [];
  const languages = Array.isArray(profile?.languages) ? profile.languages.filter(Boolean) : [];
  const personalityTraits = Array.isArray(profile?.personality_traits) ? profile.personality_traits.filter(Boolean) : [];
  const lifeGoals = Array.isArray(profile?.life_goals) ? profile.life_goals.filter(Boolean) : [];
  const lifestyle = [
    ['Drinking', profile?.share_drinking === false ? '' : profile?.drinking],
    ['Smoking', profile?.share_smoking === false ? '' : profile?.smoking],
    ['Lifestyle', profile?.lifestyle],
    ['Zodiac', profile?.zodiac],
  ].filter(([, value]) => value);
  const location = [profile?.city, profile?.country].filter(Boolean).join(', ');
  const markUnavailable = src => setUnavailable(previous => new Set([...previous, src]));

  return <section className="mx-auto w-full max-w-[25rem] pb-[calc(10rem+env(safe-area-inset-bottom))]">
    <article className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-[0_20px_60px_rgba(20,10,60,.27)]">
      <div className="relative h-[34rem] bg-nmood-gradient">
        {activePhoto && <button ref={galleryTriggerRef} type="button" aria-label={`Open ${displayName}'s photos`} onClick={() => setGalleryOpen(true)} className="absolute inset-0 cursor-zoom-in"><img src={activePhoto.src} alt={activePhoto.alt} onError={() => markUnavailable(activePhoto.src)} className="h-full w-full object-cover object-top" /></button>}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 via-45% to-black/5" />
        {photos.length > 1 && <><div aria-hidden="true" className="absolute inset-x-4 top-4 z-10 flex gap-1.5">{photos.map((_, index) => <span key={index} className={`h-1 flex-1 rounded-full ${index === photoIndex ? 'bg-white' : 'bg-white/40'}`} />)}</div><button type="button" aria-label="Previous photo" disabled={photoIndex === 0} onClick={() => setPhotoIndex(index => Math.max(0, index - 1))} className="absolute inset-y-0 left-0 z-20 w-1/3" /><button type="button" aria-label="Next photo" disabled={photoIndex === photos.length - 1} onClick={() => setPhotoIndex(index => Math.min(photos.length - 1, index + 1))} className="absolute inset-y-0 right-0 z-20 w-1/3" /></>}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-6 pt-24 text-white">
          {interests.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{interests.map(interest => <span key={interest} className="rounded-full border border-white/40 bg-black/30 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm">{humanize(interest)}</span>)}</div>}
          <h1 className="text-3xl font-bold leading-none tracking-tight drop-shadow">{displayName}{showAge && profile?.age != null ? `, ${profile.age}` : ''}</h1>
          {location && <p className="mt-2 flex items-center gap-1 text-sm font-medium text-white/95 drop-shadow"><MapPin className="h-4 w-4 shrink-0" />{location}</p>}
          {profile?.community_only ? <p className="mt-2 line-clamp-1 text-xs font-semibold text-white/90 drop-shadow">Here for: Community</p> : lookingFor.length > 0 && <p className="mt-2 line-clamp-1 text-xs font-semibold text-white/90 drop-shadow">Looking for: {lookingFor.map(humanize).join(', ')}</p>}
        </div>
      </div>
    </article>

    <div className="mt-6 space-y-6 rounded-[2rem] bg-card px-5 py-6 text-foreground shadow-sm ring-1 ring-black/5">
      {profile?.bio && <section><h2 className="text-2xl font-bold tracking-tight">About {displayName}</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{profile.bio}</p></section>}
      {profile?.community_only ? <section><h2 className="text-xl font-bold tracking-tight">Here for</h2><p className="mt-3 text-sm text-muted-foreground">Community</p></section> : lookingFor.length > 0 && <section><h2 className="text-xl font-bold tracking-tight">Looking for</h2><div className="mt-3 flex flex-wrap gap-2">{lookingFor.map(tag => <span key={tag} className="rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">{humanize(tag)}</span>)}</div></section>}
      {(profile?.work_text || profile?.height_cm) && <section><h2 className="text-xl font-bold tracking-tight">Work & details</h2><dl className="mt-3 divide-y divide-border rounded-2xl border bg-muted/20 px-4"><DetailRow label="Work" value={profile.work_text} /><DetailRow label="Height" value={profile.height_cm ? `${Math.round(Number(profile.height_cm))} cm` : ''} /></dl></section>}
      {lifestyle.length > 0 && <section><h2 className="text-xl font-bold tracking-tight">Lifestyle</h2><dl className="mt-3 divide-y divide-border rounded-2xl border bg-muted/20 px-4">{lifestyle.map(([label, value]) => <DetailRow key={label} label={label} value={humanize(value)} />)}</dl></section>}
      {languages.length > 0 && <section><h2 className="text-xl font-bold tracking-tight">Languages</h2><div className="mt-3 flex flex-wrap gap-2">{languages.map(language => <span key={language} className="rounded-full border bg-muted/30 px-3 py-2 text-xs font-medium">{getLanguage(String(language).toLowerCase())?.name || language}</span>)}</div></section>}
      {personalityTraits.length > 0 && <section><h2 className="text-xl font-bold tracking-tight">Personality</h2><div className="mt-3 flex flex-wrap gap-2">{personalityTraits.map(trait => <span key={trait} className="rounded-full border bg-muted/30 px-3 py-2 text-xs font-medium">{humanize(trait)}</span>)}</div></section>}
      {lifeGoals.length > 0 && <section><h2 className="text-xl font-bold tracking-tight">Life goals</h2><div className="mt-3 flex flex-wrap gap-2">{lifeGoals.map(goal => <span key={goal} className="rounded-full border bg-muted/30 px-3 py-2 text-xs font-medium">{humanize(goal)}</span>)}</div></section>}
      {profile?.journey_text && <section><h2 className="text-xl font-bold tracking-tight">Life journey</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{profile.journey_text}</p></section>}
      {photos.length > 0 && <section><div className="flex items-center justify-between"><h2 className="text-xl font-bold tracking-tight">Photo moments</h2><button type="button" onClick={() => setGalleryOpen(true)} className="min-h-11 px-2 text-sm font-semibold text-primary">View all</button></div><button type="button" onClick={() => setGalleryOpen(true)} aria-label={`View all of ${displayName}'s photos`} className="mt-3 grid w-full grid-cols-2 gap-2 overflow-hidden rounded-2xl text-left">{photos.slice(0, 4).map((photo, index) => <span key={photo.id || photo.src} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"><img src={photo.src} alt={index === 0 ? `${displayName} photo` : ''} onError={() => markUnavailable(photo.src)} className="h-full w-full object-cover" loading="lazy" />{index === 3 && photos.length > 4 && <span className="absolute inset-0 grid place-items-center bg-black/55 text-lg font-bold text-white">+{photos.length - 4}</span>}</span>)}</button></section>}
      <p className="border-t pt-4 text-center text-xs text-muted-foreground">Only details {displayName} chooses to share are shown.</p>
    </div>
    <GalleryLightbox photos={photos} startIndex={photoIndex} open={galleryOpen} onClose={() => setGalleryOpen(false)} onPhotoError={markUnavailable} triggerRef={galleryTriggerRef} displayName={displayName} tapToClose minimal />
  </section>;
}
