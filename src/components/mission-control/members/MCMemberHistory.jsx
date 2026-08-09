import React, { useEffect, useState } from 'react';
import {
  Crown, Shield, Flag, Calendar, Users, Activity, RefreshCw, Clock,
} from 'lucide-react';
import { memberHistory } from '@/lib/admin-actions';
import { formatDate, formatRelative } from '@/lib/member-directory';

// PB-002 — Member History: full timeline of a member's account.
// Shows join date, membership history, account actions (suspensions/bans),
// reports, experiences hosted, and circles created.

function HistoryItem({ icon: Icon, title, subtitle, date }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {date && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {date}
        </span>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
        {count > 0 && (
          <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <div className="divide-y divide-border/50">
        {children}
      </div>
    </div>
  );
}

function EmptySection({ icon: Icon, title }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      </div>
      <p className="text-xs text-muted-foreground py-2 text-center">No records</p>
    </div>
  );
}

function parseAuditValues(str) {
  if (!str || str === 'none') return null;
  try { return JSON.parse(str); } catch { return null; }
}

function auditTitle(log) {
  const action = log.action || '';
  if (action.startsWith('membership_override_set_premium')) return 'Premium Granted';
  if (action.startsWith('membership_override_set_explorer')) return 'Premium Revoked';
  if (action.startsWith('membership.')) return 'Membership Changed';
  if (action === 'member.update') {
    const prev = parseAuditValues(log.previous_value);
    const next = parseAuditValues(log.new_value);
    if (prev?.admin_status && next?.admin_status) {
      const labels = { suspended: 'Suspended', banned: 'Banned', active: 'Reactivated', deactivated: 'Deactivated' };
      return labels[next.admin_status] || 'Status Changed';
    }
    return 'Profile Updated';
  }
  if (action.startsWith('memberNote')) return 'Note Added';
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MCMemberHistory({ member }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member?.id) return;
    let active = true;
    setLoading(true);
    memberHistory(member.id, member.created_by_id)
      .then((res) => {
        if (!active) return;
        const body = res?.data || res || {};
        setData(body);
      })
      .catch(() => { if (active) setData({}); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [member?.id, member?.created_by_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const auditLogs = data.auditLogs || [];
  const reports = data.reports || [];
  const experiences = data.experiences || [];
  const circles = data.circles || [];

  const membershipLogs = auditLogs.filter((l) => l.action?.startsWith('membership'));
  const accountLogs = auditLogs.filter((l) =>
    l.action === 'member.update' || l.action?.startsWith('memberNote')
  );

  return (
    <div className="space-y-3">
      {/* Join Date */}
      <div className="rounded-xl border bg-card p-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Clock className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Joined {formatDate(member.created_date)}</p>
          <p className="text-xs text-muted-foreground">{formatRelative(member.created_date)}</p>
        </div>
      </div>

      {/* Membership History */}
      {membershipLogs.length > 0 ? (
        <Section icon={Crown} title="Membership History" count={membershipLogs.length}>
          {membershipLogs.slice(0, 15).map((log) => {
            const next = parseAuditValues(log.new_value);
            return (
              <HistoryItem
                key={log.id}
                icon={Crown}
                title={auditTitle(log)}
                subtitle={next?.expires_at ? `Expires ${formatDate(next.expires_at)}` : next?.type === 'premium' ? 'Lifetime' : 'Reverted to Explorer'}
                date={formatRelative(log.created_date)}
              />
            );
          })}
        </Section>
      ) : (
        <EmptySection icon={Crown} title="Membership History" />
      )}

      {/* Account Actions (Suspensions / Bans) */}
      {accountLogs.length > 0 ? (
        <Section icon={Shield} title="Account Actions" count={accountLogs.length}>
          {accountLogs.slice(0, 15).map((log) => (
            <HistoryItem
              key={log.id}
              icon={Shield}
              title={auditTitle(log)}
              subtitle={log.details?.length > 60 ? log.details.slice(0, 60) + '…' : log.details}
              date={formatRelative(log.created_date)}
            />
          ))}
        </Section>
      ) : (
        <EmptySection icon={Shield} title="Account Actions" />
      )}

      {/* Reports */}
      {reports.length > 0 ? (
        <Section icon={Flag} title="Reports Received" count={reports.length}>
          {reports.slice(0, 10).map((r) => (
            <HistoryItem
              key={r.id}
              icon={Flag}
              title={r.reason || r.category || 'Report'}
              subtitle={r.status || 'open'}
              date={formatRelative(r.created_date)}
            />
          ))}
        </Section>
      ) : (
        <EmptySection icon={Flag} title="Reports Received" />
      )}

      {/* Experiences Hosted */}
      {experiences.length > 0 ? (
        <Section icon={Calendar} title="Experiences Hosted" count={experiences.length}>
          {experiences.slice(0, 10).map((e) => (
            <HistoryItem
              key={e.id}
              icon={Calendar}
              title={e.title || 'Untitled'}
              subtitle={e.status || '—'}
              date={formatDate(e.date || e.created_date)}
            />
          ))}
        </Section>
      ) : (
        <EmptySection icon={Calendar} title="Experiences Hosted" />
      )}

      {/* Circles Created */}
      {circles.length > 0 ? (
        <Section icon={Users} title="Circles Created" count={circles.length}>
          {circles.slice(0, 10).map((c) => (
            <HistoryItem
              key={c.id}
              icon={Users}
              title={c.name || 'Untitled'}
              subtitle={c.category || '—'}
              date={formatRelative(c.created_date)}
            />
          ))}
        </Section>
      ) : (
        <EmptySection icon={Users} title="Circles Created" />
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
        <Activity className="w-3 h-3" /> Last login tracking is not available in this release.
      </p>
    </div>
  );
}