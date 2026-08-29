import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

import { savePendingRegistration } from '@/lib/pending-registration';
import { base44 } from '@/api/base44Client';
import { supabaseAuth } from '@/api/supabaseClient';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { usePageTitle } from '@/lib/usePageTitle';
import { safeReturnTo } from '@/lib/authReturnTo';
import { setPostAuthTarget } from '@/lib/post-auth-resolver';
import {
  categorizeOAuthError,
  getOAuthErrorTranslationKey,
  logOAuthDiagnostics,
} from '@/lib/oauth-diagnostics';
import { readAndClearAuthCallbackResult } from '@/lib/auth-callback-coordinator';
import { clearLoggedOut } from '@/lib/auth-session';
import {
  hasExternalOAuthBridge,
  isEmbeddedWebView,
  launchSocialAuth,
} from '@/lib/social-auth-launcher';

import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthLogo from '@/components/auth/AuthLogo';
import GoogleIcon from '@/components/auth/GoogleIcon';
import AppleIcon from '@/components/auth/AppleIcon';

const useSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL || 'https://nhyrhvwhsxbtidigpeel.supabase.co');

export default function CreateAccount() {
  usePageTitle('Create Account');

  const { t } = useLocalization();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(null);
  const [registered, setRegistered] = useState(false);
  // Base44 social OAuth cannot return a session to a Capacitor WebView unless
  // the native wrapper supplies an external-browser/deep-link bridge. Do not
  // expose a route that ends in an invalid capacitor:// redirect.
  const [hideSocialButtons] = useState(
    () => isEmbeddedWebView() && !hasExternalOAuthBridge()
  );

  const inputClass =
    'flex h-[52px] w-full min-w-0 max-w-full rounded-input border border-border/70 bg-muted/40 px-4 text-base font-normal transition-all placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50';

  // iOS renders <input type="date"> as a replaced native control. Applying
  // Tailwind's `flex` utility to it lets its intrinsic picker width escape the
  // form column, so keep it a normal bounded block-level input.
  const dateInputClass = inputClass.replace('flex ', 'block ') + ' appearance-none';
  const passwordInputClass = `${inputClass} pr-12`;
  const checkboxClass =
    'mt-0.5 w-5 h-5 rounded border-border/70';
  const checkboxStyle = {
    accentColor: 'hsl(var(--primary))',
  };

  const calculateAge = (dob) => {
    const birth = new Date(dob);
    const today = new Date();

    let age =
      today.getFullYear() - birth.getFullYear();

    const monthDifference =
      today.getMonth() - birth.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() < birth.getDate()
      )
    ) {
      age -= 1;
    }

    return age;
  };

  const validate = () => {
    const validationErrors = {};

    if (!form.firstName.trim()) {
      validationErrors.firstName =
        t('auth.error_name_required');
    }

    if (!form.lastName.trim()) {
      validationErrors.lastName =
        t('auth.error_name_required');
    }

    if (!form.email.trim()) {
      validationErrors.email =
        t('auth.error_email_required');
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      validationErrors.email =
        t('auth.error_email_invalid');
    }

    if (!form.dob) {
      validationErrors.dob =
        t('auth.error_dob_required');
    } else if (calculateAge(form.dob) < 18) {
      validationErrors.dob =
        t('auth.error_underage');
    }

    if (!form.password) {
      validationErrors.password =
        t('auth.error_password_required');
    } else if (form.password.length < 8) {
      validationErrors.password =
        t('auth.error_password_too_short');
    }

    if (
      form.confirmPassword !== form.password
    ) {
      validationErrors.confirmPassword =
        t('auth.error_password_mismatch');
    }

    if (!ageConfirmed) {
      validationErrors.ageConfirmed =
        t('auth.error_age_confirmation');
    }

    if (!termsAccepted) {
      validationErrors.termsAccepted =
        t('auth.error_terms_required');
    }

    return validationErrors;
  };

  const update = (field) => (event) => {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: event.target.value,
    }));

    if (errors[field]) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        [field]: undefined,
      }));
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError('');

    const validationErrors = validate();

    setErrors(validationErrors);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      return;
    }

    setLoading('email');

    try {
      setPostAuthTarget(safeReturnTo());

      const email = form.email.trim().toLowerCase();
      await (useSupabase
        ? supabaseAuth.signUp(email, form.password, {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
          })
        : base44.auth.register({ email, password: form.password }));

      savePendingRegistration({
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dob: form.dob,
        ageConfirmed,
        termsAccepted,
      });

      setRegistered(true);
    } catch (err) {
      const message =
        String(err?.message || '').toLowerCase();

      if (
        message.includes('already') ||
        message.includes('exists') ||
        message.includes('registered') ||
        message.includes('duplicate')
      ) {
        setError(t('auth.error_email_taken'));
      } else if (
        message.includes('password') &&
        (
          message.includes('weak') ||
          message.includes('short') ||
          message.includes('require')
        )
      ) {
        setError(
          t('auth.error_password_too_short')
        );
      } else {
        setError(
          t('auth.error_register_failed')
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSocial = (provider) => {
    if (loading) return;
    if (useSupabase) {
      setError('');
      setErrors({});
      clearLoggedOut();
      // Purge any stale diagnostic from a previous failed attempt so it
      // can't be misread as belonging to this fresh one.
      readAndClearAuthCallbackResult();
      setPostAuthTarget(safeReturnTo());
      setLoading(provider);
      launchSocialAuth({
        provider,
        setLoading,
        setError,
        t,
        launch: () => supabaseAuth.signInWithOAuth(provider),
      });
      return;
    }

    setError('');
    setErrors({});
    setLoading(provider);

    // Clear obsolete state left by earlier app builds.
    clearLoggedOut();

    const returnUrl = safeReturnTo();

    // Preserve the in-app destination after OAuth completes.
    setPostAuthTarget(returnUrl);

    // Base44's hosted OAuth flow expects an app-relative return path.
    const socialReturnUrl = '/';

    console.log(
      `[CreateAccount] initiating ${provider} OAuth`,
      {
        returnUrl,
        socialReturnUrl,
      }
    );

    logOAuthDiagnostics(
      provider,
      socialReturnUrl
    );

    try {
      // Base44 performs a full-page redirect.
      // Do not add a timeout around this call.
      base44.auth.loginWithProvider(
        provider,
        socialReturnUrl
      );
    } catch (err) {
      const category =
        categorizeOAuthError(err);

      console.error(
        `[CreateAccount] ${provider} OAuth failed`,
        {
          category,
          status:
            err?.status || err?.statusCode,
          code: err?.code,
          message: err?.message,
        }
      );

      setLoading(null);

      setError(
        t(
          getOAuthErrorTranslationKey(
            category
          )
        )
      );
    }
  };

  const busy = loading !== null;
  const todayString =
    new Date().toISOString().split('T')[0];

  if (registered) {
    return (
      <AuthShell>
        <div className="mx-auto flex w-full max-w-sm flex-col items-center px-5 pt-8 pb-8 sm:pt-12">
          <AuthLogo className="mb-6 h-10 sm:h-12" />

          <AuthCard>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
              <Check className="h-7 w-7" />
            </div>

            <h1 className="mb-2 text-balance text-center font-heading text-[24px] font-bold tracking-tight text-foreground sm:text-[28px]">
              {t('auth.register_success_title')}
            </h1>

            <p className="mb-6 text-balance text-center text-[14px] text-muted-foreground">
              {t('auth.register_success_body')}
            </p>

            <button
              type="button"
              data-testid="auth-continue-to-verification"
              onClick={() =>
                navigate('/verify-email')
              }
              className="mb-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-base font-semibold text-primary-foreground shadow-card transition-all hover:shadow-elevated"
            >
              {t('auth.continue_to_verification')}
            </button>

            <Link
              to="/login"
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button border border-border/70 bg-card text-base font-semibold text-foreground shadow-soft transition-all hover:bg-secondary"
            >
              {t('auth.sign_in_link')}
            </Link>
          </AuthCard>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-sm flex-col items-center px-5 pt-8 pb-8 sm:pt-12">
        <AuthLogo className="mb-6 h-10 sm:h-12" />

        <AuthCard>
          <h1 className="mb-1.5 text-balance text-center font-heading text-[24px] font-bold tracking-tight text-foreground sm:text-[28px]">
            {t('auth.create_account_title')}
          </h1>

          <p className="mb-5 text-balance text-center text-[14px] text-muted-foreground">
            {t('auth.create_account_subtitle')}
          </p>

          <form
            data-testid="auth-register-form"
            onSubmit={handleRegister}
            className="w-full space-y-3"
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1.5 block text-[13px] font-medium text-foreground"
                >
                  {t('auth.first_name_label')}
                </label>

                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={update('firstName')}
                  disabled={busy}
                  className={inputClass}
                />

                {errors.firstName && (
                  <p className="mt-1 text-[12px] text-destructive">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1.5 block text-[13px] font-medium text-foreground"
                >
                  {t('auth.last_name_label')}
                </label>

                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={update('lastName')}
                  disabled={busy}
                  className={inputClass}
                />

                {errors.lastName && (
                  <p className="mt-1 text-[12px] text-destructive">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="mb-1.5 block text-[13px] font-medium text-foreground"
              >
                {t('auth.email_label')}
              </label>

              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={update('email')}
                disabled={busy}
                className={inputClass}
              />

              {errors.email && (
                <p className="mt-1 text-[12px] text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="w-full min-w-0 max-w-full">
              <label
                htmlFor="dob"
                className="mb-1.5 block text-[13px] font-medium text-foreground"
              >
                {t('auth.dob_label')}
              </label>

              <div className="w-full overflow-hidden rounded-input">
                <input
                  id="dob"
                  type="date"
                  autoComplete="bday"
                  value={form.dob}
                  onChange={update('dob')}
                  disabled={busy}
                  max={todayString}
                  className={dateInputClass}
                  // WebKit gives date controls an intrinsic width wider than
                  // their form column. The surrounding control wrapper clips
                  // only that native overpaint, never the label above it.
                  style={{ boxSizing: 'border-box', width: '100%', minWidth: 0, maxWidth: '100%' }}
                />
              </div>

              {errors.dob && (
                <p className="mt-1 text-[12px] text-destructive">
                  {errors.dob}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="mb-1.5 block text-[13px] font-medium text-foreground"
              >
                {t('auth.password_label')}
              </label>

              <div className="relative">
                <input
                  id="reg-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update('password')}
                  disabled={busy}
                  className={passwordInputClass}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  disabled={busy}
                  tabIndex={-1}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-[12px] text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-[13px] font-medium text-foreground"
              >
                {t('auth.confirm_password_label')}
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={update(
                    'confirmPassword'
                  )}
                  disabled={busy}
                  className={passwordInputClass}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  disabled={busy}
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-1 text-[12px] text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="pt-1">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(event) => {
                    setAgeConfirmed(
                      event.target.checked
                    );

                    if (
                      errors.ageConfirmed
                    ) {
                      setErrors(
                        (previousErrors) => ({
                          ...previousErrors,
                          ageConfirmed:
                            undefined,
                        })
                      );
                    }
                  }}
                  disabled={busy}
                  className={checkboxClass}
                  style={checkboxStyle}
                />

                <span className="text-[13px] leading-snug text-muted-foreground">
                  {t('auth.age_confirmation')}
                </span>
              </label>

              {errors.ageConfirmed && (
                <p className="mt-1 ml-7 text-[12px] text-destructive">
                  {errors.ageConfirmed}
                </p>
              )}
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => {
                    setTermsAccepted(
                      event.target.checked
                    );

                    if (
                      errors.termsAccepted
                    ) {
                      setErrors(
                        (previousErrors) => ({
                          ...previousErrors,
                          termsAccepted:
                            undefined,
                        })
                      );
                    }
                  }}
                  disabled={busy}
                  className={checkboxClass}
                  style={checkboxStyle}
                />

                <span className="text-[13px] leading-snug text-muted-foreground">
                  {t(
                    'auth.terms_consent_prefix'
                  )}{' '}

                  <Link
                    to="/terms"
                    className="text-foreground underline transition-colors hover:text-primary"
                  >
                    {t('auth.terms_of_service')}
                  </Link>{' '}

                  {t('auth.and')}{' '}

                  <Link
                    to="/privacy"
                    className="text-foreground underline transition-colors hover:text-primary"
                  >
                    {t('auth.privacy_policy')}
                  </Link>
                </span>
              </label>

              {errors.termsAccepted && (
                <p className="mt-1 ml-7 text-[12px] text-destructive">
                  {errors.termsAccepted}
                </p>
              )}
            </div>

            {error && (
              <p className="px-1 text-[13px] font-medium text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              data-testid="auth-register-submit"
              disabled={busy}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-base font-semibold text-primary-foreground shadow-card transition-all hover:shadow-elevated disabled:opacity-60"
            >
              {loading === 'email' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t('auth.create_account')
              )}
            </button>
          </form>

          {!hideSocialButtons && <>
          <div className="my-5 flex w-full min-w-0 items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />

            <span className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground/70">
              {t('auth.or')}
            </span>

            <div className="h-px flex-1 bg-border/60" />
          </div>

          <button
            type="button"
            data-testid="auth-register-google"
            onClick={() =>
              handleSocial('google')
            }
            disabled={busy}
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-button border border-border/70 bg-card text-[15px] font-semibold text-foreground shadow-soft transition-all hover:bg-secondary disabled:opacity-60"
          >
            {loading === 'google' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <GoogleIcon className="h-5 w-5" />

                {t(
                  'auth.continue_with_google'
                )}
              </>
            )}
          </button>

          <button
            type="button"
            data-testid="auth-register-apple"
            onClick={() =>
              handleSocial('apple')
            }
            disabled={busy}
            className="mt-3 flex h-[52px] w-full items-center justify-center gap-3 rounded-button border border-border/70 bg-card text-[15px] font-semibold text-foreground shadow-soft transition-all hover:bg-secondary disabled:opacity-60"
          >
            {loading === 'apple' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <AppleIcon className="h-5 w-5" />

                {t(
                  'auth.continue_with_apple'
                )}
              </>
            )}
          </button>
          </>}

          <p className="mt-5 text-center text-[13px] text-muted-foreground">
            {t('auth.already_have_account')}{' '}

            <Link
              to="/login"
              className="font-semibold text-primary transition-all hover:underline"
            >
              {t('auth.sign_in_link')}
            </Link>
          </p>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
