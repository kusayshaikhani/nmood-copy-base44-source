import React, { useState } from 'react';
import {
  User, Phone, Mail, Lock, ShieldCheck, Crown, Shield, EyeOff, MapPin, Eye,
  Bell, BellRing, MessageSquare, Megaphone, Palette, Type, Sparkles, Globe,
  Radar, Calendar, Users, Layers, Fingerprint, Monitor, History, Download,
  LifeBuoy, Flag, MessageCircle, BookOpen, FileText, Info, LogOut, Rocket, Heart,
  Moon, Sun, Loader2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/ThemeProvider';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { updateMemberProfile } from '@/lib/member-update';
import { APP_VERSION } from '@/lib/system-config';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { LANGUAGES } from '@/lib/i18n/languages';
import ReconnectSettings from '@/components/reconnect/ReconnectSettings';
import LanguageRegionSection from '@/components/settings/LanguageRegionSection';
import { canAccessMissionControl } from '@/lib/admin-authorization';
import { isMonetizationEnabled, isFounderAccessEnabled, isSettingsDevFeaturesEnabled } from '@/lib/launch-mode';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import DeleteAccountSheet from '@/components/privacy/DeleteAccountSheet';
import DataExportSheet from '@/components/privacy/DataExportSheet';
import SectionReveal from '@/components/experience/SectionReveal';

import { SettingsSearchProvider } from '@/components/settings/premium/SettingsSearchContext';
import SettingsHero from '@/components/settings/premium/SettingsHero';
import SettingsSearchBar from '@/components/settings/premium/SettingsSearchBar';
import SettingsGroupCard from '@/components/settings/premium/SettingsGroupCard';
import PremiumSettingsRow from '@/components/settings/premium/PremiumSettingsRow';
import SettingsThemeSwitcher from '@/components/settings/premium/SettingsThemeSwitcher';
import DangerZoneCard from '@/components/settings/premium/DangerZoneCard';
import SearchPreferencesSheet from '@/components/settings/SearchPreferencesSheet';
import ChangePasswordSheet from '@/components/settings/ChangePasswordSheet';
import PrivacySafetySection from '@/components/settings/PrivacySafetySection';
import LegalSafetySection from '@/components/settings/LegalSafetySection';
import SubscriptionStatusCard from '@/components/settings/SubscriptionStatusCard';

const SoonTag = () => (
  <span className="text-[11px] font-medium text-muted-foreground/70 px-2 py-1 rounded-full bg-muted">
    Soon
  </span>
);

export default function Settings() {
  const { t, lang } = useLocalization();
  const { theme } = useTheme();
  const { user, logout, member, refreshMember } = useAuth();
  const { isPremium } = useMembershipAccess();
  const [showDelete, setShowDelete] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSearchPrefs, setShowSearchPrefs] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = () => logout(true);

  const handleSignOutEverywhere = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await base44.functions.invoke('authorizationGate', { action: 'signOutEverywhere' });
      // The backend set force_logout_at; logout locally now (other devices
      // are signed out by the AuthContext poll within 30s).
      logout(true);
    } catch {
      setSigningOut(false);
    }
  };

  const persistNotif = async (field, value) => {
    if (!member?.id) return;
    try {
      await updateMemberProfile({ [field]: value });
      await refreshMember();
    } catch {
      // ignore — user can retry
    }
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === lang)?.nativeName || lang;
  const soonKeys = ['soon', 'coming soon'];

  return (
    <SettingsSearchProvider>
      <div className="max-w-2xl mx-auto pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <SettingsHero />
        <SettingsSearchBar />

        <div className="px-4 pt-5 space-y-6">
          {/* Section 1 — Account */}
          <SettingsGroupCard title={t('settings.section.account')} icon={User}>
            <PremiumSettingsRow icon={User} tone="primary" title={t('settings.row.profile')} subtitle={t('settings.row.profile_desc')} to="/profile"
              searchKeys={['account', 'profile', t('settings.row.profile')]} />
            <PremiumSettingsRow icon={Phone} title={t('settings.row.phone')} subtitle={member?.phone || t('settings.row.phone_desc')} to="/profile"
              searchKeys={['phone', 'number', t('settings.row.phone')]} />
            <PremiumSettingsRow icon={Mail} title={t('settings.row.email')} subtitle={user?.email || t('settings.row.email_desc')} to="/profile"
              searchKeys={['email', t('settings.row.email')]} />
            <PremiumSettingsRow icon={Lock} title={t('settings.row.password')} subtitle={t('settings.row.password_desc')} onClick={() => setShowChangePassword(true)}
              searchKeys={['password', t('settings.row.password'), ...soonKeys]} />
            <PremiumSettingsRow icon={ShieldCheck} tone="success" title={t('settings.row.identity_verification')} subtitle={t('settings.row.identity_verification_desc')} to="/profile"
              searchKeys={['verification', 'identity', 'trust', t('settings.row.identity_verification')]} />
            {isFounderAccessEnabled() && (
            <PremiumSettingsRow icon={Sparkles} tone="primary" title={t('founder_access.title')} subtitle={t('founder_access.message')} chevron={false}
              searchKeys={['founder', 'access', 'membership', 'premium', t('founder_access.title')]} />
            )}
            {isMonetizationEnabled() && !isFounderAccessEnabled() && (
            <PremiumSettingsRow icon={Crown} tone="accent" title={t('settings.row.premium_membership')} subtitle={isPremium ? t('membership.premium') : t('membership.explorer')} to="/membership"
              searchKeys={['membership', 'premium', 'subscription', t('settings.row.premium_membership')]} />
            )}
          </SettingsGroupCard>

          {/* Subscription Status — current plan, restore purchases, manage subscription */}
          {isMonetizationEnabled() && !isFounderAccessEnabled() && (
            <SectionReveal>
              <SubscriptionStatusCard />
            </SectionReveal>
          )}

          {/* Administration (Mission Control) — kept for authorized users */}
          {canAccessMissionControl(user) && (
            <SettingsGroupCard title={t('settings.section.administration')} icon={Rocket} delay={0.05}>
              <PremiumSettingsRow icon={Rocket} tone="primary" title={t('settings.mission_control')} subtitle={t('settings.mission_control_desc')} to="/mission-control"
                searchKeys={['mission control', 'admin', t('settings.mission_control')]} />
            </SettingsGroupCard>
          )}

          {/* Privacy & Safety — consolidated account state, privacy controls, safety */}
          <PrivacySafetySection member={member} refreshMember={refreshMember} onDelete={() => setShowDelete(true)} />

          {/* Section 3 — Notifications */}
          <SettingsGroupCard title={t('settings.section.notifications')} icon={Bell} delay={0.1}>
            <PremiumSettingsRow icon={Bell} tone="primary" title={t('settings.push_notifications')} subtitle={t('settings.push_notifications_desc')}
              trailing={<Switch checked={member?.notifications_enabled ?? true} onCheckedChange={(v) => persistNotif('notifications_enabled', v)} />}
              searchKeys={['push', 'notifications', t('settings.push_notifications')]} />
            <PremiumSettingsRow icon={Mail} title={t('settings.row.email_notifications')} subtitle={t('settings.row.email_notifications_desc')}
              trailing={<Switch checked={member?.notif_email ?? true} onCheckedChange={(v) => persistNotif('notif_email', v)} />}
              searchKeys={['email', 'notifications', t('settings.row.email_notifications')]} />
            {isSettingsDevFeaturesEnabled() && (
            <PremiumSettingsRow icon={BellRing} title={t('settings.row.experience_reminders')} subtitle={t('settings.row.experience_reminders_desc')} disabled trailing={<SoonTag />}
              searchKeys={['reminders', 'experience', t('settings.row.experience_reminders'), ...soonKeys]} />
            )}
            <PremiumSettingsRow icon={Users} title={t('settings.row.circle_updates')} subtitle={t('settings.row.circle_updates_desc')}
              trailing={<Switch checked={member?.notif_circle ?? false} onCheckedChange={(v) => persistNotif('notif_circle', v)} />}
              searchKeys={['circle', 'updates', t('settings.row.circle_updates')]} />
            {isSettingsDevFeaturesEnabled() && (
            <>
            <PremiumSettingsRow icon={MessageSquare} title={t('settings.row.messages')} subtitle={t('settings.row.messages_desc')} disabled trailing={<SoonTag />}
              searchKeys={['messages', t('settings.row.messages'), ...soonKeys]} />
            <PremiumSettingsRow icon={Megaphone} title={t('settings.row.announcements')} subtitle={t('settings.row.announcements_desc')} disabled trailing={<SoonTag />}
              searchKeys={['announcements', t('settings.row.announcements'), ...soonKeys]} />
            </>
            )}
          </SettingsGroupCard>

          {/* Section 4 — Appearance */}
          <SettingsGroupCard title={t('settings.section.appearance')} icon={Palette} delay={0.1}>
            <div className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                {theme === 'dark' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-medium leading-tight">{t('settings.row.theme')}</p>
                <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">{t('settings.row.theme_desc')}</p>
              </div>
              <SettingsThemeSwitcher />
            </div>
            {isSettingsDevFeaturesEnabled() && (
            <>
            <PremiumSettingsRow icon={Palette} title={t('settings.row.accent_color')} subtitle={t('settings.row.accent_color_desc')} disabled trailing={<SoonTag />}
              searchKeys={['accent', 'color', t('settings.row.accent_color'), ...soonKeys]} />
            <PremiumSettingsRow icon={Type} title={t('settings.row.text_size')} subtitle={t('settings.row.text_size_desc')} disabled trailing={<SoonTag />}
              searchKeys={['text', 'size', t('settings.row.text_size'), ...soonKeys]} />
            <PremiumSettingsRow icon={Sparkles} title={t('settings.row.animations')} subtitle={t('settings.row.animations_desc')} disabled trailing={<SoonTag />}
              searchKeys={['animations', 'motion', t('settings.row.animations'), ...soonKeys]} />
            </>
            )}
            <PremiumSettingsRow icon={Globe} title={t('settings.row.language')} subtitle={t('settings.row.language_desc')} trailing={<span className="text-[13px] text-muted-foreground font-medium">{currentLanguage}</span>} chevron={false}
              searchKeys={['language', t('settings.row.language')]} />
          </SettingsGroupCard>

          {/* Language & Region — preserved functional block */}
          <SectionReveal delay={0.1}>
            <LanguageRegionSection />
          </SectionReveal>

          {/* Reconnect — preserved functional block */}
          <SectionReveal delay={0.1}>
            <ReconnectSettings />
          </SectionReveal>

          {/* Section 5 — Discovery */}
          <SettingsGroupCard title={t('settings.section.discovery')} icon={Radar} delay={0.15}>
            <PremiumSettingsRow icon={Radar} tone="primary" title="Search preferences" subtitle="Radius, age, availability & languages" onClick={() => setShowSearchPrefs(true)}
              searchKeys={['search', 'preferences', 'country', 'radius', 'age', 'availability', 'language', 'discovery']} />
            <PremiumSettingsRow icon={Heart} title={t('settings.row.interest_preferences')} subtitle={t('settings.row.interest_preferences_desc')} to="/explore"
              searchKeys={['interests', 'preferences', t('settings.row.interest_preferences')]} />
            <PremiumSettingsRow icon={Layers} title={t('settings.row.experience_types')} subtitle={t('settings.row.experience_types_desc')} to="/explore"
              searchKeys={['experience', 'types', t('settings.row.experience_types')]} />
            <PremiumSettingsRow icon={Users} title={t('settings.row.circle_categories')} subtitle={t('settings.row.circle_categories_desc')} to="/explore"
              searchKeys={['circle', 'categories', t('settings.row.circle_categories')]} />
            {isSettingsDevFeaturesEnabled() && (
            <PremiumSettingsRow icon={Sparkles} tone="primary" title={t('settings.row.ai_recommendations')} subtitle={t('settings.row.ai_recommendations_desc')} disabled trailing={<SoonTag />}
              searchKeys={['ai', 'recommendations', t('settings.row.ai_recommendations'), ...soonKeys]} />
            )}
          </SettingsGroupCard>

          {/* Section 6 — Security */}
          <SettingsGroupCard title={t('settings.section.security')} icon={ShieldCheck} delay={0.15}>
            {isSettingsDevFeaturesEnabled() && (
            <PremiumSettingsRow icon={Fingerprint} tone="success" title={t('settings.row.two_factor')} subtitle={t('settings.row.two_factor_desc')} disabled trailing={<SoonTag />}
              searchKeys={['two factor', '2fa', 'security', t('settings.row.two_factor'), ...soonKeys]} />
            )}
            <PremiumSettingsRow icon={Monitor} title="Sign out of all sessions" subtitle="End your active session on every device"
              onClick={handleSignOutEverywhere} disabled={signingOut}
              trailing={signingOut ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <LogOut className="w-4 h-4 text-muted-foreground" />}
              searchKeys={['sessions', 'sign out', 'logout', 'devices', 'active']} />
            {isSettingsDevFeaturesEnabled() && (
            <>
            <PremiumSettingsRow icon={ShieldCheck} title={t('settings.row.trusted_devices')} subtitle={t('settings.row.trusted_devices_desc')} disabled trailing={<SoonTag />}
              searchKeys={['trusted', 'devices', t('settings.row.trusted_devices'), ...soonKeys]} />
            <PremiumSettingsRow icon={History} title={t('settings.row.login_history')} subtitle={t('settings.row.login_history_desc')} disabled trailing={<SoonTag />}
              searchKeys={['login', 'history', t('settings.row.login_history'), ...soonKeys]} />
            </>
            )}
            <PremiumSettingsRow icon={Download} title={t('settings.row.download_data')} subtitle={t('settings.row.download_data_desc')} onClick={() => setShowExport(true)}
              searchKeys={['download', 'data', 'export', t('settings.row.download_data')]} />
          </SettingsGroupCard>



          {/* Legal & Safety — all legal documents + contact support */}
          <LegalSafetySection />

          {/* Section 7 — Support */}
          <SettingsGroupCard title={t('settings.section.support')} icon={LifeBuoy} delay={0.2}>
            <PremiumSettingsRow icon={LifeBuoy} tone="primary" title={t('settings.row.help_center')} subtitle={t('settings.row.help_center_desc')} to="/help"
              searchKeys={['help', 'center', 'faq', t('settings.row.help_center')]} />
            <PremiumSettingsRow icon={Flag} title={t('settings.row.report_problem')} subtitle={t('settings.row.report_problem_desc')} to="/safety-center"
              searchKeys={['report', 'problem', t('settings.row.report_problem')]} />
            <PremiumSettingsRow icon={MessageCircle} title={t('settings.row.contact_support')} subtitle={t('settings.row.contact_support_desc')} to="/help"
              searchKeys={['contact', 'support', t('settings.row.contact_support')]} />
            <PremiumSettingsRow icon={BookOpen} title={t('settings.row.community_guidelines')} subtitle={t('settings.row.community_guidelines_desc')} to="/community-guidelines"
              searchKeys={['community', 'guidelines', t('settings.row.community_guidelines')]} />
            <PremiumSettingsRow icon={FileText} title={t('settings.row.terms')} subtitle={t('settings.row.terms_desc')} to="/terms"
              searchKeys={['terms', t('settings.row.terms')]} />
            <PremiumSettingsRow icon={Shield} title={t('settings.row.privacy_policy')} subtitle={t('settings.row.privacy_policy_desc')} to="/privacy"
              searchKeys={['privacy', 'policy', t('settings.row.privacy_policy')]} />
            <PremiumSettingsRow icon={Info} title={t('settings.about_nmood')} subtitle={t('settings.about_version', { version: APP_VERSION })} to="/about"
              searchKeys={['about', 'nmood', t('settings.about_nmood')]} />
            <PremiumSettingsRow icon={Info} title={t('settings.row.app_version')} subtitle={APP_VERSION} chevron={false}
              trailing={<span className="text-[13px] text-muted-foreground font-medium">{APP_VERSION}</span>}
              searchKeys={['version', 'app', t('settings.row.app_version')]} />
          </SettingsGroupCard>

          {/* Log out */}
          <SectionReveal delay={0.2}>
            <Button variant="destructive" className="w-full gap-2 rounded-button h-12" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />{t('settings.log_out')}
            </Button>
          </SectionReveal>


        </div>
      </div>

      <DeleteAccountSheet open={showDelete} onOpenChange={setShowDelete} />
      <DataExportSheet open={showExport} onOpenChange={setShowExport} />
      <SearchPreferencesSheet open={showSearchPrefs} onOpenChange={setShowSearchPrefs} />
      <ChangePasswordSheet open={showChangePassword} onOpenChange={setShowChangePassword} />
    </SettingsSearchProvider>
  );
}