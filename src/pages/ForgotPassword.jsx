import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabaseAuth } from '@/api/supabaseClient';
import { usePageTitle } from '@/lib/usePageTitle';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useAuth } from '@/lib/AuthContext';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthLogo from '@/components/auth/AuthLogo';

const RESEND_COOLDOWN_SECONDS = 30;

// Entirely in-app password reset: email -> one-time recovery code -> new
// password. Never sends a tappable link, so the user never has to leave
// Nmood for Gmail/Safari/Chrome/an "Open with" chooser. Requires the
// Supabase "Reset Password" email template to use the {{ .Token }} OTP
// variable instead of {{ .ConfirmationURL }} — see project docs.
export default function ForgotPassword() {
  usePageTitle('Forgot Password');
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const [step, setStep] = useState('email'); // 'email' | 'code' | 'password' | 'done'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  function startResendCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((seconds) => {
        if (seconds <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
  }

  async function handleSendCode(event) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) { setError(t('auth.r4_error_email_required')); return; }
    setLoading(true);
    setError('');
    try {
      await supabaseAuth.resetPasswordForEmail(normalized);
      setEmail(normalized);
      setStep('code');
      startResendCooldown();
    } catch (err) {
      setError(err?.message || t('auth.r4_error_rate_limited'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      await supabaseAuth.resetPasswordForEmail(email);
      startResendCooldown();
    } catch (err) {
      setError(err?.message || t('auth.r4_error_rate_limited'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) { setError(t('auth.r4_code_error_required')); return; }
    setLoading(true);
    setError('');
    try {
      await supabaseAuth.verifyRecoveryOtp(email, trimmed);
      setStep('password');
    } catch (err) {
      setError(err?.message || t('auth.r4_code_incorrect'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(event) {
    event.preventDefault();
    if (password.length < 8) { setError(t('auth.r4_password_min_length')); return; }
    if (password !== confirmPassword) { setError(t('auth.r4_error_passwords_no_match')); return; }
    setLoading(true);
    setError('');
    try {
      await supabaseAuth.updatePassword(password);
      // The recovery code verify already produced a valid session — the
      // user is signed in with their new password now, no extra step.
      await checkUserAuth().catch(() => null);
      setStep('done');
      window.setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      setError(err?.message || t('auth.r4_error_reset_failed'));
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    clearInterval(cooldownRef.current);
    navigate('/auth', { replace: true });
  }

  const inputClass = 'flex h-[52px] w-full rounded-input border border-border/70 bg-muted/40 px-4 text-base font-normal transition-all placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50';

  if (step === 'done') {
    return (
      <AuthShell>
        <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-16 pb-8">
          <AuthLogo className="h-10 sm:h-12 mb-6" />
          <AuthCard>
            <h1 className="font-heading text-[24px] font-bold text-center mb-2">{t('auth.r4_reset_success_title')}</h1>
            <p className="text-muted-foreground text-[14px] text-center">{t('auth.r4_reset_success_body')}</p>
          </AuthCard>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-12 pb-8">
        <AuthLogo className="h-10 sm:h-12 mb-6" />
        <AuthCard>
          {step === 'email' && (
            <>
              <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-1.5">{t('auth.r4_forgot_title')}</h1>
              <p className="text-muted-foreground text-[14px] text-center mb-5">{t('auth.r4_forgot_subtitle')}</p>
              <form onSubmit={handleSendCode} className="w-full space-y-3" noValidate>
                <div>
                  <label htmlFor="forgot-email" className="block text-[13px] font-medium text-foreground mb-1.5">Email</label>
                  <input id="forgot-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} placeholder="you@example.com" className={inputClass} />
                </div>
                {error && <p className="text-[12px] text-destructive">{error}</p>}
                <button type="submit" disabled={loading} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card disabled:opacity-60">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.r4_forgot_send')}
                </button>
              </form>
              <Link to="/auth" className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mt-4"><ArrowLeft className="w-4 h-4" />{t('auth.r4_forgot_back')}</Link>
            </>
          )}

          {step === 'code' && (
            <>
              <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-1.5">{t('auth.r4_code_title')}</h1>
              <p className="text-muted-foreground text-[14px] text-center mb-5">{t('auth.r4_code_subtitle', { email })}</p>
              <form onSubmit={handleVerifyCode} className="w-full space-y-3" noValidate>
                <div>
                  <label htmlFor="recovery-code" className="block text-[13px] font-medium text-foreground mb-1.5">{t('auth.r4_code_label')}</label>
                  <input id="recovery-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} disabled={loading} placeholder={t('auth.r4_code_placeholder')} className={inputClass} />
                </div>
                {error && <p className="text-[12px] text-destructive">{error}</p>}
                <button type="submit" disabled={loading} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card disabled:opacity-60">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.r4_code_submit')}
                </button>
              </form>
              <div className="flex items-center justify-between mt-4 text-[13px]">
                <button type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }} className="text-muted-foreground hover:text-foreground font-medium">{t('auth.r4_code_change_email')}</button>
                <button type="button" onClick={handleResendCode} disabled={resendCooldown > 0 || loading} className="text-primary hover:underline font-medium disabled:opacity-50 disabled:no-underline">
                  {resendCooldown > 0 ? t('auth.r4_resend_in', { seconds: resendCooldown }) : t('auth.r4_resend')}
                </button>
              </div>
              <button type="button" onClick={handleCancel} className="w-full text-center text-[13px] text-muted-foreground hover:text-foreground mt-3">{t('auth.r4_forgot_back')}</button>
            </>
          )}

          {step === 'password' && (
            <>
              <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-1.5">{t('auth.r4_reset_title')}</h1>
              <p className="text-muted-foreground text-[14px] text-center mb-5">{t('auth.r4_reset_subtitle')}</p>
              <form onSubmit={handleSetPassword} className="w-full space-y-3" noValidate>
                <div>
                  <label htmlFor="new-password" className="block text-[13px] font-medium text-foreground mb-1.5">New password</label>
                  <div className="relative">
                    <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} className={inputClass + ' pr-12'} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-[13px] font-medium text-foreground mb-1.5">Confirm password</label>
                  <div className="relative">
                    <input id="confirm-password" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={loading} className={inputClass + ' pr-12'} />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground">{showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                  </div>
                </div>
                {error && <p className="text-[12px] text-destructive">{error}</p>}
                <button type="submit" disabled={loading} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card disabled:opacity-60">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.r4_reset_button')}
                </button>
              </form>
            </>
          )}
        </AuthCard>
      </div>
    </AuthShell>
  );
}
