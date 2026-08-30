import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getMergedCircleById } from '@/lib/circle-store';
import { useOriginState } from '@/lib/safe-navigation';
import { useCircleMembership } from '@/components/circles/useCircleMembership';

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
import {
  trackMembershipEvent,
  MEMBERSHIP_EVENTS,
} from '@/lib/membership-analytics';

import ReportSheet from '@/components/safety/ReportSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { toast } from '@/components/ui/use-toast';

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

function ChatLocked({
  onJoin,
  onRequest,
  privacy,
  registrationsOpen,
}) {
  const { t } = useLocalization();

  return (
    <div className="flex flex-col items-center justify-center h-[55vh] text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>

      <p className="text-base font-semibold mb-1">
        {t('circles.detail.chat_locked_title')}
      </p>

      <p className="text-sm text-muted-foreground mb-5 max-w-xs">
        {t('circles.detail.chat_locked_desc')}
      </p>

      {!registrationsOpen ? (
        <Button size="sm" disabled>
          {t('circles.detail.registrations_closed')}
        </Button>
      ) : privacy === 'private' ? (
        <Button size="sm" onClick={onRequest}>
          {t('circles.detail.request_to_join')}
        </Button>
      ) : (
        <Button size="sm" onClick={onJoin}>
          {t('circles.detail.join_circle')}
        </Button>
      )}
    </div>
  );
}

function ChatUnavailable({ status }) {
  const { t } = useLocalization();

  return (
    <div className="flex flex-col items-center justify-center h-[55vh] text-center">
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

  const [activeTab, setActiveTab] = useState('about');
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

  useEffect(() => {
    let active = true;

    setLoading(true);

    (async () => {
      const c = await getMergedCircleById(id);

      if (active) {
        setCircle(c);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    if (!user?.id || !id) {
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const list = await base44.entities.CircleInvitation.filter(
          {
            circle_id: String(id),
            pal_user_id: String(user.id),
            status: 'pending',
          },
          '-created_date',
          5
        );

        if (active) {
          setIncomingInvite((list || [])[0] || null);
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

  const handleJoin = async () => {
    if (!registrationsOpen) return;

    const perm = check(FEATURES.JOIN_CIRCLE);

    if (!perm.allowed) {
      trackMembershipEvent(
        MEMBERSHIP_EVENTS.LIMIT_REACHED,
        {
          feature: 'join_circle',
          used: perm.used,
          limit: perm.limit,
        }
      );

      showUpgrade('join_circle');
      return;
    }

    await membership.join();
    await recordUsage('join_circle');
  };

  const handleRequest = async () => {
    await membership.requestJoin();
  };

  const handleLeave = async () => {
    await membership.leave();
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

    if (inviteStatus === 'later') {
      setIncomingInvite(null);
      return;
    }

    try {
      const resp =
        await base44.functions.invoke(
          'authorizationGate',
          {
            action: 'respondCircleInvitation',
            invitationId: incomingInvite.id,
            response:
              inviteStatus === 'accepted'
                ? 'accepted'
                : 'declined',
          }
        );

      const res = resp?.data || resp;

      if (!res?.ok) {
        toast(
          res?.message ||
            'Could not respond to invitation.'
        );

        return;
      }

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
      const resp =
        await base44.functions.invoke(
          'authorizationGate',
          {
            action: 'deleteCircle',
            circleId: String(circle.id),
          }
        );

      const res = resp?.data || resp;

      if (!res?.ok) {
        toast(
          res?.message ||
            'Could not delete circle.'
        );
        return;
      }

      navigate('/explore');
    } catch {
      toast('Could not delete circle.');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: circle.name,
          text: circle.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard?.writeText(
          window.location.href
        );
      }
    } catch {
      /* ignore */
    }
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

  const experienceCount =
    (circle.upcoming_experiences || []).length +
    (circle.past_experiences || []).length;

  const organizers = (
    membership.members || []
  ).filter(
    (member) =>
      member.role === 'organizer'
  );

  return (
    <div className="w-full min-h-full bg-background">

      <CircleHero
        circle={circle}
        onShare={handleShare}
        onMore={handleMore}
      />

      <div
        className="
          max-w-2xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          -mt-8
          relative
          z-10
          space-y-8
          pb-36
        "
      >

        {incomingInvite &&
          role === 'visitor' && (
            <SectionReveal>
              <div className="rounded-card border border-primary/30 bg-primary/5 p-4 space-y-3 shadow-soft">

                <div className="flex items-start gap-3">

                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-semibold">
                      {t(
                        'circles.detail.invited_you',
                        {
                          name:
                            incomingInvite.sender_name,
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
                        { state: originState() }
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
                ) : role ===
                    'organizer' ||
                  role === 'member' ? (
                  <div className="h-[55vh]">

                    <CircleChat
                      circle={circle}
                      role={role}
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
              bottom-[63px]
              z-[999]
              px-4
              pb-0
              pointer-events-none
            "
          >
            <div className="max-w-2xl mx-auto w-full pointer-events-auto">
              <CircleStickyCta
                role={role}
                privacy={circle.privacy}
                registrationsOpen={
                  registrationsOpen
                }
                onJoin={handleJoin}
                onRequestJoin={
                  handleRequest
                }
                onManage={openManage}
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
        open={membersOpen}
        onOpenChange={
          setMembersOpen
        }
        members={
          membership.members
        }
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