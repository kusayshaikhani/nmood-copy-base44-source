import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Download, Trash2, BarChart3, Sparkles, MapPin, FileText, Cookie, Bell, Camera, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { updateMemberProfile } from '@/lib/member-update';
import { useAuth } from '@/lib/AuthContext';
import { setAnalyticsConsent, setAiPersonalization } from '@/lib/consent-store';
import { useLocalization } from '@/lib/i18n/useLocalization';
import PageHeader from '@/components/shared/PageHeader';
import PrivacyControls from '@/components/profile/PrivacyControls';
import ProfileViewVisibilityRow from '@/components/profile-views/ProfileViewVisibilityRow';
import DeleteAccountSheet from '@/components/privacy/DeleteAccountSheet';
import DataExportSheet from '@/components/privacy/DataExportSheet';

// LC-002 Part 11 — Expanded Privacy Settings.
function PrivacyRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-start gap-3 py-4">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function Privacy() {
  const { member } = useAuth();
  const { t } = useLocalization();
  const [showDelete, setShowDelete] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(!!member?.analytics_consent);
  const [aiOn, setAiOn] = useState(member?.personalized_recommendations !== false);
  const [locationOn, setLocationOn] = useState(!!member?.location_enabled);
  const [notifEmailOn, setNotifEmailOn] = useState(member?.notif_email !== false);
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleAnalyticsToggle = useCallback(async (checked) => {
    setAnalyticsOn(checked);
    setAnalyticsConsent(checked);
    if (member?.id) {
      try { await updateMemberProfile({ analytics_consent: checked }); }
      catch { /* non-blocking */ }
    }
  }, [member]);

  const handleAiToggle = useCallback(async (checked) => {
    setAiOn(checked);
    setAiPersonalization(checked);
    if (member?.id) {
      try { await updateMemberProfile({ personalized_recommendations: checked }); }
      catch { /* non-blocking */ }
    }
  }, [member]);

  const handleLocationToggle = useCallback(async (checked) => {
    setLocationOn(checked);
    if (member?.id) {
      try { await updateMemberProfile({ location_enabled: checked }); }
      catch { /* non-blocking */ }
    }
  }, [member]);

  const handleNotifEmailToggle = useCallback(async (checked) => {
    setNotifEmailOn(checked);
    if (member?.id) {
      try { await updateMemberProfile({ notif_email: checked }); }
      catch { /* non-blocking */ }
    }
  }, [member]);

  const notifStatusLabel = notifPermission === 'granted' ? 'Enabled' : notifPermission === 'denied' ? 'Blocked' : 'Not set';
  const notifStatusColor = notifPermission === 'granted' ? 'text-success' : notifPermission === 'denied' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t('lc002.privacy.title')} description={t('lc002.privacy.description')} />

      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 mb-6 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">{t('lc002.privacy.privacy_first')}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t('lc002.privacy.privacy_first_desc')}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{t('lc002.privacy.visibility')}</h2>
        <div className="space-y-3">
          <PrivacyControls member={member} />
          <Card className="px-4">
            <ProfileViewVisibilityRow />
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{t('lc002.privacy.data_consent')}</h2>
        <Card className="divide-y divide-border px-4">
          <PrivacyRow icon={BarChart3} title={t('lc002.privacy.analytics')} description={t('lc002.privacy.analytics_desc')}>
            <Switch checked={analyticsOn} onCheckedChange={handleAnalyticsToggle} />
          </PrivacyRow>
          <PrivacyRow icon={Sparkles} title={t('lc002.privacy.ai_personalization')} description={t('lc002.privacy.ai_personalization_desc')}>
            <Switch checked={aiOn} onCheckedChange={handleAiToggle} />
          </PrivacyRow>
          <PrivacyRow icon={MapPin} title={t('lc002.privacy.location_services')} description={t('lc002.privacy.location_services_desc')}>
            <Switch checked={locationOn} onCheckedChange={handleLocationToggle} />
          </PrivacyRow>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Communications &amp; Permissions</h2>
        <Card className="divide-y divide-border px-4">
          <PrivacyRow icon={Mail} title="Email notifications" description="Receive experience reminders, pal requests, and important account emails. You can opt out without losing access.">
            <Switch checked={notifEmailOn} onCheckedChange={handleNotifEmailToggle} />
          </PrivacyRow>
          <PrivacyRow icon={Bell} title="Push notifications" description={`Device permission: ${notifStatusLabel}. Manage in your device Settings → Nmood → Notifications.`}>
            <span className={`text-xs font-medium ${notifStatusColor}`}>{notifStatusLabel}</span>
          </PrivacyRow>
          <PrivacyRow icon={Camera} title="Camera & photos" description="Requested only when you capture or upload a photo. You can always choose from your library instead. Manage in your device Settings → Nmood → Camera.">
            <span className="text-xs text-muted-foreground">Per-use</span>
          </PrivacyRow>
          <PrivacyRow icon={Cookie} title="Browser storage & cookies" description="Nmood uses local storage for your session and preferences. No advertising cookies. See the Cookie Notice for details.">
            <Button variant="outline" size="sm" asChild>
              <Link to="/cookie-notice">View</Link>
            </Button>
          </PrivacyRow>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{t('lc002.privacy.your_data')}</h2>
        <Card className="divide-y divide-border px-4">
          <PrivacyRow icon={Lock} title={t('lc002.privacy.encryption')} description={t('lc002.privacy.encryption_desc')}>
            <Switch checked disabled />
          </PrivacyRow>
          <PrivacyRow icon={Download} title={t('lc002.privacy.export_data')} description={t('lc002.privacy.export_data_desc')}>
            <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>{t('lc002.privacy.export_btn')}</Button>
          </PrivacyRow>
          <PrivacyRow icon={FileText} title={t('lc002.privacy.privacy_policy')} description={t('lc002.privacy.privacy_policy_desc')}>
            <Button variant="outline" size="sm" asChild>
              <Link to="/privacy-policy">{t('lc002.privacy.view')}</Link>
            </Button>
          </PrivacyRow>
          <PrivacyRow icon={Cookie} title="Cookie Notice" description="How Nmood uses cookies, local storage, and device permissions">
            <Button variant="outline" size="sm" asChild>
              <Link to="/cookie-notice">{t('lc002.privacy.view')}</Link>
            </Button>
          </PrivacyRow>
          <PrivacyRow icon={FileText} title={t('lc002.privacy.terms_of_service')} description={t('lc002.privacy.terms_of_service_desc')}>
            <Button variant="outline" size="sm" asChild>
              <Link to="/terms">{t('lc002.privacy.view')}</Link>
            </Button>
          </PrivacyRow>
          <PrivacyRow icon={Trash2} title={t('lc002.privacy.delete_account')} description={t('lc002.privacy.delete_account_desc')}>
            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>{t('lc002.privacy.delete_btn')}</Button>
          </PrivacyRow>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center px-4">
        {t('lc002.privacy.footer')}
      </p>

      <DeleteAccountSheet open={showDelete} onOpenChange={setShowDelete} />
      <DataExportSheet open={showExport} onOpenChange={setShowExport} />
    </div>
  );
}