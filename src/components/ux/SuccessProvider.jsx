import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { haptic } from '@/lib/haptics';

/**
 * UI-026 — Global success overlay. Call `showSuccess({ title, description,
 * icon })` from anywhere to display an animated check that fades in, holds
 * briefly, and dismisses automatically — making every successful action
 * feel rewarding. Mounted once in App.jsx.
 */
const SuccessContext = createContext(null);

const AUTO_DISMISS = 1900;

function SuccessCheck() {
  return (
    <svg viewBox="0 0 52 52" className="w-16 h-16">
      <motion.circle
        cx="26" cy="26" r="24"
        fill="none" stroke="currentColor" strokeWidth="3"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />
      <motion.path
        fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        d="M14 27 l8 8 l16 -16"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.25, ease: 'easeOut' }}
      />
    </svg>
  );
}

export function SuccessProvider({ children }) {
  const { t } = useLocalization();
  const [state, setState] = useState(null); // { title, description, icon }
  const timerRef = useRef(null);
  const reduce = useReducedMotion();

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState(null);
  }, []);

  const showSuccess = useCallback((opts = {}) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    haptic('success');
    setState({
      title: opts.title || t('ux.success_default'),
      description: opts.description,
      icon: opts.icon,
    });
    timerRef.current = setTimeout(() => setState(null), opts.duration || AUTO_DISMISS);
  }, [t]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <SuccessContext.Provider value={{ showSuccess, dismiss }}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-6 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
            <motion.div
              initial={reduce ? { opacity: 0 } : { scale: 0.85, opacity: 0, y: 10 }}
              animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="relative flex flex-col items-center gap-3 px-8 py-9 rounded-dialog bg-card/95 backdrop-blur-xl border border-border/50 shadow-dialog text-center max-w-xs"
            >
              <div className="text-success">
                {state.icon ? (
                  <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
                    {React.isValidElement(state.icon) ? state.icon : null}
                  </div>
                ) : (
                  <SuccessCheck />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{state.title}</p>
                {state.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{state.description}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SuccessContext.Provider>
  );
}

export function useSuccess() {
  const ctx = useContext(SuccessContext);
  if (!ctx) throw new Error('useSuccess must be used within SuccessProvider');
  return ctx;
}

export default SuccessProvider;