import React, { useState, useEffect, useRef } from 'react';
import { Phone, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { toast } from '@/components/ui/use-toast';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { maskPhone } from '@/lib/phone-utils';
import { checkPhoneVerification, getPhoneVerificationErrorKey, phoneVerificationGuidance, startPhoneVerification, phoneEntryForCountry, phoneCountries, phoneCountryFromInput, readPhoneVerification, recoverPhoneVerification } from '@/lib/phone-verification';



/**
 * RC-005 — Production phone verification flow.
 * Step 1: trust explanation + phone entry → "Send verification code".
 * Step 2: OTP entry → "Verify" → updates member.phone_verified.
 */
export default function PhoneVerificationDialog({ open, onOpenChange, member, onVerified }) {
  const { t } = useLocalization();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState(member?.phone || '');
  const [country, setCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const selectedCountry=phoneCountries.find(c=>c.code===country);
  const prefix=selectedCountry?'+'+selectedCountry.dial:'';
  const [challenge, setChallenge] = useState(null);
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [checkCountdown, setCheckCountdown] = useState(0);

  const requestVersion = useRef(0);
  const resetEntryError = () => { requestVersion.current += 1; setError(''); setLoading(false); };

  useEffect(() => {
    requestVersion.current += 1;
    setLoading(false);
    if (open) {
      setCountrySearch('');
      setStep('phone');
      setChallenge(null);
      setCountry(phoneCountryFromInput(member?.phone));
      setNeedsRecovery(false);
      setPhone(member?.phone || '');
      setOtpCode('');
      setError('');
      setCountdown(0);
      setCheckCountdown(0);
    }
    return () => { requestVersion.current += 1; };
  }, [open, member?.id]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => { if (checkCountdown <= 0) return; const timer = setInterval(() => setCheckCountdown(n => Math.max(0,n-1)),1000); return () => clearInterval(timer); }, [checkCountdown]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (loading || countdown > 0) return;
    setError('');
    if (!selectedCountry) {setError('Choose a supported phone country.');return;}
    if (phone.replace(/\D/g, '').length < 9) { setError(t('auth.error_invalid_phone')); return; }
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      trackProductEvent(PRODUCT_EVENTS.VERIFICATION_STARTED, { item: 'phone' });
      const res = await startPhoneVerification(phone, country);
      if (version !== requestVersion.current) return;
      setStep('otp');
      // Keep the locally entered number; the server never returns a full phone number.
      setChallenge(res.challenge_id);
      setCountdown(Number(res.retry_after || 60));
    } catch (err) {
      if (version !== requestVersion.current) return;
      if (err?.retryAfter) setCountdown(err.retryAfter);
      setError(phoneErrorMessage(err, 'auth.error_send_code_failed', { method: 'phone' }));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (loading || checkCountdown > 0) return;
    setError('');
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const res = await checkPhoneVerification(challenge, otpCode);
      if (version !== requestVersion.current) return;
      if (!res?.verified) throw new Error(t('auth.error_invalid_code'));
      trackProductEvent(PRODUCT_EVENTS.VERIFICATION_COMPLETED, { item: 'phone' });
      const saved = await readPhoneVerification(member?.id).catch(() => { throw Object.assign(new Error('verification_save_failed'), {code:'verification_save_failed'}); });
      if (!saved?.phone_verified || (member?.id && saved.id !== member.id)) throw new Error('verification_save_failed');
      if (version !== requestVersion.current) return;
      await onVerified?.(saved);
      toast({ title: t('trust.dialog.phone_title'), description: t('trust.dialog.phone_success_desc') });
      onOpenChange(false);
    } catch (err) {
      if (version !== requestVersion.current) return;
      if (err?.retryAfter) setCheckCountdown(err.retryAfter);
      if (err?.code === 'verification_save_failed' || err?.message === 'verification_save_failed') setNeedsRecovery(true);
      setError(phoneErrorMessage(err, 'auth.error_invalid_code'));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const res = await startPhoneVerification(phone, country);
      if (version !== requestVersion.current) return;
      // Keep the locally entered number; the server never returns a full phone number.
      setChallenge(res.challenge_id);
      setCountdown(Number(res.retry_after || 60));
    } catch (err) {
      if (version !== requestVersion.current) return;
      if (err?.retryAfter) setCountdown(err.retryAfter);
      setError(phoneErrorMessage(err, 'auth.error_resend_failed'));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  const handleChangePhone = () => {
    setStep('phone');
    setOtpCode('');
    setError('');
  };

  const recover = async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    try { let saved = await readPhoneVerification(member?.id); if (saved?.recovery_required || !saved?.phone_verified) { await recoverPhoneVerification(); saved = await readPhoneVerification(member?.id); } if (version !== requestVersion.current) return; if (!saved?.phone_verified || (member?.id && saved.id !== member.id)) throw Error('verification_save_failed'); await onVerified?.(saved); onOpenChange(false); }
    catch { if (version !== requestVersion.current) return; setError('Verification could not be saved. Please try again later. Your existing phone is unchanged.'); }
    finally { if (version === requestVersion.current) setLoading(false); }
  };

  const maskedDest = maskPhone(phone);

  const phoneErrorMessage = (err, fallbackKey, opts = {}) => {
    const guidance=phoneVerificationGuidance(err);
    if(guidance)return guidance;
    const key = getPhoneVerificationErrorKey(err);
    if (key) return t(key);
    return t(fallbackKey, opts);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('trust.dialog.phone_title')}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">Phone verification is optional. Choose a supported phone country. Availability depends on your country and carrier. Your existing number stays unchanged until verification succeeds.</p>
        {(needsRecovery || member?.recovery_required) && <Button onClick={recover} disabled={loading}>Retry saving verification</Button>}
        {step === 'phone' && (
          <>
            <DialogDescription className="leading-relaxed">
              {t('trust.dialog.phone_explanation')}
            </DialogDescription>
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
            <form onSubmit={handleSendCode} className="space-y-2">
              <Label htmlFor="verify-country">Phone country</Label>
              <Input aria-label="Search phone countries" value={countrySearch} onChange={e=>setCountrySearch(e.target.value)} placeholder="Search country or calling code" />
              <select id="verify-country" value={country} onChange={e => {setCountry(e.target.value);const next=phoneCountries.find(c=>c.code===e.target.value);setPhone(next?phoneEntryForCountry(phone.startsWith('+'+next.dial)?phone:'',next.code):'');resetEntryError();}} className="w-full h-11 rounded-md border bg-background px-3" required>
                <option value="">Choose phone country</option>
                {phoneCountries.filter(c=>c.code===country||c.label.toLowerCase().includes(countrySearch.toLowerCase().trim())).map(({code,label}) => <option key={code} value={code}>{label}</option>)}
              </select>
              <Label htmlFor="verify-phone">{t('auth.phone_label')}</Label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                {selectedCountry && <span id="verify-prefix" className="absolute start-10 top-1/2 -translate-y-1/2 font-medium">{prefix}</span>}
                <Input id="verify-phone" type="tel" inputMode="numeric" autoComplete="tel-national" aria-describedby={selectedCountry ? 'verify-prefix' : undefined} autoFocus placeholder="Local mobile number" value={selectedCountry && phone.startsWith(prefix) ? phone.slice(prefix.length) : phone} onChange={(e) => {
                  resetEntryError();
                  const value = e.target.value.trim();
                  const international = /^(?:\+|00)/.test(value);
                  const clean=value.replace(/[\s()-]/g,'').replace(/^00/,'+');
                  if(international&&clean.startsWith('+1')){
                    setPhone(clean);
                    if(!['US','CA'].includes(country)){setCountry('');setError('Choose United States or Canada for +1.');}
                    else setPhone(phoneEntryForCountry(clean,country));
                    return;
                  }
                  const inferred = international ? phoneCountryFromInput(clean) : country;
                  if (!/^\+?[0-9]*$/.test(clean)) { setPhone('');setError('Enter digits only, with an optional international calling code.');return; }
                  if (international && !inferred) {
                    setCountry('');
                    if(phoneCountries.some(c=>('+'+c.dial).startsWith(clean))){setPhone(clean);return;}
                    setPhone('');setError('This phone country is not supported yet.');return;
                  }
                  if (inferred) { setCountry(inferred);setCountrySearch('');setPhone(phoneEntryForCountry(clean,inferred)); }
                  else setPhone(clean.replace(/\D/g,''));
                }} className={selectedCountry ? 'ps-24 h-11' : 'ps-10 h-11'} required />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading || countdown > 0 || !country}>
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('auth.sending')}</>
                  : countdown > 0 ? t('auth.resend_in', { seconds: countdown }) : t('trust.dialog.send_code')}
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
              <Button type="submit" className="w-full h-11" disabled={loading || checkCountdown > 0 || otpCode.length !== 6}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('auth.verifying')}</> : checkCountdown > 0 ? `Try again in ${checkCountdown}s` : t('auth.verify')}
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