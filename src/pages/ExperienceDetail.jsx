import {experienceAction} from '@/lib/participation-actions';
import PremiumMoment from '@/components/membership/PremiumMoment';
import { isIntroductionLimit } from '@/lib/premium-prompt-policy';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Heart, Share2, MessageCircle, ChevronRight, CalendarCheck, UserPlus, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { submitExperienceReview } from '@/api/supabaseClient';
import { getExperienceById } from '@/api/contentRecords';
import { useAuth } from '@/lib/AuthContext';
import { useExperiences } from '@/lib/discover-store';
import { useHaptic } from '@/lib/haptics';
import { SUCCESS_COPY } from '@/lib/copy';
import { toast } from '@/components/ui/use-toast';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import ExperienceHero from '@/components/experience/ExperienceHero';
import ExperienceSummary from '@/components/experience/ExperienceSummary';
import HostCard from '@/components/experience/HostCard';
import ExperienceAbout from '@/components/experience/ExperienceAbout';
import BudgetSection from '@/components/experience/BudgetSection';
import ExperienceLocation from '@/components/experience/ExperienceLocation';
import AttendeesList from '@/components/experience/AttendeesList';
import PhotoGallery from '@/components/experience/PhotoGallery';
import SectionReveal from '@/components/experience/SectionReveal';
import SimilarExperiences from '@/components/experience/SimilarExperiences';
import SafetyTrustSection from '@/components/experience/SafetyTrustSection';
import ExperienceDetailSkeleton from '@/components/experience/ExperienceDetailSkeleton';
import JoinConfirmationSheet from '@/components/experience/JoinConfirmationSheet';
import JoinSuccessOverlay from '@/components/experience/JoinSuccessOverlay';
import ShareSheet from '@/components/experience/ShareSheet';
import WaitingListSheet from '@/components/experience/WaitingListSheet';
import LeaveConfirmationSheet from '@/components/experience/LeaveConfirmationSheet';
import AddToCalendarSheet from '@/components/experience/AddToCalendarSheet';
import RateExperienceSheet from '@/components/experience/RateExperienceSheet';
import BecomePalsSheet from '@/components/experience/BecomePalsSheet';
import JoinStateButton from '@/components/experience/JoinStateButton';
import RemindersSection from '@/components/experience/RemindersSection';
import HostControlsBar from '@/components/experience/HostControlsBar';
import EditExperienceSheet from '@/components/experience/EditExperienceSheet';
import InvitePalsSheet from '@/components/invite/InvitePalsSheet';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { emitActivityChange } from '@/lib/activity-store';
import { invalidateExperienceCache } from '@/lib/discover-store';
import { getExperienceAttendanceState, joinExperience } from '@/lib/experience-membership';
import { toExperienceView, isExperienceEnded, isExperienceCancelled, isExperienceClosed } from '@/lib/experience-utils';
import ReportSheet from '@/components/safety/ReportSheet';
import SafetyTipsReminderSheet, { isSafetyTipsDismissed } from '@/components/safety/SafetyTipsReminderSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isRecordOwner } from '@/lib/content-ownership';
import { leaveExperience } from '@/lib/group-membership-actions';
import { deleteOwnedExperience } from '@/lib/group-content-deletion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ExperienceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { recordUsage, isPremium, showUpgrade } = useMembershipAccess();
  const { t } = useLocalization();
  const haptic = useHaptic();
  const [loading, setLoading] = useState(true);
  const [introductionLimit, setIntroductionLimit] = useState(false);
  const [entity, setEntity] = useState(null);
  const [saved, setSaved] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [attendanceError,setAttendanceError]=useState(false);
  const [joining,setJoining]=useState(false);
  const joinFlight=useRef(false);
  const [serverCanManage, setServerCanManage] = useState(false);
  const [attendanceResolved, setAttendanceResolved] = useState(false);
  const [_userRating, setUserRating] = useState(null);
  const [spotsFilled, setSpotsFilled] = useState(0);

  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [showWaitingList, setShowWaitingList] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [showPals, setShowPals] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showInviteUpgrade, setShowInviteUpgrade] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showHostReport, setShowHostReport] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  const { experiences: allExperiences } = useExperiences();
  const liveFallback = allExperiences.find((e) => e.id === id);
  const experience = useMemo(() => entity ? toExperienceView(entity) : liveFallback, [entity, liveFallback]);
  const inviteRecipient = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const recipientId = params.get('invite');
    return recipientId ? { id: recipientId, name: params.get('inviteName') || 'your match' } : null;
  }, [location.search]);

  const openInvite = () => {
    if (!isPremium) { setShowInviteUpgrade(true); return; }
    setShowInvite(true);
  };

  useEffect(() => {
    setLoading(true);
    let active = true;
    (async () => {
      // Load the persisted Experience by id so a just-created one opens even
      // before any list query has run; the cached list is the fallback.
      try {
        const rec = await getExperienceById(id);
        if (active && rec && rec.id) setEntity(rec);
      } catch { /* not a readable experience */ }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!experience) return;
    setSpotsFilled(experience.spotsFilled);
    try { setSaved(JSON.parse(localStorage.getItem('inmood_wishlist') || '[]').includes(String(id))); } catch { setSaved(false); }
    let active = true;
    setAttendance(null);
    setServerCanManage(false);
    setAttendanceResolved(false);setAttendanceError(false);
    getExperienceAttendanceState(id)
      .then((state) => { if (active) { setAttendance(state?.attendance || null); setServerCanManage(state?.isManager === true); setAttendanceResolved(true); } })
      .catch(() => { if (active) { setServerCanManage(false); setAttendanceResolved(true);setAttendanceError(true); } });
    return () => { active = false; };
  }, [id, experience?.id, user?.id]);

  if (loading) return <ExperienceDetailSkeleton />;

  if (!experience) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">{t('experiences.detail.not_found')}</p>
        <Link to="/explore"><Button>{t('experiences.detail.back_to_discover')}</Button></Link>
      </div>
    );
  }

  const isHost = isRecordOwner(entity, user?.id);
  // The server attendance-state RPC is authoritative for owner/admin management.
  const cannotJoin = isHost || serverCanManage;
  const canManageAttendees = isHost || serverCanManage;
  const isFull = spotsFilled >= experience.spotsTotal;
  const ended = isExperienceEnded(experience);
  const cancelled = isExperienceCancelled(experience);
  const closed = isExperienceClosed(experience);
  const joinDisabled = ended || cancelled || closed;

  const joinState = experienceAction({attendance:attendance?.status,loading:!attendanceResolved,error:attendanceError,manager:cannotJoin,visibility:entity?.visibility || entity?.privacy || experience.visibility,approval:entity?.requires_approval === true || entity?.approval_required === true,full:isFull,closed,cancelled,ended});

  const handleJoinConfirm = async () => {
    if(joinFlight.current || !['join','request'].includes(joinState))return;
    joinFlight.current=true;setJoining(true);
    setShowJoinConfirm(false);
    try {
      // SEC-001A — server-side quota enforcement before attendance is created.
      const res = await joinExperience(id);
      const record = res?.attendance;
      if (!record) throw new Error(res?.data?.message || 'Could not join.');
      setAttendance(record);
      recordUsage('join_experience');
      // Use the authoritative backend response for capacity — no client-side
      // Experience.update or double increment. The backend increments
      // spots_filled exactly once for 'going' attendances and posts the
      // system message with server-derived identity.
      if (Number.isFinite(res?.spots_filled)) { setSpotsFilled(res.spots_filled); setEntity((current) => current ? { ...current, spots_filled: res.spots_filled } : current); }
      invalidateExperienceCache();
      emitActivityChange();
      haptic('success');
      toast(record.status==='pending'?{ title: 'Request submitted', description: 'The host will review your attendance request.' }:{title:'You joined the Experience',description:'Your place is confirmed.'});
    } catch (err) {
      haptic('error');
      if (isIntroductionLimit(err)) setIntroductionLimit(true);
      toast({ title: "Couldn't join", description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {joinFlight.current=false;setJoining(false);}
  };

  const handleJoinWaitingList = async () => {
    setShowWaitingList(false);
    try {
      const res = await joinExperience(id);
      const record = res?.attendance;
      if (!record) throw new Error(res?.data?.message || 'Could not join the waiting list.');
      setAttendance(record);
    } catch (err) {
      haptic('error');
      toast({ title: "Couldn't join waiting list", description: err?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleLeaveConfirm = async () => {
    try {
      const result = await leaveExperience(id);
      setShowLeaveConfirm(false);
      setAttendance(null);
      setSpotsFilled(result.spots_filled);
      setEntity((current) => current ? { ...current, spots_filled: result.spots_filled } : current);
      invalidateExperienceCache();
      emitActivityChange();
      haptic('warning');
      trackProductEvent(PRODUCT_EVENTS.EXPERIENCE_LEFT, { experienceId: id });
      toast(result.status === 'already_left' ? 'You had already left this experience.' : SUCCESS_COPY.left);
    } catch (error) {
      haptic('error');
      toast({ title: "Couldn't leave", description: error?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDeleteExperience = async () => {
    try {
      const result = await deleteOwnedExperience(id);
      invalidateExperienceCache();
      emitActivityChange();
      toast({ title: result.status === 'already_deleted' ? 'Experience already cancelled' : 'Experience cancelled' });
      navigate('/my-experiences', { replace: true });
    } catch (error) {
      haptic('error');
      toast({ title: "Couldn't delete Experience", description: error?.message || 'Please try again.', variant: 'destructive' });
      throw error;
    }
  };

  const handleToggleReminders = async (enabled) => {
    try {
      const resp = await base44.functions.invoke('authorizationGate', { action: 'updateAttendanceReminders', experienceId: id, remindersEnabled: enabled });
      const res = resp?.data || resp;
      if (!res?.ok) { toast(res?.message || 'Could not update reminders.'); return; }
      setAttendance((prev) => ({ ...prev, reminders_enabled: enabled }));
    } catch { toast('Could not update reminders.'); }
  };

  const handleRateSubmit = async (rating, review) => {
    try {
      const record = await submitExperienceReview(id, rating, review);
      setUserRating(record?.data || record);
    } catch (error) {
      toast(error?.message || 'Your review could not be saved. Please try again.');
      return;
    }
    setShowRate(false);
    haptic('success');
    toast(SUCCESS_COPY.rated);
    setShowPals(true);
  };

  const handleBecomePals = () => { setShowPals(false); navigate('/pals'); };

  const toggleSave = () => {
    setSaved((prev) => {
      try {
        const list = JSON.parse(localStorage.getItem('inmood_wishlist') || '[]');
        const idStr = String(id);
        if (list.includes(idStr)) {
          localStorage.setItem('inmood_wishlist', JSON.stringify(list.filter((t) => t !== idStr)));
          haptic('light');
          toast(SUCCESS_COPY.unsaved);
          return false;
        }
        localStorage.setItem('inmood_wishlist', JSON.stringify([...list, idStr]));
        haptic('success');
        toast(SUCCESS_COPY.saved);
        return true;
      } catch { return prev; }
    });
  };

  return (
    <div className="pb-40">
      {/* Hero — full-bleed edge-to-edge */}
      <PremiumMoment moment="limit" intent={introductionLimit}/>
      <ExperienceHero
        experience={experience}
        saved={saved}
        onSave={toggleSave}
        onShare={() => setShowShare(true)}
      />

      {/* Content — padded premium container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 space-y-8">
        {/* Status banners */}
        {(cancelled || (closed && !cancelled)) && (
          <SectionReveal>
            <div
              className={`p-4 rounded-card text-sm font-semibold text-center ${
                cancelled
                  ? 'border border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border border-warning/30 bg-warning/10 text-warning'
              }`}
            >
              {cancelled ? t('experiences.detail.cancelled') : t('experiences.detail.registrations_closed')}
            </div>
          </SectionReveal>
        )}

        {/* Experience information */}
        <SectionReveal>
          <ExperienceSummary experience={{ ...experience, spotsFilled }} />
        </SectionReveal>

        {inviteRecipient && (
          <SectionReveal>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold">Invite {inviteRecipient.name} to this Experience</p>
              <p className="mt-1 text-sm text-muted-foreground">Premium lets you send a personal invitation to your match.</p>
              <Button className="mt-3" onClick={openInvite}>Invite {inviteRecipient.name}</Button>
            </div>
          </SectionReveal>
        )}

        {/* Host card */}
        <SectionReveal delay={0.05}>
          <HostCard experience={experience} />
        </SectionReveal>

        {isHost && (
          <SectionReveal delay={0.05}>
            <HostControlsBar
              entity={entity}
              onEdit={() => setShowEdit(true)}
              onChanged={(updated) => { if (updated) setEntity(updated); }}
              onDelete={handleDeleteExperience}
            />
          </SectionReveal>
        )}

        {/* Description */}
        <SectionReveal>
          <ExperienceAbout experience={experience} />
        </SectionReveal>

        {/* Gallery */}
        {experience?.gallery?.length > 1 && (
          <SectionReveal>
            <PhotoGallery experience={experience} />
          </SectionReveal>
        )}

        {/* Budget */}
        <SectionReveal>
          <BudgetSection experience={experience} />
        </SectionReveal>

        {/* Location */}
        <SectionReveal>
          <ExperienceLocation experience={experience} />
        </SectionReveal>

        {/* Attendees */}
        <SectionReveal>
          <AttendeesList experience={{ ...experience, spotsFilled }} isHost={canManageAttendees} onChange={(updatedExp) => { if (updatedExp) { setEntity(updatedExp); setSpotsFilled(updatedExp.spots_filled || 0); } emitActivityChange(); }} />
        </SectionReveal>

        {attendance?.status === 'going' && (
          <SectionReveal>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/experience/${id}/day`)}
                type="button"
                className="pressable w-full flex items-center gap-4 p-5 rounded-card border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-default text-start shadow-soft"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t('experiences.detail.experience_day')}</p>
                  <p className="text-caption text-muted-foreground">{t('experiences.detail.experience_day_desc')}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
              </button>
              <button
                onClick={() => navigate(`/experience/${id}/chat`)}
                type="button"
                className="pressable w-full flex items-center gap-4 p-5 rounded-card border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-default text-start shadow-soft"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t('experiences.detail.group_chat')}</p>
                  <p className="text-caption text-muted-foreground">{t('experiences.detail.group_chat_desc')}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
              </button>
            </div>
          </SectionReveal>
        )}

        {attendance?.status === 'going' && (
          <SectionReveal>
            <RemindersSection
              enabled={attendance?.reminders_enabled !== false}
              onToggle={handleToggleReminders}
            />
          </SectionReveal>
        )}

        <SectionReveal>
          <SimilarExperiences experience={experience} allExperiences={allExperiences} />
        </SectionReveal>

        <SectionReveal>
          <SafetyTrustSection experience={experience} onReport={() => setShowReport(true)} />
        </SectionReveal>

        <div className="flex justify-center pb-2">
          <button onClick={() => setShowHostReport(true)} className="flex items-center gap-1.5 text-caption text-muted-foreground hover:text-destructive transition-default" type="button">
            <Flag className="w-3.5 h-3.5" /> {t('experiences.detail.report_organizer')}
          </button>
        </div>
      </div>

      {/* Sticky Bottom Action — portaled to document.body so Framer Motion's
          transform on PageTransition cannot create a containing block for it. */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-x-0 bottom-[calc(63px+env(safe-area-inset-bottom,0px))] z-40 px-4 pt-3 pb-0 bg-background border-t border-border/60">
          <div className="max-w-2xl mx-auto flex gap-2.5 items-center">
            {!cannotJoin && (
              <JoinStateButton
                joinState={joinState} pending={joining}
                onJoin={() => {
                  if (joinDisabled || !['join','request'].includes(joinState)) return;
                  if (!isSafetyTipsDismissed()) { setShowSafetyTips(true); return; }
                  setShowJoinConfirm(true);
                }}
                onLeave={() => setShowLeaveConfirm(true)}
                onJoinWaitingList={() => setShowWaitingList(true)}
                onRate={() => setShowRate(true)}
              />
            )}
            <button
              type="button"
              onClick={openInvite}
              aria-label={inviteRecipient ? `Invite ${inviteRecipient.name}` : t('experiences.detail.invite_pals')}
              className="pressable h-14 w-14 flex-shrink-0 rounded-button border border-border bg-card text-foreground shadow-soft hover:bg-secondary flex items-center justify-center"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={toggleSave}
              aria-label={t('experiences.detail.save_experience')}
              className="pressable h-14 w-14 flex-shrink-0 rounded-button border border-border bg-card text-foreground shadow-soft hover:bg-secondary flex items-center justify-center"
            >
              <Heart className={`w-5 h-5 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowShare(true)}
              aria-label={t('experiences.detail.share_experience')}
              className="pressable h-14 w-14 flex-shrink-0 rounded-button border border-border bg-card text-foreground shadow-soft hover:bg-secondary flex items-center justify-center"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>,
        document.body
      )}

      <ReportSheet open={showReport} onOpenChange={setShowReport} target={{ type: 'experience', id, name: experience.title, image: experience.image }} />
      <ReportSheet open={showHostReport} onOpenChange={setShowHostReport} target={{ type: 'host', id: entity?.host_user_id || experience.hostUserId, name: experience.hostName, image: experience.hostAvatar }} />
      <SafetyTipsReminderSheet open={showSafetyTips} onOpenChange={setShowSafetyTips} onContinue={() => setShowJoinConfirm(true)} />

      <InvitePalsSheet experience={experience} initialRecipient={inviteRecipient} open={showInvite} onOpenChange={setShowInvite} />

      <AlertDialog open={showInviteUpgrade} onOpenChange={setShowInviteUpgrade}>
        <AlertDialogContent>
          <AlertDialogTitle>Invite matches with Premium</AlertDialogTitle>
          <AlertDialogDescription>Premium lets you invite a match directly to an Experience. Your match receives the invitation only after you send it.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowInviteUpgrade(false); showUpgrade('invite_match_to_experience'); }}>Upgrade</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditExperienceSheet open={showEdit} onOpenChange={setShowEdit} entity={entity} onSaved={(updated) => setEntity(updated)} />

      <JoinConfirmationSheet
        experience={experience}
        spotsFilled={spotsFilled}
        approval={joinState === 'request'}
        submitting={joining}
        open={showJoinConfirm}
        onOpenChange={setShowJoinConfirm}
        onConfirm={handleJoinConfirm}
      />

      <JoinSuccessOverlay
        open={showSuccess}
        onAddToCalendar={() => { setShowSuccess(false); setShowCalendar(true); }}
        onViewMyExperiences={() => { setShowSuccess(false); navigate('/my-experiences'); }}
        onContinueDiscovering={() => { setShowSuccess(false); navigate('/explore'); }}
      />

      <WaitingListSheet
        experience={experience}
        open={showWaitingList}
        onOpenChange={setShowWaitingList}
        onConfirm={handleJoinWaitingList}
      />

      <LeaveConfirmationSheet
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        onConfirm={handleLeaveConfirm}
      />

      <AddToCalendarSheet
        experience={experience}
        open={showCalendar}
        onOpenChange={setShowCalendar}
      />

      <RateExperienceSheet
        experience={experience}
        open={showRate}
        onOpenChange={setShowRate}
        onSubmit={handleRateSubmit}
      />

      <BecomePalsSheet
        open={showPals}
        onOpenChange={setShowPals}
        onBecomePals={handleBecomePals}
        experience={experience}
      />

      <ShareSheet open={showShare} onOpenChange={setShowShare} experience={experience} />
    </div>
  );
}
