import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Loader2, ShieldCheck, Upload, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLocalization } from '@/lib/i18n/useLocalization';
import CaptureTile from './CaptureTile';
import { toast } from '@/components/ui/use-toast';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';

// PV-001 — Photo / identity verification submission dialog (manual review).
// User consents, picks a prompted pose, takes ONE selfie with that pose via
// front-camera, uploads to PRIVATE storage, and submits. One photo total.

const PROMPTS = [
  { id: 'hand_on_heart', label: 'Hand on heart' },
  { id: 'peace_sign', label: 'Peace sign' },
  { id: 'two_fingers_to_temple', label: 'Two fingers to temple' },
  { id: 'wave', label: 'Wave' },
];

const RETENTION_DAYS = 30;

export default function PhotoVerificationDialog({ open, onOpenChange, member, onApproved }) {
  const { t } = useLocalization();
  const [step, setStep] = useState('consent'); // consent | upload | status
  const [status, setStatus] = useState('none');
  const [decisionReason, setDecisionReason] = useState('');
  const [prompt, setPrompt] = useState('hand_on_heart');
  const [selfieUri, setSelfieUri] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('photoVerification', { action: 'status' });
      const body = res?.data || res;
      if (body?.ok) {
        setStatus(body.status || 'none');
        setDecisionReason(body.decision_reason || '');
        if (body.status === 'pending') setStep('status');
        else if (body.status === 'approved') setStep('status');
        else if (body.status === 'needs_resubmission' || body.status === 'rejected') setStep('upload');
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setStep('consent');
      setSelfieUri(null);
      setSelfiePreview(null);
      setConsent(false);
      setPrompt('hand_on_heart');
      fetchStatus();
    }
  }, [open, fetchStatus]);

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPrivateFile({ file });
      return res?.file_uri || null;
    } catch (e) {
      toast({ title: 'Upload failed', description: e?.message || 'Could not upload photo.' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCapture = async (file) => {
    const url = URL.createObjectURL(file);
    setSelfiePreview(url);
    const uri = await uploadFile(file);
    if (uri) setSelfieUri(uri);
    else { URL.revokeObjectURL(url); setSelfiePreview(null); }
  };
  const handleRetake = () => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(null);
    setSelfieUri(null);
  };

  const handleSubmit = async () => {
    if (!selfieUri || !consent) return;
    setSubmitting(true);
    try {
      trackProductEvent(PRODUCT_EVENTS.VERIFICATION_STARTED, { item: 'photo' });
      const res = await base44.functions.invoke('photoVerification', {
        action: 'submit',
        selfie_file_uri: selfieUri,
        prompt,
        consent: true,
      });
      const body = res?.data || res;
      if (!body?.ok) throw new Error(body?.error || 'Submission failed.');
      setStep('status');
      setStatus('pending');
      toast({ title: 'Submitted', description: 'Your verification is in review.' });
    } catch (e) {
      toast({ title: 'Could not submit', description: e?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = () => {
    setStep('upload');
    setSelfieUri(null);
    setSelfiePreview(null);
  };

  const statusLabel = (s) => {
    if (s === 'pending') return 'In review';
    if (s === 'approved') return 'Verified';
    if (s === 'rejected') return 'Rejected';
    if (s === 'needs_resubmission') return 'Resubmission needed';
    return 'Not submitted';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success" />
            {t('trust.dialog.photo_title') || 'Photo verification'}
          </DialogTitle>
          <DialogDescription>
            {t('trust.dialog.photo_explanation') || 'A quick, private check so members know you are real. A human reviewer approves it — no facial scanning.'}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}

        {!loading && step === 'consent' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>{t('trust.dialog.photo_purpose') || 'Take a selfie with a prompted pose to confirm you are a real person. This is manual — no biometric matching, no face embeddings stored.'}</p>
              <p>{t('trust.dialog.photo_retention') || `Your photo is stored privately and deleted within ${RETENTION_DAYS} days of review. It never appears in your profile or gallery.`}</p>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-border" />
              <span className="text-sm leading-relaxed">{t('trust.dialog.photo_consent') || 'I consent to this verification and understand how my photo is used and deleted.'}</span>
            </label>
            <Button className="w-full h-11" disabled={!consent} onClick={() => setStep('upload')}>
              {t('trust.dialog.photo_continue') || 'Continue'}
            </Button>
          </div>
        )}

        {!loading && step === 'upload' && (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">{t('trust.dialog.photo_prompt') || 'Choose a pose to do in your selfie'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPrompt(p.id)}
                    className={`px-3 h-9 rounded-full text-xs font-medium border transition-default ${prompt === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <CaptureTile
              label={`Selfie with ${PROMPTS.find((p) => p.id === prompt)?.label || ''}`}
              previewUrl={selfiePreview}
              uploading={uploading}
              onCapture={handleCapture}
              onRetake={handleRetake}
            />

            {(status === 'needs_resubmission' || status === 'rejected') && decisionReason && (
              <div className="rounded-lg bg-destructive/10 text-destructive text-xs p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{decisionReason}</span>
              </div>
            )}

            <Button className="w-full h-11" disabled={!selfieUri || submitting || uploading} onClick={handleSubmit}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.submitting') || 'Submitting…'}</> : t('trust.dialog.photo_submit') || 'Submit for review'}
            </Button>
          </div>
        )}

        {!loading && step === 'status' && (
          <div className="space-y-4 text-center">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${status === 'approved' ? 'bg-success/10' : status === 'pending' ? 'bg-warning/10' : 'bg-destructive/10'}`}>
              {status === 'approved' ? <Check className="w-7 h-7 text-success" /> : status === 'pending' ? <RefreshCw className="w-7 h-7 text-warning" /> : <X className="w-7 h-7 text-destructive" />}
            </div>
            <p className="text-base font-semibold">{statusLabel(status)}</p>
            {decisionReason && status !== 'approved' && <p className="text-xs text-muted-foreground">{decisionReason}</p>}
            {status === 'pending' && <p className="text-xs text-muted-foreground">{t('trust.dialog.photo_pending') || 'A reviewer will approve this shortly. You will be notified.'}</p>}
            {(status === 'needs_resubmission' || status === 'rejected') && (
              <Button variant="outline" className="w-full h-11" onClick={handleResubmit}>{t('trust.dialog.photo_resubmit') || 'Resubmit'}</Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}