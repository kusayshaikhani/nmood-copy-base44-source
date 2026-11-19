import React, { useEffect, useState } from 'react';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { complimentaryExpiry } from '@/lib/complimentary-premium';

export default function ComplimentaryPremium({ member, onClose }) {
  const previewOnly = import.meta.env.VITE_COMPLIMENTARY_PREMIUM_UI_ONLY === 'true';
  const [status, setStatus] = useState(null);
  const [duration, setDuration] = useState('30');
  const [custom, setCustom] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (previewOnly) { setBusy(false); return undefined; }
    let current = true;
    callSupabaseRpc('nmood_admin_complimentary_premium', { p_member_id: member.id })
      .then(data => { if(data?.operation_error)throw Error('Could not load complimentary access.');if (current) setStatus(data); })
      .catch(() => { if (current) setError('Could not load complimentary access. Close and try again.'); })
      .finally(() => { if (current) setBusy(false); });
    return () => { current = false; };
  }, [member.id, previewOnly]);
  async function update(action) {
    if (previewOnly) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (!reason.trim() || reason.length > 500) throw Error('Enter a reason (up to 500 characters).');
      const expires = action === 'grant' ? complimentaryExpiry(duration, custom) : null;
      const data = await callSupabaseRpc('nmood_admin_complimentary_premium', {
        p_member_id: member.id, p_action: action, p_expires_at: expires, p_reason: reason.trim(),
      });
      if(data?.operation_error)throw Error('Complimentary access was not changed. Check administrator access, the member status and the requested expiry.');
      setStatus(data); setReason('');
      setNotice(action === 'grant' ? 'Complimentary Premium granted.' : 'Complimentary Premium revoked. Paid subscriptions are unchanged.');
      window.dispatchEvent(new Event('nmood:refresh'));
    } catch (e) {
      setError(e?.message || 'Could not update complimentary access. Please try again.');
    } finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="w-[calc(100%_-_2rem)] max-w-lg max-h-[85dvh] overflow-y-auto">
      <DialogTitle>Complimentary Premium</DialogTitle>
      <DialogDescription>{member.display_name || member.full_name || member.email || member.id}. This changes app access only, never a store subscription or billing.</DialogDescription>
      {previewOnly && <p role="status">Internal testing: Complimentary Premium is UI-only. The backend is not activated; grants and revocations are unavailable.</p>}
      {busy && <p role="status">Checking complimentary access…</p>}
      {status && <p role="status">{status.active ? `Active until ${new Date(status.expires_at).toLocaleString()}` : 'No active complimentary grant.'}</p>}
      <label className="grid gap-1">Duration<select className="border rounded-lg bg-background p-3" value={duration} onChange={e => setDuration(e.target.value)} disabled={busy}>
        <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="year">1 year</option><option value="custom">Custom end date</option>
      </select></label>
      {duration === 'custom' && <label className="grid gap-1">End date and time (your local time)<input className="border rounded-lg bg-background p-3" type="datetime-local" value={custom} onChange={e => setCustom(e.target.value)} disabled={busy}/></label>}
      <label className="grid gap-1">Audit reason<textarea className="border rounded-lg bg-background p-3" maxLength={500} value={reason} onChange={e => setReason(e.target.value)} disabled={busy}/></label>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || !status || !reason.trim()} onClick={() => update('grant')}>{status?.active ? 'Replace grant' : 'Grant Premium'}</Button>
        {status?.active && <Button variant="destructive" disabled={busy || !reason.trim()} onClick={() => update('revoke')}>Revoke complimentary grant</Button>}
        <Button variant="outline" disabled={busy} onClick={onClose}>Close</Button>
      </div>
      {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
      {status?.history?.length > 0 && <details><summary>Grant audit history</summary><ul className="space-y-3 mt-2">{status.history.map((event, i) => {
        let detail; try { detail = JSON.parse(event.outcome); } catch { detail = {}; }
        return <li key={i} className="text-sm break-words">{detail.action} · {new Date(event.created_at).toLocaleString()}<br/>Admin: {event.actor}<br/>Recipient: {event.target}<br/>Reason: {event.reason}<br/>Expiry: {new Date(detail.expires_at).toLocaleString()}</li>;
      })}</ul></details>}
    </DialogContent>
  </Dialog>;
}
