import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, ShieldCheck, AlertCircle, Check, RefreshCw, X } from 'lucide-react';
import { uploadVerificationSelfie, getSupabaseSession } from '@/api/supabaseClient';
import { listOwnedRecords, createOwnedRecord } from '@/api/supabaseRecords';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { withTimeout } from '@/lib/bounded-operation';
import { validateImageFile } from '@/lib/upload-security';
import CaptureTile from './CaptureTile';
import { toast } from '@/components/ui/use-toast';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';

// PV-001 — Photo / identity verification submission dialog (manual review).
// User consents, picks a prompted pose, takes ONE selfie with that pose via
// front-camera, uploads to a PRIVATE storage path, and submits. One photo
// total. The selfie is never stored in the public profile-photos bucket.

const PROMPTS = [
  { id: 'hand_on_heart', label: 'Hand on heart' },
  { id: 'peace_sign', label: 'Peace sign' },
  { id: 'two_fingers_to_temple', label: 'Two fingers to temple' },
  { id: 'wave', label: 'Wave' },
];

const RETENTION_DAYS = 30;

export default function PhotoVerificationDialog({ open, onOpenChange, _member, _onApproved }) {
  const { t } = useLocalization();
  const [step, setStep] = useState('consent'); // consent | upload | status
  const [status, setStatus] = useState('none');
  const [prompt, setPrompt] = useState('hand_on_heart');
  const [selfieUri, setSelfieUri] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError,setLoadError]=useState('');
  const [consent, setConsent] = useState(false);
  const [captureFile,setCaptureFile]=useState(null);
  const [uploadError,setUploadError]=useState('');
  const uploadLock=useRef(false),submitLock=useRef(false),generation=useRef(0);
  useEffect(()=>()=>{generation.current++;},[]);
  useEffect(()=>()=>{if(selfiePreview)URL.revokeObjectURL(selfiePreview);},[selfiePreview]);

  const fetchStatus = useCallback(async () => {
    setLoading(true);setLoadError('');const current=generation.current;
    try {
      const records = await withTimeout(()=>listOwnedRecords('PhotoVerification'));
      if(current!==generation.current)return;
      const latest = records?.[0]?.data || (records?.[0] ? records[0] : null);
      if (latest) {
        const currentStatus = latest.status || 'none';
        setStatus(currentStatus);
        if (currentStatus === 'pending' || currentStatus === 'approved') setStep('status');
        else if (currentStatus === 'needs_resubmission' || currentStatus === 'rejected') setStep('consent');
      }
    } catch { setLoadError('Could not check verification status. Please retry.'); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generation.current++;
    if (open) {
      setCaptureFile(null);setUploadError('');setStatus('none');
      setStep('consent');
      setSelfieUri(null);
      setSelfiePreview(null);
      setConsent(false);
      setPrompt('hand_on_heart');
      setSubmitError('');
      fetchStatus();
    }
  }, [open, fetchStatus]);

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const uri = await withTimeout(()=>uploadVerificationSelfie(file),30000);
      if (!uri) throw new Error('Upload did not return a file reference.');
      return { ok: true, uri };
    } catch {
      const message = 'Could not upload your private photo. Check your connection and retry.';
      toast({ title: 'Upload failed', description: message });
      return { ok: false, error: message };
    } finally {
      setUploading(false);
    }
  };

  // Returns { ok, error } so CaptureTile can show the real retryable error
  // instead of silently reverting to the empty placeholder tile.
  const handleCapture = async (file) => {
    if(uploadLock.current||submitLock.current)return {ok:false,error:'Please wait for the current operation.'};
    if(!file?.size||!validateImageFile(file).ok)return {ok:false,error:'Choose a valid new photo up to 8 MB.'};
    uploadLock.current=true;const current=generation.current,owner=getSupabaseSession()?.user?.id;
    setSelfieUri(null);setCaptureFile(file);setUploadError('');setSelfiePreview(URL.createObjectURL(file));
    try{
      const result=await uploadFile(file);
      if(current!==generation.current||getSupabaseSession()?.user?.id!==owner)return {ok:false,error:'Please reopen verification and try again.'};
      if(result.ok){setSelfieUri(result.uri);return {ok:true};}
      setUploadError(result.error);return result;
    }finally{uploadLock.current=false;}
  };
  const handleRetake = () => {
    if(uploadLock.current||submitLock.current)return;
    generation.current++;setSelfiePreview(null);setSelfieUri(null);setCaptureFile(null);setUploadError('');setSubmitError('');
  };

  const handleSubmit = async () => {
    if (!selfieUri || !captureFile || !consent || submitLock.current || uploadLock.current) return;
    submitLock.current=true;
    setSubmitting(true);
    setSubmitError('');
    try {
      trackProductEvent(PRODUCT_EVENTS.VERIFICATION_STARTED, { item: 'photo' });
      const session = getSupabaseSession();
      const now = new Date();
      const retention = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
      if (!session?.access_token || !session?.user?.id) {
        throw Object.assign(new Error('Your session has expired. Please sign in again before submitting.'), { code: 'SESSION_EXPIRED' });
      }
      await createOwnedRecord('PhotoVerification', {
        user_id: session?.user?.id,
        status: 'pending',
        selfie_file_uri: selfieUri,
        prompt,
        consent_at: now.toISOString(),
        submitted_at: now.toISOString(),
        retention_expires_at: retention,
      });
      setStatus('pending');
      setStep('status');
      toast({ title: 'Submitted', description: 'Your verification is in review.' });
    } catch (e) {
      const code = e?.code || e?.response?.data?.code;
      const message = code === 'SESSION_EXPIRED' || /session|jwt|sign in/i.test(e?.message || '')
        ? 'Your session has expired. Please sign in again, then retry your submission.'
        : /already.*pending|pending.*submission/i.test(e?.message || '')
          ? 'Your verification is already in review.'
          : 'We could not submit your verification. Your photo is still private; please check your connection and try again.';
      setSubmitError(message);
      toast({ title: 'Could not submit', description: message });
    } finally {
      submitLock.current=false;setSubmitting(false);
    }
  };

  const handleResubmit = () => {
    handleRetake();setConsent(false);setStep('consent');
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

        {loadError&&<div role="alert"><p>{loadError}</p><Button onClick={fetchStatus}>Retry status</Button></div>}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}

        {!loading && !loadError && step === 'consent' && (
          <div className="space-y-4">
            {(status==='rejected'||status==='needs_resubmission')&&<p role="alert">Your verification was not approved. Consent again, choose a pose, and take a new photo for review.</p>}
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

        {!loading && !loadError && step === 'upload' && (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">{t('trust.dialog.photo_prompt') || 'Choose a pose to do in your selfie'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.map((p) => (
                  <button key={p.id} type="button" disabled={uploading||submitting} onClick={() => {if(prompt!==p.id){handleRetake();setPrompt(p.id);}}}
                    className={`px-3 h-9 rounded-full text-xs font-medium border transition-default ${prompt === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <CaptureTile
              label={`Selfie with ${PROMPTS.find((p) => p.id === prompt)?.label || ''}`}
              previewUrl={selfiePreview}
              uploading={uploading||submitting}
              onCapture={handleCapture}
              onRetake={handleRetake}
            />


            {(status === 'rejected' || status === 'needs_resubmission') && (
              <div role="alert" className="rounded-lg bg-destructive/10 text-destructive text-xs p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Your verification was not approved. Please submit a new photo for review.</span>
              </div>
            )}

            {uploading&&<p role="status">Uploading private photo…</p>}
            {uploadError&&<div role="alert"><p>{uploadError}</p><Button disabled={uploading||submitting} onClick={()=>handleCapture(captureFile)}>Retry photo upload</Button></div>}
            {submitError && (
              <div className="rounded-lg bg-destructive/10 text-destructive text-xs p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <Button className="w-full h-11" disabled={!selfieUri || !consent || !captureFile || submitting || uploading} onClick={handleSubmit}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.submitting') || 'Submitting…'}</> : t('trust.dialog.photo_submit') || 'Submit for review'}
            </Button>
          </div>
        )}

        {!loading && !loadError && step === 'status' && (
          <div className="space-y-4 text-center">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${status === 'approved' ? 'bg-success/10' : status === 'pending' ? 'bg-warning/10' : 'bg-destructive/10'}`}>
              {status === 'approved' ? <Check className="w-7 h-7 text-success" /> : status === 'pending' ? <RefreshCw className="w-7 h-7 text-warning" /> : <X className="w-7 h-7 text-destructive" />}
            </div>
            <p className="text-base font-semibold">{statusLabel(status)}</p>
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