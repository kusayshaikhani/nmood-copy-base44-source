import React, { useState, useEffect } from 'react';
import { Phone, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { updateMemberProfile } from '@/lib/member-update';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { localizeAuthError } from '@/lib/auth-errors';
import { toast } from '@/components/ui/use-toast';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { normalizeToE164, maskPhone } from '@/lib/phone-utils';

const normalizePhone = normalizeToE164;

/**
 * RC-005 — Production phone verification flow.
 * Step 1: trust explanation + phone entry → "Send verification code".
 * Step 2: OTP entry → "Verify" → updates member.phone_verified.
 */
export default function PhoneVerificationDialog({ open, onOpenChange, member, onVerified }) {
  const { t } = useLocalization();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState(member?.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (open) {
      setStep('phone');
      setPhone(member?.phone || '');
      setOtpCode('');
      setError('');
      setCountdown(0);
    }
  }, [open]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (phone.replace(/\D/g, '').length < 9) { setError(t('auth.error_invalid_phone')); return; }
    setLoading(true);
    try {
      trackProductEvent(PRODUCT_EVENTS.VERIFICATION_STARTED, { item: 'phone' });
      const res = await base44.functions.invoke('phoneAuthService', {
        action: 'send_otp', phone: normalizePhone(phone), purpose: 'verify',
      });
      if (res?.data?.devCode) {
        toast({ title: t('auth.dev_code_title'), description: t('auth.dev_code_desc', { code: res.data.devCode }) });
      }
      setStep('otp');
      setCountdown(60);
    } catch (err) {
      setError(phoneErrorMessage(err, 'auth.error_send_code_failed', { method: 'phone' }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      const res = await base44.functions.invoke('phoneAuthService', {
        action: 'verify_otp', phone: normalized, code: otpCode,
      });
      if (!res?.data?.verified) throw new Error(t('auth.error_invalid_code'));
      await updateMemberProfile({ phone: normalized, phone_verified: true });
      trackProductEvent(PRODUCT_EVENTS.VERIFICATION_COMPLETED, { item: 'phone' });
      toast({ title: t('trust.dialog.phone_title'), description: t('trust.dialog.phone_success_desc') });
      onVerified?.();
      onOpenChange(false);
    } catch (err) {
      setError(phoneErrorMessage(err, 'auth.error_invalid_code'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('phoneAuthService', {
        action: 'send_otp', phone: normalizePhone(phone), purpose: 'verify',
      });
      if (res?.data?.devCode) {
        toast({ title: t('auth.dev_code_title'), description: t('auth.dev_code_desc', { code: res.data.devCode }) });
      }
      setCountdown(60);
    } catch (err) {
      setError(phoneErrorMessage(err, 'auth.error_resend_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhone = () => {
    setStep('phone');
    setOtpCode('');
    setError('');
  };

  const maskedDest = maskPhone(normalizePhone(phone));

  // RC-001 — Graceful 503 handling: when the SMS provider is not configured in
  // production, the backend returns 503. Show a localized message, not the raw
  // error or any technical detail.
  const phoneErrorMessage = (err, fallbackKey, opts = {}) => {
    if (err?.status === 503 || /unavailable/i.test(err?.message || '')) {
      return t('auth.error_phone_unavailable');
    }
    return localizeAuthError(err, t, fallbackKey, opts);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('trust.dialog.phone_title')}</DialogTitle>
        </DialogHeader>

        {step === 'phone' && (
          <>
            <DialogDescription className="leading-relaxed">
              {t('trust.dialog.phone_explanation')}
            </DialogDescription>
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
            <form onSubmit={handleSendCode} className="space-y-2">
              <Label htmlFor="verify-phone">{t('auth.phone_label')}</Label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="verify-phone" type="tel" autoComplete="tel" autoFocus placeholder={t('auth.phone_placeholder')} value={phone} onChange={(e) => setPhone(e.target.value)} className="ps-10 h-11" required />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('auth.sending')}</> : t('trust.dialog.send_code')}
              </Button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <DialogDescription>
              {t('auth.code_sent_to', { dest: maskedDest })}{' '}
              <span onClick={handleChangePhone} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChangePhone(); } }}
                className="text-primary text-xs font-medium hover:underline cursor-pointer">
                {t('auth.change_phone')}
              </span>
            </DialogDescription>
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                <InputOTPGroup>
                  <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                  <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <form onSubmit={handleVerify}>
              <Button type="submit" className="w-full h-11" disabled={loading || otpCode.length < 6}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('auth.verifying')}</> : t('auth.verify')}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              {countdown > 0 ? t('auth.resend_in', { seconds: countdown }) : (
                <>
                  {t('auth.didnt_receive') + ' '}
                  <button type="button" onClick={handleResend} disabled={loading} className="text-primary font-semibold hover:underline disabled:opacity-50">
                    {loading ? t('auth.sending') : t('auth.resend_code')}
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}