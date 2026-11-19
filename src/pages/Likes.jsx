import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, LockKeyhole, Sparkles, Star, Users } from 'lucide-react';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useIncomingLikes, markIncomingLikesSeen } from '@/lib/incoming-likes-store';
import { useSignedMemberGallery } from '@/lib/member-gallery';
import { normalizeGallery, normalizeImageUrl } from '@/lib/gallery-normalizer';
import { useConfirm } from '@/components/ux/ConfirmProvider';
import { useAuth } from '@/lib/AuthContext';
import { mapConnection, useConnections } from '@/lib/connections-store';

function LikeCard({ like, onOpen }) {
  const signedGallery = useSignedMemberGallery(like.photo_gallery || [], like.id);
  const photo = normalizeGallery(signedGallery, like.display_name)[0]?.src || normalizeImageUrl(like.photo_url);
  return <button type="button" onClick={onOpen} className="overflow-hidden rounded-3xl border border-border/60 bg-card text-left shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={`Open ${like.display_name || 'member'}'s profile`}>
    <div className="aspect-[4/5] bg-muted">
      {photo ? <img src={photo} alt={like.display_name || 'Nmood member'} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />}
    </div>
    <div className="p-3">{like.super_liked && <p className="mb-1 flex items-center gap-1 text-xs font-bold text-sky-600"><Star className="h-3.5 w-3.5 fill-current" /> Spark</p>}<p className="font-semibold text-foreground">{like.display_name || 'Nmood member'}{like.age ? `, ${like.age}` : ''}</p><p className="mt-0.5 text-xs text-muted-foreground">{like.city || 'Nearby'}</p></div>
  </button>;
}

function LockedLike({ index, onUpgrade }) {
  return <button type="button" onClick={onUpgrade} className="relative overflow-hidden rounded-3xl border border-border/60 bg-card text-left shadow-sm transition-transform active:scale-[0.98]" aria-label="Unlock this Like with Premium">
    <div className={`aspect-[4/5] bg-gradient-to-br ${index % 2 ? 'from-primary/35 via-violet-200 to-accent/30' : 'from-violet-100 via-primary/30 to-pink-200'} blur-[10px]`} />
    <div className="absolute inset-0 grid place-items-center bg-background/20 backdrop-blur-[5px]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-card/90 text-primary shadow"><LockKeyhole className="h-5 w-5" /></span></div>
  </button>;
}

function PalCard({ pal, onOpen }) {
  const photo = normalizeImageUrl(pal.avatar);
  return <button type="button" onClick={onOpen} className="flex min-h-20 items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 text-left shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={`Open ${pal.name || 'Pal'}'s profile`}>
    {photo ? <img src={photo} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Users className="h-6 w-6" /></span>}
    <span className="min-w-0"><span className="block truncate font-semibold text-foreground">{pal.name || 'Pal'}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{pal.city || 'Your Pal'}{pal.sharedInterests?.length ? ` · ${pal.sharedInterests.slice(0, 2).join(', ')}` : ''}</span></span>
  </button>;
}

export default function Likes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, showUpgrade } = useMembershipAccess();
  const confirm = useConfirm();
  const { total, unread, likes, loading, refresh } = useIncomingLikes();
  const connectionState = useConnections(user);
  const pals = useMemo(() => (connectionState.connections || []).map(mapConnection), [connectionState.connections]);
  const [tab, setTab] = useState('likes');
  const premium = isPremium;
  // A Spark is a sender-paid priority introduction. Explorer members may see
  // and answer only these records; ordinary incoming Likes remain protected.
  const sparkLikes = !premium ? likes.filter((like) => like.super_liked) : [];
  const lockedLikeCount = Math.max(0, total - sparkLikes.length);

  useEffect(() => { void markIncomingLikesSeen(); }, []);
  const requestUpgrade = async () => {
    const approved = await confirm({
      title: 'See who likes you',
      description: 'Upgrade to Premium to reveal the people waiting for you.',
      confirmLabel: 'Upgrade',
      cancelLabel: 'Cancel',
      icon: <LockKeyhole className="h-6 w-6" />,
    });
    if (approved) showUpgrade('likes_you');
  };

  return <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-6 pt-5">
    <header className="mb-6 flex items-start justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Connections</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Likes</h1><p className="mt-1 text-sm text-muted-foreground">People who want to get to know you.</p></div>
      <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Heart className="h-6 w-6" fill="currentColor" />{unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#ff557a] px-1 text-center text-[10px] font-bold leading-5 text-white">{unread > 99 ? '99+' : unread}</span>}</span>
    </header>

    <div role="tablist" aria-label="Likes and Pals" className="mb-5 grid grid-cols-2 rounded-2xl bg-muted p-1.5">
      <button type="button" role="tab" aria-selected={tab === 'likes'} onClick={() => setTab('likes')} className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors ${tab === 'likes' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>Likes{total ? ` (${total})` : ''}</button>
      <button type="button" role="tab" aria-selected={tab === 'pals'} onClick={() => setTab('pals')} className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors ${tab === 'pals' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>Pals{pals.length ? ` (${pals.length})` : ''}</button>
    </div>

    {tab === 'pals' ? (connectionState.loading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading your Pals…</p> : pals.length === 0 ? <section className="mt-10 rounded-3xl border border-dashed border-primary/25 bg-primary/[0.03] p-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Users className="h-7 w-7" /></span><h2 className="mt-4 text-lg font-bold">No Pals yet</h2><p className="mt-2 text-sm text-muted-foreground">When a connection is accepted, they will appear here.</p></section> : <section><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-foreground">Your Pals</h2><button type="button" onClick={() => navigate('/pals')} className="text-sm font-semibold text-primary">Manage</button></div><div className="space-y-3">{pals.map(pal => <PalCard key={pal.id} pal={pal} onOpen={() => navigate(`/pal/${encodeURIComponent(pal.pal_user_id)}`)} />)}</div></section>) : loading && total === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Loading your likes…</p> : total === 0 ? <section className="mt-10 rounded-3xl border border-dashed border-primary/25 bg-primary/[0.03] p-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Heart className="h-7 w-7" /></span><h2 className="mt-4 text-lg font-bold">No likes yet</h2><p className="mt-2 text-sm text-muted-foreground">Keep exploring — people who like you will appear here.</p></section> : !premium ? <>
      {sparkLikes.length > 0 && <section><div className="mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><div><h2 className="font-bold text-foreground">Sparks for you</h2><p className="text-xs text-muted-foreground">A Spark lets you see this person and choose whether to Like back.</p></div></div><div className="grid grid-cols-2 gap-3">{sparkLikes.map((like) => <LikeCard key={like.id} like={like} onOpen={() => navigate(`/pal/${encodeURIComponent(like.id)}`, { state: { incomingLike: true, incomingSpark: true } })} />)}</div></section>}
      {lockedLikeCount > 0 && <><section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4320a6] via-primary to-[#8552ff] p-6 text-primary-foreground shadow-lg ${sparkLikes.length ? 'mt-6' : ''}`}><div className="relative z-10"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Likes You</div><h2 className="mt-3 text-3xl font-bold">{lockedLikeCount} {lockedLikeCount === 1 ? 'person likes' : 'people like'} you</h2><p className="mt-2 max-w-xs text-sm text-white/80">Their identities stay private until you unlock Premium.</p><button type="button" onClick={() => void requestUpgrade()} className="mt-5 min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-primary shadow-sm">See who likes you</button></div><Heart className="absolute -bottom-7 -right-6 h-40 w-40 text-white/10" fill="currentColor" /></section><section className="mt-6"><h2 className="mb-3 font-bold text-foreground">Waiting for you</h2><div className="grid grid-cols-2 gap-3">{Array.from({ length: Math.min(lockedLikeCount, 6) }, (_, index) => <LockedLike key={index} index={index} onUpgrade={() => void requestUpgrade()} />)}</div></section></>}
    </> : <section><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-foreground">People who like you</h2><button type="button" onClick={() => void refresh()} className="text-sm font-semibold text-primary">Refresh</button></div><div className="grid grid-cols-2 gap-3">{likes.map((like) => <LikeCard key={like.id} like={like} onOpen={() => navigate(`/pal/${encodeURIComponent(like.id)}`, { state: { incomingLike: true } })} />)}</div></section>}
  </main>;
}
