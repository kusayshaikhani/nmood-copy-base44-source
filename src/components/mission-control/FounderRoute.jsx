import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { recordMissionControlAccessDenied } from '@/lib/founder-access';
import { useMissionControlAccess } from '@/hooks/useMissionControlAccess';

/**
 * ADM-001 / FM-001: Route guard for Founder Mission Control.
 * Access is decided by the centralized admin-authorization utility (single
 * source of truth): Founder role, Admin role, or the development-only
 * Workspace Owner override.
 * - Unauthenticated → /login
 * - Authenticated but not authorized → record denial + redirect to Home
 * - Authorized → render nested routes
 */
export default function FounderRoute() {
  const { user, isLoadingAuth } = useAuth();
  const { allowed, loading } = useMissionControlAccess();

  useEffect(() => {
    if (!isLoadingAuth && !loading && user && !allowed) {
      recordMissionControlAccessDenied(user);
    }
  }, [isLoadingAuth, loading, allowed, user]);

  if (isLoadingAuth || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}