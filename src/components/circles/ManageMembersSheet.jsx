import React, { useState } from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Crown, Search, Ban, UserMinus, Check, X, UserPlus } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const REASONS = ['Spam', 'Abuse', 'Inappropriate Behaviour', 'Requested Removal', 'Circle Rule Violation', 'Other'];

export default function ManageMembersSheet({ open, onOpenChange, members, pending, banned, onApprove, onReject, onRemove, onBan, onUnban, onInvite }) {
  const { t } = useLocalization();
  const [tab, setTab] = useState('members');
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState(null);
  const [reason, setReason] = useState(REASONS[0]);

  const tabs = [
    { id: 'members', label: `Members (${members.length})` },
    { id: 'requests', label: `Requests (${pending.length})` },
    { id: 'banned', label: `Removed & Banned (${banned.length})` },
  ];

  const list = tab === 'members' ? members : tab === 'requests' ? pending : banned;
  const filtered = list.filter((m) => (m.member_name || '').toLowerCase().includes(query.toLowerCase()));

  const confirmRemove = () => {
    if (!removing) return;
    if (removing.action === 'ban') onBan?.(removing.id, reason);
    else onRemove?.(removing.id, reason);
    setRemoving(null);
    setReason(REASONS[0]);
  };

  const Row = ({ m }) => {
    const isOrg = m.role === 'organizer';
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
          <p className="text-xs text-muted-foreground">{m.joined_date ? `Joined ${m.joined_date}` : (m.ban_reason ? `Reason: ${m.ban_reason}` : '—')}</p>
        </div>
        {!isOrg && tab === 'members' && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRemoving({ id: m.id, name: m.member_name, action: 'remove' })}><UserMinus className="w-4 h-4 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRemoving({ id: m.id, name: m.member_name, action: 'ban' })}><Ban className="w-4 h-4 text-destructive" /></Button>
          </div>
        )}
        {tab === 'requests' && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onApprove?.(m.id)}><Check className="w-4 h-4 text-success" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReject?.(m.id)}><X className="w-4 h-4 text-destructive" /></Button>
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
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={onInvite}><UserPlus className="w-4 h-4" />{t('community.members.invite')}</Button>

        <div className="flex gap-1.5">
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