import ProfileUpgradeScreen from '@/components/profile/ProfileUpgradeScreen';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Flag, Loader2, Ban, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { callSupabaseRpc, getDirectMessageAccess, recordProfileViewEvent } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useSafety } from '@/lib/safety-store';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import ReportSheet from '@/components/safety/Phase1ReportSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useMemberName } from '@/lib/member-names';
import { useMemberProfile } from '@/lib/member-profile-view';
import { fetchMemberIdentityVerified } from '@/lib/member-verification-badge';
import ProfileTeaserView from '@/components/profile/tiers/ProfileTeaserView';
import { Capacitor } from '@capacitor/core';
import ModernMemberProfile from '@/components/profile/ModernMemberProfile';
import PremiumDevPanel from '@/components/dev/PremiumDevPanel';
import ConnectButton from '@/components/connections/ConnectButton';
import AndroidConnectionCelebration from '@/components/connections/AndroidConnectionCelebration';
import { connectionCelebrationType } from '@/lib/connection-celebration';

export default function ConnectedProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, member: myMember } = useAuth();
  console.debug('[nav] ConnectedProfile mounted', { routeId: id, viewerUserId: user?.id, viewerMemberId: myMember?.id });
  const { toast } = useToast();
  const { t } = useLocalization();
  const { showUpgrade, isPremium, entitlementState, reconciliationStatus, sync } = useMembershipAccess();
  const { data: palName } = useMemberName({ memberId: id });
  const { data: profileRes, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useMemberProfile({ userId: id });
  const [retryingPremium, setRetryingPremium] = useState(false);
  const [premiumRetryError, setPremiumRetryError] = useState(false);
  const [connection, setConnection] = useState(null);
  const [messageAccess, setMessageAccess] = useState({ connected: false, can_message: false });
  const [loadingConn, setLoadingConn] = useState(true);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [likeDecision, setLikeDecision] = useState('');
  const [likeMatch, setLikeMatch] = useState(false);
  const recordedViewRef = useRef('');

  const { isBlocked, block } = useSafety();
  const [reportOpen, setReportOpen] = useState(false);

  // Server-gated profile (authoritative for premium / full fields).
  const gated = profileRes?.profile || null;
  const serverBlocked = !!profileRes?.blocked;
  // The server returns an entitlement-filtered projection. Never fetch a full
  // Member row as a client-side fallback: Explorer responses must not contain
  // fields that are merely hidden with CSS.
  const preview = gated;
  const palUserId = preview?.user_id || '';
  console.debug('[nav] ConnectedProfile resolved', {
    routeId: id,
    hasGated: !!gated,
    palUserId,
    isSelfByEntity: !!(myMember?.id && String(id) === String(myMember.id)),
    viewerUserId: user?.id,
  });
  // Server is the SOLE authority for block status (requirement #13).
  // The client-side isBlocked() cache is NOT used for the profile view
  // because it can be stale (deleted records, self-blocks, demo data) and
  // produce false positives. The server's isBlockedPair checks the database
  // bidirectionally with a self-block guard on every call.
  // A server-blocked profile intentionally contains no profile projection, so
  // use the route member id as the fallback for the direction check.
  const accessMemberId = palUserId || id;
  const localBlocked = isBlocked(accessMemberId); // kept for diagnostic only
  const effectivelyBlocked = serverBlocked || messageAccess.blocked;
  // Block direction is server-authoritative. Only the member who created a
  // block may be offered an unblock route; the other member stays unable to
  // view or contact them.
  const viewerBlockedMember = messageAccess.viewer_blocked_member === true || (!messageAccess.blocked_by_member && localBlocked);
  // Self only when the route id is the viewer's own member record (entity id
  // match) — not when created_by_id matches, since demo/imported members
  // share created_by_id with the viewer.
  const isSelf = !!user?.id && !!myMember?.id && String(id) === String(myMember.id);
  // MobileNav is an in-flow 63px row. Android adds a 32px gesture-area
  // reserve beneath it, so fixed profile actions must clear both layers.
  const actionBarBottom = Capacitor.getPlatform() === 'android'
    ? 'calc(63px + max(32px, env(safe-area-inset-bottom, 0px)))'
    : 'calc(63px + env(safe-area-inset-bottom, 0px))';
  // Tier is decided by the authenticated database RPC from server entitlement,
  // privacy, connection and block state—not by a client Premium assumption.
  const tier = profileRes?.tier || 'unavailable';
  const displayName = preview?.display_name || palName || t('profile.member_name');

  useEffect(() => {
    if (!user?.id || !accessMemberId) { setLoadingConn(false); return; }
    let active = true;
    (async () => {
      try {
        // Bidirectional — mirrors the server's connection check so the local
        // action bar matches the server's `connected` verdict (a Pal link
        // may have been created by either side). Uses the pal's user id
        // (created_by_id), not the route entity id.
        const access = await getDirectMessageAccess(String(accessMemberId));
        if (active) {
          setMessageAccess(access);
          setConnection(access.connected ? { pal_user_id: String(accessMemberId) } : null);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoadingConn(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id, accessMemberId]);

  const connected = !!connection;

  // Public badge requires the authorized email, photo and phone status.
  useEffect(() => {
    if (!palUserId) { setIdentityVerified(false); return undefined; }
    let active = true;
    setIdentityVerified(false);
    fetchMemberIdentityVerified(palUserId).then((verified) => { if (active) setIdentityVerified(verified); });
    return () => { active = false; };
  }, [palUserId]);

  const myInterests = myMember?.interests || [];
  const palInterests = preview?.interests || [];
  const sharedInterests = palInterests.filter((i) => myInterests.includes(i));
  const showAge = gated?.show_age === true && gated?.age != null;
  const incomingLike = location.state?.incomingLike === true;
  const incomingSpark = location.state?.incomingSpark === true;
  const androidConnectionCelebration = connectionCelebrationType({
    isAndroid: Capacitor.getPlatform() === 'android',
    incomingSpark,
    serverMatched: likeMatch,
  });
  // Connect CTA target — shown to unconnected, non-self viewers.
  const actionMember = (!isSelf && palUserId)
    ? { id: String(palUserId), name: displayName, avatar: preview?.photo_url || '', sharedInterests }
    : null;

  const handleBlock = async () => {
    if (!palUserId) return;
    try {
      await block({ id: String(palUserId), name: displayName || '', avatar: preview?.photo_url || '' });
      toast({ title: 'Member blocked', description: `${displayName || 'Member'} can no longer contact you.` });
      // Refetch the server profile so it returns blocked: true immediately.
      await refetchProfile();
    } catch { /* ignore */ }
  };

  const respondToIncomingLike = async (decision) => {
    if (!incomingLike || !id || likeDecision) return;
    setLikeDecision(decision);
    try {
      const result = await callSupabaseRpc('nmood_respond_to_incoming_like', { p_member_id: String(id), p_decision: decision });
      window.dispatchEvent(new Event('nmood:likes-changed'));
      if (decision === 'accept') {
        setLikeMatch(result?.matched === true);
        if (result?.matched !== true) navigate('/likes', { replace: true });
      } else {
        toast({ title: 'Like declined', description: `${displayName} will not appear in your discovery.` });
        navigate('/likes', { replace: true });
      }
    } catch {
      toast({ title: 'Could not save your decision', description: 'Please try again.', variant: 'destructive' });
    } finally { setLikeDecision(''); }
  };

  const blockIncomingLiker = async () => {
    if (!incomingLike || !id || likeDecision) return;
    setLikeDecision('block');
    try {
      await block({ id: String(id), name: displayName || '', avatar: preview?.photo_url || '' });
      window.dispatchEvent(new Event('nmood:likes-changed'));
      toast({ title: 'Member blocked', description: `${displayName} can no longer contact you.` });
      navigate('/likes', { replace: true });
    } catch { toast({ title: 'Could not block member', description: 'Please try again.', variant: 'destructive' }); }
    finally { setLikeDecision(''); }
  };

  useEffect(() => {
    if (!preview || profileRes?.tier !== 'full' || isSelf || effectivelyBlocked || !palUserId) return;
    const key = String(palUserId);
    if (recordedViewRef.current === key) return;
    recordedViewRef.current = key;
    recordProfileViewEvent(key).catch(() => { recordedViewRef.current = ''; });
  }, [preview, isSelf, effectivelyBlocked, palUserId]);

  const loading = !preview && (profileLoading || loadingConn);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profileRes?.tier === 'upgrade') return <ProfileUpgradeScreen />;
  if (profileError) return <section role="alert" className="p-8"><h1>Profile could not be loaded</h1><p>Check your connection and try again.</p><Button onClick={()=>refetchProfile()}>Retry</Button></section>;

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* TEMP DEV-ONLY diagnostic — block + entitlement verification.
          Not shown in production. Remove once the false-block fix is verified. */}
      {import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === 'block' && (
        <div className="mb-3 rounded-lg border border-primary/30 bg-primary/[0.04] px-3 py-2 text-[11px] font-mono text-muted-foreground space-y-0.5">
          <div>viewer id = <span className="text-foreground">{user?.id || '(none)'}</span></div>
          <div>target member id (route) = <span className="text-foreground">{id}</span></div>
          <div>target user id (created_by_id) = <span className="text-foreground">{palUserId || '(none)'}</span></div>
          <div>server blocked = <span className={serverBlocked ? 'text-destructive font-semibold' : 'text-success font-semibold'}>{String(serverBlocked)}</span></div>
          <div>local blocked (cache, non-authoritative) = <span className="text-foreground">{String(localBlocked)}</span></div>
          <div>server tier = <span className="text-foreground">{profileRes?.tier || '(none)'}</span></div>
          <div>subscription = <span className={isPremium ? 'text-success font-semibold' : 'text-muted-foreground'}>{isPremium ? 'premium' : 'explorer'}</span></div>
          <div>effectively blocked = <span className={effectivelyBlocked ? 'text-destructive font-semibold' : 'text-success font-semibold'}>{String(effectivelyBlocked)}</span></div>
        </div>
      )}

      {effectivelyBlocked ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Ban className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-lg mb-1">{viewerBlockedMember ? 'This member is blocked' : 'This member is unavailable'}</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
            {viewerBlockedMember
              ? 'You’ve blocked this member. Unblock them from the Safety Center to see their profile again.'
              : 'You can’t view this profile or contact this member.'}
          </p>
          {viewerBlockedMember && <Button variant="outline" onClick={() => navigate('/safety-center')}>Go to Safety Center</Button>}
        </div>
      ) : !preview ? (
        // Soft "couldn't load" state — never a dead-end lock. The viewer can
        // go back; this only renders when neither the gated profile nor a
        // direct Member read yielded anything (genuinely unavailable).
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <UserX className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-lg mb-1">{t('profile.public.unavailable_title')}</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
            {t('profile.public.unavailable_desc')}
          </p>
        </div>
      ) : (tier === 'full' || tier === 'preview') ? (
        <ModernMemberProfile
          profile={preview}
          displayName={displayName}
          identityVerified={identityVerified}
          sharedInterests={sharedInterests}
          showAge={showAge}
          isConnected={connected}
        />
      ) : (
        <ProfileTeaserView
          profile={preview}
          displayName={displayName}
          identityVerified={identityVerified}
          isSelf={isSelf}
          sharedInterests={sharedInterests}
          onUpgrade={() => showUpgrade('view_profile')}
          showUpgradePrompt={tier !== 'full' && !isPremium && !['loading', 'reconciling'].includes(entitlementState)}
        />
      )}

      {preview && !effectivelyBlocked && tier !== 'full' && (
        ['loading', 'reconciling', 'unavailable'].includes(entitlementState)
        || reconciliationStatus === 'not_confirmed' || premiumRetryError
      ) && (
        <aside role="status" className="mt-4 rounded-xl border border-border bg-card p-4 space-y-2">
          <p>{retryingPremium || ['loading', 'reconciling'].includes(entitlementState)
            ? 'Checking Premium access. You can keep using this profile.'
            : 'Premium could not be confirmed. Explorer profile access is available.'}</p>
          <Button variant="outline" disabled={retryingPremium} onClick={async () => {
            setRetryingPremium(true);
            setPremiumRetryError(false);
            try { await sync(); await refetchProfile(); }
            catch { setPremiumRetryError(true); }
            finally { setRetryingPremium(false); }
          }}>{retryingPremium ? 'Checking Premium…' : 'Retry Premium check'}</Button>
        </aside>
      )}

      {/* One fixed action bar, above the 63px native tab row. */}
      {actionMember && !effectivelyBlocked && (
        <div data-testid="profile-action-panel" style={{ bottom: actionBarBottom }} className="fixed inset-x-0 z-40 mx-auto w-full max-w-2xl border-t border-border/60 bg-card p-3 shadow-soft">
          {incomingLike ? <div className="flex flex-wrap justify-center gap-2" data-testid="incoming-like-actions">
            <Button className="min-h-11 min-w-[7rem]" disabled={!!likeDecision} onClick={() => void respondToIncomingLike('accept')}>{likeDecision === 'accept' ? 'Liking back…' : incomingSpark ? 'Like back' : 'Accept'}</Button>
            <Button variant="outline" className="min-h-11 min-w-[7rem]" disabled={!!likeDecision} onClick={() => void respondToIncomingLike('reject')}>{likeDecision === 'reject' ? 'Skipping…' : incomingSpark ? 'Not now' : 'Reject'}</Button>
            <Button variant="outline" className="min-h-11 text-destructive hover:text-destructive" disabled={!!likeDecision} onClick={() => void blockIncomingLiker()}>{likeDecision === 'block' ? 'Blocking…' : 'Block'}</Button>
          </div> : <div className="flex flex-wrap justify-center gap-2">
            <ConnectButton member={actionMember} label="Open a connection" className="min-w-[9rem]" />
            <Button variant="outline" className="min-h-11 gap-2" onClick={() => setReportOpen(true)}><Flag className="w-4 h-4" /> Report</Button>
            <Button variant="outline" className="min-h-11 gap-2 text-destructive hover:text-destructive" onClick={handleBlock}><Ban className="w-4 h-4" /> Block</Button>
          </div>}
        </div>
      )}
      {likeMatch && (androidConnectionCelebration
        ? <AndroidConnectionCelebration type={androidConnectionCelebration} name={displayName} myPhoto={myMember?.photo_url} memberPhoto={preview?.photo_url} onMessage={() => navigate(`/messages/${encodeURIComponent(id)}`)} onDismiss={() => navigate('/likes', { replace: true })} />
        : <div role="dialog" aria-modal="true" aria-labelledby="match-title" className="fixed inset-0 z-[100] grid place-items-center bg-[#20104b]/75 p-5 backdrop-blur-md"><section className="w-full max-w-sm overflow-hidden rounded-[2.25rem] border border-white/30 bg-[#fdfbff] text-center shadow-[0_30px_90px_rgba(42,13,108,.5)]"><div className="relative z-20 overflow-visible bg-gradient-to-br from-[#3d159e] via-[#6928e5] to-[#a95aff] px-7 pb-10 pt-8 text-white"><div aria-hidden="true" className="absolute -left-20 -top-16 h-52 w-52 rounded-full border border-white/20 bg-white/10" /><div aria-hidden="true" className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full border border-white/20 bg-[#f0c8ff]/20" /><p className="relative text-[11px] font-bold uppercase tracking-[.28em] text-white/80">New connection</p><h2 id="match-title" className="relative mt-3 text-4xl font-black leading-none tracking-[-.065em]">IT’S A MATCH!</h2><p className="relative mt-3 text-sm font-medium text-white/90">You and {displayName} liked each other.</p><div className="absolute -bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center justify-center"><img src={myMember?.photo_url || preview?.photo_url} alt="Your profile" className="h-16 w-16 rounded-full border-3 border-white object-cover shadow-lg" /><span aria-hidden="true" className="-mx-3 z-10 grid h-10 w-10 place-items-center rounded-full border-4 border-[#7944ee] bg-white text-base text-[#6b32e7] shadow-lg">♥</span><img src={preview?.photo_url || myMember?.photo_url} alt={`${displayName}'s profile`} className="h-16 w-16 rounded-full border-3 border-white object-cover shadow-lg" /></div></div><div className="relative z-10 px-6 pb-6 pt-14"><p className="mt-1 text-sm leading-relaxed text-slate-600">Say hello and start the conversation.</p><div className="mt-6 grid gap-2"><Button className="min-h-12 bg-gradient-to-r from-[#5623d3] via-[#7540ef] to-[#9654fb] font-bold text-white shadow-[0_12px_24px_rgba(95,50,220,.34)] hover:from-[#5623d3] hover:via-[#7540ef] hover:to-[#9654fb]" onClick={() => navigate(`/messages/${encodeURIComponent(id)}`)}>Send {displayName} a message</Button><button type="button" className="min-h-11 text-sm font-semibold text-violet-700" onClick={() => navigate('/likes', { replace: true })}>Keep exploring</button></div></div></section></div>)}

      <ReportSheet open={reportOpen} onOpenChange={setReportOpen} target={{ type: 'member', id: String(palUserId), name: displayName, image: preview?.photo_url }} />

      {/* TEMP DEV-ONLY — remove once the entitlement bug is fixed. */}
      <PremiumDevPanel profileRes={profileRes} routeId={id} />
    </div>
  );
}
