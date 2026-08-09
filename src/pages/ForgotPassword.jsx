import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { usePageTitle } from '@/lib/usePageTitle';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthLogo from '@/components/auth/AuthLogo';

// Nmood Auth Rebuild — R4
// Forgot Password page. Sends a password reset email via the Base44 SDK.
// Security: never reveals whether an account exists; neutral success message;
// resend cooldown; no passwords or tokens stored in persistent storage.
export default function ForgotPassword() {
  usePageTitle('Forgot Password');
  const { t } = useLocalization();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = () => {
    setCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    setError('');
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError(t('auth.r4_error_email_required'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError(t('auth.r4_error_email_invalid'));
      return;
    }
    setLoading(true);
    // 15s network-timeout fallback — if the SDK never responds, stop the
    // spinner and show a retry-able error so the user is never stuck.
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setLoading(false);
      setError(t('auth.r4_error_reset_failed'));
      console.error('[ForgotPassword] request timed out after 15s for', normalized);
    }, 15000);
    try {
      console.log('[ForgotPassword] sending reset request for', normalized);
      await base44.auth.resetPasswordRequest(normalized);
      if (timedOut) return;
      clearTimeout(timeoutId);
      console.log('[ForgotPassword] reset request succeeded for', normalized);
      setSent(true);
      startCooldown();
      setLoading(false);
    } catch (err) {
      clearTimeout(timeoutId);
      if (timedOut) return;
      console.error('[ForgotPassword] reset request failed:', err?.status || err?.statusCode, err?.message);
      setLoading(false);
      const status = err?.status || err?.statusCode;
      const msg = (err?.message || '').toLowerCase();
      if (status === 429 || msg.includes('rate') || msg.includes('too many') || msg.includes('throttl')) {
        setError(t('auth.r4_error_rate_limited'));
      } else {
        // Show a real error + Retry — no false success. The user needs to know
        // the request failed so they can retry or contact support.
        setError(t('auth.r4_error_reset_failed'));
      }
    }
  };

  const inputClass = 'flex h-[52px] w-full rounded-input border border-border/70 bg-muted/40 px-4 text-base font-normal transition-all placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50';

  return (
    <AuthShell>
      <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-12 pb-8">
        <AuthLogo className="h-10 sm:h-12 mb-6" />

        <AuthCard>
          {/* Heading */}
          <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-1.5 text-balance">
            {t('auth.r4_forgot_title')}
          </h1>
          <p className="text-muted-foreground text-[14px] text-center mb-5 text-balance">
            {t('auth.r4_forgot_subtitle')}
          </p>

          {sent ? (
            <div className="w-full text-center">
              <p className="text-[14px] text-muted-foreground mb-5 text-balance">
                {t('auth.r4_forgot_success')}
              </p>
              <button
                type="button"
                data-testid="auth-forgot-resend"
                onClick={handleSubmit}
                disabled={loading || cooldown > 0}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card hover:shadow-elevated transition-all disabled:opacity-60 mb-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  cooldown > 0 ? t('auth.r4_resend_in', { seconds: cooldown }) : t('auth.r4_resend')
                )}
              </button>
              <Link
                to="/auth"
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button border border-border/70 bg-card text-foreground font-semibold text-base shadow-soft hover:bg-secondary transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.r4_forgot_back')}
              </Link>
            </div>
          ) : (
            <form data-testid="auth-forgot-form" onSubmit={handleSubmit} className="w-full space-y-3" noValidate>
              <div>
                <label htmlFor="forgot-email" className="block text-[13px] font-medium text-foreground mb-1.5">
                  {t('auth.email_label')}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  placeholder={t('auth.email_placeholder')}
                  className={inputClass}
                />
                {error && (
                  <div className="mt-2">
                    <p className="text-[12px] text-destructive">{error}</p>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading || cooldown > 0}
                      className="mt-2 text-[13px] font-semibold text-primary hover:underline transition-all disabled:opacity-50"
                    >
                      {t('auth.r4_resend')}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                data-testid="auth-forgot-submit"
                disabled={loading}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card hover:shadow-elevated transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.r4_forgot_send')}
              </button>
            </form>
          )}

          {/* Back to Sign In link (always visible) */}
          {!sent && (
            <Link
              to="/auth"
              className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.r4_forgot_back')}
            </Link>
          )}
        </AuthCard>

        {/* Legal links — on purple background, white text */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-6 text-[12px] text-white/80">
          <Link to="/terms" className="underline hover:text-white transition-colors">
            {t('auth.terms')}
          </Link>
          <span className="text-white/40" aria-hidden="true">·</span>
          <Link to="/privacy" className="underline hover:text-white transition-colors">
            {t('auth.privacy_policy')}
          </Link>
        </div>

        {/* Build marker */}
        <p
          data-testid="auth-forgot-marker"
          className="text-center text-[10px] text-white/50 mt-4 select-none"
        >
          Nmood Auth Rebuild — R4
        </p>
      </div>
    </AuthShell>
  );
}