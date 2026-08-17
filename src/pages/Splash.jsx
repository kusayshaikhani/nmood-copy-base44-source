import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import BrandedSplash from '@/components/brand/BrandedSplash';

// Nmood cold-start splash. Wait for the app's active authentication provider
// (Supabase in the independent deployment) before routing. This must not call
// the retired Base44 SDK directly, because that request can remain pending.
export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) return;
    navigate(isAuthenticated ? '/' : '/welcome', { replace: true });
  }, [isAuthenticated, isLoadingAuth, navigate]);

  return <BrandedSplash />;
}
