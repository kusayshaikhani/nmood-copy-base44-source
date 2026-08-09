import React, { useState } from 'react';
import { Eye, MessageCircle, Shield, Lock, Loader2, Calendar, MapPin, Clock, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { base44 } from '@/api/base44Client';
import { updateMemberProfile } from '@/lib/member-update';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PrivacyControls({ member }) {
  const { refreshMember } = useAuth();
  const { isPremium } = useMembershipAccess();
  const { t } = useLocalization();
  const [saving, setSaving] = useState(false);

  const whoCanMessage = member?.who_can_message || 'connections';
  const profileVisibility = member?.profile_visibility || 'connections';
  const showOnlineStatus = member?.show_online_status ?? true;
  const showAge = member?.show_age ?? false;
  const showDistance = member?.show_distance ?? false;
  const showLastSeen = member?.show_last_seen ?? false;

  const persist = async (field, value) => {
    if (!member?.id) return;
    setSaving(true);
    try {
      await updateMemberProfile({ [field]: value });
      await refreshMember();
    } catch {
      // Silently fail — user can retry
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('profile.privacy.who_view')}</label>
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('profile.privacy.visibility_title')}</label>
            {!isPremium && (
              <span className="ms-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
                <Crown className="w-3 h-3" /> {t('profile.privacy.premium_feature')}
              </span>
            )}
          </div>
          <div className={`space-y-1 divide-y divide-border ${!isPremium ? 'opacity-60' : ''}`}>
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
                    disabled={!isPremium}
                    onCheckedChange={(v) => persist(t.field, v)}
                  />
                </div>
              );
            })}
          </div>
          {!isPremium && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              {t('profile.privacy.upgrade_hint')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}