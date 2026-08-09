import React from 'react';
import { NAV_N_MARK } from '@/lib/brand-assets';
import { useLocalization } from '@/lib/i18n/useLocalization';

// Single source of truth for the Nmood branded splash surface.
// Used both as the app bootstrap loading state (App.jsx) and the /splash
// route (Splash.jsx) so cold start presents ONE continuous branded splash:
// native Android 12+ system splash → auth bootstrap → slogan screen all share
// the same gradient + N mark, with no second timed splash replay.
const SPLASH_BACKGROUND = 'linear-gradient(135deg, #2A0A72 0%, #4B18A8 50%, #6A35FF 100%)';

export default function BrandedSplash({ showSpinner = true }) {
  const { t } = useLocalization();
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-x-clip"
      style={{
        background: SPLASH_BACKGROUND,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* White Nmood N mark — centered directly on the gradient via a CSS
          luminance mask over a transparent PNG (no box/square/border/shadow). */}
      <span
        role="img"
        aria-label="Nmood"
        className="mb-10 text-white"
        style={{
          width: 88,
          height: 88,
          display: 'inline-block',
          backgroundColor: 'currentColor',
          WebkitMask: `url(${NAV_N_MARK}) no-repeat center / contain`,
          mask: `url(${NAV_N_MARK}) no-repeat center / contain`,
          WebkitMaskMode: 'luminance',
          maskMode: 'luminance',
        }}
      />

      <h1 className="font-heading text-[1.65rem] sm:text-5xl font-bold tracking-tight text-balance text-center text-white/95 max-w-xs px-6">
        {t('auth.premium.splash_slogan')}
      </h1>

      {showSpinner && (
        <div className="absolute bottom-14">
          <div className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}