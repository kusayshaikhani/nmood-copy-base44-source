import DeletionConfirmation from './DeletionConfirmation';
import { saveDeletionReceipt } from '@/lib/deletion-receipt';
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';
import { getSelfDeletionMethods, deleteOwnAccount } from '@/lib/self-account-deletion';

export default function DeleteAccountSheet({ open, onOpenChange }) {
  const { user, logout } = useAuth();
  const [methods, setMethods] = useState([]);
  const [provider, setProvider] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(null);
  const inFlight = useRef(false);
  const committed = useRef(false);
  useEffect(() => {
    if (committed.current && open) return;
    committed.current = false;
    let active = true;
    setPassword(''); setConfirmation(''); setMethods([]); setProvider(''); setError(''); setAccepted(null);
    if (open) {
      setLoading(true);
      getSelfDeletionMethods(user?.id).then(values => {
        if (active) { setMethods(values); setProvider(values[0]); }
      }).catch(() => {
        if (active) setError('Account deletion is temporarily unavailable. Nothing has been deleted. Please contact Support.');
      }).finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [open, user?.id]);
  const submit = async () => {
    if (inFlight.current || loading || !methods.includes(provider) || confirmation !== 'DELETE' || (provider === 'password' && !password)) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const result = await deleteOwnAccount({ expectedId: user?.id, provider, password, confirmation });
      committed.current = true;
      setAccepted(saveDeletionReceipt(result));
      // A committed deletion must never be misreported as a failed deletion if
      // session revocation is temporarily unavailable. logout clears local state.
      try { await logout(true, '/deletion-status'); } catch { setError('Deletion was accepted. Close the app to finish signing out on this device.'); }
    } catch (failure) { setError(failure.message); }
    finally { setPassword(''); inFlight.current = false; setBusy(false); }
  };
  return <Sheet open={open} onOpenChange={value => { if (!inFlight.current) onOpenChange(value); }}>
    <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-lg space-y-4">
        <SheetTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-destructive" /> Delete your account</SheetTitle>
        <SheetDescription>Confirming permanently deletes your account and associated personal data and media. There is no recovery period. Verify your identity to continue.</SheetDescription>
        {accepted ? <DeletionConfirmation state={accepted}/> : <>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Permanent deletion, including invalidation of hosted media links, can take up to 60 seconds after server erasure. Copies already downloaded or stored in a browser cache cannot be recalled. If a service fails, deletion remains in progress while we retry.</li>
            <li>Your account access is blocked immediately and you will be signed out. Permanent erasure starts now and cannot be cancelled or recovered.</li>
            <li>Personal data and media are erased from active systems without a recovery delay. If a provider fails, the account stays locked while cleanup is retried. Security logs may be retained for 12 months, Support records for 24 months, and necessary safety and consent records for up to 36 months. Payment records follow legal and store requirements; backups expire within 90 days after final deletion.</li>
            <li>Deleting Nmood does not cancel an Apple or Google subscription. Cancel it in your store’s subscription settings to avoid further charges.</li>
          </ul>
          {loading && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Checking deletion availability</p>}
          {methods.length > 1 && <div className="space-y-2"><Label htmlFor="deletion-provider">Verify using</Label><select id="deletion-provider" value={provider} disabled={busy} onChange={e => { setProvider(e.target.value); setPassword(''); }} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">{methods.map(value => <option key={value} value={value}>{value === 'password' ? 'Password' : value === 'apple' ? 'Apple' : 'Google'}</option>)}</select></div>}
          {provider === 'password' && <div className="space-y-2"><Label htmlFor="deletion-password">Current password</Label><Input id="deletion-password" type="password" autoComplete="current-password" value={password} disabled={busy} onChange={e => setPassword(e.target.value)} /></div>}
          {['apple', 'google'].includes(provider) && <p className="text-sm">You will verify your identity with {provider === 'apple' ? 'Apple' : 'Google'} before deletion. Choose the account linked to Nmood.</p>}
          {!!methods.length && <div className="space-y-2"><Label htmlFor="deletion-confirmation">Type DELETE to confirm</Label><Input id="deletion-confirmation" value={confirmation} disabled={busy} onChange={e => setConfirmation(e.target.value)} autoComplete="off" /></div>}
          <div className="flex flex-col gap-2">
            <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Keep my account</Button>
            <Button variant="destructive" onClick={submit} disabled={busy || loading || !methods.includes(provider) || confirmation !== 'DELETE' || (provider === 'password' && !password)}>{busy ? 'Verifying and deleting…' : 'Permanently delete account'}</Button>
          </div>
        </>}
        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </div>
    </SheetContent>
  </Sheet>;
}
