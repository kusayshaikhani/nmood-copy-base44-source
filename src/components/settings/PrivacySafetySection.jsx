import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Ban, Flag, BookOpen, Pause, RotateCcw, Trash2, Loader2, Radar, MapPin, BarChart3 } from 'lucide-react';
import SettingsGroupCard from '@/components/settings/premium/SettingsGroupCard';
import PremiumSettingsRow from '@/components/settings/premium/PremiumSettingsRow';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { updateMemberProfile } from '@/lib/member-update';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import SectionReveal from '@/components/experience/SectionReveal';
import { pauseProfile, hideProfile, reactivateProfile, ACCOUNT_STATES, STATE_LABELS } from '@/lib/account-state';
import ReportHistorySheet from '@/components/safety/ReportHistorySheet';
import { setAnalyticsConsent } from '@/lib/consent-store';

// Segmented control for enum-valued privacy fields.
function Segmented({ value, options, onChange }) {
  return (
    <div className="flex p-1 rounded-xl bg-muted/60 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-default ${
            value === opt.value ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const MESSAGE_OPTS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'connections', label: 'Pals' },
  { value: 'no_one', label: 'No one' },
];

const VISIBILITY_OPTS = [
  { value: 'public', label: 'Public' },
  { value: 'connections', label: 'Pals' },
  { value: 'private', label: 'Private' },
];

export default function PrivacySafetySection({ member, refreshMember, onDelete }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(null);
  const [showReports, setShowReports] = useState(false);

  const persist = async (field, value) => {
    if (!member?.id) return;
    try {
      await updateMemberProfile({ [field]: value });
      await refreshMember();
    } catch { /* user can retry */ }
  };

  // LC-002 Part 6 — analytics consent: update the module-level store immediately
  // so trackProductEvent gates correctly, then persist to the member record.
  const persistAnalyticsConsent = async (value) => {
    setAnalyticsConsent(value);
    await persist('analytics_consent', value);
  };

  const runStateAction = async (key, fn, successTitle) => {
    setBusy(key);
    try {
      await fn(member);
      await refreshMember();
      toast({ title: successTitle });
    } catch (e) {
      toast({ title: 'Action failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const state = member?.account_state || ACCOUNT_STATES.ACTIVE;
  const isActive = state === ACCOUNT_STATES.ACTIVE;
  const isPaused = state === ACCOUNT_STATES.PAUSED;
  const isHidden = state === ACCOUNT_STATES.HIDDEN;

  return (
    <>
      {/* Account state — Pause / Hide / Reactivate / Delete */}
      <SettingsGroupCard title="Account" icon={Shield}>
        <div className="px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14.5px] font-medium leading-tight">Profile status</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">Control how visible you are on Nmood.</p>
          </div>
          <Badge variant={isPaused || isHidden ? 'warning' : isActive ? 'success' : 'secondary'}>
            {STATE_LABELS[state] || 'Active'}
          </Badge>
        </div>

        {isActive && (
          <div className="px-4 pb-3.5 flex gap-2.5">
            <Button variant="outline" className="flex-1 h-11 gap-2 rounded-button" disabled={!!busy} onClick={() => runStateAction('pause', pauseProfile, 'Profile paused')}>
              {busy === 'pause' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />} Pause
            </Button>
            <Button variant="outline" className="flex-1 h-11 gap-2 rounded-button" disabled={!!busy} onClick={() => runStateAction('hide', hideProfile, 'Profile hidden')}>
              {busy === 'hide' ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />} Hide
            </Button>
          </div>
        )}

        {(isPaused || isHidden) && (
          <div className="px-4 pb-3.5">
            <p className="text-xs text-muted-foreground mb-2.5">
              {isPaused
                ? 'You are paused — removed from discovery and new Pal requests. Existing chats remain available.'
                : 'You are hidden — invisible to discovery. Existing Pals can still reach you.'}
            </p>
            <Button variant="default" className="w-full h-11 gap-2 rounded-button" disabled={!!busy} onClick={() => runStateAction('reactivate', reactivateProfile, 'Profile reactivated')}>
              {busy === 'reactivate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Reactivate Profile
            </Button>
          </div>
        )}

        <PremiumSettingsRow
          icon={Trash2}
          tone="destructive"
          title="Delete Account"
          subtitle="Soft delete with a 30-day recovery window. Login is disabled; your data is preserved."
          onClick={onDelete}
          searchKeys={['delete', 'account']}
        />
      </SettingsGroupCard>

      {/* Privacy — visibility & sharing controls */}
      <SettingsGroupCard title="Privacy" icon={Eye} delay={0.05}>
        <div className="px-4 py-3.5">
          <p className="text-[14.5px] font-medium leading-tight mb-1">Who can message me</p>
          <Segmented value={member?.who_can_message || 'connections'} options={MESSAGE_OPTS} onChange={(v) => persist('who_can_message', v)} />
        </div>
        <div className="px-4 py-3.5 border-t border-border/60">
          <p className="text-[14.5px] font-medium leading-tight mb-1">Who can view my profile</p>
          <Segmented value={member?.profile_visibility || 'connections'} options={VISIBILITY_OPTS} onChange={(v) => persist('profile_visibility', v)} />
        </div>
        <PremiumSettingsRow icon={Eye} title="Show age" subtitle="Display your age on your profile"
          trailing={<Switch checked={member?.show_age ?? false} onCheckedChange={(v) => persist('show_age', v)} />}
          searchKeys={['age']} />
        <PremiumSettingsRow icon={Radar} title="Show online status" subtitle="Let others see when you are active"
          trailing={<Switch checked={member?.show_online_status ?? true} onCheckedChange={(v) => persist('show_online_status', v)} />}
          searchKeys={['online', 'status']} />
        <PremiumSettingsRow icon={RotateCcw} title="Show last seen" subtitle="Show your last active time"
          trailing={<Switch checked={member?.show_last_seen ?? false} onCheckedChange={(v) => persist('show_last_seen', v)} />}
          searchKeys={['last seen']} />
        <PremiumSettingsRow icon={MapPin} title="Show distance" subtitle="Show approximate distance in discovery"
          trailing={<Switch checked={member?.show_distance ?? false} onCheckedChange={(v) => persist('show_distance', v)} />}
          searchKeys={['distance']} />
        <PremiumSettingsRow icon={BarChart3} title="Product analytics" subtitle="Help improve Nmood by sharing optional usage analytics. This is off by default and can be changed at any time."
          trailing={<Switch checked={member?.analytics_consent ?? false} onCheckedChange={(v) => persistAnalyticsConsent(v)} />}
          searchKeys={['analytics', 'consent', 'tracking']} />
      </SettingsGroupCard>

      {/* Safety — blocked members, report history, guidelines */}
      <SettingsGroupCard title="Safety" icon={Ban} delay={0.1}>
        <PremiumSettingsRow icon={Ban} tone="destructive" title="Blocked Members" subtitle="Manage who you have blocked" to="/safety-center"
          searchKeys={['blocked']} />
        <PremiumSettingsRow icon={Flag} title="Report History" subtitle="Reports you have submitted" onClick={() => setShowReports(true)}
          searchKeys={['report', 'history']} />
        <PremiumSettingsRow icon={BookOpen} title="Community Guidelines" subtitle="Read the rules of the community" to="/community-guidelines"
          searchKeys={['guidelines', 'community']} />
      </SettingsGroupCard>

      <SectionReveal delay={0.1}>
        <ReportHistorySheet open={showReports} onOpenChange={setShowReports} />
      </SectionReveal>
    </>
  );
}