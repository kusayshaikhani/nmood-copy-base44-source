import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Loader2, Check, X, AlertCircle, Eye, WifiOff, Trash2 } from 'lucide-react';
import { fetchPhotoVerifications, reviewPhotoVerification, getVerificationSelfieUrl, deleteVerificationSelfie } from '@/api/adminData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

// Mission Control photo-verification review queue (admin / founder only).
//
// Reads pending submissions from Supabase via `admin_list_photo_verifications`
// and records the decision via `admin_review_photo_verification`, which flips
// members.identity_verified in the same transaction so the member's Trust &
// Verification screen reflects the outcome immediately. Both RPCs re-check the
// caller's role server-side, so a non-admin gets "Not authorised" even if they
// reach this component.

const PROMPT_LABELS = {
  hand_on_heart: 'Hand on heart',
  peace_sign: 'Peace sign',
  two_fingers_to_temple: 'Two fingers to temple',
  wave: 'Wave',
};

export default function PhotoVerificationQueue() {
  const { t } = useLocalization();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchPhotoVerifications({ status: 'pending' }));
    } catch (e) {
      setItems([]);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openDetail = (item) => {
    setSelected(item);
    setReason('');
    setConfirmingDelete(false);
  };

  const review = async (decision) => {
    if (!selected) return;
    setActing(true);
    try {
      await reviewPhotoVerification(selected.id, decision, reason);
      toast({
        title: decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Resubmission requested',
        description: decision === 'approved'
          ? `${selected.member_name || 'This member'} is now photo verified.`
          : `${selected.member_name || 'This member'} is no longer marked as photo verified.`,
      });
      setSelected(null);
      await refresh();
    } catch (e) {
      toast({ title: 'Action failed', description: e?.message });
    } finally {
      setActing(false);
    }
  };

  // Deletes only the private storage object + clears its reference. Never
  // touches members.identity_verified — a member approved earlier stays
  // approved even after their evidence is removed.
  const confirmDeleteSelfie = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteVerificationSelfie(selected.id);
      toast({ title: 'Selfie deleted', description: 'The private verification selfie was removed. Verification status is unchanged.' });
      setSelected((prev) => (prev ? { ...prev, selfie_file_uri: null } : prev));
      setConfirmingDelete(false);
    } catch (e) {
      toast({ title: 'Delete failed', description: e?.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          {t('mission.photo_verification_queue') || 'Photo Verification Queue'}
          {!loading && !error && items.length > 0 && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">{items.length}</span>
          )}
        </h3>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-2" role="alert">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <WifiOff className="w-4 h-4 shrink-0" /> Data connection failed
          </p>
          <p className="text-xs text-destructive/90">{error.message}</p>
          <Button variant="outline" size="sm" onClick={refresh}>Try again</Button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {t('mission.no_photo_verifications') || 'No pending photo verifications.'}
        </div>
      )}

      <div className="grid gap-2">
        {items.map((it) => (
          <button key={it.id} onClick={() => openDetail(it)} type="button"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-start hover:bg-muted/40 transition-default">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{it.member_name || 'Unknown member'}</p>
              <p className="text-xs text-muted-foreground">
                {PROMPT_LABELS[it.prompt] || it.prompt || 'Selfie'}
                {it.submitted_at ? ` · ${new Date(it.submitted_at).toLocaleString()}` : ''}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-primary shrink-0"><Eye className="w-3.5 h-3.5" /> Review</span>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('mission.photo_review') || 'Review photo verification'}</DialogTitle>
            <DialogDescription>{selected?.member_name || ''}</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <PhotoFrame label="Submitted selfie" path={selected.selfie_file_uri} />
                <PhotoFrame
                  label={`Pose: ${PROMPT_LABELS[selected.prompt] || selected.prompt || '—'}`}
                  path={selected.pose_file_uri || selected.member_photo_url}
                />
              </div>

              <div>
                <Label className="mb-1.5 block">{t('mission.photo_reason') || 'Reason (shown to the member for reject / resubmission)'}</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional for approve; recommended for reject / resubmission" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button className="bg-success text-success-foreground hover:bg-success/90" disabled={acting} onClick={() => review('approved')}>
                  <Check className="w-4 h-4 mr-1.5" /> Approve
                </Button>
                <Button variant="outline" disabled={acting} onClick={() => review('needs_resubmission')}>
                  <AlertCircle className="w-4 h-4 mr-1.5" /> Resubmit
                </Button>
                <Button variant="destructive" disabled={acting} onClick={() => review('rejected')}>
                  <X className="w-4 h-4 mr-1.5" /> Reject
                </Button>
              </div>

              <div className="pt-2 border-t border-border">
                {!confirmingDelete ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive"
                    disabled={!selected.selfie_file_uri || deleting}
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete verification selfie
                  </Button>
                ) : (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2" role="alertdialog">
                    <p className="text-xs text-destructive">
                      This permanently deletes the private selfie file and clears its reference. The member's verified status is not affected. This cannot be undone.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" disabled={deleting} onClick={() => setConfirmingDelete(false)}>Cancel</Button>
                      <Button variant="destructive" size="sm" disabled={deleting} onClick={confirmDeleteSelfie}>
                        {deleting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                        Confirm delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhotoFrame({ label, path }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setUrl(null);
    if (!path) { setLoading(false); return undefined; }
    getVerificationSelfieUrl(path).then((signed) => {
      if (active) { setUrl(signed); setLoading(false); }
    });
    return () => { active = false; };
  }, [path]);

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="aspect-square rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
        {loading ? (
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        ) : url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground text-center px-2">No photo provided</span>
        )}
      </div>
    </div>
  );
}
