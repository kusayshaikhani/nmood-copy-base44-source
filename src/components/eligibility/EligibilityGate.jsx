import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  isEligible,
  isUnderReview,
  isRestricted,
  isOnboardingComplete,
} from '@/lib/eligibility';
import UnderageScreen from './UnderageScreen';

/**
 * AGE-001 — Central Eligibility Gate (layout route).
 *
 * Sits ABOVE AppShell in the route tree. Only blocks access for under-18
 * (under_review) and admin-restricted members. A signed-in user with a
 * missing DOB (pending/legacy) is allowed directly into Home — no DOB
 * repair prompt. Age validation is performed once at initial sign-up;
 * the EligibilityRequiredScreen is never rendered in normal product flow.
 */
export default function EligibilityGate() {
  const { member, user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // No user (not authenticated) — let ProtectedRoute handle the redirect.
  if (!user) return <Outlet />;

  // No member record — redirect to onboarding so the user can create
  // their profile.
  if (!member) return <Navigate to="/onboarding" replace />;

  // Onboarding not complete — redirect to the onboarding/profile flow.
  // Uses isOnboardingComplete which infers completion for legacy members
  // (undefined flag) from canonical profile data, so existing users who
  // completed onboarding before the flag existed are not forced back.
  if (!isOnboardingComplete(member)) return <Navigate to="/onboarding" replace />;

  // Verified 18+ — full access via AppShell.
  if (isEligible(member)) return <Outlet />;

  // Under-18 or admin-restricted — show the 18+ restriction screen.
  if (isUnderReview(member) || isRestricted(member)) {
    return <UnderageScreen />;
  }

  // Missing DOB (pending/legacy) — allow directly into Home.
  // No DOB repair prompt. Age validation was performed at sign-up.
  return <Outlet />;
}