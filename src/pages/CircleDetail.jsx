import {circleAction} from '@/lib/participation-actions';
import PremiumMoment from '@/components/membership/PremiumMoment';
import { isIntroductionLimit } from '@/lib/premium-prompt-policy';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Pause,
  Archive,
  UserPlus,
  Check,
  X,
  Clock,
  Shield,
  Flag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { getMyInvitations, respondCircleInvitation } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { getMergedCircleById } from '@/lib/circle-store';
import { useOriginState } from '@/lib/safe-navigation';
import { useCircleMembership } from '@/components/circles/useCircleMembership';
import { useExplorerPolicy } from '@/lib/explorer-policy';

import CircleLocation from '@/components/circles/CircleLocation';
import CircleChat from '@/components/circles/CircleChat';
import CircleExperiences from '@/components/circles/CircleExperiences';
import CircleMembers from '@/components/circles/CircleMembers';
import CircleMemories from '@/components/circles/CircleMemories';

import ManageCircleSheet from '@/components/circles/ManageCircleSheet';
import ManageMembersSheet from '@/components/circles/ManageMembersSheet';
import EditCircleSheet from '@/components/circles/EditCircleSheet';
import DeleteConfirmSheet from '@/components/circles/DeleteConfirmSheet';
import CircleInviteSheet from '@/components/circles/CircleInviteSheet';
import TransferOwnershipSheet from '@/components/circles/TransferOwnershipSheet';

import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';

import ReportSheet from '@/components/safety/ReportSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { toast } from '@/components/ui/use-toast';
import { sharePublicContent } from '@/lib/native-share';
import { deleteOwnedCircle } from '@/lib/group-content-deletion';
import { emitActivityChange } from '@/lib/activity-store';

import SectionReveal from '@/components/experience/SectionReveal';

import CircleHero from '@/components/circles/premium/CircleHero';
import CircleStatsRow from '@/components/circles/premium/CircleStatsRow';
import CircleAboutSection from '@/components/circles/premium/CircleAboutSection';
import CircleAdmins from '@/components/circles/premium/CircleAdmins';
import CircleMembersPreview from '@/components/circles/premium/CircleMembersPreview';
import CircleUpcomingExperiences from '@/components/circles/premium/CircleUpcomingExperiences';
import CircleActivityTimeline from '@/components/circles/premium/CircleActivityTimeline';
import CircleGallery from '@/components/circles/premium/CircleGallery';
import CircleStickyCta from '@/components/circles/premium/CircleStickyCta';
import CircleDetailSkeleton from '@/components/circles/premium/CircleDetailSkeleton';
import LeaveConfirmationSheet from '@/components/experience/LeaveConfirmationSheet';

const tabIds = [
  'about',
  'chat',
  'experiences',
  'members',
  'memories',
];

const tabLabels = {
  about: 'circles.detail.tab_about',
  chat: 'circles.detail.tab_chat',
  experiences: 'circles.detail.tab_experiences',
  members: 'circles.detail.tab_members',
  memories: 'circles.detail.tab_memories',
};

export function safeInviteSenderName(name) {
  if (typeof name === 'string') {
    const trimmed = name.trim();
    return trimmed || 'Someone';
  }

  if (name == null) return 'Someone';
  return String(name);
}

export function resolveInviteSender(invitation, circle) {
  return {
    name: safeInviteSenderName(
      invitation?.sender_name
      || invitation?.senderName
      || invitation?.sender?.display_name
      || circle?.host_name
      || circle?.host?.name
    ),
    avatar: invitation?.sender_avatar
      || invitation?.senderAvatar
      || invitation?.sender?.photo_url
      || circle?.host_avatar
      || circle?.host?.avatar
      || '',
  };
}

function ChatLocked({
  onJoin,
  onRequest,
  privacy,
  registrationsOpen,
  joining,
  canJoin = true, role, administrator, loading, error, visibility,
}) {
  const { t } = useLocalization();

  return (
    <div className="flex flex-col items-center justify-center min-h-[min(55dvh,28rem)] text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>

      <p className="text-base font-semibold mb-1">
        {t('circles.detail.chat_locked_title')}
      </p>

      <p className="text-sm text-muted-foreground mb-5 max-w-xs">
        {t('circles.detail.chat_locked_desc')}
      </p>

      {(() => { const action=circleAction({role,privacy,visibility,administrator,loading,error,registrationsOpen});return <div><Button size="sm" disabled={!canJoin||!action.enabled||joining} onClick={action.state==='join'?onJoin:onRequest}>{action.label}</Button></div>; })()}

    </div>
  );
}

function ChatUnavailable({ status }) {
  const { t } = useLocalization();

  return (
    <div className="flex flex-col items-center justify-center min-h-[min(55dvh,28rem)] text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {status === 'archived' ? (
          <Archive className="w-8 h-8 text-muted-foreground" />
        ) : (
          <Pause className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      <p className="text-base font-semibold mb-1">
        {t('circles.detail.chat_unavailable')}
      </p>

      <p className="text-sm text-muted-foreground">
        {t('circles.detail.chat_paused', { status })}
      </p>
    </div>
  );
}

export default function CircleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const originState = useOriginState();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'chat' ? 'chat' : 'about');
  useEffect(()=>{setActiveTab(searchParams.get('tab') === 'chat' ? 'chat' : 'about');},[id,searchParams]);
  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(true);

  const [manageOpen, setManageOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const [incomingInvite, setIncomingInvite] = useState(null);
  const [, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [introductionLimit, setIntroductionLimit] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let sequence = 0;
    setCircle(null);
    setLoading(true);
    const refresh = async () => {
      const request = ++sequence;
      const c = await getMergedCircleById(id);
      if (active && request === sequence) { setCircle(c); setLoading(false); }
    };
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    void refresh();
    window.addEventListener('nmood:feed-changed', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      active = false;
      window.removeEventListener('nmood:feed-changed', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [id, user?.id]);

  useEffect(() => {
    let active = true;

    if (!user?.id || !id) {
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const list = await getMyInvitations('pending');
        if (active) {
          setIncomingInvite((list || []).find((inv) => inv.invitation_type === 'circle' && String(inv.target_id) === String(id)) || null);
        }
      } catch {
        if (active) {
          setIncomingInvite(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [id, user?.id]);

  const membership = useCircleMembership(circle);
  const policy = useExplorerPolicy();
  const serverAdministrator = policy.data?.administratorAccess === true;

  const {
    check,
    showUpgrade,
    recordUsage,
  } = useMembershipAccess();

  const { t } = useLocalization();

  const role = membership.role;
  const status = circle?.status || 'active';

  const registrationsOpen =
    circle?.registrations_open !== false;
  const canRequestJoin = !membership.loading && !membership.error && !serverAdministrator && membership.role === 'visitor';
  const canUseCircleChat = check(FEATURES.CIRCLE_CHAT).allowed;

  if (loading) {
    return <CircleDetailSkeleton />;
  }

  if (!circle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <p className="text-muted-foreground mb-4">
          {t('circles.detail.not_found')}
        </p>

        <Link to="/explore">
          <Button>
            {t('common.back_to_explore')}
          </Button>
        </Link>
      </div>
    );
  }

  if (
    status !== 'active' &&
    role !== 'organizer'
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          {status === 'archived' ? (
            <Archive className="w-8 h-8 text-muted-foreground" />
          ) : (
            <Pause className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <p className="text-base font-semibold mb-1">
          {t('circles.detail.unavailable')}
        </p>

        <p className="text-sm text-muted-foreground mb-5">
          {status === 'archived'
            ? t('circles.detail.archived_desc')
            : t('circles.detail.paused_desc')}
        </p>

        <Link to="/explore">
          <Button variant="outline" size="sm">
            {t('common.back_to_explore')}
          </Button>
        </Link>
      </div>
    );
  }

  const refreshCircle = async () => {
    const c = await getMergedCircleById(id);
    setCircle(c);
  };

  const performJoin = async () => {
    if (!registrationsOpen || joining || !canRequestJoin) return;

    setJoining(true);
    try {
      const result = await membership.requestJoin();
      await recordUsage('join_circle');
      await refreshCircle();
      toast(result?.membership?.status === 'pending' ? 'Your request was sent.' : 'You joined the circle.');
    } catch (error) {
      if (isIntroductionLimit(error)) setIntroductionLimit(true);
      toast(error?.message || 'Could not join this circle. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleJoin = performJoin;
  const handleRequest = performJoin;

  const handleLeave = () => setLeaveOpen(true);

  const confirmLeave = async () => {
    try {
      const result = await membership.leave();
      setLeaveOpen(false);
      setCircle((current) => current ? { ...current, member_count: result.member_count } : current);
      await refreshCircle();
      toast(result.status === 'already_left' ? 'You had already left this circle.' : 'You left the circle.');
    } catch (error) {
      toast(error?.message || 'Could not leave this circle. Please try again.');
    }
  };

  const setRegistrations = async (open) => {
    try {
      await base44.entities.Circle.update(
        circle.id,
        {
          registrations_open: open,
        }
      );

      await refreshCircle();
    } catch {
      /* ignore */
    }
  };

  const handleCloseRegistrations = () =>
    setRegistrations(false);

  const handleOpenRegistrations = () =>
    setRegistrations(true);

  const handleTransfer = async (
    targetMembership
  ) => {
    await membership.transferOwnership(
      targetMembership
    );

    await refreshCircle();
  };

  const respondInvite = async (
    inviteStatus
  ) => {
    if (!incomingInvite) return;

    try {
      const updated = await respondCircleInvitation(incomingInvite.id, inviteStatus);
      if (!updated?.id) throw new Error('Could not respond to invitation.');

      if (inviteStatus === 'accepted') {
        await membership.refresh();
        await recordUsage('join_circle');
      }
    } catch {
      toast(
        'Could not respond to invitation.'
      );
    } finally {
      setIncomingInvite(null);
    }
  };

  const setLifecycle = async (
    nextStatus
  ) => {
    try {
      await base44.entities.Circle.update(
        circle.id,
        {
          status: nextStatus,
        }
      );

      await refreshCircle();
      await membership.refresh();
    } catch {
      /* ignore */
    }
  };

  const handlePause = () =>
    setLifecycle('paused');

  const handleResume = () =>
    setLifecycle('active');

  const handleArchive = () =>
    setLifecycle('archived');

  const handleRestore = () =>
    setLifecycle('active');

  const handleDelete = async () => {
    try {
      const result = await deleteOwnedCircle(circle.id);
      setDeleteOpen(false);
      emitActivityChange();
      toast(result.status === 'already_deleted' ? 'This Circle was already cancelled.' : 'Circle cancelled.');
      navigate('/explore');
    } catch (error) {
      toast({ title: "Couldn't delete Circle", description: error?.message || 'Please try again.', variant: 'destructive' });
      throw error;
    }
  };

  const handleShare = async () => {
    if (circle.privacy && !['public', 'open'].includes(circle.privacy)) {
      toast('Only public Circles can be shared outside Nmood.');
      return;
    }
    await sharePublicContent({ title: circle.name, text: circle.description, url: window.location.href, onCopied: () => toast('Circle link copied.') });
  };

  const handleSave = () => {
    setSaved((current) => !current);
  };

  const handleMore = () => {
    if (role === 'organizer') {
      setManageOpen(true);
    } else {
      setReportOpen(true);
    }
  };

  const openChat = () =>
    setActiveTab('chat');

  const openManage = () =>
    setManageOpen(true);

  const goInvite = () =>
    setInviteOpen(true);

  const experienceCount = circle.experiences_unavailable ? null :
    (circle.upcoming_experiences || []).length +
    (circle.past_experiences || []).length;

  const organizers = (
    membership.members || []
  ).filter(
    (member) =>
      member.role === 'organizer'
  );
  const inviteSender = resolveInviteSender(incomingInvite, circle);

  return (
    <div className="w-full max-w-full min-h-full overflow-x-clip bg-background">

      <PremiumMoment moment="limit" intent={introductionLimit}/>
      <CircleHero
        circle={circle}
        onShare={handleShare}
        onMore={handleMore}
      />

      {membership.circleRole && <p role="status" className="mx-auto mt-4 max-w-2xl px-4 text-sm font-medium">{membership.circleRole}</p>}

      {/* Content starts below the cover, never underneath it: the hero keeps
          its own rounded bottom edge and its overlaid identity block stays
          fully visible. The bottom padding clears the sticky Join action, the
          63px bottom nav and the iOS home-indicator inset. */}
      <div
        className="
          max-w-2xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          mt-6
          relative
          z-10
          space-y-8
          pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))]
        "
      >

        {incomingInvite &&
          role === 'visitor' && (
            <SectionReveal>
              <div className="rounded-card border border-primary/30 bg-primary/5 p-4 space-y-3 shadow-soft">

                <div className="flex items-start gap-3">

                  <Avatar className="w-11 h-11 flex-shrink-0">
                    <AvatarImage src={inviteSender.avatar} alt={inviteSender.name} />
                    <AvatarFallback className="bg-primary/10 text-primary"><UserPlus className="w-5 h-5" /></AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-semibold">
                      {t(
                        'circles.detail.invited_you',
                        {
                          name:
                            inviteSender.name,
                        }
                      )}
                    </p>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      {incomingInvite.personal_message ||
                        t(
                          'circles.detail.invite_default',
                          {
                            name:
                              circle.name,
                          }
                        )}
                    </p>

                  </div>
                </div>

                <div className="flex gap-2">

                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() =>
                      respondInvite(
                        'accepted'
                      )
                    }
                  >
                    <Check className="w-4 h-4" />
                    {t(
                      'circles.detail.accept'
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() =>
                      respondInvite(
                        'later'
                      )
                    }
                  >
                    <Clock className="w-4 h-4" />
                    {t(
                      'circles.detail.later'
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive"
                    onClick={() =>
                      respondInvite(
                        'declined'
                      )
                    }
                  >
                    <X className="w-4 h-4" />
                    {t(
                      'circles.detail.decline'
                    )}
                  </Button>

                </div>
              </div>
            </SectionReveal>
          )}

        <SectionReveal>
          <CircleStatsRow
            circle={circle}
            experienceCount={
              experienceCount
            }
          />
        </SectionReveal>

        <div className="flex gap-2 overflow-x-auto no-scrollbar overscroll-x-contain">

          {tabIds.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() =>
                setActiveTab(tab)
              }
              data-active={
                activeTab === tab
              }
              className="nmood-chip flex-shrink-0 snap-start"
            >
              {t(tabLabels[tab])}
            </button>
          ))}

        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="space-y-8"
          >

            {activeTab === 'about' && (
              <>

                <SectionReveal>
                  <CircleAboutSection
                    circle={circle}
                  />
                </SectionReveal>

                <SectionReveal delay={0.05}>
                  <CircleAdmins
                    circle={circle}
                    admins={organizers}
                  />
                </SectionReveal>

                <SectionReveal delay={0.05}>
                  <CircleMembersPreview
                    circle={circle}
                    members={
                      membership.members
                    }
                    onViewAll={() =>
                      setActiveTab(
                        'members'
                      )
                    }
                  />
                </SectionReveal>

                <SectionReveal delay={0.05}>
                  <CircleUpcomingExperiences
                    circle={circle}
                    onCreate={() =>
                      navigate(
                        '/host/create',
                        { state: {...originState(),hostType:'experience',circleId:circle.id} }
                      )
                    }
                  />
                </SectionReveal>

                <SectionReveal delay={0.05}>
                  <CircleActivityTimeline
                    circle={circle}
                    members={
                      membership.members
                    }
                  />
                </SectionReveal>

                <SectionReveal delay={0.05}>
                  <CircleGallery
                    circle={circle}
                  />
                </SectionReveal>

                <SectionReveal delay={0.05}>
                  <CircleLocation
                    circle={circle}
                  />
                </SectionReveal>

              </>
            )}

            {activeTab === 'chat' &&
              (
                status !== 'active' ? (
                  <ChatUnavailable
                    status={status}
                  />
                ) : !canUseCircleChat ? (
                  <div className="rounded-card border border-primary/20 bg-primary/5 p-5 text-center">
                    <p className="font-semibold">Circle chat is a Premium feature</p>
                    <p className="mt-1 text-sm text-muted-foreground">Circle messaging is included with Premium.</p>
                    <Button className="mt-4" onClick={() => showUpgrade(FEATURES.CIRCLE_CHAT)}>{isPremium ? 'Manage Membership' : 'Upgrade'}</Button>
                  </div>
                ) : role ===
                    'organizer' ||
                  role === 'member' ? (
                  <div className="h-[clamp(22rem,55dvh,42rem)] min-w-0 max-w-full overflow-hidden">

                    <CircleChat
                      circle={circle}
                      role={role}
                      onManage={openManage}
                    />

                  </div>
                ) : (
                  <ChatLocked
                    onJoin={handleJoin}
                    onRequest={
                      handleRequest
                    }
                    privacy={
                      circle.privacy
                    }
                    registrationsOpen={
                      registrationsOpen
                    }
                    joining={joining}
                    canJoin={canRequestJoin} role={role} administrator={serverAdministrator} loading={membership.loading} error={membership.error} visibility={circle.visibility}
                  />
                )
              )}

            {activeTab ===
              'experiences' && (
                <CircleExperiences
                  circle={circle}
                />
              )}

            {activeTab ===
              'members' && (
                <CircleMembers
                  circle={circle}
                  role={role}
                  members={
                    membership.members
                  }
                  onManage={() =>
                    setMembersOpen(true)
                  }
                />
              )}

            {activeTab ===
              'memories' && (
                <CircleMemories
                  circle={circle}
                />
              )}

          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-6 pt-2 pb-2">

          <button
            onClick={() =>
              navigate(
                '/safety-center'
              )
            }
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-default"
            type="button"
          >
            <Shield className="w-3.5 h-3.5" />
            {t(
              'common.safety_center'
            )}
          </button>

          <button
            onClick={() =>
              setReportOpen(true)
            }
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-default"
            type="button"
          >
            <Flag className="w-3.5 h-3.5" />
            {t('common.report')}
          </button>

        </div>

      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="
              fixed
              left-0
              right-0
              bottom-[calc(63px+env(safe-area-inset-bottom,0px))]
              z-40
              px-4
              pb-2
              pointer-events-none
            "
          >
            <div className="max-w-2xl mx-auto w-full pointer-events-auto">
              <CircleStickyCta
                role={role}
                privacy={circle.privacy}
                hasPendingInvite={Boolean(incomingInvite) && role === 'visitor'}
                registrationsOpen={
                  registrationsOpen
                }
                joining={joining}
                suppressJoin={!canRequestJoin}
                loading={membership.loading} error={membership.error} administrator={serverAdministrator} visibility={circle.visibility}
                onJoin={handleJoin}
                onRequestJoin={
                  handleRequest
                }
                onChat={openChat}
                onInvite={goInvite}
                onLeave={handleLeave}
                onShare={handleShare}
                onSave={handleSave}
                onReport={() =>
                  setReportOpen(true)
                }
              />
            </div>
          </div>,
          document.body
        )}

      <LeaveConfirmationSheet
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onConfirm={confirmLeave}
        title={t('circles.leave.title')}
        description={t('circles.leave.desc')}
      />

      <ManageCircleSheet
        open={manageOpen}
        onOpenChange={setManageOpen}
        status={status}
        memberCount={
          membership.members.length
        }
        registrationsOpen={
          registrationsOpen
        }
        onEdit={() => {
          setManageOpen(false);
          setEditOpen(true);
        }}
        onMembers={() => {
          setManageOpen(false);
          setMembersOpen(true);
        }}
        onInvite={() => {
          setManageOpen(false);
          goInvite();
        }}
        onChat={() => {
          setManageOpen(false);
          openChat();
        }}
        onTransfer={() => {
          setManageOpen(false);
          setTransferOpen(true);
        }}
        onCloseRegistrations={
          handleCloseRegistrations
        }
        onOpenRegistrations={
          handleOpenRegistrations
        }
        onPause={handlePause}
        onResume={handleResume}
        onArchive={handleArchive}
        onRestore={handleRestore}
        onDelete={() => {
          setManageOpen(false);
          setDeleteOpen(true);
        }}
      />

      <CircleInviteSheet
        circle={circle}
        open={inviteOpen}
        onOpenChange={
          setInviteOpen
        }
      />

      <TransferOwnershipSheet
        open={transferOpen}
        onOpenChange={
          setTransferOpen
        }
        members={
          membership.members
        }
        onConfirm={
          handleTransfer
        }
      />

      <ManageMembersSheet
        ownerId={circle.owner_id || circle.created_by_id}
        onSetAdministrator={undefined}
        open={membersOpen}
        onOpenChange={
          setMembersOpen
        }
        members={
          membership.members
        }
        declined={membership.declined || []}
        pending={
          membership.pending
        }
        banned={[
          ...membership.banned,
          ...membership.removed,
        ]}
        onApprove={
          membership.approve
        }
        onReject={
          membership.rejectRequest
        }
        onRemove={
          membership.removeMember
        }
        onBan={
          membership.banMember
        }
        onUnban={
          membership.unban
        }
        onInvite={
          goInvite
        }
      />

      <EditCircleSheet
        open={editOpen}
        onOpenChange={
          setEditOpen
        }
        circle={circle}
        onSaved={
          refreshCircle
        }
      />

      <DeleteConfirmSheet
        open={deleteOpen}
        onOpenChange={
          setDeleteOpen
        }
        memberCount={
          membership.members.length
        }
        onConfirm={
          handleDelete
        }
      />

      <ReportSheet
        open={reportOpen}
        onOpenChange={
          setReportOpen
        }
        target={{
          type: 'circle',
          id: circle.id,
          name: circle.name,
          image:
            circle.cover_photo,
        }}
      />

    </div>
  );
}
