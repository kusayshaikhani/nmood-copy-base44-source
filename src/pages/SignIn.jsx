import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { supabaseAuth } from '@/api/supabaseClient';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { usePageTitle } from '@/lib/usePageTitle';
import { safeReturnTo } from '@/lib/authReturnTo';
import { setPostAuthTarget, resolvePostAuthDestination } from '@/lib/post-auth-resolver';
import { localizeAuthError } from '@/lib/auth-errors';
import { getSocialReturnUrl } from '@/lib/social-auth-return';
import { logOAuthDiagnostics, getOAuthErrorTranslationKey, categorizeNativeSocialAuthError } from '@/lib/oauth-diagnostics';
import { readAndClearAuthCallbackResult } from '@/lib/auth-callback-coordinator';
import { clearLoggedOut } from '@/lib/auth-session';
import { launchSocialAuth, isEmbeddedWebView, hasExternalOAuthBridge } from '@/lib/social-auth-launcher';
import { isNativeSocialAuthAvailable, signInWithNativeApple, signInWithNativeGoogle } from '@/lib/native-social-auth';
import { useAuth } from '@/lib/AuthContext';
import { getOwnMember } from '@/lib/member-profile';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthLogo from '@/components/auth/AuthLogo';
import GoogleIcon from '@/components/auth/GoogleIcon';
import AppleIcon from '@/components/auth/AppleIcon';

const useSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL || 'https://nhyrhvwhsxbtidigpeel.supabase.co');

// Nmood Android Auth Rebuild — R2
// Single regular-user Sign In page. Email/password + Google + Apple.
// Uses the real Base44 authentication service — no fake auth.
export default function SignIn() {
  usePageTitle('Sign In');
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(null); // 'email' | 'google' | 'apple' | null
  const [error, setError] = useState('');
 

  

  // OAuth cleanup ref — holds the launcher's cleanup function so React unmount
  // removes visibility listeners / timers from the hardened social launcher.
  const socialCleanupRef = useRef(null);
  useEffect(() => {
    // Reads the coordinator's actual per-attempt diagnostic (stage + error
    // category) — never a bare "timed out" boolean flag — because a native
    // cold launch can finish processing the callback before this component
    // mounts (main.jsx awaits the native link handler before rendering).
    const showCallbackError = () => {
      if (window.location.pathname.includes('/reset-password') || window.location.hash.includes('type=recovery')) {
        return;
      }
      const result = readAndClearAuthCallbackResult();
      if (!result) return;
      const message = result.category ? t(getOAuthErrorTranslationKey(result.category)) : t('auth.error_oauth_callback_failure');
      setError(`${message} (${result.stage})`);
    };
    showCallbackError();
    window.addEventListener('nmood:auth-callback-error', showCallbackError);
    return () => {
      window.removeEventListener('nmood:auth-callback-error', showCallbackError);
      if (socialCleanupRef.current) socialCleanupRef.current();
    };
  }, []);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent duplicate submissions
    setError('');
    setLoading('email');
    // Clear stale logout flag so the fresh token is not purged.
    clearLoggedOut();

    // 10s network-timeout fallback — if the SDK never responds, stop the
    // spinner and show a retry-able error so the user is never stuck.
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setLoading(null);
      setError(t('auth.error_login_timeout'));
    }, 10000);

    try {
      console.log('[SignIn] email login attempt for', email.trim());
      // 1. Authenticate via the official Base44 SDK. The token is automatically
      //    stored on the client for subsequent requests — no manual token
      //    handling, no mock login, no duplicate auth flow.
      const result = useSupabase
        ? await supabaseAuth.signInWithPassword(email.trim(), password)
        : await base44.auth.loginViaEmailPassword(email.trim(), password);
      clearTimeout(timeoutId);
      if (timedOut) return; // timeout already fired — don't continue
      console.log('[SignIn] email login succeeded');

      // 2. Read the authenticated user (the SDK returns it, but fall back to
      //    me() for older SDK versions).
      const authUser = result?.user || (useSupabase
        ? await supabaseAuth.getUser()
        : await base44.auth.me());

      // 3. Finish restoring the authenticated session before resolving the
      //    member record. Routing first could race the token restoration and
      //    incorrectly send existing members to onboarding.
      await checkUserAuth();

      let member = null;
      try {
        member = await getOwnMember(authUser.id, authUser.email);
      } catch (memberError) {
        console.warn('[SignIn] member lookup failed after session restore:', memberError);
      }

      const destination = resolvePostAuthDestination(
        authUser,
        member,
        safeReturnTo()
      );
      console.log('[SignIn] routing to', destination, 'onboarding_complete=', !!member?.onboarding_completed);

      // 4. Navigate via the SPA router — works in Android WebView, iOS
      //    WebView, and normal browsers without a hard page reload.
      navigate(destination, { replace: true });
    } catch (err) {
      clearTimeout(timeoutId);
      if (timedOut) return; // timeout already fired — don't overwrite its error
      console.error('[SignIn] email login failed:', err?.status || err?.statusCode, err?.message);
      setError(localizeAuthError(err, t, 'auth.error_invalid_email_password'));
    } finally {
      clearTimeout(timeoutId);
      setLoading(null);
    }
  };

  const handleSocial = (provider) => {
    if (loading) return;
    setError('');
    clearLoggedOut();
    // Purge any stale diagnostic from a previous failed attempt so it
    // can't be misread as belonging to this fresh one.
    readAndClearAuthCallbackResult();

    // Native Sign in with Apple / Google — identity-token flow, no browser,
    // no PKCE, no nmood:// callback. This is the only path used on iOS/Android.
    if (isNativeSocialAuthAvailable()) {
      setLoading(provider);
      (async () => {
        try {
          const session = provider === 'apple'
            ? await signInWithNativeApple()
            : await signInWithNativeGoogle();
          await checkUserAuth();
          const authUser = session?.user || await supabaseAuth.getUser();
          let member = null;
          try {
            member = await getOwnMember(authUser.id, authUser.email);
          } catch (memberError) {
            console.warn('[SignIn] member lookup failed after native social sign-in:', memberError);
          }
          const destination = resolvePostAuthDestination(authUser, member, safeReturnTo());
          navigate(destination, { replace: true });
        } catch (err) {
          const category = categorizeNativeSocialAuthError(err);
          // A genuine cancel is not an error — the user just backed out.
          if (category !== 'user_cancelled') {
            setError(t(getOAuthErrorTranslationKey(category)));
          }
        } finally {
          setLoading(null);
        }
      })();
      return;
    }

    if (useSupabase) {
      setPostAuthTarget(safeReturnTo());
      setLoading(provider);
      socialCleanupRef.current = launchSocialAuth({
        provider,
        setLoading,
        setError,
        t,
        launch: () => supabaseAuth.signInWithOAuth(provider),
      });
      return;
    }
    if (loading) return; // duplicate-click prevention — single call only
    setError('');
    // Clean up any previous launch (defensive — the guard above prevents it).
    if (socialCleanupRef.current) {
      socialCleanupRef.current();
      socialCleanupRef.current = null;
    }
    setLoading(provider);
    // Clear stale logout flag + previous OAuth state so the fresh token from
    // this attempt is not purged on the callback redirect.
    clearLoggedOut();
    const returnUrl = safeReturnTo();
    setPostAuthTarget(returnUrl);
    const socialReturnUrl = getSocialReturnUrl();
    console.log(`[SignIn] initiating ${provider} OAuth, returnTo=${returnUrl}, socialReturnUrl=${socialReturnUrl}`);
    logOAuthDiagnostics(provider, socialReturnUrl);
    // Hardened launch — bounded timeout, embedded-WebView fail-fast, and
    // guaranteed loading-state cleanup on every error/cancel/return path.
    socialCleanupRef.current = launchSocialAuth({
      provider,
      setLoading,
      setError,
      t,
      launch: () => base44.auth.loginWithProvider(provider, socialReturnUrl),
    });
  };

  const busy = loading !== null;
  // Hide Google/Apple buttons entirely in embedded WebViews with no external
  // OAuth bridge — the buttons can't work and showing them is confusing.
  const [hideSocialButtons] = useState(
    () => isEmbeddedWebView() && !hasExternalOAuthBridge()
  );

  const inputClass = 'flex h-[52px] w-full rounded-input border border-border/70 bg-muted/40 px-4 text-base font-normal transition-all placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50';
  const passwordInputClass = inputClass + ' pr-12';

  return (
    <AuthShell>
      <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-12 pb-8">
        <AuthLogo className="h-10 sm:h-12 mb-6" />

        <AuthCard>
          {/* Heading */}
          <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-1.5 text-balance">
            {t('auth.welcome_title')}
          </h1>
          <p className="text-muted-foreground text-[14px] text-center mb-5 text-balance">
            {t('auth.welcome_subtitle')}
          </p>

          {/* Email / Password form */}
          <form data-testid="auth-login-form" onSubmit={handleEmailSignIn} className="w-full space-y-3" noValidate>
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-foreground mb-1.5">
                {t('auth.email_label')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email_placeholder')}
                disabled={busy}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-foreground mb-1.5">
                {t('auth.password_label')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  required
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={busy}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 rounded-lg disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[13px] text-destructive font-medium px-1">{error}</p>
            )}

            {/* Purple gradient Sign In button */}
            <button
              type="submit"
              disabled={busy}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card hover:shadow-elevated transition-all disabled:opacity-60"
            >
              {loading === 'email' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('auth.sign_in')
              )}
            </button>

            {/* Forgot password — R4 */}
            <div className="text-center pt-1">
              <Link to="/forgot-password" className="text-[13px] text-primary hover:underline transition-all font-medium">
                {t('auth.forgot_link')}
              </Link>
            </div>
          </form>

          {hideSocialButtons ? (
            <p className="text-[13px] text-muted-foreground text-center px-2 mt-4 mb-1 leading-relaxed">
              {t('auth.social_unavailable_in_app')}
            </p>
          ) : (
            <>
              {/* OR divider */}
              <div className="flex items-center gap-3 w-full my-5">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  {t('auth.or')}
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                data-testid="auth-google-button"
                onClick={() => handleSocial('google')}
                disabled={busy}
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-button border border-border/70 bg-card text-foreground font-semibold text-[15px] shadow-soft hover:bg-secondary transition-all disabled:opacity-60"
              >
                {loading === 'google' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <GoogleIcon className="w-5 h-5" />
                    {t('auth.continue_with_google')}
                  </>
                )}
              </button>

              {/* Continue with Apple */}
              <button
                type="button"
                data-testid="auth-apple-button"
                onClick={() => handleSocial('apple')}
                disabled={busy}
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-button border border-border/70 bg-card text-foreground font-semibold text-[15px] shadow-soft hover:bg-secondary transition-all disabled:opacity-60 mt-3"
              >
                {loading === 'apple' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <AppleIcon className="w-5 h-5" />
                    {t('auth.continue_with_apple')}
                  </>
                )}
              </button>
            </>
          )}

          {/* Create account */}
          <p className="text-center text-[13px] text-muted-foreground mt-5">
            {t('auth.no_account_prompt')}{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline transition-all">
              {t('auth.create_one')}
            </Link>
          </p>
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
          <span className="text-white/40" aria-hidden="true">·</span>
          <Link to="/legal" className="underline hover:text-white transition-colors">
            Legal &amp; Support Center
          </Link>
        </div>

        {/* Build marker — always visible, never hidden in native builds */}
        <p
          data-testid="auth-build-marker"
          className="text-center text-[10px] text-white/50 mt-4 select-none"
        >
        </p>
      </div>
    </AuthShell>
  );
}
