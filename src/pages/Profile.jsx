import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, Info, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';
import { getProfileCompleteness, getTrustScore } from '@/lib/profile-completeness';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { resolveMemberName } from '@/lib/member-display';
import { useToast } from '@/components/ui/use-toast';
import SectionReveal from '@/components/experience/SectionReveal';
import EditProfileSheet from '@/components/profile/EditProfileSheet';
import TrustVerification from '@/components/profile/TrustVerification';
import ProfileHero from '@/components/profile/premium/ProfileHero';
import ProfileIdentity from '@/components/profile/premium/ProfileIdentity';
import ProfileNameSection from '@/components/profile/premium/ProfileNameSection';
import ProfileActions from '@/components/profile/premium/ProfileActions';
import ProfileQuickStats from '@/components/profile/premium/ProfileQuickStats';
import ProfileAbout from '@/components/profile/premium/ProfileAbout';
import ProfileInterests from '@/components/profile/premium/ProfileInterests';
import ProfileGallery from '@/components/profile/premium/ProfileGallery';
import ProfileAchievements from '@/components/profile/premium/ProfileAchievements';
import ProfileReviews from '@/components/profile/premium/ProfileReviews';
import ProfileActivityTimeline from '@/components/profile/premium/ProfileActivityTimeline';
import ProfileNavGrid from '@/components/profile/premium/ProfileNavGrid';
import ProfileMoreSheet from '@/components/profile/premium/ProfileMoreSheet';
import ProfileSkeleton from '@/components/profile/premium/ProfileSkeleton';
import ProfileMembershipSection from '@/components/membership/ProfileMembershipSection';
import { useProfileStats } from '@/hooks/useProfileStats';
import ProfileNmoodsSection from '@/components/profile/nmoods/ProfileNmoodsSection';

/**
 * UI-017 — Complete Profile redesign (Nmood Premium Design System).
 * 280px gradient hero, large avatar with verification/premium/trust/
 * completion badges, name section, quick-stat rail, expandable about,
 * interest chips, horizontal gallery with lightbox, achievement badges,
 * recommendation cards, activity timeline, premium nav grid, and a
 * "More" sheet. ALL backend logic, workflows, and navigation preserved.
 */
export default function Profile() {
  const { user, member, refreshMember, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { toast } = useToast();
  const { isPremium, can } = useMembershipAccess();
  const { stats, loading: statsLoading } = useProfileStats();
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showMore, setShowMore] = useState(false);

  const completeness = useMemo(() => getProfileCompleteness(member, user), [member, user]);
  const trustScore = useMemo(() => getTrustScore(member, user, completeness.pct), [member, user, completeness.pct]);
  const isVerified = !!(member?.phone_verified && member?.photo_url);

  useEffect(() => {
    if (!member) return;
    trackProductEvent(PRODUCT_EVENTS.PROFILE_COMPLETED, { percent: completeness.pct });
    if (completeness.pct >= 100) trackProductEvent(PRODUCT_EVENTS.PROFILE_REACHED_100);
  }, [completeness.pct, member]);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleEdit = (target) => {
    if (target === 'phone') { scrollToId('trust-verification'); return; }
    if (target === 'email') return;
    setEditTarget(target);
    setShowEdit(true);
  };

  const steps = useMemo(() => {
    const s = [];
    if (!member?.phone_verified) s.push({ label: t('profile.steps.phone_verification_soon'), action: () => scrollToId('trust-verification') });
    if ((member?.photo_gallery?.length || 0) < 3) s.push({ label: t('profile.steps.add_photos'), action: () => scrollToId('photo-gallery') });
    const nonPhoneMissing = completeness.missing.filter((m) => m.target !== 'phone' && m.target !== 'email');
    if (nonPhoneMissing.length > 0) {
      const first = nonPhoneMissing[0];
      s.push({ label: t('profile.steps.complete_details'), action: () => handleEdit(first.target) });
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, completeness]);

  const handleShare = async () => {
    const url = window.location.href;
    const name = resolveMemberName(member, user) || 'My Nmood Profile';
    if (navigator.share) {
      try { await navigator.share({ title: name, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); toast({ title: t('profile.premium.share_copied') }); } catch { /* ignore */ }
    }
  };

  const handleLogout = () => logout(true);
  const openEdit = () => { setEditTarget(null); setShowEdit(true); };

  if (!member) return <ProfileSkeleton />;

  return (
    <div className="bg-background min-h-screen pb-28">
      <ProfileHero onBack={() => navigate(-1)} onShare={handleShare} onMore={() => setShowMore(true)} />

      <ProfileIdentity
        member={member}
        user={user}
        isPremium={isPremium}
        trustScore={trustScore}
        completenessPct={completeness.pct}
        isVerified={isVerified}
      />

      <ProfileNameSection member={member} user={user} isPremium={isPremium} />

      <ProfileActions onEdit={openEdit} onShare={handleShare} onSettings={() => navigate('/settings')} />

      {/* Premium/Explorer membership badge + upgrade/manage entry point */}
      <div className="px-6 mt-6">
        <ProfileMembershipSection />
      </div>

      {/* Quick statistics */}
      <div className="mt-8">
        <ProfileQuickStats stats={stats} loading={statsLoading} />
      </div>

      {/* Completion steps (preserved from ProfileStatusCard) */}
      {completeness.pct < 100 && steps.length > 0 && (
        <SectionReveal>
          <div className="px-6 mt-8">
            <div className="rounded-card border border-border/50 bg-card p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t('profile.premium.complete_steps')}</p>
              <ul className="space-y-2.5">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm flex-1">{s.label}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={steps[0].action}
                className="w-full h-11 mt-4 rounded-button bg-nmood-cta text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                {t('profile.premium.complete_action')} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SectionReveal>
      )}

      {completeness.pct >= 100 && (
        <SectionReveal>
          <div className="px-6 mt-8">
            <div className="rounded-card border border-success/30 bg-success/5 p-4 text-center shadow-soft">
              <p className="text-sm text-success font-medium flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" /> {t('profile.premium.complete_done')}
              </p>
            </div>
          </div>
        </SectionReveal>
      )}

      {/* Content sections — generous whitespace */}
      <div className="mt-10 space-y-8">
        <ProfileAbout member={member} />
        <ProfileInterests member={member} />
        <ProfileNmoodsSection />

        <div id="photo-gallery">
          <ProfileGallery member={member} onSaved={refreshMember} />
        </div>

        <ProfileAchievements member={member} user={user} isPremium={isPremium} stats={stats} />

        <ProfileReviews />

        <ProfileActivityTimeline />

        {/* Trust & Verification — preserves phone OTP, photo, location flows */}
        <SectionReveal>
          <div id="trust-verification" className="px-6">
            <TrustVerification member={member} onVerified={refreshMember} />
          </div>
        </SectionReveal>

        {/* Navigation grid — all "My Nmood" entry points preserved */}
        <ProfileNavGrid navigate={navigate} showProfileViews={can(FEATURES.PROFILE_VIEWS)} />

        {/* Account footer */}
        <SectionReveal>
          <div className="px-6">
            <div className="rounded-card border border-border/40 bg-card p-5 shadow-soft">
              <h2 className="text-sm font-bold mb-4">{t('profile.account_details')}</h2>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-sm text-muted-foreground">{t('profile.premium.account.member_since')}</span>
                <span className="text-sm font-medium">{user?.created_date ? new Date(user.created_date).toLocaleDateString() : t('profile.premium.account.today')}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => navigate('/about')}
                  className="flex items-center justify-center gap-2 h-11 rounded-button border border-border text-sm font-medium hover:bg-muted/50 transition-default active:scale-95"
                >
                  <Info className="w-4 h-4" /><span>{t('profile.action.about')}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 h-11 rounded-button border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-default active:scale-95"
                >
                  <LogOut className="w-4 h-4" /><span>{t('profile.action.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>

      <EditProfileSheet
        open={showEdit}
        onOpenChange={(v) => { setShowEdit(v); if (!v) setEditTarget(null); }}
        member={member}
        onSaved={refreshMember}
        focusSection={editTarget}
      />

      <ProfileMoreSheet
        open={showMore}
        onOpenChange={setShowMore}
        onSettings={() => navigate('/settings')}
        onSafety={() => navigate('/safety-center')}
        onAbout={() => navigate('/about')}
        onLogout={handleLogout}
      />
    </div>
  );
}