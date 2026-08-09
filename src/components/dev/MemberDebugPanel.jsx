import React, { useEffect, useState } from 'react';
import { Bug, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getOwnMember } from '@/lib/member-profile';
import { resolveMemberName, resolveMemberInitials } from '@/lib/member-display';
import { getProfileCompleteness, COMPLETENESS_CHECKS, isCheckFilled } from '@/lib/profile-completeness';

/**
 * TEMPORARY dev-only debug panel. Surfaces the Member record the current
 * user is mapped to, the fields used for the displayed name, and the profile
 * completion state — so we can confirm the app reads the correct record.
 *
 * Hidden in normal use; only renders when the URL contains `?debug=1`.
 * Safe to delete once verification is complete.
 */
export default function MemberDebugPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [member, setMember] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const { base44 } = await import('@/api/base44Client');
      const list = await base44.entities.Member.filter({ created_by_id: user.id });
      setAllMembers(list || []);
      setMember(await getOwnMember(user.id, user.email));
    } catch (err) {
      setError(err?.message || 'Failed to load member');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const completeness = getProfileCompleteness(member, user);
  const resolvedName = resolveMemberName(member, user);
  const resolvedInitials = resolveMemberInitials(member, user);

  return (
    <div className="fixed bottom-20 start-3 z-[60] w-[min(92vw,420px)] rounded-2xl border border-amber-400/50 bg-popover/95 shadow-elevated backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-amber-600">
          <Bug className="h-3.5 w-3.5" />
          Member Debug
          {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="max-h-[60vh] overflow-y-auto border-t border-border/60 px-3.5 py-3 text-[11px] leading-relaxed">
          {error && <p className="mb-2 font-medium text-destructive">Error: {error}</p>}

          {/* Auth user */}
          <Section title="Auth user">
            <Row k="user.id" v={user?.id} />
            <Row k="user.email" v={user?.email} />
            <Row k="user.full_name" v={user?.full_name} />
            <Row k="user.role" v={user?.role} />
          </Section>

          {/* Resolved Member record */}
          <Section title="Resolved Member record (getOwnMember)">
            {member ? (
              <>
                <Row k="member.id" v={member.id} />
                <Row k="created_by_id" v={member.created_by_id} />
                <Row k="email" v={member.email} />
                <Row k="onboarding_completed" v={String(member.onboarding_completed)} />
                <Row k="created_date" v={member.created_date} />
                <Row k="admin_status" v={member.admin_status} />
                <Row k="account_state" v={member.account_state} />
              </>
            ) : (
              <p className="text-muted-foreground">No member resolved.</p>
            )}
          </Section>

          {/* Disambiguation: all candidate records */}
          <Section title={`Candidate records (${allMembers.length})`}>
            {allMembers.length === 0 ? (
              <p className="text-muted-foreground">None — no Member records share this user id.</p>
            ) : (
              <ul className="space-y-1">
                {allMembers.map((m) => {
                  const isPicked = member && m.id === member.id;
                  return (
                    <li key={m.id} className={`rounded-md px-1.5 py-1 ${isPicked ? 'bg-amber-100/60 dark:bg-amber-500/10' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        {isPicked && <span className="text-amber-600">●</span>}
                        <span className="truncate font-mono">{m.id}</span>
                      </div>
                      <div className="ps-3.5 text-muted-foreground">
                        {m.email || '—'} · onboarded:{String(m.onboarding_completed)} · {m.display_name || '—'}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* Displayed name resolution */}
          <Section title="Displayed name (resolveMemberName)">
            <Row k="display_name" v={member?.display_name} />
            <Row k="first_name" v={member?.first_name} />
            <Row k="last_name" v={member?.last_name} />
            <Row k="user.full_name" v={user?.full_name} />
            <Row k="→ resolved name" v={resolvedName} highlight />
            <Row k="→ resolved initials" v={resolvedInitials} highlight />
          </Section>

          {/* Profile completion state */}
          <Section title="Profile completion (getProfileCompleteness)">
            <Row k="pct" v={`${completeness.pct}%`} highlight />
            <Row k="filled / total" v={`${completeness.filled} / ${completeness.total}`} />
            <div className="mt-1.5">
              <p className="mb-1 font-medium text-foreground">Checks ({COMPLETENESS_CHECKS.length}):</p>
              <ul className="space-y-0.5">
                {COMPLETENESS_CHECKS.map((c) => {
                  const ok = member ? isCheckFilled(member, c, user) : false;
                  return (
                    <li key={c.key} className="flex items-center gap-1.5">
                      <span className={ok ? 'text-success' : 'text-destructive'}>{ok ? '✓' : '✗'}</span>
                      <span className="font-mono">{c.key}</span>
                      {c.array && <span className="text-muted-foreground">(array ≥{c.min})</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
            {completeness.missing.length > 0 && (
              <div className="mt-1.5">
                <p className="mb-0.5 font-medium text-destructive">Missing:</p>
                <p className="font-mono text-muted-foreground">{completeness.missing.map((m) => m.key).join(', ')}</p>
              </div>
            )}
          </Section>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-2.5">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({ k, v, highlight }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-32 shrink-0 font-mono text-muted-foreground">{k}</span>
      <span className={`min-w-0 break-words font-mono ${highlight ? 'font-semibold text-amber-600' : 'text-foreground'}`}>
        {v === undefined || v === null || v === '' ? <em className="text-muted-foreground/60">—</em> : String(v)}
      </span>
    </div>
  );
}