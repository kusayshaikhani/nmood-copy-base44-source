import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Loader2, Check, X, AlertCircle, Trash2, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

// PV-001 — Mission Control photo-verification review queue (admin/founder only).
// Lists pending submissions, opens a detail sheet with short-lived signed URLs,
// and lets the reviewer approve / reject / request resubmission (with reason)
// or delete the private media (retention).

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
  const [selected, setSelected] = useState(null); // id
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('photoVerification', { action: 'listPending' });
      const body = res?.data || res;
      if (body?.ok) setItems(body.items || []);
      else throw new Error(body?.error || 'Failed to load queue.');
    } catch (e) {
      setError(e?.message || 'Failed to load queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openDetail = async (id) => {
    setSelected(id);
    setDetail(null);
    setReason('');
    setDetailLoading(true);
    try {
      const res = await base44.functions.invoke('photoVerification', { action: 'getDetail', id });
      const body = res?.data || res;
      if (body?.ok) setDetail(body.detail);
      else throw new Error(body?.error || 'Failed to load detail.');
    } catch (e) {
      toast({ title: 'Could not load detail', description: e?.message });
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const review = async (decision) => {
    if (!selected) return;
    setActing(true);
    try {
      const res = await base44.functions.invoke('photoVerification', { action: 'review', id: selected, decision, reason });
      const body = res?.data || res;
      if (!body?.ok) throw new Error(body?.error || 'Action failed.');
      toast({ title: decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Resubmission requested' });
      setSelected(null);
      setDetail(null);
      refresh();
    } catch (e) {
      toast({ title: 'Action failed', description: e?.message });
    } finally {
      setActing(false);
    }
  };

  const deleteMedia = async () => {
    if (!selected) return;
    if (!confirm('Delete the private verification media for this submission? The record stays for audit.')) return;
    setActing(true);
    try {
      const res = await base44.functions.invoke('photoVerification', { action: 'deleteMedia', id: selected });
      const body = res?.data || res;
      if (!body?.ok) throw new Error(body?.error || 'Delete failed.');
      toast({ title: 'Media deleted', description: 'Storage deletion requires manual follow-up (logged).' });
      openDetail(selected);
    } catch (e) {
      toast({ title: 'Delete failed', description: e?.message });
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          {t('mission.photo_verification_queue') || 'Photo Verification Queue'}
        </h3>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 text-destructive text-xs p-3 flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {t('mission.no_photo_verifications') || 'No pending photo verifications.'}
        </div>
      )}

      <div className="grid gap-2">
        {items.map((it) => (
          <button key={it.id} onClick={() => openDetail(it.id)}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-start hover:bg-muted/40 transition-default">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{it.member_name || 'Unknown member'}</p>
              <p className="text-xs text-muted-foreground">{PROMPT_LABELS[it.prompt] || it.prompt} · {it.submitted_at ? new Date(it.submitted_at).toLocaleString() : ''}</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-primary shrink-0"><Eye className="w-3.5 h-3.5" /> Review</span>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setDetail(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('mission.photo_review') || 'Review photo verification'}</DialogTitle>
            <DialogDescription>{detail?.member_name || ''}</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <PhotoFrame label="Selfie" url={detail.selfie_url} deleted={!!detail.media_deleted_at} />
                <PhotoFrame label={`Pose: ${PROMPT_LABELS[detail.prompt] || detail.prompt}`} url={detail.pose_url} deleted={!!detail.media_deleted_at} />
              </div>

              {detail.media_deleted_at && (
                <div className="rounded-lg bg-muted text-xs text-muted-foreground p-2.5 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Private media deleted {new Date(detail.media_deleted_at).toLocaleString()}.
                </div>
              )}

              <div>
                <Label className="mb-1.5 block">{t('mission.photo_reason') || 'Reason (shown to user for reject / resubmission)'}</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional for approve; recommended for reject / resubmission" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button className="bg-success text-success-foreground hover:bg-success/90" disabled={acting || detail.media_deleted_at} onClick={() => review('approved')}>
                  <Check className="w-4 h-4 mr-1.5" /> Approve
                </Button>
                <Button variant="outline" disabled={acting} onClick={() => review('needs_resubmission')}>
                  <AlertCircle className="w-4 h-4 mr-1.5" /> Resubmit
                </Button>
                <Button variant="destructive" disabled={acting} onClick={() => review('rejected')}>
                  <X className="w-4 h-4 mr-1.5" /> Reject
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="w-full text-destructive" disabled={acting || detail.media_deleted_at} onClick={deleteMedia}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete private media (retention)
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhotoFrame({ label, url, deleted }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="aspect-square rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
        {deleted ? (
          <span className="text-xs text-muted-foreground text-center px-2">Media deleted</span>
        ) : url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground text-center px-2">No photo provided</span>
        )}
      </div>
    </div>
  );
}