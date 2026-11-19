import React, { useState } from 'react';
import { Eye, MessageCircle, Shield, Lock, Loader2, Calendar, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/AuthContext';
import { updateMemberProfile } from '@/lib/member-update';
import { useLocalization } from '@/lib/i18n/useLocalization';
import MemberIndicatorSettings from './MemberIndicatorSettings';

export default function PrivacyControls({ member }) {
  const { refreshMember } = useAuth();
  const { t } = useLocalization();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const whoCanMessage = member?.who_can_message || 'everyone';
  const profileVisibility = member?.profile_visibility || 'public';
  const showOnlineStatus = member?.show_online_status ?? true;
  const showAge = member?.show_age ?? false;
  const showDistance = member?.show_distance ?? false;
  const showLastSeen = member?.show_last_seen ?? false;

  const persist = async (field, value) => {
    if (!member?.id) return;
    setSaving(true);
    setSaveError('');
    try {
      const consent = field === 'show_distance' ? { indicator_distance_consent: value } : field === 'show_online_status' ? { indicator_presence_consent: value } : {};
      await updateMemberProfile({ [field]: value, ...consent });
      await refreshMember();
    } catch {
      setSaveError('Could not save this privacy choice. Your previous setting is unchanged; please retry.');
    } finally {
      setSaving(false);
    }
  };

  const messageOptions = [
    { value: 'everyone', label: t('profile.privacy.message.everyone') },
    { value: 'connections', label: t('profile.privacy.message.pals') },
    { value: 'no_one', label: t('profile.privacy.message.no_one') },
  ];

  const visibilityOptions = [
    { value: 'public', label: t('profile.privacy.visibility.public') },
    { value: 'connections', label: t('profile.privacy.visibility.pals') },
    { value: 'private', label: t('profile.privacy.visibility.private') },
  ];

  const visibilityToggles = [
    { icon: Calendar, label: t('profile.privacy.show_age'), value: showAge, field: 'show_age' },
    { icon: MapPin, label: t('profile.privacy.show_distance'), value: showDistance, field: 'show_distance' },
    { icon: Shield, label: t('profile.privacy.show_online'), value: showOnlineStatus, field: 'show_online_status' },
    { icon: Clock, label: t('profile.privacy.show_last_seen'), value: showLastSeen, field: 'show_last_seen' },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('profile.privacy.title')}</h2>
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ms-auto" />}
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Premium members can view only permitted profile details. Age, children preference, marital status and distance remain hidden unless you enable their sharing settings. Contact details, date of birth and exact location are never included. Blocking still applies.</p>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('profile.privacy.who_message')}</label>
          </div>
          <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl">
            {messageOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => persist('who_can_message', opt.value)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-default ${
                  whoCanMessage === opt.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Explorer profile visibility</label>
          </div>
          <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl">
            {visibilityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => persist('profile_visibility', opt.value)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-default ${
                  profileVisibility === opt.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Premium privacy visibility controls */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Explorer and discovery visibility</label>
          </div>
          <div className="space-y-1 divide-y divide-border">
            {visibilityToggles.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.field} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                    <span className="text-sm font-medium">{t.label}</span>
                  </div>
                  <Switch
                    checked={t.value}
                    onCheckedChange={(v) => persist(t.field, v)}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">Enabling approximate distance or activity status also records your separate consent for the relevant foreground signal. Distance uses a coarse cell only; consent can be withdrawn by switching it off.</p>
        </div>
        <MemberIndicatorSettings />
        {saveError && <p role="alert" className="text-xs text-destructive">{saveError}</p>}
      </div>
    </Card>
  );
}
