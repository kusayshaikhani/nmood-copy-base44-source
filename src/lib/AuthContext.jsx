import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import { base44 } from '@/api/base44Client';
import { supabaseAuth, restoreSupabaseSessionFromUrl } from '@/api/supabaseClient';
import { appParams } from '@/lib/app-params';
import { queryClientInstance } from '@/lib/query-client';
import {
  trackProductEvent,
  PRODUCT_EVENTS,
} from '@/lib/product-analytics';
import { clearLoggedOut } from '@/lib/auth-session';
import { stripQuery, bustPhotoUrl } from '@/lib/photo-cache';
import {
  setAnalyticsConsent,
  setAiPersonalization,
} from '@/lib/consent-store';
import { safeAdminRedirect } from '@/lib/safe-redirect';
import { getOwnMember } from '@/lib/member-profile';
import {
  getAndClearPostAuthTarget,
  resolvePostAuthDestination,
} from '@/lib/post-auth-resolver';
import { updateMemberProfile } from '@/lib/member-update';
import {
  getPendingRegistration,
  clearPendingRegistration,
} from '@/lib/pending-registration';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const useSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL);

const AuthContext = createContext(null);

// A Capacitor build must not hand logout to the hosted Base44 page: that
// leaves the app for Safari and exposes the browser's back-navigation chrome.
// The native shell keeps the session token in its own WebView storage, so
// clearing that token and returning to a public route ends the in-app session.
function isPasswordRecoveryRoute() {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.replace(/\/+$/, '') === '/reset-password';
}

function isNativeCapacitorShell() {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(
      window.Capacitor?.isNativePlatform?.() ||
      ['ios', 'android'].includes(window.Capacitor?.getPlatform?.())
    );
  } catch {
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] =
    useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  // Tracks when the current session began so forced logouts can be detected.
  const sessionStartRef = useRef(Date.now());

  /**
   * Check the current authentication session directly with Base44.
   *
   * Do not rely on appParams.token here because appParams is evaluated only
   * once when its module loads and may not reflect a fresh OAuth callback.
   */
  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      if (useSupabase) restoreSupabaseSessionFromUrl();
      const currentUser = useSupabase
        ? await supabaseAuth.getUser()
        : await base44.auth.me();

      if (!currentUser) {
        throw new Error('No authenticated user returned');
      }

      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthChecked(true);

      // Backfill canonical profile ownership for profiles created by older
      // service-role onboarding flows. It is safe and idempotent.
      if (!useSupabase) {
        await base44.functions.invoke('authorizationGate', {
          action: 'ensureMemberOwnership',
        }).catch(() => {});
      }

      sessionStartRef.current = Date.now();

      // Remove obsolete logout markers left by earlier app builds.
      clearLoggedOut();

      try {
        trackProductEvent(PRODUCT_EVENTS.LOGIN);
      } catch {
        // Analytics must never interrupt authentication.
      }

      // Admin portal redirect.
      const adminTarget =
        window.sessionStorage.getItem('admin_target');

      if (
        adminTarget &&
        currentUser.role === 'admin'
      ) {
        window.sessionStorage.removeItem(
          'admin_target'
        );

        window.location.href =
          safeAdminRedirect(adminTarget);

        return currentUser;
      }

      let myMember = null;

      try {
        myMember = await getOwnMember(
          currentUser.id,
          currentUser.email
        );

        if (myMember) {
          // A new Supabase account is verified through an emailed link. The
          // initial registration details stay only in local pending state
          // until that verified session returns, then are written once to the
          // canonical profile (DOB stays in member_private on the server).
          if (useSupabase && !myMember.onboarding_completed) {
            const pending = getPendingRegistration();
            if (pending?.email?.toLowerCase() === currentUser.email?.toLowerCase()) {
              const displayName = [pending.firstName, pending.lastName]
                .filter(Boolean)
                .join(' ')
                .trim();
              try {
                myMember = await updateMemberProfile({
                  ...(displayName ? { display_name: displayName } : {}),
                  ...(pending.dob ? { date_of_birth: pending.dob } : {}),
                });
                clearPendingRegistration();
              } catch (profileError) {
                console.warn('[AuthContext] could not save initial onboarding details:', profileError);
              }
            }
          }
          setMember(myMember);

          setAnalyticsConsent(
            Boolean(myMember.analytics_consent)
          );

          setAiPersonalization(
            myMember.personalized_recommendations !== false
          );

          // Clear a stale forced-logout value from an earlier session.
          if (myMember.force_logout_at) {
            updateMemberProfile({
              force_logout_at: null,
            }).catch(() => {});
          }
        } else {
          setMember(null);
        }
      } catch {
        // A new OAuth user may not have a Member record yet.
        setMember(null);
      }

      /**
       * Resolve the stored destination after Google or Apple redirects back.
       * The target is one-time and removed when it is read.
       */
      const postAuthTarget =
        getAndClearPostAuthTarget();

      if (postAuthTarget) {
        const destination =
          resolvePostAuthDestination(
            currentUser,
            myMember,
            postAuthTarget
          );

        console.log(
          '[AuthContext] OAuth callback — routing to',
          destination,
          'onboarding_complete=',
          Boolean(myMember?.onboarding_completed)
        );

        const currentPath =
          window.location.pathname +
          window.location.search +
          window.location.hash;

        if (destination !== currentPath) {
          window.location.replace(destination);
          return currentUser;
        }
      } else {
        console.log(
          '[AuthContext] session restored for',
          currentUser.email,
          '— no post-auth target'
        );
      }

      return currentUser;
    } catch (error) {
      console.error(
        '[AuthContext] user authentication check failed:',
        error?.status || error?.statusCode,
        error?.message
      );

      setUser(null);
      setMember(null);
      setIsAuthenticated(false);
      setAuthChecked(true);

      const status =
        error?.status || error?.statusCode;

      if (status === 401 || status === 403) {
        // The Base44 SDK captures its access token when the module loads. If
        // that saved token has expired, merely showing the sign-in screen is
        // not enough: every later function call still reuses it. Remove the
        // stale token and reload once so the SDK starts cleanly.
        try {
          const recoveryKey = 'nmood:stale_auth_recovered';
          const alreadyReloaded = window.sessionStorage.getItem(recoveryKey) === '1';
          window.localStorage.removeItem('base44_access_token');
          window.localStorage.removeItem('token');
          if (!alreadyReloaded) {
            window.sessionStorage.setItem(recoveryKey, '1');
            window.location.replace(window.location.pathname);
            return null;
          }
          window.sessionStorage.removeItem(recoveryKey);
        } catch {
          // Storage can be unavailable in private/native contexts. The
          // normal unauthenticated state below remains a safe fallback.
        }
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required',
        });
      } else {
        setAuthError({
          type: 'auth_required',
          message:
            error?.message ||
            'Authentication required',
        });
      }

      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  /**
   * Load public app settings, then ask Base44 directly whether a valid
   * authentication session exists.
   */
  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);

    try {
      if (useSupabase) {
        setAppPublicSettings(null);
        // Password recovery owns the one-time session from the emailed link.
        // Do not let the global sign-in check consume or redirect it.
        if (isPasswordRecoveryRoute()) {
          setAuthChecked(true);
          setIsLoadingAuth(false);
          return;
        }
        await checkUserAuth();
        return;
      }
      const appClient = createAxiosClient({
        // Relative URLs only work on the hosted site or through Vite's dev
        // proxy. Capacitor runs from capacitor://localhost.
        baseURL: `${appParams.apiServerUrl}/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId,
        },
        token: appParams.token || undefined,
        interceptResponses: true,
      });

      try {
        const publicSettings =
          await appClient.get(
            `/prod/public-settings/by-id/${appParams.appId}`
          );

        setAppPublicSettings(publicSettings);
      } catch (appError) {
        console.error(
          '[AuthContext] public app settings check failed:',
          appError
        );

        if (
          appError?.status === 403 &&
          appError?.data?.extra_data?.reason
        ) {
          const reason =
            appError.data.extra_data.reason;

          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required',
            });
          } else if (
            reason === 'user_not_registered'
          ) {
            setAuthError({
              type: 'user_not_registered',
              message:
                'User not registered for this app',
            });
          } else {
            setAuthError({
              type: reason,
              message:
                appError?.message ||
                'Failed to load application settings',
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message:
              appError?.message ||
              'Failed to load application settings',
          });
        }
      }

      // Always verify the live Base44 session.
      await checkUserAuth();
    } catch (error) {
      console.error(
        '[AuthContext] unexpected app-state error:',
        error
      );

      setUser(null);
      setMember(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);

      setAuthError({
        type: 'unknown',
        message:
          error?.message ||
          'An unexpected authentication error occurred',
      });
    } finally {
      setIsLoadingPublicSettings(false);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  /**
   * Immediately apply a freshly updated Member entity, or fetch the
   * authenticated user's Member record when no entity is supplied.
   */
  const refreshMember = useCallback(
    async (updatedMember) => {
      if (updatedMember) {
        setMember((previousMember) => {
          const photoChanged =
            stripQuery(updatedMember.photo_url) !==
            stripQuery(previousMember?.photo_url);

          if (
            photoChanged &&
            updatedMember.photo_url
          ) {
            return {
              ...updatedMember,
              photo_url: bustPhotoUrl(
                updatedMember.photo_url
              ),
            };
          }

          return updatedMember;
        });

        return;
      }

      if (!user) return;

      try {
        const currentMember =
          await getOwnMember(
            user.id,
            user.email
          );

        if (currentMember) {
          setMember(currentMember);
        }
      } catch {
        // Member may not exist until onboarding is complete.
      }
    },
    [user]
  );

  /**
   * Log out through Base44's own server-session flow.
   *
   * Do not create a persistent logout marker or manually reject the next
   * OAuth token. Those mechanisms can cause a fresh Google login to be
   * treated as cancelled after logout.
   */
  const logout = useCallback(
    (shouldRedirect = true) => {
      try {
        trackProductEvent(
          PRODUCT_EVENTS.LOGOUT
        );
      } catch {
        // Analytics must never block logout.
      }

      setUser(null);
      setMember(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(false);
      setAuthError(null);

      try {
        queryClientInstance.clear();
      } catch {
        // Cache clearing must never block logout.
      }

      try {
        // Clear temporary OAuth and redirect state.
        window.localStorage.removeItem(
          'nmood:post_auth_target'
        );

        // Remove obsolete markers created by older builds.
        window.localStorage.removeItem(
          'nmood:session_terminated'
        );

        window.sessionStorage.removeItem(
          'admin_target'
        );

        window.sessionStorage.removeItem(
          'nmood:logged_out'
        );
      } catch {
        // Storage may be unavailable.
      }

      const targetPath = shouldRedirect
        ? '/auth'
        : '/admin/login';

      console.log(
        '[AuthContext] logging out to',
        targetPath
      );

      // In Capacitor, keep logout inside the native shell. Redirecting through
      // Base44's hosted endpoint opens Safari and leaves an iOS back-to-Safari
      // affordance over the app. The SDK session is token-backed in this shell,
      // and the token/cache have already been removed above.
      if (useSupabase || isNativeCapacitorShell()) {
        if (useSupabase) supabaseAuth.signOut();
        window.location.replace(targetPath);
        return;
      }

      // Web browsers still use Base44's hosted logout endpoint to clear its
      // HTTP-only cookie before returning to the selected public route.
      base44.auth.logout(targetPath);
    },
    []
  );

  const navigateToLogin = useCallback(() => {
    if (useSupabase) {
      window.location.assign('/auth');
      return;
    }
    base44.auth.redirectToLogin(
      window.location.href
    );
  }, []);

  /**
   * Handle browser back/forward-cache restores.
   *
   * Verify the live Base44 session instead of trusting a local token,
   * because a valid session may be cookie-backed.
   */
  useEffect(() => {
    const onPageShow = async (event) => {
      if (!event.persisted) return;

      const restoredUser =
        await checkUserAuth();

      if (!restoredUser) {
        window.location.replace('/auth');
      }
    };

    window.addEventListener(
      'pageshow',
      onPageShow
    );

    return () => {
      window.removeEventListener(
        'pageshow',
        onPageShow
      );
    };
  }, [checkUserAuth]);

  /**
   * Poll for administrator-triggered forced logout.
   */
  useEffect(() => {
    if (
      !isAuthenticated ||
      !user?.id
    ) {
      return undefined;
    }

    const checkForceLogout = async () => {
      try {
        const currentMember =
          await getOwnMember(
            user.id,
            user.email
          );

        if (
          !currentMember?.force_logout_at
        ) {
          return;
        }

        const forceLogoutTime =
          new Date(
            currentMember.force_logout_at
          ).getTime();

        if (
          Number.isFinite(forceLogoutTime) &&
          forceLogoutTime >
            sessionStartRef.current
        ) {
          logout();
        }
      } catch {
        // Ignore temporary polling errors.
      }
    };

    const intervalId =
      window.setInterval(
        checkForceLogout,
        30000
      );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    isAuthenticated,
    user?.id,
    user?.email,
    logout,
  ]);

  return (
    <AuthContext.Provider
      value={{
        user,
        member,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        refreshMember,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};
