import React, { useEffect, useState } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Crown, Shield, Heart, Users, Calendar, Flag, AlertTriangle, Activity, Pencil } from 'lucide-react';
import {
  AvatarCell, StatusBadge, MembershipBadge, VerificationBadge, TrustCell, OnlineDot,
} from './MCMemberShared';
import MCMemberNotes from './MCMemberNotes';
import MCMemberActionsMenu from './MCMemberActionsMenu';
import MembershipOverrideSection from './MembershipOverrideSection';
import MCMemberHistory from './MCMemberHistory';
import { memberStats } from '@/lib/admin-actions';
import {
  fullName, username, memberShortId, primaryLanguage, trustScore, profileCompletion,
  verificationStatus, formatDate, formatRelative, membershipTier,
} from '@/lib/member-directory';

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate" title={typeof value === 'string' ? value : undefined}>{value || '—'}</p>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

export default function MCMemberProfileSheet({ member, membershipMap, open, onOpenChange, onAction, showDevHardDelete }) {
  const { t } = useLocalization();
  const [stats, setStats] = useState(null);
  const tier = member ? membershipTier(member, membershipMap) : 'explorer';

  useEffect(() => {
    if (!member?.created_by_id) return;
    let active = true;
    setStats(null);
    memberStats(member.created_by_id)
      .then((s) => { if (active) setStats(s); })
      .catch(() => { if (active) setStats(null); });
    return () => { active = false; };
  }, [member?.created_by_id]);

  if (!member) return null;

  const completion = profileCompletion(member);
  const trust = trustScore(member);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-12">
          <SheetTitle>{t('admin.member_profile')}</SheetTitle>
          <SheetDescription>{t('mission.administrative_view_private_and_confidential')}</SheetDescription>
        </SheetHeader>

        {/* Identity header */}
        <div className="flex items-center gap-3 mt-4">
          <AvatarCell member={member} size="w-14 h-14" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{fullName(member)}</p>
              <StatusBadge status={member.admin_status} />
            </div>
            <p className="text-xs text-muted-foreground truncate">{member.email || '—'}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{memberShortId(member)}</p>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => onAction(member, 'edit')}>
            <Pencil className="w-3.5 h-3.5" /> {t('mission.edit')}
          </Button>
        </div>

        {/* Identity */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.identity')}</h3>
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4">
          <Field label="Full Name" value={fullName(member)} />
          <Field label="Username" value={username(member)} />
          <Field label="Member ID" value={memberShortId(member)} />
          <Field label="Email" value={member.email} />
          <Field label="Phone" value={member.phone || '—'} />
          <Field label="Date Joined" value={formatDate(member.created_date)} />
          <Field label="Country" value={member.country} />
          <Field label="City" value={member.city} />
          <Field label="Preferred Language" value={primaryLanguage(member)} />
        </div>

        {/* Account */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.account')}</h3>
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.membership')}</p>
            <div className="mt-1"><MembershipBadge member={member} membershipMap={membershipMap} /></div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.verification')}</p>
            <div className="mt-1"><VerificationBadge member={member} /></div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.trust_score')}</p>
            <p className="text-sm font-semibold mt-0.5"><TrustCell member={member} /> / 100</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('admin.profile_completion')}</p>
            <p className="text-sm font-semibold mt-0.5">{completion}%</p>
          </div>
          <Field label="Last Active" value={formatRelative(member.updated_date)} />
          <Field label="Device Count" value="—" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.online_status')}</p>
            <div className="flex items-center gap-1.5 mt-0.5"><OnlineDot member={member} /><span className="text-sm">{t('mission.approx')}</span></div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('admin.account_status')}</p>
            <div className="mt-1"><StatusBadge status={member.admin_status} /></div>
          </div>
        </div>

        {/* Membership Override (Founder only — gated server-side) */}
        <MembershipOverrideSection member={member} />

        {/* Community */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.community')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatBox icon={Heart} label="Connections" value={stats?.connections ?? '—'} />
          <StatBox icon={Users} label="Circles Joined" value={stats?.circlesJoined ?? '—'} />
          <StatBox icon={Calendar} label="Experiences Joined" value={stats?.experiencesJoined ?? '—'} />
          <StatBox icon={Crown} label="Experiences Hosted" value={stats?.experiencesHosted ?? '—'} />
          <StatBox icon={Shield} label="Circles Hosted" value={stats?.circlesHosted ?? '—'} />
          <StatBox icon={Flag} label="Reports Received" value={stats?.reportsReceived ?? '—'} />
          <StatBox icon={AlertTriangle} label="Warnings Issued" value={stats?.warningsIssued ?? '—'} />
        </div>

        {/* Activity */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.activity')}</h3>
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4">
          <Field label="Recent Login" value="Not tracked" />
          <Field label="Recent Profile Updates" value={formatRelative(member.updated_date)} />
          <Field label="Recent Connections" value="—" />
          <Field label="Recent Reports" value="—" />
          <Field label="Recent Moderation Actions" value="—" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <Activity className="w-3 h-3" /> {t('mission.permember_activity_history_will_be')}
        </p>

        {/* History */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.history')}</h3>
        <MCMemberHistory member={member} />

        {/* Notes */}
        <div className="mt-5">
          <MCMemberNotes member={member} />
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between gap-2 pb-6">
          <span className="text-xs text-muted-foreground">{t('mission.more_actions')}</span>
          <MCMemberActionsMenu member={member} tier={tier} onAction={onAction} showDevHardDelete={showDevHardDelete} />
        </div>
      </SheetContent>
    </Sheet>
  );
}