import { callSupabaseRpc, getSupabaseSession } from '@/api/supabaseClient';
import { verificationSummary } from '@/lib/member-verification-badge';
import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Camera, Phone, Check, X, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import PhoneVerificationDialog from '@/components/profile/PhoneVerificationDialog';
import { readPhoneVerification } from '@/lib/phone-verification';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import PhotoVerificationDialog from '@/components/profile/PhotoVerificationDialog';
import { listOwnedRecords } from '@/api/supabaseRecords';

// Trust & Verification — email and manual photo verification only.
//
// Location verification was removed: it reported a device permission, not a
// verified fact about the member, so it did not belong on this screen.
// Phone verification is optional and exposed only in the main app.
export default function TrustVerification({ member, onVerified }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneState, setPhoneState] = useState({});
  const [photoVerifyOpen, setPhotoVerifyOpen] = useState(false);
  const [photoRecord, setPhotoRecord] = useState(null);
  const photoStatus = photoRecord?.owner === member?.id ? photoRecord.status : 'none';
  const [verification, setVerification] = useState(null);
  const [verificationRevision, setVerificationRevision] = useState(0);
  const refreshVerification = useCallback(() => setVerificationRevision(value => value + 1), []);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (MAIN_PASSPORT && searchParams.get('open') === 'phone-verification') setPhoneOpen(true);
    if (searchParams.get('open') === 'identity-verification') setPhotoVerifyOpen(true);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    (async () => {
      const records = await listOwnedRecords('PhotoVerification').catch(() => []);
      const latest = records?.[0]?.data || records?.[0] || null;
      if (active && latest?.status) setPhotoRecord({owner:member?.id,status:latest.status});
    })();
    return () => { active = false; };
  }, [member?.id]);

  useEffect(() => { let active = true; if (MAIN_PASSPORT) readPhoneVerification(member?.id).then(value => { if (active && value?.id === member?.id) setPhoneState(value || {}); }).catch(() => {}); return () => { active = false; }; }, [member?.id]);

  const actorId = getSupabaseSession()?.user?.id;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const owner = member?.id;
    const ownsSession = () => owner && actorId === owner && getSupabaseSession()?.user?.id === owner;
    setVerification({ owner, state: 'loading' });
    if (!ownsSession()) {
      setVerification({ owner, state: 'unavailable' });
      return () => controller.abort();
    }
    callSupabaseRpc('nmood_member_verification_status', { p_member_id: owner }, { expectedUserId: owner, signal: controller.signal })
      .then(value => {
        if (!verificationSummary(value).known) throw Error('Verification unavailable');
        if (active && ownsSession()) setVerification({ owner, state: 'ready', value });
      })
      .catch(() => { if (active) setVerification({ owner, state: 'unavailable' }); });
    return () => { active = false; controller.abort(); };
  }, [member?.id, member?.email, member?.phone, actorId, verificationRevision]);

  useEffect(() => {
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') refreshVerification(); };
    window.addEventListener('focus', refreshVerification);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshVerification);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refreshVerification]);

  const ownsStatus = actorId === member?.id && verification?.owner === member?.id;
  const known = ownsStatus && verification?.state === 'ready';
  const unknownStatus = ownsStatus && verification?.state === 'unavailable' ? 'Unavailable' : 'Checking verification status';
  const photoVerified = known && verification.value.photo;
  const phoneVerified = known && verification.value.phone;
  const emailVerified = known && verification.value.email;
  const progress = verificationSummary(known ? verification.value : null);
  const itemStatus = verified => known ? t(verified ? 'trust.status.verified' : 'trust.status.not_verified') : unknownStatus;
  const cards = [
    ...(MAIN_PASSPORT ? [{icon:Phone,titleKey:'trust.item.phone',status:itemStatus(phoneVerified),verified:phoneVerified,action:{label:phoneVerified ? 'Change verified phone' : t('trust.action.verify_phone'),onClick:()=>setPhoneOpen(true)}}] : []),
    {
      icon: Mail,
      titleKey: 'trust.item.email',
      status: itemStatus(emailVerified),
      verified: emailVerified,
      action: null,
    },
    {
      icon: Camera,
      titleKey: 'trust.item.photo',
      status: !known ? unknownStatus : photoVerified
        ? t('trust.status.verified')
        : photoStatus === 'pending'
          ? (t('trust.status.pending') || 'In review')
          : photoStatus === 'rejected'
            ? (t('trust.status.rejected') || 'Rejected')
            : photoStatus === 'needs_resubmission'
              ? (t('trust.status.needs_resubmission') || 'Resubmission needed')
              : (t('trust.status.not_verified')),
      verified: photoVerified,
      rejected: photoStatus === 'rejected' || photoStatus === 'needs_resubmission',
      action: photoVerified
        ? null
        : {
            label: photoStatus === 'pending'
              ? (t('trust.status.pending') || 'In review')
              : (photoStatus === 'rejected' || photoStatus === 'needs_resubmission')
                ? (t('trust.dialog.photo_resubmit') || 'Resubmit')
                : (t('trust.action.verify_photo') || 'Verify photo'),
            onClick: () => setPhotoVerifyOpen(true),
          },
    },
  ];

  const handleAction = (c) => {
    trackProductEvent(PRODUCT_EVENTS.VERIFICATION_STARTED, { item: c.titleKey });
    if (c.action.onClick) c.action.onClick();
    else if (c.action.to) navigate(c.action.to);
  };

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold">{t('trust.title')}</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground" role="status">{!known ? unknownStatus : `${progress.label} — ${progress.detail}`}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.titleKey} className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-default ${
                c.verified ? 'border-success/30 bg-success/5' : c.rejected ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    c.verified ? 'bg-success/10' : c.rejected ? 'bg-destructive/10' : 'bg-muted'
                  }`}>
                    <Icon className={`w-4 h-4 ${c.verified ? 'text-success' : c.rejected ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{t(c.titleKey)}</p>
                    <div className="flex items-center gap-1">
                      {!known ? null : c.verified ? (
                        <Check className="w-3 h-3 text-success" strokeWidth={3} />
                      ) : (
                        <X className={`w-3 h-3 ${c.rejected ? 'text-destructive' : 'text-muted-foreground'}`} strokeWidth={3} />
                      )}
                      <span className={`text-xs font-medium ${c.verified ? 'text-success' : c.rejected ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                </div>
                {c.action && (
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1" onClick={() => handleAction(c)}>
                    {c.action.label}
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {MAIN_PASSPORT && <PhoneVerificationDialog open={phoneOpen} onOpenChange={setPhoneOpen} member={{...member,...phoneState}} onVerified={async saved => { setPhoneState(saved); refreshVerification(); await onVerified?.({...saved,id:member.id}); }} />}
      <PhotoVerificationDialog
        open={photoVerifyOpen}
        onOpenChange={setPhotoVerifyOpen}
        member={member}
        onApproved={async saved => { refreshVerification(); await onVerified?.(saved); }}
      />
    </>
  );
}