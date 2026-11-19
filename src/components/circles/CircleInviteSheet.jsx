import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Check, Send, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/AuthContext';
import { sendCircleInvitations } from '@/api/supabaseClient';
import { useConnections } from '@/lib/connections-store';
import { useLocalization } from '@/lib/i18n/useLocalization';

function palFromConnection(c) {
  return {
    id: c.id,
    user_id: c.pal_user_id,
    name: c.pal_name,
    avatar: c.pal_avatar,
    interests: c.mutual_interests || [],
  };
}

export default function CircleInviteSheet({ circle, open, onOpenChange }) {
  const { t } = useLocalization();
  const { user } = useAuth();
  const conn = useConnections(user);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState('Join my circle — we’d love to have you.');
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(false);

  const pals = useMemo(() => (conn.connections || []).map(palFromConnection), [conn.connections]);
  const filtered = pals.filter((p) => (p.name || '').toLowerCase().includes(search.toLowerCase()));
  const selectedPals = pals.filter((p) => selected.has(p.id));

  useEffect(() => {
    if (!open) { setSearch(''); setSelected(new Set()); setMessage('Join my circle — we’d love to have you.'); setSent(false); }
  }, [open]);

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSend = async () => {
    if (inFlight.current || selectedPals.length === 0) return;
    inFlight.current = true; setSendError('');
    if (selectedPals.length === 0) return;
    setSending(true);
    try {
      const recipientIds = selectedPals.map((pal) => pal.user_id).filter(Boolean);
      const rows = await sendCircleInvitations(circle?.id, recipientIds, message.trim());
      if (!Array.isArray(rows) || rows.length !== new Set(recipientIds).size) throw new Error('Not all invitations were sent.');
      setSent(true);

    } catch {
      setSendError('Invitation could not be sent. Please try again when you’re ready.');
    } finally {
      inFlight.current = false; setSending(false);
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={sent ? '' : 'Invite Your Pals'} description={sent ? '' : `Invite connected pals to "${circle?.name || ''}"`}>
      <div className="pb-2">
        {sendError && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{sendError}</p>}
        {sent ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-success" />
            </div>
            <Button variant="outline" className="mb-3" onClick={() => onOpenChange(false)}>Done</Button><p className="font-semibold text-base">{t('circles.invite.sent_title')}</p>
            <p className="text-sm text-muted-foreground mt-1">{selectedPals.length} pal{selectedPals.length > 1 ? 's' : ''} invited to {circle?.name}.</p>
          </div>
        ) : conn.loading ? <p role="status" className="py-6 text-sm">Loading connected Pals…</p> : conn.error ? <p role="alert" className="py-6 text-sm">Connected Pals couldn’t load. Close this sheet and reopen it when you’re ready.</p> : pals.length === 0 ? (
          <div className="text-center py-10">
            <UserPlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">{t('circles.invite.no_pals_title')}</p>
            <p className="text-xs text-muted-foreground mb-4">{t('circles.invite.connect_first')}</p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{t('discovery.why.aria.close')}</Button>
          </div>
        ) : (
          <>
            <div className="relative mb-3">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('circles.invite.search_placeholder')}
                className="w-full h-10 ps-10 pe-4 text-sm rounded-xl bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default"
              />
            </div>
            <div className="max-h-[34vh] overflow-y-auto no-scrollbar space-y-1.5">
              {filtered.map((pal) => {
                const on = selected.has(pal.id);
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => toggle(pal.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-start transition-default ${on ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={pal.avatar} alt={pal.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{(pal.name || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pal.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{(pal.interests || []).slice(0, 2).join(' · ') || 'Connected pal'}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${on ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                      {on && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              rows={3}
              placeholder={t('circles.invite.note_placeholder')}
              className="w-full mt-3 p-3 text-sm rounded-xl bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default resize-none"
            />
            <p className="text-xs text-muted-foreground text-end mt-1">{message.length}/200</p>
            <Button className="w-full mt-3 gap-2" disabled={selectedPals.length === 0 || sending} onClick={handleSend}>
              {sending ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Send Invitation {selectedPals.length > 0 && `(${selectedPals.length})`}
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}