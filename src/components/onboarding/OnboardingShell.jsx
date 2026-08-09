import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, LogOut } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useAuth } from '@/lib/AuthContext';
import { signOutFromGate, useGateBackToLogin } from '@/lib/gate-escape';

// UI-024 — Premium onboarding shell with animated progress indicator.
// Props unchanged; step logic preserved.
export default function OnboardingShell({ step, totalSteps, title, subtitle, onBack, children, hideHeader = false }) {
  const { t } = useLocalization();
  const { logout } = useAuth();
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSignOut = () => {
    signOutFromGate(logout);
  };

  // Android hardware back escapes onboarding to login instead of trapping.
  useGateBackToLogin(handleSignOut);

  return (
    <div
      className="relative min-h-dvh flex flex-col bg-gradient-to-b from-background via-background to-primary/5 min-w-0"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        minHeight: '100dvh',
        height: 'auto',
        overflowY: 'visible',
        overflowX: 'clip',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-20 end-0 w-72 h-72 rounded-full bg-primary/10 blur-[90px]" />

      {!hideHeader && (
        <>
          {/* progress track */}
          <div className="relative h-1.5 bg-muted flex-shrink-0">
            <motion.div
              className="h-full bg-nmood-gradient rounded-e-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="flex items-center justify-between px-4 h-14 flex-shrink-0">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={onBack}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-default -ms-1 px-1"
                >
                  <ChevronLeft className="w-5 h-5" />{t('common.back')}
                </motion.button>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground/70 hover:text-foreground transition-default px-1"
              >
                <LogOut className="w-4 h-4" />{t('eligibility.required.sign_out')}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={{
                    width: i === step ? 22 : 6,
                    opacity: i === step ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.25 }}
                  className={`h-1.5 rounded-full ${i === step ? 'bg-primary' : 'bg-muted-foreground'}`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Content — NO nested scroll container. The html/body scrolls naturally.
          flex-1 fills the viewport when content is short; when tall, the
          container grows and the document scrolls. */}
      <div className="relative flex-1 px-4 sm:px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] max-w-lg w-full mx-auto">
        {!hideHeader && (title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 pt-2"
          >
            {title && <h1 className="font-heading text-[1.7rem] font-bold tracking-tight text-balance">{title}</h1>}
            {subtitle && <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">{subtitle}</p>}
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}