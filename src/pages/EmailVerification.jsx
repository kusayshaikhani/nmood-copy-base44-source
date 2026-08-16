import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { usePageTitle } from '@/lib/usePageTitle';
import { postAuthRedirect, getAndClearPostAuthTarget } from '@/lib/post-auth-resolver';
import { getPendingRegistration, clearPendingRegistration } from '@/lib/pending-registration';
import { registerMemberProfile } from '@/lib/member-update';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthLogo from '@/components/auth/AuthLogo';
import OtpInput from '@/components/auth/OtpInput';

// Nmood Auth Rebuild — R3
// Email Verification screen. Shared by /verify-email and /verify-otp.
// SDK flow: verifyOtp({email, otpCode}) → setToken(access_token) → postAuthRedirect.
// Integrates with the existing onboarding system for profile creation.
export default function EmailVerification() {
  usePageTitle('Verify Email');
  const { t } = useLocalization();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [checked, setChecked] = useState(false);
  const countdownRef = useRef(null);

  // Read pending registration data on mount. If missing or expired, redirect
  // to /register — the user must have a valid pending registration to verify.
  useEffect(() => {
    const pending = getPendingRegistration();
    if (!pending || !pending.email) {
      navigate('/register', { replace: true });
      return;
    }
    setEmail(pending.email);
    setChecked(true);
  }, [navigate]);

  // Cleanup countdown on unmount.
  useEffect(() => () => clearInterval(countdownRef.current), []);

  const startCountdown = () => {
    setResendCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (loading || resending) return; // prevent duplicate verification
    setError('');
    if (otpCode.length !== 6) {
      setError(t('auth.verification_error_incomplete'));
      return;
    }
    setLoading(true);
    try {
      // SDK: verifyOtp({email, otpCode}) → returns {access_token, user}
      const result = await base44.auth.verifyOtp({ email, otpCode });
      const accessToken = result?.access_token || result?.data?.access_token;
      if (!accessToken) {
        setError(t('auth.verification_error_failed'));
        setLoading(false);
        return;
      }
      // Establish the authenticated session (persist token to storage).
      base44.auth.setToken(accessToken, true);

      // Atomically create/ensure the Member profile BEFORE route change.
      // Uses the pending registration data (firstName, lastName, dob) from
      // the Create Account form. Idempotent find-or-create by email
      // server-side — eliminates the duplicate name/DOB onboarding screens
      // and the profile-not-found loop. The member is created with
      // onboarding_completed + eligibility, so postAuthRedirect resolves
      // directly to Home (no onboarding, no DOB gate).
      const pending = getPendingRegistration();
      if (pending && pending.dob) {
        try {
          await registerMemberProfile({
            first_name: pending.firstName,
            last_name: pending.lastName,
            email: pending.email,
            dob: pending.dob,
          });
        } catch (err) {
          // Do not continue into onboarding without the canonical account
          // profile. Retrying this verified step safely reuses the same
          // account record instead of creating another one.
          console.warn('[EmailVerification] registerProfile failed:', err?.message || err);
          setError('Your email was verified, but we could not prepare your profile. Please try again.');
          setLoading(false);
          return;
        }
      }

      clearPendingRegistration();
      const target = getAndClearPostAuthTarget() || '/';
      await postAuthRedirect(target);
    } catch (err) {
      setLoading(false);
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong')) {
        setError(t('auth.verification_error_invalid'));
      } else if (msg.includes('expired')) {
        setError(t('auth.verification_error_expired'));
      } else {
        setError(t('auth.verification_error_failed'));
      }
    }
  };

  const handleResend = async () => {
    if (resending || loading || resendCountdown > 0) return; // prevent duplicate resend
    setResending(true);
    setError('');
    try {
      // SDK: resendOtp(email) — resends the OTP to the user's email.
      await base44.auth.resendOtp(email);
      startCountdown();
    } catch {
      setError(t('auth.verification_error_resend_failed'));
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = () => {
    clearPendingRegistration();
    navigate('/register');
  };

  // Mask the email for display (e.g., t**@example.com).
  const maskedEmail = React.useMemo(() => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const masked = local.length <= 2
      ? local[0] + '*'.repeat(Math.max(0, local.length - 1))
      : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
    return `${masked}@${domain}`;
  }, [email]);

  // Don't render until we've checked for pending data (avoids flash before redirect).
  if (!checked) return null;

  const busy = loading || resending;

  return (
    <AuthShell>
      <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-12 pb-8">
        <AuthLogo className="h-10 sm:h-12 mb-6" />

        <AuthCard>
          {/* Mail icon */}
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Mail className="w-5 h-5" />
          </div>

          {/* Heading */}
          <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-1.5 text-balance">
            {t('auth.verification_title')}
          </h1>
          <p className="text-muted-foreground text-[14px] text-center mb-5 text-balance">
            {t('auth.verification_subtitle')}{' '}
            <span className="font-medium text-foreground">{maskedEmail}</span>
          </p>

          {/* Verification form */}
          <form data-testid="auth-verification-form" onSubmit={handleVerify} className="w-full space-y-4" noValidate>
            {/* Six-digit OTP input */}
            <div className="flex justify-center">
              <OtpInput
                value={otpCode}
                onChange={(value) => {
                  setOtpCode(value);
                  if (error) setError('');
                }}
                disabled={busy}
              />
            </div>

            {/* Inline error */}
            {error && (
              <p className="text-[13px] text-destructive font-medium text-center">{error}</p>
            )}
            {/* Real-time incomplete code hint — shown when the user has started
                typing but hasn't entered all 6 digits. */}
            {!error && otpCode.length > 0 && otpCode.length < 6 && (
              <p className="text-[13px] text-destructive font-medium text-center">
                {t('auth.verification_error_incomplete')}
              </p>
            )}

            {/* Verify button — enabled only when exactly 6 digits are present */}
            <button
              type="submit"
              data-testid="auth-verification-submit"
              disabled={busy || otpCode.length !== 6}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card hover:shadow-elevated transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.verification_verify')}
            </button>
          </form>

          {/* Resend code */}
          <div className="mt-4 text-center min-h-[20px]">
            {resendCountdown > 0 ? (
              <p className="text-[13px] text-muted-foreground">
                {t('auth.verification_resend_in', { seconds: resendCountdown })}
              </p>
            ) : (
              <button
                type="button"
                data-testid="auth-verification-resend"
                onClick={handleResend}
                disabled={busy}
                className="text-[13px] font-semibold text-primary hover:underline transition-all disabled:opacity-60 inline-flex items-center gap-1.5"
              >
                {resending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('auth.verification_resend')}
              </button>
            )}
          </div>

          {/* Change email / return to Create Account */}
          <button
            type="button"
            data-testid="auth-verification-change-email"
            onClick={handleChangeEmail}
            disabled={loading}
            className="mt-3 text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 disabled:opacity-60 w-full justify-center"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('auth.verification_change_email')}
          </button>
        </AuthCard>

        {/* Build marker */}
        <p
          data-testid="auth-verification-marker"
          className="text-center text-[10px] text-white/50 mt-4 select-none"
        >
          Nmood Auth Rebuild — R3
        </p>
      </div>
    </AuthShell>
  );
}
