import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, BadgeCheck, Crown, ChevronRight } from 'lucide-react';
import PremiumGlassCard from './PremiumGlassCard';
import { formatRelative } from '@/lib/command-center-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Avatar({ member }) {
  const initials = (member.display_name || '?').slice(0, 1).toUpperCase();
  if (member.photo_url) {
    return <img src={member.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

function StatusDot({ status }) {
  const map = { active: 'bg-success', suspended: 'bg-warning', banned: 'bg-destructive', deactivated: 'bg-muted-foreground/40', deleted: 'bg-muted-foreground/40' };
  return <span className={`w-2 h-2 rounded-full ${map[status] || 'bg-muted-foreground/40'}`} />;
}

export default function MemberExplorer({ members, memberships, loading }) {
  const { t } = useLocalization();
  const [q, setQ] = useState('');

  const premiumMap = useMemo(() => {
    const m = new Map();
    (memberships || []).forEach((mem) => { if (mem.type === 'premium' && mem.status === 'active') m.set(mem.user_id, true); });
    return m;
  }, [memberships]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? members.filter((m) => (m.display_name || '').toLowerCase().includes(term) || (m.email || '').toLowerCase().includes(term))
      : members;
    return list.slice(0, 8);
  }, [members, q]);

  return (
    <PremiumGlassCard
      icon={Users}
      title={t('mission.member_explorer')}
      action={<Link to="/mission-control/members" className="text-xs text-primary hover:underline">{t('mission.member_view_all')}</Link>}
    >
      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('mission.member_search_placeholder')}
          className="w-full rounded-input border border-border/60 bg-card/60 ps-9 pe-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-default"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 shimmer rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t('mission.no_platform_activity_recorded_yet')}</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((m) => (
            <Link
              key={m.id}
              to="/mission-control/members"
              className="flex items-center gap-3 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/40 px-3 py-2.5 transition-default"
            >
              <Avatar member={m} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold truncate">{m.display_name || '—'}</p>
                  {m.phone_verified && <BadgeCheck className="w-3.5 h-3.5 text-info flex-shrink-0" />}
                  {premiumMap.has(m.id) && <Crown className="w-3.5 h-3.5 text-warning flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{m.email || '—'}</p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                  <StatusDot status={m.admin_status} /> {m.admin_status || 'active'}
                </span>
                <span className="text-[10px] text-muted-foreground/70">{t('mission.member_last_active')} {formatRelative(m.updated_date)}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </PremiumGlassCard>
  );
}