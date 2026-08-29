import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  consumeAuthCallback,
  finalizeAuthCallback,
  AUTH_CALLBACK_STAGES,
} from '@/lib/auth-callback-coordinator';
import { getOAuthErrorTranslationKey } from '@/lib/oauth-diagnostics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { usePageTitle } from '@/lib/usePageTitle';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthLogo from '@/components/auth/AuthLogo';

// Web (browser, non-Capacitor) landing point for the HTTPS Universal Link
// OAuth callback: https://app.nmood.app/auth/callback. On a real device the
// Universal Link opens the installed app directly and this route is never
// rendered — native-recovery-link.js consumes the same URL via the same
// coordinator instead. This route exists so the identical callback also
// works in a plain browser tab and during local/web testing.
export default function AuthCallback() {
  usePageTitle('Signing in');
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [state, setState] = useState({ status: 'working', stage: null, category: null });

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await consumeAuthCallback(window.location.href);
      finalizeAuthCallback(result);
      if (!active) return;
      if (result.stage === AUTH_CALLBACK_STAGES.SUCCESS || result.stage === AUTH_CALLBACK_STAGES.DUPLICATE) {
        navigate('/auth', { replace: true });
        return;
      }
      setState({ status: 'error', stage: result.stage, category: result.category });
    })();
    return () => { active = false; };
  }, [navigate]);

  if (state.status === 'working') {
    return (
      <AuthShell>
        <div className="flex justify-center pt-24 text-white"><Loader2 className="w-6 h-6 animate-spin" /></div>
      </AuthShell>
    );
  }

  const message = state.category ? t(getOAuthErrorTranslationKey(state.category)) : t('auth.error_oauth_callback_failure');

  return (
    <AuthShell>
      <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-16 pb-8">
        <AuthLogo className="h-10 sm:h-12 mb-6" />
        <AuthCard>
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-5 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="font-heading text-[24px] font-bold text-center mb-2">Sign-in failed</h1>
          <p className="text-muted-foreground text-[13px] text-center mb-1">{message}</p>
          {/* Non-sensitive diagnostic: the failed stage only, never a token/code. */}
          <p className="text-muted-foreground/70 text-[11px] text-center mb-6">Stage: {state.stage}</p>
          <a href="/auth" className="flex h-[52px] w-full items-center justify-center rounded-button bg-nmood-cta text-primary-foreground font-semibold">
            Back to Sign In
          </a>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
