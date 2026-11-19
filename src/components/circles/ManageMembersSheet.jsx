import React, { useState, useRef } from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Crown, Search, Ban, UserMinus, Check, X, UserPlus } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const REASONS = ['Spam', 'Abuse', 'Inappropriate Behaviour', 'Requested Removal', 'Circle Rule Violation', 'Other'];

export default function ManageMembersSheet({ open, onOpenChange, members, pending, banned, declined = [], onApprove, onReject, onRemove, onBan, onUnban, onInvite, onSetAdministrator, ownerId }) {
  const { t } = useLocalization();
  const flight = useRef(false);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const respond = async (id, approve) => {
    if (flight.current) return; flight.current = true; setBusy(true); setActionError('');
    try { await (approve ? onApprove : onReject)?.(id); }
    catch { setActionError('This request could not be updated. Please refresh to check its status.'); }
    finally { flight.current = false; setBusy(false); }
  };
  const [tab, setTab] = useState('members');
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState(null);
  const [reason, setReason] = useState(REASONS[0]);

  const tabs = [
    { id: 'members', label: `Members / Approved (${members.length})` },
    { id: 'requests', label: `Pending (${pending.length})` },
    { id: 'declined', label: `Declined (${declined.length})` },
    { id: 'banned', label: `Removed & Banned (${banned.length})` },
  ];

  const list = tab === 'members' ? members : tab === 'requests' ? pending : tab === 'declined' ? declined : banned;
  const filtered = list.filter((m) => (m.member_name || '').toLowerCase().includes(query.toLowerCase()));

  const confirmRemove = () => {
    if (!removing) return;
    if (removing.action === 'ban') onBan?.(removing.id, reason);
    else onRemove?.(removing.id, reason);
    setRemoving(null);
    setReason(REASONS[0]);
  };

  const Row = ({ m }) => {
    const isOrg = m.member_user_id === ownerId;
    const roleLabel = isOrg ? 'Owner' : m.role === 'administrator' ? 'Circle administrator' : 'Member';
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
        <Avatar className="w-10 h-10">
          <AvatarImage src={m.member_avatar} alt={m.member_name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">{(m.member_name || '?').charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm truncate">{m.member_name}</p>
            {isOrg && <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"><Crown className="w-2.5 h-2.5" /> {t('experiences.host.organizer')}</span>}
          </div>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
          <p className="text-xs text-muted-foreground">{tab === 'declined' ? 'Request declined' : tab === 'requests' ? 'Awaiting approval' : m.joined_date ? `Joined ${new Date(m.joined_date).toLocaleDateString()}` : (m.ban_reason ? `Reason: ${m.ban_reason}` : '—')}</p>
        </div>
        {!isOrg && tab === 'members' && (
          <div className="flex flex-wrap justify-end gap-1">
            {onSetAdministrator && <Button variant="outline" size="sm" disabled={busy} onClick={async()=>{if(flight.current)return; if(!window.confirm(`Change this member to ${m.role === 'administrator' ? 'Member' : 'Circle administrator'}?`))return;flight.current=true;setBusy(true);setActionError('');try{await onSetAdministrator(m.id,m.role!=='administrator');}catch{setActionError('The Circle role could not be changed.');}finally{flight.current=false;setBusy(false);}}}>{m.role==='administrator'?'Make member':'Make administrator'}</Button>}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRemoving({ id: m.id, name: m.member_name, action: 'remove' })}><UserMinus className="w-4 h-4 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRemoving({ id: m.id, name: m.member_name, action: 'ban' })}><Ban className="w-4 h-4 text-destructive" /></Button>
          </div>
        )}
        {tab === 'requests' && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Approve ${m.member_name}`} disabled={busy} onClick={() => respond(m.id, true)}><Check className="w-4 h-4 text-success" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Decline ${m.member_name}`} disabled={busy} onClick={() => respond(m.id, false)}><X className="w-4 h-4 text-destructive" /></Button>
          </div>
        )}
        {tab === 'banned' && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onUnban?.(m.id)}>{t('circles.manage_members.unban')}</Button>
        )}
      </div>
    );
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('circles.manage_members.title')}>
      <div className="space-y-3">
        {actionError && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{actionError}</p>}
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={onInvite}><UserPlus className="w-4 h-4" />{t('community.members.invite')}</Button>

        <div className="grid grid-cols-2 gap-1.5">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setRemoving(null); }}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-default ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('circles.manage_members.search')}
            className="w-full h-9 ps-9 pe-3 rounded-xl bg-muted text-sm focus:bg-card focus:outline-none transition-default" />
        </div>

        {removing ? (
          <div className="space-y-3 p-3 rounded-xl border border-destructive/30 bg-destructive/5">
            <p className="text-sm font-medium">{removing.action === 'ban' ? 'Ban' : 'Remove'} {removing.name}?</p>
            <p className="text-xs text-muted-foreground">Select a reason. They will be notified{removing.action === 'ban' ? ' and cannot rejoin immediately.' : '.'}</p>
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-default ${reason === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{r}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" className="flex-1" onClick={confirmRemove}>{t('circles.manage_members.confirm')}</Button>
              <Button size="sm" variant="outline" onClick={() => setRemoving(null)}>{t('common.cancel')}</Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">{t('circles.manage_members.nothing_here')}</p>
        ) : (
          <div className="space-y-1.5">{filtered.map((m) => <Row key={m.id} m={m} />)}</div>
        )}
      </div>
    </BottomSheet>
  );
}