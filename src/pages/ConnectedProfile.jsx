import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSafeBack } from '@/lib/safe-navigation';
import { ArrowLeft, Flag, UserMinus, Loader2, Ban, MessageCircle, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { removeConnection } from '@/lib/connections-store';
import { useToast } from '@/components/ui/use-toast';
import { useSafety } from '@/lib/safety-store';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import ReportSheet from '@/components/safety/ReportSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useMemberName } from '@/lib/member-names';
import { useMemberProfile } from '@/lib/member-profile-view';
import ProfileTeaserView from '@/components/profile/tiers/ProfileTeaserView';
import ProfileFullView from '@/components/profile/tiers/ProfileFullView';
import PremiumDevPanel from '@/components/dev/PremiumDevPanel';

/**
 * Build a teaser-level profile object from a directly-read Member record.
 * Used only as a fallback when the gated resolution returns no profile
 * (self, transient error) so the page renders a light teaser instead of a
 * dead-end lock. Only the public teaser fields are derived here — anything
 * richer comes solely from the gated resolveMemberProfile.
 */
function previewFromMember(m, { full = false } = {}) {
  if (!m) return null;
  // Teaser fields (always safe — the teaser view only reads these).
  const base = {
    member_id: m.id,
    user_id: m.created_by_id,
    display_name: m.display_name || '',
    photo_url: m.photo_url || '',
    city: m.city || '',
    country: m.country || '',
    interests: (Array.isArray(m.interests) ? m.interests : []).slice(0, 4),
    profile_visibility: m.profile_visibility || 'connections',
  };
  // Full fields — only surfaced when the viewer is Premium (the full view
  // renders exclusively for premium/connected tiers, so a free viewer never
  // sees these even if they're present on the object).
  if (full) {
    base.interests = Array.isArray(m.interests) ? m.interests : [];
    base.bio = m.bio || '';
    base.languages = Array.isArray(m.languages) ? m.languages : [];
    base.lifestyle = m.lifestyle || '';
    base.photo_gallery = Array.isArray(m.photo_gallery) ? m.photo_gallery : [];
    base.show_age = !!m.show_age;
    if (m.show_age && m.date_of_birth) {
      const d = new Date(m.date_of_birth);
      if (!isNaN(d.getTime())) {
        base.age = Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000));
      }
    }
  }
  return base;
}

export default function ConnectedProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleBack = useSafeBack('/pals');
  const { user, member: myMember } = useAuth();
  console.debug('[nav] ConnectedProfile mounted', { routeId: id, viewerUserId: user?.id, viewerMemberId: myMember?.id });
  const { toast } = useToast();
  const { t } = useLocalization();
  const { showUpgrade, isPremium } = useMembershipAccess();
  const { data: palName } = useMemberName({ memberId: id });
  const { data: profileRes, isLoading: profileLoading, refetch: refetchProfile } = useMemberProfile({ userId: id });
  const [connection, setConnection] = useState(null);
  const [loadingConn, setLoadingConn] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [fallback, setFallback] = useState(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);

  const { isBlocked, block } = useSafety();
  const [reportOpen, setReportOpen] = useState(false);

  // Server-gated profile (authoritative for premium / full fields).
  const gated = profileRes?.profile || null;
  const serverBlocked = !!profileRes?.blocked;
  // The route param is the Member entity id (unique). The pal's user id
  // (created_by_id) is resolved from the fetched member and used for all
  // user-id-based checks (block, connection, message, report).
  const preview = gated || previewFromMember(fallback, { full: isPremium });
  const palUserId = preview?.user_id || '';
  console.debug('[nav] ConnectedProfile resolved', {
    routeId: id,
    hasGated: !!gated,
    hasFallback: !!fallback,
    palUserId,
    isSelfByEntity: !!(myMember?.id && String(id) === String(myMember.id)),
    viewerUserId: user?.id,
    fallbackMatchesViewer: !!(fallback && myMember && String(fallback.id) === String(myMember.id)),
  });
  // Server is the SOLE authority for block status (requirement #13).
  // The client-side isBlocked() cache is NOT used for the profile view
  // because it can be stale (deleted records, self-blocks, demo data) and
  // produce false positives. The server's isBlockedPair checks the database
  // bidirectionally with a self-block guard on every call.
  const localBlocked = isBlocked(palUserId); // kept for diagnostic only
  const effectivelyBlocked = serverBlocked;
  // Self only when the route id is the viewer's own member record (entity id
  // match) — not when created_by_id matches, since demo/imported members
  // share created_by_id with the viewer.
  const isSelf = !!user?.id && !!myMember?.id && String(id) === String(myMember.id);
  // Single source of truth: the client premium flag (the SAME entitlement the
  // subscription page reads via useMembershipAccess) decides the view tier.
  // A Premium viewer is NEVER shown the teaser/upgrade — even if the backend
  // resolveMemberProfile call failed or returned null. Free viewers fall back
  // to the server's tier (teaser with upgrade CTA, or full if connected).
  const tier = isPremium ? 'full' : (profileRes?.tier || 'teaser');
  const displayName = palName || preview?.display_name || t('profile.member_name');

  useEffect(() => {
    if (!user?.id || !palUserId) { setLoadingConn(false); return; }
    let active = true;
    (async () => {
      try {
        // Bidirectional — mirrors the server's connection check so the local
        // action bar matches the server's `connected` verdict (a Pal link
        // may have been created by either side). Uses the pal's user id
        // (created_by_id), not the route entity id.
        const [fwd, rev] = await Promise.all([
          base44.entities.PalConnection.filter({ created_by_id: String(user.id), pal_user_id: String(palUserId), is_active: true }).catch(() => []),
          base44.entities.PalConnection.filter({ created_by_id: String(palUserId), pal_user_id: String(user.id), is_active: true }).catch(() => []),
        ]);
        if (active) setConnection((fwd && fwd[0]) || (rev && rev[0]) || null);
      } catch {
        // ignore
      } finally {
        if (active) setLoadingConn(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id, palUserId]);

  // Fallback direct read — only when the gated resolution yielded no profile
  // and the viewer isn't blocked. Re-fetches when the route id changes.
  useEffect(() => {
    if (!id || effectivelyBlocked || gated || profileLoading) {
      setFallback(null);
      setFallbackLoading(false);
      return;
    }
    let active = true;
    setFallbackLoading(true);
    (async () => {
      try {
        // Primary: the route param is the Member entity id (unique per member).
        let list = [];
        try {
          const direct = await base44.entities.Member.get(String(id));
          if (direct) list = [direct];
        } catch { /* not an entity id */ }
        // Defense: a legacy caller may have passed a user id (created_by_id).
        if (list.length === 0) {
          const rows = await base44.entities.Member.filter({ created_by_id: String(id) }).catch(() => []);
          list = Array.isArray(rows) ? rows : [];
        }
        if (active) {
          const rec = list.length ? list[0] : null;
          console.debug('[nav] ConnectedProfile fallback resolved', {
            routeId: id,
            found: !!rec,
            resolvedEntityId: rec?.id,
            resolvedName: rec?.display_name,
            resolvedUserId: rec?.created_by_id,
            matchesViewerMember: !!(rec && myMember && String(rec.id) === String(myMember.id)),
          });
          setFallback(rec);
        }
      } catch {
        if (active) setFallback(null);
      } finally {
        if (active) setFallbackLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, effectivelyBlocked, gated, profileLoading]);

  const connected = !!connection;

  const myInterests = myMember?.interests || [];
  const palInterests = preview?.interests || [];
  const sharedInterests = palInterests.filter((i) => myInterests.includes(i));
  const showAge = gated?.show_age === true && gated?.age != null;
  // Connect CTA target — shown to unconnected, non-self viewers.
  const connectMember = (!connected && !isSelf && palUserId)
    ? { id: String(palUserId), name: displayName, avatar: preview?.photo_url || '', sharedInterests }
    : null;

  const handleRemove = async () => {
    if (!connection) return;
    setRemoving(true);
    try {
      await removeConnection(connection);
      toast({ title: t('profile.public.removed_title'), description: t('profile.public.removed_desc', { name: displayName || t('profile.public.pal') }) });
      navigate('/pals');
    } catch {
      setRemoving(false);
    }
  };

  // BUG-001: Navigate directly to the 1:1 Chat screen. The authorizationGate
  // backend creates the PrivateConversation if one does not exist, then the
  // Chat page loads it. Never route through the intermediate Messages list.
  const handleMessage = async () => {
    if (!palUserId) return;
    try {
      await base44.functions.invoke('authorizationGate', {
        action: 'sendMessage', scope: 'private', targetUserId: String(palUserId),
        senderName: user?.full_name || '',
        receiverName: displayName || '',
        authorizeOnly: true,
      });
    } catch { /* non-fatal — Chat page handles missing conversation */ }
    navigate(`/messages/${palUserId}`);
  };

  const handleBlock = async () => {
    if (!palUserId) return;
    try {
      await block({ id: String(palUserId), name: displayName || '', avatar: preview?.photo_url || '' });
      toast({ title: 'Member blocked', description: `${displayName || 'Member'} can no longer contact you.` });
      // Refetch the server profile so it returns blocked: true immediately.
      await refetchProfile();
    } catch { /* ignore */ }
  };

  const loading = profileLoading || loadingConn || fallbackLoading;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <button
        onClick={handleBack}
        type="button"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-default mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>

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
          <h2 className="font-semibold text-lg mb-1">{t('profile.public.blocked_title')}</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
            {t('profile.public.blocked_desc')}
          </p>
          <Button variant="outline" onClick={() => navigate('/safety-center')}>{t('profile.public.go_safety')}</Button>
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
          <Button variant="outline" onClick={handleBack}>{t('common.back')}</Button>
        </div>
      ) : (tier === 'full' || tier === 'preview') ? (
        <ProfileFullView
          profile={preview}
          displayName={displayName}
          sharedInterests={sharedInterests}
          showAge={showAge}
          connectMember={connectMember}
          onReport={() => setReportOpen(true)}
        />
      ) : (
        <ProfileTeaserView
          profile={preview}
          displayName={displayName}
          isSelf={isSelf}
          sharedInterests={sharedInterests}
          onReport={() => setReportOpen(true)}
          onUpgrade={() => showUpgrade('view_profile')}
          connectMember={connectMember}
        />
      )}

      {/* Sticky thumb-zone action bar — primary actions always reachable
          on large phones (mirrors ExperienceDetail / CommunityDetail). */}
      {connected && !effectivelyBlocked && (
        <div className="fixed bottom-16 md:bottom-4 start-0 end-0 z-30 px-4 py-3 bg-background/85 backdrop-blur-xl border-t border-border/60">
          <div className="max-w-2xl mx-auto flex gap-2.5">
            <Button variant="outline" className="flex-1 gap-2 h-14 rounded-button shadow-soft" onClick={handleMessage}>
              <MessageCircle className="w-5 h-5" /> {t('profile.public.message')}
            </Button>
            <Button variant="outline" className="gap-2 h-14 rounded-button shadow-soft text-destructive hover:text-destructive px-3" onClick={() => setReportOpen(true)} title="Report">
              <Flag className="w-5 h-5" />
            </Button>
            <Button variant="outline" className="gap-2 h-14 rounded-button shadow-soft text-destructive hover:text-destructive px-3" onClick={handleBlock} title="Block">
              <Ban className="w-5 h-5" />
            </Button>
            <Button variant="outline" className="flex-1 gap-2 h-14 rounded-button shadow-soft text-destructive hover:text-destructive" onClick={handleRemove} disabled={removing}>
              <UserMinus className="w-5 h-5" /> {removing ? t('profile.public.removing') : t('profile.public.remove')}
            </Button>
          </div>
        </div>
      )}

      <ReportSheet open={reportOpen} onOpenChange={setReportOpen} target={{ type: 'member', id: String(palUserId), name: displayName, image: preview?.photo_url }} />

      {/* TEMP DEV-ONLY — remove once the entitlement bug is fixed. */}
      <PremiumDevPanel profileRes={profileRes} routeId={id} />
    </div>
  );
}