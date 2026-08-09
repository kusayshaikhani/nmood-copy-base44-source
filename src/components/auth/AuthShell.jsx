import React from 'react';

// Unified authentication shell — the official Nmood purple gradient as the
// full-page background. Shared by every auth screen (SignIn, CreateAccount,
// EmailVerification, ForgotPassword, ResetPassword). The white form card
// sits on top of this gradient.
//
// CRITICAL: No position:fixed, no inset:0, no overflow-y:auto — those create
// a nested scroll container that traps touch events on Android WebView and
// prevents the page from scrolling. Instead, the container grows with content
// (min-height:100dvh, height:auto) and the <html> element (the single document
// scroll container) handles scrolling. overflow-x:clip (not hidden) avoids the
// CSS spec quirk where overflow-x:hidden forces overflow-y:auto.
const AUTH_BACKGROUND = 'linear-gradient(135deg, #24105F 0%, #4B18A8 50%, #7138FF 100%)';

export default function AuthShell({ children }) {
  return (
    <div
      data-testid="auth-scroll-container"
      style={{
        width: '100%',
        minHeight: '100vh',
        minHeight: '100dvh',
        overflowX: 'clip',
        overflowY: 'visible',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
        background: AUTH_BACKGROUND,
      }}
    >
      <div style={{ width: '100%' }} className="relative">
        {children}
      </div>
    </div>
  );
}