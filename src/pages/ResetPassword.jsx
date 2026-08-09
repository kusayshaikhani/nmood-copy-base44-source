import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { usePageTitle } from '@/lib/usePageTitle';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthLogo from '@/components/auth/AuthLogo';

// Nmood Auth Rebuild — R4
// Reset Password page. Reads the reset token from the URL query string
// and calls base44.auth.resetPassword({resetToken, newPassword}).
// Security: token is never stored in persistent storage, logs, or analytics.
// After success, redirects to /auth without modifying roles, memberships,
// subscriptions, or billing.
export default function ResetPassword() {
  usePageTitle('Reset Password');
  const { t } = useLocalization();

  // Read token from URL — never stored in state that persists.
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [linkState, setLinkState] = useState(resetToken ? 'valid' : 'invalid');

  // Password requirements (from Base44 SDK: minimum 8 characters)
  const MIN_LENGTH = 8;
  const meetsLength = password.length >= MIN_LENGTH;
  const passwordsMatch = confirmPassword === password && confirmPassword.length > 0;

  const handleReset = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!password) { setError(t('auth.error_password_required')); return; }
    if (password.length < MIN_LENGTH) { setError(t('auth.error_password_too_short')); return; }
    if (password !== confirmPassword) { setError(t('auth.error_password_mismatch')); return; }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword: password });
      setSuccess(true);
      setLoading(false);
      // Do NOT store the token or password anywhere.
      // Redirect to /auth after a short delay so the user sees the confirmation.
      setTimeout(() => { window.location.href = '/auth'; }, 2500);
    } catch (err) {
      setLoading(false);
      const status = err?.status || err?.statusCode;
      const msg = (err?.message || '').toLowerCase();
      if (status === 400 || msg.includes('expired') || msg.includes('invalid')) {
        if (msg.includes('expired')) setLinkState('expired');
        else setLinkState('invalid');
      } else if (status === 422 || msg.includes('password') || msg.includes('weak') || msg.includes('short') || msg.includes('require')) {
        setError(t('auth.error_password_too_short'));
      } else {
        setError(t('auth.r4_error_reset_failed'));
      }
    }
  };

  const inputClass = 'flex h-[52px] w-full rounded-input border border-border/70 bg-muted/40 px-4 text-base font-normal transition-all placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50';
  const passwordInputClass = inputClass + ' pr-12';

  // --- Success state ---
  if (success) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-16 pb-8">
          <AuthLogo className="h-10 sm:h-12 mb-6" />
          <AuthCard>
            <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-5 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-2 text-balance">
              {t('auth.r4_reset_success_title')}
            </h1>
            <p className="text-muted-foreground text-[14px] text-center mb-6 text-balance">
              {t('auth.r4_reset_success_body')}
            </p>
            <button
              type="button"
              data-testid="auth-reset-continue"
              onClick={() => { window.location.href = '/auth'; }}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card hover:shadow-elevated transition-all"
            >
              {t('auth.r4_reset_continue')}
            </button>
          </AuthCard>
          <p
            data-testid="auth-reset-marker"
            className="text-center text-[10px] text-white/50 mt-4 select-none"
          >
            Nmood Auth Rebuild — R4
          </p>
        </div>
      </AuthShell>
    );
  }

  // --- Invalid / Expired link state ---
  if (linkState === 'invalid' || linkState === 'expired') {
    return (
      <AuthShell>
        <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-16 pb-8">
          <AuthLogo className="h-10 sm:h-12 mb-6" />
          <AuthCard>
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-5 mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-2 text-balance">
              {linkState === 'expired' ? t('auth.r4_reset_expired_title') : t('auth.r4_reset_invalid_title')}
            </h1>
            <p className="text-muted-foreground text-[14px] text-center mb-6 text-balance">
              {linkState === 'expired' ? t('auth.r4_reset_expired_body') : t('auth.r4_reset_invalid_body')}
            </p>
            <Link
              to="/forgot-password"
              data-testid="auth-reset-request-new"
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card hover:shadow-elevated transition-all mb-3"
            >
              {t('auth.r4_request_new_link')}
            </Link>
            <Link
              to="/auth"
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button border border-border/70 bg-card text-foreground font-semibold text-base shadow-soft hover:bg-secondary transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.r4_forgot_back')}
            </Link>
          </AuthCard>
          <p
            data-testid="auth-reset-marker"
            className="text-center text-[10px] text-white/50 mt-4 select-none"
          >
            Nmood Auth Rebuild — R4
          </p>
        </div>
      </AuthShell>
    );
  }

  // --- Form state ---
  return (
    <AuthShell>
      <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-12 pb-8">
        <AuthLogo className="h-10 sm:h-12 mb-6" />

        <AuthCard>
          {/* Heading */}
          <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-1.5 text-balance">
            {t('auth.r4_reset_title')}
          </h1>
          <p className="text-muted-foreground text-[14px] text-center mb-5 text-balance">
            {t('auth.r4_reset_subtitle')}
          </p>

          {/* Reset form */}
          <form data-testid="auth-reset-form" onSubmit={handleReset} className="w-full space-y-3" noValidate>
            {/* New password */}
            <div>
              <label htmlFor="reset-password" className="block text-[13px] font-medium text-foreground mb-1.5">
                {t('auth.password_label')}
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                  disabled={loading}
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 rounded-lg disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reset-confirm" className="block text-[13px] font-medium text-foreground mb-1.5">
                {t('auth.confirm_password_label')}
              </label>
              <div className="relative">
                <input
                  id="reset-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
                  disabled={loading}
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  disabled={loading}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 rounded-lg disabled:opacity-50"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="text-[12px] text-muted-foreground space-y-1 px-1">
              <p className={meetsLength ? 'text-success' : ''}>
                {meetsLength ? '✓ ' : '• '}{t('auth.r4_password_min_length')}
              </p>
              {confirmPassword.length > 0 && (
                <p className={passwordsMatch ? 'text-success' : 'text-destructive'}>
                  {passwordsMatch ? '✓ ' : '• '}{t('auth.r4_passwords_match')}
                </p>
              )}
            </div>

            {/* Error */}
            {error && <p className="text-[13px] text-destructive font-medium px-1">{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              data-testid="auth-reset-submit"
              disabled={loading}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card hover:shadow-elevated transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.r4_reset_button')}
            </button>
          </form>

          {/* Back to Sign In */}
          <Link
            to="/auth"
            className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.r4_forgot_back')}
          </Link>
        </AuthCard>

        {/* Build marker */}
        <p
          data-testid="auth-reset-marker"
          className="text-center text-[10px] text-muted-foreground/50 mt-4 select-none"
        >
          Nmood Auth Rebuild — R4
        </p>
      </div>
    </AuthShell>
  );
}