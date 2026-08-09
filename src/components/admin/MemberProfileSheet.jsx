import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { BadgeCheck, MapPin, Calendar, Heart, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const PROFILE_CHECKS = [
  { key: 'display_name', min: 1 },
  { key: 'date_of_birth', min: 1 },
  { key: 'gender', min: 1 },
  { key: 'country', min: 1 },
  { key: 'city', min: 1 },
  { key: 'languages', min: 1, array: true },
  { key: 'interests', min: 3, array: true },
  { key: 'bio', min: 1 },
  { key: 'photo_url', min: 1 },
  { key: 'lifestyle', min: 1 },
];

function completeness(member) {
  if (!member) return 0;
  let filled = 0;
  for (const c of PROFILE_CHECKS) {
    const val = member[c.key];
    const len = Array.isArray(val) ? val.length : val ? String(val).trim().length : 0;
    if (len >= c.min) filled++;
  }
  return Math.round((filled / PROFILE_CHECKS.length) * 100);
}

export default function MemberProfileSheet({ member, open, onOpenChange }) {
  const { t } = useLocalization();
  const [activity, setActivity] = useState([]);
  const [loadingAct, setLoadingAct] = useState(false);

  useEffect(() => {
    if (!member?.created_by_id) return;
    let active = true;
    setLoadingAct(true);
    base44.entities.Experience.filter({ host_user_id: member.created_by_id }, '-created_date', 5)
      .then((items) => { if (active) setActivity(items || []); })
      .catch(() => { if (active) setActivity([]); })
      .finally(() => { if (active) setLoadingAct(false); });
    return () => { active = false; };
  }, [member?.created_by_id]);

  if (!member) return null;
  const pct = completeness(member);
  const initials = (member.display_name || member.first_name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('admin.member_profile')}>
      <div className="space-y-4 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14">
            {member.photo_url ? <AvatarImage src={member.photo_url} /> : null}
            <AvatarFallback className="bg-muted text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold truncate">{member.display_name || member.first_name}</p>
              {member.phone_verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            {member.city || member.country ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {[member.city, member.country].filter(Boolean).join(', ')}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/30 p-2.5 text-center">
            <p className="text-lg font-bold">{pct}%</p>
            <p className="text-[10px] text-muted-foreground">{t('admin.profile_completion')}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2.5 text-center">
            <p className="text-lg font-bold flex items-center justify-center gap-1">
              {member.phone_verified ? <CheckCircle2 className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-muted-foreground" />}
            </p>
            <p className="text-[10px] text-muted-foreground">{member.phone_verified ? 'Verified' : 'Unverified'}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2.5 text-center">
            <p className="text-lg font-bold capitalize">{member.admin_status || 'active'}</p>
            <p className="text-[10px] text-muted-foreground">{t('admin.account_status')}</p>
          </div>
        </div>

        {member.bio && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.bio')}</p>
            <p className="text-sm">{member.bio}</p>
          </div>
        )}

        {member.interests?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><Heart className="w-3 h-3" /> {t('admin.interests')}</p>
            <div className="flex flex-wrap gap-1.5">
              {member.interests.map((i) => <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>)}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('admin.recent_activity_hosted')}</p>
          {loadingAct ? (
            <p className="text-sm text-muted-foreground">{t('mission.loading')}</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.no_experiences_hosted')}</p>
          ) : (
            <div className="space-y-1.5">
              {activity.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium truncate">{e.title}</span>
                  <Badge variant="secondary" className="text-xs">{e.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground pt-1">Joined {member.created_date ? new Date(member.created_date).toLocaleDateString() : '—'}</p>
      </div>
    </BottomSheet>
  );
}