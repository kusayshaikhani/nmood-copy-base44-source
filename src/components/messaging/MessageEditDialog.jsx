import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
export default function MessageEditDialog({ message, onSave, onClose }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setText(typeof message?.content === 'string' ? message.content : ''); setError(''); }, [message]);
  return <Dialog open={!!message} onOpenChange={open => !open && !busy && onClose()}><DialogContent>
    <DialogTitle>Edit message</DialogTitle>
    <textarea aria-label="Message text" maxLength={4000} value={text} disabled={busy} onChange={e => setText(e.target.value)} />
    {error && <p role="alert">{error}</p>}
    <button disabled={busy || !text.trim()} onClick={async () => {
      setBusy(true); setError('');
      try { await onSave(text); onClose(); } catch { setError('Message could not be edited.'); } finally { setBusy(false); }
    }}>Save edit</button>
    <button disabled={busy} onClick={onClose}>Cancel</button>
  </DialogContent></Dialog>;
}
