import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { Ban, ChevronLeft, ChevronRight, Flag, Heart, MapPin, RotateCcw, SkipForward, Star, Undo2 } from 'lucide-react';
import { normalizeGallery, normalizeImageUrl } from '@/lib/gallery-normalizer';
import { useSignedMemberGallery } from '@/lib/member-gallery';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useToast } from '@/components/ui/use-toast';
import { haptic } from '@/lib/haptics';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { profileDiscoveryReadiness } from '@/lib/profile-discovery-readiness';
import { useSafety } from '@/lib/safety-store';
import { useConnections } from '@/lib/connections-store';
import { resolveMemberProfile, useMemberProfile } from '@/lib/member-profile-view';
import { useQueryClient } from '@tanstack/react-query';
import { upcomingDeckMembers } from '@/lib/home-deck-prefetch';
import { cycleHomeDeckMembers } from '@/lib/home-deck-cycle';
import AndroidConnectionCelebration from '@/components/connections/AndroidConnectionCelebration';
import ReportSheet from '@/components/safety/ReportSheet';
import GalleryLightbox from '@/components/profile/tiers/GalleryLightbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CARD_EXIT = { left: { x: -520, y: 72, rotate: -19, opacity: 0 }, right: { x: 520, y: 72, rotate: 19, opacity: 0 } };
const humanize = value => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

function memberPhotos(member, galleryEntries) {
  const name = member?.display_name || member?.name || 'Member';
  const gallery = normalizeGallery(galleryEntries || member?.photo_gallery || member?.gallery_photos || [], name);
  const primary = normalizeImageUrl(member?.photo_url || member?.avatar || member?.image_url);
  if (primary && !gallery.some(photo => photo.src === primary)) gallery.unshift({ id: `primary-${primary.slice(-40)}`, src: primary, thumbnailSrc: primary, alt: `${name} — profile photo` });
  return gallery;
}

/**
 * A familiar, one-profile-at-a-time discovery surface. It deliberately uses
 * Nmood's existing connection flow instead of manufacturing a separate match
 * system, so blocks, limits, consent and mutual connection rules stay intact.
 */
export default function DatingProfileDeck({ members = [], homeMode = false, hasExplicitGenderFilter = false, onAdjustFilters, onClearFilters, onNeedMore }) {
  const { user, member: viewer } = useAuth();
  const navigate = useNavigate();
  const { showUpgrade, isPremium } = useMembershipAccess();
  const { toast } = useToast();
  const { block } = useSafety();
  const connectionState = useConnections(user);
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [exit, setExit] = useState(null);
  const [liking, setLiking] = useState(false);
  const [dislikedIds, setDislikedIds] = useState(() => new Set());
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [androidLikesLoading, setAndroidLikesLoading] = useState(false);
  const [match, setMatch] = useState(null);
  const [passedProfiles, setPassedProfiles] = useState([]);
  const [lastPassedId, setLastPassedId] = useState(null);
  const [returnedProfile, setReturnedProfile] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [unavailablePhotoSources, setUnavailablePhotoSources] = useState(() => new Set());
  const [premiumPrompt, setPremiumPrompt] = useState(null);
  // Motion values keep the card attached to a finger or mouse pointer without
  // re-rendering React for every pixel of a drag.
  const dragX = useMotionValue(0);
  const dragRotation = useTransform(dragX, [-260, 0, 260], [-12, 0, 12]);
  const dragScale = useTransform(dragX, [-260, 0, 260], [0.985, 1, 0.985]);
  const nextPageAttemptRef = useRef('');
  const galleryTriggerRef = useRef(null);
  // A fresh session should not always begin with the same person. The order
  // remains stable for that session, so photo browsing and a swipe never jump.
  const [deckSeed] = useState(() => Math.floor(Math.random() * 2_147_483_647));
  const isAndroidHomeDeck = homeMode && typeof Capacitor.getPlatform === 'function' && Capacitor.getPlatform() === 'android';
  const palIds = useMemo(() => new Set((connectionState.connections || []).map(connection => String(connection?.pal_user_id || '')).filter(Boolean)), [connectionState.connections]);
  useEffect(() => {
    let active = true;
    if (!user?.id) { setDislikedIds(new Set()); setAndroidLikesLoading(false); return undefined; }
    if (isAndroidHomeDeck) setAndroidLikesLoading(true);
    // Home behaves like a discovery session: skips remain gone while the
    // member browses, then the deck starts fresh after Home is reopened.
    // Other discovery surfaces retain their existing server-backed history.
    if (homeMode) setDislikedIds(new Set());
    else callSupabaseRpc('nmood_my_disliked_member_ids').then(ids => {
      if (active) setDislikedIds(new Set(ids || []));
    }).catch(() => {});
    callSupabaseRpc(isAndroidHomeDeck ? 'nmood_android_my_active_liked_member_ids' : 'nmood_my_liked_member_ids').then(ids => {
      if (active) setLikedIds(new Set(ids || []));
    }).catch(() => {}).finally(() => { if (active) setAndroidLikesLoading(false); });
    return () => { active = false; };
  }, [user?.id, isAndroidHomeDeck]);
  const { visibleMembers, recyclingPassedProfiles } = useMemo(() => {
    // An explicit Home filter must win over the viewer's default preference.
    // Otherwise selecting a different gender can incorrectly leave the deck empty.
    // "Community" describes how the viewer uses Nmood, not a gender to
    // search for. Only the established Men/Women preferences narrow the
    // default deck; an explicit Home filter still takes precedence.
    const viewerPreference = viewer?.dating_looking_for_gender;
    const intendedGender = hasExplicitGenderFilter || !['male', 'female'].includes(viewerPreference)
      ? null
      : viewerPreference;
    // Likes and passes stay out of the active deck. A Home refresh starts a
    // fresh session, but a profile never returns while the member is still
    // working through this session.
    // A confirmed Pal belongs in the Pals area, never in the dating-style
    // discovery deck. Keep this client guard even if a previously fetched
    // discovery page contains a now-connected member.
    const eligible = members.filter(member => !palIds.has(String(member?.id || member?.user_id || '')) && !likedIds.has(member?.id) && (!intendedGender || member?.gender === intendedGender));
    const sortByQuality = (items) => [...items].sort((left, right) => {
      const quality = profileDiscoveryReadiness(right).score - profileDiscoveryReadiness(left).score;
      if (quality) return quality;
      return 0;
    });
    if (!homeMode) return { visibleMembers: sortByQuality(eligible.filter(member => !dislikedIds.has(member?.id))), recyclingPassedProfiles: false };
    const { members: cycle, recycling } = cycleHomeDeckMembers({ eligibleMembers: sortByQuality(eligible), dislikedIds, seed: deckSeed, lastPassedId });
    return { visibleMembers: cycle, recyclingPassedProfiles: recycling };
  }, [members, dislikedIds, likedIds, palIds, viewer?.dating_looking_for_gender, hasExplicitGenderFilter, homeMode, deckSeed, lastPassedId]);
  useEffect(() => {
    if (!homeMode || !user?.id || connectionState.loading || androidLikesLoading || visibleMembers.length || !members.length || !onNeedMore) return undefined;
    const batchKey = `${user.id}:${members.map(member => member?.id || member?.user_id || '').join(',')}`;
    if (nextPageAttemptRef.current === batchKey) return undefined;
    nextPageAttemptRef.current = batchKey;
    onNeedMore();
    return undefined;
  }, [homeMode, user?.id, connectionState.loading, androidLikesLoading, visibleMembers.length, members, onNeedMore]);
  const visibleIndex = visibleMembers.length ? index % visibleMembers.length : 0;
  const person = returnedProfile || visibleMembers[visibleIndex];
  const upcomingMembers = useMemo(
    () => isAndroidHomeDeck ? upcomingDeckMembers(visibleMembers, visibleIndex, person?.id) : [],
    [isAndroidHomeDeck, person?.id, visibleIndex, visibleMembers]
  );
  // Keep the real next profile mounted behind the active card. This makes the
  // Discovery intentionally supplies only a compact card projection. Load
  // the active member's already-authorized public profile to obtain its
  // permitted photo gallery, without fetching galleries for the whole deck.
  const { data: activeProfile } = useMemberProfile({ userId: person?.id });
  const galleryEntries = activeProfile?.tier === 'full' && Array.isArray(activeProfile?.profile?.photo_gallery)
    ? activeProfile.profile.photo_gallery
    : (person?.photo_gallery || person?.gallery_photos || []);
  const signedGallery = useSignedMemberGallery(galleryEntries, person?.id);
  const photos = useMemo(() => memberPhotos(person, signedGallery), [person, signedGallery]);
  const availablePhotos = useMemo(() => photos.filter(photo => photo?.src && !unavailablePhotoSources.has(photo.src)), [photos, unavailablePhotoSources]);

  // Android prewarms the next cards while the current member is visible.
  // Every profile request still uses the existing server-authorized endpoint
  // and viewer-scoped cache key, so privacy, blocks and Premium rules remain
  // enforced exactly as they are for the active card.
  useEffect(() => {
    if (!isAndroidHomeDeck || !user?.id || !upcomingMembers.length) return undefined;
    const images = upcomingMembers
      .map(candidate => normalizeImageUrl(candidate?.photo_url || candidate?.avatar || candidate?.image_url))
      .filter(Boolean)
      .map(src => {
        const image = new Image();
        image.decoding = 'async';
        image.src = src;
        return image;
      });
    upcomingMembers.slice(0, 2).forEach(candidate => {
      void queryClient.prefetchQuery({
        queryKey: ['memberProfile', user.id, String(candidate.id)],
        queryFn: () => resolveMemberProfile({ userId: candidate.id }),
        staleTime: 30_000,
      });
    });
    return () => images.forEach(image => { image.onload = null; image.onerror = null; });
  }, [isAndroidHomeDeck, queryClient, upcomingMembers, user?.id]);
  const markPhotoUnavailable = source => {
    if (!source) return;
    setUnavailablePhotoSources(current => current.has(source) ? current : new Set([...current, source]));
  };
  // Warm the browser cache for adjacent photos while the member is on screen.
  // The gallery remains private because these are already authorized signed URLs.
  useEffect(() => {
    if (!photos.length) return undefined;
    const warm = [photos[photoIndex - 1], photos[photoIndex + 1]].filter(Boolean).map(photo => {
      const image = new Image();
      image.decoding = 'async';
      image.src = photo.src;
      return image;
    });
    return () => warm.forEach(image => { image.onload = null; image.onerror = null; });
  }, [photos, photoIndex]);
  useEffect(() => { setPhotoIndex(0); setGalleryOpen(false); setUnavailablePhotoSources(new Set()); }, [person?.id]);
  // Do not reset the finger position while the outgoing card is still
  // animating; doing so visibly snaps a left/right swipe back to centre.
  useEffect(() => { if (!exit) dragX.set(0); }, [exit, dragX]);
  useEffect(() => { setPhotoIndex(current => Math.min(current, Math.max(availablePhotos.length - 1, 0))); }, [availablePhotos.length]);
  const advance = direction => {
    if (!person || exit) return;
    setExit(direction);
    window.setTimeout(() => { setIndex(0); setReturnedProfile(null); setPhotoIndex(0); setExit(null); }, 210);
  };
  const like = async () => {
    if (!person || exit || liking) return;
    const target = person;
    setLiking(true);
    // Move immediately. A swipe must never wait for a network round trip.
    setExit('right');
    setLikedIds(ids => new Set([...ids, target.id]));
    haptic('light');
    try {
      const result = await callSupabaseRpc(isAndroidHomeDeck ? 'nmood_android_like_member' : 'nmood_like_member', { p_member_id: target.id });
      if (!result?.ok) throw new Error(result?.error || 'Your Like could not be sent.');
      haptic('success');
      if (result.matched) {
        // The matched member's original incoming Like is no longer actionable.
        // Refresh the shared Likes state immediately instead of leaving a stale
        // badge until its next timed refresh.
        window.dispatchEvent(new Event('nmood:likes-changed'));
        setMatch({ id: target.id, name: target.display_name || target.name || 'your new match', photo: photos[0]?.src, interest: commonInterests(viewer, target)[0] || null });
      }
    } catch (error) {
      setLikedIds(ids => { const next = new Set(ids); next.delete(target.id); return next; });
      haptic('error');
      if (/30 Likes|NMOOD_LIKE_LIMIT_REACHED/i.test(`${error?.message || ''} ${error?.detail || ''}`)) showUpgrade('connection_request');
      else toast({ title: 'Like not sent', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally { window.setTimeout(() => { setExit(null); setLiking(false); }, 240); }
  };
  const requestPremiumFeature = feature => {
    setPremiumPrompt(feature);
  };
  const superLike = async () => {
    if (!isPremium) { requestPremiumFeature('super_like'); return; }
    if (!person || exit || liking) return;
    const target = person;
    setLiking(true);
    setExit('right');
    setLikedIds(ids => new Set([...ids, target.id]));
    haptic('light');
    try {
      const result = await callSupabaseRpc('nmood_android_super_like_member', { p_member_id: target.id });
      if (!result?.ok) throw new Error(result?.error || 'Your Spark could not be sent.');
      haptic('success');
      if (result.matched) setMatch({ id: target.id, name: target.display_name || target.name || 'your new match', photo: photos[0]?.src, interest: commonInterests(viewer, target)[0] || null });
      else toast({ title: 'Spark sent', description: `${target.display_name || target.name || 'This member'} will see your priority Like.` });
    } catch (error) {
      setLikedIds(ids => { const next = new Set(ids); next.delete(target.id); return next; });
      haptic('error');
      toast({ title: 'Spark not sent', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally { window.setTimeout(() => { setExit(null); setLiking(false); }, 240); }
  };
  const previous = () => { if (index > 0 && !exit) { setIndex(value => value - 1); setPhotoIndex(0); } };
  const dislike = () => {
    if (!person || exit) return;
    const target = person;
    const alreadyPassed = dislikedIds.has(target.id);
    // A Pass exits immediately, then persists quietly. This keeps the card
    // fluid even on a slow connection; a failed save restores the candidate.
    setExit('left');
    setPassedProfiles(history => [...history, target]);
    setLastPassedId(target.id);
    setReturnedProfile(null);
    setDislikedIds(ids => new Set([...ids, target.id]));
    // Passing an unseen profile removes it from the fresh pass. Once that
    // pass is exhausted, the eligible passed pool is reshuffled and loops.
    // In that loop, move to a different card straight away.
    if (alreadyPassed || recyclingPassedProfiles) setIndex(value => value + 1);
    setPhotoIndex(0);
    haptic('light');
    void callSupabaseRpc('nmood_dislike_member', { p_member_id: target.id }).catch(error => {
      setDislikedIds(ids => { const next = new Set(ids); next.delete(target.id); return next; });
      setPassedProfiles(history => history.filter(profile => profile.id !== target.id));
      toast({ title: 'Dislike not saved', description: error?.message || 'Please try again.', variant: 'destructive' });
    });
    window.setTimeout(() => setExit(null), 240);
  };
  const rewind = async () => {
    if (exit) return;
    if (!isPremium) { requestPremiumFeature('rewind'); return; }
    const previousProfile = passedProfiles.at(-1);
    if (!previousProfile) return;
    try {
      await callSupabaseRpc('nmood_undo_dislike', { p_member_id: previousProfile.id });
      setPassedProfiles(history => history.slice(0, -1));
      setDislikedIds(ids => { const next = new Set(ids); next.delete(previousProfile.id); return next; });
      setReturnedProfile(previousProfile);
      setPhotoIndex(0);
      haptic('light');
    } catch (error) {
      toast({ title: 'Could not go back to this profile', description: error?.message || 'Please try again.', variant: 'destructive' });
    }
  };
  const blockPerson = async () => {
    if (!person || !window.confirm(`Block ${person.display_name || person.name || 'this member'}? They will no longer be able to contact or discover you.`)) return;
    try {
      await block({ id: person.id, name: person.display_name || person.name, avatar: person.photo_url || person.avatar });
      toast({ title: 'Member blocked', description: 'They have been removed from your discovery.' });
      advance('left');
    } catch (error) {
      toast({ title: 'Could not block member', description: error?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  // Do not briefly expose a pending Like while Android is fetching the
  // server-authoritative 30-day exclusion list.
  if (isAndroidHomeDeck && (androidLikesLoading || connectionState.loading)) return <div aria-busy="true" className="h-[32rem] animate-pulse rounded-[2rem] bg-muted" />;

  // A Like is removed from the deck immediately. Keep this independent of
  // `person`, otherwise a mutual Like on the final visible card can leave the
  // deck empty before React gets a chance to show the match celebration.
  const matchCelebration = match && (isAndroidHomeDeck
    ? <AndroidConnectionCelebration type="match" name={match.name} myPhoto={viewer?.photo_url || viewer?.avatar} memberPhoto={match.photo} onMessage={() => navigate(`/messages/${encodeURIComponent(match.id)}?icebreaker=${encodeURIComponent(match.interest ? `I saw we both enjoy ${humanize(match.interest)}. What are you into lately?` : 'What is something you are excited about this week?')}`)} onDismiss={() => setMatch(null)} />
    : <div role="dialog" aria-modal="true" aria-labelledby="match-title" className="fixed inset-0 z-[100] grid place-items-center bg-[#20104b]/75 p-5 backdrop-blur-md"><section className="w-full max-w-sm overflow-hidden rounded-[2.25rem] border border-white/30 bg-[#fdfbff] text-center shadow-[0_30px_90px_rgba(42,13,108,.5)]"><div className="relative z-20 overflow-visible bg-gradient-to-br from-[#3d159e] via-[#6928e5] to-[#a95aff] px-7 pb-10 pt-8 text-white"><div aria-hidden="true" className="absolute -left-20 -top-16 h-52 w-52 rounded-full border border-white/20 bg-white/10" /><div aria-hidden="true" className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full border border-white/20 bg-[#f0c8ff]/20" /><p className="relative text-[11px] font-bold uppercase tracking-[.28em] text-white/80">New connection</p><h2 id="match-title" className="relative mt-3 text-4xl font-black leading-none tracking-[-.065em]">IT’S A MATCH!</h2><p className="relative mt-3 text-sm font-medium text-white/90">You and {match.name} liked each other.</p><div className="absolute -bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center justify-center"><img src={viewer?.photo_url || viewer?.avatar || match.photo} alt="Your profile" className="h-16 w-16 rounded-full border-3 border-white object-cover shadow-lg" /><span aria-hidden="true" className="-mx-3 z-10 grid h-10 w-10 place-items-center rounded-full border-4 border-[#7944ee] bg-white text-base text-[#6b32e7] shadow-lg">♥</span><img src={match.photo || viewer?.photo_url || viewer?.avatar} alt={`${match.name}'s profile`} className="h-16 w-16 rounded-full border-3 border-white object-cover shadow-lg" /></div></div><div className="relative z-10 px-6 pb-6 pt-14">{match.interest && <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-800">{humanize(match.interest)}</span>}<p className="mt-4 text-sm leading-relaxed text-slate-600">{match.interest ? `You both enjoy ${humanize(match.interest)}. Say hello and start the conversation.` : 'Say hello and start the conversation.'}</p><div className="mt-6 grid gap-2"><button type="button" onClick={() => navigate(`/messages/${encodeURIComponent(match.id)}?icebreaker=${encodeURIComponent(match.interest ? `I saw we both enjoy ${humanize(match.interest)}. What are you into lately?` : 'What is something you are excited about this week?')}`)} className="min-h-12 rounded-2xl bg-gradient-to-r from-[#5623d3] via-[#7540ef] to-[#9654fb] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(95,50,220,.34)]">Send {match.name} a message</button><button type="button" onClick={() => setMatch(null)} className="min-h-11 text-sm font-semibold text-violet-700">Keep exploring</button></div></div></section></div>);

  const restartHomeDiscovery = () => {
    // Passes are deliberately temporary on Home: a user can finish a local
    // session, then choose to browse those people again without changing
    // their saved filters or server-side safety decisions.
    setDislikedIds(new Set());
    setIndex(0);
    setReturnedProfile(null);
    onClearFilters?.();
  };

  if (!person) return <><section className="rounded-[2rem] border border-dashed border-primary/20 bg-card px-6 py-14 text-center"><h2 className="text-xl font-semibold">No profiles match these filters yet</h2><p className="mt-2 text-sm text-muted-foreground">Try widening your preferences, or return to the full local discovery pool.</p><div className="mt-5 flex flex-wrap justify-center gap-3">{onAdjustFilters && <button type="button" onClick={onAdjustFilters} className="min-h-11 rounded-xl border px-4 text-sm font-semibold text-primary">Adjust filters</button>}{onClearFilters && <button type="button" onClick={homeMode ? restartHomeDiscovery : onClearFilters} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Show more people</button>}</div></section>{matchCelebration}</>;

  const name = person.display_name || person.name || 'Member';
  const numericDistance = Number(person.distance_km ?? person.distance);
  const distance = person.distance_label || (Number.isFinite(numericDistance) && numericDistance >= 0 ? `About ${numericDistance < 1 ? '< 1' : Math.round(numericDistance)} km away` : 'Distance unavailable');
  const location = person.city || '';
  // Discovery only receives an age when the owner has allowed it. Never
  // substitute a privacy-status sentence into the card identity line.
  const ageLabel = person.age != null && String(person.age).trim() !== '' ? String(person.age) : '';
  const prompts = Array.isArray(person.prompts) ? person.prompts.filter(Boolean).slice(0, 3) : [];
  const sharedInterests = commonInterests(viewer, person);
  return <section aria-label="People discovery" className={`mx-auto w-full ${homeMode ? 'max-w-[25rem] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]' : 'max-w-[29rem] pb-8'}`}>
    {!homeMode && <div className="mb-3 flex items-center justify-between px-1"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Discover people</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Find your next connection</h1></div><span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{Math.max(visibleMembers.length - index, 0)} left</span></div>}
    <div className={`relative ${homeMode ? 'h-[clamp(31rem,66dvh,38rem)]' : 'h-[min(68vh,42rem)] min-h-[29rem]'}`}>
      {/* Keep one complete profile card on screen during a swipe. Showing a
          live preview underneath the departing card made two members appear
          merged together on Android while its compositor was catching up. */}
      {!homeMode && visibleMembers[index + 1] && <div aria-hidden="true" className="absolute inset-x-3 top-3 h-full rounded-[2rem] bg-primary/10" />}
      <AnimatePresence initial={false} mode="wait" onExitComplete={() => {
        // The outgoing card follows the swipe direction, but every new
        // profile must enter from the centre with no Like/Pass carry-over.
        dragX.set(0);
        setExit(null);
      }}>
        <motion.article key={person.id || index} style={{ x: dragX, rotate: dragRotation, scale: dragScale, transformOrigin: '50% 85%' }} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1 }} exit={exit ? CARD_EXIT[exit] : { opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }} className="absolute inset-0 flex touch-pan-y flex-col overflow-hidden rounded-[2rem] bg-[#eef7ff] shadow-[0_20px_60px_rgba(20,10,60,.27)] dark:bg-card">
          {homeMode ? <HomeProfileCard person={person} name={name} ageLabel={ageLabel} photos={availablePhotos} photoIndex={photoIndex} setPhotoIndex={setPhotoIndex} onOpenGallery={() => setGalleryOpen(true)} onPhotoError={markPhotoUnavailable} galleryTriggerRef={galleryTriggerRef} exit={exit} dragX={dragX} onSwipeLeft={dislike} onSwipeRight={() => void like()} /> : <>
          <div className="relative h-[64%] shrink-0 bg-slate-900">
            {availablePhotos.length ? <button ref={galleryTriggerRef} type="button" aria-label={`Open ${name}'s photos full screen`} onClick={() => setGalleryOpen(true)} className="absolute inset-0 cursor-zoom-in"><img src={availablePhotos[photoIndex]?.src} alt={availablePhotos[photoIndex]?.alt} onError={() => markPhotoUnavailable(availablePhotos[photoIndex]?.src)} className="h-full w-full select-none object-cover" draggable="false" /></button> : <div className="absolute inset-0 bg-nmood-gradient" />}
            <div className="absolute inset-x-3 top-3 z-10 flex gap-1.5">{Array.from({ length: Math.max(photos.length, 1) }, (_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />)}</div>
            <button type="button" aria-label={isPremium ? 'Back to last passed profile' : 'Back is available with Premium'} title={isPremium ? (passedProfiles.length ? 'Back to last passed profile' : 'No passed profiles yet') : 'Premium feature'} disabled={isPremium && !passedProfiles.length} onClick={() => void rewind()} className={`absolute left-3 top-6 z-30 grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-black/35 text-white backdrop-blur ${isPremium && passedProfiles.length ? 'active:scale-95' : 'opacity-70'}`}><Undo2 className="h-5 w-5" /></button>
            <div className="absolute right-3 top-6 z-30 flex gap-2"><button type="button" aria-label={`Report ${name}`} onClick={() => setReportTarget({ type: 'member', id: person.id, name, image: person.photo_url || person.avatar })} className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-black/35 text-white backdrop-blur"><Flag className="h-4 w-4" /></button><button type="button" aria-label={`Block ${name}`} onClick={() => void blockPerson()} className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-black/35 text-white backdrop-blur"><Ban className="h-4 w-4" /></button></div>
            {photos.length > 1 && <><button type="button" aria-label="Previous photo" disabled={photoIndex === 0} onClick={() => setPhotoIndex(value => Math.max(0, value - 1))} className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-transform active:scale-90 disabled:opacity-30"><ChevronLeft className="h-6 w-6" /></button><button type="button" aria-label="Next photo" disabled={photoIndex === photos.length - 1} onClick={() => setPhotoIndex(value => Math.min(photos.length - 1, value + 1))} className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-transform active:scale-90 disabled:opacity-30"><ChevronRight className="h-6 w-6" /></button></>}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-5 pb-5 pt-14 text-white"><div className="relative min-w-0 pr-12"><h2 className="text-2xl font-bold tracking-tight drop-shadow">{name}{ageLabel ? `, ${ageLabel}` : ''}</h2><p className="mt-1 flex items-center gap-1 text-sm text-white/90"><MapPin className="h-4 w-4 shrink-0" />{[location, distance].filter(Boolean).join(' · ')}</p>{person.looking_for_tags?.length > 0 && <p className="mt-2 max-w-full truncate rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold text-white/95">Looking for: {person.looking_for_tags.map(humanize).join(', ')}</p>}{photos.length > 1 && <p className="absolute bottom-0 right-0 rounded-full bg-black/40 px-2 py-1 text-xs font-semibold text-white">{photoIndex + 1} / {photos.length}</p>}</div></div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#eef7ff] px-5 pb-8 pt-5 text-foreground dark:bg-card">
            {person.identity_verified && <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">VERIFIED</span>}
            {sharedInterests.length > 0 && <section className="mt-5 rounded-2xl bg-primary/[0.06] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Common ground</p><p className="mt-2 text-sm font-medium">You both enjoy {sharedInterests.slice(0, 3).map(humanize).join(', ')}.</p></section>}
            {person.bio && <section className="mt-5"><h3 className="text-sm font-bold">About {name}</h3><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{person.bio}</p></section>}
            {prompts.map((prompt, promptIndex) => <section key={prompt.id || promptIndex} className="mt-5 rounded-2xl bg-muted/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{prompt.question || prompt.label || 'About me'}</p><p className="mt-2 text-sm leading-relaxed">{prompt.answer || prompt.text || String(prompt)}</p></section>)}
            {Array.isArray(person.interests) && person.interests.length > 0 && <section className="mt-5"><h3 className="text-sm font-bold">Interests</h3><div className="mt-3 flex flex-wrap gap-2">{person.interests.map(interest => <span key={interest} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">{interest}</span>)}</div></section>}
            {(person.nationality || person.height_cm || person.work_text || person.occupation) && <section className="mt-5"><h3 className="text-sm font-bold">Profile details</h3><dl className="mt-3 grid grid-cols-2 gap-4 text-sm">{person.nationality && <div><dt className="text-muted-foreground">Nationality</dt><dd className="mt-1 font-medium">{humanize(person.nationality)}</dd></div>}{person.height_cm && <div><dt className="text-muted-foreground">Height</dt><dd className="mt-1 font-medium">{Math.round(Number(person.height_cm))} cm</dd></div>}{(person.work_text || person.occupation) && <div className="col-span-2"><dt className="text-muted-foreground">Work / occupation</dt><dd className="mt-1 font-medium">{person.work_text || person.occupation}</dd></div>}</dl></section>}
            {(person.languages || person.search_languages)?.length > 0 && <section className="mt-5"><h3 className="text-sm font-bold">Languages</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{(person.languages || person.search_languages).join(', ')}</p></section>}
            {(person.marital_status || person.family_plan || person.smoking || person.drinking || person.zodiac) && <section className="mt-5"><h3 className="text-sm font-bold">Lifestyle and intentions</h3><dl className="mt-3 grid grid-cols-2 gap-4 text-sm">{person.marital_status && <div><dt className="text-muted-foreground">Marital status</dt><dd className="mt-1 font-medium">{humanize(person.marital_status)}</dd></div>}{person.family_plan && <div><dt className="text-muted-foreground">Children & family</dt><dd className="mt-1 font-medium">{humanize(person.family_plan)}</dd></div>}{person.smoking && <div><dt className="text-muted-foreground">Smoking</dt><dd className="mt-1 font-medium">{humanize(person.smoking)}</dd></div>}{person.drinking && <div><dt className="text-muted-foreground">Drinking</dt><dd className="mt-1 font-medium">{humanize(person.drinking)}</dd></div>}{person.zodiac && <div><dt className="text-muted-foreground">Zodiac</dt><dd className="mt-1 font-medium">{humanize(person.zodiac)}</dd></div>}</dl></section>}
          </div>
          </>}
        </motion.article>
      </AnimatePresence>
    </div>
    <GalleryLightbox photos={availablePhotos} startIndex={photoIndex} open={galleryOpen} onClose={() => setGalleryOpen(false)} onPhotoError={markPhotoUnavailable} triggerRef={galleryTriggerRef} displayName={name} tapToClose={homeMode} minimal={homeMode} />
    <div className={`relative z-10 mt-5 flex min-h-14 items-center justify-center ${homeMode ? 'gap-3' : 'gap-4'}`}>
      {homeMode && <button type="button" disabled={isPremium && !passedProfiles.length} onClick={() => void rewind()} aria-label={isPremium ? 'Back to last passed profile' : 'Back is available with Premium'} title={isPremium ? (passedProfiles.length ? 'Back to last passed profile' : 'No passed profiles yet') : 'Premium feature'} className="grid h-14 w-14 place-items-center rounded-full bg-card text-slate-500 shadow-md ring-1 ring-black/5 transition-transform active:scale-95 disabled:opacity-40"><RotateCcw className="h-7 w-7" /></button>}
      <button type="button" onClick={() => void dislike()} aria-label={`Skip ${name}`} className={`${homeMode ? 'h-14 w-14 text-violet-600' : 'h-11 w-11 text-violet-600'} grid place-items-center rounded-full bg-card shadow-md ring-1 ring-black/5 transition-transform active:scale-95`}><SkipForward className={`${homeMode ? 'h-7 w-7' : 'h-6 w-6'} -scale-x-100`} strokeWidth={2.4} /></button>
      {homeMode && <button type="button" disabled={liking} onClick={() => void superLike()} aria-label={isPremium ? `Spark ${name}` : 'Spark is available with Premium'} className="grid h-14 w-14 place-items-center rounded-full bg-card text-sky-500 shadow-md ring-1 ring-black/5 transition-transform active:scale-95 disabled:opacity-60"><Star className="h-7 w-7 fill-current" /></button>}
      <button type="button" disabled={liking} onClick={() => void like()} aria-label={`Like ${name}`} className={`${homeMode ? 'h-14 w-14 bg-gradient-to-br from-emerald-400 to-green-600 shadow-[0_12px_28px_rgba(34,197,94,.34)]' : 'h-11 w-11 bg-primary'} grid place-items-center rounded-full text-primary-foreground shadow-md transition-transform disabled:opacity-60 active:scale-95`}><Heart className={homeMode ? 'h-7 w-7 fill-current' : 'h-6 w-6 fill-current'} /></button>
    </div>
    {homeMode && <HomeProfileDetails person={person} name={name} photos={availablePhotos} onPhotoError={markPhotoUnavailable} onOpenGallery={() => setGalleryOpen(true)} />}
    <AlertDialog open={!!premiumPrompt} onOpenChange={open => { if (!open) setPremiumPrompt(null); }}>
      <AlertDialogContent className="max-w-sm rounded-[1.5rem]">
        <AlertDialogHeader>
          <AlertDialogTitle>Available with Premium</AlertDialogTitle>
          <AlertDialogDescription>{premiumPrompt === 'rewind' ? 'Back lets you bring back the last profile you passed.' : 'Spark is a Premium feature. Upgrade to send priority Likes.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPremiumPrompt(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { const feature = premiumPrompt; setPremiumPrompt(null); showUpgrade(feature); }}>Upgrade to Premium</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {matchCelebration}
    <ReportSheet open={!!reportTarget} onOpenChange={open => { if (!open) setReportTarget(null); }} target={reportTarget} />
    {!homeMode && index > 0 && <button type="button" onClick={previous} className="mx-auto mt-4 flex min-h-11 items-center gap-1.5 px-3 text-sm font-medium text-muted-foreground"><RotateCcw className="h-4 w-4" />Previous profile</button>}
  </section>;
}

function HomeProfileCard({ person, name, ageLabel, photos, photoIndex, setPhotoIndex, onOpenGallery, onPhotoError, galleryTriggerRef, exit, dragX, onSwipeLeft, onSwipeRight }) {
  const interests = Array.isArray(person?.interests) ? person.interests.filter(Boolean).slice(0, 3) : [];
  const lookingFor = Array.isArray(person?.looking_for_tags) ? person.looking_for_tags.filter(Boolean) : [];
  const numericDistance = Number(person?.distance_km ?? person?.distance);
  const distance = person?.distance_label || (Number.isFinite(numericDistance) && numericDistance >= 0 ? `About ${numericDistance < 1 ? '< 1' : Math.round(numericDistance)} km away` : 'Distance unavailable');
  const location = person?.city || person?.country || '';
  const likeOpacity = useTransform(dragX, [24, 126], [0, 1]);
  const nopeOpacity = useTransform(dragX, [-126, -24], [1, 0]);
  const pointer = useRef(null);
  const suppressPhotoClick = useRef(false);
  const onPointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), horizontal: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = event => {
    const active = pointer.current;
    if (!active || active.id !== event.pointerId) return;
    const deltaX = event.clientX - active.x;
    const deltaY = event.clientY - active.y;
    // Preserve vertical scrolling until the gesture is clearly a swipe.
    if (!active.horizontal && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 7) return;
    if (Math.abs(deltaX) > 5) { active.horizontal = true; suppressPhotoClick.current = true; }
    if (active.horizontal) dragX.set(Math.max(-310, Math.min(310, deltaX)));
  };
  const finishPointer = event => {
    const active = pointer.current;
    if (!active || active.id !== event.pointerId) return;
    pointer.current = null;
    const deltaX = event.clientX - active.x;
    const elapsed = Math.max(1, performance.now() - active.time);
    const velocity = (deltaX / elapsed) * 1000;
    const right = active.horizontal && (deltaX > 92 || velocity > 560);
    const left = active.horizontal && (deltaX < -92 || velocity < -560);
    if (right) { onSwipeRight(); return; }
    if (left) { onSwipeLeft(); return; }
    animate(dragX, 0, { type: 'spring', stiffness: 420, damping: 31 });
  };
  return <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={finishPointer} onPointerCancel={() => { pointer.current = null; animate(dragX, 0, { type: 'spring', stiffness: 420, damping: 31 }); }} className="relative h-full w-full touch-pan-y bg-slate-900 text-white">
    {photos.length ? <button ref={galleryTriggerRef} type="button" aria-label={`Open ${name}'s photos full screen`} onClick={() => { if (!suppressPhotoClick.current) onOpenGallery(); suppressPhotoClick.current = false; }} className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"><img src={photos[photoIndex]?.src} alt={photos[photoIndex]?.alt} onError={() => onPhotoError?.(photos[photoIndex]?.src)} className="h-full w-full select-none object-cover object-top" draggable="false" /></button> : <div className="absolute inset-0 bg-nmood-gradient" />}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/32 via-45% to-black/5" />
    <motion.p style={{ opacity: exit === 'right' ? 1 : likeOpacity }} className="pointer-events-none absolute left-6 top-8 z-30 -rotate-12 rounded-lg border-4 border-emerald-300 px-3 py-1 text-2xl font-black tracking-[.16em] text-emerald-200">LIKE</motion.p>
    <motion.p style={{ opacity: exit === 'left' ? 1 : nopeOpacity }} className="pointer-events-none absolute right-6 top-8 z-30 rotate-12 rounded-lg border-4 border-rose-300 px-3 py-1 text-2xl font-black tracking-[.16em] text-rose-200">NOPE</motion.p>
    {photos.length > 1 && <><div aria-hidden="true" className="absolute inset-x-4 top-4 z-10 flex gap-1.5">{photos.map((_, itemIndex) => <span key={itemIndex} className={`h-1 flex-1 rounded-full ${itemIndex === photoIndex ? 'bg-white' : 'bg-white/40'}`} />)}</div><button type="button" aria-label="Previous photo" disabled={photoIndex === 0} onClick={() => setPhotoIndex(value => Math.max(0, value - 1))} className="absolute inset-y-0 left-0 z-20 w-1/3 disabled:cursor-default" /><button type="button" aria-label="Next photo" disabled={photoIndex === photos.length - 1} onClick={() => setPhotoIndex(value => Math.min(photos.length - 1, value + 1))} className="absolute inset-y-0 right-0 z-20 w-1/3 disabled:cursor-default" /></>}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-6 pt-24">
      {interests.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{interests.map(interest => <span key={interest} className="rounded-full border border-white/40 bg-black/30 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">{humanize(interest)}</span>)}</div>}
      <h2 className="text-3xl font-bold leading-none tracking-tight drop-shadow">{name}{ageLabel ? `, ${ageLabel}` : ''}</h2>
      <p className="mt-2 flex items-center gap-1 text-sm font-medium text-white/95 drop-shadow"><MapPin className="h-4 w-4 shrink-0" />{[location, distance].filter(Boolean).join(' · ')}</p>
      {lookingFor.length > 0 && <p className="mt-2 line-clamp-1 text-xs font-semibold text-white/90 drop-shadow">Looking for: {lookingFor.map(humanize).join(', ')}</p>}
    </div>
  </div>;
}

// Home is a compact discovery deck first. The information below it remains in
// the normal page scroll, so vertical reading never competes with card swipes.
// These fields arrive only through the existing privacy-filtered discovery RPC.
function HomeProfileDetails({ person, name, photos, onPhotoError, onOpenGallery }) {
  const lookingFor = Array.isArray(person?.looking_for_tags) ? person.looking_for_tags.filter(Boolean) : [];
  const languages = Array.isArray(person?.languages) ? person.languages.filter(Boolean) : [];
  const lifestyle = [
    ['Drinking', person?.drinking],
    ['Smoking', person?.smoking],
    ['Lifestyle', person?.lifestyle],
    ['Zodiac', person?.zodiac],
  ].filter(([, value]) => value);
  const work = person?.work_text || person?.occupation;
  const hasDetails = person?.bio || lookingFor.length || work || person?.height_cm || lifestyle.length || languages.length || photos.length;
  if (!hasDetails) return null;
  return <section aria-label={`${name}'s profile details`} className="relative z-10 mt-7 space-y-6 rounded-[2rem] bg-card px-5 py-6 text-foreground shadow-sm ring-1 ring-black/5">
    {person?.bio && <section><h2 className="text-2xl font-bold tracking-tight">About {name}</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{person.bio}</p></section>}
    {lookingFor.length > 0 && <section><h2 className="text-xl font-bold tracking-tight">Looking for</h2><div className="mt-3 flex flex-wrap gap-2">{lookingFor.map(tag => <span key={tag} className="rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">{humanize(tag)}</span>)}</div></section>}
    {(work || person?.height_cm) && <section><h2 className="text-xl font-bold tracking-tight">Work & details</h2><dl className="mt-3 divide-y divide-border rounded-2xl border bg-muted/20 px-4"><DetailRow label="Work" value={work} />{person?.height_cm && <DetailRow label="Height" value={`${Math.round(Number(person.height_cm))} cm`} />}</dl></section>}
    {lifestyle.length > 0 && <section><h2 className="text-xl font-bold tracking-tight">Lifestyle</h2><dl className="mt-3 divide-y divide-border rounded-2xl border bg-muted/20 px-4">{lifestyle.map(([label, value]) => <DetailRow key={label} label={label} value={humanize(value)} />)}</dl></section>}
    {languages.length > 0 && <section><h2 className="text-xl font-bold tracking-tight">Languages</h2><div className="mt-3 flex flex-wrap gap-2">{languages.map(language => <span key={language} className="rounded-full border bg-muted/30 px-3 py-2 text-xs font-medium">{language}</span>)}</div></section>}
    {photos.length > 0 && <section><div className="flex items-center justify-between"><h2 className="text-xl font-bold tracking-tight">Photo moments</h2><button type="button" onClick={onOpenGallery} className="min-h-11 px-2 text-sm font-semibold text-primary">View all</button></div><button type="button" onClick={onOpenGallery} aria-label={`View all of ${name}'s photos`} className="mt-3 grid w-full grid-cols-2 gap-2 overflow-hidden rounded-2xl text-left">{photos.slice(0, 4).map((photo, photoIndex) => <span key={photo.id || photo.src} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"><img src={photo.src} alt={photoIndex === 0 ? `${name} photo` : ''} onError={() => onPhotoError?.(photo.src)} className="h-full w-full object-cover" loading="lazy" />{photoIndex === 3 && photos.length > 4 && <span className="absolute inset-0 grid place-items-center bg-black/55 text-lg font-bold text-white">+{photos.length - 4}</span>}</span>)}</button></section>}
    <p className="border-t pt-4 text-center text-xs text-muted-foreground">Only details {name} chooses to share are shown.</p>
  </section>;
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-3 py-3 text-sm"><dt className="font-semibold">{label}</dt><dd className="text-right text-muted-foreground">{value}</dd></div>;
}

function commonInterests(viewer, person) {
  const mine = new Set((viewer?.interests || []).map(value => String(value).trim().toLowerCase()).filter(Boolean));
  return (person?.interests || []).filter(value => mine.has(String(value).trim().toLowerCase()));
}
