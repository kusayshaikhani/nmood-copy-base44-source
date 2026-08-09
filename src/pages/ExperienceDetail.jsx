import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Share2, MessageCircle, ChevronRight, CalendarCheck, UserPlus, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getOwnMember } from '@/lib/member-profile';
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
import { FEATURES } from '@/lib/permission-engine';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { emitActivityChange } from '@/lib/activity-store';
import { invalidateExperienceCache } from '@/lib/discover-store';
import { toExperienceView, isExperienceEnded, isExperienceCancelled, isExperienceClosed } from '@/lib/experience-utils';
import ReportSheet from '@/components/safety/ReportSheet';
import SafetyTipsReminderSheet, { isSafetyTipsDismissed } from '@/components/safety/SafetyTipsReminderSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExperienceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { check, showUpgrade, recordUsage } = useMembershipAccess();
  const { t } = useLocalization();
  const haptic = useHaptic();
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState(null);
  const [saved, setSaved] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [spotsFilled, setSpotsFilled] = useState(0);
  const [memberName, setMemberName] = useState('');
  const [memberAvatar, setMemberAvatar] = useState('');

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
  const [showEdit, setShowEdit] = useState(false);
  const [showHostReport, setShowHostReport] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  const { experiences: allExperiences } = useExperiences();
  const liveFallback = allExperiences.find((e) => e.id === id);
  const experience = entity ? toExperienceView(entity) : liveFallback;

  useEffect(() => {
    setLoading(true);
    let active = true;
    (async () => {
      // Try to load a real Experience entity by id; fall back to mock if not found.
      try {
        const rec = await base44.entities.Experience.get(id);
        if (active && rec && rec.id) setEntity(rec);
      } catch { /* not a real experience */ }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!experience) return;
    setSpotsFilled(experience.spotsFilled);
    try { setSaved(JSON.parse(localStorage.getItem('inmood_wishlist') || '[]').includes(String(id))); } catch { setSaved(false); }
    base44.entities.Attendance.filter({ experience_id: id })
      .then((records) => {
        const mine = (records || []).find((r) => r.member_user_id === user?.id);
        if (mine) setAttendance(mine);
      })
      .catch(() => {});
    base44.entities.ExperienceRating.filter({ experience_id: id })
      .then((records) => { if (records && records.length > 0) setUserRating(records[0]); })
      .catch(() => {});
    // Member display info for attendance + chat system messages
    if (user) {
      getOwnMember(user.id, user.email)
        .then((myMember) => {
          if (myMember) {
            setMemberName(myMember.display_name || myMember.first_name || user.full_name || 'You');
            setMemberAvatar(myMember.photo_url || '');
          } else {
            setMemberName(user.full_name || 'You');
          }
        })
        .catch(() => setMemberName(user.full_name || 'You'));
    }
  }, [id, experience, user]);

  if (loading) return <ExperienceDetailSkeleton />;

  if (!experience) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">{t('experiences.detail.not_found')}</p>
        <Link to="/explore"><Button>{t('experiences.detail.back_to_discover')}</Button></Link>
      </div>
    );
  }

  const isHost = entity ? (entity.host_user_id === user?.id) : false;
  const isFull = spotsFilled >= experience.spotsTotal;
  const ended = isExperienceEnded(experience);
  const cancelled = isExperienceCancelled(experience);
  const closed = isExperienceClosed(experience);
  const joinDisabled = ended || cancelled || closed;

  const joinState = attendance?.status === 'going' ? 'going'
    : attendance?.status === 'waiting' ? 'waiting'
    : cancelled ? 'completed'
    : ended ? (userRating ? 'rated' : 'completed')
    : isFull ? 'full'
    : 'join';

  const handleJoinConfirm = async () => {
    setShowJoinConfirm(false);
    try {
      // SEC-001A — server-side quota enforcement before attendance is created.
      const res = await base44.functions.invoke('authorizationGate', {
        action: 'joinExperience',
        experienceId: id,
      });
      const record = res?.data?.attendance;
      if (!record) throw new Error(res?.data?.message || 'Could not join.');
      setAttendance(record);
      recordUsage('join_experience');
      // Use the authoritative backend response for capacity — no client-side
      // Experience.update or double increment. The backend increments
      // spots_filled exactly once for 'going' attendances and posts the
      // system message with server-derived identity.
      if (res?.data?.experience) { setEntity(res.data.experience); setSpotsFilled(res.data.experience.spots_filled || 0); }
      invalidateExperienceCache();
      emitActivityChange();
      haptic('success');
      trackProductEvent(PRODUCT_EVENTS.EXPERIENCE_JOINED, { experienceId: id });
      setShowSuccess(true);
    } catch (err) {
      haptic('error');
      toast({ title: "Couldn't join", description: err?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleJoinWaitingList = async () => {
    setShowWaitingList(false);
    try {
      const res = await base44.functions.invoke('authorizationGate', {
        action: 'joinExperience',
        experienceId: id,
      });
      const record = res?.data?.attendance;
      if (!record) throw new Error(res?.data?.message || 'Could not join the waiting list.');
      setAttendance(record);
    } catch (err) {
      haptic('error');
      toast({ title: "Couldn't join waiting list", description: err?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleLeaveConfirm = async () => {
    try {
      const resp = await base44.functions.invoke('authorizationGate', { action: 'leaveExperience', experienceId: id });
      const res = resp?.data || resp;
      if (!res?.ok) { toast(res?.message || 'Could not leave experience.'); return; }
      setShowLeaveConfirm(false);
      // Use the authoritative backend response for capacity — no client-side
      // Experience.update or double decrement. The backend decrements
      // spots_filled exactly once for 'going' attendances and posts the
      // system message with server-derived identity.
      if (res?.experience) { setEntity(res.experience); setSpotsFilled(res.experience.spots_filled || 0); }
      setAttendance(null);
      invalidateExperienceCache();
      emitActivityChange();
      haptic('warning');
      trackProductEvent(PRODUCT_EVENTS.EXPERIENCE_LEFT, { experienceId: id });
      toast(SUCCESS_COPY.left);
    } catch { toast('Could not leave experience.'); }
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
      const record = await base44.entities.ExperienceRating.create({ experience_id: id, rating, review });
      setUserRating(record);
    } catch {
      setUserRating({ experience_id: id, rating, review });
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
      <ExperienceHero
        experience={experience}
        saved={saved}
        onBack={() => navigate(-1)}
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
          <AttendeesList experience={{ ...experience, spotsFilled }} isHost={isHost} onChange={(updatedExp) => { if (updatedExp) { setEntity(updatedExp); setSpotsFilled(updatedExp.spots_filled || 0); } emitActivityChange(); }} />
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
        <div className="fixed inset-x-0 bottom-[63px] z-[100] px-4 pt-3 pb-0 bg-background border-t border-border/60">
          <div className="max-w-2xl mx-auto flex gap-2.5 items-center">
            <JoinStateButton
              joinState={joinState}
              onJoin={() => {
                if (joinDisabled) return;
                const perm = check(FEATURES.JOIN_EXPERIENCE);
                if (!perm.allowed) {
                  trackMembershipEvent(MEMBERSHIP_EVENTS.LIMIT_REACHED, { feature: 'join_experience', used: perm.used, limit: perm.limit });
                  showUpgrade('join_experience');
                  return;
                }
                if (!isSafetyTipsDismissed()) { setShowSafetyTips(true); return; }
                setShowJoinConfirm(true);
              }}
              onLeave={() => setShowLeaveConfirm(true)}
              onJoinWaitingList={() => setShowWaitingList(true)}
              onRate={() => setShowRate(true)}
            />
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              aria-label={t('experiences.detail.invite_pals')}
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

      <InvitePalsSheet experience={experience} open={showInvite} onOpenChange={setShowInvite} />

      <EditExperienceSheet open={showEdit} onOpenChange={setShowEdit} entity={entity} onSaved={(updated) => setEntity(updated)} />

      <JoinConfirmationSheet
        experience={experience}
        spotsFilled={spotsFilled}
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