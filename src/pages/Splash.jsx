import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import BrandedSplash from '@/components/brand/BrandedSplash';

// Nmood cold-start splash.
// The native Android 12+ system splash (configured in the Base44 Mobile
// Dashboard) hands off into this branded web splash, which shares the same
// gradient + N mark as the auth-bootstrap loading state (App.jsx) so the
// transition is seamless. The previous artificial 1.5s timed delay was
// removed so this is NOT a second timed splash — it navigates as soon as the
// auth check resolves, letting the branded surface flow continuously into
// Home/Welcome. Auth routing logic is unchanged.
export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!active) return;
        navigate(authed ? '/' : '/welcome', { replace: true });
      } catch (err) {
        if (!active) return;
        navigate('/welcome', { replace: true });
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  return <BrandedSplash />;
}